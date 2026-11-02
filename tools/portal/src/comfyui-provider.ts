import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import {
	decodePng,
	encodePng,
} from "../../portrait/acceptance/src/png.ts";
import {
	MOSS_CAPTIONFIX_LORA,
	MOSS_CAPTIONFIX_WORKFLOW,
	MOSS_MALE_DATASET,
	MOSS_MALE_LORA,
	MOSS_MALE_WORKFLOW,
	MOSS_STYLE_LORA,
	MOSS_STYLE_TRIGGER,
	MOSS_STYLE_WORKFLOW,
	measureMossAssets,
	mossWorkflowLora,
	verifyMossAssetProof,
} from "./comfyui-assets.ts";
import { COMFY_ENDPOINT } from "./comfyui-file-proof.ts";
import {
	type FinishingImages,
	finishComfyGraph,
	finishingReceiptSchema,
	measureFinishingAssets,
	verifyFinishingPixels,
	verifyFinishingProof,
} from "./comfyui-finishing.ts";
import {
	COMFY_PROMPT_COMPILER,
	COMFY_PROMPT_LIMITS,
	comfyPromptCompilerSchema,
	compileReferenceEditPrompt,
	REFERENCE_PROMPT_COMPILER,
} from "./comfyui-prompt.ts";
import { portraitOutput } from "./portrait-size.ts";
import {
	type AnyComfyWorkflow,
	COMFY_SOURCE_WORKFLOW,
	comfyWorkflowSchema,
	isAlphaWorkflow,
	mossStyleStrength,
	opaqueWorkflow,
} from "./provider-models.ts";
import {
	createReferenceManifest,
	recordReferenceObservation,
} from "./reference-analysis.ts";
import {
	referenceGenerationRequestSchema,
	resolveReferenceSource,
} from "./reference-contract.ts";
import {
	createOwnerDirective,
	resolveReferenceIntent,
} from "./reference-intent.ts";
import { transformReferencePng } from "./reference-transform.ts";
import { hash } from "./sources.ts";

// Reviewed deployment destination. Never accept an endpoint or graph from a browser.
export { COMFY_ENDPOINT };
// Original workflow; kept as the first registered Comfy endpoint (`comfyui`).
export const COMFY_WORKFLOW = "zimage-turbo-text-draft.v1" as const;
// ComfyUI 0.42.0 official MOSS-Image SFT text-to-image template, raw-prompt
// path (prompt upsampler and skip-layer guidance off, as the template ships).
export const COMFY_MOSS_WORKFLOW = "moss-image-sft-text.v1" as const;
const MOSS_STYLE_LORA_FIELDS = Object.freeze({
	filename: MOSS_STYLE_LORA.filename,
	sha256: MOSS_STYLE_LORA.sha256,
	strength: 1 as const,
	trigger: MOSS_STYLE_TRIGGER,
});
function styleLoraFields(workflow: AnyComfyWorkflow) {
	const strength = mossStyleStrength(workflow);
	const lora = mossWorkflowLora(workflow);
	return {
		...MOSS_STYLE_LORA_FIELDS,
		filename: lora.filename,
		sha256: lora.sha256,
		strength,
		...(strength !== 1 ? { intent: "gaze-strength-diagnostic" as const } : {}),
		...(opaqueWorkflow(workflow) === MOSS_MALE_WORKFLOW
			? { dataset: MOSS_MALE_DATASET }
			: {}),
	};
}
const sha = z.string().regex(/^[a-f0-9]{64}$/);
export const comfyCompletionRequestSchema = z.strictObject({
	schema: z.literal("comfy-completion-recovery.v1"),
	jobSHA256: sha,
	promptId: z.uuid(),
	clientId: z.uuid(),
	historySHA256: sha,
	outputSHA256: z.strictObject({ "9": sha, "11": sha, "15": sha, "16": sha }),
});
const inputSchema = z
	.strictObject({
		requestId: z.uuid(),
		generationProfile: z.literal("native340-v1").optional(),
		workflow: comfyWorkflowSchema,
		// Compiled portrait prompt: the only text the graph encodes.
		text: z.string().min(1),
		// sha256 of the retained authored projection text the prompt was
		// compiled from; copied into the receipt next to the prompt hash.
		textSHA: sha,
		seed: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
		// Portal identity of the authored source the text was projected from; it is
		// copied into the receipt so evaluation can bind the draft to its projection.
		sourceSHA: sha,
	})
	.refine(
		(input) =>
			input.text.length <=
			(input.workflow === COMFY_SOURCE_WORKFLOW
				? 2400
				: (COMFY_PROMPT_LIMITS[input.workflow] ?? 0)),
	);
export type ComfyPortraitRequest = z.infer<typeof inputSchema>;
export type ComfyModels = Readonly<{
	diffusion: string;
	encoder: string;
	vae: string;
}>;
export const comfyProvenanceSchema = z.strictObject({
	provider: z.literal("comfyui"),
	generationProfile: z.literal("native340-v1").optional(),
	generationGeometry: z
		.strictObject({
			requested: z.tuple([z.literal(340), z.literal(510)]),
			canvas: z.tuple([z.literal(352), z.literal(512)]),
			latent: z.tuple([
				z.literal(1),
				z.literal(128),
				z.literal(32),
				z.literal(22),
			]),
			contentRect: z.strictObject({
				x: z.literal(6),
				y: z.literal(1),
				width: z.literal(340),
				height: z.literal(510),
			}),
			output: z.tuple([z.literal(340), z.literal(510)]),
			evidence: z.literal("pinned-vae-contract-not-observed-tensor"),
		})
		.optional(),
	workflow: comfyWorkflowSchema,
	models: z.strictObject({
		diffusion: z.string().min(1),
		encoder: z.string().min(1),
		vae: z.string().min(1),
	}),
	promptId: z.uuid(),
	terminalNode: z.literal("9"),
	seed: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
	nativeSHA: sha,
	sourcePngSHA: sha,
	requestSHA: sha,
	historySHA: sha,
	assetProofSHA: sha.optional(),
	finishing: finishingReceiptSchema.optional(),
	lora: z
		.strictObject({
			filename: z.enum([
				MOSS_STYLE_LORA.filename,
				MOSS_CAPTIONFIX_LORA.filename,
				MOSS_MALE_LORA.filename,
			]),
			sha256: z.enum([
				MOSS_STYLE_LORA.sha256,
				MOSS_CAPTIONFIX_LORA.sha256,
				MOSS_MALE_LORA.sha256,
			]),
			strength: z.union([z.literal(1), z.literal(0), z.literal(0.7)]),
			trigger: z.literal(MOSS_STYLE_TRIGGER),
			intent: z.literal("gaze-strength-diagnostic").optional(),
			dataset: z
				.strictObject({
					manifestSHA: z.literal(MOSS_MALE_DATASET.manifestSHA),
					count: z.literal(59),
					uniqueIdentities: z.literal(59),
					evaluationIntersection: z.literal(0),
				})
				.optional(),
		})
		.optional(),
});
// Canonical Comfy draft receipt. `status: "draft"` and `reviewStatus: "HOLD"`
// are deliberately not the GPT `200` / `candidate-unreviewed` contract.
// `textSHA` binds the full authored projection text exactly as before;
// `promptSHA` binds the compiled prompt the graph actually encoded.
export const comfyReceiptSchema = comfyProvenanceSchema.extend({
	workflow: comfyWorkflowSchema.exclude([COMFY_SOURCE_WORKFLOW]),
	requestId: z.uuid(),
	textSHA: sha,
	promptSHA: sha,
	promptCompiler: comfyPromptCompilerSchema,
	sourceSHA: sha,
	referenceHashes: z.array(sha).length(0),
	responseSHA: sha,
	status: z.literal("draft"),
	reviewStatus: z.literal("HOLD"),
});
export type ComfyReceipt = z.infer<typeof comfyReceiptSchema>;
// The first deployed ZImage receipt encoded the retained projection directly.
// Keep its exact schema readable; it cannot claim the newer compiler contract.
export const legacyComfyReceiptSchema = comfyReceiptSchema
	.omit({
		promptSHA: true,
		promptCompiler: true,
		assetProofSHA: true,
		lora: true,
		finishing: true,
	})
	.extend({ workflow: z.literal(COMFY_WORKFLOW) });
