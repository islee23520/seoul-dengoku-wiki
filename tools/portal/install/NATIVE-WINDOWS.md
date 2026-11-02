# Native Windows launcher: local increment, not deployment approval

## ComfyUI workbench configuration

In `launch.json.environment`, optional `PORTAL_COMFYUI` accepts only the strings
`"true"` and `"false"` to enable or disable the ComfyUI workbench. Omitting it
preserves the application's default behavior; inherited process environment is
cleared and cannot enable it. Other values, including JSON booleans, fail with
`NATIVE_ENVIRONMENT_INVALID` before server import. The changed launcher requires
a separately reviewed update of the host's exact launcher SHA-256 pin and
installation artifact hashes before native deployment; no host gate is relaxed.

## Restricted network discovery

The v13 workload reached server startup but Node's `os.networkInterfaces()`
failed under the restricted token. `src/config.ts`, bundled into `server.mjs`,
now defers discovery until opt-in local LAN/tailnet ownership validation needs
it. Personal-service and loopback startup do not enumerate interfaces, including
the validation performed by `app.listen()`. They bind the explicitly configured
host and port using the existing listener path. Local network opt-in still fails
closed when enumeration fails; no empty-list fallback grants network ownership.
No token, privilege, restricting SID, object ACL or authentication gate changes.
Offline coverage uses a throwing discovery stub and real local socket binding;
it does not claim a new restricted Windows service deployment was performed.

## Fresh startup attestor for both profiles

### Privileged private-station creation and restricted handoff

The v9 diagnosis showed that an explicitly named window station requires an
enabled Administrators SID. The dedicated host already lacks that authority
before workload filtering; moving creation before CreateRestrictedToken would
not fix it. Its source-token contract and service account remain unchanged.

After live attestation passes, the existing SYSTEM attestor creates only the
private station/desktop and performs the required association and restoration.
This runs on a dedicated thread in the existing host-source implementation;
no new executable or installer mode is required. The name uses the fresh startup
nonce. The creator must have enabled Administrators and no restricting SIDs.
When its token can own the exact service SID that ownership is retained;
otherwise SYSTEM owns the objects. Exact service-SID ACEs and OWNER RIGHTS
remain, and the receiving host verifies the complete descriptor.

The attestor retains both handles while publishing its signed PASS. The host
acquires its own handles by exact nonce-bound name, validates both objects,
then signals a service-modify-only custody event. The attestor closes only its
own handles and signals a service-synchronize-only release event. The host
waits within its existing startup deadline before continuing. No creator token
crosses this boundary. All six effective-open probes and the child continue
using the verified restricted workload token. Final host cleanup retains the
existing restoration and object-absence requirements. Failed or timed-out
handoff closes broker-owned objects; it never authorizes workload startup.

Offline tests cover the real setup methods through injected object operations,
creator-token rejection, exact handle acquisition, restricted-probe token
identity, and privileged-call scope. No installed service or SYSTEM task was
run for this source change; real-service integration remains a separate review
and deployment qualification step.

The dedicated host does not query or impersonate the old writer. At each start
it requests a fresh SYSTEM attestation, then performs the direct ACL, namespace,
candidate and authority checks below itself before consuming `activation.lock`.
Issuer-time PASS, process-name snapshots, or a prior startup result never replace
the current impersonated write/delete/WRITE_DAC/WRITE_OWNER denial probes.

An operator prepares the existing signed installer at the exact
`code/install-personal-native.ps1` path and a separate RSA key (at least 3072 bits)
at `attestor-secret/signing-key.xml`. The secret directory/file must have protected
administrator/SYSTEM ownership and only SYSTEM/Administrators allow ACEs; no
service read ACE. Use a key distinct from the activation signer. Do not commit
private keys. Sign the installer with a trusted Authenticode certificate and
record its thumbprint and SHA-256 after signing. The existing host/compiler and
PowerShell pins still apply.

Explicit `-Mode RegisterAttestor -InstallerSha256 <signed-script-hash>
-AttestorSignerThumbprint <certificate-thumbprint>` registers exactly one
`<service-name>-startup-attestor` task. Registration is exclusive (no replacement),
SYSTEM service-account logon, highest privilege, enabled, demand-only, no calendar
or event triggers, no retry, one-minute execution limit and ignore-new concurrent
instance policy. Its task DACL permits only SYSTEM/Administrators control and the
exact service SID read/execute. Its fixed absolute PowerShell action uses
NoProfile/NonInteractive/AllSigned and an encoded command that hash-checks the
installer before invoking `-Mode ATTEST`; no request-supplied command or argument
is evaluated. The registered XML hash, installer/host/PowerShell pins, signer
thumbprint and public-key hash are captured in immutable `action/attestor.json`.
The public key is `action/attestor-public-key.xml`. Registration creates protected,
service-read-only `status/attestations`; failure leaves partial state for explicit
operator reconciliation, never automatic adoption or cleanup of another task.
This source dispatch does not register that task or provision a signing key.

Both profile activation payloads must additionally bind `attestorConfigSha256`
and `fence.writers`, a nonempty exhaustive set of old-writer rows with string
`pid`, executable basename `imageName`, `startUtcTicks`, `imageSha256`, and `sid`.
Writer iteration accepts an array/list of row dictionaries, the PowerShell 5.1
`{"value":[...],"Count":N}` wrapper seen in the v6 aborted window, and nested
named dictionaries of rows. Generic dictionary entries and non-generic
DictionaryEntry values are read explicitly. Wrapper Count must be a nonnegative
integer equal to the flattened row count, and a row has exactly the five fields
above. Unexpected types, keys, incomplete wrappers and nesting beyond eight
levels fail with `ATTEST_WRITERS_SHAPE_*`; entries are never silently skipped.
All shapes use the same rows for digesting, live-set comparison and probing.
The offline regression preserves the exact redacted v6 fixture shape, substitutes
safe identities for digest equivalence, and rejects the literal redacted identity
placeholders before reaching live probes.
The operator must include every executable family capable of being an old writer;
Toolhelp enumeration detects missing/replaced PIDs and additional instances of
any listed name, not arbitrary unrelated applications. Sorted canonical rows
produce the writer-set SHA-256. Every enumerated writer is queried and probed
under SYSTEM using the existing live-token verifier. Enumeration runs before
and after the probes; changes, query errors, privileged/bypass-capable tokens,
or any non-denied access fail the attestation. Absence is not a substitute for
probing a listed actor. Existing ACL restrictions still exclude other untrusted
application identities; SYSTEM/Administrators remain the trusted maintenance
boundary.

Before running the task, the host creates `status/startup-request.json` with
CreateNew, a cryptographically random GUID nonce, activation digest, expected
writer-set digest and UTC startup time; it retains a read pin. This durable
one-start guard is not overwritten on a retry. The host subscribes to result
completion-marker creation before calling Task Scheduler Run with no parameters, checks
the registered task XML hash against signed configuration, and waits at most
60 seconds using a monotonic elapsed deadline. Task Scheduler permissions expose
only this predefined operation, not arbitrary SYSTEM execution.

