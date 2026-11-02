import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encodePng } from "../src/png.js";
import type { LandmarkName } from "../src/proportion.js";
import { SOURCE_MEASUREMENT_SCHEMA } from "../src/source-measurement.js";

const root = join(import.meta.dir, "..");
const cli = join(root, "dist/cli.js");
const node = Bun.which("node");
const sourceUsage =
	"usage: portrait-acceptance source-compare <image.png> <measurement.json> --image-sha <sha256> --measurement-sha <sha256>";
const sha = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
const bytes = (value: unknown) =>
	new TextEncoder().encode(JSON.stringify(value));
const landmarks: readonly LandmarkName[] = [
	"crown",
	"chin",
	"headLeft",
	"headRight",
	"faceTop",
	"faceLeft",
	"faceRight",
	"leftPupil",
	"rightPupil",
	"leftShoulder",
	"rightShoulder",
	"torsoLeft",
	"torsoRight",
];

let temp = "";
let imagePath = "";
let measurementPath = "";
let directoryPath = "";
let imageSHA = "";
let measurementSHA = "";
let imageBytes: Uint8Array;
let measurement: {
	schema: string;
	imageSHA: string;
	canvas: number[];
	points: Record<string, unknown>;
};

beforeAll(async () => {
	if (!node) throw new Error("Node executable is required for CLI tests");
	temp = await mkdtemp(join(tmpdir(), "portrait-source-cli-"));
	const width = 7;
	const height = 11;
	imageBytes = encodePng({
		width,
		height,
		pixels: new Uint8Array(width * height * 4).fill(255),
	});
	imageSHA = sha(imageBytes);
	const points = Object.fromEntries(
		landmarks.map((name) => [
			name,
			name === "crown"
				? { status: "unmeasured", point: null }
				: {
						status: name === "chin" ? "confirmed" : "draft",
						point: [2, 3],
						uncertaintyPixels: 0.5,
					},
		]),
	);
	measurement = {
		schema: SOURCE_MEASUREMENT_SCHEMA,
		imageSHA,
		canvas: [width, height],
		points,
	};
	const measurementBytes = bytes(measurement);
	measurementSHA = sha(measurementBytes);
	imagePath = join(temp, "original.png");
	measurementPath = join(temp, "measurement.json");
	directoryPath = join(temp, "directory");
	await mkdir(directoryPath);
	await Promise.all([
		writeFile(imagePath, imageBytes),
		writeFile(measurementPath, measurementBytes),
	]);
});

afterAll(async () => {
	if (temp) await rm(temp, { recursive: true, force: true });
});

async function run(args: string[]) {
	if (!node) throw new Error("Node executable is required for CLI tests");
	const timeout = AbortSignal.timeout(10_000);
	const timedOut = new Promise<never>((_, reject) =>
		timeout.addEventListener(
			"abort",
			() => reject(new Error("CLI subprocess timed out")),
			{ once: true },
		),
	);
	const child = Bun.spawn([node, cli, ...args], {
		stdout: "pipe",
		stderr: "pipe",
	});
	timeout.addEventListener("abort", () => child.kill(), { once: true });
	const output = Promise.all([
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
		child.exited,
	]);
	const result = await Promise.race([output, timedOut]);
	return { stdout: result[0], stderr: result[1], exitCode: result[2] };
}

function expectFailure(
	result: { exitCode: number; stdout: string; stderr: string },
	diagnostic: string,
) {
	expect(result.exitCode).toBe(1);
	expect(result.stdout).toBe("");
	expect(result.stderr).toBe(`${diagnostic}\n`);
}

function validArgs(
	overrides: Partial<{
		image: string;
		measurement: string;
		imageSHA: string;
		measurementSHA: string;
	}> = {},
) {
	return [
		"source-compare",
		overrides.image ?? imagePath,
		overrides.measurement ?? measurementPath,
		"--image-sha",
		overrides.imageSHA ?? imageSHA,
		"--measurement-sha",
		overrides.measurementSHA ?? measurementSHA,
	];
}

async function withMeasurement(
	value: unknown,
	callback: (path: string, digest: string) => Promise<void>,
) {
	const path = join(temp, `measurement-${crypto.randomUUID()}.json`);
	const content = bytes(value);
	await writeFile(path, content);
	try {
		await callback(path, sha(content));
	} finally {
		await rm(path, { force: true });
	}
}

