import { afterEach, describe, expect, it } from "bun:test";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { OriginalStoreError, readOriginalJson } from "../src/store.js";

const folders: string[] = [];

afterEach(() => {
	for (const folder of folders.splice(0))
		rmSync(folder, { recursive: true, force: true });
});

describe("legacy sidecar selection", () => {
	it("requires explicit writable migration before read-only default lookup", () => {
		const folder = mkdtempSync(join(tmpdir(), "people-legacy-selection-"));
		folders.push(folder);
		const path = join(folder, "legacy.sqlite");
		const legacy = new DatabaseSync(path);
		legacy.exec(`
			CREATE TABLE people (person_id TEXT PRIMARY KEY, character_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL);
			CREATE TABLE detail_revisions (person_id TEXT NOT NULL, import_sequence INTEGER NOT NULL, url TEXT NOT NULL, sha256 TEXT NOT NULL, bytes BLOB NOT NULL);
			CREATE TABLE token_revisions (person_id TEXT NOT NULL, import_sequence INTEGER NOT NULL, url TEXT NOT NULL, sha256 TEXT NOT NULL, bytes BLOB NOT NULL);
			CREATE TABLE image_revisions (person_id TEXT NOT NULL, import_sequence INTEGER NOT NULL, url TEXT NOT NULL, sha256 TEXT NOT NULL, bytes BLOB NOT NULL);
			INSERT INTO people VALUES ('legacy-person', 'legacy-character', 'Legacy');
			INSERT INTO detail_revisions VALUES ('legacy-person', 1, 'legacy:detail', 'detail-hash', X'7B7D');
			INSERT INTO token_revisions VALUES ('legacy-person', 1, 'legacy:token', 'token-hash', X'7B7D');
			INSERT INTO image_revisions VALUES ('legacy-person', 1, 'legacy:image', 'image-hash', X'00');
		`);
		legacy.close();

		const readonly = new DatabaseSync(path, { readOnly: true });
		try {
			try {
				readOriginalJson(readonly, "legacy-person", "detail");
				expect.unreachable("legacy default lookup should require migration");
			} catch (error) {
				if (!(error instanceof OriginalStoreError)) throw error;
				expect(error.code).toBe("MIGRATION_REQUIRED");
			}
		} finally {
			readonly.close();
		}
	});

	it("allows explicit history reads from legacy schema without selection table", () => {
		const folder = mkdtempSync(join(tmpdir(), "people-history-selection-"));
		folders.push(folder);
		const db = new DatabaseSync(join(folder, "history.sqlite"));
		db.exec(`
			CREATE TABLE people (person_id TEXT PRIMARY KEY, character_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL);
			CREATE TABLE detail_revisions (person_id TEXT NOT NULL, import_sequence INTEGER NOT NULL, url TEXT NOT NULL, sha256 TEXT NOT NULL, bytes BLOB NOT NULL);
			INSERT INTO people VALUES ('legacy-person', 'legacy-character', 'Legacy');
			INSERT INTO detail_revisions VALUES ('legacy-person', 1, 'legacy:detail', 'detail-hash', X'7B7D');
		`);
		try {
			expect(readOriginalJson(db, "legacy-person", "detail", 1)?.sha256).toBe(
				"detail-hash",
			);
		} finally {
			db.close();
		}
	});

	it("fails as corrupt when an existing person lacks a current pointer", () => {
		const folder = mkdtempSync(join(tmpdir(), "people-missing-selection-"));
		folders.push(folder);
		const db = new DatabaseSync(join(folder, "missing.sqlite"));
		db.exec(`
			CREATE TABLE people (person_id TEXT PRIMARY KEY, character_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL);
			CREATE TABLE detail_revisions (person_id TEXT NOT NULL, import_sequence INTEGER NOT NULL, url TEXT NOT NULL, sha256 TEXT NOT NULL, bytes BLOB NOT NULL);
			CREATE TABLE token_revisions (person_id TEXT NOT NULL, import_sequence INTEGER NOT NULL, url TEXT NOT NULL, sha256 TEXT NOT NULL, bytes BLOB NOT NULL);
			CREATE TABLE image_revisions (person_id TEXT NOT NULL, import_sequence INTEGER NOT NULL, url TEXT NOT NULL, sha256 TEXT NOT NULL, bytes BLOB NOT NULL);
			CREATE TABLE current_originals (person_id TEXT PRIMARY KEY, detail_sha256 TEXT NOT NULL, token_sha256 TEXT NOT NULL, image_sha256 TEXT NOT NULL);
			INSERT INTO people VALUES ('legacy-person', 'legacy-character', 'Legacy');
			INSERT INTO detail_revisions VALUES ('legacy-person', 1, 'legacy:detail', 'detail-hash', X'7B7D');
		`);
		try {
			expect(() => readOriginalJson(db, "legacy-person", "detail")).toThrow(
				"current original selection is missing",
			);
		} finally {
			db.close();
		}
	});

	it("CLI JavaScript prints one migration diagnostic without modifying the legacy DB", async () => {
		const folder = mkdtempSync(join(tmpdir(), "people-legacy-process-"));
		folders.push(folder);
		const path = join(folder, "legacy.sqlite");
		const legacy = new DatabaseSync(path);
		legacy.exec(`
			CREATE TABLE people (person_id TEXT PRIMARY KEY, character_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL);
			CREATE TABLE detail_revisions (person_id TEXT NOT NULL, import_sequence INTEGER NOT NULL, url TEXT NOT NULL, sha256 TEXT NOT NULL, bytes BLOB NOT NULL);
			CREATE TABLE token_revisions (person_id TEXT NOT NULL, import_sequence INTEGER NOT NULL, url TEXT NOT NULL, sha256 TEXT NOT NULL, bytes BLOB NOT NULL);
			CREATE TABLE image_revisions (person_id TEXT NOT NULL, import_sequence INTEGER NOT NULL, url TEXT NOT NULL, sha256 TEXT NOT NULL, bytes BLOB NOT NULL);
			INSERT INTO people VALUES ('legacy-person', 'legacy-character', 'Legacy');
		`);
		legacy.close();
		const result = await new Promise<{
			code: number;
			stdout: string;
			stderr: string;
		}>((resolveResult, reject) => {
			const child = spawn(
				process.execPath,
				[
					join(import.meta.dir, "../dist/cli.js"),
					"get",
					"legacy-person",
					"--db",
					path,
				],
				{ stdio: ["ignore", "pipe", "pipe"] },
			);
			let stdout = "";
			let stderr = "";
			child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
				stdout += chunk;
			});
			child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
				stderr += chunk;
			});
			const timeout = setTimeout(() => child.kill(), 5000);
			child.once("error", (error) => {
				clearTimeout(timeout);
				reject(error);
			});
			child.once("close", (code) => {
				clearTimeout(timeout);
				resolveResult({ code: code ?? 1, stdout, stderr });
			});
		});
		expect(result.code).toBe(1);
		expect(result.stdout).toBe("");
		expect(result.stderr.trim().split("\n")).toHaveLength(1);
		expect(result.stderr).toContain("MIGRATION_REQUIRED");
		expect(result.stderr).toContain("validated manifest");
		const readonly = new DatabaseSync(path, { readOnly: true });
		try {
			expect(
				readonly
					.prepare(
						"SELECT count(*) AS count FROM sqlite_master WHERE type='table' AND name='current_originals'",
					)
					.get(),
			).toEqual({ count: 0 });
		} finally {
			readonly.close();
		}
	});
});
