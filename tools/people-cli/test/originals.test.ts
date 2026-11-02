import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { deflateSync } from "node:zlib";
import { z } from "zod";
import {
	DetailIdentitySchema,
	importOriginals,
	OriginalPersonSchema,
	openOriginalsStore,
	readOriginalImage,
	readOriginalJson,
	TokenIdentitySchema,
} from "../src/store.js";

const CountRowSchema = z.object({ count: z.number() });
const PersonIdRowSchema = z.object({ person_id: z.string() });
const folders: string[] = [];
const sha256 = (bytes: Uint8Array): string =>
	createHash("sha256").update(bytes).digest("hex");

function makeStore(): DatabaseSync {
	const directory = mkdtempSync(join(tmpdir(), "people-originals-"));
	folders.push(directory);
	return openOriginalsStore(join(directory, "originals.sqlite"));
}

function person(
	personId: string,
	characterId: string,
	name: string,
	revision: string,
) {
	const detail = {
		id: personId,
		name,
		detailRoute: `/people/${personId}`,
		familyTree: { personId: characterId },
		revision,
	};
	const imageBytes = pngFixture(revision === "second" ? 2 : 1);
	const token = {
		personId,
		characterId,
		name,
		image: { sha256: sha256(imageBytes) },
		generationContract: { pose: `pose-${revision}` },
		slots: [{ slot: `slot-${revision}` }],
	};
	const detailBytes = Buffer.from(JSON.stringify(detail));
	const tokenBytes = Buffer.from(JSON.stringify(token));
	return OriginalPersonSchema.parse({
		personId,
		characterId,
		name,
		detail: {
			url: `https://example.test/person-details/${personId}.json`,
			bytes: detailBytes,
			sha256: sha256(detailBytes),
		},
		token: {
			url: `https://example.test/portrait-tokens/${personId}.json`,
			bytes: tokenBytes,
			sha256: sha256(tokenBytes),
		},
		image: {
			url: `https://example.test/portraits/${personId}.png`,
			bytes: imageBytes,
			sha256: sha256(imageBytes),
		},
	});
}

function pngFixture(revision: number): Buffer {
	const pixel = Buffer.from([0, revision, 2, 3, 255]);
	const chunk = (type: string, data: Buffer): Buffer => {
		const label = Buffer.from(type);
		const length = Buffer.alloc(4);
		length.writeUInt32BE(data.length);
		const crc = Buffer.alloc(4);
		crc.writeUInt32BE(crc32(Buffer.concat([label, data])));
		return Buffer.concat([length, label, data, crc]);
	};
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(1, 0);
	ihdr.writeUInt32BE(1, 4);
	ihdr[8] = 8;
	ihdr[9] = 6;
	const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
	return Buffer.concat([
		signature,
		chunk("IHDR", ihdr),
		chunk("IDAT", deflateSync(pixel)),
		chunk("IEND", Buffer.alloc(0)),
	]);
}

function crc32(bytes: Buffer): number {
	let crc = 0xffffffff;
	for (const byte of bytes) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit += 1) {
			crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
		}
	}
	return (crc ^ 0xffffffff) >>> 0;
}

afterEach(() => {
	for (const folder of folders.splice(0)) {
		rmSync(folder, { recursive: true, force: true });
	}
});

beforeAll(() => {
	const first = person("person-fixture", "K-fixture", "Fixture", "first");
	const second = person("person-fixture", "K-fixture", "Fixture", "second");
	expect(first.detail.sha256).not.toBe(second.detail.sha256);
	expect(first.token.sha256).not.toBe(second.token.sha256);
	expect(first.image.sha256).not.toBe(second.image.sha256);
});