ATTEST requires SYSTEM, the signed/pinned script, protected key and configuration,
current signed/unexpired activation and matching permit/installation/request.
It reruns the current writer-set checks, unchanged impersonated denial probes,
and current fence. A probe exception becomes a signed FAIL with stage, exception
type, exact message and HRESULT. Writer failures retain the active signed writer
identity and before/after Toolhelp PID/name snapshots; null means that stage was
not reached, never an empty successful enumeration. The original denial gates
and host rejection of every non-PASS remain unchanged.
It checks the request and activation again for expiration before writing directly
with CreateNew to `status/attestations/<nonce>.json`, under an explicit protected
SYSTEM/Administrators-write and service-read ACL. After flushing and closing the
bytes, it pins that same object and creates `<nonce>.json.ready`. The host waits
for that completion marker before pinning and verifying the signed result, so it
never reads a partially written envelope. The marker grants no authority: all
signature, nonce, freshness and binding checks still apply. Existing no-DELETE
sharing is unchanged. There is no rename, replacement, overwrite or adoption of
historical `.tmp` files. A partial write without its marker fails closed.
The RSA/SHA-256 payload binds activation hash, nonce, writer-set digest, exact
requested time, issue/expiry times and PASS/FAIL. Results live at most 60 seconds.
The host verifies signature, pinned key, all digests, nonce, startup time and both
wall-clock and monotonic deadlines. Missing, expired, tampered, mismatched,
failed or late results stop startup; results issued before this startup cannot
pass. A task error before signing results in bounded timeout. Request/result
files remain audit evidence; operators reconcile them and the durable activation
lock before separately authorized restart. No successful result is reused.

### Shared portal parent ACL

Only `E:\portal-authority` under the portal profile admits one additional image
service allow ACE. Its SID must exactly equal
`S-1-5-80-3009954029-3502163315-1404888075-3287239547-2538716563`; rights must be a
nonempty subset of read/execute (`0x1200a9`, or GENERIC_READ), with zero write,
delete, WRITE_DAC, WRITE_OWNER or GENERIC_ALL. Explicit/effective and inherit-only
forms are accepted, but two image ACEs are rejected. Raw ACL inspection preserves
ACE multiplicity rather than allowing .NET's access-rule merging to hide it.
Every other foreign ACE still fails `INSTALL_FOREIGN_ACE`. This exception applies
neither to writable paths nor portal children: an inherited image ACE on a portal
child is rejected there. The image subtree keeps its separate exact-SID ACLs.

## Exact named-service profiles

The registry selects by exact service name, deterministic service SID and root;
there is no arbitrary executable/service/root override. Existing portal record
schema, release vector, DB binding and synthetic qualification stay unchanged.

| Profile | Service | Protected root | Artifact/authority |
| --- | --- | --- | --- |
| `portal` | `seoul-dengoku-tools-portal-native` | `E:\portal-authority` | Existing five-file `4f5df498...` release; `data\originals.sqlite` |
| `image` | `seoul-dengoku-tools-image-native` | `E:\portal-authority\image` | `code\image-only.exe`; `authority\tools-unfinished-deferred-owner1-image-five-attempts\authority.bin` |

Image SID is `S-1-5-80-3009954029-3502163315-1404888075-3287239547-2538716563`.
The image gateway source is private fix commit
`4952bcad53eaf2e18206283890b3dee0ec5907ed`, shipped in private merge
`21f6cd06664c055583787edf4b1595fb81484f19`. Admission binds the source commit,
not its tree or the merge commit. Its reproducible Windows SHA-256 is
`a243a1b006b91eddb807b41cd3bc5643bfd287805df49a8787c389e122d1c834`.
The previous `386a8653...` source and `0e46d123...` Windows binary are superseded.
The old `826a7a96...`/`51768563...` binaries do not have this drain protocol and
are not accepted by the image profile. No portal Node/release substitution is used.

### Image operator preparation and authority

Prepare the image tree under a separately authorized installation action;
`Stage` remains disabled, and this extension does not seed/reset authority,
provision credentials or register/start a service. `Definition` accepts the
exact image name/root and renders the dedicated virtual-account service.
Image Fence/Permit calls omit portal `NodeSource`, `ServerSource`, `ServerSha256`
and fake-writer arguments; supplying them is rejected. Tool/source pins and
explicit signed activation record path/hash remain required.

Use `image-native-install.v1`, `PROJECT_REVIEWED`, the image name/SID, the existing
`production-dedicated-filtered.v1` token profile, host source hash, operator public
key hash and owner-receipt hash in `installation.json`. Its `files` vector must
contain exactly `code/image-only.exe`, `code/native-service-host.exe`,
`code/native-service-host.cs`, `private/image-config.json`, `private/binding.json`,
`private/image-principal.json`, and `private/seed-receipt.json`, with observed
hashes. All are administrator-owned and service-read-only. Root, code, action,
private and authority parent directories are protected read-only namespace;
budget directory, temp and status grant only the exact image SID bounded modify
rights plus OWNER RIGHTS read-control. The shared parent is pinned and checked
for replacement rights, not granted image write authority. No portal DB is used.

The signed `image-production-activation.v1` payload uses the same operator RSA
envelope, hash pin, one-hour UTC window, action ID, installation hash, decision,
owner directive date and live fence checklist as portal. Bind image name/SID/root,
`authority`, `gatewaySha256`, `gatewaySourceSha`, `imageConfigSha256`,
`imagePrincipalSha256`, `bindingSha256` and `seedReceiptSha256` instead of portal
`database`, `releaseId` or `candidate`. Those portal fields are rejected even if
correctly signed; portal records likewise reject image fields. The image owner
reference is `.omo/evidence/tools-unfinished-deferred/f/q4-native-install-result.json`;
the new signed record's explicit APPROVE_EXECUTION decision supplies activation
authority, not the older blocker receipt by itself.

The three prepared private file pins are:

- Principal: `3b7cc631766834ba19dafc13336bdb76fc9fdbb12b94093769af242d8ac3fc27`
- Binding: `871ec37f601dfd66d992b119b835087715549cde3287a0d9c00b64f6e821e1be`
- Seed receipt: `cf132acb8320583124229656800e3d0ae4b3b34aaf6ac652c571b9cf7b4351e6`

The separately provisioned secret-bearing image config is hash-pinned, never
logged. Its directory must equal the exact budget directory, its budget/owner/SID
must match this profile and its listener must be numeric `127.0.0.1` with a valid
nonzero port. The gateway retains its full config/custody validation. The host
does not initialize or read authority contents. Fence ACL hashes bind the budget
directory and `authorityAclSha256` for the existing authority file; the budget
directory must contain only that file at admission.

The issuer and the host-requested SYSTEM attestor rerun the profile-specific live old-writer check before
pinning the authority file: PID/start/image/user binding, privilege exclusion and
actual ERROR_ACCESS_DENIED mutation/control probes cover the image root, budget
directory and authority file. Container path inspection excludes ancestors or
descendants of the image root and control sockets. All immutable ancestry and
artifact pins remain held; the authority-file read pin is released before the
gateway opens it writable. Missing evidence or inability to query the old actor
fails closed. `image-native-permit.v1`, exclusive issuance receipt and durable
activation lock remain distinct from portal and synthetic permits.

