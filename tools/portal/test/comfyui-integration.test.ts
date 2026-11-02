import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { encodePng } from "../../portrait/acceptance/src/png.ts";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import {
	importOriginals,
	openOriginalsStore,
} from "../../people-cli/src/store.ts";
import {
	MOSS_ASSETS,
	MOSS_CAPTIONFIX_WORKFLOW,
	MOSS_MALE_DATASET,
	MOSS_MALE_WORKFLOW,
	mossWorkflowAssets,
	verifyMossAssetProof,
} from "../src/comfyui-assets.ts";
import { compileComfyPortraitPrompt } from "../src/comfyui-prompt.ts";
import {
	COMFY_ENDPOINT,
	COMFY_MOSS_NEGATIVE,
	type ComfyTransport,
	comfySourceFromNative,
} from "../src/comfyui-provider.ts";
import { COMFY_PROTOCOL } from "../src/connections.ts";
import { loadConfig } from "../src/config.ts";
import { measurePng, resizePortraitPng } from "../src/png.ts";
import { createPortal } from "../src/server.ts";
import { hash } from "../src/sources.ts";
import { png } from "./backend.test.ts";
import {
	finishingPngFixture,
	finishingProof,
} from "./comfyui-finishing-fixture.ts";

// Wire-level ComfyUI integration: real HTTP portal, real decodable PNG bytes,
// a fake ComfyUI transport injected at the adapter boundary. No GPU, no sleeps.
const COMFY_WORKFLOW = "moss-image-sft-style-lora.alpha.v1" as const;
const COMFY_MOSS_WORKFLOW = "moss-image-sft-text.alpha.v1" as const;
const COMFY_MODEL = `comfyui:${COMFY_WORKFLOW}`;
const MOSS_MODEL = `comfyui:${COMFY_MOSS_WORKFLOW}`;
const alphaFixture = finishingPngFixture();
const native = encodePng({
	width: 1024,
	height: 1536,
	pixels: new Uint8Array(1024 * 1536 * 4).fill(200),
});
type Mode = "ok" | "offline" | "close" | "logout-after-submit";
function comfyTransport(options: {
	mode: () => Mode;
	onSubmit?: () => Promise<void>;
}) {
	const socket = new EventTarget();
	const paths: string[] = [];
	const prompts: { id: string; graph: Record<string, unknown> }[] = [];
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
		"LoadBackgroundRemovalModel",
		"RemoveBackground",
		"ThresholdMask",
		"MaskComposite",
		"InvertMask",
		"EmptyImage",
		"ImageCompositeMasked",
		"JoinImageWithAlpha",
		"MaskToImage",
	])
		info[name] = { input: { required: {} }, output_node: name === "SaveImage" };
	const event = (type: string, prompt: string) =>
		socket.dispatchEvent(
			new MessageEvent("message", {
				data: JSON.stringify({ type, data: { prompt_id: prompt, node: null } }),
			}),
		);
	const transport: ComfyTransport = {
		webSocket(url) {
			expect(
				url.startsWith(`${COMFY_ENDPOINT.replace("http:", "ws:")}/ws?`),
			).toBe(true);
			queueMicrotask(() => socket.dispatchEvent(new Event("open")));
			return {
				addEventListener: socket.addEventListener.bind(socket),
				removeEventListener: socket.removeEventListener.bind(socket),
				close() {},
			};
		},
		async fetch(url, init) {
			const path = url.slice(COMFY_ENDPOINT.length);
			paths.push(path);
			expect(init.redirect).toBe("error");
			if (options.mode() === "offline") throw Error("offline");
			if (path === "/system_stats")
				return Response.json({ system: { comfyui_version: "0.41.0" } });
			if (path === "/object_info") return Response.json(info);
			if (path === "/prompt") {
				const graph = JSON.parse(String(init.body)).prompt;
				const id = randomUUID();
				prompts.push({ id, graph });
				await options.onSubmit?.();
				if (options.mode() === "close")
					socket.dispatchEvent(new Event("close"));
				else event("executing", id);
				return Response.json({ prompt_id: id, node_errors: {} });
			}
			const history = path.match(/^\/history\/(.+)$/);
			if (history) {
				const prompt = prompts.find((entry) => entry.id === history[1]);
				if (!prompt) throw Error(path);
				const prefix = Reflect.get(
					(prompt.graph["9"] as { inputs: Record<string, unknown> }).inputs,
					"filename_prefix",
				);
				return Response.json({
					[prompt.id]: {
						prompt: [1, prompt.id, prompt.graph, {}, ["9"]],
						status: { completed: true, status_str: "success" },
						outputs: {
							...(prompt.graph["20"]
								? Object.fromEntries(
										["11", "15", "16"].map((n) => [
											n,
											{
												images: [
													{
														filename: `${(prompt.graph[n] as { inputs: Record<string, unknown> }).inputs["filename_prefix"]}_00001_.png`,
														subfolder: "",
														type: "output",
													},
												],
											},
										]),
									)
								: {}),
							"9": {
								images: [
									{
										filename: `${prefix}_00001_.png`,
										subfolder: "",
										type: "output",
									},
								],
							},
						},
					},
				});
			}
			if (path.startsWith("/view?")) {
				const n = new URL(url).searchParams.get("filename") ?? "";
				const alpha = prompts.at(-1)?.graph["20"];
				return new Response(
					!alpha
						? native
						: n.includes("_rawmask_")
							? alphaFixture.rawMaskBytes
							: n.includes("_mask_")
								? alphaFixture.maskBytes
								: n.includes("_raw_")
									? alphaFixture.rawBytes
									: alphaFixture.finishedBytes,
				);
			}
			throw Error(path);
		},
	};
	return { transport, paths, prompts };
}
async function harness(options: {
	comfyui?: boolean;
	mode?: () => Mode;
	onSubmit?: () => Promise<void>;
}) {
	const root = await realpath(
		await mkdtemp(join(tmpdir(), "portal-comfy-integration-")),
	);
	const canonical = createTransportFixture();
	const image = png();
	const references = canonical.candidate.referenceImages.map((r) => ({
		...r,
		bytes: image,
		...(r.role === "recipient-appearance-only"
			? { sourceHash: hash(image) }
			: {}),
	}));
	const template = {
		candidate: { ...canonical.candidate, referenceImages: references },
		operatorPins: {
			...canonical.operatorPins,
			referenceImages: references.map((r) => ({
				id: r.id,
				sha256: hash(image),
			})),
		},
	};
	const person = {
		id: "person-1003",
		characterId: "K1003",
		name: "Fixture 1003",
		detailRoute: "/people/person-1003",
		familyTree: { personId: "K1003" },
	};
	const detail = Buffer.from(JSON.stringify(person));
	const look = JSON.parse(
		Buffer.from(canonical.candidate.lookBytes).toString(),
	);
	const token = Buffer.from(
		JSON.stringify({
			...look,
			personId: person.id,
			characterId: person.characterId,
			name: person.name,
			identity: { characterId: person.characterId, name: person.name },
			image: { sha256: hash(image) },
			generationContract: { model: "gpt-image-2.5" },
		}),
	);
	const dbPath = join(root, "originals.sqlite");
	const db = openOriginalsStore(dbPath);
	importOriginals(db, [
		{
			personId: person.id,
			characterId: person.characterId,
			name: person.name,
			detail: { url: "fixture:detail", bytes: detail, sha256: hash(detail) },
			token: { url: "fixture:token", bytes: token, sha256: hash(token) },
			image: { url: "fixture:image", bytes: image, sha256: hash(image) },
		},
	]);
	db.close();
	const wiki = createServer((_req, res) => res.end(detail));
	const openaiCalls: Buffer[] = [];
	const provider = createServer(async (req, res) => {
		const chunks: Buffer[] = [];
		for await (const chunk of req) chunks.push(Buffer.from(chunk));
		openaiCalls.push(Buffer.concat(chunks));
		res.writeHead(200, { "content-type": "application/json" }).end(
			JSON.stringify({
				data: [{ b64_json: Buffer.from(image).toString("base64") }],
			}),
		);
	});
	for (const server of [wiki, provider]) {
		const ready = once(server, "listening", {
			signal: AbortSignal.timeout(5000),
		});
		server.listen(0, "127.0.0.1");
		await ready;
	}
	const wa = wiki.address(),
		pa = provider.address();
	if (!wa || typeof wa === "string" || !pa || typeof pa === "string")
		throw Error("address");
	const comfy = comfyTransport({
		mode: options.mode ?? (() => "ok"),
		...(options.onSubmit ? { onSubmit: options.onSubmit } : {}),
	});
	const storage = join(root, "storage");
	const app = await createPortal(
		loadConfig({
			PORTAL_MODE: "local",
			PORTAL_PORT: "0",
			PORTAL_STORAGE_PATH: storage,
			PORTAL_ORIGINALS_DB: dbPath,
			WIKI_BASE_URL: `http://127.0.0.1:${wa.port}/wiki/`,
			...(options.comfyui === false ? {} : { PORTAL_COMFYUI: "true" }),
		}),
		{
			template,
			comfyTransport: comfy.transport,
			comfyMeasureFinishing: async () => finishingProof(),
			comfyMeasureAssets: async (workflow) =>
				verifyMossAssetProof(
					{
						schema: "moss-runtime-file-sha256.v1",
						method: "server-file-stream-sha256",
						assets: mossWorkflowAssets(workflow ?? COMFY_WORKFLOW).map(
							({ path: _path, ...asset }) => asset,
						),
					},
					workflow,
				),
		},
	);
	const ready = once(app.server, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	app.server.listen(0, "127.0.0.1");
	await ready;
	const a = app.server.address();
	if (!a || typeof a === "string") throw Error("address");
	const origin = `http://127.0.0.1:${a.port}`,
		api = `${origin}/tools/api`;
	async function session() {
		const boot = await fetch(`${api}/auth/session`);
		const body = z
			.object({ csrfToken: z.string(), comfyuiConfigured: z.boolean() })
			.parse(await boot.json());
		return {
			boot: body,
			headers: {
				cookie: (boot.headers.get("set-cookie") ?? "").split(";")[0] ?? "",
				origin,
				"x-csrf-token": body.csrfToken,
				"content-type": "application/json",
			},
		};
	}
	const uploadSheet = async (headers: Record<string, string>) => {
		const response = await fetch(`${api}/sheets`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				detailBase64: detail.toString("base64"),
				tokenBase64: token.toString("base64"),
				imageBase64: Buffer.from(image).toString("base64"),
			}),
		});
		return z.object({ sheetId: z.uuid() }).parse(await response.json()).sheetId;
	};
	return {
		api,
		storage,
		comfy,
		openaiCalls,
		openaiBaseUrl: `http://127.0.0.1:${pa.port}/v1`,
		session,
		uploadSheet,
		json: async (response: Response) => response.json() as Promise<unknown>,
		close: async () => {
			await app.close();
			for (const server of [wiki, provider]) {
				server.closeAllConnections();
				await new Promise<void>((resolve) => server.close(() => resolve()));
			}
			await rm(root, { recursive: true, force: true });
		},
	};
}
const connectionSchema = z.object({
	connectionId: z.uuid(),
	protocolVersion: z.string(),
	toolName: z.string(),
	state: z.string(),
	expiresAt: z.number(),
});
test("captionfix explicit connection never submits and its retained receipt seals with the separate adapter", async () => {
	const f = await harness({});
	try {
		const { headers } = await f.session();
		const response = await fetch(`${f.api}/connections`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				provider: "comfyui",
				workflow: "moss-image-sft-style-captionfix.alpha.v1",
			}),
		});
		expect(response.status).toBe(201);
		const connection = z
			.object({ connection: connectionSchema })
			.parse(await response.json()).connection;
		expect(f.comfy.prompts).toHaveLength(0);
		expect(f.comfy.paths).toEqual(["/system_stats", "/object_info"]);
		const sheetId = await f.uploadSheet(headers);
		const requestId = randomUUID();
		const generated = await fetch(`${f.api}/generations`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				requestId,
				sheetId,
				connectionId: connection.connectionId,
				providerModel: "comfyui:moss-image-sft-style-captionfix.alpha.v1",
				seed: 421,
				size: "340x510",
				faceMode: { kind: "unique", variantId: null },
			}),
		});
		expect(await generated.json()).toMatchObject({
			job: { id: requestId, state: "HOLD" },
		});
		const dir = join(f.storage, "1", "jobs", requestId);
		const receipt = JSON.parse(
			await readFile(join(dir, "candidate.png.receipt.json"), "utf8"),
		);
		expect(receipt).toMatchObject({
			workflow: "moss-image-sft-style-captionfix.alpha.v1",
			promptCompiler: "comfy-portrait-prompt.v3",
			lora: {
				filename: "seoul-dengoku-moss-sft-style-captionfix.safetensors",
				sha256:
					"d2c36358af8253903a417aeb30f8eafeecd1b6abbc83641e995d36cd68c85cdf",
				strength: 1,
			},
		});
		expect(receipt.assetProofSHA).toBe(
			hash(await readFile(join(dir, "comfy-assets.json"))),
		);
		expect(
			(await fetch(`${f.api}/jobs/${requestId}/result`, { headers })).status,
		).toBe(200);
		expect(f.comfy.prompts).toHaveLength(1);
	} finally {
		await f.close();
	}
});
test("male explicit connection never submits and its retained receipt seals with the separate adapter", async () => {
	const f = await harness({});
	try {
		const { headers } = await f.session();
		const response = await fetch(`${f.api}/connections`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				provider: "comfyui",
				workflow: "moss-image-sft-style-male.alpha.v1",
			}),
		});
		expect(response.status).toBe(201);
		const connection = z
			.object({ connection: connectionSchema })
			.parse(await response.json()).connection;
		expect(f.comfy.prompts).toHaveLength(0);
		expect(f.comfy.paths).toEqual(["/system_stats", "/object_info"]);
		const sheetId = await f.uploadSheet(headers);
		const requestId = randomUUID();
		const generated = await fetch(`${f.api}/generations`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				requestId,
				sheetId,
				connectionId: connection.connectionId,
				providerModel: "comfyui:moss-image-sft-style-male.alpha.v1",
				seed: 421,
				size: "340x510",
				faceMode: { kind: "unique", variantId: null },
			}),
		});
		expect(await generated.json()).toMatchObject({
			job: { id: requestId, state: "HOLD" },
		});
		const dir = join(f.storage, "1", "jobs", requestId);
		const receipt = JSON.parse(
			await readFile(join(dir, "candidate.png.receipt.json"), "utf8"),
		);
		expect(receipt).toMatchObject({
			workflow: "moss-image-sft-style-male.alpha.v1",
			promptCompiler: "comfy-portrait-prompt.v3",
			lora: {
				filename: "seoul-dengoku-moss-sft-style-male.safetensors",
				sha256:
					"1570c8b8e987f7304622b83e3ea48963bf24065f630e6f44b987f5b9a6588aa6",
				strength: 1,
				dataset: MOSS_MALE_DATASET,
			},
		});
		expect(receipt.assetProofSHA).toBe(
			hash(await readFile(join(dir, "comfy-assets.json"))),
		);
		expect(
			(await fetch(`${f.api}/jobs/${requestId}/result`, { headers })).status,
		).toBe(200);
		expect(f.comfy.prompts).toHaveLength(1);
	} finally {
		await f.close();
	}
});
const connectionsSchema = z.object({
	connection: connectionSchema.nullable(),
	comfyui: z.object({
		available: z.boolean(),
		workflows: z.array(
			z.object({
				id: z.string(),
				providerModel: z.string(),
				label: z.string(),
				limitations: z.string(),
			}),
		),
		connection: connectionSchema.nullable(),
		readiness: z
			.object({
				state: z.literal("READY"),
				workflow: z.string(),
				models: z.record(z.string(), z.string()),
			})
			.nullable(),
	}),
});

