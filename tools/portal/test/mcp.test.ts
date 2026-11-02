import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { EventEmitter, once } from "node:events";
import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from "node:http";
import { deflateSync } from "node:zlib";
import { createAuth } from "../src/auth.ts";
import { loadConfig } from "../src/config.ts";
import { createConnectionRegistry } from "../src/connections.ts";
import {
	connectMcp,
	createMcpProtocolVerifier,
	MCP_PROFILE,
	type McpEndpointRegistration,
	McpError,
	type McpPortraitInput,
	PORTRAIT_TOOL,
	PORTRAIT_TOOL_DIGEST,
} from "../src/mcp.ts";

const sha = (value: string | Uint8Array) =>
	createHash("sha256").update(value).digest("hex");
function fakePng() {
	const chunk = (name: string, body: Buffer) => {
		const data = Buffer.concat([Buffer.from(name), body]);
		let crc = 0xffffffff;
		for (const byte of data) {
			crc ^= byte;
			for (let i = 0; i < 8; i++)
				crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
		}
		const length = Buffer.alloc(4),
			checksum = Buffer.alloc(4);
		length.writeUInt32BE(body.length);
		checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
		return Buffer.concat([length, data, checksum]);
	};
	const header = Buffer.alloc(13);
	header.writeUInt32BE(1024);
	header.writeUInt32BE(1536, 4);
	header[8] = 8;
	header[9] = 6;
	return Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		chunk("IHDR", header),
		chunk("IDAT", deflateSync(Buffer.alloc((1024 * 4 + 1) * 1536))),
		chunk("IEND", Buffer.alloc(0)),
	]);
}
const image = fakePng();
const rendering = {
	references: [
		{
			id: "inline",
			role: "recipient-appearance-only",
			properties: [],
			sourceSHA: sha(image),
		},
	],
};
const prompt = `${JSON.stringify(rendering, null, 2).split("\n").join("\r\n")}\r\n`;
const input: McpPortraitInput = {
	requestId: "11111111-1111-4111-8111-111111111111",
	projection: {
		rendering,
		text: prompt,
		textSHA: sha(prompt),
		renderingSHA: sha(JSON.stringify(rendering)),
		sourceSHA: "a".repeat(64),
		providerCalls: 0,
		dispatched: false,
	},
	orderedImageBytes: [image],
};
const receipt = `${JSON.stringify(
	{
		requestId: input.requestId,
		model: "gpt-image-2.5-sunburst",
		textSHA: input.projection.textSHA,
		renderingSHA: input.projection.renderingSHA,
		sourceSHA: input.projection.sourceSHA,
		referenceHashes: [sha(image)],
		responseSHA: sha(image),
		status: 200,
		reviewStatus: "candidate-unreviewed",
	},
	null,
	2,
)}\n`;
type Rpc = { id?: number; method: string; params?: Record<string, unknown> };
type Reply = (rpc: Rpc, res: ServerResponse) => void;
async function bridge(
	options: {
		initialize?: Record<string, unknown>;
		tool?: unknown;
		call?: Reply;
		notifyStatus?: number;
		notifyBody?: string;
		session?: string;
	} = {},
) {
	const events = new EventEmitter();
	const requests: {
		rpc: Rpc;
		headers: IncomingMessage["headers"];
		url: string | undefined;
	}[] = [];
	const server = createServer(async (req, res) => {
		const chunks: Buffer[] = [];
		for await (const chunk of req) chunks.push(Buffer.from(chunk));
		const rpc: Rpc = JSON.parse(Buffer.concat(chunks).toString());
		requests.push({ rpc, headers: req.headers, url: req.url });
		const json = (result: unknown) => {
			res.writeHead(200, {
				"content-type": "application/json",
				...(rpc.method === "initialize"
					? { "mcp-session-id": options.session ?? "inline-session" }
					: {}),
			});
			res.end(JSON.stringify({ jsonrpc: "2.0", id: rpc.id, result }));
		};
		if (rpc.method === "initialize")
			json(
				options.initialize ?? {
					protocolVersion: MCP_PROFILE,
					capabilities: { tools: {} },
					serverInfo: { name: "inline-bridge", version: "1" },
				},
			);
		else if (rpc.method === "notifications/initialized") {
			res.writeHead(options.notifyStatus ?? 202);
			res.end(options.notifyBody ?? "");
		} else if (rpc.method === "tools/list")
			json({ tools: [options.tool ?? PORTRAIT_TOOL] });
		else {
			events.emit("request-consumed", Buffer.concat(chunks).length);
			if (options.call) options.call(rpc, res);
			else
				json({
					content: [
						{
							type: "image",
							mimeType: "image/png",
							data: image.toString("base64"),
						},
						{ type: "text", text: receipt },
					],
					structuredContent: JSON.parse(receipt),
				});
		}
	});
	const ready = once(server, "listening", {
		signal: AbortSignal.timeout(2000),
	});
	server.listen(0, "127.0.0.1");
	await ready;
	const address = server.address();
	if (!address || typeof address === "string") throw Error("fixture address");
	const registration: McpEndpointRegistration = {
		endpointId: "inline-test-bridge",
		revision: "inline-reviewed-v1",
		endpoint: `http://127.0.0.1:${address.port}/mcp`,
		origin: "https://portal.example",
		protocolVersion: MCP_PROFILE,
		toolName: PORTRAIT_TOOL.name,
		toolSchemaDigest: PORTRAIT_TOOL_DIGEST,
		egress: { kind: "test-loopback", address: "127.0.0.1" },
	};
	return {
		events,
		requests,
		registration,
		connect: (beforeRequest = () => {}) =>
			connectMcp({
				registry: [registration],
				endpointId: registration.endpointId,
				outbound: (start) => {
					beforeRequest();
					return start(registration, "inline-bridge-only");
				},
			}),
		close: () =>
			new Promise<void>((resolve, reject) => {
				server.close((error) => (error ? reject(error) : resolve()));
				server.closeAllConnections();
			}),
	};
}
test("actual HTTP handshake binds exact profile, registered tool and portrait bytes", async () => {
	const fixture = await bridge();
	let gates = 0;
	try {
		const client = await fixture.connect(() => {
			gates++;
		});
		const result = await client.callPortrait(input);
		expect(result.bytes).toEqual(image);
		expect(result.receiptBytes).toEqual(Buffer.from(receipt));
		expect(result.responseSHA).toBe(sha(image));
		expect(result.responseBytes).toEqual(
			Buffer.from(
				JSON.stringify({
					jsonrpc: "2.0",
					id: 3,
					result: {
						content: [
							{
								type: "image",
								mimeType: "image/png",
								data: image.toString("base64"),
							},
							{ type: "text", text: receipt },
						],
						structuredContent: JSON.parse(receipt),
					},
				}),
			),
		);
		expect(gates).toBe(4);
		expect(fixture.requests.map((x) => x.rpc.method)).toEqual([
			"initialize",
			"notifications/initialized",
			"tools/list",
			"tools/call",
		]);
		for (const [i, request] of fixture.requests.entries()) {
			expect(request.url).toBe("/mcp");
			expect(request.headers.authorization).toBe("Bearer inline-bridge-only");
			expect(request.headers.origin).toBe("https://portal.example");
			expect(request.headers.accept).toBe(
				"application/json, text/event-stream",
			);
			expect(request.headers["content-type"]).toBe("application/json");
			if (i) {
				expect(request.headers["mcp-protocol-version"]).toBe(MCP_PROFILE);
				expect(request.headers["mcp-session-id"]).toBe("inline-session");
			}
		}
		expect(fixture.requests[0]?.rpc.params).toEqual({
			protocolVersion: MCP_PROFILE,
			capabilities: {},
			clientInfo: { name: "tools-portal", version: "1" },
		});
		expect(fixture.requests[3]?.rpc.params).toEqual({
			name: PORTRAIT_TOOL.name,
			arguments: {
				requestId: input.requestId,
				model: "gpt-image-2.5-sunburst",
				prompt,
				rendering,
				textSHA: input.projection.textSHA,
				renderingSHA: input.projection.renderingSHA,
				sourceSHA: input.projection.sourceSHA,
				referenceHashes: [sha(image)],
				referenceImages: [image.toString("base64")],
			},
		});
		await expect(client.callPortrait(input)).rejects.toMatchObject({
			code: "MCP_REQUEST_ALREADY_DISPATCHED",
			uncertain: false,
		});
	} finally {
		await fixture.close();
	}
});
for (const [label, options, code] of [
	[
		"wrong version",
		{
			initialize: {
				protocolVersion: "2025-03-26",
				capabilities: { tools: {} },
				serverInfo: { name: "fake", version: "1" },
			},
		},
		"MCP_VERSION_MISMATCH",
	],
	[
		"missing tools capability",
		{
			initialize: {
				protocolVersion: MCP_PROFILE,
				capabilities: {},
				serverInfo: { name: "fake", version: "1" },
			},
		},
		"MCP_CAPABILITY_MISMATCH",
	],
	[
		"schema drift",
		{ tool: { ...PORTRAIT_TOOL, inputSchema: { type: "object" } } },
		"MCP_TOOL_MISMATCH",
	],
	[
		"foreign tool",
		{ tool: { ...PORTRAIT_TOOL, name: "other" } },
		"MCP_TOOL_MISMATCH",
	],
	["notification requires 202", { notifyStatus: 200 }, "MCP_INVALID_RESPONSE"],
	[
		"notification requires empty body",
		{ notifyBody: "not empty" },
		"MCP_INVALID_RESPONSE",
	],
	["invalid session header", { session: "has space" }, "MCP_INVALID_RESPONSE"],
] as const)
	test(label, async () => {
		const fixture = await bridge(options);
		try {
			await expect(fixture.connect()).rejects.toMatchObject({
				code,
				uncertain: false,
			});
			expect(fixture.requests.some((x) => x.rpc.method === "tools/call")).toBe(
				false,
			);
		} finally {
			await fixture.close();
		}
	});
