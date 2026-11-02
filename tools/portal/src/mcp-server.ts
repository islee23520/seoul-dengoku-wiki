#!/usr/bin/env node
import { z } from "zod";
import {
	failure,
	invokeManagement,
	managementCommandSchema,
	operations,
	selfDescription,
} from "./management.ts";

const idSchema = z.union([z.string(), z.number().int()]);
const messageSchema = z.object({
	jsonrpc: z.literal("2.0"),
	id: idSchema.optional(),
	method: z.string().min(1),
	params: z.unknown().optional(),
});
const initializeSchema = z.object({
	protocolVersion: z.string(),
	capabilities: z.record(z.string(), z.unknown()),
	clientInfo: z.object({ name: z.string(), version: z.string() }),
});
const callSchema = z.object({
	name: z.string(),
	arguments: z.unknown().optional(),
	_meta: z.unknown().optional(),
});
const readSchema = z.object({ uri: z.string(), _meta: z.unknown().optional() });
const cancelSchema = z.object({ requestId: idSchema });
const emptySchema = z.object({ _meta: z.unknown().optional() });
const resources = [
	{
		uri: "portal://self",
		name: "portal-self-description",
		mimeType: "application/json",
		description: "Management capabilities and transport limits.",
	},
	{
		uri: "portal://operations",
		name: "portal-operation-catalog",
		mimeType: "application/json",
		description: "Shared operation schemas and effects.",
	},
] as const;
class ProtocolError extends Error {
	readonly name = "ProtocolError";
	constructor(
		readonly code: number,
		message: string,
	) {
		super(message);
	}
}
function parseParams<T>(schema: z.ZodType<T>, params: unknown): T {
	const parsed = schema.safeParse(params ?? {});
	if (!parsed.success) throw new ProtocolError(-32602, "INVALID_PARAMS");
	return parsed.data;
}
function write(value: object) {
	process.stdout.write(`${JSON.stringify(value)}\n`);
}

