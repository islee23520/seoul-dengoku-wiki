import { expect, test } from "bun:test";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
	decodePng,
	encodePng,
} from "../../portrait/acceptance/src/png.ts";
import {
	NATIVE_MOSS_PROFILE_DIGEST,
	nativeMossProfile,
} from "../src/native-moss-contract.ts";
import {
	NATIVE_MOSS_RESULT_BUNDLE,
	type NativeMossResultArtifact,
	type NativeMossResultExpected,
	verifyNativeMossResult,
} from "../src/native-moss-result.ts";
import type { NativeProcessTerminal } from "../src/native-moss-transport.ts";
import { rgbPng, transformReferencePng } from "../src/reference-transform.ts";

const hash = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
const json = (value: unknown) => Buffer.from(JSON.stringify(value));
function fixture(evenMatte = false) {
	const requestId = randomUUID(),
		nonce = randomUUID(),
		promptId = randomUUID();
	const detail = json({
		id: "person-1003",
		characterId: "K1003",
		name: "fixture",
	});
	const token = json({
		personId: "person-1003",
		characterId: "K1003",
		name: "fixture",
	});
	const blob = (bytes: Uint8Array) => ({
		byteBase64: Buffer.from(bytes).toString("base64"),
		size: bytes.length,
		sha256: hash(bytes),
	});
	const config = json({
		schema: "native-moss-job.v1",
		requestId,
		nonce,
		ownerBindingHash: "a".repeat(64),
		profileDigest: NATIVE_MOSS_PROFILE_DIGEST,
		mode: "token-only",
		recipe: "recovery16-native-token-v1",
		explicitEdits: [],
		settings: {
			generationProfile: "native340-v1",
			size: "340x510",
			n: 1,
			seed: nativeMossProfile.seed,
			steps: 25,
			cfg: 2.5,
			preserveOnly: true,
			ownerApproved: false,
			qualityQualified: false,
		},
		snapshot: {
			personId: "person-1003",
			characterId: "K1003",
			name: "fixture",
			detail: blob(detail),
			token: blob(token),
			original: null,
			sourceSelection: {
				kind: "selected",
				personId: "person-1003",
				sourceSHA256: null,
			},
		},
	});
	const pixels = new Uint8Array(352 * 512 * 4),
		alpha = new Uint8Array(pixels.length),
		mask = new Uint8Array(pixels.length);
	for (let y = 0; y < 512; y++)
		for (let x = 0; x < 352; x++) {
			const i = (y * 352 + x) * 4;
			pixels.set([40, 60, 90, 255], i);
			if (evenMatte && y >= 1 && y <= 40 && x >= 176 && x < 346)
				pixels.set([41, 61, 91, 255], i);
			const a =
				x >= 70 && x < 270 && y >= 90 && y < 430
					? x === 70
						? 128
						: x === 71
							? 254
							: 255
					: 0;
			alpha.set(a ? [40, 60, 90, a] : [0, 0, 0, 0], i);
			mask.set([a, a, a, 255], i);
		}
	const raw = rgbPng(352, 512, pixels),
		alphaBytes = encodePng({ width: 352, height: 512, pixels: alpha }),
		maskBytes = rgbPng(352, 512, mask);
	const cropRGB = new Uint8Array(340 * 510 * 4),
		cropAlpha = new Uint8Array(cropRGB.length);
	for (let y = 0; y < 510; y++) {
		cropRGB.set(
			pixels.subarray(((y + 1) * 352 + 6) * 4, ((y + 1) * 352 + 346) * 4),
			y * 340 * 4,
		);
		cropAlpha.set(
			alpha.subarray(((y + 1) * 352 + 6) * 4, ((y + 1) * 352 + 346) * 4),
			y * 340 * 4,
		);
	}
	const crop = rgbPng(340, 510, cropRGB),
		final = encodePng({ width: 340, height: 510, pixels: cropAlpha });
	const expected: NativeMossResultExpected = {
		requestId,
		nonce,
		ownerBindingHash: "a".repeat(64),
		envelopeSHA256: hash(config),
		mode: "token-only",
		recipe: "recovery16-native-token-v1",
		personId: "person-1003",
		characterId: "K1003",
		name: "fixture",
		snapshotHashes: { detail: hash(detail), token: hash(token) },
		promptSHA256: "b".repeat(64),
		contentFieldsSHA256: "c".repeat(64),
		sourcePins: { "moss.py": "d".repeat(64) },
		ownerProcess: { pid: 1234, start: "2026-10-21T10:00:00.0000000Z" },
		attestation: {
			compiled: { text: "", fields: [] },
			workerPins: {
				runtime: { sha256: "", size: 0 },
				lifecycle: { sha256: "", size: 0 },
			},
			contextInput: {},
			contextInputBytes: new Uint8Array(),
			contextResponseBytes: new Uint8Array(),
		},
		nativeProcessTerminal: {} as NativeProcessTerminal,
	};
	const binding = {
		requestId,
		nonce,
		ownerBindingHash: expected.ownerBindingHash,
		envelopeSHA256: expected.envelopeSHA256,
		profileDigest: NATIVE_MOSS_PROFILE_DIGEST,
		bundleSHA256: NATIVE_MOSS_RESULT_BUNDLE,
	};
	const phase = {
		schema: "native-moss-native-phase.v1",
		...binding,
		mode: expected.mode,
		recipe: expected.recipe,
		snapshotHashes: expected.snapshotHashes,
		state: "NATIVE_COMPLETE_ALPHA_PENDING",
		alphaFinished: false,
		ownerApproved: false,
		qualityQualified: false,
		reviewStatus: "HOLD",
		cropXYXY: [6, 1, 346, 511],
		cropXYWH: [6, 1, 340, 510],
		context: {
			maxTextLength: 4096,
			truncation: false,
			modelLoaded: false,
			counts: [
				{
					personId: expected.personId,
					tokens: 100,
					chatSHA256: "e".repeat(64),
				},
				{ personId: "negative", tokens: 20, chatSHA256: "f".repeat(64) },
			],
		},
		native: {
			noMerge: true,
			loadedValuesVerified: true,
			nativeTensorCount: 336,
			savedTensorCount: 504,
			seed: nativeMossProfile.seed,
			steps: 25,
			cfg: 2.5,
			adapterSHA256: nativeMossProfile.adapterSHA256,
			toolkitCommit: nativeMossProfile.trainerCommit,
			modelPins: {
				base: nativeMossProfile.baseSHA256,
				encoder: nativeMossProfile.encoderSHA256,
				vae: nativeMossProfile.vaeSHA256,
			},
			sourcePins: expected.sourcePins,
			promptSHA256: expected.promptSHA256,
			contentFieldsSHA256: expected.contentFieldsSHA256,
			pid: 1234,
			alphaFinished: false,
			cropXYXY: [6, 1, 346, 511],
			cropXYWH: [6, 1, 340, 510],
			sampling: null,
			rawSHA256: hash(raw),
			cropSHA256: hash(crop),
		},
	};
	const node = (class_type: string, inputs: unknown) => ({
		class_type,
		inputs,
	});
	const graph = {
		"8": node("LoadImage", { image: "native.png" }),
		"20": node("LoadBackgroundRemovalModel", {
			bg_removal_name: "birefnet.safetensors",
		}),
		"21": node("RemoveBackground", {
			bg_removal_model: ["20", 0],
			image: ["8", 0],
		}),
		"22": node("ThresholdMask", { mask: ["21", 0], value: 254 / 255 }),
		"23": node("MaskComposite", {
			destination: ["21", 0],
			source: ["22", 0],
			x: 0,
			y: 0,
			operation: "add",
		}),
		"24": node("InvertMask", { mask: ["23", 0] }),
		"25": node("ThresholdMask", { mask: ["21", 0], value: 1 / 255 }),
		"26": node("EmptyImage", {
			width: 352,
			height: 512,
			batch_size: 1,
			color: 0,
		}),
		"30": node("ImageCompositeMasked", {
			destination: ["26", 0],
			source: ["8", 0],
			mask: ["25", 0],
			x: 0,
			y: 0,
			resize_source: false,
		}),
		"27": node("JoinImageWithAlpha", { image: ["30", 0], alpha: ["24", 0] }),
		"28": node("MaskToImage", { mask: ["23", 0] }),
		"29": node("MaskToImage", { mask: ["21", 0] }),
		"9": node("SaveImage", {
			images: ["27", 0],
			filename_prefix: `portal_native_alpha/${requestId}_finished`,
		}),
		"11": node("SaveImage", {
			images: ["28", 0],
			filename_prefix: `portal_native_alpha/${requestId}_mask`,
		}),
		"15": node("SaveImage", {
			images: ["29", 0],
			filename_prefix: `portal_native_alpha/${requestId}_rawmask`,
		}),
	};
	const outputs = Object.fromEntries(
		["9", "11", "15"].map((id) => [
			id,
			{
				images: [
					{
						filename: `${requestId}_${id}.png`,
						subfolder: "portal_native_alpha",
						type: "output",
						metadata: { fixture: true },
					},
				],
			},
		]),
	);
	const history = json({
		status: { completed: true, status_str: "success" },
		prompt: [0, promptId, graph],
		outputs,
	});
	const graphBytes = json(graph),
		submitted = json({
			promptId,
			image: "native.png",
			graphSHA256: hash(graphBytes),
		});
	const execution = {
		schema: "native-moss-execution.v1",
		...binding,
		state: "HOLD",
		reviewStatus: "HOLD",
		qualityQualified: false,
		ownerApproved: false,
		alphaFinished: true,
		native: phase,
		alphaPromptId: promptId,
		alphaGraphSHA256: hash(graphBytes),
		alphaHistorySHA256: hash(history),
		alphaSHA256: hash(alphaBytes),
		maskSHA256: hash(maskBytes),
		rawmaskSHA256: hash(maskBytes),
		finalSHA256: hash(final),
		cropXYXY: [6, 1, 346, 511],
		cropXYWH: [6, 1, 340, 510],
		ownerProcess: expected.ownerProcess,
		lifecycleSHA256:
			"3495adf5b9d975b3e011572b2ae04c90a6c78fe22b62a7b012a9abae73514e19",
		defringe: {
			helperSHA256:
				"0b0ee4ab58a6b8a5c51b826b3add2a97c350cdccfbdab1b6e1e9cf51f74d6c34",
			criterion: "PASS",
			checks: {},
			matte: evenMatte ? [40.5, 60.5, 90.5] : [40, 60, 90],
			alphaIdentical: true,
			opaqueIdentical: true,
			outsideEligibleIdentical: true,
			zeroAlphaRGBBlack: true,
		},
	};
	const files: NativeMossResultArtifact[] = [
		{ name: "config.json", bytes: config },
		{ name: "status.json", bytes: json(phase) },
		{ name: "execution.json", bytes: json(execution) },
		{ name: "alpha-graph.json", bytes: graphBytes },
		{ name: "alpha-history.json", bytes: history },
		{ name: "alpha-submitted.json", bytes: submitted },
		{ name: "output/raw.png", bytes: raw },
		{ name: "output/crop-RGB.png", bytes: crop },
		{ name: "output/alpha352.png", bytes: alphaBytes },
		{ name: "output/mask352.png", bytes: maskBytes },
		{ name: "output/rawmask352.png", bytes: maskBytes },
		{ name: "output/final-RGBA.png", bytes: final },
	];
	const f = { expected, files, phase, execution };
	makeReference(f);
	addAttestation(f);
	return f;
}

