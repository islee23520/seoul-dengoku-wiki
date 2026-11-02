import { describe, expect, it } from "bun:test";
import { PORTRAIT_ACCEPTANCE_CRITERIA as criteria } from "../src/criteria.js";
import { evaluatePortraitAcceptance } from "../src/evaluator.js";
import { evaluatePortraitAcceptanceReplacement } from "../src/evaluator-replacement.js";
import {
	digest,
	makeObservation,
	makePortrait,
	makeProfile,
} from "./helpers/fixtures.js";

const rows = [...criteria.qualityRows, ...criteria.semanticRows];
const position = {
	referenceVersion: "fixture-v1",
	referenceSHA: "a".repeat(64),
	ruleSHA: "b".repeat(64),
};
const imageBytes = makePortrait();
const imageSHA = digest(imageBytes);
const evidenceBytes = new TextEncoder().encode("parity evidence bytes");
const evidenceSHA = digest(evidenceBytes);
const measurementBytes = new TextEncoder().encode(
	JSON.stringify({
		...makeObservation(imageSHA, "0".repeat(64)),
		canvas: [1024, 1536],
	}),
);

const profile = makeProfile(imageBytes, measurementBytes);

function reviewWithLeadEvidenceExtension() {
	const reviewRows = Object.fromEntries(
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
	);
	return {
		characterId: "K001",
		requestId: "req-1",
		sha256: imageSHA,
		actualImageViewed: true,
		technicalVerdict: "pass",
		acceptanceSchema: criteria.schema,
		positionReference: position,
		criteria: reviewRows,
		evidence: [{ path: "evidence.bin", sha256: evidenceSHA }],
	};
}

function evaluate(review: unknown) {
	const input = {
		characterId: "K001",
		requestId: "req-1",
		imageBytes,
		review,
		profile,
		measurementBytes,
		evidence: [evidenceBytes],
		expectedPositionReference: position,
	};
	return {
		original: evaluatePortraitAcceptance(input),
		replacement: evaluatePortraitAcceptanceReplacement(input),
	};
}

describe("replacement evaluator output parity", () => {
	it("matches original output for CLI evidence extensions and row metadata", () => {
		const review = reviewWithLeadEvidenceExtension();
		const { original, replacement } = evaluate(review);
		expect(original.pass).toBe(true);
		expect(replacement).toEqual(original);
	});

	it("matches original output for absent or malformed criteria maps", () => {
		for (const criteriaValue of [undefined, [], null, "invalid"]) {
			const { original, replacement } = evaluate({
				characterId: "K001",
				requestId: "req-1",
				sha256: imageSHA,
				actualImageViewed: true,
				technicalVerdict: "pass",
				acceptanceSchema: criteria.schema,
				positionReference: position,
				criteria: criteriaValue,
			});
			expect(replacement).toEqual(original);
		}
	});
});
