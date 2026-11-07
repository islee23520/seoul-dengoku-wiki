# Public snapshot contracts

No first snapshot is included here. The owner reviews the first full host export
in a later projection PR. `renders/.gitkeep` and this schema document are source
documentation, not generated inventory entries.

`project-public-snapshot.mjs --out DIR --code-ref SHA [--check] [--scratch-only]`
produces `DIR/db/seeds`, `DIR/renders`, and the public receipt below. The producer
SHA must equal the executing checkout HEAD. `--scratch-only` additionally requires
the real connected database name to match `seoul_scratch_[a-z0-9_]+`. It does not
replace private generation inputs with public seeds. `--check` rebuilds under a
single snapshot and compares against the existing destination without promoting.

## Public receipt: db/provenance/public-snapshot.json

Exactly these fields are allowed (no ledger, credentials, database identity,
snapshot ID, private receipt hash, run ID, or host path):

```json
{
  "format": "wiki-public-snapshot/1",
  "producerCodeRef": "<40 lowercase hexadecimal Git SHA>",
  "producedAt": "<producerCodeRef Git commit timestamp, ISO-8601>",
  "seedManifestSha256": "sha256:<64 lowercase hexadecimal characters>",
  "renderManifestSha256": "sha256:<64 lowercase hexadecimal characters>",
  "checkedBuildArtifactDigest": "sha256:<64 lowercase hexadecimal characters>"
}
```

Manifest hashes cover the exact UTF-8 manifest file bytes, including trailing LF.
The artifact digest covers UTF-8 `JSON.stringify(entries)`, with entries sorted by
relative dist path and each entry `[path, sha256(fileBytes)]`. Dist bundles are
not copied into the snapshot. `producedAt` is exactly the output of
`git show -s --format=%cI <producerCodeRef>` (trimmed). It is not wall-clock run
time. Two independent exports with the same SHA and content have byte-identical
public receipts, seeds, and render manifests; no previous receipt is required.

## Protected host receipts

`WIKI_PROJECTION_HOST_RECEIPT_FILE`, when set, must resolve outside the checkout
and output root. On success only, it is atomically replaced with mode 0600 and
exactly `{ "ledgerDigest": "sha256:<64hex>", "producerCodeRef": "<40hex>" }`.
This is P4's `<projection-state>.receipt.json` sidecar and must never be committed.
The private `src/generated-private/projection-run-receipt.json` additionally has
`runId` (UUID string) and `timers: { totalMs: integer }` for host diagnosis.

`ledgerDigest = "sha256:" + SHA256(UTF8(sortedAppliedMigrationHashes.join("\n")))`.
Sort lowercase 64-hex SQL hashes lexicographically; do not append a final LF.
Duplicate hashes fail. Before hashing, applied `(hash, created_at)` rows must
match the local drizzle journal `(SHA256(SQL bytes), when)` chain exactly.
The coordinator does not write projection-state itself. Its returned
`seedManifestSha256` and `renderManifestSha256` always use the `sha256:` prefix
required by the refresh wrapper and approve/seal checks.

## Render inventory: renders/manifest.json

Format `wiki-renders/1` has `files`, `routes`, and sorted `documentRoutes`.
Each file is `{path, source, storage, mode, sha256, bytes}`: path is relative to
`renders`, source is a repository-relative generator input/output path or null
for generated review Markdown, storage is `snapshot` or `tracked`, mode is
`100644`, sha256 is bare lowercase 64-hex, and bytes is the exact byte count.
Tracked public assets are referenced in place, not duplicated. Their path starts
with `public/`. Generated frontend paths map `src/generated/` to `generated/`.

Each route is `{route, kind, files}`. Kind is `document`, `person`, `map`, or
`category`; files contains inventory paths. Document routes are the shared
catalog publication predicates plus the API's registration/identity checks.
Category-valid drafts remain public. Review Markdown uses the generator's actual
`reviewText`, which is produced by the shared renderer. All generated public
outputs must be in the release ownership inventory and artifact allowlist;
generated frontend imports have a narrow path/extension boundary. Private
outputs, server files, source maps, and `.omo` evidence are never copied.

`check-render-snapshot.mjs --snapshot DIR --seeds DIR [--root CHECKOUT]` validates
hashes, bytes, exact file inventory, all document route/body/review mappings,
public contract/publication routes, dangling world links, and private sentinels.
It reports file count, total bytes, largest file, route coverage, and leaks.
Offline checking proves the recorded public projection; only full host export
re-evaluates the oracle against the live snapshot. Seed-only public scratch
roundtrips omit admission closure because that metadata is intentionally absent.

Promotion is recoverable at command boundaries, not a cross-directory filesystem
transaction. A root `.promote-pending.json` blocks consumers during replacement;
an interrupted export leaves it in place. A complete subsequent export replaces
every file and sweeps prior owned outputs before removing the journal. Seed
export retains its separate seed promotion journal and deterministic PK ordering.
