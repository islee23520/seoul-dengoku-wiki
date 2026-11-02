import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readFile, realpath, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import {
	importOriginals,
	openOriginalsStore,
} from "../../people-cli/src/store.ts";
import { loadConfig } from "../src/config.ts";
import { dispatchLocal } from "../src/local-provider.ts";
import { measurePng, resizePortraitPng } from "../src/png.ts";
import { createPortal } from "../src/server.ts";
import { hash } from "../src/sources.ts";
import { png } from "./backend.test.ts";

test("local defaults require no OAuth or ambient credentials", () => {
	const config = loadConfig({});
	expect(config).toMatchObject({
		mode: "local",
		ready: true,
		missing: [],
		host: "127.0.0.1",
		port: 18765,
		publicOrigin: "http://127.0.0.1:18765",
		clientId: "",
		clientSecret: "",
	});
	expect(config.storagePath).not.toBeNull();
});

test("local bounded relay distinguishes captured failure from uncertain redirect without retry", async () => {
	const canonical = createTransportFixture();
	for (const mode of [
		"http-failure",
		"invalid",
		"malformed",
		"redirect",
		"credential",
	] as const) {
		const root = await realpath(
			await mkdtemp(join(tmpdir(), "portal-local-failure-")),
		);
		let calls = 0;
		const provider = createServer((_req, res) => {
			calls++;
			if (mode === "redirect")
				res.writeHead(302, { location: "/elsewhere" }).end();
			else
				res
					.writeHead(mode === "http-failure" ? 429 : 200)
					.end(
						mode === "credential"
							? "own-fixture-key"
							: mode === "malformed"
								? '{"data":['
								: "{}",
					);
		});
		const ready = once(provider, "listening", {
			signal: AbortSignal.timeout(5000),
		});
		provider.listen(0, "127.0.0.1");
		await ready;
		const a = provider.address();
		if (!a || typeof a === "string") throw Error("address");
		try {
			const failure = await dispatchLocal(
				{
					projection: canonical.projection,
					orderedImageBytes: canonical.orderedImageBytes,
					requestId: randomUUID(),
				},
				{
					directory: root,
					outbound: (start) =>
						start(
							{
								endpointId: "local-openai",
								revision: "v1",
								protocolVersion: "openai-compatible-http.v1",
								toolName: "openai-images-edits",
								toolSchemaDigest: "a".repeat(64),
							},
							"own-fixture-key",
							`http://127.0.0.1:${a.port}/v1`,
						),
				},
			).then(
				() => null,
				(error: unknown) => error,
			);
			expect(failure).toMatchObject({
				uncertain: mode !== "http-failure",
			});
			expect(calls).toBe(1);
			if (mode === "credential")
				await expect(
					readFile(join(root, "provider-response.bin")),
				).rejects.toThrow();
		} finally {
			provider.closeAllConnections();
			await new Promise<void>((resolve) => provider.close(() => resolve()));
			await rm(root, { recursive: true, force: true });
		}
	}
});

