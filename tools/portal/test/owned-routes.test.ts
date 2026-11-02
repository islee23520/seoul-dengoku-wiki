import { expect, test } from "bun:test";
import { EventEmitter, once } from "node:events";
import {
	mkdir,
	mkdtemp,
	readFile,
	rm,
	stat,
	writeFile,
} from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import {
	importOriginals,
	openOriginalsStore,
} from "../../people-cli/src/store.ts";
import { createAuth } from "../src/auth.ts";
import { loadConfig } from "../src/config.ts";
import {
	MCP_PROFILE,
	PORTRAIT_TOOL,
	PORTRAIT_TOOL_DIGEST,
} from "../src/mcp.ts";
import { resizePortraitPng } from "../src/png.ts";
import { createPortal } from "../src/server.ts";
import { hash } from "../src/sources.ts";
import { png } from "./backend.test.ts";
import { connectOwned, mcpFixture, portraitReply } from "./mcp-fixture.ts";

test("authenticated missing connection is rejected before Wiki or MCP", async () => {
	const root = await mkdtemp(join(tmpdir(), "portal-owned-red-"));
	let outbound = 0;
	const sink = createServer((_req, res) => {
		outbound++;
		res.end("unexpected outbound");
	});
	const listening = once(sink, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	sink.listen(0, "127.0.0.1");
	await listening;
	const address = sink.address();
	if (!address || typeof address === "string") throw Error("address");
	const config = loadConfig({
		PORTAL_STORAGE_PATH: root,
		PORTAL_PUBLIC_URL: "https://portal.example/tools",
		PORTAL_SESSION_SECRET: "s".repeat(48),
		WIKI_BASE_URL: `http://127.0.0.1:${address.port}/wiki/`,
	});
	const auth = createAuth(config);
	const token = auth.issue({ id: "42", login: "reader" });
	const session = auth.verify(token);
	if (!session) throw Error("session");
	const app = await createPortal(config);
	const ready = once(app.server, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	app.server.listen(0, "127.0.0.1");
	await ready;
	const a = app.server.address();
	if (!a || typeof a === "string") throw Error("address");
	try {
		const response = await fetch(
			`http://127.0.0.1:${a.port}/tools/api/generations`,
			{
				method: "POST",
				headers: {
					cookie: `portal_session=${token}`,
					origin: "https://portal.example",
					"x-csrf-token": session.csrfToken,
					"content-type": "application/json",
				},
				body: JSON.stringify({
					requestId: "11111111-1111-4111-8111-111111111111",
					personId: "person-1003",
					providerModel: "gpt-image-2.5-sunburst",
					size: "340x510",
					faceMode: { kind: "unique", variantId: null },
				}),
			},
		);
		expect(await response.json()).toEqual({
			error: { code: "CONNECTION_REQUIRED" },
		});
		expect(response.status).toBe(409);
		expect(outbound).toBe(0);
	} finally {
		await app.close();
		await new Promise<void>((resolve, reject) => {
			sink.close((error) => (error ? reject(error) : resolve()));
			sink.closeAllConnections();
		});
		await rm(root, { recursive: true, force: true });
	}
});

test("endpoint registrations are strict credential-free public pins, with no environment loopback", async () => {
	const endpoint = {
		endpointId: "reviewed",
		revision: "r1",
		protocolVersion: MCP_PROFILE,
		toolName: PORTRAIT_TOOL.name,
		toolSchemaDigest: PORTRAIT_TOOL_DIGEST,
		endpoint: "https://bridge.example/mcp",
		origin: "https://portal.example",
		egress: { kind: "public" as const, address: "8.8.8.8" },
	};
	expect(loadConfig({}).mcpEndpoints).toEqual([]);
	expect(
		loadConfig({ PORTAL_MCP_ENDPOINTS: JSON.stringify([endpoint]) })
			.mcpEndpoints,
	).toEqual([endpoint]);
	for (const changed of [
		{ bridgeBearer: "not-config" },
		{ endpoint: "http://bridge.example/mcp" },
		{ endpoint: "https://user:secret@bridge.example/mcp" },
		{ toolSchemaDigest: "invalid" },
		{ egress: { kind: "test-loopback", address: "127.0.0.1" } },
		{ egress: { kind: "public", address: "169.254.169.254" } },
	])
		expect(() =>
			loadConfig({
				PORTAL_MCP_ENDPOINTS: JSON.stringify([{ ...endpoint, ...changed }]),
			}),
		).toThrow("INVALID_ENDPOINT_REGISTRATION");
	await expect(
		createPortal(
			loadConfig({
				PORTAL_MCP_ENDPOINTS: JSON.stringify([
					{ ...endpoint, toolSchemaDigest: "0".repeat(64) },
				]),
			}),
		),
	).rejects.toThrow("INVALID_ENDPOINT_REGISTRATION");
});

async function ownedHarness(
	mode:
		| "candidate"
		| "invalid"
		| "mismatch"
		| "unknown"
		| "blocked" = "candidate",
	options: { readonly now?: () => number; readonly batch?: boolean } = {},
) {
	const root = await mkdtemp(join(tmpdir(), "portal-owned-"));
	const image = png();
	const canonical = createTransportFixture();
	const images = canonical.candidate.referenceImages.map((r) => ({
		...r,
		bytes: image,
		...(r.role === "recipient-appearance-only"
			? { sourceHash: hash(image) }
			: {}),
	}));
	const template = {
		candidate: { ...canonical.candidate, referenceImages: images },
		operatorPins: {
			...canonical.operatorPins,
			referenceImages: images.map((r) => ({ id: r.id, sha256: hash(image) })),
		},
	};
	const look = JSON.parse(
		Buffer.from(canonical.candidate.lookBytes).toString(),
	);
	const person = {
		id: "person-1003",
		characterId: "K1003",
		name: look.name,
		detailRoute: "/people/person-1003",
		familyTree: { personId: "K1003" },
	};
	const detail = Buffer.from(JSON.stringify(person));
	const tokenBytes = Buffer.from(
		JSON.stringify({
			...look,
			personId: person.id,
			characterId: person.characterId,
			identity: { characterId: person.characterId, name: person.name },
			image: { sha256: hash(image) },
			generationContract: { model: "gpt-image-2.5" },
		}),
	);
	const dbPath = join(root, "originals.sqlite");
	if (options.batch) {
		const db = openOriginalsStore(dbPath);
		importOriginals(db, [
			{
				personId: person.id,
				characterId: person.characterId,
				name: person.name,
				detail: { url: "fixture:detail", bytes: detail, sha256: hash(detail) },
				token: {
					url: "fixture:token",
					bytes: tokenBytes,
					sha256: hash(tokenBytes),
				},
				image: { url: "fixture:image", bytes: image, sha256: hash(image) },
			},
		]);
		db.close();
	}
	const signals = new EventEmitter();
	let release: (() => void) | null = null;
	const bridge = await mcpFixture(async (rpc, _req, res) => {
		const result = portraitReply(
			rpc,
			mode === "invalid" ? Buffer.from("invalid") : image,
		);
		if (mode === "mismatch")
			result.result.structuredContent.sourceSHA = "0".repeat(64);
		if (mode === "blocked") {
			const released = new Promise<void>((resolve) => {
				release = resolve;
			});
			signals.emit("consumed", rpc);
			await released;
		} else signals.emit("consumed", rpc);
		res.writeHead(200, {
			"content-type":
				mode === "unknown" ? "text/event-stream" : "application/json",
		});
		res.end(mode === "unknown" ? "data: {" : JSON.stringify(result));
	});
	let wikiCalls = 0;
	const wiki = createServer((req, res) => {
		wikiCalls++;
		if (options.batch) {
			if (req.url === "/wiki/people")
				res.end(
					'<script type="module" src="/wiki/assets/index-fixture.js"></script>',
				);
			else if (req.url === "/wiki/assets/index-fixture.js")
				res.end('const x="assets/peopleCatalog-fixture.js";');
			else if (req.url === "/wiki/assets/peopleCatalog-fixture.js")
				res.end(`var e=${JSON.stringify([person])};export{e};`);
			else res.end(detail);
			return;
		}
		res.end("unexpected Wiki");
	});
	const wReady = once(wiki, "listening", { signal: AbortSignal.timeout(5000) });
	wiki.listen(0, "127.0.0.1");
	await wReady;
	const wa = wiki.address();
	if (!wa || typeof wa === "string") throw Error("address");
	const config = loadConfig({
		PORTAL_PUBLIC_URL: "https://portal.example/tools",
		PORTAL_SESSION_SECRET: "s".repeat(48),
		PORTAL_STORAGE_PATH: root,
		...(options.batch ? { PORTAL_ORIGINALS_DB: dbPath } : {}),
		WIKI_BASE_URL: `http://127.0.0.1:${wa.port}/wiki/`,
	});
	const auth = createAuth(config);
	const headersFor = (owner: string) => {
		const token = auth.issue({ id: owner, login: "reader" });
		const session = auth.verify(token);
		if (!session) throw Error("session");
		return {
			cookie: `portal_session=${token}`,
			origin: "https://portal.example",
			"x-csrf-token": session.csrfToken,
			"content-type": "application/json",
		};
	};
	const app = await createPortal(config, {
		template,
		testEndpoints: [bridge.registration],
		...(options.now ? { now: options.now } : {}),
	});
	const ready = once(app.server, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	app.server.listen(0, "127.0.0.1");
	await ready;
	const address = app.server.address();
	if (!address || typeof address === "string") throw Error("address");
	const origin = `http://127.0.0.1:${address.port}`;
	const owner = headersFor("42"),
		other = headersFor("43");
	const sheetBody = {
		detailBase64: Buffer.from(
			JSON.stringify({
				id: "person-test",
				name: look.name,
				detailRoute: "/people/person-test",
				familyTree: { personId: look.characterId },
			}),
		).toString("base64"),
		tokenBase64: Buffer.from(
			JSON.stringify({
				...look,
				personId: "person-test",
				image: { sha256: hash(image) },
				generationContract: { model: "gpt-image-2.5" },
			}),
		).toString("base64"),
		imageBase64: Buffer.from(image).toString("base64"),
	};
	const upload = await fetch(`${origin}/tools/api/sheets`, {
		method: "POST",
		headers: owner,
		body: JSON.stringify(sheetBody),
	});
	const sheet = (await upload.json()) as { sheetId: string };
	const payload = {
		requestId: "11111111-1111-4111-8111-111111111111",
		sheetId: sheet.sheetId,
		providerModel: "gpt-image-2.5-sunburst",
		size: "340x510",
		faceMode: { kind: "unique", variantId: null },
	};
	const post = (path: string, value: unknown, headers = owner) =>
		fetch(`${origin}/tools/api/${path}`, {
			method: "POST",
			headers,
			body: JSON.stringify(value),
		});
	return {
		root,
		app,
		bridge,
		origin,
		owner,
		other,
		auth,
		config,
		image,
		payload,
		selection: {
			personId: person.id,
			characterId: person.characterId,
			name: person.name,
			wikiDetailSHA: hash(detail),
			originalSourceHashes: {
				detail: hash(detail),
				token: hash(tokenBytes),
				image: hash(image),
			},
		},
		post,
		signals,
		headersFor,
		wikiCalls: () => wikiCalls,
		release: () => release?.(),
		close: async () => {
			release?.();
			await app.close();
			await bridge.close();
			await new Promise<void>((resolve, reject) => {
				wiki.close((error) => (error ? reject(error) : resolve()));
				wiki.closeAllConnections();
			});
			await rm(root, { recursive: true, force: true });
		},
	};
}

const historyResponse = z.object({
	jobs: z.array(z.object({ id: z.string() })),
	history: z.array(
		z.object({
			job: z.object({ id: z.string() }),
			createdAt: z.iso.datetime().nullable(),
			classification: z.strictObject({
				kind: z.literal("portrait"),
				reviewAuthority: z.literal("owner"),
			}),
			source: z.unknown().nullable(),
			sourceError: z.string().nullable(),
		}),
	),
});

test("job history admission timestamp survives replay and reload without rewriting legacy jobs", async () => {
	let time = Date.parse("2026-10-15T10:00:00.000Z");
	const f = await ownedHarness("candidate", { now: () => time });
	try {
		const connectionId = await connectOwned(f.origin, f.owner, "owner-key");
		const payload = { ...f.payload, connectionId };
		expect((await f.post("generations", payload)).status).toBe(200);
		const dir = join(f.root, "42", "jobs", payload.requestId);
		const sidecar = await readFile(join(dir, "job-history.json"));
		expect(JSON.parse(sidecar.toString())).toEqual({
			createdAt: "2026-10-15T10:00:00.000Z",
		});
		expect((await stat(join(dir, "job-history.json"))).mode & 0o777).toBe(
			0o600,
		);
		const jobBytes = await readFile(join(dir, "job.json"));
		expect(JSON.parse(jobBytes.toString())).not.toHaveProperty("createdAt");
		const legacyId = "22222222-2222-4222-8222-222222222222";
		const legacyDir = join(f.root, "42", "jobs", legacyId);
		await mkdir(legacyDir, { recursive: true });
		const legacy = Buffer.from(
			JSON.stringify({
				...JSON.parse(jobBytes.toString()),
				id: legacyId,
			}),
		);
		await writeFile(join(legacyDir, "job.json"), legacy);
		time += 86400000;
		expect((await f.post("generations", payload)).status).toBe(200);
		expect(await readFile(join(dir, "job-history.json"))).toEqual(sidecar);
		await f.app.close();
		const reloaded = await createPortal(f.config, { now: () => time });
		try {
			const ready = once(reloaded.server, "listening", {
				signal: AbortSignal.timeout(5000),
			});
			reloaded.server.listen(0, "127.0.0.1");
			await ready;
			const address = reloaded.server.address();
			if (!address || typeof address === "string") throw Error("address");
			const url = `http://127.0.0.1:${address.port}/tools/api/jobs`;
			const history = historyResponse.parse(
				await (await fetch(url, { headers: f.owner })).json(),
			);
			expect(
				history.history.find((row) => row.job.id === payload.requestId)
					?.createdAt,
			).toBe("2026-10-15T10:00:00.000Z");
			expect(
				history.history.find((row) => row.job.id === legacyId),
			).toMatchObject({
				createdAt: null,
				classification: {
					kind: "portrait",
					reviewAuthority: "owner",
				},
				source: null,
				sourceError: "CAPTURED_SOURCE_UNAVAILABLE",
			});
			const other = historyResponse.parse(
				await (await fetch(url, { headers: f.other })).json(),
			);
			expect(other.history).toEqual([]);
			expect(other.jobs).toEqual([]);
			expect(await readFile(join(legacyDir, "job.json"))).toEqual(legacy);
			expect(await readFile(join(dir, "job.json"))).toEqual(jobBytes);
			expect(await readFile(join(dir, "job-history.json"))).toEqual(sidecar);
			expect(f.bridge.requests).toHaveLength(4);
		} finally {
			await reloaded.close();
		}
	} finally {
		await f.close();
	}
});

test("batch job history records immutable batch admission time before later dispatch", async () => {
	let time = Date.parse("2026-10-15T11:00:00.000Z");
	const f = await ownedHarness("blocked", { now: () => time, batch: true });
	try {
		const connectionId = await connectOwned(f.origin, f.owner, "owner-key");
		const payload = {
			batchId: "33333333-3333-4333-8333-333333333333",
			connectionId,
			providerModel: "gpt-image-2.5-sunburst",
			faceMode: { kind: "unique", variantId: null },
			items: [f.selection],
		};
		const consumed = once(f.signals, "consumed", {
			signal: AbortSignal.timeout(5000),
		});
		const admitted = await f.post("batches", payload);
		expect(admitted.status).toBe(202);
		await consumed;
		const batch = z
			.object({
				batch: z.object({
					items: z.array(z.object({ requestId: z.string() })),
				}),
			})
			.parse(await admitted.json());
		const requestId = batch.batch.items[0]?.requestId;
		if (!requestId) throw Error("missing batch job");
		const path = join(f.root, "42", "jobs", requestId, "job-history.json");
		const sidecar = await readFile(path);
		expect(JSON.parse(sidecar.toString())).toEqual({
			createdAt: "2026-10-15T11:00:00.000Z",
		});
		time += 86400000;
		const completed = new Promise<void>((resolve, reject) => {
			const signal = AbortSignal.timeout(5000);
			const listener = (row: { state: string }) => {
				if (row.state !== "COMPLETED") return;
				f.app.server.off("batch", listener);
				resolve();
			};
			signal.addEventListener(
				"abort",
				() => {
					f.app.server.off("batch", listener);
					reject(signal.reason);
				},
				{ once: true },
			);
			f.app.server.on("batch", listener);
		});
		f.release();
		await completed;
		expect((await f.post("batches", payload)).status).toBe(200);
		expect(await readFile(path)).toEqual(sidecar);
		expect((await stat(path)).mode & 0o777).toBe(0o600);
		const history = historyResponse.parse(
			await (
				await fetch(`${f.origin}/tools/api/jobs`, { headers: f.owner })
			).json(),
		);
		expect(
			history.history.find((row) => row.job.id === requestId)?.createdAt,
		).toBe("2026-10-15T11:00:00.000Z");
		expect(f.bridge.requests).toHaveLength(4);
	} finally {
		await f.close();
	}
});

test("owned HTTP handshake gates auth, CSRF, explicit authority, privacy and local replay", async () => {
	const f = await ownedHarness();
	try {
		const denied = await f.post(
			"connections",
			{ endpointId: "owned-fixture", bridgeBearer: "owner-key" },
			{ ...f.owner, cookie: "portal_session=tampered" },
		);
		expect(denied.status).toBe(401);
		const expired = createAuth(
			f.config,
			undefined,
			() => Date.now() - 28800001,
		).issue({ id: "42", login: "reader" });
		expect(
			(
				await f.post("generations", f.payload, {
					...f.owner,
					cookie: `portal_session=${expired}`,
				})
			).status,
		).toBe(401);
		expect(
			(
				await f.post(
					"connections",
					{ endpointId: "owned-fixture", bridgeBearer: "owner-key" },
					{ ...f.owner, origin: "https://evil.example" },
				)
			).status,
		).toBe(403);
		expect((await f.post("generations", f.payload)).status).toBe(409);
		expect(f.bridge.requests).toHaveLength(0);
		expect(f.wikiCalls()).toBe(0);
		const id = await connectOwned(f.origin, f.owner, "owner-key");
		expect(f.bridge.requests.map((r) => r.rpc.method)).toEqual([
			"initialize",
			"notifications/initialized",
			"tools/list",
		]);
		expect(
			f.bridge.requests.every((r) => r.authorization === "Bearer owner-key"),
		).toBe(true);
		const current = await (
			await fetch(`${f.origin}/tools/api/connections`, { headers: f.owner })
		).text();
		expect(current).not.toContain("owner-key");
		expect(current).not.toContain("private-fixture-session");
		expect(current).not.toContain("sessionFingerprint");
		const foreign = await f.post(
			"generations",
			{
				...f.payload,
				connectionId: id,
				sheetId: undefined,
				personId: "person-1003",
			},
			f.other,
		);
		expect(foreign.status).toBe(404);
		expect(await foreign.text()).toContain("CONNECTION_NOT_FOUND");
		const absent = await f.post("generations", {
			...f.payload,
			connectionId: "99999999-9999-4999-8999-999999999999",
		});
		expect(absent.status).toBe(404);
		expect(f.bridge.requests).toHaveLength(3);
		expect(f.wikiCalls()).toBe(0);
		const payload = { ...f.payload, connectionId: id };
		const result = (await (await f.post("generations", payload)).json()) as {
			job: { state: string; imageUrl: string };
		};
		expect(result.job.state).toBe("HOLD");
		expect(f.bridge.requests).toHaveLength(4);
		const dir = join(f.root, "42", "jobs", payload.requestId);
		const consumedWire = f.bridge.requests[3];
		if (!consumedWire) throw Error("consumed request");
		expect(
			(await readFile(join(dir, "mcp-request.bin"))).equals(consumedWire.bytes),
		).toBe(true);
		expect(await readFile(join(dir, "candidate.png"))).toEqual(
			Buffer.from(resizePortraitPng(f.image)),
		);
		const receipt = await readFile(
			join(dir, "candidate.png.receipt.json"),
			"utf8",
		);
		expect(JSON.parse(receipt).reviewStatus).toBe("candidate-unreviewed");
		expect(
			(await fetch(f.origin + result.job.imageUrl, { headers: f.other }))
				.status,
		).toBe(404);
		expect(
			(await fetch(f.origin + result.job.imageUrl, { headers: f.owner }))
				.status,
		).toBe(200);
		expect((await f.post("generations", payload)).status).toBe(200);
		expect(
			(
				await f.post("generations", {
					...payload,
					sheetId: "99999999-9999-4999-8999-999999999999",
				})
			).status,
		).toBe(409);
		const disconnect = await fetch(`${f.origin}/tools/api/connections/${id}`, {
			method: "DELETE",
			headers: f.owner,
		});
		expect(disconnect.status).toBe(200);
		expect((await f.post("generations", f.payload)).status).toBe(200);
		const revoked = await f.post("generations", {
			...payload,
			requestId: "22222222-2222-4222-8222-222222222222",
		});
		expect(revoked.status).toBe(409);
		expect(await revoked.text()).toContain("CONNECTION_NOT_READY");
		expect(f.bridge.requests).toHaveLength(4);
		expect(f.wikiCalls()).toBe(0);
	} finally {
		await f.close();
	}
});

test("logout racing completed protocol verification never promotes a connection", async () => {
	const root = await mkdtemp(join(tmpdir(), "portal-connect-race-"));
	const signals = new EventEmitter();
	const gate: { finish: (() => void) | null } = { finish: null };
	const bridge = await mcpFixture(
		() => {
			throw Error("unexpected portrait");
		},
		async (rpc) => {
			if (rpc.method !== "tools/list") return false;
			const released = new Promise<void>((resolve) => {
				gate.finish = resolve;
			});
			signals.emit("listing");
			await released;
			return false;
		},
	);
	const config = loadConfig({
		PORTAL_STORAGE_PATH: root,
		PORTAL_PUBLIC_URL: "https://portal.example/tools",
		PORTAL_SESSION_SECRET: "s".repeat(48),
	});
	const auth = createAuth(config);
	const token = auth.issue({ id: "42", login: "reader" });
	const session = auth.verify(token);
	if (!session) throw Error("session");
	const app = await createPortal(config, {
		testEndpoints: [bridge.registration],
	});
	const ready = once(app.server, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	app.server.listen(0, "127.0.0.1");
	await ready;
	const address = app.server.address();
	if (!address || typeof address === "string") throw Error("address");
	const origin = `http://127.0.0.1:${address.port}`;
	const headers = {
		cookie: `portal_session=${token}`,
		origin: "https://portal.example",
		"x-csrf-token": session.csrfToken,
		"content-type": "application/json",
	};
	try {
		const listing = once(signals, "listing", {
			signal: AbortSignal.timeout(5000),
		});
		const pending = fetch(`${origin}/tools/api/connections`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				endpointId: "owned-fixture",
				bridgeBearer: "race-key",
			}),
		});
		await listing;
		expect(
			(
				await fetch(`${origin}/tools/api/auth/logout`, {
					method: "POST",
					headers,
					body: "{}",
				})
			).status,
		).toBe(200);
		gate.finish?.();
		const response = await pending;
		expect(response.status).toBe(409);
		expect(await response.text()).toContain("CONNECTION_NOT_READY");
		expect(bridge.requests.map((r) => r.rpc.method)).toEqual([
			"initialize",
			"notifications/initialized",
			"tools/list",
		]);
	} finally {
		gate.finish?.();
		await app.close();
		await bridge.close();
		await rm(root, { recursive: true, force: true });
	}
});

for (const mode of ["invalid", "mismatch", "unknown"] as const)
	test(`owned MCP ${mode} preserves exact evidence and correct terminal uncertainty`, async () => {
		const f = await ownedHarness(mode);
		try {
			const id = await connectOwned(f.origin, f.owner, "owner-key");
			const result = (await (
				await f.post("generations", { ...f.payload, connectionId: id })
			).json()) as { job: { state: string; errorCode: string } };
			expect(result.job.state).toBe(mode === "unknown" ? "UNKNOWN" : "FAILED");
			expect(result.job.errorCode).toBe("MCP_INVALID_RESPONSE");
			const raw = await readFile(
				join(f.root, "42", "jobs", f.payload.requestId, "mcp-response.bin"),
				"utf8",
			);
			expect(raw.length).toBeGreaterThan(0);
			if (mode === "unknown") {
				expect(raw).toBe("data: {");
				const next = await f.post("generations", {
					...f.payload,
					connectionId: id,
					requestId: "22222222-2222-4222-8222-222222222222",
				});
				expect(next.status).toBe(409);
				expect(await next.text()).toContain("OWNER_DISPATCH_UNCERTAIN");
				const connect = await f.post("connections", {
					endpointId: "owned-fixture",
					bridgeBearer: "new-key",
				});
				expect(connect.status).toBe(409);
				expect(await connect.text()).toContain("OWNER_DISPATCH_UNCERTAIN");
			}
			expect(f.bridge.requests).toHaveLength(4);
		} finally {
			await f.close();
		}
	});

test("owner lease covers async admission, logout closes a consumed dispatch, and persisted running blocks handshake", async () => {
	const f = await ownedHarness("blocked");
	try {
		const id = await connectOwned(f.origin, f.owner, "owner-key");
		const consumed = once(f.signals, "consumed", {
			signal: AbortSignal.timeout(5000),
		});
		const pending = f.post("generations", { ...f.payload, connectionId: id });
		await consumed;
		const competing = await f.post("connections", {
			endpointId: "owned-fixture",
			bridgeBearer: "other-key",
		});
		expect(competing.status).toBe(409);
		expect(await competing.text()).toContain("JOB_RUNNING");
		const logout = await f.post("auth/logout", {});
		expect(logout.status).toBe(200);
		const result = (await (await pending).json()) as { job: { state: string } };
		expect(result.job.state).toBe("UNKNOWN");
		expect(
			(await f.post("generations", { ...f.payload, connectionId: id })).status,
		).toBe(401);
		const newSession = f.headersFor("42");
		expect(
			(
				await f.post(
					"connections",
					{ endpointId: "owned-fixture", bridgeBearer: "replacement" },
					newSession,
				)
			).status,
		).toBe(409);
		expect(f.bridge.requests).toHaveLength(4);
		const dir = join(
			f.root,
			"44",
			"jobs",
			"33333333-3333-4333-8333-333333333333",
		);
		await mkdir(dir, { recursive: true });
		await writeFile(
			join(dir, "job.json"),
			JSON.stringify({
				id: "33333333-3333-4333-8333-333333333333",
				state: "RUNNING",
				reviewStatus: "HOLD",
				imageUrl: null,
				metrics: null,
				errorCode: null,
				payloadSHA: "persisted",
			}),
		);
		const restarted = await f.post(
			"connections",
			{ endpointId: "owned-fixture", bridgeBearer: "never-handshake" },
			f.headersFor("44"),
		);
		expect(restarted.status).toBe(409);
		expect(await restarted.text()).toContain("OWNER_DISPATCH_UNCERTAIN");
		expect(f.bridge.requests).toHaveLength(4);
	} finally {
		await f.close();
	}
});
