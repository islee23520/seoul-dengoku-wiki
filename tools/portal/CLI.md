# Portal management CLI and MCP

## Local AI jobs

```sh
ssstool local-ai catalog --format json
ssstool local-ai create --input request.json --format json
ssstool local-ai get JOB_UUID --format json
ssstool local-ai download JOB_UUID --artifact ARTIFACT_ID --output new-result.glb --format json
```

Creation accepts the exact HTTP request: `{ "requestId": "UUID", "tool":
"uniforge3d", "assetId": "approved-asset", "seed": 20261023 }`. UniMate uses
`"tool": "unimate"` and requires a nonblank `prompt`; UniForge3D forbids it.
Paths, endpoints and model selections are not accepted. The shared HTTP request
validator also defines the CLI and MCP schemas. MCP uses the same flat creation
fields, and `jobId`, `artifactId`, `output` for downloads.

These operations use only the fixed owner origin and existing Access/session/CSRF
transport. Creation is a network mutation, catalog/get are network reads, and
download writes a local artifact. The durable UUID journal prevents resubmission;
after an uncertain create, use get with that UUID. Changed payloads conflict.
Downloads require an existing parent and a new output path. A succeeded job's
artifact metadata binds MIME, bounded byte count (128 MiB maximum), and SHA256 to
the HTTP attachment before exclusive atomic publication. No existing output is
overwritten. Readiness and GPU generation remain server-owned gates.

## V2 image workstations

The shared CLI/MCP catalog includes `workstations.catalog`, `workstations.list`,
`workstations.create`, `workstations.get`, `workstations.history`,
`workstations.result`, and `workstations.download`. These use the owner session
and `/tools/api/v2/workstations`; existing v1 `references` commands keep their
original meanings.

```sh
ssstool workstations catalog
ssstool workstations list
ssstool workstations create --input workstation.json
ssstool workstations history person-0998
ssstool workstations get REQUEST_UUID --person person-0998
ssstool workstations result REQUEST_UUID --person person-0998 --frame 0
ssstool workstations download REQUEST_UUID --person person-0998 --frame 0 --output new-frame.png
```

Creation accepts the server envelope `{ "request": { ... },
"authoredLookBase64": "..." }`, with schemaVersion 2, the explicit owner-authored
look binding, and ordered frames containing outputSpec and outputSpecSha256.
The operation schema returned by `ops` or MCP `tools/list` describes every field.
Category, variant, view, frame order, alignment, and spec hash are validated before
dispatch using the same domain validator as HTTP. MCP uses `personId`,
`requestId`, `frameOrder`, and `output` for the corresponding read/download fields.

The nested request UUID is durably journaled before the single POST. A repeated
UUID is never resent; changed payload returns REQUEST_CONFLICT. Inspect the job
with `get` after an uncertain outcome rather than creating a replacement UUID.
Creation returns the shared job/reviewStatus/approval envelope, excluding the
server's non-stable create-only manifest. HTTP 503 returns a non-success BLOCKED
envelope with the server reason and request UUID; there is no retry, fallback,
or direct provider access. Production generation remains blocked until the
server's single-attempt gate is proved.

Downloads require a new path with an existing parent directory. They validate
person, parent UUID, child UUID, frame order, receipt hash and output-spec binding,
then verify the exact downloaded PNG SHA256 and decode it against the requested
canvas/background contract before exclusive atomic publication. Results remain
HOLD, approval NONE; controlled fixture coverage is not paid generation proof.
The same source-free Node 24 release and private installer contract applies.

## Local reference artifact validation

```sh
ssstool references validate --artifact-root /trusted/artifacts --artifact-directory /trusted/artifacts/reference-set
```