test("registry and public address policy reject before any network", async () => {
	const fixture = await bridge();
	try {
		for (const address of [
			"127.0.0.1",
			"10.1.2.3",
			"169.254.169.254",
			"100.64.0.1",
			"192.168.1.1",
			"0.0.0.0",
			"224.0.0.1",
			"::1",
			"::ffff:127.0.0.1",
			"192.0.2.1",
			"198.18.0.1",
		]) {
			await expect(
				connectMcp({
					registry: [
						{
							...fixture.registration,
							endpoint: "https://reviewed.example/mcp",
							egress: { kind: "public", address },
						},
					],
					endpointId: fixture.registration.endpointId,
					outbound: (start) => start(fixture.registration, "inline"),
				}),
			).rejects.toMatchObject({ code: "MCP_EGRESS_REJECTED" });
		}
		await expect(
			connectMcp({
				registry: [],
				endpointId: fixture.registration.endpointId,
				outbound: (start) => start(fixture.registration, "inline"),
			}),
		).rejects.toMatchObject({ code: "MCP_ENDPOINT_NOT_REGISTERED" });
		await expect(
			connectMcp({
				registry: [
					{ ...fixture.registration, toolSchemaDigest: "0".repeat(64) },
				],
				endpointId: fixture.registration.endpointId,
				outbound: (start) => start(fixture.registration, "inline"),
			}),
		).rejects.toMatchObject({ code: "MCP_TOOL_MISMATCH" });
		expect(fixture.requests).toHaveLength(0);
	} finally {
		await fixture.close();
	}
});
test("live gate blocks tools/call and projection mismatch is local", async () => {
	const fixture = await bridge();
	let allowed = true;
	try {
		const client = await fixture.connect(() => {
			if (!allowed) throw Error("CONNECTION_NOT_READY");
		});
		await expect(
			client.callPortrait({
				...input,
				projection: { ...input.projection, textSHA: "0".repeat(64) },
			}),
		).rejects.toMatchObject({ code: "MCP_PROJECTION_MISMATCH" });
		allowed = false;
		await expect(client.callPortrait(input)).rejects.toThrow(
			"CONNECTION_NOT_READY",
		);
		expect(fixture.requests).toHaveLength(3);
	} finally {
		await fixture.close();
	}
});
test("redirect never reaches second origin or forwards bridge bearer", async () => {
	const sink = await bridge();
	const fixture = await bridge({
		call: (_rpc, res) => {
			res.writeHead(307, { location: sink.registration.endpoint });
			res.end();
		},
	});
	try {
		const client = await fixture.connect();
		await expect(client.callPortrait(input)).rejects.toMatchObject({
			code: "MCP_REDIRECT_REJECTED",
			uncertain: true,
		});
		await expect(
			client.callPortrait({
				...input,
				requestId: "22222222-2222-4222-8222-222222222222",
			}),
		).rejects.toMatchObject({ code: "MCP_CONNECTION_CLOSED" });
		expect(fixture.requests).toHaveLength(4);
		expect(sink.requests).toHaveLength(0);
	} finally {
		await fixture.close();
		await sink.close();
	}
});
test("consumed incomplete SSE is uncertain and blocks a different UUID", async () => {
	const wire = "data: {";
	const fixture = await bridge({
		call: (_rpc, res) => {
			res.writeHead(200, { "content-type": "text/event-stream" });
			res.end(wire);
		},
	});
	try {
		const client = await fixture.connect();
		const consumed = once(fixture.events, "request-consumed", {
			signal: AbortSignal.timeout(2000),
		});
		const pending = client.callPortrait(input).catch((error: unknown) => error);
		expect((await consumed)[0]).toBeGreaterThan(0);
		const error = await pending;
		const nextError: unknown = await client
			.callPortrait({
				...input,
				requestId: "22222222-2222-4222-8222-222222222222",
			})
			.catch((error: unknown) => error);
		expect(error).toBeInstanceOf(McpError);
		expect(error).toMatchObject({ responseBytes: Buffer.from(wire) });
		expect(error).toMatchObject({ uncertain: true });
		expect(nextError).toMatchObject({ code: "MCP_CONNECTION_CLOSED" });
		expect(fixture.requests).toHaveLength(4);
	} finally {
		await fixture.close();
	}
});
test("SSE correlates JSON-RPC ID, accepts priming event and retains exact wire bytes", async () => {
	let wire = "";
	const fixture = await bridge({
		call: (rpc, res) => {
			wire = `: comment\r\nid: prime\r\ndata:\r\n\r\nevent: message\r\nid: opaque-event-id\r\ndata: ${JSON.stringify(
				{
					jsonrpc: "2.0",
					id: rpc.id,
					result: {
						content: [
							{
								type: "image",
								mimeType: "image/png",
								data: image.toString("base64"),
							},
							{ type: "text", text: receipt },
						],
						structuredContent: JSON.parse(receipt),
					},
				},
			)}\r\n\r\n`;
			res.writeHead(200, { "content-type": "text/event-stream" });
			res.end(wire);
		},
	});
	try {
		const result = await (await fixture.connect()).callPortrait(input);
		expect(result.bytes).toEqual(image);
		expect(result.receiptBytes).toEqual(Buffer.from(receipt));
		expect(result.responseBytes).toEqual(Buffer.from(wire));
	} finally {
		await fixture.close();
	}
});
for (const [label, body, type, code, uncertain] of [
	["malformed JSON", "{", "application/json", "MCP_INVALID_RESPONSE", true],
	[
		"invalid JSON UTF-8",
		Buffer.from([0xff]),
		"application/json",
		"MCP_INVALID_RESPONSE",
		true,
	],
	[
		"invalid SSE UTF-8",
		Buffer.from([0xff]),
		"text/event-stream",
		"MCP_INVALID_RESPONSE",
		true,
	],
	[
		"wrong JSON id",
		'{"jsonrpc":"2.0","id":999,"result":{}}',
		"application/json",
		"MCP_INVALID_RESPONSE",
		true,
	],
	[
		"wrong SSE id",
		'data: {"jsonrpc":"2.0","id":999,"result":{}}\n\n',
		"text/event-stream",
		"MCP_INVALID_RESPONSE",
		true,
	],
	[
		"malformed SSE JSON",
		"data: {\n\n",
		"text/event-stream",
		"MCP_INVALID_RESPONSE",
		true,
	],
	[
		"incomplete SSE event",
		"data: {",
		"text/event-stream",
		"MCP_INVALID_RESPONSE",
		true,
	],
	[
		"SSE no outcome",
		"id: prime\ndata:\n\n",
		"text/event-stream",
		"MCP_DISPATCH_UNCERTAIN",
		true,
	],
	["unknown content type", "plain", "text/plain", "MCP_INVALID_RESPONSE", true],
	[
		"malformed RPC envelope",
		'{"jsonrpc":"2.0","id":3}',
		"application/json",
		"MCP_INVALID_RESPONSE",
		true,
	],
	[
		"wrong RPC error id",
		'{"jsonrpc":"2.0","id":999,"error":{"code":-32603,"message":"inline"}}',
		"application/json",
		"MCP_INVALID_RESPONSE",
		true,
	],
	[
		"remote resource",
		'{"jsonrpc":"2.0","id":3,"result":{"content":[{"type":"resource_link","uri":"https://provider.example/private"}]}}',
		"application/json",
		"MCP_INVALID_RESPONSE",
		false,
	],
	[
		"tool failure",
		'{"jsonrpc":"2.0","id":3,"result":{"isError":true,"content":[]}}',
		"application/json",
		"MCP_TOOL_FAILURE",
		false,
	],
	[
		"RPC failure",
		'{"jsonrpc":"2.0","id":3,"error":{"code":-32603,"message":"secret server detail"}}',
		"application/json",
		"MCP_RPC_FAILURE",
		false,
	],
	[
		"SSE RPC failure",
		'data: {"jsonrpc":"2.0","id":3,"error":{"code":-32603,"message":"inline"}}\n\n',
		"text/event-stream",
		"MCP_RPC_FAILURE",
		false,
	],
] as const)
	test(label, async () => {
		const fixture = await bridge({
			call: (rpc, res) => {
				res.writeHead(200, { "content-type": type });
				res.end(
					typeof body === "string"
						? body.replace('"id":3', `"id":${rpc.id}`)
						: body,
				);
			},
		});
		try {
			const client = await fixture.connect();
			const error: unknown = await client
				.callPortrait(input)
				.catch((error: unknown) => error);
			expect(error).toMatchObject({
				code,
				uncertain,
			});
			if (type !== "text/plain")
				expect(error).toMatchObject({ responseBytes: Buffer.from(body) });
			if (uncertain) {
				await expect(
					client.callPortrait({
						...input,
						requestId: "22222222-2222-4222-8222-222222222222",
					}),
				).rejects.toMatchObject({ code: "MCP_CONNECTION_CLOSED" });
				expect(fixture.requests).toHaveLength(4);
			} else {
				await expect(
					client.callPortrait({
						...input,
						requestId: "22222222-2222-4222-8222-222222222222",
					}),
				).rejects.toMatchObject({ code, uncertain: false });
				expect(fixture.requests).toHaveLength(5);
			}
		} finally {
			await fixture.close();
		}
	});
