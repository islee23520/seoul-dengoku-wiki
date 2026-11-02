#!/usr/bin/env node

import { open, readFile, stat } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
	importOriginals,
	type OriginalPerson,
	OriginalStoreError,
	openOriginalsStore,
	readOriginalImage,
	readOriginalJson,
} from "./store.js";

const PayloadSchema = z
	.object({
		url: z.string().min(1),
		path: z.string().min(1),
		sha256: z.string().regex(/^[0-9a-f]{64}$/),
	})
	.strict();
const ManifestSchema = z
	.object({
		people: z.array(
			z
				.object({
					personId: z.string().min(1),
					characterId: z.string().min(1),
					name: z.string().min(1),
					detail: PayloadSchema,
					token: PayloadSchema,
					image: PayloadSchema,
				})
				.strict(),
		),
	})
	.strict();

type Command =
	| { readonly command: "help" }
	| {
			readonly command: "import";
			readonly manifest: string;
			readonly db: string;
	  }
	| { readonly command: "get"; readonly personId: string; readonly db: string }
	| {
			readonly command: "export";
			readonly personId: string;
			readonly kind: "detail" | "token" | "image";
			readonly output: string;
			readonly db: string;
			readonly revision?: number;
	  };

export class TypedCliError extends Error {
	constructor(
		readonly code:
			| "INVALID_ARGUMENTS"
			| "INVALID_INPUT"
			| "NOT_FOUND"
			| "IO_ERROR"
			| "CORRUPT_STORE"
			| "MIGRATION_REQUIRED",
		message: string,
	) {
		super(message);
		this.name = "TypedCliError";
	}
}

function parseArgs(args: readonly string[]): Command {
	if (args.length === 1 && (args[0] === "--help" || args[0] === "-h"))
		return { command: "help" };
	const verb = args[0];
	if (verb !== "import" && verb !== "get" && verb !== "export")
		throw new TypedCliError("INVALID_ARGUMENTS", "invalid command");
	const positionalCount = 2;
	if (args.length < positionalCount)
		throw new TypedCliError("INVALID_ARGUMENTS", "missing command argument");
	const positional = args.slice(1, positionalCount);
	const subject = positional[0];
	if (subject === undefined || !subject.trim())
		throw new TypedCliError("INVALID_ARGUMENTS", "missing command argument");
	const flags = new Map<string, string>();
	for (let index = positionalCount; index < args.length; index += 2) {
		const key = args[index];
		const value = args[index + 1];
		if (
			!key?.startsWith("--") ||
			value === undefined ||
			value.startsWith("--") ||
			!value.trim()
		)
			throw new TypedCliError(
				"INVALID_ARGUMENTS",
				"invalid or missing flag value",
			);
		if (flags.has(key))
			throw new TypedCliError("INVALID_ARGUMENTS", "duplicate flag");
		flags.set(key, value);
	}
	const allowed =
		verb === "import"
			? ["--db"]
			: verb === "get"
				? ["--db"]
				: ["--kind", "--output", "--db", "--revision"];
	if ([...flags.keys()].some((key) => !allowed.includes(key)))
		throw new TypedCliError("INVALID_ARGUMENTS", "unknown flag");
	const db = flags.get("--db");
	if (!db?.trim())
		throw new TypedCliError("INVALID_ARGUMENTS", "--db is required");
	if (verb === "import") return { command: "import", manifest: subject, db };
	if (verb === "get") return { command: "get", personId: subject, db };
	const kind = flags.get("--kind");
	const output = flags.get("--output");
	if (kind !== "detail" && kind !== "token" && kind !== "image")
		throw new TypedCliError(
			"INVALID_ARGUMENTS",
			"--kind must be detail, token, or image",
		);
	if (!output?.trim())
		throw new TypedCliError("INVALID_ARGUMENTS", "--output is required");
	const rawRevision = flags.get("--revision");
	if (rawRevision !== undefined && !/^[1-9][0-9]*$/.test(rawRevision))
		throw new TypedCliError(
			"INVALID_ARGUMENTS",
			"--revision must be a positive integer",
		);
	const revision = rawRevision === undefined ? undefined : Number(rawRevision);
	if (revision !== undefined && !Number.isSafeInteger(revision))
		throw new TypedCliError(
			"INVALID_ARGUMENTS",
			"--revision must be a positive integer",
		);
	return {
		command: "export",
		personId: subject,
		kind,
		output,
		db,
		...(revision === undefined ? {} : { revision }),
	};
}

