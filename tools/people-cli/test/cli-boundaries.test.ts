import { afterEach, describe, expect, it } from "bun:test";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const cliPath = join(resolve(import.meta.dir, ".."), "dist", "cli.js");
const directories: string[] = [];
const sha256 = (bytes: Uint8Array): string =>
	createHash("sha256").update(bytes).digest("hex");

async function directory(): Promise<string> {
	const path = await mkdtemp(join(tmpdir(), "people-cli-boundary-"));
	directories.push(path);
	return path;
}

function run(
	args: readonly string[],
	cwd: string,
	env: NodeJS.ProcessEnv = process.env,
): Promise<{
	readonly code: number;
	readonly stdout: string;
	readonly stderr: string;
}> {
	return new Promise((resolveResult, reject) => {
		const child = spawn(process.execPath, [cliPath, ...args], {
			cwd,
			env,
			stdio: ["ignore", "pipe", "pipe"],
		});
		let stdout = "";
		let stderr = "";
		child.stdout
			.setEncoding("utf8")
			.on("data", (chunk: string) => (stdout += chunk));
		child.stderr
			.setEncoding("utf8")
			.on("data", (chunk: string) => (stderr += chunk));
		child.once("error", reject);
		child.once("close", (code) =>
			resolveResult({ code: code ?? 1, stdout, stderr }),
		);
	});
}

afterEach(async () => {
	for (const path of directories.splice(0))
		await rm(path, { recursive: true, force: true });
});

describe("people-originals CLI boundaries", () => {
	it("runs JavaScript help from an external working directory", async () => {
		const cwd = await directory();
		const result = await run(["--help"], cwd);
		expect(result.code).toBe(0);
		expect(result.stdout).toContain("Usage: people-originals");
		expect(result.stderr).toBe("");
	});

	it("rejects an absolute source path in a valid manifest before reading", async () => {
		const cwd = await directory();
		const outside = await directory();
		const db = join(cwd, "store.sqlite");
		const detailBytes = Buffer.from(
			JSON.stringify({
				id: "person-boundary",
				name: "Boundary",
				detailRoute: "/people/person-boundary",
				familyTree: { personId: "K-boundary" },
			}),
		);
		const tokenBytes = Buffer.from(
			JSON.stringify({
				personId: "person-boundary",
				characterId: "K-boundary",
				name: "Boundary",
				image: { sha256: "0".repeat(64) },
				generationContract: {},
				slots: [],
			}),
		);
		const imageBytes = Buffer.from("image-bytes");
		const detailPath = join(cwd, "detail.json");
		const tokenPath = join(cwd, "token.json");
		const imagePath = join(cwd, "image.bin");
		await writeFile(detailPath, detailBytes);
		await writeFile(tokenPath, tokenBytes);
		await writeFile(imagePath, imageBytes);
		const absoluteSource = join(outside, "existing.json");
		await writeFile(absoluteSource, "existing");
		const manifest = join(cwd, "manifest.json");
		await writeFile(
			manifest,
			JSON.stringify({
				people: [
					{
						personId: "person-boundary",
						characterId: "K-boundary",
						name: "Boundary",
						detail: {
							url: "fixture:detail",
							path: absoluteSource,
							sha256: sha256(detailBytes),
						},
						token: {
							url: "fixture:token",
							path: "token.json",
							sha256: sha256(tokenBytes),
						},
						image: {
							url: "fixture:image",
							path: "image.bin",
							sha256: sha256(imageBytes),
						},
					},
				],
			}),
		);
		const absolute = await run(["import", manifest, "--db", db], cwd);
		expect(absolute.code).toBe(1);
		expect(absolute.stderr).toContain("INVALID_INPUT: manifest source paths");
		expect(absolute.stderr.trim().split("\n")).toHaveLength(1);
		expect(absolute.stdout).toBe("");
		expect(await Bun.file(db).exists()).toBe(false);
	});

	it("rejects a parent-traversal source path in a valid manifest", async () => {
		const cwd = await directory();
		const outside = await directory();
		const detailBytes = Buffer.from(
			JSON.stringify({
				id: "person-boundary",
				name: "Boundary",
				detailRoute: "/people/person-boundary",
				familyTree: { personId: "K-boundary" },
			}),
		);
		const imageBytes = Buffer.from("image-bytes");
		const tokenBytes = Buffer.from(
			JSON.stringify({
				personId: "person-boundary",
				characterId: "K-boundary",
				name: "Boundary",
				image: { sha256: sha256(imageBytes) },
				generationContract: {},
				slots: [],
			}),
		);
		await writeFile(join(cwd, "token.json"), tokenBytes);
		await writeFile(join(cwd, "image.png"), imageBytes);
		await writeFile(join(outside, "detail.json"), detailBytes);
		const manifest = join(cwd, "manifest.json");
		const payload = {
			detail: {
				url: "fixture:detail",
				path: "../detail.json",
				sha256: sha256(detailBytes),
			},
			token: {
				url: "fixture:token",
				path: "token.json",
				sha256: sha256(tokenBytes),
			},
			image: {
				url: "fixture:image",
				path: "image.png",
				sha256: sha256(imageBytes),
			},
		};
		await writeFile(
			manifest,
			JSON.stringify({
				people: [
					{
						personId: "person-boundary",
						characterId: "K-boundary",
						name: "Boundary",
						detail: payload.detail,
						token: payload.token,
						image: payload.image,
					},
				],
			}),
		);
		const db = join(cwd, "store.sqlite");
		const traversal = await run(["import", manifest, "--db", db], cwd);
		expect(traversal.code).toBe(1);
		expect(traversal.stderr).toContain("INVALID_INPUT: manifest source paths");
		expect(traversal.stderr.trim().split("\n")).toHaveLength(1);
		expect(traversal.stdout).toBe("");
		expect(await Bun.file(db).exists()).toBe(false);
	});

	it("rejects whitespace-only person IDs and database and output paths", async () => {
		const cwd = await directory();
		const cases = [
			["get", "   ", "--db", join(cwd, "store.sqlite")],
			["get", "person-x", "--db", "   "],
			[
				"export",
				"person-x",
				"--kind",
				"detail",
				"--output",
				"   ",
				"--db",
				join(cwd, "store.sqlite"),
			],
		] as const;
		for (const args of cases) {
			const result = await run(args, cwd);
			expect(result.code).toBe(1);
			expect(result.stderr.trim()).not.toBe("");
			expect(result.stderr.trim().split("\n")).toHaveLength(1);
			expect(result.stdout).toBe("");
		}
	});

	it("rejects a whitespace-only manifest argument", async () => {
		const cwd = await directory();
		const result = await run(
			["import", "   ", "--db", join(cwd, "store.sqlite")],
			cwd,
		);
		expect(result.code).toBe(1);
		expect(result.stderr.trim()).not.toBe("");
		expect(result.stdout).toBe("");
	});
});
