"""OSM landcover + 16-state region texture bake for the Seoul strategy map.

Composes, per z11 chunk, a 1024x1024 albedo texture:
- hillshade from the terrain GeoTIFF (relief)
- OSM landcover from the BBBike PBF: buildings (urban gray), vegetation
  (landuse/natural wood/forest/grass/park/farmland), water areas, rivers,
  major roads, railways
- 16-state region tint over each gu plus state borders (thick) and gu
  borders (thin) from the KOSTAT polygons + the Sixteen-States canon table

All inputs are offline and open (ODbL OSM, KOSTAT 2013, Mapzen terrain);
Google Maps tiles are NOT used (ToS forbids storage/redistribution).
Deterministic: sorted features, no timestamps.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

import numpy as np
import rasterio
from rasterio.features import rasterize
from rasterio.warp import transform as rio_transform
from rasterio.windows import from_bounds

from bake_seoul_terrain import (
    BUNDLE_SCHEMA,
    NODATA,
    WEB_MERCATOR,
    WGS84,
    BakeError,
    collect_tile_paths,
    read_tile,
    sha256_file,
)

ZOOM = 11
TEXTURE_SIZE = 2048

# Sixteen-States canon (LORE/World-Map-Construction.md 권역표 + LORE/Sixteen-States.md).
# gu name (KOSTAT "···구") -> state id; one hue per state.
STATE_OF_GU = {
    "영등포구": "west-sluice", "양천구": "west-sluice",
    "구로구": "gauge-alliance", "금천구": "gauge-alliance",
    "강서구": "inhouse-council",
    "성동구": "parts-charter",
    "강동구": "escort-protector",
    "종로구": "center-record", "중구": "center-record",
    "용산구": "center-record",
    "동작구": "settlement-guild", "관악구": "settlement-guild",
    "마포구": "cross-verify", "서대문구": "cross-verify",
    "은평구": "civil-roll", "성북구": "civil-roll", "강북구": "civil-roll",
    "도봉구": "trial-succession", "노원구": "trial-succession",
    "중랑구": "neutral-convoy",
    "동대문구": "medicine-neutral",
    "광진구": "gate-military",
    "송파구": "grain-ratify",
    "강남구": "protect-standard", "서초구": "protect-standard",
}

# 16 distinct hues (degrees) for the sixteen states, stable order by id.
def state_hue(state_id: str) -> float:
    order = sorted(set(STATE_OF_GU.values()))
    return (order.index(state_id) / len(order)) * 360.0


VEGETATION_KEYS = ("landuse",)
VEGETATION_VALUES = ("forest", "grass", "meadow", "recreation_ground", "farmland", "orchard", "vineyard", "village_green", "allotments")
NATURAL_GREEN = ("wood", "scrub", "heath", "grassland", "park", "garden")


def hsv_to_rgb(h_deg, s, v):
    h = (h_deg % 360.0) / 60.0
    i = int(h)
    f = h - i
    p, q, t = v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)
    table = [(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]
    r, g, b = table[i % 6]
    return int(r * 255), int(g * 255), int(b * 255)


def hillshade(band: np.ndarray, azimuth=315.0, altitude=45.0) -> np.ndarray:
    """Gray relief shading from an elevation grid (higher = lighter)."""
    gy, gx = np.gradient(band.astype(np.float64))
    slope = np.pi / 2.0 - np.arctan(np.sqrt(gx * gx + gy * gy))
    aspect = np.arctan2(-gx, gy)
    az = math.radians(azimuth)
    alt = math.radians(altitude)
    shaded = np.sin(alt) * np.sin(slope) + np.cos(alt) * np.cos(slope) * np.cos(az - aspect)
    return np.clip(shaded / (np.sin(alt) + 1e-9), 0, 1)


def collect_osm_features(pbf: Path):
    """Buildings / vegetation / water polygons, rivers, roads, railways as 3857 shapes."""
    import osmium

    polygons = []   # (kind, [(x,y) 3857 ring])
    lines = []      # (kind, [(x,y) 3857 ...])

    class Handler(osmium.SimpleHandler):
        def way(self, w):
            tags = w.tags
            lons, lats, pts = [], [], []
            for node in w.nodes:
                loc = node.location
                if loc.valid():
                    lons.append(loc.x / 1e7)
                    lats.append(loc.y / 1e7)
                    pts.append((loc.x / 1e7, loc.y / 1e7))
            if len(pts) < 2:
                return
            kind = None
            closed = len(pts) >= 4 and pts[0] == pts[-1]
            if closed:
                if tags.get("building") or tags.get("building:part"):
                    kind = "building"
                elif tags.get("natural") == "water" or tags.get("waterway") == "riverbank":
                    kind = "water"
                elif (tags.get("landuse") in VEGETATION_VALUES or tags.get("natural") in NATURAL_GREEN):
                    kind = "vegetation"
                if kind:
                    polygons.append((kind, pts))
                    return
            if tags.get("waterway") in ("river", "stream", "canal"):
                kind = "river"
            elif tags.get("railway") in ("rail", "subway", "light_rail"):
                kind = "rail"
            elif tags.get("highway") in ("motorway", "trunk", "primary", "secondary"):
                kind = "road"
            if kind:
                lines.append((kind, pts))

    locations = osmium.index.create_map("flex_mem")
    locator = osmium.NodeLocationsForWays(locations)
    locator.ignore_errors()
    handler = Handler()
    with osmium.io.Reader(str(pbf)) as reader:
        osmium.apply(reader, locator, handler)

    def project(pts):
        xs, ys = rio_transform(WGS84, WEB_MERCATOR, [p[0] for p in pts], [p[1] for p in pts])
        return list(zip(xs, ys))

    polygons = [(k, project(p)) for k, p in polygons]
    lines = [(k, project(p)) for k, p in lines]
    polygons.sort(key=lambda item: (item[0], len(item[1])))
    lines.sort(key=lambda item: (item[0], len(item[1])))
    return polygons, lines


def gu_shapes_world(baked_dir: Path):
    """KOSTAT gu rings as (gu_name, [(x, z) world]) — same world frame as OBJs."""
    data = json.loads((baked_dir / "gu-boundaries.json").read_text(encoding="utf-8"))
    out = []
    for shape in data["shapes"]:
        for outline in shape["outlines"]:
            out.append((shape["name"], [(p[0], -p[1]) for p in outline]))
    out.sort(key=lambda item: item[0])
    return out


def bake_textures(bundle_dir: Path, baked_dir: Path, grid: int = 128) -> dict:
    bundle_dir = Path(bundle_dir).resolve()
    baked_dir = Path(baked_dir)
    pbf = bundle_dir / "osm-current-bbbike" / "Seoul.osm.pbf"
    if not pbf.is_file():
        raise BakeError(f"missing OSM PBF: {pbf}")

    tile_paths = collect_tile_paths(bundle_dir)
    tiles = {xy: read_tile(p) for xy, p in tile_paths.items()}
    union_x = [b[0] for _, b in tiles.values()] + [b[2] for _, b in tiles.values()]
    union_y = [b[1] for _, b in tiles.values()] + [b[3] for _, b in tiles.values()]
    min_x, min_y, max_x, max_y = min(union_x), min(union_y), max(union_x), max(union_y)
    origin_x = (min_x + max_x) * 0.5
    origin_y = (min_y + max_y) * 0.5
    scale = 0.001

    print("scanning OSM PBF …", file=sys.stderr)
    polygons, lines = collect_osm_features(pbf)
    print(f"  polygons={len(polygons)} lines={len(lines)}", file=sys.stderr)
    gus = gu_shapes_world(baked_dir)

    from PIL import Image, ImageDraw

    outputs = []
    for (x, y) in sorted(tiles):
        elev, bounds = tiles[(x, y)]
        x0, y0, x1, y1 = bounds  # 3857
        wx0 = (x0 - origin_x) * scale
        wx1 = (x1 - origin_x) * scale
        wz0 = -(y1 - origin_y) * scale
        wz1 = -(y0 - origin_y) * scale

        # --- base: hillshade over the DEM grid ---
        # Benchmark palette (seoul-3d-atlas): soft pastel — sat ≤ 0.26, val ≥ 0.54.
        # Compress shade to a high, narrow band so the terrain reads as a pale
        # wash instead of harsh black-to-white relief.
        block = elev.shape[0] // grid
        means = elev.reshape(grid, block, grid, block).mean(axis=(1, 3))
        means = np.where(means == NODATA, 0.0, means)
        shade = hillshade(means)
        pastel = 0.78 + 0.22 * shade  # val ∈ [0.78, 1.0]
        base = (pastel * 255).astype(np.uint8)
        resample = getattr(Image, "Resampling", Image).BILINEAR
        img = Image.fromarray(base, mode="L").resize((TEXTURE_SIZE, TEXTURE_SIZE), resample).convert("RGB")
        # pale warm-cream terrain (atlas-style beige-green wash)
        arr = np.asarray(img).astype(np.float32)
        arr[:, :, 0] = arr[:, :, 0] * 0.98 + 10
        arr[:, :, 1] = arr[:, :, 1] * 0.97 + 12
        arr[:, :, 2] = arr[:, :, 2] * 0.96 + 10
        img = Image.fromarray(arr.astype(np.uint8))

        # --- rasterize 3857 features into texture pixels ---
        # texture px u -> lon3857; v measured from TOP (north at v=0)
        def to_px(px_x, px_y):
            u = (px_x - x0) / (x1 - x0) * TEXTURE_SIZE
            v = (y1 - px_y) / (y1 - y0) * TEXTURE_SIZE
            return u, v

        polygons_here = [
            (kind, [to_px(a, b) for a, b in ring])
            for kind, ring in polygons
            if any(x0 <= a <= x1 and y0 <= b <= y1 for a, b in ring[-1:])
            or any(x0 <= a <= x1 and y0 <= b <= y1 for a, b in ring[:1])
        ]
        overlay = Image.new("RGBA", (TEXTURE_SIZE, TEXTURE_SIZE), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        color_map = {
            "building": (168, 160, 152, 200),       # pale warm gray (soft concrete)
            "vegetation": (116, 158, 112, 170),     # soft sage green
            "water": (118, 156, 186, 220),          # pale powder blue
        }
        for k, ring in polygons_here:
            if k == "water" and len(ring) >= 3:
                draw.polygon(ring, outline=(94, 148, 200, 255), width=10)  # shallow coast band
        for kind in ("vegetation", "building", "water"):
            for k, ring in polygons_here:
                if k == kind and len(ring) >= 3:
                    draw.polygon(ring, fill=color_map[kind])
        for kind, color, width in (("road", (222, 214, 196, 180), 3), ("rail", (158, 148, 152, 170), 2), ("river", (128, 164, 192, 210), 6)):
            for k, pts in lines:
                if k != kind:
                    continue
                px = [to_px(a, b) for a, b in pts]
                if not any(-20 <= u <= TEXTURE_SIZE + 20 and -20 <= v <= TEXTURE_SIZE + 20 for u, v in px):
                    continue
                draw.line(px, fill=color, width=width, joint="curve")

        # --- region tint + borders over the whole chunk ---
        region = Image.new("RGBA", (TEXTURE_SIZE, TEXTURE_SIZE), (0, 0, 0, 0))
        rdraw = ImageDraw.Draw(region)
        for gu_name, world_ring in gus:
            px = [
                ((a - wx0) / (wx1 - wx0) * TEXTURE_SIZE, (b - wz0) / (wz1 - wz0) * TEXTURE_SIZE)
                for a, b in world_ring
            ]
            if not any(-4 <= u <= TEXTURE_SIZE + 4 and -4 <= v <= TEXTURE_SIZE + 4 for u, v in px):
                continue
            state = STATE_OF_GU.get(gu_name)
            if state is None:
                continue
            r, g, b = hsv_to_rgb(state_hue(state), 0.26, 0.88)  # pastel region wash (atlas benchmark ≤0.26 sat)
            rdraw.polygon(px, fill=(r, g, b, 90), outline=(30, 30, 36, 200), width=6)
            rdraw.polygon(px, outline=(min(r + 60, 255), min(g + 60, 255), min(b + 60, 255), 220), width=2)
        img = Image.alpha_composite(img.convert("RGBA"), overlay)
        img = Image.alpha_composite(img, region).convert("RGB")

        name = f"chunk-{x}-{y}.png"
        img.save(baked_dir / name, optimize=True)
        outputs.append({"x": x, "y": y, "texture": name, "sha256": sha256_file(baked_dir / name)})
        print(f"  chunk {x}/{y} baked texture ({len(polygons_here)} polygons)", file=sys.stderr)

    return {"textures": outputs}


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--grid", type=int, default=128)
    args = parser.parse_args(argv)

    bundle = Path(args.bundle)
    if not bundle.is_dir():
        print(f"bake-texture: bundle not found: {bundle}", file=sys.stderr)
        return 2
    try:
        result = bake_textures(bundle, Path(args.out), grid=args.grid)
    except BakeError as exc:
        print(f"bake-texture: {exc}", file=sys.stderr)
        return 3
    print(json.dumps({"textures": len(result["textures"])}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
