import { beforeAll, describe, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import {
	mkdir,
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
import { fileURLToPath } from "node:url";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bootstrap = join(packageDirectory, "install.sh");
let installer: Buffer<ArrayBuffer>;
let binary: Buffer<ArrayBuffer>;
let installerSHA: string;
let binarySHA: string;

async function run(command: string, args: string[], cwd: string, temp: string) {
	const child = spawn(command, args, {
		cwd,
		// Native shell utilities only: no Bun/Node runtime supplied to bootstrap.
		env: { PATH: "/usr/bin:/bin", TMPDIR: temp },
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

beforeAll(async () => {
	const installerPath = join(packageDirectory, "dist/portrait-install");
	const binaryPath = join(packageDirectory, "dist/portrait-generator");
	installer = await readFile(installerPath);
	binary = await readFile(binaryPath);
	// Independent operator pins from the actual OS hash utility, not downloads.
	const hashCommand = process.platform === "darwin" ? "shasum" : "sha256sum";
	const hashArgs = process.platform === "darwin" ? ["-a", "256"] : [];
	for (const path of [installerPath, binaryPath]) {
		const result = await run(
			hashCommand,
			[...hashArgs, path],
			packageDirectory,
			tmpdir(),
		);
		expect(result.code).toBe(0);
		expect(result.stderr).toBe("");
		const sha = result.stdout.split(/\s/)[0];
		if (sha === undefined || !/^[a-f0-9]{64}$/.test(sha)) {
			throw new Error("OS hash utility did not return SHA256");
		}
		if (path === installerPath) installerSHA = sha;
		else binarySHA = sha;
	}
});

async function fixture() {
	const directory = await mkdtemp(join(tmpdir(), "portrait bootstrap space "));
	const temp = join(directory, "bootstrap temp space");
	const cwd = join(directory, "outside checkout space");
	await mkdir(temp);
	await mkdir(cwd);
	const requests: string[] = [];
	const server = createServer((request, response) => {
		const path = request.url ?? "/";
		requests.push(path);
		if (path === "/redirect") {
			response.writeHead(302, { location: "/installer" });
			response.end();
		} else if (path === "/error") {
			response.writeHead(500);
			response.end("download failed");
		} else if (path === "/installer" || path === "/binary") {
			const bytes = path === "/installer" ? installer : binary;
			response.writeHead(200, {
				"content-length": bytes.length,
				connection: "close",
			});
			response.end(bytes);
		} else {
			response.writeHead(404);
			response.end();
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
		cwd,
		temp,
		destination: join(cwd, "portrait generator"),
		url: `http://127.0.0.1:${address.port}`,
		remote: `http://0.0.0.0:${address.port}`,
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
		"--installer-url",
		`${f.url}/installer`,
		"--installer-sha256",
		installerSHA,
		"--url",
		`${f.url}/binary`,
		"--sha256",
		binarySHA,
		"--destination",
		f.destination,
		"--allow-local-http",
	];
}

function invoke(f: Fixture, args: string[]) {
	return run("/bin/sh", [bootstrap, ...args], f.cwd, f.temp);
}

async function expectFailure(
	f: Fixture,
	args: string[],
	requests: string[],
	existing?: Buffer<ArrayBuffer>,
) {
	const result = await invoke(f, args);
	expect(result.code).toBe(1);
	expect(result.stdout).toBe("");
	expect(result.stderr.length).toBeGreaterThan(0);
	expect(f.requests).toEqual(requests);
	expect(await readdir(f.temp)).toEqual([]);
	expect(await readdir(f.cwd)).toEqual(existing ? ["portrait generator"] : []);
	if (existing) expect(await readFile(f.destination)).toEqual(existing);
}

describe("POSIX bootstrap real native utilities", () => {
	test("verifies standalone installer, installs identical generator and runs help outside checkout", async () => {
		const f = await fixture();
		try {
			const result = await invoke(f, validArgs(f));
			expect(result.code).toBe(0);
			expect(result.stderr).toBe("");
			expect(f.requests).toEqual(["/installer", "/binary"]);
			expect(await readdir(f.temp)).toEqual([]);
			expect(await readdir(f.cwd)).toEqual(["portrait generator"]);
			expect(await readFile(f.destination)).toEqual(binary);
			expect((await stat(f.destination)).mode & 0o111).toBe(0o111);
			expect(JSON.parse(result.stdout)).toEqual({
				installed: true,
				path: f.destination,
				sha256: binarySHA,
			});
			const help = await run(f.destination, ["--help"], f.cwd, f.temp);
			expect(help.code).toBe(0);
			expect(help.stderr).toBe("");
			expect(help.stdout).toContain("Usage: portrait-generator");
		} finally {
			await f.close();
		}
	}, 20_000);

	for (const failure of [
		{
			name: "installer SHA mismatch never executes installer",
			index: 3,
			value: "0".repeat(64),
			requests: ["/installer"],
		},
		{
			name: "binary SHA mismatch leaves no final file",
			index: 7,
			value: "0".repeat(64),
			requests: ["/installer", "/binary"],
		},
		{
			name: "installer redirect is rejected without following",
			index: 1,
			value: "/redirect",
			requests: ["/redirect"],
		},
		{
			name: "curl HTTP failure cleans bootstrap directory",
			index: 1,
			value: "/error",
			requests: ["/error"],
		},
	]) {
		test(failure.name, async () => {
			const f = await fixture();
			try {
				const args = validArgs(f);
				args[failure.index] = failure.value.startsWith("/")
					? `${f.url}${failure.value}`
					: failure.value;
				await expectFailure(f, args, failure.requests);
			} finally {
				await f.close();
			}
		}, 15_000);
	}

	test("existing destination survives with no generator download", async () => {
		const f = await fixture();
		try {
			const existing = Buffer.from("preserve exact existing destination bytes");
			await writeFile(f.destination, existing, { flag: "wx" });
			await expectFailure(f, validArgs(f), ["/installer"], existing);
		} finally {
			await f.close();
		}
	});

	const invalid: { name: string; args: (f: Fixture) => string[] }[] = [
		{ name: "no arguments", args: () => [] },
		{ name: "unknown option", args: (f) => [...validArgs(f), "--overwrite"] },
		{ name: "positional argument", args: (f) => [...validArgs(f), "extra"] },
		{
			name: "duplicate local opt-in",
			args: (f) => [...validArgs(f), "--allow-local-http"],
		},
		{
			name: "local HTTP without opt-in",
			args: (f) => validArgs(f).slice(0, 10),
		},
	];
	for (const [index, flag] of [
		"--installer-url",
		"--installer-sha256",
		"--url",
		"--sha256",
		"--destination",
	].entries()) {
		invalid.push(
			{
				name: `missing ${flag}`,
				args: (f) =>
					validArgs(f).filter((_, i) => i !== index * 2 && i !== index * 2 + 1),
			},
			{
				name: `duplicate ${flag}`,
				args: (f) => [...validArgs(f), flag, "duplicate"],
			},
			{
				name: `empty ${flag}`,
				args: (f) => {
					const args = validArgs(f);
					args[index * 2 + 1] = "";
					return args;
				},
			},
			{ name: `dangling ${flag}`, args: (f) => [...validArgs(f), flag] },
		);
	}
	for (const index of [3, 7]) {
		invalid.push({
			name: `malformed SHA at ${index}`,
			args: (f) => {
				const args = validArgs(f);
				args[index] = "not-a-sha";
				return args;
			},
		});
	}
	for (const index of [1, 5]) {
		invalid.push(
			{
				name: `remote HTTP at ${index} denied even with opt-in`,
				args: (f) => {
					const args = validArgs(f);
					args[index] = `${f.remote}/installer`;
					return args;
				},
			},
			{
				name: `credential URL at ${index}`,
				args: (f) => {
					const args = validArgs(f);
					args[index] =
						`${f.url.replace("http://", "http://user:password@")}/installer`;
					return args;
				},
			},
			{
				name: `flag used as URL at ${index}`,
				args: (f) => {
					const args = validArgs(f);
					args[index] = "--allow-local-http";
					return args;
				},
			},
		);
	}
	for (const scenario of invalid) {
		test(`rejects ${scenario.name} before requests or files`, async () => {
			const f = await fixture();
			try {
				await expectFailure(f, scenario.args(f), []);
			} finally {
				await f.close();
			}
		});
	}
});