test("ComfyUI connection verifies readiness only, coexists with the OpenAI-compatible connection, and generates a sealed 340x510 draft with truthful evidence", async () => {
	const f = await harness({});
	try {
		const { boot, headers } = await f.session();
		expect(boot.comfyuiConfigured).toBe(true);
		const openai = await fetch(`${f.api}/connections`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				baseUrl: f.openaiBaseUrl,
				apiKey: "own-key-only",
			}),
		});
		expect(openai.status).toBe(201);
		const openaiConnection = z
			.object({ connection: connectionSchema })
			.parse(await openai.json()).connection;
		expect(openaiConnection.protocolVersion).toBe("openai-compatible-http.v1");
		let listed = connectionsSchema.parse(
			await (await fetch(`${f.api}/connections`, { headers })).json(),
		);
		expect(listed.connection?.state).toBe("READY");
		expect(listed.comfyui).toMatchObject({
			available: true,
			connection: null,
			readiness: null,
		});
		expect(listed.comfyui.workflows.map((w) => w.id)).toEqual([
			"moss-image-sft-style-lora.alpha.v1",
			"moss-image-sft-style-captionfix.alpha.v1",
			"moss-image-sft-style-male.alpha.v1",
			"moss-image-sft-style-diagnostic-zero.alpha.v1",
			"moss-image-sft-style-diagnostic-reduced.alpha.v1",
			COMFY_MOSS_WORKFLOW,
			"moss-image-sft-source-img2img.alpha.v1",
		]);
		expect(listed.comfyui.workflows[0]?.providerModel).toBe(
			"comfyui:moss-image-sft-style-lora.alpha.v1",
		);
		expect(listed.comfyui.workflows[5]).toMatchObject({
			providerModel: MOSS_MODEL,
			label: "ComfyUI · MOSS-Image SFT 텍스트→이미지 · 자동 투명 마무리",
		});
		expect(listed.comfyui.workflows[5]?.limitations).toContain(
			"스타일 자격을 주장하지 않",
		);
		expect(f.comfy.paths).toEqual([]);
		for (const [route, payload] of [
			[
				"connections",
				{ provider: "comfyui", workflow: "zimage-turbo-text-draft.v1" },
			],
			[
				"generations",
				{
					requestId: randomUUID(),
					personId: "person-1003",
					providerModel: "comfyui:zimage-turbo-text-draft.v1",
					size: "340x510",
					faceMode: { kind: "unique", variantId: null },
				},
			],
		] as const) {
			const response = await fetch(`${f.api}/${route}`, {
				method: "POST",
				headers,
				body: JSON.stringify(payload),
			});
			expect(response.status).toBe(422);
			expect(await response.json()).toMatchObject({
				error: { code: "COMFY_WORKFLOW_RETIRED" },
			});
		}
		expect(f.comfy.paths).toEqual([]);

		// Browser-supplied endpoint/graph fields are rejected by the strict schema.
		for (const strength of [0, 0.7, 0.5, 1]) {
			const rejected = await fetch(`${f.api}/generations`, {
				method: "POST",
				headers,
				body: JSON.stringify({
					requestId: randomUUID(),
					personId: "person-1003",
					providerModel: "comfyui:moss-image-sft-style-diagnostic-zero.v1",
					faceMode: { kind: "unique", variantId: null },
					strength,
				}),
			});
			expect(rejected.status).toBe(422);
		}
		expect(f.comfy.prompts).toHaveLength(0);
		expect(
			(
				await fetch(`${f.api}/connections`, {
					method: "POST",
					headers,
					body: JSON.stringify({
						provider: "comfyui",
						workflow: COMFY_WORKFLOW,
						endpoint: "http://attacker.example:8188",
					}),
				})
			).status,
		).toBe(422);
		expect(
			(
				await fetch(`${f.api}/connections`, {
					method: "POST",
					headers,
					body: JSON.stringify({ provider: "comfyui", workflow: "other" }),
				})
			).status,
		).toBe(422);
		const connected = await fetch(`${f.api}/connections`, {
			method: "POST",
			headers,
			body: JSON.stringify({ provider: "comfyui", workflow: COMFY_WORKFLOW }),
		});
		expect(connected.status).toBe(201);
		const raw = await connected.text();
		expect(raw).not.toContain("own-key-only");
		expect(raw).not.toContain(COMFY_ENDPOINT);
		const comfyConnected = z
			.object({
				connection: connectionSchema,
				readiness: z.object({
					state: z.literal("READY"),
					workflow: z.literal(COMFY_WORKFLOW),
					models: z.record(z.string(), z.string()),
				}),
			})
			.parse(JSON.parse(raw));
		expect(comfyConnected.connection).toMatchObject({
			protocolVersion: "comfyui-http.v1",
			toolName: COMFY_WORKFLOW,
			state: "READY",
		});
		// Readiness made no generation request and left the OpenAI connection live.
		expect(f.comfy.paths).toEqual(["/system_stats", "/object_info"]);
		listed = connectionsSchema.parse(
			await (await fetch(`${f.api}/connections`, { headers })).json(),
		);
		expect(listed.connection).toMatchObject({
			connectionId: openaiConnection.connectionId,
			state: "READY",
		});
		expect(listed.comfyui.connection).toMatchObject({
			connectionId: comfyConnected.connection.connectionId,
			state: "READY",
		});
		expect(listed.comfyui.readiness?.workflow).toBe(COMFY_WORKFLOW);
		// A second Comfy connect is refused while one is live; OpenAI untouched.
		expect(
			(
				await fetch(`${f.api}/connections`, {
					method: "POST",
					headers,
					body: JSON.stringify({
						provider: "comfyui",
						workflow: COMFY_WORKFLOW,
					}),
				})
			).status,
		).toBe(409);

		const sheetId = await f.uploadSheet(headers);
		const requestId = randomUUID();
		const generation = {
			requestId,
			sheetId,
			connectionId: comfyConnected.connection.connectionId,
			providerModel: COMFY_MODEL,
			seed: 421,
			size: "340x510",
			faceMode: { kind: "unique", variantId: null },
		};
		// Provider/connection mismatches and a seed on a GPT request never dispatch;
		// retired workflows cannot be requested.
		for (const [body, status] of [
			[{ ...generation, connectionId: openaiConnection.connectionId }, 409],
			[
				{
					...generation,
					providerModel: "gpt-image-2.5-sunburst",
					seed: undefined,
				},
				409,
			],
			[
				{
					...generation,
					connectionId: openaiConnection.connectionId,
					providerModel: "gpt-image-2.5-sunburst",
				},
				422,
			],
			[{ ...generation, seed: -1 }, 422],
		] as const) {
			const response = await fetch(`${f.api}/generations`, {
				method: "POST",
				headers,
				body: JSON.stringify(body),
			});
			expect(response.status).toBe(status);
			if (status === 409)
				expect(await response.json()).toMatchObject({
					error: { code: "CONNECTION_PROVIDER_MISMATCH" },
				});
		}
		expect(f.comfy.prompts).toHaveLength(0);
		expect(f.openaiCalls).toHaveLength(0);

		const single = await fetch(`${f.api}/generations`, {
			method: "POST",
			headers,
			body: JSON.stringify(generation),
		});
		expect(single.status).toBe(200);
		const job = z
			.object({
				job: z.object({
					id: z.literal(requestId),
					state: z.literal("HOLD"),
					imageUrl: z.string(),
					metrics: z.object({ width: z.literal(340), height: z.literal(510) }),
				}),
			})
			.parse(await single.json()).job;
		expect(f.comfy.prompts).toHaveLength(1);
		const submitted = f.comfy.prompts[0];
		if (!submitted) throw Error("prompt");
		const dir = join(f.storage, "1", "jobs", requestId);
		const projectionText = await readFile(join(dir, "projection.txt"), "utf8");
		// The graph encoded the portrait prompt compiled from the retained
		// projection, not the projection JSON itself, and no image.
		const compiledPrompt = await readFile(
			join(dir, "comfy-prompt.txt"),
			"utf8",
		);
		const recompiled = compileComfyPortraitPrompt(
			JSON.parse(await readFile(join(dir, "projection.json"), "utf8"))
				.rendering,
			COMFY_WORKFLOW,
		);
		expect(compiledPrompt).toBe(recompiled.text);
		expect(compiledPrompt).not.toBe(projectionText);
		expect(compiledPrompt.length).toBeLessThan(projectionText.length);
		expect(compiledPrompt).not.toContain("{");
		expect(compiledPrompt).toContain("one person");
		expect(compiledPrompt).toContain("no text, no letters, no numbers");
		expect(
			Reflect.get(submitted.graph["4"] as { inputs: object }, "inputs"),
		).toEqual({
			text: compiledPrompt,
			clip: ["2", 0],
		});
		expect(
			JSON.parse(await readFile(join(dir, "comfy-prompt.json"), "utf8")),
		).toMatchObject({
			compiler: "comfy-portrait-prompt.v3",
			workflow: COMFY_WORKFLOW,
			promptSHA: recompiled.sha,
			textSHA: hash(Buffer.from(projectionText)),
			chars: compiledPrompt.length,
		});
		expect(
			Reflect.get(submitted.graph["7"] as { inputs: object }, "inputs"),
		).toMatchObject({
			seed: 421,
		});
		expect(JSON.stringify(submitted.graph)).not.toContain("base64");
		expect(
			JSON.parse(await readFile(join(dir, "request-payload.json"), "utf8")),
		).toEqual(generation);
		expect(await readFile(join(dir, "provider-native.png"))).toEqual(
			Buffer.from(alphaFixture.finishedBytes),
		);
		const source = await readFile(join(dir, "provider-source.png"));
		expect(source).toEqual(
			Buffer.from(comfySourceFromNative(alphaFixture.finishedBytes)),
		);
		const candidate = await readFile(join(dir, "candidate.png"));
		expect(candidate).toEqual(Buffer.from(resizePortraitPng(source)));
		expect(measurePng(candidate)).toMatchObject({ width: 340, height: 510 });
		const receipt = JSON.parse(
			await readFile(join(dir, "candidate.png.receipt.json"), "utf8"),
		);
		expect(receipt).toMatchObject({
			requestId,
			provider: "comfyui",
			workflow: COMFY_WORKFLOW,
			promptId: submitted.id,
			textSHA: hash(Buffer.from(projectionText)),
			promptSHA: recompiled.sha,
			promptCompiler: "comfy-portrait-prompt.v3",
			seed: 421,
			status: "draft",
			reviewStatus: "HOLD",
			referenceHashes: [],
			nativeSHA: hash(alphaFixture.finishedBytes),
			responseSHA: hash(candidate),
			transformation: {
				sourcePngSHA: hash(source),
				outputPngSHA: hash(candidate),
				width: 340,
				height: 510,
			},
		});
		expect(receipt.model).toBeUndefined();
		expect(receipt.lora).toMatchObject({
			filename: "seoul-dengoku-moss-sft-style.safetensors",
			sha256: MOSS_ASSETS[3].sha256,
			strength: 1,
			trigger: "seoul dengoku portrait style",
		});
		expect(receipt.assetProofSHA).toBe(
			hash(await readFile(join(dir, "comfy-assets.json"))),
		);
		expect(
			JSON.parse(await readFile(join(dir, "comfy-request.json"), "utf8")),
		).toMatchObject({ prompt: submitted.graph });
		const transportRequest = JSON.parse(
			await readFile(join(dir, "candidate.png.request.json"), "utf8"),
		);
		expect(transportRequest).toMatchObject({
			provider: "comfyui",
			workflow: COMFY_WORKFLOW,
			model: COMFY_MODEL,
			seed: 421,
			referenceHashes: [],
			referenceImages: [],
			size: "340x510",
			providerSize: "1024x1536",
			prompt: compiledPrompt,
			promptSHA: recompiled.sha,
			promptCompiler: "comfy-portrait-prompt.v3",
			textSHA: hash(Buffer.from(projectionText)),
		});
		expect(
			JSON.parse(await readFile(join(dir, "provenance.json"), "utf8")),
		).toMatchObject({ operatorProviderModel: COMFY_MODEL });
		for (const name of [
			"mcp-request.bin",
			"provider-request.bin",
			"provider-response.bin",
		])
			await expect(readFile(join(dir, name))).rejects.toThrow();

		// Existing result/inspection/evaluation/history surfaces accept the draft.
		const result = z
			.object({
				result: z.object({
					size: z.literal("340x510"),
					pngSHA: z.literal(hash(candidate)),
					receiptSHA: z.string(),
					machineEvidence: z.object({ metricsSHA: z.string() }),
					reviewStatus: z.literal("HOLD"),
					approval: z.literal("NONE"),
				}),
			})
			.parse(
				await (
					await fetch(`${f.api}/jobs/${requestId}/result`, { headers })
				).json(),
			).result;
		const evaluation = await fetch(`${f.api}/jobs/${requestId}/evaluations`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				evaluationId: randomUUID(),
				expectedRevision: 0,
				pngSHA: result.pngSHA,
				receiptSHA: result.receiptSHA,
				machineMetricsSHA: result.machineEvidence.metricsSHA,
				verdict: "hold",
				categories: Object.fromEntries(
					[
						"identity-and-face",
						"anatomy-and-pose",
						"framing-and-composition",
						"technique-and-style",
						"transparency-and-edges",
						"authored-conditions",
					].map((name) => [name, { judgement: "hold", notes: "" }]),
				),
				notes: "Comfy draft review",
			}),
		});
		expect(evaluation.status).toBe(201);
		const image = await fetch(`${f.api}/jobs/${requestId}/image`, { headers });
		expect(image.status).toBe(200);
		expect(Buffer.from(await image.arrayBuffer())).toEqual(candidate);
		const inspection = z
			.object({
				inspection: z.object({
					originalRequest: z.object({ providerModel: z.literal(COMFY_MODEL) }),
					dispatchEvidence: z.object({
						request: z.object({ available: z.literal(true) }),
						response: z.object({ available: z.literal(true) }),
					}),
					artifacts: z.record(z.string(), z.object({ available: z.boolean() })),
					upstreamOutcome: z.literal("OUTPUT_RECEIVED"),
				}),
			})
			.parse(
				await (
					await fetch(`${f.api}/jobs/${requestId}/inspection`, { headers })
				).json(),
			).inspection;
		expect(inspection.artifacts["comfy-request.json"]?.available).toBe(true);
		expect(inspection.artifacts["comfy-history.json"]?.available).toBe(true);
		expect(inspection.artifacts["comfy-prompt.txt"]?.available).toBe(true);
		expect(inspection.artifacts["provider-native.png"]?.available).toBe(true);
		const history = z
			.object({
				history: z.array(
					z.object({
						job: z.object({ id: z.string() }),
						providerModel: z.string().nullable(),
						source: z.object({ personId: z.string() }).nullable(),
					}),
				),
			})
			.parse(await (await fetch(`${f.api}/jobs`, { headers })).json()).history;
		expect(history).toEqual([
			expect.objectContaining({
				job: expect.objectContaining({ id: requestId }),
				providerModel: COMFY_MODEL,
				source: expect.objectContaining({ personId: "person-1003" }),
			}),
		]);

		// Idempotent replay returns the same job and never resubmits the prompt.
		const replay = await fetch(`${f.api}/generations`, {
			method: "POST",
			headers,
			body: JSON.stringify(generation),
		});
		expect(await replay.json()).toMatchObject({
			job: { id: requestId, state: "HOLD" },
		});
		expect(
			(
				await fetch(`${f.api}/generations`, {
					method: "POST",
					headers,
					body: JSON.stringify({ ...generation, seed: 7 }),
				})
			).status,
		).toBe(409);
		expect(f.comfy.prompts).toHaveLength(1);

		// The OpenAI-compatible connection still generates through its own path.
		const gptId = randomUUID();
		const gpt = await fetch(`${f.api}/generations`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				requestId: gptId,
				sheetId,
				connectionId: openaiConnection.connectionId,
				providerModel: "gpt-image-2.5-sunburst",
				size: "340x510",
				faceMode: { kind: "unique", variantId: null },
			}),
		});
		expect(await gpt.json()).toMatchObject({
			job: { id: gptId, state: "HOLD" },
		});
		expect(f.openaiCalls).toHaveLength(1);
		expect(f.comfy.prompts).toHaveLength(1);
		const gptReceipt = JSON.parse(
			await readFile(
				join(f.storage, "1", "jobs", gptId, "candidate.png.receipt.json"),
				"utf8",
			),
		);
		expect(gptReceipt).toMatchObject({
			model: "gpt-image-2.5-sunburst",
			status: 200,
			reviewStatus: "candidate-unreviewed",
		});
		expect(gptReceipt.provider).toBeUndefined();
		expect(
			(await fetch(`${f.api}/jobs/${gptId}/result`, { headers })).status,
		).toBe(200);
		expect(job.imageUrl).toBe(`/tools/api/jobs/${requestId}/image`);

		// Explicit Comfy disconnect leaves the OpenAI connection READY.
		const disconnect = await fetch(
			`${f.api}/connections/${comfyConnected.connection.connectionId}`,
			{ method: "DELETE", headers },
		);
		expect(await disconnect.json()).toMatchObject({
			connection: { state: "REVOKED", protocolVersion: "comfyui-http.v1" },
		});
		listed = connectionsSchema.parse(
			await (await fetch(`${f.api}/connections`, { headers })).json(),
		);
		expect(listed.connection?.state).toBe("READY");
		expect(listed.comfyui.connection?.state).toBe("REVOKED");
		expect(listed.comfyui.readiness).toBeNull();
		expect(
			(
				await fetch(`${f.api}/generations`, {
					method: "POST",
					headers,
					body: JSON.stringify({ ...generation, requestId: randomUUID() }),
				})
			).status,
		).toBe(409);
		expect(f.comfy.prompts).toHaveLength(1);

		// The second server-owned workflow: a MOSS connection verifies its own
		// readiness, submits the official template graph with the same compiled
		// prompt, and its draft passes the same evidence verification.
		const mossConnected = z
			.object({
				connection: connectionSchema,
				readiness: z.object({
					state: z.literal("READY"),
					workflow: z.literal(COMFY_MOSS_WORKFLOW),
					models: z.object({
						diffusion: z.literal("moss_image_sft_int8_convrot.safetensors"),
						encoder: z.literal("qwen3.5_9b_w4a8_gptq.safetensors"),
						vae: z.literal("flux2-vae_small.safetensors"),
					}),
				}),
			})
			.parse(
				await (
					await fetch(`${f.api}/connections`, {
						method: "POST",
						headers,
						body: JSON.stringify({
							provider: "comfyui",
							workflow: COMFY_MOSS_WORKFLOW,
						}),
					})
				).json(),
			);
		expect(mossConnected.connection.toolName).toBe(COMFY_MOSS_WORKFLOW);
		// A retired ZImage request is rejected before dispatch.
		expect(
			(
				await fetch(`${f.api}/generations`, {
					method: "POST",
					headers,
					body: JSON.stringify({
						...generation,
						requestId: randomUUID(),
						connectionId: mossConnected.connection.connectionId,
						providerModel: "comfyui:zimage-turbo-text-draft.v1",
					}),
				})
			).status,
		).toBe(422);
		const mossId = randomUUID();
		const mossJob = await fetch(`${f.api}/generations`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				...generation,
				requestId: mossId,
				connectionId: mossConnected.connection.connectionId,
				providerModel: MOSS_MODEL,
				seed: 7,
			}),
		});
		expect(await mossJob.json()).toMatchObject({
			job: { id: mossId, state: "HOLD" },
		});
		expect(f.comfy.prompts).toHaveLength(2);
		const mossGraph = f.comfy.prompts[1]?.graph ?? {};
		const mossDir = join(f.storage, "1", "jobs", mossId);
		const mossPrompt = await readFile(
			join(mossDir, "comfy-prompt.txt"),
			"utf8",
		);
		// Same authored source, same compiled prompt; the projection text itself
		// differs per job (its lookId is the request id) and stays bound as such.
		const mossProjectionText = await readFile(
			join(mossDir, "projection.txt"),
			"utf8",
		);
		expect(mossPrompt).toBe(
			compiledPrompt.replace("seoul dengoku portrait style. ", ""),
		);
		expect(mossProjectionText).not.toBe(projectionText);
		expect(mossGraph["4"]).toEqual({
			class_type: "CLIPTextEncode",
			inputs: { text: mossPrompt, clip: ["2", 0] },
		});
		expect(mossGraph["5"]).toEqual({
			class_type: "CLIPTextEncode",
			inputs: { text: COMFY_MOSS_NEGATIVE, clip: ["2", 0] },
		});
		expect(mossGraph["6"]).toEqual({
			class_type: "EmptyFlux2LatentImage",
			inputs: { width: 1024, height: 1536, batch_size: 1 },
		});
		expect(mossGraph["7"]).toMatchObject({
			inputs: {
				model: ["1", 0],
				seed: 7,
				steps: 25,
				cfg: 2.5,
				sampler_name: "er_sde",
			},
		});
		expect(
			JSON.parse(
				await readFile(join(mossDir, "candidate.png.receipt.json"), "utf8"),
			),
		).toMatchObject({
			provider: "comfyui",
			workflow: COMFY_MOSS_WORKFLOW,
			promptSHA: hash(Buffer.from(mossPrompt)),
			textSHA: hash(Buffer.from(mossProjectionText)),
			seed: 7,
			status: "draft",
		});
		const mossResult = z
			.object({
				result: z.object({
					pngSHA: z.string(),
					receiptSHA: z.string(),
					machineEvidence: z.object({ metricsSHA: z.string() }),
				}),
			})
			.parse(
				await (
					await fetch(`${f.api}/jobs/${mossId}/result`, { headers })
				).json(),
			).result;
		const review = () =>
			fetch(`${f.api}/jobs/${mossId}/evaluations`, {
				method: "POST",
				headers,
				body: JSON.stringify({
					evaluationId: randomUUID(),
					expectedRevision: 0,
					pngSHA: mossResult.pngSHA,
					receiptSHA: mossResult.receiptSHA,
					machineMetricsSHA: mossResult.machineEvidence.metricsSHA,
					verdict: "hold",
					categories: Object.fromEntries(
						[
							"identity-and-face",
							"anatomy-and-pose",
							"framing-and-composition",
							"technique-and-style",
							"transparency-and-edges",
							"authored-conditions",
						].map((name) => [name, { judgement: "hold", notes: "" }]),
					),
					notes: "MOSS draft review",
				}),
			});
		// A stored compiled prompt that no longer reproduces from the projection
		// is rejected by evaluation; restoring it makes the review admissible.
		await writeFile(
			join(mossDir, "comfy-prompt.txt"),
			`${mossPrompt} tampered`,
		);
		const tampered = await review();
		expect(tampered.status).toBe(409);
		expect(await tampered.json()).toMatchObject({
			error: { code: "RESULT_EVIDENCE_MISMATCH" },
		});
		await writeFile(join(mossDir, "comfy-prompt.txt"), mossPrompt);
		expect((await review()).status).toBe(201);
		expect(f.comfy.prompts).toHaveLength(2);
	} finally {
		await f.close();
	}
}, 30000);

