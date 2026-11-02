import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { EventEmitter, once } from "node:events";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { encodePng } from "../../portrait/acceptance/src/png.ts";
import { operations, remoteCommandSchema } from "../src/management.ts";

const sha = (value: string | Uint8Array) =>
	createHash("sha256").update(value).digest("hex");
const id = "11111111-1111-4111-8111-111111111111";
const nodeKey = "NODE_BINARY",
	pathKey = "PATH";
const node = process.env[nodeKey] ?? "node";
const evidenceKey = "TASK3_EVIDENCE";
function evidence(value: object) {
	if (process.env[evidenceKey])
		console.log(`TASK3_QA ${JSON.stringify(value)}`);
}
const image = encodePng({
	width: 1024,
	height: 1536,
	pixels: new Uint8Array(1024 * 1536 * 4),
});
const detail = Buffer.from(
	JSON.stringify({
		id: "person-0998",
		name: "Controlled owner",
		detailRoute: "/people/person-0998",
		familyTree: { personId: "K998" },
	}),
);
const token = Buffer.from(
	JSON.stringify({
		personId: "person-0998",
		characterId: "K998",
		name: "Controlled owner",
		image: { sha256: sha(image) },
		generationContract: {},
		slots: [],
	}),
);
const sourceHashes = {
	detail: sha(detail),
	token: sha(token),
	image: sha(image),
};
const sheet = {
	requestId: id,
	detailBase64: detail.toString("base64"),
	tokenBase64: token.toString("base64"),
	imageBase64: Buffer.from(image).toString("base64"),
};
const generation = {
	requestId: id,
	connectionId: id,
	personId: "person-0998",
	providerModel: "gpt-image-2.5-sunburst",
	faceMode: { kind: "unique", variantId: null },
};
const evaluation = {
	jobId: id,
	evaluationId: id,
	expectedRevision: 0,
	pngSHA: sha(image),
	receiptSHA: "b".repeat(64),
	machineMetricsSHA: "c".repeat(64),
	verdict: "hold",
	categories: Object.fromEntries(
		[
			"identity-and-face",
			"anatomy-and-pose",
			"framing-and-composition",
			"technique-and-style",
			"transparency-and-edges",
			"authored-conditions",
		].map((key) => [key, { judgement: "hold", notes: "" }]),
	),
	notes: "",
};