function addAttestation(f: ReturnType<typeof fixture>) {
	const config = JSON.parse(
		Buffer.from(
			f.files.find((a) => a.name === "config.json")?.bytes ?? [],
		).toString(),
	);
	const text =
		"seoul dengoku portrait style, preserve the source person, outfit, composition and gaze; change only the drawing style";
	const compiled = {
		text,
		promptSHA256: hash(Buffer.from(text)),
		fields: [],
		holds: [],
		profile: "native-moss-reference-img2img.v1",
	};
	f.expected.promptSHA256 = compiled.promptSHA256;
	f.expected.contentFieldsSHA256 = hash(json([]));
	f.expected.sourcePins = {
		"extensions_built_in/diffusion_models/moss_image/moss_image.py":
			"da48fcb10a64d80cc6c3394736094a66e58fc5fa4a27ff9dc6701059e27aecd7",
	};
	const contextInput = {
		tokenizerFolder:
			"C:/Users/oliver/.cache/huggingface/hub/models--OpenMOSS-Team--MOSS-Image-SFT/snapshots/2c7954437269461767f533b006823e8f85973a60/tokenizer",
		toolkit: "E:/git/linalab/PNGAL/environment/ai-toolkit",
		mossSourceSHA256:
			f.expected.sourcePins[
				"extensions_built_in/diffusion_models/moss_image/moss_image.py"
			],
		prompts: [{ personId: f.expected.personId, text }],
		negative: "",
	};
	const context = {
		...f.phase.context,
		wrapper: "actual installed AST _chat",
		sourceSHA256: contextInput.mossSourceSHA256,
		tokenizerPins: {
			"tokenizer.json":
				"06b9509352d2af50381ab2247e083b80d32d5c0aba91c272ca9ff729b6a0e523",
			"tokenizer_config.json":
				"bee8eba30f0eb4af73c0fe2cd06d0f89b657d7819941c438157ec42f7c80ea87",
			"chat_template.jinja":
				"a4aee8afcf2e0711942cf848899be66016f8d14a889ff9ede07bca099c28f715",
		},
	};
	const inputBytes = Buffer.from(`${JSON.stringify(contextInput)}\r\n`),
		responseBytes = Buffer.from(`${JSON.stringify(context)}\r\n`);
	f.expected.attestation = {
		compiled: { text, fields: [] },
		workerPins: {
			runtime: {
				sha256:
					"a3b9fb8b4a8faa6bf168f05641d6451043494c91418f1610d7af2812f4f721d7",
				size: 18472,
			},
			lifecycle: {
				sha256:
					"fcb752c5b9bb0285a98f5699ecf0eadc9ad06d0253366986fbf99da3567228b8",
				size: 33338,
			},
		},
		contextInput,
		contextInputBytes: inputBytes,
		contextResponseBytes: responseBytes,
	};
	const transformed = transformReferencePng(
		Buffer.from(config.snapshot.original.byteBase64, "base64"),
		"native",
		"native340-v1",
	);
	const transform = {
		rgb: Buffer.from(transformed.rgbBytes).toString("base64"),
		receipt: transformed.receipt,
	};
	const runtimeAttestation = {
		schema: "native-moss-runtime-proof.v1",
		terminalReceiptSHA256: hash(trainingTerminalBytes),
		terminalReceipt: trainingTerminalBytes.toString("base64"),
		compiled,
		contextInput,
		contextInputBytes: inputBytes.toString("base64"),
		contextInputSHA256: hash(inputBytes),
		context,
		contextResponse: responseBytes.toString("base64"),
		contextResponseSHA256: hash(responseBytes),
		sourcePins: f.expected.sourcePins,
		retainedSHA256: f.expected.snapshotHashes,
		transform,
	};
	const hostLease = {
		requestId: f.expected.requestId,
		nonce: f.expected.nonce,
		pid: f.expected.ownerProcess.pid,
		processStart: f.expected.ownerProcess.start,
		state: "ACTIVE",
		scope: "native-through-alpha",
	};
	const preflight = {
		compiled,
		context,
		transform,
		terminalReceiptSHA256: hash(trainingTerminalBytes),
		runtimeAttestation,
		hostLease,
	};
	const bytes = json(preflight);
	Object.assign(f.phase, {
		preflightSHA256: hash(bytes),
		preflightSize: bytes.length,
		context,
	});
	Object.assign(f.phase.native, {
		promptSHA256: compiled.promptSHA256,
		contentFieldsSHA256: f.expected.contentFieldsSHA256,
		sourcePins: f.expected.sourcePins,
		runtimeAttestation,
		terminalReceiptSHA256: hash(trainingTerminalBytes),
		processStart: f.expected.ownerProcess.start,
		phaseOutcome: "RETURNED_SUCCESSFULLY",
		samplingCoverage: { status: "OBSERVED_REFERENCE", adoptionAllowed: false },
	});
	Object.assign(f.execution, {
		lifecycleSHA256:
			"fcb752c5b9bb0285a98f5699ecf0eadc9ad06d0253366986fbf99da3567228b8",
		preflightSHA256: hash(bytes),
		preflightSize: bytes.length,
		terminalReceiptSHA256: hash(trainingTerminalBytes),
		contextInputSHA256: hash(inputBytes),
		contextResponseSHA256: hash(responseBytes),
		phaseOutcome: "RETURNED_SUCCESSFULLY",
	});
	f.expected.nativeProcessTerminal = {
		requestId: f.expected.requestId,
		nonce: f.expected.nonce,
		ownerBindingHash: f.expected.ownerBindingHash,
		envelopeSHA256: f.expected.envelopeSHA256,
		profileDigest: NATIVE_MOSS_PROFILE_DIGEST,
		bundleSHA256: NATIVE_MOSS_RESULT_BUNDLE,
		pid: f.expected.ownerProcess.pid,
		processStart: f.expected.ownerProcess.start,
		exitCode: 0,
		channelOutcome: "EXIT_OBSERVED",
	};
	f.files = f.files
		.filter((a) => a.name !== "preflight.json")
		.map((a) => ({
			...a,
			bytes:
				a.name === "status.json"
					? json(f.phase)
					: a.name === "execution.json"
						? json(f.execution)
						: a.bytes,
		}));
	f.files.push({ name: "preflight.json", bytes });
}

