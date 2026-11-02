import { inflateSync } from "node:zlib";

const signature = [137, 80, 78, 71, 13, 10, 26, 10];

export class PngDecodeError extends Error {
	readonly code = "INVALID_PNG";

	constructor() {
		super("Invalid PNG response");
		this.name = "PngDecodeError";
	}
}

const crc32 = (bytes: Uint8Array): number => {
	let crc = 0xffffffff;
	for (const byte of bytes) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit += 1)
			crc = (crc >>> 1) ^ ((crc & 1) === 1 ? 0xedb88320 : 0);
	}
	return (crc ^ 0xffffffff) >>> 0;
};

export function validatePortraitPng(
	bytes: Uint8Array,
	generationProfile?: "native340-v1" | "cpa340-padded-v1",
): void {
	if (
		bytes.length < 8 ||
		signature.some((byte, index) => bytes[index] !== byte)
	)
		throw new PngDecodeError();
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const parts: Uint8Array[] = [];
	let width = 0;
	let height = 0;
	let sawHeader = false;
	let sawData = false;
	let ended = false;
	let offset = 8;
	while (offset < bytes.length) {
		if (bytes.length - offset < 12) throw new PngDecodeError();
		const length = view.getUint32(offset);
		if (length > bytes.length - offset - 12) throw new PngDecodeError();
		const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
		const body = bytes.subarray(offset + 8, offset + 8 + length);
		if (
			crc32(bytes.subarray(offset + 4, offset + 8 + length)) !==
			view.getUint32(offset + 8 + length)
		)
			throw new PngDecodeError();
		if (!sawHeader && type !== "IHDR") throw new PngDecodeError();
		if (type === "IHDR") {
			if (sawHeader || length !== 13) throw new PngDecodeError();
			sawHeader = true;
			width = view.getUint32(offset + 8);
			height = view.getUint32(offset + 12);
			if (
				width !==
					(generationProfile === "cpa340-padded-v1"
						? 640
						: generationProfile
							? 340
							: 1024) ||
				height !==
					(generationProfile === "cpa340-padded-v1"
						? 1024
						: generationProfile
							? 510
							: 1536) ||
				bytes[offset + 16] !== 8 ||
				bytes[offset + 17] !== 6 ||
				bytes[offset + 18] !== 0 ||
				bytes[offset + 19] !== 0 ||
				bytes[offset + 20] !== 0
			)
				throw new PngDecodeError();
		} else if (type === "IDAT") {
			sawData = true;
			parts.push(body);
		} else if (type === "IEND") {
			if (length !== 0 || offset + 12 !== bytes.length)
				throw new PngDecodeError();
			ended = true;
			break;
		} else if (
			type.charCodeAt(0) >= 65 &&
			type.charCodeAt(0) <= 90 &&
			type !== "PLTE"
		) {
			throw new PngDecodeError();
		}
		offset += length + 12;
	}
	if (!ended || !sawHeader || !sawData) throw new PngDecodeError();
	const expectedLength = (width * 4 + 1) * height;
	let scanlines: Uint8Array;
	try {
		scanlines = inflateSync(Buffer.concat(parts), {
			maxOutputLength: expectedLength,
		});
	} catch (error) {
		if (
			error instanceof Error &&
			"code" in error &&
			(error.code === "Z_BUF_ERROR" ||
				error.code === "Z_DATA_ERROR" ||
				error.code === "ERR_BUFFER_TOO_LARGE")
		)
			throw new PngDecodeError();
		throw error;
	}
	if (scanlines.length !== expectedLength) throw new PngDecodeError();
	for (let row = 0; row < height; row += 1)
		if ((scanlines[row * (width * 4 + 1)] ?? 255) > 4)
			throw new PngDecodeError();
}
