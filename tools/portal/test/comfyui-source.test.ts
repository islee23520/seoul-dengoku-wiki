import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dispatchComfySourceV2 } from "../src/comfyui-dispatch.ts";
import {
	COMFY_SOURCE_RECIPE,
	comfyReceiptSchema,
	comfySourceReceiptSchema,
	prepareComfySource,
	verifyComfyEvidence,
} from "../src/comfyui-provider.ts";
import { verifyComfySourceResult } from "../src/evaluations.ts";
import { COMFY_SOURCE_WORKFLOW } from "../src/provider-models.ts";
import { hash } from "../src/sources.ts";
import { sourceFixture, sourceTransport } from "./comfyui-source-fixture.ts";

test("source graph uploads exact native PNG, encodes the pinned VAE and binds history and delivery", async () => {
	for (const denoise of COMFY_SOURCE_RECIPE.denoises) {
		const sourceInput = { ...sourceFixture(), denoise };
		const fixture = sourceTransport();
		const connection = await fixture.provider.connect(COMFY_SOURCE_WORKFLOW);
		const result = await fixture.provider.generate(connection, sourceInput);
		const prepared = prepareComfySource(sourceInput);
		const receipt = comfySourceReceiptSchema.parse(
			JSON.parse(result.canonicalReceiptBytes.toString()),
		);
		const submission = fixture.prompts[0],
			upload = fixture.uploads[0];
		assert(submission && upload);
		const graph = submission.prompt;
		expect(fixture.uploads).toHaveLength(1);
		expect(upload.overwrite).toBe("false");
		expect(hash(upload.bytes)).toBe(hash(prepared.native.rgbBytes));
		expect(graph["12"]).toEqual({
			class_type: "LoadImage",
			inputs: { image: upload.name },
		});
		expect(graph["6"]).toEqual({
			class_type: "VAEEncode",
			inputs: { pixels: ["12", 0], vae: ["3", 0] },
		});
		expect(graph["3"]?.inputs).toEqual({
			vae_name: "flux2-vae_small.safetensors",
		});
		expect(graph["7"]?.inputs).toMatchObject({
			latent_image: ["6", 0],
			seed: 152995270030802,
			denoise,
			steps: 25,
			cfg: 2.5,
			sampler_name: "er_sde",
			scheduler: "simple",
		});
		expect(
			Object.values(graph).some(
				(node) =>
					node.class_type.startsWith("Empty") &&
					node.class_type.includes("Latent"),
			),
		).toBe(false);
		expect(graph["4"]?.inputs["text"]).toBe(prepared.compiled.text);
		expect(receipt.sourceInit.latentGeometry).toEqual([1, 128, 96, 64]);
		expect(receipt.sourceInit.originalSHA).toBe(hash(prepared.originalBytes));
		expect(receipt.promptCompiler).toBe("source-preservation-edit.v1");
		expect(comfyReceiptSchema.safeParse(receipt).success).toBe(false);
		const evidence = {
			...result,
			receipt,
			sourceInput,
			conditioningBytes: prepared.native.rgbBytes,
		};
		expect(() => verifyComfyEvidence(evidence)).not.toThrow();
		const alteredRequest = JSON.parse(result.requestBytes.toString());
		alteredRequest.prompt["6"] = {
			class_type: "EmptyFlux2LatentImage",
			inputs: { width: 1024, height: 1536, batch_size: 1 },
		};
		const alteredHistory = JSON.parse(result.historyBytes.toString());
		alteredHistory[receipt.promptId].prompt[2] = alteredRequest.prompt;
		const requestBytes = Buffer.from(JSON.stringify(alteredRequest));
		const historyBytes = Buffer.from(JSON.stringify(alteredHistory));
		expect(() =>
			verifyComfyEvidence({
				...evidence,
				requestBytes,
				historyBytes,
				receipt: {
					...receipt,
					requestSHA: hash(requestBytes),
					historySHA: hash(historyBytes),
				},
			}),
		).toThrow("COMFY_EVIDENCE_MISMATCH");
		expect(
			verifyComfySourceResult({
				...evidence,
				deliveryBytes: result.bytes,
				deliveryReceiptBytes: result.receiptBytes,
			}).reviewStatus,
		).toBe("HOLD");
		for (const change of [
			{ ...receipt, promptCompiler: "comfy-portrait-prompt.v3" },
			{
				...receipt,
				sourceInit: {
					...receipt.sourceInit,
					latentGeometry: [1, 16, 192, 128],
				},
			},
			{
				...receipt,
				sourceInit: { ...receipt.sourceInit, nativeRGBSHA: "a".repeat(64) },
			},
		])
			expect(() =>
				verifyComfyEvidence({ ...evidence, receipt: change as typeof receipt }),
			).toThrow("COMFY_EVIDENCE_MISMATCH");
		expect(() =>
			verifyComfyEvidence({
				...evidence,
				sourceInput: {
					...sourceInput,
					serverEvidence: { status: "unresolved" },
				},
			}),
		).toThrow();
		expect(fixture.closed()).toBe(1);
	}
});

