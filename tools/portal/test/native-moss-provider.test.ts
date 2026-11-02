import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { once } from "node:events";
import {
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	realpath,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { encodePng } from "../../portrait/acceptance/src/png.ts";
import {
	NATIVE_MOSS_MODEL,
	NATIVE_MOSS_PROFILE_DIGEST,
} from "../src/native-moss-contract.ts";
import {
	createNativeMossProvider,
	NATIVE_MOSS_PROVIDER_BUNDLE,
	NativeMossAuthorizationError,
	type NativeMossMutationPhase,
	type NativeMossProviderAuthority,
} from "../src/native-moss-provider.ts";
import type { NativeMossResultArtifact } from "../src/native-moss-result.ts";
import {
	createNativeMossTransport,
	type NativeMossTransportResult,
} from "../src/native-moss-transport.ts";
import { referenceGenerationRequestSchema } from "../src/reference-contract.ts";

const hash = (bytes: string | Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
const json = (value: unknown) => Buffer.from(JSON.stringify(value));
type Seams = NonNullable<Parameters<typeof createNativeMossProvider>[1]>;
async function fixture() {
	const root = await realpath(
		await mkdtemp(join(tmpdir(), "native-provider-")),
	);
	const id = randomUUID(),
		dir = join(root, "jobs", id);
	await mkdir(dir, { recursive: true });
	await writeFile(join(dir, "dispatch.lock"), "existing-server-reservation", {
		flag: "wx",
	});
	const original = encodePng({
		width: 2,
		height: 2,
		pixels: new Uint8Array(16).fill(255),
	});
	const detail = json({
		id: "person-1003",
		characterId: "K1003",
		name: "fixture",
	});
	const token = json({
		personId: "person-1003",
		characterId: "K1003",
		name: "fixture",
		identity: { gender: "female" },
		slots: {},
		image: { path: "/portraits/person-1003.png", sha256: hash(original) },
	});
	const request = {
		schemaVersion: 2,
		generationProfile: "native340-v1",
		requestId: id,
		personId: "person-1003",
		provider: "native-moss",
		providerModel: NATIVE_MOSS_MODEL,
		nativeRecipe: "recovery16-native-flow-source045-v1",
		inputMode: "reference-img2img",
		sourceSelection: {
			kind: "selected",
			personId: "person-1003",
			sourceSHA256: hash(original),
		},
		explicitEdits: [],
		size: "340x510",
		faceMode: { kind: "unique", variantId: null },
	};
	const text =
		"seoul dengoku portrait style, preserve the source person, outfit, composition and gaze; change only the drawing style";
	const contextInput = {
		prompts: [{ personId: "person-1003", text }],
		negative: "",
	};
	const inputBytes = json(contextInput),
		responseBytes = json({
			maxTextLength: 4096,
			truncation: false,
			modelLoaded: false,
		});
	const authority: NativeMossProviderAuthority = {
		detailBytes: detail,
		ownerBindingHash: "a".repeat(64),
		dispatchProof: {
			requestSHA256: hash(
				json(referenceGenerationRequestSchema.parse(request)),
			),
			snapshotHashes: {
				detail: hash(detail),
				token: hash(token),
				original: hash(original),
			},
			sourcePins: { fixture: "b".repeat(64) },
			attestation: {
				compiled: { text, fields: [] },
				workerPins: {
					runtime: { sha256: "a".repeat(64), size: 1 },
					lifecycle: { sha256: "b".repeat(64), size: 1 },
				},
				contextInput,
				contextInputBytes: inputBytes,
				contextResponseBytes: responseBytes,
			},
		},
		serverEvidence: {
			status: "available",
			recipient: { personId: "person-1003", characterId: "K1003" },
			tokenBytes: token,
			tokenSHA256: hash(token),
			recipientImage: {
				personId: "person-1003",
				characterId: "K1003",
				sourceSHA256: hash(original),
				bytes: original,
			},
		},
	};
	const calls: string[] = [];
	const permits: NativeMossMutationPhase[] = [];
	let deniedPhase: NativeMossMutationPhase | null = null;
	const options = {
		async authorizeMutation(phase: NativeMossMutationPhase) {
			permits.push(phase);
			if (phase === deniedPhase)
				throw new NativeMossAuthorizationError("CONNECTION_REVOKED");
		},
	};
	let mode = "success",
		verifierCalls = 0;
	let nativeHandle: Parameters<Seams["transport"]["status"]>[0];
	const finalBytes = new Uint8Array([1, 2, 3]);
	const phaseResult = (
		state: "ALPHA_SUBMITTED" | "HOLD" | "RELEASED",
		handle: Parameters<Seams["transport"]["alpha"]>[0],
	): NativeMossTransportResult => ({
		state,
		handle: {
			...handle,
			bundleSHA256:
				"8f52f75bb4fe62ffceb0cadacbeed34c6175bebf8ade9644d1337a3ab94f8218",
		},
		receipt: { finalSHA256: hash(finalBytes) },
	});
	const seams: Seams = {
		async workerBundle() {
			// Snapshot current private files for orchestration only. Production's
			// independently pinned manifest validation is never bypassed.
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
							sha256: hash(bytes),
							size: bytes.length,
						};
					}),
				),
			};
		},
		qualification: () =>
			mode === "unqualified" ? "NATIVE_UPSTREAM_ATTESTATION_MISSING" : null,
		transport: {
			async readiness() {
				calls.push("readiness");
				return { state: "READY", proof: {} };
			},
			async lifecycleReadiness() {
				calls.push("lifecycleReadiness");
				return { state: "LIFECYCLE_READINESS", proof: { ready: true } };
			},
			async execute(bytes) {
				calls.push("execute");
				const retained = JSON.parse(
					await readFile(join(dir, "native-dispatch.json"), "utf8"),
				);
				expect(hash(bytes)).toBe(retained.handle.envelopeSHA256);
				expect(retained.handle.profileDigest).toBe(NATIVE_MOSS_PROFILE_DIGEST);
				const envelope = JSON.parse(Buffer.from(bytes).toString());
				expect(envelope.snapshot.detail.byteBase64).toBe(
					detail.toString("base64"),
				);
				expect(envelope.snapshot.original.sha256).toBe(hash(original));
				expect(
					envelope.bundle.map((entry: { name: string }) => entry.name),
				).toContain("content_v1.py");
				nativeHandle = retained.handle;
				if (mode === "execute-drop")
					return { state: "UNKNOWN", code: "DROP", handle: nativeHandle };
				return {
					state: "NATIVE_COMPLETE_ALPHA_PENDING",
					handle: nativeHandle,
					...(mode === "missing-terminal"
						? {}
						: {
								nativeProcessTerminal: {
									...nativeHandle,
									bundleSHA256: NATIVE_MOSS_PROVIDER_BUNDLE,
									pid: mode === "foreign-terminal" ? 9999 : 1234,
									processStart: "2026-10-21T10:00:00.0000000Z",
									exitCode: 0 as const,
									channelOutcome: "EXIT_OBSERVED" as const,
								},
							}),
					receipt: {
						native: {
							pid: 1234,
							...(mode === "missing-start"
								? {}
								: { processStart: "2026-10-21T10:00:00.0000000Z" }),
							runtimeAttestation: {
								contextInputSHA256:
									mode === "wrong-context" ? "0".repeat(64) : hash(inputBytes),
								contextResponseSHA256: hash(responseBytes),
								compiled: { text, fields: [] },
								retainedSHA256: {
									detail: hash(detail),
									token: hash(token),
									original: hash(original),
								},
							},
							promptSHA256: hash(
								"seoul dengoku portrait style, preserve the source person, outfit, composition and gaze; change only the drawing style",
							),
							contentFieldsSHA256: hash("[]"),
							sourcePins: { fixture: "b".repeat(64) },
						},
					},
				};
			},
			async alpha(handle) {
				calls.push("alpha");
				return mode === "alpha-drop"
					? { state: "UNKNOWN", code: "DROP" }
					: phaseResult("ALPHA_SUBMITTED", handle);
			},
			async finalize(handle) {
				calls.push("finalize");
				return mode === "finalize-drop"
					? { state: "UNKNOWN", code: "DROP" }
					: phaseResult("HOLD", handle);
			},
			async release(handle) {
				calls.push("release");
				expect(verifierCalls).toBeGreaterThan(0);
				return mode === "release-drop"
					? { state: "UNKNOWN", code: "DROP" }
					: phaseResult("RELEASED", handle);
			},
			async reconcile(handle) {
				calls.push("reconcile");
				return phaseResult("HOLD", handle);
			},
			async status(handle) {
				calls.push("status");
				return { state: "UNKNOWN", code: "PENDING", handle };
			},
			async readArtifacts(handle) {
				calls.push("readArtifacts");
				return { state: "ARTIFACTS", handle, receipt: {}, files: [] };
			},
			async lifecycleReadArtifacts(handle) {
				calls.push("lifecycleReadArtifacts");
				return { state: "ARTIFACTS", handle, receipt: {}, files: [] };
			},
		},
		async readback() {
			calls.push("readback");
			return [] as NativeMossResultArtifact[];
		},
		// Orchestration mock only: not native result acceptance or PNG proof.
		verifyResult(expected) {
			calls.push("verify");
			verifierCalls++;
			expect(expected.requestId).toBe(id);
			expect(expected.snapshotHashes.original).toBe(hash(original));
			expect(expected.attestation.contextInputBytes).toBeInstanceOf(Uint8Array);
			expect(hash(expected.attestation.contextResponseBytes)).toBe(
				hash(responseBytes),
			);
			expect(expected.nativeProcessTerminal.channelOutcome).toBe(
				"EXIT_OBSERVED",
			);
			if (!authority.dispatchProof) throw Error("fixture");
			expect(expected.sourcePins).toEqual(authority.dispatchProof.sourcePins);
			if (mode === "bad-result") throw Error("NATIVE_RESULT_MISMATCH");
			return {
				state: "HOLD",
				ownerApproval: "NONE",
				qualityQualified: false,
				mechanicalVerified: true,
				finalBytes,
				finalSHA256: hash(finalBytes),
				recipe: expected.recipe,
				delivery: { status: "PASS" } as ReturnType<
					Seams["verifyResult"]
				>["delivery"],
			};
		},
	};
	const storage = {
		jobDirectory: async (requestId: string) => join(root, "jobs", requestId),
	};
	return {
		id,
		dir,
		request,
		authority,
		calls,
		storage,
		seams,
		provider: (() => {
			const provider = createNativeMossProvider(storage, seams);
			return {
				...provider,
				execute: (input: unknown, source: NativeMossProviderAuthority) =>
					provider.execute(input, source, options),
			};
		})(),
		options,
		permits,
		deny: (phase: NativeMossMutationPhase) => {
			deniedPhase = phase;
		},
		setMode: (value: string) => {
			mode = value;
		},
		cleanup: () => rm(root, { recursive: true, force: true }),
	};
}

