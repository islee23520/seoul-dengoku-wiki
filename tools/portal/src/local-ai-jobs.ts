// allow: SIZE_OK — indivisible durable job state machine with atomic admission and publication; task9 explicitly limits product modules.
import { createHash, randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import {
	mkdir,
	open,
	readdir,
	readFile,
	realpath,
	rename,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import {
	type BrokerReply,
	type BrokerRequest,
	requestSha256,
	requestWorker,
} from "../../local-ai/worker-broker-client.ts";
import { createLocalAiFileAccess } from "./local-ai-file-access.ts";

const uuid = z
	.string()
	.uuid()
	.regex(/^[a-f0-9-]+$/);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const assetId = z.string().regex(/^[a-z0-9-]{1,80}$/);
const seed = z.number().int().min(0).max(2147483647);
export const localAiRequestSchema = z.discriminatedUnion("tool", [
	z.strictObject({
		requestId: uuid,
		tool: z.literal("unimate"),
		assetId,
		prompt: z
			.string()
			.min(1)
			.max(2000)
			.refine((v) => v.trim().length > 0 && !v.includes("\0")),
		seed,
	}),
	z.strictObject({
		requestId: uuid,
		tool: z.literal("uniforge3d"),
		assetId,
		seed,
	}),
]);
export { z as localAiBoundary };
export type LocalAiRequest = z.infer<typeof localAiRequestSchema>;
export const localAiArtifactSchema = z.strictObject({
	id: assetId,
	name: z.string().regex(/^[A-Za-z0-9_.-]+$/),
	bytes: z
		.number()
		.int()
		.positive()
		.max(128 * 1024 * 1024),
	sha256: digest,
	mime: z.enum([
		"model/gltf-binary",
		"application/json",
		"application/octet-stream",
	]),
});
export const localAiReceiptSchema = z.strictObject({
	version: z.literal(1),
	request: localAiRequestSchema,
	adapterRequestSha256: digest,
	sourceRevision: z.string().min(1).max(128),
	runtimeId: assetId,
	modelSha256: digest,
	inputSha256: digest,
	artifacts: z.array(localAiArtifactSchema).min(1).max(3),
});
const jobSchema = z.strictObject({
	id: uuid,
	owner: z.string().regex(/^\d+$/),
	request: localAiRequestSchema,
	state: z.enum(["queued", "running", "succeeded", "failed", "unknown"]),
	errorCode: z.string().nullable(),
	artifacts: z.array(localAiArtifactSchema),
	createdAt: z.string().datetime(),
});
export type LocalAiJob = z.infer<typeof jobSchema>;
export const localAiCatalogSchema = z
	.array(
		z.strictObject({
			tool: z.enum(["unimate", "uniforge3d"]),
			assets: z.array(assetId),
			missingModels: z.array(assetId),
			unsupportedRuntime: z.boolean(),
			licenseRequired: z.boolean(),
			error: z
				.string()
				.regex(/^[A-Z0-9_]+$/)
				.nullable(),
		}),
	)
	.max(2);
export type LocalAiCatalog = z.infer<typeof localAiCatalogSchema>;
const admissionInputSchema = z.strictObject({
	reason: z.string().trim().min(1).max(1000),
	windowId: z.string().trim().min(1).max(128),
});
const admissionStateSchema = admissionInputSchema.extend({
	admission: z.enum(["open", "closed"]),
	updatedAt: z.string().datetime(),
});
export type LocalAiWorker = (
	request: BrokerRequest,
	signal: AbortSignal,
) => Promise<BrokerReply>;
export class LocalAiError extends Error {
	readonly name = "LocalAiError";
	constructor(
		readonly code: string,
		readonly status: number,
	) {
		super(code);
	}
}
const hash = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
function absent(error: unknown) {
	return error instanceof Error && "code" in error && error.code === "ENOENT";
}
async function publish(path: string, value: object) {
	const temporary = `${path}.${randomUUID()}.tmp`;
	const file = await open(temporary, "wx", 0o600);
	try {
		await file.writeFile(JSON.stringify(value));
		await file.sync();
	} finally {
		await file.close();
	}
	await rename(temporary, path);
}

/** One instance per portal storage root. The OS custody lock refuses a second writer. */
export async function createLocalAiJobs(options: {
	readonly storagePath: string;
	readonly catalogPath: string | null;
	readonly worker?: LocalAiWorker;
	readonly catalog?: LocalAiCatalog;
}) {
	const root = join(await realpath(options.storagePath), "local-ai");
	await mkdir(root, { mode: 0o700, recursive: true });
	if (resolve(await realpath(root)) !== resolve(root))
		throw new LocalAiError("LOCAL_AI_PATH_ESCAPE", 503);
	// SQLite owns cross-process custody; process death releases its OS locks.
	const lock = new DatabaseSync(join(root, "custody.sqlite"));
	lock.exec("PRAGMA locking_mode=EXCLUSIVE; BEGIN EXCLUSIVE");
	const jobsRoot = join(root, "jobs");
	await mkdir(jobsRoot, { mode: 0o700, recursive: true });
	if (resolve(await realpath(jobsRoot)) !== resolve(jobsRoot))
		throw new LocalAiError("LOCAL_AI_PATH_ESCAPE", 503);
	const events = new EventEmitter();
	const worker = options.worker ?? requestWorker;
	const pending = new Set<Promise<void>>();
	let closed = false;
	// Serialize admission and publication, including concurrent identical UUIDs.
	let writes = Promise.resolve();
	const admissionPath = join(root, "admission.json");
	let admissionState: z.infer<typeof admissionStateSchema>;
	try {
		if (resolve(await realpath(admissionPath)) !== resolve(admissionPath))
			throw new LocalAiError("LOCAL_AI_PATH_ESCAPE", 503);
		admissionState = admissionStateSchema.parse(
			JSON.parse(await readFile(admissionPath, "utf8")),
		);
	} catch (error) {
		if (!absent(error)) throw error;
		admissionState = {
			admission: "open",
			reason: "INITIAL",
			windowId: "none",
			updatedAt: new Date().toISOString(),
		};
		await publish(admissionPath, admissionState);
	}
	async function admissionStatus() {
		await writes;
		return { ...admissionState };
	}
	async function setAdmission(admission: "open" | "closed", input: unknown) {
		const change = admissionInputSchema.parse(input);
		const operation = writes.then(async () => {
			if (closed) throw new LocalAiError("LOCAL_AI_CLOSED", 503);
			if (
				admissionState.admission === "closed" &&
				admissionState.windowId !== change.windowId
			)
				throw new LocalAiError("ADMISSION_WINDOW_CONFLICT", 409);
			const state = { ...change, admission, updatedAt: new Date().toISOString() };
			await publish(admissionPath, state);
			admissionState = state;
			return { ...state };
		});
		writes = operation.then(
			() => {},
			() => {},
		);
		return operation;
	}
	// Admission serialization alone does not cover execute/get/ownerBlocked.
	// Share one IO queue across every job read and atomic replacement.
	const access = createLocalAiFileAccess();
	async function read(id: string) {
		return access(async () => {
			const directory = join(jobsRoot, uuid.parse(id));
			if (resolve(await realpath(directory)) !== resolve(directory))
				throw new LocalAiError("LOCAL_AI_PATH_ESCAPE", 503);
			const file = join(directory, "job.json");
			if (resolve(await realpath(file)) !== resolve(file))
				throw new LocalAiError("LOCAL_AI_PATH_ESCAPE", 503);
			const job = jobSchema.parse(JSON.parse(await readFile(file, "utf8")));
			if (job.id !== id || job.request.requestId !== id)
				throw new LocalAiError("LOCAL_AI_STORE_MISMATCH", 503);
			return job;
		});
	}
	for (const entry of await readdir(jobsRoot, { withFileTypes: true })) {
		if (!entry.isDirectory() || !uuid.safeParse(entry.name).success) continue;
		const job = await read(entry.name);
		if (job.state === "running" || job.state === "queued")
			await access(() =>
				publish(join(jobsRoot, entry.name, "job.json"), {
					...job,
					state: "unknown",
					errorCode: "PROCESS_INTERRUPTED",
				}),
			);
	}
	async function catalog() {
		const entries =
			options.catalog ??
			(options.catalogPath
				? localAiCatalogSchema.parse(
						JSON.parse(await readFile(options.catalogPath, "utf8")),
					)
				: []);
		return Promise.all(
			(["unimate", "uniforge3d"] as const).map(async (tool) => {
				const entry = entries.find((item) => item.tool === tool) ?? {
					tool,
					assets: [],
					missingModels: [],
					unsupportedRuntime: true,
					licenseRequired: false,
					error: "NOT_CONFIGURED",
				};
				let configurationEligible = false;
				if (
					!entry.error &&
					!entry.unsupportedRuntime &&
					!entry.licenseRequired &&
					!entry.missingModels.length
				) {
					try {
						const proof = await worker(
							{ version: 1, op: "admission" },
							AbortSignal.timeout(10000),
						);
						configurationEligible =
							proof.op === "admission" && proof.configurationEligible;
					} catch (error) {
						if (!(error instanceof Error)) throw error;
					}
				}
				return {
					...entry,
					configurationEligible,
					// Admission closure is observable, not proof of a GPU lease.
					maintenanceReady: admissionState.admission === "closed",
					ready: false,
					error:
						entry.error ??
						(configurationEligible ? null : "GPU_MAINTENANCE_REQUIRED"),
				};
			}),
		);
	}
	async function get(owner: string, id: string) {
		let job: LocalAiJob;
		try {
			job = await read(id);
		} catch (error) {
			if (absent(error)) throw new LocalAiError("NOT_FOUND", 404);
			throw error;
		}
		if (job.owner !== owner) throw new LocalAiError("NOT_FOUND", 404);
		const { owner: _, ...view } = job;
		return view;
	}
	async function execute(job: LocalAiJob) {
		const directory = join(jobsRoot, job.id);
		let terminal: LocalAiJob = {
			...job,
			state: "unknown",
			errorCode: "WORKER_INTERRUPTED",
		};
		try {
			await access(() =>
				publish(join(directory, "job.json"), { ...job, state: "running" }),
			);
			const request = job.request;
			const reply = await worker(
				{
					version: 1,
					op: "run",
					...request,
					prompt: request.tool === "unimate" ? request.prompt : "",
				},
				AbortSignal.timeout(30 * 60 * 1000),
			);
			const expectedRequestHash = requestSha256({
				...request,
				prompt: request.tool === "unimate" ? request.prompt : "",
			});
			if (
				reply.op !== "run" ||
				reply.requestId !== job.id ||
				reply.requestSha256 !== expectedRequestHash
			)
				throw new LocalAiError("WORKER_REPLY_MISMATCH", 502);
			if (reply.state === "FAILED")
				terminal = { ...job, state: "failed", errorCode: "WORKER_FAILED" };
			else if (reply.state === "AWAITING_VALIDATION" && reply.exitCode === 0) {
				const result = await worker(
					{ version: 1, op: "result", requestId: job.id },
					AbortSignal.timeout(10000),
				);
				if (result.op !== "result")
					throw new LocalAiError("WORKER_REPLY_MISMATCH", 502);
				const receipt = localAiReceiptSchema.parse(JSON.parse(result.receipt));
				if (
					JSON.stringify(localAiRequestSchema.parse(receipt.request)) !==
						JSON.stringify(request) ||
					new Set(receipt.artifacts.map((a) => a.id)).size !==
						receipt.artifacts.length
				)
					throw new LocalAiError("WORKER_RECEIPT_MISMATCH", 502);
				await mkdir(join(directory, "artifacts"), { mode: 0o700 });
				for (const artifact of receipt.artifacts) {
					const file = await open(
						join(directory, "artifacts", artifact.id),
						"wx",
						0o600,
					);
					const sha = createHash("sha256");
					try {
						for (let offset = 0; offset < artifact.bytes; ) {
							const chunk = await worker(
								{
									version: 1,
									op: "get",
									artifactId: artifact.id,
									offset,
									length: Math.min(32768, artifact.bytes - offset),
								},
								AbortSignal.timeout(10000),
							);
							if (
								chunk.op !== "get" ||
								chunk.artifactId !== artifact.id ||
								chunk.offset !== offset ||
								chunk.total !== artifact.bytes ||
								chunk.sha256 !== artifact.sha256
							)
								throw new LocalAiError("ARTIFACT_MISMATCH", 502);
							const bytes = Buffer.from(chunk.data, "base64");
							if (
								!bytes.length ||
								bytes.length > Math.min(32768, artifact.bytes - offset)
							)
								throw new LocalAiError("ARTIFACT_BOUNDS", 502);
							sha.update(bytes);
							await file.writeFile(bytes);
							offset += bytes.length;
						}
						if (sha.digest("hex") !== artifact.sha256)
							throw new LocalAiError("ARTIFACT_MISMATCH", 502);
						await file.sync();
					} finally {
						await file.close();
					}
				}
				await publish(join(directory, "receipt.json"), receipt);
				terminal = {
					...job,
					state: "succeeded",
					errorCode: null,
					artifacts: receipt.artifacts,
				};
			}
		} catch (error) {
			if (!(error instanceof Error)) throw error;
			// Do not persist private worker messages, paths, stdout, or ambient secrets.
			terminal = {
				...job,
				state: "unknown",
				errorCode: "WORKER_RESULT_UNCONFIRMED",
			};
		}
		await access(() => publish(join(directory, "job.json"), terminal));
		events.emit("terminal", terminal.id);
	}
	async function create(
		owner: string,
		input: unknown,
		admission?: () => Promise<() => void>,
	) {
		const request = localAiRequestSchema.parse(input);
		const operation = writes.then(async () => {
			if (closed) throw new LocalAiError("LOCAL_AI_CLOSED", 503);
			try {
				const old = await read(request.requestId);
				if (old.owner !== owner) throw new LocalAiError("NOT_FOUND", 404);
				if (JSON.stringify(old.request) !== JSON.stringify(request))
					throw new LocalAiError("REQUEST_CONFLICT", 409);
				return get(owner, old.id);
			} catch (error) {
				if (!absent(error)) throw error;
			}
			if (admissionState.admission === "closed")
				throw new LocalAiError("GPU_MAINTENANCE_REQUIRED", 503);
			const release = await admission?.();
			try {
				const entry = (await catalog()).find(
					(item) => item.tool === request.tool,
				);
				// Eligibility permits an acquisition attempt, never an unleased spawn.
				if (!entry?.configurationEligible)
					throw new LocalAiError(entry?.error ?? "LOCAL_AI_NOT_READY", 503);
				if (!entry.assets.includes(request.assetId))
					throw new LocalAiError("ASSET_NOT_FOUND", 422);
				for (const entry of await readdir(jobsRoot)) {
					if (!uuid.safeParse(entry).success) continue;
					const previous = await read(entry);
					if (
						previous.owner === owner &&
						["queued", "running", "unknown"].includes(previous.state)
					)
						throw new LocalAiError("OWNER_DISPATCH_UNCERTAIN", 409);
				}
				const directory = join(jobsRoot, `.stage-${randomUUID()}`);
				await mkdir(directory, { mode: 0o700 });
				const job: LocalAiJob = {
					id: request.requestId,
					owner,
					request,
					state: "queued",
					errorCode: null,
					artifacts: [],
					createdAt: new Date().toISOString(),
				};
				await publish(join(directory, "request.json"), request);
				await publish(join(directory, "job.json"), job);
				await rename(directory, join(jobsRoot, request.requestId));
				const task = execute(job).finally(() => pending.delete(task));
				pending.add(task);
				return get(owner, job.id);
			} finally {
				release?.();
			}
		});
		writes = operation.then(
			() => {},
			() => {},
		);
		return operation;
	}
	async function artifact(owner: string, id: string, artifactId: string) {
		const job = await get(owner, id);
		const item = job.artifacts.find((a) => a.id === artifactId);
		if (job.state !== "succeeded" || !item)
			throw new LocalAiError("NOT_FOUND", 404);
		const path = join(jobsRoot, id, "artifacts", assetId.parse(artifactId));
		if (resolve(await realpath(path)) !== resolve(path))
			throw new LocalAiError("LOCAL_AI_PATH_ESCAPE", 503);
		const bytes = await readFile(path);
		if (bytes.length !== item.bytes || hash(bytes) !== item.sha256)
			throw new LocalAiError("ARTIFACT_MISMATCH", 503);
		return { ...item, data: bytes };
	}
	async function ownerBlocked(owner: string) {
		for (const entry of await readdir(jobsRoot)) {
			if (!uuid.safeParse(entry).success) continue;
			const job = await read(entry);
			if (
				job.owner === owner &&
				["queued", "running", "unknown"].includes(job.state)
			)
				return true;
		}
		return false;
	}
	let closing: Promise<void> | undefined;
	return {
		admissionStatus,
		setAdmission,
		catalog,
		create,
		get,
		artifact,
		events,
		ownerBlocked,
		close() {
			closed = true;
			closing ??= (async () => {
				await writes;
				await Promise.all(pending);
				lock.close();
			})();
			return closing;
		},
	};
}
