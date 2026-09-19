#!/usr/bin/env bash
set -euo pipefail

SOURCE_ROOT=${SOURCE_ROOT:-/repo}
WORK_ROOT=${WORK_ROOT:-/work/source}
OUTPUT_ROOT=${OUTPUT_ROOT:-/out}

rm -rf "$WORK_ROOT" "$OUTPUT_ROOT"/site "$OUTPUT_ROOT"/seoul-dengoku-site.tar
mkdir -p "$WORK_ROOT" "$OUTPUT_ROOT"

tar -C "$SOURCE_ROOT" \
  --exclude=.git \
  --exclude=.omo \
  --exclude='**/node_modules' \
  --exclude='**/dist' \
  --exclude='**/tsconfig.tsbuildinfo' \
  -cf - . | tar -C "$WORK_ROOT" -xf -

cd "$WORK_ROOT"

npm ci --prefix TOOL/tools --ignore-scripts
npm ci --prefix GAME-LOGIC/site --ignore-scripts
npm ci --prefix GAME-LOGIC/wiki-react --ignore-scripts

node GAME-LOGIC/site/scripts/mount.mjs
node GAME-LOGIC/site/scripts/build-world-index.mjs
npm --prefix GAME-LOGIC/site run docs:build
node GAME-LOGIC/site/scripts/gate.mjs
node TOOL/tools/design-store/seed-from-canon.mjs

npm --prefix GAME-LOGIC/wiki-react run build
npm --prefix GAME-LOGIC/wiki-react run test:contract -- --json "$OUTPUT_ROOT/react-contract.json"
npm --prefix GAME-LOGIC/wiki-react run test:links
node --test TOOL/tools/wiki/test-wiki-parity.mjs

node TOOL/tools/deploy/hub-deploy.mjs \
  --root "$WORK_ROOT" \
  --output "$OUTPUT_ROOT/site" \
  --wiki-dist GAME-LOGIC/wiki-react/dist \
  --manifest "$WORK_ROOT/TOOL/tools/deploy/hub-pages.json"

cp GAME-LOGIC/wiki-react/deploy/nginx.conf "$OUTPUT_ROOT/nginx.conf"
cp GAME-LOGIC/wiki-react/deploy/deploy-windows.ps1 "$OUTPUT_ROOT/deploy-windows.ps1"
cp GAME-LOGIC/wiki-react/deploy/promote-release.ps1 "$OUTPUT_ROOT/promote-release.ps1"
cp GAME-LOGIC/wiki-react/deploy/rollback-release.ps1 "$OUTPUT_ROOT/rollback-release.ps1"
cp GAME-LOGIC/wiki-react/deploy/check-live-contract.mjs "$OUTPUT_ROOT/check-live-contract.mjs"
cp GAME-LOGIC/wiki-react/src/generated/wikiCatalog.ts "$OUTPUT_ROOT/wikiCatalog.ts"
cp TOOL/tools/deploy/hub-pages.json "$OUTPUT_ROOT/hub-pages.json"
cp TOOL/tools/deploy/verify-hub-deploy.sh "$OUTPUT_ROOT/verify-hub-deploy.sh"
cp TOOL/tools/deploy/verify-staged-release.mjs "$OUTPUT_ROOT/verify-staged-release.mjs"

tar -C "$OUTPUT_ROOT/site" -cf "$OUTPUT_ROOT/seoul-dengoku-site.tar" .
sha256sum "$OUTPUT_ROOT/seoul-dengoku-site.tar" > "$OUTPUT_ROOT/seoul-dengoku-site.tar.sha256"

printf 'HUB_DOCKER_BUILD_PASS files=%s pages=%s\n' \
  "$(find "$OUTPUT_ROOT/site" -type f | wc -l | tr -d ' ')" \
  "$(node -e "const x=require('$OUTPUT_ROOT/site/deployment-manifest.json'); process.stdout.write(String(x.pages.length))")"
