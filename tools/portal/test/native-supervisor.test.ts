import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
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
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const node =
	"/Users/ilseoblee/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node";
const supervisor = fileURLToPath(
	new URL("../install/supervise-personal-native.mjs", import.meta.url),
);
const hash = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");

async function fixture(
	mode: "success" | "held-exit" | "failure" | "failure-live" | "lost" | "early",
	earlyStop = false,
) {
	const root = await mkdtemp(
		join(await realpath(tmpdir()), "portal-native-supervisor-"),
	);
	const storage = join(root, "storage");
	const publicPath = join(root, "public");
	await mkdir(storage);
	await mkdir(publicPath);
	const db = join(root, "originals.sqlite");
	await writeFile(db, "synthetic-only");
	const source = join(root, "fixture.ts");
	await writeFile(
		source,
		`
		import { createServer, createServer as createControlServer } from "node:http";
    const mode = ${JSON.stringify(mode)};
    const server = createServer((_req, res) => res.end("synthetic"));
    const exitHold = createServer((_req, res) => res.end("held"));
    if (mode === "held-exit") exitHold.listen(0, "127.0.0.1");
    if (mode === "held-exit" || mode === "failure-live") {
      const control = createControlServer((request, response) => {
          if (request.url !== "/release") { response.writeHead(404).end(); return; }
          if (mode === "held-exit") exitHold.close();
          else server.close();
          response.end("released");
          control.close();
      });
      control.listen(0, "127.0.0.1", () => {
        console.log("FIXTURE_RELEASE_HANDLER_READY port=" + control.address().port);
      });
    }
    server.listen(0, "127.0.0.1", () => {
      if (mode === "early") { process.exit(3); return; }
      if (process.send) process.send({ schema: "portal-native-ipc.v1", type: "ready" });
      console.log("FIXTURE_LISTENING");
    });
    let count = 0;
    process.on("message", message => {
      if (message?.schema !== "portal-native-ipc.v1" || message.type !== "stop") return;
      console.log("FIXTURE_STOP_COUNT=" + ++count);
      if (mode === "lost") { process.disconnect(); server.close(() => { process.exitCode = 1; }); return; }
      if (mode === "failure" || mode === "failure-live") {
        process.send({ schema: "portal-native-ipc.v1", type: "drain-failed" }, () => process.disconnect());
        process.exitCode = 1;
        if (mode !== "failure-live") server.close();
        return;
      }
      server.close(() => {
        process.send({ schema: "portal-native-ipc.v1", type: "drained" }, () => {
          process.disconnect();
        });
      });
    });
  `,
	);
	const server = join(root, "server.mjs");
	const built = await Bun.build({
		entrypoints: [source],
		target: "node",
		outdir: root,
		naming: "server.mjs",
	});
	if (!built.success)
		throw new AggregateError(built.logs, "FIXTURE_BUILD_FAILED");
	const config = join(root, "launch.json");
	await writeFile(
		config,
		JSON.stringify({
			schema: "portal-native-launch.v1",
			nodePath: node,
			serverPath: server,
			serverSha256: hash(await readFile(server)),
			originalsDb: db,
			storagePath: storage,
			publicPath,
			environment: {},
		}),
	);
	const controller = join(root, "controller.mjs");
	await writeFile(
		controller,
		`
    import childProcess from "node:child_process";
    import { syncBuiltinESMExports } from "node:module";
    const spawn = childProcess.spawn;
    let owned;
    let exited;
    let closed;
    let finishExit;
    let finishClose;
    let delayExitReport = false;
    let withheldExit;
    let cleaning = false;
    childProcess.spawn = (...args) => {
      const options = args[2];
      owned = spawn(...args);
      exited = new Promise(resolve => { finishExit = resolve; });
      closed = new Promise(resolve => { finishClose = resolve; });
      owned.once("exit", (code, signal) => {
        finishExit({ code, signal });
        if (delayExitReport) withheldExit = { fixture: "owned-exit", code, signal };
        else process.send({ fixture: "owned-exit", code, signal });
      });
      owned.once("close", (code, signal) => {
        finishClose({ code, signal });
        process.send({ fixture: "owned-close", code, signal }, () => {
          if (!delayExitReport && !cleaning && process.connected) process.disconnect();
        });
      });
      process.send({ fixture: "owned-started", pid: owned.pid ?? null });
      return owned;
    };
    syncBuiltinESMExports();
    process.on("message", async message => {
      if (message?.fixture === "delay-exit-report") {
        delayExitReport = true;
        process.send({ fixture: "exit-report-delayed" });
      }
      if (message?.fixture === "cleanup") {
        cleaning = true;
        if (owned && owned.exitCode === null && owned.signalCode === null)
          owned.kill("SIGKILL");
        if (owned) { await exited; await closed; }
        if (withheldExit) process.send(withheldExit);
        process.send({ fixture: "cleanup-done" }, () => process.disconnect());
      }
    });
    await import(${JSON.stringify(supervisor)});
  `,
	);
	const child = spawn(node, [controller, config], {
		stdio: ["pipe", "pipe", "pipe", "ipc"],
		env: {},
	});
	const lines: string[] = [];
	const pending: Array<{
		predicate: (line: string) => boolean;
		resolve: (line: string) => void;
	}> = [];
	let stdout = "";
	let stderr = "";
	const receive = (line: string) => {
		const index = pending.findIndex((entry) => entry.predicate(line));
		if (index === -1) lines.push(line);
		else pending.splice(index, 1)[0]?.resolve(line);
	};
	child.on("message", (message: unknown) => {
		const event = message as {
			fixture?: string;
			pid?: number;
			code?: number;
			signal?: string;
		};
		if (event.fixture)
			receive(
				`CONTROLLER_${event.fixture} code=${event.code ?? "null"} signal=${event.signal ?? "null"}`,
			);
	});
	child.stdout?.on("data", (chunk) => {
		stdout += String(chunk);
		for (
			let end = stdout.indexOf("\n");
			end !== -1;
			end = stdout.indexOf("\n")
		) {
			const line = stdout.slice(0, end).trim();
			stdout = stdout.slice(end + 1);
			receive(line);
		}
	});
	child.stderr?.on("data", (chunk) => {
		stderr += String(chunk);
		for (
			let end = stderr.indexOf("\n");
			end !== -1;
			end = stderr.indexOf("\n")
		) {
			const line = stderr.slice(0, end).trim();
			stderr = stderr.slice(end + 1);
			receive(line);
		}
	});
	const exited = once(child, "exit");
	const closed = once(child, "close");
	const wait = (predicate: (line: string) => boolean) => {
		const index = lines.findIndex(predicate);
		if (index !== -1) return Promise.resolve(lines.splice(index, 1)[0]);
		return new Promise<string>((resolve, reject) => {
			const entry = {
				predicate,
				resolve: (line: string) => {
					clearTimeout(timeout);
					resolve(line);
				},
			};
			const timeout = setTimeout(() => {
				pending.splice(pending.indexOf(entry), 1);
				reject(Error(`SUPERVISOR_TIMEOUT ${JSON.stringify(lines)} ${stderr}`));
			}, 10000);
			pending.push(entry);
		});
	};
	if (earlyStop) child.stdin?.write("stop\n");
	let cleaning: Promise<void> | undefined;
	const cleanup = () =>
		(cleaning ??= (async () => {
			// The test-owned controller retains the actual ChildProcess handle and
			// subscribes to exit and close before returning it to the supervisor.
			// Never signal a PID parsed from asynchronous stdout.
			if (child.connected) {
				const done = wait((line) =>
					line.startsWith("CONTROLLER_cleanup-done "),
				);
				child.send({ fixture: "cleanup" });
				await done;
			}
			child.stdin?.end();
			await exited;
			await closed;
			await rm(root, { recursive: true, force: true });
		})());
	return {
		child,
		exited,
		wait,
		lines,
		stderr: () => stderr,
		root,
		cleanup,
		delayExitReport: async () => {
			const barrier = wait((line) =>
				line.startsWith("CONTROLLER_exit-report-delayed "),
			);
			child.send({ fixture: "delay-exit-report" });
			await barrier;
		},
		release: (port: number) => fetch(`http://127.0.0.1:${port}/release`),
	};
}

