import { afterEach, describe, expect, test } from "bun:test";
import { type ChildProcess, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import {
	operatorPinsSchema,
	portraitCandidateSchema,
	preparePortraitConditions,
} from "../src/preflight.js";
import { projectPortrait } from "../src/projection.js";
import { createTransportFixture } from "./transport-fixture.js";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(packageDirectory, "dist/cli.js");
const sha256 = (bytes: Uint8Array): string =>
	createHash("sha256").update(bytes).digest("hex");
const eventTimeout = () => ({ signal: AbortSignal.timeout(10_000) });
const directories: string[] = [];
let server: Server | undefined;

afterEach(async () => {
	if (server?.listening) {
		const closed = once(server, "close", eventTimeout());
		server.closeAllConnections();
		server.close();
		await closed;
	}
	server = undefined;
	await Promise.all(
		directories.splice(0).map((path) => rm(path, { recursive: true })),
	);
});

const makeDirectory = async () => {
	const directory = await mkdtemp(join(tmpdir(), "portrait-cli-"));
	directories.push(directory);
	return directory;
};

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
	const pixels = deflateSync(new Uint8Array(1536 * (1 + 1024 * 4)));
	return new Uint8Array(
		Buffer.concat([
			Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
			chunk("IHDR", header),
			chunk("IDAT", pixels),
			chunk("IEND", new Uint8Array()),
		]),
	);
};

const runCli = (
	args: readonly string[],
	env: NodeJS.ProcessEnv = process.env,
	cwd = packageDirectory,
) =>
	new Promise<{ code: number | null; stdout: string; stderr: string }>(
		(resolvePromise, reject) => {
			const child: ChildProcess = spawn(process.execPath, [entry, ...args], {
				cwd,
				env,
				stdio: ["ignore", "pipe", "pipe"],
			});
			let stdout = "";
			let stderr = "";
			child.stdout?.setEncoding("utf8").on("data", (value: string) => {
				stdout += value;
			});
			child.stderr?.setEncoding("utf8").on("data", (value: string) => {
				stderr += value;
			});
			const timeout = setTimeout(() => child.kill("SIGKILL"), 15_000);
			child.once("error", (error) => {
				clearTimeout(timeout);
				reject(error);
			});
			child.once("close", (code) => {
				clearTimeout(timeout);
				resolvePromise({ code, stdout, stderr });
			});
		},
	);

const writeFixture = async (directory: string) => {
	const fixture = createTransportFixture();
	const paths = {
		rule: join(directory, "rule.json"),
		reference: join(directory, "reference.json"),
		look: join(directory, "look.json"),
		images: fixture.orderedImageBytes.map((_, index) =>
			join(directory, `image-${index}.bin`),
		),
		manifest: join(directory, "manifest.json"),
		pins: join(directory, "operator-pins.json"),
		connection: join(directory, "connection.json"),
	};
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
	await Promise.all([
		writeFile(paths.rule, candidate.ruleBytes),
		writeFile(paths.reference, candidate.positionReferenceBytes),
		writeFile(paths.look, candidate.lookBytes),
		...fixture.orderedImageBytes.map((bytes, index) => {
			const imagePath = paths.images[index];
			if (imagePath === undefined)
				throw new Error("Fixture image path missing");
			return writeFile(imagePath, bytes);
		}),
		writeFile(paths.pins, JSON.stringify(operatorPins)),
		writeFile(
			paths.connection,
			JSON.stringify({
				baseUrl: "http://127.0.0.1:0",
				allowUnauthenticated: true,
			}),
		),
		writeFile(
			paths.manifest,
			JSON.stringify({
				rule: { path: "rule.json" },
				reference: { path: "reference.json" },
				look: { path: "look.json" },
				referenceImages: fixture.referenceImages.map((image, index) => ({
					id: image.id,
					role: image.role,
					...(image.sameOwnerRecipient ? { sameOwnerRecipient: true } : {}),
					...(image.allowedProperties
						? { allowedProperties: image.allowedProperties }
						: {}),
					...(image.sourceHash ? { sourceHash: image.sourceHash } : {}),
					path: `image-${index}.bin`,
				})),
				composition: fixture.candidate.composition,
			}),
		),
	]);
	return { fixture: { ...fixture, projection }, paths };
};