MCP exposes `references.validate` with the same `artifactRoot` and
`artifactDirectory` fields. This operation reads only contained regular local
files: `set.json` and each selected shot's receipt and PNG. It validates the
completed candidate schema, canonical shot order, source/style/identity binding
consistency, receipt hashes, PNG hashes and decoded receipt metadata. Symbolic
links and paths outside the explicit root are rejected. It needs no server,
login, provider or environment file and never dispatches an image request.

The machine result uses `portal-reference-validation.v1` and `VALID` or
`INVALID`; invalid artifacts exit nonzero. `VALID` proves local integrity only,
not authenticity of self-recorded source hashes or external sealed identity.
Approval and dispatch remain `NONE`, and paid proof remains `NOT_RUN`.

## Installed personal server command

The owner's Mac command is `ssstool`, installed in `~/.local/bin` with private
bundles under `~/.local/share/ssstool`. Its default server is
`https://sss.linalab.io/tools/`; it does not start a local replacement service.

```sh
ssstool login
ssstool config
ssstool status
```

`login` uses the existing Cloudflare Access owner login and caches its scoped
token through cloudflared, without printing the JWT. `status` sends that token
to the HTTPS server in `cf-access-token`, never follows authentication redirects,
and validates the actual response. Expired/missing login returns
`ACCESS_LOGIN_REQUIRED`; denied server access returns `REMOTE_AUTH_FAILED`.
`SSSTOOL_SERVER_URL` selects another explicit HTTPS server. An explicit
`PORTAL_ACCESS_JWT_ASSERTION` may supply the token instead of cloudflared.
Remote config/status also use the shared MCP operations when that environment
is configured. Remote stop is refused: local capability ownership does not
authorize stopping the deployed Docker service. Image generation is not a
management command.

Build with `bun run build`. The private release contains `server.mjs`, `cli.mjs`, `mcp.mjs`,
the `public/` assets, and the hashed `release-manifest.json`. Copy the whole
`dist/` directory to run with Node 24 or newer; Bun and `node_modules` are not
needed on the target machine. The existing `node server.mjs` entrypoint remains
available. Never publish private JavaScript artifacts as static assets.

### Private installer and upgrade

`bun run build` also creates `dist/ssstool-release.tar`,
`dist/ssstool-release.zip`, `dist/ssstool-manifest.json`, and `dist/install/`.
Obtain the installer, archive, and hash manifest through a reviewed private
channel. A checksum detects modified bytes; the separately trusted manifest is
the authority, not a signature. These bundles contain only built JavaScript and
public assets, never source, node_modules, provider keys, or login credentials.
Do not expose them through the public static route.

#### Authenticated artifact downloads

The fixed owner-authenticated artifact paths are:

- `https://sss.linalab.io/tools/api/releases/ssstool-manifest.json`
- `https://sss.linalab.io/tools/api/releases/ssstool-release.tar` (macOS/Linux)
- `https://sss.linalab.io/tools/api/releases/ssstool-release.zip` (Windows)

The source route correction is awaiting independent verification. These deployed
paths have **not yet been verified**; this is the intended download procedure,
not a claim that the current deployment serves the corrected route.

Each download requires both the owner's current Cloudflare Access token and a
portal session bootstrapped through `/tools/api/auth/session`. Obtain the token
on your own machine using its existing cloudflared owner login; do not copy a
browser cookie or another machine's token. HEAD is read-only, but installation
requires the actual manifest and archive bytes from GET.

For macOS/Linux, run the following in a private working directory with native
cloudflared and curl already installed. It creates a new `ssstool-download`
directory and refuses an existing one. The token stays in a shell variable;
curl receives its header through stdin, never a secret command-line argument.
Shell tracing is disabled, authentication redirects are not followed, and only
HTTP 200 is accepted. Session files and unsuccessful downloads stay in the
private temporary directory and are removed on exit.

