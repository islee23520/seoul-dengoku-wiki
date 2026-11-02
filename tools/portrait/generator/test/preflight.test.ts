import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { z } from "zod";
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
} satisfies PositionMetric;

const metrics = positionMetricsSchema.parse(
	Object.fromEntries(metricNames.map((name) => [name, metric])),
);
const rawScope = {
	position: "POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME",
	sourceCuts: "test-only-source-cut-scope",
	background: "test-only-background-scope",
	frame: "test-only-frame-scope",
};
const rawMetrics = rawPositionMetricsSchema.parse(metrics);

const rawReference = {
	schema: "latest-approved16-second-observer-fixed-rules.v2",
	ruleVersion: "source-reference-version-test-only",
	sourceManifestSHA256: "a".repeat(64),
	observationsSHA256: "b".repeat(64),
	sourceSetAuthority: "OWNER_RATIFIED_EXACT16",
	measurementProofStatus: "AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS",
	framePassAuthority: false,
	canvas: [1024, 1536],
	formulas: {
		meanMidpoint: "test-only",
		meanInterval: "test-only",
		inner: "test-only",
		outer: "test-only",
		eyeY: "test-only",
		headCenterX: "test-only",
		headCenterY: "test-only",
	},
	metrics: rawMetrics,
	rows: Array.from({ length: 16 }, (_, index) => ({
		id: `test-source-${index + 1}`,
		positionIntervals: Object.fromEntries(
			metricNames.map((name) => [name, ["0", "1"]]),
		),
	})),
	sourceCutPolicy: "test-only",
	positionReferenceAuthority: true,
	positionMeasurementGaps: [],
	authorityScope: rawScope,
	cutAuthority: "FAIL",
	backgroundAuthority: "UNVERIFIED",
};

const makeFixture = () => {
	const positionReferenceBytes = jsonBytes(rawReference);
	const rawReferenceSHA = sha256(positionReferenceBytes);
	const rule = {
		schemaVersion: 2,
		referenceVersion: rawReference.ruleVersion,
		adapterSchema: "complete-source-position-rule-adapter.v1",
		rawReference: {
			path: "test-fixture:position-reference",
			sha256: rawReferenceSHA,
			ruleVersion: rawReference.ruleVersion,
			sourceManifestSHA256: rawReference.sourceManifestSHA256,
			observationsSHA256: rawReference.observationsSHA256,
		},
		concurrence: { path: "test-fixture:concurrence", sha256: "c".repeat(64) },
		position: {
			unit: "px",
			sourceCoordinateSystem: "top-left-x-right-y-down",
			authorityScope: "POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME",
			measurementProofStatus: "AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS",
			positionReferenceAuthority: true,
			metrics: rawMetrics,
		},
	};
	const ruleBytes = jsonBytes(rule);
	const lookBytes = jsonBytes({
		characterId: "test-recipient",
		lookId: "authored-test-look",
		identity: { characterId: "test-recipient" },
	});
	const transparentPng = new Uint8Array([
		137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0,
		0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 11, 73, 68, 65, 84, 120,
		156, 99, 96, 0, 2, 0, 0, 5, 0, 1, 167, 97, 190, 165, 0, 0, 0, 0, 73, 69, 78,
		68, 174, 66, 96, 130,
	]);
	const referenceImages = [
		{
			id: "recipient-appearance-test-image",
			role: "recipient-appearance-only" as const,
			sameOwnerRecipient: true as const,
			allowedProperties: ["hair", "outfit"],
			sourceHash: sha256(transparentPng),
			bytes: transparentPng,
		},
		{
			id: "drawing-technique-test-image",
			role: "drawing-technique-only" as const,
			allowedProperties: [
				"linework",
				"shading",
				"rendering",
				"drawing-technique",
			],
			bytes: transparentPng,
		},
		{
			id: "framing-test-image",
			role: "framing-only" as const,
			allowedProperties: ["pose"],
			bytes: transparentPng,
		},
	];
	const candidate = {
		ruleBytes,
		positionReferenceBytes,
		lookBytes,
		referenceImages,
		composition: {
			frameContractVersion: "position-reference.v2",
			cameraContractId: "portrait-camera-v2",
			mode: "portrait",
			coordinatedHeadTorso: true,
			viewerRight: true,
			gazeCamera: true,
			fullHeadShoulderConstraints: true,
			referenceVersion: rawReference.ruleVersion,
			referenceSHA: rawReferenceSHA,
			ruleSHA: sha256(ruleBytes),
			unit: "px",
			positionMetrics: metrics,
			measuredFrameGuide: {
				sourceHash: "d".repeat(64),
				metadataSHA: "e".repeat(64),
				landmarkBinding: "f".repeat(64),
				canvas: [1024, 1536],
			},
			wholeFramePassAuthority: false,
			referencePrecedence:
				"Only exact position metrics own numeric framing positions; reference images do not widen position authority.",
		},
	};
	const operatorPins = {
		ruleSHA: sha256(ruleBytes),
		positionReferenceSHA: rawReferenceSHA,
		lookSHA: sha256(lookBytes),
		referenceImages: referenceImages.map(({ id, bytes }) => ({
			id,
			sha256: sha256(bytes),
		})),
	};
	const typedCandidate = portraitCandidateSchema.parse(candidate);
	const typedOperatorPins = operatorPinsSchema.parse(operatorPins);
	return {
		candidate: typedCandidate,
		operatorPins: typedOperatorPins,
	} satisfies {
		candidate: PortraitCandidate;
		operatorPins: PortraitOperatorPins;
	};
};

