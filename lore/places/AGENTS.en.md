---
tense: past
source_hash: 4696bc36d48bf4bf13a6efcfba5a99cc9255d0574733be20edf3bc4feb06f1e0
---

# LORE/places — world-map design data and station geography

Earned its file: score ~9 (`Seoul-Station-Catalog.md` feeds `RouteGraph.CreateSeoul()`; `Building-Reuse-Geography.md` is the declared canon governing `content.buildings` in regions; `World-Map-Construction.md` is the assembly hub); distinct domain — design data between prose canon and the Unity runtime.

## OVERVIEW
How the opening-day Seoul map is built: the 334-station catalog the runtime reads, the vertical layer model, map-assembly order, the station-entry procedure, and the building-reuse canon.

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Station catalog (334 stations, 25 gu) | `Seoul-Station-Catalog.md` — the table `RouteGraph.CreateSeoul()` loads; real Korean station names are the graph node names; only Yeongdeungpo, Sindorim, and Guro get runtime id aliases |
| Map assembly + runtime status | `World-Map-Construction.md` — material sources, load order, what runtime carries today |
| Vertical structure | `World-and-Subway-Layers.md` — floor/function/risk model; world truth is the station·layer·tunnel graph, not the flat admin map |
| Station interiors entry procedure | `Station-Interior-Construction.md` — how concourse/platform/facilities open when entering a station |
| Building reuse canon (river·gu·dong) | `Building-Reuse-Geography.md` — canon for `content.buildings` rows in `../regions/content/`; the minimum capture unit is a building, never a dong |
| Dong opening-day states | `Building-Reuse-Geography.md` — every dong opens in one of three states; flags/occupation numbers continue in `../economy/Strongholds-and-Territory.md` |

## CONVENTIONS
- 334 stations = movement-graph roster; 427 dong = area denominator (`../regions/README.md`). The two counts never substitute for each other.
- `CreateSeoul()` loads catalog 334 + 435 OSM adjacencies; the Yeongdeungpo–Sindorim and Sindorim–Guro edges are kept, Yeongdeungpo–Guro deliberately absent; `CreateYeongdeungpoSindorimGuro()` stays as the Area-1 three-station pilot.
- OSM PBF and this catalog never go into Unity Assets; geography reference files live outside the game repo.
- Catalog provenance: OSM BBBike Seoul.osm.pbf points (railway=station/halt, station=subway) clipped to KOSTAT 2013 gu polygons — ODbL 1.0 + Statistics Korea attribution stays with the table.
- Opening-day interior state per station lives in `../regions/station-interiors.json`, not in these docs.
- Frontmatter is optional here: `Station-Interior-Construction.md` and `Seoul-Station-Catalog.md` carry YAML (domain/title/summary), the rest carry none.
- Cross-links reach outside LORE (`../economy`, `../factions`, `../regions`, `../../GDD`) and must resolve after domain moves. Retired diagrams are no longer publication inputs.

## ANTI-PATTERNS
- Observed floor counts stay empty until the building-register join — never fill them with fiction.
- Station-entry gameplay is unimplemented (no entry command, interior grid spawn, or facility slots); only the Area-1 pilot closes movement, negotiation, detour, combat, and settlement — don't build on an assumed implementation.
- Station-based rationing, transit tolls, shelter, and refuge look at the station building first; schools/community centers/hospitals stay support buildings — don't flip roles ad hoc against the Building-Reuse canon.
