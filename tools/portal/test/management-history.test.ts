import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { operations, remoteInputs } from "../src/management.ts";

type Deadline = (expire: () => void, milliseconds: number) => () => void;
const deadline: Deadline = (expire, milliseconds) => {
	const timer = setTimeout(expire, milliseconds);
	return () => clearTimeout(timer);
};
function boundedEvent(
	source: EventEmitter,
	event: string,
	milliseconds: number,
	trigger: () => void,
	schedule: Deadline = deadline,
): Promise<unknown[]> {
	return new Promise((resolve, reject) => {
		let cancel = () => {};
		const clean = () => {
			cancel();
			source.removeListener(event, done);
			source.removeListener("error", failed);
		};
		const done = (...values: unknown[]) => {
			clean();
			resolve(values);
		};
		const failed = (error: Error) => {
			clean();
			reject(error);
		};
		source.once(event, done);
		source.once("error", failed);
		cancel = schedule(() => failed(new Error("TEST_DEADLINE")), milliseconds);
		try {
			trigger();
		} catch (error) {
			failed(error as Error);
		}
	});
}
type OwnedChild = EventEmitter & {
	kill(signal: NodeJS.Signals): boolean;
};
function ownChild(child: OwnedChild, schedule: Deadline = deadline) {
	let outcome: unknown[] | undefined;
	const closed = (...values: unknown[]) => {
		outcome = values;
	};
	const failed = () => {};
	child.once("close", closed);
	child.on("error", failed);
	async function wait(milliseconds: number, trigger = () => {}) {
		if (outcome) return outcome;
		return boundedEvent(child, "close", milliseconds, trigger, schedule);
	}
	return {
		wait,
		async cleanup() {
			try {
				if (!outcome) {
					try {
						await wait(1000, () => {
							child.kill("SIGTERM");
						});
					} catch {
						await wait(1000, () => {
							child.kill("SIGKILL");
						});
					}
				}
				return outcome;
			} finally {
				child.removeListener("close", closed);
				child.removeListener("error", failed);
			}
		},
	};
}

