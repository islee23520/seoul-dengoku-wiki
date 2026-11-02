import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	createProportionProfile,
	type ProportionObservation,
	requireBatchReview,
} from "portrait-acceptance";
import { decodePng, encodePng } from "portrait-acceptance/png";
import { dispatchAfterBatchReview } from "../src/review-dispatch.js";
import { createTransportFixture } from "./transport-fixture.js";

const hash = (bytes: Uint8Array): string =>
	createHash("sha256").update(bytes).digest("hex");

const image = (): Uint8Array => {
	const width = 1024;
	const height = 1536;
	const pixels = new Uint8Array(width * height * 4);
	for (let y = 350; y < 750; y++)
		for (let x = 350; x < 675; x++) {
			const i = (y * width + x) * 4;
			pixels.set([80, 100, 120, 255], i);
		}
	for (let y = 750; y < 770; y++)
		for (let x = 350; x < 675; x++) pixels[(y * width + x) * 4 + 3] = 128;
	return encodePng({ width, height, pixels });
};

const verifyPortraitPng = (bytes: Uint8Array): void => {
	const decoded = decodePng(bytes);
	expect(decoded.width).toBe(1024);
	expect(decoded.height).toBe(1536);
	expect(decoded.channels).toBe(4);
};

const observation = (
	imageSHA: string,
	measurementEvidenceSHA: string,
): ProportionObservation => ({
	imageSHA,
	measurementEvidenceSHA,
	actualImageMeasured: true,
	canvas: [1024, 1536],
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
	},
});

