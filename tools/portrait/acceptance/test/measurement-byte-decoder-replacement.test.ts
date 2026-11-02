import { describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { ZodError } from "zod";
import {
	evaluatePortraitAcceptance,
	PORTRAIT_ACCEPTANCE_CRITERIA,
} from "../src/index.js";
import { decodeMeasurementValue } from "../src/measurement-byte-decoder.js";
import { ProportionError } from "../src/proportion.js";
import {
	createProportionProfileFromArtifacts,
	verifyProportionArtifacts,
} from "../src/proportion-artifacts.js";
import {
	digest,
	makeObservation,
	makePortrait,
	makeProfile,
} from "./helpers/fixtures.js";

const encode = (value: string): Uint8Array => new TextEncoder().encode(value);

describe("fresh measurement byte decoder", () => {
	it("preserves an independently authored JSON object", () => {
		expect(
			decodeMeasurementValue(
				encode('{"note":"value","list":[1,null,true],"nested":{"x":2}}'),
			),
		).toEqual({ note: "value", list: [1, null, true], nested: { x: 2 } });
	});

	it("preserves native null", () => {
		expect(decodeMeasurementValue(encode("null"))).toBeNull();
	});

	it("preserves native numeric primitive", () => {
		expect(decodeMeasurementValue(encode("7"))).toBe(7);
	});

	it("preserves native duplicate-key last value", () => {
		expect(decodeMeasurementValue(encode('{"x":1,"x":2}'))).toEqual({ x: 2 });
	});

	it("accepts a UTF-8 BOM", () => {
		expect(
			decodeMeasurementValue(new Uint8Array([239, 187, 191, 123, 125])),
		).toEqual({});
	});

	for (const [name, bytes] of [
		["malformed UTF-8", new Uint8Array([195, 40])],
		["malformed JSON", encode("{")],
		["empty bytes", new Uint8Array()],
	] as const) {
		it(`rejects ${name} with the existing typed error`, () => {
			let thrown: unknown;
			try {
				decodeMeasurementValue(bytes);
			} catch (error: unknown) {
				thrown = error;
			}
			expect(thrown).toBeDefined();
			expect(thrown).toBeInstanceOf(ProportionError);
			if (!(thrown instanceof ProportionError))
				throw new Error("Expected ProportionError");
			expect(thrown.constructor).toBe(ProportionError);
			expect(thrown.code).toBe("INVALID_SOURCE_PROFILE");
			expect(thrown.name).toBe("ProportionError");
		});
	}
});

const imageBytes = makePortrait();
const imageSHA = digest(imageBytes);
const observation = makeObservation(imageSHA, "0".repeat(64));
const measurementBytes = encode(
	JSON.stringify({
		...observation,
		authoredMetadata: { reference: "fixture" },
		landmarks: {
			...observation.landmarks,
			authoredMetadata: { measured: true },
		},
	}),
);
const profile = makeProfile(imageBytes, measurementBytes);

describe("existing consumer preservation guards (not fresh decoder RED)", () => {
	it("verify translates malformed bytes using the existing error identity", () => {
		let thrown: unknown;
		try {
			verifyProportionArtifacts({
				profile,
				imageBytes,
				measurementBytes: encode("{"),
			});
		} catch (error: unknown) {
			thrown = error;
		}
		expect(thrown).toBeDefined();
		expect(thrown).toBeInstanceOf(ProportionError);
		if (!(thrown instanceof ProportionError))
			throw new Error("Expected ProportionError");
		expect(thrown.constructor).toBe(ProportionError);
		expect(thrown.code).toBe("INVALID_SOURCE_PROFILE");
		expect(thrown.name).toBe("ProportionError");
	});

	it("verify keeps schema rejection separate from decoder errors", () => {
		let thrown: unknown;
		try {
			verifyProportionArtifacts({
				profile,
				imageBytes,
				measurementBytes: encode("{}"),
			});
		} catch (error: unknown) {
			thrown = error;
		}
		expect(thrown).toBeDefined();
		expect(thrown).toBeInstanceOf(ZodError);
		expect(thrown).not.toBeInstanceOf(ProportionError);
	});

	it("profile and verify accept authored metadata and hash original BOM bytes", () => {
		const bomBytes = new Uint8Array(measurementBytes.length + 3);
		bomBytes.set([239, 187, 191]);
		bomBytes.set(measurementBytes, 3);
		const originalSHA = createHash("sha256").update(bomBytes).digest("hex");
		const plainSHA = createHash("sha256")
			.update(measurementBytes)
			.digest("hex");
		const bomProfile = createProportionProfileFromArtifacts({
			commonImageBytes: imageBytes,
			bodyImageBytes: imageBytes,
			commonMeasurementBytes: bomBytes,
			bodyMeasurementBytes: bomBytes,
			bodyType: "synthetic-fixture",
			tolerance: { pixels: 0, ratio: 0, evidenceSHA: originalSHA },
		});
		expect(originalSHA).not.toBe(plainSHA);
		expect(bomProfile.commonMeasurementSHA).toBe(originalSHA);
		expect(bomProfile.bodyMeasurementSHA).toBe(originalSHA);
		const verdict = verifyProportionArtifacts({
			profile: bomProfile,
			imageBytes,
			measurementBytes: bomBytes,
		});
		expect(verdict.pass).toBe(true);
		expect(verdict.measurementEvidenceSHA).toBe(originalSHA);
	});

	it("public evaluator catches malformed measurement bytes with a passing review", () => {
		const evidenceBytes = encode("independent reviewer evidence");
		const evidenceSHA = digest(evidenceBytes);
		const positionReference = {
			referenceVersion: "fixture-v1",
			referenceSHA: "a".repeat(64),
			ruleSHA: "b".repeat(64),
		};
		const rows = [
			...PORTRAIT_ACCEPTANCE_CRITERIA.qualityRows,
			...PORTRAIT_ACCEPTANCE_CRITERIA.semanticRows,
		];
		const input = {
			characterId: "K001",
			requestId: "req-1",
			imageBytes,
			profile,
			measurementBytes,
			evidence: [evidenceBytes],
			expectedPositionReference: positionReference,
			review: {
				characterId: "K001",
				requestId: "req-1",
				sha256: imageSHA,
				actualImageViewed: true,
				technicalVerdict: "pass",
				acceptanceSchema: "portrait-integrated-acceptance.v1",
				positionReference,
				criteria: Object.fromEntries(
					rows.map((name) => [
						name,
						{ verdict: "pass", scope: "whole-image", imageSHA, evidenceSHA },
					]),
				),
			},
		};
		const valid = evaluatePortraitAcceptance(input);
		expect(valid.pass).toBe(true);
		expect(valid.failures).toEqual([]);
		expect(valid.proportions?.pass).toBe(true);
		const malformed = evaluatePortraitAcceptance({
			...input,
			measurementBytes: encode("{"),
		});
		expect(malformed.pass).toBe(false);
		expect(malformed.proportions).toBeNull();
		expect(malformed.failures).toEqual(["measuredProportions"]);
	});
});
