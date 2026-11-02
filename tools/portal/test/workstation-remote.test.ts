import { expect, test } from "bun:test";
import { once } from "node:events";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { join } from "node:path";
import { z } from "zod";
import { createAuth } from "../src/auth.ts";
import { createPortal } from "../src/server.ts";
import { hash } from "../src/sources.ts";
import { referenceClients, referencesFixture } from "./references-fixture.ts";

for (const scenario of ["valid", "size", "production"])
	test(`built v2 CLI/MCP actual owner HTTP parity: ${scenario}`, async () => {
		let auth: ReturnType<typeof createAuth> | undefined;
		const f = await referencesFixture({
			controlled: scenario !== "production",
			factory: async (config, options) => {
				auth = createAuth(config);
				return createPortal(config, options);
			},
		});
		let sends = 0;
		const provider = createServer(async (req, res) => {
			if (req.method === "GET")
				return res.end(
					JSON.stringify({ data: [{ id: "gpt-image-2.5-sunburst" }] }),
				);
			for await (const _chunk of req) {
				/* Drain the actual multipart request. */
			}
			sends++;
			res.setHeader("content-type", "application/json");
			res.end(
				JSON.stringify({ data: [{ b64_json: f.image.toString("base64") }] }),
			);
		});
		const listening = once(provider, "listening", {
			signal: AbortSignal.timeout(5000),
		});
		provider.listen(0, "127.0.0.1");
		await listening;
		const address = provider.address();
		if (!address || typeof address === "string") throw Error("address");
		const connectionSchema = z.object({
			connection: z.object({ connectionId: z.uuid() }),
		});
		const prior = connectionSchema.parse(
			await (await f.request("/connections")).json(),
		);
		await fetch(
			`${f.origin}/tools/api/connections/${prior.connection.connectionId}`,
			{ method: "DELETE", headers: f.headers },
		);
		const connection = connectionSchema.parse(
			await (
				await f.request("/connections", {
					baseUrl: `http://127.0.0.1:${address.port}/v2`,
					apiKey: "controlled-key",
				})
			).json(),
		);
		const release = join(f.root, "source-free");
		await mkdir(release);
		for (const file of ["cli.mjs", "mcp.mjs"])
			await copyFile(
				join(import.meta.dir, "../dist", file),
				join(release, file),
			);
		const clients = await referenceClients(f, release);
		try {
			const snapshot = JSON.parse(
				await readFile(
					join(f.storage, "1", "jobs", f.identityResultId, "source-bytes.json"),
					"utf8",
				),
			);
			const token = JSON.parse(
				Buffer.from(snapshot.token, "base64").toString(),
			);
			const input = (category = "hair") => {
				const look = {
					schemaVersion: 2,
					sourceId: "owner-http-design",
					lookId: token.lookId,
					personId: f.person.id,
					characterId: f.person.characterId,
					category,
					status: "owner-authored",
					description: "Explicit authored hairstyle and clothing.",
				};
				const authoredLookBase64 = Buffer.from(JSON.stringify(look)).toString(
					"base64",
				);
				const { shots: _shots, ...base } = f.payload();
				return {
					request: {
						...base,
						schemaVersion: 2,
						connectionId: connection.connection.connectionId,
						authoredLook: {
							sourceId: look.sourceId,
							lookId: look.lookId,
							sha256: hash(Buffer.from(authoredLookBase64, "base64")),
						},
						frames: Array.from(
							{ length: category === "fullbody-turntable" ? 4 : 1 },
							(_, frameOrder) => {
								const width = scenario === "size" ? 1023 : 1024;
								const outputSpec = {
									schemaVersion: 2,
									category,
									variant: "complete",
									view:
										category === "fullbody-turntable"
											? ["front", "profile", "side", "back"][frameOrder]
											: "front",
									frameOrder,
									format: "png",
									width,
									height: 1536,
									background: { kind: "transparent", alpha: "zero-background" },
									alignment: {
										canvasId: "owner-canvas",
										coordinates: "pixels-top-left-x-right-y-down",
										anchor: [512, 768],
										crop: [0, 0, width, 1536],
									},
									featureExclusions: [],
								};
								return {
									outputSpec,
									outputSpecSha256: hash(
										Buffer.from(JSON.stringify(outputSpec)),
									),
								};
							},
						),
					},
					authoredLookBase64,
				};
			};
			const call = async (verb: string, args: string[], fields: object) => {
				const cli = await clients.cli(["workstations", verb, ...args]);
				expect(cli.stderr).toBe("");
				const mcp = await clients.call(`workstations.${verb}`, fields);
				expect(cli.report).toEqual(mcp);
				return cli.report;
			};
			await call("catalog", [], {});
			await call("list", [], {});
			const catalog = (await clients.rpc("tools/list")).result.tools;
			expect(
				catalog.filter((tool: { name: string }) =>
					tool.name.startsWith("workstations."),
				),
			).toHaveLength(7);
			for (const bad of ["mesh", "hair"]) {
				const invalid = input(bad);
				if (bad === "hair") {
					const frame = invalid.request.frames[0];
					if (!frame) throw Error("frame");
					frame.outputSpecSha256 = "0".repeat(64);
				}
				const path = join(f.root, "invalid.json");
				await writeFile(path, JSON.stringify(invalid));
				expect(
					(await call("create", ["--input", path], invalid)).failures[0].code,
				).toBe("INVALID_PARAMS");
			}
			expect(sends).toBe(0);
			const hair = input();
			const path = join(f.root, "hair.json");
			await writeFile(path, JSON.stringify(hair));
			const created = await call("create", ["--input", path], hair);
			for (const state of ["cli-state", "mcp-state"]) {
				const journal = JSON.parse(
					await readFile(
						join(f.root, state, "journal", `${hair.request.requestId}.json`),
						"utf8",
					),
				);
				expect(journal.requestId).toBe(hair.request.requestId);
				expect(JSON.parse(journal.payload)).toEqual(hair);
				expect(journal.payloadSha256).toBe(hash(Buffer.from(journal.payload)));
			}
			if (scenario === "production") {
				expect(created).toMatchObject({
					ok: false,
					result: { state: "BLOCKED", reason: "REFERENCE_PRODUCTION_BLOCKED" },
					failures: [{ code: "BLOCKED", status: 503 }],
				});
				expect(sends).toBe(0);
				return;
			}
			expect(created.result.job.state).toBe(
				scenario === "size" ? "UNKNOWN" : "HOLD",
			);
			expect(sends).toBe(1);
			expect(
				(await call("create", ["--input", path], hair)).failures[0].code,
			).toBe("MUTATION_ALREADY_DISPATCHED");
			const changed = {
				...hair,
				authoredLookBase64: Buffer.from("{}").toString("base64"),
			};
			await writeFile(path, JSON.stringify(changed));
			expect(
				(await call("create", ["--input", path], changed)).failures[0],
			).toMatchObject({ code: "REQUEST_CONFLICT", status: 409 });
			const fields = {
				personId: f.person.id,
				requestId: hair.request.requestId,
			};
			const args = [hair.request.requestId, "--person", f.person.id];
			await call("get", args, fields);
			await call("history", [f.person.id], { personId: f.person.id });
			expect(
				(
					await call("result", [...args, "--frame", "1"], {
						...fields,
						frameOrder: 1,
					})
				).failures[0].status,
			).toBe(404);
			if (scenario === "size") return;
			await call("result", [...args, "--frame", "0"], {
				...fields,
				frameOrder: 0,
			});
			const output = join(f.root, "hair.png");
			const invalidPath = join(f.root, "missing", "frame.png");
			expect(
				(
					await call(
						"download",
						[...args, "--frame", "0", "--output", invalidPath],
						{ ...fields, frameOrder: 0, output: invalidPath },
					)
				).failures[0].code,
			).toBe("INVALID_OUTPUT_PATH");
			const cli = await clients.cli([
				"workstations",
				"download",
				...args,
				"--frame",
				"0",
				"--output",
				output,
			]);
			expect(cli.report.ok).toBe(true);
			expect(hash(await readFile(output))).toBe(hash(f.image));
			const mcpOutput = join(f.root, "hair-mcp.png");
			const mcp = await clients.call("workstations.download", {
				...fields,
				frameOrder: 0,
				output: mcpOutput,
			});
			expect({ ...cli.report.result, output: mcpOutput }).toEqual(mcp.result);
			expect(hash(await readFile(mcpOutput))).toBe(hash(f.image));
			const foreignFields = { ...fields, personId: "person-9999" };
			expect(
				(
					await call(
						"get",
						[hair.request.requestId, "--person", "person-9999"],
						foreignFields,
					)
				).failures[0].status,
			).toBe(404);
			const turns = input("fullbody-turntable");
			await writeFile(path, JSON.stringify(turns));
			expect(
				(await call("create", ["--input", path], turns)).result.job.state,
			).toBe("HOLD");
			expect(sends).toBe(5);
			for (let frameOrder = 0; frameOrder < 4; frameOrder++) {
				const frameFields = {
					personId: f.person.id,
					requestId: turns.request.requestId,
					frameOrder,
				};
				const frameArgs = [
					turns.request.requestId,
					"--person",
					f.person.id,
					"--frame",
					String(frameOrder),
				];
				await call("result", frameArgs, frameFields);
				const cliOutput = join(f.root, `turn-${frameOrder}.png`);
				const mcpOutput = join(f.root, `turn-${frameOrder}-mcp.png`);
				const cli = await clients.cli([
					"workstations",
					"download",
					...frameArgs,
					"--output",
					cliOutput,
				]);
				const mcp = await clients.call("workstations.download", {
					...frameFields,
					output: mcpOutput,
				});
				expect(cli.report.ok).toBe(true);
				expect({ ...cli.report.result, output: mcpOutput }).toEqual(mcp.result);
				expect(hash(await readFile(cliOutput))).toBe(hash(f.image));
				expect(hash(await readFile(mcpOutput))).toBe(hash(f.image));
			}
			const sixth = input();
			await writeFile(path, JSON.stringify(sixth));
			expect(
				(await call("create", ["--input", path], sixth)).failures[0].code,
			).toBe("WORKSTATION_ATTEMPT_LIMIT");
			expect(sends).toBe(5);
			if (!auth) throw Error("auth");
			for (const [cookie, status] of [
				[`portal_session=${auth.issue({ id: "2", login: "foreign" })}`, 403],
				["portal_session=invalid", 401],
			] as const) {
				for (const state of ["cli-state", "mcp-state"]) {
					const sessionPath = join(f.root, state, "session.json");
					const session = JSON.parse(await readFile(sessionPath, "utf8"));
					await writeFile(sessionPath, JSON.stringify({ ...session, cookie }), {
						mode: 0o600,
					});
				}
				if (status === 403)
					expect((await call("get", args, fields)).failures[0].status).toBe(
						404,
					);
				const unauthorized = input();
				await writeFile(path, JSON.stringify(unauthorized));
				expect(
					(await call("create", ["--input", path], unauthorized)).failures[0]
						.status,
				).toBe(status);
				expect(sends).toBe(5);
			}
		} finally {
			expect(await clients.close()).toBe(0);
			const closed = once(provider, "close");
			provider.closeAllConnections();
			provider.close();
			await closed;
			await f.close();
		}
	}, 60000);
