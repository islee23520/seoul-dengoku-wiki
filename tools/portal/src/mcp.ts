import { createHash } from "node:crypto";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import { checkServerIdentity } from "node:tls";
import { z } from "zod";
import {
	PngDecodeError,
	validatePortraitPng,
} from "../../portrait/generator/src/png.ts";
import type { PortraitRequestInput } from "../../portrait/generator/src/transport.ts";
import type {
	ConnectionSnapshot,
	ProtocolVerifier,
	RegisteredEndpoint,
} from "./connections.ts";

export const MCP_PROFILE = "2025-11-25" as const;
const REQUEST_LIMIT = 16777216;
const RESPONSE_LIMIT = 12582912;
const sha = (bytes: string | Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);
const argumentsSchema = z.strictObject({
	requestId: z.uuid(),
	model: z.literal("gpt-image-2.5-sunburst"),
	prompt: z.string().min(1).max(1048576),
	rendering: z.record(z.string(), z.unknown()),
	textSHA: hashSchema,
	renderingSHA: hashSchema,
	sourceSHA: hashSchema,
	referenceHashes: z.array(hashSchema).min(1).max(20),
	referenceImages: z.array(z.string().min(1).max(11184812)).min(1).max(20),
});
const receiptSchema = z.strictObject({
	requestId: z.uuid(),
	model: z.literal("gpt-image-2.5-sunburst"),
	textSHA: hashSchema,
	renderingSHA: hashSchema,
	sourceSHA: hashSchema,
	referenceHashes: z.array(hashSchema).min(1).max(20),
	responseSHA: hashSchema,
	status: z.literal(200),
	reviewStatus: z.literal("candidate-unreviewed"),
});
// This adapter is a single deployment contract, not a generic tool dispatcher.
// Digest the exact JSON tool definition, including ordered schema arrays.
export const PORTRAIT_TOOL = Object.freeze({
	name: "portrait_image_edit_v1",
	inputSchema: z.toJSONSchema(argumentsSchema),
	outputSchema: z.toJSONSchema(receiptSchema),
});
export const PORTRAIT_TOOL_DIGEST = sha(JSON.stringify(PORTRAIT_TOOL));

export type McpEndpointRegistration = RegisteredEndpoint &
	Readonly<{
		endpoint: string;
		origin: string;
		egress:
			| Readonly<{ kind: "public"; address: string }>
			| Readonly<{ kind: "test-loopback"; address: "127.0.0.1" }>;
	}>;
export type McpOutbound = Parameters<ProtocolVerifier>[0]["outbound"];
export type McpPortraitInput = Pick<
	PortraitRequestInput,
	"projection" | "orderedImageBytes" | "requestId"
>;
export type McpPortraitResult = Readonly<{
	bytes: Uint8Array;
	receiptBytes: Uint8Array;
	responseBytes: Uint8Array;
	responseSHA: string;
	responseStatus: number;
}>;
export type McpTransport = Readonly<{
	endpointId: string;
	profile: typeof MCP_PROFILE;
	toolSchemaDigest: string;
	callPortrait(
		input: McpPortraitInput,
		outbound?: McpOutbound,
	): Promise<McpPortraitResult>;
	close(): void;
}>;
export class McpError extends Error {
	constructor(
		readonly code: string,
		readonly uncertain = false,
		readonly responseBytes: Uint8Array = new Uint8Array(),
	) {
		super(code);
		this.name = "McpError";
	}
}
function fail(code: string): never {
	throw new McpError(code);
}
function publicAddress(address: string) {
	// This registration profile deliberately permits only public IPv4 sockets.
	// IPv6, mapped addresses and all special-use ranges require a new review.
	if (isIP(address) !== 4) return false;
	const [a = 0, b = 0] = address.split(".").map(Number);
	return !(
		a === 0 ||
		a === 10 ||
		a === 127 ||
		a >= 224 ||
		(a === 100 && b >= 64 && b <= 127) ||
		(a === 169 && b === 254) ||
		(a === 172 && b >= 16 && b <= 31) ||
		(a === 192 && (b === 0 || b === 168 || b === 88)) ||
		(a === 198 && (b === 18 || b === 19 || b === 51)) ||
		(a === 203 && b === 0)
	);
}
const envelopeSchema = z.object({
	jsonrpc: z.literal("2.0"),
	id: z.number().int(),
	result: z.record(z.string(), z.unknown()).optional(),
	error: z.object({ code: z.number().int(), message: z.string() }).optional(),
});
type RpcResult = Record<string, unknown> & {
	protocolVersion?: unknown;
	capabilities?: unknown;
	serverInfo?: unknown;
	tools?: unknown;
	nextCursor?: unknown;
	isError?: unknown;
};
function decodeMessage(bytes: Uint8Array | string, id: number) {
	try {
		const text =
			typeof bytes === "string"
				? bytes
				: new TextDecoder("utf-8", { fatal: true }).decode(bytes);
		const message = envelopeSchema.parse(JSON.parse(text));
		if (
			message.id !== id ||
			(message.result === undefined) === (message.error === undefined)
		)
			fail("MCP_INVALID_RESPONSE");
		if (message.error) fail("MCP_RPC_FAILURE");
		return (message.result ?? fail("MCP_INVALID_RESPONSE")) as RpcResult;
	} catch (error) {
		if (error instanceof McpError) throw error;
		return fail("MCP_INVALID_RESPONSE");
	}
}

