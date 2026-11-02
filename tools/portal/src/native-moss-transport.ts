import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { deflateSync, gzipSync } from "node:zlib";
import { z } from "zod";
import { NATIVE_MOSS_PROFILE_DIGEST } from "./native-moss-contract.ts";

const digest = (data: string | Uint8Array) =>
	createHash("sha256").update(data).digest("hex");
const MAX_INPUT = 32 * 1024 * 1024;
const MAX_OUTPUT = 48 * 1024 * 1024;
const BUNDLE =
	"8f52f75bb4fe62ffceb0cadacbeed34c6175bebf8ade9644d1337a3ab94f8218";
const PYTHON =
	"E:/git/linalab/PNGAL/environment/venvs/ai-toolkit/Scripts/python.exe";
// CPython's venv redirector uses this base executable plus the launcher
// environment below. Direct launch keeps the owned Process PID the worker PID.
const DIRECT_PYTHON =
	"C:/Users/oliver/AppData/Local/Microsoft/WindowsApps/PythonSoftwareFoundation.Python.3.12_qbz5n2kfra8p0/python.exe";
const PYTHON_IMAGE =
	"C:/Program Files/WindowsApps/PythonSoftwareFoundation.Python.3.12_3.12.2800.0_x64__qbz5n2kfra8p0/python3.12.exe";
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const contextBlob = z.strictObject({
	byteBase64: z.string().max(2796204),
	sha256: hash,
	size: z.number().int().positive().max(2097152),
});
const contextRequestSchema = z.strictObject({
	schema: z.literal("native-moss-context-command.v1"),
	operation: z.literal("preflightContext"),
	requestId: z.uuid(),
	nonce: z.uuid(),
	ownerBindingHash: hash,
	requestSHA256: hash,
	profileDigest: z.literal(NATIVE_MOSS_PROFILE_DIGEST),
	bundleSHA256: z.literal(BUNDLE),
	mode: z.enum(["reference-img2img", "token-only"]),
	personId: z.string().regex(/^person-\d+$/),
	detail: contextBlob,
	token: contextBlob,
	originalSHA256: hash.nullable(),
	compilerSHA256: hash,
});
const handleSchema = z.strictObject({
	requestId: z.uuid(),
	nonce: z.uuid(),
	ownerBindingHash: hash,
	envelopeSHA256: hash,
	profileDigest: z.literal(NATIVE_MOSS_PROFILE_DIGEST),
});
export type NativeMossHandle = z.infer<typeof handleSchema>;
const lifecycleHandleSchema = handleSchema.safeExtend({
	bundleSHA256: z.literal(BUNDLE),
	ownerPid: z.number().int().positive().safe(),
	ownerStart: z.string().min(1).max(256),
});
export type NativeMossLifecycleHandle = z.infer<typeof lifecycleHandleSchema>;
const processTerminalSchema = z.strictObject({
	pid: z.number().int().positive().safe(),
	processStart: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{7}Z$/),
	exitCode: z.literal(0),
});
export type NativeProcessTerminal = NativeMossHandle &
	z.infer<typeof processTerminalSchema> & {
		bundleSHA256: string;
		channelOutcome: "EXIT_OBSERVED";
	};
type LifecycleOperation =
	| "alpha"
	| "finalize"
	| "reconcile"
	| "release"
	| "readArtifacts";
