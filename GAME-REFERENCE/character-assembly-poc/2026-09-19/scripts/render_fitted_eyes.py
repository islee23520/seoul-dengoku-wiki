# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Inspect linked eye fit from frontal, oblique and lateral views."""
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
scene = bpy.data.scenes['Shared_Eyes_Fitted_Review']
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.cycles.transmission_bounces = 8
scene.render.resolution_x = 900
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'AgX'
scene.world = bpy.data.worlds.new('EyeFitWorld')
scene.world.color = (.3, .3, .3)
cam = bpy.data.objects.new('EyeFitCamera', bpy.data.cameras.new('EyeFitCamera'))
scene.collection.objects.link(cam)
scene.camera = cam
cam.data.type = 'ORTHO'
cam.data.ortho_scale = .31
cam.data.clip_start = .001
for i, pos in enumerate([(-.4, -.6, .7), (.45, -.3, .3), (0, .4, .6)]):
    light = bpy.data.objects.new(f'EyeFitLight{i}', bpy.data.lights.new(f'EyeFitLight{i}', 'AREA'))
    scene.collection.objects.link(light)
    light.location = pos
    light.data.energy = [12, 5, 8][i]
    light.data.size = .35
    light.rotation_euler = (Vector((0, 0, .16)) - light.location).to_track_quat('-Z', 'Y').to_euler()
meshes = [o for o in scene.objects if o.type == 'MESH']
out = ROOT / 'evidence/shared-eyes-fitted'
out.mkdir(parents=True, exist_ok=True)
for gender in ['Male', 'Female']:
    for obj in meshes:
        obj.hide_render = not obj.name.startswith(gender)
    center = Vector((0, -.01, .155))
    for label, direction in [('front', (0, -1, 0)), ('quarter', (.6, -1, .05)), ('side', (1, -.05, .0))]:
        cam.location = center + Vector(direction)
        cam.rotation_euler = (center - cam.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(out / f'{gender}-{label}.png')
        bpy.ops.render.render(write_still=True, scene=scene.name)
print('FITTED_EYE_RENDER_COMPLETE', flush=True)
