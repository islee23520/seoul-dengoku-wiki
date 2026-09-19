# LORE/regions — 427-dong region content data and its pipeline

Earned its file: score ~13 (33 files, 94% structured JSON, own README + sources ledger with pinned hashes, consumed by TOOL/tools/regions pipeline and GDD view layer); distinct domain — authored game data over observed GIS sources, separate from the prose canon.

## OVERVIEW
Final authored content for Seoul's 427 행정동 (2026-07-01 boundaries): 25 gu JSON files, the 334-station opening-day interior ledger, and the pinned boundary/source records that regenerate the region atlas.

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Unit, dates, licenses, checksums | `README.md` (Korean) — unit is the 427 dong, as_of 2026-09-12, admdongkor boundary SHA-256-pinned (CC BY 4.0 / 공공누리 1유형), OSM ODbL |
| One gu's authored dong content | `content/<구코드>.json` (11110=종로구 … 11740), schema `seoul-region-content.v1` |
| Station interiors (334) | `station-interiors.json`, schema `station-interior.v1`; built by `TOOL/tools/regions/fill_station_interiors.py` |
| Boundary choice + comparison | `sources/selection.json`, `sources/boundary-comparison.json`; raw geojson is gitignored but present on disk |
| Observed floor-count joins | `sources/observed-levels-join.md` — 265/334 observed (OA-11572 CSV, OSM, 위키백과); 69 remain empty |
| Pipeline code | `TOOL/tools/regions/` — prepare_boundary, build_region_atlas, assemble_region_content, verify_region_atlas, check_authored_district, tests |
| Evidence + view outputs | `.omo/evidence/seoul-regions/` (regenerated, ~291MB); view at `GDD/system-design/regions/` (`index.html`, `atlas-data.js`) |

## CONVENTIONS
- Provenance split per dong: places/tags observed; boundary/area/affiliation computed (EPSG:5179); post-collapse inhabitants and events fiction. `source_kind: original-fiction` + `fictional_epoch: opening-day` — verifier-enforced.
- Verifier-required content keys: title, summary, inhabitants, livelihood, production, shortages, hazard, action, opening_state, connections, uncertainty, anchor_refs, canon_refs, polity_contexts. `buildings` is 1–4 rows: `role` core-station|support (observed use 역 ⇒ core-station), `river` ∈ hangang-north/hangang-south/tributary/inland, `anchor_ref` must be one of that dong's local anchors.
- `polity_contexts` ⊆ S01–S16 (`verify_region_atlas.py` allowed_polities). `anchor_refs` are OSM ids (`osm:node|way|relation:<id>`).
- Area denominator is the 427 dong; the 334 stations are the movement graph, not an area roster. The union area 606,223,725.0069752㎡ must survive regeneration.
- STALE PRE-REORG PATHS (commit befb8ba9 moved docs/game-logic → LORE): README command block says `tools/regions`, `docs/game-logic/regions`, `system-design/regions` — real paths are `TOOL/tools/regions`, `LORE/regions`, `GDD/system-design/regions`; README links `../Building-Reuse-Geography.md` / `../Scenario-Timeline.md` actually live at `../places/` / `../chronology/`.
- All 427 `canon_refs` in content still carry the `docs/game-logic/…` prefix; `verify_region_atlas.py` resolves each ref against the repo root and emits `invalid_canon_reference` (docs/ no longer exists). Fixing means rewriting refs to `LORE/…` (or restoring a docs alias) — decide once, not per file.

## ANTI-PATTERNS
- Never invent observed values: the 69 stations without a floor-count source stay empty ("키 없이 받은 출처만 붙인다"); nearest-building joins are wrong-building errors.
- Boundary adjacency alone never creates a movement edge; same-name facilities are never merged into one; unnamed OSM objects stay in the ledger.
- OSM tags alone never assert an institution's opening-day operation; never borrow another gu's facility by name alone.
- Style score and character count are not content verdicts; `.omo/evidence/` existing is not completion.
- Do not advance next-spring will / autumn procession / winter arms-train events to opening day (opening = 임하준 실종 + 중앙 계약 만료 only).

## COMMANDS
```bash
python3 TOOL/tools/regions/prepare_boundary.py                  # pinned-URL fetch, saves only on SHA-256 match
python3 -m unittest discover -s TOOL/tools/regions -p 'test_*.py'
python3 TOOL/tools/regions/build_region_atlas.py --as-of 2026-09-12 \
  --source-root ../seoul-kenshi-data/seoul-geography-20260830 \
  --boundary LORE/regions/sources/admdongkor-20260701.geojson \
  --output .omo/evidence/seoul-regions/atlas.json
python3 TOOL/tools/regions/assemble_region_content.py \
  --atlas .omo/evidence/seoul-regions/atlas.json \
  --content-dir LORE/regions/content --view-dir GDD/system-design/regions
python3 TOOL/tools/regions/verify_region_atlas.py --atlas .omo/evidence/seoul-regions/atlas.json
```
Atlas rebuild needs the external sibling bundle `../seoul-kenshi-data/seoul-geography-20260830` (outside the repo; not present on this checkout).
