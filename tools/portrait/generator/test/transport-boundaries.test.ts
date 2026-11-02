import { afterEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import { z } from "zod";
import { sendPortraitRequest } from "../src/transport.js";
import { createTransportFixture } from "./transport-fixture.js";

const crc32 = (bytes: Uint8Array): number => {
	let crc = 0xffffffff;
	for (const byte of bytes) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit += 1)
			crc = (crc >>> 1) ^ ((crc & 1) === 1 ? 0xedb88320 : 0);
	}
	return (crc ^ 0xffffffff) >>> 0;
};

const chunk = (type: string, body: Uint8Array): Uint8Array => {
	const output = Buffer.alloc(body.length + 12);
	output.writeUInt32BE(body.length, 0);
	output.write(type, 4, 4, "ascii");
	Buffer.from(body).copy(output, 8);
	output.writeUInt32BE(
		crc32(output.subarray(4, 8 + body.length)),
		8 + body.length,
	);
	return output;
};

const png = (scanlineBytes: number): string => {
	const header = Buffer.alloc(13);
	header.writeUInt32BE(1024, 0);
	header.writeUInt32BE(1536, 4);
	header.set([8, 6, 0, 0, 0], 8);
	const raw = new Uint8Array(scanlineBytes);
	const bytes = Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		chunk("IHDR", header),
		chunk("IDAT", deflateSync(raw)),
		chunk("IEND", new Uint8Array()),
	]);
	return bytes.toString("base64");
};

const compressedPng = (compressed: Uint8Array): string => {
	const header = Buffer.alloc(13);
	header.writeUInt32BE(1024, 0);
	header.writeUInt32BE(1536, 4);
	header.set([8, 6, 0, 0, 0], 8);
	return Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		chunk("IHDR", header),
		chunk("IDAT", compressed),
		chunk("IEND", new Uint8Array()),
	]).toString("base64");
};

describe("transport response evidence boundaries", () => {
	let server: Server | undefined;
	let directory: string | undefined;
	afterEach(async () => {
		if (server?.listening) {
			const closed = once(server, "close", {
				signal: AbortSignal.timeout(5000),
			});
			server.closeAllConnections();
			server.close();
			await closed;
		}
		if (directory !== undefined) await rm(directory, { recursive: true });
		server = undefined;
		directory = undefined;
	});

	const run = async (responseBody: string) => {
		const fixture = createTransportFixture();
		directory = await mkdtemp(join(tmpdir(), "portrait-transport-boundary-"));
		let calls = 0;
		server = createServer((_request, response) => {
			calls += 1;
			response.statusCode = 200;
			response.setHeader("content-type", "application/json");
			response.end(responseBody);
		});
		const listening = once(server, "listening", {
			signal: AbortSignal.timeout(5000),
		});
		server.listen(0, "127.0.0.1");
		await listening;
		const address = server.address();
		if (address === null || typeof address === "string")
			throw new Error("Expected loopback address");
		const outputPath = join(directory, "candidate.png");
		const request = {
			projection: fixture.projection,
			orderedImageBytes: fixture.orderedImageBytes,
			connection: {
				baseUrl: `http://127.0.0.1:${address.port}/v1`,
				allowUnauthenticated: true,
			},
			requestId: "boundary-case",
			outputPath,
		};
		return { fixture, outputPath, request, calls: () => calls };
	};

	for (const [name, body] of [
		["malformed JSON", "{"],
		[
			"missing IDAT",
			JSON.stringify({
				data: [
					{
						b64_json:
							"iVBORw0KGgoAAAANSUhEUgAAAQAAAAAGAAIAAACm+8X6AAAAAElFTkSuQmCC",
					},
				],
			}),
		],
		[
			"short decoded scanlines",
			JSON.stringify({ data: [{ b64_json: png(16) }] }),
		],
		[
			"missing image data",
			JSON.stringify({ data: [{ b64_json: "bm90LXBuZw==" }] }),
		],
	] as const) {
		test(`records HTTP 200 and blocks retry for ${name}`, async () => {
			const context = await run(body);
			await expect(sendPortraitRequest(context.request)).rejects.toMatchObject({
				code: "INVALID_RESPONSE",
				status: 200,
			});
			const receipt = z
				.object({
					status: z.number(),
					failure: z.string(),
					responseBodyBase64: z.string(),
				})
				.parse(
					JSON.parse(
						await readFile(`${context.outputPath}.receipt.json`, "utf8"),
					),
				);
			expect(receipt).toMatchObject({
				status: 200,
				failure: "INVALID_RESPONSE",
			});
			expect(receipt.responseBodyBase64).toBe(
				Buffer.from(body).toString("base64"),
			);
			await expect(readFile(context.outputPath)).rejects.toMatchObject({
				code: "ENOENT",
			});
			await expect(sendPortraitRequest(context.request)).rejects.toMatchObject({
				code: "REQUEST_ALREADY_RECORDED",
			});
			expect(context.calls()).toBe(1);
		});
	}

	for (const [name, image] of [
		["corrupt IDAT", compressedPng(new Uint8Array([0, 0, 0, 0]))],
		[
			"oversized inflation",
			compressedPng(deflateSync(new Uint8Array(6_292_993))),
		],
	] as const) {
		test(`records HTTP 200 and blocks retry for ${name}`, async () => {
			const body = JSON.stringify({ data: [{ b64_json: image }] });
			const context = await run(body);
			await expect(sendPortraitRequest(context.request)).rejects.toMatchObject({
				name: "TransportError",
				code: "INVALID_RESPONSE",
				status: 200,
			});
			const receipt = z
				.object({
					status: z.number(),
					failure: z.string(),
					responseBodyBase64: z.string(),
					responseBodySHA: z.string(),
				})
				.parse(
					JSON.parse(
						await readFile(`${context.outputPath}.receipt.json`, "utf8"),
					),
				);
			expect(receipt).toMatchObject({
				status: 200,
				failure: "INVALID_RESPONSE",
			});
			expect(receipt.responseBodyBase64).toBe(
				Buffer.from(body).toString("base64"),
			);
			expect(receipt.responseBodySHA).toBe(
				createHash("sha256").update(body).digest("hex"),
			);
			await expect(readFile(context.outputPath)).rejects.toMatchObject({
				code: "ENOENT",
			});
			await expect(sendPortraitRequest(context.request)).rejects.toMatchObject({
				code: "REQUEST_ALREADY_RECORDED",
			});
			expect(context.calls()).toBe(1);
		});
	}

	test("request record preserves exact prompt and ordered reference bytes without credentials", async () => {
		const context = await run("{}");
		await expect(sendPortraitRequest(context.request)).rejects.toMatchObject({
			code: "INVALID_RESPONSE",
		});
		const record = z
			.object({ prompt: z.string(), referenceImages: z.array(z.string()) })
			.parse(
				JSON.parse(
					await readFile(`${context.outputPath}.request.json`, "utf8"),
				),
			);
		expect(record.prompt).toBe(context.fixture.projection.text);
		expect(record.referenceImages).toEqual(
			context.fixture.orderedImageBytes.map((bytes) =>
				Buffer.from(bytes).toString("base64"),
			),
		);
		expect(JSON.stringify(record)).not.toContain("apiKey");
	});
});
