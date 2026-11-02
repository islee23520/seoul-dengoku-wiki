import { join } from "node:path";
import { z } from "zod";
import { cpaPadding } from "../../portrait/generator/src/cpa-padding.ts";
import {
	sendReferenceEditRequest,
	TransportError,
} from "../../portrait/generator/src/transport.ts";
import { compileReferenceEditPrompt } from "./comfyui-prompt.ts";
import type { RegisteredEndpoint } from "./connections.ts";
import { McpError } from "./mcp.ts";
import {
	createReferenceManifest,
	referenceRecordSHA256,
} from "./reference-analysis.ts";
import {
	referenceGenerationRequestSchema,
	resolveReferenceSource,
} from "./reference-contract.ts";
import {
	createOwnerDirective,
	type ReferenceIntentRecords,
	resolveReferenceIntent,
} from "./reference-intent.ts";
import { transformReferencePng } from "./reference-transform.ts";
import { hash } from "./sources.ts";

const reviewSchema = z.strictObject({
	observationReceiptSHA256: z.string().regex(/^[a-f0-9]{64}$/),
	reviews: z
		.array(
			z.strictObject({
				receiptSHA256: z.string().regex(/^[a-f0-9]{64}$/),
				verdict: z.literal("HOLD"),
				failures: z
					.array(
						z.strictObject({
							field: z.enum(["composition.gaze", "composition.framing"]),
							verdict: z.literal("FAIL"),
						}),
					)
					.length(2)
					.refine(
						(failures) =>
							new Set(failures.map((failure) => failure.field)).size === 2,
					),
			}),
		)
		.length(2)
		.refine(
			(reviews) =>
				new Set(reviews.map((review) => review.receiptSHA256)).size === 2,
		),
});
export type ReferenceSemanticReview = z.infer<typeof reviewSchema>;
export type ReferenceProviderAuthority = {
	serverEvidence: unknown;
	records: ReferenceIntentRecords;
	semanticReview: ReferenceSemanticReview | null;
};

