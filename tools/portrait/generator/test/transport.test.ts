import { afterEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import { sendPortraitRequest, TransportError } from "../src/transport.js";
import { createTransportFixture } from "./transport-fixture.js";

const sha256 = (bytes: Uint8Array): string =>
	createHash("sha256").update(bytes).digest("hex");
const eventTimeout = () => ({ signal: AbortSignal.timeout(5000) });
const pngBytes = (): Uint8Array => {
	const crc32 = (bytes: Uint8Array): number => {
		let crc = 0xffffffff;
		for (const byte of bytes) {
			crc ^= byte;
			for (let bit = 0; bit < 8; bit += 1)
				crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
		}
		return (crc ^ 0xffffffff) >>> 0;
	};
	const chunk = (type: string, data: Uint8Array): Uint8Array => {
		const typeBytes = new TextEncoder().encode(type);
		const result = Buffer.alloc(12 + data.length);
		result.writeUInt32BE(data.length, 0);
		Buffer.from(typeBytes).copy(result, 4);
		Buffer.from(data).copy(result, 8);
		result.writeUInt32BE(
			crc32(result.subarray(4, 8 + data.length)),
			8 + data.length,
		);
		return result;
	};
	const header = Buffer.alloc(13);
	header.writeUInt32BE(1024, 0);
	header.writeUInt32BE(1536, 4);
	header.set([8, 6, 0, 0, 0], 8);
	const scanlines = new Uint8Array(1536 * (1 + 1024 * 4));
	const data = deflateSync(scanlines);
	return new Uint8Array(
		Buffer.concat([
			Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
			chunk("IHDR", header),
			chunk("IDAT", data),
			chunk("IEND", new Uint8Array()),
		]),
	);
};

describe("portrait transport request and preservation contract", () => {
	test("exposes stable typed transport error codes and status", () => {
		const error = new TransportError("NETWORK_FAILURE", "unknown");
		expect(error).toBeInstanceOf(Error);
		expect(error).toMatchObject({
			name: "TransportError",
			code: "NETWORK_FAILURE",
			status: "unknown",
		});
	});

	let server: Server | undefined;
	let directory: string | undefined;
	const teardown = async () => {
		if (server?.listening) {
			const closed = once(server, "close", eventTimeout());
			server.closeAllConnections();
			server.close();
			await closed;
		}
		if (directory !== undefined) await rm(directory, { recursive: true });
		server = undefined;
		directory = undefined;
	};
	afterEach(teardown);

	const startServer = async (
		handler: (request: Request, response: Response) => void | Promise<void>,
	) => {
		server = createServer(async (request, response) => {
			const chunks: Uint8Array[] = [];
			for await (const chunk of request) chunks.push(new Uint8Array(chunk));
			const body = Buffer.concat(chunks);
			const formRequest = new Request("http://127.0.0.1/", {
				method: "POST",
				headers: {
					"content-type": request.headers["content-type"] ?? "",
				},
				body,
			});
			await handler(formRequest, response);
		});
		const listening = once(server, "listening", eventTimeout());
		server.listen(0, "127.0.0.1");
		await listening;
		const address = server.address();
		if (address === null || typeof address === "string") {
			throw new Error("Expected loopback server address");
		}
		return `http://127.0.0.1:${address.port}`;
	};
	const makeDirectory = async () => {
		directory = await mkdtemp(join(tmpdir(), "portrait-transport-"));
		return directory;
	};
	const call = (
		baseUrl: string,
		fixture: ReturnType<typeof createTransportFixture>,
		outputPath: string,
		projectionValue: ReturnType<
			typeof createTransportFixture
		>["projection"] = fixture.projection,
		images: readonly Uint8Array[] = fixture.orderedImageBytes,
		connection: {
			baseUrl: string;
			apiKey?: string;
			allowUnauthenticated?: boolean;
		} = {
			baseUrl,
			allowUnauthenticated: true,
		},
	) =>
		sendPortraitRequest({
			projection: projectionValue,
			orderedImageBytes: images,
			connection,
			requestId: "transport-contract",
			outputPath,
		});

	test("sends exact source-bound multipart request and preserves candidate-unreviewed response", async () => {
		const fixture = createTransportFixture();
		const outputDirectory = await makeDirectory();
		const outputPath = join(outputDirectory, "portrait.png");
		const expectedPng = pngBytes();
		let calls = 0;
		let authorization: string | undefined;
		let wire: Awaited<ReturnType<Request["formData"]>> | undefined;
		const baseUrl = await startServer(async (request, response) => {
			calls += 1;
			authorization = request.headers.get("authorization") ?? undefined;
			wire = await request.formData();
			response.statusCode = 200;
			response.setHeader("content-type", "application/json");
			response.end(
				JSON.stringify({
					data: [{ b64_json: Buffer.from(expectedPng).toString("base64") }],
				}),
			);
		});
		try {
			const result = await call(baseUrl, fixture, outputPath);
			expect(calls).toBe(1);
			expect(authorization).toBeUndefined();
			expect(wire?.get("model")).toBe("gpt-image-2.5-sunburst");
			expect(wire?.get("prompt")).toBe(fixture.projection.text);
			expect(wire?.get("size")).toBe("1024x1536");
			expect(wire?.get("n")).toBe("1");
			const images = wire?.getAll("image[]") ?? [];
			expect(
				images.map((part) => (part instanceof Blob ? part.type : "not-file")),
			).toEqual(fixture.orderedImageBytes.map(() => "image/png"));
			expect(
				await Promise.all(
					images.map((part) =>
						part instanceof Blob
							? part
									.arrayBuffer()
									.then((bytes) => sha256(new Uint8Array(bytes)))
							: Promise.resolve("not-a-file"),
					),
				),
			).toEqual(fixture.orderedImageBytes.map(sha256));
			expect(
				(fixture.projection.rendering.references ?? []).map((reference) =>
					"sourceSHA" in reference ? reference.sourceSHA : undefined,
				),
			).toEqual(fixture.orderedImageBytes.map(sha256));
			expect(result.bytes).toEqual(expectedPng);
			expect(result.responseSHA).toBe(sha256(expectedPng));
			expect(sha256(await readFile(outputPath))).toBe(sha256(expectedPng));
			const requestBytes = await readFile(`${outputPath}.request.json`);
			const receiptBytes = await readFile(`${outputPath}.receipt.json`);
			expect(sha256(requestBytes)).toMatch(/^[a-f0-9]{64}$/);
			expect(sha256(receiptBytes)).toMatch(/^[a-f0-9]{64}$/);
			expect(JSON.parse(receiptBytes.toString()).reviewStatus).toBe(
				"candidate-unreviewed",
			);
		} finally {
			await teardown();
		}
	});

	test("preserves HTTP rejection body before stopping without an output", async () => {
		const fixture = createTransportFixture();
		const directory = await makeDirectory();
		const outputPath = join(directory, "rejected.png");
		const body = Buffer.from('{"error":"invalid multipart"}');
		const baseUrl = await startServer((_request, response) => {
			response.statusCode = 400;
			response.end(body);
		});
		await expect(call(baseUrl, fixture, outputPath)).rejects.toMatchObject({
			code: "HTTP_FAILURE",
			status: 400,
		});
		const receipt = JSON.parse(
			await readFile(`${outputPath}.receipt.json`, "utf8"),
		);
		expect(receipt.responseBodyBase64).toBe(body.toString("base64"));
		expect(receipt.responseBodySHA).toBe(sha256(body));
	});

	for (const changed of [
		"textSHA",
		"renderingSHA",
		"referenceBytes",
	] as const) {
		test(`rejects tampered ${changed} before dispatch and preserves existing output`, async () => {
			const fixture = createTransportFixture();
			const outputDirectory = await makeDirectory();
			const outputPath = join(outputDirectory, "portrait.png");
			const prior = new Uint8Array([41, 42, 43]);
			await writeFile(outputPath, prior);
			let calls = 0;
			const baseUrl = await startServer((_request, response) => {
				calls += 1;
				response.end("{}");
			});
			let projectionValue = fixture.projection;
			const images = fixture.orderedImageBytes.map(
				(bytes) => new Uint8Array(bytes),
			);
			if (changed === "textSHA")
				projectionValue = { ...projectionValue, textSHA: "0".repeat(64) };
			if (changed === "renderingSHA")
				projectionValue = { ...projectionValue, renderingSHA: "0".repeat(64) };
			if (changed === "referenceBytes") images[0] = new Uint8Array([99]);
			try {
				await expect(
					call(baseUrl, fixture, outputPath, projectionValue, images),
				).rejects.toMatchObject({ code: "PROJECTION_BINDING_MISMATCH" });
				expect(calls).toBe(0);
				expect(sha256(await readFile(outputPath))).toBe(sha256(prior));
			} finally {
				await teardown();
			}
		});
	}

	test("rejects a pre-existing output before dispatch without modifying it", async () => {
		const fixture = createTransportFixture();
		const outputDirectory = await makeDirectory();
		const outputPath = join(outputDirectory, "portrait.png");
		const prior = new Uint8Array([41, 42, 43]);
		await writeFile(outputPath, prior);
		let calls = 0;
		const baseUrl = await startServer((_request, response) => {
			calls += 1;
			response.end("{}");
		});
		try {
			await expect(call(baseUrl, fixture, outputPath)).rejects.toMatchObject({
				code: "OUTPUT_ALREADY_EXISTS",
			});
			expect(calls).toBe(0);
			expect(sha256(await readFile(outputPath))).toBe(sha256(prior));
		} finally {
			await teardown();
		}
	});

	test("retains one 503 request and blocks a repeated output request", async () => {
		const fixture = createTransportFixture();
		const outputDirectory = await makeDirectory();
		const outputPath = join(outputDirectory, "portrait.png");
		let calls = 0;
		const baseUrl = await startServer((_request, response) => {
			calls += 1;
			response.statusCode = 503;
			response.end("unavailable");
		});
		try {
			await expect(call(baseUrl, fixture, outputPath)).rejects.toMatchObject({
				code: "HTTP_FAILURE",
			});
			expect(calls).toBe(1);
			await expect(
				readFile(`${outputPath}.request.json`),
			).resolves.toBeDefined();
			await expect(call(baseUrl, fixture, outputPath)).rejects.toMatchObject({
				code: "REQUEST_ALREADY_RECORDED",
			});
			expect(calls).toBe(1);
		} finally {
			await teardown();
		}
	});

	test("keeps network failure status unknown and never retries", async () => {
		const fixture = createTransportFixture();
		const outputDirectory = await makeDirectory();
		const outputPath = join(outputDirectory, "portrait.png");
		let calls = 0;
		const baseUrl = await startServer((_request, response) => {
			calls += 1;
			response.socket?.destroy();
		});
		try {
			await expect(call(baseUrl, fixture, outputPath)).rejects.toMatchObject({
				code: "NETWORK_FAILURE",
				status: "unknown",
			});
			await expect(
				readFile(`${outputPath}.request.json`),
			).resolves.toBeDefined();
			await expect(call(baseUrl, fixture, outputPath)).rejects.toMatchObject({
				code: "REQUEST_ALREADY_RECORDED",
			});
			expect(calls).toBe(1);
		} finally {
			await teardown();
		}
	});

	test("requires HTTPS and a key remotely, permits unauthenticated loopback only", async () => {
		const fixture = createTransportFixture();
		const outputDirectory = await makeDirectory();
		const outputPath = join(outputDirectory, "portrait.png");
		await expect(
			call(
				"http://example.test",
				fixture,
				outputPath,
				fixture.projection,
				fixture.orderedImageBytes,
				{
					baseUrl: "http://example.test",
					allowUnauthenticated: true,
				},
			),
		).rejects.toMatchObject({ code: "INVALID_CONNECTION" });
		await expect(
			call(
				"https://example.test",
				fixture,
				outputPath,
				fixture.projection,
				fixture.orderedImageBytes,
				{
					baseUrl: "https://example.test",
				},
			),
		).rejects.toMatchObject({ code: "INVALID_CONNECTION" });
	});

	test("rejects credential-like projection prompt content before dispatch", async () => {
		const apiKey = "test-local-secret";
		const fixture = createTransportFixture(apiKey);
		const outputDirectory = await makeDirectory();
		const outputPath = join(outputDirectory, "portrait.png");
		let calls = 0;
		const baseUrl = await startServer((_request, response) => {
			calls += 1;
			response.end("{}");
		});
		expect(fixture.projection.text).toContain(apiKey);
		try {
			await expect(
				call(
					baseUrl,
					fixture,
					outputPath,
					fixture.projection,
					fixture.orderedImageBytes,
					{ baseUrl, apiKey, allowUnauthenticated: true },
				),
			).rejects.toMatchObject({
				code: "CREDENTIAL_IN_PROMPT",
			});
			expect(calls).toBe(0);
		} finally {
			await teardown();
		}
	});
});

type Response = import("node:http").ServerResponse;
