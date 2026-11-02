import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BatchHoldError, requireBatchReview } from "../src/batch-gate.js";
import { evaluatePortraitAcceptance } from "../src/index.js";
import {
	observableReviewComparison as compare,
	type ObservableObservation,
	ObservableReviewError,
	type ObservableReviewErrorCode,
	type ObservableReviewInput,
} from "../src/observable-review.js";
import { encodePng } from "../src/png.js";
import {
	digest,
	makeObservation,
	makePortrait,
	makeProfile,
} from "./helpers/fixtures.js";

const sha = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
const bytes = (v: unknown) => new TextEncoder().encode(JSON.stringify(v));
const names = [
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
] as const;
const missing = {
	status: "unmeasured",
	point: null,
	uncertaintyPixels: null,
	pixelBounds: null,
} as const;
const point = (
	x: number,
	y: number,
	status: "draft" | "observed" = "draft",
) => ({
	status,
	point: [x, y] as const,
	uncertaintyPixels: 1,
	pixelBounds: [
		[x - 1, x + 1],
		[y - 1, y + 1],
	] as const,
});
function fixture() {
	const image = encodePng({
		width: 13,
		height: 17,
		pixels: new Uint8Array(13 * 17 * 4).fill(255),
	});
	const doc: ObservableObservation = {
		schema: "portrait-observable-observation.v1",
		characterId: "synthetic",
		imageSHA: sha(image),
		canvas: [13, 17],
		definitions: {
			head: "visible-connected-main-head-mass.v3",
			body: "visible-clothed-body-bands.v1",
		},
		origins: {
			headCandidateSHA: "a".repeat(64),
			headReviewSHA: "b".repeat(64),
			bodyDraftSHA: "c".repeat(64),
			headDefinitionReviewSHA: "d".repeat(64),
			bodyDefinitionSHA: "e".repeat(64),
			bodyIndependentReviewSHA: "f".repeat(64),
		},
		landmarks: {
			crown: point(6, 2),
			chin: point(6, 7),
			headLeft: point(2, 4),
			headRight: point(10, 4, "observed"),
			faceTop: missing,
			faceLeft: missing,
			faceRight: missing,
			leftPupil: point(4, 4),
			rightPupil: point(8, 5),
			leftShoulder: missing,
			rightShoulder: missing,
			torsoLeft: missing,
			torsoRight: missing,
		},
		bodyBands: [
			{
				k: 1,
				sourcePixelY: 9,
				left: { status: "draft", xInterval: [1, 2], clipped: false },
				right: { status: "observed", xInterval: [10, 11], clipped: false },
				equipment: "no_separate_outer_contribution_observed",
			},
			{
				k: 2,
				sourcePixelY: 12,
				left: {
					status: "clipped_lower_bound",
					xInterval: [0, 0],
					clipped: true,
				},
				right: { status: "draft", xInterval: [10, 11], clipped: false },
				equipment: "visible_internal_to_garment_envelope",
			},
			{
				k: 3,
				sourcePixelY: 14,
				left: {
					status: "clipped_lower_bound",
					xInterval: [0, 0],
					clipped: true,
				},
				right: {
					status: "clipped_lower_bound",
					xInterval: [12, 12],
					clipped: true,
				},
				equipment: "garment_decorations_included_boundary_occluded",
			},
		],
	};
	return { image, doc };
}
function bind(image: Uint8Array, doc: unknown): ObservableReviewInput {
	const observationBytes = bytes(doc);
	return {
		imageBytes: image,
		observationBytes,
		expectedImageSHA: sha(image),
		expectedObservationSHA: sha(observationBytes),
		expectedCharacterId: "synthetic",
	};
}
function raw(image: Uint8Array, text: string | Uint8Array) {
	const input = bind(image, {}),
		observationBytes =
			typeof text === "string" ? new TextEncoder().encode(text) : text;
	return {
		...input,
		observationBytes,
		expectedObservationSHA: sha(observationBytes),
	};
}
function failure(input: unknown, code: ObservableReviewErrorCode) {
	let caught: unknown;
	try {
		compare(input);
	} catch (e) {
		caught = e;
	}
	expect(caught).toBeInstanceOf(ObservableReviewError);
	expect(caught).toMatchObject({ name: "ObservableReviewError", code });
}
function change(
	doc: ObservableObservation,
	name: (typeof names)[number],
	value: unknown,
) {
	return { ...doc, landmarks: { ...doc.landmarks, [name]: value } };
}
const authority = {
	integrityAssessment: "PASS",
	evidenceAuthority: "UNVERIFIED_DRAFT_ASSERTIONS",
	evidenceAuthorityAccepted: false,
	reviewAcceptance: "NOT_EVALUATED",
	productionAdvancement: "HOLD",
	completeConfirmed: false,
	ownerApprovalImplied: false,
	releaseApprovalImplied: false,
	profileApprovalImplied: false,
	anatomical: false,
	topBodyShoulderMaximum: { status: "unmeasured", value: null },
};
const nullMetric = {
	status: "unmeasured",
	valuePixels: null,
	pixelInterval: null,
	normalized: null,
	normalizedInterval: null,
} as const;
let variantNumber = 0;
function registerFailure(input: unknown, code: ObservableReviewErrorCode) {
	const label = JSON.stringify(input, (_key, value) =>
		value instanceof Uint8Array ? "[raw bytes]" : value,
	);
	test(`variant ${++variantNumber} expects ${code}: ${label}`, () =>
		failure(input, code));
}
describe("observable source integrity", () => {
	test("01 mixed geometry exact contract and unconditional authority", () => {
		const { image, doc } = fixture(),
			input = bind(image, doc),
			r = compare(input);
		expect(Object.keys(r).sort()).toEqual(
			[
				"schema",
				"characterId",
				"imageSHA",
				"observationSHA",
				"sourceCanvas",
				"definitions",
				"origins",
				"integrityAssessment",
				"evidenceAuthority",
				"evidenceAuthorityAccepted",
				"reviewAcceptance",
				"productionAdvancement",
				"completeConfirmed",
				"ownerApprovalImplied",
				"releaseApprovalImplied",
				"profileApprovalImplied",
				"anatomical",
				"normalizedLandmarks",
				"headMetrics",
				"bodyBands",
				"topBodyShoulderMaximum",
			].sort(),
		);
		expect(r).toMatchObject({
			...authority,
			schema: "portrait-observable-review.v1",
			characterId: "synthetic",
			imageSHA: input.expectedImageSHA,
			observationSHA: input.expectedObservationSHA,
			sourceCanvas: [13, 17],
			definitions: doc.definitions,
			origins: doc.origins,
		});
		for (const name of names) {
			const p = doc.landmarks[name];
			expect(r.normalizedLandmarks[name]).toEqual({
				...p,
				normalizedPoint: p.point
					? [`${p.point[0]}/13`, `${p.point[1]}/17`]
					: null,
				normalizedBounds: p.pixelBounds
					? [
							[`${p.pixelBounds[0][0]}/13`, `${p.pixelBounds[0][1]}/13`],
							[`${p.pixelBounds[1][0]}/17`, `${p.pixelBounds[1][1]}/17`],
						]
					: null,
			});
		}
		for (const b of r.bodyBands) {
			const source = doc.bodyBands[b.k - 1];
			if (!source) throw Error("missing fixture band");
			expect(b.equipment).toBe(source.equipment);
			for (const side of ["left", "right"] as const)
				expect(b[side]).toEqual({
					...source[side],
					normalizedInterval: source[side].xInterval
						? [
								`${source[side].xInterval[0]}/13`,
								`${source[side].xInterval[1]}/13`,
							]
						: null,
				});
		}
	});
	test("01 all observed authority remains false", () => {
		const { image, doc } = fixture();
		const observed = {
			...doc,
			landmarks: Object.fromEntries(
				names.map((n) => [
					n,
					point(
						n === "headLeft" ? 2 : n === "headRight" ? 10 : 6,
						n === "crown" ? 2 : n === "chin" ? 7 : 4,
						"observed",
					),
				]),
			),
			bodyBands: doc.bodyBands.map((b) => ({
				...b,
				left: { status: "observed", xInterval: [1, 2], clipped: false },
				right: { status: "observed", xInterval: [10, 11], clipped: false },
			})),
		};
		expect(compare(bind(image, observed))).toMatchObject(authority);
	});
	test("02 all unmeasured including chin preserves nulls", () => {
		const { image, doc } = fixture();
		const r = compare(
			bind(image, {
				...doc,
				landmarks: Object.fromEntries(names.map((n) => [n, missing])),
				bodyBands: doc.bodyBands.map((b) => ({
					...b,
					sourcePixelY: null,
					left: { status: "unmeasured", xInterval: null, clipped: null },
					right: { status: "unmeasured", xInterval: null, clipped: null },
				})),
			}),
		);
		expect(r).toMatchObject(authority);
		for (const b of r.bodyBands)
			expect(b).toMatchObject({
				fraction: null,
				exactY: null,
				sourcePixelY: null,
				normalizedY: null,
				conditionalChinYUncertaintyPixels: null,
				conditionalExactYBounds: null,
				width: {
					status: "unmeasured",
					pointDistanceInterval: null,
					normalizedInterval: null,
					fullWidthCertified: false,
					occupiedPixelCount: null,
				},
			});
		for (const m of Object.values(r.headMetrics)) expect(m).toEqual(nullMetric);
	});
	test("03 independent literal head metrics and missing dependencies", () => {
		const { image, doc } = fixture(),
			r = compare(bind(image, doc));
		expect(r.headMetrics).toEqual({
			headMassWidth: {
				status: "draft",
				valuePixels: 8,
				pixelInterval: [6, 10],
				normalized: "8/13",
				normalizedInterval: ["6/13", "10/13"],
			},
			headMassToChinHeight: {
				status: "draft",
				valuePixels: 5,
				pixelInterval: [3, 7],
				normalized: "5/17",
				normalizedInterval: ["3/17", "7/17"],
			},
			pupilMidpointY: {
				status: "draft",
				valuePixels: 4.5,
				pixelInterval: [3.5, 5.5],
				normalized: "9/34",
				normalizedInterval: ["7/34", "11/34"],
			},
			headMassCenterX: {
				status: "draft",
				valuePixels: 6,
				pixelInterval: [5, 7],
				normalized: "12/26",
				normalizedInterval: ["10/26", "14/26"],
			},
		});
	});
	for (const [name, metrics] of [
		["headLeft", ["headMassWidth", "headMassCenterX"]],
		["crown", ["headMassToChinHeight"]],
		["leftPupil", ["pupilMidpointY"]],
	] as const)
		test(`03 missing ${name} metric dependencies`, () => {
			const { image, doc } = fixture();
			const out = compare(bind(image, change(doc, name, missing)));
			for (const metric of metrics)
				expect(out.headMetrics[metric]).toEqual(nullMetric);
		});
	test("04 quarter rows exact fractions rounding and anchor bounds", () => {
		const { image, doc } = fixture(),
			r = compare(bind(image, doc));
		expect(
			r.bodyBands.map(
				({
					k,
					fraction,
					exactY,
					sourcePixelY,
					normalizedY,
					conditionalChinYUncertaintyPixels,
					conditionalExactYBounds,
				}) => ({
					k,
					fraction,
					exactY,
					sourcePixelY,
					normalizedY,
					conditionalChinYUncertaintyPixels,
					conditionalExactYBounds,
				}),
			),
		).toEqual([
			{
				k: 1,
				fraction: "1/4",
				exactY: "37/4",
				sourcePixelY: 9,
				normalizedY: "9/17",
				conditionalChinYUncertaintyPixels: 0.75,
				conditionalExactYBounds: ["34/4", "40/4"],
			},
			{
				k: 2,
				fraction: "2/4",
				exactY: "46/4",
				sourcePixelY: 12,
				normalizedY: "12/17",
				conditionalChinYUncertaintyPixels: 0.5,
				conditionalExactYBounds: ["44/4", "48/4"],
			},
			{
				k: 3,
				fraction: "3/4",
				exactY: "55/4",
				sourcePixelY: 14,
				normalizedY: "14/17",
				conditionalChinYUncertaintyPixels: 0.25,
				conditionalExactYBounds: ["54/4", "56/4"],
			},
		]);
	});
	test("05 visible clipped and occluded widths are point distances only", () => {
		const { image, doc } = fixture(),
			r = compare(bind(image, doc));
		expect(r.bodyBands.map((b) => b.width)).toEqual([
			{
				status: "draft",
				pointDistanceInterval: [8, 10],
				normalizedInterval: ["8/13", "10/13"],
				fullWidthCertified: false,
				occupiedPixelCount: null,
			},
			{
				status: "clipped_lower_bound",
				pointDistanceInterval: [10, 11],
				normalizedInterval: ["10/13", "11/13"],
				fullWidthCertified: false,
				occupiedPixelCount: null,
			},
			{
				status: "clipped_lower_bound",
				pointDistanceInterval: [12, 12],
				normalizedInterval: ["12/13", "12/13"],
				fullWidthCertified: false,
				occupiedPixelCount: null,
			},
		]);
	});
	test("05 occlusion takes precedence over clipping", () => {
		const { image, doc } = fixture();
		const out = compare(
			bind(image, {
				...doc,
				bodyBands: doc.bodyBands.map((b) => ({
					...b,
					right: { status: "unmeasured", xInterval: null, clipped: null },
				})),
			}),
		);
		for (const b of out.bodyBands)
			expect(b.width).toEqual({
				status: "unmeasured",
				pointDistanceInterval: null,
				normalizedInterval: null,
				fullWidthCertified: false,
				occupiedPixelCount: null,
			});
	});
	describe("06 strict envelope and independently acquired raw pins", () => {
		const { image, doc } = fixture(),
			input = bind(image, doc);
		for (const bad of [
			null,
			{},
			{ ...input, expectedImageSHA: undefined },
			{ ...input, expectedObservationSHA: undefined },
			{ ...input, imageBytes: [1] },
			{ ...input, observationBytes: "{}" },
			{ ...input, expectedImageSHA: "A".repeat(64) },
			{ ...input, expectedCharacterId: " " },
			{ ...input, extra: true },
		])
			registerFailure(bad, "INVALID_INPUT");
		for (const bad of [
			{ ...input, expectedImageSHA: "0".repeat(64) },
			{ ...input, expectedObservationSHA: "0".repeat(64) },
			{
				...input,
				observationBytes: new Uint8Array([...input.observationBytes, 32]),
			},
			bind(image, { ...doc, imageSHA: "0".repeat(64) }),
		])
			registerFailure(bad, "SHA_MISMATCH");
		registerFailure(
			{ ...input, expectedCharacterId: "other" },
			"IDENTITY_MISMATCH",
		);
	});
	describe("07 fatal JSON UTF8 BOM nested escaped duplicate and nonfinite", () => {
		const { image, doc } = fixture(),
			text = JSON.stringify(doc);
		for (const s of [
			"{",
			new Uint8Array([0xc3, 0x28]),
			`\ufeff${text}`,
			text.replace('"canvas":', '"canvas":[13,17],"canvas":'),
			text.replace('"crown":', '"cr\\u006fwn":null,"crown":'),
			text.replace(
				'"status":"draft"',
				'"status":"draft","sta\\u0074us":"draft"',
			),
		])
			registerFailure(raw(image, s), "INVALID_JSON");
		registerFailure(
			raw(
				image,
				text.replace('"uncertaintyPixels":1', '"uncertaintyPixels":1e309'),
			),
			"INVALID_OBSERVATION",
		);
	});
	describe("08 strict schema enums null shapes all thirteen keys and band ordering", () => {
		const { image, doc } = fixture();
		const bad: unknown[] = [
			{ ...doc, extra: true },
			{ ...doc, schema: "wrong" },
			{ ...doc, definitions: { ...doc.definitions, body: "wrong" } },
			{ ...doc, origins: { ...doc.origins, extra: true } },
			...[
				"completeConfirmed",
				"ownerApprovalImplied",
				"profileApprovalImplied",
				"releaseApprovalImplied",
				"criteria",
				"acceptanceSchema",
			].map((k) => ({ ...doc, [k]: true })),
			change(doc, "crown", { ...doc.landmarks.crown, status: "confirmed" }),
			change(doc, "crown", { ...doc.landmarks.crown, status: "approved" }),
			change(doc, "faceTop", { ...missing, point: [1, 1] }),
			change(doc, "crown", { ...doc.landmarks.crown, extra: true }),
			{ ...doc, bodyBands: doc.bodyBands.slice(1) },
			{
				...doc,
				bodyBands: [doc.bodyBands[1], doc.bodyBands[0], doc.bodyBands[2]],
			},
			{
				...doc,
				bodyBands: [doc.bodyBands[0], doc.bodyBands[0], doc.bodyBands[2]],
			},
		];
		for (const n of names) {
			const landmarks = { ...doc.landmarks };
			Reflect.deleteProperty(landmarks, n);
			bad.push({ ...doc, landmarks });
		}
		for (const value of bad)
			registerFailure(bind(image, value), "INVALID_OBSERVATION");
	});
	describe("09 PNG decoding CRC encoding and canvas pins", () => {
		const { image, doc } = fixture();
		const corrupt = image.slice();
		corrupt[29] = (corrupt[29] ?? 0) ^ 1;
		const unsupported = image.slice();
		unsupported[24] = 16;
		let crc = 0xffffffff;
		for (const v of unsupported.slice(12, 29)) {
			crc ^= v;
			for (let bit = 0; bit < 8; bit++)
				crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
		}
		new DataView(unsupported.buffer).setUint32(29, (crc ^ 0xffffffff) >>> 0);
		for (const b of [Uint8Array.of(1, 2, 3), corrupt, unsupported])
			registerFailure(bind(b, { ...doc, imageSHA: sha(b) }), "INVALID_IMAGE");
		registerFailure(
			bind(image, { ...doc, canvas: [14, 17] }),
			"CANVAS_MISMATCH",
		);
	});
	describe("10 safe integer coordinates dimensions uncertainty and boundaries", () => {
		const { image, doc } = fixture();
		for (const p of [
			[-1, 2],
			[1.5, 2],
			[Number.MAX_SAFE_INTEGER + 1, 2],
		])
			registerFailure(
				bind(image, change(doc, "crown", { ...doc.landmarks.crown, point: p })),
				"INVALID_OBSERVATION",
			);
		for (const canvas of [
			[0, 17],
			[13, 1.5],
			[Number.MAX_SAFE_INTEGER + 1, 17],
		])
			registerFailure(bind(image, { ...doc, canvas }), "INVALID_OBSERVATION");
		for (const u of [-1, null])
			registerFailure(
				bind(
					image,
					change(doc, "crown", {
						...doc.landmarks.crown,
						uncertaintyPixels: u,
					}),
				),
				"INVALID_OBSERVATION",
			);
		for (const p of [
			[13, 2],
			[6, 17],
		])
			registerFailure(
				bind(image, change(doc, "crown", { ...doc.landmarks.crown, point: p })),
				"GEOMETRY_OUT_OF_BOUNDS",
			);
		registerFailure(
			bind(
				image,
				change(doc, "crown", {
					...doc.landmarks.crown,
					pixelBounds: [
						[5, 13],
						[1, 3],
					],
				}),
			),
			"GEOMETRY_OUT_OF_BOUNDS",
		);
	});
	describe("11 interval containment radius positive spans and ordered body endpoints", () => {
		const { image, doc } = fixture();
		for (const value of [
			{
				...doc.landmarks.crown,
				pixelBounds: [
					[7, 5],
					[1, 3],
				],
			},
			{
				...doc.landmarks.crown,
				pixelBounds: [
					[7, 8],
					[1, 3],
				],
			},
			{ ...doc.landmarks.crown, uncertaintyPixels: 0.5 },
			{ ...doc.landmarks.crown, uncertaintyPixels: 18 },
			point(6, 7),
		])
			registerFailure(
				bind(image, change(doc, "crown", value)),
				"INVALID_INTERVAL",
			);
		registerFailure(
			bind(image, change(doc, "headRight", point(3, 4))),
			"INVALID_INTERVAL",
		);
		for (const interval of [
			[2, 1],
			[10, 11],
		])
			registerFailure(
				bind(image, {
					...doc,
					bodyBands: doc.bodyBands.map((b, i) =>
						i === 0
							? {
									...b,
									left: {
										status: "draft",
										xInterval: interval,
										clipped: false,
									},
								}
							: b,
					),
				}),
				"INVALID_INTERVAL",
			);
	});
	describe("12 missing anchor and incorrect nominal rows", () => {
		const { image, doc } = fixture();
		for (const bands of [
			doc.bodyBands.map((b, i) => (i === 0 ? { ...b, sourcePixelY: 10 } : b)),
			doc.bodyBands.map((b, i) => (i === 0 ? { ...b, sourcePixelY: null } : b)),
		])
			registerFailure(
				bind(image, { ...doc, bodyBands: bands }),
				"INVALID_BAND_ROW",
			);
		registerFailure(
			bind(image, change(doc, "chin", missing)),
			"INVALID_BAND_ROW",
		);
	});
	describe("13 clipping must match status and precise side edge", () => {
		const { image, doc } = fixture();
		for (const side of [
			{ status: "clipped_lower_bound", xInterval: [1, 1], clipped: true },
			{ status: "draft", xInterval: [0, 0], clipped: false },
			{ status: "observed", xInterval: [1, 2], clipped: true },
			{ status: "clipped_lower_bound", xInterval: [0, 0], clipped: false },
		])
			registerFailure(
				bind(image, {
					...doc,
					bodyBands: doc.bodyBands.map((b, i) =>
						i === 0 ? { ...b, left: side } : b,
					),
				}),
				"INCONSISTENT_CLIPPING",
			);
		registerFailure(
			bind(image, {
				...doc,
				bodyBands: doc.bodyBands.map((b, i) =>
					i === 2
						? {
								...b,
								right: {
									status: "clipped_lower_bound",
									xInterval: [11, 11],
									clipped: true,
								},
							}
						: b,
				),
			}),
			"INCONSISTENT_CLIPPING",
		);
	});

	test("07 property-looking strings are not duplicate keys", () => {
		const { image, doc } = fixture();
		expect(
			compare({
				...bind(image, { ...doc, characterId: 'string "canvas": "canvas":' }),
				expectedCharacterId: 'string "canvas": "canvas":',
			}).characterId,
		).toBe('string "canvas": "canvas":');
	});
	test("13 measured null clipping is schema-invalid before geometry", () => {
		const { image, doc } = fixture();
		failure(
			bind(image, {
				...doc,
				bodyBands: doc.bodyBands.map((b, i) =>
					i === 0
						? {
								...b,
								left: { status: "draft", xInterval: [1, 2], clipped: null },
							}
						: b,
				),
			}),
			"INVALID_OBSERVATION",
		);
	});
	test("14 emitted public export determinism and immutable bytes", async () => {
		const { image, doc } = fixture(),
			input = bind(image, doc),
			beforeImage = image.slice(),
			beforeObservation = input.observationBytes.slice();
		const shipped = await import("../dist/index.js");
		expect(typeof shipped.observableReviewComparison).toBe("function");
		expect(shipped.OBSERVABLE_OBSERVATION_SCHEMA).toBe(
			"portrait-observable-observation.v1",
		);
		expect(shipped.OBSERVABLE_REVIEW_SCHEMA).toBe(
			"portrait-observable-review.v1",
		);
		expect(shipped.observableReviewComparison(input)).toEqual(compare(input));
		expect(compare(input)).toEqual(compare(input));
		expect(image).toEqual(beforeImage);
		expect(input.observationBytes).toEqual(beforeObservation);
	});
	test("15 observable report cannot satisfy evaluator or batch gate", async () => {
		const { image, doc } = fixture(),
			partial = compare(bind(image, doc));
		const imageBytes = makePortrait(),
			measurementBytes = bytes({
				...makeObservation(digest(imageBytes), "0".repeat(64)),
				canvas: [1024, 1536],
			}),
			profile = makeProfile(imageBytes, measurementBytes);
		const position = {
			referenceVersion: "fixture-v1",
			referenceSHA: "a".repeat(64),
			ruleSHA: "b".repeat(64),
		};
		const verdict = evaluatePortraitAcceptance({
			characterId: "synthetic",
			requestId: "req",
			imageBytes,
			review: partial,
			profile,
			measurementBytes,
			evidence: [],
			expectedPositionReference: position,
		});
		expect(verdict.pass).toBe(false);
		expect(verdict.failures).toContain("exactImageReview");
		expect(verdict.failures).toContain("acceptanceSchema");
		const dir = await mkdtemp(join(tmpdir(), "observable-gate-"));
		try {
			const path = join(dir, "review.json");
			await writeFile(path, JSON.stringify(partial));
			let caught: unknown;
			try {
				await requireBatchReview(
					{
						id: "synthetic",
						requestId: "req",
						result: { path: join(dir, "image.png") },
					},
					path,
					{ profile },
				);
			} catch (e) {
				caught = e;
			}
			expect(caught).toBeInstanceOf(BatchHoldError);
			expect(caught).toMatchObject({ code: "INVALID_REVIEW" });
		} finally {
			await rm(dir, { recursive: true });
		}
	});
	for (const metric of [
		"headMassWidth",
		"headMassToChinHeight",
		"pupilMidpointY",
		"headMassCenterX",
	] as const)
		test(`03 literal metric ${metric} independently executes`, () => {
			const { image, doc } = fixture();
			const expected = {
				headMassWidth: {
					status: "draft",
					valuePixels: 8,
					pixelInterval: [6, 10],
					normalized: "8/13",
					normalizedInterval: ["6/13", "10/13"],
				},
				headMassToChinHeight: {
					status: "draft",
					valuePixels: 5,
					pixelInterval: [3, 7],
					normalized: "5/17",
					normalizedInterval: ["3/17", "7/17"],
				},
				pupilMidpointY: {
					status: "draft",
					valuePixels: 4.5,
					pixelInterval: [3.5, 5.5],
					normalized: "9/34",
					normalizedInterval: ["7/34", "11/34"],
				},
				headMassCenterX: {
					status: "draft",
					valuePixels: 6,
					pixelInterval: [5, 7],
					normalized: "12/26",
					normalizedInterval: ["10/26", "14/26"],
				},
			} as const;
			expect(compare(bind(image, doc)).headMetrics[metric]).toEqual(
				expected[metric],
			);
		});
	for (const [k, exactY, row, bounds] of [
		[1, "37/4", 9, ["34/4", "40/4"]],
		[2, "46/4", 12, ["44/4", "48/4"]],
		[3, "55/4", 14, ["54/4", "56/4"]],
	] as const)
		test(`04 nominal row k=${k} rounding independently executes`, () => {
			const { image, doc } = fixture();
			expect(compare(bind(image, doc)).bodyBands[k - 1]).toMatchObject({
				k,
				fraction: `${k}/4`,
				exactY,
				sourcePixelY: row,
				normalizedY: `${row}/17`,
				conditionalExactYBounds: bounds,
			});
		});
	for (const [k, status, interval, normalized] of [
		[1, "draft", [8, 10], ["8/13", "10/13"]],
		[2, "clipped_lower_bound", [10, 11], ["10/13", "11/13"]],
		[3, "clipped_lower_bound", [12, 12], ["12/13", "12/13"]],
	] as const)
		test(`05 width k=${k} ${status} independently executes`, () => {
			const { image, doc } = fixture();
			expect(compare(bind(image, doc)).bodyBands[k - 1]?.width).toEqual({
				status,
				pointDistanceInterval: interval,
				normalizedInterval: normalized,
				fullWidthCertified: false,
				occupiedPixelCount: null,
			});
		});
});
