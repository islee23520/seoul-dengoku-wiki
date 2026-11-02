import { createHash } from "node:crypto";
import { z } from "zod";
import { PORTRAIT_ACCEPTANCE_CRITERIA as criteria } from "./criteria.js";
import { decodePng, PngError } from "./png.js";
import { ProportionError } from "./proportion.js";
import { verifyProportionArtifacts } from "./proportion-artifacts.js";

export type PortraitAcceptanceInput = Readonly<{
	characterId: string;
	requestId: string;
	imageBytes: Uint8Array;
	review: unknown;
	profile: unknown;
	measurementBytes: Uint8Array | null;
	evidence: Iterable<Uint8Array>;
	expectedPositionReference?: unknown;
}>;
export type PortraitAcceptanceResult = Readonly<{
	schema: string;
	characterId: string;
	requestId: string;
	imageSHA: string;
	pass: boolean;
	failures: readonly string[];
	coreFraction: number;
	nonopaqueForegroundPixels: number;
	strictOpaqueForegroundPass: boolean;
	proportions: ReturnType<typeof verifyProportionArtifacts> | null;
	positionReference: Readonly<{
		referenceVersion: string;
		referenceSHA: string;
		ruleSHA: string;
	}> | null;
	positionVerification: string;
	metricOwnership: Readonly<{
		proportionProfile: Readonly<{
			profileSHA: string | null;
			metrics: readonly string[];
			authority: string;
		}>;
		positionReference: Readonly<{
			referenceVersion: string | null;
			referenceSHA: string | null;
			ruleSHA: string | null;
			metrics: readonly string[];
			authority: string;
		}>;
		overlap: Readonly<{ sharedNames: readonly string[]; rule: string }>;
	}>;
	semanticVerification: string;
	ownerApprovalImplied: false;
	releaseApprovalImplied: false;
}>;