test("source authority, edits and token holds reject before any transport call", async () => {
	const f = await fixture();
	try {
		for (const input of [
			{ ...f.request, path: "/caller" },
			{
				...f.request,
				explicitEdits: [
					{
						field: "outfit.upper.color",
						operation: "replace",
						value: "dark blue",
					},
				],
			},
			{
				...f.request,
				sourceSelection: {
					...f.request.sourceSelection,
					sourceSHA256: "0".repeat(64),
				},
			},
		]) {
			expect((await f.provider.execute(input, f.authority)).state).toBe(
				"REJECTED",
			);
		}
		const token = json({
			personId: "person-1003",
			characterId: "K1003",
			name: "fixture",
			identity: {},
			slots: {
				accessories: {
					shape: { value: "pin", source: "pin" },
					color: { value: "gold", source: "watch" },
				},
			},
		});
		const tokenRequest = {
			...f.request,
			inputMode: "token-only",
			nativeRecipe: "recovery16-native-token-v1",
			sourceSelection: {
				kind: "intentional-absence",
				reason: "no-reference-available",
			},
		};
		const authority = {
			...f.authority,
			serverEvidence: {
				...(f.authority.serverEvidence as Record<string, unknown>),
				tokenBytes: token,
				tokenSHA256: hash(token),
				recipientImage: null,
			},
		};
		expect(await f.provider.execute(tokenRequest, authority)).toMatchObject({
			state: "REJECTED",
			code: "NATIVE_CONTENT_HOLD",
		});
		expect(f.calls).toEqual([]);
	} finally {
		await f.cleanup();
	}
});

