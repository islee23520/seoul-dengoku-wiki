import { beforeAll, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { encodePng } from "../../portrait/acceptance/src/png.ts";
import {
	referenceGenerationRequestSchema,
	resolveReferenceSource,
	sourceAcquisitionSchema,
} from "../src/reference-contract.ts";

const sourceSHA256 =
	"93e45d8525c4616ef1a174b171403ddd95eebf048fba818a0a80f0c24295b306";
const hash = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
const recipient = { personId: "person-0998", characterId: "K998" };
const edit = {
	field: "outfit.upper.color",
	operation: "replace",
	value: "dark blue",
} as const;
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
	explicitEdits: [],
	provider: "openai-compatible",
	providerModel: "gpt-image-2.5-sunburst",
	size: "340x510",
	faceMode: { kind: "unique", variantId: null },
};
const tokenRequest = {
	...request,
	inputMode: "token-only",
	sourceSelection: {
		kind: "intentional-absence",
		reason: "no-reference-available",
	},
};
let retainedPng: Uint8Array;
let retainedToken: Uint8Array;
beforeAll(async () => {
	const { REFERENCE_CONTRACT_K998_PNG } = process.env;
	retainedPng = await readFile(
		REFERENCE_CONTRACT_K998_PNG ??
			new URL(
				"../../../ART-ASSETS/portrait-references/wiki-people/images/person-0998.png",
				import.meta.url,
			),
	);
	retainedToken = await readFile(
		new URL(
			"../../../ART-ASSETS/portrait-references/wiki-people/tokens/person-0998.json",
			import.meta.url,
		),
	);
	// An unhydrated checkout must fail, not silently replace the real PNG fixture.
	expect(hash(retainedPng)).toBe(sourceSHA256);
});
const evidence = () => ({
	status: "available",
	recipient: { ...recipient },
	tokenBytes: new Uint8Array(retainedToken),
	tokenSHA256: hash(retainedToken),
	recipientImage: {
		...recipient,
		sourceSHA256,
		bytes: new Uint8Array(retainedPng),
	},
});

test("acquires retained K998 only after real PNG decoding and identity binding", () => {
	const source = evidence();
	const result = resolveReferenceSource(request, source);
	expect(result.status).toBe("acquired");
	if (result.status !== "acquired") throw new Error("Expected acquisition");
	expect(result.generation).toMatchObject({
		...recipient,
		inputMode: "reference-img2img",
		role: "source-preservation",
		preservedProperties: ["person", "outfit", "composition"],
		explicitEdits: [],
		recipientImage: { ...recipient, sourceSHA256, width: 1160, height: 1355 },
	});
	expect(hash(result.generation.recipientImage.bytes)).toBe(sourceSHA256);
	expect(sourceAcquisitionSchema.safeParse(result).success).toBe(true);
});

test("allows only the explicit upper color replacement in source mode", () => {
	const result = resolveReferenceSource(
		{ ...request, explicitEdits: [edit] },
		evidence(),
	);
	expect(result.generation?.explicitEdits).toEqual([edit]);
});

test("keeps verified bytes stable when acquisition buffers are later dirtied", () => {
	const source = evidence();
	const result = resolveReferenceSource(request, source);
	source.recipientImage.bytes.fill(0);
	source.tokenBytes.fill(0);
	expect(result.status).toBe("acquired");
	if (result.status !== "acquired") throw new Error("Expected acquisition");
	expect(hash(result.generation.recipientImage.bytes)).toBe(sourceSHA256);
	expect(hash(result.generation.tokenBytes)).toBe(hash(retainedToken));
});

test("binds explicit image omission to raw tokens even when tokens advertise a photo", () => {
	const result = resolveReferenceSource(tokenRequest, {
		...evidence(),
		recipientImage: null,
	});
	expect(result).toMatchObject({
		status: "intentional-absence",
		reason: "no-reference-available",
		generation: {
			inputMode: "token-only",
			recipientImage: null,
			explicitEdits: [],
			tokenSHA256: hash(retainedToken),
		},
	});
	expect(result.generation?.tokenBytes).toEqual(new Uint8Array(retainedToken));
});

