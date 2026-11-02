import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import {
	mkdtemp,
	readdir,
	readFile,
	rm,
	stat,
	writeFile,
} from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const directory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const binary = Buffer.from('#!/bin/sh\nprintf "u06-fixed-executable\\n"\n');
const checksum =
	"1427c3cdf25f8b6d83193e4e9921e9dbde08c6ab632c031b4c21e8afde8f248d";
const runtimes = [
	{
		name: "Bun source",
		command: process.execPath,
		prefix: [join(directory, "src/install-command.ts")],
	},
	{
		name: "Node emitted",
		command: "node",
		prefix: [join(directory, "dist/install-command.js")],
	},
	{
		name: "standalone",
		command: join(directory, "dist/u06-install"),
		prefix: [],
	},
];

async function run(
	command: string,
	args: string[],
	cwd: string,
	input?: string,
) {
	const child = spawn(command, args, {
		cwd,
		env:
			command === join(directory, "dist/u06-install")
				? { PATH: "" }
				: process.env,
		stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
	});
	const closed = once(child, "close", { signal: AbortSignal.timeout(10_000) });
	let stdout = "";
	let stderr = "";
	child.stdout?.setEncoding("utf8").on("data", (chunk: string) => {
		stdout += chunk;
	});
	child.stderr?.setEncoding("utf8").on("data", (chunk: string) => {
		stderr += chunk;
	});
	if (input !== undefined) child.stdin?.end(input);
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

async function fixture() {
	const cwd = await mkdtemp(join(tmpdir(), "u06 installer space "));
	const requests: string[] = [];
	const server = createServer((request, response) => {
		requests.push(request.url ?? "");
		response.writeHead(200, {
			"content-length": binary.length,
			connection: "close",
		});
		response.end(binary);
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
	const destination = join(cwd, "fixed executable");
	const args = [
		"--url",
		`http://127.0.0.1:${address.port}/binary`,
		"--sha256",
		checksum,
		"--destination",
		destination,
		"--allow-local-http",
	];
	return {
		cwd,
		destination,
		requests,
		args,
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

test("literal HTTP executable pin is independently correct", () => {
	expect(createHash("sha256").update(binary).digest("hex")).toBe(checksum);
});

for (const runtime of runtimes) {
	for (const variant of [
		"success",
		"exclusive destination",
		"wrong checksum",
		"local opt-in required",
		"missing URL",
		"missing SHA",
		"missing destination",
		"duplicate URL",
		"duplicate SHA",
		"duplicate destination",
		"duplicate opt-in",
		"unknown flag",
		"empty value",
		"flag as value",
		"dangling flag",
		"no arguments",
	] as const) {
		test(`${runtime.name} ${variant}`, async () => {
			const f = await fixture();
			try {
				let args = [...f.args];
				if (variant === "exclusive destination")
					await writeFile(f.destination, "retained-original", { flag: "wx" });
				if (variant === "wrong checksum") args[3] = "0".repeat(64);
				if (variant === "local opt-in required") args = args.slice(0, 6);
				if (variant === "missing URL") args.splice(0, 2);
				if (variant === "missing SHA") args.splice(2, 2);
				if (variant === "missing destination") args.splice(4, 2);
				if (variant === "duplicate URL")
					args.push("--url", "https://invalid.example/binary");
				if (variant === "duplicate SHA") args.push("--sha256", checksum);
				if (variant === "duplicate destination")
					args.push("--destination", f.destination);
				if (variant === "duplicate opt-in") args.push("--allow-local-http");
				if (variant === "unknown flag") args.push("--overwrite");
				if (variant === "empty value") args[5] = "";
				if (variant === "flag as value") args[1] = "--sha256";
				if (variant === "dangling flag") args.push("--url");
				if (variant === "no arguments") args = [];
				const result = await run(
					runtime.command,
					[...runtime.prefix, ...args],
					f.cwd,
				);
				if (variant === "success") {
					expect(result).toEqual({
						code: 0,
						stdout: `${JSON.stringify({
							installed: true,
							path: f.destination,
							sha256: checksum,
						})}\n`,
						stderr: "",
					});
					expect(f.requests).toEqual(["/binary"]);
					expect(await readFile(f.destination)).toEqual(binary);
					expect((await stat(f.destination)).mode & 0o111).toBe(0o111);
					expect(await readdir(f.cwd)).toEqual(["fixed executable"]);
				} else {
					const code = [
						"exclusive destination",
						"wrong checksum",
						"local opt-in required",
					].includes(variant)
						? "INSTALL_FAILED"
						: "INVALID_ARGUMENTS";
					expect(result).toEqual({
						code: 1,
						stdout: "",
						stderr: `${code}: ${code}\n`,
					});
					expect(f.requests).toEqual(
						variant === "wrong checksum" ? ["/binary"] : [],
					);
					expect(await readdir(f.cwd)).toEqual(
						variant === "exclusive destination" ? ["fixed executable"] : [],
					);
					if (variant === "exclusive destination")
						expect(await readFile(f.destination, "utf8")).toBe(
							"retained-original",
						);
				}
			} finally {
				await f.close();
			}
		}, 20_000);
	}
}

for (const runtime of runtimes.slice(0, 2)) {
	for (const owner of ["install-command", "install-cli"]) {
		for (const mode of ["eval", "stdin"] as const) {
			test(`${runtime.name} ${owner} silent ${mode} import`, async () => {
				const f = await fixture();
				try {
					const entry = join(
						directory,
						runtime.name === "Bun source"
							? `src/${owner}.ts`
							: `dist/${owner}.js`,
					);
					const script =
						"process.argv = [process.execPath, " +
						JSON.stringify(entry) +
						", ..." +
						JSON.stringify(f.args) +
						"]; await import(" +
						JSON.stringify(pathToFileURL(entry).href) +
						");";
					const args =
						mode === "eval"
							? ["--input-type=module", "-e", script]
							: ["--input-type=module", "-"];
					expect(
						await run(
							runtime.command,
							args,
							f.cwd,
							mode === "stdin" ? script : undefined,
						),
					).toEqual({ code: 0, stdout: "", stderr: "" });
					expect(f.requests).toEqual([]);
					expect(await readdir(f.cwd)).toEqual([]);
				} finally {
					await f.close();
				}
			});
		}
	}
}