function makeReference(f: {
	expected: NativeMossResultExpected;
	files: NativeMossResultArtifact[];
	phase: ReturnType<typeof fixture>["phase"];
	execution: ReturnType<typeof fixture>["execution"];
}) {
	f.expected.mode = "reference-img2img";
	f.expected.recipe = "recovery16-native-flow-source025-v1";
	const configFile = f.files.find((a) => a.name === "config.json");
	if (!configFile) throw Error("fixture");
	const config = JSON.parse(Buffer.from(configFile.bytes).toString());
	const original = f.files.find((a) => a.name === "output/raw.png");
	if (!original) throw Error("fixture");
	const decoded = decodePng(original.bytes);
	const source = encodePng({
		width: decoded.width,
		height: decoded.height,
		pixels: Uint8Array.from(
			{ length: decoded.width * decoded.height * 4 },
			(_, i) =>
				i % 4 === 3
					? 255
					: (decoded.pixels[Math.floor(i / 4) * 3 + (i % 4)] ?? 0),
		),
	});
	const token = json({
		personId: f.expected.personId,
		characterId: f.expected.characterId,
		name: f.expected.name,
		image: { path: "/portraits/person-1003.png", sha256: hash(source) },
	});
	f.expected.snapshotHashes = {
		...f.expected.snapshotHashes,
		token: hash(token),
		original: hash(source),
	};
	config.mode = f.expected.mode;
	config.recipe = f.expected.recipe;
	config.snapshot.token = {
		byteBase64: token.toString("base64"),
		size: token.length,
		sha256: hash(token),
	};
	config.snapshot.original = {
		byteBase64: Buffer.from(source).toString("base64"),
		size: source.length,
		sha256: hash(source),
	};
	config.snapshot.sourceSelection.sourceSHA256 = hash(source);
	const configBytes = json(config);
	f.expected.envelopeSHA256 = hash(configBytes);
	Reflect.set(f.phase, "mode", f.expected.mode);
	Reflect.set(f.phase, "recipe", f.expected.recipe);
	Reflect.set(f.phase, "snapshotHashes", f.expected.snapshotHashes);
	Reflect.set(f.phase, "envelopeSHA256", f.expected.envelopeSHA256);
	const tensor = {
		shape: [1, 128, 32, 22],
		sourceDtype: "torch.float32",
		sha256: "a".repeat(64),
	};
	Reflect.set(f.phase.native, "sampling", {
		recipe: f.expected.recipe,
		seed: nativeMossProfile.seed,
		transitions: 25,
		denoise: 0.25,
		sourceLatent: tensor,
		noise: {
			...tensor,
			sha256:
				"1999c3df5e8b828d7bf02d97a369ef57d738606f85cf47a083fe3dcb18a0e3d0",
		},
		initial: tensor,
		finalLatent: tensor,
		fullSigmas: [
			1, 0.9980000257492065, 0.9959999918937683, 0.9940000176429749,
			0.9919999837875366, 0.9900000095367432, 0.9869999885559082,
			0.9850000143051147, 0.9829999804496765, 0.9800000190734863,
			0.9779999852180481, 0.9760000109672546, 0.9729999899864197,
			0.9710000157356262, 0.9679999947547913, 0.9660000205039978,
			0.9629999995231628, 0.9599999785423279, 0.9580000042915344,
			0.9549999833106995, 0.9520000219345093, 0.9490000009536743,
			0.9459999799728394, 0.9430000185966492, 0.9399999976158142,
			0.9369999766349792, 0.9340000152587891, 0.9309999942779541,
			0.9269999861717224, 0.9240000247955322, 0.9210000038146973,
			0.9169999957084656, 0.9129999876022339, 0.9099999666213989,
			0.906000018119812, 0.9020000100135803, 0.8980000019073486,
			0.8939999938011169, 0.8899999856948853, 0.8859999775886536,
			0.8809999823570251, 0.8769999742507935, 0.8730000257492065,
			0.8680000305175781, 0.8629999756813049, 0.8579999804496765,
			0.8529999852180481, 0.8479999899864197, 0.8429999947547913,
			0.8370000123977661, 0.8320000171661377, 0.8259999752044678,
			0.8199999928474426, 0.8140000104904175, 0.8079999685287476,
			0.8019999861717224, 0.7949999570846558, 0.7879999876022339,
			0.7820000052452087, 0.7739999890327454, 0.7669999599456787,
			0.7590000033378601, 0.7509999871253967, 0.7430000305175781,
			0.7350000143051147, 0.7259999513626099, 0.7170000076293945,
			0.7079999446868896, 0.6979999542236328, 0.687999963760376,
			0.6779999732971191, 0.6669999957084656, 0.656000018119812,
			0.6449999809265137, 0.6330000162124634, 0.6200000047683716,
			0.6069999933242798, 0.593999981880188, 0.5789999961853027,
			0.5649999380111694, 0.5489999651908875, 0.5329999923706055,
			0.515999972820282, 0.49799999594688416, 0.48000001907348633,
			0.46000000834465027, 0.4399999976158142, 0.4180000126361847,
			0.39500001072883606, 0.3709999918937683, 0.3449999988079071,
			0.3179999887943268, 0.289000004529953, 0.2590000033378601,
			0.22600001096725464, 0.19100001454353333, 0.15400001406669617,
			0.11400000751018524, 0.07100000232458115, 0.024000002071261406, 0,
		],
		activeSigmas: [
			0.6200000047683716, 0.6069999933242798, 0.593999981880188,
			0.5789999961853027, 0.5649999380111694, 0.5489999651908875,
			0.5329999923706055, 0.515999972820282, 0.49799999594688416,
			0.48000001907348633, 0.46000000834465027, 0.4399999976158142,
			0.4180000126361847, 0.39500001072883606, 0.3709999918937683,
			0.3449999988079071, 0.3179999887943268, 0.289000004529953,
			0.2590000033378601, 0.22600001096725464, 0.19100001454353333,
			0.15400001406669617, 0.11400000751018524, 0.07100000232458115,
			0.024000002071261406, 0,
		],
	});
	f.execution.native = f.phase;
	f.execution.envelopeSHA256 = f.expected.envelopeSHA256;
	f.files = f.files.map((a) => ({
		...a,
		bytes:
			a.name === "config.json"
				? configBytes
				: a.name === "status.json"
					? json(f.phase)
					: a.name === "execution.json"
						? json(f.execution)
						: a.bytes,
	}));
}

