import { afterEach, expect, spyOn, test } from "bun:test";
import { createHash, randomUUID } from "node:crypto";
import { once } from "node:events";
import {
	mkdir,
	mkdtemp,
	open,
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
import { dirname, join } from "node:path";
import { encodePng } from "../../portrait/acceptance/src/png.ts";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import {
	importOriginals,
	openOriginalsStore,
} from "../../people-cli/src/store.ts";
import {
	ALPHA_PROCESSOR_V1,
	alphaDerivative,
} from "../src/alpha-derivative.ts";
import { createAuth } from "../src/auth.ts";
import {
	batchSchema,
	resolveBatchBinding,
	snapshotSchema,
} from "../src/batches.ts";
import { loadConfig } from "../src/config.ts";
import {
	createEvaluationStore,
	type ResultBinding,
} from "../src/evaluations.ts";
import { measurePng } from "../src/png.ts";
import { portraitOutput } from "../src/portrait-size.ts";
import { createPortal } from "../src/server.ts";
import { png } from "./backend.test.ts";
import { connectOwned, mcpFixture, portraitReply } from "./mcp-fixture.ts";

const roots: string[] = [];
afterEach(async () => {
	await Promise.all(
		roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
	);
});
const sha = (bytes: string | Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
const categories = () =>
	Object.fromEntries(
		[
			"identity-and-face",
			"anatomy-and-pose",
			"framing-and-composition",
			"technique-and-style",
			"transparency-and-edges",
			"authored-conditions",
		].map((name) => [name, { judgement: "pass", notes: "" }]),
	);
function review(result: ResultBinding, expectedRevision = 0) {
	return {
		evaluationId: randomUUID(),
		expectedRevision,
		pngSHA: result.pngSHA,
		receiptSHA: result.receiptSHA,
		machineMetricsSHA: result.machineEvidence.metricsSHA,
		verdict: "pass",
		categories: categories(),
		notes: "Owner review only",
	};
}
async function fixture() {
	const root = await realpath(
		await mkdtemp(join(tmpdir(), "portal-evaluations-")),
	);
	roots.push(root);
	const ownerRoot = join(root, "42");
	const requestId = randomUUID();
	const directory = join(ownerRoot, "jobs", requestId);
	await mkdir(directory, { recursive: true, mode: 0o700 });
	const pixels = new Uint8Array(64);
	pixels[3] = 255;
	const png = encodePng({ width: 4, height: 4, pixels });
	const originals = {
		detail: Buffer.from(
			JSON.stringify({
				id: "person-1003",
				name: "Captured fixture",
				detailRoute: "/people/person-1003",
				familyTree: { personId: "K1003" },
			}),
		),
		token: Buffer.from(
			JSON.stringify({
				personId: "person-1003",
				characterId: "K1003",
				name: "Captured fixture",
				image: { sha256: sha(png) },
				generationContract: {},
				slots: {},
			}),
		),
		image: png,
	};
	const hashes = Object.fromEntries(
		Object.entries(originals).map(([key, value]) => [key, sha(value)]),
	);
	const evidence = {
		requestId,
		model: "gpt-image-2.5-sunburst",
		textSHA: sha("projection"),
		renderingSHA: sha(JSON.stringify({ portrait: "fixture" })),
		sourceSHA: sha("look"),
		referenceHashes: [sha(png)],
	};
	const metrics = measurePng(png);
	const artifacts: Record<string, string | Uint8Array> = {
		"candidate.png": png,
		"candidate.png.receipt.json": `${JSON.stringify({ ...evidence, responseSHA: sha(png), status: 200, reviewStatus: "candidate-unreviewed" }, null, 2)}\n`,
		"machine-diagnostics.json": JSON.stringify(metrics),
		"candidate.png.request.json": JSON.stringify(evidence),
		"projection.json": JSON.stringify({
			text: "projection",
			rendering: { portrait: "fixture" },
			...evidence,
		}),
		"projection.txt": "projection",
		"source-bytes.json": JSON.stringify({
			...Object.fromEntries(
				Object.entries(originals).map(([key, value]) => [
					key,
					Buffer.from(value).toString("base64"),
				]),
			),
			pins: { lookSHA: sha("look") },
		}),
		"provenance.json": JSON.stringify({
			requestId,
			original: hashes,
			derivedLookSHA: sha("look"),
		}),
		"job.json": JSON.stringify({
			id: requestId,
			state: "HOLD",
			reviewStatus: "HOLD",
			imageUrl: `/tools/api/jobs/${requestId}/image`,
			metrics,
			errorCode: null,
			payloadSHA: sha("payload"),
		}),
	};
	for (const [name, bytes] of Object.entries(artifacts))
		await writeFile(join(directory, name), bytes, { flag: "wx", mode: 0o600 });
	const store = createEvaluationStore({ ownerRoot, ownerId: "42" });
	return { root, ownerRoot, requestId, directory, artifacts, store };
}

test("alpha derivative is explicit, parent-bound, owner-isolated and tamper-evident", async () => {
	const f = await fixture();
	const pixels = new Uint8Array(1024 * 1536 * 4);
	for (let y = 0; y < 1536; y++)
		for (let x = 0; x < 1024; x++) {
			const i = (y * 1024 + x) * 4;
			const background = y < 120 || x < 200 || x > 824;
			pixels.set(background ? [174, 174, 174, 255] : [80, 40, 30, 255], i);
		}
	const source = encodePng({ width: 1024, height: 1536, pixels });
	const canonical = Buffer.from(
		JSON.stringify({
			...JSON.parse(String(f.artifacts["candidate.png.receipt.json"])),
			responseSHA: sha(source),
		}),
	);
	const output = portraitOutput(source, canonical);
	const metrics = measurePng(output.bytes);
	for (const [name, value] of Object.entries({
		"candidate.png": output.bytes,
		"candidate.png.receipt.json": output.receiptBytes,
		"provider-source.png": source,
		"provider-canonical.receipt.json": canonical,
		"machine-diagnostics.json": JSON.stringify(metrics),
		"job.json": JSON.stringify({
			...JSON.parse(String(f.artifacts["job.json"])),
			metrics,
		}),
	}))
		await writeFile(join(f.directory, name), value);
	const parent = await f.store.sealResult(f.requestId);
	const binding = {
		pngSHA: parent.pngSHA,
		receiptSHA: parent.receiptSHA,
		snapshotSHA: parent.snapshotSHA,
		machineMetricsSHA: parent.machineEvidence.metricsSHA,
	};
	const before = await Promise.all(
		(await readdir(f.directory)).map(
			async (name) =>
				[name, sha(await readFile(join(f.directory, name)))] as const,
		),
	);
	expect(await f.store.alphaDerivative(f.requestId)).toBeNull();
	const legacyDir = join(f.ownerRoot, "alpha-derivatives", f.requestId);
	await mkdir(legacyDir, { recursive: true });
	const legacyPng = alphaDerivative(source, ALPHA_PROCESSOR_V1);
	const legacyReceipt = JSON.stringify({
		schema: "portal-alpha-derivative.v1",
		derivativeId: randomUUID(),
		ownerId: "42",
		jobId: f.requestId,
		parent: binding,
		nativeSHA: sha(source),
		pngSHA: sha(legacyPng),
		createdAt: new Date().toISOString(),
		processor: ALPHA_PROCESSOR_V1,
		width: 340,
		height: 510,
		reviewStatus: "HOLD",
		approval: "NONE",
		quality: "OWNER_REVIEW_REQUIRED",
	});
	await writeFile(join(legacyDir, "image.png"), legacyPng);
	await writeFile(join(legacyDir, "receipt.json"), legacyReceipt);
	expect(
		(await f.store.alphaDerivative(f.requestId))?.derivative.processor,
	).toBe(ALPHA_PROCESSOR_V1);
	await expect(
		f.store.alphaDerivative(f.requestId, {
			...binding,
			pngSHA: "0".repeat(64),
		}),
	).rejects.toThrow("RESULT_EVIDENCE_MISMATCH");
	const created = await f.store.alphaDerivative(f.requestId, binding);
	expect(await readFile(join(legacyDir, "image.png"))).toEqual(
		Buffer.from(legacyPng),
	);
	expect(await readFile(join(legacyDir, "receipt.json"), "utf8")).toBe(
		legacyReceipt,
	);
	expect(created?.derivative.processor).not.toBe(ALPHA_PROCESSOR_V1);
	expect(created?.derivative.pngSHA).not.toBe(parent.pngSHA);
	expect(created?.derivative.approval).toBe("NONE");
	expect(created?.derivative.metrics.transparentFraction).toBeGreaterThan(0);
	expect(created?.derivative.width).toBe(340);
	expect(created?.derivative.height).toBe(510);
	expect(
		(await f.store.alphaDerivative(f.requestId, binding))?.derivative,
	).toEqual(created?.derivative);
	for (const [name, digest] of before)
		expect(sha(await readFile(join(f.directory, name as string)))).toEqual(
			digest,
		);
	const otherRoot = join(f.root, "99");
	await mkdir(otherRoot);
	await expect(
		createEvaluationStore({
			ownerRoot: otherRoot,
			ownerId: "99",
		}).alphaDerivative(f.requestId, binding),
	).rejects.toThrow("NOT_FOUND");
	await expect(f.store.alphaDerivative("../bad", binding)).rejects.toThrow(
		"INVALID_INPUT",
	);
	await writeFile(
		join(f.ownerRoot, "alpha-derivatives", `${f.requestId}.v2`, "image.png"),
		source,
	);
	await expect(f.store.alphaDerivative(f.requestId)).rejects.toThrow(
		"RESULT_EVIDENCE_MISMATCH",
	);
	await writeFile(join(f.directory, "provider-source.png"), output.bytes);
	await expect(f.store.alphaDerivative(f.requestId, binding)).rejects.toThrow(
		"RESULT_EVIDENCE_MISMATCH",
	);
});

test("canonical canvas declaration rejects a noncanonical retained result before sealing", async () => {
	const f = await fixture();
	await writeFile(
		join(f.directory, "request-payload.json"),
		JSON.stringify({ size: "1024x1536" }),
	);
	await expect(f.store.sealResult(f.requestId)).rejects.toThrow(
		"RESULT_EVIDENCE_MISMATCH",
	);
});

test.each(["1024x1536", "340x510"])(
	"retained %s result verifies exact dimensions and transformation integrity",
	async (size) => {
		const f = await fixture();
		const source = encodePng({
			width: 1024,
			height: 1536,
			pixels: new Uint8Array(1024 * 1536 * 4),
		});
		const canonical = Buffer.from(
			JSON.stringify({
				...JSON.parse(String(f.artifacts["candidate.png.receipt.json"])),
				responseSHA: sha(source),
			}),
		);
		const output = portraitOutput(source, canonical);
		const candidate = size === "340x510" ? output.bytes : source;
		const receipt = size === "340x510" ? output.receiptBytes : canonical;
		const metrics = measurePng(candidate);
		for (const [name, value] of Object.entries({
			"candidate.png": candidate,
			"candidate.png.receipt.json": receipt,
			"provider-source.png": source,
			"provider-canonical.receipt.json": canonical,
			"request-payload.json": JSON.stringify({ size }),
			"candidate.png.request.json": JSON.stringify({
				...JSON.parse(String(f.artifacts["candidate.png.request.json"])),
				size,
			}),
			"machine-diagnostics.json": JSON.stringify(metrics),
			"job.json": JSON.stringify({
				...JSON.parse(String(f.artifacts["job.json"])),
				metrics,
			}),
		}))
			await writeFile(join(f.directory, name), value);
		const result = await f.store.sealResult(f.requestId);
		expect(result.size).toBe(size);
		expect((await f.store.readResult(f.requestId)).pngSHA).toBe(sha(candidate));
		if (size === "340x510") {
			await writeFile(
				join(f.directory, "provider-source.png"),
				source.subarray(1),
			);
			await expect(f.store.readResult(f.requestId)).rejects.toThrow(
				"RESULT_EVIDENCE_MISMATCH",
			);
		} else {
			await writeFile(
				join(f.directory, "request-payload.json"),
				JSON.stringify({ size: "340x510" }),
			);
			await expect(f.store.readResult(f.requestId)).rejects.toThrow(
				"RESULT_EVIDENCE_MISMATCH",
			);
		}
	},
);

test("token-only retained generation requires matching null image provenance", async () => {
	const f = await fixture();
	const sources = JSON.parse(String(f.artifacts["source-bytes.json"]));
	const provenance = JSON.parse(String(f.artifacts["provenance.json"]));
	const canonical = createTransportFixture();
	const token = Buffer.from(
		JSON.stringify({
			...JSON.parse(Buffer.from(canonical.candidate.lookBytes).toString()),
			personId: "person-1003",
			characterId: "K1003",
			name: "Captured fixture",
			identity: { characterId: "K1003", name: "Captured fixture" },
		}),
	);
	sources.token = token.toString("base64");
	provenance.original.token = sha(token);
	await writeFile(
		join(f.directory, "source-bytes.json"),
		JSON.stringify({ ...sources, image: null }),
	);
	await expect(f.store.sealResult(f.requestId)).rejects.toThrow(
		"SOURCE_SNAPSHOT_MISMATCH",
	);
	await writeFile(
		join(f.directory, "provenance.json"),
		JSON.stringify({
			...provenance,
			original: { ...provenance.original, image: null },
		}),
	);
	await f.store.sealResult(f.requestId);
	expect(await f.store.readCapturedSource(f.requestId)).toMatchObject({
		imageSHA: null,
		imageBase64: null,
		identity: {
			personId: "person-1003",
			characterId: "K1003",
			name: "Captured fixture",
		},
	});
});

test.each(["1024x1536", "1536x1024"])(
	"effective canvas %s rejects a noncanonical result with an omitted-size original",
	async (size) => {
		const f = await fixture();
		await writeFile(
			join(f.directory, "request-payload.json"),
			JSON.stringify({ requestId: f.requestId }),
		);
		await writeFile(
			join(f.directory, "candidate.png.request.json"),
			JSON.stringify({
				...JSON.parse(String(f.artifacts["candidate.png.request.json"])),
				size,
			}),
		);
		await expect(f.store.sealResult(f.requestId)).rejects.toThrow(
			"RESULT_EVIDENCE_MISMATCH",
		);
	},
);

async function batchFixture() {
	const root = await realpath(
		await mkdtemp(join(tmpdir(), "portal-evaluation-batch-")),
	);
	roots.push(root);
	const canonical = createTransportFixture();
	const image = png();
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
			store: createEvaluationStore({ ownerRoot, ownerId: "42" }),
		};
	} finally {
		await app.close();
		await bridge.close();
		await new Promise<void>((resolve) => {
			wiki.close(() => resolve());
			wiki.closeAllConnections();
		});
	}
}

