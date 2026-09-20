# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Compare repaired molars to their exact donors and placement in the original arch."""
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import components

scene = bpy.context.scene
positive = bpy.data.objects['Male_UpperMolar_positive_Repaired']
negative = bpy.data.objects['Male_UpperMolar_negative_Repaired']
with bpy.data.libraries.load(str(ROOT / 'work/oral-separated-verified.blend'), link=False) as (source, target):
    target.objects = [name for name in source.objects if name.startswith('Male_UpperGum')]
original = target.objects[0]
scene.collection.objects.link(original)
bm = bmesh.new()
bm.from_mesh(original.data)
bm.verts.ensure_lookup_table()
parts = components(bm)
part_ids = [{v.index for v in part} for part in parts]
bm.free()


def extract(name, retained):
    mesh = original.data.copy()
    edit = bmesh.new()
    edit.from_mesh(mesh)
    edit.verts.ensure_lookup_table()
    bmesh.ops.delete(edit, geom=[v for v in edit.verts if v.index not in retained], context='VERTS')
    edit.to_mesh(mesh)
    edit.free()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    return obj


negative_before = extract('NegativeMolarBefore', part_ids[4])
positive_before = extract('PositiveMolarBefore', part_ids[5])
arch_without_pair = extract('ArchWithoutReplacedPair', set(range(len(original.data.vertices))) - part_ids[4] - part_ids[5])
all_objects = [original, positive, negative, positive_before, negative_before, arch_without_pair]
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.resolution_x = 1000
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'AgX'
scene.world = bpy.data.worlds.new('MolarComparisonWorld')
scene.world.color = (.25, .25, .25)
clay = bpy.data.materials.new('MolarComparisonClay')
clay.use_nodes = True
clay.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.58, .48, .34, 1)
clay.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .8
scene.view_layers[0].material_override = clay
camera = bpy.data.objects.new('MolarComparisonCamera', bpy.data.cameras.new('MolarComparisonCamera'))
scene.collection.objects.link(camera)
scene.camera = camera
camera.data.type = 'ORTHO'
camera.data.clip_start = .00001
lights = []
for i in range(2):
    light = bpy.data.objects.new(f'MolarComparisonLight{i}', bpy.data.lights.new(f'MolarComparisonLight{i}', 'AREA'))
    scene.collection.objects.link(light)
    lights.append(light)
stage = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'upper-molar-pair-repair'
output = ROOT / 'evidence' / stage
output.mkdir(parents=True, exist_ok=True)
for case, before, after in [
    ('negative', [negative_before], [negative]),
    ('positive', [positive_before], [positive]),
    ('arch', [original], [arch_without_pair, positive, negative]),
]:
    points = [v.co for obj in before for v in obj.data.vertices]
    center = Vector(tuple((min(p[a] for p in points) + max(p[a] for p in points)) / 2 for a in range(3)))
    size = max(max(p[a] for p in points) - min(p[a] for p in points) for a in range(3))
    camera.data.ortho_scale = size * 1.4
    for light, direction in zip(lights, [Vector((-1, -1, 1)), Vector((1, .5, .5))]):
        light.location = center + direction * size * 3
        light.rotation_euler = (center - light.location).to_track_quat('-Z', 'Y').to_euler()
        light.data.energy = size * size * 80
        light.data.size = size * 2
    for state, visible in [('before', before), ('after', after)]:
        for obj in all_objects:
            obj.hide_render = obj not in visible
        for view, direction in [('root', (0, -.15, 1)), ('crown', (0, -.15, -1)), ('side', (-1 if case == 'negative' else 1, -.7, .15))]:
            camera.location = center + Vector(direction) * size * 3
            camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
            scene.render.filepath = str(output / f'{case}-{state}-{view}.png')
            bpy.ops.render.render(write_still=True)
print('UPPER_MOLAR_COMPARISON_RENDERED', flush=True)
