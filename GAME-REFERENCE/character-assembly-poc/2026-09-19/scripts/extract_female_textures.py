# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Bake female colors: import textured GLB sources, replicate transforms, bake to base."""
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

# 1. Import textured sources
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'sources/originals/stylized doll head 3d model.glb'))
head_tex = [o for o in bpy.data.objects if o.type == 'MESH'][0]
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'sources/originals/human figure 3d model.glb'))
body_tex = [o for o in bpy.data.objects if o.type == 'MESH' and o != head_tex][0]
print(f'Head tex src: {head_tex.name}, UV: {[l.name for l in head_tex.data.uv_layers]}', flush=True)
print(f'Body tex src: {body_tex.name}, UV: {[l.name for l in body_tex.data.uv_layers]}', flush=True)

# Extract textures from materials
head_img = None; body_img = None
for obj, label in [(head_tex, 'head'), (body_tex, 'body')]:
    for mat in obj.data.materials:
        if mat and mat.use_nodes:
            for n in mat.node_tree.nodes:
                if n.type == 'TEX_IMAGE' and n.image:
                    if label == 'head': head_img = n.image
                    else: body_img = n.image
print(f'Head img: {head_img.name if head_img else None}, Body img: {body_img.name if body_img else None}', flush=True)

# 2. Compute assembly transforms (replicating assemble_female_base.py logic)
# Load repaired sources for boundary computation
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
head_height = head_crown_z - head_neck_z
body_height = body_neck_z - body_feet_z

target_height = 1.65; target_head = 0.22
head_scale = target_head / head_height
total_h = (head_height + body_height) * head_scale
final_scale = target_height / total_h
head_scale *= final_scale
print(f'head_scale={head_scale:.6f}, final_scale={final_scale:.6f}', flush=True)

# But the textured sources have DIFFERENT geometry from repaired sources!
# The original GLB meshes haven't been axis-normalized. Check their orientation.
print(f'Head tex bounds: X=[{min(v.co.x for v in head_tex.data.vertices):.3f},{max(v.co.x for v in head_tex.data.vertices):.3f}] Y=[{min(v.co.y for v in head_tex.data.vertices):.3f},{max(v.co.y for v in head_tex.data.vertices):.3f}] Z=[{min(v.co.z for v in head_tex.data.vertices):.3f},{max(v.co.z for v in head_tex.data.vertices):.3f}]', flush=True)
print(f'Repaired head bounds: X=[{min(v.co.x for v in r_head.data.vertices):.3f},{max(v.co.x for v in r_head.data.vertices):.3f}] Y=[{min(v.co.y for v in r_head.data.vertices):.3f},{max(v.co.y for v in r_head.data.vertices):.3f}] Z=[{min(v.co.z for v in r_head.data.vertices):.3f},{max(v.co.z for v in r_head.data.vertices):.3f}]', flush=True)
print(f'Head tex scale: {head_tex.scale}, Body tex scale: {body_tex.scale}', flush=True)

# Save the texture images as PNG for reuse
if head_img:
    head_img.filepath_raw = str(ROOT / 'work/textures/Female_HeadTex_2048.png')
    head_img.file_format = 'PNG'
    head_img.save()
if body_img:
    body_img.filepath_raw = str(ROOT / 'work/textures/Female_BodyTex_2048.png')
    body_img.file_format = 'PNG'
    body_img.save()
print('FEMALE_TEX_EXTRACTED', flush=True)
