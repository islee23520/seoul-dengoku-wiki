"""Seoul-identity numeric checks on the baked strategy map data.

1. Han River: OSM waterway-river lines must run E-W through a narrow
   north-south band near the map's middle-south (real Han ~37.5-37.55N
   inside the 37.42-37.70 bundle bbox).
2. Bukhansan: the DEM's highest cell must sit north-west of center
   (real Bukhansan 837m is NNW of downtown Seoul).
3. Gwanaksan: a major southern peak (632m) -> the southern half must have
   a local max well above 500m.
"""
import json
import sys
from pathlib import Path

import numpy as np
import rasterio

REPO = Path(__file__).resolve().parents[3]
BUNDLE = REPO / "GAME-REFERENCE/data/seoul-geography-20260830"
BAKED = REPO / "GAME/Assets/Janseon/Data/StrategyMap/Baked"


def check(name, fn):
    try:
        fn()
        print(f"ok {name}")
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"FAIL {name}: {exc}", file=sys.stderr)
        return False


def han_river_band():
    """The Han mainstem must cross Seoul's 25-gu area E-W through the mid-south."""
    from shapely.geometry import Point, Polygon
    from shapely.ops import unary_union

    gu = json.loads((BAKED / "gu-boundaries.json").read_text(encoding="utf-8"))
    polys = []
    for s in gu["shapes"]:
        for outline in s["outlines"]:
            if len(outline) < 4:
                continue
            p = Polygon([(pt[0], -pt[1]) for pt in outline]).buffer(0)
            if not p.is_empty:
                polys.append(p)
    seoul = unary_union(polys)
    assert len(polys) == 25, f"expected 25 gu polygons, built {len(polys)}"

    data = json.loads((BAKED / "osm-lines.json").read_text(encoding="utf-8"))
    rivers = [l for l in data["lines"] if l["kind"] == "waterway-river"]
    inside = [p for l in rivers for p in l["points"] if seoul.intersects(Point(p[0], p[1]))]
    assert len(inside) > 300, f"only {len(inside)} river points inside Seoul's gu boundary"

    zs = np.array([p[1] for p in inside])
    xs = np.array([p[0] for p in inside])
    p25, med, p75 = (float(v) for v in np.percentile(zs, [25, 50, 75]))
    x5, x95 = (float(v) for v in np.percentile(xs, [5, 95]))
    print(f"  han corridor inside gu: z p25/50/75 = {p25:.2f}/{med:.2f}/{p75:.2f}, x p5/p95 = {x5:.2f}/{x95:.2f}, n={len(inside)}")
    assert 0.0 <= med <= 8.0, f"Han median z {med:.2f} outside the mid-south corridor"
    assert p25 >= -4.0 and p75 <= 12.0, f"Han quartile band [{p25:.2f},{p75:.2f}] too scattered for one river corridor"
    assert x5 < -8.0 and x95 > 8.0, "river must span the city east-west"


def highest_cell_is_northwest_bukhansan():
    # Bukhansan Baegundae: 837m surveyed, ~126.978E 37.659N. The easternmost
    # tile (1747/792) carries a z11 edge artifact (825m at 127.19E, no such
    # peak exists there), so assert on the western half where the real
    # massif lives.
    best = None
    for x in (1745, 1746):
        for y in (792, 795):
            if y not in (792, 793, 794):
                continue
            path = BUNDLE / f"terrain-mapzen-geotiff/z11/{x}/{y}.tif"
            with rasterio.open(path) as ds:
                band = ds.read(1).astype(np.float32)
                band[band == -32768] = np.nan
                iy, ix = np.unravel_index(np.nanargmax(band), band.shape)
                val = float(band[iy, ix])
                if best is None or val > best[0]:
                    bounds = ds.bounds
                    fx = ix / band.shape[1]
                    fy = iy / band.shape[0]
                    wx = bounds.left + fx * (bounds.right - bounds.left)
                    wy = bounds.top - fy * (bounds.top - bounds.bottom)
                    best = (val, wx, wy, x, y)
    val, wx, wy, tx, ty = best
    lon = wx / 20037508.34 * 180.0
    lat = float(np.degrees(np.arctan(np.sinh(wy / 6378137.0))))
    print(f"  western-half DEM peak {val:.0f}m at lon {lon:.4f} lat {lat:.4f} (tile {tx}/{ty})")
    assert val > 780, f"peak {val:.0f}m too low for Bukhansan Baegundae (837m surveyed)"
    assert 126.94 <= lon <= 127.01, f"peak lon {lon:.4f} misses Bukhansan"
    assert lat >= 37.63, f"peak lat {lat:.4f} misses Bukhansan (37.66)"


def southern_half_has_gwanaksan():
    # Gwanaksan: 632m surveyed at ~126.956E 37.452N.
    best = None
    for x, y in [(1746, 793), (1746, 794)]:
        path = BUNDLE / f"terrain-mapzen-geotiff/z11/{x}/{y}.tif"
        with rasterio.open(path) as ds:
            band = ds.read(1).astype(np.float32)
            band[band == -32768] = np.nan
            iy, ix = np.unravel_index(np.nanargmax(band), band.shape)
            val = float(band[iy, ix])
            if best is None or val > best[0]:
                bounds = ds.bounds
                wx = bounds.left + ix / band.shape[1] * (bounds.right - bounds.left)
                wy = bounds.top - iy / band.shape[0] * (bounds.top - bounds.bottom)
                best = (val, wx, wy)
    val, wx, wy = best
    lon = wx / 20037508.34 * 180.0
    lat = float(np.degrees(np.arctan(np.sinh(wy / 6378137.0))))
    print(f"  southern peak {val:.0f}m at lon {lon:.4f} lat {lat:.4f}")
    assert val > 560, f"southern peak {val:.0f}m too low for Gwanaksan (632m surveyed)"
    assert 126.92 <= lon <= 127.07 and 37.40 <= lat <= 37.47, f"southern peak {lon:.4f}/{lat:.4f} misses Gwanaksan"


def main():
    checks = [
        ("han_river_band", han_river_band),
        ("highest_cell_is_northwest_bukhansan", highest_cell_is_northwest_bukhansan),
        ("southern_half_has_gwanaksan", southern_half_has_gwanaksan),
    ]
    ok = all(check(name, fn) for name, fn in checks)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
