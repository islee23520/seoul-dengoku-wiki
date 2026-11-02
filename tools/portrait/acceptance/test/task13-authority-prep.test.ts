import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	executeFullAcceptance,
	type FullAcceptanceOptions,
} from "../src/acceptance-ingress.js";
import { PortraitCliError } from "../src/cli.js";
import { encodePng } from "../src/png.js";

const hash = (value: string | Uint8Array): string =>
	createHash("sha256").update(value).digest("hex");
const encode = (value: unknown) => Buffer.from(JSON.stringify(value));
const position = {
	referenceVersion:
		"latest-approved16-second-v2-23b0d8928070532362f25588c835fc49ee03260b4a24a4b2e21d55d64181b95c-9910aa70d5cfd22a0eb1f0cbfce5020b51cf6a86579c938253943d1343248472",
	referenceSHA:
		"82f5d30e628b184674dad64a48e9fde120d396548e19f91b70e212a0cd0ba219",
	ruleSHA: "98fccc6909b710742c99970dcbddcb06127952f4871b4488d7a8d63ea4b774bc",
};
const criteriaNames = [
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
];

function canonical(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
	if (typeof value === "object" && value !== null)
		return `{${Object.keys(value)
			.sort()
			.map(
				(key) => `${JSON.stringify(key)}:${canonical(Reflect.get(value, key))}`,
			)
			.join(",")}}`;
	return JSON.stringify(value);
}

function portrait(width = 1024, height = 1536): Uint8Array {
	const pixels = new Uint8Array(width * height * 4);
	for (let y = Math.floor(height / 4); y < Math.floor(height / 2); y++) {
		for (let x = Math.floor(width / 3); x < Math.floor((width * 2) / 3); x++) {
			const offset = (y * width + x) * 4;
			pixels.set([80, 100, 120, 255], offset);
		}
	}
	return encodePng({ width, height, pixels });
}

function measurement(imageSHA: string, canvas: [number, number]) {
	return {
		imageSHA,
		actualImageMeasured: true,
		canvas,
		bodyType: "controlled-negative-fixture",
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
	};
}

type Fixture = Awaited<ReturnType<typeof fixture>>;

async function fixture() {
	const root = await mkdtemp(join(tmpdir(), "task13-authority-prep-"));
	const path = (name: string) => join(root, name);
	const imageBytes = portrait();
	const imageSHA = hash(imageBytes);
	const measurementValue = measurement(imageSHA, [1024, 1536]);
	const measurementBytes = encode(measurementValue);
	const measurementSHA = hash(measurementBytes);
	const profilePayload = {
		schema: "portrait-proportion-profile.v1",
		canvas: [1024, 1536],
		bodyType: "controlled-negative-fixture",
		commonSourceSHA: imageSHA,
		commonMeasurementSHA: measurementSHA,
		bodySourceSHA: imageSHA,
		bodyMeasurementSHA: measurementSHA,
		targets: {
			headWidth: 200,
			headHeight: 400,
			faceWidth: 120,
			faceHeight: 340,
			eyeY: 260,
			headCenterX: 512,
			crownY: 100,
		},
		ratios: { shoulderToHead: 1.5, torsoToHead: 1 },
		tolerance: { pixels: 2, ratio: 0.05, evidenceSHA: measurementSHA },
	};
	const profile = {
		...profilePayload,
		profileSHA: hash(canonical(profilePayload)),
	};
	const profileBytes = encode(profile);
	const evidence = Buffer.from(
		"controlled task13 negative fixture; no semantic or owner authority",
	);
	const evidenceSHA = hash(evidence);
	const review = {
		characterId: "K998",
		requestId: "b000c9ba-6b94-44c2-ad3b-e2a70d91bf81",
		sha256: imageSHA,
		actualImageViewed: true,
		technicalVerdict: "pass",
		acceptanceSchema: "portrait-integrated-acceptance.v1",
		positionReference: position,
		criteria: Object.fromEntries(
			criteriaNames.map((name) => [
				name,
				{
					verdict: "pass",
					scope: "whole-image",
					imageSHA,
					evidenceSHA,
				},
			]),
		),
		evidence: [{ path: "evidence.bin", sha256: evidenceSHA }],
	};
	await Promise.all([
		writeFile(path("image.png"), imageBytes),
		writeFile(path("measurement.json"), measurementBytes),
		writeFile(path("profile.json"), profileBytes),
		writeFile(path("review.json"), encode(review)),
		writeFile(path("evidence.bin"), evidence),
		writeFile(
			path("authority.json"),
			encode({ schema: "position-reference.v2", ...position }),
		),
	]);
	const options: FullAcceptanceOptions = {
		mode: "operator",
		character: "K998",
		request: "b000c9ba-6b94-44c2-ad3b-e2a70d91bf81",
		paths: [
			path("image.png"),
			path("review.json"),
			path("profile.json"),
			path("measurement.json"),
		],
		profileSHA: hash(profileBytes),
		positionReference: path("authority.json"),
	};
	return {
		root,
		path,
		options,
		imageSHA,
		measurementValue,
		review,
	};
}

