# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Test Blender QuadriFlow on a disposable neck patch, never the character."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, select_only

source = bpy.data.objects['Male_Local_Density_Trial']
scene = bpy.data.scenes.new('QuadriFlow_Patch_Comparison')
bpy.context.window.scene = scene
obj = source.copy()
obj.data = source.data.copy()
obj.name = 'QuadriFlow_Disposable_Neck_Patch'
scene.collection.objects.link(obj)
bm = bmesh.new()
bm.from_mesh(obj.data)
tag = bm.faces.layers.int['DensityTransition']
bmesh.ops.delete(bm, geom=[f for f in bm.faces if not f[tag]], context='FACES_ONLY')
bmesh.ops.delete(bm, geom=[e for e in bm.edges if not e.link_faces], context='EDGES')
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
before = {'vertices': len(bm.verts), 'faces': len(bm.faces), 'boundaries': sorted(len(g) for g in boundary_groups(bm))}
before_points = sorted(tuple(round(c, 7) for c in v.co) for v in bm.verts if v.is_boundary)
bm.to_mesh(obj.data)
bm.free()
select_only(obj)
result = bpy.ops.object.quadriflow_remesh(use_mesh_symmetry=False, use_preserve_sharp=False, use_preserve_boundary=True, preserve_attributes=True, smooth_normals=True, mode='FACES', target_faces=500, seed=0)
bm = bmesh.new()
bm.from_mesh(obj.data)
after_points = sorted(tuple(round(c, 7) for c in v.co) for v in bm.verts if v.is_boundary)
after = {'vertices': len(bm.verts), 'faces': len(bm.faces), 'boundaries': sorted(len(g) for g in boundary_groups(bm)), 'all_quads': all(len(f.verts) == 4 for f in bm.faces), 'winding_errors': sum(e.is_manifold and not e.is_contiguous for e in bm.edges), 'junctions': sum(len(e.link_faces) > 2 for e in bm.edges), 'boundary_coordinates_unchanged': before_points == after_points}
bm.free()
report = {'operator_status': sorted(result), 'before': before, 'after': after, 'scope': 'disposable patch only', 'can_stitch_without_boundary_rework': 'FINISHED' in result and before_points == after_points}
(ROOT / 'reports/quadriflow-patch-trial.json').write_text(json.dumps(report, indent=2))
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        space = area.spaces.active
        space.shading.type = 'SOLID'
        space.overlay.show_wireframes = True
        space.overlay.show_face_orientation = True
        space.region_3d.view_rotation = Vector((1, -1, 0.4)).to_track_quat('Z', 'Y')
        space.region_3d.view_location = Vector((-1.05, 0.02, 1.56))
        space.region_3d.view_distance = 0.33
        space.region_3d.view_perspective = 'ORTHO'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/quadriflow-patch-trial.blend'))
print('QUADRIFLOW_PATCH_TRIAL_COMPLETE', flush=True)
