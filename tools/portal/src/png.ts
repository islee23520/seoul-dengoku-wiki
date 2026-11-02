import {
	PORTRAIT_ACCEPTANCE_CRITERIA,
	PORTRAIT_DELIVERY_CRITERIA_V2,
} from "../../portrait/acceptance/src/criteria.ts";
import {
	decodePng,
	encodePng,
	PngError,
} from "../../portrait/acceptance/src/png.ts";

export const PORTRAIT_SIZE = "340x510" as const;

// A histogram cannot identify the subject interior, holes, baked checkerboard,
// or gray fringe. No alpha-only measurement can promote these rows to PASS.
export function evaluateDeliveryAlpha(input: Uint8Array) {
	const metrics = measurePng(input);
	const { width, height, pixels } = decodePng(input);
	const failures: string[] = [];
	if (
		width !== PORTRAIT_DELIVERY_CRITERIA_V2.canvas[0] ||
		height !== PORTRAIT_DELIVERY_CRITERIA_V2.canvas[1]
	)
		failures.push("canvasRGBA");
	let transparentPixels = 0,
		opaquePixels = 0,
		partialPixels = 0,
		hiddenRGBPixels = 0,
		crownOccupied = 0;
	for (let p = 0; p < width * height; p++) {
		const offset = p * 4;
		const alpha = pixels[offset + 3] ?? 0;
		if (alpha === 0) {
			transparentPixels++;
			if (pixels[offset] || pixels[offset + 1] || pixels[offset + 2])
				hiddenRGBPixels++;
		} else if (alpha === 255) opaquePixels++;
		else partialPixels++;
		if (p < width && alpha !== 0) crownOccupied++;
	}
	if (!opaquePixels || transparentPixels === width * height)
		failures.push("noOpaqueSubject");
	if (!transparentPixels) failures.push("noTransparentBackground");
	if (hiddenRGBPixels) failures.push("alphaZeroRGBNonzero");
	if (crownOccupied) failures.push("crownNotTransparent");
	const suspicions: string[] = [];
	// Conservative pixel-pattern controls, not semantic segmentation. An enclosed
	// nonopaque component containing transparency needs hole review when it cannot
	// reach the canvas exterior, including through partial-alpha silhouette pixels.
	// Legitimate enclosed openings also HOLD; topology cannot identify anatomy.
	const seen = new Uint8Array(width * height);
	const queue = new Int32Array(width * height);
	for (let p = 0; p < seen.length; p++) {
		if (seen[p] || pixels[p * 4 + 3] === 255) continue;
		let head = 0,
			tail = 1,
			enclosed = true,
			containsZero = false;
		queue[0] = p;
		seen[p] = 1;
		while (head < tail) {
			const i = queue[head++] ?? 0;
			if (pixels[i * 4 + 3] === 0) containsZero = true;
			const x = i % width,
				y = Math.floor(i / width);
			if (!x || !y || x === width - 1 || y === height - 1) enclosed = false;
			for (const j of [
				x ? i - 1 : -1,
				x + 1 < width ? i + 1 : -1,
				y ? i - width : -1,
				y + 1 < height ? i + width : -1,
			]) {
				if (j < 0) continue;
				const a = pixels[j * 4 + 3];
				if (a !== 255 && !seen[j]) {
					seen[j] = 1;
					queue[tail++] = j;
				}
			}
		}
		if (enclosed && containsZero) {
			suspicions.push("enclosedZeroAlpha");
			break;
		}
	}
	let grayEdgePixels = 0,
		checkerPatterns = 0;
	// An 8-level channel spread allows mild chroma/quantization noise. Use
	// coverage rather than absolute brightness: dark gray can be a baked rim too.
	const neutral = (i: number) => {
		const r = pixels[i] ?? 0,
			g = pixels[i + 1] ?? 0,
			b = pixels[i + 2] ?? 0;
		return Math.max(r, g, b) - Math.min(r, g, b) <= 8 ? (r + g + b) / 3 : -1;
	};
	const gray = (x: number, y: number) => {
		const i = (y * width + x) * 4;
		return pixels[i + 3] === 255 ? neutral(i) : -1;
	};
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			const a = pixels[i + 3] ?? 0;
			if (a > 0 && a < 255 && neutral(i) >= 0) grayEdgePixels++;
			// Repeated neutral alternating blocks at common preview tile widths.
			for (const step of [4, 8, 16]) {
				if (x + step >= width || y + step >= height) continue;
				const c = gray(x, y),
					d = gray(x + step, y);
				if (
					c >= 0 &&
					d >= 0 &&
					Math.abs(c - d) >= 20 &&
					gray(x, y + step) >= 0 &&
					gray(x + step, y + step) >= 0 &&
					Math.abs(gray(x, y + step) - d) <= 8 &&
					Math.abs(gray(x + step, y + step) - c) <= 8
				)
					checkerPatterns++;
			}
		}
	if (grayEdgePixels >= 4 && grayEdgePixels >= partialPixels / 2)
		suspicions.push("predominantlyNeutralPartialEdge");
	if (checkerPatterns >= 16) suspicions.push("repeatedNeutralCheckerPattern");
	return {
		schema: PORTRAIT_DELIVERY_CRITERIA_V2.schema,
		width,
		height,
		status: failures.length
			? ("FAIL" as const)
			: suspicions.length
				? ("HOLD" as const)
				: ("PASS" as const),
		failures,
		suspicions,
		machineScope:
			"canvas, alpha extrema, hidden RGB, crown and conservative pixel-pattern controls only",
		qualityQualified: false as const,
		transparentPixels,
		opaquePixels,
		partialPixels,
		hiddenRGBPixels,
		crownOccupied,
		foregroundCoreFraction: metrics.foregroundCoreFraction,
		semanticStatus: "HOLD" as const,
		semanticRows: PORTRAIT_DELIVERY_CRITERIA_V2.semanticRows,
		semanticMaskProven: false as const,
		unresolved: ["interior-and-holes", "baked-checkerboard-RGB", "gray-rim"],
		ownerApprovalImplied: false as const,
	};
}

