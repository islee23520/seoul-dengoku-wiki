import { afterAll, beforeAll, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

let temporary: string;
const entries: string[] = [];
beforeAll(async () => {
	temporary = await mkdtemp(join(tmpdir(), "u06 node floor "));
	await writeFile(join(temporary, "package.json"), '{"type":"module"}');
	for (const owner of ["install-binary", "install-command", "install-cli"]) {
		const emitted = await readFile(
			new URL(`../dist/${owner}.js`, import.meta.url),
			"utf8",
		);
		const entry = join(temporary, `${owner}.js`);
		await writeFile(entry, emitted.replaceAll("import.meta.main", "undefined"));
		if (owner !== "install-binary") entries.push(entry);
	}
});
afterAll(async () => {
	await rm(temporary, { recursive: true });
});

async function invoke(args: string[], input?: string) {
	const child = spawn("node", args, {
		stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
	});
	const closed = once(child, "close", { signal: AbortSignal.timeout(10_000) });
	let stdout = "";
	let stderr = "";
	child.stdout?.on("data", (bytes: Buffer) => {
		stdout += bytes.toString();
	});
	child.stderr?.on("data", (bytes: Buffer) => {
		stderr += bytes.toString();
	});
	if (input !== undefined) child.stdin?.end(input);
	try {
		return { code: (await closed)[0], stdout, stderr };
	} finally {
		if (child.exitCode === null && child.signalCode === null) {
			const killed = once(child, "close", {
				signal: AbortSignal.timeout(5_000),
			});
			child.kill("SIGKILL");
			await killed;
		}
	}
}

for (const index of [0, 1]) {
	test(`floor native API absence still executes entry ${index}`, async () => {
		const entry = entries[index];
		if (entry === undefined) throw new Error("Missing supplemental entry");
		expect(await invoke([entry])).toEqual({
			code: 1,
			stdout: "",
			stderr: "INVALID_ARGUMENTS: INVALID_ARGUMENTS\n",
		});
	});
	for (const mode of ["eval", "stdin-explicit", "stdin-auto"] as const) {
		test(`floor import stays silent with rewritten argv ${index} ${mode}`, async () => {
			const entry = entries[index];
			if (entry === undefined) throw new Error("Missing supplemental entry");
			const script = `process.argv = [process.execPath, ${JSON.stringify(entry)}]; await import(${JSON.stringify(pathToFileURL(entry).href)});`;
			const args =
				mode === "eval"
					? ["--input-type=module", "-e", script]
					: mode === "stdin-explicit"
						? ["--input-type=module", "-"]
						: ["-"];
			expect(await invoke(args, mode === "eval" ? undefined : script)).toEqual({
				code: 0,
				stdout: "",
				stderr: "",
			});
		});
	}
}
