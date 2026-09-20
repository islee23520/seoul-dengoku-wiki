# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Restore an unambiguously corresponding upper-molar pair from its sound half."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from mesh_tools import components,boundary_groups,orient_surface

with bpy.data.libraries.load(str(ROOT/'work/oral-separated-verified.blend'),link=False) as (source,target):
    target.objects=[n for n in source.objects if n.startswith('Male_UpperGum')]
original=target.objects[0]
src=bmesh.new();src.from_mesh(original.data);src.verts.ensure_lookup_table();src.normal_update()
parts=components(src)
assert len(parts)==12 and len(parts[4])==101 and len(parts[5])==100
donor=parts[5];damaged=parts[4]
donor_faces={f for v in donor for f in v.link_faces}
donor_edges={e for f in donor_faces for e in f.edges}
assert all(len(e.link_faces)<=2 for e in donor_edges)
assert not any(e.is_manifold and not e.is_contiguous for e in donor_edges)
good_center=sum((v.co for v in donor),Vector())/len(donor)
bad_center=sum((v.co for v in damaged),Vector())/len(damaged)
# This source pair differs by a uniform x translation after reflection. Estimate
# its reflection plane from both audited tooth bounding boxes, not object origin.
good_mid=(min(v.co.x for v in donor)+max(v.co.x for v in donor))/2
bad_mid=(min(v.co.x for v in damaged)+max(v.co.x for v in damaged))/2
center=(good_mid+bad_mid)/2
scene=bpy.data.scenes.new('Upper_Molar_Pair_Repair')
bpy.context.window.scene=scene
report={'source':'work/oral-separated-verified.blend','donor_component':5,'replaced_component':4,'reason':'Mutual tooth correspondence; donor0junction/0winding versus recipient4junction/3winding; reflected max discrepancy .00244 source units','symmetry_plane_x':center,'parts':[],'status':'PAIR_REPAIR_REQUIRES_VISUAL_REVIEW'}
result_objects=[]
for side in ['positive','negative']:
    mesh=original.data.copy();bm=bmesh.new();bm.from_mesh(mesh);bm.verts.ensure_lookup_table()
    ids={v.index for v in donor}
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if v.index not in ids],context='VERTS')
    root=boundary_groups(bm)
    assert len(root)==1 and len(root[0])==12
    root_points={v for e in root[0] for v in e.verts}
    highest=min(v.co.z for v in root_points)
    assert highest>.30
    # Root is invisible inside the gum, but close it with a quad grid so the
    # independently selectable tooth is watertight. Crown coordinates remain.
    edges=list(root[0]);walk=[min(root_points,key=lambda v:(v.co.x,v.co.y))]
    previous=None;current=walk[0]
    while True:
        nxt=next(e.other_vert(current) for e in current.link_edges if e in edges and e.other_vert(current)!=previous)
        if nxt==walk[0]:break
        walk.append(nxt);previous,current=current,nxt
    crown_before={v:v.co.copy() for v in bm.verts}
    cap=bmesh.ops.grid_fill(bm,edges=[bm.edges.get((walk[i],walk[(i+1)%12])) for i in [0,1,2,6,7,8]],use_interp_simple=True,use_smooth=False)['faces']
    assert len(cap)==9 and all(len(f.verts)==4 for f in cap)
    assert all((v.co-p).length==0 for v,p in crown_before.items())
    orient_surface(bm)
    if side=='negative':
        for v in bm.verts:v.co.x=2*center-v.co.x
        bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
    bm.normal_update()
    assert all(e.is_manifold and e.is_contiguous for e in bm.edges)
    assert bm.calc_volume(signed=True)>0
    assert not any(f.calc_area()<=1e-12 for f in bm.faces)
    obj=bpy.data.objects.new('Male_UpperMolar_'+side+'_Repaired',mesh);scene.collection.objects.link(obj)
    report['parts'].append({'object':obj.name,'vertices':len(bm.verts),'faces':len(bm.faces),'root_cap_quads':len(cap),'boundaries':0,'junctions':0,'winding_errors':0,'signed_volume':bm.calc_volume(signed=True),'original_crown_shape_preserved':True})
    bm.to_mesh(mesh);bm.free()
    if mesh.attributes.get('custom_normal'):mesh.attributes.remove(mesh.attributes['custom_normal'])
    for face in mesh.polygons:face.use_smooth=True
    result_objects.append(obj)
src.free()
source_mesh=original.data;bpy.data.objects.remove(original,do_unlink=True)
if source_mesh.users==0:bpy.data.meshes.remove(source_mesh)
(ROOT/'reports/upper-molar-pair-repair.json').write_text(json.dumps(report,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work/male-upper-molar-pair-repaired.blend'))
print('UPPER_MOLAR_PAIR_REPAIRED',flush=True)
