import { expect, test } from "bun:test";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { encodePng } from "../../portrait/acceptance/src/png.ts";
import { openOriginalsStore } from "../../people-cli/src/store.ts";
import { createAuth } from "../src/auth.ts";
import { loadConfig } from "../src/config.ts";
import { createPortal } from "../src/server.ts";
import { acquireReferenceSource } from "../src/source-acquisition.ts";
import {
	generationSheetFromBytes,
	hash,
	openCharacters,
} from "../src/sources.ts";
import { createWikiSource } from "../src/wiki.ts";

const person = {
	id: "person-0998",
	characterId: "K998",
	name: "Reference fixture",
	detailRoute: "/people/person-0998",
};
const png = encodePng({
	width: 2,
	height: 2,
	pixels: new Uint8Array(16).fill(128),
});
const detailBytes = Buffer.from(
	JSON.stringify({ ...person, familyTree: { personId: "K998" } }),
);
const request = {
	schemaVersion: 2,
	requestId: "00000000-0000-4000-8000-000000000002",
	personId: person.id,
	inputMode: "reference-img2img",
	sourceSelection: {
		kind: "selected",
		personId: person.id,
		sourceSHA256: hash(png),
	},
	explicitEdits: [],
	provider: "openai-compatible",
	providerModel: "gpt-image-2.5-sunburst",
	size: "340x510",
	faceMode: { kind: "unique", variantId: null },
};

export async function sourceFixture(image = png) {
	const calls: string[] = [];
	const state = {
		imageStatus: 200,
		wikiStatus: 200,
		publishedCharacter: "K998",
		corrupt: false,
		tokenCharacter: "K998",
		image: true,
		path: "/portraits/person-0998.png",
		pin: hash(image),
	};
	const tokenBytes = () =>
		Buffer.from(
			JSON.stringify({
				schemaVersion: 1,
				personId: person.id,
				characterId: state.tokenCharacter,
				name: person.name,
				artProposal: { upper: "dark blue work jacket", hair: "short hair" },
				image: state.image ? { path: state.path, sha256: state.pin } : null,
			}),
		);
	const server = createServer((req, res) => {
		const path = req.url ?? "";
		calls.push(path);
		if (state.wikiStatus !== 200) {
			res.writeHead(state.wikiStatus).end();
			return;
		}
		switch (path) {
			case "/wiki/people":
				res.end(
					'<script type="module" src="/wiki/assets/index-real.js"></script>',
				);
				break;
			case "/wiki/assets/index-real.js":
				res.end('const x="assets/peopleCatalog-real.js";');
				break;
			case "/wiki/assets/peopleCatalog-real.js":
				res.end(
					`var e=${JSON.stringify([{ ...person, characterId: state.publishedCharacter }])};export{e};`,
				);
				break;
			case "/wiki/person-details/person-0998.json":
				res.end(
					JSON.stringify({
						...person,
						characterId: state.publishedCharacter,
						familyTree: { personId: state.publishedCharacter },
					}),
				);
				break;
			case "/wiki/portrait-tokens/person-0998.json":
				res.end(tokenBytes());
				break;
			case "/wiki/portraits/person-0998.png":
				res
					.writeHead(state.imageStatus, { "content-type": "image/png" })
					.end(state.corrupt ? Buffer.from("not png") : image);
				break;
			default:
				res.writeHead(404).end();
		}
	});
	const ready = once(server, "listening");
	server.listen(0, "127.0.0.1");
	await ready;
	const address = server.address();
	if (!address || typeof address === "string") throw Error("address");
	const url = `http://127.0.0.1:${address.port}/wiki/`;
	return {
		state,
		calls,
		url,
		tokenBytes,
		dependencies: {
			characters: undefined,
			wiki: createWikiSource(url),
			wikiBaseUrl: url,
		},
		close: () =>
			new Promise<void>((resolve, reject) =>
				server.close((error) => (error ? reject(error) : resolve())),
			),
	};
}

test("selected unregistered source fetches actual hash pinned PNG over HTTP", async () => {
	const fixture = await sourceFixture();
	try {
		const result = await acquireReferenceSource(request, fixture.dependencies);
		expect(result.status).toBe("acquired");
		if (result.status !== "acquired") throw Error("not acquired");
		expect(result.generation.role).toBe("source-preservation");
		expect(Buffer.from(result.generation.recipientImage.bytes)).toEqual(
			Buffer.from(png),
		);
		expect(
			fixture.calls.filter((path) => path.includes("/portraits/")),
		).toHaveLength(1);
	} finally {
		await fixture.close();
	}
});