### Image lifecycle

The image host starts the exact executable directly in the filtered dedicated
token, atomic job and private desktop, passing only `--config` and `--service-sid`
with a cleared environment. It observes `image-only listening on 127.0.0.1:<port>`
on stdout and verifies the original application's token before SCM RUNNING.
SCM stop writes `STOP` to retained stdin. Only exact stdout `DRAINED` after that
request, both output drains, and exit zero on the original process handle allow
clean STOPPED. The gateway's 15-second drain is bounded by a 20-second host stop
observation. A failed/live timeout retains custody and never claims graceful
termination. The portal supervisor/IPC state machine is unchanged. Production
installation and runtime qualification remain separate from these offline tests.

## Reviewed production activation

`PRODUCTION_REVIEWED` is a distinct permit kind. It is not a synthetic permit
with a different label. The 2026-10-17 root decision separates a dedicated
`NT SERVICE\seoul-dengoku-tools-portal-native` host (`TokenUser` equals the exact
service SID, primary token, empty restricting set, no enabled Administrators)
from the application token. The factory still rejects restricted host sources.
The application must have that same user, the exact service SID, Users and
Restricted Code in its restricting set, only the change-notify privilege,
service-SID owner and exact default DACL. Verification runs before process
creation and on the suspended supervisor and admitted application handles.
LocalService identities and synthetic profiles retain their separate checks.

Production selects the Node-direct supervisor and a private session-0 desktop.
Its desktop objects are service-owned, with OWNER RIGHTS read-control suppressing
implicit owner WRITE_DAC; the synthetic BA-owned descriptor is unchanged.
The current KnownDlls descriptor and actual restricted-token read/control-denial
opens are checked again, without treating synthetic peer qualification as an
activation record. No test-mode, debugger, injected-fault or raw-peer option is
accepted with a production permit. This source increment and its offline tests
are not a production runtime qualification or permission to deploy.

### Explicit operator sequence

The PR82 admission rebind uses the deterministic release built from merged main
`0dc1abe461e6ff5157ebbef9b3b20d602d4eb1c7`, releaseId
`4f5df498c7cdabc09e3db6efed40667f6326d680250a9dc5efe3bf7b25f122cb`, with owner
reference `f/cpa-model-id-shipping.json`. CPA model IDs are
`gpt-image-2.5-sunburst`, `gemini-3.1-flash-image`, and `grok-imagine-image`.
Portal directive date remains 2026-10-19; image profile date remains 2026-10-18.
Launcher, wiki relay, account store, and image qualification paths are unchanged.
Retain the exact new five artifacts; no provider request is part of this rebind.

PR81 rebinds the portal candidate to the deterministic release built from
`288b5c3fb6c8311b627f80578ce2917483386234` (PR80 per-account provider
connections with CPA model selection), releaseId
`beb0745be3c02c1787159c6fd06c7651e080858cdba5752f0136dc4d20e34533`; owner
reference `f/pr80-independent-review.json`, directive date 2026-10-19.
The launcher pin (`e2c943db...`) and JWKS input are unchanged.

The filtered portal child cannot resolve external hosts, and
`seoul-dengoku.linalab.io/wiki/*` now 308-redirects to `sss.linalab.io`.
Install `install/wiki-relay.mjs` as a SYSTEM startup task
(`E:\portal-authority\action\wiki-relay.mjs`, run by the admitted `node.exe`)
listening on `127.0.0.1:18791`, and set launch.json
`WIKI_BASE_URL=http://127.0.0.1:18791/wiki/` (loopback is admitted by the wiki
source validator). The relay is GET-only for `/wiki/*`, follows the alias
redirect, requires the final path to stay under `/wiki/`, and caps at 2 MiB/10 s.
The owner provider connects per account at `http://127.0.0.1:8317/v1` (loopback
CPA) through the portal form; no provider credential is placed in launch.json.

PR77 rebinds the portal candidate to the deterministic release built from
`ec9297f2a5ee50dbc0df199c2cdee978fc130286` (PR76 pinned-JWKS Access
verification), releaseId `bff1ba0f3e86b0d4084008b4a9421793854b8b2598c85eca317af0d070cc9fce`.
The canonical vector is retained in
`.omo/evidence/tools-unfinished-deferred/f/pr77-hotfix76-rebind.json`.
This is a new release identity, not permission to swap artifacts in an old
activation. The previous release ID and mixed old/new artifact sets are rejected.
The activation owner reference moves to the PR76 independent review receipt
and adds `inputs\access-certs.json` (pinned Cloudflare Access JWKS) to the
install inputs; the hotfix window must also carry a restartable rollback
authorization because the prior activation expired 2026-10-18T04:52:41Z.

PR66 rebinds the portal candidate to the deterministic release built from
`76e27ae282d196c40a58bba8882106302a0a65c8`, including PR65's lazy interface
discovery. Both clean builds matched every payload, manifest and archive byte.
The canonical vector is retained in
`.omo/evidence/tools-unfinished-deferred/f/pr66-release-rebind.json`.
This is a new release identity, not permission to swap artifacts in an old
activation. The previous release ID and mixed old/new artifact sets are rejected.

Perform these steps only in the separately reviewed row-22 maintenance/migration
action. The installer does not create an account, register/start a service, read
credentials, copy/initialize a database, or stop/change a container. Production
`Stage` deliberately refuses: use the reviewed exact-artifact migration to
prepare the protected installation before granting activation authority.

1. Bind the exact five retained candidate files to `code/`, not a rebuild. Their
   expected vector is `NativeProductionActivation.Candidate`; release ID is
   `4f5df498c7cdabc09e3db6efed40667f6326d680250a9dc5efe3bf7b25f122cb` and server hash
   is `a6fd0b00370b699144c80bb5d0d851412f30c1a36c5748783334c0f0599eb409`. Build the
   reviewed host with the admitted absolute compiler. Prepare `installation.json`
   (`portal-native-install.v1`, scope `PROJECT_REVIEWED`, service name and exact
   service SID, profile `production-dedicated-filtered.v1`, source SID type `1`,
   empty `tokenContract`, `windowsReadSids` exactly `S-1-5-32-545`, `S-1-5-12`
   in that order, admitted PowerShell path/hash, host source hash and
   complete `files`/compiler-reference vectors). Include every consumed launcher,
   executable and `launch.json` in `files`. Preserve the existing Node-direct
   executable and adjacent-script pins. Bind `originalsDb` in `code/launch.json`
   to exactly `E:\portal-authority\data\originals.sqlite` and its server to the
   retained candidate. Database promotion must already have passed row-22 guards.
2. Generate/retain the operator signing key outside the service tree. Place only
   its RSA public XML key (at least 3072 bits) in
   `action/activation-public-key.xml`; independently pin SHA-256 of its UTF-8
   bytes in `installation.json.activationPublicKeySha256`. Copy the actual
   row-22 owner decision to `action/owner-decision.json` and pin its bytes in
   `installation.json.ownerDecisionSha256`. Key replacement requires a new
   reviewed installation, not an extra key supplied by the activation envelope.
