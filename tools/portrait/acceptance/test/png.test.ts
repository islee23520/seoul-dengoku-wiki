import { describe, expect, test } from "bun:test";
import { deflateSync, inflateSync } from "node:zlib";
import {
	decodePng,
	encodePng,
	PngError,
	type PngErrorCode,
} from "../src/png.js";

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

function crc32(bytes: Uint8Array): number {
	let crc = 0xffffffff;
	for (const byte of bytes) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit++)
			crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
	}
	return (crc ^ 0xffffffff) >>> 0;
}

function byteAt(bytes: Uint8Array, index: number): number {
	return bytes[index] ?? 0;
}

function be32(value: number): number[] {
	return [
		(value >>> 24) & 0xff,
		(value >>> 16) & 0xff,
		(value >>> 8) & 0xff,
		value & 0xff,
	];
}

function ihdr(
	width: number,
	height: number,
	colorType: number,
	bitDepth = 8,
	interlace = 0,
): number[] {
	return [
		...be32(width),
		...be32(height),
		bitDepth,
		colorType,
		0,
		0,
		interlace,
	];
}

function pngChunk(type: string, body: readonly number[]): number[] {
	const payload = Array.from(type, (char) => char.charCodeAt(0)).concat(
		...body,
	);
	const crc = crc32(Uint8Array.from(payload));
	return [...be32(body.length), ...payload, ...be32(crc)];
}

interface RawPngSpec {
	width: number;
	height: number;
	colorType: number;
	bitDepth?: number;
	interlace?: number;
	scanlines: Uint8Array;
	splitIdat?: boolean;
	idatOverride?: number[];
	extraChunksBeforeIdat?: number[][];
	extraChunksAfterIdat?: number[][];
	skipIdat?: boolean;
	skipIend?: boolean;
	trailingBytes?: number[];
}

function buildRawPng(spec: RawPngSpec): Uint8Array {
	const parts: number[] = [
		...SIGNATURE,
		...pngChunk(
			"IHDR",
			ihdr(
				spec.width,
				spec.height,
				spec.colorType,
				spec.bitDepth,
				spec.interlace,
			),
		),
	];
	if (spec.extraChunksBeforeIdat) {
		for (const extra of spec.extraChunksBeforeIdat) parts.push(...extra);
	}
	if (!spec.skipIdat) {
		const compressed =
			spec.idatOverride ?? Array.from(deflateSync(spec.scanlines));
		if (spec.splitIdat) {
			const half = Math.ceil(compressed.length / 2);
			parts.push(
				...pngChunk("IDAT", compressed.slice(0, half)),
				...pngChunk("IDAT", compressed.slice(half)),
			);
		} else {
			parts.push(...pngChunk("IDAT", compressed));
		}
	}
	if (spec.extraChunksAfterIdat) {
		for (const extra of spec.extraChunksAfterIdat) parts.push(...extra);
	}
	if (!spec.skipIend) parts.push(...pngChunk("IEND", []));
	if (spec.trailingBytes) parts.push(...spec.trailingBytes);
	return Uint8Array.from(parts);
}

function gradientRgba(width: number, height: number): Uint8Array {
	const pixels = new Uint8Array(width * height * 4);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const offset = (y * width + x) * 4;
			pixels[offset] = (x * 37 + 11) % 256;
			pixels[offset + 1] = (y * 53 + 5) % 256;
			pixels[offset + 2] = (x * 11 + y * 29 + 200) % 256;
			pixels[offset + 3] = (x * 61 + y * 17 + 128) % 256;
		}
	}
	return pixels;
}

function unfilteredScanlines(
	width: number,
	height: number,
	channelsPerPixel: number,
	pixels: Uint8Array,
): Uint8Array {
	const stride = width * channelsPerPixel;
	const raw = new Uint8Array((stride + 1) * height);
	for (let y = 0; y < height; y++) {
		raw.set(
			pixels.subarray(y * stride, (y + 1) * stride),
			y * (stride + 1) + 1,
		);
	}
	return raw;
}

