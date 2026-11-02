import { expect, test } from "bun:test";
import { deflateSync } from "node:zlib";
import { encodePng } from "../../portrait/acceptance/src/png.ts";
import {
	MOSS_CAPTIONFIX_WORKFLOW,
	MOSS_MALE_DATASET,
	MOSS_MALE_WORKFLOW,
	MOSS_STYLE_TRIGGER,
	MOSS_STYLE_WORKFLOW,
	mossWorkflowAssets,
	mossWorkflowLora,
	verifyMossAssetProof,
} from "../src/comfyui-assets.ts";
import { COMFY_PROMPT_LIMITS } from "../src/comfyui-prompt.ts";
import {
	COMFY_ENDPOINT,
	COMFY_MOSS_NEGATIVE,
	COMFY_MOSS_WORKFLOW,
	COMFY_WORKFLOW,
	type ComfyPortraitRequest,
	type ComfyTransport,
	comfyReceiptSchema,
	comfyWorkflowModels,
	createComfyProvider,
	legacyComfyReceiptSchema,
	verifyComfyEvidence,
} from "../src/comfyui-provider.ts";
import { measurePng } from "../src/png.ts";
import {
	type ComfyWorkflow,
	mossStyleStrength,
} from "../src/provider-models.ts";
import { hash } from "../src/sources.ts";

const assetProof = (workflow: string = MOSS_STYLE_WORKFLOW) =>
	verifyMossAssetProof(
		{
			schema: "moss-runtime-file-sha256.v1",
			method: "server-file-stream-sha256",
			assets: mossWorkflowAssets(workflow).map(
				({ path: _path, ...asset }) => asset,
			),
		},
		workflow,
	);

const id = "0be21884-bfd7-49ec-a34c-49fe7e6eb53a";
const input: ComfyPortraitRequest = {
	requestId: "4b121053-9a97-40f1-96a5-25b57950b802",
	workflow: COMFY_WORKFLOW,
	text: "  Compiled prompt\n한글 stays exact.  ",
	textSHA: "d".repeat(64),
	seed: 421,
	sourceSHA: "c".repeat(64),
};
const mossInput: ComfyPortraitRequest = {
	...input,
	workflow: COMFY_MOSS_WORKFLOW,
};
const installed = [
	"z_image_turbo_bf16.safetensors",
	"moss_image_sft_int8_convrot.safetensors",
];
const png = encodePng({
	width: 1024,
	height: 1536,
	pixels: new Uint8Array(1024 * 1536 * 4).fill(255),
});

function rgbPng() {
	const chunk = (type: string, body: Buffer) => {
		const data = Buffer.concat([Buffer.from(type), body]);
		let crc = 0xffffffff;
		for (const byte of data) {
			crc ^= byte;
			for (let bit = 0; bit < 8; bit++)
				crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
		}
		const size = Buffer.alloc(4),
			checksum = Buffer.alloc(4);
		size.writeUInt32BE(body.length);
		checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
		return Buffer.concat([size, data, checksum]);
	};
	const header = Buffer.alloc(13);
	header.writeUInt32BE(1024, 0);
	header.writeUInt32BE(1536, 4);
	header[8] = 8;
	header[9] = 2;
	const raw = Buffer.alloc((1024 * 3 + 1) * 1536, 127);
	for (let y = 0; y < 1536; y++) raw[y * (1024 * 3 + 1)] = 0;
	return Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		chunk("IHDR", header),
		chunk("IDAT", deflateSync(raw)),
		chunk("IEND", Buffer.alloc(0)),
	]);
}
type Mode =
	| "ok"
	| "offline"
	| "missing"
	| "failure"
	| "interrupted"
	| "wrong-node"
	| "wrong-prompt"
	| "wrong-graph"
	| "wrong-file"
	| "bad-png"
	| "wrong-size"
	| "lost"
	| "close"
	| "abort";