test("captured source requires a seal and returns exact retained single and batch identity", async () => {
	for (const f of [await fixture(), await batchFixture()]) {
		await expect(f.store.readCapturedSource(f.requestId)).rejects.toThrow(
			"RESULT_NOT_AVAILABLE",
		);
		expect(await readdir(f.directory)).not.toContain("result.json");
		const result = await f.store.sealResult(f.requestId);
		const sealed = await readFile(join(f.directory, "result.json"));
		const original = JSON.parse(
			await readFile(join(f.directory, "source-bytes.json"), "utf8"),
		);
		const source = await f.store.readCapturedSource(f.requestId);
		expect(source).toEqual({
			schema: "portal-captured-source.v1",
			ownerId: "42",
			jobId: f.requestId,
			batchId: result.batchId,
			itemId: result.itemId,
			snapshotSHA: result.snapshotSHA,
			imageSHA: sha(Buffer.from(original.image, "base64")),
			imageBase64: original.image,
			identity: {
				personId: "person-1003",
				characterId: "K1003",
				name: "artifacts" in f ? "Captured fixture" : "Fixture 1003",
			},
		});
		expect(await readFile(join(f.directory, "result.json"))).toEqual(sealed);
		await writeFile(
			join(f.directory, "source-bytes.json"),
			JSON.stringify({
				...original,
				detail: Buffer.from("tamper").toString("base64"),
			}),
		);
		await expect(f.store.readCapturedSource(f.requestId)).rejects.toThrow(
			"SOURCE_SNAPSHOT_MISMATCH",
		);
	}
});