const trainingTerminalBytes = Buffer.from(
	"ew0KICAic3RhdGUiOiAiY29tcGxldGVkIiwNCiAgIndyYXBwZXJQaWQiOiAxNDQ2NjQsDQogICJzdGFydGVkQXQiOiAiMjAyNi0xMC0yMVQxNjowNDo1NS4wMzA4OTYrMDA6MDAiLA0KICAidHJhaW5pbmdMYXVuY2hlZCI6IHRydWUsDQogICJtb2RlbHMiOiBbDQogICAgew0KICAgICAgInBhdGgiOiAiRDovQUkvZW52aXJvbm1lbnRzL1BOR0FML0NvbWZ5VUktcG5nYWwtMC4yOC4wL21vZGVscy9kaWZmdXNpb25fbW9kZWxzL21vc3NfaW1hZ2Vfc2Z0X2ludDhfY29udnJvdC5zYWZldGVuc29ycyIsDQogICAgICAic2hhMjU2IjogImI0ZDE0NzViYzdlZWZmZDdiODA5ZTgyZWExM2ExZmJhMWZiODVjNGUxODM2NWFmMzgxMzcyMmZhYTVjMGZlNGYiDQogICAgfSwNCiAgICB7DQogICAgICAicGF0aCI6ICJFOi9naXQvbGluYWxhYi9QTkdBTC9lbnZpcm9ubWVudC90cmFpbmluZy9tb3NzLWxvcmEtMjAyNjEwMTkvcXdlbjMuNV85Yl9pbnQ4X2NvbnZyb3Quc2FmZXRlbnNvcnMiLA0KICAgICAgInNoYTI1NiI6ICIzMmUzNzg3NDcyZjcwOGZhNWY4MzYyNGFjYmY1ZWYyM2Y3ZmM4OWM0MzllMDUwNjVlYTU3Y2ZlNWE5N2YwMjVhIg0KICAgIH0sDQogICAgew0KICAgICAgInBhdGgiOiAiRDovQUkvZW52aXJvbm1lbnRzL1BOR0FML0NvbWZ5VUktcG5nYWwtMC4yOC4wL21vZGVscy92YWUvZmx1eDItdmFlX3NtYWxsLnNhZmV0ZW5zb3JzIiwNCiAgICAgICJzaGEyNTYiOiAiZDhkNTJiYTAzNjQ3NWY1ZmIwN2M4YjQzNWUxNzZkM2Q5N2ViZmE4MmYwZDFhMWMzMTdmOWNjMWUyNWJkMDEzYiINCiAgICB9DQogIF0sDQogICJjb25maWdTSEEyNTYiOiAiNTFjMjhjMTcwNjVhOGQ0MjU4ZjE1ODRlMTRhNWE3ZjEzOTMwNzg0MzA0NzBiMWJiMGM2ZTg4ZWQ3OGQzOGU5NyIsDQogICJ3cmFwcGVyU0hBMjU2IjogIjExNmY5NDBiMjFiOTliODk2ODU4NDE3OGE5ZjM4YTJkN2MzN2E1MjNiMzZlMmQyODdjNjJkNTIwMzM2ZWFmZjciLA0KICAidHJhaW5lckNvbW1pdCI6ICI4Y2Y0M2RkMmNjMWZlODI4ODg0MDAxYWNlZWRhMDQ0NjQ5ZDlhYmQwIiwNCiAgImdwdVByZWZsaWdodCI6ICIxNDI4MCwgMSIsDQogICJuYXRpdmVMb2FkZXJWZXJpZmllZCI6IHRydWUsDQogICJ0cmFpbmluZ1BpZCI6IDY3MzY0LA0KICAiZXhpdENvZGUiOiAwLA0KICAic3RlcHMiOiAxNjAwLA0KICAiYWRhcHRlciI6IHsNCiAgICAicGF0aCI6ICJFOlxcZ2l0XFxsaW5hbGFiXFxQTkdBTFxcZW52aXJvbm1lbnRcXHRyYWluaW5nXFxtb3NzLXN0eWxlLXJlY292ZXJ5MTYtcHJvdmlzaW9uYWwtdjFcXG91dHB1dFxcc2VvdWwtZGVuZ29rdS1tb3NzLXNmdC1zdHlsZS1yZWNvdmVyeTE2LXByb3Zpc2lvbmFsLXYxXFxzZW91bC1kZW5nb2t1LW1vc3Mtc2Z0LXN0eWxlLXJlY292ZXJ5MTYtcHJvdmlzaW9uYWwtdjEuc2FmZXRlbnNvcnMiLA0KICAgICJzaGEyNTYiOiAiNTBkZDhhYjEzMmE5ZDljNjdlMzVlMTliYjdjMWRhNjc3MDY1ODc1N2RmMWM3YjQyNGQ0OTI5OTlkMjAwY2E1NyIsDQogICAgImJ5dGVzIjogMTQ4Njk3NDg4LA0KICAgICJ0ZW5zb3JDb3VudCI6IDUwNCwNCiAgICAibWV0YWRhdGEiOiB7DQogICAgICAidHJhaW5pbmdfaW5mbyI6ICJ7XCJzdGVwXCI6IDE2MDAsIFwiZXBvY2hcIjogOTl9IiwNCiAgICAgICJzc190YWdfZnJlcXVlbmN5IjogIntcIjFfc2VvdWwgZGVuZ29rdSBwb3J0cmFpdCBzdHlsZVwiOiB7XCJzZW91bCBkZW5nb2t1IHBvcnRyYWl0IHN0eWxlXCI6IDF9fSIsDQogICAgICAic3Noc19sZWdhY3lfaGFzaCI6ICJmMDQ0MTNkNyIsDQogICAgICAic3NfYmFzZV9tb2RlbF92ZXJzaW9uIjogIm1vc3NfaW1hZ2UiLA0KICAgICAgImZvcm1hdCI6ICJwdCIsDQogICAgICAic29mdHdhcmUiOiAie1wibmFtZVwiOiBcImFpLXRvb2xraXRcIiwgXCJyZXBvXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL29zdHJpcy9haS10b29sa2l0XCIsIFwidmVyc2lvblwiOiBcIjAuMTMuMzJcIn0iLA0KICAgICAgInNzX291dHB1dF9uYW1lIjogInNlb3VsLWRlbmdva3UtbW9zcy1zZnQtc3R5bGUtcmVjb3ZlcnkxNi1wcm92aXNpb25hbC12MSIsDQogICAgICAidmVyc2lvbiI6ICIxLjAiLA0KICAgICAgIm5hbWUiOiAic2VvdWwtZGVuZ29rdS1tb3NzLXNmdC1zdHlsZS1yZWNvdmVyeTE2LXByb3Zpc2lvbmFsLXYxIiwNCiAgICAgICJub3RlcyI6ICJPd25lci1hdXRob3JpemVkIHJlY292ZXJ5MTYgZnJlc2gtYmFzZSB0cmFpbmluZywgbm8gYWRhcHRlciByZXN1bWUuIDE1bWFsZTFmZW1hbGUgcHJvdmlzaW9uYWwgZGF0YXNldDsgbm8gc3R5bGUgYXBwcm92YWwgZnJvbSB0cmFpbmluZy4iLA0KICAgICAgInNzaHNfbW9kZWxfaGFzaCI6ICJiZDRmYjg5NzViZWZjMzM3NjMyNjBiODA2YzUxMzRmNDJlYTA4N2NkMWQ5NThjNDYyMDNmNmI1ZWYyYjFlNTAwIg0KICAgIH0NCiAgfSwNCiAgImJhc2VQaW5zVW5jaGFuZ2VkIjogdHJ1ZSwNCiAgImZpbmlzaGVkQXQiOiAiMjAyNi0xMC0yMVQxNjoyMzoxNy4zMzA3MDQrMDA6MDAiDQp9",
	"base64",
);

