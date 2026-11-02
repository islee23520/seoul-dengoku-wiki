import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { EventEmitter, once } from "node:events";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildNativeMossContextRequest } from "../src/native-moss-context.ts";
import {
	NATIVE_MOSS_MODEL,
	NATIVE_MOSS_PROFILE_DIGEST,
} from "../src/native-moss-contract.ts";
import { createNativeMossProvider } from "../src/native-moss-provider.ts";
import { createNativeMossTransport } from "../src/native-moss-transport.ts";
import { prepareNativeMossDispatchProof } from "../src/reference-workbench.ts";
import { createPortal } from "../src/server.ts";
import { hash } from "../src/sources.ts";
import { finishingPngFixture } from "./comfyui-finishing-fixture.ts";
import { nativeMossCapability } from "./native-moss-browser-fixture.ts";
import { workbenchFixture } from "./reference-workbench-fixture.ts";

type HttpBody = {
	capabilities: {
		nativeMoss: Omit<ReturnType<typeof nativeMossCapability>, "reason"> & {
			reason: string | null;
		};
	};
	connection: { connectionId: string };
	job: { id: string; state: string };
	error: { code: string };
	jobs: { id: string }[];
	inspection: {
		originalRequest: { nativeRecipe: string };
		provenance: { native: { model: string } };
	};
};

