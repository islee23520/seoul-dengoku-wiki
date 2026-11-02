import { createHash } from "node:crypto";
import { z } from "zod";
import {
	type operatorPinsSchema,
	parseBoundJson,
	type portraitCandidateSchema,
	preparePortraitConditions,
} from "./preflight.js";
import {
	assertPreparedProjection,
	createProjectionInputSchema,
	ProjectionError,
} from "./projection-ingress.js";

export {
	ProjectionError,
	type ProjectionErrorCode,
} from "./projection-ingress.js";

export const projectionInputSchema = createProjectionInputSchema();

export type ProjectionInput = Readonly<{
	candidate: z.input<typeof portraitCandidateSchema>;
	operatorPins: z.input<typeof operatorPinsSchema>;
	prepared: Readonly<{
		artifactHashes: Readonly<{
			rule: string;
			positionReference: string;
			look: string;
			referenceImages: readonly string[];
		}>;
		positionMetrics: Readonly<Record<string, unknown>>;
		providerCalls: 0;
		dispatched: false;
	}>;
}>;
export type ProjectionResult = Readonly<{
	rendering: Readonly<Record<string, unknown>> & {
		readonly references?: readonly Readonly<{
			id: string;
			role: string;
			properties: readonly string[];
		}>[];
	};
	text: string;
	sourceSHA: string;
	renderingSHA: string;
	textSHA: string;
	providerCalls: 0;
	dispatched: false;
}>;

const slotFields = {
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
	body: ["build", "weight", "bustSize", "height", "skin"],
	outfit: ["headwear", "upper", "lower", "footwear", "marks", "neckline"],
	accessories: ["description", "shape", "color", "material", "mounting"],
} as const;

const traitSchema = z
	.object({
		value: z.union([z.string(), z.number().refine(Number.isFinite), z.null()]),
		status: z.enum([
			"approved",
			"authored-draft",
			"art-proposal",
			"derived-proposal",
			"unknown",
		]),
		source: z
			.string()
			.refine((value) => value.trim().length > 0)
			.nullable(),
		unit: z.string().nullable().optional(),
		derived: z.boolean().optional(),
	})
	.strict()
	.refine((trait) =>
		trait.status === "unknown"
			? (trait.value === null || trait.value === "unconfirmed") &&
				trait.source === null
			: trait.value !== null && trait.source !== null,
	)
	.refine((trait) =>
		trait.status === "derived-proposal"
			? trait.derived === true &&
				(typeof trait.value !== "string" || trait.value.trim().length > 0)
			: trait.derived !== true,
	);

const measurementSchema = traitSchema.refine(
	(trait) =>
		trait.value === null ||
		(typeof trait.value === "number" &&
			typeof trait.unit === "string" &&
			trait.unit.trim().length > 0) ||
		(typeof trait.value === "string" && trait.unit === null),
);

const nonblankSchema = z.string().refine((value) => value.trim().length > 0);
const provenanceSchema = z
	.object({
		path: nonblankSchema,
		pointer: z
			.string()
			.refine((value) => value === "" || value.startsWith("/")),
		sha256: z.string().regex(/^[a-f0-9]{64}$/),
	})
	.catchall(z.unknown());
const faceModeSchema = z.discriminatedUnion("kind", [
	z.object({ kind: z.literal("unique"), variantId: z.null() }).strict(),
	z.object({ kind: z.literal("template"), variantId: nonblankSchema }).strict(),
]);
const uniqueFaceIds = [
	"K1009",
	"K1010",
	"K998",
	"K1003",
	"K1007",
	"K1008",
	"K1018",
	"K1017",
	"K1019",
	"K1004",
];

