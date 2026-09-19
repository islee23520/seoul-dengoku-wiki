# DESIGN-STORE KNOWLEDGE BASE

## OVERVIEW
Fully generated MDA render of the design corpus — SQLite store plus static Korean HTML pages. Never hand-edit; regenerate. Score ~9: 226 tracked files, 19 subdirs, machine-consumed artifacts.

## STRUCTURE
```text
design-store/
|-- index.html                     # TOC hub, layered by section
|-- mda-design-store.sqlite        # generated store — gitignored, local-only
|-- mda-design-store.receipt.json  # store receipt — gitignored, local-only
|-- <domain>/index.html            # 18 domain landing pages (battle, warfare, ui-pipeline, …)
`-- canon/<doc-id>/index.html      # ~207 per-document renders
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Browse by layer | `index.html` | Section order: 제품/캠페인/전투/세계/전략/정치/인물/구현 |
| One canonical document | `canon/<doc-id>/index.html` | kebab-case id; `name--qualifier` marks a qualifier; `_`-prefix marks meta pages |
| A domain landing page | `battle/`, `campaign-loop/`, `warfare/`, … | Link canon pages for that system |
| Page provenance | trailing `.src` line in each canon page | upstream Markdown path · byte size · SHA-256 |

## CONVENTIONS
- Inputs, in order: `TOOL/tools/design-store/instances/janseon-core.json` + `catalog.json` define the documents; `seed-from-canon.mjs` resolves each `sourcePath` against `LORE/`, `GAME-LOGIC/` (minus `site/`), and top-level `GDD/`, builds the SQLite store, and exports every HTML page.
- Legacy provenance paths (`Wikis/game-logic/*`, `docs/game-logic/*`) are remapped to the current roots at render time — stale labels inside old pages are expected, not errors.
- Pages are self-contained: shared inline CSS palette (`--ink/--paper/--line/--metro`), serif Korean display font, no JS, no external assets.

## ANTI-PATTERNS
- Never hand-edit any file here, including `index.html` landing pages — regenerate with `seed-from-canon.mjs`.
- Canon HTML is a derivative; the upstream Markdown (matching the `.src` SHA) is the authority. Do not quote this store as canon.
- `sqlite`/`receipt.json` are binary, local, and gitignored — regenerate; never diff-edit or commit them.

## COMMANDS
```bash
node TOOL/tools/design-store/seed-from-canon.mjs   # rebuild store + all HTML
npm --prefix TOOL/tools run test:mda-store         # store contract tests
```