test("valid native phase and actual alpha graph shape with partial254alpha stays HOLD", () => {
	const f = fixture();
	const result = verifyNativeMossResult(f.expected, f.files);
	expect(result.state).toBe("HOLD");
	expect(result.ownerApproval).toBe("NONE");
	expect(result.qualityQualified).toBe(false);
	const pixels = decodePng(result.finalBytes).pixels;
	expect(pixels.includes(254)).toBe(true);
});

test("native PID and any emitted process start bind authoritative lifecycle owner", () => {
	for (const change of [{ pid: 9999 }, { processStart: "different-start" }]) {
		const f = fixture();
		Object.assign(f.phase.native, change);
		const files = f.files.map((a) => ({
			...a,
			bytes:
				a.name === "status.json"
					? json(f.phase)
					: a.name === "execution.json"
						? json(f.execution)
						: a.bytes,
		}));
		expect(() => verifyNativeMossResult(f.expected, files)).toThrow();
	}
	const f = fixture();
	Reflect.set(f.phase.native, "processStart", f.expected.ownerProcess.start);
	const files = f.files.map((a) => ({
		...a,
		bytes:
			a.name === "status.json"
				? json(f.phase)
				: a.name === "execution.json"
					? json(f.execution)
					: a.bytes,
	}));
	expect(verifyNativeMossResult(f.expected, files).state).toBe("HOLD");
});

test("matte derives from bound RGB top40 rows with exact even midpoint", () => {
	const f = fixture(true);
	expect(verifyNativeMossResult(f.expected, f.files).state).toBe("HOLD");
	for (const matte of [
		[0, 0, 0],
		[40, 60, 90],
		[41, 61, 91],
	]) {
		f.execution.defringe.matte = matte;
		const files = f.files.map((a) => ({
			...a,
			bytes: a.name === "execution.json" ? json(f.execution) : a.bytes,
		}));
		expect(() => verifyNativeMossResult(f.expected, files)).toThrow();
	}
});

test("forged matte cannot authorize a self-consistent rehashed partial-alpha edit", () => {
	const f = fixture();
	const file = f.files.find((a) => a.name === "output/final-RGBA.png");
	if (!file) throw Error("fixture");
	const image = decodePng(file.bytes);
	image.pixels[((200 - 1) * 340 + 70 - 6) * 4] = 20;
	const changed = encodePng({ width: 340, height: 510, pixels: image.pixels });
	f.execution.defringe.matte = [0, 0, 0];
	f.execution.finalSHA256 = hash(changed);
	const files = f.files.map((a) => ({
		...a,
		bytes:
			a.name === "execution.json"
				? json(f.execution)
				: a.name === "output/final-RGBA.png"
					? changed
					: a.bytes,
	}));
	expect(() => verifyNativeMossResult(f.expected, files)).toThrow();
});

test("result current bundle pin matches actual manifest and all source bytes", async () => {
	const manifest = JSON.parse(
		await readFile(
			new URL("../native-moss/manifest.json", import.meta.url),
			"utf8",
		),
	);
	const sorted = Object.fromEntries(
		Object.entries(
			manifest.files as Record<string, { sha256: string; size: number }>,
		)
			.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
			.map(([name, pin]) => [name, { sha256: pin.sha256, size: pin.size }]),
	);
	expect(hash(json(sorted))).toBe(NATIVE_MOSS_RESULT_BUNDLE);
	expect(manifest.implementationSHA256).toBe(NATIVE_MOSS_RESULT_BUNDLE);
	for (const [name, pin] of Object.entries(sorted)) {
		const raw = await readFile(
			new URL(`../native-moss/${name}`, import.meta.url),
		);
		expect({ sha256: hash(raw), size: raw.length }).toEqual(pin);
	}
});

