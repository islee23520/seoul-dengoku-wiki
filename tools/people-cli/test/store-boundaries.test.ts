import { afterEach, describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { deflateSync } from "node:zlib";
import { z } from "zod";
import {
	importOriginals,
	openOriginalsStore,
	readOriginalJson,
} from "../src/store.js";

const folders: string[] = [];
const sha256 = (bytes: Uint8Array): string =>
	createHash("sha256").update(bytes).digest("hex");

function makeStore(): DatabaseSync {
	const directory = mkdtempSync(join(tmpdir(), "people-originals-boundary-"));
	folders.push(directory);
	return openOriginalsStore(join(directory, "originals.sqlite"));
}

function person(personId: string, characterId: string, revision: number) {
	const image = png(revision);
	const detailBytes = Buffer.from(
		JSON.stringify({
			id: personId,
			name: "Boundary fixture",
			detailRoute: `/people/${personId}`,
			familyTree: { personId: characterId },
			revision,
		}),
	);
	const tokenBytes = Buffer.from(
		JSON.stringify({
			personId,
			characterId,
			name: "Boundary fixture",
			image: { sha256: sha256(image) },
			generationContract: { revision },
			slots: [],
		}),
	);
	return {
		personId,
		characterId,
		name: "Boundary fixture",
		detail: {
			url: `detail-${revision}`,
			bytes: detailBytes,
			sha256: sha256(detailBytes),
		},
		token: {
			url: `token-${revision}`,
			bytes: tokenBytes,
			sha256: sha256(tokenBytes),
		},
		image: { url: `image-${revision}`, bytes: image, sha256: sha256(image) },
	};
}

function png(revision: number): Buffer {
	const chunk = (type: string, data: Buffer): Buffer => {
		const label = Buffer.from(type);
		const length = Buffer.alloc(4);
		length.writeUInt32BE(data.length);
		const crc = Buffer.alloc(4);
		crc.writeUInt32BE(crc32(Buffer.concat([label, data])));
		return Buffer.concat([length, label, data, crc]);
	};
	const header = Buffer.alloc(13);
	header.writeUInt32BE(1, 0);
	header.writeUInt32BE(1, 4);
	header[8] = 8;
	header[9] = 6;
	return Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		chunk("IHDR", header),
		chunk("IDAT", deflateSync(Buffer.from([0, revision, 2, 3, 255]))),
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
	for (const folder of folders.splice(0))
		rmSync(folder, { recursive: true, force: true });
});

describe("originals store boundaries", () => {
	it("retains same-person revisions in one batch and selects the last", () => {
		const db = makeStore();
		try {
			const first = person("person-batch", "K-batch", 1);
			const second = person("person-batch", "K-batch", 2);
			importOriginals(db, [first, second]);
			expect(
				db.prepare("SELECT count(*) AS count FROM detail_revisions").get(),
			).toEqual({ count: 2 });
			expect(readOriginalJson(db, first.personId, "detail")?.sha256).toBe(
				second.detail.sha256,
			);
		} finally {
			db.close();
		}
	});

	it("rejects permanent character identity conflicts and rolls back the batch", () => {
		const db = makeStore();
		try {
			const first = person("person-conflict", "K-original", 1);
			const conflict = person("person-conflict", "K-other", 2);
			expect(() =>
				importOriginals(db, [
					person("person-before", "K-before", 1),
					first,
					conflict,
				]),
			).toThrow(/identity conflict/);
			expect(db.prepare("SELECT count(*) AS count FROM people").get()).toEqual({
				count: 0,
			});
		} finally {
			db.close();
		}
	});

	it("requires the canonical detail route for the person", () => {
		const db = makeStore();
		try {
			const record = person("person-route", "K-route", 1);
			const parsed: unknown = JSON.parse(record.detail.bytes.toString());
			const detail = z.looseObject({ detailRoute: z.string() }).parse(parsed);
			detail.detailRoute = "/people/someone-else";
			record.detail.bytes = Buffer.from(JSON.stringify(detail));
			record.detail.sha256 = sha256(record.detail.bytes);
			expect(() => importOriginals(db, [record])).toThrow(/identity mismatch/);
		} finally {
			db.close();
		}
	});

	it("throws on malformed stored revision rows instead of returning missing", () => {
		const db = makeStore();
		try {
			const record = person("person-corrupt", "K-corrupt", 1);
			importOriginals(db, [record]);
			db.exec("PRAGMA ignore_check_constraints = ON");
			db.prepare(
				"UPDATE detail_revisions SET import_sequence=0 WHERE person_id=?",
			).run(record.personId);
			expect(() => readOriginalJson(db, record.personId, "detail")).toThrow();
		} finally {
			db.close();
		}
	});
});
