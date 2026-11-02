import { expect, test } from "bun:test";
import {
	decodePng,
	encodePng,
} from "../../portrait/acceptance/src/png.ts";
import { measurePng, resizePortraitPng } from "../src/png.ts";

function image(alphas: number[]) {
	const pixels = new Uint8Array(4 * 4 * 4);
	alphas.forEach((alpha, index) => {
		pixels[index * 4 + 3] = alpha;
	});
	return encodePng({ width: 4, height: 4, pixels });
}
test("transparent canvas with opaque subject has foreground fraction one not canvas coverage", () => {
	const metrics = measurePng(image([255, 250]));
	expect(metrics.canvasOpaqueFraction).toBe(2 / 16);
	expect(metrics.coreFraction).toBe(2 / 16);
	expect(metrics.coreFractionDenominator).toBe("canvasPixels");
	expect(metrics.foregroundCoreFraction).toBe(1);
	expect(metrics.foregroundPixels).toBe(2);
	expect(metrics.corePixels).toBe(2);
	expect(metrics.mechanicalStatus).toBe("NOT_RUN");
	expect(metrics.reviewStatus).toBe("HOLD");
});
test("foreground includes alpha one while core starts at alpha 250", () => {
	const metrics = measurePng(image([0, 1, 249, 250, 255]));
	expect(metrics.foregroundAlphaMinimum).toBe(1);
	expect(metrics.coreAlphaThreshold).toBe(250);
	expect(metrics.foregroundPixels).toBe(4);
	expect(metrics.foregroundCoreFraction).toBe(2 / 4);
	expect(metrics.canvasOpaqueFraction).toBe(2 / 16);
	expect(metrics.transparentFraction).toBe(12 / 16);
	expect(metrics.reviewStatus).toBe("HOLD");
});
test("zero foreground is undefined nullable without fake approval", () => {
	const metrics = measurePng(image([]));
	expect(metrics.foregroundPixels).toBe(0);
	expect(metrics.foregroundCoreFraction).toBeNull();
	expect(metrics.canvasOpaqueFraction).toBe(0);
	expect(metrics.transparentFraction).toBe(1);
	expect(metrics.mechanicalStatus).toBe("NOT_RUN");
	expect(metrics.reviewStatus).toBe("HOLD");
});

test("portrait area resize preserves alpha without invisible-color edge bleed", () => {
	const pixels = new Uint8Array(1024 * 1536 * 4);
	for (let i = 0; i < pixels.length; i += 4) pixels[i + 2] = 255;
	// One opaque red sample among invisible blue samples in the first output area.
	pixels.set([255, 0, 0, 255], 0);
	const source = encodePng({ width: 1024, height: 1536, pixels });
	const output = resizePortraitPng(source);
	const decoded = decodePng(output);
	expect([decoded.width, decoded.height, decoded.channels]).toEqual([
		340, 510, 4,
	]);
	expect(Array.from(decoded.pixels.slice(0, 4))).toEqual([255, 0, 0, 28]);
	expect(Array.from(decoded.pixels.slice(4, 8))).toEqual([0, 0, 0, 0]);
	expect(resizePortraitPng(source)).toEqual(output);
	expect(() => resizePortraitPng(image([]))).toThrow("INVALID_PNG");
});
