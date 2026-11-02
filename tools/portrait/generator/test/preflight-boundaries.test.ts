import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import {
	metricNames,
	operatorPinsSchema,
	type PortraitCandidate,
	type PortraitOperatorPins,
	type PositionMetric,
	PreflightError,
	type PreflightErrorCode,
	parseBoundJson,
	portraitCandidateSchema,
	positionMetricsSchema,
	positionRuleSchema,
	preparePortraitConditions,
	rawPositionMetricsSchema,
} from "../src/preflight.js";

const sha256 = (bytes: Uint8Array): string =>
	createHash("sha256").update(bytes).digest("hex");
const jsonBytes = (value: unknown): Uint8Array =>
	new TextEncoder().encode(JSON.stringify(value));

const metric: PositionMetric = {
	sampleCount: 16,
	meanMidpoint: "12/3",
	meanInterval: ["11/3", "13/3"],
	inner: ["10/3", "14/3"],
	outer: ["9/3", "15/3"],
	measurementStatus: "AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS",
	exactPixelCertification: false,
	passAuthority: true,
	positionReferenceAuthority: true,
	passAuthorityScope: "POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME",
};
const metrics = positionMetricsSchema.parse(
	Object.fromEntries(metricNames.map((name) => [name, metric])),
);

const makeFixture = () => {
	const rawReference = {
		schema: "latest-approved16-second-observer-fixed-rules.v2",
		ruleVersion: "boundary-test-reference-v1",
		sourceManifestSHA256: "a".repeat(64),
		observationsSHA256: "b".repeat(64),
		sourceSetAuthority: "OWNER_RATIFIED_EXACT16",
		measurementProofStatus: "AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS",
		framePassAuthority: false,
		canvas: [1024, 1536],
		formulas: { test: "synthetic" },
		metrics: rawPositionMetricsSchema.parse(metrics),
		rows: Array.from({ length: 16 }, (_, index) => ({
			id: `boundary-${index}`,
		})),
		sourceCutPolicy: "test-only",
		positionReferenceAuthority: true,
		positionMeasurementGaps: [],
		authorityScope: { position: "POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME" },
		cutAuthority: "FAIL",
		backgroundAuthority: "UNVERIFIED",
	};
	const positionReferenceBytes = jsonBytes(rawReference);
	const rule = {
		schemaVersion: 2,
		referenceVersion: rawReference.ruleVersion,
		adapterSchema: "complete-source-position-rule-adapter.v1",
		rawReference: {
			path: "test:reference",
			sha256: sha256(positionReferenceBytes),
			ruleVersion: rawReference.ruleVersion,
			sourceManifestSHA256: rawReference.sourceManifestSHA256,
			observationsSHA256: rawReference.observationsSHA256,
		},
		concurrence: { path: "test:concurrence", sha256: "c".repeat(64) },
		position: {
			unit: "px",
			sourceCoordinateSystem: "top-left-x-right-y-down",
			authorityScope: "POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME",
			measurementProofStatus: "AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS",
			positionReferenceAuthority: true,
			metrics: rawPositionMetricsSchema.parse(metrics),
		},
	};
	const ruleBytes = jsonBytes(rule);
	const lookBytes = jsonBytes({
		characterId: "boundary-recipient",
		lookId: "boundary-look",
		identity: {
			characterId: "boundary-recipient",
			name: "Synthetic boundary recipient",
		},
		slots: { hair: "authored-hair-slot", outfit: "authored-outfit-slot" },
		name: "Boundary test authored look",
	});
	const imageBytes = new Uint8Array([
		137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0,
		0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 11, 73, 68, 65, 84, 120,
		156, 99, 96, 0, 2, 0, 0, 5, 0, 1, 167, 97, 190, 165, 0, 0, 0, 0, 73, 69, 78,
		68, 174, 66, 96, 130,
	]);
	const referenceImages = [
		{
			id: "recipient",
			role: "recipient-appearance-only" as const,
			sameOwnerRecipient: true as const,
			allowedProperties: ["hair", "outfit"],
			sourceHash: sha256(imageBytes),
			bytes: imageBytes,
		},
		{
			id: "technique",
			role: "drawing-technique-only" as const,
			allowedProperties: [
				"linework",
				"shading",
				"rendering",
				"drawing-technique",
			],
			bytes: imageBytes,
		},
		{
			id: "framing",
			role: "framing-only" as const,
			allowedProperties: ["pose"],
			bytes: imageBytes,
		},
	];
	const candidate = {
		ruleBytes,
		positionReferenceBytes,
		lookBytes,
		referenceImages,
		composition: {
			frameContractVersion: "position-reference.v2",
			cameraContractId: "boundary-camera",
			mode: "portrait",
			coordinatedHeadTorso: true,
			viewerRight: true,
			gazeCamera: true,
			fullHeadShoulderConstraints: true,
			referenceVersion: rawReference.ruleVersion,
			referenceSHA: sha256(positionReferenceBytes),
			ruleSHA: sha256(ruleBytes),
			unit: "px",
			positionMetrics: metrics,
			measuredFrameGuide: {
				sourceHash: "e".repeat(64),
				metadataSHA: "f".repeat(64),
				landmarkBinding: "1".repeat(64),
				canvas: [1024, 1536],
			},
			wholeFramePassAuthority: false,
			referencePrecedence: "synthetic test fixture",
		},
	};
	const operatorPins = {
		ruleSHA: sha256(ruleBytes),
		positionReferenceSHA: sha256(positionReferenceBytes),
		lookSHA: sha256(lookBytes),
		referenceImages: referenceImages.map(({ id, bytes }) => ({
			id,
			sha256: sha256(bytes),
		})),
	};
	return {
		candidate: portraitCandidateSchema.parse(candidate),
		operatorPins: operatorPinsSchema.parse(operatorPins),
	} satisfies {
		candidate: PortraitCandidate;
		operatorPins: PortraitOperatorPins;
	};
};

