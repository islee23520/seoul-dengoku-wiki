import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const bytes = Buffer.from('#!/bin/sh\nprintf "u06-fixed-executable\\n"\n');
const sha256 =
	"1427c3cdf25f8b6d83193e4e9921e9dbde08c6ab632c031b4c21e8afde8f248d";
const runtimes = [
	{ name: "Node 26.4", command: "/opt/homebrew/bin/node" },
	{
		name: "Node 24.19",
		command:
			"/Users/ilseoblee/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node",
	},
];

async function fixture() {
	const cwd = await mkdtemp(join(tmpdir(), "u06 invocation boundary "));
	const requests: string[] = [];
	const server = createServer((request, response) => {
		requests.push(request.url ?? "");
		response.writeHead(200, {
			"content-length": bytes.length,
			connection: "close",
		});
		response.end(bytes);
	});
	try {
		const listening = once(server, "listening", {
			signal: AbortSignal.timeout(5_000),
		});
		server.listen(0, "127.0.0.1");
		await listening;
	} catch (error) {
		server.close();
		server.closeAllConnections();
		await rm(cwd, { recursive: true });
		throw error;
	}
	const address = server.address();
	if (!address || typeof address === "string")
		throw new Error("Expected TCP address");
	const destination = join(cwd, "executable");
	const args = [
		"--url",
		`http://127.0.0.1:${address.port}/binary`,
		"--sha256",
		sha256,
		"--destination",
		destination,
		"--allow-local-http",
	];
	return {
		cwd,
		destination,
		args,
		requests,
		async close() {
			try {
				const closed = once(server, "close", {
					signal: AbortSignal.timeout(5_000),
				});
				server.close();
				server.closeAllConnections();
				await closed;
			} finally {
				await rm(cwd, { recursive: true });
			}
		},
	};
}

async function invoke(command: string, args: string[], cwd: string) {
	const child = spawn(command, args, {
		cwd,
		stdio: ["ignore", "pipe", "pipe"],
	});
	const closed = once(child, "close", { signal: AbortSignal.timeout(10_000) });
	let stdout = "";
	let stderr = "";
	child.stdout.on("data", (chunk: Buffer) => {
		stdout += chunk.toString();
	});
	child.stderr.on("data", (chunk: Buffer) => {
		stderr += chunk.toString();
	});
	try {
		const [code] = await closed;
		return { code, stdout, stderr };
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

for (const runtime of runtimes) {
	for (const owner of ["install-command", "install-cli"]) {
		const entry = fileURLToPath(
			new URL(`../dist/${owner}.js`, import.meta.url),
		);
		for (const mode of [
			"eval positional",
			"eval equals alias",
			"separator invalid",
			"separator success",
		] as const) {
			test(`${runtime.name} ${owner} ${mode}`, async () => {
				const f = await fixture();
				try {
					const script = `process.argv = [process.execPath, ${JSON.stringify(entry)}, ...${JSON.stringify(f.args)}]; await import(${JSON.stringify(pathToFileURL(entry).href)});`;
					const args =
						mode === "eval positional"
							? ["--input-type=module", "-e", script, entry]
							: mode === "eval equals alias"
								? ["--input-type=module", `--eval=${script}`, entry]
								: mode === "separator invalid"
									? ["--", entry]
									: ["--", entry, ...f.args];
					const result = await invoke(runtime.command, args, f.cwd);
					console.log(
						JSON.stringify({
							runtime: runtime.name,
							owner,
							mode,
							result,
							requests: f.requests,
							files: await readdir(f.cwd),
						}),
					);
					if (mode.startsWith("eval")) {
						expect(f.requests).toEqual([]);
						expect(await readdir(f.cwd)).toEqual([]);
						expect(result).toEqual({ code: 0, stdout: "", stderr: "" });
					} else if (mode === "separator invalid") {
						expect(result.code).toBe(1);
						expect(result.stdout).toBe("");
						expect(result.stderr.split(": ")[0]).toBe("INVALID_ARGUMENTS");
						expect(result.stderr.trim().split("\n")).toHaveLength(1);
						expect(f.requests).toEqual([]);
						expect(await readdir(f.cwd)).toEqual([]);
					} else {
						expect(result.code).toBe(0);
						expect(result.stderr).toBe("");
						expect(JSON.parse(result.stdout)).toEqual({
							installed: true,
							path: f.destination,
							sha256,
						});
						expect(f.requests).toEqual(["/binary"]);
						expect(await readFile(f.destination)).toEqual(bytes);
						expect((await stat(f.destination)).mode & 0o111).toBe(0o111);
						expect(await readdir(f.cwd)).toEqual(["executable"]);
					}
				} finally {
					await f.close();
				}
			}, 20_000);
		}
	}
}
