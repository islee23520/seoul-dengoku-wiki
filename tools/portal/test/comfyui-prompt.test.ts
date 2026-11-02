import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import {
	COMFY_PROMPT_COMPILER,
	ComfyPromptError,
	COMFY_PROMPT_EXCLUDED_FIELDS,
	COMFY_PROMPT_LIMITS,
	compileComfyPortraitPrompt,
} from "../src/comfyui-prompt.ts";
import { adaptSheet, generationSheetFromBytes, hash } from "../src/sources.ts";

const compileLegacyPrompt: typeof compileComfyPortraitPrompt = (rendering, workflow, compiler = "comfy-portrait-prompt.v3") => compileComfyPortraitPrompt(rendering, workflow, compiler);
// Real published tokens through the real portal projection path: the compiler
// sees exactly the `projection.rendering` a job stores in projection.json.
const tokens = new URL(
	"../../../ART-ASSETS/portrait-references/wiki-people/tokens/",
	import.meta.url,
);
async function projectionOf(personId: string) {
	const bytes = await readFile(new URL(`${personId}.json`, tokens));
	const token = JSON.parse(bytes.toString());
	const detail = Buffer.from(
		JSON.stringify({
			id: token.personId,
			characterId: token.characterId,
			name: token.name,
			detailRoute: `/people/${token.personId}`,
		}),
	);
	return adaptSheet(
		generationSheetFromBytes(detail, bytes, null),
		createTransportFixture(),
		"b385e070-2346-4dde-8470-90eeef7b68e1",
		{ kind: "unique", variantId: null },
		"comfyui:zimage-turbo-text-draft.v1",
	).projection;
}
const ZIMAGE = "zimage-turbo-text-draft.v1";
const MOSS = "moss-image-sft-text.v1";

test("person-1017 legacy token compiles to one bust-portrait prompt carrying only its authored visible traits, never the JSON sheet", async () => {
	const projection = await projectionOf("person-1017");
	expect(JSON.parse(projection.text).slots).toEqual(
		projection.rendering["slots"],
	);
	const compiled = compileLegacyPrompt(projection.rendering, ZIMAGE);
	expect(compiled.compiler).toBe("comfy-portrait-prompt.v3");
	expect(compiled.workflow).toBe(ZIMAGE);
	expect(compiled.sha).toBe(hash(Buffer.from(compiled.text)));
	expect(compiled.text.length).toBeLessThanOrEqual(COMFY_PROMPT_LIMITS[ZIMAGE]);
	expect(compiled.limit).toBe(COMFY_PROMPT_LIMITS[ZIMAGE]);
	// Only the four authored values the legacy token actually carries.
	expect(compiled.fields).toEqual([
		"identity.gender",
		"face.description",
		"hair.description",
		"outfit.upper",
	]);
	expect(compiled.dropped).toEqual([]);
	expect(compiled.text).toContain("Gender: 여성");
	expect(compiled.text).toContain(
		"Face: 또렷한 이목구비와 친절하면서 속내를 드러내지 않는 성인 여성의 얼굴, 빨간색 크리스탈 이어피어스",
	);
	expect(compiled.text).toContain("Hair: 검은색의 짧은 단발");
	expect(compiled.text).toContain(
		"Upper garment: 화재로부터 몸을 보호하는 용도의 재킷형 외투. 시안에서는 어두운 회색으로 표현했으며 소재·보호 등급·색상은 정본 미확정이다.",
	);
	// Below-frame garments, identifiers, provenance and layout metrics stay out.
	for (const absent of [
		"짧은 바지",
		"군화",
		"person-1017",
		"K1017",
		"지연희",
		"sha256",
		"meanMidpoint",
		"portrait-tokens",
		'"value"',
		"{",
		"}",
	])
		expect(compiled.text).not.toContain(absent);
	const [head, ...rest] = compiled.text.split("\n");
	expect(head).toBe(
		"A single portrait illustration of one person. Bust framing: head, both shoulders and upper chest, centered in a vertical 2:3 frame, front view facing the viewer.",
	);
	expect(rest.at(-1)).toBe(
		"Plain solid light gray background, soft even lighting, no props, no scenery. Exactly one person and one view: no text, no letters, no numbers, no labels, no captions, no watermark, no panels, no layout, no multiple views, no character sheet, no extra people.",
	);
	// Deterministic: same rendering, same bytes; MOSS shares the text and only
	// the bound differs.
	expect(
		compileLegacyPrompt(structuredClone(projection.rendering), ZIMAGE)
			.sha,
	).toBe(compiled.sha);
	const moss = compileLegacyPrompt(projection.rendering, MOSS);
	expect(moss.text).toBe(compiled.text);
	expect(moss.limit).toBe(COMFY_PROMPT_LIMITS[MOSS]);
});

