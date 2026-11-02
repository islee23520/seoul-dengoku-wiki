import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
	lstat,
	mkdir,
	readFile,
	rename,
	rm,
	writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fail = (code, status = 3) => {
	throw Object.assign(new Error(code), { status });
};
const artifactPaths = [
	"cli.mjs",
	"mcp.mjs",
	"server.mjs",
	"public/index.html",
	"public/portal.css",
	"public/portal.mjs",
	"public/tokens.css",
];
const launcher = `import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const state = JSON.parse(await readFile(resolve(root, "selection.json"), "utf8"));
if (state.schema !== "ssstool-install.v1" || !/^[a-f0-9]{64}$/.test(state.current)) throw Error("INSTALL_STATE_INVALID");
const entry = process.argv[2] === "--mcp" ? "mcp.mjs" : "cli.mjs";
if (entry === "mcp.mjs") process.argv.splice(2, 1);
await import(pathToFileURL(resolve(root, "releases", state.current, entry)).href);
`;
const wrappers = {
	"launch.mjs": launcher,
	ssstool:
		'#!/bin/sh\nexec node "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/launch.mjs" "$@"\n',
	"ssstool-mcp":
		'#!/bin/sh\nexec node "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/launch.mjs" --mcp "$@"\n',
	"ssstool.cmd":
		'@echo off\r\nnode "%~dp0launch.mjs" %*\r\nexit /b %errorlevel%\r\n',
	"ssstool-mcp.cmd":
		'@echo off\r\nnode "%~dp0launch.mjs" --mcp %*\r\nexit /b %errorlevel%\r\n',
};

async function exists(path) {
	try {
		return await lstat(path);
	} catch (error) {
		if (error.code === "ENOENT") return null;
		throw error;
	}
}
function manifestValue(bytes) {
	let value;
	try {
		value = JSON.parse(bytes);
	} catch {
		fail("MANIFEST_INVALID");
	}
	if (
		!value ||
		typeof value !== "object" ||
		value.schema !== "ssstool-private-release.v1" ||
		value.runtime !== "node>=24" ||
		!Array.isArray(value.artifacts) ||
		!Array.isArray(value.archives) ||
		value.artifacts.length !== artifactPaths.length ||
		value.artifacts.some((item) => !item || typeof item !== "object") ||
		value.archives.some((item) => !item || typeof item !== "object" || !["tar", "zip"].includes(item.format) || !Number.isSafeInteger(item.bytes) || item.bytes < 0 || !/^[a-f0-9]{64}$/.test(item.sha256)) ||
		new Set(value.artifacts.map((item) => item.path)).size !==
			artifactPaths.length ||
		value.artifacts.some(
			(item) =>
				!artifactPaths.includes(item.path) ||
				!Number.isSafeInteger(item.bytes) ||
				item.bytes < 0 ||
				!/^[a-f0-9]{64}$/.test(item.sha256),
		) ||
		value.releaseId !== hash(JSON.stringify(value.artifacts))
	)
		fail("MANIFEST_INVALID");
	return value;
}
function archiveEntries(bytes, format) {
	const entries = new Map();
	const add = (path, data) => {
		if (!artifactPaths.includes(path) || entries.has(path))
			fail("ARCHIVE_INVALID");
		entries.set(path, data);
	};
	if (format === "tar") {
		let offset = 0;
		while (offset + 512 <= bytes.length) {
			const header = bytes.subarray(offset, offset + 512);
			if (header.every((byte) => byte === 0)) {
				if (!bytes.subarray(offset).every((byte) => byte === 0))
					fail("ARCHIVE_INVALID");
				break;
			}
			const text = (start, end) =>
				header.subarray(start, end).toString().replace(/\0.*$/s, "");
			const size = Number.parseInt(text(124, 136).trim(), 8);
			const checksum = Number.parseInt(text(148, 156).trim(), 8);
			const actual = header.reduce(
				(sum, byte, index) => sum + (index >= 148 && index < 156 ? 32 : byte),
				0,
			);
			if (
				checksum !== actual ||
				!Number.isSafeInteger(size) ||
				size < 0 ||
				offset + 512 + size > bytes.length ||
				![0, 48].includes(header[156]) ||
				text(345, 500)
			)
				fail("ARCHIVE_INVALID");
			add(text(0, 100), bytes.subarray(offset + 512, offset + 512 + size));
			offset += 512 + Math.ceil(size / 512) * 512;
		}
	} else if (format === "zip") {
		let offset = 0;
		while (
			offset + 30 <= bytes.length &&
			bytes.readUInt32LE(offset) === 0x04034b50
		) {
			const flags = bytes.readUInt16LE(offset + 6);
			const compression = bytes.readUInt16LE(offset + 8);
			const size = bytes.readUInt32LE(offset + 18);
			const nameLength = bytes.readUInt16LE(offset + 26);
			const extraLength = bytes.readUInt16LE(offset + 28);
			const start = offset + 30 + nameLength + extraLength;
			if (
				flags !== 0 ||
				compression !== 0 ||
				size !== bytes.readUInt32LE(offset + 22) ||
				start + size > bytes.length
			)
				fail("ARCHIVE_INVALID");
			add(
				bytes.subarray(offset + 30, offset + 30 + nameLength).toString(),
				bytes.subarray(start, start + size),
			);
			offset = start + size;
		}
		if (offset + 4 > bytes.length || bytes.readUInt32LE(offset) !== 0x02014b50)
			fail("ARCHIVE_INVALID");
	} else fail("ARCHIVE_INVALID");
	return entries;
}
function verify(manifest, entries) {
	if (entries.size !== manifest.artifacts.length) fail("ARTIFACT_MISMATCH");
	for (const artifact of manifest.artifacts) {
		const bytes = entries.get(artifact.path);
		if (
			!bytes ||
			bytes.length !== artifact.bytes ||
			hash(bytes) !== artifact.sha256
		)
			fail("ARTIFACT_MISMATCH");
	}
}
async function verifyRelease(prefix, id) {
	if (!/^[a-f0-9]{64}$/.test(id)) fail("INSTALL_STATE_INVALID");
	const root = join(prefix, "releases", id);
	const manifest = manifestValue(await readFile(join(root, "manifest.json")));
	if (
		manifest.releaseId !== id ||
		!(await lstat(root)).isDirectory() ||
		!(await lstat(join(root, "public"))).isDirectory() ||
		!(await lstat(join(root, "manifest.json"))).isFile()
	)
		fail("INSTALL_STATE_INVALID");
	const entries = new Map();
	for (const path of artifactPaths) {
		const location = join(root, path);
		if (!(await lstat(location)).isFile()) fail("ARTIFACT_MISMATCH");
		entries.set(path, await readFile(location));
	}
	verify(manifest, entries);
}

