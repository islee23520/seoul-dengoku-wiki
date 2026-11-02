import { createHash } from "node:crypto";
import { z } from "zod";
import { decodePng, PngError } from "./png.js";
import type { LandmarkName } from "./proportion.js";

export const OBSERVABLE_OBSERVATION_SCHEMA =
	"portrait-observable-observation.v1";
export const OBSERVABLE_REVIEW_SCHEMA = "portrait-observable-review.v1";

type Pair<T> = readonly [T, T];
type Landmark = Readonly<{
	status: "draft" | "observed" | "unmeasured";
	point: Pair<number> | null;
	uncertaintyPixels: number | null;
	pixelBounds: Pair<Pair<number>> | null;
}>;
type Side = Readonly<{
	status: "draft" | "observed" | "clipped_lower_bound" | "unmeasured";
	xInterval: Pair<number> | null;
	clipped: boolean | null;
}>;
type Equipment =
	| "no_separate_outer_contribution_observed"
	| "visible_internal_to_garment_envelope"
	| "garment_decorations_included_boundary_occluded";
type Origins = Readonly<{
	headCandidateSHA: string;
	headReviewSHA: string;
	bodyDraftSHA: string;
	headDefinitionReviewSHA: string;
	bodyDefinitionSHA: string;
	bodyIndependentReviewSHA: string;
}>;
type Definitions = Readonly<{
	head: "visible-connected-main-head-mass.v3";
	body: "visible-clothed-body-bands.v1";
}>;
export type ObservableReviewInput = Readonly<{
	imageBytes: Uint8Array;
	observationBytes: Uint8Array;
	expectedImageSHA: string;
	expectedObservationSHA: string;
	expectedCharacterId: string;
}>;
export type ObservableObservation = Readonly<{
	schema: typeof OBSERVABLE_OBSERVATION_SCHEMA;
	characterId: string;
	imageSHA: string;
	canvas: Pair<number>;
	definitions: Definitions;
	origins: Origins;
	landmarks: Readonly<Record<LandmarkName, Landmark>>;
	bodyBands: readonly Readonly<{
		k: 1 | 2 | 3;
		sourcePixelY: number | null;
		left: Side;
		right: Side;
		equipment: Equipment;
	}>[];
}>;
type Metric = Readonly<{
	status: "draft" | "observed" | "unmeasured";
	valuePixels: number | null;
	pixelInterval: Pair<number> | null;
	normalized: string | null;
	normalizedInterval: Pair<string> | null;
}>;
export type ObservableReviewComparison = Readonly<{
	schema: typeof OBSERVABLE_REVIEW_SCHEMA;
	characterId: string;
	imageSHA: string;
	observationSHA: string;
	sourceCanvas: Pair<number>;
	definitions: Definitions;
	origins: Origins;
	integrityAssessment: "PASS";
	evidenceAuthority: "UNVERIFIED_DRAFT_ASSERTIONS";
	evidenceAuthorityAccepted: false;
	reviewAcceptance: "NOT_EVALUATED";
	productionAdvancement: "HOLD";
	completeConfirmed: false;
	ownerApprovalImplied: false;
	releaseApprovalImplied: false;
	profileApprovalImplied: false;
	anatomical: false;
	normalizedLandmarks: Readonly<
		Record<
			LandmarkName,
			Landmark &
				Readonly<{
					normalizedPoint: Pair<string> | null;
					normalizedBounds: Pair<Pair<string>> | null;
				}>
		>
	>;
	headMetrics: Readonly<
		Record<
			| "headMassWidth"
			| "headMassToChinHeight"
			| "pupilMidpointY"
			| "headMassCenterX",
			Metric
		>
	>;
	bodyBands: readonly Readonly<{
		k: 1 | 2 | 3;
		fraction: string | null;
		exactY: string | null;
		sourcePixelY: number | null;
		normalizedY: string | null;
		conditionalChinYUncertaintyPixels: number | null;
		conditionalExactYBounds: Pair<string> | null;
		left: Side & Readonly<{ normalizedInterval: Pair<string> | null }>;
		right: Side & Readonly<{ normalizedInterval: Pair<string> | null }>;
		width: Readonly<{
			status: Side["status"];
			pointDistanceInterval: Pair<number> | null;
			normalizedInterval: Pair<string> | null;
			fullWidthCertified: false;
			occupiedPixelCount: null;
		}>;
		equipment: Equipment;
	}>[];
	topBodyShoulderMaximum: Readonly<{ status: "unmeasured"; value: null }>;
}>;
export type ObservableReviewErrorCode =
	| "INVALID_INPUT"
	| "SHA_MISMATCH"
	| "INVALID_JSON"
	| "INVALID_OBSERVATION"
	| "IDENTITY_MISMATCH"
	| "INVALID_IMAGE"
	| "CANVAS_MISMATCH"
	| "GEOMETRY_OUT_OF_BOUNDS"
	| "INVALID_INTERVAL"
	| "INVALID_BAND_ROW"
	| "INCONSISTENT_CLIPPING";
