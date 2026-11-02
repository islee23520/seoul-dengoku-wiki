import { createHash } from "node:crypto";
import { z } from "zod";
import {
	NATIVE_MOSS_MODEL,
	nativeMossRecipeSchema,
} from "./native-moss-contract.ts";
import { measurePng } from "./png.ts";

// allow: SIZE_OK - task-1's single authority boundary keeps the closed public,
// server-evidence and acquisition schemas beside their byte-verifying resolver.
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const personId = z.string().regex(/^person-\d+$/);
const characterId = z.string().regex(/^K\d+$/);
const bytes = z.instanceof(Uint8Array);
const hash = (value: Uint8Array) =>
	createHash("sha256").update(value).digest("hex");
export const sourceRecipeSchema = z.enum([
	"source-025",
	"source-045",
	"source-065",
]);
export function resolveSourceRecipe(
	id: z.infer<typeof sourceRecipeSchema> = "source-045",
) {
	return {
		id,
		denoise: { "source-025": 0.25, "source-045": 0.45, "source-065": 0.65 }[id],
		seed: 152995270030802,
		steps: 25,
		cfg: 2.5,
		sampler: "er_sde",
		scheduler: "simple",
	};
}
export const explicitEditsSchema = z
	.array(
		z.strictObject({
			field: z.literal("outfit.upper.color"),
			operation: z.literal("replace"),
			value: z.literal("dark blue"),
		}),
	)
	.max(1);
export const sourceSelectionSchema = z.discriminatedUnion("kind", [
	z.strictObject({
		kind: z.literal("selected"),
		personId,
		sourceSHA256: sha256,
	}),
	z.strictObject({
		kind: z.literal("intentional-absence"),
		reason: z.literal("no-reference-available"),
	}),
]);
export const referenceGenerationRequestSchema = z
	.strictObject({
		schemaVersion: z.literal(2),
		generationProfile: z.enum(["native340-v1", "cpa340-padded-v1"]).optional(),
		requestId: z.uuid(),
		connectionId: z.uuid().optional(),
		personId: personId.optional(),
		sheetId: z.uuid().optional(),
		inputMode: z.enum(["reference-img2img", "token-only"]),
		sourceSelection: sourceSelectionSchema,
		explicitEdits: explicitEditsSchema,
		provider: z.enum(["openai-compatible", "comfyui", "native-moss"]),
		providerModel: z.string().min(1),
		sourceRecipe: sourceRecipeSchema.optional(),
		nativeRecipe: nativeMossRecipeSchema.optional(),
		size: z.literal("340x510"),
		faceMode: z.strictObject({
			kind: z.literal("unique"),
			variantId: z.null(),
		}),
	})
	.superRefine((request, context) => {
		if (request.provider === "native-moss") {
			if (
				request.providerModel !== NATIVE_MOSS_MODEL ||
				request.generationProfile !== "native340-v1"
			)
				context.addIssue({
					code: "custom",
					message: "INVALID_REFERENCE_REQUEST",
				});
			if (
				!request.nativeRecipe ||
				(request.inputMode === "token-only") !==
					(request.nativeRecipe === "recovery16-native-token-v1")
			)
				context.addIssue({
					code: "custom",
					path: ["nativeRecipe"],
					message: "INVALID_REFERENCE_REQUEST",
				});
			if (request.explicitEdits.length)
				context.addIssue({
					code: "custom",
					path: ["explicitEdits"],
					message: "NATIVE_EDIT_UNSUPPORTED",
				});
		} else if (request.nativeRecipe !== undefined) {
			context.addIssue({
				code: "custom",
				path: ["nativeRecipe"],
				message: "INVALID_REFERENCE_REQUEST",
			});
		}
		if (
			request.generationProfile === "cpa340-padded-v1" &&
			(request.provider !== "openai-compatible" ||
				request.inputMode !== "reference-img2img")
		)
			context.addIssue({
				code: "custom",
				message: "GENERATION_SIZE_UNSUPPORTED",
			});
		if (
			request.sourceRecipe !== undefined &&
			(request.inputMode !== "reference-img2img" ||
				request.provider !== "comfyui")
		)
			context.addIssue({
				code: "custom",
				path: ["sourceRecipe"],
				message: "INVALID_REFERENCE_REQUEST",
			});
		if (Boolean(request.personId) === Boolean(request.sheetId))
			context.addIssue({
				code: "custom",
				message: "INVALID_REFERENCE_REQUEST",
			});
		if (
			(request.inputMode === "reference-img2img") !==
			(request.sourceSelection.kind === "selected")
		)
			context.addIssue({ code: "custom", message: "MODE_SOURCE_MISMATCH" });
		if (request.inputMode === "token-only" && request.explicitEdits.length > 0)
			context.addIssue({ code: "custom", message: "EDIT_FIELD_UNSUPPORTED" });
	});
