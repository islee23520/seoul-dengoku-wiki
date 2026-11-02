import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ConnectionSnapshot } from "./connections.ts";
import {
	type createMcpProtocolVerifier,
	McpError,
	type McpOutbound,
	type McpPortraitInput,
	PORTRAIT_TOOL,
} from "./mcp.ts";
import { PORTRAIT_SIZE } from "./png.ts";
import { portraitOutput } from "./portrait-size.ts";
import { hash } from "./sources.ts";

export { dispatchLocalReferenceV2 } from "./reference-provider.ts";

// Evidence belongs to the exact owner-private job directory. MCP wire bytes are
// never labelled as an upstream provider response or returned as route errors.
export async function dispatch(
	input: McpPortraitInput,
	options: {
		binding: ConnectionSnapshot;
		mcp: ReturnType<typeof createMcpProtocolVerifier>;
		outbound: McpOutbound;
		directory: string;
		nextRpcId: () => number;
	},
) {
	const store = (name: string, bytes: Uint8Array | string) =>
		writeFile(join(options.directory, name), bytes, {
			flag: "wx",
			mode: 0o600,
		});
	const request = {
		requestId: input.requestId,
		model: "gpt-image-2.5-sunburst",
		prompt: input.projection.text,
		rendering: input.projection.rendering,
		textSHA: input.projection.textSHA,
		renderingSHA: input.projection.renderingSHA,
		sourceSHA: input.projection.sourceSHA,
		referenceHashes: input.orderedImageBytes.map(hash),
		referenceImages: input.orderedImageBytes.map((bytes) =>
			Buffer.from(bytes).toString("base64"),
		),
	};
	await store("projection.txt", input.projection.text);
	await store("projection.json", JSON.stringify(input.projection));
	await store(
		"candidate.png.request.json",
		`${JSON.stringify({ ...request, size: PORTRAIT_SIZE, providerSize: "1024x1536" }, null, 2)}\n`,
	);
	let wire: Buffer | null = null;
	let wireStored = false;
	const outbound: McpOutbound = (start) =>
		options.outbound((endpoint, bearer) => {
			const requestBytes = Buffer.from(
				JSON.stringify({
					jsonrpc: "2.0",
					id: options.nextRpcId(),
					method: "tools/call",
					params: { name: PORTRAIT_TOOL.name, arguments: request },
				}),
			);
			const pending = start(endpoint, bearer);
			wire = requestBytes;
			return pending;
		});
	try {
		const result = await options.mcp.callPortrait(
			options.binding,
			input,
			outbound,
		);
		if (wire) {
			await store("mcp-request.bin", wire);
			wireStored = true;
		}
		await store("mcp-response.bin", result.responseBytes);
		await store(
			"mcp-response.json",
			JSON.stringify({
				transport: "mcp-streamable-http",
				protocolVersion: options.binding.protocolVersion,
				status: result.responseStatus,
				bytes: result.responseBytes.length,
				sha256: hash(result.responseBytes),
			}),
		);
		await store("provider-canonical.receipt.json", result.receiptBytes);
		await store("provider-source.png", result.bytes);
		const output = portraitOutput(result.bytes, result.receiptBytes);
		await store("candidate.png.receipt.json", output.receiptBytes);
		await store("candidate.png", output.bytes);
		return { ...result, ...output };
	} catch (error) {
		if (wire && !wireStored) await store("mcp-request.bin", wire);
		const failure =
			error instanceof Error &&
			["CONNECTION_NOT_READY", "CONNECTION_NOT_FOUND"].includes(error.message)
				? new McpError(error.message)
				: error;
		if (failure instanceof McpError) {
			await store("mcp-response.bin", failure.responseBytes);
			await store(
				"mcp-response.json",
				JSON.stringify({
					transport: "mcp-streamable-http",
					protocolVersion: options.binding.protocolVersion,
					code: failure.code,
					uncertain: failure.uncertain,
					bytes: failure.responseBytes.length,
					sha256: hash(failure.responseBytes),
				}),
			);
		}
		throw failure;
	}
}
