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
import {
	ProjectionError,
	projectionInputSchema,
	projectPortrait,
} from "../src/projection.js";

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

const fixture = () => {
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
	const authoredSlots = Object.fromEntries(
		Object.entries(slotFields).map(([slot, fields]) => [
			slot,
			Object.fromEntries(
				fields.map((field) => {
					if (slot === "body" && field === "height")
						return [field, trait(170, "approved", "cm")];
					if (slot === "body" && field === "weight")
						return [field, trait(60, "approved", "kg")];
					if (field === "description" && slot === "face")
						return [field, trait("oval", "authored-draft")];
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
			slots: authoredSlots,
		}),
	);
	const rawReference = {
		schema: "latest-approved16-second-observer-fixed-rules.v2",
		ruleVersion: "projection-test-reference",
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
	return {
		candidate,
		operatorPins,
		prepared: preparePortraitConditions(candidate, operatorPins),
	};
};

const replaceLook = (
	input: ReturnType<typeof fixture>,
	look: Record<string, unknown>,
) => {
	const lookBytes = new TextEncoder().encode(JSON.stringify(look));
	const candidate = portraitCandidateSchema.parse({
		...input.candidate,
		lookBytes,
	});
	const operatorPins = operatorPinsSchema.parse({
		...input.operatorPins,
		lookSHA: sha256(lookBytes),
	});
	const prepared = preparePortraitConditions(candidate, operatorPins);
	return {
		candidate,
		operatorPins: {
			...operatorPins,
			referenceImages: input.operatorPins.referenceImages,
		},
		prepared,
	};
};

const receivedProjectionCode = (input: ReturnType<typeof fixture>): unknown => {
	try {
		projectPortrait(input);
		return undefined;
	} catch (error) {
		return error instanceof Error && "code" in error ? error.code : undefined;
	}
};

describe("source-bound portrait projection", () => {
	test("ships an explicit output canvas and transparent background contract", () => {
		const result = projectPortrait(fixture());
		const expected = {
			width: 1024,
			height: 1536,
			unit: "px",
			format: "png",
			background: "transparent",
		};
		expect(Reflect.get(result.rendering, "output")).toEqual(expected);
		expect(JSON.parse(result.text).output).toEqual(expected);
	});

	test("produces the authored look and exact source-bound framing values", () => {
		const input = fixture();
		const result = projectPortrait(input);
		expect(result.rendering).toMatchObject({
			identity: { characterId: "test-recipient", name: "Recipient" },
			slots: {
				face: { description: { value: "oval", status: "authored-draft" } },
				body: {
					height: { value: 170, unit: "cm" },
					weight: { value: 60, unit: "kg" },
				},
			},
			position: { chinY: { inner: ["10/3", "14/3"], outer: ["9/3", "15/3"] } },
		});
		expect(result.sourceSHA).toBe(input.prepared.artifactHashes.look);
		expect(result.textSHA).toBe(sha256(new TextEncoder().encode(result.text)));
	});

	test("reports changed prepared metrics with a typed error before rendering", () => {
		const input = fixture();
		const tampered = {
			...input,
			prepared: {
				...input.prepared,
				positionMetrics: {
					...input.prepared.positionMetrics,
					chinY: { ...metric, inner: ["11/3", "15/3"] },
				},
			},
		};
		expect(() => projectPortrait(tampered)).toThrow(
			new ProjectionError("PREPARED_CONDITIONS_MISMATCH"),
		);
	});

	test("rejects a missing authored slot field", () => {
		const input = fixture();
		const look = JSON.parse(
			new TextDecoder().decode(input.candidate.lookBytes),
		);
		const missingField = structuredClone(look);
		delete missingField.slots.face.beardShape;
		expect(receivedProjectionCode(replaceLook(input, missingField))).toBe(
			"INVALID_LOOK",
		);
	});

	test("rejects conflicting authored output rather than overwriting source metadata", () => {
		const input = fixture();
		const look = JSON.parse(
			new TextDecoder().decode(input.candidate.lookBytes),
		);
		expect(
			receivedProjectionCode(
				replaceLook(input, {
					...look,
					output: { width: 512, height: 512, source: "author://canvas" },
				}),
			),
		).toBe("INVALID_LOOK");
	});

	test("preserves matching authored output and its extra provenance", () => {
		const input = fixture();
		const look = JSON.parse(
			new TextDecoder().decode(input.candidate.lookBytes),
		);
		const output = {
			width: 1024,
			height: 1536,
			unit: "px",
			format: "png",
			background: "transparent",
			source: "author://canvas",
		};
		const result = projectPortrait(replaceLook(input, { ...look, output }));
		expect(Reflect.get(result.rendering, "output")).toEqual(output);
		expect(JSON.parse(result.text).output).toEqual(output);
	});

	test("rejects an unknown slot status token", () => {
		const input = fixture();
		const look = JSON.parse(
			new TextDecoder().decode(input.candidate.lookBytes),
		);
		const invalidStatus = structuredClone(look);
		invalidStatus.slots.face.description.status = "verified";
		expect(receivedProjectionCode(replaceLook(input, invalidStatus))).toBe(
			"INVALID_LOOK",
		);
	});

	test("rejects nonnumeric body values and missing measurement units", () => {
		const input = fixture();
		const look = JSON.parse(
			new TextDecoder().decode(input.candidate.lookBytes),
		);
		const missingUnit = structuredClone(look);
		delete missingUnit.slots.body.height.unit;
		expect(receivedProjectionCode(replaceLook(input, missingUnit))).toBe(
			"INVALID_LOOK",
		);
		const nonnumeric = structuredClone(look);
		nonnumeric.slots.body.weight.value = "60";
		expect(receivedProjectionCode(replaceLook(input, nonnumeric))).toBe(
			"INVALID_LOOK",
		);
	});

	test("retains derived qualitative measurements and rejects malformed provenance", () => {
		const input = fixture();
		const look = JSON.parse(
			new TextDecoder().decode(input.candidate.lookBytes),
		);
		const trait = {
			value: "average adult height",
			status: "derived-proposal",
			source: "derived:coarse-default",
			derived: true,
			unit: null,
		};
		look.slots.body.height = trait;
		look.identity.origin = {
			value: "unconfirmed",
			status: "unknown",
			source: null,
		};
		expect(
			projectPortrait(replaceLook(input, look)).rendering["slots"],
		).toEqual(look.slots);
		for (const bad of [
			{ ...trait, derived: false },
			{ ...trait, derived: undefined },
			{ ...trait, source: " " },
			{ ...trait, status: "approved" },
			{ ...trait, value: 170 },
			{ ...trait, unit: "cm" },
		]) {
			look.slots.body.height = bad;
			expect(receivedProjectionCode(replaceLook(input, look))).toBe(
				"INVALID_LOOK",
			);
		}
	});

	test("rejects free-text overrides at look and input boundaries", () => {
		const input = fixture();
		const look = JSON.parse(
			new TextDecoder().decode(input.candidate.lookBytes),
		);
		expect(
			receivedProjectionCode(
				replaceLook(input, { ...look, prompt: "override" }),
			),
		).toBe("INVALID_LOOK");
		expect(
			projectionInputSchema.safeParse({ ...input, prompt: "override" }).success,
		).toBe(false);
	});

	test("rejects a prepared look hash changed after preflight", () => {
		const input = fixture();
		const tampered = {
			...input,
			prepared: {
				...input.prepared,
				artifactHashes: {
					...input.prepared.artifactHashes,
					look: "0".repeat(64),
				},
			},
		};
		expect(receivedProjectionCode(tampered)).toBe(
			"PREPARED_CONDITIONS_MISMATCH",
		);
	});

	test("compares equivalent prepared conditions independent of object key order", () => {
		const input = fixture();
		const reorderedPrepared = {
			dispatched: input.prepared.dispatched,
			providerCalls: input.prepared.providerCalls,
			positionMetrics: input.prepared.positionMetrics,
			artifactHashes: {
				referenceImages: input.prepared.artifactHashes.referenceImages,
				look: input.prepared.artifactHashes.look,
				positionReference: input.prepared.artifactHashes.positionReference,
				rule: input.prepared.artifactHashes.rule,
			},
		};
		expect(
			receivedProjectionCode({ ...input, prepared: reorderedPrepared }),
		).toBeUndefined();
	});

	test("preserves explicit unknown null traits and accepts measured numeric units", () => {
		const input = fixture();
		const look = JSON.parse(
			new TextDecoder().decode(input.candidate.lookBytes),
		);
		expect(look.slots.body.height).toEqual({
			value: 170,
			status: "approved",
			source: "portrait-tokens/test-recipient.json",
			unit: "cm",
		});
		expect(look.slots.body.weight).toEqual({
			value: 60,
			status: "approved",
			source: "portrait-tokens/test-recipient.json",
			unit: "kg",
		});
		expect(look.slots.hair.description).toEqual({
			value: null,
			status: "unknown",
			source: null,
		});
		expect(look.slots.outfit.upper).toEqual({
			value: null,
			status: "unknown",
			source: null,
		});
		expect(look.slots.accessories.material).toEqual({
			value: null,
			status: "unknown",
			source: null,
		});
	});

	test("validates prepared hash mismatch independently of metric changes", () => {
		const input = fixture();
		const prepared = {
			...input.prepared,
			artifactHashes: {
				...input.prepared.artifactHashes,
				referenceImages: ["0".repeat(64)],
			},
		};
		expect(receivedProjectionCode({ ...input, prepared })).toBe(
			"PREPARED_CONDITIONS_MISMATCH",
		);
	});

	test("requires the exact candidate reference order and corresponding image hashes", () => {
		const input = fixture();
		expect(
			input.candidate.referenceImages.map(
				({ id, role, allowedProperties }) => ({
					id,
					role,
					properties: allowedProperties,
				}),
			),
		).toEqual([
			{
				id: "recipient",
				role: "recipient-appearance-only",
				properties: ["hair", "outfit"],
			},
			{
				id: "technique",
				role: "drawing-technique-only",
				properties: ["linework"],
			},
			{ id: "framing", role: "framing-only", properties: ["pose"] },
		]);
		expect(input.prepared.artifactHashes.referenceImages).toEqual(
			input.operatorPins.referenceImages.map(({ sha256: hash }) => hash),
		);
	});

	test("binds text transport bytes and rendering bytes to their shipped hashes", () => {
		const input = fixture();
		const result = projectPortrait(input);
		const renderingBytes = new TextEncoder().encode(
			JSON.stringify(result.rendering),
		);
		const textBytes = new TextEncoder().encode(result.text);
		expect(result.renderingSHA).toBe(sha256(renderingBytes));
		expect(result.textSHA).toBe(sha256(textBytes));
		expect(result.text).toBe(
			`${JSON.stringify(result.rendering, null, 2).split("\n").join("\r\n")}\r\n`,
		);
		expect(JSON.parse(result.text)).toEqual(result.rendering);
		expect(JSON.parse(result.text).identity).toEqual({
			characterId: "test-recipient",
			name: "Recipient",
		});
		expect(JSON.parse(result.text).slots).toEqual(
			JSON.parse(new TextDecoder().decode(input.candidate.lookBytes)).slots,
		);
	});
});
