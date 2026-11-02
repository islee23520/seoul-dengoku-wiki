import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import {
	initializeCurrentSelection,
	readSelectedRevision,
	writeCurrentSelection,
} from "./current-selection.js";

export const DetailIdentitySchema = z.object({
	id: z.string(),
	name: z.string(),
	detailRoute: z.string(),
	familyTree: z.object({ personId: z.string() }),
});

export const TokenIdentitySchema = z.object({
	personId: z.string(),
	characterId: z.string(),
	name: z.string(),
	image: z.object({ sha256: z.string() }),
	generationContract: z.record(z.string(), z.unknown()),
	slots: z.unknown(),
});

export const OriginalPersonSchema = z.object({
	personId: z.string(),
	characterId: z.string(),
	name: z.string(),
	detail: z.object({
		url: z.string(),
		bytes: z.instanceof(Uint8Array),
		sha256: z.string(),
	}),
	token: z.object({
		url: z.string(),
		bytes: z.instanceof(Uint8Array),
		sha256: z.string(),
	}),
	image: z.object({
		url: z.string(),
		bytes: z.instanceof(Uint8Array),
		sha256: z.string(),
	}),
});

export interface OriginalPayload {
	readonly url: string;
	readonly bytes: Uint8Array;
	readonly sha256: string;
}

export interface DetailIdentity {
	readonly id: string;
	readonly name: string;
	readonly detailRoute: string;
	readonly familyTree: { readonly personId: string };
}

export interface TokenIdentity {
	readonly personId: string;
	readonly characterId: string;
	readonly name: string;
	readonly image: { readonly sha256: string };
	readonly generationContract: Readonly<Record<string, unknown>>;
	readonly slots: unknown;
}

export interface RevisionPayload extends OriginalPayload {
	readonly sequence: number;
}

export interface OriginalPerson {
	readonly personId: string;
	readonly characterId: string;
	readonly name: string;
	readonly detail: OriginalPayload;
	readonly token: OriginalPayload;
	readonly image: OriginalPayload;
}

export type JsonSource = "detail" | "token";

const HashSchema = z.string().regex(/^[0-9a-f]{64}$/);

export class OriginalStoreError extends Error {
	readonly code:
		| "INVALID_INPUT"
		| "IDENTITY_CONFLICT"
		| "CORRUPT_STORE"
		| "MIGRATION_REQUIRED";

	constructor(
		code:
			| "INVALID_INPUT"
			| "IDENTITY_CONFLICT"
			| "CORRUPT_STORE"
			| "MIGRATION_REQUIRED",
		message: string,
	) {
		super(message);
		this.name = "OriginalStoreError";
		this.code = code;
	}
}

function digest(bytes: Uint8Array): string {
	return createHash("sha256").update(bytes).digest("hex");
}

function validate(person: OriginalPerson): OriginalPerson {
	const record = OriginalPersonSchema.parse(person);
	for (const source of ["detail", "token", "image"] as const) {
		if (
			!HashSchema.safeParse(record[source].sha256).success ||
			digest(record[source].bytes) !== record[source].sha256
		) {
			const label =
				source === "image"
					? "image hash mismatch"
					: `${source} source hash mismatch`;
			throw new OriginalStoreError("INVALID_INPUT", label);
		}
	}
	let detail: DetailIdentity;
	let token: TokenIdentity;
	try {
		const detailValue = JSON.parse(
			new TextDecoder("utf-8", { fatal: true }).decode(record.detail.bytes),
		);
		detail = DetailIdentitySchema.parse(detailValue);
		const tokenValue = JSON.parse(
			new TextDecoder("utf-8", { fatal: true }).decode(record.token.bytes),
		);
		token = TokenIdentitySchema.parse(tokenValue);
	} catch (error) {
		if (
			!(error instanceof SyntaxError) &&
			!(error instanceof TypeError) &&
			!(error instanceof z.ZodError)
		) {
			throw error;
		}
		throw new OriginalStoreError(
			"INVALID_INPUT",
			"detail or token payload is invalid",
		);
	}
	const matches =
		detail.id === record.personId &&
		detail.name === record.name &&
		detail.detailRoute === `/people/${record.personId}` &&
		detail.familyTree.personId === record.characterId &&
		token.personId === record.personId &&
		token.characterId === record.characterId &&
		token.name === record.name;
	if (!matches)
		throw new OriginalStoreError("INVALID_INPUT", "payload identity mismatch");
	if (token.image.sha256 !== record.image.sha256) {
		throw new OriginalStoreError("INVALID_INPUT", "token image hash mismatch");
	}
	return record;
}

