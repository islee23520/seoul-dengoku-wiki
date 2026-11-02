import { createHash } from "node:crypto";
import { open } from "node:fs/promises";
import { z } from "zod";
import {
	measureRemoteComfyFiles,
	remoteComfyProofSchema,
} from "./comfyui-file-proof.ts";
import { opaqueWorkflow } from "./provider-models.ts";

export const MOSS_STYLE_WORKFLOW = "moss-image-sft-style-lora.v1" as const;
export const MOSS_STYLE_TRIGGER = "seoul dengoku portrait style";
export const MOSS_MALE_WORKFLOW = "moss-image-sft-style-male.v1" as const;
export const MOSS_MALE_DATASET = Object.freeze({
	manifestSHA:
		"2b79cdfebead4a197ad6b5f9fd0ebaabb74bccc6f6ca9993195879806d4226bd",
	count: 59,
	uniqueIdentities: 59,
	evaluationIntersection: 0,
});
export const MOSS_MALE_LORA = Object.freeze({
	filename: "seoul-dengoku-moss-sft-style-male.safetensors",
	sha256: "1570c8b8e987f7304622b83e3ea48963bf24065f630e6f44b987f5b9a6588aa6",
	bytes: 148697424,
	strength: 1,
	trigger: MOSS_STYLE_TRIGGER,
});
export const MOSS_CAPTIONFIX_WORKFLOW =
	"moss-image-sft-style-captionfix.v1" as const;