async function main() {
	if (Number(process.versions.node.split(".")[0]) < 24)
		fail("NODE24_REQUIRED", 2);
	const cloudflared = spawnSync("cloudflared", ["--version"], {
		stdio: "ignore",
		timeout: 5000,
	});
	if (cloudflared.error || cloudflared.status !== 0)
		fail("CLOUDFLARED_REQUIRED", 2);
	const platform = `${process.platform}-${process.arch}`;
	if (
		!["darwin-arm64", "win32-x64", "linux-x64"].includes(platform) ||
		(process.platform === "linux" &&
			!process.report.getReport().header.glibcVersionRuntime)
	)
		fail("UNSUPPORTED_TARGET", 2);
	const args = process.argv.slice(2);
	const options = {};
	for (let index = 0; index < args.length; index++) {
		const key = args[index];
		if (key === "--rollback" && !options.rollback) options.rollback = true;
		else if (
			["--archive", "--manifest", "--prefix"].includes(key) &&
			!options[key.slice(2)] &&
			args[index + 1] &&
			!args[index + 1].startsWith("--")
		)
			options[key.slice(2)] = args[++index];
		else fail("INSTALL_USAGE", 2);
	}
	if (
		!options.prefix ||
		(options.rollback
			? options.archive || options.manifest
			: !options.archive || !options.manifest)
	)
		fail("INSTALL_USAGE", 2);
	const prefix = resolve(options.prefix);
	for (let path = prefix; ; path = dirname(path)) {
		if ((await exists(path))?.isSymbolicLink()) fail("UNOWNED_DESTINATION", 4);
		if (dirname(path) === path) break;
	}
	const selectionPath = join(prefix, "selection.json");
	let state = null;
	if (await exists(prefix)) {
		const selector = await exists(selectionPath);
		if (!selector?.isFile()) fail("UNOWNED_DESTINATION", 4);
		try {
			state = JSON.parse(await readFile(selectionPath, "utf8"));
		} catch {
			fail("INSTALL_STATE_INVALID", 4);
		}
		if (
			!state ||
			typeof state !== "object" ||
			state.schema !== "ssstool-install.v1" ||
			!/^[a-f0-9]{64}$/.test(state.current) ||
			(state.previous !== null && !/^[a-f0-9]{64}$/.test(state.previous))
		)
			fail("INSTALL_STATE_INVALID", 4);
		for (const name of ["bin", "releases"])
			if (!(await lstat(join(prefix, name))).isDirectory())
				fail("INSTALL_STATE_INVALID", 4);
		for (const [name, contents] of Object.entries(wrappers)) {
			const path = join(prefix, "bin", name);
			if (
				!(await lstat(path)).isFile() ||
				(await readFile(path, "utf8")) !== contents
			)
				fail("INSTALL_STATE_INVALID", 4);
		}
		await verifyRelease(prefix, state.current);
	}
	let manifest, entries;
	if (options.rollback) {
		if (!state?.previous) fail("ROLLBACK_UNAVAILABLE", 4);
		await verifyRelease(prefix, state.previous);
	} else {
		manifest = manifestValue(await readFile(resolve(options.manifest)));
		const bytes = await readFile(resolve(options.archive));
		const archive = manifest.archives.find(
			(item) => item.sha256 === hash(bytes) && item.bytes === bytes.length,
		);
		if (!archive) fail("ARCHIVE_HASH_MISMATCH");
		entries = archiveEntries(bytes, archive.format);
		verify(manifest, entries);
	}
	const fresh = !state;
	if (fresh) {
		await mkdir(dirname(prefix), { recursive: true, mode: 0o700 });
		try {
			await mkdir(prefix, { mode: 0o700 });
		} catch (error) {
			if (error.code === "EEXIST") fail("INSTALL_BUSY", 5);
			throw error;
		}
	}
	const lock = join(prefix, ".install-lock");
	try {
		await mkdir(lock, { mode: 0o700 });
	} catch (error) {
		if (error.code === "EEXIST") fail("INSTALL_BUSY", 5);
		throw error;
	}
	const stage = join(prefix, `.stage-${randomUUID()}`);
	const next = join(prefix, `.selection-${randomUUID()}`);
	let addedRelease = null;
	let committed = false;
	try {
		// Recheck after acquiring the lock; an upgrade must not silently replace a concurrent selection.
		if (
			!fresh &&
			JSON.stringify(JSON.parse(await readFile(selectionPath, "utf8"))) !==
				JSON.stringify(state)
		)
			fail("INSTALL_BUSY", 5);
		let updated;
		if (options.rollback)
			updated = { ...state, current: state.previous, previous: state.current };
		else {
			await mkdir(join(prefix, "releases"), { recursive: true, mode: 0o700 });
			const destination = join(prefix, "releases", manifest.releaseId);
			if (await exists(destination))
				await verifyRelease(prefix, manifest.releaseId);
			else {
				await mkdir(join(stage, "public"), { recursive: true, mode: 0o700 });
				for (const [path, bytes] of entries)
					await writeFile(join(stage, path), bytes, {
						mode: 0o600,
						flag: "wx",
					});
				await writeFile(
					join(stage, "manifest.json"),
					`${JSON.stringify(manifest)}\n`,
					{ mode: 0o600, flag: "wx" },
				);
				await rename(stage, destination);
				addedRelease = destination;
			}
			if (fresh) {
				await mkdir(join(prefix, "bin"), { mode: 0o700 });
				for (const [name, contents] of Object.entries(wrappers))
					await writeFile(join(prefix, "bin", name), contents, {
						mode: name.endsWith(".mjs") ? 0o600 : 0o700,
						flag: "wx",
					});
			}
			updated = {
				schema: "ssstool-install.v1",
				current: manifest.releaseId,
				previous:
					state?.current === manifest.releaseId
						? state.previous
						: (state?.current ?? null),
			};
		}
		await writeFile(next, `${JSON.stringify(updated)}\n`, {
			mode: 0o600,
			flag: "wx",
		});
		await rename(next, selectionPath);
		committed = true;
		console.log(
			JSON.stringify({
				ok: true,
				operation: options.rollback ? "rollback" : "install",
				...updated,
			}),
		);
	} finally {
		await rm(stage, { recursive: true, force: true });
		await rm(next, { force: true });
		if (!committed && addedRelease)
			await rm(addedRelease, { recursive: true, force: true });
		await rm(lock, { recursive: true, force: true });
		if (!committed && fresh) await rm(prefix, { recursive: true, force: true });
	}
}
main().catch((error) => {
	console.error(error.status ? error.message : "INSTALL_IO_FAILED");
	process.exitCode = error.status ?? 6;
});
