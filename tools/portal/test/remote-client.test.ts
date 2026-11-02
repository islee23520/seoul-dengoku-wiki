import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import {
	chmod,
	mkdtemp,
	readdir,
	readFile,
	rm,
	stat,
	writeFile,
} from "node:fs/promises";
import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	createRemoteClient,
	ownerOrigin,
	remoteServer,
} from "../src/remote-client.ts";

async function fixture(
	handler?: (
		req: IncomingMessage,
		res: ServerResponse,
		body: string,
	) => Promise<boolean>,
) {
	const directory = await mkdtemp(join(tmpdir(), "ssstool-http-"));
	let sessions = 0;
	let outbound = 0;
	const requests: {
		path: string;
		method: string;
		cookie: string;
		origin: string;
		csrf: string;
	}[] = [];
	const server = createServer(async (req, res) => {
		let body = "";
		for await (const chunk of req) body += String(chunk);
		const path = req.url ?? "";
		requests.push({
			path,
			method: req.method ?? "",
			cookie: String(req.headers.cookie ?? ""),
			origin: String(req.headers.origin ?? ""),
			csrf: String(req.headers["x-csrf-token"] ?? ""),
		});
		if (req.method === "POST" && path === "/tools/api/generations") outbound++;
		if (handler && (await handler(req, res, body))) return;
		res.setHeader("content-type", "application/json");
		if (path === "/tools/api/auth/session") {
			sessions++;
			res.setHeader(
				"set-cookie",
				`portal_session=fresh-${sessions}; HttpOnly; Secure; Path=/tools/`,
			);
			res.end(
				JSON.stringify({ authenticated: true, csrfToken: `csrf-${sessions}` }),
			);
		} else if (path === "/tools/api/connections") {
			res.end(
				JSON.stringify({
					connection: {
						connectionId: "11111111-1111-4111-8111-111111111111",
						state: "READY",
					},
				}),
			);
		} else if (path === "/tools/api/auth/logout") {
			res.end('{"authenticated":false}');
		} else {
			res.end('{"ok":true}');
		}
	});
	const listening = once(server, "listening");
	server.listen(0, "127.0.0.1");
	await listening;
	const address = server.address();
	if (!address || typeof address === "string")
		throw new Error("missing address");
	const networkFetch = (input: string | URL | Request, init?: RequestInit) => {
		const target = new URL(String(input));
		return fetch(
			`http://127.0.0.1:${address.port}${target.pathname}${target.search}`,
			init,
		);
	};
	const options = {
		serverUrl: `${ownerOrigin}/tools/`,
		stateDirectory: directory,
		accessToken: async () => "controlled-owner-token",
		fetch: networkFetch,
	};
	return {
		server,
		directory,
		options,
		requests,
		counts: () => ({ sessions, outbound }),
		close: async () => {
			const closed = once(server, "close");
			server.close();
			server.closeAllConnections();
			await closed;
			await rm(directory, { recursive: true, force: true });
		},
	};
}

test("owner origin and base path reject credential or cross-origin targets", () => {
	for (const target of [
		"http://sss.linalab.io/tools/",
		"https://evil.example/tools/",
		"https://sss.linalab.io.evil.example/tools/",
		"https://owner:secret@sss.linalab.io/tools/",
		"https://sss.linalab.io/other/",
		"https://sss.linalab.io/tools/?token=secret",
		"https://sss.linalab.io/tools/#fragment",
	]) {
		expect(() => remoteServer(target)).toThrow("INVALID_SERVER_URL");
	}
});

test("controlled HTTP bootstrap obtains fresh cookie CSRF connection and private session; logout preserves journal", async () => {
	const f = await fixture();
	try {
		const client = createRemoteClient(f.options);
		const session = await client.bootstrap();
		expect(session.cookie).toBe("portal_session=fresh-1");
		expect(session.connection?.state).toBe("READY");
		expect((await stat(join(f.directory, "session.json"))).mode & 0o777).toBe(
			0o600,
		);
		const requestId = randomUUID();
		await client.mutate("/api/generations", {
			requestId,
			personId: "person-0998",
			connectionId: session.connection?.connectionId,
		});
		const sent = f.requests.find((request) => request.method === "POST");
		expect(sent).toMatchObject({
			origin: ownerOrigin,
			cookie: "portal_session=fresh-1",
			csrf: "csrf-1",
		});
		await createRemoteClient(f.options).logout();
		expect(await readdir(f.directory)).toEqual(["journal"]);
		expect((await client.journal(requestId)).requestId).toBe(requestId);
		expect(f.requests.at(-1)).toMatchObject({
			path: "/tools/api/auth/logout",
			cookie: "portal_session=fresh-1",
			csrf: "csrf-1",
		});
	} finally {
		await f.close();
	}
});

