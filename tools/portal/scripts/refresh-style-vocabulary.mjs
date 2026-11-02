/**
 * Refresh the style vocabulary from permitted gameartstyles SSR documents.
 *
 * Allowed fetches, and only these:
 *   https://gameartstyles.com/taxonomy.js
 *   https://gameartstyles.com/sitemap.xml
 *   one https://gameartstyles.com/styles/<facet>/<slug> page, read only for a
 *   <script type="application/ld+json"> object (SSR embedded JSON).
 *
 * /api/ and every other origin are rejected before any request. Redirects are
 * rejected. JSON is parsed with JSON.parse. Nothing is evaluated.
 *
 *   bun run tools/portal/scripts/refresh-style-vocabulary.mjs --output <dir>
 *
 * --output is required. Readers read current.json ONCE, then both JSON files
 * from its generation directory (seoul.style-vocabulary-publication/v1).
 * Flat files are read-only bootstrap inputs, never refreshed in place.
 * Writers exclusively mkdir .refresh-lock before reading the prior generation.
 * A collision fails immediately; no stale-lock stealing or retries.
 * Each UUID generation is exclusively created; both files are flushed before
 * one same-directory pointer rename publishes them. Failures retain unpublished
 * artifacts for inspection; no recursive cleanup or rollback touches foreign data.
 * This is process-failure atomic publication, not a power-loss durability claim.
 * --taxonomy, --sitemap, and --sample are optional local stand-ins for tests.
 * Passing any of them does not contact the network.
 */
import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rmdir } from "node:fs/promises";
import { join, resolve } from "node:path";

const ORIGIN = "https://gameartstyles.com";
const TAXONOMY_URL = `${ORIGIN}/taxonomy.js`;
const SITEMAP_URL = `${ORIGIN}/sitemap.xml`;
const STYLE_SCHEMA = "seoul.style-vocabulary/v1";
const HAIR_SCHEMA = "seoul.hair-vocabulary/v1";

const outputFlag = argument("--output");
if (!outputFlag) {
	fail("refresh-style-vocabulary: --output <dir> is required");
}
if (outputFlag.split(/[\\/]/).includes("..")) {
	fail("refresh-style-vocabulary: rejected output path");
}
const outputDir = resolve(outputFlag);
const localTaxonomy = optionalPath("--taxonomy");
const localSitemap = optionalPath("--sitemap");
const localSample = optionalPath("--sample");
if (
	(localTaxonomy || localSitemap || localSample) &&
	!(localTaxonomy && localSitemap && localSample)
) {
	fail(
		"refresh-style-vocabulary: --taxonomy, --sitemap, and --sample must be passed together",
	);
}

let lock;

try {
	await mkdir(outputDir, { recursive: true });
	lock = join(outputDir, ".refresh-lock");
	await mkdir(lock);
	lock = { path: lock };
	const previousPointer = await readIfExists(join(outputDir, "current.json"));
	let previousDir = outputDir;
	if (previousPointer) {
		const pointer = JSON.parse(previousPointer.toString("utf8"));
		if (pointer.schema !== "seoul.style-vocabulary-publication/v1" ||
			!/^generation-[0-9a-f-]{36}$/.test(pointer.generation)) {
			throw new Error("invalid current.json publication pointer");
		}
		previousDir = join(outputDir, pointer.generation);
	}
	const previousStyle = await readIfExists(join(previousDir, "style-vocabulary.json"));
	const previousHair = await readIfExists(join(previousDir, "hair-vocabulary.json"));
	const taxonomyBytes = localTaxonomy
		? await readFile(localTaxonomy)
		: await fetchPermitted(TAXONOMY_URL, "text/javascript");
	const sitemapBytes = localSitemap
		? await readFile(localSitemap)
		: await fetchPermitted(SITEMAP_URL, "application/xml,text/xml");
	const taxonomy = parseTaxonomy(taxonomyBytes);
	const routes = parseStyleRoutes(sitemapBytes);
	const sampleRoute = routes.values().next().value;
	if (!sampleRoute)
		fail("refresh-style-vocabulary: sitemap listed no /styles/ routes");
	const sampleUrl = `${ORIGIN}${sampleRoute}`;
	const sampleBytes = localSample
		? await readFile(localSample)
		: await fetchPermitted(sampleUrl, "text/html");
	const embedded = parseEmbeddedJsonLd(sampleBytes, sampleRoute);
	const style = buildStyleDocument({
		taxonomy,
		taxonomyBytes,
		sitemapBytes,
		routes,
		sampleUrl,
		sampleBytes,
		embedded,
		previous: previousStyle,
	});
	const hair = preserveHair(previousHair);
	const generation = await publish(outputDir, style, hair, previousPointer);
	process.stdout.write(
		`${JSON.stringify({
			ok: true,
			output: outputDir,
			pointer: "current.json",
			generation,
			values: style.counts.values,
			siteUsed: style.counts.siteUsed,
			unused: style.counts.unused,
			uniqueIds: style.counts.uniqueIds,
			sample: sampleUrl,
		})}\n`,
	);
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	process.stderr.write(`refresh-style-vocabulary: ${message}\n`);
	process.exitCode = 1;
} finally {
	if (lock?.path) {
		try {
			await rmdir(lock.path);
		} catch (error) {
			process.stderr.write(`refresh-style-vocabulary: lock retained: ${error.message}\n`);
		}
	}
}

