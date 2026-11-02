import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";

export function png(width = 1024, height = 1536): Uint8Array<ArrayBuffer> {
	const crc = (data: Uint8Array) => {
		let value = 0xffffffff;
		for (const byte of data) {
			value ^= byte;
			for (let bit = 0; bit < 8; bit++)
				value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
		}
		return (value ^ 0xffffffff) >>> 0;
	};
	const chunk = (type: string, data: Uint8Array) => {
		const body = Buffer.concat([Buffer.from(type), data]);
		const out = Buffer.alloc(data.length + 12);
		out.writeUInt32BE(data.length);
		body.copy(out, 4);
		out.writeUInt32BE(crc(body), out.length - 4);
		return out;
	};
	const header = Buffer.alloc(13);
	header.writeUInt32BE(width);
	header.writeUInt32BE(height, 4);
	header[8] = 8;
	header[9] = 6;
	const pixels = Buffer.alloc((width * 4 + 1) * height);
	for (let y = 40; y < height - 40; y++)
		for (let x = 40; x < width - 40; x++)
			pixels[y * (width * 4 + 1) + 1 + x * 4 + 3] = 255;
	return new Uint8Array(
		Buffer.concat([
			Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
			chunk("IHDR", header),
			chunk("IDAT", deflateSync(pixels)),
			chunk("IEND", new Uint8Array()),
		]),
	);
}
const base = {
	PORTAL_PUBLIC_URL: "https://portal.example/tools",
	PORTAL_SESSION_SECRET: "s".repeat(48),
	GITHUB_OAUTH_CLIENT_ID: "client",
	GITHUB_OAUTH_CLIENT_SECRET: "secret",
	GITHUB_OAUTH_CALLBACK_URL: "https://portal.example/tools/api/auth/callback",
	PORTAL_STORAGE_PATH: "/tmp/portal-tests",
};
describe("configuration boundary", () => {
	test("defaults Wiki to canonical origin and preserves explicit historical configuration", async () => {
		const { loadConfig } = await import("../src/config.ts");
		const { createWikiSource } = await import("../src/wiki.ts");
		expect(loadConfig({}).wikiBaseUrl).toBe("https://sss.linalab.io/wiki/");
		const historical = "https://seoul-dengoku.linalab.io/wiki/";
		const configured = loadConfig({ WIKI_BASE_URL: historical });
		expect(configured.wikiBaseUrl).toBe(historical);
		expect(() => createWikiSource(configured.wikiBaseUrl)).not.toThrow();
	});
	test("missing OAuth is explicit readiness not mock login", async () => {
		const { loadConfig } = await import("../src/config.ts");
		const c = loadConfig({
			PORTAL_MODE: "hosted",
			PORTAL_STORAGE_PATH: "/tmp/x",
		});
		expect(c.missing).toContain("GITHUB_OAUTH_CLIENT_ID");
		expect(c.ready).toBe(false);
	});
	test("rejects callback origin mismatch", async () => {
		const { loadConfig } = await import("../src/config.ts");
		expect(() =>
			loadConfig({
				...base,
				GITHUB_OAUTH_CALLBACK_URL: "https://evil.example/callback",
			}),
		).toThrow();
	});
	test("ignores common provider credentials and defaults to no endpoints", async () => {
		const { loadConfig } = await import("../src/config.ts");
		const config = loadConfig({
			...base,
			CLIPROXY_BASE_URL: "http://192.0.2.1/v1",
			CLIPROXY_API_KEY: "key\r\nignored",
			OPENAI_API_KEY: "ignored",
		});
		expect(config.mcpEndpoints).toEqual([]);
		expect(config).not.toHaveProperty("providerUrl");
		expect(config).not.toHaveProperty("providerKey");
	});
});
describe("real OAuth protocol", () => {
	test("state plus S256 challenge and secure scoped cookie", async () => {
		const { createAuth } = await import("../src/auth.ts");
		const { loadConfig } = await import("../src/config.ts");
		const auth = createAuth(loadConfig(base));
		const login = auth.login();
		const url = new URL(login.location);
		expect(url.origin).toBe("https://github.com");
		expect(url.searchParams.get("code_challenge_method")).toBe("S256");
		expect(url.searchParams.get("code_challenge")).toHaveLength(43);
		expect(login.cookie).toContain("HttpOnly; Secure; SameSite=Lax");
		expect(login.cookie).toContain("Path=/tools/");
	});
	test("callback consumes state, exchanges verifier and binds numeric user", async () => {
		const { createAuth } = await import("../src/auth.ts");
		const { loadConfig } = await import("../src/config.ts");
		const calls: string[] = [];
		let verifier = "";
		const auth = createAuth(loadConfig(base), async (input, init) => {
			calls.push(String(input));
			if (String(input).includes("access_token")) {
				const body = JSON.parse(String(init?.body));
				verifier = body.code_verifier;
				return Response.json({ access_token: "provider-private-token" });
			}
			return Response.json({ id: 42, login: "reader" });
		});
		const login = auth.login();
		const url = new URL(login.location);
		const state = url.searchParams.get("state") ?? "";
		const done = await auth.callback(
			"code",
			state,
			login.cookie.split(";")[0]?.split("=")[1] ?? "",
		);
		expect(calls).toHaveLength(2);
		expect(createHash("sha256").update(verifier).digest("base64url")).toBe(
			url.searchParams.get("code_challenge") ?? "",
		);
		expect(auth.verify(done.token)?.id).toBe("42");
		expect(done.token).not.toContain("provider-private-token");
		await expect(auth.callback("code", state, login.cookie)).rejects.toThrow();
	});
	test("tampered and expired sessions rejected", async () => {
		const { createAuth } = await import("../src/auth.ts");
		const { loadConfig } = await import("../src/config.ts");
		let now = 100;
		const auth = createAuth(
			loadConfig(base),
			async () => Response.json({}),
			() => now,
		);
		const token = auth.issue({ id: "42", login: "reader" });
		expect(auth.verify(`${token}bad`)).toBeNull();
		now += 9 * 60 * 60 * 1000;
		expect(auth.verify(token)).toBeNull();
	});
});
describe("PNG mechanical evidence", () => {
	test("decodes dimensions alpha core and margins without approval", async () => {
		const { measurePng } = await import("../src/png.ts");
		const m = measurePng(png());
		expect(m.width).toBe(1024);
		expect(m.height).toBe(1536);
		expect(m.coreFraction).toBeGreaterThan(0.8);
		expect(m.transparentFraction).toBeGreaterThan(0);
		expect(m.borderOccupied).toBe(0);
		expect(m.margin32Occupied).toBe(0);
		expect(m.reviewStatus).toBe("HOLD");
	});
	test("rejects corrupt bytes and decompression dimensions", async () => {
		const { measurePng } = await import("../src/png.ts");
		expect(() => measurePng(new Uint8Array([1, 2]))).toThrow();
		expect(() => measurePng(png(9000, 1))).toThrow();
	});
});
