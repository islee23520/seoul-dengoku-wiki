import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { localAiClients } from "./local-ai-management-fixture.ts";
import { hash } from "./local-ai-worker-fixture.ts";

test("built CLI and stdio MCP share signed local AI HTTP, journal and bounded downloads", async () => {
	// Given a real signed-owner portal and CPU-only fixture.
	const f = await localAiClients();
	const {
		app,
		root,
		input,
		artifact,
		state,
		child,
		exited,
		node,
		cli,
		call,
		rpc,
	} = f;
	try {
		// When both built transports discover, submit once, and retrieve the same job.
		await rpc("initialize", {
			protocolVersion: "2025-11-25",
			capabilities: {},
			clientInfo: { name: "task10", version: "1" },
		});
		const initialized =
			'{"jsonrpc":"2.0","method":"notifications/initialized"}\n';
		f.record(`MCP stdin ${initialized.trim()}`);
		child.stdin.write(initialized);
		const tools = z
			.object({
				tools: z.array(
					z.object({
						name: z.string(),
						inputSchema: z.unknown(),
						annotations: z.unknown(),
					}),
				),
			})
			.parse(await rpc("tools/list")).tools;
		const ops = z
			.object({
				operations: z.array(
					z.object({
						name: z.string(),
						inputSchema: z.unknown(),
						annotations: z.unknown(),
						effectClass: z.string(),
					}),
				),
			})
			.parse((await cli(["ops", "--format", "json"])).result)
			.operations.filter((op) => op.name.startsWith("local-ai."));
		expect(ops.map((op) => op.effectClass)).toEqual([
			"NETWORK_READ",
			"NETWORK_MUTATION",
			"NETWORK_READ",
			"LOCAL_ARTIFACT_WRITE",
		]);
		for (const op of ops)
			expect(tools.find((tool) => tool.name === op.name)).toEqual({
				name: op.name,
				inputSchema: op.inputSchema,
				annotations: op.annotations,
			});
		expect(await cli(["local-ai", "catalog"])).toEqual(
			await call("local-ai.catalog"),
		);
		const inputFile = join(root, "request.json");
		await writeFile(inputFile, JSON.stringify(input));
		const jobs = app.localAi;
		if (!jobs) throw new Error("missing fixture jobs");
		const terminal = once(jobs.events, "terminal", {
			signal: AbortSignal.timeout(15000),
		});
		expect((await cli(["local-ai", "create", "--input", inputFile])).ok).toBe(
			true,
		);
		await terminal;
		// Then journaled replay never dispatches twice, including MCP's same request.
		expect((await call("local-ai.create", input)).failures?.[0]?.code).toBe(
			"MUTATION_ALREADY_DISPATCHED",
		);
		expect(
			(await call("local-ai.create", { ...input, seed: 2 })).failures?.[0]
				?.code,
		).toBe("REQUEST_CONFLICT");
		expect(f.runs()).toBe(1);
		const journal = JSON.parse(
			await readFile(join(state, "journal", `${input.requestId}.json`), "utf8"),
		);
		expect(JSON.parse(journal.payload)).toEqual(input);
		expect(journal.payloadSha256).toBe(hash(Buffer.from(journal.payload)));
		expect(await cli(["local-ai", "get", input.requestId])).toEqual(
			await call("local-ai.get", { jobId: input.requestId }),
		);
		for (const transport of ["cli", "mcp"]) {
			const output = join(root, `${transport}.json`);
			const result =
				transport === "cli"
					? await cli([
							"local-ai",
							"download",
							input.requestId,
							"--artifact",
							artifact.id,
							"--output",
							output,
						])
					: await call("local-ai.download", {
							jobId: input.requestId,
							artifactId: artifact.id,
							output,
						});
			expect(result).toMatchObject({
				ok: true,
				result: { sha256: artifact.sha256, bytes: artifact.bytes },
			});
			expect(hash(await readFile(output))).toBe(artifact.sha256);
			expect(
				(
					await call("local-ai.download", {
						jobId: input.requestId,
						artifactId: artifact.id,
						output,
					})
				).failures?.[0]?.code,
			).toBe("OUTPUT_EXISTS");
		}
		for (const invalid of [
			{ ...input, tool: "unknown" },
			{ ...input, path: "private-canary" },
			{ ...input, seed: -1 },
			{ ...input, tool: "uniforge3d" },
		])
			expect((await call("local-ai.create", invalid)).failures?.[0]?.code).toBe(
				"INVALID_PARAMS",
			);
		expect(
			(
				await cli([
					"local-ai",
					"get",
					input.requestId,
					"--path",
					"private-canary",
				])
			).ok,
		).toBe(false);
		expect(
			(await call("local-ai.get", { jobId: randomUUID() })).failures?.[0]
				?.status,
		).toBe(404);
		const foreign = randomUUID(),
			directory = join(root, "storage/local-ai/jobs", foreign);
		await mkdir(directory);
		const stored = JSON.parse(
			await readFile(
				join(root, "storage/local-ai/jobs", input.requestId, "job.json"),
				"utf8",
			),
		);
		await writeFile(
			join(directory, "job.json"),
			JSON.stringify({
				...stored,
				id: foreign,
				owner: "999",
				request: { ...input, requestId: foreign },
			}),
		);
		expect(
			(await call("local-ai.get", { jobId: foreign })).failures?.[0]?.status,
		).toBe(404);
		// Tampered attachment bytes are rejected without publishing an output.
		await writeFile(
			join(
				root,
				"storage/local-ai/jobs",
				input.requestId,
				"artifacts",
				artifact.id,
			),
			Buffer.alloc(artifact.bytes, 0),
		);
		expect(
			(
				await call("local-ai.download", {
					jobId: input.requestId,
					artifactId: artifact.id,
					output: join(root, "corrupt.json"),
				})
			).ok,
		).toBe(false);
		expect(
			(
				await call("local-ai.download", {
					jobId: input.requestId,
					artifactId: "../escape",
					output: join(root, "escape"),
				})
			).failures?.[0]?.code,
		).toBe("INVALID_PARAMS");
	} finally {
		child.stdin.end();
		const [code] = await exited;
		f.record(
			JSON.stringify({
				command: [
					node,
					"--import",
					"<private fixture preload>",
					"dist/mcp.mjs",
				],
				stderr: f.stderr(),
				exit: code,
			}),
		);
		await app.close();
		await rm(root, { recursive: true, force: true });
		expect(code).toBe(0);
		expect(f.stderr()).not.toContain(f.assertion);
		f.record(
			"Cleanup: owned stdio process, portal HTTP listener and temporary storage removed; no GPU or live service used.",
		);
		const evidenceKey = "TASK10_EVIDENCE";
		const evidence = process.env[evidenceKey];
		if (evidence) await writeFile(evidence, `${f.transcript.join("\n")}\n`);
	}
}, 60000);
