"""Tests for bake_seoul_terrain (seoul-strategy-map-gdd task 11).

Run: python3 TOOL/tools/strategy-map/test_bake_seoul_terrain.py
Exits 0 when every check passes; any failure exits non-zero with the failing
check name on stderr.
"""
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
BUNDLE = REPO / "GAME-REFERENCE/data/seoul-geography-20260830"
sys.path.insert(0, str(HERE))

import bake_seoul_terrain as bake  # noqa: E402


def check(name, fn):
    try:
        fn()
        print(f"ok {name}")
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"FAIL {name}: {exc}", file=sys.stderr)
        return False


def tiles_are_nine():
    tiles = bake.collect_tile_paths(BUNDLE)
    assert len(tiles) == 9, f"expected 9 z11 tiles, got {len(tiles)}"
    assert (1745, 792) in tiles and (1747, 794) in tiles


def chunk_geometry_clamps_water_and_exaggerates():
    import numpy as np

    elev = np.array([[0, -32768], [100, 200]], dtype=np.int16)
    verts, faces, stats = bake.build_chunk_geometry(
        elev, x0_3857=0.0, y0_3857=0.0, x1_3857=2000.0, y1_3857=2000.0,
        grid=2, vertical_units_per_meter=0.025,
    )
    ys = [v[1] for v in verts]
    assert min(ys) >= 0.0, f"water must clamp at 0, got {min(ys)}"
    assert abs(max(ys) - 200 * 0.025) < 1e-6, f"vertical exaggeration wrong: {max(ys)}"
    assert len(faces) == 2 * (2 - 1) * (2 - 1), f"face count wrong: {len(faces)}"
    assert stats["maxElevMeters"] == 200 and stats["minElevMeters"] == 0


def chunk_vertices_use_union_origin_not_chunk_center():
    import numpy as np

    elev = np.zeros((2, 2), dtype=np.int16)
    # Union spans x 0..4000, y 0..4000 (two 2000m tiles side by side);
    # the EAST tile (x 2000..4000) must land east of the world origin.
    verts, _, _ = bake.build_chunk_geometry(
        elev, x0_3857=2000.0, y0_3857=0.0, x1_3857=4000.0, y1_3857=2000.0,
        grid=2, vertical_units_per_meter=0.025,
        union_origin_x=2000.0, union_origin_y=1000.0,
    )
    xs = [v[0] for v in verts]
    assert min(xs) >= -1e-6 and abs(max(xs) - 2.0) < 1e-6, \
        f"east tile must span 0..2.0 in union units, got {min(xs)}..{max(xs)}"
    mid = sum(xs) / len(xs)
    assert abs(mid - 1.0) < 1e-6, f"east tile midpoint must sit at +1.0, got {mid}"


def missing_tile_fails_with_named_file():
    with tempfile.TemporaryDirectory() as tmp:
        partial = Path(tmp) / "partial"
        shutil.copytree(BUNDLE / "terrain-mapzen-geotiff", partial / "terrain-mapzen-geotiff")
        victim = partial / "terrain-mapzen-geotiff/z11/1745/792.tif"
        victim.unlink()
        try:
            bake.collect_tile_paths(partial)
        except bake.BakeError as exc:
            assert "1745/792.tif" in str(exc), f"error must name the missing file: {exc}"
        else:
            raise AssertionError("missing tile must raise BakeError")


def bake_is_deterministic_and_manifest_is_complete():
    with tempfile.TemporaryDirectory() as tmp:
        out1 = Path(tmp) / "a"
        out2 = Path(tmp) / "b"
        m1 = bake.bake(BUNDLE, out1, grid=32, include_osm=False)
        m2 = bake.bake(BUNDLE, out2, grid=32, include_osm=False)
        assert m1["schema"] == "seoul-strategy-map-v1"
        assert len(m1["chunks"]) == 9, f"expected 9 chunks, got {len(m1['chunks'])}"
        assert m1["overlays"]["guCount"] == 25, f"expected 25 gu, got {m1['overlays']['guCount']}"
        b1 = (out1 / "manifest.json").read_bytes()
        b2 = (out2 / "manifest.json").read_bytes()
        assert b1 == b2, "manifest must be byte-identical across runs"
        for chunk in m1["chunks"]:
            assert (out1 / chunk["obj"]).exists()
        joined = json.dumps(m1, ensure_ascii=False)
        assert "OpenStreetMap" in joined, "attribution must include OSM"
        assert "U.S. Geological Survey" in joined, "attribution must include USGS terrain"


def main_returns_nonzero_on_missing_input():
    with tempfile.TemporaryDirectory() as tmp:
        rc = subprocess.run(
            [sys.executable, str(HERE / "bake_seoul_terrain.py"),
             "--bundle", str(Path(tmp) / "nowhere"), "--out", str(Path(tmp) / "out")],
            capture_output=True, text=True,
        )
        assert rc.returncode != 0, "main must exit non-zero on a missing bundle"


def main_cli_bakes():
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "out"
        rc = subprocess.run(
            [sys.executable, str(HERE / "bake_seoul_terrain.py"),
             "--bundle", str(BUNDLE), "--out", str(out), "--grid", "32"],
            capture_output=True, text=True,
        )
        assert rc.returncode == 0, f"cli bake failed: {rc.stderr[-400:]}"
        assert (out / "manifest.json").exists()


def main():
    checks = [
        ("tiles_are_nine", tiles_are_nine),
        ("chunk_geometry_clamps_water_and_exaggerates", chunk_geometry_clamps_water_and_exaggerates),
        ("chunk_vertices_use_union_origin_not_chunk_center", chunk_vertices_use_union_origin_not_chunk_center),
        ("missing_tile_fails_with_named_file", missing_tile_fails_with_named_file),
        ("bake_is_deterministic_and_manifest_is_complete", bake_is_deterministic_and_manifest_is_complete),
        ("main_returns_nonzero_on_missing_input", main_returns_nonzero_on_missing_input),
        ("main_cli_bakes", main_cli_bakes),
    ]
    ok = all(check(name, fn) for name, fn in checks)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
