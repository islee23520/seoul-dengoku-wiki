# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Preserve owner's sculpt; center a duplicate and mask everything except the seam."""
import hashlib
import json
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Quaternion, Vector

ROOT = Path(__file__).resolve().parents[1]
owner = bpy.context.object
assert owner.name == 'Male_Protected_Body_Neck_Trial'
assert owner.type == 'MESH'
world_before = [owner.matrix_world @ v.co for v in owner.data.vertices]
if bpy.context.mode != 'OBJECT':
    bpy.ops.object.mode_set(mode='OBJECT')
scene = bpy.data.scenes.new('Sculpt_Seam_Workcopy')
bpy.context.window.scene = scene
obj = owner.copy()
obj.data = owner.data.copy()
obj.name = 'Male_Sculpt_Seam_Workcopy'
scene.collection.objects.link(obj)
obj.hide_set(False)
center_x = (min(v.co.x for v in obj.data.vertices) + max(v.co.x for v in obj.data.vertices)) / 2
obj.data.transform(Matrix.Translation((-center_x, 0, 0)))
obj.matrix_world = owner.matrix_world @ Matrix.Translation((center_x, 0, 0))
bpy.context.view_layer.update()
world_after = [obj.matrix_world @ v.co for v in obj.data.vertices]
maximum_delta = max((a - b).length for a, b in zip(world_before, world_after))
assert maximum_delta < 1e-6, maximum_delta
bm = bmesh.new()
bm.from_mesh(obj.data)
bm.verts.ensure_lookup_table()
seam = {v for f in bm.faces if f.select for v in f.verts}
assert len(seam) == 320
distances = {v: 0 for v in seam}
frontier = seam
for depth in range(1, 4):
    following = {e.other_vert(v) for v in frontier for e in v.link_edges} - set(distances)
    for v in following:
        distances[v] = depth
    frontier = following
weights = [0.0] * len(bm.verts)
for vertex, distance in distances.items():
    # Absolute anatomical guard: no clavicle/trapezius/shoulder or jaw edits.
    if 1.542 < vertex.co.z < 1.625 and abs(vertex.co.x) < 0.075:
        weights[vertex.index] = {0: 1.0, 1: 0.65, 2: 0.3, 3: 0.1}[distance]
bm.free()
mask = obj.data.attributes.new('.sculpt_mask', 'FLOAT', 'POINT')
mask.data.foreach_set('value', [1 - w for w in weights])
group = obj.vertex_groups.new(name='SeamRelax_Only')
for index, weight in enumerate(weights):
    if weight:
        group.add([index], weight, 'REPLACE')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
obj.data.use_mirror_x = True
bpy.ops.object.mode_set(mode='SCULPT')
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        s = area.spaces.active
        s.shading.type = 'SOLID'
        s.shading.color_type = 'OBJECT'
        s.overlay.show_wireframes = False
        s.overlay.show_face_orientation = False
        s.region_3d.view_rotation = Quaternion((1, 0, 0), 1.5707963267948966)
        s.region_3d.view_location = Vector((-1.05, 0, 1.55))
        s.region_3d.view_distance = 0.75
        s.region_3d.view_perspective = 'ORTHO'
report = {'owner_object': owner.name, 'workcopy': obj.name, 'world_shape_max_delta_m': maximum_delta, 'local_symmetry_center_x': (min(v.co.x for v in obj.data.vertices) + max(v.co.x for v in obj.data.vertices)) / 2, 'editable_vertices': sum(w > 0 for w in weights), 'fully_protected_vertices': sum(w == 0 for w in weights), 'original_changed': False, 'filter_applied': False}
(ROOT / 'reports/sculpt-workcopy.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/sculpt-seam-masked-workcopy.blend'))
print('SCULPT_WORKCOPY_READY', flush=True)
