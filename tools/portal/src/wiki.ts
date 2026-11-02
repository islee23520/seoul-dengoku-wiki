import { parse } from "@babel/parser";
import type { Node } from "@babel/types";
import { z } from "zod";
import { hash } from "./sources.ts";
export class WikiError extends Error {
	constructor(
		readonly code: "WIKI_UNAVAILABLE" | "WIKI_INVALID_SOURCE" | "NOT_FOUND",
	) {
		super(code);
	}
}
const personSchema = z
	.object({
		id: z.string().regex(/^person-\d+$/),
		characterId: z.string().regex(/^K\d+$/),
		name: z.string().min(1),
		stateName: z.string().optional(),
		detailRoute: z.string(),
	})
	.passthrough()
	.refine((p) => p.detailRoute === `/people/${p.id}`);
function literal(node: Node | null | undefined): unknown {
	if (!node) throw new WikiError("WIKI_INVALID_SOURCE");
	switch (node.type) {
		case "StringLiteral":
		case "NumericLiteral":
		case "BooleanLiteral":
			return node.value;
		case "NullLiteral":
			return null;
		case "TemplateLiteral":
			if (node.expressions.length) throw new WikiError("WIKI_INVALID_SOURCE");
			return node.quasis[0]?.value.cooked;
		case "ArrayExpression":
			return node.elements.map(literal);
		case "ObjectExpression": {
			const result: Record<string, unknown> = {};
			for (const property of node.properties) {
				if (property.type !== "ObjectProperty" || property.computed)
					throw new WikiError("WIKI_INVALID_SOURCE");
				const key =
					property.key.type === "Identifier"
						? property.key.name
						: property.key.type === "StringLiteral"
							? property.key.value
							: null;
				if (key === null || Object.hasOwn(result, key) || key === "__proto__")
					throw new WikiError("WIKI_INVALID_SOURCE");
				result[key] = literal(property.value);
			}
			return result;
		}
		default:
			throw new WikiError("WIKI_INVALID_SOURCE");
	}
}
export function createWikiSource(baseUrl: string) {
	const base = new URL(baseUrl);
	const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(base.hostname);
	if (
		base.username ||
		base.password ||
		base.search ||
		base.hash ||
		base.pathname !== "/wiki/" ||
		(!loopback &&
			!["https://sss.linalab.io", "https://seoul-dengoku.linalab.io"].includes(
				base.origin,
			)) ||
		!["http:", "https:"].includes(base.protocol)
	)
		throw Error("INVALID_WIKI_BASE_URL");
	async function text(path: string) {
		const url = new URL(path, base);
		if (
			url.origin !== base.origin ||
			!url.pathname.startsWith("/wiki/") ||
			url.search ||
			url.hash
		)
			throw new WikiError("WIKI_INVALID_SOURCE");
		let response: Response;
		try {
			response = await fetch(url, {
				redirect: "error",
				signal: AbortSignal.timeout(10000),
			});
		} catch (error) {
			if (error instanceof TypeError || error instanceof DOMException)
				throw new WikiError("WIKI_UNAVAILABLE");
			throw error;
		}
		if (response.status === 404) throw new WikiError("NOT_FOUND");
		if (!response.ok) throw new WikiError("WIKI_UNAVAILABLE");
		const chunks: Uint8Array[] = [];
		let size = 0;
		try {
			if (response.body)
				for await (const chunk of response.body) {
					size += chunk.length;
					if (size > 2097152) throw new WikiError("WIKI_UNAVAILABLE");
					chunks.push(chunk);
				}
		} catch (error) {
			if (error instanceof WikiError) throw error;
			if (error instanceof TypeError || error instanceof DOMException)
				throw new WikiError("WIKI_UNAVAILABLE");
			throw error;
		}
		const bytes = Buffer.concat(chunks);
		return {
			text: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
			bytes,
			source: {
				kind: "live-wiki-http",
				url: url.href,
				sha256: hash(bytes),
				fetchedAt: new Date().toISOString(),
			},
		};
	}
	async function catalog() {
		const page = await text("people");
		const indexPath = page.text.match(
			/src="([^" ]*\/assets\/index-[\w-]+\.js)"/,
		)?.[1];
		if (!indexPath) throw new WikiError("WIKI_INVALID_SOURCE");
		const indexUrl = new URL(indexPath, base);
		if (
			indexUrl.origin !== base.origin ||
			!/^\/wiki\/assets\/index-[\w-]+\.js$/.test(indexUrl.pathname)
		)
			throw new WikiError("WIKI_INVALID_SOURCE");
		const index = await text(indexUrl.pathname);
		const path = index.text.match(/assets\/peopleCatalog-[\w-]+\.js/)?.[0];
		if (!path) throw new WikiError("WIKI_INVALID_SOURCE");
		const asset = await text(path);
		try {
			const ast = parse(asset.text, { sourceType: "module" });
			const declaration = ast.program.body.find(
				(n) => n.type === "VariableDeclaration",
			);
			if (declaration?.type !== "VariableDeclaration")
				throw new WikiError("WIKI_INVALID_SOURCE");
			const people = z
				.array(personSchema)
				.max(10000)
				.parse(literal(declaration.declarations[0]?.init));
			if (
				new Set(people.map((p) => p.id)).size !== people.length ||
				new Set(people.map((p) => p.characterId)).size !== people.length
			)
				throw new WikiError("WIKI_INVALID_SOURCE");
			return { people, source: asset.source };
		} catch (error) {
			if (error instanceof WikiError) throw error;
			if (error instanceof SyntaxError || error instanceof z.ZodError)
				throw new WikiError("WIKI_INVALID_SOURCE");
			throw error;
		}
	}
	async function detailWithBytes(id: string) {
		if (!/^person-\d+$/.test(id)) throw new WikiError("NOT_FOUND");
		const data = await catalog();
		const summary = data.people.find((p) => p.id === id);
		if (!summary) throw new WikiError("NOT_FOUND");
		const raw = await text(`person-details/${id}.json`);
		try {
			const detail = personSchema.parse(JSON.parse(raw.text));
			if (
				detail.id !== summary.id ||
				detail.characterId !== summary.characterId ||
				detail.name !== summary.name
			)
				throw new WikiError("WIKI_INVALID_SOURCE");
			return {
				personId: detail.id,
				characterId: detail.characterId,
				name: detail.name,
				detail,
				source: raw.source,
				bytes: raw.bytes,
			};
		} catch (error) {
			if (error instanceof WikiError) throw error;
			if (error instanceof SyntaxError || error instanceof z.ZodError)
				throw new WikiError("WIKI_INVALID_SOURCE");
			throw error;
		}
	}
	async function tokenWithBytes(
		id: string,
		currentDetail?: { personId: string; characterId: string; name: string },
	) {
		if (!/^person-\d+$/.test(id)) throw new WikiError("NOT_FOUND");
		const detail = currentDetail ?? (await detailWithBytes(id));
		if (detail.personId !== id) throw new WikiError("WIKI_INVALID_SOURCE");
		const raw = await text(`portrait-tokens/${id}.json`);
		try {
			const token = z
				.object({
					personId: z.string(),
					characterId: z.string(),
					name: z.string(),
				})
				.passthrough()
				.parse(JSON.parse(raw.text));
			if (
				token.personId !== id ||
				token.characterId !== detail.characterId ||
				token.name !== detail.name
			)
				throw new WikiError("WIKI_INVALID_SOURCE");
			return {
				personId: token.personId,
				characterId: token.characterId,
				name: token.name,
				token,
				bytes: raw.bytes,
				source: raw.source,
			};
		} catch (error) {
			if (error instanceof SyntaxError || error instanceof z.ZodError)
				throw new WikiError("WIKI_INVALID_SOURCE");
			throw error;
		}
	}
	return {
		async list(query: { q: string; limit: number; cursor: number }) {
			const data = await catalog();
			const q = query.q.trim().toLocaleLowerCase("ko");
			const filtered = data.people.filter(
				(p) =>
					!q ||
					[p.name, p.id, p.characterId, p.stateName ?? ""].some((v) =>
						v.toLocaleLowerCase("ko").includes(q),
					),
			);
			return {
				people: filtered
					.slice(query.cursor, query.cursor + query.limit)
					.map((p) => ({
						personId: p.id,
						characterId: p.characterId,
						name: p.name,
						stateName: p.stateName ?? "",
						detailRoute: p.detailRoute,
					})),
				total: filtered.length,
				nextCursor:
					query.cursor + query.limit < filtered.length
						? String(query.cursor + query.limit)
						: null,
				source: data.source,
			};
		},
		detailWithBytes,
		tokenWithBytes,
		async detail(id: string) {
			const { bytes: _bytes, ...detail } = await detailWithBytes(id);
			return detail;
		},
	};
}
