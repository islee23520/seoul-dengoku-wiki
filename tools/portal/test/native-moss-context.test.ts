import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { encodePng } from "../../portrait/acceptance/src/png.ts";
import {
	buildNativeMossContextRequest,
	verifyNativeMossContextResponse,
} from "../src/native-moss-context.ts";
import { NATIVE_MOSS_MODEL } from "../src/native-moss-contract.ts";
import { hash } from "../src/sources.ts";

const json = (value: unknown) => Buffer.from(JSON.stringify(value));

async function fixture() {
	const image = encodePng({
		width: 1,
		height: 1,
		pixels: new Uint8Array([40, 60, 90, 255]),
	});
	const detail = json({
		id: "person-1003",
		characterId: "K1003",
		name: "서울",
	});
	const token = json({
		personId: "person-1003",
		characterId: "K1003",
		name: "서울",
		image: { path: "/portraits/person-1003.png", sha256: hash(image) },
	});
	const input = {
		schemaVersion: 2,
		requestId: randomUUID(),
		personId: "person-1003",
		provider: "native-moss",
		providerModel: NATIVE_MOSS_MODEL,
		nativeRecipe: "recovery16-native-flow-source025-v1",
		generationProfile: "native340-v1",
		inputMode: "reference-img2img",
		sourceSelection: {
			kind: "selected",
			personId: "person-1003",
			sourceSHA256: hash(image),
		},
		explicitEdits: [],
		size: "340x510",
		faceMode: { kind: "unique", variantId: null },
	};
	const authority = {
		detailBytes: detail,
		ownerBindingHash: "a".repeat(64),
		serverEvidence: {
			status: "available",
			recipient: { personId: "person-1003", characterId: "K1003" },
			tokenBytes: token,
			tokenSHA256: hash(token),
			recipientImage: {
				personId: "person-1003",
				characterId: "K1003",
				sourceSHA256: hash(image),
				bytes: image,
			},
		},
	};
	const request = await buildNativeMossContextRequest(input, authority);
	const frame = JSON.parse(Buffer.from(request.bytes).toString());
	const manifest = JSON.parse(
		await readFile(
			new URL("../native-moss/manifest.json", import.meta.url),
			"utf8",
		),
	);
	const sourcePins = {
		"toolkit/models/base_model.py":
			"53ef134f030d026d6bf740489a113ff73ec9c2c95dea0975dadf4495ab9737e3",
		"toolkit/lora_special.py":
			"dcca49bceb2b5660cd14a53c15ffd0d38ff6a07eb1630f6f69b729132f9d385e",
		"toolkit/network_mixins.py":
			"0c1b621503231a9a7f165f7631ff34f7a888857a6ea0969190d6c05ae50f3e8f",
		"extensions_built_in/diffusion_models/moss_image/moss_image.py":
			"da48fcb10a64d80cc6c3394736094a66e58fc5fa4a27ff9dc6701059e27aecd7",
		"extensions_built_in/diffusion_models/moss_image/src/pipeline.py":
			"6440f4629245063f82f033f120356e0f54946ef5a877e73c469d63041fd267bb",
		"extensions_built_in/diffusion_models/moss_image/src/transformer.py":
			"d9b0918536b0ddc45ed138c48e712c7a2739c437bdbce40e660fd6049fe908c6",
		"toolkit/models/v2/vae/flux2_kl.py":
			"ccdf5a238ff95773d17376d571d1cb3b8af362a9043ac6a2cc6880f2fc5da9ef",
	};
	const text =
		"seoul dengoku portrait style, preserve the source person, outfit, composition and gaze; change only the drawing style";
	const contextInput = {
		tokenizerFolder:
			"C:/Users/oliver/.cache/huggingface/hub/models--OpenMOSS-Team--MOSS-Image-SFT/snapshots/2c7954437269461767f533b006823e8f85973a60/tokenizer",
		toolkit: "E:/git/linalab/PNGAL/environment/ai-toolkit",
		mossSourceSHA256:
			sourcePins[
				"extensions_built_in/diffusion_models/moss_image/moss_image.py"
			],
		prompts: [{ personId: frame.personId, text }],
		negative: "",
	};
	const context = {
		maxTextLength: 4096,
		truncation: false,
		modelLoaded: false,
		wrapper: "actual installed AST _chat",
		tokenizerPins: {
			"tokenizer.json":
				"06b9509352d2af50381ab2247e083b80d32d5c0aba91c272ca9ff729b6a0e523",
			"tokenizer_config.json":
				"bee8eba30f0eb4af73c0fe2cd06d0f89b657d7819941c438157ec42f7c80ea87",
			"chat_template.jinja":
				"a4aee8afcf2e0711942cf848899be66016f8d14a889ff9ede07bca099c28f715",
		},
		sourceSHA256: contextInput.mossSourceSHA256,
		counts: [
			{ personId: frame.personId, tokens: 123, chatSHA256: "b".repeat(64) },
			{ personId: "negative", tokens: 8, chatSHA256: "c".repeat(64) },
		],
	};
	const packed = (bytes: Uint8Array) => ({
		byteBase64: Buffer.from(bytes).toString("base64"),
		sha256: hash(bytes),
		size: bytes.length,
	});
	const output = Buffer.from(
		JSON.stringify(context, null, 2).replaceAll("\n", "\r\n") + "\r\n",
	);
	const response = {
		schema: "native-moss-context-proof.v1",
		...Object.fromEntries(
			[
				"requestId",
				"nonce",
				"ownerBindingHash",
				"requestSHA256",
				"profileDigest",
				"bundleSHA256",
			].map((key) => [key, frame[key]]),
		),
		contextRequestSHA256: hash(request.bytes),
		helperPins: {
			content: manifest.files["content_v1.py"],
			context: manifest.files["context_v1.py"],
			runtime: manifest.files["runtime.py"],
			lifecycle: manifest.files["lifecycle.py"],
		},
		compiled: { text, fields: [], holds: [] },
		sourcePins,
		contextInput: packed(json(contextInput)),
		contextResponse: packed(output),
		modelLoaded: false,
		generationDispatched: false,
	};
	return { input, authority, request, frame, response, output };
}

