import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import { resizePortraitPng } from "../src/png.ts";

const jobResponse = z.object({
	job: z.object({
		id: z.string(),
		state: z.string(),
		errorCode: z.string().nullable(),
		imageUrl: z.string().nullable(),
		metrics: z.object({ width: z.number() }).nullable(),
	}),
});

import { png } from "./backend.test.ts";
import { connectOwned, mcpFixture, portraitReply } from "./mcp-fixture.ts";

test("HTTP OAuth, CSRF, private sheet, real owned MCP, duplicate and foreign owner", async () => {
	const { createPortal } = await import("../src/server.ts");
	const { loadConfig } = await import("../src/config.ts");
	const root = await mkdtemp(join(tmpdir(), "portal-wire-"));
	let calls = 0;
	let prompt = "";
	let imageCount = 0;
	let userId = 42;
	let failProvider = false;
	const fixture = createTransportFixture();
	const bytes = png();
	const hash = (x: Uint8Array) => createHash("sha256").update(x).digest("hex");
	const images = fixture.candidate.referenceImages.map((r) => ({
		...r,
		bytes,
		...(r.role === "recipient-appearance-only"
			? { sourceHash: hash(bytes) }
			: {}),
	}));
	const template = {
		candidate: { ...fixture.candidate, referenceImages: images },
		operatorPins: {
			...fixture.operatorPins,
			referenceImages: images.map((r) => ({ id: r.id, sha256: hash(r.bytes) })),
		},
	};
	const provider = await mcpFixture((rpc, req, res) => {
		calls++;
		const args = rpc.params?.arguments;
		if (!args) throw Error("arguments");
		expect(req.headers.authorization).toBe("Bearer wire-private-key");
		prompt = args.prompt;
		imageCount = args.referenceImages.length;
		expect(args.model).toBe("gpt-image-2.5-sunburst");
		for (const image of args.referenceImages) {
			expect(Buffer.from(image, "base64").equals(Buffer.from(bytes))).toBe(
				true,
			);
		}
		res.writeHead(200, {
			"content-type": "application/json",
		});
		res.end(
			failProvider
				? JSON.stringify({
						jsonrpc: "2.0",
						id: rpc.id,
						error: { code: -32603, message: "preserved-wire-error" },
					})
				: JSON.stringify(portraitReply(rpc, bytes)),
		);
	});
	const config = loadConfig({
		PORTAL_PUBLIC_URL: "https://portal.example/tools",
		PORTAL_SESSION_SECRET: "s".repeat(48),
		GITHUB_OAUTH_CLIENT_ID: "client",
		GITHUB_OAUTH_CLIENT_SECRET: "secret",
		GITHUB_OAUTH_CALLBACK_URL: "https://portal.example/tools/api/auth/callback",
		PORTAL_STORAGE_PATH: root,
	});

	const app = await createPortal(config, {
		template,
		testEndpoints: [provider.registration],
		oauthFetch: async (input) =>
			String(input).includes("access_token")
				? Response.json({ access_token: "oauth-private" })
				: Response.json({ id: userId, login: "reader" }),
	});
	const started = once(app.server, "listening");
	app.server.listen(0, "127.0.0.1");
	await started;
	const a = app.server.address();
	if (!a || typeof a === "string") throw Error("address");
	const origin = `http://127.0.0.1:${a.port}`;
	const login = async () => {
		const first = await fetch(`${origin}/tools/api/auth/login`, {
			redirect: "manual",
		});
		expect(first.status).toBe(302);
		const location = new URL(first.headers.get("location") ?? "");
		const state = location.searchParams.get("state") ?? "";
		const oauthCookie = first.headers.get("set-cookie")?.split(";")[0] ?? "";
		const callback = await fetch(
			`${origin}/tools/api/auth/callback?code=real-fixture-code&state=${state}`,
			{ redirect: "manual", headers: { cookie: oauthCookie } },
		);
		expect(callback.status).toBe(302);
		const cookie =
			callback.headers
				.getSetCookie()
				.find((x) => x.startsWith("portal_session="))
				?.split(";")[0] ?? "";
		const session = z.object({ csrfToken: z.string() }).parse(
			await (
				await fetch(`${origin}/tools/api/auth/session`, {
					headers: { cookie },
				})
			).json(),
		);
		return { cookie, csrfToken: String(session.csrfToken) };
	};
	try {
		expect((await fetch(`${origin}/tools/api/characters`)).status).toBe(401);
		const auth = await login();
		const headers = {
			cookie: auth.cookie,
			"content-type": "application/json",
			origin: "https://portal.example",
			"x-csrf-token": auth.csrfToken,
		};
		expect(
			(
				await fetch(`${origin}/tools/api/sheets`, {
					method: "POST",
					headers: { ...headers, origin: "https://evil.example" },
					body: "{}",
				})
			).status,
		).toBe(403);
		const look = JSON.parse(
			new TextDecoder().decode(fixture.candidate.lookBytes),
		);
		const token = {
			...look,
			personId: "person-test",
			image: { sha256: hash(bytes) },
			generationContract: { model: "gpt-image-2.5" },
		};
		const detail = {
			id: "person-test",
			name: look.name,
			detailRoute: "/people/person-test",
			familyTree: { personId: look.characterId },
		};
		const uploaded = await fetch(`${origin}/tools/api/sheets`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				detailBase64: Buffer.from(JSON.stringify(detail)).toString("base64"),
				tokenBase64: Buffer.from(JSON.stringify(token)).toString("base64"),
				imageBase64: Buffer.from(bytes).toString("base64"),
			}),
		});
		expect(uploaded.status).toBe(201);
		const sheet = z
			.object({ sheetId: z.string() })
			.parse(await uploaded.json());
		const payload = {
			connectionId: await connectOwned(origin, headers, "wire-private-key"),
			sheetId: sheet.sheetId,
			requestId: "11111111-1111-4111-8111-111111111111",
			providerModel: "gpt-image-2.5-sunburst",
			faceMode: { kind: "unique", variantId: null },
		};
		const generated = await fetch(`${origin}/tools/api/generations`, {
			method: "POST",
			headers,
			body: JSON.stringify(payload),
		});
		expect(generated.status).toBe(200);
		const { job } = jobResponse.parse(await generated.json());
		expect(job.state).toBe("HOLD");
		expect(job.metrics?.width).toBe(340);
		expect(calls).toBe(1);
		expect(imageCount).toBe(3);
		expect(prompt).toContain("generationContract");
		expect(prompt).not.toContain("wire-private-key");
		const rawSuccess = await readFile(
			join(root, "42", "jobs", job.id, "mcp-response.bin"),
			"utf8",
		);
		const consumedRpc = provider.requests.find(
			(r) => r.rpc.method === "tools/call",
		)?.rpc;
		if (!consumedRpc) throw Error("consumed request");
		expect(rawSuccess).toBe(JSON.stringify(portraitReply(consumedRpc, bytes)));
		expect(JSON.parse(prompt).generationContract.model).toBe("gpt-image-2.5");
		expect(
			(
				await readFile(join(root, "42", "jobs", job.id, "candidate.png"))
			).equals(Buffer.from(resizePortraitPng(bytes))),
		).toBe(true);
		expect(
			(
				await fetch(`${origin}/tools/api/generations`, {
					method: "POST",
					headers,
					body: JSON.stringify(payload),
				})
			).status,
		).toBe(200);
		expect(calls).toBe(1);
		expect(
			(
				await fetch(origin + job.imageUrl, { headers: { cookie: auth.cookie } })
			).headers.get("cache-control"),
		).toBe("no-store");
		userId = 43;
		const other = await login();
		expect(
			(
				await fetch(origin + job.imageUrl, {
					headers: { cookie: other.cookie },
				})
			).status,
		).toBe(404);
		failProvider = true;
		const failed = jobResponse.parse(
			await (
				await fetch(`${origin}/tools/api/generations`, {
					method: "POST",
					headers,
					body: JSON.stringify({
						...payload,
						requestId: "22222222-2222-4222-8222-222222222222",
					}),
				})
			).json(),
		);
		expect(failed.job.state).toBe("FAILED");
		expect(failed.job.errorCode).toBe("MCP_RPC_FAILURE");
		const receipt = await readFile(
			join(root, "42", "jobs", failed.job.id, "mcp-response.bin"),
			"utf8",
		);
		expect(receipt).toContain("preserved-wire-error");
		expect(JSON.stringify(receipt)).not.toContain("wire-private-key");
	} finally {
		await app.close();
		await provider.close();
		await rm(root, { recursive: true, force: true });
	}
}, 20000);
