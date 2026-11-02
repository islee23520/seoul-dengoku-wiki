import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { createRemoteClient, remoteServer } from "../src/remote-client.ts";

function event(
	source: EventEmitter,
	name: string,
	trigger: () => void,
	ms = 10000,
): Promise<unknown[]> {
	return new Promise((resolve, reject) => {
		const clear = () => {
			clearTimeout(timer);
			source.removeListener(name, done);
			source.removeListener("error", fail);
		};
		const done = (...args: unknown[]) => {
			clear();
			resolve(args);
		};
		const fail = (e: Error) => {
			clear();
			reject(e);
		};
		const timer = setTimeout(() => fail(Error(`TEST_TIMEOUT_${name}`)), ms);
		source.once(name, done);
		source.once("error", fail);
		trigger();
	});
}

test("actual CLI and MCP use explicitly selected local auth and GET without cloudflared or URL rewriting", async () => {
	const directory = await mkdtemp(join(tmpdir(), "local-client-cli-mcp-"));
	const requests: string[] = [];
	const server = createServer((req, res) => {
		res.setHeader("connection", "close");
		requests.push(`${req.method} ${req.url}`);
		expect(req.headers["cf-access-token"]).toBeUndefined();
		res.setHeader("content-type", "application/json");
		if (req.url?.endsWith("/auth/session")) {
			res.setHeader("set-cookie", "portal_session=local-fixture; Path=/tools/");
			res.end(JSON.stringify({ authenticated: true, csrfToken: "local" }));
		} else if (req.url?.endsWith("/connections"))
			res.end('{"connection":null}');
		else {
			expect(req.headers.cookie).toBe("portal_session=local-fixture");
			res.end('{"jobs":[],"history":[],"lease":null}');
		}
	});
	try {
		await event(server, "listening", () => server.listen(0, "127.0.0.1"));
		const address = server.address();
		if (!address || typeof address === "string") throw Error("ADDRESS");
		const artifacts: { cli?: string; mcp?: string } = {};
		for (const [name, source] of [
			["cli", "cli.ts"],
			["mcp", "mcp-server.ts"],
		] as const) {
			const built = await Bun.build({
				entrypoints: [new URL(`../src/${source}`, import.meta.url).pathname],
				target: "node",
			});
			expect(built.success).toBe(true);
			const out = built.outputs[0];
			if (!out) throw Error("BUILD");
			artifacts[name] = join(directory, `${name}.mjs`);
			await writeFile(artifacts[name], await out.text());
		}
		const env = {
			PATH: process.env["PATH"] ?? "",
			PORTAL_MODE: "local",
			SSSTOOL_SERVER_URL: `http://127.0.0.1:${address.port}/tools/`,
			SSSTOOL_STATE_DIRECTORY: join(directory, "state"),
		};
		const nodeKey = "NODE_BINARY";
		const node = process.env[nodeKey] ?? "node";
		const cli = spawn(
			node,
			[artifacts.cli ?? "", "jobs", "list", "--format", "json"],
			{ env, stdio: ["ignore", "pipe", "pipe"] },
		);
		let stdout = "",
			stderr = "";
		cli.stdout.on("data", (b) => {
			stdout += String(b);
		});
		cli.stderr.on("data", (b) => {
			stderr += String(b);
		});
		try {
			const [code, signal] = await event(cli, "close", () => {});
			expect([code, signal]).toEqual([0, null]);
			expect(JSON.parse(stdout)).toMatchObject({
				ok: true,
				operation: "jobs.list",
				result: { jobs: [] },
			});
			expect(stderr).toBe("");
		} catch (error) {
			throw new Error(
				`${String(error)} stdout=${stdout} stderr=${stderr} requests=${JSON.stringify(requests)}`,
			);
		} finally {
			if (cli.exitCode === null && cli.signalCode === null)
				await event(cli, "close", () => {
					cli.kill("SIGKILL");
				});
		}
		const mcp = spawn(node, [artifacts.mcp ?? ""], {
			env,
			stdio: ["pipe", "pipe", "pipe"],
		});
		const replies = new EventEmitter();
		const lines = createInterface({ input: mcp.stdout });
		lines.on("line", (line) => {
			const value = JSON.parse(line);
			replies.emit(String(value.id), value);
		});
		let id = 0;
		const rpc = async (method: string, params: unknown) => {
			const serial = ++id;
			return (
				await event(replies, String(serial), () =>
					mcp.stdin.write(
						`${JSON.stringify({ jsonrpc: "2.0", id: serial, method, params })}\n`,
					),
				)
			)[0] as {
				result: {
					structuredContent: { ok: boolean; result: { jobs: unknown[] } };
				};
			};
		};
		try {
			await rpc("initialize", {
				protocolVersion: "2025-11-25",
				capabilities: {},
				clientInfo: { name: "local-test", version: "1" },
			});
			mcp.stdin.write(
				'{"jsonrpc":"2.0","method":"notifications/initialized"}\n',
			);
			const value = await rpc("tools/call", {
				name: "jobs.list",
				arguments: {},
			});
			expect(value.result.structuredContent).toMatchObject({
				ok: true,
				result: { jobs: [] },
			});
			const status = await event(mcp, "close", () => mcp.stdin.end());
			expect(status).toEqual([0, null]);
		} finally {
			lines.close();
			if (mcp.exitCode === null && mcp.signalCode === null)
				await event(mcp, "close", () => {
					mcp.kill("SIGKILL");
				});
		}
		expect(requests).toContain("GET /tools/api/auth/session");
		expect(requests.filter((r) => r === "GET /tools/api/jobs")).toHaveLength(2);
		expect(requests.every((r) => r.startsWith("GET "))).toBe(true);
	} finally {
		server.closeAllConnections();
		await new Promise<void>((resolve) => server.close(() => resolve()));
		await rm(directory, { recursive: true, force: true });
	}
}, 30000);

