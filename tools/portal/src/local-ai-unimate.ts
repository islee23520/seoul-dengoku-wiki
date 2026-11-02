import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdtemp, readFile, realpath, stat, writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { z } from "zod";

const sha256 = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
async function hashFile(path: string): Promise<string> {
	const hash = createHash("sha256");
	await pipeline(createReadStream(path, { highWaterMark: 1024 * 1024 }), hash);
	return hash.digest("hex");
}
const digest = z.string().regex(/^[a-f0-9]{64}$/);
export const unimateRequestSchema = z
	.strictObject({
		assetId: z.string().regex(/^[a-z0-9-]{1,80}$/),
		prompt: z
			.string()
			.min(1)
			.max(2000)
			.refine((v) => v.trim().length > 0 && !v.includes("\0")),
		seed: z.number().int().min(0).max(2147483647),
	})
	.readonly();

/** Private operator configuration, never accepted from HTTP/MCP input. */
export type UniMateConfig = {
	readonly python: string;
	readonly worker: string;
	readonly source: string;
	readonly sourceRevision: string;
	readonly runtimeId: string;
	readonly expDir: string;
	readonly checkpoint: string;
	readonly outputRoot: string;
	readonly hfHome: string;
	readonly pins: readonly { readonly path: string; readonly sha256: string }[];
	readonly assets: Readonly<
		Record<
			string,
			{
				readonly directory: string;
				readonly condPath: string;
				readonly condKey: string;
				readonly canonicalGlb: string;
				readonly jointNames: readonly string[];
				readonly frameDigest: string;
				readonly features: number;
			}
		>
	>;
};
export type UniMateInvocation = {
	readonly executable: string;
	readonly args: readonly string[];
	readonly cwd: string;
	readonly env: Readonly<Record<string, string>>;
	readonly shell: false;
};
export type PreparedUniMate = {
	readonly directory: string;
	readonly requestPath: string;
	readonly requestSha256: string;
	readonly generation: UniMateInvocation;
	readonly validation: UniMateInvocation;
};

export class UniMateContractError extends Error {
	constructor(readonly code: string) {
		super(code);
		this.name = "UniMateContractError";
	}
}

/** Does no spawning. The broker must start generation synchronously inside runExclusive. */
export async function prepareUniMate(
	input: unknown,
	config: UniMateConfig,
): Promise<PreparedUniMate> {
	const request = unimateRequestSchema.parse(input);
	const asset = config.assets[request.assetId];
	if (!asset) throw new UniMateContractError("UNIMATE_ASSET_UNKNOWN");
	const paths = [
		config.python,
		config.worker,
		config.source,
		config.expDir,
		config.checkpoint,
		config.outputRoot,
		config.hfHome,
		asset.directory,
		asset.condPath,
		asset.canonicalGlb,
	];
	for (const path of paths) {
		if (!isAbsolute(path) || resolve(await realpath(path)) !== resolve(path))
			throw new UniMateContractError("UNIMATE_PATH_NOT_CANONICAL");
	}
	// Each executable/model/input dependency is reviewed and content pinned by the operator.
	for (const path of [
		config.python,
		config.worker,
		config.checkpoint,
		join(config.expDir, "config.json"),
		join(config.expDir, "dataset_stats.npy"),
		asset.condPath,
		asset.canonicalGlb,
	]) {
		if (!config.pins.some((pin) => resolve(pin.path) === resolve(path)))
			throw new UniMateContractError("UNIMATE_PIN_MISSING");
	}
	for (const pin of config.pins) {
		if (
			resolve(await realpath(pin.path)) !== resolve(pin.path) ||
			(await hashFile(pin.path)) !== digest.parse(pin.sha256)
		)
			throw new UniMateContractError("UNIMATE_PIN_MISMATCH");
	}
	const directory = await mkdtemp(join(config.outputRoot, "unimate-"));
	const requestPath = join(directory, "request.json");
	const bytes = Buffer.from(
		JSON.stringify({
			version: 1,
			jobId: randomUUID(),
			request,
			source: config.source,
			sourceRevision: config.sourceRevision,
			runtimeId: config.runtimeId,
			expDir: config.expDir,
			checkpoint: config.checkpoint,
			asset,
			pins: config.pins,
			output: join(directory, "samples"),
		}),
	);
	await writeFile(requestPath, bytes, { flag: "wx", mode: 0o600 });
	// No inherited credentials, PYTHONPATH, user site, or online model fallback.
	const systemRootKey = "SystemRoot";
	const env = {
		...(process.env[systemRootKey]
			? { SystemRoot: process.env[systemRootKey] }
			: {}),
		PYTHONNOUSERSITE: "1",
		PYTHONDONTWRITEBYTECODE: "1",
		PYTHONUTF8: "1",
		HF_HUB_OFFLINE: "1",
		TRANSFORMERS_OFFLINE: "1",
		HF_DATASETS_OFFLINE: "1",
		HF_HOME: config.hfHome,
		HF_HUB_DISABLE_TELEMETRY: "1",
	};
	const invocation = (mode: string): UniMateInvocation => ({
		executable: config.python,
		args: ["-I", config.worker, mode, "--request", requestPath],
		cwd: config.source,
		env,
		shell: false,
	});
	return {
		directory,
		requestPath,
		requestSha256: sha256(bytes),
		generation: invocation("generate"),
		validation: invocation("validate"),
	};
}

const artifactSchema = z
	.strictObject({
		name: z.string().regex(/^(manifest\.json|motions\/[A-Za-z0-9_.-]+\.npy)$/),
		sha256: digest,
		bytes: z.number().int().positive(),
	})
	.readonly();
const resultSchema = z
	.strictObject({
		version: z.literal(1),
		requestSha256: digest,
		frames: z.number().int().min(2),
		joints: z.number().int().positive(),
		features: z.number().int().positive(),
		variation: z.number().finite().positive(),
		artifacts: z.array(artifactSchema).length(2),
	})
	.readonly();
export type UniMateResult = z.infer<typeof resultSchema>;

/** Consume only stdout from a successful CPU validator invocation, not generator stdout. */
export async function collectUniMate(
	prepared: PreparedUniMate,
	stdout: string,
): Promise<UniMateResult> {
	const result = resultSchema.parse(JSON.parse(stdout));
	if (
		result.requestSha256 !== prepared.requestSha256 ||
		sha256(await readFile(prepared.requestPath)) !== prepared.requestSha256
	)
		throw new UniMateContractError("UNIMATE_REQUEST_MISMATCH");
	if (
		new Set(result.artifacts.map((artifact) => artifact.name)).size !== 2 ||
		!result.artifacts.some((artifact) => artifact.name === "manifest.json")
	)
		throw new UniMateContractError("UNIMATE_ARTIFACT_SET");
	for (const artifact of result.artifacts) {
		const path = join(prepared.directory, "samples", artifact.name);
		if (resolve(await realpath(path)) !== resolve(path))
			throw new UniMateContractError("UNIMATE_ARTIFACT_ESCAPE");
		if (
			(await stat(path)).size !== artifact.bytes ||
			(await hashFile(path)) !== artifact.sha256
		)
			throw new UniMateContractError("UNIMATE_ARTIFACT_CHANGED");
	}
	return result;
}
