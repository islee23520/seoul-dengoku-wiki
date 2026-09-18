"""Decimate Tripo landmark GLBs to strategy-map-grade OBJ+PNG assets.

Input: ~/Downloads/*.glb (Tripo exports, ~1.9M tris, 45MB each)
Output: GAME/Assets/Janseon/Data/StrategyMap/Landmarks/<slug>.obj/.png/.mtl
  - ~40k triangles (fast-simplification quadratic decimation)
  - texture resized to 1024
  - Y-up preserved, base at y=0, normalized to 1.0 max height
Deterministic: sorted processing, fixed parameters.
"""
from pathlib import Path
import io
import json
import sys

import numpy as np
import trimesh
from PIL import Image

DOWNLOADS = Path.home() / "Downloads"
OUT = Path(__file__).resolve().parents[3] / "GAME/Assets/Janseon/Data/StrategyMap/Landmarks"

# alt-text -> (slug, lat, lon)
LANDMARKS = {
    "n seoul tower 3d model": ("namsan-tower", 37.5511, 126.9882),
    "architectural gate 3d model": ("gwanghwamun", 37.5759, 126.9769),
    "golden glass skyscraper 3d model": ("bldg63", 37.5193, 126.9403),
    "stylized skyscraper 3d model": ("lotte-world-tower", 37.5125, 127.1025),
    "coex convention center 3d model": ("coex", 37.5132, 127.0586),
    "futuristic building 3d model": ("ddp", 37.5663, 127.0095),
    "sungnyemun gate 3d model": ("sungnyemun", 37.5596, 126.9756),
    "neoclassical parliament 3d model": ("national-assembly", 37.5317, 126.9141),
    "seoul station 3d model": ("seoul-station", 37.5560, 126.9724),
    "stadium 3d model": ("jamsil-stadium", 37.5152, 127.0736),
    "historic gate 3d model": ("heunginjimun", 37.5712, 127.0095),
    "blue glass building 3d model": ("city-hall", 37.5663, 126.9784),
    "wooden bell pavilion 3d model": ("bosingak", 37.5697, 126.9831),
    "dome building 3d model": ("war-memorial", 37.5362, 126.9774),
}

TARGET_FACES = 40_000
TEXTURE = 1024

import fast_simplification


def process(alt, slug):
    src = DOWNLOADS / f"{alt}.glb"
    if not src.is_file():
        return f"MISS {src.name}"
    scene = trimesh.load(src, force="scene", process=False)
    meshes = []
    for name, geom in scene.geometry.items():
        if not isinstance(geom, trimesh.Trimesh) or len(geom.faces) == 0:
            continue
        meshes.append((name, geom))
    if not meshes:
        return f"NO-MESH {slug}"

    total = sum(len(g.faces) for _, g in meshes)
    outputs = []
    for name, geom in meshes:
        mesh = geom.copy()
        if len(mesh.faces) > TARGET_FACES * 2:
            reduction = min(0.98, 1.0 - max(0.02, TARGET_FACES * 2 / len(mesh.faces)))
            verts, faces = fast_simplification.simplify(mesh.vertices, mesh.faces, target_reduction=reduction)
            face_mask = np.ones(len(mesh.faces), dtype=bool)
            keep = min(len(faces), len(mesh.faces))
            face_mask[keep:] = False
            mesh.update_faces(face_mask)
            mesh.remove_unreferenced_vertices()
            # ensure vertex count matches (fast_simplification returns simplified arrays)
            if len(mesh.vertices) != len(verts):
                mesh = trimesh.Trimesh(vertices=verts, faces=faces, process=False)
        # normalize: base at 0, height 1.0, centered XZ
        bounds = mesh.bounds
        mesh.apply_translation(-(bounds[0] + bounds[1]) / 2 * np.array([1, 0, 1]) - np.array([0, bounds[0][1], 0]))
        height = mesh.bounds[1][1] - mesh.bounds[0][1]
        if height > 0:
            mesh.apply_scale(1.0 / height)
        # texture
        mat = mesh.visual.material if hasattr(mesh.visual, "material") else None
        tex = None
        try:
            if mat is not None and hasattr(mat, "baseColorTexture"):
                img = mat.baseColorTexture
                if img is not None:
                    img = img.convert("RGB").resize((TEXTURE, TEXTURE), Image.LANCZOS)
                    tex = img
        except Exception as exc:  # noqa: BLE001
            print(f"  tex err {slug}: {exc}", file=sys.stderr)
        if tex is None:
            tex = Image.new("RGB", (TEXTURE, TEXTURE), (200, 195, 185))
        outputs.append((mesh, tex))

    # write first mesh as the landmark (largest)
    outputs.sort(key=lambda pair: -len(pair[0].faces))
    mesh, tex = outputs[0]
    OUT.mkdir(parents=True, exist_ok=True)
    tex.save(OUT / f"{slug}.png", optimize=True)
    mesh.visual = trimesh.visual.TextureVisuals(
        uv=mesh.visual.uv if mesh.visual is not None and hasattr(mesh.visual, "uv") else None,
        material=trimesh.visual.material.SimpleMaterial(image=tex),
    )
    (OUT / f"{slug}.obj").write_text(trimesh.exchange.obj.export_obj(mesh, mtl_name=f"{slug}.mtl"))
    (OUT / f"{slug}.mtl").write_text(
        f"newmtl {slug}\nKa 1.000 1.000 1.000\nKd 1.000 1.000 1.000\nKs 0.000 0.000 0.000\nd 1.0\nillum 1\nmap_Kd {slug}.png\n"
    )
    return f"OK {slug}: {len(mesh.faces)} faces, {(OUT / (slug + '.obj')).stat().st_size // 1024}KB obj"


results = [process(alt, slug) for alt, (slug, _, _) in sorted(LANDMARKS.items())]
print("\n".join(results))

# manifest with real-world positions (same union frame as the terrain bake)
import rasterio
ys = []
bundle = Path(__file__).resolve().parents[3] / "GAME-REFERENCE/data/seoul-geography-20260830/terrain-mapzen-geotiff/z11"
for x in range(1745, 1748):
    for y in range(792, 795):
        with rasterio.open(bundle / f"{x}/{y}.tif") as ds:
            ys += [ds.bounds.bottom, ds.bounds.top]
oy = (min(ys) + max(ys)) / 2
import math
R = 6378137.0
def to_world(lat, lon):
    mx = math.radians(lon) * R
    my = R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
    # x centered on Seoul center lon for simplicity (terrain origin_x uses tile bounds; recompute)
    return mx, my

xs = []
for x in range(1745, 1748):
    for y in range(792, 795):
        with rasterio.open(bundle / f"{x}/{y}.tif") as ds:
            xs += [ds.bounds.left, ds.bounds.right]
ox = (min(xs) + max(xs)) / 2
entries = []
for alt, (slug, lat, lon) in sorted(LANDMARKS.items()):
    mx, my = to_world(lat, lon)
    entries.append({
        "slug": slug, "lat": lat, "lon": lon,
        "worldX": round((mx - ox) * 0.001, 4), "worldZ": round(-(my - oy) * 0.001, 4),
        "gameScale": 6.0,
    })
(OUT / "landmarks-manifest.json").write_text(json.dumps({"kind": "landmarks", "landmarks": entries}, ensure_ascii=False, sort_keys=True, indent=2) + "\n")
print("manifest written:", len(entries), "landmarks")
