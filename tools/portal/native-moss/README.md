# Private native MOSS worker

## Frozen closure candidate

The actual 13-production-source files in manifest.json are frozen at bundle
`7e7f34a63c38f9f77125e47cebd204a5bea138bb001f0e12a3576ebd219fe825`.
It includes reviewed token_pipeline_observed.py (77b7124e...) and runtime
a3b9fb8b..., but is not a compatible/adopted/live worker yet: job.verify_result
still requires token null/UNOBSERVED and rejects the runtime's new complete
OBSERVED sampling receipt. A separately assigned job/result contract change is
required; no sampling or proof bypass is authorized by this source closure.
The collector is producer-owned and still requires independent review.
All older bundle pins in historical receipts apply only to their snapshots.

## Final artifact collection

The private lifecycle command now supports `operation: "readArtifacts"` using
the same exact phase handle fields as alpha/finalize/reconcile/release. It never
accepts a path or artifact-name parameter. Native job.command readArtifacts
continues to serve its three native artifacts separately.

Success is `{schema: "native-moss-lifecycle-artifacts.v1", state: "ARTIFACTS",
receipt, artifacts: [{name, size, sha256, byteBase64}]}` with exactly:
config.json, status.json, execution.json, preflight.json, alpha-graph.json,
alpha-history.json, alpha-submitted.json, output/raw.png, output/crop-RGB.png,
output/alpha352.png, output/mask352.png, output/rawmask352.png,
output/final-RGBA.png. Missing/invalid final proof returns the same frame schema
with state NOT_READY and code, and no artifacts. Bytes are bounded to 8 MiB per
PNG/preflight, 2 MiB per other JSON, and 32 MiB total decoded content.

Readback validates current bundle, exact UUID/nonce/owner/profile/envelope,
retained native/preflight/execution and graph/history/output hashes. An active
lease must match the terminal owner; after release, the exact retained release
marker suffices and no live lease or process inventory is required. Reads never
POST, finalize, release, write state, or launch. Server-trusted OS terminal proof
remains external; no exit code is synthesized. Final result consumers must
explicitly admit these 13 names, including preflight.json.

## Separate lifecycle interface

`lifecycle.py` is a second fixed stdin-only entrypoint. It does not modify or
extend `job.command`. Its `command(frame)` accepts schema
`native-moss-lifecycle-command.v1` and operation readiness, alpha, finalize,
reconcile, or release. Readiness has exactly schema/operation/profileDigest.
Every other operation has exactly schema, operation, profileDigest, requestId,
nonce, ownerBindingHash, envelopeSHA256, bundleSHA256, ownerPid, ownerStart.
No user paths, URLs, graph, commands or arbitrary helper bytes are accepted.
TS transport may explicitly invoke this separate fixed frontend later; do not
route these operations through the frozen native command schema.

Alpha submits the existing background-removal-only graph once and returns
ALPHA_SUBMITTED; no sampler/UNet/CLIP node is accepted. A durable intent is
exclusively created before POSTs; a lost submission is UNKNOWN and cannot be
retried. Finalize performs one history read, validates exact submitted graph
and three output artifacts, crop geometry, mask/RGB chain and pinned defringe
invariants, then writes execution.json and final-RGBA.png. All final results
remain HOLD with qualityQualified=false and ownerApproved=false. Reconcile
is strictly read-only: validates an existing terminal result or returns UNKNOWN,
never resubmits, polls or regenerates. Release verifies terminal hashes and
exact lease identity plus complete OS process inventory proving the owner PID
absent; an extant or reused PID blocks release. Lease is held through alpha.

Job now reserves through `newhost-proof.py`, writing the current worker's exact
OS `processStart` token and PID. Runtime's old reserve method is not called on
the fixed production root. Lifecycle consumes those same fields without token
conversion. No silent migration, lease stealing or guessed token is accepted.
Read-only strict SSH measurement on 2026-10-21 confirmed environment resolves to
`D:/AI/environments/PNGAL`, training beneath it, and the jobs root resolves to
`D:/AI/environments/PNGAL/training/recovery16-workbench-jobs-v1`.
The jobs directory did not exist and was not created by that measurement.
The lifecycle expected root matches this measured projection. Descendant symlink/reparse checks and a
last ownership recheck reduce exposure but are not atomic against another
writer without private Windows ACLs. Process inventory was measured read-only;
native model, GPU-idleness and Comfy readiness have not been qualified live.
The fixed PowerShell process inventory and nvidia-smi probes are read-only;
unknown/incomplete inventory returns not-ready. Readiness's ready flag means
only host-idleness proof, not model/node/bundle readiness or overall capability.