async function loadManifest(path: string): Promise<readonly OriginalPerson[]> {
	const bytes = await readFile(path);
	const value: unknown = JSON.parse(bytes.toString("utf8"));
	const manifest = ManifestSchema.parse(value);
	for (const person of manifest.people) {
		for (const payload of [person.detail, person.token, person.image]) {
			if (
				isAbsolute(payload.path) ||
				payload.path.split(/[\\/]/).includes("..")
			)
				throw new TypedCliError(
					"INVALID_INPUT",
					"manifest source paths must be relative and stay within the manifest directory",
				);
		}
	}
	return Promise.all(
		manifest.people.map(async (person) => {
			const [detailBytes, tokenBytes, imageBytes] = await Promise.all([
				readFile(resolve(dirname(path), person.detail.path)),
				readFile(resolve(dirname(path), person.token.path)),
				readFile(resolve(dirname(path), person.image.path)),
			]);
			return {
				personId: person.personId,
				characterId: person.characterId,
				name: person.name,
				detail: {
					url: person.detail.url,
					bytes: detailBytes,
					sha256: person.detail.sha256,
				},
				token: {
					url: person.token.url,
					bytes: tokenBytes,
					sha256: person.token.sha256,
				},
				image: {
					url: person.image.url,
					bytes: imageBytes,
					sha256: person.image.sha256,
				},
			};
		}),
	);
}

function existingStore(path: string): DatabaseSync {
	return new DatabaseSync(path, { readOnly: true });
}

function identity(db: DatabaseSync, personId: string) {
	const row = db
		.prepare(
			"SELECT person_id, character_id, name FROM people WHERE person_id=?",
		)
		.get(personId);
	if (row === undefined)
		throw new TypedCliError("NOT_FOUND", "person not found");
	return z
		.object({
			person_id: z.string(),
			character_id: z.string(),
			name: z.string(),
		})
		.parse(row);
}

async function execute(command: Command): Promise<void> {
	if (command.command === "help") {
		process.stdout.write(
			"Usage: people-originals import <manifest> --db <path>\n       people-originals get <personId> --db <path>\n       people-originals export <personId> --kind <detail|token|image> --output <path> --db <path> [--revision <positive-int>]\n",
		);
		return;
	}
	if (command.command === "import") {
		const people = await loadManifest(command.manifest);
		const db = openOriginalsStore(command.db);
		try {
			importOriginals(db, people);
		} finally {
			db.close();
		}
		return;
	}
	const info = await stat(command.db);
	if (!info.isFile())
		throw new TypedCliError("IO_ERROR", "database path is not a file");
	const db = existingStore(command.db);
	try {
		const person = identity(db, command.personId);
		if (command.command === "get") {
			const sources = Object.fromEntries(
				(["detail", "token", "image"] as const).map((kind) => {
					const source =
						kind === "image"
							? readOriginalImage(db, command.personId)
							: readOriginalJson(db, command.personId, kind);
					if (source === null)
						throw new TypedCliError("NOT_FOUND", "person source not found");
					return [
						kind,
						{
							url: source.url,
							sha256: source.sha256,
							byteLength: source.bytes.byteLength,
							bytesBase64: Buffer.from(source.bytes).toString("base64"),
						},
					];
				}),
			);
			process.stdout.write(
				`${JSON.stringify({ personId: person.person_id, characterId: person.character_id, name: person.name, sources })}\n`,
			);
			return;
		}
		const source =
			command.kind === "image"
				? readOriginalImage(db, command.personId, command.revision)
				: readOriginalJson(
						db,
						command.personId,
						command.kind,
						command.revision,
					);
		if (source === null)
			throw new TypedCliError("NOT_FOUND", "person source revision not found");
		const handle = await open(command.output, "wx");
		try {
			await handle.writeFile(source.bytes);
		} finally {
			await handle.close();
		}
	} finally {
		db.close();
	}
}

function expectedError(error: unknown): TypedCliError | null {
	if (error instanceof TypedCliError) return error;
	if (error instanceof OriginalStoreError)
		return new TypedCliError(
			error.code === "CORRUPT_STORE" || error.code === "MIGRATION_REQUIRED"
				? error.code
				: "INVALID_INPUT",
			error.code === "MIGRATION_REQUIRED"
				? "versionless originals sidecar requires migration; run writable import with a validated manifest: people-originals import <manifest> --db <path>"
				: error.message,
		);
	if (error instanceof z.ZodError)
		return new TypedCliError(
			"INVALID_INPUT",
			"manifest or stored identity is invalid",
		);
	if (error instanceof SyntaxError)
		return new TypedCliError("INVALID_INPUT", "manifest JSON is invalid");
	if (
		error &&
		typeof error === "object" &&
		"code" in error &&
		typeof error.code === "string" &&
		[
			"ENOENT",
			"EISDIR",
			"EACCES",
			"ENOTDIR",
			"EEXIST",
			"SQLITE_CANTOPEN",
			"ERR_SQLITE_ERROR",
		].includes(error.code)
	)
		return new TypedCliError("IO_ERROR", "file or database operation failed");
	return null;
}

export async function main(
	args: readonly string[] = process.argv.slice(2),
): Promise<number> {
	try {
		await execute(parseArgs(args));
		return 0;
	} catch (error) {
		const known = expectedError(error);
		if (known === null) throw error;
		process.stderr.write(`${known.code}: ${known.message}\n`);
		return 1;
	}
}

const invokedPath = process.argv[1];
if (
	import.meta.main ||
	(invokedPath && invokedPath === fileURLToPath(import.meta.url))
)
	process.exitCode = await main();
