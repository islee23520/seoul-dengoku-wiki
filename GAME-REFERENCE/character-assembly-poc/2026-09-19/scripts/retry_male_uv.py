# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Retry male UV: pack islands with proper margin, then audit overlap + density."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from uv_overlap_audit import audit

assert bpy.app.background
obj = bpy.data.objects['Male_Base_Symmetric']
mesh = obj.data

# Pack islands only (average_island_scale unavailable in background)
bpy.context.view_layer.objects.active = obj
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.pack_islands(margin=0.002, rotate=True)
bpy.ops.object.mode_set(mode='OBJECT')

# Audit
bm = bmesh.new(); bm.from_mesh(mesh)
uv_layer = bm.loops.layers.uv.active
adj = set()
for e in bm.edges:
    fs = tuple(sorted(f.index for f in e.link_faces))
    if len(fs) == 2:
        adj.add(fs)
tris = []
face_map = []
for f in bm.faces:
    for i in range(len(f.loops) - 2):
        tri = np.array([list(l[uv_layer].uv) for l in [f.loops[0], f.loops[i+1], f.loops[i+2]]])
        tris.append(tri)
        face_map.append(f.index)
bm.free()
result = audit(np.array(tris))
overlap_pairs = result.get('positive_area_overlap_pairs', [])
non_adj = []
for pair in overlap_pairs:
    if isinstance(pair, (list, tuple)) and len(pair) == 2:
        f1, f2 = face_map[pair[0]], face_map[pair[1]]
        if (min(f1,f2), max(f1,f2)) not in adj:
            non_adj.append(pair)

# Density
bm2 = bmesh.new(); bm2.from_mesh(mesh)
uv_layer2 = bm2.loops.layers.uv.active
densities = []
for f in bm2.faces:
    uv_area = 0
    for i in range(len(f.loops) - 2):
        uvs = np.array([list(l[uv_layer2].uv) for l in [f.loops[0], f.loops[i+1], f.loops[i+2]]])
        uv_area += abs(np.cross(uvs[1]-uvs[0], uvs[2]-uvs[0])) / 2
    if f.calc_area() > 1e-12 and uv_area > 1e-12:
        densities.append(uv_area / f.calc_area())
bm2.free()
densities = np.array(densities)

report = {
    'mesh': 'Male_Base_Symmetric',
    'method': 'pack_islands(margin=0.002, rotate=True)',
    'raw_overlap_pairs': len(overlap_pairs),
    'non_adjacent_overlap_pairs': len(non_adj),
    'ok': len(non_adj) == 0,
    'texel_density': {
        'count': len(densities),
        'mean': float(densities.mean()),
        'cv': float(densities.std()/densities.mean()),
        'p95_p5_ratio': float(np.percentile(densities, 95)/np.percentile(densities, 5)),
    },
}
(ROOT / 'reports/male-uv-retry.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/male-base-uv-retry.blend'))
print('MALE_UV_RETRY', json.dumps(report), flush=True)
