# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Relax corrected UV charts on temporary evaluated triangles and repack the atlas."""
import hashlib
import json
from pathlib import Path
import sys

import bmesh
import bpy
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
fixed_boundary = '--fixed-boundary' in sys.argv
stage = 'boundary-pinned' if fixed_boundary else 'injective'
obj=bpy.data.objects['Male_Base_Symmetric']
mesh=obj.data
mesh.calc_loop_triangles()
source=mesh.uv_layers['SourceUV']
source_uv=np.empty(len(mesh.loops)*2,np.float32)
source.data.foreach_get('uv',source_uv)
source_hash=hashlib.sha256(source_uv.tobytes()).hexdigest()
positions=np.empty(len(mesh.vertices)*3,np.float32)
mesh.vertices.foreach_get('co',positions)
position_hash=hashlib.sha256(positions.tobytes()).hexdigest()
initial=np.load(ROOT/'reports/injective-uv-initialization.npz')
loopmap=np.array([t.loops[:] for t in mesh.loop_triangles],np.int32)
tris=np.array([t.vertices[:] for t in mesh.loop_triangles],np.int32)
polyids=np.array([t.polygon_index for t in mesh.loop_triangles])
seams={tuple(sorted(e.vertices)) for e in mesh.edges if e.use_seam}
tempmesh=bpy.data.meshes.new('InjectiveUVRelaxWork')
tempmesh.from_pydata(positions.reshape(-1,3),[],tris)
tempmesh.update()
for e in tempmesh.edges:e.use_seam=tuple(sorted(e.vertices)) in seams
uv=tempmesh.uv_layers.new(name='AtlasUV')
uv.data.foreach_set('uv',initial['uv'][loopmap.ravel()].astype(np.float32).ravel())
if fixed_boundary:
    bm=bmesh.new()
    bm.from_mesh(tempmesh)
    layer=bm.loops.layers.uv.active
    for edge in bm.edges:
        if edge.seam or edge.is_boundary:
            for vertex in edge.verts:
                for face in vertex.link_faces:
                    for loop in face.loops:
                        if loop.vert==vertex:loop[layer].pin_uv=True
    bm.to_mesh(tempmesh)
    bm.free()
temp=bpy.data.objects.new('InjectiveUVRelaxWork',tempmesh)
bpy.context.scene.collection.objects.link(temp)
bpy.ops.object.select_all(action='DESELECT')
temp.select_set(True)
bpy.context.view_layer.objects.active=temp
bpy.context.tool_settings.use_uv_select_sync=True
bpy.context.tool_settings.mesh_select_mode=(False,False,True)
for p in tempmesh.polygons:p.select=bool(initial['selected_faces'][polyids[p.index]])
bpy.ops.object.mode_set(mode='EDIT')
if fixed_boundary:
    bpy.ops.uv.unwrap(method='MINIMUM_STRETCH',no_flip=True,iterations=100,fill_holes=False,use_original_bounds=True,margin=0)
else:
    bpy.ops.uv.minimize_stretch(fill_holes=True,blend=0,iterations=100)
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.average_islands_scale(scale_uv=False,shear=False)
bpy.ops.uv.pack_islands(rotate=True,scale=True,merge_overlap=False,margin_method='FRACTION',margin=.002,shape_method='CONCAVE')
bpy.ops.object.mode_set(mode='OBJECT')
out=np.empty(len(tempmesh.loops)*2,np.float32)
tempmesh.uv_layers['AtlasUV'].data.foreach_get('uv',out)
out=out.reshape(-1,2)
mapped=np.zeros((len(mesh.loops),2),float)
counts=np.zeros(len(mesh.loops),np.int32)
np.add.at(mapped,loopmap.ravel(),out)
np.add.at(counts,loopmap.ravel(),1)
mapped/=counts[:,None]
disagreement=float(np.linalg.norm(out-mapped[loopmap.ravel()],axis=1).max())
assert disagreement<1e-7
mesh.uv_layers['AtlasUV'].data.foreach_set('uv',mapped.astype(np.float32).ravel())
bpy.data.objects.remove(temp,do_unlink=True)
bpy.data.meshes.remove(tempmesh)
mesh.vertices.foreach_get('co',positions)
mesh.uv_layers['SourceUV'].data.foreach_get('uv',source_uv)
assert hashlib.sha256(positions.tobytes()).hexdigest()==position_hash
assert hashlib.sha256(source_uv.tobytes()).hexdigest()==source_hash
values=mapped[loopmap]
a,b=values[:,1]-values[:,0],values[:,2]-values[:,0]
area=(a[:,0]*b[:,1]-a[:,1]*b[:,0])/2
np.savez_compressed(ROOT/f'reports/male-{stage}-uv-triangles.npz',triangles=values,polygon_ids=polyids)
report={'negative_triangles':int((area<0).sum()),'collapsed_triangles':int((abs(area)<=1e-14).sum()),'minimum_area':float(area.min()),'geometry_preserved':True,'source_uv_preserved':True,'internal_quad_uv_disagreement':disagreement,'global_intersection_audit_pending':True}
(ROOT/f'reports/male-{stage}-uv.json').write_text(json.dumps(report,indent=2))
bpy.context.view_layer.objects.active=obj
obj.select_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/f'work/male-base-{stage}-atlas-review.blend'))
print('INJECTIVE_UV_RELAXED',report['negative_triangles'],'negative',report['collapsed_triangles'],'collapsed',flush=True)
