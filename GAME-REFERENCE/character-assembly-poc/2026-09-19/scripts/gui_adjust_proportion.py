# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Raise only the unjoined study heads; keep accepted head and body sizes."""
import json
from pathlib import Path

import bpy
from mathutils import Quaternion, Vector

ROOT = Path(__file__).resolve().parents[1]
assert bpy.context.scene.name == 'Proportion_Study_Unjoined'
assert bpy.context.mode == 'OBJECT'
report = []
for gender, lift in [('Male', 0.065), ('Female', 0.060)]:
    head = bpy.data.objects[gender + '_Study_Head']
    body = bpy.data.objects[gender + '_Study_Body']
    before = list(head.location)
    head.location.z = lift
    head['study_head_lift_m'] = lift
    head['proportion_review'] = 'Head size retained; neck placement pending visual review'
    report.append({'gender': gender, 'before_location': before, 'after_location': list(head.location), 'head_scale': list(head.scale), 'head_vertices': len(head.data.vertices), 'head_faces': len(head.data.polygons), 'body_scale': list(body.scale), 'body_vertices': len(body.data.vertices), 'body_faces': len(body.data.polygons), 'geometry_edited': False, 'joined': False})
bpy.context.view_layer.update()
for obj in bpy.context.scene.objects:
    obj.hide_set(False)
    obj.select_set(False)
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        space = area.spaces.active
        space.shading.type = 'SOLID'
        space.shading.color_type = 'OBJECT'
        space.overlay.show_face_orientation = False
        space.overlay.show_wireframes = False
        space.region_3d.view_rotation = Quaternion((1, 0, 0), 1.5707963267948966)
        space.region_3d.view_location = Vector((0, 0, 0.92))
        space.region_3d.view_distance = 3.4
        space.region_3d.view_perspective = 'ORTHO'
(ROOT / 'reports/proportion-neck-position-review.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/proportion-neck-position-review.blend'))
print('PROPORTION_POSITION_UPDATED', flush=True)