test("local canonical multipart single job and batch seal evaluations over actual HTTP", async () => {
	const root = await realpath(
		await mkdtemp(join(tmpdir(), "portal-local-wire-")),
	);
	const canonical = createTransportFixture();
	const image = png();
	const references = canonical.candidate.referenceImages.map((r) => ({
		...r,
		bytes: image,
		...(r.role === "recipient-appearance-only"
			? { sourceHash: hash(image) }
			: {}),
	}));
	const template = {
		candidate: { ...canonical.candidate, referenceImages: references },
		operatorPins: {
			...canonical.operatorPins,
			referenceImages: references.map((r) => ({
				id: r.id,
				sha256: hash(image),
			})),
		},
	};
	const person = {
		id: "person-1003",
		characterId: "K1003",
		name: "Fixture 1003",
		detailRoute: "/people/person-1003",
		familyTree: { personId: "K1003" },
	};
	const detail = Buffer.from(JSON.stringify(person));
	const look = JSON.parse(
		Buffer.from(canonical.candidate.lookBytes).toString(),
	);
	const token = Buffer.from(
		JSON.stringify({
			...look,
			personId: person.id,
			characterId: person.characterId,
			name: person.name,
			identity: { characterId: person.characterId, name: person.name },
			image: { sha256: hash(image) },
			generationContract: { model: "gpt-image-2.5" },
		}),
	);
	const dbPath = join(root, "originals.sqlite");
	const db = openOriginalsStore(dbPath);
	importOriginals(db, [
		{
			personId: person.id,
			characterId: person.characterId,
			name: person.name,
			detail: { url: "fixture:detail", bytes: detail, sha256: hash(detail) },
			token: { url: "fixture:token", bytes: token, sha256: hash(token) },
			image: { url: "fixture:image", bytes: image, sha256: hash(image) },
		},
	]);
	db.close();
	const wiki = createServer((req, res) => {
		if (req.url === "/wiki/people")
			res.end(
				'<script type="module" src="/wiki/assets/index-fixture.js"></script>',
			);
		else if (req.url === "/wiki/assets/index-fixture.js")
			res.end('const x="assets/peopleCatalog-fixture.js";');
		else if (req.url === "/wiki/assets/peopleCatalog-fixture.js")
			res.end(`var e=${JSON.stringify([person])};export{e};`);
		else res.end(detail);
	});
	const rawRequests: Buffer[] = [];
	let wrongSize = false;
	const rawResponse = Buffer.from(
		JSON.stringify({
			data: [{ b64_json: Buffer.from(image).toString("base64") }],
		}),
	);
	const provider = createServer(async (req, res) => {
		expect(req.url).toBe("/v1/images/edits");
		expect(req.headers.authorization).toBe("Bearer own-key-only");
		const chunks: Buffer[] = [];
		for await (const chunk of req) chunks.push(Buffer.from(chunk));
		const bytes = Buffer.concat(chunks);
		rawRequests.push(bytes);
		const form = await new Response(bytes, {
			headers: { "content-type": req.headers["content-type"] ?? "" },
		}).formData();
		expect(form.get("model")).toBe("gpt-image-2.5-sunburst");
		expect(form.get("size")).toBe("1024x1536");
		expect(form.get("n")).toBe("1");
		expect(form.getAll("image[]")).toHaveLength(references.length);
		res.writeHead(200, { "content-type": "application/json" }).end(
			wrongSize
				? JSON.stringify({
						data: [
							{ b64_json: Buffer.from(png(1160, 1355)).toString("base64") },
						],
					})
				: rawResponse,
		);
	});
	for (const server of [wiki, provider]) {
		const ready = once(server, "listening", {
			signal: AbortSignal.timeout(5000),
		});
		server.listen(0, "127.0.0.1");
		await ready;
	}
	const wa = wiki.address(),
		pa = provider.address();
	if (!wa || typeof wa === "string" || !pa || typeof pa === "string")
		throw Error("address");
	const storage = join(root, "storage");
	const app = await createPortal(
		loadConfig({
			PORTAL_MODE: "local",
			PORTAL_PORT: "0",
			PORTAL_STORAGE_PATH: storage,
			PORTAL_ORIGINALS_DB: dbPath,
			WIKI_BASE_URL: `http://127.0.0.1:${wa.port}/wiki/`,
		}),
		{ template },
	);
	try {
		const ready = once(app.server, "listening", {
			signal: AbortSignal.timeout(5000),
		});
		app.server.listen(0, "127.0.0.1");
		await ready;
		const a = app.server.address();
		if (!a || typeof a === "string") throw Error("address");
		const origin = `http://127.0.0.1:${a.port}`,
			api = `${origin}/tools/api`;
		const boot = await fetch(`${api}/auth/session`);
		const session = z
			.object({ csrfToken: z.string() })
			.parse(await boot.json());
		const headers = {
			cookie: (boot.headers.get("set-cookie") ?? "").split(";")[0] ?? "",
			origin,
			"x-csrf-token": session.csrfToken,
			"content-type": "application/json",
		};
		const connected = await fetch(`${api}/connections`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				baseUrl: `http://127.0.0.1:${pa.port}/v1`,
				apiKey: "own-key-only",
			}),
		});
		const { connection } = z
			.object({
				connection: z.object({
					connectionId: z.uuid(),
					protocolVersion: z.literal("openai-compatible-http.v1"),
				}),
			})
			.parse(await connected.json());
		const sheetResponse = await fetch(`${api}/sheets`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				detailBase64: detail.toString("base64"),
				tokenBase64: token.toString("base64"),
				imageBase64: Buffer.from(image).toString("base64"),
			}),
		});
		const { sheetId } = z
			.object({ sheetId: z.uuid() })
			.parse(await sheetResponse.json());
		const requestId = randomUUID();
		const generation = {
			requestId,
			sheetId,
			connectionId: connection.connectionId,
			providerModel: "gpt-image-2.5-sunburst",
			faceMode: { kind: "unique", variantId: null },
		};
		for (const size of [null, 1024, "1160x1355", "1536x1024", "auto"]) {
			const invalid = await fetch(`${api}/generations`, {
				method: "POST",
				headers,
				body: JSON.stringify({ ...generation, size }),
			});
			expect(invalid.status).toBe(422);
			expect(rawRequests).toHaveLength(0);
		}
		const single = await fetch(`${api}/generations`, {
			method: "POST",
			headers,
			body: JSON.stringify(generation),
		});
		expect(single.status).toBe(200);
		expect(await single.json()).toMatchObject({
			job: { id: requestId, state: "HOLD" },
		});
		const dir = join(storage, "1", "jobs", requestId);
		expect(
			JSON.parse(await readFile(join(dir, "request-payload.json"), "utf8")),
		).toEqual(generation);
		expect(
			JSON.parse(
				await readFile(join(dir, "candidate.png.request.json"), "utf8"),
			),
		).toMatchObject({ size: "340x510", providerSize: "1024x1536" });
		expect(await readFile(join(dir, "provider-request.bin"))).toEqual(
			Buffer.from(rawRequests[0] ?? []),
		);
		expect(await readFile(join(dir, "provider-response.bin"))).toEqual(
			rawResponse,
		);
		expect(await readFile(join(dir, "candidate.png"))).toEqual(
			Buffer.from(resizePortraitPng(image)),
		);
		expect(
			measurePng(await readFile(join(dir, "candidate.png"))),
		).toMatchObject({ width: 340, height: 510 });
		expect(await readFile(join(dir, "provider-source.png"))).toEqual(
			Buffer.from(image),
		);
		expect(
			await readFile(join(dir, "candidate.png.request.json"), "utf8"),
		).not.toContain("own-key-only");
		await fetch(`${api}/generations`, {
			method: "POST",
			headers,
			body: JSON.stringify(generation),
		});
		expect(rawRequests).toHaveLength(1);
		const batchId = randomUUID();
		const settled = new Promise<void>((resolve, reject) => {
			const signal = AbortSignal.timeout(10000);
			const listener = (batch: { batchId: string; state: string }) => {
				if (batch.batchId === batchId && batch.state !== "RUNNING") {
					app.server.off("batch", listener);
					resolve();
				}
			};
			signal.addEventListener(
				"abort",
				() => {
					app.server.off("batch", listener);
					reject(signal.reason);
				},
				{ once: true },
			);
			app.server.on("batch", listener);
		});
		const batchResponse = await fetch(`${api}/batches`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				batchId,
				connectionId: connection.connectionId,
				providerModel: "gpt-image-2.5-sunburst",
				faceMode: { kind: "unique", variantId: null },
				items: [
					{
						personId: person.id,
						characterId: person.characterId,
						name: person.name,
						wikiDetailSHA: hash(detail),
						originalSourceHashes: {
							detail: hash(detail),
							token: hash(token),
							image: hash(image),
						},
					},
				],
			}),
		});
		expect(batchResponse.status).toBe(202);
		await settled;
		const batch = z
			.object({
				batch: z.object({
					state: z.literal("COMPLETED"),
					items: z.array(z.object({ requestId: z.uuid() })),
				}),
			})
			.parse(
				await (await fetch(`${api}/batches/${batchId}`, { headers })).json(),
			);
		expect(rawRequests).toHaveLength(2);
		for (const id of [requestId, batch.batch.items[0]?.requestId]) {
			const resultResponse = await fetch(`${api}/jobs/${id}/result`, {
				headers,
			});
			expect(resultResponse.status).toBe(200);
			const { result } = z
				.object({
					result: z.object({
						size: z.literal("340x510"),
						pngSHA: z.string(),
						receiptSHA: z.string(),
						machineEvidence: z.object({ metricsSHA: z.string() }),
					}),
				})
				.parse(await resultResponse.json());
			const evaluation = {
				evaluationId: randomUUID(),
				expectedRevision: 0,
				pngSHA: result.pngSHA,
				receiptSHA: result.receiptSHA,
				machineMetricsSHA: result.machineEvidence.metricsSHA,
				verdict: "hold",
				categories: Object.fromEntries(
					[
						"identity-and-face",
						"anatomy-and-pose",
						"framing-and-composition",
						"technique-and-style",
						"transparency-and-edges",
						"authored-conditions",
					].map((name) => [name, { judgement: "hold", notes: "" }]),
				),
				notes: "Fixture review",
			};
			expect(
				(
					await fetch(`${api}/jobs/${id}/evaluations`, {
						method: "POST",
						headers,
						body: JSON.stringify(evaluation),
					})
				).status,
			).toBe(201);
		}
		wrongSize = true;
		const unknownId = randomUUID();
		const unknownPayload = { ...generation, requestId: unknownId };
		const unknown = await fetch(`${api}/generations`, {
			method: "POST",
			headers,
			body: JSON.stringify(unknownPayload),
		});
		expect(await unknown.json()).toMatchObject({
			job: { id: unknownId, state: "UNKNOWN", imageUrl: null },
		});
		expect(
			(await fetch(`${api}/jobs/${unknownId}/result`, { headers })).status,
		).toBe(409);
		expect(rawRequests).toHaveLength(3);
		const replay = await fetch(`${api}/generations`, {
			method: "POST",
			headers,
			body: JSON.stringify(unknownPayload),
		});
		expect(await replay.json()).toMatchObject({ job: { state: "UNKNOWN" } });
		const blocked = await fetch(`${api}/generations`, {
			method: "POST",
			headers,
			body: JSON.stringify({ ...generation, requestId: randomUUID() }),
		});
		expect(blocked.status).toBe(409);
		expect(await blocked.json()).toMatchObject({
			error: { code: "OWNER_DISPATCH_UNCERTAIN" },
		});
		expect(rawRequests).toHaveLength(3);
	} finally {
		await app.close();
		for (const server of [wiki, provider]) {
			server.closeAllConnections();
			await new Promise<void>((resolve) => server.close(() => resolve()));
		}
		await rm(root, { recursive: true, force: true });
	}
}, 20000);