test("missing upstream execution attestation fails closed before SSH", async () => {
	const f = await fixture();
	try {
		const production = createNativeMossProvider(f.storage, f.seams);
		const missing = { ...f.authority };
		delete missing.dispatchProof;
		expect(
			(await production.execute(f.request, missing, f.options)).state,
		).toBe("NOT_READY");
		f.setMode("unqualified");
		expect((await f.provider.execute(f.request, f.authority)).state).toBe(
			"NOT_READY",
		);
		expect(f.calls).toEqual([]);
		expect(NATIVE_MOSS_PROVIDER_BUNDLE).toBe(
			"8f52f75bb4fe62ffceb0cadacbeed34c6175bebf8ade9644d1337a3ab94f8218",
		);
	} finally {
		await f.cleanup();
	}
});

async function readinessFrame() {
	const bytes = await readFile(
		new URL(
			"../../../.omo/evidence/reference-png-to-image-current/native-moss-readiness-v3.stdout.jsonl",
			import.meta.url,
		),
	);
	expect(hash(bytes)).toBe(
		"0c77a2bb1a050b54ef0959a15efd60b16cb90e72bc99ade0a981944031098619",
	);
	const line = bytes.toString().split("\n")[9];
	if (!line) throw Error("readiness evidence");
	return JSON.parse(line).native;
}

