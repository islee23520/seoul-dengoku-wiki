# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Compare a positive-X tongue donor on a copy, without altering prior repairs."""
import json
import math
import sys
from collections import Counter
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector
from mathutils.kdtree import KDTree

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from mesh_tools import boundary_groups,components

audit=json.loads((ROOT/'reports/tongue-symmetry-audit.json').read_text())
negative,positive=audit['halves']
assert positive['side']=='positive_x' and negative['side']=='negative_x'
assert positive['edge_angle_p90']<negative['edge_angle_p90']
assert positive['quad_internal_angle_max']<negative['quad_internal_angle_max']
assert positive['winding']==positive['junctions']==0
obj=bpy.data.objects['Male_Tongue_Repaired'];mesh=obj.data
center=audit['selected_center_for_comparison'];epsilon=1e-7
before=[v.co.copy() for v in mesh.vertices]
bm=bmesh.new();bm.from_mesh(mesh)
root_before=[v.co.copy() for v in bm.verts if v.is_boundary]
area_before=sum(f.calc_area() for f in bm.faces);bm.free()
donor_points=[v.co.copy() for v in mesh.vertices if v.co.x>center+epsilon]
donor_faces=Counter(tuple(sorted(tuple(mesh.vertices[i].co) for i in p.vertices)) for p in mesh.polygons if all(mesh.vertices[i].co.x>center+epsilon for i in p.vertices))
mesh.transform(Matrix.Translation((-center,0,0)))
bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
assert bpy.ops.mesh.symmetrize(direction='POSITIVE_X',threshold=epsilon)=={'FINISHED'}
bpy.ops.object.mode_set(mode='OBJECT');mesh.transform(Matrix.Translation((center,0,0)));mesh.update()
tree=KDTree(len(mesh.vertices))
for v in mesh.vertices:tree.insert(v.co,v.index)
tree.balance()
donor_error=max(tree.find(v)[2] for v in donor_points)
assert donor_error<1e-7
after_faces=Counter(tuple(sorted(tuple(mesh.vertices[i].co) for i in p.vertices)) for p in mesh.polygons if all(mesh.vertices[i].co.x>center+epsilon for i in p.vertices))
# Translation roundoff is measured, not confused with an intentional donor edit.
bm=bmesh.new();bm.from_mesh(mesh);bm.verts.index_update();bm.normal_update()
groups=boundary_groups(bm);assert len(groups)==1
assert len(components(bm))==1
assert not any(e.is_wire or len(e.link_faces)>2 or (e.is_manifold and not e.is_contiguous) for e in bm.edges)
assert not any(f.calc_area()<=1e-12 for f in bm.faces)
root_after=[v.co.copy() for e in groups[0] for v in e.verts]
root_tree=KDTree(len(root_before))
for i,v in enumerate(root_before):root_tree.insert(v,i)
root_tree.balance()
root_displacement=max(root_tree.find(v)[2] for v in root_after)
reflected_error=max(tree.find(Vector((2*center-v.co.x,v.co.y,v.co.z)))[2] for v in mesh.vertices)
mesh.calc_loop_triangles();quad_angles=[]
for p in mesh.polygons:
    tris=[t for t in mesh.loop_triangles if t.polygon_index==p.index]
    if len(tris)==2:quad_angles.append(math.degrees(math.acos(max(-1,min(1,tris[0].normal.dot(tris[1].normal))))))
report={'source':'male-tongue-generated-normals-review.blend','donor':'positive_x','center_source_units':center,'donor_max_distance_after':donor_error,'donor_faces_before':sum(donor_faces.values()),'donor_faces_after':sum(after_faces.values()),'source_root_loop_size':len(root_before),'result_root_loop_size':len({v for e in groups[0] for v in e.verts}),'root_max_displacement_source_units':root_displacement,'surface_area_ratio':sum(f.calc_area() for f in bm.faces)/area_before,'bbox_max_change_source_units':float(np.max(np.abs(np.r_[np.array([v.co for v in mesh.vertices]).min(0)-np.array(before).min(0),np.array([v.co for v in mesh.vertices]).max(0)-np.array(before).max(0)]))),'vertices':len(bm.verts),'faces':len(bm.faces),'face_sizes':dict(Counter(len(f.verts) for f in bm.faces)),'quad_internal_angle_max':max(quad_angles),'symmetry_max_error_source_units':reflected_error,'connected_components':1,'winding_errors':0,'unintended_boundary_loops':0,'status':'SYMMETRY_COMPARISON_REQUIRES_ROOT_AND_VISUAL_REVIEW'}
bm.free()
if mesh.attributes.get('custom_normal'):mesh.attributes.remove(mesh.attributes['custom_normal'])
(ROOT/'reports/tongue-symmetry-candidate.json').write_text(json.dumps(report,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work/male-tongue-symmetric-candidate.blend'))
print('TONGUE_SYMMETRY_CANDIDATE_SAVED',flush=True)
