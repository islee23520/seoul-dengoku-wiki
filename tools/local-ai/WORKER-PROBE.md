# Restricted application probe candidate

This console program links `../portal/install/native-service-host.cs`
unchanged and selects `WorkerProbe` as `StartupObject`. The production service
entrypoint and modes are untouched. Build uses installed .NET Framework 4.8.1
reference assemblies, not a System.Web shim or copied token verifier:

```text
dotnet build TOOL/local-ai/WorkerProbe.csproj --nologo -o <owned-candidate-directory>
dotnet build TOOL/local-ai/test/WorkerProbe.Tests.csproj --nologo -o <owned-test-directory>
<owned-test-directory>/WorkerProbe.Tests.exe
```

The focused tests query only their own process/token, reject duplicate config
fields and an excessive deadline, reject mismatched image/creation identity,
and cancel/join a real stalled overlapped read on a unique owned fixture pipe.
Time is the behavior in the deadline test; there is no sleep or impersonation.
These are synthetic/owner mechanism evidence, not production identity proof.

## Input and one approved action

Invocation is exactly `WorkerProbe.exe <absolute-private-config.json> <sha256>`.
There is no default, discover mode, arbitrary pipe/request, launcher, or token
construction. JSON fields are all strings; unknown, duplicate, nested, null,
missing fields and oversized JSON are rejected. Required keys:

`schema` (`worker-probe.v1`), `serviceName`, `serviceSid`, `ownerSid`,
`applicationPid`, `creationFileTime` (Windows FILETIME, decimal), `imagePath`,
`imageSha256`, `brokerPath`, `brokerSha256`, `brokerConfig`,
`brokerConfigSha256`, `manifestSha256`, `nonce` (32 lowercase hex),
`receiptPath` (new `<nonce>.json`), `deadlineMs` (1..10000), `expiresUtc`
(round-trip UTC, no more than 30 minutes away).

Config, broker config and receipt directory must have a protected private DACL,
owned by `ownerSid`, allowing only that owner, SYSTEM or Administrators. Paths
cannot traverse reparse points. Config, image, broker and broker config stay
read-pinned without delete/write sharing for the action. The config hash is
passed independently on the command line. The nonce and pins are bound to the
exclusive new receipt; the fixed broker request does not support a wire nonce.
There is no retry or replacement of a receipt. Failure exits 1 and cannot print
`PRODUCTION_PROBE_PASS` or produce a success receipt.

The actual application must be discovered read-only through its SCM process
tree, launcher and listening socket. Never substitute the SCM host, supervisor,
another node process, or a historical PID. The harness opens only QUERY_LIMITED
INFORMATION on that PID, retains the handle, checks creation FILETIME, actual
image path/hash and liveness, and rejects the current SCM PID. Its actual token
is opened QUERY|DUPLICATE and passed to the original
`NativeWorkloadToken.Verify(token, sid, true, true, true)` and `Snapshot`.
Only SecurityImpersonation/TokenImpersonation duplication is used; no SID,
privilege, owner, default DACL or restricting set is changed.

Inside synchronous thread impersonation the only exchange is
`{"version":1,"op":"probe"}` on `\\.\pipe\seoul-local-ai-worker-v1`.
The pipe owner SID is checked using the kernel security descriptor. Connect,
write and read share one monotonic deadline. Overlapped kernel reads/writes
wait only the remaining budget; expiry calls CancelIoEx and joins that exact
operation before releasing memory, handles or impersonation. Frames are
1..65536 bytes. The response must match owner/service SIDs, manifest pin,
version, operation, identity source, numeric zero GPU dispatches and Ubuntu UID.
The source primary token and retained process identity are checked again before
the owner-only, CreateNew, flushed receipt containing the full token snapshot.

The broker performs read-only Ubuntu `id -u`. Its minimal probe config has empty
Workers/Artifacts and no Bridge, so it has no configured GPU dispatch path.
Broker start/new pipe capability, actual application token query/duplicate and
impersonated probe still require explicit approval of the pinned action. Before
approval do not run this program, start that broker, alter any live ACL, register
or restart a service, or run a GPU workload. The machine-local task19 receipt
contains exact candidate, config, runtime/reference hashes and the proposed
commands; it must be refreshed on identity/artifact/config change or expiry.
