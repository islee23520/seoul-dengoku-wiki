import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { generateKeyPairSync, randomUUID, sign } from "node:crypto";
import { EventEmitter, once } from "node:events";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import type { DatabaseSync } from "node:sqlite";
import { encodePng } from "../../portrait/acceptance/src/png.ts";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import {
	importOriginals,
	openOriginalsStore,
	readOriginalJson,
} from "../../people-cli/src/store.ts";
import { loadConfig } from "../src/config.ts";
import { createPortal } from "../src/server.ts";
import { hash, openCharacters, registrationSheet } from "../src/sources.ts";

const image = (value: number) =>
	encodePng({
		width: 1,
		height: 1,
		pixels: new Uint8Array([value, 0, 0, 255]),
	});
function original(
	personId = "person-9009",
	revision = 1,
	characterId = "K9009",
) {
	const name = `Registration fixture ${personId}`;
	const detail = Buffer.from(
		`${JSON.stringify({ id: personId, characterId, name, detailRoute: `/people/${personId}`, familyTree: { personId: characterId }, authored: { revision, unknown: "preserved" } }, null, 2)}\n`,
	);
	const png = image(revision);
	const token = Buffer.from(
		`${JSON.stringify({ personId, characterId, name, image: { sha256: hash(png) }, generationContract: { authored: "not rewritten" }, slots: {}, revision })}\n`,
	);
	return {
		personId,
		detailBase64: detail.toString("base64"),
		tokenBase64: token.toString("base64"),
		imageBase64: Buffer.from(png).toString("base64"),
		detailSha256: hash(detail),
		tokenSha256: hash(token),
		imageSha256: hash(png),
	};
}
const evidenceKey = "TASK9_EVIDENCE";
function evidence(value: object) {
	if (process.env[evidenceKey])
		console.log(`TASK9_QA ${JSON.stringify(value)}`);
}
function rows(db: DatabaseSync) {
	return Object.fromEntries(
		[
			"people",
			"current_originals",
			"detail_revisions",
			"token_revisions",
			"image_revisions",
		].map((table) => [
			table,
			db
				.prepare(
					`SELECT * FROM ${table} ORDER BY person_id${table.endsWith("revisions") ? ", import_sequence" : ""}`,
				)
				.all()
				.map(({ bytes, ...row }) => ({
					...row,
					...(bytes instanceof Uint8Array
						? { bytes: Buffer.from(bytes).toString("base64") }
						: {}),
				})),
		]),
	);
}

test("validated current tuples preserve six registrations and exclude missing, corrupt, and mismatched originals", async () => {
	const root = await mkdtemp(join(tmpdir(), "task9-store-"));
	const path = join(root, "originals.sqlite");
	const db = openOriginalsStore(path);
	const reader = openCharacters(path);
	try {
		for (const id of ["0998", "1003", "1004", "1007", "1008", "1009"])
			reader.register(original(`person-${id}`, 1, `K${id}`));
		expect(reader.list()).toHaveLength(6);
		const first = original();
		reader.register(first);
		const frozen = reader.get(first.personId);
		const second = original(first.personId, 2);
		expect(reader.register(second).revisions).toEqual({
			detail: 2,
			token: 2,
			image: 2,
		});
		expect(reader.get(first.personId).sourceHashes.image).toBe(
			second.imageSha256,
		);
		expect(frozen.sourceHashes.image).toBe(first.imageSha256);
		expect(readOriginalJson(db, first.personId, "detail", 1)?.bytes).toEqual(
			frozen.detailBytes,
		);
		reader.register(first);
		expect(reader.get(first.personId).sourceHashes).toEqual(
			frozen.sourceHashes,
		);
		expect(
			db
				.prepare("SELECT count(*) AS n FROM image_revisions WHERE person_id=?")
				.get(first.personId),
		).toEqual({ n: 2 });
		const before = rows(db);
		expect(() =>
			reader.register(original(first.personId, 3, "K-other")),
		).toThrow("permanent identity conflict");
		expect(rows(db)).toEqual(before);
		db.prepare("INSERT INTO people VALUES (?, ?, ?)").run(
			"person-9010",
			"K9010",
			"No originals",
		);
		expect(reader.list()).toHaveLength(7);
		db.prepare(
			"UPDATE current_originals SET image_sha256=? WHERE person_id=?",
		).run("0".repeat(64), first.personId);
		expect(reader.list()).toHaveLength(6);
		expect(() => reader.get(first.personId)).toThrow();
		evidence({
			scenario: "store",
			sixPreserved: true,
			newPersonVisible: true,
			revisions: 2,
			reselectedPriorTuple: true,
			conflictRollback: true,
			invalidTupleExcluded: true,
		});
	} finally {
		reader.close();
		db.close();
		await rm(root, { recursive: true, force: true });
	}
});

