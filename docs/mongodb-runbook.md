# MongoDB derived store runbook

MongoDB holds a **derived, read-only copy** of the lore corpus. The JSON documents under `lore/` are canon; the database is loaded from them and never the other way round.

- There is **no database-to-repository path**. Nothing in this repository reads MongoDB to write, regenerate or edit a lore file, a Markdown page or a generated artifact. A change made in the database is a mismatch to be overwritten by the next load, never a source.
- The build, `node scripts/gate.mjs` and every `npm run test:*` group run with no database. `npm run generate` and `npm run build` never import the loader. Publication uses the repository JSON artifacts only.
- The instance is **local only**. Bind it to `127.0.0.1`. Do not publish the port on another interface, open it in a firewall, or point the loader at a remote host. The loader refuses any `MONGO_URL` whose host is not the loopback interface.

## What is loaded

`scripts/mongo-load.mjs` discovers documents with the catalog admission code (`scripts/catalog-admission.mjs`) that the publisher uses: every published lore authoring JSON document. The non-published `authoring.example.json` samples, region data, name pools and the glossary dictionary are other data contracts and are not loaded.

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
- a locale title or the `en`/`ko` text of any content block is missing — `E_LOCALE`;
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

```sh
npm ci
MONGO_URL=mongodb://127.0.0.1:27017 npm run db:load            # load, then read back and compare
MONGO_URL=mongodb://127.0.0.1:27017 npm run db:load -- --check # compare only, no writes
MONGO_URL=mongodb://127.0.0.1:27017 npm run test:mongo-load    # round-trip test in a throwaway database
```

A good run ends with `OK: <n> repository document(s), <n> database record(s), 0 mismatch(es)`. Without `MONGO_URL` the round-trip test is skipped and the other `test:mongo-load` cases still run; `db:load` exits with a usage message.

## Back up and restore

The database can always be rebuilt from the repository with `npm run db:load`, so a backup is a convenience, not a canon copy. Keep dumps outside the repository.

```sh
mkdir -p "$HOME/backups/seoul-wiki-mongo"
docker exec seoul-wiki-mongo mongodump --db seoul_wiki_derived --archive --gzip \
  > "$HOME/backups/seoul-wiki-mongo/$(date +%Y%m%d).archive.gz"

docker exec -i seoul-wiki-mongo mongorestore --drop --archive --gzip \
  < "$HOME/backups/seoul-wiki-mongo/20260928.archive.gz"
MONGO_URL=mongodb://127.0.0.1:27017 npm run db:load -- --check
```

After a restore, run the `--check` command. A restored dump from an older commit fails the check; run `npm run db:load` to bring the records back to the current repository.

## Stop and clean up

```sh
docker stop seoul-wiki-mongo          # --rm removes the container
docker volume rm seoul-wiki-mongo     # only when the data is no longer wanted
```

Stopping the database never affects the build or the publication gate.
