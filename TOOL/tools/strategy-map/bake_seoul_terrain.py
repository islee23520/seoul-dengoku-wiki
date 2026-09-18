"""Offline bake for the Seoul strategy map (Intent 결정 10).

Reads the verified geography bundle (z11 Mapzen GeoTIFF terrain, KOSTAT 2013
gu polygons, BBBick OSM PBF) and emits Unity-importable chunk meshes plus a
deterministic manifest. Raw rasters never enter GAME/Assets.

Usage:
  python3 TOOL/tools/strategy-map/bake_seoul_terrain.py \
      --bundle GAME-REFERENCE/data/seoul-geography-20260830 \
      --out GAME/Assets/Janseon/Data/StrategyMap/Baked [--grid 128] [--no-osm]

Determinism: sorted keys, no timestamps; running twice yields byte-identical
manifest and OBJ files.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

BUNDLE_SCHEMA = "seoul-strategy-map-v1"
ZOOM = 11
TILE_X_RANGE = range(1745, 1748)
TILE_Y_RANGE = range(792, 795)
NODATA = -32768
WEB_MERCATOR = "EPSG:3857"
WGS84 = "EPSG:4326"

ATTRIBUTION = [
    "© OpenStreetMap contributors (ODbL 1.0)",
    "Terrain: Mapzen; SRTM and GMTED2010 courtesy of the U.S. Geological Survey; ETOPO1 courtesy of NOAA where used",
    "Boundaries: KOSTAT 2013 (historical base year)",
]


class BakeError(RuntimeError):
    """Raised for missing or invalid bundle inputs; message names the file."""


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def collect_tile_paths(bundle_dir: Path) -> dict[tuple[int, int], Path]:
    root = bundle_dir / "terrain-mapzen-geotiff" / f"z{ZOOM}"
    tiles: dict[tuple[int, int], Path] = {}
    for x in TILE_X_RANGE:
        for y in TILE_Y_RANGE:
            path = root / str(x) / f"{y}.tif"
            if not path.is_file():
                raise BakeError(f"missing terrain tile: {path.relative_to(bundle_dir)}")
            tiles[(x, y)] = path
    return tiles


def read_tile(path: Path):
    import numpy as np
    import rasterio

    with rasterio.open(path) as dataset:
        if dataset.crs is None or dataset.crs.to_string() != WEB_MERCATOR:
            raise BakeError(f"unexpected CRS in {path.name}: {dataset.crs}")
        band = dataset.read(1)
        bounds = dataset.bounds
    return np.asarray(band, dtype=np.int32), (bounds.left, bounds.bottom, bounds.right, bounds.top)


def build_chunk_geometry(elev, x0_3857, y0_3857, x1_3857, y1_3857, grid, vertical_units_per_meter, water_level_meters=0.0, union_origin_x=None, union_origin_y=None):
    """Downsample the 512x512 int band to grid x grid, clamp water, exaggerate.

    Vertices are placed in union space: unless union_origin_* is given, the
    chunk is centered on its own bounds (legacy behavior). The bake passes the
    union origin so all nine chunks share one world frame.
    """
    import numpy as np

    height, width = elev.shape
    if height % grid or width % grid:
        raise BakeError(f"grid {grid} must divide tile size {width}x{height}")
    block = width // grid
    padded = elev.reshape(grid, block, grid, block)
    means = padded.mean(axis=(1, 3))
    means = np.where(means <= water_level_meters, float(water_level_meters), means)
    means = np.where(means == NODATA, float(water_level_meters), means)

    origin_x = (x0_3857 + x1_3857) * 0.5 if union_origin_x is None else union_origin_x
    origin_y = (y0_3857 + y1_3857) * 0.5 if union_origin_y is None else union_origin_y
    scale = 0.001  # 1 Unity unit = 1 km of EPSG:3857 distance

    vertices: list[tuple[float, float, float]] = []
    uvs: list[tuple[float, float]] = []
    wx0 = (x0_3857 - origin_x) * scale
    wx1 = (x1_3857 - origin_x) * scale
    wz0 = -(y1_3857 - origin_y) * scale  # north edge
    wz1 = -(y0_3857 - origin_y) * scale  # south edge
    for row in range(grid):  # row 0 = north edge (y1)
        world_z = -((y1_3857 - row * (y1_3857 - y0_3857) / (grid - 1)) - origin_y) * scale
        for col in range(grid):
            world_x = ((x0_3857 + col * (x1_3857 - x0_3857) / (grid - 1)) - origin_x) * scale
            world_y = float(means[row, col]) * vertical_units_per_meter
            vertices.append((world_x, world_y, world_z))
            u = (world_x - wx0) / (wx1 - wx0) if wx1 != wx0 else 0.0
            v = (world_z - wz0) / (wz1 - wz0) if wz1 != wz0 else 0.0
            uvs.append((u, v))

    faces: list[tuple[int, int, int]] = []
    for row in range(grid - 1):
        for col in range(grid - 1):
            a = row * grid + col
            b = a + 1
            c = a + grid
            d = c + 1
            # Unity renders faces wound clockwise when seen from the visible side;
            # this winding shows the top surface from +Y looking down.
            faces.append((a + 1, b + 1, c + 1))  # 1-indexed OBJ
            faces.append((b + 1, d + 1, c + 1))

    stats = {
        "minElevMeters": float(means.min()),
        "maxElevMeters": float(means.max()),
        "vertexCount": len(vertices),
        "faceCount": len(faces),
    }
    return vertices, uvs, faces, stats


def write_obj(path: Path, vertices, uvs, faces, comment: str) -> None:
    lines = [f"# {comment}"]
    for x, y, z in vertices:
        lines.append(f"v {x:.6f} {y:.6f} {z:.6f}")
    for u, v in uvs:
        lines.append(f"vt {u:.6f} {v:.6f}")
    for a, b, c in faces:
        lines.append(f"f {a}/{a} {b}/{b} {c}/{c}")
    path.write_text("\n".join(lines) + "\n", encoding="ascii")


def project_bounds():
    x0, y0, x1, y1 = math.inf, math.inf, -math.inf, -math.inf
    return x0, y0, x1, y1


def bake_gu_boundaries(bundle_dir: Path, origin_x, origin_y, scale):
    import json as _json

    from rasterio.warp import transform as rio_transform

    source = bundle_dir / "boundaries-kostat-2013" / "seoul_municipalities_geo.json"
    if not source.is_file():
        raise BakeError(f"missing gu boundaries: {source.relative_to(bundle_dir)}")
    data = _json.loads(source.read_text(encoding="utf-8"))
    features = data["features"] if "features" in data else [data]
    shapes = []
    for feature in features:
        name = feature.get("properties", {}).get("name", "")
        rings: list[list[list[float]]] = []
        geom = feature.get("geometry", {})
        if geom.get("type") == "Polygon":
            rings = [geom["coordinates"][0]]
        elif geom.get("type") == "MultiPolygon":
            rings = [poly[0] for poly in geom["coordinates"]]
        outlines = []
        for ring in rings:
            lons = [pt[0] for pt in ring]
            lats = [pt[1] for pt in ring]
            xs, ys = rio_transform(WGS84, WEB_MERCATOR, lons, lats)
            outline = [
                [round((x - origin_x) * scale, 6), round(-(y - origin_y) * scale, 6)]
                for x, y in zip(xs, ys)
            ]
            if len(outline) >= 2:
                outlines.append(outline)
        if outlines:
            shapes.append({"name": name, "outlines": outlines})
    shapes.sort(key=lambda s: s["name"])
    return shapes


def bake_osm_lines(bundle_dir: Path, origin_x, origin_y, scale):
    """Water and rail lines from the current OSM PBF (offline bake only)."""
    import osmium

    pbf = bundle_dir / "osm-current-bbbike" / "Seoul.osm.pbf"
    if not pbf.is_file():
        raise BakeError(f"missing OSM PBF: {pbf.relative_to(bundle_dir)}")

    keep_tags = {
        ("waterway",): ("river", "stream", "canal"),
        ("natural",): ("water",),
        ("railway",): ("rail", "subway", "light_rail"),
    }

    lines: list[dict] = []

    from rasterio.warp import transform as rio_transform

    class WayHandler(osmium.SimpleHandler):
        def way(self, w):
            tags = w.tags
            kind = None
            for (key,), values in keep_tags.items():
                value = tags.get(key)
                if value in values:
                    kind = f"{key}-{value}"
                    break
            if kind is None:
                return
            coords = []
            lons = []
            lats = []
            for node in w.nodes:
                loc = node.location
                if loc.valid():
                    # pyosmium hands out WGS84 as 1e7-scaled integers; project to EPSG:3857.
                    lons.append(loc.x / 1e7)
                    lats.append(loc.y / 1e7)
            if len(lons) >= 2:
                xs, ys = rio_transform(WGS84, WEB_MERCATOR, lons, lats)
                coords = [
                    [round((x - origin_x) * scale, 6), round(-(y - origin_y) * scale, 6)]
                    for x, y in zip(xs, ys)
                ]
            if len(coords) >= 2:
                lines.append({"kind": kind, "points": coords})

    locations = osmium.index.create_map("flex_mem")
    locator = osmium.NodeLocationsForWays(locations)
    locator.ignore_errors()
    handler = WayHandler()
    with osmium.io.Reader(str(pbf)) as reader:
        osmium.apply(reader, locator, handler)

    lines.sort(key=lambda item: (item["kind"], len(item["points"]), item["points"][0]))
    return lines


def bundle_input_hashes(bundle_dir: Path, tile_paths) -> list[dict]:
    inputs = []
    sources = [
        *tile_paths.values(),
        bundle_dir / "boundaries-kostat-2013" / "seoul_municipalities_geo.json",
        bundle_dir / "osm-current-bbbike" / "Seoul.osm.pbf",
    ]
    for path in sources:
        inputs.append({"path": str(path.relative_to(bundle_dir)), "sha256": sha256_file(path)})
    inputs.sort(key=lambda item: item["path"])
    return inputs


def bake(bundle_dir: Path, out_dir: Path, grid: int = 128, vertical_units_per_meter: float = 0.025,
         include_osm: bool = True) -> dict:
    import numpy as np

    bundle_dir = Path(bundle_dir).resolve()
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    tile_paths = collect_tile_paths(bundle_dir)
    tiles = {xy: read_tile(path) for xy, path in tile_paths.items()}

    xs = [bounds[0] for _, bounds in tiles.values()] + [bounds[2] for _, bounds in tiles.values()]
    ys = [bounds[1] for _, bounds in tiles.values()] + [bounds[3] for _, bounds in tiles.values()]
    union = {"minX3857": min(xs), "minY3857": min(ys), "maxX3857": max(xs), "maxY3857": max(ys)}
    origin_x = (union["minX3857"] + union["maxX3857"]) * 0.5
    origin_y = (union["minY3857"] + union["maxY3857"]) * 0.5
    scale = 0.001

    chunks = []
    for (x, y) in sorted(tiles):
        elev, bounds = tiles[(x, y)]
        vertices, uvs, faces, stats = build_chunk_geometry(
            elev, bounds[0], bounds[1], bounds[2], bounds[3],
            grid=grid, vertical_units_per_meter=vertical_units_per_meter,
            union_origin_x=origin_x, union_origin_y=origin_y,
        )
        obj_name = f"chunk-{x}-{y}.obj"
        write_obj(
            out_dir / obj_name, vertices, uvs, faces,
            comment=f"seoul-strategy-map chunk z{ZOOM}/{x}/{y} (decision 10)",
        )
        world_min_x = (bounds[0] - origin_x) * scale
        world_max_x = (bounds[2] - origin_x) * scale
        world_min_z = -(bounds[3] - origin_y) * scale
        world_max_z = -(bounds[1] - origin_y) * scale
        chunks.append({
            "x": x, "y": y, "obj": obj_name,
            "sha256": sha256_file(out_dir / obj_name),
            "vertexCount": stats["vertexCount"],
            "faceCount": stats["faceCount"],
            "minElevMeters": stats["minElevMeters"],
            "maxElevMeters": stats["maxElevMeters"],
            "boundsUnits": {
                "minX": round(world_min_x, 6), "maxX": round(world_max_x, 6),
                "minZ": round(world_min_z, 6), "maxZ": round(world_max_z, 6),
            },
        })

    gu_shapes = bake_gu_boundaries(bundle_dir, origin_x, origin_y, scale)
    gu_path = out_dir / "gu-boundaries.json"
    gu_path.write_text(json.dumps({"kind": "gu-boundaries", "shapes": gu_shapes}, ensure_ascii=False, sort_keys=True), encoding="utf-8")

    overlays = {"guBoundaries": "gu-boundaries.json", "guCount": len(gu_shapes)}
    if include_osm:
        osm_lines = bake_osm_lines(bundle_dir, origin_x, origin_y, scale)
        osm_path = out_dir / "osm-lines.json"
        osm_path.write_text(json.dumps({"kind": "osm-lines", "lines": osm_lines}, ensure_ascii=False, sort_keys=True), encoding="utf-8")
        overlays["osmLines"] = "osm-lines.json"
        overlays["osmLineCount"] = len(osm_lines)

    manifest = {
        "schema": BUNDLE_SCHEMA,
        "source": {
            "bundle": str(bundle_dir.name),
            "inputs": bundle_input_hashes(bundle_dir, tile_paths),
        },
        "params": {
            "zoom": ZOOM,
            "grid": grid,
            "verticalUnitsPerMeter": vertical_units_per_meter,
            "horizontalUnitsPer3857Meter": scale,
            "waterLevelMeters": 0.0,
            "nodata": NODATA,
        },
        "chunks": chunks,
        "overlays": overlays,
        "attribution": ATTRIBUTION,
    }
    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, sort_keys=True, indent=2) + "\n",
        encoding="utf-8",
    )
    return manifest


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--grid", type=int, default=128)
    parser.add_argument("--no-osm", dest="include_osm", action="store_false")
    args = parser.parse_args(argv)

    bundle = Path(args.bundle)
    if not bundle.is_dir():
        print(f"bake: bundle not found: {bundle}", file=sys.stderr)
        return 2
    try:
        manifest = bake(bundle, Path(args.out), grid=args.grid, include_osm=args.include_osm)
    except BakeError as exc:
        print(f"bake: {exc}", file=sys.stderr)
        return 3
    print(json.dumps({
        "schema": manifest["schema"],
        "chunks": len(manifest["chunks"]),
        "guCount": manifest["overlays"]["guCount"],
        "osmLineCount": manifest["overlays"].get("osmLineCount", 0),
        "out": str(Path(args.out) / "manifest.json"),
    }))
    return 0


if __name__ == "__main__":
    sys.exit(main())