const expectPreflightError = (
	code: PreflightErrorCode,
	action: () => unknown,
) => {
	let caught: unknown;
	try {
		action();
	} catch (error) {
		caught = error;
	}
	expect(caught).toBeInstanceOf(PreflightError);
	if (!(caught instanceof PreflightError)) return;
	expect(caught.code).toBe(code);
};

const alterLookBytes = (
	lookBytes: Uint8Array,
	change: (payload: Record<string, unknown>) => Record<string, unknown>,
): Uint8Array => {
	const payload = z
		.record(z.string(), z.unknown())
		.parse(JSON.parse(new TextDecoder().decode(lookBytes)));
	return jsonBytes(change(payload));
};

describe("preparePortraitConditions source-bound contract", () => {
	test("strict JSON scanner preserves array and enclosing-object stack frames", () => {
		const duplicateAfterArray = new TextEncoder().encode(
			'{"rows":[{"id":1},{"id":2}],"after":1,"after":2}',
		);
		expectPreflightError("DUPLICATE_JSON_KEY", () =>
			parseBoundJson(duplicateAfterArray, z.unknown()),
		);
		const separateObjectKeys = new TextEncoder().encode('[{"id":1},{"id":2}]');
		expect(parseBoundJson(separateObjectKeys, z.unknown())).toEqual([
			{ id: 1 },
			{ id: 2 },
		]);
	});

	test("binds all artifacts and complete position metrics without dispatch", () => {
		const { candidate, operatorPins } = makeFixture();
		const prepared = preparePortraitConditions(candidate, operatorPins);
		expect(prepared).toMatchObject({
			artifactHashes: {
				rule: operatorPins.ruleSHA,
				positionReference: operatorPins.positionReferenceSHA,
				look: operatorPins.lookSHA,
				referenceImages: operatorPins.referenceImages.map((pin) => pin.sha256),
			},
			positionMetrics: metrics,
			providerCalls: 0,
			dispatched: false,
		});
		expect(prepared).toEqual(
			preparePortraitConditions(candidate, operatorPins),
		);
	});

	test("does not accept trusted registry data from candidate", () => {
		const { candidate, operatorPins } = makeFixture();
		const candidateWithRegistry = {
			...candidate,
			trustedRegistry: { approved: true },
		};
		expectPreflightError("CANDIDATE_SCHEMA_INVALID", () =>
			preparePortraitConditions(candidateWithRegistry, operatorPins),
		);
	});

	test("shows candidate artifact bytes and operator pins are not yet verified", () => {
		const { candidate, operatorPins } = makeFixture();
		const changedLook = {
			...candidate,
			lookBytes: new Uint8Array([...candidate.lookBytes, 0]),
		};
		expectPreflightError("ARTIFACT_HASH_MISMATCH", () =>
			preparePortraitConditions(changedLook, operatorPins),
		);
		const changedRulePin = { ...operatorPins, ruleSHA: "0".repeat(64) };
		expectPreflightError("ARTIFACT_HASH_MISMATCH", () =>
			preparePortraitConditions(candidate, changedRulePin),
		);
		const changedReference = {
			...candidate,
			positionReferenceBytes: new Uint8Array([
				...candidate.positionReferenceBytes,
				0,
			]),
		};
		expectPreflightError("ARTIFACT_HASH_MISMATCH", () =>
			preparePortraitConditions(changedReference, operatorPins),
		);
		const changedImage = {
			...candidate,
			referenceImages: candidate.referenceImages.map((image, index) =>
				index === 0
					? { ...image, bytes: new Uint8Array([...image.bytes, 0]) }
					: image,
			),
		};
		expectPreflightError("ARTIFACT_HASH_MISMATCH", () =>
			preparePortraitConditions(changedImage, operatorPins),
		);
	});

	test("shows raw version, rational, and adapter metric drift are unverified", () => {
		const { candidate, operatorPins } = makeFixture();
		const changedVersion = {
			...candidate,
			composition: {
				...candidate.composition,
				referenceVersion: "other-source-version",
			},
		};
		expectPreflightError("REFERENCE_BINDING_MISMATCH", () =>
			preparePortraitConditions(changedVersion, operatorPins),
		);
		const changedRational = {
			...candidate,
			composition: {
				...candidate.composition,
				positionMetrics: {
					...metrics,
					chinY: { ...metric, meanMidpoint: "12/0" },
				},
			},
		};
		expectPreflightError("POSITION_METRICS_MISMATCH", () =>
			preparePortraitConditions(changedRational, operatorPins),
		);
		const changedMetric = {
			...candidate,
			composition: {
				...candidate.composition,
				positionMetrics: {
					...metrics,
					chinY: { ...metric, meanMidpoint: "13/3" },
				},
			},
		};
		expectPreflightError("POSITION_METRICS_MISMATCH", () =>
			preparePortraitConditions(changedMetric, operatorPins),
		);
	});

	test("pins canonical look identity and detects duplicate JSON keys", () => {
		const { candidate, operatorPins } = makeFixture();
		const mismatchedLookBytes = alterLookBytes(
			candidate.lookBytes,
			(payload) => ({
				...payload,
				characterId: "different-recipient",
			}),
		);
		const mismatchedLook = {
			...candidate,
			lookBytes: mismatchedLookBytes,
		};
		const matchingPins = {
			...operatorPins,
			lookSHA: sha256(mismatchedLookBytes),
		};
		expectPreflightError("RECIPIENT_LOOK_MISMATCH", () =>
			preparePortraitConditions(mismatchedLook, matchingPins),
		);
		const duplicateKeyBytes = new TextEncoder().encode(
			'{"identity":{"name":"x","name":"y"}}',
		);
		expectPreflightError("DUPLICATE_JSON_KEY", () =>
			parseBoundJson(duplicateKeyBytes, z.unknown()),
		);
	});

	test("shows role, authored identity, order, and duplicate pin drift are unverified", () => {
		const { candidate, operatorPins } = makeFixture();
		const roleDrift = {
			...candidate,
			referenceImages: candidate.referenceImages.map((image, index) =>
				index === 2
					? { ...image, role: "recipient-appearance-only" as const }
					: image,
			),
		};
		expectPreflightError("REFERENCE_DESCRIPTOR_MISMATCH", () =>
			preparePortraitConditions(roleDrift, operatorPins),
		);
		const reordered = {
			...candidate,
			referenceImages: [...candidate.referenceImages].reverse(),
		};
		expectPreflightError("REFERENCE_DESCRIPTOR_MISMATCH", () =>
			preparePortraitConditions(reordered, operatorPins),
		);
		const duplicatePin = {
			...operatorPins,
			referenceImages: [
				...operatorPins.referenceImages.slice(0, 1),
				...operatorPins.referenceImages,
			],
		};
		expectPreflightError("OPERATOR_PIN_MISMATCH", () =>
			preparePortraitConditions(candidate, duplicatePin),
		);
	});
});
