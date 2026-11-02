import { beforeAll, describe, expect, test } from "bun:test";
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

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceEntry = join(packageDirectory, "src/install-cli.ts");
const emittedEntry = join(packageDirectory, "dist/install-cli.js");
const standaloneEntry = join(packageDirectory, "dist/portrait-install");
let binary: Buffer<ArrayBuffer>;
let checksum: string;

beforeAll(async () => {
	binary = await readFile(join(packageDirectory, "dist/portrait-generator"));
	// The expected hash is independent of the HTTP download and installer.
	checksum = createHash("sha256").update(binary).digest("hex");
});

async function run(
	command: string,
	args: string[],
	cwd: string,
	emptyPath = false,
) {
	const child = spawn(command, args, {
		cwd,
		env: emptyPath ? { PATH: "" } : process.env,
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
	try {
		const [code] = await once(child, "close", {
			signal: AbortSignal.timeout(10_000),
		});
		return { code, stdout, stderr };
	} finally {
		if (child.exitCode === null && child.signalCode === null) {
			const closed = once(child, "close", {
				signal: AbortSignal.timeout(5_000),
			});
			child.kill("SIGKILL");
			await closed;
		}
	}
}

async function fixture() {
	const directory = await mkdtemp(
		join(tmpdir(), "portrait install cli space "),
	);
	const requests: string[] = [];
	const server = createServer((request, response) => {
		const path = request.url ?? "/";
		requests.push(path);
		if (path === "/redirect") {
			response.writeHead(302, { location: "/binary" });
			response.end();
		} else if (path === "/error") {
			response.writeHead(500);
			response.end("private-server-secret");
		} else {
			response.writeHead(200, {
				"content-length": binary.length,
				connection: "close",
			});
			response.end(path === "/truncated" ? binary.subarray(0, 64) : binary);
		}
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
		await rm(directory, { recursive: true });
		throw error;
	}
	const address = server.address();
	if (address === null || typeof address === "string") {
		throw new Error("Expected TCP fixture address");
	}
	return {
		directory,
		destination: join(directory, "portrait generator"),
		url: `http://127.0.0.1:${address.port}`,
		remoteHttpUrl: `http://0.0.0.0:${address.port}/binary`,
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
				await rm(directory, { recursive: true });
			}
		},
	};
}

type Fixture = Awaited<ReturnType<typeof fixture>>;
function validArgs(f: Fixture) {
	return [
		"--url",
		`${f.url}/binary`,
		"--sha256",
		checksum,
		"--destination",
		f.destination,
		"--allow-local-http",
	];
}

function expectFailure(result: Awaited<ReturnType<typeof run>>) {
	expect(result.code).toBe(1);
	expect(result.stdout).toBe("");
	// A typed, single-line diagnostic, never a URL, secret, or stack trace.
	expect(result.stderr).toMatch(/^[A-Z][A-Z_]+: [A-Z][A-Z_]+\n$/);
}

const runtimes = [
	{
		name: "Bun source",
		command: process.execPath,
		prefix: [sourceEntry],
		emptyPath: false,
	},
	{
		name: "Node emitted",
		command: "node",
		prefix: [emittedEntry],
		emptyPath: false,
	},
	{
		name: "standalone empty PATH",
		command: standaloneEntry,
		prefix: [],
		emptyPath: true,
	},
];

for (const runtime of runtimes) {
	describe(`portrait-install ${runtime.name}`, () => {
		const invoke = (f: Fixture, args: string[]) =>
			run(
				runtime.command,
				[...runtime.prefix, ...args],
				f.directory,
				runtime.emptyPath,
			);

		test("installs the independently pinned real binary and executes help outside checkout", async () => {
			const f = await fixture();
			try {
				const result = await invoke(f, validArgs(f));
				expect(result.code).toBe(0);
				expect(result.stderr).toBe("");
				expect(JSON.parse(result.stdout)).toEqual({
					installed: true,
					path: f.destination,
					sha256: checksum,
				});
				expect(f.requests).toEqual(["/binary"]);
				expect(await readFile(f.destination)).toEqual(binary);
				expect((await stat(f.destination)).mode & 0o111).toBe(0o111);
				expect(await readdir(f.directory)).toEqual(["portrait generator"]);
				const help = await run(f.destination, ["--help"], f.directory, true);
				expect(help.code).toBe(0);
				expect(help.stdout).toContain("Usage: portrait-generator");
				expect(help.stderr).toBe("");
			} finally {
				await f.close();
			}
		}, 20_000);

		for (const failure of [
			{ name: "bad SHA", path: "/binary", sha: "0".repeat(64) },
			{ name: "redirect", path: "/redirect" },
			{ name: "HTTP 500", path: "/error" },
			{ name: "truncated body", path: "/truncated" },
		]) {
			test(`fails ${failure.name} without partial files or redirect requests`, async () => {
				const f = await fixture();
				try {
					const args = validArgs(f);
					args[1] = `${f.url}${failure.path}`;
					args[3] = failure.sha ?? checksum;
					const result = await invoke(f, args);
					expectFailure(result);
					expect(f.requests).toEqual([failure.path]);
					expect(await readdir(f.directory)).toEqual([]);
				} finally {
					await f.close();
				}
			}, 15_000);
		}

		test("never overwrites an existing destination or downloads for it", async () => {
			const f = await fixture();
			try {
				const original = Buffer.from("existing destination must survive");
				await writeFile(f.destination, original, { flag: "wx" });
				const result = await invoke(f, validArgs(f));
				expectFailure(result);
				expect(await readFile(f.destination)).toEqual(original);
				expect(await readdir(f.directory)).toEqual(["portrait generator"]);
				expect(f.requests).toEqual([]);
			} finally {
				await f.close();
			}
		});

		const invalidCases: { name: string; args: (f: Fixture) => string[] }[] = [
			{ name: "no arguments", args: () => [] },
			{ name: "missing URL", args: (f) => validArgs(f).slice(2) },
			{
				name: "missing SHA",
				args: (f) => [
					"--url",
					`${f.url}/binary`,
					"--destination",
					f.destination,
					"--allow-local-http",
				],
			},
			{ name: "missing destination", args: (f) => validArgs(f).slice(0, 4) },
			{
				name: "dangling flag",
				args: (f) => [...validArgs(f), "--destination"],
			},
			{ name: "unknown flag", args: (f) => [...validArgs(f), "--overwrite"] },
			{
				name: "duplicate URL",
				args: (f) => [...validArgs(f), "--url", `${f.url}/binary`],
			},
			{
				name: "duplicate SHA",
				args: (f) => [...validArgs(f), "--sha256", checksum],
			},
			{
				name: "duplicate destination",
				args: (f) => [...validArgs(f), "--destination", f.destination],
			},
			{
				name: "duplicate local opt-in",
				args: (f) => [...validArgs(f), "--allow-local-http"],
			},
			{
				name: "positional argument",
				args: (f) => [...validArgs(f), "private-argument-secret"],
			},
			{
				name: "malformed SHA",
				args: (f) => [
					"--url",
					`${f.url}/binary`,
					"--sha256",
					"not-a-sha256",
					"--destination",
					f.destination,
					"--allow-local-http",
				],
			},
			{
				name: "remote HTTP",
				args: (f) => [
					"--url",
					f.remoteHttpUrl,
					"--sha256",
					checksum,
					"--destination",
					f.destination,
					"--allow-local-http",
				],
			},
			{
				name: "local HTTP without opt-in",
				args: (f) => validArgs(f).slice(0, 6),
			},
			{
				name: "credential URL",
				args: (f) => [
					"--url",
					f.url.replace("http://", "http://private-user:private-password@"),
					"--sha256",
					checksum,
					"--destination",
					f.destination,
					"--allow-local-http",
				],
			},
			{
				name: "empty destination",
				args: (f) => [
					"--url",
					`${f.url}/binary`,
					"--sha256",
					checksum,
					"--destination",
					"",
					"--allow-local-http",
				],
			},
			{
				name: "flag used as URL value",
				args: (f) => [
					"--url",
					"--allow-local-http",
					"--sha256",
					checksum,
					"--destination",
					f.destination,
				],
			},
		];
		for (const invalid of invalidCases) {
			test(`rejects ${invalid.name} before any request or file write`, async () => {
				const f = await fixture();
				try {
					const result = await invoke(f, invalid.args(f));
					expectFailure(result);
					expect(f.requests).toEqual([]);
					expect(await readdir(f.directory)).toEqual([]);
				} finally {
					await f.close();
				}
			});
		}
	});
}

for (const runtime of runtimes.slice(0, 2)) {
	test(`stdin import ${runtime.name} is silent without file entry detection`, async () => {
		const entry = runtime.name === "Bun source" ? sourceEntry : emittedEntry;
		const child = spawn(runtime.command, ["--input-type=module", "-"], {
			stdio: ["pipe", "pipe", "pipe"],
			signal: AbortSignal.timeout(10000),
		});
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (bytes: Buffer) => {
			stdout += bytes.toString();
		});
		child.stderr.on("data", (bytes: Buffer) => {
			stderr += bytes.toString();
		});
		const closed = once(child, "close");
		child.stdin.end(
			`await import(${JSON.stringify(pathToFileURL(entry).href)});`,
		);
		expect((await closed)[0]).toBe(0);
		expect(stdout).toBe("");
		expect(stderr).toBe("");
	});

	test(`importing ${runtime.name} performs no installer I/O or entry execution`, async () => {
		const f = await fixture();
		try {
			const entry = runtime.name === "Bun source" ? sourceEntry : emittedEntry;
			const script = `process.argv = [process.execPath, ${JSON.stringify(entry)}, ...${JSON.stringify(validArgs(f))}]; globalThis.fetch = () => { throw new Error("IMPORT_FETCH_FORBIDDEN"); }; await import(${JSON.stringify(pathToFileURL(entry).href)});`;
			const result = await run(
				runtime.command,
				["--input-type=module", "-e", script],
				f.directory,
			);
			expect(result).toEqual({ code: 0, stdout: "", stderr: "" });
			expect(f.requests).toEqual([]);
			expect(await readdir(f.directory)).toEqual([]);
		} finally {
			await f.close();
		}
	});
}
