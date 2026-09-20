# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Re-unwrap female UVs with Smart UV Project, then bake source colors."""
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

# 1. Smart UV Project for non-overlapping UVs
# Replace existing UV layer
if mesh.uv_layers:
    for l in list(mesh.uv_layers):
        mesh.uv_layers.remove(l)
mesh.uv_layers.new(name='Atlas')

bpy.context.view_layer.objects.active = obj
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
# Smart UV Project: good for complex meshes, guarantees no overlap
bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.003, correct_aspect=True, scale_to_bounds=False)
bpy.ops.object.mode_set(mode='OBJECT')

# 2. Verify UVs
bm = bmesh.new(); bm.from_mesh(mesh)
uv_layer = bm.loops.layers.uv.active
tris = []
for f in bm.faces:
    for i in range(len(f.loops) - 2):
        tri = np.array([list(l[uv_layer].uv) for l in [f.loops[0], f.loops[i+1], f.loops[i+2]]])
        tris.append(tri)
bm.free()
result = audit(np.array(tris))
overlap_pairs = result.get('positive_area_overlap_pairs', [])
print(f'Smart UV result: {len(overlap_pairs)} overlaps, {len(result.get("degenerate_triangle_ids", []))} degenerate', flush=True)

# 3. Texel density stats
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
    'mesh': 'Female_Base_Assembly',
    'method': 'smart_project(angle=66, margin=0.003)',
    'overlap_pairs': len(overlap_pairs),
    'ok': result.get('ok', False),
    'texel_density': {
        'count': len(densities),
        'mean': float(densities.mean()),
        'cv': float(densities.std()/densities.mean()),
        'p95_p5_ratio': float(np.percentile(densities, 95)/np.percentile(densities, 5)),
    },
}
(ROOT / 'reports/female-uv-unwrap.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/female-base-uv.blend'))
print('FEMALE_UV_UNWRAPPED', json.dumps(report), flush=True)
