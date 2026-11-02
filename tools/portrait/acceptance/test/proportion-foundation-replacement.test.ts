import { describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ZodError } from "zod";
import {
	evaluatePortraitAcceptance,
	createProportionProfile as publicCreate,
	requireBatchReview,
} from "../src/index.js";
import { encodePng, PngError } from "../src/png.js";
import type {
	LandmarkSet,
	ProportionObservation,
	ProportionProfile,
} from "../src/proportion.js";
import * as shipped from "../src/proportion.js";
import * as fresh from "../src/proportion-foundation.js";

const digest = (value: string | Uint8Array): string =>
	createHash("sha256").update(value).digest("hex");
const encode = (value: unknown): Uint8Array =>
	new TextEncoder().encode(JSON.stringify(value));
// Independent canonical oracle, never imported from the product.
function canonical(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
	if (typeof value === "object" && value !== null)
		return (
			"{" +
			Object.keys(value)
				.sort()
				.map(
					(key) =>
						`${JSON.stringify(key)}:${canonical(Reflect.get(value, key))}`,
				)
				.join(",") +
			"}"
		);
	return JSON.stringify(value);
}
const landmarks: LandmarkSet = {
	crown: [510, 101],
	chin: [510, 503],
	headLeft: [410, 300],
	headRight: [614, 300],
	faceTop: [510, 163],
	faceLeft: [450, 301],
	faceRight: [574, 301],
	leftPupil: [471, 257],
	rightPupil: [552, 263],
	leftShoulder: [359, 560],
	rightShoulder: [665, 560],
	torsoLeft: [410, 620],
	torsoRight: [614, 620],
};
const observation: ProportionObservation = {
	imageSHA: "a".repeat(64),
	measurementEvidenceSHA: "b".repeat(64),
	actualImageMeasured: true,
	canvas: [1024, 1536],
	bodyType: "authored-body",
	landmarks,
};
const expectedMetrics = {
	headWidth: 204,
	headHeight: 402,
	faceWidth: 124,
	faceHeight: 340,
	eyeY: 260,
	headCenterX: 512,
	crownY: 101,
	shoulderWidth: 306,
	torsoWidth: 204,
};
const body: ProportionObservation = {
	...observation,
	imageSHA: "c".repeat(64),
	measurementEvidenceSHA: "d".repeat(64),
	landmarks: {
		...landmarks,
		leftShoulder: [308, 560],
		rightShoulder: [716, 560],
		torsoLeft: [359, 620],
		torsoRight: [665, 620],
	},
};
const tolerance = { pixels: 2, ratio: 0.125, evidenceSHA: "e".repeat(64) };
const payload: Omit<ProportionProfile, "profileSHA"> = {
	schema: "portrait-proportion-profile.v1",
	canvas: [1024, 1536],
	bodyType: "authored-body",
	commonSourceSHA: "a".repeat(64),
	commonMeasurementSHA: "b".repeat(64),
	bodySourceSHA: "c".repeat(64),
	bodyMeasurementSHA: "d".repeat(64),
	targets: {
		headWidth: 204,
		headHeight: 402,
		faceWidth: 124,
		faceHeight: 340,
		eyeY: 260,
		headCenterX: 512,
		crownY: 101,
	},
	ratios: { shoulderToHead: 2, torsoToHead: 1.5 },
	tolerance,
	semantics: {
		head: "attached-hair-left-right-crown-to-lowest-chin",
		face: "face-top-skin-to-chin-and-skin-left-right",
		shoulders: "joint-centers-not-garment-extents",
		torso: "authored-visible-torso-cross-section-same-level",
	},
};
const profile: ProportionProfile = {
	...payload,
	profileSHA: digest(canonical(payload)),
};
const input = {
	commonReference: observation,
	bodyReference: body,
	bodyType: "authored-body",
	tolerance,
};
const repin = (patch: Record<string, unknown>): unknown => {
	const changed = { ...payload, ...patch };
	return { ...changed, profileSHA: digest(canonical(changed)) };
};

