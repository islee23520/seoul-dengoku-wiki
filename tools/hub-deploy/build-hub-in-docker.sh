#!/usr/bin/env bash
set -euo pipefail

SOURCE_ROOT=${SOURCE_ROOT:-/repo}
OUTPUT_ROOT=${OUTPUT_ROOT:-/out}
WORK_ROOT=${WORK_ROOT:-$OUTPUT_ROOT/work}
PRIVATE_FEEDBACK_ENABLED=${PRIVATE_FEEDBACK_ENABLED:-0}
if [[ "$PRIVATE_FEEDBACK_ENABLED" != 0 && "$PRIVATE_FEEDBACK_ENABLED" != 1 ]]; then
  echo 'PRIVATE_FEEDBACK_ENABLED must be 0 or 1' >&2
  exit 1
fi
if [[ "$PRIVATE_FEEDBACK_ENABLED" == 1 ]]; then
  : "${PARENT_COMMIT:?PARENT_COMMIT required}"
  : "${WIKI_GITLINK:?WIKI_GITLINK required}"
  : "${WIKI_COMMIT:?WIKI_COMMIT required}"
  : "${PRODUCER_COMMIT:?PRODUCER_COMMIT required}"
  [[ "$WIKI_COMMIT" == "$PRODUCER_COMMIT" ]]
  test -f /feedback-wiki/scripts/feedback-source-catalog.mjs
  test -d "$SOURCE_ROOT/WIKI"
else
  if [[ -n "${PARENT_COMMIT:-}${WIKI_GITLINK:-}${WIKI_COMMIT:-}${PRODUCER_COMMIT:-}" ]]; then
    echo 'private provenance requires PRIVATE_FEEDBACK_ENABLED=1' >&2
    exit 1
  fi
fi

rm -rf "$WORK_ROOT" "$OUTPUT_ROOT"/site "$OUTPUT_ROOT"/seoul-dengoku-site.tar "$OUTPUT_ROOT"/seoul-dengoku-site.tar.sha256 "$OUTPUT_ROOT"/private-feedback "$OUTPUT_ROOT"/seoul-dengoku-feedback-private.tar "$OUTPUT_ROOT"/seoul-dengoku-feedback-private.tar.sha256
mkdir -p "$WORK_ROOT" "$OUTPUT_ROOT"

for path in \
  Concept.md Design.md index.html \
  GDD WIKI \
  GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json \
  RESEARCH/canon-reference RESEARCH/verification TOOL/tools TOOL/avatar-gen/viewer \
  TOOL/document-renderer \
  TOOL/shared-web-ui/seoul-dengoku-shared-web-ui-0.1.2.tgz \
  TOOL/shared-web-ui/test/components.test.mjs \
  ART-ASSETS/avatar-gen/runtime/female-underwear; do
  mkdir -p "$WORK_ROOT/$(dirname "$path")"
  tar -C "$SOURCE_ROOT" \
    --exclude='**/node_modules' \
    --exclude='**/dist' \
    --exclude='**/tsconfig.tsbuildinfo' \
    -cf - "$path" | tar -C "$WORK_ROOT" -xf -
done
if [[ "$PRIVATE_FEEDBACK_ENABLED" == 1 ]]; then
  mkdir -p "$WORK_ROOT/TOOL/feedback-service" "$WORK_ROOT/TOOL/feedback-service/src" "$WORK_ROOT/private-feedback-source"
  for path in package.json package-lock.json schema.sql candidate-schema.sql interface.schema.json document-selectable-view.schema.json API.md README.md DOCUMENT-SELECTABLE-VIEW.md ENTITY-MAPPING-V2.md; do
    cp "$SOURCE_ROOT/TOOL/feedback-service/$path" "$WORK_ROOT/TOOL/feedback-service/"
  done
  for path in app.mjs auth.mjs config.mjs journal.mjs server.mjs store.mjs views.mjs; do
    cp "$SOURCE_ROOT/TOOL/feedback-service/src/$path" "$WORK_ROOT/TOOL/feedback-service/src/"
  done
  tar -C /feedback-wiki --exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='src/generated-private' -cf - . | tar -C "$WORK_ROOT/private-feedback-source" -xf -
fi

cd "$WORK_ROOT"
export SOURCE_ROOT OUTPUT_ROOT WORK_ROOT
export CI_TEST_RUNNER="${CI_TEST_RUNNER:-$WORK_ROOT/TOOL/tools/deploy/run-reported-test.mjs}"
export CI_RUN_ID="${CI_RUN_ID:-hub-$(date -u +%Y%m%dT%H%M%SZ)-$$}"
export CI_TEST_REPORT="${CI_TEST_REPORT:-$OUTPUT_ROOT/$CI_RUN_ID.report.json}"
export CI_SOURCE_SHA="${CI_SOURCE_SHA:-$(git -C "$SOURCE_ROOT" rev-parse HEAD)}"