function paethPredictor(a: number, b: number, c: number): number {
	const p = a + b - c;
	const pa = Math.abs(p - a);
	const pb = Math.abs(p - b);
	const pc = Math.abs(p - c);
	return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

interface FilteredImageSpec {
	width: number;
	height: number;
	colorType: number;
	rowFilters: readonly number[];
	pixelChannels: (x: number, y: number) => number[];
}

function buildFilteredPng(spec: FilteredImageSpec): {
	bytes: Uint8Array;
	expected: Uint8Array;
} {
	const bpp = spec.colorType === 6 ? 4 : 3;
	const stride = spec.width * bpp;
	const image = new Uint8Array(stride * spec.height);
	for (let y = 0; y < spec.height; y++) {
		for (let x = 0; x < spec.width; x++) {
			image.set(spec.pixelChannels(x, y), y * stride + x * bpp);
		}
	}
	const raw = new Uint8Array((stride + 1) * spec.height);
	for (let y = 0; y < spec.height; y++) {
		const filter = spec.rowFilters[y % spec.rowFilters.length] ?? 0;
		raw[y * (stride + 1)] = filter;
		for (let x = 0; x < stride; x++) {
			const original = byteAt(image, y * stride + x);
			const left = x >= bpp ? byteAt(image, y * stride + x - bpp) : 0;
			const up = y > 0 ? byteAt(image, (y - 1) * stride + x) : 0;
			const upLeft =
				y > 0 && x >= bpp ? byteAt(image, (y - 1) * stride + x - bpp) : 0;
			let delta = original;
			if (filter === 1) delta = original - left;
			else if (filter === 2) delta = original - up;
			else if (filter === 3) delta = original - Math.floor((left + up) / 2);
			else if (filter === 4)
				delta = original - paethPredictor(left, up, upLeft);
			raw[y * (stride + 1) + x + 1] = ((delta % 256) + 256) % 256;
		}
	}
	return {
		bytes: buildRawPng({
			width: spec.width,
			height: spec.height,
			colorType: spec.colorType,
			scanlines: raw,
		}),
		expected: image,
	};
}

function pngErrorFrom(run: () => unknown): PngError | undefined {
	try {
		run();
	} catch (error: unknown) {
		return error instanceof PngError ? error : undefined;
	}
	return undefined;
}

function expectPngError(run: () => unknown, code: PngErrorCode): void {
	const error = pngErrorFrom(run);
	expect(error).toBeInstanceOf(PngError);
	expect(error?.code).toBe(code);
}

interface ParsedChunk {
	type: string;
	body: Uint8Array;
	crc: number;
}

function readU32(bytes: Uint8Array, offset: number): number {
	return (
		((byteAt(bytes, offset) << 24) |
			(byteAt(bytes, offset + 1) << 16) |
			(byteAt(bytes, offset + 2) << 8) |
			byteAt(bytes, offset + 3)) >>>
		0
	);
}

function chunkAt(chunks: ParsedChunk[], index: number): ParsedChunk {
	const chunk = chunks[index];
	if (!chunk) throw new Error(`missing chunk at index ${index}`);
	return chunk;
}

function parseChunks(bytes: Uint8Array): ParsedChunk[] {
	expect(Array.from(bytes.subarray(0, 8))).toEqual(SIGNATURE);
	const chunks: ParsedChunk[] = [];
	let offset = 8;
	while (offset < bytes.length) {
		const size = readU32(bytes, offset);
		const type = String.fromCharCode(
			byteAt(bytes, offset + 4),
			byteAt(bytes, offset + 5),
			byteAt(bytes, offset + 6),
			byteAt(bytes, offset + 7),
		);
		chunks.push({
			type,
			body: bytes.subarray(offset + 8, offset + 8 + size),
			crc: readU32(bytes, offset + 8 + size),
		});
		offset += size + 12;
	}
	return chunks;
}

describe("decodePng", () => {
	test("roundtrips RGBA pixels through encodePng", () => {
		const width = 5;
		const height = 4;
		const pixels = gradientRgba(width, height);
		const decoded = decodePng(encodePng({ width, height, pixels }));
		expect(decoded.width).toBe(width);
		expect(decoded.height).toBe(height);
		expect(decoded.channels).toBe(4);
		expect(Array.from(decoded.pixels)).toEqual(Array.from(pixels));
	});

	test("roundtrips edge dimensions 1x1, 1x5, 7x3", () => {
		const dimensions: Array<[number, number]> = [
			[1, 1],
			[1, 5],
			[7, 3],
		];
		for (const [width, height] of dimensions) {
			const pixels = gradientRgba(width, height);
			const decoded = decodePng(encodePng({ width, height, pixels }));
			expect(decoded.width).toBe(width);
			expect(decoded.height).toBe(height);
			expect(Array.from(decoded.pixels)).toEqual(Array.from(pixels));
		}
	});

	test("decodes type 6 RGBA with all five PNG filters", () => {
		const { bytes, expected } = buildFilteredPng({
			width: 5,
			height: 5,
			colorType: 6,
			rowFilters: [0, 1, 2, 3, 4],
			pixelChannels: (x, y) => [
				(x * 37 + 11) % 256,
				(y * 53 + 5) % 256,
				(x * 11 + y * 29) % 256,
				(x * 61 + y * 17) % 256,
			],
		});
		const decoded = decodePng(bytes);
		expect(decoded.width).toBe(5);
		expect(decoded.height).toBe(5);
		expect(decoded.channels).toBe(4);
		expect(Array.from(decoded.pixels)).toEqual(Array.from(expected));
	});

	test("decodes type 2 RGB with all five PNG filters", () => {
		const { bytes, expected } = buildFilteredPng({
			width: 4,
			height: 5,
			colorType: 2,
			rowFilters: [0, 1, 2, 3, 4],
			pixelChannels: (x, y) => [
				(x * 91 + 3) % 256,
				(y * 17 + 77) % 256,
				(x * 7 + y * 13) % 256,
			],
		});
		const decoded = decodePng(bytes);
		expect(decoded.width).toBe(4);
		expect(decoded.height).toBe(5);
		expect(decoded.channels).toBe(3);
		expect(Array.from(decoded.pixels)).toEqual(Array.from(expected));
	});

	test("reconstructs deltas that wrap modulo 256", () => {
		const { bytes, expected } = buildFilteredPng({
			width: 3,
			height: 2,
			colorType: 6,
			rowFilters: [1, 4],
			pixelChannels: (x, y) => [
				(x * 127 + y * 128) % 256,
				y === 0 ? 255 : 0,
				200,
				255 - x * 100,
			],
		});
		const decoded = decodePng(bytes);
		expect(Array.from(decoded.pixels)).toEqual(Array.from(expected));
	});

	test("concatenates multiple IDAT chunks", () => {
		const width = 6;
		const height = 3;
		const pixels = gradientRgba(width, height);
		const bytes = buildRawPng({
			width,
			height,
			colorType: 6,
			scanlines: unfilteredScanlines(width, height, 4, pixels),
			splitIdat: true,
		});
		const decoded = decodePng(bytes);
		expect(Array.from(decoded.pixels)).toEqual(Array.from(pixels));
	});

	test("skips ancillary chunks and PLTE", () => {
		const text = pngChunk(
			"tEXt",
			Array.from("hi", (char) => char.charCodeAt(0)),
		);
		const plte = pngChunk("PLTE", [1, 2, 3]);
		const width = 2;
		const height = 2;
		const pixels = gradientRgba(width, height);
		const bytes = buildRawPng({
			width,
			height,
			colorType: 6,
			scanlines: unfilteredScanlines(width, height, 4, pixels),
			extraChunksBeforeIdat: [text, plte],
			extraChunksAfterIdat: [text],
		});
		const decoded = decodePng(bytes);
		expect(Array.from(decoded.pixels)).toEqual(Array.from(pixels));
	});

	test("rejects a wrong signature", () => {
		expectPngError(
			() => decodePng(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9])),
			"not-png",
		);
		expectPngError(() => decodePng(new Uint8Array(0)), "not-png");
	});

	test("rejects a truncated chunk header", () => {
		const bytes = buildRawPng({
			width: 2,
			height: 2,
			colorType: 6,
			scanlines: unfilteredScanlines(2, 2, 4, gradientRgba(2, 2)),
		});
		expectPngError(() => decodePng(bytes.subarray(0, 12)), "truncated");
	});

	test("rejects a chunk length extending past the buffer", () => {
		const bytes = buildRawPng({
			width: 2,
			height: 2,
			colorType: 6,
			scanlines: unfilteredScanlines(2, 2, 4, gradientRgba(2, 2)),
		});
		bytes[8] = 0x7f;
		bytes[9] = 0xff;
		bytes[10] = 0xff;
		bytes[11] = 0xff;
		expectPngError(() => decodePng(bytes), "truncated");
	});

	test("rejects a corrupted CRC", () => {
		const bytes = buildRawPng({
			width: 2,
			height: 2,
			colorType: 6,
			scanlines: unfilteredScanlines(2, 2, 4, gradientRgba(2, 2)),
		});
		const idatBodyStart = 8 + 25 + 8;
		bytes[idatBodyStart] = (byteAt(bytes, idatBodyStart) + 1) % 256;
		expectPngError(() => decodePng(bytes), "invalid-crc");
	});

	test("rejects a missing IHDR", () => {
		const bytes = Uint8Array.from([
			...SIGNATURE,
			...pngChunk("IDAT", [0]),
			...pngChunk("IEND", []),
		]);
		expectPngError(() => decodePng(bytes), "missing-ihdr");
	});

	test("rejects an IHDR that is not 13 bytes", () => {
		const bytes = Uint8Array.from([
			...SIGNATURE,
			...pngChunk("IHDR", ihdr(1, 1, 6).slice(0, 12)),
			...pngChunk("IDAT", [0]),
			...pngChunk("IEND", []),
		]);
		expectPngError(() => decodePng(bytes), "invalid-ihdr");
	});

	test("rejects a duplicated IHDR", () => {
		const bytes = Uint8Array.from([
			...SIGNATURE,
			...pngChunk("IHDR", ihdr(1, 1, 6)),
			...pngChunk("IDAT", [0]),
			...pngChunk("IHDR", ihdr(1, 1, 6)),
			...pngChunk("IEND", []),
		]);
		expectPngError(() => decodePng(bytes), "invalid-ihdr");
	});

	test("rejects unsupported color types", () => {
		const grayscale = Uint8Array.from([
			...SIGNATURE,
			...pngChunk("IHDR", ihdr(1, 1, 0)),
			...pngChunk("IDAT", [0, 255]),
			...pngChunk("IEND", []),
		]);
		expectPngError(() => decodePng(grayscale), "unsupported-encoding");
	});

	test("rejects unsupported bit depths", () => {
		const sixteenBit = Uint8Array.from([
			...SIGNATURE,
			...pngChunk("IHDR", ihdr(1, 1, 6, 16)),
			...pngChunk("IDAT", [0, 0]),
			...pngChunk("IEND", []),
		]);
		expectPngError(() => decodePng(sixteenBit), "unsupported-encoding");
	});

	test("rejects interlaced PNGs", () => {
		const interlaced = Uint8Array.from([
			...SIGNATURE,
			...pngChunk("IHDR", ihdr(1, 1, 6, 8, 1)),
			...pngChunk("IDAT", [0, 0]),
			...pngChunk("IEND", []),
		]);
		expectPngError(() => decodePng(interlaced), "unsupported-encoding");
	});

	test("rejects zero dimensions", () => {
		const zeroWidth = Uint8Array.from([
			...SIGNATURE,
			...pngChunk("IHDR", ihdr(0, 1, 6)),
			...pngChunk("IDAT", [0, 0]),
			...pngChunk("IEND", []),
		]);
		expectPngError(() => decodePng(zeroWidth), "unsupported-encoding");
		const zeroHeight = Uint8Array.from([
			...SIGNATURE,
			...pngChunk("IHDR", ihdr(1, 0, 6)),
			...pngChunk("IDAT", [0, 0]),
			...pngChunk("IEND", []),
		]);
		expectPngError(() => decodePng(zeroHeight), "unsupported-encoding");
	});

	test("rejects images beyond the 40 megapixel limit", () => {
		const huge = Uint8Array.from([
			...SIGNATURE,
			...pngChunk("IHDR", ihdr(6000, 7000, 6)),
			...pngChunk("IDAT", [0]),
			...pngChunk("IEND", []),
		]);
		expectPngError(() => decodePng(huge), "unsupported-encoding");
	});

	test("rejects a non-empty or followed IEND", () => {
		const paddedIend = Uint8Array.from([
			...SIGNATURE,
			...pngChunk("IHDR", ihdr(1, 1, 6)),
			...pngChunk("IDAT", [0, 0]),
			...pngChunk("IEND", [1]),
		]);
		expectPngError(() => decodePng(paddedIend), "invalid-end");
		const trailing = Uint8Array.from([
			...SIGNATURE,
			...pngChunk("IHDR", ihdr(1, 1, 6)),
			...pngChunk("IDAT", [0, 0]),
			...pngChunk("IEND", []),
			0,
			0,
		]);
		expectPngError(() => decodePng(trailing), "invalid-end");
	});

	test("rejects an incomplete PNG without IEND or IDAT", () => {
		const noIend = Uint8Array.from([
			...SIGNATURE,
			...pngChunk("IHDR", ihdr(1, 1, 6)),
			...pngChunk("IDAT", [0, 0]),
		]);
		expectPngError(() => decodePng(noIend), "incomplete");
		const noIdat = Uint8Array.from([
			...SIGNATURE,
			...pngChunk("IHDR", ihdr(1, 1, 6)),
			...pngChunk("IEND", []),
		]);
		expectPngError(() => decodePng(noIdat), "incomplete");
	});

	test("rejects unknown critical chunks", () => {
		const withAbcd = Uint8Array.from([
			...SIGNATURE,
			...pngChunk("IHDR", ihdr(1, 1, 6)),
			...pngChunk("ABCD", [1]),
			...pngChunk("IDAT", [0, 0]),
			...pngChunk("IEND", []),
		]);
		expectPngError(() => decodePng(withAbcd), "unsupported-chunk");
	});

	test("rejects an unknown filter type", () => {
		const raw = unfilteredScanlines(1, 1, 4, gradientRgba(1, 1));
		raw[0] = 5;
		const bytes = buildRawPng({
			width: 1,
			height: 1,
			colorType: 6,
			scanlines: raw,
		});
		expectPngError(() => decodePng(bytes), "invalid-filter");
	});

	test("rejects short scanline data", () => {
		const full = unfilteredScanlines(2, 2, 4, gradientRgba(2, 2));
		const bytes = buildRawPng({
			width: 2,
			height: 2,
			colorType: 6,
			scanlines: full.subarray(0, full.length - 3),
		});
		expectPngError(() => decodePng(bytes), "invalid-scanline");
	});

	test("rejects a corrupt IDAT stream with a typed error", () => {
		const bytes = buildRawPng({
			width: 1,
			height: 1,
			colorType: 6,
			scanlines: Uint8Array.of(0),
			idatOverride: [0xde, 0xad, 0xbe, 0xef],
		});
		expectPngError(() => decodePng(bytes), "invalid-idat");
	});
});