test("production static qualification and actual fake SSH admit one complete bound snapshot", async () => {
	const f = await fixture();
	try {
		const { qualification: _qualification, ...seams } = f.seams;
		const frame = await readinessFrame();
		const log = join(f.dir, "readiness-calls");
		for (const kind of [
			"valid",
			"bundle",
			"lifecycle",
			"model",
			"inventory",
			"queue",
			"competing",
			"source",
			"malformed",
		] as const) {
			const candidate = structuredClone(frame);
			if (kind === "bundle") candidate.bundleSHA256 = "0".repeat(64);
			if (kind === "lifecycle") candidate.lifecycleReadiness.ready = false;
			if (kind === "model")
				Reflect.set(candidate.pins.modelPins, "base", "0".repeat(64));
			if (kind === "inventory")
				candidate.hostReadiness.proof.processInventoryComplete = false;
			if (kind === "queue") candidate.hostReadiness.proof.utilization = 99;
			if (kind === "source") delete candidate.pins.trainerCommit;
			if (kind === "competing") {
				candidate.hostReadiness.proof.processes["99999"] = {
					name: "python.exe",
					start: "2026-10-21T23:00:00.0000000Z",
					startAfter: "2026-10-21T23:00:00.0000000Z",
					command: "training",
					argv: ["python", "train.py"],
				};
				candidate.lifecycleReadiness.proof = candidate.hostReadiness.proof;
			}
			const responsePath = join(f.dir, `response-${kind}.json`);
			await writeFile(
				responsePath,
				kind === "malformed" ? "bad-json" : JSON.stringify(candidate),
			);
			const program = `const fs=require('node:fs');let s='';process.stdin.on('data',b=>s+=b);process.stdin.on('end',()=>{const f=JSON.parse(s.slice(s.indexOf('\\n')+1));fs.appendFileSync(${JSON.stringify(log)},f.operation+'\\n');process.stdout.write(fs.readFileSync(${JSON.stringify(responsePath)}));});`;
			const remote = createNativeMossTransport({
				executable: "bun",
				prefix: ["-e", program, "readiness-fixture"],
				timeoutMs: 5000,
			});
			const provider = createNativeMossProvider(f.storage, {
				...seams,
				transport: { ...f.seams.transport, readiness: remote.readiness },
			});
			const observed = await provider.readiness();
			expect(observed.state, JSON.stringify({ kind, observed })).toBe(
				kind === "valid" ? "READY" : "NOT_READY",
			);
		}
		expect((await readFile(log, "utf8")).trim().split("\n")).toEqual(
			Array(9).fill("readiness"),
		);
		expect(f.calls).toEqual([]);
	} finally {
		await f.cleanup();
	}
});

