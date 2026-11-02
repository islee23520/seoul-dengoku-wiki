import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { MOSS_MALE_LORA, MOSS_MALE_WORKFLOW } from "./comfyui-assets.ts";
import {
	COMFY_PROMPT_COMPILER,
	type CompiledComfyPrompt,
	compileComfyPortraitPrompt,
} from "./comfyui-prompt.ts";
import {
	type ComfyConnection,
	ComfyError,
	type createComfyProvider,
	prepareComfySource,
} from "./comfyui-provider.ts";
import type { McpPortraitInput } from "./mcp.ts";
import { PORTRAIT_SIZE } from "./png.ts";
import {
	COMFY_SOURCE_WORKFLOW,
	type ComfyProviderModel,
	opaqueWorkflow,
} from "./provider-models.ts";
import {
	referenceGenerationRequestSchema,
	resolveReferenceSource,
} from "./reference-contract.ts";
import {
	adaptSheet,
	generationSheetFromBytes,
	type Template,
} from "./sources.ts";

// Server-only v2 source boundary. No projections, caller graphs, receipts or
// caller acquisition status are accepted as semantic authority.
export async function dispatchComfySourceV2(
	input: { request: unknown; denoise: number },
	options: Parameters<typeof dispatchComfy>[1] & { serverEvidence: unknown },
) {
	const sourceInput = structuredClone({
		...input,
		serverEvidence: options.serverEvidence,
	});
	const prepared = prepareComfySource(sourceInput);
	if (options.connection.workflow !== COMFY_SOURCE_WORKFLOW)
		throw new ComfyError("COMFY_CONNECTION_NOT_READY");
	const store = (name: string, data: Uint8Array | string) =>
		writeFile(join(options.directory, name), data, { flag: "wx", mode: 0o600 });
	await store("reference-request.json", JSON.stringify(prepared.request));
	await store("reference-original.png", prepared.originalBytes);
	await store("reference-native.png", prepared.native.rgbaBytes);
	await store("reference-conditioning.png", prepared.native.rgbBytes);
	await store(
		"reference-transform.json",
		JSON.stringify(prepared.native.receipt),
	);
	await store("reference-records.json", JSON.stringify(prepared.records));
	await store("comfy-prompt.txt", prepared.compiled.text);
	await store("comfy-prompt.json", JSON.stringify(prepared.compiled));
	try {
		const result = await options.provider.generate(
			options.connection,
			sourceInput,
			options.signal,
		);
		await store("comfy-request.json", result.requestBytes);
		await store("comfy-history.json", result.historyBytes);
		if (result.assetProofBytes)
			await store("comfy-assets.json", result.assetProofBytes);
		if (result.finishingProofBytes)
			await store("comfy-finishing-assets.json", result.finishingProofBytes);
		if (result.finishingImages) {
			await store("provider-raw.png", result.finishingImages.rawBytes);
			await store("provider-mask.png", result.finishingImages.maskBytes);
			await store("provider-raw-mask.png", result.finishingImages.rawMaskBytes);
		}
		await store("provider-native.png", result.nativeBytes);
		await store("provider-source.png", result.sourceBytes);
		await store(
			"provider-canonical.receipt.json",
			result.canonicalReceiptBytes,
		);
		await store("candidate.png.receipt.json", result.receiptBytes);
		await store("candidate.png", result.bytes);
		await store(
			"comfy-response.json",
			JSON.stringify({
				transport: "comfyui-http",
				status: "success",
				...result.provenance,
			}),
		);
		return result;
	} catch (error) {
		const failure =
			error instanceof ComfyError
				? error
				: new ComfyError("COMFY_GENERATION_FAILED");
		await store(
			"comfy-response.json",
			JSON.stringify({
				transport: "comfyui-http",
				workflow: COMFY_SOURCE_WORKFLOW,
				code: failure.code,
				uncertain: failure.uncertain,
				promptId: failure.promptId,
			}),
		);
		throw failure;
	}
}