test("native actual HTTP capability, closed connect, provider admission, replay and UNKNOWN use existing jobs", async () => {
	let mode = "not-ready";
	const calls: string[] = [];
	const seams = {
		workerBundle: async () => {
			const manifest = JSON.parse(
				await readFile(
					new URL("../native-moss/manifest.json", import.meta.url),
					"utf8",
				),
			);
			return {
				files: await Promise.all(
					Object.keys(manifest.files).map(async (name) => {
						const bytes = await readFile(
							new URL(`../native-moss/${name}`, import.meta.url),
						);
						return {
							name,
							byteBase64: bytes.toString("base64"),
							sha256: (await import("../src/sources.ts")).hash(bytes),
							size: bytes.length,
						};
					}),
				),
			};
		},
		qualification: () =>
			mode === "admission-not-ready"
				? "NATIVE_UPSTREAM_ATTESTATION_MISSING"
				: null,
		readback: async () => [],
		verifyResult: () => {
			throw Error("NATIVE_RESULT_ATTESTATION_MISSING");
		},
		transport: {
			readiness: async () => {
				calls.push("readiness");
				return { state: "READY" as const, proof: {} };
			},
			lifecycleReadiness: async () => {
				calls.push("lifecycleReadiness");
				return {
					state: "LIFECYCLE_READINESS" as const,
					proof: { ready: true },
				};
			},
			lifecycleReadArtifacts: async () => {
				throw Error("UNEXPECTED_READBACK");
			},
			execute: async () => {
				calls.push("execute");
				return { state: "UNKNOWN" as const, code: "CPU_DROP" };
			},
			status: async () => {
				calls.push("status");
				return { state: "UNKNOWN" as const, code: "PENDING" };
			},
			readArtifacts: async () => {
				calls.push("readArtifacts");
				return { state: "UNKNOWN" as const, code: "PENDING" };
			},
			alpha: async () => {
				throw Error("UNEXPECTED_ALPHA");
			},
			finalize: async () => {
				throw Error("UNEXPECTED_FINALIZE");
			},
			reconcile: async () => {
				throw Error("UNEXPECTED_RECONCILE");
			},
			release: async () => {
				throw Error("UNEXPECTED_RELEASE");
			},
		},
	};
	const f = await workbenchFixture({
		imageBytes: Buffer.from(finishingPngFixture(340, 510).finishedBytes),
		create: (config, options) =>
			createPortal(
				{ ...config, nativeMoss: true },
				{
					...options,
					nativeMossTest: {
						readiness: async () =>
							mode === "not-ready"
								? {
										state: "NOT_READY",
										code: "NATIVE_UPSTREAM_ATTESTATION_MISSING",
									}
								: { state: "READY" },
						createProvider: (storage) =>
							createNativeMossProvider(storage, seams),
						dispatchProof: (input, authority) => {
							const request = input as { personId: string };
							const evidence = authority.serverEvidence as {
								tokenBytes: Uint8Array;
								recipientImage: { bytes: Uint8Array } | null;
							};
							const text =
								"seoul dengoku portrait style, preserve the source person, outfit, composition and gaze; change only the drawing style";
							const contextInput = {
								prompts: [{ personId: request.personId, text }],
								negative: "",
							};
							return {
								requestSHA256: hash(Buffer.from(JSON.stringify(input))),
								snapshotHashes: {
									detail: hash(authority.detailBytes),
									token: hash(evidence.tokenBytes),
									...(evidence.recipientImage
										? { original: hash(evidence.recipientImage.bytes) }
										: {}),
								},
								sourcePins: {},
								attestation: {
									compiled: { text, fields: [] },
									workerPins: {
										runtime: { sha256: "0".repeat(64), size: 1 },
										lifecycle: { sha256: "0".repeat(64), size: 1 },
									},
									contextInput,
									contextInputBytes: Buffer.from(JSON.stringify(contextInput)),
									contextResponseBytes: Buffer.from(
										JSON.stringify({
											maxTextLength: 4096,
											truncation: false,
											modelLoaded: false,
										}),
									),
								},
							};
						},
					},
				},
			),
	});
	try {
		const headers = await f.session();
		expect((await fetch(`${f.api}/connections`)).status).toBe(401);
		expect(
			(
				await fetch(`${f.api}/connections`, {
					method: "POST",
					headers: {
						cookie: headers.cookie,
						origin: headers.origin,
						"content-type": "application/json",
					},
					body: JSON.stringify({
						provider: "native-moss",
						model: NATIVE_MOSS_MODEL,
					}),
				})
			).status,
		).toBe(403);
		expect(
			(await fetch(`${f.origin}/tools/private/native-moss/job.py`, { headers }))
				.status,
		).toBe(404);
		const post = async (path: string, input: unknown) => {
			const r = await fetch(`${f.api}${path}`, {
				method: "POST",
				headers,
				body: JSON.stringify(input),
			});
			return { status: r.status, body: (await r.json()) as HttpBody };
		};
		const get = async (path: string) => {
			const r = await fetch(`${f.api}${path}`, { headers });
			return { status: r.status, body: (await r.json()) as HttpBody };
		};
		const cold = await get("/connections");
		expect(cold.body.capabilities.nativeMoss).toEqual({
			...nativeMossCapability(false),
			generationEnabled: false,
			reason: "NATIVE_UPSTREAM_ATTESTATION_MISSING",
		});
		expect(
			(
				await post("/connections", {
					provider: "native-moss",
					model: NATIVE_MOSS_MODEL,
				})
			).status,
		).toBe(503);
		expect(calls).toEqual([]);
		mode = "ready";
		const connected = await post("/connections", {
			provider: "native-moss",
			model: NATIVE_MOSS_MODEL,
		});
		expect(connected.status).toBe(201);
		expect(
			String(connected.body.capabilities.nativeMoss.connection?.profileDigest),
		).toBe(NATIVE_MOSS_PROFILE_DIGEST);
		expect(
			(
				await post("/connections", {
					provider: "native-moss",
					model: NATIVE_MOSS_MODEL,
					host: "other",
				})
			).status,
		).toBe(422);
		const base = {
			schemaVersion: 2,
			generationProfile: "native340-v1",
			requestId: randomUUID(),
			connectionId: connected.body.connection.connectionId,
			personId: "person-0998",
			provider: "native-moss",
			providerModel: NATIVE_MOSS_MODEL,
			nativeRecipe: "recovery16-native-flow-source045-v1",
			inputMode: "reference-img2img",
			sourceSelection: {
				kind: "selected",
				personId: "person-0998",
				sourceSHA256: f.state.pin,
			},
			explicitEdits: [],
			size: "340x510",
			faceMode: { kind: "unique", variantId: null },
		};
		for (const change of [
			{
				sourceSelection: {
					...base.sourceSelection,
					sourceSHA256: "0".repeat(64),
				},
			},
			{
				explicitEdits: [
					{ field: "outfit.upper.color", operation: "replace", value: "blue" },
				],
			},
			{ personId: undefined, sheetId: randomUUID() },
		]) {
			expect(
				(
					await post("/generations", {
						...base,
						...change,
						requestId: randomUUID(),
					})
				).status,
			).toBeGreaterThanOrEqual(400);
		}
		expect(calls).toEqual([]);
		mode = "admission-not-ready";
		expect(
			(
				await post("/generations", {
					...base,
					requestId: randomUUID(),
					nativeRecipe: "recovery16-native-flow-source025-v1",
				})
			).status,
		).toBe(503);
		expect(
			(
				await post("/generations", {
					...base,
					requestId: randomUUID(),
					personId: "person-900001",
					inputMode: "token-only",
					nativeRecipe: "recovery16-native-token-v1",
					sourceSelection: {
						kind: "intentional-absence",
						reason: "no-reference-available",
					},
				})
			).status,
		).toBe(422);
		expect(calls).toEqual([]);
		mode = "ready";
		const generated = await post("/generations", base);
		expect(generated.status).toBe(200);
		expect(generated.body.job.state, JSON.stringify(generated.body)).toBe(
			"UNKNOWN",
		);
		expect(calls.filter((x) => x === "execute")).toHaveLength(1);
		expect((await post("/generations", base)).body.job.id).toBe(base.requestId);
		expect(calls.filter((x) => x === "execute")).toHaveLength(1);
		expect(
			(
				await post("/generations", {
					...base,
					nativeRecipe: "recovery16-native-flow-source025-v1",
				})
			).status,
		).toBe(409);
		expect(
			(await post("/generations", { ...base, requestId: randomUUID() })).body
				.error.code,
		).toBe("OWNER_DISPATCH_UNCERTAIN");
		const inspection = await get(`/jobs/${base.requestId}/inspection`);
		expect(inspection.status).toBe(200);
		expect(inspection.body.inspection.originalRequest.nativeRecipe).toBe(
			base.nativeRecipe,
		);
		expect(inspection.body.inspection.provenance.native.model).toBe(
			NATIVE_MOSS_MODEL,
		);
		expect((await get(`/jobs/${base.requestId}/result`)).status).toBe(409);
		expect(
			(await get("/jobs")).body.jobs.some((job) => job.id === base.requestId),
		).toBe(true);
		expect(
			await readFile(
				join(
					f.directory,
					"storage",
					"1",
					"jobs",
					base.requestId,
					"native-dispatch.json",
				),
				"utf8",
			),
		).toContain(base.requestId);
		expect(f.calls).toHaveLength(0);
		expect(f.comfy.prompts).toHaveLength(0);
	} finally {
		await f.close();
	}
});