The reviewed defringe source is embedded byte-identically inside lifecycle.py
and verified against SHA-256
`0b0ee4ab58a6b8a5c51b826b3add2a97c350cdccfbdab1b6e1e9cf51f74d6c34`.
Its historical main block never runs. Its visual reduction criterion can fail
and stays FAIL_HOLD; mechanical alpha/opaque/noneligible/zero-alpha-RGB
invariants must always pass. The actual-byte manifest now includes lifecycle,
newhost-proof and a production-private byte-identical alpha-refinement.py copy;
the reviewed lifecycle code remains unchanged and uses its embedded copy.
Current bundle digest is
`70a6094e832c507d89f0f31c363365ac9faaef9241d577c17fd950fd2fcda01a`.
Transport must explicitly update its pinned bundle digest before dispatch;
the old 5cb4e089 bundle is not the compatible host/lifecycle bundle.

CPU check: `python3 -B TOOL/tools-portal/test/native-moss-lifecycle.test.py -v`.
Host and full CPU phase flow check:
`python3 -B TOOL/tools-portal/test/native-moss-host.test.py -v`.
The job prelaunch gate rejects existing/stale/UNKNOWN leases and unreleased
prior job directories, competing Python jobs, unknown process commands,
nonempty Comfy queue, free GPU memory below 8192 MiB or utilization above 5%.
Existing idle Comfy main.py is allowed. Unsupported uploaded source selection
now explicitly fails before reservation with NATIVE_UPLOADED_SOURCE_UNSUPPORTED.
Overall job readiness remains false until the transport admits the lifecycle
frontend and actual no-model host readiness checks are independently verified.

Entry: fixed installed Python `-B -u job.py`, no arguments, one bounded UTF-8
JSON command on stdin. This is a native RGB phase, not a transparent delivery
worker. No downloads, SSH, model installation or alpha graph
submission is implemented here. The runtime calls the existing installed
ai-toolkit; the CPU seam exists only as a Python API for tests.

`profileDigest` is the stable TS `NATIVE_MOSS_PROFILE_DIGEST`. It is not the
worker implementation digest. `manifest.json` separately hashes actual source
bytes. `implementationSHA256` is SHA-256 of UTF-8 compact recursively key-sorted
JSON of the `files` mapping. The manifest excludes itself and test/config/docs.
Transport must independently bind this manifest to its reviewed expected hash;
an untrusted manifest cannot attest its own bootstrap.

## Private envelope

The CLI and `job.command(frame)` take one strict `native-moss-command.v1` object:

- readiness: exactly schema, operation, profileDigest.
- execute: exactly schema, operation, profileDigest, job (the nested job below).
- status/readArtifacts: exactly schema, operation, profileDigest, requestId,
  nonce, ownerBindingHash, envelopeSHA256.

The fixed staged bundle root is
`E:/git/linalab/PNGAL/environment/training/recovery16-workbench-worker-v1`.
Responses are one JSON line: native-moss-readiness.v1, native-moss-native-phase.v1,
native-moss-status.v1, or native-moss-artifacts.v1. CLI errors are
native-moss-error.v1 with exit code 1. Reads never launch; missing terminal status
is not proof that a remote process stopped. Readiness inventories dependencies
and checks bundle bytes but returns ready=false until alpha lifecycle integration.
It does not attest installed model hashes. Execute hashes the nested job's Python
compact UTF-8 JSON (ensure_ascii=False); retain the returned envelopeSHA256 for
reads, which also verify retained config bytes. It is not the outer frame hash.

`native-moss-job.v1` has exactly: schema, requestId, nonce, profileDigest, mode,
recipe, snapshot, bundle, settings, ownerBindingHash, explicitEdits.

- requestId and nonce are canonical UUID strings. No paths, command, credentials,
  arbitrary profile settings, URLs or edit instructions are accepted.
- settings exactly equals `job.SETTINGS`. The frozen profile is provisional,
  preserve-only, qualityQualified false, ownerApproved false.