test("real local pinned compiler builds finite readonly request and verifies exact context bytes", async () => {
	const f = await fixture();
	expect(f.frame.operation).toBe("preflightContext");
	expect(Buffer.from(f.frame.detail.byteBase64, "base64").toString()).toContain(
		"서울",
	);
	const proof = verifyNativeMossContextResponse(f.request, json(f.response));
	expect(proof.attestation.contextResponseBytes).toEqual(f.output);
	expect(proof.snapshotHashes.token).toBe(
		hash(f.authority.serverEvidence.tokenBytes),
	);
	expect(proof.requestSHA256).toBe(f.frame.requestSHA256);
});

test("execute receipts, foreign bindings, forged bytes and private caller fields fail", async () => {
	const f = await fixture();
	for (const change of [
		{ schema: "native-moss-native-phase.v1" },
		{ nonce: randomUUID() },
		{ contextRequestSHA256: "0".repeat(64) },
		{ host: "other" },
		{ generationDispatched: true },
		{
			contextResponse: {
				...f.response.contextResponse,
				sha256: "0".repeat(64),
			},
		},
		{ sourcePins: {} },
	])
		expect(() =>
			verifyNativeMossContextResponse(
				f.request,
				json({ ...f.response, ...change }),
			),
		).toThrow();
	expect(() =>
		verifyNativeMossContextResponse(
			{ bytes: f.request.bytes },
			json(f.response),
		),
	).toThrow();
	await expect(
		buildNativeMossContextRequest({ ...f.input, path: "caller" }, f.authority),
	).rejects.toThrow();
});

test("token-only compiler binds authored content and intentional absence before remote work", async () => {
	const f = await fixture();
	const token = json({
		personId: "person-1003",
		characterId: "K1003",
		name: "서울",
		identity: { gender: "female" },
		slots: { hair: { color: "black" } },
	});
	const request = await buildNativeMossContextRequest(
		{
			...f.input,
			inputMode: "token-only",
			nativeRecipe: "recovery16-native-token-v1",
			sourceSelection: {
				kind: "intentional-absence",
				reason: "no-reference-available",
			},
		},
		{
			...f.authority,
			serverEvidence: {
				...f.authority.serverEvidence,
				tokenBytes: token,
				tokenSHA256: hash(token),
				recipientImage: null,
			},
		},
	);
	const frame = JSON.parse(Buffer.from(request.bytes).toString());
	expect(frame.mode).toBe("token-only");
	expect(frame.originalSHA256).toBeNull();
	expect(frame.token.sha256).toBe(hash(token));
	expect(frame.compilerSHA256).not.toBe(f.frame.compilerSHA256);
	const changedContext = JSON.parse(
		Buffer.from(f.response.contextResponse.byteBase64, "base64").toString(),
	);
	changedContext.counts[0].tokens = 4097;
	const raw = json(changedContext);
	expect(() =>
		verifyNativeMossContextResponse(
			f.request,
			json({
				...f.response,
				contextResponse: {
					byteBase64: raw.toString("base64"),
					sha256: hash(raw),
					size: raw.length,
				},
			}),
		),
	).toThrow();
});

