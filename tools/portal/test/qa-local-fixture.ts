import { EventEmitter, once } from "node:events";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import {
	importOriginals,
	openOriginalsStore,
} from "../../people-cli/src/store.ts";
import {
	mossWorkflowAssets,
	verifyMossAssetProof,
} from "../src/comfyui-assets.ts";
import {
	COMFY_ENDPOINT,
	type ComfyTransport,
} from "../src/comfyui-provider.ts";
import { loadConfig } from "../src/config.ts";
import { createEvaluationStore } from "../src/evaluations.ts";
import { measurePng } from "../src/png.ts";
import { createPortal } from "../src/server.ts";
import { hash } from "../src/sources.ts";
import {
	finishingPngFixture,
	finishingProof,
} from "./comfyui-finishing-fixture.ts";

// Private disposable HTTP/browser fixture. Never part of the distributable.
const root = await realpath(
	await mkdtemp(join(tmpdir(), "portal-browser-fixture-")),
);
const { PORTAL_QA_PORT } = process.env;
const port = Number(PORTAL_QA_PORT ?? 18767);
const { PORTAL_QA_LARGE_CATALOG } = process.env;
const largeCatalog = PORTAL_QA_LARGE_CATALOG === "1";
const retainedResults = process.env["PORTAL_QA_RETAINED_RESULTS"] === "1";
if (!Number.isInteger(port) || port < 0 || port > 65535)
	throw Error("INVALID_QA_PORT");
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
const makeImage = (
	color: readonly number[],
	width = 1024,
	height = 1536,
	landmarkX?: number,
) => {
	const header = Buffer.alloc(13);
	header.writeUInt32BE(width);
	header.writeUInt32BE(height, 4);
	header[8] = 8;
	header[9] = 6;
	const pixels = Buffer.alloc((width * 4 + 1) * height);
	for (let y = 40; y < height - 40; y++)
		for (let x = 40; x < width - 40; x++) {
			const i = y * (width * 4 + 1) + 1 + x * 4;
			pixels[i] = color[0] ?? 0;
			pixels[i + 1] = color[1] ?? 0;
			pixels[i + 2] = color[2] ?? 0;
			pixels[i + 3] = 255;
		}
	if (landmarkX !== undefined)
		for (let y = 160; y < 560; y++)
			for (let x = landmarkX - 100; x < landmarkX + 100; x++) {
				const i = y * (width * 4 + 1) + 1 + x * 4;
				// White head block, dark eye line and yellow coordinate cross.
				const eye = y >= 300 && y < 332;
				const cross = Math.abs(x - landmarkX) < 8 || Math.abs(y - 440) < 8;
				pixels[i] = cross ? 255 : eye ? 20 : 245;
				pixels[i + 1] = cross ? 220 : eye ? 20 : 245;
				pixels[i + 2] = cross ? 0 : eye ? 20 : 245;
				pixels[i + 3] = 255;
			}
	return new Uint8Array(
		Buffer.concat([
			Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
			chunk("IHDR", header),
			chunk("IDAT", deflateSync(pixels)),
			chunk("IEND", new Uint8Array()),
		]),
	);
};
const sources = [makeImage([140, 100, 60]), makeImage([60, 100, 180])] as const;
const results = [makeImage([180, 60, 100]), makeImage([100, 180, 60])] as const;
const image = sources[0];
const canonical = createTransportFixture();
const refs = canonical.candidate.referenceImages.map((r) => ({
	...r,
	bytes: image,
	...(r.role === "recipient-appearance-only"
		? { sourceHash: hash(image) }
		: {}),
}));
const template = {
	candidate: { ...canonical.candidate, referenceImages: refs },
	operatorPins: {
		...canonical.operatorPins,
		referenceImages: refs.map((r) => ({ id: r.id, sha256: hash(image) })),
	},
};
const people = [1003, 1004].map((id) => ({
	id: `person-${id}`,
	characterId: `K${id}`,
	name: `QA Fixture ${id}`,
	detailRoute: `/people/person-${id}`,
	familyTree: { personId: `K${id}` },
}));
const dbPath = join(root, "originals.sqlite");
const db = openOriginalsStore(dbPath);
for (const [index, person] of people.entries()) {
	const image = sources[index === 0 ? 0 : 1];
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
}
db.close();
if (retainedResults) {
	const ownerId = "1"; // The real local session identity in server.ts.
	const ownerRoot = join(root, "storage", ownerId);
	const store = createEvaluationStore({ ownerRoot, ownerId });
	const fixtures = [
		{
			jobId: "11111111-1111-4111-8111-111111111111",
			person: people[0],
			source: makeImage([80, 100, 140], 1024, 1536, 360),
			result: makeImage([140, 80, 100], 1024, 1536, 600),
		},
		{
			jobId: "22222222-2222-4222-8222-222222222222",
			person: people[0],
			source: makeImage([70, 120, 130], 800, 1200, 300),
			result: makeImage([110, 140, 70], 1024, 1536, 660),
		},
		{
			jobId: "33333333-3333-4333-8333-333333333333",
			person: people[1],
			source: makeImage([120, 70, 140], 1024, 1536, 620),
			result: makeImage([60, 130, 140], 1024, 1536, 380),
		},
	] as const;
	const manifest = [];
	for (const { jobId, person, source, result } of fixtures) {
		if (!person) throw Error("FIXTURE_PERSON");
		const directory = join(ownerRoot, "jobs", jobId);
		await mkdir(directory, { recursive: true, mode: 0o700 });
		const originals = {
			detail: Buffer.from(JSON.stringify(person)),
			token: Buffer.from(
				JSON.stringify({
					personId: person.id,
					characterId: person.characterId,
					name: person.name,
					image: { sha256: hash(source) },
					generationContract: {},
					slots: {},
				}),
			),
			image: source,
		};
		const text = `Synthetic retained fixture ${jobId}`;
		const rendering = { portrait: "synthetic-qa" };
		const evidence = {
			requestId: jobId,
			model: "gpt-image-2.5-sunburst",
			textSHA: hash(Buffer.from(text)),
			renderingSHA: hash(Buffer.from(JSON.stringify(rendering))),
			sourceSHA: hash(Buffer.from("synthetic-look")),
			referenceHashes: [hash(source)],
		};
		const metrics = measurePng(result);
		// Reproduce the neighboring evaluation fixture artifacts without admission
		// or provider dispatch. These deliberately have legacy unknown history time.
		const artifacts: Record<string, string | Uint8Array> = {
			"candidate.png": result,
			"candidate.png.receipt.json": JSON.stringify({
				...evidence,
				responseSHA: hash(result),
				status: 200,
				reviewStatus: "candidate-unreviewed",
			}),
			"candidate.png.request.json": JSON.stringify({
				...evidence,
				size: "1024x1536",
			}),
			"machine-diagnostics.json": JSON.stringify(metrics),
			"projection.json": JSON.stringify({ text, rendering, ...evidence }),
			"projection.txt": text,
			"source-bytes.json": JSON.stringify({
				...Object.fromEntries(
					Object.entries(originals).map(([key, bytes]) => [
						key,
						Buffer.from(bytes).toString("base64"),
					]),
				),
				pins: { lookSHA: evidence.sourceSHA },
			}),
			"provenance.json": JSON.stringify({
				requestId: jobId,
				original: Object.fromEntries(
					Object.entries(originals).map(([key, bytes]) => [key, hash(bytes)]),
				),
				derivedLookSHA: evidence.sourceSHA,
			}),
			"job.json": JSON.stringify({
				id: jobId,
				state: "HOLD",
				reviewStatus: "HOLD",
				imageUrl: `/tools/api/jobs/${jobId}/image`,
				metrics,
				errorCode: null,
				payloadSHA: hash(Buffer.from(jobId)),
			}),
		};
		for (const [name, bytes] of Object.entries(artifacts))
			await writeFile(join(directory, name), bytes, {
				flag: "wx",
				mode: 0o600,
			});
		// Sealing writes result.json and result-snapshot.json now, before browsing.
		const binding = await store.sealResult(jobId);
		const captured = await store.readCapturedSource(jobId);
		manifest.push({
			jobId,
			personId: person.id,
			state: "HOLD",
			createdAt: null,
			sourceSHA: captured.imageSHA,
			resultSHA: binding.pngSHA,
			sourceDimensions: {
				width: measurePng(source).width,
				height: measurePng(source).height,
			},
			resultDimensions: { width: metrics.width, height: metrics.height },
			approval: binding.approval,
		});
	}
	console.log(
		`LOCAL_BROWSER_RETAINED_RESULTS ${JSON.stringify({ ownerId, providerCallCount: 0, sealedBeforeBrowsing: true, jobs: manifest })}`,
	);
}
const catalogue = [
	...people,
	{
		id: "person-1010",
		characterId: "K1010",
		name: "QA Ineligible",
		detailRoute: "/people/person-1010",
		familyTree: { personId: "K1010" },
	},
];
if (largeCatalog)
	for (let id = 10000; id < 13775; id++)
		catalogue.push({
			id: `person-${id}`,
			characterId: `K${id}`,
			name: `QA Large ${id}`,
			detailRoute: `/people/person-${id}`,
			familyTree: { personId: `K${id}` },
		});
