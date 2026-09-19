# DOCS-SITE KNOWLEDGE BASE

## OVERVIEW
VitePress publication layer for the three canon domains — generated mirrors plus a small set of site-authored pages. Score ~11: distinct publication boundary with its own package, scripts, and gates.

## STRUCTURE
```text
site/
|-- .vitepress/   config.mts, theme/      # nav + build config
|-- scripts/      mount, gate, stage-images, build-world-index, test-gate
|-- rules/        <- GAME-LOGIC/*.md      (+ site-authored Rules-*.md, index.md)
|-- world/        <- LORE/**/*.md         (+ generated index.md)
|-- design/       <- GDD/*.md + root Concept/Design/ToDo/Intent
|-- public/assets/wiki/                   # staged wiki images (LFS gate)
`-- dist/, node_modules/                  # gitignored build output / vendored deps
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Stage canon into the site | `scripts/mount.mjs` | LORE→world, GAME-LOGIC→rules, GDD→design; rewrites cross-domain links and asset URLs |
| Public-term gate | `scripts/gate.mjs` | Scans rendered `dist/`: banned terms, broken links, section counts; unit-tested by `scripts/test-gate.mjs` |
| World index page | `scripts/build-world-index.mjs` | Generates `world/index.md`; parses rulers out of `LORE/factions/Sixteen-States.md` |
| Image staging | `scripts/stage-images.mjs` | Copies `GAME-REFERENCE/assets/wiki` → `public/assets/wiki` behind an LFS gate |

## CONVENTIONS
- mount writes per file and never cleans targets: renaming or deleting a canon page orphans its mirror — remove the orphan manually.
- Mounting excludes `_Sidebar.md`, `_TEMPLATE.md`, LORE `name-pools/`/`regions/` and `README.md`; RESEARCH/canon-reference pages are expected exclusions (currently 20).
- The only hand-authored Markdown here: `rules/Rules-*.md` (condensed numbered clauses, IDs like `RBATTLE-01`), `index.md` landing pages, plus `scripts/` and `.vitepress/`.
- Each `Rules-*.md` header names its source canon doc and states that contract numbers yield to implementation constants.

## ANTI-PATTERNS
- Do not edit mounted mirrors (`world/`, `design/`, non-Rules `rules/*.md`) — edit the canon file, then remount.
- Do not introduce banned terms in site-authored pages; the gate checks rendered text, including HTML attributes and invisible-character splits.
- Do not commit `dist/` or `node_modules/`.

## COMMANDS
```bash
node GAME-LOGIC/site/scripts/mount.mjs             # after any canon edit
node GAME-LOGIC/site/scripts/build-world-index.mjs # after LORE faction changes
node GAME-LOGIC/site/scripts/stage-images.mjs      # after wiki asset changes
node GAME-LOGIC/site/scripts/gate.mjs              # after docs:build; scans dist/
```
Dev/build commands (`docs:dev`, `docs:build`) are listed in the root AGENTS.md.
