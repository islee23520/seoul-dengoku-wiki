import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import { decodePng } from "../../acceptance/src/png.js";
import { cpaPadding } from "./cpa-padding.js";
import { type TransportConnection, TransportError } from "./transport.js";

const sha = z.string().regex(/^[a-f0-9]{64}$/);
export const trainingTargetProfileBinding = {
	requestedProfileId: "training100-owner-k998-k399-16e881d8a746f7f3",
	requestedProfileSHA256: "16e881d8a746f7f36744d01a9e3f85506f6c2bcffcf6299ac6dc83c11fb95a84",
	resolvedProfileId: "shared-target-drawing-v3",
	resolvedProfileSHA256: "9dc57b85b0cd3c8356efd18ac505da3674d27af1348aff2d4046fd77baf601fa",
} as const;
const targetProfileBindingSchema = z.strictObject({
	requestedProfileId: z.literal(trainingTargetProfileBinding.requestedProfileId),
	requestedProfileSHA256: z.literal(trainingTargetProfileBinding.requestedProfileSHA256),
	resolvedProfileId: z.literal(trainingTargetProfileBinding.resolvedProfileId),
	resolvedProfileSHA256: z.literal(trainingTargetProfileBinding.resolvedProfileSHA256),
});
export const trainingImageSchema = z.strictObject({
	index: z.int().positive(),
	role: z.enum(["recipient-identity-content", "style-only"]),
	assetId: z.string().min(1),
	filename: z.string().regex(/^(recipient-1|style-[12])\.png$/),
	originalSHA256: sha,
	wireSHA256: sha,
	transformSHA256: sha.nullable(),
});
const conditionsSchema = z.strictObject({
	schema: z.literal("cpa-training-conditions.v1"),
	compiler: z.literal("shared-style-cpa-training.v1"),
	inputMode: z.enum(["reference-image", "tokens-only"]),
	model: z.literal("gpt-image-2.5-sunburst"),
	styleProfileId: z.enum(["shared-target-drawing-v2", "shared-target-drawing-v3"]),
	profileSHA256: sha,
	targetProfileBinding: targetProfileBindingSchema.optional(),
	inventorySHA256: sha,
	intentSHA256: sha,
	prompt: z.string().min(1).max(32768),
	promptSHA256: sha,
	images: z.array(trainingImageSchema).min(2).max(3),
	orderedImageBytes: z.array(z.instanceof(Uint8Array)).min(2).max(3),
});
const styleHashes = {
	"shared-target-drawing-v2": [
	"ee65e79ae227c628ac22f4b3b591015a5b21408f1464b8ff0a6f5a6d5b918e28",
	"5a79cf53ccd738285f754ddfc9bf6f5b9c12b74ae8d727744ec2054047b6acce",
	],
	"shared-target-drawing-v3": [
		"93e45d8525c4616ef1a174b171403ddd95eebf048fba818a0a80f0c24295b306",
		"93d13f3be76d5b251cc8ef2d903027d2482366a2b2a8e79650baabb4f7988672",
	],
} as const;
export const trainingHash = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");

export function prepareTrainingConditions(input: unknown) {
	const value = conditionsSchema.parse(input);
	const recipientCount = value.inputMode === "reference-image" ? 1 : 0;
	if (value.styleProfileId === "shared-target-drawing-v3"
		? !value.targetProfileBinding || value.profileSHA256 !== trainingTargetProfileBinding.resolvedProfileSHA256
		: value.targetProfileBinding !== undefined)
		throw new TransportError("PROJECTION_BINDING_MISMATCH", "unknown");
	if (
		value.images.length !== recipientCount + 2 ||
		value.orderedImageBytes.length !== value.images.length ||
		trainingHash(Buffer.from(value.prompt)) !== value.promptSHA256
	)
		throw new TransportError("PROJECTION_BINDING_MISMATCH", "unknown");
	for (const [index, image] of value.images.entries()) {
		const bytes = value.orderedImageBytes[index];
		if (
			!bytes ||
			image.index !== index + 1 ||
			image.wireSHA256 !== trainingHash(bytes)
		)
			throw new TransportError("PROJECTION_BINDING_MISMATCH", "unknown");
		const png = decodePng(bytes);
		if (index < recipientCount) {
			if (
				image.role !== "recipient-identity-content" ||
				image.filename !== "recipient-1.png" ||
				image.transformSHA256 === null ||
				png.width !== 640 ||
				png.height !== 1024 ||
				png.channels !== 4
			)
				throw new TransportError("PROJECTION_BINDING_MISMATCH", "unknown");
		} else {
			const styleIndex = index - recipientCount;
			const expected = styleHashes[value.styleProfileId][styleIndex];
			if (
				image.role !== "style-only" ||
				image.filename !== `style-${styleIndex + 1}.png` ||
				image.transformSHA256 !== null ||
				image.originalSHA256 !== expected ||
				image.wireSHA256 !== expected ||
				image.assetId !== `inventory:${expected?.slice(0, 12)}`
			)
				throw new TransportError("PROJECTION_BINDING_MISMATCH", "unknown");
		}
	}
	return value;
}

