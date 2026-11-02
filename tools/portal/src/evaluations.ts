import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
	link,
	lstat,
	mkdir,
	open,
	readdir,
	realpath,
	unlink,
} from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { z } from "zod";
import { decodePng } from "../../portrait/acceptance/src/png.ts";
import {
	ALPHA_PROCESSOR_V1,
	ALPHA_PROCESSOR_V2,
	alphaDerivative,
} from "./alpha-derivative.ts";
import {
	readBatch,
	readBatchSnapshot,
	resolveBatchBinding,
} from "./batches.ts";
import { comfyCompletionArtifact } from "./comfy-completion-recovery.ts";
import { compileComfyPortraitPrompt } from "./comfyui-prompt.ts";
import {
	comfyReceiptSchema,
	comfySourceReceiptSchema,
	legacyComfyReceiptSchema,
	prepareComfySource,
	verifyComfyEvidence,
} from "./comfyui-provider.ts";
import { evaluateDeliveryAlpha, measurePng, resizePortraitPng } from "./png.ts";
import {
	deliveryTransformationSchemaV2,
	native340Output,
	native340TransformationSchema,
	portraitTransformationSchema,
	verifyPortraitDeliveryV2,
} from "./portrait-size.ts";
import { transformReferencePng } from "./reference-transform.ts";
import { verifyReferenceWorkbenchResult } from "./reference-workbench.ts";
import { generationSheetFromBytes, sheetFromBytes } from "./sources.ts";
import { executionJobSchema } from "./terminal-rejection-proof.ts";
import { readExecutionJobV1 } from "./terminal-rejections.ts";

// New source workflow boundary, intentionally separate from legacy projection
// evaluation. Retained server evidence is required, not a self-asserted receipt.
export function verifyComfySourceResult(
	input: Omit<Parameters<typeof verifyComfyEvidence>[0], "receipt"> & {
		canonicalReceiptBytes: Uint8Array;
		deliveryReceiptBytes: Uint8Array;
		deliveryBytes: Uint8Array;
	},
) {
	const canonical = comfySourceReceiptSchema.parse(
		JSON.parse(Buffer.from(input.canonicalReceiptBytes).toString()),
	);
	const delivery = comfySourceReceiptSchema
		.extend({
			transformation: z.union([
				portraitTransformationSchema,
				deliveryTransformationSchemaV2,
				native340TransformationSchema,
			]),
		})
		.parse(JSON.parse(Buffer.from(input.deliveryReceiptBytes).toString()));
	verifyComfyEvidence({ ...input, receipt: canonical });
	if ("schema" in delivery.transformation) {
		if (!input.sourceInput || !input.finishingImages)
			throw Error("RESULT_EVIDENCE_MISMATCH");
		const prepared = prepareComfySource(input.sourceInput);
		const alpha = verifyPortraitDeliveryV2({
			...(prepared.request.generationProfile
				? { generationProfile: prepared.request.generationProfile }
				: {}),
			engine: "comfyui",
			originalBytes: prepared.originalBytes,
			nativeBytes: prepared.native.rgbaBytes,
			rawBytes: input.finishingImages.rawBytes,
			finishedBytes: input.sourceBytes,
			canonicalReceiptBytes: input.canonicalReceiptBytes,
			deliveryBytes: input.deliveryBytes,
			deliveryReceiptBytes: input.deliveryReceiptBytes,
		});
		return {
			receipt: delivery,
			alpha,
			reviewStatus: "HOLD" as const,
			gpuQualityQualified: false as const,
		};
	}
	const expected = resizePortraitPng(input.sourceBytes);
	const { transformation, ...delivered } = delivery;
	if (
		sha(expected) !== sha(input.deliveryBytes) ||
		JSON.stringify({ ...delivered, responseSHA: canonical.responseSHA }) !==
			JSON.stringify(canonical) ||
		delivery.responseSHA !== sha(input.deliveryBytes) ||
		transformation.sourcePngSHA !== sha(input.sourceBytes) ||
		transformation.outputPngSHA !== sha(input.deliveryBytes) ||
		transformation.canonicalReceiptSHA !== sha(input.canonicalReceiptBytes)
	)
		throw Error("RESULT_EVIDENCE_MISMATCH");
	const alpha = evaluateDeliveryAlpha(input.deliveryBytes);
	if (alpha.status === "FAIL") throw Error("DELIVERY_ALPHA_INVALID");
	return {
		receipt: delivery,
		alpha,
		reviewStatus: "HOLD" as const,
		gpuQualityQualified: false as const,
	};
}

