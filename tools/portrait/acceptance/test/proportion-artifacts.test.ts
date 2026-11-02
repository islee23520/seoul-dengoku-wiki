import { describe, expect, it } from "bun:test";
import { ProportionError } from "../src/proportion.js";
import {
	createProportionProfileFromArtifacts,
	verifyProportionArtifacts,
} from "../src/proportion-artifacts.js";
import { digest, makeObservation, makePortrait } from "./helpers/fixtures.js";

const imageBytes = makePortrait();
const imageSHA = digest(imageBytes);
const measurement = new TextEncoder().encode(
	JSON.stringify({
		...makeObservation(imageSHA, "unused-input-digest"),
		canvas: [1024, 1536],
	}),
);

describe("proportion artifact byte binding", () => {
	it("creates and verifies a profile using exact measurement bytes", () => {
		const profile = createProportionProfileFromArtifacts({
			commonImageBytes: imageBytes,
			bodyImageBytes: imageBytes,
			commonMeasurementBytes: measurement,
			bodyMeasurementBytes: measurement,
			bodyType: "synthetic-fixture",
			tolerance: { pixels: 0, ratio: 0, evidenceSHA: digest(measurement) },
		});
		expect(
			verifyProportionArtifacts({
				profile,
				imageBytes,
				measurementBytes: measurement,
			}).pass,
		).toBe(true);
	});

	it("rejects stale image identity and malformed bytes as artifact errors", () => {
		const profile = createProportionProfileFromArtifacts({
			commonImageBytes: imageBytes,
			bodyImageBytes: imageBytes,
			commonMeasurementBytes: measurement,
			bodyMeasurementBytes: measurement,
			bodyType: "synthetic-fixture",
			tolerance: { pixels: 0, ratio: 0, evidenceSHA: digest(measurement) },
		});
		const malformed = new TextEncoder().encode("{");
		expect(() =>
			verifyProportionArtifacts({
				profile,
				imageBytes,
				measurementBytes: malformed,
			}),
		).toThrow(ProportionError);
		const stale = new TextEncoder().encode(
			JSON.stringify({
				...makeObservation("f".repeat(64), "x"),
				canvas: [1024, 1536],
			}),
		);
		expect(() =>
			verifyProportionArtifacts({
				profile,
				imageBytes,
				measurementBytes: stale,
			}),
		).toThrow("measurement image SHA mismatch");
	});
});
