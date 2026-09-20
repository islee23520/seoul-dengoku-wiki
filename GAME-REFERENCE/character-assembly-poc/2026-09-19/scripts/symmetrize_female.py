# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Symmetrize female base using edit-mode operator approach."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components, orient_surface

assert bpy.app.background
obj = bpy.data.objects['Female_Base_Assembly']
mesh = obj.data

# Use edit mode operator approach (works reliably across versions)
bpy.context.view_layer.objects.active = obj
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.symmetrize(direction='POSITIVE_X')
bpy.ops.mesh.select_all(action='DESELECT')
bpy.ops.object.mode_set(mode='OBJECT')

bm = bmesh.new(); bm.from_mesh(mesh); bm.normal_update()
orient_surface(bm)
bm.normal_update()

parts_after = components(bm)
bounds_after = boundary_groups(bm)
junction = sum(1 for e in bm.edges if len(e.link_faces) > 2)
winding = sum(1 for e in bm.edges if e.is_manifold and not e.is_contiguous)
degenerate = sum(1 for f in bm.faces if f.calc_area() < 1e-12)
quads = sum(1 for f in bm.faces if len(f.verts) == 4)

# Fast symmetry check: hash all vertices, compare mirror pairs
verts_by_yz = {}
for v in bm.verts:
    key = (round(v.co.y, 6), round(v.co.z, 6))
    verts_by_yz.setdefault(key, []).append(v.co.x)
max_asym = 0.0
checked = 0
for key, xs in verts_by_yz.items():
    if len(xs) == 2:
        d = abs(xs[0] + xs[1])
        max_asym = max(max_asym, d)
        checked += 1

report = {
    'gender': 'Female',
    'donor': 'positive_x',
    'direction': 'POSITIVE (keep +X, mirror to -X)',
    'method': 'bpy.ops.mesh.symmetrize (edit mode)',
    'vertices': len(bm.verts),
    'faces': len(bm.faces),
    'quads': quads,
    'connected_components': len(parts_after),
    'boundary_groups': [len(g) for g in bounds_after],
    'junction_edges': junction,
    'winding_errors': winding,
    'degenerate_faces': degenerate,
    'symmetry_pairs_checked': checked,
    'max_x_asymmetry_m': max_asym,
}
bm.to_mesh(mesh); bm.free()
mesh.normals_split_custom_set([(0, 0, 0)] * len(mesh.loops))
for p in mesh.polygons: p.use_smooth = True
(ROOT / 'reports/female-symmetrize.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/female-base-symmetric.blend'))
print('FEMALE_SYMMETRIZED', json.dumps(report), flush=True)