test("CLI and MCP list owner history and read the same UUID inspection and result", async () => {
	const directory = await mkdtemp(join(tmpdir(), "management-history-"));
	const owned = new Set<ReturnType<typeof ownChild>>();
	const jobId = randomUUID();
	const history = {
		jobs: [{ id: jobId, state: "HOLD" }],
		history: [{ jobId, reviewStatus: "HOLD" }],
		lease: null,
	};
	const inspection = {
		job: { id: jobId, state: "HOLD" },
		originalRequest: { requestId: jobId },
	};
	const result = {
		schema: "portal-generated-result.v1",
		jobId,
		reviewStatus: "HOLD",
	};
	const requests: { method: string; path: string; cookie: string }[] = [];
	let denied = false;
	const server = createServer((req, res) => {
		res.setHeader("content-type", "application/json");
		if (req.url === "/tools/api/auth/session") {
			res.setHeader(
				"set-cookie",
				"portal_session=history-fixture; Path=/tools/",
			);
			res.end(
				JSON.stringify({ authenticated: true, csrfToken: "history-fixture" }),
			);
		} else if (req.url === "/tools/api/connections") {
			res.end(JSON.stringify({ connection: null }));
		} else {
			requests.push({
				method: req.method ?? "",
				path: req.url ?? "",
				cookie: req.headers.cookie ?? "",
			});
			if (denied || req.headers.cookie !== "portal_session=history-fixture") {
				res
					.writeHead(403)
					.end(JSON.stringify({ error: { code: "OWNER_ACCESS_DENIED" } }));
			} else {
				const value =
					req.url === "/tools/api/jobs"
						? history
						: req.url === `/tools/api/jobs/${jobId}/inspection`
							? inspection
							: req.url === `/tools/api/jobs/${jobId}/result`
								? result
								: null;
				if (value) res.end(JSON.stringify(value));
				else
					res
						.writeHead(404)
						.end(JSON.stringify({ error: { code: "NOT_FOUND" } }));
			}
		}
	});
	try {
		await boundedEvent(server, "listening", 5000, () =>
			server.listen(0, "127.0.0.1"),
		);
		const address = server.address();
		if (!address || typeof address === "string") throw Error("ADDRESS");
		await writeFile(
			join(directory, "preload.mjs"),
			`const original=globalThis.fetch;globalThis.fetch=(input,init)=>{const u=new URL(String(input));if(u.origin!=="https://sss.linalab.io")throw Error("UNEXPECTED_EGRESS");return original("http://127.0.0.1:${address.port}"+u.pathname+u.search,init)};`,
		);
		await writeFile(
			join(directory, "cloudflared"),
			"#!/bin/sh\nprintf 'fixture-owner-token\\n'\n",
			{ mode: 0o700 },
		);
		const artifacts: { cli?: string; mcp?: string } = {};
		for (const [name, source] of [
			["cli", "cli.ts"],
			["mcp", "mcp-server.ts"],
		] as const) {
			const built = await Bun.build({
				entrypoints: [new URL(`../src/${source}`, import.meta.url).pathname],
				target: "node",
			});
			expect(built.success).toBe(true);
			const output = built.outputs[0];
			if (!output) throw Error("BUILD_OUTPUT");
			artifacts[name] = join(directory, `${name}.mjs`);
			await writeFile(artifacts[name], await output.text());
		}
		const pathKey = "PATH",
			nodeKey = "NODE_BINARY";
		const env = {
			PATH: `${directory}:${process.env[pathKey] ?? ""}`,
			SSSTOOL_SERVER_URL: "https://sss.linalab.io/tools/",
			SSSTOOL_STATE_DIRECTORY: join(directory, "state"),
		};
		const node = process.env[nodeKey] ?? "node";
		const args = ["--import", join(directory, "preload.mjs")];
		async function cli(operation: string, input: Record<string, unknown>) {
			const options: string[] = [];
			for (const [key, value] of Object.entries(input)) {
				if (key === "jobId") options.push(String(value));
				else
					options.push(
						`--${key === "envFile" ? "env-file" : key}`,
						String(value),
					);
			}
			const child = spawn(
				node,
				[
					...args,
					artifacts.cli ?? "",
					...operation.split("."),
					...options,
					"--format",
					"json",
				],
				{ cwd: directory, env, stdio: ["ignore", "pipe", "pipe"] },
			);
			const owner = ownChild(child);
			owned.add(owner);
			let stdout = "",
				stderr = "";
			child.stdout.on("data", (chunk) => {
				stdout += String(chunk);
			});
			child.stderr.on("data", (chunk) => {
				stderr += String(chunk);
			});
			try {
				const [code, signal] = await owner.wait(10000);
				expect(signal).toBeNull();
				expect(code).toBe(child.exitCode);
				expect(stderr).toBe("");
				return { code, report: JSON.parse(stdout) };
			} finally {
				await owner.cleanup();
				owned.delete(owner);
			}
		}
		const child = spawn(node, [...args, artifacts.mcp ?? ""], {
			cwd: directory,
			env,
			stdio: ["pipe", "pipe", "pipe"],
		});
		const owner = ownChild(child);
		owned.add(owner);
		const events = new EventEmitter();
		const lines = createInterface({ input: child.stdout });
		let serial = 0,
			stderr = "";
		lines.on("line", (line) => {
			const value = JSON.parse(line);
			events.emit(String(value.id), value);
		});
		child.stderr.on("data", (chunk) => {
			stderr += String(chunk);
		});
		async function rpc(
			method: string,
			params: unknown,
		): Promise<{
			result: {
				tools: { name: string; inputSchema: unknown }[];
				isError: boolean;
				structuredContent: { ok: boolean };
			};
		}> {
			const id = ++serial;
			try {
				return (
					await boundedEvent(events, String(id), 10000, () => {
						child.stdin.write(
							`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`,
						);
					})
				)[0] as Awaited<ReturnType<typeof rpc>>;
			} catch (error) {
				await owner.cleanup();
				throw error;
			}
		}
		let completed = false;
		try {
			await rpc("initialize", {
				protocolVersion: "2025-11-25",
				capabilities: {},
				clientInfo: { name: "history-test", version: "1" },
			});
			child.stdin.write(
				'{"jsonrpc":"2.0","method":"notifications/initialized"}\n',
			);
			const tools = (await rpc("tools/list", {})).result.tools;
			const operation = operations.find((item) => item.name === "jobs.list");
			expect(operation?.effectClass).toBe("NETWORK_READ");
			expect(operation?.annotations.readOnlyHint).toBe(true);
			expect(
				tools.find((item: { name: string }) => item.name === "jobs.list")
					?.inputSchema,
			).toEqual(operation?.inputSchema);
			for (const transport of ["cli", "mcp"]) {
				async function call(name: string, input: Record<string, unknown>) {
					if (transport === "cli") return cli(name, input);
					const answer = (await rpc("tools/call", { name, arguments: input }))
						.result;
					expect(answer.isError).toBe(!answer.structuredContent.ok);
					return {
						code: answer.isError ? 1 : 0,
						report: answer.structuredContent,
					};
				}
				const listed = await call("jobs.list", {});
				expect(listed.code).toBe(0);
				expect(listed.report.result).toEqual(history);
				const retainedId = listed.report.result.jobs[0].id;
				expect(retainedId).toBe(jobId);
				expect(
					(await call("generations.get", { jobId: retainedId })).report.result,
				).toEqual(inspection);
				expect(
					(await call("jobs.result", { jobId: retainedId })).report.result,
				).toEqual(result);
				const envFile = join(directory, "owner.env");
				await writeFile(envFile, "# local history fixture\n");
				expect((await call("jobs.list", { envFile })).report.result).toEqual(
					history,
				);
				for (const name of ["generations.get", "jobs.result"]) {
					const before = requests.length;
					expect((await call(name, {})).report.failures[0].code).toBe(
						transport === "cli" ? "INVALID_OPTIONS" : "INVALID_PARAMS",
					);
					expect(requests).toHaveLength(before);
				}
				for (const input of [
					{ limit: 1 },
					{ cursor: 0 },
					{ ownerId: "other" },
					{ jobId },
				]) {
					const before = requests.length;
					expect((await call("jobs.list", input)).report.failures[0].code).toBe(
						transport === "cli"
							? "ownerId" in input
								? "PORTAL_MANAGEMENT_FAILED"
								: "INVALID_OPTIONS"
							: "INVALID_PARAMS",
					);
					expect(requests).toHaveLength(before);
				}
				const before = requests.length;
				expect(
					(await call("generations.get", { jobId: "bad" })).report.failures[0]
						.code,
				).toBe("INVALID_PARAMS");
				expect(requests).toHaveLength(before);
				denied = true;
				for (const name of ["jobs.list", "generations.get", "jobs.result"]) {
					const rejected = await call(
						name,
						name === "jobs.list" ? {} : { jobId },
					);
					expect(rejected.code).toBe(1);
					expect(rejected.report.failures[0]).toEqual({
						code: "OWNER_ACCESS_DENIED",
						status: 403,
					});
				}
				denied = false;
			}
			expect(remoteInputs["jobs.list"].parse({ envFile: "owner.env" })).toEqual(
				{ envFile: "owner.env" },
			);
			expect(
				requests.every(
					(req) =>
						req.method === "GET" &&
						req.cookie === "portal_session=history-fixture",
				),
			).toBe(true);
			expect(
				requests.filter((req) => req.path === "/tools/api/jobs"),
			).toHaveLength(6);
			expect(requests.some((req) => req.path.includes("?"))).toBe(false);
			completed = true;
		} finally {
			try {
				if (completed) {
					const [code, signal] = await owner.wait(20000, () =>
						child.stdin.end(),
					);
					expect(code).toBe(0);
					expect(signal).toBeNull();
					expect(stderr).toBe("");
				}
			} finally {
				lines.close();
				await owner.cleanup();
				owned.delete(owner);
			}
		}
	} finally {
		try {
			const cleanup = await Promise.allSettled(
				[...owned].map((owner) => owner.cleanup()),
			);
			server.closeAllConnections();
			await new Promise<void>((resolve) => server.close(() => resolve()));
			expect(cleanup.filter((result) => result.status === "rejected")).toEqual(
				[],
			);
		} finally {
			await rm(directory, { recursive: true, force: true });
		}
	}
});