const shaPattern = /^[a-f0-9]{64}$/;
const positionSchema = z.strictObject({
	referenceVersion: z
		.string()
		.min(1)
		.refine((value) => value.trim().length > 0),
	referenceSHA: z.string().regex(shaPattern),
	ruleSHA: z.string().regex(shaPattern),
});
const reviewSchema = z.looseObject({
	characterId: z.unknown(),
	requestId: z.unknown(),
	sha256: z.unknown(),
	actualImageViewed: z.unknown(),
	technicalVerdict: z.unknown(),
	acceptanceSchema: z.unknown(),
	positionReference: z.unknown().optional(),
	criteria: z.unknown().optional(),
});
const criteriaRowsSchema = z.record(z.string(), z.unknown());
const criterionSchema = z.looseObject({
	verdict: z.unknown(),
	scope: z.unknown(),
	imageSHA: z.unknown(),
	evidenceSHA: z.unknown(),
});
const requiredRows = [...criteria.qualityRows, ...criteria.semanticRows];
const proportionMetrics = [
	"headWidth",
	"headHeight",
	"faceWidth",
	"faceHeight",
	"eyeY",
	"headCenterX",
	"crownY",
	"shoulderToHead",
	"torsoToHead",
];
const positionMetrics = [
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

function sha(bytes: Uint8Array): string {
	return createHash("sha256").update(bytes).digest("hex");
}

function exactPositionMatch(actual: unknown, expected: unknown): boolean {
	const actualResult = positionSchema.safeParse(actual);
	const expectedResult = positionSchema.safeParse(expected);
	return (
		actualResult.success &&
		expectedResult.success &&
		actualResult.data.referenceVersion ===
			expectedResult.data.referenceVersion &&
		actualResult.data.referenceSHA === expectedResult.data.referenceSHA &&
		actualResult.data.ruleSHA === expectedResult.data.ruleSHA
	);
}

export function evaluatePortraitAcceptance(
	input: PortraitAcceptanceInput,
): PortraitAcceptanceResult {
	const imageSHA = sha(input.imageBytes);
	const failures: string[] = [];
	const parsedReview = reviewSchema.safeParse(input.review);
	const review = parsedReview.success ? parsedReview.data : null;
	if (
		!review ||
		review.characterId !== input.characterId ||
		review.requestId !== input.requestId ||
		review.sha256 !== imageSHA ||
		review.actualImageViewed !== true ||
		review.technicalVerdict !== "pass"
	)
		failures.push("exactImageReview");
	if (review?.acceptanceSchema !== criteria.schema)
		failures.push("acceptanceSchema");
	let image: ReturnType<typeof decodePng> | null = null;
	try {
		image = decodePng(input.imageBytes);
	} catch (error: unknown) {
		if (error instanceof PngError) failures.push("canvasRGBA");
		else throw error;
	}
	if (
		image &&
		(image.width !== criteria.canvas[0] ||
			image.height !== criteria.canvas[1] ||
			image.channels !== 4)
	)
		failures.push("canvasRGBA");
	let foreground = 0;
	let core = 0;
	let transparent = 0;
	let nonopaque = 0;
	if (image?.channels === 4) {
		for (let i = 3; i < image.pixels.length; i += 4) {
			const alpha = image.pixels[i] ?? 0;
			if (alpha === 0) {
				transparent++;
				continue;
			}
			foreground++;
			if (alpha >= criteria.coreAlphaMinimum) core++;
			if (alpha < 255) nonopaque++;
		}
	}
	const coreFraction = foreground > 0 ? core / foreground : 0;
	if (
		transparent === 0 ||
		foreground === 0 ||
		coreFraction < criteria.minimumCoreFraction
	)
		failures.push("alphaCoreAndBackground");
	const evidenceDigests = new Set<string>();
	for (const bytes of input.evidence) evidenceDigests.add(sha(bytes));
	const criteriaRowsResult = criteriaRowsSchema.safeParse(review?.criteria);
	const criteriaRows = criteriaRowsResult.success
		? criteriaRowsResult.data
		: {};
	for (const name of requiredRows) {
		const parsedRow = criterionSchema.safeParse(criteriaRows[name]);
		const row = parsedRow.success ? parsedRow.data : null;
		if (
			row?.verdict !== "pass" ||
			row.scope !== "whole-image" ||
			row.imageSHA !== imageSHA
		)
			failures.push(name);
		if (
			typeof row?.evidenceSHA !== "string" ||
			!evidenceDigests.has(row.evidenceSHA)
		)
			failures.push(`evidence:${name}`);
	}
	const positionParsed = positionSchema.safeParse(review?.positionReference);
	const positionReference = positionParsed.success ? positionParsed.data : null;
	if (
		!positionParsed.success ||
		(input.expectedPositionReference !== undefined &&
			!exactPositionMatch(
				review?.positionReference,
				input.expectedPositionReference,
			))
	)
		failures.push("positionReference");
	let proportions: ReturnType<typeof verifyProportionArtifacts> | null = null;
	if (!image || !input.profile || !input.measurementBytes) {
		failures.push("measuredProportions");
	} else {
		try {
			proportions = verifyProportionArtifacts({
				profile: input.profile,
				imageBytes: input.imageBytes,
				measurementBytes: input.measurementBytes,
			});
			if (!proportions.pass)
				failures.push(
					...proportions.failures.map((failure) => `proportion:${failure}`),
				);
		} catch (error: unknown) {
			if (
				error instanceof ProportionError ||
				error instanceof PngError ||
				error instanceof z.ZodError
			)
				failures.push("measuredProportions");
			else throw error;
		}
	}
	const profileResult = z
		.looseObject({ profileSHA: z.unknown() })
		.safeParse(input.profile);
	const profileSHA =
		profileResult.success && typeof profileResult.data.profileSHA === "string"
			? profileResult.data.profileSHA
			: null;
	return {
		schema: criteria.schema,
		characterId: input.characterId,
		requestId: input.requestId,
		imageSHA,
		pass: failures.length === 0,
		failures,
		coreFraction,
		nonopaqueForegroundPixels: nonopaque,
		strictOpaqueForegroundPass: foreground > 0 && nonopaque === 0,
		proportions,
		positionReference,
		positionVerification:
			"position-reference.v2 identity binding only; semantic placement remains reviewer-measured",
		metricOwnership: {
			proportionProfile: {
				profileSHA,
				metrics: proportionMetrics,
				authority:
					"measured pixel proportions with explicit tolerances (verifyProportions)",
			},
			positionReference: {
				referenceVersion: positionReference?.referenceVersion ?? null,
				referenceSHA: positionReference?.referenceSHA ?? null,
				ruleSHA: positionReference?.ruleSHA ?? null,
				metrics: positionMetrics,
				authority:
					"exact rational inner/outer intervals; passAuthorityScope POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME; wholeFramePassAuthority:false; not measured by this gate",
			},
			overlap: {
				sharedNames: ["crownY", "eyeY", "headCenterX"],
				rule: "the proportion profile owns the measured pixel value and tolerance; position-reference.v2 owns the exact rational interval authority; neither is converted into the other",
			},
		},
		semanticVerification:
			"image-bound reviewer assertions, not automated recognition",
		ownerApprovalImplied: false,
		releaseApprovalImplied: false,
	};
}

export { evaluatePortraitAcceptance as evaluatePortraitAcceptanceReplacement };