- snapshot has personId, characterId, name, detail, token, original,
  sourceSelection. Detail/token are exact bytes, not regenerated JSON.
- Each byte blob is `{byteBase64, sha256, size}`, canonical base64 with exact
  decoded byte size and SHA-256. Detail/token are bounded at 2 MiB each and
  original at 8 MiB. Token-only original and sourceSHA256 must be null.
- sourceSelection currently supports `{kind: selected, personId, sourceSHA256}`
  only. Every uploaded selection fails with NATIVE_UPLOADED_SOURCE_UNSUPPORTED
  before reservation or model execution; uploaded-sheet mapping is not provided.
- bundle is an array of `{name, byteBase64, sha256, size}` with precisely the
  finite files in the reviewed manifest; no duplicates or relative traversal.
- explicitEdits must be empty. Unknown fields at envelope/blob/selection levels
  fail. Content compiler holds, provisional statuses and toolkit flag delimiters
  fail before writes/models.

## Phase and transport contract

The fixed job root is
`E:/git/linalab/PNGAL/environment/training/recovery16-workbench-jobs-v1`.
Fresh request UUID directories are exclusively created. Existing UUIDs fail;
replay lookup belongs to transport and must not reinvoke the worker.

Python exclusively creates `gpu-lease.json` at that root. Required checked fields are
requestId, nonce, state `ACTIVE`, scope `native-through-alpha`. Worker acquires it
before staging and binds it again before model execution, never releases,
steals or rewrites it. Transport must also enforce the actual PID and
process-start binding, no conflicting native/training/UNKNOWN job, Comfy queue
and conservative GPU readiness checks. The JSON identity check here alone is
not a cross-service mutex. Keep the lease through alpha and result verification.
Alpha/finalization is implemented by the separate private lifecycle.py entrypoint
described above. It is not yet admitted by the transport or qualified live;
do not dispatch live jobs yet. Lifecycle alone explicitly releases verified
terminal leases; native job execution never releases between phases.

Transport must bootstrap from separately verified bundle bytes plus manifest
outside the fresh target request UUID (the worker reserves that UUID itself),
invoke only the fixed entrypoint, and bound/capture stderr. It must validate
the known fixed E:/D: junction-resolved root and secure private directory ACLs;
this worker does not establish Windows junction or concurrent reparse safety.
Symlink/existing target checks are tested but do not replace those host checks.

Successful native phase writes status.json with state
`NATIVE_COMPLETE_ALPHA_PENDING`, schema `native-moss-native-phase.v1`, raw
352x512 RGB and exact crop-RGB.png. Crop is XYXY `[6,1,346,511]`, equivalently
XYWH `[6,1,340,510]`, without resize. No transparent claim is made. Transport
must verify lifecycle's final native-moss-execution.v1 receipt after actual alpha
and separately attest any required native process exit proof, which the current
native receipt does not emit. Failed/channel
lost launches require durable transport FAILED/UNKNOWN handling, no retry.

The reference source authority adapter replaces only `verify_source` in a
private frozen ReferencePipeline namespace. Sampler, VAE packing, noise, Euler
loop and native sigmas remain the reviewed code. The .45 recipe uses the last
26 sigmas of 55 steps, .25 of 100 steps; both execute 25 transitions. This is
not floor(25*(1-denoise)) scheduling. Native constructor AST preserves the
reviewed FP32 rank32 network, native converter, exact 336 loaded tensors and
no-merge checks. Token prompts use the reviewed full authored-content compiler.

CPU context uses a separate pinned cached tokenizer process, executing the
actual installed `_chat` AST with thinking enabled and truncation disabled.
No weights/models are loaded in that probe. Its transformers dependency may
transitively import torch despite USE_TORCH=0; this is not a no-import guarantee.

## Local checks

From repository root:

```
python3 -B TOOL/tools-portal/test/native-moss-worker.test.py -v
bun TOOL/tools-portal/native-moss/transform.test.ts
TOOL/tools-portal/node_modules/.bin/tsc -p TOOL/tools-portal/native-moss/tsconfig.json
```

Real Windows model loading, native image generation, lease enforcement,
uploaded-sheet authority projection, alpha completion, SSH/bootstrap and final
delivery verification have not been exercised by this CPU-only unit.
