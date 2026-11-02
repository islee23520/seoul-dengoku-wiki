import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import {
	operatorPinsSchema,
	portraitCandidateSchema,
	preparePortraitConditions,
} from "../src/preflight.js";
import { projectPortrait } from "../src/projection.js";
import { sendPortraitRequest } from "../src/transport.js";
import { createTransportFixture } from "./transport-fixture.js";

const hash = (bytes: Uint8Array): string =>
	createHash("sha256").update(bytes).digest("hex");

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
		const result = Buffer.alloc(12 + data.length);
		result.writeUInt32BE(data.length, 0);
		Buffer.from(type).copy(result, 4);
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
	return new Uint8Array(
		Buffer.concat([
			Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
			chunk("IHDR", header),
			chunk("IDAT", deflateSync(new Uint8Array(1536 * (1 + 1024 * 4)))),
			chunk("IEND", new Uint8Array()),
		]),
	);
};

describe("transport connection boundary", () => {
	test("authenticated loopback accepts a supplied key without unauthenticated opt-in", async () => {
		const fixture = createTransportFixture();
		const candidate = portraitCandidateSchema.parse({
			ruleBytes: fixture.candidate.ruleBytes,
			positionReferenceBytes: fixture.candidate.positionReferenceBytes,
			lookBytes: fixture.candidate.lookBytes,
			referenceImages: fixture.referenceImages,
			composition: fixture.candidate.composition,
		});
		const operatorPins = operatorPinsSchema.parse(fixture.operatorPins);
		const prepared = preparePortraitConditions(candidate, operatorPins);
		const projection = projectPortrait({ candidate, operatorPins, prepared });
		const png = pngBytes();
		let authorization: string | undefined;
		const server: Server = createServer((_request, response) => {
			authorization = _request.headers.authorization;
			response.writeHead(200, { "content-type": "application/json" });
			response.end(
				JSON.stringify({
					data: [{ b64_json: Buffer.from(png).toString("base64") }],
				}),
			);
		});
		const listening = once(server, "listening", {
			signal: AbortSignal.timeout(5000),
		});
		server.listen(0, "127.0.0.1");
		await listening;
		const address = server.address();
		if (address === null || typeof address === "string")
			throw new Error("Expected loopback address");
		const directory = await mkdtemp(join(tmpdir(), "portrait-loopback-"));
		try {
			const outputPath = join(directory, "portrait.png");
			const result = await sendPortraitRequest({
				projection,
				orderedImageBytes: candidate.referenceImages.map(
					(image) => image.bytes,
				),
				connection: {
					baseUrl: `http://127.0.0.1:${address.port}`,
					apiKey: "local-test-key",
				},
				requestId: crypto.randomUUID(),
				outputPath,
			});
			expect(authorization).toBe("Bearer local-test-key");
			expect(hash(result.bytes)).toBe(hash(png));
		} finally {
			const closed = once(server, "close", {
				signal: AbortSignal.timeout(5000),
			});
			server.closeAllConnections();
			server.close();
			await closed;
			await rm(directory, { recursive: true });
		}
	});

	test("rejects remote HTTP even with a key", async () => {
		const fixture = createTransportFixture();
		const candidate = portraitCandidateSchema.parse({
			ruleBytes: fixture.candidate.ruleBytes,
			positionReferenceBytes: fixture.candidate.positionReferenceBytes,
			lookBytes: fixture.candidate.lookBytes,
			referenceImages: fixture.referenceImages,
			composition: fixture.candidate.composition,
		});
		const operatorPins = operatorPinsSchema.parse(fixture.operatorPins);
		const prepared = preparePortraitConditions(candidate, operatorPins);
		const projection = projectPortrait({ candidate, operatorPins, prepared });
		await expect(
			sendPortraitRequest({
				projection,
				orderedImageBytes: candidate.referenceImages.map(
					(image) => image.bytes,
				),
				connection: {
					baseUrl: "http://example.invalid",
					apiKey: "private-test-key",
					allowUnauthenticated: true,
				},
				requestId: "remote-http",
				outputPath: "/tmp/portrait-remote-http.png",
			}),
		).rejects.toMatchObject({ code: "INVALID_CONNECTION" });
	});

	test("rejects a credential included in projected prompt", async () => {
		const fixture = createTransportFixture();
		const candidate = portraitCandidateSchema.parse({
			ruleBytes: fixture.candidate.ruleBytes,
			positionReferenceBytes: fixture.candidate.positionReferenceBytes,
			lookBytes: fixture.candidate.lookBytes,
			referenceImages: fixture.referenceImages,
			composition: fixture.candidate.composition,
		});
		const operatorPins = operatorPinsSchema.parse(fixture.operatorPins);
		const prepared = preparePortraitConditions(candidate, operatorPins);
		const projection = projectPortrait({ candidate, operatorPins, prepared });
		const secret = projection.text.slice(0, 8);
		await expect(
			sendPortraitRequest({
				projection,
				orderedImageBytes: candidate.referenceImages.map(
					(image) => image.bytes,
				),
				connection: { baseUrl: "http://127.0.0.1:4000", apiKey: secret },
				requestId: "prompt-key",
				outputPath: "/tmp/portrait-prompt-key.png",
			}),
		).rejects.toMatchObject({ code: "CREDENTIAL_IN_PROMPT" });
	});
});
