import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import { dirname, isAbsolute, resolve, sep } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import {
	operatorPinsSchema,
	type PortraitCandidate,
	type PortraitOperatorPins,
	parseBoundJson,
	portraitCandidateSchema,
	preparePortraitConditions,
} from "../../portrait/generator/src/preflight.ts";
import { projectPortrait } from "../../portrait/generator/src/projection.ts";
import { neutralRecord } from "../../portrait/neutral-slots.mjs";
import {
	DetailIdentitySchema,
	importOriginals,
	openOriginalsStore,
	readOriginalImage,
	readOriginalJson,
	TokenIdentitySchema,
} from "../../people-cli/src/store.ts";
import { measurePng } from "./png.ts";
export const hash = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
const originalBase64 = (max: number) =>
	z
		.string()
		.max(Math.ceil(max / 3) * 4)
		.refine((value) => {
			const bytes = Buffer.from(value, "base64");
			return (
				bytes.length > 0 &&
				bytes.length <= max &&
				bytes.toString("base64") === value
			);
		});
const originalHash = z.string().regex(/^[a-f0-9]{64}$/);
export const registrationSchema = z.strictObject({
	personId: z.string().regex(/^person-\d+$/),
	detailBase64: originalBase64(1048576),
	tokenBase64: originalBase64(1048576),
	imageBase64: originalBase64(8388608),
	detailSha256: originalHash,
	tokenSha256: originalHash,
	imageSha256: originalHash,
});
export function registrationSheet(input: z.infer<typeof registrationSchema>) {
	const sheet = sheetFromBytes(
		Buffer.from(input.detailBase64, "base64"),
		Buffer.from(input.tokenBase64, "base64"),
		Buffer.from(input.imageBase64, "base64"),
	);
	if (sheet.personId !== input.personId) throw Error("SHEET_IDENTITY_MISMATCH");
	if (
		sheet.sourceHashes.detail !== input.detailSha256 ||
		sheet.sourceHashes.token !== input.tokenSha256 ||
		sheet.sourceHashes.image !== input.imageSha256
	)
		throw Error("SOURCE_HASH_MISMATCH");
	return sheet;
}
export type Sheet = {
	personId: string;
	characterId: string;
	name: string;
	detail: Record<string, unknown>;
	token: Record<string, unknown> & {
		slots?: unknown;
		generationContract?: unknown;
	};
	detailBytes: Uint8Array;
	tokenBytes: Uint8Array;
	imageBytes: Uint8Array;
	sourceHashes: { detail: string; token: string; image: string };
};
export type Template = {
	candidate: PortraitCandidate;
	operatorPins: PortraitOperatorPins;
};
export type GenerationSheet = Omit<Sheet, "imageBytes" | "sourceHashes"> & {
	imageBytes: Uint8Array | null;
	sourceHashes: { detail: string; token: string; image: string | null };
	sourceProvenance?: Record<string, unknown>;
};
export function generationLook(token: Record<string, unknown>) {
	// Published portrait tokens retain registration/style history that is not
	// an authored character trait. Preserve it in raw source bytes, not in the
	// character-schema input; it cannot certify an acquired identity image.
	const look = { ...token };
	for (const key of [
		"references",
		"style",
		"image",
		"imageReview",
		"textToImage",
	])
		delete look[key];
	return neutralRecord(look);
}
export function generationSheetFromBytes(
	detailBytes: Uint8Array,
	tokenBytes: Uint8Array,
	imageBytes: Uint8Array | null,
): GenerationSheet {
	const detail = parseBoundJson(
		detailBytes,
		z.object({
			id: z.string().regex(/^person-\d+$/),
			name: z.string().min(1),
			characterId: z
				.string()
				.regex(/^K\d+$/)
				.optional(),
			familyTree: z.object({ personId: z.string() }).optional(),
			detailRoute: z.string(),
		}),
	);
	const token = parseBoundJson(
		tokenBytes,
		z
			.object({
				personId: z.string().regex(/^person-\d+$/),
				characterId: z.string().regex(/^K\d+$/),
				name: z.string().min(1),
			})
			.passthrough(),
	);
	if (
		detail.id !== token.personId ||
		detail.name !== token.name ||
		(detail.characterId ?? detail.familyTree?.personId) !== token.characterId ||
		(detail.familyTree && detail.familyTree.personId !== token.characterId) ||
		detail.detailRoute !== `/people/${token.personId}`
	)
		throw Error("SHEET_IDENTITY_MISMATCH");
	const normalized = generationLook(token);
	if (
		normalized.characterId !== token.characterId ||
		normalized.name !== token.name
	)
		throw Error("SHEET_IDENTITY_MISMATCH");
	if (imageBytes !== null) {
		measurePng(imageBytes);
		const image = z
			.object({ sha256: originalHash })
			.parse(Reflect.get(token, "image"));
		if (image.sha256 !== hash(imageBytes))
			throw Error("SHEET_IDENTITY_MISMATCH");
	}
	return {
		personId: token.personId,
		characterId: token.characterId,
		name: token.name,
		detail: parseBoundJson(detailBytes, z.record(z.string(), z.unknown())),
		token,
		detailBytes,
		tokenBytes,
		imageBytes,
		sourceHashes: {
			detail: hash(detailBytes),
			token: hash(tokenBytes),
			image: imageBytes === null ? null : hash(imageBytes),
		},
	};
}
export function sheetFromBytes(
	detailBytes: Uint8Array,
	tokenBytes: Uint8Array,
	imageBytes: Uint8Array,
): Sheet {
	const detail = parseBoundJson(detailBytes, DetailIdentitySchema),
		token = parseBoundJson(tokenBytes, TokenIdentitySchema);
	measurePng(imageBytes);
	if (
		detail.id !== token.personId ||
		detail.name !== token.name ||
		detail.familyTree.personId !== token.characterId ||
		detail.detailRoute !== `/people/${token.personId}` ||
		token.image.sha256 !== hash(imageBytes)
	)
		throw Error("SHEET_IDENTITY_MISMATCH");
	const detailFull = parseBoundJson(
			detailBytes,
			z.record(z.string(), z.unknown()),
		),
		tokenFull = parseBoundJson(tokenBytes, z.record(z.string(), z.unknown()));
	return {
		personId: token.personId,
		characterId: token.characterId,
		name: token.name,
		detail: detailFull,
		token: tokenFull,
		detailBytes,
		tokenBytes,
		imageBytes,
		sourceHashes: {
			detail: hash(detailBytes),
			token: hash(tokenBytes),
			image: hash(imageBytes),
		},
	};
}
export function openCharacters(path: string) {
	const db = new DatabaseSync(path, { readOnly: true });
	function get(id: string) {
		db.exec("BEGIN");
		try {
			const d = readOriginalJson(db, id, "detail"),
				t = readOriginalJson(db, id, "token"),
				i = readOriginalImage(db, id);
			if (!d || !t || !i) throw Error("NOT_FOUND");
			const sheet = sheetFromBytes(d.bytes, t.bytes, i.bytes);
			const person = z
				.object({ character_id: z.string(), name: z.string() })
				.parse(
					db
						.prepare("SELECT character_id, name FROM people WHERE person_id=?")
						.get(id),
				);
			if (
				sheet.personId !== id ||
				person?.character_id !== sheet.characterId ||
				person?.name !== sheet.name ||
				d.sha256 !== sheet.sourceHashes.detail ||
				t.sha256 !== sheet.sourceHashes.token ||
				i.sha256 !== sheet.sourceHashes.image
			)
				throw Error("SHEET_IDENTITY_MISMATCH");
			db.exec("COMMIT");
			return sheet;
		} catch (error) {
			db.exec("ROLLBACK");
			throw error;
		}
	}
	return {
		getReference(id: string) {
			if (!db.prepare("SELECT 1 FROM people WHERE person_id=?").get(id))
				return null;
			return get(id);
		},
		list() {
			return z
				.array(
					z.object({
						person_id: z.string(),
						character_id: z.string(),
						name: z.string(),
					}),
				)
				.parse(
					db
						.prepare(
							"SELECT person_id,character_id,name FROM people ORDER BY person_id",
						)
						.all(),
				)
				.filter((r) => {
					try {
						get(r.person_id);
						return true;
					} catch {
						return false;
					}
				})
				.map((r) => ({
					personId: r.person_id,
					characterId: r.character_id,
					name: r.name,
				}));
		},
		get,
		register(input: z.infer<typeof registrationSchema>) {
			const sheet = registrationSheet(input);
			const writer = openOriginalsStore(path);
			try {
				importOriginals(writer, [
					{
						personId: sheet.personId,
						characterId: sheet.characterId,
						name: sheet.name,
						detail: {
							url: `portal:originals/${sheet.personId}/detail`,
							bytes: sheet.detailBytes,
							sha256: sheet.sourceHashes.detail,
						},
						token: {
							url: `portal:originals/${sheet.personId}/token`,
							bytes: sheet.tokenBytes,
							sha256: sheet.sourceHashes.token,
						},
						image: {
							url: `portal:originals/${sheet.personId}/image`,
							bytes: sheet.imageBytes,
							sha256: sheet.sourceHashes.image,
						},
					},
				]);
				return {
					personId: sheet.personId,
					characterId: sheet.characterId,
					name: sheet.name,
					sourceHashes: sheet.sourceHashes,
					revisions: {
						detail: readOriginalJson(writer, sheet.personId, "detail")
							?.sequence,
						token: readOriginalJson(writer, sheet.personId, "token")?.sequence,
						image: readOriginalImage(writer, sheet.personId)?.sequence,
					},
				};
			} finally {
				writer.close();
			}
		},
		close() {
			db.close();
		},
	};
}
export async function loadTemplate(
	manifestPath: string,
	pinsPath: string,
): Promise<Template> {
	const manifest = parseBoundJson(
		new Uint8Array(await readFile(manifestPath)),
		z
			.object({
				rule: z.object({ path: z.string() }),
				reference: z.object({ path: z.string() }),
				look: z.object({ path: z.string() }),
				referenceImages: z.array(
					z
						.object({
							id: z.string(),
							role: z.string(),
							path: z.string(),
							sameOwnerRecipient: z.boolean().optional(),
							allowedProperties: z.array(z.string()).optional(),
							sourceHash: z.string().optional(),
						})
						.strict(),
				),
				composition: z.unknown(),
			})
			.strict(),
	);
	const root = await realpath(dirname(manifestPath));
	const artifact = async (path: string) => {
		if (isAbsolute(path) || path.split(/[\\/]/).includes(".."))
			throw Error("INVALID_TEMPLATE_PATH");
		const actual = await realpath(resolve(root, path));
		if (!actual.startsWith(root + sep)) throw Error("INVALID_TEMPLATE_PATH");
		return new Uint8Array(await readFile(actual));
	};
	const candidate = portraitCandidateSchema.parse({
		ruleBytes: await artifact(manifest.rule.path),
		positionReferenceBytes: await artifact(manifest.reference.path),
		lookBytes: await artifact(manifest.look.path),
		referenceImages: await Promise.all(
			manifest.referenceImages.map(async ({ path, ...r }) => ({
				...r,
				bytes: await artifact(path),
			})),
		),
		composition: manifest.composition,
	});
	const operatorPins = parseBoundJson(
		new Uint8Array(await readFile(pinsPath)),
		operatorPinsSchema,
	);
	preparePortraitConditions(candidate, operatorPins);
	return { candidate, operatorPins };
}
export function adaptSheet(
	sheet: GenerationSheet,
	template: Template,
	requestId: string,
	faceMode: { kind: "unique"; variantId: null },
	// Explicit operator transport. The default is the OpenAI-compatible GPT alias;
	// a ComfyUI workflow records `comfyui:<workflow>` and transports text only.
	operatorProviderModel: string = "gpt-image-2.5-sunburst",
) {
	const neutral = generationLook(sheet.token);
	const slots = z
		.record(z.string(), z.record(z.string(), z.unknown()))
		.parse(neutral.slots);
	const adaptedSlots: Record<string, Record<string, unknown>> & {
		body?: Record<string, unknown>;
	} = structuredClone(slots);
	const body = adaptedSlots.body;
	if (body)
		for (const field of ["weight", "height"]) {
			const trait = body[field];
			if (
				trait &&
				typeof trait === "object" &&
				"value" in trait &&
				trait.value === null &&
				"unit" in trait &&
				trait.unit === null
			)
				delete trait.unit;
		}
	const look = {
		...neutral,
		lookId: requestId,
		faceMode,
		slots: adaptedSlots,
	};
	const lookBytes = new TextEncoder().encode(JSON.stringify(look));
	const references = template.candidate.referenceImages.filter((r) =>
		["drawing-technique-only", "framing-only"].includes(r.role),
	);
	if (sheet.imageBytes !== null)
		references.push({
			id: `${sheet.characterId}-face`,
			role: "individual-face-only",
			bytes: new Uint8Array(sheet.imageBytes),
		});
	const candidate = {
		...template.candidate,
		lookBytes,
		referenceImages: references,
	};
	const pins = {
		...template.operatorPins,
		lookSHA: hash(lookBytes),
		referenceImages: references.map((r) => ({
			id: r.id,
			sha256: hash(r.bytes),
		})),
	};
	const prepared = preparePortraitConditions(candidate, pins);
	const projection = projectPortrait({
		candidate,
		operatorPins: pins,
		prepared,
	});
	return {
		candidate,
		pins,
		projection,
		provenance: {
			schema: "portal-source-adapter.v1",
			original: sheet.sourceHashes,
			sourceProvenance: sheet.sourceProvenance,
			derivedLookSHA: hash(lookBytes),
			authoredGenerationContract: sheet.token.generationContract,
			operatorProviderModel,
			modelMapping: operatorProviderModel.startsWith("comfyui:")
				? "Explicit operator-selected ComfyUI text-draft workflow; only the projected text is transported, no reference images; original authored generationContract remains unchanged"
				: "Explicit operator-selected transport alias; original authored generationContract remains unchanged",
			faceMode,
			requestId,
		},
	};
}
