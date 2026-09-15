# TOOLS KNOWLEDGE BASE

## OVERVIEW
Repository-only ESM/Python tooling, not shipped with Unity; score 8, distinct build and validation domain.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Dependencies and npm test scope | `package.json` | Private `janseon-tools`, Node >=20 |
| Wiki rendering and safe cleanup | `wiki/build-wiki.mjs` | `buildWiki`, `assertSafeOutputRoot` exports |
| Wiki generator regression cases | `wiki/test-build-wiki.mjs` | Filesystem and visible-text boundaries |
| Cast roster/relationship checks | `wiki/verify-cast.mjs` | `verifyCast` export, rule-coded violations |
| Strategy formula checks | `wiki/test-strategy-formulas.mjs` | Separate executable, not npm test |
| Unity architecture gate | `architecture/check-unity-architecture.mjs` | C# scans plus scene YAML/build order |
| Delivery-policy consistency | `policy/check-repo-delivery-policy.mjs` | Approved plan, ADR-001, live origin |
| Capture evidence validation | `unity/validate-ui-captures.mjs` | PNG content and source-bound receipts |
| LFS hydration gate | `check-lfs-hydration.mjs` | Pointers in `Game/Assets` or `docs/assets` fail closed |
| Art planning and provenance | `art/AGENTS.md` | Separate domain guide |

## CONVENTIONS
- `npm --prefix tools test` runs only wiki build and Unity architecture-doc tests.
- Other gates/tests are explicit script entry points; npm test is not the full tooling suite.
- `entities`, `mdast-util-from-markdown`, and `parse5` belong to wiki parsing; no game bundle is produced.
- Wiki generation takes source directory, asset directory, output directory, and commit SHA as positional arguments.
- Wiki output ownership is marked by `.janseon-wiki-generated`; validation/rendering precede destructive cleanup.
- Public-term checking examines rendered text, including visible HTML attributes and invisible-character splitting.
- Capture validation covers five states at 1280x720 and 1920x1080; PNG hashes, playing-state receipts, HEAD, and dirty-tree fingerprint must agree.
- Architecture validation checks serialized lifetime scopes as well as C#; changing only a code allowlist does not update scene expectations.

## COMMANDS
Run from repository root; install tooling dependencies with `npm ci --prefix tools`.

```bash
git lfs pull && git lfs checkout && node tools/check-lfs-hydration.mjs
node tools/test-check-lfs-hydration.mjs
npm --prefix tools test
node tools/wiki/test-verify-cast.mjs
node tools/wiki/test-strategy-formulas.mjs
node tools/architecture/check-unity-architecture.mjs
node tools/architecture/test-check-unity-architecture.mjs
node tools/policy/check-repo-delivery-policy.mjs
node tools/unity/test-validate-ui-captures.mjs
```

## ANTI-PATTERNS
- Do not treat npm test as an architecture, policy, capture, or art gate result.
- Do not bypass the wiki ownership sentinel or point output at source/assets, repository root, home, or filesystem-root-adjacent paths.
- Do not weaken wiki visible-text checks into raw Markdown substring checks; rendering can assemble prohibited terms.
- Do not accept capture receipts without the tested SHA/fingerprint or assume valid PNG dimensions prove meaningful UI content.
- Do not replace ADR-001 delivery authority with stale local-only plan clauses; the policy checker requires explicit supersession linkage.
