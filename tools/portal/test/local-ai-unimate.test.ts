import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { z } from "zod";
import {
	collectUniMate,
	prepareUniMate,
	type UniMateConfig,
	type UniMateInvocation,
	unimateRequestSchema,
} from "../src/local-ai-unimate.ts";
import { cpuTestPython } from "./local-ai-test-runtime.ts";

const pythonKey = "UNIMATE_TEST_PYTHON";
const worker = resolve(import.meta.dir, "../../local-ai/unimate-worker.py");
const identitySchema = z.object({
	python: z.string(),
	jointNames: z.array(z.string()),
	frameDigest: z.string(),
});

function run(invocation: UniMateInvocation) {
	return new Promise<{ code: number | null; stdout: string; stderr: string }>(
		(resolveRun, reject) => {
			const child = spawn(invocation.executable, [...invocation.args], {
				cwd: invocation.cwd,
				env: invocation.env,
				shell: invocation.shell,
				stdio: ["ignore", "pipe", "pipe"],
				signal: AbortSignal.timeout(15000),
			});
			let stdout = "";
			let stderr = "";
			child.stdout.on("data", (data: Buffer) => {
				stdout += data.toString();
			});
			child.stderr.on("data", (data: Buffer) => {
				stderr += data.toString();
			});
			child.once("error", reject);
			child.once("close", (code) => resolveRun({ code, stdout, stderr }));
		},
	);
}

test("rejects public path, credential, prompt and seed violations", () => {
	// Given public requests, including attempts to inject private worker settings.
	const good = {
		assetId: "unimate-example-eagle",
		prompt: "Walk forward.",
		seed: 7,
	};
	const invalid = [
		{ ...good, output: "C:/escape" },
		{ ...good, apiKey: "canary" },
		{ ...good, prompt: " " },
		{ ...good, prompt: "x".repeat(2001) },
		{ ...good, seed: -1 },
		{ ...good, seed: 1.5 },
		{ ...good, seed: 2147483648 },
	];
	// When each request crosses the public boundary, then invalid requests fail.
	for (const request of invalid)
		expect(unimateRequestSchema.safeParse(request).success).toBe(false);
});