// Every row is independently registered; an earlier rejection cannot hide a later one.
const geometryCases: readonly { name: string; value: unknown; code: string }[] =
	[
		{
			name: "source before canvas and landmarks",
			value: { ...observation, imageSHA: "bad", canvas: [1, 1], landmarks: {} },
			code: "SOURCE_BINDING_REQUIRED",
		},
		{
			name: "actual measured identity",
			value: { ...observation, actualImageMeasured: false },
			code: "SOURCE_BINDING_REQUIRED",
		},
		{
			name: "canvas before landmarks",
			value: { ...observation, canvas: [1, 1], landmarks: {} },
			code: "INVALID_CANVAS",
		},
		{
			name: "missing landmark",
			value: { ...observation, landmarks: { ...landmarks, crown: undefined } },
			code: "INVALID_LANDMARKS",
		},
		{
			name: "out of canvas",
			value: { ...observation, landmarks: { ...landmarks, crown: [510, -1] } },
			code: "INVALID_LANDMARKS",
		},
		{
			name: "torso level before face and pupil",
			value: {
				...observation,
				landmarks: {
					...landmarks,
					torsoRight: [614, 621],
					faceTop: [510, 90],
					leftPupil: [1, 1],
				},
			},
			code: "TORSO_LEVEL_MISMATCH",
		},
		{
			name: "face before pupil",
			value: {
				...observation,
				landmarks: { ...landmarks, faceTop: [510, 90], leftPupil: [1, 1] },
			},
			code: "FACE_OUTSIDE_HEAD",
		},
		{
			name: "pupil outside face",
			value: {
				...observation,
				landmarks: { ...landmarks, leftPupil: [449, 260] },
			},
			code: "PUPILS_OUTSIDE_FACE",
		},
		{
			name: "nonpositive shoulder span",
			value: {
				...observation,
				landmarks: { ...landmarks, rightShoulder: [359, 560] },
			},
			code: "NONPOSITIVE_LANDMARK_SPANS",
		},
	];
const profileCases: readonly { name: string; value: unknown; code: string }[] =
	[
		{
			name: "shell before hash",
			value: { ...profile, schema: "wrong", profileSHA: "bad" },
			code: "PROFILE_REQUIRED",
		},
		{
			name: "hash before source",
			value: { ...profile, canvas: [1, 1] },
			code: "PROFILE_HASH_MISMATCH",
		},
		{
			name: "repinned invalid source",
			value: repin({ commonSourceSHA: "bad", targets: null }),
			code: "INVALID_SOURCE_PROFILE",
		},
		{
			name: "repinned invalid target",
			value: repin({ targets: { ...payload.targets, headWidth: "204" } }),
			code: "INVALID_TARGETS",
		},
		{
			name: "strict ratio schema",
			value: repin({
				ratios: { shoulderToHead: 2, torsoToHead: 1.5, extra: 1 },
			}),
			code: "INVALID_TARGETS",
		},
		{
			name: "positive ratio",
			value: repin({ ratios: { shoulderToHead: 0, torsoToHead: 1.5 } }),
			code: "INVALID_TARGETS",
		},
		{
			name: "repinned tolerance",
			value: repin({ tolerance: { ...tolerance, pixels: -1 } }),
			code: "INVALID_PROFILE_TOLERANCES",
		},
	];
