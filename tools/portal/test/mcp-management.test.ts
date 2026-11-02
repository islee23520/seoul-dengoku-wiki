import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { EventEmitter, once } from "node:events";
import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const nodeBinaryKey = "NODE_BINARY",
	pathKey = "PATH";
const node = process.env[nodeBinaryKey] ?? "node";
const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const responseSchema = z.object({
	jsonrpc: z.literal("2.0"),
	id: z.union([z.number(), z.string(), z.null()]),
	result: z.unknown().optional(),
	error: z.object({ code: z.number(), message: z.string() }).optional(),
});
export const toolResultSchema = z.object({
	structuredContent: z.object({
		ok: z.boolean(),
		operation: z.string().nullable(),
		result: z.unknown().optional(),
		failures: z.array(z.object({ code: z.string() })).optional(),
	}),
	content: z.array(z.object({ type: z.literal("text"), text: z.string() })),
	isError: z.boolean(),
});
export function client(
	cwd: string,
	env: Readonly<Record<string, string>> = {},
) {
	const child = spawn(node, [join(cwd, "release/mcp.mjs")], {
		cwd,
		env: { PATH: process.env[pathKey], ...env },
		stdio: ["pipe", "pipe", "pipe"],
	});
	const exited = once(child, "exit", { signal: AbortSignal.timeout(15000) });
	const events = new EventEmitter();
	let stderr = "",
		serial = 0;
	const lines = createInterface({ input: child.stdout });
	lines.on("line", (line) => {
		const response = responseSchema.parse(JSON.parse(line));
		events.emit(String(response.id), response);
	});
	child.stderr.on("data", (chunk) => {
		stderr += String(chunk);
	});
	child.once("error", (error) => events.emit("error", error));
	async function request(method: string, params: unknown = {}) {
		const id = ++serial;
		const answer = once(events, String(id), {
			signal: AbortSignal.timeout(10000),
		});
		child.stdin.write(
			`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`,
		);
		const [value] = await answer;
		return responseSchema.parse(value);
	}
	return {
		child,
		request,
		stderr: () => stderr,
		initialize: async (protocolVersion = "2025-11-25") => {
			const response = await request("initialize", {
				protocolVersion,
				capabilities: {},
				clientInfo: { name: "portal-test", version: "1" },
			});
			child.stdin.write(
				'{"jsonrpc":"2.0","method":"notifications/initialized"}\n',
			);
			return response;
		},
		close: async () => {
			child.stdin.end();
			const [code] = await exited;
			return code;
		},
	};
}
export async function fixture() {
	const cwd = await mkdtemp(join(tmpdir(), "portal-mcp-"));
	await cp(dist, join(cwd, "release"), { recursive: true });
	return cwd;
}
async function cli(cwd: string, args: readonly string[]) {
	const child = spawn(node, [join(cwd, "release/cli.mjs"), ...args], {
		cwd,
		env: { PATH: process.env[pathKey] },
		stdio: ["ignore", "pipe", "pipe"],
	});
	const exited = once(child, "exit", { signal: AbortSignal.timeout(10000) });
	let output = "";
	child.stdout.on("data", (chunk) => {
		output += String(chunk);
	});
	const [code] = await exited;
	return { code, report: JSON.parse(output) };
}

