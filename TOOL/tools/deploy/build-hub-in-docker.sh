#!/usr/bin/env bash
set -euo pipefail

SOURCE_ROOT=${SOURCE_ROOT:-/repo}
OUTPUT_ROOT=${OUTPUT_ROOT:-/out}
WORK_ROOT=${WORK_ROOT:-$OUTPUT_ROOT/work}

rm -rf "$WORK_ROOT" "$OUTPUT_ROOT"/site "$OUTPUT_ROOT"/seoul-dengoku-site.tar
mkdir -p "$WORK_ROOT" "$OUTPUT_ROOT"

for path in \
  Concept.md Design.md Intent.md ToDo.md index.html \
  GDD LORE WEB GAME/play GAME-REFERENCE/ui-layout-moodboard \
  GAME-REFERENCE/ui-ux-refs \
  GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json \
  RESEARCH/canon-reference RESEARCH/verification TOOL/tools TOOL/portrait-gen; do
  mkdir -p "$WORK_ROOT/$(dirname "$path")"
  tar -C "$SOURCE_ROOT" \
    --exclude='**/node_modules' \
    --exclude='**/dist' \
    --exclude='**/tsconfig.tsbuildinfo' \
    -cf - "$path" | tar -C "$WORK_ROOT" -xf -
done

cd "$WORK_ROOT"

npm ci --prefix TOOL/tools --ignore-scripts
npm ci --prefix WEB/wiki-source --ignore-scripts
npm ci --prefix WEB/wiki --ignore-scripts

node WEB/wiki-source/scripts/mount.mjs
node WEB/wiki-source/scripts/build-world-index.mjs
npm --prefix WEB/wiki-source run docs:build
node WEB/wiki-source/scripts/gate.mjs
node TOOL/tools/design-store/seed-from-canon.mjs
node GDD/system-design/total-war-ui/generate-map-data.mjs

npm --prefix WEB/wiki run build
npm --prefix WEB/wiki run build:gdd
npm --prefix WEB/wiki run test:contract -- --json "$OUTPUT_ROOT/react-contract.json"
npm --prefix WEB/wiki run test:gdd
npm --prefix WEB/wiki run test:links
npm --prefix WEB/wiki run test:states
npm --prefix WEB/wiki run test:assets
npm --prefix WEB/wiki run test:people
npm --prefix WEB/wiki run test:person-details
npm --prefix WEB/wiki run test:territory-map
npm --prefix WEB/wiki run test:timeline
npm --prefix WEB/wiki run test:discovery
node --test TOOL/tools/wiki/test-retired-reference-terms.mjs
node --test TOOL/tools/wiki/test-wiki-parity.mjs

node TOOL/tools/deploy/hub-deploy.mjs \
  --root "$WORK_ROOT" \
  --output "$OUTPUT_ROOT/site" \
  --hub-index index.html \
  --wiki-dist WEB/wiki/dist \
  --manifest "$WORK_ROOT/TOOL/tools/deploy/hub-pages.json"

cp WEB/wiki/deploy/nginx.conf "$OUTPUT_ROOT/nginx.conf"
cp WEB/wiki/deploy/deploy-windows.ps1 "$OUTPUT_ROOT/deploy-windows.ps1"
cp WEB/wiki/deploy/promote-release.ps1 "$OUTPUT_ROOT/promote-release.ps1"
cp WEB/wiki/deploy/rollback-release.ps1 "$OUTPUT_ROOT/rollback-release.ps1"
cp WEB/wiki/deploy/check-live-contract.mjs "$OUTPUT_ROOT/check-live-contract.mjs"
cp WEB/wiki/src/generated/wikiCatalog.ts "$OUTPUT_ROOT/wikiCatalog.ts"
cp TOOL/tools/deploy/hub-pages.json "$OUTPUT_ROOT/hub-pages.json"
cp TOOL/tools/deploy/verify-hub-deploy.sh "$OUTPUT_ROOT/verify-hub-deploy.sh"
cp TOOL/tools/deploy/verify-staged-release.mjs "$OUTPUT_ROOT/verify-staged-release.mjs"

tar -C "$OUTPUT_ROOT/site" -cf "$OUTPUT_ROOT/seoul-dengoku-site.tar" .
sha256sum "$OUTPUT_ROOT/seoul-dengoku-site.tar" > "$OUTPUT_ROOT/seoul-dengoku-site.tar.sha256"

printf 'HUB_DOCKER_BUILD_PASS files=%s pages=%s\n' \
  "$(find "$OUTPUT_ROOT/site" -type f | wc -l | tr -d ' ')" \
  "$(node -e "const x=require('$OUTPUT_ROOT/site/deployment-manifest.json'); process.stdout.write(String(x.pages.length))")"

rm -rf "$WORK_ROOT"
