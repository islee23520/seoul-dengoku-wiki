import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { decodePng } from "../../portrait/acceptance/src/png.ts";
import { verifyFinishingPixels } from "./comfyui-finishing.ts";
import {
	NATIVE_MOSS_PROFILE_DIGEST,
	type NativeMossRecipe,
	nativeMossProfile,
	nativeMossRecipes,
} from "./native-moss-contract.ts";
import type { NativeProcessTerminal } from "./native-moss-transport.ts";
import { evaluateDeliveryAlpha } from "./png.ts";
import { transformReferencePng } from "./reference-transform.ts";

const sha = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const NATIVE_MOSS_RESULT_BUNDLE =
	"8f52f75bb4fe62ffceb0cadacbeed34c6175bebf8ade9644d1337a3ab94f8218";
const lifecyclePin =
	"fcb752c5b9bb0285a98f5699ecf0eadc9ad06d0253366986fbf99da3567228b8";
const helperPin =
	"0b0ee4ab58a6b8a5c51b826b3add2a97c350cdccfbdab1b6e1e9cf51f74d6c34";
const crop = [6, 1, 346, 511];
const artifactNames = [
	"config.json",
	"preflight.json",
	"status.json",
	"execution.json",
	"alpha-graph.json",
	"alpha-history.json",
	"alpha-submitted.json",
	"output/raw.png",
	"output/crop-RGB.png",
	"output/alpha352.png",
	"output/mask352.png",
	"output/rawmask352.png",
	"output/final-RGBA.png",
] as const;
export type NativeMossResultArtifact = {
	name: (typeof artifactNames)[number];
	bytes: Uint8Array;
};
export type NativeMossResultExpected = {
	requestId: string;
	nonce: string;
	ownerBindingHash: string;
	envelopeSHA256: string;
	mode: "token-only" | "reference-img2img";
	recipe: NativeMossRecipe;
	personId: string;
	characterId: string;
	name: string;
	snapshotHashes: { detail: string; token: string; original?: string };
	promptSHA256: string;
	contentFieldsSHA256: string;
	sourcePins: Record<string, string>;
	ownerProcess: { pid: number; start: string };
	// Server-retained observations, never copied from the worker readback.
	attestation: {
		compiled: { text: string; fields: unknown[] };
		workerPins: {
			runtime: { sha256: string; size: number };
			lifecycle: { sha256: string; size: number };
		};
		contextInput: Record<string, unknown>;
		contextInputBytes: Uint8Array;
		contextResponseBytes: Uint8Array;
	};
	nativeProcessTerminal: NativeProcessTerminal;
};
export class NativeMossAttestationError extends Error {
	readonly state = "NOT_READY";
	readonly adoptionAllowed = false;
	constructor(readonly code: string) {
		super(code);
	}
}
const attested = (condition: unknown, code: string) => {
	if (!condition) throw new NativeMossAttestationError(code);
};
const attestationEqual = (a: unknown, b: unknown, code: string) =>
	attested(isDeepStrictEqual(a, b), code);
const tokenizerPins = {
	"tokenizer.json":
		"06b9509352d2af50381ab2247e083b80d32d5c0aba91c272ca9ff729b6a0e523",
	"tokenizer_config.json":
		"bee8eba30f0eb4af73c0fe2cd06d0f89b657d7819941c438157ec42f7c80ea87",
	"chat_template.jinja":
		"a4aee8afcf2e0711942cf848899be66016f8d14a889ff9ede07bca099c28f715",
};
const object = (value: unknown) =>
	z.record(z.string(), z.unknown()).parse(value);
const equal = (a: unknown, b: unknown) => {
	if (!isDeepStrictEqual(a, b)) throw Error("NATIVE_RESULT_MISMATCH");
};
const required = (value: unknown) => {
	if (!value) throw Error("NATIVE_RESULT_MISMATCH");
};
const field = (value: Record<string, unknown>, key: string) => value[key];

