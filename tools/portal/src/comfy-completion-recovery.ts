import { randomUUID } from "node:crypto";
import {
	closeSync,
	constants,
	fsyncSync,
	lstatSync,
	openSync,
	readdirSync,
	readFileSync,
	renameSync,
} from "node:fs";
import { lstat, mkdir, open, realpath, rm } from "node:fs/promises";
import { basename, join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { listBatches } from "./batches.ts";
import {
	COMFY_ENDPOINT,
	comfyCompletionRequestSchema,
	createComfyProvider,
	prepareComfySource,
} from "./comfyui-provider.ts";
import { portraitDeliveryV2 } from "./portrait-size.ts";
import { COMFY_SOURCE_WORKFLOW } from "./provider-models.ts";
import {
	referenceGenerationRequestSchema,
	resolveSourceRecipe,
} from "./reference-contract.ts";
import { verifyReferenceWorkbenchResult } from "./reference-workbench.ts";
import { generationSheetFromBytes, hash } from "./sources.ts";
import { executionJobSchema } from "./terminal-rejection-proof.ts";

export const comfyCompletionDirectory = "comfy-completion.v1";
export const comfyCompletionFiles = [
	"comfy-request.json",
	"comfy-history.json",
	"comfy-response.json",
	"comfy-assets.json",
	"comfy-finishing-assets.json",
	"provider-native.png",
	"provider-source.png",
	"provider-raw.png",
	"provider-mask.png",
	"provider-raw-mask.png",
	"provider-canonical.receipt.json",
	"candidate.png",
	"candidate.png.receipt.json",
	"machine-diagnostics.json",
] as const;
const retainedNames = [
	"job.json",
	"initial-job.json",
	"request-payload.json",
	"connection-binding.json",
	"dispatch.lock",
	"job-history.json",
	"source-bytes.json",
	"provenance.json",
	"reference-request.json",
	"reference-original.png",
	"reference-native.png",
	"reference-conditioning.png",
	"reference-transform.json",
	"reference-records.json",
	"comfy-prompt.txt",
	"comfy-prompt.json",
	"reference-analysis.json",
	"reference-normalized.png",
] as const;
const sha = z.string().regex(/^[a-f0-9]{64}$/);
const eventSchema = z.strictObject({
	schema: z.literal("portal-comfy-completion.v1"),
	ownerId: z.string().regex(/^\d+$/),
	actorId: z.string().regex(/^\d+$/),
	requestId: z.uuid(),
	committedAt: z.iso.datetime(),
	request: comfyCompletionRequestSchema,
	retainedSHA256: z.record(z.enum(retainedNames), sha),
	artifactSHA256: z.record(z.enum(comfyCompletionFiles), sha),
	job: executionJobSchema,
	bindingEvidence: z.literal(
		"RECONSTRUCTED_FROM_RETAINED_SOURCE_AND_OWNER_PINNED_HISTORY",
	),
	assetEvidence: z.literal("MEASURED_AT_RECOVERY"),
	qualityApproval: z.literal("NONE"),
});
const missing = (error: unknown) =>
	error instanceof Error && "code" in error && error.code === "ENOENT";
function mismatch(): never {
	throw Object.assign(Error("COMFY_RECOVERY_PROOF_MISMATCH"), { status: 409 });
}
async function retained(dir: string, name: string) {
	const file = await open(
		join(dir, name),
		constants.O_RDONLY | constants.O_NOFOLLOW,
	);
	try {
		if (!(await file.stat()).isFile()) mismatch();
		return await file.readFile();
	} finally {
		await file.close();
	}
}
async function privateDirectory(dir: string) {
	if (!(await lstat(dir)).isDirectory() || (await realpath(dir)) !== dir)
		mismatch();
}
async function snapshot(dir: string) {
	return Object.fromEntries(
		await Promise.all(
			retainedNames.map(async (name) => [
				name,
				hash(await retained(dir, name)),
			]),
		),
	) as Record<(typeof retainedNames)[number], string>;
}
// An unresolved dispatch has no result/snapshot/evaluation authority yet.
// Close the inventory rather than enumerate known bad artifact names. Include
// inode identity and optional restart evidence in CAS; abandoned private stages
// remain inert and readable only by a future explicit recovery operation.
function recoveryInventory(dir: string, ownStage?: string) {
	const allowed = new Set<string>([
		...retainedNames,
		"comfy-interrupted.json",
		"interrupted-job.json",
	]);
	return readdirSync(dir)
		.sort()
		.flatMap((name) => {
			if (name === ownStage) return [];
			const stat = lstatSync(join(dir, name));
			const stage = /^\.comfy-completion-[0-9a-f-]{36}\.tmp$/.test(name);
			if (
				stat.isSymbolicLink() ||
				(stage ? !stat.isDirectory() : !stat.isFile() || !allowed.has(name))
			)
				mismatch();
			return [
				{
					name,
					dev: stat.dev,
					ino: stat.ino,
					sha256:
						!stage &&
						!retainedNames.includes(name as (typeof retainedNames)[number])
							? hash(readFileSync(join(dir, name)))
							: null,
				},
			];
		});
}
async function store(dir: string, name: string, bytes: Uint8Array | string) {
	const file = await open(join(dir, name), "wx", 0o600);
	try {
		await file.writeFile(bytes);
		await file.sync();
	} finally {
		await file.close();
	}
}
export async function comfyCompletionArtifact(dir: string, name: string) {
	if (
		!comfyCompletionFiles.includes(
			name as (typeof comfyCompletionFiles)[number],
		)
	)
		return join(dir, name);
	const published = join(dir, comfyCompletionDirectory);
	try {
		await privateDirectory(published);
	} catch (error) {
		if (missing(error)) return join(dir, name);
		throw error;
	}
	return join(published, name);
}
export async function readComfyCompletion(
	ownerRoot: string,
	requestId: string,
) {
	const dir = join(ownerRoot, "jobs", requestId),
		published = join(dir, comfyCompletionDirectory);
	try {
		await privateDirectory(published);
	} catch (error) {
		if (missing(error)) return null;
		throw error;
	}
	try {
		const event = eventSchema.parse(
			JSON.parse((await retained(published, "event.json")).toString()),
		);
		if (
			event.ownerId !== basename(ownerRoot) ||
			event.actorId !== event.ownerId ||
			event.requestId !== requestId ||
			!isDeepStrictEqual(await snapshot(dir), event.retainedSHA256)
		)
			mismatch();
		for (const name of comfyCompletionFiles)
			if (hash(await retained(published, name)) !== event.artifactSHA256[name])
				mismatch();
		const verified = await verifyReferenceWorkbenchResult(
			(name) =>
				retained(
					comfyCompletionFiles.includes(
						name as (typeof comfyCompletionFiles)[number],
					)
						? published
						: dir,
					name,
				),
			requestId,
		);
		const original = executionJobSchema.parse(
			JSON.parse((await retained(dir, "job.json")).toString()),
		);
		if (
			event.request.jobSHA256 !== hash(await retained(dir, "job.json")) ||
			event.job.id !== original.id ||
			event.job.payloadSHA !== original.payloadSHA ||
			event.job.state !== "HOLD" ||
			event.job.reviewStatus !== "HOLD" ||
			event.job.errorCode !== null ||
			!event.job.imageUrl ||
			!isDeepStrictEqual(event.job.metrics, verified.metrics)
		)
			mismatch();
		const receipt = JSON.parse(
			(await retained(published, "provider-canonical.receipt.json")).toString(),
		);
		if (
			receipt.promptId !== event.request.promptId ||
			receipt.historySHA !== event.request.historySHA256 ||
			receipt.nativeSHA !== event.request.outputSHA256["9"] ||
			receipt.finishing.maskSHA !== event.request.outputSHA256["11"] ||
			receipt.finishing.rawMaskSHA !== event.request.outputSHA256["15"] ||
			receipt.finishing.rawSHA !== event.request.outputSHA256["16"] ||
			JSON.parse((await retained(published, "comfy-request.json")).toString())
				.client_id !== event.request.clientId
		)
			mismatch();
		return { job: event.job, event };
	} catch {
		mismatch();
	}
}
// Startup leaves execution evidence untouched; interruption is an additive fact.
export async function retainComfyInterruption(dir: string) {
	let request: { providerModel?: string };
	try {
		request = JSON.parse(
			(await retained(dir, "request-payload.json")).toString(),
		);
	} catch (error) {
		if (missing(error)) return false;
		throw error;
	}
	if (request.providerModel !== `comfyui:${COMFY_SOURCE_WORKFLOW}`)
		return false;
	const bytes = await retained(dir, "job.json");
	try {
		await store(
			dir,
			"comfy-interrupted.json",
			JSON.stringify({ jobSHA256: hash(bytes) }),
		);
	} catch (error) {
		if (!(error instanceof Error && "code" in error && error.code === "EEXIST"))
			throw error;
	}
	return true;
}
export async function readComfyInterruption(
	dir: string,
	job: z.infer<typeof executionJobSchema>,
) {
	try {
		const event = z
			.strictObject({ jobSHA256: sha })
			.parse(
				JSON.parse((await retained(dir, "comfy-interrupted.json")).toString()),
			);
		if (
			event.jobSHA256 !== hash(await retained(dir, "job.json")) ||
			job.state !== "RUNNING"
		)
			mismatch();
		return {
			...job,
			state: "UNKNOWN" as const,
			errorCode: "OWNER_DISPATCH_UNCERTAIN",
		};
	} catch (error) {
		if (missing(error)) return job;
		throw error;
	}
}
export async function commitComfyCompletion(input: {
	ownerRoot: string;
	requestId: string;
	request: z.infer<typeof comfyCompletionRequestSchema>;
	imageUrl: string;
	authorize: () => void;
	providerOptions?: Pick<
		Parameters<typeof createComfyProvider>[0],
		"transport" | "measureAssets" | "measureFinishing"
	>;
	checkpoint?: (point: "before-commit" | "after-commit") => Promise<void>;
}) {
	const { ownerRoot, requestId, request } = input;
	z.uuid().parse(requestId);
	const dir = join(ownerRoot, "jobs", requestId);
	for (const path of [ownerRoot, join(ownerRoot, "jobs"), dir])
		await privateDirectory(path);
	const prior = await readComfyCompletion(ownerRoot, requestId);
	if (prior) {
		if (!isDeepStrictEqual(prior.event.request, request)) mismatch();
		return { created: false, ...prior };
	}
	const inventory = recoveryInventory(dir);
	const pins = await snapshot(dir);
	if (pins["job.json"] !== request.jobSHA256) mismatch();
	const job = executionJobSchema.parse(
		JSON.parse((await retained(dir, "job.json")).toString()),
	);
	const initial = executionJobSchema.parse(
		JSON.parse((await retained(dir, "initial-job.json")).toString()),
	);
	const payload = referenceGenerationRequestSchema.parse(
		JSON.parse((await retained(dir, "request-payload.json")).toString()),
	);
	if (
		job.id !== requestId ||
		initial.id !== requestId ||
		initial.state !== "RUNNING" ||
		initial.payloadSHA !== job.payloadSHA ||
		initial.imageUrl !== null ||
		initial.metrics !== null ||
		!["RUNNING", "UNKNOWN"].includes(job.state) ||
		job.imageUrl !== null ||
		job.metrics !== null ||
		job.payloadSHA !== hash(Buffer.from(JSON.stringify(payload))) ||
		payload.requestId !== requestId ||
		payload.providerModel !== `comfyui:${COMFY_SOURCE_WORKFLOW}` ||
		payload.inputMode !== "reference-img2img" ||
		(await retained(dir, "dispatch.lock")).length !== 0
	)
		mismatch();
	if (
		(await listBatches(ownerRoot)).some((batch) =>
			batch.items.some(
				(item) => item.requestId === requestId || item.jobId === requestId,
			),
		)
	)
		mismatch();
	const binding = JSON.parse(
		(await retained(dir, "connection-binding.json")).toString(),
	);
	if (
		binding.ownerId !== basename(ownerRoot) ||
		binding.connectionId !== payload.connectionId ||
		binding.protocolVersion !== "comfyui-http.v1" ||
		binding.toolName !== COMFY_SOURCE_WORKFLOW ||
		binding.endpointId !== "comfyui-moss-source-img2img-alpha" ||
		binding.endpointRevision !== "comfyui.v1" ||
		binding.toolSchemaDigest !==
			hash(
				Buffer.from(
					`comfyui-http.v1:${COMFY_SOURCE_WORKFLOW}:${COMFY_ENDPOINT}`,
				),
			)
	)
		mismatch();
	const source = z
		.object({ detail: z.string(), token: z.string(), image: z.string() })
		.parse(JSON.parse((await retained(dir, "source-bytes.json")).toString()));
	const sheet = generationSheetFromBytes(
		Buffer.from(source.detail, "base64"),
		Buffer.from(source.token, "base64"),
		Buffer.from(source.image, "base64"),
	);
	const value = {
		request: payload,
		denoise: resolveSourceRecipe(payload.sourceRecipe).denoise,
		serverEvidence: {
			status: "available",
			recipient: {
				personId: sheet.personId,
				characterId: sheet.characterId,
				...(payload.sheetId ? { sheetId: payload.sheetId } : {}),
			},
			tokenBytes: sheet.tokenBytes,
			tokenSHA256: hash(sheet.tokenBytes),
			recipientImage: {
				personId: sheet.personId,
				characterId: sheet.characterId,
				sourceSHA256: hash(Buffer.from(source.image, "base64")),
				bytes: Buffer.from(source.image, "base64"),
			},
		},
	};
	const retainedNative = {
		rgbaBytes: await retained(dir, "reference-native.png"),
		rgbBytes: await retained(dir, "reference-conditioning.png"),
		receiptBytes: await retained(dir, "reference-transform.json"),
	};
	const prepared = prepareComfySource(value, retainedNative);
	for (const [name, bytes] of Object.entries({
		"reference-request.json": Buffer.from(JSON.stringify(prepared.request)),
		"reference-original.png": prepared.originalBytes,
		"reference-native.png": prepared.native.rgbaBytes,
		"reference-conditioning.png": prepared.native.rgbBytes,
		"reference-transform.json": Buffer.from(
			JSON.stringify(prepared.native.receipt),
		),
		"reference-records.json": Buffer.from(JSON.stringify(prepared.records)),
		"comfy-prompt.txt": Buffer.from(prepared.compiled.text),
		"comfy-prompt.json": Buffer.from(JSON.stringify(prepared.compiled)),
	}))
		if (hash(await retained(dir, name)) !== hash(bytes)) mismatch();
	input.authorize();
	const provider = createComfyProvider({
		...input.providerOptions,
		authorize: (start) => {
			input.authorize();
			return start();
		},
	});
	const result = await provider.recoverSource(value, request, retainedNative);
	if (
		!result.finishingImages ||
		!result.assetProofBytes ||
		!result.finishingProofBytes
	)
		mismatch();
	const delivery = portraitDeliveryV2({
		originalBytes: prepared.originalBytes,
		nativeBytes: prepared.native.rgbaBytes,
		rawBytes: result.finishingImages.rawBytes,
		finishedBytes: result.sourceBytes,
		canonicalReceiptBytes: result.canonicalReceiptBytes,
	});
	const stage = join(dir, `.comfy-completion-${randomUUID()}.tmp`);
	await mkdir(stage, { mode: 0o700 });
	try {
		const artifacts: Record<string, Uint8Array> = {
			"comfy-request.json": result.requestBytes,
			"comfy-history.json": result.historyBytes,
			"comfy-response.json": Buffer.from(
				JSON.stringify({
					transport: "comfyui-http",
					status: "success",
					...result.provenance,
				}),
			),
			"comfy-assets.json": result.assetProofBytes,
			"comfy-finishing-assets.json": result.finishingProofBytes,
			"provider-native.png": result.nativeBytes,
			"provider-source.png": result.sourceBytes,
			"provider-raw.png": result.finishingImages.rawBytes,
			"provider-mask.png": result.finishingImages.maskBytes,
			"provider-raw-mask.png": result.finishingImages.rawMaskBytes,
			"provider-canonical.receipt.json": result.canonicalReceiptBytes,
			"candidate.png": delivery.bytes,
			"candidate.png.receipt.json": delivery.receiptBytes,
		};
		for (const [name, bytes] of Object.entries(artifacts))
			await store(stage, name, bytes);
		const verified = await verifyReferenceWorkbenchResult(
			(name) => retained(name in artifacts ? stage : dir, name),
			requestId,
		);
		artifacts["machine-diagnostics.json"] = Buffer.from(
			JSON.stringify(verified.metrics),
		);
		await store(
			stage,
			"machine-diagnostics.json",
			artifacts["machine-diagnostics.json"],
		);
		const event = eventSchema.parse({
			schema: "portal-comfy-completion.v1",
			ownerId: basename(ownerRoot),
			actorId: basename(ownerRoot),
			requestId,
			committedAt: new Date().toISOString(),
			request,
			retainedSHA256: pins,
			artifactSHA256: Object.fromEntries(
				Object.entries(artifacts).map(([name, bytes]) => [name, hash(bytes)]),
			),
			job: {
				...job,
				state: "HOLD",
				reviewStatus: "HOLD",
				errorCode: null,
				metrics: verified.metrics,
				imageUrl: input.imageUrl,
			},
			bindingEvidence:
				"RECONSTRUCTED_FROM_RETAINED_SOURCE_AND_OWNER_PINNED_HISTORY",
			assetEvidence: "MEASURED_AT_RECOVERY",
			qualityApproval: "NONE",
		});
		await store(stage, "event.json", JSON.stringify(event));
		await input.checkpoint?.("before-commit");
		if (!isDeepStrictEqual(pins, await snapshot(dir))) mismatch();
		// Synchronous final inventory/CAS leaves no await before publication.
		if (!isDeepStrictEqual(inventory, recoveryInventory(dir, basename(stage))))
			mismatch();
		const stagedHashes = {
			...event.artifactSHA256,
			"event.json": hash(Buffer.from(JSON.stringify(event))),
		};
		if (
			!isDeepStrictEqual(
				readdirSync(stage).sort(),
				Object.keys(stagedHashes).sort(),
			)
		)
			mismatch();
		for (const [name, digest] of Object.entries(stagedHashes)) {
			const path = join(stage, name);
			if (!lstatSync(path).isFile() || hash(readFileSync(path)) !== digest)
				mismatch();
		}
		input.authorize();
		const parent = process.platform === "win32" ? null : openSync(dir, "r");
		const staged = process.platform === "win32" ? null : openSync(stage, "r");
		try {
			if (staged !== null) fsyncSync(staged);
			renameSync(stage, join(dir, comfyCompletionDirectory));
			if (parent !== null) fsyncSync(parent);
		} finally {
			if (parent !== null) closeSync(parent);
			if (staged !== null) closeSync(staged);
		}
		await input.checkpoint?.("after-commit");
		return { created: true, job: event.job, event };
	} finally {
		await rm(stage, { recursive: true, force: true });
	}
}
