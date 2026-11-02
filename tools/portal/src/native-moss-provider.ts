import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { lstat, open, readFile, realpath } from "node:fs/promises";
import { basename, join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import {
	NATIVE_MOSS_MODEL,
	NATIVE_MOSS_PROFILE_DIGEST,
	nativeMossProfile,
} from "./native-moss-contract.ts";
import { nativeMossPackageRoot } from "./native-moss-package.ts";
import {
	NATIVE_MOSS_RESULT_BUNDLE,
	type NativeMossResultArtifact,
	type NativeMossResultExpected,
	verifyNativeMossResult,
} from "./native-moss-result.ts";
import {
	type NativeMossObservedNative,
	type NativeMossStageRecord,
	type NativeMossTransportOptions,
	type NativeMossTransportResult,
	type NativeProcessTerminal,
	transport,
} from "./native-moss-transport.ts";
import {
	referenceGenerationRequestSchema,
	resolveReferenceSource,
} from "./reference-contract.ts";
import { transformReferencePng } from "./reference-transform.ts";

// Worker identity, not an assertion that the installed host or result verifier
// accepts this bundle. Those independent contracts must agree before dispatch.
export const NATIVE_MOSS_PROVIDER_BUNDLE =
	"8f52f75bb4fe62ffceb0cadacbeed34c6175bebf8ade9644d1337a3ab94f8218";
const transportBundle =
	"8f52f75bb4fe62ffceb0cadacbeed34c6175bebf8ade9644d1337a3ab94f8218";
const hash = (bytes: string | Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
const sha = z.string().regex(/^[a-f0-9]{64}$/);
const identity = z.strictObject({
	requestId: z.uuid(),
	nonce: z.uuid(),
	ownerBindingHash: sha,
	envelopeSHA256: sha,
	profileDigest: z.literal(NATIVE_MOSS_PROFILE_DIGEST),
});
const lifecycle = identity.extend({
	bundleSHA256: sha,
	ownerPid: z.number().int().positive().safe(),
	ownerStart: z.string().min(1).max(256),
});
const processTerminalSchema = identity.extend({
	bundleSHA256: z.literal(NATIVE_MOSS_PROVIDER_BUNDLE),
	pid: z.number().int().positive().safe(),
	processStart: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{7}Z$/),
	exitCode: z.literal(0),
	channelOutcome: z.literal("EXIT_OBSERVED"),
});
const stagePhases = ["INTENT", "RESERVED", "UPLOADED", "VERIFIED", "LAUNCHING", "OBSERVED", "CLEANED", "RETAINED"] as const;
const stageSchema = identity.extend({ bundleSHA256: z.literal(NATIVE_MOSS_PROVIDER_BUNDLE), stageNonce: z.uuid(), path: z.string(), frameSHA256: sha, size: z.number().int().positive().max(32 * 1024 * 1024), phase: z.enum(stagePhases) });
const intentSchema = z.strictObject({
	schema: z.literal("native-moss-dispatch-intent.v1"),
	requestSHA256: sha,
	snapshotSHA256: sha,
	handle: identity,
	envelope: z.string(),
});
type Intent = z.infer<typeof intentSchema>;
export type NativeMossProviderAuthority = {
	serverEvidence: unknown;
	detailBytes: Uint8Array;
	ownerBindingHash: string;
	// Authenticated server-retained independent CPU preflight, never public input
	// or an expected value reconstructed from the execute response.
	dispatchProof?: {
		requestSHA256: string;
		snapshotHashes: NativeMossResultExpected["snapshotHashes"];
		attestation: NativeMossResultExpected["attestation"];
		sourcePins: Record<string, string>;
	};
};
export type NativeMossProviderResult =
	| {
			state: "NOT_READY" | "REJECTED" | "UNKNOWN";
			code: string;
			requestId: string;
	  }
	| {
			state: "HOLD";
			requestId: string;
			ownerApproval: "NONE";
			qualityQualified: false;
			finalBytes: Uint8Array;
			finalSHA256: string;
	  };
export type NativeMossMutationPhase =
	| "execute"
	| "alpha"
	| "finalize"
	| "release";
export type NativeMossMutationAuthorization = (
	phase: NativeMossMutationPhase,
	handle: z.infer<typeof identity> | z.infer<typeof lifecycle>,
) => Promise<void>;
type Options = {
	signal?: AbortSignal;
	authorizeMutation?: NativeMossMutationAuthorization;
};
export type NativeMossDispatchOptions = Options & {
	authorizeMutation: NativeMossMutationAuthorization;
};
export class NativeMossAuthorizationError extends Error {
	constructor(readonly code = "NATIVE_MUTATION_NOT_AUTHORIZED") {
		super(code);
	}
}
async function authorize(
	options: Options,
	phase: NativeMossMutationPhase,
	handle: z.infer<typeof identity> | z.infer<typeof lifecycle>,
) {
	if (!options.authorizeMutation)
		throw new NativeMossAuthorizationError(
			"NATIVE_MUTATION_AUTHORIZATION_REQUIRED",
		);
	try {
		await options.authorizeMutation(phase, handle);
	} catch (error) {
		if (error instanceof NativeMossAuthorizationError) throw error;
		throw new NativeMossAuthorizationError();
	}
}
type NativeMossLifecycleHandle = z.infer<typeof lifecycle>;
type Transport = Pick<
	typeof transport,
	"readiness" | "lifecycleReadiness" | "execute" | "status" | "readArtifacts"
> &
	Record<
		"alpha" | "finalize" | "reconcile" | "release",
		(
			handle: NativeMossLifecycleHandle,
			options?: Options,
		) => Promise<NativeMossTransportResult>
	> & {
		lifecycleReadArtifacts?: (
			handle: NativeMossLifecycleHandle,
			options?: Options,
		) => Promise<unknown>;
	};
type Verified = ReturnType<typeof verifyNativeMossResult>;
type TestSeams = {
	transport: Transport;
	workerBundle: () => Promise<Bundle>;
	bundleSource?: { root: URL; expectedSHA256: string };
	qualification?: () => string | null;
	readback: (
		handle: NativeMossLifecycleHandle,
	) => Promise<readonly NativeMossResultArtifact[]>;
	verifyResult: typeof verifyNativeMossResult;
};
type Bundle = {
	files: { name: string; byteBase64: string; sha256: string; size: number }[];
};

class BundleUnavailable extends Error {
	constructor(readonly code: string) {
		super(code);
	}
}
async function bundle(
	source = {
		root: nativeMossPackageRoot(import.meta.url),
		expectedSHA256: NATIVE_MOSS_PROVIDER_BUNDLE,
	},
): Promise<Bundle> {
	try {
		const manifest = z
			.strictObject({
				schema: z.literal("native-moss-bundle.v1"),
				implementationSHA256: z.literal(source.expectedSHA256),
				profileDigest: z.literal(NATIVE_MOSS_PROFILE_DIGEST),
				files: z.record(
					z.string(),
					z.strictObject({ sha256: sha, size: z.number().int().positive() }),
				),
			})
			.parse(
				JSON.parse(
					await readFile(new URL("manifest.json", source.root), "utf8"),
				),
			);
		const sorted = Object.fromEntries(
			Object.entries(manifest.files).sort(([a], [b]) =>
				a < b ? -1 : a > b ? 1 : 0,
			),
		);
		if (hash(JSON.stringify(sorted)) !== manifest.implementationSHA256)
			throw new BundleUnavailable("NATIVE_BUNDLE_CHANGED");
		const files: Bundle["files"] = [];
		for (const [name, pin] of Object.entries(sorted)) {
			if (!/^[a-zA-Z0-9_-]+\.(py|ts)$/.test(name))
				throw new BundleUnavailable("NATIVE_BUNDLE_NAME");
			const bytes = await readFile(new URL(name, source.root));
			if (bytes.length !== pin.size || hash(bytes) !== pin.sha256)
				throw new BundleUnavailable("NATIVE_BUNDLE_CHANGED");
			files.push({ name, byteBase64: bytes.toString("base64"), ...pin });
		}
		return { files };
	} catch (error) {
		if (error instanceof BundleUnavailable) throw error;
		if (error instanceof z.ZodError || error instanceof SyntaxError)
			throw new BundleUnavailable("NATIVE_BUNDLE_CONTRACT_MISMATCH");
		if (error instanceof Error && "code" in error) {
			if (error.code === "ENOENT")
				throw new BundleUnavailable("NATIVE_BUNDLE_MISSING");
			if (error.code === "EACCES" || error.code === "EPERM")
				throw new BundleUnavailable("NATIVE_BUNDLE_ACCESS_DENIED");
		}
		throw error;
	}
}

// Reuse the actual hash-verified Python compiler; no second TS allowlist/compiler.
async function compileToken(token: unknown, files: Bundle["files"]) {
	const source = files.find((file) => file.name === "content_v1.py");
	if (!source) throw Error("NATIVE_CONTENT_HELPER_MISSING");
	const code =
		"import sys,json,base64,hashlib\nv=json.loads(sys.stdin.buffer.read(4194304));b=base64.b64decode(v['source']);assert hashlib.sha256(b).hexdigest()==v['sha'];n={};exec(compile(b,'<pinned-native-content>','exec'),n);print(json.dumps(n['compile_content'](v['token']),ensure_ascii=False))";
	const output = await new Promise<string>((resolve, reject) => {
		const child = spawn("python3", ["-I", "-B", "-c", code], {
			stdio: ["pipe", "pipe", "pipe"],
		});
		let text = "",
			failed = false;
		const timer = setTimeout(() => {
			failed = true;
			child.kill("SIGKILL");
		}, 10000);
		child.stdout.on("data", (chunk: Buffer) => {
			text += chunk.toString("utf8");
			if (Buffer.byteLength(text) > 4 * 1024 * 1024) {
				failed = true;
				child.kill("SIGKILL");
			}
		});
		child.stderr.resume();
		child.stdin.on("error", () => {
			failed = true;
			child.kill("SIGKILL");
		});
		child.on("error", () => {
			failed = true;
		});
		child.once("close", (exit) => {
			clearTimeout(timer);
			if (failed || exit !== 0) reject(Error("NATIVE_CONTENT_UNAVAILABLE"));
			else resolve(text);
		});
		child.stdin.end(
			JSON.stringify({ source: source.byteBase64, sha: source.sha256, token }),
		);
	});
	const compiled = z
		.object({
			text: z.string(),
			promptSHA256: sha,
			fields: z.array(z.unknown()),
			holds: z.array(z.unknown()),
		})
		.parse(JSON.parse(output));
	if (compiled.holds.length || compiled.text.includes("--"))
		throw Error("NATIVE_CONTENT_HOLD");
	return compiled;
}

async function readOptional(path: string) {
	try {
		return await readFile(path, "utf8");
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT")
			return null;
		throw error;
	}
}
async function exclusive(path: string, value: unknown) {
	const file = await open(path, "wx", 0o600);
	try {
		await file.writeFile(JSON.stringify(value));
		await file.sync();
	} finally {
		await file.close();
	}
	const parent = await open(join(path, ".."), "r");
	try {
		await parent.sync();
	} finally {
		await parent.close();
	}
}
const result = (
	state: "NOT_READY" | "REJECTED" | "UNKNOWN",
	code: string,
	requestId: string,
): NativeMossProviderResult => ({ state, code, requestId });

function validateReadiness(value: Record<string, unknown>) {
	const requireProof = (condition: unknown, code: string) => {
		if (!condition) throw Error(code);
	};
	const object = (input: unknown) =>
		z.record(z.string(), z.unknown()).parse(input);
	const norm = (path: unknown) =>
		typeof path === "string" ? path.replaceAll("\\", "/") : path;
	requireProof(
		value["schema"] === "native-moss-readiness.v1" &&
			value["ready"] === true &&
			value["reason"] === null &&
			value["profileDigest"] === NATIVE_MOSS_PROFILE_DIGEST &&
			value["bundleSHA256"] === NATIVE_MOSS_PROVIDER_BUNDLE &&
			value["modelLoaded"] === false &&
			value["generationDispatched"] === false,
		"NATIVE_READINESS_BINDING",
	);
	const roots = object(value["roots"]),
		pins = object(value["pins"]),
		dependencies = object(value["dependencies"]);
	requireProof(
		norm(roots["canonicalRoot"]) ===
			"D:/AI/environments/PNGAL/training/recovery16-workbench-jobs-v1" &&
			norm(roots["workerRoot"]) ===
				"D:/AI/environments/PNGAL/training/recovery16-workbench-worker-v1" &&
			roots["aclProtected"] === true,
		"NATIVE_PRIVATE_ROOT_PROOF",
	);
	requireProof(
		pins["trainerCommit"] === nativeMossProfile.trainerCommit &&
			pins["adapterSHA256"] === nativeMossProfile.adapterSHA256 &&
			pins["terminalReceiptSHA256"] ===
				nativeMossProfile.terminalReceiptSHA256 &&
			isDeepStrictEqual(pins["modelPins"], {
				base: nativeMossProfile.baseSHA256,
				encoder: nativeMossProfile.encoderSHA256,
				vae: nativeMossProfile.vaeSHA256,
			}),
		"NATIVE_INSTALLED_PIN",
	);
	requireProof(
		isDeepStrictEqual(pins["tokenizerPins"], {
			"tokenizer.json":
				"06b9509352d2af50381ab2247e083b80d32d5c0aba91c272ca9ff729b6a0e523",
			"tokenizer_config.json":
				"bee8eba30f0eb4af73c0fe2cd06d0f89b657d7819941c438157ec42f7c80ea87",
			"chat_template.jinja":
				"a4aee8afcf2e0711942cf848899be66016f8d14a889ff9ede07bca099c28f715",
		}),
		"NATIVE_TOKENIZER_PIN",
	);
	requireProof(
		dependencies["offlineTokenizer"] === true &&
			dependencies["modelLoaded"] === false &&
			typeof dependencies["torchImported"] === "boolean" &&
			Number.isInteger(dependencies["tokens"]) &&
			Number(dependencies["tokens"]) > 0 &&
			Number(dependencies["tokens"]) <= 4096,
		"NATIVE_DEPENDENCY_PROOF",
	);
	const host = object(value["hostReadiness"]),
		phase = object(value["lifecycleReadiness"]),
		proof = object(host["proof"]);
	requireProof(
		host["ready"] === true &&
			phase["schema"] === "native-moss-lifecycle-readiness.v1" &&
			phase["ready"] === true &&
			phase["modelLoaded"] === false &&
			phase["generationDispatched"] === false &&
			isDeepStrictEqual(phase["proof"], proof),
		"NATIVE_LIFECYCLE_PROOF",
	);
	requireProof(
		proof["schema"] === "native-moss-host-process-proof.v2" &&
			proof["processInventoryComplete"] === true,
		"NATIVE_PROCESS_INVENTORY",
	);
	requireProof(
		Number.isInteger(proof["freeMiB"]) &&
			Number(proof["freeMiB"]) >= 8192 &&
			Number.isInteger(proof["utilization"]) &&
			Number(proof["utilization"]) >= 0 &&
			Number(proof["utilization"]) <= 5,
		"NATIVE_GPU_NOT_IDLE",
	);
	// Mirrors frozen newhost-proof.py validate_process_proof/proven_comfy.
	// Keep this boundary closed; the differential test executes that exact AST.
	const start = z
		.string()
		.length(28)
		.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{7}Z$/);
	const processSchema = z.strictObject({
		name: z.string(),
		start,
		parentPid: z.number().int(),
		command: z.unknown(),
		executable: z.unknown(),
		argv: z.unknown(),
		cwd: z.unknown(),
		cwdResolved: z.unknown(),
		scriptPath: z.unknown(),
		scriptSHA256: z.unknown(),
		startAfter: start,
	});
	const queueSchema = z.strictObject({
		queue_running: z.array(z.unknown()),
		queue_pending: z.array(z.unknown()),
	});
	const listenerSchema = z.strictObject({
		pid: z.number().int(),
		processStart: z.unknown(),
		address: z.unknown(),
		port: z.number().int(),
	});
	const hostSchema = z.strictObject({
		schema: z.literal("native-moss-host-process-proof.v2"),
		processInventoryComplete: z.literal(true),
		processes: z.record(z.string().regex(/^\d+$/), processSchema),
		listeners: z.array(listenerSchema),
		freeMiB: z.number().int().nonnegative(),
		utilization: z.number().int().min(0).max(100),
		queue: queueSchema,
		queues: z.strictObject({ "8188": queueSchema, "8189": queueSchema }),
		systemStats: z.strictObject({
			"8188": z.strictObject({ pid: z.unknown(), argv: z.array(z.string()) }),
		}),
		provenComfyInstances: z.unknown(),
	});
	const observed = hostSchema.parse(proof);
	const closedKeys = (value: Record<string, unknown>, keys: string) =>
		requireProof(
			isDeepStrictEqual(Object.keys(value).sort(), keys.split(" ").sort()),
			"NATIVE_FIELDS",
		);
	for (const process of Object.values(object(proof["processes"])))
		closedKeys(
			object(process),
			"name start parentPid command executable argv cwd cwdResolved scriptPath scriptSHA256 startAfter",
		);
	for (const listener of z
		.array(z.record(z.string(), z.unknown()))
		.parse(proof["listeners"]))
		closedKeys(listener, "pid processStart address port");
	const processes = observed.processes,
		listeners = observed.listeners;
	for (const process of Object.values(processes))
		requireProof(
			process.startAfter === process.start,
			"NATIVE_PROCESS_INVENTORY",
		);
	for (const listener of listeners)
		requireProof(
			processes[String(listener.pid)] !== undefined &&
				listener.processStart === processes[String(listener.pid)]?.start,
			"NATIVE_COMFY_PID_REUSED",
		);
	const primary = listeners.filter(
		(row) => row.port === 8188 && row.address === "127.0.0.1",
	);
	const desktop = listeners.filter((row) => row.port === 8189);
	requireProof(
		primary.length === 1 &&
			desktop.length === 2 &&
			new Set(desktop.map((row) => row.address)).size === 2 &&
			desktop.some((row) => row.address === "0.0.0.0") &&
			desktop.some((row) => row.address === "::") &&
			new Set(desktop.map((row) => row.pid)).size === 1 &&
			listeners.length === 3,
		"NATIVE_COMFY_LISTENER",
	);
	const fixedPid = primary[0]?.pid,
		childPid = desktop[0]?.pid;
	if (fixedPid === undefined || childPid === undefined)
		throw Error("NATIVE_COMFY_LISTENER");
	const fixed = processes[String(fixedPid)],
		child = processes[String(childPid)];
	if (!fixed || !child) throw Error("NATIVE_COMFY_PROCESS");
	const primaryRoot = "D:/AI/environments/PNGAL/ComfyUI-pngal-0.28.0";
	const primaryPython = primaryRoot + "/venv/Scripts/python.exe",
		primaryScript = primaryRoot + "/main.py";
	const args = z.array(z.string()).length(6).parse(fixed.argv);
	requireProof(
		fixed.name.toLowerCase() === "python.exe" &&
			norm(fixed.executable) === primaryPython &&
			norm(args[0]) === primaryPython &&
			["main.py", primaryScript].includes(String(norm(args[1]))) &&
			isDeepStrictEqual(args.slice(2), [
				"--listen",
				"127.0.0.1",
				"--port",
				"8188",
			]) &&
			norm(fixed.cwd) === primaryRoot &&
			norm(fixed.cwdResolved) === primaryRoot &&
			norm(fixed.scriptPath) === primaryScript &&
			fixed.scriptSHA256 ===
				"226a90fdd2cb0942c587e60ae292cddcebd8f6173224e3b91a80ab0efafa93ef",
		"NATIVE_COMFY_PROCESS",
	);
	const parentPid = child.parentPid,
		parent = processes[String(parentPid)];
	if (!parent) throw Error("NATIVE_DESKTOP_ANCESTRY");
	const app = processes[String(parent.parentPid)];
	requireProof(
		app &&
			norm(app.executable) ===
				"C:/Users/oliver/AppData/Local/Programs/ComfyUI/Comfy Desktop/Comfy Desktop.exe" &&
			app.name === "Comfy Desktop.exe" &&
			app.start < parent.start &&
			parent.start < child.start &&
			childPid !== fixedPid,
		"NATIVE_DESKTOP_ANCESTRY",
	);
	const desktopArgs = [
		"E:/Comfy-Desktop/ComfyUI/ComfyUI/.venv/Scripts/python.exe",
		"-s",
		"ComfyUI/main.py",
		"--feature-flag",
		"show_signin_button=true",
		"--feature-flag",
		"enable_telemetry=true",
		"--enable-assets",
		"--enable-manager",
		"--listen",
		"--port",
		"8189",
		"--extra-model-paths-config",
		"C:/Users/oliver/AppData/Roaming/Comfy Desktop/instance-model-paths/inst-1783870996011.yaml",
	];
	for (const [process, executable] of [
		[parent, "D:/AI/Comfy-Desktop/ComfyUI/ComfyUI/.venv/Scripts/python.exe"],
		[child, "D:/AI/Comfy-Desktop/ComfyUI/standalone-env/python.exe"],
	] as const)
		requireProof(
			process.name.toLowerCase() === "python.exe" &&
				norm(process.executable) === executable &&
				isDeepStrictEqual(
					z.array(z.string()).parse(process.argv).map(norm),
					desktopArgs,
				) &&
				norm(process.cwd) === "E:/Comfy-Desktop/ComfyUI" &&
				norm(process.cwdResolved) === "D:/AI/Comfy-Desktop/ComfyUI" &&
				norm(process.scriptPath) ===
					"D:/AI/Comfy-Desktop/ComfyUI/ComfyUI/main.py" &&
				process.scriptSHA256 ===
					"a25ef1dbc7159b79fbf1e596e2c901322d6248681020e520ea5b7f84f4f2dbec",
			"NATIVE_DESKTOP_PROCESS",
		);
	const family = (
		profile: string,
		pid: number,
		process: typeof fixed,
		listenerPort: number,
	) => ({
		profile,
		pid,
		processStart: process.start,
		executable: process.executable,
		script: process.scriptPath,
		argv: process.argv,
		listenerPort,
	});
	requireProof(
		isDeepStrictEqual(observed.provenComfyInstances, [
			family("fixed8188", fixedPid, fixed, 8188),
			family("desktop8189-parent", parentPid, parent, 8189),
			family("desktop8189-listener", childPid, child, 8189),
		]),
		"NATIVE_COMFY_PROCESS",
	);
	for (const queue of Object.values(observed.queues))
		requireProof(
			queue.queue_running.length === 0 && queue.queue_pending.length === 0,
			"NATIVE_COMFY_QUEUE_BUSY",
		);
	requireProof(
		observed.systemStats["8188"].pid === fixedPid &&
			isDeepStrictEqual(observed.systemStats["8188"].argv.map(norm), [
				"main.py",
				"--listen",
				"127.0.0.1",
				"--port",
				"8188",
			]),
		"NATIVE_COMFY_SYSTEM_IDENTITY",
	);
	requireProof(
		isDeepStrictEqual(observed.queue, observed.queues["8188"]),
		"NATIVE_QUEUE_UNKNOWN",
	);
	// Worker admit excludes only its own PID and the three exact proven instances.
	// Readiness does not export that own PID; do not add a broader argv exception.
	for (const [pid, process] of Object.entries(processes))
		if (["python.exe", "pythonw.exe"].includes(process.name.toLowerCase()))
			requireProof(
				[fixedPid, parentPid, childPid].some((value) => String(value) === pid),
				"NATIVE_COMPETING_PYTHON",
			);
}