test("accepts the fixed no-photo recipient only with explicit absence", () => {
	const noPhoto = { personId: "person-900001", characterId: "K900001" };
	const tokenBytes = Buffer.from(
		JSON.stringify({
			...noPhoto,
			name: "reference-plan-no-photo",
			image: null,
			gender: "unknown",
			face: "unknown",
			outfit: "dark blue work jacket",
		}),
	);
	const result = resolveReferenceSource(
		{ ...tokenRequest, personId: noPhoto.personId },
		{
			status: "available",
			recipient: noPhoto,
			tokenBytes,
			tokenSHA256: hash(tokenBytes),
			recipientImage: null,
		},
	);
	expect(result.status).toBe("intentional-absence");
	expect(result.generation?.recipientImage).toBeNull();
});

const requestFailures = [
	[
		"unknown mode",
		{ ...request, inputMode: "automatic" },
		"INVALID_REFERENCE_REQUEST",
	],
	[
		"token with selected source",
		{ ...request, inputMode: "token-only" },
		"MODE_SOURCE_MISMATCH",
	],
	[
		"reference with absence",
		{ ...tokenRequest, inputMode: "reference-img2img" },
		"MODE_SOURCE_MISMATCH",
	],
	[
		"null selection",
		{ ...request, sourceSelection: null },
		"INVALID_REFERENCE_REQUEST",
	],
	[
		"missing edits",
		{ ...request, explicitEdits: undefined },
		"EDIT_FIELD_UNSUPPORTED",
	],
	[
		"jaw edit",
		{
			...request,
			explicitEdits: [
				{ field: "face.jaw", operation: "replace", value: "round" },
			],
		},
		"EDIT_FIELD_UNSUPPORTED",
	],
	[
		"token edit",
		{ ...tokenRequest, explicitEdits: [edit] },
		"EDIT_FIELD_UNSUPPORTED",
	],
	[
		"duplicate edit",
		{ ...request, explicitEdits: [edit, edit] },
		"EDIT_FIELD_UNSUPPORTED",
	],
	[
		"free-text edit",
		{ ...request, explicitEdits: [{ ...edit, prompt: "override" }] },
		"EDIT_FIELD_UNSUPPORTED",
	],
	[
		"client acquisition",
		{ ...request, acquired: true },
		"INVALID_REFERENCE_REQUEST",
	],
	[
		"client source status",
		{
			...request,
			sourceSelection: { ...request.sourceSelection, status: "acquired" },
		},
		"INVALID_REFERENCE_REQUEST",
	],
	[
		"source URL",
		{
			...request,
			sourceSelection: {
				...request.sourceSelection,
				url: "https://example.com/source.png",
			},
		},
		"INVALID_REFERENCE_REQUEST",
	],
	[
		"source path",
		{
			...request,
			sourceSelection: { ...request.sourceSelection, path: "/tmp/source.png" },
		},
		"INVALID_REFERENCE_REQUEST",
	],
	[
		"face override",
		{ ...request, faceMode: { ...request.faceMode, gaze: "camera" } },
		"INVALID_REFERENCE_REQUEST",
	],
	[
		"two recipients",
		{ ...request, sheetId: request.requestId },
		"INVALID_REFERENCE_REQUEST",
	],
	[
		"wrong selected person",
		{
			...request,
			sourceSelection: { ...request.sourceSelection, personId: "person-1003" },
		},
		"REFERENCE_IDENTITY_MISMATCH",
	],
	[
		"stale selection pin",
		{
			...request,
			sourceSelection: {
				...request.sourceSelection,
				sourceSHA256: "0".repeat(64),
			},
		},
		"REFERENCE_HASH_MISMATCH",
	],
] as const;
for (const [name, input, errorCode] of requestFailures) {
	test(`returns no generation input for ${name}`, () => {
		const result = resolveReferenceSource(input, evidence());
		expect(result).toMatchObject({
			status: "failed",
			errorCode,
			generation: null,
		});
	});
}