for (const headers of [
	{ "content-type": "application/json", "mcp-session-id": "other-session" },
	{ "content-type": "text/plain" },
	{},
])
	test(`uncorrelated headers ${JSON.stringify(headers)} stop dispatch`, async () => {
		const fixture = await bridge({
			call: (rpc, res) => {
				res.writeHead(200, headers);
				res.end(JSON.stringify({ jsonrpc: "2.0", id: rpc.id, result: {} }));
			},
		});
		try {
			const client = await fixture.connect();
			await expect(client.callPortrait(input)).rejects.toMatchObject({
				code: "MCP_INVALID_RESPONSE",
				uncertain: true,
			});
			await expect(
				client.callPortrait({
					...input,
					requestId: "22222222-2222-4222-8222-222222222222",
				}),
			).rejects.toMatchObject({ code: "MCP_CONNECTION_CLOSED" });
			expect(fixture.requests).toHaveLength(4);
		} finally {
			await fixture.close();
		}
	});
for (const type of ["application/json", "text/event-stream"])
	test(`${type} oversize is bounded`, async () => {
		const fixture = await bridge({
			call: (_rpc, res) => {
				res.writeHead(200, { "content-type": type });
				res.end("x".repeat(12582913));
			},
		});
		try {
			const client = await fixture.connect();
			const error: unknown = await client
				.callPortrait(input)
				.catch((error: unknown) => error);
			expect(error).toBeInstanceOf(McpError);
			if (!(error instanceof McpError)) throw Error("fixture error");
			expect(error).toMatchObject({
				code: "MCP_RESPONSE_LIMIT",
				uncertain: true,
			});
			expect(error.responseBytes.length).toBeGreaterThan(0);
			expect(error.responseBytes.length).toBeLessThanOrEqual(12582912);
			expect(error.responseBytes).toEqual(
				Buffer.alloc(error.responseBytes.length, "x"),
			);
			await expect(
				client.callPortrait({
					...input,
					requestId: "22222222-2222-4222-8222-222222222222",
				}),
			).rejects.toMatchObject({ code: "MCP_CONNECTION_CLOSED" });
			expect(fixture.requests).toHaveLength(4);
		} finally {
			await fixture.close();
		}
	});
