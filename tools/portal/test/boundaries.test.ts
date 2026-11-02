import { expect, test } from "bun:test";
import { once } from "node:events";
import { mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAuth } from "../src/auth.ts";
import { loadConfig } from "../src/config.ts";
import { createPortal } from "../src/server.ts";

test("unconfigured real service reports missing keys and does not bypass auth", async () => {
	const app = await createPortal(loadConfig({ PORTAL_MODE: "hosted" }));
	const ready = once(app.server, "listening");
	app.server.listen(0, "127.0.0.1");
	await ready;
	const address = app.server.address();
	if (!address || typeof address === "string") throw Error("address");
	const origin = `http://127.0.0.1:${address.port}`;
	try {
		const status = await fetch(`${origin}/tools/api/status`);
		expect(status.status).toBe(200);
		expect(JSON.stringify(await status.json())).toContain(
			"GITHUB_OAUTH_CLIENT_ID",
		);
		expect(
			(await fetch(`${origin}/tools/api/auth/login`, { redirect: "manual" }))
				.status,
		).toBe(503);
		expect((await fetch(`${origin}/tools/api/characters`)).status).toBe(401);
		expect(
			(await fetch(`${origin}/tools/api/auth/test-session`, { method: "POST" }))
				.status,
		).toBe(401);
		const css = await fetch(`${origin}/tools/tokens.css`);
		expect(css.status).toBe(200);
		expect(await css.text()).toBe(
			await readFile(
				new URL("../../shared-web-ui/src/tokens.css", import.meta.url),
				"utf8",
			),
		);
	} finally {
		await app.close();
	}
});

test("signed user cannot read symlink-escaped private artifacts", async () => {
	const root = await mkdtemp(join(tmpdir(), "portal-path-"));
	const outside = await mkdtemp(join(tmpdir(), "portal-outside-"));
	const config = loadConfig({
		PORTAL_STORAGE_PATH: root,
		PORTAL_SESSION_SECRET: "s".repeat(48),
	});
	const app = await createPortal(config);
	await symlink(outside, join(root, "42"));
	const token = createAuth(config).issue({ id: "42", login: "reader" });
	const ready = once(app.server, "listening");
	app.server.listen(0, "127.0.0.1");
	await ready;
	const address = app.server.address();
	if (!address || typeof address === "string") throw Error("address");
	try {
		const result = await fetch(
			"http://127.0.0.1:" +
				address.port +
				"/tools/api/jobs/11111111-1111-4111-8111-111111111111",
			{ headers: { cookie: `portal_session=${token}` } },
		);
		expect(result.status).toBe(400);
		expect(await result.text()).toContain("INVALID_PATH");
	} finally {
		await app.close();
		await rm(root, { recursive: true, force: true });
		await rm(outside, { recursive: true, force: true });
	}
});
