import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { EventEmitter, once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import { loadConfig } from "../src/config.ts";
import { createPortal } from "../src/server.ts";
import { hash } from "../src/sources.ts";
import { png } from "./backend.test.ts";
import { connectOwned, mcpFixture, portraitReply } from "./mcp-fixture.ts";

const jobSchema = z.object({
	job: z.object({
		id: z.string(),
		state: z.string(),
		errorCode: z.string().nullable(),
	}),
});
for (const runtime of ["Node", "Bun"] as const)
	test(`${runtime} consumed upstream request loss retains UNKNOWN and blocks owner redispatch`, async () => {
		const root = await mkdtemp(join(tmpdir(), "portal-uncertain-"));
		const fixture = createTransportFixture(),
			image = png();
		const images = fixture.candidate.referenceImages.map((r) => ({
			...r,
			bytes: image,
			...(r.role === "recipient-appearance-only"
				? { sourceHash: hash(image) }
				: {}),
		}));
		const template = {
			candidate: { ...fixture.candidate, referenceImages: images },
			operatorPins: {
				...fixture.operatorPins,
				referenceImages: images.map((r) => ({ id: r.id, sha256: hash(image) })),
			},
		};
		const signals = new EventEmitter();
		let calls = 0;
		let definitive = false;
		const provider = await mcpFixture((rpc, req, res) => {
			calls++;
			expect(req.headers.authorization).toBe(
				`Bearer ${definitive ? "other-private-key" : "fixture-private-key"}`,
			);
			signals.emit("consumed", Buffer.byteLength(JSON.stringify(rpc)));
			if (definitive) {
				res.writeHead(200, { "content-type": "application/json" });
				res.end(JSON.stringify(portraitReply(rpc, Buffer.from("invalid"))));
			} else res.destroy();
		});
		await writeFile(join(root, "rule.json"), fixture.candidate.ruleBytes);
		await writeFile(
			join(root, "reference.json"),
			fixture.candidate.positionReferenceBytes,
		);
		await writeFile(join(root, "look.json"), fixture.candidate.lookBytes);
		for (const [i, r] of images.entries())
			await writeFile(join(root, `ref${i}.png`), r.bytes);
		await writeFile(
			join(root, "pins.json"),
			JSON.stringify(template.operatorPins),
		);
		await writeFile(
			join(root, "manifest.json"),
			JSON.stringify({
				rule: { path: "rule.json" },
				reference: { path: "reference.json" },
				look: { path: "look.json" },
				referenceImages: images.map(({ bytes, ...r }, i) => ({
					...r,
					path: `ref${i}.png`,
				})),
				composition: fixture.candidate.composition,
			}),
		);
		const environment = {
			PORTAL_PUBLIC_URL: "https://portal.example/tools/",
			PORTAL_SESSION_SECRET: "s".repeat(48),
			GITHUB_OAUTH_CLIENT_ID: "fixture",
			GITHUB_OAUTH_CLIENT_SECRET: "fixture-secret",
			GITHUB_OAUTH_CALLBACK_URL:
				"https://portal.example/tools/api/auth/callback",
			PORTAL_STORAGE_PATH: join(root, "store"),
			PORTAL_TEMPLATE_MANIFEST: join(root, "manifest.json"),
			PORTAL_TEMPLATE_PINS: join(root, "pins.json"),
			PORTAL_PORT: "0",
		};
		const config = loadConfig(environment);
		let close: () => Promise<void>;
		let origin: string;
		if (runtime === "Node") {
			const bundle = await Bun.build({
				entrypoints: [new URL("../src/server.ts", import.meta.url).pathname],
				target: "node",
			});
			if (!bundle.success || !bundle.outputs[0]) throw Error("fixture bundle");
			const modulePath = join(root, "fixture-server.mjs");
			await writeFile(modulePath, await bundle.outputs[0].text());
			const child = spawn(
				"node",
				[
					"--input-type=module",
					"-e",
					`const {createPortal}=await import(${JSON.stringify(modulePath)});const app=await createPortal(${JSON.stringify(config)},{testEndpoints:${JSON.stringify([provider.registration])},oauthFetch:async(input,init)=>input.includes("access_token")?Response.json({access_token:JSON.parse(init.body).code}):Response.json({id:Number(init.headers.authorization.split(" ")[1]),login:"reader"})});app.server.listen(0,"127.0.0.1",()=>console.log("PORTAL_READY host=127.0.0.1 port="+app.server.address().port));process.once("SIGTERM",()=>void app.close());`,
				],
				{
					env: { ...process.env, ...environment, NODE_ENV: "test" },
					stdio: ["ignore", "pipe", "pipe"],
				},
			);
			const exited = once(child, "exit");
			const port = await new Promise<number>((resolve, reject) => {
				let output = "";
				child.stdout.on("data", (chunk) => {
					output += String(chunk);
					const match = output.match(/PORTAL_READY host=127.0.0.1 port=(\d+)/);
					if (match) resolve(Number(match[1]));
				});
				child.once("error", reject);
				child.once("exit", () => reject(Error("early exit")));
			});
			origin = `http://127.0.0.1:${port}`;
			close = async () => {
				child.kill("SIGTERM");
				await exited;
			};
		} else {
			const app = await createPortal(config, {
				template,
				testEndpoints: [provider.registration],
				oauthFetch: async (input, init) =>
					input.includes("access_token")
						? Response.json({
								access_token: JSON.parse(String(init?.body)).code,
							})
						: Response.json({
								id: Number(
									new Headers(init?.headers)
										.get("authorization")
										?.split(" ")[1],
								),
								login: "reader",
							}),
			});
			const ready = once(app.server, "listening");
			app.server.listen(0, "127.0.0.1");
			await ready;
			const a = app.server.address();
			if (!a || typeof a === "string") throw Error("address");
			origin = `http://127.0.0.1:${a.port}`;
			close = app.close;
		}
		const login = async (id: string) => {
			const first = await fetch(`${origin}/tools/api/auth/login`, {
				redirect: "manual",
			});
			const state = new URL(
				first.headers.get("location") ?? "",
			).searchParams.get("state");
			const callback = await fetch(
				`${origin}/tools/api/auth/callback?code=${id}&state=${state}`,
				{
					redirect: "manual",
					headers: {
						cookie: first.headers.get("set-cookie")?.split(";")[0] ?? "",
					},
				},
			);
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
			return {
				cookie,
				"content-type": "application/json",
				origin: "https://portal.example",
				"x-csrf-token": session.csrfToken,
			};
		};
		const headers = await login("42");
		try {
			const look = JSON.parse(
				new TextDecoder().decode(fixture.candidate.lookBytes),
			);
			const detail = {
					id: "person-test",
					name: look.name,
					detailRoute: "/people/person-test",
					familyTree: { personId: look.characterId },
				},
				sheetToken = {
					...look,
					personId: "person-test",
					image: { sha256: hash(image) },
					generationContract: { model: "gpt-image-2.5" },
				};
			const upload = await fetch(`${origin}/tools/api/sheets`, {
				method: "POST",
				headers,
				body: JSON.stringify({
					detailBase64: Buffer.from(JSON.stringify(detail)).toString("base64"),
					tokenBase64: Buffer.from(JSON.stringify(sheetToken)).toString(
						"base64",
					),
					imageBase64: Buffer.from(image).toString("base64"),
				}),
			});
			const sheet = z
				.object({ sheetId: z.string() })
				.parse(await upload.json());
			const payload = {
				connectionId: await connectOwned(
					origin,
					headers,
					"fixture-private-key",
				),
				sheetId: sheet.sheetId,
				requestId: "44444444-4444-4444-8444-444444444444",
				providerModel: "gpt-image-2.5-sunburst",
				faceMode: { kind: "unique", variantId: null },
			};
			const consumed = once(signals, "consumed", {
				signal: AbortSignal.timeout(5000),
			});
			const pending = fetch(`${origin}/tools/api/generations`, {
				method: "POST",
				headers,
				body: JSON.stringify(payload),
			});
			const [consumedBytes] = await consumed;
			expect(Number(consumedBytes)).toBeGreaterThan(0);
			const result = jobSchema.parse(await (await pending).json());
			const capture = JSON.parse(
				await readFile(
					join(
						root,
						"store",
						"42",
						"jobs",
						payload.requestId,
						"mcp-response.json",
					),
					"utf8",
				),
			);
			expect(capture.uncertain).toBe(true);
			const receipt = await readFile(
				join(
					root,
					"store",
					"42",
					"jobs",
					payload.requestId,
					"mcp-response.json",
				),
				"utf8",
			);
			expect(receipt).not.toContain("fixture-private-key");
			expect(result.job.state).toBe("UNKNOWN");
			expect(calls).toBe(1);
			const duplicate = jobSchema.parse(
				await (
					await fetch(`${origin}/tools/api/generations`, {
						method: "POST",
						headers,
						body: JSON.stringify(payload),
					})
				).json(),
			);
			expect(duplicate.job.state).toBe("UNKNOWN");
			expect(calls).toBe(1);
			const next = await fetch(`${origin}/tools/api/generations`, {
				method: "POST",
				headers,
				body: JSON.stringify({
					...payload,
					requestId: "55555555-5555-4555-8555-555555555555",
				}),
			});
			expect(next.status).toBe(409);
			expect(await next.text()).toContain("OWNER_DISPATCH_UNCERTAIN");
			expect(calls).toBe(1);
			const otherHeaders = await login("43");
			const otherConnection = await connectOwned(
				origin,
				otherHeaders,
				"other-private-key",
			);
			definitive = true;
			const otherUpload = await fetch(`${origin}/tools/api/sheets`, {
				method: "POST",
				headers: otherHeaders,
				body: JSON.stringify({
					detailBase64: Buffer.from(JSON.stringify(detail)).toString("base64"),
					tokenBase64: Buffer.from(JSON.stringify(sheetToken)).toString(
						"base64",
					),
					imageBase64: Buffer.from(image).toString("base64"),
				}),
			});
			const otherSheet = z
				.object({ sheetId: z.string() })
				.parse(await otherUpload.json());
			const known = jobSchema.parse(
				await (
					await fetch(`${origin}/tools/api/generations`, {
						method: "POST",
						headers: otherHeaders,
						body: JSON.stringify({
							...payload,
							connectionId: otherConnection,
							sheetId: otherSheet.sheetId,
						}),
					})
				).json(),
			);
			expect(known.job.state).toBe("FAILED");
			expect(known.job.errorCode).toBe("MCP_INVALID_RESPONSE");
			expect(calls).toBe(2);
			const definitiveRaw = await readFile(
				join(
					root,
					"store",
					"43",
					"jobs",
					payload.requestId,
					"mcp-response.bin",
				),
				"utf8",
			);
			const definitiveRpc = provider.requests.filter(
				(r) => r.rpc.method === "tools/call",
			)[1]?.rpc;
			if (!definitiveRpc) throw Error("consumed request");
			expect(definitiveRaw).toBe(
				JSON.stringify(portraitReply(definitiveRpc, Buffer.from("invalid"))),
			);
			expect(
				provider.requests
					.slice(0, 4)
					.every((r) => r.authorization === "Bearer fixture-private-key"),
			).toBe(true);
			expect(
				provider.requests
					.slice(4)
					.every((r) => r.authorization === "Bearer other-private-key"),
			).toBe(true);
		} finally {
			await close();
			await provider.close();
			await rm(root, { recursive: true, force: true });
		}
	}, 20000);
