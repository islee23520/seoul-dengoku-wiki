import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createTransportFixture } from "./transport-fixture.js";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const run = (command: string, args: string[], cwd: string) =>
	new Promise<{ code: number | null; stdout: string; stderr: string }>(
		(resolvePromise, reject) => {
			const child = spawn(command, args, {
				cwd,
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
			const timeout = setTimeout(() => child.kill("SIGKILL"), 30_000);
			child.once("error", (error) => {
				clearTimeout(timeout);
				reject(error);
			});
			child.once("close", (code) => {
				clearTimeout(timeout);
				const result = { code, stdout, stderr };
				console.log(JSON.stringify({ command, args, cwd, ...result }));
				resolvePromise(result);
			});
		},
	);

test("private tarball runs installed Node CLI with explicit offline inputs", async () => {
	const directory = await mkdtemp(join(tmpdir(), "portrait-package-consumer-"));
	try {
		const consumer = join(directory, "consumer");
		await mkdir(consumer);
		const packed = await run(
			"npm",
			["pack", "--json", "--pack-destination", directory],
			packageDirectory,
		);
		expect(packed.code).toBe(0);
		const metadata = JSON.parse(packed.stdout);
		const pack = Array.isArray(metadata)
			? metadata[0]
			: metadata["portrait-generator-preflight"];
		const installed = await run(
			"npm",
			[
				"install",
				"--ignore-scripts",
				"--no-audit",
				"--no-fund",
				join(directory, pack.filename),
			],
			consumer,
		);
		expect(installed.code).toBe(0);
		const fixture = createTransportFixture();
		await writeFile(join(consumer, "rule.json"), fixture.candidate.ruleBytes);
		await writeFile(
			join(consumer, "reference.json"),
			fixture.candidate.positionReferenceBytes,
		);
		await writeFile(join(consumer, "look.json"), fixture.candidate.lookBytes);
		for (const [index, bytes] of fixture.orderedImageBytes.entries())
			await writeFile(join(consumer, `image-${index}.png`), bytes);
		const manifest = join(consumer, "manifest.json");
		const pins = join(consumer, "pins.json");
		await writeFile(
			manifest,
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
		await writeFile(pins, JSON.stringify(fixture.operatorPins));
		const entry = join(consumer, "node_modules/.bin/portrait-generator");
		const help = await run("node", [entry, "--help"], consumer);
		const args = [entry, "preflight", "--input", manifest, "--pins", pins];
		const preflight = await run("node", args, consumer);
		expect(help).toMatchObject({ code: 0, stderr: "" });
		expect(preflight).toMatchObject({ code: 0, stderr: "" });
		expect(JSON.parse(preflight.stdout).projection).toEqual({
			textSHA: fixture.projection.textSHA,
			renderingSHA: fixture.projection.renderingSHA,
			providerCalls: 0,
			dispatched: false,
		});
		await writeFile(
			pins,
			JSON.stringify({ ...fixture.operatorPins, lookSHA: "0".repeat(64) }),
		);
		const held = await run("node", args, consumer);
		expect(held).toMatchObject({
			code: 1,
			stdout: "",
			stderr: "ARTIFACT_HASH_MISMATCH: ARTIFACT_HASH_MISMATCH\n",
		});
	} finally {
		await rm(directory, { recursive: true });
	}
}, 120_000);
