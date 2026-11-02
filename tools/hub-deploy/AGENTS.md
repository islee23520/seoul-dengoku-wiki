# DEPLOY KNOWLEDGE BASE

## OVERVIEW
Self-hosted hub packaging and Windows atomic deployment: manifest-driven staging, private-feedback boundaries, browser QA; score 10, distinct deployment domain (37 files, 95% code, own Dockerfile).

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Page manifest | `hub-pages.json` | Pages from `GDD/viewer/dist`, `TOOL/avatar-gen/viewer` (+ `ART-ASSETS` GLBs), `GDD/design-store`; `required` pages fail the build when missing |
| Docker hub build | `build-hub-docker.mjs`, `hub.Dockerfile` | Read-only repo mount into builder image `seoul-dengoku-hub-builder:local`; `--output` defaults to `.omo/deploy/hub` |
| Hub inputs / source pinning | `hub-inputs.mjs` | `hubSourceSha`; private-feedback mode/source, parentCommit/gitlink/wikiCommit |
| Remote deploy | `deploy-hub.mjs` | Requires `--host user@host` or `SEOUL_DENGOKU_DEPLOY_HOST`; release `E:/git/seoul-dengoku-web/releases/<timestamp-uuid>` under remote lock `deploy.transaction.lock.d`; `--skip-build`, `--skip-browser-qa` |
| Windows local deploy | `deploy-hub-local-windows.ps1` | DeployRoot `E:\git\seoul-dengoku-web`; evidence under `.omo/evidence/hub-docker-deploy/latest` |
| Windows promotion tests | `test-windows-promotion.ps1`, `test-windows-prepromotion.ps1` | PowerShell contract tests |
| Hub entry page | `generate-hub-entry.mjs` | Korean tile groups; validates `doc-publishing` publication manifests |
| Retained builds | `wiki-workers/retain-build.mjs` | `retainBuild` checks `git merge-base --is-ancestor <sha> origin/main`, parent/wiki commits, immutable retained-source identity |
| Artifact bounds | `wiki-workers/artifact.mjs` | `MAX_FILES = 20000`, `MAX_BYTES = 25 MiB`, `sha256`, `files`, `validateLimits` |
| Public/private boundary | `verify-public-feedback-boundary.mjs` | @babel/parser scan for private `selectable-text-catalog.v2` documents |
| Private feedback packaging | `package-private-feedback.mjs` | Imports `TOOL/feedback-service/src` views and transaction-proof canonical |
| Publication bundles | `verify-publication-bundles.mjs` | Static-string analysis via @babel/parser over published pages |
| Staged release diff | `diff-staged-release.mjs` | `deployment-manifest.json` artifacts vs actual files on disk |
| CI session receiver | `ci-session-receiver.mjs` | HMAC + `timingSafeEqual` session acceptance |
| Nginx config | `generate-nginx.mjs` | Rewrites location blocks (avatar `.mjs`, `/system-design/regions`) |
| Lore gate | `check-hub-lore.mjs` | Runs `WIKI/scripts/lore-json-validate.mjs` over the ledger + World-Narrative-Atlas + all 33 projections |
| Browser QA | `browser-contract-qa.js`, `browser-pages-qa.js`, `browser-people-details-qa.js`, `run-browser-*.mjs` | Template-driven page contract checks |

## CONVENTIONS
- The Docker build mounts the repository read-only; nothing writes back into the checkout.
- Release directories are immutable and addressed by timestamp-UUID; deployment holds the remote transaction lock.
- Private feedback never crosses the public boundary: packaging and bundle verification parse page sources for private catalog shapes.
- `deploy:hub:test` runs `test-hub-deploy`, `test-hub-docker-contract`, `test-private-feedback-bundle`, `test-hub-private-inputs`.
- Deploy reads across subtrees by design: `TOOL/feedback-service/src`, `WIKI/scripts/`, `GDD/viewer/dist`, `TOOL/avatar-gen/viewer`, `ART-ASSETS`.

## COMMANDS
From repository root.
```bash
npm --prefix TOOL/tools run deploy:hub:test
npm --prefix TOOL/tools run deploy:hub:build
npm --prefix TOOL/tools run deploy:hub -- --host <user@host>
node TOOL/tools/node_modules/vitest/vitest.mjs run --root TOOL/tools deploy/test-retained-build.mjs deploy/test-verify-publication-bundles.mjs
node TOOL/tools/node_modules/vitest/vitest.mjs run --root TOOL/tools deploy/test-reported-test.mjs deploy/test-ci-session-receiver.mjs
```

## ANTI-PATTERNS
- Do not deploy without `--host`/`SEOUL_DENGOKU_DEPLOY_HOST`; the script fails with `DEPLOY_HOST_REQUIRED`.
- Do not bypass the transaction lock or overwrite an existing release directory; retained runs refuse duplicates.
- Do not widen the public/private feedback boundary or weaken @babel-based private-catalog detection.
- Do not relax artifact limits (20000 files / 25 MiB) without a contract change; `validateLimits` fails closed.
