# Dated Seoul region pipeline

This offline pipeline reads the original bundle without changing it. Installed
Python, pyosmium, Shapely, Rasterio/GDAL, and NumPy are sufficient; no pyproj or
package installation is required.

## Commands

```sh
python3 -m unittest discover -s Tool/regions -p 'test_*.py'
python3 Tool/regions/build_region_atlas.py --as-of 2026-09-12 --source-root ../seoul-kenshi-data/seoul-geography-20260830 --boundary .omo/evidence/seoul-regions/sources/admdongkor-20260701.geojson --output .omo/evidence/seoul-regions/atlas.json
python3 Tool/regions/verify_region_atlas.py --atlas .omo/evidence/seoul-regions/atlas.json --geometry-only
python3 Tool/regions/verify_region_atlas.py --atlas .omo/evidence/seoul-regions/atlas.json
```

The final command intentionally exits 1 while dong content is null. Geometry-only
success is explicitly intermediate, never a complete authored-atlas claim.
Rebuilding overwrites generated artifacts, including authored content if added to
atlas.json; do not rebuild over phase3 writing without preserving that work.

## Data interpretation

- Stable region IDs are `region:<10-digit adm_cd2>`; district IDs are `gu:<sgg>`.
- `geometry` is WGS84 GeoJSON. `geometry_5179` is the canonical metric geometry,
  retained without round-trip reprojection or arbitrary snapping. Cleanup subtracts
  earlier stable-ID owners and preserves every positive-area fragment.
- The candidate universe is every tagged node and every way/relation. Untagged
  nodes are explicitly counted as structural dependencies, not silently discarded.
- `objects.jsonl.gz` has one record per candidate, including outside and quarantine.
  `id` is `osm:<primitive>:<source ID>`. Tags retain source values except contact
  fields; addresses remain. No source contributor account metadata is copied.
- `members` retains relation source order, member IDs, types and roles. Multipolygon
  and boundary areas use libosmium assembly; ordinary relations retain actual
  member geometry collections, never lines connecting stop points. Failed or
  incomplete geometry has a quarantine reason.
- Membership uses all intersecting dongs. Primary ownership ranks intersection
  area, then length, then stable ID. Boundary points retain all memberships and
  choose the smallest ID. No name-based or interchange-object deduplication occurs.
- Station IDs include rail/subway station-class objects; platforms, bus stops,
  entrances and hotels cannot become station counts merely by name. Counts refer
  to OSM objects, not an official deduplicated station roster.
- Building and road context remain in the ledger and profile counts, even without
  named POIs or stations. `profile.landuse` records tag counts, not additive land
  area: classes overlap and cross-boundary objects occur in multiple profiles.
- Each profile selects up to 12 real named anchor representatives. This is a
  writing aid, not the complete facility list. Full facility membership is retained
  in `facility_ids` and the object ledger. Terrain uses valid native raster cell
  centers; no slope, travel safety, or observation date is invented.
- `shared_boundary_neighbors` is surface adjacency with `travel_edge: false`.
  No navigability is inferred across rivers or through unverified infrastructure.
- The 2013 boundary is comparison provenance only, not part of the selected mask.

## Implementation ownership

`spatial.py` owns canonical partition/membership checks; `osm_source.py` owns
original primitive extraction; `provenance.py` owns pinned source metadata;
`profiles.py` owns measured writer context. Build and verify CLIs compose these
narrow modules. The verifier reopens every serialized artifact and rereads the
original PBF to reconcile all candidate IDs, raw geometry, tags, dates, memberships,
profile counts, source fingerprints and statuses. It does not accept summary
counts as proof.

Strict content validation currently rejects missing content and requires the
contract's inhabitants, livelihood, production, shortages, hazard and quantitative
player-choice concepts. Phase3 owns authored local content; this pipeline does not
claim to verify literary quality or fictional regional distinction mechanically.

## Evidence

`.omo/evidence/seoul-regions/phase2/dataset/` contains genuine behavioral RED logs,
the 18-test GREEN log, the first raster-window build failure and its regression
RED, successful build/verification logs, fresh Pyright and Ruff checks, and a
30-artifact byte-identical repeat-build comparison. Rasterio emits upstream
PendingDeprecationWarning messages in the raster fixture; these are not suppressed.
`summary.json` records exact counts and command exits.

The host LSP returned stale snapshots for newly created imports and old Window
calls; `pyright Tool/regions` was run directly on the final files and reports zero
errors, warnings, or informations. No diagnostics or tests are disabled.
