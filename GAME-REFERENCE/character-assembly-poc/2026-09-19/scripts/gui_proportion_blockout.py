# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Reversible unjoined proportion study made from untouched FBX sources."""
import json
from pathlib import Path
import bpy
from mathutils import Matrix, Quaternion, Vector

ROOT = Path(__file__).resolve().parents[1]
scene = bpy.data.scenes.new('Proportion_Study_Unjoined')
bpy.context.window.scene = scene
scene.unit_settings.system = 'METRIC'
rows = []
for gender, head_index, body_index, scale, chin, overlap, target, position in [
    ('Male', 6, 9, 0.15, 0.20, 0.025, 1.75, -1.05),
    ('Female', 11, 8, 0.19, 0.23, 0.028, 1.65, 1.05),
]:
    collection = bpy.data.collections.new(gender + '_Proportion_Study')
    scene.collection.children.link(collection)
    copies = []
    for label, index in [('Head', head_index), ('Body', body_index)]:
        source = next(o for o in bpy.data.objects if o.name.startswith(f'SRC_{index:02d}_') and o.type == 'MESH')
        assert source.parent is None
        world = source.matrix_basis.copy()
        obj = source.copy()
        obj.data = source.data.copy()
        obj.name = gender + '_Study_' + label
        obj.matrix_world = Matrix.Identity(4)
        obj.data.transform(world)
        collection.objects.link(obj)
        obj.hide_set(False)
        obj.hide_render = False
        obj.color = (0.70, 0.54, 0.41, 1)
        obj['study_only_not_joined'] = True
        copies.append(obj)
    head, body = copies
    body_top = max(v.co.z for v in body.data.vertices)
    head_top = max(v.co.z for v in head.data.vertices)
    assert 0.8 < body_top < 1.1 and 0.95 < head_top < 1.05
    head_y = 0.07 if gender == 'Male' else 0.07
    body_y = 0.006 if gender == 'Male' else 0.024
    translation = Vector((0, body_y - head_y * scale, body_top - chin * scale - overlap))
    head.data.transform(Matrix.Translation(translation) @ Matrix.Scale(scale, 4))
    total = max(v.co.z for v in head.data.vertices)
    meters = target / total
    for obj in copies:
        obj.data.transform(Matrix.Scale(meters, 4))
        obj.location.x = position
    head_length = (head_top - chin) * scale * meters
    rows.append({'gender': gender, 'height_m': target, 'head_height_estimate_m': head_length, 'estimated_heads_tall': target / head_length, 'head_scale_source': scale, 'head_translation_source': list(translation), 'source_to_meters': meters, 'chin_source_z_assumed': chin, 'source_head': head_index, 'source_body': body_index, 'status': 'UNJOINED_PROPORTION_STUDY_NOT_APPROVED'})
scene['status'] = 'Unjoined proportion study: overlapping neck sections will be replaced after proportions are accepted.'
bpy.context.view_layer.update()
for obj in scene.objects:
    obj.select_set(False)
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        space = area.spaces.active
        space.shading.type = 'SOLID'
        space.shading.color_type = 'OBJECT'
        space.overlay.show_face_orientation = False
        space.overlay.show_wireframes = False
        space.overlay.show_floor = False
        space.overlay.show_axis_x = False
        space.overlay.show_axis_y = False
        space.region_3d.view_rotation = Quaternion((1, 0, 0), 1.5707963267948966)
        space.region_3d.view_location = Vector((0, 0, 0.85))
        space.region_3d.view_distance = 4.8
        space.region_3d.view_perspective = 'ORTHO'
(ROOT / 'reports/proportion-study.json').write_text(json.dumps(rows, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/proportion-study-unjoined.blend'))
print('PROPORTION_STUDY_READY', flush=True)
