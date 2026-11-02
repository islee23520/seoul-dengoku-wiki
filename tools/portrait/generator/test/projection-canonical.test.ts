import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
	type PortraitCandidate,
	preparePortraitConditions,
} from "../src/preflight.js";
import { ProjectionError, projectPortrait } from "../src/projection.js";
import { createTransportFixture } from "./transport-fixture.js";

const nativePath = "../../native/lib/index.mjs";
const native: unknown = await import(nativePath);
if (native === null || typeof native !== "object") {
	throw new Error("native portrait module required");
}
const previewPortrait: unknown = Reflect.get(native, "previewPortrait");
if (typeof previewPortrait !== "function") {
	throw new Error("native previewPortrait required");
}

const hash = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");

const fixture = () => {
	const { candidate, operatorPins } = createTransportFixture();
	const look = {
		...JSON.parse(new TextDecoder().decode(candidate.lookBytes)),
		personId: "person-204",
		sourceRefs: ["portrait-tokens/test-recipient.json"],
		canonicalContext: {
			characterId: "test-recipient",
			name: "Recipient",
			personId: "person-204",
			registry: {
				path: "people.json",
				pointer: "/people/204",
				sha256: "a".repeat(64),
			},
			background: [
				{
					path: "background.json",
					pointer: "/204",
					sha256: "b".repeat(64),
					text: "Authored background",
				},
			],
		},
		privateMetadata: { authored: true, value: "preserve" },
	};
	return { candidate, operatorPins, look };
};

const bind = (
	input: ReturnType<typeof fixture>,
	references: PortraitCandidate["referenceImages"] = input.candidate
		.referenceImages,
) => {
	const candidate = {
		...input.candidate,
		lookBytes: new TextEncoder().encode(JSON.stringify(input.look)),
		referenceImages: references,
	};
	const operatorPins = {
		...input.operatorPins,
		lookSHA: hash(candidate.lookBytes),
		referenceImages: references.map(({ id, bytes }) => ({
			id,
			sha256: hash(bytes),
		})),
	};
	return {
		candidate,
		operatorPins,
		prepared: preparePortraitConditions(candidate, operatorPins),
	};
};

// The native preview uses its documented measured-guide contract. Only the
// identical look bytes and face/reference roles are under parity comparison.
const preview = (input: ReturnType<typeof bind>) =>
	previewPortrait({
		lookBytes: input.candidate.lookBytes,
		packageVersion: 1,
		references: input.candidate.referenceImages.map((reference, index) => ({
			index: index + 1,
			role: reference.role,
			sha256: hash(reference.bytes),
			allowedProperties: reference.allowedProperties,
			...(reference.sameOwnerRecipient === undefined
				? {}
				: { sameOwnerRecipient: reference.sameOwnerRecipient }),
			...(reference.role === "framing-only"
				? {
						guide: {
							mode: "portrait",
							gender: "unknown",
							sourceHash: hash(reference.bytes),
							landmarkBinding: "headtop",
						},
					}
				: {}),
		})),
		composition: {
			shot: "medium-close-up-119",
			cameraContractId: "canonical-preview",
			mode: "portrait",
			coordinatedHeadTorso: true,
			viewerRight: true,
			gazeCamera: true,
			fullHeadShoulderConstraints: true,
			measuredFrameGuide: {
				landmarks: ["headtop"],
				contractId: "canonical-preview",
			},
		},
	});

const invalidLook = (input: ReturnType<typeof bind>) => {
	expect(() => preview(input)).toThrow();
	let received: unknown;
	try {
		projectPortrait(input);
	} catch (error) {
		received = error;
	}
	expect(received).toBeInstanceOf(ProjectionError);
	expect(received).toEqual(new ProjectionError("INVALID_LOOK"));
	if (received instanceof ProjectionError) {
		expect(received.code).toBe("INVALID_LOOK");
	}
};