test("ComfyUI readiness failure never submits and a lost completion yields UNKNOWN that blocks admission without resubmission", async () => {
	let mode: Mode = "offline";
	const f = await harness({ mode: () => mode });
	try {
		const { headers } = await f.session();
		const offline = await fetch(`${f.api}/connections`, {
			method: "POST",
			headers,
			body: JSON.stringify({ provider: "comfyui", workflow: COMFY_WORKFLOW }),
		});
		expect(offline.status).toBe(409);
		expect(await offline.json()).toEqual({
			error: { code: "CONNECTION_NOT_READY" },
		});
		expect(f.comfy.paths).toEqual(["/system_stats"]);
		let listed = connectionsSchema.parse(
			await (await fetch(`${f.api}/connections`, { headers })).json(),
		);
		expect(listed.comfyui.connection?.state ?? "REVOKED").toBe("REVOKED");
		mode = "ok";
		const connected = z.object({ connection: connectionSchema }).parse(
			await (
				await fetch(`${f.api}/connections`, {
					method: "POST",
					headers,
					body: JSON.stringify({
						provider: "comfyui",
						workflow: COMFY_WORKFLOW,
					}),
				})
			).json(),
		).connection;
		expect(connected.state).toBe("READY");
		const sheetId = await f.uploadSheet(headers);
		mode = "close";
		const requestId = randomUUID();
		const generation = {
			requestId,
			sheetId,
			connectionId: connected.connectionId,
			providerModel: COMFY_MODEL,
			size: "340x510",
			faceMode: { kind: "unique", variantId: null },
		};
		const unknown = await fetch(`${f.api}/generations`, {
			method: "POST",
			headers,
			body: JSON.stringify(generation),
		});
		expect(await unknown.json()).toMatchObject({
			job: {
				id: requestId,
				state: "UNKNOWN",
				imageUrl: null,
				errorCode: "COMFY_SOCKET_FAILURE",
			},
		});
		expect(f.comfy.prompts).toHaveLength(1);
		const dir = join(f.storage, "1", "jobs", requestId);
		expect(
			JSON.parse(await readFile(join(dir, "comfy-response.json"), "utf8")),
		).toMatchObject({
			transport: "comfyui-http",
			code: "COMFY_SOCKET_FAILURE",
			uncertain: true,
			promptId: f.comfy.prompts[0]?.id,
		});
		// The server-drawn seed is retained with the request evidence.
		expect(
			JSON.parse(
				await readFile(join(dir, "candidate.png.request.json"), "utf8"),
			).seed,
		).toEqual(expect.any(Number));
		await expect(readFile(join(dir, "candidate.png"))).rejects.toThrow();
		expect(
			(await fetch(`${f.api}/jobs/${requestId}/result`, { headers })).status,
		).toBe(409);
		mode = "ok";
		expect(
			await (
				await fetch(`${f.api}/generations`, {
					method: "POST",
					headers,
					body: JSON.stringify(generation),
				})
			).json(),
		).toMatchObject({ job: { id: requestId, state: "UNKNOWN" } });
		const blocked = await fetch(`${f.api}/generations`, {
			method: "POST",
			headers,
			body: JSON.stringify({ ...generation, requestId: randomUUID() }),
		});
		expect(blocked.status).toBe(409);
		expect(await blocked.json()).toMatchObject({
			error: { code: "OWNER_DISPATCH_UNCERTAIN" },
		});
		expect(f.comfy.prompts).toHaveLength(1);
		listed = connectionsSchema.parse(
			await (await fetch(`${f.api}/connections`, { headers })).json(),
		);
		expect(listed.comfyui.connection?.state).toBe("READY");
		const jobs = z
			.object({
				jobs: z.array(z.object({ id: z.string(), state: z.string() })),
				lease: z.object({ admissionBlocked: z.literal(true) }),
			})
			.parse(await (await fetch(`${f.api}/jobs`, { headers })).json());
		expect(jobs.jobs).toEqual(
			[{ id: requestId, state: "UNKNOWN" }].map((j) =>
				expect.objectContaining(j),
			),
		);
	} finally {
		await f.close();
	}
}, 30000);

