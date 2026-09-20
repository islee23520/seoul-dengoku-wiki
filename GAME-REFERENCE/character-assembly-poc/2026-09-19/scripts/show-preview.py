# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run: Blender work/assembled-bases.blend --python scripts/show-preview.py
"""Present the two working bases side by side in the native Blender viewport."""
import bpy
from mathutils import Quaternion, Vector

root = '/Users/danny/Documents/Character-Assembly-POC/2026-09-19'
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        obj.location.x = -1.03 if obj.name.startswith('Male') else 1.03
        obj.hide_set(False)
        obj.hide_render = False
        obj.color = (0.67, 0.45, 0.31, 1) if obj.name.startswith('Male') else (0.78, 0.56, 0.39, 1)
        if '_Oral_' in obj.name or any(label in obj.name for label in ['Gum', 'Tongue', 'Tooth']):
            obj.color = (0.32, 0.12, 0.10, 1)
for collection in bpy.data.collections:
    collection.hide_viewport = False
    collection.hide_render = False
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        obj.select_set(True)
bpy.context.view_layer.objects.active = bpy.data.objects.get('Male_Base')
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            space = area.spaces.active
            space.shading.type = 'SOLID'
            space.shading.light = 'STUDIO'
            space.shading.color_type = 'OBJECT'
            space.shading.show_shadows = True
            space.shading.show_cavity = True
            space.shading.cavity_type = 'BOTH'
            space.overlay.show_floor = False
            space.overlay.show_axis_x = False
            space.overlay.show_axis_y = False
            space.region_3d.view_rotation = Quaternion((1, 0, 0), 1.5707963267948966)
            space.region_3d.view_perspective = 'ORTHO'
            space.region_3d.view_location = Vector((0, 0, 0.88))
            space.region_3d.view_distance = 4.5
bpy.ops.wm.save_as_mainfile(filepath=root + '/work/assembly-preview.blend')
print('BLENDER_PREVIEW_READY', flush=True)
