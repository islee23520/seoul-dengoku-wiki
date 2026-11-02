import { expect, test } from "bun:test";
import { once } from "node:events";
import { createServer } from "node:http";
import { createAuth } from "../src/auth.ts";
import { loadConfig } from "../src/config.ts";
import { createPortal } from "../src/server.ts";
import { hash } from "../src/sources.ts";
import { createWikiSource } from "../src/wiki.ts";

test("canonical sss Wiki origin and historical origin remain exact trusted authorities", () => {
	for (const base of [
		"https://sss.linalab.io/wiki/",
		"https://seoul-dengoku.linalab.io/wiki/",
	])
		expect(() => createWikiSource(base)).not.toThrow();
	for (const base of [
		"http://sss.linalab.io/wiki/",
		"https://sss.linalab.io:444/wiki/",
		"https://sss.linalab.io.evil.test/wiki/",
		"https://evil.test/wiki/",
		"https://user@sss.linalab.io/wiki/",
		"https://sss.linalab.io/",
		"https://sss.linalab.io/wiki/?x=1",
		"https://sss.linalab.io/wiki/#x",
	])
		expect(() => createWikiSource(base)).toThrow("INVALID_WIKI_BASE_URL");
});

const person = {
	id: "person-1003",
	characterId: "K1003",
	name: "조재표",
	stateName: "무소속",
	detailRoute: "/people/person-1003",
};
async function fixture() {
	let broken = false;
	let duplicate = false;
	let execute = false;
	let tokenMismatch = false;
	const tokenBytes = () =>
		Buffer.from(
			` \n${JSON.stringify({ schemaVersion: 1, personId: person.id, characterId: tokenMismatch ? "K9999" : person.characterId, name: person.name, artProposal: { hair: "wine hair" } }, null, 2)}\n\t`,
		);
	const detailBytes = Buffer.from(
		` \n${JSON.stringify({ ...person, familyTree: { personId: "K1003" }, facts: { authored: true, text: "조재표 원본" } }, null, 2)}\n\t`,
	);
	const calls: string[] = [];
	const server = createServer((req, res) => {
		const path = req.url ?? "";
		calls.push(path);
		if (broken) {
			res.writeHead(503).end("unavailable");
			return;
		}
		if (path === "/wiki/people")
			res.end(
				'<script type="module" src="/wiki/assets/index-real.js"></script>',
			);
		else if (path === "/wiki/assets/index-real.js")
			res.end('const x="assets/peopleCatalog-real.js";');
		else if (path === "/wiki/assets/peopleCatalog-real.js") {
			const rows = duplicate
				? [person, person]
				: [
						person,
						{
							...person,
							id: "person-1004",
							characterId: "K1004",
							name: "이연",
							detailRoute: "/people/person-1004",
						},
					];
			res.end(
				execute
					? "var e=globalThis.run();export{e};"
					: `var e=${JSON.stringify(rows)};export{e};`,
			);
		} else if (path === "/wiki/person-details/person-1003.json") {
			res.setHeader("content-type", "application/json");
			res.end(detailBytes);
		} else if (path === "/wiki/portrait-tokens/person-1003.json")
			res.end(tokenBytes());
		else res.writeHead(404).end();
	});
	const ready = once(server, "listening");
	server.listen(0, "127.0.0.1");
	await ready;
	const addr = server.address();
	if (!addr || typeof addr === "string") throw Error("addr");
	return {
		url: `http://127.0.0.1:${addr.port}/wiki/`,
		calls,
		detailBytes,
		tokenBytes,
		tokenMismatch: () => {
			tokenMismatch = true;
		},
		broken: () => {
			broken = true;
		},
		duplicate: () => {
			duplicate = true;
		},
		execute: () => {
			execute = true;
		},
		close: () =>
			new Promise<void>((resolve, reject) =>
				server.close((e) => (e ? reject(e) : resolve())),
			),
	};
}
test("real HTTP Wiki discovery searchable paging and exact detail not six-originals store", async () => {
	const f = await fixture();
	try {
		const { createWikiSource } = await import("../src/wiki.ts");
		const wiki = createWikiSource(f.url);
		const page = await wiki.list({ q: "", limit: 1, cursor: 0 });
		expect(page.total).toBe(2);
		expect(page.nextCursor).toBe("1");
		expect(page.people[0]?.personId).toBe("person-1003");
		const next = await wiki.list({ q: "", limit: 1, cursor: 1 });
		expect(next.people[0]?.personId).toBe("person-1004");
		const search = await wiki.list({ q: "조재표", limit: 25, cursor: 0 });
		expect(search.total).toBe(1);
		expect(f.calls).toEqual(
			Array.from({ length: 3 }, () => [
				"/wiki/people",
				"/wiki/assets/index-real.js",
				"/wiki/assets/peopleCatalog-real.js",
			]).flat(),
		);
		const detail = await wiki.detail("person-1003");
		expect(detail.detail.characterId).toBe("K1003");
		expect(detail.source.kind).toBe("live-wiki-http");
		expect(f.calls).toContain("/wiki/person-details/person-1003.json");
		await expect(wiki.detail("person-9999")).rejects.toThrow("NOT_FOUND");
		f.broken();
		await expect(wiki.list({ q: "", limit: 25, cursor: 0 })).rejects.toThrow(
			"WIKI_UNAVAILABLE",
		);
	} finally {
		await f.close();
	}
});
test("Wiki token acquisition preserves exact bytes and checks current detail identity", async () => {
	const f = await fixture();
	try {
		const { createWikiSource } = await import("../src/wiki.ts");
		const wiki = createWikiSource(f.url);
		const detail = await wiki.detailWithBytes(person.id);
		const token = await wiki.tokenWithBytes(person.id, detail);
		expect(token.bytes).toEqual(f.tokenBytes());
		expect(token.source.sha256).toBe(hash(f.tokenBytes()));
		expect(token.source.url).toBe(`${f.url}portrait-tokens/${person.id}.json`);
		expect(f.calls.filter((p) => p.includes("person-details"))).toHaveLength(1);
		f.tokenMismatch();
		await expect(wiki.tokenWithBytes(person.id, detail)).rejects.toThrow(
			"WIKI_INVALID_SOURCE",
		);
		await expect(wiki.tokenWithBytes("../invalid", detail)).rejects.toThrow(
			"NOT_FOUND",
		);
	} finally {
		await f.close();
	}
});
test("Wiki duplicate IDs and executable catalogue rejected not evaluated", async () => {
	for (const mode of ["duplicate", "execute"] as const) {
		const f = await fixture();
		try {
			const { createWikiSource } = await import("../src/wiki.ts");
			f[mode]();
			await expect(
				createWikiSource(f.url).list({ q: "", limit: 25, cursor: 0 }),
			).rejects.toThrow("WIKI_INVALID_SOURCE");
		} finally {
			await f.close();
		}
	}
});
test("Wiki internal snapshot retains exact whitespace and Unicode with one detail request while public fields stay unchanged", async () => {
	const f = await fixture();
	try {
		const { createWikiSource } = await import("../src/wiki.ts");
		const wiki = createWikiSource(f.url);
		const snapshot = await wiki.detailWithBytes("person-1003");
		expect(snapshot.bytes).toEqual(f.detailBytes);
		expect(snapshot.source.sha256).toBe(hash(f.detailBytes));
		expect(hash(Buffer.from(JSON.stringify(snapshot.detail)))).not.toBe(
			snapshot.source.sha256,
		);
		expect(
			f.calls.filter((path) => path.includes("person-details")),
		).toHaveLength(1);
		const detail = await wiki.detail("person-1003");
		expect(Object.keys(detail)).toEqual([
			"personId",
			"characterId",
			"name",
			"detail",
			"source",
		]);
		expect(detail.detail).toEqual(snapshot.detail);
		expect(detail.source.sha256).toBe(snapshot.source.sha256);
	} finally {
		await f.close();
	}
});
test("protected Wiki API validates query ID boundaries and reports references unavailable", async () => {
	const f = await fixture();
	const config = loadConfig({
		WIKI_BASE_URL: f.url,
		PORTAL_SESSION_SECRET: "s".repeat(48),
	});
	const app = await createPortal(config);
	const ready = once(app.server, "listening");
	app.server.listen(0, "127.0.0.1");
	await ready;
	const addr = app.server.address();
	if (!addr || typeof addr === "string") throw Error("addr");
	const origin = `http://127.0.0.1:${addr.port}`;
	const token = createAuth(config).issue({ id: "42", login: "reader" });
	const headers = { cookie: `portal_session=${token}` };
	try {
		expect((await fetch(`${origin}/tools/api/wiki/people`)).status).toBe(401);
		expect(
			(await fetch(`${origin}/tools/api/wiki/people?limit=101`, { headers }))
				.status,
		).toBe(422);
		expect(
			(
				await fetch(`${origin}/tools/api/wiki/people?limit=1&limit=2`, {
					headers,
				})
			).status,
		).toBe(422);
		expect(
			(
				await fetch(`${origin}/tools/api/wiki/people/person-1003%2Fsecret`, {
					headers,
				})
			).status,
		).toBe(422);
		const response = await fetch(
			`${origin}/tools/api/wiki/people/person-1003`,
			{ headers },
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			generationEligibility: {
				eligible: true,
				sourceMode: "design-token-only",
				originalSourceHashes: { image: null },
			},
		});
		expect(
			(await fetch(`${origin}/tools/api/wiki/people/person-9999`, { headers }))
				.status,
		).toBe(404);
	} finally {
		await app.close();
		await f.close();
	}
});
