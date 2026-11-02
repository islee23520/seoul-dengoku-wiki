import { createHash } from "node:crypto";
import { z } from "zod";
import { measurePng } from "./png.ts";
import { sourceAcquisitionSchema } from "./reference-contract.ts";
import { transformReferencePng } from "./reference-transform.ts";

const sha = z.string().regex(/^[a-f0-9]{64}$/);
export const referenceBytesSHA256 = (bytes: Uint8Array | string) =>
	createHash("sha256").update(bytes).digest("hex");

// Hash the JSON value, not object insertion order. These are integrity records,
// not signatures or evidence of owner approval.
export function referenceRecordSHA256(value: unknown): string {
	const canonical = (item: unknown): string => {
		if (Array.isArray(item)) return `[${item.map(canonical).join(",")}]`;
		if (item !== null && typeof item === "object")
			return `{${Object.entries(item)
				.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
				.map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
				.join(",")}}`;
		const result = JSON.stringify(item);
		if (result === undefined) throw Error("REFERENCE_RECORD_INVALID");
		return result;
	};
	return referenceBytesSHA256(canonical(value));
}
export type ReferenceRecord<T> = { value: T; sha256: string };
export function referenceRecord<T>(value: T): ReferenceRecord<T> {
	return {
		value: structuredClone(value),
		sha256: referenceRecordSHA256(value),
	};
}
export function verifyReferenceRecord<T>(record: ReferenceRecord<T>): boolean {
	return record.sha256 === referenceRecordSHA256(record.value);
}

export function createReferenceManifest(
	input: unknown,
	target: "original" | "canonical" | "native" = "original",
) {
	const acquired = sourceAcquisitionSchema.parse(input);
	if (acquired.status !== "acquired") throw Error("REFERENCE_NOT_ACQUIRED");
	const g = acquired.generation;
	const image = g.recipientImage;
	const token = z
		.object({
			personId: z.string(),
			characterId: z.string(),
			image: z.object({ sha256: sha }),
		})
		.parse(
			JSON.parse(
				new TextDecoder("utf-8", { fatal: true }).decode(g.tokenBytes),
			),
		);
	const dimensions = measurePng(image.bytes);
	if (
		g.personId !== image.personId ||
		g.characterId !== image.characterId ||
		token.personId !== g.personId ||
		token.characterId !== g.characterId ||
		token.image.sha256 !== image.sourceSHA256 ||
		referenceBytesSHA256(g.tokenBytes) !== g.tokenSHA256 ||
		referenceBytesSHA256(image.bytes) !== image.sourceSHA256 ||
		dimensions.width !== image.width ||
		dimensions.height !== image.height
	)
		throw Error("REFERENCE_BINDING_MISMATCH");
	const transformed =
		target === "original" ? null : transformReferencePng(image.bytes, target);
	const imageBytes = new Uint8Array(transformed?.rgbaBytes ?? image.bytes);
	const value = {
		kind: "ReferenceManifest" as const,
		schemaVersion: 1 as const,
		personId: g.personId,
		characterId: g.characterId,
		sourceSHA256: image.sourceSHA256,
		tokenSHA256: g.tokenSHA256,
		sourceWidth: image.width,
		sourceHeight: image.height,
		role: "source-preservation" as const,
		analysisImage: {
			index: 1 as const,
			target,
			sha256: referenceBytesSHA256(imageBytes),
			width: transformed?.receipt.width ?? image.width,
			height: transformed?.receipt.height ?? image.height,
			transform: transformed?.receipt ?? null,
			crop: null,
		},
	};
	return { manifest: referenceRecord(value), imageBytes };
}
export type ReferenceManifest = ReturnType<
	typeof createReferenceManifest
>["manifest"];

const region = z.strictObject({
	x: z.number().min(0).max(1),
	y: z.number().min(0).max(1),
	width: z.number().positive().max(1),
	height: z.number().positive().max(1),
});
export const referenceObservationSchema = z.strictObject({
	fields: z
		.array(
			z.strictObject({
				field: z.enum([
					"person.face",
					"person.hair",
					"outfit.upper",
					"outfit.upper.color",
					"composition.pose",
					"composition.framing",
					"composition.gaze",
				]),
				status: z.enum(["observed", "ambiguous", "not-visible"]),
				value: z.string().min(1).max(2000).nullable(),
				region: region.nullable(),
				cues: z.array(z.string().min(1).max(500)).max(20),
			}),
		)
		.min(1)
		.max(7),
});
export const REFERENCE_ANALYSIS_PROMPT =
	"Describe only visible evidence in image 1. Do not prescribe edits, infer hidden features, or treat tokens as observations. For each field use observed, ambiguous, or not-visible; uncertain values must be null. Cite visible cues and optional normalized image-space regions. Gaze fixation is ambiguous unless visible evidence resolves it. Coordinates and valid JSON do not establish accuracy or approval.";
