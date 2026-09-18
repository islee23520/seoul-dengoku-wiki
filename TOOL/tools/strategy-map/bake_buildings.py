"""Bake simplified 3D building instances for the Seoul strategy map (decision 10).

Contract (adapted from the Seoul 3D Atlas white paper):
- Buildings come from OSM footprints (locations + footprints are real data).
- Geometry is simplified to an oriented bounding box per footprint.
- Height = building:levels x 3.2m, else explicit height tag, else an estimate
  from footprint area (clearly an estimate, disclosed in the manifest).
- Output: one binary per chunk — 16-byte header (magic SBLD, version, count)
  then 28-byte records (cx, cz, baseY, w, d, rot, h) as little-endian float32 in
  world units (same union frame as the terrain meshes).
- Validation: file length == 16 + 28 * count; counts recorded in the manifest.

Determinism: buildings sorted by (cx, cz, rot) before writing; no timestamps.
"""
from __future__ import annotations

import argparse
import json
import struct
import sys
from pathlib import Path

import numpy as np
from rasterio.warp import transform as rio_transform

from bake_seoul_terrain import (
    BakeError,
    collect_tile_paths,
    read_tile,
    sha256_file,
)
from bake_map_texture import collect_osm_features, WGS84, WEB_MERCATOR

MAGIC = b"SBLD"
VERSION = 1
RECORD = struct.Struct("<7f")
HEADER = struct.Struct("<4sII4x")  # 16 bytes: magic, version, count, 4 reserved
FALLBACK_LEVEL_HEIGHT_M = 3.2
GU_AREA_CAP = 120_000  # ignore stadium-scale polygons that are clearly not buildings


def parse_height(tags) -> float | None:
    raw = tags.get("height")
    if raw:
        try:
            return float(str(raw).split()[0])
        except ValueError:
            pass
    levels = tags.get("building:levels")
    if levels:
        try:
            return float(levels) * FALLBACK_LEVEL_HEIGHT_M
        except ValueError:
            pass
    return None


def estimated_height(area_m2: float) -> float:
    """Area-based estimate when OSM carries no height; disclosed as estimate."""
    if area_m2 < 200:
        return 9.0
    if area_m2 < 1_000:
        return 15.0
    if area_m2 < 5_000:
        return 24.0
    return 34.0


def obb_from_ring(xs: np.ndarray, ys: np.ndarray):
    """Oriented bounding box via PCA of the footprint ring (world x/z)."""
    pts = np.stack([xs, ys], axis=1)
    centered = pts - pts.mean(axis=0)
    cov = centered.T @ centered
    eigenvalues, eigenvectors = np.linalg.eigh(cov)
    axis = eigenvectors[:, -1]
    proj = centered @ axis
    perp = centered @ eigenvectors[:, 0]
    length = float(proj.max() - proj.min())
    width = float(perp.max() - perp.min())
    rotation = float(np.arctan2(axis[1], axis[0]))
    return pts.mean(axis=0), length, width, rotation


def collect_buildings(pbf: Path):
    """Yield (tags, ring) for building ways with usable geometry."""
    import osmium

    out = []

    class Handler(osmium.SimpleHandler):
        def way(self, w):
            tags = w.tags
            if not (tags.get("building") or tags.get("building:part")):
                return
            pts = []
            for node in w.nodes:
                loc = node.location
                if loc.valid():
                    pts.append((loc.x / 1e7, loc.y / 1e7))
            if len(pts) >= 4 and pts[0] == pts[-1]:
                out.append((dict(tags), pts))

    locations = osmium.index.create_map("flex_mem")
    locator = osmium.NodeLocationsForWays(locations)
    locator.ignore_errors()
    handler = Handler()
    with osmium.io.Reader(str(pbf)) as reader:
        osmium.apply(reader, locator, handler)
    return out


