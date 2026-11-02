import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { readFile, rename, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { join } from "node:path";
import {
	sendPortraitRequest,
	TransportError,
} from "../../portrait/generator/src/transport.ts";
import type { RegisteredEndpoint } from "./connections.ts";
import { McpError, type McpPortraitInput } from "./mcp.ts";
import { PORTRAIT_SIZE } from "./png.ts";
import { portraitOutput } from "./portrait-size.ts";
import { defaultProviderModel, type ProviderModel } from "./provider-models.ts";
import { hash } from "./sources.ts";

export { dispatchLocalReferenceV2 } from "./reference-provider.ts";

// A one-job loopback relay observes the canonical transport's actual multipart
// bytes, bounds the upstream exchange, and keeps user credentials out of its
// canonical request/receipt records. It is not an MCP endpoint.
export async function dispatchLocal(
	input: McpPortraitInput,
	options: {
		directory: string;
		model?: ProviderModel;
		outbound: <T>(
			start: (endpoint: RegisteredEndpoint, key: string, baseUrl?: string) => T,
		) => T;
	},
) {
	options.outbound((_endpoint, key) => {
		if (input.projection.text.includes(key))
			throw new McpError("CREDENTIAL_IN_PROMPT");
	});
	const store = (name: string, bytes: Uint8Array | string) =>
		writeFile(join(options.directory, name), bytes, {
			flag: "wx",
			mode: 0o600,
		});
	await store("projection.txt", input.projection.text);
	await store("projection.json", JSON.stringify(input.projection));
	const relayKey = randomBytes(32).toString("base64url");
	let started = false;
	let responseBytes = Buffer.alloc(0);
	let relayFailure: string | null = null;
	let accepted = false;
	const relay = createServer(async (req, res) => {
		try {
			if (
				accepted ||
				req.method !== "POST" ||
				req.url !== "/images/edits" ||
				req.headers.authorization !== `Bearer ${relayKey}`
			) {
				res.writeHead(403).end();
				return;
			}
			accepted = true;
			const chunks: Buffer[] = [];
			let size = 0;
			for await (const chunk of req) {
				size += chunk.length;
				if (size > 16777216) throw Error("LOCAL_REQUEST_TOO_LARGE");
				chunks.push(Buffer.from(chunk));
			}
			let raw = Buffer.concat(chunks);
			const contentType = req.headers["content-type"] ?? "";
			if (options.model && options.model !== defaultProviderModel) {
				const field = Buffer.from(
					`name="model"\r\n\r\n${defaultProviderModel}\r\n`,
				);
				const offset = raw.indexOf(field);
				if (offset < 0) throw Error("LOCAL_INVALID_REQUEST");
				raw = Buffer.concat([
					raw.subarray(0, offset),
					Buffer.from(`name="model"\r\n\r\n${options.model}\r\n`),
					raw.subarray(offset + field.length),
				]);
			}
			options.outbound((_endpoint, apiKey) => {
				if (raw.includes(Buffer.from(apiKey)))
					throw Error("CREDENTIAL_IN_PROMPT");
			});
			await store("provider-request.bin", raw);
			await store(
				"provider-request.json",
				JSON.stringify({
					transport: "openai-compatible-http",
					contentType,
					bytes: raw.length,
					sha256: hash(raw),
				}),
			);
			let key = "";
			const upstream = await options.outbound((_endpoint, apiKey, baseUrl) => {
				if (!baseUrl) throw Error("CONNECTION_NOT_READY");
				if (raw.includes(Buffer.from(apiKey)))
					throw Error("CREDENTIAL_IN_PROMPT");
				key = apiKey;
				started = true;
				return fetch(`${baseUrl.replace(/\/+$/, "")}/images/edits`, {
					method: "POST",
					headers: {
						"content-type": contentType,
						authorization: `Bearer ${apiKey}`,
					},
					body: raw,
					redirect: "error",
					signal: AbortSignal.timeout(120000),
				});
			});
			if (!upstream.body) throw Error("LOCAL_INVALID_RESPONSE");
			const reader = upstream.body.getReader();
			const parts: Buffer[] = [];
			let total = 0;
			try {
				for (;;) {
					const { done, value } = await reader.read();
					if (done) break;
					total += value.length;
					if (total > 12582912) {
						await reader.cancel();
						throw Error("LOCAL_RESPONSE_TOO_LARGE");
					}
					parts.push(Buffer.from(value));
				}
			} finally {
				reader.releaseLock();
			}
			const bytes = Buffer.concat(parts);
			if (bytes.includes(Buffer.from(key)))
				throw Error("LOCAL_CREDENTIAL_IN_RESPONSE");
			responseBytes = bytes;
			await store("provider-response.bin", bytes);
			await store(
				"provider-response.json",
				JSON.stringify({
					transport: "openai-compatible-http",
					status: upstream.status,
					bytes: bytes.length,
					sha256: hash(bytes),
				}),
			);
			res
				.writeHead(upstream.status, { "content-type": "application/json" })
				.end(bytes);
		} catch (error) {
			relayFailure =
				error instanceof Error &&
				[
					"CONNECTION_NOT_READY",
					"CREDENTIAL_IN_PROMPT",
					"LOCAL_REQUEST_TOO_LARGE",
					"LOCAL_RESPONSE_TOO_LARGE",
					"LOCAL_CREDENTIAL_IN_RESPONSE",
				].includes(error.message)
					? error.message
					: "LOCAL_NETWORK_FAILURE";
			res.destroy();
		}
	});
	const ready = once(relay, "listening", { signal: AbortSignal.timeout(5000) });
	relay.listen(0, "127.0.0.1");
	await ready;
	try {
		const address = relay.address();
		if (!address || typeof address === "string")
			throw Error("LOCAL_RELAY_ADDRESS");
		const result = await sendPortraitRequest({
			...input,
			connection: {
				baseUrl: `http://127.0.0.1:${address.port}`,
				apiKey: relayKey,
			},
			outputPath: join(options.directory, "candidate.png"),
		});
		const receiptPath = join(options.directory, "candidate.png.receipt.json");
		const canonicalReceipt = await readFile(receiptPath);
		const model = options.model ?? defaultProviderModel;
		await rename(
			receiptPath,
			join(options.directory, "provider-canonical.receipt.json"),
		);
		await rename(
			join(options.directory, "candidate.png"),
			join(options.directory, "provider-source.png"),
		);
		const requestPath = join(options.directory, "candidate.png.request.json");
		const request = JSON.parse(await readFile(requestPath, "utf8"));
		await rename(
			requestPath,
			join(options.directory, "provider-canonical.request.json"),
		);
		await store(
			"candidate.png.request.json",
			`${JSON.stringify({ ...request, model, size: PORTRAIT_SIZE, providerSize: request.size })}\n`,
		);
		const output = portraitOutput(result.bytes, canonicalReceipt);
		const candidateReceipt = JSON.parse(output.receiptBytes.toString("utf8"));
		candidateReceipt.model = model;
		await store("candidate.png", output.bytes);
		await store(
			"candidate.png.receipt.json",
			`${JSON.stringify(candidateReceipt)}\n`,
		);
		return {
			...result,
			bytes: output.bytes,
			responseSHA: output.responseSHA,
			model: options.model ?? defaultProviderModel,
			responseBytes,
		};
	} catch (error) {
		if (error instanceof TransportError)
			throw new McpError(
				relayFailure ?? `LOCAL_${error.code}`,
				started &&
					(relayFailure !== null ||
						error.code === "NETWORK_FAILURE" ||
						error.code === "INVALID_RESPONSE"),
				responseBytes,
			);
		throw error;
	} finally {
		relay.closeAllConnections();
		await new Promise<void>((resolve) => relay.close(() => resolve()));
	}
}
