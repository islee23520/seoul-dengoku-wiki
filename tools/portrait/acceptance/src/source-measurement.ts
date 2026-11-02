import { createHash } from "node:crypto";
import { z } from "zod";
import { decodePng, PngError } from "./png.js";
import type { LandmarkName } from "./proportion.js";

export const SOURCE_MEASUREMENT_SCHEMA = "portrait-source-measurement.v1";

export type SourceLandmark =
	| Readonly<{
			status: "draft" | "confirmed";
			point: readonly [number, number];
			uncertaintyPixels: number;
	  }>
	| Readonly<{ status: "unmeasured"; point: null }>;

export type SourceMeasurement = Readonly<{
	schema: typeof SOURCE_MEASUREMENT_SCHEMA;
	imageSHA: string;
	canvas: readonly [number, number];
	points: Readonly<Record<LandmarkName, SourceLandmark>>;
}>;

export type SourceDraftInput = Readonly<{
	imageBytes: Uint8Array;
	measurementBytes: Uint8Array;
	expectedImageSHA: string;
	expectedMeasurementSHA: string;
}>;

export type NormalizedSourceLandmark =
	| Readonly<{
			status: "draft" | "confirmed";
			point: readonly [string, string];
			uncertaintyPixels: number;
	  }>
	| Readonly<{ status: "unmeasured"; point: null }>;

export type SourceDraftComparison = Readonly<{
	imageSHA: string;
	measurementSHA: string;
	sourceCanvas: readonly [number, number];
	normalizedLandmarks: Readonly<Record<LandmarkName, NormalizedSourceLandmark>>;
	completeConfirmed: boolean;
	ownerApprovalImplied: false;
}>;

export type SourceMeasurementErrorCode =
	| "INVALID_INPUT"
	| "SHA_MISMATCH"
	| "INVALID_JSON"
	| "INVALID_MEASUREMENT"
	| "INVALID_IMAGE"
	| "CANVAS_MISMATCH"
	| "POINT_OUT_OF_BOUNDS";

export class SourceMeasurementError extends Error {
	readonly code: SourceMeasurementErrorCode;

	constructor(code: SourceMeasurementErrorCode, message: string) {
		super(message);
		this.name = "SourceMeasurementError";
		this.code = code;
	}
}

const ShaHex = z.string().regex(/^[a-f0-9]{64}$/);
const InputSchema = z.strictObject({
	imageBytes: z.instanceof(Uint8Array),
	measurementBytes: z.instanceof(Uint8Array),
	expectedImageSHA: ShaHex,
	expectedMeasurementSHA: ShaHex,
});
const LandmarkSchema = z.union([
	z.strictObject({
		status: z.enum(["draft", "confirmed"]),
		point: z.tuple([
			z.number().int().nonnegative(),
			z.number().int().nonnegative(),
		]),
		uncertaintyPixels: z.number().nonnegative(),
	}),
	z.strictObject({ status: z.literal("unmeasured"), point: z.null() }),
]);
const MeasurementSchema = z.strictObject({
	schema: z.literal(SOURCE_MEASUREMENT_SCHEMA),
	imageSHA: ShaHex,
	canvas: z.tuple([z.number().int().positive(), z.number().int().positive()]),
	points: z.strictObject({
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
});

function parseMeasurement(bytes: Uint8Array): SourceMeasurement {
	let value: unknown;
	try {
		const text = new TextDecoder("utf-8", {
			fatal: true,
			ignoreBOM: true,
		}).decode(bytes);
		value = JSON.parse(text);
		// JSON.parse checks the grammar first; tokens preserve object scope and
		// decode escaped member names without mistaking string contents for keys.
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
				const key: unknown = JSON.parse(token);
				const fields = stack.at(-1);
				if (typeof key === "string" && fields) {
					if (fields.has(key)) throw new SyntaxError("duplicate JSON member");
					fields.add(key);
				}
			}
		}
	} catch (error) {
		if (!(error instanceof SyntaxError || error instanceof TypeError))
			throw error;
		throw new SourceMeasurementError(
			"INVALID_JSON",
			"invalid source measurement JSON",
		);
	}
	const parsed = MeasurementSchema.safeParse(value);
	if (!parsed.success)
		throw new SourceMeasurementError(
			"INVALID_MEASUREMENT",
			"invalid source measurement shape",
		);
	return parsed.data;
}

export function sourceDraftComparison(input: unknown): SourceDraftComparison {
	const parsed = InputSchema.safeParse(input);
	if (!parsed.success)
		throw new SourceMeasurementError(
			"INVALID_INPUT",
			"source bytes and independent SHA pins required",
		);
	const {
		imageBytes,
		measurementBytes,
		expectedImageSHA,
		expectedMeasurementSHA,
	} = parsed.data;
	const imageSHA = createHash("sha256").update(imageBytes).digest("hex");
	const measurementSHA = createHash("sha256")
		.update(measurementBytes)
		.digest("hex");
	if (
		imageSHA !== expectedImageSHA ||
		measurementSHA !== expectedMeasurementSHA
	)
		throw new SourceMeasurementError(
			"SHA_MISMATCH",
			"source byte SHA mismatch",
		);
	const measurement = parseMeasurement(measurementBytes);
	if (measurement.imageSHA !== imageSHA)
		throw new SourceMeasurementError(
			"SHA_MISMATCH",
			"measurement image SHA mismatch",
		);
	let image: ReturnType<typeof decodePng>;
	try {
		image = decodePng(imageBytes);
	} catch (error) {
		if (!(error instanceof PngError)) throw error;
		throw new SourceMeasurementError("INVALID_IMAGE", "invalid source PNG");
	}
	const [width, height] = measurement.canvas;
	if (image.width !== width || image.height !== height)
		throw new SourceMeasurementError(
			"CANVAS_MISMATCH",
			"measurement canvas differs from source PNG",
		);
	const normalize = (landmark: SourceLandmark): NormalizedSourceLandmark => {
		if (landmark.status === "unmeasured")
			return { status: "unmeasured", point: null };
		const [x, y] = landmark.point;
		if (x >= width || y >= height)
			throw new SourceMeasurementError(
				"POINT_OUT_OF_BOUNDS",
				"source point lies outside canvas",
			);
		return {
			status: landmark.status,
			point: [`${x}/${width}`, `${y}/${height}`],
			uncertaintyPixels: landmark.uncertaintyPixels,
		};
	};
	const p = measurement.points;
	return {
		imageSHA,
		measurementSHA,
		sourceCanvas: measurement.canvas,
		normalizedLandmarks: {
			crown: normalize(p.crown),
			chin: normalize(p.chin),
			headLeft: normalize(p.headLeft),
			headRight: normalize(p.headRight),
			faceTop: normalize(p.faceTop),
			faceLeft: normalize(p.faceLeft),
			faceRight: normalize(p.faceRight),
			leftPupil: normalize(p.leftPupil),
			rightPupil: normalize(p.rightPupil),
			leftShoulder: normalize(p.leftShoulder),
			rightShoulder: normalize(p.rightShoulder),
			torsoLeft: normalize(p.torsoLeft),
			torsoRight: normalize(p.torsoRight),
		},
		completeConfirmed: Object.values(p).every(
			(point) => point.status === "confirmed",
		),
		ownerApprovalImplied: false,
	};
}