function fixture(
	mode: Mode = "ok",
	native: Uint8Array = png,
	unets: readonly string[] = installed,
) {
	const socket = new EventTarget(),
		controller = new AbortController();
	let closed = false,
		graph: Record<
			string,
			{ class_type: string; inputs: Record<string, unknown> }
		> = {};
	const paths: string[] = [];
	const info: Record<string, unknown> = {};
	for (const name of [
		"UNETLoader",
		"CLIPLoader",
		"VAELoader",
		"CLIPTextEncode",
		"ConditioningZeroOut",
		"EmptySD3LatentImage",
		"KSampler",
		"VAEDecode",
		"SaveImage",
		"ModelSamplingAuraFlow",
		"EmptyFlux2LatentImage",
		"LoraLoaderModelOnly",
	])
		info[name] = { input: { required: {} }, output_node: name === "SaveImage" };
	Reflect.set(info, "UNETLoader", {
		input: {
			required: {
				unet_name: [mode === "missing" ? ["missing"] : [...unets]],
			},
		},
	});
	Reflect.set(info, "CLIPLoader", {
		input: {
			required: {
				clip_name: [
					["qwen_3_4b.safetensors", "qwen3.5_9b_w4a8_gptq.safetensors"],
				],
				type: [["lumina2", "moss_image"]],
			},
		},
	});
	Reflect.set(info, "VAELoader", {
		input: {
			required: {
				vae_name: [["ae.safetensors", "flux2-vae_small.safetensors"]],
			},
		},
	});
	const event = (type: string, prompt = id) =>
		socket.dispatchEvent(
			new MessageEvent("message", {
				data: JSON.stringify({ type, data: { prompt_id: prompt, node: null } }),
			}),
		);
	const transport: ComfyTransport = {
		webSocket(url) {
			expect(
				url.startsWith(
					`${COMFY_ENDPOINT.replace("http:", "ws:")}/ws?clientId=`,
				),
			).toBe(true);
			queueMicrotask(() => socket.dispatchEvent(new Event("open")));
			return {
				addEventListener: socket.addEventListener.bind(socket),
				removeEventListener: socket.removeEventListener.bind(socket),
				close() {
					closed = true;
				},
			};
		},
		async fetch(url, init) {
			const path = url.slice(COMFY_ENDPOINT.length);
			paths.push(path);
			expect(init.redirect).toBe("error");
			if (mode === "offline") throw Error("offline");
			if (path === "/system_stats")
				return Response.json({ system: { comfyui_version: "0.41.0" } });
			if (path === "/object_info") return Response.json(info);
			if (path === "/prompt") {
				graph = JSON.parse(String(init.body)).prompt;
				expect(Reflect.get(graph["4"]?.inputs ?? {}, "text")).toBe(
					graph["10"]?.class_type === "LoraLoaderModelOnly"
						? `${MOSS_STYLE_TRIGGER}. ${input.text}`
						: input.text,
				);
				expect(Reflect.get(graph["7"]?.inputs ?? {}, "positive")).toEqual([
					"4",
					0,
				]);
				expect(graph["6"]?.inputs).toEqual({
					width: 1024,
					height: 1536,
					batch_size: 1,
				});
				expect(Reflect.get(graph["7"]?.inputs ?? {}, "seed")).toBe(421);
				event("execution_error", "unrelated");
				if (mode === "lost") throw Error("lost response");
				if (mode === "close") socket.dispatchEvent(new Event("close"));
				else if (mode === "abort") controller.abort();
				else
					event(
						mode === "failure"
							? "execution_error"
							: mode === "interrupted"
								? "execution_interrupted"
								: "executing",
					);
				return Response.json({ prompt_id: id, node_errors: {} });
			}
			if (path === `/history/${id}`) {
				const prefix = Reflect.get(graph["9"]?.inputs ?? {}, "filename_prefix");
				return Response.json({
					[id]: {
						prompt: [
							1,
							mode === "wrong-prompt" ? "other" : id,
							mode === "wrong-graph" ? {} : graph,
							{},
							["9"],
						],
						status: { completed: true, status_str: "success" },
						outputs: {
							[mode === "wrong-node" ? "other" : "9"]: {
								images: [
									{
										filename:
											mode === "wrong-file"
												? "other.png"
												: `${prefix}_00001_.png`,
										subfolder: "",
										type: "output",
									},
								],
							},
						},
					},
				});
			}
			if (path.startsWith("/view?"))
				return new Response(
					mode === "bad-png"
						? Buffer.from("not-png")
						: mode === "wrong-size"
							? encodePng({ width: 1, height: 1, pixels: new Uint8Array(4) })
							: native,
				);
			throw Error(path);
		},
	};
	let auth = 0;
	const provider = createComfyProvider({
		transport,
		measureAssets: async (workflow) => assetProof(workflow),
		authorize(start) {
			auth++;
			return start();
		},
	});
	return {
		provider,
		paths,
		signal: controller.signal,
		closed: () => closed,
		auth: () => auth,
	};
}