test("production native opt-in reports NOT_READY without any injected provider or SSH", async () => {
	const f = await workbenchFixture({
		imageBytes: Buffer.from(finishingPngFixture(340, 510).finishedBytes),
		create: (config, options) =>
			createPortal({ ...config, nativeMoss: true }, options),
	});
	try {
		const headers = await f.session();
		const response = await fetch(`${f.api}/connections`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				provider: "native-moss",
				model: NATIVE_MOSS_MODEL,
			}),
		});
		expect(response.status).toBe(503);
		expect(JSON.stringify(await response.json())).toContain("NATIVE_");
	} finally {
		await f.close();
	}
});

test("production CPU proof has a real fixed-helper path and rejects absent installed source", async () => {
	await expect(
		prepareNativeMossDispatchProof(
			{ personId: "person-1003", inputMode: "reference-img2img" } as Parameters<
				typeof prepareNativeMossDispatchProof
			>[0],
			{
				detailBytes: Buffer.from("{}"),
				ownerBindingHash: "a".repeat(64),
				serverEvidence: { tokenBytes: Buffer.from("{}"), recipientImage: null },
			},
			{ platform: "win32" },
		),
	).rejects.toThrow("NATIVE_SERVER_CONTEXT_UNAVAILABLE");
});

for (const deniedPhase of ["alpha", "finalize", "release"] as const) {
	test(`live registry disconnect blocks native ${deniedPhase} after earlier phase`, async () => {
		const events = new EventEmitter();
		const calls: string[] = [];
		let resume: () => void = () => {};
		const gate = new Promise<void>((resolve) => {
			resume = resolve;
		});
		const f = await workbenchFixture({
			imageBytes: Buffer.from(finishingPngFixture(340, 510).finishedBytes),
			create: (config, options) =>
				createPortal(
					{ ...config, nativeMoss: true },
					{
						...options,
						nativeMossTest: {
							readiness: async () => ({ state: "READY" }),
							dispatchProof: () =>
								({}) as NonNullable<
									Parameters<
										typeof prepareNativeMossDispatchProof
									>[1]["dispatchProof"]
								>,
							// Tests the real server authorization callback; provider phase sequencing
							// itself has separate actual-provider tests, not duplicated here.
							createProvider: () => ({
								readiness: async () => ({
									state: "NOT_READY" as const,
									code: "TEST",
								}),
								reconcile: async (id) => ({
									state: "UNKNOWN" as const,
									code: "TEST",
									requestId: id,
								}),
								execute: async (input, authority, phaseOptions) => {
									const request = input as { requestId: string };
									const handle = {
										requestId: request.requestId,
										nonce: randomUUID(),
										ownerBindingHash: authority.ownerBindingHash,
										envelopeSHA256: "a".repeat(64),
										profileDigest: NATIVE_MOSS_PROFILE_DIGEST,
									};
									await writeFile(
										join(
											f.directory,
											"storage",
											"1",
											"jobs",
											request.requestId,
											"native-dispatch.json",
										),
										JSON.stringify({ handle }),
										{ flag: "wx" },
									);
									for (const phase of [
										"execute",
										"alpha",
										"finalize",
										"release",
									] as const) {
										if (phase === deniedPhase) {
											events.emit("phase");
											await gate;
										}
										await phaseOptions?.authorizeMutation?.(phase, handle);
										calls.push(phase);
									}
									return {
										state: "UNKNOWN" as const,
										code: "TEST",
										requestId: request.requestId,
									};
								},
							}),
						},
					},
				),
		});
		try {
			const headers = await f.session();
			const connected = await fetch(`${f.api}/connections`, {
				method: "POST",
				headers,
				body: JSON.stringify({
					provider: "native-moss",
					model: NATIVE_MOSS_MODEL,
				}),
			});
			const connection = (await connected.json()) as {
				connection: { connectionId: string };
			};
			const reached = once(events, "phase", {
				signal: AbortSignal.timeout(5000),
			});
			const submitted = fetch(`${f.api}/generations`, {
				method: "POST",
				headers,
				body: JSON.stringify({
					schemaVersion: 2,
					requestId: randomUUID(),
					personId: "person-0998",
					connectionId: connection.connection.connectionId,
					provider: "native-moss",
					providerModel: NATIVE_MOSS_MODEL,
					nativeRecipe: "recovery16-native-flow-source045-v1",
					generationProfile: "native340-v1",
					inputMode: "reference-img2img",
					sourceSelection: {
						kind: "selected",
						personId: "person-0998",
						sourceSHA256: f.state.pin,
					},
					explicitEdits: [],
					size: "340x510",
					faceMode: { kind: "unique", variantId: null },
				}),
			});
			await reached;
			expect(
				(
					await fetch(
						`${f.api}/connections/${connection.connection.connectionId}`,
						{ method: "DELETE", headers },
					)
				).status,
			).toBe(200);
			resume();
			const body = (await (await submitted).json()) as {
				job: { state: string };
			};
			expect(body.job.state).toBe("UNKNOWN");
			expect(calls).not.toContain(deniedPhase);
			expect(calls).not.toContain("release");
		} finally {
			resume();
			await f.close();
		}
	});
}