```sh
(
  set +x
  set -eu
  umask 077
  mkdir ssstool-download
  auth_dir=$(mktemp -d)
  trap 'unset access_token; rm -rf "$auth_dir"' EXIT
  access_token=$(cloudflared access token --app https://sss.linalab.io/tools/)
  test -n "$access_token"

  owner_get() {
    http_status=$(
      printf 'header = "cf-access-token: %s"\n' "$access_token" |
        curl -q --config - --silent --show-error --fail \
          --proto '=https' --max-time 60 \
          --header 'Origin: https://sss.linalab.io' \
          --cookie "$auth_dir/cookies" --cookie-jar "$auth_dir/cookies" \
          --output "$auth_dir/$2" --write-out '%{http_code}' "$1"
    )
    test "$http_status" = 200
  }

  owner_get https://sss.linalab.io/tools/api/auth/session session.json
  owner_get https://sss.linalab.io/tools/api/releases/ssstool-manifest.json ssstool-manifest.json
  owner_get https://sss.linalab.io/tools/api/releases/ssstool-release.tar ssstool-release.tar
  mv "$auth_dir/ssstool-manifest.json" "$auth_dir/ssstool-release.tar" ssstool-download/
)
```

For a Windows release, obtain the same manifest and replace the final archive
URL and filename with `/tools/api/releases/ssstool-release.zip` and
`ssstool-release.zip`. The shell example can be run on a machine with a POSIX
shell, cloudflared, and curl; it is not a native Windows command prompt example.
Alternatively, in your own Access-authenticated browser, first open
`https://sss.linalab.io/tools/api/auth/session`, then download the manifest and
ZIP from the fixed URLs above. Do not export the browser's cookies or token.

Retain the exact filenames. Obtain the existing `install/` scripts through the
reviewed private channel, then pass the downloaded archive and manifest to the
installer commands below. Check the downloaded archive's byte count and SHA256
against the manifest. The installer verifies the archive and bundled file SHA256
values before writing the destination; a mismatch must stop installation. A checksum proves byte
integrity against the trusted manifest, not an independent signature. These
authenticated routes expose only the fixed manifest and source-free archives,
not source files, arbitrary private files, provider credentials, or sessions.

Install native Node 24 or newer and cloudflared yourself first. The installer
does not download or install prerequisites. Supported targets are Mac ARM64,
Windows AMD64, and Linux x86_64 with glibc. Intel Mac and musl are rejected.

```sh
sh install/ssstool.sh --archive ssstool-release.tar --manifest ssstool-manifest.json --prefix "$HOME/.local/share/ssstool"
"$HOME/.local/share/ssstool/bin/ssstool" help
sh install/ssstool.sh --rollback --prefix "$HOME/.local/share/ssstool"
```

```bat
install\ssstool.cmd --archive ssstool-release.zip --manifest ssstool-manifest.json --prefix "%LOCALAPPDATA%\ssstool"
"%LOCALAPPDATA%\ssstool\bin\ssstool.cmd" help
install\ssstool.cmd --rollback --prefix "%LOCALAPPDATA%\ssstool"
```

Add the installed `bin` directory to PATH explicitly. `ssstool-mcp` (Windows:
`ssstool-mcp.cmd`) runs the same selected release's MCP entrypoint. Login is a
separate owner action on each target; no existing token is copied by installation.
An existing legacy installation is not adopted: choose a fresh prefix.

Re-run the install command with the new archive and its manifest to upgrade.
All archive and file SHA256 values are checked before writing the destination.
Releases are immutable and the current/previous selector is replaced atomically.
The previous owned release is retained; explicit rollback verifies it before
selecting it. Installing the same release preserves the rollback selection.
Concurrent installer calls fail rather than racing, and an unowned or symlinked
destination is refused. A crash can leave `.install-lock`; remove it only after
independently confirming that no installer is active.

Successful install/rollback emits one JSON receipt and exits 0. Prerequisite,
unsupported target, or usage errors exit 2; invalid manifest/archive/checksum
errors exit 3; unowned destination or unavailable rollback exits 4; concurrent
installation exits 5; filesystem errors exit 6. Failures print only a machine
code on stderr and never print archive contents or secrets.

