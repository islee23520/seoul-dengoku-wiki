import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { EventEmitter, once } from "node:events";
import {
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	realpath,
	rm,
	writeFile,
} from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { encodePng } from "../../portrait/acceptance/src/png.ts";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import {
	importOriginals,
	openOriginalsStore,
} from "../../people-cli/src/store.ts";
import { loadConfig } from "../src/config.ts";
import { createEvaluationStore } from "../src/evaluations.ts";
import { measurePng } from "../src/png.ts";
import { createPortal } from "../src/server.ts";
import { adaptSheet, hash, sheetFromBytes } from "../src/sources.ts";

// Controlled colored silhouettes exercise pixel contracts, not generated semantics.
export async function workstationFixture(category = "hair") {
	const root = await realpath(
		await mkdtemp(join(tmpdir(), "workstation-adapter-")),
	);
	const width = 48,
		height = 64;
	const pixels = new Uint8Array(width * height * 4);
	const bounds =
		category === "fullbody-turntable"
			? [16, 4, 32, 60]
			: category.includes("torso")
				? [8, 16, 40, 48]
				: category === "hair"
					? [12, 8, 36, 24]
					: [12, 8, 36, 40];
	for (let y = bounds[1] ?? 0; y < (bounds[3] ?? 0); y++)
		for (let x = bounds[0] ?? 0; x < (bounds[2] ?? 0); x++)
			pixels.set([60, 100, 180, 255], (y * width + x) * 4);
	const png = Buffer.from(encodePng({ width, height, pixels }));
	const character = JSON.parse(
		await readFile(
			new URL(
				"../../portrait/2d/characters/iyen.json",
				import.meta.url,
			),
			"utf8",
		),
	);
	character.personId = "person-1017";
	character.faceMode = { kind: "unique", variantId: null };
	const characterBytes = Buffer.from(JSON.stringify(character));
	const style = JSON.parse(
		await readFile(
			new URL("../../portrait/2d/style-lock.json", import.meta.url),
			"utf8",
		),
	);
	style.referenceSha256 = hash(png);
	await writeFile(join(root, "character.json"), characterBytes);
	await writeFile(join(root, "style.json"), JSON.stringify(style));
	await writeFile(join(root, "identity.png"), png);
	const authoredLookBytes = Buffer.from(
		JSON.stringify({
			schemaVersion: 2,
			sourceId: "controlled-design",
			lookId: character.lookId,
			personId: character.personId,
			characterId: character.characterId,
			category,
			status: "owner-authored",
			description:
				category === "underwear-only-torso"
					? "Authored blue sleeveless undershirt design."
					: "Controlled authored category design.",
		}),
	);
	const frames = Array.from(
		{ length: category === "fullbody-turntable" ? 4 : 1 },
		(_, frameOrder) => {
			const outputSpec = {
				schemaVersion: 2,
				category,
				variant:
					category === "head-without-hair-eyes-teeth"
						? "exclude-hair-eyes-teeth"
						: category === "underwear-only-torso"
							? "authored-underwear"
							: "complete",
				view:
					category === "fullbody-turntable"
						? ["front", "profile", "side", "back"][frameOrder]
						: category === "portrait"
							? "viewer-right"
							: "front",
				frameOrder,
				format: "png",
				width,
				height,
				background: { kind: "transparent", alpha: "zero-background" },
				alignment: {
					canvasId: "controlled-canvas",
					coordinates: "pixels-top-left-x-right-y-down",
					anchor: [24, 32],
					crop: [0, 0, width, height],
				},
				featureExclusions:
					category === "head-without-hair-eyes-teeth"
						? ["hair", "eyes", "teeth"]
						: [],
			};
			return {
				outputSpec,
				outputSpecSha256: hash(Buffer.from(JSON.stringify(outputSpec))),
			};
		},
	);
	const request = {
		schemaVersion: 2,
		requestId: crypto.randomUUID(),
		connectionId: crypto.randomUUID(),
		personId: character.personId,
		providerModel: "gpt-image-2.5-sunburst",
		identityResultId: crypto.randomUUID(),
		styleReferenceSha256: hash(png),
		faceMode: character.faceMode,
		authoredLook: {
			sourceId: "controlled-design",
			lookId: character.lookId,
			sha256: hash(authoredLookBytes),
		},
		frames,
	};
	return {
		root,
		png,
		request,
		authoredLookBytes,
		source: {
			characterPath: join(root, "character.json"),
			sha256: hash(characterBytes),
			stylePath: join(root, "style.json"),
			referencePath: join(root, "identity.png"),
		},
		identity: {
			status: "sealed" as const,
			resultId: request.identityResultId,
			personId: request.personId,
			characterId: character.characterId,
			sourceSha256: hash(characterBytes),
			styleReferenceSha256: hash(png),
			faceMode: character.faceMode,
			imagePath: join(root, "identity.png"),
			imageSha256: hash(png),
		},
	};
}