test.each([
	MOSS_STYLE_WORKFLOW,
	MOSS_CAPTIONFIX_WORKFLOW,
	"moss-image-sft-style-diagnostic-zero.v1",
	MOSS_MALE_WORKFLOW,
	"moss-image-sft-style-diagnostic-reduced.v1",
] satisfies ComfyWorkflow[])(
	"MOSS style %s binds graph and retained measured assets, rejecting substitutions",
	async (workflow) => {
		const f = fixture();
		const connection = await f.provider.connect(workflow);
		expect(f.paths).toEqual(["/system_stats", "/object_info"]);
		const result = await f.provider.generate(connection, {
			...input,
			workflow,
			text: `${MOSS_STYLE_TRIGGER}. ${input.text}`,
		});
		const receipt = comfyReceiptSchema.parse(
			JSON.parse(result.canonicalReceiptBytes.toString()),
		);
		const evidence = { ...result, receipt };
		const lora = receipt.lora;
		if (!lora) throw Error("missing style provenance");
		const strength = mossStyleStrength(workflow);
		if (strength === undefined) throw Error("missing style recipe");
		expect(lora.strength).toBe(strength);
		expect(lora.dataset).toEqual(
			workflow === MOSS_MALE_WORKFLOW ? MOSS_MALE_DATASET : undefined,
		);
		if (workflow === MOSS_MALE_WORKFLOW) {
			expect(() =>
				verifyComfyEvidence({
					...evidence,
					receipt: { ...receipt, lora: { ...lora, dataset: undefined } },
				}),
			).toThrow("COMFY_EVIDENCE_MISMATCH");
		}
		expect(lora.intent).toBe(
			strength === 1 ? undefined : "gaze-strength-diagnostic",
		);
		expect(() =>
			verifyComfyEvidence({
				...evidence,
				receipt: {
					...receipt,
					lora: { ...lora, strength: strength === 1 ? 0 : 1 },
				},
			}),
		).toThrow("COMFY_EVIDENCE_MISMATCH");
		expect(() => verifyComfyEvidence(evidence)).not.toThrow();
		const substituted = assetProof(
			workflow === MOSS_CAPTIONFIX_WORKFLOW
				? MOSS_STYLE_WORKFLOW
				: MOSS_CAPTIONFIX_WORKFLOW,
		);
		const substitutedBytes = Buffer.from(JSON.stringify(substituted));
		expect(() =>
			verifyComfyEvidence({
				...evidence,
				assetProofBytes: substitutedBytes,
				receipt: { ...receipt, assetProofSHA: hash(substitutedBytes) },
			}),
		).toThrow("COMFY_EVIDENCE_MISMATCH");
		const graph = JSON.parse(result.requestBytes.toString());
		expect(graph.prompt["7"].inputs.model).toEqual(["10", 0]);
		expect(graph.prompt["10"]).toEqual({
			class_type: "LoraLoaderModelOnly",
			inputs: {
				model: ["1", 0],
				lora_name: mossWorkflowLora(workflow).filename,
				strength_model: mossStyleStrength(workflow),
			},
		});
		for (const mutate of [
			(g: typeof graph) => {
				g.prompt["10"].inputs.strength_model = 0.5;
			},
			(g: typeof graph) => {
				g.prompt["10"].inputs.lora_name = "substituted.safetensors";
			},
			(g: typeof graph) => {
				g.prompt["7"].inputs.model = ["1", 0];
			},
			(g: typeof graph) => {
				g.prompt["4"].inputs.text = input.text;
			},
		]) {
			const altered = structuredClone(graph);
			mutate(altered);
			const requestBytes = Buffer.from(JSON.stringify(altered));
			expect(() =>
				verifyComfyEvidence({
					...evidence,
					requestBytes,
					receipt: {
						...receipt,
						requestSHA: hash(requestBytes),
						promptSHA: hash(Buffer.from(altered.prompt["4"].inputs.text)),
					},
				}),
			).toThrow("COMFY_EVIDENCE_MISMATCH");
		}
		const wrongProof = assetProof(workflow);
		const wrongAsset = wrongProof.assets[3];
		if (!wrongAsset) throw new Error("fixture asset missing");
		wrongAsset.sha256 = "f".repeat(64);
		const assetProofBytes = Buffer.from(JSON.stringify(wrongProof));
		expect(() =>
			verifyComfyEvidence({
				...evidence,
				assetProofBytes,
				receipt: { ...receipt, assetProofSHA: hash(assetProofBytes) },
			}),
		).toThrow("COMFY_EVIDENCE_MISMATCH");
		expect(() =>
			verifyComfyEvidence({ ...evidence, assetProofBytes: undefined }),
		).toThrow("COMFY_EVIDENCE_MISMATCH");
		await expect(
			f.provider.generate(connection, {
				...input,
				workflow,
			}),
		).rejects.toMatchObject({ code: "COMFY_INVALID_REQUEST" });
		expect(f.paths.filter((p) => p === "/prompt")).toHaveLength(1);
	},
);
test("missing and wrong-hash runtime assets reject before any Comfy submission", async () => {
	for (const measureAssets of [
		async () => {
			throw new Error("ENOENT");
		},
		async () => {
			const proof = assetProof();
			const wrongAsset = proof.assets[3];
			if (!wrongAsset) throw new Error("fixture asset missing");
			wrongAsset.sha256 = "0".repeat(64);
			return proof;
		},
	]) {
		let requests = 0;
		const provider = createComfyProvider({
			authorize: (start) => start(),
			measureAssets,
			transport: {
				fetch: async () => {
					requests++;
					throw new Error("unexpected outbound");
				},
				webSocket: () => {
					throw new Error("unexpected socket");
				},
			},
		});
		await expect(provider.connect(MOSS_STYLE_WORKFLOW)).rejects.toMatchObject({
			code: "COMFY_CONNECTION_NOT_READY",
		});
		expect(requests).toBe(0);
	}
});
test("readiness checks installed workflow/model without GPU submission", async () => {
	const f = fixture();
	expect(await f.provider.connect(MOSS_STYLE_WORKFLOW)).toMatchObject({
		provider: "comfyui",
		workflow: MOSS_STYLE_WORKFLOW,
		state: "READY",
	});
	expect(f.paths).toEqual(["/system_stats", "/object_info"]);
	for (const mode of ["offline", "missing"] as const) {
		const f = fixture(mode);
		await expect(f.provider.connect(COMFY_WORKFLOW)).rejects.toMatchObject({
			code: "COMFY_CONNECTION_NOT_READY",
			uncertain: false,
		});
		expect(f.paths).not.toContain("/prompt");
	}
});
test("stored ZImage evidence remains verifiable after retirement, including pre-compiler receipts", async () => {
	const f = fixture();
	const result = await f.provider.generate(
		await f.provider.connect(COMFY_WORKFLOW),
		input,
		f.signal,
	);
	expect(result.nativeBytes).toEqual(Buffer.from(png));
	expect(result.provenance).toMatchObject({
		promptId: id,
		terminalNode: "9",
		nativeSHA: hash(png),
		seed: 421,
	});
	expect(measurePng(result.bytes)).toMatchObject({ width: 340, height: 510 });
	expect(JSON.parse(result.receiptBytes.toString())).toMatchObject({
		status: "draft",
		reviewStatus: "HOLD",
		responseSHA: hash(result.bytes),
	});
	const canonical = comfyReceiptSchema.parse(
		JSON.parse(result.canonicalReceiptBytes.toString()),
	);
	// The projection hash travels untouched; the compiled prompt gets its own.
	expect(canonical).toMatchObject({
		requestId: input.requestId,
		workflow: COMFY_WORKFLOW,
		models: comfyWorkflowModels(COMFY_WORKFLOW),
		sourceSHA: input.sourceSHA,
		textSHA: input.textSHA,
		promptSHA: hash(Buffer.from(input.text)),
		promptCompiler: "comfy-portrait-prompt.v3",
		sourcePngSHA: hash(result.sourceBytes),
		responseSHA: hash(result.sourceBytes),
		referenceHashes: [],
	});
	expect(JSON.parse(result.receiptBytes.toString())).toMatchObject({
		textSHA: input.textSHA,
		promptSHA: canonical.promptSHA,
		promptCompiler: "comfy-portrait-prompt.v3",
	});
	const evidence = {
		receipt: canonical,
		nativeBytes: result.nativeBytes,
		sourceBytes: result.sourceBytes,
		requestBytes: result.requestBytes,
		historyBytes: result.historyBytes,
	};
	expect(() => verifyComfyEvidence(evidence)).not.toThrow();
	// Compiler v1 receipts remain readable and graph-verifiable. Projection
	// recompilation uses this retained version, not the latest compiler default.
	const v1 = comfyReceiptSchema.parse({
		...canonical,
		promptCompiler: "comfy-portrait-prompt.v1",
	});
	expect(() => verifyComfyEvidence({ ...evidence, receipt: v1 })).not.toThrow();
	const v2 = comfyReceiptSchema.parse({
		...canonical,
		promptCompiler: "comfy-portrait-prompt.v2",
	});
	expect(() => verifyComfyEvidence({ ...evidence, receipt: v2 })).not.toThrow();
	expect(
		comfyReceiptSchema.safeParse({
			...canonical,
			promptCompiler: "comfy-portrait-prompt.v4",
		}).success,
	).toBe(false);
	// Older ZImage encoders may retain different PNG bytes for identical pixels.
	// An empty ancillary tEXt chunk changes the hash without changing the image.
	const ancillary = Buffer.from([
		0, 0, 0, 0, 116, 69, 88, 116, 150, 66, 197, 133,
	]);
	const historicalSource = Buffer.concat([
		result.sourceBytes.subarray(0, -12),
		ancillary,
		result.sourceBytes.subarray(-12),
	]);
	expect(hash(historicalSource)).not.toBe(canonical.sourcePngSHA);
	expect(() =>
		verifyComfyEvidence({
			...evidence,
			sourceBytes: historicalSource,
			receipt: {
				...canonical,
				sourcePngSHA: hash(historicalSource),
				responseSHA: hash(historicalSource),
			},
		}),
	).not.toThrow();
	const legacy = legacyComfyReceiptSchema.parse({
		...Object.fromEntries(
			Object.entries(canonical).filter(
				([key]) => !["promptSHA", "promptCompiler"].includes(key),
			),
		),
		textSHA: hash(Buffer.from(input.text)),
	});
	expect(() =>
		verifyComfyEvidence({ ...evidence, receipt: legacy }),
	).not.toThrow();
	expect(() =>
		verifyComfyEvidence({
			...evidence,
			receipt: { ...legacy, textSHA: "f".repeat(64) },
		}),
	).toThrow("COMFY_EVIDENCE_MISMATCH");
	const forged = (patch: Partial<typeof evidence>) => () =>
		verifyComfyEvidence({ ...evidence, ...patch });
	expect(
		forged({
			nativeBytes: Buffer.concat([result.nativeBytes, Buffer.from("x")]),
		}),
	).toThrow("COMFY_EVIDENCE_MISMATCH");
	const graph = JSON.parse(result.requestBytes.toString());
	graph.prompt["7"].inputs.steps = 30;
	const tamperedRequest = Buffer.from(JSON.stringify(graph));
	expect(
		forged({
			receipt: { ...canonical, requestSHA: hash(tamperedRequest) },
			requestBytes: tamperedRequest,
		}),
	).toThrow("COMFY_EVIDENCE_MISMATCH");
	expect(forged({ receipt: { ...canonical, seed: 7 } })).toThrow(
		"COMFY_EVIDENCE_MISMATCH",
	);
	// A receipt claiming another prompt hash, or another workflow for the same
	// graph, is rejected: the graph text must hash to promptSHA and the graph
	// must be the claimed workflow's exact server-owned graph.
	expect(
		forged({ receipt: { ...canonical, promptSHA: "e".repeat(64) } }),
	).toThrow("COMFY_EVIDENCE_MISMATCH");
	expect(
		forged({
			receipt: {
				...canonical,
				workflow: COMFY_MOSS_WORKFLOW,
				models: comfyWorkflowModels(COMFY_MOSS_WORKFLOW),
			},
		}),
	).toThrow("COMFY_EVIDENCE_MISMATCH");
	const history = JSON.parse(result.historyBytes.toString());
	history[id].status.status_str = "error";
	const tamperedHistory = Buffer.from(JSON.stringify(history));
	expect(
		forged({
			receipt: { ...canonical, historySHA: hash(tamperedHistory) },
			historyBytes: tamperedHistory,
		}),
	).toThrow("COMFY_EVIDENCE_MISMATCH");
	expect(f.paths.filter((p) => p === "/prompt")).toHaveLength(1);
	expect(f.auth()).toBe(f.paths.length + 1);
	expect(f.closed()).toBe(true);
});
test("terminal errors and interruptions never fetch output or return a draft", async () => {
	for (const mode of ["failure", "interrupted"] as const) {
		const f = fixture(mode);
		await expect(
			f.provider.generate(
				await f.provider.connect(COMFY_WORKFLOW),
				input,
				f.signal,
			),
		).rejects.toMatchObject({
			code: "COMFY_EXECUTION_FAILED",
			uncertain: false,
			promptId: id,
		});
		expect(f.paths.filter((p) => p === "/prompt")).toHaveLength(1);
		expect(
			f.paths.some((p) => p.startsWith("/history") || p.startsWith("/view")),
		).toBe(false);
		expect(f.closed()).toBe(true);
	}
});
test("mismatched prompt graph terminal node filename or invalid PNG never becomes draft", async () => {
	for (const mode of [
		"wrong-node",
		"wrong-prompt",
		"wrong-graph",
		"wrong-file",
		"bad-png",
		"wrong-size",
	] as const) {
		const f = fixture(mode);
		await expect(
			f.provider.generate(
				await f.provider.connect(COMFY_WORKFLOW),
				input,
				f.signal,
			),
		).rejects.toMatchObject({
			code: "COMFY_OUTPUT_MISMATCH",
			uncertain: false,
			promptId: id,
		});
		expect(f.paths.filter((p) => p === "/prompt")).toHaveLength(1);
		expect(f.closed()).toBe(true);
	}
});
test("lost submission, socket close and explicit abort never resubmit", async () => {
	for (const mode of ["lost", "close", "abort"] as const) {
		const f = fixture(mode);
		await expect(
			f.provider.generate(
				await f.provider.connect(COMFY_WORKFLOW),
				input,
				f.signal,
			),
		).rejects.toMatchObject({ uncertain: true });
		expect(f.paths.filter((p) => p === "/prompt")).toHaveLength(1);
		expect(f.closed()).toBe(true);
	}
});
test("connection proof is adapter-bound and pinned to one workflow", async () => {
	const a = fixture(),
		b = fixture();
	await expect(
		b.provider.generate(await a.provider.connect(COMFY_WORKFLOW), input),
	).rejects.toMatchObject({ code: "COMFY_CONNECTION_NOT_READY" });
	expect(b.paths).toHaveLength(0);
	// A ZImage-verified connection never carries a MOSS request and vice versa.
	const zimage = await a.provider.connect(COMFY_WORKFLOW);
	await expect(a.provider.generate(zimage, mossInput)).rejects.toMatchObject({
		code: "COMFY_CONNECTION_NOT_READY",
	});
	const moss = await a.provider.connect(COMFY_MOSS_WORKFLOW);
	await expect(a.provider.generate(moss, input)).rejects.toMatchObject({
		code: "COMFY_CONNECTION_NOT_READY",
	});
	// The compiled prompt is bounded per workflow before any network call.
	await expect(
		a.provider.generate(moss, {
			...mossInput,
			text: "x".repeat(COMFY_PROMPT_LIMITS[COMFY_MOSS_WORKFLOW] + 1),
		}),
	).rejects.toMatchObject({ code: "COMFY_INVALID_REQUEST" });
	expect(a.paths).not.toContain("/prompt");
});
test("MOSS SFT workflow: readiness needs its three installed models and the template graph is submitted with the compiled prompt", async () => {
	const f = fixture();
	const connection = await f.provider.connect(COMFY_MOSS_WORKFLOW);
	expect(connection).toMatchObject({
		provider: "comfyui",
		workflow: COMFY_MOSS_WORKFLOW,
		models: {
			diffusion: "moss_image_sft_int8_convrot.safetensors",
			encoder: "qwen3.5_9b_w4a8_gptq.safetensors",
			vae: "flux2-vae_small.safetensors",
		},
		state: "READY",
	});
	expect(f.paths).toEqual(["/system_stats", "/object_info"]);
	const result = await f.provider.generate(connection, mossInput, f.signal);
	const graph = JSON.parse(result.requestBytes.toString()).prompt;
	// Official template raw-prompt path: separate negative encoder, Flux2
	// latent at 1024x1536, 25 er_sde/simple steps at CFG 2.5, no SLG, no shift node.
	expect(graph["2"].inputs).toEqual({
		clip_name: "qwen3.5_9b_w4a8_gptq.safetensors",
		type: "moss_image",
		device: "default",
	});
	expect(graph["4"].inputs).toEqual({ text: mossInput.text, clip: ["2", 0] });
	expect(graph["5"]).toEqual({
		class_type: "CLIPTextEncode",
		inputs: { text: COMFY_MOSS_NEGATIVE, clip: ["2", 0] },
	});
	expect(graph["6"]).toEqual({
		class_type: "EmptyFlux2LatentImage",
		inputs: { width: 1024, height: 1536, batch_size: 1 },
	});
	expect(graph["7"].inputs).toEqual({
		model: ["1", 0],
		positive: ["4", 0],
		negative: ["5", 0],
		latent_image: ["6", 0],
		seed: 421,
		steps: 25,
		cfg: 2.5,
		sampler_name: "er_sde",
		scheduler: "simple",
		denoise: 1,
	});
	expect(Object.keys(graph).sort()).toEqual([
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7",
		"8",
		"9",
	]);
	expect(measurePng(result.bytes)).toMatchObject({ width: 340, height: 510 });
	const canonical = comfyReceiptSchema.parse(
		JSON.parse(result.canonicalReceiptBytes.toString()),
	);
	expect(canonical).toMatchObject({
		workflow: COMFY_MOSS_WORKFLOW,
		models: connection.models,
		promptSHA: hash(Buffer.from(mossInput.text)),
		textSHA: mossInput.textSHA,
	});
	expect(() =>
		verifyComfyEvidence({
			receipt: canonical,
			nativeBytes: result.nativeBytes,
			sourceBytes: result.sourceBytes,
			requestBytes: result.requestBytes,
			historyBytes: result.historyBytes,
		}),
	).not.toThrow();
	// Readiness fails closed when the MOSS diffusion model is not installed,
	// while the ZImage workflow on the same server stays READY.
	const partial = fixture("ok", png, ["z_image_turbo_bf16.safetensors"]);
	await expect(
		partial.provider.connect(COMFY_MOSS_WORKFLOW),
	).rejects.toMatchObject({ code: "COMFY_CONNECTION_NOT_READY" });
	expect(await partial.provider.connect(COMFY_WORKFLOW)).toMatchObject({
		workflow: COMFY_WORKFLOW,
	});
	expect(partial.paths).not.toContain("/prompt");
});

test("SaveImage RGB PNG keeps native bytes and expands alpha before portal resizing", async () => {
	const native = rgbPng();
	const f = fixture("ok", native);
	const result = await f.provider.generate(
		await f.provider.connect(COMFY_WORKFLOW),
		input,
	);
	expect(result.nativeBytes).toEqual(native);
	expect(result.provenance.nativeSHA).toBe(hash(native));
	expect(result.provenance.sourcePngSHA).not.toBe(hash(native));
	expect(result.provenance.sourcePngSHA).toBe(hash(result.sourceBytes));
	expect(measurePng(result.sourceBytes)).toMatchObject({
		width: 1024,
		height: 1536,
	});
	expect(measurePng(result.bytes)).toMatchObject({ width: 340, height: 510 });
});