test("retained immutable original is read first without wiki network", async () => {
	const fixture = await sourceFixture();
	try {
		const token = fixture.tokenBytes();
		const sheet = {
			...generationSheetFromBytes(detailBytes, token, png),
			imageBytes: png,
			sourceHashes: {
				detail: hash(detailBytes),
				token: hash(token),
				image: hash(png),
			},
		};
		const result = await acquireReferenceSource(request, {
			...fixture.dependencies,
			characters: { get: () => sheet },
		});
		expect(result.status).toBe("acquired");
		expect(fixture.calls).toEqual([]);
	} finally {
		await fixture.close();
	}
});

test("missing selected retained revision does not become an unregistered wiki fallback", async () => {
	const fixture = await sourceFixture();
	try {
		const result = await acquireReferenceSource(request, {
			...fixture.dependencies,
			characters: {
				get: () => {
					throw Error("NOT_FOUND");
				},
			},
		});
		expect(result).toMatchObject({ status: "failed", generation: null });
		expect(fixture.calls).toEqual([]);
	} finally {
		await fixture.close();
	}
});

for (const status of [404, 403, 503])
	test(`selected HTTP ${status} cannot become token only`, async () => {
		const fixture = await sourceFixture();
		fixture.state.imageStatus = status;
		try {
			expect(
				await acquireReferenceSource(request, fixture.dependencies),
			).toMatchObject({
				status: "failed",
				generation: null,
				errorCode: "REFERENCE_NOT_ACQUIRED",
			});
		} finally {
			await fixture.close();
		}
	});

for (const mutation of [
	"hash",
	"identity",
	"path",
	"null",
	"malformed",
	"stale",
	"null-role",
] as const)
	test(`selected ${mutation} evidence fails closed`, async () => {
		const fixture = await sourceFixture();
		let input: unknown = request;
		switch (mutation) {
			case "hash":
				fixture.state.corrupt = true;
				break;
			case "identity":
				fixture.state.tokenCharacter = "K9999";
				break;
			case "path":
				fixture.state.path = "http://127.0.0.1/private.png";
				break;
			case "null":
				fixture.state.image = false;
				break;
			case "malformed":
				fixture.state.corrupt = true;
				fixture.state.pin = hash(Buffer.from("not png"));
				input = {
					...request,
					sourceSelection: {
						...request.sourceSelection,
						sourceSHA256: fixture.state.pin,
					},
				};
				break;
			case "stale":
				input = {
					...request,
					sourceSelection: {
						...request.sourceSelection,
						sourceSHA256: "0".repeat(64),
					},
				};
				break;
			case "null-role":
				input = { ...request, role: null };
				break;
			default:
				mutation satisfies never;
		}
		try {
			expect(
				await acquireReferenceSource(input, fixture.dependencies),
			).toMatchObject({ status: "failed", generation: null });
		} finally {
			await fixture.close();
		}
	});

for (const photo of [false, true])
	test(`explicit intentional absence is eligible with photo advertised ${photo}`, async () => {
		const fixture = await sourceFixture();
		fixture.state.image = photo;
		try {
			const result = await acquireReferenceSource(
				{
					...request,
					inputMode: "token-only",
					sourceSelection: {
						kind: "intentional-absence",
						reason: "no-reference-available",
					},
				},
				fixture.dependencies,
			);
			expect(result).toMatchObject({
				status: "intentional-absence",
				generation: {
					inputMode: "token-only",
					role: "design-tokens",
					recipientImage: null,
				},
			});
			expect(fixture.calls.some((path) => path.includes("/portraits/"))).toBe(
				false,
			);
		} finally {
			await fixture.close();
		}
	});

test("versioned actual portal route exposes acquisition without changing legacy token eligibility", async () => {
	const fixture = await sourceFixture();
	const config = loadConfig({
		WIKI_BASE_URL: fixture.url,
		PORTAL_SESSION_SECRET: "s".repeat(48),
	});
	const app = await createPortal(config);
	const ready = once(app.server, "listening");
	app.server.listen(0, "127.0.0.1");
	await ready;
	const address = app.server.address();
	if (!address || typeof address === "string") throw Error("address");
	const endpoint = `http://127.0.0.1:${address.port}/tools/api/wiki/people/person-0998`;
	const headers = {
		cookie: `portal_session=${createAuth(config).issue({ id: "42", login: "reader" })}`,
	};
	try {
		const params = new URLSearchParams({
			schemaVersion: "2",
			inputMode: "reference-img2img",
			sourceSelection: JSON.stringify(request.sourceSelection),
		});
		const response = await fetch(`${endpoint}?${params}`, { headers });
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			sourceAcquisition: {
				status: "acquired",
				eligible: true,
				role: "source-preservation",
			},
		});
		fixture.state.imageStatus = 503;
		const failed = await fetch(`${endpoint}?${params}`, { headers });
		expect(await failed.json()).toMatchObject({
			sourceAcquisition: {
				status: "failed",
				eligible: false,
				generation: null,
			},
		});
		const legacy = await fetch(endpoint, { headers });
		expect(await legacy.json()).toMatchObject({
			generationEligibility: {
				eligible: true,
				sourceMode: "design-token-only",
			},
		});
	} finally {
		await app.close();
		await fixture.close();
	}
});

