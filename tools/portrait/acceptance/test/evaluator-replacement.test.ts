import { describe, expect, it } from "bun:test";
import { deflateSync } from "node:zlib";
import { evaluatePortraitAcceptanceReplacement as evaluate } from "../src/evaluator-replacement.js";
import { encodePng } from "../src/png.js";
import {
	digest,
	makeObservation,
	makePortrait,
	makeProfile,
} from "./helpers/fixtures.js";

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
const imageBytes = makePortrait();
const imageSHA = digest(imageBytes);
const evidenceBytes = new TextEncoder().encode("synthetic reviewer evidence");
const evidenceSHA = digest(evidenceBytes);
const position = {
	referenceVersion: "fixture-v1",
	referenceSHA: "a".repeat(64),
	ruleSHA: "b".repeat(64),
};
const boundMeasurement = new TextEncoder().encode(
	JSON.stringify({
		...makeObservation(imageSHA, "0".repeat(64)),
		canvas: [1024, 1536],
	}),
);
const profile = makeProfile(imageBytes, boundMeasurement);
const review = {
	characterId: "K001",
	requestId: "req-1",
	sha256: imageSHA,
	actualImageViewed: true,
	technicalVerdict: "pass",
	acceptanceSchema: "portrait-integrated-acceptance.v1",
	positionReference: position,
	criteria: Object.fromEntries(
		rowNames.map((name) => [
			name,
			{
				verdict: "pass",
				scope: "whole-image",
				imageSHA,
				evidenceSHA,
			},
		]),
	),
};
const evaluateInput = (patch: Record<string, unknown> = {}) => ({
	characterId: "K001",
	requestId: "req-1",
	imageBytes,
	review: { ...review, ...patch },
	profile,
	measurementBytes: boundMeasurement,
	evidence: [evidenceBytes],
	expectedPositionReference: position,
});

