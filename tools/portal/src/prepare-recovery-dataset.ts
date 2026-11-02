import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { decodePng } from "../../portrait/acceptance/src/png.ts";
import { rgbPng, transformReferencePng } from "./reference-transform.ts";

export const recoveryDatasetPath =
	"ART-ASSETS/portrait-training/recovery16-provisional-v1";
const members = [
	"1007",
	"0998",
	"0001",
	"0029",
	"0088",
	"0116",
	"0145",
	"0170",
	"0220",
	"0246",
	"0272",
	"0297",
	"0323",
	"0349",
	"0374",
	"0399",
].map((id) => `person-${id}`);
const hash = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const specSchema = z.object({
	schema: z.literal("recovery16-provisional-staged-input-spec.v1"),
	count: z.literal(16),
	provisionalAdmission: z.literal(true),
	ownerStyleAdmission: z.literal(false),
	launchEnabled: z.literal(false),
	automaticTraining: z.literal(false),
	trainingLaunched: z.literal(false),
	freshOriginalBaseOnly: z.literal(true),
	resumeExistingClean18: z.literal(false),
	resumeAdapter: z.null(),
	records: z
		.array(
			z.object({
				personId: z.string(),
				catalogGender: z.enum(["남성", "여성"]),
				admission: z.literal("PROVISIONAL_KEEP_PREPARATION_ONLY"),
				source: z.object({ path: z.string(), sha256: digest }),
				caption: z.object({ path: z.string(), sha256: digest }),
				output: z.object({
					path: z.string(),
					expectedSHA256: digest,
					width: z.literal(340),
					height: z.literal(510),
					channels: z.literal(3),
				}),
			}),
		)
		.length(16),
});

// Preflight the entire set before the first mkdir/write. Only this fixed family
// may receive binaries; originals, captions and manifests are read-only here.
export async function prepareRecoveryDataset(root: string, input: unknown) {
	const spec = specSchema.parse(input);
	if (
		new Set(spec.records.map((row) => row.personId)).size !== 16 ||
		spec.records.some((row) => !members.includes(row.personId)) ||
		spec.records.some(
			(row) =>
				row.catalogGender !==
				(row.personId === "person-0399" ? "여성" : "남성"),
		)
	)
		throw Error("DATASET_MEMBERSHIP_MISMATCH");
	const family = resolve(root, recoveryDatasetPath);
	if ((await realpath(family)) !== family)
		throw Error("DATASET_PATH_NOT_LOCAL");
	const recovery = await realpath(
		resolve(
			root,
			".omo/recovery/issue-499/evidence/portrait-v7-execute/style-prep/combined-23/integration-evidence/publication/source22-eligible-drawing-reference-20261005-st01a10ac0/sources",
		),
	);
	const profile = z
		.object({ forbiddenPositiveStyleSHA256: z.array(digest).length(9) })
		.parse(
			JSON.parse(
				await readFile(
					resolve(
						root,
						"ART-ASSETS/portrait-training/shared-target-drawing-v3/manifest.json",
					),
					"utf8",
				),
			),
		);
	const prepared = [];
	for (const row of spec.records) {
		const sourcePath = await realpath(row.source.path);
		if (
			sourcePath !== resolve(recovery, `${row.personId}.png`) ||
			row.caption.path !== `captions/${row.personId}.txt` ||
			row.output.path !== `dataset/${row.personId}.png`
		)
			throw Error("DATASET_PATH_NOT_ALLOWED");
		const captionPath = resolve(family, row.caption.path);
		if ((await realpath(captionPath)) !== captionPath)
			throw Error("DATASET_PATH_NOT_ALLOWED");
		const original = await readFile(sourcePath);
		if (hash(original) !== row.source.sha256)
			throw Error("DATASET_SOURCE_HASH_MISMATCH");
		if (profile.forbiddenPositiveStyleSHA256.includes(row.source.sha256))
			throw Error("DATASET_REJECTED_SOURCE");
		const caption = await readFile(captionPath);
		if (hash(caption) !== row.caption.sha256)
			throw Error("DATASET_CAPTION_HASH_MISMATCH");
		const transformed = transformReferencePng(original, "canonical");
		const image = decodePng(transformed.rgbBytes);
		if (
			image.width !== 340 ||
			image.height !== 510 ||
			image.channels !== 3 ||
			transformed.receipt.upscaled ||
			transformed.receipt.crop !== null ||
			hash(transformed.rgbBytes) !== row.output.expectedSHA256
		)
			throw Error("DATASET_OUTPUT_MISMATCH");
		const outputPath = resolve(family, row.output.path);
		try {
			const parent = await realpath(dirname(outputPath));
			if (
				parent !== dirname(outputPath) ||
				!parent.startsWith(`${family}${sep}`)
			)
				throw Error("DATASET_PATH_NOT_ALLOWED");
			const stat = await lstat(outputPath);
			if (
				!stat.isFile() ||
				stat.isSymbolicLink() ||
				hash(await readFile(outputPath)) !== row.output.expectedSHA256
			)
				throw Error("DATASET_FOREIGN_OUTPUT");
		} catch (error) {
			if (
				!(error instanceof Error && "code" in error && error.code === "ENOENT")
			)
				throw error;
		}
		prepared.push({
			row,
			sourcePath,
			outputPath,
			bytes: transformed.rgbBytes,
			receipt: transformed.receipt,
		});
	}
	return prepared;
}

