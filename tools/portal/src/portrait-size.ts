import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import {
	decodePng,
	encodePng,
} from "../../portrait/acceptance/src/png.ts";
import {
	cpaPadding,
	cpaPaddingSchema,
} from "../../portrait/generator/src/cpa-padding.ts";
import { evaluateDeliveryAlpha, resizePortraitPng } from "./png.ts";
import { hash } from "./sources.ts";

const sha = z.string().regex(/^[a-f0-9]{64}$/);
// Training has no invented recipient canvas in tokens-only mode. Its canonical
// receipt binds the ordered input roles independently of delivery geometry.
export function trainingPortraitDelivery(input: {
	readonly rawBytes: Uint8Array;
	readonly canonicalReceiptBytes: Uint8Array;
}) {
	const receipt = z.object({
		schema: z.literal("cpa-training-generation-receipt.v1"),
		generationProfile: z.literal("cpa340-padded-v1"),
		generationGeometry: cpaPaddingSchema,
		responseSHA: sha,
		modelAttestation: z.literal("MATCH"),
	}).parse(JSON.parse(Buffer.from(input.canonicalReceiptBytes).toString("utf8")));
	if (receipt.responseSHA !== hash(input.rawBytes)) throw Error("RESULT_EVIDENCE_MISMATCH");
	const image = decodePng(input.rawBytes);
	if (image.width !== 640 || image.height !== 1024 || image.channels !== 4) throw Error("INVALID_PNG");
	for (let y = 0; y < 1024; y++) {
		for (let x = 0; x < 640; x++) {
			const offset = (y * 640 + x) * 4;
			if ((x < 150 || x >= 490 || y < 257 || y >= 767) && image.pixels[offset + 3] !== 0) throw Error("CPA_CONTENT_OUTSIDE_APPROVED_RECT");
			if (image.pixels[offset + 3] === 0 && (image.pixels[offset] !== 0 || image.pixels[offset + 1] !== 0 || image.pixels[offset + 2] !== 0)) throw Error("DELIVERY_ALPHA_INVALID");
		}
	}
	const pixels = new Uint8Array(340 * 510 * 4);
	for (let y = 0; y < 510; y++) pixels.set(image.pixels.subarray(((y + 257) * 640 + 150) * 4, ((y + 257) * 640 + 490) * 4), y * 340 * 4);
	const bytes = encodePng({ width: 340, height: 510, pixels });
	const alpha = evaluateDeliveryAlpha(bytes);
	if (alpha.status === "FAIL") throw Error("DELIVERY_ALPHA_INVALID");
	const transformation = { schema: "training-delivery-cpa340-padded.v1", geometry: cpaPadding, algorithm: "remove-declared-transparent-padding-only-v1", rawSHA256: hash(input.rawBytes), deliverySHA256: hash(bytes), canonicalReceiptSHA256: hash(input.canonicalReceiptBytes) };
	return { bytes, alpha, transformation };
}

export const deliveryTransformationSchemaV2 = z.strictObject({
	schema: z.literal("portrait-delivery-transformation.v2"),
	algorithm: z.literal("premultiplied-alpha-area-v1"),
	originalSHA: sha,
	nativeSHA: sha,
	rawSHA: sha,
	finishedSHA: sha,
	deliverySHA: sha,
	canonicalReceiptSHA: sha,
	sourceWidth: z.literal(1024),
	sourceHeight: z.literal(1536),
	width: z.literal(340),
	height: z.literal(510),
	sourcePadding: z.literal("computational-contain-not-authored"),
	deliveryPadding: z.literal("none"),
});

export const native340TransformationSchema = z.strictObject({
	schema: z.literal("portrait-delivery-native340.v1"),
	generationProfile: z.literal("native340-v1"),
	requested: z.tuple([z.literal(340), z.literal(510)]),
	canvas: z.union([
		z.tuple([z.literal(340), z.literal(510)]),
		z.tuple([z.literal(352), z.literal(512)]),
	]),
	contentRect: z.strictObject({
		x: z.union([z.literal(0), z.literal(6)]),
		y: z.union([z.literal(0), z.literal(1)]),
		width: z.literal(340),
		height: z.literal(510),
	}),
	output: z.tuple([z.literal(340), z.literal(510)]),
	algorithm: z.literal("remove-computational-padding-only-v1"),
	originalSHA: sha,
	nativeSHA: sha,
	rawSHA: sha,
	finishedSHA: sha,
	deliverySHA: sha,
	canonicalReceiptSHA: sha,
});

