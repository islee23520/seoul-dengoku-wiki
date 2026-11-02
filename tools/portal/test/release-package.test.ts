import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
	createReleasePackage,
	type ReleaseFile,
} from "../src/release-package.ts";

function releaseFile(path: string, value: string): ReleaseFile {
	const data = Buffer.from(value);
	return {
		path,
		bytes: data.length,
		sha256: createHash("sha256").update(data).digest("hex"),
		data,
	};
}

function octal(bytes: Buffer, offset: number, length: number) {
	return Number.parseInt(
		bytes
			.subarray(offset, offset + length)
			.toString("ascii")
			.replace(/[\0 ]+$/, ""),
		8,
	);
}

test("release TAR and manifest are byte-reproducible with normalized headers", () => {
	const files = [
		releaseFile("z-last.txt", "last"),
		releaseFile("nested/a-first.txt", "first"),
	];
	const first = createReleasePackage(files);
	const second = createReleasePackage(files);
	const firstTar = first.archives.find((archive) => archive.format === "tar");
	const secondTar = second.archives.find((archive) => archive.format === "tar");
	const firstZip = first.archives.find((archive) => archive.format === "zip");
	const secondZip = second.archives.find((archive) => archive.format === "zip");

	expect(firstTar?.data).toEqual(secondTar?.data);
	expect(firstZip?.data).toEqual(secondZip?.data);
	expect(first.manifest).toEqual(second.manifest);

	const tar = firstTar?.data;
	expect(tar).toBeDefined();
	if (!tar) throw new Error("TAR_NOT_CREATED");
	expect(tar.subarray(0, 100).toString("utf8").replace(/\0+$/, "")).toBe(
		"nested/a-first.txt",
	);
	expect(octal(tar, 100, 8)).toBe(0o644);
	expect(octal(tar, 108, 8)).toBe(0);
	expect(octal(tar, 116, 8)).toBe(0);
	expect(octal(tar, 136, 12)).toBe(0);
	const firstFile = files[1];
	if (!firstFile) throw new Error("FIRST_FILE_MISSING");
	const secondHeader = 512 + Math.ceil(firstFile.bytes / 512) * 512;
	expect(
		tar
			.subarray(secondHeader, secondHeader + 100)
			.toString("utf8")
			.replace(/\0+$/, ""),
	).toBe("z-last.txt");
});