// Area resampling in premultiplied alpha: invisible RGB must not tint edges.
// The provider's canonical 2:3 canvas is reduced without cropping or padding.
export function resizePortraitPng(input: Uint8Array): Uint8Array {
	const metrics = measurePng(input);
	if (metrics.width !== 1024 || metrics.height !== 1536)
		throw Error("INVALID_PNG");
	const source = decodePng(input);
	const width = 340,
		height = 510;
	const pixels = new Uint8Array(width * height * 4);
	const scale = source.width / width;
	for (let y = 0; y < height; y++) {
		const top = y * scale,
			bottom = (y + 1) * scale;
		for (let x = 0; x < width; x++) {
			const left = x * scale,
				right = (x + 1) * scale;
			let alpha = 0,
				red = 0,
				green = 0,
				blue = 0;
			for (let sy = Math.floor(top); sy < Math.ceil(bottom); sy++) {
				const dy = Math.min(bottom, sy + 1) - Math.max(top, sy);
				for (let sx = Math.floor(left); sx < Math.ceil(right); sx++) {
					const weight = dy * (Math.min(right, sx + 1) - Math.max(left, sx));
					const offset = (sy * source.width + sx) * 4;
					const a = (source.pixels[offset + 3] ?? 0) * weight;
					alpha += a;
					red += (source.pixels[offset] ?? 0) * a;
					green += (source.pixels[offset + 1] ?? 0) * a;
					blue += (source.pixels[offset + 2] ?? 0) * a;
				}
			}
			const offset = (y * width + x) * 4;
			pixels[offset + 3] = Math.round(alpha / (scale * scale));
			if (pixels[offset + 3] !== 0 && alpha > 0) {
				pixels[offset] = Math.round(red / alpha);
				pixels[offset + 1] = Math.round(green / alpha);
				pixels[offset + 2] = Math.round(blue / alpha);
			}
		}
	}
	return encodePng({ width, height, pixels });
}

export function measurePng(input: Uint8Array) {
	const bytes = Buffer.from(input);
	// Bound decoded allocation before the shared decoder reads or inflates the PNG.
	if (
		bytes.length > 8388608 ||
		bytes.length < 45 ||
		bytes.toString("ascii", 12, 16) !== "IHDR"
	)
		throw Error("INVALID_PNG");
	const headerWidth = bytes.readUInt32BE(16),
		headerHeight = bytes.readUInt32BE(20);
	if (
		headerWidth > 4096 ||
		headerHeight > 4096 ||
		headerWidth * headerHeight > 4194304
	)
		throw Error("INVALID_PNG");
	let image: ReturnType<typeof decodePng>;
	try {
		image = decodePng(input);
	} catch (error) {
		if (error instanceof PngError) throw Error("INVALID_PNG");
		throw error;
	}
	if (image.channels !== 4) throw Error("INVALID_PNG");
	const { width, height, pixels } = image;
	let core = 0,
		foreground = 0,
		transparent = 0,
		border = 0,
		margin = 0;
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++) {
			const alpha = pixels[(y * width + x) * 4 + 3] ?? 0;
			if (alpha >= PORTRAIT_ACCEPTANCE_CRITERIA.coreAlphaMinimum) core++;
			if (alpha === 0) transparent++;
			if (alpha > 0) {
				foreground++;
				if (x === 0 || y === 0 || x === width - 1 || y === height - 1) border++;
				if (x < 32 || y < 32 || x >= width - 32 || y >= height - 32) margin++;
			}
		}
	const canvasPixels = width * height,
		canvasOpaqueFraction = core / canvasPixels;
	return {
		schema: "portal-mechanical-png.v1",
		width,
		height,
		coreAlphaThreshold: PORTRAIT_ACCEPTANCE_CRITERIA.coreAlphaMinimum,
		foregroundAlphaMinimum: 1,
		canvasPixels,
		foregroundPixels: foreground,
		corePixels: core,
		// Compatibility field: its original canvas denominator is unchanged.
		coreFraction: canvasOpaqueFraction,
		coreFractionDenominator: "canvasPixels",
		canvasOpaqueFraction,
		foregroundCoreFraction: foreground > 0 ? core / foreground : null,
		foregroundCoreFractionDenominator: "foregroundPixelsAlphaGreaterThanZero",
		transparentFraction: transparent / canvasPixels,
		borderOccupied: border,
		margin32Occupied: margin,
		marginPixels: 32,
		marginSemantics:
			"diagnostic occupancy only; not approved framing or anatomy",
		mechanicalStatus: "NOT_RUN" as const,
		mechanicalScope:
			"PNG diagnostics only; integrated acceptance/profile evaluation not run",
		reviewStatus: "HOLD" as const,
	};
}
