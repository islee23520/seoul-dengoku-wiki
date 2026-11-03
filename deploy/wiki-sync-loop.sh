#!/bin/sh
# Host seed-sync applier loop (deploy/docker-compose.wiki-sync.yml).
# Follows main of the public wiki repository and applies only seed changes that
# were merged through a pull request carrying db/seeds/.sync-request.json
# (docs/repo-edit-apply-path.md, owner decisions D1-D10, 2026-11-03). Runs
# inside the compose network where wiki-postgres is reachable; credentials
# arrive via environment. Humans never write to the production database.
#
# Per cycle:
#   1. fetch main, checkout db/ scripts/ package.json only (like wiki-migrate).
#   2. rotate the wiki_sync_writer password from WIKI_SYNC_WRITER_PASSWORD
#      (migration 0001 creates the LOGIN without a password; it lives nowhere
#      in the repository).
#   3. if the merge marker exists: pg_dump once (D4), then
#      seed:sync --apply as wiki_sync_writer in a single transaction.
#   4. weekly: seed:sync --drift dry-diff into /state (D8).
set -eu

REPO_URL="${WIKI_SYNC_REPO_URL:-https://github.com/islee23520/seoul-dengoku-wiki.git}"
BRANCH="${WIKI_SYNC_BRANCH:-main}"
INTERVAL="${WIKI_SYNC_INTERVAL:-300}"
WORK="${WIKI_SYNC_WORK:-/wiki}"
DEPS="${WIKI_SYNC_DEPS:-/deps}"
STATE="${WIKI_SYNC_STATE:-/state}"
DRIFT_SECONDS="${WIKI_SYNC_DRIFT_SECONDS:-604800}"
PGHOST="${PGHOST:-wiki-postgres}"
PGPORT="${PGPORT:-5432}"
PGDATABASE="${PGDATABASE:-seoul}"

mkdir -p "$WORK" "$DEPS" "$STATE"
if [ ! -d "$WORK/.git" ]; then
  git clone --filter=blob:none --no-checkout "$REPO_URL" "$WORK"
fi
if [ ! -d "$DEPS/node_modules" ]; then
  npm install --prefix "$DEPS" --no-audit --no-fund --ignore-scripts "pg@8.16.3"
fi
[ -e "$WORK/node_modules" ] || ln -s "$DEPS/node_modules" "$WORK/node_modules"
# pg_dump (D4) is not part of the node image.
if ! command -v pg_dump >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y -qq --no-install-recommends postgresql-client
fi

WRITER_URL="postgres://wiki_sync_writer:${WIKI_SYNC_WRITER_PASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}"
OWNER_URL="postgres://wiki_owner:${WIKI_POSTGRES_PASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}"

LAST_DRIFT=0
[ -f "$STATE/last-drift" ] && LAST_DRIFT=$(cat "$STATE/last-drift")

rotate_writer_password() {
  printf "ALTER ROLE wiki_sync_writer LOGIN PASSWORD '%s';\n" "$WIKI_SYNC_WRITER_PASSWORD" \
    | psql "$OWNER_URL" -X -q -v ON_ERROR_STOP=1 >/dev/null
}

while :; do
  if git -C "$WORK" fetch --quiet origin "$BRANCH" \
     && git -C "$WORK" checkout --quiet --force "origin/$BRANCH" -- db scripts package.json; then
    MERGE_SHA=$(git -C "$WORK" rev-parse "origin/$BRANCH")
    if rotate_writer_password; then
      :
    else
      echo "wiki-sync: writer password rotation failed at $(date -u +%FT%TZ)" >&2
      sleep "$INTERVAL"
      continue
    fi
    if [ -f "$WORK/db/seeds/.sync-request.json" ]; then
      DUMP="$STATE/pre-apply-${MERGE_SHA}.sql"
      if pg_dump --no-owner --no-privileges "$OWNER_URL" > "$DUMP" 2>"$STATE/pg-dump.err"; then
        DUMP_SHA=$(sha256sum "$DUMP" | cut -d' ' -f1)
        if WIKI_SYNC_PG="$WRITER_URL" node scripts/seed-sync.mjs --apply \
             --merge-sha "$MERGE_SHA" --pre-apply-dump-sha256 "$DUMP_SHA" \
             > "$STATE/apply-last.json" 2>"$STATE/apply.err"; then
          echo "wiki-sync: applied $MERGE_SHA at $(date -u +%FT%TZ)"
        elif grep -q E_SYNC_ALREADY_APPLIED "$STATE/apply.err"; then
          echo "wiki-sync: marker for $MERGE_SHA already applied at $(date -u +%FT%TZ)"
        else
          echo "wiki-sync: apply refused/failed for $MERGE_SHA at $(date -u +%FT%TZ)" >&2
          cat "$STATE/apply.err" >&2
        fi
      else
        echo "wiki-sync: pg_dump failed at $(date -u +%FT%TZ)" >&2
        cat "$STATE/pg-dump.err" >&2
      fi
    fi
    NOW=$(date +%s)
    if [ $((NOW - LAST_DRIFT)) -ge "$DRIFT_SECONDS" ]; then
      DRIFT_REPORT="$STATE/drift-$(date -u +%Y%m%dT%H%M%SZ).json"
      if WIKI_SEEDS_PG="$OWNER_URL" node scripts/seed-sync.mjs --drift \
           > "$DRIFT_REPORT" 2>"$STATE/drift.err"; then
        echo "$NOW" > "$STATE/last-drift"
        LAST_DRIFT=$NOW
        echo "wiki-sync: drift check recorded at $(date -u +%FT%TZ)"
      else
        echo "wiki-sync: drift check failed at $(date -u +%FT%TZ)" >&2
        cat "$STATE/drift.err" >&2
      fi
    fi
  else
    echo "wiki-sync: fetch failed at $(date -u +%FT%TZ)" >&2
  fi
  sleep "$INTERVAL"
done