test("original token bytes preserve numeric Unicode and nested compiler parity", async () => {
	// Exercise the production compiler program and its actual stdin expression
	// without bypassing or adopting a pending production bundle pin.
	const source = await readFile(
		new URL("../src/native-moss-context.ts", import.meta.url),
		"utf8",
	);
	const code = source.match(/const code = `([^`]+)`;/)?.[1];
	const stdin = source.match(
		/child\.stdin\.end\(\s*(JSON\.stringify\([\s\S]*?\)),\s*\);/,
	)?.[1];
	if (!code || !stdin) throw Error("COMPILER_FIXTURE_MISSING");
	const sources: Record<string, string> = {};
	for (const name of [
		"content_v1.py",
		"runtime.py",
		"native_runner_v1.py",
		"reference_pipeline_recipes.py",
	]) {
		const bytes = await readFile(
			new URL(`../native-moss/${name}`, import.meta.url),
		);
		if (name === "content_v1.py")
			expect(hash(bytes)).toBe(
				"b2fc10eafbf4bef23dcdb127fb62b7ced4268ae9320a1af8f6f5494005472347",
			);
		sources[name] = bytes.toString("base64");
	}
	const compile = async (program: string, input: string) => {
		const child = Bun.spawn(["python3", "-I", "-B", "-c", program], {
			stdin: new Response(input),
			stdout: "pipe",
			stderr: "pipe",
		});
		const [out, err, exit] = await Promise.all([
			new Response(child.stdout).text(),
			new Response(child.stderr).text(),
			child.exited,
		]);
		expect({ exit, err }).toEqual({ exit: 0, err: "" });
		return JSON.parse(out);
	};
	const remote = `import base64,hashlib,json,sys
v=json.loads(sys.stdin.buffer.read());ns={}
exec(compile(base64.b64decode(v['sources']['content_v1.py']),'<remote-content>','exec'),ns)
c=ns['compile_content'](json.loads(base64.b64decode(v['tokenBase64']).decode('utf-8')))
print(json.dumps({'compiled':c,'compilerSHA256':hashlib.sha256(json.dumps(c,ensure_ascii=False,separators=(',',':')).encode('utf-8')).hexdigest()},ensure_ascii=False))`;
	const results = [];
	for (const number of ["1.0", "1"]) {
		const tokenBytes = Buffer.from(
			`{\r\n"slots":{"hair":{"color":{"source":"wiki","status":"authored-token","value":"검정"},"length":{"value":2.0,"status":"authored-token","source":"wiki"}}},"identity":{"ageCategory":{"source":"wiki","value":${number},"status":"authored-token"}},"name":"서울","characterId":"K1003","personId":"person-1003"\r\n}`,
		);
		const input = Function(
			"sources",
			"request",
			"generation",
			"tokenBytes",
			`return ${stdin}`,
		)(
			sources,
			{ inputMode: "token-only" },
			{ personId: "person-1003" },
			tokenBytes,
		);
		expect(Buffer.from(JSON.parse(input).tokenBase64, "base64")).toEqual(
			tokenBytes,
		);
		const local = await compile(code, input);
		const original = await compile(remote, input);
		expect(local.compiled.holds).toEqual([]);
		expect(local.compiled).toEqual(original.compiled);
		expect(local.compilerSHA256).toBe(original.compilerSHA256);
		expect(local.contextInput.prompts[0].text).toBe(original.compiled.text);
		results.push(local);
	}
	expect(results[0].compiled.bodySHA256).not.toBe(
		results[1].compiled.bodySHA256,
	);
	expect(results[0].compiled.promptSHA256).not.toBe(
		results[1].compiled.promptSHA256,
	);
	expect(results[0].compilerSHA256).not.toBe(results[1].compilerSHA256);
});
