import { createHash, randomUUID } from "node:crypto";
import { link, lstat, open, readFile, rm } from "node:fs/promises";
import { request } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { z } from "zod";
import { validateWorkstationPng } from "../../portrait/2d/generate-character-set.mjs";
import { batchRequestSchema } from "./batches.ts";
import { trainingRequestSchema } from "./training-generation.ts";
import { loadConfig } from "./config.ts";
import { submitEvaluationSchema } from "./evaluations.ts";
import { referenceGenerationRequestSchema } from "./reference-contract.ts";
import {
	localAiArtifactSchema,
	localAiRequestSchema,
} from "./local-ai-jobs.ts";
import {
	referenceValidationInput,
	validateReferenceArtifact,
} from "./reference-validation.ts";
import {
	parseWorkstationRequest,
	referenceKinds,
	referenceRequestSchema,
} from "./references.ts";
import {
	createRemoteClient,
	RemoteClientError,
	remoteServer,
} from "./remote-client.ts";
import {
	registrationSchema,
	registrationSheet,
	sheetFromBytes,
} from "./sources.ts";

export const commandSchema = z.enum([
	"help",
	"discover",
	"ops",
	"config",
	"status",
	"stop",
	"start",
]);
export const remoteCommandSchema = z.enum([
	"people.list",
	"people.get",
	"people.register",
	"sheets.upload",
	"generations.create",
	"generations.get",
	"training-generations.create",
	"training-generations.get",
	"batches.create",
	"batches.get",
	"batches.cancel-pending",
	"jobs.list",
	"jobs.result",
	"jobs.download",
	"evaluations.list",
	"evaluations.append",
	"references.list",
	"references.create",
	"references.get",
	"references.download",
	"workstations.catalog",
	"workstations.list",
	"workstations.create",
	"workstations.get",
	"workstations.history",
	"workstations.result",
	"workstations.download",
	"local-ai.catalog",
	"local-ai.create",
	"local-ai.get",
	"local-ai.download",
]);
export const managementCommandSchema = commandSchema
	.or(z.literal("references.validate"))
	.or(z.enum(["login", "logout"]))
	.or(remoteCommandSchema);
export const inputSchema = z.strictObject({
	envFile: z.string().min(1).optional(),
});
const uuid = z.uuid();
const sha = z.string().regex(/^[a-f0-9]{64}$/);
const personId = z.string().regex(/^person-\d+$/);
const identifier = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/);
const pixel = z.number().int().nonnegative();
const point = z.tuple([pixel, pixel]);
const workstationOutput = z.strictObject({
	schemaVersion: z.literal(2),
	category: z.enum([
		"portrait",
		"fullbody-turntable",
		"torso",
		"detached-head",
		"head-without-hair-eyes-teeth",
		"hair",
		"underwear-only-torso",
	]),
	variant: z.enum([
		"complete",
		"exclude-hair-eyes-teeth",
		"authored-underwear",
	]),
	view: z.enum(["viewer-right", "front", "profile", "side", "back"]),
	frameOrder: pixel.max(3),
	format: z.literal("png"),
	width: z.number().int().positive().max(4096),
	height: z.number().int().positive().max(4096),
	background: z.discriminatedUnion("kind", [
		z.strictObject({
			kind: z.literal("transparent"),
			alpha: z.literal("zero-background"),
		}),
		z.strictObject({
			kind: z.literal("solid"),
			alpha: z.literal("opaque"),
			rgb: z.tuple([pixel.max(255), pixel.max(255), pixel.max(255)]),
		}),
	]),
	alignment: z.strictObject({
		canvasId: identifier,
		coordinates: z.literal("pixels-top-left-x-right-y-down"),
		anchor: point,
		crop: z.tuple([pixel, pixel, pixel, pixel]),
	}),
	featureExclusions: z.array(z.enum(["hair", "eyes", "teeth"])),
});
const workstationRequest = referenceRequestSchema
	.omit({ shots: true })
	.extend({
		schemaVersion: z.literal(2),
		authoredLook: z.strictObject({
			sourceId: identifier,
			lookId: identifier,
			sha256: sha,
		}),
		frames: z
			.array(
				z.strictObject({
					outputSpec: workstationOutput,
					outputSpecSha256: sha,
				}),
			)
			.min(1)
			.max(4),
	})
	.superRefine((value, ctx) => {
		try {
			parseWorkstationRequest(value);
		} catch {
			ctx.addIssue({ code: "custom", message: "INVALID_WORKSTATION_REQUEST" });
		}
	});
