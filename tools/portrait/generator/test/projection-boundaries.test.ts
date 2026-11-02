import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
	metricNames,
	operatorPinsSchema,
	type PositionMetric,
	portraitCandidateSchema,
	positionMetricsSchema,
	preparePortraitConditions,
} from "../src/preflight.js";
import { ProjectionError, projectPortrait } from "../src/projection.js";

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

const createInput = () => {
	const metrics = positionMetricsSchema.parse(
		Object.fromEntries(metricNames.map((name) => [name, metric])),
	);
	const trait = (value: string | number | null, unit?: string) => ({
		value,
		status: value === null ? "unknown" : "approved",
		source: value === null ? null : "portrait-tokens/canonical.json",
		...(unit === undefined ? {} : { unit }),
	});
	const slots = {
		face: Object.fromEntries(
			[
				"description",
				"faceShape",
				"eyeColor",
				"eyeShape",
				"eyebrowShape",
				"lipColor",
				"mouthShape",
				"noseShape",
				"beardShape",
			].map((key) => [
				key,
				trait(key === "description" ? "authored face" : null),
			]),
		),
		hair: Object.fromEntries(
			["description", "shape", "color", "length"].map((key) => [
				key,
				trait(null),
			]),
		),
		body: Object.fromEntries(
			["build", "weight", "bustSize", "height", "skin"].map((key) => [
				key,
				trait(
					key === "height" ? 170 : key === "weight" ? 60 : null,
					key === "height" ? "cm" : key === "weight" ? "kg" : undefined,
				),
			]),
		),
		outfit: Object.fromEntries(
			["headwear", "upper", "lower", "footwear", "marks", "neckline"].map(
				(key) => [key, trait(null)],
			),
		),
		accessories: Object.fromEntries(
			["description", "shape", "color", "material", "mounting"].map((key) => [
				key,
				trait(null),
			]),
		),
	};
	const look = {
		schemaVersion: 2,
		characterId: "canonical-recipient",
		name: "Canonical Recipient",
		personId: "person-204",
		lookId: "canonical-look",
		faceMode: { kind: "unique", variantId: null },
		sourceRefs: ["portrait-tokens/canonical.json"],
		canonicalContext: {
			characterId: "canonical-recipient",
			name: "Canonical Recipient",
			personId: "person-204",
			registry: {
				path: "people.json",
				pointer: "/people/204",
				sha256: "a".repeat(64),
			},
			background: [],
		},
		identity: {
			characterId: "canonical-recipient",
			name: "Canonical Recipient",
		},
		slots,
	};
	const lookBytes = new TextEncoder().encode(JSON.stringify(look));
	const positionReference = {
		schema: "latest-approved16-second-observer-fixed-rules.v2",
		ruleVersion: "canonical-reference",
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
		JSON.stringify(positionReference),
	);
	const positionReferenceSHA = sha256(positionReferenceBytes);
	const ruleBytes = new TextEncoder().encode(
		JSON.stringify({
			schemaVersion: 2,
			referenceVersion: positionReference.ruleVersion,
			adapterSchema: "complete-source-position-rule-adapter.v1",
			rawReference: {
				path: "canonical-reference",
				sha256: positionReferenceSHA,
				ruleVersion: positionReference.ruleVersion,
				sourceManifestSHA256: positionReference.sourceManifestSHA256,
				observationsSHA256: positionReference.observationsSHA256,
			},
			concurrence: { path: "canonical-concurrence", sha256: "d".repeat(64) },
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
	const pixel = new Uint8Array([
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
			sourceHash: sha256(pixel),
			bytes: pixel,
		},
		{
			id: "technique",
			role: "drawing-technique-only" as const,
			allowedProperties: ["linework"],
			bytes: pixel,
		},
		{
			id: "framing",
			role: "framing-only" as const,
			allowedProperties: ["pose"],
			bytes: pixel,
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
			referenceVersion: positionReference.ruleVersion,
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
	return {
		candidate,
		operatorPins,
		prepared: preparePortraitConditions(candidate, operatorPins),
		look,
	};
};

describe("portrait projection source and transport boundaries", () => {
	test("ships all text bytes with CRLF and hashes those exact bytes", () => {
		const { candidate, operatorPins, prepared } = createInput();
		const result = projectPortrait({ candidate, operatorPins, prepared });
		expect(result.text).not.toMatch(/(?<!\r)\n/);
		expect(result.text).toBe(
			`${JSON.stringify(result.rendering, null, 2).split("\n").join("\r\n")}\r\n`,
		);
		expect(result.textSHA).toBe(sha256(new TextEncoder().encode(result.text)));
		expect(JSON.parse(result.text)).toEqual(result.rendering);
	});

	test("preserves canonical look metadata while still rejecting incomplete slots", () => {
		const input = createInput();
		const { look, ...projectionInput } = input;
		const result = projectPortrait(projectionInput);
		expect(result.rendering).toMatchObject({
			schemaVersion: 2,
			characterId: input.look.characterId,
			name: input.look.name,
			personId: input.look.personId,
			faceMode: input.look.faceMode,
			sourceRefs: input.look.sourceRefs,
			canonicalContext: input.look.canonicalContext,
			identity: input.look.identity,
		});
		const incomplete = structuredClone(input.look);
		Reflect.deleteProperty(incomplete.slots.face, "beardShape");
		const lookBytes = new TextEncoder().encode(JSON.stringify(incomplete));
		const candidate = portraitCandidateSchema.parse({
			...input.candidate,
			lookBytes,
		});
		const operatorPins = operatorPinsSchema.parse({
			...input.operatorPins,
			lookSHA: sha256(lookBytes),
		});
		const prepared = preparePortraitConditions(candidate, operatorPins);
		expect(() =>
			projectPortrait({ candidate, operatorPins, prepared }),
		).toThrow(new ProjectionError("INVALID_LOOK"));
	});
});