const nodeKey = "NODE_BINARY";
const pathKey = "PATH";
export async function referencesFixture(
	options: {
		factory?: typeof createPortal;
		controlled?: boolean;
		keep?: boolean;
		legacyToken?: boolean;
	} = {},
) {
	const root = await realpath(
		await mkdtemp(join(tmpdir(), "task15-integration-")),
	);
	// Owned PNG fixture: full-size RGBA, transparent margins and asymmetric bands.
	const width = 1024,
		height = 1536;
	const pixels = new Uint8Array(width * height * 4);
	for (let y = 40; y < height - 40; y++)
		for (let x = 40; x < width - 40; x++) {
			const i = (y * width + x) * 4;
			pixels[i] = 80 + (Math.floor(x / 32) % 4) * 32;
			pixels[i + 1] = 40 + (Math.floor(y / 48) % 4) * 32;
			pixels[i + 2] = x < width / 2 ? 160 : 60;
			pixels[i + 3] = 255;
		}
	const image = Buffer.from(encodePng({ width, height, pixels }));
	if (
		hash(image) !==
		"38be18ede9922dd5425469c2515b9f2ae3b406d1d542a46a70ccb9e09819bf69"
	)
		throw Error("FIXTURE_IMAGE_HASH");
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
			referenceImages: refs.map((r) => ({ id: r.id, sha256: hash(r.bytes) })),
		},
	};
	const person = {
		id: options.legacyToken ? "person-1009" : "person-1017",
		characterId: options.legacyToken ? "K1009" : "K1017",
		name: "Controlled reference fixture",
		detailRoute: options.legacyToken
			? "/people/person-1009"
			: "/people/person-1017",
		familyTree: { personId: options.legacyToken ? "K1009" : "K1017" },
	};
	const detail = Buffer.from(JSON.stringify(person));
	const look = JSON.parse(
		Buffer.from(canonical.candidate.lookBytes).toString(),
	);
	for (const [slot, field, value] of [
		["hair", "description", "wine hair with left-side braid"],
		["outfit", "upper", "dark jacket with badge on anatomical left"],
		["outfit", "lower", "dark trousers"],
		["outfit", "footwear", "brown boots"],
	])
		look.slots[slot as string][field as string] = {
			value,
			status: "approved",
			source: "controlled-fixture-authored",
		};
	const token = Buffer.from(
		JSON.stringify({
			...look,
			...(options.legacyToken
				? { schemaVersion: 1, stateId: null, lookId: undefined }
				: {}),
			personId: person.id,
			characterId: person.characterId,
			name: person.name,
			identity: { characterId: person.characterId, name: person.name },
			image: { sha256: hash(image) },
			generationContract: { model: "gpt-image-2.5" },
		}),
	);
	const sheet = sheetFromBytes(detail, token, image);
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
	const storage = join(root, "storage");
	const identityResultId = randomUUID();
	const identityDir = join(storage, "1", "jobs", identityResultId);
	await mkdir(identityDir, { recursive: true, mode: 0o700 });
	const adapted = adaptSheet(sheet, template, identityResultId, {
		kind: "unique",
		variantId: null,
	});
	const identityRequest = {
		requestId: identityResultId,
		personId: person.id,
		providerModel: "gpt-image-2.5-sunburst",
		faceMode: { kind: "unique", variantId: null },
	};
	const evidence = {
		requestId: identityResultId,
		model: "gpt-image-2.5-sunburst",
		textSHA: adapted.projection.textSHA,
		renderingSHA: adapted.projection.renderingSHA,
		sourceSHA: adapted.projection.sourceSHA,
		referenceHashes: adapted.candidate.referenceImages.map((r) =>
			hash(r.bytes),
		),
	};
	const metrics = measurePng(image);
	for (const [name, bytes] of Object.entries({
		"candidate.png": image,
		"candidate.png.receipt.json": JSON.stringify({
			...evidence,
			responseSHA: hash(image),
			status: 200,
			reviewStatus: "candidate-unreviewed",
		}),
		"machine-diagnostics.json": JSON.stringify(metrics),
		"candidate.png.request.json": JSON.stringify({
			...evidence,
			prompt: adapted.projection.text,
			rendering: adapted.projection.rendering,
			referenceImages: adapted.candidate.referenceImages.map((r) =>
				Buffer.from(r.bytes).toString("base64"),
			),
		}),
		"projection.json": JSON.stringify(adapted.projection),
		"projection.txt": adapted.projection.text,
		"source-bytes.json": JSON.stringify({
			detail: detail.toString("base64"),
			token: token.toString("base64"),
			image: image.toString("base64"),
			pins: adapted.pins,
		}),
		"provenance.json": JSON.stringify(adapted.provenance),
		"request-payload.json": JSON.stringify(identityRequest),
		"job.json": JSON.stringify({
			id: identityResultId,
			state: "HOLD",
			reviewStatus: "HOLD",
			imageUrl: `/tools/api/jobs/${identityResultId}/image`,
			metrics,
			errorCode: null,
			payloadSHA: hash(Buffer.from(JSON.stringify(identityRequest))),
		}),
	}))
		await writeFile(join(identityDir, name), bytes, {
			flag: "wx",
			mode: 0o600,
		});
	await createEvaluationStore({
		ownerRoot: join(storage, "1"),
		ownerId: "1",
	}).sealResult(identityResultId);
	const calls: {
		requestId: string;
		parentRequestId: string;
		shot: string;
		references: number;
		prompt: string;
	}[] = [];
	let uncertain = false;
	const provider = createServer(async (req, res) => {
		try {
			if (
				req.url !== "/v1/images/edits" ||
				req.method !== "POST" ||
				req.headers.authorization !== "Bearer fixture-reference-key"
			)
				throw Error("ACTUAL_PROVIDER_ROUTE");
			const chunks: Buffer[] = [];
			for await (const chunk of req) chunks.push(Buffer.from(chunk));
			const form = await new Response(Buffer.concat(chunks), {
				headers: { "content-type": req.headers["content-type"] ?? "" },
			}).formData();
			if (
				form.get("model") !== "gpt-image-2.5-sunburst" ||
				form.get("n") !== "1" ||
				form.get("size") !== "1024x1536" ||
				[...form.keys()].some(
					(key) => !["model", "prompt", "size", "n", "image[]"].includes(key),
				)
			)
				throw Error("ACTUAL_PROVIDER_SHAPE");
			const prompt = String(form.get("prompt"));
			let admitted: {
				requestId: string;
				parentRequestId: string;
				shot: string;
				references: number;
				prompt: string;
			} | null = null;
			for (const id of await readdir(join(storage, "1", "jobs"))) {
				const output = join(storage, "1", "jobs", id, "references");
				let plan: { children: { shot: string; requestId: string }[] };
				try {
					plan = JSON.parse(await readFile(join(output, "plan.json"), "utf8"));
				} catch {
					continue;
				}
				for (const child of plan.children) {
					if (calls.some((call) => call.requestId === child.requestId))
						continue;
					try {
						const journal = JSON.parse(
							await readFile(
								join(output, `${child.shot}.request.json`),
								"utf8",
							),
						);
						if (
							journal.requestId !== child.requestId ||
							!prompt.endsWith(journal.prompt)
						)
							continue;
						if (
							journal.binding.identityResultId !== identityResultId ||
							journal.binding.styleReferenceSha256 !== hash(image)
						)
							throw Error("JOURNAL_IDENTITY_BINDING");
						const images = form.getAll("image[]") as File[];
						if (images.length !== journal.references.length)
							throw Error("JOURNAL_REFERENCE_COUNT");
						for (const [index, uploaded] of images.entries())
							if (
								hash(new Uint8Array(await uploaded.arrayBuffer())) !==
								journal.references[index].sha256
							)
								throw Error("MULTIPART_REFERENCE_HASH");
						admitted = {
							requestId: child.requestId,
							parentRequestId: id,
							shot: child.shot,
							references: images.length,
							prompt,
						};
					} catch (error) {
						if (
							!(
								error instanceof Error &&
								"code" in error &&
								error.code === "ENOENT"
							)
						)
							throw error;
					}
				}
			}
			if (!admitted) throw Error("CHILD_NOT_JOURNALED_BEFORE_HTTP");
			calls.push(admitted);
			res
				.writeHead(200, { "content-type": "application/json" })
				.end(
					JSON.stringify(
						uncertain
							? { data: [] }
							: { data: [{ b64_json: image.toString("base64") }] },
					),
				);
		} catch (error) {
			res.writeHead(500).end(String(error));
		}
	});
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
	for (const server of [provider, wiki]) {
		const ready = once(server, "listening", {
			signal: AbortSignal.timeout(5000),
		});
		server.listen(0, "127.0.0.1");
		await ready;
	}
	const address = (server: Server) => {
		const value = server.address();
		if (!value || typeof value === "string") throw Error("FIXTURE_ADDRESS");
		return value.port;
	};
	const config = loadConfig({
		PORTAL_MODE: "local",
		PORTAL_PORT: "0",
		PORTAL_STORAGE_PATH: storage,
		PORTAL_ORIGINALS_DB: dbPath,
		PORTAL_MAX_STORAGE_BYTES: "2000000000",
		WIKI_BASE_URL: `http://127.0.0.1:${address(wiki)}/wiki/`,
		PORTAL_PUBLIC_PATH: join(import.meta.dir, "../public"),
		PORTAL_TOKENS_PATH: join(
			import.meta.dir,
			"../../shared-web-ui/src/tokens.css",
		),
	});
	const app = await (options.factory ?? createPortal)(config, {
		template,
		controlledReferences: options.controlled ?? true,
	});
	const port = (await app.listen()).port;
	const origin = `http://127.0.0.1:${port}`;
	const sessionResponse = await fetch(`${origin}/tools/api/auth/session`);
	const session = (await sessionResponse.json()) as { csrfToken: string };
	const cookie = sessionResponse.headers.getSetCookie()[0]?.split(";")[0] ?? "";
	const headers = {
		cookie,
		origin,
		"x-csrf-token": session.csrfToken,
		"content-type": "application/json",
	};
	const connectionResponse = await fetch(`${origin}/tools/api/connections`, {
		method: "POST",
		headers,
		body: JSON.stringify({
			baseUrl: `http://127.0.0.1:${address(provider)}/v1`,
			apiKey: "fixture-reference-key",
		}),
	});
	const connected = (await connectionResponse.json()) as {
		connection: { connectionId: string };
	};
	if (!connected.connection) throw Error(JSON.stringify(connected));
	const request = (path: string, input?: unknown) =>
		fetch(`${origin}/tools/api${path}`, {
			headers,
			...(input === undefined
				? {}
				: { method: "POST", body: JSON.stringify(input) }),
		});
	const payload = (shots = ["hair"]) => ({
		requestId: randomUUID(),
		connectionId: connected.connection.connectionId,
		personId: person.id,
		providerModel: "gpt-image-2.5-sunburst",
		shots,
		identityResultId,
		styleReferenceSha256: hash(image),
		faceMode: { kind: "unique", variantId: null },
	});
	return {
		root,
		storage,
		app,
		origin,
		providerUrl: `http://127.0.0.1:${address(provider)}/v1`,
		cookie,
		headers,
		identityResultId,
		person,
		image,
		template,
		calls,
		request,
		payload,
		uncertain: () => {
			uncertain = true;
		},
		close: async () => {
			await app.close();
			for (const server of [provider, wiki]) {
				const closed = once(server, "close");
				server.closeAllConnections();
				server.close();
				await closed;
			}
			if (!options.keep) await rm(root, { recursive: true, force: true });
		},
	};
}

