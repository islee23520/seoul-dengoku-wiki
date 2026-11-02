import { createHash } from "node:crypto";
import {
	metricNames,
	operatorPinsSchema,
	type PositionMetric,
	portraitCandidateSchema,
	positionMetricsSchema,
	preparePortraitConditions,
} from "../src/preflight.js";
import { projectPortrait } from "../src/projection.js";

const sha256 = (bytes: Uint8Array): string =>
	createHash("sha256").update(bytes).digest("hex");

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

export function createTransportFixture(promptSecret?: string) {
	const metrics = positionMetricsSchema.parse(
		Object.fromEntries(metricNames.map((name) => [name, metric])),
	);
	const trait = (
		value: string | number | null,
		status: string,
		unit?: string,
	) => ({
		value,
		status,
		source: value === null ? null : "portrait-tokens/test-recipient.json",
		...(unit === undefined ? {} : { unit }),
	});
	const slotFields = {
		face: [
			"description",
			"faceShape",
			"eyeColor",
			"eyeShape",
			"eyebrowShape",
			"lipColor",
			"mouthShape",
			"noseShape",
			"beardShape",
		],
		hair: ["description", "shape", "color", "length"],
		body: ["build", "weight", "bustSize", "height", "skin"],
		outfit: ["headwear", "upper", "lower", "footwear", "marks", "neckline"],
		accessories: ["description", "shape", "color", "material", "mounting"],
	} as const;
	const slots = Object.fromEntries(
		Object.entries(slotFields).map(([slot, fields]) => [
			slot,
			Object.fromEntries(
				fields.map((field) => {
					if (slot === "body" && field === "height")
						return [field, trait(170, "approved", "cm")];
					if (slot === "body" && field === "weight")
						return [field, trait(60, "approved", "kg")];
					if (slot === "face" && field === "description")
						return [
							field,
							trait(
								promptSecret === undefined ? "oval" : `oval ${promptSecret}`,
								"authored-draft",
							),
						];
					return [field, trait(null, "unknown")];
				}),
			),
		]),
	);
	const lookBytes = new TextEncoder().encode(
		JSON.stringify({
			schemaVersion: 2,
			characterId: "test-recipient",
			name: "Recipient",
			lookId: "authored-test-look",
			faceMode: { kind: "unique", variantId: null },
			identity: { characterId: "test-recipient", name: "Recipient" },
			slots,
		}),
	);
	const rawReference = {
		schema: "latest-approved16-second-observer-fixed-rules.v2",
		ruleVersion: "transport-test-reference",
		sourceManifestSHA256: "f".repeat(64),
		observationsSHA256: "e".repeat(64),
		sourceSetAuthority: "OWNER_RATIFIED_EXACT16",
		measurementProofStatus: "AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS",
		framePassAuthority: false,
		canvas: [1024, 1536],
		formulas: {},
		metrics,
		rows: Array.from({ length: 16 }, (_, index) => ({ id: `source-${index}` })),
		sourceCutPolicy: null,
		positionReferenceAuthority: true,
		positionMeasurementGaps: [],
		authorityScope: { position: "POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME" },
		cutAuthority: "FAIL",
		backgroundAuthority: "UNVERIFIED",
	};
	const positionReferenceBytes = new TextEncoder().encode(
		JSON.stringify(rawReference),
	);
	const positionReferenceSHA = sha256(positionReferenceBytes);
	const ruleBytes = new TextEncoder().encode(
		JSON.stringify({
			schemaVersion: 2,
			referenceVersion: rawReference.ruleVersion,
			adapterSchema: "complete-source-position-rule-adapter.v1",
			rawReference: {
				path: "test-reference",
				sha256: positionReferenceSHA,
				ruleVersion: rawReference.ruleVersion,
				sourceManifestSHA256: rawReference.sourceManifestSHA256,
				observationsSHA256: rawReference.observationsSHA256,
			},
			concurrence: { path: "test-concurrence", sha256: "d".repeat(64) },
			position: {
				unit: "px",
				sourceCoordinateSystem: "top-left-x-right-y-down",
				authorityScope: "POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME",
				measurementProofStatus: "AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS",
				positionReferenceAuthority: true,
				metrics,
			},
		}),
	);
	const pixels = new Uint8Array([1, 2, 3, 4, 5, 6]);
	const referenceImages = [
		{
			id: "recipient",
			role: "recipient-appearance-only" as const,
			sameOwnerRecipient: true as const,
			allowedProperties: ["hair", "outfit"],
			sourceHash: sha256(pixels),
			bytes: new Uint8Array(pixels),
		},
		{
			id: "technique",
			role: "drawing-technique-only" as const,
			allowedProperties: ["linework"],
			bytes: new Uint8Array([7, 8, 9]),
		},
		{
			id: "framing",
			role: "framing-only" as const,
			allowedProperties: ["pose"],
			bytes: new Uint8Array([10, 11, 12]),
		},
	];
	const candidate = portraitCandidateSchema.parse({
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
			referenceSHA: positionReferenceSHA,
			ruleSHA: sha256(ruleBytes),
			unit: "px",
			positionMetrics: metrics,
			measuredFrameGuide: {
				sourceHash: "c".repeat(64),
				metadataSHA: "b".repeat(64),
				landmarkBinding: "a".repeat(64),
				canvas: [1024, 1536],
			},
			wholeFramePassAuthority: false,
			referencePrecedence: "exact position metrics only",
		},
	});
	const operatorPins = operatorPinsSchema.parse({
		ruleSHA: sha256(ruleBytes),
		positionReferenceSHA,
		lookSHA: sha256(lookBytes),
		referenceImages: referenceImages.map(({ id, bytes }) => ({
			id,
			sha256: sha256(bytes),
		})),
	});
	const prepared = preparePortraitConditions(candidate, operatorPins);
	const projection = projectPortrait({ candidate, operatorPins, prepared });
	return {
		projection,
		candidate,
		operatorPins,
		referenceImages,
		orderedImageBytes: referenceImages.map(
			({ bytes }) => new Uint8Array(bytes),
		),
	};
}
