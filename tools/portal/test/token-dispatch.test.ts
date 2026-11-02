import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encodePng } from "../../portrait/acceptance/src/png.ts";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import { MOSS_MALE_LORA, mossWorkflowAssets } from "../src/comfyui-assets.ts";
import {
	dispatchComfy,
	dispatchComfyTokenV2,
} from "../src/comfyui-dispatch.ts";
import {
	COMFY_ENDPOINT,
	createComfyProvider,
} from "../src/comfyui-provider.ts";
import { comfyWorkflowOf } from "../src/provider-models.ts";
import { resolveReferenceSource } from "../src/reference-contract.ts";
import { adaptSheet, generationSheetFromBytes, hash } from "../src/sources.ts";

// The same behavioral probe runs under bun:test and as an ordinary CLI module.
async function tokenDispatchRegression() {
	const { RUN_TMP } = process.env;
	const root = await mkdtemp(join(RUN_TMP ?? tmpdir(), "token-v2-"));
	const request = {
		schemaVersion: 2,
		requestId: "4b121053-9a97-40f1-96a5-25b57950b802",
		personId: "person-900001",
		inputMode: "token-only",
		sourceSelection: {
			kind: "intentional-absence",
			reason: "no-reference-available",
		},
		explicitEdits: [],
		provider: "comfyui",
		providerModel: "comfyui:moss-image-sft-style-male.v1",
		size: "340x510",
		faceMode: { kind: "unique", variantId: null },
	} as const;
	const image = encodePng({
		width: 2,
		height: 2,
		pixels: new Uint8Array(16).fill(255),
	});
	const tokenBytes = Buffer.from(
		JSON.stringify({
			schemaVersion: 1,
			personId: request.personId,
			characterId: "K900001",
			name: "reference-plan-no-photo",
			artProposal: {
				hair: "wine hair",
				upper: "dark blue work jacket",
				lower: "trousers",
				footwear: "boots",
			},
			image: { sha256: hash(image) },
			textToImage: { priorImageSHA: hash(image) },
		}),
	);
	const detailBytes = Buffer.from(
		JSON.stringify({
			id: request.personId,
			characterId: "K900001",
			name: "reference-plan-no-photo",
			detailRoute: `/people/${request.personId}`,
		}),
	);
	const serverEvidence = {
		status: "available",
		recipient: { personId: request.personId, characterId: "K900001" },
		tokenBytes,
		tokenSHA256: hash(tokenBytes),
		recipientImage: null,
	};
	const source = resolveReferenceSource(request, serverEvidence);
	assert.equal(source.status, "intentional-absence");
	const template = createTransportFixture();
	const adapted = adaptSheet(
		generationSheetFromBytes(detailBytes, tokenBytes, null),
		template,
		request.requestId,
		request.faceMode,
		request.providerModel,
	);
	assert.equal(adapted.provenance.original.image, null);
	assert.equal(adapted.provenance.original.token, hash(tokenBytes));
	assert.equal(adapted.projection.sourceSHA, hash(adapted.candidate.lookBytes));
	assert.deepEqual(
		adapted.candidate.referenceImages.map((r) => r.role),
		["drawing-technique-only", "framing-only"],
	);
	const rendering = JSON.parse(JSON.stringify(adapted.projection.rendering));
	assert.equal(rendering.slots.face.description.status, "unknown");
	assert.equal(rendering.slots.outfit.upper.value, "dark blue work jacket");
	let graph: Record<
		string,
		{ class_type: string; inputs: Record<string, unknown> }
	> = {};
	let promptCalls = 0;
	let generateCalls = 0;
	let closed = 0;
	const socket = new EventTarget();
	const provider = createComfyProvider({
		authorize: (start) => start(),
		measureAssets: async (workflow) => ({
			schema: "moss-runtime-file-sha256.v1",
			method: "server-file-stream-sha256",
			assets: mossWorkflowAssets(workflow ?? "").map(
				({ path: _path, ...asset }) => asset,
			),
		}),
		transport: {
			webSocket: () => {
				queueMicrotask(() => socket.dispatchEvent(new Event("open")));
				return {
					addEventListener: socket.addEventListener.bind(socket),
					removeEventListener: socket.removeEventListener.bind(socket),
					close: () => {
						closed++;
					},
				};
			},
			fetch: async (url, init) => {
				const path = url.slice(COMFY_ENDPOINT.length);
				if (path === "/system_stats")
					return Response.json({ system: { comfyui_version: "offline" } });
				if (path === "/object_info")
					return Response.json(
						Object.fromEntries(
							[
								"UNETLoader",
								"CLIPLoader",
								"VAELoader",
								"CLIPTextEncode",
								"KSampler",
								"VAEDecode",
								"SaveImage",
								"EmptyFlux2LatentImage",
								"LoraLoaderModelOnly",
							].map((name) => [
								name,
								{ input: { required: {} }, output_node: name === "SaveImage" },
							]),
						),
					);
				if (path === "/prompt") {
					promptCalls++;
					graph = JSON.parse(String(init.body)).prompt;
					throw Error("OFFLINE_STOP_BEFORE_EXECUTION");
				}
				throw Error(`Unexpected offline transport path: ${path}`);
			},
		},
	});
	const countedProvider = {
		...provider,
		generate: (...args: Parameters<typeof provider.generate>) => {
			generateCalls++;
			return provider.generate(...args);
		},
	};
	try {
		const connection = await provider.connect("moss-image-sft-style-male.v1");
		const options = {
			provider: countedProvider,
			connection,
			serverEvidence,
			detailBytes,
			template,
		};
		const cases: [
			string,
			unknown,
			unknown,
			typeof adapted.projection | undefined,
		][] = [
			["missing-evidence", request, undefined, undefined],
			["failed", request, { status: "failed", reason: "not-found" }, undefined],
			["unresolved", request, { status: "unresolved" }, undefined],
			["forged-resolved-label", request, source, undefined],
			[
				"forged-token-pin",
				request,
				{ ...serverEvidence, tokenSHA256: "b".repeat(64) },
				undefined,
			],
			[
				"wrong-person",
				{ ...request, personId: "person-900002" },
				serverEvidence,
				undefined,
			],
			[
				"wrong-token-identity",
				request,
				{
					...serverEvidence,
					recipient: { ...serverEvidence.recipient, characterId: "K900002" },
				},
				undefined,
			],
			[
				"image-present",
				request,
				{
					...serverEvidence,
					recipientImage: {
						...serverEvidence.recipient,
						sourceSHA256: hash(image),
						bytes: image,
					},
				},
				undefined,
			],
			[
				"acquired",
				{
					...request,
					inputMode: "reference-img2img",
					sourceSelection: {
						kind: "selected",
						personId: request.personId,
						sourceSHA256: hash(image),
					},
				},
				{
					...serverEvidence,
					recipientImage: {
						...serverEvidence.recipient,
						sourceSHA256: hash(image),
						bytes: image,
					},
				},
				undefined,
			],
			[
				"public-state-forgery",
				{ ...request, sourceStatus: "intentional-absence" },
				serverEvidence,
				undefined,
			],
			[
				"wrong-workflow",
				{ ...request, providerModel: "comfyui:moss-image-sft-style-lora.v1" },
				serverEvidence,
				undefined,
			],
			[
				"stale-source-sha",
				request,
				serverEvidence,
				{ ...adapted.projection, sourceSHA: hash(image) },
			],
			[
				"forged-rendering",
				request,
				serverEvidence,
				{ ...adapted.projection, text: "forged tokens" },
			],
		];
		const rejected = [];
		for (const [name, publicInput, evidence, projection] of cases) {
			const directory = await mkdtemp(join(root, `${name}-`));
			await assert.rejects(
				dispatchComfyTokenV2(
					{
						request: publicInput,
						seed: 421,
						...(projection ? { projection } : {}),
					},
					{ ...options, directory, serverEvidence: evidence },
				),
			);
			assert.equal(generateCalls, 0, name);
			assert.equal(promptCalls, 0, name);
			assert.deepEqual(await readdir(directory), [], name);
			rejected.push({
				name,
				providerGenerateCalls: generateCalls,
				promptCalls,
			});
		}
		const directory = await mkdtemp(join(root, "valid-"));
		await assert.rejects(
			dispatchComfyTokenV2(
				{ request, seed: 421, projection: adapted.projection },
				{ ...options, directory },
			),
			{ code: "COMFY_GENERATION_FAILED" },
		);
		assert.equal(generateCalls, 1);
		assert.equal(promptCalls, 1);
		assert.equal(closed, 1);
		const receipt = JSON.parse(
			await readFile(join(directory, "candidate.png.request.json"), "utf8"),
		);
		assert.deepEqual(receipt.tokenSource, {
			schemaVersion: 2,
			inputMode: "token-only",
			sourceStatus: "intentional-absence",
			personId: request.personId,
			characterId: "K900001",
			tokenSHA256: hash(tokenBytes),
			derivedLookSHA256: hash(adapted.candidate.lookBytes),
			recipientImageSHA256: null,
			styleAdapterSHA256: MOSS_MALE_LORA.sha256,
		});
		assert.deepEqual(receipt.referenceImages, []);
		assert.deepEqual(receipt.referenceHashes, []);
		assert.equal(receipt.sourceSHA, adapted.projection.sourceSHA);
		assert.equal(receipt.promptSHA, hash(Buffer.from(receipt.prompt)));
		assert.equal(receipt.prompt.includes(hash(image)), false);
		assert.equal(graph["6"]?.class_type, "EmptyFlux2LatentImage");
		assert.deepEqual(Reflect.get(graph["7"]?.inputs ?? {}, "latent_image"), [
			"6",
			0,
		]);
		assert.equal(Reflect.get(graph["7"]?.inputs ?? {}, "denoise"), 1);
		assert.equal(
			Reflect.get(graph["10"]?.inputs ?? {}, "lora_name"),
			MOSS_MALE_LORA.filename,
		);
		assert.equal(Reflect.get(graph["10"]?.inputs ?? {}, "strength_model"), 1);
		assert.equal(
			Object.values(graph).some((n) =>
				["LoadImage", "VAEEncode"].includes(n.class_type),
			),
			false,
		);
		assert.match(
			comfyWorkflowOf(request.providerModel)?.limitations ?? "",
			/HOLD/,
		);
		const legacyReceipts = [];
		for (const workflow of [
			"moss-image-sft-style-male.v1",
			"moss-image-sft-style-male.alpha.v1",
		] as const) {
			const legacyDirectory = await mkdtemp(join(root, "legacy-"));
			await assert.rejects(
				dispatchComfy(
					{
						projection: adapted.projection,
						requestId: request.requestId,
						providerModel: `comfyui:${workflow}`,
						seed: 421,
					},
					{
						directory: legacyDirectory,
						connection: { ...connection, workflow },
						provider: {
							...provider,
							generate: async () => {
								throw Error("OFFLINE_LEGACY_STOP");
							},
						},
					},
				),
				{ code: "COMFY_GENERATION_FAILED" },
			);
			const legacy = JSON.parse(
				await readFile(
					join(legacyDirectory, "candidate.png.request.json"),
					"utf8",
				),
			);
			const { tokenSource: _source, ...expected } = receipt;
			assert.deepEqual(legacy, {
				...expected,
				workflow,
				model: `comfyui:${workflow}`,
			});
			assert.equal("doneClaim" in legacy, false);
			assert.equal("explicitAbsenceV2Mapping" in legacy, false);
			legacyReceipts.push({ workflow, tokenSource: null, doneClaim: null });
		}
		return {
			rejected,
			tokenSource: receipt.tokenSource,
			graph,
			legacyReceipts,
			promptCalls,
			generateCalls,
			closed,
			realProviderCalls: 0,
		};
	} finally {
		await rm(root, { recursive: true, force: true });
	}
}

const { TASK4_OUTSIDE_TEST } = process.env;
if (TASK4_OUTSIDE_TEST === "1") {
	console.log(JSON.stringify(await tokenDispatchRegression(), null, 2));
} else {
	const { test } = await import("bun:test");
	test(
		"v2 token dispatch resolves authority before storage and preserves legacy dispatch",
		tokenDispatchRegression,
	);
}
