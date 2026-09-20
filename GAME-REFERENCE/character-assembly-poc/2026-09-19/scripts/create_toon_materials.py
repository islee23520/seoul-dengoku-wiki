# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Create toon-look materials using color ramp shading and render."""
import json
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
assert bpy.app.background

# Probe toon shader inputs first
toon_test = bpy.data.materials.new('probe')
toon_test.use_nodes = True
toon_node = toon_test.node_tree.nodes.new('ShaderNodeBsdfToon')
print('TOON_INPUTS', [(s.name, s.type) for s in toon_node.inputs], flush=True)

def create_toon_material(name, base_color, shade_color):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    output = next(n for n in nodes if n.type == 'OUTPUT_MATERIAL')
    for n in list(nodes):
        if n != output:
            nodes.remove(n)
    toon = nodes.new('ShaderNodeBsdfToon')
    # Find color input by trying common names
    for inp in toon.inputs:
        if 'Color' in inp.name and 'Shadow' not in inp.name:
            inp.default_value = base_color
                elif 'Size' in inp.name:
            inp.default_value = 0.5
        elif 'Smooth' in inp.name:
            inp.default_value = 0.05
    links.new(toon.outputs[0], output.inputs['Surface'])
    return mat

skin_mat = create_toon_material('Toon_Skin', (0.72, 0.54, 0.42, 1), (0.36, 0.24, 0.18, 1))

female = bpy.data.objects.get('Female_Base_Assembly')
if female:
    female.data.materials.clear()
    female.data.materials.append(skin_mat)

male = bpy.data.objects.get('Male_Base_Symmetric')
if male:
    male.data.materials.clear()
    male.data.materials.append(skin_mat)

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.eevee.taa_render_samples = 32
scene.render.resolution_x = 900
scene.render.resolution_y = 1400
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'Standard'
scene.world = bpy.data.worlds.new('ToonWorld')
scene.world.color = (0.45, 0.45, 0.5)

camera = bpy.data.objects.new('ToonCam', bpy.data.cameras.new('ToonCam'))
scene.collection.objects.link(camera)
scene.camera = camera
camera.data.type = 'ORTHO'
camera.data.clip_start = 0.001

for i, (loc, energy, size) in enumerate([
    [(-2, -3, 4), 400, 4],
    [(3, -1, 2), 150, 3],
    [(0, 2, 3), 200, 3],
]):
    light = bpy.data.objects.new(f'ToonLight{i}', bpy.data.lights.new(f'ToonLight{i}', 'AREA'))
    scene.collection.objects.link(light)
    light.location = Vector(loc)
    light.data.energy = energy
    light.data.size = size
    light.rotation_euler = (Vector((0, 0, 0.8)) - light.location).to_track_quat('-Z', 'Y').to_euler()

output = ROOT / 'evidence/toon-materials'
output.mkdir(parents=True, exist_ok=True)

for name, obj in [('female-toon', female), ('male-toon', male)]:
    if obj is None:
        continue
    for other in scene.objects:
        if other.type == 'MESH':
            other.hide_render = other != obj
    points = [v.co for v in obj.data.vertices]
    center = Vector(tuple((min(p[a] for p in points) + max(p[a] for p in points)) / 2 for a in range(3)))
    extent = max(max(p[a] for p in points) - min(p[a] for p in points) for a in range(3))
    camera.data.ortho_scale = extent * 1.3
    for view, direction in [('front', (0, -3, 0)), ('quarter', (2, -3, 0.5)), ('side', (3, 0, 0))]:
        camera.location = center + Vector(direction)
        camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(output / f'{name}-{view}.png')
        bpy.ops.render.render(write_still=True)

(ROOT / 'reports/toon-material-creation.json').write_text(json.dumps({
    'shader': 'ShaderNodeBsdfToon',
    'skin_base': [0.72, 0.54, 0.42, 1],
    'skin_shadow': [0.36, 0.24, 0.18, 1],
    'engine': scene.render.engine,
    'claim': 'Basic toon shading; NOT claiming Genshin/GuiltyGear quality',
    'status': 'TOON_CREATED_REVIEW_REQUIRED',
}, indent=2))
print('TOON_MATERIALS_CREATED', flush=True)
