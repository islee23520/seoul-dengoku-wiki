import { createHash } from "node:crypto";
import { z } from "zod";
import { PORTRAIT_ACCEPTANCE_CRITERIA } from "./criteria.js";
import { decodeMeasurementValue } from "./measurement-byte-decoder.js";
import { decodePng } from "./png.js";
import { ProportionError } from "./proportion-error.js";

export {
	ProportionError,
	type ProportionErrorCode,
} from "./proportion-error.js";

export const PROPORTION_PROFILE_SCHEMA = "portrait-proportion-profile.v1";
export const PROPORTION_VERDICT_SCHEMA = "portrait-proportion-verdict.v1";

export const PROPORTION_SEMANTICS = {
	head: "attached-hair-left-right-crown-to-lowest-chin",
	face: "face-top-skin-to-chin-and-skin-left-right",
	shoulders: "joint-centers-not-garment-extents",
	torso: "authored-visible-torso-cross-section-same-level",
} as const;

const TARGET_METRIC_NAMES = [
	"headWidth",
	"headHeight",
	"faceWidth",
	"faceHeight",
	"eyeY",
	"headCenterX",
	"crownY",
] as const;

const BODY_METRIC_NAMES = ["shoulderWidth", "torsoWidth"] as const;

const SPAN_METRIC_NAMES = [
	"headWidth",
	"headHeight",
	"faceWidth",
	"faceHeight",
	"shoulderWidth",
	"torsoWidth",
] as const;

const RATIO_NAMES = ["shoulderToHead", "torsoToHead"] as const;

const LANDMARK_NAMES = [
	"crown",
	"chin",
	"headLeft",
	"headRight",
	"faceTop",
	"faceLeft",
	"faceRight",
	"leftPupil",
	"rightPupil",
	"leftShoulder",
	"rightShoulder",
	"torsoLeft",
	"torsoRight",
] as const;

export type ProportionCanvas = typeof PORTRAIT_ACCEPTANCE_CRITERIA.canvas;
export type LandmarkName = (typeof LANDMARK_NAMES)[number];
export type LandmarkPoint = readonly [number, number];
export type LandmarkSet = Readonly<Record<LandmarkName, LandmarkPoint>>;
export type TargetMetricName = (typeof TARGET_METRIC_NAMES)[number];
export type BodyMetricName = (typeof BODY_METRIC_NAMES)[number];
export type ProportionMetricName = TargetMetricName | BodyMetricName;
export type ProportionMetrics = Readonly<Record<ProportionMetricName, number>>;
export type ProportionTargets = Readonly<Record<TargetMetricName, number>>;
export type ProportionRatios = Readonly<{
	shoulderToHead: number;
	torsoToHead: number;
}>;
export type ProportionTolerance = Readonly<{
	pixels: number;
	ratio: number;
	evidenceSHA: string;
}>;

export type ProportionObservation = Readonly<{
	imageSHA: string;
	measurementEvidenceSHA: string;
	actualImageMeasured: true;
	canvas: ProportionCanvas;
	bodyType?: unknown;
	landmarks: LandmarkSet;
}>;

export type ProportionProfile = Readonly<{
	schema: typeof PROPORTION_PROFILE_SCHEMA;
	canvas: ProportionCanvas;
	bodyType: string;
	commonSourceSHA: string;
	commonMeasurementSHA: string;
	bodySourceSHA: string;
	bodyMeasurementSHA: string;
	targets: ProportionTargets;
	ratios: ProportionRatios;
	tolerance: ProportionTolerance;
	/** Never checked by validation; always authored by createProportionProfile. */
	semantics?: unknown;
	profileSHA: string;
}>;

export type ProportionVerdict = Readonly<{
	schema: typeof PROPORTION_VERDICT_SCHEMA;
	imageSHA: string;
	measurementEvidenceSHA: string;
	profileSHA: string;
	bodyType: string;
	measured: ProportionMetrics;
	ratios: ProportionRatios;
	failures: readonly string[];
	pass: boolean;
	ownerApprovalImplied: false;
}>;

export type SharedProportionProfiles = Readonly<{
	commonSHA: string;
	bodyTypes: readonly string[];
}>;

const SHA_HEX = /^[a-f0-9]{64}$/;
const CANVAS = PORTRAIT_ACCEPTANCE_CRITERIA.canvas;

