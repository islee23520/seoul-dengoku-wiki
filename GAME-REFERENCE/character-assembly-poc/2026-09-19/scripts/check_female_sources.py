# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Check female sources for vertex colors and texture data."""
import bpy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
assert bpy.app.background

for src_name, src_path in [
    ('female_body_src', ROOT/'sources/originals/human figure 3d model.glb'),
    ('female_head_src', ROOT/'sources/originals/stylized doll head 3d model.glb'),
]:
    if not src_path.exists():
        print(f'{src_name}: NOT FOUND', flush=True)
        continue
    # Import fresh
    before = set(bpy.data.objects.keys())
    bpy.ops.wm.read_homefile(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(src_path))
    after = [o for o in bpy.data.objects if o.type == 'MESH']
    print(f'{src_name}:', flush=True)
    for obj in after:
        mesh = obj.data
        print(f'  {obj.name}: {len(mesh.vertices)}v/{len(mesh.polygons)}f', flush=True)
        print(f'    color_attributes: {[a.name for a in mesh.color_attributes]}', flush=True)
        print(f'    uv_layers: {[l.name for l in mesh.uv_layers]}', flush=True)
        print(f'    materials: {[m.name for m in mesh.materials]}', flush=True)
        for mat in mesh.materials:
            if mat.use_nodes:
                for n in mat.node_tree.nodes:
                    if n.type == 'TEX_IMAGE' and n.image:
                        print(f'    image: {n.image.name} {n.image.size[0]}x{n.image.size[1]}', flush=True)
    bpy.ops.wm.read_homefile(use_empty=True)
print('SOURCE_CHECK_DONE', flush=True)
