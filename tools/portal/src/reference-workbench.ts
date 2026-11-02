import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import {
	comfySourceReceiptSchema,
	prepareComfySource,
	verifyComfyEvidence,
} from "./comfyui-provider.ts";
import {
	buildNativeMossContextRequest,
	verifyNativeMossContextResponse,
} from "./native-moss-context.ts";
import {
	nativeMossPackageFiles,
	nativeMossPackageRoot,
} from "./native-moss-package.ts";
import type { NativeMossProviderAuthority } from "./native-moss-provider.ts";
import {
	type NativeMossResultArtifact,
	type NativeMossResultExpected,
	verifyNativeMossResult,
} from "./native-moss-result.ts";
import { transport as nativeContextTransport } from "./native-moss-transport.ts";
import { measurePng } from "./png.ts";
import { verifyPortraitDeliveryV2 } from "./portrait-size.ts";
import {
	createReferenceManifest,
	type ObservationReceipt,
	recordReferenceObservation,
} from "./reference-analysis.ts";
import retainedAnalysis from "./reference-analysis-retained.json" with {
	type: "json",
};
import {
	type ReferenceGenerationRequest,
	referenceGenerationRequestSchema,
	resolveReferenceSource,
	resolveSourceRecipe,
	type SourceAcquisition,
} from "./reference-contract.ts";
import {
	createOwnerDirective,
	resolveReferenceIntent,
} from "./reference-intent.ts";
import {
	prepareReferenceProviderV2,
	type ReferenceSemanticReview,
} from "./reference-provider.ts";
import { generationSheetFromBytes, hash } from "./sources.ts";