From any working directory, use the absolute path to the release:

```sh
node /path/to/release/cli.mjs help
node /path/to/release/cli.mjs discover
node /path/to/release/cli.mjs ops --format json
node /path/to/release/cli.mjs config --env-file /path/to/portal.env
node /path/to/release/cli.mjs start --env-file /path/to/portal.env
node /path/to/release/cli.mjs status --env-file /path/to/portal.env
node /path/to/release/cli.mjs stop --env-file /path/to/portal.env
```

`--help`, `-h`, and no arguments also show help as JSON. Commands accept the optional
`--env-file PATH` pair (or `--env-file=PATH`). Unknown commands, missing values, extra arguments, invalid
configuration, missing required configuration, and failed health or stop requests
exit nonzero. All commands use the same `loadConfig` contract as the server;
the CLI does not define its own list of portal modes.

All CLI command results, including errors, are one JSON envelope on stdout:
`{ "ok": true, "operation": "config", "result": { ... } }` or
`{ "ok": false, "operation": "config", "failures": [{ "code": "..." }] }`.
An unready config or health result includes its redacted `result` and
`CONFIG_NOT_READY` failure. Exit status is 0 when `ok=true`, otherwise 1.
`--format json` is optional; no other format is accepted. Diagnostics and
foreground readiness go to stderr, leaving stdout machine-readable.

The env file uses Node's dotenv syntax, not shell evaluation. Exported process
environment values take precedence over file values. Relative file and configured
paths resolve from the caller's working directory. Default public assets resolve
beside `cli.mjs`, not from that working directory. Env files are never rewritten.

`config` prints JSON containing the validated mode, readiness, missing variable
names, port, and network/mDNS flags.
It does not print credentials, owner identity, URLs, paths, or raw configuration.
Errors contain machine codes only. No command connects to an image provider or
performs generation.

`start` runs in the foreground and prints `PORTAL_READY port=... mode=...` on stderr only
after the portal and ownership controller are listening. Ctrl-C and SIGTERM
gracefully close the portal. One CLI instance may own a storage directory at a
time. Set `PORTAL_PORT=0` to select an ephemeral port; `status` reads the owned
instance's chosen port from its private control file in that case.

`status` requests the configured listener's actual `${PORTAL_BASE_PATH}/api/status`
(default `/tools/api/status`) with a five-second timeout. It validates the response
and prints only the health fields. A reachable but unconfigured portal exits
nonzero. `generationReady=false` describes the server's advertised generation
availability, not a failed health probe.

For Access-protected personal mode, supply a current owner assertion in
`PORTAL_ACCESS_JWT_ASSERTION` through the environment or env file. Status connects
to the configured listener, sends the configured external Host and that assertion,
and honors the server's Access verification. The assertion is never printed.
Missing or rejected assertions fail; the CLI does not bypass authentication or
perform an interactive Access login.

`stop` works only for instances started by this CLI. The owner creates
`.portal-cli.json` exclusively inside the configured storage directory, with mode
0600 and a random capability. A separate loopback controller verifies that
capability before gracefully closing its own portal. Stop never reads or signals
a PID and cannot stop `node server.mjs` or another arbitrary process. A duplicate
start refuses an existing ownership file. A crash can leave a stale file; stop
then fails rather than guessing ownership. After independently confirming that
no CLI instance uses that storage directory, an operator may remove the stale
file. Treat the control file like a credential; do not copy or publish it.

## Remote work catalog

Set `SSSTOOL_SERVER_URL=https://sss.linalab.io/tools/` and optionally
`SSSTOOL_STATE_DIRECTORY` to a private client directory. `login` and `logout`
are public CLI and MCP operations. The shared remote client uses the existing
cloudflared owner token to bootstrap a fresh portal cookie, CSRF token, and
connection. Credentials never appear in arguments or results. Authentication
redirects and expiry return `AUTH_REQUIRED`, with the HTTP status when available.

