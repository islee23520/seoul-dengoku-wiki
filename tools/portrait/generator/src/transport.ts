import { createHash } from "node:crypto";
import { mkdir, open, stat } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import { PngDecodeError, validatePortraitPng } from "./png.js";
import { prepareReferenceEditConditions } from "./preflight.js";
import type { ProjectionResult } from "./projection.js";

export type TransportConnection = Readonly<{
	baseUrl: string;
	apiKey?: string;
	allowUnauthenticated?: boolean;
}>;

export type PortraitRequestResult = Readonly<{
	bytes: Uint8Array;
	requestPath: string;
	responseSHA: string;
	responseStatus: number;
}>;

export type PortraitRequestInput = Readonly<{
	projection: ProjectionResult;
	orderedImageBytes: readonly Uint8Array[];
	connection: TransportConnection;
	requestId: string;
	outputPath: string;
}>;

export type TransportErrorCode =
	| "PROJECTION_BINDING_MISMATCH"
	| "CREDENTIAL_IN_PROMPT"
	| "INVALID_CONNECTION"
	| "OUTPUT_ALREADY_EXISTS"
	| "REQUEST_ALREADY_RECORDED"
	| "HTTP_FAILURE"
	| "GENERATION_SIZE_UNSUPPORTED"
	| "NETWORK_FAILURE"
	| "MODEL_MISMATCH"
	| "MODEL_NOT_EXPOSED"
	| "INVALID_RESPONSE";

export type TransportErrorStatus = number | "unknown";

export class TransportError extends Error {
	readonly code: TransportErrorCode;
	readonly status: TransportErrorStatus;

	constructor(code: TransportErrorCode, status: TransportErrorStatus) {
		super(code);
		this.name = "TransportError";
		this.code = code;
		this.status = status;
	}
}

