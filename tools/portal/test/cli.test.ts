import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const artifact = fileURLToPath(new URL("../dist/cli.mjs", import.meta.url));
const nodeBinaryKey = "NODE_BINARY",
	pathKey = "PATH";
const node = process.env[nodeBinaryKey] ?? "node";
function launch(context: {
	readonly cwd: string;
	readonly args: readonly string[];
	readonly artifact?: string;
}) {
	const child = spawn(node, [context.artifact ?? artifact, ...context.args], {
		cwd: context.cwd,
		env: { PATH: process.env[pathKey] },
		stdio: ["ignore", "pipe", "pipe"],
	});
	const exited = once(child, "exit", { signal: AbortSignal.timeout(15000) });
	let stdout = "";
	let stderr = "";
	child.stdout.on("data", (chunk) => {
		stdout += String(chunk);
	});
	child.stderr.on("data", (chunk) => {
		stderr += String(chunk);
	});
	return { child, exited, output: () => ({ stdout, stderr }) };
}
async function invoke(context: Parameters<typeof launch>[0]) {
	const run = launch(context);
	const [code] = await run.exited;
	return { code, ...run.output() };
}

test("help succeeds and invalid options fail without echoing inputs", async () => {
	// Given
	const cwd = await mkdtemp(join(tmpdir(), "portal-cli-help-"));
	try {
		// When
		const results = await Promise.all(
			[
				[],
				["help"],
				["--help"],
				["config", "--secret", "private-canary"],
				["unknown-private-canary"],
				["start", "--env-file"],
			].map((args) => invoke({ cwd, args })),
		);
		// Then
		expect(results.map((result) => result.code)).toEqual([0, 0, 0, 1, 1, 1]);
		expect(
			results.map((result) => result.stdout + result.stderr).join(""),
		).not.toContain("private-canary");
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});

test("config reports missing hosted values and redacts supplied secrets", async () => {
	// Given
	const cwd = await mkdtemp(join(tmpdir(), "portal-cli-config-"));
	await writeFile(
		join(cwd, "portal.env"),
		"PORTAL_MODE=hosted\nPORTAL_SESSION_SECRET=super-private-canary-01234567890123456789\nGITHUB_OAUTH_CLIENT_SECRET=oauth-private-canary\n",
	);
	try {
		// When
		const result = await invoke({
			cwd,
			args: ["config", "--env-file", "portal.env"],
		});
		// Then
		expect(result.code).toBe(1);
		expect(JSON.parse(result.stdout).result).toMatchObject({
			mode: "hosted",
			ready: false,
			missingConfig: [
				"PORTAL_PUBLIC_URL",
				"GITHUB_OAUTH_CLIENT_ID",
				"GITHUB_OAUTH_CALLBACK_URL",
				"PORTAL_STORAGE_PATH",
			],
		});
		expect(result.stdout + result.stderr).not.toContain("private-canary");
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});

test("invalid configuration exits nonzero without disclosing URL credentials", async () => {
	// Given
	const cwd = await mkdtemp(join(tmpdir(), "portal-cli-invalid-"));
	await writeFile(
		join(cwd, "portal.env"),
		"PORTAL_MODE=hosted\nPORTAL_PUBLIC_URL=https://owner:private-canary@example.com\n",
	);
	try {
		// When
		const result = await invoke({
			cwd,
			args: ["config", "--env-file", "portal.env"],
		});
		// Then
		expect(result.code).toBe(1);
		expect(result.stdout + result.stderr).not.toContain("private-canary");
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});

test("personal configuration uses the server contract without exposing owner identity", async () => {
	// Given
	const cwd = await mkdtemp(join(tmpdir(), "portal-cli-personal-"));
	await writeFile(
		join(cwd, "portal.env"),
		"PORTAL_MODE=personal\nPORTAL_OWNER_EMAIL=private-canary@example.com\n",
	);
	try {
		// When
		const result = await invoke({
			cwd,
			args: ["config", "--env-file", "portal.env"],
		});
		// Then
		expect(result.code).toBe(1);
		expect(JSON.parse(result.stdout).result.mode).toBe("personal");
		expect(result.stdout + result.stderr).not.toContain("private-canary");
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});

test("portable release starts from unrelated cwd exposes real health and stops only its owned instance", async () => {
	// Given
	const cwd = await mkdtemp(join(tmpdir(), "portal-cli-release-"));
	const release = join(cwd, "release");
	await cp(fileURLToPath(new URL("../dist/", import.meta.url)), release, {
		recursive: true,
	});
	const cli = join(release, "cli.mjs");
	await writeFile(
		join(cwd, "portal.env"),
		`PORTAL_MODE=local\nPORTAL_PORT=0\nPORTAL_STORAGE_PATH=${join(cwd, "storage")}\n`,
	);
	const context = { cwd, artifact: cli, args: ["--env-file", "portal.env"] };
	const run = launch({ ...context, args: ["start", ...context.args] });
	const ready = new Promise<number>((resolve, reject) => {
		const signal = AbortSignal.timeout(10000);
		signal.addEventListener("abort", () => reject(signal.reason), {
			once: true,
		});
		run.child.stderr.on("data", () => {
			const match = run.output().stderr.match(/PORTAL_READY port=(\d+)/);
			if (match) resolve(Number(match[1]));
		});
		run.child.once("error", reject);
		run.child.once("exit", () =>
			reject(new Error("CLI exited before readiness")),
		);
	});
	try {
		const port = await ready;
		// When
		const status = await invoke({
			...context,
			args: ["status", ...context.args],
		});
		const response = await fetch(`http://127.0.0.1:${port}/tools/tokens.css`);
		const secondStart = await invoke({
			...context,
			args: ["start", ...context.args],
		});
		const stop = await invoke({ ...context, args: ["stop", ...context.args] });
		const [exitCode] = await run.exited;
		// Then
		expect(status.code).toBe(0);
		expect(JSON.parse(status.stdout).result.ready).toBe(true);
		expect(response.status).toBe(200);
		expect(await response.text()).toBe(
			await readFile(join(release, "public/tokens.css"), "utf8"),
		);
		expect(secondStart.code).toBe(1);
		expect(stop.code).toBe(0);
		expect(JSON.parse(stop.stdout)).toEqual({
			ok: true,
			operation: "stop",
			result: { stopped: true },
		});
		expect(exitCode).toBe(0);
	} finally {
		if (run.child.exitCode === null) {
			run.child.kill("SIGTERM");
			await run.exited;
		}
		await rm(cwd, { recursive: true, force: true });
	}
}, 20000);

test("stop refuses forged capability without signaling a process", async () => {
	// Given
	const cwd = await mkdtemp(join(tmpdir(), "portal-cli-owned-"));
	const received: string[] = [];
	const server = createServer((req, res) => {
		received.push(req.method ?? "");
		res.writeHead(403).end();
	});
	const listening = once(server, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	server.listen(0, "127.0.0.1");
	await listening;
	const address = server.address();
	if (!address || typeof address === "string")
		throw new Error("fixture address");
	await writeFile(join(cwd, "portal.env"), `PORTAL_STORAGE_PATH=${cwd}\n`);
	await writeFile(
		join(cwd, ".portal-cli.json"),
		JSON.stringify({
			schema: "portal-cli-control.v1",
			port: address.port,
			servicePort: address.port,
			token: "0".repeat(64),
		}),
	);
	try {
		// When
		const result = await invoke({
			cwd,
			args: ["stop", "--env-file", "portal.env"],
		});
		// Then
		expect(result.code).toBe(1);
		expect(server.listening).toBe(true);
		expect(received).toEqual(["POST"]);
	} finally {
		const closed = once(server, "close");
		server.close();
		await closed;
		await rm(cwd, { recursive: true, force: true });
	}
});