export type ReferenceGenerationRequest = z.infer<
	typeof referenceGenerationRequestSchema
>;

// Server-only input: the caller obtains identity and pins from the retained
// store/wiki, never from the public request. "available" is not "acquired".
export const referenceSourceEvidenceSchema = z.discriminatedUnion("status", [
	z.strictObject({
		status: z.literal("available"),
		recipient: z.strictObject({
			personId,
			characterId,
			sheetId: z.uuid().optional(),
		}),
		tokenBytes: bytes,
		tokenSHA256: sha256,
		recipientImage: z
			.strictObject({ personId, characterId, sourceSHA256: sha256, bytes })
			.nullable(),
	}),
	z.strictObject({
		status: z.literal("failed"),
		reason: z.enum(["not-found", "permission", "network"]),
	}),
	z.strictObject({ status: z.literal("unresolved") }),
]);
const errors = {
	NATIVE_EDIT_UNSUPPORTED: 422,
	INVALID_REFERENCE_REQUEST: 422,
	MODE_SOURCE_MISMATCH: 422,
	EDIT_FIELD_UNSUPPORTED: 422,
	REFERENCE_NOT_ACQUIRED: 409,
	REFERENCE_HASH_MISMATCH: 409,
	REFERENCE_INVALID_PNG: 422,
	REFERENCE_IDENTITY_MISMATCH: 422,
	REFERENCE_TOKEN_MISMATCH: 409,
} as const;
export type ReferenceContractErrorCode = keyof typeof errors;
const deniedSchema = z.strictObject({
	status: z.literal("failed"),
	errorCode: z.enum([
		"NATIVE_EDIT_UNSUPPORTED",
		"INVALID_REFERENCE_REQUEST",
		"MODE_SOURCE_MISMATCH",
		"EDIT_FIELD_UNSUPPORTED",
		"REFERENCE_NOT_ACQUIRED",
		"REFERENCE_HASH_MISMATCH",
		"REFERENCE_INVALID_PNG",
		"REFERENCE_IDENTITY_MISMATCH",
		"REFERENCE_TOKEN_MISMATCH",
	]),
	httpStatus: z.union([z.literal(409), z.literal(422)]),
	generation: z.null(),
});
const recipient = {
	personId,
	characterId,
	tokenSHA256: sha256,
	tokenBytes: bytes,
};
export const sourceAcquisitionSchema = z.discriminatedUnion("status", [
	z.strictObject({
		status: z.literal("acquired"),
		generation: z.strictObject({
			...recipient,
			inputMode: z.literal("reference-img2img"),
			role: z.literal("source-preservation"),
			preservedProperties: z.tuple([
				z.literal("person"),
				z.literal("outfit"),
				z.literal("composition"),
			]),
			explicitEdits: explicitEditsSchema,
			recipientImage: z.strictObject({
				personId,
				characterId,
				sourceSHA256: sha256,
				bytes,
				width: z.number().int().positive(),
				height: z.number().int().positive(),
			}),
		}),
	}),
	z.strictObject({
		status: z.literal("intentional-absence"),
		reason: z.literal("no-reference-available"),
		generation: z.strictObject({
			...recipient,
			inputMode: z.literal("token-only"),
			role: z.literal("design-tokens"),
			explicitEdits: z.array(z.never()).length(0),
			recipientImage: z.null(),
		}),
	}),
	deniedSchema,
	z.strictObject({
		status: z.literal("unresolved"),
		errorCode: z.literal("REFERENCE_NOT_ACQUIRED"),
		httpStatus: z.literal(409),
		generation: z.null(),
	}),
]);
export type SourceAcquisition = z.infer<typeof sourceAcquisitionSchema>;
const deny = (errorCode: ReferenceContractErrorCode): SourceAcquisition => ({
	status: "failed",
	errorCode,
	httpStatus: errors[errorCode],
	generation: null,
});

