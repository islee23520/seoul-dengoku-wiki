import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { decodePng } from "../../portrait/acceptance/src/png.ts";
import { native340Output } from "../src/portrait-size.ts";
import { referenceGenerationRequestSchema } from "../src/reference-contract.ts";
import { transformReferencePng } from "../src/reference-transform.ts";
import { finishingPngFixture } from "./comfyui-finishing-fixture.ts";
import { workbenchFixture } from "./reference-workbench-fixture.ts";

test("native340 actual HTTP binds CPA multipart, aligned source/token graphs, replay and unsupported size", async () => {
	const f = await workbenchFixture();
	try {
		const headers = await f.session();
		const post = async (path: string, body: unknown) => {
			const r = await fetch(f.api + path, {
				method: "POST",
				headers,
				body: JSON.stringify(body),
			});
			return {
				status: r.status,
				body: (await r.json()) as {
					connection?: { connectionId: string };
					job?: { state: string };
					error?: { code: string };
				},
			};
		};
		const connected = await post("/connections", {
			baseUrl: "http://127.0.0.1:1/v1",
			apiKey: "offline-workbench-key",
		});
		const base = {
			schemaVersion: 2,
			generationProfile: "native340-v1",
			requestId: randomUUID(),
			connectionId: connected.body.connection?.connectionId,
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
		expect(
			referenceGenerationRequestSchema.safeParse({
				...base,
				generationProfile: "other",
			}).success,
		).toBe(false);
		expect(
			referenceGenerationRequestSchema.safeParse({ ...base, size: "352x512" })
				.success,
		).toBe(false);
		const result = await post("/generations", base);
		expect(result.body.job?.state).toBe("HOLD");
		const jobDir = (id: string) =>
			join(f.directory, "storage", "1", "jobs", id);
		expect(f.calls[0]?.size).toBe("340x510");
		expect(f.calls[0]?.imageDimensions).toEqual([340, 510]);
		expect((await post("/generations", base)).status).toBe(200);
		expect(f.calls).toHaveLength(1);
		expect(
			(await post("/generations", { ...base, generationProfile: undefined }))
				.body.error?.code,
		).toBe("REQUEST_CONFLICT");
		const old = {
			...base,
			generationProfile: undefined,
			requestId: randomUUID(),
		};
		expect((await post("/generations", old)).body.job?.state).toBe("HOLD");
		expect(f.calls.at(-1)?.size).toBe("1024x1536");
		expect((await post("/generations", old)).status).toBe(200);
		expect(f.calls).toHaveLength(2);
		for (const token of [false, true]) {
			const workflow = token
				? "moss-image-sft-style-male.alpha.v1"
				: "moss-image-sft-source-img2img.alpha.v1";
			const c = await post("/connections", { provider: "comfyui", workflow });
			if (!c.body.connection) throw Error(JSON.stringify(c));
			const request = {
				...base,
				requestId: randomUUID(),
				connectionId: c.body.connection?.connectionId,
				provider: "comfyui",
				providerModel: `comfyui:${workflow}`,
				...(token
					? {
							personId: "person-900001",
							inputMode: "token-only",
							sourceSelection: {
								kind: "intentional-absence",
								reason: "no-reference-available",
							},
						}
					: {}),
			};
			const generated = await post("/generations", request);
			if (!generated.body.job) throw Error(JSON.stringify(generated));
			expect(generated.body.job?.state).toBe("HOLD");
			const graph = f.comfy.prompts.at(-1)?.prompt;
			expect(graph?.["26"]?.inputs).toMatchObject({ width: 352, height: 512 });
			if (token)
				expect(graph?.["6"]?.inputs).toMatchObject({ width: 352, height: 512 });
			else {
				expect(graph?.["6"]?.class_type).toBe("VAEEncode");
				const uploaded = f.comfy.uploads.at(-1);
				if (!uploaded) throw Error("MISSING_UPLOAD");
				const upload = decodePng(uploaded.bytes);
				expect([upload.width, upload.height]).toEqual([352, 512]);
			}
			const image = await fetch(`${f.api}/jobs/${request.requestId}/image`, {
				headers,
			});
			const png = decodePng(new Uint8Array(await image.arrayBuffer()));
			expect([png.width, png.height]).toEqual([340, 510]);
			const proof = await fetch(`${f.api}/jobs/${request.requestId}/result`, {
				headers,
			});
			expect(proof.status).toBe(200);
			const canonical = JSON.parse(
				await readFile(
					join(jobDir(request.requestId), "provider-canonical.receipt.json"),
					"utf8",
				),
			);
			expect(canonical.generationGeometry).toEqual({
				requested: [340, 510],
				canvas: [352, 512],
				latent: [1, 128, 32, 22],
				contentRect: { x: 6, y: 1, width: 340, height: 510 },
				output: [340, 510],
				evidence: "pinned-vae-contract-not-observed-tensor",
			});
			await fetch(`${f.api}/connections/${c.body.connection.connectionId}`, {
				method: "DELETE",
				headers,
			});
		}
		f.state.cpaStatus = 422;
		const unsupported = await post("/generations", {
			...base,
			requestId: randomUUID(),
		});
		expect(JSON.stringify(unsupported.body)).toContain(
			"GENERATION_SIZE_UNSUPPORTED",
		);
		expect(f.calls.at(-1)?.size).toBe("340x510");
		const native = transformReferencePng(
			f.image,
			"native",
			"native340-v1",
			"comfyui",
		);
		expect(native.receipt.computationalContentRect).toEqual({
			x: 6,
			y: 1,
			width: 340,
			height: 510,
		});
		expect(native.receipt.crop).toBeNull();
	} finally {
		await f.close();
	}
}, 60000);

test("native340 removes only the recorded outer padding", () => {
	const source = finishingPngFixture(352, 512).finishedBytes;
	const raw = decodePng(source);
	const output = decodePng(native340Output(source, "comfyui"));
	for (let y = 0; y < 510; y++)
		expect(output.pixels.subarray(y * 340 * 4, (y + 1) * 340 * 4)).toEqual(
			raw.pixels.subarray(((y + 1) * 352 + 6) * 4, ((y + 1) * 352 + 346) * 4),
		);
	expect(() =>
		native340Output(finishingPngFixture().finishedBytes, "comfyui"),
	).toThrow("INVALID_PNG");
});