test("captured source rejects invalid accepted-source identity even with consistent hashes", async () => {
	const f = await fixture();
	const source = JSON.parse(String(f.artifacts["source-bytes.json"]));
	const provenance = JSON.parse(String(f.artifacts["provenance.json"]));
	const detail = Buffer.from(
		JSON.stringify({
			...JSON.parse(Buffer.from(source.detail, "base64").toString()),
			name: "Wrong identity",
		}),
	);
	source.detail = detail.toString("base64");
	provenance.original.detail = sha(detail);
	await writeFile(
		join(f.directory, "source-bytes.json"),
		JSON.stringify(source),
	);
	await writeFile(
		join(f.directory, "provenance.json"),
		JSON.stringify(provenance),
	);
	await f.store.sealResult(f.requestId);
	await expect(f.store.readCapturedSource(f.requestId)).rejects.toThrow(
		"SOURCE_SNAPSHOT_MISMATCH",
	);
});

test("HTTP batch rejects consistent job source replacement before first sealing", async () => {
	const f = await batchFixture();
	const sourcePath = join(f.directory, "source-bytes.json"),
		provenancePath = join(f.directory, "provenance.json");
	const source = JSON.parse(await readFile(sourcePath, "utf8")),
		provenance = JSON.parse(await readFile(provenancePath, "utf8"));
	for (const role of ["detail", "token"] as const) {
		const replacement = Buffer.from(`replacement ${role}`);
		source[role] = replacement.toString("base64");
		provenance.original[role] = sha(replacement);
	}
	await writeFile(sourcePath, JSON.stringify(source));
	await writeFile(provenancePath, `${JSON.stringify(provenance)}\n`);
	expect(sha(await readFile(f.snapshotPath))).toBe(sha(f.snapshotBytes));
	await expect(f.store.sealResult(f.requestId)).rejects.toThrow(
		"SOURCE_SNAPSHOT_MISMATCH",
	);
	expect(await readdir(f.directory)).not.toContain("result.json");
});

