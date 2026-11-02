import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import {
	type OriginalPerson,
	OriginalStoreError,
	type RevisionPayload,
} from "./store.js";

const RowSchema = z.object({
	url: z.string(),
	sha256: z.string(),
	bytes: z.instanceof(Uint8Array),
	import_sequence: z.number().int().positive(),
});

export function initializeCurrentSelection(db: DatabaseSync): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS current_originals (
			person_id TEXT PRIMARY KEY REFERENCES people(person_id),
			detail_sha256 TEXT NOT NULL,
			token_sha256 TEXT NOT NULL,
			image_sha256 TEXT NOT NULL
		);
	`);
	db.exec(`
		INSERT INTO current_originals(person_id, detail_sha256, token_sha256, image_sha256)
		SELECT token.person_id, detail.sha256, token.sha256, token_image.sha256
		FROM token_revisions AS token
		JOIN detail_revisions AS detail
			ON detail.person_id = token.person_id
			AND detail.import_sequence = (SELECT MAX(d.import_sequence) FROM detail_revisions AS d WHERE d.person_id = token.person_id)
		JOIN image_revisions AS token_image
			ON token_image.person_id = token.person_id
			AND token_image.sha256 = json_extract(CAST(token.bytes AS TEXT), '$.image.sha256')
		WHERE token.import_sequence = (SELECT MAX(t.import_sequence) FROM token_revisions AS t WHERE t.person_id = token.person_id)
		ON CONFLICT(person_id) DO NOTHING;
	`);
}

export function writeCurrentSelection(
	db: DatabaseSync,
	record: OriginalPerson,
): void {
	db.prepare(`
				INSERT INTO current_originals(person_id, detail_sha256, token_sha256, image_sha256)
				VALUES (?, ?, ?, ?)
				ON CONFLICT(person_id) DO UPDATE SET
					detail_sha256=excluded.detail_sha256,
					token_sha256=excluded.token_sha256,
					image_sha256=excluded.image_sha256
			`).run(
		record.personId,
		record.detail.sha256,
		record.token.sha256,
		record.image.sha256,
	);
}

export function readSelectedRevision(
	db: DatabaseSync,
	table: "detail_revisions" | "token_revisions" | "image_revisions",
	personId: string,
	revision?: number,
): RevisionPayload | null {
	const hasCurrentTable = db
		.prepare(
			"SELECT 1 AS found FROM sqlite_master WHERE type='table' AND name='current_originals'",
		)
		.get();
	if (revision === undefined && hasCurrentTable === undefined) {
		throw new OriginalStoreError(
			"MIGRATION_REQUIRED",
			"legacy originals store requires writable import migration",
		);
	}
	const selectedHash =
		revision === undefined
			? db
					.prepare(
						`SELECT ${table === "detail_revisions" ? "detail_sha256" : table === "token_revisions" ? "token_sha256" : "image_sha256"} AS sha256 FROM current_originals WHERE person_id=?`,
					)
					.get(personId)
			: undefined;
	const row =
		revision === undefined && selectedHash !== undefined
			? db
					.prepare(
						`SELECT url, sha256, bytes, import_sequence FROM ${table} WHERE person_id=? AND sha256=?`,
					)
					.get(
						personId,
						z.object({ sha256: z.string() }).parse(selectedHash).sha256,
					)
			: revision === undefined
				? (() => {
						const person = db
							.prepare("SELECT 1 AS found FROM people WHERE person_id=?")
							.get(personId);
						if (person !== undefined)
							throw new OriginalStoreError(
								"CORRUPT_STORE",
								"current original selection is missing for existing person",
							);
						return undefined;
					})()
				: db
						.prepare(
							`SELECT url, sha256, bytes, import_sequence FROM ${table} WHERE person_id=? AND import_sequence=?`,
						)
						.get(personId, revision);
	if (row === undefined) return null;
	const parsed = RowSchema.safeParse(row);
	if (!parsed.success) {
		throw new OriginalStoreError(
			"CORRUPT_STORE",
			"stored revision row is invalid",
		);
	}
	return {
		url: parsed.data.url,
		bytes: parsed.data.bytes,
		sha256: parsed.data.sha256,
		sequence: parsed.data.import_sequence,
	};
}