export function openOriginalsStore(path: string): DatabaseSync {
	const db = new DatabaseSync(path);
	db.exec(`
		PRAGMA foreign_keys = ON;
		CREATE TABLE IF NOT EXISTS people (
			person_id TEXT PRIMARY KEY,
			character_id TEXT NOT NULL UNIQUE,
			name TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS detail_revisions (
			person_id TEXT NOT NULL REFERENCES people(person_id),
			import_sequence INTEGER NOT NULL,
			url TEXT NOT NULL,
			sha256 TEXT NOT NULL,
			bytes BLOB NOT NULL,
			PRIMARY KEY (person_id, sha256),
			UNIQUE (person_id, import_sequence)
		);
		CREATE TABLE IF NOT EXISTS token_revisions (
			person_id TEXT NOT NULL REFERENCES people(person_id),
			import_sequence INTEGER NOT NULL,
			url TEXT NOT NULL,
			sha256 TEXT NOT NULL,
			bytes BLOB NOT NULL,
			PRIMARY KEY (person_id, sha256),
			UNIQUE (person_id, import_sequence)
		);
		CREATE TABLE IF NOT EXISTS image_revisions (
			person_id TEXT NOT NULL REFERENCES people(person_id),
			import_sequence INTEGER NOT NULL,
			url TEXT NOT NULL,
			sha256 TEXT NOT NULL,
			bytes BLOB NOT NULL,
			PRIMARY KEY (person_id, sha256),
			UNIQUE (person_id, import_sequence)
		);
	`);
	initializeCurrentSelection(db);
	return db;
}

export function importOriginals(
	db: DatabaseSync,
	people: readonly OriginalPerson[],
): void {
	const records = z
		.array(OriginalPersonSchema)
		.parse(people)
		.map((person) => validate(person));
	const identities = new Map<string, { characterId: string; name: string }>();
	for (const record of records) {
		const previous = identities.get(record.personId);
		if (
			previous &&
			(previous.characterId !== record.characterId ||
				previous.name !== record.name)
		) {
			throw new OriginalStoreError(
				"IDENTITY_CONFLICT",
				"permanent identity conflict",
			);
		}
		identities.set(record.personId, {
			characterId: record.characterId,
			name: record.name,
		});
	}
	db.exec("BEGIN");
	try {
		const personQuery = db.prepare(
			"SELECT character_id, name FROM people WHERE person_id=?",
		);
		const insertPerson = db.prepare(
			"INSERT INTO people(person_id, character_id, name) VALUES (?, ?, ?) ON CONFLICT(person_id) DO NOTHING",
		);
		for (const record of records) {
			const existing = personQuery.get(record.personId);
			if (existing !== undefined) {
				const identity = z
					.object({ character_id: z.string(), name: z.string() })
					.parse(existing);
				if (
					identity.character_id !== record.characterId ||
					identity.name !== record.name
				) {
					throw new OriginalStoreError(
						"IDENTITY_CONFLICT",
						"permanent identity conflict",
					);
				}
			} else {
				insertPerson.run(record.personId, record.characterId, record.name);
			}
			for (const source of ["detail", "token", "image"] as const) {
				const table =
					source === "detail"
						? "detail_revisions"
						: source === "token"
							? "token_revisions"
							: "image_revisions";
				const exists = db
					.prepare(
						`SELECT 1 AS found FROM ${table} WHERE person_id=? AND sha256=?`,
					)
					.get(record.personId, record[source].sha256);
				if (exists !== undefined) continue;
				const sequence = db
					.prepare(
						`SELECT COALESCE(MAX(import_sequence), 0) + 1 AS next FROM ${table} WHERE person_id=?`,
					)
					.get(record.personId);
				const next = z
					.object({ next: z.number().int().positive() })
					.parse(sequence).next;
				db.prepare(
					`INSERT INTO ${table}(person_id, import_sequence, url, sha256, bytes) VALUES (?, ?, ?, ?, ?)`,
				).run(
					record.personId,
					next,
					record[source].url,
					record[source].sha256,
					record[source].bytes,
				);
			}
			writeCurrentSelection(db, record);
		}
		db.exec("COMMIT");
	} catch (error) {
		db.exec("ROLLBACK");
		throw error;
	}
}

export function readOriginalJson(
	db: DatabaseSync,
	personId: string,
	source: JsonSource,
	revision?: number,
): RevisionPayload | null {
	const table = source === "detail" ? "detail_revisions" : "token_revisions";
	return readSelectedRevision(db, table, personId, revision);
}

export function readOriginalImage(
	db: DatabaseSync,
	personId: string,
	revision?: number,
): RevisionPayload | null {
	return readSelectedRevision(db, "image_revisions", personId, revision);
}