for (const [name, modify, errorCode] of [
	[
		"missing PNG",
		() => ({ ...evidence(), recipientImage: null }),
		"REFERENCE_NOT_ACQUIRED",
	],
	[
		"failed acquisition",
		() => ({ status: "failed", reason: "not-found" }),
		"REFERENCE_NOT_ACQUIRED",
	],
	[
		"wrong image person",
		() => {
			const s = evidence();
			s.recipientImage.personId = "person-1003";
			return s;
		},
		"REFERENCE_IDENTITY_MISMATCH",
	],
	[
		"wrong image character",
		() => {
			const s = evidence();
			s.recipientImage.characterId = "K1003";
			return s;
		},
		"REFERENCE_IDENTITY_MISMATCH",
	],
	[
		"wrong recipient",
		() => ({
			...evidence(),
			recipient: { personId: "person-1003", characterId: "K1003" },
		}),
		"REFERENCE_IDENTITY_MISMATCH",
	],
	[
		"dirty image bytes",
		() => {
			const s = evidence();
			s.recipientImage.bytes.fill(0);
			return s;
		},
		"REFERENCE_HASH_MISMATCH",
	],
	[
		"dirty token bytes",
		() => ({ ...evidence(), tokenBytes: Buffer.from("{}") }),
		"REFERENCE_TOKEN_MISMATCH",
	],
	[
		"template-only bytes",
		() => ({
			status: "available",
			recipient,
			templateImages: [retainedPng],
			tokenBytes: retainedToken,
			tokenSHA256: hash(retainedToken),
			recipientImage: null,
		}),
		"REFERENCE_NOT_ACQUIRED",
	],
	[
		"forged acquired status",
		() => ({ ...evidence(), status: "acquired" }),
		"REFERENCE_NOT_ACQUIRED",
	],
] as const) {
	test(`denies authority for ${name}`, () => {
		const result = resolveReferenceSource(request, modify());
		expect(result).toMatchObject({
			status: "failed",
			errorCode,
			generation: null,
		});
	});
}

test("does not turn unresolved acquisition into token generation", () => {
	const result = resolveReferenceSource(tokenRequest, { status: "unresolved" });
	expect(result).toEqual({
		status: "unresolved",
		errorCode: "REFERENCE_NOT_ACQUIRED",
		httpStatus: 409,
		generation: null,
	});
});

test("rejects retained recipient bytes in intentional absence mode", () => {
	const result = resolveReferenceSource(tokenRequest, evidence());
	expect(result).toMatchObject({
		status: "failed",
		errorCode: "MODE_SOURCE_MISMATCH",
		generation: null,
	});
});

test("rejects corrupted PNG pixels despite matching all supplied hashes", () => {
	const png = encodePng({
		width: 2,
		height: 2,
		pixels: new Uint8Array(16).fill(255),
	}).slice(0, -8);
	const pin = hash(png);
	const tokenBytes = Buffer.from(
		JSON.stringify({ ...recipient, image: { sha256: pin } }),
	);
	const result = resolveReferenceSource(
		{
			...request,
			sourceSelection: { ...request.sourceSelection, sourceSHA256: pin },
		},
		{
			...evidence(),
			tokenBytes,
			tokenSHA256: hash(tokenBytes),
			recipientImage: { ...recipient, sourceSHA256: pin, bytes: png },
		},
	);
	expect(result).toMatchObject({
		status: "failed",
		errorCode: "REFERENCE_INVALID_PNG",
		httpStatus: 422,
		generation: null,
	});
});

test("rejects hash-consistent wrong token identity", () => {
	const tokenBytes = Buffer.from(
		JSON.stringify({ personId: "person-1003", characterId: "K1003" }),
	);
	const result = resolveReferenceSource(request, {
		...evidence(),
		tokenBytes,
		tokenSHA256: hash(tokenBytes),
	});
	expect(result).toMatchObject({
		errorCode: "REFERENCE_IDENTITY_MISMATCH",
		generation: null,
	});
});

test("does not derive a provider submission from any failed or unresolved acquisition", () => {
	const states = [
		{ status: "failed", reason: "network" },
		{ status: "unresolved" },
		{ ...evidence(), recipientImage: null },
	];
	const generationInputs = states
		.map((state) => resolveReferenceSource(request, state).generation)
		.filter((value) => value !== null);
	expect(generationInputs).toEqual([]);
});

test("binds sheet selection to the server-resolved recipient", () => {
	const { personId: _personId, ...sheetRequest } = request;
	const result = resolveReferenceSource(
		{ ...sheetRequest, sheetId: request.requestId },
		{
			...evidence(),
			recipient: { ...recipient, sheetId: request.requestId },
		},
	);
	expect(result.status).toBe("acquired");
});

test("keeps the public envelope closed at every object boundary", () => {
	const result = referenceGenerationRequestSchema.safeParse({
		...request,
		sourceSelection: {
			kind: "intentional-absence",
			reason: "no-reference-available",
			acquired: true,
		},
	});
	expect(result.success).toBe(false);
});