export const MOSS_CAPTIONFIX_LORA = Object.freeze({
	filename: "seoul-dengoku-moss-sft-style-captionfix.safetensors",
	sha256: "d2c36358af8253903a417aeb30f8eafeecd1b6abbc83641e995d36cd68c85cdf",
	bytes: 148697440,
	strength: 1,
	trigger: MOSS_STYLE_TRIGGER,
});
export const MOSS_STYLE_LORA = Object.freeze({
	filename: "seoul-dengoku-moss-sft-style.safetensors",
	sha256: "10ba4a10cc6e45ac57eb6dd7e4b400de6148820017d1df37c24d17199b7b9c09",
	bytes: 148697416,
	strength: 1,
	trigger: MOSS_STYLE_TRIGGER,
});
// Resolved from the installed ComfyUI /experiment/models metadata on 2026-10-19.
// Server-owned paths only. Neither browser requests nor receipts choose a path.
const root = "D:/AI/environments/PNGAL/ComfyUI-pngal-0.28.0/models";
export const MOSS_ASSETS = Object.freeze([
	{
		role: "diffusion",
		filename: "moss_image_sft_int8_convrot.safetensors",
		path: `${root}/diffusion_models/moss_image_sft_int8_convrot.safetensors`,
		sha256: "b4d1475bc7eeffd7b809e82ea13a1fba1fb85c4e18365af3813722faa5c0fe4f",
		bytes: 5413698958,
	},
	{
		role: "encoder",
		filename: "qwen3.5_9b_w4a8_gptq.safetensors",
		path: `${root}/text_encoders/qwen3.5_9b_w4a8_gptq.safetensors`,
		sha256: "4cc6a1543ad2061806da46f35f90cadb4801dcba246c44782cf42ec0feb6407c",
		bytes: 7343591088,
	},
	{
		role: "vae",
		filename: "flux2-vae_small.safetensors",
		path: `${root}/vae/flux2-vae_small.safetensors`,
		sha256: "d8d52ba036475f5fb07c8b435e176d3d97ebfa82f0d1a1c317f9cc1e25bd013b",
		bytes: 249521340,
	},
	{
		role: "lora",
		filename: MOSS_STYLE_LORA.filename,
		path: `${root}/loras/${MOSS_STYLE_LORA.filename}`,
		sha256: MOSS_STYLE_LORA.sha256,
		bytes: MOSS_STYLE_LORA.bytes,
	},
] as const);
export const mossAssetProofSchema = z.strictObject({
	schema: z.literal("moss-runtime-file-sha256.v1"),
	method: z.literal("server-file-stream-sha256"),
	remote: remoteComfyProofSchema.optional(),
	assets: z
		.array(
			z.strictObject({
				role: z.enum(["diffusion", "encoder", "vae", "lora"]),
				filename: z.string(),
				sha256: z.string().regex(/^[a-f0-9]{64}$/),
				bytes: z.number().int().positive(),
			}),
		)
		.length(4),
});
export function mossWorkflowLora(workflow: string) {
	workflow = opaqueWorkflow(workflow);
	if (workflow === MOSS_MALE_WORKFLOW) return MOSS_MALE_LORA;
	return workflow === MOSS_CAPTIONFIX_WORKFLOW
		? MOSS_CAPTIONFIX_LORA
		: MOSS_STYLE_LORA;
}
export function mossWorkflowAssets(workflow: string) {
	workflow = opaqueWorkflow(workflow);
	if (workflow !== MOSS_CAPTIONFIX_WORKFLOW && workflow !== MOSS_MALE_WORKFLOW)
		return MOSS_ASSETS;
	const lora = mossWorkflowLora(workflow);
	return MOSS_ASSETS.map((asset) =>
		asset.role === "lora"
			? {
					role: "lora" as const,
					filename: lora.filename,
					path: `${root}/loras/${lora.filename}`,
					sha256: lora.sha256,
					bytes: lora.bytes,
				}
			: asset,
	);
}
export function verifyMossAssetProof(
	value: unknown,
	workflow: string = MOSS_STYLE_WORKFLOW,
) {
	const proof = mossAssetProofSchema.parse(value);
	for (const [index, asset] of mossWorkflowAssets(workflow).entries()) {
		const actual = proof.assets[index];
		if (
			!actual ||
			actual.role !== asset.role ||
			actual.filename !== asset.filename ||
			actual.sha256 !== asset.sha256 ||
			actual.bytes !== asset.bytes
		)
			throw new Error("COMFY_ASSET_MISMATCH");
		if (proof.remote) {
			const file = proof.remote.files[index];
			if (
				!file ||
				proof.remote.files.length !== proof.assets.length ||
				file.path !== asset.path ||
				file.sha256 !== actual.sha256 ||
				file.bytes !== actual.bytes
			)
				throw new Error("COMFY_ASSET_MISMATCH");
		}
	}
	return proof;
}
// Hash every file from an open handle before submission, not a metadata hash or
// filename claim. Failed reads and asset replacement reject before /prompt.
export async function measureMossAssets(
	workflow: string = MOSS_STYLE_WORKFLOW,
) {
	if (process.platform !== "win32") {
		const expected = mossWorkflowAssets(workflow);
		const remote = await measureRemoteComfyFiles(
			expected.map((asset) => asset.path),
		);
		return verifyMossAssetProof(
			{
				schema: "moss-runtime-file-sha256.v1",
				method: "server-file-stream-sha256",
				assets: remote.files.map((file, index) => ({
					role: expected[index]?.role,
					filename: expected[index]?.filename,
					sha256: file.sha256,
					bytes: file.bytes,
				})),
				remote,
			},
			workflow,
		);
	}
	const assets = [];
	for (const asset of mossWorkflowAssets(workflow)) {
		const file = await open(asset.path, "r");
		try {
			const before = await file.stat({ bigint: true });
			const digest = createHash("sha256");
			for await (const chunk of file.createReadStream({ autoClose: false }))
				digest.update(chunk);
			const after = await file.stat({ bigint: true });
			if (
				before.size !== after.size ||
				before.mtimeNs !== after.mtimeNs ||
				before.ctimeNs !== after.ctimeNs
			)
				throw new Error("COMFY_ASSET_CHANGED");
			assets.push({
				role: asset.role,
				filename: asset.filename,
				sha256: digest.digest("hex"),
				bytes: Number(after.size),
			});
		} finally {
			await file.close();
		}
	}
	return verifyMossAssetProof(
		{
			schema: "moss-runtime-file-sha256.v1",
			method: "server-file-stream-sha256",
			assets,
		},
		workflow,
	);
}