test("validates actual subprocess NPY and manifest output and rejects corrupt, missing and stale artifacts", async () => {
	// Given a synthetic prepared skeleton in an isolated root (no source/model/GPU).
	const pythonCommand = await cpuTestPython(pythonKey);
	const directory = await mkdtemp(join(tmpdir(), "unimate-contract-"));
	try {
		const root = await realpath(directory);
		const source = root;
		const assetDirectory = root;
		const identityProbe = await run({
			executable: pythonCommand,
			args: [
				"-I",
				"-c",
				`import json,numpy as np,sys,pathlib,hashlib
p=pathlib.Path(sys.argv[1]); names=['joint'+str(i) for i in range(51)]
c=dict(joint_names=names,parents=np.arange(51,dtype=np.int64)-1,tpos_first_frame=np.zeros((51,12)),tpos_global_rotations=np.zeros((51,3,3)))
np.save(p/'cond.npy',{'Eagle':c}); (p/'Eagle.glb').write_bytes(b'fixture-canonical')
h=hashlib.sha1(json.dumps(names).encode()); h.update(c['parents'].tobytes()); h.update(c['tpos_first_frame'].tobytes()); h.update(c['tpos_global_rotations'].tobytes())
print(json.dumps(dict(python=str(pathlib.Path(sys.executable).resolve()),jointNames=names,frameDigest=h.hexdigest())))`,
				root,
			],
			cwd: source,
			env: Object.fromEntries(
				Object.entries(process.env).filter(
					(entry): entry is [string, string] => entry[1] !== undefined,
				),
			),
			shell: false,
		});
		expect(identityProbe.code, identityProbe.stderr).toBe(0);
		const identity = identitySchema.parse(JSON.parse(identityProbe.stdout));
		const python = await realpath(identity.python);
		const checkpoint = join(root, "checkpoint.pt");
		await writeFile(checkpoint, "fixture-checkpoint-not-a-model");
		await writeFile(join(root, "config.json"), "{}");
		await writeFile(
			join(root, "dataset_stats.npy"),
			"fixture-stats-not-loaded",
		);
		const pinPaths = [
			python,
			worker,
			checkpoint,
			join(root, "config.json"),
			join(root, "dataset_stats.npy"),
			`${assetDirectory}/cond.npy`,
			`${assetDirectory}/Eagle.glb`,
		];
		const pins = await Promise.all(
			pinPaths.map(async (path) => ({
				path,
				sha256: createHash("sha256")
					.update(await readFile(path))
					.digest("hex"),
			})),
		);
		const config: UniMateConfig = {
			python,
			worker,
			source,
			sourceRevision: "b78c7807df7cf4231d4e67f8d0ece29c5e11025b",
			runtimeId: "task15-python310-cpu-fixture",
			expDir: root,
			checkpoint,
			outputRoot: root,
			hfHome: root,
			pins,
			assets: {
				"unimate-example-eagle": {
					directory: assetDirectory,
					condPath: `${assetDirectory}/cond.npy`,
					condKey: "Eagle",
					canonicalGlb: `${assetDirectory}/Eagle.glb`,
					jointNames: identity.jointNames,
					frameDigest: identity.frameDigest,
					features: 12,
				},
			},
		};
		const input = {
			assetId: "unimate-example-eagle",
			prompt: " \t--literal; no shell 한글\n ",
			seed: 19,
		};
		await expect(
			prepareUniMate({ ...input, assetId: "unknown" }, config),
		).rejects.toThrow("UNIMATE_ASSET_UNKNOWN");
		const prepared = await prepareUniMate(input, config);
		expect(
			JSON.parse(await readFile(prepared.requestPath, "utf8")).request.prompt,
		).toBe(input.prompt);
		const offlineKey = "HF_HUB_OFFLINE";
		const credentialKey = "OPENAI_API_KEY";
		expect(prepared.generation.env[offlineKey]).toBe("1");
		expect(prepared.generation.env[credentialKey]).toBeUndefined();
		// Actual numpy writes, using the upstream manifest layout, not a fake validator reply.
		const fixtureCode = `import json,sys,pathlib,numpy as np,os
p=pathlib.Path(sys.argv[1]); mode=sys.argv[2]; j=json.loads(p.read_text(encoding='utf-8')); a=j['asset']; out=pathlib.Path(j['output']); (out/'motions').mkdir(parents=True,exist_ok=True)
m=np.zeros((3,len(a['jointNames']),a['features']),dtype=np.float32); m[1:]=1
if mode=='nan': m[0,0,0]=np.nan
if mode=='static': m[:]=0
if mode=='shape': m=m[:,:2,:]
f=out/'motions'/'Eagle-fixture.npy'; np.save(f,m)
manifest={'format':'unimate-samples/1','motions_dir':'motions','runs':[{'exp_dir':j['expDir'],'checkpoint':j['checkpoint'],'seed':j['request']['seed'],'mode':'text'}],'assets':{a['condKey']:{'cond_path':a['condPath'],'cond_key':a['condKey'],'canonical_glb':a['canonicalGlb'],'joint_names':a['jointNames'],'frame_digest':a['frameDigest']}},'samples':{f.name:{'asset':a['condKey'],'prompt':j['request']['prompt'],'kind':'sample','run':0,'frame_digest':a['frameDigest']}}}
if mode=='identity': manifest['assets'][a['condKey']]['joint_names']=list(reversed(a['jointNames']))
if mode=='seed': manifest['runs'][0]['seed']+=1
if mode=='frame': manifest['samples'][f.name]['frame_digest']='0'*40
(out/'manifest.json').write_text(json.dumps(manifest))
if mode=='stale': os.utime(f,ns=(1,1))
if mode=='missing': f.unlink()
if mode=='corrupt': f.write_bytes(b'not-npy')
`;
		for (const mode of [
			"good",
			"nan",
			"static",
			"shape",
			"identity",
			"seed",
			"frame",
			"stale",
			"missing",
			"corrupt",
		]) {
			// When the real CPU worker parses each independent fixture mutation.
			const fixture = await run({
				...prepared.validation,
				args: ["-I", "-c", fixtureCode, prepared.requestPath, mode],
			});
			expect(fixture.code, fixture.stderr).toBe(0);
			const result = await run(prepared.validation);
			// Then only matching, finite, nonstatic fresh output is publishable.
			if (mode === "good") {
				expect(result.stderr).toBe("");
				expect(result.code).toBe(0);
				const receipt = await collectUniMate(prepared, result.stdout);
				expect([receipt.frames, receipt.joints, receipt.features]).toEqual([
					3, 51, 12,
				]);
				await writeFile(
					join(prepared.directory, "samples/motions/Eagle-fixture.npy"),
					"changed",
				);
				await expect(collectUniMate(prepared, result.stdout)).rejects.toThrow(
					"UNIMATE_ARTIFACT_CHANGED",
				);
			} else expect(result.code).not.toBe(0);
		}
		// Generation refuses an existing samples directory before importing the GPU sampler.
		const duplicate = await run(prepared.generation);
		expect(duplicate.code).not.toBe(0);
		expect(duplicate.stderr).toContain("FileExistsError");
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}, 120000);
