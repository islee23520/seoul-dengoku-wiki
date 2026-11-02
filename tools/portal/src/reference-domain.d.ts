declare module "*portrait/2d/codex-image.mjs" {
	export function decodeCodexPng(bytes: Buffer): {
		width: number;
		height: number;
		channels: number;
		pixels: Buffer;
	};
}
declare module "*portrait/2d/generate-character-set.mjs" {
	export function generateWorkstationSet(
		input: {
			request: import("./references.ts").WorkstationRequest;
			source: {
				ownerId?: string;
				originalHashes?: { detail: string; token: string; image: string };
				originalBytes?: {
					detail: Uint8Array;
					token: Uint8Array;
					image: Uint8Array;
				};
				characterPath: string;
				sha256: string;
				stylePath: string;
				referencePath: string;
				optionsPath?: string;
				canonicalRoot?: string;
				faceVariantCatalogPath?: string;
			};
			identity: {
				ownerId?: string;
				status: "sealed";
				resultId: string;
				personId: string;
				characterId: string;
				sourceSha256: string;
				styleReferenceSha256: string;
				faceMode: import("./references.ts").ReferenceRequest["faceMode"];
				imagePath: string;
				imageSha256: string;
				faceVariant?: {
					id: string;
					traitsSha256: string;
					referenceImageSha256: string;
				} | null;
			};
			authoredLookBytes: Uint8Array;
			outputDir: string;
			signal?: AbortSignal;
		},
		transport: (
			payload: import("./references.ts").WorkstationDispatch,
		) => Promise<unknown>,
	): Promise<{ status: string }>;
	export function validateWorkstationPng(
		bytes: Buffer,
		outputSpec: import("./references.ts").WorkstationOutput,
	): {
		width: number;
		height: number;
		channels: number;
		visiblePixels: number;
		transparentPixels: number;
		visibleBounds: number[];
	};
	export function generateReferenceSet(
		input: {
			request: import("./references.ts").ReferenceRequest;
			source: {
				characterPath: string;
				sha256: string;
				stylePath: string;
				referencePath: string;
				optionsPath: string;
			};
			identity: {
				status: "sealed";
				resultId: string;
				personId: string;
				characterId: string;
				sourceSha256: string;
				styleReferenceSha256: string;
				faceMode: import("./references.ts").ReferenceRequest["faceMode"];
				imagePath: string;
				imageSha256: string;
			};
			outputDir: string;
		},
		transport: (
			payload: import("./references.ts").ReferenceDispatch,
		) => Promise<unknown>,
	): Promise<import("./references.ts").ReferenceManifest>;
}
declare module "*portrait/2d/modular-parts.mjs" {
	export const workstationSourceBindingSchema: import("zod").ZodType<
		NonNullable<import("./references.ts").WorkstationRequest["sourceBinding"]>
	>;
	export function validateWorkstationRequest(
		value: unknown,
	): import("./references.ts").WorkstationRequest;
	export function validateWorkstationOutput(
		value: unknown,
	): import("./references.ts").WorkstationOutput;
	export const authoredWorkstationLookSchema: import("zod").ZodType<{
		schemaVersion: 2;
		sourceId: string;
		lookId: string;
		personId: string;
		characterId: string;
		category: import("./references.ts").WorkstationOutput["category"];
		status: "owner-authored";
		description: string;
	}>;
}
declare module "*portrait/2d/options.json" {
	const bytes: string;
	export default bytes;
}
declare module "*portrait/2d/style-lock.json" {
	const bytes: string;
	export default bytes;
}