export type LegacyComfyReceipt = z.infer<typeof legacyComfyReceiptSchema>;
export type ComfyConnection = Readonly<{
	provider: "comfyui";
	endpoint: typeof COMFY_ENDPOINT;
	workflow: AnyComfyWorkflow;
	models: ComfyModels;
	state: "READY";
}>;
export type ComfyTransport = {
	fetch: (url: string, init: RequestInit) => Promise<Response>;
	webSocket: (
		url: string,
	) => Pick<WebSocket, "addEventListener" | "removeEventListener" | "close">;
};
export class ComfyError extends Error {
	constructor(
		readonly code: string,
		readonly uncertain = false,
		readonly promptId: string | null = null,
	) {
		super(code);
	}
}
type Graph = Record<
	string,
	{ class_type: string; inputs: Record<string, unknown> }
>;
type WorkflowSpec = Readonly<{
	models: ComfyModels;
	graph: (
		input: ComfyPortraitRequest & { sourceInit?: SourceInit },
		prefix: string,
	) => Graph;
}>;
export const COMFY_SOURCE_RECIPE = Object.freeze({
	seed: 152995270030802,
	denoises: [0.25, 0.45, 0.65] as const,
	steps: 25,
	cfg: 2.5,
	sampler: "er_sde",
	scheduler: "simple",
});
const sourceInitSchema = z.strictObject({
	schema: z.literal("comfy-source-latent-init.v1"),
	generationProfile: z.literal("native340-v1").optional(),
	originalSHA: sha,
	nativeRGBSHA: sha,
	nativeRGBBytes: z.number().int().positive(),
	transformSHA: sha,
	manifestSHA: sha,
	observationSHA: sha,
	directiveSHA: sha,
	intentSHA: sha,
	uploadName: z.string().regex(/^source_[a-f0-9]{64}_[a-f0-9-]{36}\.png$/),
	uploadType: z.literal("input"),
	uploadSubfolder: z.literal(""),
	loadNode: z.literal("12"),
	encodeNode: z.literal("6"),
	vaeNode: z.literal("3"),
	vae: z.literal("flux2-vae_small.safetensors"),
	latentGeometry: z.union([
		z.tuple([z.literal(1), z.literal(128), z.literal(32), z.literal(22)]),
		z.tuple([z.literal(1), z.literal(128), z.literal(96), z.literal(64)]),
	]),
	geometryEvidence: z.literal(
		"expected-from-pinned-vae-and-native-canvas-not-tensor-observation",
	),
	denoise: z.union([z.literal(0.25), z.literal(0.45), z.literal(0.65)]),
});
type SourceInit = z.infer<typeof sourceInitSchema>;
export const comfySourceReceiptSchema = comfyReceiptSchema.extend({
	workflow: z.literal(COMFY_SOURCE_WORKFLOW),
	promptCompiler: z.literal(REFERENCE_PROMPT_COMPILER),
	referenceHashes: z.tuple([sha]),
	sourceInit: sourceInitSchema,
});
export type ComfySourceReceipt = z.infer<typeof comfySourceReceiptSchema>;

// Resolve authority from the strict public envelope and retained server bytes.
// A caller's acquired label or prompt never replaces this boundary.
export type RetainedComfyNative = {
	rgbaBytes: Uint8Array;
	rgbBytes: Uint8Array;
	receiptBytes: Uint8Array;
};
export function prepareComfySource(
	input: {
		request: unknown;
		serverEvidence: unknown;
		denoise: number;
	},
	retainedNative?: RetainedComfyNative,
) {
	z.strictObject({
		request: z.unknown(),
		serverEvidence: z.unknown(),
		denoise: sourceInitSchema.shape.denoise,
	}).parse(input);
	const acquisition = resolveReferenceSource(
		input.request,
		input.serverEvidence,
	);
	if (acquisition.status !== "acquired")
		throw new ComfyError(
			acquisition.status === "failed" || acquisition.status === "unresolved"
				? acquisition.errorCode
				: "MODE_SOURCE_MISMATCH",
		);
	const request = referenceGenerationRequestSchema.parse(input.request);
	if (
		request.provider !== "comfyui" ||
		request.providerModel !== `comfyui:${COMFY_SOURCE_WORKFLOW}`
	)
		throw new ComfyError("COMFY_CONNECTION_NOT_READY");
	const denoise = sourceInitSchema.shape.denoise.parse(input.denoise);
	const { manifest, imageBytes } = createReferenceManifest(
		acquisition,
		"original",
	);
	const observation = recordReferenceObservation({ manifest });
	const directive = createOwnerDirective(request, manifest);
	const records = resolveReferenceIntent({
		acquisition,
		manifest,
		observation,
		directive,
	});
	const compiled = compileReferenceEditPrompt(records);
	const native = transformReferencePng(
		imageBytes,
		"native",
		request.generationProfile,
		"comfyui",
	);
	if (retainedNative) {
		const receipt = JSON.parse(
			Buffer.from(retainedNative.receiptBytes).toString(),
		);
		const {
			rgbaSHA256: _rgba,
			rgbSHA256: _rgb,
			zlibVersion: _zlib,
			...geometry
		} = native.receipt;
		const { rgbaSHA256, rgbSHA256, zlibVersion, ...retainedGeometry } = receipt;
		if (
			!isDeepStrictEqual(geometry, retainedGeometry) ||
			typeof zlibVersion !== "string" ||
			hash(retainedNative.rgbaBytes) !== rgbaSHA256 ||
			hash(retainedNative.rgbBytes) !== rgbSHA256
		)
			throw new ComfyError("COMFY_RECOVERY_PROOF_MISMATCH");
		for (const [original, retained] of [
			[native.rgbaBytes, retainedNative.rgbaBytes],
			[native.rgbBytes, retainedNative.rgbBytes],
		] as const) {
			const expected = decodePng(original),
				actual = decodePng(retained);
			if (
				expected.width !== actual.width ||
				expected.height !== actual.height ||
				expected.channels !== actual.channels ||
				hash(expected.pixels) !== hash(actual.pixels)
			)
				throw new ComfyError("COMFY_RECOVERY_PROOF_MISMATCH");
		}
		native.rgbaBytes = retainedNative.rgbaBytes;
		native.rgbBytes = Buffer.from(retainedNative.rgbBytes);
		native.receipt = receipt;
	}
	return {
		request,
		originalBytes: imageBytes,
		native,
		records,
		compiled,
		denoise,
	};
}
function sourceBinding(
	prepared: ReturnType<typeof prepareComfySource>,
	uploadName: string,
): SourceInit {
	if (!uploadName.startsWith(`source_${hash(prepared.native.rgbBytes)}_`))
		throw new ComfyError("COMFY_UPLOAD_HASH_MISMATCH");
	return sourceInitSchema.parse({
		...readinessSource,
		...(prepared.request.generationProfile
			? {
					generationProfile: prepared.request.generationProfile,
					latentGeometry: [1, 128, 32, 22],
				}
			: {}),
		originalSHA: hash(prepared.originalBytes),
		nativeRGBSHA: hash(prepared.native.rgbBytes),
		nativeRGBBytes: prepared.native.rgbBytes.length,
		transformSHA: hash(Buffer.from(JSON.stringify(prepared.native.receipt))),
		manifestSHA: prepared.records.manifest.sha256,
		observationSHA: prepared.records.observation.sha256,
		directiveSHA: prepared.records.directive.sha256,
		intentSHA: prepared.records.intent.sha256,
		denoise: prepared.denoise,
		uploadName,
	});
}
const readinessSource: SourceInit = {
	schema: "comfy-source-latent-init.v1",
	originalSHA: "0".repeat(64),
	nativeRGBSHA: "0".repeat(64),
	nativeRGBBytes: 1,
	transformSHA: "0".repeat(64),
	manifestSHA: "0".repeat(64),
	observationSHA: "0".repeat(64),
	directiveSHA: "0".repeat(64),
	intentSHA: "0".repeat(64),
	uploadName: `source_${"0".repeat(64)}_00000000-0000-0000-0000-000000000000.png`,
	uploadType: "input",
	uploadSubfolder: "",
	loadNode: "12",
	encodeNode: "6",
	vaeNode: "3",
	vae: "flux2-vae_small.safetensors",
	latentGeometry: [1, 128, 96, 64],
	geometryEvidence:
		"expected-from-pinned-vae-and-native-canvas-not-tensor-observation",
	denoise: 0.25,
};
// Official recommended MOSS-Image negative prompt (template note) plus the
// portal's fixed no-text/no-sheet terms; the template's negative encoder is
// server-owned and never comes from a browser or a token.
export const COMFY_MOSS_NEGATIVE =
	"nsfw, worst quality, bad anatomy, watermark, jpeg artifact, text, letters, numbers, labels, captions, character sheet, multiple views, multiple people";
