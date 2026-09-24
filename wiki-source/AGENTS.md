# DOCS-SITE KNOWLEDGE BASE

## OVERVIEW
VitePress publication layer for the world domain — generated LORE mirrors plus a small set of site-authored pages. GDD design/rules pages are no longer mirrored here; `GDD/viewer` publishes them at `/gdd/`. Score ~11: distinct publication boundary with its own package, scripts, and gates.

## STRUCTURE
```text
site/
|-- .vitepress/   config.mts, theme/      # nav + build config
|-- scripts/      mount, gate, build-world-index, test-gate
|-- world/        <- LORE/**/*.md         (+ generated index.md)
`-- dist/, node_modules/                  # gitignored build output / vendored deps
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Stage canon into the site | `scripts/mount.mjs` | LORE→world; reads `GDD_PAGES_ROOT` materialized pages only as link targets (`/gdd/<category>/<slug>`); rewrites cross-domain links and asset URLs |
| Public-term gate | `scripts/gate.mjs` | Scans rendered `dist/`: banned terms, broken links (`/gdd/` hub links are skipped), section counts; unit-tested by `scripts/test-gate.mjs` |
| World index page | `scripts/build-world-index.mjs` | Generates `world/index.md`; parses rulers out of `LORE/factions/Sixteen-States.md` |

## CONVENTIONS
- mount removes stale generated mirrors before writing the current candidate set.
- Mounting excludes `_Sidebar.md`, `_TEMPLATE.md`, LORE `name-pools/`/`regions/` and `README.md`; RESEARCH/canon-reference pages are expected exclusions (currently 20).
- The only hand-authored Markdown here: the root `index.md` landing page, plus `scripts/` and `.vitepress/`.

## ANTI-PATTERNS
- Do not edit mounted mirrors (`world/`) — edit the canon file, then remount.
- Do not re-add `rules/` or `design/` GDD mirrors; GDD publication lives in `GDD/viewer`.
- Do not introduce banned terms in site-authored pages; the gate checks rendered text, including HTML attributes and invisible-character splits.
- Do not commit `dist/` or `node_modules/`.

## COMMANDS
```bash
node WEB/wiki-source/scripts/mount.mjs             # after any canon edit
node WEB/wiki-source/scripts/build-world-index.mjs # after LORE faction changes
node WEB/wiki-source/scripts/gate.mjs              # after docs:build; scans dist/
```
Dev/build commands (`docs:dev`, `docs:build`) are listed in the root AGENTS.md.
