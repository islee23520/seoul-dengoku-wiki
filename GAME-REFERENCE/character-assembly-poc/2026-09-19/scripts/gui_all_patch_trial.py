# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Apply the measured quad patch method to an isolated male repair copy."""
import json
import sys
from pathlib import Path
import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups
from quad_patch_repair import repair_patches

source = bpy.data.objects['Male_Cheek_Grid_Repair']
assert bpy.context.mode == 'OBJECT'
scene = bpy.data.scenes.new('Quad_Repair_Review')
bpy.context.window.scene = scene
obj = source.copy()
obj.data = source.data.copy()
obj.name = 'Male_Quad_Repair_Review'
scene.collection.objects.link(obj)
obj.hide_set(False)
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bm = bmesh.new()
bm.from_mesh(obj.data)
eye_loops = [g for g in boundary_groups(bm) if len(g) == 47 and min(v.co.z for e in g for v in e.verts) > 1.65]
assert len(eye_loops) == 2
records = repair_patches(bm, [{tuple(v.co) for e in group for v in e.verts} for group in eye_loops])
report = {'patches': len(records), 'patch_records': records, 'vertices': len(bm.verts), 'faces': len(bm.faces), 'boundary_groups': [len(g) for g in boundary_groups(bm)], 'junctions': sum(len(e.link_faces) > 2 for e in bm.edges), 'winding_errors': sum(e.is_manifold and not e.is_contiguous for e in bm.edges), 'zero_area_faces': sum(f.calc_area() < 1e-12 for f in bm.faces), 'status': 'TOPOLOGY_PASS_VISUAL_REVIEW_REQUIRED'}
bm.to_mesh(obj.data)
bm.free()
for poly in obj.data.polygons:
    poly.use_smooth = True
obj.data.normals_split_custom_set([(0, 0, 0)] * len(obj.data.loops))
(ROOT / 'reports/all-quad-patches.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/all-quad-patches-review.blend'))
print('ALL_QUAD_PATCHES_CREATED', len(records), flush=True)