test("provider and frozen worker agree on closed process proof and exact argv CWD listener families", async () => {
	const f = await fixture();
	try {
		const frame = await readinessFrame();
		const candidates: {
			name: string;
			accepted: boolean;
			frame: typeof frame;
		}[] = [];
		for (const name of [
			"valid",
			"argv0",
			"cwd",
			"listener-parent",
			"unknown-host",
			"unknown-process",
			"unknown-queue",
			"unknown-listener",
			"argv1-quoted",
			"cwd-canonicalized",
			"pid-start",
			"desktop-cwd",
			"unknown-instance",
			"argv-absolute-valid",
			"slash-valid",
		] as const) {
			const candidate = structuredClone(frame),
				p = candidate.hostReadiness.proof;
			const primary = p.provenComfyInstances[0],
				parent = p.provenComfyInstances[1],
				child = p.provenComfyInstances[2];
			const process = p.processes[String(primary.pid)];
			if (name === "argv0") {
				process.argv[0] = "C:/evil/python.exe";
				primary.argv[0] = process.argv[0];
			}
			if (name === "cwd") process.cwd = "D:/wrong";
			if (name === "listener-parent") {
				const listener = p.listeners.find(
					(row: { port: number }) => row.port === 8189,
				);
				listener.pid = parent.pid;
				listener.processStart = parent.processStart;
			}
			if (name === "unknown-host") p.extra = true;
			if (name === "unknown-process") process.extra = true;
			if (name === "unknown-queue") p.queues["8188"].extra = true;
			if (name === "unknown-listener") p.listeners[0].extra = true;
			if (name === "argv1-quoted") {
				process.argv[1] = '"main.py"';
				primary.argv[1] = process.argv[1];
			}
			if (name === "cwd-canonicalized")
				process.cwd = "D:/AI/environments/PNGAL/ComfyUI-pngal-0.28.0/.";
			if (name === "pid-start")
				process.startAfter = "2026-10-21T00:00:00.0000000Z";
			if (name === "desktop-cwd")
				p.processes[String(child.pid)].cwd = "D:/wrong";
			if (name === "unknown-instance") primary.extra = true;
			if (name === "argv-absolute-valid") {
				process.argv[1] = process.scriptPath;
				primary.argv[1] = process.scriptPath;
			}
			if (name === "slash-valid") {
				process.cwd = process.cwd.replaceAll("\\", "/");
				process.executable = process.executable.replaceAll("\\", "/");
				primary.executable = process.executable;
			}
			candidate.lifecycleReadiness.proof = p;
			candidates.push({
				name,
				accepted: ["valid", "argv-absolute-valid", "slash-valid"].includes(
					name,
				),
				frame: candidate,
			});
		}
		const source = await readFile(
			new URL("../native-moss/newhost-proof.py", import.meta.url),
		);
		expect(hash(source)).toBe(
			"909854b65345b3644cc7efc2afaa8e4c6817a72b26e8e30097869640377fb71d",
		);
		const oracle = `import ast,json,re,sys,types,hashlib\nv=json.loads(sys.stdin.buffer.read());b=bytes.fromhex(v['source']);assert hashlib.sha256(b).hexdigest()=='909854b65345b3644cc7efc2afaa8e4c6817a72b26e8e30097869640377fb71d';t=ast.parse(b);names={'norm','process_record','proven_comfy','validate_process_proof'};constants={'COMFY_ROOT','COMFY_PYTHON','COMFY_SCRIPT','COMFY_ARGS','COMFY_MAIN_SHA','DESKTOP_ROOT','DESKTOP_CWD','DESKTOP_PARENT','DESKTOP_CHILD','DESKTOP_ARGV','DESKTOP_SCRIPT','DESKTOP_MAIN_SHA','DESKTOP_APP','START'};nodes=[n for n in t.body if isinstance(n,ast.FunctionDef) and n.name in names or isinstance(n,ast.Assign) and any(isinstance(x,ast.Name) and x.id in constants for x in n.targets)];\ndef require(c,m):\n if not c: raise ValueError(m)\ndef closed(v,k): require(type(v) is dict and set(v)==set(k.split()),'NATIVE_FIELDS')\nn={'re':re,'Any':object,'job':types.SimpleNamespace(require=require,closed=closed)};exec(compile(ast.Module(body=nodes,type_ignores=[]),'<frozen-host-proof>','exec'),n);out=[]\nfor p in v['proofs']:\n try: n['validate_process_proof'](p);out.append(True)\n except (ValueError,KeyError,TypeError,AttributeError): out.append(False)\nassert not any(x in sys.modules for x in ('torch','transformers','toolkit'));print(json.dumps(out))`;
		const python = spawn("python3", ["-I", "-B", "-c", oracle], {
			stdio: ["pipe", "pipe", "pipe"],
		});
		const closed = once(python, "close", {
			signal: AbortSignal.timeout(10000),
		});
		let stdout = "",
			stderr = "";
		python.stdout.on("data", (b) => {
			stdout += b;
		});
		python.stderr.on("data", (b) => {
			stderr += b;
		});
		python.stdin.end(
			JSON.stringify({
				source: source.toString("hex"),
				proofs: candidates.map((row) => row.frame.hostReadiness.proof),
			}),
		);
		expect((await closed)[0], stderr).toBe(0);
		expect(stderr).toBe("");
		const worker: boolean[] = JSON.parse(stdout);
		expect(worker).toEqual(candidates.map((row) => row.accepted));
		const { qualification: _qualification, ...seams } = f.seams;
		const log = join(f.dir, "parity-calls");
		for (const [index, candidate] of candidates.entries()) {
			const path = join(f.dir, `parity-${index}.json`);
			await writeFile(path, JSON.stringify(candidate.frame));
			const program = `const fs=require('node:fs');let s='';process.stdin.on('data',b=>s+=b);process.stdin.on('end',()=>{const q=JSON.parse(s.slice(s.indexOf('\\n')+1));fs.appendFileSync(${JSON.stringify(log)},q.operation+'\\n');process.stdout.write(fs.readFileSync(${JSON.stringify(path)}));});`;
			const remote = createNativeMossTransport({
				executable: "bun",
				prefix: ["-e", program, "parity-fixture"],
				timeoutMs: 5000,
			});
			const provider = createNativeMossProvider(f.storage, {
				...seams,
				transport: { ...f.seams.transport, readiness: remote.readiness },
			});
			expect(
				(await provider.readiness()).state === "READY",
				candidate.name,
			).toBe(worker[index] ?? false);
		}
		expect((await readFile(log, "utf8")).trim().split("\n")).toEqual(
			candidates.map(() => "readiness"),
		);
		expect(f.calls).toEqual([]);
	} finally {
		await f.cleanup();
	}
});

