# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Render intact oral groups from fixed views for anatomical assignment review."""
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
scene = bpy.data.scenes['Oral_Surface_Assigned_Review']
scene.render.engine = 'CYCLES'
scene.cycles.samples = 12
scene.cycles.use_denoising = True
scene.render.resolution_x = 900
scene.render.resolution_y = 700
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'Standard'
scene.world = bpy.data.worlds.new('OralReviewWorld')
scene.world.color = (0.25, 0.25, 0.25)
camera_data = bpy.data.cameras.new('OralReviewCamera')
camera = bpy.data.objects.new('OralReviewCamera', camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 0.32
for index, location in enumerate([(-1, -1, 2), (1, 0, 1)]):
    data = bpy.data.lights.new(f'OralReviewLight{index}', 'AREA')
    data.energy = 70
    data.size = 1.2
    obj = bpy.data.objects.new(data.name, data)
    scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector((0, -.2, .3)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
meshes = [o for o in scene.objects if o.type == 'MESH']
output = ROOT / 'evidence/oral-surface-assigned-review'
output.mkdir(parents=True, exist_ok=True)
for gender in ['Male', 'Female']:
    group = [o for o in meshes if o.name.startswith(gender)]
    colors = {'UpperGum_WithTeeth': (0.12, 0.42, 0.75, 1), 'LowerGum_WithTeeth': (0.75, 0.28, 0.10, 1), 'Tongue': (0.52, 0.10, 0.22, 1)}
    for obj in group:
        material = bpy.data.materials.new(obj.name + '_RoleColor')
        material.diffuse_color = colors[obj['role']]
        material.use_nodes = True
        material.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value = colors[obj['role']]
        material.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value = 0.75
        obj.data.materials.clear()
        obj.data.materials.append(material)
    for obj in meshes:
        obj.hide_render = obj not in group
    center = Vector((0, -.21, .29 if gender == 'Male' else .31))
    for label, direction in [('front', (0, -1, 0)), ('upper', (0, -.7, .7)), ('side', (1, -.4, .15))]:
        camera.location = center + Vector(direction)
        camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(output / f'{gender}-{label}.png')
        bpy.ops.render.render(write_still=True, scene=scene.name)
    for role in colors:
        for obj in group:
            obj.hide_render = obj['role'] != role
        camera.location = center + Vector((0, -.7, .7))
        camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(output / f'{gender}-{role}.png')
        bpy.ops.render.render(write_still=True, scene=scene.name)
print('ORAL_REVIEW_RENDER_COMPLETE', flush=True)