const wiki = createServer((req, res) => {
	if (req.url === "/wiki/people")
		res.end(
			'<script type="module" src="/wiki/assets/index-fixture.js"></script>',
		);
	else if (req.url === "/wiki/assets/index-fixture.js")
		res.end('const x="assets/peopleCatalog-fixture.js";');
	else if (req.url === "/wiki/assets/peopleCatalog-fixture.js")
		res.end(`var e=${JSON.stringify(catalogue)};export{e};`);
	else if (req.url?.startsWith("/wiki/portrait-tokens/")) {
		const person = catalogue.find((p) => req.url?.includes(p.id));
		if (!person) res.writeHead(404).end();
		else
			res.end(
				JSON.stringify({
					schemaVersion: 1,
					personId: person.id,
					characterId: person.characterId,
					name: person.name,
					facts: { gender: "여성" },
					artProposal: { hair: "검은 단발", face: "성인 여성" },
				}),
			);
	} else
		res.end(
			JSON.stringify(
				catalogue.find((p) => req.url?.includes(p.id)) ?? people[0],
			),
		);
});
let calls = 0;
const provider = createServer(async (req, res) => {
	const chunks: Buffer[] = [];
	for await (const c of req) chunks.push(Buffer.from(c));
	if (
		req.url !== "/v1/images/edits" ||
		req.headers.authorization !== "Bearer browser-fixture-key"
	) {
		res.writeHead(403).end();
		return;
	}
	calls++;
	const body = Buffer.concat(chunks);
	const sourceIndex = body.includes(Buffer.from(sources[1])) ? 1 : 0;
	console.log(
		`FIXTURE_PROVIDER_CALL ${calls} sha=${hash(Buffer.concat(chunks))}`,
	);
	if (mode === "delayed-result")
		await once(signal, "release-result", {
			signal: AbortSignal.timeout(120000),
		});
	res.writeHead(200, { "content-type": "application/json" }).end(
		JSON.stringify({
			data: [
				{
					b64_json: Buffer.from(results[sourceIndex]).toString("base64"),
				},
			],
		}),
	);
});
for (const s of [wiki, provider]) {
	const ready = once(s, "listening", { signal: AbortSignal.timeout(5000) });
	s.listen(0, "127.0.0.1");
	await ready;
}
const wa = wiki.address(),
	pa = provider.address();
