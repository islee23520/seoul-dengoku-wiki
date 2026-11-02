import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createConnection } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import {
	BrokerError,
	type BrokerRequest,
	requestWorker,
} from "../../local-ai/worker-broker-client.ts";
import { runOwned } from "../../local-ai/worker-broker-owner.mjs";

test("owner bridge spawns only inside task13 retained runExclusive and rejects pin drift", async () => {
	// Given the real task13 lease and its owned disposable controller, not live Comfy.
	const modulePath = process.env["GPU_LEASE_MODULE"];
	const fixturePath = process.env["GPU_LEASE_FIXTURE"];
	if (!modulePath || !fixturePath)
		throw new BrokerError("GPU_LEASE_FIXTURE_REQUIRED");
	const { acquireMaintenance } = await import(modulePath);
	const { createServer } = await import("node:net");
	const server = createServer();
	await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
	const address = server.address();
	if (!address || typeof address === "string")
		throw new BrokerError("FIXTURE_PORT");
	await new Promise<void>((done) => server.close(() => done()));
	const root = await mkdtemp(join(tmpdir(), "broker-lease-"));
	const node = process.env["BROKER_NODE"];
	if (!node) throw new BrokerError("BROKER_NODE_REQUIRED");
	const nodeHash = createHash("sha256")
		.update(await readFile(node))
		.digest("hex");
	const configPath = join(root, "maintenance.json");
	await writeFile(
		configPath,
		JSON.stringify({
			version: 1,
			leasePort: address.port,
			approval: {
				id: "owned-test",
				instances: ["fixture"],
				directSubmissionsPaused: true,
				autoLaunchersPaused: true,
				restoreConfirmed: true,
			},
			controller: {
				executable: node,
				sha256: nodeHash,
				argv: [fixturePath, "--fixture-controller"],
				cwd: dirname(fixturePath),
				pins: [
					{
						path: fixturePath,
						sha256: createHash("sha256")
							.update(await readFile(fixturePath))
							.digest("hex"),
					},
				],
			},
		}),
	);
	const lease = await acquireMaintenance({
		configPath,
		receiptPath: join(root, "receipt.json"),
	});
	try {
		// When: bridge runs an approved stdin-consuming CPU process under actual lease.
		const worker = {
			Executable: node,
			Sha256: nodeHash,
			Arguments: [
				"-e",
				"process.stdin.resume();process.stdin.on('end',()=>process.exit(0))",
			],
		};
		expect(await runOwned(lease, worker, { requestId: randomUUID() })).toBe(0);
		// Then: a hash mismatch is denied before a second spawn.
		await expect(
			runOwned(lease, { ...worker, Sha256: "a".repeat(64) }, {}),
		).rejects.toThrow("WORKER_PIN");
		// Subscribe to exact worker-start publication before triggering cancellation.
		const marker = join(root, "started");
		const cancellation = new AbortController();
		const readyServer = createServer();
		await new Promise<void>((done) => readyServer.listen(0, "127.0.0.1", done));
		const readyAddress = readyServer.address();
		if (!readyAddress || typeof readyAddress === "string")
			throw new BrokerError("FIXTURE_PORT");
		const started = once(readyServer, "connection", {
			signal: AbortSignal.timeout(10000),
		});
		try {
			const pending = runOwned(
				lease,
				{
					...worker,
					Arguments: [
						"-e",
						`require('fs').writeFileSync(${JSON.stringify(marker)},String(process.pid));require('net').connect(${readyAddress.port},'127.0.0.1');process.stdin.resume();`,
					],
				},
				{},
				cancellation.signal,
			);
			const outcome = pending.then(
				() => "completed",
				(error) => (error instanceof Error ? error.message : "unexpected"),
			);
			const [readySocket] = await started;
			cancellation.abort();
			expect(await outcome).toBe("WORKER_INTERRUPTED");
			readySocket.destroy();
			const pid = Number(await readFile(marker, "utf8"));
			expect(() => process.kill(pid, 0)).toThrow();
		} finally {
			await new Promise<void>((done) => readyServer.close(() => done()));
		}
	} finally {
		await lease.release();
		await rm(root, { recursive: true, force: true });
	}
}, 60000);

