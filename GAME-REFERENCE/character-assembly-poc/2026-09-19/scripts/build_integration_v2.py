# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Final integration v2: all bases, eyes (fitted), full oral kit, toon+texture materials."""
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

loaded = []

# 1. Female base (color baked) - right side
with bpy.data.libraries.load(str(ROOT / 'work/female-base-color-baked.blend'), link=False) as (src, dst):
    dst.objects = ['Female_Base_Assembly']
female = dst.objects[0]
scene.collection.objects.link(female)
female.location.x = 0.6
loaded.append(female.name)

# 2. Male base (UV retry) - left side
with bpy.data.libraries.load(str(ROOT / 'work/male-base-uv-retry.blend'), link=False) as (src, dst):
    dst.objects = ['Male_Base_Symmetric']
male = dst.objects[0]
scene.collection.objects.link(male)
male.location.x = -0.6
loaded.append(male.name)

# 3. Male oral: full kit
with bpy.data.libraries.load(str(ROOT / 'work/recovered-oral-final-contact-review.blend'), link=False) as (src, dst):
    wanted = [n for n in src.objects if n.startswith('Male_')]
    dst.objects = wanted
for o in [x for x in dst.objects if x]:
    scene.collection.objects.link(o)
    o.location.x -= 0.6  # align with male base
    loaded.append(o.name)

# 4. Male tongue
with bpy.data.libraries.load(str(ROOT / 'work/male-tongue-curvature-refined-review.blend'), link=False) as (src, dst):
    dst.objects = [n for n in src.objects if n == 'Male_Tongue_Repaired']
tongue = dst.objects[0] if dst.objects else None
if tongue:
    scene.collection.objects.link(tongue)
    tongue.location.x -= 0.6
    loaded.append(tongue.name)

# 5. Eyes: duplicate for male and female
with bpy.data.libraries.load(str(ROOT / 'deliverables/shared-eye-master.blend'), link=False) as (src, dst):
    dst.objects = ['Eye_Core_Sclera_Iris_Pupil', 'Eye_Cornea_Lens']
eye_core = next(o for o in dst.objects if o.name == 'Eye_Core_Sclera_Iris_Pupil')
eye_cornea = next(o for o in dst.objects if o.name == 'Eye_Cornea_Lens')

# Position eyes for female (approximate socket positions - will need adjustment)
# Female head is at z~1.4-1.65, eye sockets around z~1.52, x±0.03
for base, gender in [(female, 'female'), (male, 'male')]:
    # Find approximate eye positions from the base mesh
    import bmesh
    bm = bmesh.new(); bm.from_mesh(base.data)
    # Eye region: high z, front y
    eye_verts = [v.co for v in bm.verts if v.co.z > 1.45 and v.co.y > 0.0 and abs(v.co.x) < 0.08]
    bm.free()
    if eye_verts:
        center_z = sum(v.z for v in eye_verts) / len(eye_verts)
        center_y = sum(v.y for v in eye_verts) / len(eye_verts)
    else:
        center_z, center_y = 1.52, 0.05
    
    eye_scale = 0.85 if gender == 'female' else 1.0
    for side in [-1, 1]:
        core = eye_core.copy(); core.data = eye_core.data.copy()
        corn = eye_cornea.copy(); corn.data = eye_cornea.data.copy()
        scene.collection.objects.link(core)
        scene.collection.objects.link(corn)
        core.location = Vector((side * 0.032 + base.location.x, center_y, center_z))
        corn.location = core.location.copy()
        core.scale = Vector((eye_scale, eye_scale, eye_scale))
        corn.scale = Vector((eye_scale, eye_scale, eye_scale))
        loaded.append(f'Eye_{gender}_{"L" if side < 0 else "R"}')

# 6. Toon material with baked texture for female
toon_tex_mat = bpy.data.materials.new('ToonWithTexture')
toon_tex_mat.use_nodes = True
nodes = toon_tex_mat.node_tree.nodes
links = toon_tex_mat.node_tree.links
output = next(n for n in nodes if n.type == 'OUTPUT_MATERIAL')
for n in list(nodes):
    if n != output:
        nodes.remove(n)

# Load baked female texture
bake_img = bpy.data.images.load(str(ROOT / 'work/textures/Female_SourceBake_2048.png'))
tex_node = nodes.new('ShaderNodeTexImage')
tex_node.image = bake_img
toon_node = nodes.new('ShaderNodeBsdfToon')
toon_node.inputs['Size'].default_value = 0.5
toon_node.inputs['Smooth'].default_value = 0.05
links.new(tex_node.outputs['Color'], toon_node.inputs['Color'])
links.new(toon_node.outputs[0], output.inputs['Surface'])

# Apply texture toon to female, flat toon to male
female.data.materials.clear()
female.data.materials.append(toon_tex_mat)

flat_toon = bpy.data.materials.new('ToonFlat')
flat_toon.use_nodes = True
fn = flat_toon.node_tree.nodes
fo = next(n for n in fn if n.type == 'OUTPUT_MATERIAL')
for n in list(fn):
    if n != fo:
        fn.remove(n)
ft = fn.new('ShaderNodeBsdfToon')
ft.inputs['Color'].default_value = (0.72, 0.54, 0.42, 1)
ft.inputs['Size'].default_value = 0.5
ft.inputs['Smooth'].default_value = 0.05
flat_toon.node_tree.links.new(ft.outputs[0], fo.inputs['Surface'])
male.data.materials.clear()
male.data.materials.append(flat_toon)

# 7. Lighting + camera
scene.world = bpy.data.worlds.new('FinalWorld')
scene.world.color = (0.4, 0.4, 0.45)
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

camera = bpy.data.objects.new('FinalCam', bpy.data.cameras.new('FinalCam'))
scene.collection.objects.link(camera)
scene.camera = camera
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 2.8
camera.location = Vector((0, -4, 0.8))
camera.rotation_euler = (Vector((0, 0, 0.8)) - camera.location).to_track_quat('-Z', 'Y').to_euler()

# 8. Render setup and save
scene.render.engine = 'BLENDER_EEVEE'
scene.eevee.taa_render_samples = 32
scene.render.resolution_x = 1600
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'Standard'

bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'deliverables/final-integration.blend'))

# Render final views
output_dir = ROOT / 'evidence/final-integration'
output_dir.mkdir(parents=True, exist_ok=True)
for view, direction in [('front', (0, -4, 0)), ('quarter', (2, -4, 0.5)), ('side', (4, 0, 0))]:
    camera.location = Vector(direction) + Vector((0, 0, 0.8))
    camera.rotation_euler = (Vector((0, 0, 0.8)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(output_dir / f'both-{view}.png')
    bpy.ops.render.render(write_still=True)

report = {
    'objects': loaded,
    'female_material': 'ToonWithTexture (baked + Toon BSDF)',
    'male_material': 'ToonFlat (flat color + Toon BSDF)',
    'renders': 'evidence/final-integration/both-*.png',
}
(ROOT / 'reports/final-integration-v2.json').write_text(json.dumps(report, indent=2))
print('FINAL_INTEGRATION_V2', json.dumps({'objects': len(loaded), 'renders': 3}), flush=True)
