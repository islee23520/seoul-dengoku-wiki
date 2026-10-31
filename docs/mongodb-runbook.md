# MongoDB derived store runbook

## Current status (2026-10-31): legacy diagnostic, not a PG export

PostgreSQL `wiki` is the operational authoring authority; private editorial/Soul records stay in `wiki_private`. The migrated tracked canonical SQLite has been removed. `lore/*.json` names are logical document/provenance identifiers, not source files to restore. MongoDB is never canon or a runtime publication input. See [current build/authoring](../README.md) and [deployment observations](../deploy/README.md#운영-전환-관측-2026-10-30).

`npm run db:load` remains registered, but `scripts/mongo-load.mjs` calls synchronous SQLite `approvedDocuments` and then reads each logical source path from the filesystem. It does not use the asynchronous PostgreSQL admission/typed reader. Therefore it cannot load the current PG-only corpus as written. Supplying an external `WIKI_DOCUMENT_DB` alone does not supply the removed JSON files. Do not run it as a current production sync or recreate canonical files to make it pass. A supported PG export requires a separately scoped code change; this documentation refresh does not implement one.

The remaining sections describe the retained loader and old local derived-store procedure, conditional on an authorized, complete legacy input snapshot outside the live authoring workflow. Preserve snapshot provenance and archived bytes. Do not infer current document counts, locale policy, approval or deploy success from an old Mongo dump.

- There is **no database-to-repository path**. Nothing in this repository reads MongoDB to write, regenerate or edit a lore file, a Markdown page or a generated artifact. A change made in the database is a mismatch to be overwritten by the next load, never a source.
- Normal `npm run generate` and `npm run build` use PostgreSQL public/private readers and never import the Mongo loader. They require their configured PG connections; “no database required” is not their contract. There is no active `test:mongo-load` npm script. Public publication is Korean-only; retained bilingual Mongo checks below do not impose simultaneous English authoring.
- The instance is **local only**. Bind it to `127.0.0.1`. Do not publish the port on another interface, open it in a firewall, or point the loader at a remote host. The loader refuses any `MONGO_URL` whose host is not the loopback interface.

## What is loaded

The retained `scripts/mongo-load.mjs` uses synchronous SQLite catalog admission (`scripts/catalog-admission.mjs`), then reads the selected authoring-envelope files. It excludes examples and non-authoring region/name-pool/glossary contracts. This is a legacy path, not the current publisher's asynchronous PostgreSQL input path.

| Item | Value |
|---|---|
| Database | `seoul_wiki_derived` (override with `MONGO_DB`) |
| Collection | `lore_documents` |
| Record key | `_id` = the envelope's document `id` (for example `DOC:Ailments`, `WNA-001`) |
| Record body | The envelope fields unchanged: `version`, `domain`, `id`, `slug`, `categories`, `status`, `tense`, `provenance`, `source`, `locales`, `content`, `data` |
| `derived` | Repository `source` path, `sha256` of the canonical serialization, `locales` present, `tense`, `publication` (= `status`), and `legal` / `consent` references when the envelope carries them |

Each load replaces every record by document ID (upsert) and deletes records whose repository document no longer exists. It then reads every record back and fails (exit code 1) when:

- a record's envelope does not serialize to the same canonical hash as the repository file (`canonicalJson` in `scripts/world-atlas-schema.mjs`, SHA-256) — `E_HASH`;
- the `derived` projection disagrees with the envelope — `E_PROJECTION`;
- either `en` or `ko` title is empty, or selected content/prose leaves lack either locale key (rule blocks are skipped; key presence is not a nonempty-text check) — `E_LOCALE`;
- `tense.en`, `tense.ko`, `locales.en.tense` and `locales.ko.tense` are not the same `past`/`present` value — `E_TENSE`;
- a repository document has no record (`E_MISSING`), a record has no repository document (`E_EXTRA`), or the record count differs from the document count.

## Version

Pin the server image to **`mongo:7.0.43`** (digest `sha256:9854f7139445d766a9523571d6f047530c45547460ffcf8259eb2bf4264632ca`). The Node.js driver is the `mongodb` devDependency in `package.json` (7.x), locked by `package-lock.json`. Change either pin in a pull request, and run the verification below with the new version before merging.

## Start a local instance

Use a named volume so the data survives container restarts:

```sh
docker volume create seoul-wiki-mongo
docker run --rm -d --name seoul-wiki-mongo \
  -p 127.0.0.1:27017:27017 \
  -v seoul-wiki-mongo:/data/db \
  mongo:7.0.43
```

Or keep the data in a local directory outside the repository:

```sh
mkdir -p "$HOME/.local/share/seoul-wiki-mongo"
docker run --rm -d --name seoul-wiki-mongo \
  -p 127.0.0.1:27017:27017 \
  -v "$HOME/.local/share/seoul-wiki-mongo:/data/db" \
  mongo:7.0.43
```

The `127.0.0.1:` prefix on `-p` is required. If port 27017 is taken, use another host port (for example `-p 127.0.0.1:27117:27017`) and change `MONGO_URL` to match.

## Load and verify

Only for an explicitly authorized legacy input snapshot containing both the external SQLite and its original envelope files; these are not working current-PG instructions:

```sh
npm ci --ignore-scripts
WIKI_DOCUMENT_DB=/absolute/external/snapshot.sqlite MONGO_URL=mongodb://127.0.0.1:27017 npm run db:load
WIKI_DOCUMENT_DB=/absolute/external/snapshot.sqlite MONGO_URL=mongodb://127.0.0.1:27017 npm run db:load -- --check
```

The loader resolves envelope files relative to this checkout, so the commands still fail when those original files are absent; setting the external DB path does not fix that incompatibility. Do not restore them in the current tree. The former `test:mongo-load` npm command was removed. A legacy successful load reports `OK: <n> repository document(s), <n> database record(s), 0 mismatch(es)`; this is not evidence for current PG publication. Missing `MONGO_URL` produces a usage error.

## Back up and restore

A dump is a derived legacy snapshot, never a canonical backup. Keep it outside the repository. It cannot be rebuilt from the current PG-only checkout with this loader. The following restore replaces the selected local Mongo database, so use it only for the intended disposable/legacy store, not an operational authority.

```sh
mkdir -p "$HOME/backups/seoul-wiki-mongo"
docker exec seoul-wiki-mongo mongodump --db seoul_wiki_derived --archive --gzip \
  > "$HOME/backups/seoul-wiki-mongo/$(date +%Y%m%d).archive.gz"

docker exec -i seoul-wiki-mongo mongorestore --drop --archive --gzip \
  < "$HOME/backups/seoul-wiki-mongo/20260928.archive.gz"
# Compare only when the complete matching legacy inputs are available (see above).
WIKI_DOCUMENT_DB=/absolute/external/snapshot.sqlite MONGO_URL=mongodb://127.0.0.1:27017 npm run db:load -- --check
```

After a restore, compare against the matching authorized legacy snapshot. An older dump is not current because `--check` passes against its old inputs. Do not run a load to overwrite it from missing/current logical paths or treat it as a PostgreSQL backup. Preserve any required archive before removing a volume.

## Stop and clean up

```sh
docker stop seoul-wiki-mongo          # --rm removes the container
docker volume rm seoul-wiki-mongo     # only when the data is no longer wanted
```

Stopping the database never affects the build or the publication gate.
