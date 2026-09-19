# STRATEGY-MAP KNOWLEDGE BASE

## OVERVIEW
Offline deterministic bakes of the Seoul strategy map (terrain meshes, 16-state texture, buildings, landmark decimation); score 12, distinct bake domain.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Terrain bake | `bake_seoul_terrain.py` | Chunk OBJ meshes + manifest; `BUNDLE_SCHEMA seoul-strategy-map-v1`; stdlib only |
| Texture bake | `bake_map_texture.py` | 16-state tinting, hillshade, landcover rasterization; imports the terrain module; needs rasterio+numpy |
| Buildings | `bake_buildings.py` | Height estimation, OBB placement, binary validation; needs numpy (+rasterio warp) |
| Landmarks | `landmarks_pipeline.py` | Decimates Tripo GLBs (~1.9M → ~40k tris) into `GAME/Assets/Janseon/Data/StrategyMap/Landmarks/`; needs trimesh+Pillow |
| Identity check | `verify_seoul_identity.py` | rasterio/numpy sanity check on baked output |
| Tests | `test_bake_seoul_terrain.py` | Plain exit-0/1 runner against `GAME-REFERENCE/data/seoul-geography-20260830` |

## CONVENTIONS
- Determinism is the contract: sorted keys, no timestamps; rerunning yields byte-identical manifest and OBJ files.
- Bundle inputs: z11 Mapzen GeoTIFF terrain, KOSTAT 2013 gu polygons, BBBick OSM PBF; the attribution strings (ODbL, USGS/NOAA, KOSTAT) are part of the bundle contract.
- Raw rasters never enter `GAME/Assets`; baked output goes to `GAME/Assets/Janseon/Data/StrategyMap/Baked/`.
- The directory name contains a hyphen: run scripts by path, never `python -m` (a hyphenated path is not a module).

## COMMANDS
From repository root.
```bash
python3 TOOL/tools/strategy-map/bake_seoul_terrain.py --bundle GAME-REFERENCE/data/seoul-geography-20260830 --out GAME/Assets/Janseon/Data/StrategyMap/Baked [--grid 128] [--no-osm]
python3 TOOL/tools/strategy-map/bake_map_texture.py --bundle GAME-REFERENCE/data/seoul-geography-20260830 --out <dir> [--grid 128]
python3 TOOL/tools/strategy-map/test_bake_seoul_terrain.py
```

## ANTI-PATTERNS
- Do not introduce timestamps, dict ordering, or float formatting that breaks byte-identical reruns.
- Do not copy source rasters or the OSM PBF into `GAME/Assets`.
- Do not drop or rewrite the attribution strings when re-baking.
