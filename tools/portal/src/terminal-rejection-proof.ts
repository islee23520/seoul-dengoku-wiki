import { z } from "zod";
import {
	decodePng,
	PngError,
} from "../../portrait/acceptance/src/png.ts";
import { referenceRecordSHA256 } from "./reference-analysis.ts";
import { referenceGenerationRequestSchema } from "./reference-contract.ts";
import { transformReferencePng } from "./reference-transform.ts";
import { hash } from "./sources.ts";

const sha = z.string().regex(/^[a-f0-9]{64}$/);
export const executionJobSchema = z.strictObject({
	id: z.uuid(),
	state: z.enum(["RUNNING", "HOLD", "FAILED", "UNKNOWN"]),
	reviewStatus: z.literal("HOLD"),
	imageUrl: z.string().nullable(),
	metrics: z.record(z.string(), z.unknown()).nullable(),
	errorCode: z.string().nullable(),
	payloadSHA: z.string(),
});
export const rejectionProofFiles = [
	"job.json",
	"initial-job.json",
	"request-payload.json",
	"connection-binding.json",
	"provider-source.png.request.json",
	"provider-source.png.receipt.json",
	"provider-source.png.request.bin",
	"provider-source.png.response.bin",
	"dispatch.lock",
	"job-history.json",
	"provenance.json",
	"reference-analysis.json",
	"reference-normalized.png",
	"source-bytes.json",
] as const;
export const retainedManifestSchema = z.record(
	z.enum(rejectionProofFiles),
	sha,
);
export const terminalRejectionRequestSchema = z.strictObject({
	schemaVersion: z.literal(1),
	operationId: z.uuid(),
	expectedJobSHA256: sha,
	expectedPayloadSHA256: sha,
	expectedReceiptSHA256: sha,
	expectedRequestSHA256: sha,
	expectedResponseSHA256: sha,
	expectedRetainedManifest: retainedManifestSchema,
});
export type RejectionProofFiles = Readonly<
	Record<(typeof rejectionProofFiles)[number], Buffer>
>;
export class TerminalRejectionError extends Error {
	readonly status = 409;
	constructor(
		readonly code:
			| "TERMINAL_REJECTION_INELIGIBLE"
			| "TERMINAL_REJECTION_PROOF_MISMATCH"
			| "TERMINAL_REJECTION_CONFLICT",
	) {
		super(code);
	}
}
export function rejectionJSON(bytes: Uint8Array): unknown {
	try {
		return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
	} catch (error) {
		if (error instanceof SyntaxError || error instanceof TypeError)
			throw new TerminalRejectionError("TERMINAL_REJECTION_PROOF_MISMATCH");
		throw error;
	}
}
const requestRecordSchema = z.object({
	schemaVersion: z.literal(2),
	inputMode: z.literal("reference-img2img"),
	compiler: z.literal("source-preservation-edit.v1"),
	requestId: z.uuid(),
	model: z.literal("gpt-image-2.5-sunburst"),
	sourceSHA256: sha,
	prompt: z.string().min(1),
	promptSHA256: sha,
	wirePromptSHA256: sha,
	wirePromptNewlines: z.literal("multipart-crlf"),
	referenceHashes: z.tuple([sha]),
	size: z.literal("1024x1536"),
	n: z.literal(1),
	output_format: z.literal("png"),
	background: z.literal("transparent"),
	wire: z.strictObject({
		contentType: z.string().startsWith("multipart/form-data; boundary="),
		bytes: z.int().positive(),
		sha256: sha,
	}),
});
const receiptSchema = requestRecordSchema.extend({
	status: z.int().min(200).max(299),
	responseBodySHA256: sha,
	requestedModel: z.literal("gpt-image-2.5-sunburst"),
	returnedModel: z.null(),
	modelSnapshot: z.string().min(1).nullable(),
	modelSnapshotStatus: z.enum(["EXPOSED", "NOT_EXPOSED"]),
	modelAttestation: z.literal("UNKNOWN"),
	failure: z.literal("MODEL_NOT_EXPOSED"),
});

