# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Create separately packed half atlases while preserving mirrored source UVs."""
import hashlib
import json
import math
from pathlib import Path

import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
obj = bpy.data.objects['Male_Base_Symmetric']
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
mesh = obj.data
positions = np.empty(len(mesh.vertices) * 3, np.float32)
mesh.vertices.foreach_get('co', positions)
position_hash = hashlib.sha256(positions.tobytes()).hexdigest()
source = mesh.uv_layers[0]
source.name = 'SourceUV'
source_values = np.empty(len(mesh.loops) * 2, np.float32)
source.data.foreach_get('uv', source_values)
source_hash = hashlib.sha256(source_values.tobytes()).hexdigest()
for mat in mesh.materials:
    if mat and mat.use_nodes:
        coordinate = mat.node_tree.nodes.new('ShaderNodeUVMap')
        coordinate.uv_map = 'SourceUV'
        for texture in [n for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE']:
            mat.node_tree.links.new(coordinate.outputs['UV'], texture.inputs['Vector'])
atlas = mesh.uv_layers.new(name='AtlasUV')
mesh.uv_layers.active = atlas
side_ids = {}
for side in [-1, 1]:
    ids = [p.index for p in mesh.polygons if side * sum(mesh.vertices[i].co.x for i in p.vertices) > 0]
    assert ids
    side_ids[side] = set(ids)
    for polygon in mesh.polygons:
        polygon.select = polygon.index in side_ids[side]
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(70), margin_method='FRACTION', island_margin=.002, area_weight=.2, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.uv.pack_islands(rotate=True, scale=True, merge_overlap=False, margin_method='FRACTION', margin=.002, shape_method='CONCAVE')
    bpy.ops.object.mode_set(mode='OBJECT')
    # Mode changes invalidate UV RNA wrappers; reacquire after every operator.
    atlas = mesh.uv_layers['AtlasUV']
    for polygon_id in ids:
        for loop in mesh.polygons[polygon_id].loop_indices:
            uv = atlas.data[loop].uv.copy()
            atlas.data[loop].uv = (.015 + .47 * uv.x + (0 if side < 0 else .5), .015 + .97 * uv.y)
mesh.calc_loop_triangles()
atlas = mesh.uv_layers['AtlasUV']
tri_uv = np.array([[tuple(atlas.data[index].uv) for index in triangle.loops] for triangle in mesh.loop_triangles], np.float64)
cross = (tri_uv[:, 1, 0] - tri_uv[:, 0, 0]) * (tri_uv[:, 2, 1] - tri_uv[:, 0, 1]) - (tri_uv[:, 1, 1] - tri_uv[:, 0, 1]) * (tri_uv[:, 2, 0] - tri_uv[:, 0, 0])
zero = np.flatnonzero(np.abs(cross) <= 2e-14)
report = {'object': obj.name, 'uv_layers': [layer.name for layer in mesh.uv_layers], 'triangles': len(tri_uv), 'zero_uv_triangles': len(zero), 'zero_uv_triangle_ids': zero.tolist(), 'finite': bool(np.isfinite(tri_uv).all()), 'uv_min': tri_uv.min(axis=(0, 1)).tolist(), 'uv_max': tri_uv.max(axis=(0, 1)).tolist(), 'left_tile_u': [.015, .485], 'right_tile_u': [.515, .985], 'source_uv_preserved': True, 'geometry_preserved': True, 'within_half_overlap_check_pending': True}
mesh.vertices.foreach_get('co', positions)
assert hashlib.sha256(positions.tobytes()).hexdigest() == position_hash
mesh.uv_layers['SourceUV'].data.foreach_get('uv', source_values)
assert hashlib.sha256(source_values.tobytes()).hexdigest() == source_hash
assert report['finite'] and tri_uv.min() >= 0 and tri_uv.max() <= 1
np.savez_compressed(ROOT / 'reports/male-symmetric-uv-triangles.npz', triangles=tri_uv, polygon_ids=np.array([t.polygon_index for t in mesh.loop_triangles]), sides=np.array([-1 if t.polygon_index in side_ids[-1] else 1 for t in mesh.loop_triangles]))
(ROOT / 'reports/male-symmetric-uv.json').write_text(json.dumps(report, indent=2))
mesh.uv_layers.active = mesh.uv_layers['AtlasUV']
mesh.uv_layers['AtlasUV'].active_render = True
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/male-base-symmetric-atlas-review.blend'))
print('SYMMETRIC_ATLAS_CREATED', len(zero), 'degenerate_triangles', flush=True)