test("interrupted real HTTP response leaves durable canonical UUID and payload before the one dispatch; restarted client cannot replay", async () => {
	let persisted: unknown;
	const f = await fixture(async (req, res, body) => {
		if (req.url !== "/tools/api/generations") return false;
		const payload = JSON.parse(body) as { requestId: string };
		persisted = JSON.parse(
			await readFile(
				join(f.directory, "journal", `${payload.requestId}.json`),
				"utf8",
			),
		);
		expect((persisted as { payload: string }).payload).toBe(body);
		expect(
			(await stat(join(f.directory, "journal", `${payload.requestId}.json`)))
				.mode & 0o777,
		).toBe(0o600);
		res.writeHead(200, {
			"content-type": "application/json",
			"content-length": "100",
		});
		res.write('{"partial":');
		res.socket?.destroy();
		return true;
	});
	try {
		const client = createRemoteClient(f.options);
		let requestId = "";
		try {
			await client.mutate("/api/generations", {
				personId: "person-0998",
				nested: { z: 2, a: 1 },
			});
			throw new Error("expected interruption");
		} catch (error) {
			expect(error).toMatchObject({ code: "REMOTE_REQUEST_FAILED" });
			requestId = (error as { requestId: string }).requestId;
		}
		const restarted = createRemoteClient(f.options);
		const entry = await restarted.journal(requestId);
		expect(persisted).toEqual(entry);
		expect(entry.payload).toBe(
			JSON.stringify({
				nested: { a: 1, z: 2 },
				personId: "person-0998",
				requestId,
			}),
		);
		await expect(
			restarted.mutate("/api/generations", JSON.parse(entry.payload)),
		).rejects.toMatchObject({
			code: "MUTATION_ALREADY_DISPATCHED",
			status: 409,
			requestId,
		});
		await expect(
			restarted.mutate("/api/generations", { requestId, personId: "changed" }),
		).rejects.toMatchObject({ code: "REQUEST_CONFLICT", status: 409 });
		const child = Bun.spawn(
			[
				process.execPath,
				"-e",
				`
			import { createRemoteClient } from ${JSON.stringify(new URL("../src/remote-client.ts", import.meta.url).pathname)};
			const client = createRemoteClient({serverUrl:"https://sss.linalab.io/tools/",stateDirectory:${JSON.stringify(f.directory)}});
			const entry = await client.journal(${JSON.stringify(requestId)});
			let code;
			try { await client.mutate("/api/generations", JSON.parse(entry.payload)); } catch (error) { code = error.code; }
			console.log(JSON.stringify({requestId:entry.requestId,payloadSha256:entry.payloadSha256,code}));
		`,
			],
			{ stdout: "pipe", stderr: "pipe" },
		);
		const [stdout, stderr, exitCode] = await Promise.all([
			new Response(child.stdout).text(),
			new Response(child.stderr).text(),
			child.exited,
		]);
		expect(exitCode).toBe(0);
		expect(stderr).toBe("");
		expect(JSON.parse(stdout)).toEqual({
			requestId,
			payloadSha256: entry.payloadSha256,
			code: "MUTATION_ALREADY_DISPATCHED",
		});
		expect(f.counts().outbound).toBe(1);
	} finally {
		await f.close();
	}
});

test("redirect and auth expiry mutations are AUTH_REQUIRED with no refresh or replay", async () => {
	for (const status of [302, 307, 401]) {
		const f = await fixture(async (req, res) => {
			if (req.url !== "/tools/api/generations") return false;
			res.writeHead(status, { location: "https://external.example/access" });
			res.end();
			return true;
		});
		try {
			const client = createRemoteClient(f.options);
			const requestId = randomUUID();
			await expect(
				client.mutate("/api/generations", { requestId }),
			).rejects.toMatchObject({ code: "AUTH_REQUIRED", status, requestId });
			expect(f.counts()).toEqual({ sessions: 1, outbound: 1 });
			await client.bootstrap();
			await expect(
				client.mutate("/api/generations", { requestId }),
			).rejects.toMatchObject({ code: "MUTATION_ALREADY_DISPATCHED" });
			expect(f.counts()).toEqual({ sessions: 2, outbound: 1 });
		} finally {
			await f.close();
		}
	}
});

