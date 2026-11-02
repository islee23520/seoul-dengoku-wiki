import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
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
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import {
	BrokerError,
	type BrokerRequest,
	requestSha256,
	requestWorker,
} from "../../local-ai/worker-broker-client.ts";
import { localAiReceiptSchema } from "../src/local-ai-jobs.ts";

const hash = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
const required = (key: string) => {
	const value = process.env[key];
	if (!value) throw new BrokerError(`${key}_REQUIRED`);
	return value;
};

test("native owner admission, collector CPU validation and multi-chunk result agree", async () => {
	// Given actual owner impersonation and a disposable task13 controller only.
	const dll = required("WORKER_BROKER_DLL"),
		node = required("BROKER_NODE");
	const leaseModule = required("GPU_LEASE_MODULE"),
		leaseFixture = required("GPU_LEASE_FIXTURE");
	const python = await realpath(required("LOCAL_AI_TEST_PYTHON"));
	const root = await realpath(await mkdtemp(join(tmpdir(), "task9-native-")));
	const pin = async (path: string) => hash(await readFile(path));
	const config = join(root, "broker.config"),
		bridgeConfig = join(root, "bridge.config");
	const spool = join(root, "spool"),
		results = join(spool, "results");
	const exits: { readonly request: string; readonly code: number | null }[] =
		[];
	try {
		await mkdir(spool);
		await mkdir(results);
		const ps = spawn(
			process.env["BROKER_POWERSHELL"] ??
				join(
					required("SystemRoot"),
					"System32/WindowsPowerShell/v1.0/powershell.exe",
				),
			[
				"-NoProfile",
				"-NonInteractive",
				"-Command",
				`$ErrorActionPreference='Stop';$p='${spool.replaceAll("'", "''")}';$s=[Security.Principal.WindowsIdentity]::GetCurrent().User;$a=New-Object Security.AccessControl.DirectorySecurity;$a.SetOwner($s);$a.SetAccessRuleProtection($true,$false);$a.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($s,'FullControl','ContainerInherit,ObjectInherit','None','Allow')));[IO.Directory]::SetAccessControl($p,$a);$s.Value`,
			],
			{ stdio: ["ignore", "pipe", "pipe"] },
		);
		let owner = "",
			setupError = "";
		ps.stdout.on("data", (chunk) => {
			owner += String(chunk);
		});
		ps.stderr.on("data", (chunk) => {
			setupError += String(chunk);
		});
		expect((await once(ps, "close"))[0], setupError).toBe(0);
		const portServer = createServer();
		await new Promise<void>((done) => portServer.listen(0, "127.0.0.1", done));
		const address = portServer.address();
		if (!address || typeof address === "string")
			throw new BrokerError("FIXTURE_PORT");
		await new Promise<void>((done) => portServer.close(() => done()));
		const nodeHash = await pin(node),
			maintenance = join(root, "maintenance.config");
		await writeFile(
			maintenance,
			JSON.stringify({
				version: 1,
				leasePort: address.port,
				approval: {
					id: "task9-native-only",
					instances: ["fixture"],
					directSubmissionsPaused: true,
					autoLaunchersPaused: true,
					restoreConfirmed: true,
				},
				controller: {
					executable: node,
					sha256: nodeHash,
					argv: [leaseFixture, "--fixture-controller"],
					cwd: dirname(leaseFixture),
					pins: [{ path: leaseFixture, sha256: await pin(leaseFixture) }],
				},
			}),
		);
		const source = join(root, "uniforge3d/pipelines/uniforge3d_image_to_3d.py");
		await mkdir(dirname(source), { recursive: true });
		await writeFile(source, "fixture");
		await writeFile(join(root, "pipeline.json"), "{}");
		const image = join(root, "input.ppm");
		await writeFile(
			image,
			Buffer.concat([Buffer.from("P6\n1 1\n255\n"), Buffer.from([255, 0, 0])]),
		);
		// A valid embedded mesh whose JSON padding forces at least two native chunks.
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
		const padded = Buffer.alloc(40000, 32);
		json.copy(padded);
		const header = Buffer.alloc(20),
			tail = Buffer.alloc(8);
		header.write("glTF");
		header.writeUInt32LE(2, 4);
		header.writeUInt32LE(40072, 8);
		header.writeUInt32LE(40000, 12);
		header.writeUInt32LE(0x4e4f534a, 16);
		tail.writeUInt32LE(44);
		tail.writeUInt32LE(0x004e4942, 4);
		const mesh = Buffer.concat([header, padded, tail, bin]),
			meshPath = join(root, "mesh.glb");
		await writeFile(meshPath, mesh);
		const validator = resolve("tools/local-ai/uniforge3d-worker.py"),
			fixture = join(root, "worker.py");
		await writeFile(
			fixture,
			`import json,sys,pathlib,runpy,os\nj=json.loads(pathlib.Path(sys.argv[-1]).read_text())\nif sys.argv[1]=="generate":\n if j["request"]["seed"]==1:\n  pathlib.Path(j["output"]).write_bytes(pathlib.Path(${JSON.stringify(meshPath)}).read_bytes())\n  os.utime(j["output"],ns=(pathlib.Path(sys.argv[-1]).stat().st_mtime_ns+1000000000,)*2)\n sys.exit(0)\nrunpy.run_path(${JSON.stringify(validator)},run_name="__main__")\n`,
		);
		const pins = await Promise.all(
			[
				python,
				fixture,
				validator,
				source,
				image,
				join(root, "pipeline.json"),
			].map(async (path) => ({ path, sha256: await pin(path) })),
		);
		const collectorConfig = join(root, "collector.config"),
			collector = resolve("tools/portal/dist/local-ai-collector.mjs");
		await writeFile(
			collectorConfig,
			JSON.stringify({
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
			}),
		);
		const script = resolve("tools/local-ai/worker-broker-owner.mjs");
		const worker = {
			Executable: node,
			Sha256: nodeHash,
			Arguments: [collector, collectorConfig],
			Pins: [
				{ Path: collector, Sha256: await pin(collector) },
				{ Path: collectorConfig, Sha256: await pin(collectorConfig) },
			],
		};
		// Tiny pinned worker isolates C#/JS wire hashing, not UniMate validation.
		const unicodeWorker = {
			Executable: node,
			Sha256: nodeHash,
			Arguments: [
				"-e",
				`let s='';process.stdin.on('data',b=>s+=b);process.stdin.on('end',()=>{const r=JSON.parse(s),fs=require('fs'),p=require('path').join(${JSON.stringify(results)},r.requestId);fs.mkdirSync(p);fs.writeFileSync(require('path').join(p,'receipt.json'),JSON.stringify({request:{requestId:r.requestId,tool:r.tool,assetId:r.assetId,seed:r.seed,prompt:r.prompt}}));});`,
			],
			Pins: [{ Path: script, Sha256: await pin(script) }],
		};
		const workers = {
			"uniforge3d:fixture": worker,
			"unimate:fixture": unicodeWorker,
		};
		await writeFile(
			bridgeConfig,
			JSON.stringify({
				LeaseModule: leaseModule,
				LeaseModuleSha256: await pin(leaseModule),
				MaintenanceConfig: maintenance,
				ReceiptPath: join(root, "lease-receipt"),
				Workers: workers,
			}),
		);
		const bridge = {
			Executable: node,
			Sha256: nodeHash,
			Script: script,
			ScriptSha256: await pin(script),
			Config: bridgeConfig,
			ConfigSha256: await pin(bridgeConfig),
		};
		const cfg = {
			OwnerSid: owner.trim(),
			ServiceSid: "S-1-5-80-1-2-3-4-5",
			Spool: spool,
			ManifestSha256: "a".repeat(64),
			Workers: workers,
			Artifacts: {},
			Bridge: bridge,
		};
		// C# configuration disallows the owner-only Pins field in Workers.
		const nativeWorkers = Object.fromEntries(
			Object.entries(workers).map(([key, value]) => [
				key,
				{
					Executable: value.Executable,
					Sha256: value.Sha256,
					Arguments: value.Arguments,
				},
			]),
		);
		await writeFile(
			config,
			JSON.stringify({ ...cfg, Workers: nativeWorkers, Bridge: null }),
		);
		async function invoke(request: BrokerRequest) {
			const child = spawn(
				process.env["BROKER_DOTNET"] ?? "dotnet",
				[dll, config, "--once"],
				{ stdio: ["ignore", "pipe", "pipe"] },
			);
			const closed = once(child, "close");
			let stderr = "",
				stdout = "";
			child.stderr.on("data", (chunk) => {
				stderr += String(chunk);
			});
			const ready = new Promise<void>((done, reject) => {
				const deadline = setTimeout(
					() => reject(new BrokerError("BROKER_READY_TIMEOUT")),
					10000,
				);
				child.stdout.on("data", (chunk) => {
					stdout += String(chunk);
					if (stdout.includes("PIPE_READY")) {
						clearTimeout(deadline);
						done();
					}
				});
				child.once("error", reject);
				child.once("close", () => {
					clearTimeout(deadline);
					reject(new BrokerError(`BROKER_EXIT_BEFORE_READY:${stderr}`));
				});
			});
			try {
				await ready;
				try {
					return await requestWorker(request, AbortSignal.timeout(45000));
				} finally {
					const code = (await closed)[0];
					exits.push({ request: request.op, code });
					expect(code, stderr).toBe(0);
				}
			} finally {
				if (child.exitCode === null) {
					child.kill();
					await closed;
				}
			}
		}
		// When no admitted bridge exists, then admission fails without receipt creation.
		expect(await invoke({ version: 1, op: "admission" })).toEqual({
			version: 1,
			op: "admission",
			configurationEligible: false,
		});
		await writeFile(config, JSON.stringify({ ...cfg, Workers: nativeWorkers }));
		expect(await invoke({ version: 1, op: "admission" })).toEqual({
			version: 1,
			op: "admission",
			configurationEligible: true,
		});
		// Explicit focused mode exercises only changed native admission, not GPU dispatch.
		if (process.env["LOCAL_AI_NATIVE_ADMISSION_ONLY"] === "1") return;
		const request = {
			version: 1,
			op: "run",
			requestId: randomUUID(),
			tool: "uniforge3d",
			assetId: "fixture",
			seed: 1,
			prompt: "",
		} satisfies BrokerRequest;
		// When actual pipe -> pinned owner -> collector -> CPU validator completes.
		const run = await invoke(request);
		if (run.op !== "run") throw new BrokerError("EXPECTED_RUN");
		expect([run.state, run.exitCode]).toEqual(["AWAITING_VALIDATION", 0]);
		expect(run.requestSha256).toBe(requestSha256(request));
		const result = await invoke({
			version: 1,
			op: "result",
			requestId: request.requestId,
		});
		if (result.op !== "result") throw new BrokerError("EXPECTED_RESULT");
		const receipt = localAiReceiptSchema.parse(JSON.parse(result.receipt));
		expect(receipt.request).toEqual({
			requestId: request.requestId,
			tool: request.tool,
			assetId: request.assetId,
			seed: 1,
		});
		const artifact = receipt.artifacts[0];
		if (!artifact) throw new BrokerError("EXPECTED_ARTIFACT");
		const chunks: Buffer[] = [];
		for (let offset = 0; offset < artifact.bytes; offset += 32768) {
			const chunk = await invoke({
				version: 1,
				op: "get",
				artifactId: artifact.id,
				offset,
				length: 32768,
			});
			if (chunk.op !== "get") throw new BrokerError("EXPECTED_CHUNK");
			expect([chunk.total, chunk.sha256]).toEqual([mesh.length, hash(mesh)]);
			chunks.push(Buffer.from(chunk.data, "base64"));
		}
		// Then only validated, receipt-bound exact bytes are served across chunk boundaries.
		expect(chunks.length).toBe(2);
		expect(Buffer.concat(chunks)).toEqual(mesh);
		expect(artifact.sha256).toBe(hash(mesh));
		console.log(
			JSON.stringify({
				nativeRoundtrip: "PASS",
				artifact,
				chunks: chunks.length,
				exits,
			}),
		);
		const missing = { ...request, requestId: randomUUID(), seed: 2 };
		const failed = await invoke(missing);
		if (failed.op !== "run") throw new BrokerError("EXPECTED_RUN");
		expect([failed.state, failed.exitCode]).toEqual(["FAILED", 1]);
		await expect(
			invoke({ version: 1, op: "result", requestId: missing.requestId }),
		).rejects.toThrow();
		for (const prompt of [
			'한글\n\t\u001b"\\',
			String.fromCharCode(...Array.from({ length: 32 }, (_, i) => i)) +
				"\u007f\u0085\u2028\u2029\ufffe\uffff",
			"😀𐀀􏿿 e\u0301 é",
			String.raw`literal \u001B \u001b \u2028 \ud83d\ude00 \\u001b`,
		]) {
			const unicode = {
				...request,
				requestId: randomUUID(),
				tool: "unimate",
				prompt,
			} satisfies BrokerRequest;
			const wire = await invoke(unicode);
			if (wire.op !== "run") throw new BrokerError("EXPECTED_RUN");
			const expectedHash = requestSha256(unicode);
			const unicodeResult = await invoke({
				version: 1,
				op: "result",
				requestId: unicode.requestId,
			});
			if (unicodeResult.op !== "result")
				throw new BrokerError("EXPECTED_RESULT");
			console.log(
				JSON.stringify({
					unicodeWire: { actual: wire.requestSha256, expected: expectedHash },
					exits,
				}),
			);
			expect(wire.requestSha256).toBe(expectedHash);
			expect(JSON.parse(unicodeResult.receipt).request.prompt).toBe(prompt);
			const replay = await invoke(unicode);
			expect(replay).toEqual(wire);
			await expect(
				invoke({ ...unicode, prompt: prompt + "x" }),
			).rejects.toThrow("REQUEST_CONFLICT");
		}
	} finally {
		await rm(root, { recursive: true, force: true });
		console.log(
			JSON.stringify({
				cleanup: "owned fixture removed",
				root,
				exits,
				productionServiceToken: "NOT_RUN",
				gpu: "NOT_RUN",
			}),
		);
	}
}, 180000);
