import { createHash } from "node:crypto";
import { mossStyleStrength } from "./provider-models.ts";
import { assertReferenceIntent, type ReferenceIntentRecords } from "./reference-intent.ts";
import { hash } from "./sources.ts";
import { z } from "zod";

// allow: SIZE_OK — replay-owned field/order tables are immutable compiler data;
// keep them beside the compiler to avoid an unrelated contract-module import.
// Deterministic compiler from the retained authored projection
// (`projection.rendering`) to the one text a ComfyUI text encoder receives.
// The projection is a JSON character sheet; sent raw, ZImage drew a
// character-sheet poster with stat text and several faces (production job
// c5f168ae). Every clause below is either fixed portal framing or an authored
// trait value copied verbatim: nothing is inferred, translated or invented.
// This compiler is consumed by evaluation tooling. The shipping-base portal
// does not yet dispatch ComfyUI workflows; no provider catalog is added here.
export const COMFY_PROMPT_COMPILER = "comfy-portrait-prompt.v4" as const;
export const comfyPromptCompilerSchema = z.enum([
	"comfy-portrait-prompt.v1",
	"comfy-portrait-prompt.v2",
	"comfy-portrait-prompt.v3",
	COMFY_PROMPT_COMPILER,
]);
export type ComfyPromptCompiler = z.infer<typeof comfyPromptCompilerSchema>;

// Conditioning-quality guard in UTF-16 code units (String.length), NOT tokens.
export const COMFY_PROMPT_LIMIT_UNIT = "utf16-code-units" as const;
export const COMFY_PROMPT_LIMITS = Object.freeze({
	"zimage-turbo-text-draft.v1": 1600,
	"moss-image-sft-text.v1": 2400,
	"moss-image-sft-style-lora.v1": 2400,
	"moss-image-sft-style-captionfix.v1": 2400,
	"moss-image-sft-style-male.v1": 2400,
	"moss-image-sft-style-diagnostic-zero.v1": 2400,
	"moss-image-sft-style-diagnostic-reduced.v1": 2400,
	"moss-image-sft-text.alpha.v1": 2400,
	"moss-image-sft-style-lora.alpha.v1": 2400,
	"moss-image-sft-style-captionfix.alpha.v1": 2400,
	"moss-image-sft-style-male.alpha.v1": 2400,
	"moss-image-sft-style-diagnostic-zero.alpha.v1": 2400,
	"moss-image-sft-style-diagnostic-reduced.alpha.v1": 2400,
});
export type ComfyWorkflow = keyof typeof COMFY_PROMPT_LIMITS;
// One authored value never dominates the prompt; the cut is by code point.
const MAX_VALUE_CHARS = 240;