test("dropping each required artifact or native essential proof fails", () => {
	const f = fixture();
	for (let i = 0; i < f.files.length; i++)
		expect(() =>
			verifyNativeMossResult(
				f.expected,
				f.files.filter((_, index) => index !== i),
			),
		).toThrow();
	for (const key of Object.keys(f.phase.native)) {
		const phase = structuredClone(f.phase);
		Reflect.deleteProperty(phase.native, key);
		const execution = { ...f.execution, native: phase };
		const files = f.files.map((a) => ({
			...a,
			bytes:
				a.name === "status.json"
					? json(phase)
					: a.name === "execution.json"
						? json(execution)
						: a.bytes,
		}));
		expect(() => verifyNativeMossResult(f.expected, files)).toThrow();
	}
});

test("forged booleans counts profile bundle owner and image hash cannot pass", () => {
	for (const [key, value] of [
		["noMerge", false],
		["loadedValuesVerified", false],
		["nativeTensorCount", 335],
		["savedTensorCount", 503],
		["adapterSHA256", "a".repeat(64)],
	]) {
		const f = fixture();
		Reflect.set(f.phase.native, String(key), value);
		f.execution.native = f.phase;
		const files = f.files.map((a) => ({
			...a,
			bytes:
				a.name === "status.json"
					? json(f.phase)
					: a.name === "execution.json"
						? json(f.execution)
						: a.bytes,
		}));
		expect(() => verifyNativeMossResult(f.expected, files)).toThrow();
	}
	const f = fixture();
	for (const key of ["nonce", "ownerBindingHash", "envelopeSHA256"] as const)
		expect(() =>
			verifyNativeMossResult(
				{
					...f.expected,
					[key]: key === "nonce" ? randomUUID() : "f".repeat(64),
				},
				f.files,
			),
		).toThrow();
	const bad = f.files.map((a) => ({
		...a,
		bytes:
			a.name === "output/final-RGBA.png" ? new Uint8Array([1, 2]) : a.bytes,
	}));
	expect(() => verifyNativeMossResult(f.expected, bad)).toThrow();
});

test("alpha history diffusion nodes and unlisted paths fail even with updated hashes", () => {
	for (const kind of ["UNETLoader", "CLIPLoader", "KSampler"]) {
		const f = fixture();
		const graphFile = f.files.find((a) => a.name === "alpha-graph.json");
		if (!graphFile) throw Error("fixture graph");
		const graph = JSON.parse(Buffer.from(graphFile.bytes).toString());
		graph.evil = { class_type: kind, inputs: {} };
		const graphBytes = json(graph);
		f.execution.alphaGraphSHA256 = hash(graphBytes);
		const files = f.files.map((a) => ({
			...a,
			bytes:
				a.name === "alpha-graph.json"
					? graphBytes
					: a.name === "execution.json"
						? json(f.execution)
						: a.bytes,
		}));
		expect(() => verifyNativeMossResult(f.expected, files)).toThrow();
	}
	const f = fixture();
	expect(() =>
		verifyNativeMossResult(f.expected, [
			...f.files,
			{ name: "../secret" as never, bytes: json({}) },
		]),
	).toThrow();
});

test("each required phase execution context and defringe field is independently mandatory", () => {
	const base = fixture();
	for (const section of [
		"phase",
		"execution",
		"context",
		"defringe",
	] as const) {
		const keys =
			section === "phase"
				? Object.keys(base.phase)
				: section === "execution"
					? Object.keys(base.execution)
					: section === "context"
						? ["maxTextLength", "truncation", "modelLoaded", "counts"]
						: [
								"helperSHA256",
								"criterion",
								"alphaIdentical",
								"opaqueIdentical",
								"outsideEligibleIdentical",
								"zeroAlphaRGBBlack",
								"matte",
								"checks",
							];
		for (const key of keys) {
			const f = fixture();
			const target =
				section === "phase"
					? f.phase
					: section === "execution"
						? f.execution
						: section === "context"
							? f.phase.context
							: f.execution.defringe;
			Reflect.deleteProperty(target, key);
			if (section !== "execution" || key !== "native")
				f.execution.native = f.phase;
			const files = f.files.map((a) => ({
				...a,
				bytes:
					a.name === "status.json"
						? json(f.phase)
						: a.name === "execution.json"
							? json(f.execution)
							: a.bytes,
			}));
			expect(() => verifyNativeMossResult(f.expected, files)).toThrow();
		}
	}
});

test("rehashing altered opaque or alpha pixels cannot forge defringe invariants", () => {
	for (const channel of [0, 3]) {
		const f = fixture();
		const found = f.files.find((a) => a.name === "output/final-RGBA.png");
		if (!found) throw Error("fixture final");
		const image = decodePng(found.bytes);
		const offset = (200 * 340 + 150) * 4 + channel;
		image.pixels[offset] = (image.pixels[offset] ?? 0) ^ 1;
		const changed = encodePng({
			width: 340,
			height: 510,
			pixels: image.pixels,
		});
		f.execution.finalSHA256 = hash(changed);
		const files = f.files.map((a) => ({
			...a,
			bytes:
				a.name === "output/final-RGBA.png"
					? changed
					: a.name === "execution.json"
						? json(f.execution)
						: a.bytes,
		}));
		expect(() => verifyNativeMossResult(f.expected, files)).toThrow();
	}
});

test("mask chain accepts only raw254 to254or255 and rejects other quantized byte changes", () => {
	for (const [rawValue, maskValue, accepted] of [
		[254, 255, true],
		[254, 253, false],
		[128, 129, false],
		[128, 127, false],
	] as const) {
		const f = fixture();
		const maskFile = f.files.find((a) => a.name === "output/mask352.png");
		const alphaFile = f.files.find((a) => a.name === "output/alpha352.png");
		const finalFile = f.files.find((a) => a.name === "output/final-RGBA.png");
		if (!maskFile || !alphaFile || !finalFile) throw Error("fixture");
		const mask = decodePng(maskFile.bytes),
			alpha = decodePng(alphaFile.bytes),
			final = decodePng(finalFile.bytes);
		const x = rawValue === 254 ? 71 : 70,
			y = 200;
		for (const c of [0, 1, 2])
			mask.pixels[(y * 352 + x) * mask.channels + c] = maskValue;
		alpha.pixels[(y * 352 + x) * 4 + 3] = maskValue;
		final.pixels[((y - 1) * 340 + x - 6) * 4 + 3] = maskValue;
		const changedMask = rgbPng(
			352,
			512,
			new Uint8Array(
				Array.from({ length: 352 * 512 * 4 }, (_, i) =>
					i % 4 === 3
						? 255
						: (mask.pixels[Math.floor(i / 4) * mask.channels + (i % 4)] ?? 0),
				),
			),
		);
		const changedAlpha = encodePng({
			width: 352,
			height: 512,
			pixels: alpha.pixels,
		});
		const changedFinal = encodePng({
			width: 340,
			height: 510,
			pixels: final.pixels,
		});
		f.execution.maskSHA256 = hash(changedMask);
		f.execution.alphaSHA256 = hash(changedAlpha);
		f.execution.finalSHA256 = hash(changedFinal);
		const files = f.files.map((a) => ({
			...a,
			bytes:
				a.name === "output/mask352.png"
					? changedMask
					: a.name === "output/alpha352.png"
						? changedAlpha
						: a.name === "output/final-RGBA.png"
							? changedFinal
							: a.name === "execution.json"
								? json(f.execution)
								: a.bytes,
		}));
		if (accepted)
			expect(verifyNativeMossResult(f.expected, files).state).toBe("HOLD");
		else expect(() => verifyNativeMossResult(f.expected, files)).toThrow();
	}
});

