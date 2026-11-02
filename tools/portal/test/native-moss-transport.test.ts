import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync, inflateSync } from "node:zlib";
import {
	buildNativeMossContextRequest,
	verifyNativeMossContextResponse,
} from "../src/native-moss-context.ts";
import {
	NATIVE_MOSS_MODEL,
	NATIVE_MOSS_PROFILE_DIGEST,
} from "../src/native-moss-contract.ts";
import { createNativeMossTransport } from "../src/native-moss-transport.ts";

const hash = (bytes: string | Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
function decodePowershell(encoded: string) {
	const outer = Buffer.from(encoded, "base64").toString("utf16le");
	const compressed = outer.match(
		/FromBase64String\('([A-Za-z0-9+/=]+)'\)/,
	)?.[1];
	if (!compressed) throw Error("fixed observer compression");
	const code = gunzipSync(Buffer.from(compressed, "base64")).toString();
	expect(outer).toContain(hash(code));
	return code;
}
const program = `const fs=require('node:fs');const crypto=require('node:crypto');
const mode=process.argv[1],log=process.argv[2];let input='';
process.stdin.on('data',b=>input+=b);process.stdin.on('end',()=>{
if(!input){const ps=Buffer.from(process.argv.at(-1),'base64').toString('utf16le');fs.appendFileSync(log+'.stages',JSON.stringify({kind:'guard',ps})+'\\n');if(mode==='stagefail'||mode==='unsafeacl'||mode==='collision')process.exit(4);if(mode==='stagehash'&&ps.includes("WriteLine('STAGE_VERIFIED')"))process.exit(6);if((mode==='partial'||mode==='cleanupfail'||mode==='foreign')&&ps.includes("WriteLine('STAGE_CLEANED')"))process.exit(7);process.stdout.write('STAGE_RESERVED');return}
if(input.startsWith('put ')){fs.appendFileSync(log+'.stages',JSON.stringify({kind:'sftp'})+'\\n');if(mode==='sftpfail'||mode==='partial')process.exit(5);const local=input.match(/^put "([^"]+)"/)[1];fs.writeFileSync(log+'.staged',fs.readFileSync(local));return}
const boundary=input.indexOf('\\n');const observer=input.slice(0,boundary);let r=JSON.parse(input.slice(boundary+1));if(r.operation==='execute'&&!r.job){r=JSON.parse(fs.readFileSync(log+'.staged'))}fs.appendFileSync(log,JSON.stringify({argv:process.argv.slice(3),observer,input:r})+'\\n');
if(r.schema==='native-moss-context-command.v1'){
 const cp=require('node:child_process');const zlib=require('node:zlib');
 const setup=JSON.parse(zlib.inflateSync(Buffer.from(observer,'base64')).toString().match(/^setup=(".*")$/m)[1]);
 const op=JSON.parse(zlib.inflateSync(Buffer.from(observer,'base64')).toString().match(/exec\\((".*")\\)/)[1]);
 const harness=process.env["NATIVE_CONTEXT_TEST_HARNESS"];
 if(!harness)throw Error('missing CPU fixture harness');
 const p=cp.spawnSync('python3',['-B','-c',harness],{input:JSON.stringify({setup,op,frame:r}),encoding:'utf8'});
 process.stdout.write(p.stdout);process.stderr.write(p.stderr);process.exit(p.status??1);
}
if(mode==='drop'){process.stderr.write('secret-source apiKey=PRIVATE');process.exit(9)}
if(mode==='hang'){process.stdout.write('');process.on('SIGTERM',()=>process.exit(0));setInterval(()=>{},1000);return}
if(mode==='oversize'){process.stdout.write('x'.repeat(20000));return}
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const bundle='8f52f75bb4fe62ffceb0cadacbeed34c6175bebf8ade9644d1337a3ab94f8218';
let response;
if(r.schema==='native-moss-lifecycle-command.v1'){
 if(r.operation==='readiness')response={schema:'native-moss-lifecycle-readiness.v1',ready:true,modelLoaded:false,generationDispatched:false,proof:{processInventoryComplete:true,processes:{},freeMiB:9000,utilization:0}};
 else if(r.operation==='alpha')response={schema:'native-moss-alpha-phase.v1',state:'ALPHA_SUBMITTED',promptId:crypto.randomUUID()};
 else if(r.operation==='release')response={schema:'native-moss-lifecycle-release.v1',state:'RELEASED',finalSHA256:digest('final')};
 else if(r.operation==='reconcile'&&mode!=='terminal')response={schema:'native-moss-lifecycle-status.v1',state:'UNKNOWN',requestId:r.requestId,launchAllowed:false};
 else response={schema:'native-moss-execution.v1',state:'HOLD',requestId:r.requestId,nonce:r.nonce,ownerBindingHash:r.ownerBindingHash,envelopeSHA256:r.envelopeSHA256,profileDigest:r.profileDigest,bundleSHA256:r.bundleSHA256,ownerProcess:{pid:r.ownerPid,start:r.ownerStart},alphaFinished:true,qualityQualified:false,ownerApproved:false,finalSHA256:digest('final')};
 if(r.operation==='readArtifacts'){
  const receipt=response;
  const names=['config.json','status.json','execution.json','preflight.json','alpha-graph.json','alpha-history.json','alpha-submitted.json','output/raw.png','output/crop-RGB.png','output/alpha352.png','output/mask352.png','output/rawmask352.png','output/final-RGBA.png'];
  response={schema:'native-moss-lifecycle-artifacts.v1',state:'ARTIFACTS',receipt,artifacts:names.map(name=>{const b=Buffer.from(name==='config.json'?JSON.stringify({fixture:'config'}):name==='execution.json'?JSON.stringify(receipt):name==='output/final-RGBA.png'?'final':name);return{name,size:b.length,sha256:digest(b),byteBase64:b.toString('base64')}})};
  if(mode==='lifecyclebadbytes')response.artifacts[3].byteBase64=Buffer.from('changed').toString('base64');
  if(mode==='lifecycleduplicate')response.artifacts[3]=response.artifacts[2];
  if(mode==='lifecycleunavailable')response={schema:'native-moss-lifecycle-artifacts.v1',state:'NOT_READY',code:'LIFECYCLE_ARTIFACTS_UNAVAILABLE'};
 }
}else if(r.operation==='readiness')response={schema:'native-moss-readiness.v1',profileDigest:r.profileDigest,bundleSHA256:bundle,ready:false,reason:'NATIVE_ALPHA_LIFECYCLE_NOT_INTEGRATED',modelLoaded:false,generationDispatched:false};
else{const h=r.operation==='execute'?{requestId:r.job.requestId,nonce:r.job.nonce,ownerBindingHash:r.job.ownerBindingHash,profileDigest:r.job.profileDigest,envelopeSHA256:digest(JSON.stringify(r.job))}:r;
const receipt={schema:'native-moss-native-phase.v1',requestId:h.requestId,nonce:h.nonce,ownerBindingHash:h.ownerBindingHash,profileDigest:h.profileDigest,envelopeSHA256:h.envelopeSHA256,bundleSHA256:bundle,state:'NATIVE_COMPLETE_ALPHA_PENDING',native:{pid:process.pid,processStart:'2026-10-21T00:00:00.0000000Z',phaseOutcome:'RETURNED_SUCCESSFULLY',rawSHA256:digest('raw.png'),cropSHA256:digest('crop-RGB.png')}};
response=r.operation==='execute'?receipt:{schema:r.operation==='status'?'native-moss-status.v1':'native-moss-artifacts.v1',receipt};
if(r.operation==='readArtifacts'){receipt.preflightSHA256=digest('preflight.json');receipt.preflightSize=14;response.artifacts=['preflight.json','raw.png','crop-RGB.png'].map(name=>{const b=Buffer.from(name);return{name,byteBase64:b.toString('base64'),size:b.length,sha256:digest(b)}})}}
if(mode.startsWith('ready')&&r.operation==='readiness'&&r.schema==='native-moss-command.v1'){
 const proof={processInventoryComplete:true,processes:{},freeMiB:9000,utilization:0};
 response={...response,ready:true,reason:null,hostReadiness:{ready:true,proof},lifecycleReadiness:{schema:'native-moss-lifecycle-readiness.v1',ready:true,proof,modelLoaded:false,generationDispatched:false}};
 if(mode==='readyreason')response.reason='NATIVE_BAD_SUCCESS';
 if(mode==='readybundle')response.bundleSHA256='0'.repeat(64);
 if(mode==='readyprofile')response.profileDigest='0'.repeat(64);
 if(mode==='readymodel')response.modelLoaded=true;
 if(mode==='readydispatch')response.generationDispatched=true;
}
if(mode==='precisenotready')response.reason='NATIVE_ROOT_NOT_PROVISIONED';
if(mode==='mismatch')(response.receipt??response).nonce=crypto.randomUUID();
if(mode==='badartifact')response.artifacts[0].sha256='0'.repeat(64);
if(mode==='badpreflightsize')response.receipt.preflightSize++;
if(mode==='badpreflighthash')response.receipt.preflightSHA256='0'.repeat(64);
if(r.operation==='execute'){
 const observed={pid:process.pid,processStart:'2026-10-21T00:00:00.0000000Z',exitCode:0};
 if(mode==='wrongexit')observed.exitCode=7;
 if(mode==='wrongpid')observed.pid++;
 if(mode==='wrongstart')observed.processStart='2026-10-21T00:00:00.0000001Z';
 if(mode!=='unframed')response={schema:'native-moss-process-response.v1',response,process:observed};
}
process.stdout.write(JSON.stringify(response));});`;

function envelope() {
	return Buffer.from(
		JSON.stringify({
			schema: "native-moss-job.v1",
			requestId: randomUUID(),
			nonce: randomUUID(),
			ownerBindingHash: "b".repeat(64),
			profileDigest: NATIVE_MOSS_PROFILE_DIGEST,
			snapshot: {
				name: "quote '\"\n; $(touch /not-a-command)",
				token: "private-source",
			},
		}),
	);
}

test("production readiness parser preserves qualified success and rejects inconsistent success without provider overrides", async () => {
	for (const mode of [
		"ready",
		"readyreason",
		"readybundle",
		"readyprofile",
		"readymodel",
		"readydispatch",
		"precisenotready",
	]) {
		const f = await fixture(mode);
		try {
			const result = await f.transport.readiness();
			if (mode === "ready") {
				expect(result.state).toBe("READY");
				if (result.state !== "READY") throw Error("readiness");
				expect(result.proof["ready"]).toBe(true);
				expect(result.proof["reason"]).toBeNull();
				expect(result.proof["lifecycleReadiness"]).toMatchObject({
					ready: true,
					modelLoaded: false,
					generationDispatched: false,
				});
			} else {
				expect(result).toEqual({
					state: "NOT_READY",
					code:
						mode === "precisenotready"
							? "NATIVE_ROOT_NOT_PROVISIONED"
							: "NATIVE_RESPONSE_MISMATCH",
				});
			}
			expect(
				(await f.calls()).map((call) => [
					call.input.schema,
					call.input.operation,
				]),
			).toEqual([["native-moss-command.v1", "readiness"]]);
		} finally {
			await f.cleanup();
		}
	}
});

test("readonly context runs actual verified compiler/tokenizer helper and current builder verifier", async () => {
	const token = Buffer.from(
		JSON.stringify({
			personId: "person-1003",
			characterId: "K1003",
			name: "Seoul",
			identity: { gender: "female" },
			slots: { hair: { color: "black" } },
		}),
	);
	const request = await buildNativeMossContextRequest(
		{
			schemaVersion: 2,
			requestId: randomUUID(),
			personId: "person-1003",
			provider: "native-moss",
			providerModel: NATIVE_MOSS_MODEL,
			nativeRecipe: "recovery16-native-token-v1",
			generationProfile: "native340-v1",
			inputMode: "token-only",
			sourceSelection: {
				kind: "intentional-absence",
				reason: "no-reference-available",
			},
			explicitEdits: [],
			size: "340x510",
			faceMode: { kind: "unique", variantId: null },
		},
		{
			detailBytes: Buffer.from(
				JSON.stringify({
					id: "person-1003",
					characterId: "K1003",
					name: "Seoul",
				}),
			),
			ownerBindingHash: "a".repeat(64),
			serverEvidence: {
				status: "available",
				recipient: { personId: "person-1003", characterId: "K1003" },
				tokenBytes: token,
				tokenSHA256: hash(token),
				recipientImage: null,
			},
		},
	);
	const root = new URL("../native-moss/", import.meta.url).pathname;
	const harness = `import json,sys,re,types,pathlib,hashlib
v=json.loads(sys.stdin.buffer.read());setup=v['setup'];setup=re.sub(r'root=pathlib.Path\\("[^"\\n]+"\\)', 'root=pathlib.Path('+repr(${JSON.stringify(root)})+')',setup,count=1)
exec(setup)
class WindowsAsyncioStylePopen(subprocess.Popen):
 pass
assert issubclass(WindowsAsyncioStylePopen,subprocess.Popen)
import context_v1
source=b"MAX_TEXT_TOKENS=4096\\nclass MossImageModel:\\n def _chat(self,text):\\n  return self.tokenizer.apply_chat_template([{'role':'user','content':text}],tokenize=False,add_generation_prompt=True,enable_thinking=True)\\n"
original_read=pathlib.Path.read_bytes
def fixture_read(p):
 if p.name in context_v1.TOKENIZER_PINS:return p.name.encode()
 if p.name=='moss_image.py':return source
 return original_read(p)
original_sha=context_v1.sha
def fixture_sha(b):
 if b==source:return 'da48fcb10a64d80cc6c3394736094a66e58fc5fa4a27ff9dc6701059e27aecd7'
 if b.decode(errors='ignore') in context_v1.TOKENIZER_PINS:return context_v1.TOKENIZER_PINS[b.decode()]
 return original_sha(b)
class Tokenizer:
 @classmethod
 def from_pretrained(cls,path,local_files_only):
  assert local_files_only is True;return cls()
 def apply_chat_template(self,rows,**kw):
  assert kw==dict(tokenize=False,add_generation_prompt=True,enable_thinking=True);return 'wrapped:'+rows[0]['content']
 def __call__(self,text,truncation):
  assert truncation is False;return {'input_ids':list(range(12))}
sys.modules['transformers']=types.SimpleNamespace(Qwen2Tokenizer=Tokenizer)
pathlib.Path.read_bytes=fixture_read;context_v1.sha=fixture_sha
frame=v['frame'];frame_bytes=json.dumps(frame,ensure_ascii=False,separators=(',',':')).encode()
exec(v['op'])
assert 'torch' not in sys.modules and 'runtime' not in sys.modules and 'job' not in sys.modules
print(json.dumps(result,ensure_ascii=False))`;
	const old = process.env["NATIVE_CONTEXT_TEST_HARNESS"];
	process.env["NATIVE_CONTEXT_TEST_HARNESS"] = harness;
	const f = await fixture();
	try {
		const response = await f.transport.preflightContext(request.bytes);
		const proof = verifyNativeMossContextResponse(request, response);
		expect(proof.requestSHA256).toBe(
			JSON.parse(Buffer.from(request.bytes).toString()).requestSHA256,
		);
		expect(proof.attestation.contextResponseBytes.length).toBeGreaterThan(0);
		const changed = JSON.parse(Buffer.from(request.bytes).toString());
		changed.compilerSHA256 = "0".repeat(64);
		await expect(
			f.transport.preflightContext(Buffer.from(JSON.stringify(changed))),
		).rejects.toThrow();
	} finally {
		await f.cleanup();
		if (old === undefined) delete process.env["NATIVE_CONTEXT_TEST_HARNESS"];
		else process.env["NATIVE_CONTEXT_TEST_HARNESS"] = old;
	}
});
async function fixture(
	mode = "ok",
	timeoutMs?: number,
	maxOutputBytes?: number,
) {
	const folder = await mkdtemp(join(tmpdir(), "native-transport-"));
	const log = join(folder, "calls.jsonl");
	const transport = createNativeMossTransport({
		executable: process.execPath,
		prefix: ["-e", program, mode, log],
		sftpExecutable: process.execPath,
		sftpPrefix: ["-e", program, mode, log],
		...(timeoutMs === undefined ? {} : { timeoutMs }),
		...(maxOutputBytes === undefined ? {} : { maxOutputBytes }),
	});
	const calls = async () =>
		(await readFile(log, "utf8"))
			.trim()
			.split("\n")
			.map((line) => JSON.parse(line));
	return {
		transport,
		calls,
		stages: async () => (await readFile(log+".stages","utf8")).trim().split("\n").map(line=>JSON.parse(line)),
		cleanup: () => rm(folder, { recursive: true, force: true }),
	};
}

test("large execute stages exact bytes and preserves uncertainty without retry", async () => {
	for (const mode of ["ok", "unsafeacl", "collision", "stagefail", "sftpfail", "stagehash", "partial", "cleanupfail", "drop"]) {
		const f = await fixture(mode);
		try {
			const job = JSON.parse(envelope().toString());
			job.snapshot.padding = "A".repeat(2417520);
			const input = Buffer.from(JSON.stringify(job));
			const events:{phase:string;observed?:unknown}[]=[];
			const result = await f.transport.execute(input,{onStageIntent:async stage=>{events.push({phase:stage.phase});await expect(f.stages()).rejects.toThrow();},onStageUpdate:async(stage,observed)=>{events.push({phase:stage.phase,observed});}});
			expect(result.state).toBe(
				mode === "ok"
					? "NATIVE_COMPLETE_ALPHA_PENDING"
					: ["stagefail", "sftpfail", "unsafeacl", "collision", "stagehash", "partial"].includes(mode)
						? "REJECTED"
						: "UNKNOWN",
			);
			expect(events[0]?.phase).toBe("INTENT");
			if(["unsafeacl","collision","stagefail"].includes(mode))expect((await f.stages()).some(s=>s.kind==="sftp")).toBe(false);
			if(mode==="stagehash"||mode==="partial")await expect(f.calls()).rejects.toThrow();
			if(result.state==="REJECTED"||result.state==="UNKNOWN"){
				expect(result.stageRecord?.requestId).toBe(job.requestId);
				expect(result.stagedInput?.sha256).toBe(result.stageRecord?.frameSHA256);
			}
			if(mode==="partial"){expect(result.state).toBe("REJECTED");if(result.state==="REJECTED")expect(result.residue).toBe("RETAINED");}
			if(mode==="cleanupfail"){
				if(result.state!=="UNKNOWN")throw Error("cleanup must be uncertain");
				expect(result.observedNative?.nativeProcessTerminal.exitCode).toBe(0);
				expect(result.observedNative?.receipt["requestId"]).toBe(job.requestId);
				expect(events.find(e=>e.phase==="OBSERVED")?.observed).toBeDefined();
			}
			expect((await f.transport.execute(input)).state).toBe("UNKNOWN");
		} finally {
			await f.cleanup();
		}
	}
});

test("large execute requires durable intent and blocks failed callback before remote mutation",async()=>{
	for(const reject of [false,true]){const f=await fixture();try{const j=JSON.parse(envelope().toString());j.snapshot.padding="x".repeat(1100000);const r=await f.transport.execute(Buffer.from(JSON.stringify(j)),reject?{onStageIntent:async()=>{throw Error("fsync");},onStageUpdate:async()=>{}}:undefined);expect(r.state).toBe("REJECTED");await expect(f.stages()).rejects.toThrow();}finally{await f.cleanup();}}
});

test("fixed strict SSH argv and encoded bootstrap carry quotes/newlines only in stdin", async () => {
	const f = await fixture();
	try {
		expect(await f.transport.readiness()).toEqual({
			state: "NOT_READY",
			code: "NATIVE_ALPHA_LIFECYCLE_NOT_INTEGRATED",
		});
		const job = envelope();
		const result = await f.transport.execute(job);
		expect(result.state).toBe("NATIVE_COMPLETE_ALPHA_PENDING");
		if (result.state !== "NATIVE_COMPLETE_ALPHA_PENDING") throw Error("result");
		expect(result.nativeProcessTerminal).toMatchObject({
			...result.handle,
			pid: (result.receipt["native"] as { pid: number }).pid,
			processStart: "2026-10-21T00:00:00.0000000Z",
			exitCode: 0,
			channelOutcome: "EXIT_OBSERVED",
		});
		expect((await f.transport.status(result.handle)).state).toBe(
			"NATIVE_COMPLETE_ALPHA_PENDING",
		);
		expect((await f.transport.readArtifacts(result.handle)).state).toBe(
			"ARTIFACTS",
		);
		const calls = await f.calls();
		expect(calls.map((c) => c.input.operation)).toEqual([
			"readiness",
			"execute",
			"status",
			"readArtifacts",
		]);
		for (const call of calls) {
			expect(call.argv.slice(0, 15)).toEqual([
				"-o",
				"BatchMode=yes",
				"-o",
				"StrictHostKeyChecking=yes",
				"-o",
				"HostName=100.77.98.25",
				"-o",
				"ConnectTimeout=10",
				"-l",
				"oliver",
				"windows",
				"powershell.exe",
				"-NoProfile",
				"-NonInteractive",
				"-EncodedCommand",
			]);
			expect(call.argv.join(" ")).not.toContain("private-source");
			expect(call.argv.join(" ")).not.toContain("touch");
			expect(call.argv).toEqual(calls[0].argv);
		}
		expect(calls[1].input.job).toEqual(JSON.parse(job.toString()));
		expect(calls[1].input.schema).toBe("native-moss-command.v1");
		expect(result.handle.envelopeSHA256).toBe(hash(job));
		const script = decodePowershell(calls[0].argv.at(-1));
		expect(script).toContain("UseShellExecute=$false");
		const encoded = calls[0].observer;
		if (!encoded) throw Error("bootstrap");
		expect(calls[0].argv.join(" ").length).toBeLessThan(8191);
		const loader = inflateSync(Buffer.from(encoded, "base64"))
			.toString()
			.match(/^setup=(".*")$/m)?.[1];
		if (!loader) throw Error("private loader");
		expect(JSON.parse(loader)).toContain("recovery16-workbench-worker-v1");
		expect(script).not.toContain("StrictHostKeyChecking=no");
	} finally {
		await f.cleanup();
	}
});

for (const mode of [
	"drop",
	"mismatch",
	"oversize",
	"wrongexit",
	"wrongpid",
	"wrongstart",
	"unframed",
] as const) {
	test(`${mode} after process start is UNKNOWN and never automatically resubmitted`, async () => {
		const f = await fixture(
			mode,
			undefined,
			mode === "oversize" ? 1000 : undefined,
		);
		try {
			const job = envelope();
			const first = await f.transport.execute(job);
			expect(first.state).toBe("UNKNOWN");
			expect(JSON.stringify(first)).not.toContain("PRIVATE");
			expect((await f.transport.execute(job)).state).toBe("UNKNOWN");
			expect(await f.calls()).toHaveLength(1);
		} finally {
			await f.cleanup();
		}
	});
}

test("timeout and abort preserve uncertain execute and redacted progress", async () => {
	const f = await fixture("hang", 200);
	try {
		const result = await f.transport.execute(envelope());
		expect(result).toMatchObject({
			state: "UNKNOWN",
			code: "NATIVE_CHANNEL_TIMEOUT",
		});
		expect(await f.calls()).toHaveLength(1);
	} finally {
		await f.cleanup();
	}
	const a = await fixture("drop");
	try {
		const controller = new AbortController();
		const result = await a.transport.execute(envelope(), {
			signal: controller.signal,
			onProgress: (event) => {
				expect(Object.keys(event)).toEqual(["stream", "bytes"]);
				controller.abort();
			},
		});
		expect(result.state).toBe("UNKNOWN");
		expect(await a.calls()).toHaveLength(1);
	} finally {
		await a.cleanup();
	}
});

test("prestart abort, invalid envelope, bounds and host/path fields never launch", async () => {
	const f = await fixture();
	try {
		const controller = new AbortController();
		controller.abort();
		expect(
			await f.transport.execute(envelope(), { signal: controller.signal }),
		).toMatchObject({ state: "REJECTED", code: "NATIVE_ABORTED_BEFORE_START" });
		expect((await f.transport.execute(Buffer.from("{}"))).state).toBe(
			"REJECTED",
		);
		expect(
			(await f.transport.execute(new Uint8Array(32 * 1024 * 1024 + 1))).state,
		).toBe("REJECTED");
		expect(() =>
			f.transport.status({
				requestId: randomUUID(),
				nonce: randomUUID(),
				ownerBindingHash: "a".repeat(64),
				envelopeSHA256: "b".repeat(64),
				profileDigest: NATIVE_MOSS_PROFILE_DIGEST,
				host: "other",
			} as never),
		).toThrow();
	} finally {
		await f.cleanup();
	}
});

test("artifact digest mismatch cannot be adopted; status and reads never execute", async () => {
	const f = await fixture("badartifact");
	try {
		const job = JSON.parse(envelope().toString());
		const handle = {
			requestId: job.requestId,
			nonce: job.nonce,
			ownerBindingHash: job.ownerBindingHash,
			profileDigest: NATIVE_MOSS_PROFILE_DIGEST,
			envelopeSHA256: "a".repeat(64),
		};
		expect((await f.transport.readArtifacts(handle)).state).toBe("UNKNOWN");
		expect((await f.calls()).map((c) => c.input.operation)).toEqual([
			"readArtifacts",
		]);
	} finally {
		await f.cleanup();
	}
});

for (const mode of ["badpreflightsize", "badpreflighthash"]) {
	test(`${mode} rejects the third artifact against the bound receipt`, async () => {
		const f = await fixture(mode);
		try {
			const job = JSON.parse(envelope().toString());
			const result = await f.transport.readArtifacts({
				requestId: job.requestId,
				nonce: job.nonce,
				ownerBindingHash: job.ownerBindingHash,
				profileDigest: NATIVE_MOSS_PROFILE_DIGEST,
				envelopeSHA256: "a".repeat(64),
			});
			expect(result.state).toBe("UNKNOWN");
		} finally {
			await f.cleanup();
		}
	});
}

test("missing SSH executable is definitive prelaunch rejection", async () => {
	const transport = createNativeMossTransport({
		executable: "/nonexistent-native-test-ssh",
	});
	const result = await transport.execute(envelope());
	expect(result).toMatchObject({
		state: "REJECTED",
		code: "NATIVE_SSH_UNAVAILABLE",
	});
});

test("current private bundle mapping pins every actual source byte", async () => {
	const manifest = JSON.parse(
		await readFile(
			new URL("../native-moss/manifest.json", import.meta.url),
			"utf8",
		),
	);
	const sorted = Object.fromEntries(
		Object.entries(
			manifest.files as Record<string, { sha256: string; size: number }>,
		)
			.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
			.map(([name, pin]) => [name, { sha256: pin.sha256, size: pin.size }]),
	);
	// Python recursively sorts keys: sha256 sorts before size for each file.
	expect(hash(JSON.stringify(sorted))).toBe(
		"8f52f75bb4fe62ffceb0cadacbeed34c6175bebf8ade9644d1337a3ab94f8218",
	);
	expect(manifest.implementationSHA256).toBe(hash(JSON.stringify(sorted)));
	for (const [name, pin] of Object.entries(sorted)) {
		const raw = await readFile(
			new URL(`../native-moss/${name}`, import.meta.url),
		);
		expect({ sha256: hash(raw), size: raw.length }).toEqual(pin);
	}
});

test("actual Python bootstrap ignores valid malicious job runtime and explicit helper caches", async () => {
	const f = await fixture();
	try {
		await f.transport.readiness();
		const calls = await f.calls();
		const encoded = calls[0].observer;
		if (!encoded) throw Error("bootstrap");
		const probe = `import sys,json,base64,pathlib,tempfile,hashlib,os,py_compile,subprocess,re,ast
import zlib
bootstrap=zlib.decompress(base64.b64decode(sys.stdin.buffer.read())).decode()
setup=ast.literal_eval(next(n.value for n in ast.parse(bootstrap).body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='setup' for t in n.targets)))
original_setup=setup
with tempfile.TemporaryDirectory() as directory:
 root=pathlib.Path(directory)
 files={'job.py':b'import json,runtime,subprocess,sys\\ndef parse(data): return json.loads(data)\\ndef command(frame):\\n result=subprocess.run([sys.executable,"-B",runtime.__file__,"--context"],capture_output=True,check=True)\\n return {"value":runtime.value,"child":json.loads(result.stdout)}\\n',
 'runtime.py':b'import importlib.util,pathlib\\nspec=importlib.util.spec_from_file_location("helper_alias",pathlib.Path(__file__).parent/"helper.py")\\nhelper=importlib.util.module_from_spec(spec)\\nspec.loader.exec_module(helper)\\nvalue=helper.value\\nif __name__=="__main__":\\n import json\\n print(json.dumps({"value":value}))\\n',
 'helper.py':b'value="verified-source"\\n'}
 pins={}
 for name,raw in files.items():
  path=root/name; path.write_bytes(raw); stat=path.stat()
  evil=b'raise RuntimeError("MALICIOUS_CACHE_EXECUTED")\\n'
  evil+=b'#'+b' '*max(0,len(raw)-len(evil)-2)+b'\\n'
  if len(evil)>len(raw): raw+=b'#'+b' '*(len(evil)-len(raw)-1); files[name]=raw
  evil=evil[:len(raw)]
  path.write_bytes(evil);os.utime(path,(stat.st_atime,stat.st_mtime));py_compile.compile(str(path),doraise=True)
  path.write_bytes(raw);os.utime(path,(stat.st_atime,stat.st_mtime))
  pins[name]={'sha256':hashlib.sha256(raw).hexdigest(),'size':len(raw)}
 digest=hashlib.sha256(json.dumps(pins,sort_keys=True,separators=(',',':')).encode()).hexdigest()
 (root/'manifest.json').write_text(json.dumps({'files':pins,'implementationSHA256':digest,'profileDigest':'${NATIVE_MOSS_PROFILE_DIGEST}'}))
 setup=re.sub(r'root=pathlib.Path\\("[^"\\n]+"\\)', 'root=pathlib.Path('+repr(str(root))+')',setup,count=1)
 setup=re.sub(r"assert m\\['implementationSHA256'\\]=='[0-9a-f]{64}'", "assert m['implementationSHA256']=='"+digest+"'",setup,count=1)
 bootstrap=bootstrap.replace(json.dumps(original_setup),json.dumps(setup))
 result=subprocess.run([sys.executable,'-B','-u','-X','utf8','-c',bootstrap],input=b'{"schema":"native-moss-command.v1"}',capture_output=True,timeout=5)
 print(json.dumps({'exit':result.returncode,'stdout':result.stdout.decode(),'stderr':result.stderr.decode(),'caches':len(list(root.glob('__pycache__/*.pyc')))}))
`;
		const child = spawn("python3", ["-B", "-c", probe], {
			stdio: ["pipe", "pipe", "pipe"],
		});
		const closed = once(child, "close", { signal: AbortSignal.timeout(10000) });
		const chunks: Buffer[] = [];
		const errors: Buffer[] = [];
		child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
		child.stderr.on("data", (chunk: Buffer) => errors.push(chunk));
		child.stdin.end(encoded);
		expect((await closed)[0], Buffer.concat(errors).toString()).toBe(0);
		const result = JSON.parse(Buffer.concat(chunks).toString());
		expect(result, result.stderr).toMatchObject({
			exit: 0,
			caches: 3,
			stderr: "",
		});
		expect(JSON.parse(result.stdout)).toEqual({
			value: "verified-source",
			child: { value: "verified-source" },
		});
	} finally {
		await f.cleanup();
	}
});

test("PowerShell observer owns one Python PID and bounded concurrent pipes", async () => {
	const f = await fixture();
	try {
		await f.transport.readiness();
		const call = (await f.calls())[0];
		const script = decodePowershell(call.argv.at(-1));
		expect(script).toContain(
			"$workerPid=$p.Id;$start=$p.StartTime.ToUniversalTime().ToString('o')",
		);
		expect(script).toContain("$p.WaitForExit();$exitCode=$p.ExitCode");
		expect(script).toContain("$p.StandardOutput.ReadAsync");
		expect(script).toContain("$p.StandardError.ReadAsync");
		expect(script).toContain("$inputWriter.WriteAsync");
		expect(script).toContain(
			"$s.EnvironmentVariables['__PYVENV_LAUNCHER__']='E:/git/linalab/PNGAL/environment/venvs/ai-toolkit/Scripts/python.exe'",
		);
		expect(script).toContain(
			"PythonSoftwareFoundation.Python.3.12_qbz5n2kfra8p0/python.exe'",
		);
		expect(script).toContain("NATIVE_INTERPRETER_IMAGE");
		expect(script).toContain("$p.Kill()");
		expect(script).toContain("$p.Dispose()");
		expect(script).toContain("NATIVE_CHILD_OUTPUT_LIMIT");
		expect(script).toContain("NATIVE_CHILD_LOG_LIMIT");
		expect(script).toContain("NATIVE_CHILD_TIMEOUT");
		const code = inflateSync(Buffer.from(call.observer, "base64")).toString();
		const pin = script.match(/hexdigest\(\)==''([a-f0-9]{64})''/)?.[1];
		if (!pin) throw Error("bootstrap pin");
		expect(hash(code)).toBe(pin);
		expect(code).toContain("import job");
		expect(code).not.toContain("child=subprocess.Popen");
		expect(call.argv.join(" ").length).toBeLessThan(8191);
	} finally {
		await f.cleanup();
	}
});

test("stdin failure kills and reaps only local child before UNKNOWN and suppresses retry", async () => {
	const folder = await mkdtemp(join(tmpdir(), "native-stdin-close-"));
	const log = join(folder, "pid");
	try {
		const program = `const fs=require('node:fs');fs.writeFileSync(process.argv[1],String(process.pid));process.on('SIGTERM',()=>{});fs.closeSync(0);setInterval(()=>{},1000);`;
		const transport = createNativeMossTransport({
			executable: process.execPath,
			prefix: ["-e", program, log],
			timeoutMs: 5000,
		});
		const job = JSON.parse(envelope().toString());
		job.snapshot.token = "x".repeat(512 * 1024);
		const input = Buffer.from(JSON.stringify(job));
		const result = await transport.execute(input);
		expect(result).toMatchObject({
			state: "UNKNOWN",
			code: "NATIVE_STDIN_FAILED",
		});
		const pid = Number(await readFile(log, "utf8"));
		expect(() => process.kill(pid, 0)).toThrow();
		expect(await transport.execute(input)).toMatchObject({
			state: "UNKNOWN",
			code: "NATIVE_ALREADY_ATTEMPTED",
		});
	} finally {
		await rm(folder, { recursive: true, force: true });
	}
});

function lifecycleBinding() {
	const job = JSON.parse(envelope().toString());
	return {
		requestId: job.requestId as string,
		nonce: job.nonce as string,
		ownerBindingHash: job.ownerBindingHash as string,
		profileDigest: NATIVE_MOSS_PROFILE_DIGEST,
		envelopeSHA256: hash(JSON.stringify(job)),
		bundleSHA256:
			"8f52f75bb4fe62ffceb0cadacbeed34c6175bebf8ade9644d1337a3ab94f8218" as const,
		ownerPid: 1234,
		ownerStart: "2026-10-21T00:00:00.0000000Z",
	};
}

test("lifecycleReadArtifacts returns all13 bound bytes without execute or mutation suppression", async () => {
	for (const mode of [
		"ok",
		"lifecyclebadbytes",
		"lifecycleduplicate",
		"lifecycleunavailable",
		"mismatch",
	]) {
		const f = await fixture(mode);
		try {
			const binding = {
				...lifecycleBinding(),
				envelopeSHA256: hash(JSON.stringify({ fixture: "config" })),
			};
			const result = await f.transport.lifecycleReadArtifacts(binding);
			expect(result.state).toBe(
				mode === "ok"
					? "ARTIFACTS"
					: mode === "lifecycleunavailable"
						? "NOT_READY"
						: "UNKNOWN",
			);
			if (result.state === "ARTIFACTS") {
				expect(result.files).toHaveLength(13);
				for (const file of result.files)
					expect(hash(Buffer.from(file.byteBase64, "base64"))).toBe(
						file.sha256,
					);
				expect((await f.transport.lifecycleReadArtifacts(binding)).state).toBe(
					"ARTIFACTS",
				);
			}
			const calls = await f.calls();
			for (const call of calls) {
				expect(call.input).toEqual({
					schema: "native-moss-lifecycle-command.v1",
					operation: "readArtifacts",
					...binding,
				});
			}
		} finally {
			await f.cleanup();
		}
	}
});

test("closed lifecycle API submits each mutation once and keeps combined readiness false", async () => {
	const f = await fixture();
	try {
		const binding = lifecycleBinding();
		const readiness = await f.transport.combinedReadiness();
		expect(readiness.state).toBe("NOT_READY");
		expect(readiness.code).toBe("NATIVE_ALPHA_LIFECYCLE_NOT_INTEGRATED");
		expect(readiness.lifecycle.state).toBe("LIFECYCLE_READINESS");
		expect((await f.transport.alpha(binding)).state).toBe("ALPHA_SUBMITTED");
		expect((await f.transport.alpha(binding)).state).toBe("UNKNOWN");
		expect((await f.transport.reconcile(binding)).state).toBe("UNKNOWN");
		expect((await f.transport.finalize(binding)).state).toBe("HOLD");
		expect((await f.transport.release(binding)).state).toBe("RELEASED");
		const calls = await f.calls();
		expect(calls.map((c) => [c.input.schema, c.input.operation])).toEqual([
			["native-moss-command.v1", "readiness"],
			["native-moss-lifecycle-command.v1", "readiness"],
			["native-moss-lifecycle-command.v1", "alpha"],
			["native-moss-lifecycle-command.v1", "reconcile"],
			["native-moss-lifecycle-command.v1", "finalize"],
			["native-moss-lifecycle-command.v1", "release"],
		]);
		expect(calls[2].input).toEqual({
			schema: "native-moss-lifecycle-command.v1",
			operation: "alpha",
			...binding,
		});
		for (const call of calls) expect(call.argv).toEqual(calls[0].argv);
		for (const invalid of [
			{ ...binding, host: "other" },
			{ ...binding, ownerPid: 0 },
			{ ...binding, nonce: "bad" },
			{ ...binding, bundleSHA256: "0".repeat(64) },
		])
			expect(() => f.transport.alpha(invalid as never)).toThrow();
		expect(await f.calls()).toHaveLength(6);
	} finally {
		await f.cleanup();
	}
});

test("alpha drop is UNKNOWN with no retry and reconcile never becomes alpha", async () => {
	const f = await fixture("drop");
	try {
		const binding = lifecycleBinding();
		expect((await f.transport.alpha(binding)).state).toBe("UNKNOWN");
		expect((await f.transport.alpha(binding)).state).toBe("UNKNOWN");
		expect((await f.transport.reconcile(binding)).state).toBe("UNKNOWN");
		expect((await f.calls()).map((c) => c.input.operation)).toEqual([
			"alpha",
			"reconcile",
		]);
	} finally {
		await f.cleanup();
	}
});

test("lifecycle terminal binding rejects foreign nonce and reads adopt only bound HOLD", async () => {
	for (const mode of ["terminal", "mismatch"]) {
		const f = await fixture(mode);
		try {
			const result = await f.transport.finalize(lifecycleBinding());
			expect(result.state).toBe(mode === "terminal" ? "HOLD" : "UNKNOWN");
			expect((await f.calls()).map((c) => c.input.operation)).toEqual([
				"finalize",
			]);
		} finally {
			await f.cleanup();
		}
	}
});