test("missing server-owned proof or actual lifecycle collector never dispatches", async () => {
	const f = await fixture();
	try {
		const missing = { ...f.authority };
		delete missing.dispatchProof;
		expect(await f.provider.execute(f.request, missing)).toMatchObject({
			state: "NOT_READY",
			code: "NATIVE_SERVER_ATTESTATION_MISSING",
		});
		const wrong = structuredClone(f.authority);
		if (!wrong.dispatchProof) throw Error("fixture");
		wrong.dispatchProof.requestSHA256 = "0".repeat(64);
		expect((await f.provider.execute(f.request, wrong)).state).toBe(
			"NOT_READY",
		);
		const noCollector = { ...f.seams.transport };
		delete noCollector.lifecycleReadArtifacts;
		expect(
			await createNativeMossProvider(f.storage, {
				...f.seams,
				transport: noCollector,
			}).execute(f.request, f.authority, f.options),
		).toMatchObject({
			state: "NOT_READY",
			code: "NATIVE_LIFECYCLE_ARTIFACTS_UNAVAILABLE",
		});
		expect(f.calls).toEqual([]);
	} finally {
		await f.cleanup();
	}
});

test("durable intent precedes native execute; verified orchestration releases only after mock verifier", async () => {
	const f = await fixture();
	try {
		const outcome = await f.provider.execute(f.request, f.authority);
		expect(outcome, JSON.stringify(f.calls)).toMatchObject({
			state: "HOLD",
			ownerApproval: "NONE",
			qualityQualified: false,
		});
		expect(f.calls).toEqual([
			"readiness",
			"lifecycleReadiness",
			"execute",
			"alpha",
			"finalize",
			"lifecycleReadArtifacts",
			"readback",
			"verify",
			"release",
		]);
		const retained = JSON.parse(
			await readFile(join(f.dir, "native-dispatch.json"), "utf8"),
		);
		expect(retained.handle.nonce).toMatch(/^[a-f0-9-]{36}$/);
		const before = f.calls.length;
		expect(
			(
				await createNativeMossProvider(f.storage, f.seams).execute(
					f.request,
					f.authority,
					f.options,
				)
			).state,
		).toBe("UNKNOWN");
		expect(f.calls).toHaveLength(before);
		expect(
			await f.provider.execute(
				{ ...f.request, nativeRecipe: "recovery16-native-flow-source025-v1" },
				f.authority,
			),
		).toMatchObject({ state: "REJECTED", code: "NATIVE_REQUEST_CONFLICT" });
		expect(f.calls).toHaveLength(before);
	} finally {
		await f.cleanup();
	}
});