test("source upload conflicts reject before prompt; stale graphs and encode errors never fallback", async () => {
	for (const mode of [
		"upload-name",
		"upload-hash",
		"stale-history",
		"empty-latent",
		"encode-error",
	] as const) {
		const fixture = sourceTransport(mode);
		const connection = await fixture.provider.connect(COMFY_SOURCE_WORKFLOW);
		await expect(
			fixture.provider.generate(connection, sourceFixture()),
		).rejects.toThrow();
		expect(fixture.prompts).toHaveLength(mode.startsWith("upload") ? 0 : 1);
		expect(
			fixture.paths.filter((path) => path === "/upload/image"),
		).toHaveLength(1);
	}
	const fixture = sourceTransport("schema");
	await expect(fixture.provider.connect(COMFY_SOURCE_WORKFLOW)).rejects.toThrow(
		"COMFY_CONNECTION_NOT_READY",
	);
	expect(fixture.uploads).toHaveLength(0);
});

test("strict server source boundary rejects forged, missing and conflicting authority before artifacts", async () => {
	const fixture = sourceTransport();
	const connection = await fixture.provider.connect(COMFY_SOURCE_WORKFLOW);
	const source = sourceFixture();
	const directory = await mkdtemp(join(tmpdir(), "source-negative-"));
	try {
		for (const serverEvidence of [
			undefined,
			{ status: "acquired" },
			{ status: "failed", reason: "network" },
			{ status: "unresolved" },
			{ ...source.serverEvidence, recipientImage: null },
			{ ...source.serverEvidence, tokenSHA256: "a".repeat(64) },
			{
				...source.serverEvidence,
				recipientImage: {
					...source.serverEvidence.recipientImage,
					sourceSHA256: "a".repeat(64),
				},
			},
		])
			await expect(
				dispatchComfySourceV2(
					{ request: source.request, denoise: 0.45 },
					{ directory, provider: fixture.provider, connection, serverEvidence },
				),
			).rejects.toThrow();
		for (const request of [
			{ ...source.request, acquired: true },
			{ ...source.request, inputMode: "token-only" },
			{
				...source.request,
				providerModel: "comfyui:moss-image-sft-text.alpha.v1",
			},
			{
				...source.request,
				explicitEdits: [
					{ field: "face.jaw", operation: "replace", value: "round" },
				],
			},
		])
			await expect(
				dispatchComfySourceV2(
					{ request, denoise: 0.45 },
					{
						directory,
						provider: fixture.provider,
						connection,
						serverEvidence: source.serverEvidence,
					},
				),
			).rejects.toThrow();
		for (const denoise of [0, 1, 0.5])
			await expect(
				fixture.provider.generate(connection, { ...source, denoise }),
			).rejects.toThrow();
		for (const extra of [
			{ graph: {} },
			{ receipt: { promptCompiler: "comfy-portrait-prompt.v3" } },
		])
			await expect(
				fixture.provider.generate(connection, { ...source, ...extra }),
			).rejects.toThrow();
		await expect(
			fixture.provider.generate(connection, {
				requestId: source.request.requestId,
				workflow: COMFY_SOURCE_WORKFLOW,
				text: "legacy",
				textSHA: "a".repeat(64),
				sourceSHA: "a".repeat(64),
				seed: 1,
			}),
		).rejects.toThrow("REFERENCE_NOT_ACQUIRED");
		expect(await readdir(directory)).toEqual([]);
		expect(fixture.uploads).toHaveLength(0);
		expect(fixture.prompts).toHaveLength(0);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});

test("source dispatch persists exact original, transform and source-specific receipts", async () => {
	const fixture = sourceTransport();
	const connection = await fixture.provider.connect(COMFY_SOURCE_WORKFLOW);
	const source = sourceFixture();
	const directory = await mkdtemp(join(tmpdir(), "source-positive-"));
	try {
		const result = await dispatchComfySourceV2(source, {
			directory,
			provider: fixture.provider,
			connection,
			serverEvidence: source.serverEvidence,
		});
		expect(JSON.parse(result.receiptBytes.toString()).sourceInit.denoise).toBe(
			0.45,
		);
		expect(await readdir(directory)).toContain("reference-original.png");
		expect(fixture.prompts).toHaveLength(1);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});