export async function writeRecoveryDataset(root: string, input: unknown) {
	const prepared = await prepareRecoveryDataset(root, input);
	const records = [];
	for (const item of prepared) {
		await mkdir(dirname(item.outputPath), { recursive: true });
		try {
			await writeFile(item.outputPath, item.bytes, { flag: "wx", mode: 0o600 });
		} catch (error) {
			if (
				!(error instanceof Error && "code" in error && error.code === "EEXIST")
			)
				throw error;
		}
		const output = await readFile(item.outputPath);
		if (
			hash(output) !== item.row.output.expectedSHA256 ||
			hash(await readFile(item.sourcePath)) !== item.row.source.sha256
		)
			throw Error("DATASET_READBACK_MISMATCH");
		records.push({
			personId: item.row.personId,
			sourceSHA256: item.row.source.sha256,
			outputPath: item.row.output.path,
			outputSHA256: hash(output),
			captionPath: item.row.caption.path,
			captionSHA256: item.row.caption.sha256,
			transformReceipt: item.receipt,
		});
	}
	return {
		schema: "recovery16-persisted-rgb-receipt.v1",
		count: records.length,
		launchEnabled: false,
		trainingLaunched: false,
		provisionalAdmission: true,
		freshOriginalBaseOnly: true,
		resumeExistingClean18: false,
		matteRGB: [224, 226, 228],
		transparentDelivery: false,
		records,
	};
}

export const packedDatasetPath =
	"ART-ASSETS/portrait-training/recovery16-moss-packed-v1";