const ShaHex = z.string().regex(SHA_HEX);
const CanvasSchema = z.tuple([z.literal(CANVAS[0]), z.literal(CANVAS[1])]);
const InCanvasPoint = z.tuple([
	z
		.number()
		.min(0)
		.max(CANVAS[0] - 1),
	z
		.number()
		.min(0)
		.max(CANVAS[1] - 1),
]);
const LandmarksSchema = z.looseObject({
	crown: InCanvasPoint,
	chin: InCanvasPoint,
	headLeft: InCanvasPoint,
	headRight: InCanvasPoint,
	faceTop: InCanvasPoint,
	faceLeft: InCanvasPoint,
	faceRight: InCanvasPoint,
	leftPupil: InCanvasPoint,
	rightPupil: InCanvasPoint,
	leftShoulder: InCanvasPoint,
	rightShoulder: InCanvasPoint,
	torsoLeft: InCanvasPoint,
	torsoRight: InCanvasPoint,
});
const TargetsSchema = z.looseObject({
	headWidth: z.number(),
	headHeight: z.number(),
	faceWidth: z.number(),
	faceHeight: z.number(),
	eyeY: z.number(),
	headCenterX: z.number(),
	crownY: z.number(),
});
const RatiosSchema = z.strictObject({
	shoulderToHead: z.number().positive(),
	torsoToHead: z.number().positive(),
});
const NonEmptyTrimmedString = z
	.string()
	.refine((value) => value.trim().length > 0);

const validSHA = (value: unknown): value is string =>
	typeof value === "string" && SHA_HEX.test(value);
const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);
const isUnknownArray = (value: unknown): value is readonly unknown[] =>
	Array.isArray(value);

function canonicalJSON(value: unknown): string {
	if (isUnknownArray(value))
		return `[${value.map((item) => canonicalJSON(item)).join(",")}]`;
	if (isRecord(value)) {
		return `{${Object.keys(value)
			.sort()
			.map((key) => `${JSON.stringify(key)}:${canonicalJSON(value[key])}`)
			.join(",")}}`;
	}
	return JSON.stringify(value);
}

function hashProfile(value: unknown): string {
	return createHash("sha256").update(canonicalJSON(value)).digest("hex");
}

const ObservationSourceSchema = z.looseObject({
	imageSHA: ShaHex,
	measurementEvidenceSHA: ShaHex,
	actualImageMeasured: z.literal(true),
});
const ObservationCanvasSchema = z.looseObject({ canvas: CanvasSchema });
const ObservationLandmarksSchema = z.looseObject({
	landmarks: LandmarksSchema,
});

const ProportionObservationSchema: z.ZodType<ProportionObservation> =
	z.readonly(
		z.looseObject({
			imageSHA: ShaHex,
			measurementEvidenceSHA: ShaHex,
			actualImageMeasured: z.literal(true),
			canvas: CanvasSchema,
			bodyType: z.unknown().optional(),
			landmarks: z.readonly(LandmarksSchema),
		}),
	);

const ProfileShellSchema = z.looseObject({
	schema: z.literal(PROPORTION_PROFILE_SCHEMA),
});
const ProfileSourceSchema = z.looseObject({
	canvas: CanvasSchema,
	bodyType: NonEmptyTrimmedString,
	commonSourceSHA: ShaHex,
	commonMeasurementSHA: ShaHex,
	bodySourceSHA: ShaHex,
	bodyMeasurementSHA: ShaHex,
	tolerance: z.looseObject({ evidenceSHA: ShaHex }),
});
const ProfileTargetsSchema = z.looseObject({
	targets: TargetsSchema,
	ratios: RatiosSchema,
});
const ProfileToleranceSchema = z.looseObject({
	tolerance: z.looseObject({
		pixels: z.number().nonnegative(),
		ratio: z.number().nonnegative(),
	}),
});

const ProportionProfileSchema: z.ZodType<ProportionProfile> = z.readonly(
	z.looseObject({
		schema: z.literal(PROPORTION_PROFILE_SCHEMA),
		canvas: CanvasSchema,
		bodyType: NonEmptyTrimmedString,
		commonSourceSHA: ShaHex,
		commonMeasurementSHA: ShaHex,
		bodySourceSHA: ShaHex,
		bodyMeasurementSHA: ShaHex,
		targets: TargetsSchema,
		ratios: RatiosSchema,
		tolerance: z.looseObject({
			pixels: z.number().nonnegative(),
			ratio: z.number().nonnegative(),
			evidenceSHA: ShaHex,
		}),
		profileSHA: ShaHex,
	}),
);

type ObservationIdentity = Readonly<{
	imageSHA: string;
	measurementEvidenceSHA: string;
	bodyType: unknown;
}>;

