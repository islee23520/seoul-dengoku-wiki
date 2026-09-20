# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Render the saved reusable eye through Blender's actual refractive material."""
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
scene = bpy.context.scene
for obj in list(scene.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
with bpy.data.libraries.load(str(ROOT / 'deliverables/shared-eye-master.blend'), link=False) as (source, target):
    target.objects = list(source.objects)
for obj in target.objects:
    scene.collection.objects.link(obj)
scene.render.engine = 'CYCLES'
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 10
scene.cycles.transmission_bounces = 8
scene.render.resolution_x = 850
scene.render.resolution_y = 850
scene.render.resolution_percentage = 100
scene.world.color = (.25, .25, .25)
scene.view_settings.view_transform = 'AgX'
camera = bpy.data.objects.new('EyeReviewCamera', bpy.data.cameras.new('EyeReviewCamera'))
scene.collection.objects.link(camera)
scene.camera = camera
camera.data.type = 'ORTHO'
camera.data.ortho_scale = .031
camera.data.clip_start = .0001
camera.data.clip_end = 2.0
for index, position in enumerate([(-.03, -.04, .035), (.045, -.025, .01), (.0, .03, .04)]):
    data = bpy.data.lights.new(f'EyeLight{index}', 'AREA')
    data.energy = [.08, .025, .045][index]
    data.shape = 'RECTANGLE'
    data.size = .025
    data.size_y = .012
    light = bpy.data.objects.new(data.name, data)
    scene.collection.objects.link(light)
    light.location = position
    light.rotation_euler = (-light.location).to_track_quat('-Z', 'Y').to_euler()
output = ROOT / 'evidence/shared-eye-final'
output.mkdir(parents=True, exist_ok=True)
for label, direction in [('front', (0, -1, 0)), ('quarter', (.55, -1, .15)), ('side', (1, -.08, 0))]:
    camera.location = Vector(direction) * .08
    camera.rotation_euler = (-camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(output / f'{label}.png')
    bpy.ops.render.render(write_still=True)
bpy.data.objects['Eye_Cornea_Lens'].hide_render = True
camera.location = (0, -.08, 0)
camera.rotation_euler = (-camera.location).to_track_quat('-Z', 'Y').to_euler()
scene.render.filepath = str(output / 'front-without-cornea.png')
bpy.ops.render.render(write_still=True)
print('SHARED_EYE_RENDER_COMPLETE', flush=True)
