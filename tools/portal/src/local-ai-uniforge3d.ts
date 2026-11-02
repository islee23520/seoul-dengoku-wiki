import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdtemp, readFile, realpath, stat, writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { z } from "zod";

const digest = z.string().regex(/^[a-f0-9]{64}$/);
const sha256 = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
async function hashFile(path: string): Promise<string> {
	const hash = createHash("sha256");
	await pipeline(createReadStream(path, { highWaterMark: 1024 * 1024 }), hash);
	return hash.digest("hex");
}
export const uniforge3dRequestSchema = z
	.strictObject({
		assetId: z.string().regex(/^[a-z0-9-]{1,80}$/),
		seed: z.number().int().min(0).max(2147483647),
	})
	.readonly();
export type UniForge3DConfig = {
	readonly python: string;
	readonly worker: string;
	readonly source: string;
	readonly sourceRevision: string;
	readonly runtimeId: string;
	readonly model: string;
	readonly hfHome: string;
	readonly outputRoot: string;
	readonly pins: readonly { readonly path: string; readonly sha256: string }[];
	readonly assets: Readonly<Record<string, readonly string[]>>;
};
export type UniForge3DInvocation = {
	readonly executable: string;
	readonly args: readonly string[];
	readonly cwd: string;
	readonly env: Readonly<Record<string, string>>;
	readonly shell: false;
};
export type PreparedUniForge3D = {
	readonly directory: string;
	readonly requestPath: string;
	readonly requestSha256: string;
	readonly generation: UniForge3DInvocation;
	readonly validation: UniForge3DInvocation;
};
export class UniForge3DContractError extends Error {
	constructor(readonly code: string) {
		super(code);
		this.name = "UniForge3DContractError";
	}
}
async function canonical(path: string): Promise<void> {
	if (!isAbsolute(path) || resolve(await realpath(path)) !== resolve(path))
		throw new UniForge3DContractError("UNIFORGE_PATH_ESCAPE");
}

/** No spawning: CPU decoding happens in the worker before any inference import. */
export async function prepareUniForge3D(
	input: unknown,
	config: UniForge3DConfig,
): Promise<PreparedUniForge3D> {
	const request = uniforge3dRequestSchema.parse(input);
	const images = config.assets[request.assetId];
	if (!images || images.length < 1 || images.length > 16)
		throw new UniForge3DContractError("UNIFORGE_VIEWS_INVALID");
	const required = [
		config.python,
		config.worker,
		join(config.model, "pipeline.json"),
		join(config.source, "uniforge3d/pipelines/uniforge3d_image_to_3d.py"),
		...images,
	];
	for (const path of [
		...required,
		config.source,
		config.model,
		config.hfHome,
		config.outputRoot,
	])
		await canonical(path);
	for (const path of required) {
		if (!config.pins.some((pin) => resolve(pin.path) === resolve(path)))
			throw new UniForge3DContractError("UNIFORGE_PIN_MISSING");
	}
	for (const pin of config.pins) {
		await canonical(pin.path);
		if ((await hashFile(pin.path)) !== digest.parse(pin.sha256))
			throw new UniForge3DContractError("UNIFORGE_PIN_MISMATCH");
	}
	let total = 0;
	for (const image of images) total += (await stat(image)).size;
	if (total > 128 * 1024 * 1024)
		throw new UniForge3DContractError("UNIFORGE_IMAGES_TOO_LARGE");
	const directory = await mkdtemp(join(config.outputRoot, "uniforge3d-"));
	const requestPath = join(directory, "request.json");
	const bytes = Buffer.from(
		JSON.stringify({
			version: 1,
			jobId: randomUUID(),
			request,
			source: config.source,
			sourceRevision: config.sourceRevision,
			runtimeId: config.runtimeId,
			model: config.model,
			images,
			pins: config.pins,
			output: join(directory, "prediction.glb"),
		}),
	);
	await writeFile(requestPath, bytes, { flag: "wx", mode: 0o600 });
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
		HF_HUB_DISABLE_TELEMETRY: "1",
		HF_HOME: config.hfHome,
	};
	const invocation = (mode: string): UniForge3DInvocation => ({
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
const resultSchema = z
	.strictObject({
		version: z.literal(1),
		requestSha256: digest,
		vertices: z.number().int().positive(),
		triangles: z.number().int().positive(),
		bounds: z.tuple([
			z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]),
			z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]),
		]),
		textures: z.number().int().nonnegative(),
		artifact: z
			.strictObject({
				name: z.literal("prediction.glb"),
				bytes: z
					.number()
					.int()
					.positive()
					.max(128 * 1024 * 1024),
				sha256: digest,
			})
			.readonly(),
	})
	.readonly();
export type UniForge3DResult = z.infer<typeof resultSchema>;

/** Only accept stdout from an exited-successful CPU validation process. */
export async function collectUniForge3D(
	prepared: PreparedUniForge3D,
	stdout: string,
): Promise<UniForge3DResult> {
	if (Buffer.byteLength(stdout) > 16384)
		throw new UniForge3DContractError("UNIFORGE_RECEIPT_TOO_LARGE");
	const result = resultSchema.parse(JSON.parse(stdout));
	if (
		(await stat(prepared.requestPath)).size > 1024 * 1024 ||
		result.requestSha256 !== prepared.requestSha256 ||
		sha256(await readFile(prepared.requestPath)) !== prepared.requestSha256
	)
		throw new UniForge3DContractError("UNIFORGE_REQUEST_MISMATCH");
	const path = join(prepared.directory, result.artifact.name);
	await canonical(path);
	if (
		(await stat(path)).size !== result.artifact.bytes ||
		(await hashFile(path)) !== result.artifact.sha256
	)
		throw new UniForge3DContractError("UNIFORGE_ARTIFACT_CHANGED");
	return result;
}
