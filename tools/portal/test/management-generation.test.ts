import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { EventEmitter, once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { remoteInputs } from "../src/management.ts";
import { referenceGenerationRequestSchema } from "../src/reference-contract.ts";

test("CLI and MCP preserve v2 and legacy generation payloads over local HTTP without mutation retries", async () => {
	const directory = await mkdtemp(join(tmpdir(), "management-generation-"));
	const received: Record<string, unknown>[] = [];
	let outcome: "success" | "error" | "interrupt" = "success";
	const server = createServer(async (req, res) => {
		res.setHeader("content-type", "application/json");
		if (req.url === "/tools/api/auth/session") {
			res.setHeader("set-cookie", "portal_session=fixture; Path=/tools/");
			res.end(JSON.stringify({ authenticated: true, csrfToken: "fixture" }));
		} else if (req.url === "/tools/api/connections") {
			res.end(JSON.stringify({ connection: null }));
		} else if (req.url === "/tools/api/generations") {
			let body = "";
			for await (const chunk of req) body += String(chunk);
			const payload = JSON.parse(body) as { requestId: string };
			received.push(payload);
			if (outcome === "interrupt") {
				res.writeHead(200, { "content-length": "100" });
				res.write('{"partial":');
				res.socket?.destroy();
			} else if (outcome === "error") {
				res
					.writeHead(409)
					.end(JSON.stringify({ error: { code: "REFERENCE_HASH_MISMATCH" } }));
			} else {
				res.end(
					JSON.stringify({ job: { id: payload.requestId, state: "HOLD" } }),
				);
			}
		} else
			res.writeHead(404).end(JSON.stringify({ error: { code: "NOT_FOUND" } }));
	});
	const listening = once(server, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	server.listen(0, "127.0.0.1");
	await listening;
	const address = server.address();
	if (!address || typeof address === "string") throw new Error("ADDRESS");
	try {
		// Only the test subprocess fetch boundary is redirected. Production owner
		// origin, authentication, journal and CLI/MCP handlers remain unchanged.
		await writeFile(
			join(directory, "preload.mjs"),
			`const original=globalThis.fetch;globalThis.fetch=(input,init)=>{const url=new URL(String(input));if(url.origin!=="https://sss.linalab.io")throw Error("UNEXPECTED_EGRESS");return original("http://127.0.0.1:${address.port}"+url.pathname+url.search,init)};`,
		);
		await writeFile(
			join(directory, "cloudflared"),
			"#!/bin/sh\nprintf 'fixture-owner-token\\n'\n",
			{ mode: 0o700 },
		);
		const artifacts: Record<string, string> = {};
		for (const [name, source] of [
			["cli", "cli.ts"],
			["mcp", "mcp-server.ts"],
		]) {
			const result = await Bun.build({
				entrypoints: [new URL(`../src/${source}`, import.meta.url).pathname],
				target: "node",
			});
			expect(result.success).toBe(true);
			const output = result.outputs[0];
			if (!output) throw new Error("BUILD_OUTPUT");
			artifacts[name ?? ""] = join(directory, `${name}.mjs`);
			await writeFile(artifacts[name ?? ""] ?? "", await output.text());
		}
		const pathKey = "PATH",
			nodeKey = "NODE_BINARY",
			cliKey = "cli",
			mcpKey = "mcp";
		const env = {
			PATH: `${directory}:${process.env[pathKey] ?? ""}`,
			SSSTOOL_SERVER_URL: "https://sss.linalab.io/tools/",
			SSSTOOL_STATE_DIRECTORY: join(directory, "state"),
		};
		const node = process.env[nodeKey] ?? "node";
		const args = ["--import", join(directory, "preload.mjs")];
		async function cli(payload: Record<string, unknown>) {
			await writeFile(join(directory, "request.json"), JSON.stringify(payload));
			const child = spawn(
				node,
				[
					...args,
					artifacts[cliKey] ?? "",
					"generations",
					"create",
					"--input",
					join(directory, "request.json"),
					"--format",
					"json",
				],
				{ cwd: directory, env, stdio: ["ignore", "pipe", "pipe"] },
			);
			const exited = once(child, "exit", {
				signal: AbortSignal.timeout(10000),
			});
			let stdout = "",
				stderr = "";
			child.stdout.on("data", (chunk) => {
				stdout += String(chunk);
			});
			child.stderr.on("data", (chunk) => {
				stderr += String(chunk);
			});
			const [code] = await exited;
			expect(stderr).toBe("");
			return { code, report: JSON.parse(stdout) };
		}
		const child = spawn(node, [...args, artifacts[mcpKey] ?? ""], {
			cwd: directory,
			env,
			stdio: ["pipe", "pipe", "pipe"],
		});
		const exited = once(child, "exit", { signal: AbortSignal.timeout(15000) });
		const events = new EventEmitter();
		let serial = 0,
			stderr = "";
		const lines = createInterface({ input: child.stdout });
		lines.on("line", (line) => {
			const value = JSON.parse(line);
			events.emit(String(value.id), value);
		});
		child.stderr.on("data", (chunk) => {
			stderr += String(chunk);
		});
		async function rpc(method: string, params: unknown) {
			const id = ++serial;
			const response = once(events, String(id), {
				signal: AbortSignal.timeout(10000),
			});
			child.stdin.write(
				`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`,
			);
			return (await response)[0];
		}
		try {
			await rpc("initialize", {
				protocolVersion: "2025-11-25",
				capabilities: {},
				clientInfo: { name: "management-test", version: "1" },
			});
			child.stdin.write(
				'{"jsonrpc":"2.0","method":"notifications/initialized"}\n',
			);
			const tools = (await rpc("tools/list", {})).result.tools;
			expect(
				tools.find(
					(tool: { name: string }) => tool.name === "generations.create",
				).inputSchema.anyOf,
			).toHaveLength(2);
			const reference = referenceGenerationRequestSchema.parse({
				schemaVersion: 2,
				generationProfile: "native340-v1",
				requestId: randomUUID(),
				personId: "person-0998",
				inputMode: "reference-img2img",
				sourceSelection: {
					kind: "selected",
					personId: "person-0998",
					sourceSHA256: "a".repeat(64),
				},
				explicitEdits: [
					{
						field: "outfit.upper.color",
						operation: "replace",
						value: "dark blue",
					},
				],
				provider: "comfyui",
				providerModel: "comfyui:moss-image-sft-source-img2img.alpha.v1",
				sourceRecipe: "source-025",
				size: "340x510",
				faceMode: { kind: "unique", variantId: null },
			});
			const token = {
				...reference,
				inputMode: "token-only",
				sourceSelection: {
					kind: "intentional-absence",
					reason: "no-reference-available",
				},
				explicitEdits: [],
				providerModel: "comfyui:moss-image-sft-style-male.alpha.v1",
			};
			const { sourceRecipe: _recipe, ...tokenOnly } = token;
			const legacy = {
				requestId: randomUUID(),
				personId: "person-0998",
				providerModel: "gpt-image-2.5-sunburst",
				size: "340x510",
				faceMode: { kind: "unique", variantId: null },
			};
			for (const transport of ["cli", "mcp"]) {
				async function call(payload: Record<string, unknown>) {
					if (transport === "cli") return cli(payload);
					const result = (
						await rpc("tools/call", {
							name: "generations.create",
							arguments: payload,
						})
					).result;
					expect(result.isError).toBe(!result.structuredContent.ok);
					return {
						code: result.isError ? 1 : 0,
						report: result.structuredContent,
					};
				}
				for (const template of [reference, tokenOnly, legacy]) {
					const payload = { ...template, requestId: randomUUID() };
					const result = await call(payload);
					expect(result.code).toBe(0);
					expect(received.at(-1)).toEqual(payload);
					const count = received.length;
					expect((await call(payload)).report.failures[0].code).toBe(
						"MUTATION_ALREADY_DISPATCHED",
					);
					expect(received).toHaveLength(count);
				}
				for (const payload of [
					{ ...reference, inputMode: "token-only" },
					{ ...reference, sourceRecipe: "source-999" },
					{
						...reference,
						sourceSelection: {
							...reference.sourceSelection,
							sourceSHA256: "wrong",
						},
					},
				]) {
					const count = received.length;
					expect(
						(await call({ ...payload, requestId: randomUUID() })).report
							.failures[0].code,
					).toBe("INVALID_PARAMS");
					expect(received).toHaveLength(count);
				}
				outcome = "error";
				const denied = { ...reference, requestId: randomUUID() };
				const count = received.length;
				const failed = await call(denied);
				expect(failed.report.failures[0]).toEqual({
					code: "REFERENCE_HASH_MISMATCH",
					status: 409,
					requestId: denied.requestId,
				});
				expect((await call(denied)).report.failures[0].code).toBe(
					"MUTATION_ALREADY_DISPATCHED",
				);
				expect(received).toHaveLength(count + 1);
				outcome = "interrupt";
				const uncertain = { ...reference, requestId: randomUUID() };
				const before = received.length;
				expect((await call(uncertain)).report.failures[0].code).toBe(
					"REMOTE_REQUEST_FAILED",
				);
				expect((await call(uncertain)).report.failures[0].code).toBe(
					"MUTATION_ALREADY_DISPATCHED",
				);
				expect(received).toHaveLength(before + 1);
				outcome = "success";
			}
			const management = remoteInputs["generations.create"];
			expect(management.parse({ ...reference, envFile: "client.env" })).toEqual(
				{ ...reference, envFile: "client.env" },
			);
			expect(
				referenceGenerationRequestSchema.safeParse(reference).success,
			).toBe(true);
			expect(
				management.safeParse({
					...reference,
					sourceSelection: {
						kind: "intentional-absence",
						reason: "no-reference-available",
					},
				}).success,
			).toBe(false);
		} finally {
			child.stdin.end();
			const [code] = await exited;
			expect(code).toBe(0);
			expect(stderr).toBe("");
		}
	} finally {
		server.closeAllConnections();
		await new Promise<void>((resolve) => server.close(() => resolve()));
		await rm(directory, { recursive: true, force: true });
	}
}, 30000);