test("rich token (person-1007) keeps its authored three-quarter direction and every visible trait while numeric and below-frame fields are excluded", async () => {
	// The published person-1007 token is not generation-eligible through the
	// adapter (its artProposal carries extra properties the character schema
	// rejects), so its authored slots/identity/generationContract, which
	// neutralRecord copies into a rendering unchanged, are compiled directly.
	const token = JSON.parse(
		(await readFile(new URL("person-1007.json", tokens))).toString(),
	);
	const rendering = {
		identity: token.identity,
		slots: token.slots,
		generationContract: token.generationContract,
	};
	expect(rendering.generationContract.direction).toBe("viewer-right");
	expect(rendering.slots.body.height).toEqual({
		value: null,
		status: "unknown",
		source: null,
		unit: null,
	});
	const compiled = compileLegacyPrompt(rendering, MOSS);
	expect(compiled.text.length).toBeLessThanOrEqual(COMFY_PROMPT_LIMITS[MOSS]);
	expect(compiled.text.split("\n")[0]).toContain(
		"three-quarter view with the head and torso turned slightly toward the viewer's right",
	);
	for (const clause of [
		"Ethnicity: Korean",
		"Origin: Korean",
		"Face shape: oval with a defined jaw and rounded chin",
		"Eye color: dark brown",
		"Eye shape: narrow, almond-shaped",
		"Beard: none, clean shaven",
		"Hair color: black",
		"Hair length: short to medium",
		"Build: average, with broad shoulders",
		"Bust: flat chest",
		"Upper garment: Plain deep navy high-collared civilian coat over light gray shirt",
		"Accessories: eyeglasses mandatory, not large round lenses",
	])
		expect(compiled.text).toContain(clause);
	for (const field of COMFY_PROMPT_EXCLUDED_FIELDS)
		expect(compiled.fields).not.toContain(field);
	expect(compiled.fields).toContain("face.eyebrowShape");
	expect(compiled.fields).not.toContain("body.skin");
	expect(compiled.dropped).toEqual([]);
	expect(/\d/.test(compiled.text.replace("2:3", ""))).toBe(false);
});

test("values are normalized and clipped, lower-priority fields drop until each workflow bound holds, and the bound is never exceeded", () => {
	const long = "가".repeat(1000);
	const trait = (value: unknown) => ({ value, status: "art-proposal" });
	const rendering = {
		identity: { gender: trait("여성") },
		slots: {
			face: { description: trait(long), eyeColor: trait(long) },
			hair: { description: trait(long), color: trait(long) },
			body: { build: trait(long) },
			outfit: { upper: trait(long) },
			accessories: { description: trait(long), shape: trait(long) },
		},
	};
	const zimage = compileLegacyPrompt(rendering, ZIMAGE);
	const moss = compileLegacyPrompt(rendering, MOSS);
	expect(zimage.text.length).toBeLessThanOrEqual(COMFY_PROMPT_LIMITS[ZIMAGE]);
	expect(moss.text.length).toBeLessThanOrEqual(COMFY_PROMPT_LIMITS[MOSS]);
	expect(zimage.text).toContain(`Face: ${"가".repeat(240)}`);
	expect(zimage.text).not.toContain("가".repeat(241));
	expect(zimage.fields[0]).toBe("identity.gender");
	expect(zimage.dropped.length).toBeGreaterThan(0);
	expect(moss.fields.length).toBeGreaterThan(zimage.fields.length);
	expect(zimage.fields.length + zimage.dropped.length).toBe(9);
	expect(moss.fields.length + moss.dropped.length).toBe(9);
	const normalized = compileLegacyPrompt(
		{ slots: { hair: { description: trait("  short\n\n black  hair.  ") } } },
		ZIMAGE,
	);
	expect(normalized.text).toContain("\nHair: short black hair.\n");
});