// Pure server-readback verifier. Hashes bind evidence, not a browser assertion or
// artwork approval. The caller owns authenticated acquisition and remote proof.
export function verifyNativeMossResult(
	expected: NativeMossResultExpected,
	artifacts: readonly NativeMossResultArtifact[],
) {
	z.uuid().parse(expected.requestId);
	z.uuid().parse(expected.nonce);
	z.strictObject({
		pid: z.number().int().positive().safe(),
		start: z.string().trim().min(1),
	}).parse(expected.ownerProcess);
	for (const value of [
		expected.ownerBindingHash,
		expected.envelopeSHA256,
		expected.promptSHA256,
		expected.contentFieldsSHA256,
		...Object.values(expected.snapshotHashes),
		...Object.values(expected.sourcePins),
	])
		hash.parse(value);
	equal(nativeMossRecipes[expected.recipe]?.inputMode, expected.mode);
	required(
		/^person-\d+$/.test(expected.personId) &&
			/^K\d+$/.test(expected.characterId) &&
			expected.name.trim(),
	);
	required(artifacts.length === artifactNames.length);
	const files = new Map<string, Uint8Array>();
	for (const artifact of artifacts) {
		required(
			artifactNames.includes(artifact.name) &&
				!files.has(artifact.name) &&
				artifact.bytes.length > 0 &&
				artifact.bytes.length <= 32 * 1024 * 1024,
		);
		files.set(artifact.name, artifact.bytes);
	}
	const bytes = (name: string) => {
		const value = files.get(name);
		if (!value) throw Error("NATIVE_RESULT_ARTIFACT_MISSING");
		return value;
	};
	const json = (name: string) =>
		object(
			JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes(name))),
		);
	const config = json("config.json"),
		phase = json("status.json"),
		execution = json("execution.json");
	equal(sha(bytes("config.json")), expected.envelopeSHA256);
	const binding = {
		requestId: expected.requestId,
		nonce: expected.nonce,
		ownerBindingHash: expected.ownerBindingHash,
		envelopeSHA256: expected.envelopeSHA256,
		profileDigest: NATIVE_MOSS_PROFILE_DIGEST,
		bundleSHA256: NATIVE_MOSS_RESULT_BUNDLE,
	};
	for (const receipt of [phase, execution])
		for (const [key, value] of Object.entries(binding))
			equal(receipt[key], value);
	equal(field(config, "requestId"), expected.requestId);
	equal(field(config, "nonce"), expected.nonce);
	equal(field(config, "ownerBindingHash"), expected.ownerBindingHash);
	equal(field(config, "profileDigest"), NATIVE_MOSS_PROFILE_DIGEST);
	equal(field(config, "schema"), "native-moss-job.v1");
	equal(field(config, "mode"), expected.mode);
	equal(field(config, "recipe"), expected.recipe);
	equal(field(config, "explicitEdits"), []);
	equal(field(config, "settings"), {
		generationProfile: "native340-v1",
		size: "340x510",
		n: 1,
		seed: nativeMossProfile.seed,
		steps: 25,
		cfg: 2.5,
		preserveOnly: true,
		ownerApproved: false,
		qualityQualified: false,
	});
	const snapshot = object(field(config, "snapshot"));
	for (const [key, value] of Object.entries({
		personId: expected.personId,
		characterId: expected.characterId,
		name: expected.name,
	}))
		equal(snapshot[key], value);
	const selection = object(field(snapshot, "sourceSelection"));
	equal(field(selection, "personId"), expected.personId);
	required(["selected", "uploaded"].includes(String(field(selection, "kind"))));
	equal(
		field(selection, "sourceSHA256"),
		expected.snapshotHashes.original ?? null,
	);
	for (const role of ["detail", "token", "original"] as const) {
		if (role === "original" && expected.mode === "token-only") {
			equal(snapshot[role], null);
			required(!expected.snapshotHashes.original);
			continue;
		}
		const blob = z
			.strictObject({
				byteBase64: z.string(),
				size: z
					.number()
					.int()
					.positive()
					.max(role === "original" ? 8388608 : 2097152),
				sha256: hash,
			})
			.parse(snapshot[role]);
		const raw = Buffer.from(blob.byteBase64, "base64");
		equal(raw.toString("base64"), blob.byteBase64);
		equal(raw.length, blob.size);
		equal(sha(raw), blob.sha256);
		equal(blob.sha256, expected.snapshotHashes[role]);
		if (role !== "original") {
			const identity = object(JSON.parse(raw.toString("utf8")));
			equal(identity[role === "detail" ? "id" : "personId"], expected.personId);
			equal(field(identity, "characterId"), expected.characterId);
			equal(field(identity, "name"), expected.name);
			if (role === "token" && expected.mode === "reference-img2img") {
				const image = object(field(identity, "image"));
				equal(field(image, "sha256"), expected.snapshotHashes.original);
				equal(field(image, "path"), `/portraits/${expected.personId}.png`);
			}
		}
	}
	equal(field(phase, "schema"), "native-moss-native-phase.v1");
	equal(field(phase, "state"), "NATIVE_COMPLETE_ALPHA_PENDING");
	equal(field(phase, "snapshotHashes"), expected.snapshotHashes);
	equal(field(phase, "mode"), expected.mode);
	equal(field(phase, "recipe"), expected.recipe);
	for (const receipt of [phase, execution]) {
		equal(field(receipt, "ownerApproved"), false);
		equal(field(receipt, "qualityQualified"), false);
		equal(field(receipt, "reviewStatus"), "HOLD");
		equal(field(receipt, "cropXYXY"), crop);
		equal(field(receipt, "cropXYWH"), [6, 1, 340, 510]);
	}
	equal(field(phase, "alphaFinished"), false);
	equal(field(execution, "schema"), "native-moss-execution.v1");
	equal(field(execution, "state"), "HOLD");
	equal(field(execution, "alphaFinished"), true);
	equal(field(execution, "native"), phase);
	const native = object(field(phase, "native"));
	try {
		verifyAttestation(
			expected,
			bytes("preflight.json"),
			phase,
			native,
			execution,
			config,
		);
	} catch (error) {
		if (error instanceof NativeMossAttestationError) throw error;
		throw new NativeMossAttestationError("NATIVE_ATTESTATION_MALFORMED");
	}
	for (const [key, value] of Object.entries({
		nativeTensorCount: 336,
		savedTensorCount: 504,
		loadedValuesVerified: true,
		noMerge: true,
		seed: nativeMossProfile.seed,
		steps: 25,
		cfg: 2.5,
		adapterSHA256: nativeMossProfile.adapterSHA256,
		toolkitCommit: nativeMossProfile.trainerCommit,
		alphaFinished: false,
		promptSHA256: expected.promptSHA256,
		contentFieldsSHA256: expected.contentFieldsSHA256,
		sourcePins: expected.sourcePins,
		cropXYXY: crop,
		cropXYWH: [6, 1, 340, 510],
	}))
		equal(native[key], value);
	equal(field(native, "modelPins"), {
		base: nativeMossProfile.baseSHA256,
		encoder: nativeMossProfile.encoderSHA256,
		vae: nativeMossProfile.vaeSHA256,
	});
	if (expected.mode === "reference-img2img") {
		const sample = object(field(native, "sampling"));
		equal(field(sample, "recipe"), expected.recipe);
		equal(field(sample, "seed"), nativeMossProfile.seed);
		equal(field(sample, "transitions"), 25);
		equal(field(sample, "denoise"), nativeMossRecipes[expected.recipe].denoise);
		for (const key of ["sourceLatent", "noise", "initial", "finalLatent"]) {
			const tensor = object(sample[key]);
			equal(field(tensor, "shape"), [1, 128, 32, 22]);
			equal(field(tensor, "sourceDtype"), "torch.float32");
			hash.parse(field(tensor, "sha256"));
		}
		const full = z
			.array(z.number())
			.length(nativeMossRecipes[expected.recipe].fullSteps + 1)
			.parse(field(sample, "fullSigmas"));
		const active = z
			.array(z.number())
			.length(26)
			.parse(field(sample, "activeSigmas"));
		const tensorHash = (values: number[]) => {
			const buffer = Buffer.alloc(values.length * 4);
			values.forEach((value, index) => {
				buffer.writeFloatLE(value, index * 4);
			});
			return sha(buffer);
		};
		const schedule =
			expected.recipe === "recovery16-native-flow-source025-v1"
				? {
						full: "790ec1775ca25ba32ffc149f49860d6d661106319fc00c9d54d13377fb4cee40",
						active:
							"8bffd85198b5e095fcd67fec57f7adbb1e31e8be2ffee82288824e5b1c75f6e2",
					}
				: {
						active:
							"5872ee2e94c5d1a90c87e49f246e67c093bff3790a7ed978fafa32df9dd48910",
					};
		if ("full" in schedule) equal(tensorHash(full), schedule.full);
		equal(tensorHash(active), schedule.active);
		equal(
			field(object(field(sample, "noise")), "sha256"),
			"1999c3df5e8b828d7bf02d97a369ef57d738606f85cf47a083fe3dcb18a0e3d0",
		);
		equal(active, full.slice(-26));
		equal(full[0], 1);
		equal(active[25], 0);
		required(
			full.every(
				(value, index) => index === 0 || value < (full[index - 1] ?? 0),
			),
		);
	} else {
		verifyObservedToken(native);
	}
	required(
		Number.isInteger(field(native, "pid")) && Number(field(native, "pid")) > 0,
	);
	equal(field(native, "pid"), expected.ownerProcess.pid);
	equal(field(native, "processStart"), expected.ownerProcess.start);
	const context = object(field(phase, "context"));
	equal(field(context, "maxTextLength"), 4096);
	equal(field(context, "truncation"), false);
	equal(field(context, "modelLoaded"), false);
	const counts = z
		.array(
			z.object({
				personId: z.string(),
				tokens: z.number().int().positive().max(4096),
				chatSHA256: hash,
			}),
		)
		.length(2)
		.parse(field(context, "counts"));
	equal(
		counts.map((entry) => entry.personId),
		[expected.personId, "negative"],
	);
	equal(field(execution, "ownerProcess"), expected.ownerProcess);
	equal(field(execution, "lifecycleSHA256"), lifecyclePin);
	for (const [name, key, receipt] of [
		["output/raw.png", "rawSHA256", native],
		["output/crop-RGB.png", "cropSHA256", native],
		["alpha-graph.json", "alphaGraphSHA256", execution],
		["alpha-history.json", "alphaHistorySHA256", execution],
		["output/alpha352.png", "alphaSHA256", execution],
		["output/mask352.png", "maskSHA256", execution],
		["output/rawmask352.png", "rawmaskSHA256", execution],
		["output/final-RGBA.png", "finalSHA256", execution],
	] as const)
		equal(sha(bytes(name)), receipt[key]);
	const raw = decodePng(bytes("output/raw.png")),
		rgb = decodePng(bytes("output/crop-RGB.png"));
	equal([raw.width, raw.height, raw.channels], [352, 512, 3]);
	equal([rgb.width, rgb.height, rgb.channels], [340, 510, 3]);
	for (let y = 0; y < 510; y++)
		for (let x = 0; x < 340; x++)
			for (let c = 0; c < 3; c++)
				equal(
					rgb.pixels[(y * 340 + x) * 3 + c],
					raw.pixels[((y + 1) * 352 + x + 6) * 3 + c],
				);
	verifyAlphaHistory(
		expected.requestId,
		execution,
		json("alpha-submitted.json"),
		json("alpha-graph.json"),
		json("alpha-history.json"),
	);
	verifyFinishingPixels(
		bytes("output/alpha352.png"),
		{
			rawBytes: bytes("output/raw.png"),
			maskBytes: bytes("output/mask352.png"),
			rawMaskBytes: bytes("output/rawmask352.png"),
		},
		"native340-v1",
	);
	const appliedMask = decodePng(bytes("output/mask352.png"));
	const rawMask = decodePng(bytes("output/rawmask352.png"));
	const alpha = decodePng(bytes("output/alpha352.png")),
		final = decodePng(bytes("output/final-RGBA.png"));
	for (let p = 0; p < 352 * 512; p++) {
		const m = appliedMask.pixels[p * appliedMask.channels],
			r = rawMask.pixels[p * rawMask.channels];
		for (const c of [1, 2]) {
			equal(appliedMask.pixels[p * appliedMask.channels + c], m);
			equal(rawMask.pixels[p * rawMask.channels + c], r);
		}
		equal(alpha.pixels[p * 4 + 3], m);
		if (r === 254) required(m === 254 || m === 255);
		else equal(m, r);
	}
	equal([final.width, final.height, final.channels], [340, 510, 4]);
	const defringe = object(field(execution, "defringe"));
	equal(field(defringe, "helperSHA256"), helperPin);
	// NumPy median(rgb[:40].reshape(-1, 3), axis=0): uint8 channel
	// histograms preserve the exact even-count midpoint, including .5 values.
	const matte = [0, 1, 2].map((channel) => {
		const histogram = new Uint32Array(256);
		for (let p = 0; p < 340 * 40; p++) {
			const value = rgb.pixels[p * 3 + channel];
			if (value === undefined) throw Error("NATIVE_RESULT_MISMATCH");
			histogram[value] = (histogram[value] ?? 0) + 1;
		}
		let count = 0,
			lower = -1;
		for (let value = 0; value < histogram.length; value++) {
			count += histogram[value] ?? 0;
			if (lower < 0 && count > 6799) lower = value;
			if (count > 6800) return (lower + value) / 2;
		}
		throw Error("NATIVE_RESULT_MISMATCH");
	});
	equal(field(defringe, "matte"), matte);
	object(field(defringe, "checks"));
	for (const key of [
		"alphaIdentical",
		"opaqueIdentical",
		"outsideEligibleIdentical",
		"zeroAlphaRGBBlack",
	])
		equal(defringe[key], true);
	required(
		["PASS", "FAIL_HOLD"].includes(String(field(defringe, "criterion"))),
	);
	for (let y = 0; y < 510; y++)
		for (let x = 0; x < 340; x++) {
			const a = ((y + 1) * 352 + x + 6) * 4,
				b = (y * 340 + x) * 4;
			const opacity = alpha.pixels[a + 3];
			equal(final.pixels[b + 3], opacity);
			for (let c = 0; c < 3; c++) {
				if (opacity === 255) equal(final.pixels[b + c], alpha.pixels[a + c]);
				if (opacity === 0) equal(final.pixels[b + c], 0);
			}
			if (
				opacity !== 0 &&
				opacity !== 255 &&
				[0, 1, 2].some((c) => final.pixels[b + c] !== alpha.pixels[a + c])
			) {
				// Independently bound RGB-only donor changes. Stable donors are
				// opaque and at least3px inside foreground; only nearest donors
				// within6px and the reviewed color-line criterion are eligible.
				let nearest = Infinity,
					valid = false;
				for (let dy = -6; dy <= 6; dy++)
					for (let dx = -6; dx <= 6; dx++) {
						const distance = dx * dx + dy * dy,
							xx = x + dx,
							yy = y + dy;
						if (
							distance > 36 ||
							distance > nearest ||
							xx < 0 ||
							xx >= 340 ||
							yy < 0 ||
							yy >= 510
						)
							continue;
						const sourceOffset = ((yy + 1) * 352 + xx + 6) * 4;
						if (alpha.pixels[sourceOffset + 3] !== 255) continue;
						let stable = true;
						for (let sy = -2; sy <= 2; sy++)
							for (let sx = -2; sx <= 2; sx++) {
								if (sx * sx + sy * sy >= 9) continue;
								const px = xx + sx,
									py = yy + sy;
								if (
									px < 0 ||
									px >= 340 ||
									py < 0 ||
									py >= 510 ||
									alpha.pixels[((py + 1) * 352 + px + 6) * 4 + 3] === 0
								)
									stable = false;
							}
						if (!stable) continue;
						if (distance < nearest) {
							nearest = distance;
							valid = false;
						}
						const donor = [0, 1, 2].map(
							(c) => raw.pixels[((yy + 1) * 352 + xx + 6) * 3 + c] ?? 0,
						);
						const original = [0, 1, 2].map(
							(c) => raw.pixels[((y + 1) * 352 + x + 6) * 3 + c] ?? 0,
						);
						const direction = donor.map((v, c) => v - (matte[c] ?? 0));
						const norm = direction.reduce((sum, v) => sum + v * v, 0);
						const coverage = Math.max(
							0,
							Math.min(
								1,
								original.reduce(
									(sum, v, c) =>
										sum + (v - (matte[c] ?? 0)) * (direction[c] ?? 0),
									0,
								) / Math.max(norm, 1),
							),
						);
						const residual = Math.max(
							...original.map((v, c) =>
								Math.abs(v - (matte[c] ?? 0) - coverage * (direction[c] ?? 0)),
							),
						);
						if (
							norm > 3600 &&
							residual <= 12 &&
							coverage < 0.98 &&
							donor.every((v, c) => final.pixels[b + c] === v)
						)
							valid = true;
					}
				required(valid);
			}
		}
	const delivery = evaluateDeliveryAlpha(bytes("output/final-RGBA.png"));
	required(delivery.status !== "FAIL");
	return {
		state: "HOLD" as const,
		ownerApproval: "NONE" as const,
		qualityQualified: false as const,
		mechanicalVerified: true as const,
		finalBytes: bytes("output/final-RGBA.png"),
		finalSHA256: sha(bytes("output/final-RGBA.png")),
		recipe: expected.recipe,
		delivery,
	};
}

