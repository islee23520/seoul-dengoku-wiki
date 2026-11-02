import {
	decodePng,
	encodePng,
} from "../../portrait/acceptance/src/png.ts";
import { measurePng, resizePortraitPng } from "./png.ts";

export const ALPHA_PROCESSOR_V1 =
	"crown-color-edge-connected-12-premultiplied-area.v1";
export const ALPHA_PROCESSOR_V2 =
	"crown-color-edge-connected-12-local-unmix-premultiplied-area.v2";

// Non-generative counterpart of H3's edge-connected color mask. Crown samples
// must agree: lower corners may contain the subject and are never color donors.
export function alphaDerivative(
	input: Uint8Array,
	processor:
		| typeof ALPHA_PROCESSOR_V1
		| typeof ALPHA_PROCESSOR_V2 = ALPHA_PROCESSOR_V2,
): Uint8Array {
	const metrics = measurePng(input);
	if (metrics.width !== 1024 || metrics.height !== 1536)
		throw Error("ALPHA_NATIVE_REQUIRED");
	const { width, height, pixels } = decodePng(input);
	const samples = [0, Math.floor(width / 2), width - 1].map((i) =>
		Array.from(pixels.subarray(i * 4, i * 4 + 3)),
	);
	const color = [0, 1, 2].map((channel) =>
		Math.round(samples.reduce((sum, row) => sum + (row[channel] ?? 0), 0) / 3),
	);
	if (
		samples.some((row) =>
			row.some((value, channel) => Math.abs(value - (color[channel] ?? 0)) > 8),
		)
	)
		throw Error("ALPHA_BACKGROUND_NOT_UNIFORM");
	const count = width * height;
	const mask = new Uint8Array(count);
	const queue = new Int32Array(count);
	let head = 0,
		tail = 0;
	const add = (i: number) => {
		if (
			!mask[i] &&
			color.every(
				(value, channel) =>
					Math.abs((pixels[i * 4 + channel] ?? 0) - value) <= 12,
			)
		) {
			mask[i] = 1;
			queue[tail++] = i;
		}
	};
	for (let x = 0; x < width; x++) add(x);
	for (let y = 0; y < height; y++) {
		add(y * width);
		add(y * width + width - 1);
	}
	while (head < tail) {
		const i = queue[head++] ?? 0;
		const x = i % width,
			y = Math.floor(i / width);
		if (x) add(i - 1);
		if (x + 1 < width) add(i + 1);
		if (y) add(i - width);
		if (y + 1 < height) add(i + width);
	}
	if (tail < count / 100 || tail > count * 0.8)
		throw Error("ALPHA_BACKGROUND_NOT_UNIFORM");
	const output = new Uint8Array(pixels);
	if (processor === ALPHA_PROCESSOR_V2) {
		// Only the native boundary is eligible. Search across it for a stable
		// foreground donor, then solve C = aF + (1-a)B. A poor color-line fit
		// leaves the pixel untouched; this is not a dilation or erosion.
		const boundary = new Set<number>();
		for (let q = 0; q < tail; q++) {
			const i = queue[q] ?? 0;
			for (const j of [i - 1, i + 1, i - width, i + width])
				if (j >= 0 && j < count && !mask[j]) boundary.add(j);
		}
		for (const i of boundary) {
			const x = i % width,
				y = Math.floor(i / width);
			let best:
				| { error: number; alpha: number; foreground: number[] }
				| undefined;
			for (const [dx, dy] of [
				[-1, 0],
				[1, 0],
				[0, -1],
				[0, 1],
				[-1, -1],
				[-1, 1],
				[1, -1],
				[1, 1],
			]) {
				for (let distance = 2; distance <= 12; distance++) {
					const sx = x + (dx ?? 0) * distance,
						sy = y + (dy ?? 0) * distance;
					const tx = sx + (dx ?? 0),
						ty = sy + (dy ?? 0);
					if (
						Math.min(sx, tx) < 0 ||
						Math.max(sx, tx) >= width ||
						Math.min(sy, ty) < 0 ||
						Math.max(sy, ty) >= height
					)
						break;
					const j = sy * width + sx,
						k = ty * width + tx;
					if (mask[j] || mask[k]) continue;
					const foreground = [0, 1, 2].map((c) => pixels[j * 4 + c] ?? 0);
					if (
						foreground.some(
							(v, c) => Math.abs(v - (pixels[k * 4 + c] ?? 0)) > 3,
						)
					)
						continue;
					const direction = foreground.map((v, c) => v - (color[c] ?? 0));
					const norm = direction.reduce((sum, v) => sum + v * v, 0);
					if (norm < 3 * 48 * 48) continue;
					const alpha =
						direction.reduce(
							(sum, v, c) =>
								sum + v * ((pixels[i * 4 + c] ?? 0) - (color[c] ?? 0)),
							0,
						) / norm;
					if (alpha <= 0 || alpha >= 0.98) continue;
					const error = Math.max(
						...direction.map((v, c) =>
							Math.abs(
								(pixels[i * 4 + c] ?? 0) - ((color[c] ?? 0) + alpha * v),
							),
						),
					);
					if (error <= 2 && (!best || alpha > best.alpha))
						best = { error, alpha, foreground };
				}
			}
			if (best) {
				output.set(best.foreground, i * 4);
				output[i * 4 + 3] = Math.round(best.alpha * (pixels[i * 4 + 3] ?? 255));
			}
		}
	}
	for (let i = 0; i < count; i++) {
		if (mask[i]) output.fill(0, i * 4, i * 4 + 4);
	}
	const result = resizePortraitPng(
		encodePng({ width, height, pixels: output }),
	);
	const delivered = decodePng(result);
	// Require a transparent crown; never achieve it by erasing a fixed band.
	for (let x = 0; x < delivered.width; x++)
		if (delivered.pixels[x * 4 + 3] !== 0) throw Error("ALPHA_CROWN_NOT_CLEAR");
	return result;
}