describe("portrait-generator CLI subprocess contract", () => {
	test("preflight reports bound projection without dispatch", async () => {
		const directory = await makeDirectory();
		const { fixture, paths } = await writeFixture(directory);
		const externalCwd = await mkdtemp(join(tmpdir(), "portrait cli cwd "));
		directories.push(externalCwd);
		const result = await runCli(
			["preflight", "--input", paths.manifest, "--pins", paths.pins],
			process.env,
			externalCwd,
		);
		expect(result.code).toBe(0);
		const output = JSON.parse(result.stdout);
		expect(output.projection.textSHA).toBe(fixture.projection.textSHA);
		expect(output.projection.renderingSHA).toBe(
			fixture.projection.renderingSHA,
		);
		expect(output.projection.dispatched).toBe(false);
	});

	test("generate writes PNG and candidate-unreviewed request receipt", async () => {
		const directory = await makeDirectory();
		const { paths } = await writeFixture(directory);
		const expected = pngBytes();
		let calls = 0;
		let authorization: string | undefined;
		server = createServer((_request, response) => {
			calls += 1;
			authorization = _request.headers.authorization;
			response.writeHead(200, { "content-type": "application/json" });
			response.end(
				JSON.stringify({
					data: [{ b64_json: Buffer.from(expected).toString("base64") }],
				}),
			);
		});
		const listening = once(server, "listening", eventTimeout());
		server.listen(0, "127.0.0.1");
		await listening;
		const address = server.address();
		expect(address).not.toBeNull();
		if (address === null || typeof address === "string")
			throw new Error("Expected loopback address");
		await writeFile(
			paths.connection,
			JSON.stringify({
				baseUrl: `http://127.0.0.1:${address.port}`,
				apiKeyEnv: "PORTRAIT_CLI_TEST_SECRET",
			}),
		);
		const outputPath = join(directory, "portrait.png");
		const result = await runCli(
			[
				"generate",
				"--input",
				paths.manifest,
				"--pins",
				paths.pins,
				"--connection",
				paths.connection,
				"--request-id",
				"cli-contract",
				"--output",
				outputPath,
			],
			{ ...process.env, PORTRAIT_CLI_TEST_SECRET: "private-test-token" },
		);
		expect(result.code).toBe(0);
		expect(calls).toBe(1);
		expect(authorization).toBe("Bearer private-test-token");
		expect(sha256(await readFile(outputPath))).toBe(sha256(expected));
		expect(
			JSON.parse(await readFile(`${outputPath}.receipt.json`, "utf8"))
				.reviewStatus,
		).toBe("candidate-unreviewed");
		const receipt = await readFile(`${outputPath}.receipt.json`, "utf8");
		expect(receipt).not.toContain("private-test-token");
		expect(result.stdout + result.stderr).not.toContain("private-test-token");
	});

	test("tampered operator pins fail before dispatch", async () => {
		const directory = await makeDirectory();
		const { paths } = await writeFixture(directory);
		const candidateManifest = JSON.parse(
			await readFile(paths.manifest, "utf8"),
		);
		const ruleBytes = await readFile(paths.rule);
		candidateManifest.rule.path = "rule-tampered.json";
		await Promise.all([
			writeFile(paths.manifest, JSON.stringify(candidateManifest)),
			writeFile(
				join(directory, "rule-tampered.json"),
				Buffer.concat([ruleBytes, Buffer.from(" ")]),
			),
		]);
		let calls = 0;
		server = createServer((_request, response) => {
			calls += 1;
			response.end();
		});
		const listening = once(server, "listening", eventTimeout());
		server.listen(0, "127.0.0.1");
		await listening;
		const address = server.address();
		if (address === null || typeof address === "string")
			throw new Error("Expected loopback address");
		await writeFile(
			paths.connection,
			JSON.stringify({
				baseUrl: `http://127.0.0.1:${address.port}`,
				allowUnauthenticated: true,
			}),
		);
		const outputPath = join(directory, "tampered.png");
		const result = await runCli([
			"generate",
			"--input",
			paths.manifest,
			"--pins",
			paths.pins,
			"--connection",
			paths.connection,
			"--request-id",
			"tampered",
			"--output",
			outputPath,
		]);
		expect(result.code).toBe(1);
		expect(result.stderr).toContain("ARTIFACT_HASH_MISMATCH");
		expect(calls).toBe(0);
		await expect(readFile(outputPath)).rejects.toMatchObject({
			code: "ENOENT",
		});
		await expect(readFile(`${outputPath}.request.json`)).rejects.toMatchObject({
			code: "ENOENT",
		});
	});

	test("missing flags, files, values, directories, and duplicate options report one diagnostic", async () => {
		const directory = await makeDirectory();
		const manifest = join(directory, "manifest.json");
		const pins = join(directory, "pins.json");
		await writeFile(manifest, "{}");
		await writeFile(pins, "{}");
		for (const args of [
			[],
			["preflight", "--input", manifest, "--pins"],
			[
				"preflight",
				"--input",
				join(directory, "absent.json"),
				"--pins",
				join(directory, "absent-pins.json"),
			],
			["preflight", "--input", manifest, "--pins", pins, "--unknown", "x"],
			["preflight", "--input", manifest, "--input", manifest, "--pins", pins],
			["preflight", "--input", directory, "--pins", pins],
			[
				"generate",
				"--input",
				manifest,
				"--pins",
				pins,
				"--connection",
				join(directory, "connection.json"),
				"--request-id",
				"missing-output-dir",
				"--output",
				join(directory, "absent", "portrait.png"),
			],
		]) {
			const result = await runCli(args);
			expect(result.code).toBe(1);
			const diagnostic = result.stderr.trim();
			expect(diagnostic.length).toBeGreaterThan(0);
			expect(diagnostic.split("\n")).toHaveLength(1);
			expect(diagnostic).toMatch(/^[A-Z][A-Z0-9_]+:/);
		}
	});

	test("repeated output blocks a second request", async () => {
		const directory = await makeDirectory();
		const { paths } = await writeFixture(directory);
		const expected = pngBytes();
		let calls = 0;
		server = createServer((_request, response) => {
			calls += 1;
			response.writeHead(200, { "content-type": "application/json" });
			response.end(
				JSON.stringify({
					data: [{ b64_json: Buffer.from(expected).toString("base64") }],
				}),
			);
		});
		const listening = once(server, "listening", eventTimeout());
		server.listen(0, "127.0.0.1");
		await listening;
		const address = server.address();
		if (address === null || typeof address === "string")
			throw new Error("Expected loopback address");
		await writeFile(
			paths.connection,
			JSON.stringify({
				baseUrl: `http://127.0.0.1:${address.port}`,
				allowUnauthenticated: true,
			}),
		);
		const outputPath = join(directory, "portrait.png");
		const args = [
			"generate",
			"--input",
			paths.manifest,
			"--pins",
			paths.pins,
			"--connection",
			paths.connection,
			"--request-id",
			"repeat",
			"--output",
			outputPath,
		];
		expect((await runCli(args)).code).toBe(0);
		const second = await runCli(args);
		expect(second.code).toBe(1);
		expect(calls).toBe(1);
	});
});