function verifyObservedToken(native: Record<string, unknown>) {
	const tensor = z.strictObject({
		shape: z.array(z.number().int()),
		sourceDtype: z.literal("torch.float32"),
		hashDtype: z.literal("little-endian-float32"),
		sha256: hash,
	});
	const parsed = z
		.strictObject({
			schema: z.literal("native-moss-token-sampling.v1"),
			status: z.literal("OBSERVED"),
			pipelineSourceSHA256: z.literal(
				"6440f4629245063f82f033f120356e0f54946ef5a877e73c469d63041fd267bb",
			),
			noise: tensor,
			initial: tensor,
			finalLatent: tensor,
			sigmas: tensor,
			fullSigmas: z.array(z.number().finite()).length(26),
			activeSigmas: z.array(z.number().finite()).length(26),
			seed: z.literal(152995270030802),
			steps: z.literal(25),
			cfg: z.literal(2.5),
			shift: z.literal(5),
			transitions: z.literal(25),
			generatorStateBefore: hash,
			generatorStateAfter: hash,
		})
		.safeParse(native["sampling"]);
	attested(parsed.success, "NATIVE_TOKEN_SAMPLING_PROOF_MISSING");
	if (!parsed.success)
		throw new NativeMossAttestationError("NATIVE_TOKEN_SAMPLING_PROOF_MISSING");
	const sample = parsed.data;
	attestationEqual(
		native["samplingCoverage"],
		{ status: "OBSERVED", adoptionAllowed: true },
		"NATIVE_TOKEN_SAMPLING_COVERAGE",
	);
	for (const key of ["noise", "initial", "finalLatent"] as const)
		attestationEqual(
			sample[key].shape,
			[1, 128, 32, 22],
			"NATIVE_TOKEN_SAMPLING_GEOMETRY",
		);
	attestationEqual(sample.sigmas.shape, [26], "NATIVE_TOKEN_SAMPLING_GEOMETRY");
	attestationEqual(sample.noise, sample.initial, "NATIVE_TOKEN_NOISE_BINDING");
	attested(
		sample.generatorStateBefore !== sample.generatorStateAfter,
		"NATIVE_TOKEN_GENERATOR_BINDING",
	);
	attestationEqual(
		sample.fullSigmas,
		sample.activeSigmas,
		"NATIVE_TOKEN_SAMPLING_SCHEDULE",
	);
	const schedule = [
		1, 0.991, 0.982, 0.972, 0.962, 0.95, 0.938, 0.924, 0.91, 0.894, 0.876,
		0.856, 0.835, 0.81, 0.783, 0.752, 0.717, 0.677, 0.63, 0.574, 0.507, 0.426,
		0.325, 0.196, 0.024, 0,
	];
	attested(
		sample.fullSigmas.every(
			(value, i) =>
				Math.abs(value - (schedule[i] ?? -1)) < 1e-7 &&
				(i === 0 || value < (sample.fullSigmas[i - 1] ?? 0)),
		),
		"NATIVE_TOKEN_SAMPLING_SCHEDULE",
	);
	const buffer = Buffer.alloc(26 * 4);
	sample.fullSigmas.forEach((value, i) => {
		buffer.writeFloatLE(value, i * 4);
	});
	attestationEqual(
		sha(buffer),
		sample.sigmas.sha256,
		"NATIVE_TOKEN_SIGMA_HASH",
	);
}