const zimageModels: ComfyModels = Object.freeze({
	diffusion: "z_image_turbo_bf16.safetensors",
	encoder: "qwen_3_4b.safetensors",
	vae: "ae.safetensors",
});
const mossModels: ComfyModels = Object.freeze({
	diffusion: "moss_image_sft_int8_convrot.safetensors",
	encoder: "qwen3.5_9b_w4a8_gptq.safetensors",
	vae: "flux2-vae_small.safetensors",
});
const opaqueWorkflows: Readonly<Record<string, WorkflowSpec>> = Object.freeze({
	[MOSS_MALE_WORKFLOW]: {
		models: mossModels,
		graph: (input, prefix) =>
			workflows[MOSS_STYLE_WORKFLOW].graph(input, prefix),
	},
	[MOSS_CAPTIONFIX_WORKFLOW]: {
		models: mossModels,
		graph: (input, prefix) =>
			workflows[MOSS_STYLE_WORKFLOW].graph(input, prefix),
	},
	"moss-image-sft-style-diagnostic-zero.v1": {
		models: mossModels,
		graph: (input, prefix) =>
			workflows[MOSS_STYLE_WORKFLOW].graph(input, prefix),
	},
	"moss-image-sft-style-diagnostic-reduced.v1": {
		models: mossModels,
		graph: (input, prefix) =>
			workflows[MOSS_STYLE_WORKFLOW].graph(input, prefix),
	},
	[MOSS_STYLE_WORKFLOW]: {
		models: mossModels,
		graph: (input, prefix) => {
			const graph = workflows[COMFY_MOSS_WORKFLOW].graph(input, prefix);
			graph["10"] = {
				class_type: "LoraLoaderModelOnly",
				inputs: {
					model: ["1", 0],
					lora_name: mossWorkflowLora(input.workflow).filename,
					strength_model: mossStyleStrength(input.workflow),
				},
			};
			graph["7"] = {
				class_type: "KSampler",
				inputs: { ...graph["7"]?.inputs, model: ["10", 0] },
			};
			return graph;
		},
	},
	[COMFY_WORKFLOW]: {
		models: zimageModels,
		// ZImage Turbo runs at CFG 1 and has no negative prompt: the negative
		// branch is the zeroed positive conditioning.
		graph: (input, prefix) => ({
			"1": {
				class_type: "UNETLoader",
				inputs: { unet_name: zimageModels.diffusion, weight_dtype: "default" },
			},
			"2": {
				class_type: "CLIPLoader",
				inputs: {
					clip_name: zimageModels.encoder,
					type: "lumina2",
					device: "default",
				},
			},
			"3": { class_type: "VAELoader", inputs: { vae_name: zimageModels.vae } },
			"4": {
				class_type: "CLIPTextEncode",
				inputs: { text: input.text, clip: ["2", 0] },
			},
			"5": {
				class_type: "ConditioningZeroOut",
				inputs: { conditioning: ["4", 0] },
			},
			"6": {
				class_type: "EmptySD3LatentImage",
				inputs: { width: 1024, height: 1536, batch_size: 1 },
			},
			"7": {
				class_type: "KSampler",
				inputs: {
					model: ["10", 0],
					positive: ["4", 0],
					negative: ["5", 0],
					latent_image: ["6", 0],
					seed: input.seed,
					steps: 9,
					cfg: 1,
					sampler_name: "euler",
					scheduler: "simple",
					denoise: 1,
				},
			},
			"8": {
				class_type: "VAEDecode",
				inputs: { samples: ["7", 0], vae: ["3", 0] },
			},
			"9": {
				class_type: "SaveImage",
				inputs: { images: ["8", 0], filename_prefix: prefix },
			},
			"10": {
				class_type: "ModelSamplingAuraFlow",
				inputs: { model: ["1", 0], shift: 3 },
			},
		}),
	},
	[COMFY_MOSS_WORKFLOW]: {
		models: mossModels,
		// Template subgraph "Text to Image (MOSS-Image)" reduced to its raw-prompt
		// path: UNETLoader straight into KSampler (SLG switch off), separate
		// negative encoder, 25 er_sde/simple steps, CFG 2.5, model-default shift.
		// Latent is 1024x1536 so the native output keeps the portal's 2:3 contract.
		graph: (input, prefix) => ({
			"1": {
				class_type: "UNETLoader",
				inputs: { unet_name: mossModels.diffusion, weight_dtype: "default" },
			},
			"2": {
				class_type: "CLIPLoader",
				inputs: {
					clip_name: mossModels.encoder,
					type: "moss_image",
					device: "default",
				},
			},
			"3": { class_type: "VAELoader", inputs: { vae_name: mossModels.vae } },
			"4": {
				class_type: "CLIPTextEncode",
				inputs: { text: input.text, clip: ["2", 0] },
			},
			"5": {
				class_type: "CLIPTextEncode",
				inputs: { text: COMFY_MOSS_NEGATIVE, clip: ["2", 0] },
			},
			"6": {
				class_type: "EmptyFlux2LatentImage",
				inputs: {
					width: input.generationProfile ? 352 : 1024,
					height: input.generationProfile ? 512 : 1536,
					batch_size: 1,
				},
			},
			"7": {
				class_type: "KSampler",
				inputs: {
					model: ["1", 0],
					positive: ["4", 0],
					negative: ["5", 0],
					latent_image: ["6", 0],
					seed: input.seed,
					steps: 25,
					cfg: 2.5,
					sampler_name: "er_sde",
					scheduler: "simple",
					denoise: 1,
				},
			},
			"8": {
				class_type: "VAEDecode",
				inputs: { samples: ["7", 0], vae: ["3", 0] },
			},
			"9": {
				class_type: "SaveImage",
				inputs: { images: ["8", 0], filename_prefix: prefix },
			},
		}),
	},
});
const workflows = new Proxy(opaqueWorkflows, {
	get(target, key: string) {
		if (key === COMFY_SOURCE_WORKFLOW)
			return {
				models: mossModels,
				graph: (
					input: ComfyPortraitRequest & { sourceInit?: SourceInit },
					prefix: string,
				) => {
					const source = sourceInitSchema.parse(input.sourceInit);
					const graph = opaqueWorkflows[COMFY_MOSS_WORKFLOW]?.graph(
						input,
						prefix,
					);
					if (!graph?.["7"]) throw new ComfyError("COMFY_INVALID_REQUEST");
					graph["12"] = {
						class_type: "LoadImage",
						inputs: { image: source.uploadName },
					};
					graph["6"] = {
						class_type: "VAEEncode",
						inputs: { pixels: ["12", 0], vae: ["3", 0] },
					};
					graph["7"].inputs["denoise"] = source.denoise;
					return finishComfyGraph(graph, prefix, input.generationProfile);
				},
			};
		if (!isAlphaWorkflow(key)) return target[key];
		const original = target[opaqueWorkflow(key)];
		if (!original) return undefined;
		return {
			models: original.models,
			graph: (input: ComfyPortraitRequest, prefix: string) =>
				finishComfyGraph(
					original.graph(input, prefix),
					prefix,
					input.generationProfile,
				),
		};
	},
}) as Readonly<Record<AnyComfyWorkflow, WorkflowSpec>>;
export function comfyWorkflowModels(workflow: AnyComfyWorkflow): ComfyModels {
	return workflows[workflow].models;
}
const nodeInfo = z.object({
	input: z.object({ required: z.record(z.string(), z.array(z.unknown())) }),
	output_node: z.boolean().optional(),
});
const eventSchema = z.object({
	type: z.string(),
	data: z.object({
		prompt_id: z.string(),
		node: z.string().nullable().optional(),
	}),
});
const submissionSchema = z.strictObject({
	client_id: z.uuid(),
	prompt: z.record(
		z.string(),
		z.strictObject({
			class_type: z.string(),
			inputs: z.record(z.string(), z.unknown()),
		}),
	),
});
const historySchema = z.object({
	prompt: z.tuple([z.number(), z.string(), z.unknown()]).rest(z.unknown()),
	status: z.object({ completed: z.boolean(), status_str: z.string() }),
	outputs: z.record(
		z.string(),
		z.object({
			images: z
				.array(
					z.object({
						filename: z.string().regex(/^[A-Za-z0-9_-]+\.png$/),
						subfolder: z.literal(""),
						type: z.literal("output"),
					}),
				)
				.optional(),
		}),
	),
});

