import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { client, fixture, toolResultSchema } from "./mcp-management.test.ts";

const nodeBinaryKey = "NODE_BINARY",
	pathKey = "PATH";
const node = process.env[nodeBinaryKey] ?? "node";

test("reviewed private release runs with Node from unrelated directory and serves exact assets", async () => {
	const root = await mkdtemp(join(tmpdir(), "portal-release-"));
	const source = fileURLToPath(new URL("../dist/", import.meta.url));
	const release = join(root, "service");
	await cp(source, release, { recursive: true });
	const manifest = z
		.object({
			artifacts: z.array(z.object({ path: z.string(), sha256: z.string() })),
		})
		.parse(
			JSON.parse(
				await readFile(join(release, "release-manifest.json"), "utf8"),
			),
		);
	expect(manifest.artifacts.map((x) => x.path).sort()).toEqual(
		[
			"server.mjs",
			"cli.mjs",
			"mcp.mjs",
			"public/index.html",
			"public/portal.css",
			"public/portal.mjs",
			"public/tokens.css",
		].sort(),
	);
	for (const item of manifest.artifacts) {
		const bytes = await readFile(join(release, item.path));
		expect(createHash("sha256").update(bytes).digest("hex")).toBe(item.sha256);
	}
	const nodeBinaryKey = "NODE_BINARY";
	const pathKey = "PATH";
	const child = spawn(
		process.env[nodeBinaryKey] ?? "node",
		[join(release, "server.mjs")],
		{
			cwd: root,
			env: {
				PATH: process.env[pathKey],
				PORTAL_PORT: "0",
				PORTAL_STORAGE_PATH: join(root, "storage"),
			},
			stdio: ["ignore", "pipe", "pipe"],
		},
	);
	const exited = once(child, "exit");
	const ready = new Promise<number>((resolve, reject) => {
		let output = "";
		child.stdout.on("data", (chunk) => {
			output += String(chunk);
			const match = output.match(/PORTAL_READY host=127.0.0.1 port=(\d+)/);
			if (match) resolve(Number(match[1]));
		});
		child.once("error", reject);
		child.once("exit", () => reject(Error("server exited before readiness")));
	});
	try {
		const port = await ready;
		const session = await fetch(
			`http://127.0.0.1:${port}/tools/api/auth/session`,
		);
		expect(session.status).toBe(200);
		expect(await session.json()).toMatchObject({
			authenticated: true,
			mode: "local",
			user: { id: "1", login: "local" },
		});
		expect(session.headers.get("set-cookie")).toContain("HttpOnly");
		for (const path of [
			"/tools/",
			"/tools/portal.css",
			"/tools/portal.mjs",
			"/tools/tokens.css",
			"/tools/api/status",
		]) {
			const response = await fetch(`http://127.0.0.1:${port}${path}`);
			expect(response.status).toBe(200);
		}
		const css = await (
			await fetch(`http://127.0.0.1:${port}/tools/tokens.css`)
		).text();
		expect(css).toBe(
			await readFile(
				new URL("../../shared-web-ui/src/tokens.css", import.meta.url),
				"utf8",
			),
		);
	} finally {
		child.kill("SIGTERM");
		await exited;
		await rm(root, { recursive: true, force: true });
	}
}, 20000);

test("stdio returns redacted parse errors when malformed JSON arrives", async () => {
	// Given
	const cwd = await fixture();
	const mcp = client(cwd);
	const lines = createInterface({ input: mcp.child.stdout });
	try {
		await mcp.initialize();
		const answered = once(lines, "line", { signal: AbortSignal.timeout(5000) });
		// When
		mcp.child.stdin.write("{private-canary\n");
		const [line] = await answered;
		// Then
		expect(JSON.parse(line)).toEqual({
			jsonrpc: "2.0",
			id: null,
			error: { code: -32700, message: "PARSE_ERROR" },
		});
	} finally {
		lines.close();
		await mcp.close();
		await rm(cwd, { recursive: true, force: true });
	}
});

test("release manifest includes verified private CLI and server artifacts", async () => {
	// Given
	const dist = fileURLToPath(new URL("../dist/", import.meta.url));
	const manifest = z
		.object({
			privateFiles: z.array(z.string()),
			publicFiles: z.array(z.string()),
			artifacts: z.array(
				z.object({ path: z.string(), bytes: z.number(), sha256: z.string() }),
			),
		})
		.parse(
			JSON.parse(await readFile(join(dist, "release-manifest.json"), "utf8")),
		);
	// When
	const artifacts = await Promise.all(
		manifest.artifacts
			.filter((item) => manifest.privateFiles.includes(item.path))
			.map(async (item) => ({
				item,
				bytes: await readFile(join(dist, item.path)),
			})),
	);
	// Then
	expect(manifest.privateFiles).toEqual(["server.mjs", "cli.mjs", "mcp.mjs"]);
	expect(manifest.publicFiles).not.toContain("cli.mjs");
	expect(manifest.publicFiles).not.toContain("mcp.mjs");
	for (const { item, bytes } of artifacts) {
		expect(item.bytes).toBe(bytes.length);
		expect(item.sha256).toBe(createHash("sha256").update(bytes).digest("hex"));
	}
});

test("MCP stop closes the real capability-owned CLI portal while keeping stdio alive", async () => {
	// Given
	const cwd = await fixture();
	await writeFile(
		join(cwd, "portal.env"),
		`PORTAL_PORT=0\nPORTAL_STORAGE_PATH=${join(cwd, "storage")}\n`,
	);
	const command = [
		join(cwd, "release/cli.mjs"),
		"start",
		"--env-file",
		"portal.env",
	];
	const child = spawn(node, command, {
		cwd,
		env: { PATH: process.env[pathKey] },
		stdio: ["ignore", "pipe", "pipe"],
	});
	const exited = once(child, "exit", { signal: AbortSignal.timeout(15000) });
	const ready = new Promise<void>((resolve, reject) => {
		let buffer = "";
		child.stderr.on("data", (chunk) => {
			buffer += String(chunk);
			if (/PORTAL_READY port=\d+/.test(buffer)) resolve();
		});
		child.once("error", reject);
		child.once("exit", () => reject(new Error("CLI exited before ready")));
		AbortSignal.timeout(10000).addEventListener(
			"abort",
			() => reject(new Error("readiness timeout")),
			{ once: true },
		);
	});
	const mcp = client(cwd);
	try {
		await ready;
		await mcp.initialize();
		// When
		const response = await mcp.request("tools/call", {
			name: "stop",
			arguments: { envFile: "portal.env" },
		});
		const stopped = toolResultSchema.parse(response.result);
		const [code] = await exited;
		const ping = await mcp.request("ping");
		// Then
		expect(stopped.structuredContent).toEqual({
			ok: true,
			operation: "stop",
			result: { stopped: true },
		});
		expect(code).toBe(0);
		expect(ping.result).toEqual({});
	} finally {
		if (child.exitCode === null) {
			child.kill("SIGTERM");
			await exited;
		}
		await mcp.close();
		await rm(cwd, { recursive: true, force: true });
	}
}, 20000);