test("disconnect after exact request-consumed event is uncertain, never retried", async () => {
	const fixture = await bridge({
		call: (_rpc, res) => {
			res.destroy();
		},
	});
	try {
		const client = await fixture.connect();
		const consumed = once(fixture.events, "request-consumed", {
			signal: AbortSignal.timeout(2000),
		});
		const pending = client.callPortrait(input).catch((error: unknown) => error);
		expect((await consumed)[0]).toBeGreaterThan(0);
		expect(await pending).toBeInstanceOf(McpError);
		expect(await pending).toMatchObject({
			code: "MCP_DISPATCH_UNCERTAIN",
			uncertain: true,
		});
		await expect(client.callPortrait(input)).rejects.toMatchObject({
			code: "MCP_CONNECTION_CLOSED",
		});
		expect(fixture.requests).toHaveLength(4);
	} finally {
		await fixture.close();
	}
});
for (const mutation of [
	"receipt-hash",
	"receipt-request",
	"image-base64",
	"invalid-png",
	"missing-structured-output",
	"structured-drift",
])
	test(`definitive ${mutation} failure preserves raw evidence`, async () => {
		let wire = "";
		const fixture = await bridge({
			call: (rpc, res) => {
				const record = JSON.parse(receipt);
				if (mutation === "receipt-hash") record.responseSHA = "0".repeat(64);
				if (mutation === "receipt-request")
					record.requestId = "22222222-2222-4222-8222-222222222222";
				const data =
					mutation === "image-base64"
						? `${image.toString("base64")}!`
						: mutation === "invalid-png"
							? Buffer.from("inline invalid PNG").toString("base64")
							: image.toString("base64");
				wire = JSON.stringify({
					jsonrpc: "2.0",
					id: rpc.id,
					result: {
						content: [
							{ type: "image", mimeType: "image/png", data },
							{ type: "text", text: JSON.stringify(record) },
						],
						...(mutation === "missing-structured-output"
							? {}
							: {
									structuredContent:
										mutation === "structured-drift"
											? { ...record, sourceSHA: "0".repeat(64) }
											: record,
								}),
					},
				});
				res.writeHead(200, { "content-type": "application/json" });
				res.end(wire);
			},
		});
		try {
			const error: unknown = await (await fixture.connect())
				.callPortrait(input)
				.catch((error: unknown) => error);
			expect(error).toMatchObject({
				code: "MCP_INVALID_RESPONSE",
				uncertain: false,
				responseBytes: Buffer.from(wire),
			});
		} finally {
			await fixture.close();
		}
	});
