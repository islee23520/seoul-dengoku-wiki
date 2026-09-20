# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Audit reflected oral-component correspondences before any donor replacement."""
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

with bpy.data.libraries.load(str(ROOT/'work/oral-separated-verified.blend'),link=False) as (source,target):
    target.objects=[n for n in source.objects if n.startswith('Male_') and 'Gum' in n]
rows=[]
for obj in target.objects:
    bm=bmesh.new();bm.from_mesh(obj.data);bm.verts.ensure_lookup_table();bm.normal_update()
    parts=components(bm)
    centers=[sum((v.co for v in part),Vector())/len(part) for part in parts]
    trees=[]
    for part in parts:
        tree=KDTree(len(part))
        for i,v in enumerate(part):tree.insert(v.co,i)
        tree.balance();trees.append(tree)
    pairs=[]
    for i,part in enumerate(parts[1:],1):
        mirrored=Vector((-centers[i].x,centers[i].y,centers[i].z))
        j=min(range(1,len(parts)),key=lambda k:(centers[k]-mirrored).length_squared)
        distances=[trees[j].find(Vector((-v.co.x,v.co.y,v.co.z)))[2] for v in part]
        faces={f for v in part for f in v.link_faces};edges={e for v in part for e in v.link_edges}
        otherfaces={f for v in parts[j] for f in v.link_faces};otheredges={e for v in parts[j] for e in v.link_edges}
        pairs.append({'component':i,'center':list(centers[i]),'paired_component':j,'center_distance':(centers[j]-mirrored).length,'reflected_vertex_distance_median':float(np.median(distances)),'reflected_vertex_distance_max':max(distances),'source':{'v':len(part),'f':len(faces),'junction':sum(len(e.link_faces)>2 for e in edges),'winding':sum(e.is_manifold and not e.is_contiguous for e in edges),'boundary':sum(e.is_boundary for e in edges)},'paired':{'v':len(parts[j]),'f':len(otherfaces),'junction':sum(len(e.link_faces)>2 for e in otheredges),'winding':sum(e.is_manifold and not e.is_contiguous for e in otheredges),'boundary':sum(e.is_boundary for e in otheredges)}})
    gum=parts[0];gumfaces={f for v in gum for f in v.link_faces}
    gumhalf=[]
    for sign in [-1,1]:
        faces=[f for f in gumfaces if sign*f.calc_center_median().x>0]
        edges={e for f in faces for e in f.edges}
        gumhalf.append({'side':sign,'faces':len(faces),'junction':sum(len(e.link_faces)>2 for e in edges),'winding':sum(e.is_manifold and not e.is_contiguous for e in edges),'boundary':sum(e.is_boundary for e in edges)})
    rows.append({'object':obj.name,'tooth_pairs':pairs,'gum_halves':gumhalf,'status':'AUDIT_ONLY_NO_DONOR_ASSUMED'})
    bm.free()
(ROOT/'reports/oral-symmetry-pair-audit.json').write_text(json.dumps(rows,indent=2))
print('ORAL_SYMMETRY_PAIRS_AUDITED',flush=True)
