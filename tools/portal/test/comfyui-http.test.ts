import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
	mossWorkflowAssets,
	verifyMossAssetProof,
} from "../src/comfyui-assets.ts";
import { compileComfyPortraitPrompt } from "../src/comfyui-prompt.ts";
import {
	comfyReceiptSchema,
	createComfyProvider,
	verifyComfyEvidence,
} from "../src/comfyui-provider.ts";
import {
	finishingPngFixture,
	finishingProof,
} from "./comfyui-finishing-fixture.ts";

test("loopback HTTP adapter and receipt reject adversarial retained evidence", async () => {
	const pixels = finishingPngFixture();
	const promptId = randomUUID();
	let graph: Record<
		string,
		{ class_type: string; inputs: Record<string, unknown> }
	> = {};
	let submits = 0;
	let misleading = false;
	const clients = new Set<{ send(data: string): unknown }>();
	const requests: string[] = [];
	const server = Bun.serve({
		hostname: "127.0.0.1",
		port: 0,
		websocket: {
			open(ws) {
				clients.add(ws);
			},
			close(ws) {
				clients.delete(ws);
			},
			message() {},
		},
		async fetch(request, server) {
			const url = new URL(request.url);
			requests.push(url.pathname);
			if (url.pathname === "/ws") {
				if (server.upgrade(request)) return;
				return new Response(null, { status: 400 });
			}
			if (url.pathname === "/system_stats")
				return Response.json({ system: { comfyui_version: "0.42.0" } });
			if (url.pathname === "/object_info")
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
						].map((name) => [
							name,
							{ input: { required: {} }, output_node: name === "SaveImage" },
						]),
					),
				);
			if (url.pathname === "/prompt") {
				submits++;
				graph = z
					.object({
						prompt: z.record(
							z.string(),
							z.object({
								class_type: z.string(),
								inputs: z.record(z.string(), z.unknown()),
							}),
						),
					})
					.parse(await request.json()).prompt;
				for (const client of clients)
					client.send(
						JSON.stringify({
							type: "executing",
							data: { prompt_id: promptId, node: null },
						}),
					);
				return Response.json({ prompt_id: promptId });
			}
			if (url.pathname.startsWith("/history/"))
				return Response.json({
					[promptId]: {
						prompt: [1, promptId, graph],
						status: { completed: true, status_str: "success" },
						outputs: misleading
							? {}
							: Object.fromEntries(
									["9", "11", "15", "16"].map((node) => [
										node,
										{
											images: [
												{
													filename: `${graph[node]?.inputs["filename_prefix"]}_00001_.png`,
													subfolder: "",
													type: "output",
												},
											],
										},
									]),
								),
					},
				});
			if (url.pathname === "/view") {
				const name = url.searchParams.get("filename") ?? "";
				return new Response(
					name.includes("_rawmask_")
						? pixels.rawMaskBytes
						: name.includes("_mask_")
							? pixels.maskBytes
							: name.includes("_raw_")
								? pixels.rawBytes
								: pixels.finishedBytes,
				);
			}
			return new Response(null, { status: 404 });
		},
	});
	try {
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
				fetch: (url, init) =>
					fetch(
						new URL(new URL(url).pathname + new URL(url).search, server.url),
						init,
					),
				webSocket: (url) =>
					new WebSocket(url.replace(new URL(url).host, server.url.host)),
			},
		});
		const connection = await provider.connect(
			"moss-image-sft-style-lora.alpha.v1",
		);
		expect(submits).toBe(0);
		const compiled = compileComfyPortraitPrompt(
			{ identity: { gender: { value: "male" } } },
			connection.workflow,
		);
		const input = {
			requestId: randomUUID(),
			workflow: connection.workflow,
			text: compiled.text,
			textSHA: "a".repeat(64),
			sourceSHA: "b".repeat(64),
			seed: 23,
		};
		const result = await provider.generate(connection, input);
		const receipt = comfyReceiptSchema.parse(
			JSON.parse(result.canonicalReceiptBytes.toString()),
		);
		expect(receipt.promptCompiler).toBe("comfy-portrait-prompt.v4");
		expect(() => verifyComfyEvidence({ ...result, receipt })).not.toThrow();
		const rejected: string[] = [];
		for (const [name, patch] of [
			["missing_evidence", { assetProofBytes: undefined }],
			["tampered_bytes", { nativeBytes: Buffer.from("corrupt") }],
			["stale_state", { receipt: { ...receipt, promptId: randomUUID() } }],
			["identity_mismatch", { receipt: { ...receipt, seed: 24 } }],
			["partial_output", { finishingImages: undefined }],
			["substituted_model", { finishingProofBytes: Buffer.from("{}") }],
		] as const) {
			expect(() =>
				verifyComfyEvidence({ ...result, receipt, ...patch }),
			).toThrow();
			rejected.push(name);
		}
		await expect(
			provider.generate(connection, { ...input, text: "" }),
		).rejects.toMatchObject({ code: "COMFY_INVALID_REQUEST" });
		rejected.push("invalid_input");
		misleading = true;
		await expect(
			provider.generate(connection, { ...input, requestId: randomUUID() }),
		).rejects.toMatchObject({ code: "COMFY_OUTPUT_MISMATCH" });
		rejected.push("misleading_success");
		expect(submits).toBe(2);
		console.log(
			JSON.stringify({
				qa: "task-11-http",
				origin: server.url.origin,
				requests,
				submits,
				receipt: {
					promptCompiler: receipt.promptCompiler,
					status: receipt.status,
					reviewStatus: receipt.reviewStatus,
				},
				rejected,
				dirty_worktree:
					"checked independently via protectedHashes; no cleanup or reset",
				gpu: false,
				retainedTemporaryReceipts: 0,
			}),
		);
	} finally {
		await server.stop(true);
	}
}, 30000);
