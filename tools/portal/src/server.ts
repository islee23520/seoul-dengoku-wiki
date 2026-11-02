import { randomInt, randomUUID } from "node:crypto";
import { once } from "node:events";
import { constants } from "node:fs";
import {
	lstat,
	mkdir,
	open,
	readdir,
	readFile,
	realpath,
	rename,
	rm,
	stat,
	writeFile,
} from "node:fs/promises";
import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from "node:http";
import { dirname, join, resolve, sep } from "node:path";
import { z } from "zod";
import { generateReferenceSet } from "../../portrait/2d/generate-character-set.mjs";
import { authoredWorkstationLookSchema } from "../../portrait/2d/modular-parts.mjs";
import { sendTrainingDrawingRequest } from "../../portrait/generator/src/training-transport.ts";
import { TransportError } from "../../portrait/generator/src/transport.ts";
import { OriginalStoreError } from "../../people-cli/src/store.ts";
import { type AccessFetch, createAccessVerifier } from "./access.ts";
import { createAuth, type OAuthFetch } from "./auth.ts";
import {
	type Batch,
	type BatchSnapshot,
	batchRequestSchema,
	batchView,
	listBatches,
	readBatch,
	readBatchSnapshot,
	snapshotSchema,
	writeBatch,
} from "./batches.ts";
import {
	comfyCompletionArtifact,
	commitComfyCompletion,
	retainComfyInterruption,
} from "./comfy-completion-recovery.ts";
import {
	dispatchComfy,
	dispatchComfySourceV2,
	dispatchComfyTokenV2,
} from "./comfyui-dispatch.ts";
import {
	COMFY_ENDPOINT,
	type ComfyConnection,
	ComfyError,
	type ComfyTransport,
	comfyCompletionRequestSchema,
	createComfyProvider,
} from "./comfyui-provider.ts";
import { type Config, validateLocalBinding } from "./config.ts";
import {
	COMFY_PROTOCOL,
	type ConnectionSnapshot,
	comfyConnectSchema,
	createConnectionRegistry,
	localConnectSchema,
	type RegisteredEndpoint,
	type VerifiedConnectionSession,
} from "./connections.ts";
import {
	alphaParentSchema,
	createEvaluationStore,
	submitEvaluationSchema,
} from "./evaluations.ts";
import { createLocalAiJobs, type LocalAiCatalog, type LocalAiWorker } from "./local-ai-jobs.ts";
import { dispatchLocal } from "./local-provider.ts";
import {
	createMcpProtocolVerifier,
	type McpEndpointRegistration,
	McpError,
	PORTRAIT_TOOL_DIGEST,
} from "./mcp.ts";
import { startMdns } from "./mdns.ts";
import {
	NATIVE_MOSS_MODEL,
	NATIVE_MOSS_PROFILE_DIGEST,
	NATIVE_MOSS_PROTOCOL,
	nativeMossConnectSchema,
	nativeMossEndpoint,
	nativeMossProfile,
	nativeMossRecipeSchema,
} from "./native-moss-contract.ts";
import {
	createNativeMossProvider,
	type NativeMossProviderAuthority,
} from "./native-moss-provider.ts";
import {
	type NativeMossLifecycleHandle,
	transport as nativeMossTransport,
} from "./native-moss-transport.ts";
import { measurePng } from "./png.ts";
import {
	portraitDeliveryV2,
	trainingPortraitDelivery,
} from "./portrait-size.ts";
import { dispatch } from "./provider.ts";
import {
	accountConnectSchema,
	createProviderConnections,
} from "./provider-connections.ts";
import {
	type ComfyProviderModel,
	comfyWorkflowOf,
	comfyWorkflowSchema,
	comfyWorkflows,
	defaultProviderModel,
	generationProviderModelSchema,
	providerModels,
} from "./provider-models.ts";
import {
	referenceGenerationRequestSchema,
	resolveReferenceSource,
	resolveSourceRecipe,
} from "./reference-contract.ts";
import { dispatchLocalReferenceV2 } from "./reference-provider.ts";
import { transformReferencePng } from "./reference-transform.ts";
import { indexWorkstationArtifact } from "./reference-validation.ts";
import {
	prepareNativeMossDispatchProof,
	referenceAuthority,
	referenceSummary,
	verifyNativeMossWorkbenchResult,
} from "./reference-workbench.ts";
import {
	dispatchReference,
	generatePortalWorkstation,
	parseWorkstationRequest,
	referenceCatalog,
	referenceInputs,
	referenceKinds,
	referenceRequestSchema,
	workstationParent,
} from "./references.ts";
import {
	acquireReferenceSource,
	referenceAcquisitionView,
} from "./source-acquisition.ts";
import {
	adaptSheet,
	generationSheetFromBytes,
	hash,
	loadTemplate,
	openCharacters,
	registrationSchema,
	type Sheet,
	sheetFromBytes,
	type Template,
} from "./sources.ts";
import { terminalRejectionRequestSchema } from "./terminal-rejection-proof.ts";
import {
	commitTerminalRejectionV1,
	readExecutionJobV1,
	terminalRejectionFile,
} from "./terminal-rejections.ts";
import {
	acquireTrainingSource,
	loadTrainingStyles,
	prepareTrainingGeneration,
	quarantineTrainingResponse,
	trainingRequestSchema,
	verifyTrainingResult,
} from "./training-generation.ts";
import { createWikiSource, WikiError } from "./wiki.ts";

