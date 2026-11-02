# Windows owner broker boundary

## UniForge Ubuntu transport (task20)

The owner supports a private worker entry with `Transport: "linux-joined-v1"`.
It directly owns the Linux supervisor instead of taskkilling a Windows collector.
The executable is exactly `C:/Windows/System32/wsl.exe`; arguments are exactly
`-d Ubuntu -u oliver --exec <python> -I <supervisor> <collector> <config>`.
All four Linux paths must be under `/home/oliver/.local/share/local-ai/uniforge3d/`.
Their bytes and the supervisor-adjacent `wsl_contract.py` require owner `Pins`
using `\\wsl.localhost\Ubuntu\home\...` paths. The runtime tree, private config,
source/model/input trees and code must be immutable and owner-admitted before
activation, just like Windows collector inputs. The service never spawns WSL.
There are no new public command, distro, path, or environment fields.

Install `wsl-supervisor.py`, `wsl-collector.py`, and `wsl_contract.py` together in
that private Linux root and pin the exact files. The private config follows
`Configuration` in `wsl_contract.py`: python, worker, source, supported
sourceRevision, runtimeId, model, hfHome, outputRoot, resultsRoot, pins, assets.
`assets` binds approved IDs to canonical Windows inputs through `/mnt/<drive>/...`
or canonical Linux inputs. All required worker/runtime/source/model/input files
are hashed again in Linux. `resultsRoot` is the owner spool's existing
`results` directory mapped to `/mnt/<drive>/...`; it is never a service-supplied
path. Request/output directories are UUID-exclusive and never reused. Results
are copied with digest verification, fsynced, then published by receipt rename.
Existing broker `result/get` and portal receipt validation consume this same
receipt schema. No Windows collector configuration or UniMate execution changed.

The supervisor verifies uid 1000, registers `PR_SET_CHILD_SUBREAPER`, and owns
the collector as a child. Cancellation or stdin EOF kills only direct unreaped
children. Orphaned descendants, including `setsid` children, are adopted and
then killed and reaped. `SIGCHLD` uses a wakeup pipe, not sleeps or polling.
Only `waitpid(-1)` reporting `ECHILD` permits a `joined` frame with request UUID,
supervisor PID, reaped PIDs and exit code. A private `<UUID>.joined.json` records
that same observation. The owner requires this frame and clean transport close.
Missing/malformed join, overflow, transport death or write failure keeps the
`runExclusive` callback pending: the actual OS lease stays held and `busy=true`,
so even the authenticated release endpoint cannot restore GPU workloads.
Reconciliation is manual; there is no automatic stale lease steal or generic
`wsl --terminate`, process-name kill, or unowned process-group kill. Hard death
of the Windows owner itself is not crash-recoverable lease custody.

CPU prerequisites must be prepared explicitly; runtime and tests never install
packages. Task16's original Python 3.10.20 venv lacks Pydantic v2. The CPU proof
uses a separate copied-interpreter fixture venv with numpy 2.2.6, Pillow 11.3.0
and Pydantic 2.13.1; task16's runtime/source/model trees are unchanged. The focused
Windows test is `node --test TOOL/local-ai/test/wsl-bridge.test.mjs`. Its generator
is a controlled model-free fixture, but validation is the unchanged real
`uniforge3d-worker.py`; this is not model inference, GPU or production approval.
Before running, set `LOCAL_AI_WSL_TEST_PYTHON` to the absolute Linux executable
of an explicitly prepared isolated CPU venv under the fixed private root above.
It must be a canonical copied interpreter (not a symlink), Python >=3.10, with
numpy, Pillow and Pydantic v2 importable. The test checks these prerequisites and
uid 1000 before allocating any fixture. The preparation helper uses that same
`sys.executable`; no session-specific path is compiled into the test.
In Git Bash, also set `MSYS2_ENV_CONV_EXCL=LOCAL_AI_WSL_TEST_PYTHON` so MSYS
does not rewrite that Linux path into a Windows path. PowerShell needs no such
conversion exclusion.
Partial setup removes only exclusively allocated fixture roots. Uncertain lease
restoration preserves the lease, config and receipts for operator reconciliation.

For actual inference, use only the supported task16 runtime/source pins and
complete admitted model pins. Task16 model access and native readiness remain
gated; this bridge does not download or log in and makes no inference claim.

This is a local candidate, not installed or production-qualified. Task13's Node
process owns `runExclusive`. The pinned `worker-broker-owner.mjs` bridge acquires
that real lease and synchronously spawns inside its callback; C# delegates via
private child stdin, not a public execution port. `IGpuLeaseAuthority` is the
execution delegation boundary, not a caller boolean or receipt. Without a
configured bridge, new runs fail closed. No competing lock exists in C#.

