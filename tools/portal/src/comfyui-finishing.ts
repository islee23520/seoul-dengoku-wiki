import { createHash } from "node:crypto";
import { open } from "node:fs/promises";
import { z } from "zod";
import { decodePng } from "../../portrait/acceptance/src/png.ts";
import {
	measureRemoteComfyFiles,
	remoteComfyProofSchema,
} from "./comfyui-file-proof.ts";

const root = "D:/AI/environments/PNGAL/ComfyUI-pngal-0.28.0";
export const COMFY_FINISH_MODEL = Object.freeze({
	filename: "birefnet.safetensors",
	sha256: "9ab37426bf4de0567af6b5d21b16151357149139362e6e8992021b8ce356a154",
	bytes: 444473596,
	license: "MIT",
	revision: "25511f8787e51912e1480706b4e47b8f467fbf72",
});
export const COMFY_FINISH_NODES = Object.freeze({
	"comfy/bg_removal_model.py":
		"bdbae0667e859bded2e039868dd1f309a63b64dae9b5120b7056ce09dd273e22",
	"comfy_extras/nodes_bg_removal.py":
		"c2cf4b42f10cfb1bb057b60a8745fb96a2462e1f1a2bd275e00795bb3f758cce",
	"comfy_extras/nodes_compositing.py":
		"ef1712ca69ebb1dbd2141bff866674ec73b2ebea757aadf02f7aec59644d9257",
	"comfy_extras/nodes_mask.py":
		"08171f430ddd9a327cec92293ac25fd1bc39d5c9079187a51463fb42d2a9d65b",
	"comfy/background_removal/birefnet.py":
		"2daee3294b76672e416dfe39f3742493757516e7599b780c54435aab473db08d",
	"comfy/background_removal/birefnet.json":
		"50dd9639fa207a823437370b46d32a56b3f00eb1bef3bd225fe87eeeb8f255d2",
	"nodes.py":
		"a6db3d4ea52220db85bf92a01e27a3e8b17545f7d1c6d2fc6c929f1eb27b111e",
});
const sha = z.string().regex(/^[a-f0-9]{64}$/);
export const finishingReceiptSchema = z.strictObject({
	recipe: z.literal("birefnet-continuous-nearone.v1"),
	modelSHA: z.literal(COMFY_FINISH_MODEL.sha256),
	proofSHA: sha,
	rawSHA: sha,
	rawMaskSHA: sha,
	maskSHA: sha,
	finishedSHA: sha,
	matteQuality: z.literal("OWNER_REVIEW_REQUIRED"),
});
export const finishingProofSchema = z.strictObject({
	schema: z.literal("comfy-finishing-runtime-files.v1"),
	method: z.literal("server-file-stream-sha256"),
	model: z.strictObject({
		filename: z.literal(COMFY_FINISH_MODEL.filename),
		sha256: z.literal(COMFY_FINISH_MODEL.sha256),
		bytes: z.literal(COMFY_FINISH_MODEL.bytes),
	}),
	nodes: z.record(z.string(), sha),
	remote: remoteComfyProofSchema.optional(),
});
export function verifyFinishingProof(value: unknown) {
	const proof = finishingProofSchema.parse(value);
	if (JSON.stringify(proof.nodes) !== JSON.stringify(COMFY_FINISH_NODES))
		throw Error("COMFY_FINISH_ASSET_MISMATCH");
	if (proof.remote) {
		const [model, ...nodes] = proof.remote.files;
		if (
			!model ||
			model.path !==
				`${root}/models/background_removal/${proof.model.filename}` ||
			model.sha256 !== proof.model.sha256 ||
			model.bytes !== proof.model.bytes ||
			nodes.length !== Object.keys(COMFY_FINISH_NODES).length ||
			nodes.some(
				(file, index) =>
					file.path !== `${root}/${Object.keys(COMFY_FINISH_NODES)[index]}` ||
					file.sha256 !== proof.nodes[file.path.slice(root.length + 1)],
			)
		)
			throw Error("COMFY_FINISH_ASSET_MISMATCH");
	}
	return proof;
}
export async function measureFinishingAssets() {
	if (process.platform !== "win32") {
		const remote = await measureRemoteComfyFiles([
			`${root}/models/background_removal/${COMFY_FINISH_MODEL.filename}`,
			...Object.keys(COMFY_FINISH_NODES).map((path) => `${root}/${path}`),
		]);
		const model = remote.files[0];
		if (!model) throw Error("COMFY_FINISH_ASSET_MISMATCH");
		return verifyFinishingProof({
			schema: "comfy-finishing-runtime-files.v1",
			method: "server-file-stream-sha256",
			model: {
				filename: COMFY_FINISH_MODEL.filename,
				sha256: model.sha256,
				bytes: model.bytes,
			},
			nodes: Object.fromEntries(
				remote.files
					.slice(1)
					.map((file) => [file.path.slice(root.length + 1), file.sha256]),
			),
			remote,
		});
	}
	const digest = async (path: string) => {
		const file = await open(path, "r");
		try {
			const before = await file.stat({ bigint: true });
			const hash = createHash("sha256");
			for await (const chunk of file.createReadStream({ autoClose: false }))
				hash.update(chunk);
			const after = await file.stat({ bigint: true });
			if (
				before.size !== after.size ||
				before.mtimeNs !== after.mtimeNs ||
				before.ctimeNs !== after.ctimeNs
			)
				throw Error("COMFY_FINISH_ASSET_CHANGED");
			return { sha256: hash.digest("hex"), bytes: Number(after.size) };
		} finally {
			await file.close();
		}
	};
	const model = await digest(
		`${root}/models/background_removal/${COMFY_FINISH_MODEL.filename}`,
	);
	const nodes: Record<string, string> = {};
	for (const path of Object.keys(COMFY_FINISH_NODES))
		nodes[path] = (await digest(`${root}/${path}`)).sha256;
	return verifyFinishingProof({
		schema: "comfy-finishing-runtime-files.v1",
		method: "server-file-stream-sha256",
		model: { filename: COMFY_FINISH_MODEL.filename, ...model },
		nodes,
	});
}
type Graph = Record<
	string,
	{ class_type: string; inputs: Record<string, unknown> }
