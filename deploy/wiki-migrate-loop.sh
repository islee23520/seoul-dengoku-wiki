#!/bin/sh
# Host migration applier loop (deploy/docker-compose.wiki-migrate.yml).
# Follows main of the public wiki repository and applies only migrations that
# were merged through a pull request. Runs inside the compose network where
# wiki-postgres is reachable; the owner password arrives via environment.
set -eu

REPO_URL="${WIKI_MIGRATE_REPO_URL:-https://github.com/islee23520/seoul-dengoku-wiki.git}"
BRANCH="${WIKI_MIGRATE_BRANCH:-main}"
INTERVAL="${WIKI_MIGRATE_INTERVAL:-300}"
WORK="${WIKI_MIGRATE_WORK:-/wiki}"
DEPS="${WIKI_MIGRATE_DEPS:-/deps}"

mkdir -p "$WORK" "$DEPS"
if [ ! -d "$WORK/.git" ]; then
  git clone --filter=blob:none --no-checkout "$REPO_URL" "$WORK"
fi
if [ ! -d "$DEPS/node_modules" ]; then
  npm install --prefix "$DEPS" --no-audit --no-fund --ignore-scripts \
    "drizzle-orm@0.45.4" "pg@8.16.3"
fi
[ -e "$WORK/node_modules" ] || ln -s "$DEPS/node_modules" "$WORK/node_modules"

while :; do
  if git -C "$WORK" fetch --quiet origin "$BRANCH" \
     && git -C "$WORK" checkout --quiet --force "origin/$BRANCH" -- db scripts package.json; then
    if node scripts/db-migrate.mjs; then
      echo "wiki-migrate: up to date at $(date -u +%FT%TZ)"
    else
      echo "wiki-migrate: apply failed at $(date -u +%FT%TZ)" >&2
    fi
  else
    echo "wiki-migrate: fetch failed at $(date -u +%FT%TZ)" >&2
  fi
  sleep "$INTERVAL"
done