test("Node 24 bundled child queues early stop, drains once and exits before parent reports stopped", async () => {
	const run = await fixture("success", true);
	try {
		expect(
			await run.wait((line) =>
				line.startsWith("NATIVE_SUPERVISOR_STATE=ready"),
			),
		).toContain("child=");
		expect(
			await run.wait((line) =>
				line.startsWith("NATIVE_SUPERVISOR_STATE=stopping"),
			),
		).toContain("child=");
		run.child.stdin?.write("stop\nstop\n");
		expect(await run.wait((line) => line === "FIXTURE_STOP_COUNT=1")).toBe(
			"FIXTURE_STOP_COUNT=1",
		);
		expect(
			await run.wait((line) =>
				line.startsWith("NATIVE_SUPERVISOR_STATE=drained"),
			),
		).toContain("child=");
		expect(
			await run.wait((line) =>
				line.startsWith("NATIVE_SUPERVISOR_STATE=stopped"),
			),
		).toContain("child=");
		expect((await run.exited)[0]).toBe(0);
		expect(run.lines).not.toContain("FIXTURE_STOP_COUNT=2");
	} finally {
		await run.cleanup();
	}
});

test("drained is not stopped until the owned child actually exits", async () => {
	const run = await fixture("held-exit");
	try {
		const handler = await run.wait((line) =>
			line.startsWith("FIXTURE_RELEASE_HANDLER_READY port="),
		);
		const releasePort = Number(handler?.split("port=")[1]);
		const ready = await run.wait((line) =>
			line.startsWith("NATIVE_SUPERVISOR_STATE=ready"),
		);
		expect(ready).toContain("child=");
		run.child.stdin?.write("stop\n");
		await run.wait((line) =>
			line.startsWith("NATIVE_SUPERVISOR_STATE=drained"),
		);
		expect(run.child.exitCode).toBeNull();
		expect(
			run.lines.some((line) =>
				line.startsWith("NATIVE_SUPERVISOR_STATE=stopped"),
			),
		).toBe(false);
		expect((await run.release(releasePort)).status).toBe(200);
		await run.wait((line) =>
			line.startsWith("NATIVE_SUPERVISOR_STATE=stopped"),
		);
		expect((await run.exited)[0]).toBe(0);
	} finally {
		await run.cleanup();
	}
});