// The rectangle removes only the engine's 6/1-pixel outer pad. The source's
// authored framing and any original-aspect contain space inside it are retained.
export function native340Output(source: Uint8Array, engine: "cpa" | "comfyui") {
	const image = decodePng(source);
	const padded = engine === "comfyui";
	if (
		image.width !== (padded ? 352 : 340) ||
		image.height !== (padded ? 512 : 510) ||
		image.channels !== 4
	)
		throw Error("INVALID_PNG");
	if (!padded) return source;
	const pixels = new Uint8Array(340 * 510 * 4);
	for (let y = 0; y < 510; y++)
		pixels.set(
			image.pixels.subarray(((y + 1) * 352 + 6) * 4, ((y + 1) * 352 + 346) * 4),
			y * 340 * 4,
		);
	return encodePng({ width: 340, height: 510, pixels });
}

// Explicit opt-in: legacy portraitOutput and its receipt bytes stay unchanged.
// nativeBytes is the retained computational condition canvas; rawBytes is the
// provider render before finishing. They have distinct roles even if hashes match.
export function portraitDeliveryV2(input: {
	generationProfile?: "native340-v1" | "cpa340-padded-v1";
	engine?: "cpa" | "comfyui";
	originalBytes: Uint8Array;
	nativeBytes: Uint8Array;
	rawBytes: Uint8Array;
	finishedBytes: Uint8Array;
	canonicalReceiptBytes: Uint8Array;
}) {
	if (input.generationProfile === "cpa340-padded-v1") {
		if (input.engine !== "cpa") throw Error("RESULT_EVIDENCE_MISMATCH");
		for (const bytes of [
			input.nativeBytes,
			input.rawBytes,
			input.finishedBytes,
		]) {
			const image = decodePng(bytes);
			if (image.width !== 640 || image.height !== 1024 || image.channels !== 4)
				throw Error("INVALID_PNG");
			for (let y = 0; y < 1024; y++)
				for (let x = 0; x < 640; x++)
					if (
						(x < 150 || x >= 490 || y < 257 || y >= 767) &&
						image.pixels[(y * 640 + x) * 4 + 3] !== 0
					)
						throw Error("CPA_CONTENT_OUTSIDE_APPROVED_RECT");
		}
		const canonical = JSON.parse(
			Buffer.from(input.canonicalReceiptBytes).toString(),
		);
		if (
			canonical.generationProfile !== input.generationProfile ||
			!isDeepStrictEqual(
				canonical.generationGeometry,
				cpaPaddingSchema.parse(cpaPadding),
			) ||
			canonical.responseSHA !== hash(input.finishedBytes) ||
			canonical.referenceHashes?.[0] !== hash(input.nativeBytes) ||
			canonical.sourceSHA256 !== hash(input.originalBytes)
		)
			throw Error("RESULT_EVIDENCE_MISMATCH");
		const image = decodePng(input.finishedBytes);
		const pixels = new Uint8Array(340 * 510 * 4);
		for (let y = 0; y < 510; y++)
			pixels.set(
				image.pixels.subarray(
					((y + 257) * 640 + 150) * 4,
					((y + 257) * 640 + 490) * 4,
				),
				y * 340 * 4,
			);
		const bytes = encodePng({ width: 340, height: 510, pixels });
		const transformation = {
			schema: "portrait-delivery-cpa340-padded.v1",
			generationProfile: input.generationProfile,
			geometry: cpaPadding,
			algorithm: "remove-declared-transparent-padding-only-v1",
			originalSHA: hash(input.originalBytes),
			nativeSHA: hash(input.nativeBytes),
			rawSHA: hash(input.rawBytes),
			finishedSHA: hash(input.finishedBytes),
			deliverySHA: hash(bytes),
			canonicalReceiptSHA: hash(input.canonicalReceiptBytes),
		};
		const alpha = evaluateDeliveryAlpha(bytes);
		if (alpha.status === "FAIL") throw Error("DELIVERY_ALPHA_INVALID");
		return {
			bytes,
			responseSHA: hash(bytes),
			transformation,
			alpha,
			receiptBytes: Buffer.from(
				`${JSON.stringify({ ...canonical, responseSHA: hash(bytes), transformation })}\n`,
			),
		};
	}
	if (input.generationProfile) {
		const engine = input.engine ?? "cpa";
		for (const bytes of [input.nativeBytes, input.rawBytes]) {
			const image = decodePng(bytes);
			if (
				image.width !== (engine === "comfyui" ? 352 : 340) ||
				image.height !== (engine === "comfyui" ? 512 : 510)
			)
				throw Error("INVALID_PNG");
		}
		const canonical = JSON.parse(
			Buffer.from(input.canonicalReceiptBytes).toString(),
		);
		if (
			canonical.generationProfile !== input.generationProfile ||
			canonical.responseSHA !== hash(input.finishedBytes)
		)
			throw Error("RESULT_EVIDENCE_MISMATCH");
		const bytes = native340Output(input.finishedBytes, engine);
		const transformation = native340TransformationSchema.parse({
			schema: "portrait-delivery-native340.v1",
			generationProfile: input.generationProfile,
			requested: [340, 510],
			canvas: engine === "comfyui" ? [352, 512] : [340, 510],
			contentRect: {
				x: engine === "comfyui" ? 6 : 0,
				y: engine === "comfyui" ? 1 : 0,
				width: 340,
				height: 510,
			},
			output: [340, 510],
			algorithm: "remove-computational-padding-only-v1",
			originalSHA: hash(input.originalBytes),
			nativeSHA: hash(input.nativeBytes),
			rawSHA: hash(input.rawBytes),
			finishedSHA: hash(input.finishedBytes),
			deliverySHA: hash(bytes),
			canonicalReceiptSHA: hash(input.canonicalReceiptBytes),
		});
		const alpha = evaluateDeliveryAlpha(bytes);
		if (alpha.status === "FAIL") throw Error("DELIVERY_ALPHA_INVALID");
		return {
			bytes,
			responseSHA: hash(bytes),
			transformation,
			alpha,
			receiptBytes: Buffer.from(
				`${JSON.stringify({ ...canonical, responseSHA: hash(bytes), transformation })}\n`,
			),
		};
	}
	for (const imageBytes of [input.nativeBytes, input.rawBytes]) {
		if (imageBytes.length > 8388608) throw Error("INVALID_PNG");
		const image = decodePng(imageBytes);
		if (image.width !== 1024 || image.height !== 1536)
			throw Error("INVALID_PNG");
	}
	const canonical = JSON.parse(
		Buffer.from(input.canonicalReceiptBytes).toString("utf8"),
	);
	if (canonical.responseSHA !== hash(input.finishedBytes))
		throw Error("RESULT_EVIDENCE_MISMATCH");
	const bytes = resizePortraitPng(input.finishedBytes);
	const transformation = deliveryTransformationSchemaV2.parse({
		schema: "portrait-delivery-transformation.v2",
		algorithm: "premultiplied-alpha-area-v1",
		originalSHA: hash(input.originalBytes),
		nativeSHA: hash(input.nativeBytes),
		rawSHA: hash(input.rawBytes),
		finishedSHA: hash(input.finishedBytes),
		deliverySHA: hash(bytes),
		canonicalReceiptSHA: hash(input.canonicalReceiptBytes),
		sourceWidth: 1024,
		sourceHeight: 1536,
		width: 340,
		height: 510,
		sourcePadding: "computational-contain-not-authored",
		deliveryPadding: "none",
	});
	const alpha = evaluateDeliveryAlpha(bytes);
	if (alpha.status === "FAIL") throw Error("DELIVERY_ALPHA_INVALID");
	return {
		bytes,
		responseSHA: transformation.deliverySHA,
		transformation,
		alpha,
		receiptBytes: Buffer.from(
			`${JSON.stringify({ ...canonical, responseSHA: transformation.deliverySHA, transformation })}\n`,
		),
	};
}