type MeasuredObservation = Readonly<{
	metrics: ProportionMetrics;
	identity: ObservationIdentity;
}>;

function measureObservation(observation: unknown): MeasuredObservation {
	const sourced = ObservationSourceSchema.safeParse(observation);
	if (!sourced.success)
		throw new ProportionError(
			"SOURCE_BINDING_REQUIRED",
			"source-bound actual landmark measurement required",
		);
	const canvased = ObservationCanvasSchema.safeParse(sourced.data);
	if (!canvased.success)
		throw new ProportionError(
			"INVALID_CANVAS",
			"proportion canvas must be 1024x1536",
		);
	const shaped = ObservationLandmarksSchema.safeParse(canvased.data);
	if (!shaped.success)
		throw new ProportionError(
			"INVALID_LANDMARKS",
			"complete in-canvas semantic landmarks required",
		);
	const parsed = ProportionObservationSchema.parse(shaped.data);
	const p = parsed.landmarks;
	if (p.torsoLeft[1] !== p.torsoRight[1])
		throw new ProportionError(
			"TORSO_LEVEL_MISMATCH",
			"torso cross-section landmarks must share the same level",
		);
	if (
		p.faceTop[1] < p.crown[1] ||
		p.faceTop[1] >= p.chin[1] ||
		p.faceLeft[0] < p.headLeft[0] ||
		p.faceRight[0] > p.headRight[0]
	)
		throw new ProportionError(
			"FACE_OUTSIDE_HEAD",
			"face landmarks must lie inside the measured head",
		);
	if (
		[p.leftPupil, p.rightPupil].some(
			(point) =>
				point[0] < p.faceLeft[0] ||
				point[0] > p.faceRight[0] ||
				point[1] < p.faceTop[1] ||
				point[1] > p.chin[1],
		)
	)
		throw new ProportionError(
			"PUPILS_OUTSIDE_FACE",
			"pupil landmarks must lie inside the measured face",
		);
	const metrics: ProportionMetrics = {
		headWidth: p.headRight[0] - p.headLeft[0],
		headHeight: p.chin[1] - p.crown[1],
		faceWidth: p.faceRight[0] - p.faceLeft[0],
		faceHeight: p.chin[1] - p.faceTop[1],
		eyeY: (p.leftPupil[1] + p.rightPupil[1]) / 2,
		headCenterX: (p.headLeft[0] + p.headRight[0]) / 2,
		crownY: p.crown[1],
		shoulderWidth: p.rightShoulder[0] - p.leftShoulder[0],
		torsoWidth: p.torsoRight[0] - p.torsoLeft[0],
	};
	if (SPAN_METRIC_NAMES.some((name) => metrics[name] <= 0))
		throw new ProportionError(
			"NONPOSITIVE_LANDMARK_SPANS",
			"landmark spans must be positive",
		);
	return {
		metrics,
		identity: {
			imageSHA: parsed.imageSHA,
			measurementEvidenceSHA: parsed.measurementEvidenceSHA,
			bodyType: parsed.bodyType,
		},
	};
}

export function measureProportions(observation: unknown): ProportionMetrics {
	return measureObservation(observation).metrics;
}

export function createProportionProfile(input: {
	readonly commonReference: ProportionObservation;
	readonly bodyReference: ProportionObservation;
	readonly bodyType: string;
	readonly tolerance: ProportionTolerance;
}): ProportionProfile {
	const { commonReference, bodyReference, bodyType, tolerance } = input;
	const common = measureProportions(commonReference);
	const body = measureProportions(bodyReference);
	if (typeof bodyType !== "string" || !bodyType.trim())
		throw new ProportionError(
			"BODY_TYPE_REQUIRED",
			"authored body type identifier required",
		);
	if (
		!tolerance ||
		!validSHA(tolerance.evidenceSHA) ||
		!Number.isFinite(tolerance.pixels) ||
		tolerance.pixels < 0 ||
		!Number.isFinite(tolerance.ratio) ||
		tolerance.ratio < 0
	)
		throw new ProportionError(
			"INVALID_TOLERANCES",
			"source-bound explicit proportion tolerances required",
		);
	const canvas: ProportionCanvas = [CANVAS[0], CANVAS[1]];
	const profile: Omit<ProportionProfile, "profileSHA"> = {
		schema: PROPORTION_PROFILE_SCHEMA,
		canvas,
		bodyType,
		commonSourceSHA: commonReference.imageSHA,
		commonMeasurementSHA: commonReference.measurementEvidenceSHA,
		bodySourceSHA: bodyReference.imageSHA,
		bodyMeasurementSHA: bodyReference.measurementEvidenceSHA,
		targets: {
			headWidth: common.headWidth,
			headHeight: common.headHeight,
			faceWidth: common.faceWidth,
			faceHeight: common.faceHeight,
			eyeY: common.eyeY,
			headCenterX: common.headCenterX,
			crownY: common.crownY,
		},
		ratios: {
			shoulderToHead: body.shoulderWidth / body.headWidth,
			torsoToHead: body.torsoWidth / body.headWidth,
		},
		tolerance: { ...tolerance },
		semantics: PROPORTION_SEMANTICS,
	};
	return { ...profile, profileSHA: hashProfile(profile) };
}