test("failed drain with a live child keeps the supervisor in failure until actual exit", async () => {
	const run = await fixture("failure-live");
	try {
		const handler = await run.wait((line) =>
			line.startsWith("FIXTURE_RELEASE_HANDLER_READY port="),
		);
		const releasePort = Number(handler?.split("port=")[1]);
		const ready = await run.wait((line) =>
			line.startsWith("NATIVE_SUPERVISOR_STATE=ready"),
		);
		expect(ready).toContain("child=");
		run.child.stdin?.write("stop\n");
		await run.wait((line) =>
			line.includes("NATIVE_SUPERVISOR_FAILURE=DRAIN_FAILED"),
		);
		expect(run.child.exitCode).toBeNull();
		expect(
			run.lines.some((line) =>
				line.startsWith("NATIVE_SUPERVISOR_STATE=stopped"),
			),
		).toBe(false);
		expect((await run.release(releasePort)).status).toBe(200);
		expect((await run.exited)[0]).toBe(1);
		expect(
			run.lines.some((line) =>
				line.startsWith("NATIVE_SUPERVISOR_STATE=stopped"),
			),
		).toBe(false);
	} finally {
		await run.cleanup();
	}
});

test("actual Node 24 ENOENT spawn failure exits nonzero with controller stdin kept open", async () => {
	const root = await mkdtemp(
		join(await realpath(tmpdir()), "portal-native-supervisor-enoent-"),
	);
	const config = join(root, "launch.json");
	await writeFile(
		config,
		JSON.stringify({
			schema: "portal-native-launch.v1",
			nodePath: join(root, "absent-node24"),
		}),
	);
	const parent = spawn(node, [supervisor, config], {
		stdio: ["pipe", "pipe", "pipe"],
		env: {},
	});
	const exited = once(parent, "exit", { signal: AbortSignal.timeout(5000) });
	let stderr = "";
	parent.stderr.on("data", (bytes) => {
		stderr += String(bytes);
	});
	try {
		// Keep the controller pipe open throughout the child spawn attempt.
		expect(parent.stdin.destroyed).toBe(false);
		expect((await exited)[0]).toBe(1);
		expect(stderr).toContain("NATIVE_SUPERVISOR_FAILURE=CHILD_SPAWN_FAILED");
		expect(parent.stdin.writableEnded).toBe(false);
	} finally {
		if (parent.exitCode === null && parent.signalCode === null)
			parent.kill("SIGKILL");
		await exited;
		await rm(root, { recursive: true, force: true });
	}
});

