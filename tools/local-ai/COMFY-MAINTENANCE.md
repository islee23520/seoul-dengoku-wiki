# ComfyUI maintenance controller

`comfy-maintenance-controller.mjs` is the fixed JSON-lines lifecycle controller
for `gpu-maintenance.mjs`. It does not grant approval, stop arbitrary PIDs, delete
queues, or cancel jobs. Current production verdict: **UNAVAILABLE** for both
`pngal-8188` and `desktop-8189`. The template deliberately cannot acquire a lease.
Task1 observed PNGAL PID 41224 with a missing parent; conhost 44756 is not normal
shutdown authority. Neither original normal shutdown/restart path is proven.
Never use PNGAL `start_comfyui.ps1`: it force-kills existing processes.

## Private owner mapping

Keep the real mapping at
`D:/AI/data/local-ai/private/comfy-maintenance/mapping.json`, outside Git. Keep
the task13 config and receipts in that same private directory. Provision the
directory with inheritance disabled and only the current owner's SID and,
optionally, SYSTEM granted access. Set its owner to the current owner; do the
same for existing files. For example, owner-run `icacls <directory>
/inheritance:r` followed by `/grant:r <owner-SID>:(OI)(CI)F` and removal of every
other explicit allow entry. Inspect `Get-Acl` before use. The controller checks
the effective allow SID list and ownership on both file and parent, and rejects
reparse points; it never repairs live ACLs. POSIX fixtures require owner uid and
0700 directory / 0600 file modes. `mode: 0600` alone is not a Windows ACL.

Copy only the committed template as a starting point, not live `.omo` state.
Task12 must establish authority before replacing `available:false`. Each enabled
instance requires:

- `id`, `port`, `available:true`, and `evidence` referencing approved baseline
  evidence, including normal shutdown authority and original launcher identity.
- `identity:{pid,created,executable,commandLine}` from Win32_Process. `created`
  is PowerShell `CreationDate.ToUniversalTime().ToString('o')`. The pre-stop
  process must match all fields; restoration checks executable/commandLine and
  listener ownership, not old PID reuse.
- `shutdown` and `launcher` command records, each
  `{executable,sha256,argv,cwd,pins:[{path,sha256}]}`. All paths are absolute;
  hashes bind executable and script inputs. Commands must be reviewed cooperative
  helpers that return after their action, not a foreground long-running server.
  A launcher starts exactly the original executable/argv/identity. The shutdown
  helper must use the verified owner normal termination mechanism; Windows
  `process.kill`/taskkill is not normal termination. No shell interpreter,
  inline code, arbitrary protocol parameters, or PNGAL start script is accepted.
- `admission:{evidence,close,open,status}` with the same pinned command records.
  This is the real owner portal admission authority, not a controller-local
  boolean. `status` emits only `{"admissionClosed":true|false}`. Direct Comfy
  submissions and auto-launchers must also be paused by task13 operator approval.

Pin this controller, mapping, and every dependency in task13's `controller.pins`.

### Portal HTTP admission authority

The optional `admission.transport: "portal-http"` replaces the three command
records with exact URLs and expected owner authentication. Without it the
existing pinned-command contract is unchanged; absent authority still fails
closed. Example (all paths and hashes must be replaced with reviewed values):

```json
{
  "transport": "portal-http",
  "evidence": "approved portal release and owner window evidence",
  "origin": "https://sss.linalab.io",
  "close": "https://sss.linalab.io/tools/api/local-ai/admission/close",
  "open": "https://sss.linalab.io/tools/api/local-ai/admission/open",
  "status": "https://sss.linalab.io/tools/api/local-ai/admission/status",
  "stateFile": "D:/example-private/portal/local-ai/admission.json",
  "windowId": "approved-window-id",
  "reason": "approved maintenance",
  "auth": {
    "kind": "portal-owner-session",
    "file": "D:/example-private/comfy-maintenance/portal-auth.json",
    "sha256": "replace-with-reviewed-sha256"
  }
}
```

