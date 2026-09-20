# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Audit female UV overlaps using the shared audit module."""
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
obj = bpy.data.objects['Female_Base_Assembly']
mesh = obj.data
bm = bmesh.new(); bm.from_mesh(mesh)
uv_layer = bm.loops.layers.uv.active
tris = []
for f in bm.faces:
    for i in range(len(f.loops) - 2):
        tri = np.array([list(l[uv_layer].uv) for l in [f.loops[0], f.loops[i+1], f.loops[i+2]]])
        tris.append(tri)
bm.free()
print(f'UV triangles to audit: {len(tris)}', flush=True)
result = audit(np.array(tris))
overlap_pairs = result.get('positive_area_overlap_pairs', [])
print(f'Overlap pairs: {len(overlap_pairs)}', flush=True)
if overlap_pairs[:10]:
    for p in overlap_pairs[:10]:
        print(f'  pair {p}', flush=True)
report = {
    'mesh': 'Female_Base_Assembly',
    'uv_layer': 'Attribute',
    'total_triangles': len(tris),
    'overlap_pairs': len(overlap_pairs),
    'degenerate': len(result.get('degenerate_triangle_ids', [])),
    'ok': result.get('ok', False),
}
(ROOT / 'reports/female-uv-overlap.json').write_text(json.dumps(report, indent=2))
print('FEMALE_UV_OVERLAP', json.dumps(report), flush=True)
