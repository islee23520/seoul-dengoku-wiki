# LORE root corpus — atlas canon and read-only projections

Earned its file: score 17 (root canon and domain data, canon→projection architecture feeding the wiki tool); distinct domain — single-source canon plus generated projections. Subdirectories are separate domains with their own AGENTS.md.

## OVERVIEW
The root atlas (`World-Narrative-Atlas.json`) owns machine registries and generated projections. Domain subdirectories hold the JSON authoring sources; each page's Markdown is rendered from its JSON at build time and is never committed (a `.md` beside its `.json` fails `E_MARKDOWN_TWIN`). Some have their own AGENTS.md, and `README.md` is the Korean TOC.

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Change atlas registry facts | `World-Narrative-Atlas.json`; edit generated pages only through the renderer |
| Corpus TOC | `README.md` (Korean, relative links, links into all subdirs) |
| Hostile groups G01–G27 | `bestiary/Hostile-Ecology-Index.json` → `bestiary/groups/Hostile-Group-Gxx.json`; each group page owns ecology, scenarios and every GxxEyy entry |
| Bestiary entries `GxxEyy` | Group pages contain all 422 authored entries; Mxxx remains source provenance inside each entry and no batch body page is published |
| Steward houses | `Operating-Houses.json` (corporate HC01–HC22 + civic HP01–HP10) |
| Synthetics | `Synthetic-Actors.json` (humanoid H / facility F / mobile V, 16 each) |
| Narrative arcs | `Regional-Physical-AI-Arcs.json` (`ARC-*` three-act outlines per house/region) |
| Relation edges | `World-Relation-Ledger.json` (`operates_in`, `pressures`, `custodied_by`, rivalry/partnership rows) |
| Expansion counters | `World-Expansion-Index.json` (9-line count summary) |

## CONVENTIONS
- Every projection is a generated JSON envelope whose provenance carries `original_anchor: lore/World-Narrative-Atlas.json` and the atlas `original_hash`; the atlas machine registries (e.g. `monster_contents`) are canon and the split pages are views of them.
- Projection rendering and checking live in `scripts/` (`generate-catalog.mjs`, `world-atlas-render.mjs`, `gate.mjs`); the hash names the atlas Markdown that was rendered.
- Entity IDs are permanent, never renumbered: humans `K001–K412` (Cast-Index row order), states `S01–S16`, houses `HCxx`/`HPxx`, external theaters `XT01–XT05`, synthetics `H/F/V01–16`, hostile groups `G01–G27`, entities `GxxEyy`, batches `Mxxx`/`Bxxx`.
- Atlas prose contract: Korean 3rd-person limited 한다체 narrative, 합니다체 guidance; `source_kind` separates fact / inference / fiction; one cause-effect per paragraph.

## ANTI-PATTERNS
- Never hand-edit a projection (`bestiary/**`, `Operating-Houses.json`, `Synthetic-Actors.json`, `Regional-Physical-AI-Arcs.json`, `World-Relation-Ledger.json`, `World-Expansion-Index.json`). Edit the atlas, then re-project via the wiki tool.
- M007's ten reserved IDs remain deliberately unwritten in the WNA registry. No `Monster-Batch-*.md` projection exists.
- No real company names, logos, slogans, products, or current executives in fiction; no real institution as the subject of fictional crime.
- Synthetics: no omniscient narration, no infinite energy, no long-term complete memory, no full network access, no facility control outside the assigned sector.
- Keep the mixed shape when extending the atlas: Korean narrative prose, English structural terms, JSON `연결` fields for cross-links.
- Every proper name and displayed term follows [Korean terminology and naming](/design/Korean-Terminology-and-Naming). The rule covers states, organizations, houses, offices, people, martial schools, technology, goods, places, events and UI/data display names—not only martial arts.