def bake_buildings(bundle_dir: Path, baked_dir: Path, vertical_units_per_meter: float = 0.012) -> dict:
    bundle_dir = Path(bundle_dir).resolve()
    baked_dir = Path(baked_dir)
    pbf = bundle_dir / "osm-current-bbbike" / "Seoul.osm.pbf"
    if not pbf.is_file():
        raise BakeError(f"missing OSM PBF: {pbf}")

    tile_paths = collect_tile_paths(bundle_dir)
    tiles = {xy: read_tile(p) for xy, p in tile_paths.items()}
    union_x = [b[0] for _, b in tiles.values()] + [b[2] for _, b in tiles.values()]
    union_y = [b[1] for _, b in tiles.values()] + [b[3] for _, b in tiles.values()]
    origin_x = (min(union_x) + max(union_x)) * 0.5
    origin_y = (min(union_y) + max(union_y)) * 0.5
    scale = 0.001

    chunk_bounds = {}
    for (x, y), (_, bounds) in tiles.items():
        chunk_bounds[(x, y)] = (
            (bounds[0] - origin_x) * scale,
            (bounds[2] - origin_x) * scale,
            -(bounds[3] - origin_y) * scale,
            -(bounds[1] - origin_y) * scale,
        )

    # Smoothed terrain lattices (same pipeline as the mesh bake) for base heights.
    from bake_seoul_terrain import build_chunk_geometry
    lattices = {}
    for (x, y), (band, bounds) in tiles.items():
        vertices, _, _, _, _ = build_chunk_geometry(
            band, bounds[0], bounds[1], bounds[2], bounds[3],
            grid=200, vertical_units_per_meter=vertical_units_per_meter,
            union_origin_x=origin_x, union_origin_y=origin_y,
        )
        lattice = np.asarray([[v[1] for v in vertices[r * 200:(r + 1) * 200]] for r in range(200)])
        lattices[(x, y)] = (lattice, (bounds[0] - origin_x) * scale, (bounds[2] - origin_x) * scale,
                            -(bounds[3] - origin_y) * scale, -(bounds[1] - origin_y) * scale)

    def sample_base(tx, ty, cx, cz):
        lattice, minx, maxx, minz, maxz = lattices[(tx, ty)]
        fx = np.clip((cx - minx) / (maxx - minx), 0, 1) * (lattice.shape[1] - 1)
        fz = np.clip((cz - minz) / (maxz - minz), 0, 1) * (lattice.shape[0] - 1)
        x0, z0 = int(fx), int(fz)
        x1, z1 = min(x0 + 1, lattice.shape[1] - 1), min(z0 + 1, lattice.shape[0] - 1)
        ax, az = fx - x0, fz - z0
        return float(
            lattice[z0, x0] * (1 - ax) * (1 - az) + lattice[z0, x1] * ax * (1 - az)
            + lattice[z1, x0] * (1 - ax) * az + lattice[z1, x1] * ax * az
        )

    print("scanning buildings …", file=sys.stderr)
    raw = collect_buildings(pbf)
    print(f"  building ways: {len(raw)}", file=sys.stderr)

    per_chunk: dict = {xy: [] for xy in sorted(tiles)}
    estimated = 0
    dropped = 0
    for tags, ring in raw:
        lons = [p[0] for p in ring]
        lats = [p[1] for p in ring]
        xs, ys = rio_transform(WGS84, WEB_MERCATOR, lons, lats)
        wx = (np.asarray(xs) - origin_x) * scale
        wz = -(np.asarray(ys) - origin_y) * scale
        area = abs(np.trapezoid(wz, wx)) / (scale * scale)  # back to m^2
        if area > GU_AREA_CAP or area < 4:
            dropped += 1
            continue
        height = parse_height(tags)
        if height is None:
            height = estimated_height(area)
            estimated += 1
        center, length, width, rotation = obb_from_ring(wx, wz)
        cx, cz = float(center[0]), float(center[1])
        for (tx, ty), (minx, maxx, minz, maxz) in chunk_bounds.items():
            if minx <= cx <= maxx and minz <= cz <= maxz:
                base_y = sample_base(tx, ty, cx, cz)
                per_chunk[(tx, ty)].append((cx, cz, base_y, length, width, rotation, height * vertical_units_per_meter))
                break

    outputs = []
    total = 0
    for (x, y), records in per_chunk.items():
        records.sort(key=lambda r: (r[0], r[1], r[4]))
        name = f"buildings-{x}-{y}.bytes"
        path = baked_dir / name
        with path.open("wb") as handle:
            handle.write(HEADER.pack(MAGIC, VERSION, len(records)))
            for rec in records:
                handle.write(RECORD.pack(*rec))
        total += len(records)
        outputs.append({
            "x": x, "y": y, "file": name, "count": len(records),
            "bytes": path.stat().st_size,
            "sha256": sha256_file(path),
            "estimatedHeights": estimated,
        })

    return {
        "totalBuildings": total,
        "dropped": dropped,
        "estimatedHeights": estimated,
        "recordBytes": RECORD.size,
        "headerBytes": HEADER.size,
        "chunks": outputs,
    }


def validate_binaries(baked_dir: Path, chunks: list[dict]) -> None:
    for chunk in chunks:
        path = baked_dir / chunk["file"]
        data = path.read_bytes()
        magic, version, count = HEADER.unpack(data[:HEADER.size])
        assert magic == MAGIC and version == VERSION, f"bad header in {path.name}"
        expected = HEADER.size + count * RECORD.size
        assert len(data) == expected, f"{path.name}: length {len(data)} != {expected}"
        assert count == chunk["count"], f"{path.name}: count mismatch"
    print(f"validated {len(chunks)} building binaries")


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args(argv)

    bundle = Path(args.bundle)
    if not bundle.is_dir():
        print(f"bake-buildings: bundle not found: {bundle}", file=sys.stderr)
        return 2
    try:
        result = bake_buildings(bundle, Path(args.out))
    except BakeError as exc:
        print(f"bake-buildings: {exc}", file=sys.stderr)
        return 3
    validate_binaries(Path(args.out), result["chunks"])
    (Path(args.out) / "buildings-manifest.json").write_text(
        json.dumps(result, ensure_ascii=False, sort_keys=True, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"total": result["totalBuildings"], "estimated": result["estimatedHeights"], "dropped": result["dropped"]}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