describe("fresh U02 direct foundation RED", () => {
	it("measures nine literal pixel metrics", () =>
		expect(fresh.measureProportions(observation)).toEqual(expectedMetrics));
	it("preserves fractional point geometry", () =>
		expect(
			fresh.measureProportions({
				...observation,
				landmarks: {
					...landmarks,
					headLeft: [410.5, 300],
					headRight: [614.5, 300],
				},
			}),
		).toEqual({ ...expectedMetrics, headCenterX: 512.5 }));
	for (const row of geometryCases)
		it(row.name, () => {
			let error: unknown;
			try {
				fresh.measureProportions(row.value);
			} catch (cause: unknown) {
				error = cause;
			}
			expect(error).toBeInstanceOf(shipped.ProportionError);
			expect(error).toMatchObject({ code: row.code });
		});
	it("creates exact independent common-body profile and hash", () =>
		expect(fresh.createProportionProfile(input)).toEqual(profile));
	it("retains authored whitespace body identity", () =>
		expect(
			fresh.createProportionProfile({ ...input, bodyType: " authored-body " })
				.bodyType,
		).toBe(" authored-body "));
	for (const row of [
		{
			name: "common measurement before body and authoring",
			input: {
				...input,
				commonReference: { ...observation, imageSHA: "bad" },
				bodyReference: { ...body, imageSHA: "bad" },
				bodyType: "",
			},
			code: "SOURCE_BINDING_REQUIRED",
		},
		{
			name: "body measurement before authoring",
			input: {
				...input,
				bodyReference: { ...body, imageSHA: "bad" },
				bodyType: "",
			},
			code: "SOURCE_BINDING_REQUIRED",
		},
		{
			name: "body identifier before tolerances",
			input: {
				...input,
				bodyType: " ",
				tolerance: { ...tolerance, pixels: -1 },
			},
			code: "BODY_TYPE_REQUIRED",
		},
		{
			name: "explicit tolerance evidence",
			input: { ...input, tolerance: { ...tolerance, evidenceSHA: "bad" } },
			code: "INVALID_TOLERANCES",
		},
		{
			name: "negative pixel tolerance",
			input: { ...input, tolerance: { ...tolerance, pixels: -1 } },
			code: "INVALID_TOLERANCES",
		},
		{
			name: "nonfinite ratio tolerance",
			input: { ...input, tolerance: { ...tolerance, ratio: Infinity } },
			code: "INVALID_TOLERANCES",
		},
	])
		it(row.name, () => {
			let error: unknown;
			try {
				fresh.createProportionProfile(row.input);
			} catch (cause: unknown) {
				error = cause;
			}
			expect(error).toBeInstanceOf(shipped.ProportionError);
			expect(error).toMatchObject({ code: row.code });
		});
	it("validates independent profile with authored metadata", () => {
		const p = repin({
			authoredMetadata: { version: 3 },
			semantics: { custom: true },
		});
		expect<unknown>(fresh.validateProportionProfile(p)).toEqual(p);
	});
	for (const row of profileCases)
		it(row.name, () => {
			let error: unknown;
			try {
				fresh.validateProportionProfile(row.value);
			} catch (cause: unknown) {
				error = cause;
			}
			expect(error).toBeInstanceOf(shipped.ProportionError);
			expect(error).toMatchObject({ code: row.code });
		});
	it("passes exact body and preserves source identities", () =>
		expect(fresh.verifyProportions(profile, body)).toEqual({
			schema: "portrait-proportion-verdict.v1",
			imageSHA: "c".repeat(64),
			measurementEvidenceSHA: "d".repeat(64),
			profileSHA: profile.profileSHA,
			bodyType: "authored-body",
			measured: { ...expectedMetrics, shoulderWidth: 408, torsoWidth: 306 },
			ratios: { shoulderToHead: 2, torsoToHead: 1.5 },
			failures: [],
			pass: true,
			ownerApprovalImplied: false,
		}));
	for (const row of [
		{
			name: "inclusive pixel tolerance",
			patch: { faceRight: [576, 301] },
			failures: [],
			pass: true,
		},
		{
			name: "pixel tolerance exceeded",
			patch: { faceRight: [577, 301] },
			failures: ["faceWidth"],
			pass: false,
		},
		{
			name: "inclusive binary exact ratio tolerance",
			patch: { rightShoulder: [741.5, 560] },
			failures: [],
			pass: true,
		},
		{
			name: "shoulder ratio exceeded",
			patch: { rightShoulder: [742, 560] },
			failures: ["shoulderToHead"],
			pass: false,
		},
		{
			name: "torso ratio exceeded",
			patch: { torsoRight: [691, 620] },
			failures: ["torsoToHead"],
			pass: false,
		},
	] satisfies readonly {
		name: string;
		patch: Partial<LandmarkSet>;
		failures: string[];
		pass: boolean;
	}[])
		it(row.name, () => {
			const verdict = fresh.verifyProportions(profile, {
				...body,
				landmarks: { ...body.landmarks, ...row.patch },
			});
			expect(verdict.failures).toEqual(row.failures);
			expect(verdict.pass).toBe(row.pass);
			expect(verdict.measured.headWidth).toBe(204);
		});
	it("orders body then target then ratio failures", () =>
		expect(
			fresh.verifyProportions(profile, {
				...body,
				bodyType: "other",
				landmarks: {
					...body.landmarks,
					faceRight: [577, 301],
					rightShoulder: [742, 560],
					torsoRight: [691, 620],
				},
			}).failures,
		).toEqual(["bodyType", "faceWidth", "shoulderToHead", "torsoToHead"]));
	it("validates profile before observation", () => {
		let error: unknown;
		try {
			fresh.verifyProportions({}, null);
		} catch (cause: unknown) {
			error = cause;
		}
		expect(error).toBeInstanceOf(shipped.ProportionError);
		expect(error).toMatchObject({ code: "PROFILE_REQUIRED" });
	});
});