type Section = "identity" | "face" | "hair" | "body" | "outfit" | "accessories";
type Field = Readonly<{ section: Section; key: string; label: string }>;
// Inclusion priority when the bound is tight: identity and overall
// descriptions first, fine detail last. Rendering order is by section below.
const FIELDS: readonly Field[] = Object.freeze([
	{ section: "identity", key: "gender", label: "Gender" },
	{ section: "identity", key: "ageCategory", label: "Age" },
	{ section: "face", key: "description", label: "Face" },
	{ section: "hair", key: "description", label: "Hair" },
	{ section: "hair", key: "color", label: "Hair color" },
	{ section: "hair", key: "length", label: "Hair length" },
	{ section: "hair", key: "shape", label: "Hair shape" },
	{ section: "face", key: "faceShape", label: "Face shape" },
	{ section: "face", key: "eyeColor", label: "Eye color" },
	{ section: "face", key: "eyeShape", label: "Eye shape" },
	{ section: "face", key: "eyebrowShape", label: "Eyebrows" },
	{ section: "face", key: "noseShape", label: "Nose" },
	{ section: "face", key: "mouthShape", label: "Mouth" },
	{ section: "face", key: "lipColor", label: "Lips" },
	{ section: "face", key: "beardShape", label: "Beard" },
	{ section: "body", key: "skin", label: "Skin" },
	{ section: "identity", key: "ethnicity", label: "Ethnicity" },
	{ section: "identity", key: "origin", label: "Origin" },
	{ section: "body", key: "build", label: "Build" },
	{ section: "body", key: "bustSize", label: "Bust" },
	{ section: "outfit", key: "upper", label: "Upper garment" },
	{ section: "outfit", key: "neckline", label: "Neckline" },
	{ section: "outfit", key: "headwear", label: "Headwear" },
	{ section: "outfit", key: "marks", label: "Marks" },
	{ section: "accessories", key: "description", label: "Accessories" },
	{ section: "accessories", key: "shape", label: "Accessory shape" },
	{ section: "accessories", key: "color", label: "Accessory color" },
	{ section: "accessories", key: "material", label: "Accessory material" },
	{ section: "accessories", key: "mounting", label: "Accessory placement" },
]);
// Authored fields deliberately never compiled: body.weight and body.height are
// numeric and invisible in a bust (digits also invite rendered numbers);
// outfit.lower and outfit.footwear lie below the bust frame and pull the
// model toward a full-body sheet.
export const COMFY_PROMPT_EXCLUDED_FIELDS = Object.freeze([
	"body.weight",
	"body.height",
	"outfit.lower",
	"outfit.footwear",
]);
const SECTIONS: readonly Section[] = Object.freeze([
	"identity",
	"face",
	"hair",
	"body",
	"outfit",
	"accessories",
]);
const KEY_ORDER: Readonly<Record<Section, readonly string[]>> = Object.freeze({
	identity: ["gender", "ageCategory", "ethnicity", "origin"],
	face: [
		"description",
		"faceShape",
		"eyeColor",
		"eyeShape",
		"eyebrowShape",
		"lipColor",
		"mouthShape",
		"noseShape",
		"beardShape",
	],
	hair: ["description", "shape", "color", "length"],
	body: ["build", "bustSize", "skin"],
	outfit: ["headwear", "upper", "neckline", "marks"],
	accessories: ["description", "shape", "color", "material", "mounting"],
});

const group = z.record(z.string(), z.unknown());
const renderingSchema = z
	.object({
		identity: group.optional(),
		slots: z
			.object({
				face: group.optional(),
				hair: group.optional(),
				body: group.optional(),
				outfit: group.optional(),
				accessories: group.optional(),
			})
			.passthrough()
			.optional(),
		generationContract: z
			.object({ direction: z.unknown().optional() })
			.passthrough()
			.optional(),
	})
	.passthrough();

export class ComfyPromptError extends Error {
	constructor(
		readonly code:
			| "COMFY_PROMPT_INPUT_INVALID"
			| "COMFY_PROMPT_REQUIRED_BUDGET" = "COMFY_PROMPT_INPUT_INVALID",
		readonly fields: readonly string[] = [],
		readonly budget?: Readonly<{
			required: number;
			limit: number;
			unit: typeof COMFY_PROMPT_LIMIT_UNIT;
		}>,
	) {
		super(code);
	}
}

const requiredTraitSchema = z.object({
	value: z.string().nullable(),
	status: z.string().optional(),
});
function traitValue(
	record: Record<string, unknown> | undefined,
	key: string,
	required: boolean,
) {
	const trait = record?.[key];
	if (
		required &&
		trait !== undefined &&
		!requiredTraitSchema.safeParse(trait).success
	)
		throw new ComfyPromptError();
	if (!trait || typeof trait !== "object" || !("value" in trait)) return null;
	if (
		required &&
		Reflect.get(trait, "status") === "unknown" &&
		Reflect.get(trait, "value")
	)
		throw new ComfyPromptError();
	if (Reflect.get(trait, "status") === "unknown") return null;
	const value = Reflect.get(trait, "value");
	// Numeric traits are never written into the prompt (see excluded fields).
	if (typeof value !== "string") return null;
	const cleaned = value
		.replace(/\s+/g, " ")
		.trim()
		.replace(/[\s.;,]+$/u, "");
	if (required && value.trim().length > 0 && cleaned.length === 0)
		throw new ComfyPromptError();
	const normalized = required
		? cleaned
		: Array.from(cleaned).slice(0, MAX_VALUE_CHARS).join("");
	return normalized.length ? normalized : null;
}

