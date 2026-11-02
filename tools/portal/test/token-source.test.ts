import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import { neutralRecord } from "../../portrait/neutral-slots.mjs";
import { selectionSchema, snapshotSchema } from "../src/batches.ts";
import { compileComfyPortraitPrompt } from "../src/comfyui-prompt.ts";
import {
	adaptSheet,
	generationSheetFromBytes,
	hash,
	sheetFromBytes,
} from "../src/sources.ts";

for (const id of ["1017", "1019", "1007"]) {
	test(`live wiki ${id} preserves selected traits through neutral projection and Comfy compilation`, async () => {
		const bytes = await readFile(
			new URL(
				`./fixtures/wiki-live-20261019/person-${id}.fixture`,
				import.meta.url,
			),
		);
		const token = JSON.parse(bytes.toString());
		const detail = Buffer.from(
			JSON.stringify({
				id: token.personId,
				characterId: token.characterId,
				name: token.name,
				detailRoute: `/people/${token.personId}`,
			}),
		);
		const sheet = generationSheetFromBytes(detail, bytes, null);
		const adapted = adaptSheet(sheet, createTransportFixture(), `live-${id}`, {
			kind: "unique",
			variantId: null,
		});
		const rendering = adapted.projection.rendering;
		const look = JSON.parse(
			Buffer.from(adapted.candidate.lookBytes).toString(),
		);
		expect(look.slots).toEqual(token.slots);
		expect(look.identity.ethnicity).toEqual(token.identity.ethnicity);
		expect(look.identity.origin).toEqual(token.identity.origin);
		expect(look.identity.age).toBe(token.identity.age);
		expect(look.identity.ageAsOf).toBe(token.identity.ageAsOf);
		expect(rendering["slots"]).toEqual(token.slots);
		expect(rendering["generationContract"]).toEqual(token.generationContract);
		expect(rendering["artProposal"]).toEqual(token.artProposal);
		expect(look.textToImage).toBeUndefined();
		expect(sheet.tokenBytes).toBe(bytes);
		expect(adapted.provenance.original.token).toBe(hash(bytes));
		expect(adapted.provenance.original.image).toBeNull();
		expect(adapted.projection.sourceSHA).toBe(
			hash(adapted.candidate.lookBytes),
		);
		expect(adapted.candidate.referenceImages.map((r) => r.role)).toEqual([
			"drawing-technique-only",
			"framing-only",
		]);
		const compiled = compileComfyPortraitPrompt(
			rendering,
			"moss-image-sft-style-lora.v1",
		);
		expect(compiled.fields).toContain("outfit.upper");
		expect(compiled.fields).toContain("face.description");
		expect(compiled.fields.includes("identity.origin")).toBe(
			token.identity.origin.status !== "unknown",
		);
		expect(compiled.sha).toBe(hash(Buffer.from(compiled.text)));
		expect(JSON.parse(bytes.toString())).toEqual(token);
	});
}

test("live traits reject malformed derived provenance and measurement units", async () => {
	const token = JSON.parse(
		await readFile(
			new URL(
				"./fixtures/wiki-live-20261019/person-1017.fixture",
				import.meta.url,
			),
			"utf8",
		),
	);
	const {
		textToImage: _history,
		style: _style,
		references: _refs,
		image: _image,
		imageReview: _review,
		...authored
	} = token;
	for (const bad of [
		{ ...token.slots.face.description, derived: false },
		{ ...token.slots.face.description, derived: undefined },
		{ ...token.slots.face.description, source: "   " },
		{ ...token.slots.face.description, status: "art-proposal" },
	])
		expect(() =>
			neutralRecord(authored, { face: { description: bad } }),
		).toThrow();
	for (const bad of [
		{ ...token.slots.body.height, value: 170, unit: null },
		{ ...token.slots.body.height, value: 170, unit: " " },
		{ ...token.slots.body.height, unit: "cm" },
		{ ...token.slots.body.height, unit: undefined },
	])
		expect(() => neutralRecord(authored, { body: { height: bad } })).toThrow();
	expect(neutralRecord(authored).slots).toEqual(token.slots);
});

