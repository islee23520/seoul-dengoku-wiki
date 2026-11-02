import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { encodePng } from "../src/png.js";
import type { LandmarkName } from "../src/proportion.js";
import {
	SOURCE_MEASUREMENT_SCHEMA,
	type SourceDraftInput,
	type SourceLandmark,
	type SourceMeasurement,
	sourceDraftComparison,
} from "../src/source-measurement.js";

const sha = (bytes: Uint8Array): string =>
	createHash("sha256").update(bytes).digest("hex");
const bytes = (value: unknown): Uint8Array =>
	new TextEncoder().encode(JSON.stringify(value));

function points<T>(value: T) {
	return {
		crown: value,
		chin: value,
		headLeft: value,
		headRight: value,
		faceTop: value,
		faceLeft: value,
		faceRight: value,
		leftPupil: value,
		rightPupil: value,
		leftShoulder: value,
		rightShoulder: value,
		torsoLeft: value,
		torsoRight: value,
	};
}

function fixture(width = 7, height = 11) {
	const imageBytes = encodePng({
		width,
		height,
		pixels: new Uint8Array(width * height * 4).fill(255),
	});
	const measurement: SourceMeasurement = {
		schema: SOURCE_MEASUREMENT_SCHEMA,
		imageSHA: sha(imageBytes),
		canvas: [width, height],
		points: points({ status: "draft", point: [2, 3], uncertaintyPixels: 0.5 }),
	};
	return { imageBytes, measurement };
}

function bind(imageBytes: Uint8Array, measurement: unknown): SourceDraftInput {
	const measurementBytes = bytes(measurement);
	return {
		imageBytes,
		measurementBytes,
		expectedImageSHA: sha(imageBytes),
		expectedMeasurementSHA: sha(measurementBytes),
	};
}

