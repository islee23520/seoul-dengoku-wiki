# Potrait Generator Asset Workspace

This directory is the working source of truth for portrait asset inventory and evaluation. The folder name intentionally follows the requested `potrait-generator` spelling.

`Design/potrait-generator/` now contains both the published browser surface and the asset database workspace. The public path is `/potrait-generator/`.

`config/workspace.json` binds the local working name, evidence root, SQLite path, generated views, and published browser source without duplicating the asset tree.

## Data model

- `content_objects`: one row per SHA-256 byte identity.
- `asset_paths`: every exact evidence path, classified as raw, work, review, receipt, or runtime.
- `evaluations`: scoped PASS, REJECTED, PENDING, or SUPERSEDED claims from evidence receipts.
- `properties`: asset properties such as sex, slot, stage, dimensions, and color type.
- `file_cache`: path/size/mtime cache that avoids hashing unchanged files.
- `derived_cache`: content-addressed cache records for future composites and masks.
- `raw_objects`: verified read-only copies stored once per SHA under `raw/sha256/`.
- `gate_evaluation_claims`: append-only exact subject/source/receipt bindings for each Gate 1–3 check.

Original evidence files are not moved or deleted. `ingest-raw` creates byte-exact copies of every catalogued file in `raw/sha256/<prefix>/<sha256>`; duplicate paths share one stored object. Extensions and original filenames stay in SQLite. Raw copies do not hardlink the originals. JSON views under `views/` act as searchable folders over the SQLite database.

- `curatedPassed-assets.json`: exact manually bound, scope-limited starting points. A source-quality or Gate 1 fact is not production approval.
- `passed-assets.json`: structured current claims, useful for investigation but not automatic promotion. Legacy inferred claims remain history only.

The requested folder name is spelled `potrait-generator`; do not silently rename it.

## Commands

```bash
node Design/potrait-generator/src/cli.mjs scan
node Design/potrait-generator/src/cli.mjs ingest-raw
node Design/potrait-generator/src/cli.mjs verify-raw
node Design/potrait-generator/src/cli.mjs seed-gates
node Design/potrait-generator/src/cli.mjs gates --sex female --slot face_base
node Design/potrait-generator/src/cli.mjs prepare-work
node Design/potrait-generator/src/cli.mjs record-foundations
node Design/potrait-generator/src/cli.mjs index-slot-reviews
node Design/potrait-generator/src/cli.mjs slot-reviews --sex male --slot eyes_white
node Design/potrait-generator/src/cli.mjs stats
node Design/potrait-generator/src/cli.mjs query --status PASS --curated --sex female --slot face_base
node Design/potrait-generator/src/cli.mjs duplicates
node Design/potrait-generator/src/cli.mjs history --path .omo/evidence/portrait-stage23/gate2-female-foundation-source/gate1-split/final/slots/face_base.png
node Design/potrait-generator/src/cli.mjs cache-put --key <content-addressed-key> --producer <tool> --inputs '<json>' --output-sha <sha256>
node Design/potrait-generator/src/cli.mjs cache-get --key <content-addressed-key>
```

`query` returns raw/work image assets by default. Add `--curated` for explicit exact-path decisions in `config/asset-decisions.json`. Add `--all-types` only when receipt, document, or script records are also needed.

## Incremental workflow

1. Scan before authoring. The scan covers `.omo/evidence` and the existing `work/` directory, never the raw vault or database itself.
2. Query exact sex/slot assets and inspect their receipt authority.
3. Reuse identical SHA assets instead of copying or regenerating them.
4. Materialize the scoped starting assets from raw into `work/selected/<sex>/<role>/<sha>.<ext>`. Existing edited working copies are never overwritten. Derive new work in a separate package; preserve raw inputs.
5. Add an explicit review receipt; rescan to update the effective state. Reviews are append-only and become stale when their subject or receipt bytes change.
6. Check `gates` before promotion. Source quality, numerical verification, and historical PASS are separate facts; Gate 2/3 are not inferred from Gate 1.

## Contract progression

1. Gate 1: actual source-relative split/reconstruction proof, exact RGBA comparison and source ownership review.
2. Gate 2: slot semantic ownership, hidden surfaces and same-sex exchange checks.
3. Gate 3: actual combinations, browser/offline parity and visual review of the current output.

`seed-gates` imports only the narrow scopes declared in the config. A frozen legacy split retains its own historical schema; slot count is not a fixed design prerequisite. The current eye construction requires white below iris/pupil below eyelid/brow lines.

To verify the existing female and male source partitions without re-authoring them:

```bash
node Design/potrait-generator/src/verify-foundations.mjs --live
```

The report stays under `work/foundation-baseline/` and explicitly grants no Gate 2/3 credit. The original anime target and each bald foundation are distinct source identities.

After verification, `scan` indexes the new report and `record-foundations` registers only its exact Gate 1 reconstruction checks. `work/gate2-readiness/matrix.json` keeps the existing source and receipt hashes for fourteen sex/slot scopes; `index-slot-reviews` stores these bounded evaluations without turning sample acceptance into Gate 2 PASS. Use `slot-reviews` to inspect the blockers before authoring again.

## Public boundary

Stage the browser with `node Tool/art/portrait/stage-potrait-generator.mjs`. Only browser modules and `assets/` enter `/potrait-generator/`; raw, SQLite, work, config, views and cache are excluded. The old URL is not a compatibility alias. Deployment must use the existing `seoul-kenshi` project only.

## Known authoritative bases

The manually curated exact bindings live in `config/asset-decisions.json`. Current foundation starting points are:

- Female raw body: `.omo/evidence/portrait-stage23/gate2-female-foundation-source/provider/attempt01/provider-raw.png`
- Female Gate 1 face base: `.omo/evidence/portrait-stage23/gate2-female-foundation-source/gate1-split/final/slots/face_base.png`
- Male raw body: `.omo/evidence/portrait-stage23/gate2-male-foundation-source/provider-gpt-image.png`
- Male Gate 1 face base: `.omo/evidence/portrait-stage23/gate2-male-foundation-source/gate1-split-v2/final/slots/face_base.png`
- Legacy female hidden-skin donor: `.omo/evidence/portrait-retouch-20260914/skin-clean.png` (`PENDING`, not promoted)

These statuses are scoped. Gate 1 PASS does not imply Gate 2 hidden-surface acceptance.

Transport success, provider completion, and numeric checks do not imply visual acceptance. Conflicting current decisions fail closed; curator annotations do not erase owner rejection.
