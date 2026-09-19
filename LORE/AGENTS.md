# LORE root corpus — atlas canon and read-only projections

Earned its file: score 17 (124 root md files, 16 subdirs, canon→projection architecture feeding the wiki tool); distinct domain — single-source canon plus generated projections. Subdirectories are separate domains with their own AGENTS.md.

## OVERVIEW
One hand-edited canon (`World-Narrative-Atlas.md`, WNA-001, ~58k lines) plus ~120 machine-generated read-only projections with manifests, and `README.md` (Korean TOC of the whole LORE corpus).

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Change any canon fact | `World-Narrative-Atlas.md` — the only file edited by hand |
| Corpus TOC | `README.md` (Korean, relative links, links into all subdirs) |
| Hostile groups G01–G27 | `Hostile-Ecology-Index.md` (3.1k-line index) → `Hostile-Group-Gxx.md`, one group each; scenario blocks `Gxx-SCn` carry escalation tier (`단계: 1–3`), trigger, choices, moral cost |
| Monster entries `GxxEyy` | `Monster-Batch-M0xx.md` (mostly 10 entities per batch; varies 4–16 — M042 holds 16) + `Monster-Batch-Manifest.md` (batch → entity ledger) |
| Character dossiers | `Story-Batch-B0xx.md` (per character: identity, pre-collapse life, wounds, 3-act arc, branching endings) + `Story-Batch-Manifest.md` (batch → K/H tables) |
| Steward houses | `Operating-Houses.md` (corporate HC01–HC22 + civic HP01–HP10) |
| Synthetics | `Synthetic-Actors.md` (humanoid H / facility F / mobile V, 16 each) |
| Narrative arcs | `Regional-Physical-AI-Arcs.md` (`ARC-*` three-act outlines per house/region) |
| Relation edges | `World-Relation-Ledger.md` (`operates_in`, `pressures`, `custodied_by`, rivalry/partnership rows) |
| Expansion counters | `World-Expansion-Index.md` (9-line count summary) |

## CONVENTIONS
- Every projection opens with `원본 앵커: LORE/World-Narrative-Atlas.md` plus `원본 해시`; the atlas machine registries (e.g. `story_contents.B001`, `monster_contents`) are canon and the split pages are views of them.
- Projection rendering and checking live in `TOOL/tools/wiki` (`materialize-world-atlas.mjs --check`, `world-atlas-render.mjs`, `world-atlas-verify*.mjs`); the hash names the atlas Markdown that was rendered.
- Entity IDs are permanent, never renumbered: humans `K001–K412` (Cast-Index row order), states `S01–S16`, houses `HCxx`/`HPxx`, external theaters `XT01–XT05`, synthetics `H/F/V01–16`, hostile groups `G01–G27`, entities `GxxEyy`, batches `Mxxx`/`Bxxx`.
- Atlas prose contract: Korean 3rd-person limited 한다체 narrative, 합니다체 guidance; `source_kind` separates fact / inference / fiction; one cause-effect per paragraph.

## ANTI-PATTERNS
- Never hand-edit a projection (`Hostile-*`, `Monster-Batch-*`, `Story-Batch-*`, `Operating-Houses.md`, `Synthetic-Actors.md`, `Regional-Physical-AI-Arcs.md`, `World-Relation-Ledger.md`, `World-Expansion-Index.md`). Edit the atlas, then re-project via the wiki tool.
- `Monster-Batch-M007.md`, `Story-Batch-B017.md`, `Story-Batch-B020.md` do not exist by policy (미저작 — unwritten; the wiki tool rejects merging them with `E_EXCLUDED_ID`, and `TOOL/tools/wiki/confirmed-integration-manifest.json` holds the gate). Manifests still enumerate the full ranges; do not "fill the gap" without that gate.
- No real company names, logos, slogans, products, or current executives in fiction; no real institution as the subject of fictional crime.
- Synthetics: no omniscient narration, no infinite energy, no long-term complete memory, no full network access, no facility control outside the assigned sector.
- Keep the mixed shape when extending the atlas: Korean narrative prose, English structural terms, JSON `연결` fields for cross-links.
