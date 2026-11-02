import { readFile } from "node:fs/promises";
import {
	createReferenceManifest,
	recordReferenceObservation,
	referenceBytesSHA256,
} from "../src/reference-analysis.ts";
import { resolveReferenceSource } from "../src/reference-contract.ts";
import {
	createOwnerDirective,
	resolveReferenceIntent,
} from "../src/reference-intent.ts";

export async function referenceProviderFixture(withEdit = false) {
	const bytes = await readFile(
		process.env["REFERENCE_CONTRACT_K998_PNG"] ??
			new URL(
				"../../../ART-ASSETS/portrait-references/wiki-people/images/person-0998.png",
				import.meta.url,
			),
	);
	const tokenBytes = await readFile(
		new URL(
			"../../../ART-ASSETS/portrait-references/wiki-people/tokens/person-0998.json",
			import.meta.url,
		),
	);
	const sourceSHA256 = referenceBytesSHA256(bytes);
	if (
		sourceSHA256 !==
		"93e45d8525c4616ef1a174b171403ddd95eebf048fba818a0a80f0c24295b306"
	)
		throw Error("FIXTURE_HASH_MISMATCH");
	const recipient = { personId: "person-0998", characterId: "K998" };
	const request = {
		schemaVersion: 2 as const,
		requestId: "e86b580b-9468-4877-ad4d-2095b20427ed",
		personId: recipient.personId,
		inputMode: "reference-img2img" as const,
		sourceSelection: {
			kind: "selected" as const,
			personId: recipient.personId,
			sourceSHA256,
		},
		explicitEdits: withEdit
			? [
					{
						field: "outfit.upper.color" as const,
						operation: "replace" as const,
						value: "dark blue" as const,
					},
				]
			: [],
		provider: "openai-compatible" as const,
		providerModel: "gpt-image-2.5-sunburst",
		size: "340x510" as const,
		faceMode: { kind: "unique" as const, variantId: null },
	};
	const serverEvidence = {
		status: "available" as const,
		recipient,
		tokenBytes,
		tokenSHA256: referenceBytesSHA256(tokenBytes),
		recipientImage: { ...recipient, sourceSHA256, bytes },
	};
	const acquisition = resolveReferenceSource(request, serverEvidence);
	const { manifest } = createReferenceManifest(acquisition);
	const observation = recordReferenceObservation({ manifest });
	const directive = createOwnerDirective(request, manifest);
	return {
		request,
		serverEvidence,
		semanticReview: null,
		records: resolveReferenceIntent({
			acquisition,
			manifest,
			observation,
			directive,
		}),
	};
}