test("HTTP batch binds exact provenance, pins, projection, text and references at seal, read and append", async () => {
	for (const sealed of [false, true]) {
		const f = await batchFixture();
		const originals = Object.fromEntries(
			await Promise.all(
				(await readdir(f.directory)).map(
					async (name) =>
						[name, await readFile(join(f.directory, name))] as const,
				),
			),
		);
		const result = sealed ? await f.store.sealResult(f.requestId) : null;
		const request = JSON.parse(
			(originals["candidate.png.request.json"] ?? Buffer.alloc(0)).toString(),
		);
		const source = JSON.parse(
			(originals["source-bytes.json"] ?? Buffer.alloc(0)).toString(),
		);
		const changes: [string, string][] = [
			[
				"source-bytes.json",
				JSON.stringify({
					...source,
					pins: { ...source.pins, ruleSHA: sha("different rule") },
				}),
			],
			[
				"provenance.json",
				`${(originals["provenance.json"] ?? Buffer.alloc(0)).toString()} `,
			],
			[
				"projection.json",
				`${(originals["projection.json"] ?? Buffer.alloc(0)).toString()} `,
			],
			[
				"candidate.png.request.json",
				JSON.stringify({ ...request, prompt: "different text" }),
			],
			[
				"candidate.png.request.json",
				JSON.stringify({ ...request, rendering: {} }),
			],
			[
				"candidate.png.request.json",
				JSON.stringify({
					...request,
					referenceImages: request.referenceImages.map(() =>
						Buffer.from("different image").toString("base64"),
					),
				}),
			],
		];
		for (const [name, changed] of changes) {
			await writeFile(join(f.directory, name), changed);
			await expect(f.store.sealResult(f.requestId)).rejects.toThrow(
				"SOURCE_SNAPSHOT_MISMATCH",
			);
			if (result) {
				await expect(f.store.readCapturedSource(f.requestId)).rejects.toThrow(
					"SOURCE_SNAPSHOT_MISMATCH",
				);
				await expect(f.store.readResult(f.requestId)).rejects.toThrow(
					"SOURCE_SNAPSHOT_MISMATCH",
				);
				await expect(
					f.store.appendEvaluation(f.requestId, review(result)),
				).rejects.toThrow("SOURCE_SNAPSHOT_MISMATCH");
			}
			await writeFile(
				join(f.directory, name),
				originals[name] ?? Buffer.alloc(0),
			);
		}
		if (!sealed) {
			const changedHashes = request.referenceHashes.map(() =>
				sha("different reference"),
			);
			const receipt = JSON.parse(
				(originals["candidate.png.receipt.json"] ?? Buffer.alloc(0)).toString(),
			);
			await writeFile(
				join(f.directory, "candidate.png.request.json"),
				JSON.stringify({ ...request, referenceHashes: changedHashes }),
			);
			await writeFile(
				join(f.directory, "candidate.png.receipt.json"),
				JSON.stringify({ ...receipt, referenceHashes: changedHashes }),
			);
			await expect(f.store.sealResult(f.requestId)).rejects.toThrow(
				"SOURCE_SNAPSHOT_MISMATCH",
			);
			for (const name of [
				"candidate.png.request.json",
				"candidate.png.receipt.json",
			])
				await writeFile(
					join(f.directory, name),
					originals[name] ?? Buffer.alloc(0),
				);
		}
		const valid = result ?? (await f.store.sealResult(f.requestId));
		await f.store.appendEvaluation(f.requestId, review(valid));
		expect(await f.store.readResult(f.requestId)).toMatchObject({
			reviewStatus: "HOLD",
			approval: "NONE",
			machineEvidence: { metrics: { mechanicalStatus: "NOT_RUN" } },
		});
		expect(sha(await readFile(f.snapshotPath))).toBe(sha(f.snapshotBytes));
		for (const [name, bytes] of Object.entries(originals))
			expect(sha(await readFile(join(f.directory, name)))).toBe(sha(bytes));
	}
});