The owner provisions the auth file with the mapping directory's private ACL.
Its JSON contains `cookie` (`portal_session=...`), `csrfToken`, and for HTTPS
personal mode `accessAssertion` (the configured owner's Cloudflare Access JWT).
It must come from the current authenticated owner session; no new token issuer
or localhost auth bypass exists. Pin its SHA-256 in the mapping; do not log or
commit it. Session expiry, restart, invalid Access/CSRF, redirects, URL mismatch,
or durable-file/HTTP response mismatch fail acquisition. Loopback local mode may
use `http://127.0.0.1:<port>` with its owner session and CSRF.

Portal endpoints under the configured base path:

| Method | Path | Contract |
| --- | --- | --- |
| GET | `/api/local-ai/admission/status` | Authenticated status: `{admission:"open"|"closed",reason,windowId,updatedAt}` |
| POST | `/api/local-ai/admission/close` | Owner only; exact Origin + CSRF; body `{reason,windowId}`; returns durable status |
| POST | `/api/local-ai/admission/open` | Same auth/body; closed window ID must match or 409 |

State is atomically published and fsynced at
`<PORTAL_STORAGE_PATH>/local-ai/admission.json`, under existing SQLite writer
custody. First startup initializes open; malformed state aborts startup rather
than reopening. Closure survives portal restart. New local-ai GPU jobs and new
Comfy generation requests return 503 `GPU_MAINTENANCE_REQUIRED`; existing UUID
replays, GET/status, artifact access and non-GPU operations remain available.
Already queued/running work is not cancelled. `maintenanceReady` reports whether
the portal admission fence is closed, not whether a lease is held or queues
are drained; `ready` remains false and task13 still owns all lease/OS-lock,
drain, process and GPU checks. Hosted multi-user mode cannot mutate this
installation-wide owner fence.

The native launch config `environment.PORTAL_LOCAL_AI_CATALOG` is a canonical
absolute existing JSON **file path**, not inline JSON. It is now allowlisted
and path-validated by `install/start-personal-native.mjs`. The JSON is an array
of up to two entries, one per `unimate`/`uniforge3d`, e.g.
`[{"tool":"unimate","assets":["approved-input"],"missingModels":[],"unsupportedRuntime":false,"licenseRequired":false,"error":null}]`.
Missing configuration retains `NOT_CONFIGURED`. Update the deployed
portal-authority launcher mirror and its release pins only at approved cutover;
this source change does not edit that live copy. Packaging blocker C remains
deploy-prep work: install the parent `TOOL/avatar-gen/portrait/package.json`
dependencies (`zod`, `ajv`, `yaml`) before building the candidate.

Use Node >=24 (global WebSocket). Controller argv is exactly
`["<controller.mjs>","--mapping","<private mapping.json>"]`. Its executable is
the pinned Node binary. No path or command comes from HTTP, MCP, or protocol input.
All executable/script inputs must remain owner-controlled and immutable for the
approved window. Real observer requires Windows PowerShell CIM subscriptions,
Get-NetTCPConnection, and `C:/Windows/System32/nvidia-smi.exe`; missing permissions
or unsupported GPU observations fail closed, never claim zero GPU processes.

Use exported `acquireComfyMaintenance({mappingPath,configPath,receiptPath})` and
`controlComfyMaintenance(receiptPath,op)` for owner integration. They check private
mapping/config/receipt ACLs and delegate exclusively to task13's exported
`acquireMaintenance` / `controlMaintenance`; they do not implement another lease.
The existing broker can also launch the controller through its pinned task13
config, but its receipt directory must be provisioned with the same private ACL
before activation. Never publish a receipt: its token is authority.

## Lifecycle and recovery

`watch` subscribes to process start/stop events and every Comfy WebSocket before
acknowledging. `drain` subscribes before every queue snapshot; it waits for natural
running/pending completion. `stop` rechecks the original identity and empty queue
and invokes only pinned cooperative shutdown helpers. Snapshot observes process
trees, port owners, `/queue`, and GPU compute processes. Missing GPU authority
blocks acquire. A stopped-state process/listener/GPU reappearance emits `unsafe`
and permanently invalidates that controller; no external process is killed.

`restore` is one retained promise, including failures. It refuses ambiguous
partial stop/reappearance rather than launching duplicates. After confirmed
absence it invokes each launcher once, waits for matching identity/port ownership,
then reopens admission last. An unresolved helper or partial transition requires
operator reconciliation with admission closed and task13 retaining custody; do
not retry commands, delete receipts, or steal the lease. Command/drain timeouts
are explicit failures, not force termination of Comfy. Process event subscriptions
and controller-owned WebSockets are closed on protocol EOF.

No live 8188/8189 stop/restart was run for task17. Focused fixture evidence is
`EVID/task-17-controller.json`; GPU and actual lifecycle proof belong to task12's
single approved window. This controller does not remove tasks12/19 blockers.

## Explicit forced stop with manual restore

`FORCED_STOP_MANUAL_RESTORE` is an owner-only exception for the authorization
`task12-maintenance-window-authorized`, record **74** in
`D:/AI/environments/.omo/ulw-execute/unimate-uniforge3d-comfyui-persistence-ship/ledger.jsonl`.
The user approved one Desktop Stop window knowing its taskkill `/T /F` semantics
and the unproven restart path. This mode never invokes a launcher or deletes a
queue. Without an approval file the cooperative mode and its refusals remain
unchanged. An invalid explicit mode/approval fails closed, never falls back.

Exact operator sequence (all JSON files use the private ACL described above):

1. Capture current Win32_Process identities and pause direct submissions and
   auto-launchers. Prepare `approval.json` with this schema, replacing timestamps,
   window ID and PIDs with the reviewed window values. PIDs are examples, not
   current authority; any necessary proxy must be its own mapped instance.

   ```json
   {
     "schema": "local-ai-forced-stop-approval/v1",
     "mode": "FORCED_STOP_MANUAL_RESTORE",
     "windowId": "window-20261024",
     "authorizationRecordId": "task12-maintenance-window-authorized",
     "authorizationRecord": 74,
     "operatorSid": "S-1-5-21-1273894420-2592752089-892309252-1001",
     "forcedStopAcknowledged": true,
     "manualRestoreAcknowledged": true,
     "createdAt": "2026-10-24T17:00:00Z",
     "expiresAt": "2026-10-24T18:00:00Z",
     "pids": [8992, 14148]
   }
   ```

2. Set `mode` to `FORCED_STOP_MANUAL_RESTORE` and `approvalFile` to the absolute
   private `approval.json` path in **both** mapping and maintenance config. The
   mapping needs `available:true`, evidence, and exact original identities for
   every PID; approved PIDs must equal mapped PIDs. At least one instance must
   map port 8188. Only in this mode may launcher/shutdown records be omitted.
   Keep all admission commands pinned. Config approval still requires
   `directSubmissionsPaused:true` and `autoLaunchersPaused:true`; only the approval
   file's `manualRestoreAcknowledged:true` replaces `restoreConfirmed:true`.
   Pin controller, mapping, `gpu-maintenance.mjs`, `forced-stop-approval.mjs` and
   all other code inputs in the maintenance config. Use the same approval bytes
   in mapping and config; `watch` checks their SHA-256 before closing admission.

3. Run from the repository root, using absolute private paths in place of these
   example paths:

   ```powershell
   node TOOL/local-ai/gpu-maintenance.mjs acquire --config D:/AI/data/local-ai/private/comfy-maintenance/config.json --receipt D:/AI/data/local-ai/private/comfy-maintenance/receipt.json
   ```

   Leave this owner process running. It closes admission, naturally drains,
   revalidates approval expiry and original identities, then runs the fixed
   `C:/Windows/System32/taskkill.exe /PID <exact-mapped-pid> /F` for each approved
   PID. It deliberately omits `/T`: no unlisted descendants or wildcard image
   names may be killed. Descendant absence remains required, so list every
   necessary PID explicitly or acquisition fails closed. Receipts record
   `FORCED_STOP_BEGIN`, each `FORCED_PID_STOPPED`, and
   `FORCED_ABSENCE_CONFIRMED`. Existing listener/process/GPU absence checks and
   OS-held lease exclusivity still apply.

4. After approved workers finish, release from another operator terminal:

   ```powershell
   node TOOL/local-ai/gpu-maintenance.mjs release --receipt D:/AI/data/local-ai/private/comfy-maintenance/receipt.json
   ```

   The terminal maintenance state is `MANUAL_RESTORE_REQUIRED`. Instances stay
   stopped and portal admission stays **closed**. The owner process retains the
   existing OS lock (no stale auto-steal) until operator confirmation. Do not
   terminate it or delete receipts. Failed/partial stops also require manual
   reconciliation; no automatic restart occurs.

5. Manually relaunch ComfyUI through the operator's chosen verified path, never
   PNGAL `start_comfyui.ps1`. Prepare `confirmation.json` after relaunch:

   ```json
   {
     "schema": "local-ai-manual-restore-confirmation/v1",
     "windowId": "window-20261024",
     "approvalSha256": "<receipt.approval.sha256>",
     "operatorSid": "S-1-5-21-1273894420-2592752089-892309252-1001",
     "manuallyRestored": true,
     "createdAt": "<UTC timestamp after manual relaunch>"
   }
   ```

6. Explicitly confirm restoration:

   ```powershell
   node TOOL/local-ai/gpu-maintenance.mjs restore-confirmed --receipt D:/AI/data/local-ai/private/comfy-maintenance/receipt.json --operator-confirmation D:/AI/data/local-ai/private/comfy-maintenance/confirmation.json
   ```

   The retained controller checks the private confirmation's SID, window and
   approval digest, then observes an 8188 listener before opening admission.
   Missing listener or invalid confirmation leaves admission closed and the
   lease held. Confirmation uses the retained approval even if its stop window
   has expired: expiry prevents new stops, not recovery. Successful confirmation
   writes `released`, closes the controller and releases the original OS lock.
   `status --receipt <path>` remains available while manual restoration is pending.

Focused fixture tests do not execute taskkill, launch ComfyUI or run GPU work.