test("reference025 source authority and actual registered schedule validate with partial alpha", () => {
	const f = fixture();
	expect(verifyNativeMossResult(f.expected, f.files).state).toBe("HOLD");
	Reflect.set(f.phase.native, "sampling", null);
	const files = f.files.map((a) => ({
		...a,
		bytes:
			a.name === "status.json"
				? json(f.phase)
				: a.name === "execution.json"
					? json(f.execution)
					: a.bytes,
	}));
	expect(() => verifyNativeMossResult(f.expected, files)).toThrow();
});

function rewriteProof(
	f: ReturnType<typeof fixture>,
	mutate: (proof: Record<string, unknown>) => void,
) {
	const file = f.files.find((a) => a.name === "preflight.json");
	if (!file) throw Error("fixture");
	const proof = JSON.parse(Buffer.from(file.bytes).toString());
	mutate(proof);
	file.bytes = json(proof);
	Object.assign(f.phase, {
		preflightSHA256: hash(file.bytes),
		preflightSize: file.bytes.length,
	});
	Object.assign(f.execution, {
		preflightSHA256: hash(file.bytes),
		preflightSize: file.bytes.length,
	});
	Reflect.set(f.phase.native, "runtimeAttestation", proof.runtimeAttestation);
	f.files = f.files.map((a) => ({
		...a,
		bytes:
			a.name === "status.json"
				? json(f.phase)
				: a.name === "execution.json"
					? json(f.execution)
					: a.bytes,
	}));
}

test("each upstream runtime attestation field and transport terminal field is required", () => {
	const base = fixture();
	const pf = JSON.parse(
		Buffer.from(
			base.files.find((a) => a.name === "preflight.json")?.bytes ?? [],
		).toString(),
	);
	for (const key of Object.keys(pf.runtimeAttestation)) {
		const f = fixture();
		rewriteProof(f, (p) =>
			Reflect.deleteProperty(p["runtimeAttestation"] as object, key),
		);
		expect(() => verifyNativeMossResult(f.expected, f.files)).toThrow();
	}
	for (const key of Object.keys(base.expected.nativeProcessTerminal)) {
		const f = fixture();
		Reflect.deleteProperty(f.expected.nativeProcessTerminal, key);
		expect(() => verifyNativeMossResult(f.expected, f.files)).toThrow();
	}
	for (const key of [
		"compiled",
		"workerPins",
		"contextInput",
		"contextInputBytes",
		"contextResponseBytes",
	]) {
		const f = fixture();
		Reflect.deleteProperty(f.expected.attestation, key);
		expect(() => verifyNativeMossResult(f.expected, f.files)).toThrow();
	}
});

test("preflight exact bytes and server context bytes cannot be replaced by rehashed worker claims", () => {
	for (const kind of [
		"preflight",
		"contextInput",
		"contextResponse",
		"person",
		"terminal",
		"lease",
		"workerExit",
	] as const) {
		const f = fixture();
		if (kind === "preflight") {
			const file = f.files.find((a) => a.name === "preflight.json");
			if (!file) throw Error("fixture");
			file.bytes = Buffer.concat([file.bytes, Buffer.from(" ")]);
		} else if (kind === "workerExit") {
			Reflect.set(f.phase.native, "exitCode", 0);
			f.files = f.files.map((a) => ({
				...a,
				bytes:
					a.name === "status.json"
						? json(f.phase)
						: a.name === "execution.json"
							? json(f.execution)
							: a.bytes,
			}));
		} else
			rewriteProof(f, (proof) => {
				const runtime = proof["runtimeAttestation"] as Record<string, unknown>;
				if (kind === "contextInput" || kind === "contextResponse") {
					const key =
						kind === "contextInput" ? "contextInputBytes" : "contextResponse";
					const digest =
						kind === "contextInput"
							? "contextInputSHA256"
							: "contextResponseSHA256";
					const changed = Buffer.concat([
						Buffer.from(String(runtime[key]), "base64"),
						Buffer.from(" "),
					]);
					runtime[key] = changed.toString("base64");
					runtime[digest] = hash(changed);
				} else if (kind === "person") {
					const input = runtime["contextInput"] as Record<string, unknown>;
					input["prompts"] = [
						{
							personId: "person-9999",
							text: f.expected.attestation.compiled.text,
						},
					];
				} else if (kind === "terminal") {
					const wrong = json({
						state: "completed",
						exitCode: 0,
						steps: 1600,
						adapter: { sha256: nativeMossProfile.adapterSHA256 },
					});
					runtime["terminalReceipt"] = wrong.toString("base64");
					runtime["terminalReceiptSHA256"] = hash(wrong);
				} else
					(proof["hostLease"] as Record<string, unknown>)["processStart"] =
						"2026-10-21T10:00:01.0000000Z";
			});
		expect(() => verifyNativeMossResult(f.expected, f.files)).toThrow();
	}
	for (const change of [
		{ pid: 9999 },
		{ processStart: "2026-10-21T10:00:01.0000000Z" },
		{ nonce: randomUUID() },
		{ exitCode: 1 },
		{ channelOutcome: "JSON_RETURNED" },
	]) {
		const f = fixture();
		Object.assign(f.expected.nativeProcessTerminal, change);
		expect(() => verifyNativeMossResult(f.expected, f.files)).toThrow();
	}
});

test("unobserved token sampling never becomes adoptable despite otherwise valid thirteen artifacts", () => {
	const f = fixture();
	f.expected.mode = "token-only";
	f.expected.recipe = "recovery16-native-token-v1";
	const configFile = f.files.find((a) => a.name === "config.json");
	if (!configFile) throw Error("fixture");
	const config = JSON.parse(Buffer.from(configFile.bytes).toString());
	config.mode = f.expected.mode;
	config.recipe = f.expected.recipe;
	config.snapshot.original = null;
	config.snapshot.sourceSelection.sourceSHA256 = null;
	configFile.bytes = json(config);
	f.expected.envelopeSHA256 = hash(configFile.bytes);
	delete f.expected.snapshotHashes.original;
	Object.assign(f.phase, {
		mode: f.expected.mode,
		recipe: f.expected.recipe,
		envelopeSHA256: f.expected.envelopeSHA256,
	});
	Object.assign(f.execution, { envelopeSHA256: f.expected.envelopeSHA256 });
	Object.assign(f.expected.nativeProcessTerminal, {
		envelopeSHA256: f.expected.envelopeSHA256,
	});
	Reflect.set(f.phase.native, "sampling", null);
	Reflect.set(f.phase.native, "samplingCoverage", {
		status: "UNOBSERVED",
		adoptionAllowed: false,
		reason: "NATIVE_TOKEN_SAMPLING_PROOF_MISSING",
	});
	rewriteProof(f, (proof) => {
		proof["transform"] = null;
		const runtime = proof["runtimeAttestation"] as Record<string, unknown>;
		runtime["transform"] = null;
		runtime["retainedSHA256"] = f.expected.snapshotHashes;
	});
	expect(() => verifyNativeMossResult(f.expected, f.files)).toThrow(
		"NATIVE_TOKEN_SAMPLING_PROOF_MISSING",
	);
});

