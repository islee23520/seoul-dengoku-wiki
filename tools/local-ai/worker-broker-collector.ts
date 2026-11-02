// allow: SIZE_OK — operator configuration is a pure schema table; execution and publication remain one owner worker.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
	copyFile,
	mkdir,
	open,
	readFile,
	realpath,
	rename,
} from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
	localAiReceiptSchema,
	localAiRequestSchema,
	localAiBoundary as z,
} from "../portal/src/local-ai-jobs.ts";
import {
	collectUniForge3D,
	prepareUniForge3D,
} from "../portal/src/local-ai-uniforge3d.ts";
import {
	collectUniMate,
	prepareUniMate,
} from "../portal/src/local-ai-unimate.ts";

const digest = z.string().regex(/^[a-f0-9]{64}$/);
const path = z.string().refine(isAbsolute);
const common = {
	python: path,
	worker: path,
	source: path,
	sourceRevision: z.string().min(1).max(128),
	runtimeId: z.string().regex(/^[a-z0-9-]{1,80}$/),
	outputRoot: path,
	hfHome: path,
	pins: z.array(z.strictObject({ path, sha256: digest })).min(1),
};
const configSchema = z.strictObject({
	resultsRoot: path,
	unimate: z
		.strictObject({
			...common,
			expDir: path,
			checkpoint: path,
			assets: z.record(
				z.string(),
				z.strictObject({
					directory: path,
					condPath: path,
					condKey: z.string(),
					canonicalGlb: path,
					jointNames: z.array(z.string()).min(1),
					frameDigest: z.string(),
					features: z.number().int().positive(),
				}),
			),
		})
		.optional(),
	uniforge3d: z
		.strictObject({
			...common,
			model: path,
			assets: z.record(z.string(), z.array(path).min(1).max(16)),
		})
		.optional(),
});
class CollectorError extends Error {
	readonly name = "CollectorError";
	constructor(readonly code: string) {
		super(code);
	}
}
const hash = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");

/** This process is itself the pinned worker inside the owner's retained lease.
 * No lease acquisition here: generation and CPU validation share that custody. */
async function invoke(invocation: {
	readonly executable: string;
	readonly args: readonly string[];
	readonly cwd: string;
	readonly env: Readonly<Record<string, string>>;
}) {
	return new Promise<string>((done, reject) => {
		const child = spawn(invocation.executable, [...invocation.args], {
			cwd: invocation.cwd,
			env: invocation.env,
			shell: false,
			windowsHide: true,
			stdio: ["ignore", "pipe", "pipe"],
		});
		let stdout = "",
			overflow = false;
		child.stdout.on("data", (bytes: Buffer) => {
			if (Buffer.byteLength(stdout) + bytes.length <= 16384)
				stdout += bytes.toString();
			else overflow = true;
		});
		// Credential-bearing diagnostics never leave the owner process or enter receipts.
		child.stderr.resume();
		child.once("error", reject);
		child.once("close", (code) =>
			code === 0 && !overflow
				? done(stdout)
				: reject(new CollectorError("WORKER_VALIDATION_FAILED")),
		);
	});
}