function argument(flag) {
	const index = process.argv.indexOf(flag);
	if (index < 0) return undefined;
	const value = process.argv[index + 1];
	if (!value || value.startsWith("--"))
		fail(`refresh-style-vocabulary: ${flag} needs a value`);
	return value;
}

function optionalPath(flag) {
	const value = argument(flag);
	return value === undefined ? undefined : resolve(value);
}

async function readIfExists(path) {
	try {
		return await readFile(path);
	} catch (error) {
		if (error && error.code === "ENOENT") return undefined;
		throw error;
	}
}

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function assertPermittedUrl(value) {
	let url;
	try {
		url = new URL(value);
	} catch {
		throw new Error(`rejected url: ${value}`);
	}
	if (url.origin !== ORIGIN) throw new Error(`rejected origin: ${url.origin}`);
	if (url.username || url.password || url.hash)
		throw new Error(`rejected url: ${value}`);
	const path = url.pathname;
	if (path === "/api" || path.startsWith("/api/"))
		throw new Error(`rejected /api/ url: ${value}`);
	const allowed =
		path === "/taxonomy.js" ||
		path === "/sitemap.xml" ||
		/^\/styles\/[a-z0-9-]+\/[a-z0-9-]+$/.test(path);
	if (!allowed) throw new Error(`rejected url: ${value}`);
	if (url.search && path !== "/taxonomy.js" && path !== "/sitemap.xml") {
		throw new Error(`rejected url query: ${value}`);
	}
	return url;
}

async function fetchPermitted(value, accept) {
	const url = assertPermittedUrl(value);
	const response = await fetch(url, {
		method: "GET",
		redirect: "manual",
		headers: { accept },
	});
	if (response.status >= 300 && response.status < 400) {
		throw new Error(
			`rejected redirect from ${url.pathname}: ${response.status}`,
		);
	}
	if (!response.ok)
		throw new Error(`fetch failed ${url.pathname}: ${response.status}`);
	const bytes = Buffer.from(await response.arrayBuffer());
	if (bytes.length === 0) throw new Error(`empty body: ${url.pathname}`);
	return bytes;
}

function parseTaxonomy(bytes) {
	const text = bytes.toString("utf8");
	const match = text.match(/^window\.GAS\s*=\s*(\{.*\});\s*$/s);
	if (!match)
		throw new Error("taxonomy.js is not a window.GAS JSON assignment");
	const gas = JSON.parse(match[1]);
	if (!gas || typeof gas !== "object" || Array.isArray(gas)) {
		throw new Error("taxonomy.js JSON is not an object");
	}
	if (
		!Array.isArray(gas.groups) ||
		!gas.facets ||
		typeof gas.facets !== "object"
	) {
		throw new Error("taxonomy.js is missing groups or facets");
	}
	const seen = new Set();
	for (const group of gas.groups) {
		if (
			!group ||
			typeof group.label !== "string" ||
			!Array.isArray(group.facets)
		) {
			throw new Error("taxonomy.js group is malformed");
		}
		for (const key of group.facets) {
			if (
				typeof key !== "string" ||
				seen.has(key) ||
				!Object.hasOwn(gas.facets, key)
			) {
				throw new Error(`taxonomy.js facet key is missing or repeated: ${key}`);
			}
			seen.add(key);
		}
	}
	for (const key of Object.keys(gas.facets)) {
		if (!seen.has(key))
			throw new Error(`taxonomy.js facet is outside groups: ${key}`);
		const facet = gas.facets[key];
		if (
			!facet ||
			typeof facet.label !== "string" ||
			typeof facet.slug !== "string" ||
			!/^[a-z0-9-]+$/.test(facet.slug) ||
			!Array.isArray(facet.values) ||
			facet.values.length === 0 ||
			facet.values.some(
				(value) => typeof value !== "string" || value.length === 0,
			)
		) {
			throw new Error(`taxonomy.js facet is malformed: ${key}`);
		}
	}
	return gas;
}