export const REFERENCE_ANALYSIS_SCHEMA = z.toJSONSchema(
	referenceObservationSchema,
);

const qualificationSchema = z.strictObject({
	kind: z.literal("live-cpa-capability"),
	endpoint: z.url(),
	requestedModel: z.string().min(1),
	returnedModel: z.string().min(1),
	modelSnapshot: z.string().min(1).nullable(),
	modelsResponseSHA256: sha,
	capabilityRequestSHA256: sha,
	capabilityResponseSHA256: sha,
	imageInput: z.literal(true),
	structuredOutput: z.literal(true),
	independentReview: z.literal("pass"),
	reviewReceiptSHA256: sha,
});
export type AnalysisQualification = z.infer<typeof qualificationSchema>;
const parameter = z.union([
	z.strictObject({ state: z.literal("unspecified") }),
	z.strictObject({ state: z.literal("specified"), value: z.number() }),
]);
const attemptSchema = z.strictObject({
	endpoint: z.url(),
	requestedModel: z.string().min(1),
	returnedModel: z.string().min(1).nullable(),
	modelSnapshot: z.string().min(1).nullable(),
	imageSHA256: sha,
	promptSHA256: sha,
	schemaSHA256: sha,
	requestSHA256: sha,
	responseSHA256: sha,
	detail: z.enum(["unspecified", "auto", "low", "high"]),
	parameters: z.strictObject({
		temperature: parameter,
		seed: parameter,
		topP: parameter,
	}),
	status: z.enum(["completed", "failed", "refusal"]),
	// The route adapter supplies the exact location in its real response envelope.
	// No model/endpoint-specific response format is invented here.
	observationPointer: z.array(
		z.union([z.string(), z.number().int().nonnegative()]),
	),
});
export type ReferenceAnalysisAttempt = z.infer<typeof attemptSchema>;
// Candidate wire contract only. Building this request does not assert that the
// selected CPA route supports images or strict structured output, nor send it.
export function buildReferenceAnalysisRequest(input: {
	manifest: ReferenceManifest;
	imageBytes: Uint8Array;
	endpoint: string;
	requestedModel: string;
	detail: ReferenceAnalysisAttempt["detail"];
}) {
	const endpoint = new URL(input.endpoint);
	if (
		endpoint.username ||
		endpoint.password ||
		endpoint.search ||
		endpoint.hash ||
		!endpoint.pathname.endsWith("/chat/completions")
	)
		throw Error("ANALYSIS_ENDPOINT_INVALID");
	if (!input.requestedModel.trim()) throw Error("ANALYSIS_MODEL_REQUIRED");
	if (
		!verifyReferenceRecord(input.manifest) ||
		referenceBytesSHA256(input.imageBytes) !==
			input.manifest.value.analysisImage.sha256
	)
		throw Error("ANALYSIS_BINDING_MISMATCH");
	const image = measurePng(input.imageBytes);
	if (
		image.width !== input.manifest.value.analysisImage.width ||
		image.height !== input.manifest.value.analysisImage.height
	)
		throw Error("ANALYSIS_BINDING_MISMATCH");
	const body = {
		model: input.requestedModel,
		messages: [
			{
				role: "user",
				content: [
					{ type: "text", text: REFERENCE_ANALYSIS_PROMPT },
					{
						type: "image_url",
						image_url: {
							url: `data:image/png;base64,${Buffer.from(input.imageBytes).toString("base64")}`,
							...(input.detail === "unspecified"
								? {}
								: { detail: input.detail }),
						},
					},
				],
			},
		],
		response_format: {
			type: "json_schema",
			json_schema: {
				name: "reference_observation_v1",
				strict: true,
				schema: REFERENCE_ANALYSIS_SCHEMA,
			},
		},
		stream: false,
		tool_choice: "none",
	};
	const requestBytes = new TextEncoder().encode(JSON.stringify(body));
	return {
		requestBytes,
		provenance: {
			endpoint: endpoint.href,
			requestedModel: input.requestedModel,
			imageSHA256: input.manifest.value.analysisImage.sha256,
			promptSHA256: referenceBytesSHA256(REFERENCE_ANALYSIS_PROMPT),
			schemaSHA256: referenceRecordSHA256(REFERENCE_ANALYSIS_SCHEMA),
			requestSHA256: referenceBytesSHA256(requestBytes),
			detail: input.detail,
			parameters: {
				temperature: { state: "unspecified" },
				seed: { state: "unspecified" },
				topP: { state: "unspecified" },
			},
			observationPointer: ["choices", 0, "message", "content"],
		} satisfies Omit<
			ReferenceAnalysisAttempt,
			"returnedModel" | "modelSnapshot" | "responseSHA256" | "status"
		>,
		qualification: "UNQUALIFIED" as const,
		wireParameters: {
			maxCompletionTokens: "unspecified",
			stream: false,
			toolChoice: "none",
			reasoningEffort: "unspecified",
		} as const,
	};
}
export type ObservationReceipt = ReferenceRecord<{
	kind: "ObservationReceipt";
	schemaVersion: 1;
	referenceManifestSHA256: string;
	sourceSHA256: string;
	status: "UNQUALIFIED" | "ATTRIBUTED" | "HOLD" | "UNATTRIBUTED";
	reason: string;
	qualification: AnalysisQualification | null;
	attempt: ReferenceAnalysisAttempt | null;
	modelAttestation: "MATCH" | "MISMATCH" | "NOT_EXPOSED" | "NOT_REQUESTED";
	modelSnapshotStatus: "EXPOSED" | "NOT_EXPOSED";
	finishReason: string | null;
	usage: {
		promptTokens: number | null;
		completionTokens: number | null;
		totalTokens: number | null;
	} | null;
	observation: z.infer<typeof referenceObservationSchema> | null;
	legacySHA256: string | null;
	accuracy: "NOT_ESTABLISHED";
	authorizesEdits: false;
	ownerApproval: "NONE";
}>;

