import { createHash } from "node:crypto";
import { z } from "zod";
import { PORTRAIT_ACCEPTANCE_CRITERIA as criteria } from "./criteria.js";
import { decodePng, PngError } from "./png.js";
import { ProportionError } from "./proportion.js";
import { verifyProportionArtifacts } from "./proportion-artifacts.js";

const rows = [...criteria.qualityRows, ...criteria.semanticRows];
const shaPattern = /^[a-f0-9]{64}$/;
const PositionReferenceSchema = z.strictObject({
	referenceVersion: z
		.string()
		.min(1)
		.refine((value) => value.trim().length > 0),
	referenceSHA: z.string().regex(shaPattern),
	ruleSHA: z.string().regex(shaPattern),
});
const ReviewSchema = z.looseObject({
	characterId: z.unknown(),
	requestId: z.unknown(),
	sha256: z.unknown(),
	actualImageViewed: z.unknown(),
	technicalVerdict: z.unknown(),
	acceptanceSchema: z.unknown(),
	criteria: z.unknown(),
	positionReference: z.unknown().optional(),
});
const CriteriaRowsSchema = z.record(z.string(), z.unknown());
const CriterionRowSchema = z.looseObject({
	verdict: z.unknown(),
	scope: z.unknown(),
	imageSHA: z.unknown(),
	evidenceSHA: z.unknown(),
});
const POSITION_METRICS = [
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

export function evaluatePortraitAcceptance(input: PortraitAcceptanceInput) {
	const imageSHA = createHash("sha256").update(input.imageBytes).digest("hex");
	const failures: string[] = [];
	const parsedReview = ReviewSchema.safeParse(input.review);
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
	const acceptanceSchema = review?.acceptanceSchema;
	if (acceptanceSchema !== criteria.schema) failures.push("acceptanceSchema");
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
	const coreFraction = foreground ? core / foreground : 0;
	if (
		!transparent ||
		!foreground ||
		coreFraction < criteria.minimumCoreFraction
	)
		failures.push("alphaCoreAndBackground");
	const evidenceDigests = new Set<string>();
	for (const bytes of input.evidence)
		evidenceDigests.add(createHash("sha256").update(bytes).digest("hex"));
	const criteriaRowsResult = CriteriaRowsSchema.safeParse(review?.criteria);
	const criterionRows = criteriaRowsResult.success
		? criteriaRowsResult.data
		: {};
	for (const name of rows) {
		const parsedRow = CriterionRowSchema.safeParse(criterionRows[name]);
		const validRow = parsedRow.success ? parsedRow.data : null;
		if (
			validRow?.verdict !== "pass" ||
			validRow.scope !== "whole-image" ||
			validRow.imageSHA !== imageSHA
		)
			failures.push(name);
		if (
			typeof validRow?.evidenceSHA !== "string" ||
			!evidenceDigests.has(validRow.evidenceSHA)
		)
			failures.push(`evidence:${name}`);
	}
	const positionValue: unknown = review?.positionReference;
	const positionResult = PositionReferenceSchema.safeParse(positionValue);
	const expectedResult =
		input.expectedPositionReference === undefined
			? undefined
			: PositionReferenceSchema.safeParse(input.expectedPositionReference);
	const positionReference = positionResult.success ? positionResult.data : null;
	const positionMatches =
		positionResult.success &&
		(!expectedResult ||
			(expectedResult.success &&
				positionResult.data.referenceVersion ===
					expectedResult.data.referenceVersion &&
				positionResult.data.referenceSHA === expectedResult.data.referenceSHA &&
				positionResult.data.ruleSHA === expectedResult.data.ruleSHA));
	if (!positionMatches) failures.push("positionReference");
	let proportions: ReturnType<typeof verifyProportionArtifacts> | null = null;
	if (!image) {
		failures.push("measuredProportions");
	} else if (!input.profile || !input.measurementBytes) {
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
			) {
				failures.push("measuredProportions");
			} else {
				throw error;
			}
		}
	}
	const profileShape = z
		.looseObject({ profileSHA: z.unknown() })
		.safeParse(input.profile);
	const profileSHA = profileShape.success ? profileShape.data.profileSHA : null;
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
				profileSHA: typeof profileSHA === "string" ? profileSHA : null,
				metrics: [
					"headWidth",
					"headHeight",
					"faceWidth",
					"faceHeight",
					"eyeY",
					"headCenterX",
					"crownY",
					"shoulderToHead",
					"torsoToHead",
				],
				authority:
					"measured pixel proportions with explicit tolerances (verifyProportions)",
			},
			positionReference: {
				referenceVersion: positionReference?.referenceVersion ?? null,
				referenceSHA: positionReference?.referenceSHA ?? null,
				ruleSHA: positionReference?.ruleSHA ?? null,
				metrics: POSITION_METRICS,
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
		ownerApprovalImplied: false as const,
		releaseApprovalImplied: false as const,
	};
}