test("logout after the Comfy prompt was accepted ends as UNKNOWN with no further Comfy calls, and a fresh session sees the lease", async () => {
	let api = "";
	let headers: Record<string, string> = {};
	const f = await harness({
		mode: () => "ok",
		onSubmit: async () => {
			// Revoke the session between prompt acceptance and history retrieval.
			expect(
				(
					await fetch(`${api}/auth/logout`, {
						method: "POST",
						headers,
						body: "{}",
					})
				).status,
			).toBe(200);
		},
	});
	api = f.api;
	try {
		const first = await f.session();
		headers = first.headers;
		const connected = z.object({ connection: connectionSchema }).parse(
			await (
				await fetch(`${f.api}/connections`, {
					method: "POST",
					headers,
					body: JSON.stringify({
						provider: "comfyui",
						workflow: COMFY_WORKFLOW,
					}),
				})
			).json(),
		).connection;
		const sheetId = await f.uploadSheet(headers);
		const requestId = randomUUID();
		const response = await fetch(`${f.api}/generations`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				requestId,
				sheetId,
				connectionId: connected.connectionId,
				providerModel: COMFY_MODEL,
				size: "340x510",
				faceMode: { kind: "unique", variantId: null },
			}),
		});
		expect(await response.json()).toMatchObject({
			job: {
				id: requestId,
				state: "UNKNOWN",
				errorCode: "COMFY_GENERATION_FAILED",
			},
		});
		expect(f.comfy.prompts).toHaveLength(1);
		expect(f.comfy.paths.filter((p) => p.startsWith("/history"))).toEqual([]);
		expect(f.comfy.paths.filter((p) => p.startsWith("/view"))).toEqual([]);
		expect((await fetch(`${f.api}/connections`, { headers })).status).toBe(401);
		const next = await f.session();
		const listed = connectionsSchema.parse(
			await (
				await fetch(`${f.api}/connections`, { headers: next.headers })
			).json(),
		);
		expect(listed.comfyui.connection).toBeNull();
		const jobs = z
			.object({
				jobs: z.array(z.object({ id: z.string(), state: z.string() })),
				lease: z.object({ admissionBlocked: z.boolean() }),
			})
			.parse(
				await (await fetch(`${f.api}/jobs`, { headers: next.headers })).json(),
			);
		expect(jobs.jobs).toEqual([
			expect.objectContaining({ id: requestId, state: "UNKNOWN" }),
		]);
		expect(jobs.lease.admissionBlocked).toBe(true);
		expect(
			(
				await fetch(`${f.api}/connections`, {
					method: "POST",
					headers: next.headers,
					body: JSON.stringify({
						provider: "comfyui",
						workflow: COMFY_WORKFLOW,
					}),
				})
			).status,
		).toBe(409);
		expect(f.comfy.prompts).toHaveLength(1);
	} finally {
		await f.close();
	}
}, 30000);

