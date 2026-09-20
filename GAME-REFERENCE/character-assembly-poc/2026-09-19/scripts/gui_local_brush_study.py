# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Prepare an untouched baseline duplicate for visually targeted sculpt strokes."""
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
name = 'Male_Protected_Body_Neck_Trial'
with bpy.data.libraries.load(str(ROOT / 'work/protected-body-neck-trial.blend'), link=False) as (source, target):
    target.objects = [name]
obj = target.objects[0]
obj.name = 'Local_Brush_Baseline_No_Owner_Deltas'
scene = bpy.data.scenes.new('Local_Brush_Reproduction')
bpy.context.window.scene = scene
scene.collection.objects.link(obj)
center = (min(v.co.x for v in obj.data.vertices) + max(v.co.x for v in obj.data.vertices)) / 2
obj.data.transform(Matrix.Translation((-center, 0, 0)))
obj.matrix_world = Matrix.Translation((center, 0, 0))
assert '.sculpt_mask' not in obj.data.attributes
obj.hide_set(False)
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
obj.data.use_mirror_x = False
bpy.ops.object.mode_set(mode='SCULPT')
area = next(a for a in bpy.context.screen.areas if a.type == 'VIEW_3D')
region = next(r for r in area.regions if r.type == 'WINDOW')
with bpy.context.temp_override(area=area, region=region):
    status = bpy.ops.brush.asset_activate(asset_library_type='ESSENTIALS', relative_asset_identifier='brushes/essentials_brushes-mesh_sculpt.blend/Brush/Smooth')
assert status == {'FINISHED'}
brush = bpy.context.tool_settings.sculpt.brush
brush.strength = 0.35
brush.size = 55
brush.use_frontface = True
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        s = area.spaces.active
        s.shading.type = 'SOLID'
        s.shading.color_type = 'OBJECT'
        s.overlay.show_wireframes = False
        s.overlay.show_face_orientation = False
        s.show_region_ui = False
        s.region_3d.view_rotation = Vector((-1, -1, 0.05)).to_track_quat('Z', 'Y')
        s.region_3d.view_location = Vector((-1.085, 0, 1.565))
        s.region_3d.view_distance = 0.34
        s.region_3d.view_perspective = 'ORTHO'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/local-brush-baseline.blend'))
print('LOCAL_BRUSH_BASELINE_READY', flush=True)
