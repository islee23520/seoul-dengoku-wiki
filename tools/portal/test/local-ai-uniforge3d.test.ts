import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
	mkdir,
	mkdtemp,
	readFile,
	realpath,
	rm,
	utimes,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { z } from "zod";
import {
	collectUniForge3D,
	prepareUniForge3D,
	type UniForge3DConfig,
	type UniForge3DInvocation,
	uniforge3dRequestSchema,
} from "../src/local-ai-uniforge3d.ts";
import { cpuTestPython } from "./local-ai-test-runtime.ts";

const pythonKey = "UNIFORGE3D_TEST_PYTHON";
const worker = resolve(import.meta.dir, "../../local-ai/uniforge3d-worker.py");
function run(invocation: UniForge3DInvocation) {
	return new Promise<{ code: number | null; stdout: string; stderr: string }>(
		(done, reject) => {
			const child = spawn(invocation.executable, [...invocation.args], {
				cwd: invocation.cwd,
				env: invocation.env,
				shell: false,
				stdio: ["ignore", "pipe", "pipe"],
				signal: AbortSignal.timeout(15000),
			});
			let stdout = "",
				stderr = "";
			child.stdout.on("data", (chunk: Buffer) => {
				stdout += chunk.toString();
			});
			child.stderr.on("data", (chunk: Buffer) => {
				stderr += chunk.toString();
			});
			child.once("error", reject);
			child.once("close", (code) => done({ code, stdout, stderr }));
		},
	);
}
function glb(mode: string): Buffer {
	const binary = Buffer.alloc(44);
	[0, 0, 0, 1, 0, 0, 0, 1, 0].forEach((value, i) => {
		binary.writeFloatLE(mode === "nan" && i === 0 ? Number.NaN : value, i * 4);
	});
	[0, 1, mode === "index" ? 3 : 2].forEach((value, i) => {
		binary.writeUInt16LE(value, 36 + i * 2);
	});
	const document = {
		asset: { version: "2.0" },
		buffers: [
			{
				byteLength: 44,
				...(mode === "uri" ? { uri: "../../escape.bin" } : {}),
			},
		],
		bufferViews: [
			{ buffer: 0, byteOffset: 0, byteLength: 36 },
			{ buffer: 0, byteOffset: 36, byteLength: 6 },
		],
		accessors: [
			{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3" },
			{ bufferView: 1, componentType: 5123, count: 3, type: "SCALAR" },
		],
		meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
	};
	const json = Buffer.from(JSON.stringify(document));
	const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 32);
	json.copy(padded);
	const header = Buffer.alloc(20),
		binHeader = Buffer.alloc(8);
	header.write("glTF");
	header.writeUInt32LE(2, 4);
	header.writeUInt32LE(28 + padded.length + binary.length, 8);
	header.writeUInt32LE(padded.length, 12);
	header.writeUInt32LE(0x4e4f534a, 16);
	binHeader.writeUInt32LE(binary.length);
	binHeader.writeUInt32LE(0x004e4942, 4);
	return Buffer.concat([header, padded, binHeader, binary]);
}

test("rejects extra public capabilities and invalid seeds", () => {
	// Given public-only input, when parsed, then paths/models/commands cannot enter.
	for (const input of [
		{ assetId: "a", seed: -1 },
		{ assetId: "a", seed: 1.5 },
		{ assetId: "a", seed: 2147483648 },
		{ assetId: "../a", seed: 1 },
		{ assetId: "a", seed: 1, url: "https://invalid" },
		{ assetId: "a", seed: 1, command: "python" },
	])
		expect(uniforge3dRequestSchema.safeParse(input).success).toBe(false);
});