// jobDirectory resolves an existing authenticated/reserved server jobs/<UUID>
// directory. It is a private server seam, never a request parameter or new ledger.
export function createNativeMossProvider(
	storage: { jobDirectory: (requestId: string) => Promise<string> },
	testOnly?: TestSeams,
) {
	if (testOnly && process.env.NODE_ENV !== "test")
		throw Error("NATIVE_TEST_INJECTION_FORBIDDEN");
	const checkedBinding = (binding: NativeMossLifecycleHandle) =>
		lifecycle
			.extend({ bundleSHA256: z.literal(transportBundle) })
			.parse(binding);
	const remote: Transport = testOnly?.transport ?? {
		...transport,
		lifecycleReadArtifacts: (binding, options) =>
			transport.lifecycleReadArtifacts(checkedBinding(binding), options),
		alpha: (binding, options) =>
			transport.alpha(checkedBinding(binding), options),
		finalize: (binding, options) =>
			transport.finalize(checkedBinding(binding), options),
		reconcile: (binding, options) =>
			transport.reconcile(checkedBinding(binding), options),
		release: (binding, options) =>
			transport.release(checkedBinding(binding), options),
	};
	const qualification = () =>
		testOnly?.qualification
			? testOnly.qualification()
			: String(NATIVE_MOSS_RESULT_BUNDLE) !== NATIVE_MOSS_PROVIDER_BUNDLE ||
					String(transportBundle) !== NATIVE_MOSS_PROVIDER_BUNDLE
				? "NATIVE_BUNDLE_CONTRACT_MISMATCH"
				: null;
	async function admission(options: Options) {
		const unavailable = qualification();
		if (unavailable) return { state: "NOT_READY" as const, code: unavailable };
		try {
			// Validate actual local package bytes before any SSH. A connect does not
			// compile a job prompt, load a model, or establish execution authority.
			if (!testOnly?.qualification) await bundle(testOnly?.bundleSource);
			const native = await remote.readiness(options);
			if (native.state !== "READY")
				return {
					state: "NOT_READY" as const,
					code: "code" in native ? native.code : "NATIVE_READINESS_UNVERIFIED",
					native,
				};
			validateReadiness(native.proof);
			return {
				state: "READY" as const,
				proof: native.proof,
				native,
				lifecycle: {
					state: "LIFECYCLE_READINESS" as const,
					proof: native.proof["lifecycleReadiness"],
				},
			};
		} catch (error) {
			return {
				state: "NOT_READY" as const,
				code:
					error instanceof BundleUnavailable
						? error.code
						: error instanceof Error && /^NATIVE_[A-Z_]+$/.test(error.message)
							? error.message
							: "NATIVE_READINESS_UNVERIFIED",
			};
		}
	}
	async function directory(id: string) {
		const path = await storage.jobDirectory(z.uuid().parse(id));
		if (
			basename(path) !== id ||
			!(await lstat(path)).isDirectory() ||
			(await lstat(path)).isSymbolicLink() ||
			(await realpath(path)) !== path
		)
			throw Error("NATIVE_PRIVATE_JOB_PATH");
		const lock = await lstat(join(path, "dispatch.lock"));
		if (!lock.isFile() || lock.isSymbolicLink())
			throw Error("NATIVE_RESERVATION_REQUIRED");
		return path;
	}
	async function prepare(
		input: unknown,
		authority: NativeMossProviderAuthority,
	) {
		const request = referenceGenerationRequestSchema.parse(input);
		if (
			request.provider !== "native-moss" ||
			request.providerModel !== NATIVE_MOSS_MODEL ||
			!request.nativeRecipe
		)
			throw Error("NATIVE_PROVIDER_REQUIRED");
		if (request.sheetId) throw Error("NATIVE_UPLOADED_SOURCE_UNSUPPORTED");
		sha.parse(authority.ownerBindingHash);
		const acquired = resolveReferenceSource(request, authority.serverEvidence);
		if (!acquired.generation)
			throw Error(
				acquired.status === "failed" || acquired.status === "unresolved"
					? acquired.errorCode
					: "REFERENCE_NOT_ACQUIRED",
			);
		const generation = acquired.generation;
		const detailBytes = new Uint8Array(authority.detailBytes);
		if (detailBytes.length > 2 * 1024 * 1024) throw Error("NATIVE_SOURCE_SIZE");
		const detail = z
			.object({
				id: z.string(),
				characterId: z.string(),
				name: z.string().trim().min(1),
			})
			.parse(
				JSON.parse(
					new TextDecoder("utf-8", { fatal: true }).decode(detailBytes),
				),
			);
		const token = z
			.object({
				personId: z.string(),
				characterId: z.string(),
				name: z.string(),
			})
			.passthrough()
			.parse(
				JSON.parse(
					new TextDecoder("utf-8", { fatal: true }).decode(
						generation.tokenBytes,
					),
				),
			);
		const qualified = (value: unknown): void => {
			if (Array.isArray(value)) {
				for (const child of value) qualified(child);
			} else if (value && typeof value === "object") {
				const record = value as Record<string, unknown>;
				if (
					record["provisional"] === true ||
					["provisional", "pending-review", "rejected"].includes(
						String(record["status"]),
					)
				)
					throw Error("NATIVE_PROVISIONAL_SOURCE");
				for (const child of Object.values(record)) qualified(child);
			}
		};
		qualified(token);
		if (
			detail.id !== generation.personId ||
			detail.characterId !== generation.characterId ||
			token.name !== detail.name ||
			token.personId !== detail.id ||
			token.characterId !== detail.characterId
		)
			throw Error("NATIVE_SOURCE_IDENTITY");
		const original = generation.recipientImage?.bytes ?? null;
		if (original) {
			const image = z
				.object({ path: z.literal(`/portraits/${generation.personId}.png`) })
				.parse(token["image"]);
			if (!image) throw Error("NATIVE_IMAGE_BINDING");
			transformReferencePng(original, "native", "native340-v1");
		}
		const blob = (bytes: Uint8Array) => ({
			byteBase64: Buffer.from(bytes).toString("base64"),
			sha256: hash(bytes),
			size: bytes.length,
		});
		const snapshot = {
			personId: generation.personId,
			characterId: generation.characterId,
			name: detail.name,
			detail: blob(detailBytes),
			token: blob(generation.tokenBytes),
			original: original ? blob(original) : null,
			sourceSelection: {
				kind: "selected",
				personId: generation.personId,
				sourceSHA256: original ? hash(original) : null,
			},
		};
		return {
			request,
			recipe: request.nativeRecipe,
			snapshot,
			token,
			ownerBindingHash: authority.ownerBindingHash,
		};
	}
	async function saveOutcome(dir: string, outcome: NativeMossProviderResult) {
		if (!(await readOptional(join(dir, "native-outcome.json"))))
			await exclusive(
				join(dir, "native-outcome.json"),
				outcome.state === "HOLD"
					? { ...outcome, finalBytes: undefined }
					: outcome,
			);
		return outcome;
	}
	async function lifecycleHandle(
		dir: string,
		value: NativeMossLifecycleHandle,
	) {
		const path = join(dir, "native-lifecycle.json");
		if (!(await readOptional(path))) await exclusive(path, value);
	}
	function stageCallbacks(dir: string, intent: Intent, options: Options): Pick<NativeMossTransportOptions, "onStageIntent" | "onStageUpdate"> {
		const frame = JSON.stringify({ schema: "native-moss-command.v1", operation: "execute", profileDigest: NATIVE_MOSS_PROFILE_DIGEST, job: JSON.parse(intent.envelope) });
		let last = 0;
		const validate = (input: NativeMossStageRecord) => {
			const stage = stageSchema.parse(input);
			const path = `D:/AI/environments/PNGAL/training/recovery16-workbench-jobs-v1/incoming/${intent.handle.requestId}-${intent.handle.nonce}-${stage.stageNonce}/${hash(frame)}.json`;
			if (!Object.entries(intent.handle).every(([key, value]) => stage[key as keyof typeof stage] === value) || stage.path !== path || stage.frameSHA256 !== hash(frame) || stage.size !== Buffer.byteLength(frame)) throw Error("NATIVE_STAGE_BINDING_MISMATCH");
			return stage;
		};
		return {
			async onStageIntent(input: NativeMossStageRecord) {
				const stage = validate(input);
				if (stage.phase !== "INTENT") throw Error("NATIVE_STAGE_PHASE");
				await authorize(options, "execute", intent.handle);
				await exclusive(join(dir, "stage-receipt.json"), stage);
			},
			async onStageUpdate(input: NativeMossStageRecord, observedNative?: NativeMossObservedNative) {
				const stage = validate(input);
				const first = stageSchema.parse(JSON.parse(await readFile(join(dir, "stage-receipt.json"), "utf8")));
				if (!isDeepStrictEqual({ ...stage, phase: "INTENT" }, first)) throw Error("NATIVE_STAGE_BINDING_MISMATCH");
				const next = stagePhases.indexOf(stage.phase);
				if (next <= last || (!["RETAINED", "CLEANED"].includes(stage.phase) && next !== last + 1)) throw Error("NATIVE_STAGE_PHASE");
				if (stage.phase === "OBSERVED" && !observedNative) throw Error("NATIVE_STAGE_OBSERVED_MISSING");
				if (observedNative) {
					const terminal = processTerminalSchema.parse(observedNative.nativeProcessTerminal);
					if (!Object.entries(intent.handle).every(([key, value]) => terminal[key as keyof typeof terminal] === value) || !Object.entries({ ...intent.handle, bundleSHA256: NATIVE_MOSS_PROVIDER_BUNDLE }).every(([key,value]) => observedNative.receipt[key] === value)) throw Error("NATIVE_STAGE_OBSERVED_BINDING");
					const retained = await readOptional(join(dir, "native-observed.json"));
					if (retained) { if (!isDeepStrictEqual(JSON.parse(retained), observedNative)) throw Error("NATIVE_STAGE_OBSERVED_BINDING"); }
					else await exclusive(join(dir, "native-observed.json"), observedNative satisfies NativeMossObservedNative);
				}
				await exclusive(join(dir, `stage-event-${next}.json`), { stage, ...(observedNative ? { observedNative } : {}) });
				last = next;
				if (stage.phase === "LAUNCHING") await authorize(options, "execute", intent.handle);
			},
		};
	}
	async function adopt(
		dir: string,
		binding: NativeMossLifecycleHandle,
		options: Options,
		release: boolean,
	) {
		const unavailable = qualification();
		if (unavailable) return result("UNKNOWN", unavailable, binding.requestId);
		const collect = remote.lifecycleReadArtifacts;
		if (!collect)
			return result(
				"UNKNOWN",
				"NATIVE_LIFECYCLE_ARTIFACTS_UNAVAILABLE",
				binding.requestId,
			);
		const readback = z
			.object({
				state: z.string(),
				files: z
					.array(
						z.object({
							name: z.string(),
							byteBase64: z.string(),
							sha256: sha,
							size: z
								.number()
								.int()
								.positive()
								.max(32 * 1024 * 1024),
						}),
					)
					.optional(),
			})
			.parse(await collect(binding, options));
		if (readback.state !== "ARTIFACTS" || !readback.files)
			return result(
				"UNKNOWN",
				"NATIVE_ARTIFACTS_UNAVAILABLE",
				binding.requestId,
			);
		const names = [
			"config.json",
			"preflight.json",
			"status.json",
			"execution.json",
			"alpha-graph.json",
			"alpha-history.json",
			"alpha-submitted.json",
			"output/raw.png",
			"output/crop-RGB.png",
			"output/alpha352.png",
			"output/mask352.png",
			"output/rawmask352.png",
			"output/final-RGBA.png",
		] as const;
		const files = testOnly
			? await testOnly.readback(binding)
			: readback.files.map((file) => ({
					name: z.enum(names).parse(file.name),
					bytes: (() => {
						const bytes = Buffer.from(file.byteBase64, "base64");
						if (
							bytes.toString("base64") !== file.byteBase64 ||
							bytes.length !== file.size ||
							hash(bytes) !== file.sha256
						)
							throw Error("NATIVE_ARTIFACT_HASH");
						return bytes;
					})(),
				}));
		const expectedData = z
			.object({ expected: z.unknown() })
			.parse(
				JSON.parse(await readFile(join(dir, "native-expected.json"), "utf8")),
			);
		const stored = expectedData.expected as Omit<
			NativeMossResultExpected,
			"attestation"
		> & {
			attestation: Omit<
				NativeMossResultExpected["attestation"],
				"contextInputBytes" | "contextResponseBytes"
			> & { contextInputBytes: string; contextResponseBytes: string };
		};
		const expected: NativeMossResultExpected = {
			...stored,
			attestation: {
				...stored.attestation,
				contextInputBytes: Buffer.from(
					stored.attestation.contextInputBytes,
					"base64",
				),
				contextResponseBytes: Buffer.from(
					stored.attestation.contextResponseBytes,
					"base64",
				),
			},
		};
		const checked: Verified = (
			testOnly?.verifyResult ?? verifyNativeMossResult
		)(expected, files);
		if (
			checked.state !== "HOLD" ||
			checked.ownerApproval !== "NONE" ||
			!checked.mechanicalVerified
		)
			throw Error("NATIVE_RESULT_UNVERIFIED");
		if (hash(checked.finalBytes) !== checked.finalSHA256)
			throw Error("NATIVE_RESULT_UNVERIFIED");
		if (!(await readOptional(join(dir, "native-verified.json"))))
			await exclusive(join(dir, "native-verified.json"), {
				requestId: binding.requestId,
				finalSHA256: checked.finalSHA256,
				ownerApproval: "NONE",
			});
		if (!release)
			return result("UNKNOWN", "NATIVE_RELEASE_UNCONFIRMED", binding.requestId);
		// Release is explicit here and only after the independent artifact verifier.
		await exclusive(join(dir, "native-release-intent.json"), binding);
		await authorize(options, "release", binding);
		const released = await remote.release(binding, options);
		if (
			released.state !== "RELEASED" ||
			released.receipt["finalSHA256"] !== checked.finalSHA256
		)
			return result("UNKNOWN", "NATIVE_RELEASE_UNCONFIRMED", binding.requestId);
		return saveOutcome(dir, {
			state: "HOLD",
			requestId: binding.requestId,
			ownerApproval: "NONE",
			qualityQualified: false,
			finalBytes: checked.finalBytes,
			finalSHA256: checked.finalSHA256,
		});
	}
	return {
		async readiness(options: Options = {}) {
			return admission(options);
		},
		async execute(
			input: unknown,
			authority: NativeMossProviderAuthority,
			options: NativeMossDispatchOptions,
		): Promise<NativeMossProviderResult> {
			let id = "",
				dir = "",
				mutated = false;
			try {
				id = referenceGenerationRequestSchema.parse(input).requestId;
				const prepared = await prepare(input, authority);
				id = prepared.request.requestId;
				dir = await directory(id);
				const requestSHA256 = hash(JSON.stringify(prepared.request)),
					snapshotSHA256 = hash(JSON.stringify(prepared.snapshot));
				const previous = await readOptional(join(dir, "native-dispatch.json"));
				if (previous) {
					const retained = intentSchema.parse(JSON.parse(previous));
					if (
						retained.requestSHA256 !== requestSHA256 ||
						retained.snapshotSHA256 !== snapshotSHA256 ||
						retained.handle.ownerBindingHash !== prepared.ownerBindingHash
					)
						return result("REJECTED", "NATIVE_REQUEST_CONFLICT", id);
					return result("UNKNOWN", "NATIVE_ALREADY_ATTEMPTED", id);
				}
				const worker = testOnly?.bundleSource
					? await bundle(testOnly.bundleSource)
					: testOnly
						? await testOnly.workerBundle()
						: await bundle();
				const compiled =
					prepared.request.inputMode === "token-only"
						? await compileToken(prepared.token, worker.files)
						: {
								text: "seoul dengoku portrait style, preserve the source person, outfit, composition and gaze; change only the drawing style",
								fields: [],
							};
				const trusted = authority.dispatchProof;
				if (!trusted)
					return result("NOT_READY", "NATIVE_SERVER_ATTESTATION_MISSING", id);
				const snapshotHashes = {
					detail: prepared.snapshot.detail.sha256,
					token: prepared.snapshot.token.sha256,
					...(prepared.snapshot.original
						? { original: prepared.snapshot.original.sha256 }
						: {}),
				};
				if (
					trusted.requestSHA256 !== requestSHA256 ||
					!isDeepStrictEqual(trusted.snapshotHashes, snapshotHashes) ||
					trusted.attestation.compiled.text !== compiled.text ||
					!isDeepStrictEqual(
						trusted.attestation.compiled.fields,
						compiled.fields,
					)
				)
					return result("NOT_READY", "NATIVE_SERVER_ATTESTATION_MISMATCH", id);
				const trustedAttestation = structuredClone(trusted.attestation);
				if (
					!(trustedAttestation.contextInputBytes instanceof Uint8Array) ||
					!(trustedAttestation.contextResponseBytes instanceof Uint8Array)
				)
					return result("NOT_READY", "NATIVE_SERVER_CONTEXT_MISSING", id);
				const contextInput = JSON.parse(
					new TextDecoder("utf-8", { fatal: true }).decode(
						trustedAttestation.contextInputBytes,
					),
				);
				const contextOutput = JSON.parse(
					new TextDecoder("utf-8", { fatal: true }).decode(
						trustedAttestation.contextResponseBytes,
					),
				);
				if (
					!isDeepStrictEqual(contextInput, trustedAttestation.contextInput) ||
					!isDeepStrictEqual(contextInput.prompts, [
						{ personId: prepared.snapshot.personId, text: compiled.text },
					]) ||
					contextInput.negative !== "" ||
					contextOutput.maxTextLength !== 4096 ||
					contextOutput.truncation !== false ||
					contextOutput.modelLoaded !== false
				)
					return result("NOT_READY", "NATIVE_SERVER_CONTEXT_MISMATCH", id);
				if (!remote.lifecycleReadArtifacts)
					return result(
						"NOT_READY",
						"NATIVE_LIFECYCLE_ARTIFACTS_UNAVAILABLE",
						id,
					);
				const unavailable = qualification();
				if (unavailable) return result("NOT_READY", unavailable, id);
				if (testOnly?.qualification) {
					const ready = await remote.readiness(options),
						phase = await remote.lifecycleReadiness(options);
					if (
						ready.state !== "READY" ||
						phase.state !== "LIFECYCLE_READINESS" ||
						phase.proof["ready"] !== true
					)
						return result(
							"NOT_READY",
							ready.state === "NOT_READY"
								? ready.code
								: "NATIVE_READINESS_UNVERIFIED",
							id,
						);
				} else {
					const ready = await admission(options);
					if (ready.state !== "READY")
						return result("NOT_READY", ready.code, id);
				}
				const nonce = randomUUID();
				const envelope = JSON.stringify({
					schema: "native-moss-job.v1",
					requestId: id,
					nonce,
					profileDigest: NATIVE_MOSS_PROFILE_DIGEST,
					mode: prepared.request.inputMode,
					recipe: prepared.request.nativeRecipe,
					snapshot: prepared.snapshot,
					bundle: worker.files,
					settings: {
						generationProfile: "native340-v1",
						size: "340x510",
						n: 1,
						seed: nativeMossProfile.seed,
						steps: 25,
						cfg: 2.5,
						preserveOnly: true,
						ownerApproved: false,
						qualityQualified: false,
					},
					ownerBindingHash: prepared.ownerBindingHash,
					explicitEdits: [],
				});
				const handle = identity.parse({
					requestId: id,
					nonce,
					ownerBindingHash: prepared.ownerBindingHash,
					envelopeSHA256: hash(envelope),
					profileDigest: NATIVE_MOSS_PROFILE_DIGEST,
				});
				const intent: Intent = {
					schema: "native-moss-dispatch-intent.v1",
					requestSHA256,
					snapshotSHA256,
					handle,
					envelope,
				};
				await exclusive(join(dir, "native-dispatch.json"), intent);
				await authorize(options, "execute", handle);
				mutated = true;
				const native = await remote.execute(Buffer.from(envelope), { ...options, ...stageCallbacks(dir, intent, options) });
				if ((native.state === "UNKNOWN" || native.state === "REJECTED" || native.state === "NOT_READY") && native.stageRecord) {
					const retained = stageSchema.parse(JSON.parse(await readFile(join(dir, "stage-receipt.json"), "utf8")));
					const returned = stageSchema.parse(native.stageRecord);
					if (!isDeepStrictEqual({ ...returned, phase: "INTENT" }, retained)) throw Error("NATIVE_STAGE_BINDING_MISMATCH");
					if (native.stagedInput && (native.stagedInput.path !== retained.path || native.stagedInput.sha256 !== retained.frameSHA256 || native.stagedInput.size !== retained.size)) throw Error("NATIVE_STAGE_BINDING_MISMATCH");
					await exclusive(join(dir, "stage-result.json"), native);
				}
				if (
					native.state !== "NATIVE_COMPLETE_ALPHA_PENDING" ||
					!isDeepStrictEqual(native.handle, handle)
				)
					return saveOutcome(
						dir,
						result("UNKNOWN", "NATIVE_EXECUTION_UNCONFIRMED", id),
					);
				const receipt = native.receipt;
				const terminal = processTerminalSchema.safeParse(
					native.nativeProcessTerminal,
				);
				if (
					!terminal.success ||
					!Object.entries(handle).every(
						([key, value]) =>
							terminal.data[key as keyof typeof terminal.data] === value,
					)
				)
					return saveOutcome(
						dir,
						result("UNKNOWN", "NATIVE_PROCESS_TERMINAL_MISSING", id),
					);
				const process = z
					.object({
						pid: z.number().int().positive(),
						processStart: z.string().min(1),
					})
					.safeParse(receipt["native"]);
				if (!process.success)
					return saveOutcome(
						dir,
						result("UNKNOWN", "NATIVE_PROCESS_START_MISSING", id),
					);
				if (
					process.data.pid !== terminal.data.pid ||
					process.data.processStart !== terminal.data.processStart
				)
					return saveOutcome(
						dir,
						result("UNKNOWN", "NATIVE_PROCESS_TERMINAL_MISMATCH", id),
					);
				const binding = lifecycle.parse({
					...handle,
					bundleSHA256: NATIVE_MOSS_PROVIDER_BUNDLE,
					ownerPid: process.data.pid,
					ownerStart: process.data.processStart,
				});
				await lifecycleHandle(dir, binding);
				const nativeProof = z
					.object({
						promptSHA256: sha,
						contentFieldsSHA256: sha,
						sourcePins: z.record(z.string(), sha),
					})
					.parse(receipt["native"]);
				if (nativeProof.promptSHA256 !== hash(compiled.text))
					throw Error("NATIVE_PROMPT_MISMATCH");
				const canonicalFields = (value: unknown): unknown =>
					Array.isArray(value)
						? value.map(canonicalFields)
						: value && typeof value === "object"
							? Object.fromEntries(
									Object.entries(value)
										.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
										.map(([key, child]) => [key, canonicalFields(child)]),
								)
							: value;
				if (
					nativeProof.contentFieldsSHA256 !==
					hash(
						JSON.stringify(canonicalFields(trustedAttestation.compiled.fields)),
					)
				)
					throw Error("NATIVE_CONTENT_ATTESTATION_MISMATCH");
				if (!isDeepStrictEqual(nativeProof.sourcePins, trusted.sourcePins))
					throw Error("NATIVE_SOURCE_ATTESTATION_MISMATCH");
				const runtimeProof = z
					.object({
						contextInputSHA256: sha,
						contextResponseSHA256: sha,
						compiled: z.unknown(),
						retainedSHA256: z.unknown(),
					})
					.parse(
						z.record(z.string(), z.unknown()).parse(receipt["native"])[
							"runtimeAttestation"
						],
					);
				if (
					runtimeProof.contextInputSHA256 !==
						hash(trustedAttestation.contextInputBytes) ||
					runtimeProof.contextResponseSHA256 !==
						hash(trustedAttestation.contextResponseBytes) ||
					!isDeepStrictEqual(runtimeProof.retainedSHA256, snapshotHashes)
				)
					throw Error("NATIVE_CONTEXT_ATTESTATION_MISMATCH");
				const expected: NativeMossResultExpected = {
					...handle,
					mode: prepared.request.inputMode,
					recipe: prepared.recipe,
					personId: prepared.snapshot.personId,
					characterId: prepared.snapshot.characterId,
					name: prepared.snapshot.name,
					snapshotHashes: {
						detail: prepared.snapshot.detail.sha256,
						token: prepared.snapshot.token.sha256,
						...(prepared.snapshot.original
							? { original: prepared.snapshot.original.sha256 }
							: {}),
					},
					...nativeProof,
					ownerProcess: { pid: binding.ownerPid, start: binding.ownerStart },
					attestation: trustedAttestation,
					nativeProcessTerminal: terminal.data satisfies NativeProcessTerminal,
				};
				await exclusive(join(dir, "native-expected.json"), {
					expected: {
						...expected,
						attestation: {
							...expected.attestation,
							contextInputBytes: Buffer.from(
								expected.attestation.contextInputBytes,
							).toString("base64"),
							contextResponseBytes: Buffer.from(
								expected.attestation.contextResponseBytes,
							).toString("base64"),
						},
					},
				});
				await exclusive(join(dir, "native-alpha-intent.json"), binding);
				await authorize(options, "alpha", binding);
				const alpha = await remote.alpha(binding, options);
				if (alpha.state !== "ALPHA_SUBMITTED")
					return saveOutcome(
						dir,
						result("UNKNOWN", "NATIVE_ALPHA_UNCONFIRMED", id),
					);
				await exclusive(join(dir, "native-finalize-intent.json"), binding);
				await authorize(options, "finalize", binding);
				const final = await remote.finalize(binding, options);
				if (final.state !== "HOLD")
					return saveOutcome(
						dir,
						result("UNKNOWN", "NATIVE_FINALIZE_UNCONFIRMED", id),
					);
				return await adopt(dir, binding, options, true);
			} catch (error) {
				if (error instanceof NativeMossAuthorizationError)
					return result(mutated ? "UNKNOWN" : "REJECTED", error.code, id);
				if (!mutated && error instanceof BundleUnavailable)
					return result("NOT_READY", error.code, id);
				if (
					error instanceof Error &&
					"code" in error &&
					error.code === "EEXIST"
				)
					return result("UNKNOWN", "NATIVE_ALREADY_ATTEMPTED", id);
				const code =
					error instanceof Error && /^[A-Z][A-Z0-9_]+$/.test(error.message)
						? error.message
						: "NATIVE_PROVIDER_REJECTED";
				return result(
					mutated
						? "UNKNOWN"
						: code === "NATIVE_BUNDLE_CHANGED"
							? "NOT_READY"
							: "REJECTED",
					code,
					id,
				);
			}
		},
		async reconcile(
			requestId: string,
			ownerBindingHash: string,
			options: Options = {},
		): Promise<NativeMossProviderResult> {
			const id = z.uuid().parse(requestId),
				dir = await directory(id);
			const intent = intentSchema.parse(
				JSON.parse(await readFile(join(dir, "native-dispatch.json"), "utf8")),
			);
			if (
				intent.handle.ownerBindingHash !== sha.parse(ownerBindingHash) ||
				intent.handle.requestId !== id ||
				hash(intent.envelope) !== intent.handle.envelopeSHA256
			)
				return result("REJECTED", "NATIVE_REQUEST_CONFLICT", id);
			const raw = await readOptional(join(dir, "native-lifecycle.json"));
			const stageRaw = await readOptional(join(dir, "stage-receipt.json"));
			if (stageRaw) {
				const stage = stageSchema.parse(JSON.parse(stageRaw));
				const frame = JSON.stringify({ schema: "native-moss-command.v1", operation: "execute", profileDigest: NATIVE_MOSS_PROFILE_DIGEST, job: JSON.parse(intent.envelope) });
				const path = `D:/AI/environments/PNGAL/training/recovery16-workbench-jobs-v1/incoming/${id}-${intent.handle.nonce}-${stage.stageNonce}/${hash(frame)}.json`;
				if (!Object.entries(intent.handle).every(([key,value]) => stage[key as keyof typeof stage] === value) || stage.path !== path || stage.frameSHA256 !== hash(frame) || stage.size !== Buffer.byteLength(frame)) return result("REJECTED", "NATIVE_STAGE_BINDING_MISMATCH", id);
			}
			if (!raw) {
				await remote.status(intent.handle, options);
				return result("UNKNOWN", "NATIVE_TERMINAL_UNAVAILABLE", id);
			}
			const binding = lifecycle.parse(JSON.parse(raw));
			if (
				!Object.entries(intent.handle).every(
					([key, value]) => binding[key as keyof typeof binding] === value,
				)
			)
				return result("REJECTED", "NATIVE_REQUEST_CONFLICT", id);
			const terminal = await remote.reconcile(binding, options);
			if (terminal.state === "HOLD") {
				try {
					return await adopt(dir, binding, options, false);
				} catch {
					return result("UNKNOWN", "NATIVE_RESULT_UNVERIFIED", id);
				}
			}
			// Reads never resume alpha/finalize/release, including after restart.
			return result(
				"UNKNOWN",
				"NATIVE_RECONCILE_REQUIRES_VERIFIED_READBACK",
				id,
			);
		},
	};
}
