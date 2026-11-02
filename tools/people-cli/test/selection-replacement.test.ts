import { afterEach, describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import {
	initializeCurrentSelection,
	readSelectedRevision,
	writeCurrentSelection,
} from "../src/current-selection.js";
import {
	importOriginals,
	type OriginalPerson,
	OriginalStoreError,
	openOriginalsStore,
} from "../src/store.js";

const directories: string[] = [];
const digest = (bytes: Uint8Array): string =>
	createHash("sha256").update(bytes).digest("hex");
const imageA = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==",
	"base64",
);
const imageB = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z/D/PwAHgAL/3/KkWQAAAABJRU5ErkJggg==",
	"base64",
);
function record(label: string, image: Buffer): OriginalPerson {
	const detail = Buffer.from(
		JSON.stringify({
			id: "person-u01",
			name: "Selection",
			detailRoute: "/people/person-u01",
			familyTree: { personId: "K-u01" },
			label,
		}),
	);
	const token = Buffer.from(
		JSON.stringify({
			personId: "person-u01",
			characterId: "K-u01",
			name: "Selection",
			image: { sha256: digest(image) },
			generationContract: { label },
			slots: [],
		}),
	);
	return {
		personId: "person-u01",
		characterId: "K-u01",
		name: "Selection",
		detail: { url: "fixture:detail", bytes: detail, sha256: digest(detail) },
		token: { url: "fixture:token", bytes: token, sha256: digest(token) },
		image: { url: "fixture:image", bytes: image, sha256: digest(image) },
	};
}
const first = record("A", imageA);
const second = record("B", imageB);
const third = record("new-token-A", imageA);
function fixture(mode: "selected" | "empty" | "legacy" = "selected") {
	const directory = mkdtempSync(join(tmpdir(), "people-u01-"));
	directories.push(directory);
	const path = join(directory, "owned.sqlite");
	const db = openOriginalsStore(path);
	importOriginals(db, [first, second, third]);
	if (mode === "empty") db.exec("DELETE FROM current_originals");
	if (mode === "legacy") db.exec("DROP TABLE current_originals");
	return { db, path, directory };
}
function history(db: DatabaseSync) {
	return ["detail_revisions", "token_revisions", "image_revisions"].map(
		(table) =>
			db
				.prepare(
					`SELECT person_id, import_sequence, url, sha256, hex(bytes) AS bytes FROM ${table} ORDER BY import_sequence`,
				)
				.all(),
	);
}
function selected(db: DatabaseSync) {
	return db
		.prepare("SELECT * FROM current_originals WHERE person_id='person-u01'")
		.get();
}
function storeError(action: () => unknown, code: OriginalStoreError["code"]) {
	let error: unknown;
	try {
		action();
	} catch (caught) {
		error = caught;
	}
	expect(error).toBeInstanceOf(OriginalStoreError);
	if (error instanceof OriginalStoreError) expect(error.code).toBe(code);
}
afterEach(() => {
	for (const directory of directories.splice(0))
		rmSync(directory, { recursive: true, force: true });
});

