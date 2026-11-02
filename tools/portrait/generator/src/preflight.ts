import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { cpaPaddingSchema, validateCpaCanvas } from "./cpa-padding.js";
import { validatePortraitPng } from "./png.js";
import { parseBoundJson } from "./projection-ingress.js";

export { parseBoundJson } from "./projection-ingress.js";

// Versioned wire preflight only. The portal owns source acquisition and owner
// authority; these integrity pins are not signatures or public request fields.
const referenceEditConditionsSchema = z.strictObject({
	schemaVersion: z.literal(2),
	generationProfile: z.enum(["native340-v1", "cpa340-padded-v1"]).optional(),
	generationGeometry: cpaPaddingSchema.optional(),
	inputMode: z.literal("reference-img2img"),
	compiler: z.literal("source-preservation-edit.v1"),
	model: z.literal("gpt-image-2.5-sunburst"),
	prompt: z.string().min(1).max(16384),
	promptSHA256: z.string().regex(/^[a-f0-9]{64}$/),
	sourceSHA256: z.string().regex(/^[a-f0-9]{64}$/),
	transformSHA256: z.string().regex(/^[a-f0-9]{64}$/),
	resolvedIntentSHA256: z.string().regex(/^[a-f0-9]{64}$/),
	referenceHashes: z.tuple([z.string().regex(/^[a-f0-9]{64}$/)]),
	orderedImageBytes: z.tuple([z.instanceof(Uint8Array)]),
});
export type ReferenceEditConditions = z.infer<
	typeof referenceEditConditionsSchema
>;
export function prepareReferenceEditConditions(input: unknown) {
	const parsed = referenceEditConditionsSchema.safeParse(input);
	if (!parsed.success) throw Error("REFERENCE_EDIT_BINDING_MISMATCH");
	const value = parsed.data;
	if (value.generationProfile === "cpa340-padded-v1") {
		if (!value.generationGeometry)
			throw Error("REFERENCE_EDIT_BINDING_MISMATCH");
		validateCpaCanvas(...value.generationGeometry.canvas);
	} else if (value.generationGeometry)
		throw Error("REFERENCE_EDIT_BINDING_MISMATCH");
	const hash = (bytes: string | Uint8Array) =>
		createHash("sha256").update(bytes).digest("hex");
	if (
		hash(value.prompt) !== value.promptSHA256 ||
		hash(value.orderedImageBytes[0]) !== value.referenceHashes[0]
	)
		throw Error("REFERENCE_EDIT_BINDING_MISMATCH");
	validatePortraitPng(value.orderedImageBytes[0], value.generationProfile);
	return {
		...value,
		orderedImageBytes: [new Uint8Array(value.orderedImageBytes[0])] as [
			Uint8Array,
		],
	};
}

export const metricNames = [
	"chinY",
	"crownY",
	"headLeft",
	"headRight",
	"leftPupilX",
	"leftPupilY",
	"rightPupilX",
	"rightPupilY",
	"eyeY",
	"topGap",
	"headCenterX",
	"headCenterY",
] as const;

export const preflightErrorCodes = [
	"CANDIDATE_SCHEMA_INVALID",
	"ARTIFACT_HASH_MISMATCH",
	"OPERATOR_PIN_MISMATCH",
	"REFERENCE_BINDING_MISMATCH",
	"POSITION_METRICS_MISMATCH",
	"REFERENCE_DESCRIPTOR_MISMATCH",
	"RECIPIENT_LOOK_MISMATCH",
	"DUPLICATE_JSON_KEY",
] as const;

export type PreflightErrorCode = (typeof preflightErrorCodes)[number];

export class PreflightError extends Error {
	readonly code: PreflightErrorCode;