// allow: SIZE_OK - One stdio protocol lifecycle, request cancellation, and framing state machine.
async function main() {
	let phase: "new" | "negotiated" | "ready" = "new";
	const lifetime = new AbortController();
	const requests = new Map<z.infer<typeof idSchema>, AbortController>();
	const pending = new Set<Promise<void>>();
	async function dispatch(
		message: z.infer<typeof messageSchema>,
		signal: AbortSignal,
	): Promise<object> {
		switch (message.method) {
			case "initialize": {
				if (phase !== "new")
					throw new ProtocolError(-32600, "ALREADY_INITIALIZED");
				const params = parseParams(initializeSchema, message.params);
				const supported = [
					"2024-11-05",
					"2025-03-26",
					"2025-06-18",
					"2025-11-25",
				];
				phase = "negotiated";
				return {
					protocolVersion: supported.includes(params.protocolVersion)
						? params.protocolVersion
						: "2025-11-25",
					capabilities: {
						tools: { listChanged: false },
						resources: { subscribe: false, listChanged: false },
					},
					serverInfo: {
						name: selfDescription.name,
						version: selfDescription.version,
					},
				};
			}
			case "ping":
				parseParams(emptySchema, message.params);
				return {};
		}
		if (phase !== "ready") throw new ProtocolError(-32000, "NOT_INITIALIZED");
		switch (message.method) {
			case "tools/list":
				parseParams(emptySchema, message.params);
				return {
					tools: operations
						.filter((operation) => operation.transports.includes("mcp"))
						.map(({ name, description, inputSchema, annotations }) => ({
							name,
							description,
							inputSchema,
							annotations,
						})),
				};
			case "tools/call": {
				const params = parseParams(callSchema, message.params);
				const operation = operations.find(
					(item) =>
						item.name === params.name && item.transports.includes("mcp"),
				);
				const name = managementCommandSchema.safeParse(params.name);
				const report = operation
					? await invokeManagement(
							operation.name,
							params.arguments === undefined ? {} : params.arguments,
							signal,
						)
					: failure(name.success ? name.data : null, "OPERATION_NOT_EXPOSED");
				return {
					content: [{ type: "text", text: JSON.stringify(report) }],
					structuredContent: report,
					isError: !report.ok,
				};
			}
			case "resources/list":
				parseParams(emptySchema, message.params);
				return { resources };
			case "resources/templates/list":
				parseParams(emptySchema, message.params);
				return { resourceTemplates: [] };
			case "resources/read": {
				const params = parseParams(readSchema, message.params);
				const resource = resources.find((item) => item.uri === params.uri);
				if (!resource) throw new ProtocolError(-32002, "RESOURCE_NOT_FOUND");
				return {
					contents: [
						{
							uri: resource.uri,
							mimeType: "application/json",
							text: JSON.stringify(
								resource.uri === "portal://self"
									? selfDescription
									: { operations },
							),
						},
					],
				};
			}
			default:
				throw new ProtocolError(-32601, "METHOD_NOT_FOUND");
		}
	}
	async function receive(line: string) {
		let id: z.infer<typeof idSchema> | null = null;
		try {
			let raw: unknown;
			try {
				raw = JSON.parse(line);
			} catch (error) {
				if (error instanceof SyntaxError)
					throw new ProtocolError(-32700, "PARSE_ERROR");
				throw error;
			}
			const parsed = messageSchema.safeParse(raw);
			if (!parsed.success) throw new ProtocolError(-32600, "INVALID_REQUEST");
			const message = parsed.data;
			if (message.id === undefined) {
				switch (message.method) {
					case "notifications/initialized":
						if (
							phase === "negotiated" &&
							emptySchema.safeParse(message.params ?? {}).success
						)
							phase = "ready";
						return;
					case "notifications/cancelled": {
						const params = cancelSchema.safeParse(message.params);
						if (params.success) requests.get(params.data.requestId)?.abort();
						return;
					}
					default:
						return;
				}
			}
			id = message.id;
			if (requests.has(id))
				throw new ProtocolError(-32600, "DUPLICATE_REQUEST_ID");
			const controller = new AbortController();
			requests.set(id, controller);
			try {
				const result = await dispatch(
					message,
					AbortSignal.any([lifetime.signal, controller.signal]),
				);
				if (!controller.signal.aborted && !lifetime.signal.aborted)
					write({ jsonrpc: "2.0", id, result });
			} finally {
				requests.delete(id);
			}
		} catch (error) {
			write({
				jsonrpc: "2.0",
				id,
				error: {
					code: error instanceof ProtocolError ? error.code : -32603,
					message:
						error instanceof ProtocolError ? error.message : "INTERNAL_ERROR",
				},
			});
		}
	}
	const shutdown = () => {
		lifetime.abort();
		process.stdin.destroy();
	};
	process.once("SIGINT", shutdown);
	process.once("SIGTERM", shutdown);
	let buffer = "";
	process.stdin.setEncoding("utf8");
	try {
		for await (const chunk of process.stdin) {
			buffer += String(chunk);
			let newline = buffer.indexOf("\n");
			while (newline >= 0) {
				const line = buffer.slice(0, newline);
				buffer = buffer.slice(newline + 1);
				if (Buffer.byteLength(line) > 16777216)
					throw new ProtocolError(-32600, "MESSAGE_TOO_LARGE");
				const task = receive(line);
				pending.add(task);
				void task.finally(() => pending.delete(task));
				newline = buffer.indexOf("\n");
			}
			if (Buffer.byteLength(buffer) > 16777216)
				throw new ProtocolError(-32600, "MESSAGE_TOO_LARGE");
		}
	} catch (error) {
		if (!lifetime.signal.aborted) {
			console.error(
				JSON.stringify({
					error:
						error instanceof ProtocolError
							? error.message
							: "MCP_TRANSPORT_FAILED",
				}),
			);
			process.exitCode = 1;
		}
	} finally {
		lifetime.abort();
		await Promise.all(pending);
		process.removeListener("SIGINT", shutdown);
		process.removeListener("SIGTERM", shutdown);
	}
}
await main();