export function validateProportionProfile(profile: unknown): ProportionProfile {
	const shell = ProfileShellSchema.safeParse(profile);
	if (!shell.success)
		throw new ProportionError(
			"PROFILE_REQUIRED",
			"proportion profile required",
		);
	const { profileSHA, ...payload } = shell.data;
	if (!validSHA(profileSHA) || hashProfile(payload) !== profileSHA)
		throw new ProportionError(
			"PROFILE_HASH_MISMATCH",
			"proportion profile hash mismatch",
		);
	const sourced = ProfileSourceSchema.safeParse(shell.data);
	if (!sourced.success)
		throw new ProportionError(
			"INVALID_SOURCE_PROFILE",
			"invalid source-bound proportion profile",
		);
	const measured = ProfileTargetsSchema.safeParse(sourced.data);
	if (!measured.success)
		throw new ProportionError("INVALID_TARGETS", "invalid proportion targets");
	const toleranced = ProfileToleranceSchema.safeParse(measured.data);
	if (!toleranced.success)
		throw new ProportionError(
			"INVALID_PROFILE_TOLERANCES",
			"invalid proportion tolerances",
		);
	return ProportionProfileSchema.parse(toleranced.data);
}

export function verifyProportions(
	profile: unknown,
	observation: unknown,
): ProportionVerdict {
	const validated = validateProportionProfile(profile);
	const { metrics: measured, identity } = measureObservation(observation);
	const failures: string[] = [];
	if (identity.bodyType !== validated.bodyType) failures.push("bodyType");
	for (const name of TARGET_METRIC_NAMES) {
		if (
			Math.abs(measured[name] - validated.targets[name]) >
			validated.tolerance.pixels
		)
			failures.push(name);
	}
	const ratios: ProportionRatios = {
		shoulderToHead: measured.shoulderWidth / measured.headWidth,
		torsoToHead: measured.torsoWidth / measured.headWidth,
	};
	for (const name of RATIO_NAMES) {
		if (
			Math.abs(ratios[name] - validated.ratios[name]) >
			validated.tolerance.ratio
		)
			failures.push(name);
	}
	return {
		schema: PROPORTION_VERDICT_SCHEMA,
		imageSHA: identity.imageSHA,
		measurementEvidenceSHA: identity.measurementEvidenceSHA,
		profileSHA: validated.profileSHA,
		bodyType: validated.bodyType,
		measured,
		ratios,
		failures,
		pass: failures.length === 0,
		ownerApprovalImplied: false,
	};
}

export function validateSharedProportionProfiles(
	profiles: unknown,
): SharedProportionProfiles {
	const listed = z.array(z.unknown()).safeParse(profiles);
	if (!listed.success || listed.data.length === 0)
		throw new ProportionError(
			"BATCH_PROFILES_REQUIRED",
			"batch proportion profiles required",
		);
	const bodies = new Map<string, string>();
	let commonSHA: string | undefined;
	for (const profile of listed.data) {
		const validated = validateProportionProfile(profile);
		const common = hashProfile({
			canvas: validated.canvas,
			sourceSHA: validated.commonSourceSHA,
			measurementSHA: validated.commonMeasurementSHA,
			targets: validated.targets,
			pixels: validated.tolerance.pixels,
			evidenceSHA: validated.tolerance.evidenceSHA,
		});
		if (commonSHA !== undefined && commonSHA !== common)
			throw new ProportionError(
				"BATCH_COMMON_STANDARD_MISMATCH",
				"batch profiles must share one head and face standard",
			);
		commonSHA = common;
		const body = hashProfile({
			sourceSHA: validated.bodySourceSHA,
			measurementSHA: validated.bodyMeasurementSHA,
			ratios: validated.ratios,
			ratioTolerance: validated.tolerance.ratio,
		});
		const existing = bodies.get(validated.bodyType);
		if (existing !== undefined && existing !== body)
			throw new ProportionError(
				"BATCH_BODY_STANDARD_MISMATCH",
				"same body type must use one proportional standard",
			);
		bodies.set(validated.bodyType, body);
	}
	if (commonSHA === undefined)
		throw new ProportionError(
			"BATCH_PROFILES_REQUIRED",
			"batch proportion profiles required",
		);
	return { commonSHA, bodyTypes: [...bodies.keys()] };
}