test("seals exact bytes and keeps production HOLD and machine NOT_RUN after user pass", async () => {
	const f = await fixture();
	const result = await f.store.sealResult(f.requestId);
	expect(result.pngSHA).toBe(sha(f.artifacts["candidate.png"] ?? ""));
	expect(result.receiptSHA).toBe(
		sha(f.artifacts["candidate.png.receipt.json"] ?? ""),
	);
	expect(result.machineEvidence.metricsSHA).toBe(
		sha(f.artifacts["machine-diagnostics.json"] ?? ""),
	);
	expect(result.batchId).toBeNull();
	const appended = await f.store.appendEvaluation(f.requestId, review(result));
	expect(appended.created).toBe(true);
	expect(appended.evaluation).toMatchObject({
		reviewerId: "42",
		revision: 1,
		previousRevision: 0,
		verdict: "pass",
		approval: "NONE",
	});
	expect(Number.isNaN(Date.parse(appended.evaluation.reviewedAt))).toBe(false);
	expect(await f.store.readResult(f.requestId)).toMatchObject({
		reviewStatus: "HOLD",
		approval: "NONE",
		machineEvidence: {
			metrics: { mechanicalStatus: "NOT_RUN", reviewStatus: "HOLD" },
		},
	});
	for (const [name, bytes] of Object.entries(f.artifacts))
		expect(sha(await readFile(join(f.directory, name)))).toBe(sha(bytes));
	expect((await stat(join(f.directory, "result.json"))).mode & 0o777).toBe(
		0o600,
	);
});