describe("standalone people originals contract", () => {
	it("round-trips detail, token, and PNG bytes with source URLs and hashes", () => {
		const db = makeStore();
		try {
			const record = person("person-1003", "K1003", "조재표", "first");
			importOriginals(db, [record]);
			expect(
				readPayload(readOriginalJson(db, record.personId, "detail")),
			).toEqual(record.detail);
			expect(
				readPayload(readOriginalJson(db, record.personId, "token")),
			).toEqual(record.token);
			expect(readPayload(readOriginalImage(db, record.personId))).toEqual(
				record.image,
			);
		} finally {
			db.close();
		}
	});

	it("rejects an image hash mismatch and rolls back all rows", () => {
		const db = makeStore();
		try {
			const record = person("person-1004", "K1004", "이연", "first");
			record.image.sha256 = "0".repeat(64);
			expect(() => importOriginals(db, [record])).toThrow(
				/image hash mismatch/,
			);
			expect(db.prepare("SELECT count(*) AS count FROM people").get()).toEqual({
				count: 0,
			});
		} finally {
			db.close();
		}
	});

	it("rejects a detail payload identity mismatch", () => {
		const db = makeStore();
		try {
			const record = person("person-1007", "K1007", "김연규", "first");
			const detail = DetailIdentitySchema.parse(
				JSON.parse(record.detail.bytes.toString()),
			);
			record.detail.bytes = Buffer.from(
				JSON.stringify({ ...detail, id: "person-else" }),
			);
			record.detail.sha256 = sha256(record.detail.bytes);
			expect(() => importOriginals(db, [record])).toThrow(/identity mismatch/);
		} finally {
			db.close();
		}
	});

	it("rejects a token payload identity mismatch", () => {
		const db = makeStore();
		try {
			const record = person("person-1008", "K1008", "민웅기", "first");
			const token = TokenIdentitySchema.parse(
				JSON.parse(record.token.bytes.toString()),
			);
			token.characterId = "K-other";
			record.token.bytes = Buffer.from(JSON.stringify(token));
			record.token.sha256 = sha256(record.token.bytes);
			expect(() => importOriginals(db, [record])).toThrow(/identity mismatch/);
		} finally {
			db.close();
		}
	});

	it("rejects token image SHA mismatch against original PNG bytes", () => {
		const db = makeStore();
		try {
			const record = person("person-1008", "K1008", "민웅기", "first");
			const token = TokenIdentitySchema.parse(
				JSON.parse(record.token.bytes.toString()),
			);
			const mismatchedToken = {
				...token,
				image: { sha256: "0".repeat(64) },
			};
			record.token.bytes = Buffer.from(JSON.stringify(mismatchedToken));
			record.token.sha256 = sha256(record.token.bytes);
			expect(() => importOriginals(db, [record])).toThrow(
				/token image hash mismatch/,
			);
		} finally {
			db.close();
		}
	});

	it("rejects detail and token source hash mismatches", () => {
		const db = makeStore();
		try {
			const detail = person("person-0998", "K998", "이일섭", "first");
			detail.detail.sha256 = "0".repeat(64);
			expect(() => importOriginals(db, [detail])).toThrow(
				/detail source hash mismatch/,
			);
			const token = person("person-0998", "K998", "이일섭", "first");
			token.token.sha256 = "0".repeat(64);
			expect(() => importOriginals(db, [token])).toThrow(
				/token source hash mismatch/,
			);
		} finally {
			db.close();
		}
	});

	it("keeps repeated detail, token, and image revisions idempotent", () => {
		const db = makeStore();
		try {
			const record = person("person-1009", "K1009", "신종목", "first");
			importOriginals(db, [record]);
			importOriginals(db, [record]);
			expect(countRows(db, "detail_revisions")).toBe(1);
			expect(countRows(db, "token_revisions")).toBe(1);
			expect(countRows(db, "image_revisions")).toBe(1);
		} finally {
			db.close();
		}
	});

	it("retains historical detail, token, and image revisions", () => {
		const db = makeStore();
		try {
			const first = person("person-1009", "K1009", "신종목", "first");
			const second = person("person-1009", "K1009", "신종목", "second");
			importOriginals(db, [first]);
			importOriginals(db, [second]);
			expect(countRows(db, "detail_revisions")).toBe(2);
			expect(countRows(db, "token_revisions")).toBe(2);
			expect(countRows(db, "image_revisions")).toBe(2);
		} finally {
			db.close();
		}
	});

	it("defines latest reads by increasing import sequence", () => {
		const db = makeStore();
		try {
			const first = person("person-1009", "K1009", "신종목", "first");
			const second = person("person-1009", "K1009", "신종목", "second");
			importOriginals(db, [first]);
			importOriginals(db, [second]);
			expect(readOriginalJson(db, first.personId, "detail")?.sha256).toBe(
				second.detail.sha256,
			);
			expect(readOriginalJson(db, first.personId, "token")?.sha256).toBe(
				second.token.sha256,
			);
			expect(readOriginalImage(db, first.personId)?.sha256).toBe(
				second.image.sha256,
			);
		} finally {
			db.close();
		}
	});

	it("can select a retained historical revision by import sequence", () => {
		const db = makeStore();
		try {
			const first = person("person-1009", "K1009", "신종목", "first");
			const second = person("person-1009", "K1009", "신종목", "second");
			importOriginals(db, [first]);
			importOriginals(db, [second]);
			expect(readOriginalJson(db, first.personId, "detail", 1)?.sha256).toBe(
				first.detail.sha256,
			);
			expect(readOriginalJson(db, first.personId, "token", 1)?.sha256).toBe(
				first.token.sha256,
			);
			expect(readOriginalImage(db, first.personId, 1)?.sha256).toBe(
				first.image.sha256,
			);
		} finally {
			db.close();
		}
	});

	it("imports a subset without deleting other people", () => {
		const db = makeStore();
		try {
			importOriginals(db, [
				person("person-existing", "K-existing", "Existing", "first"),
			]);
			importOriginals(db, [person("person-1003", "K1003", "조재표", "first")]);
			expect(countRows(db, "people")).toBe(2);
			expect(personExists(db, "person-1003")).toBe(true);
			expect(personExists(db, "person-existing")).toBe(true);
		} finally {
			db.close();
		}
	});
});

function countRows(db: DatabaseSync, table: string): number {
	return CountRowSchema.parse(
		db.prepare(`SELECT count(*) AS count FROM ${table}`).get(),
	).count;
}

function personExists(db: DatabaseSync, personId: string): boolean {
	return PersonIdRowSchema.safeParse(
		db.prepare("SELECT person_id FROM people WHERE person_id=?").get(personId),
	).success;
}

function readPayload(value: ReturnType<typeof readOriginalImage>): {
	readonly url: string;
	readonly bytes: Uint8Array;
	readonly sha256: string;
} | null {
	if (value === null) return null;
	return { url: value.url, bytes: value.bytes, sha256: value.sha256 };
}