test("competing same UUID attempts share the existing reservation and execute only once", async () => {
	const f = await fixture();
	try {
		const outcomes = await Promise.all([
			f.provider.execute(f.request, f.authority),
			createNativeMossProvider(f.storage, f.seams).execute(
				f.request,
				f.authority,
				f.options,
			),
		]);
		expect(outcomes.map((entry) => entry.state).sort()).toEqual([
			"HOLD",
			"UNKNOWN",
		]);
		expect(f.calls.filter((call) => call === "execute")).toHaveLength(1);
		expect(f.calls.filter((call) => call === "release")).toHaveLength(1);
	} finally {
		await f.cleanup();
	}
});

test("bundle identity update, hash drift and missing manifest stay NOT_READY with validated UUID", async () => {
	const f = await fixture();
	try {
		const dependency = join(f.dir, "bundle-fixture");
		await mkdir(dependency);
		const raw = Buffer.from("pinned fixture source\n");
		const pins = { "fixture.py": { sha256: hash(raw), size: raw.length } };
		const expectedSHA256 = hash(JSON.stringify(pins));
		const manifest = {
			schema: "native-moss-bundle.v1",
			implementationSHA256: expectedSHA256,
			profileDigest: NATIVE_MOSS_PROFILE_DIGEST,
			files: pins,
		};
		const provider = createNativeMossProvider(f.storage, {
			...f.seams,
			bundleSource: { root: pathToFileURL(`${dependency}/`), expectedSHA256 },
		});
		for (const [kind, code] of [
			["missing", "NATIVE_BUNDLE_MISSING"],
			["update", "NATIVE_BUNDLE_CONTRACT_MISMATCH"],
			["hash", "NATIVE_BUNDLE_CHANGED"],
			["profile", "NATIVE_BUNDLE_CONTRACT_MISMATCH"],
		] as const) {
			if (kind !== "missing") {
				await writeFile(
					join(dependency, "manifest.json"),
					JSON.stringify({
						...manifest,
						...(kind === "update"
							? { implementationSHA256: "f".repeat(64) }
							: {}),
						...(kind === "profile" ? { profileDigest: "e".repeat(64) } : {}),
					}),
				);
				await writeFile(
					join(dependency, "fixture.py"),
					kind === "hash" ? Buffer.from("changed source") : raw,
				);
			}
			expect(await provider.execute(f.request, f.authority, f.options)).toEqual(
				{
					state: "NOT_READY",
					code,
					requestId: f.id,
				},
			);
			expect(f.calls).toEqual([]);
			expect((await readdir(f.dir)).sort()).toEqual([
				"bundle-fixture",
				"dispatch.lock",
			]);
		}
	} finally {
		await f.cleanup();
	}
});