export async function connectMcp(
	options: Readonly<{
		registry: readonly McpEndpointRegistration[];
		endpointId: string;
		outbound: McpOutbound;
	}>,
): Promise<McpTransport> {
	const matches = options.registry.filter(
		(entry) => entry.endpointId === options.endpointId,
	);
	const entry = matches[0];
	if (matches.length !== 1 || !entry) fail("MCP_ENDPOINT_NOT_REGISTERED");
	const registration = { ...entry, egress: { ...entry.egress } };
	if (registration.protocolVersion !== MCP_PROFILE)
		fail("MCP_VERSION_MISMATCH");
	if (registration.toolName !== PORTRAIT_TOOL.name) fail("MCP_TOOL_MISMATCH");
	if (registration.toolSchemaDigest !== PORTRAIT_TOOL_DIGEST)
		fail("MCP_TOOL_MISMATCH");
	let url: URL, origin: URL;
	try {
		url = new URL(registration.endpoint);
		origin = new URL(registration.origin);
	} catch {
		return fail("MCP_EGRESS_REJECTED");
	}
	if (
		url.href !== registration.endpoint ||
		url.username ||
		url.password ||
		url.hash ||
		url.search ||
		origin.origin !== registration.origin ||
		origin.protocol !== "https:"
	)
		fail("MCP_EGRESS_REJECTED");
	const loopback = registration.egress.kind === "test-loopback";
	if (
		loopback
			? process.env.NODE_ENV !== "test" ||
				url.protocol !== "http:" ||
				url.hostname !== "127.0.0.1" ||
				registration.egress.address !== "127.0.0.1" ||
				!url.port
			: url.protocol !== "https:" ||
				isIP(url.hostname) !== 0 ||
				!publicAddress(registration.egress.address)
	)
		fail("MCP_EGRESS_REJECTED");
	let session: string | undefined;
	let closed = false;
	let nextId = 1;
	const dispatched = new Set<string>();
	const active = new Set<ReturnType<typeof httpRequest>>();
	const close = () => {
		closed = true;
		session = undefined;
		for (const request of active) request.destroy();
	};
	const post = (
		method: string,
		params: unknown,
		call = false,
		onDispatch?: () => void,
		outbound: McpOutbound = options.outbound,
	) => {
		if (closed) fail("MCP_CONNECTION_CLOSED");
		const notification = method === "notifications/initialized";
		const id = notification ? undefined : nextId++;
		const body = Buffer.from(
			JSON.stringify({
				jsonrpc: "2.0",
				...(id === undefined ? {} : { id }),
				method,
				...(params === undefined ? {} : { params }),
			}),
		);
		if (body.length > REQUEST_LIMIT) fail("MCP_REQUEST_LIMIT");
		const headers = {
			accept: "application/json, text/event-stream",
			"content-type": "application/json",
			"content-length": String(body.length),
			host: url.host,
			origin: registration.origin,
			...(method === "initialize"
				? {}
				: { "MCP-Protocol-Version": MCP_PROFILE }),
			...(session ? { "MCP-Session-Id": session } : {}),
		};
		// No DNS lookup occurs: connect to the registered public address directly,
		// while TLS verification/SNI and HTTP Host use the reviewed hostname.
		const requestOptions = {
			hostname: registration.egress.address,
			port: url.port || (loopback ? 80 : 443),
			path: url.pathname,
			method: "POST",
			headers,
			agent: false as const,
			...(loopback
				? {}
				: {
						servername: url.hostname,
						rejectUnauthorized: true,
						checkServerIdentity: (
							_hostname: string,
							certificate: Parameters<typeof checkServerIdentity>[1],
						) => checkServerIdentity(url.hostname, certificate),
					}),
		};
		return outbound((endpoint, bearer) => {
			if (closed) fail("MCP_CONNECTION_CLOSED");
			if (
				endpoint.endpointId !== registration.endpointId ||
				endpoint.revision !== registration.revision ||
				endpoint.protocolVersion !== registration.protocolVersion ||
				endpoint.toolName !== registration.toolName ||
				endpoint.toolSchemaDigest !== registration.toolSchemaDigest
			)
				fail("MCP_ENDPOINT_BINDING_MISMATCH");
			if (!/^[A-Za-z0-9\-._~+/]+=*$/.test(bearer) || bearer.length > 8192)
				fail("MCP_INVALID_CREDENTIAL");
			if (call && body.includes(bearer)) fail("MCP_CREDENTIAL_IN_PROMPT");
			return new Promise<{ result: RpcResult; bytes: Buffer; status: number }>(
				(resolve, reject) => {
					let settled = false;
					const chunks: Buffer[] = [];
					let size = 0,
						pending = "";
					const decoder = new TextDecoder("utf-8", { fatal: true });
					let request: ReturnType<typeof httpRequest>;
					const finish = (
						error?: McpError,
						result: RpcResult = {},
						status = 200,
					) => {
						if (settled) return;
						settled = true;
						clearTimeout(deadline);
						active.delete(request);
						if (error) {
							// Only decodeMessage's valid, matching RPC error establishes
							// an outcome here. Candidate validation happens after post.
							const uncertain =
								error.uncertain || (call && error.code !== "MCP_RPC_FAILURE");
							if (uncertain) close();
							reject(
								new McpError(error.code, uncertain, Buffer.concat(chunks)),
							);
						} else resolve({ result, bytes: Buffer.concat(chunks), status });
						request.destroy();
					};
					const lost = () =>
						finish(
							new McpError(
								call ? "MCP_DISPATCH_UNCERTAIN" : "MCP_NETWORK_FAILURE",
								call,
							),
						);
					const deadline = setTimeout(lost, 120000);
					request = (loopback ? httpRequest : httpsRequest)(
						{
							...requestOptions,
							headers: { ...headers, authorization: `Bearer ${bearer}` },
						},
						(response) => {
							const status = response.statusCode ?? 0;
							if (status >= 300 && status < 400)
								return finish(new McpError("MCP_REDIRECT_REJECTED"));
							if (
								notification &&
								status >= 200 &&
								status < 300 &&
								status !== 202
							)
								return finish(new McpError("MCP_INVALID_RESPONSE"));
							if (status !== (notification ? 202 : 200))
								return finish(new McpError("MCP_HTTP_FAILURE"));
							if (method === "initialize") {
								const value = response.headers["mcp-session-id"];
								if (
									value !== undefined &&
									(typeof value !== "string" ||
										!/^[\x21-\x7e]{1,1024}$/.test(value))
								)
									return finish(new McpError("MCP_INVALID_RESPONSE"));
								session = value;
							} else if (
								response.headers["mcp-session-id"] !== undefined &&
								response.headers["mcp-session-id"] !== session
							)
								return finish(new McpError("MCP_INVALID_RESPONSE"));
							const type = String(response.headers["content-type"] ?? "")
								.split(";")[0]
								?.trim();
							if (
								!notification &&
								type !== "application/json" &&
								type !== "text/event-stream"
							)
								return finish(new McpError("MCP_INVALID_RESPONSE"));
							response.on("error", lost);
							response.on("aborted", lost);
							response.on("data", (chunk: Buffer) => {
								if (settled) return;
								size += chunk.length;
								if (size > RESPONSE_LIMIT)
									return finish(new McpError("MCP_RESPONSE_LIMIT"));
								chunks.push(Buffer.from(chunk));
								if (notification && size)
									return finish(new McpError("MCP_INVALID_RESPONSE"));
								if (type !== "text/event-stream") return;
								try {
									pending += decoder.decode(chunk, { stream: true });
									let match = /\r\n\r\n|\n\n|\r\r/.exec(pending);
									while (match) {
										const event = pending.slice(0, match.index);
										pending = pending.slice(match.index + match[0].length);
										const data = event
											.split(/\r\n|\n|\r/)
											.filter(
												(line) => line === "data" || line.startsWith("data:"),
											)
											.map((line) => line.slice(5).replace(/^ /, ""))
											.join("\n");
										if (data) {
											const message: unknown = JSON.parse(data);
											const notificationMessage = z
												.strictObject({
													jsonrpc: z.literal("2.0"),
													method: z.literal("notifications/progress"),
													params: z.object({
														progressToken: z.union([z.string(), z.number()]),
														progress: z.number(),
														total: z.number().optional(),
														message: z.string().optional(),
													}),
												})
												.safeParse(message);
											if (!notificationMessage.success)
												return finish(
													undefined,
													decodeMessage(data, id ?? 0),
													status,
												);
										}
										match = /\r\n\r\n|\n\n|\r\r/.exec(pending);
									}
								} catch (error) {
									finish(
										error instanceof McpError
											? error
											: new McpError("MCP_INVALID_RESPONSE"),
									);
								}
							});
							response.on("end", () => {
								if (settled) return;
								try {
									if (notification) return finish(undefined, {}, status);
									if (type === "text/event-stream") {
										pending += decoder.decode();
										if (pending.trim())
											return finish(new McpError("MCP_INVALID_RESPONSE"));
										return lost();
									}
									finish(
										undefined,
										decodeMessage(Buffer.concat(chunks), id ?? 0),
										status,
									);
								} catch (error) {
									finish(
										error instanceof McpError
											? error
											: new McpError("MCP_INVALID_RESPONSE"),
									);
								}
							});
						},
					);
					active.add(request);
					request.on("error", lost);
					onDispatch?.();
					request.end(body);
				},
			);
		});
	};
	try {
		const initialized = await post("initialize", {
			protocolVersion: MCP_PROFILE,
			capabilities: {},
			clientInfo: { name: "tools-portal", version: "1" },
		});
		if (initialized.result.protocolVersion !== MCP_PROFILE)
			fail("MCP_VERSION_MISMATCH");
		const capabilities = z
			.object({ tools: z.object({ listChanged: z.boolean().optional() }) })
			.safeParse(initialized.result.capabilities);
		if (!capabilities.success) fail("MCP_CAPABILITY_MISMATCH");
		if (
			!z
				.object({ name: z.string().min(1), version: z.string().min(1) })
				.safeParse(initialized.result.serverInfo).success
		)
			fail("MCP_INVALID_RESPONSE");
		await post("notifications/initialized", undefined);
		const listed = await post("tools/list", {});
		const tools = listed.result.tools;
		if (
			!Array.isArray(tools) ||
			tools.length !== 1 ||
			listed.result.nextCursor !== undefined ||
			sha(JSON.stringify(tools[0])) !== registration.toolSchemaDigest
		)
			fail("MCP_TOOL_MISMATCH");
	} catch (error) {
		close();
		throw error;
	}
	return Object.freeze({
		endpointId: registration.endpointId,
		profile: MCP_PROFILE,
		toolSchemaDigest: registration.toolSchemaDigest,
		close,
		async callPortrait(
			input: McpPortraitInput,
			outbound: McpOutbound = options.outbound,
		): Promise<McpPortraitResult> {
			if (closed) fail("MCP_CONNECTION_CLOSED");
			if (dispatched.has(input.requestId))
				fail("MCP_REQUEST_ALREADY_DISPATCHED");
			const projection = input.projection;
			const referenceHashes = input.orderedImageBytes.map(sha);
			const references = projection.rendering.references ?? [];
			if (
				projection.providerCalls !== 0 ||
				projection.dispatched !== false ||
				sha(projection.text) !== projection.textSHA ||
				sha(JSON.stringify(projection.rendering)) !== projection.renderingSHA ||
				projection.text !==
					`${JSON.stringify(projection.rendering, null, 2).split("\n").join("\r\n")}\r\n` ||
				references.length !== referenceHashes.length ||
				references.some(
					(reference, i) =>
						!("sourceSHA" in reference) ||
						reference.sourceSHA !== referenceHashes[i],
				)
			)
				fail("MCP_PROJECTION_MISMATCH");
			const parsed = argumentsSchema.safeParse({
				requestId: input.requestId,
				model: "gpt-image-2.5-sunburst",
				prompt: projection.text,
				rendering: projection.rendering,
				textSHA: projection.textSHA,
				renderingSHA: projection.renderingSHA,
				sourceSHA: projection.sourceSHA,
				referenceHashes,
				referenceImages: input.orderedImageBytes.map((bytes) =>
					Buffer.from(bytes).toString("base64"),
				),
			});
			if (!parsed.success) fail("MCP_PROJECTION_MISMATCH");
			const response = await post(
				"tools/call",
				{ name: PORTRAIT_TOOL.name, arguments: parsed.data },
				true,
				() => {
					dispatched.add(input.requestId);
				},
				outbound,
			);
			try {
				if (response.result.isError === true) fail("MCP_TOOL_FAILURE");
				const result = z
					.strictObject({
						content: z.tuple([
							z.strictObject({
								type: z.literal("image"),
								mimeType: z.literal("image/png"),
								data: z.string().min(1).max(11184812),
							}),
							z.strictObject({
								type: z.literal("text"),
								text: z.string().min(1).max(1048576),
							}),
						]),
						structuredContent: receiptSchema,
						isError: z.literal(false).optional(),
					})
					.parse(response.result);
				const bytes = Buffer.from(result.content[0].data, "base64");
				if (bytes.toString("base64") !== result.content[0].data)
					fail("MCP_INVALID_RESPONSE");
				validatePortraitPng(bytes);
				const receiptBytes = Buffer.from(result.content[1].text);
				const receipt = receiptSchema.parse(JSON.parse(result.content[1].text));
				const responseSHA = sha(bytes);
				if (
					receipt.requestId !== parsed.data.requestId ||
					receipt.textSHA !== parsed.data.textSHA ||
					receipt.renderingSHA !== parsed.data.renderingSHA ||
					receipt.sourceSHA !== parsed.data.sourceSHA ||
					receipt.responseSHA !== responseSHA ||
					JSON.stringify(receipt.referenceHashes) !==
						JSON.stringify(referenceHashes) ||
					JSON.stringify(receipt) !== JSON.stringify(result.structuredContent)
				)
					fail("MCP_INVALID_RESPONSE");
				return {
					bytes,
					receiptBytes,
					responseBytes: response.bytes,
					responseSHA,
					responseStatus: response.status,
				};
			} catch (error) {
				if (error instanceof McpError)
					throw new McpError(error.code, error.uncertain, response.bytes);
				if (
					error instanceof z.ZodError ||
					error instanceof SyntaxError ||
					error instanceof PngDecodeError
				)
					throw new McpError("MCP_INVALID_RESPONSE", false, response.bytes);
				throw error;
			}
		},
	});
}