test("history deadlines cancel subscriptions and reap owned children on failures", async () => {
	const pending = new Set<() => void>();
	const schedule: Deadline = (expire) => {
		pending.add(expire);
		return () => {
			pending.delete(expire);
		};
	};
	const source = new EventEmitter();
	expect(
		await boundedEvent(
			source,
			"reply",
			1,
			() => source.emit("reply", "ok"),
			schedule,
		),
	).toEqual(["ok"]);
	expect(pending.size).toBe(0);
	const timed = boundedEvent(source, "reply", 1, () => {}, schedule);
	const rejected = timed.catch((error: Error) => error.message);
	for (const expire of [...pending]) expire();
	expect(await rejected).toBe("TEST_DEADLINE");
	expect(source.listenerCount("reply")).toBe(0);
	expect(source.listenerCount("error")).toBe(0);
	expect(pending.size).toBe(0);
	for (const force of [false, true]) {
		const child = new EventEmitter() as OwnedChild;
		const signals: NodeJS.Signals[] = [];
		child.kill = (signal) => {
			signals.push(signal);
			if (force && signal === "SIGTERM") {
				for (const expire of [...pending]) expire();
			} else child.emit("close", null, signal);
			return true;
		};
		const owner = ownChild(child, schedule);
		const failed = owner.wait(1);
		const observed = failed.catch((error: Error) => error.message);
		for (const expire of [...pending]) expire();
		expect(await observed).toBe("TEST_DEADLINE");
		expect(await owner.cleanup()).toEqual([
			null,
			force ? "SIGKILL" : "SIGTERM",
		]);
		expect(signals).toEqual(force ? ["SIGTERM", "SIGKILL"] : ["SIGTERM"]);
		expect(child.eventNames()).toEqual([]);
		expect(pending.size).toBe(0);
	}
	const nodeKey = "NODE_BINARY";
	const child = spawn(
		process.env[nodeKey] ?? "node",
		["-e", 'process.stdin.resume(); process.stdout.write("ready");'],
		{ stdio: ["pipe", "pipe", "pipe"] },
	);
	const owner = ownChild(child);
	try {
		await boundedEvent(child.stdout, "data", 5000, () => {});
		const response = boundedEvent(
			new EventEmitter(),
			"response",
			1,
			() => child.stdin.write("request\n"),
			schedule,
		);
		const rejected = response.catch((error: Error) => error.message);
		for (const expire of [...pending]) expire();
		expect(await rejected).toBe("TEST_DEADLINE");
		expect(await owner.cleanup()).toEqual([null, "SIGTERM"]);
		expect(child.signalCode).toBe("SIGTERM");
		expect(child.exitCode).toBeNull();
		expect(pending.size).toBe(0);
	} finally {
		await owner.cleanup();
	}
});