describe("fresh current-selection owner behavioral RED", () => {
	for (const [table, payload, sequence] of [
		["detail_revisions", third.detail, 3],
		["token_revisions", third.token, 3],
		["image_revisions", third.image, 1],
	] as const) {
		it(`reads selected ${table} from A/B/new-token-A`, () => {
			const { db } = fixture();
			try {
				expect(readSelectedRevision(db, table, "person-u01")).toEqual({
					...payload,
					sequence,
				});
			} finally {
				db.close();
			}
		});
		it(`retains explicit revision 2 of ${table} on legacy schema`, () => {
			const { db } = fixture("legacy");
			try {
				const expected =
					table === "detail_revisions"
						? second.detail
						: table === "token_revisions"
							? second.token
							: second.image;
				expect(readSelectedRevision(db, table, "person-u01", 2)).toEqual({
					...expected,
					sequence: 2,
				});
			} finally {
				db.close();
			}
		});
		it(`requires migration for default ${table} lookup without schema writes`, () => {
			const { db, path } = fixture("legacy");
			db.close();
			const before = readFileSync(path);
			const readonly = new DatabaseSync(path, { readOnly: true });
			try {
				storeError(
					() => readSelectedRevision(readonly, table, "person-u01"),
					"MIGRATION_REQUIRED",
				);
			} finally {
				readonly.close();
				expect(readFileSync(path)).toEqual(before);
			}
		});
		it(`reports missing pointer for existing person in ${table}`, () => {
			const { db } = fixture("empty");
			try {
				storeError(
					() => readSelectedRevision(db, table, "person-u01"),
					"CORRUPT_STORE",
				);
			} finally {
				db.close();
			}
		});
		it(`rejects malformed stored ${table} row`, () => {
			const { db } = fixture();
			try {
				db.exec(
					`UPDATE ${table} SET import_sequence=0 WHERE sha256=(SELECT ${table === "detail_revisions" ? "detail_sha256" : table === "token_revisions" ? "token_sha256" : "image_sha256"} FROM current_originals WHERE person_id='person-u01')`,
				);
				storeError(
					() => readSelectedRevision(db, table, "person-u01"),
					"CORRUPT_STORE",
				);
			} finally {
				db.close();
			}
		});
	}
	it("writes accepted A/B/new-token-A tuple without adding history", () => {
		const { db } = fixture("empty");
		try {
			const before = history(db);
			for (const value of [first, second, third])
				writeCurrentSelection(db, value);
			expect(selected(db)).toEqual({
				person_id: "person-u01",
				detail_sha256: third.detail.sha256,
				token_sha256: third.token.sha256,
				image_sha256: digest(imageA),
			});
			expect(history(db)).toEqual(before);
		} finally {
			db.close();
		}
	});
	it("reselects retained older tuple on repeated import without new history", () => {
		const { db } = fixture();
		try {
			const before = history(db);
			writeCurrentSelection(db, first);
			writeCurrentSelection(db, first);
			expect(selected(db)).toEqual({
				person_id: "person-u01",
				detail_sha256: first.detail.sha256,
				token_sha256: first.token.sha256,
				image_sha256: digest(imageA),
			});
			expect(history(db)).toEqual(before);
		} finally {
			db.close();
		}
	});
	it("additively creates legacy selection table", () => {
		const { db } = fixture("legacy");
		try {
			const before = history(db);
			initializeCurrentSelection(db);
			expect(
				db
					.prepare(
						"SELECT name FROM sqlite_master WHERE name='current_originals'",
					)
					.get(),
			).toEqual({ name: "current_originals" });
			expect(history(db)).toEqual(before);
		} finally {
			db.close();
		}
	});
	it("backfills missing pointer from latest token bound image A", () => {
		const { db } = fixture("empty");
		try {
			const before = history(db);
			initializeCurrentSelection(db);
			expect(selected(db)).toEqual({
				person_id: "person-u01",
				detail_sha256: third.detail.sha256,
				token_sha256: third.token.sha256,
				image_sha256: digest(imageA),
			});
			expect(history(db)).toEqual(before);
		} finally {
			db.close();
		}
	});
	it("does not overwrite an existing older accepted tuple on backfill", () => {
		const { db } = fixture();
		try {
			db.prepare(
				"UPDATE current_originals SET detail_sha256=?,token_sha256=?,image_sha256=?",
			).run(first.detail.sha256, first.token.sha256, first.image.sha256);
			const before = history(db);
			initializeCurrentSelection(db);
			expect(selected(db)).toEqual({
				person_id: "person-u01",
				detail_sha256: first.detail.sha256,
				token_sha256: first.token.sha256,
				image_sha256: digest(imageA),
			});
			expect(history(db)).toEqual(before);
		} finally {
			db.close();
		}
	});
	it("changes pointer inside caller transaction and restores after SQL failure rollback", () => {
		const { db } = fixture();
		const before = selected(db);
		db.exec("BEGIN");
		try {
			writeCurrentSelection(db, second);
			expect(selected(db)).toEqual({
				person_id: "person-u01",
				detail_sha256: second.detail.sha256,
				token_sha256: second.token.sha256,
				image_sha256: digest(imageB),
			});
			expect(() =>
				db.exec("INSERT INTO people VALUES ('conflict','K-u01','Other')"),
			).toThrow();
		} finally {
			db.exec("ROLLBACK");
			expect(selected(db)).toEqual(before);
			db.close();
		}
	});
	for (const [label, revision] of [
		["unknown person", undefined],
		["missing explicit revision", 99],
	] as const) {
		it(`returns absent selection for ${label}`, () => {
			const { db } = fixture();
			try {
				expect(
					readSelectedRevision(
						db,
						"image_revisions",
						revision === undefined ? "absent" : "person-u01",
						revision,
					),
				).toBeNull();
			} finally {
				db.close();
			}
		});
	}
	it("returns absent when selected hash has no retained row", () => {
		const { db } = fixture();
		try {
			db.exec("UPDATE current_originals SET image_sha256='missing'");
			expect(
				readSelectedRevision(db, "image_revisions", "person-u01"),
			).toBeNull();
		} finally {
			db.close();
		}
	});
});

