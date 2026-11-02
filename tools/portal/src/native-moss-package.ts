import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { NATIVE_MOSS_PROFILE_DIGEST } from "./native-moss-contract.ts";
import type { ReleaseFile } from "./release-package.ts";

export const nativeMossPrivatePath = "private/native-moss/";

// Build output keeps the same sibling layout for server.mjs and this helper.
// Source consumers use ../native-moss; bundled consumers use ./private/native-moss.
export function nativeMossPackageRoot(moduleURL: string) {
	return new URL(
		moduleURL.endsWith(".ts")
			? "../native-moss/"
			: `./${nativeMossPrivatePath}`,
		moduleURL,
	);
}

const manifestSchema = z.strictObject({
	schema: z.literal("native-moss-bundle.v1"),
	implementationSHA256: z.string().regex(/^[a-f0-9]{64}$/),
	profileDigest: z.literal(NATIVE_MOSS_PROFILE_DIGEST),
	files: z.record(
		z.string().regex(/^[a-zA-Z0-9_-]+\.(py|ts)$/),
		z.strictObject({
			sha256: z.string().regex(/^[a-f0-9]{64}$/),
			size: z
				.number()
				.int()
				.positive()
				.max(2 * 1024 * 1024),
		}),
	),
});
const hash = (bytes: Uint8Array | string) =>
	createHash("sha256").update(bytes).digest("hex");

export async function nativeMossPackageFiles(
	source: string,
): Promise<ReleaseFile[]> {
	const root = await lstat(source);
	if (!root.isDirectory() || root.isSymbolicLink())
		throw Error("NATIVE_PACKAGE_SOURCE_KIND");
	const manifestPath = resolve(source, "manifest.json");
	const stat = await lstat(manifestPath);
	if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 65536)
		throw Error("NATIVE_PACKAGE_MANIFEST_KIND");
	const bytes = await readFile(manifestPath);
	const manifest = manifestSchema.parse(JSON.parse(bytes.toString("utf8")));
	const files = Object.fromEntries(
		Object.entries(manifest.files).sort(([a], [b]) =>
			a < b ? -1 : a > b ? 1 : 0,
		),
	);
	if (
		Object.keys(files).length === 0 ||
		Object.keys(files).length > 32 ||
		hash(JSON.stringify(files)) !== manifest.implementationSHA256
	)
		throw Error("NATIVE_PACKAGE_MANIFEST_DIGEST");
	for (const entry of [
		"job.py",
		"runtime.py",
		"lifecycle.py",
		"newhost-proof.py",
	])
		if (!Object.hasOwn(files, entry))
			throw Error("NATIVE_PACKAGE_ENTRY_MISSING");
	const result: ReleaseFile[] = [];
	for (const name of ["manifest.json", ...Object.keys(files)]) {
		const path = resolve(source, name);
		const info = await lstat(path);
		if (!info.isFile() || info.isSymbolicLink())
			throw Error("NATIVE_PACKAGE_FILE_KIND");
		const data = name === "manifest.json" ? bytes : await readFile(path);
		const pin = files[name];
		if (pin && (data.length !== pin.size || hash(data) !== pin.sha256))
			throw Error("NATIVE_PACKAGE_FILE_DRIFT");
		result.push({
			path: `${nativeMossPrivatePath}${name}`,
			bytes: data.length,
			sha256: hash(data),
			data,
		});
	}
	return result;
}

export async function writeNativeMossPackage(source: string, output: string) {
	const files = await nativeMossPackageFiles(source);
	await mkdir(resolve(output, nativeMossPrivatePath), {
		recursive: true,
		mode: 0o700,
	});
	for (const file of files) {
		const path = resolve(output, file.path);
		await mkdir(dirname(path), { recursive: true, mode: 0o700 });
		await writeFile(path, file.data, { mode: 0o600 });
	}
	return files;
}
