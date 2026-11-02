import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { buildNativeMossContextRequest } from "../src/native-moss-context.ts";
import {
	generationLook,
	generationSheetFromBytes,
	hash,
} from "../src/sources.ts";

const family = new URL(
	"../../../ART-ASSETS/portrait-training/native-moss-live-workbench-inputs-v1/",
	import.meta.url,
);

test("frozen published K1004 headwear preserves authored bytes identity and sourced projection", async () => {
	const tokenBytes = await readFile(
		new URL("source/person-1004.token.json", family),
	);
	const detailBytes = await readFile(
		new URL("source/person-1004.detail.json", family),
	);
	expect(hash(tokenBytes)).toBe(
		"1fb86c0eaf7f0c9795f0269997f1bf9baa53faaa27862a7a22a5abb575eb55e4",
	);
	const token = JSON.parse(tokenBytes.toString());
	const sheet = generationSheetFromBytes(detailBytes, tokenBytes, null);
	expect(Buffer.from(sheet.tokenBytes).equals(tokenBytes)).toBe(true);
	expect(sheet.sourceHashes.token).toBe(hash(tokenBytes));
	expect(sheet.characterId).toBe("K1004");
	expect(sheet.personId).toBe("person-1004");
	const projected = generationLook(token);
	expect(Reflect.get(projected, "artProposal")).toEqual(token.artProposal);
	expect(projected.slots["outfit"]?.["headwear"]).toEqual(
		token.slots.outfit.headwear,
	);
	expect(Reflect.get(projected, "identity")).toMatchObject({
		gender: {
			value: token.identity.gender,
			status: "art-proposal",
			source: "portrait-tokens/person-1004.json",
		},
		characterId: "K1004",
	});
	expect(JSON.stringify(projected)).toContain(
		token.slots.outfit.headwear.value,
	);
	const fallback = structuredClone(token);
	delete fallback.slots;
	// This isolates the existing legacy mapper; qualitative measurements are
	// absent, not changed or substituted in the frozen input.
	const fallbackLook = generationLook(fallback);
	expect(fallbackLook.slots["outfit"]?.["headwear"]).toEqual({
		value: token.artProposal.headwear,
		status: "art-proposal",
		source: "portrait-tokens/person-1004.json",
	});
	for (const value of [
		{ unexpectedHeadwear: "invented" },
		{ headwear: { value: "hat" } },
		{ headwear: 42 },
	]) {
		expect(() =>
			generationLook({
				...token,
				artProposal: { ...token.artProposal, ...value },
			}),
		).toThrow("character schema");
	}
	const absent = structuredClone(token);
	delete absent.artProposal.headwear;
	expect(() => generationLook(absent)).not.toThrow();
	const request = JSON.parse(
		(
			await readFile(new URL("requests/person-1004-token25.json", family))
		).toString(),
	);
	const context = await buildNativeMossContextRequest(request, {
		detailBytes,
		ownerBindingHash: "a".repeat(64),
		serverEvidence: {
			status: "available",
			recipient: { personId: sheet.personId, characterId: sheet.characterId },
			tokenBytes,
			tokenSHA256: hash(tokenBytes),
			recipientImage: null,
		},
	});
	expect(context.bytes.length).toBeGreaterThan(0);
	expect(JSON.parse(Buffer.from(context.bytes).toString()).token.sha256).toBe(
		hash(tokenBytes),
	);
	expect(
		hash(await readFile(new URL("source/person-1004.token.json", family))),
	).toBe(hash(tokenBytes));
});