>;
// Exact proven finishing graph, with collision-free remapping only. Original
// finishing node1 is replaced by VAEDecode8; final9/mask11/rawmask15 remain.
export function finishComfyGraph(
	graph: Graph,
	prefix: string,
	generationProfile?: "native340-v1",
): Graph {
	return {
		...graph,
		"9": {
			class_type: "SaveImage",
			inputs: { images: ["27", 0], filename_prefix: `${prefix}_finished` },
		},
		"11": {
			class_type: "SaveImage",
			inputs: { images: ["28", 0], filename_prefix: `${prefix}_mask` },
		},
		"15": {
			class_type: "SaveImage",
			inputs: { images: ["29", 0], filename_prefix: `${prefix}_rawmask` },
		},
		"16": {
			class_type: "SaveImage",
			inputs: { images: ["8", 0], filename_prefix: `${prefix}_raw` },
		},
		"20": {
			class_type: "LoadBackgroundRemovalModel",
			inputs: { bg_removal_name: COMFY_FINISH_MODEL.filename },
		},
		"21": {
			class_type: "RemoveBackground",
			inputs: { bg_removal_model: ["20", 0], image: ["8", 0] },
		},
		"22": {
			class_type: "ThresholdMask",
			inputs: { mask: ["21", 0], value: 254 / 255 },
		},
		"23": {
			class_type: "MaskComposite",
			inputs: {
				destination: ["21", 0],
				source: ["22", 0],
				x: 0,
				y: 0,
				operation: "add",
			},
		},
		"24": { class_type: "InvertMask", inputs: { mask: ["23", 0] } },
		"25": {
			class_type: "ThresholdMask",
			inputs: { mask: ["21", 0], value: 1 / 255 },
		},
		"26": {
			class_type: "EmptyImage",
			inputs: {
				width: generationProfile ? 352 : 1024,
				height: generationProfile ? 512 : 1536,
				batch_size: 1,
				color: 0,
			},
		},
		"30": {
			class_type: "ImageCompositeMasked",
			inputs: {
				destination: ["26", 0],
				source: ["8", 0],
				mask: ["25", 0],
				x: 0,
				y: 0,
				resize_source: false,
			},
		},
		"27": {
			class_type: "JoinImageWithAlpha",
			inputs: { image: ["30", 0], alpha: ["24", 0] },
		},
		"28": { class_type: "MaskToImage", inputs: { mask: ["23", 0] } },
		"29": { class_type: "MaskToImage", inputs: { mask: ["21", 0] } },
	};
}
export type FinishingImages = {
	rawBytes: Uint8Array;
	maskBytes: Uint8Array;
	rawMaskBytes: Uint8Array;
};
// Mechanical integrity, not semantic matte/style acceptance. Crown10px is the
// fixed framing exterior; no all-border-zero demand (bust touches bottom).
export function verifyFinishingPixels(
	finishedBytes: Uint8Array,
	images: FinishingImages,
	generationProfile?: "native340-v1",
) {
	const width = generationProfile ? 352 : 1024;
	const height = generationProfile ? 512 : 1536;
	const finished = decodePng(finishedBytes),
		raw = decodePng(images.rawBytes),
		mask = decodePng(images.maskBytes),
		rawMask = decodePng(images.rawMaskBytes);
	if (
		[finished, raw, mask, rawMask].some(
			(i) => i.width !== width || i.height !== height,
		) ||
		finished.channels !== 4 ||
		![3, 4].includes(raw.channels) ||
		![3, 4].includes(mask.channels) ||
		![3, 4].includes(rawMask.channels)
	)
		throw Error("COMFY_FINISH_PIXELS_INVALID");
	let zeros = 0,
		solid = 0,
		centerSolid = 0;
	for (let p = 0; p < width * height; p++) {
		const a = finished.pixels[p * 4 + 3] ?? 0;
		const m = mask.pixels[p * mask.channels] ?? 0;
		const r = rawMask.pixels[p * rawMask.channels] ?? 0;
		if (Math.abs(a - m) > 1 || (r >= 255 ? m !== 255 : Math.abs(m - r) > 1))
			throw Error("COMFY_FINISH_MASK_MISMATCH");
		if (p < width * (generationProfile ? 2 : 10) && a !== 0)
			throw Error("COMFY_FINISH_EXTERIOR_NOT_ZERO");
		if (a === 0) zeros++;
		if (a === 255) {
			solid++;
			const x = p % width,
				y = Math.floor(p / width);
			if (
				x >= width * 0.375 &&
				x < width * 0.625 &&
				y >= height / 3 &&
				y < (height * 11) / 12
			)
				centerSolid++;
		}
		for (let c = 0; c < 3; c++) {
			const v = finished.pixels[p * 4 + c] ?? 0;
			if (a === 0 ? v !== 0 : v !== raw.pixels[p * raw.channels + c])
				throw Error("COMFY_FINISH_SUBJECT_RGB_CHANGED");
		}
	}
	if (zeros === 0 || solid === 0 || centerSolid === 0)
		throw Error("COMFY_FINISH_EMPTY_OR_OPAQUE");
}