	constructor(code: PreflightErrorCode) {
		super(code);
		this.name = "PreflightError";
		this.code = code;
	}
}

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const rationalSchema = z.string().regex(/^-?\d+(?:\/[1-9]\d*)?$/);
const permittedReferenceProperties = {
	"drawing-technique-only": [
		"linework",
		"shading",
		"rendering",
		"drawing-technique",
	],
	"individual-face-only": [
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
	"face-base-only": [
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
	"framing-only": ["pose", "frame"],
	"recipient-appearance-only": [
		"face",
		"body",
		"hair",
		"outfit",
		"accessories",
	],
} as const;
const positionMetricSchema = z
	.object({
		sampleCount: z.literal(16),
		meanMidpoint: rationalSchema,
		meanInterval: z.tuple([rationalSchema, rationalSchema]),
		inner: z.tuple([rationalSchema, rationalSchema]),
		outer: z.tuple([rationalSchema, rationalSchema]),
		measurementStatus: z.literal("AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS"),
		exactPixelCertification: z.literal(false),
		passAuthority: z.literal(true),
		positionReferenceAuthority: z.literal(true),
		passAuthorityScope: z.literal("POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"),
	})
	.strict();

export const positionMetricsSchema = z
	.object({
		chinY: positionMetricSchema,
		crownY: positionMetricSchema,
		headLeft: positionMetricSchema,
		headRight: positionMetricSchema,
		leftPupilX: positionMetricSchema,
		leftPupilY: positionMetricSchema,
		rightPupilX: positionMetricSchema,
		rightPupilY: positionMetricSchema,
		eyeY: positionMetricSchema,
		topGap: positionMetricSchema,
		headCenterX: positionMetricSchema,
		headCenterY: positionMetricSchema,
	})
	.strict();

export const rawPositionMetricSchema = positionMetricSchema;
export const rawPositionMetricsSchema = positionMetricsSchema;

export const positionRuleSchema = z
	.object({
		schemaVersion: z.literal(2),
		referenceVersion: z.string().min(1),
		adapterSchema: z.literal("complete-source-position-rule-adapter.v1"),
		rawReference: z
			.object({
				path: z.string().min(1),
				sha256: sha256Schema,
				ruleVersion: z.string().min(1),
				sourceManifestSHA256: sha256Schema,
				observationsSHA256: sha256Schema,
			})
			.strict(),
		concurrence: z
			.object({ path: z.string().min(1), sha256: sha256Schema })
			.strict(),
		position: z
			.object({
				unit: z.literal("px"),
				sourceCoordinateSystem: z.literal("top-left-x-right-y-down"),
				authorityScope: z.literal("POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"),
				measurementProofStatus: z.literal(
					"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS",
				),
				positionReferenceAuthority: z.literal(true),
				metrics: rawPositionMetricsSchema,
			})
			.strict(),
	})
	.strict();

export const positionReferenceSchema = z
	.object({
		schema: z.literal("latest-approved16-second-observer-fixed-rules.v2"),
		ruleVersion: z.string().min(1),
		sourceManifestSHA256: sha256Schema,
		observationsSHA256: sha256Schema,
		sourceSetAuthority: z.literal("OWNER_RATIFIED_EXACT16"),
		measurementProofStatus: z.literal(
			"AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS",
		),
		framePassAuthority: z.literal(false),
		canvas: z.tuple([z.literal(1024), z.literal(1536)]),
		formulas: z.record(z.string(), z.unknown()),
		metrics: rawPositionMetricsSchema,
		rows: z
			.array(z.object({ id: z.string().min(1) }).passthrough())
			.length(16)
			.refine((rows) => new Set(rows.map((row) => row.id)).size === 16),
		sourceCutPolicy: z.unknown(),
		positionReferenceAuthority: z.literal(true),
		positionMeasurementGaps: z.array(z.unknown()).length(0),
		authorityScope: z
			.object({
				position: z.literal("POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME"),
			})
			.passthrough(),
		cutAuthority: z.literal("FAIL"),
		backgroundAuthority: z.literal("UNVERIFIED"),
	})
	.passthrough();

// Minimal binding projection only; this is not the native complete-look schema.
export const lookBindingSchema = z
	.object({
		characterId: z.string().min(1),
		lookId: z.string().min(1),
		identity: z.object({ characterId: z.string().min(1) }).passthrough(),
	})
	.passthrough();

const referenceImageSchema = z
	.object({
		id: z.string().min(1),
		role: z.enum([
			"drawing-technique-only",
			"individual-face-only",
			"face-base-only",
			"framing-only",
			"recipient-appearance-only",
		]),
		sameOwnerRecipient: z.literal(true).optional(),
		allowedProperties: z.array(z.string()).optional(),
		sourceHash: sha256Schema.optional(),
		bytes: z.instanceof(Uint8Array),
	})
	.strict()
	.refine((reference) =>
		reference.role === "recipient-appearance-only"
			? reference.sameOwnerRecipient === true &&
				reference.sourceHash !== undefined
			: reference.sameOwnerRecipient === undefined,
	)
	.refine((reference) => {
		const permittedProperties: readonly string[] =
			permittedReferenceProperties[reference.role];
		return (
			reference.allowedProperties === undefined ||
			(reference.allowedProperties.length > 0 &&
				new Set(reference.allowedProperties).size ===
					reference.allowedProperties.length &&
				reference.allowedProperties.every((property) =>
					permittedProperties.includes(property),
				))
		);
	});

const compositionSchema = z
	.object({
		frameContractVersion: z.literal("position-reference.v2"),
		cameraContractId: z.string().regex(/^[a-z][a-z0-9-]{0,79}$/),
		mode: z.literal("portrait"),
		coordinatedHeadTorso: z.literal(true),
		viewerRight: z.literal(true),
		gazeCamera: z.literal(true),
		fullHeadShoulderConstraints: z.literal(true),
		referenceVersion: z.string().min(1),
		referenceSHA: sha256Schema,
		ruleSHA: sha256Schema,
		unit: z.literal("px"),
		positionMetrics: positionMetricsSchema,
		measuredFrameGuide: z
			.object({
				sourceHash: sha256Schema,
				metadataSHA: sha256Schema,
				landmarkBinding: sha256Schema,
				canvas: z.tuple([z.literal(1024), z.literal(1536)]),
			})
			.strict(),
		wholeFramePassAuthority: z.literal(false),
		referencePrecedence: z.string().min(1),
	})
	.strict();

export const portraitCandidateSchema = z
	.object({
		ruleBytes: z.instanceof(Uint8Array),
		positionReferenceBytes: z.instanceof(Uint8Array),
		lookBytes: z.instanceof(Uint8Array),
		referenceImages: z.array(referenceImageSchema),
		composition: compositionSchema,
	})
	.strict();

export const operatorPinsSchema = z
	.object({
		ruleSHA: sha256Schema,
		positionReferenceSHA: sha256Schema,
		lookSHA: sha256Schema,
		referenceImages: z.array(
			z.object({ id: z.string().min(1), sha256: sha256Schema }).strict(),
		),
	})
	.strict();

export type PositionMetric = Readonly<z.infer<typeof positionMetricSchema>>;
export type PositionMetrics = Readonly<z.infer<typeof positionMetricsSchema>>;
export type PositionRule = Readonly<z.infer<typeof positionRuleSchema>>;
export type PositionReference = Readonly<
	z.infer<typeof positionReferenceSchema>
>;
export type PortraitCandidate = z.input<typeof portraitCandidateSchema>;
export type PortraitOperatorPins = z.input<typeof operatorPinsSchema>;
export type PortraitConditions = Readonly<{
	artifactHashes: Readonly<{
		rule: string;
		positionReference: string;
		look: string;
		referenceImages: readonly string[];
	}>;
	positionMetrics: PositionMetrics;
	providerCalls: 0;
	dispatched: false;
}>;

export function preparePortraitConditions(
	candidateInput: unknown,
	operatorPinsInput: unknown,
): PortraitConditions {
	let candidate: z.infer<typeof portraitCandidateSchema>;
	try {
		candidate = portraitCandidateSchema.parse(candidateInput);
	} catch (error) {
		if (error instanceof z.ZodError) {
			if (
				error.issues.some(
					(issue) =>
						issue.path[0] === "composition" &&
						issue.path[1] === "positionMetrics",
				)
			) {
				throw new PreflightError("POSITION_METRICS_MISMATCH");
			}
			if (
				error.issues.some(
					(issue) =>
						issue.path[0] === "referenceImages" ||
						issue.path[0] === "composition",
				)
			) {
				throw new PreflightError("REFERENCE_DESCRIPTOR_MISMATCH");
			}
			throw new PreflightError("CANDIDATE_SCHEMA_INVALID");
		}
		throw error;
	}
	let operatorPins: z.infer<typeof operatorPinsSchema>;
	try {
		operatorPins = operatorPinsSchema.parse(operatorPinsInput);
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new PreflightError("OPERATOR_PIN_MISMATCH");
		}
		throw error;
	}
	if (
		candidate.referenceImages.length === 0 ||
		operatorPins.referenceImages.length === 0 ||
		!candidate.referenceImages.some(
			(image) => image.role === "drawing-technique-only",
		) ||
		!candidate.referenceImages.some((image) => image.role === "framing-only") ||
		new Set(candidate.referenceImages.map((image) => image.id)).size !==
			candidate.referenceImages.length
	) {
		throw new PreflightError("REFERENCE_DESCRIPTOR_MISMATCH");
	}
	if (
		new Set(operatorPins.referenceImages.map((pin) => pin.id)).size !==
		operatorPins.referenceImages.length
	) {
		throw new PreflightError("OPERATOR_PIN_MISMATCH");
	}
	if (
		operatorPins.referenceImages.length !== candidate.referenceImages.length ||
		operatorPins.referenceImages.some(
			(pin, index) => pin.id !== candidate.referenceImages[index]?.id,
		)
	) {
		throw new PreflightError("REFERENCE_DESCRIPTOR_MISMATCH");
	}

	const hash = (bytes: Uint8Array): string =>
		createHash("sha256").update(bytes).digest("hex");
	const ruleSHA = hash(candidate.ruleBytes);
	const positionReferenceSHA = hash(candidate.positionReferenceBytes);
	const lookSHA = hash(candidate.lookBytes);
	const referenceImageHashes = candidate.referenceImages.map((image) =>
		hash(image.bytes),
	);
	if (
		ruleSHA !== operatorPins.ruleSHA ||
		positionReferenceSHA !== operatorPins.positionReferenceSHA ||
		lookSHA !== operatorPins.lookSHA ||
		operatorPins.referenceImages.length !== candidate.referenceImages.length
	) {
		throw new PreflightError("ARTIFACT_HASH_MISMATCH");
	}
	if (
		operatorPins.referenceImages.some(
			(pin, index) => pin.sha256 !== referenceImageHashes[index],
		)
	) {
		throw new PreflightError("ARTIFACT_HASH_MISMATCH");
	}
	if (
		candidate.referenceImages.some(
			(image, index) =>
				image.role === "recipient-appearance-only" &&
				image.sourceHash !== referenceImageHashes[index],
		)
	) {
		throw new PreflightError("REFERENCE_DESCRIPTOR_MISMATCH");
	}
	let rule: PositionRule;
	let reference: PositionReference;
	let look: z.infer<typeof lookBindingSchema>;
	try {
		rule = parseBoundJson(candidate.ruleBytes, positionRuleSchema);
	} catch (error) {
		if (error instanceof PreflightError) throw error;
		if (
			error instanceof z.ZodError ||
			error instanceof SyntaxError ||
			error instanceof TypeError
		) {
			throw new PreflightError("CANDIDATE_SCHEMA_INVALID");
		}
		throw error;
	}
	try {
		reference = parseBoundJson(
			candidate.positionReferenceBytes,
			positionReferenceSchema,
		);
	} catch (error) {
		if (error instanceof PreflightError) throw error;
		if (
			error instanceof z.ZodError ||
			error instanceof SyntaxError ||
			error instanceof TypeError
		) {
			throw new PreflightError("CANDIDATE_SCHEMA_INVALID");
		}
		throw error;
	}
	try {
		look = parseBoundJson(candidate.lookBytes, lookBindingSchema);
	} catch (error) {
		if (error instanceof PreflightError) throw error;
		if (
			error instanceof z.ZodError ||
			error instanceof SyntaxError ||
			error instanceof TypeError
		) {
			throw new PreflightError("RECIPIENT_LOOK_MISMATCH");
		}
		throw error;
	}
	if (look.identity.characterId !== look.characterId) {
		throw new PreflightError("RECIPIENT_LOOK_MISMATCH");
	}
	if (
		!isDeepStrictEqual(candidate.composition.positionMetrics, reference.metrics)
	) {
		throw new PreflightError("POSITION_METRICS_MISMATCH");
	}
	if (
		rule.rawReference.sha256 !== positionReferenceSHA ||
		rule.referenceVersion !== reference.ruleVersion ||
		rule.rawReference.ruleVersion !== reference.ruleVersion ||
		rule.rawReference.sourceManifestSHA256 !== reference.sourceManifestSHA256 ||
		rule.rawReference.observationsSHA256 !== reference.observationsSHA256 ||
		!isDeepStrictEqual(rule.position.metrics, reference.metrics) ||
		candidate.composition.referenceVersion !== reference.ruleVersion ||
		candidate.composition.referenceSHA !== positionReferenceSHA ||
		candidate.composition.ruleSHA !== ruleSHA
	) {
		throw new PreflightError("REFERENCE_BINDING_MISMATCH");
	}
	return {
		artifactHashes: {
			rule: ruleSHA,
			positionReference: positionReferenceSHA,
			look: lookSHA,
			referenceImages: referenceImageHashes,
		},
		positionMetrics: reference.metrics,
		providerCalls: 0,
		dispatched: false,
	};
}