// Only the public request enters from the client. The authority argument comes
// from server acquisition/analysis; record hashes alone do not grant edits.
export function prepareReferenceProviderV2(
	requestInput: unknown,
	authority: ReferenceProviderAuthority,
) {
	const request = referenceGenerationRequestSchema.parse(requestInput);
	if (
		request.provider !== "openai-compatible" ||
		request.providerModel !== "gpt-image-2.5-sunburst"
	)
		throw Error("REFERENCE_PROVIDER_MODEL_UNSUPPORTED");
	const acquisition = resolveReferenceSource(request, authority.serverEvidence);
	if (acquisition.status !== "acquired")
		throw Error(
			acquisition.status === "failed" || acquisition.status === "unresolved"
				? acquisition.errorCode
				: "REFERENCE_NOT_ACQUIRED",
		);
	const records = structuredClone(authority.records);
	const { manifest } = createReferenceManifest(
		acquisition,
		records.manifest.value.analysisImage.target,
	);
	const directive = createOwnerDirective(request, manifest);
	const rebuilt = resolveReferenceIntent({
		acquisition,
		manifest,
		directive,
		observation: records.observation,
	});
	if (referenceRecordSHA256(records) !== referenceRecordSHA256(rebuilt))
		throw Error("REFERENCE_INTENT_AUTHORITY_MISMATCH");
	const compiled = compileReferenceEditPrompt(rebuilt);
	const semanticReview =
		authority.semanticReview === null
			? null
			: reviewSchema.parse(authority.semanticReview);
	if (
		semanticReview &&
		(semanticReview.observationReceiptSHA256 !== records.observation.sha256 ||
			records.intent.value.analysisQualified)
	)
		throw Error("REFERENCE_REVIEW_BINDING_MISMATCH");
	// A live unqualified observation must retain its independent disposition.
	if (
		records.observation.value.attempt &&
		records.observation.value.status === "UNQUALIFIED" &&
		semanticReview === null
	)
		throw Error("REFERENCE_REVIEW_REQUIRED");
	const native = transformReferencePng(
		acquisition.generation.recipientImage.bytes,
		"native",
		request.generationProfile,
	);
	const prompt =
		request.generationProfile === "cpa340-padded-v1"
			? `${compiled.text}\nComputational canvas: 640x1024. Keep all subject content inside x=150,y=257,width=340,height=510 at scale 1. Preserve the 340x510 content framing. Outside that rectangle must remain transparent. Do not enlarge, shift, or extend the subject into the computational padding. Delivery removes only that declared outer padding; no subject auto-crop is permitted.`
			: compiled.text;
	return {
		requestId: request.requestId,
		conditions: {
			schemaVersion: 2 as const,
			...(request.generationProfile === "cpa340-padded-v1"
				? { generationGeometry: cpaPadding }
				: {}),
			...(request.generationProfile
				? { generationProfile: request.generationProfile }
				: {}),
			inputMode: "reference-img2img" as const,
			compiler: compiled.compiler,
			model: "gpt-image-2.5-sunburst" as const,
			prompt,
			promptSHA256: hash(Buffer.from(prompt)),
			sourceSHA256: compiled.sourceSHA256,
			transformSHA256: referenceRecordSHA256(native.receipt),
			resolvedIntentSHA256: records.intent.sha256,
			referenceHashes: [native.receipt.rgbaSHA256] as [string],
			orderedImageBytes: [native.rgbaBytes] as [Uint8Array],
		},
		provenance: {
			schemaVersion: 2,
			role: "source-preservation",
			records,
			semanticReview,
			analysisQualified: records.intent.value.analysisQualified,
			analysisStatus: records.observation.value.status,
			accuracy: records.observation.value.accuracy,
			modelSnapshotStatus: records.observation.value.modelSnapshotStatus,
			sourceTransform: native.receipt,
			outputContract: directive.value.output,
			outputContractIsContentEditPermission: false,
			mask: "OMITTED_NO_EXPLICIT_REGION_EDIT",
			inputFidelity: "UNSUPPORTED_NOT_SENT",
			ownerApproval: "NONE",
			reviewStatus: "candidate-unreviewed",
		},
	};
}

export async function dispatchLocalReferenceV2(
	input: { request: unknown },
	options: ReferenceProviderAuthority & {
		directory: string;
		outbound: <T>(
			start: (endpoint: RegisteredEndpoint, key: string, baseUrl?: string) => T,
		) => T;
		// Server-owned transport seam for offline capture; never accepted in HTTP input.
		send?: (request: Request) => Promise<Response>;
	},
) {
	if (Object.keys(input).length !== 1 || !Object.hasOwn(input, "request"))
		throw Error("INVALID_REFERENCE_REQUEST");
	const prepared = prepareReferenceProviderV2(input.request, options);
	let submitted = false;
	try {
		return await options.outbound((_endpoint, apiKey, baseUrl) => {
			if (!baseUrl) throw Error("CONNECTION_NOT_READY");
			return sendReferenceEditRequest({
				...prepared,
				connection: { baseUrl, apiKey },
				outputPath: join(options.directory, "provider-source.png"),
				send: (request) =>
					options.outbound((_current, key, currentUrl) => {
						if (currentUrl !== baseUrl || key !== apiKey)
							throw Error("CONNECTION_NOT_READY");
						submitted = true;
						return (options.send ?? fetch)(request);
					}),
			});
		});
	} catch (error) {
		if (error instanceof TransportError)
			throw new McpError(
				`LOCAL_${error.code}`,
				// Missing model attestation rejects a complete retained response;
				// it does not leave the provider execution outcome unresolved.
				submitted &&
					["NETWORK_FAILURE", "INVALID_RESPONSE"].includes(error.code),
			);
		throw error;
	}
}