if (!wa || typeof wa === "string" || !pa || typeof pa === "string")
	throw Error("FIXTURE_ADDRESS");
// Optional fake ComfyUI transport for browser QA of the second provider:
// `NODE_ENV=test PORTAL_QA_COMFYUI=1`. Readiness answers from a fixed node
// catalogue; a prompt completes with a synthetic 1024x1536 PNG. No GPU, no
// network, never part of the distributable.
const comfyQa = process.env["PORTAL_QA_COMFYUI"] === "1";
if (comfyQa && process.env.NODE_ENV !== "test")
	throw Error("PORTAL_QA_COMFYUI requires NODE_ENV=test");
const alphaFixture = finishingPngFixture();
const comfyNative = makeImage([90, 110, 160], 1024, 1536, 520);
const comfySocket = new EventTarget();
const comfyPrompts: { id: string; graph: Record<string, unknown> }[] = [];
const comfyTransport: ComfyTransport = {
	webSocket() {
		queueMicrotask(() => comfySocket.dispatchEvent(new Event("open")));
		return {
			addEventListener: comfySocket.addEventListener.bind(comfySocket),
			removeEventListener: comfySocket.removeEventListener.bind(comfySocket),
			close() {},
		};
	},
	async fetch(url, init) {
		const path = url.slice(COMFY_ENDPOINT.length);
		if (path === "/system_stats")
			return Response.json({ system: { comfyui_version: "qa-fixture" } });
		if (path === "/object_info")
			return Response.json(
				Object.fromEntries(
					[
						"UNETLoader",
						"LoraLoaderModelOnly",
						"LoadBackgroundRemovalModel",
						"RemoveBackground",
						"ThresholdMask",
						"MaskComposite",
						"InvertMask",
						"EmptyImage",
						"ImageCompositeMasked",
						"JoinImageWithAlpha",
						"MaskToImage",
						"CLIPLoader",
						"VAELoader",
						"CLIPTextEncode",
						"ConditioningZeroOut",
						"EmptySD3LatentImage",
						"KSampler",
						"VAEDecode",
						"SaveImage",
						"ModelSamplingAuraFlow",
						"EmptyFlux2LatentImage",
					].map((name) => [
						name,
						{ input: { required: {} }, output_node: name === "SaveImage" },
					]),
				),
			);
		if (path === "/prompt") {
			const graph = JSON.parse(String(init.body)).prompt;
			const id = crypto.randomUUID();
			comfyPrompts.push({ id, graph });
			console.log(`FIXTURE_COMFY_PROMPT ${comfyPrompts.length} id=${id}`);
			// In the cut-generation scenario the server job stays RUNNING until QA
			// releases it, so the browser's follow-by-id state can be inspected.
			if (mode === "cut-generation")
				await once(signal, "release-result", {
					signal: AbortSignal.timeout(120000),
				});
			comfySocket.dispatchEvent(
				new MessageEvent("message", {
					data: JSON.stringify({
						type: "executing",
						data: { prompt_id: id, node: null },
					}),
				}),
			);
			return Response.json({ prompt_id: id, node_errors: {} });
		}
		const history = path.match(/^\/history\/(.+)$/);
		if (history) {
			const prompt = comfyPrompts.find((entry) => entry.id === history[1]);
			if (!prompt) throw Error(path);
			const prefix = Reflect.get(
				(prompt.graph["9"] as { inputs: Record<string, unknown> }).inputs,
				"filename_prefix",
			);
			return Response.json({
				[prompt.id]: {
					prompt: [1, prompt.id, prompt.graph, {}, ["9"]],
					status: { completed: true, status_str: "success" },
					outputs: {
						...Object.fromEntries(
							["11", "15", "16"].map((n) => [
								n,
								{
									images: [
										{
											filename: `${(prompt.graph[n] as { inputs: Record<string, unknown> }).inputs["filename_prefix"]}_00001_.png`,
											subfolder: "",
											type: "output",
										},
									],
								},
							]),
						),
						"9": {
							images: [
								{
									filename: `${prefix}_00001_.png`,
									subfolder: "",
									type: "output",
								},
							],
						},
					},
				},
			});
		}
		if (path.startsWith("/view?")) {
			const n = new URL(url).searchParams.get("filename") ?? "";
			return new Response(
				n.includes("_rawmask_")
					? alphaFixture.rawMaskBytes
					: n.includes("_mask_")
						? alphaFixture.maskBytes
						: n.includes("_raw_")
							? alphaFixture.rawBytes
							: alphaFixture.finishedBytes,
			);
		}
		throw Error(path);
	},
};
const app = await createPortal(
	loadConfig({
		PORTAL_MODE: "local",
		PORTAL_PORT: "0",
		PORTAL_STORAGE_PATH: join(root, "storage"),
		PORTAL_ORIGINALS_DB: dbPath,
		WIKI_BASE_URL: `http://127.0.0.1:${wa.port}/wiki/`,
		PORTAL_PUBLIC_PATH: join(import.meta.dir, "../public"),
		PORTAL_TOKENS_PATH: join(
			import.meta.dir,
			"../../shared-web-ui/src/tokens.css",
		),
		...(comfyQa ? { PORTAL_COMFYUI: "true" } : {}),
	}),
	{
		template,
		...(comfyQa
			? {
					comfyTransport,
					comfyMeasureFinishing: async () => finishingProof(),
					comfyMeasureAssets: async (workflow) =>
						verifyMossAssetProof(
							{
								schema: "moss-runtime-file-sha256.v1",
								method: "server-file-stream-sha256",
								assets: mossWorkflowAssets(workflow ?? "").map(
									({ path: _path, ...asset }) => asset,
								),
							},
							workflow,
						),
				}
			: {}),
	},
);
const ready = once(app.server, "listening", {
	signal: AbortSignal.timeout(5000),
});
app.server.listen(0, "127.0.0.1");
await ready;
const aa = app.server.address();
if (!aa || typeof aa === "string") throw Error("FIXTURE_ADDRESS");
const upstream = `http://127.0.0.1:${aa.port}`;
type Mode =
	| "normal"
	| "source-unavailable"
	| "source-hash-mismatch"
	| "delayed-result"
	| "queue-unknown"
	// Forwards POST /generations to the server but drops the browser's
	// connection, like an intermediary timeout; the server job keeps running.
	| "cut-generation";