function parseStyleRoutes(bytes) {
	const text = bytes.toString("utf8");
	if (!text.includes("<urlset") && !text.includes("<sitemapindex")) {
		throw new Error("sitemap.xml is not an XML sitemap");
	}
	const routes = new Set();
	for (const loc of text.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)) {
		const raw = loc[1].replaceAll("&amp;", "&");
		const url = assertPermittedUrl(raw);
		if (url.pathname.startsWith("/styles/")) routes.add(url.pathname);
	}
	if (routes.size === 0)
		throw new Error("sitemap.xml listed no permitted /styles/ routes");
	return routes;
}

function parseEmbeddedJsonLd(bytes, route) {
	const text = bytes.toString("utf8");
	const blocks = [
		...text.matchAll(
			/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
		),
	];
	if (blocks.length === 0)
		throw new Error(`SSR page has no embedded JSON-LD: ${route}`);
	const parsed = [];
	for (const block of blocks) {
		parsed.push(JSON.parse(block[1].trim()));
	}
	const page = parsed.find(
		(item) => item && item["@type"] === "CollectionPage",
	);
	if (!page || typeof page.url !== "string") {
		throw new Error(`SSR page JSON-LD has no CollectionPage url: ${route}`);
	}
	const pageUrl = assertPermittedUrl(page.url);
	if (pageUrl.pathname !== route) {
		throw new Error(
			`SSR JSON-LD url ${pageUrl.pathname} does not match ${route}`,
		);
	}
	return page;
}

