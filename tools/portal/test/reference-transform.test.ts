import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import {
	decodePng,
	encodePng,
} from "../../portrait/acceptance/src/png.ts";
import { resizePortraitPng } from "../src/png.ts";
import { transformReferencePng } from "../src/reference-transform.ts";
import { hash } from "../src/sources.ts";

test("canonical contain keeps small originals at native resolution and transparent black padding", () => {
	const original = encodePng({
		width: 2,
		height: 1,
		pixels: Uint8Array.from([255, 255, 255, 0, 50, 100, 150, 128]),
	});
	const before = original.slice();
	const result = transformReferencePng(original);
	const image = decodePng(result.rgbaBytes);
	expect(original).toEqual(before);
	expect(result.receipt.contentRect).toEqual({
		x: 169,
		y: 254,
		width: 2,
		height: 1,
	});
	expect(result.receipt.upscaled).toBe(false);
	expect(
		image.pixels.slice((254 * 340 + 169) * 4, (254 * 340 + 171) * 4),
	).toEqual(Uint8Array.from([0, 0, 0, 0, 50, 100, 150, 128]));
	const rgb = decodePng(result.rgbBytes);
	expect(rgb.channels).toBe(3);
	expect([...rgb.pixels.slice(0, 3)]).toEqual([224, 226, 228]);
	expect(result.receipt.rgbSHA256).not.toBe(result.receipt.rgbaSHA256);
});

test("premultiplied area does not mix invisible white into a colored edge", () => {
	const pixels = new Uint8Array(680 * 4);
	for (let x = 0; x < 680; x++)
		pixels.set(x % 2 ? [200, 20, 40, 255] : [255, 255, 255, 0], x * 4);
	const result = transformReferencePng(
		encodePng({ width: 680, height: 1, pixels }),
	);
	const image = decodePng(result.rgbaBytes);
	expect([...image.pixels.slice(254 * 340 * 4, 254 * 340 * 4 + 4)]).toEqual([
		200, 20, 40, 128,
	]);
});

test("native is independently sampled from the original and legacy delivery stays 1024 only", () => {
	const original = encodePng({
		width: 2,
		height: 1,
		pixels: Uint8Array.from([20, 40, 80, 255, 100, 120, 140, 255]),
	});
	const result = transformReferencePng(original, "native");
	expect(result.receipt.sourceSHA256).toBe(hash(original));
	expect(result.receipt.contentRect).toEqual({
		x: 0,
		y: 512,
		width: 1024,
		height: 512,
	});
	expect(result.receipt.upscaled).toBe(true);
	expect(() => resizePortraitPng(original)).toThrow("INVALID_PNG");
});

test("actual K998 original produces the pinned contain geometry without modifying source", async () => {
	const original = await readFile(
		process.env["REFERENCE_CONTRACT_K998_PNG"] ??
			new URL(
				"../../../ART-ASSETS/portrait-references/wiki-people/images/person-0998.png",
				import.meta.url,
			),
	);
	const before = hash(original);
	const canonical = transformReferencePng(original);
	const native = transformReferencePng(original, "native");
	expect(canonical.receipt.rgbaPixelsSHA256).toBe(
		"cc4a9a710d2f5625a2511738a70ee5813f360d73f61bf1d9954c3f2441ce49cb",
	);
	expect(before).toBe(
		"93e45d8525c4616ef1a174b171403ddd95eebf048fba818a0a80f0c24295b306",
	);
	expect(hash(original)).toBe(before);
	expect(canonical.receipt.contentRect).toEqual({
		x: 0,
		y: 56,
		width: 340,
		height: 397,
	});
	expect(native.receipt.sourceSHA256).toBe(before);
	expect(native.receipt.contentRect).toEqual({
		x: 0,
		y: 170,
		width: 1024,
		height: 1196,
	});
	const decoded = decodePng(canonical.rgbaBytes);
	for (let x = 0; x < 340; x++) {
		expect([...decoded.pixels.slice(x * 4, x * 4 + 4)]).toEqual([0, 0, 0, 0]);
		expect([
			...decoded.pixels.slice((509 * 340 + x) * 4, (509 * 340 + x) * 4 + 4),
		]).toEqual([0, 0, 0, 0]);
	}
});
