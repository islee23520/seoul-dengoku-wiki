# LORE/places — world-map design data and station geography

Earned its file: score ~9 (`Seoul-Station-Catalog.json` is the prose record of the 334-station roster; `Building-Reuse-Geography.json` is the declared canon governing `content.buildings` in regions; `World-Map-Construction.json` is the assembly hub); distinct domain — design data between prose canon and the Unity runtime.

## OVERVIEW
How the opening-day Seoul map is built: the 334-station catalog, the vertical layer model, map-assembly order, the station-entry procedure, and the building-reuse canon.

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Station catalog (334 stations, 25 gu) | `Seoul-Station-Catalog.json` — the station table for readers; the Unity runtime does not read it. The runtime graph comes from the generated C# `SeoulWorldGraphCatalog` (OSM + KOSTAT) in GAME; real Korean station names are the graph node names; only 영등포·신도림·구로 get runtime id aliases |
| Map assembly + runtime status | `World-Map-Construction.json` — material sources, load order, what runtime carries today |
| Vertical structure | `World-and-Subway-Layers.json` — floor/function/risk model; world truth is the station·layer·tunnel graph, not the flat admin map |
| Station interiors entry procedure | `Station-Interior-Construction.json` — how concourse/platform/facilities open when entering a station |
| Building reuse canon (강·구·동) | `Building-Reuse-Geography.json` — 정본 for `content.buildings` rows in `../regions/content/`; the minimum capture unit is a building, never a dong |
| Dong opening-day states | `Building-Reuse-Geography.json` — every dong opens in one of three states; flags/occupation numbers continue in GDD `rules/Rules-Strongholds` |

## CONVENTIONS
- 334 stations = movement-graph roster; 427 dong = area denominator (`../regions/README.md`). The two counts never substitute for each other.
- `CreateSeoul()` loads the generated `SeoulWorldGraphCatalog` (334 stations + 435 OSM adjacencies), not this page; 영등포—신도림 and 신도림—구로 edges kept, 영등포—구로 deliberately absent; `CreateYeongdeungpoSindorimGuro()` stays as the Area-1 three-station pilot.
- OSM PBF and this catalog never go into Unity Assets; geography reference files live outside the game repo.
- Catalog provenance: OSM BBBike Seoul.osm.pbf points (railway=station/halt, station=subway) clipped to KOSTAT 2013 gu polygons — ODbL 1.0 + Statistics Korea attribution stays with the table.
- Opening-day interior state per station lives in `../regions/station-interiors.json`, not in these docs.
- Pages are JSON authoring documents: title and summary live in `locales`, and no page carries YAML frontmatter or a committed Markdown copy.
- Cross-links reach outside LORE (`../factions`, `../regions`, GDD rules) and must resolve after domain moves. Retired diagrams are no longer publication inputs.

## ANTI-PATTERNS
- Observed floor counts stay empty until the 건축물대장 join — never fill them with fiction.
- Station-entry gameplay is unimplemented (no entry command, interior grid spawn, or facility slots); only the Area-1 pilot closes 이동·교섭·우회·전투·정산 — don't build on an assumed implementation.
- Station-based 배급·통행세·숙영·피난 look at the station building first; schools/주민센터/병원 stay support buildings — don't flip roles ad hoc against the Building-Reuse canon.
