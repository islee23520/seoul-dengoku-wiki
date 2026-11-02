import { afterEach, describe, expect, test } from "bun:test";
import { type ChildProcess, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
	createProportionProfile,
	evaluatePortraitAcceptance,
	PORTRAIT_ACCEPTANCE_CRITERIA,
	requireBatchReview,
} from "portrait-acceptance";
import { encodePng } from "portrait-acceptance/png";
import { installPortraitBinary } from "../src/install-binary.js";
import { createTransportFixture } from "./transport-fixture.js";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(packageDirectory, "dist/cli.js");
const sha256 = (bytes: Uint8Array): string =>
	createHash("sha256").update(bytes).digest("hex");
const eventTimeout = () => ({ signal: AbortSignal.timeout(5_000) });
const directories: string[] = [];
const servers: Server[] = [];

function validPortraitPng(): Uint8Array {
	const pixels = new Uint8Array(1024 * 1536 * 4);
	for (let y = 350; y < 750; y++)
		for (let x = 350; x < 675; x++)
			pixels.set([80, 100, 120, 255], (y * 1024 + x) * 4);
	for (let y = 750; y < 770; y++)
		for (let x = 350; x < 675; x++) pixels[(y * 1024 + x) * 4 + 3] = 128;
	return encodePng({ width: 1024, height: 1536, pixels });
}

afterEach(async () => {
	await Promise.all(
		servers.splice(0).map(async (server) => {
			if (!server.listening) return;
			const closed = once(server, "close", eventTimeout());
			server.closeAllConnections();
			server.close();
			await closed;
		}),
	);
	await Promise.all(
		directories.splice(0).map((path) => rm(path, { recursive: true })),
	);
});

const makeDirectory = async () => {
	const directory = await mkdtemp(join(tmpdir(), "portrait-cli-reviewed-"));
	directories.push(directory);
	return directory;
};

