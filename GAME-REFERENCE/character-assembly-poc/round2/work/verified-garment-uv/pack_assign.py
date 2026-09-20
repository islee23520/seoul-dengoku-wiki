# /// script
# requires-python = ">=3.13"
# dependencies = ["numpy"]
# ///
# Run: Blender -b source.blend --python pack_assign.py
"""Equal-area density normalization, padded rectangle packing and loop assignment."""
from __future__ import annotations

import hashlib
import json
import math
import sys
from pathlib import Path

import bpy
import numpy as np

HERE = Path(__file__).resolve().parent
sys.dont_write_bytecode = True
sys.path.insert(0, str(HERE))
from uv_common import NAMES, SOURCE, SOURCE_SHA, fingerprint

charts = json.loads((HERE / "unpacked-charts-attempt-01.json").read_text())
for chart in charts:
    print("PACK_CHART", chart["name"], flush=True)
    mesh = bpy.data.objects[chart["object"]].data
    mesh.calc_loop_triangles()
    face_set = set(chart["faces"])
    loop_index = {l:i for i,l in enumerate(chart["loops"])}
    coords = np.array(chart["uv"])
    triangles = [t for t in mesh.loop_triangles if t.polygon_index in face_set]
    world_area = sum(t.area for t in triangles)
    uv_area = 0.0
    for t in triangles:
        a,b,c = coords[[loop_index[l] for l in t.loops]]
        uv_area += abs(np.linalg.det(np.array([b-a,c-a]))) / 2
    coords *= math.sqrt(world_area / uv_area)
    # A rigid rotation only; no per-axis scaling or hidden density loss.
    best = None
    for angle in np.linspace(0, math.pi, 361):
        rot = np.array([[math.cos(angle),-math.sin(angle)],[math.sin(angle),math.cos(angle)]])
        transformed = coords @ rot
        size = np.ptp(transformed, axis=0)
        score = float(size.prod())
        if best is None or score < best[0]:
            best = (score, transformed)
    assert best is not None
    coords = best[1]
    if np.ptp(coords[:,0]) < np.ptp(coords[:,1]):
        coords = coords[:,::-1].copy()
    coords -= coords.min(axis=0)
    chart["uv"] = coords.tolist()
    chart["world_area_m2"] = world_area
    chart["size_m"] = np.ptp(coords, axis=0).tolist()


def pack(scale: float):
    """Deterministic padded shelves; chart rectangles never intersect."""
    padding = 20.0 / 4096
    border = 20.0 / 4096
    x, y, row_height = border, border, 0.0
    placements = {}
    for c in sorted(charts, key=lambda c:(-c["size_m"][1], c["name"])):
        width, height = [v*scale for v in c["size_m"]]
        if x+width > 1-border:
            x, y, row_height = border, y+row_height+padding, 0.0
        if y+height > 1-border or width > 1-2*border:
            return None
        placements[c["name"]] = [x,y]
        x += width+padding
        row_height = max(row_height,height)
    return placements


low, high = 0.0, 100.0
for _ in range(70):
    mid = (low+high)/2
    if pack(mid) is None:
        high = mid
    else:
        low = mid
scale = low * 0.99999
placements = pack(scale)
assert placements is not None
before = json.loads((HERE / "source-semantic-fingerprints.json").read_text())
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == SOURCE_SHA
for name in NAMES:
    print("PACK_OBJECT", name, flush=True)
    obj = bpy.data.objects[name]
    assert fingerprint(obj) == before[name]
    layer = obj.data.uv_layers.new(name="GarmentUV_4K", do_init=False)
    obj.data.uv_layers.active_index = len(obj.data.uv_layers)-1
    layer.active_render = True
    covered = set()
    for chart in [c for c in charts if c["object"]==name]:
        coords = np.array(chart["uv"])*scale + placements[chart["name"]]
        for loop, uv in zip(chart["loops"],coords):
            assert loop not in covered
            layer.data[loop].uv = uv
            covered.add(loop)
        chart["uv"] = [list(layer.data[l].uv) for l in chart["loops"]]
    assert covered == set(range(len(obj.data.loops)))
    # Mark exactly actual new UV discontinuities, retaining any original seam flags.
    sides = {}
    for polygon in obj.data.polygons:
        ls = list(polygon.loop_indices)
        for a,b in zip(ls,ls[1:]+ls[:1]):
            edge = obj.data.loops[a].edge_index
            mapping = {obj.data.loops[l].vertex_index:tuple(layer.data[l].uv) for l in (a,b)}
            if edge in sides and sides[edge] != mapping:
                obj.data.edges[edge].use_seam = True
            sides[edge] = mapping
    assert fingerprint(obj) == before[name]
assert fingerprint(bpy.data.objects["Female_Base_Composed_Candidate"]) == before["Female_Base_Composed_Candidate"]
bundle = bpy.data.scenes.new("VerifiedGarmentUV")
for name in NAMES:
    bundle.collection.objects.link(bpy.data.objects[name])
candidate = HERE / "female-garment-uv-attempt-01.blend"
print("PACK_SAVE", flush=True)
bpy.data.libraries.write(str(HERE / "garment-object-library.blend"), {bpy.data.objects[n] for n in NAMES}, path_remap="RELATIVE", fake_user=True, compress=True)
assignment = {"schema_version":1,"source_sha256":SOURCE_SHA,"uv_layer":"GarmentUV_4K",
              "atlas":"shared_4096_square","density_scale_px_per_m":scale*4096,
              "packing_rectangle_padding_px":20,"packing_border_px":20,
              "objects": {name:{"semantic_sha256":before[name],
                          "loops":[{"loop":l.index,"vertex":l.vertex_index,"uv":list(bpy.data.objects[name].data.uv_layers.active.data[l.index].uv)} for l in bpy.data.objects[name].data.loops],
                          "seam_edges":[e.index for e in bpy.data.objects[name].data.edges if e.use_seam]} for name in NAMES},
              "charts":charts}
(HERE / "assignment-attempt-01.json").write_text(json.dumps(assignment, indent=2))
bpy.ops.wm.read_factory_settings(use_empty=True)
with bpy.data.libraries.load(str(HERE / "garment-object-library.blend"), link=False) as (_, loaded):
    loaded.objects = list(NAMES)
for obj in loaded.objects:
    bpy.context.scene.collection.objects.link(obj)
bpy.context.scene.name = "VerifiedGarmentUV"
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(candidate), compress=True)
print("PACK_ASSIGN_COMPLETE", str(candidate), "density_px_m",scale*4096, flush=True)
