import { expect, test } from "bun:test";
import { evaluatePortraitAcceptance } from "../../portrait/acceptance/src/evaluator.ts";
import {
	decodePng,
	encodePng,
} from "../../portrait/acceptance/src/png.ts";
import { prepareComfySource } from "../src/comfyui-provider.ts";
import { verifyComfySourceResult } from "../src/evaluations.ts";
import { evaluateDeliveryAlpha, resizePortraitPng } from "../src/png.ts";
import {
	portraitDeliveryV2,
	portraitOutput,
	verifyPortraitDeliveryV2,
} from "../src/portrait-size.ts";
import { hash } from "../src/sources.ts";
import { finishingPngFixture } from "./comfyui-finishing-fixture.ts";
import { sourceFixture, sourceTransport } from "./comfyui-source-fixture.ts";

function deliveryFixture() {
	const f = finishingPngFixture();
	const originalBytes = encodePng({
		width: 2,
		height: 1,
		pixels: Uint8Array.from([250, 230, 210, 128, 20, 40, 60, 255]),
	});
	return {
		originalBytes,
		nativeBytes: f.maskBytes,
		rawBytes: f.rawBytes,
		finishedBytes: f.finishedBytes,
		canonicalReceiptBytes: Buffer.from(
			JSON.stringify({
				responseSHA: hash(f.finishedBytes),
				requestId: "fixture",
			}),
		),
	};
}

test("new delivery evaluation preserves source graph proof and binds every retained artifact", async () => {
	const sourceInput = sourceFixture();
	const fixture = sourceTransport();
	const prepared = prepareComfySource(sourceInput);
	const connection = await fixture.provider.connect(
		"moss-image-sft-source-img2img.alpha.v1",
	);
	const generated = await fixture.provider.generate(connection, sourceInput);
	if (!generated.finishingImages) throw Error("missing fixture finishing");
	const delivery = portraitDeliveryV2({
		originalBytes: prepared.originalBytes,
		nativeBytes: prepared.native.rgbaBytes,
		rawBytes: generated.finishingImages.rawBytes,
		finishedBytes: generated.sourceBytes,
		canonicalReceiptBytes: generated.canonicalReceiptBytes,
	});
	const input = {
		...generated,
		sourceInput,
		conditioningBytes: prepared.native.rgbBytes,
		deliveryBytes: delivery.bytes,
		deliveryReceiptBytes: delivery.receiptBytes,
	};
	const report = verifyComfySourceResult(input);
	expect(report.alpha.status).toBe("PASS");
	expect(report.alpha.semanticStatus).toBe("HOLD");
	expect(report.alpha.qualityQualified).toBe(false);
	expect(report.gpuQualityQualified).toBe(false);
	for (const patch of [
		{ conditioningBytes: prepared.native.rgbaBytes },
		{ deliveryBytes: generated.sourceBytes },
		{
			sourceInput: { ...sourceInput, serverEvidence: { status: "unresolved" } },
		},
	])
		expect(() => verifyComfySourceResult({ ...input, ...patch })).toThrow();
	const changed = JSON.parse(delivery.receiptBytes.toString());
	changed.transformation.rawSHA = "a".repeat(64);
	expect(() =>
		verifyComfySourceResult({
			...input,
			deliveryReceiptBytes: Buffer.from(JSON.stringify(changed)),
		}),
	).toThrow("RESULT_EVIDENCE_MISMATCH");
});

test("versioned delivery retains separate artifact hashes and immutable original alpha", () => {
	const input = deliveryFixture();
	const before = Object.values(input).map(hash);
	const output = portraitDeliveryV2(input);
	expect(Object.values(input).map(hash)).toEqual(before);
	expect(decodePng(input.originalBytes).pixels[3]).toBe(128);
	expect(output.bytes).toEqual(resizePortraitPng(input.finishedBytes));
	expect(output.transformation).toMatchObject({
		originalSHA: hash(input.originalBytes),
		nativeSHA: hash(input.nativeBytes),
		rawSHA: hash(input.rawBytes),
		finishedSHA: hash(input.finishedBytes),
		deliverySHA: hash(output.bytes),
		sourcePadding: "computational-contain-not-authored",
		deliveryPadding: "none",
	});
	expect(output.alpha.status).toBe("PASS");
	expect(output.alpha.semanticStatus).toBe("HOLD");
	expect(output.alpha.qualityQualified).toBe(false);
	expect(output.alpha.suspicions).toEqual([]);
	expect(output.alpha.partialPixels).toBeGreaterThan(0);
	expect(output.alpha.opaquePixels).toBeGreaterThan(0);
	expect(output.alpha.hiddenRGBPixels).toBe(0);
	expect(
		verifyPortraitDeliveryV2({
			...input,
			deliveryBytes: output.bytes,
			deliveryReceiptBytes: output.receiptBytes,
		}),
	).toEqual(output.alpha);
	for (const key of ["originalBytes", "nativeBytes", "rawBytes"] as const) {
		expect(() =>
			verifyPortraitDeliveryV2({
				...input,
				[key]: input.finishedBytes,
				deliveryBytes: output.bytes,
				deliveryReceiptBytes: output.receiptBytes,
			}),
		).toThrow("RESULT_EVIDENCE_MISMATCH");
	}
	expect(() =>
		verifyPortraitDeliveryV2({
			...input,
			deliveryBytes: input.finishedBytes,
			deliveryReceiptBytes: output.receiptBytes,
		}),
	).toThrow("RESULT_EVIDENCE_MISMATCH");
	const legacy = portraitOutput(
		input.finishedBytes,
		input.canonicalReceiptBytes,
	);
	expect(
		JSON.parse(legacy.receiptBytes.toString()).transformation.algorithm,
	).toBe("premultiplied-alpha-area-v1");
});