3. Capture the exact old container's full `docker inspect` JSON into
   `action/container-inspect.json`. Resolve the actual Windows host process
   responsible for its host filesystem writes, not its Linux PID or an arbitrary
   denied process. Bind its PID, creation UTC ticks, image hash and account SID.
   The signed checklist certifies that association. The issuer opens that live
   process/token and requires matching identity and image, no privileged groups
   or bypass privileges, and ERROR_ACCESS_DENIED for write/delete/WRITE_DAC/
   WRITE_OWNER opens on the authority root, DB parent and DB. Sharing violation
   is not proof of denial. If the Docker backend is an administrator/SYSTEM or
   has those bypass privileges, this fence refuses; a mount observation does
   not override that result. No write probe changes database bytes.
4. Inspect protected ACLs and all namespace ancestors. The DB and its directory
   must be administrator/SYSTEM-owned with protected DACLs, exact native-SID
   read/write rights and OWNER RIGHTS read-control. No foreign or broad SID is
   admitted; directory inheritance must carry the exact SID. Volume/root parent
   replacement is separately denied. Administrators/SYSTEM are trusted operator
   actors, not application writers. Absence of sidecars and `portal-writer.lock`
   is required. The container may have no mount of the canonical path, an
   ancestor or descendant, Docker control socket, privileged mode or volumes-
   from indirection. Container recreation under privileged administration is
   outside this application-writer boundary and must remain under maintenance
   control for the activation window.
5. Create the activation payload explicitly after those checks. Fields are
   `schema=portal-production-activation.v1`, `kind=PRODUCTION_REVIEWED`, `root`,
   `database`, `serviceName`, `serviceSid`, `tokenProfile`, `installationSha256`,
   a fresh 32-lowercase-hex `actionId`, `ownerDirectiveDate=2026-10-19`,
   `ownerDecisionReference` equal to
   `.omo/evidence/tools-unfinished-deferred/f/cpa-model-id-shipping.json`,
   `ownerDecisionSha256`, `decision=APPROVE_EXECUTION`, `releaseId`, `candidate`
   (exact five filename-to-SHA pairs), and UTC round-trip `issuedUtc`/`expiresUtc`
   timestamps with a maximum one-hour window. `fence` contains `PASS` for
   `canonicalAcl`, `ancestorReplacementDenied`, `containerPathExcluded`,
   `containerIdentityDenied`, `soleApplicationWriter`; plus `containerId`,
   `containerInspectSha256`, `directoryAclSha256`, `databaseAclSha256` (SHA-256 of
   UTF-8 .NET `GetSecurityDescriptorSddlForm(All)`), `containerHostSid`,
   `containerHostPid`, `containerHostStartUtcTicks`, `containerHostImageSha256`,
   and strings `false` for `containerHostAdministrator` and
   `containerHostBackupRestorePrivileges`. These are attestations with evidence,
   not values that may be copied from a synthetic receipt.
6. Sign the exact UTF-8 payload bytes with RSA PKCS#1 v1.5/SHA-256. Create
   `action/activation.json` exclusively as JSON containing base64 `payload` and
   `signature`. Apply the same administrator-owned, service-read-only ACL as
   other action files, and independently record SHA-256 of the envelope. No
   private key belongs in this envelope or service tree. Invoke the installer
   first with `-Mode Fence`, then `-Mode Permit`, supplying the existing explicit
   tool/source pins and `-ActionId`, `-ActivationRecordPath` and
   `-ActivationRecordSha256`. Both calls verify the signature, window, complete
   bindings, current candidate bytes, current ACLs, container inspection and
   actual old host token. A failed check issues nothing. The issuer creates
   `permit.json` and `issuance.json` exclusively and prints the activation hash.
7. Review the issuance receipt before any separately authorized service start.
   The host rechecks the pinned activation record, installation, candidate and
   current fence, verifies `issuance.json`, and logs the activation hash/action.
   Startup requests the SYSTEM attestor to rerun the same live old-writer verifier as issuance, binding PID,
   process creation time, image hash and token user; rejecting privileged groups
   and bypass privileges; and requiring ERROR_ACCESS_DENIED on write, delete,
   WRITE_DAC and WRITE_OWNER probes. It runs before the DB read pin and before
   consuming `status/activation.lock`. A replaced/exited process, changed token,
   regained write/control access, or inability to inspect the actor aborts
   startup without consuming that lock. A signed issuance PASS is not reused as
   proof of the actor's state at startup.
   Its durable exclusive activation lock remains one-shot across clean stops.
   A partially written issuance or previous lock is a stop condition, not an
   automatic retry. Rollback still uses row-22's unchanged-seed/sidecar guards.

The offline suite uses generated ephemeral signing keys and token snapshots only:

```powershell
./test/native-installation.ps1 -SourcePath <absolute-source> `
  -ScratchPath <unused-offline-path> -ProductionOfflineOnly
