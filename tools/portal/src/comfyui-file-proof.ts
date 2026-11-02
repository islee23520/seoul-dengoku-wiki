import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";

// Reviewed server-owned destination and installation; never browser input.
export const COMFY_ENDPOINT = "http://100.77.98.25:8188";
export const COMFY_ROOT = "D:/AI/environments/PNGAL/ComfyUI-pngal-0.28.0";
const execute = promisify(execFile);
const timeout = 180000;
const fileSchema = z.strictObject({
	path: z.string(),
	sha256: z.string().regex(/^[a-f0-9]{64}$/),
	bytes: z.number().int().positive(),
});
export const remoteComfyProofSchema = z.strictObject({
	schema: z.literal("comfy-native-ssh-files.v1"),
	endpoint: z.literal(COMFY_ENDPOINT),
	root: z.literal(COMFY_ROOT),
	nonce: z.uuid(),
	pid: z.number().int().positive(),
	processStarted: z.string().min(1),
	files: z.array(fileSchema).min(1).max(16),
});

export class ComfyFileProofError extends Error {
	constructor(readonly code: "COMFY_REMOTE_PROOF_MISMATCH") {
		super(code);
	}
}

type ExecuteProof = (encodedCommand: string) => Promise<string>;
const executeProof: ExecuteProof = async (encodedCommand) => {
	// Windows OpenSSH's command line is bounded. Stream the read-only script
	// through stdin rather than truncating a multi-file proof at cmd.exe's limit.
	const reader = Buffer.from(
		"& ([ScriptBlock]::Create([Text.Encoding]::Unicode.GetString([Convert]::FromBase64String([Console]::In.ReadToEnd()))))",
		"utf16le",
	).toString("base64");
	const pending = execute(
		"ssh",
		[
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
			reader,
		],
		{ timeout, maxBuffer: 131072, encoding: "utf8" },
	);
	pending.child.stdin?.end(encodedCommand);
	const result = await pending;
	return result.stdout;
};

// The existing authenticated SSH channel runs a read-only, in-memory command.
// No helper deployment, metadata hash, cache or local-path fallback is used.
export async function measureRemoteComfyFiles(
	paths: readonly string[],
	run: ExecuteProof = executeProof,
) {
	if (
		paths.length === 0 ||
		paths.length > 16 ||
		paths.some(
			(path) =>
				!path.startsWith(`${COMFY_ROOT}/`) ||
				path.includes("..") ||
				path.includes("\\") ||
				path.includes("'"),
		)
	)
		throw new ComfyFileProofError("COMFY_REMOTE_PROOF_MISMATCH");
	const nonce = randomUUID();
	const request = Buffer.from(
		JSON.stringify({
			endpoint: COMFY_ENDPOINT,
			root: COMFY_ROOT,
			nonce,
			paths,
		}),
	).toString("base64");
	const script = `
$ErrorActionPreference='Stop';$ProgressPreference='SilentlyContinue'
$r=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${request}'))|ConvertFrom-Json
function Runtime {
  if (-not (Get-NetIPAddress -IPAddress '100.77.98.25' -ErrorAction Stop)) { throw 'COMFY_HOST_MISMATCH' }
  $listeners=@(Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort 8188 -State Listen)
  if ($listeners.Count -ne 1) { throw 'COMFY_LISTENER_MISMATCH' }
  $p=Get-CimInstance Win32_Process -Filter ('ProcessId='+$listeners[0].OwningProcess)
  if ($p.ExecutablePath.Replace('\\','/') -cne ($r.root+'/venv/Scripts/python.exe') -or
      $p.CommandLine -notmatch 'main\\.py --listen 127\\.0\\.0\\.1 --port 8188\\s*$') { throw 'COMFY_PROCESS_MISMATCH' }
  return [ordered]@{pid=[int]$p.ProcessId;started=$p.CreationDate.ToUniversalTime().ToString('o')}
}
$before=Runtime
$files=@(foreach($path in $r.paths) {
  $info=Get-Item -LiteralPath $path -Force
  if ($info.PSIsContainer -or ($info.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'COMFY_FILE_KIND' }
  for($parent=$info.Directory;$null -ne $parent;$parent=$parent.Parent) {
    if ($parent.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'COMFY_FILE_REPARSE' }
  }
  $stream=[IO.File]::Open($path,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::Read)
  try {
    $size=$stream.Length;$stamp=$info.LastWriteTimeUtc.Ticks
    $hash=[Security.Cryptography.SHA256]::Create()
    try { $digest=[BitConverter]::ToString($hash.ComputeHash($stream)).Replace('-','').ToLowerInvariant() }
    finally { $hash.Dispose() }
    $info.Refresh()
    if ($stream.Length -ne $size -or $info.LastWriteTimeUtc.Ticks -ne $stamp) { throw 'COMFY_ASSET_CHANGED' }
    [ordered]@{path=$path;sha256=$digest;bytes=$size}
  } finally { $stream.Dispose() }
})
$after=Runtime
if ($before.pid -ne $after.pid -or $before.started -cne $after.started) { throw 'COMFY_PROCESS_CHANGED' }
[ordered]@{schema='comfy-native-ssh-files.v1';endpoint=$r.endpoint;root=$r.root;nonce=$r.nonce;pid=$after.pid;processStarted=$after.started;files=$files}|ConvertTo-Json -Depth 5 -Compress
`;
	const started = performance.now();
	const proof = remoteComfyProofSchema.parse(
		JSON.parse(await run(Buffer.from(script, "utf16le").toString("base64"))),
	);
	if (
		performance.now() - started > timeout ||
		proof.nonce !== nonce ||
		proof.files.length !== paths.length ||
		proof.files.some((file, index) => file.path !== paths[index])
	)
		throw new ComfyFileProofError("COMFY_REMOTE_PROOF_MISMATCH");
	return proof;
}