test("404 session loss does not reconnect and explicit close prevents further dispatch", async () => {
	const fixture = await bridge({
		call: (_rpc, res) => {
			res.writeHead(404);
			res.end();
		},
	});
	try {
		const client = await fixture.connect();
		await expect(client.callPortrait(input)).rejects.toMatchObject({
			code: "MCP_HTTP_FAILURE",
			uncertain: true,
		});
		client.close();
		await expect(
			client.callPortrait({
				...input,
				requestId: "22222222-2222-4222-8222-222222222222",
			}),
		).rejects.toMatchObject({ code: "MCP_CONNECTION_CLOSED" });
		expect(fixture.requests).toHaveLength(4);
	} finally {
		await fixture.close();
	}
});
test("registry protocol verifier re-verifies full signed token for each HTTP POST", async () => {
	const fixture = await bridge();
	const config = loadConfig({
		PORTAL_SESSION_SECRET: "inline-session-secret".repeat(3),
	});
	let now = 100000;
	const auth = createAuth(config, undefined, () => now);
	const token = auth.issue({ id: "42", login: "inline-owner" });
	const verifiedTokens: string[] = [];
	const adapter = createMcpProtocolVerifier({ egress: [fixture.registration] });
	const { endpointId, revision, protocolVersion, toolName, toolSchemaDigest } =
		fixture.registration;
	const registry = createConnectionRegistry({
		verifySession: (signedToken) => {
			verifiedTokens.push(signedToken);
			return auth.verify(signedToken);
		},
		endpoints: [
			{ endpointId, revision, protocolVersion, toolName, toolSchemaDigest },
		],
		verifyProtocol: adapter.verifyProtocol,
		now: () => now,
	});
	try {
		expect(registry.authenticate(`${token}tampered`)).toBeNull();
		expect(fixture.requests).toHaveLength(0);
		const context = registry.authenticate(token);
		if (!context) throw Error("signed fixture session");
		const binding = await registry.connect(context, {
			endpointId,
			bridgeBearer: "inline-bridge-only",
		});
		expect(binding.ownerId).toBe("42");
		expect(binding.expiresAt).toBe(100000 + 28800000);
		expect(binding.state).toBe("READY");
		const before = verifiedTokens.length;
		const result = await adapter.callPortrait(binding, input, (start) =>
			registry.dispatch(context, binding, start),
		);
		expect(result.bytes).toEqual(image);
		expect(verifiedTokens.length).toBe(before + 1);
		expect(
			verifiedTokens.slice(1).every((signedToken) => signedToken === token),
		).toBe(true);
		now = binding.expiresAt;
		await expect(
			adapter.callPortrait(
				binding,
				{ ...input, requestId: "22222222-2222-4222-8222-222222222222" },
				(start) => registry.dispatch(context, binding, start),
			),
		).rejects.toThrow("CONNECTION_NOT_READY");
		expect(fixture.requests).toHaveLength(4);
		adapter.close(binding.connectionId);
	} finally {
		await fixture.close();
	}
});
test("revoked signed session blocks initialize without trusting client owner fields", async () => {
	const fixture = await bridge();
	const auth = createAuth(
		loadConfig({ PORTAL_SESSION_SECRET: "inline-secret".repeat(4) }),
	);
	const token = auth.issue({ id: "42", login: "inline-owner" });
	const adapter = createMcpProtocolVerifier({ egress: [fixture.registration] });
	const { endpointId, revision, protocolVersion, toolName, toolSchemaDigest } =
		fixture.registration;
	const registry = createConnectionRegistry({
		verifySession: auth.verify,
		endpoints: [
			{ endpointId, revision, protocolVersion, toolName, toolSchemaDigest },
		],
		verifyProtocol: adapter.verifyProtocol,
	});
	try {
		const context = registry.authenticate(token);
		if (!context) throw Error("signed fixture session");
		auth.logout(token);
		await expect(
			registry.connect(context, {
				endpointId,
				bridgeBearer: "inline-bridge-only",
				ownerId: "7",
			}),
		).rejects.toThrow("CONNECTION_NOT_READY");
		expect(fixture.requests).toHaveLength(0);
	} finally {
		await fixture.close();
	}
});
test("real HTTP ready owner revocation makes zero next requests", async () => {
	const fixture = await bridge();
	const auth = createAuth(
		loadConfig({ PORTAL_SESSION_SECRET: "inline-revoke-secret".repeat(3) }),
	);
	const token = auth.issue({ id: "42", login: "inline-owner" });
	const adapter = createMcpProtocolVerifier({ egress: [fixture.registration] });
	const { endpointId, revision, protocolVersion, toolName, toolSchemaDigest } =
		fixture.registration;
	const registry = createConnectionRegistry({
		verifySession: auth.verify,
		endpoints: [
			{ endpointId, revision, protocolVersion, toolName, toolSchemaDigest },
		],
		verifyProtocol: adapter.verifyProtocol,
	});
	try {
		const context = registry.authenticate(token);
		if (!context) throw Error("signed fixture session");
		const binding = await registry.connect(context, {
			endpointId,
			bridgeBearer: "inline-bridge-only",
		});
		expect(fixture.requests).toHaveLength(3);
		expect(binding.endpointRevision).toBe(revision);
		expect(binding.toolName).toBe(toolName);
		expect(binding.toolSchemaDigest).toBe(toolSchemaDigest);
		auth.logout(token);
		await expect(
			adapter.callPortrait(binding, input, (start) =>
				registry.dispatch(context, binding, start),
			),
		).rejects.toThrow("CONNECTION_NOT_READY");
		expect(fixture.requests).toHaveLength(3);
		adapter.close(binding.connectionId);
	} finally {
		await fixture.close();
	}
});