async function fixture() {
	const directory = await mkdtemp(join(tmpdir(), "remote-catalog-"));
	const requests: {
		path: string;
		method: string;
		body: Record<string, unknown>;
	}[] = [];
	let mode = "success";
	const server = createServer(async (req, res) => {
		let bytes = "";
		for await (const chunk of req) bytes += String(chunk);
		const body = bytes ? (JSON.parse(bytes) as Record<string, unknown>) : {};
		requests.push({ path: req.url ?? "", method: req.method ?? "", body });
		res.setHeader("content-type", "application/json");
		const reply = (value: unknown) => res.end(JSON.stringify(value));
		if (req.url === "/tools/api/auth/session") {
			res.setHeader(
				"set-cookie",
				"portal_session=controlled; Secure; HttpOnly; Path=/tools/",
			);
			return reply({ authenticated: true, csrfToken: "controlled-csrf" });
		}
		if (req.url === "/tools/api/connections")
			return reply({ connection: { connectionId: id, state: "READY" } });
		if (req.url === "/tools/api/auth/logout")
			return reply({ authenticated: false });
		if (
			req.headers.origin !== "https://sss.linalab.io" ||
			req.headers.cookie !== "portal_session=controlled" ||
			req.headers["x-csrf-token"] !== "controlled-csrf" ||
			req.headers["cf-access-token"] !== "controlled-access"
		) {
			res.statusCode = 403;
			return reply({ error: { code: "ACCESS_REQUIRED" } });
		}
		if (mode === "redirect") {
			res.writeHead(302, { location: "https://external.example/access" });
			return res.end();
		}
		if (
			[
				"AUTH_EXPIRED",
				"CONNECTION_NOT_READY",
				"EVALUATION_REVISION_CONFLICT",
				"REQUEST_CONFLICT",
				"OWNER_REQUEST_UNCERTAIN",
			].includes(mode)
		) {
			res.statusCode = mode === "AUTH_EXPIRED" ? 401 : 409;
			return reply({ error: { code: mode } });
		}
		if (req.url?.endsWith("/image")) {
			res.setHeader("content-type", "image/png");
			return res.end(mode === "tamper" ? Buffer.from("tampered") : image);
		}
		if (req.url?.includes("/references/") && req.url.endsWith("/result")) {
			if (mode === "unavailable") {
				res.statusCode = 404;
				return reply({ error: { code: "NOT_FOUND" } });
			}
			return reply({
				result: {
					requestId:
						mode === "wrong-parent"
							? "22222222-2222-4222-8222-222222222222"
							: id,
					childRequestId:
						mode === "wrong-child"
							? "bad"
							: "22222222-2222-4222-8222-222222222222",
					shot: mode === "wrong-shot" ? "front" : "hair",
					receiptSHA:
						mode === "wrong-receipt" ? "B".repeat(64) : "b".repeat(64),
					pngSHA: sha(image),
					imageUrl:
						mode === "wrong-url"
							? "https://external.example/private"
							: `/tools/api/references/${id}/hair/image`,
				},
			});
		}
		if (req.url?.endsWith("/result"))
			return reply({
				result: {
					jobId: id,
					pngSHA: sha(image),
					imageUrl: `/tools/api/jobs/${id}/image`,
				},
			});
		if (req.url === "/tools/api/sheets") {
			expect(Object.keys(body).sort()).toEqual([
				"detailBase64",
				"imageBase64",
				"tokenBase64",
			]);
			expect(body).toEqual({
				detailBase64: sheet.detailBase64,
				tokenBase64: sheet.tokenBase64,
				imageBase64: sheet.imageBase64,
			});
			return reply({
				sheetId: id,
				personId: "person-0998",
				characterId: "K998",
				name: "Controlled owner",
				sourceHashes:
					mode === "sheet-tamper"
						? { ...sourceHashes, image: "d".repeat(64) }
						: sourceHashes,
			});
		}
		if (req.url?.endsWith("/evaluations") && req.method === "POST") {
			const { jobId: _jobId, ...payload } = evaluation;
			expect(body).toEqual(payload);
			return reply({ evaluation: { evaluationId: id, revision: 1 } });
		}
		if (req.url?.endsWith("/evaluations"))
			return reply({ history: [], latest: null });
		if (req.url?.endsWith("/cancel-pending")) {
			expect(body).toEqual({});
			return reply({ batch: { id, state: "CANCELLED" } });
		}
		if (req.url?.includes("/batches")) {
			expect(body).not.toHaveProperty("requestId");
			return reply({ batch: { id, state: "COMPLETED" } });
		}
		if (req.url?.includes("/wiki/people/person-"))
			return reply({ personId: "person-0998", sourceHashes });
		if (req.url?.includes("/wiki/people"))
			return reply({ people: [{ personId: "person-0998" }] });
		return reply({
			job: { id, state: mode === "UNKNOWN" ? "UNKNOWN" : "HOLD" },
		});
	});
	const ready = once(server, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	server.listen(0, "127.0.0.1");
	await ready;
	const address = server.address();
	if (!address || typeof address === "string") throw Error("fixture address");
	const preload = join(directory, "controlled.mjs");
	await writeFile(
		preload,
		`import cp from 'node:child_process'; import {syncBuiltinESMExports} from 'node:module'; import {PassThrough} from 'node:stream'; import {EventEmitter} from 'node:events'; const originalSpawn=cp.spawn; cp.spawn=(command,args,options)=>{if(command!=='cloudflared')return originalSpawn(command,args,options); const child=new EventEmitter(); child.stdout=new PassThrough(); child.stderr=new PassThrough(); queueMicrotask(()=>{child.stdout.end('controlled-access\\n');child.emit('close',0);});return child;};syncBuiltinESMExports();const network=globalThis.fetch;globalThis.fetch=(input,init)=>{const url=new URL(String(input));if(url.origin!=='https://sss.linalab.io')throw Error('outside fixture');return network('http://127.0.0.1:${address.port}'+url.pathname+url.search,init);};`,
	);
	const baseEnv = {
		PATH: process.env[pathKey],
		SSSTOOL_SERVER_URL: "https://sss.linalab.io/tools/",
	};
	async function cli(args: string[], state: string) {
		const child = spawn(
			node,
			["--import", preload, join(import.meta.dir, "../dist/cli.mjs"), ...args],
			{
				cwd: directory,
				env: { ...baseEnv, SSSTOOL_STATE_DIRECTORY: join(directory, state) },
				stdio: ["ignore", "pipe", "pipe"],
			},
		);
		const exited = once(child, "exit", { signal: AbortSignal.timeout(10000) });
		let stdout = "",
			stderr = "";
		child.stdout.on("data", (chunk) => {
			stdout += String(chunk);
		});
		child.stderr.on("data", (chunk) => {
			stderr += String(chunk);
		});
		const [code] = await exited;
		expect(stderr).toBe("");
		expect(stdout.trim().split("\n")).toHaveLength(1);
		return { code, report: JSON.parse(stdout) };
	}
	function mcp(state: string) {
		const child = spawn(
			node,
			["--import", preload, join(import.meta.dir, "../dist/mcp.mjs")],
			{
				cwd: directory,
				env: { ...baseEnv, SSSTOOL_STATE_DIRECTORY: join(directory, state) },
				stdio: ["pipe", "pipe", "pipe"],
			},
		);
		const exited = once(child, "exit", { signal: AbortSignal.timeout(30000) });
		const events = new EventEmitter();
		let serial = 0,
			stderr = "";
		createInterface({ input: child.stdout }).on("line", (line) => {
			const value = JSON.parse(line);
			events.emit(String(value.id), value);
		});
		child.stderr.on("data", (chunk) => {
			stderr += String(chunk);
		});
		async function request(method: string, params: unknown = {}) {
			const requestId = ++serial;
			const answer = once(events, String(requestId), {
				signal: AbortSignal.timeout(10000),
			});
			child.stdin.write(
				`${JSON.stringify({ jsonrpc: "2.0", id: requestId, method, params })}\n`,
			);
			return (await answer)[0];
		}
		return {
			request,
			initialize: async () => {
				await request("initialize", {
					protocolVersion: "2025-11-25",
					capabilities: {},
					clientInfo: { name: "controlled", version: "1" },
				});
				child.stdin.write(
					'{"jsonrpc":"2.0","method":"notifications/initialized"}\n',
				);
			},
			call: async (name: string, arguments_: unknown) => {
				const value = (
					await request("tools/call", { name, arguments: arguments_ })
				).result;
				expect(JSON.parse(value.content[0].text)).toEqual(
					value.structuredContent,
				);
				expect(value.isError).toBe(!value.structuredContent.ok);
				return value.structuredContent;
			},
			close: async () => {
				child.stdin.end();
				expect((await exited)[0]).toBe(0);
				expect(stderr).toBe("");
			},
		};
	}
	return {
		directory,
		requests,
		cli,
		mcp,
		mode: (value: string) => {
			mode = value;
		},
		close: async () => {
			const closed = once(server, "close");
			server.close();
			server.closeAllConnections();
			await closed;
			await rm(directory, { recursive: true, force: true });
		},
	};
}

test("reference download reads fixed authenticated metadata and publishes the verified PNG through CLI and MCP", async () => {
	const f = await fixture();
	const remote = f.mcp("reference-mcp");
	try {
		await remote.initialize();
		const cli = await f.cli(
			[
				"references",
				"download",
				id,
				"--shot",
				"hair",
				"--output",
				"reference-cli.png",
			],
			"reference-cli",
		);
		expect(cli.code).toBe(0);
		const report = await remote.call("references.download", {
			requestId: id,
			shot: "hair",
			output: "reference-mcp.png",
		});
		expect({ ...cli.report.result, output: "reference-mcp.png" }).toEqual(
			report.result,
		);
		expect(report).toMatchObject({
			ok: true,
			operation: "references.download",
			result: {
				requestId: id,
				shot: "hair",
				pngSHA: sha(image),
				receiptSHA: "b".repeat(64),
			},
		});
		for (const file of ["reference-cli.png", "reference-mcp.png"])
			expect(sha(await readFile(join(f.directory, file)))).toBe(sha(image));
		expect(
			f.requests
				.filter((r) => r.path.includes("/references/"))
				.map((r) => [r.method, r.path]),
		).toEqual([
			["GET", `/tools/api/references/${id}/hair/result`],
			["GET", `/tools/api/references/${id}/hair/image`],
			["GET", `/tools/api/references/${id}/hair/result`],
			["GET", `/tools/api/references/${id}/hair/image`],
		]);
		expect(
			(await readdir(f.directory)).some((name) => name.endsWith(".tmp")),
		).toBe(false);
	} finally {
		await remote.close();
		await f.close();
	}
});

test("built CLI and stdio MCP expose matching work catalog and actual authorized HTTP envelopes", async () => {
	const f = await fixture();
	const mcp = f.mcp("mcp");
	try {
		await mcp.initialize();
		const tools = (await mcp.request("tools/list")).result.tools;
		expect(tools.map((tool: { name: string }) => tool.name)).toEqual(
			operations
				.filter((op) => op.transports.includes("mcp"))
				.map((op) => op.name),
		);
		const batch = {
			batchId: id,
			connectionId: id,
			providerModel: generation.providerModel,
			faceMode: generation.faceMode,
			items: [
				{
					personId: "person-0998",
					characterId: "K998",
					name: "Controlled owner",
					wikiDetailSHA: sourceHashes.detail,
					originalSourceHashes: sourceHashes,
				},
			],
		};
		const cases: [string, Record<string, unknown>, string[]][] = [
			["people.list", {}, ["people", "list"]],
			[
				"people.list",
				{ q: "owner name", limit: 1, cursor: 2 },
				[
					"people",
					"list",
					"--q",
					"owner name",
					"--limit",
					"1",
					"--cursor",
					"2",
				],
			],
			[
				"people.get",
				{ personId: "person-0998" },
				["people", "get", "person-0998"],
			],
			["sheets.upload", sheet, ["sheets", "upload"]],
			["generations.create", generation, ["generations", "create"]],
			["generations.get", { jobId: id }, ["generations", "get", id]],
			["batches.create", batch, ["batches", "create"]],
			["batches.get", { batchId: id }, ["batches", "get", id]],
			[
				"batches.cancel-pending",
				{ batchId: id, requestId: "22222222-2222-4222-8222-222222222222" },
				["batches", "cancel-pending"],
			],
			["jobs.result", { jobId: id }, ["jobs", "result", id]],
			["evaluations.list", { jobId: id }, ["evaluations", "list", id]],
			["evaluations.append", evaluation, ["evaluations", "append"]],
		];
		for (const [name, input, args] of cases) {
			const state = name.replaceAll(".", "-");
			await writeFile(join(f.directory, "input.json"), JSON.stringify(input));
			const cli = await f.cli(
				args.length === 2 && name !== "people.list"
					? [...args, "--input", "input.json"]
					: args,
				state,
			);
			const remote = f.mcp(`mcp-${state}`);
			try {
				await remote.initialize();
				const report = await remote.call(name, input);
				expect(cli.code).toBe(0);
				expect(report).toEqual(cli.report);
				evidence({ scenario: name, cli, mcp: report, equal: true });
			} finally {
				await remote.close();
			}
		}
		const cliDownload = await f.cli(
			["jobs", "download", id, "--output", "cli.png"],
			"download-cli",
		);
		const mcpDownload = await mcp.call("jobs.download", {
			jobId: id,
			output: "mcp.png",
		});
		expect({ ...cliDownload.report.result, output: "mcp.png" }).toEqual(
			mcpDownload.result,
		);
		expect(sha(await readFile(join(f.directory, "cli.png")))).toBe(sha(image));
		expect(await readFile(join(f.directory, "mcp.png"))).toEqual(
			await readFile(join(f.directory, "cli.png")),
		);
		evidence({
			scenario: "jobs.download",
			cli: cliDownload,
			mcp: mcpDownload,
			hashesEqual: true,
		});
		for (const name of ["login", "logout"])
			expect((await f.cli([name], "login-cli")).report).toEqual(
				await mcp.call(name, {}),
			);
		expect(remoteCommandSchema.options).toHaveLength(24);
	} finally {
		await mcp.close();
		await f.close();
	}
}, 30000);

test("reference download rejects bad input metadata and image bytes before any publication", async () => {
	const f = await fixture();
	const remote = f.mcp("reference-mcp");
	try {
		await remote.initialize();
		for (const invalid of [
			{ requestId: "bad", shot: "hair", output: "invalid.png" },
			{ requestId: id, shot: "mesh", output: "invalid.png" },
			{ requestId: id, shot: "hair", output: "" },
			{
				requestId: id,
				shot: "hair",
				output: "invalid.png",
				url: "https://external.example",
			},
		]) {
			const before = f.requests.length;
			expect(await remote.call("references.download", invalid)).toMatchObject({
				ok: false,
				failures: [{ code: "INVALID_PARAMS" }],
			});
			expect(f.requests).toHaveLength(before);
		}
		for (const args of [
			[
				"references",
				"download",
				"bad",
				"--shot",
				"hair",
				"--output",
				"invalid.png",
			],
			[
				"references",
				"download",
				id,
				"--shot",
				"mesh",
				"--output",
				"invalid.png",
			],
			["references", "download", id, "--output", "invalid.png"],
			[
				"references",
				"download",
				id,
				"--shot",
				"hair",
				"--output",
				"invalid.png",
				"extra",
			],
			["jobs", "download", id, "--shot", "hair", "--output", "invalid.png"],
		]) {
			const before = f.requests.length;
			expect((await f.cli(args, "invalid-cli")).code).toBe(1);
			expect(f.requests).toHaveLength(before);
		}
		for (const mode of [
			"wrong-parent",
			"wrong-child",
			"wrong-shot",
			"wrong-receipt",
			"wrong-url",
			"tamper",
			"unavailable",
		]) {
			f.mode(mode);
			const before = f.requests.length;
			const cli = await f.cli(
				["references", "download", id, "--shot", "hair", "--output", "bad.png"],
				"bad-cli",
			);
			expect(cli.report).toEqual(
				await remote.call("references.download", {
					requestId: id,
					shot: "hair",
					output: "bad.png",
				}),
			);
			expect(cli.report.failures[0].code).toBe(
				mode === "tamper"
					? "RESULT_HASH_MISMATCH"
					: mode === "unavailable"
						? "NOT_FOUND"
						: "INVALID_RESPONSE",
			);
			expect(f.requests.slice(before).every((r) => r.method === "GET")).toBe(
				true,
			);
			if (mode !== "tamper")
				expect(
					f.requests.slice(before).some((r) => r.path.endsWith("/image")),
				).toBe(false);
			expect(await readdir(f.directory)).not.toContain("bad.png");
			expect(
				(await readdir(f.directory)).some((name) => name.endsWith(".tmp")),
			).toBe(false);
		}
		await writeFile(join(f.directory, "owned.png"), "untouched");
		const before = f.requests.length;
		expect(
			(
				await remote.call("references.download", {
					requestId: id,
					shot: "hair",
					output: "owned.png",
				})
			).failures[0].code,
		).toBe("OUTPUT_EXISTS");
		expect(f.requests).toHaveLength(before);
		expect(await readFile(join(f.directory, "owned.png"), "utf8")).toBe(
			"untouched",
		);
	} finally {
		await remote.close();
		await f.close();
	}
});

test("download publication races preserve the winner and clean the fsynced temporary file", async () => {
	const f = await fixture();
	try {
		const preload = join(f.directory, "race.mjs");
		await writeFile(
			preload,
			`import fs from 'node:fs/promises';import {syncBuiltinESMExports} from 'node:module';const original=fs.link;fs.link=async(from,to)=>{await fs.writeFile(to,'race-winner',{flag:'wx'});return original(from,to);};syncBuiltinESMExports();`,
		);
		// The controlled transport preload is already imported before this race hook.
		const transport = await readFile(
			join(f.directory, "controlled.mjs"),
			"utf8",
		);
		await writeFile(
			join(f.directory, "controlled.mjs"),
			`${transport}\nawait import(${JSON.stringify(preload)});`,
		);
		for (const kind of ["jobs", "references"]) {
			const args = [kind, "download", id, "--output", `${kind}-race.png`];
			if (kind === "references") args.push("--shot", "hair");
			const cli = await f.cli(args, `${kind}-race`);
			expect(cli.report.failures[0].code).toBe("OUTPUT_EXISTS");
			expect(
				await readFile(join(f.directory, `${kind}-race.png`), "utf8"),
			).toBe("race-winner");
			expect(
				(await readdir(f.directory)).some((name) => name.endsWith(".tmp")),
			).toBe(false);
		}
	} finally {
		await f.close();
	}
});

test("built transports preserve auth, stale CAS, conflicts, UNKNOWN and zero extra mutation dispatch", async () => {
	const f = await fixture();
	try {
		for (const mode of [
			"redirect",
			"AUTH_EXPIRED",
			"CONNECTION_NOT_READY",
			"EVALUATION_REVISION_CONFLICT",
			"REQUEST_CONFLICT",
			"OWNER_REQUEST_UNCERTAIN",
			"UNKNOWN",
		]) {
			f.mode(mode);
			const input =
				mode === "EVALUATION_REVISION_CONFLICT" ? evaluation : generation;
			const name =
				mode === "EVALUATION_REVISION_CONFLICT"
					? "evaluations.append"
					: "generations.create";
			const args =
				mode === "EVALUATION_REVISION_CONFLICT"
					? ["evaluations", "append"]
					: ["generations", "create"];
			await writeFile(join(f.directory, "input.json"), JSON.stringify(input));
			const before = f.requests.filter((r) => r.method === "POST").length;
			const cli = await f.cli(
				[...args, "--input", "input.json"],
				`cli-${mode}`,
			);
			const remote = f.mcp(`mcp-${mode}`);
			try {
				await remote.initialize();
				const report = await remote.call(name, input);
				expect(report).toEqual(cli.report);
				evidence({ scenario: mode, cli, mcp: report, equal: true });
				expect(cli.code).toBe(mode === "UNKNOWN" ? 0 : 1);
				if (mode === "UNKNOWN") expect(report.result.job.state).toBe("UNKNOWN");
				else
					expect(report.failures[0]).toMatchObject({
						code: ["redirect", "AUTH_EXPIRED"].includes(mode)
							? "AUTH_REQUIRED"
							: mode,
						requestId: id,
					});
				expect((await remote.call(name, input)).failures[0].code).toBe(
					"MUTATION_ALREADY_DISPATCHED",
				);
				expect(
					(
						await remote.call(name, {
							...input,
							...(name === "generations.create"
								? { personId: "person-1003" }
								: { notes: "changed" }),
						})
					).failures[0].code,
				).toBe("REQUEST_CONFLICT");
				expect(
					(await f.cli([...args, "--input", "input.json"], `cli-${mode}`))
						.report.failures[0].code,
				).toBe("MUTATION_ALREADY_DISPATCHED");
				expect(
					f.requests.filter((r) => r.method === "POST").length - before,
				).toBe(2);
			} finally {
				await remote.close();
			}
		}
	} finally {
		await f.close();
	}
}, 30000);

test("invalid sheets dispatch nothing and download tampering never publishes or overwrites", async () => {
	const f = await fixture();
	const remote = f.mcp("mcp");
	try {
		await remote.initialize();
		for (const input of [
			{ ...sheet, imageBase64: "not-base64" },
			{ ...sheet, detailBase64: Buffer.from("{}").toString("base64") },
			{ ...sheet, secret: "private-canary" },
		]) {
			const before = f.requests.length;
			await writeFile(join(f.directory, "input.json"), JSON.stringify(input));
			const cli = await f.cli(
				["sheets", "upload", "--input", "input.json"],
				"invalid-cli",
			);
			expect(cli.report).toEqual(await remote.call("sheets.upload", input));
			expect(cli.report.failures[0].code).toBe("INVALID_PARAMS");
			expect(f.requests).toHaveLength(before);
		}
		f.mode("tamper");
		const cli = await f.cli(
			["jobs", "download", id, "--output", "bad.png"],
			"tamper-cli",
		);
		expect(cli.code).toBe(1);
		expect(cli.report).toEqual(
			await remote.call("jobs.download", { jobId: id, output: "bad.png" }),
		);
		expect(cli.report.failures[0].code).toBe("RESULT_HASH_MISMATCH");
		evidence({ scenario: "download-tamper", cli, targetAbsent: true });
		expect(await readdir(f.directory)).not.toContain("bad.png");
		expect(
			(await readdir(f.directory)).some((name) => name.endsWith(".tmp")),
		).toBe(false);
		await writeFile(join(f.directory, "owned.png"), "untouched");
		const before = f.requests.length;
		expect(
			(await remote.call("jobs.download", { jobId: id, output: "owned.png" }))
				.failures[0].code,
		).toBe("OUTPUT_EXISTS");
		expect(f.requests).toHaveLength(before);
		expect(await readFile(join(f.directory, "owned.png"), "utf8")).toBe(
			"untouched",
		);
		f.mode("sheet-tamper");
		expect((await remote.call("sheets.upload", sheet)).failures[0].code).toBe(
			"SOURCE_HASH_MISMATCH",
		);
	} finally {
		await remote.close();
		await f.close();
	}
}, 30000);
