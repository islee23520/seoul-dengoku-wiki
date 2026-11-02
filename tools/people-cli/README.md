# People originals CLI

Private TypeScript tool for exact wiki detail JSON, portrait-token JSON and PNG byte preservation. It uses a separate SQLite database; importing a six-person subset never replaces the existing people snapshot or deletes unrelated records.

## Commands

Build locally with `pnpm run build`. Run `node dist/cli.js --help`, or invoke the private compiled `people-originals` executable. Public binary installation and Windows/Linux execution are not yet verified; no public source package is distributed.

```sh
people-originals import /path/to/manifest.json --db /path/to/originals.sqlite
people-originals get person-1003 --db /path/to/originals.sqlite
people-originals export person-1003 --kind image --output /path/to/original.png --db /path/to/originals.sqlite
people-originals export person-1003 --kind token --output /path/to/old-token.json --db /path/to/originals.sqlite --revision 1
```

`--db` is required: no repository-relative default or automatic network fetch occurs. Get/export open an existing database read-only. Export refuses to overwrite an existing output file. Expected input/file/database failures exit 1 with a single diagnostic; help exits 0.

## Import manifest

A closed manifest contains `people`, an array of records with `personId`, `characterId`, `name`, `detail`, `token`, and `image`. Each payload descriptor has exactly `url`, `path`, and lowercase SHA-256 `sha256`. Payload paths are relative to the manifest directory; absolute paths and parent traversal are rejected.

The operator supplies the source URLs and expected hashes. The tool reads exact bytes, checks all three digests, verifies detail and token identity, and checks the token image digest against the PNG bytes. Detail identity uses `id`, `name`, `detailRoute` and `familyTree.personId`; token identity uses `personId`, `characterId`, `name` and `image.sha256`. Original token `generationContract` and `slots` remain inside the preserved raw JSON. No numeric seed, owner approval, release approval or new artwork is inferred.

All payload validation completes before the import transaction. A failure leaves imported rows unchanged. Detail, token and image revisions are retained independently by source hash and monotonic first-insertion sequence. Repeated identical imports do not add history rows, but each accepted import selects its detail, token and image together as the current tuple, including when a payload reuses an older hash. The selected current tuple is distinct from the highest sequence in each independent history. On an existing store, opening the writable import store additively backfills the selection from the latest token revision and that token's bound image; no history rows are changed and existing histories are preserved. Versionless sidecars created before current-tuple selection require this writable migration before read-only `get` or default `export`. If a read reports `MIGRATION_REQUIRED`, run `people-originals import <validated-manifest> --db <path>`; this validates and imports the manifest while additively creating/backfilling the selection table. Read-only commands never migrate or mutate schema. A missing selection for an existing person is treated as corrupt rather than guessed from a highest-sequence revision. `--revision` selects a retained positive history sequence independently of current selection. Historical source bytes are not normalized or reserialized.

## Verification

Older sidecars without `current_originals` require an explicit writable migration before default `get` or `export`. Read-only commands exit with `MIGRATION_REQUIRED` and do not alter the schema. Run `people-originals import /path/to/validated-manifest.json --db /path/to/originals.sqlite` with independently verified source bytes to initialize the selected tuple while preserving existing history. Explicit `--revision` exports remain available for retained history; do not rebuild or delete the database to migrate it. A missing current pointer for an existing person is reported as store corruption instead of selecting unrelated highest-sequence payloads.

```sh
pnpm run build
bun test
pnpm run typecheck
pnpm run lint
```

Tests use synthetic original payloads and temporary databases. Actual original data, databases, credentials and QA evidence belong outside the committed package. Hash checks establish byte integrity, not semantic truth or source approval. The current macOS proof does not establish behavior on other operating systems.