function verifyAttestation(
	expected: NativeMossResultExpected,
	preflightBytes: Uint8Array,
	phase: Record<string, unknown>,
	native: Record<string, unknown>,
	execution: Record<string, unknown>,
	config: Record<string, unknown>,
) {
	const same = attestationEqual;
	const parse = (bytes: Uint8Array) =>
		JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
	attested(preflightBytes.length <= 8 * 1024 * 1024, "NATIVE_PREFLIGHT_SIZE");
	for (const receipt of [phase, execution]) {
		same(
			receipt["preflightSHA256"],
			sha(preflightBytes),
			"NATIVE_PREFLIGHT_HASH",
		);
		same(
			receipt["preflightSize"],
			preflightBytes.length,
			"NATIVE_PREFLIGHT_SIZE",
		);
	}
	const proof = object(parse(preflightBytes));
	const schema = z.strictObject({
		schema: z.literal("native-moss-runtime-proof.v1"),
		terminalReceiptSHA256: hash,
		terminalReceipt: z.string(),
		compiled: z.record(z.string(), z.unknown()),
		contextInput: z.record(z.string(), z.unknown()),
		contextInputBytes: z.string(),
		contextInputSHA256: hash,
		context: z.record(z.string(), z.unknown()),
		contextResponseSHA256: hash,
		contextResponse: z.string(),
		sourcePins: z.record(z.string(), hash),
		retainedSHA256: z.record(z.string(), hash),
		transform: z.unknown(),
	});
	const parsed = schema.safeParse(proof["runtimeAttestation"]);
	attested(parsed.success, "NATIVE_RUNTIME_PROOF_MISSING");
	if (!parsed.success)
		throw new NativeMossAttestationError("NATIVE_RUNTIME_PROOF_MISSING");
	const runtime = parsed.data;
	same(native["runtimeAttestation"], runtime, "NATIVE_RUNTIME_PROOF_MISMATCH");
	const decoded = (value: string, digest: string, code: string) => {
		const raw = Buffer.from(value, "base64");
		attested(
			raw.length > 0 &&
				raw.length <= 2 * 1024 * 1024 &&
				raw.toString("base64") === value &&
				sha(raw) === digest,
			code,
		);
		return raw;
	};
	const terminal = object(
		parse(
			decoded(
				runtime.terminalReceipt,
				runtime.terminalReceiptSHA256,
				"NATIVE_TRAINING_TERMINAL_BYTES",
			),
		),
	);
	for (const value of [
		runtime.terminalReceiptSHA256,
		proof["terminalReceiptSHA256"],
		native["terminalReceiptSHA256"],
		execution["terminalReceiptSHA256"],
	])
		same(
			value,
			nativeMossProfile.terminalReceiptSHA256,
			"NATIVE_TRAINING_TERMINAL_AUTHORITY",
		);
	attested(
		terminal["state"] === "completed" &&
			terminal["exitCode"] === 0 &&
			terminal["steps"] === 1600 &&
			object(terminal["adapter"])["sha256"] === nativeMossProfile.adapterSHA256,
		"NATIVE_TRAINING_TERMINAL_AUTHORITY",
	);
	const trusted = expected.attestation;
	attested(
		trusted &&
			trusted.contextInputBytes instanceof Uint8Array &&
			trusted.contextResponseBytes instanceof Uint8Array &&
			typeof trusted.compiled?.text === "string",
		"NATIVE_SERVER_CONTEXT_MISSING",
	);
	same(
		trusted.workerPins,
		{
			runtime: {
				sha256:
					"a3b9fb8b4a8faa6bf168f05641d6451043494c91418f1610d7af2812f4f721d7",
				size: 18472,
			},
			lifecycle: { sha256: lifecyclePin, size: 33338 },
		},
		"NATIVE_WORKER_SOURCE_AUTHORITY",
	);
	same(runtime.compiled, proof["compiled"], "NATIVE_COMPILED_PROOF");
	same(
		runtime.compiled["text"],
		trusted.compiled.text,
		"NATIVE_PROMPT_AUTHORITY",
	);
	same(
		runtime.compiled["fields"],
		trusted.compiled.fields,
		"NATIVE_CONTENT_AUTHORITY",
	);
	same(runtime.compiled["holds"], [], "NATIVE_CONTENT_HOLD");
	if (expected.mode === "reference-img2img") {
		same(
			runtime.compiled["profile"],
			"native-moss-reference-img2img.v1",
			"NATIVE_PROMPT_AUTHORITY",
		);
		same(
			trusted.compiled.text,
			"seoul dengoku portrait style, preserve the source person, outfit, composition and gaze; change only the drawing style",
			"NATIVE_PROMPT_AUTHORITY",
		);
	}
	same(
		runtime.compiled["promptSHA256"],
		sha(Buffer.from(trusted.compiled.text)),
		"NATIVE_PROMPT_AUTHORITY",
	);
	same(
		expected.promptSHA256,
		runtime.compiled["promptSHA256"],
		"NATIVE_PROMPT_AUTHORITY",
	);
	const sorted = (value: unknown): unknown =>
		Array.isArray(value)
			? value.map(sorted)
			: value !== null && typeof value === "object"
				? Object.fromEntries(
						Object.entries(value)
							.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
							.map(([k, v]) => [k, sorted(v)]),
					)
				: value;
	same(
		sha(Buffer.from(JSON.stringify(sorted(trusted.compiled.fields)))),
		expected.contentFieldsSHA256,
		"NATIVE_CONTENT_AUTHORITY",
	);
	const inputBytes = decoded(
		runtime.contextInputBytes,
		runtime.contextInputSHA256,
		"NATIVE_CONTEXT_INPUT_BYTES",
	);
	const responseBytes = decoded(
		runtime.contextResponse,
		runtime.contextResponseSHA256,
		"NATIVE_CONTEXT_RESPONSE_BYTES",
	);
	same(
		Buffer.from(inputBytes),
		Buffer.from(trusted.contextInputBytes),
		"NATIVE_CONTEXT_INPUT_AUTHORITY",
	);
	same(
		Buffer.from(responseBytes),
		Buffer.from(trusted.contextResponseBytes),
		"NATIVE_CONTEXT_RESPONSE_AUTHORITY",
	);
	same(
		runtime.contextInput,
		trusted.contextInput,
		"NATIVE_CONTEXT_INPUT_AUTHORITY",
	);
	same(parse(inputBytes), trusted.contextInput, "NATIVE_CONTEXT_INPUT_PROOF");
	same(
		trusted.contextInput["toolkit"],
		"E:/git/linalab/PNGAL/environment/ai-toolkit",
		"NATIVE_CONTEXT_PROFILE",
	);
	same(
		trusted.contextInput["tokenizerFolder"],
		"C:/Users/oliver/.cache/huggingface/hub/models--OpenMOSS-Team--MOSS-Image-SFT/snapshots/2c7954437269461767f533b006823e8f85973a60/tokenizer",
		"NATIVE_CONTEXT_PROFILE",
	);
	same(
		trusted.contextInput["prompts"],
		[{ personId: expected.personId, text: trusted.compiled.text }],
		"NATIVE_CONTEXT_PERSON_PROMPT",
	);
	same(trusted.contextInput["negative"], "", "NATIVE_CONTEXT_PERSON_PROMPT");
	same(
		trusted.contextInput["mossSourceSHA256"],
		expected.sourcePins[
			"extensions_built_in/diffusion_models/moss_image/moss_image.py"
		],
		"NATIVE_CONTEXT_SOURCE",
	);
	const context = object(parse(responseBytes));
	for (const value of [runtime.context, proof["context"], phase["context"]])
		same(value, context, "NATIVE_CONTEXT_RESPONSE_PROOF");
	attested(
		context["maxTextLength"] === 4096 &&
			context["truncation"] === false &&
			context["modelLoaded"] === false &&
			context["wrapper"] === "actual installed AST _chat",
		"NATIVE_CONTEXT_CHAT_PROOF",
	);
	same(
		context["sourceSHA256"],
		trusted.contextInput["mossSourceSHA256"],
		"NATIVE_CONTEXT_SOURCE",
	);
	same(context["tokenizerPins"], tokenizerPins, "NATIVE_CONTEXT_TOKENIZER");
	same(runtime.sourcePins, expected.sourcePins, "NATIVE_SOURCE_AUTHORITY");
	same(
		runtime.retainedSHA256,
		expected.snapshotHashes,
		"NATIVE_SNAPSHOT_AUTHORITY",
	);
	same(runtime.transform, proof["transform"], "NATIVE_TRANSFORM_PROOF");
	if (expected.mode === "reference-img2img") {
		const original = object(object(config["snapshot"])["original"]);
		const transform = transformReferencePng(
			Buffer.from(String(original["byteBase64"]), "base64"),
			"native",
			"native340-v1",
		);
		same(
			runtime.transform,
			{
				rgb: Buffer.from(transform.rgbBytes).toString("base64"),
				receipt: transform.receipt,
			},
			"NATIVE_TRANSFORM_PROOF",
		);
		same(
			native["samplingCoverage"],
			{ status: "OBSERVED_REFERENCE", adoptionAllowed: false },
			"NATIVE_SAMPLING_COVERAGE",
		);
	} else same(runtime.transform, null, "NATIVE_TRANSFORM_PROOF");
	for (const key of ["contextInputSHA256", "contextResponseSHA256"] as const)
		same(execution[key], runtime[key], "NATIVE_CONTEXT_EXECUTION_BINDING");
	const lease = object(proof["hostLease"]);
	for (const key of ["requestId", "nonce"] as const)
		same(lease[key], expected[key], "NATIVE_LEASE_BINDING");
	same(lease["pid"], expected.ownerProcess.pid, "NATIVE_LEASE_BINDING");
	same(
		lease["processStart"],
		expected.ownerProcess.start,
		"NATIVE_LEASE_BINDING",
	);
	attested(
		lease["state"] === "ACTIVE" && lease["scope"] === "native-through-alpha",
		"NATIVE_LEASE_BINDING",
	);
	const terminalSchema = z.strictObject({
		requestId: z.uuid(),
		nonce: z.uuid(),
		ownerBindingHash: hash,
		envelopeSHA256: hash,
		profileDigest: z.literal(NATIVE_MOSS_PROFILE_DIGEST),
		bundleSHA256: z.literal(NATIVE_MOSS_RESULT_BUNDLE),
		pid: z.number().int().positive().safe(),
		processStart: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{7}Z$/),
		exitCode: z.literal(0),
		channelOutcome: z.literal("EXIT_OBSERVED"),
	});
	const process = terminalSchema.safeParse(expected.nativeProcessTerminal);
	attested(process.success, "NATIVE_PROCESS_TERMINAL_MISSING");
	if (!process.success)
		throw new NativeMossAttestationError("NATIVE_PROCESS_TERMINAL_MISSING");
	for (const key of [
		"requestId",
		"nonce",
		"ownerBindingHash",
		"envelopeSHA256",
	] as const)
		same(process.data[key], expected[key], "NATIVE_PROCESS_TERMINAL_BINDING");
	same(
		process.data.pid,
		expected.ownerProcess.pid,
		"NATIVE_PROCESS_TERMINAL_BINDING",
	);
	same(
		process.data.processStart,
		expected.ownerProcess.start,
		"NATIVE_PROCESS_TERMINAL_BINDING",
	);
	for (const receipt of [native, execution]) {
		same(
			receipt["phaseOutcome"],
			"RETURNED_SUCCESSFULLY",
			"NATIVE_PHASE_OUTCOME",
		);
		attested(!Object.hasOwn(receipt, "exitCode"), "NATIVE_WORKER_EXIT_CLAIM");
	}
	same(native["pid"], process.data.pid, "NATIVE_PROCESS_TERMINAL_BINDING");
	same(
		native["processStart"],
		process.data.processStart,
		"NATIVE_PROCESS_TERMINAL_BINDING",
	);
}

