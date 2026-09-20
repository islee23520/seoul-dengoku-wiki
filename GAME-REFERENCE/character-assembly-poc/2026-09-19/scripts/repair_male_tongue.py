# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Close the male tongue's accidental side slit, retaining its root interface."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils.kdtree import KDTree

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from mesh_tools import boundary_groups,components
from quad_patch_repair import repair_patches

with bpy.data.libraries.load(str(ROOT/'work/oral-separated-verified.blend'),link=False) as (src,dst):
    dst.objects=[n for n in src.objects if n.startswith('Male_Tongue')]
assert len(dst.objects)==1
obj=dst.objects[0];obj.name='Male_Tongue_Repaired'
scene=bpy.data.scenes.new('Male_Tongue_Repair_Review');scene.collection.objects.link(obj)
bpy.context.window.scene=scene
mesh=obj.data
bm=bmesh.new();bm.from_mesh(mesh);bm.verts.ensure_lookup_table();bm.normal_update()
before={'vertices':len(bm.verts),'faces':len(bm.faces),'area':sum(f.calc_area() for f in bm.faces),'boundary':sum(e.is_boundary for e in bm.edges)}
oldcoords=[v.co.copy() for v in bm.verts]
root=next(g for g in boundary_groups(bm) if len(g)==20 and min(v.co.y for e in g for v in e.verts)>-.10)
rootcoords={tuple(v.co) for e in root for v in e.verts}
patches=repair_patches(bm,[rootcoords])
assert len(patches)==1
assert len(components(bm))==1
assert [len(g) for g in boundary_groups(bm)]==[20]
assert not any(len(e.link_faces)>2 or e.is_wire or (e.is_manifold and not e.is_contiguous) for e in bm.edges)
tree=KDTree(len(oldcoords))
for index,p in enumerate(oldcoords):tree.insert(p,index)
tree.balance()
assert len(bm.verts)>=.90*before['vertices']
area=sum(f.calc_area() for f in bm.faces)
assert .95<area/before['area']<1.05
report={'before':before,'after':{'vertices':len(bm.verts),'faces':len(bm.faces),'area':area,'boundary':20,'junctions':0,'winding_errors':0,'components':1},'root_interface_coordinates_unchanged':rootcoords=={tuple(v.co) for g in boundary_groups(bm) for e in g for v in e.verts},'max_distance_new_vertices_to_original_vertex_cloud':max(tree.find(v.co)[2] for v in bm.verts),'surface_area_ratio':area/before['area'],'patches':patches,'visual_review_pending':True,'root_cap_not_added':'Separate tongue attaches inside mouth; root interface deliberately open and documented'}
bm.to_mesh(mesh);bm.free()
mesh.normals_split_custom_set([(0,0,0)]*len(mesh.loops))
for poly in mesh.polygons:poly.use_smooth=True
obj['intentional_boundary']='tongue-root-20-original-vertices'
obj['repair_state']='side-defect-repaired-visual-review-required'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work/male-tongue-repaired-review.blend'))
(ROOT/'reports/male-tongue-repair.json').write_text(json.dumps(report,indent=2))
print('MALE_TONGUE_SIDE_REPAIR_PASS',flush=True)
