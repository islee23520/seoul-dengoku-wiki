import { randomUUID } from "node:crypto";
import { closeSync, constants, fsyncSync, linkSync, openSync } from "node:fs";
import { lstat, open, readdir, realpath, unlink } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { z } from "zod";
import { listBatches } from "./batches.ts";
import {
	readComfyCompletion,
	readComfyInterruption,
} from "./comfy-completion-recovery.ts";
import { hash } from "./sources.ts";
import {
	executionJobSchema,
	rejectionJSON,
	rejectionProofFiles,
	TerminalRejectionError,
	terminalRejectionRequestSchema,
	verifyTerminalRejectionV1,
} from "./terminal-rejection-proof.ts";

export const terminalRejectionFile = "terminal-rejection.v1.json";
const eventSchema = z.strictObject({
	schema: z.literal("portal-terminal-rejection.v1"),
	ownerId: z.string().regex(/^\d+$/),
	actorId: z.string().regex(/^\d+$/),
	requestId: z.uuid(),
	committedAt: z.iso.datetime(),
	request: terminalRejectionRequestSchema,
	proofSHA256: z.record(
		z.enum(rejectionProofFiles),
		z.string().regex(/^[a-f0-9]{64}$/),
	),
	job: executionJobSchema,
	modelAttestation: z.literal("UNKNOWN"),
	imageAdoption: z.literal("NONE"),
});
export type TerminalRejectionEvent = z.infer<typeof eventSchema>;
const missing = (error: unknown) =>
	error instanceof Error && "code" in error && error.code === "ENOENT";

async function privateJobDirectory(ownerRoot: string, requestId: string) {
	z.uuid().parse(requestId);
	if (!/^\d+$/.test(basename(ownerRoot))) throw Error("INVALID_PATH");
	const dir = join(ownerRoot, "jobs", requestId);
	for (const path of [ownerRoot, join(ownerRoot, "jobs"), dir])
		if (!(await lstat(path)).isDirectory() || (await realpath(path)) !== path)
			throw Error("INVALID_PATH");
	return dir;
}
async function retainedFile(dir: string, name: string) {
	const file = await open(
		join(dir, name),
		constants.O_RDONLY | constants.O_NOFOLLOW,
	);
	try {
		if (!(await file.stat()).isFile()) throw Error("INVALID_PATH");
		return await file.readFile();
	} finally {
		await file.close();
	}
}
async function retainedProof(dir: string) {
	try {
		return {
			"job.json": await retainedFile(dir, "job.json"),
			"initial-job.json": await retainedFile(dir, "initial-job.json"),
			"request-payload.json": await retainedFile(dir, "request-payload.json"),
			"connection-binding.json": await retainedFile(
				dir,
				"connection-binding.json",
			),
			"provider-source.png.request.json": await retainedFile(
				dir,
				"provider-source.png.request.json",
			),
			"provider-source.png.receipt.json": await retainedFile(
				dir,
				"provider-source.png.receipt.json",
			),
			"provider-source.png.request.bin": await retainedFile(
				dir,
				"provider-source.png.request.bin",
			),
			"provider-source.png.response.bin": await retainedFile(
				dir,
				"provider-source.png.response.bin",
			),
			"dispatch.lock": await retainedFile(dir, "dispatch.lock"),
			"job-history.json": await retainedFile(dir, "job-history.json"),
			"provenance.json": await retainedFile(dir, "provenance.json"),
			"reference-analysis.json": await retainedFile(
				dir,
				"reference-analysis.json",
			),
			"reference-normalized.png": await retainedFile(
				dir,
				"reference-normalized.png",
			),
			"source-bytes.json": await retainedFile(dir, "source-bytes.json"),
		};
	} catch (error) {
		if (missing(error))
			throw new TerminalRejectionError("TERMINAL_REJECTION_PROOF_MISMATCH");
		throw error;
	}
}
async function singleRejectedJob(dir: string, requestId: string) {
	const allowed = new Set<string>([
		...rejectionProofFiles,
		terminalRejectionFile,
	]);
	for (const entry of await readdir(dir, { withFileTypes: true }))
		if (
			!entry.isFile() ||
			(!allowed.has(entry.name) &&
				!/^\.terminal-rejection-[0-9a-f-]+\.tmp$/.test(entry.name))
		)
			throw new TerminalRejectionError("TERMINAL_REJECTION_INELIGIBLE");
	const batches = await listBatches(dirname(dirname(dir)));
	if (
		batches.some((batch) =>
			batch.items.some(
				(item) => item.requestId === requestId || item.jobId === requestId,
			),
		)
	)
		throw new TerminalRejectionError("TERMINAL_REJECTION_INELIGIBLE");
}
async function eventAt(dir: string) {
	let bytes: Buffer;
	try {
		bytes = await retainedFile(dir, terminalRejectionFile);
	} catch (error) {
		if (missing(error)) return null;
		throw error;
	}
	const parsed = eventSchema.safeParse(rejectionJSON(bytes));
	if (!parsed.success)
		throw new TerminalRejectionError("TERMINAL_REJECTION_PROOF_MISMATCH");
	return parsed.data;
}