test("local bootstrap denies hostile Host/Origin and missing connection makes zero calls", async () => {
	const root = await realpath(await mkdtemp(join(tmpdir(), "portal-local-")));
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
	const config = loadConfig({
		PORTAL_MODE: "local",
		PORTAL_PORT: "0",
		PORTAL_STORAGE_PATH: root,
	});
	const app = await createPortal(config);
	try {
		const ready = once(app.server, "listening", {
			signal: AbortSignal.timeout(5000),
		});
		app.server.listen(0, "127.0.0.1");
		await ready;
		const address = app.server.address();
		if (!address || typeof address === "string") throw Error("address");
		const origin = `http://127.0.0.1:${address.port}`;
		const url = `${origin}/tools/api/auth/session`;
		expect(
			(await fetch(url, { headers: { host: "evil.example" } })).status,
		).toBe(403);
		expect(
			(await fetch(url, { headers: { origin: "https://evil.example" } }))
				.status,
		).toBe(403);
		const response = await fetch(url);
		expect(response.status).toBe(200);
		const session = z
			.object({ csrfToken: z.string() })
			.passthrough()
			.parse(await response.json());
		expect(session).toMatchObject({
			authenticated: true,
			mode: "local",
			user: { id: "1", login: "local" },
		});
		const cookie = response.headers.get("set-cookie") ?? "";
		expect(cookie).toContain("HttpOnly");
		expect(cookie).toContain("SameSite=Strict");
		expect(cookie).not.toContain("Secure");
		const headers = {
			cookie: cookie.split(";")[0] ?? "",
			origin,
			"x-csrf-token": session.csrfToken,
			"content-type": "application/json",
		};
		expect(
			(
				await fetch(`${origin}/tools/api/generations`, {
					method: "POST",
					headers,
					body: JSON.stringify({
						requestId: "fb092646-c550-4a02-a3b2-73ebd2e86c2e",
						sheetId: "6aa1b719-9db3-4faa-bce7-49fa89a74920",
						providerModel: "gpt-image-2.5-sunburst",
						size: "340x510",
						faceMode: { kind: "unique", variantId: null },
					}),
				})
			).status,
		).toBe(409);
		expect(calls).toBe(0);
		expect(
			(await fetch(`${origin}/tools/api/auth/login`, { redirect: "manual" }))
				.status,
		).toBe(404);
		const pa = provider.address();
		if (!pa || typeof pa === "string") throw Error("address");
		const payload = JSON.stringify({
			baseUrl: `http://127.0.0.1:${pa.port}/v1`,
			apiKey: "explicit-local-fixture-key",
		});
		expect(
			(
				await fetch(`${origin}/tools/api/connections`, {
					method: "POST",
					headers,
					body: JSON.stringify({
						baseUrl: `http://127.0.0.1:${pa.port}/v1`,
						apiKey: "",
					}),
				})
			).status,
		).toBe(422);
		expect(
			(
				await fetch(`${origin}/tools/api/connections`, {
					method: "POST",
					headers: { ...headers, "x-csrf-token": "wrong" },
					body: payload,
				})
			).status,
		).toBe(403);
		const connected = await fetch(`${origin}/tools/api/connections`, {
			method: "POST",
			headers,
			body: payload,
		});
		expect(connected.status).toBe(201);
		expect(await connected.text()).not.toContain("explicit-local-fixture-key");
		expect(calls).toBe(0);
		expect(
			(
				await fetch(`${origin}/tools/api/auth/logout`, {
					method: "POST",
					headers,
					body: "{}",
				})
			).status,
		).toBe(200);
		expect(
			(await fetch(`${origin}/tools/api/connections`, { headers })).status,
		).toBe(401);
		const reboot = await fetch(url, { headers: { cookie: headers.cookie } });
		expect(reboot.status).toBe(200);
		const freshCookie =
			(reboot.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
		expect(
			await (
				await fetch(`${origin}/tools/api/connections`, {
					headers: { cookie: freshCookie },
				})
			).json(),
		).toMatchObject({ connection: null });
	} finally {
		await app.close();
		provider.closeAllConnections();
		await new Promise<void>((resolve) => provider.close(() => resolve()));
		await rm(root, { recursive: true, force: true });
	}
});
