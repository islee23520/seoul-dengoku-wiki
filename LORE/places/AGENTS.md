# LORE/places — world-map design data and station geography

Earned its file: score ~9 (`Seoul-Station-Catalog.md` feeds `RouteGraph.CreateSeoul()`; `Building-Reuse-Geography.md` is the declared canon governing `content.buildings` in regions; `World-Map-Construction.md` is the assembly hub); distinct domain — design data between prose canon and the Unity runtime.

## OVERVIEW
How the opening-day Seoul map is built: the 334-station catalog the runtime reads, the vertical layer model, map-assembly order, the station-entry procedure, and the building-reuse canon.

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Station catalog (334 stations, 25 gu) | `Seoul-Station-Catalog.md` — the table `RouteGraph.CreateSeoul()` loads; real Korean station names are the graph node names; only 영등포·신도림·구로 get runtime id aliases |
| Map assembly + runtime status | `World-Map-Construction.md` — material sources, load order, what runtime carries today |
| Vertical structure | `World-and-Subway-Layers.md` — floor/function/risk model; world truth is the station·layer·tunnel graph, not the flat admin map |
| Station interiors entry procedure | `Station-Interior-Construction.md` — how concourse/platform/facilities open when entering a station |
| Building reuse canon (강·구·동) | `Building-Reuse-Geography.md` — 정본 for `content.buildings` rows in `../regions/content/`; the minimum capture unit is a building, never a dong |
| Dong opening-day states | `Building-Reuse-Geography.md` — every dong opens in one of three states; flags/occupation numbers continue in `../economy/Strongholds-and-Territory.md` |

## CONVENTIONS
- 334 stations = movement-graph roster; 427 dong = area denominator (`../regions/README.md`). The two counts never substitute for each other.
- `CreateSeoul()` loads catalog 334 + 435 OSM adjacencies; 영등포—신도림 and 신도림—구로 edges kept, 영등포—구로 deliberately absent; `CreateYeongdeungpoSindorimGuro()` stays as the Area-1 three-station pilot.
- OSM PBF and this catalog never go into Unity Assets; geography reference files live outside the game repo.
- Catalog provenance: OSM BBBike Seoul.osm.pbf points (railway=station/halt, station=subway) clipped to KOSTAT 2013 gu polygons — ODbL 1.0 + Statistics Korea attribution stays with the table.
- Opening-day interior state per station lives in `../regions/station-interiors.json`, not in these docs.
- Frontmatter is optional here: `Station-Interior-Construction.md` and `Seoul-Station-Catalog.md` carry YAML (domain/title/summary), the rest carry none.
- Cross-links reach outside LORE (`../economy`, `../factions`, `../regions`, `../../GAME-LOGIC`) and all resolve as of 2026-09-19; several are self-dir-prefixed (`../places/…` from inside places/) — pre-reorg relics that still resolve, but re-check after any file move. Isometric diagrams are remote GitHub URLs; the SVGs live in `GAME-REFERENCE/assets/wiki/`.

## ANTI-PATTERNS
- Observed floor counts stay empty until the 건축물대장 join — never fill them with fiction.
- Station-entry gameplay is unimplemented (no entry command, interior grid spawn, or facility slots); only the Area-1 pilot closes 이동·교섭·우회·전투·정산 — don't build on an assumed implementation.
- Station-based 배급·통행세·숙영·피난 look at the station building first; schools/주민센터/병원 stay support buildings — don't flip roles ad hoc against the Building-Reuse canon.
