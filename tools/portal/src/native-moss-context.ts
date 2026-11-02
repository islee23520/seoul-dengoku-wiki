import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import {
	NATIVE_MOSS_MODEL,
	NATIVE_MOSS_PROFILE_DIGEST,
} from "./native-moss-contract.ts";
import {
	nativeMossPackageFiles,
	nativeMossPackageRoot,
} from "./native-moss-package.ts";
import type { NativeMossProviderAuthority } from "./native-moss-provider.ts";
import {
	referenceGenerationRequestSchema,
	resolveReferenceSource,
} from "./reference-contract.ts";
import { hash } from "./sources.ts";

export const NATIVE_MOSS_CONTEXT_BUNDLE =
	"8f52f75bb4fe62ffceb0cadacbeed34c6175bebf8ade9644d1337a3ab94f8218";
const sha = z.string().regex(/^[a-f0-9]{64}$/);
const pin = z.strictObject({
	sha256: sha,
	size: z.number().int().positive().max(2097152),
});
const blobSchema = z.strictObject({
	byteBase64: z.string().max(2796204),
	sha256: sha,
	size: z.number().int().positive().max(2097152),
});
const tokenizerPins = {
	"tokenizer.json":
		"06b9509352d2af50381ab2247e083b80d32d5c0aba91c272ca9ff729b6a0e523",
	"tokenizer_config.json":
		"bee8eba30f0eb4af73c0fe2cd06d0f89b657d7819941c438157ec42f7c80ea87",
	"chat_template.jinja":
		"a4aee8afcf2e0711942cf848899be66016f8d14a889ff9ede07bca099c28f715",
};
const compilerSchema = z
	.object({
		text: z.string().max(2097152),
		fields: z.array(z.unknown()),
		holds: z.array(z.unknown()),
	})
	.passthrough();
const requestSchema = z.strictObject({
	schema: z.literal("native-moss-context-command.v1"),
	operation: z.literal("preflightContext"),
	requestId: z.uuid(),
	nonce: z.uuid(),
	ownerBindingHash: sha,
	requestSHA256: sha,
	profileDigest: z.literal(NATIVE_MOSS_PROFILE_DIGEST),
	bundleSHA256: z.literal(NATIVE_MOSS_CONTEXT_BUNDLE),
	mode: z.enum(["reference-img2img", "token-only"]),
	personId: z.string().regex(/^person-\d+$/),
	detail: blobSchema,
	token: blobSchema,
	originalSHA256: sha.nullable(),
	compilerSHA256: sha,
});
const responseSchema = z.strictObject({
	schema: z.literal("native-moss-context-proof.v1"),
	requestId: z.uuid(),
	nonce: z.uuid(),
	ownerBindingHash: sha,
	requestSHA256: sha,
	contextRequestSHA256: sha,
	profileDigest: z.literal(NATIVE_MOSS_PROFILE_DIGEST),
	bundleSHA256: z.literal(NATIVE_MOSS_CONTEXT_BUNDLE),
	helperPins: z.strictObject({
		content: pin,
		context: pin,
		runtime: pin,
		lifecycle: pin,
	}),
	compiled: compilerSchema,
	sourcePins: z.record(z.string(), sha),
	contextInput: blobSchema,
	contextResponse: blobSchema,
	modelLoaded: z.literal(false),
	generationDispatched: z.literal(false),
});
const utf8 = (bytes: Uint8Array) =>
	new TextDecoder("utf-8", { fatal: true }).decode(bytes);
const same = (actual: unknown, expected: unknown) => {
	if (!isDeepStrictEqual(actual, expected))
		throw Error("NATIVE_CONTEXT_BINDING_MISMATCH");
};
const blob = (bytes: Uint8Array) =>
	blobSchema.parse({
		byteBase64: Buffer.from(bytes).toString("base64"),
		sha256: hash(bytes),
		size: bytes.length,
	});
function decoded(value: z.infer<typeof blobSchema>) {
	const bytes = Buffer.from(value.byteBase64, "base64");
	if (
		bytes.toString("base64") !== value.byteBase64 ||
		bytes.length !== value.size ||
		hash(bytes) !== value.sha256
	)
		throw Error("NATIVE_CONTEXT_BYTES_MISMATCH");
	utf8(bytes);
	return bytes;
}
const expectations = new WeakMap<
	object,
	{
		frame: z.infer<typeof requestSchema>;
		compiled: z.infer<typeof compilerSchema>;
		contextInput: Record<string, unknown>;
		sourcePins: Record<string, string>;
		helperPins: z.infer<typeof responseSchema>["helperPins"];
	}
