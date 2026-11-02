import { expect, spyOn, test } from "bun:test";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import os, { networkInterfaces, tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { loadConfig, validateLocalBinding } from "../src/config.ts";
import { createPortal } from "../src/server.ts";

const interfaces = {
	lan: [{ address: "192.168.0.218", family: "IPv4", internal: false }],
	tailnet: [{ address: "100.71.30.111", family: "IPv4", internal: false }],
};

test("restricted interface discovery does not block personal or loopback listening", async () => {
	const root = await mkdtemp(join(tmpdir(), "portal-restricted-network-"));
	const discovery = spyOn(os, "networkInterfaces").mockImplementation(() => {
		throw Error("uv_interface_addresses returned Unknown system error 2");
	});
	try {
		for (const mode of ["personal", "local"]) {
			const config = loadConfig({
				PORTAL_MODE: mode,
				PORTAL_HOST: "127.0.0.1",
				PORTAL_PORT: "0",
				PORTAL_STORAGE_PATH: join(root, mode),
			});
			const app = await createPortal(config);
			try {
				const address = await app.listen();
				expect(config.port).toBe(0);
				expect(address.address).toBe(config.host);
				expect(address.port).toBeGreaterThan(0);
				expect(app.server.address()).toEqual(address);
				expect(config.networkAccess).toBe(false);
				expect(config.mdns).toBe(false);
			} finally {
				await app.close();
			}
		}
		expect(discovery).not.toHaveBeenCalled();
		// Prove the stub is active and failure cannot authorize a LAN listener.
		expect(() =>
			loadConfig({
				PORTAL_HOST: "192.168.0.218",
				PORTAL_NETWORK_ACCESS: "true",
			}),
		).toThrow("uv_interface_addresses returned Unknown system error 2");
		expect(discovery).toHaveBeenCalledTimes(1);
	} finally {
		discovery.mockRestore();
		await rm(root, { recursive: true, force: true });
	}
});

test("network and mDNS defaults are disabled; opt-in accepts only owned private IPv4", () => {
	expect(loadConfig({})).toMatchObject({
		host: "127.0.0.1",
		port: 18765,
		networkAccess: false,
		mdns: false,
		localHostname: null,
	});
	for (const host of ["192.168.0.218", "100.71.30.111"])
		expect(() => loadConfig({ PORTAL_HOST: host }, interfaces)).toThrow(
			"INVALID_LOCAL_HOST",
		);
	for (const host of ["0.0.0.0", "8.8.8.8", "192.168.0.219", "::1"])
		expect(() =>
			loadConfig(
				{ PORTAL_NETWORK_ACCESS: "true", PORTAL_HOST: host },
				interfaces,
			),
		).toThrow("INVALID_LOCAL_HOST");
	const config = loadConfig(
		{
			PORTAL_NETWORK_ACCESS: "true",
			PORTAL_HOST: "100.71.30.111",
			PORTAL_LOCAL_HOSTNAME: "portal.local",
		},
		interfaces,
	);
	expect(config).toMatchObject({
		host: "100.71.30.111",
		networkAccess: true,
		localHostname: "portal.local",
		clientId: "",
		clientSecret: "",
	});
	expect(() => validateLocalBinding(config, {})).toThrow("INVALID_LOCAL_HOST");
	for (const value of ["1", "yes", "TRUE"])
		expect(() => loadConfig({ PORTAL_NETWORK_ACCESS: value })).toThrow(
			"INVALID_NETWORK_ACCESS",
		);
});

test("mDNS requires an explicit LAN listener and valid .local name", () => {
	for (const hostname of [
		"evil.example",
		"a.b.local",
		"-bad.local",
		"UPPER.local",
	])
		expect(() =>
			loadConfig(
				{
					PORTAL_NETWORK_ACCESS: "true",
					PORTAL_HOST: "192.168.0.218",
					PORTAL_LOCAL_HOSTNAME: hostname,
				},
				interfaces,
			),
		).toThrow("INVALID_LOCAL_HOSTNAME");
	for (const host of ["127.0.0.1", "100.71.30.111"])
		expect(() =>
			loadConfig(
				{
					PORTAL_NETWORK_ACCESS: host === "127.0.0.1" ? "false" : "true",
					PORTAL_HOST: host,
					PORTAL_LOCAL_HOSTNAME: "portal.local",
					PORTAL_MDNS: "true",
				},
				interfaces,
			),
		).toThrow();
	expect(() =>
		loadConfig(
			{
				PORTAL_NETWORK_ACCESS: "true",
				PORTAL_HOST: "192.168.0.218",
				PORTAL_MDNS: "true",
			},
			interfaces,
		),
	).toThrow("INVALID_MDNS_CONFIG");
	const config = loadConfig(
		{
			PORTAL_NETWORK_ACCESS: "true",
			PORTAL_HOST: "192.168.0.218",
			PORTAL_LOCAL_HOSTNAME: "portal.local",
			PORTAL_MDNS: "true",
		},
		interfaces,
	);
	expect(validateLocalBinding(config, interfaces)).toBe("lan");
});

async function servingFixture(host: string, networkAccess: boolean) {
	const root = await mkdtemp(join(tmpdir(), "portal-network-"));
	let calls = 0;
	const provider = createServer((_req, res) => {
		calls++;
		res.end("{}");
	});
	const providerReady = once(provider, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	provider.listen(0, "127.0.0.1");
	await providerReady;
	const providerAddress = provider.address();
	if (!providerAddress || typeof providerAddress === "string")
		throw Error("address");
	const app = await createPortal(
		loadConfig(
			{
				PORTAL_HOST: networkAccess ? host : "127.0.0.1",
				PORTAL_NETWORK_ACCESS: String(networkAccess),
				...(networkAccess ? { PORTAL_LOCAL_HOSTNAME: "portal.local" } : {}),
				PORTAL_PORT: "0",
				PORTAL_STORAGE_PATH: root,
			},
			interfaces,
		),
	);
	const ready = once(app.server, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	// Socket fixture uses loopback; security contract is exercised with exact wire Host.
	app.server.listen(0, "127.0.0.1");
	await ready;
	const address = app.server.address();
	if (!address || typeof address === "string") throw Error("address");
	return {
		app,
		port: address.port,
		url: `http://127.0.0.1:${address.port}/tools/api`,
		payload: JSON.stringify({
			baseUrl: `http://127.0.0.1:${providerAddress.port}/v1`,
			apiKey: "explicit-owner-key",
		}),
		calls: () => calls,
		close: async () => {
			await app.close();
			provider.closeAllConnections();
			await new Promise<void>((resolve) => provider.close(() => resolve()));
			await rm(root, { recursive: true, force: true });
		},
	};
}

test("disabled network mode cannot bootstrap remote or forwarded Host authority", async () => {
	const fixture = await servingFixture("127.0.0.1", false);
	try {
		for (const host of ["100.71.30.111", "portal.local", "evil.example"]) {
			const response = await fetch(`${fixture.url}/auth/session`, {
				headers: {
					host: `${host}:${fixture.port}`,
					"x-forwarded-host": `127.0.0.1:${fixture.port}`,
				},
			});
			expect(response.status).toBe(403);
			expect(response.headers.get("set-cookie")).toBeNull();
		}
		expect(fixture.calls()).toBe(0);
	} finally {
		await fixture.close();
	}
});

test("owned tailnet IP and .local alias retain boot auth exact Origin CSRF and zero outbound denial", async () => {
	const fixture = await servingFixture("100.71.30.111", true);
	try {
		for (const name of ["100.71.30.111", "portal.local"]) {
			const host = `${name}:${fixture.port}`;
			const origin = `http://${host}`;
			const boot = await fetch(`${fixture.url}/auth/session`, {
				headers: { host, origin },
			});
			expect(boot.status).toBe(200);
			const session = z
				.object({ csrfToken: z.string() })
				.passthrough()
				.parse(await boot.json());
			expect(session).toMatchObject({
				mode: "local",
				user: { id: "1", login: "local" },
			});
			const cookie = boot.headers.get("set-cookie") ?? "";
			expect(cookie).toContain("HttpOnly");
			expect(cookie).toContain("SameSite=Strict");
			const headers = {
				host,
				origin,
				cookie: cookie.split(";")[0] ?? "",
				"x-csrf-token": session.csrfToken,
				"content-type": "application/json",
			};
			for (const overrides of [
				{ host: `evil.example:${fixture.port}` },
				{ host: `127.0.0.1:${fixture.port}` },
				{ host: `${name}:${fixture.port + 1}` },
				{ origin: "https://evil.example" },
				{
					origin: `http://${name === "portal.local" ? "100.71.30.111" : "portal.local"}:${fixture.port}`,
				},
				{ origin: "null" },
				{ "x-csrf-token": "wrong" },
				{ "sec-fetch-site": "cross-site" },
			]) {
				const response = await fetch(`${fixture.url}/connections`, {
					method: "POST",
					headers: {
						...headers,
						...overrides,
						"x-forwarded-host": host,
						"x-forwarded-proto": "http",
					},
					body: fixture.payload,
				});
				expect(response.status).toBe(403);
				expect(response.headers.get("set-cookie")).toBeNull();
			}
			expect(fixture.calls()).toBe(0);
			const connected = await fetch(`${fixture.url}/connections`, {
				method: "POST",
				headers,
				body: fixture.payload,
			});
			expect(connected.status).toBe(201);
			expect(await connected.text()).not.toContain("explicit-owner-key");
			expect(fixture.calls()).toBe(0);
			expect(
				(await fetch(`${fixture.url}/auth/login`, { headers: { host } }))
					.status,
			).toBe(404);
			expect(
				(await fetch(`${fixture.url}/auth/logout`, { method: "POST", headers }))
					.status,
			).toBe(200);
			expect(
				(await fetch(`${fixture.url}/connections`, { headers })).status,
			).toBe(401);
		}
	} finally {
		await fixture.close();
	}
});

test("listen revalidates owned interface membership before opening a socket", async () => {
	const root = await mkdtemp(join(tmpdir(), "portal-unowned-"));
	const occupied = new Set(
		Object.values(networkInterfaces())
			.flat()
			.map((i) => i?.address),
	);
	const host = ["192.168.254.253", "192.168.254.252"].find(
		(ip) => !occupied.has(ip),
	);
	if (!host) throw Error("fixture address unavailable");
	const app = await createPortal(
		loadConfig(
			{
				PORTAL_NETWORK_ACCESS: "true",
				PORTAL_HOST: host,
				PORTAL_STORAGE_PATH: root,
			},
			{ fixture: [{ address: host, family: "IPv4", internal: false }] },
		),
	);
	try {
		await expect(app.listen()).rejects.toThrow("INVALID_LOCAL_HOST");
		expect(app.server.listening).toBe(false);
	} finally {
		await app.close();
		await rm(root, { recursive: true, force: true });
	}
});