describe("encodePng", () => {
	test("emits signature, IHDR color type 6, zero filters, and IEND", () => {
		const width = 3;
		const height = 2;
		const pixels = gradientRgba(width, height);
		const bytes = encodePng({ width, height, pixels });
		expect(Array.from(bytes.subarray(0, 8))).toEqual(SIGNATURE);
		const chunks = parseChunks(bytes);
		expect(chunks.map((chunk) => chunk.type)).toEqual(["IHDR", "IDAT", "IEND"]);
		const header = chunkAt(chunks, 0).body;
		expect(readU32(header, 0)).toBe(width);
		expect(readU32(header, 4)).toBe(height);
		expect(Array.from(header.subarray(8))).toEqual([8, 6, 0, 0, 0]);
		for (const chunk of chunks) {
			const payload = [
				...Array.from(chunk.type, (char) => char.charCodeAt(0)),
				...Array.from(chunk.body),
			];
			expect(crc32(Uint8Array.from(payload))).toBe(chunk.crc);
		}
		const stride = width * 4;
		const scanlines = inflateSync(chunkAt(chunks, 1).body);
		expect(scanlines.length).toBe((stride + 1) * height);
		for (let y = 0; y < height; y++) {
			expect(scanlines[y * (stride + 1)] ?? -1).toBe(0);
			expect(
				Array.from(
					scanlines.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)),
				),
			).toEqual(Array.from(pixels.subarray(y * stride, (y + 1) * stride)));
		}
		expect(chunkAt(chunks, 2).body.length).toBe(0);
	});

	test("rejects invalid dimensions and pixel lengths", () => {
		const pixels = gradientRgba(2, 2);
		expectPngError(
			() => encodePng({ width: 1.5, height: 2, pixels }),
			"invalid-input",
		);
		expectPngError(
			() => encodePng({ width: 0, height: 2, pixels }),
			"invalid-input",
		);
		expectPngError(
			() => encodePng({ width: 2, height: -1, pixels }),
			"invalid-input",
		);
		expectPngError(
			() => encodePng({ width: 2, height: 2, pixels: pixels.subarray(0, 12) }),
			"invalid-input",
		);
	});
});

describe("typed errors", () => {
	test("PngError carries a code and narrows from unknown", () => {
		const error = pngErrorFrom(() => decodePng(new Uint8Array(0)));
		expect(error).toBeInstanceOf(PngError);
		expect(error?.code).toBe("not-png");
		expect(error?.name).toBe("PngError");
		expect((error?.message ?? "").length).toBeGreaterThan(0);
	});

	test("encodePng rejections are PngError instances", () => {
		const error = pngErrorFrom(() =>
			encodePng({ width: 0, height: 0, pixels: new Uint8Array(0) }),
		);
		expect(error).toBeInstanceOf(PngError);
		expect(error?.message).toContain("RGBA");
	});
});