const pixels = new Uint8Array(1024 * 1536 * 4);
pixels.set([80, 100, 120, 255], (500 * 1024 + 500) * 4);
const png = encodePng({ width: 1024, height: 1536, pixels });
const imageSHA = digest(png);
const artifactObservation = {
	...body,
	imageSHA,
	authoredMetadata: { version: 7 },
	landmarks: { ...body.landmarks, authoredMetadata: { manual: true } },
};
const plainMeasurement = encode(artifactObservation);
const measurement = new Uint8Array(plainMeasurement.length + 3);
measurement.set([239, 187, 191]);
measurement.set(plainMeasurement, 3);
const artifactPayload = {
	...payload,
	commonSourceSHA: imageSHA,
	bodySourceSHA: imageSHA,
	commonMeasurementSHA: digest(measurement),
	bodyMeasurementSHA: digest(measurement),
};
const artifactProfile: ProportionProfile = {
	...artifactPayload,
	profileSHA: digest(canonical(artifactPayload)),
};
const artifactInput = {
	commonImageBytes: png,
	bodyImageBytes: png,
	commonMeasurementBytes: measurement,
	bodyMeasurementBytes: measurement,
	bodyType: "authored-body",
	tolerance,
};
const smallPng = encodePng({
	width: 1,
	height: 1,
	pixels: new Uint8Array([80, 100, 120, 255]),
});
const artifactCases: readonly {
	name: string;
	imageBytes: Uint8Array;
	measurementBytes: Uint8Array;
	kind: typeof PngError | typeof ZodError | typeof shipped.ProportionError;
	code?: string;
}[] = [
	{
		name: "PNG precedes malformed measurement",
		imageBytes: new Uint8Array(),
		measurementBytes: new TextEncoder().encode("{"),
		kind: PngError,
		code: "not-png",
	},
	{
		name: "wrong bound image",
		imageBytes: png,
		measurementBytes: encode({
			...artifactObservation,
			imageSHA: "f".repeat(64),
		}),
		kind: shipped.ProportionError,
		code: "SOURCE_BINDING_REQUIRED",
	},
	{
		name: "wrong measurement canvas is schema error",
		imageBytes: png,
		measurementBytes: encode({ ...artifactObservation, canvas: [1, 1] }),
		kind: ZodError,
	},
	{
		name: "missing measurement landmark is schema error",
		imageBytes: png,
		measurementBytes: encode({ ...artifactObservation, landmarks: {} }),
		kind: ZodError,
	},
	{
		name: "wrong real PNG canvas",
		imageBytes: smallPng,
		measurementBytes: encode({
			...artifactObservation,
			imageSHA: digest(smallPng),
		}),
		kind: shipped.ProportionError,
		code: "INVALID_CANVAS",
	},
	{
		name: "image binding precedes PNG canvas",
		imageBytes: smallPng,
		measurementBytes: measurement,
		kind: shipped.ProportionError,
		code: "SOURCE_BINDING_REQUIRED",
	},
	{
		name: "schema precedes image binding",
		imageBytes: png,
		measurementBytes: encode({
			...artifactObservation,
			imageSHA: "f".repeat(64),
			canvas: [1, 1],
		}),
		kind: ZodError,
	},
];
describe("fresh U02 direct artifacts RED", () => {
	it("creates byte-bound profile with original BOM evidence", () =>
		expect(fresh.createProportionProfileFromArtifacts(artifactInput)).toEqual(
			artifactProfile,
		));
	it("verifies literal artifact verdict and original bytes", () =>
		expect(
			fresh.verifyProportionArtifacts({
				profile: artifactProfile,
				imageBytes: png,
				measurementBytes: measurement,
			}),
		).toEqual({
			schema: "portrait-proportion-verdict.v1",
			imageSHA,
			measurementEvidenceSHA: digest(measurement),
			profileSHA: artifactProfile.profileSHA,
			bodyType: "authored-body",
			measured: { ...expectedMetrics, shoulderWidth: 408, torsoWidth: 306 },
			ratios: { shoulderToHead: 2, torsoToHead: 1.5 },
			failures: [],
			pass: true,
			ownerApprovalImplied: false,
		}));
	for (const row of artifactCases)
		it(row.name, () => {
			let error: unknown;
			try {
				fresh.verifyProportionArtifacts({
					profile: artifactProfile,
					imageBytes: row.imageBytes,
					measurementBytes: row.measurementBytes,
				});
			} catch (cause: unknown) {
				error = cause;
			}
			expect(error).toBeInstanceOf(row.kind);
			if (row.code) expect(error).toMatchObject({ code: row.code });
		});
	it("common artifact binding precedes body artifact", () => {
		let error: unknown;
		try {
			fresh.createProportionProfileFromArtifacts({
				...artifactInput,
				commonImageBytes: new Uint8Array(),
				bodyMeasurementBytes: encode({}),
			});
		} catch (cause: unknown) {
			error = cause;
		}
		expect(error).toBeInstanceOf(PngError);
		expect(error).toMatchObject({ code: "not-png" });
	});
	it("body artifact schema before body identifier", () => {
		let error: unknown;
		try {
			fresh.createProportionProfileFromArtifacts({
				...artifactInput,
				bodyMeasurementBytes: encode({}),
				bodyType: "",
			});
		} catch (cause: unknown) {
			error = cause;
		}
		expect(error).toBeInstanceOf(ZodError);
	});
});

