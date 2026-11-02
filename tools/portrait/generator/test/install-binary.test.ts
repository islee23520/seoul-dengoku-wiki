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
import { join } from "node:path";
import { installPortraitBinary } from "../src/install-binary.js";

let binary: Buffer<ArrayBuffer>;
let checksum: string;

beforeAll(async () => {
	binary = await readFile(
		new URL("../dist/portrait-generator", import.meta.url),
	);
	// Computed independently of the installer, not supplied by the download server.
	checksum = createHash("sha256").update(binary).digest("hex");
});

async function fixture() {
	const directory = await mkdtemp(join(tmpdir(), "portrait installer space "));
	const requests: string[] = [];
	const server = createServer((request, response) => {
		const path = request.url ?? "/";
		requests.push(path);
		if (path === "/redirect") {
			response.writeHead(302, { location: "/binary" });
			response.end();
		} else if (path === "/error") {
			response.writeHead(500);
			response.end("server failure");
		} else if (path === "/truncated") {
			response.writeHead(200, { "content-length": binary.length });
			response.end(binary.subarray(0, 64));
		} else {
			response.writeHead(200, { "content-length": binary.length });
			response.end(binary);
		}
	});
	const listening = once(server, "listening", {
		signal: AbortSignal.timeout(5_000),
	});
	server.listen(0, "127.0.0.1");
	await listening;
	const address = server.address();
	if (address === null || typeof address === "string") {
		throw new Error("Expected a TCP fixture address");
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

async function runHelp(command: string, cwd: string) {
	const child = spawn(command, ["--help"], {
		cwd,
		env: { PATH: "" },
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

describe("installPortraitBinary", () => {
	test("write failure leaves no partial executable or temporary file", async () => {
		const f = await fixture();
		try {
			const script = `
				import fs from 'node:fs/promises';
				import { syncBuiltinESMExports } from 'node:module';
				const originalOpen = fs.open;
				let injected = false;
				fs.open = async (...args) => {
					const file = await originalOpen(...args);
					file.writeFile = async () => { injected = true; const error = new Error('disk full'); error.code = 'ENOSPC'; throw error; };
					return file;
				};
				syncBuiltinESMExports();
				const { installPortraitBinary } = await import(${JSON.stringify(new URL("../dist/install-binary.js", import.meta.url).href)});
				try { await installPortraitBinary(${JSON.stringify({ url: `${f.url}/binary`, expectedSHA256: checksum, destination: f.destination, allowLocalHttp: true })}); } catch (error) { if (error.code !== 'ENOSPC') throw error; }
				if (!injected) throw new Error('Fault injection did not execute');
			`;
			const child = spawn("node", ["--input-type=module", "-e", script], {
				stdio: "ignore",
				signal: AbortSignal.timeout(10000),
			});
			expect((await once(child, "close"))[0]).toBe(0);
			expect(await readdir(f.directory)).toEqual([]);
		} finally {
			await f.close();
		}
	});

	test("installs exact executable bytes and runs help outside the checkout with empty PATH", async () => {
		const f = await fixture();
		try {
			const result = await installPortraitBinary({
				url: `${f.url}/binary`,
				expectedSHA256: checksum,
				destination: f.destination,
				allowLocalHttp: true,
			});
			expect(result.installed).toBe(true);
			expect(f.requests).toEqual(["/binary"]);
			expect(await readFile(f.destination)).toEqual(binary);
			expect((await stat(f.destination)).mode & 0o111).toBe(0o111);
			expect(await readdir(f.directory)).toEqual(["portrait generator"]);
			const help = await runHelp(f.destination, f.directory);
			expect(help.code).toBe(0);
			expect(help.stdout).toContain("Usage: portrait-generator");
			expect(help.stderr).toBe("");
		} finally {
			await f.close();
		}
	}, 20_000);

	for (const failure of [
		{ name: "bad SHA", path: "/binary", sha: "0".repeat(64) },
		{ name: "redirect without following its target", path: "/redirect" },
		{ name: "HTTP 500", path: "/error" },
		{ name: "truncated response body", path: "/truncated" },
	]) {
		test(`rejects ${failure.name} without a final or temporary file`, async () => {
			const f = await fixture();
			try {
				const result = await installPortraitBinary({
					url: `${f.url}${failure.path}`,
					expectedSHA256: failure.sha ?? checksum,
					destination: f.destination,
					allowLocalHttp: true,
				});
				expect(result.installed).toBe(false);
				expect(await readdir(f.directory)).toEqual([]);
				expect(f.requests).toEqual([failure.path]);
			} finally {
				await f.close();
			}
		}, 15_000);
	}

	test("rejects an existing destination without replacing its bytes", async () => {
		const f = await fixture();
		try {
			const original = Buffer.from("existing destination must survive");
			await writeFile(f.destination, original, { flag: "wx" });
			const result = await installPortraitBinary({
				url: `${f.url}/binary`,
				expectedSHA256: checksum,
				destination: f.destination,
				allowLocalHttp: true,
			});
			expect(result.installed).toBe(false);
			expect(await readFile(f.destination)).toEqual(original);
			expect(await readdir(f.directory)).toEqual(["portrait generator"]);
			expect(f.requests).toEqual([]);
		} finally {
			await f.close();
		}
	});

	for (const invalid of ["remote HTTP", "local HTTP without opt-in", "SHA"]) {
		test(`rejects invalid ${invalid} before making any request`, async () => {
			const f = await fixture();
			try {
				const result = await installPortraitBinary({
					url: invalid === "remote HTTP" ? f.remoteHttpUrl : `${f.url}/binary`,
					expectedSHA256: invalid === "SHA" ? "not-a-sha256" : checksum,
					destination: f.destination,
					allowLocalHttp: invalid !== "local HTTP without opt-in",
				});
				expect(result.installed).toBe(false);
				expect(f.requests).toEqual([]);
				expect(await readdir(f.directory)).toEqual([]);
			} finally {
				await f.close();
			}
		});
	}
});