describe("sourceDraftComparison", () => {
	test("binds two original canvases and preserves exact coordinate fractions", () => {
		const canvases: readonly (readonly [number, number])[] = [
			[7, 11],
			[13, 17],
		];
		for (const [width, height] of canvases) {
			const { imageBytes, measurement } = fixture(width, height);
			const input = bind(imageBytes, measurement);
			const before = imageBytes.slice();
			expect(sourceDraftComparison(input)).toEqual({
				imageSHA: input.expectedImageSHA,
				measurementSHA: input.expectedMeasurementSHA,
				sourceCanvas: [width, height],
				normalizedLandmarks: points({
					status: "draft",
					point: [`2/${width}`, `3/${height}`],
					uncertaintyPixels: 0.5,
				}),
				completeConfirmed: false,
				ownerApprovalImplied: false,
			});
			expect(imageBytes).toEqual(before);
		}
		// Metadata only: six-original-proportion-source-audit.json; no large PNGs
		// or anatomical annotations are synthesized from these dimensions.
		const originalCanvases = [
			["K1003", 1160, 1355],
			["K1004", 1161, 1354],
			["K998", 1160, 1355],
			["K1008", 1160, 1355],
			["K1007", 1160, 1355],
			["K1009", 1160, 1355],
		];
		expect(originalCanvases).toHaveLength(6);
	});

	test("requires independent image and measurement byte pins", () => {
		const { imageBytes, measurement } = fixture();
		const input = bind(imageBytes, measurement);
		for (const bad of [
			{ ...input, expectedImageSHA: "0".repeat(64) },
			{ ...input, expectedMeasurementSHA: "0".repeat(64) },
			bind(imageBytes, { ...measurement, imageSHA: "0".repeat(64) }),
			{ ...input, measurementBytes: bytes({ ...measurement, extra: true }) },
		])
			expect(() => sourceDraftComparison(bad)).toThrow();
	});

	test("rejects a claimed canvas that differs from decoded original pixels", () => {
		const { imageBytes, measurement } = fixture();
		for (const canvas of [
			[8, 11],
			[0, 11],
			[7, 1.5],
		]) {
			expect(() =>
				sourceDraftComparison(bind(imageBytes, { ...measurement, canvas })),
			).toThrow();
		}
		const input = bind(imageBytes, measurement);
		expect(() =>
			sourceDraftComparison({
				...input,
				imageBytes: Uint8Array.of(1, 2, 3),
				expectedImageSHA: sha(Uint8Array.of(1, 2, 3)),
			}),
		).toThrow();
	});

	test("rejects duplicate JSON keys including decoded escaped names", () => {
		const { imageBytes, measurement } = fixture();
		for (const text of [
			JSON.stringify(measurement).replace(
				'"canvas":',
				'"canvas":[7,11],"canvas":',
			),
			JSON.stringify(measurement).replace(
				'"crown":',
				'"cr\\u006fwn":{"status":"unmeasured","point":null},"crown":',
			),
		]) {
			const measurementBytes = new TextEncoder().encode(text);
			expect(() =>
				sourceDraftComparison({
					...bind(imageBytes, measurement),
					measurementBytes,
					expectedMeasurementSHA: sha(measurementBytes),
				}),
			).toThrow();
		}
	});

	test("strictly rejects fractional, out-of-bounds and malformed points", () => {
		const { imageBytes, measurement } = fixture();
		for (const crown of [
			{ status: "draft", point: [7, 3], uncertaintyPixels: 0 },
			{ status: "draft", point: [2, 11], uncertaintyPixels: 0 },
			{ status: "draft", point: [-1, 3], uncertaintyPixels: 0 },
			{ status: "draft", point: [2.5, 3], uncertaintyPixels: 0 },
			{ status: "draft", point: [2, 3], uncertaintyPixels: -1 },
			{ status: "approved", point: [2, 3], uncertaintyPixels: 0 },
			{ status: "unmeasured", point: [2, 3] },
			{ status: "confirmed", point: [2, 3], uncertaintyPixels: 0, extra: true },
		]) {
			expect(() =>
				sourceDraftComparison(
					bind(imageBytes, {
						...measurement,
						points: { ...measurement.points, crown },
					}),
				),
			).toThrow();
		}
		expect(() =>
			sourceDraftComparison(bind(imageBytes, { ...measurement, extra: true })),
		).toThrow();
		expect(() => sourceDraftComparison(null)).toThrow();
	});

	test("keeps all unmeasured points null without inferring anatomy", () => {
		const { imageBytes, measurement } = fixture();
		const unmeasured = points({ status: "unmeasured", point: null });
		expect(
			sourceDraftComparison(
				bind(imageBytes, { ...measurement, points: unmeasured }),
			),
		).toMatchObject({
			normalizedLandmarks: unmeasured,
			completeConfirmed: false,
			ownerApprovalImplied: false,
		});
	});

	test("requires every one of the thirteen keys and preserves mixed statuses", () => {
		const { imageBytes, measurement } = fixture();
		for (const name of Object.keys(measurement.points)) {
			const incomplete: Partial<Record<LandmarkName, SourceLandmark>> = {
				...measurement.points,
			};
			Reflect.deleteProperty(incomplete, name);
			expect(() =>
				sourceDraftComparison(
					bind(imageBytes, { ...measurement, points: incomplete }),
				),
			).toThrow();
		}
		const mixed = {
			...points({ status: "confirmed", point: [2, 3], uncertaintyPixels: 1 }),
			crown: { status: "unmeasured", point: null },
		};
		expect(
			sourceDraftComparison(
				bind(imageBytes, { ...measurement, points: mixed }),
			),
		).toMatchObject({
			completeConfirmed: false,
			normalizedLandmarks: {
				crown: { status: "unmeasured", point: null },
				chin: { status: "confirmed", uncertaintyPixels: 1 },
			},
		});
	});

	test("all confirmed means completeness only and never owner approval", () => {
		const { imageBytes, measurement } = fixture();
		const statuses: readonly ("draft" | "confirmed")[] = ["draft", "confirmed"];
		for (const status of statuses) {
			expect(
				sourceDraftComparison(
					bind(imageBytes, {
						...measurement,
						points: points({ status, point: [2, 3], uncertaintyPixels: 0 }),
					}),
				),
			).toMatchObject({
				completeConfirmed: status === "confirmed",
				ownerApprovalImplied: false,
			});
		}
	});
});