function observedTokenFixture() {
	const f = fixture();
	f.expected.mode = "token-only";
	f.expected.recipe = "recovery16-native-token-v1";
	const configFile = f.files.find((a) => a.name === "config.json");
	if (!configFile) throw Error("fixture");
	const config = JSON.parse(Buffer.from(configFile.bytes).toString());
	config.mode = f.expected.mode;
	config.recipe = f.expected.recipe;
	config.snapshot.original = null;
	config.snapshot.sourceSelection.sourceSHA256 = null;
	configFile.bytes = json(config);
	f.expected.envelopeSHA256 = hash(configFile.bytes);
	delete f.expected.snapshotHashes.original;
	Object.assign(f.phase, {
		mode: f.expected.mode,
		recipe: f.expected.recipe,
		envelopeSHA256: f.expected.envelopeSHA256,
	});
	Object.assign(f.execution, { envelopeSHA256: f.expected.envelopeSHA256 });
	Object.assign(f.expected.nativeProcessTerminal, {
		envelopeSHA256: f.expected.envelopeSHA256,
	});
	const text =
		'seoul dengoku portrait style, One person, full head, both shoulders and upper chest; preserve the following authored content. Unknown gaze is not an eye-fixation instruction.\n{"field":"/generationContract/gaze","value":null}';
	const fields = [
		{
			pointer: "/generationContract/gaze",
			value: null,
			status: "unknown",
			source: null,
		},
	];
	f.expected.promptSHA256 = hash(Buffer.from(text));
	f.expected.contentFieldsSHA256 = hash(
		Buffer.from(
			JSON.stringify([
				{
					pointer: "/generationContract/gaze",
					source: null,
					status: "unknown",
					value: null,
				},
			]),
		),
	);
	f.expected.attestation.compiled = { text, fields };
	f.expected.attestation.contextInput["prompts"] = [
		{ personId: f.expected.personId, text },
	];
	f.expected.attestation.contextInputBytes = json(
		f.expected.attestation.contextInput,
	);
	const compiled = {
		text,
		fields,
		holds: [],
		promptSHA256: f.expected.promptSHA256,
		profile: "recovery16-native-authored-content.v1",
	};
	Object.assign(f.phase.native, {
		promptSHA256: f.expected.promptSHA256,
		contentFieldsSHA256: f.expected.contentFieldsSHA256,
	});
	const sigmas = [
		1, 0.991, 0.982, 0.972, 0.962, 0.95, 0.938, 0.924, 0.91, 0.894, 0.876,
		0.856, 0.835, 0.81, 0.783, 0.752, 0.717, 0.677, 0.63, 0.574, 0.507, 0.426,
		0.325, 0.196, 0.024, 0,
	].map(Math.fround);
	const buffer = Buffer.alloc(104);
	sigmas.forEach((v, i) => {
		buffer.writeFloatLE(v, i * 4);
	});
	const noise = {
		shape: [1, 128, 32, 22],
		sourceDtype: "torch.float32",
		hashDtype: "little-endian-float32",
		sha256: "a".repeat(64),
	};
	Reflect.set(f.phase.native, "sampling", {
		schema: "native-moss-token-sampling.v1",
		status: "OBSERVED",
		pipelineSourceSHA256:
			"6440f4629245063f82f033f120356e0f54946ef5a877e73c469d63041fd267bb",
		noise,
		initial: noise,
		finalLatent: { ...noise, sha256: "b".repeat(64) },
		sigmas: {
			shape: [26],
			sourceDtype: "torch.float32",
			hashDtype: "little-endian-float32",
			sha256: hash(buffer),
		},
		fullSigmas: sigmas,
		activeSigmas: [...sigmas],
		seed: 152995270030802,
		steps: 25,
		cfg: 2.5,
		shift: 5,
		transitions: 25,
		generatorStateBefore: "c".repeat(64),
		generatorStateAfter: "d".repeat(64),
	});
	Reflect.set(f.phase.native, "samplingCoverage", {
		status: "OBSERVED",
		adoptionAllowed: true,
	});
	rewriteProof(f, (proof) => {
		proof["compiled"] = compiled;
		proof["transform"] = null;
		const runtime = proof["runtimeAttestation"] as Record<string, unknown>;
		Object.assign(runtime, {
			compiled,
			transform: null,
			retainedSHA256: f.expected.snapshotHashes,
			contextInput: f.expected.attestation.contextInput,
			contextInputBytes: Buffer.from(
				f.expected.attestation.contextInputBytes,
			).toString("base64"),
			contextInputSHA256: hash(f.expected.attestation.contextInputBytes),
		});
		Object.assign(f.execution, {
			contextInputSHA256: runtime["contextInputSHA256"],
		});
	});
	return f;
}

test("actual-shaped observed token receipt validates full thirteen artifact mechanics without approval", () => {
	const f = observedTokenFixture();
	const result = verifyNativeMossResult(f.expected, f.files);
	expect(result.state).toBe("HOLD");
	expect(result.ownerApproval).toBe("NONE");
	expect(result.mechanicalVerified).toBe(true);
});

test("every observed token field and executing value is mandatory", () => {
	const sampling = (f: ReturnType<typeof fixture>) => {
		const value: unknown = Reflect.get(f.phase.native, "sampling");
		if (!value || typeof value !== "object") throw Error("fixture sampling");
		return value;
	};
	const base = observedTokenFixture();
	const sample = sampling(base);
	for (const key of Object.keys(sample)) {
		const f = observedTokenFixture();
		Reflect.deleteProperty(sampling(f), key);
		f.files = f.files.map((a) => ({
			...a,
			bytes:
				a.name === "status.json"
					? json(f.phase)
					: a.name === "execution.json"
						? json(f.execution)
						: a.bytes,
		}));
		expect(() => verifyNativeMossResult(f.expected, f.files)).toThrow();
	}
	for (const [key, value] of [
		["seed", 1],
		["steps", 24],
		["cfg", 3],
		["shift", 1],
		["pipelineSourceSHA256", "0".repeat(64)],
		["status", "UNOBSERVED"],
		[
			"noise",
			{
				shape: [1],
				sourceDtype: "torch.float32",
				hashDtype: "little-endian-float32",
				sha256: "a".repeat(64),
			},
		],
		["activeSigmas", Array.from({ length: 26 }, (_, i) => 1 - i / 25)],
	] as const) {
		const f = observedTokenFixture();
		Reflect.set(sampling(f), key, value);
		f.files = f.files.map((a) => ({
			...a,
			bytes:
				a.name === "status.json"
					? json(f.phase)
					: a.name === "execution.json"
						? json(f.execution)
						: a.bytes,
		}));
		expect(() => verifyNativeMossResult(f.expected, f.files)).toThrow();
	}
});
