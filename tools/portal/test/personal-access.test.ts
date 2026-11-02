import { expect, test } from "bun:test";
import { generateKeyPairSync, randomUUID, sign } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import { createAccessVerifier } from "../src/access.ts";
import { createAuth } from "../src/auth.ts";
import {
	mossWorkflowAssets,
	verifyMossAssetProof,
} from "../src/comfyui-assets.ts";
import {
	COMFY_ENDPOINT,
	type ComfyTransport,
} from "../src/comfyui-provider.ts";
import { loadConfig } from "../src/config.ts";
import { dispatchLocal } from "../src/local-provider.ts";
import { createPortal } from "../src/server.ts";
import { finishingProof } from "./comfyui-finishing-fixture.ts";

const COMFY_WORKFLOW = "moss-image-sft-text.alpha.v1" as const;

const environment = {
	PORTAL_MODE: "personal",
	PORTAL_PUBLIC_URL: "https://owner.example/tools",
	PORTAL_OWNER_EMAIL: "owner@example.com",
	PORTAL_ACCESS_ISSUER: "https://fixture.cloudflareaccess.com",
	PORTAL_ACCESS_AUDIENCE: "a".repeat(64),
	PORTAL_SESSION_SECRET: "fixture-session-secret".repeat(3),
	PORTAL_TEMPLATE_MANIFEST: "/fixture/manifest.json",
	PORTAL_TEMPLATE_PINS: "/fixture/pins.json",
};
const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwks = {
	keys: [
		{
			...pair.publicKey.export({ format: "jwk" }),
			kid: "fixture-key",
			alg: "RS256",
			use: "sig",
		},
	],
};
function token(
	claims: Record<string, unknown> = {},
	algorithm = "RS256",
	kid = "fixture-key",
) {
	const encode = (value: unknown) =>
		Buffer.from(JSON.stringify(value)).toString("base64url");
	const data = `${encode({ alg: algorithm, kid })}.${encode({
		iss: environment.PORTAL_ACCESS_ISSUER,
		aud: [environment.PORTAL_ACCESS_AUDIENCE],
		email: environment.PORTAL_OWNER_EMAIL,
		exp: 9000000000,
		...claims,
	})}`;
	return `${data}.${sign("RSA-SHA256", Buffer.from(data), pair.privateKey).toString("base64url")}`;
}
async function fixture(
	overrides: Record<string, string> = {},
	accessFetchOverride?: NonNullable<Parameters<typeof createPortal>[1]>["accessFetch"],
	store?: string,
	portalOptions: {
		comfyTransport?: ComfyTransport;
		comfyMeasureAssets?: NonNullable<
			NonNullable<Parameters<typeof createPortal>[1]>["comfyMeasureAssets"]
		>;
		comfyMeasureFinishing?: NonNullable<
			NonNullable<Parameters<typeof createPortal>[1]>["comfyMeasureFinishing"]
		>;
	} = {},
) {
	const storage = store ?? (await mkdtemp(join(tmpdir(), "portal-personal-")));
	const config = loadConfig({
		...environment,
		PORTAL_STORAGE_PATH: storage,
		PORTAL_PORT: "0",
		...overrides,
	});
	const canonical = createTransportFixture();
	let calls = 0;
	const app = await createPortal(config, {
		...portalOptions,
		template: {
			candidate: canonical.candidate,
			operatorPins: canonical.operatorPins,
		},
		accessFetch:
			accessFetchOverride ??
			(async (url, init) => {
				calls++;
				expect(url).toBe(
					`${environment.PORTAL_ACCESS_ISSUER}/cdn-cgi/access/certs`,
				);
				expect(init?.redirect).toBe("error");
				expect(init?.signal).toBeInstanceOf(AbortSignal);
				return Response.json(jwks);
			}),
	});
	const ready = once(app.server, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	app.server.listen(0, "127.0.0.1");
	await ready;
	const address = app.server.address();
	if (!address || typeof address === "string") throw Error("address");
	const request = (path: string, init: RequestInit = {}) =>
		fetch(`http://127.0.0.1:${address.port}${path}`, {
			...init,
			redirect: "manual",
			headers: {
				host: "owner.example",
				...Object.fromEntries(new Headers(init.headers)),
			},
		});
	return {
		config,
		stop: app.close,
		calls: () => calls,
		request,
		status: async (path: string, init: RequestInit = {}) =>
			(await request(path, init)).status,
		close: async () => {
			await app.close();
			await rm(storage, { recursive: true, force: true });
		},
	};
}
const bootSchema = z.object({
	mode: z.literal("personal"),
	serverProviderConfigured: z.boolean(),
	accountProviderConnected: z.boolean(),
	comfyuiConfigured: z.boolean(),
	user: z.object({ id: z.literal("1"), login: z.literal("owner@example.com") }),
	csrfToken: z.string(),
});

async function accountSession(f: Awaited<ReturnType<typeof fixture>>) {
	const access = { "cf-access-jwt-assertion": token() };
	const boot = await f.request("/tools/api/auth/session", { headers: access });
	const session = bootSchema.parse(await boot.json());
	return {
		session,
		headers: {
			...access,
			cookie: (boot.headers.get("set-cookie") ?? "").split(";")[0] ?? "",
			origin: "https://owner.example",
			"x-csrf-token": session.csrfToken,
			"content-type": "application/json",
		},
	};
}

test("account provider round-trip validates CSRF and models without echoing secrets", async () => {
	const f = await fixture();
	try {
		const { session, headers } = await accountSession(f);
		expect(session.accountProviderConnected).toBe(false);
		const input = {
			baseUrl: "https://account.example/v1",
			apiKey: "account-private-key",
		};
		for (const method of ["POST", "DELETE"])
			expect(
				await f.status("/tools/api/connections/account", {
					method,
					headers: { ...headers, "x-csrf-token": "wrong" },
					...(method === "POST" ? { body: JSON.stringify(input) } : {}),
				}),
			).toBe(403);
		expect(
			await f.status("/tools/api/connections/account", {
				method: "POST",
				headers,
				body: JSON.stringify({ ...input, model: "arbitrary-model" }),
			}),
		).toBe(422);
		for (const model of [
			undefined,
			"gemini-3.1-flash-image",
			"grok-imagine-image",
		]) {
			const response = await f.request("/tools/api/connections/account", {
				method: "POST",
				headers,
				body: JSON.stringify({ ...input, model }),
			});
			expect(response.status).toBe(200);
			const raw = await response.text();
			expect(raw).not.toContain(input.apiKey);
			expect(JSON.parse(raw)).toMatchObject({
				connected: true,
				login: environment.PORTAL_OWNER_EMAIL,
				baseUrl: input.baseUrl,
				model: model ?? "gpt-image-2.5-sunburst",
			});
			const get = await (
				await f.request("/tools/api/connections/account", { headers })
			).text();
			expect(get).not.toContain(input.apiKey);
			expect(JSON.parse(get)).toMatchObject({
				connected: true,
				model: model ?? "gpt-image-2.5-sunburst",
				connectedAt: expect.any(String),
			});
			expect(
				await (await f.request("/tools/api/connections", { headers })).json(),
			).toMatchObject({
				connection: { state: "READY" },
				provider: {
					baseUrl: input.baseUrl,
					model: model ?? "gpt-image-2.5-sunburst",
				},
			});
		}
		const stored = JSON.parse(
			await readFile(
				join(f.config.storagePath ?? "", "provider-connections.json"),
				"utf8",
			),
		);
		expect(stored.accounts[environment.PORTAL_OWNER_EMAIL]).toMatchObject({
			...input,
			connectedFrom: "owner-api",
			model: "grok-imagine-image",
		});
		expect(
			await f.status("/tools/api/connections/account", {
				method: "DELETE",
				headers,
			}),
		).toBe(200);
		expect(
			await (
				await f.request("/tools/api/connections/account", { headers })
			).json(),
		).toMatchObject({ connected: false });
		expect(
			await (await f.request("/tools/api/connections", { headers })).json(),
		).toMatchObject({ connection: null });
		expect(
			JSON.parse(
				await readFile(
					join(f.config.storagePath ?? "", "provider-connections.json"),
					"utf8",
				),
			).accounts,
		).toEqual({});
		expect(f.calls()).toBe(1);
	} finally {
		await f.close();
	}
});

test("ComfyUI connection coexists with the saved OpenAI-compatible account connection and survives account credential changes without exposing keys", async () => {
	const paths: string[] = [];
	const comfyTransport: ComfyTransport = {
		webSocket() {
			throw Error("no generation in this test");
		},
		async fetch(url) {
			const path = url.slice(COMFY_ENDPOINT.length);
			paths.push(path);
			if (path === "/system_stats")
				return Response.json({ system: { comfyui_version: "0.41.0" } });
			if (path === "/object_info")
				return Response.json(
					Object.fromEntries(
						[
							"UNETLoader",
							"CLIPLoader",
							"VAELoader",
							"CLIPTextEncode",
							"ConditioningZeroOut",
							"EmptySD3LatentImage",
							"EmptyFlux2LatentImage",
							"KSampler",
							"VAEDecode",
							"SaveImage",
							"ModelSamplingAuraFlow",
							"LoadBackgroundRemovalModel",
							"RemoveBackground",
							"ThresholdMask",
							"MaskComposite",
							"InvertMask",
							"EmptyImage",
							"ImageCompositeMasked",
							"JoinImageWithAlpha",
							"MaskToImage",
						].map((name) => [
							name,
							{ input: { required: {} }, output_node: name === "SaveImage" },
						]),
					),
				);
			throw Error(path);
		},
	};
	const f = await fixture({ PORTAL_COMFYUI: "true" }, undefined, undefined, {
		comfyTransport,
		comfyMeasureFinishing: async () => finishingProof(),
		comfyMeasureAssets: async (workflow) =>
			verifyMossAssetProof(
				{
					schema: "moss-runtime-file-sha256.v1",
					method: "server-file-stream-sha256",
					assets: mossWorkflowAssets(workflow ?? "").map(
						({ path: _path, ...asset }) => asset,
					),
				},
				workflow,
			),
	});
	try {
		const { session, headers } = await accountSession(f);
		expect(session).toMatchObject({
			accountProviderConnected: false,
			comfyuiConfigured: true,
		});
		const input = {
			baseUrl: "http://127.0.0.1:8317/v1",
			apiKey: "cliproxy-private-key",
			model: "gemini-3.1-flash-image",
		};
		expect(
			await f.status("/tools/api/connections/account", {
				method: "POST",
				headers,
				body: JSON.stringify(input),
			}),
		).toBe(200);
		const comfy = await f.request("/tools/api/connections", {
			method: "POST",
			headers,
			body: JSON.stringify({ provider: "comfyui", workflow: COMFY_WORKFLOW }),
		});
		expect(comfy.status).toBe(201);
		const comfyText = await comfy.text();
		expect(comfyText).not.toContain(input.apiKey);
		const comfyConnection = z
			.object({
				connection: z.object({
					connectionId: z.uuid(),
					protocolVersion: z.literal("comfyui-http.v1"),
					state: z.literal("READY"),
				}),
				readiness: z.object({ state: z.literal("READY") }),
			})
			.parse(JSON.parse(comfyText)).connection;
		expect(paths).toEqual(["/system_stats", "/object_info"]);
		const both = await (
			await f.request("/tools/api/connections", { headers })
		).text();
		expect(both).not.toContain(input.apiKey);
		expect(JSON.parse(both)).toMatchObject({
			connection: {
				state: "READY",
				protocolVersion: "openai-compatible-http.v1",
			},
			provider: { baseUrl: input.baseUrl, model: input.model },
			comfyui: {
				available: true,
				connection: {
					connectionId: comfyConnection.connectionId,
					state: "READY",
				},
			},
		});
		// Changing the saved OpenAI-compatible credential re-binds that connection
		// only; the Comfy connection is untouched and no key is ever echoed.
		const changed = { ...input, model: "grok-imagine-image" };
		expect(
			await f.status("/tools/api/connections/account", {
				method: "POST",
				headers,
				body: JSON.stringify(changed),
			}),
		).toBe(200);
		const account = await (
			await f.request("/tools/api/connections/account", { headers })
		).text();
		expect(account).not.toContain(input.apiKey);
		expect(JSON.parse(account)).toMatchObject({
			connected: true,
			baseUrl: input.baseUrl,
			model: "grok-imagine-image",
		});
		const after = z
			.object({
				connection: z.object({ state: z.string(), connectionId: z.uuid() }),
				provider: z.object({ model: z.string() }),
				comfyui: z.object({
					connection: z.object({ state: z.string(), connectionId: z.uuid() }),
				}),
			})
			.parse(
				await (await f.request("/tools/api/connections", { headers })).json(),
			);
		expect(after.connection.state).toBe("READY");
		expect(after.provider.model).toBe("grok-imagine-image");
		expect(after.comfyui.connection).toEqual({
			state: "READY",
			connectionId: comfyConnection.connectionId,
		});
		expect(paths).toEqual(["/system_stats", "/object_info"]);
		const stored = JSON.parse(
			await readFile(
				join(f.config.storagePath ?? "", "provider-connections.json"),
				"utf8",
			),
		);
		expect(stored).toMatchObject({
			schema: "portal-provider-connections.v1",
			accounts: {
				[environment.PORTAL_OWNER_EMAIL]: {
					...changed,
					connectedFrom: "owner-api",
				},
			},
		});
		expect(Object.keys(stored)).toEqual(["schema", "accounts"]);
		// Logout revokes both connections for this session.
		expect(
			await f.status("/tools/api/auth/logout", {
				method: "POST",
				headers,
				body: "{}",
			}),
		).toBe(200);
		const fresh = await accountSession(f);
		expect(
			await (
				await f.request("/tools/api/connections", { headers: fresh.headers })
			).json(),
		).toMatchObject({
			connection: { state: "READY" },
			comfyui: { available: true, connection: null },
		});
	} finally {
		await f.close();
	}
});

test("account provider survives a fresh portal boot and takes precedence over the server provider", async () => {
	const f = await fixture();
	const first = await accountSession(f);
	const input = {
		baseUrl: "https://persisted.example/v1",
		apiKey: "persisted-secret",
		model: "gemini-3.1-flash-image",
	};
	expect(
		await f.status("/tools/api/connections/account", {
			method: "POST",
			headers: first.headers,
			body: JSON.stringify(input),
		}),
	).toBe(200);
	await f.stop();
	const next = await fixture(
		{
			PORTAL_PERSONAL_PROVIDER_URL: "https://server.example/v1",
			PORTAL_PERSONAL_PROVIDER_KEY: "server-secret",
		},
		undefined,
		f.config.storagePath ?? undefined,
	);
	try {
		const { session, headers } = await accountSession(next);
		expect(session).toMatchObject({
			accountProviderConnected: true,
			serverProviderConfigured: true,
		});
		const response = await next.request("/tools/api/connections", { headers });
		const raw = await response.text();
		expect(raw).not.toContain(input.apiKey);
		expect(raw).not.toContain("server-secret");
		expect(JSON.parse(raw)).toMatchObject({
			connection: { state: "READY" },
			provider: { baseUrl: input.baseUrl, model: input.model },
		});
		const other = await accountSession(next);
		expect(
			await (
				await next.request("/tools/api/connections", { headers: other.headers })
			).json(),
		).toMatchObject({
			connection: { state: "READY" },
			provider: { baseUrl: input.baseUrl },
		});
		expect(next.calls()).toBe(1);
	} finally {
		await next.close();
	}
});

for (const invalid of [
	"{broken-secret",
	JSON.stringify({
		schema: "portal-provider-connections.v1",
		accounts: {
			"owner@example.com": {
				baseUrl: "http://remote.example",
				apiKey: "secret",
				connectedAt: new Date().toISOString(),
				connectedFrom: "owner-api",
			},
		},
	}),
]) {
	test("invalid account provider store fails closed at startup", async () => {
		const storage = await mkdtemp(join(tmpdir(), "portal-invalid-providers-"));
		try {
			await writeFile(join(storage, "provider-connections.json"), invalid);
			const canonical = createTransportFixture();
			await expect(
				createPortal(
					loadConfig({ ...environment, PORTAL_STORAGE_PATH: storage }),
					{
						template: {
							candidate: canonical.candidate,
							operatorPins: canonical.operatorPins,
						},
					},
				),
			).rejects.toThrow("PROVIDER_CONNECTIONS_INVALID");
		} finally {
			await rm(storage, { recursive: true, force: true });
		}
	});
}

test("account-selected models reach the local provider transport", async () => {
	const canonical = createTransportFixture();
	for (const model of [
		"gemini-3.1-flash-image",
		"grok-imagine-image",
	] as const) {
		const directory = await mkdtemp(join(tmpdir(), "portal-model-dispatch-"));
		let calls = 0;
		let received: Awaited<ReturnType<Response["formData"]>> | undefined;
		const provider = createServer(async (req, res) => {
			calls++;
			const parts: Buffer[] = [];
			for await (const chunk of req) parts.push(Buffer.from(chunk));
			received = await new Response(Buffer.concat(parts), {
				headers: { "content-type": req.headers["content-type"] ?? "" },
			}).formData();
			res.writeHead(429, { "content-type": "application/json" }).end("{}");
		});
		const ready = once(provider, "listening", {
			signal: AbortSignal.timeout(5000),
		});
		provider.listen(0, "127.0.0.1");
		await ready;
		const address = provider.address();
		if (!address || typeof address === "string") throw Error("address");
		try {
			await expect(
				dispatchLocal(
					{
						projection: canonical.projection,
						orderedImageBytes: canonical.orderedImageBytes,
						requestId: randomUUID(),
					},
					{
						directory,
						model,
						outbound: (start) =>
							start(
								{
									endpointId: "local-openai",
									revision: "v1",
									protocolVersion: "openai-compatible-http.v1",
									toolName: "openai-images-edits",
									toolSchemaDigest: "a".repeat(64),
								},
								"transport-private-key",
								`http://127.0.0.1:${address.port}/v1`,
							),
					},
				),
			).rejects.toMatchObject({ code: "LOCAL_HTTP_FAILURE", uncertain: false });
			expect(calls).toBe(1);
			expect(received?.get("model")).toBe(model);
			expect(received?.get("prompt")).toBe(canonical.projection.text);
			expect(received?.getAll("image[]")).toHaveLength(
				canonical.orderedImageBytes.length,
			);
		} finally {
			provider.closeAllConnections();
			await new Promise<void>((resolve) => provider.close(() => resolve()));
			await rm(directory, { recursive: true, force: true });
		}
	}
});

test("personal configuration requires owner Access storage and template inputs when explicitly selected", () => {
	// Given
	const env = {
		...environment,
		PORTAL_STORAGE_PATH: "/private",
		PORTAL_HOST: "0.0.0.0",
	};
	// When
	const config = loadConfig(env);
	// Then
	expect(config).toMatchObject({
		ready: true,
		mode: "personal",
		publicOrigin: "https://owner.example",
		host: "0.0.0.0",
		clientId: "",
		callback: "",
	});
	expect(() =>
		loadConfig({ PORTAL_MODE: "hosted", PORTAL_HOST: "0.0.0.0" }),
	).toThrow();
	for (const key of Object.keys(environment).filter(
		(key) => key !== "PORTAL_MODE",
	)) {
		const missing = loadConfig({ ...env, [key]: "" });
		expect(missing.ready).toBe(false);
		expect(missing.missing).toContain(key);
	}
	for (const overrides of [
		{ PORTAL_PUBLIC_URL: "http://owner.example/tools" },
		{ PORTAL_PUBLIC_URL: "https://owner.example/other" },
		{ PORTAL_ACCESS_ISSUER: "https://evil.example" },
		{ PORTAL_STORAGE_PATH: "relative" },
		{ PORTAL_OWNER_EMAIL: "invalid" },
		{ PORTAL_SESSION_SECRET: "short" },
	])
		expect(() => loadConfig({ ...env, ...overrides })).toThrow();
});

for (const [name, assertion] of [
	["missing", undefined],
	["expired", token({ exp: 1 })],
	["future nbf", token({ nbf: 9000000001 })],
	["wrong audience", token({ aud: ["b".repeat(64)] })],
	["wrong issuer", token({ iss: "https://other.cloudflareaccess.com" })],
	["other owner", token({ email: "contributor@example.com" })],
	["forged signature", `${token()}forged`],
	["wrong algorithm", token({}, "HS256")],
] as const) {
	test(`every personal route denies ${name} Access when direct HTTP spoofs owner headers`, async () => {
		// Given
		const f = await fixture();
		try {
			const headers = {
				"cf-access-authenticated-user-email": environment.PORTAL_OWNER_EMAIL,
				...(assertion ? { "cf-access-jwt-assertion": assertion } : {}),
			};
			// When / Then
			for (const route of [
				"/tools",
				"/tools/",
				"/tools/portal.mjs",
				"/tools/portal.css",
				"/tools/tokens.css",
				"/tools/api/status",
				"/tools/api/auth/session",
				"/tools/api/auth/login",
				"/tools/api/auth/callback",
				"/tools/api/connections",
				"/outside",
			]) {
				const response = await f.request(route, { headers });
				expect(response.status).toBe(401);
				expect(response.headers.get("set-cookie")).toBeNull();
			}
		} finally {
			await f.close();
		}
	});
}

test("Access return permits only authenticated exact workbench document navigation", async () => {
	const f = await fixture();
	try {
		const navigation = {
			"cf-access-jwt-assertion": token(),
			"sec-fetch-site": "cross-site",
			"sec-fetch-mode": "navigate",
			"sec-fetch-dest": "document",
		};
		for (const method of ["GET", "HEAD"]) {
			const redirect = await f.request("/tools", {
				method,
				headers: navigation,
			});
			expect(redirect.status).toBe(302);
			expect(redirect.headers.get("location")).toBe("/tools/");
			const document = await f.request("/tools/", {
				method,
				headers: navigation,
			});
			expect(document.status).toBe(200);
			expect(document.headers.get("content-type")).toContain("text/html");
			if (method === "GET") expect(await document.text()).toContain("<html");
			else expect(await document.text()).toBe("");
		}
		for (const assertion of ["", `${token()}forged`, token({ exp: 1 })]) {
			const denied = await f.request("/tools/", {
				headers: { ...navigation, "cf-access-jwt-assertion": assertion },
			});
			expect(denied.status).toBe(401);
			expect(denied.headers.get("set-cookie")).toBeNull();
		}
		for (const headers of [
			{ ...navigation, origin: "https://evil.example" },
			{ ...navigation, origin: "null" },
			{ ...navigation, "sec-fetch-mode": "cors" },
			{ ...navigation, "sec-fetch-dest": "iframe" },
			{ ...navigation, "sec-fetch-dest": "" },
		])
			expect(await f.status("/tools/", { headers })).toBe(403);
		for (const route of [
			"/tools/?redirect=1",
			"/tools/portal.mjs",
			"/tools/api/status",
			"/tools/api/auth/session",
			"/tools/api/releases/ssstool-manifest.json",
		]) {
			const denied = await f.request(route, { headers: navigation });
			expect(denied.status).toBe(403);
			expect(await denied.json()).toEqual({
				error: { code: "ORIGIN_INVALID" },
			});
			expect(denied.headers.get("set-cookie")).toBeNull();
		}
		const { headers } = await accountSession(f);
		for (const method of ["GET", "POST"])
			for (const route of ["/tools/", "/tools/api/auth/logout"])
				expect(
					await f.status(route, {
						method,
						headers: { ...headers, ...navigation },
					}),
				).toBe(method === "GET" && route === "/tools/" ? 200 : 403);
		const session = await f.request("/tools/api/auth/session", { headers });
		expect(session.status).toBe(200);
		expect(bootSchema.parse(await session.json()).user.login).toBe(
			"owner@example.com",
		);
	} finally {
		await f.close();
	}
});

test("verified owner bootstraps a secure session and explicitly connects without provider calls", async () => {
	// Given
	const f = await fixture({
		OPENAI_API_KEY: "ambient-ignored",
		CLIPROXY_API_KEY: "ambient-ignored",
	});
	try {
		const access = { "cf-access-jwt-assertion": token() };
		const boot = await f.request("/tools/api/auth/session", {
			headers: access,
		});
		const session = bootSchema.parse(await boot.json());
		const cookie = boot.headers.get("set-cookie") ?? "";
		expect(cookie).toContain("HttpOnly; Secure; SameSite=Strict");
		expect(session.serverProviderConfigured).toBe(false);
		const headers = {
			...access,
			cookie: cookie.split(";")[0] ?? "",
			origin: "https://owner.example",
			"x-csrf-token": session.csrfToken,
			"content-type": "application/json",
		};
		expect(
			await (await f.request("/tools/api/connections", { headers })).json(),
		).toMatchObject({ mode: "personal", endpoints: [], connection: null });
		// When
		const connected = await f.request("/tools/api/connections", {
			method: "POST",
			headers,
			body: JSON.stringify({
				baseUrl: "http://127.0.0.1:1/v1",
				apiKey: "explicit-private-key",
			}),
		});
		// Then
		expect(connected.status).toBe(201);
		const result = await connected.text();
		expect(JSON.parse(result)).toMatchObject({
			connection: {
				state: "READY",
				protocolVersion: "openai-compatible-http.v1",
			},
		});
		expect(result).not.toContain("explicit-private-key");
		expect(f.calls()).toBe(1);
		for (const path of ["/tools/", "/tools/portal.mjs", "/tools/api/status"])
			expect(await f.status(path, { headers: access })).toBe(200);
		for (const path of ["/tools/api/auth/login", "/tools/api/auth/callback"])
			expect(await f.status(path, { headers: access })).toBe(404);
	} finally {
		await f.close();
	}
});

test("explicit personal provider configuration is validated only in personal mode with no ambient fallback", () => {
	const env = { ...environment, PORTAL_STORAGE_PATH: "/private" };
	const provider = {
		PORTAL_PERSONAL_PROVIDER_URL: "http://127.0.0.1:1/v1",
		PORTAL_PERSONAL_PROVIDER_KEY: "server-private-key",
	};
	expect(loadConfig({ ...env, ...provider }).personalProvider).toEqual({
		baseUrl: provider.PORTAL_PERSONAL_PROVIDER_URL,
		apiKey: provider.PORTAL_PERSONAL_PROVIDER_KEY,
	});
	expect(
		loadConfig({
			...env,
			OPENAI_API_KEY: "ambient-key",
			CLIPROXY_API_KEY: "ambient-key",
			CLIPROXY_BASE_URL: "http://127.0.0.1:1/v1",
		}).personalProvider,
	).toBeNull();
	for (const override of [
		{ PORTAL_PERSONAL_PROVIDER_URL: undefined },
		{ PORTAL_PERSONAL_PROVIDER_KEY: undefined },
		{ PORTAL_PERSONAL_PROVIDER_KEY: "" },
		{ PORTAL_PERSONAL_PROVIDER_KEY: "invalid key" },
		{ PORTAL_PERSONAL_PROVIDER_URL: "http://remote.example/v1" },
		{ PORTAL_PERSONAL_PROVIDER_URL: "https://user:pass@provider.example/v1" },
		{ PORTAL_PERSONAL_PROVIDER_URL: "https://provider.example/v1?key=secret" },
	])
		expect(() => loadConfig({ ...env, ...provider, ...override })).toThrow(
			"INVALID_PERSONAL_PROVIDER_CONFIG",
		);
	for (const mode of ["local", "hosted"])
		expect(
			loadConfig({
				...env,
				PORTAL_MODE: mode,
				PORTAL_PERSONAL_PROVIDER_URL: "invalid",
				PORTAL_PERSONAL_PROVIDER_KEY: "",
			}).personalProvider,
		).toBeNull();
});

test("server provider binds independent owner sessions without credentials or provider calls and revokes only one session", async () => {
	const providerKey = "configured-owner-secret";
	const f = await fixture({
		PORTAL_PERSONAL_PROVIDER_URL: "http://127.0.0.1:1/v1",
		PORTAL_PERSONAL_PROVIDER_KEY: providerKey,
	});
	try {
		const access = { "cf-access-jwt-assertion": token() };
		const boots = await Promise.all([
			f.request("/tools/api/auth/session", { headers: access }),
			f.request("/tools/api/auth/session", { headers: access }),
		]);
		const headers: (Record<string, string> & { cookie: string })[] = [];
		for (const boot of boots) {
			expect(boot.status).toBe(200);
			const text = await boot.text();
			expect(text).not.toContain(providerKey);
			const session = bootSchema.parse(JSON.parse(text));
			expect(session.serverProviderConfigured).toBe(true);
			headers.push({
				...access,
				cookie: (boot.headers.get("set-cookie") ?? "").split(";")[0] ?? "",
				origin: "https://owner.example",
				"x-csrf-token": session.csrfToken,
			});
		}
		const read = async (sessionHeaders: Record<string, string>) => {
			const response = await f.request("/tools/api/connections", {
				headers: sessionHeaders,
			});
			expect(response.status).toBe(200);
			const text = await response.text();
			expect(text).not.toContain(providerKey);
			expect(text).not.toContain(f.config.personalProvider?.baseUrl);
			return z
				.object({
					connection: z.object({ connectionId: z.string(), state: z.string() }),
				})
				.parse(JSON.parse(text)).connection;
		};
		const firstHeaders = headers[0];
		const secondHeaders = headers[1];
		if (!firstHeaders || !secondHeaders) throw Error("MISSING_SESSION");
		expect(firstHeaders.cookie).not.toBe(secondHeaders.cookie);
		const first = await read(firstHeaders);
		const second = await read(secondHeaders);
		expect(first.state).toBe("READY");
		expect(second.state).toBe("READY");
		expect(first.connectionId).not.toBe(second.connectionId);
		expect(
			await f.status(`/tools/api/connections/${first.connectionId}`, {
				method: "DELETE",
				headers: secondHeaders,
			}),
		).toBe(404);
		expect(
			await f.status("/tools/api/connections", {
				method: "POST",
				headers: { ...firstHeaders, "content-type": "application/json" },
				body: JSON.stringify({
					baseUrl: "https://other.example",
					apiKey: "other",
				}),
			}),
		).toBe(409);
		expect(
			await f.status("/tools/api/auth/logout", {
				method: "POST",
				headers: firstHeaders,
			}),
		).toBe(200);
		expect(
			await f.status("/tools/api/connections", { headers: firstHeaders }),
		).toBe(401);
		expect(await read(secondHeaders)).toEqual(second);
		expect(
			await f.status(`/tools/api/connections/${second.connectionId}`, {
				method: "DELETE",
				headers: secondHeaders,
			}),
		).toBe(200);
		expect((await read(secondHeaders)).state).toBe("REVOKED");
		expect(
			await f.status("/tools/api/auth/session", { headers: secondHeaders }),
		).toBe(200);
		expect(await read(secondHeaders)).toEqual({ ...second, state: "REVOKED" });
		const fresh = await f.request("/tools/api/auth/session", {
			headers: access,
		});
		expect(fresh.status).toBe(200);
		const freshConnection = await read({
			...access,
			cookie: (fresh.headers.get("set-cookie") ?? "").split(";")[0] ?? "",
		});
		expect(freshConnection.state).toBe("READY");
		expect(freshConnection.connectionId).not.toBe(second.connectionId);
		for (const assertion of [
			undefined,
			token({ email: "other@example.com" }),
		]) {
			const response = await f.request("/tools/api/auth/session", {
				headers: assertion ? { "cf-access-jwt-assertion": assertion } : {},
			});
			expect(response.status).toBe(401);
			expect(await response.text()).not.toContain(providerKey);
			expect(response.headers.get("set-cookie")).toBeNull();
		}
		expect(f.calls()).toBe(1);
	} finally {
		await f.close();
	}
});

test("portal cookies never bypass Access Host Origin CSRF or owner binding when reused", async () => {
	// Given
	const f = await fixture();
	try {
		const access = { "cf-access-jwt-assertion": token() };
		const boot = await f.request("/tools/api/auth/session", {
			headers: access,
		});
		const session = bootSchema.parse(await boot.json());
		const cookie = (boot.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
		const headers = {
			...access,
			cookie,
			origin: "https://owner.example",
			"x-csrf-token": session.csrfToken,
		};
		// When / Then
		for (const overrides of [
			{ "cf-access-jwt-assertion": "" },
			{ "cf-access-jwt-assertion": token({ exp: 1 }) },
			{
				"cf-access-jwt-assertion": token({ email: "contributor@example.com" }),
			},
		])
			expect(
				await f.status("/tools/api/connections", {
					headers: { ...headers, ...overrides },
				}),
			).toBe(401);
		for (const overrides of [
			{ host: "evil.example" },
			{ host: "owner.example:443" },
			{ origin: "http://owner.example" },
			{ origin: "https://evil.example" },
			{ "x-csrf-token": "wrong" },
			{ "sec-fetch-site": "cross-site" },
		])
			expect(
				await f.status("/tools/api/auth/logout", {
					method: "POST",
					headers: { ...headers, ...overrides },
				}),
			).toBe(403);
		const other = createAuth(f.config).issue({
			id: "2",
			login: environment.PORTAL_OWNER_EMAIL,
		});
		expect(
			await f.status("/tools/api/connections", {
				headers: { ...headers, cookie: `portal_session=${other}` },
			}),
		).toBe(401);
		const logout = await f.request("/tools/api/auth/logout", {
			method: "POST",
			headers,
		});
		expect(logout.status).toBe(200);
		expect(logout.headers.get("set-cookie")).toContain("Max-Age=0");
		expect(await f.status("/tools/api/connections", { headers })).toBe(401);
		expect(await f.status("/tools/api/auth/session", { headers: access })).toBe(
			200,
		);
	} finally {
		await f.close();
	}
});

test("unconfigured personal service fails closed before status or session when secrets are missing", async () => {
	// Given
	const f = await fixture({ PORTAL_SESSION_SECRET: "" });
	try {
		// When / Then
		for (const path of [
			"/tools/",
			"/tools/api/status",
			"/tools/api/auth/session",
		])
			expect(
				await f.status(path, {
					headers: { "cf-access-jwt-assertion": token() },
				}),
			).toBe(503);
		expect(f.calls()).toBe(0);
	} finally {
		await f.close();
	}
});

test("expired key cache fails closed when issuer keys are unavailable without timing waits", async () => {
	// Given
	let now = 1000000,
		calls = 0,
		unavailable = false;
	const config = loadConfig({
		...environment,
		PORTAL_STORAGE_PATH: "/private",
	});
	const verify = createAccessVerifier(
		config,
		async () => {
			calls++;
			return unavailable
				? new Response("offline", { status: 503 })
				: Response.json(jwks);
		},
		() => now,
	);
	const assertion = token();
	expect(await verify(assertion)).toBe(environment.PORTAL_OWNER_EMAIL);
	unavailable = true;
	now += 300001;
	// When / Then
	await expect(verify(assertion)).rejects.toThrow("ACCESS_UNAVAILABLE");
	expect(calls).toBe(2);
});

test("personal session from a previous Node boot is rejected when the process restarts", async () => {
	// Given
	const config = loadConfig({
		...environment,
		PORTAL_STORAGE_PATH: "/private",
	});
	const auth = createAuth(config);
	const session = auth.issue({
		id: "1",
		login: environment.PORTAL_OWNER_EMAIL,
	});
	const source = fileURLToPath(new URL("../src/auth.ts", import.meta.url));
	const code = `import {createAuth} from ${JSON.stringify(source)}; console.log(createAuth(JSON.parse(process.env.PERSONAL_CONFIG)).verify(process.env.PERSONAL_TOKEN) === null);`;
	// When
	const child = Bun.spawn(["node", "--input-type=module", "-e", code], {
		env: {
			...process.env,
			PERSONAL_CONFIG: JSON.stringify(config),
			PERSONAL_TOKEN: session,
		},
		stdout: "pipe",
		stderr: "pipe",
	});
	const output = await new Response(child.stdout).text();
	// Then
	expect(await child.exited).toBe(0);
	expect(output.trim()).toBe("true");
});

test("pinned JWKS file verifies owner tokens with zero network egress", async () => {
	// Given
	const pinned = await mkdtemp(join(tmpdir(), "portal-jwks-"));
	const jwksPath = join(pinned, "access-certs.json");
	await Bun.write(jwksPath, JSON.stringify(jwks));
	const config = loadConfig({
		...environment,
		PORTAL_STORAGE_PATH: "/private",
		PORTAL_ACCESS_JWKS_FILE: jwksPath,
	});
	const verify = createAccessVerifier(
		config,
		async () => {
			throw Error("EGRESS_FORBIDDEN_IN_FILE_MODE");
		},
		() => 1000000,
	);
	// When / Then
	expect(await verify(token())).toBe(environment.PORTAL_OWNER_EMAIL);
	expect(await verify(token({}, "RS256", "unknown-kid"))).toBeNull();
	expect(await verify(`${token().slice(0, -4)}AAAA`)).toBeNull();
	let later = 1000000 + 400000;
	const verifyLater = createAccessVerifier(
		config,
		async () => {
			throw Error("EGRESS_FORBIDDEN_IN_FILE_MODE");
		},
		() => later,
	);
	expect(await verifyLater(token())).toBe(environment.PORTAL_OWNER_EMAIL);
	later += 400000;
	await rm(pinned, { recursive: true, force: true });
});

test("pinned JWKS file mode fails closed on relative paths and unreadable files", async () => {
	// Given / When / Then
	expect(() =>
		loadConfig({
			...environment,
			PORTAL_STORAGE_PATH: "/private",
			PORTAL_ACCESS_JWKS_FILE: "relative/access-certs.json",
		}),
	).toThrow("INVALID_ACCESS_JWKS_FILE");
	const missing = loadConfig({
		...environment,
		PORTAL_STORAGE_PATH: "/private",
		PORTAL_ACCESS_JWKS_FILE: "/private/does-not-exist.json",
	});
	expect(() => createAccessVerifier(missing, fetch)).toThrow(
		"ACCESS_UNAVAILABLE",
	);
});

test("pinned JWKS file mode serves a personal portal boot without issuer fetches", async () => {
	// Given
	const pinned = await mkdtemp(join(tmpdir(), "portal-jwks-"));
	const jwksPath = join(pinned, "access-certs.json");
	await Bun.write(jwksPath, JSON.stringify(jwks));
	const app = await fixture({ PORTAL_ACCESS_JWKS_FILE: jwksPath }, async () => {
		throw Error("EGRESS_FORBIDDEN_IN_FILE_MODE");
	});
	// When
	const response = await app.request("/tools/api/auth/session", {
		headers: { "cf-access-jwt-assertion": token() },
	});
	const boot = bootSchema.parse(await response.json());
	// Then
	expect(String(boot.user.login)).toBe(String(environment.PORTAL_OWNER_EMAIL));
	expect(app.calls()).toBe(0);
	await app.close();
});