// The connection registry supplies the signed-session authority. Its outbound
// callback re-verifies the full token immediately before each native POST start.
export function createMcpProtocolVerifier(
	options: Readonly<{
		egress: readonly McpEndpointRegistration[];
	}>,
) {
	const transports = new Map<
		string,
		{ binding: ConnectionSnapshot; transport: McpTransport }
	>();
	const verifyProtocol: ProtocolVerifier = async ({ binding, outbound }) => {
		if (transports.has(binding.connectionId))
			fail("MCP_REQUEST_ALREADY_DISPATCHED");
		const transport = await connectMcp({
			registry: options.egress,
			endpointId: binding.endpointId,
			outbound,
		});
		const registration = options.egress.find(
			(entry) => entry.endpointId === binding.endpointId,
		);
		if (
			!registration ||
			binding.endpointRevision !== registration.revision ||
			binding.protocolVersion !== transport.profile ||
			binding.toolName !== PORTRAIT_TOOL.name ||
			binding.toolSchemaDigest !== transport.toolSchemaDigest
		) {
			transport.close();
			fail("MCP_ENDPOINT_BINDING_MISMATCH");
		}
		transports.set(binding.connectionId, {
			binding: Object.freeze({ ...binding }),
			transport,
		});
		return Object.freeze({
			revision: binding.revision,
			endpointId: binding.endpointId,
			endpointRevision: binding.endpointRevision,
			protocolVersion: transport.profile,
			toolName: PORTRAIT_TOOL.name,
			toolSchemaDigest: transport.toolSchemaDigest,
			tools: true,
		});
	};
	return Object.freeze({
		verifyProtocol,
		callPortrait(
			binding: ConnectionSnapshot,
			input: McpPortraitInput,
			outbound: McpOutbound,
		) {
			const row = transports.get(binding.connectionId);
			if (
				!row ||
				binding.revision !== row.binding.revision ||
				binding.endpointId !== row.binding.endpointId ||
				binding.endpointRevision !== row.binding.endpointRevision ||
				binding.protocolVersion !== row.binding.protocolVersion ||
				binding.toolName !== row.binding.toolName ||
				binding.toolSchemaDigest !== row.binding.toolSchemaDigest ||
				binding.sessionFingerprint !== row.binding.sessionFingerprint ||
				binding.ownerId !== row.binding.ownerId ||
				binding.expiresAt !== row.binding.expiresAt
			)
				fail("MCP_ENDPOINT_BINDING_MISMATCH");
			return row.transport.callPortrait(input, outbound);
		},
		close(connectionId: string) {
			transports.get(connectionId)?.transport.close();
			transports.delete(connectionId);
		},
	});
}
