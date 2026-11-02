import { expect, test } from "bun:test";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { once } from "node:events";
import {
	cp,
	lstat,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { createServer, request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import { createAuth } from "../src/auth.ts";
import { loadConfig } from "../src/config.ts";
import { writeNativeMossPackage } from "../src/native-moss-package.ts";
import { createReleasePackage } from "../src/release-package.ts";
import { createPortal } from "../src/server.ts";

const names = [
	"ssstool-manifest.json",
	"ssstool-release.tar",
	"ssstool-release.zip",
] as const;
const hash = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
const environment = {
	PORTAL_MODE: "personal",
	PORTAL_PUBLIC_URL: "https://owner.example/tools",
	PORTAL_OWNER_EMAIL: "owner@example.com",
	PORTAL_ACCESS_ISSUER: "https://fixture.cloudflareaccess.com",
	PORTAL_ACCESS_AUDIENCE: "a".repeat(64),
	PORTAL_SESSION_SECRET: "release-fixture-session-secret".repeat(3),
	PORTAL_TEMPLATE_MANIFEST: "/fixture/manifest.json",
	PORTAL_TEMPLATE_PINS: "/fixture/pins.json",
};
function token(claims: Record<string, unknown> = {}) {
	const encode = (value: unknown) =>
		Buffer.from(JSON.stringify(value)).toString("base64url");
	const data = `${encode({ alg: "RS256", kid: "release-fixture" })}.${encode({
		iss: environment.PORTAL_ACCESS_ISSUER,
		aud: [environment.PORTAL_ACCESS_AUDIENCE],
		email: environment.PORTAL_OWNER_EMAIL,
		exp: 9000000000,
		...claims,
	})}`;
	return `${data}.${sign("RSA-SHA256", Buffer.from(data), pair.privateKey).toString("base64url")}`;
}
async function fixture(overrides: Record<string, string> = {}) {
	const root = await mkdtemp(join(tmpdir(), "portal-release-route-"));
	const dist = join(root, "dist");
	await mkdir(join(dist, "public"), { recursive: true });
	const artifactPaths = [
		"server.mjs",
		"cli.mjs",
		"mcp.mjs",
		"public/index.html",
		"public/portal.css",
		"public/portal.mjs",
		"public/tokens.css",
	];
	for (const [entry, output] of [
		["main.ts", "server.mjs"],
		["cli.ts", "cli.mjs"],
		["mcp-server.ts", "mcp.mjs"],
	]) {
		const built = await Bun.build({
			entrypoints: [fileURLToPath(new URL(`../src/${entry}`, import.meta.url))],
			target: "node",
		});
		if (!built.success || !built.outputs[0])
			throw Error("RELEASE_FIXTURE_BUILD_FAILED");
		await writeFile(
			join(dist, output as string),
			new Uint8Array(await built.outputs[0].arrayBuffer()),
		);
	}
	for (const name of ["index.html", "portal.css", "portal.mjs"])
		await cp(
			fileURLToPath(new URL(`../public/${name}`, import.meta.url)),
			join(dist, "public", name),
		);
	await cp(
		fileURLToPath(
			new URL("../../shared-web-ui/src/tokens.css", import.meta.url),
		),
		join(dist, "public/tokens.css"),
	);
	// Archive integrity fixture: synthetic private style bytes, not style approval.
	for (const person of ["0998", "0399"]) {
		const name = `private/training/shared-target-drawing-v3/images/person-${person}.png`;
		await mkdir(
			join(dist, "private/training/shared-target-drawing-v3/images"),
			{ recursive: true },
		);
		await writeFile(join(dist, name), new Uint8Array([1, 2, 3]));
		artifactPaths.push(name);
	}
	const nativeFiles = await writeNativeMossPackage(
		fileURLToPath(new URL("../native-moss/", import.meta.url)),
		dist,
	);
	artifactPaths.push(...nativeFiles.map((file) => file.path));
	const release = createReleasePackage(
		await Promise.all(
			artifactPaths.map(async (path) => {
				const data = await readFile(join(dist, path));
				return { path, data, bytes: data.length, sha256: hash(data) };
			}),
		),
	);
	await writeFile(join(dist, "ssstool-manifest.json"), release.manifest);
	for (const archive of release.archives)
		await writeFile(join(dist, archive.path), archive.data);
	let providerCalls = 0;
	const upstream = createServer((req, res) => {
		if (req.url === "/cdn-cgi/access/certs") {
			res.setHeader("content-type", "application/json");
			res.end(
				JSON.stringify({
					keys: [
						{
							...pair.publicKey.export({ format: "jwk" }),
							kid: "release-fixture",
							alg: "RS256",
							use: "sig",
						},
					],
				}),
			);
		} else {
			providerCalls++;
			res.writeHead(500).end();
		}
	});
	const upstreamReady = once(upstream, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	upstream.listen(0, "127.0.0.1");
	await upstreamReady;
	const upstreamAddress = upstream.address();
	if (!upstreamAddress || typeof upstreamAddress === "string")
		throw Error("INVALID_ADDRESS");
	const config = loadConfig({
		...environment,
		PORTAL_STORAGE_PATH: join(root, "storage"),
		PORTAL_PORT: "0",
		PORTAL_PUBLIC_PATH: join(dist, "public"),
		PORTAL_PERSONAL_PROVIDER_URL: `http://127.0.0.1:${upstreamAddress.port}/v1`,
		PORTAL_PERSONAL_PROVIDER_KEY: "release-private-provider-canary",
		...overrides,
	});
	const canonical = createTransportFixture();
	const app = await createPortal(config, {
		template: {
			candidate: canonical.candidate,
			operatorPins: canonical.operatorPins,
		},
		accessFetch: async (url, init) => {
			expect(url).toBe(
				`${environment.PORTAL_ACCESS_ISSUER}/cdn-cgi/access/certs`,
			);
			return fetch(
				`http://127.0.0.1:${upstreamAddress.port}/cdn-cgi/access/certs`,
				init,
			);
		},
	});
	const ready = once(app.server, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	app.server.listen(0, "127.0.0.1");
	await ready;
	const address = app.server.address();
	if (!address || typeof address === "string") throw Error("INVALID_ADDRESS");
	const get = (path: string, init: RequestInit = {}) =>
		fetch(`http://127.0.0.1:${address.port}${path}`, {
			...init,
			redirect: "manual",
			signal: AbortSignal.timeout(5000),
			headers: {
				host: "owner.example",
				...Object.fromEntries(new Headers(init.headers)),
			},
		});
	const access = { "cf-access-jwt-assertion": token() };
	const boot = await get(`${config.basePath}/api/auth/session`, {
		headers: access,
	});
	expect(boot.status).toBe(200);
	const session = (await boot.json()) as { csrfToken: string };
	const headers = {
		...access,
		cookie: (boot.headers.get("set-cookie") ?? "").split(";")[0] ?? "",
		origin: "https://owner.example",
		"x-csrf-token": session.csrfToken,
	};
	const raw = (path: string) =>
		new Promise<number>((resolve, reject) => {
			const req = request(
				{
					hostname: "127.0.0.1",
					port: address.port,
					path,
					headers: {
						...headers,
						host: "owner.example",
					},
				},
				(res) => {
					res.resume();
					res.once("end", () => resolve(res.statusCode ?? 0));
				},
			);
			req.once("error", reject);
			req.setTimeout(5000, () => req.destroy(Error("HTTP_TIMEOUT")));
			req.end();
		});
	return {
		root,
		dist,
		config,
		app,
		get,
		raw,
		headers,
		providerCalls: () => providerCalls,
		close: async () => {
			await app.close();
			const closed = once(upstream, "close", {
				signal: AbortSignal.timeout(5000),
			});
			upstream.close();
			upstream.closeIdleConnections();
			await closed;
			await rm(root, { recursive: true, force: true });
			expect(await lstat(root).catch(() => null)).toBeNull();
		},
	};
}

test("owner release GET and HEAD serve exact current build bytes and hashes without generation", async () => {
	const f = await fixture();
	try {
		for (const name of names) {
			const bytes = await readFile(join(f.dist, name));
			const response = await f.get(`/tools/api/releases/${name}`, {
				headers: f.headers,
			});
			expect(response.status).toBe(200);
			expect(Buffer.from(await response.arrayBuffer())).toEqual(bytes);
			expect(response.headers.get("x-artifact-sha256")).toBe(hash(bytes));
			expect(response.headers.get("content-length")).toBe(String(bytes.length));
			expect(response.headers.get("cache-control")).toBe("no-store");
			expect(response.headers.get("x-content-type-options")).toBe("nosniff");
			expect(response.headers.get("content-disposition")).toBe(
				`attachment; filename="${name}"`,
			);
			const head = await f.get(`/tools/api/releases/${name}`, {
				method: "HEAD",
				headers: f.headers,
			});
			expect(head.status).toBe(200);
			expect(await head.text()).toBe("");
			expect(head.headers.get("x-artifact-sha256")).toBe(hash(bytes));
		}
		expect(f.providerCalls()).toBe(0);
		expect(await readdir(join(f.root, "storage"))).toEqual([]);
	} finally {
		await f.close();
	}
});

test("release routes preserve Access signature, owner, session, host and origin checks", async () => {
	const f = await fixture();
	try {
		for (const name of names) {
			const path = `/tools/api/releases/${name}`;
			for (const assertion of ["", token({ exp: 1 }), `${token()}forged`]) {
				const response = await f.get(path, {
					headers: { ...f.headers, "cf-access-jwt-assertion": assertion },
				});
				expect(response.status).toBe(401);
				expect(response.headers.get("set-cookie")).toBeNull();
			}
			expect((await f.get(path)).status).toBe(401);
			expect(
				(
					await f.get(path, {
						headers: {
							...f.headers,
							"cf-access-jwt-assertion": token({ email: "other@example.com" }),
						},
					})
				).status,
			).toBe(403);
			for (const cookie of [
				"",
				"portal_session=forged",
				`portal_session=${createAuth(f.config).issue({ id: "2", login: environment.PORTAL_OWNER_EMAIL })}`,
			])
				expect(
					(await f.get(path, { headers: { ...f.headers, cookie } })).status,
				).toBe(401);
			for (const overrides of [
				{ host: "evil.example" },
				{ origin: "https://evil.example" },
				{ "sec-fetch-site": "cross-site" },
			])
				expect(
					(await f.get(path, { headers: { ...f.headers, ...overrides } }))
						.status,
				).toBe(403);
		}
		const logout = await f.get("/tools/api/auth/logout", {
			method: "POST",
			headers: f.headers,
		});
		expect(logout.status).toBe(200);
		expect(
			(
				await f.get("/tools/api/releases/ssstool-manifest.json", {
					headers: f.headers,
				})
			).status,
		).toBe(401);
		expect(f.providerCalls()).toBe(0);
	} finally {
		await f.close();
	}
});

test("raw release traversal cannot dispatch normalized sibling routes", async () => {
	const f = await fixture();
	try {
		const paths = [
			"/tools/api/releases/../auth/session",
			"/tools/api/releases/../status",
			"/tools/api/releases/%2e%2e/auth/session",
		];
		const statuses = [];
		for (const path of paths) statuses.push(await f.raw(path));
		expect(statuses).toEqual([404, 404, 404]);
		expect(f.providerCalls()).toBe(0);
		expect(await readdir(join(f.root, "storage"))).toEqual([]);
	} finally {
		await f.close();
	}
});

test("fixed release allowlist rejects traversal, credentials, sources and mutation methods", async () => {
	const f = await fixture();
	try {
		for (const path of [
			"/tools/api/releases/../server.mjs",
			"/tools/api/releases/%2e%2e/server.mjs",
			"/tools/api/releases/%2e%2e%2fserver.mjs",
			"/tools/api/releases/nested/../ssstool-manifest.json",
			"/tools/api/releases/nested/%2e%2e/ssstool-release.tar",
			"/tools/api/releases/ssstool-release.tar/../../portal.env",
			"/tools/api/releases/ssstool-release.tar%00",
			"/tools/api/releases/ssstool-release.tar/",
			"/tools/api/releases/__proto__",
			"/tools/api/releases/constructor",
			"/tools/api/releases/server.mjs",
			"/tools/api/releases/src/server.ts",
			"/tools/api/releases/portal.env",
			"/tools/api/releases/ssstool-manifest.json?path=portal.env",
			"/api/releases/ssstool-manifest.json",
			"/tools-other/api/releases/ssstool-manifest.json",
		])
			expect(await f.raw(path)).toBe(404);
		for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
			expect(
				(
					await f.get("/tools/api/releases/ssstool-release.tar", {
						method,
						headers: f.headers,
					})
				).status,
			).toBe(404);
		expect(f.providerCalls()).toBe(0);
	} finally {
		await f.close();
	}
});

test("release publication rejects stale archives, artifacts, malformed manifests and symlink escape", async () => {
	const f = await fixture();
	try {
		const manifestPath = join(f.dist, "ssstool-manifest.json");
		const originalManifest = await readFile(manifestPath);
		for (const file of [
			"ssstool-release.tar",
			"ssstool-release.zip",
			"cli.mjs",
			"private/native-moss/job.py",
		]) {
			const path = join(f.dist, file);
			const original = await readFile(path);
			await writeFile(path, "private-tamper-canary");
			for (const name of names) {
				const response = await f.get(`/tools/api/releases/${name}`, {
					headers: f.headers,
				});
				expect(response.status).toBe(503);
				expect(await response.text()).toBe(
					'{"error":{"code":"RELEASE_INVALID"}}',
				);
			}
			await writeFile(path, original);
		}
		const missing = join(f.dist, "private/native-moss/runtime.py");
		const saved = await readFile(missing);
		await rm(missing);
		expect(
			(
				await f.get("/tools/api/releases/ssstool-manifest.json", {
					headers: f.headers,
				})
			).status,
		).toBe(503);
		await writeFile(missing, saved);
		for (const value of [
			"{private-malformed-canary",
			JSON.stringify({
				...JSON.parse(originalManifest.toString()),
				releaseId: "0".repeat(64),
			}),
			JSON.stringify({
				...JSON.parse(originalManifest.toString()),
				artifacts: [],
			}),
		]) {
			await writeFile(manifestPath, value);
			expect(
				(
					await f.get("/tools/api/releases/ssstool-manifest.json", {
						headers: f.headers,
					})
				).status,
			).toBe(503);
		}
		await writeFile(manifestPath, originalManifest);
		const archive = join(f.dist, "ssstool-release.tar");
		const original = await readFile(archive);
		const privateFile = join(f.root, "private.env");
		await writeFile(privateFile, "private-credential-canary");
		await rm(archive);
		await symlink(privateFile, archive);
		expect(
			(
				await f.get("/tools/api/releases/ssstool-release.tar", {
					headers: f.headers,
				})
			).status,
		).toBe(503);
		await rm(archive);
		await writeFile(archive, original);
		expect(
			(
				await f.get("/tools/api/releases/ssstool-release.tar", {
					headers: f.headers,
				})
			).status,
		).toBe(200);
		expect(f.providerCalls()).toBe(0);
	} finally {
		await f.close();
	}
});

test("release routes honor the configured mount prefix and remain private to personal mode", async () => {
	const f = await fixture({
		PORTAL_BASE_PATH: "/private/tools",
		PORTAL_PUBLIC_URL: "https://owner.example/private/tools",
	});
	try {
		expect(
			(
				await f.get("/private/tools/api/releases/ssstool-manifest.json", {
					headers: f.headers,
				})
			).status,
		).toBe(200);
		expect(
			(
				await f.get("/tools/api/releases/ssstool-manifest.json", {
					headers: f.headers,
				})
			).status,
		).toBe(404);
		expect(f.providerCalls()).toBe(0);
	} finally {
		await f.close();
	}
	const root = await mkdtemp(join(tmpdir(), "portal-release-local-"));
	const app = await createPortal(
		loadConfig({ PORTAL_MODE: "local", PORTAL_STORAGE_PATH: root }),
	);
	try {
		const address = await app.listen();
		const origin = `http://127.0.0.1:${address.port}`;
		const boot = await fetch(`${origin}/tools/api/auth/session`);
		const cookie = (boot.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
		expect(
			(
				await fetch(`${origin}/tools/api/releases/ssstool-manifest.json`, {
					headers: { cookie },
				})
			).status,
		).toBe(404);
	} finally {
		await app.close();
		await rm(root, { recursive: true, force: true });
	}
});
