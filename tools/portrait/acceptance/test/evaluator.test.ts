import { describe, expect, it } from "bun:test";
import { deflateSync } from "node:zlib";
import { evaluatePortraitAcceptance } from "../src/evaluator.js";
import { encodePng } from "../src/png.js";
import {
	digest,
	makeObservation,
	makePortrait,
	makeProfile,
} from "./helpers/fixtures.js";

const imageBytes = makePortrait();
const imageSHA = digest(imageBytes);
const evidenceBytes = new TextEncoder().encode("synthetic reviewer evidence");
const evidenceSHA = digest(evidenceBytes);
const position = {
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
	positionReference: position,
	criteria: Object.fromEntries(
		rowNames.map((name) => [
			name,
			{ verdict: "pass", scope: "whole-image", imageSHA, evidenceSHA },
		]),
	),
};

const measurementBytes = new TextEncoder().encode("measurement artifact bytes");
const boundProfile = makeProfile(imageBytes, measurementBytes);
const boundMeasurement = new TextEncoder().encode(
	JSON.stringify({
		...makeObservation(imageSHA, "0".repeat(64)),
		canvas: [1024, 1536],
	}),
);
const artifactProfile = makeProfile(imageBytes, boundMeasurement);

const evaluation = (patch: Record<string, unknown> = {}) =>
	evaluatePortraitAcceptance({
		characterId: "K001",
		requestId: "req-1",
		imageBytes,
		review: { ...review, ...patch },
		profile: artifactProfile,
		measurementBytes: boundMeasurement,
		evidence: [evidenceBytes],
		expectedPositionReference: position,
	});