function verifyAlphaHistory(
	requestId: string,
	execution: Record<string, unknown>,
	submitted: Record<string, unknown>,
	graph: Record<string, unknown>,
	history: Record<string, unknown>,
) {
	z.uuid().parse(field(execution, "alphaPromptId"));
	equal(field(submitted, "promptId"), field(execution, "alphaPromptId"));
	equal(field(submitted, "graphSHA256"), field(execution, "alphaGraphSHA256"));
	const allowed: Record<string, string> = {
		"8": "LoadImage",
		"20": "LoadBackgroundRemovalModel",
		"21": "RemoveBackground",
		"22": "ThresholdMask",
		"23": "MaskComposite",
		"24": "InvertMask",
		"25": "ThresholdMask",
		"26": "EmptyImage",
		"30": "ImageCompositeMasked",
		"27": "JoinImageWithAlpha",
		"28": "MaskToImage",
		"29": "MaskToImage",
		"9": "SaveImage",
		"11": "SaveImage",
		"15": "SaveImage",
	};
	equal(Object.keys(graph).sort(), Object.keys(allowed).sort());
	for (const [id, type] of Object.entries(allowed))
		equal(field(object(graph[id]), "class_type"), type);
	equal(
		field(object(field(object(graph["8"]), "inputs")), "image"),
		field(submitted, "image"),
	);
	equal(object(field(object(graph["22"]), "inputs")), {
		mask: ["21", 0],
		value: 254 / 255,
	});
	equal(object(field(object(graph["25"]), "inputs")), {
		mask: ["21", 0],
		value: 1 / 255,
	});
	equal(object(field(object(graph["20"]), "inputs")), {
		bg_removal_name: "birefnet.safetensors",
	});
	for (const [id, inputs] of Object.entries({
		"21": { bg_removal_model: ["20", 0], image: ["8", 0] },
		"23": {
			destination: ["21", 0],
			source: ["22", 0],
			x: 0,
			y: 0,
			operation: "add",
		},
		"24": { mask: ["23", 0] },
		"26": { width: 352, height: 512, batch_size: 1, color: 0 },
		"30": {
			destination: ["26", 0],
			source: ["8", 0],
			mask: ["25", 0],
			x: 0,
			y: 0,
			resize_source: false,
		},
		"27": { image: ["30", 0], alpha: ["24", 0] },
		"28": { mask: ["23", 0] },
		"29": { mask: ["21", 0] },
		"9": {
			images: ["27", 0],
			filename_prefix: `portal_native_alpha/${requestId}_finished`,
		},
		"11": {
			images: ["28", 0],
			filename_prefix: `portal_native_alpha/${requestId}_mask`,
		},
		"15": {
			images: ["29", 0],
			filename_prefix: `portal_native_alpha/${requestId}_rawmask`,
		},
	}))
		equal(object(field(object(graph[id]), "inputs")), inputs);
	const status = object(field(history, "status"));
	equal(field(status, "completed"), true);
	equal(field(status, "status_str"), "success");
	const prompt = z.array(z.unknown()).min(3).parse(field(history, "prompt"));
	equal(prompt[1], field(execution, "alphaPromptId"));
	equal(prompt[2], graph);
	const outputs = object(field(history, "outputs"));
	for (const id of ["9", "11", "15"]) {
		const image = z
			.array(
				z.looseObject({
					filename: z.string(),
					subfolder: z.literal("portal_native_alpha"),
					type: z.literal("output"),
				}),
			)
			.length(1)
			.parse(field(object(outputs[id]), "images"))[0];
		required(
			image?.filename.startsWith(`${requestId}_`) &&
				!image.filename.includes("..") &&
				!/[\\/]/.test(image.filename),
		);
	}
}