export class ObservableReviewError extends Error {
	readonly code: ObservableReviewErrorCode;
	constructor(code: ObservableReviewErrorCode, message: string) {
		super(message);
		this.name = "ObservableReviewError";
		this.code = code;
	}
}

const ShaHex = z.string().regex(/^[a-f0-9]{64}$/);
const Identity = z.string().refine((value) => /\S/.test(value));
const Coordinate = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const Interval = z.tuple([Coordinate, Coordinate]);
const LandmarkSchema = z.union([
	z.strictObject({
		status: z.enum(["draft", "observed"]),
		point: Interval,
		uncertaintyPixels: z.number().nonnegative(),
		pixelBounds: z.tuple([Interval, Interval]),
	}),
	z.strictObject({
		status: z.literal("unmeasured"),
		point: z.null(),
		uncertaintyPixels: z.null(),
		pixelBounds: z.null(),
	}),
]);
const SideSchema = z.union([
	z.strictObject({
		status: z.enum(["draft", "observed", "clipped_lower_bound"]),
		xInterval: Interval,
		clipped: z.boolean(),
	}),
	z.strictObject({
		status: z.literal("unmeasured"),
		xInterval: z.null(),
		clipped: z.null(),
	}),
]);
const EquipmentSchema = z.enum([
	"no_separate_outer_contribution_observed",
	"visible_internal_to_garment_envelope",
	"garment_decorations_included_boundary_occluded",
]);
const bandSchema = <K extends 1 | 2 | 3>(k: K) =>
	z.strictObject({
		k: z.literal(k),
		sourcePixelY: Coordinate.nullable(),
		left: SideSchema,
		right: SideSchema,
		equipment: EquipmentSchema,
	});