const idSchema = z.string().uuid();
const releaseArtifactPaths = [
	"server.mjs",
	"cli.mjs",
	"mcp.mjs",
	"public/index.html",
	"public/portal.css",
	"public/portal.mjs",
	"public/tokens.css",
	"private/training/shared-target-drawing-v3/images/person-0998.png",
	"private/training/shared-target-drawing-v3/images/person-0399.png",
	"private/native-moss/manifest.json",
	"private/native-moss/alpha-refinement.py",
	"private/native-moss/content_v1.py",
	"private/native-moss/context_v1.py",
	"private/native-moss/job.py",
	"private/native-moss/lifecycle.py",
	"private/native-moss/native_runner_v1.py",
	"private/native-moss/newhost-proof.py",
	"private/native-moss/png_v1.ts",
	"private/native-moss/reference_pipeline_recipes.py",
	"private/native-moss/runtime.py",
	"private/native-moss/token_pipeline_observed.py",
	"private/native-moss/transform-stdin.ts",
	"private/native-moss/transform_v1.ts",
] as const;
const releaseFileSchema = z.strictObject({
	path: z.enum(releaseArtifactPaths),
	bytes: z.int().nonnegative(),
	sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
const releaseManifestSchema = z.strictObject({
	schema: z.literal("ssstool-private-release.v1"),
	runtime: z.literal("node>=24"),
	targets: z.tuple([
		z.literal("darwin-arm64"),
		z.literal("win32-x64"),
		z.literal("linux-x64-glibc"),
	]),
	releaseId: z.string().regex(/^[a-f0-9]{64}$/),
	artifacts: z.array(releaseFileSchema).length(releaseArtifactPaths.length),
	archives: z
		.array(
			z.strictObject({
				path: z.enum(["ssstool-release.tar", "ssstool-release.zip"]),
				format: z.enum(["tar", "zip"]),
				bytes: z.int().nonnegative(),
				sha256: z.string().regex(/^[a-f0-9]{64}$/),
			}),
		)
		.length(2),
});
const generationSchema = z
	.object({
		requestId: idSchema,
		connectionId: idSchema.optional(),
		personId: z.string().min(1).optional(),
		sheetId: idSchema.optional(),
		providerModel: generationProviderModelSchema,
		// ComfyUI only: explicit reproducible sampler seed. Omitted means the
		// server draws one and records it in the retained request evidence.
		seed: z.number().int().min(0).max(2 ** 48 - 1).optional(),
		size: z.enum(["340x510", "1024x1536"]).optional(),
		faceMode: z
			.object({ kind: z.literal("unique"), variantId: z.null() })
			.strict(),
	})
	.strict()
	.refine((p) => Boolean(p.personId) !== Boolean(p.sheetId))
	.refine(
		(p) => comfyWorkflowOf(p.providerModel)
			? p.size === undefined || p.size === "340x510"
			: p.seed === undefined && (p.size === undefined || p.size === "1024x1536"),
	);
const jobSchema = z
	.object({
		id: idSchema,
		state: z.enum(["RUNNING", "HOLD", "FAILED", "UNKNOWN"]),
		reviewStatus: z.literal("HOLD"),
		imageUrl: z.string().nullable(),
		metrics: z.record(z.string(), z.unknown()).nullable(),
		errorCode: z.string().nullable(),
		payloadSHA: z.string(),
	})
	.strict();
const jobHistorySchema = z.strictObject({ createdAt: z.iso.datetime() });
function reply(res: ServerResponse, status: number, value: unknown) {
	res
		.writeHead(status, {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store",
			"x-content-type-options": "nosniff",
		})
		.end(JSON.stringify(value));
}
function fail(code: string, status = 400): never {
	throw Object.assign(Error(code), { status });
}
async function body(req: IncomingMessage) {
	const chunks: Buffer[] = [];
	let size = 0;
	for await (const chunk of req) {
		const b = Buffer.from(chunk);
		size += b.length;
		if (size > 12582912) fail("BODY_TOO_LARGE", 413);
		chunks.push(b);
	}
	return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}
function decode(text: string, max: number) {
	const bytes = Buffer.from(text, "base64");
	if (bytes.length > max || bytes.toString("base64") !== text)
		fail("INVALID_SOURCE_BYTES", 422);
	return new Uint8Array(bytes);
}
export async function createPortal(
	config: Config,
	options: {
		template?: Template;
		oauthFetch?: OAuthFetch;
		accessFetch?: AccessFetch;
		testEndpoints?: readonly McpEndpointRegistration[];
		controlledReferences?: boolean;
		// Internal CPU-test orchestration seam, never request/config input.
		nativeMossTest?: {
			createProvider: typeof createNativeMossProvider;
			readiness: () => Promise<{ state: "READY" | "NOT_READY"; code?: string }>;
			dispatchProof?: (
				request: unknown,
				authority: NativeMossProviderAuthority,
			) => NativeMossProviderAuthority["dispatchProof"];
		};
		// Test-only ComfyUI transport injection; production always uses the
		// adapter's own fetch/WebSocket against the reviewed constant endpoint.
		comfyTransport?: ComfyTransport;
		comfyMeasureFinishing?: NonNullable<
			Parameters<typeof createComfyProvider>[0]["measureFinishing"]
		>;
		comfyMeasureAssets?: NonNullable<
			Parameters<typeof createComfyProvider>[0]["measureAssets"]
		>;
		localAi?: { readonly worker: LocalAiWorker; readonly catalog: LocalAiCatalog };
		now?: () => number;
		referenceSend?: (request: Request) => Promise<Response>;
		terminalRejectionCheckpoint?: (
			point: "before-commit" | "after-commit",
		) => Promise<void>;
		comfyCompletionCheckpoint?: (
			point: "before-commit" | "after-commit",
		) => Promise<void>;
	} = {},
) {
	if (options.controlledReferences && process.env.NODE_ENV !== "test")
		throw Error("INVALID_REFERENCE_TEST_REGISTRATION");
	const auth = createAuth(config, options.oauthFetch);
	const now = options.now ?? Date.now;
	const verifyAccess = createAccessVerifier(config, options.accessFetch);
	const ownProvider = config.mode === "local" || config.mode === "personal";
	const accountProviders = createProviderConnections(
		config.mode === "personal" ? config.storagePath : null,
	);
	if (
		options.testEndpoints &&
		(process.env.NODE_ENV !== "test" ||
			options.testEndpoints.some(
				(entry) => entry.egress.kind !== "test-loopback",
			))
	)
		throw Error("INVALID_ENDPOINT_REGISTRATION");
	const registrations = options.testEndpoints ?? config.mcpEndpoints;
	if (
		registrations.some(
			(entry) => entry.toolSchemaDigest !== PORTRAIT_TOOL_DIGEST,
		)
	)
		throw Error("INVALID_ENDPOINT_REGISTRATION");
	if (
		(options.nativeMossTest ||
			options.referenceSend ||
			options.comfyCompletionCheckpoint ||
			options.terminalRejectionCheckpoint ||
			options.comfyTransport ||
			options.comfyMeasureAssets ||
			options.comfyMeasureFinishing) &&
		process.env.NODE_ENV !== "test"
	)
		throw Error("INVALID_ENDPOINT_REGISTRATION");
	// ComfyUI is offered only to the owner's own local/personal workload when
	// explicitly enabled; hosted/MCP deployments never register it.
	const comfyAvailable = ownProvider && config.comfyui;
	const nativeAvailable = ownProvider && config.nativeMoss;
	let nativeReason = nativeAvailable
		? "NATIVE_UPSTREAM_ATTESTATION_MISSING"
		: "NATIVE_NOT_CONFIGURED";
	const nativeReadiness = async () =>
		options.nativeMossTest
			? options.nativeMossTest.readiness()
			: createNativeMossProvider({
					jobDirectory: async () => {
						throw Error("NATIVE_RESERVATION_REQUIRED");
					},
				}).readiness();
	const endpoints: RegisteredEndpoint[] = ownProvider
		? [
				{
					endpointId: "local-openai",
					revision: "local-openai.v1",
					protocolVersion: "openai-compatible-http.v1" as const,
					toolName: "openai-images-edits",
					toolSchemaDigest: hash(
						Buffer.from(
							"openai-compatible-http.v1:/images/edits:canonical-multipart",
						),
					),
				},
			]
		: registrations.map(
				({
					endpointId,
					revision,
					protocolVersion,
					toolName,
					toolSchemaDigest,
				}) => ({
					endpointId,
					revision,
					protocolVersion,
					toolName,
					toolSchemaDigest,
				}),
			);
	const mcp = createMcpProtocolVerifier({ egress: registrations });
	if (nativeAvailable) endpoints.push(nativeMossEndpoint);
	const transports = new Map<
		string,
		{
			binding: ConnectionSnapshot;
			timer: ReturnType<typeof setTimeout>;
			nextRpcId: number;
		}
	>();
	const runningBatches = new Map<
		string,
		{
			batch: Batch;
			binding: ConnectionSnapshot;
			ownerRoot: string;
			writes: Promise<void>;
		}
	>();
	const dispatchers = new Set<Promise<void>>();
	let closing = false;
	function commitBatch(
		row: typeof runningBatches extends Map<string, infer T> ? T : never,
	) {
		row.batch.updatedAt = new Date().toISOString();
		row.batch.revision++;
		const committed = structuredClone(row.batch);
		row.writes = row.writes
			.then(() => writeBatch(row.ownerRoot, committed))
			.then(() => {
				server.emit("batch", batchView(committed));
			});
		return row.writes;
	}
	function stopPending(connectionId: string, reason: string) {
		for (const row of runningBatches.values())
			if (row.binding.connectionId === connectionId) {
				for (const item of row.batch.items)
					if (item.status === "PENDING") item.status = "CANCELLED";
				row.batch.state = row.batch.items.some((i) => i.status === "UNKNOWN")
					? "PAUSED_UNKNOWN"
					: reason === "PROCESS_RESTART"
						? "PAUSED_RESTART"
						: "PAUSED_BLOCKED";
				row.batch.pauseReason = reason;
				void commitBatch(row).catch((error) =>
					server.emit("batch-error", error),
				);
			}
	}
	// One registered Comfy endpoint per server-owned workflow; a connection is
	// pinned to the workflow (toolName) whose readiness it verified.
	if (comfyAvailable)
		for (const workflow of comfyWorkflows)
			endpoints.push({
				endpointId: workflow.endpointId,
				revision: "comfyui.v1",
				protocolVersion: COMFY_PROTOCOL,
				toolName: workflow.id,
				toolSchemaDigest: hash(
					Buffer.from(`${COMFY_PROTOCOL}:${workflow.id}:${COMFY_ENDPOINT}`),
				),
			});
	// One adapter per Comfy registry connection. `proof` is the adapter-bound
	// readiness result; `authorize` is set only for the single operation in
	// flight (connect or one job) so every outbound call rechecks the live
	// owner/session/job binding through the registry.
	type ComfyRow = {
		controller: AbortController;
		provider: ReturnType<typeof createComfyProvider>;
		proof: ComfyConnection | null;
		authorize: (<T>(start: () => T) => T) | null;
	};
	const comfyRows = new Map<string, ComfyRow>();
	const closeTransport = (id: string) => {
		stopPending(id, closing ? "PROCESS_RESTART" : "CONNECTION_NOT_READY");
		const row = transports.get(id);
		if (row) clearTimeout(row.timer);
		transports.delete(id);
		comfyRows.get(id)?.controller.abort();
		comfyRows.delete(id);
		mcp.close(id);
	};
	const registry = createConnectionRegistry({
		local: ownProvider,
		nativeMoss: nativeAvailable,
		sessionScoped: config.mode === "personal",
		personalProvider: config.personalProvider,
		verifySession: auth.verify,
		endpoints,
		verifyProtocol: async (request) => {
			const timer = setTimeout(
				() => {
					registry.expire(request.binding.connectionId);
					closeTransport(request.binding.connectionId);
				},
				Math.max(0, request.binding.expiresAt - Date.now()),
			);
			timer.unref();
			transports.set(request.binding.connectionId, {
				binding: request.binding,
				timer,
				nextRpcId: 3,
			});
			if (request.binding.protocolVersion === NATIVE_MOSS_PROTOCOL) {
				try {
					const proof = await request.outbound(() => nativeReadiness());
					if (proof.state !== "READY") {
						nativeReason = proof.code ?? "NATIVE_READINESS_UNVERIFIED";
						fail(nativeReason, 503);
					}
					nativeReason = "";
					return { ...request.binding, tools: true };
				} catch (error) {
					closeTransport(request.binding.connectionId);
					throw error;
				}
			}
			if (request.binding.protocolVersion === COMFY_PROTOCOL) {
				const id = request.binding.connectionId;
				const row: ComfyRow = {
					controller: new AbortController(),
					proof: null,
					authorize: (start) => request.outbound(() => start()),
					provider: createComfyProvider({
						...(options.comfyMeasureFinishing
							? { measureFinishing: options.comfyMeasureFinishing }
							: {}),
						...(options.comfyMeasureAssets
							? { measureAssets: options.comfyMeasureAssets }
							: {}),
						...(options.comfyTransport
							? { transport: options.comfyTransport }
							: {}),
						authorize: (start) => {
							const current = comfyRows.get(id)?.authorize;
							if (!current) throw Error("CONNECTION_NOT_READY");
							return current(start);
						},
					}),
				};
				comfyRows.set(id, row);
				try {
					// Readiness only: /system_stats and /object_info, never /prompt.
					row.proof = await row.provider.connect(
						comfyWorkflowSchema.parse(request.binding.toolName),
					);
					row.authorize = null;
					return { ...request.binding, tools: true };
				} catch (error) {
					closeTransport(id);
					throw error;
				}
			}
			if (ownProvider) return { ...request.binding, tools: true };
			try {
				return await mcp.verifyProtocol(request);
			} catch (error) {
				closeTransport(request.binding.connectionId);
				throw error;
			}
		},
	});
	const publicConnection = (binding: ConnectionSnapshot | null) => {
		if (!binding) return null;
		const {
			ownerId: _owner,
			sessionFingerprint: _fingerprint,
			...status
		} = binding;
		return status;
	};
	const nativeCapability = (context: VerifiedConnectionSession) => {
		const connection = nativeAvailable
			? registry.current(context, NATIVE_MOSS_PROTOCOL)
			: null;
		return {
			configured: nativeAvailable,
			model: NATIVE_MOSS_MODEL,
			profileDigest: NATIVE_MOSS_PROFILE_DIGEST,
			adapterSHA256: nativeMossProfile.adapterSHA256,
			recipes: nativeMossRecipeSchema.options,
			modes: ["reference-img2img", "token-only"],
			preserveOnly: true,
			provisional: true,
			styleStatus: "HOLD",
			generationEnabled:
				nativeAvailable && !nativeReason && connection?.state === "READY",
			reason: nativeReason || null,
			connection: connection
				? {
						connectionId: connection.connectionId,
						state: connection.state,
						expiresAt: connection.expiresAt,
						protocolVersion: NATIVE_MOSS_PROTOCOL,
						profileDigest: NATIVE_MOSS_PROFILE_DIGEST,
					}
				: null,
		};
	};
	const wiki = createWikiSource(config.wikiBaseUrl);
	const characters = config.originalsDb
		? openCharacters(config.originalsDb)
		: null;
	const template =
		options.template ??
		(config.templateManifest && config.templatePins
			? await loadTemplate(config.templateManifest, config.templatePins)
			: null);
	if (config.storagePath)
		await mkdir(config.storagePath, { recursive: true, mode: 0o700 });
	const root = config.storagePath ? await realpath(config.storagePath) : null;
	if (options.localAi && process.env.NODE_ENV !== "test")
		throw Error("INVALID_LOCAL_AI_TEST_REGISTRATION");
	const localAi = root
		? await createLocalAiJobs({
				storagePath: root,
				catalogPath: config.localAiCatalog,
				...options.localAi,
			})
		: null;
	const active = new Set<string>();
	const terminalRejectionWrites = new Map<string, Promise<void>>();
	let reserved = 0;
	async function privatePath(owner: string, ...parts: string[]) {
		if (!root) fail("STORAGE_NOT_CONFIGURED", 503);
		if (
			!/^\d+$/.test(owner) ||
			parts.some((p) => !/^[-a-zA-Z0-9.]+$/.test(p) || p === "..")
		)
			fail("INVALID_PATH");
		const path = resolve(root, owner, ...parts);
		if (!path.startsWith(root + sep)) fail("INVALID_PATH");
		let current = path;
		for (;;) {
			try {
				const actual = await realpath(current);
				if (actual !== root && !actual.startsWith(root + sep))
					fail("INVALID_PATH");
				break;
			} catch (error) {
				if (
					!(
						error instanceof Error &&
						"code" in error &&
						error.code === "ENOENT"
					)
				)
					throw error;
				current = dirname(current);
			}
		}
		return path;
	}
	async function usage(path: string): Promise<number> {
		let total = 0;
		for (const entry of await readdir(path, { withFileTypes: true })) {
			const p = join(path, entry.name);
			if (entry.isSymbolicLink()) fail("INVALID_PATH");
			total += entry.isDirectory() ? await usage(p) : (await stat(p)).size;
		}
		return total;
	}
	async function save(path: string, value: unknown) {
		await mkdir(dirname(path), { recursive: true, mode: 0o700 });
		await writeFile(path, `${JSON.stringify(value)}\n`, {
			flag: "wx",
			mode: 0o600,
		});
	}
	async function runJob(
		context: VerifiedConnectionSession,
		binding: ConnectionSnapshot,
		dir: string,
		job: z.infer<typeof jobSchema>,
		projection: Parameters<typeof dispatch>[0]["projection"],
		orderedImageBytes: Uint8Array[],
		gate?: () => void,
		comfy?: { providerModel: ComfyProviderModel; seed: number },
	) {
		server.emit(`jobs:${context.ownerId}`);
		try {
			const result = comfy
				? await runComfy(context, binding, dir, job.id, projection, comfy, gate)
				: ownProvider
					? await dispatchLocal(
							{ projection, orderedImageBytes, requestId: job.id },
							{
								directory: dir,
								model: registry.dispatch(
									context,
									binding,
									(_endpoint, _key, _url, model) =>
										model ?? defaultProviderModel,
								),
								outbound: (start) => {
									gate?.();
									return registry.dispatch(context, binding, start);
								},
							},
						)
					: await dispatch(
							{ projection, orderedImageBytes, requestId: job.id },
							{
								binding,
								mcp,
								directory: dir,
								nextRpcId: () => {
									const row = transports.get(binding.connectionId);
									if (!row) throw Error("CONNECTION_NOT_READY");
									return row.nextRpcId++;
								},
								outbound: (start) => {
									gate?.();
									return registry.dispatch(context, binding, start);
								},
							},
						);
			let metrics: ReturnType<typeof measurePng>;
			try {
				metrics = measurePng(result.bytes);
			} catch (error) {
				if (error instanceof Error && error.message === "INVALID_PNG")
					throw comfy
						? new ComfyError("COMFY_OUTPUT_MISMATCH")
						: new McpError("MCP_INVALID_RESPONSE", false, result.responseBytes);
				throw error;
			}
			await save(join(dir, "machine-diagnostics.json"), metrics);
			job = {
				...job,
				state: "HOLD",
				imageUrl: `${config.basePath}/api/jobs/${job.id}/image`,
				metrics,
			};
		} catch (error) {
			if (!(error instanceof McpError) && !(error instanceof ComfyError))
				throw error;
			job = {
				...job,
				state: error.uncertain ? "UNKNOWN" : "FAILED",
				errorCode: error.code,
			};
		}
		await save(join(dir, "terminal.json"), job);
		await rename(join(dir, "terminal.json"), join(dir, "job.json"));
		server.emit(`jobs:${context.ownerId}`);
		return job;
	}
	async function runComfy(
		context: VerifiedConnectionSession,
		binding: ConnectionSnapshot,
		dir: string,
		requestId: string,
		projection: Parameters<typeof dispatch>[0]["projection"],
		comfy: { providerModel: ComfyProviderModel; seed: number },
		gate?: () => void,
	) {
		const row = comfyRows.get(binding.connectionId);
		// A revoked or never-verified Comfy connection fails the job closed before
		// any network call; a second operation on one connection is refused.
		if (!row?.proof) throw new ComfyError("COMFY_CONNECTION_NOT_READY");
		if (row.authorize) throw new ComfyError("COMFY_CONNECTION_BUSY");
		row.authorize = (start) => {
			gate?.();
			return registry.dispatch(context, binding, () => start());
		};
		try {
			return await dispatchComfy(
				{
					projection,
					requestId,
					providerModel: comfy.providerModel,
					seed: comfy.seed,
				},
				{ directory: dir, provider: row.provider, connection: row.proof, signal: row.controller.signal },
			);
		} finally {
			row.authorize = null;
		}
	}
	async function runBatch(
		row: typeof runningBatches extends Map<string, infer T> ? T : never,
		context: VerifiedConnectionSession,
		reservation: number,
	) {
		try {
			for (const item of row.batch.items) {
				if (item.status !== "PENDING" || row.batch.state !== "RUNNING")
					continue;
				registry.dispatch(context, row.binding, () => undefined);
				const { snapshot, files } = await readBatchSnapshot(
					row.ownerRoot,
					row.batch,
					item,
				);
				const required = (role: string) => {
					const bytes = files[role];
					if (!bytes) fail("SOURCE_SNAPSHOT_MISMATCH", 409);
					return bytes;
				};
				if (item.status !== "PENDING" || row.batch.state !== "RUNNING")
					continue;
				registry.dispatch(context, row.binding, () => undefined);
				item.status = "RUNNING";
				item.jobId = item.requestId;
				item.startedAt = new Date().toISOString();
				await commitBatch(row);
				const dir = await privatePath(
					row.batch.ownerId,
					"jobs",
					item.requestId,
				);
				await mkdir(dir, { recursive: true, mode: 0o700 });
				const lock = await open(join(dir, "dispatch.lock"), "wx", 0o600);
				await lock.close();
				const payload = generationSchema.parse({
					requestId: item.requestId,
					connectionId: row.binding.connectionId,
					personId: item.personId,
					providerModel: row.batch.providerModel,
					size: "1024x1536",
					faceMode: row.batch.faceMode,
				});
				const job = jobSchema.parse({
					id: item.requestId,
					state: "RUNNING",
					reviewStatus: "HOLD",
					imageUrl: null,
					metrics: null,
					errorCode: null,
					payloadSHA: hash(Buffer.from(JSON.stringify(payload))),
				});
				await save(join(dir, "job.json"), job);
				await save(join(dir, "initial-job.json"), job);
				await save(join(dir, "job-history.json"), {
					createdAt: row.batch.createdAt,
				});
				await save(join(dir, "batch-binding.json"), {
					schema: "portal-job-batch-binding.v1",
					ownerId: row.batch.ownerId,
					batchId: row.batch.batchId,
					itemId: item.itemId,
					requestId: item.requestId,
					snapshotSHA: item.snapshotSHA,
				});
				await save(join(dir, "request-payload.json"), payload);
				await save(join(dir, "connection-binding.json"), row.binding);
				await save(join(dir, "source-bytes.json"), {
					detail: required("detail").toString("base64"),
					token: required("token").toString("base64"),
					image:
						snapshot.selection.originalSourceHashes.image === null
							? null
							: required("image").toString("base64"),
					pins: snapshot.pins,
				});
				await writeFile(join(dir, "provenance.json"), required("provenance"), {
					flag: "wx",
					mode: 0o600,
				});
				const projection = JSON.parse(
					required("projection").toString(),
				) as Parameters<typeof dispatch>[0]["projection"];
				const terminal = await runJob(
					context,
					row.binding,
					dir,
					job,
					projection,
					snapshot.references.map((r) => {
						const bytes = Object.entries(snapshot.files).find(
							([_key, value]) => value === r.sha256,
						);
						if (!bytes) fail("SOURCE_SNAPSHOT_MISMATCH", 409);
						return required(bytes[0]);
					}),
					() => {
						if (
							row.batch.state !== "RUNNING" &&
							row.batch.state !== "CANCEL_REQUESTED"
						)
							throw Error("CONNECTION_NOT_READY");
					},
				);
				item.status = terminal.state;
				item.errorCode = terminal.errorCode;
				if (terminal.state !== "UNKNOWN")
					item.finishedAt = new Date().toISOString();
				if (terminal.state === "UNKNOWN") {
					row.batch.state = "PAUSED_UNKNOWN";
					row.batch.pauseReason = "OWNER_DISPATCH_UNCERTAIN";
				}
				await commitBatch(row);
				if (terminal.state === "UNKNOWN") break;
			}
			if (
				row.batch.state === "RUNNING" ||
				row.batch.state === "CANCEL_REQUESTED"
			)
				row.batch.state = row.batch.cancelRequested ? "CANCELLED" : "COMPLETED";
			await commitBatch(row);
		} catch (error) {
			const unresolved = row.batch.items.find((i) => i.status === "RUNNING");
			if (unresolved) {
				unresolved.status = "UNKNOWN";
				unresolved.errorCode = "OWNER_DISPATCH_UNCERTAIN";
			}
			row.batch.state = unresolved
				? "PAUSED_UNKNOWN"
				: closing
					? "PAUSED_RESTART"
					: "PAUSED_BLOCKED";
			row.batch.pauseReason = unresolved
				? "OWNER_DISPATCH_UNCERTAIN"
				: error instanceof Error
					? error.message
					: "CONNECTION_NOT_READY";
			let authorityLost = closing;
			try {
				registry.dispatch(context, row.binding, () => undefined);
			} catch {
				authorityLost = true;
			}
			if (!unresolved && authorityLost)
				for (const item of row.batch.items)
					if (item.status === "PENDING") item.status = "CANCELLED";
			await commitBatch(row);
		} finally {
			try {
				await row.writes;
			} finally {
				reserved -= reservation;
				active.delete(row.batch.ownerId);
				if (!row.batch.items.some((i) => i.status === "PENDING"))
					runningBatches.delete(row.batch.batchId);
			}
		}
	}
	if (root) {
		for (const owner of await readdir(root, { withFileTypes: true }))
			if (/^\d+$/.test(owner.name)) {
				if (!owner.isDirectory()) fail("INVALID_PATH");
				const ownerRoot = await privatePath(owner.name);
				for (const job of await ownerJobs(owner.name)) {
					if (job.state !== "RUNNING") continue;
					const dir = await privatePath(owner.name, "jobs", job.id);
					if (await retainComfyInterruption(dir)) continue;
					await save(join(dir, "interrupted-job.json"), job);
					await save(join(dir, "restart-job.json"), {
						...job,
						state: "UNKNOWN",
						errorCode: "OWNER_DISPATCH_UNCERTAIN",
					});
					await rename(join(dir, "restart-job.json"), join(dir, "job.json"));
				}
				for (const batch of await listBatches(ownerRoot))
					if (
						batch.state === "RUNNING" ||
						batch.state === "CANCEL_REQUESTED" ||
						((batch.state === "PAUSED_UNKNOWN" ||
							batch.state === "PAUSED_BLOCKED") &&
							batch.items.some((i) => i.status === "PENDING"))
					) {
						for (const item of batch.items) {
							if (item.status === "PENDING") item.status = "CANCELLED";
							else if (item.status === "RUNNING") item.status = "UNKNOWN";
						}
						batch.state = batch.items.some((i) => i.status === "UNKNOWN")
							? "PAUSED_UNKNOWN"
							: "PAUSED_RESTART";
						batch.pauseReason =
							batch.state === "PAUSED_UNKNOWN"
								? "OWNER_DISPATCH_UNCERTAIN"
								: "PROCESS_RESTART";
						batch.revision++;
						batch.updatedAt = new Date().toISOString();
						await writeBatch(ownerRoot, batch);
					}
			}
	}
	async function ownerJobs(owner: string) {
		const jobs: z.infer<typeof jobSchema>[] = [];
		const ownerJobs = await privatePath(owner, "jobs");
		try {
			for (const entry of await readdir(ownerJobs, { withFileTypes: true })) {
				if (!entry.isDirectory() || !idSchema.safeParse(entry.name).success)
					continue;
				jobs.push(
					(await readExecutionJobV1(await privatePath(owner), entry.name)).job,
				);
			}
		} catch (error) {
			if (
				!(error instanceof Error && "code" in error && error.code === "ENOENT")
			)
				throw error;
		}
		return jobs;
	}
	async function jobHistory(owner: string, jobs: z.infer<typeof jobSchema>[]) {
		return Promise.all(
			jobs.map(async (job) => {
				let providerModel: string | null = null;
				try {
					providerModel = z
						.object({ providerModel: z.string() })
						.parse(
							JSON.parse(
								await readFile(
									await privatePath(
										owner,
										"jobs",
										job.id,
										"request-payload.json",
									),
									"utf8",
								),
							),
						).providerModel;
				} catch (error) {
					if (
						!(error instanceof z.ZodError) &&
						!(
							error instanceof Error &&
							"code" in error &&
							error.code === "ENOENT"
						)
					)
						throw error;
				}
				let createdAt: string | null = null;
				try {
					createdAt = jobHistorySchema.parse(
						JSON.parse(
							await readFile(
								await privatePath(owner, "jobs", job.id, "job-history.json"),
								"utf8",
							),
						),
					).createdAt;
				} catch (error) {
					if (
						!(
							error instanceof Error &&
							"code" in error &&
							error.code === "ENOENT"
						)
					)
						throw error;
				}
				try {
					const retained = z
						.object({
							detail: z.string(),
							token: z.string(),
							image: z.string().nullable(),
						})
						.parse(
							JSON.parse(
								await readFile(
									await privatePath(owner, "jobs", job.id, "source-bytes.json"),
									"utf8",
								),
							),
						);
					const sheet =
						retained.image === null
							? generationSheetFromBytes(
									Buffer.from(retained.detail, "base64"),
									Buffer.from(retained.token, "base64"),
									null,
								)
							: sheetFromBytes(
									Buffer.from(retained.detail, "base64"),
									Buffer.from(retained.token, "base64"),
									Buffer.from(retained.image, "base64"),
								);
					const provenance = JSON.parse(
						await readFile(
							await privatePath(owner, "jobs", job.id, "provenance.json"),
							"utf8",
						),
					);
					if (
						["detail", "token", "image"].some(
							(role) =>
								provenance.original?.[role] !==
								sheet.sourceHashes[role as keyof typeof sheet.sourceHashes],
						)
					)
						throw Error("SOURCE_SNAPSHOT_MISMATCH");
					return {
						job,
						createdAt,
						providerModel,
						reference: provenance.reference ?? null,
						classification: {
							kind: "portrait",
							reviewAuthority: "owner",
						},
						source: {
							personId: sheet.personId,
							characterId: sheet.characterId,
							name: sheet.name,
						},
						sourceError: null,
					};
				} catch (error) {
					if (!(error instanceof Error)) throw error;
					return {
						job,
						createdAt,
						providerModel,
						classification: {
							kind: "portrait",
							reviewAuthority: "owner",
						},
						source: null,
						sourceError: "CAPTURED_SOURCE_UNAVAILABLE",
					};
				}
			}),
		);
	}
	async function ownerLease(
		owner: string,
		snapshot?: z.infer<typeof jobSchema>[],
		localAiRequest = false,
	) {
		const jobs = (snapshot ?? (await ownerJobs(owner))).filter(
			(job) => job.state === "UNKNOWN" || job.state === "RUNNING",
		);
		const batches = (await listBatches(await privatePath(owner))).filter(
			(batch) =>
				batch.items.some(
					(item) => item.status === "UNKNOWN" || item.status === "RUNNING",
				),
		);
		return {
			active: active.has(owner),
			admissionBlocked: jobs.length > 0 || batches.length > 0 || (!localAiRequest && (await localAi?.ownerBlocked(owner)) === true),
			reason: jobs.length || batches.length ? "OWNER_DISPATCH_UNCERTAIN" : null,
			requestIds: jobs.map((job) => job.id),
			batchIds: batches.map((batch) => batch.batchId),
		};
	}
	async function checkOwnerUncertain(owner: string) {
		if ((await ownerLease(owner)).admissionBlocked)
			fail("OWNER_DISPATCH_UNCERTAIN", 409);
	}
	async function inspectJob(owner: string, id: string) {
		const { job, event, completion } = await readExecutionJobV1(
			await privatePath(owner),
			id,
		);
		const artifacts: Record<
			string,
			{ available: boolean; bytes?: number; sha256?: string }
		> = {};
		const records = new Map<string, Buffer>();
		for (const name of [
			"initial-job.json",
			"interrupted-job.json",
			"job.json",
			terminalRejectionFile,
			"request-payload.json",
			"source-bytes.json",
			"provenance.json",
			"projection.json",
			"batch-binding.json",
			"dispatch.lock",
			"candidate.png.request.json",
			"mcp-request.bin",
			"mcp-response.bin",
			"mcp-response.json",
			"provider-request.bin",
			"provider-source.png.request.bin",
			"provider-source.png.request.json",
			"provider-source.png.response.bin",
			"provider-source.png.receipt.json",
			"reference-records.json",
			"reference-analysis.json",
			"reference-normalized.png",
			"provider-request.json",
			"provider-response.bin",
			"provider-response.json",
			"comfy-prompt.txt",
			"comfy-prompt.json",
			"comfy-request.json",
			"comfy-history.json",
			"comfy-response.json",
			"comfy-assets.json",
			"comfy-finishing-assets.json",
			"provider-raw.png",
			"provider-mask.png",
			"provider-raw-mask.png",
			"provider-native.png",
			"provider-source.png",
			"provider-canonical.receipt.json",
			"candidate.png",
			"candidate.png.receipt.json",
			"machine-diagnostics.json",
		]) {
			try {
				const path = await comfyCompletionArtifact(
					await privatePath(owner, "jobs", job.id),
					name,
				);
				if (!(await lstat(path)).isFile()) fail("INVALID_PATH");
				const bytes = await readFile(path);
				artifacts[name] = {
					available: true,
					bytes: bytes.length,
					sha256: hash(bytes),
				};
				records.set(name, bytes);
			} catch (error) {
				if (
					!(
						error instanceof Error &&
						"code" in error &&
						error.code === "ENOENT"
					)
				)
					throw error;
				artifacts[name] = { available: false };
			}
		}
		const sources = records.get("source-bytes.json");
		const source = sources
			? z
					.object({
						detail: z.string(),
						token: z.string(),
						image: z.string().nullable(),
					})
					.parse(JSON.parse(sources.toString()))
			: null;
		const projectionBytes = records.get("projection.json");
		const projection = projectionBytes
			? z
					.object({
						textSHA: z.string(),
						renderingSHA: z.string(),
						sourceSHA: z.string(),
					})
					.parse(JSON.parse(projectionBytes.toString()))
			: null;
		const requestBytes = records.get("request-payload.json");
		const originalRequest = requestBytes
			? z
					.union([referenceGenerationRequestSchema, generationSchema])
					.parse(JSON.parse(requestBytes.toString()))
			: null;
		const history = [
			"initial-job.json",
			"interrupted-job.json",
			"job.json",
		].flatMap((name) => {
			const bytes = records.get(name);
			return bytes
				? [
						{
							artifact: name,
							job: jobSchema.parse(JSON.parse(bytes.toString())),
						},
					]
				: [];
		});
		const batches = await listBatches(await privatePath(owner));
		const batch = batches.find((row) =>
			row.items.some((item) => item.requestId === job.id),
		);
		return {
			schema: "portal-job-inspection.v1",
			requestId: job.id,
			originalRequest,
			provenance: records.has("provenance.json")
				? JSON.parse(records.get("provenance.json")?.toString() ?? "null")
				: null,
			payloadSHA: job.payloadSHA,
			inputHashes: source
				? Object.fromEntries(
						Object.entries(source).map(([name, bytes]) => [
							name,
							bytes === null ? null : hash(Buffer.from(bytes, "base64")),
						]),
					)
				: null,
			projectionHashes: projection,
			upstreamOutcome:
				job.state === "UNKNOWN" || job.state === "RUNNING"
					? "UNRESOLVED"
					: job.state === "HOLD"
						? "OUTPUT_RECEIVED"
						: "FAILED",
			reviewStatus: "HOLD",
			dispatchEvidence: {
				reservation: artifacts["dispatch.lock"],
				request:
					[
						"mcp-request.bin",
						"provider-request.bin",
						"provider-source.png.request.bin",
						"comfy-request.json",
					]
						.map((name) => artifacts[name])
						.find((artifact) => artifact?.available) ??
					artifacts["provider-request.bin"],
				response:
					[
						"mcp-response.bin",
						"provider-response.bin",
						"provider-source.png.response.bin",
						"comfy-response.json",
					]
						.map((name) => artifacts[name])
						.find((artifact) => artifact?.available) ??
					artifacts["provider-response.bin"],
			},
			history,
			job,
			batch: batch ? batchView(batch) : null,
			lease: await ownerLease(
				owner,
				(await ownerJobs(owner)).map((row) => (row.id === id ? job : row)),
			),
			artifacts,
			readOnly: true,
			resolutionAvailable: false,
			terminalRejection: event,
			comfyCompletion: completion ?? null,
		};
	}
	async function generationSource(person: {
		personId: string;
		characterId: string;
		name: string;
	}) {
		let original: Sheet | undefined;
		try {
			original = characters?.get(person.personId);
		} catch (error) {
			if (!(error instanceof Error && error.message === "NOT_FOUND"))
				throw error;
		}
		if (original) {
			if (
				original.characterId !== person.characterId ||
				original.name !== person.name
			)
				fail("WIKI_IDENTITY_MISMATCH", 409);
			return original;
		}
		const detail = await wiki.detailWithBytes(person.personId);
		const token = await wiki.tokenWithBytes(person.personId, detail);
		try {
			const source = generationSheetFromBytes(detail.bytes, token.bytes, null);
			source.sourceProvenance = { detail: detail.source, token: token.source };
			return source;
		} catch (error) {
			if (error instanceof Error) throw new WikiError("WIKI_INVALID_SOURCE");
			throw error;
		}
	}
	async function eligibility(person: {
		personId: string;
		characterId: string;
		name: string;
	}) {
		try {
			const source = await generationSource(person);
			return {
				eligible: true,
				reason: null,
				sourceMode: source.imageBytes ? "original-photo" : "design-token-only",
				originalSourceHashes: source.sourceHashes,
			};
		} catch (error) {
			if (
				error instanceof WikiError ||
				error instanceof z.ZodError ||
				(error instanceof Error &&
					["SHEET_IDENTITY_MISMATCH", "WIKI_IDENTITY_MISMATCH"].includes(
						error.message,
					))
			)
				return {
					eligible: false,
					reason: error.message,
					sourceMode: null,
					originalSourceHashes: null,
				};
			throw error;
		}
	}
	const server = createServer(async (req, res) => {
		try {
			const releaseRequest = (req.url ?? "/").startsWith(
				`${config.basePath}/api/releases/`,
			);
			const url = new URL(req.url ?? "/", "http://localhost");
			let localOrigin = config.publicOrigin;
			if (config.mode === "personal") {
				if (!config.ready || !config.publicOrigin)
					fail("AUTH_NOT_CONFIGURED", 503);
				if (req.headers.host !== new URL(config.publicOrigin).host)
					fail("HOST_INVALID", 403);
				const assertion = req.headers["cf-access-jwt-assertion"];
				if (typeof assertion !== "string" || !(await verifyAccess(assertion))) {
					if (releaseRequest && typeof assertion === "string") {
						let email: unknown;
						try {
							email = JSON.parse(
								Buffer.from(
									assertion.split(".")[1] ?? "",
									"base64url",
								).toString(),
							)?.email;
						} catch (error) {
							if (!(error instanceof SyntaxError)) throw error;
						}
						const owner = z.email().safeParse(email);
						if (
							owner.success &&
							owner.data !== config.ownerEmail &&
							(await createAccessVerifier(
								{ ...config, ownerEmail: owner.data },
								options.accessFetch,
							)(assertion))
						)
							fail("OWNER_REQUIRED", 403);
					}
					fail("ACCESS_REQUIRED", 401);
				}
				const workbenchNavigation =
					["GET", "HEAD"].includes(req.method ?? "") &&
					[config.basePath, `${config.basePath}/`].includes(req.url ?? "") &&
					req.headers["sec-fetch-mode"] === "navigate" &&
					req.headers["sec-fetch-dest"] === "document";
				if (
					(req.headers.origin !== undefined &&
						req.headers.origin !== config.publicOrigin) ||
					(req.headers["sec-fetch-site"] === "cross-site" &&
						!workbenchNavigation)
				)
					fail("ORIGIN_INVALID", 403);
			}
			if (config.mode === "local") {
				const address = server.address();
				const port =
					address && typeof address !== "string" ? address.port : config.port;
				if (
					!config.networkAccess &&
					req.socket.remoteAddress !== "127.0.0.1" &&
					req.socket.remoteAddress !== "::ffff:127.0.0.1"
				)
					fail("HOST_INVALID", 403);
				const hosts = [config.host];
				if (config.networkAccess && config.localHostname)
					hosts.push(config.localHostname);
				if (!hosts.some((host) => req.headers.host === `${host}:${port}`))
					fail("HOST_INVALID", 403);
				localOrigin = `http://${req.headers.host}`;
				if (
					req.headers.origin !== undefined &&
					req.headers.origin !== localOrigin
				)
					fail("ORIGIN_INVALID", 403);
				if (req.headers["sec-fetch-site"] === "cross-site")
					fail("ORIGIN_INVALID", 403);
			}
			if (releaseRequest && req.url !== url.pathname) fail("NOT_FOUND", 404);
			const path = url.pathname;
			if (path === config.basePath) {
				res.writeHead(302, { location: `${config.basePath}/` }).end();
				return;
			}
			if (!path.startsWith(`${config.basePath}/`)) fail("NOT_FOUND", 404);
			const route = path.slice(config.basePath.length);
			const staticFiles: Record<string, { path: string; type: string }> = {
				"/": {
					path: join(config.publicPath, "index.html"),
					type: "text/html; charset=utf-8",
				},
				"/portal.css": {
					path: join(config.publicPath, "portal.css"),
					type: "text/css",
				},
				"/portal.mjs": {
					path: join(config.publicPath, "portal.mjs"),
					type: "application/javascript",
				},
				"/tokens.css": {
					path: config.tokensPath,
					type: "text/css",
				},
			};
			const file = staticFiles[route];
			if (
				file &&
				(req.method === "GET" ||
					(config.mode === "personal" &&
						req.method === "HEAD" &&
						route === "/"))
			) {
				const bytes = await readFile(file.path);
				res.writeHead(200, {
					"content-type": file.type,
					"cache-control": "no-store",
					"x-content-type-options": "nosniff",
				});
				res.end(req.method === "HEAD" ? undefined : bytes);
				return;
			}
			if (req.method === "GET" && route === "/api/status") {
				reply(res, 200, {
					mode: config.mode,
					ready: config.ready,
					missingConfig: config.missing,
					model: "gpt-image-2.5-sunburst",
					charactersReady: Boolean(characters),
					generationReady: false,
				});
				return;
			}
			const cookies = Object.fromEntries(
				(req.headers.cookie ?? "").split(";").map((x) => x.trim().split("=")),
			);
			if (
				ownProvider &&
				["/api/auth/login", "/api/auth/callback"].includes(route)
			)
				fail("NOT_FOUND", 404);
			if (
				ownProvider &&
				req.method === "GET" &&
				route === "/api/auth/session" &&
				!auth.verify(cookies.portal_session ?? "")
			) {
				const token = auth.issue({
					id: "1",
					login: config.mode === "personal" ? config.ownerEmail : "local",
				});
				cookies.portal_session = token;
				res.setHeader("set-cookie", auth.cookie("portal_session", token));
			}
			if (req.method === "GET" && route === "/api/auth/login") {
				const result = auth.login();
				res
					.writeHead(302, {
						location: result.location,
						"set-cookie": result.cookie,
						"cache-control": "no-store",
					})
					.end();
				return;
			}
			if (req.method === "GET" && route === "/api/auth/callback") {
				if (!config.ready) fail("AUTH_NOT_CONFIGURED", 503);
				const result = await auth.callback(
					url.searchParams.get("code") ?? "",
					url.searchParams.get("state") ?? "",
					cookies.portal_oauth ?? "",
				);
				res
					.writeHead(302, {
						location: `${config.basePath}/`,
						"set-cookie": [result.cookie, result.clearState],
						"cache-control": "no-store",
					})
					.end();
				return;
			}
			const session = auth.verify(cookies.portal_session ?? "");
			if (!session) fail("AUTHENTICATION_REQUIRED", 401);
			const context = registry.authenticate(cookies.portal_session ?? "");
			if (!context) fail("AUTHENTICATION_REQUIRED", 401);
			if (releaseRequest) {
				const name = route.slice("/api/releases/".length);
				const types: Record<string, string> = {
					"ssstool-manifest.json": "application/json; charset=utf-8",
					"ssstool-release.tar": "application/x-tar",
					"ssstool-release.zip": "application/zip",
				};
				const type = Object.hasOwn(types, name) ? types[name] : undefined;
				if (
					config.mode !== "personal" ||
					!type ||
					!["GET", "HEAD"].includes(req.method ?? "") ||
					url.search ||
					req.url !== path
				)
					fail("NOT_FOUND", 404);
				const directory = await realpath(dirname(config.publicPath));
				const files = new Map<string, Buffer>();
				try {
					for (const file of [
						"ssstool-manifest.json",
						...releaseArtifactPaths,
						"ssstool-release.tar",
						"ssstool-release.zip",
					]) {
						const location = join(directory, file);
						if (
							!(await lstat(location)).isFile() ||
							(await realpath(location)) !== location
						)
							fail("RELEASE_INVALID", 503);
						files.set(file, await readFile(location));
					}
					const manifest = releaseManifestSchema.parse(
						JSON.parse(files.get("ssstool-manifest.json")?.toString() ?? ""),
					);
					if (
						new Set(manifest.artifacts.map((file) => file.path)).size !==
							releaseArtifactPaths.length ||
						new Set(manifest.archives.map((file) => file.path)).size !== 2 ||
						manifest.archives.some(
							(file) => file.path !== `ssstool-release.${file.format}`,
						) ||
						manifest.releaseId !==
							hash(Buffer.from(JSON.stringify(manifest.artifacts)))
					)
						fail("RELEASE_INVALID", 503);
					for (const file of [...manifest.artifacts, ...manifest.archives]) {
						const bytes = files.get(file.path);
						if (
							!bytes ||
							bytes.length !== file.bytes ||
							hash(bytes) !== file.sha256
						)
							fail("RELEASE_INVALID", 503);
					}
				} catch (error) {
					if (
						error instanceof z.ZodError ||
						error instanceof SyntaxError ||
						(error instanceof Error &&
							"code" in error &&
							["ENOENT", "ENOTDIR", "ELOOP"].includes(String(error.code)))
					)
						fail("RELEASE_INVALID", 503);
					throw error;
				}
				const bytes = files.get(name);
				if (!bytes) fail("RELEASE_INVALID", 503);
				res.writeHead(200, {
					"content-type": type,
					"content-length": bytes.length,
					"content-disposition": `attachment; filename="${name}"`,
					"cache-control": "no-store",
					"x-content-type-options": "nosniff",
					"x-artifact-sha256": hash(bytes),
				});
				res.end(req.method === "HEAD" ? undefined : bytes);
				return;
			}
			const accountProvider = accountProviders.get(session.login);
			const provider = accountProvider ?? config.personalProvider;
			if (
				provider &&
				req.method === "GET" &&
				["/api/auth/session", "/api/connections"].includes(route) &&
				!registry.current(context)
			)
				await registry.connect(
					context,
					localConnectSchema.parse({
						baseUrl: provider.baseUrl,
						apiKey: provider.apiKey,
					}),
					accountProvider?.model,
				);
			if (req.method === "GET" && route === "/api/auth/session") {
				reply(res, 200, {
					authenticated: true,
					mode: config.mode,
					serverProviderConfigured: Boolean(config.personalProvider),
					accountProviderConnected: Boolean(accountProvider),
					comfyuiConfigured: comfyAvailable,
					user: { id: session.id, login: session.login },
					csrfToken: session.csrfToken,
				});
				return;
			}
			if (
				["POST", "PUT", "PATCH", "DELETE"].includes(req.method ?? "") &&
				(req.headers.origin !== localOrigin ||
					req.headers["x-csrf-token"] !== session.csrfToken)
			)
				fail("CSRF_INVALID", 403);
			if (req.method === "POST" && route === "/api/auth/logout") {
				registry.revokeSession(context);
				for (const [id, row] of transports)
					if (row.binding.sessionFingerprint === context.sessionFingerprint)
						closeTransport(id);
				res.setHeader("set-cookie", auth.logout(cookies.portal_session ?? ""));
				server.emit(`jobs-revoked:${context.sessionFingerprint}`);
				reply(res, 200, { authenticated: false });
				return;
			}
			if (route.startsWith("/api/local-ai/")) {
				if (!localAi) fail("STORAGE_NOT_CONFIGURED", 503);
				if (
					req.method === "GET" &&
					route === "/api/local-ai/admission/status"
				) {
					reply(res, 200, await localAi.admissionStatus());
					return;
				}
				if (
					req.method === "POST" &&
					["/api/local-ai/admission/close", "/api/local-ai/admission/open"].includes(route)
				) {
					if (
						config.mode === "hosted" ||
						session.id !== "1" ||
						(config.mode === "personal" && session.login !== config.ownerEmail)
					)
						fail("OWNER_REQUIRED", 403);
					reply(
						res,
						200,
						await localAi.setAdmission(
							route.endsWith("/close") ? "closed" : "open",
							await body(req),
						),
					);
					return;
				}
				if (req.method === "GET" && route === "/api/local-ai/catalog") {
					reply(res, 200, { tools: await localAi.catalog() });
					return;
				}
				if (req.method === "POST" && route === "/api/local-ai/jobs") {
					const job = await localAi.create(
						session.id,
						await body(req),
						async () => {
							if (active.has(session.id)) fail("JOB_RUNNING", 409);
							active.add(session.id);
							try {
								if ((await ownerLease(session.id, undefined, true)).admissionBlocked)
									fail("OWNER_DISPATCH_UNCERTAIN", 409);
							} catch (error) {
								active.delete(session.id);
								throw error;
							}
							return () => active.delete(session.id);
						},
					);
					reply(res, 202, { job });
					return;
				}
				const match =
					/^\/api\/local-ai\/jobs\/([a-f0-9-]{36})(?:\/artifacts\/([a-z0-9-]{1,80}))?$/.exec(
						route,
					);
				if (req.method === "GET" && match?.[1]) {
					if (match[2]) {
						const artifact = await localAi.artifact(
							session.id,
							match[1],
							match[2],
						);
						res.writeHead(200, {
							"content-type": artifact.mime,
							"content-length": artifact.bytes,
							"content-disposition": `attachment; filename="${artifact.name}"`,
							"x-content-sha256": artifact.sha256,
						});
						res.end(artifact.data);
					} else
						reply(res, 200, { job: await localAi.get(session.id, match[1]) });
					return;
				}
				fail("NOT_FOUND", 404);
			}
			if (route === "/api/connections/account") {
				if (config.mode !== "personal") fail("NOT_FOUND", 404);
				if (req.method === "GET") {
					reply(res, 200, {
						login: session.login,
						connected: Boolean(accountProvider),
						...(accountProvider
							? {
									baseUrl: accountProvider.baseUrl,
									connectedAt: accountProvider.connectedAt,
									model: accountProvider.model,
								}
							: {}),
						models: providerModels,
					});
					return;
				}
				if (req.method === "POST" || req.method === "DELETE") {
					const input =
						req.method === "POST"
							? accountConnectSchema.parse(await body(req))
							: null;
					if (active.has(session.id)) fail("JOB_RUNNING", 409);
					active.add(session.id);
					try {
						await checkOwnerUncertain(session.id);
						accountProviders.set(session.login, input);
						// Only the OpenAI-compatible connections depend on the account
						// credential; a live ComfyUI connection stays usable.
						registry.revokeOwner(context, "openai-compatible-http.v1");
						for (const [id, row] of transports)
							if (
								row.binding.ownerId === session.id &&
								row.binding.protocolVersion === "openai-compatible-http.v1"
							)
								closeTransport(id);
						if (input)
							await registry.connect(
								context,
								{ baseUrl: input.baseUrl, apiKey: input.apiKey },
								input.model,
							);
					} finally {
						active.delete(session.id);
					}
					reply(res, 200, {
						connected: Boolean(input),
						login: session.login,
						...(input ? { baseUrl: input.baseUrl, model: input.model } : {}),
					});
					return;
				}
			}
			if (req.method === "GET" && route === "/api/connections") {
				const current = registry.current(context);
				if (current?.state === "REVOKED") closeTransport(current.connectionId);
				const comfyCurrent = comfyAvailable
					? registry.current(context, COMFY_PROTOCOL)
					: null;
				if (comfyCurrent?.state === "REVOKED")
					closeTransport(comfyCurrent.connectionId);
				const comfyRow =
					comfyCurrent?.state === "READY"
						? comfyRows.get(comfyCurrent.connectionId)
						: undefined;
				reply(res, 200, {
					mode: config.mode,
					comfyui: {
						available: comfyAvailable,
						...(comfyAvailable ? { canvasUrl: `${COMFY_ENDPOINT}/comfyart/` } : {}),
						workflows: comfyAvailable ? comfyWorkflows : [],
						connection: publicConnection(comfyCurrent),
						readiness: comfyRow?.proof
							? {
									state: comfyRow.proof.state,
									workflow: comfyRow.proof.workflow,
									models: comfyRow.proof.models,
								}
							: null,
					},
					capabilities: { nativeMoss: nativeCapability(context) },
					endpoints: ownProvider ? [] : endpoints,
					connection: publicConnection(current),
					provider:
						accountProvider && current?.state === "READY"
							? registry.dispatch(
									context,
									current,
									(_endpoint, _key, baseUrl, model) => ({ baseUrl, model }),
								)
							: null,
				});
				return;
			}
			if (req.method === "POST" && route === "/api/connections") {
				const raw = await body(req);
				if (
					typeof raw === "object" &&
					raw !== null &&
					"provider" in raw &&
					raw.provider === "native-moss"
				) {
					const input = nativeMossConnectSchema.parse(raw);
					if (!nativeAvailable) fail("NATIVE_NOT_CONFIGURED", 404);
					if (active.has(session.id)) fail("JOB_RUNNING", 409);
					active.add(session.id);
					try {
						await checkOwnerUncertain(session.id);
						let binding: ConnectionSnapshot;
						try {
							binding = await registry.connect(context, input);
						} catch (error) {
							if (nativeReason) fail(nativeReason, 503);
							throw error;
						}
						reply(res, 201, {
							connection: publicConnection(binding),
							capabilities: { nativeMoss: nativeCapability(context) },
						});
					} finally {
						active.delete(session.id);
					}
					return;
				}
				const comfy = comfyConnectSchema.safeParse(raw);
				if (comfy.success) {
					if (!comfyWorkflows.some((w) => w.id === comfy.data.workflow))
						fail("COMFY_WORKFLOW_RETIRED", 422);
					// Explicit ComfyUI readiness connection: no credential, no graph,
					// no URL from the browser; it never submits a prompt.
					if (!comfyAvailable) fail("COMFYUI_NOT_CONFIGURED", 404);
					if (active.has(session.id)) fail("JOB_RUNNING", 409);
					active.add(session.id);
					try {
						await checkOwnerUncertain(session.id);
						try {
							const binding = await registry.connect(context, comfy.data);
							const proof = comfyRows.get(binding.connectionId)?.proof;
							reply(res, 201, {
								connection: publicConnection(binding),
								readiness: proof
									? {
											state: proof.state,
											workflow: proof.workflow,
											models: proof.models,
										}
									: null,
							});
						} catch (error) {
							const current = registry.current(context, COMFY_PROTOCOL);
							if (current?.state === "REVOKED")
								closeTransport(current.connectionId);
							throw error;
						}
					} finally {
						active.delete(session.id);
					}
					return;
				}
				if (config.personalProvider) fail("CONNECTION_SERVER_MANAGED", 409);
				const input = ownProvider
					? localConnectSchema.parse(raw)
					: z
							.strictObject({
								endpointId: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/),
								bridgeBearer: z
									.string()
									.min(1)
									.max(8192)
									.regex(/^[A-Za-z0-9._~+/-]+=*$/),
							})
							.parse(raw);
				if (active.has(session.id)) fail("JOB_RUNNING", 409);
				active.add(session.id);
				try {
					await checkOwnerUncertain(session.id);
					try {
						reply(res, 201, {
							connection: publicConnection(
								await registry.connect(context, input),
							),
						});
					} catch (error) {
						const current = registry.current(context);
						if (current?.state === "REVOKED")
							closeTransport(current.connectionId);
						throw error;
					}
				} finally {
					active.delete(session.id);
				}
				return;
			}
			const disconnect = route.match(/^\/api\/connections\/([0-9a-f-]+)$/);
			if (req.method === "DELETE" && disconnect) {
				const id = idSchema.parse(disconnect[1]);
				const binding = registry.disconnect(context, id);
				closeTransport(id);
				reply(res, 200, { connection: publicConnection(binding) });
				return;
			}
			if (req.method === "GET" && route === "/api/wiki/people") {
				if (
					[...url.searchParams.keys()].some(
						(k) => !["q", "limit", "cursor"].includes(k),
					) ||
					["q", "limit", "cursor"].some(
						(k) => url.searchParams.getAll(k).length > 1,
					)
				)
					fail("INVALID_INPUT", 422);
				const query = z
					.object({
						q: z.string().max(100),
						limit: z.coerce.number().int().min(1).max(100),
						cursor: z.coerce.number().int().min(0).max(10000),
					})
					.parse({
						q: url.searchParams.get("q") ?? "",
						limit: url.searchParams.get("limit") ?? "25",
						cursor: url.searchParams.get("cursor") ?? "0",
					});
				const result = await wiki.list(query);
				const people = [];
				for (const p of result.people)
					people.push({
						...p,
						generationEligibility: await eligibility(p),
					});
				reply(res, 200, { ...result, people });
				return;
			}
			if (req.method === "GET" && route.startsWith("/api/wiki/people/")) {
				const id = route.slice("/api/wiki/people/".length);
				const v2 = url.searchParams.get("schemaVersion") === "2";
				if (!/^person-\d+$/.test(id) || (url.search && !v2))
					fail("INVALID_INPUT", 422);
				if (v2) {
					if (
						[...url.searchParams.keys()].some(
							(key) =>
								!["schemaVersion", "inputMode", "sourceSelection"].includes(
									key,
								),
						) ||
						[...url.searchParams.keys()].some(
							(key) => url.searchParams.getAll(key).length !== 1,
						)
					)
						fail("INVALID_INPUT", 422);
					const acquisitionRequest = referenceGenerationRequestSchema.parse({
						schemaVersion: 2,
						requestId: "00000000-0000-4000-8000-000000000002",
						personId: id,
						inputMode: url.searchParams.get("inputMode"),
						sourceSelection: JSON.parse(
							url.searchParams.get("sourceSelection") ?? "null",
						),
						explicitEdits: [],
						provider: "openai-compatible",
						providerModel: "gpt-image-2.5-sunburst",
						size: "340x510",
						faceMode: { kind: "unique", variantId: null },
					});
					const acquisition = await acquireReferenceSource(acquisitionRequest, {
						characters,
						wiki,
						wikiBaseUrl: config.wikiBaseUrl,
					});
					const retained =
						acquisition.status === "acquired" ||
						acquisition.status === "intentional-absence"
							? characters?.getReference(id)
							: null;
					const published = await wiki.detail(id).catch((error: unknown) => {
						if (
							retained &&
							error instanceof WikiError &&
							error.code === "WIKI_UNAVAILABLE"
						)
							return null;
						throw error;
					});
					if (
						retained &&
						published &&
						(published.personId !== retained.personId ||
							published.characterId !== retained.characterId ||
							published.name !== retained.name)
					) {
						const denied = {
							status: "failed",
							eligible: false,
							errorCode: "REFERENCE_IDENTITY_MISMATCH",
							httpStatus: 422,
							generation: null,
						};
						reply(res, 422, {
							schemaVersion: 2,
							sourceAcquisition: denied,
							generationEligibility: denied,
							imageBase64: null,
						});
						return;
					}
					const result = retained
						? {
								personId: retained.personId,
								characterId: retained.characterId,
								name: retained.name,
								detail: retained.detail,
								source: {
									kind: "retained-original",
									sha256: retained.sourceHashes.detail,
								},
							}
						: published;
					const view = referenceAcquisitionView(acquisition);
					reply(res, 200, {
						...result,
						schemaVersion: 2,
						sourceAcquisition: view,
						generationEligibility: view,
						reference: acquisition.generation
							? referenceSummary(acquisitionRequest, acquisition)
							: null,
						token: acquisition.generation
							? JSON.parse(
									Buffer.from(acquisition.generation.tokenBytes).toString(),
								)
							: null,
						sourceHashes: acquisition.generation
							? {
									token: acquisition.generation.tokenSHA256,
									image:
										acquisition.generation.recipientImage?.sourceSHA256 ?? null,
								}
							: null,
						normalizedImageBase64:
							acquisition.status === "acquired"
								? Buffer.from(
										transformReferencePng(
											acquisition.generation.recipientImage.bytes,
										).rgbaBytes,
									).toString("base64")
								: null,
						imageBase64:
							acquisition.status === "acquired"
								? Buffer.from(
										acquisition.generation.recipientImage.bytes,
									).toString("base64")
								: null,
					});
					return;
				}
				const result = await wiki.detail(id);
				const permission = await eligibility(result);
				const original = permission.eligible
					? await generationSource(result)
					: null;
				reply(res, 200, {
					...result,
					imageBase64: original?.imageBytes
						? Buffer.from(original.imageBytes).toString("base64")
						: null,
					token: original?.token ?? null,
					sourceHashes: {
						detail: result.source.sha256,
						token: original?.sourceHashes.token ?? null,
						image: original?.sourceHashes.image ?? null,
					},
					generationEligibility: permission,
				});
				return;
			}
			if (req.method === "GET" && route === "/api/characters") {
				if (!characters) fail("CHARACTERS_NOT_CONFIGURED", 503);
				reply(res, 200, { characters: characters.list() });
				return;
			}
			const person = route.match(/^\/api\/characters\/(person-[0-9]+)$/);
			if (req.method === "GET" && person) {
				if (!characters) fail("CHARACTERS_NOT_CONFIGURED", 503);
				const s = characters.get(person[1] ?? "");
				reply(res, 200, {
					personId: s.personId,
					characterId: s.characterId,
					name: s.name,
					imageBase64: Buffer.from(s.imageBytes).toString("base64"),
					detail: s.detail,
					token: s.token,
					sourceHashes: s.sourceHashes,
				});
				return;
			}
			if (req.method === "POST" && route === "/api/characters/register") {
				if (config.mode !== "personal") fail("NOT_FOUND", 404);
				if (!characters) fail("CHARACTERS_NOT_CONFIGURED", 503);
				const payload = registrationSchema.parse(await body(req));
				reply(res, 201, characters.register(payload));
				return;
			}
			if (req.method === "POST" && route === "/api/sheets") {
				const payload = z
					.object({
						detailBase64: z.string(),
						tokenBase64: z.string(),
						imageBase64: z.string(),
					})
					.strict()
					.parse(await body(req));
				const sheet = sheetFromBytes(
					decode(payload.detailBase64, 1048576),
					decode(payload.tokenBase64, 1048576),
					decode(payload.imageBase64, 8388608),
				);
				const sheetId = randomUUID();
				if (!root) fail("STORAGE_NOT_CONFIGURED", 503);
				const needed =
					sheet.detailBytes.length +
					sheet.tokenBytes.length +
					sheet.imageBytes.length;
				if ((await usage(root)) + reserved + needed > config.maxStorageBytes)
					fail("STORAGE_LIMIT", 413);
				reserved += needed;
				try {
					const dir = await privatePath(session.id, "sheets", sheetId);
					await mkdir(dir, { recursive: true, mode: 0o700 });
					await writeFile(join(dir, "detail.json"), sheet.detailBytes, {
						flag: "wx",
						mode: 0o600,
					});
					await writeFile(join(dir, "token.json"), sheet.tokenBytes, {
						flag: "wx",
						mode: 0o600,
					});
					await writeFile(join(dir, "image.png"), sheet.imageBytes, {
						flag: "wx",
						mode: 0o600,
					});
				} finally {
					reserved -= needed;
				}
				reply(res, 201, {
					sheetId,
					personId: sheet.personId,
					characterId: sheet.characterId,
					name: sheet.name,
					sourceHashes: sheet.sourceHashes,
				});
				return;
			}
			const alphaRoute = route.match(
				/^\/api\/jobs\/([0-9a-f-]+)\/alpha-derivative(\/image)?$/,
			);
			if (
				alphaRoute &&
				(req.method === "GET" || (req.method === "POST" && !alphaRoute[2]))
			) {
				const id = idSchema.parse(alphaRoute[1]);
				const payload =
					req.method === "POST"
						? alphaParentSchema.parse(await body(req))
						: undefined;
				const store = createEvaluationStore({
					ownerRoot: await privatePath(session.id),
					ownerId: session.id,
				});
				const record = await store.alphaDerivative(id, payload);
				if (alphaRoute[2]) {
					if (!record) fail("NOT_FOUND", 404);
					res.writeHead(200, {
						"content-type": "image/png",
						"cache-control": "private, no-store",
						"content-length": record.png.length,
					});
					res.end(record.png);
				} else
					reply(res, payload ? 201 : 200, {
						derivative: record?.derivative ?? null,
					});
				return;
			}
			const completionRoute = route.match(
				/^\/api\/v1\/jobs\/([0-9a-f-]+)\/comfy-completions$/,
			);
			if (req.method === "POST" && completionRoute) {
				if (!comfyAvailable) fail("COMFY_CONNECTION_NOT_READY", 409);
				const id = idSchema.parse(completionRoute[1]);
				const payload = comfyCompletionRequestSchema.parse(await body(req));
				const previous =
					terminalRejectionWrites.get(session.id) ?? Promise.resolve();
				const release = Promise.withResolvers<void>();
				const tail = previous.then(() => release.promise);
				terminalRejectionWrites.set(session.id, tail);
				await previous;
				let admitted = false;
				try {
					if (closing || active.has(session.id)) fail("JOB_RUNNING", 409);
					const authorize = () => {
						if (
							closing ||
							auth.verify(cookies.portal_session ?? "")?.id !== session.id
						)
							fail("AUTH_REQUIRED", 401);
					};
					authorize();
					active.add(session.id);
					admitted = true;
					const result = await commitComfyCompletion({
						ownerRoot: await privatePath(session.id),
						requestId: id,
						request: payload,
						imageUrl: `${config.basePath}/api/jobs/${id}/image`,
						authorize,
						providerOptions: {
							...(options.comfyTransport
								? { transport: options.comfyTransport }
								: {}),
							...(options.comfyMeasureAssets
								? { measureAssets: options.comfyMeasureAssets }
								: {}),
							...(options.comfyMeasureFinishing
								? { measureFinishing: options.comfyMeasureFinishing }
								: {}),
						},
						...(options.comfyCompletionCheckpoint
							? { checkpoint: options.comfyCompletionCheckpoint }
							: {}),
					});
					server.emit(`jobs:${session.id}`);
					reply(res, result.created ? 201 : 200, result);
				} finally {
					if (admitted) active.delete(session.id);
					release.resolve();
					if (terminalRejectionWrites.get(session.id) === tail)
						terminalRejectionWrites.delete(session.id);
				}
				return;
			}
			const terminalRejectionRoute = route.match(
				/^\/api\/v1\/jobs\/([0-9a-f-]+)\/terminal-rejections$/,
			);
			if (req.method === "POST" && terminalRejectionRoute) {
				const id = idSchema.parse(terminalRejectionRoute[1]);
				const payload = terminalRejectionRequestSchema.parse(await body(req));
				const previous =
					terminalRejectionWrites.get(session.id) ?? Promise.resolve();
				const release = Promise.withResolvers<void>();
				const tail = previous.then(() => release.promise);
				terminalRejectionWrites.set(session.id, tail);
				await previous;
				let admitted = false;
				try {
					if (closing || active.has(session.id)) fail("JOB_RUNNING", 409);
					if (auth.verify(cookies.portal_session ?? "")?.id !== session.id)
						fail("AUTH_REQUIRED", 401);
					active.add(session.id);
					admitted = true;
					const result = await commitTerminalRejectionV1({
						ownerRoot: await privatePath(session.id),
						requestId: id,
						request: payload,
						authorize: () => {
							if (
								closing ||
								auth.verify(cookies.portal_session ?? "")?.id !== session.id
							)
								fail("AUTH_REQUIRED", 401);
						},
						...(options.terminalRejectionCheckpoint
							? { checkpoint: options.terminalRejectionCheckpoint }
							: {}),
					});
					server.emit(`jobs:${session.id}`);
					reply(res, result.created ? 201 : 200, result);
				} finally {
					if (admitted) active.delete(session.id);
					release.resolve();
					if (terminalRejectionWrites.get(session.id) === tail)
						terminalRejectionWrites.delete(session.id);
				}
				return;
			}
			const evaluationRoute = route.match(
				/^\/api\/jobs\/([0-9a-f-]+)\/(result|evaluations|captured-source)$/,
			);
			if (
				evaluationRoute &&
				(req.method === "GET" ||
					(req.method === "POST" && evaluationRoute[2] === "evaluations"))
			) {
				const id = idSchema.parse(evaluationRoute[1]);
				const payload =
					req.method === "POST"
						? submitEvaluationSchema.parse(await body(req))
						: null;
				const store = createEvaluationStore({
					ownerRoot: await privatePath(session.id),
					ownerId: session.id,
				});
				if (payload) {
					const { created, evaluation } = await store.appendEvaluation(
						id,
						payload,
					);
					reply(res, created ? 201 : 200, { evaluation });
				} else if (evaluationRoute[2] === "result") {
					const dir = await privatePath(session.id, "jobs", id);
					const request = JSON.parse(
						await readFile(join(dir, "request-payload.json"), "utf8"),
					);
					if (request.provider === "native-moss") {
						const { job } = await readExecutionJobV1(
							await privatePath(session.id),
							id,
						);
						if (job.state !== "HOLD") fail("NATIVE_RESULT_NOT_AVAILABLE", 409);
						const { finalBytes: _bytes, ...result } =
							await verifyNativeMossWorkbenchResult(
								(name) => readFile(join(dir, name)),
								id,
							);
						reply(res, 200, { result });
					} else reply(res, 200, { result: await store.sealResult(id) });
				} else if (evaluationRoute[2] === "captured-source") {
					reply(res, 200, { source: await store.readCapturedSource(id) });
				} else {
					reply(res, 200, await store.readEvaluations(id));
				}
				return;
			}
			if (req.method === "GET" && route === "/api/jobs/events") {
				res.writeHead(200, {
					"content-type": "text/event-stream",
					"cache-control": "no-store",
					"x-accel-buffering": "no",
				});
				const changed = () => {
					if (!auth.verify(cookies.portal_session ?? "")) {
						res.end();
						return;
					}
					res.write("data: changed\n\n");
				};
				const revoked = `jobs-revoked:${context.sessionFingerprint}`;
				const closeStream = () => {
					clearTimeout(deadline);
					server.off(`jobs:${session.id}`, changed);
					server.off("jobs-close", closeStream);
					server.off(revoked, closeStream);
					res.end();
				};
				const deadline = setTimeout(
					closeStream,
					Math.max(0, context.expiresAt - Date.now()),
				);
				server.on(`jobs:${session.id}`, changed);
				server.on("jobs-close", closeStream);
				server.on(revoked, closeStream);
				res.on("close", closeStream);
				changed();
				return;
			}
			if (req.method === "GET" && route === "/api/jobs") {
				const jobs = await ownerJobs(session.id);
				reply(res, 200, {
					jobs,
					history: await jobHistory(session.id, jobs),
					lease: await ownerLease(session.id, jobs),
				});
				return;
			}
			const matched = route.match(
				/^\/api\/jobs\/([0-9a-f-]+)(\/(?:image|inspection))?$/,
			);
			const batchRoute = route.match(
				/^\/api\/batches\/([0-9a-f-]+)(\/cancel-pending)?$/,
			);
			if (
				batchRoute &&
				((req.method === "GET" && !batchRoute[2]) ||
					(req.method === "POST" && batchRoute[2]))
			) {
				const batchId = idSchema.parse(batchRoute[1]);
				const ownerRoot = await privatePath(session.id);
				const live = runningBatches.get(batchId);
				const batch =
					live?.batch.ownerId === session.id
						? live.batch
						: await readBatch(ownerRoot, batchId);
				if (batch.ownerId !== session.id) fail("NOT_FOUND", 404);
				if (req.method === "POST") {
					z.strictObject({}).parse(await body(req));
					if (
						batch.state === "COMPLETED" ||
						batch.state === "CANCELLED" ||
						batch.cancelRequested
					) {
						reply(res, 200, { batch: batchView(batch) });
						return;
					}
					batch.cancelRequested = true;
					for (const item of batch.items)
						if (item.status === "PENDING") item.status = "CANCELLED";
					batch.state = batch.items.some((i) => i.status === "UNKNOWN")
						? "PAUSED_UNKNOWN"
						: batch.items.some((i) => i.status === "RUNNING")
							? "CANCEL_REQUESTED"
							: "CANCELLED";
					if (live?.batch === batch) await commitBatch(live);
					else {
						batch.revision++;
						batch.updatedAt = new Date().toISOString();
						await writeBatch(ownerRoot, batch);
					}
				}
				reply(res, 200, { batch: batchView(batch) });
				return;
			}
			if (req.method === "POST" && route === "/api/batches") {
				const input = await body(req);
				if (input && typeof input === "object" && !("connectionId" in input))
					fail("CONNECTION_REQUIRED", 409);
				const payload = batchRequestSchema.parse(input);
				const payloadSHA = hash(Buffer.from(JSON.stringify(payload)));
				const ownerRoot = await privatePath(session.id);
				try {
					const existing = await readBatch(ownerRoot, payload.batchId);
					if (existing.payloadSHA !== payloadSHA) fail("REQUEST_CONFLICT", 409);
					reply(res, 200, { batch: batchView(existing) });
					return;
				} catch (error) {
					if (
						!(
							error instanceof Error &&
							"code" in error &&
							error.code === "ENOENT"
						)
					)
						throw error;
				}
				if (active.has(session.id)) fail("JOB_RUNNING", 409);
				let reservation = 0,
					admitted = false;
				const stage = await privatePath(
					session.id,
					"batches",
					`${payload.batchId}.admission`,
				);
				if (active.has(session.id)) fail("JOB_RUNNING", 409);
				active.add(session.id);
				try {
					await checkOwnerUncertain(session.id);
					const binding = registry.snapshot(context, payload.connectionId);
					// Batches stay on the OpenAI-compatible transport; a ComfyUI draft is
					// an explicit single generation, never silently batched.
					if (binding.protocolVersion === COMFY_PROTOCOL)
						fail("CONNECTION_PROVIDER_MISMATCH", 409);
					registry.dispatch(context, binding, () => undefined);
					if (!root || !template) fail("GENERATION_NOT_CONFIGURED", 503);
					// Retained per-item output: MCP raw response 12 MiB, PNG 8 MiB,
					// receipt UTF-8 at most 4 MiB, job/diagnostic/record slack 1 MiB.
					// Derived request/source copies are measured exactly below; decoded
					// working buffers are memory, not twenty disk reservations.
					reservation =
						(ownProvider ? 67108864 : 26214400) * payload.items.length;
					reserved += reservation;
					if ((await usage(root)) + reserved > config.maxStorageBytes)
						fail("STORAGE_LIMIT", 413);
					const artifacts = new Map<string, Uint8Array>();
					const snapshots: { item: Batch["items"][number]; bytes: Buffer }[] =
						[];
					let retainedInputSize = 0;
					const artifact = (bytes: Uint8Array) => {
						const digest = hash(bytes);
						artifacts.set(digest, bytes);
						return digest;
					};
					for (const [ordinal, selection] of payload.items.entries()) {
						registry.dispatch(context, binding, () => undefined);
						const current = await wiki.detailWithBytes(selection.personId);
						const permission = await eligibility(current);
						if (!permission.eligible)
							fail(permission.reason ?? "ORIGINAL_REFERENCE_UNAVAILABLE", 409);
						const sheet = await generationSource(current);
						if (!sheet) fail("ORIGINAL_REFERENCE_UNAVAILABLE", 409);
						if (
							selection.characterId !== current.characterId ||
							selection.name !== current.name ||
							selection.wikiDetailSHA !== current.source.sha256 ||
							JSON.stringify(selection.originalSourceHashes) !==
								JSON.stringify(sheet.sourceHashes)
						)
							fail("SELECTION_STALE", 409);
						const itemId = randomUUID(),
							requestId = randomUUID();
						const adapted = adaptSheet(
							sheet,
							template,
							requestId,
							payload.faceMode,
						);
						const files: Record<string, string> = {
							detail: artifact(sheet.detailBytes),
							token: artifact(sheet.tokenBytes),
							...(sheet.imageBytes
								? { image: artifact(sheet.imageBytes) }
								: {}),
							wiki: artifact(current.bytes),
							rule: artifact(adapted.candidate.ruleBytes),
							position: artifact(adapted.candidate.positionReferenceBytes),
							look: artifact(adapted.candidate.lookBytes),
							projection: artifact(
								Buffer.from(JSON.stringify(adapted.projection)),
							),
							provenance: artifact(
								Buffer.from(`${JSON.stringify(adapted.provenance)}\n`),
							),
						};
						const references = adapted.candidate.referenceImages.map(
							(r, index) => {
								const sha256 = artifact(r.bytes);
								files[`reference-${index}`] = sha256;
								return { id: r.id, role: r.role, sha256 };
							},
						);
						const snapshot: BatchSnapshot = snapshotSchema.parse({
							schema: "portal-batch-item-snapshot.v1",
							ownerId: session.id,
							batchId: payload.batchId,
							itemId,
							requestId,
							ordinal,
							selection,
							connection: binding,
							wikiSource: current.source,
							files,
							pins: adapted.pins,
							composition: adapted.candidate.composition,
							references,
						});
						const bytes = Buffer.from(`${JSON.stringify(snapshot)}\n`);
						const jobPayload = generationSchema.parse({
							requestId,
							connectionId: binding.connectionId,
							personId: selection.personId,
							providerModel: payload.providerModel,
							size: "1024x1536",
							faceMode: payload.faceMode,
						});
						const request = {
							requestId,
							model: payload.providerModel,
							prompt: adapted.projection.text,
							rendering: adapted.projection.rendering,
							textSHA: adapted.projection.textSHA,
							renderingSHA: adapted.projection.renderingSHA,
							sourceSHA: adapted.projection.sourceSHA,
							referenceHashes: references.map((r) => r.sha256),
							referenceImages: adapted.candidate.referenceImages.map((r) =>
								Buffer.from(r.bytes).toString("base64"),
							),
						};
						retainedInputSize +=
							Buffer.byteLength(adapted.projection.text) +
							Buffer.byteLength(JSON.stringify(adapted.projection)) +
							Buffer.byteLength(`${JSON.stringify(request, null, 2)}\n`) +
							Buffer.byteLength(
								JSON.stringify({
									jsonrpc: "2.0",
									id: Number.MAX_SAFE_INTEGER,
									method: "tools/call",
									params: { name: binding.toolName, arguments: request },
								}),
							) +
							Buffer.byteLength(
								`${JSON.stringify({ detail: Buffer.from(sheet.detailBytes).toString("base64"), token: Buffer.from(sheet.tokenBytes).toString("base64"), image: sheet.imageBytes ? Buffer.from(sheet.imageBytes).toString("base64") : null, pins: adapted.pins })}\n`,
							) +
							Buffer.byteLength(`${JSON.stringify(adapted.provenance)}\n`) +
							Buffer.byteLength(`${JSON.stringify(jobPayload)}\n`) +
							Buffer.byteLength(`${JSON.stringify(binding)}\n`) +
							Buffer.byteLength(
								`${JSON.stringify({ schema: "portal-job-batch-binding.v1", ownerId: session.id, batchId: payload.batchId, itemId, requestId, snapshotSHA: hash(bytes) })}\n`,
							);
						snapshots.push({
							item: {
								itemId,
								requestId,
								ordinal,
								personId: selection.personId,
								characterId: selection.characterId,
								name: selection.name,
								snapshotSHA: hash(bytes),
								status: "PENDING",
								jobId: null,
								startedAt: null,
								finishedAt: null,
								errorCode: null,
							},
							bytes,
						});
					}
					const admittedAt = new Date(now()).toISOString();
					const batch: Batch = {
						schema: "portal-batch.v1",
						ownerId: session.id,
						batchId: payload.batchId,
						payloadSHA,
						connectionId: binding.connectionId,
						connectionRevision: binding.revision,
						providerModel: payload.providerModel,
						faceMode: payload.faceMode,
						state: "RUNNING",
						createdAt: admittedAt,
						updatedAt: admittedAt,
						revision: 1,
						cancelRequested: false,
						pauseReason: null,
						items: snapshots.map((s) => s.item),
					};
					const snapshotSize =
						[...artifacts.values()].reduce(
							(sum, bytes) => sum + bytes.length,
							0,
						) +
						snapshots.reduce((sum, s) => sum + s.bytes.length, 0) +
						Buffer.byteLength(JSON.stringify(batch)) +
						1;
					reserved += snapshotSize + retainedInputSize;
					reservation += snapshotSize + retainedInputSize;
					if ((await usage(root)) + reserved > config.maxStorageBytes)
						fail("STORAGE_LIMIT", 413);
					await mkdir(join(stage, "artifacts"), {
						recursive: true,
						mode: 0o700,
					});
					for (const [digest, bytes] of artifacts)
						await writeFile(join(stage, "artifacts", `${digest}.bin`), bytes, {
							flag: "wx",
							mode: 0o600,
						});
					for (const snapshot of snapshots) {
						const dir = join(stage, "items", snapshot.item.itemId);
						await mkdir(dir, { recursive: true, mode: 0o700 });
						await writeFile(join(dir, "snapshot.json"), snapshot.bytes, {
							flag: "wx",
							mode: 0o600,
						});
					}
					await writeFile(
						join(stage, "batch.json"),
						`${JSON.stringify(batch)}\n`,
						{ flag: "wx", mode: 0o600 },
					);
					registry.dispatch(context, binding, () => undefined);
					await rename(
						stage,
						await privatePath(session.id, "batches", payload.batchId),
					);
					const row = { batch, binding, ownerRoot, writes: Promise.resolve() };
					runningBatches.set(batch.batchId, row);
					admitted = true;
					reply(res, 202, { batch: batchView(batch) });
					const pending = runBatch(row, context, reservation);
					dispatchers.add(pending);
					void pending
						.finally(() => dispatchers.delete(pending))
						.catch((error) => server.emit("batch-error", error));
				} finally {
					if (!admitted) {
						if (reservation) reserved -= reservation;
						active.delete(session.id);
						await rm(stage, { recursive: true, force: true });
					}
				}
				return;
			}
			if (req.method === "GET" && matched) {
				const id = idSchema.parse(matched[1]);
				const { job } = await readExecutionJobV1(
					await privatePath(session.id),
					id,
				);
				if (matched[2] === "/inspection") {
					reply(res, 200, { inspection: await inspectJob(session.id, id) });
				} else if (matched[2] === "/image") {
					if (!job.imageUrl) fail("NOT_FOUND", 404);
					const dir = await privatePath(session.id, "jobs", id);
					let request: { provider?: string } | null = null;
					try {
						request = JSON.parse(
							await readFile(join(dir, "request-payload.json"), "utf8"),
						);
					} catch (error) {
						if (
							!(
								error instanceof Error &&
								"code" in error &&
								error.code === "ENOENT"
							)
						)
							throw error;
					}
					// Native intent wins independently of the request discriminator.
					let nativeIntent = false;
					try {
						await readFile(join(dir, "native-dispatch.json"));
						nativeIntent = true;
					} catch (error) {
						if (
							!(
								error instanceof Error &&
								"code" in error &&
								error.code === "ENOENT"
							)
						)
							throw error;
					}
					if (nativeIntent || request?.provider === "native-moss") {
						const checked = await verifyNativeMossWorkbenchResult(
							(name) => readFile(join(dir, name)),
							id,
						);
						res
							.writeHead(200, {
								"content-type": "image/png",
								"cache-control": "no-store",
								"x-content-type-options": "nosniff",
							})
							.end(checked.finalBytes);
						return;
					}
					res.writeHead(200, {
						"content-type": "image/png",
						"cache-control": "no-store",
						"x-content-type-options": "nosniff",
					});
					res.end(
						await readFile(
							await comfyCompletionArtifact(
								await privatePath(session.id, "jobs", id),
								"candidate.png",
							),
						),
					);
				} else reply(res, 200, { job });
				return;
			}
			const trainingMatch = route.match(
				/^\/api\/training-generations\/([-a-f0-9]+)(\/image)?$/,
			);
			if (req.method === "GET" && trainingMatch) {
				const id = idSchema.parse(trainingMatch[1]);
				const dir = await privatePath(session.id, "jobs", id);
				trainingRequestSchema.parse(
					JSON.parse(await readFile(join(dir, "request-payload.json"), "utf8")),
				);
				const { job } = await readExecutionJobV1(
					await privatePath(session.id),
					id,
				);
				const result =
					job.state === "HOLD" ? await verifyTrainingResult(dir) : null;
				if (trainingMatch[2]) {
					if (!result) fail("NOT_FOUND", 404);
					res.writeHead(200, {
						"content-type": "image/png",
						"cache-control": "no-store",
						"x-content-type-options": "nosniff",
					});
					res.end(await readFile(join(dir, "candidate.png")));
				} else reply(res, 200, { job, result, trainingSelected: false });
				return;
			}
			if (req.method === "POST" && route === "/api/training-generations") {
				const payload = trainingRequestSchema.parse(await body(req));
				if (!root || !ownProvider) fail("GENERATION_NOT_CONFIGURED", 503);
				if (active.has(session.id)) fail("JOB_RUNNING", 409);
				active.add(session.id);
				let reservation = 0;
				try {
					const dir = await privatePath(session.id, "jobs", payload.requestId);
					try {
						const retained = JSON.parse(
							await readFile(join(dir, "request-payload.json"), "utf8"),
						);
						const original = trainingRequestSchema.safeParse(retained);
						if (!original.success) fail("REQUEST_CONFLICT", 409);
						const replay = trainingRequestSchema.parse({
							...payload,
							connectionId: payload.connectionId ?? original.data.connectionId,
						});
						if (
							hash(Buffer.from(JSON.stringify(replay))) !==
							hash(Buffer.from(JSON.stringify(original.data)))
						)
							fail("REQUEST_CONFLICT", 409);
						const { job } = await readExecutionJobV1(
							await privatePath(session.id),
							payload.requestId,
						);
						if (job.state === "HOLD") await verifyTrainingResult(dir);
						reply(res, 200, { job, trainingSelected: false });
						return;
					} catch (error) {
						if (
							!(
								error instanceof Error &&
								"code" in error &&
								error.code === "ENOENT"
							)
						)
							throw error;
					}
					if (payload.styleProfileId !== "shared-target-drawing-v3")
						fail("TRAINING_STYLE_PROFILE_NOT_APPROVED", 422);
					if (!payload.connectionId) fail("CONNECTION_REQUIRED", 409);
					await checkOwnerUncertain(session.id);
					const binding = registry.snapshot(context, payload.connectionId);
					if (binding.protocolVersion !== "openai-compatible-http.v1")
						fail("CONNECTION_PROVIDER_MISMATCH", 409);
					registry.dispatch(context, binding, () => undefined);
					const source = await acquireTrainingSource(payload, {
						characters,
						wiki,
						wikiBaseUrl: config.wikiBaseUrl,
					});
					const prepared = prepareTrainingGeneration(
						payload,
						source,
						await loadTrainingStyles(payload.styleProfileId),
					);
					if (
						(await usage(root)) + reserved + 67108864 >
						config.maxStorageBytes
					)
						fail("STORAGE_LIMIT", 413);
					reservation = 67108864;
					reserved += reservation;
					await mkdir(dir, { recursive: true, mode: 0o700 });
					const lock = await open(join(dir, "dispatch.lock"), "wx", 0o600);
					await lock.close();
					let job: z.infer<typeof jobSchema> = {
						id: payload.requestId,
						state: "RUNNING",
						reviewStatus: "HOLD",
						imageUrl: null,
						metrics: null,
						errorCode: null,
						payloadSHA: hash(Buffer.from(JSON.stringify(payload))),
					};
					await save(join(dir, "job.json"), job);
					await save(join(dir, "initial-job.json"), job);
					await save(join(dir, "request-payload.json"), payload);
					await save(join(dir, "connection-binding.json"), binding);
					await save(join(dir, "training-intent.json"), prepared.intent);
					await save(join(dir, "training-source.json"), {
						token: Buffer.from(source.token).toString("base64"),
						recipient:
							source.recipient === null
								? null
								: Buffer.from(source.recipient).toString("base64"),
					});
					server.emit(`jobs:${session.id}`);
					try {
						const result = await registry.dispatch(
							context,
							binding,
							(_endpoint, apiKey, baseUrl) => {
								if (!baseUrl) fail("CONNECTION_NOT_READY", 409);
								return sendTrainingDrawingRequest({
									conditions: prepared.conditions,
									requestId: payload.requestId,
									connection: { baseUrl, apiKey },
									outputPath: join(dir, "provider-source.png"),
									send: (request) =>
										registry.dispatch(
											context,
											binding,
											(_current, key, currentUrl) => {
												if (key !== apiKey || currentUrl !== baseUrl)
													fail("CONNECTION_NOT_READY", 409);
												return (options.referenceSend ?? fetch)(request);
											},
										),
								});
							},
						);
						const delivery = trainingPortraitDelivery({
							rawBytes: result.bytes,
							canonicalReceiptBytes: await readFile(
								join(dir, "provider-source.png.receipt.json"),
							),
						});
						await writeFile(join(dir, "candidate.png"), delivery.bytes, {
							flag: "wx",
							mode: 0o600,
						});
						await verifyTrainingResult(dir);
						job = {
							...job,
							state: "HOLD",
							imageUrl: `${config.basePath}/api/training-generations/${payload.requestId}/image`,
							metrics: measurePng(delivery.bytes),
						};
					} catch (error) {
						const uncertain =
							error instanceof TransportError &&
							error.code === "NETWORK_FAILURE";
						if (
							error instanceof TransportError &&
							error.code === "MODEL_NOT_EXPOSED"
						)
							await quarantineTrainingResponse(dir);
						job = {
							...job,
							state: uncertain ? "UNKNOWN" : "FAILED",
							errorCode:
								error instanceof Error ? error.message : "TRAINING_FAILED",
						};
					}
					await save(join(dir, "terminal.json"), job);
					await rename(join(dir, "terminal.json"), join(dir, "job.json"));
					server.emit(`jobs:${session.id}`);
					reply(res, 200, { job, trainingSelected: false });
				} catch (error) {
					server.emit("training-error", error);
					throw error;
				} finally {
					reserved -= reservation;
					active.delete(session.id);
				}
				return;
			}
			if (req.method === "POST" && route === "/api/generations") {
				const input = await body(req);
				if (
					typeof input === "object" &&
					input !== null &&
					"schemaVersion" in input
				) {
					const validation = referenceGenerationRequestSchema.safeParse(input);
					if (!validation.success) {
						const denied = resolveReferenceSource(input, {
							status: "unresolved",
						});
						if (denied.status === "failed" || denied.status === "unresolved")
							fail(denied.errorCode, denied.httpStatus);
						fail("INVALID_REFERENCE_REQUEST", 422);
					}
					const payload = validation.data;
					if (
						!root ||
						(!template && payload.provider !== "native-moss") ||
						!ownProvider
					)
						fail("GENERATION_NOT_CONFIGURED", 503);
					if (active.has(session.id)) fail("JOB_RUNNING", 409);
					active.add(session.id);
					let reservedV2 = false;
					try {
						const dir = await privatePath(
							session.id,
							"jobs",
							payload.requestId,
						);
						const payloadSHA = hash(Buffer.from(JSON.stringify(payload)));
						try {
							const { job: existing } = await readExecutionJobV1(
								await privatePath(session.id),
								payload.requestId,
							);
							const original = referenceGenerationRequestSchema.parse(
								JSON.parse(
									await readFile(join(dir, "request-payload.json"), "utf8"),
								),
							);
							const replay = referenceGenerationRequestSchema.parse({
								...payload,
								connectionId: payload.connectionId ?? original.connectionId,
							});
							if (
								existing.payloadSHA !==
								hash(Buffer.from(JSON.stringify(replay)))
							)
								fail("REQUEST_CONFLICT", 409);
							if (existing.state === "RUNNING") fail("JOB_RUNNING", 409);
							reply(res, 200, { job: existing });
							return;
						} catch (error) {
							if (
								!(
									error instanceof Error &&
									"code" in error &&
									error.code === "ENOENT"
								)
							)
								throw error;
						}
						if (!payload.connectionId) fail("CONNECTION_REQUIRED", 409);
						await checkOwnerUncertain(session.id);
						const binding = registry.snapshot(context, payload.connectionId);
						const native = payload.provider === "native-moss";
						if (native && (!nativeAvailable || payload.sheetId))
							fail(
								payload.sheetId
									? "NATIVE_UPLOADED_SOURCE_UNSUPPORTED"
									: "NATIVE_NOT_CONFIGURED",
								payload.sheetId ? 422 : 503,
							);
						const comfy = payload.provider === "comfyui";
						if (!native && !comfy && registry.dispatch(context, binding,
							(_endpoint, _key, _url, savedModel) => savedModel ?? defaultProviderModel,
						) !== defaultProviderModel)
							fail("REFERENCE_PROVIDER_MODEL_UNSUPPORTED", 422);
						if ((native || comfy) && (await localAi?.admissionStatus())?.admission === "closed")
							fail("GPU_MAINTENANCE_REQUIRED", 503);
						const expectedModel = native
							? NATIVE_MOSS_MODEL
							: payload.inputMode === "token-only"
								? "comfyui:moss-image-sft-style-male.alpha.v1"
								: comfy
									? "comfyui:moss-image-sft-source-img2img.alpha.v1"
									: "gpt-image-2.5-sunburst";
						if (
							payload.providerModel !== expectedModel ||
							(payload.inputMode === "token-only" && !comfy && !native)
						)
							fail("REFERENCE_PROVIDER_MODEL_UNSUPPORTED", 422);
						if (
							(binding.protocolVersion === NATIVE_MOSS_PROTOCOL) !== native ||
							(binding.protocolVersion === COMFY_PROTOCOL) !== comfy ||
							(comfy && `comfyui:${binding.toolName}` !== expectedModel)
						)
							fail("CONNECTION_PROVIDER_MISMATCH", 409);
						registry.dispatch(context, binding, () => undefined);
						let uploaded: Sheet | null = null;
						if (payload.sheetId)
							uploaded = sheetFromBytes(
								new Uint8Array(
									await readFile(
										await privatePath(
											session.id,
											"sheets",
											payload.sheetId,
											"detail.json",
										),
									),
								),
								new Uint8Array(
									await readFile(
										await privatePath(
											session.id,
											"sheets",
											payload.sheetId,
											"token.json",
										),
									),
								),
								new Uint8Array(
									await readFile(
										await privatePath(
											session.id,
											"sheets",
											payload.sheetId,
											"image.png",
										),
									),
								),
							);
						const acquisitionRequest = uploaded
							? { ...payload, sheetId: undefined, personId: uploaded.personId }
							: payload;
						const acquisition = await acquireReferenceSource(
							acquisitionRequest,
							{
								characters: uploaded
									? { get: () => uploaded as Sheet }
									: characters,
								wiki,
								wikiBaseUrl: config.wikiBaseUrl,
							},
						);
						const authority = referenceAuthority(payload, acquisition);
						if (!acquisition.generation) fail("REFERENCE_NOT_ACQUIRED", 409);
						const personId = acquisition.generation.personId;
						const retained = uploaded ?? characters?.getReference(personId);
						const published = uploaded
							? null
							: await wiki.detailWithBytes(personId).catch((error: unknown) => {
									if (
										retained &&
										error instanceof WikiError &&
										error.code === "WIKI_UNAVAILABLE"
									)
										return null;
									throw error;
								});
						const detailBytes = retained?.detailBytes ?? published?.bytes;
						if (!detailBytes) fail("REFERENCE_NOT_ACQUIRED", 409);
						const sheet = generationSheetFromBytes(
							detailBytes,
							acquisition.generation.tokenBytes,
							acquisition.generation.recipientImage?.bytes ?? null,
						);
						if (
							published &&
							(published.personId !== sheet.personId ||
								published.characterId !== sheet.characterId ||
								published.name !== sheet.name)
						)
							fail("REFERENCE_IDENTITY_MISMATCH", 422);
						if (
							(await usage(root)) + reserved + 67108864 >
							config.maxStorageBytes
						)
							fail("STORAGE_LIMIT", 413);
						reserved += 67108864;
						reservedV2 = true;
						await mkdir(dir, { recursive: true, mode: 0o700 });
						const lock = await open(join(dir, "dispatch.lock"), "wx", 0o600);
						await lock.close();
						let job: z.infer<typeof jobSchema> = {
							id: payload.requestId,
							state: "RUNNING",
							reviewStatus: "HOLD",
							imageUrl: null,
							metrics: null,
							errorCode: null,
							payloadSHA,
						};
						const summary = referenceSummary(payload, acquisition);
						const adapted =
							payload.inputMode === "token-only" && !native
								? adaptSheet(
										sheet,
										template as Template,
										payload.requestId,
										payload.faceMode,
										payload.providerModel,
									)
								: null;
						await save(join(dir, "job.json"), job);
						await save(join(dir, "initial-job.json"), job);
						await save(join(dir, "job-history.json"), {
							createdAt: new Date(now()).toISOString(),
						});
						await save(join(dir, "request-payload.json"), payload);
						await save(join(dir, "connection-binding.json"), binding);
						await save(join(dir, "provenance.json"), {
							...(adapted?.provenance ?? {}),
							...(native
								? {
										native: {
											provider: "native-moss",
											model: payload.providerModel,
											recipe: payload.nativeRecipe,
											profileDigest: NATIVE_MOSS_PROFILE_DIGEST,
											ownerApproval: "NONE",
											qualityQualified: false,
										},
									}
								: {}),
							requestId: payload.requestId,
							original: sheet.sourceHashes,
							reference: summary,
						});
						await save(join(dir, "source-bytes.json"), {
							detail: Buffer.from(sheet.detailBytes).toString("base64"),
							token: Buffer.from(sheet.tokenBytes).toString("base64"),
							image: sheet.imageBytes
								? Buffer.from(sheet.imageBytes).toString("base64")
								: null,
							pins: adapted?.pins ?? null,
						});
						await save(join(dir, "reference-analysis.json"), {
							records: authority.records,
							retainedAnalysis: authority.retainedAnalysis,
						});
						if (sheet.imageBytes)
							await writeFile(
								join(dir, "reference-normalized.png"),
								transformReferencePng(sheet.imageBytes).rgbaBytes,
								{ flag: "wx", mode: 0o600 },
							);
						server.emit(`jobs:${session.id}`);
						try {
							let bytes: Uint8Array;
							if (native) {
								const storage = {
									jobDirectory: async (id: string) => {
										if (id !== payload.requestId) fail("REQUEST_CONFLICT", 409);
										return dir;
									},
								};
								const provider = (
									options.nativeMossTest?.createProvider ??
									createNativeMossProvider
								)(storage);
								const admission: { state: string; code?: string } =
									await registry.dispatch(context, binding, () =>
										provider.readiness(),
									);
								if (!options.nativeMossTest && admission.state !== "READY") {
									const code = admission.code ?? "NATIVE_READINESS_UNVERIFIED";
									job = { ...job, state: "FAILED", errorCode: code };
									nativeReason = code;
									await save(join(dir, "terminal.json"), job);
									await rename(
										join(dir, "terminal.json"),
										join(dir, "job.json"),
									);
									reply(res, 503, {
										job,
										native: { state: "NOT_READY", code, requestId: job.id },
									});
									return;
								}
								registry.dispatch(context, binding, () => undefined);
								const providerAuthority: NativeMossProviderAuthority = {
									serverEvidence: authority.serverEvidence,
									detailBytes: sheet.detailBytes,
									ownerBindingHash: hash(
										Buffer.from(`${session.id}:${context.sessionFingerprint}`),
									),
								};
								const testProof = options.nativeMossTest?.dispatchProof?.(
									payload,
									providerAuthority,
								);
								providerAuthority.dispatchProof =
									testProof ??
									(await prepareNativeMossDispatchProof(
										payload,
										providerAuthority,
									));
								await save(
									join(dir, "native-server-proof.json"),
									providerAuthority.dispatchProof,
								);
								const outcome = await registry.dispatch(context, binding, () =>
									provider.execute(payload, providerAuthority, {
										authorizeMutation: async (_phase, handle) => {
											if (
												closing ||
												auth.verify(cookies.portal_session ?? "")?.id !==
													session.id ||
												handle.requestId !== payload.requestId ||
												handle.ownerBindingHash !==
													providerAuthority.ownerBindingHash
											)
												fail("NATIVE_MUTATION_NOT_AUTHORIZED", 409);
											const retained = JSON.parse(
												await readFile(
													join(dir, "native-dispatch.json"),
													"utf8",
												),
											) as { handle: Record<string, unknown> };
											for (const key of [
												"requestId",
												"nonce",
												"ownerBindingHash",
												"envelopeSHA256",
												"profileDigest",
											] as const)
												if (retained.handle[key] !== handle[key])
													fail("NATIVE_MUTATION_NOT_AUTHORIZED", 409);
											registry.dispatch(context, binding, () => undefined);
										},
									}),
								);
								await save(
									join(dir, "native-provider-result.json"),
									outcome.state === "HOLD"
										? { ...outcome, finalBytes: undefined }
										: outcome,
								);
								if (outcome.state !== "HOLD") {
									job = {
										...job,
										state: outcome.state === "UNKNOWN" ? "UNKNOWN" : "FAILED",
										errorCode: outcome.code,
									};
									if (outcome.state === "NOT_READY")
										nativeReason = outcome.code;
									await save(join(dir, "terminal.json"), job);
									await rename(
										join(dir, "terminal.json"),
										join(dir, "job.json"),
									);
									server.emit(`jobs:${session.id}`);
									reply(
										res,
										outcome.state === "NOT_READY"
											? 503
											: outcome.state === "REJECTED"
												? 422
												: 200,
										{ job, native: outcome },
									);
									return;
								}
								if (!options.nativeMossTest) {
									const collect = (
										nativeMossTransport as typeof nativeMossTransport & {
											lifecycleReadArtifacts?: (
												handle: NativeMossLifecycleHandle,
											) => Promise<{
												state: string;
												files?: { name: string; byteBase64: string }[];
											}>;
										}
									).lifecycleReadArtifacts;
									if (!collect)
										throw Error("NATIVE_LIFECYCLE_ARTIFACTS_UNAVAILABLE");
									const lifecycle = JSON.parse(
										await readFile(join(dir, "native-lifecycle.json"), "utf8"),
									) as NativeMossLifecycleHandle;
									const collected = await registry.dispatch(
										context,
										binding,
										() => collect(lifecycle),
									);
									if (collected.state !== "ARTIFACTS" || !collected.files)
										throw Error("NATIVE_ARTIFACTS_UNAVAILABLE");
									await save(
										join(dir, "native-artifacts.json"),
										collected.files.map((file) => ({
											name: file.name,
											byteBase64: file.byteBase64,
										})),
									);
								}
								await writeFile(
									join(dir, "candidate.png"),
									outcome.finalBytes,
									{ flag: "wx", mode: 0o600 },
								);
								bytes = outcome.finalBytes;
							} else if (comfy) {
								const row = comfyRows.get(binding.connectionId);
								if (!row?.proof || row.authorize)
									throw new ComfyError("COMFY_CONNECTION_NOT_READY");
								row.authorize = (start) =>
									registry.dispatch(context, binding, () => start());
								try {
									const common = {
										directory: dir,
										provider: row.provider,
										connection: row.proof,
										signal: row.controller.signal,
										serverEvidence: authority.serverEvidence,
									};
									if (payload.inputMode === "reference-img2img") {
										const result = await dispatchComfySourceV2(
											{
												request: payload,
												denoise: resolveSourceRecipe(payload.sourceRecipe)
													.denoise,
											},
											common,
										);
										if (!sheet.imageBytes || !result.finishingImages)
											throw Error("RESULT_EVIDENCE_MISMATCH");
										const delivery = portraitDeliveryV2({
											...(payload.generationProfile
												? { generationProfile: payload.generationProfile }
												: {}),
											engine: "comfyui",
											originalBytes: sheet.imageBytes,
											nativeBytes: transformReferencePng(
												sheet.imageBytes,
												"native",
												payload.generationProfile,
												"comfyui",
											).rgbaBytes,
											rawBytes: result.finishingImages.rawBytes,
											finishedBytes: result.sourceBytes,
											canonicalReceiptBytes: result.canonicalReceiptBytes,
										});
										await rename(
											join(dir, "candidate.png.receipt.json"),
											join(dir, "provider-delivery-v1.receipt.json"),
										);
										await writeFile(
											join(dir, "candidate.png.receipt.json"),
											delivery.receiptBytes,
											{ flag: "wx", mode: 0o600 },
										);
										if (hash(result.bytes) !== hash(delivery.bytes))
											throw Error("RESULT_EVIDENCE_MISMATCH");
										bytes = delivery.bytes;
									} else
										bytes = (
											await dispatchComfyTokenV2(
												{ request: payload, seed: 152995270030802 },
												{
													...common,
													detailBytes: sheet.detailBytes,
													template: template as Template,
												},
											)
										).bytes;
								} finally {
									row.authorize = null;
								}
							} else {
								if (!authority.records || !sheet.imageBytes)
									fail("REFERENCE_NOT_ACQUIRED", 409);
								const result = await dispatchLocalReferenceV2(
									{ request: payload },
									{
										...authority,
										records: authority.records,
										directory: dir,
										outbound: (start) =>
											registry.dispatch(context, binding, start),
										...(options.referenceSend
											? { send: options.referenceSend }
											: {}),
									},
								);
								const canonicalReceiptBytes = await readFile(
									join(dir, "provider-source.png.receipt.json"),
								);
								const delivery = portraitDeliveryV2({
									...(payload.generationProfile
										? { generationProfile: payload.generationProfile }
										: {}),
									engine: "cpa",
									originalBytes: sheet.imageBytes,
									nativeBytes: transformReferencePng(
										sheet.imageBytes,
										"native",
										payload.generationProfile,
									).rgbaBytes,
									rawBytes: result.bytes,
									finishedBytes: result.bytes,
									canonicalReceiptBytes,
								});
								await writeFile(
									join(dir, "provider-canonical.receipt.json"),
									canonicalReceiptBytes,
									{ flag: "wx", mode: 0o600 },
								);
								await writeFile(
									join(dir, "candidate.png.receipt.json"),
									delivery.receiptBytes,
									{ flag: "wx", mode: 0o600 },
								);
								await writeFile(join(dir, "candidate.png"), delivery.bytes, {
									flag: "wx",
									mode: 0o600,
								});
								bytes = delivery.bytes;
							}
							const metrics = measurePng(bytes);
							await save(join(dir, "machine-diagnostics.json"), metrics);
							job = {
								...job,
								state: "HOLD",
								imageUrl: `${config.basePath}/api/jobs/${job.id}/image`,
								metrics,
							};
						} catch (error) {
							job = {
								...job,
								state:
									native ||
									((error instanceof McpError || error instanceof ComfyError) &&
										error.uncertain)
										? "UNKNOWN"
										: "FAILED",
								errorCode:
									error instanceof McpError || error instanceof ComfyError
										? error.code
										: error instanceof Error &&
												/^[A-Z][A-Z0-9_]+$/.test(error.message)
											? error.message
											: "REFERENCE_GENERATION_FAILED",
							};
						}
						await save(join(dir, "terminal.json"), job);
						await rename(join(dir, "terminal.json"), join(dir, "job.json"));
						server.emit(`jobs:${session.id}`);
						reply(res, 200, {
							job: {
								...job,
								providerModel: payload.providerModel,
								reference: summary,
							},
						});
					} finally {
						if (reservedV2) reserved -= 67108864;
						active.delete(session.id);
					}
					return;
				}
				const payload = generationSchema.parse(input);
				if (
					comfyWorkflowOf(payload.providerModel) &&
					!comfyWorkflows.some((w) => w.providerModel === payload.providerModel)
				)
					fail("COMFY_WORKFLOW_RETIRED", 422);
				if (!payload.connectionId && !root) fail("CONNECTION_REQUIRED", 409);
				if (active.has(session.id)) {
					if (!payload.connectionId) fail("CONNECTION_REQUIRED", 409);
					fail("JOB_RUNNING", 409);
				}
				active.add(session.id);
				try {
					let payloadSHA = hash(
						new TextEncoder().encode(JSON.stringify(payload)),
					);
					const dir = await privatePath(session.id, "jobs", payload.requestId),
						jobPath = join(dir, "job.json");
					try {
						const { job: existing } = await readExecutionJobV1(
							await privatePath(session.id),
							payload.requestId,
						);
						if (!payload.connectionId && existing.payloadSHA !== payloadSHA) {
							const original = generationSchema.parse(
								JSON.parse(
									await readFile(join(dir, "request-payload.json"), "utf8"),
								),
							);
							// Preserve schema field order when hashing a replay without authority.
							payloadSHA = hash(
								new TextEncoder().encode(
									JSON.stringify(
										generationSchema.parse({
											...payload,
											connectionId: original.connectionId,
										}),
									),
								),
							);
						}
						if (existing.payloadSHA !== payloadSHA)
							fail("REQUEST_CONFLICT", 409);
						if (existing.state === "RUNNING") fail("JOB_RUNNING", 409);
						reply(res, 200, { job: existing });
						return;
					} catch (error) {
						if (
							!(
								error instanceof Error &&
								"code" in error &&
								error.code === "ENOENT"
							)
						)
							throw error;
					}
					if (!payload.connectionId) fail("CONNECTION_REQUIRED", 409);
					await checkOwnerUncertain(session.id);
					if (comfyWorkflowOf(payload.providerModel) && payload.size === "1024x1536") fail("INVALID_INPUT", 422);
					const binding = registry.snapshot(context, payload.connectionId);
					// The payload names the provider/workflow and the connection must be
					// the matching one: a Comfy workflow never rides an OpenAI connection
					// and a GPT model never rides the Comfy connection.
					const comfyWorkflow = comfyWorkflowOf(payload.providerModel);
					if (comfyWorkflow && (await localAi?.admissionStatus())?.admission === "closed") fail("GPU_MAINTENANCE_REQUIRED", 503);
					if (
						(binding.protocolVersion === COMFY_PROTOCOL) !==
							(comfyWorkflow !== null) ||
						(comfyWorkflow !== null && binding.toolName !== comfyWorkflow.id)
					)
						fail("CONNECTION_PROVIDER_MISMATCH", 409);
					registry.dispatch(context, binding, () => undefined);
					if (!template || !root) fail("GENERATION_NOT_CONFIGURED", 503);
					const reservation = 67108864;
					let hasReservation = false;
					try {
						if (
							(await usage(root)) + reserved + reservation >
							config.maxStorageBytes
						)
							fail("STORAGE_LIMIT", 413);
						reserved += reservation;
						hasReservation = true;
						const sheet = payload.sheetId
							? sheetFromBytes(
									new Uint8Array(
										await readFile(
											await privatePath(
												session.id,
												"sheets",
												payload.sheetId,
												"detail.json",
											),
										),
									),
									new Uint8Array(
										await readFile(
											await privatePath(
												session.id,
												"sheets",
												payload.sheetId,
												"token.json",
											),
										),
									),
									new Uint8Array(
										await readFile(
											await privatePath(
												session.id,
												"sheets",
												payload.sheetId,
												"image.png",
											),
										),
									),
								)
							: await generationSource(
									await wiki.detail(payload.personId ?? ""),
								);
						if (!sheet) fail("NOT_FOUND", 404);
						if (payload.personId) {
							const currentWiki = await wiki.detail(payload.personId);
							if (
								currentWiki.characterId !== sheet.characterId ||
								currentWiki.name !== sheet.name
							)
								fail("WIKI_IDENTITY_MISMATCH", 409);
						}
						const adapted = adaptSheet(
							sheet,
							template,
							payload.requestId,
							payload.faceMode,
							payload.providerModel,
						);
						await mkdir(dir, { recursive: true, mode: 0o700 });
						const lock = await open(join(dir, "dispatch.lock"), "wx", 0o600);
						await lock.close();
						let job: z.infer<typeof jobSchema> = {
							id: payload.requestId,
							state: "RUNNING",
							reviewStatus: "HOLD",
							imageUrl: null,
							metrics: null,
							errorCode: null,
							payloadSHA,
						};
						await save(jobPath, job);
						await save(join(dir, "initial-job.json"), job);
						await save(join(dir, "job-history.json"), {
							createdAt: new Date(now()).toISOString(),
						});
						await save(join(dir, "request-payload.json"), payload);
						await save(join(dir, "connection-binding.json"), binding);
						await save(join(dir, "provenance.json"), {
							...adapted.provenance,
							...(comfyWorkflow ? { operatorProviderModel: payload.providerModel } : {}),
						});
						await save(join(dir, "source-bytes.json"), {
							detail: Buffer.from(sheet.detailBytes).toString("base64"),
							token: Buffer.from(sheet.tokenBytes).toString("base64"),
							image: sheet.imageBytes
								? Buffer.from(sheet.imageBytes).toString("base64")
								: null,
							pins: adapted.pins,
						});
						job = await runJob(
							context,
							binding,
							dir,
							job,
							adapted.projection,
							adapted.candidate.referenceImages.map((r) => r.bytes),
							undefined,
							comfyWorkflow
								? {
										providerModel: comfyWorkflow.providerModel,
										// randomInt requires max - min < 2^48.
										seed: payload.seed ?? randomInt(0, 2 ** 48 - 1),
									}
								: undefined,
						);
						reply(res, 200, { job });
					} finally {
						if (hasReservation) reserved -= reservation;
					}
				} finally {
					active.delete(session.id);
				}
				return;
			}
			if (req.method === "GET" && route === "/api/v2/workstations/catalog") {
				reply(res, 200, {
					schema: "portal-workstation-catalog.v2",
					categories: [
						"portrait",
						"fullbody-turntable",
						"torso",
						"detached-head",
						"head-without-hair-eyes-teeth",
						"hair",
						"underwear-only-torso",
					],
					productionGeneration: "BLOCKED_SINGLE_ATTEMPT_NOT_PROVED",
					transport: "controlled-loopback-images-edits-explicit-size-png",
					maxActualSends: 5,
					paidProof: "NOT_RUN",
				});
				return;
			}
			const workstationRoute = route.match(
				/^\/api\/v2\/workstations\/(person-\d+)\/(history|[0-9a-f-]+)(?:\/frames\/([0-3])\/(image|result))?$/,
			);
			if (
				req.method === "GET" &&
				(workstationRoute || route === "/api/v2/workstations")
			) {
				const ownerRoot = await privatePath(session.id);
				const history = await ownerJobs(session.id);
				const items = [];
				for (const job of history) {
					let request: ReturnType<typeof parseWorkstationRequest>;
					try {
						request = parseWorkstationRequest(
							JSON.parse(
								await readFile(
									await privatePath(
										session.id,
										"jobs",
										job.id,
										"workstation-request.json",
									),
									"utf8",
								),
							),
						);
					} catch (error) {
						if (
							error instanceof Error &&
							"code" in error &&
							error.code === "ENOENT"
						)
							continue;
						throw error;
					}
					if (workstationRoute && request.personId !== workstationRoute[1])
						continue;
					items.push({ job, request, reviewStatus: "HOLD", approval: "NONE" });
				}
				if (!workstationRoute || workstationRoute[2] === "history") {
					reply(res, 200, { schema: "portal-workstation-history.v2", items });
					return;
				}
				const selected = items.find(
					(item) => item.job.id === idSchema.parse(workstationRoute[2]),
				);
				if (!selected) fail("NOT_FOUND", 404);
				if (selected.job.state !== "HOLD") {
					if (workstationRoute[3]) fail("NOT_FOUND", 404);
					reply(res, 200, selected);
					return;
				}
				const index = await indexWorkstationArtifact({
					ownerRoot,
					ownerId: session.id,
					personId: selected.request.personId,
					parentRequestId: selected.job.id,
				});
				if (workstationRoute[3]) {
					const frameOrder = Number(workstationRoute[3]);
					if (!selected.request.frames[frameOrder]) fail("NOT_FOUND", 404);
					if (workstationRoute[4] === "result")
						reply(res, 200, { ...selected, index });
					else {
						const directory = join(
							await workstationParent(ownerRoot, selected.request.personId),
							selected.job.id,
						);
						const path = join(directory, `frame-${frameOrder}.png`);
						if (
							(await realpath(path)) !== path ||
							!(await lstat(path)).isFile()
						)
							fail("INVALID_PATH", 404);
						const file = await open(
							path,
							constants.O_RDONLY | constants.O_NOFOLLOW,
						);
						try {
							const bytes = await file.readFile();
							const receipt = JSON.parse(
								await readFile(
									join(directory, `frame-${frameOrder}.receipt.json`),
									"utf8",
								),
							);
							if (hash(bytes) !== receipt.imageSha256)
								fail("INVALID_FILE", 409);
							res
								.writeHead(200, {
									"content-type": "image/png",
									"cache-control": "no-store",
									"x-content-type-options": "nosniff",
								})
								.end(bytes);
						} finally {
							await file.close();
						}
					}
				} else reply(res, 200, { ...selected, index });
				return;
			}
			if (req.method === "GET" && route === "/api/references") {
				reply(res, 200, {
					catalog: {
						...referenceCatalog,
						styleReferenceSha256: template?.candidate.referenceImages.find(
							(item) => item.role === "drawing-technique-only",
						)
							? hash(
									template.candidate.referenceImages.find(
										(item) => item.role === "drawing-technique-only",
									)?.bytes ?? new Uint8Array(),
								)
							: null,
					},
				});
				return;
			}
			const referenceIdentity = route.match(
				/^\/api\/references\/identities\/([0-9a-f-]+)$/,
			);
			if (req.method === "GET" && referenceIdentity) {
				const id = idSchema.parse(referenceIdentity[1]);
				const store = createEvaluationStore({
					ownerRoot: await privatePath(session.id),
					ownerId: session.id,
				});
				const result = await store.readResult(id);
				const identity = generationSchema.parse(
					JSON.parse(
						await readFile(
							await privatePath(session.id, "jobs", id, "request-payload.json"),
							"utf8",
						),
					),
				);
				if (!identity.personId) fail("REFERENCE_IDENTITY_MISMATCH", 409);
				reply(res, 200, {
					identity: {
						resultId: result.jobId,
						personId: identity.personId,
						faceMode: identity.faceMode,
						pngSHA: result.pngSHA,
						reviewStatus: "HOLD",
						approval: "NONE",
					},
				});
				return;
			}
			const referenceRoute = route.match(
				/^\/api\/references\/([0-9a-f-]+)(?:\/(front|profile|side|back|head|hair|upper|lower|footwear)\/(image|result))?$/,
			);
			if (req.method === "GET" && referenceRoute) {
				const id = idSchema.parse(referenceRoute[1]);
				const ownerRoot = await privatePath(session.id);
				const dir = join(ownerRoot, "jobs", id);
				const readReference = async (...parts: string[]) => {
					const path = join(dir, ...parts);
					if (!path.startsWith(ownerRoot + sep)) fail("INVALID_PATH", 404);
					for (const current of [
						ownerRoot,
						join(ownerRoot, "jobs"),
						dir,
						...(parts.length > 1 ? [join(dir, "references")] : []),
					]) {
						if (
							!(await lstat(current)).isDirectory() ||
							(await realpath(current)) !== current
						)
							fail("INVALID_PATH", 404);
					}
					if (!(await lstat(path)).isFile() || (await realpath(path)) !== path)
						fail("INVALID_PATH", 404);
					try {
						const file = await open(
							path,
							constants.O_RDONLY | constants.O_NOFOLLOW,
						);
						try {
							if (!(await file.stat()).isFile()) fail("INVALID_PATH", 404);
							return await file.readFile();
						} finally {
							await file.close();
						}
					} catch (error) {
						if (
							error instanceof Error &&
							"code" in error &&
							error.code === "ELOOP"
						)
							fail("INVALID_PATH", 404);
						throw error;
					}
				};
				const { job } = await readExecutionJobV1(ownerRoot, id);
				const manifest = JSON.parse(
					(await readReference("references", "set.json")).toString(),
				) as import("./references.ts").ReferenceManifest;
				if (manifest.binding.parentRequestId !== id)
					fail("REFERENCE_BINDING_MISMATCH", 409);
				if (referenceRoute[2]) {
					const shot = manifest.shots.find(
						(item) =>
							item.shot === referenceRoute[2] && item.status === "SUCCEEDED",
					);
					if (!shot) fail("NOT_FOUND", 404);
					const receiptBytes = await readReference(
						"references",
						`${shot.shot}.receipt.json`,
					);
					if (hash(receiptBytes) !== shot.receiptSha256)
						fail("REFERENCE_BINDING_MISMATCH", 409);
					const parsed = z
						.object({
							schemaVersion: z.literal(1),
							requestId: idSchema,
							shot: z.enum(referenceKinds),
							status: z.literal("SUCCEEDED"),
							imageSha256: z.string().regex(/^[a-f0-9]{64}$/),
							binding: z.unknown(),
						})
						.safeParse(JSON.parse(receiptBytes.toString()));
					if (!parsed.success) fail("REFERENCE_BINDING_MISMATCH", 409);
					const receipt = parsed.data;
					const bytes = await readReference("references", `${shot.shot}.png`);
					if (
						receipt.requestId !== shot.requestId ||
						receipt.shot !== referenceRoute[2] ||
						hash(bytes) !== receipt.imageSha256 ||
						JSON.stringify(receipt.binding) !== JSON.stringify(manifest.binding)
					)
						fail("REFERENCE_BINDING_MISMATCH", 409);
					if (referenceRoute[3] === "result") {
						reply(res, 200, {
							result: {
								requestId: id,
								childRequestId: receipt.requestId,
								shot: receipt.shot,
								receiptSHA: shot.receiptSha256,
								pngSHA: receipt.imageSha256,
								imageUrl: `${config.basePath}/api/references/${id}/${receipt.shot}/image`,
							},
						});
						return;
					}
					res
						.writeHead(200, {
							"content-type": "image/png",
							"cache-control": "no-store",
							"x-content-type-options": "nosniff",
						})
						.end(bytes);
				} else
					reply(res, 200, {
						job,
						manifest,
						reviewStatus: "HOLD",
						approval: "NONE",
					});
				return;
			}
			if (
				req.method === "POST" &&
				["/api/references", "/api/v2/workstations"].includes(route)
			) {
				const v2 = route === "/api/v2/workstations";
				const input = await body(req);
				const envelope = v2
					? z
							.strictObject({
								request: z.unknown(),
								authoredLookBase64: z.string().min(1).max(32768),
							})
							.parse(input)
					: null;
				const workstation = envelope
					? parseWorkstationRequest(envelope.request)
					: null;
				const payload = workstation ?? referenceRequestSchema.parse(input);
				const payloadSHA = hash(
					Buffer.from(
						JSON.stringify(
							workstation
								? {
										request: workstation,
										authoredLookBase64: envelope?.authoredLookBase64,
									}
								: payload,
						),
					),
				);
				const dir = await privatePath(session.id, "jobs", payload.requestId);
				try {
					const { job: prior } = await readExecutionJobV1(
						await privatePath(session.id),
						payload.requestId,
					);
					if (prior.payloadSHA !== payloadSHA) fail("REQUEST_CONFLICT", 409);
					if (prior.state === "RUNNING") fail("JOB_RUNNING", 409);
					reply(res, 200, {
						job: prior,
						manifest: v2
							? null
							: JSON.parse(
									await readFile(join(dir, "references", "set.json"), "utf8"),
								),
						reviewStatus: "HOLD",
						approval: "NONE",
					});
					return;
				} catch (error) {
					if (
						!(
							error instanceof Error &&
							"code" in error &&
							error.code === "ENOENT"
						)
					)
						throw error;
				}
				if (active.has(session.id)) fail("JOB_RUNNING", 409);
				active.add(session.id);
				let reservation = 0;
				try {
					await checkOwnerUncertain(session.id);
					const binding = registry.snapshot(context, payload.connectionId);
					registry.dispatch(context, binding, () => undefined);
					if (!ownProvider || !template || !characters || !root)
						fail("GENERATION_NOT_CONFIGURED", 503);
					// The gateway's production single-attempt behavior is not proved.
					// No public input, environment switch or provider fallback bypasses it.
					if (!options.controlledReferences)
						fail("REFERENCE_PRODUCTION_BLOCKED", 503);
					registry.dispatch(context, binding, (_endpoint, _key, baseUrl) => {
						if (
							!baseUrl ||
							!["127.0.0.1", "localhost", "[::1]"].includes(
								new URL(baseUrl).hostname,
							)
						)
							fail("REFERENCE_PRODUCTION_BLOCKED", 503);
					});
					const identityDir = await privatePath(
						session.id,
						"jobs",
						payload.identityResultId,
					);
					const store = createEvaluationStore({
						ownerRoot: await privatePath(session.id),
						ownerId: session.id,
					});
					const sealed = await store.readResult(payload.identityResultId);
					const identityRequest = generationSchema.parse(
						JSON.parse(
							await readFile(join(identityDir, "request-payload.json"), "utf8"),
						),
					);
					const sourceBytes = z
						.object({
							detail: z.string(),
							token: z.string(),
							image: z.string(),
						})
						.parse(
							JSON.parse(
								await readFile(join(identityDir, "source-bytes.json"), "utf8"),
							),
						);
					const original = sheetFromBytes(
						Buffer.from(sourceBytes.detail, "base64"),
						Buffer.from(sourceBytes.token, "base64"),
						Buffer.from(sourceBytes.image, "base64"),
					);
					if (
						v2 &&
						!characters
							.list()
							.some((person) => person.personId === payload.personId)
					)
						fail("NOT_FOUND", 404);
					const current = characters.get(payload.personId);
					if (
						v2 &&
						!(
							await eligibility({
								personId: original.personId,
								characterId: original.characterId,
								name: original.name,
							})
						).eligible
					)
						fail("WORKSTATION_PERSON_INELIGIBLE", 409);
					if (
						identityRequest.personId !== payload.personId ||
						original.personId !== payload.personId ||
						JSON.stringify(identityRequest.faceMode) !==
							JSON.stringify(payload.faceMode) ||
						JSON.stringify(original.sourceHashes) !==
							JSON.stringify(current.sourceHashes)
					)
						fail("REFERENCE_IDENTITY_MISMATCH", 409);
					const style = template.candidate.referenceImages.find(
						(item) =>
							item.role === "drawing-technique-only" &&
							hash(item.bytes) === payload.styleReferenceSha256,
					);
					const identityTransport = z
						.object({
							referenceHashes: z.array(z.string()),
							referenceImages: z.array(z.string()),
						})
						.parse(
							JSON.parse(
								await readFile(
									join(identityDir, "candidate.png.request.json"),
									"utf8",
								),
							),
						);
					const index = identityTransport.referenceHashes.indexOf(
						payload.styleReferenceSha256,
					);
					if (
						!style ||
						index < 0 ||
						hash(
							Buffer.from(
								identityTransport.referenceImages[index] ?? "",
								"base64",
							),
						) !== payload.styleReferenceSha256
					)
						fail("REFERENCE_STYLE_MISMATCH", 409);
					const authoredLookBytes = envelope
						? Buffer.from(decode(envelope.authoredLookBase64, 24576))
						: null;
					if (workstation && authoredLookBytes) {
						const selected = workstation.sourceBinding;
						if (
							selected &&
							(selected.ownerId !== session.id ||
								selected.characterId !== original.characterId ||
								selected.identityPngSHA !== sealed.pngSHA ||
								JSON.stringify(selected.originalHashes) !==
									JSON.stringify(original.sourceHashes))
						)
							fail("WORKSTATION_SOURCE_BINDING_MISMATCH", 409);
						const look = authoredWorkstationLookSchema.parse(
							JSON.parse(authoredLookBytes.toString()),
						);
						if (
							hash(authoredLookBytes) !== workstation.authoredLook.sha256 ||
							look.sourceId !== workstation.authoredLook.sourceId ||
							look.lookId !== workstation.authoredLook.lookId ||
							(!selected &&
								look.lookId !==
									z.object({ lookId: z.string() }).parse(original.token)
										.lookId) ||
							look.personId !== original.personId ||
							look.characterId !== original.characterId ||
							look.category !== workstation.frames[0]?.outputSpec.category
						)
							fail("WORKSTATION_AUTHORED_LOOK_MISMATCH", 409);
						const attemptsPath = await privatePath(
							session.id,
							"workstation-attempts.json",
						);
						let attempts: { requestIds: string[] } = { requestIds: [] };
						try {
							attempts = z
								.strictObject({ requestIds: z.array(z.uuid()).max(5) })
								.parse(JSON.parse(await readFile(attemptsPath, "utf8")));
						} catch (error) {
							if (
								!(
									error instanceof Error &&
									"code" in error &&
									error.code === "ENOENT"
								)
							)
								throw error;
						}
						if (attempts.requestIds.length + workstation.frames.length > 5)
							fail("WORKSTATION_ATTEMPT_LIMIT", 409);
					}
					const required =
						67108864 *
						(workstation
							? workstation.frames.length
							: referenceRequestSchema.parse(payload).shots.length);
					if (
						(await usage(root)) + reserved + required >
						config.maxStorageBytes
					)
						fail("STORAGE_LIMIT", 413);
					reservation = required;
					reserved += reservation;
					await mkdir(dir, { recursive: true, mode: 0o700 });
					const lock = await open(join(dir, "dispatch.lock"), "wx", 0o600);
					await lock.close();
					const source = await referenceInputs(
						dir,
						Buffer.from(
							JSON.stringify({
								...original.token,
								faceMode: identityRequest.faceMode,
							}),
						),
						style.bytes,
					);
					let job = jobSchema.parse({
						id: payload.requestId,
						state: "RUNNING",
						reviewStatus: "HOLD",
						imageUrl: null,
						metrics: null,
						errorCode: null,
						payloadSHA,
					});
					await save(join(dir, "job.json"), job);
					await save(join(dir, "initial-job.json"), job);
					await save(join(dir, "request-payload.json"), payload);
					await save(join(dir, "connection-binding.json"), binding);
					if (workstation && authoredLookBytes) {
						await save(join(dir, "workstation-request.json"), workstation);
						const ownerRoot = await privatePath(session.id);
						const directory = join(
							await workstationParent(ownerRoot, workstation.personId, true),
							workstation.requestId,
						);
						try {
							const manifest = await generatePortalWorkstation(
								{
									request: workstation,
									ownerRoot,
									source: {
										...source,
										ownerId: session.id,
										originalHashes: original.sourceHashes,
										originalBytes: {
											detail: original.detailBytes,
											token: original.tokenBytes,
											image: original.imageBytes,
										},
									},
									authoredLookBytes,
									identity: {
										ownerId: session.id,
										status: "sealed",
										resultId: sealed.jobId,
										personId: original.personId,
										characterId: original.characterId,
										sourceSha256: source.sha256,
										styleReferenceSha256: workstation.styleReferenceSha256,
										faceMode: identityRequest.faceMode,
										imagePath: join(identityDir, "candidate.png"),
										imageSha256: sealed.pngSHA,
									},
								},
								async (request) => {
									if (
										JSON.stringify(
											characters.get(workstation.personId).sourceHashes,
										) !== JSON.stringify(original.sourceHashes)
									)
										throw Error("WORKSTATION_SOURCE_CHANGED");
									const stem = `frame-${request.outputSpec.frameOrder}`;
									const journal = JSON.parse(
										await readFile(
											join(directory, `${stem}.request.json`),
											"utf8",
										),
									);
									if (JSON.stringify(journal) !== JSON.stringify(request))
										throw Error("WORKSTATION_JOURNAL_MISMATCH");
									const attemptsPath = await privatePath(
										session.id,
										"workstation-attempts.json",
									);
									let attempts: { requestIds: string[] } = { requestIds: [] };
									try {
										attempts = z
											.strictObject({ requestIds: z.array(z.uuid()).max(5) })
											.parse(JSON.parse(await readFile(attemptsPath, "utf8")));
									} catch (error) {
										if (
											!(
												error instanceof Error &&
												"code" in error &&
												error.code === "ENOENT"
											)
										)
											throw error;
									}
									if (
										attempts.requestIds.length >= 5 ||
										attempts.requestIds.includes(request.requestId)
									)
										throw Error("WORKSTATION_ATTEMPT_LIMIT");
									attempts.requestIds.push(request.requestId);
									await save(join(dir, `${stem}.attempt.json`), attempts);
									await rename(join(dir, `${stem}.attempt.json`), attemptsPath);
									for (const path of [
										join(dir, "dispatch.lock"),
										join(dir, "job.json"),
										join(dir, "request-payload.json"),
										join(dir, "workstation-request.json"),
										source.characterPath,
										source.stylePath,
										source.referencePath,
										join(directory, "request.json"),
										join(directory, "authored-look.json"),
										join(directory, "plan.json"),
										join(directory, `${stem}.request.json`),
										attemptsPath,
										dir,
										dirname(dir),
										directory,
										dirname(directory),
										dirname(dirname(directory)),
										ownerRoot,
									]) {
										const file = await open(path, "r");
										try {
											await file.sync();
										} finally {
											await file.close();
										}
									}
									const form = new FormData();
									form.set("model", workstation.providerModel);
									form.set("prompt", request.prompt);
									form.set("n", "1");
									form.set(
										"size",
										`${request.outputSpec.width}x${request.outputSpec.height}`,
									);
									form.set("output_format", "png");
									form.set(
										"background",
										request.outputSpec.background.kind === "transparent"
											? "transparent"
											: "opaque",
									);
									for (const [
										index,
										reference,
									] of request.references.entries()) {
										const bytes = Buffer.from(reference.pngBase64, "base64");
										if (
											bytes.toString("base64") !== reference.pngBase64 ||
											hash(bytes) !== reference.sha256
										)
											throw Error("REFERENCE_HASH_MISMATCH");
										form.append(
											"image[]",
											new Blob([bytes], { type: "image/png" }),
											`reference-${index}.png`,
										);
									}
									const response = await registry.dispatch(
										context,
										binding,
										(_endpoint, key, baseUrl, model) => {
											if (model) form.set("model", model);
											if (
												!baseUrl ||
												!["127.0.0.1", "localhost", "[::1]"].includes(
													new URL(baseUrl).hostname,
												)
											)
												throw Error("REFERENCE_PRODUCTION_BLOCKED");
											if (request.prompt.includes(key))
												throw Error("CREDENTIAL_IN_PROMPT");
											return fetch(
												`${baseUrl.replace(/\/+$/, "")}/images/edits`,
												{
													method: "POST",
													headers: { authorization: `Bearer ${key}` },
													body: form,
													redirect: "error",
													signal: AbortSignal.timeout(120000),
												},
											);
										},
									);
									if (!response.ok || !response.body)
										throw Error("WORKSTATION_PROVIDER_UNCERTAIN");
									const chunks: Uint8Array[] = [];
									let length = 0;
									for await (const chunk of response.body) {
										length += chunk.length;
										if (length > 12582912)
											throw Error("REFERENCE_RESPONSE_TOO_LARGE");
										chunks.push(chunk);
									}
									const raw = Buffer.concat(chunks);
									await writeFile(
										join(directory, `${stem}.provider-response.bin`),
										raw,
										{ flag: "wx", mode: 0o600 },
									);
									const result = z
										.object({
											data: z
												.array(z.object({ b64_json: z.string().min(1) }))
												.length(1),
										})
										.parse(JSON.parse(raw.toString()));
									const pngBase64 = result.data[0]?.b64_json ?? "";
									const bytes = Buffer.from(pngBase64, "base64");
									if (bytes.toString("base64") !== pngBase64)
										throw Error("WORKSTATION_PROVIDER_UNCERTAIN");
									return {
										schemaVersion: 2,
										status: "SUCCEEDED",
										requestId: request.requestId,
										binding: request.binding,
										outputSpecSha256: request.outputSpecSha256,
										pngBase64,
										imageSha256: hash(bytes),
									};
								},
							);
							job = {
								...job,
								state:
									manifest.status === "candidate-unreviewed"
										? "HOLD"
										: "UNKNOWN",
								errorCode:
									manifest.status === "candidate-unreviewed"
										? null
										: "WORKSTATION_PROVIDER_UNCERTAIN",
							};
							await save(join(dir, "terminal.json"), job);
							await rename(join(dir, "terminal.json"), join(dir, "job.json"));
							reply(res, 200, {
								job,
								manifest,
								reviewStatus: "HOLD",
								approval: "NONE",
							});
						} catch (error) {
							job = {
								...job,
								state: "UNKNOWN",
								errorCode: "WORKSTATION_PROVIDER_UNCERTAIN",
							};
							await save(join(dir, "terminal.json"), job);
							await rename(join(dir, "terminal.json"), join(dir, "job.json"));
							throw error;
						}
						return;
					}
					const outputDir = join(dir, "references");
					try {
						const manifest = await generateReferenceSet(
							{
								request: referenceRequestSchema.parse(payload),
								source,
								identity: {
									status: "sealed",
									resultId: sealed.jobId,
									personId: original.personId,
									characterId: original.characterId,
									sourceSha256: source.sha256,
									styleReferenceSha256: payload.styleReferenceSha256,
									faceMode: identityRequest.faceMode,
									imagePath: join(identityDir, "candidate.png"),
									imageSha256: sealed.pngSHA,
								},
								outputDir,
							},
							(request) =>
								dispatchReference(request, {
									directory: outputDir,
									model: registry.dispatch(
										context,
										binding,
										(_endpoint, _key, _url, model) =>
											model ?? defaultProviderModel,
									),
									outbound: (start) =>
										registry.dispatch(
											context,
											binding,
											(_endpoint, key, baseUrl) => {
												if (!baseUrl) throw Error("CONNECTION_NOT_READY");
												return start(key, baseUrl);
											},
										),
								}),
						);
						job = {
							...job,
							state:
								manifest.status === "UNKNOWN"
									? "UNKNOWN"
									: manifest.status === "candidate-unreviewed"
										? "HOLD"
										: "FAILED",
							errorCode:
								manifest.status === "UNKNOWN"
									? "REFERENCE_PROVIDER_UNCERTAIN"
									: null,
						};
						await save(join(dir, "terminal.json"), job);
						await rename(join(dir, "terminal.json"), join(dir, "job.json"));
						reply(res, 200, {
							job,
							manifest,
							reviewStatus: "HOLD",
							approval: "NONE",
						});
					} catch (error) {
						job = {
							...job,
							state: "UNKNOWN",
							errorCode: "REFERENCE_PROVIDER_UNCERTAIN",
						};
						await save(join(dir, "terminal.json"), job);
						await rename(join(dir, "terminal.json"), join(dir, "job.json"));
						throw error;
					}
				} finally {
					reserved -= reservation;
					active.delete(session.id);
				}
				return;
			}
			fail("NOT_FOUND", 404);
		} catch (error) {
			let status = 500,
				code = "INTERNAL_ERROR";
			if (error instanceof OriginalStoreError) {
				code = error.code;
				status =
					code === "IDENTITY_CONFLICT"
						? 409
						: code === "INVALID_INPUT"
							? 422
							: 503;
			} else if (error instanceof WikiError) {
				code = error.code;
				status =
					code === "NOT_FOUND" ? 404 : code === "WIKI_UNAVAILABLE" ? 503 : 502;
			} else if (error instanceof z.ZodError || error instanceof SyntaxError) {
				status = 422;
				code = "INVALID_INPUT";
			} else if (error instanceof Error) {
				if (error.message === "CONNECTION_NOT_FOUND") {
					code = error.message;
					status = 404;
				} else if (error.message === "CONNECTION_NOT_READY") {
					code = error.message;
					status = 409;
				} else if ("code" in error && error.code === "ENOENT") {
					status = 404;
					code = "NOT_FOUND";
				} else if (/^[A-Z][A-Z0-9_]+$/.test(error.message)) {
					code = error.message;
					status =
						"status" in error && typeof error.status === "number"
							? error.status
							: code === "AUTH_NOT_CONFIGURED"
								? 503
								: 400;
				}
			}
			if (!res.headersSent) reply(res, status, { error: { code } });
			else res.destroy();
		}
	});
	let stopMdns: (() => Promise<void>) | undefined;
	const close = async () => {
		closing = true;
		server.emit("jobs-close");
		await stopMdns?.();
		registry.invalidateBoot();
		for (const id of transports.keys()) closeTransport(id);
		await Promise.all(dispatchers);
		await localAi?.close();
		await Promise.all(terminalRejectionWrites.values());
		await Promise.all([...runningBatches.values()].map((row) => row.writes));
		if (!server.listening) {
			characters?.close();
			return;
		}
		return new Promise<void>((resolvePromise, reject) => {
			server.close((error) => {
				characters?.close();
				error ? reject(error) : resolvePromise();
			});
			server.closeIdleConnections();
		});
	};
	return {
		server,
		localAi,
		close,
		listen: async () => {
			const interfaceName = validateLocalBinding(config);
			const ready = once(server, "listening", {
				signal: AbortSignal.timeout(10000),
			});
			server.listen(config.port, config.host);
			await ready;
			const address = server.address();
			if (!address || typeof address === "string") throw Error("INVALID_PORT");
			if (config.mdns && interfaceName) {
				try {
					stopMdns = await startMdns(
						config,
						address.port,
						interfaceName,
						(error) => {
							server.emit("mdns-error", error);
							void close();
						},
					);
				} catch (error) {
					await close();
					throw error;
				}
			}
			return address;
		},
	};
}