test("stdio catalogs and JSON resources match CLI when initialized from a portable release", async () => {
	// Given
	const cwd = await fixture();
	const mcp = client(cwd);
	try {
		const initialized = await mcp.initialize("unknown-version");
		// When
		const tools = await mcp.request("tools/list");
		const self = await mcp.request("resources/read", { uri: "portal://self" });
		const ops = toolResultSchema.parse(
			(await mcp.request("tools/call", { name: "ops" })).result,
		);
		// Then
		expect(initialized.result).toMatchObject({ protocolVersion: "2025-11-25" });
		const catalog = z
			.object({
				tools: z.array(
					z.object({
						name: z.string(),
						annotations: z.record(z.string(), z.boolean()),
					}),
				),
			})
			.parse(tools.result);
		expect(catalog.tools.map((item) => item.name)).toEqual([
			"references.validate",
			"discover",
			"ops",
			"config",
			"status",
			"stop",
			"login",
			"logout",
			"people.list",
			"people.get",
			"people.register",
			"sheets.upload",
			"generations.create",
			"generations.get",
			"batches.create",
			"batches.get",
			"batches.cancel-pending",
			"jobs.result",
			"jobs.download",
			"evaluations.list",
			"evaluations.append",
			"references.list",
			"references.create",
			"references.get",
			"references.download",
			"workstations.catalog",
			"workstations.list",
			"workstations.create",
			"workstations.get",
			"workstations.history",
			"workstations.result",
			"workstations.download",
			"local-ai.catalog",
			"local-ai.create",
			"local-ai.get",
			"local-ai.download",
		]);
		expect(
			catalog.tools.find((item) => item.name === "stop")?.annotations,
		).toMatchObject({
			readOnlyHint: false,
			destructiveHint: true,
			idempotentHint: true,
		});
		expect(
			catalog.tools.find((item) => item.name === "references.download")
				?.annotations,
		).toMatchObject({
			readOnlyHint: false,
			destructiveHint: false,
			idempotentHint: false,
		});
		const resource = z
			.object({
				contents: z.array(z.object({ text: z.string(), mimeType: z.string() })),
			})
			.parse(self.result).contents[0];
		expect(resource?.mimeType).toBe("application/json");
		expect(JSON.parse(resource?.text ?? "{}")).toMatchObject({
			schema: "portal-management.v1",
		});
		expect(ops.structuredContent).toEqual((await cli(cwd, ["ops"])).report);
		expect(JSON.parse(ops.content[0]?.text ?? "{}")).toEqual(
			ops.structuredContent,
		);
		expect(mcp.stderr()).toBe("");
	} finally {
		expect(await mcp.close()).toBe(0);
		await rm(cwd, { recursive: true, force: true });
	}
});

test("MCP config and real status match CLI envelopes when environment secrets stay hidden", async () => {
	// Given
	const cwd = await fixture();
	const canary = "private-canary";
	const health = {
		mode: "local",
		ready: true,
		missingConfig: [],
		model: "gpt-image-2.5-sunburst",
		charactersReady: false,
		generationReady: false,
	};
	const server = createServer((req, res) => {
		if (req.url === "/tools/api/status") res.end(JSON.stringify(health));
		else res.writeHead(404).end();
	});
	const listening = once(server, "listening");
	server.listen(0, "127.0.0.1");
	await listening;
	const address = server.address();
	if (!address || typeof address === "string")
		throw new Error("fixture address");
	await writeFile(
		join(cwd, "portal.env"),
		`PORTAL_PORT=${address.port}\nPORTAL_SESSION_SECRET=${canary}\nPORTAL_ACCESS_JWT_ASSERTION=${canary}\n`,
	);
	const mcp = client(cwd);
	try {
		await mcp.initialize();
		// When
		const results = [];
		for (const name of ["config", "status"]) {
			const response = await mcp.request("tools/call", {
				name,
				arguments: { envFile: "portal.env" },
			});
			results.push({
				mcp: toolResultSchema.parse(response.result),
				cli: await cli(cwd, [name, "--env-file", "portal.env"]),
			});
		}
		// Then
		for (const result of results) {
			expect(result.mcp.structuredContent).toEqual(result.cli.report);
			expect(result.cli.code).toBe(0);
			expect(JSON.stringify(result.mcp) + mcp.stderr()).not.toContain(canary);
		}
		expect(results[1]?.mcp.structuredContent.result).toEqual(health);
	} finally {
		await mcp.close();
		const closed = once(server, "close");
		server.close();
		await closed;
		await rm(cwd, { recursive: true, force: true });
	}
});

test("stdio rejects malformed requests and bad tool arguments without echoing secret inputs", async () => {
	// Given
	const cwd = await fixture();
	const mcp = client(cwd);
	const canary = "private-canary";
	try {
		// When
		const early = await mcp.request("tools/list");
		await mcp.initialize();
		const unknown = await mcp.request("private-canary");
		const invalid = await mcp.request("tools/call", {
			name: "config",
			arguments: { secret: canary },
		});
		const badParams = await mcp.request("tools/call", {
			name: 3,
			arguments: canary,
		});
		const denied = await mcp.request("tools/call", { name: "start" });
		// Then
		expect(early.error?.code).toBe(-32000);
		expect(unknown.error?.code).toBe(-32601);
		expect(badParams.error?.code).toBe(-32602);
		expect(toolResultSchema.parse(invalid.result)).toMatchObject({
			isError: true,
			structuredContent: { ok: false, failures: [{ code: "INVALID_PARAMS" }] },
		});
		expect(
			toolResultSchema.parse(denied.result).structuredContent.failures,
		).toEqual([{ code: "OPERATION_NOT_EXPOSED" }]);
		const output = JSON.stringify([early, unknown, invalid, badParams, denied]);
		expect(output + mcp.stderr()).not.toContain(canary);
	} finally {
		await mcp.close();
		await rm(cwd, { recursive: true, force: true });
	}
});
