import { afterEach, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encodePng } from "../../acceptance/src/png.js";
import { sendReferenceEditRequest } from "../src/transport.js";

const hash = (bytes: string | Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
const image = encodePng({
	width: 1024,
	height: 1536,
	pixels: new Uint8Array(1024 * 1536 * 4),
});
const conditions = {
	schemaVersion: 2,
	inputMode: "reference-img2img",
	compiler: "source-preservation-edit.v1",
	model: "gpt-image-2.5-sunburst",
	prompt: "server-compiled",
	promptSHA256: hash("server-compiled"),
	sourceSHA256: "a".repeat(64),
	transformSHA256: "b".repeat(64),
	resolvedIntentSHA256: "c".repeat(64),
	referenceHashes: [hash(image)],
	orderedImageBytes: [image],
};
const directories: string[] = [];
afterEach(async () => {
	for (const directory of directories.splice(0))
		await rm(directory, { recursive: true });
});
test("versioned transport rejects zero/two images, changed hash/text, token override and unsupported model before side effects", async () => {
	for (const override of [
		{ orderedImageBytes: [] },
		{ orderedImageBytes: [image, image] },
		{ referenceHashes: ["0".repeat(64)] },
		{ prompt: "mutated" },
		{ slots: { face: "override" } },
		{ model: "gpt-image-other" },
		{
			orderedImageBytes: [new Uint8Array([1, 2, 3])],
			referenceHashes: [hash(new Uint8Array([1, 2, 3]))],
		},
	]) {
		const directory = await mkdtemp(join(tmpdir(), "reference-transport-"));
		directories.push(directory);
		let calls = 0;
		await expect(
			sendReferenceEditRequest({
				conditions: { ...conditions, ...override },
				connection: {
					baseUrl: "https://cpa.invalid/v1",
					apiKey: "offline-secret",
				},
				requestId: crypto.randomUUID(),
				outputPath: join(directory, "result.png"),
				provenance: {},
				send: async () => {
					calls++;
					return Response.json({});
				},
			}),
		).rejects.toThrow();
		expect(calls).toBe(0);
		expect(await readdir(directory)).toEqual([]);
	}
});
test("versioned transport sends PNG fields in order and records actual returned model only", async () => {
	const directory = await mkdtemp(join(tmpdir(), "reference-transport-"));
	directories.push(directory);
	const result = await sendReferenceEditRequest({
		conditions,
		connection: { baseUrl: "https://cpa.invalid/v1", apiKey: "offline-secret" },
		requestId: crypto.randomUUID(),
		outputPath: join(directory, "result.png"),
		provenance: {},
		send: async (request) => {
			const form = await request.formData();
			expect([...form.keys()]).toEqual([
				"model",
				"prompt",
				"size",
				"n",
				"output_format",
				"background",
				"image[]",
			]);
			expect(form.getAll("image[]")).toHaveLength(1);
			return Response.json({
				model: conditions.model,
				data: [{ b64_json: Buffer.from(image).toString("base64") }],
			});
		},
	});
	expect(result.receipt).toMatchObject({
		modelAttestation: "MATCH",
		modelSnapshot: null,
		modelSnapshotStatus: "NOT_EXPOSED",
		reviewStatus: "candidate-unreviewed",
	});
});
