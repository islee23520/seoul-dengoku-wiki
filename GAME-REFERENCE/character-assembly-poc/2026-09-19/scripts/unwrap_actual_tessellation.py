# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Compute UVs on actual render triangles, copy loops back to unchanged quad master."""
import hashlib
import json
import sys
from pathlib import Path

import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
stage = sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'tessellation'
obj = bpy.data.objects['Male_Base_Symmetric']
mesh = obj.data
mesh.calc_loop_triangles()
positions = np.empty(len(mesh.vertices)*3, np.float32)
mesh.vertices.foreach_get('co', positions)
position_hash = hashlib.sha256(positions.tobytes()).hexdigest()
source_uv = np.empty(len(mesh.loops)*2, np.float32)
mesh.uv_layers['SourceUV'].data.foreach_get('uv', source_uv)
source_hash = hashlib.sha256(source_uv.tobytes()).hexdigest()
loop_map = np.array([t.loops[:] for t in mesh.loop_triangles], np.int32)
tris = np.array([t.vertices[:] for t in mesh.loop_triangles], np.int32)
seams = {tuple(sorted(edge.vertices)) for edge in mesh.edges if edge.use_seam}
temporary_mesh = bpy.data.meshes.new('Actual_Render_Triangles_UV_Work')
temporary_mesh.from_pydata(positions.reshape(-1,3), [], tris)
temporary_mesh.update()
for edge in temporary_mesh.edges:
    edge.use_seam = tuple(sorted(edge.vertices)) in seams
temporary_mesh.uv_layers.new(name='AtlasUV')
temporary = bpy.data.objects.new('Actual_Render_Triangles_UV_Work', temporary_mesh)
bpy.context.scene.collection.objects.link(temporary)
bpy.ops.object.select_all(action='DESELECT')
temporary.select_set(True)
bpy.context.view_layer.objects.active = temporary
bpy.context.tool_settings.use_uv_select_sync = True
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.unwrap(method='MINIMUM_STRETCH', no_flip=True, iterations=60, fill_holes=True, margin_method='FRACTION', margin=.002)
bpy.ops.uv.average_islands_scale(scale_uv=False, shear=False)
bpy.ops.uv.pack_islands(rotate=True, scale=True, merge_overlap=False, margin_method='FRACTION', margin=.002, shape_method='CONCAVE')
bpy.ops.object.mode_set(mode='OBJECT')
uv_values = np.empty(len(temporary_mesh.loops)*2, np.float32)
temporary_mesh.uv_layers['AtlasUV'].data.foreach_get('uv', uv_values)
uv_values = uv_values.reshape(-1,2)
assert len(uv_values) == loop_map.size
mapped = np.zeros((len(mesh.loops),2), np.float64)
counts = np.zeros(len(mesh.loops), np.int32)
for corner in range(3):
    np.add.at(mapped, loop_map[:,corner], uv_values[corner::3])
    np.add.at(counts, loop_map[:,corner], 1)
assert np.all(counts > 0)
mapped /= counts[:,None]
max_internal_gap = float(np.max(np.linalg.norm(uv_values-mapped[loop_map.ravel()],axis=1)))
assert max_internal_gap < 1e-7, 'Temporary triangulation introduced UV cuts inside quads'
mesh.uv_layers['AtlasUV'].data.foreach_set('uv', mapped.astype(np.float32).ravel())
bpy.data.objects.remove(temporary, do_unlink=True)
bpy.data.meshes.remove(temporary_mesh)
mesh.vertices.foreach_get('co', positions)
mesh.uv_layers['SourceUV'].data.foreach_get('uv', source_uv)
assert hashlib.sha256(positions.tobytes()).hexdigest()==position_hash
assert hashlib.sha256(source_uv.tobytes()).hexdigest()==source_hash
mesh.calc_loop_triangles()
atlas = mesh.uv_layers['AtlasUV']
triangle_uv = np.array([[tuple(atlas.data[index].uv) for index in t.loops] for t in mesh.loop_triangles])
first,second = triangle_uv[:,1]-triangle_uv[:,0],triangle_uv[:,2]-triangle_uv[:,0]
areas = (first[:,0]*second[:,1]-first[:,1]*second[:,0])/2
report={'geometry_preserved':True,'source_uv_preserved':True,'quad_topology_preserved':True,'temporary_mesh_removed':True,'internal_quad_uv_disagreement':max_internal_gap,'negative_uv_triangles':int((areas<0).sum()),'collapsed_uv_triangles':int((abs(areas)<=1e-14).sum()),'uv_area_sum':float(abs(areas).sum()),'status':'ACTUAL_TESSELLATION_UV_REQUIRES_QA'}
np.savez_compressed(ROOT/f'reports/male-{stage}-uv-triangles.npz',triangles=triangle_uv,polygon_ids=np.array([t.polygon_index for t in mesh.loop_triangles]))
(ROOT/f'reports/male-{stage}-uv.json').write_text(json.dumps(report,indent=2))
bpy.context.view_layer.objects.active=obj
obj.select_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/f'work/male-base-{stage}-atlas-review.blend'))
print('TESSELLATION_ATLAS_CREATED',report['negative_uv_triangles'],'negative',report['collapsed_uv_triangles'],'collapsed',flush=True)