describe("evaluatePortraitAcceptance", () => {
	it("rejects a wrong-canvas PNG", () => {
		const wrongCanvas = encodePng({
			width: 1023,
			height: 1536,
			pixels: new Uint8Array(1023 * 1536 * 4),
		});
		const verdict = evaluatePortraitAcceptance({
			characterId: "K001",
			requestId: "req-1",
			imageBytes: wrongCanvas,
			review,
			profile: artifactProfile,
			measurementBytes: boundMeasurement,
			evidence: [evidenceBytes],
			expectedPositionReference: position,
		});
		expect(verdict.failures).toContain("canvasRGBA");
		expect(verdict.proportions).toBeNull();
	});

	it("rejects RGB PNG channel count despite valid profile and measurement", () => {
		const rgb = encodeRgbPng(1024, 1536);
		const verdict = evaluatePortraitAcceptance({
			characterId: "K001",
			requestId: "req-1",
			imageBytes: rgb,
			review,
			profile: artifactProfile,
			measurementBytes: boundMeasurement,
			evidence: [evidenceBytes],
			expectedPositionReference: position,
		});
		expect(verdict.failures).toContain("canvasRGBA");
		expect(verdict.proportions).toBeNull();
	});

	it("enforces the exact 0.900 core fraction boundary", () => {
		const pixels = (corePixels: number) => {
			const data = new Uint8Array(1024 * 1536 * 4);
			for (let i = 0; i < 1000; i++)
				data[i * 4 + 3] = i < corePixels ? 250 : 249;
			data[1000 * 4 + 3] = 0;
			return encodePng({ width: 1024, height: 1536, pixels: data });
		};
		const at900 = pixels(900);
		const at899 = pixels(899);
		const below = evaluatePortraitAcceptance({
			characterId: "K001",
			requestId: "req-1",
			imageBytes: at900,
			review: alphaReview(at900),
			profile: artifactProfile,
			measurementBytes: boundMeasurement,
			evidence: [evidenceBytes],
			expectedPositionReference: position,
		});
		const at = evaluatePortraitAcceptance({
			characterId: "K001",
			requestId: "req-1",
			imageBytes: at899,
			review: alphaReview(at899),
			profile: artifactProfile,
			measurementBytes: boundMeasurement,
			evidence: [evidenceBytes],
			expectedPositionReference: position,
		});
		expect(below.coreFraction).toBe(0.9);
		expect(below.failures).not.toContain("alphaCoreAndBackground");
		expect(at.coreFraction).toBe(0.899);
		expect(at.failures).toContain("alphaCoreAndBackground");
	});

	function alphaReview(image: Uint8Array) {
		const imageSHA = digest(image);
		return {
			...review,
			sha256: imageSHA,
			criteria: Object.fromEntries(
				rowNames.map((name) => [
					name,
					{ verdict: "pass", scope: "whole-image", imageSHA, evidenceSHA },
				]),
			),
		};
	}

	it("binds all rows to real evidence and pins position identity only", () => {
		const verdict = evaluation();
		expect(verdict.proportions?.pass).toBe(true);
		expect(verdict.pass).toBe(true);
		expect(verdict.failures).toEqual([]);
		expect(verdict.positionReference).toEqual(position);
		expect(verdict.positionVerification).toContain("identity binding only");
		expect(verdict.ownerApprovalImplied).toBe(false);
		expect(verdict.releaseApprovalImplied).toBe(false);
	});

	it("fails every row whose evidence is absent or changed", () => {
		const verdict = evaluatePortraitAcceptance({
			characterId: "K001",
			requestId: "req-1",
			imageBytes,
			review,
			profile: null,
			measurementBytes: null,
			evidence: [],
		});
		expect(verdict.failures).toContain("evidence:Q01");
		expect(verdict.failures).toContain("evidence:defringe");
	});

	it("fails stale evidence digests and individual failed rows", () => {
		const changedRows = {
			...review.criteria,
			Q02: {
				verdict: "fail",
				scope: "whole-image",
				imageSHA,
				evidenceSHA,
			},
			Q03: {
				verdict: "pass",
				scope: "whole-image",
				imageSHA,
				evidenceSHA: "c".repeat(64),
			},
		};
		const verdict = evaluation({ criteria: changedRows });
		expect(verdict.failures).toContain("Q02");
		expect(verdict.failures).toContain("evidence:Q03");
	});

	it("fails malformed and open position-reference shapes", () => {
		expect(
			evaluation({ positionReference: { ...position, extra: true } }).failures,
		).toContain("positionReference");
		expect(evaluation({ positionReference: undefined }).failures).toContain(
			"positionReference",
		);
	});

	it("returns a failed canvas verdict for malformed image bytes", () => {
		const verdict = evaluatePortraitAcceptance({
			characterId: "K001",
			requestId: "req-1",
			imageBytes: new Uint8Array([1, 2, 3]),
			review,
			profile: null,
			measurementBytes: null,
			evidence: [evidenceBytes],
		});
		expect(verdict.pass).toBe(false);
		expect(verdict.failures).toContain("canvasRGBA");
		expect(verdict.proportions).toBeNull();
	});

	it("does not throw or produce proportions for malformed PNG with valid artifacts", () => {
		const malformedPng = new Uint8Array([1, 2, 3]);
		const verdict = evaluatePortraitAcceptance({
			characterId: "K001",
			requestId: "req-1",
			imageBytes: malformedPng,
			review: {
				...review,
				sha256: digest(malformedPng),
			},
			profile: artifactProfile,
			measurementBytes: boundMeasurement,
			evidence: [evidenceBytes],
			expectedPositionReference: position,
		});
		expect(verdict.pass).toBe(false);
		expect(verdict.failures).toContain("canvasRGBA");
		expect(verdict.proportions).toBeNull();
	});

	it("fails safely when image bytes are valid but measurement identity is stale", () => {
		const staleBytes = new TextEncoder().encode(
			JSON.stringify({
				...makeObservation("f".repeat(64), "0".repeat(64)),
				canvas: [1024, 1536],
			}),
		);
		const verdict = evaluatePortraitAcceptance({
			characterId: "K001",
			requestId: "req-1",
			imageBytes,
			review,
			profile: artifactProfile,
			measurementBytes: staleBytes,
			evidence: [evidenceBytes],
			expectedPositionReference: position,
		});
		expect(verdict.pass).toBe(false);
		expect(verdict.failures).toContain("measuredProportions");
	});

	it("rejects stale identity and mismatched position pins", () => {
		expect(evaluation({ characterId: "K002" }).failures).toContain(
			"exactImageReview",
		);
		expect(
			evaluatePortraitAcceptance({
				characterId: "K001",
				requestId: "req-1",
				imageBytes,
				review,
				profile: null,
				measurementBytes: null,
				evidence: [evidenceBytes],
				expectedPositionReference: { ...position, ruleSHA: "c".repeat(64) },
			}).failures,
		).toContain("positionReference");
	});

	it("does not escape on malformed measurement bytes", () => {
		const verdict = evaluatePortraitAcceptance({
			characterId: "K001",
			requestId: "req-1",
			imageBytes,
			review,
			profile: boundProfile,
			measurementBytes: new TextEncoder().encode("{"),
			evidence: [evidenceBytes],
			expectedPositionReference: position,
		});
		expect(verdict.pass).toBe(false);
		expect(verdict.failures).toContain("measuredProportions");
	});

	it("rethrows unexpected evidence iterator failures", () => {
		const evidence = {
			[Symbol.iterator](): IterableIterator<Uint8Array> {
				throw new Error("iterator programming defect");
			},
		};
		expect(() =>
			evaluatePortraitAcceptance({
				characterId: "K001",
				requestId: "req-1",
				imageBytes,
				review,
				profile: artifactProfile,
				measurementBytes: boundMeasurement,
				evidence,
				expectedPositionReference: position,
			}),
		).toThrow("iterator programming defect");
	});
});

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