| CLI | MCP | Input |
| --- | --- | --- |
| `people list [--q TEXT] [--limit N] [--cursor N]` | `people.list` | Optional `q`, `limit`, `cursor` |
| `people get person-0998` | `people.get` | `personId` |
| `sheets upload --input sheet.json` | `sheets.upload` | `detailBase64`, `tokenBase64`, `imageBase64`; optional `requestId` |
| `generations create --input generation.json` | `generations.create` | Optional `requestId`, `connectionId`; exactly one of `personId`/`sheetId`; `providerModel`, `faceMode` |
| `generations get UUID` | `generations.get` | `jobId` |
| `batches create --input batch.json` | `batches.create` | `batchId`, `connectionId`, `providerModel`, `faceMode`, `items` |
| `batches get UUID` | `batches.get` | `batchId` |
| `batches cancel-pending --input cancel.json` | `batches.cancel-pending` | `batchId`; optional `requestId` |
| `jobs result UUID` | `jobs.result` | `jobId` |
| `jobs download UUID --output new.png` | `jobs.download` | `jobId`, `output` |
| `references download PARENT_UUID --shot hair --output new.png` | `references.download` | `requestId` (parent UUID), `shot`, `output` |
| `evaluations list UUID` | `evaluations.list` | `jobId` |
| `evaluations append --input evaluation.json` | `evaluations.append` | `jobId` and the existing evaluation fields, including `evaluationId`, `expectedRevision`, all evidence hashes, verdict, categories, notes |

Every remote operation accepts optional `--env-file PATH` / MCP `envFile`.
Mutation JSON files contain the same fields as MCP arguments. The catalog from
`ops` / `tools/list` supplies strict JSON schemas. Sheet base64 is decoded without
rewriting bytes, validated before any dispatch, and returned detail/token/PNG
SHA256 values must match those exact bytes. Generation and batch commands can
dispatch the owner's configured provider; these are explicit work operations.

Each mutation persists its UUID and canonical exact wire payload before dispatch.
The server's existing sheets, cancellation, batch, and evaluation schemas are
preserved without adding an unsupported request field. A repeated UUID is never
automatically replayed, even after authentication refresh, timeout, or UNKNOWN.
`REQUEST_CONFLICT`, stale evaluation revisions, and other server errors retain
their codes; mutation errors include the durable `requestId` and HTTP status.
Inspect with read commands rather than retrying a mutation.

Downloads fetch the job's sealed result and its fixed image endpoint, verify
SHA256, and publish an exclusive mode-0600 temporary file atomically. An existing
destination, wrong job binding, authentication failure, or tampered image leaves
no new destination or partial success. CLI and MCP return the same envelopes;
MCP `structuredContent` equals its JSON text content and `isError` is `!ok`.

Reference downloads accept one of `front`, `profile`, `side`, `back`, `head`,
`hair`, `upper`, `lower`, or `footwear`. For example:

```sh
ssstool references download 0ba11863-a534-49e2-892c-3f9cbdb048e7 --shot hair --output hair.png
```

The identical MCP arguments are `{ "requestId": "0ba11863-a534-49e2-892c-3f9cbdb048e7", "shot": "hair", "output": "hair.png" }`.
Both transports perform authenticated GETs of the fixed parent/shot `result`
and `image` routes. The server verifies the raw receipt digest, child UUID,
shot, successful receipt status, identity binding, and PNG digest. The consumer
checks the typed parent/shot metadata and fixed image URL, then verifies the PNG
before using the same exclusive, fsynced publisher as job downloads. The result
contains `requestId`, `childRequestId`, `shot`, `receiptSHA`, `pngSHA`, `output`,
and `bytes`; caller-selected URLs, remote filesystem paths, and expected hashes
are not inputs. Existing destinations, including a publication race, are never
overwritten, and temporary files are removed after success or failure.
Unavailable or UNKNOWN shots publish nothing. Downloading a successful shot
does not approve it: reference review remains `HOLD` with approval `NONE`.
This operation writes a local artifact and is neither read-only nor idempotent.

