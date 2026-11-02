import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
	mkdir,
	mkdtemp,
	readFile,
	realpath,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	createNativeMossProvider,
	NATIVE_MOSS_PROVIDER_BUNDLE,
	type NativeMossProviderAuthority,
} from "../src/native-moss-provider.ts";
import {
	NATIVE_MOSS_RESULT_BUNDLE,
	verifyNativeMossResult,
} from "../src/native-moss-result.ts";
import { referenceGenerationRequestSchema } from "../src/reference-contract.ts";
import {
	observedTokenFixture,
	referenceResultFixture,
} from "./native-moss-provider-result-fixture.ts";

const hash = (v: string | Uint8Array) =>
	createHash("sha256").update(v).digest("hex");
const json = (v: unknown) => Buffer.from(JSON.stringify(v));
const reference045Sigmas = [
	1, 0.9959999918937683, 0.9919999837875366, 0.9879999756813049,
	0.984000027179718, 0.9800000190734863, 0.9760000109672546, 0.9710000157356262,
	0.9670000076293945, 0.9620000123977661, 0.9570000171661377,
	0.9520000219345093, 0.9459999799728394, 0.9409999847412109,
	0.9350000023841858, 0.9290000200271606, 0.9229999780654907,
	0.9160000085830688, 0.9099999666213989, 0.902999997138977, 0.8949999809265137,
	0.8880000114440918, 0.8799999952316284, 0.871999979019165, 0.8629999756813049,
	0.8539999723434448, 0.8450000286102295, 0.8349999785423279,
	0.8240000009536743, 0.812999963760376, 0.8019999861717224, 0.7899999618530273,
	0.7770000100135803, 0.7630000114440918, 0.7489999532699585,
	0.7339999675750732, 0.7170000076293945, 0.699999988079071, 0.6819999814033508,
	0.6619999408721924, 0.640999972820282, 0.6179999709129333, 0.593999981880188,
	0.5669999718666077, 0.5389999747276306, 0.5069999694824219,
	0.47300001978874207, 0.4360000193119049, 0.39500001072883606,
	0.3499999940395355, 0.29899999499320984, 0.24300001561641693,
	0.17900000512599945, 0.10700000822544098, 0.024000002071261406, 0,
];
type Seams = NonNullable<Parameters<typeof createNativeMossProvider>[1]>;