describe("canonical final portrait projection native parity", () => {
	for (const schemaVersion of [1, 2]) {
		test(`schema ${schemaVersion} previews and preserves all 29 traits and metadata without dispatch`, () => {
			const input = fixture();
			input.look.schemaVersion = schemaVersion;
			const bound = bind(input);
			expect(preview(bound)).toBeDefined();
			const result = projectPortrait(bound);
			expect(result.rendering).toMatchObject(input.look);
			expect(Reflect.get(result.rendering, "slots")).toEqual(input.look.slots);
			expect(
				Object.values(input.look.slots).flatMap((slot) =>
					Object.keys(Object(slot)),
				).length,
			).toBe(29);
			expect(result.sourceSHA).toBe(hash(bound.candidate.lookBytes));
			expect(result.textSHA).toBe(hash(new TextEncoder().encode(result.text)));
			expect(result.text).not.toMatch(/(?<!\r)\n/);
			expect(result.providerCalls).toBe(0);
			expect(result.dispatched).toBe(false);
		});
	}

	const mutations: [string, (input: ReturnType<typeof fixture>) => void][] = [
		["missing schema", ({ look }) => delete look.schemaVersion],
		["unsupported schema", ({ look }) => (look.schemaVersion = 99)],
		["missing root name", ({ look }) => delete look.name],
		["root identity name mismatch", ({ look }) => (look.name = "Other")],
		["missing face mode", ({ look }) => delete look.faceMode],
		["unique variant ID", ({ look }) => (look.faceMode.variantId = "seed")],
		["unknown face kind", ({ look }) => (look.faceMode.kind = "other")],
		["missing variant ID", ({ look }) => delete look.faceMode.variantId],
		[
			"empty template ID",
			({ look }) => (look.faceMode = { kind: "template", variantId: " " }),
		],
		["face mode extra field", ({ look }) => (look.faceMode.extra = true)],
		[
			"unique required template",
			({ look }) => {
				look.uniqueFaceRequired = true;
				look.faceMode = { kind: "template", variantId: "authored-seed" };
			},
		],
		[
			"context character mismatch",
			({ look }) => (look.canonicalContext.characterId = "other"),
		],
		[
			"context name mismatch",
			({ look }) => (look.canonicalContext.name = "Other"),
		],
		[
			"context person mismatch",
			({ look }) => (look.canonicalContext.personId = "person-205"),
		],
		[
			"identity context person mismatch",
			({ look }) => (look.identity.personId = "person-205"),
		],
		[
			"missing context identity",
			({ look }) =>
				Reflect.deleteProperty(look.canonicalContext, "characterId"),
		],
		[
			"invalid registry hash",
			({ look }) => (look.canonicalContext.registry.sha256 = "bad"),
		],
		[
			"empty registry path",
			({ look }) => (look.canonicalContext.registry.path = " "),
		],
		[
			"invalid registry pointer",
			({ look }) => (look.canonicalContext.registry.pointer = "people/204"),
		],
		[
			"background object",
			({ look }) => (look.canonicalContext.background = {}),
		],
		[
			"invalid background hash",
			({ look }) => (look.canonicalContext.background[0].sha256 = "bad"),
		],
		[
			"nontext background",
			({ look }) => (look.canonicalContext.background[0].text = 7),
		],
	];
	for (const [name, mutate] of mutations) {
		test(`rejects ${name} with exact INVALID_LOOK`, () => {
			const input = fixture();
			mutate(input);
			invalidLook(bind(input));
		});
	}

	for (const id of [
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
	]) {
		test(`rejects protected identity ${id} template`, () => {
			const input = fixture();
			input.look.characterId = id;
			input.look.identity.characterId = id;
			input.look.canonicalContext.characterId = id;
			input.look.faceMode = { kind: "template", variantId: "authored-seed" };
			invalidLook(bind(input));
		});
	}

	for (const kind of ["unique", "template"]) {
		for (const role of ["individual-face-only", "face-base-only"] as const) {
			test(`${kind} with ${role} follows native face-source compatibility`, () => {
				const input = fixture();
				input.look.faceMode = {
					kind,
					variantId: kind === "unique" ? null : "authored-seed",
				};
				const bound = bind(input, [
					...input.candidate.referenceImages,
					{
						id: "authored-face",
						role,
						bytes: new Uint8Array([13, 14]),
						allowedProperties: ["faceShape"],
					},
				]);
				if ((kind === "unique") === (role === "individual-face-only")) {
					expect(preview(bound)).toBeDefined();
					expect(
						Reflect.get(projectPortrait(bound).rendering, "faceMode"),
					).toEqual(input.look.faceMode);
				} else {
					invalidLook(bound);
				}
			});
		}
	}

	test("null unique marker and empty authored strings retain native parity", () => {
		const input = fixture();
		input.look.uniqueFaceRequired = null;
		input.look.slots.face.description.value = "";
		const bound = bind(input);
		expect(preview(bound)).toBeDefined();
		expect(projectPortrait(bound).rendering).toMatchObject(input.look);
	});
});