// Pure recorder: transport, credentials, model discovery and live qualification
// belong to the CPA adapter. Absence of that evidence is never vision success.
export function recordReferenceObservation(input: {
	manifest: ReferenceManifest;
	attempt?: unknown;
	requestBytes?: Uint8Array;
	responseBytes?: Uint8Array;
	qualification?: unknown;
	legacyBytes?: Uint8Array;
}): ObservationReceipt {
	const value: ObservationReceipt["value"] = {
		kind: "ObservationReceipt",
		schemaVersion: 1,
		referenceManifestSHA256: input.manifest.sha256,
		sourceSHA256: input.manifest.value.sourceSHA256,
		status: "UNQUALIFIED",
		reason: "ANALYSIS_UNQUALIFIED",
		qualification: null,
		attempt: null,
		modelAttestation: "NOT_REQUESTED",
		modelSnapshotStatus: "NOT_EXPOSED",
		finishReason: null,
		usage: null,
		observation: null,
		legacySHA256: null,
		accuracy: "NOT_ESTABLISHED",
		authorizesEdits: false,
		ownerApproval: "NONE",
	};
	const hold = (reason: string) =>
		referenceRecord({ ...value, status: "HOLD" as const, reason });
	if (!verifyReferenceRecord(input.manifest))
		return hold("REFERENCE_MANIFEST_TAMPERED");
	if (input.legacyBytes !== undefined) {
		if (input.attempt !== undefined) return hold("ANALYSIS_INPUT_AMBIGUOUS");
		return referenceRecord({
			...value,
			status: "UNATTRIBUTED" as const,
			reason: "LEGACY_UNATTRIBUTED",
			legacySHA256: referenceBytesSHA256(input.legacyBytes),
		});
	}
	if (input.attempt === undefined) return referenceRecord(value);
	const parsed = attemptSchema.safeParse(input.attempt);
	if (!parsed.success) return hold("ANALYSIS_MALFORMED");
	const a = parsed.data;
	value.attempt = a;
	value.modelSnapshotStatus =
		a.modelSnapshot === null ? "NOT_EXPOSED" : "EXPOSED";
	value.modelAttestation =
		a.returnedModel === null
			? "NOT_EXPOSED"
			: a.returnedModel === a.requestedModel
				? "MATCH"
				: "MISMATCH";
	const endpoint = new URL(a.endpoint);
	if (
		endpoint.username ||
		endpoint.password ||
		endpoint.search ||
		endpoint.hash
	)
		return hold("ANALYSIS_ENDPOINT_INVALID");
	if (
		!input.requestBytes ||
		!input.responseBytes ||
		a.requestSHA256 !== referenceBytesSHA256(input.requestBytes) ||
		a.responseSHA256 !== referenceBytesSHA256(input.responseBytes) ||
		a.imageSHA256 !== input.manifest.value.analysisImage.sha256 ||
		a.promptSHA256 !== referenceBytesSHA256(REFERENCE_ANALYSIS_PROMPT) ||
		a.schemaSHA256 !== referenceRecordSHA256(REFERENCE_ANALYSIS_SCHEMA)
	)
		return hold("ANALYSIS_BINDING_MISMATCH");
	if (a.status !== "completed")
		return hold(
			a.status === "refusal" ? "ANALYSIS_REFUSED" : "ANALYSIS_FAILED",
		);
	if (value.modelAttestation === "MISMATCH")
		return hold("ANALYSIS_MODEL_MISMATCH");
	let decoded: unknown;
	try {
		const request = JSON.parse(
			new TextDecoder("utf-8", { fatal: true }).decode(input.requestBytes),
		);
		const url = request?.messages?.[0]?.content?.[1]?.image_url?.url;
		if (typeof url !== "string" || !url.startsWith("data:image/png;base64,"))
			return hold("ANALYSIS_BINDING_MISMATCH");
		const built = buildReferenceAnalysisRequest({
			manifest: input.manifest,
			imageBytes: Buffer.from(url.slice(22), "base64"),
			endpoint: a.endpoint,
			requestedModel: a.requestedModel,
			detail: a.detail,
		});
		if (
			built.provenance.requestSHA256 !== a.requestSHA256 ||
			referenceRecordSHA256(built.provenance.parameters) !==
				referenceRecordSHA256(a.parameters) ||
			referenceRecordSHA256(built.provenance.observationPointer) !==
				referenceRecordSHA256(a.observationPointer)
		)
			return hold("ANALYSIS_BINDING_MISMATCH");
		decoded = JSON.parse(
			new TextDecoder("utf-8", { fatal: true }).decode(input.responseBytes),
		);
		const envelope = z
			.object({
				model: z.string().min(1).optional(),
				model_snapshot: z.string().min(1).optional(),
				choices: z
					.array(
						z.object({
							finish_reason: z.string(),
							message: z.object({
								refusal: z.string().nullable().optional(),
								content: z.string().nullable(),
							}),
						}),
					)
					.length(1),
				usage: z
					.object({
						prompt_tokens: z.number().int().nonnegative().optional(),
						completion_tokens: z.number().int().nonnegative().optional(),
						total_tokens: z.number().int().nonnegative().optional(),
					})
					.optional(),
			})
			.safeParse(decoded);
		if (!envelope.success) return hold("ANALYSIS_MALFORMED");
		if ((envelope.data.model ?? null) !== a.returnedModel)
			return hold("ANALYSIS_MODEL_MISMATCH");
		if ((envelope.data.model_snapshot ?? null) !== a.modelSnapshot)
			return hold("ANALYSIS_SNAPSHOT_MISMATCH");
		const choice = envelope.data.choices[0];
		if (!choice) return hold("ANALYSIS_MALFORMED");
		value.finishReason = choice.finish_reason;
		const usage = envelope.data.usage;
		value.usage = usage
			? {
					promptTokens: usage.prompt_tokens ?? null,
					completionTokens: usage.completion_tokens ?? null,
					totalTokens: usage.total_tokens ?? null,
				}
			: null;
		if (choice.message.refusal) return hold("ANALYSIS_REFUSED");
		if (choice.finish_reason !== "stop") return hold("ANALYSIS_INCOMPLETE");
		for (const key of a.observationPointer) {
			if (
				decoded === null ||
				typeof decoded !== "object" ||
				!Object.hasOwn(decoded, key)
			)
				return hold("ANALYSIS_MALFORMED");
			decoded = Reflect.get(decoded, key);
		}
		if (typeof decoded === "string") decoded = JSON.parse(decoded);
	} catch (error) {
		if (error instanceof SyntaxError || error instanceof TypeError)
			return hold("ANALYSIS_MALFORMED");
		if (
			error instanceof Error &&
			["ANALYSIS_BINDING_MISMATCH", "INVALID_PNG"].includes(error.message)
		)
			return hold("ANALYSIS_BINDING_MISMATCH");
		throw error;
	}
	const observation = referenceObservationSchema.safeParse(decoded);
	if (!observation.success) return hold("ANALYSIS_MALFORMED");
	const fields = observation.data.fields;
	if (
		new Set(fields.map((field) => field.field)).size !== fields.length ||
		fields.some(
			(field) =>
				(field.status !== "observed" && field.value !== null) ||
				(field.status === "observed" &&
					(field.value === null || field.cues.length === 0)) ||
				(field.region !== null &&
					(field.region.x + field.region.width > 1 ||
						field.region.y + field.region.height > 1)),
		)
	)
		return hold("ANALYSIS_MALFORMED");
	value.observation = observation.data;
	const qualified = qualificationSchema.safeParse(input.qualification);
	if (
		qualified.success &&
		qualified.data.endpoint === a.endpoint &&
		qualified.data.requestedModel === a.requestedModel &&
		qualified.data.returnedModel === a.returnedModel &&
		qualified.data.modelSnapshot === a.modelSnapshot &&
		qualified.data.capabilityRequestSHA256 === a.requestSHA256 &&
		qualified.data.capabilityResponseSHA256 === a.responseSHA256 &&
		value.modelAttestation === "MATCH"
	) {
		value.qualification = qualified.data;
		value.status = "ATTRIBUTED";
		value.reason = "ATTRIBUTED_NOT_APPROVED";
	}
	return referenceRecord(value);
}