test("explicit local URL accepts only canonical loopback while remote owner origin stays fixed", () => {
	for (const host of ["127.0.0.1", "localhost", "[::1]"]) {
		const url = `http://${host}:54717/tools/`;
		expect(remoteServer(url, true).href).toBe(url);
		expect(() => remoteServer(url)).toThrow("INVALID_SERVER_URL");
	}
	expect(
		remoteServer("http://127.0.0.1:54717/private/tools/", true).pathname,
	).toBe("/private/tools/");
	expect(remoteServer("https://sss.linalab.io/tools/").origin).toBe(
		"https://sss.linalab.io",
	);
	for (const url of [
		"http://192.168.1.2:54717/tools/",
		"http://sss.linalab.io:54717/tools/",
		"http://127.0.0.1.evil.test:54717/tools/",
		"http://owner@127.0.0.1:54717/tools/",
		"http://localhost:65536/tools/",
		"http://localhost/tools/",
		"http://localhost:54717/tools/?x=1",
		"http://localhost:54717/tools/#x",
		"http://127.1:54717/tools/",
		"http://2130706433:54717/tools/",
		"http://localhost:54717/a/../tools/",
		"http://localhost:54717/tools/%2e%2e/",
	]) {
		expect(() => remoteServer(url, true)).toThrow("INVALID_SERVER_URL");
	}
});

test("local session sends no remote assertion, binds exact origin and refuses redirect and session reuse", async () => {
	const directory = await mkdtemp(join(tmpdir(), "local-client-binding-"));
	const calls: { url: string; headers: Headers; redirect: unknown }[] = [];
	let redirect = false;
	const options = {
		serverUrl: "http://127.0.0.1:54717/tools/",
		local: true,
		stateDirectory: directory,
		accessToken: async () => {
			throw Error("REMOTE_CREDENTIAL_REQUESTED");
		},
		fetch: async (input: string | URL | Request, init?: RequestInit) => {
			calls.push({
				url: String(input),
				headers: new Headers(init?.headers),
				redirect: init?.redirect,
			});
			if (redirect)
				return new Response(null, {
					status: 302,
					headers: { location: "https://evil.test" },
				});
			if (String(input).endsWith("/auth/session"))
				return Response.json(
					{ authenticated: true, csrfToken: "fixture" },
					{ headers: { "set-cookie": "portal_session=fixture; Path=/tools/" } },
				);
			if (String(input).endsWith("/connections"))
				return Response.json({ connection: null });
			return Response.json({ jobs: [] });
		},
	};
	try {
		const client = createRemoteClient(options);
		expect(await client.read("/api/jobs")).toEqual({ jobs: [] });
		expect(
			calls.every(
				(c) =>
					c.headers.get("origin") === "http://127.0.0.1:54717" &&
					!c.headers.has("cf-access-token") &&
					c.redirect === "manual",
			),
		).toBe(true);
		expect(calls.at(-1)?.headers.get("cookie")).toBe("portal_session=fixture");
		await expect(client.read("/api/../../private/file")).rejects.toThrow(
			"INVALID_PARAMS",
		);
		const count = calls.length;
		await expect(
			createRemoteClient({
				...options,
				serverUrl: "http://localhost:54717/tools/",
			}).read("/api/jobs"),
		).rejects.toThrow("INVALID_SERVER_URL");
		expect(calls).toHaveLength(count);
		redirect = true;
		await expect(client.read("/api/jobs")).rejects.toThrow("AUTH_REQUIRED");
		expect(calls.every((c) => c.url.startsWith(options.serverUrl))).toBe(true);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});
