# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Bake source colors onto assembled female base using Selected-to-Active."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
assert bpy.app.background

# 1. Import source meshes
bpy.ops.wm.read_homefile(use_empty=True)

# Import body source
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'sources/originals/human figure 3d model.glb'))
body_src = [o for o in bpy.data.objects if o.type == 'MESH']
body_obj = body_src[0] if body_src else None

# Import head source (append to same scene)
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'sources/originals/stylized doll head 3d model.glb'))
head_src = [o for o in bpy.data.objects if o.type == 'MESH' and o != body_obj]
head_obj = head_src[0] if head_src else None

print(f'Body src: {body_obj.name if body_obj else None}', flush=True)
print(f'Head src: {head_obj.name if head_obj else None}', flush=True)

# 2. Append assembled female base
with bpy.data.libraries.load(str(ROOT / 'work/female-base-symmetric.blend'), link=False) as (src, dst):
    dst.objects = ['Female_Base_Assembly']
target = dst.objects[0]
bpy.context.scene.collection.objects.link(target)
print(f'Target: {target.name}, {len(target.data.vertices)}v', flush=True)

# 3. Ensure target has UV layer
if not target.data.uv_layers:
    target.data.uv_layers.new(name='Attribute')
uv_layer = target.data.uv_layers.active

# 4. Make sure source materials emit their textures (for bake capture)
for src_obj in [body_obj, head_obj]:
    if src_obj is None:
        continue
    for mat in src_obj.data.materials:
        if mat and mat.use_nodes:
            # Find image texture and connect to emission
            bsdf = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            tex = next((n for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image), None)
            emit = mat.node_tree.nodes.new('ShaderNodeEmission')
            output = next(n for n in mat.node_tree.nodes if n.type == 'OUTPUT_MATERIAL')
            if tex:
                mat.node_tree.links.new(tex.outputs['Color'], emit.inputs['Color'])
                mat.node_tree.links.new(emit.outputs[0], output.inputs['Surface'])

# 5. Create bake target image on target mesh
bake_img = bpy.data.images.new('Female_Bake_2048', width=2048, height=2048, float_buffer=False)
bake_img.generated_color = (0.5, 0.4, 0.35, 1)
# Create material for bake target
bake_mat = bpy.data.materials.new('FemaleBakeTarget')
bake_mat.use_nodes = True
bnodes = bake_mat.node_tree.nodes
tex_node = bnodes.new('ShaderNodeTexImage')
tex_node.image = bake_img
output = next(n for n in bnodes if n.type == 'OUTPUT_MATERIAL')
# Save UV mapping by assigning the bake image node as active
target.data.materials.clear()
target.data.materials.append(bake_mat)
bake_mat.node_tree.nodes.active = tex_node

# 6. Setup Cycles bake
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 64
scene.cycles.bake_type = 'EMIT'
scene.render.bake.use_selected_to_active = True
scene.render.bake.target = 'IMAGE_TEXTURES'
scene.render.bake.max_ray_distance = 0.05  # 5cm for surface transfer
scene.render.bake.cage_extrusion = 0.02
scene.render.bake.margin = 16
scene.render.bake.use_clear = True

# 7. Select source (active = target for bake direction: selected to active means active receives)
# In Blender: Select the target (cage), make it active, sources also selected
# Actually: "Selected to Active" bakes FROM selected objects TO the active object
# So: select sources, make TARGET active
bpy.ops.object.select_all(action='DESELECT')
body_obj.select_set(True)
head_obj.select_set(True)
target.select_set(True)
bpy.context.view_layer.objects.active = target

print('Baking...', flush=True)
bpy.ops.object.bake(type='EMIT')

# 8. Save bake image
bake_img.filepath_raw = str(ROOT / 'work/textures/Female_SourceBake_2048.png')
bake_img.file_format = 'PNG'
bake_img.save()
print(f'Bake saved: {bake_img.filepath_raw}', flush=True)

# 9. Save scene
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/female-base-color-baked.blend'))
print('FEMALE_COLOR_BAKED', flush=True)
