# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run: Blender --background <blend> --python scripts/render_stage.py -- <stage> <prefix> ...
"""Render named character groups from consistent inspection angles."""
import sys
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
arguments = sys.argv[sys.argv.index('--') + 1:]
stage, prefixes = arguments[0], arguments[1:]
output = ROOT / 'evidence' / stage
output.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 16
scene.cycles.use_denoising = True
scene.render.resolution_x = 900
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
if scene.world is None:
    scene.world = bpy.data.worlds.new('StageReviewWorld')
scene.world.color = (0.35, 0.35, 0.35)
scene.view_settings.view_transform = 'Standard'
scene.render.image_settings.file_format = 'PNG'
meshes = [o for o in scene.objects if o.type == 'MESH']
for obj in meshes:
    obj.hide_render = True
bpy.ops.object.camera_add()
camera = bpy.context.object
scene.camera = camera
camera.data.type = 'ORTHO'
camera.data.clip_start = 0.0001
for location, energy, size in [((-3, -4, 5), 350, 4), ((3, -2, 2), 140, 3), ((0, 4, 4), 300, 3)]:
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.object
    light.data.energy = energy
    light.data.size = size
    light.rotation_euler = (Vector((0, 0, 0.8)) - light.location).to_track_quat('-Z', 'Y').to_euler()
for prefix in prefixes:
    group = [o for o in meshes if o.name.startswith(prefix)]
    assert group, prefix
    coords = [o.matrix_world @ v.co for o in group for v in o.data.vertices]
    center = Vector(tuple((min(v[a] for v in coords) + max(v[a] for v in coords)) / 2 for a in range(3)))
    extent = max(max(v[a] for v in coords) - min(v[a] for v in coords) for a in range(3))
    camera.data.ortho_scale = extent * 1.32
    for obj in group:
        obj.hide_render = False
    for view, offset in [('front', (0, -4, 0)), ('side', (4, 0, 0)), ('back', (0, 4, 0)), ('quarter', (2.4, -4, 0.6))]:
        camera.location = center + Vector(offset) * max(extent, 0.2)
        camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(output / f'{prefix}-{view}.png')
        bpy.ops.render.render(write_still=True)
    for obj in group:
        obj.hide_render = True
print('STAGE_RENDER_PASS', stage, flush=True)
