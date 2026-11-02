import { expect, test } from "bun:test";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { decodePng } from "../../portrait/acceptance/src/png.ts";
import {
	packedDatasetPath,
	preparePackedDataset,
	prepareRecoveryDataset,
	recoveryDatasetPath,
	writePackedDataset,
	writeRecoveryDataset,
} from "../src/prepare-recovery-dataset.ts";

const root = resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const input = JSON.parse(
	await readFile(resolve(root, recoveryDatasetPath, "manifest.json"), "utf8"),
);

test("source hash mismatch rejects the whole set before any output write", async () => {
	const bad = structuredClone(input);
	bad.records[15].source.sha256 = "0".repeat(64);
	const path = resolve(root, recoveryDatasetPath, "dataset/person-0399.png");
	const before = await readFile(path).catch(() => null);
	await expect(writeRecoveryDataset(root, bad)).rejects.toThrow(
		"DATASET_SOURCE_HASH_MISMATCH",
	);
	if (before === null) await expect(access(path)).rejects.toThrow();
	else expect(await readFile(path)).toEqual(before);
});

test("exact sixteen membership, exclusions and disabled launch are mandatory", async () => {
	const bad = structuredClone(input);
	bad.records[0].personId = "person-1009";
	await expect(prepareRecoveryDataset(root, bad)).rejects.toThrow(
		"DATASET_MEMBERSHIP_MISMATCH",
	);
	const enabled = structuredClone(input);
	enabled.launchEnabled = true;
	await expect(prepareRecoveryDataset(root, enabled)).rejects.toThrow();
	const duplicate = structuredClone(input);
	duplicate.records[0] = duplicate.records[1];
	await expect(prepareRecoveryDataset(root, duplicate)).rejects.toThrow(
		"DATASET_MEMBERSHIP_MISMATCH",
	);
});

test("canonical RGB inputs retain exact hashes, dimensions and defined matte", async () => {
	const prepared = await prepareRecoveryDataset(root, input);
	expect(prepared).toHaveLength(16);
	for (const item of prepared) {
		const image = decodePng(item.bytes);
		expect([image.width, image.height, image.channels]).toEqual([340, 510, 3]);
		expect([...image.pixels.slice(0, 3)]).toEqual([224, 226, 228]);
		expect(item.receipt.rgbSHA256).toBe(item.row.output.expectedSHA256);
		expect(item.receipt.crop).toBeNull();
		expect(item.receipt.upscaled).toBe(false);
	}
});

test("packing preserves every RGB pixel and all matte padding with same-stem captions", async () => {
	const packed = await preparePackedDataset(root, input);
	expect(packed).toHaveLength(16);
	for (const item of packed) {
		const source = decodePng(await readFile(item.inputPath));
		const image = decodePng(item.bytes);
		expect([image.width, image.height, image.channels]).toEqual([352, 512, 3]);
		let valid = true;
		for (let y = 0; y < 512; y++)
			for (let x = 0; x < 352; x++) {
				const expected =
					y >= 1 && y < 511 && x >= 6 && x < 346
						? source.pixels.subarray(
								((y - 1) * 340 + x - 6) * 3,
								((y - 1) * 340 + x - 6) * 3 + 3,
							)
						: [224, 226, 228];
				for (let c = 0; c < 3; c++)
					if (image.pixels[(y * 352 + x) * 3 + c] !== expected[c])
						valid = false;
			}
		expect(valid).toBe(true);
		expect(await readFile(item.outputPath.replace(/\.png$/, ".txt"))).toEqual(
			await readFile(
				resolve(root, recoveryDatasetPath, "captions", `${item.personId}.txt`),
			),
		);
	}
});

test("last packed source hash mismatch leaves every target unchanged", async () => {
	const paths = input.records.map((row: { personId: string }) =>
		resolve(root, packedDatasetPath, "dataset", `${row.personId}.png`),
	);
	const before = await Promise.all(
		paths.map((path: string) => readFile(path).catch(() => null)),
	);
	const bad = structuredClone(input);
	bad.records[15].output.expectedSHA256 = "0".repeat(64);
	await expect(writePackedDataset(root, bad)).rejects.toThrow(
		"PACK_SOURCE_HASH_MISMATCH",
	);
	expect(
		await Promise.all(
			paths.map((path: string) => readFile(path).catch(() => null)),
		),
	).toEqual(before);
});