>();
export type NativeMossContextRequest = Readonly<{ bytes: Uint8Array }>;

// Production CPU builder, no SSH and no installed model imports. Expected
// compiler/context values are derived BEFORE remote work, never from execution.
export async function buildNativeMossContextRequest(
	input: unknown,
	authority: NativeMossProviderAuthority,
): Promise<NativeMossContextRequest> {
	const request = referenceGenerationRequestSchema.parse(input);
	if (
		request.provider !== "native-moss" ||
		request.providerModel !== NATIVE_MOSS_MODEL ||
		request.sheetId
	)
		throw Error("NATIVE_CONTEXT_REQUEST_UNSUPPORTED");
	sha.parse(authority.ownerBindingHash);
	const source = resolveReferenceSource(request, authority.serverEvidence);
	if (!source.generation) throw Error(source.errorCode);
	const generation = source.generation;
	const detailBytes = Buffer.from(authority.detailBytes);
	const tokenBytes = Buffer.from(generation.tokenBytes);
	const detail = z
		.object({ id: z.string(), characterId: z.string(), name: z.string() })
		.parse(JSON.parse(utf8(detailBytes)));
	const token = z
		.object({ personId: z.string(), characterId: z.string(), name: z.string() })
		.passthrough()
		.parse(JSON.parse(utf8(tokenBytes)));
	same(
		[detail.id, detail.characterId, detail.name],
		[generation.personId, generation.characterId, token.name],
	);
	same([token.personId, token.characterId], [detail.id, detail.characterId]);
	const root = nativeMossPackageRoot(import.meta.url);
	const files = await nativeMossPackageFiles(fileURLToPath(root));
	const manifestBytes = files.find(
		(file) => file.path === "private/native-moss/manifest.json",
	)?.data;
	if (!manifestBytes) throw Error("NATIVE_CONTEXT_BUNDLE_MISSING");
	const manifest = JSON.parse(utf8(manifestBytes));
	same(manifest.implementationSHA256, NATIVE_MOSS_CONTEXT_BUNDLE);
	const sources: Record<string, string> = {};
	for (const name of [
		"content_v1.py",
		"runtime.py",
		"native_runner_v1.py",
		"reference_pipeline_recipes.py",
	]) {
		const file = files.find(
			(file) => file.path === `private/native-moss/${name}`,
		);
		if (!file) throw Error("NATIVE_CONTEXT_HELPER_MISSING");
		sources[name] = file.data.toString("base64");
	}
	const code = `import ast,base64,hashlib,json,sys
v=json.loads(sys.stdin.buffer.read(8388609));src={k:base64.b64decode(b) for k,b in v['sources'].items()}
def values(name,keys):
 ns={}
 for n in ast.parse(src[name]).body:
  if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id in keys for t in n.targets):exec(compile(ast.Module(body=[n],type_ignores=[]),name,'exec'),ns)
 return ns
r=values('runtime.py',('TRAINING','CONFIG','TOKENIZER'));ref=values('reference_pipeline_recipes.py',('PROMPT','SOURCE_PINS'));native=values('native_runner_v1.py',('SOURCE_PINS',))
ns={};exec(compile(src['content_v1.py'],'<pinned-server-content>','exec'),ns)
c=ns['compile_content'](json.loads(base64.b64decode(v['tokenBase64'],validate=True).decode('utf-8',errors='strict'))) if v['mode']=='token-only' else {'text':ref['PROMPT'],'fields':[],'holds':[]}
assert not c['holds'],'NATIVE_CONTENT_HOLD'
input={'tokenizerFolder':r['TOKENIZER'],'toolkit':r['CONFIG']['toolkit'],'mossSourceSHA256':native['SOURCE_PINS']['extensions_built_in/diffusion_models/moss_image/moss_image.py'],'prompts':[{'personId':v['person'],'text':c['text']}],'negative':''}
print(json.dumps({'compiled':c,'compilerSHA256':hashlib.sha256(json.dumps(c,ensure_ascii=False,separators=(',',':')).encode('utf-8')).hexdigest(),'contextInput':input,'sourcePins':{**native['SOURCE_PINS'],**ref['SOURCE_PINS']}},ensure_ascii=False))`;
	const raw = await new Promise<Buffer>((resolve, reject) => {
		const child = spawn("python3", ["-I", "-B", "-c", code], {
			stdio: ["pipe", "pipe", "pipe"],
		});
		const chunks: Buffer[] = [];
		let size = 0,
			failed = false;
		const timer = setTimeout(() => {
			failed = true;
			child.kill("SIGKILL");
		}, 10000);
		child.stdout.on("data", (chunk: Buffer) => {
			size += chunk.length;
			if (size > 4194304) {
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
				reject(Error("NATIVE_CONTEXT_COMPILER_UNAVAILABLE"));
			else resolve(Buffer.concat(chunks));
		});
		child.stdin.end(
			JSON.stringify({
				sources,
				mode: request.inputMode,
				person: generation.personId,
				tokenBase64: tokenBytes.toString("base64"),
			}),
		);
	});
	const local = z
		.strictObject({
			compiled: compilerSchema,
			compilerSHA256: sha,
			contextInput: z.record(z.string(), z.unknown()),
			sourcePins: z.record(z.string(), sha),
		})
		.parse(JSON.parse(utf8(raw)));
	if (local.compiled.holds.length || local.compiled.text.includes("--"))
		throw Error("NATIVE_CONTENT_HOLD");
	const frame = requestSchema.parse({
		schema: "native-moss-context-command.v1",
		operation: "preflightContext",
		requestId: request.requestId,
		nonce: randomUUID(),
		ownerBindingHash: authority.ownerBindingHash,
		requestSHA256: hash(Buffer.from(JSON.stringify(request))),
		profileDigest: NATIVE_MOSS_PROFILE_DIGEST,
		bundleSHA256: NATIVE_MOSS_CONTEXT_BUNDLE,
		mode: request.inputMode,
		personId: generation.personId,
		detail: blob(detailBytes),
		token: blob(tokenBytes),
		originalSHA256: generation.recipientImage?.sourceSHA256 ?? null,
		compilerSHA256: local.compilerSHA256,
	});
	const handle = Object.freeze({ bytes: Buffer.from(JSON.stringify(frame)) });
	expectations.set(handle, {
		frame,
		...local,
		helperPins: {
			content: manifest.files["content_v1.py"],
			context: manifest.files["context_v1.py"],
			runtime: manifest.files["runtime.py"],
			lifecycle: manifest.files["lifecycle.py"],
		},
	});
	return handle;
}

// Only a response to this distinct pre-GPU command is accepted. Native execute
// receipts, browser flags, fabricated READY, and unknown fields cannot authorize.
export function verifyNativeMossContextResponse(
	request: NativeMossContextRequest,
	responseBytes: Uint8Array,
): NonNullable<NativeMossProviderAuthority["dispatchProof"]> {
	const expected = expectations.get(request);
	if (!expected || responseBytes.length > 8388608)
		throw Error("NATIVE_CONTEXT_UNTRUSTED_REQUEST");
	same(JSON.parse(utf8(request.bytes)), expected.frame);
	const response = responseSchema.parse(JSON.parse(utf8(responseBytes)));
	for (const key of [
		"requestId",
		"nonce",
		"ownerBindingHash",
		"requestSHA256",
		"profileDigest",
		"bundleSHA256",
	] as const)
		same(response[key], expected.frame[key]);
	same(response.contextRequestSHA256, hash(request.bytes));
	same(response.helperPins, expected.helperPins);
	same(response.compiled, expected.compiled);
	same(response.sourcePins, expected.sourcePins);
	const inputBytes = decoded(response.contextInput),
		outputBytes = decoded(response.contextResponse);
	same(JSON.parse(utf8(inputBytes)), expected.contextInput);
	const context = z
		.object({
			maxTextLength: z.literal(4096),
			truncation: z.literal(false),
			modelLoaded: z.literal(false),
			wrapper: z.literal("actual installed AST _chat"),
			tokenizerPins: z.record(z.string(), sha),
			sourceSHA256: sha,
			counts: z
				.array(
					z.strictObject({
						personId: z.string(),
						tokens: z.number().int().positive().max(4096),
						chatSHA256: sha,
					}),
				)
				.length(2),
		})
		.strict()
		.parse(JSON.parse(utf8(outputBytes)));
	same(context.tokenizerPins, tokenizerPins);
	same(context.sourceSHA256, expected.contextInput["mossSourceSHA256"]);
	same(
		context.counts.map((row) => row.personId),
		[expected.frame.personId, "negative"],
	);
	return {
		requestSHA256: expected.frame.requestSHA256,
		snapshotHashes: {
			detail: expected.frame.detail.sha256,
			token: expected.frame.token.sha256,
			...(expected.frame.originalSHA256
				? { original: expected.frame.originalSHA256 }
				: {}),
		},
		sourcePins: expected.sourcePins,
		attestation: {
			compiled: expected.compiled,
			workerPins: {
				runtime: expected.helperPins.runtime,
				lifecycle: expected.helperPins.lifecycle,
			},
			contextInput: expected.contextInput,
			contextInputBytes: inputBytes,
			contextResponseBytes: outputBytes,
		},
	};
}
