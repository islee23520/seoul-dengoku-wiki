import { constants } from "node:fs";
import {
	lstat,
	mkdir,
	open,
	readdir,
	realpath,
	rename,
	writeFile,
} from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { z } from "zod";
import { hash } from "./sources.ts";

const uuid = z.uuid();
const sha = z.string().regex(/^[a-f0-9]{64}$/);
export const selectionSchema = z
	.strictObject({
		personId: z.string().regex(/^person-\d+$/),
		characterId: z.string().regex(/^K\d+$/),
		name: z.string().min(1),
		wikiDetailSHA: sha,
		sourceMode: z.enum(["design-token-only", "original-photo"]).optional(),
		originalSourceHashes: z.strictObject({
			detail: sha,
			token: sha,
			image: sha.nullable(),
		}),
	})
	.refine(
		(selection) =>
			selection.sourceMode === undefined ||
			(selection.sourceMode === "design-token-only") ===
				(selection.originalSourceHashes.image === null),
	);
export const batchRequestSchema = z
	.strictObject({
		batchId: uuid,
		connectionId: uuid,
		providerModel: z.literal("gpt-image-2.5-sunburst"),
		faceMode: z.strictObject({
			kind: z.literal("unique"),
			variantId: z.null(),
		}),
		items: z.array(selectionSchema).min(1).max(20),
	})
	.refine(
		(p) => new Set(p.items.map((i) => i.personId)).size === p.items.length,
	);
const itemSchema = z.strictObject({
	itemId: uuid,
	requestId: uuid,
	ordinal: z.number().int().min(0),
	personId: selectionSchema.shape.personId,
	characterId: selectionSchema.shape.characterId,
	name: selectionSchema.shape.name,
	snapshotSHA: sha,
	status: z.enum([
		"PENDING",
		"RUNNING",
		"HOLD",
		"FAILED",
		"UNKNOWN",
		"CANCELLED",
	]),
	jobId: uuid.nullable(),
	startedAt: z.string().nullable(),
	finishedAt: z.string().nullable(),
	errorCode: z.string().nullable(),
});
export const batchSchema = z
	.strictObject({
		schema: z.literal("portal-batch.v1"),
		ownerId: z.string().regex(/^\d+$/),
		batchId: uuid,
		payloadSHA: sha,
		connectionId: uuid,
		connectionRevision: uuid,
		providerModel: batchRequestSchema.shape.providerModel,
		faceMode: batchRequestSchema.shape.faceMode,
		state: z.enum([
			"RUNNING",
			"PAUSED_UNKNOWN",
			"PAUSED_RESTART",
			"PAUSED_BLOCKED",
			"CANCEL_REQUESTED",
			"COMPLETED",
			"CANCELLED",
		]),
		createdAt: z.string(),
		updatedAt: z.string(),
		revision: z.number().int().positive(),
		cancelRequested: z.boolean(),
		pauseReason: z.string().nullable(),
		items: z.array(itemSchema).min(1).max(20),
	})
	.refine(
		(batch) =>
			batch.items.every((item, ordinal) => item.ordinal === ordinal) &&
			new Set(batch.items.map((i) => i.requestId)).size ===
				batch.items.length &&
			new Set(batch.items.map((i) => i.itemId)).size === batch.items.length &&
			new Set(batch.items.map((i) => i.personId)).size === batch.items.length,
	);
export type Batch = z.infer<typeof batchSchema>;
export type BatchItem = Batch["items"][number];
const pointerSchema = z.strictObject({
	schema: z.literal("portal-job-batch-binding.v1"),
	ownerId: z.string().regex(/^\d+$/),
	batchId: uuid,
	itemId: uuid,
	requestId: uuid,
	snapshotSHA: sha,
});
export const snapshotSchema = z
	.strictObject({
		schema: z.literal("portal-batch-item-snapshot.v1"),
		ownerId: z.string().regex(/^\d+$/),
		batchId: uuid,
		itemId: uuid,
		requestId: uuid,
		ordinal: z.number().int().min(0),
		selection: selectionSchema,
		connection: z.strictObject({
			connectionId: uuid,
			ownerId: z.string().regex(/^\d+$/),
			sessionFingerprint: sha,
			expiresAt: z.number(),
			revision: uuid,
			endpointId: z.string(),
			endpointRevision: z.string(),
			protocolVersion: z.enum(["2025-11-25", "openai-compatible-http.v1"]),
			toolName: z.string(),
			toolSchemaDigest: sha,
			state: z.literal("READY"),
		}),
		wikiSource: z.strictObject({
			kind: z.literal("live-wiki-http"),
			url: z.string(),
			sha256: sha,
			fetchedAt: z.string(),
		}),
		files: z
			.object({
				detail: sha,
				token: sha,
				image: sha.nullable().optional(),
				wiki: sha,
				rule: sha,
				position: sha,
				look: sha,
				projection: sha,
				provenance: sha,
			})
			.catchall(sha),
		pins: z.unknown(),
		composition: z.unknown(),
		references: z.array(
			z.strictObject({ id: z.string(), role: z.string(), sha256: sha }),
		),
	})
	.refine(
		(snapshot) =>
			(snapshot.files.image ?? null) ===
			snapshot.selection.originalSourceHashes.image,
	);