async function withFixture(action: (value: Fixture) => Promise<void>) {
	const value = await fixture();
	try {
		await action(value);
	} finally {
		await rm(value.root, { recursive: true });
	}
}

describe("task13 authority preparation scaffold", () => {
	let templatesRoot = "";
	beforeAll(() => {
		templatesRoot = join(import.meta.dir, "../task13");
	});
	afterAll(() => {
		templatesRoot = "";
	});

	it("pins the recovered strict four-field position authority", async () => {
		const authority = JSON.parse(
			await readFile(join(templatesRoot, "authority.json"), "utf8"),
		);
		expect(authority).toEqual({
			schema: "position-reference.v2",
			...position,
		});
		expect(Object.keys(authority)).toHaveLength(4);
	});

	it("keeps all authentic facts visibly pending", async () => {
		const [bundle, review, profile, measured] = await Promise.all(
			[
				"bundle.template.json",
				"review.template.json",
				"profile.template.json",
				"measurement.template.json",
			].map(async (name) =>
				JSON.parse(await readFile(join(templatesRoot, name), "utf8")),
			),
		);
		expect(bundle.status).toBe("INCOMPLETE_AUTHENTIC_INPUTS_REQUIRED");
		expect(bundle.literalArgv).toEqual([
			"bun",
			"tools/portrait/acceptance/src/cli.ts",
			"<task6-sealed-result.png>",
			"<authentic-review.json>",
			"<owner-approved-profile.json>",
			"<complete-final-measurement.json>",
			"--character",
			"K998",
			"--request",
			"b000c9ba-6b94-44c2-ad3b-e2a70d91bf81",
			"--profile-sha",
			"<exact-owner-approved-profile-file-sha256>",
			"--position-reference",
			"tools/portrait/acceptance/task13/authority.json",
		]);
		expect(review.actualImageViewed).toBe(false);
		expect(review.technicalVerdict).toBeNull();
		expect(
			Object.values(review.criteria).every((value) => value === null),
		).toBe(true);
		expect(profile.profileSHA).toBeNull();
		expect(profile.ownerApprovalReceipt).toBeNull();
		expect(measured.actualImageMeasured).toBe(false);
		expect(Object.keys(measured.landmarks)).toHaveLength(13);
		expect(
			Object.values(measured.landmarks).every((value) => value === null),
		).toBe(true);
	});
});

describe("task13 controlled negative bundles against public ingress", () => {
	it("rejects a missing measurement artifact", () =>
		withFixture(async (value) => {
			await rm(value.path("measurement.json"));
			let error: unknown;
			try {
				await executeFullAcceptance(value.options);
			} catch (cause: unknown) {
				error = cause;
			}
			expect(error).toMatchObject({
				name: PortraitCliError.name,
				code: "MISSING_ARTIFACT",
			});
		}));

	it("rejects a measurement bound to another image SHA", () =>
		withFixture(async (value) => {
			await writeFile(
				value.path("measurement.json"),
				encode({ ...value.measurementValue, imageSHA: "f".repeat(64) }),
			);
			const verdict = await executeFullAcceptance(value.options);
			expect(verdict.pass).toBe(false);
			expect(verdict.failures).toEqual(["measuredProportions"]);
		}));

	it("rejects incomplete thirteen-landmark measurement", () =>
		withFixture(async (value) => {
			const landmarks = { ...value.measurementValue.landmarks };
			Reflect.deleteProperty(landmarks, "torsoRight");
			await writeFile(
				value.path("measurement.json"),
				encode({ ...value.measurementValue, landmarks }),
			);
			const verdict = await executeFullAcceptance(value.options);
			expect(verdict.pass).toBe(false);
			expect(verdict.failures).toEqual(["measuredProportions"]);
		}));

	it("rejects a non-owner profile file SHA pin", () =>
		withFixture(async (value) => {
			let error: unknown;
			try {
				await executeFullAcceptance({
					...value.options,
					profileSHA: "f".repeat(64),
				});
			} catch (cause: unknown) {
				error = cause;
			}
			expect(error).toMatchObject({
				name: PortraitCliError.name,
				code: "INVALID_PROFILE_PIN",
			});
		}));

	it("rejects the wrong candidate canvas", () =>
		withFixture(async (value) => {
			const wrongImage = portrait(512, 768);
			const wrongSHA = hash(wrongImage);
			await Promise.all([
				writeFile(value.path("image.png"), wrongImage),
				writeFile(
					value.path("measurement.json"),
					encode({
						...value.measurementValue,
						imageSHA: wrongSHA,
						canvas: [512, 768],
					}),
				),
				writeFile(
					value.path("review.json"),
					encode({
						...value.review,
						sha256: wrongSHA,
						criteria: Object.fromEntries(
							criteriaNames.map((name) => [
								name,
								{
									...value.review.criteria[name],
									imageSHA: wrongSHA,
								},
							]),
						),
					}),
				),
			]);
			const verdict = await executeFullAcceptance(value.options);
			expect(verdict.pass).toBe(false);
			expect(verdict.failures).toEqual(["canvasRGBA", "measuredProportions"]);
		}));
});
