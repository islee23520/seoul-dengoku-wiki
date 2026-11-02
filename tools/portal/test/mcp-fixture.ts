import { once } from "node:events";
import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from "node:http";
import { z } from "zod";
import {
	MCP_PROFILE,
	type McpEndpointRegistration,
	PORTRAIT_TOOL,
	PORTRAIT_TOOL_DIGEST,
} from "../src/mcp.ts";
import { hash } from "../src/sources.ts";

export const rpcSchema = z.object({
	jsonrpc: z.literal("2.0"),
	id: z.number().optional(),
	method: z.string(),
	params: z
		.object({
			arguments: z
				.object({
					requestId: z.string(),
					model: z.string(),
					prompt: z.string(),
					textSHA: z.string(),
					renderingSHA: z.string(),
					sourceSHA: z.string(),
					referenceHashes: z.array(z.string()),
					referenceImages: z.array(z.string()),
				})
				.optional(),
		})
		.optional(),
});
export type Rpc = z.infer<typeof rpcSchema>;
export function portraitReply(rpc: Rpc, bytes: Uint8Array) {
	const args = rpc.params?.arguments;
	if (!args) throw Error("arguments");
	const receipt = {
		requestId: args.requestId,
		model: "gpt-image-2.5-sunburst",
		textSHA: args.textSHA,
		renderingSHA: args.renderingSHA,
		sourceSHA: args.sourceSHA,
		referenceHashes: args.referenceHashes,
		responseSHA: hash(bytes),
		status: 200,
		reviewStatus: "candidate-unreviewed",
	};
	return {
		jsonrpc: "2.0",
		id: rpc.id,
		result: {
			content: [
				{
					type: "image",
					mimeType: "image/png",
					data: Buffer.from(bytes).toString("base64"),
				},
				{ type: "text", text: JSON.stringify(receipt) },
			],
			structuredContent: receipt,
		},
	};
}
export async function mcpFixture(
	handler: (
		rpc: Rpc,
		req: IncomingMessage,
		res: ServerResponse,
	) => void | Promise<void>,
	before?: (rpc: Rpc, res: ServerResponse) => boolean | Promise<boolean>,
) {
	const requests: {
		rpc: Rpc;
		authorization: string | undefined;
		bytes: Buffer;
	}[] = [];
	const server = createServer(async (req, res) => {
		const chunks: Buffer[] = [];
		for await (const chunk of req) chunks.push(Buffer.from(chunk));
		const bytes = Buffer.concat(chunks);
		const rpc = rpcSchema.parse(JSON.parse(bytes.toString()));
		requests.push({ rpc, authorization: req.headers.authorization, bytes });
		if (await before?.(rpc, res)) return;
		if (rpc.method === "tools/call") return handler(rpc, req, res);
		if (rpc.method === "notifications/initialized") {
			res.writeHead(202).end();
			return;
		}
		res.writeHead(200, {
			"content-type": "application/json",
			...(rpc.method === "initialize"
				? { "mcp-session-id": "private-fixture-session" }
				: {}),
		});
		res.end(
			JSON.stringify({
				jsonrpc: "2.0",
				id: rpc.id,
				result:
					rpc.method === "initialize"
						? {
								protocolVersion: MCP_PROFILE,
								capabilities: { tools: {} },
								serverInfo: { name: "owned-fixture", version: "1" },
							}
						: { tools: [PORTRAIT_TOOL] },
			}),
		);
	});
	const ready = once(server, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	server.listen(0, "127.0.0.1");
	await ready;
	const address = server.address();
	if (!address || typeof address === "string") throw Error("address");
	const registration: McpEndpointRegistration = {
		endpointId: "owned-fixture",
		revision: "fixture-v1",
		protocolVersion: MCP_PROFILE,
		toolName: PORTRAIT_TOOL.name,
		toolSchemaDigest: PORTRAIT_TOOL_DIGEST,
		endpoint: `http://127.0.0.1:${address.port}/mcp`,
		origin: "https://portal.example",
		egress: { kind: "test-loopback", address: "127.0.0.1" },
	};
	return {
		registration,
		requests,
		server,
		close: () =>
			new Promise<void>((resolve, reject) => {
				server.close((error) => (error ? reject(error) : resolve()));
				server.closeAllConnections();
			}),
	};
}

export async function connectOwned(
	origin: string,
	headers: Record<string, string>,
	bridgeBearer: string,
) {
	const response = await fetch(`${origin}/tools/api/connections`, {
		method: "POST",
		headers,
		body: JSON.stringify({ endpointId: "owned-fixture", bridgeBearer }),
	});
	const result = z
		.object({
			connection: z.object({
				connectionId: z.string(),
				state: z.literal("READY"),
			}),
		})
		.parse(await response.json());
	if (response.status !== 201) throw Error("connection");
	return result.connection.connectionId;
}
