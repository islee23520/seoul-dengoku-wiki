import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import {
	decodePng,
	encodePng,
} from "../../portrait/acceptance/src/png.ts";
import {
	mossWorkflowAssets,
	verifyMossAssetProof,
} from "../src/comfyui-assets.ts";
import {
	COMFY_FINISH_MODEL,
	COMFY_FINISH_NODES,
	type finishComfyGraph,
	verifyFinishingPixels,
	verifyFinishingProof,
} from "../src/comfyui-finishing.ts";
import {
	comfyReceiptSchema,
	createComfyProvider,
	verifyComfyEvidence,
} from "../src/comfyui-provider.ts";
import { resizePortraitPng } from "../src/png.ts";
import { hash } from "../src/sources.ts";

export {
	finishingPngFixture,
	finishingProof,
} from "./comfyui-finishing-fixture.ts";

import {
	finishingPngFixture,
	finishingProof,
} from "./comfyui-finishing-fixture.ts";

test("continuous finishing preserves foreground and bottom contact, zeros exterior/hidden RGB, and downsizes premultiplied", () => {
	const f = finishingPngFixture();
	expect(() => verifyFinishingPixels(f.finishedBytes, f)).not.toThrow();
	const small = decodePng(resizePortraitPng(f.finishedBytes));
	expect([small.width, small.height]).toEqual([340, 510]);
	for (let p = 0; p < small.width * small.height; p++)
		if (small.pixels[p * 4 + 3] === 0)
			expect(Array.from(small.pixels.subarray(p * 4, p * 4 + 3))).toEqual([
				0, 0, 0,
			]);
	for (const mutation of [
		"opaque",
		"empty",
		"polarity",
		"rgb",
		"mask",
	] as const) {
		const rgba = decodePng(f.finishedBytes);
		const m = decodePng(f.maskBytes);
		if (mutation === "opaque")
			for (let p = 3; p < rgba.pixels.length; p += 4) rgba.pixels[p] = 255;
		if (mutation === "empty") rgba.pixels.fill(0);
		if (mutation === "polarity")
			for (let p = 3; p < rgba.pixels.length; p += 4)
				rgba.pixels[p] = 255 - (rgba.pixels[p] ?? 0);
		if (mutation === "rgb") rgba.pixels[(800 * 1024 + 500) * 4] = 250;
		if (mutation === "mask") m.pixels[(800 * 1024 + 500) * 4] = 0;
		expect(() =>
			verifyFinishingPixels(encodePng(rgba), { ...f, maskBytes: encodePng(m) }),
		).toThrow();
	}
});
test("finishing runtime proof rejects substituted model or node implementation", () => {
	for (const proof of [
		{
			...finishingProof(),
			model: { ...finishingProof().model, sha256: "0".repeat(64) },
		},
		{
			...finishingProof(),
			nodes: { ...COMFY_FINISH_NODES, "nodes.py": "0".repeat(64) },
		},
	])
		expect(() => verifyFinishingProof(proof)).toThrow();
});
test("real PNG Comfy wire returns only verified RGBA terminal with all separate retained outputs", async () => {
	const f = finishingPngFixture(),
		socket = new EventTarget(),
		promptId = randomUUID();
	let graph: ReturnType<typeof finishComfyGraph> = {};
	let submits = 0;
	const provider = createComfyProvider({
		authorize: (start) => start(),
		measureFinishing: async () => finishingProof(),
		measureAssets: async (workflow) =>
			verifyMossAssetProof(
				{
					schema: "moss-runtime-file-sha256.v1",
					method: "server-file-stream-sha256",
					assets: mossWorkflowAssets(workflow ?? "").map(
						({ path: _path, ...asset }) => asset,
					),
				},
				workflow,
			),
		transport: {
			webSocket: () => {
				queueMicrotask(() => socket.dispatchEvent(new Event("open")));
				return {
					addEventListener: socket.addEventListener.bind(socket),
					removeEventListener: socket.removeEventListener.bind(socket),
					close() {},
				};
			},
			fetch: async (url, init) => {
				const path = new URL(url).pathname;
				if (path === "/system_stats")
					return Response.json({ system: { comfyui_version: "0.42.0" } });
				if (path === "/object_info")
					return Response.json(
						Object.fromEntries(
							[
								"UNETLoader",
								"CLIPLoader",
								"VAELoader",
								"CLIPTextEncode",
								"EmptyFlux2LatentImage",
								"KSampler",
								"VAEDecode",
								"SaveImage",
								"LoraLoaderModelOnly",
								"LoadBackgroundRemovalModel",
								"RemoveBackground",
								"ThresholdMask",
								"MaskComposite",
								"InvertMask",
								"EmptyImage",
								"ImageCompositeMasked",
								"JoinImageWithAlpha",
								"MaskToImage",
							].map((n) => [
								n,
								{ input: { required: {} }, output_node: n === "SaveImage" },
							]),
						),
					);
				if (path === "/prompt") {
					submits++;
					graph = JSON.parse(String(init.body)).prompt;
					socket.dispatchEvent(
						new MessageEvent("message", {
							data: JSON.stringify({
								type: "executing",
								data: { prompt_id: promptId, node: null },
							}),
						}),
					);
					return Response.json({ prompt_id: promptId });
				}
				if (path.startsWith("/history/"))
					return Response.json({
						[promptId]: {
							prompt: [1, promptId, graph],
							status: { completed: true, status_str: "success" },
							outputs: Object.fromEntries(
								["9", "11", "15", "16"].map((n) => [
									n,
									{
										images: [
											{
												filename: `${graph[n]?.inputs["filename_prefix"]}_00001_.png`,
												subfolder: "",
												type: "output",
											},
										],
									},
								]),
							),
						},
					});
				if (path === "/view") {
					const name = new URL(url).searchParams.get("filename") ?? "";
					return new Response(
						name.includes("_rawmask_")
							? f.rawMaskBytes
							: name.includes("_mask_")
								? f.maskBytes
								: name.includes("_raw_")
									? f.rawBytes
									: f.finishedBytes,
					);
				}
				throw Error(path);
			},
		},
	});
	const connection = await provider.connect(
		"moss-image-sft-style-male.alpha.v1",
	);
	expect(submits).toBe(0);
	const result = await provider.generate(connection, {
		requestId: randomUUID(),
		workflow: connection.workflow,
		text: "seoul dengoku portrait style. A single person",
		textSHA: "a".repeat(64),
		sourceSHA: "b".repeat(64),
		seed: 101,
	});
	const receipt = comfyReceiptSchema.parse(
		JSON.parse(result.canonicalReceiptBytes.toString()),
	);
	expect(receipt.finishing?.matteQuality).toBe("OWNER_REVIEW_REQUIRED");
	expect(receipt.finishing?.rawSHA).toBe(hash(f.rawBytes));
	expect(() => verifyComfyEvidence({ ...result, receipt })).not.toThrow();
	for (const patch of [
		{ finishingProofBytes: Buffer.from("{}") },
		{
			finishingImages: {
				...result.finishingImages,
				...f,
				maskBytes: f.rawBytes,
			},
		},
	])
		expect(() => verifyComfyEvidence({ ...result, ...patch, receipt })).toThrow(
			"COMFY_EVIDENCE_MISMATCH",
		);
	const missing = JSON.parse(result.historyBytes.toString());
	delete missing[promptId].outputs["11"];
	const missingHistory = Buffer.from(JSON.stringify(missing));
	expect(() =>
		verifyComfyEvidence({
			...result,
			historyBytes: missingHistory,
			receipt: { ...receipt, historySHA: hash(missingHistory) },
		}),
	).toThrow("COMFY_EVIDENCE_MISMATCH");
	expect(submits).toBe(1);
	const altered = JSON.parse(result.requestBytes.toString());
	altered.prompt["27"].inputs.alpha = ["23", 0];
	const requestBytes = Buffer.from(JSON.stringify(altered));
	expect(() =>
		verifyComfyEvidence({
			...result,
			requestBytes,
			receipt: { ...receipt, requestSHA: hash(requestBytes) },
		}),
	).toThrow("COMFY_EVIDENCE_MISMATCH");
});
test("missing finishing model rejects readiness before any submission", async () => {
	let calls = 0;
	const provider = createComfyProvider({
		authorize: (start) => start(),
		measureFinishing: async () => {
			throw Error("ENOENT");
		},
		transport: {
			fetch: async () => {
				calls++;
				throw Error("unexpected");
			},
			webSocket: () => {
				throw Error("unexpected");
			},
		},
	});
	await expect(provider.connect()).rejects.toMatchObject({
		code: "COMFY_CONNECTION_NOT_READY",
	});
	expect(calls).toBe(0);
});