test("numeric, null and malformed traits never reach the prompt; direction falls back to front; non-object renderings are rejected", () => {
	const compiled = compileLegacyPrompt(
		{
			slots: {
				body: {
					height: { value: 170, unit: "cm" },
					weight: { value: 60, unit: "kg" },
					build: { value: null, status: "unknown" },
					skin: "pale",
				},
				outfit: { lower: { value: "short trousers" } },
			},
			generationContract: { direction: "upward" },
		},
		ZIMAGE,
	);
	expect(compiled.fields).toEqual([]);
	expect(compiled.text).not.toContain("170");
	expect(compiled.text).not.toContain("pale");
	expect(compiled.text).not.toContain("trousers");
	expect(compiled.text).toContain("front view facing the viewer");
	expect(
		compileLegacyPrompt(
			{ generationContract: { direction: "viewer-left" } },
			ZIMAGE,
		).text,
	).toContain("toward the viewer's left");
	for (const invalid of [null, "text", 7, [], { slots: [] }])
		expect(() => compileLegacyPrompt(invalid, ZIMAGE)).toThrow(
			"COMFY_PROMPT_INPUT_INVALID",
		);
});

test("compiler versions reproduce immutable v1 and v2 hashes and bind v3 without changing authored fields", () => {
	const workflow = "moss-image-sft-style-lora.v1";
	const hashes = {
		"viewer-right":
			"85717dff86a22ff042b6085b67ebc6d57bf89bc8545c03f060f599ca41893330",
		"viewer-left":
			"2b92d84e4c512f855ec7a0301fb7891d2491b9f631f8b517520f81eaa01e774b",
		front: "f9d5011d82b21ade875365d6e56cd1041d08b8d97b1a3e9a7c88b78f064e32c3",
	};
	const v2Hashes: Record<string, string> = {
		"viewer-right":
			"8f857fd571d253b4d6d503516a4c3d217cc69a5c15167ba73f8accb0af3c348e",
		"viewer-left":
			"821c995d7a734a11f8ea0eb81ba74d13a8979fea7120bbef3b320f2fad563e6d",
		front: hashes.front,
	};
	for (const [direction, sha] of Object.entries(hashes)) {
		const rendering = {
			identity: { gender: { value: "여성" } },
			slots: { hair: { description: { value: "검은색의 짧은 단발" } } },
			generationContract: { direction },
		};
		const before = structuredClone(rendering);
		const legacy = compileLegacyPrompt(
			rendering,
			workflow,
			"comfy-portrait-prompt.v1",
		);
		const current = compileLegacyPrompt(rendering, workflow);
		for (const diagnostic of [
			"moss-image-sft-style-diagnostic-zero.v1",
			"moss-image-sft-style-diagnostic-reduced.v1",
		] as const) {
			const controlled = compileLegacyPrompt(rendering, diagnostic);
			expect(controlled.text).toBe(current.text);
			expect(controlled.sha).toBe(current.sha);
		}
		const v2 = compileLegacyPrompt(
			rendering,
			workflow,
			"comfy-portrait-prompt.v2",
		);
		expect(legacy.compiler).toBe("comfy-portrait-prompt.v1");
		expect(legacy.sha).toBe(sha);
		expect(v2.compiler).toBe("comfy-portrait-prompt.v2");
		const v2SHA = v2Hashes[direction];
		if (v2SHA === undefined) throw new Error("missing v2 fixture hash");
		expect(v2.sha).toBe(v2SHA);
		expect(current.compiler).toBe("comfy-portrait-prompt.v3");
		expect(current.sha).toBe(hash(Buffer.from(current.text)));
		expect(current.sha === legacy.sha).toBe(direction === "front");
		expect(current.sha === v2.sha).toBe(direction === "front");
		expect(current.fields).toEqual(legacy.fields);
		expect(current.dropped).toEqual([]);
		expect(current.text.split("\n").slice(1)).toEqual(
			legacy.text.split("\n").slice(1),
		);
		expect(rendering).toEqual(before);
		expect(
			compileLegacyPrompt(rendering, workflow, current.compiler).sha,
		).toBe(current.sha);
	}
});