export type BatchSnapshot = z.infer<typeof snapshotSchema>;
export type VerifiedBatchBinding = Readonly<{
	batchId: string;
	itemId: string;
	snapshotSHA: string;
}>;
const missing = (error: unknown) =>
	error instanceof Error && "code" in error && error.code === "ENOENT";
function fail(code: string): never {
	throw Object.assign(Error(code), { status: 409 });
}
const jsonBytes = (value: unknown) => Buffer.from(`${JSON.stringify(value)}\n`);

export function batchView(batch: Batch) {
	const { ownerId: _owner, ...view } = batch;
	const count = (status: BatchItem["status"]) =>
		batch.items.filter((i) => i.status === status).length;
	const pending = count("PENDING"),
		running = count("RUNNING"),
		hold = count("HOLD"),
		failed = count("FAILED"),
		unknown = count("UNKNOWN"),
		cancelled = count("CANCELLED");
	return {
		...view,
		progress: {
			total: batch.items.length,
			pending,
			running,
			hold,
			failed,
			unknown,
			cancelled,
			settled: hold + failed + cancelled,
			attempted: running + hold + failed + unknown,
		},
	};
}

export async function batchFile(ownerRoot: string, ...parts: string[]) {
	const root = resolve(ownerRoot);
	let current = root;
	for (const part of ["", ...parts]) {
		if (part && !/^[-a-zA-Z0-9.]+$/.test(part)) fail("INVALID_PATH");
		if (part === "..") fail("INVALID_PATH");
		current = part ? join(current, part) : current;
		try {
			if (
				(await lstat(current)).isSymbolicLink() ||
				(await realpath(current)) !== current
			)
				fail("INVALID_PATH");
		} catch (error) {
			if (!missing(error)) throw error;
		}
	}
	return current;
}
async function exactFile(ownerRoot: string, ...parts: string[]) {
	const path = await batchFile(ownerRoot, ...parts);
	const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
	try {
		if (!(await file.stat()).isFile()) fail("INVALID_PATH");
		return await file.readFile();
	} finally {
		await file.close();
	}
}
export async function readBatch(ownerRoot: string, batchId: string) {
	uuid.parse(batchId);
	return batchSchema.parse(
		JSON.parse(
			(await exactFile(ownerRoot, "batches", batchId, "batch.json")).toString(),
		),
	);
}
export async function writeBatch(
	ownerRoot: string,
	batch: Batch,
	initial = false,
) {
	const path = await batchFile(
		ownerRoot,
		"batches",
		batch.batchId,
		"batch.json",
	);
	await mkdir(dirname(path), { recursive: true, mode: 0o700 });
	if (initial)
		await writeFile(path, jsonBytes(batchSchema.parse(batch)), {
			flag: "wx",
			mode: 0o600,
		});
	else {
		const next = join(dirname(path), "batch.next.json");
		await writeFile(next, jsonBytes(batchSchema.parse(batch)), {
			flag: "wx",
			mode: 0o600,
		});
		await rename(next, path);
	}
}
export async function listBatches(ownerRoot: string) {
	try {
		const entries = await readdir(await batchFile(ownerRoot, "batches"), {
			withFileTypes: true,
		});
		const batches: Batch[] = [];
		for (const entry of entries)
			if (uuid.safeParse(entry.name).success) {
				if (!entry.isDirectory()) fail("INVALID_PATH");
				batches.push(await readBatch(ownerRoot, entry.name));
			}
		return batches;
	} catch (error) {
		if (missing(error)) return [];
		throw error;
	}
}
export async function readBatchSnapshot(
	ownerRoot: string,
	batch: Batch,
	item: BatchItem,
) {
	const bytes = await exactFile(
		ownerRoot,
		"batches",
		batch.batchId,
		"items",
		item.itemId,
		"snapshot.json",
	);
	if (hash(bytes) !== item.snapshotSHA) fail("SOURCE_SNAPSHOT_MISMATCH");
	const snapshot = snapshotSchema.parse(JSON.parse(bytes.toString()));
	if (
		snapshot.ownerId !== batch.ownerId ||
		snapshot.batchId !== batch.batchId ||
		snapshot.itemId !== item.itemId ||
		snapshot.requestId !== item.requestId ||
		snapshot.ordinal !== item.ordinal ||
		snapshot.selection.personId !== item.personId ||
		snapshot.selection.characterId !== item.characterId ||
		snapshot.selection.name !== item.name ||
		snapshot.connection.ownerId !== batch.ownerId ||
		snapshot.connection.connectionId !== batch.connectionId ||
		snapshot.connection.revision !== batch.connectionRevision
	)
		fail("SOURCE_SNAPSHOT_MISMATCH");
	const files: Record<string, Buffer> & { wiki?: Buffer; projection?: Buffer } =
		{};
	for (const [role, digest] of Object.entries(snapshot.files)) {
		if (digest === null || digest === undefined) continue;
		const artifact = await exactFile(
			ownerRoot,
			"batches",
			batch.batchId,
			"artifacts",
			`${digest}.bin`,
		);
		if (hash(artifact) !== digest) fail("SOURCE_SNAPSHOT_MISMATCH");
		files[role] = artifact;
	}
	for (const role of ["detail", "token", "image"] as const)
		if (
			snapshot.selection.originalSourceHashes[role] === null
				? files[role] !== undefined
				: !files[role] ||
					hash(files[role]) !== snapshot.selection.originalSourceHashes[role]
		)
			fail("SOURCE_SNAPSHOT_MISMATCH");
	if (
		!files.wiki ||
		hash(files.wiki) !== snapshot.selection.wikiDetailSHA ||
		snapshot.wikiSource.sha256 !== snapshot.selection.wikiDetailSHA
	)
		fail("SOURCE_SNAPSHOT_MISMATCH");
	for (const r of snapshot.references)
		if (!Object.values(snapshot.files).includes(r.sha256))
			fail("SOURCE_SNAPSHOT_MISMATCH");
	const projection = z
		.object({
			text: z.string(),
			textSHA: sha,
			sourceSHA: sha,
			rendering: z.record(z.string(), z.unknown()),
			renderingSHA: sha,
		})
		.parse(JSON.parse(files.projection?.toString() ?? "null"));
	const pins = z
		.object({
			ruleSHA: sha,
			positionReferenceSHA: sha,
			lookSHA: sha,
			referenceImages: z.array(z.object({ id: z.string(), sha256: sha })),
		})
		.parse(snapshot.pins);
	if (
		hash(Buffer.from(projection.text)) !== projection.textSHA ||
		hash(Buffer.from(JSON.stringify(projection.rendering))) !==
			projection.renderingSHA ||
		projection.sourceSHA !== snapshot.files.look ||
		pins.lookSHA !== snapshot.files.look ||
		pins.ruleSHA !== snapshot.files.rule ||
		pins.positionReferenceSHA !== snapshot.files.position ||
		JSON.stringify(pins.referenceImages) !==
			JSON.stringify(
				snapshot.references.map((r) => ({ id: r.id, sha256: r.sha256 })),
			)
	)
		fail("SOURCE_SNAPSHOT_MISMATCH");
	return { snapshot, files };
}

