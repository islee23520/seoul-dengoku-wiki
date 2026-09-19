# TOOLS KNOWLEDGE BASE

## OVERVIEW
Repository-only ESM/Python tooling, not shipped with Unity; score 12, distinct build and validation domain.

## STRUCTURE
- `wiki/`: publishing and world-atlas projections; separate child guidance.
- `art/`: candidate generation and runtime provenance; separate child guidance.
- `regions/`: dated geography assembly and independent source verification; own child guidance.
- `strategy-map/`: deterministic Seoul strategy-map bakes; own child guidance.
- `architecture/`, `policy/`: Unity ownership and delivery-authority gates.
- `unity/`: headless/remote wrappers and UI evidence validator.
- `design-store/`, `store/`: SQLite canon and source-bound capture; `design-store/` has own child guidance.
- `deploy/`: Docker 기반 자체 호스팅 허브 빌드·Windows 원자 배포·등록 페이지 전수 검증.
- `cast/`: roster draft generators.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Dependencies and npm test scope | `package.json` | Private `janseon-tools`, Node >=20 |
| Wiki publishing and atlas rules | `wiki/AGENTS.md` | Rendering, safe cleanup, projections and suite coverage |
| Region pipeline contracts | `regions/README.md`, `regions/AGENTS.md` | Geometry-only verification is intermediate, not authored completeness |
| Strategy-map bakes | `strategy-map/AGENTS.md` | Deterministic terrain/texture/building bakes; child guidance |
| SQLite canon and source capture | `design-store/AGENTS.md`, `store/design-store-capture.mjs` | Separate npm test scripts |
| Cast roster/relationship checks | `wiki/verify-cast.mjs` | `verifyCast` export, rule-coded violations |
| Surname/bongwan/hangnyeol data contract | `wiki/verify-hangnyeol.mjs` | `verifyHangnyeol` export; quotes are matched against `RESEARCH/verification/hangnyeol/raw/` |
| Strategy formula checks | `wiki/test-strategy-formulas.mjs` | Separate executable, not npm test |
| Unity architecture gate | `architecture/check-unity-architecture.mjs` | C# scans plus scene YAML/build order |
| Delivery-policy consistency | `policy/check-repo-delivery-policy.mjs` | Approved plan, ADR-001, live origin |
| Capture evidence validation | `unity/validate-ui-captures.mjs` | PNG content and source-bound receipts |
| Self-hosted hub deployment | `deploy/hub-pages.json`, `deploy/build-hub-docker.mjs`, `deploy/deploy-hub.mjs` | Read-only Docker build, manifest-driven page staging, Windows nginx atomic swap |
| Unity remote setup/start/CLI | npm `remote:setup`, `remote:start`, `remote:cli` | Wrappers over `unity/` scripts; token in `Game/.unity-remote-token` |
| LFS hydration gate | `check-lfs-hydration.mjs` | Pointers in `GAME/Assets` or `GAME-REFERENCE/assets` fail closed |
| Art planning and provenance | `art/AGENTS.md` | Separate domain guide |

## CONVENTIONS
- `npm --prefix TOOL/tools test` runs `policy/normalize-creative-names.mjs`, the wiki build test, and the Unity architecture-doc test.
- Other gates/tests are explicit script entry points; npm test is not the full tooling suite.
- `entities`, `mdast-util-from-markdown`, and `parse5` belong to wiki parsing; no game bundle is produced.
- `test:design-store`, `test:mda-store`, and `test:unity-remote` are separately selected npm scripts; so are `remote:setup`, `remote:start`, and `remote:cli`.
- Region scripts use Python with pyosmium, Shapely, Rasterio/GDAL and NumPy; do not replace original-source verification with summary counts.
- Capture validation covers five states at 1280x720 and 1920x1080; PNG hashes, playing-state receipts, HEAD, and dirty-tree fingerprint must agree.
- Architecture validation checks serialized lifetime scopes as well as C#; changing only a code allowlist does not update scene expectations.

## COMMANDS
Run from repository root; install tooling dependencies with `npm ci --prefix TOOL/tools`.

```bash
git lfs pull && git lfs checkout && node TOOL/tools/check-lfs-hydration.mjs
node TOOL/tools/test-check-lfs-hydration.mjs
npm --prefix TOOL/tools test
node TOOL/tools/wiki/test-verify-cast.mjs
node TOOL/tools/wiki/verify-hangnyeol.mjs --cast
node TOOL/tools/wiki/test-verify-hangnyeol.mjs
node TOOL/tools/wiki/test-strategy-formulas.mjs
node TOOL/tools/architecture/check-unity-architecture.mjs
node TOOL/tools/architecture/test-check-unity-architecture.mjs
node TOOL/tools/policy/check-repo-delivery-policy.mjs
node TOOL/tools/unity/test-validate-ui-captures.mjs
npm --prefix TOOL/tools run deploy:hub:test
npm --prefix TOOL/tools run deploy:hub:build
npm --prefix TOOL/tools run deploy:hub -- --host oliver@100.77.98.25
```

## ANTI-PATTERNS
- Do not treat npm test as an architecture, policy, capture, or art gate result.
- Do not rebuild a region atlas over authored content without preserving it; generated rebuilds overwrite the artifact.
- Do not treat surface adjacency as a proven travel edge or geometry-only success as authored-atlas completion.
- Do not accept capture receipts without the tested SHA/fingerprint or assume valid PNG dimensions prove meaningful UI content.
- Do not replace ADR-001 delivery authority with stale local-only plan clauses; the policy checker requires explicit supersession linkage.
