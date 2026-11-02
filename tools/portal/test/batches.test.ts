import { expect, setSystemTime, test } from "bun:test";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import {
	mkdtemp,
	readdir,
	readFile,
	realpath,
	rm,
	writeFile,
} from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import {
	importOriginals,
	openOriginalsStore,
} from "../../people-cli/src/store.ts";
import { createAuth } from "../src/auth.ts";
import { resolveBatchBinding } from "../src/batches.ts";
import { loadConfig } from "../src/config.ts";
import { resizePortraitPng } from "../src/png.ts";
import { createPortal } from "../src/server.ts";
import { hash } from "../src/sources.ts";
import { png } from "./backend.test.ts";
import { connectOwned, mcpFixture, portraitReply } from "./mcp-fixture.ts";

const batchResponse = z.object({
	batch: z.object({
		state: z.string(),
		items: z.array(
			z.object({
				status: z.string(),
				itemId: z.string().uuid(),
				requestId: z.string().uuid(),
			}),
		),
	}),
});

async function fixture(tokenOnly = false) {
	const directory = await mkdtemp(join(tmpdir(), "portal-batches-"));
	const storage = join(directory, "private");
	const canonical = createTransportFixture();
	const image = png();
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
	const people = [1003, 1004].map((id) => ({
		id: `person-${id}`,
		characterId: `K${id}`,
		name: `Fixture ${id}`,
		detailRoute: `/people/person-${id}`,
		familyTree: { personId: `K${id}` },
	}));
	const dbPath = join(directory, "originals.sqlite");
	const db = openOriginalsStore(dbPath);
	const originals = people.map((person) => {
		const detail = Buffer.from(JSON.stringify(person));
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
		return {
			personId: person.id,
			characterId: person.characterId,
			name: person.name,
			detail: { url: "fixture:detail", bytes: detail, sha256: hash(detail) },
			token: { url: "fixture:token", bytes: token, sha256: hash(token) },
			image: { url: "fixture:image", bytes: image, sha256: hash(image) },
		};
	});
	importOriginals(db, tokenOnly ? originals.slice(0, 1) : originals);
	db.close();
	const wikiCalls: string[] = [];
	let stale = false;
	const wiki = createServer((req, res) => {
		wikiCalls.push(req.url ?? "");
		if (req.url === "/wiki/people")
			res.end(
				'<script type="module" src="/wiki/assets/index-fixture.js"></script>',
			);
		else if (req.url === "/wiki/assets/index-fixture.js")
			res.end('const x="assets/peopleCatalog-fixture.js";');
		else if (req.url === "/wiki/assets/peopleCatalog-fixture.js")
			res.end(
				`var e=${JSON.stringify(people.map((p, i) => ({ ...p, name: stale && i === 1 ? "Changed" : p.name })))};export{e};`,
			);
		else if (
			tokenOnly &&
			req.url === "/wiki/portrait-tokens/person-1004.json"
		) {
			res.end(originals[1]?.token.bytes);
		} else {
			const person = people.find(
				(p) => req.url === `/wiki/person-details/${p.id}.json`,
			);
			res.end(
				JSON.stringify(
					person && {
						...person,
						name:
							stale && person.id === "person-1004" ? "Changed" : person.name,
					},
				),
			);
		}
	});
	const wikiReady = once(wiki, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	wiki.listen(0, "127.0.0.1");
	await wikiReady;
	const wa = wiki.address();
	if (!wa || typeof wa === "string") throw Error("address");
	let mode: "success" | "blocked" | "unknown" | "failed" = "success";
	let release = () => {};
	const bridge = await mcpFixture(async (rpc, _req, res) => {
		if (mode === "blocked") {
			const barrier = new Promise<void>((resolve) => {
				release = resolve;
			});
			bridge.server.emit("consumed", rpc);
			await barrier;
		}
		res.writeHead(200, {
			"content-type":
				mode === "unknown" ? "text/event-stream" : "application/json",
		});
		res.end(
			mode === "unknown"
				? "data: {"
				: JSON.stringify(
						portraitReply(
							rpc,
							mode === "failed" ? Buffer.from("invalid") : image,
						),
					),
		);
	});
	const config = loadConfig({
		PORTAL_PUBLIC_URL: "https://portal.example/tools",
		PORTAL_SESSION_SECRET: "s".repeat(48),
		PORTAL_STORAGE_PATH: storage,
		PORTAL_ORIGINALS_DB: dbPath,
		WIKI_BASE_URL: `http://127.0.0.1:${wa.port}/wiki/`,
	});
	const auth = createAuth(config);
	const headersFor = (id = "42", now?: number) => {
		const token = (
			now === undefined ? auth : createAuth(config, fetch, () => now)
		).issue({ id, login: "fixture" });
		const session = auth.verify(token);
		const parsed = JSON.parse(
			Buffer.from(token.split(".")[0] ?? "", "base64url").toString(),
		);
		return {
			cookie: `portal_session=${token}`,
			origin: "https://portal.example",
			"x-csrf-token": session?.csrfToken ?? parsed.csrfToken,
			"content-type": "application/json",
		};
	};
	let app = await createPortal(config, {
		template,
		testEndpoints: [bridge.registration],
	});
	async function listen() {
		const ready = once(app.server, "listening", {
			signal: AbortSignal.timeout(5000),
		});
		app.server.listen(0, "127.0.0.1");
		await ready;
		const address = app.server.address();
		if (!address || typeof address === "string") throw Error("address");
		return `http://127.0.0.1:${address.port}`;
	}
	let origin = await listen();
	const owner = headersFor();
	const connectionId = await connectOwned(origin, owner, "owner-bearer");
	const eligible = await fetch(`${origin}/tools/api/wiki/people`, {
		headers: owner,
	});
	const catalogue = z
		.object({
			people: z.array(
				z.object({
					generationEligibility: z.object({ eligible: z.boolean() }),
				}),
			),
		})
		.parse(await eligible.json());
	expect(catalogue.people.map((p) => p.generationEligibility.eligible)).toEqual(
		[true, true],
	);
	const payload = {
		batchId: randomUUID(),
		connectionId,
		providerModel: "gpt-image-2.5-sunburst",
		faceMode: { kind: "unique", variantId: null },
		items: people.map((p, i) => {
			const original = originals[i];
			if (!original) throw Error("original");
			return {
				personId: p.id,
				characterId: p.characterId,
				name: p.name,
				wikiDetailSHA: hash(Buffer.from(JSON.stringify(p))),
				originalSourceHashes: {
					detail: original.detail.sha256,
					token: original.token.sha256,
					image: tokenOnly && i === 1 ? null : original.image.sha256,
				},
			};
		}),
	};
	const post = (path: string, value: unknown, headers = owner) =>
		fetch(`${origin}/tools/api/${path}`, {
			method: "POST",
			headers,
			body: JSON.stringify(value),
		});
	const get = (path: string, headers = owner) =>
		fetch(`${origin}/tools/api/${path}`, { headers });
	const disconnect = () =>
		fetch(`${origin}/tools/api/connections/${connectionId}`, {
			method: "DELETE",
			headers: owner,
		});
	const settled = () =>
		new Promise<void>((resolve, reject) => {
			const signal = AbortSignal.timeout(5000);
			const listener = (batch: { batchId: string; state: string }) => {
				if (
					batch.batchId === payload.batchId &&
					batch.state !== "RUNNING" &&
					batch.state !== "CANCEL_REQUESTED"
				) {
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
	return {
		directory,
		storage,
		config,
		template,
		owner,
		headersFor,
		payload,
		post,
		get,
		disconnect,
		connect: (headers = owner) =>
			connectOwned(origin, headers, "new-owner-bearer"),
		bridge,
		wikiCalls,
		image,
		settled,
		app: () => app,
		mode: (next: typeof mode) => {
			mode = next;
		},
		stale: () => {
			stale = true;
		},
		release: () => release(),
		restart: async (alreadyClosed = false) => {
			if (!alreadyClosed) await app.close();
			app = await createPortal(config, {
				template,
				testEndpoints: [bridge.registration],
			});
			origin = await listen();
		},
		close: async () => {
			release();
			await app.close();
			await bridge.close();
			await new Promise<void>((resolve) => {
				wiki.close(() => resolve());
				wiki.closeAllConnections();
			});
			await rm(directory, { recursive: true, force: true });
		},
	};
}

test("wiki design token without a photo supports single and batch generation", async () => {
	const f = await fixture(true);
	try {
		const source = z
			.object({
				generationEligibility: z.object({
					eligible: z.boolean(),
					sourceMode: z.string(),
					originalSourceHashes: z.object({ image: z.string().nullable() }),
				}),
				imageBase64: z.string().nullable(),
			})
			.parse(await (await f.get("wiki/people/person-1004")).json());
		expect(source.generationEligibility).toMatchObject({
			eligible: true,
			sourceMode: "design-token-only",
		});
		expect(source.imageBase64).toBeNull();
		expect(source.generationEligibility.originalSourceHashes.image).toBeNull();
		const requestId = randomUUID();
		const single = await f.post("generations", {
			requestId,
			connectionId: f.payload.connectionId,
			personId: "person-1004",
			providerModel: f.payload.providerModel,
			size: "340x510",
			faceMode: f.payload.faceMode,
		});
		expect(single.status).toBe(200);
		expect(
			z
				.object({ job: z.object({ state: z.string() }) })
				.parse(await single.json()).job.state,
		).toBe("HOLD");
		const singleSource = JSON.parse(
			await readFile(
				join(f.storage, "42", "jobs", requestId, "source-bytes.json"),
				"utf8",
			),
		);
		expect(singleSource.image).toBeNull();
		const done = f.settled();
		expect((await f.post("batches", f.payload)).status).toBe(202);
		await done;
		const { batch } = batchResponse.parse(
			await (await f.get(`batches/${f.payload.batchId}`)).json(),
		);
		expect(batch.items.map((item) => item.status)).toEqual(["HOLD", "HOLD"]);
		const calls = f.bridge.requests.filter(
			(r) => r.rpc.method === "tools/call",
		);
		expect(calls).toHaveLength(3);
		const tokenJob = batch.items[1];
		if (!tokenJob) throw Error("missing token-only job");
		const retained = JSON.parse(
			await readFile(
				join(f.storage, "42", "jobs", tokenJob.requestId, "source-bytes.json"),
				"utf8",
			),
		);
		expect(retained.image).toBeNull();
	} finally {
		await f.close();
	}
});

test("eligible Wiki person automatically includes its registered authored token without dispatch", async () => {
	const f = await fixture();
	try {
		const sheetSchema = z.object({
			token: z.record(z.string(), z.unknown()),
			sourceHashes: z.object({
				detail: z.string(),
				token: z.string(),
				image: z.string(),
			}),
			imageBase64: z.string(),
		});
		const registered = sheetSchema.parse(
			await (await f.get("characters/person-1003")).json(),
		);
		const response = await f.get("wiki/people/person-1003");
		expect(response.status).toBe(200);
		const source = sheetSchema
			.extend({
				source: z.object({ sha256: z.string() }),
				generationEligibility: z.object({
					originalSourceHashes: sheetSchema.shape.sourceHashes,
				}),
			})
			.parse(await response.json());
		expect(source.token).toEqual(registered.token);
		expect(source.sourceHashes.token).toBe(registered.sourceHashes.token);
		expect(source.sourceHashes.detail).toBe(source.source.sha256);
		expect(source.generationEligibility.originalSourceHashes).toEqual(
			registered.sourceHashes,
		);
		expect(source.imageBase64).toBe(registered.imageBase64);
		expect(
			f.bridge.requests.filter((r) => r.rpc.method === "tools/call"),
		).toHaveLength(0);
	} finally {
		await f.close();
	}
});

test("batch admits two eligible originals atomically, dispatches sequential exact bytes and replays locally", async () => {
	const f = await fixture();
	try {
		const done = f.settled();
		const response = await f.post("batches", f.payload);
		expect(response.status).toBe(202);
		const admitted = batchResponse.parse(await response.json());
		await done;
		const { batch } = batchResponse.parse(
			await (await f.get(`batches/${f.payload.batchId}`)).json(),
		);
		expect(batch.state).toBe("COMPLETED");
		expect(batch.items.map((i) => i.status)).toEqual(["HOLD", "HOLD"]);
		expect(batch.items.map((i: { requestId: string }) => i.requestId)).toEqual(
			admitted.batch.items.map((i: { requestId: string }) => i.requestId),
		);
		const calls = f.bridge.requests.filter(
			(r) => r.rpc.method === "tools/call",
		);
		expect(calls.every((r) => r.authorization === "Bearer owner-bearer")).toBe(
			true,
		);
		for (const call of calls) {
			const requestId = call.rpc.params?.arguments?.requestId;
			if (!requestId) throw Error("requestId");
			expect(call.rpc.params?.arguments).not.toHaveProperty("size");
			expect(
				JSON.parse(
					await readFile(
						join(
							f.storage,
							"42",
							"jobs",
							requestId,
							"candidate.png.request.json",
						),
						"utf8",
					),
				),
			).toMatchObject({ size: "340x510", providerSize: "1024x1536" });
			expect(
				await readFile(
					join(f.storage, "42", "jobs", requestId, "mcp-request.bin"),
				),
			).toEqual(Buffer.from(call.bytes));
			expect(
				await readFile(
					join(f.storage, "42", "jobs", requestId, "mcp-response.bin"),
				),
			).toEqual(Buffer.from(JSON.stringify(portraitReply(call.rpc, f.image))));
		}
		expect(calls.map((r) => r.rpc.params?.arguments?.requestId)).toEqual(
			batch.items.map((i: { requestId: string }) => i.requestId),
		);
		expect(
			new Set(
				batch.items.flatMap((i: { itemId: string; requestId: string }) => [
					i.itemId,
					i.requestId,
				]),
			).size,
		).toBe(4);
		for (const item of batch.items) {
			expect(
				Buffer.from(
					await (await f.get(`jobs/${item.requestId}/image`)).arrayBuffer(),
				),
			).toEqual(Buffer.from(resizePortraitPng(f.image)));
			const binding = JSON.parse(
				await readFile(
					join(
						f.storage,
						"42",
						"jobs",
						item.requestId,
						"connection-binding.json",
					),
					"utf8",
				),
			);
			expect(binding.connectionId).toBe(f.payload.connectionId);
			expect(binding.ownerId).toBe("42");
		}
		const before = [f.bridge.requests.length, f.wikiCalls.length];
		expect((await f.post("batches", f.payload)).status).toBe(200);
		expect(
			(
				await f.post("batches", {
					...f.payload,
					items: [...f.payload.items].reverse(),
				})
			).status,
		).toBe(409);
		expect([f.bridge.requests.length, f.wikiCalls.length]).toEqual(before);
	} finally {
		await f.close();
	}
});

test("invalid second selection rejects all membership before image calls", async () => {
	const f = await fixture();
	try {
		f.stale();
		const response = await f.post("batches", f.payload);
		expect(response.status).toBe(409);
		expect(
			f.bridge.requests.filter((r) => r.rpc.method === "tools/call"),
		).toHaveLength(0);
		expect((await f.get(`batches/${f.payload.batchId}`)).status).toBe(404);
		await expect(readdir(join(f.storage, "42", "jobs"))).rejects.toThrow();
	} finally {
		await f.close();
	}
});

test("completed cancel is an exact durable no-op", async () => {
	const f = await fixture();
	try {
		const done = f.settled();
		expect((await f.post("batches", f.payload)).status).toBe(202);
		await done;
		const path = join(
			f.storage,
			"42",
			"batches",
			f.payload.batchId,
			"batch.json",
		);
		const before = await readFile(path);
		const view = await (await f.get(`batches/${f.payload.batchId}`)).json();
		const calls = [f.wikiCalls.length, f.bridge.requests.length];
		for (let attempt = 0; attempt < 2; attempt++) {
			const response = await f.post(
				`batches/${f.payload.batchId}/cancel-pending`,
				{},
			);
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual(view);
			expect(await readFile(path)).toEqual(before);
		}
		expect([f.wikiCalls.length, f.bridge.requests.length]).toEqual(calls);
	} finally {
		await f.close();
	}
});

test("repeated cancel has no additional durable mutation before or after consumed work settles", async () => {
	const f = await fixture();
	try {
		f.mode("blocked");
		const consumed = once(f.bridge.server, "consumed", {
			signal: AbortSignal.timeout(5000),
		});
		const done = f.settled();
		expect((await f.post("batches", f.payload)).status).toBe(202);
		await consumed;
		const path = join(
			f.storage,
			"42",
			"batches",
			f.payload.batchId,
			"batch.json",
		);
		const response = await f.post(
			`batches/${f.payload.batchId}/cancel-pending`,
			{},
		);
		expect(response.status).toBe(200);
		const requested = await response.json();
		const requestedBytes = await readFile(path);
		expect(
			await (
				await f.post(`batches/${f.payload.batchId}/cancel-pending`, {})
			).json(),
		).toEqual(requested);
		expect(await readFile(path)).toEqual(requestedBytes);
		f.release();
		await done;
		const terminal = await (await f.get(`batches/${f.payload.batchId}`)).json();
		const terminalBytes = await readFile(path);
		expect(
			batchResponse.parse(terminal).batch.items.map((i) => i.status),
		).toEqual(["HOLD", "CANCELLED"]);
		expect(
			await (
				await f.post(`batches/${f.payload.batchId}/cancel-pending`, {})
			).json(),
		).toEqual(terminal);
		expect(await readFile(path)).toEqual(terminalBytes);
		expect(
			f.bridge.requests.filter((r) => r.rpc.method === "tools/call"),
		).toHaveLength(1);
	} finally {
		await f.close();
	}
});

test("second snapshot tamper before dispatch pauses blocked membership without retry", async () => {
	const f = await fixture();
	try {
		f.mode("blocked");
		const consumed = once(f.bridge.server, "consumed", {
			signal: AbortSignal.timeout(5000),
		});
		const done = f.settled();
		const response = await f.post("batches", f.payload);
		expect(response.status).toBe(202);
		const admitted = batchResponse.parse(await response.json()).batch;
		await consumed;
		const second = admitted.items[1];
		if (!second) throw Error("second");
		const snapshot = join(
			f.storage,
			"42",
			"batches",
			f.payload.batchId,
			"items",
			second.itemId,
			"snapshot.json",
		);
		const accepted = await readFile(snapshot);
		await writeFile(snapshot, "tampered");
		f.release();
		await done;
		const record = JSON.parse(
			await readFile(
				join(f.storage, "42", "batches", f.payload.batchId, "batch.json"),
				"utf8",
			),
		);
		expect(record.state).toBe("PAUSED_BLOCKED");
		expect(record.pauseReason).toBe("SOURCE_SNAPSHOT_MISMATCH");
		expect(record.items.map((i: { status: string }) => i.status)).toEqual([
			"HOLD",
			"PENDING",
		]);
		expect(record.items[1]).toMatchObject({
			jobId: null,
			startedAt: null,
			finishedAt: null,
		});
		expect(
			Buffer.from(
				await (
					await f.get(`jobs/${admitted.items[0]?.requestId}/image`)
				).arrayBuffer(),
			),
		).toEqual(Buffer.from(resizePortraitPng(f.image)));
		const before = [f.wikiCalls.length, f.bridge.requests.length];
		await writeFile(snapshot, accepted);
		expect((await f.post("batches", f.payload)).status).toBe(200);
		expect(
			(await f.post(`batches/${f.payload.batchId}/resume`, {})).status,
		).toBe(404);
		expect([f.wikiCalls.length, f.bridge.requests.length]).toEqual(before);
		expect(
			f.bridge.requests.filter((r) => r.rpc.method === "tools/call"),
		).toHaveLength(1);
		await f.restart();
		const restarted = batchResponse.parse(
			await (await f.get(`batches/${f.payload.batchId}`)).json(),
		).batch;
		expect(restarted.state).toBe("PAUSED_RESTART");
		expect(restarted.items.map((i) => i.status)).toEqual(["HOLD", "CANCELLED"]);
		expect([f.wikiCalls.length, f.bridge.requests.length]).toEqual(before);
		await f.connect();
		const connected = [f.wikiCalls.length, f.bridge.requests.length];
		expect((await f.post("batches", f.payload)).status).toBe(200);
		expect([f.wikiCalls.length, f.bridge.requests.length]).toEqual(connected);
	} finally {
		await f.close();
	}
});

test("second signed owner session cannot replace a READY connection and may connect after disconnect", async () => {
	const f = await fixture();
	try {
		const other = f.headersFor();
		const before = [f.wikiCalls.length, f.bridge.requests.length];
		const response = await f.post(
			"connections",
			{ endpointId: "owned-fixture", bridgeBearer: "second-session" },
			other,
		);
		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({
			error: { code: "CONNECTION_NOT_READY" },
		});
		expect([f.wikiCalls.length, f.bridge.requests.length]).toEqual(before);
		expect(await (await f.get("connections", other)).json()).toMatchObject({
			connection: null,
		});
		expect(await (await f.get("connections")).json()).toMatchObject({
			connection: { connectionId: f.payload.connectionId, state: "READY" },
		});
		expect((await f.disconnect()).status).toBe(200);
		const replacement = await f.connect(other);
		expect(replacement).not.toBe(f.payload.connectionId);
		expect(await (await f.get("connections")).json()).toMatchObject({
			connection: { connectionId: f.payload.connectionId, state: "REVOKED" },
		});
	} finally {
		await f.close();
	}
});

test("batch authority and shape denials make zero Wiki and MCP calls", async () => {
	const f = await fixture();
	try {
		const before = [f.wikiCalls.length, f.bridge.requests.length];
		for (const [headers, payload, status] of [
			[{ ...f.owner, cookie: "" }, f.payload, 401],
			[f.headersFor("42", Date.now() - 28800001), f.payload, 401],
			[{ ...f.owner, origin: "https://foreign.example" }, f.payload, 403],
			[f.headersFor("43"), f.payload, 404],
			[f.headersFor(), f.payload, 404],
			[f.owner, { ...f.payload, connectionId: undefined }, 409],
			[f.owner, { ...f.payload, items: [] }, 422],
			[
				f.owner,
				{ ...f.payload, items: [f.payload.items[0], f.payload.items[0]] },
				422,
			],
			[f.owner, { ...f.payload, ownerId: "42" }, 422],
		] as const)
			expect((await f.post("batches", payload, headers)).status).toBe(status);
		expect([f.wikiCalls.length, f.bridge.requests.length]).toEqual(before);
	} finally {
		await f.close();
	}
});

test("cancel-pending serializes against consumed work, preserves result and owner lease", async () => {
	const f = await fixture();
	try {
		f.mode("blocked");
		const consumed = once(f.bridge.server, "consumed", {
			signal: AbortSignal.timeout(5000),
		});
		const done = f.settled();
		expect((await f.post("batches", f.payload)).status).toBe(202);
		await consumed;
		const before = [f.wikiCalls.length, f.bridge.requests.length];
		expect(
			(await f.post("batches", { ...f.payload, batchId: randomUUID() })).status,
		).toBe(409);
		expect(
			(
				await f.post("connections", {
					endpointId: "owned-fixture",
					bridgeBearer: "new",
				})
			).status,
		).toBe(409);
		expect(
			(
				await f.post("generations", {
					requestId: randomUUID(),
					connectionId: f.payload.connectionId,
					personId: "person-1003",
					providerModel: f.payload.providerModel,
					faceMode: f.payload.faceMode,
				})
			).status,
		).toBe(409);
		expect((await f.post("batches", f.payload)).status).toBe(200);
		expect(
			(
				await f.post(`batches/${f.payload.batchId}/cancel-pending`, {
					extra: true,
				})
			).status,
		).toBe(422);
		const response = await f.post(
			`batches/${f.payload.batchId}/cancel-pending`,
			{},
		);
		const cancelled = batchResponse.parse(await response.json()).batch;
		expect(cancelled.state).toBe("CANCEL_REQUESTED");
		expect(cancelled.items.map((i) => i.status)).toEqual([
			"RUNNING",
			"CANCELLED",
		]);
		expect([f.wikiCalls.length, f.bridge.requests.length]).toEqual(before);
		f.release();
		await done;
		const batch = batchResponse.parse(
			await (await f.get(`batches/${f.payload.batchId}`)).json(),
		).batch;
		expect(batch.state).toBe("CANCELLED");
		expect(batch.items.map((i) => i.status)).toEqual(["HOLD", "CANCELLED"]);
		expect(
			f.bridge.requests.filter((r) => r.rpc.method === "tools/call"),
		).toHaveLength(1);
	} finally {
		await f.close();
	}
});

test("definite failed items continue once; UNKNOWN pauses and blocks new UUID and session", async () => {
	for (const mode of ["failed", "unknown"] as const) {
		const f = await fixture();
		try {
			f.mode(mode);
			const done = f.settled();
			expect((await f.post("batches", f.payload)).status).toBe(202);
			await done;
			const batch = batchResponse.parse(
				await (await f.get(`batches/${f.payload.batchId}`)).json(),
			).batch;
			expect(batch.state).toBe(
				mode === "failed" ? "COMPLETED" : "PAUSED_UNKNOWN",
			);
			expect(batch.items.map((i) => i.status)).toEqual(
				mode === "failed" ? ["FAILED", "FAILED"] : ["UNKNOWN", "PENDING"],
			);
			expect(
				f.bridge.requests.filter((r) => r.rpc.method === "tools/call"),
			).toHaveLength(mode === "failed" ? 2 : 1);
			if (mode === "unknown") {
				const before = [f.wikiCalls.length, f.bridge.requests.length];
				expect(
					(await f.post("batches", { ...f.payload, batchId: randomUUID() }))
						.status,
				).toBe(409);
				expect(
					(
						await f.post(
							"connections",
							{ endpointId: "owned-fixture", bridgeBearer: "new" },
							f.headersFor(),
						)
					).status,
				).toBe(409);
				expect(
					(await f.post(`batches/${f.payload.batchId}/cancel-pending`, {}))
						.status,
				).toBe(200);
				expect([f.wikiCalls.length, f.bridge.requests.length]).toEqual(before);
			}
		} finally {
			await f.close();
		}
	}
});

test("logout and disconnect after consumed dispatch preserve UNKNOWN and cancel only unstarted work", async () => {
	for (const action of ["logout", "disconnect"] as const) {
		const f = await fixture();
		try {
			f.mode("blocked");
			const consumed = once(f.bridge.server, "consumed", {
				signal: AbortSignal.timeout(5000),
			});
			expect((await f.post("batches", f.payload)).status).toBe(202);
			await consumed;
			const settled = new Promise<void>((resolve, reject) => {
				const listener = (batch: { state: string }) => {
					if (batch.state === "PAUSED_UNKNOWN") {
						f.app().server.off("batch", listener);
						resolve();
					}
				};
				f.app().server.on("batch", listener);
				AbortSignal.timeout(5000).addEventListener(
					"abort",
					() => reject(Error("unknown timeout")),
					{ once: true },
				);
			});
			expect(
				(
					await (action === "logout"
						? f.post("auth/logout", {})
						: f.disconnect())
				).status,
			).toBe(200);
			f.release();
			await settled;
			const currentHeaders = action === "logout" ? f.headersFor() : f.owner;
			const batch = batchResponse.parse(
				await (
					await f.get(`batches/${f.payload.batchId}`, currentHeaders)
				).json(),
			).batch;
			expect(batch.state).toBe("PAUSED_UNKNOWN");
			expect(batch.items.map((i) => i.status)).toEqual([
				"UNKNOWN",
				"CANCELLED",
			]);
			expect(
				f.bridge.requests.filter((r) => r.rpc.method === "tools/call"),
			).toHaveLength(1);
		} finally {
			await f.close();
		}
	}
});

test("session expiry between items preserves first exact candidate and blocks every remaining dispatch", async () => {
	const f = await fixture();
	try {
		f.mode("blocked");
		const consumed = once(f.bridge.server, "consumed", {
			signal: AbortSignal.timeout(5000),
		});
		const done = f.settled();
		expect((await f.post("batches", f.payload)).status).toBe(202);
		await consumed;
		setSystemTime(Date.now() + 28800001);
		f.release();
		await done;
		setSystemTime();
		const batch = batchResponse.parse(
			await (
				await f.get(`batches/${f.payload.batchId}`, f.headersFor())
			).json(),
		).batch;
		expect(batch.state).toBe("PAUSED_BLOCKED");
		expect(batch.items.map((i) => i.status)).toEqual(["HOLD", "CANCELLED"]);
		expect(
			f.bridge.requests.filter((r) => r.rpc.method === "tools/call"),
		).toHaveLength(1);
	} finally {
		setSystemTime();
		await f.close();
	}
});

test("stale original hashes atomically reject, batch GET stays private, and failed reservation does not leak", async () => {
	const f = await fixture();
	try {
		const second = f.payload.items[1];
		if (!second) throw Error("second");
		const stale = {
			...f.payload,
			items: [
				f.payload.items[0],
				{
					...second,
					originalSourceHashes: {
						...second.originalSourceHashes,
						token: "0".repeat(64),
					},
				},
			],
		};
		expect((await f.post("batches", stale)).status).toBe(409);
		expect(
			f.bridge.requests.filter((r) => r.rpc.method === "tools/call"),
		).toHaveLength(0);
		const cap = f.config.maxStorageBytes;
		f.config.maxStorageBytes = 50 * 1024 * 1024;
		expect((await f.post("batches", f.payload)).status).toBe(413);
		// Two retained outputs need 50 MiB, not the old 128 MiB multiplier;
		// exact source/request/snapshot bytes also must fit before admission.
		f.config.maxStorageBytes = 60 * 1024 * 1024;
		const done = f.settled();
		expect((await f.post("batches", f.payload)).status).toBe(202);
		await done;
		const before = [f.wikiCalls.length, f.bridge.requests.length];
		expect(
			(await f.get(`batches/${f.payload.batchId}`, f.headersFor("43"))).status,
		).toBe(404);
		expect(
			(await f.get(`batches/${f.payload.batchId}`, { ...f.owner, cookie: "" }))
				.status,
		).toBe(401);
		expect((await f.get(`batches/${f.payload.batchId}`)).status).toBe(200);
		expect([f.wikiCalls.length, f.bridge.requests.length]).toEqual(before);
		f.config.maxStorageBytes = cap;
	} finally {
		await f.close();
	}
});

test("real durable batch restart stops pending and never resumes on replacement connection; resolver hashes exact artifacts", async () => {
	const f = await fixture();
	try {
		const done = f.settled();
		expect((await f.post("batches", f.payload)).status).toBe(202);
		await done;
		const recordPath = join(
			f.storage,
			"42",
			"batches",
			f.payload.batchId,
			"batch.json",
		);
		const record = JSON.parse(await readFile(recordPath, "utf8"));
		const first = record.items[0];
		const ownerRoot = await realpath(join(f.storage, "42"));
		expect(
			await resolveBatchBinding({ ownerRoot, ownerId: "42" }, first.requestId),
		).toEqual({
			batchId: f.payload.batchId,
			itemId: first.itemId,
			snapshotSHA: first.snapshotSHA,
		});
		record.state = "RUNNING";
		record.items[1].status = "PENDING";
		record.items[1].jobId = null;
		await writeFile(recordPath, `${JSON.stringify(record)}\n`);
		const before = f.bridge.requests.length;
		await f.restart();
		const batch = batchResponse.parse(
			await (await f.get(`batches/${f.payload.batchId}`)).json(),
		).batch;
		expect(batch.state).toBe("PAUSED_RESTART");
		expect(batch.items.map((i) => i.status)).toEqual(["HOLD", "CANCELLED"]);
		expect(f.bridge.requests.length).toBe(before);
		await f.connect();
		const afterConnect = f.bridge.requests.length;
		expect((await f.post("batches", f.payload)).status).toBe(200);
		expect(
			(await f.post(`batches/${f.payload.batchId}/resume`, {})).status,
		).toBe(404);
		expect(f.bridge.requests.length).toBe(afterConnect);
		const snapshotPath = join(
			f.storage,
			"42",
			"batches",
			f.payload.batchId,
			"items",
			first.itemId,
			"snapshot.json",
		);
		const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
		await writeFile(
			join(
				f.storage,
				"42",
				"batches",
				f.payload.batchId,
				"artifacts",
				`${snapshot.files.wiki}.bin`,
			),
			"tampered",
		);
		await expect(
			resolveBatchBinding({ ownerRoot, ownerId: "42" }, first.requestId),
		).rejects.toThrow("SOURCE_SNAPSHOT_MISMATCH");
	} finally {
		await f.close();
	}
});

test("actual restarted Bun process reads durable interrupted batch, makes no outbound calls and holds owner across new connections", async () => {
	const f = await fixture();
	let closed = false;
	try {
		f.mode("unknown");
		const done = f.settled();
		expect((await f.post("batches", f.payload)).status).toBe(202);
		await done;
		await f.app().close();
		closed = true;
		const serverSource = fileURLToPath(
			new URL("../src/server.ts", import.meta.url),
		);
		const configSource = fileURLToPath(
			new URL("../src/config.ts", import.meta.url),
		);
		const authSource = fileURLToPath(
			new URL("../src/auth.ts", import.meta.url),
		);
		const code = `
			import { once } from 'node:events';
			import { createPortal } from ${JSON.stringify(serverSource)};
			import { loadConfig } from ${JSON.stringify(configSource)};
			import { createAuth } from ${JSON.stringify(authSource)};
			const config = loadConfig(JSON.parse(process.env.BATCH_CONFIG));
			const app = await createPortal(config, {testEndpoints:[JSON.parse(process.env.BATCH_ENDPOINT)]});
			const listening = once(app.server,'listening',{signal:AbortSignal.timeout(5000)}); app.server.listen(0,'127.0.0.1'); await listening;
			const token=createAuth(config).issue({id:'42',login:'restarted'}); const session=createAuth(config).verify(token);
			const headers={cookie:'portal_session='+token,origin:'https://portal.example','x-csrf-token':session.csrfToken,'content-type':'application/json'};
			const origin='http://127.0.0.1:'+app.server.address().port+'/tools/api/';
			const batch=await (await fetch(origin+'batches/'+process.env.BATCH_ID,{headers})).json();
			const connect=await fetch(origin+'connections',{method:'POST',headers,body:JSON.stringify({endpointId:'owned-fixture',bridgeBearer:'new'})});
			console.log(JSON.stringify({batch:batch.batch,connectStatus:connect.status,connect:await connect.json()}));
			await app.close();
		`;
		const before = [f.bridge.requests.length, f.wikiCalls.length];
		const child = spawn(process.execPath, ["--eval", code], {
			env: {
				...process.env,
				NODE_ENV: "test",
				BATCH_ID: f.payload.batchId,
				BATCH_ENDPOINT: JSON.stringify(f.bridge.registration),
				BATCH_CONFIG: JSON.stringify({
					PORTAL_PUBLIC_URL: "https://portal.example/tools",
					PORTAL_SESSION_SECRET: f.config.secret,
					PORTAL_STORAGE_PATH: f.storage,
					WIKI_BASE_URL: f.config.wikiBaseUrl,
				}),
			},
			stdio: ["ignore", "pipe", "pipe"],
		});
		let stdout = "",
			stderr = "";
		child.stdout.on("data", (chunk) => {
			stdout += String(chunk);
		});
		child.stderr.on("data", (chunk) => {
			stderr += String(chunk);
		});
		const exited = once(child, "exit", { signal: AbortSignal.timeout(5000) });
		const [exitCode] = await exited;
		if (exitCode !== 0) throw Error(stderr);
		const result = z
			.object({
				batch: batchResponse.shape.batch,
				connectStatus: z.number(),
				connect: z.object({ error: z.object({ code: z.string() }) }),
			})
			.parse(JSON.parse(stdout));
		expect(result.batch.state).toBe("PAUSED_UNKNOWN");
		expect(result.batch.items.map((i) => i.status)).toEqual([
			"UNKNOWN",
			"CANCELLED",
		]);
		expect(result.connectStatus).toBe(409);
		expect(result.connect.error.code).toBe("OWNER_DISPATCH_UNCERTAIN");
		expect([f.bridge.requests.length, f.wikiCalls.length]).toEqual(before);
	} finally {
		if (closed) await f.restart(true);
		await f.close();
	}
});
