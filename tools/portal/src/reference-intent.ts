import { z } from "zod";
import {
	createReferenceManifest,
	type ObservationReceipt,
	type ReferenceManifest,
	type ReferenceRecord,
	referenceRecord,
	referenceRecordSHA256,
	verifyReferenceRecord,
} from "./reference-analysis.ts";
import {
	explicitEditsSchema,
	referenceGenerationRequestSchema,
	sourceAcquisitionSchema,
} from "./reference-contract.ts";

export function createOwnerDirective(
	requestInput: unknown,
	manifest: ReferenceManifest,
) {
	const request = referenceGenerationRequestSchema.safeParse(requestInput);
	if (!request.success) {
		if (request.error.issues.some((issue) => issue.path[0] === "explicitEdits"))
			throw Error("EDIT_FIELD_UNSUPPORTED");
		throw Error("INVALID_REFERENCE_REQUEST");
	}
	const r = request.data;
	if (
		!verifyReferenceRecord(manifest) ||
		r.inputMode !== "reference-img2img" ||
		r.sourceSelection.kind !== "selected" ||
		r.sourceSelection.personId !== manifest.value.personId ||
		r.sourceSelection.sourceSHA256 !== manifest.value.sourceSHA256 ||
		(r.personId !== undefined && r.personId !== manifest.value.personId)
	)
		throw Error("REFERENCE_BINDING_MISMATCH");
	return referenceRecord({
		kind: "OwnerDirective" as const,
		schemaVersion: 1 as const,
		requestId: r.requestId,
		requestSHA256: referenceRecordSHA256(r),
		referenceManifestSHA256: manifest.sha256,
		sourceSHA256: manifest.value.sourceSHA256,
		authority: "explicit-request-only" as const,
		explicitEdits: r.explicitEdits,
		preservedProperties: ["person", "outfit", "composition", "gaze"] as const,
		output: {
			width: 340,
			height: 510,
			background: "transparent",
			interior: "opaque",
			edge: "partial-alpha-allowed",
		} as const,
		ownerApproval: "NONE" as const,
	});
}
export type OwnerDirective = ReturnType<typeof createOwnerDirective>;
type Conflict = {
	field: string;
	tokenValueSHA256: string;
	resolution: "ignored-in-reference-mode";
	reason: "historical-token-has-no-edit-authority";
};
export type ResolvedIntent = ReferenceRecord<{
	kind: "ResolvedIntent";
	schemaVersion: 1;
	inputMode: "reference-img2img";
	referenceManifestSHA256: string;
	observationReceiptSHA256: string;
	ownerDirectiveSHA256: string;
	sourceSHA256: string;
	status: "READY" | "HOLD";
	reason: string;
	analysisStatus: ObservationReceipt["value"]["status"];
	analysisQualified: boolean;
	semanticAuthority: "explicit-edits-then-source-preservation";
	explicitEdits: z.infer<typeof explicitEditsSchema>;
	preservedProperties: readonly ["person", "outfit", "composition", "gaze"];
	conflicts: Conflict[];
	ownerApproval: "NONE";
}>;
export type ReferenceIntentRecords = {
	manifest: ReferenceManifest;
	observation: ObservationReceipt;
	directive: OwnerDirective;
	intent: ResolvedIntent;
};