// Internal server boundary: public input cannot supply evidence or a resolved
// status label. Resolve again from retained bytes before any job artifact exists.
export async function dispatchComfyTokenV2(
	input: {
		request: unknown;
		seed: number;
		projection?: McpPortraitInput["projection"];
	},
	options: Parameters<typeof dispatchComfy>[1] & {
		serverEvidence: unknown;
		detailBytes: Uint8Array;
		template: Template;
	},
) {
	const source = resolveReferenceSource(input.request, options.serverEvidence);
	if (source.status !== "intentional-absence")
		throw Error(
			source.status === "failed" || source.status === "unresolved"
				? source.errorCode
				: "MODE_SOURCE_MISMATCH",
		);
	const request = referenceGenerationRequestSchema.parse(input.request);
	const workflow = options.connection.workflow;
	if (
		request.provider !== "comfyui" ||
		request.providerModel !== `comfyui:${workflow}` ||
		opaqueWorkflow(workflow) !== MOSS_MALE_WORKFLOW
	)
		throw new ComfyError("COMFY_CONNECTION_NOT_READY");
	const sheet = generationSheetFromBytes(
		options.detailBytes,
		source.generation.tokenBytes,
		null,
	);
	const { projection } = adaptSheet(
		sheet,
		options.template,
		request.requestId,
		request.faceMode,
		request.providerModel,
	);
	if (input.projection && !isDeepStrictEqual(input.projection, projection))
		throw Error("REFERENCE_TOKEN_MISMATCH");
	return dispatchComfyInternal(
		{
			projection,
			requestId: request.requestId,
			providerModel: `comfyui:${workflow}`,
			seed: input.seed,
			...(request.generationProfile === "native340-v1"
				? { generationProfile: request.generationProfile }
				: {}),
		},
		options,
		{
			schemaVersion: 2,
			inputMode: source.generation.inputMode,
			sourceStatus: source.status,
			personId: source.generation.personId,
			characterId: source.generation.characterId,
			tokenSHA256: source.generation.tokenSHA256,
			derivedLookSHA256: projection.sourceSHA,
			recipientImageSHA256: null,
			styleAdapterSHA256: MOSS_MALE_LORA.sha256,
		},
	);
}

// Evidence belongs to the exact owner-private job directory. The retained
// authored projection is the only generation input: the graph encodes a
// portrait prompt compiled deterministically from it (comfy-prompt.txt), and
// no wiki PNG, reference image or API key travels to ComfyUI. The adapter
// binds one submission to its prompt id, exact history graph and terminal
// image; this module only persists what came back under truthful ComfyUI labels.
export async function dispatchComfy(
	input: {
		generationProfile?: "native340-v1";
		projection: McpPortraitInput["projection"];
		requestId: string;
		providerModel: ComfyProviderModel;
		seed: number;
	},
	options: {
		directory: string;
		provider: ReturnType<typeof createComfyProvider>;
		connection: ComfyConnection;
		signal?: AbortSignal;
	},
) {
	return dispatchComfyInternal(input, options);
}

