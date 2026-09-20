# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run: Blender --background work/audit/imported-sources.blend --python scripts/audit-render.py
"""Render source candidates without changing their geometry."""
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path('/Users/danny/Documents/Character-Assembly-POC/2026-09-19')
OUT = ROOT / 'evidence/baseline'
OUT.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 12
scene.cycles.use_denoising = True
scene.render.resolution_x = 660
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.world.color = (0.35, 0.35, 0.35)
scene.view_settings.view_transform = 'Standard'
scene.render.image_settings.file_format = 'PNG'
bpy.ops.object.camera_add()
camera = bpy.context.object
scene.camera = camera
camera.data.type = 'ORTHO'
for location, energy, size in [((-3, -4, 5), 350, 4), ((3, -2, 2), 140, 3), ((0, 4, 4), 300, 3)]:
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.object
    light.data.energy = energy
    light.data.shape = 'DISK'
    light.data.size = size
    light.rotation_euler = (Vector((0, 0, 0.5)) - light.location).to_track_quat('-Z', 'Y').to_euler()
for index in range(6):
    collection = next(c for c in bpy.data.collections if c.name.startswith(f'SOURCE_{index:02d}_'))
    collection.hide_render = False
    collection.hide_viewport = False
    obj = next(o for o in collection.objects if o.type == 'MESH')
    coords = [obj.matrix_world @ v.co for v in obj.data.vertices]
    center = Vector(tuple((min(v[a] for v in coords) + max(v[a] for v in coords)) / 2 for a in range(3)))
    camera.data.ortho_scale = 1.38
    for view, offset in [('front', (0, -4, 0)), ('side', (4, 0, 0)), ('back', (0, 4, 0))]:
        camera.location = center + Vector(offset)
        camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(OUT / f'source-{index:02d}-{view}.png')
        bpy.ops.render.render(write_still=True)
        print('VIEW_SAVED', scene.render.filepath, flush=True)
    collection.hide_render = True
    collection.hide_viewport = True
print('BASELINE_RENDER_PASS', flush=True)