export async function referenceClients(
	f: Awaited<ReturnType<typeof referencesFixture>>,
	releaseDirectory = join(import.meta.dir, "../dist"),
) {
	const preload = join(f.root, "controlled.mjs");
	await writeFile(
		preload,
		`import cp from 'node:child_process';import{syncBuiltinESMExports}from'node:module';import{PassThrough}from'node:stream';import{EventEmitter}from'node:events';const original=cp.spawn;cp.spawn=(command,args,options)=>{if(command!=='cloudflared')return original(command,args,options);const c=new EventEmitter();c.stdout=new PassThrough();c.stderr=new PassThrough();queueMicrotask(()=>{c.stdout.end('controlled-access\\n');c.emit('close',0);});return c;};syncBuiltinESMExports();const network=globalThis.fetch;globalThis.fetch=(input,init)=>{const u=new URL(String(input));if(u.origin!=='https://sss.linalab.io')throw Error('outside fixture');return network(${JSON.stringify(f.origin)}+u.pathname+u.search,{...init,headers:{...Object.fromEntries(new Headers(init?.headers)),origin:${JSON.stringify(f.origin)}}});};`,
	);
	async function state(name: string) {
		const directory = join(f.root, name);
		await mkdir(directory, { mode: 0o700 });
		await writeFile(
			join(directory, "session.json"),
			JSON.stringify({
				server: "https://sss.linalab.io/tools/",
				cookie: f.cookie,
				csrfToken: f.headers["x-csrf-token"],
				connection: { connectionId: f.payload().connectionId, state: "READY" },
			}),
			{ mode: 0o600 },
		);
		return directory;
	}
	const cliState = await state("cli-state"),
		mcpState = await state("mcp-state");
	const launch = (file: string, args: string[], directory: string) =>
		spawn(
			process.env[nodeKey] ?? "node",
			["--import", preload, join(releaseDirectory, `${file}.mjs`), ...args],
			{
				cwd: f.root,
				env: {
					PATH: process.env[pathKey],
					SSSTOOL_SERVER_URL: "https://sss.linalab.io/tools/",
					SSSTOOL_STATE_DIRECTORY: directory,
				},
				stdio: ["pipe", "pipe", "pipe"],
			},
		);
	const cli = async (args: string[]) => {
		const child = launch("cli", args, cliState);
		const exited = once(child, "exit", { signal: AbortSignal.timeout(20000) });
		let stdout = "",
			stderr = "";
		child.stdout.on("data", (c) => {
			stdout += c;
		});
		child.stderr.on("data", (c) => {
			stderr += c;
		});
		const [code] = await exited;
		return { code, stderr, report: JSON.parse(stdout) };
	};
	const child = launch("mcp", [], mcpState);
	const exited = once(child, "exit", { signal: AbortSignal.timeout(60000) });
	const events = new EventEmitter();
	let serial = 0;
	createInterface({ input: child.stdout }).on("line", (line) => {
		const value = JSON.parse(line);
		events.emit(String(value.id), value);
	});
	const rpc = async (method: string, params: unknown = {}) => {
		const id = ++serial;
		const answer = once(events, String(id), {
			signal: AbortSignal.timeout(20000),
		});
		child.stdin.write(
			`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`,
		);
		return (await answer)[0];
	};
	await rpc("initialize", {
		protocolVersion: "2025-11-25",
		capabilities: {},
		clientInfo: { name: "reference-fixture", version: "1" },
	});
	child.stdin.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');
	return {
		cli,
		rpc,
		call: async (name: string, input: unknown) =>
			(await rpc("tools/call", { name, arguments: input })).result
				.structuredContent,
		close: async () => {
			child.stdin.end();
			return (await exited)[0];
		},
	};
}