/** SaveImage emits RGB; keep exact native bytes and separately expand alpha for
 * the existing RGBA-only portraitOutput contract. No crop or padding. */
export function comfySourceFromNative(
	nativeBytes: Uint8Array,
	generationProfile?: "native340-v1",
): Uint8Array {
	const decoded = decodePng(nativeBytes);
	if (
		decoded.width !== (generationProfile ? 352 : 1024) ||
		decoded.height !== (generationProfile ? 512 : 1536)
	)
		throw new ComfyError("COMFY_OUTPUT_MISMATCH");
	if (decoded.channels !== 3) return nativeBytes;
	const pixels = new Uint8Array(decoded.width * decoded.height * 4);
	for (let p = 0; p < decoded.width * decoded.height; p++) {
		pixels.set(decoded.pixels.subarray(p * 3, p * 3 + 3), p * 4);
		pixels[p * 4 + 3] = 255;
	}
	return encodePng({ width: decoded.width, height: decoded.height, pixels });
}

/** Recomputes every hash and the exact server-owned graph from retained bytes.
 * A receipt that merely asserts hashes never passes; the graph, prompt id,
 * history, terminal image and native/source PNG must all agree, and the text
 * the graph encoded must hash to the receipt's compiled prompt. Recompiling
 * that prompt from the stored projection is the caller's step (evaluations). */