export async function resolveBatchBinding(
	options: Readonly<{ ownerRoot: string; ownerId: string }>,
	requestId: string,
): Promise<VerifiedBatchBinding | null> {
	uuid.parse(requestId);
	if (
		!/^\d+$/.test(options.ownerId) ||
		basename(resolve(options.ownerRoot)) !== options.ownerId
	)
		fail("INVALID_PATH");
	let pointer: z.infer<typeof pointerSchema>;
	try {
		pointer = pointerSchema.parse(
			JSON.parse(
				(
					await exactFile(
						options.ownerRoot,
						"jobs",
						requestId,
						"batch-binding.json",
					)
				).toString(),
			),
		);
	} catch (error) {
		if (!missing(error)) throw error;
		await exactFile(options.ownerRoot, "jobs", requestId, "job.json");
		return null;
	}
	if (pointer.ownerId !== options.ownerId || pointer.requestId !== requestId)
		fail("SOURCE_SNAPSHOT_MISMATCH");
	const batch = await readBatch(options.ownerRoot, pointer.batchId);
	const matches = batch.items.filter((i) => i.requestId === requestId);
	const item = matches[0];
	if (
		batch.ownerId !== options.ownerId ||
		matches.length !== 1 ||
		!item ||
		item.itemId !== pointer.itemId ||
		item.snapshotSHA !== pointer.snapshotSHA ||
		item.jobId !== requestId
	)
		fail("SOURCE_SNAPSHOT_MISMATCH");
	const job = z
		.object({ id: uuid })
		.parse(
			JSON.parse(
				(
					await exactFile(options.ownerRoot, "jobs", requestId, "job.json")
				).toString(),
			),
		);
	if (job.id !== requestId) fail("SOURCE_SNAPSHOT_MISMATCH");
	await readBatchSnapshot(options.ownerRoot, batch, item);
	return {
		batchId: batch.batchId,
		itemId: item.itemId,
		snapshotSHA: item.snapshotSHA,
	};
}
