# WIKI TOOLING KNOWLEDGE BASE

## OVERVIEW
Safe public wiki generation and deterministic world-atlas projections; score 9, distinct publication boundary.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Render and claim output | `build-wiki.mjs` | `buildWiki`, `assertSafeOutputRoot`, ownership sentinel |
| Publish orchestration | `publish-wiki.mjs` | Dependency pins, required pages and publication steps |
| Atlas machine vocabulary | `world-atlas-schema.mjs` | Schema, IDs, required fields, diagram palette |
| Parse canon and detect repeated templates | `world-atlas-parse.mjs` | JSON extraction, normalized prose, similarity helpers |
| Render projections | `world-atlas-render.mjs` | Named Markdown pages from atlas records |
| Materialize/check projections | `materialize-world-atlas.mjs` | Explicit atlas/output paths and `--check` |
| Validate atlas sections | `world-atlas-verify.mjs`, `world-atlas-verify-rest.mjs` | Staged, batch-aware checks |
| Confirmed integration exceptions | `confirmed-integration-manifest.json` | Recognized monster pages retained by projection checks |
| Roster constraints | `verify-cast.mjs` | Rule-coded violations, separate regression executable |

## CONVENTIONS
- `build-wiki.mjs` positional CLI inputs are source directory, asset directory, output directory and commit SHA.
- Wiki output carries `.janseon-wiki-generated`; validate and render before destructive cleanup.
- Resolve paths and inspect symlinks before claiming output ownership; preserve the output checkout's `.git` directory.
- Public-term validation inspects rendered text, visible HTML attributes and invisible-character splitting, not raw Markdown alone.
- `publishedFragmentPages` takes publishable fragment membership from the index rather than publishing every possible fragment.
- Assets are collected recursively; published links use the wiki's `assets/` subtree.
- Atlas materialization writes temporary files then renames; check mode compares exact projection bytes and unexpected pages.
- For an output directory named `game-logic`, diagram assets are routed to sibling `assets/wiki/`.
- Keep source canon distinct from generated projections; source hashes describe the atlas Markdown used to produce them.

## COMMANDS
From repository root; these extend the parent package's default test coverage.
```bash
node Tool/tools/wiki/test-publish-wiki.mjs
node Tool/tools/wiki/test-world-atlas.mjs
node Tool/tools/wiki/test-world-expansion.mjs
node Tool/tools/wiki/test-confirmed-integration.mjs
```

## ANTI-PATTERNS
- Do not bypass the ownership sentinel or point output at source/assets, repository root, home or filesystem-root-adjacent paths.
- Do not weaken visible-text checks to raw substring checks; rendering can join prohibited terms.
- Do not treat hand-edited projections as canon or accept stale projection bytes as a current materialization.
- Do not equate the default two npm tests with atlas, cast, formula or publishing verification.