export function verifyComfyEvidence(evidence: {
	receipt: ComfyReceipt | LegacyComfyReceipt | ComfySourceReceipt;
	sourceInput?: Parameters<typeof prepareComfySource>[0];
	retainedNative?: RetainedComfyNative;
	conditioningBytes?: Uint8Array;
	nativeBytes: Uint8Array;
	sourceBytes: Uint8Array;
	requestBytes: Uint8Array;
	historyBytes: Uint8Array;
	assetProofBytes?: Uint8Array | undefined;
	finishingProofBytes?: Uint8Array | undefined;
	finishingImages?: FinishingImages | undefined;
}) {
	const { receipt } = evidence;
	const mismatch = () => new ComfyError("COMFY_EVIDENCE_MISMATCH");
	if (
		Boolean(receipt.generationProfile) !== Boolean(receipt.generationGeometry)
	)
		throw mismatch();
	let sourceInit: SourceInit | undefined;
	if (receipt.workflow === COMFY_SOURCE_WORKFLOW) {
		try {
			const sourceReceipt = comfySourceReceiptSchema.parse(receipt);
			if (!evidence.sourceInput || !evidence.conditioningBytes)
				throw mismatch();
			const prepared = prepareComfySource(
				evidence.sourceInput,
				evidence.retainedNative,
			);
			if (prepared.request.generationProfile !== receipt.generationProfile)
				throw mismatch();
			sourceInit = sourceBinding(prepared, sourceReceipt.sourceInit.uploadName);
			if (
				JSON.stringify(sourceInit) !==
					JSON.stringify(sourceReceipt.sourceInit) ||
				hash(evidence.conditioningBytes) !== hash(prepared.native.rgbBytes) ||
				receipt.requestId !== prepared.request.requestId ||
				receipt.sourceSHA !== prepared.compiled.sourceSHA256 ||
				receipt.textSHA !== prepared.compiled.sha ||
				receipt.promptSHA !== prepared.compiled.sha ||
				receipt.referenceHashes[0] !== prepared.compiled.sourceSHA256 ||
				receipt.seed !== COMFY_SOURCE_RECIPE.seed
			)
				throw mismatch();
		} catch {
			throw mismatch();
		}
	}
	if (isAlphaWorkflow(receipt.workflow)) {
		try {
			if (
				!("finishing" in receipt) ||
				!receipt.finishing ||
				!evidence.finishingProofBytes ||
				!evidence.finishingImages
			)
				throw mismatch();
			const f = receipt.finishing;
			if (
				hash(evidence.finishingProofBytes) !== f.proofSHA ||
				hash(evidence.finishingImages.rawBytes) !== f.rawSHA ||
				hash(evidence.finishingImages.maskBytes) !== f.maskSHA ||
				hash(evidence.finishingImages.rawMaskBytes) !== f.rawMaskSHA ||
				hash(evidence.nativeBytes) !== f.finishedSHA
			)
				throw mismatch();
			verifyFinishingProof(
				JSON.parse(Buffer.from(evidence.finishingProofBytes).toString("utf8")),
			);
			verifyFinishingPixels(
				evidence.nativeBytes,
				evidence.finishingImages,
				receipt.generationProfile,
			);
		} catch {
			throw mismatch();
		}
	} else if ("finishing" in receipt && receipt.finishing !== undefined)
		throw mismatch();
	if (mossStyleStrength(receipt.workflow) !== undefined) {
		try {
			if (
				!evidence.assetProofBytes ||
				!("assetProofSHA" in receipt) ||
				hash(evidence.assetProofBytes) !== receipt.assetProofSHA ||
				!("lora" in receipt) ||
				JSON.stringify(receipt.lora) !==
					JSON.stringify(styleLoraFields(receipt.workflow)) ||
				((mossStyleStrength(receipt.workflow) !== 1 ||
					receipt.workflow === MOSS_CAPTIONFIX_WORKFLOW ||
					receipt.workflow === MOSS_MALE_WORKFLOW) &&
					(!("promptCompiler" in receipt) ||
						receipt.promptCompiler !== COMFY_PROMPT_COMPILER))
			)
				throw mismatch();
			verifyMossAssetProof(
				JSON.parse(Buffer.from(evidence.assetProofBytes).toString("utf8")),
				receipt.workflow,
			);
		} catch {
			throw mismatch();
		}
	} else if (
		("assetProofSHA" in receipt &&
			receipt.assetProofSHA !== undefined &&
			!isAlphaWorkflow(receipt.workflow)) ||
		("lora" in receipt && receipt.lora !== undefined)
	)
		throw mismatch();
	if (
		isAlphaWorkflow(receipt.workflow) &&
		mossStyleStrength(receipt.workflow) === undefined
	) {
		try {
			if (
				!evidence.assetProofBytes ||
				!("assetProofSHA" in receipt) ||
				hash(evidence.assetProofBytes) !== receipt.assetProofSHA
			)
				throw mismatch();
			verifyMossAssetProof(
				JSON.parse(Buffer.from(evidence.assetProofBytes).toString("utf8")),
				receipt.workflow,
			);
		} catch {
			throw mismatch();
		}
	}
	if (
		hash(evidence.nativeBytes) !== receipt.nativeSHA ||
		hash(evidence.sourceBytes) !== receipt.sourcePngSHA ||
		receipt.responseSHA !== receipt.sourcePngSHA ||
		hash(evidence.requestBytes) !== receipt.requestSHA ||
		hash(evidence.historyBytes) !== receipt.historySHA ||
		JSON.stringify(receipt.models) !==
			JSON.stringify(workflows[receipt.workflow]?.models)
	)
		throw mismatch();
	let submission: z.infer<typeof submissionSchema>;
	let history: z.infer<typeof historySchema>;
	try {
		submission = submissionSchema.parse(
			JSON.parse(Buffer.from(evidence.requestBytes).toString("utf8")),
		);
		history = historySchema.parse(
			z
				.record(z.string(), z.unknown())
				.parse(JSON.parse(Buffer.from(evidence.historyBytes).toString("utf8")))[
				receipt.promptId
			],
		);
		const expanded = comfySourceFromNative(
			evidence.nativeBytes,
			receipt.generationProfile,
		);
		if (receipt.workflow !== COMFY_WORKFLOW) {
			if (hash(expanded) !== receipt.sourcePngSHA) throw mismatch();
		} else {
			// Both deployed ZImage converters used a different PNG encoder. Bind
			// exact decoded RGBA pixels as well as both retained file hashes.
			const expected = decodePng(expanded);
			const actual = decodePng(evidence.sourceBytes);
			if (
				actual.width !== expected.width ||
				actual.height !== expected.height ||
				actual.channels !== expected.channels ||
				!Buffer.from(actual.pixels).equals(Buffer.from(expected.pixels))
			)
				throw mismatch();
		}
	} catch {
		throw mismatch();
	}
	const text = Reflect.get(submission.prompt["4"]?.inputs ?? {}, "text");
	const compiled = "promptSHA" in receipt;
	const prefix = `portal_${submission.client_id}`;
	if (
		sourceInit &&
		sourceInit.uploadName !==
			`source_${sourceInit.nativeRGBSHA}_${submission.client_id}.png`
	)
		throw mismatch();
	const request = inputSchema.safeParse({
		requestId: receipt.requestId,
		...(receipt.generationProfile
			? { generationProfile: receipt.generationProfile }
			: {}),
		workflow: receipt.workflow,
		text: compiled ? text : "legacy",
		textSHA: receipt.textSHA,
		seed: receipt.seed,
		sourceSHA: receipt.sourceSHA,
	});
	if (
		typeof text !== "string" ||
		(mossStyleStrength(receipt.workflow) !== undefined &&
			!text.startsWith(`${MOSS_STYLE_TRIGGER}. `)) ||
		hash(Buffer.from(text)) !==
			(compiled ? receipt.promptSHA : receipt.textSHA) ||
		(!compiled && text.length > 20000) ||
		!request.success ||
		JSON.stringify(submission.prompt) !==
			JSON.stringify(
				workflows[receipt.workflow]?.graph(
					{ ...request.data, text, ...(sourceInit ? { sourceInit } : {}) },
					prefix,
				),
			)
	)
		throw mismatch();
	const images = history.outputs[receipt.terminalNode]?.images;
	if (isAlphaWorkflow(receipt.workflow)) {
		for (const [node, suffix] of [
			["16", "raw"],
			["11", "mask"],
			["15", "rawmask"],
		]) {
			const output = history.outputs[node ?? ""]?.images;
			if (
				output?.length !== 1 ||
				!output[0]?.filename.startsWith(`${prefix}_${suffix}_`)
			)
				throw mismatch();
		}
	}
	if (
		history.prompt[1] !== receipt.promptId ||
		JSON.stringify(history.prompt[2]) !== JSON.stringify(submission.prompt) ||
		!history.status.completed ||
		history.status.status_str !== "success" ||
		images?.length !== 1 ||
		!images[0]?.filename.startsWith(`${prefix}_`)
	)
		throw mismatch();
}

/** Server-only. authorize must synchronously recheck the existing owner/session/job
 * binding immediately before start(). Storage and draft promotion belong to caller.
 * Both workflows are explicit text-only drafts with no wiki input, reference
 * image or style qualification; a connection is pinned to the workflow whose
 * readiness it verified.
 */
