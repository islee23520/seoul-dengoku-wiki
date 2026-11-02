import { encodePng } from "../../portrait/acceptance/src/png.ts";
import {
	COMFY_FINISH_MODEL,
	COMFY_FINISH_NODES,
	verifyFinishingProof,
} from "../src/comfyui-finishing.ts";
export function finishingPngFixture(width = 1024, height = 1536) {
	const raw = new Uint8Array(width * height * 4),
		finished = new Uint8Array(raw.length),
		mask = new Uint8Array(raw.length);
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++) {
			const p = (y * width + x) * 4;
			raw.set([120, 80, 40, 255], p);
			const left = Math.ceil((width * 200) / 1024);
			const a =
				y >= (height * 300) / 1536 && x >= left && x < (width * 824) / 1024
					? x === left
						? 128
						: 255
					: 0;
			if (a) finished.set([120, 80, 40, a], p);
			mask.set([a, a, a, 255], p);
		}
	return {
		rawBytes: encodePng({ width, height, pixels: raw }),
		maskBytes: encodePng({ width, height, pixels: mask }),
		rawMaskBytes: encodePng({ width, height, pixels: mask }),
		finishedBytes: encodePng({ width, height, pixels: finished }),
	};
}
export const finishingProof = () =>
	verifyFinishingProof({
		schema: "comfy-finishing-runtime-files.v1",
		method: "server-file-stream-sha256",
		model: {
			filename: COMFY_FINISH_MODEL.filename,
			sha256: COMFY_FINISH_MODEL.sha256,
			bytes: COMFY_FINISH_MODEL.bytes,
		},
		nodes: COMFY_FINISH_NODES,
	});