export async function sendPortraitRequest(
	input: PortraitRequestInput,
): Promise<PortraitRequestResult> {
	const sha256 = (bytes: Uint8Array): string =>
		createHash("sha256").update(bytes).digest("hex");
	const fail = (
		code: TransportErrorCode,
		status: TransportErrorStatus = "unknown",
	): never => {
		throw new TransportError(code, status);
	};
	const projection = input.projection;
	const textBytes = new TextEncoder().encode(projection.text);
	const renderingBytes = new TextEncoder().encode(
		JSON.stringify(projection.rendering),
	);
	if (
		sha256(textBytes) !== projection.textSHA ||
		sha256(renderingBytes) !== projection.renderingSHA ||
		projection.text !==
			`${JSON.stringify(projection.rendering, null, 2).split("\n").join("\r\n")}\r\n` ||
		projection.providerCalls !== 0 ||
		projection.dispatched !== false
	)
		fail("PROJECTION_BINDING_MISMATCH");
	const references = projection.rendering.references ?? [];
	const referenceHashes = references.map((reference) =>
		"sourceSHA" in reference && typeof reference.sourceSHA === "string"
			? reference.sourceSHA
			: "",
	);
	if (
		referenceHashes.length !== input.orderedImageBytes.length ||
		referenceHashes.some(
			(hash, index) =>
				hash !== sha256(input.orderedImageBytes[index] ?? new Uint8Array()),
		)
	)
		fail("PROJECTION_BINDING_MISMATCH");
	const { baseUrl, apiKey, allowUnauthenticated } = input.connection;
	let url: URL;
	try {
		url = new URL(baseUrl);
	} catch (error) {
		if (error instanceof TypeError) fail("INVALID_CONNECTION");
		throw error;
	}
	const loopback =
		url.hostname === "localhost" ||
		url.hostname === "127.0.0.1" ||
		url.hostname === "[::1]" ||
		url.hostname === "::1";
	if (apiKey !== undefined && projection.text.includes(apiKey))
		fail("CREDENTIAL_IN_PROMPT");
	if (
		url.username ||
		url.password ||
		url.search ||
		url.hash ||
		(loopback
			? (url.protocol !== "http:" && url.protocol !== "https:") ||
				(apiKey === undefined && allowUnauthenticated !== true)
			: url.protocol !== "https:" || !apiKey?.trim())
	)
		fail("INVALID_CONNECTION");
	if (loopback && url.protocol !== "http:" && url.protocol !== "https:")
		fail("INVALID_CONNECTION");
	let outputExists = false;
	try {
		await stat(input.outputPath);
		outputExists = true;
	} catch (error) {
		if (!(error instanceof Error && "code" in error && error.code === "ENOENT"))
			throw error;
	}
	if (outputExists) fail("OUTPUT_ALREADY_EXISTS");
	const requestPath = `${input.outputPath}.request.json`;
	const receiptPath = `${input.outputPath}.receipt.json`;
	const record = {
		requestId: input.requestId,
		model: "gpt-image-2.5-sunburst",
		size: "1024x1536",
		prompt: projection.text,
		rendering: projection.rendering,
		textSHA: projection.textSHA,
		renderingSHA: projection.renderingSHA,
		sourceSHA: projection.sourceSHA,
		referenceHashes,
		referenceImages: input.orderedImageBytes.map((bytes) =>
			Buffer.from(bytes).toString("base64"),
		),
	};
	await mkdir(dirname(input.outputPath), { recursive: true });
	let requestFile: Awaited<ReturnType<typeof open>>;
	try {
		requestFile = await open(requestPath, "wx", 0o600);
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "EEXIST")
			fail("REQUEST_ALREADY_RECORDED");
		throw error;
	}
	try {
		await requestFile.writeFile(`${JSON.stringify(record, null, 2)}\n`);
	} finally {
		await requestFile.close();
	}
	const endpoint = new URL(`${baseUrl.replace(/\/+$/, "")}/images/edits`);
	const form = new FormData();
	form.set("model", "gpt-image-2.5-sunburst");
	form.set("prompt", projection.text);
	form.set("size", "1024x1536");
	form.set("n", "1");
	for (const [index, bytes] of input.orderedImageBytes.entries())
		form.append(
			"image[]",
			new Blob([bytes], { type: "image/png" }),
			`reference-${index + 1}.png`,
		);
	const timeout = AbortSignal.timeout(120_000);
	const response = await fetch(endpoint, {
		method: "POST",
		headers:
			apiKey === undefined ? undefined : { Authorization: `Bearer ${apiKey}` },
		body: form,
		signal: timeout,
		redirect: "error",
	}).catch(async (error: unknown): Promise<Response> => {
		if (!(error instanceof TypeError || error instanceof DOMException))
			throw error;
		await writeReceipt(receiptPath, {
			...record,
			status: "unknown",
			failure: "NETWORK_FAILURE",
		});
		return fail("NETWORK_FAILURE");
	});
	const payloadSchema = z
		.object({
			data: z
				.array(z.object({ b64_json: z.string().min(1) }).passthrough())
				.min(1),
		})
		.passthrough();
	let responseBody = new Uint8Array();
	try {
		responseBody = new Uint8Array(await response.arrayBuffer());
	} catch (error) {
		if (!(error instanceof TypeError || error instanceof DOMException))
			throw error;
		await writeReceipt(receiptPath, {
			...record,
			status: response.status,
			failure: "NETWORK_FAILURE",
			responseBodySHA: "partial-or-unavailable",
		});
		fail("NETWORK_FAILURE");
	}
	if (!response.ok) {
		await writeReceipt(receiptPath, {
			...record,
			status: response.status,
			failure: "HTTP_FAILURE",
			responseBodySHA: sha256(responseBody),
			responseBodyBase64: Buffer.from(responseBody).toString("base64"),
		});
		fail("HTTP_FAILURE", response.status);
	}
	const invalidResponse = async (): Promise<never> => {
		await writeReceipt(receiptPath, {
			...record,
			status: response.status,
			failure: "INVALID_RESPONSE",
			responseBodySHA: sha256(responseBody),
			responseBodyBase64: Buffer.from(responseBody).toString("base64"),
		});
		return fail("INVALID_RESPONSE", response.status);
	};
	let parsedPayload: z.infer<typeof payloadSchema>;
	try {
		parsedPayload = payloadSchema.parse(
			JSON.parse(
				new TextDecoder("utf-8", { fatal: true }).decode(responseBody),
			),
		);
	} catch (error) {
		if (
			error instanceof z.ZodError ||
			error instanceof SyntaxError ||
			error instanceof TypeError
		)
			return invalidResponse();
		throw error;
	}
	const image = parsedPayload.data[0];
	if (image === undefined) return invalidResponse();
	const bytes = Buffer.from(image.b64_json, "base64");
	if (bytes.toString("base64") !== image.b64_json) return invalidResponse();
	try {
		validatePortraitPng(bytes);
	} catch (error) {
		if (error instanceof PngDecodeError) return invalidResponse();
		throw error;
	}
	const output = new Uint8Array(bytes);
	const responseSHA = sha256(output);
	let outputFile: Awaited<ReturnType<typeof open>>;
	try {
		outputFile = await open(input.outputPath, "wx", 0o600);
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "EEXIST")
			fail("OUTPUT_ALREADY_EXISTS");
		throw error;
	}
	try {
		await outputFile.writeFile(output);
	} finally {
		await outputFile.close();
	}
	await writeReceipt(receiptPath, {
		...record,
		status: response.status,
		responseSHA,
		reviewStatus: "candidate-unreviewed",
	});
	return {
		bytes: output,
		requestPath,
		responseSHA,
		responseStatus: response.status,
	};
}

