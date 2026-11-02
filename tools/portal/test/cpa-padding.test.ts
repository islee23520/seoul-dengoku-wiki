import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
	decodePng,
	encodePng,
} from "../../portrait/acceptance/src/png.ts";
import {
	cpaPadding,
	cpaPaddingSchema,
	validateCpaCanvas,
} from "../../portrait/generator/src/cpa-padding.ts";
import { prepareReferenceEditConditions } from "../../portrait/generator/src/preflight.ts";
import { portraitDeliveryV2 } from "../src/portrait-size.ts";
import { referenceGenerationRequestSchema } from "../src/reference-contract.ts";
import { transformReferencePng } from "../src/reference-transform.ts";
import { finishingPngFixture } from "./comfyui-finishing-fixture.ts";
import { workbenchFixture } from "./reference-workbench-fixture.ts";

test("explicit CPA padding binds HTTP multipart, returned canvas, delivery and replay", async () => {
	const f = await workbenchFixture();
	try {
		const headers = await f.session();
		const post = async (path: string, body: unknown) => {
			const response = await fetch(f.api + path, {
				method: "POST",
				headers,
				body: JSON.stringify(body),
			});
			return {
				status: response.status,
				body: (await response.json()) as {
					connection?: { connectionId: string };
					job?: { state: string };
					error?: { code: string };
				},
			};
		};
		const connection = await post("/connections", {
			baseUrl: "http://127.0.0.1:1/v1",
			apiKey: "offline-workbench-key",
		});
		const request = {
			schemaVersion: 2,
			generationProfile: "cpa340-padded-v1",
			requestId: randomUUID(),
			connectionId: connection.body.connection?.connectionId,
			personId: "person-0998",
			inputMode: "reference-img2img",
			sourceSelection: {
				kind: "selected",
				personId: "person-0998",
				sourceSHA256: f.state.pin,
			},
			explicitEdits: [],
			provider: "openai-compatible",
			providerModel: "gpt-image-2.5-sunburst",
			size: "340x510",
			faceMode: { kind: "unique", variantId: null },
		};
		const content = finishingPngFixture(340, 510).finishedBytes;
		f.state.cpaBytes = transformReferencePng(
			content,
			"native",
			"cpa340-padded-v1",
		).rgbaBytes;
		expect((await post("/generations", request)).body.job?.state).toBe("HOLD");
		expect(f.calls[0]).toMatchObject({
			size: "640x1024",
			imageDimensions: [640, 1024],
		});
		const imageResponse = await fetch(
			`${f.api}/jobs/${request.requestId}/image`,
			{ headers },
		);
		const delivered = decodePng(
			new Uint8Array(await imageResponse.arrayBuffer()),
		);
		expect([delivered.width, delivered.height]).toEqual([340, 510]);
		expect(delivered.pixels).toEqual(decodePng(content).pixels);
		expect(
			(await fetch(`${f.api}/jobs/${request.requestId}/result`, { headers }))
				.status,
		).toBe(200);
		expect((await post("/generations", request)).status).toBe(200);
		expect(f.calls).toHaveLength(1);
		expect(
			(
				await post("/generations", {
					...request,
					generationProfile: "native340-v1",
				})
			).body.error?.code,
		).toBe("REQUEST_CONFLICT");
		const dir = join(f.directory, "storage", "1", "jobs", request.requestId);
		const canonicalBytes = await readFile(
			join(dir, "provider-canonical.receipt.json"),
		);
		const canonical = JSON.parse(canonicalBytes.toString());
		expect(canonical.generationGeometry).toEqual(cpaPadding);
		console.log(
			"CPA_PADDING_CAPTURE",
			JSON.stringify({
				requestId: request.requestId,
				profile: request.generationProfile,
				geometry: canonical.generationGeometry,
				multipart: f.calls[0],
				returnedCanvas: canonical.actualCanvas,
				delivery: [delivered.width, delivered.height],
				sourceSHA256: canonical.sourceSHA256,
				requestWireSHA256: canonical.wire.sha256,
				returnedSHA256: canonical.responseSHA,
				offlineModelAttestation: canonical.modelAttestation,
				replayProviderCalls: f.calls.length,
			}),
		);
		const native = transformReferencePng(f.image, "native", "cpa340-padded-v1");
		const conditions = {
			schemaVersion: 2,
			generationProfile: request.generationProfile,
			generationGeometry: cpaPadding,
			inputMode: request.inputMode,
			compiler: canonical.compiler,
			model: canonical.model,
			prompt: canonical.prompt,
			promptSHA256: canonical.promptSHA256,
			sourceSHA256: canonical.sourceSHA256,
			transformSHA256: canonical.transformSHA256,
			resolvedIntentSHA256: canonical.resolvedIntentSHA256,
			referenceHashes: canonical.referenceHashes,
			orderedImageBytes: [native.rgbaBytes],
		};
		expect(() => prepareReferenceEditConditions(conditions)).not.toThrow();
		expect(() =>
			prepareReferenceEditConditions({
				...conditions,
				generationGeometry: { ...cpaPadding, canvas: [352, 512] },
			}),
		).toThrow();
		expect(() =>
			prepareReferenceEditConditions({
				...conditions,
				generationProfile: "native340-v1",
			}),
		).toThrow();
		const deliveryInput = {
			generationProfile: "cpa340-padded-v1" as const,
			engine: "cpa" as const,
			originalBytes: f.image,
			nativeBytes: native.rgbaBytes,
			rawBytes: f.state.cpaBytes,
			finishedBytes: f.state.cpaBytes,
			canonicalReceiptBytes: canonicalBytes,
		};
		expect(() =>
			portraitDeliveryV2({
				...deliveryInput,
				canonicalReceiptBytes: Buffer.from(
					JSON.stringify({
						...canonical,
						generationGeometry: {
							...cpaPadding,
							contentRect: { ...cpaPadding.contentRect, x: 151 },
						},
					}),
				),
			}),
		).toThrow("RESULT_EVIDENCE_MISMATCH");
		for (const variant of [
			"shifted",
			"missing-model-and-size",
			"wrong-size",
		] as const) {
			f.state.cpaModel = "gpt-image-2.5-sunburst";
			if (variant === "shifted") {
				const png = decodePng(
					transformReferencePng(content, "native", "cpa340-padded-v1")
						.rgbaBytes,
				);
				png.pixels[3] = 255;
				f.state.cpaBytes = encodePng(png);
			} else f.state.cpaBytes = finishingPngFixture().finishedBytes;
			if (variant === "missing-model-and-size") f.state.cpaModel = null;
			const id = randomUUID();
			const result = await post("/generations", { ...request, requestId: id });
			expect(result.body.job?.state).toBe(
				variant === "wrong-size" ? "UNKNOWN" : "FAILED",
			);
			if (variant === "missing-model-and-size") {
				const receipt = JSON.parse(
					await readFile(
						join(
							f.directory,
							"storage",
							"1",
							"jobs",
							id,
							"provider-source.png.receipt.json",
						),
						"utf8",
					),
				);
				expect(receipt).toMatchObject({
					modelAttestation: "UNKNOWN",
					actualCanvas: [1024, 1536],
					sizeContract: "FAIL",
					failures: ["MODEL_NOT_EXPOSED", "GENERATION_SIZE_MISMATCH"],
				});
			}
			if (variant === "shifted")
				expect(JSON.stringify(result.body)).toContain(
					"CPA_CONTENT_OUTSIDE_APPROVED_RECT",
				);
			console.log(
				"CPA_PADDING_NEGATIVE",
				JSON.stringify({ variant, result: result.body }),
			);
		}
	} finally {
		await f.close();
	}
}, 60000);

test("CPA closed geometry rejects impossible canvases and profile/rectangle tampering", () => {
	validateCpaCanvas(640, 1024);
	for (const [w, h] of [
		[340, 510],
		[352, 512],
		[4000, 4000],
		[640, 4096],
		[16, 655360],
	])
		expect(() => validateCpaCanvas(w ?? 0, h ?? 0)).toThrow(
			"GENERATION_SIZE_UNSUPPORTED",
		);
	expect(
		cpaPaddingSchema.safeParse({
			...cpaPadding,
			contentRect: { ...cpaPadding.contentRect, x: -1 },
		}).success,
	).toBe(false);
	expect(
		referenceGenerationRequestSchema.safeParse({
			generationProfile: "cpa340-padded-v2",
		}).success,
	).toBe(false);
});
