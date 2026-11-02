import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import {
	lstat,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	realpath,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const installer = fileURLToPath(
	new URL("../install/ssstool.sh", import.meta.url),
);
const nodeKey = "NODE_BINARY";
const pathKey = "PATH";
const node = process.env[nodeKey] ?? "node";
const hash = (bytes: Uint8Array | string) =>
	createHash("sha256").update(bytes).digest("hex");

async function invoke(
	command: string,
	args: string[],
	home: string,
	path = process.env[pathKey],
) {
	const child = spawn(command, args, {
		cwd: home,
		env: { HOME: home, TMPDIR: home, PATH: path },
		stdio: ["ignore", "pipe", "pipe"],
	});
	const exited = once(child, "exit", { signal: AbortSignal.timeout(15000) });
	let stdout = "";
	let stderr = "";
	child.stdout.on("data", (bytes) => {
		stdout += String(bytes);
	});
	child.stderr.on("data", (bytes) => {
		stderr += String(bytes);
	});
	const [code] = await exited;
	return { code, stdout, stderr };
}

async function tree(root: string): Promise<Record<string, string>> {
	const result: Record<string, string> = {};
	async function visit(path: string, relative: string) {
		for (const name of (await readdir(path)).sort()) {
			const item = join(path, name);
			const key = relative ? `${relative}/${name}` : name;
			const stat = await lstat(item);
			result[key] =
				`${stat.mode}:${stat.isDirectory() ? "directory" : stat.isSymbolicLink() ? "symlink" : hash(await readFile(item))}`;
			if (stat.isDirectory()) await visit(item, key);
		}
	}
	await visit(root, "");
	return result;
}

async function fixture() {
	const home = await mkdtemp(
		join(await realpath(tmpdir()), "ssstool-install-"),
	);
	const prefix = join(home, ".local/share/ssstool");
	const archive = join(dist, "ssstool-release.tar");
	const manifest = join(dist, "ssstool-manifest.json");
	const install = (args: string[], path = process.env[pathKey]) =>
		invoke("/bin/sh", [installer, ...args, "--prefix", prefix], home, path);
	return { home, prefix, archive, manifest, install };
}

test("clean HOME installs tar and ZIP, runs source-free CLI, upgrades and explicitly rolls back", async () => {
	const context = await fixture();
	const { home, prefix, archive, manifest, install } = context;
	try {
		const first = await install(["--archive", archive, "--manifest", manifest]);
		expect(first.code).toBe(0);
		const initial = JSON.parse(first.stdout);
		expect(initial.previous).toBeNull();
		const release = join(prefix, "releases", initial.current);
		expect((await readdir(release)).sort()).toEqual([
			"cli.mjs",
			"manifest.json",
			"mcp.mjs",
			"public",
			"server.mjs",
		]);
		const help = await invoke(join(prefix, "bin/ssstool"), ["help"], home);
		expect(help.code).toBe(0);
		expect(JSON.parse(help.stdout).ok).toBe(true);
		const protocol = spawn(node, [join(prefix, "bin/launch.mjs"), "--mcp"], {
			cwd: home,
			env: { HOME: home, PATH: process.env[pathKey] },
			stdio: ["pipe", "pipe", "pipe"],
		});
		const protocolExit = once(protocol, "exit", {
			signal: AbortSignal.timeout(15000),
		});
		let protocolOutput = "";
		protocol.stdout.on("data", (chunk) => {
			protocolOutput += String(chunk);
		});
		protocol.stdin.end(
			`${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "install-test", version: "1" } } })}\n`,
		);
		expect((await protocolExit)[0]).toBe(0);
		expect(JSON.parse(protocolOutput).result.protocolVersion).toBe(
			"2025-11-25",
		);

		// A second built, source-free release differs by an inert bundled comment.
		const nextArchive = Buffer.from(await readFile(archive));
		const currentManifest = JSON.parse(await readFile(manifest, "utf8"));
		let offset = 0;
		while (
			nextArchive
				.subarray(offset, offset + 100)
				.toString()
				.replace(/\0.*$/s, "") !== "cli.mjs"
		) {
			const size = Number.parseInt(
				nextArchive.subarray(offset + 124, offset + 136).toString(),
				8,
			);
			offset += 512 + Math.ceil(size / 512) * 512;
		}
		const size = Number.parseInt(
			nextArchive.subarray(offset + 124, offset + 136).toString(),
			8,
		);
		const data = nextArchive.subarray(offset + 512, offset + 512 + size);
		const comment = data.indexOf("// ");
		expect(comment).toBeGreaterThanOrEqual(0);
		data[comment + 3] = data[comment + 3] === 88 ? 89 : 88;
		currentManifest.artifacts.find(
			(item: { path: string }) => item.path === "cli.mjs",
		).sha256 = hash(data);
		currentManifest.releaseId = hash(JSON.stringify(currentManifest.artifacts));
		currentManifest.archives = [
			{ format: "tar", bytes: nextArchive.length, sha256: hash(nextArchive) },
		];
		const next = join(home, "next.tar");
		const nextManifest = join(home, "next.json");
		await writeFile(next, nextArchive);
		await writeFile(nextManifest, JSON.stringify(currentManifest));
		const upgraded = await install([
			"--archive",
			next,
			"--manifest",
			nextManifest,
		]);
		expect(upgraded.code).toBe(0);
		expect(JSON.parse(upgraded.stdout)).toMatchObject({
			current: currentManifest.releaseId,
			previous: initial.current,
		});
		const repeated = await install([
			"--archive",
			next,
			"--manifest",
			nextManifest,
		]);
		expect(repeated.code).toBe(0);
		expect(JSON.parse(repeated.stdout).previous).toBe(initial.current);
		const priorCli = join(release, "cli.mjs");
		const priorBytes = await readFile(priorCli);
		await writeFile(priorCli, "tampered rollback target");
		const beforeRollback = await tree(prefix);
		expect(await install(["--rollback"])).toMatchObject({
			code: 3,
			stderr: "ARTIFACT_MISMATCH\n",
		});
		expect(await tree(prefix)).toEqual(beforeRollback);
		await writeFile(priorCli, priorBytes);
		const rollback = await install(["--rollback"]);
		expect(rollback.code).toBe(0);
		expect(JSON.parse(rollback.stdout)).toMatchObject({
			current: initial.current,
			previous: currentManifest.releaseId,
		});
		expect(
			(await invoke(join(prefix, "bin/ssstool"), ["help"], home)).code,
		).toBe(0);
		const zip = await install([
			"--archive",
			join(dist, "ssstool-release.zip"),
			"--manifest",
			manifest,
		]);
		expect(zip.code).toBe(0);
	} finally {
		await rm(home, { recursive: true, force: true });
	}
}, 30000);

test("tampered archive, manifest, prior release, traversal and lock fail without changing destination", async () => {
	const { home, prefix, archive, manifest, install } = await fixture();
	try {
		expect(
			(await install(["--archive", archive, "--manifest", manifest])).code,
		).toBe(0);
		const bytes = Buffer.from(await readFile(archive));
		bytes[600] = (bytes[600] ?? 0) ^ 1;
		const bad = join(home, "tampered.tar");
		await writeFile(bad, bytes);
		const before = await tree(prefix);
		const rejected = await install(["--archive", bad, "--manifest", manifest]);
		expect(rejected).toMatchObject({
			code: 3,
			stdout: "",
			stderr: "ARCHIVE_HASH_MISMATCH\n",
		});
		expect(await tree(prefix)).toEqual(before);
		const malformed = join(home, "bad.json");
		await writeFile(malformed, "{not-json");
		expect(
			await install(["--archive", archive, "--manifest", malformed]),
		).toMatchObject({ code: 3, stderr: "MANIFEST_INVALID\n" });
		expect(await tree(prefix)).toEqual(before);
		const trusted = JSON.parse(await readFile(manifest, "utf8"));
		trusted.archives = [
			{ format: "tar", bytes: bytes.length, sha256: hash(bytes) },
		];
		await writeFile(malformed, JSON.stringify(trusted));
		expect(
			await install(["--archive", bad, "--manifest", malformed]),
		).toMatchObject({ code: 3, stderr: "ARTIFACT_MISMATCH\n" });
		expect(await tree(prefix)).toEqual(before);
		const traversal = Buffer.from(await readFile(archive));
		traversal.fill(0, 0, 100);
		traversal.write("../escape.mjs");
		traversal.fill(32, 148, 156);
		const sum = traversal
			.subarray(0, 512)
			.reduce((total, byte) => total + byte, 0);
		traversal.write(`${sum.toString(8).padStart(6, "0")}\0 `, 148);
		trusted.archives = [
			{ format: "tar", bytes: traversal.length, sha256: hash(traversal) },
		];
		await writeFile(bad, traversal);
		await writeFile(malformed, JSON.stringify(trusted));
		expect(
			await install(["--archive", bad, "--manifest", malformed]),
		).toMatchObject({ code: 3, stderr: "ARCHIVE_INVALID\n" });
		expect(await tree(prefix)).toEqual(before);
		await mkdir(join(prefix, ".install-lock"));
		const locked = await tree(prefix);
		expect(
			await install(["--archive", archive, "--manifest", manifest]),
		).toMatchObject({ code: 5, stderr: "INSTALL_BUSY\n" });
		expect(await tree(prefix)).toEqual(locked);
		await rm(join(prefix, ".install-lock"), { recursive: true });
		expect(await install(["--rollback"])).toMatchObject({
			code: 4,
			stderr: "ROLLBACK_UNAVAILABLE\n",
		});
		expect(await tree(prefix)).toEqual(before);
		const state = JSON.parse(
			await readFile(join(prefix, "selection.json"), "utf8"),
		);
		await writeFile(
			join(prefix, "releases", state.current, "cli.mjs"),
			"tampered",
		);
		const corrupted = await tree(prefix);
		expect(
			await install(["--archive", archive, "--manifest", manifest]),
		).toMatchObject({ code: 3, stderr: "ARTIFACT_MISMATCH\n" });
		expect(await tree(prefix)).toEqual(corrupted);
	} finally {
		await rm(home, { recursive: true, force: true });
	}
}, 30000);

test("missing prerequisites, unowned and symlink destinations and invalid usage never install", async () => {
	const { home, prefix, archive, manifest, install } = await fixture();
	try {
		const empty = join(home, "empty-path");
		await mkdir(empty);
		expect(
			await install(["--archive", archive, "--manifest", manifest], empty),
		).toMatchObject({ code: 2, stderr: "NODE24_REQUIRED\n" });
		const binary = Bun.which(node);
		expect(binary).not.toBeNull();
		await symlink(binary as string, join(empty, "node"));
		await symlink("/usr/bin/dirname", join(empty, "dirname"));
		expect(
			await install(["--archive", archive, "--manifest", manifest], empty),
		).toMatchObject({ code: 2, stderr: "CLOUDFLARED_REQUIRED\n" });
		expect(await install(["--archive"])).toMatchObject({
			code: 2,
			stderr: "INSTALL_USAGE\n",
		});
		await mkdir(prefix, { recursive: true });
		await writeFile(join(prefix, "private-canary"), "preserved");
		const before = await tree(prefix);
		expect(
			await install(["--archive", archive, "--manifest", manifest]),
		).toMatchObject({ code: 4, stderr: "UNOWNED_DESTINATION\n" });
		expect(await tree(prefix)).toEqual(before);
		await rm(prefix, { recursive: true });
		const foreign = join(home, "foreign");
		await mkdir(foreign);
		await symlink(foreign, prefix);
		expect(
			await install(["--archive", archive, "--manifest", manifest]),
		).toMatchObject({ code: 4, stderr: "UNOWNED_DESTINATION\n" });
		expect(await readdir(foreign)).toEqual([]);
	} finally {
		await rm(home, { recursive: true, force: true });
	}
}, 30000);