async function writeReceipt(
	path: string,
	receipt: Readonly<Record<string, unknown>>,
): Promise<void> {
	const file = await open(path, "wx", 0o600);
	try {
		await file.writeFile(`${JSON.stringify(receipt, null, 2)}\n`);
	} finally {
		await file.close();
	}
}

// Deliberately separate from the legacy projection transport and its receipts.
// No model/provider fallback, mask, input_fidelity, or token override exists.
export async function sendReferenceEditRequest(input: {
	conditions: unknown;
	connection: TransportConnection;
	requestId: string;
	outputPath: string;
	provenance: Readonly<Record<string, unknown>>;
	send?: (request: Request) => Promise<Response>;
}) {
	const conditions = prepareReferenceEditConditions(input.conditions);
	if (!z.uuid().safeParse(input.requestId).success)
		throw new TransportError("PROJECTION_BINDING_MISMATCH", "unknown");
	const { baseUrl, apiKey, allowUnauthenticated } = input.connection;
	const parsedUrl = z.url().safeParse(baseUrl);
	if (!parsedUrl.success)
		throw new TransportError("INVALID_CONNECTION", "unknown");
	const url = new URL(parsedUrl.data);
	const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
	if (
		url.username ||
		url.password ||
		url.search ||
		url.hash ||
		(loopback
			? !["http:", "https:"].includes(url.protocol) ||
				(!apiKey?.trim() && allowUnauthenticated !== true)
			: url.protocol !== "https:" || !apiKey?.trim())
	)
		throw new TransportError("INVALID_CONNECTION", "unknown");
	const { orderedImageBytes, ...pins } = conditions;
	const size =
		conditions.generationProfile === "cpa340-padded-v1"
			? "640x1024"
			: conditions.generationProfile
				? "340x510"
				: "1024x1536";
	const record = {
		...pins,
		requestId: input.requestId,
		size,
		n: 1,
		output_format: "png",
		background: "transparent",
		provenance: structuredClone(input.provenance),
	};
	if (apiKey !== undefined && JSON.stringify(record).includes(apiKey))
		throw new TransportError("CREDENTIAL_IN_PROMPT", "unknown");
	const form = new FormData();
	form.set("model", conditions.model);
	form.set("prompt", conditions.prompt);
	form.set("size", size);
	form.set("n", "1");
	form.set("output_format", "png");
	form.set("background", "transparent");
	form.append(
		"image[]",
		new Blob([orderedImageBytes[0]], { type: "image/png" }),
		"recipient-1.png",
	);
	const endpoint = `${baseUrl.replace(/\/+$/, "")}/images/edits`;
	const encoded = new Request(endpoint, { method: "POST", body: form });
	const contentType = encoded.headers.get("content-type") ?? "";
	const wire = new Uint8Array(await encoded.arrayBuffer());
	const hash = (bytes: Uint8Array) =>
		createHash("sha256").update(bytes).digest("hex");
	if (apiKey !== undefined && Buffer.from(wire).includes(Buffer.from(apiKey)))
		throw new TransportError("CREDENTIAL_IN_PROMPT", "unknown");
	try {
		await stat(input.outputPath);
		throw new TransportError("OUTPUT_ALREADY_EXISTS", "unknown");
	} catch (error) {
		if (!(error instanceof Error && "code" in error && error.code === "ENOENT"))
			throw error;
	}
	await mkdir(dirname(input.outputPath), { recursive: true });
	const requestPath = `${input.outputPath}.request.json`;
	const receiptPath = `${input.outputPath}.receipt.json`;
	const requestRecord = {
		...record,
		wirePromptSHA256: hash(
			new TextEncoder().encode(conditions.prompt.replace(/\r?\n/g, "\r\n")),
		),
		wirePromptNewlines: "multipart-crlf",
		wire: { contentType, bytes: wire.length, sha256: hash(wire) },
	};
	try {
		await writeReceipt(requestPath, requestRecord);
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "EEXIST")
			throw new TransportError("REQUEST_ALREADY_RECORDED", "unknown");
		throw error;
	}
	const wireFile = await open(`${input.outputPath}.request.bin`, "wx", 0o600);
	try {
		await wireFile.writeFile(wire);
	} finally {
		await wireFile.close();
	}
	const request = new Request(endpoint, {
		method: "POST",
		body: wire,
		redirect: "error",
		signal: AbortSignal.timeout(120000),
		headers: {
			"content-type": contentType,
			...(apiKey === undefined ? {} : { authorization: `Bearer ${apiKey}` }),
		},
	});
	let response: Response;
	let body: Uint8Array;
	try {
		response = await (input.send ?? fetch)(request);
		body = new Uint8Array(await response.arrayBuffer());
	} catch (error) {
		if (!(error instanceof TypeError || error instanceof DOMException))
			throw error;
		await writeReceipt(receiptPath, {
			...requestRecord,
			status: "unknown",
			failure: "NETWORK_FAILURE",
			modelAttestation: "UNKNOWN",
		});
		throw new TransportError("NETWORK_FAILURE", "unknown");
	}
	const responseRecord = {
		...requestRecord,
		status: response.status,
		responseBodySHA256: hash(body),
	};
	const fail = async (
		code: TransportErrorCode,
		attestation: Record<string, unknown> = {},
	): Promise<never> => {
		await writeReceipt(receiptPath, {
			...responseRecord,
			...attestation,
			failure: code,
		});
		throw new TransportError(code, response.status);
	};
	if (apiKey !== undefined && Buffer.from(body).includes(Buffer.from(apiKey)))
		return fail("INVALID_RESPONSE");
	const responseFile = await open(
		`${input.outputPath}.response.bin`,
		"wx",
		0o600,
	);
	try {
		await responseFile.writeFile(body);
	} finally {
		await responseFile.close();
	}
	if (!response.ok)
		return fail(
			conditions.generationProfile && [400, 422].includes(response.status)
				? "GENERATION_SIZE_UNSUPPORTED"
				: "HTTP_FAILURE",
		);
	let payload: unknown;
	try {
		payload = JSON.parse(
			new TextDecoder("utf-8", { fatal: true }).decode(body),
		);
	} catch {
		return fail("INVALID_RESPONSE");
	}
	const envelope = z
		.object({
			model: z.string().min(1).nullish(),
			model_snapshot: z.string().min(1).nullish(),
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
	const images = z
		.object({ data: z.tuple([z.object({ b64_json: z.string().min(1) })]) })
		.safeParse(payload);
	if (!images.success) return fail("INVALID_RESPONSE", attestation);
	const image = images.data.data[0].b64_json;
	const bytes = Buffer.from(image, "base64");
	const actualCanvas =
		bytes.length >= 24 &&
		bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
			? [bytes.readUInt32BE(16), bytes.readUInt32BE(20)]
			: null;
	const diagnostics = {
		...attestation,
		requestedSize: size,
		actualCanvas,
		sizeContract: actualCanvas?.join("x") === size ? "MATCH" : "FAIL",
		failures: [
			...(returnedModel === null
				? ["MODEL_NOT_EXPOSED"]
				: returnedModel !== conditions.model
					? ["MODEL_MISMATCH"]
					: []),
			...(actualCanvas?.join("x") === size ? [] : ["GENERATION_SIZE_MISMATCH"]),
		],
	};
	if (returnedModel === null) return fail("MODEL_NOT_EXPOSED", diagnostics);
	if (returnedModel !== conditions.model)
		return fail("MODEL_MISMATCH", diagnostics);
	try {
		if (bytes.toString("base64") !== image)
			return await fail("INVALID_RESPONSE", attestation);
		validatePortraitPng(bytes, conditions.generationProfile);
	} catch (error) {
		if (error instanceof PngDecodeError)
			return fail("INVALID_RESPONSE", diagnostics);
		throw error;
	}
	const receipt = {
		...responseRecord,
		...attestation,
		...(conditions.generationProfile === "cpa340-padded-v1" ? diagnostics : {}),
		responseSHA: hash(bytes),
		reviewStatus: "candidate-unreviewed",
	};
	const output = await open(input.outputPath, "wx", 0o600);
	try {
		await output.writeFile(bytes);
	} finally {
		await output.close();
	}
	await writeReceipt(receiptPath, receipt);
	return {
		bytes: new Uint8Array(bytes),
		requestPath,
		responseSHA: receipt.responseSHA,
		responseStatus: response.status,
		receipt,
	};
}