async function dispatchComfyInternal(
	input: Parameters<typeof dispatchComfy>[0],
	options: Parameters<typeof dispatchComfy>[1],
	tokenSource?: {
		schemaVersion: 2;
		inputMode: "token-only";
		sourceStatus: "intentional-absence";
		personId: string;
		characterId: string;
		tokenSHA256: string;
		derivedLookSHA256: string;
		recipientImageSHA256: null;
		styleAdapterSHA256: string;
	},
) {
	const store = (name: string, bytes: Uint8Array | string) =>
		writeFile(join(options.directory, name), bytes, {
			flag: "wx",
			mode: 0o600,
		});
	const { projection } = input;
	// The connection proved readiness for exactly one workflow; the request
	// names the same one or nothing is compiled or stored.
	const workflow = options.connection.workflow;
	if (
		workflow === COMFY_SOURCE_WORKFLOW ||
		`comfyui:${workflow}` !== input.providerModel
	)
		throw new ComfyError("COMFY_CONNECTION_NOT_READY");
	await store("projection.txt", projection.text);
	await store("projection.json", JSON.stringify(projection));
	let compiled: CompiledComfyPrompt;
	try {
		compiled = compileComfyPortraitPrompt(projection.rendering, workflow);
	} catch {
		const failure = new ComfyError("COMFY_PROMPT_INPUT_INVALID", false);
		await store(
			"comfy-response.json",
			JSON.stringify({
				transport: "comfyui-http",
				workflow,
				code: failure.code,
				uncertain: false,
				promptId: null,
			}),
		);
		throw failure;
	}
	await store("comfy-prompt.txt", compiled.text);
	await store(
		"comfy-prompt.json",
		`${JSON.stringify(
			{
				compiler: compiled.compiler,
				workflow,
				promptSHA: compiled.sha,
				textSHA: projection.textSHA,
				renderingSHA: projection.renderingSHA,
				chars: compiled.text.length,
				limit: compiled.limit,
				fields: compiled.fields,
				dropped: compiled.dropped,
			},
			null,
			2,
		)}\n`,
	);
	await store(
		"candidate.png.request.json",
		`${JSON.stringify(
			{
				requestId: input.requestId,
				provider: "comfyui",
				workflow,
				model: input.providerModel,
				prompt: compiled.text,
				promptSHA: compiled.sha,
				promptCompiler: COMFY_PROMPT_COMPILER,
				textSHA: projection.textSHA,
				renderingSHA: projection.renderingSHA,
				sourceSHA: projection.sourceSHA,
				referenceHashes: [],
				referenceImages: [],
				...(tokenSource ? { tokenSource } : {}),
				seed: input.seed,
				size: PORTRAIT_SIZE,
				providerSize: input.generationProfile ? "352x512" : "1024x1536",
				...(input.generationProfile
					? { generationProfile: input.generationProfile }
					: {}),
				transport: "comfyui-http",
				inputs:
					"portrait prompt compiled from the authored projection only; no reference images",
			},
			null,
			2,
		)}\n`,
	);
	try {
		const result = await options.provider.generate(
			options.connection,
			{
				requestId: input.requestId,
				...(input.generationProfile
					? { generationProfile: input.generationProfile }
					: {}),
				workflow,
				text: compiled.text,
				textSHA: projection.textSHA,
				seed: input.seed,
				sourceSHA: projection.sourceSHA,
			},
			options.signal,
		);
		await store("comfy-request.json", result.requestBytes);
		await store("comfy-history.json", result.historyBytes);
		if (result.finishingProofBytes)
			await store("comfy-finishing-assets.json", result.finishingProofBytes);
		if (result.finishingImages) {
			await store("provider-raw.png", result.finishingImages.rawBytes);
			await store("provider-mask.png", result.finishingImages.maskBytes);
			await store("provider-raw-mask.png", result.finishingImages.rawMaskBytes);
		}
		if (result.assetProofBytes)
			await store("comfy-assets.json", result.assetProofBytes);
		await store("provider-native.png", result.nativeBytes);
		await store("provider-source.png", result.sourceBytes);
		await store(
			"provider-canonical.receipt.json",
			result.canonicalReceiptBytes,
		);
		await store(
			"comfy-response.json",
			JSON.stringify({
				transport: "comfyui-http",
				workflow,
				promptId: result.provenance.promptId,
				promptSHA: compiled.sha,
				status: "success",
				nativeBytes: result.nativeBytes.length,
				nativeSHA: result.provenance.nativeSHA,
				sourcePngSHA: result.provenance.sourcePngSHA,
				requestSHA: result.provenance.requestSHA,
				historySHA: result.provenance.historySHA,
			}),
		);
		await store("candidate.png.receipt.json", result.receiptBytes);
		await store("candidate.png", result.bytes);
		return {
			bytes: result.bytes,
			responseSHA: result.responseSHA,
			receiptBytes: result.receiptBytes,
			responseBytes: result.nativeBytes,
			provenance: result.provenance,
		};
	} catch (error) {
		const failure =
			error instanceof ComfyError
				? error
				: new ComfyError("COMFY_GENERATION_FAILED", false);
		await store(
			"comfy-response.json",
			JSON.stringify({
				transport: "comfyui-http",
				workflow,
				promptSHA: compiled.sha,
				code: failure.code,
				uncertain: failure.uncertain,
				promptId: failure.promptId,
			}),
		);
		throw failure;
	}
}
