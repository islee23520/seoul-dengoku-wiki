# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Build final integration scene: both bases + eyes + oral parts + toon materials."""
import json
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
assert bpy.app.background

bpy.ops.wm.read_homefile(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'

# 1. Female base (color baked)
with bpy.data.libraries.load(str(ROOT / 'work/female-base-color-baked.blend'), link=False) as (src, dst):
    avail = [n for n in src.objects if 'Female' in n or 'Bake' in n]
    dst.objects = avail
female = next((o for o in dst.objects if o.name == 'Female_Base_Assembly'), None)
if female:
    scene.collection.objects.link(female)
    female.location.x = 0.6
print(f'Female: {female.name if female else "NOT FOUND"} ({len(female.data.vertices)}v)' if female else 'Female: NOT FOUND', flush=True)

# 2. Male base
with bpy.data.libraries.load(str(ROOT / 'work/male-base-uv-retry.blend'), link=False) as (src, dst):
    avail = [n for n in src.objects if 'Male' in n]
    dst.objects = avail
male = next((o for o in dst.objects if o.name == 'Male_Base_Symmetric'), None)
if male:
    scene.collection.objects.link(male)
    male.location.x = -0.6
print(f'Male: {male.name if male else "NOT FOUND"} ({len(male.data.vertices)}v)' if male else 'Male: NOT FOUND', flush=True)

# 3. Shared eyes
try:
    with bpy.data.libraries.load(str(ROOT / 'deliverables/shared-eye-master.blend'), link=False) as (src, dst):
        avail = [n for n in src.objects if 'eye' in n.lower() or 'Eye' in n or 'sclera' in n.lower() or 'iris' in n.lower() or 'cornea' in n.lower() or 'pupil' in n.lower()]
        dst.objects = avail
    eyes = [o for o in dst.objects if o.type == 'MESH']
    for e in eyes:
        scene.collection.objects.link(e)
    print(f'Eyes: {[e.name for e in eyes]}', flush=True)
except Exception as e:
    print(f'Eyes load failed: {e}', flush=True)

# 4. Male oral parts
try:
    with bpy.data.libraries.load(str(ROOT / 'work/recovered-oral-final-contact-review.blend'), link=False) as (src, dst):
        avail = [n for n in src.objects if any(k in n.lower() for k in ['gum', 'tooth', 'molar', 'incisor', 'tongue', 'oral'])]
        dst.objects = avail
    orals = [o for o in dst.objects if o.type == 'MESH']
    for o in orals:
        scene.collection.objects.link(o)
    print(f'Male oral: {[o.name for o in orals]}', flush=True)
except Exception as e:
    print(f'Oral load failed: {e}', flush=True)

# 5. Create toon material for bases
skin_mat = bpy.data.materials.new('ToonSkin')
skin_mat.use_nodes = True
nodes = skin_mat.node_tree.nodes
links = skin_mat.node_tree.links
output = next(n for n in nodes if n.type == 'OUTPUT_MATERIAL')
for n in list(nodes):
    if n != output:
        nodes.remove(n)
toon = nodes.new('ShaderNodeBsdfToon')
toon.inputs['Color'].default_value = (0.72, 0.54, 0.42, 1)
toon.inputs['Size'].default_value = 0.5
toon.inputs['Smooth'].default_value = 0.05
links.new(toon.outputs[0], output.inputs['Surface'])

# Apply toon to bases (preserving existing UV/materials for bake info)
for base in [female, male]:
    if base:
        # Add toon as override for now
        base.data.materials.clear()
        base.data.materials.append(skin_mat)

# 6. Lighting
world = bpy.data.worlds.new('IntegrationWorld')
scene.world = world
world.color = (0.4, 0.4, 0.45)

for i, (loc, energy, size) in enumerate([
    [(-3, -4, 5), 500, 5],
    [(4, -2, 3), 200, 4],
    [(0, 4, 4), 300, 4],
]):
    light = bpy.data.objects.new(f'Light_{i}', bpy.data.lights.new(f'Light_{i}', 'AREA'))
    scene.collection.objects.link(light)
    light.location = Vector(loc)
    light.data.energy = energy
    light.data.size = size
    light.rotation_euler = (Vector((0, 0, 0.8)) - light.location).to_track_quat('-Z', 'Y').to_euler()

# 7. Camera
camera = bpy.data.objects.new('IntegrationCam', bpy.data.cameras.new('IntegrationCam'))
scene.collection.objects.link(camera)
scene.camera = camera
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 2.8
camera.location = Vector((0, -4, 0.8))
camera.rotation_euler = (Vector((0, 0, 0.8)) - camera.location).to_track_quat('-Z', 'Y').to_euler()

# Save
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'deliverables/final-integration.blend'))

report = {
    'female': {'name': female.name if female else None, 'vertices': len(female.data.vertices) if female else 0},
    'male': {'name': male.name if male else None, 'vertices': len(male.data.vertices) if male else 0},
    'eyes_loaded': len([o for o in bpy.data.objects if 'eye' in o.name.lower() or 'Eye' in o.name]),
    'oral_loaded': len([o for o in bpy.data.objects if any(k in o.name.lower() for k in ['gum','tooth','molar','tongue'])]),
    'material': 'ToonSkin (ShaderNodeBsdfToon)',
}
(ROOT / 'reports/final-integration.json').write_text(json.dumps(report, indent=2))
print('INTEGRATION_SCENE_BUILT', json.dumps(report), flush=True)