// Independent CPU preflight from server-retained bytes. No native model import,
// inference, browser proof, or worker execution-response expectation copying.
export async function prepareNativeMossDispatchProof(
	request: ReferenceGenerationRequest,
	authority: NativeMossProviderAuthority,
	options: {
		signal?: AbortSignal;
		remoteContext?: typeof nativeContextTransport.preflightContext;
		platform?: NodeJS.Platform;
	} = {},
): Promise<NonNullable<NativeMossProviderAuthority["dispatchProof"]>> {
	if (
		(options.remoteContext || options.platform) &&
		process.env.NODE_ENV !== "test"
	)
		throw Error("NATIVE_TEST_INJECTION_FORBIDDEN");
	if ((options.platform ?? process.platform) !== "win32") {
		try {
			const pending = await buildNativeMossContextRequest(request, authority);
			const response = await (
				options.remoteContext ?? nativeContextTransport.preflightContext
			)(pending.bytes, options.signal ? { signal: options.signal } : {});
			return verifyNativeMossContextResponse(pending, response);
		} catch (error) {
			const code =
				error instanceof Error && /^[A-Z][A-Z0-9_]+$/.test(error.message)
					? error.message
					: "NATIVE_SERVER_CONTEXT_UNAVAILABLE";
			throw Object.assign(Error(code), { status: 503 });
		}
	}
	const root = nativeMossPackageRoot(import.meta.url);
	await nativeMossPackageFiles(fileURLToPath(root));
	const manifest = JSON.parse(
		(await readFile(new URL("manifest.json", root))).toString(),
	);
	const names = [
		"content_v1.py",
		"context_v1.py",
		"runtime.py",
		"native_runner_v1.py",
		"reference_pipeline_recipes.py",
	];
	const sources: Record<string, string> = {};
	for (const name of names) {
		const bytes = await readFile(new URL(name, root));
		if (
			hash(bytes) !== manifest.files[name]?.sha256 ||
			bytes.length !== manifest.files[name]?.size
		)
			throw Error("NATIVE_SERVER_PREFLIGHT_SOURCE_CHANGED");
		sources[name] = bytes.toString("base64");
	}
	const evidence = z
		.object({
			tokenBytes: z.instanceof(Uint8Array),
			recipientImage: z.object({ bytes: z.instanceof(Uint8Array) }).nullable(),
		})
		.parse(authority.serverEvidence);
	const code = `import sys,json,base64,ast,subprocess,os,pathlib,hashlib
v=json.loads(sys.stdin.buffer.read(33554432));src={k:base64.b64decode(b) for k,b in v['sources'].items()}
def assignments(name,keys):
 ns={}
 for n in ast.parse(src[name]).body:
  if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id in keys for t in n.targets):exec(compile(ast.Module(body=[n],type_ignores=[]),name,'exec'),ns)
 return ns
r=assignments('runtime.py',('TRAINING','CONFIG','TOKENIZER'));token=json.loads(base64.b64decode(v['token']))
ns={};exec(compile(src['content_v1.py'],'<pinned-content>','exec'),ns)
c=ns['compile_content'](token) if v['mode']=='token-only' else {'text':'seoul dengoku portrait style, preserve the source person, outfit, composition and gaze; change only the drawing style','fields':[],'holds':[]}
assert not c['holds'],'NATIVE_CONTENT_HOLD'
pins={}
for name in ('native_runner_v1.py','reference_pipeline_recipes.py'):pins.update(assignments(name,('SOURCE_PINS',))['SOURCE_PINS'])
for rel,pin in pins.items():
 measured=hashlib.sha256((pathlib.Path(r['CONFIG']['toolkit'])/rel).read_bytes()).hexdigest();assert measured==pin,'NATIVE_SERVER_SOURCE_DRIFT';pins[rel]=measured
input={'tokenizerFolder':r['TOKENIZER'],'toolkit':r['CONFIG']['toolkit'],'mossSourceSHA256':pins['extensions_built_in/diffusion_models/moss_image/moss_image.py'],'prompts':[{'personId':v['person'],'text':c['text']}],'negative':''}
raw=json.dumps(input,ensure_ascii=False).encode('utf-8')
script='import sys,json,base64;n={};exec(compile(base64.b64decode('+repr(v['sources']['context_v1.py'])+'),"<pinned-context>","exec"),n);n["tokenizer_cpu"](json.loads(sys.stdin.buffer.read()))'
env={**os.environ,'CUDA_VISIBLE_DEVICES':'','USE_TORCH':'0','USE_TF':'0','USE_FLAX':'0','HF_HUB_OFFLINE':'1','TRANSFORMERS_OFFLINE':'1'}
out=subprocess.run([sys.executable,'-I','-B','-c',script],input=raw,capture_output=True,check=True,timeout=180,env=env).stdout
out.decode('utf-8',errors='strict');context=json.loads(out);assert context['maxTextLength']==4096 and context['truncation'] is False and context['modelLoaded'] is False
print(json.dumps({'compiled':c,'sourcePins':pins,'contextInput':input,'contextInputBytes':base64.b64encode(raw).decode(),'contextResponseBytes':base64.b64encode(out).decode()}))`;
	const output = await new Promise<Buffer>((resolve, reject) => {
		const child = spawn(
			process.platform === "win32"
				? "E:/git/linalab/PNGAL/environment/venvs/ai-toolkit/Scripts/python.exe"
				: "python3",
			["-I", "-B", "-c", code],
			{ stdio: ["pipe", "pipe", "pipe"] },
		);
		const chunks: Buffer[] = [];
		let size = 0,
			failed = false;
		const timer = setTimeout(() => {
			failed = true;
			child.kill("SIGKILL");
		}, 190000);
		child.stdout.on("data", (chunk: Buffer) => {
			size += chunk.length;
			if (size > 8 * 1024 * 1024) {
				failed = true;
				child.kill("SIGKILL");
			} else chunks.push(chunk);
		});
		child.stderr.resume();
		child.stdin.on("error", () => {
			failed = true;
			child.kill("SIGKILL");
		});
		child.on("error", () => {
			failed = true;
		});
		child.once("close", (code) => {
			clearTimeout(timer);
			if (failed || code !== 0)
				reject(
					Object.assign(Error("NATIVE_SERVER_CONTEXT_UNAVAILABLE"), {
						status: 503,
					}),
				);
			else resolve(Buffer.concat(chunks));
		});
		child.stdin.end(
			JSON.stringify({
				sources,
				token: Buffer.from(evidence.tokenBytes).toString("base64"),
				person: request.personId,
				mode: request.inputMode,
			}),
		);
	});
	const observed = JSON.parse(
		new TextDecoder("utf-8", { fatal: true }).decode(output),
	);
	return {
		requestSHA256: hash(Buffer.from(JSON.stringify(request))),
		snapshotHashes: {
			detail: hash(authority.detailBytes),
			token: hash(evidence.tokenBytes),
			...(evidence.recipientImage
				? { original: hash(evidence.recipientImage.bytes) }
				: {}),
		},
		sourcePins: observed.sourcePins,
		attestation: {
			compiled: observed.compiled,
			workerPins: {
				runtime: manifest.files["runtime.py"],
				lifecycle: manifest.files["lifecycle.py"],
			},
			contextInput: observed.contextInput,
			contextInputBytes: Buffer.from(observed.contextInputBytes, "base64"),
			contextResponseBytes: Buffer.from(
				observed.contextResponseBytes,
				"base64",
			),
		},
	};
}