```

It neither opens a real database nor creates a service or application workload.
The older sections below preserve the synthetic qualification history; their
statements that no production issuer exists describe that earlier increment.

## One-run private desktop control

The separate synthetic `node-direct` context uses the same explicit v3 workload
token, atomic outer JOB_LIST, three-pipe HANDLE_LIST, suspended creation and private
station/desktop admission. The trusted compiled host checks the installed Node,
config and merged adjacent script bytes and namespace before executing the absolute
Node supervisor with only SystemRoot/WINDIR in its environment. Its original outer
handle supplies supervisor identity; the application retains a distinct admitted
handle. Ready, stop stdin, drained, stopped and original-handle exits remain gates.
No inner PowerShell job is started on this route. Node is not assumed GDI-free.
The one-run controller requires an official 24.13.1 runtime staged under its new
protected task root and passes the offline suite before consuming its run guard.

The synthetic-only `private-desktop-command` context binds its exact unpredictable
`Task22Private_<32 hex>\Workload` name, service SID, root, host source hash,
diagnostic masks and unchanged v3 token profile into both installation and permit.
Missing, mixed, wrong-context, debugger, token-fault and production compositions
are rejected. The one-run controller consumes a CreateNew guard only after
absolute Windows csc compilation, Parser.ParseFile, contract/descriptor negatives,
injected exact cleanup/restoration failures and retained controller cases pass.
The root is exclusively created by the caller and handed over through its
original directory handle, whose volume/file identity is compared before staging.

The raw synthetic service in session 0 exclusively creates one named station
with CWF_CREATE_ONLY, then one desktop on a dedicated clean setup thread. Both
receive explicit protected BA-owned descriptors allowing SYSTEM/Administrators
control and only the exact service SID workload access. Station `0x0002037f` and
desktop `0x000200ff` are diagnostic access caps, not minimum GDI-rights claims.
No default/shared USER descriptor is modified. Exact filtered-token impersonation
must open both names with those masks and fail WRITE_DAC/WRITE_OWNER opens.
Queried names, flags, owner and DACL are verified, and original process station
and setup-thread desktop are restored before any child continuation or closure.
Unconfirmed restoration retains original USER handles and fails live.

The controller stages but never executes Node or bootstrap. It permits at most
one debugger-free PowerShell `-NoLogo -NoProfile -NonInteractive -Command "exit 0"`
child, preserving the v3 restricting set/KnownDlls admission, current filesystem
checks, environment, cwd, atomic outer job and three-pipe HANDLE_LIST. Explicit
lpDesktop selects the private context; USER handles are not inherited. Both raw
output drains and original child exit subscription are armed before the one
resume. Natural exit, event and drains share a 10000 ms deadline. A nonzero exit
after complete private admission is PRIVATE_DESKTOP_ADMISSION_INSUFFICIENT; it
does not identify a kernel object. No second launch or token/ACL rescue follows.
Original process/thread/job and USER handles are retained until exit and exact
cleanup. Structural filtered peer denial is not a fresh two-ready runtime test.

Even a natural exit-zero control grants no bootstrap, Node IPC, two-peer,
lifecycle, ingress, migration or production admission. The raw LocalService
enabled-Administrators peer remains outside the filtered boundary, and the
production host rejection remains required.

## Bounded SCM installation unit

`native-service-host.cs` and `install-personal-native.ps1` implement the synthetic
SCM admission unit. Explicit `-SyntheticQualification` admits a unique direct
`E:/task22-native-service-<16 hex>` root and `PortalNativeTest_<16 hex>` service
name. The project contract also binds `seoul-dengoku-tools-portal-native` to
`E:/portal-authority`: `-Mode Definition` renders its unregistered, inactive service
definition. Stage/permit actions for that real project return `FENCE_UNPROVEN` in
this increment. The host can consume a separately reviewed PROJECT_REVIEWED
manifest and immutable action permit binding exact installation, old writer ID,
expiry, approval and hash-pinned review/actor-exclusion receipts; this increment
does not issue that maintenance authority. Synthetic staging creates protected
directories with their DACL at creation, never adopts
an existing name, stages pinned files, builds an own-process host with the absolute
Windows Framework compiler and explicit framework references, and writes a service
definition without registering it. Administrative code, config, installation and
action manifests are separate from exact-service-SID writable data/temp/status.
There is no shared LocalService allow ACE. Writable directories inherit an OWNER
RIGHTS read-control ACE so a service-created object's owner does not implicitly
receive WRITE_DAC. This boundary excludes administrators from the adversary set.

The production definition remains LocalService with `SERVICE_SID_TYPE_RESTRICTED`;
the v2 synthetic source exception is described below. The workload token must have
its exact service SID enabled in both normal and restricted token groups. The
host sets the new workload token's default owner to that enabled service SID and
default object DACL to SYSTEM, Administrators and that exact SID before creating
children, without modifying the raw SCM token. This is necessary for named-pipe creation: the Windows named-pipe
default descriptor grants its owner full control rather than using the token
default DACL alone. Leaving the owner as Administrators produced a real
`CreateFile` access denial and Node `spawn EPERM`; the exact-SID owner made the
same pipe and IPC probes succeed without a shared LocalService ACE. The writable
filesystem leaves still apply their OWNER RIGHTS read-control rule. It retains
namespace/file handles and validates hashes and ACLs before
launch. The outer noninherited kill-on-close job is attached atomically with
`PROC_THREAD_ATTRIBUTE_JOB_LIST`, together with an explicit standard-handle list,
to the suspended PowerShell child. The existing PowerShell inner job and Node IPC
supervisor remain the application drain mechanism. Both nested jobs use a
no-window child because a service desktop cannot safely initialize a console.

Actual restricted-token qualification found Windows PowerShell Add-Type's
CodeDom `CreateTempDirectoryWithAce` denied access: its private temporary ACL did
not admit the restricted service SID. The installed route therefore builds the
existing embedded inner-job source verbatim into `native-job.dll` during the
administrative build, hashes it in the launch config and installation manifest,
and loads only that immutable assembly. It does not add LocalService access or
run a service-time compiler. Foreground use without this optional assembly still
uses the existing Add-Type route. OS component-store executable hardlinks are
admitted separately from project files, which must have one link.

HandlerEx only signals one worker stop and returns. RUNNING requires actual IPC
ready plus retained supervisor/application process handles. STOPPED requires
drained, stopped, zero PowerShell exit and exits on the original descendant
handles. Checkpoints advance only at real stop/drained/stopped progress. A stop
observation deadline produces `STOP_FAILED_STILL_LIVE`, retains the host, job,
handles and durable activation lock, and never fabricates progress or reports a
live writer stopped. Explicit harness abort is abrupt termination, not drain.
Shutdown uses the same stop signal; preshutdown is not registered. Global shutdown
timeouts are untouched. Demand start and no failure actions are fail-closed
recovery, not boot availability. Physical reboot qualification remains separate.

Activation consumes an immutable installation-bound synthetic permit and creates
an exclusive durable `status/activation.lock`, including across clean stops.
The runtime cannot replace the action permit. No production permit issuer is
implemented: exact fake old-writer preimages, absence, replacement, extra writers,
restart-policy failure and recreation all remain either rejected or
`FENCE_UNPROVEN`. Real Docker restart/recreate actors are not excluded by a record.
No Docker administration is granted to the service or invoked by these scripts.

`test/native-service-host.ps1 -RegisterOwnedSyntheticServices` is an explicit
registration harness. It owns unique demand-start/no-recovery services via their
original SCM handles, subscribes to SCM and file events, and deletes the original
registrations after observed host/descendant exits. `test/native-installation.ps1`
exercises fake writer preimages and exclusive creation without Docker access.
Both use synthetic files only. Neither is a production installer or DB migration.

### Synthetic full-token source contract

The approved follow-on profile is `local-synthetic-full-primary.v2`. For new,
uniquely owned synthetic registrations only, SCM adds the exact service SID using
`SERVICE_SID_TYPE_UNRESTRICTED` (1). Configuration is queried before start, and the
actual LocalService primary token must have an enabled owner-capable exact SID and
an empty restricting set. A mismatch stops with `SOURCE_TOKEN_CONTRACT_MISMATCH`.
Production definitions retain SID type 3 and the enabled-Administrators rejection.

The host makes one documented full restricted primary token: BA deny-only when
present, `DISABLE_MAX_PRIVILEGE`, restricting set exactly `{service SID, BUILTIN
Users}`, service owner and the private default DACL. The immutable manifest and
permit bind the source SID type, ordered read SID set, privilege/owner/DACL policy
and exact object roots. Users is a candidate justified by recorded Windows image
ACL grants and actual token opens, not an inherently read-only identity. No World,
Authenticated Users or LocalService ACE is added to project ACLs or OS objects.

Before PowerShell creation, the host records Windows image hashes/ACLs, verifies
the actual filtered token and checks individual and combined object rights. It
checks private code/config read and mutation/security-control denial, writable
data/temp/status rights, created-file owner/OWNER RIGHTS behavior, and sidecar and
marker creation at the governed database directory. A separate task-owned Users
read-only object must permit reads and deny writes; a Users-write counterexample
must allow writes and be rejected by project ACL admission. That counterexample
is intentional evidence that this profile does not provide global write
confinement. Governing project ACLs remain SYSTEM/BA/exact SID (plus OWNER RIGHTS
read-control on writable leaves).

Only a passing prelaunch gate advances to suspended PowerShell verification and
actual Node IPC ready. A second independently filtered service is staged only
after the first reaches ready. Both are held at the ready IPC barrier while each
token is tested against the other's private static and created objects. The raw
host read remains an administrator-excluded positive control. Existing lifecycle
and fault cases follow progressively; first failure stops advancement and retains
raw proof and original-handle cleanup. Current result and gaps are recorded in
`task22-native-token-source-contract-result.json`; no local result admits production.

The first actual v2 run verified SID type 1 with no source restricting SIDs and
constructed the exact full child token. All 45 recorded Windows image reads,
PowerShell/Node execute opens, and private code/config read/denial checks passed.
The next check, GENERIC_WRITE on the pinned `data` directory, returned sharing
violation 32 rather than access denial: the host retains a directory pin with
read-only sharing. This is an inconclusive rights probe, not an isolation pass or
an ACL failure. Advancement stopped before created-object, broad-object and
registry checks and before PowerShell creation. The service and both exact scratch
roots were cleaned through the owned harness; no second service was staged. The
pin/probe sharing contract needs a bounded correction before a fresh gated run.

The sharing correction retains read-only sharing for immutable code/action/root
pins. Only the admitted `data`, `temp` and `status` directory handles use
FILE_SHARE_READ | FILE_SHARE_WRITE; neither kind permits FILE_SHARE_DELETE.
Sharing does not grant rights: the gate records a separate AccessCheck with the
file generic mapping and an actual impersonated CreateFile request. The writable
ACL already grants FILE_WRITE_EA and FILE_WRITE_ATTRIBUTES (0x10 and 0x100);
these are explicitly checked. Such directory metadata writes are within the
existing writable-leaf contract, not authority to replace a pinned directory,
alter its DACL/owner, or grant FILE_DELETE_CHILD. Actual rename/delete attempts
and successful unpinned controls regress namespace custody. The service gate
also attempts rename under the exact filtered token while its host pin remains.
The bounded correction's actual result is in
`task22-native-token-sharing-correction.json`; prior raw receipts are preserved.
The harness's `-ObjectRightsOnly` switch issues a synthetic `object-rights-only`
permit. After a complete prelaunch gate the host reports STOPPED and returns
without creating PowerShell. Failure also retains the normal diagnostic/cleanup
path. This mode does not exercise runtime, peer isolation or lifecycle behavior.

The next approved runtime harness uses `-RuntimeOnly` and the synthetic
`runtime-credited` permit to credit the accepted sharing receipt instead of
repeating its object/BU/registry gate. It still constructs and verifies the v2
token, verifies suspended and post-resume PowerShell, and requires actual Node
ready, immutable native-job.dll loading, created-object access, and clean stop.
The first runtime attempt reached suspended and post-resume PowerShell token
verification, then PowerShell exited with STATUS_ACCESS_DENIED (0xC0000022)
before reporting a Node PID or IPC-ready. No specific denied loader/object
surface is identified by this exit code. Advancement stopped: no second service,
peer isolation or lifecycle case ran. See `task22-native-token-runtime-result.json`
and its preserved raw receipt for exact source/binary hashes and owned cleanup.
The previous image-read and registry proof remains credited, not runtime closure.

The bounded diagnostic mode substitutes only PowerShell arguments with
`-NoLogo -NoProfile -NonInteractive -Command "exit 0"`, retaining the service,
full token, atomic job/std-handle list, five-variable environment and code cwd.
It records original-handle exit independently of application-ready semantics.
The first control reproduced STATUS_ACCESS_DENIED with empty output. Its unique
ETW session was armed before process creation and stopped after child exit;
decoded file/registry events did not identify a causal access-denied object.
That ETW increment lacked a proved debugger-armed pre-loader boundary.
`task22-native-token-runtime-diagnostic-result.json` preserves its coverage limit
and full raw ETL/export hashes.

The subsequent owned CDB diagnostic adds a creation-callback event gate before
the creator's original `ResumeThread`. CDB attaches only to the captured suspended
child and breaks on the existing ntdll load event (`-pb -xe ld:ntdll.dll`), before
`RtlUserThreadStart` executes. Matching ntdll PDB metadata supplies the process-local
PEB loader flag address; no IFEO or GFlags registry settings are changed. Output
subscription and the armed marker release the creator gate only after arming.
The original creator suspension remains 1 on both sides of the callback. Original
process/thread/job/std-handle ownership and actual-token verification are retained.

The causal capture records `NtOpenDirectoryObject` on absolute `\KnownDlls`, desired
access `0x3`, returning `0xc0000022` to `ntdll!LdrpInitializeProcess+0xdbd`.
Loader output independently reports the failed open and initialization failure
with the same status. This identifies the denied operation, not which ACE or
restricting SID policy must change; no token, OS ACL or global policy is changed.
All attempts and source hashes are in
`task22-native-token-debugger-diagnostic.json`. Six sequential minimal-command
children were created while correcting the controller; two were never released
and four were released. This exceeds the requested single-child bound and is
recorded as a scope deviation, not reported as one successful run. No Node or
bootstrap ran. The last controller timed out at the debugger's termination break,
then cleaned up abruptly through owned handles; neither natural interpreter exit
nor lifecycle success is claimed. Diagnostic advancement stopped at causal proof.

### Descriptor-gated KnownDlls correction (not runtime qualified)

The next read-only capture opened exact Object Manager `\KnownDlls` with
READ_CONTROL, queried name/type and OWNER/GROUP/DACL from that handle, and retained
the full self-relative descriptor. SHA-256 is
`3f13329b6dd447dede559ee7bbdc0db04ff3bc8531c0f20736f082043795e791`.
Owner is BA, group SYSTEM. Its ordered allow ACE 3 grants `S-1-5-12` (Restricted
Code) `0x20003`; there are no deny ACEs. The queried Directory generic mapping is
Read/Execute `0x20003`, Write `0x2000c`, All `0xf000f`, not filesystem mapping.

The separate `local-synthetic-full-primary-known-dlls.v3` contract adds only that
descriptor-selected SID after exactSID/BU in the restricting list. It preserves
the v2 contract, original unrestricted SCM source, BA deny-only, privileges,
exact-SID owner and private default DACL. Descriptor hash and ordered SID set bind
the installation and permit; production and mixed/drifted contracts are rejected.
Two token-only fixtures constructed old/proposed tokens from the same retained
original source in each fixture. AccessCheck API success, authorization/granted
mask, privilege set and actual impersonated native opens are separately recorded.
Old denied mask 3 and proposed allowed it; directory create/control requests stayed
denied and before/after descriptor hashes matched. The initial privilege-set
serialization retained unused buffer bytes; that raw result remains preserved.
The focused subsequent gate emits only its initialized, counted privilege bytes.

The 127 focused file checks passed own immutable denial, data/temp/status actual
create/write/delete, exact created owner/OWNER RIGHTS and peer-private denial.
BU-write remained a deliberate writable counterexample; RC-only read/write
objects stayed denied because RC is absent from the normal groups. Both broad-SID
fixture ACLs were rejected for governed project admission. No broad SID was added
to project/default/OS ACLs, and global write confinement is not claimed.

The one debugger-free PowerShell `exit 0` control subscribed to exit before resume
and exited naturally with `0xc0000142`, not zero, with empty stdout/stderr. This is
the first failed runtime gate; no bootstrap, Node, debugger, alternative SID or
further diagnostic probe followed. Its new initialization failure is not localized
by this correction. Runtime admission is closed pending review; the v3 host accepts
only bounded object gates and the evidence-bound minimal command control.
`task22-native-known-dlls-token-correction.json` preserves exact descriptors,
candidate justification, per-stage source/binary hashes, raw gates and cleanup.

The separately approved initializer diagnostic composes `-KnownDllsCommand` with
`-DebuggerRoot`: it retains the evidence-bound v3 command permit and admission
hash rather than selecting the old v2 debugger mode. A unique synthetic event
holds the original creation callback before resume until CDB has armed its
process-local loader flag and validated matched-image initializer ABI. Per-thread
nested records pair actual PE DLL_PROCESS_ATTACH entry frames with their returns;
TLS callbacks are recorded as void, never interpreted as BOOL. Termination hooks
capture and continue, and process-exit handling quits CDB. This diagnostic neither
admits bootstrap nor repeats the accepted object gate. Its raw outcome, coverage
limits and exact cleanup belong in `task22-native-v3-initializer-diagnostic.json`.

### Prior source-mode failure (preserved evidence)

The bounded correction adds an explicit synthetic `-FilteredWorkload` profile,
bound identically in the immutable installation and action permit. It creates a
new primary token with `CreateRestrictedToken(DISABLE_MAX_PRIVILEGE)`, explicitly
requests Administrators deny-only without adding a restricting SID list, and
requires only the documented SeChangeNotifyPrivilege exception. Owner and private
object default DACL are set on that token, not the SCM adapter token. The adapter
uses only `CreateProcessAsUserW` with that token and atomic suspended JOB_LIST plus
HANDLE_LIST; there is no unfiltered launch fallback. The suspended PowerShell
token and both actual Node descendants must pass structured SID, attributes,
privilege-presence, owner and DACL verification before their lifecycle state is
accepted. Token creation/owner/DACL, process creation, job-list and resume fault
cases are in the harness, but are not qualified under the final filtered profile.

Actual correction runs have not produced a ready filtered workload. The direct
filter returns error 87 on this host's already restricted SCM primary token.
Resubmitting the identical existing restricting SID list makes token construction
succeed and proves BA deny-only, privilege removal, exact owner/DACL and the
suspended child's profile, but then denies Windows loader reads and the child
exits `0xC0000135`. Adding WRITE_RESTRICTED (`0x8`) also returns error 87. These are
observed API results, not a verified same-source correction. The final source
retains the direct approved filter and fails closed; construction-only probes and
the unsuccessful restriction-mode experiments are removed. No broad OS ACL,
unfiltered process fallback or undocumented token bypass is used. Both Node token
checks, filtered peer access and the requested filtered lifecycle matrix remain
unverified until this API gap has an approved resolution.

This profile admits a privileged raw SCM adapter only in owned local synthetic
qualification. It does not deprivilege that host, repair LocalService membership,
or confine an unrelated administrative peer. Two filtered workloads must deny
peer read/write; the raw adapter's read of another synthetic config is retained
as an allowed administrator-excluded positive control. The PROJECT_REVIEWED host
guard still rejects enabled Administrators and cannot opt into this synthetic
profile. No production identity acceptance follows from these local tests.

Actual SCM testing on the shared Windows host found LocalService's token includes
an enabled Administrators SID and extensive administrative privileges. A second
restricted LocalService service could read the first service's config through its
Administrators ACE, while writes were denied by WRITE RESTRICTED. The requested
sibling read isolation therefore failed despite correct exact-SID file ACLs. The
host now explicitly rejects enabled administrator membership before creating its
activation lock or writer. `-ExpectHostIdentityRejection` proves that rejection
using a real owned temporary SCM registration. No shared account membership or
host security policy is changed. This implementation is retained but the first
unit is not qualified or feature-complete on this host. A clean disposable service
identity environment or a separately reviewed stronger child-token contract is
needed before continuing the lifecycle matrix and production admission.

`start-personal-native.ps1` is an alternative to the deployed Docker wrapper.
It does not replace or modify that wrapper. Invoke it with an absolute admitted
PowerShell executable, `-NoProfile -NonInteractive -File`, and an absolute
`-ConfigPath`. Do not invoke the JavaScript entrypoint directly: Node processes
`NODE_OPTIONS` before JavaScript can clear the environment.

The bootstrap verifies the explicitly configured Node SHA-256, rejects missing
and reparse paths, clears the child environment, fixes its working directory,
and invokes the adjacent JavaScript launcher by absolute path. The JavaScript
launcher requires Node 24, verifies the one accepted `server.mjs` SHA-256,
requires an existing absolute database and storage directory, and imports that
server in the same process. It never creates or seeds an originals database.
No source checkout, shell lookup, relay, Docker DNS, or ambient `.env` is used.

The binding is fixed at `127.0.0.1:18766`, personal mode, public URL
`https://sss.linalab.io/tools`, and base path `/tools`. Existing Docker port 18765
is not changed. Port separation does not authorize running two real writers.