test("reads refresh expired authentication once with a fresh session", async () => {
	let reads = 0;
	const f = await fixture(async (req, res) => {
		if (req.url !== "/tools/api/people") return false;
		reads++;
		res.writeHead(reads === 1 ? 401 : 200, {
			"content-type": "application/json",
		});
		res.end(
			reads === 1
				? '{"error":{"code":"AUTHENTICATION_REQUIRED"}}'
				: '{"people":[]}',
		);
		return true;
	});
	try {
		expect(await createRemoteClient(f.options).read("/api/people")).toEqual({
			people: [],
		});
		expect(f.counts()).toEqual({ sessions: 2, outbound: 0 });
		expect(f.requests.at(-1)?.cookie).toBe("portal_session=fresh-2");
	} finally {
		await f.close();
	}
});

test("timeout subscribed to request start leaves one mutation journal and cannot replay", async () => {
	const f = await fixture(async (req) => {
		if (req.url !== "/tools/api/generations") return false;
		return true;
	});
	try {
		const client = createRemoteClient({ ...f.options, timeoutMs: 1000 });
		await client.bootstrap();
		const requestStarted = once(f.server, "request", {
			signal: AbortSignal.timeout(5000),
		});
		const requestId = randomUUID();
		const dispatched = expect(
			client.mutate("/api/generations", { requestId }),
		).rejects.toMatchObject({ code: "REMOTE_REQUEST_FAILED", requestId });
		await requestStarted;
		await dispatched;
		await expect(
			client.mutate("/api/generations", { requestId }),
		).rejects.toMatchObject({ code: "MUTATION_ALREADY_DISPATCHED" });
		expect(f.counts().outbound).toBe(1);
	} finally {
		await f.close();
	}
});

test("concurrent duplicate UUID has one outbound and conflicting path is rejected", async () => {
	const f = await fixture();
	try {
		const client = createRemoteClient(f.options);
		await client.bootstrap();
		const requestId = randomUUID();
		const results = await Promise.allSettled([
			client.mutate("/api/generations", { requestId }),
			client.mutate("/api/generations", { requestId }),
		]);
		expect(
			results.filter((result) => result.status === "fulfilled"),
		).toHaveLength(1);
		expect(f.counts().outbound).toBe(1);
		await expect(
			client.mutate("/api/batches", { requestId }),
		).rejects.toMatchObject({ code: "REQUEST_CONFLICT" });
	} finally {
		await f.close();
	}
});

test("public state and invalid paths are rejected before network dispatch", async () => {
	const f = await fixture();
	try {
		const client = createRemoteClient(f.options);
		await expect(client.mutate("/outside", {})).rejects.toMatchObject({
			code: "INVALID_PARAMS",
		});
		await chmod(f.directory, 0o755);
		await expect(client.bootstrap()).rejects.toMatchObject({
			code: "PRIVATE_STATE_REQUIRED",
		});
		expect(f.requests).toHaveLength(0);
	} finally {
		await f.close();
	}
});

test("controlled HTTP error codes preserve exact status without mutation refresh or replay", async () => {
	for (const [status, code] of [
		[403, "CSRF_INVALID"],
		[409, "REQUEST_CONFLICT"],
		[409, "JOB_RUNNING"],
		[503, "CONNECTION_REVOKED"],
	] as const) {
		const f = await fixture(async (req, res) => {
			if (req.url !== "/tools/api/generations") return false;
			res.writeHead(status, { "content-type": "application/json" });
			res.end(JSON.stringify({ error: { code } }));
			return true;
		});
		try {
			const client = createRemoteClient(f.options);
			const requestId = randomUUID();
			await expect(
				client.mutate("/api/generations", { requestId }),
			).rejects.toMatchObject({ code, status, requestId });
			await expect(
				client.mutate("/api/generations", { requestId }),
			).rejects.toMatchObject({
				code: "MUTATION_ALREADY_DISPATCHED",
				status: 409,
			});
			expect(f.counts()).toEqual({ sessions: 1, outbound: 1 });
		} finally {
			await f.close();
		}
	}
});

test("tampered journal and nonprivate stored session fail closed without dispatch", async () => {
	const f = await fixture();
	try {
		const client = createRemoteClient(f.options);
		const requestId = randomUUID();
		await client.mutate("/api/generations", { requestId });
		const journal = await client.journal(requestId);
		await writeFile(
			join(f.directory, "journal", `${requestId}.json`),
			JSON.stringify({ ...journal, payload: "{}" }),
		);
		await expect(
			createRemoteClient(f.options).mutate("/api/generations", { requestId }),
		).rejects.toMatchObject({ code: "INVALID_JOURNAL" });
		await chmod(join(f.directory, "session.json"), 0o644);
		await expect(
			createRemoteClient(f.options).read("/api/people"),
		).rejects.toMatchObject({ code: "PRIVATE_STATE_REQUIRED" });
		expect(f.counts()).toEqual({ sessions: 1, outbound: 1 });
	} finally {
		await f.close();
	}
});