export function verifyPortraitDeliveryV2(
	input: Parameters<typeof portraitDeliveryV2>[0] & {
		deliveryBytes: Uint8Array;
		deliveryReceiptBytes: Uint8Array;
	},
) {
	const expected = portraitDeliveryV2(input);
	if (
		hash(input.deliveryBytes) !== expected.responseSHA ||
		hash(input.deliveryReceiptBytes) !== hash(expected.receiptBytes)
	)
		throw Error("RESULT_EVIDENCE_MISMATCH");
	return expected.alpha;
}
export const portraitTransformationSchema = z.strictObject({
	algorithm: z.enum([
		"premultiplied-alpha-area-v1",
		"remove-computational-padding-only-v1",
	]),
	generationProfile: z.literal("native340-v1").optional(),
	sourcePngSHA: sha,
	outputPngSHA: sha,
	canonicalReceiptSHA: sha,
	sourceWidth: z.union([z.literal(1024), z.literal(352)]),
	sourceHeight: z.union([z.literal(1536), z.literal(512)]),
	width: z.literal(340),
	height: z.literal(510),
});

export function portraitOutput(
	source: Uint8Array,
	canonicalReceipt: Uint8Array,
) {
	const receipt = JSON.parse(Buffer.from(canonicalReceipt).toString("utf8"));
	if (receipt.responseSHA !== hash(source))
		throw Error("RESULT_EVIDENCE_MISMATCH");
	if (receipt.generationProfile === "native340-v1") {
		const bytes = native340Output(source, "comfyui");
		const transformation = portraitTransformationSchema.parse({
			algorithm: "remove-computational-padding-only-v1",
			generationProfile: "native340-v1",
			sourcePngSHA: hash(source),
			outputPngSHA: hash(bytes),
			canonicalReceiptSHA: hash(canonicalReceipt),
			sourceWidth: 352,
			sourceHeight: 512,
			width: 340,
			height: 510,
		});
		return {
			bytes,
			responseSHA: hash(bytes),
			receiptBytes: Buffer.from(
				JSON.stringify({
					...receipt,
					responseSHA: hash(bytes),
					transformation,
				}),
			),
		};
	}
	const bytes = resizePortraitPng(source);
	const responseSHA = hash(bytes);
	const transformation = portraitTransformationSchema.parse({
		algorithm: "premultiplied-alpha-area-v1",
		sourcePngSHA: hash(source),
		outputPngSHA: responseSHA,
		canonicalReceiptSHA: hash(canonicalReceipt),
		sourceWidth: 1024,
		sourceHeight: 1536,
		width: 340,
		height: 510,
	});
	// Keys absent from a canonical receipt are dropped by JSON.stringify, so the
	// GPT delivery receipt bytes are unchanged; a ComfyUI canonical receipt keeps
	// its provider/workflow/prompt identity instead of being flattened into a
	// GPT-shaped record.
	const candidate = Object.fromEntries(
		[
			"requestId",
			"model",
			"textSHA",
			"renderingSHA",
			"sourceSHA",
			"referenceHashes",
			"status",
			"reviewStatus",
			"provider",
			"generationProfile",
			"generationGeometry",
			"workflow",
			"promptSHA",
			"promptCompiler",
			"models",
			"promptId",
			"terminalNode",
			"seed",
			"nativeSHA",
			"sourcePngSHA",
			"requestSHA",
			"historySHA",
			"assetProofSHA",
			"lora",
			"finishing",
		].map((key) => [key, receipt[key]]),
	);
	return {
		bytes,
		responseSHA,
		receiptBytes: Buffer.from(
			`${JSON.stringify({ ...candidate, responseSHA, transformation })}\n`,
		),
	};
}