## Configuration contract

The JSON object has these fields:

| Field | Required value |
| --- | --- |
| `schema` | `portal-native-launch.v1` |
| `nodePath`, `nodeSha256` | Absolute admitted Node 24 executable and its accepted SHA-256 |
| `serverPath`, `serverSha256` | Absolute single accepted source-free server and its accepted SHA-256 |
| `originalsDb` | Absolute existing canonical `originals.sqlite`; no fallback |
| `storagePath` | Absolute existing protected application storage directory |
| `publicPath` | Absolute existing accepted release public directory |
| `environment` | Explicit string-valued allowlist below |

Allowed environment keys are `PORTAL_SESSION_SECRET`, `PORTAL_OWNER_EMAIL`,
`PORTAL_ACCESS_ISSUER`, `PORTAL_ACCESS_AUDIENCE`, `PORTAL_TEMPLATE_MANIFEST`,
`PORTAL_TEMPLATE_PINS`, `PORTAL_PERSONAL_PROVIDER_URL`,
`PORTAL_PERSONAL_PROVIDER_KEY`, and `WIKI_BASE_URL`. Unknown environment keys are
rejected. Template paths, when supplied, must already exist as absolute regular
files. The JSON itself is secret-bearing runtime configuration and must be
protected; do not commit a populated configuration or copy existing secrets
for a synthetic test. Provider and wiki endpoints must be explicitly admitted
for the native network. No provider relay is installed by this increment.

