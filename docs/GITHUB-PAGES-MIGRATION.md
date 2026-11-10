# GitHub Pages migration protocol

Seoul Metro Dynasties (wiki + GDD) is public, so it is served as a static site from GitHub Pages instead of the WSL stack
(`seoul-wiki-api` :18787, `seoul-wiki-documents` :18788, `seoul-wiki-migrate.timer`, `cloudflared-seoul`, `linalab-seoul-postgres` :15433, nginx :18090).

## 0. Source of truth (changed 2026-11-10)

`data/sql/*.sql` is now the standalone source of truth for the public site. The build needs no PostgreSQL, no `src/generated/`, and no environment variables other than the optional `SITE_*` ones. Verified from a clean checkout with every `PG*`, `WIKI_*` and `DATABASE_URL` variable removed:

```
cd site && npm ci --ignore-scripts
node site/build.mjs        # built ... wiki 59, gdd 129, factions 4, states 16, people 1022
node site/check-site.mjs   # OK
```

From now on, edit the SQL files (or run a reviewed script over them) in a pull request. `scripts/pages/export-sql.mjs` is the one-time exporter that produced them from the old PostgreSQL projection; it is kept as a record and is not part of any routine. Re-running it would overwrite SQL-side edits with the old database state, so do not run it unless the owner decides to resync from PostgreSQL.

## 1. Target architecture

```
PostgreSQL wiki (authoring, stays private)
   | npm run generate            (existing release pipeline -> src/generated/**)
   v
node scripts/pages/export-sql.mjs      public projection only, English only
   v
data/sql/*.sql                         RAW DATA, committed to Git (the source for Pages)
   v
node site/build.mjs                    loads data/sql into in-memory SQLite, renders HTML
   v
dist-pages/  --(.github/workflows/pages.yml)-->  https://<owner>.github.io/seoul-dengoku-wiki/
```

- GitHub Pages never sees PostgreSQL or any credential. The DB credential stays on the owner host; CI only receives SQL text that is already public.
- Data files are portable SQL (`000-schema.sql` plus `INSERT` files). They load into SQLite (build) and PostgreSQL (`psql -f`).
- Default and only language is English; the export fails (`E_I18N_MISSING`) if any Korean string has no English entry in `scripts/pages/i18n-ko-en.json`.

## 2. Public / private boundary

Exported: `wiki` projections already approved for public output (world articles, states, people roster, update history) and the GDD canon.
Never exported: `wiki_private.*`, `.omo/`, `src/generated-private/`, soul/profile evidence, credentials, DSN files.
Check before every commit: `grep -rIl -e wiki_private -e PGPASSWORD -e postgresql:// data/sql` must print nothing.

## 3. Routine data update

1. Edit `data/sql/*.sql` on a branch (text edits, or a reviewed script that rewrites the affected rows).
2. `node site/build.mjs && node site/check-site.mjs` (no database needed).
3. Open a PR to `main`; the owner merges. Merging triggers the Pages workflow (build, link/Hangul check, deploy).
4. English text lives in the `*_en` / non-`_ko` columns. When Korean text changes, update the English column in the same row.

## 4. Cutover from WSL hosting

Order matters; one tunnel connector and one DB writer at a time.

1. Enable Pages: repo Settings > Pages > Source = GitHub Actions. Merge the PR containing `.github/workflows/pages.yml`; confirm the run is green and the site answers 200.
2. Optional custom domain: add `CNAME` in Pages settings and a DNS CNAME to `<owner>.github.io`. Set repository variable `SITE_BASE=/` if the site is served at a domain root (the workflow derives the base from `configure-pages`).
3. Take a final backup before touching the stack: `pg_dump -Fc` of the Seoul DB (`:15433`) to the owner backup location, plus a copy of `/etc/linalab/secrets/seoul-wiki*` (kept outside the repo).
4. Switch public traffic: point DNS for the public name at GitHub Pages (or retire the `sss` hostname in Cloudflare). Only then stop `cloudflared-seoul` (tunnel `5d1727c8`).
5. Stop, do not delete, in this order: `seoul-wiki-migrate.timer`, `seoul-wiki-documents`, `seoul-wiki-api`, nginx Seoul vhost (:18090). Keep `linalab-seoul-postgres` running (it remains the private authoring DB) unless the owner retires authoring too.
6. `.woodpecker/deploy.yaml` (the deploy-request lane to the retired WSL controller, target `seoul-wiki`) is removed; Pages deploys come from GitHub Actions only. `.woodpecker/ci.yaml` is unrelated to Pages and stays.
7. Update `E:\git\AGENTS.md` registry and `infra/services/linalab.json` in the same change that stops the units.

## 5. Ownership

- Migrations and the DB credential: owner host only (`seoul-wiki-migrate` timer replaced by manual `npm run generate` + export). CI never receives the DB credential.
- Pages deploy: GitHub Actions (`GITHUB_TOKEN`, `pages: write`).

## 6. Rollback

WSL units stay installed (stopped) until the owner confirms. Rollback = start `linalab-seoul-postgres` (if stopped), `seoul-wiki-api`, `seoul-wiki-documents`, nginx, then `cloudflared-seoul` last; point DNS back. Never run two tunnel connectors or two DB writers concurrently. To roll back only the site content, revert the `data/sql` commit and re-run the workflow.

## 7. Database restore (if the Seoul DB moves)

`pg_restore -d wiki --clean --if-exists seoul-wiki.dump` on the new owner host, then re-grant `wiki_reader` (`GRANT USAGE ON SCHEMA wiki; GRANT SELECT ON ALL TABLES IN SCHEMA wiki TO wiki_reader`). The public site does not need the DB.

## 8. Verification

`node site/build.mjs && node site/check-site.mjs` (SITE_BASE defaults to `/seoul-dengoku-wiki/`). The check fails on Hangul in rendered text, missing site title, and any broken internal link or fragment.
