import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

const main = fileURLToPath(new URL("../src/main.ts", import.meta.url));
const server = fileURLToPath(new URL("../src/server.ts", import.meta.url));
const protocol = "portal-native-ipc.v1";

function fixture(
	failClose: "none" | "idle" | "live" | "pending" = "none",
	releaseOnDisconnect = false,
) {
	const code = `
		import { mock } from "bun:test";
		import { createServer } from "node:http";
		let closeCalls = 0;
		let active;
		const started = new Promise(resolve => { active = resolve; });
		let release;
		const finished = new Promise(resolve => { release = resolve; });
		let rejectClose;
		const pendingFailure = new Promise((_resolve, reject) => { rejectClose = reject; });
		const http = createServer(async (req, res) => {
			if (req.url === "/release") {
				release();
				res.end("released");
				return;
			}
			res.writeHead(200);
			res.flushHeaders();
			if (process.connected) process.send({ fixture: "work-started" });
			active();
			await finished;
			res.end("done");
			if (process.connected) process.send({ fixture: "work-finished" });
		});
		process.on("message", message => {
			if (message?.fixture === "finish-work") release();
			if (message?.fixture === "reject-close") rejectClose(Error("FIXTURE_CLOSE_FAILED"));
		});
		if (${releaseOnDisconnect}) process.on("disconnect", () => release());
		if (${JSON.stringify(failClose)} === "pending") {
			for (const signal of ["SIGINT", "SIGTERM"])
				process.on(signal, () => process.send({ fixture: "signal-observed", signal }));
		}
		mock.module(${JSON.stringify(server)}, () => ({ createPortal: async () => ({
			server: http,
			listen: async () => {
				const listening = new Promise(resolve => http.once("listening", resolve));
				http.listen(0, "127.0.0.1");
				await listening;
				process.send({ fixture: "listening", port: http.address().port });
				return http.address();
			},
			close: async () => {
				closeCalls++;
				process.send({ fixture: "close-called", count: closeCalls });
				if (${JSON.stringify(failClose)} === "pending") return pendingFailure;
				if (${JSON.stringify(failClose)} !== "none") {
					if (${JSON.stringify(failClose)} === "idle") http.close();
					throw Error("FIXTURE_CLOSE_FAILED");
				}
				await new Promise((resolve, reject) => http.close(error => error ? reject(error) : resolve()));
			},
		}) }));
		await import(${JSON.stringify(main)});
	`;
	const child = spawn(process.execPath, ["-e", code], {
		stdio: ["ignore", "pipe", "pipe", "ipc"],
		env: { PORTAL_MODE: "local", PORTAL_PORT: "0" },
	});
	const messages: unknown[] = [];
	const waiters: ((value: unknown) => void)[] = [];
	child.on("message", (message: unknown) => {
		messages.push(message);
		waiters.shift()?.(message);
	});
	let stderr = "";
	child.stderr?.on("data", (chunk) => {
		stderr += String(chunk);
	});
	return {
		child,
		messages,
		stderr: () => stderr,
		next: async () => {
			if (messages.length) return messages.shift();
			return new Promise<unknown>((resolve, reject) => {
				const timeout = setTimeout(
					() => reject(Error(`IPC_TIMEOUT ${stderr}`)),
					10000,
				);
				waiters.push((value) => {
					clearTimeout(timeout);
					messages.shift();
					resolve(value);
				});
			});
		},
	};
}

test("inherited IPC drains active HTTP work before acknowledgement and ignores duplicate or malformed stops", async () => {
	const run = fixture();
	try {
		const listening = (await run.next()) as { fixture: string; port: number };
		expect(listening.fixture).toBe("listening");
		expect(await run.next()).toEqual({ schema: protocol, type: "ready" });
		const response = fetch(`http://127.0.0.1:${listening.port}/`);
		expect(await run.next()).toEqual({ fixture: "work-started" });
		const exited = once(run.child, "exit");
		run.child.send({ schema: protocol, type: "stop", extra: true });
		run.child.send({ schema: protocol, type: "stop" });
		expect(await run.next()).toEqual({ fixture: "close-called", count: 1 });
		run.child.send({ schema: protocol, type: "stop" });
		run.child.send({ fixture: "finish-work" });
		expect((await response).status).toBe(200);
		expect(await run.next()).toEqual({ fixture: "work-finished" });
		expect(await run.next()).toEqual({ schema: protocol, type: "drained" });
		expect((await exited)[0]).toBe(0);
		expect(run.messages).toEqual([]);
	} finally {
		if (run.child.exitCode === null) run.child.kill();
	}
});