// portal-user-batch-contract.v2 evidenceAndEvaluation, using the explicit
// ResultBinding / SubmitEvaluation schemas in portal-batch-evaluation-contract.v1.
const uuid = z.uuid();
const shaSchema = z.string().regex(/^[a-f0-9]{64}$/);
const sha = (bytes: string | Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
const verdict = z.enum(["pass", "needs-change", "hold"]);
const unicodeNotes = (max: number) =>
	z.string().refine((text) => Array.from(text).length <= max);
const category = z.strictObject({
	judgement: verdict,
	notes: unicodeNotes(2000),
});
const categories = z.strictObject({
	"identity-and-face": category,
	"anatomy-and-pose": category,
	"framing-and-composition": category,
	"technique-and-style": category,
	"transparency-and-edges": category,
	"authored-conditions": category,
});
export const submitEvaluationSchema = z
	.strictObject({
		evaluationId: uuid,
		expectedRevision: z
			.number()
			.int()
			.min(0)
			.max(Number.MAX_SAFE_INTEGER - 1),
		pngSHA: shaSchema,
		receiptSHA: shaSchema,
		machineMetricsSHA: shaSchema,
		verdict,
		categories,
		notes: unicodeNotes(8000),
	})
	.refine((input) => {
		const values = Object.values(input.categories);
		const expected = values.every((value) => value.judgement === "pass")
			? "pass"
			: values.some((value) => value.judgement === "needs-change")
				? "needs-change"
				: "hold";
		return (
			input.verdict === expected &&
			values.every(
				(value) =>
					value.judgement !== "needs-change" || value.notes.trim().length > 0,
			)
		);
	});
export type SubmitEvaluation = z.infer<typeof submitEvaluationSchema>;
const jobSchema = executionJobSchema.extend({ payloadSHA: shaSchema });
// GPT (OpenAI-compatible) delivery receipt contract, unchanged.
const gptReceiptSchema = z.strictObject({
	requestId: uuid,
	model: z.literal("gpt-image-2.5-sunburst"),
	textSHA: shaSchema,
	renderingSHA: shaSchema,
	sourceSHA: shaSchema,
	referenceHashes: z.array(shaSchema).min(1).max(20),
	responseSHA: shaSchema,
	status: z.literal(200),
	reviewStatus: z.literal("candidate-unreviewed"),
	transformation: portraitTransformationSchema.optional(),
});
// ComfyUI text-draft delivery receipt: its own provider/workflow/prompt
// identity, `status: "draft"` and no rendering or reference transport. It is
// never parsed as GPT evidence and a GPT receipt never parses as ComfyUI.
const comfyDeliveryReceiptSchema = comfyReceiptSchema.extend({
	transformation: portraitTransformationSchema.optional(),
});
const retainedComfyReceiptSchema = z.union([
	comfyReceiptSchema,
	legacyComfyReceiptSchema,
]);
const receiptSchema = z.union([
	gptReceiptSchema,
	comfyDeliveryReceiptSchema,
	legacyComfyReceiptSchema.extend({
		transformation: portraitTransformationSchema.optional(),
	}),
]);
const comfyCanonicalKeys = Object.keys(comfyReceiptSchema.shape).filter(
	(key) => key !== "responseSHA",
);
const batchSchema = z.strictObject({
	ownerId: z.string().regex(/^\d+$/),
	requestId: uuid,
	batchId: uuid,
	itemId: uuid,
	snapshotSHA: shaSchema,
});
export type VerifiedBatchBinding = z.infer<typeof batchSchema>;
const batchMarkerSchema = batchSchema.extend({
	schema: z.literal("portal-job-batch-binding.v1"),
});
const snapshotFiles = [
	"source-bytes.json",
	"provenance.json",
	"projection.json",
	"projection.txt",
	"candidate.png.request.json",
] as const;
const snapshotSchema = z.strictObject({
	schema: z.literal("portal-result-snapshot.v1"),
	ownerId: z.string().regex(/^\d+$/),
	requestId: uuid,
	files: z
		.object({
			"source-bytes.json": shaSchema,
			"provenance.json": shaSchema,
			"projection.json": shaSchema.optional(),
			"projection.txt": shaSchema.optional(),
			"candidate.png.request.json": shaSchema.optional(),
		})
		.catchall(shaSchema),
});
const resultSchema = z.strictObject({
	schema: z.literal("portal-generated-result.v1"),
	size: z.enum(["1024x1536", "340x510"]).optional(),
	ownerId: z.string().regex(/^\d+$/),
	jobId: uuid,
	batchId: uuid.nullable(),
	itemId: uuid.nullable(),
	snapshotSHA: shaSchema,
	pngSHA: shaSchema,
	receiptSHA: shaSchema,
	imageUrl: z.string(),
	machineEvidence: z.strictObject({
		schema: z.literal("portal-result-metrics.v1"),
		pngSHA: shaSchema,
		receiptSHA: shaSchema,
		metricsSHA: shaSchema,
		measuredAt: z.iso.datetime(),
		metrics: z.custom<ReturnType<typeof measurePng>>(
			(value) => typeof value === "object" && value !== null,
		),
	}),
	reviewStatus: z.literal("HOLD"),
	approval: z.literal("NONE"),
});
export type ResultBinding = z.infer<typeof resultSchema>;
export const alphaParentSchema = z.strictObject({
	pngSHA: shaSchema,
	receiptSHA: shaSchema,
	snapshotSHA: shaSchema,
	machineMetricsSHA: shaSchema,
});
const alphaReceiptSchema = z.strictObject({
	schema: z.literal("portal-alpha-derivative.v1"),
	derivativeId: uuid,
	ownerId: z.string().regex(/^\d+$/),
	jobId: uuid,
	parent: alphaParentSchema,
	nativeSHA: shaSchema,
	pngSHA: shaSchema,
	createdAt: z.iso.datetime(),
	processor: z.enum([ALPHA_PROCESSOR_V1, ALPHA_PROCESSOR_V2]),
	width: z.literal(340),
	height: z.literal(510),
	reviewStatus: z.literal("HOLD"),
	approval: z.literal("NONE"),
	quality: z.literal("OWNER_REVIEW_REQUIRED"),
});
const evaluationSchema = z.strictObject({
	schema: z.literal("portal-result-evaluation.v1"),
	evaluationId: uuid,
	jobId: uuid,
	batchId: uuid.nullable(),
	itemId: uuid.nullable(),
	snapshotSHA: shaSchema,
	pngSHA: shaSchema,
	receiptSHA: shaSchema,
	machineMetricsSHA: shaSchema,
	reviewerId: z.string().regex(/^\d+$/),
	reviewedAt: z.iso.datetime(),
	revision: z.number().int().positive(),
	previousRevision: z.number().int().nonnegative(),
	verdict,
	categories,
	notes: unicodeNotes(8000),
	payloadSHA: shaSchema,
	approval: z.literal("NONE"),
});
export type Evaluation = z.infer<typeof evaluationSchema>;
const locks = new Map<string, Promise<void>>();
function fail(code: string, status = 409): never {
	throw Object.assign(Error(code), { status });
}
function parse<T>(schema: z.ZodType<T>, value: unknown, code: string): T {
	const parsed = schema.safeParse(value);
	if (!parsed.success) fail(code, code === "INVALID_INPUT" ? 422 : 409);
	return parsed.data;
}
function json(bytes: Uint8Array, code: string): unknown {
	try {
		return JSON.parse(Buffer.from(bytes).toString("utf8"));
	} catch {
		fail(code);
	}
}
function missing(error: unknown) {
	return error instanceof Error && "code" in error && error.code === "ENOENT";
}
async function serialized<T>(
	key: string,
	action: () => Promise<T>,
): Promise<T> {
	const previous = locks.get(key) ?? Promise.resolve();
	const release = Promise.withResolvers<void>();
	const tail = previous.then(() => release.promise);
	locks.set(key, tail);
	await previous;
	try {
		return await action();
	} finally {
		release.resolve();
		if (locks.get(key) === tail) locks.delete(key);
	}
}
async function publish(directory: string, name: string, value: unknown) {
	const temporary = join(directory, `.evaluation-${randomUUID()}.tmp`);
	const file = await open(temporary, "wx", 0o600);
	try {
		await file.writeFile(`${JSON.stringify(value)}\n`);
		await file.sync();
	} finally {
		await file.close();
	}
	try {
		await link(temporary, join(directory, name));
	} finally {
		await unlink(temporary);
	}
	// Windows cannot fsync a directory handle. The file itself was flushed
	// before the atomic, exclusive hard-link publication above.
	if (process.platform !== "win32") {
		const parent = await open(directory, "r");
		try {
			await parent.sync();
		} finally {
			await parent.close();
		}
	}
}

export function createEvaluationStore(options: {
	// Supply only the canonical owner directory derived by the verified session
	// and trusted storage root. This API does not authenticate HTTP requests.
	ownerRoot: string;
	ownerId: string;
}) {
	const ownerRoot = resolve(options.ownerRoot);
	const ownerId = options.ownerId;
	if (!/^\d+$/.test(ownerId) || basename(ownerRoot) !== ownerId)
		fail("INVALID_PATH", 400);
	async function directory(requestId: string) {
		parse(uuid, requestId, "INVALID_INPUT");
		const path = join(ownerRoot, "jobs", requestId);
		try {
			for (const current of [ownerRoot, join(ownerRoot, "jobs"), path]) {
				if (
					(await lstat(current)).isSymbolicLink() ||
					(await realpath(current)) !== current
				)
					fail("INVALID_PATH", 400);
			}
		} catch (error) {
			if (missing(error)) fail("NOT_FOUND", 404);
			throw error;
		}
		return path;
	}
	async function bytes(directory: string, name: string, unavailable: string) {
		try {
			const file = await open(
				await comfyCompletionArtifact(directory, name),
				constants.O_RDONLY | constants.O_NOFOLLOW,
			);
			try {
				if (!(await file.stat()).isFile()) fail("INVALID_PATH", 400);
				return await file.readFile();
			} finally {
				await file.close();
			}
		} catch (error) {
			if (missing(error))
				fail(unavailable, unavailable === "NOT_FOUND" ? 404 : 409);
			if (error instanceof Error && "code" in error && error.code === "ELOOP")
				fail("INVALID_PATH", 400);
			throw error;
		}
	}
	async function artifacts(
		dir: string,
		requestId: string,
		sealed?: ResultBinding,
	) {
		const job = parse(
			jobSchema,
			(await readExecutionJobV1(ownerRoot, requestId)).job,
			"RESULT_NOT_AVAILABLE",
		);
		if (
			job.id !== requestId ||
			job.state !== "HOLD" ||
			!job.imageUrl ||
			job.reviewStatus !== "HOLD"
		)
			fail("RESULT_NOT_AVAILABLE");
		const png = await bytes(dir, "candidate.png", "RESULT_NOT_AVAILABLE");
		const receiptBytes = await bytes(
			dir,
			"candidate.png.receipt.json",
			"RESULT_NOT_AVAILABLE",
		);
		const machineBytes = await bytes(
			dir,
			"machine-diagnostics.json",
			"RESULT_NOT_AVAILABLE",
		);
		const pngSHA = sha(png),
			receiptSHA = sha(receiptBytes),
			metricsSHA = sha(machineBytes);
		if (sealed && sealed.pngSHA !== pngSHA) fail("RESULT_HASH_MISMATCH");
		if (
			sealed &&
			(sealed.receiptSHA !== receiptSHA ||
				sealed.machineEvidence.metricsSHA !== metricsSHA)
		)
			fail("RESULT_EVIDENCE_MISMATCH");
		let publicRequest: unknown;
		try {
			await lstat(join(dir, "request-payload.json"));
			publicRequest = json(
				await bytes(dir, "request-payload.json", "RESULT_EVIDENCE_MISMATCH"),
				"RESULT_EVIDENCE_MISMATCH",
			);
		} catch (error) {
			if (!missing(error)) throw error;
		}
		if (
			typeof publicRequest === "object" &&
			publicRequest !== null &&
			"schemaVersion" in publicRequest &&
			publicRequest.schemaVersion === 2 &&
			"inputMode" in publicRequest &&
			publicRequest.inputMode === "reference-img2img"
		) {
			const verified = await verifyReferenceWorkbenchResult(
				(name) => bytes(dir, name, "RESULT_EVIDENCE_MISMATCH"),
				requestId,
			);
			if (
				JSON.stringify(json(machineBytes, "RESULT_EVIDENCE_MISMATCH")) !==
					JSON.stringify(verified.metrics) ||
				JSON.stringify(job.metrics) !== JSON.stringify(verified.metrics)
			)
				fail("RESULT_EVIDENCE_MISMATCH");
			const snapshot = snapshotSchema.parse({
				schema: "portal-result-snapshot.v1",
				ownerId,
				requestId,
				files: verified.files,
			});
			const snapshotSHA = sha(`${JSON.stringify(snapshot)}\n`);
			if (
				sealed &&
				(sealed.ownerId !== ownerId ||
					sealed.jobId !== requestId ||
					sealed.batchId !== null ||
					sealed.itemId !== null ||
					sealed.snapshotSHA !== snapshotSHA)
			)
				fail("SOURCE_SNAPSHOT_MISMATCH");
			return {
				job,
				pngSHA,
				receiptSHA,
				metricsSHA,
				metrics: verified.metrics,
				snapshot,
				binding: null,
				snapshotSHA,
				retained: verified.retained,
			};
		}
		const receipt = parse(
			receiptSchema,
			json(receiptBytes, "RESULT_EVIDENCE_MISMATCH"),
			"RESULT_EVIDENCE_MISMATCH",
		);
		const comfyReceipt = "provider" in receipt ? receipt : null;
		const gptReceipt = "provider" in receipt ? null : receipt;
		const comfy = comfyReceipt !== null;
		const receiptRecord: Record<string, unknown> = receipt;
		// A Comfy draft is always delivered at 340x510 from the retained native
		// 1024x1536 output, so its transformation binding is mandatory.
		if (comfy && !receipt.transformation) fail("RESULT_EVIDENCE_MISMATCH");
		let measured: ReturnType<typeof measurePng>;
		try {
			measured = measurePng(png);
		} catch {
			fail("RESULT_NOT_AVAILABLE");
		}
		let requestedSize: unknown;
		try {
			await lstat(join(dir, "request-payload.json"));
			requestedSize = parse(
				z.object({ size: z.unknown().optional() }),
				json(
					await bytes(dir, "request-payload.json", "NOT_FOUND"),
					"RESULT_EVIDENCE_MISMATCH",
				),
				"RESULT_EVIDENCE_MISMATCH",
			).size;
		} catch (error) {
			if (!missing(error)) throw error;
		}
		if (
			requestedSize !== undefined &&
			requestedSize !== "1024x1536" &&
			requestedSize !== "340x510"
		)
			fail("RESULT_EVIDENCE_MISMATCH");
		const metrics = json(machineBytes, "RESULT_EVIDENCE_MISMATCH");
		if (
			JSON.stringify(metrics) !== JSON.stringify(measured) ||
			JSON.stringify(job.metrics) !== JSON.stringify(measured)
		)
			fail("RESULT_EVIDENCE_MISMATCH");
		if (receipt.requestId !== requestId || receipt.responseSHA !== pngSHA)
			fail("RESULT_EVIDENCE_MISMATCH");
		if (receipt.transformation) {
			const transformation = receipt.transformation;
			const source = await bytes(
				dir,
				"provider-source.png",
				"RESULT_EVIDENCE_MISMATCH",
			);
			const canonicalBytes = await bytes(
				dir,
				"provider-canonical.receipt.json",
				"RESULT_EVIDENCE_MISMATCH",
			);
			const canonical = comfy
				? parse(
						retainedComfyReceiptSchema,
						json(canonicalBytes, "RESULT_EVIDENCE_MISMATCH"),
						"RESULT_EVIDENCE_MISMATCH",
					)
				: parse(
						gptReceiptSchema.omit({ transformation: true }).strip(),
						json(canonicalBytes, "RESULT_EVIDENCE_MISMATCH"),
						"RESULT_EVIDENCE_MISMATCH",
					);
			const canonicalRecord: Record<string, unknown> = canonical;
			if (
				sha(source) !== transformation.sourcePngSHA ||
				sha(canonicalBytes) !== transformation.canonicalReceiptSHA ||
				canonical.responseSHA !== transformation.sourcePngSHA ||
				transformation.outputPngSHA !== pngSHA
			)
				fail("RESULT_EVIDENCE_MISMATCH");
			for (const key of comfy
				? comfyCanonicalKeys
				: [
						"requestId",
						"model",
						"textSHA",
						"renderingSHA",
						"sourceSHA",
						"referenceHashes",
						"status",
						"reviewStatus",
					])
				if (
					JSON.stringify(canonicalRecord[key]) !==
					JSON.stringify(receiptRecord[key])
				)
					fail(
						key === "referenceHashes"
							? "SOURCE_SNAPSHOT_MISMATCH"
							: "RESULT_EVIDENCE_MISMATCH",
					);
			try {
				const resized =
					comfy &&
					"generationProfile" in canonical &&
					canonical.generationProfile === "native340-v1"
						? native340Output(source, "comfyui")
						: resizePortraitPng(source);
				if (comfyReceipt?.workflow === "zimage-turbo-text-draft.v1") {
					const expected = decodePng(resized);
					const actual = decodePng(png);
					if (
						actual.width !== expected.width ||
						actual.height !== expected.height ||
						actual.channels !== expected.channels ||
						!Buffer.from(actual.pixels).equals(Buffer.from(expected.pixels))
					)
						fail("RESULT_EVIDENCE_MISMATCH");
				} else if (sha(resized) !== pngSHA) fail("RESULT_EVIDENCE_MISMATCH");
			} catch {
				fail("RESULT_EVIDENCE_MISMATCH");
			}
			if ("provider" in canonical) {
				// Recompute the Comfy chain from retained bytes: native PNG, exact
				// submitted graph, prompt history and terminal image. Receipt hashes
				// alone are never trusted.
				const evidence = {
					receipt: canonical,
					...("finishing" in canonical && canonical.finishing
						? {
								finishingProofBytes: await bytes(
									dir,
									"comfy-finishing-assets.json",
									"RESULT_EVIDENCE_MISMATCH",
								),
								finishingImages: {
									rawBytes: await bytes(
										dir,
										"provider-raw.png",
										"RESULT_EVIDENCE_MISMATCH",
									),
									maskBytes: await bytes(
										dir,
										"provider-mask.png",
										"RESULT_EVIDENCE_MISMATCH",
									),
									rawMaskBytes: await bytes(
										dir,
										"provider-raw-mask.png",
										"RESULT_EVIDENCE_MISMATCH",
									),
								},
							}
						: {}),
					nativeBytes: await bytes(
						dir,
						"provider-native.png",
						"RESULT_EVIDENCE_MISMATCH",
					),
					sourceBytes: source,
					requestBytes: await bytes(
						dir,
						"comfy-request.json",
						"RESULT_EVIDENCE_MISMATCH",
					),
					historyBytes: await bytes(
						dir,
						"comfy-history.json",
						"RESULT_EVIDENCE_MISMATCH",
					),
					...("assetProofSHA" in canonical &&
					canonical.assetProofSHA !== undefined
						? {
								assetProofBytes: await bytes(
									dir,
									"comfy-assets.json",
									"RESULT_EVIDENCE_MISMATCH",
								),
							}
						: {}),
				};
				try {
					verifyComfyEvidence(evidence);
				} catch {
					fail("RESULT_EVIDENCE_MISMATCH");
				}
			}
		}
		const files = {} as z.infer<typeof snapshotSchema>["files"];
		const content: Partial<Record<(typeof snapshotFiles)[number], Buffer>> = {};
		for (const name of snapshotFiles) {
			const value = await bytes(dir, name, "SOURCE_SNAPSHOT_MISMATCH");
			files[name] = sha(value);
			content[name] = value;
		}
		const request = parse(
			z.object({
				requestId: uuid,
				model: z.string(),
				size: z.enum(["1024x1536", "340x510"]).optional(),
				textSHA: shaSchema,
				renderingSHA: shaSchema,
				sourceSHA: shaSchema,
				referenceHashes: z.array(shaSchema),
				prompt: z.string().optional(),
				rendering: z.record(z.string(), z.unknown()).optional(),
				referenceImages: z.array(z.string()).optional(),
				provider: z.literal("comfyui").optional(),
				workflow: z.string().optional(),
				promptSHA: shaSchema.optional(),
				promptCompiler: z.string().optional(),
				seed: z.number().int().nonnegative().optional(),
			}),
			json(
				content["candidate.png.request.json"] ?? Buffer.alloc(0),
				"RESULT_EVIDENCE_MISMATCH",
			),
			"RESULT_EVIDENCE_MISMATCH",
		);
		const sizes = [sealed?.size, requestedSize, request.size].filter(
			(size) => size !== undefined,
		);
		if (new Set(sizes).size > 1) fail("RESULT_EVIDENCE_MISMATCH");
		for (const size of sizes) {
			const [width, height] = String(size).split("x").map(Number);
			if (measured.width !== width || measured.height !== height)
				fail("RESULT_EVIDENCE_MISMATCH");
		}
		if (sizes.includes("340x510") && !receipt.transformation)
			fail("RESULT_EVIDENCE_MISMATCH");
		const requestRecord: Record<string, unknown> = request;
		for (const key of comfy
			? [
					"requestId",
					"textSHA",
					"promptSHA",
					"promptCompiler",
					"sourceSHA",
					"referenceHashes",
					"workflow",
					"seed",
				]
			: [
					"requestId",
					"model",
					"textSHA",
					"renderingSHA",
					"sourceSHA",
					"referenceHashes",
				])
			if (
				JSON.stringify(requestRecord[key]) !==
				JSON.stringify(receiptRecord[key])
			)
				fail("RESULT_EVIDENCE_MISMATCH");
		if (
			comfyReceipt &&
			(request.provider !== "comfyui" ||
				request.model !== `comfyui:${comfyReceipt.workflow}` ||
				request.referenceImages?.length !== 0)
		)
			fail("RESULT_EVIDENCE_MISMATCH");
		const projection = parse(
			z.object({
				text: z.string(),
				rendering: z.record(z.string(), z.unknown()),
				textSHA: shaSchema,
				renderingSHA: shaSchema,
				sourceSHA: shaSchema,
			}),
			json(
				content["projection.json"] ?? Buffer.alloc(0),
				"RESULT_EVIDENCE_MISMATCH",
			),
			"RESULT_EVIDENCE_MISMATCH",
		);
		// ComfyUI transports text only, so its receipt carries no renderingSHA;
		// the retained projection still binds text and authored source identity.
		if (
			sha(projection.text) !== receipt.textSHA ||
			projection.textSHA !== receipt.textSHA ||
			projection.sourceSHA !== receipt.sourceSHA ||
			(gptReceipt &&
				(sha(JSON.stringify(projection.rendering)) !==
					gptReceipt.renderingSHA ||
					projection.renderingSHA !== gptReceipt.renderingSHA))
		)
			fail("RESULT_EVIDENCE_MISMATCH");
		if (comfyReceipt && "promptSHA" in comfyReceipt) {
			// The Comfy graph encoded a prompt compiled from this projection, not
			// the projection itself. Recompile from the retained projection and
			// reject a receipt or stored prompt text that does not reproduce it;
			// verifyComfyEvidence already bound the graph text to the same hash.
			let compiled: ReturnType<typeof compileComfyPortraitPrompt>;
			try {
				compiled = compileComfyPortraitPrompt(
					projection.rendering,
					comfyReceipt.workflow,
					comfyReceipt.promptCompiler,
				);
			} catch {
				fail("RESULT_EVIDENCE_MISMATCH");
			}
			const storedPrompt = await bytes(
				dir,
				"comfy-prompt.txt",
				"RESULT_EVIDENCE_MISMATCH",
			);
			if (
				compiled.sha !== comfyReceipt.promptSHA ||
				sha(storedPrompt) !== compiled.sha ||
				storedPrompt.toString("utf8") !== compiled.text ||
				(request.prompt !== undefined && request.prompt !== compiled.text)
			)
				fail("RESULT_EVIDENCE_MISMATCH");
			const payload = parse(
				z.object({ requestId: uuid, providerModel: z.string(), seed: z.number().optional() }),
				json(await bytes(dir, "request-payload.json", "RESULT_EVIDENCE_MISMATCH"), "RESULT_EVIDENCE_MISMATCH"),
				"RESULT_EVIDENCE_MISMATCH",
			);
			if (
				payload.requestId !== requestId ||
				payload.providerModel !== request.model ||
				(payload.seed !== undefined && payload.seed !== comfyReceipt.seed) ||
				request.model !== `comfyui:${comfyReceipt.workflow}` ||
				request.promptCompiler !== comfyReceipt.promptCompiler ||
				measured.width !== 340 || measured.height !== 510 || request.size !== "340x510"
			) fail("RESULT_EVIDENCE_MISMATCH");
		}
		const provenance = parse(
			z.object({
				requestId: uuid,
				derivedLookSHA: shaSchema,
				original: z.strictObject({
					detail: shaSchema,
					token: shaSchema,
					image: shaSchema.nullable(),
				}),
			}),
			json(
				content["provenance.json"] ?? Buffer.alloc(0),
				"SOURCE_SNAPSHOT_MISMATCH",
			),
			"SOURCE_SNAPSHOT_MISMATCH",
		);
		const sources = parse(
			z.object({
				detail: z.string(),
				token: z.string(),
				image: z.string().nullable(),
				pins: z.object({ lookSHA: shaSchema }).catchall(z.unknown()),
			}),
			json(
				content["source-bytes.json"] ?? Buffer.alloc(0),
				"SOURCE_SNAPSHOT_MISMATCH",
			),
			"SOURCE_SNAPSHOT_MISMATCH",
		);
		if (provenance.requestId !== requestId) fail("SOURCE_SNAPSHOT_MISMATCH");
		if (
			provenance.derivedLookSHA !== receipt.sourceSHA ||
			sources.pins.lookSHA !== receipt.sourceSHA
		)
			fail("RESULT_EVIDENCE_MISMATCH");
		const retained = { image: null } as {
			detail: Buffer;
			token: Buffer;
			image: Buffer | null;
		};
		for (const key of ["detail", "token", "image"] as const) {
			const encoded = sources[key];
			if (encoded === null) {
				if (key !== "image" || provenance.original.image !== null)
					fail("SOURCE_SNAPSHOT_MISMATCH");
				continue;
			}
			const decoded = Buffer.from(encoded, "base64");
			if (
				decoded.toString("base64") !== encoded ||
				sha(decoded) !== provenance.original[key]
			)
				fail("SOURCE_SNAPSHOT_MISMATCH");
			retained[key] = decoded;
		}
		if (files["projection.txt"] !== receipt.textSHA)
			fail("RESULT_EVIDENCE_MISMATCH");
		const snapshot = snapshotSchema.parse({
			schema: "portal-result-snapshot.v1",
			ownerId,
			requestId,
			files,
		});
		let marker: z.infer<typeof batchMarkerSchema> | null = null;
		try {
			await lstat(join(dir, "batch-binding.json"));
			marker = parse(
				batchMarkerSchema,
				json(
					await bytes(dir, "batch-binding.json", "SOURCE_SNAPSHOT_MISMATCH"),
					"SOURCE_SNAPSHOT_MISMATCH",
				),
				"SOURCE_SNAPSHOT_MISMATCH",
			);
		} catch (error) {
			if (!missing(error)) throw error;
		}
		if (
			marker &&
			(marker.ownerId !== ownerId || marker.requestId !== requestId)
		)
			fail("SOURCE_SNAPSHOT_MISMATCH");
		const batch = await resolveBatchBinding({ ownerRoot, ownerId }, requestId);
		const binding = batch
			? parse(
					batchSchema,
					{ ...batch, ownerId, requestId },
					"SOURCE_SNAPSHOT_MISMATCH",
				)
			: null;
		if (
			binding &&
			(binding.ownerId !== ownerId || binding.requestId !== requestId)
		)
			fail("SOURCE_SNAPSHOT_MISMATCH");
		if (
			marker &&
			(!binding ||
				binding.batchId !== marker.batchId ||
				binding.itemId !== marker.itemId ||
				binding.snapshotSHA !== marker.snapshotSHA)
		)
			fail("SOURCE_SNAPSHOT_MISMATCH");
		if (binding) {
			// Resolve only retained local producer artifacts; a verified membership
			// pointer alone does not prove these job inputs were admitted.
			const admittedBatch = await readBatch(ownerRoot, binding.batchId);
			const item = admittedBatch.items.find(
				(value) => value.itemId === binding.itemId,
			);
			if (!item) fail("SOURCE_SNAPSHOT_MISMATCH");
			const admitted = await readBatchSnapshot(ownerRoot, admittedBatch, item);
			for (const role of ["detail", "token", "image"] as const) {
				if (role === "image" && sources.image === null) {
					const { image: admittedImage } = admitted.files;
					if (
						admitted.snapshot.selection.originalSourceHashes.image !== null ||
						admitted.snapshot.files.image != null ||
						admittedImage != null
					)
						fail("SOURCE_SNAPSHOT_MISMATCH");
					continue;
				}
				if (
					sha(retained[role] ?? Buffer.alloc(0)) !==
					admitted.snapshot.files[role]
				)
					fail("SOURCE_SNAPSHOT_MISMATCH");
			}
			const admittedProjection = parse(
				z.object({
					text: z.string(),
					rendering: z.record(z.string(), z.unknown()),
				}),
				json(
					admitted.files.projection ?? Buffer.alloc(0),
					"SOURCE_SNAPSHOT_MISMATCH",
				),
				"SOURCE_SNAPSHOT_MISMATCH",
			);
			const references = admitted.snapshot.references.map(
				(value) => value.sha256,
			);
			if (
				files["provenance.json"] !== admitted.snapshot.files.provenance ||
				files["projection.json"] !== admitted.snapshot.files.projection ||
				JSON.stringify(sources.pins) !==
					JSON.stringify(
						parse(
							z.object({ lookSHA: shaSchema }).catchall(z.unknown()),
							admitted.snapshot.pins,
							"SOURCE_SNAPSHOT_MISMATCH",
						),
					) ||
				projection.sourceSHA !== admitted.snapshot.files.look ||
				sha(admittedProjection.text) !== files["projection.txt"] ||
				request.prompt !== admittedProjection.text ||
				JSON.stringify(request.rendering) !==
					JSON.stringify(admittedProjection.rendering) ||
				JSON.stringify(request.referenceHashes) !==
					JSON.stringify(references) ||
				request.referenceImages?.length !== references.length
			)
				fail("SOURCE_SNAPSHOT_MISMATCH");
			for (const [index, encoded] of (
				request.referenceImages ?? []
			).entries()) {
				const image = Buffer.from(encoded, "base64");
				if (
					image.toString("base64") !== encoded ||
					sha(image) !== references[index]
				)
					fail("SOURCE_SNAPSHOT_MISMATCH");
			}
		}
		const snapshotSHA =
			binding?.snapshotSHA ?? sha(`${JSON.stringify(snapshot)}\n`);
		if (
			sealed &&
			(sealed.ownerId !== ownerId ||
				sealed.jobId !== requestId ||
				sealed.batchId !== (binding?.batchId ?? null) ||
				sealed.itemId !== (binding?.itemId ?? null) ||
				sealed.snapshotSHA !== snapshotSHA)
		)
			fail("SOURCE_SNAPSHOT_MISMATCH");
		return {
			job,
			pngSHA,
			receiptSHA,
			metricsSHA,
			metrics: measured,
			snapshot,
			binding,
			snapshotSHA,
			retained,
		};
	}
	async function loadVerifiedResult(dir: string, requestId: string) {
		const result = parse(
			resultSchema,
			json(
				await bytes(dir, "result.json", "RESULT_NOT_AVAILABLE"),
				"RESULT_EVIDENCE_MISMATCH",
			),
			"RESULT_EVIDENCE_MISMATCH",
		);
		const actual = await artifacts(dir, requestId, result);
		const snapshotBytes = await bytes(
			dir,
			"result-snapshot.json",
			"SOURCE_SNAPSHOT_MISMATCH",
		);
		if (sha(snapshotBytes) !== sha(`${JSON.stringify(actual.snapshot)}\n`))
			fail("SOURCE_SNAPSHOT_MISMATCH");
		if (
			result.imageUrl !== actual.job.imageUrl ||
			result.machineEvidence.pngSHA !== result.pngSHA ||
			result.machineEvidence.receiptSHA !== result.receiptSHA ||
			JSON.stringify(result.machineEvidence.metrics) !==
				JSON.stringify(actual.metrics)
		)
			fail("RESULT_EVIDENCE_MISMATCH");
		return { result, actual };
	}
	async function loadResult(dir: string, requestId: string) {
		return (await loadVerifiedResult(dir, requestId)).result;
	}
	async function history(dir: string, result: ResultBinding) {
		const path = join(dir, "evaluations");
		let names: string[];
		try {
			if ((await lstat(path)).isSymbolicLink()) fail("INVALID_PATH", 400);
			names = (await readdir(path))
				.filter((name) => !name.endsWith(".tmp"))
				.sort();
		} catch (error) {
			if (missing(error)) return [];
			throw error;
		}
		const records: Evaluation[] = [];
		const ids = new Set<string>();
		for (const name of names) {
			const revision = records.length + 1;
			if (name !== `${String(revision).padStart(16, "0")}.json`)
				fail("RESULT_EVIDENCE_MISMATCH");
			const record = parse(
				evaluationSchema,
				json(
					await bytes(path, name, "RESULT_EVIDENCE_MISMATCH"),
					"RESULT_EVIDENCE_MISMATCH",
				),
				"RESULT_EVIDENCE_MISMATCH",
			);
			const input = parse(
				submitEvaluationSchema,
				{
					evaluationId: record.evaluationId,
					expectedRevision: record.previousRevision,
					pngSHA: record.pngSHA,
					receiptSHA: record.receiptSHA,
					machineMetricsSHA: record.machineMetricsSHA,
					verdict: record.verdict,
					categories: record.categories,
					notes: record.notes,
				},
				"RESULT_EVIDENCE_MISMATCH",
			);
			if (
				record.revision !== revision ||
				record.previousRevision !== revision - 1 ||
				record.reviewerId !== ownerId ||
				record.jobId !== result.jobId ||
				record.batchId !== result.batchId ||
				record.itemId !== result.itemId ||
				record.snapshotSHA !== result.snapshotSHA ||
				record.pngSHA !== result.pngSHA ||
				record.receiptSHA !== result.receiptSHA ||
				record.machineMetricsSHA !== result.machineEvidence.metricsSHA ||
				record.payloadSHA !== sha(JSON.stringify(input)) ||
				ids.has(record.evaluationId)
			)
				fail("RESULT_EVIDENCE_MISMATCH");
			ids.add(record.evaluationId);
			records.push(record);
		}
		return records;
	}
	async function locked<T>(
		requestId: string,
		action: (dir: string) => Promise<T>,
	) {
		const dir = await directory(requestId);
		return serialized(dir, () => action(dir));
	}
	async function alphaRecord(
		dir: string,
		requestId: string,
		create?: z.infer<typeof alphaParentSchema>,
	) {
		// Loading, not sealing, preserves every original generation artifact.
		const parent = await loadResult(dir, requestId);
		const binding = {
			pngSHA: parent.pngSHA,
			receiptSHA: parent.receiptSHA,
			snapshotSHA: parent.snapshotSHA,
			machineMetricsSHA: parent.machineEvidence.metricsSHA,
		};
		if (
			create &&
			Object.keys(binding).some(
				(key) =>
					create[key as keyof typeof binding] !==
					binding[key as keyof typeof binding],
			)
		)
			fail("RESULT_EVIDENCE_MISMATCH");
		const native = await bytes(
			dir,
			"provider-source.png",
			"ALPHA_NATIVE_REQUIRED",
		);
		const delivery = parse(
			receiptSchema,
			json(
				await bytes(
					dir,
					"candidate.png.receipt.json",
					"RESULT_EVIDENCE_MISMATCH",
				),
				"RESULT_EVIDENCE_MISMATCH",
			),
			"RESULT_EVIDENCE_MISMATCH",
		);
		if (
			!delivery.transformation ||
			sha(native) !== delivery.transformation.sourcePngSHA
		)
			fail("RESULT_EVIDENCE_MISMATCH");
		const base = join(ownerRoot, "alpha-derivatives");
		const versioned = join(base, `${requestId}.v2`);
		let destination = versioned;
		if (!create) {
			try {
				await lstat(versioned);
			} catch (error) {
				if (!missing(error)) throw error;
				destination = join(base, requestId);
			}
		}
		try {
			await lstat(destination);
		} catch (error) {
			if (!missing(error)) throw error;
			if (!create) return null;
			const png = alphaDerivative(native);
			await mkdir(base, { recursive: true, mode: 0o700 });
			if (
				(await lstat(base)).isSymbolicLink() ||
				(await realpath(base)) !== base
			)
				fail("INVALID_PATH", 400);
			await mkdir(destination, { mode: 0o700 });
			const file = await open(join(destination, "image.png"), "wx", 0o600);
			try {
				await file.writeFile(png);
				await file.sync();
			} finally {
				await file.close();
			}
			await publish(
				destination,
				"receipt.json",
				alphaReceiptSchema.parse({
					schema: "portal-alpha-derivative.v1",
					derivativeId: randomUUID(),
					ownerId,
					jobId: requestId,
					parent: binding,
					nativeSHA: sha(native),
					pngSHA: sha(png),
					createdAt: new Date().toISOString(),
					processor: ALPHA_PROCESSOR_V2,
					width: 340,
					height: 510,
					reviewStatus: "HOLD",
					approval: "NONE",
					quality: "OWNER_REVIEW_REQUIRED",
				}),
			);
		}
		for (const path of [base, destination])
			if (
				(await lstat(path)).isSymbolicLink() ||
				(await realpath(path)) !== path
			)
				fail("INVALID_PATH", 400);
		for (const name of ["image.png", "receipt.json"])
			if ((await lstat(join(destination, name))).isSymbolicLink())
				fail("INVALID_PATH", 400);
		const receiptBytes = await bytes(
			destination,
			"receipt.json",
			"RESULT_EVIDENCE_MISMATCH",
		);
		const receipt = parse(
			alphaReceiptSchema,
			json(receiptBytes, "RESULT_EVIDENCE_MISMATCH"),
			"RESULT_EVIDENCE_MISMATCH",
		);
		const png = await bytes(
			destination,
			"image.png",
			"RESULT_EVIDENCE_MISMATCH",
		);
		if (
			receipt.ownerId !== ownerId ||
			receipt.jobId !== requestId ||
			receipt.nativeSHA !== sha(native) ||
			Object.keys(binding).some(
				(key) =>
					receipt.parent[key as keyof typeof binding] !==
					binding[key as keyof typeof binding],
			) ||
			receipt.pngSHA !== sha(png) ||
			measurePng(png).width !== receipt.width ||
			measurePng(png).height !== receipt.height ||
			!Buffer.from(decodePng(png).pixels).equals(
				Buffer.from(
					decodePng(alphaDerivative(native, receipt.processor)).pixels,
				),
			)
		)
			fail("RESULT_EVIDENCE_MISMATCH");
		return {
			derivative: {
				...receipt,
				receiptSHA: sha(receiptBytes),
				imageUrl: `${parent.imageUrl.replace(/\/image$/, "")}/alpha-derivative/image`,
				metrics: measurePng(png),
			},
			png,
		};
	}
	return {
		alphaDerivative: (
			requestId: string,
			create?: z.infer<typeof alphaParentSchema>,
		) => locked(requestId, (dir) => alphaRecord(dir, requestId, create)),
		sealResult: (requestId: string): Promise<ResultBinding> =>
			locked(requestId, async (dir) => {
				try {
					await lstat(join(dir, "result.json"));
					return await loadResult(dir, requestId);
				} catch (error) {
					if (!missing(error)) throw error;
				}
				const actual = await artifacts(dir, requestId);
				const result = resultSchema.parse({
					schema: "portal-generated-result.v1",
					size:
						actual.metrics.width === 340 && actual.metrics.height === 510
							? "340x510"
							: actual.metrics.width === 1024 && actual.metrics.height === 1536
								? "1024x1536"
								: undefined,
					ownerId,
					jobId: requestId,
					batchId: actual.binding?.batchId ?? null,
					itemId: actual.binding?.itemId ?? null,
					snapshotSHA: actual.snapshotSHA,
					pngSHA: actual.pngSHA,
					receiptSHA: actual.receiptSHA,
					imageUrl: actual.job.imageUrl,
					machineEvidence: {
						schema: "portal-result-metrics.v1",
						pngSHA: actual.pngSHA,
						receiptSHA: actual.receiptSHA,
						metricsSHA: actual.metricsSHA,
						measuredAt: new Date().toISOString(),
						metrics: actual.metrics,
					},
					reviewStatus: "HOLD",
					approval: "NONE",
				});
				try {
					await publish(dir, "result-snapshot.json", actual.snapshot);
				} catch (error) {
					if (
						!(
							error instanceof Error &&
							"code" in error &&
							error.code === "EEXIST"
						)
					)
						throw error;
					if (
						sha(
							await bytes(
								dir,
								"result-snapshot.json",
								"SOURCE_SNAPSHOT_MISMATCH",
							),
						) !== sha(`${JSON.stringify(actual.snapshot)}\n`)
					)
						fail("SOURCE_SNAPSHOT_MISMATCH");
				}
				await publish(dir, "result.json", result);
				return result;
			}),
		readResult: (requestId: string): Promise<ResultBinding> =>
			locked(requestId, (dir) => loadResult(dir, requestId)),
		readCapturedSource: (requestId: string) =>
			locked(requestId, async (dir) => {
				const { result, actual } = await loadVerifiedResult(dir, requestId);
				const { detail, token, image } = actual.retained;
				if (
					detail.length > 1048576 ||
					token.length > 1048576 ||
					(image?.length ?? 0) > 8388608
				)
					fail("SOURCE_SNAPSHOT_MISMATCH");
				let sheet: ReturnType<typeof generationSheetFromBytes>;
				try {
					sheet =
						image === null
							? generationSheetFromBytes(detail, token, null)
							: sheetFromBytes(detail, token, image);
				} catch {
					fail("SOURCE_SNAPSHOT_MISMATCH");
				}
				return {
					schema: "portal-captured-source.v1" as const,
					ownerId: result.ownerId,
					jobId: result.jobId,
					batchId: result.batchId,
					itemId: result.itemId,
					snapshotSHA: result.snapshotSHA,
					imageSHA: sheet.sourceHashes.image,
					imageBase64: image?.toString("base64") ?? null,
					...(actual.snapshot.files["request-payload.json"] && image
						? {
								normalizedImageBase64: Buffer.from(
									transformReferencePng(image).rgbaBytes,
								).toString("base64"),
								normalizedSHA: transformReferencePng(image).receipt.rgbaSHA256,
							}
						: {}),
					identity: {
						personId: sheet.personId,
						characterId: sheet.characterId,
						name: sheet.name,
					},
				};
			}),
		readEvaluations: (requestId: string) =>
			locked(requestId, async (dir) => {
				const resultBinding = await loadResult(dir, requestId),
					records = await history(dir, resultBinding);
				return {
					resultBinding,
					machineEvidence: resultBinding.machineEvidence,
					latest: records.at(-1) ?? null,
					history: records,
				};
			}),
		appendEvaluation: (
			requestId: string,
			payload: unknown,
		): Promise<{ created: boolean; evaluation: Evaluation }> =>
			locked(requestId, async (dir) => {
				const result = await loadResult(dir, requestId);
				const input = parse(submitEvaluationSchema, payload, "INVALID_INPUT");
				if (input.pngSHA !== result.pngSHA) fail("RESULT_HASH_MISMATCH");
				if (
					input.receiptSHA !== result.receiptSHA ||
					input.machineMetricsSHA !== result.machineEvidence.metricsSHA
				)
					fail("RESULT_EVIDENCE_MISMATCH");
				const records = await history(dir, result),
					payloadSHA = sha(JSON.stringify(input));
				const prior = records.find(
					(record) => record.evaluationId === input.evaluationId,
				);
				if (prior) {
					if (prior.payloadSHA !== payloadSHA) fail("REQUEST_CONFLICT");
					return { created: false, evaluation: prior };
				}
				if (input.expectedRevision !== records.length)
					fail("EVALUATION_REVISION_CONFLICT");
				const record = evaluationSchema.parse({
					schema: "portal-result-evaluation.v1",
					evaluationId: input.evaluationId,
					jobId: requestId,
					batchId: result.batchId,
					itemId: result.itemId,
					snapshotSHA: result.snapshotSHA,
					pngSHA: result.pngSHA,
					receiptSHA: result.receiptSHA,
					machineMetricsSHA: result.machineEvidence.metricsSHA,
					reviewerId: ownerId,
					reviewedAt: new Date().toISOString(),
					revision: records.length + 1,
					previousRevision: records.length,
					verdict: input.verdict,
					categories: input.categories,
					notes: input.notes,
					payloadSHA,
					approval: "NONE",
				});
				const path = join(dir, "evaluations");
				await mkdir(path, { mode: 0o700, recursive: true });
				await publish(
					path,
					`${String(record.revision).padStart(16, "0")}.json`,
					record,
				);
				return { created: true, evaluation: record };
			}),
	};
}