test("checks exact changed PNG, receipt and machine bytes before append and replay", async () => {
	for (const [name, code] of [
		["candidate.png", "RESULT_HASH_MISMATCH"],
		["candidate.png.receipt.json", "RESULT_EVIDENCE_MISMATCH"],
		["machine-diagnostics.json", "RESULT_EVIDENCE_MISMATCH"],
	]) {
		if (!name || !code) throw Error("fixture");
		const f = await fixture();
		const result = await f.store.sealResult(f.requestId);
		const input = review(result);
		await f.store.appendEvaluation(f.requestId, input);
		await writeFile(
			join(f.directory, name),
			Buffer.concat([Buffer.from(f.artifacts[name] ?? ""), Buffer.from(" ")]),
		);
		await expect(f.store.appendEvaluation(f.requestId, input)).rejects.toThrow(
			code,
		);
		await expect(
			f.store.appendEvaluation(f.requestId, review(result, 1)),
		).rejects.toThrow(code);
		await expect(f.store.readResult(f.requestId)).rejects.toThrow(code);
		expect(await readdir(join(f.directory, "evaluations"))).toHaveLength(1);
	}
});

test("missing evidence, non-HOLD jobs and forged machine PASS are not sealable", async () => {
	for (const kind of ["missing", "RUNNING", "FAILED", "UNKNOWN", "PASS"]) {
		const f = await fixture();
		if (kind === "missing")
			await rm(join(f.directory, "candidate.png.receipt.json"));
		else if (kind === "PASS")
			await writeFile(
				join(f.directory, "machine-diagnostics.json"),
				JSON.stringify({
					...measurePng(f.artifacts["candidate.png"] as Uint8Array),
					mechanicalStatus: "PASS",
				}),
			);
		else
			await writeFile(
				join(f.directory, "job.json"),
				JSON.stringify({
					...JSON.parse(String(f.artifacts["job.json"])),
					state: kind,
				}),
			);
		await expect(f.store.sealResult(f.requestId)).rejects.toThrow(
			kind === "PASS" ? "RESULT_EVIDENCE_MISMATCH" : "RESULT_NOT_AVAILABLE",
		);
		expect(await readdir(f.directory)).not.toContain("result.json");
	}
});

test("foreign owners, owner-root mismatch and symlink jobs cannot access private evidence", async () => {
	const f = await fixture();
	await f.store.sealResult(f.requestId);
	const foreignRoot = join(f.root, "84");
	await mkdir(join(foreignRoot, "jobs"), { recursive: true });
	const foreign = createEvaluationStore({
		ownerRoot: foreignRoot,
		ownerId: "84",
	});
	await expect(foreign.readResult(f.requestId)).rejects.toThrow("NOT_FOUND");
	await expect(foreign.readCapturedSource(f.requestId)).rejects.toThrow(
		"NOT_FOUND",
	);
	await expect(foreign.appendEvaluation(f.requestId, {})).rejects.toThrow(
		"NOT_FOUND",
	);
	expect(() =>
		createEvaluationStore({ ownerRoot: f.ownerRoot, ownerId: "84" }),
	).toThrow("INVALID_PATH");
	await symlink(f.directory, join(foreignRoot, "jobs", f.requestId));
	await expect(foreign.readResult(f.requestId)).rejects.toThrow("INVALID_PATH");
	await expect(foreign.readCapturedSource(f.requestId)).rejects.toThrow(
		"INVALID_PATH",
	);
});

test("CAS competitors start at a Promise barrier and only one revision wins across stores", async () => {
	const f = await fixture();
	const result = await f.store.sealResult(f.requestId);
	const other = createEvaluationStore({
		ownerRoot: f.ownerRoot,
		ownerId: "42",
	});
	const barrier = Promise.withResolvers<void>();
	const writes = [f.store, other].map(async (store) => {
		await barrier.promise;
		return store.appendEvaluation(f.requestId, review(result));
	});
	barrier.resolve();
	const outcomes = await Promise.allSettled(writes);
	expect(
		outcomes.filter((outcome) => outcome.status === "fulfilled"),
	).toHaveLength(1);
	const rejected = outcomes.find((outcome) => outcome.status === "rejected");
	if (rejected?.status !== "rejected") throw Error("missing rejection");
	expect(rejected.reason.message).toBe("EVALUATION_REVISION_CONFLICT");
	expect((await f.store.readEvaluations(f.requestId)).history).toHaveLength(1);
});