export function proportionInstruction(profile: unknown): string {
	const validated = validateProportionProfile(profile);
	return `Use the fixed ${CANVAS[0]}x${CANVAS[1]} canvas. Common head/face measurements in source pixels: ${canonicalJSON(validated.targets)}. Body type ${validated.bodyType}: shoulder joint span / head width = ${validated.ratios.shoulderToHead}; visible torso cross-section span / head width = ${validated.ratios.torsoToHead}. Pixel tolerance ${validated.tolerance.pixels}; ratio tolerance ${validated.tolerance.ratio}. Preserve authored identity and body type. Never stretch width and height independently or use garment edges as shoulder joints. These measurements require actual output verification, not provider success.`;
}

const PointSchema = z.tuple([
	z
		.number()
		.min(0)
		.max(CANVAS[0] - 1),
	z
		.number()
		.min(0)
		.max(CANVAS[1] - 1),
]);
const ArtifactLandmarksSchema = z.looseObject({
	crown: PointSchema,
	chin: PointSchema,
	headLeft: PointSchema,
	headRight: PointSchema,
	faceTop: PointSchema,
	faceLeft: PointSchema,
	faceRight: PointSchema,
	leftPupil: PointSchema,
	rightPupil: PointSchema,
	leftShoulder: PointSchema,
	rightShoulder: PointSchema,
	torsoLeft: PointSchema,
	torsoRight: PointSchema,
});
const ArtifactMeasurementSchema = z.looseObject({
	imageSHA: ShaHex,
	actualImageMeasured: z.literal(true),
	canvas: CanvasSchema,
	bodyType: z.unknown().optional(),
	landmarks: ArtifactLandmarksSchema,
});

function parseMeasurementBytes(bytes: Uint8Array) {
	return ArtifactMeasurementSchema.parse(decodeMeasurementValue(bytes));
}

function observationFromArtifacts(
	imageBytes: Uint8Array,
	measurementBytes: Uint8Array,
): ProportionObservation {
	const imageSHA = createHash("sha256").update(imageBytes).digest("hex");
	const measurementEvidenceSHA = createHash("sha256")
		.update(measurementBytes)
		.digest("hex");
	const image = decodePng(imageBytes);
	const measurement = parseMeasurementBytes(measurementBytes);
	if (measurement.imageSHA !== imageSHA)
		throw new ProportionError(
			"SOURCE_BINDING_REQUIRED",
			"measurement image SHA mismatch",
		);
	if (
		image.width !== CANVAS[0] ||
		image.height !== CANVAS[1] ||
		measurement.canvas[0] !== image.width ||
		measurement.canvas[1] !== image.height
	)
		throw new ProportionError(
			"INVALID_CANVAS",
			"proportion artifact canvas mismatch",
		);
	return { ...measurement, imageSHA, measurementEvidenceSHA };
}

export function verifyProportionArtifacts(input: {
	readonly profile: unknown;
	readonly imageBytes: Uint8Array;
	readonly measurementBytes: Uint8Array;
}): ProportionVerdict {
	const observation = observationFromArtifacts(
		input.imageBytes,
		input.measurementBytes,
	);
	return verifyProportions(input.profile, observation);
}

export function createProportionProfileFromArtifacts(input: {
	readonly commonMeasurementBytes: Uint8Array;
	readonly bodyMeasurementBytes: Uint8Array;
	readonly commonImageBytes: Uint8Array;
	readonly bodyImageBytes: Uint8Array;
	readonly bodyType: string;
	readonly tolerance: ProportionTolerance;
}): ProportionProfile {
	return createProportionProfile({
		commonReference: observationFromArtifacts(
			input.commonImageBytes,
			input.commonMeasurementBytes,
		),
		bodyReference: observationFromArtifacts(
			input.bodyImageBytes,
			input.bodyMeasurementBytes,
		),
		bodyType: input.bodyType,
		tolerance: input.tolerance,
	});
}
