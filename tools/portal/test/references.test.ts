import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import {
	cp,
	mkdir,
	readdir,
	readFile,
	rename,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { invokeManagement, operations } from "../src/management.ts";
import { referenceKinds, referenceRequestSchema } from "../src/references.ts";
import { hash } from "../src/sources.ts";
import { referenceClients, referencesFixture } from "./references-fixture.ts";

const nodeKey = "NODE_BINARY",
	pathKey = "PATH",
	evidenceKey = "TASK15_EVIDENCE";
const resultSchema = z.looseObject({
	job: z.looseObject({ state: z.string() }),
	manifest: z.looseObject({
		order: z.array(z.string()),
		binding: z.unknown(),
		shots: z.array(
			z.looseObject({ shot: z.string(), receiptSha256: z.string() }),
		),
	}),
});

test("reference download binds nine existing shot receipts through authenticated HTTP CLI and MCP without generation", async () => {
	const f = await referencesFixture();
	const clients = await referenceClients(f);
	const parent = f.payload().requestId;
	const dir = join(f.storage, "1", "jobs", parent);
	const binding = {
		parentRequestId: parent,
		identityResultId: f.identityResultId,
		personId: f.person.id,
	};
	const shots = referenceKinds.map((shot) => {
		const receipt = {
			schemaVersion: 1,
			requestId: f.payload().requestId,
			shot,
			status: "SUCCEEDED",
			binding,
			imageSha256: hash(f.image),
		};
		const bytes = `${JSON.stringify(receipt, null, 2)}\n`;
		return {
			receipt,
			bytes,
			shot,
			requestId: receipt.requestId,
			status: "SUCCEEDED",
			receiptSha256: hash(Buffer.from(bytes)),
		};
	});
	const manifest = {
		schemaVersion: 1,
		kind: "image-reference-set",
		binding,
		order: referenceKinds,
		status: "candidate-unreviewed",
		paidProof: "NOT_RUN",
		shots: shots.map(({ receipt: _receipt, bytes: _bytes, ...shot }) => shot),
	};
	try {
		await mkdir(join(dir, "references"), { recursive: true });
		await writeFile(
			join(dir, "job.json"),
			JSON.stringify({
				id: parent,
				state: "HOLD",
				reviewStatus: "HOLD",
				imageUrl: null,
				metrics: null,
				errorCode: null,
				payloadSHA: hash(f.image),
			}),
		);
		await writeFile(
			join(dir, "references", "set.json"),
			JSON.stringify(manifest),
		);
		for (const item of shots) {
			await writeFile(
				join(dir, "references", `${item.shot}.receipt.json`),
				item.bytes,
			);
			await writeFile(join(dir, "references", `${item.shot}.png`), f.image);
			const response = await f.request(
				`/references/${parent}/${item.shot}/result`,
			);
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({
				result: {
					requestId: parent,
					childRequestId: item.requestId,
					shot: item.shot,
					receiptSHA: item.receiptSha256,
					pngSHA: hash(f.image),
					imageUrl: `/tools/api/references/${parent}/${item.shot}/image`,
				},
			});
			const output = join(f.root, `${item.shot}-cli.png`);
			const cli = await clients.cli([
				"references",
				"download",
				parent,
				"--shot",
				item.shot,
				"--output",
				output,
			]);
			expect(cli.code).toBe(0);
			const mcpOutput = join(f.root, `${item.shot}-mcp.png`);
			const mcp = await clients.call("references.download", {
				requestId: parent,
				shot: item.shot,
				output: mcpOutput,
			});
			expect({ ...cli.report.result, output: mcpOutput }).toEqual(mcp.result);
			for (const path of [output, mcpOutput])
				expect(hash(await readFile(path))).toBe(hash(f.image));
		}
		expect(f.calls).toHaveLength(0);
		expect(
			await (await f.request(`/references/${parent}`)).json(),
		).toMatchObject({ reviewStatus: "HOLD", approval: "NONE" });
		expect(
			(await fetch(`${f.origin}/tools/api/references/${parent}/hair/result`))
				.status,
		).toBe(401);
		expect(
			(await fetch(`${f.origin}/tools/api/references/${parent}/hair/image`))
				.status,
		).toBe(401);
		const selected = shots.find((item) => item.shot === "hair");
		if (!selected) throw Error("FIXTURE_SHOT");
		const receiptPath = join(dir, "references", "hair.receipt.json");
		const manifestPath = join(dir, "references", "set.json");
		const foreign = join(f.storage, "99", "jobs", parent);
		const outside = join(f.root, "outside-references");
		await mkdir(foreign, { recursive: true });
		await cp(join(dir, "references"), outside, { recursive: true });
		const denied: {
			name: string;
			endpoint: string;
			status: number;
			code: unknown;
		}[] = [];
		for (const [name, path, target] of [
			[
				"cross-owner-png",
				join(dir, "references", "hair.png"),
				join(foreign, "hair.png"),
			],
			["cross-owner-receipt", receiptPath, join(foreign, "hair.receipt.json")],
			["outside-manifest", manifestPath, join(outside, "set.json")],
			["cross-owner-job", join(dir, "job.json"), join(foreign, "job.json")],
			["outside-directory", join(dir, "references"), outside],
		] as const) {
			await cp(path, target, { recursive: true });
			await rename(path, `${path}.preserved`);
			await symlink(target, path);
			try {
				for (const endpoint of ["result", "image"]) {
					const response = await f.request(
						`/references/${parent}/hair/${endpoint}`,
					);
					let body: { error?: { code?: unknown } } = {};
					if (
						response.headers.get("content-type")?.includes("application/json")
					)
						body = (await response.json()) as { error?: { code?: unknown } };
					else await response.arrayBuffer();
					denied.push({
						name,
						endpoint,
						status: response.status,
						code: body.error?.code ?? null,
					});
				}
			} finally {
				await rm(path);
				await rename(`${path}.preserved`, path);
			}
		}
		if (process.env[evidenceKey])
			console.log(`TASK16_CONTAINMENT ${JSON.stringify(denied)}`);
		expect(denied.map(({ status, code }) => ({ status, code }))).toEqual(
			denied.map(() => ({ status: 404, code: "INVALID_PATH" })),
		);
		await rename(join(dir, "references"), join(dir, "references.preserved"));
		await symlink(outside, join(dir, "references"));
		try {
			const output = join(f.root, "escaped.png");
			const cli = await clients.cli([
				"references",
				"download",
				parent,
				"--shot",
				"hair",
				"--output",
				output,
			]);
			expect(cli.report).toEqual(
				await clients.call("references.download", {
					requestId: parent,
					shot: "hair",
					output,
				}),
			);
			expect(cli.report).toMatchObject({
				ok: false,
				failures: [{ code: "INVALID_PATH", status: 404 }],
			});
			expect(await readdir(f.root)).not.toContain("escaped.png");
		} finally {
			await rm(join(dir, "references"));
			await rename(join(dir, "references.preserved"), join(dir, "references"));
		}
		for (const [name, patch] of [
			["schema", { schemaVersion: 2 }],
			["child", { requestId: parent }],
			["shot", { shot: "front" }],
			["status", { status: "UNKNOWN" }],
			["hash-format", { imageSha256: hash(f.image).toUpperCase() }],
			["identity", { binding: { ...binding, identityResultId: parent } }],
		] as const) {
			const bytes = JSON.stringify({ ...selected.receipt, ...patch });
			await writeFile(receiptPath, bytes);
			await writeFile(
				manifestPath,
				JSON.stringify({
					...manifest,
					shots: manifest.shots.map((item) =>
						item.shot === "hair"
							? { ...item, receiptSha256: hash(Buffer.from(bytes)) }
							: item,
					),
				}),
			);
			for (const endpoint of ["result", "image"]) {
				const response = await f.request(
					`/references/${parent}/hair/${endpoint}`,
				);
				expect(response.status).toBe(409);
				expect(await response.json()).toMatchObject({
					error: { code: "REFERENCE_BINDING_MISMATCH" },
				});
			}
			const output = join(f.root, `${name}-bad.png`);
			expect(
				await clients.call("references.download", {
					requestId: parent,
					shot: "hair",
					output,
				}),
			).toMatchObject({
				ok: false,
				failures: [{ code: "REFERENCE_BINDING_MISMATCH" }],
			});
			expect(await readdir(f.root)).not.toContain(`${name}-bad.png`);
		}
		await writeFile(manifestPath, JSON.stringify(manifest));
		await writeFile(receiptPath, `${selected.bytes} `);
		expect((await f.request(`/references/${parent}/hair/result`)).status).toBe(
			409,
		);
		await writeFile(receiptPath, selected.bytes);
		await writeFile(join(dir, "references", "hair.png"), "tampered");
		for (const endpoint of ["result", "image"])
			expect(
				(await f.request(`/references/${parent}/hair/${endpoint}`)).status,
			).toBe(409);
		await writeFile(join(dir, "references", "hair.png"), f.image);
		await writeFile(
			manifestPath,
			JSON.stringify({
				...manifest,
				binding: { ...binding, parentRequestId: f.identityResultId },
			}),
		);
		expect((await f.request(`/references/${parent}/hair/result`)).status).toBe(
			409,
		);
		for (const unavailable of ["UNKNOWN", "FAILED", "missing"]) {
			await writeFile(
				manifestPath,
				JSON.stringify({
					...manifest,
					shots:
						unavailable === "missing"
							? []
							: manifest.shots.map((item) => ({
									...item,
									status: unavailable,
								})),
				}),
			);
			const output = join(f.root, `${unavailable}.png`);
			const cli = await clients.cli([
				"references",
				"download",
				parent,
				"--shot",
				"hair",
				"--output",
				output,
			]);
			expect(cli.report).toEqual(
				await clients.call("references.download", {
					requestId: parent,
					shot: "hair",
					output,
				}),
			);
			expect(cli.report).toMatchObject({
				ok: false,
				failures: [{ code: "NOT_FOUND" }],
			});
			expect(await readdir(f.root)).not.toContain(`${unavailable}.png`);
		}
		expect(f.calls).toHaveLength(0);
		expect((await readdir(f.root)).some((name) => name.endsWith(".tmp"))).toBe(
			false,
		);
	} finally {
		expect(await clients.close()).toBe(0);
		await f.close();
	}
}, 30000);

test("source-free Node24 built server starts without adjacent schema files", async () => {
	const base = join(import.meta.dir, "../.reference-node-test");
	await mkdir(base, { recursive: true });
	let child: ReturnType<typeof spawn> | undefined;
	try {
		const build = await Bun.build({
			entrypoints: [join(import.meta.dir, "../src/main.ts")],
			target: "node",
			outdir: base,
			naming: "server.mjs",
		});
		expect(build.success).toBe(true);
		child = spawn(process.env[nodeKey] ?? "node", [join(base, "server.mjs")], {
			cwd: base,
			env: {
				PATH: process.env[pathKey],
				PORTAL_PORT: "0",
				PORTAL_STORAGE_PATH: join(base, "storage"),
			},
			stdio: ["ignore", "pipe", "pipe"],
		});
		const exited = once(child, "exit", { signal: AbortSignal.timeout(10000) });
		const ready = new Promise<string>((resolve, reject) => {
			let output = "";
			child?.stdout?.on("data", (chunk) => {
				output += String(chunk);
				if (output.includes("PORTAL_READY")) resolve(output);
			});
			child?.once("error", reject);
			child?.once("exit", () => reject(Error("SERVER_EXITED_BEFORE_READY")));
		});
		expect(await ready).toContain("PORTAL_READY");
		const port = Number((await ready).match(/port=(\d+)/)?.[1]);
		expect(
			(await fetch(`http://127.0.0.1:${port}/tools/api/status`)).status,
		).toBe(200);
		const session = await fetch(
			`http://127.0.0.1:${port}/tools/api/auth/session`,
		);
		expect(session.status).toBe(200);
		const cookie = session.headers.getSetCookie()[0]?.split(";")[0] ?? "";
		expect(
			(
				await fetch(`http://127.0.0.1:${port}/tools/api/references`, {
					headers: { cookie },
				})
			).status,
		).toBe(200);
		child.kill("SIGTERM");
		expect(await exited).toEqual([0, null]);
		child = undefined;
	} finally {
		child?.kill("SIGTERM");
		await rm(base, { recursive: true, force: true });
	}
}, 15000);

test("source-free server bundle resolves trusted options and sealed identity through actual multipart HTTP", async () => {
	const base = join(import.meta.dir, "../.reference-bundle-test");
	await mkdir(base, { recursive: true });
	try {
		const build = await Bun.build({
			entrypoints: [join(import.meta.dir, "../src/server.ts")],
			target: "bun",
			outdir: base,
			naming: "server.mjs",
		});
		expect(build.success).toBe(true);
		const bundled = await import(join(base, "server.mjs"));
		const f = await referencesFixture({ factory: bundled.createPortal });
		try {
			const response = await f.request("/references", f.payload());
			expect(response.status).toBe(200);
			const result = await response.json();
			expect(result).toMatchObject({
				job: { state: "HOLD", reviewStatus: "HOLD" },
				manifest: {
					order: ["hair"],
					status: "candidate-unreviewed",
					paidProof: "NOT_RUN",
				},
				approval: "NONE",
			});
			expect(f.calls).toHaveLength(1);
			expect(f.calls[0]).toMatchObject({ shot: "hair", references: 2 });
		} finally {
			await f.close();
		}
		const prior = await Bun.build({
			entrypoints: [join(import.meta.dir, "../src/server.ts")],
			target: "bun",
			outdir: base,
			naming: "prior.mjs",
			plugins: [
				{
					name: "prior-options-consumer",
					setup(builder) {
						builder.onLoad(
							{ filter: /generate-character-set\.mjs$/ },
							async ({ path }) => {
								const source = await readFile(path, "utf8");
								const boundary = "export async function generateReferenceSet(";
								expect(source.split(boundary)).toHaveLength(2);
								const start = source.indexOf(boundary);
								const prefix = source.slice(0, start);
								const v1 = source.slice(start);
								const call =
									"const prompt = await emit({ character, ...shot, stylePath: source.stylePath, referencePath: source.referencePath, optionsPath: source.optionsPath, ";
								expect(v1.split(call)).toHaveLength(2);
								const priorCall = call.replace(
									"optionsPath: source.optionsPath, ",
									"",
								);
								const mutated = v1.replace(call, priorCall);
								expect(mutated).not.toBe(v1);
								expect(mutated).not.toContain(call);
								expect(mutated.split(priorCall)).toHaveLength(2);
								return { contents: prefix + mutated, loader: "js" };
							},
						);
					},
				},
			],
		});
		expect(prior.success).toBe(true);
		const old = await import(join(base, "prior.mjs"));
		const red = await referencesFixture({ factory: old.createPortal });
		try {
			expect((await red.request("/references", red.payload())).status).toBe(
				404,
			);
			expect(red.calls).toHaveLength(0);
		} finally {
			await red.close();
		}
	} finally {
		await rm(base, { recursive: true, force: true });
	}
}, 30000);

test("web HTTP CLI and stdio MCP references creation preserve nine kinds and UNKNOWN no-redispatch", async () => {
	const f = await referencesFixture();
	const clients = await referenceClients(f);
	try {
		const catalog = z
			.object({ catalog: z.looseObject({ kinds: z.array(z.string()) }) })
			.parse(await (await f.request("/references")).json());
		expect(catalog.catalog.kinds).toEqual([...referenceKinds]);
		const all = f.payload([...referenceKinds].reverse());
		const response = await f.request("/references", all);
		expect(response.status).toBe(200);
		const result = resultSchema.parse(await response.json());
		expect(result.manifest.order).toEqual([...referenceKinds]);
		expect(result.job.state).toBe("HOLD");
		expect(f.calls.map((call) => call.shot)).toEqual([...referenceKinds]);
		expect(new Set(f.calls.map((call) => call.requestId)).size).toBe(9);
		for (const item of result.manifest.shots) {
			const dir = join(f.storage, "1", "jobs", all.requestId, "references");
			const receiptBytes = await readFile(
				join(dir, `${item.shot}.receipt.json`),
			);
			expect(hash(receiptBytes)).toBe(item.receiptSha256);
			const receipt = JSON.parse(receiptBytes.toString());
			expect(receipt.binding).toEqual(result.manifest.binding);
			expect(hash(await readFile(join(dir, `${item.shot}.png`)))).toBe(
				receipt.imageSha256,
			);
			const png = await f.request(
				`/references/${all.requestId}/${item.shot}/image`,
			);
			expect(hash(new Uint8Array(await png.arrayBuffer()))).toBe(hash(f.image));
		}
		expect(await (await f.request("/references", all)).json()).toEqual(result);
		expect(f.calls).toHaveLength(9);
		const cliPayload = f.payload();
		const input = join(f.root, "cli.json");
		await writeFile(input, JSON.stringify(cliPayload));
		const cli = await clients.cli(["references", "create", "--input", input]);
		expect(cli.code).toBe(0);
		expect(cli.stderr).toBe("");
		expect(cli.report.result).toMatchObject({
			job: { state: "HOLD" },
			manifest: { order: ["hair"] },
		});
		const mcpPayload = f.payload();
		const mcp = await clients.call("references.create", mcpPayload);
		expect(mcp).toMatchObject({
			ok: true,
			result: { job: { state: "HOLD" }, manifest: { order: ["hair"] } },
		});
		expect(f.calls.slice(9).map((call) => call.shot)).toEqual(["hair", "hair"]);
		expect(f.calls.slice(9).map((call) => call.references)).toEqual([2, 2]);
		expect(
			(await clients.cli(["references", "get", mcpPayload.requestId])).report
				.result,
		).toEqual(mcp.result);
		expect(
			(
				await clients.call("references.get", {
					requestId: mcpPayload.requestId,
				})
			).result,
		).toEqual(mcp.result);
		for (const invalid of [
			{ shots: [] },
			{ shots: ["hair", "hair"] },
			{ shots: ["mesh"] },
			{ requestId: "bad" },
			{ connectionId: "bad" },
			{ faceMode: { kind: "template", variantId: "" } },
			{ source: "/tmp/client-path" },
		]) {
			const malformed = { ...f.payload(), ...invalid };
			expect((await f.request("/references", malformed)).status).toBe(422);
			expect(
				await invokeManagement("references.create", malformed),
			).toMatchObject({ ok: false, failures: [{ code: "INVALID_PARAMS" }] });
		}
		expect(f.calls).toHaveLength(11);
		for (const invalid of [
			{ styleReferenceSha256: "f".repeat(64) },
			{ personId: "person-9999" },
			{ identityResultId: f.payload().requestId },
		])
			expect(
				(await f.request("/references", { ...f.payload(), ...invalid })).status,
			).not.toBe(200);
		expect(f.calls).toHaveLength(11);
		f.uncertain();
		const unknownPayload = f.payload(["front", "hair"]);
		const unknown = await (
			await f.request("/references", unknownPayload)
		).json();
		expect(unknown).toMatchObject({
			job: { state: "UNKNOWN" },
			manifest: {
				status: "UNKNOWN",
				shots: [{ shot: "front", status: "UNKNOWN" }],
			},
		});
		expect(f.calls).toHaveLength(12);
		expect(
			await (await f.request("/references", unknownPayload)).json(),
		).toEqual(unknown);
		expect((await f.request("/references", f.payload())).status).toBe(409);
		expect(
			(
				await f.request("/generations", {
					requestId: f.payload().requestId,
					connectionId: all.connectionId,
					personId: all.personId,
					providerModel: all.providerModel,
					size: "340x510",
					faceMode: all.faceMode,
				})
			).status,
		).toBe(409);
		expect(
			(await clients.call("references.create", f.payload())).failures[0].code,
		).toBe("OWNER_DISPATCH_UNCERTAIN");
		expect(f.calls).toHaveLength(12);
		expect(
			(await fetch(`${f.origin}/tools/api/references/${all.requestId}`)).status,
		).toBe(401);
		const schema = operations.find((op) => op.name === "references.create");
		expect(schema?.annotations.readOnlyHint).toBe(false);
		expect(JSON.stringify(schema)).not.toMatch(
			/characterPath|stylePath|imagePath|apiKey|bridgeBearer|optionsPath/,
		);
		expect(referenceRequestSchema.safeParse(f.payload()).success).toBe(true);
		const evidence = process.env[evidenceKey];
		if (evidence)
			console.log(
				`TASK15_INTEGRATION ${JSON.stringify({ catalog, result, cli, mcp, unknown, calls: f.calls.map(({ prompt: _prompt, ...call }) => call), pngSHA: hash(f.image), paidProof: "NOT_RUN" })}`,
			);
	} finally {
		expect(await clients.close()).toBe(0);
		await f.close();
	}
}, 60000);

test("production references reject without provider dispatch and controlled authority requires test runtime", async () => {
	const f = await referencesFixture({ controlled: false });
	try {
		const response = await f.request("/references", f.payload());
		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({
			error: { code: "REFERENCE_PRODUCTION_BLOCKED" },
		});
		expect(f.calls).toHaveLength(0);
	} finally {
		await f.close();
	}
});