function slugify(label) {
	return label
		.normalize("NFKC")
		.replaceAll("&", " and ")
		.replace(/[^A-Za-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.toLowerCase();
}

function sha256(bytes) {
	return createHash("sha256").update(bytes).digest("hex");
}

function buildStyleDocument({
	taxonomy,
	taxonomyBytes,
	sitemapBytes,
	routes,
	sampleUrl,
	sampleBytes,
	embedded,
	previous,
}) {
	const retrievedAt = new Date().toISOString();
	const groupOf = new Map();
	for (const group of taxonomy.groups) {
		for (const key of group.facets) groupOf.set(key, group.label);
	}
	const values = [];
	for (const [facetKey, facet] of Object.entries(taxonomy.facets)) {
		facet.values.forEach((label, index) => {
			const slug = slugify(label);
			const route = `/styles/${facet.slug}/${slug}`;
			values.push({
				id: `${facet.slug}/${slug}`,
				facetKey,
				facetSlug: facet.slug,
				facetLabel: facet.label,
				group: groupOf.get(facetKey),
				label,
				slug,
				index,
				route,
				siteUse: routes.has(route) ? "site-used" : "unused",
				trigger: { contract: "unknown", words: [] },
			});
		});
	}
	const ids = new Set(values.map((value) => value.id));
	if (ids.size !== values.length)
		throw new Error("composite style ids are not unique");
	const siteUsed = values.filter(
		(value) => value.siteUse === "site-used",
	).length;
	const unused = values.length - siteUsed;
	const orphanRoutes = [...routes].filter(
		(route) => !values.some((value) => value.route === route),
	);
	if (orphanRoutes.length > 0) {
		throw new Error(`sitemap route is not in taxonomy.js: ${orphanRoutes[0]}`);
	}
	const previousRetrieved = previousRetrievedAt(previous);
	if (previousRetrieved && previousRetrieved > retrievedAt) {
		throw new Error("previous vocabulary timestamp is newer than this refresh");
	}
	const taxonomyHash = sha256(taxonomyBytes);
	const sitemapHash = sha256(sitemapBytes);
	// Values and counts consume taxonomy + sitemap, not sampled JSON-LD.
	const counts = {
		facets: Object.keys(taxonomy.facets).length,
		values: values.length,
		uniqueLabels: new Set(values.map((value) => value.label)).size,
		uniqueIds: ids.size,
		siteUsed,
		unused,
	};
	if (previous) {
		const prior = JSON.parse(previous.toString("utf8"));
		const priorTaxonomy = prior.sources?.find(
			(source) => source.role === "taxonomy",
		);
		const priorSitemap = prior.sources?.find(
			(source) => source.role === "sitemap",
		);
		if (
			priorTaxonomy?.sha256 === taxonomyHash &&
			priorSitemap?.sha256 === sitemapHash
		) {
			const drifted =
				JSON.stringify(prior.values) !== JSON.stringify(values) ||
				Object.entries(counts).some(([key, value]) => prior.counts?.[key] !== value);
			if (drifted)
				throw new Error(
					"taxonomy and sitemap sha256 match the previous file but derived values or counts differ",
				);
		}
		if (
			priorSitemap &&
			priorSitemap.sha256 !== sitemapHash &&
			priorSitemap.retrievedAt > retrievedAt
		) {
			throw new Error("sitemap timestamp is newer than its hash");
		}
	}
	return {
		schema: STYLE_SCHEMA,
		axis: "style",
		system: "gameartstyles",
		observation: {
			status: "dated-observation",
			notPermanent: true,
			observedAt: retrievedAt,
			note: `${siteUsed} site-used and ${unused} unused values are what taxonomy.js plus sitemap.xml showed at observedAt. A later refresh may change both sets.`,
		},
		permission: {
			status: "unverified",
			use: "reference-vocabulary-only",
			imageReuse: "forbidden-until-separately-permitted",
			training: "forbidden-until-separately-permitted",
			note: "No reuse grant was fetched. Vocabulary text is a reference. Do not scrape or train on site images.",
		},
		trigger: {
			defaultContract: "unknown",
			noneMeans:
				"An adapter declared trigger.contract none has no trigger tokens.",
			unknownMeans:
				"No adapter contract was observed. unknown is not none, and a style label is not a trigger.",
		},
		sources: [
			{
				role: "taxonomy",
				url: TAXONOMY_URL,
				retrievedAt,
				sha256: taxonomyHash,
				bytes: taxonomyBytes.length,
			},
			{
				role: "sitemap",
				url: SITEMAP_URL,
				retrievedAt,
				sha256: sitemapHash,
				bytes: sitemapBytes.length,
			},
			{
				role: "ssr-jsonld",
				url: sampleUrl,
				retrievedAt,
				sha256: sha256(sampleBytes),
				bytes: sampleBytes.length,
				jsonLdType: embedded["@type"],
				jsonLdUrl: embedded.url,
			},
		],
		counts: {
			...counts,
			compositeIdNote:
				"id is facetSlug/valueSlug. Label text may repeat. Counts are this observation, not a permanent census.",
		},
		groups: taxonomy.groups.map((group) => ({
			label: group.label,
			facets: [...group.facets],
		})),
		facets: Object.entries(taxonomy.facets).map(([key, facet]) => ({
			key,
			label: facet.label,
			slug: facet.slug,
			group: groupOf.get(key),
			valueCount: facet.values.length,
		})),
		values,
	};
}

function previousRetrievedAt(bytes) {
	if (!bytes) return undefined;
	let parsed;
	try {
		parsed = JSON.parse(bytes.toString("utf8"));
	} catch {
		throw new Error("previous style-vocabulary.json is not JSON");
	}
	const observedAt = parsed?.observation?.observedAt;
	if (typeof observedAt !== "string" || Number.isNaN(Date.parse(observedAt))) {
		throw new Error(
			"previous style-vocabulary.json has no observedAt timestamp",
		);
	}
	return observedAt;
}

function preserveHair(bytes) {
	if (!bytes) {
		return {
			schema: HAIR_SCHEMA,
			axis: "hair",
			observation: {
				status: "dated-observation",
				notPermanent: true,
				observedAt: new Date().toISOString(),
				note: "No hair sheet was refreshed. Hair labels are reference vocabulary and are never scraped from images.",
			},
			permission: {
				status: "unverified",
				use: "reference-vocabulary-only",
				imageReuse: "forbidden-until-separately-permitted",
				training: "forbidden-until-separately-permitted",
			},
			trigger: { defaultContract: "unknown", words: [] },
			sources: [],
			counts: { entries: 0, printedLabels: 0, unlabeled: 0 },
			entries: [],
		};
	}
	const parsed = JSON.parse(bytes.toString("utf8"));
	if (parsed.schema !== HAIR_SCHEMA)
		throw new Error("previous hair vocabulary schema mismatch");
	return parsed;
}

async function publish(dir, style, hair, previousPointer) {
	const generation = `generation-${randomUUID()}`;
	const generationDir = join(dir, generation);
	await mkdir(generationDir);
	for (const [name, document] of [
		["style-vocabulary.json", style],
		["hair-vocabulary.json", hair],
	]) {
		const bytes = `${JSON.stringify(document, null, "\t")}\n`;
		JSON.parse(bytes);
		await writeExclusive(join(generationDir, name), bytes);
	}
	const pointerPath = join(dir, "current.json");
	const pending = join(dir, `.current-${randomUUID()}.json`);
	await writeExclusive(pending, `${JSON.stringify({
		schema: "seoul.style-vocabulary-publication/v1",
		generation,
	})}\n`);
	const current = await readIfExists(pointerPath);
	if ((current?.toString("utf8")) !== (previousPointer?.toString("utf8"))) {
		throw new Error("publication pointer changed while writer lock held");
	}
	await rename(pending, pointerPath);
	return generation;
}

async function writeExclusive(path, bytes) {
	const file = await open(path, "wx");
	try {
		await file.writeFile(bytes);
		await file.sync();
	} finally {
		await file.close();
	}
}
