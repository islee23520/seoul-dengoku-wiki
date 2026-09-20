# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Relax the quad collar and its adjacent rows, retaining the source silhouette."""
import json
import sys
from pathlib import Path
import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import orient_surface, select_only

report = []
for name in ['Male_Base_Quad', 'Female_Base_Quad']:
    obj = bpy.data.objects[name]
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    tag = bm.faces.layers.int['NeckQuad']
    collar = {v for f in bm.faces if f[tag] for v in f.verts}
    low, high = min(v.co.z for v in collar), max(v.co.z for v in collar)
    radius = max(abs(v.co.x) for v in collar)
    neighborhood = [v for v in bm.verts if low - 0.028 < v.co.z < high + 0.028 and abs(v.co.x) < radius * 1.4]
    # Dense rings are relaxed together with adjacent source rows, avoiding a cuff.
    for iteration in range(18):
        bmesh.ops.smooth_vert(bm, verts=neighborhood, factor=0.22, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    orient_surface(bm)
    bm.to_mesh(obj.data)
    bm.free()
    # One conforming simple refinement resolves split boundary n-gons without
    # changing the source surface or inserting unrelated triangle diagonals.
    select_only(obj)
    modifier = obj.modifiers.new('Conforming_Quad_Refinement', 'SUBSURF')
    modifier.subdivision_type = 'SIMPLE'
    modifier.levels = 1
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    orient_surface(bm)
    assert all(len(f.verts) == 4 for f in bm.faces)
    report.append({'name': name, 'vertices': len(bm.verts), 'faces': len(bm.faces), 'quads': sum(len(f.verts) == 4 for f in bm.faces), 'winding_errors': sum(e.is_manifold and not e.is_contiguous for e in bm.edges), 'boundary': sum(e.is_boundary for e in bm.edges)})
    bm.to_mesh(obj.data)
    bm.free()
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.data.normals_split_custom_set([(0, 0, 0)] * len(obj.data.loops))
(ROOT / 'reports/quad-refinement.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/quad-refined-working.blend'))
print('QUAD_REFINEMENT_PASS', flush=True)