// The authored generation contract names the portrait direction; anything
// other than the two authored three-quarter directions draws a front view.
function view(direction: unknown, compiler: ComfyPromptCompiler) {
	const value = typeof direction === "string" ? direction.trim() : "";
	if (
		(compiler === "comfy-portrait-prompt.v3" ||
			compiler === COMFY_PROMPT_COMPILER) &&
		(value === "viewer-right" || value === "viewer-left")
	) {
		const side = value === "viewer-right" ? "right" : "left";
		const opposite = side === "right" ? "left" : "right";
		return `three-quarter view with the head and torso turned slightly toward the viewer's ${side}. Image-space eye alignment: in both eyes, the irises and pupils are displaced toward the image-${side} corners of the eye openings, with a clearly visible crescent of white sclera on the image-${opposite} side of each iris. Both eyes fixate on one off-frame target beyond the ${side} edge of the image, aligned with the head turn`;
	}
	if (
		compiler === "comfy-portrait-prompt.v2" &&
		(value === "viewer-right" || value === "viewer-left")
	) {
		const side = value === "viewer-right" ? "right" : "left";
		const opposite = side === "right" ? "left" : "right";
		return `three-quarter view with the head and torso turned slightly toward the viewer's ${side}. Both eyes look toward the viewer's ${side}, with both pupils aligned with the head direction. No looking back at the camera and no gaze toward the viewer's ${opposite}`;
	}
	// Immutable v1 receipts must reproduce the original bytes and field budget.
	if (value === "viewer-right")
		return "three-quarter view with the head and torso turned slightly toward the viewer's right";
	if (value === "viewer-left")
		return "three-quarter view with the head and torso turned slightly toward the viewer's left";
	return "front view facing the viewer";
}

export type CompiledComfyPrompt = Readonly<{
	compiler: ComfyPromptCompiler;
	workflow: ComfyWorkflow;
	text: string;
	sha: string;
	limit: number;
	limitUnit: typeof COMFY_PROMPT_LIMIT_UNIT;
	// `section.key` of every authored field whose value reached the prompt.
	fields: readonly string[];
	// Authored fields with a value that the bound left out.
	dropped: readonly string[];
}>;

