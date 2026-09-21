# REGIONS KNOWLEDGE BASE

## OVERVIEW
Offline dated-Seoul geography atlas pipeline reading an immutable source bundle; score 13, distinct data domain (dense interpretation contracts, shared helpers).

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Data-interpretation contract | `README.md` | Authoritative rules: IDs, geometry, membership, quarantine |
| Atlas build and verify | `build_region_atlas.py`, `verify_region_atlas.py` | `--as-of/--source-root/--boundary/--output`; verify has `--geometry-only` |
| Authored content | `assemble_region_content.py`, `check_authored_district.py` | Prose assembly and authored-district gate |
| Official-wiki map input | `data/atlas-data.js` | Generated 427-dong geometry/content projection; not a public viewer |
| Interior/floor fill | `fill_station_interiors.py`, `fill_building_floors.py` | Structural fill scripts |
| Shared helpers | `provenance.py`, `spatial.py`, `osm_source.py`, `profiles.py`, `prepare_boundary.py` | SHA-256 provenance, projection, OSM reading, profiles |
| Tests | `test_region_atlas.py`, `test_content_assembly.py`, `test_publication.py`, `test_station_interiors.py` | unittest discovery pattern |

## CONVENTIONS
- Python with pyosmium, Shapely, Rasterio/GDAL and NumPy; no pyproj, no package install required.
- Stable IDs are `region:<10-digit adm_cd2>` and `gu:<sgg>`. `geometry` is WGS84 GeoJSON; `geometry_5179` is the canonical metric geometry, never round-tripped or snapped.
- Every artifact carries source hashes via `provenance.py`; provenance pins, not mod dates.
- Rebuild overwrites generated artifacts, including authored content folded into `atlas.json`; preserve authored work before rebuilding.
- Membership uses all intersecting dongs; primary ownership ranks intersection area, then length, then stable ID.

## COMMANDS
From repository root. README examples can spell the legacy `Tool/` prefix; use `TOOL/`.
```bash
python3 -m unittest discover -s TOOL/tools/regions -p 'test_*.py'
python3 TOOL/tools/regions/build_region_atlas.py --as-of <date> --source-root <bundle> --boundary <geojson> --output <atlas.json>
python3 TOOL/tools/regions/verify_region_atlas.py --atlas <atlas.json> [--geometry-only]
```

## ANTI-PATTERNS
- Geometry-only success or `travel_edge: false` surface adjacency is intermediate, never authored completion or navigability.
- Do not replace original-source verification with summary counts.
- Do not rebuild over authored content without preserving it.
- Do not reproject, round-trip, or snap `geometry_5179`; fragments and boundary-point memberships are deliberate.