// Actual integration: no injected peer token and no synthetic service claims.
// Build the broker before this focused invocation; absence is a failure, not a skip.
test("owner peer uses actual Windows impersonation and interrupted requests remain unknown", async () => {
	// Given a uniquely owned spool with a protected owner-only ACL.
	const root = await mkdtemp(join(tmpdir(), "seoul-broker-"));
	try {
		const binary = process.env["WORKER_BROKER_DLL"];
		if (!binary) throw new BrokerError("WORKER_BROKER_DLL_REQUIRED");
		const systemRoot = process.env["SystemRoot"];
		if (!systemRoot) throw new BrokerError("SYSTEM_ROOT_REQUIRED");
		const powershell =
			process.env["BROKER_POWERSHELL"] ??
			join(
				systemRoot,
				"System32",
				"WindowsPowerShell",
				"v1.0",
				"powershell.exe",
			);
		const wsl =
			process.env["BROKER_WSL"] ?? join(systemRoot, "System32", "wsl.exe");
		const ps = spawn(
			powershell,
			[
				"-NoProfile",
				"-NonInteractive",
				"-Command",
				`$ErrorActionPreference='Stop';$p='${root.replaceAll("'", "''")}';$s=[Security.Principal.WindowsIdentity]::GetCurrent().User; $a=New-Object Security.AccessControl.DirectorySecurity;$a.SetOwner($s);$a.SetAccessRuleProtection($true,$false);$r=New-Object Security.AccessControl.FileSystemAccessRule($s,'FullControl','ContainerInherit,ObjectInherit','None','Allow');$a.AddAccessRule($r);[IO.Directory]::SetAccessControl($p,$a);$s.Value`,
			],
			{ stdio: ["ignore", "pipe", "pipe"] },
		);
		const identity = new Promise<string>((done) => {
			let value = "";
			ps.stdout.on("data", (chunk) => {
				value += String(chunk);
			});
			ps.stdout.on("end", () => done(value));
		});
		const setupError = new Promise<string>((done) => {
			let value = "";
			ps.stderr.on("data", (chunk) => {
				value += String(chunk);
			});
			ps.stderr.on("end", () => done(value));
		});
		const psExit = await once(ps, "exit");
		const owner = (await identity).trim();
		expect(psExit[0], await setupError).toBe(0);
		const id = randomUUID();
		const config = join(root, "broker.config");
		const journal = join(root, `${id}.json`);
		const hash = createHash("sha256")
			.update(
				JSON.stringify({
					tool: "uniforge3d",
					asset: "example",
					seed: 1,
					prompt: "",
				}),
			)
			.digest("hex");
		await writeFile(
			journal,
			JSON.stringify({ Hash: hash, State: "RUNNING", ExitCode: null }),
		);
		const executableHash = createHash("sha256")
			.update(await readFile(wsl))
			.digest("hex");
		await writeFile(
			config,
			JSON.stringify({
				OwnerSid: owner,
				ServiceSid: "S-1-5-80-1-2-3-4-5",
				Spool: root,
				ManifestSha256: "a".repeat(64),
				Workers: {
					"uniforge3d:example": {
						Executable: wsl,
						Sha256: executableHash,
						Arguments: [],
					},
				},
				Artifacts: {},
			}),
		);
		async function invoke(request: BrokerRequest | Buffer) {
			const child = spawn(
				process.env["BROKER_DOTNET"] ?? "dotnet",
				[resolve(binary ?? ""), config, "--once"],
				{ stdio: ["ignore", "pipe", "pipe"] },
			);
			const exit = once(child, "exit");
			const errors = new Promise<string>((done) => {
				let value = "";
				child.stderr.on("data", (chunk) => {
					value += String(chunk);
				});
				child.stderr.on("end", () => done(value));
			});
			const ready = new Promise<void>((resolveReady, reject) => {
				let output = "";
				child.stdout.on("data", (chunk) => {
					output += String(chunk);
					if (output.includes("PIPE_READY")) resolveReady();
				});
				child.once("exit", () =>
					reject(new BrokerError("BROKER_EXIT_BEFORE_READY")),
				);
			});
			try {
				await ready;
				const result = Buffer.isBuffer(request)
					? await new Promise<"rejected">((done, reject) => {
							const socket = createConnection(
								"\\\\.\\pipe\\seoul-local-ai-worker-v1",
							);
							const timeout = setTimeout(() => {
								socket.destroy();
								reject(new BrokerError("RAW_TIMEOUT"));
							}, 10000);
							socket.once("connect", () => socket.end(request));
							socket.once("data", () => {
								socket.destroy();
								reject(new BrokerError("INVALID_REQUEST_ACCEPTED"));
							});
							socket.once("error", () => {
								clearTimeout(timeout);
								done("rejected");
							});
							socket.once("close", () => {
								clearTimeout(timeout);
								done("rejected");
							});
						})
					: await requestWorker(request, AbortSignal.timeout(15000));
				expect((await exit)[0], await errors).toBe(0);
				return result;
			} finally {
				if (child.exitCode === null) {
					child.kill();
					await exit;
				}
			}
		}
		// When: the real pipe authenticates this owner process and probes Ubuntu.
		const reply = await invoke({ version: 1, op: "probe" });
		// Then: this is actual owner proof, explicitly not production service proof.
		if (typeof reply === "string" || reply.op !== "probe")
			throw new BrokerError("EXPECTED_PROBE");
		expect(reply.op).toBe("probe");
		expect(reply.peerSid).toBe(owner);
		expect(reply.ownerSid).toBe(owner);
		expect(reply.identitySource).toBe("windows-pipe-impersonation");
		expect(reply.ubuntuUid).toMatch(/^\d+$/);
		console.log(
			JSON.stringify({
				actualOwnerProbe: reply,
				productionServiceToken: "NOT_RUN_REQUIRES_APPROVED_NATIVE_HARNESS",
			}),
		);
		const request = {
			version: 1,
			op: "run",
			requestId: id,
			tool: "uniforge3d",
			assetId: "example",
			seed: 1,
			prompt: "",
		} satisfies BrokerRequest;
		const old = await invoke(request);
		expect(typeof old !== "string" && old.op === "run" ? old.state : null).toBe(
			"UNKNOWN",
		);
		expect(JSON.parse(await readFile(journal, "utf8")).State).toBe("UNKNOWN");
		await expect(invoke({ ...request, seed: 2 })).rejects.toThrow(
			"REQUEST_CONFLICT",
		);
		await expect(
			invoke({ ...request, requestId: randomUUID() }),
		).rejects.toThrow("GPU_MAINTENANCE_REQUIRED");
		// A malicious raw peer cannot bypass the client length guard.
		const oversized = Buffer.alloc(4);
		oversized.writeUInt32LE(65537);
		expect(await invoke(oversized)).toBe("rejected");
		// Exercise the complete authenticated ingress -> pinned Node child -> real
		// task13 lease -> fixed CPU worker -> durable response path.
		const node = process.env["BROKER_NODE"],
			leaseModule = process.env["GPU_LEASE_MODULE"],
			leaseFixture = process.env["GPU_LEASE_FIXTURE"];
		if (!node || !leaseModule || !leaseFixture)
			throw new BrokerError("BRIDGE_FIXTURE_REQUIRED");
		const { createServer } = await import("node:net");
		const portServer = createServer();
		await new Promise<void>((done) => portServer.listen(0, "127.0.0.1", done));
		const address = portServer.address();
		if (!address || typeof address === "string")
			throw new BrokerError("FIXTURE_PORT");
		await new Promise<void>((done) => portServer.close(() => done()));
		const pin = async (path: string) =>
			createHash("sha256")
				.update(await readFile(path))
				.digest("hex");
		const maintenance = join(root, "maintenance.config");
		const nodeHash = await pin(node);
		await writeFile(
			maintenance,
			JSON.stringify({
				version: 1,
				leasePort: address.port,
				approval: {
					id: "broker-fixture-only",
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
		const script = resolve("tools/local-ai/worker-broker-owner.mjs");
		const worker = {
			Executable: node,
			Sha256: nodeHash,
			Arguments: [
				"-e",
				"process.stdin.resume();process.stdin.on('end',()=>process.exit(0))",
			],
			Pins: [{ Path: script, Sha256: await pin(script) }],
		};
		const bridgeConfig = join(root, "bridge.config");
		await writeFile(
			bridgeConfig,
			JSON.stringify({
				LeaseModule: leaseModule,
				LeaseModuleSha256: await pin(leaseModule),
				MaintenanceConfig: maintenance,
				ReceiptPath: join(root, "lease-receipt"),
				Workers: { "uniforge3d:example": worker },
			}),
		);
		const cfg = JSON.parse(await readFile(config, "utf8"));
		cfg.Bridge = {
			Executable: node,
			Sha256: nodeHash,
			Script: script,
			ScriptSha256: await pin(script),
			Config: bridgeConfig,
			ConfigSha256: await pin(bridgeConfig),
		};
		cfg.Workers = {
			"uniforge3d:example": {
				Executable: node,
				Sha256: nodeHash,
				Arguments: worker.Arguments,
			},
		};
		await writeFile(config, JSON.stringify(cfg));
		const bridged = await invoke({ ...request, requestId: randomUUID() });
		expect(
			typeof bridged !== "string" && bridged.op === "run"
				? bridged.state
				: null,
		).toBe("AWAITING_VALIDATION");
		// A noisy owner must not block on a full redirected stdout pipe.
		const noisy = join(root, "noisy.mjs");
		await writeFile(
			noisy,
			"process.stdin.once('data',()=>process.stdout.write('x'.repeat(131072),()=>process.exit(0)));process.stdin.resume();",
		);
		cfg.Bridge.Script = noisy;
		cfg.Bridge.ScriptSha256 = await pin(noisy);
		await writeFile(config, JSON.stringify(cfg));
		await expect(
			invoke({ ...request, requestId: randomUUID() }),
		).rejects.toThrow("BRIDGE_RESPONSE");
	} finally {
		await rm(root, { recursive: true, force: true });
	}
}, 60000);
