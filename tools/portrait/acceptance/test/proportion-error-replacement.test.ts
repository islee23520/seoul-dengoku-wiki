import { describe, expect, it } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BatchHoldError, requireBatchReview } from "../src/batch-gate.js";
import { evaluatePortraitAcceptance } from "../src/evaluator-replacement.js";
import {
	measureProportions,
	validateProportionProfile,
	validateSharedProportionProfiles,
} from "../src/proportion.js";
import {
	ProportionError,
	type ProportionErrorCode,
} from "../src/proportion-error.js";
import {
	digest,
	makeObservation,
	makePortrait,
	makeProfile,
} from "./helpers/fixtures.js";

const codes = [
	"SOURCE_BINDING_REQUIRED",
	"INVALID_CANVAS",
	"INVALID_LANDMARKS",
	"TORSO_LEVEL_MISMATCH",
	"FACE_OUTSIDE_HEAD",
	"PUPILS_OUTSIDE_FACE",
	"NONPOSITIVE_LANDMARK_SPANS",
	"BODY_TYPE_REQUIRED",
	"INVALID_TOLERANCES",
	"PROFILE_REQUIRED",
	"PROFILE_HASH_MISMATCH",
	"INVALID_SOURCE_PROFILE",
	"INVALID_TARGETS",
	"INVALID_PROFILE_TOLERANCES",
	"BATCH_PROFILES_REQUIRED",
	"BATCH_COMMON_STANDARD_MISMATCH",
	"BATCH_BODY_STANDARD_MISMATCH",
] as const satisfies readonly ProportionErrorCode[];

describe("replacement constructor contract", () => {
	for (const code of codes) {
		it(`preserves code ${code}`, () => {
			expect(new ProportionError(code, "authored diagnostic").code).toBe(code);
		});
		it(`preserves Error identity, name and message for ${code}`, () => {
			const error = new ProportionError(code, "authored diagnostic");
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(ProportionError);
			expect(error.message).toBe("authored diagnostic");
			expect(error.name).toBe("ProportionError");
		});
	}
});

const observation = makeObservation("a".repeat(64), "b".repeat(64));
const producers: readonly {
	label: string;
	code: ProportionErrorCode;
	run: () => unknown;
}[] = [
	{
		label: "null observation",
		code: "SOURCE_BINDING_REQUIRED",
		run: () => measureProportions(null),
	},
	{
		label: "invalid canvas",
		code: "INVALID_CANVAS",
		run: () => measureProportions({ ...observation, canvas: [1, 1] }),
	},
	{
		label: "invalid landmarks",
		code: "INVALID_LANDMARKS",
		run: () => measureProportions({ ...observation, landmarks: {} }),
	},
	{
		label: "invalid profile",
		code: "PROFILE_REQUIRED",
		run: () => validateProportionProfile({}),
	},
	{
		label: "empty shared batch",
		code: "BATCH_PROFILES_REQUIRED",
		run: () => validateSharedProportionProfiles([]),
	},
];

describe("real producer constructor identity", () => {
	for (const producer of producers) {
		it(producer.label, () => {
			let caught: unknown;
			try {
				producer.run();
			} catch (error: unknown) {
				caught = error;
			}
			expect(caught).toBeInstanceOf(Error);
			expect(caught).toMatchObject({ code: producer.code });
			expect(caught).toBeInstanceOf(ProportionError);
		});
	}
});

const imageBytes = makePortrait();
const imageSHA = digest(imageBytes);
const evidence = new TextEncoder().encode(
	"independent replacement review evidence",
);
const evidenceSHA = digest(evidence);
const measurementBytes = new TextEncoder().encode(
	JSON.stringify(makeObservation(imageSHA, "0".repeat(64))),
);
const profile = makeProfile(imageBytes, measurementBytes);
const positionReference = {
	referenceVersion: "fixture-v1",
	referenceSHA: "a".repeat(64),
	ruleSHA: "b".repeat(64),
};
const rowNames = [
	...Array.from(
		{ length: 10 },
		(_, index) => `Q${String(index + 1).padStart(2, "0")}`,
	),
	"authoredIdentity",
	"approvedPositionIntervals",
	"opaqueInterior",
	"naturalSilhouette",
	"defringe",
];
const review = {
	characterId: "K001",
	requestId: "req-1",
	sha256: imageSHA,
	actualImageViewed: true,
	technicalVerdict: "pass",
	acceptanceSchema: "portrait-integrated-acceptance.v1",
	positionReference,
	criteria: Object.fromEntries(
		rowNames.map((name) => [
			name,
			{ verdict: "pass", scope: "whole-image", imageSHA, evidenceSHA },
		]),
	),
	evidence: [{ sha256: evidenceSHA, path: "evidence.txt" }],
};

// Integration guards: shipped catch paths already pass before replacement wiring.
describe("real consumer integration guards", () => {
	it("evaluator converts invalid profile to measuredProportions failure", () => {
		const input = {
			characterId: "K001",
			requestId: "req-1",
			imageBytes,
			review,
			profile,
			measurementBytes,
			evidence: [evidence],
			expectedPositionReference: positionReference,
		};
		expect(evaluatePortraitAcceptance(input).failures).toEqual([]);
		const result = evaluatePortraitAcceptance({ ...input, profile: {} });
		expect(result.pass).toBe(false);
		expect(result.failures).toEqual(["measuredProportions"]);
		expect(result.proportions).toBeNull();
	});
	it("batch holds re-pinned invalid profile JSON as INVALID_ARTIFACT", async () => {
		const root = await mkdtemp(join(tmpdir(), "proportion-error-replacement-"));
		try {
			const imagePath = join(root, "image.png");
			const reviewPath = join(root, "review.json");
			const profilePath = join(root, "profile.json");
			const measurementPath = join(root, "measurement.json");
			const validProfileBytes = new TextEncoder().encode(
				JSON.stringify(profile),
			);
			await Promise.all([
				writeFile(imagePath, imageBytes),
				writeFile(reviewPath, JSON.stringify(review)),
				writeFile(profilePath, validProfileBytes),
				writeFile(measurementPath, measurementBytes),
				writeFile(join(root, "evidence.txt"), evidence),
			]);
			const terminal = {
				id: "K001",
				requestId: "req-1",
				result: { path: imagePath },
			};
			const pins = {
				profilePath,
				profileFileSHA: digest(validProfileBytes),
				measurementPath,
				positionReference,
			};
			expect((await requireBatchReview(terminal, reviewPath, pins)).pass).toBe(
				true,
			);
			const invalidProfileBytes = new TextEncoder().encode("{}");
			await writeFile(profilePath, invalidProfileBytes);
			let caught: unknown;
			try {
				await requireBatchReview(terminal, reviewPath, {
					...pins,
					profileFileSHA: digest(invalidProfileBytes),
				});
			} catch (error: unknown) {
				caught = error;
			}
			expect(caught).toBeInstanceOf(BatchHoldError);
			expect(caught).toMatchObject({ code: "INVALID_ARTIFACT" });
		} finally {
			await rm(root, { recursive: true });
		}
	});
});