// Native results use their own retained evidence, never Comfy/CPA wire receipts.
export async function verifyNativeMossWorkbenchResult(
	read: (name: string) => Promise<Buffer>,
	requestId: string,
) {
	const request = referenceGenerationRequestSchema.parse(
		JSON.parse((await read("request-payload.json")).toString()),
	);
	if (request.requestId !== requestId || request.provider !== "native-moss")
		throw Error("RESULT_EVIDENCE_MISMATCH");
	let expected: NativeMossResultExpected;
	let artifacts: NativeMossResultArtifact[];
	try {
		expected = JSON.parse(
			(await read("native-expected.json")).toString(),
		).expected;
		for (const key of ["contextInputBytes", "contextResponseBytes"] as const) {
			const stored = expected.attestation[key] as unknown;
			if (typeof stored === "string") {
				const bytes = Buffer.from(stored, "base64");
				if (bytes.toString("base64") !== stored)
					throw Error("NATIVE_RESULT_UNVERIFIED");
				expected.attestation[key] = bytes;
			} else if (!(stored instanceof Uint8Array)) {
				const bytes = z
					.object({
						type: z.literal("Buffer"),
						data: z.array(z.number().int().min(0).max(255)),
					})
					.parse(stored);
				expected.attestation[key] = Buffer.from(bytes.data);
			}
		}
		const retained = z
			.array(z.strictObject({ name: z.string(), byteBase64: z.string() }))
			.parse(JSON.parse((await read("native-artifacts.json")).toString()));
		artifacts = retained.map((file) => {
			const bytes = Buffer.from(file.byteBase64, "base64");
			if (bytes.toString("base64") !== file.byteBase64)
				throw Error("NATIVE_RESULT_UNVERIFIED");
			return { name: file.name as NativeMossResultArtifact["name"], bytes };
		});
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT")
			throw Object.assign(Error("NATIVE_RESULT_ATTESTATION_MISSING"), {
				status: 409,
			});
		throw error;
	}
	if (
		expected.requestId !== requestId ||
		expected.mode !== request.inputMode ||
		expected.recipe !== request.nativeRecipe
	)
		throw Error("NATIVE_RESULT_UNVERIFIED");
	const checked = verifyNativeMossResult(expected, artifacts);
	if (hash(await read("candidate.png")) !== checked.finalSHA256)
		throw Error("NATIVE_RESULT_UNVERIFIED");
	return {
		schema: "portal-generated-result.v1",
		jobId: requestId,
		provider: "native-moss",
		providerModel: request.providerModel,
		nativeRecipe: request.nativeRecipe,
		state: "HOLD",
		reviewStatus: "HOLD",
		approval: "NONE",
		qualityQualified: false,
		pngSHA: checked.finalSHA256,
		finalBytes: checked.finalBytes,
	};
}

export function referenceAuthority(
	request: ReferenceGenerationRequest,
	acquisition: SourceAcquisition,
) {
	if (
		acquisition.status !== "acquired" &&
		acquisition.status !== "intentional-absence"
	)
		throw Object.assign(Error(acquisition.errorCode), {
			status: acquisition.httpStatus,
		});
	const generation = acquisition.generation;
	const serverEvidence = {
		status: "available" as const,
		recipient: {
			personId: generation.personId,
			characterId: generation.characterId,
			...(request.sheetId ? { sheetId: request.sheetId } : {}),
		},
		tokenBytes: generation.tokenBytes,
		tokenSHA256: generation.tokenSHA256,
		recipientImage:
			generation.recipientImage === null
				? null
				: {
						personId: generation.personId,
						characterId: generation.characterId,
						sourceSHA256: generation.recipientImage.sourceSHA256,
						bytes: generation.recipientImage.bytes,
					},
	};
	if (acquisition.status === "intentional-absence")
		return {
			serverEvidence,
			records: null,
			semanticReview: null,
			retainedAnalysis: null,
		};
	const { manifest } = createReferenceManifest(acquisition);
	const prior =
		manifest.sha256 ===
		retainedAnalysis.observationReceipt.value.referenceManifestSHA256
			? retainedAnalysis
			: null;
	const observation = prior
		? (prior.observationReceipt as ObservationReceipt)
		: recordReferenceObservation({ manifest });
	const records = resolveReferenceIntent({
		acquisition,
		manifest,
		observation,
		directive: createOwnerDirective(request, manifest),
	});
	return {
		serverEvidence,
		records,
		semanticReview: prior
			? (prior.semanticReview as ReferenceSemanticReview)
			: null,
		retainedAnalysis: prior,
	};
}

