# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Inspect gum-only and representative individual teeth without changing originals."""
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import components

scene = bpy.context.scene
for obj in list(scene.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
with bpy.data.libraries.load(str(ROOT / 'work/oral-separated-verified.blend'), link=False) as (src, dst):
    dst.objects = [n for n in src.objects if n.startswith('Male_') and 'Gum' in n]
source_objects = dst.objects
scene.render.engine = 'CYCLES'
scene.cycles.samples = 16
scene.cycles.use_denoising = True
scene.render.resolution_x = 900
scene.render.resolution_y = 700
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'AgX'
scene.world.color = (.25, .25, .25)
clay = bpy.data.materials.new('OralComponentClay')
clay.use_nodes = True
shader = clay.node_tree.nodes['Principled BSDF']
shader.inputs['Base Color'].default_value = (.48, .30, .22, 1)
shader.inputs['Roughness'].default_value = .8
scene.view_layers[0].material_override = clay
cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera'))
scene.collection.objects.link(cam)
scene.camera = cam
cam.data.type = 'ORTHO'
cam.data.clip_start = .00001
lights = []
for i in range(2):
    light = bpy.data.objects.new(f'Light{i}', bpy.data.lights.new(f'Light{i}', 'AREA'))
    scene.collection.objects.link(light)
    lights.append(light)
out = ROOT / 'evidence/oral-components'
out.mkdir(parents=True, exist_ok=True)
for source in source_objects:
    src_bm = bmesh.new()
    src_bm.from_mesh(source.data)
    src_bm.verts.ensure_lookup_table()
    parts = components(src_bm)
    for index in [0, 1, 3]:
        ids = {v.index for v in parts[index]}
        mesh = source.data.copy()
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bm.verts.ensure_lookup_table()
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.index not in ids], context='VERTS')
        bm.to_mesh(mesh)
        bm.free()
        obj = bpy.data.objects.new(f'{source.name}_component{index}', mesh)
        scene.collection.objects.link(obj)
        points = [v.co for v in mesh.vertices]
        center = Vector(tuple((min(p[a] for p in points) + max(p[a] for p in points)) / 2 for a in range(3)))
        size = max(max(p[a] for p in points) - min(p[a] for p in points) for a in range(3))
        cam.data.ortho_scale = size * 1.5
        for light, direction in zip(lights, [Vector((-.8, -1, 1)), Vector((1, .4, .5))]):
            light.location = center + direction * size * 3
            light.rotation_euler = (center - light.location).to_track_quat('-Z', 'Y').to_euler()
            light.data.energy = size * size * 80
            light.data.size = size * 2
        for view, direction in [('top', (0, -.1, 1)), ('bottom', (0, -.1, -1)), ('side', (1, -.7, .2))]:
            cam.location = center + Vector(direction) * size * 3
            cam.rotation_euler = (center - cam.location).to_track_quat('-Z', 'Y').to_euler()
            scene.render.filepath = str(out / f'{source.name.split(".")[0]}-part{index}-{view}.png')
            bpy.ops.render.render(write_still=True)
        bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.meshes.remove(mesh)
    src_bm.free()
print('ORAL_COMPONENT_VIEWS_COMPLETE', flush=True)