mkdir -p "$WORK_ROOT/hub-ui"
tar -xzf TOOL/shared-web-ui/seoul-dengoku-shared-web-ui-0.1.2.tgz -C "$WORK_ROOT/hub-ui" --strip-components=1
npm install --prefix "$WORK_ROOT/hub-ui" --no-save --ignore-scripts --package-lock=false react@18.3.1 react-dom@18.3.1 vitest@5.0.2
mkdir -p "$WORK_ROOT/hub-ui/test"
cp TOOL/shared-web-ui/test/components.test.mjs "$WORK_ROOT/hub-ui/test/"
node "$CI_TEST_RUNNER" test hub-check-1 bash -c '(cd "$WORK_ROOT/hub-ui" && npx vitest run test/components.test.mjs)' || CI_TEST_FAILURE=1

npm ci --prefix TOOL/tools --ignore-scripts
if [[ "$PRIVATE_FEEDBACK_ENABLED" == 1 ]]; then
  npm ci --prefix TOOL/feedback-service --omit=dev --ignore-scripts
fi
node "$CI_TEST_RUNNER" test hub-check-2 bash -c '(cd TOOL/tools && npx vitest run doc-publishing/test-publication-manifest.mjs)' || CI_TEST_FAILURE=1
npm ci --prefix WIKI --ignore-scripts
npm ci --prefix TOOL/document-renderer --ignore-scripts
npm --prefix TOOL/document-renderer run build
node "$CI_TEST_RUNNER" test hub-check-3 bash -c 'npm --prefix TOOL/document-renderer test' || CI_TEST_FAILURE=1
npm ci --prefix GDD/viewer --ignore-scripts

export GDD_PAGES_ROOT="$WORK_ROOT/gdd-pages"
node TOOL/tools/canon/materialize-gdd.mjs --gdd GDD --out "$GDD_PAGES_ROOT"
# Keep the exempt Markdown pages that the publishers and design store still read.
cp GDD/LICENSE "$GDD_PAGES_ROOT/LICENSE.md"
mkdir -p "$GDD_PAGES_ROOT/system-design"
cp GDD/system-design/README.md "$GDD_PAGES_ROOT/system-design/"

node TOOL/tools/design-store/seed-from-canon.mjs
node "$CI_TEST_RUNNER" test hub-map-check python3 TOOL/tools/regions/refresh_map_content.py --map-data TOOL/tools/regions/data/atlas-data.js --content-dir WIKI/lore/regions/content --check || CI_TEST_FAILURE=1

# The atlas chain is JSON-only: its 34 committed projections must equal a fresh materialization.
node "$CI_TEST_RUNNER" test hub-atlas-check node TOOL/tools/wiki/materialize-world-atlas.mjs --atlas WIKI/lore/World-Narrative-Atlas.json --out WIKI/lore --check || CI_TEST_FAILURE=1
# The work copy carries no Git metadata, so validate the migration ledger plus the atlas chain by explicit path.
node "$CI_TEST_RUNNER" test hub-lore-schema node TOOL/tools/deploy/check-hub-lore.mjs || CI_TEST_FAILURE=1
# Lore pages render from JSON only: check the Glossary dictionary and the offices/structures sources without writing Markdown.
node "$CI_TEST_RUNNER" test hub-glossary-check node TOOL/tools/wiki/verify-glossary.mjs || CI_TEST_FAILURE=1
node "$CI_TEST_RUNNER" test hub-offices-check node TOOL/tools/wiki/offices-render.mjs --check || CI_TEST_FAILURE=1
node "$CI_TEST_RUNNER" test hub-structures-check node TOOL/tools/wiki/structures-render.mjs --check || CI_TEST_FAILURE=1