const lookSchema = z
	.object({
		schemaVersion: z.union([z.literal(1), z.literal(2)]),
		characterId: z.string().min(1),
		name: z.string().min(1),
		personId: z.string().nullable().optional(),
		lookId: z.string().min(1),
		faceMode: faceModeSchema,
		uniqueFaceRequired: z.boolean().nullable().optional(),
		sourceRefs: z.array(z.string()).optional(),
		canonicalContext: z
			.object({
				characterId: nonblankSchema,
				name: nonblankSchema,
				personId: nonblankSchema,
				registry: provenanceSchema,
				background: z.array(provenanceSchema.extend({ text: z.string() })),
			})
			.catchall(z.unknown())
			.nullable()
			.optional(),
		identity: z
			.object({
				characterId: z.string().min(1),
				name: z.string().min(1),
				ethnicity: traitSchema.optional(),
				origin: traitSchema.optional(),
				gender: traitSchema.optional(),
				ageCategory: traitSchema.optional(),
			})
			.catchall(z.unknown()),
		slots: z
			.object({
				face: z
					.object(
						Object.fromEntries(
							slotFields.face.map((field) => [field, traitSchema]),
						),
					)
					.strict(),
				hair: z
					.object(
						Object.fromEntries(
							slotFields.hair.map((field) => [field, traitSchema]),
						),
					)
					.strict(),
				body: z
					.object(
						Object.fromEntries(
							slotFields.body.map((field) => [
								field,
								field === "weight" || field === "height"
									? measurementSchema
									: traitSchema,
							]),
						),
					)
					.strict(),
				outfit: z
					.object(
						Object.fromEntries(
							slotFields.outfit.map((field) => [field, traitSchema]),
						),
					)
					.strict(),
				accessories: z
					.object(
						Object.fromEntries(
							slotFields.accessories.map((field) => [field, traitSchema]),
						),
					)
					.strict(),
			})
			.strict(),
	})
	.catchall(z.unknown())
	.refine(
		(look) =>
			look.characterId === look.identity.characterId &&
			look.name === look.identity.name,
	)
	.refine(
		(look) =>
			look.faceMode.kind !== "template" ||
			(!look.uniqueFaceRequired && !uniqueFaceIds.includes(look.characterId)),
	)
	.refine(
		(look) =>
			look.canonicalContext == null ||
			(["characterId", "name", "personId"] as const).every(
				(key) =>
					look.canonicalContext?.[key] === look[key] &&
					(look.identity[key] === undefined ||
						look.canonicalContext?.[key] === look.identity[key]),
			),
	)
	.refine(
		(look) =>
			!Object.keys(look).some((key) =>
				["prompt", "text", "description"].includes(key),
			),
	);

const hash = (bytes: Uint8Array): string =>
	createHash("sha256").update(bytes).digest("hex");

const parseLookArtifact = (
	lookBytes: Uint8Array,
): z.infer<typeof lookSchema> => {
	try {
		return parseBoundJson(lookBytes, lookSchema);
	} catch (error) {
		if (
			error instanceof z.ZodError ||
			error instanceof SyntaxError ||
			error instanceof TypeError
		) {
			throw new ProjectionError("INVALID_LOOK");
		}
		throw error;
	}
};

export function projectPortrait(input: ProjectionInput): ProjectionResult {
	let parsed: z.infer<typeof projectionInputSchema>;
	try {
		parsed = projectionInputSchema.parse(input);
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new ProjectionError("INVALID_PROJECTION_INPUT");
		}
		throw error;
	}
	assertPreparedProjection(parsed);
	const prepared = preparePortraitConditions(
		parsed.candidate,
		parsed.operatorPins,
	);
	const look = parseLookArtifact(parsed.candidate.lookBytes);
	if (Object.hasOwn(look, "output")) {
		const authoredOutput = z
			.object({
				width: z.literal(1024),
				height: z.literal(1536),
				unit: z.literal("px"),
				format: z.literal("png"),
				background: z.literal("transparent"),
			})
			.passthrough()
			.safeParse(Reflect.get(look, "output"));
		if (!authoredOutput.success) throw new ProjectionError("INVALID_LOOK");
	}
	if (
		parsed.candidate.referenceImages.some(
			(reference) =>
				(reference.role === "individual-face-only" &&
					look.faceMode.kind !== "unique") ||
				(reference.role === "face-base-only" &&
					look.faceMode.kind !== "template"),
		)
	) {
		throw new ProjectionError("INVALID_LOOK");
	}
	const references = parsed.candidate.referenceImages.map(
		(reference, index) => ({
			id: reference.id,
			role: reference.role,
			properties: reference.allowedProperties ?? [],
			sourceSHA: prepared.artifactHashes.referenceImages[index],
		}),
	);
	const position = Object.fromEntries(
		Object.entries(prepared.positionMetrics).map(([name, metric]) => [
			name,
			{
				meanMidpoint: metric.meanMidpoint,
				meanInterval: metric.meanInterval,
				inner: metric.inner,
				outer: metric.outer,
			},
		]),
	);
	const rendering = {
		...look,
		output: Reflect.get(look, "output") ?? {
			width: 1024,
			height: 1536,
			unit: "px",
			format: "png",
			background: "transparent",
		},
		schemaVersion: look.schemaVersion,
		characterId: look.characterId,
		name: look.name,
		personId: look.personId,
		identity: look.identity,
		lookId: look.lookId,
		faceMode: look.faceMode,
		sourceRefs: look.sourceRefs,
		canonicalContext: look.canonicalContext,
		slots: look.slots,
		position,
		references,
	};
	const renderingBytes = new TextEncoder().encode(JSON.stringify(rendering));
	const text = `${JSON.stringify(rendering, null, 2).split("\n").join("\r\n")}\r\n`;
	const textBytes = new TextEncoder().encode(text);
	return {
		rendering,
		text,
		sourceSHA: hash(parsed.candidate.lookBytes),
		renderingSHA: hash(renderingBytes),
		textSHA: hash(textBytes),
		providerCalls: 0,
		dispatched: false,
	};
}