export async function sendTrainingDrawingRequest(input: {
	readonly conditions: unknown;
	readonly connection: TransportConnection;
	readonly requestId: string;
	readonly outputPath: string;
	readonly send?: (request: Request) => Promise<Response>;
}) {
	const conditions = prepareTrainingConditions(input.conditions);
	z.uuid().parse(input.requestId);
	const { baseUrl, apiKey, allowUnauthenticated } = input.connection;
	const url = new URL(baseUrl);
	const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
	if (
		url.username ||
		url.password ||
		url.search ||
		url.hash ||
		(loopback
			? !["http:", "https:"].includes(url.protocol) ||
				(!apiKey?.trim() && !allowUnauthenticated)
			: url.protocol !== "https:" || !apiKey?.trim())
	)
		throw new TransportError("INVALID_CONNECTION", "unknown");
	const { orderedImageBytes, ...pins } = conditions;
	if (apiKey !== undefined && JSON.stringify(pins).includes(apiKey))
		throw new TransportError("CREDENTIAL_IN_PROMPT", "unknown");
	const form = new FormData();
	for (const [key, value] of Object.entries({
		model: conditions.model,
		prompt: conditions.prompt,
		size: "640x1024",
		n: "1",
		output_format: "png",
		background: "transparent",
	}))
		form.set(key, value);
	for (const [index, image] of conditions.images.entries()) {
		const bytes = orderedImageBytes[index];
		if (!bytes)
			throw new TransportError("PROJECTION_BINDING_MISMATCH", "unknown");
		form.append(
			"image[]",
			new Blob([bytes], { type: "image/png" }),
			image.filename,
		);
	}
	const endpoint = `${baseUrl.replace(/\/+$/, "")}/images/edits`;
	const encoded = new Request(endpoint, { method: "POST", body: form });
	const contentType = encoded.headers.get("content-type") ?? "";
	const wire = new Uint8Array(await encoded.arrayBuffer());
	if (apiKey !== undefined && Buffer.from(wire).includes(Buffer.from(apiKey)))
		throw new TransportError("CREDENTIAL_IN_PROMPT", "unknown");
	const record = {
		...pins,
		schema: "cpa-training-generation-receipt.v1",
		requestId: input.requestId,
		generationProfile: "cpa340-padded-v1",
		generationGeometry: cpaPadding,
		size: "640x1024",
		wire: { contentType, sha256: trainingHash(wire), bytes: wire.length },
		wirePromptSHA256: trainingHash(
			Buffer.from(conditions.prompt.replace(/\r?\n/g, "\r\n")),
		),
	};
	await mkdir(dirname(input.outputPath), { recursive: true, mode: 0o700 });
	const save = (suffix: string, bytes: Uint8Array) =>
		writeFile(`${input.outputPath}.${suffix}`, bytes, {
			flag: "wx",
			mode: 0o600,
		});
	try {
		await save("request.json", Buffer.from(`${JSON.stringify(record)}\n`));
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "EEXIST")
			throw new TransportError("REQUEST_ALREADY_RECORDED", "unknown");
		throw error;
	}
	await save("request.bin", wire);
	let response: Response;
	let body: Uint8Array;
	try {
		response = await (input.send ?? fetch)(
			new Request(endpoint, {
				method: "POST",
				body: wire,
				redirect: "error",
				signal: AbortSignal.timeout(120000),
				headers: {
					"content-type": contentType,
					...(apiKey === undefined
						? {}
						: { authorization: `Bearer ${apiKey}` }),
				},
			}),
		);
		body = new Uint8Array(await response.arrayBuffer());
	} catch (error) {
		if (!(error instanceof TypeError || error instanceof DOMException))
			throw error;
		await save(
			"receipt.json",
			Buffer.from(
				`${JSON.stringify({ ...record, failure: "NETWORK_FAILURE", status: "unknown", modelAttestation: "UNKNOWN", trainingSelected: false })}\n`,
			),
		);
		throw new TransportError("NETWORK_FAILURE", "unknown");
	}
	if (apiKey !== undefined && Buffer.from(body).includes(Buffer.from(apiKey)))
		throw new TransportError("INVALID_RESPONSE", response.status);
	await save("response.bin", body);
	const base = {
		...record,
		status: response.status,
		responseBodySHA256: trainingHash(body),
		trainingSelected: false,
		ownerApproval: "NONE",
	};
	const fail = async (
		code:
			| "HTTP_FAILURE"
			| "INVALID_RESPONSE"
			| "MODEL_NOT_EXPOSED"
			| "MODEL_MISMATCH",
		detail: Record<string, unknown> = {},
	): Promise<never> => {
		await save(
			"receipt.json",
			Buffer.from(`${JSON.stringify({ ...base, ...detail, failure: code })}\n`),
		);
		throw new TransportError(code, response.status);
	};
	if (!response.ok) return fail("HTTP_FAILURE");
	let payload: unknown;
	try {
		payload = JSON.parse(
			new TextDecoder("utf-8", { fatal: true }).decode(body),
		);
	} catch (error) {
		if (error instanceof SyntaxError || error instanceof TypeError)
			return fail("INVALID_RESPONSE");
		throw error;
	}
	const envelope = z
		.object({
			model: z.string().min(1).nullish(),
			model_snapshot: z.string().min(1).nullish(),
			data: z.tuple([z.object({ b64_json: z.string().min(1) })]),
		})
		.safeParse(payload);
	if (!envelope.success) return fail("INVALID_RESPONSE");
	const returnedModel = envelope.data.model ?? null;
	const attestation = {
		requestedModel: conditions.model,
		returnedModel,
		modelSnapshot: envelope.data.model_snapshot ?? null,
		modelSnapshotStatus: envelope.data.model_snapshot
			? "EXPOSED"
			: "NOT_EXPOSED",
		modelAttestation:
			returnedModel === null
				? "UNKNOWN"
				: returnedModel === conditions.model
					? "MATCH"
					: "FAIL",
	};
	const encodedImage = envelope.data.data[0].b64_json;
	const bytes = Buffer.from(encodedImage, "base64");
	if (returnedModel === null) return fail("MODEL_NOT_EXPOSED", attestation);
	if (returnedModel !== conditions.model)
		return fail("MODEL_MISMATCH", attestation);
	if (bytes.toString("base64") !== encodedImage)
		return fail("INVALID_RESPONSE", attestation);
	let png: ReturnType<typeof decodePng>;
	try {
		png = decodePng(bytes);
	} catch (error) {
		if (error instanceof Error) return fail("INVALID_RESPONSE", attestation);
		throw error;
	}
	if (png.width !== 640 || png.height !== 1024 || png.channels !== 4)
		return fail("INVALID_RESPONSE", attestation);
	const receipt = {
		...base,
		...attestation,
		responseSHA: trainingHash(bytes),
		actualCanvas: [png.width, png.height],
		reviewStatus: "candidate-unreviewed",
	};
	await writeFile(input.outputPath, bytes, { flag: "wx", mode: 0o600 });
	await save("receipt.json", Buffer.from(`${JSON.stringify(receipt)}\n`));
	return { bytes, receipt };
}