const workstationId = inputSchema.extend({ personId, requestId: uuid });
const workstationFrame = workstationId.extend({ frameOrder: pixel.max(3) });
const base64 = (max: number) =>
	z
		.string()
		.max(Math.ceil(max / 3) * 4)
		.refine(
			(value) =>
				value.length > 0 &&
				/^[A-Za-z0-9+/]*={0,2}$/.test(value) &&
				Buffer.from(value, "base64").length <= max &&
				Buffer.from(value, "base64").toString("base64") === value,
		);
export const remoteInputs = {
	"training-generations.create": z.discriminatedUnion("inputMode", [trainingRequestSchema.options[0].extend(inputSchema.shape), trainingRequestSchema.options[1].extend(inputSchema.shape)]),
	"training-generations.get": inputSchema.extend({ requestId: uuid }),
	"local-ai.catalog": inputSchema,
	"local-ai.create": z.union([
		localAiRequestSchema.options[0].extend(inputSchema.shape),
		localAiRequestSchema.options[1].extend(inputSchema.shape),
	]),
	"local-ai.get": inputSchema.extend({ jobId: uuid }),
	"local-ai.download": inputSchema.extend({
		jobId: uuid,
		artifactId: localAiArtifactSchema.shape.id,
		output: z
			.string()
			.min(1)
			.refine((value) =>
				[...value].every((character) => character.charCodeAt(0) >= 32),
			),
	}),
	"workstations.catalog": inputSchema,
	"workstations.list": inputSchema,
	"workstations.history": inputSchema.extend({ personId }),
	"workstations.get": workstationId,
	"workstations.result": workstationFrame,
	"workstations.download": workstationFrame.extend({
		output: z
			.string()
			.min(1)
			.refine((value) =>
				[...value].every((character) => character.charCodeAt(0) >= 32),
			),
	}),
	"workstations.create": inputSchema.extend({
		request: workstationRequest,
		authoredLookBase64: z
			.string()
			.min(1)
			.max(32768)
			.refine(
				(value) => Buffer.from(value, "base64").toString("base64") === value,
			),
	}),
	"people.list": inputSchema.extend({
		q: z.string().max(100).optional(),
		limit: z.number().int().min(1).max(100).optional(),
		cursor: z.number().int().min(0).max(10000).optional(),
	}),
	"people.get": inputSchema.extend({ personId }),
	"references.list": inputSchema,
	"references.create": referenceRequestSchema.extend({
		envFile: z.string().min(1).optional(),
	}),
	"references.get": inputSchema.extend({ requestId: uuid }),
	"references.download": inputSchema.extend({
		requestId: uuid,
		shot: z.enum(referenceKinds),
		output: z.string().min(1),
	}),
	"people.register": registrationSchema.extend({
		envFile: z.string().min(1).optional(),
		requestId: uuid.optional(),
	}),
	"sheets.upload": inputSchema.extend({
		requestId: uuid.optional(),
		detailBase64: base64(1048576),
		tokenBase64: base64(1048576),
		imageBase64: base64(8388608),
	}),
	"generations.create": inputSchema
		.extend({
			requestId: uuid.optional(),
			connectionId: uuid.optional(),
			personId: personId.optional(),
			sheetId: uuid.optional(),
			providerModel: z.literal("gpt-image-2.5-sunburst"),
			size: z.literal("340x510").default("340x510"),
			faceMode: z.strictObject({
				kind: z.literal("unique"),
				variantId: z.null(),
			}),
		})
		.refine((p) => Boolean(p.personId) !== Boolean(p.sheetId))
		.or(referenceGenerationRequestSchema.safeExtend(inputSchema.shape)),
	"generations.get": inputSchema.extend({ jobId: uuid }),
	"batches.create": batchRequestSchema.safeExtend({
		envFile: z.string().min(1).optional(),
	}),
	"batches.get": inputSchema.extend({ batchId: uuid }),
	"batches.cancel-pending": inputSchema.extend({
		batchId: uuid,
		requestId: uuid.optional(),
	}),
	"jobs.list": inputSchema,
	"jobs.result": inputSchema.extend({ jobId: uuid }),
	"jobs.download": inputSchema.extend({
		jobId: uuid,
		output: z.string().min(1),
	}),
	"evaluations.list": inputSchema.extend({ jobId: uuid }),
	"evaluations.append": submitEvaluationSchema.safeExtend({
		envFile: z.string().min(1).optional(),
		jobId: uuid,
	}),
};
export const controlSchema = z.strictObject({
	schema: z.literal("portal-cli-control.v1"),
	port: z.number().int().min(1).max(65535),
	servicePort: z.number().int().min(1).max(65535),
	token: z.string().regex(/^[a-f0-9]{64}$/),
});
const assertionKey = "PORTAL_ACCESS_JWT_ASSERTION";
const stoppedSchema = z.strictObject({ stopped: z.literal(true) });
const healthSchema = z.object({
	mode: z.enum(["local", "hosted", "personal"]),
	ready: z.boolean(),
	missingConfig: z.array(z.string().regex(/^[A-Z][A-Z0-9_]*$/)),
	model: z.literal("gpt-image-2.5-sunburst"),
	charactersReady: z.boolean(),
	generationReady: z.boolean(),
});
export class ManagementError extends Error {
	readonly name = "ManagementError";
	constructor(readonly code: string) {
		super(code);
	}
}
// allow: SIZE_OK - Shared operation/schema data table accounts for the extra lines; execution has one management responsibility.
const definitions = [
	["help", "CLI usage.", "NONE", false],
	["discover", "Capabilities and limits.", "NONE", true],
	["ops", "Operation catalog.", "NONE", true],
	["config", "Redacted configuration.", "NONE", true],
	["status", "Actual portal health.", "NETWORK_READ", true],
	["stop", "Stop owned portal.", "OWNED_SERVICE_STOP", true],
	["start", "Foreground owned portal.", "OWNED_SERVICE_START", false],
	["login", "Bootstrap owner session.", "NETWORK_MUTATION", true],
	["logout", "Revoke owner session.", "NETWORK_MUTATION", true],
] as const;
export const operations = [
	{
		name: "references.validate" as const,
		description:
			"Validate local reference artifact integrity; no approval or dispatch authority.",
		effectClass: "LOCAL_ARTIFACT_READ",
		transports: ["cli", "mcp"],
		inputSchema: z.toJSONSchema(referenceValidationInput),
		annotations: {
			readOnlyHint: true,
			destructiveHint: false,
			idempotentHint: true,
			openWorldHint: false,
		},
	},
	...definitions.map(([name, description, effectClass, mcp]) => ({
		name,
		description,
		effectClass,
		transports: mcp ? ["cli", "mcp"] : ["cli"],
		inputSchema: z.toJSONSchema(
			["help", "discover", "ops"].includes(name)
				? z.strictObject({})
				: inputSchema,
		),
		annotations: {
			readOnlyHint: effectClass === "NONE" || effectClass === "NETWORK_READ",
			destructiveHint: name === "stop",
			idempotentHint: name !== "start",
			openWorldHint: false,
		},
	})),
	...remoteCommandSchema.options.map((name) => {
		const mutation = [
			"people.register",
			"sheets.upload",
			"generations.create",
			"training-generations.create",
			"references.create",
			"workstations.create",
			"batches.create",
			"batches.cancel-pending",
			"evaluations.append",
			"local-ai.create",
		].includes(name);
		const download = name.endsWith(".download");
		return {
			name,
			description: `Remote ${name}.`,
			effectClass: mutation
				? "NETWORK_MUTATION"
				: download
					? "LOCAL_ARTIFACT_WRITE"
					: "NETWORK_READ",
			transports: ["cli", "mcp"],
			inputSchema: z.toJSONSchema(remoteInputs[name]),
			annotations: {
				readOnlyHint: !mutation && !download,
				destructiveHint: name === "batches.cancel-pending",
				idempotentHint: !mutation && !download,
				openWorldHint: false,
			},
		};
	}),
];
export const selfDescription = {
	name: "seoul-dengoku-tools-portal",
	version: "0.1.0",
	schema: "portal-management.v1",
	transports: ["cli", "stdio-mcp"],
	operations,
	exclusions: [
		{
			operation: "start",
			transport: "mcp",
			reason:
				"Foreground CLI owns service lifetime; MCP cannot safely own a detached service.",
		},
	],
	credentials: "Environment-owned only; never tool arguments or results.",
} as const;
type Operation = z.infer<typeof managementCommandSchema> | null;
export type Envelope =
	| {
			readonly ok: true;
			readonly operation: Operation;
			readonly result: object;
	  }
	| {
			readonly ok: false;
			readonly operation: Operation;
			readonly result?: object;
			readonly failures: readonly {
				readonly code: string;
				readonly status?: number;
				readonly requestId?: string;
			}[];
	  };