export function referenceSummary(
	request: ReferenceGenerationRequest,
	acquisition: SourceAcquisition,
) {
	const authority = referenceAuthority(request, acquisition);
	return {
		schemaVersion: 2,
		inputMode: request.inputMode,
		sourceStatus: acquisition.status,
		sourceSelection: request.sourceSelection,
		explicitEdits: request.explicitEdits,
		...(request.sourceRecipe === undefined
			? {}
			: { sourceRecipe: resolveSourceRecipe(request.sourceRecipe) }),
		preservedProperties:
			request.inputMode === "reference-img2img"
				? ["person", "outfit", "composition", "gaze"]
				: [],
		analysisStatus: "UNQUALIFIED",
		accuracy: "NOT_ESTABLISHED",
		modelSnapshotStatus: "NOT_EXPOSED",
		semanticReview: authority.semanticReview,
		conflicts: authority.records?.intent.value.conflicts ?? [],
		ownerApproval: "NONE",
		qualityQualified: false,
	};
}

// A distinct v2 result verifier: never invent legacy projection evidence for a
// source edit. Every check uses the retained request, source and wire artifacts.
export async function verifyReferenceWorkbenchResult(
	read: (name: string) => Promise<Buffer>,
	requestId: string,
) {
	const files: Record<string, string> = {};
	const load = async (name: string) => {
		const bytes = await read(name);
		files[name] = hash(bytes);
		return bytes;
	};
	const json = async (name: string): Promise<unknown> =>
		JSON.parse((await load(name)).toString());
	const request = referenceGenerationRequestSchema.parse(
		await json("request-payload.json"),
	);
	if (
		request.requestId !== requestId ||
		request.inputMode !== "reference-img2img"
	)
		throw Error("RESULT_EVIDENCE_MISMATCH");
	const sources = z
		.object({ detail: z.string(), token: z.string(), image: z.string() })
		.parse(await json("source-bytes.json"));
	const retained = {
		detail: Buffer.from(sources.detail, "base64"),
		token: Buffer.from(sources.token, "base64"),
		image: Buffer.from(sources.image, "base64"),
	};
	const sheet = generationSheetFromBytes(
		retained.detail,
		retained.token,
		retained.image,
	);
	const acquisition = resolveReferenceSource(request, {
		status: "available",
		recipient: {
			personId: sheet.personId,
			characterId: sheet.characterId,
			...(request.sheetId ? { sheetId: request.sheetId } : {}),
		},
		tokenBytes: retained.token,
		tokenSHA256: hash(retained.token),
		recipientImage: {
			personId: sheet.personId,
			characterId: sheet.characterId,
			sourceSHA256: hash(retained.image),
			bytes: retained.image,
		},
	});
	const authority = referenceAuthority(request, acquisition);
	const provenance = z
		.object({
			requestId: z.string(),
			original: z.unknown(),
			reference: z.unknown(),
		})
		.parse(await json("provenance.json"));
	if (
		provenance.requestId !== requestId ||
		!isDeepStrictEqual(provenance.original, sheet.sourceHashes) ||
		!isDeepStrictEqual(
			provenance.reference,
			referenceSummary(request, acquisition),
		)
	)
		throw Error("SOURCE_SNAPSHOT_MISMATCH");
	const png = await load("candidate.png");
	const deliveryReceiptBytes = await load("candidate.png.receipt.json");
	const canonicalReceiptBytes = await load("provider-canonical.receipt.json");
	const sourceBytes = await load("provider-source.png");
	const metrics = measurePng(png);
	if (metrics.width !== 340 || metrics.height !== 510)
		throw Error("RESULT_EVIDENCE_MISMATCH");
	let nativeBytes: Uint8Array;
	let rawBytes: Uint8Array;
	if (request.provider === "openai-compatible") {
		if (!authority.records) throw Error("REFERENCE_NOT_ACQUIRED");
		const prepared = prepareReferenceProviderV2(request, {
			...authority,
			records: authority.records,
		});
		nativeBytes = prepared.conditions.orderedImageBytes[0];
		rawBytes = sourceBytes;
		const canonical = z
			.object({
				requestId: z.string(),
				responseSHA: z.string(),
				responseBodySHA256: z.string(),
				modelAttestation: z.literal("MATCH"),
				returnedModel: z.literal("gpt-image-2.5-sunburst"),
				provenance: z.unknown(),
				wire: z.object({ contentType: z.string(), sha256: z.string() }),
			})
			.parse(JSON.parse(canonicalReceiptBytes.toString()));
		if (
			canonical.requestId !== requestId ||
			canonical.responseSHA !== hash(sourceBytes) ||
			!isDeepStrictEqual(canonical.provenance, prepared.provenance)
		)
			throw Error("RESULT_EVIDENCE_MISMATCH");
		const wire = await load("provider-source.png.request.bin");
		if (hash(wire) !== canonical.wire.sha256)
			throw Error("RESULT_EVIDENCE_MISMATCH");
		const form = await new Request("http://localhost/retained", {
			method: "POST",
			headers: { "content-type": canonical.wire.contentType },
			body: wire,
		}).formData();
		const image = form.getAll("image[]");
		if (
			image.length !== 1 ||
			!(image[0] instanceof Blob) ||
			hash(new Uint8Array(await image[0].arrayBuffer())) !==
				hash(nativeBytes) ||
			form.get("prompt") !==
				prepared.conditions.prompt.replace(/\n/g, "\r\n") ||
			form.get("model") !== request.providerModel ||
			form.get("size") !==
				(request.generationProfile === "cpa340-padded-v1"
					? "640x1024"
					: request.generationProfile
						? "340x510"
						: "1024x1536")
		)
			throw Error("RESULT_EVIDENCE_MISMATCH");
		const response = await load("provider-source.png.response.bin");
		const envelope = z
			.object({
				model: z.literal("gpt-image-2.5-sunburst"),
				data: z.tuple([z.object({ b64_json: z.string() })]),
			})
			.parse(JSON.parse(response.toString()));
		if (
			hash(response) !== canonical.responseBodySHA256 ||
			hash(Buffer.from(envelope.data[0].b64_json, "base64")) !==
				hash(sourceBytes)
		)
			throw Error("RESULT_EVIDENCE_MISMATCH");
	} else {
		const sourceInput = {
			request,
			serverEvidence: authority.serverEvidence,
			denoise: resolveSourceRecipe(request.sourceRecipe).denoise,
		};
		const retainedNative = {
			rgbaBytes: await load("reference-native.png"),
			rgbBytes: await load("reference-conditioning.png"),
			receiptBytes: await load("reference-transform.json"),
		};
		const prepared = prepareComfySource(sourceInput, retainedNative);
		nativeBytes = prepared.native.rgbaBytes;
		const finishingImages = {
			rawBytes: await load("provider-raw.png"),
			maskBytes: await load("provider-mask.png"),
			rawMaskBytes: await load("provider-raw-mask.png"),
		};
		rawBytes = finishingImages.rawBytes;
		verifyComfyEvidence({
			receipt: comfySourceReceiptSchema.parse(
				JSON.parse(canonicalReceiptBytes.toString()),
			),
			sourceInput,
			retainedNative,
			conditioningBytes: await load("reference-conditioning.png"),
			nativeBytes: await load("provider-native.png"),
			sourceBytes,
			requestBytes: await load("comfy-request.json"),
			historyBytes: await load("comfy-history.json"),
			assetProofBytes: await load("comfy-assets.json"),
			finishingProofBytes: await load("comfy-finishing-assets.json"),
			finishingImages,
		});
	}
	const alpha = verifyPortraitDeliveryV2({
		...(request.generationProfile
			? { generationProfile: request.generationProfile }
			: {}),
		engine: request.provider === "comfyui" ? "comfyui" : "cpa",
		originalBytes: retained.image,
		nativeBytes,
		rawBytes,
		finishedBytes: sourceBytes,
		canonicalReceiptBytes,
		deliveryBytes: png,
		deliveryReceiptBytes,
	});
	return { files, retained, metrics, alpha };
}