const ObservationSchema = z.strictObject({
	schema: z.literal(OBSERVABLE_OBSERVATION_SCHEMA),
	characterId: Identity,
	imageSHA: ShaHex,
	canvas: z.tuple([Coordinate.min(1), Coordinate.min(1)]),
	definitions: z.strictObject({
		head: z.literal("visible-connected-main-head-mass.v3"),
		body: z.literal("visible-clothed-body-bands.v1"),
	}),
	origins: z.strictObject({
		headCandidateSHA: ShaHex,
		headReviewSHA: ShaHex,
		bodyDraftSHA: ShaHex,
		headDefinitionReviewSHA: ShaHex,
		bodyDefinitionSHA: ShaHex,
		bodyIndependentReviewSHA: ShaHex,
	}),
	landmarks: z.strictObject({
		crown: LandmarkSchema,
		chin: LandmarkSchema,
		headLeft: LandmarkSchema,
		headRight: LandmarkSchema,
		faceTop: LandmarkSchema,
		faceLeft: LandmarkSchema,
		faceRight: LandmarkSchema,
		leftPupil: LandmarkSchema,
		rightPupil: LandmarkSchema,
		leftShoulder: LandmarkSchema,
		rightShoulder: LandmarkSchema,
		torsoLeft: LandmarkSchema,
		torsoRight: LandmarkSchema,
	}),
	bodyBands: z.tuple([bandSchema(1), bandSchema(2), bandSchema(3)]),
});
const InputSchema = z.strictObject({
	imageBytes: z.instanceof(Uint8Array),
	observationBytes: z.instanceof(Uint8Array),
	expectedImageSHA: ShaHex,
	expectedObservationSHA: ShaHex,
	expectedCharacterId: Identity,
});
function fail(code: ObservableReviewErrorCode): never {
	throw new ObservableReviewError(code, code);
}
function parseObservation(bytes: Uint8Array) {
	let value: unknown;
	try {
		const text = new TextDecoder("utf-8", {
			fatal: true,
			ignoreBOM: true,
		}).decode(bytes);
		value = JSON.parse(text);
		const tokens =
			text.match(
				/"(?:\\.|[^"\\])*"|[{}[\]:,]|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/g,
			) ?? [];
		const stack: (Set<string> | null)[] = [];
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			if (token === "{") stack.push(new Set());
			else if (token === "[") stack.push(null);
			else if (token === "}" || token === "]") stack.pop();
			else if (token?.startsWith('"') && tokens[i + 1] === ":") {
				const key: unknown = JSON.parse(token),
					fields = stack.at(-1);
				if (typeof key === "string" && fields) {
					if (fields.has(key)) throw new SyntaxError("duplicate JSON member");
					fields.add(key);
				}
			}
		}
	} catch (error) {
		if (!(error instanceof SyntaxError || error instanceof TypeError))
			throw error;
		fail("INVALID_JSON");
	}
	const parsed = ObservationSchema.safeParse(value);
	if (!parsed.success) fail("INVALID_OBSERVATION");
	return parsed.data;
}
export function observableReviewComparison(
	input: unknown,
): ObservableReviewComparison {
	const envelope = InputSchema.safeParse(input);
	if (!envelope.success) fail("INVALID_INPUT");
	const {
		imageBytes,
		observationBytes,
		expectedImageSHA,
		expectedObservationSHA,
		expectedCharacterId,
	} = envelope.data;
	const imageSHA = createHash("sha256").update(imageBytes).digest("hex"),
		observationSHA = createHash("sha256")
			.update(observationBytes)
			.digest("hex");
	if (
		imageSHA !== expectedImageSHA ||
		observationSHA !== expectedObservationSHA
	)
		fail("SHA_MISMATCH");
	const doc = parseObservation(observationBytes);
	if (doc.imageSHA !== imageSHA) fail("SHA_MISMATCH");
	if (doc.characterId !== expectedCharacterId) fail("IDENTITY_MISMATCH");
	let image: ReturnType<typeof decodePng>;
	try {
		image = decodePng(imageBytes);
	} catch (error) {
		if (!(error instanceof PngError)) throw error;
		fail("INVALID_IMAGE");
	}
	const W = image.width,
		H = image.height;
	if (doc.canvas[0] !== W || doc.canvas[1] !== H) fail("CANVAS_MISMATCH");
	const p = doc.landmarks;
	// Bounds precede interval checks, including body coordinates.
	for (const point of Object.values(p)) {
		if (point.status === "unmeasured") continue;
		for (let axis = 0; axis < 2; axis++) {
			const limit = axis === 0 ? W : H;
			const seed = point.point[axis],
				bounds = point.pixelBounds[axis];
			if (seed === undefined || !bounds) fail("INVALID_OBSERVATION");
			if (seed >= limit || bounds.some((n) => n >= limit))
				fail("GEOMETRY_OUT_OF_BOUNDS");
		}
	}
	for (const band of doc.bodyBands) {
		if (band.sourcePixelY !== null && band.sourcePixelY >= H)
			fail("GEOMETRY_OUT_OF_BOUNDS");
		for (const side of [band.left, band.right])
			if (side.xInterval?.some((n) => n >= W)) fail("GEOMETRY_OUT_OF_BOUNDS");
	}
	for (const point of Object.values(p)) {
		if (point.status === "unmeasured") continue;
		if (point.uncertaintyPixels > Math.max(W, H)) fail("INVALID_INTERVAL");
		for (let axis = 0; axis < 2; axis++) {
			const seed = point.point[axis],
				bounds = point.pixelBounds[axis];
			if (seed === undefined || !bounds) fail("INVALID_OBSERVATION");
			const [min, max] = bounds;
			if (
				min > max ||
				seed < min ||
				seed > max ||
				Math.max(seed - min, max - seed) > point.uncertaintyPixels
			)
				fail("INVALID_INTERVAL");
		}
	}
	for (const [a, b, axis] of [
		[p.headLeft, p.headRight, 0],
		[p.crown, p.chin, 1],
	] as const) {
		if (
			a.status !== "unmeasured" &&
			b.status !== "unmeasured" &&
			b.pixelBounds[axis][0] - a.pixelBounds[axis][1] <= 0
		)
			fail("INVALID_INTERVAL");
	}
	const chin = p.chin;
	for (const band of doc.bodyBands) {
		if (chin.status === "unmeasured") {
			if (
				band.sourcePixelY !== null ||
				band.left.status !== "unmeasured" ||
				band.right.status !== "unmeasured"
			)
				fail("INVALID_BAND_ROW");
		} else {
			const n = (4 - band.k) * chin.point[1] + band.k * (H - 1);
			if (band.sourcePixelY !== Math.floor((n + 2) / 4))
				fail("INVALID_BAND_ROW");
		}
	}
	for (const band of doc.bodyBands) {
		for (const [side, edge] of [
			[band.left, 0],
			[band.right, W - 1],
		] as const) {
			if (side.status === "unmeasured") continue;
			const [min, max] = side.xInterval;
			if (min > max) fail("INVALID_INTERVAL");
			if (side.status === "clipped_lower_bound") {
				if (!side.clipped || min !== edge || max !== edge)
					fail("INCONSISTENT_CLIPPING");
			} else if (side.clipped || min === 0 || max === W - 1)
				fail("INCONSISTENT_CLIPPING");
		}
		if (
			band.left.status !== "unmeasured" &&
			band.right.status !== "unmeasured" &&
			band.left.xInterval[1] >= band.right.xInterval[0]
		)
			fail("INVALID_INTERVAL");
	}
	const normalizedLandmarks = {} as Record<
		LandmarkName,
		ObservableReviewComparison["normalizedLandmarks"][LandmarkName]
	>;
	for (const name of Object.keys(p) as LandmarkName[]) {
		const point = p[name];
		normalizedLandmarks[name] = {
			...point,
			normalizedPoint: point.point
				? [`${point.point[0]}/${W}`, `${point.point[1]}/${H}`]
				: null,
			normalizedBounds: point.pixelBounds
				? [
						[
							`${point.pixelBounds[0][0]}/${W}`,
							`${point.pixelBounds[0][1]}/${W}`,
						],
						[
							`${point.pixelBounds[1][0]}/${H}`,
							`${point.pixelBounds[1][1]}/${H}`,
						],
					]
				: null,
		};
	}
	const metric = (
		a: typeof p.crown,
		b: typeof p.chin,
		axis: 0 | 1,
		dimension: number,
		center: boolean,
	): Metric => {
		if (a.status === "unmeasured" || b.status === "unmeasured")
			return {
				status: "unmeasured",
				valuePixels: null,
				pixelInterval: null,
				normalized: null,
				normalizedInterval: null,
			};
		const divisor = center ? 2 : 1,
			n = center
				? a.point[axis] + b.point[axis]
				: b.point[axis] - a.point[axis],
			min = center
				? a.pixelBounds[axis][0] + b.pixelBounds[axis][0]
				: b.pixelBounds[axis][0] - a.pixelBounds[axis][1],
			max = center
				? a.pixelBounds[axis][1] + b.pixelBounds[axis][1]
				: b.pixelBounds[axis][1] - a.pixelBounds[axis][0];
		return {
			status:
				a.status === "draft" || b.status === "draft" ? "draft" : "observed",
			valuePixels: n / divisor,
			pixelInterval: [min / divisor, max / divisor],
			normalized: `${n}/${dimension * divisor}`,
			normalizedInterval: [
				`${min}/${dimension * divisor}`,
				`${max}/${dimension * divisor}`,
			],
		};
	};
	const bodyBands: ObservableReviewComparison["bodyBands"] = doc.bodyBands.map(
		(band) => {
			const { k, left, right } = band;
			const normalizeSide = (side: typeof left) => ({
				...side,
				normalizedInterval: side.xInterval
					? ([
							`${side.xInterval[0]}/${W}`,
							`${side.xInterval[1]}/${W}`,
						] as const)
					: null,
			});
			let width: ObservableReviewComparison["bodyBands"][number]["width"] = {
				status: "unmeasured",
				pointDistanceInterval: null,
				normalizedInterval: null,
				fullWidthCertified: false,
				occupiedPixelCount: null,
			};
			if (left.status !== "unmeasured" && right.status !== "unmeasured") {
				const min = right.xInterval[0] - left.xInterval[1],
					max = right.xInterval[1] - left.xInterval[0];
				width = {
					status:
						left.clipped || right.clipped
							? "clipped_lower_bound"
							: left.status === "draft" || right.status === "draft"
								? "draft"
								: "observed",
					pointDistanceInterval: [min, max],
					normalizedInterval: [`${min}/${W}`, `${max}/${W}`],
					fullWidthCertified: false,
					occupiedPixelCount: null,
				};
			}
			const measured = chin.status !== "unmeasured";
			return {
				k,
				fraction: measured ? `${k}/4` : null,
				exactY: measured ? `${(4 - k) * chin.point[1] + k * (H - 1)}/4` : null,
				sourcePixelY: band.sourcePixelY,
				normalizedY: measured ? `${band.sourcePixelY}/${H}` : null,
				conditionalChinYUncertaintyPixels: measured
					? ((4 - k) * chin.uncertaintyPixels) / 4
					: null,
				conditionalExactYBounds: measured
					? [
							`${(4 - k) * chin.pixelBounds[1][0] + k * (H - 1)}/4`,
							`${(4 - k) * chin.pixelBounds[1][1] + k * (H - 1)}/4`,
						]
					: null,
				left: normalizeSide(left),
				right: normalizeSide(right),
				width,
				equipment: band.equipment,
			};
		},
	);
	return {
		schema: OBSERVABLE_REVIEW_SCHEMA,
		characterId: doc.characterId,
		imageSHA,
		observationSHA,
		sourceCanvas: [W, H],
		definitions: doc.definitions,
		origins: doc.origins,
		integrityAssessment: "PASS",
		evidenceAuthority: "UNVERIFIED_DRAFT_ASSERTIONS",
		evidenceAuthorityAccepted: false,
		reviewAcceptance: "NOT_EVALUATED",
		productionAdvancement: "HOLD",
		completeConfirmed: false,
		ownerApprovalImplied: false,
		releaseApprovalImplied: false,
		profileApprovalImplied: false,
		anatomical: false,
		normalizedLandmarks,
		headMetrics: {
			headMassWidth: metric(p.headLeft, p.headRight, 0, W, false),
			headMassToChinHeight: metric(p.crown, p.chin, 1, H, false),
			pupilMidpointY: metric(p.leftPupil, p.rightPupil, 1, H, true),
			headMassCenterX: metric(p.headLeft, p.headRight, 0, W, true),
		},
		bodyBands,
		topBodyShoulderMaximum: { status: "unmeasured", value: null },
	};
}
