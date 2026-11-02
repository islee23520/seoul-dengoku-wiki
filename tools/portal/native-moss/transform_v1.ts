import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import {
	decodePng,
	encodePng,
} from "./png_v1.ts";
function measurePng(input: Uint8Array) {
 const bytes=Buffer.from(input);
 if(bytes.length>8388608 || bytes.length<45 || bytes.toString("ascii",12,16)!=="IHDR" || bytes.readUInt32BE(16)>4096 || bytes.readUInt32BE(20)>4096 || bytes.readUInt32BE(16)*bytes.readUInt32BE(20)>4194304) throw Error("INVALID_PNG");
 if(decodePng(input).channels!==4) throw Error("INVALID_PNG");
}

const hash = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");

// RGB is a separate conditioning artifact, not an alpha replacement of source.
export function rgbPng(width: number, height: number, rgba: Uint8Array) {
	const scanlines = Buffer.alloc((width * 3 + 1) * height);
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++) {
			const input = (y * width + x) * 4;
			const output = y * (width * 3 + 1) + 1 + x * 3;
			const alpha = (rgba[input + 3] ?? 0) / 255;
			for (let c = 0; c < 3; c++)
				scanlines[output + c] = Math.round(
					(rgba[input + c] ?? 0) * alpha + (224 + c * 2) * (1 - alpha),
				);
		}
	const chunk = (type: string, data: Uint8Array) => {
		const bytes = Buffer.alloc(data.length + 12);
		bytes.writeUInt32BE(data.length);
		bytes.write(type, 4);
		bytes.set(data, 8);
		let crc = 0xffffffff;
		for (const byte of bytes.subarray(4, 8 + data.length)) {
			crc ^= byte;
			for (let bit = 0; bit < 8; bit++)
				crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
		}
		bytes.writeUInt32BE((crc ^ 0xffffffff) >>> 0, 8 + data.length);
		return bytes;
	};
	const header = Buffer.alloc(13);
	header.writeUInt32BE(width);
	header.writeUInt32BE(height, 4);
	header[8] = 8;
	header[9] = 2;
	return Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		chunk("IHDR", header),
		chunk("IDAT", deflateSync(scanlines)),
		chunk("IEND", new Uint8Array()),
	]);
}

export type ReferenceTransform = ReturnType<typeof transformReferencePng>;

// Both artifacts sample the immutable original. Canonical never upscales;
// native is explicitly a computation canvas and may upscale a small original.
function transformReferenceContent(
	original: Uint8Array,
	target: "canonical" | "native" = "canonical",
	generationProfile?: "native340-v1" | "cpa340-padded-v1",
	engine: "cpa" | "comfyui" = "cpa",
) {
	measurePng(original);
	const source = decodePng(original);
	const small = target === "native" && generationProfile === "native340-v1";
	const padded = small && engine === "comfyui";
	const width = padded ? 352 : target === "canonical" || small ? 340 : 1024;
	const height = padded ? 512 : target === "canonical" || small ? 510 : 1536;
	const contentCanvasWidth = small ? 340 : width;
	const contentCanvasHeight = small ? 510 : height;
	const scale = Math.min(
		contentCanvasWidth / source.width,
		contentCanvasHeight / source.height,
		target === "canonical" ? 1 : Number.POSITIVE_INFINITY,
	);
	const contentWidth = Math.max(1, Math.round(source.width * scale));
	const contentHeight = Math.max(1, Math.round(source.height * scale));
	const xOffset = Math.floor((width - contentWidth) / 2);
	const yOffset = Math.floor((height - contentHeight) / 2);
	const pixels = new Uint8Array(width * height * 4);
	const scaleX = source.width / contentWidth;
	const scaleY = source.height / contentHeight;
	for (let y = 0; y < contentHeight; y++) {
		const top = y * scaleY;
		const bottom = Math.min(source.height, (y + 1) * scaleY);
		for (let x = 0; x < contentWidth; x++) {
			const left = x * scaleX;
			const right = Math.min(source.width, (x + 1) * scaleX);
			let alpha = 0;
			let red = 0;
			let green = 0;
			let blue = 0;
			for (let sy = Math.floor(top); sy < Math.ceil(bottom); sy++)
				for (let sx = Math.floor(left); sx < Math.ceil(right); sx++) {
					const weight =
						(Math.min(bottom, sy + 1) - Math.max(top, sy)) *
						(Math.min(right, sx + 1) - Math.max(left, sx));
					const i = (sy * source.width + sx) * 4;
					const a = (source.pixels[i + 3] ?? 0) * weight;
					alpha += a;
					red += (source.pixels[i] ?? 0) * a;
					green += (source.pixels[i + 1] ?? 0) * a;
					blue += (source.pixels[i + 2] ?? 0) * a;
				}
			const i = ((y + yOffset) * width + x + xOffset) * 4;
			pixels[i + 3] = Math.round(alpha / ((right - left) * (bottom - top)));
			if (pixels[i + 3] !== 0 && alpha > 0) {
				pixels[i] = Math.round(red / alpha);
				pixels[i + 1] = Math.round(green / alpha);
				pixels[i + 2] = Math.round(blue / alpha);
			}
		}
	}
	const rgbaBytes = encodePng({ width, height, pixels });
	const rgbBytes = rgbPng(width, height, pixels);
	return {
		rgbaBytes,
		rgbBytes,
		receipt: {
			schemaVersion: 2 as const,
			...(small
				? {
						generationProfile,
						requested: { width: 340, height: 510 },
						computationalContentRect: {
							x: padded ? 6 : 0,
							y: padded ? 1 : 0,
							width: 340,
							height: 510,
						},
					}
				: {}),
			algorithm: "original-contain-premultiplied-area-box-v2" as const,
			target,
			sourceSHA256: hash(original),
			sourceWidth: source.width,
			sourceHeight: source.height,
			width,
			height,
			contentRect: {
				x: xOffset,
				y: yOffset,
				width: contentWidth,
				height: contentHeight,
			},
			scale,
			samplingScale: { x: 1 / scaleX, y: 1 / scaleY },
			upscaled: scale > 1,
			crop: null,
			rgbaSHA256: hash(rgbaBytes),
			rgbaPixelsSHA256: hash(pixels),
			rgbSHA256: hash(rgbBytes),
			matte: [224, 226, 228],
			encoder: "png-filter-none-zlib-default",
			zlibVersion: process.versions.zlib,
		},
	};
}

export function transformReferencePng(original: Uint8Array) { return transformReferenceContent(original, "native", "native340-v1", "comfyui"); }