async function fixture() {
	const root = await mkdtemp(join(tmpdir(), "task9-http-"));
	const path = join(root, "originals.sqlite");
	const db = openOriginalsStore(path);
	const seed = original("person-0998", 1, "K0998");
	const sheet = registrationSheet(seed);
	importOriginals(db, [
		{
			personId: sheet.personId,
			characterId: sheet.characterId,
			name: sheet.name,
			detail: {
				url: "fixture:detail",
				bytes: sheet.detailBytes,
				sha256: sheet.sourceHashes.detail,
			},
			token: {
				url: "fixture:token",
				bytes: sheet.tokenBytes,
				sha256: sheet.sourceHashes.token,
			},
			image: {
				url: "fixture:image",
				bytes: sheet.imageBytes,
				sha256: sheet.sourceHashes.image,
			},
		},
	]);
	const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
	const environment = {
		PORTAL_MODE: "personal",
		PORTAL_PUBLIC_URL: "https://owner.example/tools",
		PORTAL_OWNER_EMAIL: "owner@example.com",
		PORTAL_ACCESS_ISSUER: "https://fixture.cloudflareaccess.com",
		PORTAL_ACCESS_AUDIENCE: "a".repeat(64),
		PORTAL_SESSION_SECRET: "registration-fixture-session".repeat(3),
		PORTAL_TEMPLATE_MANIFEST: "/fixture/manifest.json",
		PORTAL_TEMPLATE_PINS: "/fixture/pins.json",
	};
	function assertion(email = environment.PORTAL_OWNER_EMAIL) {
		const encode = (v: unknown) =>
			Buffer.from(JSON.stringify(v)).toString("base64url");
		const value = `${encode({ alg: "RS256", kid: "task9" })}.${encode({ iss: environment.PORTAL_ACCESS_ISSUER, aud: [environment.PORTAL_ACCESS_AUDIENCE], email, exp: 9000000000 })}`;
		return `${value}.${sign("RSA-SHA256", Buffer.from(value), pair.privateKey).toString("base64url")}`;
	}
	const person = JSON.parse(
		Buffer.from(original().detailBase64, "base64").toString(),
	);
	const wiki = createServer((req, res) => {
		if (req.url === "/wiki/people")
			res.end(
				'<script type="module" src="/wiki/assets/index-fixture.js"></script>',
			);
		else if (req.url === "/wiki/assets/index-fixture.js")
			res.end('const x="assets/peopleCatalog-fixture.js";');
		else if (req.url === "/wiki/assets/peopleCatalog-fixture.js")
			res.end(`var e=${JSON.stringify([person])};export{e};`);
		else res.end(JSON.stringify(person));
	});
	const wikiReady = once(wiki, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	wiki.listen(0, "127.0.0.1");
	await wikiReady;
	const wikiAddress = wiki.address();
	if (!wikiAddress || typeof wikiAddress === "string") throw Error("address");
	const canonical = createTransportFixture();
	const config = loadConfig({
		...environment,
		PORTAL_STORAGE_PATH: join(root, "storage"),
		PORTAL_ORIGINALS_DB: path,
		PORTAL_PUBLIC_PATH: join(import.meta.dir, "../public"),
		WIKI_BASE_URL: `http://127.0.0.1:${wikiAddress.port}/wiki/`,
	});
	const app = await createPortal(config, {
		template: {
			candidate: canonical.candidate,
			operatorPins: canonical.operatorPins,
		},
		accessFetch: async () =>
			Response.json({
				keys: [
					{
						...pair.publicKey.export({ format: "jwk" }),
						kid: "task9",
						alg: "RS256",
						use: "sig",
					},
				],
			}),
	});
	const ready = once(app.server, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	app.server.listen(0, "127.0.0.1");
	await ready;
	const address = app.server.address();
	if (!address || typeof address === "string") throw Error("address");
	const access = assertion();
	const requests: string[] = [];
	app.server.on("request", (req) => requests.push(`${req.method} ${req.url}`));
	const request = (route: string, init: RequestInit = {}) =>
		fetch(`http://127.0.0.1:${address.port}/tools${route}`, {
			...init,
			signal: AbortSignal.timeout(5000),
			headers: {
				host: "owner.example",
				"cf-access-jwt-assertion": access,
				...Object.fromEntries(new Headers(init.headers)),
			},
		});
	const boot = await request("/api/auth/session");
	const session = (await boot.json()) as { csrfToken: string };
	const headers = {
		cookie: (boot.headers.get("set-cookie") ?? "").split(";")[0] ?? "",
		origin: "https://owner.example",
		"x-csrf-token": session.csrfToken,
		"content-type": "application/json",
	};
	const preload = join(root, "controlled.mjs");
	await writeFile(
		preload,
		`import cp from 'node:child_process'; import {request} from 'node:http'; import {syncBuiltinESMExports} from 'node:module'; import {PassThrough} from 'node:stream'; import {EventEmitter} from 'node:events'; const old=cp.spawn;cp.spawn=(command,args,opts)=>{if(command!=='cloudflared')return old(command,args,opts);const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();queueMicrotask(()=>{child.stdout.end('controlled-access\\n');child.emit('close',0);});return child;};syncBuiltinESMExports();globalThis.fetch=(input,init)=>new Promise((resolve,reject)=>{const url=new URL(String(input));if(url.origin!=='https://sss.linalab.io')throw Error('outside fixture');const req=request({hostname:'127.0.0.1',port:${address.port},path:url.pathname,method:init.method,signal:init.signal,headers:{...init.headers,host:'owner.example',origin:'https://owner.example','cf-access-jwt-assertion':${JSON.stringify(access)}}},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{const headers=new Headers();for(let i=0;i<res.rawHeaders.length;i+=2)headers.append(res.rawHeaders[i],res.rawHeaders[i+1]);resolve(new Response(Buffer.concat(chunks),{status:res.statusCode,headers}));});});req.on('error',reject);req.end(init.body);});`,
		{ mode: 0o600 },
	);
	const pathKey = "PATH";
	const env = {
		PATH: process.env[pathKey],
		SSSTOOL_SERVER_URL: "https://sss.linalab.io/tools/",
		SSSTOOL_STATE_DIRECTORY: join(root, "remote-state"),
	};
	async function cli(input: object) {
		await writeFile(join(root, "input.json"), JSON.stringify(input));
		const child = spawn(
			"node",
			[
				"--import",
				preload,
				join(import.meta.dir, "../dist/cli.mjs"),
				"people",
				"register",
				"--input",
				"input.json",
			],
			{ cwd: root, env, stdio: ["ignore", "pipe", "pipe"] },
		);
		const exit = once(child, "close", { signal: AbortSignal.timeout(10000) });
		let stdout = "",
			stderr = "";
		child.stdout.on("data", (c) => {
			stdout += String(c);
		});
		child.stderr.on("data", (c) => {
			stderr += String(c);
		});
		const [code] = await exit;
		expect(stderr).toBe("");
		expect(stdout.trim().split("\n")).toHaveLength(1);
		return { code, report: JSON.parse(stdout) };
	}
	function mcp() {
		const child = spawn(
			"node",
			["--import", preload, join(import.meta.dir, "../dist/mcp.mjs")],
			{
				cwd: root,
				env: { ...env, SSSTOOL_STATE_DIRECTORY: join(root, "mcp-state") },
				stdio: ["pipe", "pipe", "pipe"],
			},
		);
		const exit = once(child, "close", { signal: AbortSignal.timeout(30000) });
		const events = new EventEmitter();
		let serial = 0,
			stderr = "";
		const lines = createInterface({ input: child.stdout });
		lines.on("line", (line) => {
			const value = JSON.parse(line);
			events.emit(String(value.id), value);
		});
		child.stderr.on("data", (c) => {
			stderr += String(c);
		});
		async function rpc(method: string, params: unknown = {}) {
			const id = ++serial;
			const answer = once(events, String(id), {
				signal: AbortSignal.timeout(10000),
			});
			child.stdin.write(
				`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`,
			);
			return (await answer)[0];
		}
		return {
			initialize: async () => {
				await rpc("initialize", {
					protocolVersion: "2025-11-25",
					capabilities: {},
					clientInfo: { name: "task9", version: "1" },
				});
				child.stdin.write(
					'{"jsonrpc":"2.0","method":"notifications/initialized"}\n',
				);
			},
			call: async (input: unknown) => {
				const r = (
					await rpc("tools/call", { name: "people.register", arguments: input })
				).result;
				expect(JSON.parse(r.content[0].text)).toEqual(r.structuredContent);
				expect(r.isError).toBe(!r.structuredContent.ok);
				return r.structuredContent;
			},
			close: async () => {
				child.stdin.end();
				expect((await exit)[0]).toBe(0);
				expect(stderr).toBe("");
				lines.close();
			},
		};
	}
	return {
		root,
		path,
		db,
		request,
		headers,
		assertion,
		cli,
		mcp,
		requests,
		close: async () => {
			await app.close();
			const closed = once(wiki, "close", { signal: AbortSignal.timeout(5000) });
			wiki.close();
			wiki.closeAllConnections();
			await closed;
			db.close();
			await rm(root, { recursive: true, force: true });
		},
	};
}

test("owner HTTP registration, CLI and MCP preserve exact bytes, journal admission, revision tuples and prior snapshots without generation", async () => {
	const f = await fixture();
	const remote = f.mcp();
	try {
		await remote.initialize();
		const first = original();
		const beforeDb = hash(await readFile(f.path));
		const beforeRows = rows(f.db);
		const unregistered = await f.request(`/api/wiki/people/${first.personId}`, {
			headers: f.headers,
		});
		expect(
			(
				(await unregistered.json()) as {
					generationEligibility: { eligible: boolean };
				}
			).generationEligibility.eligible,
		).toBe(false);
		for (const headers of [
			{ ...f.headers, "cf-access-jwt-assertion": "" },
			{
				...f.headers,
				"cf-access-jwt-assertion": f.assertion("other@example.com"),
			},
			{ ...f.headers, "x-csrf-token": "invalid" },
			{ ...f.headers, origin: "https://other.example" },
		]) {
			const denied = await f.request("/api/characters/register", {
				method: "POST",
				headers,
				body: JSON.stringify(first),
			});
			expect([401, 403]).toContain(denied.status);
			expect(rows(f.db)).toEqual(beforeRows);
		}
		for (const input of [
			{ ...first, personId: "person-9010" },
			{ ...first, imageSha256: "0".repeat(64) },
			{ ...first, imageBase64: "bad" },
			{ ...first, secret: "canary" },
		]) {
			const denied = await f.request("/api/characters/register", {
				method: "POST",
				headers: f.headers,
				body: JSON.stringify(input),
			});
			expect([400, 422]).toContain(denied.status);
			expect(rows(f.db)).toEqual(beforeRows);
			const count = f.requests.length;
			const cli = await f.cli(input);
			const mcp = await remote.call(input);
			expect(cli.code).toBe(1);
			expect(cli.report).toEqual(mcp);
			expect(mcp.failures[0].code).toBe("INVALID_PARAMS");
			expect(f.requests).toHaveLength(count);
		}
		const requestId = randomUUID();
		const input = { ...first, requestId };
		const cli = await f.cli(input);
		evidence({ scenario: "cli-registration", ...cli });
		expect(cli.code).toBe(0);
		const mcp = await remote.call(input);
		expect(cli.report).toEqual(mcp);
		expect(mcp.result.revisions).toEqual({ detail: 1, token: 1, image: 1 });
		const count = f.requests.length;
		expect((await f.cli(input)).report.failures[0].code).toBe(
			"MUTATION_ALREADY_DISPATCHED",
		);
		expect((await remote.call(input)).failures[0].code).toBe(
			"MUTATION_ALREADY_DISPATCHED",
		);
		expect(
			(await remote.call({ ...original(first.personId, 2), requestId }))
				.failures[0].code,
		).toBe("REQUEST_CONFLICT");
		expect(f.requests).toHaveLength(count);
		const journal = JSON.parse(
			await readFile(
				join(f.root, "remote-state", "journal", `${requestId}.json`),
				"utf8",
			),
		);
		expect(journal.requestId).toBe(requestId);
		expect(JSON.parse(journal.payload)).toEqual(first);
		const registered = await f.request(`/api/characters/${first.personId}`, {
			headers: f.headers,
		});
		const source = (await registered.json()) as {
			sourceHashes: { detail: string; token: string; image: string };
			imageBase64: string;
		};
		expect(source.imageBase64).toBe(first.imageBase64);
		const snapshotDirectory = join(
			f.root,
			"storage",
			"1",
			"jobs",
			randomUUID(),
		);
		await mkdir(snapshotDirectory, { recursive: true });
		const snapshotPath = join(snapshotDirectory, "source-bytes.json");
		await writeFile(
			snapshotPath,
			JSON.stringify({
				detail: first.detailBase64,
				token: first.tokenBase64,
				image: first.imageBase64,
			}),
		);
		const snapshotSHA = hash(await readFile(snapshotPath));
		const second = original(first.personId, 2);
		const update = await f.request("/api/characters/register", {
			method: "POST",
			headers: f.headers,
			body: JSON.stringify(second),
		});
		expect(update.status).toBe(201);
		expect(((await update.json()) as { revisions: object }).revisions).toEqual({
			detail: 2,
			token: 2,
			image: 2,
		});
		expect(hash(await readFile(snapshotPath))).toBe(snapshotSHA);
		const current = f.db
			.prepare("SELECT * FROM current_originals WHERE person_id=?")
			.get(first.personId);
		expect(current).toEqual({
			person_id: first.personId,
			detail_sha256: second.detailSha256,
			token_sha256: second.tokenSha256,
			image_sha256: second.imageSha256,
		});
		const selected = await f.request(`/api/wiki/people/${first.personId}`, {
			headers: f.headers,
		});
		const detail = (await selected.json()) as {
			imageBase64: string;
			generationEligibility: {
				eligible: boolean;
				sourceMode: string;
				reason: string | null;
				originalSourceHashes: object;
			};
		};
		expect(detail.generationEligibility).toEqual({
			eligible: true,
			sourceMode: "original-photo",
			reason: null,
			originalSourceHashes: {
				detail: second.detailSha256,
				token: second.tokenSha256,
				image: second.imageSha256,
			},
		});
		expect(hash(Buffer.from(detail.imageBase64, "base64"))).toBe(
			second.imageSha256,
		);
		const afterRows = rows(f.db);
		const conflictDb = hash(await readFile(f.path));
		const conflict = await f.request("/api/characters/register", {
			method: "POST",
			headers: f.headers,
			body: JSON.stringify(original(first.personId, 3, "K9011")),
		});
		expect(conflict.status).toBe(409);
		expect(await conflict.json()).toEqual({
			error: { code: "IDENTITY_CONFLICT" },
		});
		expect(rows(f.db)).toEqual(afterRows);
		expect(hash(await readFile(f.path))).toBe(conflictDb);
		expect(f.requests.some((r) => r.includes("/api/generations"))).toBe(false);
		evidence({
			scenario: "integration",
			beforeDb,
			afterDb: conflictDb,
			beforeRows,
			afterRows,
			current,
			cli,
			mcp,
			journal: {
				schema: journal.schema,
				requestId,
				path: journal.path,
				payloadSHA: journal.payloadSha256,
			},
			snapshot: {
				seededPriorJobSnapshot: true,
				sha256: snapshotSHA,
				unchanged: true,
			},
			originalBlobSHA: hash(Buffer.from(detail.imageBase64, "base64")),
			deniedAccessAndCsrf: true,
			invalidTransportDispatch: 0,
			providerCalls: 0,
			cleanupRoot: f.root,
		});
	} finally {
		await remote.close();
		await f.close();
	}
}, 30000);