test("idempotency precedes CAS, rejects changed payload, and history survives store restart", async () => {
	const f = await fixture();
	const result = await f.store.sealResult(f.requestId);
	const first = review(result);
	const one = await f.store.appendEvaluation(f.requestId, first);
	const two = await f.store.appendEvaluation(f.requestId, review(result, 1));
	const restarted = createEvaluationStore({
		ownerRoot: f.ownerRoot,
		ownerId: "42",
	});
	expect(await restarted.appendEvaluation(f.requestId, first)).toEqual({
		created: false,
		evaluation: one.evaluation,
	});
	await expect(
		restarted.appendEvaluation(f.requestId, { ...first, notes: "changed" }),
	).rejects.toThrow("REQUEST_CONFLICT");
	await expect(
		restarted.appendEvaluation(f.requestId, { ...first, expectedRevision: 1 }),
	).rejects.toThrow("REQUEST_CONFLICT");
	expect(await restarted.readEvaluations(f.requestId)).toMatchObject({
		latest: two.evaluation,
		history: [one.evaluation, two.evaluation],
	});
});

test("strict review fields, hashes, bounds and category consistency reject forged authority", async () => {
	const f = await fixture();
	const result = await f.store.sealResult(f.requestId);
	for (const extra of [
		{ reviewerId: "84" },
		{ ownerId: "84" },
		{ reviewedAt: "yesterday" },
		{ revision: 7 },
		{ approval: "PASS" },
		{ metrics: {} },
		{ image: "replacement" },
	])
		await expect(
			f.store.appendEvaluation(f.requestId, { ...review(result), ...extra }),
		).rejects.toThrow("INVALID_INPUT");
	for (const changed of [
		{ notes: "x".repeat(8001) },
		{ categories: {} },
		{ verdict: "hold" },
		{ expectedRevision: -1 },
	])
		await expect(
			f.store.appendEvaluation(f.requestId, { ...review(result), ...changed }),
		).rejects.toThrow("INVALID_INPUT");
	await expect(
		f.store.appendEvaluation(f.requestId, {
			...review(result),
			pngSHA: "a".repeat(64),
		}),
	).rejects.toThrow("RESULT_HASH_MISMATCH");
	await expect(
		f.store.appendEvaluation(f.requestId, {
			...review(result),
			receiptSHA: "a".repeat(64),
		}),
	).rejects.toThrow("RESULT_EVIDENCE_MISMATCH");
	await expect(
		f.store.appendEvaluation(f.requestId, {
			...review(result),
			machineMetricsSHA: "a".repeat(64),
		}),
	).rejects.toThrow("RESULT_EVIDENCE_MISMATCH");
	const needs = review(result);
	needs.verdict = "needs-change";
	needs.categories["identity-and-face"] = {
		judgement: "needs-change",
		notes: "Face differs",
	};
	expect(
		(await f.store.appendEvaluation(f.requestId, needs)).evaluation.verdict,
	).toBe("needs-change");
});

test("sealed source evidence cannot silently change or be resealed", async () => {
	const f = await fixture();
	const result = await f.store.sealResult(f.requestId);
	await writeFile(join(f.directory, "source-bytes.json"), "changed source");
	await expect(f.store.sealResult(f.requestId)).rejects.toThrow(
		"SOURCE_SNAPSHOT_MISMATCH",
	);
	await expect(
		f.store.appendEvaluation(f.requestId, review(result)),
	).rejects.toThrow("SOURCE_SNAPSHOT_MISMATCH");
});

test("concurrent identical writes commit once and history is readable in a fresh process", async () => {
	const f = await fixture();
	const result = await f.store.sealResult(f.requestId);
	const input = review(result);
	const barrier = Promise.withResolvers<void>();
	const attempts = Array.from({ length: 3 }, async () => {
		await barrier.promise;
		return f.store.appendEvaluation(f.requestId, input);
	});
	barrier.resolve();
	const writes = await Promise.all(attempts);
	expect(writes.filter((write) => write.created)).toHaveLength(1);
	expect(
		new Set(writes.map((write) => JSON.stringify(write.evaluation))).size,
	).toBe(1);
	const process = Bun.spawn(
		[
			"bun",
			"--eval",
			'const {createEvaluationStore}=await import("./src/evaluations.ts"); const s=createEvaluationStore({ownerRoot:process.env["EVALUATION_OWNER_ROOT"],ownerId:"42"}); console.log(JSON.stringify(await s.readEvaluations(process.env["EVALUATION_REQUEST_ID"])));',
		],
		{
			cwd: dirname(import.meta.dir),
			env: {
				...Bun.env,
				EVALUATION_OWNER_ROOT: f.ownerRoot,
				EVALUATION_REQUEST_ID: f.requestId,
			},
			stdout: "pipe",
			stderr: "pipe",
		},
	);
	const output = await new Response(process.stdout).text();
	const errors = await new Response(process.stderr).text();
	expect({ code: await process.exited, errors }).toEqual({
		code: 0,
		errors: "",
	});
	expect(JSON.parse(output)).toMatchObject({
		latest: writes[0]?.evaluation,
		history: [writes[0]?.evaluation],
	});
});

