# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Use the crossing/contact-free corresponding incisor, without blind point welding."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Vector
from mathutils.kdtree import KDTree

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from mesh_tools import components,boundary_groups

donor=bpy.data.objects['Male_Upper_RecoveredCrown3']
recipient=bpy.data.objects['Male_Upper_RecoveredCrown2']
source=bpy.data.objects['Male_Upper_RecoveredCrown2']
original_coordinates=np.array([v.co[:] for v in source.data.vertices])
good=np.array([v.co[:] for v in donor.data.vertices])
plane=float((original_coordinates[:,0].min()+original_coordinates[:,0].max()+good[:,0].min()+good[:,0].max())/4)
donor_gate=json.loads((ROOT/'reports/upper-incisor3-native-audit.json').read_text())
assert donor_gate['ok'] and not donor_gate['point_contacts']
tree=KDTree(len(original_coordinates))
for i,p in enumerate(original_coordinates):tree.insert(Vector(p),i)
tree.balance()
reflected=good.copy();reflected[:,0]=2*plane-reflected[:,0]
delta=np.array([tree.find(Vector(p))[2] for p in reflected])
assert delta.max()<.0005,delta.max()
mesh=donor.data.copy();bm=bmesh.new();bm.from_mesh(mesh)
for vertex in bm.verts:vertex.co.x=2*plane-vertex.co.x
bmesh.ops.reverse_faces(bm,faces=list(bm.faces));bm.normal_update()
assert len(components(bm))==1
assert not any(e.is_wire or len(e.link_faces)>2 or (e.is_manifold and not e.is_contiguous) for e in bm.edges)
loops=boundary_groups(bm);assert len(loops)==1
root_points=[tuple(v.co) for e in loops[0] for v in e.verts]
assert all(sum(e in loops[0] for e in v.link_edges)==2 for e in loops[0] for v in e.verts)
bm.to_mesh(mesh);bm.free()
recipient.data=mesh
if mesh.attributes.get('custom_normal'):mesh.attributes.remove(mesh.attributes['custom_normal'])
mesh.calc_loop_triangles()
np.savez_compressed(ROOT/'reports/upper-incisor-symmetry-native.npz',positions=np.array([v.co[:] for v in mesh.vertices]),triangles=np.array([t.vertices[:] for t in mesh.loop_triangles]),polygon_ids=np.array([t.polygon_index for t in mesh.loop_triangles]))
report={'recipient':recipient.name,'donor':donor.name,'symmetry_plane_x':plane,'selection_reason':'Actual mirrored crown/position agreement; donor zero intersections and zero contacts; recipient coincident split fan point','max_reflected_vertex_to_original_vertex_distance_source_units':float(delta.max()),'median_distance':float(np.median(delta)),'vertices_before':len(original_coordinates),'vertices_after':len(mesh.vertices),'faces_after':len(mesh.polygons),'recipient_root_interface_replaced_by_corresponding_donor':True,'uv_status':'Source coordinates reflected; final shared atlas still pending','status':'SYMMETRY_CANDIDATE_NATIVE_AND_RENDER_QA_PENDING'}
(ROOT/'reports/upper-incisor-symmetry-repair.json').write_text(json.dumps(report,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work/recovered-oral-incisor-symmetry-review.blend'))
print('VERIFIED_INCISOR_DONOR_REFLECTED',flush=True)
