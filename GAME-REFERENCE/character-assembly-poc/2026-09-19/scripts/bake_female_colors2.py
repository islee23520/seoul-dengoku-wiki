# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Bake female source colors: exact transform replication + Selected-to-Active."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups

assert bpy.app.background
bpy.ops.wm.read_homefile(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'

# 1. Load assembled female base (target)
with bpy.data.libraries.load(str(ROOT / 'work/female-base-uv-v2.blend'), link=False) as (src, dst):
    dst.objects = ['Female_Base_Assembly']
target = dst.objects[0]
scene.collection.objects.link(target)
print(f'Target: {len(target.data.vertices)}v, UV: {[l.name for l in target.data.uv_layers]}', flush=True)

# 2. Import textured sources (in original coordinate space)
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'sources/originals/stylized doll head 3d model.glb'))
head_tex = [o for o in bpy.data.objects if o.type == 'MESH'][-1]
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'sources/originals/human figure 3d model.glb'))
body_tex = [o for o in bpy.data.objects if o.type == 'MESH' and o != head_tex and o != target][-1]

# 3. Compute exact assembly transforms
with bpy.data.libraries.load(str(ROOT / 'work/doll-sources-repaired-review.blend'), link=False) as (src, dst):
    dst.objects = [n for n in src.objects if n.startswith('Female_')]
r_head = next(o for o in dst.objects if 'Head' in o.name)
r_body = next(o for o in dst.objects if 'Body' in o.name)

hb = bmesh.new(); hb.from_mesh(r_head.data); hb.normal_update()
bb = bmesh.new(); bb.from_mesh(r_body.data); bb.normal_update()
head_groups = [g for g in boundary_groups(hb) if len(g) == 56]
body_groups = [g for g in boundary_groups(bb) if len(g) == 32]
head_neck_z = min(v.co.z for e in head_groups[0] for v in e.verts)
head_crown_z = max(v.co.z for v in hb.verts)
body_neck_z = max(v.co.z for e in body_groups[0] for v in e.verts)
body_feet_z = min(v.co.z for v in bb.verts)
hb.free(); bb.free()
head_height = head_crown_z - head_neck_z
body_height = body_neck_z - body_feet_z

target_height = 1.65; target_head = 0.22
raw_head_scale = target_head / head_height
total_h = (head_height + body_height) * raw_head_scale
final_scale = target_height / total_h
head_scale = raw_head_scale * final_scale  # combined

# Delta after scaling
delta = (body_neck_z - head_neck_z) * head_scale + 0.01
# Factor from joined max_z
joined_max_z = head_crown_z * head_scale + delta
factor = target_height / joined_max_z
print(f'head_scale={head_scale:.6f}, delta={delta:.6f}, factor={factor:.6f}', flush=True)

# 4. Apply transforms to textured sources
total_head = Matrix.Scale(factor, 4) @ (Matrix.Translation(Vector((0, 0, delta))) @ Matrix.Scale(head_scale, 4))
total_body = Matrix.Scale(factor * head_scale, 4)
head_tex.data.transform(total_head)
body_tex.data.transform(total_body)
print(f'Head tex transformed bounds: Z=[{min(v.co.z for v in head_tex.data.vertices):.3f},{max(v.co.z for v in head_tex.data.vertices):.3f}]', flush=True)
print(f'Target bounds: Z=[{min(v.co.z for v in target.data.vertices):.3f},{max(v.co.z for v in target.data.vertices):.3f}]', flush=True)

# 5. Setup bake
# Make source materials emit their textures
for obj in [head_tex, body_tex]:
    for mat in obj.data.materials:
        if mat and mat.use_nodes:
            tex = next((n for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image), None)
            emit = mat.node_tree.nodes.new('ShaderNodeEmission')
            output = next(n for n in mat.node_tree.nodes if n.type == 'OUTPUT_MATERIAL')
            if tex:
                mat.node_tree.links.new(tex.outputs['Color'], emit.inputs['Color'])
            mat.node_tree.links.new(emit.outputs[0], output.inputs['Surface'])

# Bake target image
bake_img = bpy.data.images.new('Female_Bake', width=2048, height=2048, float_buffer=False)
bake_mat = bpy.data.materials.new('FBake')
bake_mat.use_nodes = True
tex_node = bake_mat.node_tree.nodes.new('ShaderNodeTexImage')
tex_node.image = bake_img
target.data.materials.clear()
target.data.materials.append(bake_mat)
bake_mat.node_tree.nodes.active = tex_node

scene.cycles.samples = 64
scene.cycles.bake_type = 'EMIT'
scene.render.bake.use_selected_to_active = True
scene.render.bake.target = 'IMAGE_TEXTURES'
scene.render.bake.max_ray_distance = 0.1
scene.render.bake.cage_extrusion = 0.05
scene.render.bake.margin = 16
scene.render.bake.use_clear = True

bpy.ops.object.select_all(action='DESELECT')
head_tex.select_set(True)
body_tex.select_set(True)
target.select_set(True)
bpy.context.view_layer.objects.active = target

print('Baking...', flush=True)
bpy.ops.object.bake(type='EMIT')

bake_img.filepath_raw = str(ROOT / 'work/textures/Female_SourceBake_2048.png')
bake_img.file_format = 'PNG'
bake_img.save()
print(f'Bake saved', flush=True)

bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/female-base-color-baked.blend'))
print('FEMALE_COLOR_BAKED', flush=True)