test("provider uses real thirteen-artifact result verification before release and preserves failed replay", async () => {
	const manifest = JSON.parse(
		await readFile(
			new URL("../native-moss/manifest.json", import.meta.url),
			"utf8",
		),
	);
	expect(manifest.implementationSHA256).toBe(NATIVE_MOSS_PROVIDER_BUNDLE);
	expect(NATIVE_MOSS_RESULT_BUNDLE).toBe(NATIVE_MOSS_PROVIDER_BUNDLE);
	const worker = {
		files: await Promise.all(
			Object.keys(manifest.files).map(async (name) => {
				const bytes = await readFile(
					new URL(`../native-moss/${name}`, import.meta.url),
				);
				expect({ sha256: hash(bytes), size: bytes.length }).toEqual(
					manifest.files[name],
				);
				return {
					name,
					byteBase64: bytes.toString("base64"),
					sha256: hash(bytes),
					size: bytes.length,
				};
			}),
		),
	};
	for (const mode of ["reference", "token"] as const)
		for (const mutation of [
			null,
			"preflight",
			"context",
			"terminal",
			"sampling",
			"alpha",
		] as const) {
			const f =
				mode === "token" ? observedTokenFixture() : referenceResultFixture();
			if (mode === "reference") {
				const sourceSampling: unknown = Reflect.get(f.phase.native, "sampling");
				if (!sourceSampling || typeof sourceSampling !== "object")
					throw Error("FIXTURE_SAMPLING");
				f.expected.recipe = "recovery16-native-flow-source045-v1";
				Reflect.set(f.phase, "recipe", f.expected.recipe);
				Reflect.set(f.phase.native, "sampling", {
					...sourceSampling,
					recipe: f.expected.recipe,
					denoise: 0.45,
					fullSigmas: reference045Sigmas,
					activeSigmas: reference045Sigmas.slice(-26),
				});
			}
			const root = await realpath(
				await mkdtemp(join(tmpdir(), "native-provider-real-result-")),
			);
			const dir = join(root, f.expected.requestId);
			try {
				await mkdir(dir);
				await writeFile(join(dir, "dispatch.lock"), "reserved", { flag: "wx" });
				const config = JSON.parse(
					Buffer.from(
						f.files.find((a) => a.name === "config.json")?.bytes ?? [],
					).toString(),
				);
				let tokenBytes = Buffer.from(
					config.snapshot.token.byteBase64,
					"base64",
				);
				if (mode === "token") {
					tokenBytes = json({
						personId: f.expected.personId,
						characterId: f.expected.characterId,
						name: f.expected.name,
						identity: {},
						slots: {},
					});
					config.snapshot.token = {
						byteBase64: tokenBytes.toString("base64"),
						sha256: hash(tokenBytes),
						size: tokenBytes.length,
					};
					f.expected.snapshotHashes.token = hash(tokenBytes);
					f.phase.snapshotHashes = f.expected.snapshotHashes;
				}
				const original = config.snapshot.original
					? Buffer.from(config.snapshot.original.byteBase64, "base64")
					: null;
				const request = {
					schemaVersion: 2,
					generationProfile: "native340-v1",
					requestId: f.expected.requestId,
					personId: f.expected.personId,
					provider: "native-moss",
					providerModel: "native-moss:recovery16-provisional-v1",
					nativeRecipe: f.expected.recipe,
					inputMode: f.expected.mode,
					sourceSelection: original
						? {
								kind: "selected",
								personId: f.expected.personId,
								sourceSHA256: hash(original),
							}
						: { kind: "intentional-absence", reason: "no-reference-available" },
					explicitEdits: [],
					size: "340x510",
					faceMode: { kind: "unique", variantId: null },
				};
				const authority: NativeMossProviderAuthority = {
					detailBytes: Buffer.from(config.snapshot.detail.byteBase64, "base64"),
					ownerBindingHash: f.expected.ownerBindingHash,
					serverEvidence: {
						status: "available",
						recipient: {
							personId: f.expected.personId,
							characterId: f.expected.characterId,
						},
						tokenBytes,
						tokenSHA256: hash(tokenBytes),
						recipientImage: original
							? {
									personId: f.expected.personId,
									characterId: f.expected.characterId,
									sourceSHA256: hash(original),
									bytes: original,
								}
							: null,
					},
					dispatchProof: {
						requestSHA256: hash(
							json(referenceGenerationRequestSchema.parse(request)),
						),
						snapshotHashes: f.expected.snapshotHashes,
						sourcePins: f.expected.sourcePins,
						attestation: f.expected.attestation,
					},
				};
				const calls: string[] = [];
				const refresh = () => {
					for (const a of f.files) {
						if (a.name === "status.json") a.bytes = json(f.phase);
						if (a.name === "execution.json") a.bytes = json(f.execution);
					}
				};
				const seams: Seams = {
					workerBundle: async () => worker,
					qualification: () => null,
					// This is the actual verifier, not an accepting test replacement.
					verifyResult: verifyNativeMossResult,
					readback: async () => f.files,
					transport: {
						readiness: async () => ({ state: "READY", proof: {} }),
						lifecycleReadiness: async () => ({
							state: "LIFECYCLE_READINESS",
							proof: { ready: true },
						}),
						execute: async (bytes) => {
							calls.push("execute");
							const envelope = JSON.parse(Buffer.from(bytes).toString());
							const handle = {
								requestId: envelope.requestId,
								nonce: envelope.nonce,
								ownerBindingHash: envelope.ownerBindingHash,
								envelopeSHA256: hash(bytes),
								profileDigest: envelope.profileDigest,
							};
							for (const value of [
								f.phase,
								f.execution,
								f.expected.nativeProcessTerminal,
							])
								Object.assign(value, handle);
							const preflight = f.files.find(
								(a) => a.name === "preflight.json",
							);
							if (!preflight) throw Error("FIXTURE");
							const proof = JSON.parse(Buffer.from(preflight.bytes).toString());
							proof.runtimeAttestation.retainedSHA256 =
								f.expected.snapshotHashes;
							Reflect.set(
								f.phase.native,
								"runtimeAttestation",
								proof.runtimeAttestation,
							);
							Object.assign(proof.hostLease, {
								requestId: handle.requestId,
								nonce: handle.nonce,
							});
							preflight.bytes = json(proof);
							for (const value of [f.phase, f.execution])
								Object.assign(value, {
									preflightSHA256: hash(preflight.bytes),
									preflightSize: preflight.bytes.length,
								});
							const file = f.files.find((a) => a.name === "config.json");
							if (!file) throw Error("FIXTURE");
							file.bytes = Buffer.from(bytes);
							refresh();
							return {
								state: "NATIVE_COMPLETE_ALPHA_PENDING",
								handle,
								receipt: f.phase,
								nativeProcessTerminal: f.expected.nativeProcessTerminal,
							};
						},
						alpha: async (handle) => {
							calls.push("alpha");
							return {
								state: "ALPHA_SUBMITTED",
								handle: { ...handle, bundleSHA256: NATIVE_MOSS_RESULT_BUNDLE },
								receipt: {},
							};
						},
						finalize: async (handle) => {
							calls.push("finalize");
							return {
								state: "HOLD",
								handle: { ...handle, bundleSHA256: NATIVE_MOSS_RESULT_BUNDLE },
								receipt: f.execution,
							};
						},
						lifecycleReadArtifacts: async () => {
							calls.push("collect");
							if (mutation === "context") {
								const file = f.files.find((a) => a.name === "preflight.json");
								if (!file) throw Error("FIXTURE");
								const proof = JSON.parse(Buffer.from(file.bytes).toString());
								const changed = Buffer.concat([
									Buffer.from(
										proof.runtimeAttestation.contextResponse,
										"base64",
									),
									Buffer.from(" "),
								]);
								proof.runtimeAttestation.contextResponse =
									changed.toString("base64");
								proof.runtimeAttestation.contextResponseSHA256 = hash(changed);
								file.bytes = json(proof);
								Reflect.set(
									f.phase.native,
									"runtimeAttestation",
									proof.runtimeAttestation,
								);
								for (const value of [f.phase, f.execution])
									Object.assign(value, {
										preflightSHA256: hash(file.bytes),
										preflightSize: file.bytes.length,
									});
								Reflect.set(
									f.execution,
									"contextResponseSHA256",
									hash(changed),
								);
							}
							if (mutation === "terminal") f.phase.native.pid++;
							if (mutation === "sampling")
								Reflect.set(f.phase.native, "sampling", null);
							refresh();
							const name =
								mutation === "preflight"
									? "preflight.json"
									: mutation === "alpha"
										? "output/mask352.png"
										: null;
							if (name) {
								const file = f.files.find((a) => a.name === name);
								if (!file) throw Error("FIXTURE");
								file.bytes = Buffer.concat([
									Buffer.from(file.bytes),
									Buffer.from("tamper"),
								]);
							}
							return {
								state: "ARTIFACTS",
								files: f.files.map((a) => ({
									name: a.name,
									byteBase64: Buffer.from(a.bytes).toString("base64"),
									sha256: hash(a.bytes),
									size: a.bytes.length,
								})),
							};
						},
						release: async (handle) => {
							calls.push("release");
							return {
								state: "RELEASED",
								handle: { ...handle, bundleSHA256: NATIVE_MOSS_RESULT_BUNDLE },
								receipt: { finalSHA256: f.execution.finalSHA256 },
							};
						},
						reconcile: async () => ({ state: "UNKNOWN", code: "READ_ONLY" }),
						status: async () => ({ state: "UNKNOWN", code: "READ_ONLY" }),
						readArtifacts: async () => ({ state: "UNKNOWN", code: "UNUSED" }),
					},
				};
				const provider = createNativeMossProvider(
					{
						jobDirectory: async (id) => {
							expect(id).toBe(request.requestId);
							return dir;
						},
					},
					seams,
				);
				const permits: string[] = [];
				const options = {
					authorizeMutation: async (phase: string) => {
						permits.push(phase);
					},
				};
				const outcome = await provider.execute(request, authority, options);
				expect(outcome.state, JSON.stringify(outcome)).toBe(
					mutation ? "UNKNOWN" : "HOLD",
				);
				if (!mutation) {
					expect(outcome).toMatchObject({
						ownerApproval: "NONE",
						qualityQualified: false,
					});
					expect(permits).toEqual(["execute", "alpha", "finalize", "release"]);
				} else expect(calls).not.toContain("release");
				const count = calls.length;
				expect(
					(await provider.execute(request, authority, options)).state,
				).toBe("UNKNOWN");
				expect(calls).toHaveLength(count);
				expect(calls.filter((x) => x === "execute")).toHaveLength(1);
			} finally {
				await rm(root, { recursive: true, force: true });
			}
		}
});
