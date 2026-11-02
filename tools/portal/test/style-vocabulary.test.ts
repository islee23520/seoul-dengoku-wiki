import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../../../..", import.meta.url));
const script = fileURLToPath(
	new URL("../scripts/refresh-style-vocabulary.mjs", import.meta.url),
);
const seedDir = new URL("../data/style-vocabulary/", import.meta.url);

test("seed uses composite ids and dated 146 plus 31 counts", async () => {
	const style = JSON.parse(
		await readFile(new URL("style-vocabulary.json", seedDir), "utf8"),
	);
	const hair = JSON.parse(
		await readFile(new URL("hair-vocabulary.json", seedDir), "utf8"),
	);
	expect(style.schema).toBe("seoul.style-vocabulary/v1");
	expect(style.observation.status).toBe("dated-observation");
	expect(style.observation.notPermanent).toBe(true);
	expect(style.permission.status).toBe("unverified");
	expect(style.counts).toMatchObject({
		values: 177,
		uniqueLabels: 176,
		siteUsed: 146,
		unused: 31,
	});
	expect(
		style.counts.uniqueIds ??
			new Set(style.values.map((value: { id: string }) => value.id)).size,
	).toBe(177);
	const ids = style.values.map((value: { id: string }) => value.id);
	expect(new Set(ids).size).toBe(ids.length);
	const realistic = style.values.filter(
		(value: { label: string }) => value.label === "Realistic",
	);
	expect(realistic.map((value: { id: string }) => value.id)).toEqual([
		"rendering/realistic",
		"proportions/realistic",
	]);
	const mixels = style.values.find(
		(value: { id: string }) => value.id === "pixel-details/mixels",
	);
	expect(mixels?.label).toBe("Mixels");
	expect(mixels?.siteUse).toBe("site-used");
	expect(style.labelCorrections).toEqual([
		expect.objectContaining({
			taxonomyLabel: "Mixels",
			archivedTsvLabel: "Mixes",
		}),
	]);
	expect(
		style.values.every(
			(value: { trigger: { contract: string; words: string[] } }) =>
				value.trigger.contract === "unknown" &&
				value.trigger.words.length === 0,
		),
	).toBe(true);
	expect(style.trigger.unknownMeans).not.toBe(style.trigger.noneMeans);
	for (const source of style.sources) {
		expect(source.url).toMatch(/^https:\/\/gameartstyles\.com\//);
		expect(source.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		expect(source.sha256).toMatch(/^[a-f0-9]{64}$/);
	}
	expect(hair.schema).toBe("seoul.hair-vocabulary/v1");
	expect(hair.permission.status).toBe("unverified");
	expect(hair.permission.training).toBe("forbidden-until-separately-permitted");
	expect(
		hair.entries.filter(
			(entry: { labelStatus: string }) => entry.labelStatus === "printed",
		),
	).toHaveLength(3);
	expect(
		hair.entries.find(
			(entry: { label: string }) =>
				entry.label === "Soft Micro Bangs Straight Hair",
		)?.panel,
	).toBe(1);
	expect(
		hair.entries.some(
			(entry: { labelStatus: string }) => entry.labelStatus === "unlabeled",
		),
	).toBe(true);
});

test("local refresh publishes one consistent generation and agrees with taxonomy counts", async () => {
	const fixture = await writeFixture();
	const dir = await makeDir("style-vocab-ok-");
	try {
		const run = await refresh(["--output", dir, ...fixture.args]);
		expect(run.code).toBe(0);
		const report = JSON.parse(run.stdout);
		expect(report.ok).toBe(true);
		expect(report.siteUsed).toBe(1);
		expect(report.unused).toBe(1);
		const style = JSON.parse(
			await readFile(
				join(dir, report.generation, "style-vocabulary.json"),
				"utf8",
			),
		);
		const pointer = JSON.parse(
			await readFile(join(dir, "current.json"), "utf8"),
		);
		expect(pointer.generation).toBe(report.generation);
		expect(
			JSON.parse(
				await readFile(
					join(dir, report.generation, "hair-vocabulary.json"),
					"utf8",
				),
			).schema,
		).toBe("seoul.hair-vocabulary/v1");
		expect(style.counts.values).toBe(2);
		expect(style.counts.uniqueIds).toBe(2);
		expect(style.values.map((value: { id: string }) => value.id)).toEqual([
			"rendering/pixel-art",
			"rendering/realistic",
		]);
		expect(
			style.sources.find(
				(source: { role: string }) => source.role === "taxonomy",
			).sha256,
		).toBe(fixture.taxonomySha);
		expect(
			style.sources.find(
				(source: { role: string }) => source.role === "ssr-jsonld",
			).jsonLdType,
		).toBe("CollectionPage");
	} finally {
		await rm(dir, { recursive: true, force: true });
		await rm(fixture.dir, { recursive: true, force: true });
	}
});

test("malformed taxonomy leaves the previous output byte-identical", async () => {
	const fixture = await writeFixture();
	const dir = await makeDir("style-vocab-keep-");
	const prior = `${JSON.stringify({ schema: "seoul.style-vocabulary/v1", marker: "keep-me", observation: { observedAt: "2020-01-01T00:00:00.000Z" } })}\n`;
	await writeFile(join(dir, "style-vocabulary.json"), prior);
	try {
		await writeFile(
			join(fixture.dir, "taxonomy.js"),
			"window.GAS = {not json};\n",
		);
		const run = await refresh(["--output", dir, ...fixture.args]);
		expect(run.code).not.toBe(0);
		expect(run.stderr).toContain("JSON");
		expect(await readFile(join(dir, "style-vocabulary.json"), "utf8")).toBe(
			prior,
		);
		expect(run.stdout).not.toContain('"ok":true');
	} finally {
		await rm(dir, { recursive: true, force: true });
		await rm(fixture.dir, { recursive: true, force: true });
	}
});

test("a forbidden /api url fails before any network request", async () => {
	const hits: string[] = [];
	const server = createServer((request, response) => {
		hits.push(request.url ?? "");
		response.writeHead(200, { "content-type": "text/plain" });
		response.end("reached");
	});
	await new Promise<void>((resolveListen) => {
		server.listen(0, "127.0.0.1", () => resolveListen());
	});
	const address = server.address();
	if (!address || typeof address === "string") throw new Error("address");
	const fixture = await writeFixture({
		sitemapLoc: `http://127.0.0.1:${address.port}/api/browse`,
	});
	const dir = await makeDir("style-vocab-api-");
	try {
		const run = await refresh(["--output", dir, ...fixture.args]);
		expect(run.code).not.toBe(0);
		expect(run.stderr).toContain("rejected");
		expect(hits).toEqual([]);
		expect(run.stdout).not.toContain('"ok":true');
	} finally {
		server.close();
		await rm(dir, { recursive: true, force: true });
		await rm(fixture.dir, { recursive: true, force: true });
	}
});

test("a foreign origin in the sitemap is rejected offline", async () => {
	const fixture = await writeFixture({
		sitemapLoc: "https://evil.example/styles/rendering/pixel-art",
	});
	const dir = await makeDir("style-vocab-origin-");
	try {
		const run = await refresh(["--output", dir, ...fixture.args]);
		expect(run.code).not.toBe(0);
		expect(run.stderr).toContain("rejected origin");
		expect(run.stdout).not.toContain('"ok":true');
	} finally {
		await rm(dir, { recursive: true, force: true });
		await rm(fixture.dir, { recursive: true, force: true });
	}
});

test("a stale newer timestamp is not rewritten", async () => {
	const fixture = await writeFixture();
	const dir = await makeDir("style-vocab-stale-");
	const future = "2999-01-01T00:00:00.000Z";
	const prior = {
		schema: "seoul.style-vocabulary/v1",
		observation: { observedAt: future },
		sources: [
			{ role: "taxonomy", sha256: "a".repeat(64), retrievedAt: future },
		],
		values: [],
	};
	const text = `${JSON.stringify(prior)}\n`;
	await writeFile(join(dir, "style-vocabulary.json"), text);
	try {
		const run = await refresh(["--output", dir, ...fixture.args]);
		expect(run.code).not.toBe(0);
		expect(run.stderr).toContain("timestamp");
		expect(await readFile(join(dir, "style-vocabulary.json"), "utf8")).toBe(
			text,
		);
	} finally {
		await rm(dir, { recursive: true, force: true });
		await rm(fixture.dir, { recursive: true, force: true });
	}
});

test("unchanged taxonomy with a new valid sitemap refreshes site use and counts", async () => {
	const fixture = await writeFixture();
	const dir = await makeDir("style-vocab-sitemap-");
	try {
		const first = await refresh(["--output", dir, ...fixture.args]);
		expect(first.code).toBe(0);
		const prior = await snapshot(dir);
		const priorStyle = JSON.parse(prior.style);
		await writeFile(
			join(fixture.dir, "sitemap.xml"),
			"<urlset><url><loc>https://gameartstyles.com/styles/rendering/pixel-art</loc></url><url><loc>https://gameartstyles.com/styles/rendering/realistic</loc></url></urlset>\n",
		);
		const second = await refresh(["--output", dir, ...fixture.args]);
		expect(second.code).toBe(0);
		const current = await snapshot(dir);
		const style = JSON.parse(current.style);
		expect(current.pointer).not.toBe(prior.pointer);
		expect(style.sources[0].sha256).toBe(priorStyle.sources[0].sha256);
		expect(style.sources[1].sha256).not.toBe(priorStyle.sources[1].sha256);
		expect(style.sources[2].sha256).toBe(priorStyle.sources[2].sha256);
		expect(
			style.values.map((value: { siteUse: string }) => value.siteUse),
		).toEqual(["site-used", "site-used"]);
		expect(style.counts).toMatchObject({ values: 2, siteUsed: 2, unused: 0 });
		const previousGeneration = JSON.parse(prior.pointer).generation;
		expect(
			await readFile(
				join(dir, previousGeneration, "style-vocabulary.json"),
				"utf8",
			),
		).toBe(prior.style);
	} finally {
		await rm(dir, { recursive: true, force: true });
		await rm(fixture.dir, { recursive: true, force: true });
	}
}, 20000);

for (const tamper of ["values", "counts"]) {
	test(`identical source hashes with altered derived ${tamper} are rejected`, async () => {
		const fixture = await writeFixture();
		const dir = await makeDir("style-vocab-hash-");
		const first = await refresh(["--output", dir, ...fixture.args]);
		expect(first.code).toBe(0);
		const published = JSON.parse(first.stdout).generation;
		const written = JSON.parse(
			await readFile(join(dir, published, "style-vocabulary.json"), "utf8"),
		);
		if (tamper === "values") {
			written.values[0].siteUse = "unused";
		} else {
			written.counts.siteUsed = 0;
			written.counts.unused = 2;
		}
		written.observation.observedAt = "2020-01-01T00:00:00.000Z";
		const tampered = `${JSON.stringify(written)}\n`;
		await writeFile(join(dir, published, "style-vocabulary.json"), tampered);
		try {
			const run = await refresh(["--output", dir, ...fixture.args]);
			expect(run.code).not.toBe(0);
			expect(run.stderr).toContain("sha256");
			expect(
				await readFile(join(dir, published, "style-vocabulary.json"), "utf8"),
			).toBe(tampered);
		} finally {
			await rm(dir, { recursive: true, force: true });
			await rm(fixture.dir, { recursive: true, force: true });
		}
	}, 20000);
}

// Each fault is injected at a real filesystem boundary in a copied CLI. The
// production algorithm is unchanged; only its fs import is redirected.
for (const mode of [
	"second-write",
	"pointer",
	"collision",
	"fresh",
	"cleanup",
	"stale",
	"lock",
]) {
	test(`publication preserves prior generation and foreign files: ${mode}`, async () => {
		const fixture = await writeFixture();
		const dir = await makeDir("style-vocab-transaction-");
		try {
			let prior: Awaited<ReturnType<typeof snapshot>> | undefined;
			if (mode !== "fresh") {
				const first = await refresh(["--output", dir, ...fixture.args]);
				expect(first.code).toBe(0);
				prior = await snapshot(dir);
			}
			if (mode === "lock") {
				await mkdir(join(dir, ".refresh-lock"));
				await writeFile(join(dir, ".refresh-lock", "KEEP.txt"), "foreign");
			}
			const injected = join(fixture.dir, "cli.mjs");
			await writeFile(
				injected,
				(await readFile(script, "utf8")).replace(
					'from "node:fs/promises"',
					'from "./fs.mjs"',
				),
			);
			await writeFile(join(fixture.dir, "fs.mjs"), injectionSource);
			const run = await refresh(["--output", dir, ...fixture.args], {
				script: injected,
				env: { VOCAB_FAULT: mode },
			});
			expect(run.code).not.toBe(0);
			expect(run.stdout).not.toContain('"ok":true');
			if (mode === "fresh") {
				expect(
					await readFile(join(dir, "current.json")).catch((e) => e.code),
				).toBe("ENOENT");
			} else if (!prior) {
				throw new Error("missing prior generation");
			} else if (mode === "stale") {
				expect(await readFile(join(dir, "current.json"), "utf8")).toBe(
					`${prior?.pointer} \n`,
				);
				const after = await snapshot(dir);
				expect(after.style).toBe(prior.style);
				expect(after.hair).toBe(prior.hair);
			} else {
				expect(await snapshot(dir)).toEqual(prior);
			}
			if (mode === "lock") {
				expect(
					await readFile(join(dir, ".refresh-lock", "KEEP.txt"), "utf8"),
				).toBe("foreign");
			}
			if (mode === "collision") {
				const generations = (await readdir(dir)).filter((name) =>
					name.startsWith("generation-"),
				);
				let foreign = 0;
				for (const generation of generations) {
					const bytes = await readFile(
						join(dir, generation, "other-writer", "KEEP.txt"),
						"utf8",
					).catch(() => undefined);
					if (bytes === "foreign") foreign++;
				}
				expect(foreign).toBe(1);
			}
			if (mode === "cleanup") expect(run.stderr).toContain("lock retained");
		} finally {
			await rm(dir, { recursive: true, force: true });
			await rm(fixture.dir, { recursive: true, force: true });
		}
	}, 20000);
}

async function snapshot(dir: string) {
	const pointer = await readFile(join(dir, "current.json"), "utf8");
	const { generation } = JSON.parse(pointer);
	return {
		pointer,
		style: await readFile(
			join(dir, generation, "style-vocabulary.json"),
			"utf8",
		),
		hair: await readFile(join(dir, generation, "hair-vocabulary.json"), "utf8"),
	};
}

const injectionSource = String.raw`
import * as fs from "node:fs/promises";
import { dirname, join } from "node:path";
export const readFile = fs.readFile;
const mode = process.env.VOCAB_FAULT;
function denied(label) { return Object.assign(new Error(label), {code: "EACCES"}); }
export async function mkdir(path, ...args) {
  if (mode === "collision" && String(path).split(/[\\/]/).at(-1).startsWith("generation-")) {
    await fs.mkdir(path);
    await fs.mkdir(join(path, "other-writer"));
    await fs.writeFile(join(path, "other-writer", "KEEP.txt"), "foreign");
  }
  return fs.mkdir(path, ...args);
}
export async function open(path, ...args) {
  if (["second-write", "fresh", "cleanup"].includes(mode) && String(path).endsWith("hair-vocabulary.json")) throw denied("second write");
  const file = await fs.open(path, ...args);
  if (mode === "stale" && String(path).split(/[\\/]/).at(-1).startsWith(".current-")) {
    const pointer = join(dirname(path), "current.json");
    await fs.writeFile(pointer, (await fs.readFile(pointer, "utf8")) + " \n");
  }
  return file;
}
export async function rename(...args) { if (mode === "pointer") throw denied("pointer rename"); return fs.rename(...args); }
export async function rmdir(...args) { if (mode === "cleanup") throw denied("cleanup denied"); return fs.rmdir(...args); }
`;

test("output traversal is rejected and writes nothing outside", async () => {
	const fixture = await writeFixture();
	const parent = await makeDir("style-vocab-parent-");
	const outside = join(parent, "outside.txt");
	await writeFile(outside, "untouched");
	const target = [parent, "out", "..", "..", "outside-write"].join("\\");
	expect(target.split(/[\\/]/)).toContain("..");
	try {
		const run = await refresh(["--output", target, ...fixture.args]);
		expect(run.code).not.toBe(0);
		expect(run.stderr).toContain("rejected output path");
		expect(await readFile(outside, "utf8")).toBe("untouched");
		expect(run.stdout).not.toContain('"ok":true');
	} finally {
		await rm(parent, { recursive: true, force: true });
		await rm(fixture.dir, { recursive: true, force: true });
	}
});

async function makeDir(prefix: string) {
	const dir = join(
		tmpdir(),
		`${prefix}${process.pid}-${Math.random().toString(16).slice(2)}`,
	);
	await mkdir(dir, { recursive: true });
	return dir;
}

async function writeFixture(options: { sitemapLoc?: string } = {}) {
	const dir = await makeDir("style-vocab-fixture-");
	const taxonomy = `window.GAS = {"base":"","groups":[{"label":"Look","facets":["render"]}],"facets":{"render":{"label":"Rendering","slug":"rendering","values":["Pixel art","Realistic"]}},"cards":"cards-6"};\n`;
	const loc =
		options.sitemapLoc ??
		"https://gameartstyles.com/styles/rendering/pixel-art";
	const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset>${`<url><loc>${loc}</loc></url>`}</urlset>\n`;
	const sample = `<!doctype html><script type="application/ld+json">{"@type":"CollectionPage","url":"https://gameartstyles.com/styles/rendering/pixel-art","name":"Pixel art"}</script>\n`;
	await writeFile(join(dir, "taxonomy.js"), taxonomy);
	await writeFile(join(dir, "sitemap.xml"), sitemap);
	await writeFile(join(dir, "sample.html"), sample);
	return {
		dir,
		taxonomySha: createHash("sha256").update(taxonomy).digest("hex"),
		args: [
			"--taxonomy",
			join(dir, "taxonomy.js"),
			"--sitemap",
			join(dir, "sitemap.xml"),
			"--sample",
			join(dir, "sample.html"),
		],
	};
}

function refresh(
	args: string[],
	options: { env?: Record<string, string>; script?: string } = {},
) {
	const child = spawn(process.execPath, [options.script ?? script, ...args], {
		cwd: repoRoot,
		env: { ...process.env, ...options.env },
		stdio: ["ignore", "pipe", "pipe"],
	});
	let stdout = "";
	let stderr = "";
	child.stdout.setEncoding("utf8");
	child.stderr.setEncoding("utf8");
	child.stdout.on("data", (chunk) => {
		stdout += chunk;
	});
	child.stderr.on("data", (chunk) => {
		stderr += chunk;
	});
	return once(child, "close").then(([code]) => ({ code, stdout, stderr }));
}
