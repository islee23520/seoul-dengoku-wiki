# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Unwrap temporary half meshes and copy only UV loops back by stable source IDs."""
import hashlib
import json
import math
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
obj = bpy.data.objects['Male_Base_Symmetric']
mesh = obj.data
assert bpy.app.background
source_uv = mesh.uv_layers[0]
source_uv.name = 'SourceUV'
source_values = np.empty(len(mesh.loops) * 2, np.float32)
source_uv.data.foreach_get('uv', source_values)
source_hash = hashlib.sha256(source_values.tobytes()).hexdigest()
positions = np.empty(len(mesh.vertices) * 3, np.float32)
mesh.vertices.foreach_get('co', positions)
position_hash = hashlib.sha256(positions.tobytes()).hexdigest()
for mat in mesh.materials:
    if mat and mat.use_nodes:
        coordinate = mat.node_tree.nodes.new('ShaderNodeUVMap')
        coordinate.uv_map = 'SourceUV'
        for texture in [n for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE']:
            mat.node_tree.links.new(coordinate.outputs['UV'], texture.inputs['Vector'])
if 'AtlasUV' in mesh.uv_layers:
    mesh.uv_layers.remove(mesh.uv_layers['AtlasUV'])
mesh.uv_layers.new(name='AtlasUV')
receipts = []
for side in [-1, 1]:
    temporary = bpy.data.objects.new(f'IsolatedUV_{side}', mesh.copy())
    bpy.context.scene.collection.objects.link(temporary)
    bm = bmesh.new()
    bm.from_mesh(temporary.data)
    face_id = bm.faces.layers.int.new('SourceFaceID')
    vertex_id = bm.verts.layers.int.new('SourceVertexID')
    bm.faces.ensure_lookup_table()
    bm.verts.ensure_lookup_table()
    for index, face in enumerate(bm.faces):
        face[face_id] = index
    for index, vertex in enumerate(bm.verts):
        vertex[vertex_id] = index
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if side * f.calc_center_median().x <= 0], context='FACES_ONLY')
    bmesh.ops.delete(bm, geom=[e for e in bm.edges if not e.link_faces], context='EDGES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bm.to_mesh(temporary.data)
    bm.free()
    bpy.ops.object.select_all(action='DESELECT')
    temporary.select_set(True)
    bpy.context.view_layer.objects.active = temporary
    temporary.data.uv_layers.active = temporary.data.uv_layers['AtlasUV']
    bpy.context.tool_settings.mesh_select_mode = (False, False, True)
    bpy.context.tool_settings.use_uv_select_sync = True
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), margin_method='FRACTION', island_margin=.002, area_weight=.2, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.uv.pack_islands(rotate=True, scale=True, merge_overlap=False, margin_method='FRACTION', margin=.002, shape_method='CONCAVE')
    bpy.ops.object.mode_set(mode='OBJECT')
    bm = bmesh.new()
    bm.from_mesh(temporary.data)
    face_id = bm.faces.layers.int['SourceFaceID']
    vertex_id = bm.verts.layers.int['SourceVertexID']
    atlas = bm.loops.layers.uv['AtlasUV']
    target_uv = mesh.uv_layers['AtlasUV']
    copied = 0
    for face in bm.faces:
        polygon = mesh.polygons[face[face_id]]
        target_loops = {mesh.loops[l].vertex_index: l for l in polygon.loop_indices}
        assert len(target_loops) == len(face.loops)
        for loop in face.loops:
            uv = loop[atlas].uv
            # Keep source texel aspect ratio while isolating halves in disjoint
            # square regions. Better utilization is a later packing optimization.
            target_uv.data[target_loops[loop.vert[vertex_id]]].uv = (.015 + (0 if side < 0 else .5) + .47 * uv.x, .265 + .47 * uv.y)
            copied += 1
    receipts.append({'side': side, 'faces': len(bm.faces), 'copied_loops': copied})
    bm.free()
    temporary_mesh = temporary.data
    bpy.data.objects.remove(temporary, do_unlink=True)
    bpy.data.meshes.remove(temporary_mesh)
assert sum(r['copied_loops'] for r in receipts) == len(mesh.loops)
mesh.vertices.foreach_get('co', positions)
mesh.uv_layers['SourceUV'].data.foreach_get('uv', source_values)
assert hashlib.sha256(positions.tobytes()).hexdigest() == position_hash
assert hashlib.sha256(source_values.tobytes()).hexdigest() == source_hash
mesh.calc_loop_triangles()
uv = mesh.uv_layers['AtlasUV']
triangles = np.array([[tuple(uv.data[i].uv) for i in t.loops] for t in mesh.loop_triangles], np.float64)
sides = np.array([-1 if mesh.polygons[t.polygon_index].center.x < 0 else 1 for t in mesh.loop_triangles])
area = np.abs(np.cross(triangles[:, 1] - triangles[:, 0], triangles[:, 2] - triangles[:, 0])) / 2
zero = np.flatnonzero(area <= 1e-14)
report = {'isolated_half_receipts': receipts, 'degenerate_uv_triangles': zero.tolist(), 'source_uv_preserved': True, 'geometry_preserved': True, 'half_bounds': [{'side': side, 'min': triangles[sides == side].min(axis=(0, 1)).tolist(), 'max': triangles[sides == side].max(axis=(0, 1)).tolist()} for side in [-1, 1]], 'overlap_verification_pending': True}
np.savez_compressed(ROOT / 'reports/male-isolated-uv-triangles.npz', triangles=triangles, polygon_ids=np.array([t.polygon_index for t in mesh.loop_triangles]), sides=sides)
(ROOT / 'reports/male-isolated-uv.json').write_text(json.dumps(report, indent=2))
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
mesh.uv_layers.active = mesh.uv_layers['AtlasUV']
mesh.uv_layers['AtlasUV'].active_render = True
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/male-base-isolated-atlas-review.blend'))
print('ISOLATED_HALF_ATLAS_CREATED', len(zero), 'degenerate_triangles', flush=True)