const lifecycleArtifactNames = [
	"config.json",
	"status.json",
	"execution.json",
	"preflight.json",
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
export type NativeMossTransportResult =
	| {
			state: "ALPHA_SUBMITTED" | "HOLD" | "RELEASED";
			handle: NativeMossLifecycleHandle;
			receipt: Record<string, unknown>;
	  }
	| { state: "LIFECYCLE_READINESS"; proof: Record<string, unknown> }
	| { state: "READY"; proof: Record<string, unknown> }
	| { state: "CONTEXT_PROOF"; bytes: Uint8Array }
	| {
			state: "NATIVE_COMPLETE_ALPHA_PENDING";
			handle: NativeMossHandle;
			receipt: Record<string, unknown>;
			nativeProcessTerminal?: NativeProcessTerminal;
	  }
	| {
			state: "ARTIFACTS";
			handle: NativeMossHandle;
			receipt: Record<string, unknown>;
			files: {
				name: string;
				byteBase64: string;
				sha256: string;
				size: number;
			}[];
	  }
	| {
			state: "UNKNOWN";
			code: string;
			handle?: NativeMossHandle;
			stagedInput?: { path: string; sha256: string; size: number };
			stageRecord?: NativeMossStageRecord;
			residue?: "RETAINED" | "CLEANED" | "UNCONFIRMED";
			observedNative?: NativeMossObservedNative;
	  }
	| { state: "NOT_READY" | "REJECTED"; code: string; stagedInput?: {path:string;sha256:string;size:number};stageRecord?:NativeMossStageRecord;residue?:"RETAINED"|"CLEANED"|"UNCONFIRMED" };

// Constant Python only. Every request and byte blob remains stdin data. The
// worker alone reserves/owns the GPU lease; read operations cannot call run().
// Private Python only: execute the exact verified bytes, including explicit
// file imports and private Python subprocesses. Installed toolkit/dependencies
// retain their own runtime pin contracts; this does not attest their bytecode.
const privateLoader = `import sys,json,pathlib,hashlib,importlib.abc,importlib.util,importlib.machinery,subprocess,base64
root=pathlib.Path("E:/git/linalab/PNGAL/environment/training/recovery16-workbench-worker-v1")
m=json.loads((root/'manifest.json').read_bytes())
assert m['implementationSHA256']=='8f52f75bb4fe62ffceb0cadacbeed34c6175bebf8ade9644d1337a3ab94f8218'
assert m['profileDigest']=='1b340aab2d91ca70ed0a6d01cfaa84df1f8194d71e9c0900c6874e1fd844c8c6'
assert hashlib.sha256(json.dumps(m['files'],sort_keys=True,separators=(',',':')).encode()).hexdigest()==m['implementationSHA256']
sources={}
for name,pin in m['files'].items():
 p=root/name
 assert p.resolve().is_relative_to(root.resolve()) and p.is_file() and not p.is_symlink()
 b=p.read_bytes(); assert len(b)==pin['size'] and hashlib.sha256(b).hexdigest()==pin['sha256']
 if name.endswith('.py'): sources[str(p.resolve())]=b
def verified(path):
 p=pathlib.Path(path).resolve()
 if p.is_relative_to(root.resolve()):
  assert str(p) in sources, 'NATIVE_UNPINNED_PRIVATE_IMPORT'
  return compile(sources[str(p)],str(p),'exec')
 return None
original_code=importlib.machinery.SourceFileLoader.get_code
def source_code(self,fullname):
 code=verified(self.path)
 return code if code is not None else original_code(self,fullname)
importlib.machinery.SourceFileLoader.get_code=source_code
class PrivateFinder(importlib.abc.MetaPathFinder):
 def find_spec(self,fullname,path=None,target=None):
  name=fullname+'.py'
  if name in m['files']:
   return importlib.util.spec_from_file_location(fullname,root/name)
  spec=importlib.machinery.PathFinder.find_spec(fullname,path)
  if spec and spec.origin and spec.origin not in ('built-in','frozen'):
   p=pathlib.Path(spec.origin).resolve()
   if p.is_relative_to(root.resolve()):
    assert str(p) in sources, 'NATIVE_UNPINNED_PRIVATE_IMPORT'
  return None
sys.meta_path.insert(0,PrivateFinder())
for name in [n[:-3] for n in m['files'] if n.endswith('.py')]: sys.modules.pop(name,None)
original_popen=subprocess.Popen
class private_popen(original_popen):
 def __init__(self,args,*a,**kw):
  if isinstance(args,(list,tuple)) and args and args[0]==sys.executable:
   script=next((i for i,v in enumerate(args[1:],1) if isinstance(v,str) and v.endswith('.py') and pathlib.Path(v).resolve().is_relative_to(root.resolve())),None)
   if script is not None:
    p=str(pathlib.Path(args[script]).resolve()); assert p in sources, 'NATIVE_UNPINNED_PRIVATE_PROCESS'
    code='import base64;setup='+repr(setup)+';exec(setup);sys.argv='+repr([p]+list(args[script+1:]))+';exec(compile(sources['+repr(p)+'],'+repr(p)+',"exec"),dict(__name__="__main__",__file__='+repr(p)+'))'
    args=[sys.executable,'-B','-u','-X','utf8','-c',code]
  super().__init__(args,*a,**kw)
subprocess.Popen=private_popen
sys.path.insert(0,str(root))
`;
const contextOperation = `import ast,io,uuid,re
def closed(value,keys):
 if type(value) is not dict or set(value)!=set(keys.split()): raise ValueError('NATIVE_CONTEXT_FIELDS')
closed(frame,'schema operation requestId nonce ownerBindingHash requestSHA256 profileDigest bundleSHA256 mode personId detail token originalSHA256 compilerSHA256')
assert frame['operation']=='preflightContext' and frame['bundleSHA256']==m['implementationSHA256'] and frame['profileDigest']==m['profileDigest'],'NATIVE_CONTEXT_BINDING'
for key in ('requestId','nonce'): assert str(uuid.UUID(frame[key]))==frame[key],'NATIVE_CONTEXT_UUID'
for key in ('ownerBindingHash','requestSHA256','compilerSHA256'): assert type(frame[key]) is str and re.fullmatch('[a-f0-9]{64}',frame[key]),'NATIVE_CONTEXT_HASH'
assert frame['mode'] in ('token-only','reference-img2img') and re.fullmatch('person-[0-9]+',frame['personId']),'NATIVE_CONTEXT_MODE'
assert (frame['originalSHA256'] is None if frame['mode']=='token-only' else type(frame['originalSHA256']) is str and re.fullmatch('[a-f0-9]{64}',frame['originalSHA256'])),'NATIVE_CONTEXT_SOURCE'
def unpack(value):
 closed(value,'byteBase64 sha256 size')
 assert type(value['size']) is int and 0<value['size']<=2097152,'NATIVE_CONTEXT_BLOB_LIMIT'
 raw=base64.b64decode(value['byteBase64'],validate=True)
 assert len(raw)==value['size'] and base64.b64encode(raw).decode()==value['byteBase64'] and hashlib.sha256(raw).hexdigest()==value['sha256'],'NATIVE_CONTEXT_BLOB_HASH'
 return json.loads(raw.decode('utf-8',errors='strict'))
detail=unpack(frame['detail']);token=unpack(frame['token'])
assert detail['id']==token['personId']==frame['personId'] and detail['characterId']==token['characterId'] and detail['name']==token['name'],'NATIVE_CONTEXT_PERSON'
def values(name,keys):
 ns={}
 for node in ast.parse(sources[str((root/name).resolve())]).body:
  if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id in keys for t in node.targets):exec(compile(ast.Module(body=[node],type_ignores=[]),name,'exec'),ns)
 return ns
r=values('runtime.py',('TRAINING','CONFIG','TOKENIZER'));ref=values('reference_pipeline_recipes.py',('PROMPT','SOURCE_PINS'));native=values('native_runner_v1.py',('SOURCE_PINS',))
import content_v1,context_v1
compiled=content_v1.compile_content(token) if frame['mode']=='token-only' else {'text':ref['PROMPT'],'fields':[],'holds':[]}
serialize=lambda v:json.dumps(v,ensure_ascii=False,separators=(',',':')).encode('utf-8')
assert not compiled['holds'] and '--' not in compiled['text'] and hashlib.sha256(serialize(compiled)).hexdigest()==frame['compilerSHA256'],'NATIVE_CONTEXT_COMPILER'
config={'tokenizerFolder':r['TOKENIZER'],'toolkit':r['CONFIG']['toolkit'],'mossSourceSHA256':native['SOURCE_PINS']['extensions_built_in/diffusion_models/moss_image/moss_image.py'],'prompts':[{'personId':frame['personId'],'text':compiled['text']}],'negative':''}
context_input=serialize(config)
buffer=io.BytesIO();capture=io.TextIOWrapper(buffer,encoding='utf-8',newline=None);original_stdout=sys.stdout
try:
 sys.stdout=capture
 context_v1.tokenizer_cpu(json.loads(context_input))
 capture.flush();context_response=buffer.getvalue()
finally:sys.stdout=original_stdout
assert 0<len(context_response)<=2097152,'NATIVE_CONTEXT_RESPONSE_LIMIT'
proof=json.loads(context_response)
assert proof['maxTextLength']==4096 and proof['truncation'] is False and proof['modelLoaded'] is False and [row['personId'] for row in proof['counts']]==[frame['personId'],'negative'] and all(type(row['tokens']) is int and 0<row['tokens']<=4096 for row in proof['counts']),'NATIVE_CONTEXT_OVERFLOW'
def packed(raw):return {'byteBase64':base64.b64encode(raw).decode(),'sha256':hashlib.sha256(raw).hexdigest(),'size':len(raw)}
result={'schema':'native-moss-context-proof.v1',**{k:frame[k] for k in ('requestId','nonce','ownerBindingHash','requestSHA256','profileDigest','bundleSHA256')},'contextRequestSHA256':hashlib.sha256(frame_bytes).hexdigest(),'helperPins':{k:m['files'][v] for k,v in {'content':'content_v1.py','context':'context_v1.py','runtime':'runtime.py','lifecycle':'lifecycle.py'}.items()},'compiled':compiled,'sourcePins':{**native['SOURCE_PINS'],**ref['SOURCE_PINS']},'contextInput':packed(context_input),'contextResponse':packed(context_response),'modelLoaded':False,'generationDispatched':False}
`;
const bootstrap = `import base64,zlib
setup=${JSON.stringify(privateLoader)}
exec(setup)
frame_bytes=sys.stdin.buffer.read(33554433)
assert len(frame_bytes)<=33554432,'NATIVE_INPUT_LIMIT'
frame=json.loads(frame_bytes.decode('utf-8',errors='strict'))
if frame.get('schema')=='native-moss-context-command.v1':
 exec(${JSON.stringify(contextOperation)})
elif frame.get('schema')=='native-moss-command.v1':
 import job
 result=job.command(frame)
elif frame.get('schema')=='native-moss-lifecycle-command.v1' and frame.get('operation') in ('readiness','alpha','finalize','reconcile','release','readArtifacts'):
 import lifecycle
 result=lifecycle.command(frame)
else: raise ValueError('NATIVE_COMMAND_OPERATION')
print(json.dumps(result,ensure_ascii=False),flush=True)
`;
// PowerShell owns the only worker process and never forwards worker stdout as
// terminal authority. The verified Python loader still executes in that worker.
const encodedPython = deflateSync(Buffer.from(bootstrap), {
	level: 9,
}).toString("base64");
const powershell = `$ErrorActionPreference='Stop';$ProgressPreference='SilentlyContinue'
$u=New-Object Text.UTF8Encoding($false,$true)
$c=[Console]::In.ReadLine()
if($c.Length -gt 32768){throw 'NATIVE_BOOTSTRAP_LIMIT'}
$b=New-Object char[] 65536;$d=New-Object Text.StringBuilder;$bytes=0
while(($n=[Console]::In.Read($b,0,$b.Length)) -gt 0){$bytes+=$u.GetByteCount($b,0,$n);if($bytes -gt ${MAX_INPUT}){throw 'NATIVE_INPUT_LIMIT'};[void]$d.Append($b,0,$n)}
$d=$d.ToString();$frame=$d | ConvertFrom-Json
$env:PYTHONUTF8='1';$env:PYTHONIOENCODING='utf-8';$env:NODE_PATH='E:/git/gisul/server/node_modules'
Set-Location -LiteralPath 'E:/git/linalab/PNGAL/environment/ai-toolkit'
$s=New-Object Diagnostics.ProcessStartInfo
$s.FileName='${DIRECT_PYTHON}'
$s.EnvironmentVariables['__PYVENV_LAUNCHER__']='${PYTHON}'
$s.Arguments='-B -u -X utf8 -c "import sys,base64,zlib,hashlib;b=zlib.decompress(base64.b64decode(sys.stdin.buffer.readline()));assert hashlib.sha256(b).hexdigest()==''${digest(bootstrap)}'';exec(b)"'
$s.UseShellExecute=$false;$s.RedirectStandardInput=$true;$s.RedirectStandardOutput=$true;$s.RedirectStandardError=$true
$s.StandardOutputEncoding=$u;$s.StandardErrorEncoding=$u
$p=New-Object Diagnostics.Process;$p.StartInfo=$s
try {
 if(-not $p.Start()){throw 'NATIVE_PYTHON_START'}
 $workerPid=$p.Id;$start=$p.StartTime.ToUniversalTime().ToString('o')
 if($p.MainModule.FileName.Replace([char]92,[char]47) -cne '${PYTHON_IMAGE}'){throw 'NATIVE_INTERPRETER_IMAGE'}
 $inputWriter=New-Object IO.StreamWriter($p.StandardInput.BaseStream,$u)
 $ob=New-Object char[] 16384;$eb=New-Object char[] 16384
 $o=New-Object Text.StringBuilder;$e=New-Object Text.StringBuilder;$oc=0;$ec=0
 $ot=$p.StandardOutput.ReadAsync($ob,0,$ob.Length);$et=$p.StandardError.ReadAsync($eb,0,$eb.Length)
 $write=$inputWriter.WriteAsync($c+[Environment]::NewLine+$d);$written=$false
 $clock=[Diagnostics.Stopwatch]::StartNew()
 while($null -ne $ot -or $null -ne $et -or -not $written -or -not $p.HasExited){
  if($clock.ElapsedMilliseconds -ge 1800000){throw 'NATIVE_CHILD_TIMEOUT'}
  if(-not $written -and $write.IsCompleted){[void]$write.GetAwaiter().GetResult();$inputWriter.Close();$written=$true}
  if($null -ne $ot -and $ot.IsCompleted){$n=$ot.GetAwaiter().GetResult();if($n -eq 0){$ot=$null}else{$oc+=$u.GetByteCount($ob,0,$n);if($oc -gt ${MAX_OUTPUT}){throw 'NATIVE_CHILD_OUTPUT_LIMIT'};[void]$o.Append($ob,0,$n);$ot=$p.StandardOutput.ReadAsync($ob,0,$ob.Length)}}
  if($null -ne $et -and $et.IsCompleted){$n=$et.GetAwaiter().GetResult();if($n -eq 0){$et=$null}else{$ec+=$u.GetByteCount($eb,0,$n);if($ec -gt 1048576){throw 'NATIVE_CHILD_LOG_LIMIT'};[void]$e.Append($eb,0,$n);$et=$p.StandardError.ReadAsync($eb,0,$eb.Length)}}
  $pending=New-Object 'Collections.Generic.List[Threading.Tasks.Task]'
  if($null -ne $ot){$pending.Add($ot)};if($null -ne $et){$pending.Add($et)};if(-not $written){$pending.Add($write)}
  if($pending.Count -gt 0){[void][Threading.Tasks.Task]::WaitAny($pending.ToArray(),100)}else{[void]$p.WaitForExit(100)}
 }
 $p.WaitForExit();$exitCode=$p.ExitCode
 [Console]::Error.Write($e.ToString())
 if($frame.schema -eq 'native-moss-command.v1' -and $frame.operation -eq 'execute'){
  $response=$o.ToString() | ConvertFrom-Json
  [Console]::Out.WriteLine((@{schema='native-moss-process-response.v1';response=$response;process=@{pid=$workerPid;processStart=$start;exitCode=$exitCode}} | ConvertTo-Json -Depth 100 -Compress))
 }else{[Console]::Out.Write($o.ToString())}
} finally {if($null -ne $p -and $p.Id -gt 0){if(-not $p.HasExited){$p.Kill()};$p.WaitForExit();$p.Dispose()}}
exit $exitCode
`;
const launchScript = `$b=[Convert]::FromBase64String('${gzipSync(Buffer.from(powershell), { level: 9 }).toString("base64")}');$m=New-Object IO.MemoryStream(,$b);$g=New-Object IO.Compression.GZipStream($m,[IO.Compression.CompressionMode]::Decompress);$r=New-Object IO.StreamReader($g);$s=$r.ReadToEnd();$h=[Security.Cryptography.SHA256]::Create();if(([BitConverter]::ToString($h.ComputeHash([Text.Encoding]::UTF8.GetBytes($s))).Replace('-','').ToLowerInvariant()) -ne '${digest(powershell)}'){throw 'NATIVE_OBSERVER_HASH'};& ([scriptblock]::Create($s))`;
const argv = [
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
	Buffer.from(launchScript, "utf16le").toString("base64"),
];

export type NativeMossStageRecord = NativeMossHandle & {
	bundleSHA256: string;
	stageNonce: string;
	path: string;
	frameSHA256: string;
	size: number;
	phase: "INTENT" | "RESERVED" | "UPLOADED" | "VERIFIED" | "LAUNCHING" | "OBSERVED" | "CLEANED" | "RETAINED";
};
export type NativeMossObservedNative = {
	receipt: Record<string, unknown>;
	nativeProcessTerminal: NativeProcessTerminal;
};
export type NativeMossTransportOptions = {
	signal?: AbortSignal;
	onProgress?: (event: { stream: "stderr"; bytes: number }) => void;
	// Server-private durability boundary. Required for staged execute, never a
	// browser-supplied flag. Provider fsyncs its existing job receipt before return.
	onStageIntent?: (stage: NativeMossStageRecord) => Promise<void>;
	onStageUpdate?: (stage: NativeMossStageRecord, observedNative?: NativeMossObservedNative) => Promise<void>;
};
type Options = NativeMossTransportOptions;
type TestOptions = {
	executable: string;
	prefix?: string[];
	timeoutMs?: number;
	maxOutputBytes?: number;
	sftpExecutable?: string;
	sftpPrefix?: string[];
};

// Only validated identities enter fixed paths; no caller path or shell text.
const incomingRoot =
	"D:/AI/environments/PNGAL/training/recovery16-workbench-jobs-v1/incoming";
const stageGuard = `$ErrorActionPreference='Stop';$root='${incomingRoot}';$me=[Security.Principal.WindowsIdentity]::GetCurrent().User;$allowed=@($me.Value,'S-1-5-18','S-1-5-32-544')
function PrivatePath([string]$p){$i=Get-Item -LiteralPath $p;if(($i.Attributes -band 1024) -ne 0 -or $i.FullName.Replace([char]92,[char]47) -cne $p){throw 'NATIVE_STAGE_CANONICAL'};$a=Get-Acl -LiteralPath $p;if($a.Owner -ne $me.Translate([Security.Principal.NTAccount]).Value -or -not $a.AreAccessRulesProtected){throw 'NATIVE_STAGE_OWNER_ACL'};foreach($r in $a.Access){if($r.AccessControlType -eq 'Allow' -and $allowed -notcontains $r.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value -and [int]$r.FileSystemRights -ne 0){throw 'NATIVE_STAGE_BROAD_ACCESS'}}}
function NewPrivateDirectory([string]$p){$a=New-Object Security.AccessControl.DirectorySecurity;$a.SetOwner($me);$a.SetAccessRuleProtection($true,$false);foreach($sid in $allowed){$s=New-Object Security.Principal.SecurityIdentifier($sid);$r=New-Object Security.AccessControl.FileSystemAccessRule($s,'FullControl','ContainerInherit,ObjectInherit','None','Allow');$a.AddAccessRule($r)};[void][IO.Directory]::CreateDirectory($p,$a);PrivatePath $p}
$parent=Split-Path $root;$canonical=$parent.Replace([char]92,[char]47);if($canonical -cne 'D:/AI/environments/PNGAL/training/recovery16-workbench-jobs-v1'){throw 'NATIVE_STAGE_ROOT'};$ancestor=Get-Item -LiteralPath $parent;while($null -ne $ancestor){if(($ancestor.Attributes -band 1024) -ne 0){throw 'NATIVE_STAGE_ANCESTOR_REPARSE'};$ancestor=$ancestor.Parent};PrivatePath $canonical;if(-not(Test-Path -LiteralPath $root)){NewPrivateDirectory $root};PrivatePath $root;
`;

async function stageChannel(
	executable: string,
	args: string[],
	input: string,
	signal?: AbortSignal,
) {
	if (signal?.aborted) throw Error("NATIVE_STAGE_ABORTED");
	return new Promise<string>((resolve, reject) => {
		const child = spawn(executable, args, {
			shell: false,
			stdio: ["pipe", "pipe", "pipe"],
		});
		let output = "",
			failed = false;
		const abort = () => {
			failed = true;
			child.kill("SIGKILL");
		};
		const timer = setTimeout(abort, 30000);
		signal?.addEventListener("abort", abort, { once: true });
		child.stdout.on("data", (b: Buffer) => {
			output += b.toString();
			if (Buffer.byteLength(output) > 65536) abort();
		});
		child.stderr.resume();
		child.stdin.on("error", abort);
		child.on("error", () => {
			failed = true;
		});
		child.once("close", (code) => {
			clearTimeout(timer);
			signal?.removeEventListener("abort", abort);
			if (failed || code !== 0) reject(Error("NATIVE_STAGE_CHANNEL"));
			else resolve(output);
		});
		child.stdin.end(input);
	});
}

export function createNativeMossTransport(testOptions?: TestOptions) {
	if (testOptions && process.env.NODE_ENV !== "test")
		throw Error("NATIVE_TEST_INJECTION_FORBIDDEN");
	const attempted = new Set<string>();
	const phaseAttempts = new Set<string>();
	async function call(
		operation: string,
		fields: {
			handle?: NativeMossHandle;
			job?: unknown;
			contextBytes?: Uint8Array;
			staged?: { path: string; sha256: string; size: number };
			lifecycle?: NativeMossLifecycleHandle | true;
		},
		options: Options = {},
	): Promise<NativeMossTransportResult> {
		const handle = fields.handle;
		const input = fields.contextBytes
			? new TextDecoder("utf-8", { fatal: true }).decode(fields.contextBytes)
			: JSON.stringify({
					schema: fields.lifecycle
						? "native-moss-lifecycle-command.v1"
						: "native-moss-command.v1",
					operation,
					profileDigest: NATIVE_MOSS_PROFILE_DIGEST,
					...(fields.job ? { job: fields.job } : {}),
					...(handle && operation !== "execute"
						? {
								requestId: handle.requestId,
								nonce: handle.nonce,
								ownerBindingHash: handle.ownerBindingHash,
								envelopeSHA256: handle.envelopeSHA256,
							}
						: {}),
					...(typeof fields.lifecycle === "object" ? fields.lifecycle : {}),
				});
		if (Buffer.byteLength(input) > MAX_INPUT)
			return { state: "REJECTED", code: "NATIVE_INPUT_LIMIT" };
		if (options.signal?.aborted)
			return { state: "REJECTED", code: "NATIVE_ABORTED_BEFORE_START" };
		return new Promise((resolve) => {
			let started = false;
			let settled = false;
			let closing: NativeMossTransportResult | undefined;
			let killTimer: ReturnType<typeof setTimeout> | undefined;
			let output = "";
			let outputBytes = 0;
			let errorBytes = 0;
			let callArgv = argv;
			let callCode = encodedPython;
			if (fields.staged) {
				const staged = fields.staged;
				const code = bootstrap.replace(
					"frame_bytes=sys.stdin.buffer.read(33554433)",
					`input_path=pathlib.Path(${JSON.stringify(staged.path)})\nassert not input_path.is_symlink() and not (getattr(input_path.lstat(),'st_file_attributes',0)&1024) and input_path.stat().st_size==${staged.size},'NATIVE_STAGED_PATH'\nframe_bytes=input_path.read_bytes()\nassert len(frame_bytes)==${staged.size} and hashlib.sha256(frame_bytes).hexdigest()==${JSON.stringify(staged.sha256)},'NATIVE_STAGED_HASH'`,
				);
				callCode = deflateSync(Buffer.from(code), { level: 9 }).toString(
					"base64",
				);
				const ps = powershell.replace(digest(bootstrap), digest(code));
				const launch = launchScript
					.replace(
						gzipSync(Buffer.from(powershell), { level: 9 }).toString("base64"),
						gzipSync(Buffer.from(ps), { level: 9 }).toString("base64"),
					)
					.replace(digest(powershell), digest(ps));
				callArgv = [
					...argv.slice(0, -1),
					Buffer.from(launch, "utf16le").toString("base64"),
				];
				if (callArgv.join(" ").length >= 8191) {
					resolve({ state: "REJECTED", code: "NATIVE_BOOTSTRAP_LIMIT" });
					return;
				}
			}
			const child = spawn(
				testOptions?.executable ?? "ssh",
				[...(testOptions?.prefix ?? []), ...callArgv],
				{ shell: false, stdio: ["pipe", "pipe", "pipe"] },
			);
			const uncertain = (code: string): NativeMossTransportResult =>
				((operation === "execute" ||
					(fields.lifecycle && operation !== "readiness")) &&
					started) ||
				operation === "status" ||
				operation === "readArtifacts"
					? { state: "UNKNOWN", code, ...(handle ? { handle } : {}) }
					: {
							state:
								operation === "execute" ||
								(fields.lifecycle && operation !== "readiness")
									? "REJECTED"
									: "NOT_READY",
							code,
						};
			const finish = (result: NativeMossTransportResult) => {
				if (settled) return;
				settled = true;
				clearTimeout(timer);
				clearTimeout(killTimer);
				options.signal?.removeEventListener("abort", abort);
				resolve(result);
			};
			const terminate = (result: NativeMossTransportResult) => {
				if (settled || closing) return;
				closing = result;
				clearTimeout(timer);
				child.kill();
				killTimer = setTimeout(() => child.kill("SIGKILL"), 250);
			};
			const abort = () => terminate(uncertain("NATIVE_CHANNEL_ABORTED"));
			const timer = setTimeout(
				() => {
					terminate(uncertain("NATIVE_CHANNEL_TIMEOUT"));
				},
				testOptions?.timeoutMs ??
					(["execute", "alpha", "finalize"].includes(operation)
						? 1800000
						: 180000),
			);
			options.signal?.addEventListener("abort", abort, { once: true });
			child.once("spawn", () => {
				started = true;
				child.stdin.end(
					`${callCode}\n${fields.staged ? JSON.stringify({ schema: "native-moss-command.v1", operation: "execute", profileDigest: NATIVE_MOSS_PROFILE_DIGEST }) : input}`,
				);
			});
			child.stdin.on("error", () =>
				terminate(uncertain("NATIVE_STDIN_FAILED")),
			);
			child.once("error", () => {
				if (started) terminate(uncertain("NATIVE_SSH_UNAVAILABLE"));
				else finish(uncertain("NATIVE_SSH_UNAVAILABLE"));
			});
			child.stdout.on("data", (chunk: Buffer) => {
				if (settled || closing) return;
				outputBytes += chunk.length;
				if (outputBytes > (testOptions?.maxOutputBytes ?? MAX_OUTPUT)) {
					terminate(uncertain("NATIVE_OUTPUT_LIMIT"));
					return;
				}
				output += chunk.toString("utf8");
			});
			child.stderr.on("data", (chunk: Buffer) => {
				if (settled || closing) return;
				errorBytes += chunk.length;
				// Never expose submitted prompt/source text or raw SSH errors.
				options.onProgress?.({ stream: "stderr", bytes: chunk.length });
				if (errorBytes > 1024 * 1024) {
					terminate(uncertain("NATIVE_LOG_LIMIT"));
				}
			});
			child.once("close", (code) => {
				if (settled) return;
				if (closing) {
					finish(closing);
					return;
				}
				if (code !== 0) {
					finish(uncertain("NATIVE_REMOTE_EXIT"));
					return;
				}
				try {
					const wire = JSON.parse(output);
					const observed =
						operation === "execute" && !fields.lifecycle
							? z
									.strictObject({
										schema: z.literal("native-moss-process-response.v1"),
										response: z.record(z.string(), z.unknown()),
										process: processTerminalSchema,
									})
									.parse(wire)
							: undefined;
					const frame = observed ? observed.response : wire;
					if (operation === "preflightContext") {
						if (
							frame.schema !== "native-moss-context-proof.v1" ||
							frame.modelLoaded !== false ||
							frame.generationDispatched !== false ||
							frame.contextRequestSHA256 !== digest(input)
						)
							throw Error();
						const request = JSON.parse(input);
						for (const key of [
							"requestId",
							"nonce",
							"ownerBindingHash",
							"requestSHA256",
							"profileDigest",
							"bundleSHA256",
						])
							if (frame[key] !== request[key]) throw Error();
						finish({
							state: "CONTEXT_PROOF",
							bytes: Buffer.from(output, "utf8"),
						});
						return;
					}
					if (fields.lifecycle) {
						if (operation === "readiness") {
							if (
								frame.schema !== "native-moss-lifecycle-readiness.v1" ||
								typeof frame.ready !== "boolean" ||
								frame.modelLoaded !== false ||
								frame.generationDispatched !== false ||
								(frame.ready &&
									(frame.proof?.processInventoryComplete !== true ||
										typeof frame.proof.processes !== "object" ||
										frame.proof.processes === null ||
										!Number.isFinite(frame.proof.freeMiB) ||
										!Number.isFinite(frame.proof.utilization) ||
										frame.proof.freeMiB < 8192 ||
										frame.proof.utilization > 5))
							)
								throw Error();
							finish({ state: "LIFECYCLE_READINESS", proof: frame });
							return;
						}
						const binding = lifecycleHandleSchema.parse(fields.lifecycle);
						if (
							operation === "readArtifacts" &&
							frame.schema === "native-moss-lifecycle-artifacts.v1"
						) {
							if (frame.state === "NOT_READY") {
								const failure = z
									.strictObject({
										schema: z.literal("native-moss-lifecycle-artifacts.v1"),
										state: z.literal("NOT_READY"),
										code: z
											.string()
											.max(100)
											.regex(/^(LIFECYCLE|NATIVE)_[A-Z_]+$/),
									})
									.parse(frame);
								finish({ state: "NOT_READY", code: failure.code });
								return;
							}
							const result = z
								.strictObject({
									schema: z.literal("native-moss-lifecycle-artifacts.v1"),
									state: z.literal("ARTIFACTS"),
									receipt: z.looseObject({
										schema: z.literal("native-moss-execution.v1"),
										state: z.literal("HOLD"),
										alphaFinished: z.literal(true),
										qualityQualified: z.literal(false),
										ownerApproved: z.literal(false),
										ownerProcess: z.strictObject({
											pid: z.number().int().positive(),
											start: z.string(),
										}),
										finalSHA256: hash,
									}),
									artifacts: z
										.array(
											z.strictObject({
												name: z.enum(lifecycleArtifactNames),
												size: z.number().int().positive().max(8388608),
												sha256: hash,
												byteBase64: z.string(),
											}),
										)
										.length(13),
								})
								.parse(frame);
							const receipt = result.receipt;
							if (
								receipt.schema !== "native-moss-execution.v1" ||
								receipt.state !== "HOLD" ||
								receipt.alphaFinished !== true ||
								receipt.qualityQualified !== false ||
								receipt.ownerApproved !== false ||
								Object.entries(binding).some(
									([key, value]) =>
										!["ownerPid", "ownerStart"].includes(key) &&
										receipt[key] !== value,
								) ||
								(receipt.ownerProcess as { pid?: unknown; start?: unknown })
									?.pid !== binding.ownerPid ||
								(receipt.ownerProcess as { start?: unknown })?.start !==
									binding.ownerStart ||
								new Set(result.artifacts.map((file) => file.name)).size !==
									13 ||
								result.artifacts.reduce((sum, file) => sum + file.size, 0) >
									32 * 1024 * 1024
							)
								throw Error();
							for (const file of result.artifacts) {
								const bytes = Buffer.from(file.byteBase64, "base64");
								if (
									bytes.toString("base64") !== file.byteBase64 ||
									bytes.length !== file.size ||
									digest(bytes) !== file.sha256 ||
									(!file.name.startsWith("output/") &&
										file.name !== "preflight.json" &&
										file.size > 2 * 1024 * 1024)
								)
									throw Error();
								if (
									file.name === "config.json" &&
									file.sha256 !== binding.envelopeSHA256
								)
									throw Error();
								if (
									file.name === "execution.json" &&
									!isDeepStrictEqual(
										JSON.parse(bytes.toString("utf8")),
										receipt,
									)
								)
									throw Error();
								if (
									file.name === "output/final-RGBA.png" &&
									file.sha256 !== receipt.finalSHA256
								)
									throw Error();
							}
							finish({
								state: "ARTIFACTS",
								handle: binding,
								receipt,
								files: result.artifacts,
							});
							return;
						}
						if (
							operation === "reconcile" &&
							frame.schema === "native-moss-lifecycle-status.v1" &&
							frame.state === "UNKNOWN" &&
							frame.requestId === binding.requestId &&
							frame.launchAllowed === false
						) {
							finish({
								state: "UNKNOWN",
								code: "NATIVE_TERMINAL_UNAVAILABLE",
								handle: binding,
							});
							return;
						}
						if (
							operation === "alpha" &&
							frame.schema === "native-moss-alpha-phase.v1" &&
							frame.state === "ALPHA_SUBMITTED" &&
							z.uuid().safeParse(frame.promptId).success
						) {
							finish({
								state: "ALPHA_SUBMITTED",
								handle: binding,
								receipt: frame,
							});
							return;
						}
						if (
							operation === "release" &&
							frame.schema === "native-moss-lifecycle-release.v1" &&
							frame.state === "RELEASED" &&
							hash.safeParse(frame.finalSHA256).success
						) {
							finish({ state: "RELEASED", handle: binding, receipt: frame });
							return;
						}
						if (
							!["finalize", "reconcile"].includes(operation) ||
							frame.schema !== "native-moss-execution.v1" ||
							frame.state !== "HOLD" ||
							frame.alphaFinished !== true ||
							frame.qualityQualified !== false ||
							frame.ownerApproved !== false ||
							!hash.safeParse(frame.finalSHA256).success ||
							Object.entries(binding).some(
								([key, value]) =>
									!["ownerPid", "ownerStart"].includes(key) &&
									frame[key] !== value,
							) ||
							frame.ownerProcess?.pid !== binding.ownerPid ||
							frame.ownerProcess?.start !== binding.ownerStart
						)
							throw Error();
						finish({ state: "HOLD", handle: binding, receipt: frame });
						return;
					}
					if (operation === "readiness") {
						if (
							frame.schema !== "native-moss-readiness.v1" ||
							frame.profileDigest !== NATIVE_MOSS_PROFILE_DIGEST ||
							frame.bundleSHA256 !== BUNDLE ||
							frame.modelLoaded !== false ||
							frame.generationDispatched !== false
						)
							throw Error();
						if (frame.ready === true && frame.reason === null) {
							finish({ state: "READY", proof: frame });
							return;
						}
						if (
							frame.ready !== false ||
							typeof frame.reason !== "string" ||
							!/^NATIVE_[A-Z_]+$/.test(frame.reason)
						)
							throw Error();
						finish({
							state: "NOT_READY",
							code: frame.reason,
						});
						return;
					}
					const receipt = operation === "execute" ? frame : frame.receipt;
					if (
						operation === "status" &&
						frame.schema !== "native-moss-status.v1"
					)
						throw Error();
					if (
						!handle ||
						receipt?.schema !== "native-moss-native-phase.v1" ||
						receipt.bundleSHA256 !== BUNDLE ||
						receipt.state !== "NATIVE_COMPLETE_ALPHA_PENDING" ||
						Object.entries(handle).some(
							([key, value]) => receipt[key] !== value,
						)
					)
						throw Error();
					if (operation === "readArtifacts") {
						if (frame.schema !== "native-moss-artifacts.v1") throw Error();
						const files = z
							.array(
								z.strictObject({
									name: z.enum(["preflight.json", "raw.png", "crop-RGB.png"]),
									byteBase64: z.string(),
									sha256: hash,
									size: z.number().int().positive().max(8388608),
								}),
							)
							.length(3)
							.parse(frame.artifacts);
						if (
							new Set(files.map((file) => file.name)).size !== 3 ||
							files.some((file) => {
								const bytes = Buffer.from(file.byteBase64, "base64");
								if (file.name === "preflight.json") {
									return (
										bytes.toString("base64") !== file.byteBase64 ||
										bytes.length !== file.size ||
										file.size > 2 * 1024 * 1024 ||
										digest(bytes) !== file.sha256 ||
										receipt.preflightSHA256 !== file.sha256 ||
										receipt.preflightSize !== file.size
									);
								}
								return (
									bytes.toString("base64") !== file.byteBase64 ||
									bytes.length !== file.size ||
									digest(bytes) !== file.sha256 ||
									receipt.native?.[
										file.name === "raw.png" ? "rawSHA256" : "cropSHA256"
									] !== file.sha256
								);
							})
						)
							throw Error();
						finish({ state: "ARTIFACTS", handle, receipt, files });
						return;
					}
					let nativeProcessTerminal: NativeProcessTerminal | undefined;
					if (operation === "execute") {
						if (
							!observed ||
							receipt.native?.pid !== observed.process.pid ||
							receipt.native?.processStart !== observed.process.processStart ||
							receipt.native?.phaseOutcome !== "RETURNED_SUCCESSFULLY"
						)
							throw Error();
						nativeProcessTerminal = {
							...handle,
							bundleSHA256: BUNDLE,
							...observed.process,
							channelOutcome: "EXIT_OBSERVED",
						};
					}
					finish({
						state: "NATIVE_COMPLETE_ALPHA_PENDING",
						handle,
						receipt,
						...(nativeProcessTerminal ? { nativeProcessTerminal } : {}),
					});
				} catch {
					finish(uncertain("NATIVE_RESPONSE_MISMATCH"));
				}
			});
		});
	}
	const lifecycleCall = (
		operation: LifecycleOperation,
		input: NativeMossLifecycleHandle,
		options?: Options,
	) => {
		const binding = lifecycleHandleSchema.parse(input);
		if (operation !== "reconcile" && operation !== "readArtifacts") {
			const key = `${operation}:${binding.requestId}`;
			if (phaseAttempts.has(key))
				return Promise.resolve<NativeMossTransportResult>({
					state: "UNKNOWN",
					code: "NATIVE_ALREADY_ATTEMPTED",
					handle: binding,
				});
			phaseAttempts.add(key);
		}
		return call(operation, { handle: binding, lifecycle: binding }, options);
	};
	return {
		preflightContext: async (
			requestBytes: Uint8Array,
			options?: Options,
		): Promise<Uint8Array> => {
			if (requestBytes.length > MAX_INPUT)
				throw Error("NATIVE_CONTEXT_INPUT_LIMIT");
			const contextRequest = contextRequestSchema.parse(
				JSON.parse(
					new TextDecoder("utf-8", { fatal: true }).decode(requestBytes),
				),
			);
			for (const blob of [contextRequest.detail, contextRequest.token]) {
				const raw = Buffer.from(blob.byteBase64, "base64");
				if (
					raw.toString("base64") !== blob.byteBase64 ||
					raw.length !== blob.size ||
					digest(raw) !== blob.sha256
				)
					throw Error("NATIVE_CONTEXT_BLOB_HASH");
			}
			const result = await call(
				"preflightContext",
				{ contextBytes: requestBytes },
				options,
			);
			if (result.state !== "CONTEXT_PROOF")
				throw Error(
					"code" in result ? result.code : "NATIVE_CONTEXT_RESPONSE_INVALID",
				);
			return result.bytes;
		},
		lifecycleReadArtifacts: (
			binding: NativeMossLifecycleHandle,
			options?: Options,
		) => lifecycleCall("readArtifacts", binding, options),
		lifecycleReadiness: (options?: Options) =>
			call("readiness", { lifecycle: true }, options),
		combinedReadiness: async (options?: Options) => {
			const native = await call("readiness", {}, options);
			const lifecycle = await call("readiness", { lifecycle: true }, options);
			return {
				state: "NOT_READY" as const,
				code:
					native.state === "NOT_READY"
						? native.code
						: "NATIVE_FINAL_READINESS_UNQUALIFIED",
				native,
				lifecycle,
			};
		},
		alpha: (binding: NativeMossLifecycleHandle, options?: Options) =>
			lifecycleCall("alpha", binding, options),
		finalize: (binding: NativeMossLifecycleHandle, options?: Options) =>
			lifecycleCall("finalize", binding, options),
		reconcile: (binding: NativeMossLifecycleHandle, options?: Options) =>
			lifecycleCall("reconcile", binding, options),
		release: (binding: NativeMossLifecycleHandle, options?: Options) =>
			lifecycleCall("release", binding, options),
		readiness: (options?: Options) => call("readiness", {}, options),
		execute: async (
			envelope: Uint8Array,
			options?: Options,
		): Promise<NativeMossTransportResult> => {
			if (envelope.length > 32 * 1024 * 1024)
				return Promise.resolve({
					state: "REJECTED",
					code: "NATIVE_INPUT_LIMIT",
				});
			let handle: NativeMossHandle;
			try {
				const job = JSON.parse(Buffer.from(envelope).toString("utf8"));
				handle = handleSchema.parse({
					requestId: job.requestId,
					nonce: job.nonce,
					ownerBindingHash: job.ownerBindingHash,
					profileDigest: job.profileDigest,
					envelopeSHA256: digest(JSON.stringify(job)),
				});
				if (job.schema !== "native-moss-job.v1") throw Error();
			} catch {
				return Promise.resolve({
					state: "REJECTED",
					code: "NATIVE_ENVELOPE_INVALID",
				});
			}
			if (attempted.has(handle.requestId))
				return Promise.resolve({
					state: "UNKNOWN",
					code: "NATIVE_ALREADY_ATTEMPTED",
					handle,
				});
			attempted.add(handle.requestId);
			const job = JSON.parse(Buffer.from(envelope).toString("utf8"));
			const frame = JSON.stringify({
				schema: "native-moss-command.v1",
				operation: "execute",
				profileDigest: NATIVE_MOSS_PROFILE_DIGEST,
				job,
			});
			if (Buffer.byteLength(frame) > MAX_INPUT)
				return { state: "REJECTED", code: "NATIVE_INPUT_LIMIT" };
			if (Buffer.byteLength(frame) > 1024 * 1024) {
				if(options?.signal?.aborted)return {state:"REJECTED",code:"NATIVE_ABORTED_BEFORE_START"};
				if(!options?.onStageIntent || !options.onStageUpdate)return {state:"REJECTED",code:"NATIVE_STAGE_DURABILITY_REQUIRED"};
				let local:string|undefined,launched=false,remoteTouched=false;
				let observedNative:NativeMossObservedNative|undefined;
				let residue:"RETAINED"|"CLEANED"|"UNCONFIRMED"="UNCONFIRMED";
				const stageNonce=randomUUID();
				const directory=`${incomingRoot}/${handle.requestId}-${handle.nonce}-${stageNonce}`;
				const staged={path:directory+"/"+digest(frame)+".json",sha256:digest(frame),size:Buffer.byteLength(frame)};
				let stageRecord:NativeMossStageRecord={...handle,bundleSHA256:BUNDLE,stageNonce,path:staged.path,frameSHA256:staged.sha256,size:staged.size,phase:"INTENT"};
				const marker=directory+".owner.json";
				const markerBytes=Buffer.from(JSON.stringify(stageRecord));const markerHash=digest(markerBytes);
				const markerGuard=`${stageGuard}PrivatePath '${marker}';if((Get-FileHash -LiteralPath '${marker}' -Algorithm SHA256).Hash.ToLowerInvariant() -cne '${markerHash}'){throw 'NATIVE_STAGE_OWNER_CHANGED'};if(Test-Path -LiteralPath '${directory}'){PrivatePath '${directory}'};`;
				const remote=(script:string,signal?:AbortSignal)=>stageChannel(testOptions?.executable??"ssh",[...(testOptions?.prefix??[]),...argv.slice(0,-1),Buffer.from(script,"utf16le").toString("base64")],"",signal);
				const update=async(phase:NativeMossStageRecord["phase"])=>{stageRecord={...stageRecord,phase};await options.onStageUpdate!(stageRecord,observedNative);};
				const cleanup=async()=>{await remote(`${markerGuard}$p='${staged.path}';if(Test-Path -LiteralPath $p){PrivatePath $p;$f=[IO.File]::Open($p,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::None);try{$h=[Convert]::ToBase64String(([Security.Cryptography.SHA256]::Create()).ComputeHash($f));$n=$f.Length}finally{$f.Dispose()};if($n -ne 0 -and ($n -ne ${staged.size} -or $h -cne '${createHash("sha256").update(frame).digest("base64")}')){throw 'NATIVE_STAGE_PARTIAL_RETAINED'};Remove-Item -LiteralPath $p};if(Test-Path -LiteralPath '${directory}'){[IO.Directory]::Delete('${directory}')};Remove-Item -LiteralPath '${marker}';[Console]::Out.WriteLine('STAGE_CLEANED')`);residue="CLEANED";};
				try {
					await options.onStageIntent(stageRecord);
					remoteTouched=true;
					await remote(`${stageGuard}$marker='${marker}';$bytes=[Convert]::FromBase64String('${markerBytes.toString("base64")}');$acl=New-Object Security.AccessControl.FileSecurity;$acl.SetOwner($me);$acl.SetAccessRuleProtection($true,$false);foreach($sid in $allowed){$s=New-Object Security.Principal.SecurityIdentifier($sid);$acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($s,'FullControl','Allow')))};$claim=New-Object IO.FileStream($marker,[IO.FileMode]::CreateNew,[Security.AccessControl.FileSystemRights]::FullControl,[IO.FileShare]::None,4096,[IO.FileOptions]::WriteThrough,$acl);try{$claim.Write($bytes,0,$bytes.Length);$claim.Flush($true);if(Test-Path -LiteralPath '${directory}'){throw 'NATIVE_STAGE_COLLISION'};NewPrivateDirectory '${directory}';$f=New-Object IO.FileStream('${staged.path}',[IO.FileMode]::CreateNew,[Security.AccessControl.FileSystemRights]::FullControl,[IO.FileShare]::None,4096,[IO.FileOptions]::WriteThrough,$acl);$f.Dispose()}finally{$claim.Dispose()};PrivatePath $marker;PrivatePath '${staged.path}';[Console]::Out.WriteLine('STAGE_RESERVED')`,options.signal);
					await update("RESERVED");
					local=await mkdtemp(join(tmpdir(),"native-stage-"));const inputFile=join(local,"frame.json");await writeFile(inputFile,frame,{flag:"wx",mode:0o600});
					await stageChannel(testOptions?.sftpExecutable??"sftp",[...(testOptions?.sftpPrefix??[]),"-b","-","-o","BatchMode=yes","-o","StrictHostKeyChecking=yes","-o","HostName=100.77.98.25","-o","User=oliver","windows"],`put "${inputFile}" "/${staged.path}"\n`,options.signal);
					await update("UPLOADED");
					await remote(`${markerGuard}PrivatePath '${staged.path}';$f=[IO.File]::Open('${staged.path}',[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::None);try{if($f.Length -ne ${staged.size} -or [Convert]::ToBase64String(([Security.Cryptography.SHA256]::Create()).ComputeHash($f)) -cne '${createHash("sha256").update(frame).digest("base64")}'){throw 'NATIVE_STAGED_HASH'}}finally{$f.Dispose()};[Console]::Out.WriteLine('STAGE_VERIFIED')`,options.signal);
					await update("VERIFIED");
					await update("LAUNCHING");
					launched=true;
					const result=await call("execute",{handle,job,staged},options);
					if(result.state==="NATIVE_COMPLETE_ALPHA_PENDING" && result.nativeProcessTerminal){
						observedNative={receipt:result.receipt,nativeProcessTerminal:result.nativeProcessTerminal};
						await update("OBSERVED");await cleanup();await update("CLEANED");return result;
					}
					residue="RETAINED";await update("RETAINED");
					return {state:"UNKNOWN",code:"code" in result?result.code:"NATIVE_STAGE_EXECUTION_UNCONFIRMED",handle,stagedInput:staged,stageRecord,residue};
				} catch {
					if(remoteTouched && !launched && stageRecord.phase!=="INTENT"){try{await cleanup();residue="CLEANED";}catch{residue="RETAINED";}}
					if(launched)residue="RETAINED";
					if(remoteTouched){try{await update(residue==="CLEANED"?"CLEANED":"RETAINED");}catch{}}
					return {state:launched?"UNKNOWN":"REJECTED",code:launched?"NATIVE_STAGE_TERMINAL_UNCERTAIN":"NATIVE_STAGE_FAILED",handle,stagedInput:staged,stageRecord,residue,...(observedNative?{observedNative}:{})};
				} finally {if(local)await rm(local,{recursive:true,force:true});}
			}
			return call("execute", { handle, job }, options);
		},
		status: (handle: NativeMossHandle, options?: Options) =>
			call("status", { handle: handleSchema.parse(handle) }, options),
		readArtifacts: (handle: NativeMossHandle, options?: Options) =>
			call("readArtifacts", { handle: handleSchema.parse(handle) }, options),
	};
}
export const transport = createNativeMossTransport();