test("close rejection returns explicit failed acknowledgement and nonzero idle process exit", async () => {
	const run = fixture("idle");
	try {
		expect(await run.next()).toMatchObject({ fixture: "listening" });
		expect(await run.next()).toEqual({ schema: protocol, type: "ready" });
		const exited = once(run.child, "exit");
		run.child.send({ schema: protocol, type: "stop" });
		expect(await run.next()).toEqual({ fixture: "close-called", count: 1 });
		expect(await run.next()).toEqual({
			schema: protocol,
			type: "drain-failed",
		});
		expect((await exited)[0]).toBe(1);
		expect(run.stderr()).toContain("NATIVE_DRAIN_FAILED");
		expect(run.stderr()).toContain("FIXTURE_CLOSE_FAILED");
	} finally {
		if (run.child.exitCode === null) run.child.kill();
	}
});

test("mixed IPC and SIGTERM invoke one close while an active response drains", async () => {
	const run = fixture();
	const exited = once(run.child, "exit");
	try {
		const listening = (await run.next()) as { fixture: string; port: number };
		expect(await run.next()).toEqual({ schema: protocol, type: "ready" });
		const response = fetch(`http://127.0.0.1:${listening.port}/`);
		expect(await run.next()).toEqual({ fixture: "work-started" });
		run.child.send({ schema: protocol, type: "stop" });
		expect(await run.next()).toEqual({ fixture: "close-called", count: 1 });
		run.child.kill("SIGTERM");
		run.child.send({ fixture: "finish-work" });
		expect((await response).status).toBe(200);
		expect(await run.next()).toEqual({ fixture: "work-finished" });
		expect(await run.next()).toEqual({ schema: protocol, type: "drained" });
		expect((await exited)[0]).toBe(0);
		expect(run.messages).toEqual([]);
	} finally {
		if (run.child.exitCode === null) {
			run.child.kill("SIGKILL");
			await exited;
		}
	}
});

test("signal-first then exact IPC stop subscribes once to the existing drain", async () => {
	const run = fixture();
	const exited = once(run.child, "exit");
	try {
		const listening = (await run.next()) as { fixture: string; port: number };
		expect(await run.next()).toEqual({ schema: protocol, type: "ready" });
		const response = fetch(`http://127.0.0.1:${listening.port}/`);
		expect(await run.next()).toEqual({ fixture: "work-started" });
		run.child.kill("SIGTERM");
		expect(await run.next()).toEqual({ fixture: "close-called", count: 1 });
		run.child.send({ schema: protocol, type: "stop" });
		run.child.send({ schema: protocol, type: "stop" });
		run.child.send({ fixture: "finish-work" });
		expect((await response).status).toBe(200);
		expect(await run.next()).toEqual({ fixture: "work-finished" });
		expect(await run.next()).toEqual({ schema: protocol, type: "drained" });
		expect((await exited)[0]).toBe(0);
		expect(run.messages).toEqual([]);
	} finally {
		if (run.child.exitCode === null) {
			run.child.kill("SIGKILL");
			await exited;
		}
	}
});

test("signal-only with inherited IPC closes the channel after drain and exits", async () => {
	const run = fixture();
	const exited = once(run.child, "exit");
	try {
		const listening = (await run.next()) as { fixture: string; port: number };
		expect(await run.next()).toEqual({ schema: protocol, type: "ready" });
		const response = fetch(`http://127.0.0.1:${listening.port}/`);
		expect(await run.next()).toEqual({ fixture: "work-started" });
		run.child.kill("SIGTERM");
		expect(await run.next()).toEqual({ fixture: "close-called", count: 1 });
		const disconnected = once(run.child, "disconnect");
		run.child.send({ fixture: "finish-work" });
		expect((await response).status).toBe(200);
		expect(await run.next()).toEqual({ fixture: "work-finished" });
		await disconnected;
		expect((await exited)[0]).toBe(0);
		expect(run.messages).toEqual([]);
	} finally {
		if (run.child.exitCode === null) {
			run.child.kill("SIGKILL");
			await exited;
		}
	}
});

