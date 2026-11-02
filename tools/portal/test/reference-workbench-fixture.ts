import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import { openOriginalsStore } from "../../people-cli/src/store.ts";
import {
	mossWorkflowAssets,
	verifyMossAssetProof,
} from "../src/comfyui-assets.ts";
import { loadConfig } from "../src/config.ts";
import { createPortal } from "../src/server.ts";
import { hash, openCharacters } from "../src/sources.ts";
import {
	finishingPngFixture,
	finishingProof,
} from "./comfyui-finishing-fixture.ts";
import { sourceTransport } from "./comfyui-source-fixture.ts";

// Real portal + actual immutable K998 source + offline provider boundary. The
// returned PNG is a synthetic transport fixture, never a generation claim.
export async function workbenchFixture(
	options: {
		publicPath?: string;
		port?: number;
		keep?: boolean;
		create?: typeof createPortal;
		retained?: boolean;
		imageBytes?: Buffer;
	} = {},
) {
	const directory = await mkdtemp(
		join(process.env["RUN_TMP"] ?? tmpdir(), "workbench-v2-"),
	);
	const image =
		options.imageBytes ??
		(await readFile(
			process.env["REFERENCE_CONTRACT_K998_PNG"] ??
				new URL(
					"../../../ART-ASSETS/portrait-references/wiki-people/images/person-0998.png",
					import.meta.url,
				),
		));
	let token = await readFile(
		new URL(
			"../../../ART-ASSETS/portrait-references/wiki-people/tokens/person-0998.json",
			import.meta.url,
		),
	);
	const original = JSON.parse(token.toString());
	if (options.imageBytes) {
		original.image.sha256 = hash(image);
		token = Buffer.from(JSON.stringify(original));
	}
	const person = {
		id: "person-0998",
		characterId: "K998",
		name: original.name,
		detailRoute: "/people/person-0998",
		familyTree: { personId: "K998" },
	};
	const noPhoto = {
		id: "person-900001",
		characterId: "K900001",
		name: "reference-plan-no-photo",
		detailRoute: "/people/person-900001",
		familyTree: { personId: "K900001" },
	};
	const explicit = {
		id: "person-0041",
		characterId: "K41",
		name: "explicit-no-reference-fixture",
		detailRoute: "/people/person-0041",
		familyTree: { personId: "K41" },
	};
	const state = {
		wikiStatus: 200,
		publishedName: person.name,
		imageStatus: 200,
		tokenIdentity: "K998",
		pin: hash(image),
		cpaStatus: 200,
		cpaModel: "gpt-image-2.5-sunburst" as string | null,
		cpaBytes: null as Uint8Array | null,
	};
	const people = [person, noPhoto, explicit];
	const calls: {
		provider: string;
		size: string;
		imageDimensions: [number, number] | null;
		imageSHA: string | null;
		prompt: string;
		requestId: string | null;
	}[] = [];
	const wiki = createServer((req, res) => {
		const path = req.url ?? "";
		if (state.wikiStatus !== 200) {
			res.writeHead(state.wikiStatus).end();
			return;
		}
		if (path === "/wiki/people")
			res.end(
				'<script type="module" src="/wiki/assets/index-fixture.js"></script>',
			);
		else if (path === "/wiki/assets/index-fixture.js")
			res.end('const x="assets/peopleCatalog-fixture.js";');
		else if (path === "/wiki/assets/peopleCatalog-fixture.js")
			res.end(`var e=${JSON.stringify(people)};export{e};`);
		else {
			const id = path.match(/person-\d+/)?.[0];
			const row = people.find((p) => p.id === id);
			if (!row) {
				res.writeHead(404).end();
				return;
			}
			if (path.includes("/person-details/"))
				res.end(
					JSON.stringify({
						...row,
						name: row === person ? state.publishedName : row.name,
					}),
				);
			else if (path.includes("/portrait-tokens/"))
				res.end(
					id === person.id
						? state.tokenIdentity === "K998" && state.pin === hash(image)
							? token
							: JSON.stringify({
									...original,
									characterId: state.tokenIdentity,
									image: { ...original.image, sha256: state.pin },
								})
						: JSON.stringify({
								schemaVersion: 1,
								personId: row.id,
								characterId: row.characterId,
								name: row.name,
								facts: {},
								artProposal: {
									face: null,
									upper: "dark blue work jacket",
									hair: "short hair",
								},
								image:
									row === noPhoto
										? null
										: { path: `/portraits/${row.id}.png`, sha256: hash(image) },
							}),
				);
			else if (path.includes("/portraits/"))
				res
					.writeHead(state.imageStatus, { "content-type": "image/png" })
					.end(image);
			else res.writeHead(404).end();
		}
	});
	const ready = once(wiki, "listening", { signal: AbortSignal.timeout(5000) });
	wiki.listen(0, "127.0.0.1");
	await ready;
	const address = wiki.address();
	if (!address || typeof address === "string") throw Error("ADDRESS");
	const comfy = sourceTransport();
	const images = finishingPngFixture();
	const originalsDb = join(directory, "originals.sqlite");
	if (options.retained) {
		openOriginalsStore(originalsDb).close();
		const store = openCharacters(originalsDb);
		try {
			const detail = Buffer.from(JSON.stringify(person));
			store.register({
				personId: person.id,
				detailBase64: detail.toString("base64"),
				tokenBase64: token.toString("base64"),
				imageBase64: image.toString("base64"),
				detailSha256: hash(detail),
				tokenSha256: hash(token),
				imageSha256: hash(image),
			});
		} finally {
			store.close();
		}
	}
	const app = await (options.create ?? createPortal)(
		loadConfig({
			PORTAL_MODE: "local",
			PORTAL_PORT: String(options.port ?? 0),
			PORTAL_STORAGE_PATH: join(directory, "storage"),
			...(options.retained ? { PORTAL_ORIGINALS_DB: originalsDb } : {}),
			WIKI_BASE_URL: `http://127.0.0.1:${address.port}/wiki/`,
			PORTAL_COMFYUI: "true",
			...(options.publicPath
				? {
						PORTAL_PUBLIC_PATH: options.publicPath,
						PORTAL_TOKENS_PATH: join(options.publicPath, "tokens.css"),
					}
				: {}),
		}),
		{
			template: createTransportFixture(),
			comfyTransport: comfy.transport,
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
			referenceSend: async (request) => {
				const form = await request.formData();
				const reference = form.get("image[]");
				const referenceBytes =
					reference instanceof Blob
						? Buffer.from(await reference.arrayBuffer())
						: null;
				calls.push({
					provider: "openai-compatible",
					size: String(form.get("size")),
					imageDimensions: referenceBytes
						? [referenceBytes.readUInt32BE(16), referenceBytes.readUInt32BE(20)]
						: null,
					imageSHA:
						reference instanceof Blob
							? hash(new Uint8Array(await reference.arrayBuffer()))
							: null,
					prompt: String(form.get("prompt")),
					requestId: null,
				});
				return Response.json(
					{
						model: state.cpaModel,
						data: [
							{
								b64_json: Buffer.from(
									state.cpaBytes ??
										(form.get("size") === "340x510"
											? finishingPngFixture(340, 510).finishedBytes
											: images.finishedBytes),
								).toString("base64"),
							},
						],
					},
					{ status: state.cpaStatus },
				);
			},
		},
	);
	const appAddress = await app.listen();
	const origin = `http://127.0.0.1:${appAddress.port}`;
	const api = `${origin}/tools/api`;
	async function session() {
		const response = await fetch(`${api}/auth/session`);
		const body = (await response.json()) as { csrfToken: string };
		return {
			cookie: (response.headers.get("set-cookie") ?? "").split(";")[0] ?? "",
			origin,
			"x-csrf-token": body.csrfToken,
			"content-type": "application/json",
		};
	}
	return {
		app,
		origin,
		api,
		directory,
		state,
		calls,
		comfy,
		image,
		token,
		session,
		close: async () => {
			await app.close();
			wiki.closeAllConnections();
			await new Promise<void>((resolve) => wiki.close(() => resolve()));
			if (!options.keep) await rm(directory, { recursive: true, force: true });
		},
	};
}