describe("portrait source comparison CLI", () => {
	it("compares exact pinned bytes and preserves mixed draft and null landmarks", async () => {
		const result = await run([
			"source-compare",
			imagePath,
			"--image-sha",
			imageSHA,
			measurementPath,
			"--measurement-sha",
			measurementSHA,
		]);
		expect(result).toMatchObject({ exitCode: 0, stderr: "" });
		const output = JSON.parse(result.stdout);
		expect(output).toMatchObject({
			imageSHA,
			measurementSHA,
			sourceCanvas: [7, 11],
			completeConfirmed: false,
			ownerApprovalImplied: false,
			normalizedLandmarks: {
				crown: { status: "unmeasured", point: null },
				chin: {
					status: "confirmed",
					point: ["2/7", "3/11"],
				},
				headLeft: {
					status: "draft",
					point: ["2/7", "3/11"],
					uncertaintyPixels: 0.5,
				},
			},
		});
		expect(result.stdout.endsWith("\n")).toBe(true);
	});

	it("supports an all-unmeasured draft without implying completeness or approval", async () => {
		const allUnmeasured = {
			...measurement,
			points: Object.fromEntries(
				landmarks.map((name) => [name, { status: "unmeasured", point: null }]),
			),
		};
		await withMeasurement(allUnmeasured, async (path, digest) => {
			const result = await run(
				validArgs({ measurement: path, measurementSHA: digest }),
			);
			expect(result.exitCode).toBe(0);
			expect(result.stderr).toBe("");
			expect(JSON.parse(result.stdout)).toMatchObject({
				completeConfirmed: false,
				ownerApprovalImplied: false,
				normalizedLandmarks: {
					crown: { status: "unmeasured", point: null },
				},
			});
		});
	});

	it("reports completeness for all-confirmed points without granting approval", async () => {
		const allConfirmed = {
			...measurement,
			points: Object.fromEntries(
				landmarks.map((name) => [
					name,
					{ status: "confirmed", point: [2, 3], uncertaintyPixels: 0 },
				]),
			),
		};
		await withMeasurement(allConfirmed, async (path, digest) => {
			const result = await run(
				validArgs({ measurement: path, measurementSHA: digest }),
			);
			expect(result.exitCode).toBe(0);
			expect(result.stderr).toBe("");
			expect(JSON.parse(result.stdout)).toMatchObject({
				completeConfirmed: true,
				ownerApprovalImplied: false,
			});
		});
	});

	it("prints help without requiring files", async () => {
		for (const flag of ["--help", "-h"]) {
			const result = await run(["source-compare", flag]);
			expect(result.exitCode).toBe(0);
			expect(result.stdout.length).toBeGreaterThan(0);
			expect(result.stderr).toBe("");
		}
	});

	it("rejects malformed, missing, duplicate, unknown and pinned flag arguments", async () => {
		const malformed = [
			[...validArgs(), "--measurement-sha", measurementSHA],
			["source-compare", imagePath, measurementPath],
			[...validArgs(), "extra"],
			["source-compare", imagePath, measurementPath, "--image-sha"],
			[
				"source-compare",
				imagePath,
				measurementPath,
				"--image-sha",
				"A".repeat(64),
				"--measurement-sha",
				measurementSHA,
			],
			[
				"source-compare",
				imagePath,
				measurementPath,
				"--image-sha",
				imageSHA,
				"--measurement-sha",
				"z".repeat(64),
			],
			[
				"source-compare",
				imagePath,
				measurementPath,
				"--image-sha",
				imageSHA,
				"--image-sha",
				imageSHA,
				"--measurement-sha",
				measurementSHA,
			],
			[
				"source-compare",
				imagePath,
				measurementPath,
				"--image-sha",
				imageSHA,
				"--measurement-sha",
				measurementSHA,
				"--unknown",
			],
		];
		for (const args of malformed) {
			const result = await run(args);
			expectFailure(result, sourceUsage);
		}
		for (const args of [
			...[
				["--unknown"],
				["--image-sha", imageSHA],
				["--measurement-sha", measurementSHA],
			].map((flags) => [
				...validArgs({
					image: join(temp, "missing-image.png"),
					measurement: join(temp, "missing-measurement.json"),
				}),
				...flags,
			]),
			[...validArgs(), "--image-sha=bad"],
			[...validArgs(), "--character", "K1003"],
			[...validArgs(), "--terminal", join(temp, "missing-terminal.json")],
		]) {
			expectFailure(await run(args), sourceUsage);
		}
	});

	it("rejects stale byte pins and unapproved embedded image hashes", async () => {
		const stalePin = await run(validArgs({ imageSHA: "0".repeat(64) }));
		expectFailure(stalePin, "source byte SHA mismatch");
		const embeddedMismatch = {
			...measurement,
			imageSHA: "0".repeat(64),
		};
		await withMeasurement(embeddedMismatch, async (path, digest) => {
			const result = await run(
				validArgs({ measurement: path, measurementSHA: digest }),
			);
			expectFailure(result, "measurement image SHA mismatch");
		});
	});

	it("binds measurement whitespace to its independent byte pin", async () => {
		const original = await readFile(measurementPath, "utf8");
		const changedWhitespace = `${original}\n`;
		const changedPath = join(temp, "whitespace.json");
		await writeFile(changedPath, changedWhitespace);
		const stale = await run(validArgs({ measurement: changedPath }));
		expectFailure(stale, "source byte SHA mismatch");
		const changedBytes = new TextEncoder().encode(changedWhitespace);
		const repinned = await run(
			validArgs({
				measurement: changedPath,
				measurementSHA: sha(changedBytes),
			}),
		);
		expect(repinned).toMatchObject({ exitCode: 0, stderr: "" });
		expect(JSON.parse(repinned.stdout)).toMatchObject({
			imageSHA,
			measurementSHA: sha(changedBytes),
			completeConfirmed: false,
			ownerApprovalImplied: false,
		});
	});

	it("rejects rebound invalid PNG bytes and mismatched or malformed canvases", async () => {
		const invalidPngPath = join(temp, "invalid.png");
		const invalidPng = new TextEncoder().encode("not a png");
		await writeFile(invalidPngPath, invalidPng);
		await withMeasurement(
			{ ...measurement, imageSHA: sha(invalidPng) },
			async (path, digest) => {
				expectFailure(
					await run(
						validArgs({
							image: invalidPngPath,
							measurement: path,
							imageSHA: sha(invalidPng),
							measurementSHA: digest,
						}),
					),
					"invalid source PNG",
				);
			},
		);
		for (const canvas of [
			[8, 11],
			[0, 11],
			[7, 1.5],
		]) {
			await withMeasurement(
				{ ...measurement, canvas },
				async (path, digest) => {
					const result = await run(
						validArgs({ measurement: path, measurementSHA: digest }),
					);
					expectFailure(
						result,
						canvas[0] === 8
							? "measurement canvas differs from source PNG"
							: "invalid source measurement shape",
					);
				},
			);
		}
	});

	it("rejects duplicate JSON keys and out-of-bounds points", async () => {
		const escapedDuplicateJson = JSON.stringify(measurement).replace(
			'"canvas":',
			'"canvas":[7,11],"can\\u0076as":',
		);
		const escapedDuplicateBytes = new TextEncoder().encode(
			escapedDuplicateJson,
		);
		const escapedDuplicatePath = join(temp, "escaped-duplicate.json");
		await writeFile(escapedDuplicatePath, escapedDuplicateBytes);
		expectFailure(
			await run(
				validArgs({
					measurement: escapedDuplicatePath,
					measurementSHA: sha(escapedDuplicateBytes),
				}),
			),
			"invalid source measurement JSON",
		);
		const duplicateJson = JSON.stringify(measurement).replace(
			'"canvas":',
			'"canvas":[7,11],"canvas":',
		);
		const duplicateBytes = new TextEncoder().encode(duplicateJson);
		const duplicatePath = join(temp, "duplicate.json");
		await writeFile(duplicatePath, duplicateBytes);
		const duplicate = await run(
			validArgs({
				measurement: duplicatePath,
				measurementSHA: sha(duplicateBytes),
			}),
		);
		expectFailure(duplicate, "invalid source measurement JSON");
		const outside = {
			...measurement,
			points: {
				...measurement.points,
				chin: { status: "draft", point: [7, 3], uncertaintyPixels: 0 },
			},
		};
		await withMeasurement(outside, async (path, digest) => {
			const result = await run(
				validArgs({ measurement: path, measurementSHA: digest }),
			);
			expectFailure(result, "source point lies outside canvas");
		});
	});

	it("reports missing files and directory inputs as one-line operational errors", async () => {
		const cases: [{ image?: string; measurement?: string }, string][] = [
			[
				{ image: join(temp, "missing.png") },
				`missing artifact: ${join(temp, "missing.png")}`,
			],
			[
				{ measurement: join(temp, "missing.json") },
				`missing artifact: ${join(temp, "missing.json")}`,
			],
			[{ image: directoryPath }, `invalid artifact: ${directoryPath}`],
			[{ measurement: directoryPath }, `invalid artifact: ${directoryPath}`],
		];
		for (const [overrides, diagnostic] of cases) {
			expectFailure(await run(validArgs(overrides)), diagnostic);
		}
	});

	it("does not mutate source fixtures while comparing", async () => {
		const imageBefore = await readFile(imagePath);
		const measurementBefore = await readFile(measurementPath);
		await run(validArgs());
		expect(await readFile(imagePath)).toEqual(imageBefore);
		expect(await readFile(measurementPath)).toEqual(measurementBefore);
	});
});