Two path layouts use the same launcher without code changes:

| Artifact | Earlier layout, rejected ancestry | Owner-selected separated layout |
| --- | --- | --- |
| Source checkout | `E:/git/seoul-dengoku-tools` | `E:/git/seoul-dengoku-tools` |
| Runtime config and launcher | `E:/git/portal-authority/launch` | `E:/portal-authority/launch` |
| Accepted release | `E:/git/portal-authority/release` | `E:/portal-authority/release` |
| Canonical DB | `E:/git/portal-authority/db/originals.sqlite` | `E:/portal-authority/db/originals.sqlite` |
| Application storage | `E:/git/portal-authority/data` | `E:/portal-authority/data` |

These paths are designs, not directories created by this increment. The owner
explicitly chose separated runtime artifacts in
`task22-owner-protected-path-choice.json`; that overrides the `E:/git` runtime
config placement rule only for this service. The ordinary `E:/git` parent is
not safe: the tested self-only deny still allowed AU junction insertion and
previously opened DELETE handles still renamed it.

OMO-managed executables and dependencies belong in the normal user-local
`~/.local/share/omo-managed` tree, not in `E:/git`. The currently observed
`C:/Users/oliver/.local/share/omo-managed` and its ordinary ancestors grant
Modify including DELETE and DELETE_CHILD to non-admitted sandbox/foreign SIDs.
A protected leaf under that ancestry is not a protected runtime installation.
The installed versioned nvm Node 24.13.1 is suitable only for the bounded
synthetic compatibility test; its hash and valid signature do not certify its
ancestry. No nvm, user-profile, shared managed-root, or production ACL is changed.
Whether a separately installed service-pinned Node under `E:/portal-authority`
is admitted as a project runtime rather than OMO-managed dependency needs the
independent installation gate; the configuration accepts an absolute path but
does not decide that policy or perform an installation.