const runCli = (args: readonly string[], installedEntry?: string) =>
	new Promise<{ code: number | null; stdout: string; stderr: string }>(
		(resolvePromise, reject) => {
			const child: ChildProcess = spawn(
				installedEntry ?? process.execPath,
				installedEntry ? [...args] : [entry, ...args],
				{
					cwd: installedEntry ? tmpdir() : packageDirectory,
					env: installedEntry ? { PATH: "" } : process.env,
					stdio: ["ignore", "pipe", "pipe"],
				},
			);
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

async function writeGenerationFixture(directory: string) {
	const fixture = createTransportFixture();
	const paths = {
		rule: join(directory, "rule.json"),
		reference: join(directory, "reference.json"),
		look: join(directory, "look.json"),
		manifest: join(directory, "manifest.json"),
		pins: join(directory, "operator-pins.json"),
		connection: join(directory, "connection.json"),
	};
	await mkdir(join(directory, "evidence"));
	await Promise.all([
		writeFile(paths.rule, fixture.candidate.ruleBytes),
		writeFile(paths.reference, fixture.candidate.positionReferenceBytes),
		writeFile(paths.look, fixture.candidate.lookBytes),
		...fixture.orderedImageBytes.map((bytes, index) =>
			writeFile(join(directory, `image-${index}.bin`), bytes),
		),
		writeFile(paths.pins, JSON.stringify(fixture.operatorPins)),
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
	return paths;
}

function acceptanceArtifacts(directory: string, imageBytes: Uint8Array) {
	const imageSHA = sha256(imageBytes);
	const observation = {
		imageSHA,
		measurementEvidenceSHA: "0".repeat(64),
		actualImageMeasured: true as const,
		canvas: [1024, 1536] as const,
		bodyType: "synthetic-fixture",
		landmarks: {
			crown: [512, 100],
			chin: [512, 500],
			headLeft: [412, 300],
			headRight: [612, 300],
			faceTop: [512, 160],
			faceLeft: [452, 300],
			faceRight: [572, 300],
			leftPupil: [472, 260],
			rightPupil: [552, 260],
			leftShoulder: [362, 560],
			rightShoulder: [662, 560],
			torsoLeft: [412, 620],
			torsoRight: [612, 620],
		} satisfies Record<string, readonly [number, number]>,
	};
	const evidencePath = "review-evidence.json";
	const evidence = Buffer.from(JSON.stringify({ reviewed: imageSHA }));
	const measurementBytes = Buffer.from(JSON.stringify(observation));
	const measurementEvidenceSHA = sha256(measurementBytes);
	const measuredObservation = { ...observation, measurementEvidenceSHA };
	const profile = createProportionProfile({
		commonReference: measuredObservation,
		bodyReference: measuredObservation,
		bodyType: "synthetic-fixture",
		tolerance: { pixels: 2, ratio: 0.05, evidenceSHA: measurementEvidenceSHA },
	});
	const review = {
		characterId: "K001",
		requestId: "request-1",
		sha256: imageSHA,
		actualImageViewed: true,
		technicalVerdict: "pass",
		acceptanceSchema: PORTRAIT_ACCEPTANCE_CRITERIA.schema,
		positionReference: {
			referenceVersion: "synthetic-reference-v1",
			referenceSHA: "c".repeat(64),
			ruleSHA: "d".repeat(64),
		},
		criteria: Object.fromEntries(
			[
				...PORTRAIT_ACCEPTANCE_CRITERIA.qualityRows,
				...PORTRAIT_ACCEPTANCE_CRITERIA.semanticRows,
			].map((name) => [
				name,
				{
					verdict: "pass",
					scope: "whole-image",
					imageSHA,
					evidenceSHA: sha256(evidence),
				},
			]),
		),
		evidence: [{ sha256: sha256(evidence), path: `evidence/${evidencePath}` }],
	};
	const profileBytes = Buffer.from(JSON.stringify(profile));
	const authority = {
		referenceVersion: "synthetic-reference-v1",
		referenceSHA: "c".repeat(64),
		ruleSHA: "d".repeat(64),
	};
	const paths = {
		terminal: join(directory, "terminal.json"),
		review: join(directory, "review.json"),
		profile: join(directory, "profile.json"),
		measurement: join(directory, "measurement.json"),
		authority: join(directory, "authority.json"),
		evidence: join(directory, evidencePath),
	};
	const evidenceFile = join(directory, "evidence", evidencePath);
	return {
		paths,
		writes: [
			writeFile(
				paths.terminal,
				JSON.stringify({
					id: "K001",
					requestId: "request-1",
					status: "COMPLETED",
					result: { path: join(directory, "candidate.png") },
				}),
			),
			writeFile(paths.review, JSON.stringify(review)),
			writeFile(paths.profile, profileBytes),
			writeFile(paths.measurement, measurementBytes),
			writeFile(paths.authority, JSON.stringify(authority)),
			writeFile(evidenceFile, evidence),
			writeFile(join(directory, "candidate.png"), imageBytes),
		],
		profileSHA: sha256(profileBytes),
		measurementSHA: sha256(measurementBytes),
		evidenceFile,
		observation: measuredObservation,
		review,
		profile,
		imageBytes,
	};
}

describe("portrait-generator reviewed advancement CLI", () => {
	test("accepts a reviewed terminal and advances exactly one generation", async () => {
		const directory = await makeDirectory();
		const generation = await writeGenerationFixture(directory);
		const expected = validPortraitPng();
		const acceptance = acceptanceArtifacts(directory, expected);
		await Promise.all(acceptance.writes);
		const directVerdict = evaluatePortraitAcceptance({
			characterId: acceptance.review.characterId,
			requestId: acceptance.review.requestId,
			imageBytes: expected,
			review: acceptance.review,
			profile: acceptance.profile,
			measurementBytes: await readFile(acceptance.paths.measurement),
			evidence: [await readFile(acceptance.evidenceFile)],
			expectedPositionReference: {
				referenceVersion: "synthetic-reference-v1",
				referenceSHA: "c".repeat(64),
				ruleSHA: "d".repeat(64),
			},
		});
		expect(directVerdict.pass).toBe(true);
		await expect(
			requireBatchReview(
				JSON.parse(await readFile(acceptance.paths.terminal, "utf8")),
				acceptance.paths.review,
				{
					profilePath: acceptance.paths.profile,
					profileFileSHA: acceptance.profileSHA,
					positionReference: JSON.parse(
						await readFile(acceptance.paths.authority, "utf8"),
					),
					measurementPath: acceptance.paths.measurement,
					profile: acceptance.profile,
				},
			),
		).resolves.toMatchObject({ pass: true, failures: [] });
		let calls = 0;
		servers.push(
			createServer((_request, response) => {
				calls += 1;
				response.writeHead(200, { "content-type": "application/json" });
				response.end(
					JSON.stringify({
						data: [{ b64_json: Buffer.from(expected).toString("base64") }],
					}),
				);
			}),
		);
		const server = servers[servers.length - 1];
		if (server === undefined) throw new Error("Expected local test server");
		const listening = once(server, "listening", eventTimeout());
		server.listen(0, "127.0.0.1");
		await listening;
		const address = server.address();
		if (address === null || typeof address === "string")
			throw new Error("Expected loopback address");
		await writeFile(
			generation.connection,
			JSON.stringify({
				baseUrl: `http://127.0.0.1:${address.port}`,
				allowUnauthenticated: true,
			}),
		);
		const binary = await readFile(
			join(packageDirectory, "dist/portrait-generator"),
		);
		const download = createServer((_request, response) => response.end(binary));
		servers.push(download);
		const downloadListening = once(download, "listening", eventTimeout());
		download.listen(0, "127.0.0.1");
		await downloadListening;
		const downloadAddress = download.address();
		if (!downloadAddress || typeof downloadAddress === "string")
			throw new Error("Expected download fixture address");
		const installedEntry = join(directory, "installed portrait");
		expect(
			await installPortraitBinary({
				url: `http://127.0.0.1:${downloadAddress.port}`,
				expectedSHA256: sha256(binary),
				destination: installedEntry,
				allowLocalHttp: true,
			}),
		).toEqual({ installed: true });
		const output = join(directory, "next.png");
		const reviewedArguments = [
			"generate-reviewed",
			"--input",
			generation.manifest,
			"--pins",
			generation.pins,
			"--connection",
			generation.connection,
			"--request-id",
			"request-2",
			"--output",
			output,
			"--previous",
			acceptance.paths.terminal,
			"--review",
			acceptance.paths.review,
			"--profile",
			acceptance.paths.profile,
			"--profile-sha",
			acceptance.profileSHA,
			"--measurement",
			acceptance.paths.measurement,
			"--position-reference",
			acceptance.paths.authority,
		];
		const result = await runCli(reviewedArguments, installedEntry);
		expect(result.code).toBe(0);
		expect(calls).toBe(1);
		expect(sha256(await readFile(output))).toBe(sha256(expected));
	});

	test("holds an unknown previous terminal before contacting the provider", async () => {
		const directory = await makeDirectory();
		const generation = await writeGenerationFixture(directory);
		const image = validPortraitPng();
		const acceptance = acceptanceArtifacts(directory, image);
		await Promise.all(acceptance.writes);
		await expect(
			requireBatchReview(
				JSON.parse(await readFile(acceptance.paths.terminal, "utf8")),
				acceptance.paths.review,
				{
					profilePath: acceptance.paths.profile,
					profileFileSHA: acceptance.profileSHA,
					positionReference: JSON.parse(
						await readFile(acceptance.paths.authority, "utf8"),
					),
					measurementPath: acceptance.paths.measurement,
					profile: acceptance.profile,
				},
			),
		).resolves.toMatchObject({ pass: true, failures: [] });
		await writeFile(
			acceptance.paths.terminal,
			JSON.stringify({
				id: "K001",
				requestId: "request-1",
				status: "DISPATCHED_RESPONSE_UNKNOWN",
				result: { path: join(directory, "candidate.png") },
			}),
		);
		let calls = 0;
		servers.push(
			createServer(() => {
				calls += 1;
			}),
		);
		const server = servers[servers.length - 1];
		if (server === undefined) throw new Error("Expected local test server");
		const listening = once(server, "listening", eventTimeout());
		server.listen(0, "127.0.0.1");
		await listening;
		const address = server.address();
		if (address === null || typeof address === "string")
			throw new Error("Expected loopback address");
		await writeFile(
			generation.connection,
			JSON.stringify({
				baseUrl: `http://127.0.0.1:${address.port}`,
				allowUnauthenticated: true,
			}),
		);
		const result = await runCli([
			"generate-reviewed",
			"--input",
			generation.manifest,
			"--pins",
			generation.pins,
			"--connection",
			generation.connection,
			"--request-id",
			"request-2",
			"--output",
			join(directory, "next.png"),
			"--previous",
			acceptance.paths.terminal,
			"--review",
			acceptance.paths.review,
			"--profile",
			acceptance.paths.profile,
			"--profile-sha",
			acceptance.profileSHA,
			"--measurement",
			acceptance.paths.measurement,
			"--position-reference",
			acceptance.paths.authority,
		]);
		expect(result.code).toBe(1);
		expect(result.stderr).toMatch(/^TERMINAL_RECONCILIATION_REQUIRED:/);
		expect(calls).toBe(0);
	});

	test("holds missing operator pins before contacting the provider", async () => {
		const directory = await makeDirectory();
		const generation = await writeGenerationFixture(directory);
		const image = validPortraitPng();
		const acceptance = acceptanceArtifacts(directory, image);
		await Promise.all(acceptance.writes);
		await expect(
			requireBatchReview(
				JSON.parse(await readFile(acceptance.paths.terminal, "utf8")),
				acceptance.paths.review,
				{
					profile: acceptance.profile,
					measurementPath: acceptance.paths.measurement,
				},
			),
		).rejects.toMatchObject({
			name: "BatchHoldError",
			code: "OPERATOR_PINS_REQUIRED",
		});
		let calls = 0;
		servers.push(
			createServer(() => {
				calls += 1;
			}),
		);
		const server = servers[servers.length - 1];
		if (server === undefined) throw new Error("Expected local test server");
		const listening = once(server, "listening", eventTimeout());
		server.listen(0, "127.0.0.1");
		await listening;
		const address = server.address();
		if (address === null || typeof address === "string")
			throw new Error("Expected loopback address");
		await writeFile(
			generation.connection,
			JSON.stringify({
				baseUrl: `http://127.0.0.1:${address.port}`,
				allowUnauthenticated: true,
			}),
		);
		const result = await runCli([
			"generate-reviewed",
			"--input",
			generation.manifest,
			"--pins",
			generation.pins,
			"--connection",
			generation.connection,
			"--request-id",
			"request-2",
			"--output",
			join(directory, "next.png"),
			"--previous",
			acceptance.paths.terminal,
			"--review",
			acceptance.paths.review,
			"--profile",
			acceptance.paths.profile,
			"--measurement",
			acceptance.paths.measurement,
			"--position-reference",
			acceptance.paths.authority,
		]);
		expect(result.code).toBe(1);
		expect(result.stderr).toMatch(/^OPERATOR_PINS_REQUIRED:/);
		expect(calls).toBe(0);
	});

	test("holds failed review criteria before contacting the provider", async () => {
		const directory = await makeDirectory();
		const generation = await writeGenerationFixture(directory);
		const image = validPortraitPng();
		const acceptance = acceptanceArtifacts(directory, image);
		await Promise.all(acceptance.writes);
		const failedReview = {
			...acceptance.review,
			criteria: {
				...acceptance.review.criteria,
				naturalSilhouette: {
					...Reflect.get(acceptance.review.criteria, "naturalSilhouette"),
					verdict: "fail",
				},
			},
		};
		await writeFile(acceptance.paths.review, JSON.stringify(failedReview));
		await expect(
			requireBatchReview(
				JSON.parse(await readFile(acceptance.paths.terminal, "utf8")),
				acceptance.paths.review,
				{
					profilePath: acceptance.paths.profile,
					profileFileSHA: acceptance.profileSHA,
					positionReference: JSON.parse(
						await readFile(acceptance.paths.authority, "utf8"),
					),
					measurementPath: acceptance.paths.measurement,
					profile: acceptance.profile,
				},
			),
		).rejects.toMatchObject({
			name: "BatchHoldError",
			code: "ACCEPTANCE_FAILED",
		});
		let calls = 0;
		servers.push(
			createServer(() => {
				calls += 1;
			}),
		);
		const server = servers[servers.length - 1];
		if (server === undefined) throw new Error("Expected local test server");
		const listening = once(server, "listening", eventTimeout());
		server.listen(0, "127.0.0.1");
		await listening;
		const address = server.address();
		if (address === null || typeof address === "string")
			throw new Error("Expected loopback address");
		await writeFile(
			generation.connection,
			JSON.stringify({
				baseUrl: `http://127.0.0.1:${address.port}`,
				allowUnauthenticated: true,
			}),
		);
		const result = await runCli([
			"generate-reviewed",
			"--input",
			generation.manifest,
			"--pins",
			generation.pins,
			"--connection",
			generation.connection,
			"--request-id",
			"request-2",
			"--output",
			join(directory, "next.png"),
			"--previous",
			acceptance.paths.terminal,
			"--review",
			acceptance.paths.review,
			"--profile",
			acceptance.paths.profile,
			"--profile-sha",
			acceptance.profileSHA,
			"--measurement",
			acceptance.paths.measurement,
			"--position-reference",
			acceptance.paths.authority,
		]);
		expect(result.code).toBe(1);
		expect(result.stderr).toMatch(/^ACCEPTANCE_FAILED:/);
		expect(calls).toBe(0);
	});
});