Build without installing a runtime:

```text
dotnet build TOOL/local-ai/WorkerBroker.csproj --nologo -o <owned-build-directory>
```

Start explicitly as the Windows Ubuntu owner with an absolute private config:
`dotnet <build>/WorkerBroker.dll <config.json>`. Ctrl-C closes the listener.
`--once` serves one connection for bounded diagnostics. No service/task is
registered. The fixed pipe is `\\.\pipe\seoul-local-ai-worker-v1`; first-instance
creation refuses a preexisting listener and remote clients are rejected in the
kernel. The DACL is protected with exactly owner full access and service
read/write access. The broker checks the impersonated token, never a SID in JSON.
Owner probes must have the actual owner TokenUser and no restricting SIDs.
Service peers must have the exact service TokenUser and restricting SID set
`{service SID, S-1-5-32-545, S-1-5-12}`. This is necessary but not a substitute for
the complete production token/privilege/owner/default-DACL attestation in
`../portal/install/NATIVE-WINDOWS.md:247-264`.

Private configuration fields are `OwnerSid`, `ServiceSid`, `Spool`,
`ManifestSha256`, `Workers`, `Artifacts`, optional `Bridge`. Resolve real SIDs during approved
installation; never substitute an account display name. Spool must already have
a protected, single owner-only FullControl ACE. Configuration and all ancestors,
worker executable/argv, distro, worker/source/model/manifest pins and artifact
catalog must be independently admitted and immutable for the activation. This
candidate does not provision or certify those installation permissions.
`Workers` maps `tool:assetId` to `{Executable,Sha256,Arguments}`; these are private
fixed argv, not caller inputs. `Artifacts` maps approved IDs to private artifact
paths. Do not populate it from an unvalidated worker result.

### Per-request artifact collection (task9)

The fixed private worker is dist/local-ai-collector.mjs, built by the portal build.
Its only argv is an admitted private config; resultsRoot must be Spool/results.
The config contains unimate/uniforge3d adapter configuration and reviewed pins.
The collector runs prepare, generation, CPU validation and collect inside the
existing owner bridge retained maintenance lease. It never acquires a nested lease.
Only after validation and hash-checked copies does it atomically publish
results/<UUID>/receipt.json with source/runtime/model/input/request/seed bindings.
Broker result returns that bounded receipt only for the matching durable journal.
Dynamic get resolves UUID-index artifact IDs under that receipt; no public paths.
The legacy static Artifacts catalog remains available for earlier approved assets.
Exit zero alone remains AWAITING_VALIDATION, never portal success.

Read-only admission checks the pinned bridge and private maintenance configuration.
Its wire reply is exactly `version,op,configurationEligible`; the boolean indicates
configuration eligibility only, never an active approved window or lease. Older
`ready` replies are rejected by the client rather than upgraded to active proof.
Missing/unapproved controller configuration returns false. The public catalog
exposes `configurationEligible` separately; `maintenanceReady` and `ready` remain
false because this path cannot observe an active window. CLI, MCP and HTTP share
that catalog. An eligible explicit submission may attempt acquisition, but actual
run still acquires and verifies task13 custody before spawning. No production
controller is implemented: configuration eligibility is not production GPU,
identity, installation or operating approval. UI labels the acquisition attempt,
not an active GPU-ready state. No live acquisition is authorized by this contract.

