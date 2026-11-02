# Private portrait generator

Independent TypeScript portrait preflight and one-request image transport. This package is under validation; no public download or Windows/Linux runtime installation is claimed. Source and operator data stay private.

```sh
pnpm run build
pnpm run compile
node dist/cli.js --help
portrait-generator preflight --input /path/to/manifest.json --pins /path/to/operator-pins.json
portrait-generator generate --input /path/to/manifest.json --pins /path/to/operator-pins.json --connection /path/to/connection.json --request-id unique-request-id --output /path/to/new-candidate.png
portrait-generator generate-reviewed --input /path/to/manifest.json --pins /path/to/next-operator-pins.json --connection /path/to/connection.json --request-id next-unique-request-id --output /path/to/next-candidate.png --previous /path/to/previous-terminal.json --review /path/to/previous-review.json --profile /path/to/operator-profile.json --profile-sha <profile-file-sha256> --measurement /path/to/previous-measurement.json --position-reference /path/to/operator-position-authority.json
```

`preflight` reads exact rule, position-reference, look and ordered reference-image bytes, verifies separately supplied operator pins, and emits validated conditions plus projection hashes without dispatch. `generate` uses the same preparation and makes one multipart edit request with the fixed image model `gpt-image-2.5-sunburst`. Remote connections require HTTPS and a nonempty environment-sourced key. Unauthenticated loopback is enabled only with explicit `allowUnauthenticated: true`; authenticated loopback may use an environment key.

`pnpm run build` type-checks/emits the modules and bundles the registered Node CLI into `dist/cli.js`, including the acceptance runtime. Build the sibling acceptance package before installing the generator's development dependencies; its `file:../acceptance` dependency is a private development/build input only. Pack with `npm pack` after building, then install that authorized local archive in the consumer with `npm install /path/to/portrait-generator-preflight-0.1.0.tgz`. The installed `portrait-generator` requires Node.js 24+ and explicit operator input paths, but no sibling acceptance checkout. The private archive includes emitted JavaScript and installer scripts, not source/tests or host-specific compiled binaries. No public package publication is authorized or claimed.

`pnpm run compile` builds the registered CLI into `dist/portrait-generator` for the build host. This executable includes its runtime dependencies and can run without the sibling acceptance package or a Node installation. Actual Windows/Linux execution, checksummed installers and external downloads remain separate verification work.

`pnpm run compile:installer` builds `dist/portrait-install`. Run it with `--url <https-binary-url> --sha256 <independently-verified-sha256> --destination <new-file-path>`. It verifies the full download before creating an executable destination and refuses existing destinations, redirects, failed downloads and checksum mismatches. Success emits installation JSON; expected failures exit 1 with a stable diagnostic. `--allow-local-http` is limited to explicit loopback QA. The parent destination directory must already exist. This command is not yet a published curl bootstrap; use only reviewed executable URLs and hashes. A matching checksum establishes byte identity, not publisher authorization.

`install.sh` is a POSIX download bootstrap accepting `--installer-url`, `--installer-sha256`, `--url`, `--sha256` and `--destination`. It uses curl and shasum/sha256sum to verify the standalone installer before executing it. `install.ps1` provides the corresponding native PowerShell parameters `-InstallerUrl`, `-InstallerSha256`, `-Url`, `-Sha256` and `-Destination`, using SHA256 verification before execution. Both require explicit, independently verified hashes and remove bootstrap temporary files. Loopback HTTP requires the QA-only opt-in (`--allow-local-http` or `-AllowLocalHttp`). Neither script chooses a release endpoint or modifies PATH.

Actual local macOS, Linux x64 and Windows x64 installation checks have exercised the compiled binaries; Linux curl and native Windows PowerShell bootstrap checks also passed. Linux/Windows checks cover installation and executable help, not generated-image quality or their complete generation/review workflow. External release URLs are not published yet. Build and release each platform's matching executable; a host build is not a cross-platform binary.

`generate` is an explicit first-candidate operation: it does not validate prior terminal evidence or authorize serial continuation. Use `generate-reviewed` to request exactly one next candidate after `dispatchAfterBatchReview` validates the previous terminal, exact image-bound review and evidence, separately selected proportion profile and its file SHA-256, measured image evidence, and position authority. Position authority JSON is a closed object containing exactly `referenceVersion`, `referenceSHA`, and `ruleSHA`. The previous terminal's recorded output path is used to bind the reviewed image.

The `--pins` argument for `generate-reviewed` must identify independent operator pins for the *next* source inputs; previous-batch review/profile/authority values do not supply or derive those pins. The acceptance gate runs before connection validation and before output/request/receipt files are created. A hold prints only its stable code to stderr and exits 1. An accepted previous batch is not an approval of the next generated image; the new output remains `candidate-unreviewed` and must undergo its own review before another advancement. Until this reviewed path is validated in the operating batch, keep the batch paused.

The input manifest contains `rule`, `reference`, and `look` descriptors with relative `path`, ordered `referenceImages` with `id`, `role`, `path` and appropriate role annotations, and `composition`. The separate operator pins file contains rule/reference/look SHA-256 and ordered image ID/hash pairs. Absolute paths and parent traversal in artifact descriptors are rejected. Pins select immutable inputs; they do not establish owner approval merely by matching bytes.

Connection JSON has `baseUrl`, optional `apiKeyEnv` naming a process environment variable, and optional `allowUnauthenticated`. It does not contain a literal API key. Credentials are not included in the projection or request evidence; a key appearing in authored prompt content is rejected.

Position input retains the existing exact rational `position-reference.v2` authority and its twelve metrics, not a new numeric reference. The pure preflight validates identity, reference hashes and metric agreement, not generated-pixel anatomy or face quality. Projection requires complete authored slots, preserves canonical metadata and unknown null values, and ships exact CRLF text bound to its digest.

Before dispatch, an exclusive `.request.json` beside the output records the request ID, projection, hashes and ordered image bytes. Success writes the original PNG bytes and `.receipt.json` marked `candidate-unreviewed`. HTTP failures, malformed responses and network uncertainty retain request evidence and record the observed status where available. Existing request evidence forbids implicit repetition; existing output files are not overwritten. No automatic retry occurs. Request and receipt files contain private source imagery and must not be published with release artifacts.

Transport checks PNG format/CRC/portrait dimensions/decoded scanline integrity. This is not semantic acceptance. The independently implemented portrait-acceptance tool must still review actual output evidence and measured proportions before production advancement. A local test-server PNG proves transport behavior only, not image-provider quality or output approval.

```sh
pnpm run build
bun test
pnpm run typecheck
pnpm run lint
```

Real provider image generation, multi-platform installers and external binary publication follow only after their own verification and authorization. Production historical assets and K060/K105 no-repeat constraints remain separate from synthetic local transport tests.