test("without PORTAL_COMFYUI the Comfy provider is absent and hosted mode rejects the flag", async () => {
	const f = await harness({ comfyui: false });
	try {
		const { boot, headers } = await f.session();
		expect(boot.comfyuiConfigured).toBe(false);
		const listed = connectionsSchema.parse(
			await (await fetch(`${f.api}/connections`, { headers })).json(),
		);
		expect(listed.comfyui).toEqual({
			available: false,
			workflows: [],
			connection: null,
			readiness: null,
		});
		const connect = await fetch(`${f.api}/connections`, {
			method: "POST",
			headers,
			body: JSON.stringify({ provider: "comfyui", workflow: COMFY_WORKFLOW }),
		});
		expect(connect.status).toBe(404);
		expect(await connect.json()).toEqual({
			error: { code: "COMFYUI_NOT_CONFIGURED" },
		});
		expect(f.comfy.paths).toEqual([]);
	} finally {
		await f.close();
	}
	expect(() =>
		loadConfig({
			PORTAL_MODE: "hosted",
			PORTAL_PUBLIC_URL: "https://hosted.example/tools",
			PORTAL_COMFYUI: "true",
		}),
	).toThrow("INVALID_COMFYUI_CONFIG");
	expect(() => loadConfig({ PORTAL_COMFYUI: "yes" })).toThrow(
		"INVALID_COMFYUI_CONFIG",
	);
	expect(loadConfig({ PORTAL_COMFYUI: "true" }).comfyui).toBe(true);
	expect(loadConfig({}).comfyui).toBe(false);
});

