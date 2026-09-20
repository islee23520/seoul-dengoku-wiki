# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run: Blender --background work/assembled-bases.blend --python scripts/unwrap-bases.py
"""Name oral components and add packed UV atlases without losing source UVs."""
import json
import math
import sys
from pathlib import Path
import bpy

ROOT = Path('/Users/danny/Documents/Character-Assembly-POC/2026-09-19')
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import select_only

reports = []
for gender in ['Male', 'Female']:
    collection = bpy.data.collections.new(gender)
    bpy.context.scene.collection.children.link(collection)
    oral_collection = bpy.data.collections.new(gender + '_Oral_Parts')
    collection.children.link(oral_collection)
    for obj in [o for o in bpy.context.scene.objects if o.name.startswith(gender + '_') and o.type == 'MESH']:
        destination = collection
        original_name = obj.name
        if '_Oral_' in obj.name:
            index = int(obj.name.rsplit('_', 1)[1])
            label = {1: 'Upper_Gum', 2: 'Lower_Gum', 3: 'Tongue'}.get(index, f'Tooth_{index - 3:02d}')
            obj.name = f'{gender}_{label}'
            obj['source_component'] = original_name
            destination = oral_collection
        for previous in list(obj.users_collection):
            previous.objects.unlink(obj)
        destination.objects.link(obj)
        source_uv = obj.data.uv_layers[0]
        source_uv.name = 'SourceUV'
        # Explicit source UV node keeps original images correct after new active UV.
        for material in obj.data.materials:
            if material and material.use_nodes:
                for texture in [n for n in material.node_tree.nodes if n.type == 'TEX_IMAGE']:
                    uv_node = material.node_tree.nodes.new('ShaderNodeUVMap')
                    uv_node.uv_map = 'SourceUV'
                    material.node_tree.links.new(uv_node.outputs['UV'], texture.inputs['Vector'])
        atlas = obj.data.uv_layers.new(name='AtlasUV')
        obj.data.uv_layers.active = atlas
        select_only(obj)
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.006, margin_method='FRACTION', area_weight=0.2, scale_to_bounds=True)
        bpy.ops.object.mode_set(mode='OBJECT')
        obj.data.calc_loop_triangles()
        degenerate = []
        areas = []
        for triangle in obj.data.loop_triangles:
            a, b, c = [atlas.data[i].uv for i in triangle.loops]
            area = abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) / 2
            areas.append(area)
            if area < 1e-13:
                degenerate.append(triangle.index)
        finite = all(math.isfinite(value) for loop in atlas.data for value in loop.uv)
        reports.append({'object': obj.name, 'source': original_name, 'uv_layers': [u.name for u in obj.data.uv_layers], 'triangles': len(areas), 'finite': finite, 'degenerate_uv_triangles': len(degenerate), 'min_triangle_area': min(areas), 'sum_uv_area': sum(areas)})
        atlas.active_render = True
        obj.data.uv_layers.active = source_uv
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/uv-bases.blend'))
(ROOT / 'reports/uv-report.json').write_text(json.dumps(reports, indent=2))
print('UV_COMPLETE', len(reports), 'DEGENERATE', sum(r['degenerate_uv_triangles'] for r in reports), flush=True)