let mode: Mode = "normal";
let active = 0;
let sequence = 0;
const signal = new EventEmitter();
const events: { id: number; type: string; path?: string; mode?: Mode }[] = [];
const requests: {
	method: string;
	path: string;
	bodySHA: string;
	providerCallCount: number;
}[] = [];
const emit = (event: { type: string; path?: string; mode?: Mode }) => {
	events.push({ id: ++sequence, ...event });
	if (events.length > 256) events.shift();
	signal.emit("event");
};
const proxy = createServer(async (req, res) => {
	const address = proxy.address();
	if (!address || typeof address === "string") return;
	const origin = `http://127.0.0.1:${address.port}`;
	const json = (status: number, value: unknown) =>
		res
			.writeHead(status, {
				"content-type": "application/json",
				"cache-control": "private, no-store",
			})
			.end(JSON.stringify(value));
	if (
		req.socket.remoteAddress !== "127.0.0.1" ||
		req.headers.host !== new URL(origin).host ||
		(req.headers.origin !== undefined && req.headers.origin !== origin) ||
		req.headers["sec-fetch-site"] === "cross-site"
	) {
		json(403, { error: "QA_LOOPBACK_ONLY" });
		return;
	}
	const url = new URL(req.url ?? "/", origin);
	const chunks: Buffer[] = [];
	for await (const chunk of req) chunks.push(Buffer.from(chunk));
	const body = Buffer.concat(chunks);
	if (url.pathname === "/qa/events" && req.method === "GET") {
		const after = Number(url.searchParams.get("after") ?? 0);
		if (!Number.isSafeInteger(after) || after < 0) {
			json(400, { error: "QA_INVALID_CURSOR" });
			return;
		}
		if (url.searchParams.has("after") && !events.some((e) => e.id > after)) {
			try {
				await once(signal, "event", { signal: AbortSignal.timeout(10000) });
			} catch {
				/* Bounded subscription returns an empty event batch. */
			}
		}
		json(200, { events: events.filter((e) => e.id > after), cursor: sequence });
		return;
	}
	if (url.pathname === "/qa/requests" && req.method === "GET") {
		json(200, { requests, providerCallCount: calls, active, mode });
		return;
	}
	if (url.pathname === "/qa/release-result" && req.method === "POST") {
		signal.emit("release-result");
		json(200, { released: true });
		return;
	}
	if (
		(url.pathname === "/qa/reset" || url.pathname === "/qa/scenario") &&
		req.method === "POST"
	) {
		let input: Record<string, unknown>;
		try {
			input = JSON.parse(body.toString());
		} catch {
			json(400, { error: "QA_INVALID_BODY" });
			return;
		}
		if (!input || Array.isArray(input) || typeof input !== "object") {
			json(400, { error: "QA_INVALID_BODY" });
			return;
		}
		if (url.pathname === "/qa/reset") {
			if (Object.keys(input).length) {
				json(400, { error: "QA_INVALID_BODY" });
				return;
			}
			if (active) {
				json(409, { error: "QA_NOT_IDLE" });
				return;
			}
			mode = "normal";
			requests.length = 0;
			events.length = 0;
		} else {
			const { mode: selectedMode } = input;
			if (
				Object.keys(input).length !== 1 ||
				![
					"normal",
					"source-unavailable",
					"source-hash-mismatch",
					"delayed-result",
					"queue-unknown",
					"cut-generation",
				].includes(String(selectedMode))
			) {
				json(400, { error: "QA_INVALID_MODE" });
				return;
			}
			mode = selectedMode as Mode;
		}
		emit({ type: "state-change", mode });
		json(200, { mode, cursor: sequence });
		return;
	}
	if (url.pathname.startsWith("/qa/")) {
		json(404, { error: "QA_NOT_FOUND" });
		return;
	}
	active++;
	try {
		// Limit presentation pagination without changing production Wiki admission.
		if (!largeCatalog && url.pathname === "/tools/api/wiki/people")
			url.searchParams.set("limit", "1");
		const headers = new Headers();
		for (const [key, value] of Object.entries(req.headers))
			if (
				value !== undefined &&
				!["host", "connection", "content-length"].includes(key)
			)
				headers.set(key, Array.isArray(value) ? value.join(", ") : value);
		if (headers.has("origin")) headers.set("origin", upstream);
		if (
			mode === "cut-generation" &&
			req.method === "POST" &&
			url.pathname === "/tools/api/generations"
		) {
			void fetch(upstream + url.pathname + url.search, {
				method: "POST",
				headers,
				redirect: "manual",
				body,
			})
				.then((response) => response.arrayBuffer())
				.then(() =>
					emit({ type: "cut-generation-settled", path: req.url ?? "/" }),
				)
				.catch(() => {});
			res.destroy();
			emit({ type: "request-cut", path: req.url ?? "/" });
			return;
		}
		const response = await fetch(upstream + url.pathname + url.search, {
			method: req.method ?? "GET",
			headers,
			redirect: "manual",
			...(body.length ? { body } : {}),
		});
		if (url.pathname === "/tools/api/jobs/events") {
			res.writeHead(response.status, {
				"content-type": "text/event-stream",
				"cache-control": "no-store",
			});
			const reader = response.body?.getReader();
			res.on("close", () => {
				void reader?.cancel();
			});
			if (reader)
				for (;;) {
					const next = await reader.read();
					if (next.done) break;
					res.write(next.value);
				}
			res.end();
			return;
		}
		let bytes = Buffer.from(await response.arrayBuffer());
		let status = response.status;
		if (response.ok && url.pathname.endsWith("/captured-source")) {
			if (mode === "source-unavailable") {
				status = 503;
				bytes = Buffer.from(JSON.stringify({ error: "QA_SOURCE_UNAVAILABLE" }));
			}
			if (mode === "source-hash-mismatch") {
				const value = JSON.parse(bytes.toString());
				value.source.imageSHA = "0".repeat(64);
				bytes = Buffer.from(JSON.stringify(value));
			}
		}
		if (
			response.ok &&
			mode === "queue-unknown" &&
			req.method === "GET" &&
			/^\/tools\/api\/batches\/[^/]+$/.test(url.pathname)
		) {
			const value = JSON.parse(bytes.toString());
			const items = value.batch.items;
			if (items.length >= 2) {
				items[0].status = "HOLD";
				items[1].status = "UNKNOWN";
				items.push({
					...items[1],
					itemId: "00000000-0000-4000-8000-000000000001",
					requestId: "00000000-0000-4000-8000-000000000002",
					personId: "person-1010",
					characterId: "K1010",
					name: "QA Presentation Pending",
					ordinal: 2,
					status: "PENDING",
					jobId: null,
					startedAt: null,
					finishedAt: null,
					errorCode: null,
				});
				value.batch.state = "PAUSED_UNKNOWN";
				value.batch.progress = {
					total: 3,
					settled: 1,
					hold: 1,
					failed: 0,
					cancelled: 0,
					running: 0,
					unknown: 1,
					pending: 1,
					attempted: 2,
				};
				bytes = Buffer.from(JSON.stringify(value));
			}
		}
		for (const [key, value] of response.headers)
			if (
				![
					"content-length",
					"transfer-encoding",
					"connection",
					"content-encoding",
				].includes(key)
			)
				res.setHeader(key, value);
		res.writeHead(status).end(bytes);
		requests.push({
			method: req.method ?? "GET",
			path: req.url ?? "/",
			bodySHA: hash(body),
			providerCallCount: calls,
		});
		if (requests.length > 256) requests.shift();
		emit({ type: "request-completed", path: req.url ?? "/" });
	} finally {
		active--;
	}
});
const proxyReady = once(proxy, "listening", {
	signal: AbortSignal.timeout(5000),
});
proxy.listen(port, "127.0.0.1");
await proxyReady;
const qa = proxy.address();
if (!qa || typeof qa === "string") throw Error("FIXTURE_ADDRESS");
console.log(
	`LOCAL_BROWSER_FIXTURE_READY url=http://127.0.0.1:${qa.port}/tools/ provider=http://127.0.0.1:${pa.port}/v1 root=${root} sourceSHA=${sources.map(hash).join(",")} resultSHA=${results.map(hash).join(",")}`,
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
	process.once(signal, () => {
		proxy.closeAllConnections();
		proxy.close();
		void app.close().then(() => {
			wiki.closeAllConnections();
			provider.closeAllConnections();
			wiki.close();
			provider.close();
			return rm(root, { recursive: true });
		});
	});
