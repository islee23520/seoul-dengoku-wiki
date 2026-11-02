import { expect, test } from "bun:test";
import { createHash, randomUUID } from "node:crypto";
import { once } from "node:events";
import {
	mkdtemp,
	readdir,
	readFile,
	realpath,
	rm,
	stat,
	symlink,
	writeFile,
} from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encodePng } from "../../portrait/acceptance/src/png.ts";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import {
	importOriginals,
	openOriginalsStore,
} from "../../people-cli/src/store.ts";
import { createAuth } from "../src/auth.ts";
import { batchSchema, snapshotSchema } from "../src/batches.ts";
import { loadConfig } from "../src/config.ts";
import type {
	createEvaluationStore,
	ResultBinding,
} from "../src/evaluations.ts";
import { createPortal } from "../src/server.ts";
import { connectOwned, mcpFixture, portraitReply } from "./mcp-fixture.ts";

const sha = (bytes: string | Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
function review(result: ResultBinding, expectedRevision = 0) {
	return {
		evaluationId: randomUUID(),
		expectedRevision,
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
		notes: "Owner review",
	};
}
async function batchFixture() {
	const root = await realpath(
		await mkdtemp(join(tmpdir(), "portal-evaluation-batch-")),
	);

	const canonical = createTransportFixture();
	const image = encodePng({
		width: 1024,
		height: 1536,
		pixels: new Uint8Array(1024 * 1536 * 4),
	});
	const references = canonical.candidate.referenceImages.map((r) => ({
		...r,
		bytes: new Uint8Array(image),
		...(r.role === "recipient-appearance-only"
			? { sourceHash: sha(image) }
			: {}),
	}));
	const template = {
		candidate: { ...canonical.candidate, referenceImages: references },
		operatorPins: {
			...canonical.operatorPins,
			referenceImages: references.map((r) => ({
				id: r.id,
				sha256: sha(image),
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
			image: { sha256: sha(image) },
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
			detail: { url: "fixture:detail", bytes: detail, sha256: sha(detail) },
			token: { url: "fixture:token", bytes: token, sha256: sha(token) },
			image: { url: "fixture:image", bytes: image, sha256: sha(image) },
		},
	]);
	db.close();
	let wikiCalls = 0;
	const wiki = createServer((req, res) => {
		wikiCalls++;
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
	const wikiReady = once(wiki, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	wiki.listen(0, "127.0.0.1");
	await wikiReady;
	const wa = wiki.address();
	if (!wa || typeof wa === "string") throw Error("address");
	const bridge = await mcpFixture((rpc, _req, res) => {
		res.writeHead(200, { "content-type": "application/json" });
		res.end(JSON.stringify(portraitReply(rpc, image)));
	});
	const config = loadConfig({
		PORTAL_PUBLIC_URL: "https://portal.example/tools",
		PORTAL_SESSION_SECRET: "s".repeat(48),
		PORTAL_STORAGE_PATH: join(root, "private"),
		PORTAL_ORIGINALS_DB: dbPath,
		WIKI_BASE_URL: `http://127.0.0.1:${wa.port}/wiki/`,
	});
	const app = await createPortal(config, {
		template,
		testEndpoints: [bridge.registration],
	});
	const close = async () => {
		await app.close();
		await bridge.close();
		await new Promise<void>((resolve) => {
			wiki.close(() => resolve());
			wiki.closeAllConnections();
		});
		await rm(root, { recursive: true, force: true });
	};
	try {
		const ready = once(app.server, "listening", {
			signal: AbortSignal.timeout(5000),
		});
		app.server.listen(0, "127.0.0.1");
		await ready;
		const address = app.server.address();
		if (!address || typeof address === "string") throw Error("address");
		const origin = `http://127.0.0.1:${address.port}`;
		const auth = createAuth(config),
			sessionToken = auth.issue({ id: "42", login: "fixture" });
		const headers = {
			cookie: `portal_session=${sessionToken}`,
			origin: "https://portal.example",
			"x-csrf-token": auth.verify(sessionToken)?.csrfToken ?? "",
			"content-type": "application/json",
		};
		const connectionId = await connectOwned(origin, headers, "owner-bearer");
		const batchId = randomUUID();
		const settled = new Promise<void>((resolve, reject) => {
			const signal = AbortSignal.timeout(5000);
			const listener = (batch: { batchId: string; state: string }) => {
				if (batch.batchId === batchId && batch.state === "COMPLETED") {
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
		const response = await fetch(`${origin}/tools/api/batches`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				batchId,
				connectionId,
				providerModel: "gpt-image-2.5-sunburst",
				faceMode: { kind: "unique", variantId: null },
				items: [
					{
						personId: person.id,
						characterId: person.characterId,
						name: person.name,
						wikiDetailSHA: sha(detail),
						originalSourceHashes: {
							detail: sha(detail),
							token: sha(token),
							image: sha(image),
						},
					},
				],
			}),
		});
		expect(response.status).toBe(202);
		await settled;
		const ownerRoot = join(root, "private", "42"),
			batchDir = join(ownerRoot, "batches", batchId);
		const batchPath = join(batchDir, "batch.json");
		const batch = batchSchema.parse(
			JSON.parse(await readFile(batchPath, "utf8")),
		);
		expect(batch.state).toBe("COMPLETED");
		const item = batch.items[0];
		if (!item) throw Error("item");
		expect(item.status).toBe("HOLD");
		const snapshotPath = join(batchDir, "items", item.itemId, "snapshot.json");
		const snapshotBytes = await readFile(snapshotPath),
			snapshot = snapshotSchema.parse(JSON.parse(snapshotBytes.toString()));
		return {
			root,
			ownerRoot,
			requestId: item.requestId as string,
			itemId: item.itemId as string,
			directory: join(ownerRoot, "jobs", item.requestId),
			batchId,
			batchDir,
			batchPath,
			batch,
			snapshotPath,
			snapshotBytes,
			snapshot,
			app,
			auth,
			origin,
			headers,
			image,
			bridge,
			get wikiCalls() {
				return wikiCalls;
			},
			close,
		};
	} catch (error) {
		await close();
		throw error;
	}
}

function requests(f: Awaited<ReturnType<typeof batchFixture>>) {
	const get = (suffix: string, headers: Record<string, string> = f.headers) =>
		fetch(`${f.origin}/tools/api/jobs/${f.requestId}${suffix}`, { headers });
	const post = (value: unknown, headers: Record<string, string> = f.headers) =>
		fetch(`${f.origin}/tools/api/jobs/${f.requestId}/evaluations`, {
			method: "POST",
			headers,
			body: JSON.stringify(value),
		});
	return { get, post };
}
async function error(response: Response, status: number, code: string) {
	expect(response.status).toBe(status);
	expect(response.headers.get("cache-control")).toBe("no-store");
	expect(await response.json()).toEqual({ error: { code } });
}

test("captured source HTTP requires sealed owner output and revalidates retained evidence without outbound calls", async () => {
	const f = await batchFixture();
	const { get } = requests(f);
	const receipts: unknown[] = [];
	const record = async (response: Response) => {
		const body = await response.json();
		receipts.push({
			status: response.status,
			headers: Object.fromEntries(response.headers),
			body,
		});
		return body;
	};
	try {
		const outbound = [f.wikiCalls, f.bridge.requests.length];
		const unsealed = await get("/captured-source");
		expect(unsealed.status).toBe(409);
		expect(await record(unsealed)).toEqual({
			error: { code: "RESULT_NOT_AVAILABLE" },
		});
		expect(await readdir(f.directory)).not.toContain("result.json");
		const { result } = (await (await get("/result")).json()) as {
			result: ResultBinding;
		};
		const response = await get("/captured-source");
		expect(response.status).toBe(200);
		expect(response.headers.get("cache-control")).toBe("no-store");
		const body = (await record(response)) as {
			source: Awaited<
				ReturnType<
					ReturnType<typeof createEvaluationStore>["readCapturedSource"]
				>
			>;
		};
		expect(body).toEqual({
			source: {
				schema: "portal-captured-source.v1",
				ownerId: "42",
				jobId: f.requestId,
				batchId: f.batchId,
				itemId: f.itemId,
				snapshotSHA: result.snapshotSHA,
				imageSHA: sha(f.image),
				imageBase64: Buffer.from(f.image).toString("base64"),
				identity: {
					personId: "person-1003",
					characterId: "K1003",
					name: "Fixture 1003",
				},
			},
		});
		if (body.source.imageBase64 === null || body.source.imageSHA === null)
			throw Error("original photo missing");
		expect(sha(Buffer.from(body.source.imageBase64, "base64"))).toBe(
			body.source.imageSHA,
		);
		for (const [headers, status, code] of [
			[{}, 401, "AUTHENTICATION_REQUIRED"],
			[
				{
					cookie: `portal_session=${f.auth.issue({ id: "43", login: "foreign" })}`,
				},
				404,
				"NOT_FOUND",
			],
		] as const) {
			const denied = await get("/captured-source", headers);
			expect(denied.status).toBe(status);
			expect(await record(denied)).toEqual({ error: { code } });
		}
		await error(
			await fetch(
				`${f.origin}/tools/api/jobs/${randomUUID()}/captured-source`,
				{ headers: f.headers },
			),
			404,
			"NOT_FOUND",
		);
		for (const name of [
			"source-bytes.json",
			"provenance.json",
			"batch-binding.json",
			"job.json",
		]) {
			const path = join(f.directory, name),
				original = await readFile(path);
			await writeFile(
				path,
				name === "job.json"
					? JSON.stringify({
							...JSON.parse(original.toString()),
							state: "FAILED",
						})
					: "tamper",
			);
			const denied = await get("/captured-source");
			expect(denied.status).toBe(409);
			expect(await record(denied)).toEqual({
				error: {
					code:
						name === "job.json"
							? "RESULT_NOT_AVAILABLE"
							: "SOURCE_SNAPSHOT_MISMATCH",
				},
			});
			await writeFile(path, original);
		}
		const sourcePath = join(f.directory, "source-bytes.json"),
			original = await readFile(sourcePath);
		await rm(sourcePath);
		await symlink(join(f.directory, "provenance.json"), sourcePath);
		const denied = await get("/captured-source");
		expect(denied.status).toBe(400);
		expect(await record(denied)).toEqual({ error: { code: "INVALID_PATH" } });
		await rm(sourcePath);
		await writeFile(sourcePath, original);
		expect([f.wikiCalls, f.bridge.requests.length]).toEqual(outbound);
		console.log(
			`CAPTURED_SOURCE_HTTP=${JSON.stringify({ origin: f.origin, receipts, outboundDelta: { wiki: 0, provider: 0 } })}`,
		);
	} finally {
		await f.close();
		expect(await stat(f.root).catch(() => null)).toBeNull();
		console.log(
			`CAPTURED_SOURCE_HTTP_CLEANUP=${JSON.stringify({ root: f.root, removed: true, serverListening: f.app.server.listening })}`,
		);
	}
});

test("evaluation HTTP authentication, strict review, CAS, replay and private real batch output", async () => {
	const f = await batchFixture();
	const { get, post } = requests(f);
	try {
		const outbound = [f.wikiCalls, f.bridge.requests.length];
		const originalJob = await readFile(join(f.directory, "job.json"));
		for (const suffix of ["/result", "/evaluations", "/image"]) {
			await error(await get(suffix, {}), 401, "AUTHENTICATION_REQUIRED");
			await error(
				await get(suffix, { cookie: "portal_session=forged" }),
				401,
				"AUTHENTICATION_REQUIRED",
			);
		}
		const revoked = f.auth.issue({ id: "42", login: "revoked" });
		f.auth.logout(revoked);
		await error(
			await get("/result", { cookie: `portal_session=${revoked}` }),
			401,
			"AUTHENTICATION_REQUIRED",
		);
		await error(await post({}, {}), 401, "AUTHENTICATION_REQUIRED");
		for (const headers of [
			{ ...f.headers, origin: "https://evil.example" },
			{ ...f.headers, "x-csrf-token": "wrong" },
			{ ...f.headers, origin: "https://portal.example/" },
		])
			await error(await post({}, headers), 403, "CSRF_INVALID");
		const foreignToken = f.auth.issue({ id: "43", login: "foreign" });
		const foreign = {
			...f.headers,
			cookie: `portal_session=${foreignToken}`,
			"x-csrf-token": f.auth.verify(foreignToken)?.csrfToken ?? "",
		};
		for (const suffix of ["/result", "/evaluations", "/image"])
			await error(await get(suffix, foreign), 404, "NOT_FOUND");
		await error(await post({}, foreign), 422, "INVALID_INPUT");
		const missing = await fetch(
			`${f.origin}/tools/api/jobs/${randomUUID()}/result`,
			{ headers: f.headers },
		);
		await error(missing, 404, "NOT_FOUND");
		await error(await get("/evaluations"), 409, "RESULT_NOT_AVAILABLE");
		const response = await get("/result");
		expect(response.status).toBe(200);
		expect(response.headers.get("cache-control")).toBe("no-store");
		const { result } = (await response.json()) as { result: ResultBinding };
		expect(result).toMatchObject({
			ownerId: "42",
			jobId: f.requestId,
			batchId: f.batchId,
			itemId: f.itemId,
			snapshotSHA: sha(f.snapshotBytes),
			reviewStatus: "HOLD",
			approval: "NONE",
		});
		expect(result.pngSHA).toBe(
			sha(await readFile(join(f.directory, "candidate.png"))),
		);
		expect(result.receiptSHA).toBe(
			sha(await readFile(join(f.directory, "candidate.png.receipt.json"))),
		);
		expect(result.machineEvidence.metricsSHA).toBe(
			sha(await readFile(join(f.directory, "machine-diagnostics.json"))),
		);
		expect(result.machineEvidence.metrics).toMatchObject({
			mechanicalStatus: "NOT_RUN",
			reviewStatus: "HOLD",
		});
		const sealed = await readFile(join(f.directory, "result.json"));
		expect(await (await get("/result")).json()).toEqual({ result });
		expect(await readFile(join(f.directory, "result.json"))).toEqual(sealed);
		expect(await (await get("/evaluations")).json()).toEqual({
			resultBinding: result,
			machineEvidence: result.machineEvidence,
			latest: null,
			history: [],
		});
		const input = review(result);
		await error(await post(input, foreign), 404, "NOT_FOUND");
		await error(
			await fetch(`${f.origin}/tools/api/jobs/${randomUUID()}/evaluations`, {
				method: "POST",
				headers: f.headers,
				body: JSON.stringify(input),
			}),
			404,
			"NOT_FOUND",
		);
		for (const addition of [
			{ reviewerId: "43" },
			{ ownerId: "43" },
			{ ownerRoot: f.ownerRoot },
			{ reviewedAt: "2000-01-01T00:00:00.000Z" },
			{ revision: 99 },
			{ approval: "PASS" },
			{ batchId: f.batchId },
			{ metrics: {} },
		])
			await error(await post({ ...input, ...addition }), 422, "INVALID_INPUT");
		await error(
			await post({ ...input, notes: "x".repeat(8001) }),
			422,
			"INVALID_INPUT",
		);
		await error(
			await post({
				...input,
				categories: {
					...input.categories,
					"identity-and-face": { judgement: "hold", notes: "x".repeat(2001) },
				},
			}),
			422,
			"INVALID_INPUT",
		);
		await error(
			await post({ ...input, verdict: "pass" }),
			422,
			"INVALID_INPUT",
		);
		await error(
			await post({ ...input, pngSHA: "0".repeat(64) }),
			409,
			"RESULT_HASH_MISMATCH",
		);
		for (const field of ["receiptSHA", "machineMetricsSHA"])
			await error(
				await post({ ...input, [field]: "0".repeat(64) }),
				409,
				"RESULT_EVIDENCE_MISMATCH",
			);
		input.verdict = "pass";
		for (const category of Object.values(input.categories))
			category.judgement = "pass";
		const before = Date.now();
		const created = await post(input);
		expect(created.status).toBe(201);
		const first = (await created.json()) as {
			evaluation: { revision: number; reviewedAt: string };
		};
		expect(first.evaluation).toMatchObject({
			reviewerId: "42",
			revision: 1,
			previousRevision: 0,
			batchId: f.batchId,
			itemId: f.itemId,
			approval: "NONE",
		});
		expect(Date.parse(first.evaluation.reviewedAt)).toBeGreaterThanOrEqual(
			before,
		);
		expect(Date.parse(first.evaluation.reviewedAt)).toBeLessThanOrEqual(
			Date.now(),
		);
		const replay = await post(input);
		expect(replay.status).toBe(200);
		expect(await replay.json()).toEqual(first);
		await error(
			await post({ ...input, notes: "changed" }),
			409,
			"REQUEST_CONFLICT",
		);
		await error(
			await post(review(result)),
			409,
			"EVALUATION_REVISION_CONFLICT",
		);
		const contenders = await Promise.all([
			post(review(result, 1)),
			post(review(result, 1)),
		]);
		expect(contenders.map((r) => r.status).sort()).toEqual([201, 409]);
		const winner = contenders.find((r) => r.status === 201);
		if (!winner) throw Error("winner");
		const second = (await winner.json()) as {
			evaluation: { revision: number; reviewedAt: string };
		};
		expect(second.evaluation).toMatchObject({
			reviewerId: "42",
			revision: 2,
			previousRevision: 1,
		});
		expect(Date.parse(second.evaluation.reviewedAt)).toBeGreaterThanOrEqual(
			Date.parse(first.evaluation.reviewedAt),
		);
		const history = await (await get("/evaluations")).json();
		expect(history).toEqual({
			resultBinding: result,
			machineEvidence: result.machineEvidence,
			latest: second.evaluation,
			history: [first.evaluation, second.evaluation],
		});
		const image = await get("/image");
		expect(image.status).toBe(200);
		expect(image.headers.get("cache-control")).toBe("no-store");
		expect(sha(new Uint8Array(await image.arrayBuffer()))).toBe(result.pngSHA);
		expect(await readFile(join(f.directory, "job.json"))).toEqual(originalJob);
		expect(await (await get("")).json()).toEqual({
			job: JSON.parse(originalJob.toString()),
		});
		for (const suffix of [
			"/result/image",
			"/evaluations/image",
			"/receipt",
			"/raw-response",
			"/result/",
			"/evaluations/",
		])
			await error(await get(suffix), 404, "NOT_FOUND");
		expect((await stat(join(f.directory, "evaluations"))).mode & 0o777).toBe(
			0o700,
		);
		for (const name of await readdir(join(f.directory, "evaluations")))
			expect(
				(await stat(join(f.directory, "evaluations", name))).mode & 0o777,
			).toBe(0o600);
		const batch = await fetch(`${f.origin}/tools/api/batches/${f.batchId}`, {
			headers: f.headers,
		});
		expect(batch.status).toBe(200);
		expect(await batch.json()).toMatchObject({
			batch: { items: [{ requestId: f.requestId, status: "HOLD" }] },
		});
		expect([f.wikiCalls, f.bridge.requests.length]).toEqual(outbound);
		console.log(
			"EVALUATION_ROUTE_FIXTURE=" +
				JSON.stringify({
					resultGET: { result },
					evaluationPOSTRequest: input,
					evaluationPOSTResponse: first,
					evaluationsGET: history,
					outboundEvaluationDelta: { wiki: 0, mcp: 0 },
				}),
		);
	} finally {
		await f.close();
	}
});

test("evaluation HTTP rejects non-HOLD candidates and revalidates sealed bytes and actual batch bindings on every call", async () => {
	const f = await batchFixture();
	const { get, post } = requests(f);
	try {
		const jobPath = join(f.directory, "job.json");
		const jobBytes = await readFile(jobPath);
		for (const state of ["RUNNING", "FAILED", "UNKNOWN"]) {
			await writeFile(
				jobPath,
				JSON.stringify({ ...JSON.parse(jobBytes.toString()), state }),
			);
			await error(await get("/result"), 409, "RESULT_NOT_AVAILABLE");
		}
		await writeFile(jobPath, jobBytes);
		const { result } = (await (await get("/result")).json()) as {
			result: ResultBinding;
		};
		const input = review(result);
		const outbound = [f.wikiCalls, f.bridge.requests.length];
		for (const [path, code] of [
			[join(f.directory, "candidate.png"), "RESULT_HASH_MISMATCH"],
			[
				join(f.directory, "candidate.png.receipt.json"),
				"RESULT_EVIDENCE_MISMATCH",
			],
			[
				join(f.directory, "machine-diagnostics.json"),
				"RESULT_EVIDENCE_MISMATCH",
			],
			[f.snapshotPath, "SOURCE_SNAPSHOT_MISMATCH"],
		] as const) {
			const original = await readFile(path);
			await writeFile(path, Buffer.concat([original, Buffer.from(" ")]));
			await error(await get("/result"), 409, code);
			await error(await get("/evaluations"), 409, code);
			await error(await post(input), 409, code);
			await writeFile(path, original);
		}
		expect(await (await get("/evaluations")).json()).toMatchObject({
			history: [],
			latest: null,
		});
		expect([f.wikiCalls, f.bridge.requests.length]).toEqual(outbound);
	} finally {
		await f.close();
	}
});