test("Mac server composes actual context builder, fixed transport subprocess and verifier without execute", async () => {
	const directory = await (await import("node:fs/promises")).mkdtemp(
		join((await import("node:os")).tmpdir(), "server-context-"),
	);
	try {
		// Reuse the admitted finite context fixture without importing/running tests.
		// This subprocess is a fake SSH wire endpoint, not remote tokenizer proof.
		const source = await readFile(
			new URL("./native-moss-context.test.ts", import.meta.url),
			"utf8",
		);
		const fixtureSource = source.slice(
			source.indexOf("const json ="),
			source.indexOf('test("real local'),
		);
		const crypto = await import("node:crypto");
		const png = await import("../../portrait/acceptance/src/png.ts");
		const factory = new Function(
			"randomUUID",
			"readFile",
			"encodePng",
			"hash",
			"buildNativeMossContextRequest",
			"NATIVE_MOSS_MODEL",
			"fixtureURL",
			new Bun.Transpiler({ loader: "ts" }).transformSync(
				fixtureSource.replaceAll("import.meta.url", "fixtureURL") +
					"\nreturn fixture();",
			),
		);
		const f = (await factory(
			crypto.randomUUID,
			readFile,
			png.encodePng,
			hash,
			buildNativeMossContextRequest,
			NATIVE_MOSS_MODEL,
			new URL("./native-moss-context.test.ts", import.meta.url).href,
		)) as {
			input: Parameters<typeof prepareNativeMossDispatchProof>[0];
			authority: Parameters<typeof prepareNativeMossDispatchProof>[1];
			response: Record<string, unknown>;
		};
		for (const mode of ["ok", "nonce", "overflow", "drop"]) {
			const log = join(directory, `${mode}.jsonl`);
			const program = `let raw='';process.stdin.on('data',b=>raw+=b);process.stdin.on('end',()=>{const fs=require('fs'),crypto=require('crypto');raw=raw.slice(raw.indexOf('\\n')+1);const r=JSON.parse(raw);fs.appendFileSync(process.argv[1],JSON.stringify(r)+'\\n');if(process.argv[2]==='drop')process.exit(9);const v=JSON.parse(process.argv[3]);for(const k of ['requestId','nonce','ownerBindingHash','requestSHA256','profileDigest','bundleSHA256'])v[k]=r[k];v.contextRequestSHA256=crypto.createHash('sha256').update(raw).digest('hex');if(process.argv[2]==='nonce')v.nonce=crypto.randomUUID();if(process.argv[2]==='overflow'){const c=JSON.parse(Buffer.from(v.contextResponse.byteBase64,'base64'));c.counts[0].tokens=4097;const b=Buffer.from(JSON.stringify(c));v.contextResponse={byteBase64:b.toString('base64'),size:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')}}process.stdout.write(JSON.stringify(v))})`;
			const fixed = createNativeMossTransport({
				executable: process.execPath,
				prefix: ["-e", program, log, mode, JSON.stringify(f.response)],
			});
			const operation = prepareNativeMossDispatchProof(f.input, f.authority, {
				platform: "darwin",
				remoteContext: fixed.preflightContext,
			});
			if (mode === "ok") {
				const proof = await operation;
				expect(proof.snapshotHashes.token).toBe(
					hash(
						(f.authority.serverEvidence as { tokenBytes: Uint8Array })
							.tokenBytes,
					),
				);
			} else await expect(operation).rejects.toThrow();
			const frames = (await readFile(log, "utf8"))
				.trim()
				.split("\n")
				.map((line) => JSON.parse(line));
			expect(frames).toHaveLength(1);
			expect(frames[0].operation).toBe("preflightContext");
		}
	} finally {
		await (await import("node:fs/promises")).rm(directory, {
			recursive: true,
			force: true,
		});
	}
});