export function failure(
	operation: Envelope["operation"],
	code: string,
): Envelope {
	return { ok: false, operation, failures: [{ code }] };
}
export function redactError(operation: Envelope["operation"], error: unknown) {
	if (error instanceof RemoteClientError)
		return {
			ok: false as const,
			operation,
			failures: [
				{
					code: error.code,
					...(error.status === undefined ? {} : { status: error.status }),
					...(error.requestId === undefined
						? {}
						: { requestId: error.requestId }),
				},
			],
		};
	return failure(
		operation,
		error instanceof ManagementError || error instanceof RemoteClientError
			? error.code
			: "PORTAL_MANAGEMENT_FAILED",
	);
}
type RemoteFields = Record<string, unknown> & {
	artifactId?: unknown;
	request?: unknown;
	frameOrder?: unknown;
	envFile?: unknown;
	personId?: unknown;
	jobId?: unknown;
	batchId?: unknown;
	requestId?: unknown;
	shot?: unknown;
	evaluationId?: unknown;
	output?: unknown;
	detailBase64?: unknown;
	tokenBase64?: unknown;
	imageBase64?: unknown;
};
async function invokeRemote(
	operation: z.infer<typeof remoteCommandSchema>,
	input: RemoteFields,
	client: ReturnType<typeof createRemoteClient>,
	signal?: AbortSignal,
): Promise<Envelope> {
	const { envFile: _envFile, ...fields } = input;
	let result: unknown;
	switch (operation) {
		case "local-ai.catalog":
			result = await client.read("/api/local-ai/catalog", signal);
			break;
		case "local-ai.create":
			result = await client.mutate("/api/local-ai/jobs", fields, signal);
			break;
		case "local-ai.get":
			result = await client.read(`/api/local-ai/jobs/${fields.jobId}`, signal);
			break;
		case "local-ai.download": {
			const output = resolve(String(fields.output));
			try {
				if (!(await lstat(dirname(output))).isDirectory())
					throw new ManagementError("INVALID_OUTPUT_PATH");
			} catch (error) {
				if (
					error instanceof Error &&
					"code" in error &&
					error.code === "ENOENT"
				)
					throw new ManagementError("INVALID_OUTPUT_PATH");
				throw error;
			}
			const route = `/api/local-ai/jobs/${fields.jobId}`;
			const parsed = z
				.object({
					job: z.object({
						id: uuid,
						request: localAiRequestSchema,
						state: z.literal("succeeded"),
						artifacts: z.array(localAiArtifactSchema),
					}),
				})
				.safeParse(await client.read(route, signal));
			if (
				!parsed.success ||
				parsed.data.job.id !== fields.jobId ||
				parsed.data.job.request.requestId !== fields.jobId
			)
				throw new RemoteClientError("INVALID_RESPONSE");
			const artifact = parsed.data.job.artifacts.find(
				(item) => item.id === fields.artifactId,
			);
			if (!artifact) throw new RemoteClientError("ARTIFACT_NOT_FOUND", 404);
			const bytes = await client.read(
				`${route}/artifacts/${artifact.id}`,
				signal,
				artifact,
			);
			if (!(bytes instanceof Uint8Array))
				throw new RemoteClientError("INVALID_RESPONSE");
			const temporary = `${output}.${randomUUID()}.tmp`;
			try {
				const file = await open(temporary, "wx", 0o600);
				try {
					await file.writeFile(bytes);
					await file.sync();
				} finally {
					await file.close();
				}
				try {
					await link(temporary, output);
				} catch (error) {
					if (
						error instanceof Error &&
						"code" in error &&
						error.code === "EEXIST"
					)
						throw new ManagementError("OUTPUT_EXISTS");
					throw error;
				}
			} finally {
				await rm(temporary, { force: true });
			}
			result = {
				jobId: fields.jobId,
				artifactId: artifact.id,
				output: fields.output,
				sha256: artifact.sha256,
				bytes: bytes.length,
			};
			break;
		}
		case "workstations.catalog":
		case "workstations.list":
		case "workstations.history":
		case "workstations.get":
		case "workstations.result": {
			const route =
				operation === "workstations.catalog"
					? "/catalog"
					: operation === "workstations.list"
						? ""
						: `/${fields.personId}/${operation === "workstations.history" ? "history" : fields.requestId}${operation === "workstations.result" ? `/frames/${fields.frameOrder}/result` : ""}`;
			result = await client.read(`/api/v2/workstations${route}`, signal);
			break;
		}
		case "workstations.create": {
			const request = parseWorkstationRequest(fields.request);
			try {
				result = await client.mutate(
					"/api/v2/workstations",
					{ ...fields, requestId: request.requestId },
					signal,
					"POST",
					false,
				);
				result = z
					.object({
						job: z.looseObject({ id: uuid, state: z.string() }),
						reviewStatus: z.literal("HOLD"),
						approval: z.literal("NONE"),
					})
					.parse(result);
			} catch (error) {
				if (error instanceof RemoteClientError && error.status === 503)
					return {
						ok: false,
						operation,
						result: { state: "BLOCKED", reason: error.code },
						failures: [
							{ code: "BLOCKED", status: 503, requestId: request.requestId },
						],
					};
				throw error;
			}
			break;
		}
		case "people.list": {
			const query = new URLSearchParams(
				Object.entries(fields).map(([key, value]): [string, string] => [
					key,
					String(value),
				]),
			);
			result = await client.read(
				`/api/wiki/people${query.size ? `?${query}` : ""}`,
				signal,
			);
			break;
		}
		case "people.get":
			result = await client.read(`/api/wiki/people/${fields.personId}`, signal);
			break;
		case "references.list":
			result = await client.read("/api/references", signal);
			break;
		case "references.get":
			result = await client.read(`/api/references/${fields.requestId}`, signal);
			break;
		case "references.create":
			result = await client.mutate("/api/references", fields, signal);
			break;
		case "generations.get":
			result = await client.read(
				`/api/jobs/${fields.jobId}/inspection`,
				signal,
			);
			break;
		case "training-generations.get":
			result = await client.read(`/api/training-generations/${fields.requestId}`, signal);
			break;
		case "training-generations.create":
			result = await client.mutate("/api/training-generations", fields, signal);
			break;
		case "batches.get":
			result = await client.read(`/api/batches/${fields.batchId}`, signal);
			break;
		case "jobs.list":
			result = await client.read("/api/jobs", signal);
			break;
		case "jobs.result":
			result = await client.read(`/api/jobs/${fields.jobId}/result`, signal);
			break;
		case "evaluations.list":
			result = await client.read(
				`/api/jobs/${fields.jobId}/evaluations`,
				signal,
			);
			break;
		case "generations.create":
			result = await client.mutate("/api/generations", fields, signal);
			break;
		case "batches.create":
			result = await client.mutate(
				"/api/batches",
				{ ...fields, requestId: fields.batchId },
				signal,
				"POST",
				false,
			);
			break;
		case "batches.cancel-pending":
			result = await client.mutate(
				`/api/batches/${fields.batchId}/cancel-pending`,
				{ requestId: fields.requestId },
				signal,
				"POST",
				false,
			);
			break;
		case "evaluations.append": {
			const { jobId, ...payload } = fields;
			result = await client.mutate(
				`/api/jobs/${jobId}/evaluations`,
				{ ...payload, requestId: payload.evaluationId },
				signal,
				"POST",
				false,
			);
			break;
		}
		case "people.register":
		case "sheets.upload": {
			fields.requestId ??= randomUUID();
			try {
				if (operation === "people.register") {
					const { requestId: _requestId, ...registration } = fields;
					registrationSheet(registrationSchema.parse(registration));
				} else
					sheetFromBytes(
						Buffer.from(String(fields.detailBase64), "base64"),
						Buffer.from(String(fields.tokenBase64), "base64"),
						Buffer.from(String(fields.imageBase64), "base64"),
					);
			} catch {
				throw new ManagementError("INVALID_PARAMS");
			}
			result = await client.mutate(
				operation === "people.register"
					? "/api/characters/register"
					: "/api/sheets",
				fields,
				signal,
				"POST",
				false,
			);
			const hashes = z
				.object({
					sourceHashes: z.strictObject({ detail: sha, token: sha, image: sha }),
				})
				.parse(result).sourceHashes;
			for (const [key, field] of [
				["detail", "detailBase64"],
				["token", "tokenBase64"],
				["image", "imageBase64"],
			] as const)
				if (
					hashes[key] !==
					createHash("sha256")
						.update(Buffer.from(String(fields[field]), "base64"))
						.digest("hex")
				)
					throw new RemoteClientError(
						"SOURCE_HASH_MISMATCH",
						undefined,
						String(fields.requestId),
					);
			break;
		}
		case "jobs.download":
		case "workstations.download":
		case "references.download": {
			const output = resolve(String(fields.output));
			if (operation === "workstations.download") {
				try {
					if (!(await lstat(dirname(output))).isDirectory())
						throw Error("directory");
				} catch {
					throw new ManagementError("INVALID_OUTPUT_PATH");
				}
			}
			try {
				await lstat(output);
				throw new ManagementError("OUTPUT_EXISTS");
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
			const reference = operation === "references.download";
			const workstation = operation === "workstations.download";
			const route = workstation
				? `/api/v2/workstations/${fields.personId}/${fields.requestId}/frames/${fields.frameOrder}`
				: reference
					? `/api/references/${fields.requestId}/${fields.shot}`
					: `/api/jobs/${fields.jobId}`;
			const metadata = await client.read(`${route}/result`, signal);
			let workstationBinding:
				| {
						requestId: string;
						childRequestId: string;
						frameOrder: number;
						receiptSHA: string;
						pngSHA: string;
						imageUrl: string;
				  }
				| undefined;
			let outputSpec:
				| ReturnType<
						typeof parseWorkstationRequest
				  >["frames"][number]["outputSpec"]
				| undefined;
			if (workstation) {
				const data = z
					.object({
						job: z.object({ id: uuid }),
						request: workstationRequest,
						index: z.array(
							z.object({
								personId,
								parentRequestId: uuid,
								childRequestId: uuid,
								frameOrder: pixel.max(3),
								receiptSHA: sha,
								pngSHA: sha,
								outputSpecSha256: sha,
							}),
						),
					})
					.safeParse(metadata);
				if (!data.success) throw new RemoteClientError("INVALID_RESPONSE");
				const frame = data.data.index.find(
					(row) => row.frameOrder === fields.frameOrder,
				);
				const spec = data.data.request.frames[Number(fields.frameOrder)];
				if (
					!frame ||
					!spec ||
					data.data.job.id !== fields.requestId ||
					data.data.request.requestId !== fields.requestId ||
					data.data.request.personId !== fields.personId ||
					frame.parentRequestId !== fields.requestId ||
					frame.personId !== fields.personId ||
					frame.outputSpecSha256 !== spec.outputSpecSha256
				)
					throw new RemoteClientError("INVALID_RESPONSE");
				outputSpec = parseWorkstationRequest(data.data.request).frames[
					Number(fields.frameOrder)
				]?.outputSpec;
				workstationBinding = {
					...frame,
					requestId: frame.parentRequestId,
					imageUrl: `/tools${route}/image`,
				};
			}
			const parsed = workstationBinding
				? { success: true as const, data: { result: workstationBinding } }
				: reference
					? z
							.object({
								result: z.strictObject({
									requestId: uuid,
									childRequestId: uuid,
									shot: z.enum(referenceKinds),
									receiptSHA: sha,
									pngSHA: sha,
									imageUrl: z.string(),
								}),
							})
							.safeParse(metadata)
					: z
							.object({
								result: z.object({
									jobId: uuid,
									pngSHA: sha,
									imageUrl: z.string(),
								}),
							})
							.safeParse(metadata);
			if (!parsed.success) throw new RemoteClientError("INVALID_RESPONSE");
			const binding = parsed.data.result;
			if (
				(reference || workstation
					? !("requestId" in binding) ||
						binding.requestId !== fields.requestId ||
						(reference &&
							(!("shot" in binding) || binding.shot !== fields.shot))
					: !("jobId" in binding) || binding.jobId !== fields.jobId) ||
				binding.imageUrl !== `/tools${route}/image`
			)
				throw new RemoteClientError("INVALID_RESPONSE");
			const bytes = await client.read(`${route}/image`, signal, true);
			if (!(bytes instanceof Uint8Array))
				throw new RemoteClientError("INVALID_RESPONSE");
			if (createHash("sha256").update(bytes).digest("hex") !== binding.pngSHA)
				throw new RemoteClientError("RESULT_HASH_MISMATCH");
			if (outputSpec) {
				try {
					validateWorkstationPng(Buffer.from(bytes), outputSpec);
				} catch {
					throw new RemoteClientError("INVALID_PNG");
				}
			}
			const temporary = `${output}.${randomUUID()}.tmp`;
			try {
				const file = await open(temporary, "wx", 0o600);
				try {
					await file.writeFile(bytes);
					await file.sync();
				} finally {
					await file.close();
				}
				try {
					await link(temporary, output);
				} catch (error) {
					if (
						error instanceof Error &&
						"code" in error &&
						error.code === "EEXIST"
					)
						throw new ManagementError("OUTPUT_EXISTS");
					throw error;
				}
			} finally {
				await rm(temporary, { force: true });
			}
			result = {
				...("requestId" in binding
					? {
							requestId: binding.requestId,
							childRequestId: binding.childRequestId,
							...("shot" in binding
								? { shot: binding.shot }
								: { personId: fields.personId, frameOrder: fields.frameOrder }),
							receiptSHA: binding.receiptSHA,
						}
					: { jobId: binding.jobId }),
				output: fields.output,
				pngSHA: binding.pngSHA,
				bytes: bytes.length,
			};
			break;
		}
	}
	if (!result || typeof result !== "object")
		throw new RemoteClientError("INVALID_RESPONSE");
	return outcome(operation, result);
}
export async function managementContext(input: z.infer<typeof inputSchema>) {
	const env = {
		...(input.envFile
			? parseEnv(await readFile(resolve(input.envFile), "utf8"))
			: {}),
		...process.env,
	};
	const publicPathKey = "PORTAL_PUBLIC_PATH",
		tokensPathKey = "PORTAL_TOKENS_PATH";
	const config = loadConfig({
		...env,
		PORTAL_PUBLIC_PATH:
			env[publicPathKey] ||
			fileURLToPath(new URL("./public/", import.meta.url)),
		PORTAL_TOKENS_PATH:
			env[tokensPathKey] ||
			fileURLToPath(new URL("./public/tokens.css", import.meta.url)),
	});
	return {
		env,
		config,
		controlPath: config.storagePath
			? resolve(config.storagePath, ".portal-cli.json")
			: null,
	};
}
async function httpJson(
	target: {
		readonly port: number;
		readonly host: string;
		readonly path: string;
		readonly headers?: Readonly<Record<string, string>>;
	},
	signal?: AbortSignal,
): Promise<unknown> {
	const response = await new Promise<import("node:http").IncomingMessage>(
		(done, reject) => {
			const req = request(
				{
					...target,
					method: target.path === "/stop" ? "POST" : "GET",
					signal: AbortSignal.any([
						...(signal ? [signal] : []),
						AbortSignal.timeout(5000),
					]),
				},
				done,
			);
			req.once("error", reject);
			req.end();
		},
	);
	const chunks: Buffer[] = [];
	let bytes = 0;
	for await (const chunk of response) {
		const buffer = Buffer.from(chunk);
		bytes += buffer.length;
		if (bytes > 65536) throw new ManagementError("INVALID_RESPONSE");
		chunks.push(buffer);
	}
	if (response.statusCode !== 200)
		throw new ManagementError("HTTP_STATUS_FAILED");
	return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
function outcome(
	operation: Envelope["operation"],
	result: object,
	ready = true,
): Envelope {
	return ready
		? { ok: true, operation, result }
		: {
				ok: false,
				operation,
				result,
				failures: [{ code: "CONFIG_NOT_READY" }],
			};
}
export async function invokeManagement(
	name: unknown,
	rawInput: unknown = {},
	signal?: AbortSignal,
): Promise<Envelope> {
	const command = managementCommandSchema.safeParse(name);
	if (!command.success) return failure(null, "INVALID_COMMAND");
	const operation = command.data;
	const remote = remoteCommandSchema.safeParse(operation);
	const schema =
		operation === "references.validate"
			? referenceValidationInput
			: remote.success
				? remoteInputs[remote.data]
				: ["help", "discover", "ops"].includes(operation)
					? z.strictObject({})
					: inputSchema;
	const input = schema.safeParse(rawInput);
	if (!input.success) return failure(operation, "INVALID_PARAMS");
	try {
		if (operation === "references.validate") {
			const result = await validateReferenceArtifact(
				referenceValidationInput.parse(input.data),
			);
			return result.verdict === "VALID"
				? outcome(operation, result)
				: { ok: false, operation, result, failures: [{ code: result.code }] };
		}
		if (remote.success) {
			const data = input.data as RemoteFields;
			const env = {
				...(data.envFile
					? parseEnv(await readFile(resolve(String(data.envFile)), "utf8"))
					: {}),
				...process.env,
			};
			const serverKey = "SSSTOOL_SERVER_URL",
				stateKey = "SSSTOOL_STATE_DIRECTORY";
			if (!env[serverKey]) return failure(operation, "REMOTE_SERVER_REQUIRED");
			return await invokeRemote(
				remote.data,
				data,
				createRemoteClient({
					serverUrl: env[serverKey],
					local: env["PORTAL_MODE"] === "local",
					...(env[stateKey] ? { stateDirectory: env[stateKey] } : {}),
				}),
				signal,
			);
		}
		switch (operation) {
			case "help":
				return outcome(operation, {
					usage: "node cli.mjs <command> [--env-file PATH] [--format json]",
					operations,
				});
			case "discover":
				return { ok: true, operation, result: selfDescription };
			case "ops":
				return { ok: true, operation, result: { operations } };
			case "start":
				return failure(operation, "CLI_FOREGROUND_ONLY");
			case "config":
			case "status":
			case "stop":
			case "login":
			case "logout":
				break;
			default: {
				return failure(operation, "INVALID_COMMAND");
			}
		}
		const clientInput = inputSchema.parse(input.data);
		const clientEnv = {
			...(clientInput.envFile
				? parseEnv(await readFile(resolve(clientInput.envFile), "utf8"))
				: {}),
			...process.env,
		};
		const serverUrlKey = "SSSTOOL_SERVER_URL";
		const serverUrl = clientEnv[serverUrlKey];
		if (serverUrl) {
			const local = clientEnv["PORTAL_MODE"] === "local";
			const server = remoteServer(serverUrl, local);
			if (operation === "config")
				return outcome(operation, { mode: "remote", server: server.href });
			if (!["status", "login", "logout"].includes(operation))
				throw new ManagementError("REMOTE_LIFECYCLE_NOT_OWNED");
			const stateDirectoryKey = "SSSTOOL_STATE_DIRECTORY";
			const stateDirectory = clientEnv[stateDirectoryKey];
			const client = createRemoteClient({
				serverUrl: server.href,
				local,
				...(stateDirectory ? { stateDirectory } : {}),
			});
			if (operation === "login") {
				const session = await client.bootstrap(signal);
				return outcome(operation, {
					authenticated: true,
					connection: session.connection,
				});
			}
			if (operation === "logout") {
				await client.logout(signal);
				return outcome(operation, { authenticated: false });
			}
			const result = healthSchema.parse(
				await client.read("/api/status", signal),
			);
			return outcome(operation, result, result.ready);
		}
		const { env, config, controlPath } = await managementContext(clientInput);
		switch (operation) {
			case "config":
				return outcome(
					operation,
					{
						mode: config.mode,
						ready: config.ready,
						missingConfig: config.missing,
						port: config.port,
						networkAccess: config.networkAccess,
						mdns: config.mdns,
					},
					config.ready,
				);
			case "status": {
				const port =
					config.port ||
					(controlPath
						? controlSchema.parse(
								JSON.parse(await readFile(controlPath, "utf8")),
							).servicePort
						: 0);
				const assertion = env[assertionKey];
				const headers =
					assertion && config.publicOrigin
						? {
								host: new URL(config.publicOrigin).host,
								"cf-access-jwt-assertion": assertion,
							}
						: undefined;
				const target = {
					port,
					host: config.host,
					path: `${config.basePath}/api/status`,
					...(headers ? { headers } : {}),
				};
				const result = healthSchema.parse(await httpJson(target, signal));
				return outcome(operation, result, result.ready);
			}
			case "stop": {
				if (!controlPath) throw new ManagementError("STORAGE_NOT_CONFIGURED");
				const control = controlSchema.parse(
					JSON.parse(await readFile(controlPath, "utf8")),
				);
				const result = stoppedSchema.parse(
					await httpJson(
						{
							host: "127.0.0.1",
							port: control.port,
							path: "/stop",
							headers: { authorization: `Bearer ${control.token}` },
						},
						signal,
					),
				);
				return { ok: true, operation, result };
			}
			case "login":
			case "logout":
				return failure(operation, "REMOTE_SERVER_REQUIRED");
			default: {
				return failure(operation, "INVALID_COMMAND");
			}
		}
	} catch (error) {
		return redactError(operation, error);
	}
}
