# DESIGN-STORE KNOWLEDGE BASE

## OVERVIEW
SQLite store for GDD design documents; score 11, distinct design domain (own schema, dense exports, dedicated npm script). LORE reader content is published only through `/wiki` and is not duplicated here.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Store library and CLI | `mda-store.mjs` | `validateDocument`, `putDocument`, `ingestCanonDir`, `exportDocumentPage`/`exportCanonPage`/`exportIndexPage`, `verifyStore` |
| Schema | `schema.sql` | `SCHEMA_VERSION = 3`; loaded by `openSchema` |
| Instance catalogs | `instances/catalog.json`, `instances/janseon-core.json` | Seeded store instances |
| One-shot seed and export | `seed-from-canon.mjs` | Ingests a canon dir, puts documents, renders HTML pages |
| Tests | `test-mda-store.mjs` | `node --test`; wired as npm `test:mda-store` |

## CONVENTIONS
- Storage is `node:sqlite` `DatabaseSync` with zero npm dependencies; `mda-design-store.sqlite` sits beside its `mda-design-store.receipt.json`.
- Documents validate before put: `id`, `title`, `onePage` (title/audience/pictureNote/panels with heading+body+sourcePath), non-empty `mechanics`/`dynamics`/`aesthetics`.
- Instance rows and ingested canon files use GDD-owned sources only. Do not point one-page design documents at `LORE/` reader pages.
- `AESTHETIC_KINDS` is exactly the 8 Hunicke/LeBlanc/Zubek kinds (Sensation … Submission), matching `../../skills/mda-framework/SKILL.md`.
- `SECTION_ORDER` fixes the 8 Korean section names (제품 … 구현); ordering is canonical.
- `openSchema` on a store whose `user_version` is below 3 DROPs every table and re-creates the schema — stale stores are wiped, not migrated.
- `verifyStore` re-checks the DB against the receipt and sources; exit code 1 on failure.

## COMMANDS
From repository root; `--db`/`--out`/`--id`/`--json` select paths.
```bash
npm --prefix TOOL/tools run test:mda-store
node TOOL/tools/design-store/mda-store.mjs put --db <db> --json <document.json>
node TOOL/tools/design-store/mda-store.mjs verify --db <db>
node TOOL/tools/design-store/mda-store.mjs export --db <db> --out <html> --id <docId>
node TOOL/tools/design-store/mda-store.mjs export-index --db <db> --out <html>
```

## ANTI-PATTERNS
- Do not write the SQLite file directly; `putDocument` owns validation and receipt hashing.
- Do not store aesthetics kinds outside the 8, or reorder sections away from `SECTION_ORDER`.
- Do not point tooling at an old-version store expecting a migration; opening it wipes the data.
- Do not treat a missing receipt or failed `verifyStore` as a healthy store.
- Do not re-publish LORE prose or world pages through the design store. World lore has one public owner: `/wiki`.