test("disconnect during held drain logs acknowledgement loss without uncaught IPC error", async () => {
	const run = fixture("none", true);
	const exited = once(run.child, "exit");
	try {
		const listening = (await run.next()) as { fixture: string; port: number };
		expect(await run.next()).toEqual({ schema: protocol, type: "ready" });
		const response = fetch(`http://127.0.0.1:${listening.port}/`);
		expect(await run.next()).toEqual({ fixture: "work-started" });
		run.child.send({ schema: protocol, type: "stop" });
		expect(await run.next()).toEqual({ fixture: "close-called", count: 1 });
		const disconnected = once(run.child, "disconnect");
		run.child.disconnect();
		await disconnected;
		// The child's disconnect event releases the already-admitted HTTP request.
		const status = await response;
		expect(status.status).toBe(200);
		expect((await exited)[0]).toBe(1);
		expect(run.stderr()).toContain("NATIVE_IPC_ACK_FAILED: disconnected");
		expect(run.stderr()).not.toContain("ERR_IPC_DISCONNECTED");
	} finally {
		if (run.child.exitCode === null) {
			run.child.kill("SIGKILL");
			await exited;
		}
	}
});

test("close rejection with a live listener reports failure but does not pretend to exit", async () => {
	const run = fixture("live");
	const exited = once(run.child, "exit");
	try {
		const listening = (await run.next()) as { fixture: string; port: number };
		expect(await run.next()).toEqual({ schema: protocol, type: "ready" });
		run.child.send({ schema: protocol, type: "stop" });
		expect(await run.next()).toEqual({ fixture: "close-called", count: 1 });
		expect(await run.next()).toEqual({
			schema: protocol,
			type: "drain-failed",
		});
		const response = fetch(`http://127.0.0.1:${listening.port}/`);
		expect((await response).status).toBe(200);
		expect(
			(await fetch(`http://127.0.0.1:${listening.port}/release`)).status,
		).toBe(200);
		expect(run.child.exitCode).toBeNull();
		expect(run.stderr()).toContain("NATIVE_DRAIN_FAILED");
	} finally {
		if (run.child.exitCode === null) run.child.kill("SIGKILL");
		await exited;
	}
});

for (const order of ["SIGTERM-SIGINT", "SIGINT-SIGTERM"] as const) {
	test(`pending close failure after both signals ${order} emits one terminal ack`, async () => {
		const run = fixture("pending");
		const exited = once(run.child, "exit");
		try {
			const listening = (await run.next()) as { fixture: string; port: number };
			expect(await run.next()).toEqual({ schema: protocol, type: "ready" });
			const [first, second] = order.split("-") as [
				"SIGTERM" | "SIGINT",
				"SIGTERM" | "SIGINT",
			];
			run.child.kill(first);
			expect(await run.next()).toEqual({
				fixture: "signal-observed",
				signal: first,
			});
			expect(await run.next()).toEqual({ fixture: "close-called", count: 1 });
			run.child.kill(second);
			// Observe the second signal event before rejecting the pending close.
			const secondObserved = await run.next();
			expect(secondObserved).toEqual({
				fixture: "signal-observed",
				signal: second,
			});
			run.child.send({ fixture: "reject-close" });
			expect(await run.next()).toEqual({
				schema: protocol,
				type: "drain-failed",
			});
			const response = fetch(`http://127.0.0.1:${listening.port}/`);
			expect((await response).status).toBe(200);
			expect(
				(await fetch(`http://127.0.0.1:${listening.port}/release`)).status,
			).toBe(200);
			expect(run.child.exitCode).toBeNull();
			expect(run.messages).toEqual([]);
			expect(run.stderr()).toContain("NATIVE_DRAIN_FAILED");
		} finally {
			if (run.child.exitCode === null) run.child.kill("SIGKILL");
			await exited;
		}
	});
}