test("failure-path teardown awaits the retained child handle before removing fixture", async () => {
	const run = await fixture("held-exit");
	try {
		await run.wait((line) =>
			line.startsWith("FIXTURE_RELEASE_HANDLER_READY port="),
		);
		await run.wait((line) => line.startsWith("NATIVE_SUPERVISOR_STATE=ready"));
		// Abort assertions while a test-owned controller holds the real child
		// handle; its cleanup waits for the exact child exit, not a PID probe.
		await run.cleanup();
		expect(run.child.exitCode === null && run.child.signalCode === null).toBe(
			false,
		);
		expect(
			run.lines.some((line) => line.startsWith("CONTROLLER_owned-exit ")),
		).toBe(true);
		expect(
			run.lines.some((line) => line.startsWith("CONTROLLER_owned-close ")),
		).toBe(true);
		await expect(readFile(join(run.root, "launch.json"))).rejects.toMatchObject(
			{
				code: "ENOENT",
			},
		);
	} finally {
		await run.cleanup();
	}
});

test("delayed exit report cannot trigger a signal after actual child termination", async () => {
	const run = await fixture("success");
	try {
		await run.wait((line) => line.startsWith("NATIVE_SUPERVISOR_STATE=ready"));
		await run.delayExitReport();
		run.child.stdin?.write("stop\n");
		await run.wait((line) =>
			line.startsWith("NATIVE_SUPERVISOR_STATE=drained"),
		);
		await run.wait((line) => line.startsWith("CONTROLLER_owned-close "));
		expect(
			run.lines.some((line) => line.startsWith("CONTROLLER_owned-exit ")),
		).toBe(false);
		await run.cleanup();
		expect(
			run.lines.some((line) => line.startsWith("CONTROLLER_owned-exit ")),
		).toBe(true);
		await expect(readFile(join(run.root, "launch.json"))).rejects.toMatchObject(
			{ code: "ENOENT" },
		);
	} finally {
		await run.cleanup();
	}
});

for (const [mode, expected] of [
	["failure", "DRAIN_FAILED"],
	["lost", "CHANNEL_LOST"],
	["early", "CHILD_EXIT_3"],
] as const) {
	test(`Node 24 bundled child ${mode} retains failure and never reports clean stop`, async () => {
		const run = await fixture(mode);
		try {
			if (mode !== "early") {
				await run.wait((line) =>
					line.startsWith("NATIVE_SUPERVISOR_STATE=ready"),
				);
				run.child.stdin?.write("stop\nstop\n");
				await run.wait((line) =>
					line.startsWith("NATIVE_SUPERVISOR_STATE=stopping"),
				);
			}
			expect(
				await run.wait((line) =>
					line.includes(`NATIVE_SUPERVISOR_FAILURE=${expected}`),
				),
			).toContain("child=");
			expect((await run.exited)[0]).toBe(1);
			expect(
				run.lines.some((line) =>
					line.startsWith("NATIVE_SUPERVISOR_STATE=stopped"),
				),
			).toBe(false);
		} finally {
			await run.cleanup();
		}
	});
}