test("antialiased holes and tolerant neutral rim/checker patterns HOLD without approving semantics", () => {
	const width = 340,
		height = 510;
	const clean = new Uint8Array(width * height * 4);
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++) {
			const d = Math.hypot((x - 170) / 115, (y - 260) / 220);
			const a = Math.round(Math.max(0, Math.min(1, (1 - d) * 115)) * 255);
			if (a) clean.set([185, 125, 70, a], (y * width + x) * 4);
		}
	const positive = evaluateDeliveryAlpha(
		encodePng({ width, height, pixels: clean }),
	);
	expect(positive.status).toBe("PASS");
	expect(positive.partialPixels).toBeGreaterThan(0);
	for (const defect of [
		"antialiased-hole",
		"dark-rim",
		"tinted-rim",
		"tinted-checker",
	] as const) {
		const pixels = clean.slice();
		if (defect === "antialiased-hole")
			for (let y = 245; y < 265; y++)
				for (let x = 160; x < 180; x++) {
					const d = Math.hypot(x - 170, y - 255);
					if (d < 8)
						pixels.fill(0, (y * width + x) * 4, (y * width + x) * 4 + 4);
					else if (d < 9) pixels[(y * width + x) * 4 + 3] = 128;
				}
		if (defect === "dark-rim" || defect === "tinted-rim")
			for (let i = 0; i < pixels.length; i += 4)
				if ((pixels[i + 3] ?? 0) > 0 && (pixels[i + 3] ?? 0) < 255)
					pixels.set(
						defect === "dark-rim" ? [140, 140, 140] : [185, 184, 185],
						i,
					);
		if (defect === "tinted-checker")
			for (let y = 50; y < 490; y++)
				for (let x = 25; x < 315; x++) {
					const c = ((x >> 3) + (y >> 3)) % 2 ? 180 : 230;
					pixels.set([c, c - 1, c, 255], (y * width + x) * 4);
				}
		const report = evaluateDeliveryAlpha(encodePng({ width, height, pixels }));
		expect(report.status).toBe("HOLD");
		expect(report.suspicions.length).toBeGreaterThan(0);
		expect(report.failures).toEqual([]);
		expect(report.semanticStatus).toBe("HOLD");
		expect(report.qualityQualified).toBe(false);
	}
});

test("real PNG defect controls never receive alpha-only PASS", () => {
	const input = deliveryFixture();
	const good = portraitDeliveryV2(input);
	for (const defect of [
		"hole",
		"gray-rim",
		"checkerboard",
		"hidden-rgb",
		"empty",
		"opaque",
	] as const) {
		const image = decodePng(good.bytes);
		if (defect === "hole")
			image.pixels.fill(0, (250 * 340 + 170) * 4, (250 * 340 + 170) * 4 + 4);
		if (defect === "gray-rim")
			for (let p = 0; p < 340 * 510; p++)
				if (
					(image.pixels[p * 4 + 3] ?? 0) > 0 &&
					(image.pixels[p * 4 + 3] ?? 0) < 255
				)
					image.pixels.set([180, 180, 180], p * 4);
		if (defect === "checkerboard")
			for (let y = 100; y < 510; y++)
				for (let x = 80; x < 260; x++) {
					const c = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? 180 : 230;
					image.pixels.set([c, c, c, 255], (y * 340 + x) * 4);
				}
		if (defect === "hidden-rgb") image.pixels.set([255, 255, 255, 0], 0);
		if (defect === "empty") image.pixels.fill(0);
		if (defect === "opaque")
			for (let i = 3; i < image.pixels.length; i += 4) image.pixels[i] = 255;
		const report = evaluateDeliveryAlpha(encodePng(image));
		expect(["FAIL", "HOLD"]).toContain(report.status);
		expect(report.semanticMaskProven).toBe(false);
		if (["empty", "opaque", "hidden-rgb"].includes(defect))
			expect(report.status).toBe("FAIL");
	}
});

test("delivery rejects wrong aspect native, empty or opaque candidates and mismatched canonical evidence", () => {
	const input = deliveryFixture();
	const wrong = encodePng({
		width: 512,
		height: 512,
		pixels: new Uint8Array(512 * 512 * 4),
	});
	expect(() =>
		portraitDeliveryV2({ ...input, finishedBytes: wrong }),
	).toThrow();
	for (const alpha of [0, 255]) {
		const image = decodePng(input.finishedBytes);
		for (let i = 0; i < image.pixels.length; i += 4)
			image.pixels.set([0, 0, 0, alpha], i);
		const finishedBytes = encodePng(image);
		expect(() =>
			portraitDeliveryV2({
				...input,
				finishedBytes,
				canonicalReceiptBytes: Buffer.from(
					JSON.stringify({ responseSHA: hash(finishedBytes) }),
				),
			}),
		).toThrow("DELIVERY_ALPHA_INVALID");
	}
	expect(() =>
		portraitDeliveryV2({ ...input, canonicalReceiptBytes: Buffer.from("{}") }),
	).toThrow("RESULT_EVIDENCE_MISMATCH");
});

test("legacy integrated evaluator still rejects delivery canvas instead of falsely accepting it", () => {
	const input = deliveryFixture();
	const output = portraitDeliveryV2(input);
	const result = evaluatePortraitAcceptance({
		characterId: "fixture",
		requestId: "fixture",
		imageBytes: output.bytes,
		review: {},
		profile: null,
		measurementBytes: null,
		evidence: [],
	});
	expect(result.pass).toBe(false);
	expect(result.failures).toContain("canvasRGBA");
	expect(evaluateDeliveryAlpha(input.finishedBytes).failures).toContain(
		"canvasRGBA",
	);
});