const expectCode = (
	code: PreflightErrorCode,
	operation: () => unknown,
): void => {
	try {
		operation();
		expect.unreachable(`Expected preflight failure: ${code}`);
	} catch (error) {
		expect(error).toBeInstanceOf(PreflightError);
		if (error instanceof PreflightError) expect(error.code).toBe(code);
	}
};

const expectValidBaseline = (
	candidate: PortraitCandidate,
	pins: PortraitOperatorPins,
): void => {
	expect(() => preparePortraitConditions(candidate, pins)).not.toThrow();
};

describe("preflight descriptor and metric boundaries", () => {
	test("requires matching nonempty ordered image descriptors and pins", () => {
		const { candidate, operatorPins } = makeFixture();
		expectValidBaseline(candidate, operatorPins);
		const noReferences = { ...candidate, referenceImages: [] };
		const noPins = { ...operatorPins, referenceImages: [] };
		expectCode("REFERENCE_DESCRIPTOR_MISMATCH", () =>
			preparePortraitConditions(noReferences, noPins),
		);
	});

	test("enforces recipient ownership and role-specific properties", () => {
		const { candidate, operatorPins } = makeFixture();
		expectValidBaseline(candidate, operatorPins);
		const cases = [
			{
				index: 0,
				change: { sameOwnerRecipient: false },
			},
			{
				index: 0,
				change: { sameOwnerRecipient: undefined },
			},
			{
				index: 1,
				change: { sameOwnerRecipient: true },
			},
			{
				index: 1,
				change: { allowedProperties: ["hair"] },
			},
			{
				index: 2,
				change: { allowedProperties: ["framing"] },
			},
			{
				index: 2,
				change: { role: "individual-face-only" },
			},
		] as const;
		for (const { index, change } of cases) {
			const changed = {
				...candidate,
				referenceImages: candidate.referenceImages.map((image, imageIndex) =>
					imageIndex === index ? { ...image, ...change } : image,
				),
			};
			expect(() => portraitCandidateSchema.parse(changed)).toThrow();
			expectCode("REFERENCE_DESCRIPTOR_MISMATCH", () =>
				preparePortraitConditions(changed, operatorPins),
			);
		}
	});

	test("accepts native role property subsets and binds recipient sourceHash", () => {
		const { candidate, operatorPins } = makeFixture();
		expectValidBaseline(candidate, operatorPins);
		const accepted = {
			...candidate,
			referenceImages: candidate.referenceImages.map((image, index) => {
				if (index === 0) {
					return {
						...image,
						allowedProperties: ["face", "body", "accessories"],
						sourceHash: operatorPins.referenceImages[index]?.sha256,
					};
				}
				if (index === 1) {
					return { ...image, allowedProperties: ["linework"] };
				}
				return { ...image, allowedProperties: ["pose", "frame"] };
			}),
		};
		const acceptedCandidate = portraitCandidateSchema.parse(accepted);
		expectValidBaseline(acceptedCandidate, operatorPins);
		const incorrectSourceHash = {
			...candidate,
			referenceImages: candidate.referenceImages.map((image, index) =>
				index === 0 ? { ...image, sourceHash: "0".repeat(64) } : image,
			),
		};
		expectCode("REFERENCE_DESCRIPTOR_MISMATCH", () =>
			preparePortraitConditions(incorrectSourceHash, operatorPins),
		);
	});

	test("requires both technique and framing roles when pins omit them too", () => {
		const { candidate, operatorPins } = makeFixture();
		expectValidBaseline(candidate, operatorPins);
		for (const omittedRole of [
			"drawing-technique-only",
			"framing-only",
		] as const) {
			const references = candidate.referenceImages.filter(
				(image) => image.role !== omittedRole,
			);
			const changed = { ...candidate, referenceImages: references };
			const matchingPins = {
				...operatorPins,
				referenceImages: references.map((image) => ({
					id: image.id,
					sha256: sha256(image.bytes),
				})),
			};
			expectCode("REFERENCE_DESCRIPTOR_MISMATCH", () =>
				preparePortraitConditions(changed, matchingPins),
			);
		}
	});

	test("accepts semantically equal raw metrics with different object key order", () => {
		const { candidate, operatorPins } = makeFixture();
		expectValidBaseline(candidate, operatorPins);
		const originalRule = parseBoundJson(
			candidate.ruleBytes,
			positionRuleSchema,
		);
		const originalPosition = originalRule.position;
		const reorderedRule = {
			...originalRule,
			position: {
				...originalPosition,
				metrics: Object.fromEntries(
					Object.entries(originalPosition.metrics).reverse(),
				),
			},
		};
		const ruleBytes = new Uint8Array(jsonBytes(reorderedRule));
		const ruleSHA = sha256(ruleBytes);
		const changed = {
			...candidate,
			ruleBytes,
			composition: { ...candidate.composition, ruleSHA },
		};
		const pins = { ...operatorPins, ruleSHA };
		expectValidBaseline(changed, pins);
		const prepared = preparePortraitConditions(changed, pins);
		expect(isDeepStrictEqual(prepared.positionMetrics, metrics)).toBe(true);
	});
});