describe("replacement portrait acceptance evaluator", () => {
	it("passes a complete evidence set and reports non-authority fields", () => {
		const result = evaluate(evaluateInput());
		expect(result.pass).toBe(true);
		expect(result.failures).toEqual([]);
		expect(result.proportions?.pass).toBe(true);
		expect(result.ownerApprovalImplied).toBe(false);
		expect(result.releaseApprovalImplied).toBe(false);
		expect(result.positionReference).toEqual(position);
	});

	it("rejects every missing, failed, malformed, or stale-digest row", () => {
		for (const name of rowNames) {
			for (const alteration of [
				"missing",
				"failed",
				"scope",
				"image",
				"digest",
			] as const) {
				const rows: Record<string, unknown> = { ...review.criteria };
				if (alteration === "missing") delete rows[name];
				else
					rows[name] = {
						verdict: alteration === "failed" ? "fail" : "pass",
						scope: alteration === "scope" ? "region" : "whole-image",
						imageSHA: alteration === "image" ? "c".repeat(64) : imageSHA,
						evidenceSHA: alteration === "digest" ? "c".repeat(64) : evidenceSHA,
					};
				const result = evaluate(evaluateInput({ criteria: rows }));
				if (alteration !== "digest") expect(result.failures).toContain(name);
				if (alteration === "missing" || alteration === "digest")
					expect(result.failures).toContain(`evidence:${name}`);
			}
		}
	});

	it("binds rows to digests of supplied evidence bytes", () => {
		const result = evaluate({ ...evaluateInput(), evidence: [] });
		expect(result.failures).toContain("evidence:Q01");
		expect(result.failures).toContain("evidence:defringe");
	});

	it("rethrows unexpected evidence iterator failures", () => {
		const evidence = {
			[Symbol.iterator](): IterableIterator<Uint8Array> {
				throw new Error("iterator programming defect");
			},
		};
		expect(() => evaluate({ ...evaluateInput(), evidence })).toThrow(
			"iterator programming defect",
		);
	});

	it("binds review identity to the expected independent identity and pins", () => {
		expect(evaluate(evaluateInput({ characterId: "K002" })).failures).toContain(
			"exactImageReview",
		);
		expect(
			evaluate(evaluateInput({ requestId: "req-other" })).failures,
		).toContain("exactImageReview");
		expect(
			evaluate(evaluateInput({ sha256: "c".repeat(64) })).failures,
		).toContain("exactImageReview");
		expect(
			evaluate(evaluateInput({ actualImageViewed: false })).failures,
		).toContain("exactImageReview");
		expect(
			evaluate(evaluateInput({ technicalVerdict: "fail" })).failures,
		).toContain("exactImageReview");
		expect(
			evaluate(
				evaluateInput({ positionReference: { ...position, extra: true } }),
			).failures,
		).toContain("positionReference");
		expect(
			evaluate(evaluateInput({ positionReference: undefined })).failures,
		).toContain("positionReference");
		expect(
			evaluate({
				...evaluateInput(),
				expectedPositionReference: { ...position, ruleSHA: "c".repeat(64) },
			}).failures,
		).toContain("positionReference");
	});

	it("counts alpha 249 as foreground but not core and enforces 900/899", () => {
		const makeAlpha = (corePixels: number) => {
			const pixels = new Uint8Array(1024 * 1536 * 4);
			for (let index = 0; index < 1000; index++)
				pixels[index * 4 + 3] = index < corePixels ? 250 : 249;
			pixels[1000 * 4 + 3] = 0;
			return encodePng({ width: 1024, height: 1536, pixels });
		};
		const at900 = makeAlpha(900);
		const at899 = makeAlpha(899);
		const result900 = evaluate({
			...evaluateInput(),
			imageBytes: at900,
			review: reviewFor(at900),
		});
		const result899 = evaluate({
			...evaluateInput(),
			imageBytes: at899,
			review: reviewFor(at899),
		});
		expect(result900.coreFraction).toBe(0.9);
		expect(result900.failures).not.toContain("alphaCoreAndBackground");
		expect(result899.coreFraction).toBe(0.899);
		expect(result899.failures).toContain("alphaCoreAndBackground");
	});

	it("reports measurements and rejects wrong canvas, RGB, and malformed PNG", () => {
		const wrongCanvas = encodePng({
			width: 1023,
			height: 1536,
			pixels: new Uint8Array(1023 * 1536 * 4),
		});
		const wrong = evaluate({ ...evaluateInput(), imageBytes: wrongCanvas });
		expect(wrong.failures).toContain("canvasRGBA");
		expect(wrong.nonopaqueForegroundPixels).toBeDefined();
		expect(wrong.coreFraction).toBeDefined();
		const rgb = encodeRgbPng(1024, 1536);
		const rgbResult = evaluate({ ...evaluateInput(), imageBytes: rgb });
		expect(rgbResult.failures).toContain("canvasRGBA");
		expect(rgbResult.proportions).toBeNull();
		const malformed = evaluate({
			...evaluateInput(),
			imageBytes: new Uint8Array([1, 2, 3]),
		});
		expect(malformed.failures).toContain("canvasRGBA");
		expect(malformed.proportions).toBeNull();
	});

	it("fails malformed profiles and measurement bytes without throwing", () => {
		const malformedProfile = evaluate({
			...evaluateInput(),
			profile: { invalid: true },
		});
		expect(malformedProfile.failures).toContain("measuredProportions");
		const malformedMeasurement = evaluate({
			...evaluateInput(),
			measurementBytes: new TextEncoder().encode("{"),
		});
		expect(malformedMeasurement.failures).toContain("measuredProportions");
	});
});

function reviewFor(bytes: Uint8Array) {
	const sha = digest(bytes);
	return {
		...review,
		sha256: sha,
		criteria: Object.fromEntries(
			rowNames.map((name) => [
				name,
				{
					verdict: "pass",
					scope: "whole-image",
					imageSHA: sha,
					evidenceSHA,
				},
			]),
		),
	};
}

function encodeRgbPng(width: number, height: number): Uint8Array {
	const bytes = encodePng({
		width,
		height,
		pixels: new Uint8Array(width * height * 4),
	});
	const header = bytes.slice(16, 29);
	header[9] = 2;
	const headerChunk = pngChunk("IHDR", header);
	const raw = new Uint8Array((width * 3 + 1) * height);
	const imageChunk = pngChunk("IDAT", new Uint8Array(deflateSync(raw)));
	return concatBytes([
		bytes.subarray(0, 8),
		headerChunk,
		imageChunk,
		bytes.subarray(bytes.length - 12),
	]);
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
	const chunk = new Uint8Array(data.length + 12);
	const view = new DataView(chunk.buffer);
	view.setUint32(0, data.length);
	for (let index = 0; index < 4; index++)
		chunk[4 + index] = type.charCodeAt(index);
	chunk.set(data, 8);
	view.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));
	return chunk;
}

function crc32(bytes: Uint8Array): number {
	let crc = 0xffffffff;
	for (const byte of bytes) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit++)
			crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
	}
	return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
	const result = new Uint8Array(
		parts.reduce((size, part) => size + part.length, 0),
	);
	let offset = 0;
	for (const part of parts) {
		result.set(part, offset);
		offset += part.length;
	}
	return result;
}
