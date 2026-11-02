#!/usr/bin/env node
import { randomBytes, timingSafeEqual } from "node:crypto";
import { once } from "node:events";
import { mkdir, open, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import {
	type Envelope,
	failure,
	inputSchema,
	invokeManagement,
	ManagementError,
	managementCommandSchema,
	managementContext,
	redactError,
	remoteCommandSchema,
} from "./management.ts";

async function start(
	input: Parameters<typeof managementContext>[0],
): Promise<Envelope> {
	const { config, controlPath } = await managementContext(input);
	if (!config.ready) throw new ManagementError("CONFIG_NOT_READY");
	if (!controlPath) throw new ManagementError("STORAGE_NOT_CONFIGURED");
	const ownedPath = controlPath;
	await mkdir(dirname(ownedPath), { recursive: true, mode: 0o700 });
	const controlFile = await open(ownedPath, "wx", 0o600);
	const token = randomBytes(32).toString("hex");
	let shutdown: Promise<void> | undefined;
	const { createPortal } = await import("./server.ts");
	const app = await createPortal(config).catch(async (error: unknown) => {
		await controlFile.close();
		await rm(ownedPath);
		throw error;
	});
	const controlServer = createServer((req, res) => {
		const actual = Buffer.from(req.headers.authorization ?? "");
		const expected = Buffer.from(`Bearer ${token}`);
		if (
			req.method !== "POST" ||
			req.url !== "/stop" ||
			actual.length !== expected.length ||
			!timingSafeEqual(actual, expected)
		) {
			res.writeHead(403).end();
			return;
		}
		void close().then(
			() => res.end('{"stopped":true}'),
			() => res.writeHead(500).end(),
		);
	});
	function close() {
		shutdown ??= (async () => {
			await app.close();
			await controlFile.close();
			await rm(ownedPath);
			controlServer.close();
		})();
		return shutdown;
	}
	const onSignal = () => {
		void close().catch((error: unknown) => {
			console.error(JSON.stringify(redactError("start", error)));
			process.exitCode = 1;
		});
	};
	try {
		const address = await app.listen();
		const ready = once(controlServer, "listening", {
			signal: AbortSignal.timeout(5000),
		});
		controlServer.listen(0, "127.0.0.1");
		await ready;
		const controlAddress = controlServer.address();
		if (!controlAddress || typeof controlAddress === "string")
			throw new ManagementError("CONTROL_LISTEN_FAILED");
		await controlFile.writeFile(
			JSON.stringify({
				schema: "portal-cli-control.v1",
				port: controlAddress.port,
				servicePort: address.port,
				token,
			}),
		);
		process.once("SIGINT", onSignal);
		process.once("SIGTERM", onSignal);
		app.server.once("mdns-error", onSignal);
		console.error(`PORTAL_READY port=${address.port} mode=${config.mode}`);
		await once(controlServer, "close");
		return { ok: true, operation: "start", result: { stopped: true } };
	} finally {
		process.removeListener("SIGINT", onSignal);
		process.removeListener("SIGTERM", onSignal);
		await close();
	}
}

export async function runCli(args: readonly string[]): Promise<Envelope> {
	let operation: Envelope["operation"] = null;
	try {
		const parsed = parseArgs({
			args: [...args],
			allowPositionals: true,
			options: {
				"env-file": { type: "string" },
				format: { type: "string" },
				input: { type: "string" },
				output: { type: "string" },
				shot: { type: "string" },
				person: { type: "string" },
				frame: { type: "string" },
				artifact: { type: "string" },
				"artifact-root": { type: "string" },
				"artifact-directory": { type: "string" },
				q: { type: "string" },
				limit: { type: "string" },
				cursor: { type: "string" },
				help: { type: "boolean", short: "h" },
			},
		});
		if (parsed.values.format !== undefined && parsed.values.format !== "json")
			return failure(null, "INVALID_OPTIONS");
		const name = parsed.values.help
			? "help"
			: parsed.positionals.length >= 2
				? `${parsed.positionals[0]}.${parsed.positionals[1]}`
				: (parsed.positionals[0] ?? "help");
		const command = managementCommandSchema.safeParse(name);
		if (!command.success) return failure(null, "INVALID_COMMAND");
		operation = command.data;
		if (operation === "references.validate") {
			if (
				parsed.positionals.length !== 2 ||
				Object.keys(parsed.values).some(
					(key) =>
						!["artifact-root", "artifact-directory", "format"].includes(key),
				)
			)
				return failure(operation, "INVALID_OPTIONS");
			return await invokeManagement(operation, {
				artifactRoot: parsed.values["artifact-root"],
				artifactDirectory: parsed.values["artifact-directory"],
			});
		}
		if (
			parsed.values["artifact-root"] !== undefined ||
			parsed.values["artifact-directory"] !== undefined
		)
			return failure(operation, "INVALID_OPTIONS");
		const remote = remoteCommandSchema.safeParse(operation);
		if (remote.success) {
			const mutation = [
				"people.register",
				"sheets.upload",
				"generations.create",
				"training-generations.create",
				"references.create",
				"workstations.create",
				"batches.create",
				"batches.cancel-pending",
				"evaluations.append",
				"local-ai.create",
			].includes(operation);
			if (
				parsed.positionals.length !==
					(mutation ||
					operation === "people.list" ||
					operation === "jobs.list" ||
					operation === "workstations.catalog" ||
					operation === "local-ai.catalog" ||
					operation === "workstations.list" ||
					operation === "references.list"
						? 2
						: 3) ||
				Boolean(parsed.values.input) !== mutation ||
				Boolean(parsed.values.output) !==
					(operation === "jobs.download" ||
						operation === "local-ai.download" ||
						operation === "workstations.download" ||
						operation === "references.download") ||
				Boolean(parsed.values.shot) !== (operation === "references.download") ||
				Boolean(parsed.values.artifact) !==
					(operation === "local-ai.download") ||
				Boolean(parsed.values.person) !==
					[
						"workstations.get",
						"workstations.result",
						"workstations.download",
					].includes(operation) ||
				Boolean(parsed.values.frame) !==
					["workstations.result", "workstations.download"].includes(
						operation,
					) ||
				(operation !== "people.list" &&
					[parsed.values.q, parsed.values.limit, parsed.values.cursor].some(
						(value) => value !== undefined,
					))
			)
				return failure(operation, "INVALID_OPTIONS");
			let fields: unknown = parsed.values.input
				? JSON.parse(await readFile(parsed.values.input, "utf8"))
				: {};
			if (!fields || typeof fields !== "object" || Array.isArray(fields))
				return failure(operation, "INVALID_PARAMS");
			fields = {
				...fields,
				...(parsed.values.q === undefined ? {} : { q: parsed.values.q }),
				...(parsed.values.limit === undefined
					? {}
					: { limit: Number(parsed.values.limit) }),
				...(parsed.values.cursor === undefined
					? {}
					: { cursor: Number(parsed.values.cursor) }),
				...(parsed.values["env-file"]
					? { envFile: parsed.values["env-file"] }
					: {}),
				...(parsed.values.output ? { output: parsed.values.output } : {}),
				...(parsed.values.shot ? { shot: parsed.values.shot } : {}),
				...(parsed.values.artifact
					? { artifactId: parsed.values.artifact }
					: {}),
				...(parsed.values.person ? { personId: parsed.values.person } : {}),
				...(parsed.values.frame
					? { frameOrder: Number(parsed.values.frame) }
					: {}),
				...(parsed.positionals[2]
					? {
							[operation === "people.get" ||
							operation === "workstations.history"
								? "personId"
								: operation.startsWith("workstations.") ||
										operation === "references.get" ||
										operation === "training-generations.get" ||
										operation === "references.download"
									? "requestId"
									: operation === "batches.get"
										? "batchId"
										: "jobId"]: parsed.positionals[2],
						}
					: {}),
			};
			return await invokeManagement(operation, fields);
		}
		if (
			parsed.positionals.length > 1 ||
			parsed.values.input ||
			parsed.values.output ||
			parsed.values.shot !== undefined ||
			parsed.values.person !== undefined ||
			parsed.values.frame !== undefined ||
			parsed.values.artifact !== undefined ||
			parsed.values.q !== undefined ||
			parsed.values.limit !== undefined ||
			parsed.values.cursor !== undefined
		)
			return failure(operation, "INVALID_OPTIONS");
		const input = inputSchema.safeParse(
			parsed.values["env-file"] === undefined
				? {}
				: { envFile: parsed.values["env-file"] },
		);
		if (!input.success) return failure(operation, "INVALID_PARAMS");
		switch (operation) {
			case "start":
				return await start(input.data);
			case "help":
			case "discover":
			case "ops":
				return await invokeManagement(operation);
			case "config":
			case "status":
			case "stop":
			case "login":
			case "logout":
				return await invokeManagement(operation, input.data);
			default: {
				return failure(operation, "INVALID_COMMAND");
			}
		}
	} catch (error) {
		if (error instanceof SyntaxError)
			return failure(operation, "INVALID_PARAMS");
		return redactError(operation, error);
	}
}
if (import.meta.main) {
	const report = await runCli(process.argv.slice(2));
	console.log(JSON.stringify(report));
	if (!report.ok) process.exitCode = 1;
}