export async function preparePackedDataset(root: string, input: unknown) {
	const spec = specSchema.parse(input);
	if (
		new Set(spec.records.map((row) => row.personId)).size !== 16 ||
		spec.records.some((row) => !members.includes(row.personId))
	)
		throw Error("DATASET_MEMBERSHIP_MISMATCH");
	const source = resolve(root, recoveryDatasetPath);
	const target = resolve(root, packedDatasetPath);
	const manifestBytes = await readFile(resolve(source, "manifest.json"));
	if (
		hash(manifestBytes) !==
		"cd741d2a621ceb7b173b0962cddac5ca3c0d7e3f914cc6eaa88dbf902bccbf33"
	)
		throw Error("PACK_UNVERIFIED_MANIFEST");
	if (
		(await realpath(source)) !== source ||
		(await realpath(target)) !== target
	)
		throw Error("DATASET_PATH_NOT_LOCAL");
	const prepared = [];
	for (const row of spec.records) {
		if (
			row.output.path !== `dataset/${row.personId}.png` ||
			row.caption.path !== `captions/${row.personId}.txt`
		)
			throw Error("DATASET_PATH_NOT_ALLOWED");
		const inputPath = resolve(source, row.output.path);
		const captionPath = resolve(source, row.caption.path);
		if (
			(await realpath(inputPath)) !== inputPath ||
			(await realpath(captionPath)) !== captionPath
		)
			throw Error("DATASET_PATH_NOT_ALLOWED");
		const original = await readFile(inputPath);
		const caption = await readFile(captionPath);
		if (hash(original) !== row.output.expectedSHA256)
			throw Error("PACK_SOURCE_HASH_MISMATCH");
		if (hash(caption) !== row.caption.sha256)
			throw Error("PACK_CAPTION_HASH_MISMATCH");
		const image = decodePng(original);
		if (image.width !== 340 || image.height !== 510 || image.channels !== 3)
			throw Error("PACK_SOURCE_DIMENSIONS");
		const pixels = new Uint8Array(352 * 512 * 4);
		for (let i = 0; i < pixels.length; i += 4)
			pixels.set([224, 226, 228, 255], i);
		for (let y = 0; y < 510; y++)
			for (let x = 0; x < 340; x++)
				pixels.set(
					image.pixels.subarray((y * 340 + x) * 3, (y * 340 + x + 1) * 3),
					((y + 1) * 352 + x + 6) * 4,
				);
		const bytes = rgbPng(352, 512, pixels);
		const outputPath = resolve(target, "dataset", `${row.personId}.png`);
		const outputCaption = resolve(target, "dataset", `${row.personId}.txt`);
		if (
			(await realpath(dirname(outputCaption))) !== dirname(outputCaption) ||
			(await realpath(outputCaption)) !== outputCaption ||
			hash(await readFile(outputCaption)) !== row.caption.sha256
		)
			throw Error("PACK_TARGET_CAPTION_MISMATCH");
		try {
			const stat = await lstat(outputPath);
			if (
				!stat.isFile() ||
				stat.isSymbolicLink() ||
				hash(await readFile(outputPath)) !== hash(bytes)
			)
				throw Error("DATASET_FOREIGN_OUTPUT");
		} catch (error) {
			if (
				!(error instanceof Error && "code" in error && error.code === "ENOENT")
			)
				throw error;
		}
		prepared.push({
			personId: row.personId,
			inputPath,
			inputSHA256: hash(original),
			captionSHA256: hash(caption),
			outputPath,
			outputSHA256: hash(bytes),
			bytes,
		});
	}
	if (
		JSON.stringify(input) !==
		JSON.stringify(JSON.parse(manifestBytes.toString("utf8")))
	)
		throw Error("PACK_MANIFEST_BINDING_MISMATCH");
	return prepared;
}

export async function writePackedDataset(root: string, input: unknown) {
	const prepared = await preparePackedDataset(root, input);
	for (const item of prepared) {
		try {
			await writeFile(item.outputPath, item.bytes, { flag: "wx", mode: 0o600 });
		} catch (error) {
			if (
				!(error instanceof Error && "code" in error && error.code === "EEXIST")
			)
				throw error;
		}
		if (
			hash(await readFile(item.outputPath)) !== item.outputSHA256 ||
			hash(await readFile(item.inputPath)) !== item.inputSHA256
		)
			throw Error("PACK_READBACK_MISMATCH");
	}
	return prepared.map(({ bytes, ...receipt }) => ({
		...receipt,
		outputBytes: bytes.length,
	}));
}

if (import.meta.main) {
	const root = resolve(fileURLToPath(new URL("../../..", import.meta.url)));
	if (
		process.argv.length !== 2 &&
		!(process.argv.length === 3 && process.argv[2] === "--pack")
	)
		throw Error("USAGE: bun tools/portal/src/prepare-recovery-dataset.ts");
	const input: unknown = JSON.parse(
		await readFile(resolve(root, recoveryDatasetPath, "manifest.json"), "utf8"),
	);
	console.log(
		JSON.stringify(
			process.argv[2] === "--pack"
				? await writePackedDataset(root, input)
				: await writeRecoveryDataset(root, input),
			null,
			2,
		),
	);
}