export async function collectOwnedJob(input: unknown, configInput: unknown) {
	const config = configSchema.parse(configInput);
	const request = localAiRequestSchema.parse(input);
	if (
		resolve(await realpath(config.resultsRoot)) !== resolve(config.resultsRoot)
	)
		throw new CollectorError("RESULT_ROOT_ESCAPE");
	const directory = join(config.resultsRoot, request.requestId);
	await mkdir(directory, { mode: 0o700 });
	let adapterRequestSha256: string,
		sourceRevision: string,
		runtimeId: string,
		modelSha256: string,
		inputSha256: string;
	let artifacts: readonly {
		readonly name: string;
		readonly bytes: number;
		readonly sha256: string;
		readonly path: string;
		readonly mime:
			| "model/gltf-binary"
			| "application/json"
			| "application/octet-stream";
	}[];
	switch (request.tool) {
		case "unimate": {
			const spec = config.unimate;
			if (!spec) throw new CollectorError("UNIMATE_NOT_CONFIGURED");
			const prepared = await prepareUniMate(
				{
					assetId: request.assetId,
					prompt: request.prompt,
					seed: request.seed,
				},
				spec,
			);
			await invoke(prepared.generation);
			const result = await collectUniMate(
				prepared,
				await invoke(prepared.validation),
			);
			artifacts = result.artifacts.map((a) => ({
				...a,
				path: join(prepared.directory, "samples", a.name),
				mime:
					a.name === "manifest.json"
						? "application/json"
						: "application/octet-stream",
			}));
			adapterRequestSha256 = prepared.requestSha256;
			sourceRevision = spec.sourceRevision;
			runtimeId = spec.runtimeId;
			modelSha256 = hash(Buffer.from(JSON.stringify(spec.pins)));
			inputSha256 = hash(
				Buffer.from(
					JSON.stringify(
						spec.pins.filter((pin) =>
							[
								spec.assets[request.assetId]?.condPath,
								spec.assets[request.assetId]?.canonicalGlb,
							].includes(pin.path),
						),
					),
				),
			);
			break;
		}
		case "uniforge3d": {
			const spec = config.uniforge3d;
			if (!spec) throw new CollectorError("UNIFORGE_NOT_CONFIGURED");
			const prepared = await prepareUniForge3D(
				{ assetId: request.assetId, seed: request.seed },
				spec,
			);
			await invoke(prepared.generation);
			const result = await collectUniForge3D(
				prepared,
				await invoke(prepared.validation),
			);
			artifacts = [
				{
					...result.artifact,
					path: join(prepared.directory, result.artifact.name),
					mime: "model/gltf-binary",
				},
			];
			adapterRequestSha256 = prepared.requestSha256;
			sourceRevision = spec.sourceRevision;
			runtimeId = spec.runtimeId;
			modelSha256 = hash(Buffer.from(JSON.stringify(spec.pins)));
			inputSha256 = hash(
				Buffer.from(
					JSON.stringify(
						spec.pins.filter((pin) =>
							spec.assets[request.assetId]?.includes(pin.path),
						),
					),
				),
			);
			break;
		}
		default: {
			const exhaustive: never = request;
			throw new CollectorError(String(exhaustive));
		}
	}
	const receiptArtifacts = [];
	await mkdir(join(directory, "artifacts"), { mode: 0o700 });
	for (const [index, artifact] of artifacts.entries()) {
		const id = `${request.requestId}-${index}`;
		const destination = join(directory, "artifacts", id);
		await copyFile(artifact.path, destination, 1);
		const file = await open(destination, "r+");
		try {
			const bytes = await file.readFile();
			if (bytes.length !== artifact.bytes || hash(bytes) !== artifact.sha256)
				throw new CollectorError("ARTIFACT_CHANGED");
			await file.sync();
		} finally {
			await file.close();
		}
		receiptArtifacts.push({
			id,
			name: artifact.name.split("/").at(-1),
			bytes: artifact.bytes,
			sha256: artifact.sha256,
			mime: artifact.mime,
		});
	}
	const receipt = localAiReceiptSchema.parse({
		version: 1,
		request,
		adapterRequestSha256,
		sourceRevision,
		runtimeId,
		modelSha256,
		inputSha256,
		artifacts: receiptArtifacts,
	});
	const file = await open(join(directory, "receipt.tmp"), "wx", 0o600);
	try {
		await file.writeFile(JSON.stringify(receipt));
		await file.sync();
	} finally {
		await file.close();
	}
	await rename(join(directory, "receipt.tmp"), join(directory, "receipt.json"));
	return receipt;
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	try {
		const config = JSON.parse(
			await readFile(z.string().parse(process.argv[2]), "utf8"),
		);
		let input = "";
		for await (const chunk of process.stdin) {
			input += String(chunk);
			if (Buffer.byteLength(input) > 65536)
				throw new CollectorError("REQUEST_BOUNDS");
		}
		const wire = z
			.strictObject({
				version: z.literal(1),
				op: z.literal("run"),
				requestId: z.string(),
				tool: z.enum(["unimate", "uniforge3d"]),
				assetId: z.string(),
				seed: z.number(),
				prompt: z.string(),
			})
			.parse(JSON.parse(input));
		const { version: _, op: __, prompt, ...request } = wire;
		await collectOwnedJob(
			wire.tool === "unimate" ? { ...request, prompt } : request,
			config,
		);
	} catch (error) {
		if (!(error instanceof Error)) throw error;
		process.stderr.write("OWNER_COLLECTION_FAILED\n");
		process.exitCode = 1;
	}
}