## Stdio MCP

Run `node /path/to/release/mcp.mjs` or `bun run mcp`. The package bin names are
`tools-portal` and `tools-portal-mcp`. Example client configuration:

```json
{
  "mcpServers": {
    "tools-portal": {
      "command": "node",
      "args": ["/path/to/release/mcp.mjs"],
      "env": { "PORTAL_STORAGE_PATH": "/path/to/storage" }
    }
  }
}
```

The native transport negotiates MCP versions 2024-11-05, 2025-03-26,
2025-06-18, and 2025-11-25 using `initialize`, then accepts
`notifications/initialized`. It supports `ping`, `tools/list`, `tools/call`,
`resources/list`, `resources/templates/list`, and `resources/read`.
Messages are newline-delimited JSON-RPC; stdout contains protocol messages only.
Stdin EOF, SIGINT, or SIGTERM cancels in-flight management requests and exits;
`notifications/cancelled` aborts an individual request. HTTP calls have a
five-second timeout. Local health responses are bounded to 64 KiB, downloaded PNGs
to 64 MiB, and MCP messages to 16 MiB so uploaded sheets fit the existing 12 MiB
HTTP body limit. There is no HTTP MCP listener.

Tools `discover` and `ops` accept `{}`. Tools `config`, `status`, and `stop`
accept `{}` or `{ "envFile": "/path/to/portal.env" }`, with no extra properties.
These tools invoke the same operations and return the exact CLI envelope in
both `structuredContent` and JSON text content; `isError` is the inverse of
`ok`. Tool failures are envelopes, while malformed JSON-RPC methods/params use
redacted protocol errors. Secrets and owner assertions remain environment-owned;
they are not arguments, resources, diagnostics, or results.

`portal://self` and `portal://operations` are read-only JSON resources exposing
the shared self-description and operation catalog. The catalog declares input
schemas, effects, transport availability, and MCP read-only/destructive/idempotent
annotations. `stop` is a destructive, capability-owned service operation, not a
read-only tool. `start` is intentionally CLI-only: foreground ownership cannot
be safely transferred to a detached process through this transport. MCP never
starts an unowned process and does not stop itself when it stops a portal.

## Reference mapping

This adapter design follows StyleGallery revision
`da33c0ad5f33f86d8748b811e3170772802e69c5`:
`scripts/agent-native/cli-adapter.mjs` supplies the shared invocation/JSON report
pattern; `scripts/agent-native/mcp-adapter.mjs` supplies tools, effect annotations,
and JSON resources; `scripts/compiler/operations.mjs` owns shared schemas;
`scripts/compiler/cli.mjs` and `scripts/compiler/mcp.mjs` compose thin transports;
`scripts/sg-server.mjs` supplies the stdio entrypoint and shutdown boundary.
The portal's MCP SDK was unavailable, so this implementation uses a native
transport rather than adding a dependency. The root session ran local REA 6.4.0
against the pinned snapshot and validated a hashed static graph of 399 sources
(evidence `ev_ca04ea7a9d47e1599101d1df6d7a46164450292d33dcebdebec0830b5eb01cd3`).
That static analysis has partial dynamic relations; it is not a claim of full
StyleGallery runtime analysis. Protocol references are the
[MCP lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle)
and [stdio transport](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports).

Focused verification after building:

```sh
bun run typecheck
bun test test/cli.test.ts test/mcp-management.test.ts test/release.test.ts
bunx biome check src/cli.ts src/management.ts src/mcp-server.ts src/build.ts test/cli.test.ts test/mcp-management.test.ts test/release.test.ts package.json
```
