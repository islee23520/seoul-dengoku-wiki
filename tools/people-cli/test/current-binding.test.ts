import { afterEach, describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { deflateSync } from "node:zlib";
import {
	importOriginals,
	openOriginalsStore,
	readOriginalImage,
	readOriginalJson,
} from "../src/store.js";

const folders: string[] = [];
const sha256 = (bytes: Uint8Array): string =>
	createHash("sha256").update(bytes).digest("hex");

function pngFixture(value: number): Buffer {
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
	return Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		chunk("IHDR", ihdr),
		chunk("IDAT", deflateSync(Buffer.from([0, value, 0, 0, 255]))),
		chunk("IEND", Buffer.alloc(0)),
	]);
}

function crc32(bytes: Buffer): number {
	let crc = 0xffffffff;
	for (const byte of bytes) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit += 1)
			crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
	}
	return (crc ^ 0xffffffff) >>> 0;
}

function person(
	revision: string,
	imageBytes: Buffer,
	personId = "person-current-binding",
	characterId = "K-current-binding",
) {
	const name = "Binding Fixture";
	const detailBytes = Buffer.from(
		JSON.stringify({
			id: personId,
			name,
			detailRoute: `/people/${personId}`,
			familyTree: { personId: characterId },
			revision,
		}),
	);
	const tokenBytes = Buffer.from(
		JSON.stringify({
			personId,
			characterId,
			name,
			image: { sha256: sha256(imageBytes) },
			generationContract: { revision },
			slots: [],
		}),
	);
	return {
		personId,
		characterId,
		name,
		detail: {
			url: `https://example.test/${revision}.json`,
			bytes: detailBytes,
			sha256: sha256(detailBytes),
		},
		token: {
			url: `https://example.test/${revision}-token.json`,
			bytes: tokenBytes,
			sha256: sha256(tokenBytes),
		},
		image: {
			url: `https://example.test/${revision}.png`,
			bytes: imageBytes,
			sha256: sha256(imageBytes),
		},
	};
}

function makeStore(): DatabaseSync {
	const directory = mkdtempSync(join(tmpdir(), "people-current-binding-"));
	folders.push(directory);
	return openOriginalsStore(join(directory, "originals.sqlite"));
}

afterEach(() => {
	for (const folder of folders.splice(0))
		rmSync(folder, { recursive: true, force: true });
});

describe("coherent current original selection", () => {
	it("selects each accepted tuple while retaining deduplicated revisions", () => {
		const db = makeStore();
		try {
			const imageA = pngFixture(11);
			const imageB = pngFixture(22);
			const first = person("first", imageA);
			const second = person("second", imageB);
			const third = person("changed-token-reuses-image-A", imageA);
			const firstDetailSHA = first.detail.sha256;
			importOriginals(db, [first]);
			importOriginals(db, [second]);
			importOriginals(db, [third]);

			const selectedToken = readOriginalJson(db, third.personId, "token");
			const selectedImage = readOriginalImage(db, third.personId);
			expect(selectedToken?.sha256).toBe(third.token.sha256);
			expect(selectedImage?.sha256).toBe(
				selectedToken &&
					JSON.parse(Buffer.from(selectedToken.bytes).toString("utf8")).image
						.sha256,
			);
			expect(selectedImage?.sha256).toBe(imageHash(third));
			expect(readOriginalJson(db, third.personId, "detail")?.sha256).toBe(
				third.detail.sha256,
			);
			expect(
				db
					.prepare(
						"SELECT count(*) AS count FROM token_revisions WHERE person_id=?",
					)
					.get(third.personId),
			).toEqual({ count: 3 });
			expect(
				db
					.prepare(
						"SELECT count(*) AS count FROM image_revisions WHERE person_id=?",
					)
					.get(third.personId),
			).toEqual({ count: 2 });
			expect(readOriginalJson(db, third.personId, "detail", 1)?.sha256).toBe(
				firstDetailSHA,
			);
			expect(readOriginalImage(db, third.personId, 2)?.sha256).toBe(
				second.image.sha256,
			);
			importOriginals(db, [third]);
			expect(
				db
					.prepare(
						"SELECT count(*) AS count FROM token_revisions WHERE person_id=?",
					)
					.get(third.personId),
			).toEqual({ count: 3 });
			expect(
				db
					.prepare(
						"SELECT count(*) AS count FROM image_revisions WHERE person_id=?",
					)
					.get(third.personId),
			).toEqual({ count: 2 });
		} finally {
			db.close();
		}
	});

	it("rolls back the selected tuple when a batch fails", () => {
		const db = makeStore();
		try {
			const initial = person("first", pngFixture(31), "first", "K-first");
			const other = person("other", pngFixture(34), "other", "K-other");
			importOriginals(db, [initial, other]);
			const next = person("second", pngFixture(32), "second", "K-second");
			const conflict = person(
				"third",
				pngFixture(33),
				"third",
				other.characterId,
			);
			expect(() => importOriginals(db, [next, conflict])).toThrow();
			expect(readOriginalJson(db, initial.personId, "token")?.sha256).toBe(
				initial.token.sha256,
			);
			expect(readOriginalImage(db, initial.personId)?.sha256).toBe(
				initial.image.sha256,
			);
			expect(db.prepare("SELECT count(*) AS count FROM people").get()).toEqual({
				count: 2,
			});
		} finally {
			db.close();
		}
	});
});

function imageHash(record: ReturnType<typeof person>): string {
	return record.image.sha256;
}
