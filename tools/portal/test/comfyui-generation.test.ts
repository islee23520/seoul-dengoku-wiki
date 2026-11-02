import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import {
	mossWorkflowAssets,
	verifyMossAssetProof,
} from "../src/comfyui-assets.ts";
import {
	COMFY_ENDPOINT,
	type ComfyTransport,
} from "../src/comfyui-provider.ts";
import { loadConfig } from "../src/config.ts";
import { createEvaluationStore } from "../src/evaluations.ts";
import { createPortal } from "../src/server.ts";
import { hash } from "../src/sources.ts";
import {
	finishingPngFixture,
	finishingProof,
} from "./comfyui-finishing-fixture.ts";

const workflow = "moss-image-sft-text.alpha.v1";
const images = finishingPngFixture();
type Mode = "ok" | "close" | "failure" | "revoke";
async function fixture() {
	const root = await realpath(
		await mkdtemp(join(tmpdir(), "portal-comfy-generation-")),
	);
	const canonical = createTransportFixture();
	const image = new Uint8Array(images.finishedBytes);
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
	const detail = Buffer.from(
		JSON.stringify({
			id: "person-1003",
			name: "Fixture 1003",
			detailRoute: "/people/person-1003",
			familyTree: { personId: "K1003" },
		}),
	);
	const look = JSON.parse(
		Buffer.from(canonical.candidate.lookBytes).toString(),
	);
	const token = Buffer.from(
		JSON.stringify({
			...look,
			personId: "person-1003",
			characterId: "K1003",
			name: "Fixture 1003",
			identity: { characterId: "K1003", name: "Fixture 1003" },
			image: { sha256: hash(image) },
			generationContract: { model: "gpt-image-2.5" },
		}),
	);
	let mode: Mode = "ok";
	let revoke = async () => {};
	let submitted = 0;
	let socketClosed = false;
	const socket = new EventTarget();
	const prompts = new Map<
		string,
		Record<string, { inputs: Record<string, unknown> }>
	>();
	const nodes = [
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
	];
	const transport: ComfyTransport = {
		webSocket(url) {
			expect(
				url.startsWith(`${COMFY_ENDPOINT.replace("http:", "ws:")}/ws?`),
			).toBe(true);
			queueMicrotask(() => socket.dispatchEvent(new Event("open")));
			return {
				addEventListener: socket.addEventListener.bind(socket),
				removeEventListener: socket.removeEventListener.bind(socket),
				close() {
					socketClosed = true;
				},
			};
		},
		async fetch(url, init) {
			expect(url.startsWith(COMFY_ENDPOINT)).toBe(true);
			expect(init.redirect).toBe("error");
			const path = url.slice(COMFY_ENDPOINT.length);
			if (path === "/system_stats")
				return Response.json({ system: { comfyui_version: "0.42.0" } });
			if (path === "/object_info")
				return Response.json(
					Object.fromEntries(
						nodes.map((n) => [
							n,
							{ input: { required: {} }, output_node: n === "SaveImage" },
						]),
					),
				);
			if (path === "/prompt") {
				submitted++;
				const id = randomUUID();
				prompts.set(id, JSON.parse(String(init.body)).prompt);
				if (mode === "revoke") await revoke();
				if (mode === "close") socket.dispatchEvent(new Event("close"));
				else
					socket.dispatchEvent(
						new MessageEvent("message", {
							data: JSON.stringify({
								type: mode === "failure" ? "execution_error" : "executing",
								data: { prompt_id: id, node: null },
							}),
						}),
					);
				return Response.json({ prompt_id: id, node_errors: {} });
			}
			if (path.startsWith("/history/")) {
				const id = path.slice(9),
					graph = prompts.get(id);
				if (!graph) throw Error("UNKNOWN_PROMPT");
				return Response.json({
					[id]: {
						prompt: [1, id, graph, {}, ["9"]],
						status: { completed: true, status_str: "success" },
						outputs: Object.fromEntries(
							["9", "11", "15", "16"].map((n) => [
								n,
								{
									images: [
										{
											filename: `${Reflect.get(graph[n]?.inputs ?? {}, "filename_prefix")}_00001_.png`,
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
				const filename = new URL(url).searchParams.get("filename") ?? "";
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
			throw Error(`UNEXPECTED_PATH:${path}`);
		},
	};
	const app = await createPortal(
		loadConfig({
			PORTAL_MODE: "local",
			PORTAL_PORT: "0",
			PORTAL_STORAGE_PATH: root,
			PORTAL_COMFYUI: "true",
		}),
		{
			template,
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
		const value = (await response.json()) as { csrfToken: string };
		return {
			Cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "",
			Origin: origin,
			"X-CSRF-Token": value.csrfToken,
			"Content-Type": "application/json",
		};
	}
	async function request(
		headers: Record<string, string>,
		path: string,
		payload?: unknown,
		method = payload === undefined ? "GET" : "POST",
	) {
		return fetch(`${origin}/tools/api${path}`, {
			headers,
			method,
			...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
		});
	}
	const headers = await session();
	const sheetResponse = await request(headers, "/sheets", {
		detailBase64: detail.toString("base64"),
		tokenBase64: token.toString("base64"),
		imageBase64: Buffer.from(image).toString("base64"),
	});
	const sheet = (await sheetResponse.json()) as { sheetId: string };
	expect(sheetResponse.status).toBe(201);
	const connected = await request(headers, "/connections", {
		provider: "comfyui",
		workflow,
	});
	const { connection } = (await connected.json()) as {
		connection: { connectionId: string };
	};
	expect(connected.status).toBe(201);
	const payload = () => ({
		requestId: randomUUID(),
		sheetId: sheet.sheetId,
		connectionId: connection.connectionId,
		providerModel: `comfyui:${workflow}`,
		size: "340x510",
		seed: 421,
		faceMode: { kind: "unique", variantId: null },
	});
	return {
		root,
		request,
		headers,
		session,
		payload,
		connection,
		get submitted() {
			return submitted;
		},
		get socketClosed() {
			return socketClosed;
		},
		mode(value: Mode) {
			mode = value;
		},
		onRevoke(fn: () => Promise<void>) {
			revoke = fn;
		},
		async close() {
			await app.close();
			await rm(root, { recursive: true, force: true });
		},
	};
}

test("Comfy generation seals genuine adapter evidence and rejects retained artifact tampering", async () => {
	const f = await fixture();
	try {
		const payload = f.payload();
		const response = await f.request(f.headers, "/generations", payload);
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			job: {
				id: payload.requestId,
				state: "HOLD",
				reviewStatus: "HOLD",
				metrics: { width: 340, height: 510 },
			},
		});
		const dir = join(f.root, "1", "jobs", payload.requestId);
		const receipt = JSON.parse(
			await readFile(join(dir, "candidate.png.receipt.json"), "utf8"),
		);
		expect(receipt).toMatchObject({
			provider: "comfyui",
			workflow,
			status: "draft",
			reviewStatus: "HOLD",
			referenceHashes: [],
		});
		expect(receipt.model).toBeUndefined();
		const resultPath = `/jobs/${payload.requestId}/result`;
		const store = createEvaluationStore({
			ownerRoot: join(f.root, "1"),
			ownerId: "1",
		});
		await store.sealResult(payload.requestId);
		const sealed = await f.request(f.headers, resultPath);
		expect(await sealed.json()).toMatchObject({
			result: { approval: "NONE", reviewStatus: "HOLD" },
		});
		expect(sealed.status).toBe(200);
		for (const name of [
			"candidate.png",
			"provider-canonical.receipt.json",
			"provider-source.png",
			"provider-native.png",
			"comfy-request.json",
			"comfy-history.json",
			"comfy-prompt.txt",
			"projection.txt",
			"source-bytes.json",
		]) {
			const file = join(dir, name),
				original = await readFile(file);
			await writeFile(file, Buffer.concat([original, Buffer.from("tamper")]));
			const invalid = await f.request(f.headers, resultPath);
			if (name === "comfy-prompt.txt") {
				// The compiled prompt file must be bound independently of graph text.
				expect(invalid.status).toBe(409);
			} else expect(invalid.status).toBe(409);
			await writeFile(file, original);
		}
		expect((await f.request(f.headers, resultPath)).status).toBe(200);
		expect(f.submitted).toBe(1);
		expect(f.socketClosed).toBe(true);
	} finally {
		await f.close();
	}
});

test("Comfy rejects malformed receipts and tampered artifacts before first publication", async () => {
	const f = await fixture();
	try {
		const payload = f.payload();
		expect((await f.request(f.headers, "/generations", payload)).status).toBe(
			200,
		);
		const dir = join(f.root, "1", "jobs", payload.requestId);
		const receiptPath = join(dir, "candidate.png.receipt.json");
		const receiptBytes = await readFile(receiptPath);
		const receipt = JSON.parse(receiptBytes.toString());
		const store = createEvaluationStore({
			ownerRoot: join(f.root, "1"),
			ownerId: "1",
		});
		for (const changed of [
			{ ...receipt, provider: "gpt" },
			{ ...receipt, workflow: "moss-image-sft-style-lora.alpha.v1" },
			{ ...receipt, status: 200 },
			{ ...receipt, reviewStatus: "candidate-unreviewed" },
			{ ...receipt, referenceHashes: ["a".repeat(64)] },
			{ ...receipt, responseSHA: "a".repeat(64) },
			{ ...receipt, promptSHA: "a".repeat(64) },
			{ ...receipt, sourceSHA: "a".repeat(64) },
			{
				...receipt,
				transformation: {
					...receipt.transformation,
					canonicalReceiptSHA: "a".repeat(64),
				},
			},
			{
				...receipt,
				transformation: { ...receipt.transformation, width: 1024 },
			},
		]) {
			await writeFile(receiptPath, JSON.stringify(changed));
			await expect(store.sealResult(payload.requestId)).rejects.toThrow(
				"RESULT_EVIDENCE_MISMATCH",
			);
		}
		await writeFile(receiptPath, receiptBytes);
		for (const name of [
			"candidate.png",
			"provider-canonical.receipt.json",
			"provider-source.png",
			"provider-native.png",
			"comfy-request.json",
			"comfy-history.json",
			"comfy-prompt.txt",
			"projection.txt",
			"source-bytes.json",
		]) {
			const file = join(dir, name),
				original = await readFile(file);
			await writeFile(file, Buffer.concat([original, Buffer.from("tamper")]));
			await expect(store.sealResult(payload.requestId)).rejects.toThrow(
				/RESULT_|SOURCE_/,
			);
			await writeFile(file, original);
		}
		const retainedRequest = join(dir, "request-payload.json"),
			original = await readFile(retainedRequest);
		for (const changed of [
			{ ...payload, size: "1024x1536" },
			{ ...payload, providerModel: "gpt-image-2.5-sunburst" },
			{ ...payload, seed: 422 },
		]) {
			await writeFile(retainedRequest, JSON.stringify(changed));
			await expect(store.sealResult(payload.requestId)).rejects.toThrow(
				"RESULT_EVIDENCE_MISMATCH",
			);
		}
		await writeFile(retainedRequest, original);
	} finally {
		await f.close();
	}
});

test("generation rejects provider, workflow, size, foreign and revoked authority before submission", async () => {
	const f = await fixture();
	try {
		for (const extra of [
			{
				providerModel: "gpt-image-2.5-sunburst",
				size: "1024x1536",
				seed: undefined,
			},
			{ providerModel: "comfyui:moss-image-sft-style-lora.alpha.v1" },
			{ size: "1024x1536" },
			{ providerModel: "comfyui:zimage-turbo-text-draft.v1" },
			{ seed: -1 },
			{ graph: {} },
			{ baseUrl: "http://evil.invalid" },
		]) {
			const response = await f.request(f.headers, "/generations", {
				...f.payload(),
				...extra,
			});
			expect([409, 422]).toContain(response.status);
		}
		const foreign = await f.session();
		expect((await f.request(foreign, "/generations", f.payload())).status).toBe(
			404,
		);
		expect(
			(
				await f.request(
					f.headers,
					`/connections/${f.connection.connectionId}`,
					undefined,
					"DELETE",
				)
			).status,
		).toBe(200);
		expect(
			(await f.request(f.headers, "/generations", f.payload())).status,
		).toBe(409);
		expect(f.submitted).toBe(0);
	} finally {
		await f.close();
	}
});

test.each(["close", "failure", "revoke"] as const)(
	"Comfy %s preserves truthful terminal state and closes its socket",
	async (mode) => {
		const f = await fixture();
		try {
			f.mode(mode);
			f.onRevoke(async () => {
				await f.request(
					f.headers,
					`/connections/${f.connection.connectionId}`,
					undefined,
					"DELETE",
				);
			});
			const response = await f.request(f.headers, "/generations", f.payload());
			expect(response.status).toBe(200);
			expect(await response.json()).toMatchObject({
				job: {
					state: mode === "failure" ? "FAILED" : "UNKNOWN",
					imageUrl: null,
				},
			});
			expect(f.socketClosed).toBe(true);
		} finally {
			await f.close();
		}
	},
);
