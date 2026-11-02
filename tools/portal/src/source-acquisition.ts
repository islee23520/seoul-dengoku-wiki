import { z } from "zod";
import { OriginalStoreError } from "../../people-cli/src/store.ts";
import {
	referenceGenerationRequestSchema,
	resolveReferenceSource,
	type SourceAcquisition,
} from "./reference-contract.ts";
import { transformReferencePng } from "./reference-transform.ts";
import { generationSheetFromBytes, hash, type Sheet } from "./sources.ts";
import { createWikiSource, WikiError } from "./wiki.ts";

export type ReferenceSourceDependencies = {
	readonly characters:
		| { get(id: string): Sheet; getReference?(id: string): Sheet | null }
		| null
		| undefined;
	readonly wiki: ReturnType<typeof createWikiSource>;
	readonly wikiBaseUrl: string;
};
const denied = (
	errorCode:
		| "REFERENCE_NOT_ACQUIRED"
		| "REFERENCE_IDENTITY_MISMATCH"
		| "REFERENCE_HASH_MISMATCH"
		| "REFERENCE_INVALID_PNG",
): SourceAcquisition => ({
	status: "failed",
	errorCode,
	httpStatus:
		errorCode === "REFERENCE_INVALID_PNG" ||
		errorCode === "REFERENCE_IDENTITY_MISMATCH"
			? 422
			: 409,
	generation: null,
});

// Internal v2 entry point for later dispatch integration. Public callers supply
// only the closed request; all identities, tokens and image bytes come from I/O.
export async function acquireReferenceSource(
	requestInput: unknown,
	dependencies: ReferenceSourceDependencies,
): Promise<SourceAcquisition> {
	const parsed = referenceGenerationRequestSchema.safeParse(requestInput);
	if (!parsed.success)
		return resolveReferenceSource(requestInput, { status: "unresolved" });
	const request = parsed.data;
	const personId =
		request.personId ??
		(request.sourceSelection.kind === "selected"
			? request.sourceSelection.personId
			: undefined);
	if (!personId) return denied("REFERENCE_NOT_ACQUIRED");
	try {
		const retained = dependencies.characters?.getReference
			? dependencies.characters.getReference(personId)
			: dependencies.characters?.get(personId);
		const detail = retained
			? { ...retained, bytes: retained.detailBytes }
			: await dependencies.wiki.detailWithBytes(personId);
		const token = retained
			? { bytes: retained.tokenBytes }
			: await dependencies.wiki.tokenWithBytes(personId, detail);
		const sheet = generationSheetFromBytes(detail.bytes, token.bytes, null);
		if (sheet.personId !== personId)
			return denied("REFERENCE_IDENTITY_MISMATCH");
		let imageBytes: Uint8Array | null = null;
		switch (request.sourceSelection.kind) {
			case "intentional-absence":
				break;
			case "selected": {
				if (retained) {
					imageBytes = retained.imageBytes;
					break;
				}
				const pin = z
					.object({
						path: z.literal(`/portraits/${personId}.png`),
						sha256: z.string().regex(/^[a-f0-9]{64}$/),
					})
					.safeParse(sheet.token["image"]);
				if (!pin.success) return denied("REFERENCE_NOT_ACQUIRED");
				if (pin.data.sha256 !== request.sourceSelection.sourceSHA256)
					return denied("REFERENCE_HASH_MISMATCH");
				// Validate the configured authority exactly as the wiki text transport
				// does. Never fetch a token-provided URL or follow redirects.
				createWikiSource(dependencies.wikiBaseUrl);
				const url = new URL(
					`portraits/${personId}.png`,
					dependencies.wikiBaseUrl,
				);
				const response = await fetch(url, {
					redirect: "error",
					signal: AbortSignal.timeout(10000),
				});
				if (!response.ok) return denied("REFERENCE_NOT_ACQUIRED");
				const chunks: Uint8Array[] = [];
				let size = 0;
				if (response.body)
					for await (const chunk of response.body) {
						size += chunk.length;
						if (size > 8388608) return denied("REFERENCE_INVALID_PNG");
						chunks.push(chunk);
					}
				imageBytes = Buffer.concat(chunks);
				break;
			}
			default:
				return request.sourceSelection satisfies never;
		}
		return resolveReferenceSource(request, {
			status: "available",
			recipient: { personId: sheet.personId, characterId: sheet.characterId },
			tokenBytes: sheet.tokenBytes,
			tokenSHA256: sheet.sourceHashes.token,
			recipientImage:
				imageBytes === null
					? null
					: {
							personId: sheet.personId,
							characterId: sheet.characterId,
							sourceSHA256: hash(imageBytes),
							bytes: imageBytes,
						},
		});
	} catch (error) {
		if (error instanceof OriginalStoreError)
			return denied("REFERENCE_NOT_ACQUIRED");
		if (error instanceof Error && error.message === "INVALID_PNG")
			return denied("REFERENCE_INVALID_PNG");
		if (error instanceof Error && error.message === "NOT_FOUND")
			return denied("REFERENCE_NOT_ACQUIRED");
		if (
			error instanceof WikiError ||
			error instanceof TypeError ||
			error instanceof DOMException
		)
			return denied("REFERENCE_NOT_ACQUIRED");
		if (
			error instanceof z.ZodError ||
			(error instanceof Error && error.message === "SHEET_IDENTITY_MISMATCH")
		)
			return denied("REFERENCE_IDENTITY_MISMATCH");
		if (
			error instanceof Error &&
			"code" in error &&
			["EACCES", "EPERM"].includes(String(error.code))
		)
			return denied("REFERENCE_NOT_ACQUIRED");
		throw error;
	}
}

export function referenceAcquisitionView(acquisition: SourceAcquisition) {
	switch (acquisition.status) {
		case "acquired":
			return {
				status: acquisition.status,
				eligible: true,
				inputMode: acquisition.generation.inputMode,
				role: acquisition.generation.role,
				personId: acquisition.generation.personId,
				tokenSHA256: acquisition.generation.tokenSHA256,
				sourceSHA256: acquisition.generation.recipientImage.sourceSHA256,
				width: acquisition.generation.recipientImage.width,
				height: acquisition.generation.recipientImage.height,
				transformations: {
					canonical: transformReferencePng(
						acquisition.generation.recipientImage.bytes,
					).receipt,
					native: transformReferencePng(
						acquisition.generation.recipientImage.bytes,
						"native",
					).receipt,
				},
			};
		case "intentional-absence":
			return {
				status: acquisition.status,
				eligible: true,
				inputMode: acquisition.generation.inputMode,
				role: acquisition.generation.role,
				reason: acquisition.reason,
				personId: acquisition.generation.personId,
				tokenSHA256: acquisition.generation.tokenSHA256,
				sourceSHA256: null,
			};
		case "failed":
		case "unresolved":
			return {
				status: acquisition.status,
				eligible: false,
				errorCode: acquisition.errorCode,
				httpStatus: acquisition.httpStatus,
				generation: null,
			};
		default:
			return acquisition satisfies never;
	}
}