// Records are server-owned. Hashes detect drift; they do not authenticate a
// caller. Providers must still verify their actual image bytes before dispatch.
export function resolveReferenceIntent(input: {
	acquisition: unknown;
	manifest: ReferenceManifest;
	observation: ObservationReceipt;
	directive: OwnerDirective;
}): ReferenceIntentRecords {
	const { manifest, observation, directive } = input;
	const value: ResolvedIntent["value"] = {
		kind: "ResolvedIntent",
		schemaVersion: 1,
		inputMode: "reference-img2img",
		referenceManifestSHA256: manifest.sha256,
		observationReceiptSHA256: observation.sha256,
		ownerDirectiveSHA256: directive.sha256,
		sourceSHA256: manifest.value.sourceSHA256,
		status: "HOLD",
		reason: "REFERENCE_BINDING_MISMATCH",
		analysisStatus: observation.value.status,
		analysisQualified: false,
		semanticAuthority: "explicit-edits-then-source-preservation",
		explicitEdits: [],
		preservedProperties: ["person", "outfit", "composition", "gaze"],
		conflicts: [],
		ownerApproval: "NONE",
	};
	const finish = (): ReferenceIntentRecords => ({
		manifest: structuredClone(manifest),
		observation: structuredClone(observation),
		directive: structuredClone(directive),
		intent: referenceRecord(value),
	});
	if (
		!verifyReferenceRecord(manifest) ||
		!verifyReferenceRecord(observation) ||
		!verifyReferenceRecord(directive)
	) {
		value.reason = "REFERENCE_RECORD_TAMPERED";
		return finish();
	}
	if (
		observation.value.referenceManifestSHA256 !== manifest.sha256 ||
		directive.value.referenceManifestSHA256 !== manifest.sha256 ||
		observation.value.sourceSHA256 !== manifest.value.sourceSHA256 ||
		directive.value.sourceSHA256 !== manifest.value.sourceSHA256
	)
		return finish();
	const acquisition = sourceAcquisitionSchema.safeParse(input.acquisition);
	if (!acquisition.success || acquisition.data.status !== "acquired") {
		value.reason = "REFERENCE_NOT_ACQUIRED";
		return finish();
	}
	const g = acquisition.data.generation;
	let rebuilt: ReferenceManifest;
	try {
		rebuilt = createReferenceManifest(
			acquisition.data,
			manifest.value.analysisImage.target,
		).manifest;
	} catch (error) {
		if (error instanceof Error) return finish();
		throw error;
	}
	const edits = explicitEditsSchema.safeParse(directive.value.explicitEdits);
	if (!edits.success) {
		value.reason = "EDIT_FIELD_UNSUPPORTED";
		return finish();
	}
	if (
		rebuilt.sha256 !== manifest.sha256 ||
		referenceRecordSHA256(edits.data) !== referenceRecordSHA256(g.explicitEdits)
	)
		return finish();
	if (observation.value.status === "HOLD") {
		value.reason = observation.value.reason;
		return finish();
	}
	// Report authority conflicts without claiming an unqualified vision model
	// proved a visual disagreement. Raw trait text never enters the edit prompt.
	const token: unknown = JSON.parse(new TextDecoder().decode(g.tokenBytes));
	const sections = z
		.object({
			artProposal: z.record(z.string(), z.unknown()).optional(),
			slots: z.record(z.string(), z.unknown()).optional(),
			generationContract: z.record(z.string(), z.unknown()).optional(),
		})
		.parse(token);
	const visit = (entry: unknown, path: string) => {
		if (entry === null || entry === undefined) return;
		if (typeof entry === "object" && !Array.isArray(entry)) {
			if (Object.hasOwn(entry, "value")) {
				if (Reflect.get(entry, "value") !== null)
					visit(Reflect.get(entry, "value"), path);
			} else {
				for (const [key, child] of Object.entries(entry))
					visit(child, `${path}.${key}`);
			}
			return;
		}
		value.conflicts.push({
			field: path,
			tokenValueSHA256: referenceRecordSHA256(entry),
			resolution: "ignored-in-reference-mode",
			reason: "historical-token-has-no-edit-authority",
		});
	};
	for (const [key, entry] of Object.entries(sections)) visit(entry, key);
	value.explicitEdits = edits.data;
	value.analysisQualified = observation.value.status === "ATTRIBUTED";
	value.status = "READY";
	value.reason = value.analysisQualified
		? "SOURCE_PRESERVATION_READY"
		: "ANALYSIS_UNQUALIFIED";
	return finish();
}

export function assertReferenceIntent(records: ReferenceIntentRecords): void {
	const { manifest, observation, directive, intent } = records;
	if (
		!verifyReferenceRecord(manifest) ||
		!verifyReferenceRecord(observation) ||
		!verifyReferenceRecord(directive) ||
		!verifyReferenceRecord(intent)
	)
		throw Error("REFERENCE_RECORD_TAMPERED");
	if (intent.value.status !== "READY" || observation.value.status === "HOLD")
		throw Error("REFERENCE_INTENT_HOLD");
	if (
		intent.value.referenceManifestSHA256 !== manifest.sha256 ||
		intent.value.observationReceiptSHA256 !== observation.sha256 ||
		intent.value.ownerDirectiveSHA256 !== directive.sha256 ||
		observation.value.referenceManifestSHA256 !== manifest.sha256 ||
		directive.value.referenceManifestSHA256 !== manifest.sha256 ||
		intent.value.sourceSHA256 !== manifest.value.sourceSHA256 ||
		observation.value.sourceSHA256 !== manifest.value.sourceSHA256 ||
		directive.value.sourceSHA256 !== manifest.value.sourceSHA256 ||
		referenceRecordSHA256(intent.value.explicitEdits) !==
			referenceRecordSHA256(directive.value.explicitEdits)
	)
		throw Error("REFERENCE_BINDING_MISMATCH");
	if (!explicitEditsSchema.safeParse(intent.value.explicitEdits).success)
		throw Error("EDIT_FIELD_UNSUPPORTED");
}
