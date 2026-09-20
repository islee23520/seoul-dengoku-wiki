# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Load both bases into one scene and render toon materials."""
import bpy
import json
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
assert bpy.app.background

# Load female
female = bpy.data.objects.get('Female_Base_Assembly')
if not female:
    with bpy.data.libraries.load(str(ROOT/'work/female-base-clean.blend'), link=False) as (src,dst):
        dst.objects = ['Female_Base_Assembly']
    female = dst.objects[0]
    bpy.context.scene.collection.objects.link(female)

# Load male symmetric
with bpy.data.libraries.load(str(ROOT/'work/male-base-symmetric-center-quads.blend'), link=False) as (src,dst):
    dst.objects = ['Male_Base_Symmetric']
male = dst.objects[0]
bpy.context.scene.collection.objects.link(male)

# Position male to the left
male.location.x = -1.2
bpy.context.view_layer.update()

# Create toon material
skin = bpy.data.materials.new('ToonSkin')
skin.use_nodes = True
nodes, links = skin.node_tree.nodes, skin.node_tree.links
output = next(n for n in nodes if n.type=='OUTPUT_MATERIAL')
for n in list(nodes):
    if n != output:
        nodes.remove(n)
toon = nodes.new('ShaderNodeBsdfToon')
toon.inputs['Color'].default_value = (0.72, 0.54, 0.42, 1)
toon.inputs['Size'].default_value = 0.5
toon.inputs['Smooth'].default_value = 0.05
links.new(toon.outputs[0], output.inputs['Surface'])

for obj in [female, male]:
    obj.data.materials.clear()
    obj.data.materials.append(skin)

# Render setup
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.eevee.taa_render_samples = 32
scene.render.resolution_x = 1600
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'Standard'
scene.world = bpy.data.worlds.new('ToonWorld')
scene.world.color = (0.45, 0.45, 0.5)

camera = bpy.data.objects.new('BothCam', bpy.data.cameras.new('BothCam'))
scene.collection.objects.link(camera)
scene.camera = camera
camera.data.type = 'ORTHO'
camera.data.clip_start = 0.001

for i, (loc, energy, size) in enumerate([
    [(-2, -4, 5), 500, 5],
    [(4, -2, 3), 200, 4],
    [(0, 3, 4), 300, 4],
]):
    light = bpy.data.objects.new(f'BothLight{i}', bpy.data.lights.new(f'BothLight{i}', 'AREA'))
    scene.collection.objects.link(light)
    light.location = Vector(loc)
    light.data.energy = energy
    light.data.size = size
    light.rotation_euler = (Vector((0, 0, 0.8)) - light.location).to_track_quat('-Z','Y').to_euler()

output = ROOT / 'evidence/toon-materials'
output.mkdir(parents=True, exist_ok=True)
for view, direction in [('front', (0,-4,0)), ('quarter', (2,-4,0.5)), ('side', (4,0,0))]:
    camera.location = Vector(direction) + Vector((0, 0, 0.8))
    camera.rotation_euler = (Vector((0, 0, 0.8)) - camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.ortho_scale = 2.8
    scene.render.filepath = str(output / f'both-bases-{view}.png')
    bpy.ops.render.render(write_still=True)

(ROOT / 'reports/toon-material-creation.json').write_text(json.dumps({
    'shader': 'ShaderNodeBsdfToon',
    'color': [0.72, 0.54, 0.42, 1],
    'size': 0.5,
    'smooth': 0.05,
    'engine': 'BLENDER_EEVEE',
    'renders': 'evidence/toon-materials/both-bases-*.png',
    'claim': 'Basic toon shading attempt; NOT claiming Genshin/GuiltyGear quality',
}, indent=2))
print('BOTH_BASES_TOON_RENDERED', flush=True)