`Bridge` pins `Executable,Sha256` (Node), `Script,ScriptSha256` (the owner glue),
and `Config,ConfigSha256` (private bridge config). Bridge config contains
`LeaseModule,LeaseModuleSha256` (task13 merged implementation),
`MaintenanceConfig` (task13's approved private controller/approval config),
`ReceiptPath` (unique base; UUID appended), and `Workers` (same approved catalog).
Owner worker entries additionally accept `Pins:[{Path,Sha256}]` for worker code,
manifest and source pins. The bridge retains the real lease through worker exit
and confirmed restoration; the fixed private executable/code/config must stay
immutable. Every run needs a fresh approval-bound receipt and task13 controller.
Do not point that controller at live Comfy without the task12 maintenance approval.

Pin hashing is streamed with a bounded read buffer, including large model pins;
model bytes are not loaded into Node memory by this bridge. C# drains owner stdout
concurrently and retains at most 1024 characters; overflow is an error after drain.
Private stdin is newline-framed: first line is the bounded request, a later exact
`{"op":"cancel"}` line revokes the owned worker. Broker cancellation waits for
Node to confirm its worker tree exit and restoration; it never just disposes the
Process handle or kills the lease owner. Unconfirmed cleanup retains custody and
the wait for explicit reconciliation. Abrupt broker death closes stdin, triggering
the same cancellation path in the owner.

Wire framing is unsigned 32-bit little-endian length followed by UTF-8 JSON,
1..65536 bytes, depth <=8. One request/response per connection. Version is 1:

- `probe`: exact fields `version,op`; returns actual pipe peer/owner SID,
  read-only Ubuntu `id -u`, configured manifest digest and unwired admission.
- `run`: exact `version,op,requestId,tool,assetId,seed,prompt`; the server-owned
  worker catalog selects fixed argv. Journal canonical request hash binds tool,
  asset, seed and prompt. Matching UUID returns prior state; changed payload
  refuses. Startup converts RUNNING to UNKNOWN. No retries or automatic resubmit.
  Exit zero means AWAITING_VALIDATION, never inference success.
  The hash is lowercase SHA-256 of compact UTF-8 JSON in exactly the order
  `{"tool":tool,"asset":assetId,"seed":seed,"prompt":hex}`. `hex` is the
  lowercase hexadecimal encoding of the prompt's UTF-8 bytes, not escaped JSON
  text. Approved tool/asset identifiers are ASCII and seed is a nonnegative Int32.
  This avoids serializer-specific Unicode/control escaping, including supplementary
  characters and U+2028/U+2029, without normalizing or changing the actual prompt.
  Literal backslash-u text stays literal. Run, result validation and the portal use
  this same contract. Existing candidate journals using the previous JSON-string
  digest are not interchangeable; no installed production journals are migrated.
  UniMate accepts a nonblank prompt of 1..2000 characters with no NUL at the first
  public boundary and preserves the accepted string exactly, including surrounding
  spaces, tabs and newlines. The adapter does not trim; the worker's Pydantic
  models do not strip whitespace, and its nonblank check does not require trimmed
  input. Journal, prepared request, worker manifest and
  receipt bind the same prompt bytes. CLI/MCP/UI do not define alternate schemas.
- `get`: exact `version,op,artifactId,offset,length`; maximum chunk 32768 bytes,
  artifact <=128 MiB; response carries full-file SHA-256 and base64 chunk. Client
  must assemble and verify the digest before publishing in service storage.

The TypeScript client never retries. Its caller must supply a bounded AbortSignal
and persist ambiguous dispatch as UNKNOWN. The client parser's identitySource is
only a wire claim until the native pipe server installation is admitted; a mock
JSON response cannot prove Windows identity.

## Verification and approval boundary

Focused invocation (Windows, prebuilt DLL):
Set `WORKER_BROKER_DLL` to the absolute built DLL, `GPU_LEASE_MODULE` to the
task13 module, `GPU_LEASE_FIXTURE` to its disposable controller test file, and
`BROKER_NODE` to the admitted Node executable, then run
`bun test ./TOOL/tools-portal/test/worker-broker.native.ts` from repository root.
The explicit `./` path selects this non-default native entrypoint; it is not
auto-discovered by package `bun test`. Portable wire coverage remains in
`worker-broker.test.ts`, requires no environment setup and is never skipped.
These are machine-local environment inputs, not committed checkout paths.
`BROKER_DOTNET` optionally selects dotnet (default PATH); `BROKER_POWERSHELL`
and `BROKER_WSL` optionally select fixture executables (default SystemRoot).
The owner test uses real pipe impersonation and Ubuntu; it labels the production
service-token probe NOT RUN. It does not create a service or change any live ACL.
Only its unique temporary spool ACL is created and removed.

Frame-only deterministic regression: `dotnet run --project
TOOL/local-ai/test/WorkerFrames.csproj`. It compiles the same FrameSession used
by ServeOneAsync, manually expires the input budget while a handler barrier is
held, verifies a fresh response budget, and cancels a stalled prefix read after
its read-start event. Request and response each have separate ten-second I/O
budgets; handler lifetime uses the caller/worker authority, not either budget.

The production proof requires an approved native activation/harness that executes
the probe client with the actual unchanged restricted application token, the
exact real service SID, admitted binaries/config and pipe capability ACL. The
existing `native-service-host.ps1` requires `RegisterOwnedSyntheticServices` and
creates LocalService SCM services; running it is both outside authorization and
not proof for the production dedicated identity. No approved production probe
action is present in this task. Task19 owns that separate probe implementation
and concrete approval request for the exact new capability
and bounded probe action; do not weaken the token, run as owner instead, inject a
synthetic SID, or change the installed service. GPU inference remains task12.