export function createComfyProvider(options: {
	authorize: <T>(start: () => T) => T;
	transport?: ComfyTransport;
	measureAssets?: typeof measureMossAssets;
	measureFinishing?: typeof measureFinishingAssets;
}) {
	const transport = options.transport ?? {
		fetch: (url, init) => fetch(url, init),
		webSocket: (url) => new WebSocket(url),
	};
	const connections = new WeakSet<ComfyConnection>();
	async function bytes(
		path: string,
		signal: AbortSignal,
		init: RequestInit = {},
		limit = 2097152,
	) {
		try {
			const response = await options.authorize(() =>
				transport.fetch(COMFY_ENDPOINT + path, {
					...init,
					redirect: "error",
					signal,
				}),
			);
			if (!response.ok || !response.body)
				throw new ComfyError("COMFY_HTTP_FAILURE");
			const reader = response.body.getReader(),
				parts: Uint8Array[] = [];
			let size = 0;
			try {
				for (;;) {
					const next = await reader.read();
					if (next.done) break;
					size += next.value.length;
					if (size > limit) {
						await reader.cancel();
						throw new ComfyError("COMFY_RESPONSE_TOO_LARGE");
					}
					parts.push(next.value);
				}
			} finally {
				reader.releaseLock();
			}
			return Buffer.concat(parts);
		} catch (error) {
			if (
				error instanceof DOMException &&
				(error.name === "AbortError" || error.name === "TimeoutError")
			)
				throw new ComfyError(
					error.name === "TimeoutError"
						? "COMFY_HTTP_TIMEOUT"
						: "COMFY_HTTP_ABORTED",
				);
			throw error;
		}
	}
	async function json(
		path: string,
		signal: AbortSignal,
		init?: RequestInit,
	): Promise<unknown> {
		return JSON.parse((await bytes(path, signal, init)).toString("utf8"));
	}
	async function complete(
		input: ComfyPortraitRequest,
		requestBytes: Buffer,
		historyBytes: Buffer,
		promptId: string,
		signal: AbortSignal,
		assetProofBytes?: Buffer,
		finishingProofBytes?: Buffer,
		sourceInit?: SourceInit,
	) {
		const { client_id: clientId, prompt: graph } = submissionSchema.parse(
			JSON.parse(requestBytes.toString()),
		);
		const prefix = `portal_${clientId}`;
		const spec = workflows[input.workflow];
		const history = historySchema.parse(
			z
				.record(z.string(), z.unknown())
				.parse(JSON.parse(historyBytes.toString("utf8")))[promptId],
		);
		if (
			history.prompt[1] !== promptId ||
			JSON.stringify(history.prompt[2]) !== JSON.stringify(graph) ||
			!history.status.completed ||
			history.status.status_str !== "success"
		)
			throw new ComfyError("COMFY_OUTPUT_MISMATCH", false, promptId);
		const images = history.outputs["9"]?.images,
			image = images?.[0];
		if (
			images?.length !== 1 ||
			!image ||
			!image.filename.startsWith(`${prefix}_`)
		)
			throw new ComfyError("COMFY_OUTPUT_MISMATCH", false, promptId);
		const nativeBytes = await bytes(
			`/view?${new URLSearchParams(image)}`,
			signal,
			{},
			8388608,
		);
		if (
			nativeBytes.length < 45 ||
			nativeBytes.readUInt32BE(16) !== (input.generationProfile ? 352 : 1024) ||
			nativeBytes.readUInt32BE(20) !== (input.generationProfile ? 512 : 1536)
		)
			throw new ComfyError("COMFY_OUTPUT_MISMATCH", false, promptId);
		let sourceBytes: Uint8Array;
		let finishingImages: FinishingImages | undefined;
		if (isAlphaWorkflow(input.workflow)) {
			const imageAt = async (node: string, suffix: string) => {
				const outputs = history.outputs[node]?.images;
				const output = outputs?.[0];
				if (
					outputs?.length !== 1 ||
					!output ||
					!output.filename.startsWith(`${prefix}_${suffix}_`)
				)
					throw new ComfyError("COMFY_FINISH_OUTPUT_MISSING", false, promptId);
				return bytes(
					`/view?${new URLSearchParams(output)}`,
					signal,
					{},
					8388608,
				);
			};
			finishingImages = {
				rawBytes: await imageAt("16", "raw"),
				maskBytes: await imageAt("11", "mask"),
				rawMaskBytes: await imageAt("15", "rawmask"),
			};
			try {
				verifyFinishingPixels(
					nativeBytes,
					finishingImages,
					input.generationProfile,
				);
			} catch {
				throw new ComfyError("COMFY_FINISH_PIXELS_INVALID", false, promptId);
			}
		}
		try {
			sourceBytes = comfySourceFromNative(nativeBytes, input.generationProfile);
		} catch {
			throw new ComfyError("COMFY_OUTPUT_MISMATCH", false, promptId);
		}
		const provenance = comfyProvenanceSchema.parse({
			provider: "comfyui",
			...(input.generationProfile
				? { generationProfile: input.generationProfile }
				: {}),
			...(input.generationProfile
				? {
						generationGeometry: {
							requested: [340, 510],
							canvas: [352, 512],
							latent: [1, 128, 32, 22],
							contentRect: { x: 6, y: 1, width: 340, height: 510 },
							output: [340, 510],
							evidence: "pinned-vae-contract-not-observed-tensor",
						},
					}
				: {}),
			workflow: input.workflow,
			models: spec.models,
			...(finishingProofBytes && finishingImages
				? {
						finishing: {
							recipe: "birefnet-continuous-nearone.v1",
							modelSHA:
								"9ab37426bf4de0567af6b5d21b16151357149139362e6e8992021b8ce356a154",
							proofSHA: hash(finishingProofBytes),
							rawSHA: hash(finishingImages.rawBytes),
							rawMaskSHA: hash(finishingImages.rawMaskBytes),
							maskSHA: hash(finishingImages.maskBytes),
							finishedSHA: hash(nativeBytes),
							matteQuality: "OWNER_REVIEW_REQUIRED",
						},
					}
				: {}),
			...(assetProofBytes
				? {
						assetProofSHA: hash(assetProofBytes),
						...(mossStyleStrength(input.workflow) !== undefined
							? { lora: styleLoraFields(input.workflow) }
							: {}),
					}
				: {}),
			promptId,
			terminalNode: "9",
			seed: input.seed,
			nativeSHA: hash(nativeBytes),
			sourcePngSHA: hash(sourceBytes),
			requestSHA: hash(requestBytes),
			historySHA: hash(historyBytes),
		});
		const canonicalReceiptBytes = Buffer.from(
			JSON.stringify(
				(sourceInit ? comfySourceReceiptSchema : comfyReceiptSchema).parse({
					...provenance,
					requestId: input.requestId,
					textSHA: input.textSHA,
					promptSHA: hash(Buffer.from(input.text)),
					promptCompiler: sourceInit
						? REFERENCE_PROMPT_COMPILER
						: COMFY_PROMPT_COMPILER,
					sourceSHA: input.sourceSHA,
					referenceHashes: sourceInit ? [sourceInit.originalSHA] : [],
					...(sourceInit ? { sourceInit } : {}),
					responseSHA: hash(sourceBytes),
					status: "draft",
					reviewStatus: "HOLD",
				}),
			),
		);
		const output = portraitOutput(sourceBytes, canonicalReceiptBytes);
		if (sourceInit)
			output.receiptBytes = Buffer.from(
				`${JSON.stringify({ ...JSON.parse(output.receiptBytes.toString()), sourceInit })}\n`,
			);
		return {
			...output,
			nativeBytes,
			sourceBytes,
			canonicalReceiptBytes,
			requestBytes,
			historyBytes,
			assetProofBytes,
			finishingProofBytes,
			finishingImages,
			provenance,
		};
	}
	return {
		// Explicit recovery of one already submitted source edit. No readiness
		// connection, upload, websocket, or prompt submission occurs here.
		async recoverSource(
			value: Parameters<typeof prepareComfySource>[0],
			pins: z.infer<typeof comfyCompletionRequestSchema>,
			retainedNative?: RetainedComfyNative,
		) {
			try {
				const prepared = prepareComfySource(value, retainedNative);
				const signal = AbortSignal.timeout(30000);
				const historyBytes = await bytes(`/history/${pins.promptId}`, signal);
				const entry = z
					.record(z.string(), z.unknown())
					.parse(JSON.parse(historyBytes.toString()))[pins.promptId];
				if (!entry)
					throw new ComfyError("COMFY_RECOVERY_PENDING", true, pins.promptId);
				const history = historySchema.parse(entry);
				if (!history.status.completed)
					throw new ComfyError("COMFY_RECOVERY_PENDING", true, pins.promptId);
				if (hash(historyBytes) !== pins.historySHA256)
					throw new ComfyError("COMFY_RECOVERY_PROOF_MISMATCH");
				const sourceInit = sourceBinding(
					prepared,
					`source_${hash(prepared.native.rgbBytes)}_${pins.clientId}.png`,
				);
				const input = inputSchema.parse({
					requestId: prepared.request.requestId,
					...(prepared.request.generationProfile
						? { generationProfile: prepared.request.generationProfile }
						: {}),
					workflow: COMFY_SOURCE_WORKFLOW,
					text: prepared.compiled.text,
					textSHA: prepared.compiled.sha,
					seed: COMFY_SOURCE_RECIPE.seed,
					sourceSHA: prepared.compiled.sourceSHA256,
				});
				const graph = workflows[COMFY_SOURCE_WORKFLOW].graph(
					{ ...input, sourceInit },
					`portal_${pins.clientId}`,
				);
				if (
					history.prompt[1] !== pins.promptId ||
					JSON.stringify(history.prompt[2]) !== JSON.stringify(graph) ||
					history.status.status_str !== "success"
				)
					throw new ComfyError("COMFY_RECOVERY_PROOF_MISMATCH");
				const uploaded = await bytes(
					`/view?${new URLSearchParams({ filename: sourceInit.uploadName, type: "input", subfolder: "" })}`,
					signal,
					{},
					8388608,
				);
				if (hash(uploaded) !== sourceInit.nativeRGBSHA)
					throw new ComfyError("COMFY_UPLOAD_HASH_MISMATCH");
				const requestBytes = Buffer.from(
					JSON.stringify({ client_id: pins.clientId, prompt: graph }),
				);
				// These are current read-only asset measurements, not invented retained
				// pre-dispatch receipts. The recovery event records that distinction.
				const assetProofBytes = Buffer.from(
					JSON.stringify(
						verifyMossAssetProof(
							await options.authorize(() =>
								(options.measureAssets ?? measureMossAssets)(
									COMFY_SOURCE_WORKFLOW,
								),
							),
							COMFY_SOURCE_WORKFLOW,
						),
					),
				);
				const finishingProofBytes = Buffer.from(
					JSON.stringify(
						verifyFinishingProof(
							await options.authorize(() =>
								(options.measureFinishing ?? measureFinishingAssets)(),
							),
						),
					),
				);
				const result = await complete(
					input,
					requestBytes,
					historyBytes,
					pins.promptId,
					// SSH file proofs have their own timeout and can outlive the
					// history/input HTTP deadline. Start the output read budget now.
					AbortSignal.timeout(30000),
					assetProofBytes,
					finishingProofBytes,
					sourceInit,
				);
				if (
					!result.finishingImages ||
					hash(result.nativeBytes) !== pins.outputSHA256["9"] ||
					hash(result.finishingImages.maskBytes) !== pins.outputSHA256["11"] ||
					hash(result.finishingImages.rawMaskBytes) !==
						pins.outputSHA256["15"] ||
					hash(result.finishingImages.rawBytes) !== pins.outputSHA256["16"]
				)
					throw new ComfyError("COMFY_RECOVERY_OUTPUT_MISMATCH");
				verifyComfyEvidence({
					...result,
					receipt: comfySourceReceiptSchema.parse(
						JSON.parse(result.canonicalReceiptBytes.toString()),
					),
					sourceInput: value,
					...(retainedNative ? { retainedNative } : {}),
					conditioningBytes: uploaded,
				});
				return result;
			} catch (error) {
				if (
					error instanceof ComfyError &&
					(error.code === "COMFY_HTTP_TIMEOUT" ||
						error.code === "COMFY_HTTP_ABORTED")
				)
					throw new ComfyError(error.code, true, pins.promptId);
				throw error;
			}
		},
		async connect<W extends AnyComfyWorkflow = "moss-image-sft-style-lora.alpha.v1">(
			workflow: W = "moss-image-sft-style-lora.alpha.v1" as W,
		): Promise<ComfyConnection & { workflow: W }> {
			try {
				const spec = workflows[comfyWorkflowSchema.parse(workflow)];
				if (!spec) throw new ComfyError("COMFY_CONNECTION_NOT_READY");
				if (isAlphaWorkflow(workflow))
					verifyFinishingProof(
						await options.authorize(() =>
							(options.measureFinishing ?? measureFinishingAssets)(),
						),
					);
				if (
					mossStyleStrength(workflow) !== undefined ||
					isAlphaWorkflow(workflow)
				)
					verifyMossAssetProof(
						await options.authorize(() =>
							(options.measureAssets ?? measureMossAssets)(workflow),
						),
						workflow,
					);
				const signal = AbortSignal.timeout(10000);
				z.object({ system: z.object({ comfyui_version: z.string() }) }).parse(
					await json("/system_stats", signal),
				);
				const info = z
					.record(z.string(), z.unknown())
					.parse(await json("/object_info", signal));
				if (workflow === COMFY_SOURCE_WORKFLOW) {
					const typed = z.object({
						input: z.object({
							required: z.record(z.string(), z.array(z.unknown())),
						}),
						output: z.array(z.string()),
					});
					for (const [name, output, inputs] of [
						["LoadImage", "IMAGE", {}],
						["VAEEncode", "LATENT", { pixels: "IMAGE", vae: "VAE" }],
						["VAELoader", "VAE", {}],
						[
							"KSampler",
							"LATENT",
							{
								latent_image: "LATENT",
								model: "MODEL",
								positive: "CONDITIONING",
								negative: "CONDITIONING",
							},
						],
						["VAEDecode", "IMAGE", { samples: "LATENT", vae: "VAE" }],
					] as const) {
						const definition = typed.parse(info[name]);
						if (definition.output[0] !== output)
							throw Error("source node output mismatch");
						for (const [key, type] of Object.entries(inputs))
							if (definition.input.required[key]?.[0] !== type)
								throw Error("source node input mismatch");
					}
				}
				// Every node class the graph uses must exist and every required
				// input must be satisfiable: in particular the workflow's exact
				// diffusion/encoder/VAE filenames must be installed choices.
				for (const node of Object.values(
					spec.graph(
						{
							requestId: randomUUID(),
							workflow,
							text: "readiness",
							textSHA: "0".repeat(64),
							seed: 0,
							sourceSHA: "0".repeat(64),
							...(workflow === COMFY_SOURCE_WORKFLOW
								? { sourceInit: readinessSource }
								: {}),
						},
						"readiness",
					),
				)) {
					const definition = nodeInfo.parse(info[node.class_type]);
					for (const [name, contract] of Object.entries(
						definition.input.required,
					)) {
						const value = node.inputs[name];
						if (
							value === undefined ||
							(Array.isArray(contract[0]) &&
								!(
									workflow === COMFY_SOURCE_WORKFLOW &&
									node.class_type === "LoadImage" &&
									name === "image"
								) &&
								!contract[0].includes(value))
						)
							throw Error("workflow unavailable");
					}
				}
				if (nodeInfo.parse(Reflect.get(info, "SaveImage")).output_node !== true)
					throw Error("terminal unavailable");
				const connection: ComfyConnection & { workflow: W } = Object.freeze({
					provider: "comfyui",
					endpoint: COMFY_ENDPOINT,
					workflow,
					models: spec.models,
					state: "READY",
				});
				connections.add(connection);
				return connection;
			} catch {
				throw new ComfyError("COMFY_CONNECTION_NOT_READY");
			}
		},
		async generate(
			connection: ComfyConnection,
			value: ComfyPortraitRequest | Parameters<typeof prepareComfySource>[0],
			callerSignal?: AbortSignal,
		) {
			if (!connections.has(connection))
				throw new ComfyError("COMFY_CONNECTION_NOT_READY");
			const prepared =
				"request" in value ? prepareComfySource(value) : undefined;
			if (
				!prepared &&
				"workflow" in value &&
				value.workflow === COMFY_SOURCE_WORKFLOW
			)
				throw new ComfyError("REFERENCE_NOT_ACQUIRED");
			const parsed = inputSchema.safeParse(
				prepared
					? {
							requestId: prepared.request.requestId,
							...(prepared.request.generationProfile
								? { generationProfile: prepared.request.generationProfile }
								: {}),
							workflow: COMFY_SOURCE_WORKFLOW,
							text: prepared.compiled.text,
							textSHA: prepared.compiled.sha,
							seed: COMFY_SOURCE_RECIPE.seed,
							sourceSHA: prepared.compiled.sourceSHA256,
						}
					: value,
			);
			if (!parsed.success) throw new ComfyError("COMFY_INVALID_REQUEST");
			const input = parsed.data;
			if (input.generationProfile && !isAlphaWorkflow(input.workflow))
				throw new ComfyError("COMFY_GENERATION_SIZE_UNSUPPORTED");
			if (
				mossStyleStrength(input.workflow) !== undefined &&
				!input.text.startsWith(`${MOSS_STYLE_TRIGGER}. `)
			)
				throw new ComfyError("COMFY_INVALID_REQUEST");
			// The connection proved readiness for one workflow only.
			if (input.workflow !== connection.workflow)
				throw new ComfyError("COMFY_CONNECTION_NOT_READY");
			const spec = workflows[input.workflow],
				deadline = AbortSignal.timeout(300000);
			const signal = callerSignal
				? AbortSignal.any([callerSignal, deadline])
				: deadline;
			if (!spec) throw new ComfyError("COMFY_INVALID_REQUEST");
			let finishingProofBytes: Buffer | undefined;
			if (isAlphaWorkflow(input.workflow)) {
				try {
					finishingProofBytes = Buffer.from(
						JSON.stringify(
							verifyFinishingProof(
								await options.authorize(() =>
									(options.measureFinishing ?? measureFinishingAssets)(),
								),
							),
						),
					);
				} catch {
					throw new ComfyError("COMFY_FINISH_ASSET_MISMATCH");
				}
			}
			const clientId = randomUUID(),
				prefix = `portal_${clientId}`;
			let assetProofBytes: Buffer | undefined;
			if (
				mossStyleStrength(input.workflow) !== undefined ||
				isAlphaWorkflow(input.workflow)
			) {
				try {
					assetProofBytes = Buffer.from(
						JSON.stringify(
							verifyMossAssetProof(
								await options.authorize(() =>
									(options.measureAssets ?? measureMossAssets)(input.workflow),
								),
								input.workflow,
							),
						),
					);
				} catch {
					throw new ComfyError("COMFY_ASSET_MISMATCH");
				}
			}
			let sourceInit: SourceInit | undefined;
			if (prepared) {
				const name = `source_${hash(prepared.native.rgbBytes)}_${clientId}.png`;
				const form = new FormData();
				form.append(
					"image",
					new Blob([prepared.native.rgbBytes], { type: "image/png" }),
					name,
				);
				form.append("type", "input");
				form.append("overwrite", "false");
				const upload = z
					.strictObject({
						name: z.literal(name),
						subfolder: z.literal(""),
						type: z.literal("input"),
					})
					.safeParse(
						await json("/upload/image", signal, { method: "POST", body: form }),
					);
				if (!upload.success) throw new ComfyError("COMFY_UPLOAD_MISMATCH");
				const uploaded = await bytes(
					`/view?${new URLSearchParams({ filename: name, subfolder: "", type: "input" })}`,
					signal,
					{},
					8388608,
				);
				if (hash(uploaded) !== hash(prepared.native.rgbBytes))
					throw new ComfyError("COMFY_UPLOAD_HASH_MISMATCH");
				sourceInit = sourceBinding(prepared, name);
			}
			const graph = spec.graph(
				{ ...input, ...(sourceInit ? { sourceInit } : {}) },
				prefix,
			);
			const requestBytes = Buffer.from(
				JSON.stringify({ client_id: clientId, prompt: graph }),
			);
			let submitted = false,
				promptId: string | null = null,
				opened = false,
				failed = false;
			const events: z.infer<typeof eventSchema>[] = [];
			let notify = () => {};
			const wake = () => notify();
			const onOpen = () => {
				opened = true;
				wake();
			};
			const onFailure = () => {
				failed = true;
				wake();
			};
			const onMessage = (event: MessageEvent) => {
				if (typeof event.data !== "string" || event.data.length > 65536) return;
				try {
					const parsed = eventSchema.safeParse(JSON.parse(event.data));
					if (
						!parsed.success ||
						!["execution_error", "execution_interrupted", "executing"].includes(
							parsed.data.type,
						)
					)
						return;
					if (
						parsed.data.type === "executing" &&
						parsed.data.data.node !== null
					)
						return;
					if (events.length >= 256) {
						onFailure();
						return;
					}
					events.push(parsed.data);
					wake();
				} catch {
					/* Ignore previews and non-job messages. */
				}
			};
			const socket = options.authorize(() =>
				transport.webSocket(
					`${COMFY_ENDPOINT.replace("http:", "ws:")}/ws?clientId=${clientId}`,
				),
			);
			const changed = () =>
				new Promise<void>((resolve) => {
					notify = resolve;
				});
			socket.addEventListener("open", onOpen);
			socket.addEventListener("message", onMessage);
			socket.addEventListener("error", onFailure);
			socket.addEventListener("close", onFailure);
			signal.addEventListener("abort", wake);
			try {
				while (!opened) {
					signal.throwIfAborted();
					if (failed) throw new ComfyError("COMFY_SOCKET_FAILURE");
					await changed();
				}
				signal.throwIfAborted();
				if (failed) throw new ComfyError("COMFY_SOCKET_FAILURE");
				submitted = true;
				const accepted = z
					.object({
						prompt_id: z.uuid(),
						node_errors: z.record(z.string(), z.unknown()).optional(),
					})
					.parse(
						await json("/prompt", signal, {
							method: "POST",
							headers: { "content-type": "application/json" },
							body: requestBytes,
						}),
					);
				promptId = accepted.prompt_id;
				if (Object.keys(accepted.node_errors ?? {}).length)
					throw new ComfyError("COMFY_EXECUTION_FAILED", false, promptId);
				for (;;) {
					signal.throwIfAborted();
					const terminal = events.find(
						(event) => event.data.prompt_id === promptId,
					);
					if (terminal) {
						if (
							["execution_error", "execution_interrupted"].includes(
								terminal.type,
							)
						)
							throw new ComfyError("COMFY_EXECUTION_FAILED", false, promptId);
						break;
					}
					if (failed)
						throw new ComfyError("COMFY_SOCKET_FAILURE", true, promptId);
					await changed();
				}
				const historyBytes = await bytes(`/history/${promptId}`, signal);
				return await complete(
					input,
					requestBytes,
					historyBytes,
					promptId,
					signal,
					assetProofBytes,
					finishingProofBytes,
					sourceInit,
				);
			} catch (error) {
				if (error instanceof ComfyError)
					throw new ComfyError(
						error.code,
						error.uncertain || (submitted && error.promptId === null),
						promptId,
					);
				throw new ComfyError("COMFY_GENERATION_FAILED", submitted, promptId);
			} finally {
				signal.removeEventListener("abort", wake);
				socket.removeEventListener("open", onOpen);
				socket.removeEventListener("message", onMessage);
				socket.removeEventListener("error", onFailure);
				socket.removeEventListener("close", onFailure);
				socket.close();
			}
		},
	};
}
