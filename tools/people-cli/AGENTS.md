# PEOPLE-CLI KNOWLEDGE BASE

## OVERVIEW
Private TypeScript CLI `people-originals` preserving exact wiki person detail/token/image bytes in its own SQLite store; score 8, distinct packaging domain (own tsc/biome/bun toolchain, Node >=24, zod).

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| CLI entry and parsing | `src/cli.ts` | `main`, `parseArgs`, `loadManifest`, `execute`, `TypedCliError` |
| Store and zod schemas | `src/store.ts` | `ManifestSchema` family, `importOriginals`, `openOriginalsStore`, `readOriginalJson`, `readOriginalImage` |
| Current-tuple selection | `src/current-selection.ts` | `initializeCurrentSelection`, `writeCurrentSelection`, `readSelectedRevision` |
| Binary | `dist/cli.js` via package `bin` | Build first: `pnpm run build` |
| Contract details | `README.md` | Authoritative manifest, verification and migration contract |

## CONVENTIONS
- Separate package: `pnpm run build` (tsc), `bun test`, `pnpm run typecheck`, `pnpm run lint` (biome). Not wired into the parent `npm --prefix TOOL/tools` scripts.
- `--db` is always required; `get`/`export` open an existing database read-only; export refuses to overwrite an existing output file.
- Import validates all three payload SHA-256 digests plus detail/token identity before the transaction; a failure leaves imported rows unchanged.
- Historical source bytes are never normalized or reserialized; detail/token/image revisions are retained independently by source hash and monotonic first-insertion sequence.
- `MIGRATION_REQUIRED` on read: run `people-originals import <validated-manifest> --db <path>`; never rebuild or delete the database to migrate. Read-only commands never migrate.
- A missing current-tuple selection for an existing person is corruption, not something to guess from a highest-sequence revision.
- Actual original data, databases, credentials and QA evidence stay outside the committed package; public binary install and Windows/Linux execution are unverified.

## COMMANDS
```bash
pnpm --dir TOOL/tools/people-cli run build
bun test TOOL/tools/people-cli/test
pnpm --dir TOOL/tools/people-cli run typecheck
pnpm --dir TOOL/tools/people-cli run lint
node TOOL/tools/people-cli/dist/cli.js --help
node TOOL/tools/people-cli/dist/cli.js import <manifest.json> --db <originals.sqlite>
node TOOL/tools/people-cli/dist/cli.js get person-1003 --db <originals.sqlite>
node TOOL/tools/people-cli/dist/cli.js export person-1003 --kind image --output <png> --db <originals.sqlite>
```

## ANTI-PATTERNS
- Do not assume a repository-relative default database or automatic network fetch; neither exists.
- Do not infer owner approval, release approval or new artwork from hash checks; they establish byte integrity only.
- Do not import without an operator-validated manifest to bypass the `MIGRATION_REQUIRED` path.
- Do not treat the macOS proof as cross-OS verification.
