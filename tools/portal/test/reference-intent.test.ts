import { beforeAll, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { compileReferenceEditPrompt } from "../src/comfyui-prompt.ts";
import {
	createReferenceManifest,
	recordReferenceObservation,
	referenceBytesSHA256,
	referenceRecord,
	referenceRecordSHA256,
} from "../src/reference-analysis.ts";
import { resolveReferenceSource } from "../src/reference-contract.ts";
import {
	createOwnerDirective,
	resolveReferenceIntent,
} from "../src/reference-intent.ts";

const sourceSHA256 =
	"93e45d8525c4616ef1a174b171403ddd95eebf048fba818a0a80f0c24295b306";
const recipient = { personId: "person-0998", characterId: "K998" };
const edit = {
	field: "outfit.upper.color",
	operation: "replace",
	value: "dark blue",
} as const;
let png: Uint8Array;
let tokenBytes: Uint8Array;
beforeAll(async () => {
	const { REFERENCE_CONTRACT_K998_PNG } = process.env;
	png = await readFile(
		REFERENCE_CONTRACT_K998_PNG ??
			new URL(
				"../../../ART-ASSETS/portrait-references/wiki-people/images/person-0998.png",
				import.meta.url,
			),
	);
	tokenBytes = await readFile(
		new URL(
			"../../../ART-ASSETS/portrait-references/wiki-people/tokens/person-0998.json",
			import.meta.url,
		),
	);
	expect(referenceBytesSHA256(png)).toBe(sourceSHA256);
});
function fixture(withEdit = false) {
	const request = {
		schemaVersion: 2,
		requestId: "b385e070-2346-4dde-8470-90eeef7b68e1",
		personId: recipient.personId,
		inputMode: "reference-img2img",
		sourceSelection: {
			kind: "selected",
			personId: recipient.personId,
			sourceSHA256,
		},
		explicitEdits: withEdit ? [edit] : [],
		provider: "openai-compatible",
		providerModel: "gpt-image-2.5-sunburst",
		size: "340x510",
		faceMode: { kind: "unique", variantId: null },
	};
	const acquisition = resolveReferenceSource(request, {
		status: "available",
		recipient,
		tokenBytes,
		tokenSHA256: referenceBytesSHA256(tokenBytes),
		recipientImage: { ...recipient, sourceSHA256, bytes: png },
	});
	const { manifest } = createReferenceManifest(acquisition);
	const observation = recordReferenceObservation({ manifest });
	const directive = createOwnerDirective(request, manifest);
	const input = { acquisition, manifest, observation, directive };
	return { request, input, records: resolveReferenceIntent(input) };
}

test("real K998 historical fuller-face and direction tokens have no edit authority", () => {
	const f = fixture();
	const token = JSON.parse(new TextDecoder().decode(tokenBytes));
	expect(token.slots.face.faceShape.value).toContain("fuller");
	const result = compileReferenceEditPrompt(f.records);
	expect(result.fields).toEqual([]);
	expect(result.analysisQualified).toBe(false);
	expect(f.records.intent.value).toMatchObject({
		status: "READY",
		reason: "ANALYSIS_UNQUALIFIED",
		semanticAuthority: "explicit-edits-then-source-preservation",
		preservedProperties: ["person", "outfit", "composition", "gaze"],
		ownerApproval: "NONE",
	});
	expect(f.records.intent.value.conflicts).toContainEqual({
		field: "slots.face.faceShape",
		tokenValueSHA256: referenceRecordSHA256(token.slots.face.faceShape.value),
		resolution: "ignored-in-reference-mode",
		reason: "historical-token-has-no-edit-authority",
	});
	for (const value of [
		token.slots.face.faceShape.value,
		token.artProposal.face,
		"gazeCamera",
		"off-frame",
		"viewer-right",
		JSON.stringify(token),
	])
		expect(result.text).not.toContain(value);
	expect(result.sourceSHA256).toBe(sourceSHA256);
	expect(result.resolvedIntentSHA256).toBe(f.records.intent.sha256);
	expect(result.imageIndex).toBe(1);
	expect(result.ownerApproval).toBe("NONE");
});

test("only the explicit upper color edit survives and all four records are hash-linked", () => {
	const { records } = fixture(true);
	const result = compileReferenceEditPrompt(records);
	expect(result.fields).toEqual([edit.field]);
	expect(records.intent.value.explicitEdits).toEqual([edit]);
	expect(records.intent.value.referenceManifestSHA256).toBe(
		records.manifest.sha256,
	);
	expect(records.intent.value.observationReceiptSHA256).toBe(
		records.observation.sha256,
	);
	expect(records.intent.value.ownerDirectiveSHA256).toBe(
		records.directive.sha256,
	);
	for (const record of Object.values(records))
		expect(record.sha256).toBe(referenceRecordSHA256(record.value));
	expect(result.sha).toBe(referenceBytesSHA256(result.text));
	expect(compileReferenceEditPrompt(structuredClone(records))).toEqual(result);
});

test("unsupported jaw edit is rejected rather than promoted from an owner-shaped payload", () => {
	const f = fixture();
	expect(() =>
		createOwnerDirective(
			{
				...f.request,
				explicitEdits: [
					{ field: "person.jaw", operation: "replace", value: "round" },
				],
			},
			f.records.manifest,
		),
	).toThrow("EDIT_FIELD_UNSUPPORTED");
});

test.each(["manifest", "observation", "directive", "intent"] as const)(
	"tampered %s cannot compile",
	(key) => {
		const { records } = fixture();
		records[key].sha256 = "f".repeat(64);
		expect(() => compileReferenceEditPrompt(records)).toThrow(
			"REFERENCE_RECORD_TAMPERED",
		);
	},
);

test("failed source and changed acquired bytes hold before any prompt exists", () => {
	const f = fixture();
	const absent = resolveReferenceIntent({
		...f.input,
		acquisition: {
			status: "unresolved",
			errorCode: "REFERENCE_NOT_ACQUIRED",
			httpStatus: 409,
			generation: null,
		},
	});
	expect(absent.intent.value.status).toBe("HOLD");
	expect(() => compileReferenceEditPrompt(absent)).toThrow(
		"REFERENCE_INTENT_HOLD",
	);
	if (f.input.acquisition.status !== "acquired")
		throw Error("Expected acquisition");
	f.input.acquisition.generation.tokenBytes[0] = 0;
	expect(resolveReferenceIntent(f.input).intent.value.status).toBe("HOLD");
});

test("refusal holds while legacy observations remain unattributed and do not supply instructions", () => {
	const f = fixture();
	const held = referenceRecord({
		...f.input.observation.value,
		status: "HOLD" as const,
		reason: "ANALYSIS_REFUSED",
	});
	const records = resolveReferenceIntent({ ...f.input, observation: held });
	expect(records.intent.value.status).toBe("HOLD");
	expect(() => compileReferenceEditPrompt(records)).toThrow(
		"REFERENCE_INTENT_HOLD",
	);
	const legacy = recordReferenceObservation({
		manifest: f.input.manifest,
		legacyBytes: Buffer.from("gazeCamera: true"),
	});
	const legacyRecords = resolveReferenceIntent({
		...f.input,
		observation: legacy,
	});
	expect(legacyRecords.intent.value.analysisQualified).toBe(false);
	expect(compileReferenceEditPrompt(legacyRecords).text).not.toContain(
		"gazeCamera",
	);
});

test("a rehashed cross-source directive or rewritten edit cannot reuse the old links", () => {
	const f = fixture();
	f.records.directive = referenceRecord({
		...f.records.directive.value,
		sourceSHA256: "f".repeat(64),
	});
	expect(() => compileReferenceEditPrompt(f.records)).toThrow(
		"REFERENCE_BINDING_MISMATCH",
	);
	const g = fixture();
	g.input.directive = referenceRecord({
		...g.input.directive.value,
		explicitEdits: [edit],
	});
	expect(resolveReferenceIntent(g.input).intent.value.status).toBe("HOLD");
});
