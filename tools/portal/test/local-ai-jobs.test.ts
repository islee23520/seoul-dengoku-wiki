// allow: SIZE_OK — one real HTTP lifecycle scenario and its bounded worker fixture; task9 owns a single focused test file.
import { expect, test } from "bun:test";
import { createHash, randomUUID } from "node:crypto";
import { once } from "node:events";
import {
	mkdir,
	mkdtemp,
	readFile,
	realpath,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { z } from "zod";
import {
	type BrokerReply,
	requestSha256,
} from "../../local-ai/worker-broker-client.ts";
import { collectOwnedJob } from "../../local-ai/worker-broker-collector.ts";
import { loadConfig } from "../src/config.ts";
import { createLocalAiJobs, type LocalAiWorker } from "../src/local-ai-jobs.ts";
import { createPortal } from "../src/server.ts";
import { cpuTestPython } from "./local-ai-test-runtime.ts";

const hash = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
function mesh() {
	const bin = Buffer.alloc(44);
	[0, 0, 0, 1, 0, 0, 0, 1, 0].forEach((v, i) => {
		bin.writeFloatLE(v, i * 4);
	});
	[0, 1, 2].forEach((v, i) => {
		bin.writeUInt16LE(v, 36 + i * 2);
	});
	const json = Buffer.from(
		JSON.stringify({
			asset: { version: "2.0" },
			buffers: [{ byteLength: 44 }],
			bufferViews: [
				{ buffer: 0, byteOffset: 0, byteLength: 36 },
				{ buffer: 0, byteOffset: 36, byteLength: 6 },
			],
			accessors: [
				{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3" },
				{ bufferView: 1, componentType: 5123, count: 3, type: "SCALAR" },
			],
			meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
		}),
	);
	const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 32);
	json.copy(padded);
	const header = Buffer.alloc(20),
		tail = Buffer.alloc(8);
	header.write("glTF");
	header.writeUInt32LE(2, 4);
	header.writeUInt32LE(28 + padded.length + 44, 8);
	header.writeUInt32LE(padded.length, 12);
	header.writeUInt32LE(0x4e4f534a, 16);
	tail.writeUInt32LE(44);
	tail.writeUInt32LE(0x004e4942, 4);
	return Buffer.concat([header, padded, tail, bin]);
}

test("HTTP publishes only validated artifacts and preserves UUID, owner, CSRF and restart boundaries", async () => {
	// Given an actual portal server and bounded CPU worker; no model/GPU/service access.
	const python = await cpuTestPython("LOCAL_AI_TEST_PYTHON");
	const directory = await mkdtemp(join(tmpdir(), "local-ai-http-"));
	let portal: Awaited<ReturnType<typeof createPortal>> | undefined;
	const portals: Awaited<ReturnType<typeof createPortal>>[] = [];
	try {
		const root = await realpath(directory);
		const storage = join(root, "storage"),
			results = join(root, "results");
		await mkdir(storage);
		await mkdir(results);
		const validator = resolve(
			import.meta.dir,
			"../../local-ai/uniforge3d-worker.py",
		);
		const fixture = join(root, "worker.py"),
			image = join(root, "input.png"),
			source = join(root, "uniforge3d/pipelines/uniforge3d_image_to_3d.py");
		await mkdir(join(root, "uniforge3d/pipelines"), { recursive: true });
		await writeFile(source, "fixture");
		await writeFile(join(root, "pipeline.json"), "{}");
		await writeFile(join(root, "mesh.glb"), mesh());
		await writeFile(
			image,
			Buffer.concat([Buffer.from("P6\n1 1\n255\n"), Buffer.from([255, 0, 0])]),
		);
		await writeFile(
			fixture,
			`import json,sys,pathlib,runpy,os\nj=json.loads(pathlib.Path(sys.argv[-1]).read_text())\nif sys.argv[1]=="generate":\n if j["request"]["seed"]==1: pathlib.Path(j["output"]).write_bytes(pathlib.Path(${JSON.stringify(join(root, "mesh.glb"))}).read_bytes())\n if j["request"]["seed"]==1: os.utime(j["output"],ns=(pathlib.Path(sys.argv[-1]).stat().st_mtime_ns+1000000000,)*2)\n sys.exit(0)\nrunpy.run_path(${JSON.stringify(validator)},run_name="__main__")\n`,
		);
		const pins = await Promise.all(
			[
				python,
				fixture,
				validator,
				source,
				image,
				join(root, "pipeline.json"),
			].map(async (path) => ({ path, sha256: hash(await readFile(path)) })),
		);
		const config = {
			resultsRoot: results,
			uniforge3d: {
				python,
				worker: fixture,
				source: root,
				sourceRevision: "fixture",
				runtimeId: "cpu-fixture",
				model: root,
				hfHome: root,
				outputRoot: root,
				pins,
				assets: { fixture: [image] },
			},
		};
		let runs = 0,
			maintenance = true;
		const worker: LocalAiWorker = async (request): Promise<BrokerReply> => {
			switch (request.op) {
				case "admission":
					return {
						version: 1,
						op: "admission",
						configurationEligible: maintenance,
					};
				case "run": {
					runs++;
					if (request.seed === 3) throw new Error("controlled-disconnect");
					const { version: _, op: __, prompt, ...input } = request;
					try {
						await collectOwnedJob(
							request.tool === "unimate" ? { ...input, prompt } : input,
							config,
						);
					} catch (error) {
						if (!(error instanceof Error) || request.seed === 1) throw error;
					}
					return {
						version: 1,
						op: "run",
						requestId: request.requestId,
						state: "AWAITING_VALIDATION",
						requestSha256: requestSha256(request),
						exitCode: 0,
					};
				}
				case "result":
					return {
						version: 1,
						op: "result",
						receipt: await readFile(
							join(results, request.requestId, "receipt.json"),
							"utf8",
						),
					};
				case "get": {
					const bytes = await readFile(
						join(
							results,
							request.artifactId.slice(0, 36),
							"artifacts",
							request.artifactId,
						),
					);
					return {
						version: 1,
						op: "get",
						artifactId: request.artifactId,
						offset: request.offset,
						total: bytes.length,
						sha256: hash(bytes),
						data: bytes
							.subarray(request.offset, request.offset + request.length)
							.toString("base64"),
					};
				}
				case "probe":
					throw new Error("unused");
				default: {
					const exhaustive: never = request;
					throw new Error(String(exhaustive));
				}
			}
		};
		const catalog = [
			{
				tool: "uniforge3d" as const,
				assets: ["fixture"],
				missingModels: [],
				unsupportedRuntime: false,
				licenseRequired: false,
				error: null,
			},
		];
		portal = await createPortal(
			loadConfig({ PORTAL_PORT: "0", PORTAL_STORAGE_PATH: storage }),
			{ localAi: { worker, catalog } },
		);
		portals.push(portal);
		const jobs = portal.localAi;
		if (!jobs) throw new Error("fixture storage missing");
		let address = await portal.listen();
		let origin = `http://127.0.0.1:${address.port}`;
		async function session() {
			const response = await fetch(`${origin}/tools/api/auth/session`);
			return {
				cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "",
				csrf: z.object({ csrfToken: z.string() }).parse(await response.json())
					.csrfToken,
			};
		}
		let auth = await session();
		async function http(path: string, body?: object, csrf = true) {
			const response = await fetch(`${origin}/tools/api/local-ai/${path}`, {
				method: body ? "POST" : "GET",
				headers: {
					cookie: auth.cookie,
					origin,
					...(csrf ? { "x-csrf-token": auth.csrf } : {}),
					"content-type": "application/json",
				},
				...(body ? { body: JSON.stringify(body) } : {}),
			});
			const bytes = Buffer.from(await response.arrayBuffer());
			console.log(
				JSON.stringify({
					method: body ? "POST" : "GET",
					path,
					status: response.status,
					headers: Object.fromEntries(response.headers),
					body: response.headers.get("content-type")?.includes("json")
						? bytes.toString()
						: bytes.toString("base64"),
				}),
			);
			return { status: response.status, bytes };
		}
		// When a signed owner submits, then only validated bytes become downloadable.
		const eligibility = await http("catalog");
		expect(eligibility.status).toBe(200);
		expect(
			JSON.parse(eligibility.bytes.toString()).tools.find(
				(tool: { tool: string }) => tool.tool === "uniforge3d",
			),
		).toMatchObject({
			configurationEligible: true,
			maintenanceReady: false,
			ready: false,
		});
		const toolConfig = catalog[0];
		if (!toolConfig) throw new Error("fixture catalog missing");
		toolConfig.licenseRequired = true;
		expect(
			JSON.parse((await http("catalog")).bytes.toString()).tools.find(
				(tool: { tool: string }) => tool.tool === "uniforge3d",
			).ready,
		).toBe(false);
		toolConfig.licenseRequired = false;
		const input = {
			requestId: randomUUID(),
			tool: "uniforge3d",
			assetId: "fixture",
			seed: 1,
		};
		expect((await http("jobs", input, false)).status).toBe(403);
		const terminal = once(jobs.events, "terminal", {
			signal: AbortSignal.timeout(30000),
		});
		const submissions = await Promise.all([
			http("jobs", input),
			http("jobs", input),
		]);
		expect(submissions.map((response) => response.status)).toEqual([202, 202]);
		await terminal;
		const completed = await http(`jobs/${input.requestId}`);
		expect(completed.status).toBe(200);
		expect(JSON.parse(completed.bytes.toString()).job.state).toBe("succeeded");
		const download = await http(
			`jobs/${input.requestId}/artifacts/${input.requestId}-0`,
		);
		expect(download.status).toBe(200);
		expect(hash(download.bytes)).toBe(hash(mesh()));
		expect((await http("jobs", input)).status).toBe(202);
		expect(runs).toBe(1);
		expect((await http("jobs", { ...input, seed: 7 })).status).toBe(409);
		await expect(jobs.get("999", input.requestId)).rejects.toMatchObject({
			status: 404,
		});
		// Durable foreign-owned row is exercised through the actual HTTP guard.
		const foreign = randomUUID(),
			foreignDir = join(storage, "local-ai/jobs", foreign);
		await mkdir(foreignDir);
		const stored = JSON.parse(
			await readFile(
				join(storage, "local-ai/jobs", input.requestId, "job.json"),
				"utf8",
			),
		);
		await writeFile(
			join(foreignDir, "job.json"),
			JSON.stringify({
				...stored,
				id: foreign,
				owner: "999",
				request: { ...input, requestId: foreign },
			}),
		);
		expect((await http(`jobs/${foreign}`)).status).toBe(404);
		expect(
			(await http(`jobs/${foreign}/artifacts/${input.requestId}-0`)).status,
		).toBe(404);
		maintenance = false;
		expect(
			(await http("jobs", { ...input, requestId: randomUUID() })).status,
		).toBe(503);
		maintenance = true;
		expect(
			(
				await http("jobs", {
					...input,
					requestId: randomUUID(),
					prompt: "forbidden",
				})
			).status,
		).toBe(422);
		// Exit zero without output is not success; a disconnected run is never retried.
		for (const seed of [2, 3]) {
			const request = { ...input, requestId: randomUUID(), seed };
			// Unknown blocks another job for that owner, so use a separate storage-root server.
			const isolated = join(root, `storage-${seed}`);
			await mkdir(isolated);
			const candidate = await createPortal(
				loadConfig({ PORTAL_PORT: "0", PORTAL_STORAGE_PATH: isolated }),
				{ localAi: { worker, catalog } },
			);
			portals.push(candidate);
			const old = portal;
			portal = candidate;
			address = await candidate.listen();
			origin = `http://127.0.0.1:${address.port}`;
			auth = await session();
			const candidateJobs = candidate.localAi;
			if (!candidateJobs) throw new Error("fixture storage missing");
			const done = once(candidateJobs.events, "terminal", {
				signal: AbortSignal.timeout(30000),
			});
			expect((await http("jobs", request)).status).toBe(202);
			await done;
			expect(
				JSON.parse((await http(`jobs/${request.requestId}`)).bytes.toString())
					.job.state,
			).toBe("unknown");
			const before = runs;
			expect((await http("jobs", request)).status).toBe(202);
			expect(runs).toBe(before);
			await old.close();
		}
		await portal.close();
		// Given an interrupted durable record, when reopened, then UNKNOWN and no dispatch.
		const interrupted = randomUUID(),
			dir = join(storage, "local-ai/jobs", interrupted);
		await mkdir(dir);
		await writeFile(
			join(dir, "job.json"),
			JSON.stringify({
				...stored,
				id: interrupted,
				state: "running",
				request: { ...input, requestId: interrupted },
			}),
		);
		const recovered = await createLocalAiJobs({
			storagePath: storage,
			catalogPath: null,
			worker,
			catalog,
		});
		try {
			expect((await recovered.get("1", interrupted)).state).toBe("unknown");
			expect((await recovered.get("1", input.requestId)).state).toBe(
				"succeeded",
			);
		} finally {
			await recovered.close();
		}
	} finally {
		try {
			await Promise.all(portals.map((app) => app.close()));
		} finally {
			await rm(directory, { recursive: true, force: true });
		}
		console.log(`LOCAL_AI_CLEANUP ${directory}`);
	}
}, 120000);