const workflow = "moss-image-sft-style-lora.v1";
const tokenPath = new URL(
	"../../../ART-ASSETS/portrait-references/wiki-people/tokens/person-1004.json",
	import.meta.url,
);
const trait = (value: unknown) => ({ value, status: "art-proposal" });
const required = [
	"outfit.headwear",
	"accessories.description",
	"accessories.shape",
	"accessories.color",
	"accessories.material",
	"accessories.mounting",
];
const tokenSchema = z.object({
	identity: z.unknown(),
	slots: z.record(
		z.string(),
		z.record(z.string(), z.object({ value: z.unknown() }).passthrough()),
	),
	generationContract: z.unknown(),
});

test("preserves all required retained person1004 fields when optional descriptions exhaust the budget", async () => {
	// Given: the retained authored token, not a shortened fixture.
	const token = tokenSchema.parse(
		JSON.parse(await readFile(tokenPath, "utf8")),
	);
	const rendering = {
		identity: token.identity,
		slots: token.slots,
		generationContract: token.generationContract,
	};
	// When
	const compiled = compileComfyPortraitPrompt(rendering, workflow);
	// Then: identities and full normalized values both survive.
	for (const field of required) {
		const [section, key] = field.split(".");
		if (!section || !key) throw new Error("invalid test field");
		const expected = z
			.string()
			.parse(token.slots[section]?.[key]?.value)
			.replace(/\s+/g, " ")
			.trim()
			.replace(/[\s.;,]+$/u, "");
		expect(compiled.fields).toContain(field);
		expect(compiled.dropped).not.toContain(field);
		const clause = compiled.text
			.split("\n")
			.flatMap((line) =>
				line.replace(/\.$/, "").split(/; (?=[A-Z][A-Za-z ]+: )/),
			)
			.find((value) => value.slice(value.indexOf(": ") + 2) === expected);
		expect(clause).toBeDefined();
	}
	expect(compiled.text.length).toBeLessThanOrEqual(2400);
	expect(compiled.dropped.length).toBeGreaterThan(0);
});

test("rejects required content when it exceeds the UTF-16 budget before dispatch", () => {
	// Given
	const rendering = {
		slots: { outfit: { headwear: trait("\u{1f600}".repeat(1200)) } },
	};
	let dispatched = false;
	// When
	const submit = () => {
		compileComfyPortraitPrompt(rendering, workflow);
		dispatched = true;
	};
	// Then
	expect(submit).toThrow(ComfyPromptError);
	expect(dispatched).toBe(false);
});

test("keeps historical replay hashes when replaying old contracts", () => {
	// Given
	const rendering = {
		identity: { gender: trait("여성") },
		slots: { hair: { description: trait("검은색의 짧은 단발") } },
		generationContract: { direction: "viewer-right" },
	};
	const hashes = {
		"comfy-portrait-prompt.v1":
			"85717dff86a22ff042b6085b67ebc6d57bf89bc8545c03f060f599ca41893330",
		"comfy-portrait-prompt.v2":
			"8f857fd571d253b4d6d503516a4c3d217cc69a5c15167ba73f8accb0af3c348e",
	} as const;
	// When / Then: shipped-byte replay equality, not wording assertions.
	for (const compiler of [
		"comfy-portrait-prompt.v1",
		"comfy-portrait-prompt.v2",
	] as const)
		expect(compileComfyPortraitPrompt(rendering, workflow, compiler).sha).toBe(
			hashes[compiler],
		);
});

