import { describe, expect, it } from "bun:test";
import { PORTRAIT_ACCEPTANCE_CRITERIA as criteria } from "../src/criteria.js";
import * as publicAcceptance from "../src/index.js";
import { evaluatePortraitAcceptance } from "../src/index.js";
import {
	digest,
	makeObservation,
	makePortrait,
	makeProfile,
} from "./helpers/fixtures.js";

const imageBytes = makePortrait();
it("exports original-canvas measurements through the consumer API", async () => {
	const module = await import("../src/source-measurement.js");
	expect(Reflect.get(publicAcceptance, "sourceDraftComparison")).toBe(
		module.sourceDraftComparison,
	);
	expect(Reflect.get(publicAcceptance, "SourceMeasurementError")).toBe(
		module.SourceMeasurementError,
	);
});
const imageSHA = digest(imageBytes);
const evidenceBytes = new TextEncoder().encode("lead-review evidence fixture");
const evidenceSHA = digest(evidenceBytes);
const position = {
	referenceVersion: "fixture-v1",
	referenceSHA: "a".repeat(64),
	ruleSHA: "b".repeat(64),
};
const measurementBytes = new TextEncoder().encode(
	JSON.stringify({
		...makeObservation(imageSHA, "0".repeat(64)),
		canvas: [1024, 1536],
	}),
);
const profile = makeProfile(imageBytes, measurementBytes);
const rows = [...criteria.qualityRows, ...criteria.semanticRows];

function reviewWithEvidenceExtension(includeEvidence: boolean) {
	return {
		characterId: "K001",
		requestId: "req-integration",
		sha256: imageSHA,
		actualImageViewed: true,
		technicalVerdict: "pass",
		acceptanceSchema: criteria.schema,
		positionReference: position,
		criteria: Object.fromEntries(
			rows.map((name) => [
				name,
				{
					verdict: "pass",
					scope: "whole-image",
					imageSHA,
					evidenceSHA,
					auditMetadata: { reviewerNote: `audited ${name}` },
				},
			]),
		),
		evidence: includeEvidence
			? [{ path: "evidence.bin", sha256: evidenceSHA }]
			: [],
	};
}

describe("public evaluator integration", () => {
	it("accepts lead-reviewed evidence extensions and criterion metadata", () => {
		const result = evaluatePortraitAcceptance({
			characterId: "K001",
			requestId: "req-integration",
			imageBytes,
			review: reviewWithEvidenceExtension(true),
			profile,
			measurementBytes,
			evidence: [evidenceBytes],
			expectedPositionReference: position,
		});

		expect(result.pass).toBe(true);
		expect(result.failures).toEqual([]);
	});

	it("fails when the pinned criterion evidence bytes are missing", () => {
		const result = evaluatePortraitAcceptance({
			characterId: "K001",
			requestId: "req-integration",
			imageBytes,
			review: reviewWithEvidenceExtension(false),
			profile,
			measurementBytes,
			evidence: [],
			expectedPositionReference: position,
		});

		expect(result.pass).toBe(false);
		expect(result.failures).toEqual(rows.map((name) => `evidence:${name}`));
	});
});
