import { describe, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createTransportFixture } from "./transport-fixture.js";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(packageDirectory, "dist/cli.js");

const run = (
	command: string,
	args: readonly string[],
	cwd: string,
	env: NodeJS.ProcessEnv = process.env,
) =>
	new Promise<{ code: number | null; stdout: string; stderr: string }>(
		(resolvePromise, reject) => {
			const child = spawn(command, args, {
				cwd,
				env,
				stdio: ["ignore", "pipe", "pipe"],
			});
			let stdout = "";
			let stderr = "";
			child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
				stdout += chunk;
			});
			child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
				stderr += chunk;
			});
			const timeout = setTimeout(() => child.kill("SIGKILL"), 10_000);
			child.once("error", reject);
			child.once("close", (code) => {
				clearTimeout(timeout);
				resolvePromise({ code, stdout, stderr });
			});
		},
	);

describe("portrait-generator CLI portability", () => {
	test("declares a standalone build of the actual registered CLI", async () => {
		const metadata = JSON.parse(
			await readFile(join(packageDirectory, "package.json"), "utf8"),
		);
		expect(metadata.bin["portrait-generator"]).toBe("dist/cli.js");
		expect(metadata.scripts.compile).toBe(
			"bun build src/cli.ts --compile --outfile dist/portrait-generator",
		);
	});

	test("runs the emitted entry through a symlink from a spaced path and empty PATH", async () => {
		const directory = await mkdtemp(join(tmpdir(), "portrait cli space "));
		try {
			const linkedEntry = join(directory, "portrait-generator");
			await symlink(entry, linkedEntry);
			const result = await run(
				process.execPath,
				[linkedEntry, "--help"],
				directory,
				{ ...process.env, PATH: "" },
			);
			expect(result).toMatchObject({ code: 0, stderr: "" });
			expect(result.stdout).toContain("Usage: portrait-generator");
			expect(result.stderr).toBe("");
		} finally {
			await rm(directory, { recursive: true });
		}
	});

	test("importing the compiled CLI does not execute its entry point", async () => {
		const result = await run(
			process.execPath,
			[
				"--input-type=module",
				"-e",
				`await import(${JSON.stringify(pathToFileURL(entry).href)})`,
			],
			packageDirectory,
		);
		expect(result.code).toBe(0);
		expect(result.stdout).toBe("");
		expect(result.stderr).toBe("");
	});

	test("directory supplied as an artifact manifest yields FILE_READ_FAILED", async () => {
		const directory = await mkdtemp(join(tmpdir(), "portrait-cli-directory-"));
		try {
			const pinsPath = join(directory, "pins.json");
			await writeFile(pinsPath, "{}");
			const result = await run(
				process.execPath,
				[entry, "preflight", "--input", directory, "--pins", pinsPath],
				packageDirectory,
			);
			expect(result.code).toBe(1);
			const lines = result.stderr.trim().split("\n");
			expect(lines).toHaveLength(1);
			expect(lines[0]).toBe("FILE_READ_FAILED: FILE_READ_FAILED");
		} finally {
			await rm(directory, { recursive: true });
		}
	});

	test("compiled product invokes its entry point", async () => {
		const directory = await mkdtemp(
			join(tmpdir(), "portrait-generator-binary "),
		);
		const binaryPath = join(directory, "portrait-generator");
		try {
			const build = await run(
				"bun",
				["build", "--compile", "src/cli.ts", "--outfile", binaryPath],
				packageDirectory,
			);
			expect(build).toMatchObject({ code: 0, stderr: "" });
			const result = await run(binaryPath, ["--help"], directory, {
				...process.env,
				PATH: "",
			});
			expect(result).toMatchObject({ code: 0, stderr: "" });
			expect(result.stdout).toContain("Usage: portrait-generator");
			const fixture = createTransportFixture();
			await writeFile(
				join(directory, "rule.json"),
				fixture.candidate.ruleBytes,
			);
			await writeFile(
				join(directory, "reference.json"),
				fixture.candidate.positionReferenceBytes,
			);
			await writeFile(
				join(directory, "look.json"),
				fixture.candidate.lookBytes,
			);
			for (const [index, bytes] of fixture.orderedImageBytes.entries())
				await writeFile(join(directory, `image-${index}.png`), bytes);
			const manifestPath = join(directory, "manifest.json");
			const pinsPath = join(directory, "pins.json");
			await writeFile(
				manifestPath,
				JSON.stringify({
					rule: { path: "rule.json" },
					reference: { path: "reference.json" },
					look: { path: "look.json" },
					referenceImages: fixture.referenceImages.map(
						({ bytes, ...image }, index) => ({
							...image,
							path: `image-${index}.png`,
						}),
					),
					composition: fixture.candidate.composition,
				}),
			);
			await writeFile(pinsPath, JSON.stringify(fixture.operatorPins));
			const args = ["preflight", "--input", manifestPath, "--pins", pinsPath];
			const preflight = await run(binaryPath, args, tmpdir(), { PATH: "" });
			expect(preflight).toMatchObject({ code: 0, stderr: "" });
			expect(JSON.parse(preflight.stdout).projection).toEqual({
				textSHA: fixture.projection.textSHA,
				renderingSHA: fixture.projection.renderingSHA,
				providerCalls: 0,
				dispatched: false,
			});
			await writeFile(
				pinsPath,
				JSON.stringify({ ...fixture.operatorPins, lookSHA: "0".repeat(64) }),
			);
			const held = await run(binaryPath, args, tmpdir(), { PATH: "" });
			expect(held).toMatchObject({ code: 1, stdout: "" });
			expect(held.stderr).toBe(
				"ARTIFACT_HASH_MISMATCH: ARTIFACT_HASH_MISMATCH\n",
			);
		} finally {
			await rm(directory, { recursive: true });
		}
	});
});
