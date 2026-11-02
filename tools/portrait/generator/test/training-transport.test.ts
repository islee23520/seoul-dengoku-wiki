import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encodePng } from "../../acceptance/src/png.js";
import {
	prepareTrainingConditions,
	sendTrainingDrawingRequest,
	trainingHash,
} from "../src/training-transport.js";

async function fixture(mode: "reference-image" | "tokens-only") {
	const styles = await Promise.all(
		[1, 2].map((index) =>
			readFile(
				process.env[`TRAINING_STYLE_${index}_PNG`] ??
					new URL(
						`../../../../../ART-ASSETS/portrait-training/shared-target-drawing-v2/style-${index}.png`,
						import.meta.url,
					),
			),
		),
	);
	const pixels = new Uint8Array(640 * 1024 * 4);
	for (let y = 300; y < 700; y++)
		for (let x = 200; x < 440; x++)
			pixels.set([80, 90, 100, 255], (y * 640 + x) * 4);
	const image = encodePng({ width: 640, height: 1024, pixels });
	const images = [
		...(mode === "reference-image"
			? [
					{
						index: 1,
						role: "recipient-identity-content",
						assetId: "reference:test",
						filename: "recipient-1.png",
						originalSHA256: "a".repeat(64),
						wireSHA256: trainingHash(image),
						transformSHA256: "b".repeat(64),
					},
				]
			: []),
		...styles.map((bytes, index) => ({
			index: index + (mode === "reference-image" ? 2 : 1),
			role: "style-only",
			assetId: `inventory:${trainingHash(bytes).slice(0, 12)}`,
			filename: `style-${index + 1}.png`,
			originalSHA256: trainingHash(bytes),
			wireSHA256: trainingHash(bytes),
			transformSHA256: null,
		})),
	];
	const conditions = prepareTrainingConditions({
		schema: "cpa-training-conditions.v1",
		compiler: "shared-style-cpa-training.v1",
		inputMode: mode,
		model: "gpt-image-2.5-sunburst",
		styleProfileId: "shared-target-drawing-v2",
		profileSHA256: "c".repeat(64),
		inventorySHA256: "d".repeat(64),
		intentSHA256: "e".repeat(64),
		prompt: "offline\nfixture",
		promptSHA256: trainingHash(Buffer.from("offline\nfixture")),
		images,
		orderedImageBytes: [
			...(mode === "reference-image" ? [image] : []),
			...styles,
		],
	});
	return { styles, image, conditions };
}

for (const mode of ["reference-image", "tokens-only"] as const) {
	test(`training ${mode} sends exact ordered multipart to actual loopback`, async () => {
		const f = await fixture(mode);
		const directory = await mkdtemp(
			join(process.env["RUN_TMP"] ?? tmpdir(), "training-wire-"),
		);
		const captured: Uint8Array[] = [];
		const server = Bun.serve({
			port: 0,
			hostname: "127.0.0.1",
			async fetch(request) {
				expect(new URL(request.url).pathname).toBe("/v1/images/edits");
				const wire = new Uint8Array(await request.arrayBuffer());
				captured.push(wire);
				const form = await new Request(request.url, {
					method: "POST",
					headers: request.headers,
					body: wire,
				}).formData();
				expect(form.get("size")).toBe("640x1024");
				expect(form.get("model")).toBe("gpt-image-2.5-sunburst");
				expect(form.get("n")).toBe("1");
				expect(form.get("output_format")).toBe("png");
				expect(form.get("background")).toBe("transparent");
				const parts = form.getAll("image[]");
				expect(parts.length).toBe(f.conditions.images.length);
				for (const [index, part] of parts.entries()) {
					expect(part instanceof File).toBe(true);
					if (!(part instanceof File)) throw Error("FILE_REQUIRED");
					const image = f.conditions.images[index];
					if (!image) throw Error("IMAGE_REQUIRED");
					expect(part.name).toBe(image.filename);
					expect(trainingHash(new Uint8Array(await part.arrayBuffer()))).toBe(
						image.wireSHA256,
					);
				}
				return Response.json({
					model: "gpt-image-2.5-sunburst",
					data: [{ b64_json: Buffer.from(f.image).toString("base64") }],
				});
			},
		});
		try {
			const outputPath = join(directory, "source.png");
			const result = await sendTrainingDrawingRequest({
				conditions: f.conditions,
				requestId: randomUUID(),
				connection: {
					baseUrl: `http://127.0.0.1:${server.port}/v1`,
					apiKey: "offline-key",
				},
				outputPath,
			});
			expect(result.receipt.modelAttestation).toBe("MATCH");
			expect(result.receipt.trainingSelected).toBe(false);
			expect(trainingHash(await readFile(`${outputPath}.request.bin`))).toBe(
				trainingHash(captured[0] ?? new Uint8Array()),
			);
			expect(result.receipt.responseSHA).toBe(trainingHash(f.image));
		} finally {
			server.stop(true);
			await rm(directory, { recursive: true, force: true });
		}
	});
}

test("training rejects foreign role, changed bytes, swapped order and extra recipient before sending", async () => {
	const f = await fixture("tokens-only");
	for (const changed of [
		{
			...f.conditions,
			images: f.conditions.images.map((image, index) =>
				index === 0 ? { ...image, role: "recipient-identity-content" } : image,
			),
		},
		{
			...f.conditions,
			orderedImageBytes: [...f.conditions.orderedImageBytes].reverse(),
		},
		{ ...f.conditions, images: [...f.conditions.images].reverse() },
		{ ...f.conditions, orderedImageBytes: [f.image, ...f.styles] },
	])
		expect(() => prepareTrainingConditions(changed)).toThrow();
});

for (const returnedModel of [null, "wrong-model"] as const) {
	test(`training ${returnedModel ?? "missing model"} retains failed raw body without production PNG`, async () => {
		const f = await fixture("tokens-only");
		const directory = await mkdtemp(
			join(process.env["RUN_TMP"] ?? tmpdir(), "training-failure-"),
		);
		const raw = Buffer.from(
			JSON.stringify({
				model: returnedModel,
				data: [{ b64_json: Buffer.from(f.image).toString("base64") }],
			}),
		);
		const server = Bun.serve({
			port: 0,
			hostname: "127.0.0.1",
			fetch: () => new Response(raw),
		});
		try {
			const outputPath = join(directory, "source.png");
			await expect(
				sendTrainingDrawingRequest({
					conditions: f.conditions,
					requestId: randomUUID(),
					connection: {
						baseUrl: `http://127.0.0.1:${server.port}`,
						apiKey: "offline-key",
					},
					outputPath,
				}),
			).rejects.toThrow(
				returnedModel === null ? "MODEL_NOT_EXPOSED" : "MODEL_MISMATCH",
			);
			expect(await readFile(`${outputPath}.response.bin`)).toEqual(raw);
			const receipt = JSON.parse(
				(await readFile(`${outputPath}.receipt.json`)).toString(),
			);
			expect(receipt.modelAttestation).toBe(
				returnedModel === null ? "UNKNOWN" : "FAIL",
			);
			expect(receipt.trainingSelected).toBe(false);
			await expect(readFile(outputPath)).rejects.toThrow();
		} finally {
			server.stop(true);
			await rm(directory, { recursive: true, force: true });
		}
	});
}