{
const workflow = "moss-image-sft-text.alpha.v1";
const connectionResponse = z.object({
	connection: z.object({
		connectionId: z.string(),
		protocolVersion: z.string(),
	}),
});
const stateResponse = z.object({
	connection: z.object({ connectionId: z.string() }).nullable(),
	comfyui: z.object({
		available: z.boolean(),
		canvasUrl: z.string().optional(),
		workflows: z.array(z.unknown()),
		connection: z.object({ connectionId: z.string() }).nullable(),
		readiness: z.unknown(),
	}),
});

async function fixture(enabled = true) {
	const root = await mkdtemp(join(tmpdir(), "comfy-readiness-"));
	const paths: string[] = [];
	const transport: ComfyTransport = {
		webSocket() {
			throw Error("READINESS_MUST_NOT_OPEN_SOCKET");
		},
		async fetch(url) {
			const path = url.slice(COMFY_ENDPOINT.length);
			paths.push(path);
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
							"ConditioningZeroOut",
							"EmptySD3LatentImage",
							"KSampler",
							"VAEDecode",
							"SaveImage",
							"ModelSamplingAuraFlow",
							"EmptyFlux2LatentImage",
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
			throw Error(`UNEXPECTED_PATH:${path}`);
		},
	};
	const app = await createPortal(
		loadConfig({
			PORTAL_MODE: "local",
			PORTAL_PORT: "0",
			PORTAL_STORAGE_PATH: root,
			PORTAL_COMFYUI: String(enabled),
		}),
		{
			comfyTransport: transport,
			comfyMeasureFinishing: async () => finishingProof(),
			comfyMeasureAssets: async (id) =>
				verifyMossAssetProof(
					{
						schema: "moss-runtime-file-sha256.v1",
						method: "server-file-stream-sha256",
						assets: mossWorkflowAssets(id ?? workflow).map(
							({ path: _path, ...asset }) => asset,
						),
					},
					id,
				),
		},
	);
	const address = await app.listen();
	const origin = `http://127.0.0.1:${address.port}`;
	async function session() {
		const response = await fetch(`${origin}/tools/api/auth/session`);
		const value = z
			.object({ csrfToken: z.string() })
			.parse(await response.json());
		const cookie = response.headers.get("set-cookie")?.split(";")[0] ?? "";
		return { cookie, csrf: value.csrfToken };
	}
	async function request(
		auth: Awaited<ReturnType<typeof session>>,
		method: string,
		path: string,
		payload?: unknown,
	) {
		return fetch(`${origin}/tools/api${path}`, {
			method,
			headers: {
				Cookie: auth.cookie,
				Origin: origin,
				"X-CSRF-Token": auth.csrf,
				"Content-Type": "application/json",
			},
			...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
		});
	}
	return {
		app,
		root,
		paths,
		session,
		request,
		async close() {
			await app.close();
			await rm(root, { recursive: true, force: true });
		},
	};
}

test("readiness coexists with credentialed connection without prompt dispatch", async () => {
	// Given an explicit local opt-in and two independent signed sessions.
	const f = await fixture();
	try {
		const a = await f.session();
		const b = await f.session();
		const credentialed = await f.request(a, "POST", "/connections", {
			baseUrl: "http://127.0.0.1:1/v1",
			apiKey: "private-test-key",
		});
		expect(credentialed.status).toBe(201);
		const previous = connectionResponse.parse(await credentialed.json());
		// When the owner explicitly verifies Comfy readiness.
		const response = await f.request(a, "POST", "/connections", {
			provider: "comfyui",
			workflow,
		});
		expect(response.status).toBe(201);
		const connected = connectionResponse
			.extend({ readiness: z.object({ state: z.string() }) })
			.parse(await response.json());
		// Then only read-only adapter probes ran and both protocols remain distinct.
		expect(connected.connection.protocolVersion).toBe(COMFY_PROTOCOL);
		expect(connected.readiness.state).toBe("READY");
		expect(f.paths).toEqual(["/system_stats", "/object_info"]);
		const state = stateResponse.parse(
			await (await f.request(a, "GET", "/connections")).json(),
		);
		expect(state.connection?.connectionId).toBe(
			previous.connection.connectionId,
		);
		expect(state.comfyui.connection?.connectionId).toBe(
			connected.connection.connectionId,
		);
		expect(
			(
				await f.request(
					b,
					"DELETE",
					`/connections/${connected.connection.connectionId}`,
				)
			).status,
		).toBe(404);
		const foreign = stateResponse.parse(
			await (await f.request(b, "GET", "/connections")).json(),
		);
		expect(foreign.comfyui.connection).toBeNull();
		expect((await f.request(a, "POST", "/auth/logout")).status).toBe(200);
		expect((await f.request(a, "GET", "/connections")).status).toBe(401);
	} finally {
		await f.close();
	}
});

test("configured disconnected Comfy exposes its canvas without probing transport", async () => {
	const f = await fixture();
	try {
		const auth = await f.session();
		const state = stateResponse.parse(
			await (await f.request(auth, "GET", "/connections")).json(),
		);
		expect(state.comfyui.canvasUrl).toBe(`${COMFY_ENDPOINT}/comfyart/`);
		expect(state.comfyui.connection).toBeNull();
		expect(f.paths).toEqual([]);
	} finally {
		await f.close();
	}
});

test("config off and malformed payloads cannot reach Comfy transport", async () => {
	// Given a local server without the explicit flag.
	const f = await fixture(false);
	try {
		const a = await f.session();
		// When disabled or browser-controlled connection payloads are submitted.
		expect(
			(
				await f.request(a, "POST", "/connections", {
					provider: "comfyui",
					workflow,
				})
			).status,
		).toBe(404);
		for (const extra of [
			{ baseUrl: "http://evil.invalid" },
			{ apiKey: "key" },
			{ graph: {} },
		])
			expect(
				(
					await f.request(a, "POST", "/connections", {
						provider: "comfyui",
						workflow,
						...extra,
					})
				).status,
			).toBe(422);
		// Then no outbound probe or misleading readiness appears.
		const state = stateResponse.parse(
			await (await f.request(a, "GET", "/connections")).json(),
		);
		expect(state.comfyui).toEqual({
			available: false,
			workflows: [],
			connection: null,
			readiness: null,
		});
		expect(f.paths).toEqual([]);
	} finally {
		await f.close();
	}
});

test("Comfy config rejects hosted and malformed opt-ins while preserving local AI", () => {
	// Given deployment boundaries; when config is parsed; then opt-in stays explicit.
	expect(loadConfig({}).comfyui).toBe(false);
	expect(
		loadConfig({ PORTAL_MODE: "personal", PORTAL_COMFYUI: "true" }).comfyui,
	).toBe(true);
	expect(() =>
		loadConfig({ PORTAL_MODE: "hosted", PORTAL_COMFYUI: "true" }),
	).toThrow("INVALID_COMFYUI_CONFIG");
	expect(() => loadConfig({ PORTAL_COMFYUI: "yes" })).toThrow(
		"INVALID_COMFYUI_CONFIG",
	);
	expect(
		loadConfig({ PORTAL_LOCAL_AI_CATALOG: "catalog.json" }).localAiCatalog,
	).toBeTruthy();
});

}