test("real CPU worker validates fresh geometry and rejects invalid inputs and missing/stale/corrupt outputs", async () => {
	// Given isolated real image/GLB fixtures and no model or source installation.
	const pythonCommand = await cpuTestPython(pythonKey);
	const directory = await mkdtemp(join(tmpdir(), "uniforge3d-contract-"));
	try {
		const root = await realpath(directory);
		const env = Object.fromEntries(
			Object.entries(process.env).filter(
				(entry): entry is [string, string] => entry[1] !== undefined,
			),
		);
		const probe = await run({
			executable: pythonCommand,
			args: [
				"-I",
				"-c",
				"import sys,pathlib,PIL,numpy,pydantic;print(pathlib.Path(sys.executable).resolve())",
			],
			cwd: root,
			env,
			shell: false,
		});
		expect(probe.code, probe.stderr).toBe(0);
		const python = await realpath(z.string().min(1).parse(probe.stdout.trim()));
		await mkdir(join(root, "uniforge3d/pipelines"), { recursive: true });
		const sourceFile = join(
			root,
			"uniforge3d/pipelines/uniforge3d_image_to_3d.py",
		);
		await writeFile(sourceFile, "fixture-not-imported");
		await writeFile(join(root, "pipeline.json"), "{}");
		const image = join(root, "input.png");
		const fixture = await run({
			executable: python,
			args: [
				"-I",
				"-c",
				"from PIL import Image;import sys;Image.new('RGB',(2,2),(255,0,0)).save(sys.argv[1])",
				image,
			],
			cwd: root,
			env,
			shell: false,
		});
		expect(fixture.code, fixture.stderr).toBe(0);
		const pins = await Promise.all(
			[python, worker, sourceFile, join(root, "pipeline.json"), image].map(
				async (path) => ({
					path,
					sha256: createHash("sha256")
						.update(await readFile(path))
						.digest("hex"),
				}),
			),
		);
		const config: UniForge3DConfig = {
			python,
			worker,
			source: root,
			sourceRevision: "fixture",
			runtimeId: "cpu-fixture",
			model: root,
			hfHome: root,
			outputRoot: root,
			pins,
			assets: { fixture: [image] },
		};
		const input = { assetId: "fixture", seed: 19 };
		await expect(
			prepareUniForge3D({ ...input, assetId: "missing" }, config),
		).rejects.toThrow("UNIFORGE_VIEWS_INVALID");
		await expect(
			prepareUniForge3D(input, { ...config, assets: { fixture: [] } }),
		).rejects.toThrow("UNIFORGE_VIEWS_INVALID");
		await expect(
			prepareUniForge3D(input, { ...config, pins: pins.slice(1) }),
		).rejects.toThrow("UNIFORGE_PIN_MISSING");
		const prepared = await prepareUniForge3D(input, config);
		const output = join(prepared.directory, "prediction.glb");
		expect(prepared.generation.shell).toBe(false);
		expect(prepared.generation.env["HF_HUB_OFFLINE"]).toBe("1");
		expect(prepared.generation.env["OPENAI_API_KEY"]).toBeUndefined();
		// When the actual CPU validation subprocess parses one distinct artifact failure.
		for (const mode of [
			"good",
			"nan",
			"index",
			"uri",
			"stale",
			"corrupt",
			"missing",
		]) {
			if (mode !== "missing")
				await writeFile(
					output,
					mode === "corrupt" ? Buffer.from("bad") : glb(mode),
				);
			if (mode === "stale") await utimes(output, 1, 1);
			if (mode === "missing") await rm(output);
			const result = await run(prepared.validation);
			// Then only fresh finite triangles can be collected, and changed bytes fail.
			if (mode === "good") {
				expect(result.code, result.stderr).toBe(0);
				const receipt = await collectUniForge3D(prepared, result.stdout);
				expect([receipt.vertices, receipt.triangles, receipt.bounds]).toEqual([
					3,
					1,
					[
						[0, 0, 0],
						[1, 1, 0],
					],
				]);
				await writeFile(output, "changed");
				await expect(
					collectUniForge3D(prepared, result.stdout),
				).rejects.toThrow("UNIFORGE_ARTIFACT_CHANGED");
			} else expect(result.code, `${mode}: ${result.stderr}`).not.toBe(0);
		}
		await writeFile(output, glb("good"));
		const existing = await run(prepared.generation);
		expect(existing.code).not.toBe(0);
		expect(existing.stderr).toContain("OUTPUT_EXISTS");
		// Corrupt image is re-pinned, proving decode rejects it, not just hash mismatch.
		await writeFile(image, "not an image");
		const corruptConfig = {
			...config,
			pins: [
				...pins.filter((pin) => pin.path !== image),
				{
					path: image,
					sha256: createHash("sha256").update("not an image").digest("hex"),
				},
			],
		};
		const corrupt = await run(
			(await prepareUniForge3D(input, corruptConfig)).validation,
		);
		expect(corrupt.code).not.toBe(0);
		expect(corrupt.stderr).toContain("UnidentifiedImageError");
	} finally {
		await rm(directory, { recursive: true, force: true });
		console.log(`UNIFORGE3D_CLEANUP ${directory}`);
	}
}, 120000);