for (const scenario of ["offline", "identity-conflict"] as const)
	test(`retained real K998 HTTP ${scenario} preserves one verified identity`, async () => {
		const image = await readFile(
			process.env["REFERENCE_CONTRACT_K998_PNG"] ??
				new URL(
					"../../../ART-ASSETS/portrait-references/wiki-people/images/person-0998.png",
					import.meta.url,
				),
		);
		const fixture = await sourceFixture(image);
		const directory = await mkdtemp(join(tmpdir(), "task2-retained-http-"));
		const dbPath = join(directory, "originals.sqlite");
		openOriginalsStore(dbPath).close();
		const store = openCharacters(dbPath);
		const token = Buffer.from(
			JSON.stringify({
				...JSON.parse(fixture.tokenBytes().toString()),
				generationContract: {},
				slots: {},
			}),
		);
		store.register({
			personId: person.id,
			detailBase64: detailBytes.toString("base64"),
			tokenBase64: token.toString("base64"),
			imageBase64: image.toString("base64"),
			detailSha256: hash(detailBytes),
			tokenSha256: hash(token),
			imageSha256: hash(image),
		});
		store.close();
		const config = loadConfig({
			WIKI_BASE_URL: fixture.url,
			PORTAL_SESSION_SECRET: "s".repeat(48),
			PORTAL_ORIGINALS_DB: dbPath,
		});
		const app = await createPortal(config);
		const ready = once(app.server, "listening");
		app.server.listen(0, "127.0.0.1");
		await ready;
		const address = app.server.address();
		if (!address || typeof address === "string") throw Error("address");
		const params = new URLSearchParams({
			schemaVersion: "2",
			inputMode: "reference-img2img",
			sourceSelection: JSON.stringify({
				...request.sourceSelection,
				sourceSHA256: hash(image),
			}),
		});
		const url = `http://127.0.0.1:${address.port}/tools/api/wiki/people/person-0998?${params}`;
		switch (scenario) {
			case "offline":
				fixture.state.wikiStatus = 503;
				break;
			case "identity-conflict":
				fixture.state.publishedCharacter = "K999";
				break;
			default:
				scenario satisfies never;
		}
		try {
			const response = await fetch(url, {
				headers: {
					cookie: `portal_session=${createAuth(config).issue({ id: "42", login: "reader" })}`,
				},
			});
			const body = z
				.object({ imageBase64: z.string().nullable().optional() })
				.passthrough()
				.parse(await response.json());
			if (process.env["TASK2_HTTP_RECEIPTS"])
				console.log(
					`TASK2_HTTP ${JSON.stringify({ scenario, url, status: response.status, headers: Object.fromEntries(response.headers), body: { ...body, imageBase64: undefined }, wikiCalls: fixture.calls, providerCalls: 0 })}`,
				);
			switch (scenario) {
				case "offline":
					expect(response.status).toBe(200);
					expect(body).toMatchObject({
						personId: person.id,
						characterId: "K998",
						name: person.name,
						detail: { characterId: "K998" },
						sourceAcquisition: {
							status: "acquired",
							eligible: true,
							sourceSHA256: hash(image),
						},
					});
					expect(
						hash(Buffer.from(z.string().parse(body.imageBase64), "base64")),
					).toBe(hash(image));
					break;
				case "identity-conflict":
					expect(response.status).toBe(422);
					expect(body).toMatchObject({
						sourceAcquisition: {
							status: "failed",
							errorCode: "REFERENCE_IDENTITY_MISMATCH",
							generation: null,
						},
						generationEligibility: { eligible: false },
						imageBase64: null,
					});
					break;
				default:
					scenario satisfies never;
			}
		} finally {
			await app.close();
			await fixture.close();
			await rm(directory, { recursive: true, force: true });
		}
	});