test("retained attempt remains read-only replay when current bundle manifest disappears", async () => {
	const f = await fixture();
	try {
		f.setMode("execute-drop");
		expect((await f.provider.execute(f.request, f.authority)).state).toBe(
			"UNKNOWN",
		);
		const before = f.calls.length;
		const provider = createNativeMossProvider(f.storage, {
			...f.seams,
			bundleSource: {
				root: pathToFileURL(`${f.dir}/missing-bundle/`),
				expectedSHA256: "f".repeat(64),
			},
		});
		expect(await provider.execute(f.request, f.authority, f.options)).toEqual({
			state: "UNKNOWN",
			code: "NATIVE_ALREADY_ATTEMPTED",
			requestId: f.id,
		});
		expect(f.calls).toHaveLength(before);
		expect(
			await provider.execute(
				{ ...f.request, nativeRecipe: "recovery16-native-flow-source025-v1" },
				f.authority,
				f.options,
			),
		).toEqual({
			state: "REJECTED",
			code: "NATIVE_REQUEST_CONFLICT",
			requestId: f.id,
		});
		expect(f.calls).toHaveLength(before);
	} finally {
		await f.cleanup();
	}
});

for (const phase of ["execute", "alpha", "finalize", "release"] as const) {
	test(`revocation before ${phase} blocks exactly that mutation without cleanup release`, async () => {
		const f = await fixture();
		try {
			f.deny(phase);
			expect(await f.provider.execute(f.request, f.authority)).toMatchObject({
				state: phase === "execute" ? "REJECTED" : "UNKNOWN",
				code: "CONNECTION_REVOKED",
			});
			expect(f.calls).not.toContain(phase);
			if (phase !== "release") expect(f.calls).not.toContain("release");
			expect(f.permits.at(-1)).toBe(phase);
			const before = f.permits.length;
			expect((await f.provider.execute(f.request, f.authority)).state).toBe(
				"UNKNOWN",
			);
			await f.provider.reconcile(f.id, f.authority.ownerBindingHash);
			expect(f.permits).toHaveLength(before);
		} finally {
			await f.cleanup();
		}
	});
}

for (const failure of [
	"execute-drop",
	"alpha-drop",
	"finalize-drop",
	"missing-start",
	"missing-terminal",
	"foreign-terminal",
	"wrong-context",
	"release-drop",
	"bad-result",
]) {
	test(`${failure} remains durable UNKNOWN without mutation replay or release`, async () => {
		const f = await fixture();
		try {
			f.setMode(failure);
			expect((await f.provider.execute(f.request, f.authority)).state).toBe(
				"UNKNOWN",
			);
			if (failure !== "release-drop") expect(f.calls).not.toContain("release");
			const before = f.calls.length;
			expect(
				(
					await createNativeMossProvider(f.storage, f.seams).execute(
						f.request,
						f.authority,
						f.options,
					)
				).state,
			).toBe("UNKNOWN");
			expect(f.calls).toHaveLength(before);
			await f.provider.reconcile(f.id, f.authority.ownerBindingHash);
			expect(
				f.calls.filter((call) =>
					["execute", "alpha", "finalize", "release"].includes(call),
				),
			).toEqual(
				f.calls
					.slice(0, before)
					.filter((call) =>
						["execute", "alpha", "finalize", "release"].includes(call),
					),
			);
		} finally {
			await f.cleanup();
		}
	});
}