describe("review before next dispatch acceptance contract", () => {
	test("actual typed gate PASS alone permits one next local transport", async () => {
		const directory = await mkdtemp(join(tmpdir(), "review-dispatch-"));
		let server: ReturnType<typeof createServer> | undefined;
		try {
			const previousImage = image();
			const measurementBytes = Buffer.from(
				JSON.stringify({
					...observation(hash(previousImage), "0".repeat(64)),
					canvas: [1024, 1536],
				}),
			);
			const evidence = Buffer.from("synthetic reviewer evidence");
			const previousImagePath = join(directory, "previous.png");
			const measurementPath = join(directory, "measurement.json");
			const profilePath = join(directory, "profile.json");
			const evidencePath = join(directory, "evidence", "review.txt");
			const reviewPath = join(directory, "review.json");
			await mkdir(join(directory, "evidence"));
			await Promise.all([
				writeFile(previousImagePath, previousImage),
				writeFile(measurementPath, measurementBytes),
				writeFile(evidencePath, evidence),
			]);
			const profile = createProportionProfile({
				commonReference: observation(
					hash(previousImage),
					hash(measurementBytes),
				),
				bodyReference: observation(hash(previousImage), hash(measurementBytes)),
				bodyType: "synthetic-fixture",
				tolerance: {
					pixels: 2,
					ratio: 0.05,
					evidenceSHA: hash(measurementBytes),
				},
			});
			const encodedProfile = Buffer.from(JSON.stringify(profile));
			await writeFile(profilePath, encodedProfile);
			const previous = {
				id: "synthetic-previous",
				requestId: "synthetic-request-previous",
				result: { path: previousImagePath },
			};
			const review = {
				characterId: previous.id,
				requestId: previous.requestId,
				sha256: hash(previousImage),
				actualImageViewed: true,
				technicalVerdict: "pass",
				evidence: [{ path: "evidence/review.txt", sha256: hash(evidence) }],
				acceptanceSchema: "portrait-integrated-acceptance.v1",
				positionReference: {
					referenceVersion: "synthetic-position-reference.v1",
					referenceSHA: "a".repeat(64),
					ruleSHA: "b".repeat(64),
				},
				criteria: Object.fromEntries(
					[
						"Q01",
						"Q02",
						"Q03",
						"Q04",
						"Q05",
						"Q06",
						"Q07",
						"Q08",
						"Q09",
						"Q10",
						"authoredIdentity",
						"approvedPositionIntervals",
						"opaqueInterior",
						"naturalSilhouette",
						"defringe",
					].map((name) => [
						name,
						{
							verdict: "pass",
							scope: "whole-image",
							imageSHA: hash(previousImage),
							evidenceSHA: hash(evidence),
						},
					]),
				),
			};
			await writeFile(reviewPath, JSON.stringify(review));
			const proportionRequirement = {
				profilePath,
				profileFileSHA: hash(encodedProfile),
				positionReference: {
					referenceVersion: "synthetic-position-reference.v1",
					referenceSHA: "a".repeat(64),
					ruleSHA: "b".repeat(64),
				},
				measurementPath,
				profile,
			};
			const transportFixture = createTransportFixture();
			const outputPath = join(directory, "next.png");
			const input = {
				previous,
				reviewPath,
				proportionRequirement,
				nextRequest: {
					projection: transportFixture.projection,
					orderedImageBytes: transportFixture.orderedImageBytes,
					connection: {
						baseUrl: "http://127.0.0.1",
						allowUnauthenticated: true,
					},
					requestId: "synthetic-request-next",
					outputPath,
				},
			};
			const directVerdict = await requireBatchReview(
				previous,
				reviewPath,
				proportionRequirement,
			);
			expect(directVerdict.pass).toBe(true);
			let wireCalls = 0;
			const transportResponse = image();
			verifyPortraitPng(transportResponse);
			const transportDecoded = decodePng(transportResponse);
			let foreground = 0;
			let opaqueForeground = 0;
			let semitransparentForeground = 0;
			for (let alpha = 3; alpha < transportDecoded.pixels.length; alpha += 4) {
				const value = transportDecoded.pixels[alpha] ?? 0;
				if (value > 0) {
					foreground += 1;
					if (value === 255) opaqueForeground += 1;
					else semitransparentForeground += 1;
				}
			}
			expect(foreground).toBeGreaterThan(0);
			expect(opaqueForeground / foreground).toBeGreaterThanOrEqual(0.9);
			expect(semitransparentForeground).toBeGreaterThan(0);
			server = createServer(async (_request, response) => {
				wireCalls += 1;
				response.writeHead(200, { "content-type": "application/json" });
				response.end(
					JSON.stringify({
						data: [
							{ b64_json: Buffer.from(transportResponse).toString("base64") },
						],
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
			const result = await dispatchAfterBatchReview({
				...input,
				nextRequest: {
					...input.nextRequest,
					connection: {
						baseUrl: `http://127.0.0.1:${address.port}`,
						allowUnauthenticated: true,
					},
				},
			});
			expect(result.transportResult).toBeDefined();
			expect(result.transportResult?.responseStatus).toBe(200);
			expect(wireCalls).toBe(1);
			expect(result.providerCalls).toBe(1);
			expect(result.verdict?.pass).toBe(true);
		} finally {
			if (server?.listening) {
				const closed = once(server, "close", {
					signal: AbortSignal.timeout(5000),
				});
				server.closeAllConnections();
				server.close();
				await closed;
			}
			await rm(directory, { recursive: true, force: true });
		}
	});

	test("unknown terminal holds before transport with reconciliation code", async () => {
		const directory = await mkdtemp(join(tmpdir(), "review-dispatch-hold-"));
		let requests = 0;
		const server = createServer(() => {
			requests += 1;
		});
		try {
			const fixture = createTransportFixture();
			const listening = once(server, "listening", {
				signal: AbortSignal.timeout(5000),
			});
			server.listen(0, "127.0.0.1");
			await listening;
			const address = server.address();
			if (address === null || typeof address === "string")
				throw new Error("Expected loopback address");
			const reviewPath = join(directory, "unused-review.json");
			const previous = {
				id: "synthetic-unknown-terminal",
				requestId: "synthetic-unknown-request",
				status: "DISPATCHED_RESPONSE_UNKNOWN",
			};
			await expect(
				requireBatchReview(previous, reviewPath, {}),
			).rejects.toMatchObject({
				name: "BatchHoldError",
				code: "TERMINAL_RECONCILIATION_REQUIRED",
			});
			const result = dispatchAfterBatchReview({
				previous,
				reviewPath,
				proportionRequirement: {},
				nextRequest: {
					projection: fixture.projection,
					orderedImageBytes: fixture.orderedImageBytes,
					connection: {
						baseUrl: `http://127.0.0.1:${address.port}`,
						allowUnauthenticated: true,
					},
					requestId: "synthetic-next-unknown",
					outputPath: join(directory, "unknown.png"),
				},
			});
			await expect(result).rejects.toMatchObject({
				name: "BatchHoldError",
				code: "TERMINAL_RECONCILIATION_REQUIRED",
			});
			expect(requests).toBe(0);
		} finally {
			const closed = once(server, "close", {
				signal: AbortSignal.timeout(5000),
			});
			server.closeAllConnections();
			server.close();
			await closed;
			await rm(directory, { recursive: true, force: true });
		}
	});

	test("missing pins hold before transport with operator-pins code", async () => {
		const directory = await mkdtemp(join(tmpdir(), "review-dispatch-pins-"));
		let requests = 0;
		const server = createServer(() => {
			requests += 1;
		});
		try {
			const listening = once(server, "listening", {
				signal: AbortSignal.timeout(5000),
			});
			server.listen(0, "127.0.0.1");
			await listening;
			const address = server.address();
			if (address === null || typeof address === "string")
				throw new Error("Expected loopback address");
			const fixture = createTransportFixture();
			const candidatePath = join(directory, "candidate.png");
			const candidate = image();
			await writeFile(candidatePath, candidate);
			const reviewPath = join(directory, "review.json");
			await writeFile(
				reviewPath,
				JSON.stringify({
					characterId: "synthetic-missing-pins",
					requestId: "synthetic-request-missing-pins",
					sha256: hash(candidate),
					actualImageViewed: true,
					technicalVerdict: "pass",
					evidence: [
						{ path: "evidence.txt", sha256: hash(Buffer.from("evidence")) },
					],
				}),
			);
			await expect(
				requireBatchReview(
					{
						id: "synthetic-missing-pins",
						requestId: "synthetic-request-missing-pins",
						result: { path: candidatePath },
					},
					reviewPath,
					{},
				),
			).rejects.toMatchObject({
				name: "BatchHoldError",
				code: "OPERATOR_PINS_REQUIRED",
			});
			const previous = {
				id: "synthetic-missing-pins",
				requestId: "synthetic-request-missing-pins",
				result: { path: candidatePath },
			};
			const result = dispatchAfterBatchReview({
				previous,
				reviewPath,
				proportionRequirement: {},
				nextRequest: {
					projection: fixture.projection,
					orderedImageBytes: fixture.orderedImageBytes,
					connection: {
						baseUrl: `http://127.0.0.1:${address.port}`,
						allowUnauthenticated: true,
					},
					requestId: "synthetic-next-missing-pins",
					outputPath: join(directory, "missing-pins.png"),
				},
			});
			await expect(result).rejects.toMatchObject({
				name: "BatchHoldError",
				code: "OPERATOR_PINS_REQUIRED",
			});
			expect(requests).toBe(0);
		} finally {
			const closed = once(server, "close", {
				signal: AbortSignal.timeout(5000),
			});
			server.closeAllConnections();
			server.close();
			await closed;
			await rm(directory, { recursive: true, force: true });
		}
	});

	test("failed review row holds before transport with acceptance-failed code", async () => {
		const directory = await mkdtemp(join(tmpdir(), "review-dispatch-row-"));
		let requests = 0;
		const server = createServer(() => {
			requests += 1;
		});
		try {
			const listening = once(server, "listening", {
				signal: AbortSignal.timeout(5000),
			});
			server.listen(0, "127.0.0.1");
			await listening;
			const address = server.address();
			if (address === null || typeof address === "string")
				throw new Error("Expected loopback address");
			const fixture = createTransportFixture();
			const candidate = image();
			const candidatePath = join(directory, "candidate.png");
			const evidence = Buffer.from("synthetic failed-row evidence");
			const evidencePath = join(directory, "evidence.txt");
			const reviewPath = join(directory, "review.json");
			await Promise.all([
				writeFile(candidatePath, candidate),
				writeFile(evidencePath, evidence),
			]);
			await writeFile(
				reviewPath,
				JSON.stringify({
					characterId: "synthetic-failed-row",
					requestId: "synthetic-request-failed-row",
					sha256: hash(candidate),
					actualImageViewed: true,
					technicalVerdict: "pass",
					acceptanceSchema: "portrait-integrated-acceptance.v1",
					positionReference: {
						referenceVersion: "synthetic-position.v1",
						referenceSHA: "a".repeat(64),
						ruleSHA: "b".repeat(64),
					},
					criteria: Object.fromEntries(
						[
							"Q01",
							"Q02",
							"Q03",
							"Q04",
							"Q05",
							"Q06",
							"Q07",
							"Q08",
							"Q09",
							"Q10",
							"authoredIdentity",
							"approvedPositionIntervals",
							"opaqueInterior",
							"naturalSilhouette",
							"defringe",
						].map((name) => [
							name,
							{
								verdict: name === "naturalSilhouette" ? "fail" : "pass",
								scope: "whole-image",
								imageSHA: hash(candidate),
								evidenceSHA: hash(evidence),
							},
						]),
					),
					evidence: [{ path: "evidence.txt", sha256: hash(evidence) }],
				}),
			);
			const failRowReview = JSON.parse(await readFile(reviewPath, "utf8"));
			failRowReview.criteria.naturalSilhouette.verdict = "pass";
			await writeFile(reviewPath, JSON.stringify(failRowReview));
			failRowReview.criteria.naturalSilhouette.verdict = "fail";
			await writeFile(reviewPath, JSON.stringify(failRowReview));
			const positionReference = {
				referenceVersion: "synthetic-position.v1",
				referenceSHA: "a".repeat(64),
				ruleSHA: "b".repeat(64),
			};
			const profile = createProportionProfile({
				commonReference: observation(hash(candidate), hash(evidence)),
				bodyReference: observation(hash(candidate), hash(evidence)),
				bodyType: "synthetic-fixture",
				tolerance: { pixels: 2, ratio: 0.05, evidenceSHA: hash(evidence) },
			});
			const profilePath = join(directory, "profile.json");
			const measurementPath = join(directory, "measurement.json");
			const measurementBytes = Buffer.from(
				JSON.stringify({
					...observation(hash(candidate), hash(evidence)),
					canvas: [1024, 1536],
				}),
			);
			await Promise.all([
				writeFile(profilePath, JSON.stringify(profile)),
				writeFile(measurementPath, measurementBytes),
			]);
			const pins = {
				profilePath,
				profileFileSHA: hash(Buffer.from(JSON.stringify(profile))),
				measurementPath,
				positionReference,
			};
			const previous = {
				id: "synthetic-failed-row",
				requestId: "synthetic-request-failed-row",
				result: { path: candidatePath },
			};
			const failedVerdict = requireBatchReview(previous, reviewPath, pins);
			await expect(failedVerdict).rejects.toMatchObject({
				name: "BatchHoldError",
				code: "ACCEPTANCE_FAILED",
			});
			const result = dispatchAfterBatchReview({
				previous,
				reviewPath,
				proportionRequirement: pins,
				nextRequest: {
					projection: fixture.projection,
					orderedImageBytes: fixture.orderedImageBytes,
					connection: {
						baseUrl: `http://127.0.0.1:${address.port}`,
						allowUnauthenticated: true,
					},
					requestId: "synthetic-next-failed-row",
					outputPath: join(directory, "failed-row.png"),
				},
			});
			await expect(result).rejects.toMatchObject({
				name: "BatchHoldError",
				code: "ACCEPTANCE_FAILED",
			});
			expect(requests).toBe(0);
		} finally {
			const closed = once(server, "close", {
				signal: AbortSignal.timeout(5000),
			});
			server.closeAllConnections();
			server.close();
			await closed;
			await rm(directory, { recursive: true, force: true });
		}
	});
});