export function compileComfyPortraitPrompt(
	rendering: unknown,
	workflow: ComfyWorkflow,
	compiler: ComfyPromptCompiler = COMFY_PROMPT_COMPILER,
): CompiledComfyPrompt {
	if (
		!comfyPromptCompilerSchema.safeParse(compiler).success ||
		!Object.hasOwn(COMFY_PROMPT_LIMITS, workflow)
	)
		throw new ComfyPromptError();
	const parsed = renderingSchema.safeParse(rendering);
	if (!parsed.success) throw new ComfyPromptError();
	const limit = COMFY_PROMPT_LIMITS[workflow];
	const head = `${mossStyleStrength(workflow) !== undefined ? "seoul dengoku portrait style. " : ""}A single portrait illustration of one person. Bust framing: head, both shoulders and upper chest, centered in a vertical 2:3 frame, ${view(
		parsed.data.generationContract?.direction,
		compiler,
	)}.`;
	const tail =
		"Plain solid light gray background, soft even lighting, no props, no scenery. Exactly one person and one view: no text, no letters, no numbers, no labels, no captions, no watermark, no panels, no layout, no multiple views, no character sheet, no extra people.";
	const sources: Record<Section, Record<string, unknown> | undefined> = {
		identity: parsed.data.identity,
		face: parsed.data.slots?.face,
		hair: parsed.data.slots?.hair,
		body: parsed.data.slots?.body,
		outfit: parsed.data.slots?.outfit,
		accessories: parsed.data.slots?.accessories,
	};
	// Each clause costs its text plus a separator; each section a terminator.
	let budget = limit - head.length - tail.length - 2 - SECTIONS.length * 2;
	const included = new Map<string, string>();
	const dropped: string[] = [];
	const candidates = FIELDS.map((field) => {
		const required =
			compiler === COMFY_PROMPT_COMPILER &&
			(field.section === "accessories" ||
				(field.section === "outfit" && field.key === "headwear"));
		return {
			...field,
			required,
			value: traitValue(sources[field.section], field.key, required),
		};
	});
	const required = candidates.filter(
		(field): field is typeof field & { value: string } =>
			field.required && field.value !== null,
	);
	const requiredCost = required.reduce(
		(sum, field) => sum + field.label.length + field.value.length + 4,
		0,
	);
	if (requiredCost > budget)
		throw new ComfyPromptError(
			"COMFY_PROMPT_REQUIRED_BUDGET",
			required.map((field) => `${field.section}.${field.key}`),
			{
				required: limit - budget + requiredCost,
				limit,
				unit: COMFY_PROMPT_LIMIT_UNIT,
			},
		);
	for (const field of candidates.toSorted(
		(a, b) => Number(b.required) - Number(a.required),
	)) {
		const value = field.value;
		if (value === null) continue;
		const clause = `${field.label}: ${value}`;
		const name = `${field.section}.${field.key}`;
		if (clause.length + 2 > budget) {
			dropped.push(name);
			continue;
		}
		budget -= clause.length + 2;
		included.set(name, clause);
	}
	const lines = [head];
	const fields: string[] = [];
	for (const section of SECTIONS) {
		const clauses: string[] = [];
		for (const key of KEY_ORDER[section]) {
			const clause = included.get(`${section}.${key}`);
			if (clause === undefined) continue;
			clauses.push(clause);
			fields.push(`${section}.${key}`);
		}
		if (clauses.length) lines.push(`${clauses.join("; ")}.`);
	}
	lines.push(tail);
	const text = lines.join("\n");
	if (text.length > limit) throw new ComfyPromptError();
	return Object.freeze({
		compiler,
		workflow,
		text,
		sha: createHash("sha256").update(text).digest("hex"),
		limit,
		limitUnit: COMFY_PROMPT_LIMIT_UNIT,
		fields: Object.freeze(fields),
		dropped: Object.freeze(dropped),
	});
}

// Separate entry point: never reinterpret or modify v1-v3 token replay.
export const REFERENCE_PROMPT_COMPILER = "source-preservation-edit.v1" as const;
export function compileReferenceEditPrompt(records: ReferenceIntentRecords) {
	assertReferenceIntent(records);
	const edits = records.intent.value.explicitEdits;
	const lines = [
		"Edit image 1. Preserve the same person, facial features, hair, body, clothing design, composition, framing, pose, head orientation, and gaze shown in image 1, except for the explicit change below. The source image is authoritative for all unedited properties.",
		edits.length === 0
			? "No content changes are authorized. Preserve image 1."
			: "Change only the upper garment color to dark blue. Preserve its shape, material, details, and all other colors and properties in image 1.",
		"Output a portrait PNG on a transparent background with opaque person interiors and natural partially transparent edges. Keep source proportions and composition; use contain padding rather than cropping or stretching for the vertical 2:3 delivery canvas.",
	];
	const text = lines.join("\n");
	return {
		compiler: REFERENCE_PROMPT_COMPILER,
		text,
		sha: hash(Buffer.from(text)),
		imageIndex: 1 as const,
		sourceSHA256: records.manifest.value.sourceSHA256,
		resolvedIntentSHA256: records.intent.sha256,
		fields: edits.map((edit) => edit.field),
		analysisQualified: records.intent.value.analysisQualified,
		ownerApproval: "NONE" as const,
	};
}