test("published legacy token registration history does not block authored traits", async () => {
	const bytes = await readFile(
		new URL(
			"../../../ART-ASSETS/portrait-references/wiki-people/tokens/person-1017.json",
			import.meta.url,
		),
	);
	const token = JSON.parse(bytes.toString());
	const detail = Buffer.from(
		JSON.stringify({
			id: token.personId,
			characterId: token.characterId,
			name: token.name,
			detailRoute: `/people/${token.personId}`,
		}),
	);
	const sheet = generationSheetFromBytes(detail, bytes, null);
	const adapted = adaptSheet(
		sheet,
		createTransportFixture(),
		"b385e070-2346-4dde-8470-90eeef7b68e1",
		{ kind: "unique", variantId: null },
	);
	expect(sheet.tokenBytes).toEqual(bytes);
	expect(sheet.sourceHashes.image).toBeNull();
	expect(adapted.candidate.referenceImages.map((r) => r.role)).toEqual([
		"drawing-technique-only",
		"framing-only",
	]);
	expect(
		JSON.parse(Buffer.from(adapted.candidate.lookBytes).toString()).slots.hair
			.description.value,
	).toBe(token.artProposal.hair);
});

const detail = Buffer.from(
	' \n{"id":"person-1017","characterId":"K1017","name":"Token source","detailRoute":"/people/person-1017"}\n',
);
const legacy = {
	schemaVersion: 1,
	personId: "person-1017",
	characterId: "K1017",
	name: "Token source",
	artProposal: {
		hair: "wine hair with left braid",
		upper: "dark coat",
		lower: "trousers",
		footwear: "boots",
	},
};
const token = Buffer.from(` \n${JSON.stringify(legacy, null, 2)}\n`);

test("token-only source retains original bytes and maps actual legacy proposals without a photo", () => {
	const sheet = generationSheetFromBytes(detail, token, null);
	expect(sheet.detailBytes).toBe(detail);
	expect(sheet.tokenBytes).toBe(token);
	expect(sheet.sourceHashes).toEqual({
		detail: hash(detail),
		token: hash(token),
		image: null,
	});
	expect(sheet.imageBytes).toBeNull();
	expect(sheet.token).toEqual(legacy);
	const fixture = createTransportFixture();
	const adapted = adaptSheet(
		sheet,
		{ candidate: fixture.candidate, operatorPins: fixture.operatorPins },
		"token-source-request",
		{ kind: "unique", variantId: null },
	);
	const look = JSON.parse(Buffer.from(adapted.candidate.lookBytes).toString());
	expect(look.slots.hair.description.value).toBe(legacy.artProposal.hair);
	expect(look.slots.hair.description.status).toBe("art-proposal");
	expect(
		adapted.candidate.referenceImages.some(
			(r) => r.role === "individual-face-only",
		),
	).toBe(false);
	expect(adapted.provenance.original.image).toBeNull();
});

test("generation supports rich slots and rejects identity drift without weakening originals", () => {
	const fixture = createTransportFixture();
	const rich = {
		...JSON.parse(Buffer.from(fixture.candidate.lookBytes).toString()),
		...legacy,
		schemaVersion: 2,
		identity: { characterId: legacy.characterId, name: legacy.name },
	};
	const sheet = generationSheetFromBytes(
		detail,
		Buffer.from(JSON.stringify(rich)),
		null,
	);
	expect(sheet.token.slots).toEqual(rich.slots);
	expect(() =>
		generationSheetFromBytes(
			detail,
			Buffer.from(JSON.stringify({ ...legacy, characterId: "K1009" })),
			null,
		),
	).toThrow("SHEET_IDENTITY_MISMATCH");
	expect(() =>
		generationSheetFromBytes(
			detail,
			Buffer.from(
				JSON.stringify({
					...legacy,
					identity: { characterId: "K1009", name: legacy.name },
				}),
			),
			null,
		),
	).toThrow("SHEET_IDENTITY_MISMATCH");
	expect(() => sheetFromBytes(detail, token, new Uint8Array())).toThrow();
});

test("batch source mode and image hash agree and historical photo selections remain accepted", () => {
	const selection = {
		personId: legacy.personId,
		characterId: legacy.characterId,
		name: legacy.name,
		wikiDetailSHA: hash(detail),
		originalSourceHashes: {
			detail: hash(detail),
			token: hash(token),
			image: null,
		},
	};
	expect(
		selectionSchema.safeParse({ ...selection, sourceMode: "design-token-only" })
			.success,
	).toBe(true);
	expect(
		selectionSchema.safeParse({ ...selection, sourceMode: "original-photo" })
			.success,
	).toBe(false);
	expect(
		selectionSchema.safeParse({
			...selection,
			originalSourceHashes: {
				...selection.originalSourceHashes,
				image: hash(token),
			},
		}).success,
	).toBe(true);
	const imageField = snapshotSchema.shape.files.shape.image;
	expect(imageField.safeParse(null).success).toBe(true);
	expect(imageField.safeParse(undefined).success).toBe(true);
	expect(imageField.safeParse(hash(token)).success).toBe(true);
});
