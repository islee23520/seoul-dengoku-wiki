import { expect, test } from "bun:test";
import { generateKeyPairSync, sign } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import { loadConfig } from "../src/config.ts";
import { invokeManagement, redactError } from "../src/management.ts";
import { createRemoteClient, RemoteClientError } from "../src/remote-client.ts";
import { createPortal } from "../src/server.ts";

test("remote configuration needs no server secrets and refuses unowned stop", async () => {
	const directory = await mkdtemp(join(tmpdir(), "ssstool-remote-"));
	const envFile = join(directory, "client.env");
	try {
		await writeFile(
			envFile,
			"SSSTOOL_SERVER_URL=https://sss.linalab.io/tools/\n",
		);
		expect(await invokeManagement("config", { envFile })).toEqual({
			ok: true,
			operation: "config",
			result: { mode: "remote", server: "https://sss.linalab.io/tools/" },
		});
		expect(await invokeManagement("stop", { envFile })).toEqual({
			ok: false,
			operation: "stop",
			failures: [{ code: "REMOTE_LIFECYCLE_NOT_OWNED" }],
		});
		await writeFile(
			envFile,
			"SSSTOOL_SERVER_URL=https://owner:secret@example.com/tools/\n",
		);
		expect(await invokeManagement("config", { envFile })).toEqual({
			ok: false,
			operation: "config",
			failures: [{ code: "INVALID_SERVER_URL" }],
		});
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});

test("real personal portal HTTP handlers bootstrap owner session and CSRF and revoke only that session", async () => {
	const directory = await mkdtemp(join(tmpdir(), "ssstool-portal-auth-"));
	const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
	const issuer = "https://fixture.cloudflareaccess.com";
	const audience = "a".repeat(64);
	const encode = (value: unknown) =>
		Buffer.from(JSON.stringify(value)).toString("base64url");
	const claims = `${encode({ alg: "RS256", kid: "owner-fixture" })}.${encode({ iss: issuer, aud: [audience], email: "owner@example.com", exp: 9000000000 })}`;
	const assertion = `${claims}.${sign("RSA-SHA256", Buffer.from(claims), pair.privateKey).toString("base64url")}`;
	const template = createTransportFixture();
	const config = loadConfig({
		PORTAL_MODE: "personal",
		PORTAL_PUBLIC_URL: "https://sss.linalab.io/tools",
		PORTAL_OWNER_EMAIL: "owner@example.com",
		PORTAL_ACCESS_ISSUER: issuer,
		PORTAL_ACCESS_AUDIENCE: audience,
		PORTAL_SESSION_SECRET: "fixture-only-session-secret".repeat(3),
		PORTAL_TEMPLATE_MANIFEST: "/fixture/manifest.json",
		PORTAL_TEMPLATE_PINS: "/fixture/pins.json",
		PORTAL_STORAGE_PATH: join(directory, "server"),
		PORTAL_PORT: "0",
	});
	const app = await createPortal(config, {
		template: {
			candidate: template.candidate,
			operatorPins: template.operatorPins,
		},
		accessFetch: async () =>
			Response.json({
				keys: [
					{
						...pair.publicKey.export({ format: "jwk" }),
						kid: "owner-fixture",
						alg: "RS256",
						use: "sig",
					},
				],
			}),
	});
	try {
		const listening = once(app.server, "listening", {
			signal: AbortSignal.timeout(5000),
		});
		app.server.listen(0, "127.0.0.1");
		await listening;
		const address = app.server.address();
		if (!address || typeof address === "string")
			throw new Error("missing address");
		const networkFetch = (
			input: string | URL | Request,
			init?: RequestInit,
		) => {
			const url = new URL(String(input));
			return fetch(`http://127.0.0.1:${address.port}${url.pathname}`, {
				...init,
				headers: {
					...Object.fromEntries(new Headers(init?.headers)),
					host: "sss.linalab.io",
					"cf-access-jwt-assertion": assertion,
				},
			});
		};
		const options = {
			serverUrl: "https://sss.linalab.io/tools/",
			accessToken: async () => assertion,
			fetch: networkFetch,
		};
		const first = createRemoteClient({
			...options,
			stateDirectory: join(directory, "first"),
		});
		const second = createRemoteClient({
			...options,
			stateDirectory: join(directory, "second"),
		});
		const a = await first.bootstrap();
		const b = await second.bootstrap();
		expect(a.cookie).not.toBe(b.cookie);
		expect(a.csrfToken).not.toBe(b.csrfToken);
		expect(a.connection).toBeNull();
		await first.logout();
		const revoked = await networkFetch(
			"https://sss.linalab.io/tools/api/connections",
			{ headers: { cookie: a.cookie }, redirect: "manual" },
		);
		expect(revoked.status).toBe(401);
		expect(await revoked.json()).toEqual({
			error: { code: "AUTHENTICATION_REQUIRED" },
		});
		expect(await second.read("/api/auth/session")).toMatchObject({
			authenticated: true,
			csrfToken: b.csrfToken,
		});
		const invalid = await networkFetch(
			"https://sss.linalab.io/tools/api/auth/logout",
			{
				method: "POST",
				headers: {
					cookie: b.cookie,
					origin: "https://wrong.example",
					"x-csrf-token": b.csrfToken,
				},
			},
		);
		expect(invalid.status).toBe(403);
		expect(await invalid.json()).toEqual({ error: { code: "ORIGIN_INVALID" } });
		await second.logout();
	} finally {
		await app.close();
		await rm(directory, { recursive: true, force: true });
	}
});

test("remote bootstrap commands expose no cookie, CSRF, assertion, or provider secret in errors", () => {
	expect(
		redactError("login", new RemoteClientError("AUTH_REQUIRED", 302)),
	).toEqual({
		ok: false,
		operation: "login",
		failures: [{ code: "AUTH_REQUIRED", status: 302 }],
	});
	expect(redactError("logout", new Error("private-provider-secret"))).toEqual({
		ok: false,
		operation: "logout",
		failures: [{ code: "PORTAL_MANAGEMENT_FAILED" }],
	});
});

test("remote management rejects non-owner origins before auth and does not own local lifecycle", async () => {
	const directory = await mkdtemp(join(tmpdir(), "ssstool-management-"));
	const envFile = join(directory, "client.env");
	try {
		for (const server of [
			"https://external.example/tools/",
			"https://sss.linalab.io/not-tools/",
			"https://sss.linalab.io/tools/?token=private",
		]) {
			await writeFile(envFile, `SSSTOOL_SERVER_URL=${server}\n`);
			for (const operation of ["login", "logout", "status"] as const) {
				expect(await invokeManagement(operation, { envFile })).toEqual({
					ok: false,
					operation,
					failures: [{ code: "INVALID_SERVER_URL" }],
				});
			}
		}
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});