npm --prefix WIKI run build
node "$CI_TEST_RUNNER" test hub-check-4 bash -c 'npm --prefix WIKI run test:admission' || CI_TEST_FAILURE=1
node "$CI_TEST_RUNNER" test hub-check-5 bash -c 'npm --prefix WIKI run test:categories' || CI_TEST_FAILURE=1
node "$CI_TEST_RUNNER" test hub-check-6 bash -c 'npm --prefix WIKI run test:document-renderer' || CI_TEST_FAILURE=1
node "$CI_TEST_RUNNER" test hub-check-7 bash -c 'node WIKI/scripts/gate.mjs' || CI_TEST_FAILURE=1
npm --prefix GDD/viewer run build
node "$CI_TEST_RUNNER" test hub-check-8 bash -c 'npm --prefix WIKI run test:contract -- --json "$OUTPUT_ROOT/react-contract.json"' || CI_TEST_FAILURE=1
node "$CI_TEST_RUNNER" test hub-check-9 bash -c 'npm --prefix GDD/viewer test' || CI_TEST_FAILURE=1
node "$CI_TEST_RUNNER" test hub-check-10 bash -c 'node TOOL/tools/deploy/verify-publication-bundles.mjs "$WORK_ROOT"' || CI_TEST_FAILURE=1
node "$CI_TEST_RUNNER" test hub-check-11 bash -c '(cd TOOL/tools && npx vitest run deploy/test-verify-publication-bundles.mjs)' || CI_TEST_FAILURE=1
node "$CI_TEST_RUNNER" test hub-check-12 bash -c 'npm --prefix WIKI run test:links' || CI_TEST_FAILURE=1
node "$CI_TEST_RUNNER" test hub-check-13 bash -c 'npm --prefix WIKI run test:states' || CI_TEST_FAILURE=1
node "$CI_TEST_RUNNER" test hub-check-14 bash -c 'npm --prefix WIKI run test:assets' || CI_TEST_FAILURE=1
node "$CI_TEST_RUNNER" test hub-check-15 bash -c 'npm --prefix WIKI run test:people' || CI_TEST_FAILURE=1
node "$CI_TEST_RUNNER" test hub-check-16 bash -c 'npm --prefix WIKI run test:person-details' || CI_TEST_FAILURE=1
node "$CI_TEST_RUNNER" test hub-check-17 bash -c 'npm --prefix WIKI run test:territory-map' || CI_TEST_FAILURE=1
node "$CI_TEST_RUNNER" test hub-check-18 bash -c 'npm --prefix WIKI run test:timeline' || CI_TEST_FAILURE=1
node "$CI_TEST_RUNNER" test hub-check-19 bash -c 'npm --prefix WIKI run test:discovery' || CI_TEST_FAILURE=1
node "$CI_TEST_RUNNER" test hub-check-20 bash -c '(cd TOOL/tools && npx vitest run wiki/test-retired-reference-terms.mjs)' || CI_TEST_FAILURE=1
node "$CI_TEST_RUNNER" test hub-check-21 bash -c '(cd TOOL/tools && npx vitest run wiki/test-wiki-parity.mjs)' || CI_TEST_FAILURE=1

if [[ "${CI_TEST_FAILURE:-0}" == 1 ]]; then
  echo 'HUB_DOCKER_BUILD_FAIL required tests failed; report retained at' "$CI_TEST_REPORT" >&2
  exit 1
fi

node TOOL/tools/deploy/hub-deploy.mjs \
  --root "$WORK_ROOT" \
  --output "$OUTPUT_ROOT/site" \
  --hub-index index.html \
  --hub-package-root hub-ui \
  --wiki-dist WIKI/dist \
  --manifest "$WORK_ROOT/TOOL/tools/deploy/hub-pages.json"

node TOOL/tools/deploy/generate-nginx.mjs WIKI/deploy/nginx.conf "$OUTPUT_ROOT/nginx.conf"
cp WIKI/deploy/deploy-windows.ps1 "$OUTPUT_ROOT/deploy-windows.ps1"
cp WIKI/deploy/promote-release.ps1 "$OUTPUT_ROOT/promote-release.ps1"
cp WIKI/deploy/rollback-release.ps1 "$OUTPUT_ROOT/rollback-release.ps1"
cp WIKI/deploy/check-live-contract.mjs "$OUTPUT_ROOT/check-live-contract.mjs"
cp WIKI/src/generated/wikiCatalog.ts "$OUTPUT_ROOT/wikiCatalog.ts"
cp TOOL/tools/deploy/hub-pages.json "$OUTPUT_ROOT/hub-pages.json"
cp TOOL/tools/deploy/verify-hub-deploy.sh "$OUTPUT_ROOT/verify-hub-deploy.sh"
cp TOOL/tools/deploy/verify-staged-release.mjs "$OUTPUT_ROOT/verify-staged-release.mjs"

node TOOL/tools/deploy/verify-public-feedback-boundary.mjs "$OUTPUT_ROOT/site"
if [[ "$PRIVATE_FEEDBACK_ENABLED" == 1 ]]; then
  npm ci --prefix "$WORK_ROOT/private-feedback-source" --ignore-scripts
  (cd "$WORK_ROOT/private-feedback-source" && SEOUL_KENSHI_ROOT="$WORK_ROOT" npm run generate)
  test -s "$WORK_ROOT/private-feedback-source/src/generated-private/feedback-selectable-views.ko.json"
  test -s "$WORK_ROOT/private-feedback-source/src/generated-private/feedback-selectable-views.en.json"
  FEEDBACK_CATALOG_ROOT="$WORK_ROOT/private-feedback-source" node TOOL/tools/deploy/package-private-feedback.mjs
fi
tar -C "$OUTPUT_ROOT/site" -cf "$OUTPUT_ROOT/seoul-dengoku-site.tar" .
sha256sum "$OUTPUT_ROOT/seoul-dengoku-site.tar" > "$OUTPUT_ROOT/seoul-dengoku-site.tar.sha256"

printf 'HUB_DOCKER_BUILD_PASS files=%s pages=%s\n' \
  "$(find "$OUTPUT_ROOT/site" -type f | wc -l | tr -d ' ')" \
  "$(node -e "const x=require('$OUTPUT_ROOT/site/deployment-manifest.json'); process.stdout.write(String(x.pages.length))")"

rm -rf "$WORK_ROOT"