## Bounded two-peer Node-direct fixture

`test/native-service-host.ps1 -TwoPeerNodeDirect` extends the existing owned SCM
controller. It admits only the retained official Node 24.13.1 and KnownDlls
receipt, runs the existing offline prerequisites before registering exactly two
unique synthetic services, and preserves the merged launcher and supervisor.
Both peers must remain ready together under distinct service SIDs. The controller
persists the host's full suspended-supervisor identity before resume and inherited
application identity before ready, including integrity SID, groups, restrictions,
privileges, owner and default DACL. It never reopens a workload token after start.
Actual Node operations and native opens in a hash-bound, statically linked native
Win32 helper (no CLR startup), compiled with a recorded compiler hash and inheriting each
application's actual token check own
immutable reads, own sidecar/marker/temp creation, and bidirectional private
read/write/delete, parent replacement, WRITE_DAC and WRITE_OWNER denial. The raw
controller read positive control is administrator-equivalent infrastructure outside
the peer isolation claim.

The controller subscribes before service start and before each stop. Each peer
receives one SCM stop forwarded through the existing stdin/IPC path. Ordered
drain/application-exit/stopped records, original process exit signals, complete
output bytes and explicit private USER cleanup must precede successful cleanup.
The first failure stops each bounded invocation. A subsequent qualification
invocation requires a materially different, evidenced harness repair and fresh
hash-bound gates. Application observations retain the exact own/cross operation,
target path and API before deciding the gate, including full native-child spawn
errors, status, signal, stdout/stderr and tails. Expected cross-peer access denial
is success; unexpected access or an own-operation failure is not. An initial receipt and
pre-cleanup snapshots are persisted before risky work; nested cleanup catches and
an outer finally preserve ErrorRecords and incomplete cleanup as failure, never
as qualification. Each original service
handle is deleted only after exit; roots are verified through their retained
directory handles before removal. This is synthetic qualification, not
production admission, global filesystem confinement or old-writer exclusion.

## Writer exclusion and lifecycle limits

The launcher exclusively creates `portal-writer.lock` beside the canonical DB
before importing the server. A concurrent invocation fails before server code
runs. Normal process exit removes the marker; abrupt termination leaves it
behind and restart fails closed. No stale-PID or timeout takeover exists.
Removal requires an operator to prove writer absence; the synthetic harness
can do so because it owns the exact child and observes its exit. This is not
an exclusion mechanism for the old Docker process, which does not honor the
marker. Production cutover must stop and disable the old writer's restart path
before activating native write authority.

This foreground launcher is not a Windows service supervisor. Killing its
PowerShell parent, logoff, reboot, graceful IPC drain, job-object ownership,
least-privilege service identity, service DACL, maintenance exclusion and
recovery are unresolved deployment gates. Windows process termination is not
POSIX graceful SIGTERM. Do not register a task or service from this document.
Path checks and hashes are accidental-drift guards, not protection against an
attacker able to replace an ancestor between check and use. All executable,
DLL, configuration, template and data ancestry must be independently admitted.

## Project-local ingress design

Read-only inspection found tunnel `5d1727c8-32df-415d-a452-b9365385c89c` in
`E:/git/seoul-dengoku-web/cloudflared/config.yml`. Both
`seoul-dengoku.linalab.io` and `sss.linalab.io` currently route to `http://web:80`;
the `seoul-dengoku-tunnel` container supplies the connector, and shared nginx
then routes `/tools/` to `tools-portal:18765`. That path keeps
the shared Docker runtime in the request and authentication boundary.

A protected native cloudflared connector can route the exact hostname
`sss.linalab.io` with path regex `^/tools(/.*)?$` directly to
`http://127.0.0.1:18766`, set `originRequest.httpHostHeader: sss.linalab.io`,
and finish with `http_status:404`. Cloudflared forwards the entire path without
stripping it. The existing owner Access application, issuer, audience and
owner-only policy must remain bound to `sss.linalab.io/tools`; cookies and
assertions must reach the application unchanged. No authenticated cloud or
provider request was made here.

An additional connector on the existing tunnel is not a safe path-level
cutover: replicas can receive traffic for both hostnames and inconsistent local
ingress files can split traffic between old and new authorities. A dedicated
tunnel avoids shared nginx but DNS routing is hostname-level, not path-level.
Moving `sss.linalab.io` therefore requires an explicit decision for its other
paths and preservation of the existing hostname's services, plus a separately
reviewed connector credential and Access policy binding. Do not copy the
existing tunnel credentials into this increment.

The selected future shape is a dedicated protected native connector and an
owner-approved hostname cutover, with its config under the protected project
authority and executable under an admitted runtime tree. Before any route
write: inventory the live DNS/tunnel/Access identities read-only, validate
ingress syntax and exact `/tools`, `/tools/`, API and non-tools matching,
prove protected connector ancestry and supervision, drain and stop the old
writer, retain durable maintenance exclusion, then change the route within a
fresh owner release window. Cloud edge propagation is not assumed atomic;
single-writer exclusion must hold throughout overlap and rollback.

Rollback first stops the native writer. Route-only rollback is allowed only
to an independently admitted backend using the same canonical data authority.
Reverting DB authority to sealed inputs requires the existing unchanged-seed
rollback guard. Any committed write, sidecar, missing main or uncertainty means
`HALT_NO_COPY_NO_AUTHORITY_REVERSION`; never reseed. No Cloudflare, DNS, shared
Docker, service, ACL or production database mutation is part of this increment.

Cloudflare reference (read-only):
https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/configuration-file/