async function cli(args: string[]) {
	const child = Bun.spawn(
		[process.execPath, join(import.meta.dir, "../dist/cli.js"), ...args],
		{ stdout: "pipe", stderr: "pipe" },
	);
	const timer = setTimeout(() => child.kill(), 5000);
	try {
		const [stdout, stderr, code] = await Promise.all([
			new Response(child.stdout).text(),
			new Response(child.stderr).text(),
			child.exited,
		]);
		return { stdout, stderr, code };
	} finally {
		clearTimeout(timer);
	}
}
describe("unchanged real emitted consumer guards (not fresh RED)", () => {
	it("get emits exact A image and new token; revision 2 export emits B", async () => {
		const { db, path, directory } = fixture();
		db.close();
		const result = await cli(["get", "person-u01", "--db", path]);
		expect(result.code).toBe(0);
		const output = z
			.object({
				sources: z.object({
					image: z.object({ bytesBase64: z.string(), sha256: z.string() }),
					token: z.object({ bytesBase64: z.string() }),
				}),
			})
			.parse(JSON.parse(result.stdout));
		expect(Buffer.from(output.sources.image.bytesBase64, "base64")).toEqual(
			imageA,
		);
		expect(output.sources.image.sha256).toBe(digest(imageA));
		expect(Buffer.from(output.sources.token.bytesBase64, "base64")).toEqual(
			Buffer.from(third.token.bytes),
		);
		const out = join(directory, "B.png");
		expect(
			(
				await cli([
					"export",
					"person-u01",
					"--kind",
					"image",
					"--revision",
					"2",
					"--output",
					out,
					"--db",
					path,
				])
			).code,
		).toBe(0);
		expect(readFileSync(out)).toEqual(imageB);
	});
	for (const command of ["get", "export"] as const)
		it(`${command} emits migration code without changing legacy DB`, async () => {
			const { db, path, directory } = fixture("legacy");
			db.close();
			const before = readFileSync(path);
			const args =
				command === "get"
					? ["get", "person-u01", "--db", path]
					: [
							"export",
							"person-u01",
							"--kind",
							"image",
							"--output",
							join(directory, "held.png"),
							"--db",
							path,
						];
			const result = await cli(args);
			expect(result.code).toBe(1);
			expect(result.stdout).toBe("");
			expect(result.stderr.startsWith("MIGRATION_REQUIRED:")).toBe(true);
			expect(readFileSync(path)).toEqual(before);
		});
	it("explicit legacy export emits B without migration", async () => {
		const { db, path, directory } = fixture("legacy");
		db.close();
		const before = readFileSync(path);
		const out = join(directory, "B.png");
		expect(
			(
				await cli([
					"export",
					"person-u01",
					"--kind",
					"image",
					"--revision",
					"2",
					"--output",
					out,
					"--db",
					path,
				])
			).code,
		).toBe(0);
		expect(readFileSync(out)).toEqual(imageB);
		expect(readFileSync(path)).toEqual(before);
	});
	it("get emits CORRUPT_STORE for missing pointer", async () => {
		const { db, path } = fixture("empty");
		db.close();
		const result = await cli(["get", "person-u01", "--db", path]);
		expect(result.code).toBe(1);
		expect(result.stdout).toBe("");
		expect(result.stderr.startsWith("CORRUPT_STORE:")).toBe(true);
	});
	it("validated writable import backfills legacy schema without altering history", () => {
		const { db, path } = fixture("legacy");
		const before = history(db);
		db.close();
		const writable = openOriginalsStore(path);
		try {
			importOriginals(writable, [third]);
			expect(selected(writable)).toEqual({
				person_id: "person-u01",
				detail_sha256: third.detail.sha256,
				token_sha256: third.token.sha256,
				image_sha256: digest(imageA),
			});
			expect(history(writable)).toEqual(before);
		} finally {
			writable.close();
		}
	});
});