// Pure proof checking: all bytes come from server-owned retained files, never
// request paths or client model/state claims. The wire is parsed locally only.
export async function verifyTerminalRejectionV1(input: {
	readonly ownerId: string;
	readonly requestId: string;
	readonly request: z.infer<typeof terminalRejectionRequestSchema>;
	readonly files: RejectionProofFiles;
}) {
	const { files, request, ownerId, requestId } = input;
	if (
		rejectionProofFiles.some(
			(name) => hash(files[name]) !== request.expectedRetainedManifest[name],
		)
	)
		throw new TerminalRejectionError("TERMINAL_REJECTION_CONFLICT");
	const expected = [
		["job.json", request.expectedJobSHA256],
		["request-payload.json", request.expectedPayloadSHA256],
		["provider-source.png.receipt.json", request.expectedReceiptSHA256],
		["provider-source.png.request.bin", request.expectedRequestSHA256],
		["provider-source.png.response.bin", request.expectedResponseSHA256],
	] as const;
	for (const [name, digest] of expected) {
		if (hash(files[name]) !== digest)
			throw new TerminalRejectionError("TERMINAL_REJECTION_CONFLICT");
	}
	try {
		const job = executionJobSchema.parse(rejectionJSON(files["job.json"]));
		const initial = executionJobSchema.parse(
			rejectionJSON(files["initial-job.json"]),
		);
		const payload = referenceGenerationRequestSchema.parse(
			rejectionJSON(files["request-payload.json"]),
		);
		if (
			job.id !== requestId ||
			job.state !== "UNKNOWN" ||
			job.errorCode !== "LOCAL_MODEL_NOT_EXPOSED" ||
			job.imageUrl !== null ||
			job.metrics !== null ||
			initial.id !== requestId ||
			initial.state !== "RUNNING" ||
			initial.imageUrl !== null ||
			initial.metrics !== null ||
			initial.errorCode !== null ||
			initial.payloadSHA !== job.payloadSHA ||
			payload.requestId !== requestId ||
			!payload.connectionId ||
			payload.inputMode !== "reference-img2img" ||
			payload.provider !== "openai-compatible" ||
			payload.providerModel !== "gpt-image-2.5-sunburst" ||
			payload.sourceSelection.kind !== "selected" ||
			job.payloadSHA !== hash(Buffer.from(JSON.stringify(payload)))
		)
			throw new TerminalRejectionError("TERMINAL_REJECTION_INELIGIBLE");
		const binding = z
			.object({
				ownerId: z.literal(ownerId),
				connectionId: z.literal(payload.connectionId),
				sessionFingerprint: sha,
				expiresAt: z.number().finite(),
				revision: z.uuid(),
				endpointId: z.literal("local-openai"),
				endpointRevision: z.literal("local-openai.v1"),
				protocolVersion: z.literal("openai-compatible-http.v1"),
				toolName: z.literal("openai-images-edits"),
				toolSchemaDigest: sha,
				state: z.literal("READY"),
			})
			.parse(rejectionJSON(files["connection-binding.json"]));
		if (
			binding.toolSchemaDigest !==
			hash(
				Buffer.from(
					"openai-compatible-http.v1:/images/edits:canonical-multipart",
				),
			)
		)
			throw new TerminalRejectionError("TERMINAL_REJECTION_PROOF_MISMATCH");
		const recordValue = z
			.record(z.string(), z.unknown())
			.parse(rejectionJSON(files["provider-source.png.request.json"]));
		const receiptValue = z
			.record(z.string(), z.unknown())
			.parse(rejectionJSON(files["provider-source.png.receipt.json"]));
		const record = requestRecordSchema.parse(recordValue);
		const receipt = receiptSchema.parse(receiptValue);
		if (files["dispatch.lock"].length !== 0)
			throw new TerminalRejectionError("TERMINAL_REJECTION_PROOF_MISMATCH");
		z.strictObject({ createdAt: z.iso.datetime() }).parse(
			rejectionJSON(files["job-history.json"]),
		);
		const source = z
			.object({
				detail: z.string(),
				token: z.string(),
				image: z.string().min(1),
			})
			.parse(rejectionJSON(files["source-bytes.json"]));
		const provenance = z
			.object({
				requestId: z.literal(requestId),
				original: z.strictObject({ detail: sha, token: sha, image: sha }),
				reference: z.object({
					schemaVersion: z.literal(2),
					inputMode: z.literal("reference-img2img"),
					sourceSelection: z.unknown(),
				}),
			})
			.parse(rejectionJSON(files["provenance.json"]));
		for (const role of ["detail", "token", "image"] as const) {
			const bytes = Buffer.from(source[role], "base64");
			if (
				bytes.toString("base64") !== source[role] ||
				hash(bytes) !== provenance.original[role]
			)
				throw new TerminalRejectionError("TERMINAL_REJECTION_PROOF_MISMATCH");
		}
		const analysisRecord = z.strictObject({
			value: z.record(z.string(), z.unknown()),
			sha256: sha,
		});
		const analysis = z
			.object({
				records: z.strictObject({
					manifest: analysisRecord,
					observation: analysisRecord,
					directive: analysisRecord,
					intent: analysisRecord,
				}),
			})
			.parse(rejectionJSON(files["reference-analysis.json"]));
		const transportProvenance = z
			.object({ records: z.unknown() })
			.parse(recordValue["provenance"]);
		// Retained encoded bytes are still pinned above. Recomputing the source
		// transform proves pixels and geometry, not a runtime's zlib encoding.
		const normalized = decodePng(files["reference-normalized.png"]);
		const recomputed = transformReferencePng(
			Buffer.from(source.image, "base64"),
		);
		if (
			provenance.original.image !== payload.sourceSelection.sourceSHA256 ||
			JSON.stringify(provenance.reference.sourceSelection) !==
				JSON.stringify(payload.sourceSelection) ||
			JSON.stringify(transportProvenance.records) !==
				JSON.stringify(analysis.records) ||
			Object.values(analysis.records).some(
				(entry) => referenceRecordSHA256(entry.value) !== entry.sha256,
			) ||
			analysis.records.manifest.value["sourceSHA256"] !==
				provenance.original.image ||
			analysis.records.manifest.value["tokenSHA256"] !==
				provenance.original.token ||
			analysis.records.directive.value["requestId"] !== requestId ||
			normalized.channels !== 4 ||
			normalized.width !== recomputed.receipt.width ||
			normalized.height !== recomputed.receipt.height ||
			hash(normalized.pixels) !== recomputed.receipt.rgbaPixelsSHA256
		)
			throw new TerminalRejectionError("TERMINAL_REJECTION_PROOF_MISMATCH");
		if (
			record.requestId !== requestId ||
			receipt.requestId !== requestId ||
			record.sourceSHA256 !== payload.sourceSelection.sourceSHA256 ||
			record.wire.bytes !== files["provider-source.png.request.bin"].length ||
			record.wire.sha256 !== request.expectedRequestSHA256 ||
			receipt.responseBodySHA256 !== request.expectedResponseSHA256 ||
			record.promptSHA256 !== hash(Buffer.from(record.prompt)) ||
			record.wirePromptSHA256 !==
				hash(Buffer.from(record.prompt.replace(/\r?\n/g, "\r\n"))) ||
			Object.entries(recordValue).some(
				([key, value]) =>
					JSON.stringify(receiptValue[key]) !== JSON.stringify(value),
			) ||
			Object.hasOwn(receiptValue, "responseSHA")
		)
			throw new TerminalRejectionError("TERMINAL_REJECTION_PROOF_MISMATCH");
		const response = z
			.object({
				model: z.string().min(1).nullish(),
				model_snapshot: z.string().min(1).nullish(),
				data: z.tuple([z.object({ b64_json: z.string().min(1) })]),
			})
			.parse(rejectionJSON(files["provider-source.png.response.bin"]));
		if (
			response.model != null ||
			Buffer.from(response.data[0].b64_json, "base64").toString("base64") !==
				response.data[0].b64_json ||
			(response.model_snapshot ?? null) !== receipt.modelSnapshot ||
			receipt.modelSnapshotStatus !==
				(response.model_snapshot ? "EXPOSED" : "NOT_EXPOSED")
		)
			throw new TerminalRejectionError("TERMINAL_REJECTION_PROOF_MISMATCH");
		const form = await new Response(files["provider-source.png.request.bin"], {
			headers: { "content-type": record.wire.contentType },
		}).formData();
		const fields = {
			model: record.model,
			prompt: record.prompt.replace(/\r?\n/g, "\r\n"),
			size: record.size,
			n: "1",
			output_format: "png",
			background: "transparent",
		};
		if (
			Array.from(form.keys()).length !== 7 ||
			Object.entries(fields).some(
				([key, value]) =>
					form.getAll(key).length !== 1 || form.get(key) !== value,
			)
		)
			throw new TerminalRejectionError("TERMINAL_REJECTION_PROOF_MISMATCH");
		const image = form.get("image[]");
		if (
			!(image instanceof Blob) ||
			form.getAll("image[]").length !== 1 ||
			hash(new Uint8Array(await image.arrayBuffer())) !==
				record.referenceHashes[0]
		)
			throw new TerminalRejectionError("TERMINAL_REJECTION_PROOF_MISMATCH");
		return {
			job: { ...job, state: "FAILED" as const },
			proofSHA256: Object.fromEntries(
				rejectionProofFiles.map((name) => [name, hash(files[name])]),
			),
		};
	} catch (error) {
		if (
			error instanceof z.ZodError ||
			error instanceof TypeError ||
			error instanceof PngError
		)
			throw new TerminalRejectionError("TERMINAL_REJECTION_PROOF_MISMATCH");
		throw error;
	}
}