// This resolves source authority only, not provider dispatch permission. It has
// no transport or template input. Outfit is preserved except for explicitEdits;
// composition includes the source gaze. Legacy projection rules stay separate.
export function resolveReferenceSource(
	requestInput: unknown,
	serverEvidence: unknown,
): SourceAcquisition {
	const parsed = referenceGenerationRequestSchema.safeParse(requestInput);
	if (!parsed.success) {
		const issues = parsed.error.issues;
		if (issues.some((issue) => issue.message === "NATIVE_EDIT_UNSUPPORTED"))
			return deny("NATIVE_EDIT_UNSUPPORTED");
		if (issues.some((issue) => issue.message === "MODE_SOURCE_MISMATCH"))
			return deny("MODE_SOURCE_MISMATCH");
		if (
			issues.some(
				(issue) =>
					issue.path[0] === "explicitEdits" ||
					issue.message === "EDIT_FIELD_UNSUPPORTED",
			)
		)
			return deny("EDIT_FIELD_UNSUPPORTED");
		return deny("INVALID_REFERENCE_REQUEST");
	}
	const request = parsed.data;
	const evidence = referenceSourceEvidenceSchema.safeParse(serverEvidence);
	if (!evidence.success) return deny("REFERENCE_NOT_ACQUIRED");
	const source = evidence.data;
	switch (source.status) {
		case "failed":
			return deny("REFERENCE_NOT_ACQUIRED");
		case "unresolved":
			return {
				status: "unresolved",
				errorCode: "REFERENCE_NOT_ACQUIRED",
				httpStatus: 409,
				generation: null,
			};
		case "available":
			break;
		default:
			return source satisfies never;
	}
	if (
		(request.personId !== undefined &&
			request.personId !== source.recipient.personId) ||
		(request.sheetId !== undefined &&
			request.sheetId !== source.recipient.sheetId)
	)
		return deny("REFERENCE_IDENTITY_MISMATCH");
	if (hash(source.tokenBytes) !== source.tokenSHA256)
		return deny("REFERENCE_TOKEN_MISMATCH");
	let token: unknown;
	try {
		token = JSON.parse(
			new TextDecoder("utf-8", { fatal: true }).decode(source.tokenBytes),
		);
	} catch (error) {
		if (error instanceof SyntaxError || error instanceof TypeError)
			return deny("REFERENCE_TOKEN_MISMATCH");
		throw error;
	}
	const identity = z
		.object({
			personId,
			characterId,
			image: z.object({ sha256 }).nullable().optional(),
		})
		.safeParse(token);
	if (
		!identity.success ||
		identity.data.personId !== source.recipient.personId ||
		identity.data.characterId !== source.recipient.characterId
	)
		return deny("REFERENCE_IDENTITY_MISMATCH");
	const boundRecipient = {
		personId: source.recipient.personId,
		characterId: source.recipient.characterId,
		tokenSHA256: source.tokenSHA256,
		tokenBytes: new Uint8Array(source.tokenBytes),
	};
	switch (request.sourceSelection.kind) {
		case "intentional-absence":
			if (source.recipientImage !== null) return deny("MODE_SOURCE_MISMATCH");
			return {
				status: "intentional-absence",
				reason: request.sourceSelection.reason,
				generation: {
					...boundRecipient,
					inputMode: "token-only",
					role: "design-tokens",
					explicitEdits: [],
					recipientImage: null,
				},
			};
		case "selected": {
			if (request.sourceSelection.personId !== source.recipient.personId)
				return deny("REFERENCE_IDENTITY_MISMATCH");
			const image = source.recipientImage;
			if (image === null) return deny("REFERENCE_NOT_ACQUIRED");
			if (
				image.personId !== source.recipient.personId ||
				image.characterId !== source.recipient.characterId
			)
				return deny("REFERENCE_IDENTITY_MISMATCH");
			// Own the verified snapshot so later mutation of acquisition buffers
			// cannot silently change the bytes associated with this source pin.
			const imageBytes = new Uint8Array(image.bytes);
			if (
				image.sourceSHA256 !== request.sourceSelection.sourceSHA256 ||
				identity.data.image?.sha256 !== image.sourceSHA256 ||
				hash(imageBytes) !== image.sourceSHA256
			)
				return deny("REFERENCE_HASH_MISMATCH");
			let dimensions: ReturnType<typeof measurePng>;
			try {
				dimensions = measurePng(imageBytes);
			} catch (error) {
				if (error instanceof Error && error.message === "INVALID_PNG")
					return deny("REFERENCE_INVALID_PNG");
				throw error;
			}
			return {
				status: "acquired",
				generation: {
					...boundRecipient,
					inputMode: "reference-img2img",
					role: "source-preservation",
					preservedProperties: ["person", "outfit", "composition"],
					explicitEdits: request.explicitEdits,
					recipientImage: {
						...image,
						bytes: imageBytes,
						width: dimensions.width,
						height: dimensions.height,
					},
				},
			};
		}
		default:
			return request.sourceSelection satisfies never;
	}
}
