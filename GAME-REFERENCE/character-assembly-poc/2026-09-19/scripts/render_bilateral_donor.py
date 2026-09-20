# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Comparable mirrored-camera and mirrored-light views for donor selection."""
from pathlib import Path
import sys

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
scene = bpy.context.scene
obj = next(o for o in scene.objects if o.type == 'MESH')
bpy.context.view_layer.update()
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.resolution_x = 900
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.world = bpy.data.worlds.new('BilateralQAWorld')
scene.world.color = (.3, .3, .3)
scene.view_settings.view_transform = 'AgX'
mat = bpy.data.materials.new('BilateralClay')
mat.use_nodes = True
shader = mat.node_tree.nodes['Principled BSDF']
shader.inputs['Base Color'].default_value = (.46, .34, .25, 1)
shader.inputs['Roughness'].default_value = .8
scene.view_layers[0].material_override = mat
camera = bpy.data.objects.new('BilateralCamera', bpy.data.cameras.new('BilateralCamera'))
scene.collection.objects.link(camera)
scene.camera = camera
camera.data.type = 'ORTHO'
camera.data.clip_start = .001
camera.data.clip_end = 10
lights = []
for i in range(2):
    light = bpy.data.objects.new(f'BilateralLight{i}', bpy.data.lights.new(f'BilateralLight{i}', 'AREA'))
    scene.collection.objects.link(light)
    light.data.energy = [24, 12][i]
    light.data.size = .5
    lights.append(light)
stage = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'bilateral-donor-world-corrected'
output = ROOT / 'evidence' / stage
output.mkdir(parents=True, exist_ok=True)
center = obj.matrix_world @ Vector((0, 0, 1.61))
print('DONOR_RENDER_TARGET', tuple(center), tuple(obj.matrix_world.translation), flush=True)
for sign, side in [(-1, 'negative'), (1, 'positive')]:
    for light, offset in zip(lights, [Vector((sign * .5, -.5, .6)), Vector((-sign * .4, .2, .3))]):
        light.location = center + offset
        light.rotation_euler = (center - light.location).to_track_quat('-Z', 'Y').to_euler()
    for view, direction in [('quarter', (sign * .65, -1, .1)), ('side', (sign, -.05, 0)), ('rear-quarter', (sign * .65, 1, .1))]:
        camera.location = center + Vector(direction)
        camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
        camera.data.ortho_scale = .48
        scene.render.filepath = str(output / f'{side}-{view}.png')
        bpy.ops.render.render(write_still=True)
print('BILATERAL_DONOR_RENDER_COMPLETE', flush=True)
