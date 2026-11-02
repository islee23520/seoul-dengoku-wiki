import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { encodePng } from "../../portrait/acceptance/src/png.ts";
import {
	mossWorkflowAssets,
	verifyMossAssetProof,
} from "../src/comfyui-assets.ts";
import {
	COMFY_ENDPOINT,
	type ComfyTransport,
	createComfyProvider,
} from "../src/comfyui-provider.ts";
import { COMFY_SOURCE_WORKFLOW } from "../src/provider-models.ts";
import { hash } from "../src/sources.ts";
import {
	finishingPngFixture,
	finishingProof,
} from "./comfyui-finishing-fixture.ts";

export function sourceFixture() {
	const original = encodePng({
		width: 8,
		height: 10,
		pixels: new Uint8Array(8 * 10 * 4).fill(127),
	});
	const tokenBytes = Buffer.from(
		JSON.stringify({
			personId: "person-0998",
			characterId: "K998",
			image: { sha256: hash(original) },
			artProposal: { face: { faceShape: "round" } },
		}),
	);
	return {
		request: {
			schemaVersion: 2,
			requestId: randomUUID(),
			personId: "person-0998",
			inputMode: "reference-img2img",
			sourceSelection: {
				kind: "selected",
				personId: "person-0998",
				sourceSHA256: hash(original),
			},
			explicitEdits: [],
			provider: "comfyui",
			providerModel: `comfyui:${COMFY_SOURCE_WORKFLOW}`,
			size: "340x510",
			faceMode: { kind: "unique", variantId: null },
		},
		serverEvidence: {
			status: "available",
			recipient: { personId: "person-0998", characterId: "K998" },
			tokenBytes,
			tokenSHA256: hash(tokenBytes),
			recipientImage: {
				personId: "person-0998",
				characterId: "K998",
				sourceSHA256: hash(original),
				bytes: original,
			},
		},
		denoise: 0.45,
	};
}

type Graph = Record<
	string,
	{ class_type: string; inputs: Record<string, unknown> }
>;
export function sourceTransport(
	mode:
		| "ok"
		| "upload-name"
		| "upload-hash"
		| "stale-history"
		| "empty-latent"
		| "encode-error"
		| "schema" = "ok",
) {
	const socket = new EventTarget();
	const paths: string[] = [];
	const prompts: { client_id: string; prompt: Graph; id: string }[] = [];
	const uploads: {
		name: string;
		bytes: Uint8Array;
		overwrite: ReturnType<FormData["get"]>;
	}[] = [];
	let images = finishingPngFixture();
	let closed = 0;
	const info: Record<string, unknown> = {};
	for (const name of [
		"UNETLoader",
		"CLIPLoader",
		"CLIPTextEncode",
		"SaveImage",
		"LoadBackgroundRemovalModel",
		"RemoveBackground",
		"ThresholdMask",
		"MaskComposite",
		"InvertMask",
		"EmptyImage",
		"ImageCompositeMasked",
		"JoinImageWithAlpha",
		"MaskToImage",
		"EmptyFlux2LatentImage",
		"LoraLoaderModelOnly",
	])
		info[name] = { input: { required: {} }, output_node: name === "SaveImage" };
	for (const [name, output, required] of [
		["LoadImage", "IMAGE", { image: [["existing.png"]] }],
		["VAEEncode", "LATENT", { pixels: ["IMAGE"], vae: ["VAE"] }],
		["VAELoader", "VAE", { vae_name: [["flux2-vae_small.safetensors"]] }],
		[
			"KSampler",
			"LATENT",
			{
				latent_image: ["LATENT"],
				model: ["MODEL"],
				positive: ["CONDITIONING"],
				negative: ["CONDITIONING"],
			},
		],
		["VAEDecode", "IMAGE", { samples: ["LATENT"], vae: ["VAE"] }],
	] as const)
		info[name] = {
			input: { required },
			output: [mode === "schema" && name === "VAEEncode" ? "IMAGE" : output],
		};
	const transport: ComfyTransport = {
		webSocket() {
			queueMicrotask(() => socket.dispatchEvent(new Event("open")));
			return {
				addEventListener: socket.addEventListener.bind(socket),
				removeEventListener: socket.removeEventListener.bind(socket),
				close: () => {
					closed++;
				},
			};
		},
		async fetch(url, init) {
			if (!url.startsWith(COMFY_ENDPOINT)) throw Error("unexpected authority");
			const path = url.slice(COMFY_ENDPOINT.length);
			paths.push(path);
			if (path === "/system_stats")
				return Response.json({ system: { comfyui_version: "0.42.0" } });
			if (path === "/object_info") return Response.json(info);
			if (path === "/upload/image") {
				if (!(init.body instanceof FormData)) throw Error("multipart required");
				const image = init.body.get("image");
				if (!(image instanceof File)) throw Error("file required");
				uploads.push({
					name: image.name,
					bytes: new Uint8Array(await image.arrayBuffer()),
					overwrite: init.body.get("overwrite"),
				});
				return Response.json({
					name: mode === "upload-name" ? "collision.png" : image.name,
					subfolder: "",
					type: "input",
				});
			}
			if (
				path.startsWith("/view?") &&
				new URL(url).searchParams.get("type") === "input"
			) {
				const upload = uploads.at(-1);
				assert(upload);
				return new Response(
					mode === "upload-hash" ? new Uint8Array([0]) : upload.bytes,
				);
			}
			if (path === "/prompt") {
				const submission = JSON.parse(String(init.body));
				const canvas = submission.prompt["26"]?.inputs;
				if (canvas) images = finishingPngFixture(canvas.width, canvas.height);
				const id = randomUUID();
				prompts.push({ ...submission, id });
				socket.dispatchEvent(
					new MessageEvent("message", {
						data: JSON.stringify({
							type: mode === "encode-error" ? "execution_error" : "executing",
							data: { prompt_id: id, node: null },
						}),
					}),
				);
				return Response.json({ prompt_id: id, node_errors: {} });
			}
			if (path.startsWith("/history/")) {
				const submission = prompts.at(-1);
				assert(submission);
				const graph = structuredClone(submission.prompt);
				if (mode === "empty-latent")
					graph["6"] = {
						class_type: "EmptyFlux2LatentImage",
						inputs: { width: 1024, height: 1536, batch_size: 1 },
					};
				return Response.json({
					[submission.id]: {
						prompt: [
							1,
							mode === "stale-history" ? randomUUID() : submission.id,
							graph,
						],
						status: { completed: true, status_str: "success" },
						outputs: Object.fromEntries(
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
			}
			if (path.startsWith("/view?")) {
				const filename = new URL(url).searchParams.get("filename");
				assert(filename);
				return new Response(
					filename.includes("_rawmask_")
						? images.rawMaskBytes
						: filename.includes("_mask_")
							? images.maskBytes
							: filename.includes("_raw_")
								? images.rawBytes
								: images.finishedBytes,
				);
			}
			throw Error(path);
		},
	};
	const provider = createComfyProvider({
		authorize: (start) => start(),
		transport,
		measureAssets: async (workflow = COMFY_SOURCE_WORKFLOW) =>
			verifyMossAssetProof(
				{
					schema: "moss-runtime-file-sha256.v1",
					method: "server-file-stream-sha256",
					assets: mossWorkflowAssets(workflow).map(
						({ path: _path, ...asset }) => asset,
					),
				},
				workflow,
			),
		measureFinishing: async () => finishingProof(),
	});
	return { provider, transport, paths, prompts, uploads, closed: () => closed };
}