// The event is authoritative; job.json remains the original evidence forever.
// Every execution-state reader (including admission and replay) uses this fold.
export async function readExecutionJobV1(ownerRoot: string, requestId: string) {
	const dir = await privateJobDirectory(ownerRoot, requestId);
	const event = await eventAt(dir);
	const completion = await readComfyCompletion(ownerRoot, requestId);
	if (completion) {
		if (event)
			throw new TerminalRejectionError("TERMINAL_REJECTION_PROOF_MISMATCH");
		return { job: completion.job, event: null, completion: completion.event };
	}
	if (!event) {
		const job = executionJobSchema.parse(
			rejectionJSON(await retainedFile(dir, "job.json")),
		);
		if (job.id !== requestId)
			throw new TerminalRejectionError("TERMINAL_REJECTION_PROOF_MISMATCH");
		return { job: await readComfyInterruption(dir, job), event: null };
	}
	try {
		await singleRejectedJob(dir, requestId);
		const files = await retainedProof(dir);
		if (
			rejectionProofFiles.some(
				(name) => hash(files[name]) !== event.proofSHA256[name],
			)
		)
			throw new TerminalRejectionError("TERMINAL_REJECTION_PROOF_MISMATCH");
		const proof = await verifyTerminalRejectionV1({
			ownerId: basename(ownerRoot),
			requestId,
			request: event.request,
			files,
		});
		if (
			event.ownerId !== basename(ownerRoot) ||
			event.actorId !== event.ownerId ||
			event.requestId !== requestId ||
			JSON.stringify(event.job) !== JSON.stringify(proof.job) ||
			rejectionProofFiles.some(
				(name) => event.proofSHA256[name] !== proof.proofSHA256[name],
			)
		)
			throw new TerminalRejectionError("TERMINAL_REJECTION_PROOF_MISMATCH");
		return { job: proof.job, event };
	} catch (error) {
		// Missing proof for a committed event must never be treated as a missing
		// job by enumeration/replay and thereby permit a fresh dispatch.
		if (missing(error))
			throw new TerminalRejectionError("TERMINAL_REJECTION_PROOF_MISMATCH");
		throw error;
	}
}

// Server-only writer. The caller holds the existing numeric-owner admission
// exclusion and rechecks its signed session immediately before publication.
export async function commitTerminalRejectionV1(input: {
	readonly ownerRoot: string;
	readonly requestId: string;
	readonly request: z.infer<typeof terminalRejectionRequestSchema>;
	readonly authorize: () => void;
	readonly checkpoint?: (
		point: "before-commit" | "after-commit",
	) => Promise<void>;
}) {
	const { ownerRoot, requestId, request } = input;
	const dir = await privateJobDirectory(ownerRoot, requestId);
	const files = await retainedProof(dir);
	const current = await readExecutionJobV1(ownerRoot, requestId);
	if (current.event) {
		if (JSON.stringify(current.event.request) !== JSON.stringify(request))
			throw new TerminalRejectionError("TERMINAL_REJECTION_CONFLICT");
		return { created: false, event: current.event, job: current.job };
	}
	await singleRejectedJob(dir, requestId);
	const proof = await verifyTerminalRejectionV1({
		ownerId: basename(ownerRoot),
		requestId,
		request,
		files,
	});
	const event = eventSchema.parse({
		schema: "portal-terminal-rejection.v1",
		ownerId: basename(ownerRoot),
		actorId: basename(ownerRoot),
		requestId,
		committedAt: new Date().toISOString(),
		request,
		...proof,
		modelAttestation: "UNKNOWN",
		imageAdoption: "NONE",
	});
	const temporary = join(dir, `.terminal-rejection-${randomUUID()}.tmp`);
	const file = await open(temporary, "wx", 0o600);
	try {
		await file.writeFile(`${JSON.stringify(event)}\n`);
		await file.sync();
	} finally {
		await file.close();
	}
	try {
		await input.checkpoint?.("before-commit");
		// CAS covers the retained bytes too, not just the caller's initial hash.
		const latest = await retainedProof(dir);
		if (
			rejectionProofFiles.some(
				(name) => hash(latest[name]) !== proof.proofSHA256[name],
			)
		)
			throw new TerminalRejectionError("TERMINAL_REJECTION_CONFLICT");
		await singleRejectedJob(dir, requestId);
		input.authorize();
		// No await between publication and directory flush: readers in this sole
		// writer process cannot observe a published but unflushed event. link is
		// exclusive, so neither concurrent operations nor replay replace history.
		const parent = process.platform === "win32" ? null : openSync(dir, "r");
		try {
			linkSync(temporary, join(dir, terminalRejectionFile));
			if (parent !== null) fsyncSync(parent);
		} finally {
			if (parent !== null) closeSync(parent);
		}
		await input.checkpoint?.("after-commit");
		return { created: true, event, job: proof.job };
	} finally {
		await unlink(temporary);
	}
}