const evidence = new TextEncoder().encode("U02 independent reviewer evidence");
const evidenceSHA = digest(evidence);
const positionReference = {
	referenceVersion: "U02-fixture",
	referenceSHA: "1".repeat(64),
	ruleSHA: "2".repeat(64),
};
const rowNames = [
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
const review = {
	characterId: "U02",
	requestId: "u02-request",
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
	evidence: [{ sha256: evidenceSHA, path: "evidence.bin" }],
};
const evaluatorInput = {
	characterId: "U02",
	requestId: "u02-request",
	imageBytes: png,
	review,
	profile: artifactProfile,
	measurementBytes: measurement,
	evidence: [evidence],
	expectedPositionReference: positionReference,
};
describe("unchanged actual consumer guards NOT counted as RED", () => {
	it("public profile API preserves independent literal profile", () =>
		expect(publicCreate(input)).toEqual(profile));
	it("evaluator passes actual image and then rejects altered profile", () => {
		const good = evaluatePortraitAcceptance(evaluatorInput);
		expect(good.pass).toBe(true);
		expect(good.ownerApprovalImplied).toBe(false);
		expect(good.releaseApprovalImplied).toBe(false);
		const changed = evaluatePortraitAcceptance({
			...evaluatorInput,
			profile: { ...artifactProfile, bodyType: "other" },
		});
		expect(changed.failures).toEqual(["measuredProportions"]);
		expect(changed.proportions).toBeNull();
	});
	it("batch passes valid artifacts then holds repinned invalid profile", async () => {
		const root = await mkdtemp(join(tmpdir(), "u02-proportion-"));
		try {
			const profilePath = join(root, "profile.json"),
				measurementPath = join(root, "measurement.json"),
				imagePath = join(root, "image.png"),
				reviewPath = join(root, "review.json");
			const profileBytes = encode(artifactProfile);
			await Promise.all([
				writeFile(profilePath, profileBytes),
				writeFile(measurementPath, measurement),
				writeFile(imagePath, png),
				writeFile(reviewPath, encode(review)),
				writeFile(join(root, "evidence.bin"), evidence),
			]);
			const terminal = {
				id: "U02",
				requestId: "u02-request",
				result: { path: imagePath },
			};
			const pins = {
				profilePath,
				profileFileSHA: digest(profileBytes),
				measurementPath,
				positionReference,
			};
			expect((await requireBatchReview(terminal, reviewPath, pins)).pass).toBe(
				true,
			);
			const invalid = encode({ ...artifactProfile, bodyType: "other" });
			await writeFile(profilePath, invalid);
			await expect(
				requireBatchReview(terminal, reviewPath, {
					...pins,
					profileFileSHA: digest(invalid),
				}),
			).rejects.toMatchObject({
				name: "BatchHoldError",
				code: "INVALID_ARTIFACT",
			});
		} finally {
			await rm(root, { recursive: true });
		}
	});
});