test("reproduces the retained v3 output when replaying its explicit version", async () => {
	// Given
	const token = tokenSchema.parse(
		JSON.parse(await readFile(tokenPath, "utf8")),
	);
	// When
	const compiled = compileComfyPortraitPrompt(
		token,
		workflow,
		"comfy-portrait-prompt.v3",
	);
	// Then
	expect(compiled.sha).toBe(
		"f5f725481b9f992aa6b9a30dc1cee84f5295579ece25c9099d7cda7ea4fb9f79",
	);
	expect(compiled.dropped).toContain("outfit.headwear");
});

test("drops optional low-priority fields when their complete clauses cannot fit", () => {
	// Given
	const long = trait("x".repeat(1000));
	const rendering = {
		slots: {
			face: { description: long, eyeColor: long },
			hair: { description: long, color: long },
			body: { build: long },
			outfit: { upper: long },
		},
	};
	// When
	const compiled = compileComfyPortraitPrompt(
		rendering,
		"zimage-turbo-text-draft.v1",
	);
	// Then
	expect(compiled.dropped.length).toBeGreaterThan(0);
	expect(compiled.fields.length + compiled.dropped.length).toBe(6);
	expect(compiled.text.length).toBeLessThanOrEqual(1600);
});

test("rejects malformed required traits when authored values cannot be interpreted", () => {
	// Given
	const malformed = [
		"hat",
		{ value: 17 },
		{ value: { text: "hat" } },
		{ value: "hat", status: "unknown" },
		{ value: ";..," },
	];
	// When / Then: each independent malformed boundary input must fail.
	for (const headwear of malformed)
		expect(() =>
			compileComfyPortraitPrompt({ slots: { outfit: { headwear } } }, workflow),
		).toThrow(ComfyPromptError);
});

test("keeps required values beyond 240 codepoints when normalized whitespace fits", () => {
	// Given
	const value = "a".repeat(241);
	const rendering = {
		slots: { outfit: { headwear: trait(`  ${value}\n  tail., `) } },
	};
	// When
	const compiled = compileComfyPortraitPrompt(rendering, workflow);
	// Then: decode the authored clause rather than pinning prompt prose.
	const line = compiled.text.split("\n")[1];
	expect(line?.slice(line.indexOf(": ") + 2, -1)).toBe(`${value} tail`);
	expect(compiled.fields).toEqual(["outfit.headwear"]);
});

test("CLI emits the retained receipt and rejects an actual overflow token with exit 2", async () => {
	const directory = await mkdtemp(join(tmpdir(), "comfy-prompt-cli-"));
	const entry = fileURLToPath(
		new URL("../src/comfyui-prompt-cli.ts", import.meta.url),
	);
	const invoke = async (input: string) => {
		const child = Bun.spawn([process.execPath, entry, input], {
			stdout: "pipe",
			stderr: "pipe",
		});
		const [exit, stdout, stderr] = await Promise.all([
			child.exited,
			new Response(child.stdout).text(),
			new Response(child.stderr).text(),
		]);
		expect(stderr).toBe("");
		return { exit, receipt: JSON.parse(stdout) };
	};
	try {
		const positive = await invoke(fileURLToPath(tokenPath));
		expect(positive.exit).toBe(0);
		expect(positive.receipt.sha).toBe(
			"07d2c2da8a0f895252cbff605cf8750e939b2a9ac8e36e1c4127c72d54404619",
		);
		expect(Object.keys(positive.receipt.requiredValues)).toEqual(required);
		const token = tokenSchema.parse(
			JSON.parse(await readFile(tokenPath, "utf8")),
		);
		const { outfit } = token.slots;
		if (!outfit) throw new Error("missing retained outfit");
		Object.assign(outfit, { headwear: trait("\u{1f600}".repeat(1200)) });
		const overflowPath = join(directory, "overflow.json");
		await writeFile(overflowPath, JSON.stringify(token));
		const negative = await invoke(overflowPath);
		expect(negative.exit).toBe(2);
		expect(negative.receipt.code).toBe("COMFY_PROMPT_REQUIRED_BUDGET");
		expect(negative.receipt.modelLoaded).toBe(false);
		expect(negative.receipt.generationDispatched).toBe(false);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});