test("producer resolver verifies exact durable membership and snapshot artifacts on every call", async () => {
	const f = await batchFixture();
	const {
		batchId,
		itemId,
		batchDir,
		batchPath,
		batch,
		snapshotPath,
		snapshotBytes,
	} = f;
	const snapshotSHA = sha(snapshotBytes),
		files = f.snapshot.files;
	const store = createEvaluationStore({
		ownerRoot: f.ownerRoot,
		ownerId: "42",
	});
	const result = await store.sealResult(f.requestId);
	expect(result).toMatchObject({ batchId, itemId, snapshotSHA });
	expect(
		(await store.appendEvaluation(f.requestId, review(result))).evaluation,
	).toMatchObject({ batchId, itemId, snapshotSHA });
	for (const changed of [
		{ ownerId: "84", requestId: f.requestId, itemId },
		{ ownerId: "42", requestId: randomUUID(), itemId },
		{ ownerId: "42", requestId: f.requestId, itemId: randomUUID() },
	]) {
		await writeFile(
			batchPath,
			JSON.stringify({
				...batch,
				ownerId: changed.ownerId,
				items: batch.items.map((item) => ({
					...item,
					requestId: changed.requestId,
					itemId: changed.itemId,
				})),
			}),
		);
		await expect(
			store.appendEvaluation(f.requestId, review(result, 1)),
		).rejects.toThrow("SOURCE_SNAPSHOT_MISMATCH");
	}
	await writeFile(batchPath, JSON.stringify(batch));
	await writeFile(snapshotPath, "changed");
	await expect(
		store.appendEvaluation(f.requestId, review(result, 1)),
	).rejects.toThrow("SOURCE_SNAPSHOT_MISMATCH");
	await writeFile(snapshotPath, snapshotBytes);
	await writeFile(
		join(batchDir, "artifacts", `${files.image}.bin`),
		"tampered exact retained image",
	);
	await expect(
		store.appendEvaluation(f.requestId, review(result, 1)),
	).rejects.toThrow("SOURCE_SNAPSHOT_MISMATCH");
});

test("present invalid producer pointer fails closed while only an existing single resolves null", async () => {
	const f = await fixture();
	const options = { ownerRoot: f.ownerRoot, ownerId: "42" };
	expect(await resolveBatchBinding(options, f.requestId)).toBeNull();
	await expect(resolveBatchBinding(options, randomUUID())).rejects.toThrow();
	await writeFile(
		join(f.directory, "batch-binding.json"),
		JSON.stringify({
			schema: "portal-job-batch-binding.v1",
			ownerId: "42",
			requestId: f.requestId,
		}),
	);
	await expect(resolveBatchBinding(options, f.requestId)).rejects.toThrow();
	await expect(f.store.sealResult(f.requestId)).rejects.toThrow(
		"SOURCE_SNAPSHOT_MISMATCH",
	);
});

test("actual resolver rejects pointer owner and request identity mismatches", async () => {
	for (const changed of [{ ownerId: "84" }, { requestId: randomUUID() }]) {
		const f = await fixture();
		const membershipPath = join(f.directory, "batch-binding.json");
		await writeFile(
			membershipPath,
			JSON.stringify({
				schema: "portal-job-batch-binding.v1",
				ownerId: "42",
				requestId: f.requestId,
				batchId: randomUUID(),
				itemId: randomUUID(),
				snapshotSHA: sha("snapshot"),
				...changed,
			}),
		);
		const store = createEvaluationStore({
			ownerRoot: f.ownerRoot,
			ownerId: "42",
		});
		await expect(store.sealResult(f.requestId)).rejects.toThrow(
			"SOURCE_SNAPSHOT_MISMATCH",
		);
	}
});

test("receipt identity mismatch and inconsistent projection hashes cannot be sealed", async () => {
	for (const field of ["requestId", "renderingSHA", "sourceSHA"]) {
		const f = await fixture();
		if (field === "requestId") {
			const receipt = JSON.parse(
				String(f.artifacts["candidate.png.receipt.json"]),
			);
			await writeFile(
				join(f.directory, "candidate.png.receipt.json"),
				JSON.stringify({ ...receipt, requestId: randomUUID() }),
			);
		} else {
			const projection = JSON.parse(String(f.artifacts["projection.json"]));
			await writeFile(
				join(f.directory, "projection.json"),
				JSON.stringify({ ...projection, [field]: "a".repeat(64) }),
			);
		}
		await expect(f.store.sealResult(f.requestId)).rejects.toThrow(
			"RESULT_EVIDENCE_MISMATCH",
		);
	}
});
