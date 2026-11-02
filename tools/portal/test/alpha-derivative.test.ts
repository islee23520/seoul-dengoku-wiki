import { expect, test } from "bun:test";
import {
	decodePng,
	encodePng,
} from "../../portrait/acceptance/src/png.ts";
import {
	ALPHA_PROCESSOR_V1,
	alphaDerivative,
} from "../src/alpha-derivative.ts";
import { resizePortraitPng } from "../src/png.ts";

test("edge-connected gray removal preserves enclosed facial colors and body corners", () => {
	const pixels = new Uint8Array(1024 * 1536 * 4);
	for (let y = 0; y < 1536; y++)
		for (let x = 0; x < 1024; x++) {
			const foreground = y >= 100 && (y >= 1000 || (x >= 300 && x < 700));
			pixels.set(
				foreground ? [90, 50, 40, 255] : [174, 174, 174, 255],
				(y * 1024 + x) * 4,
			);
		}
	// An enclosed gray facial detail must not become a transparent hole.
	for (let y = 400; y < 420; y++)
		for (let x = 450; x < 470; x++)
			pixels.set([174, 174, 174, 255], (y * 1024 + x) * 4);
	const image = decodePng(
		alphaDerivative(encodePng({ width: 1024, height: 1536, pixels })),
	);
	expect([image.width, image.height]).toEqual([340, 510]);
	for (let x = 0; x < 340; x++) expect(image.pixels[x * 4 + 3]).toBe(0);
	expect(image.pixels[(135 * 340 + 152) * 4 + 3]).toBe(255);
	expect(image.pixels[509 * 340 * 4 + 3]).toBe(255);
	for (let i = 0; i < image.pixels.length; i += 4) {
		if (image.pixels[i + 3] === 0)
			expect(Array.from(image.pixels.slice(i, i + 3))).toEqual([0, 0, 0]);
		else expect(image.pixels[i]).toBeGreaterThanOrEqual(90);
	}
});

test("nonuniform crown refuses instead of erasing a fixed margin", () => {
	const pixels = new Uint8Array(1024 * 1536 * 4).fill(255);
	pixels.set([0, 0, 0, 255], 0);
	expect(() =>
		alphaDerivative(encodePng({ width: 1024, height: 1536, pixels })),
	).toThrow("ALPHA_BACKGROUND_NOT_UNIFORM");
});

test("recoverable gray boundary unmixes before resampling without eroding opaque detail", () => {
	const width = 1024,
		height = 1536;
	const composite = new Uint8Array(width * height * 4);
	const truth = new Uint8Array(composite.length);
	const background = [174, 174, 174];
	const foreground = [42, 30, 24];
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++) {
			const alpha =
				y >= 150 && x >= 300 && x < 700
					? 1
					: y >= 150 && (x === 299 || x === 700)
						? 0.5
						: 0;
			const i = (y * width + x) * 4;
			for (let c = 0; c < 3; c++) {
				composite[i + c] = Math.round(
					(foreground[c] ?? 0) * alpha + (background[c] ?? 0) * (1 - alpha),
				);
				truth[i + c] = alpha ? (foreground[c] ?? 0) : 0;
			}
			composite[i + 3] = 255;
			truth[i + 3] = Math.round(alpha * 255);
		}
	const input = encodePng({ width, height, pixels: composite });
	const actual = decodePng(alphaDerivative(input));
	const old = decodePng(alphaDerivative(input, ALPHA_PROCESSOR_V1));
	const expected = decodePng(
		resizePortraitPng(encodePng({ width, height, pixels: truth })),
	);
	let error = 0,
		oldError = 0;
	for (const backdrop of [
		[255, 255, 255],
		[0, 0, 0],
		[35, 105, 155],
	])
		for (let i = 0; i < actual.pixels.length; i += 4)
			for (let c = 0; c < 3; c++) {
				const blend = (image: typeof actual) =>
					((image.pixels[i + c] ?? 0) * (image.pixels[i + 3] ?? 0)) / 255 +
					(backdrop[c] ?? 0) * (1 - (image.pixels[i + 3] ?? 0) / 255);
				error += Math.abs(blend(actual) - blend(expected));
				oldError += Math.abs(blend(old) - blend(expected));
			}
	expect(error).toBeLessThan(oldError / 20);
	for (let x = 0; x < 340; x++) expect(actual.pixels[x * 4 + 3]).toBe(0);
	expect(
		Array.from(
			actual.pixels.slice((200 * 340 + 150) * 4, (200 * 340 + 150) * 4 + 4),
		),
	).toEqual([...foreground, 255]);
});
