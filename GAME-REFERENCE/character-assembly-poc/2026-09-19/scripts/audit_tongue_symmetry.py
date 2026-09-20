# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Compare tongue halves geometrically before attempting donor reflection."""
import json
import math
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Vector
from mathutils.kdtree import KDTree

ROOT = Path(__file__).resolve().parents[1]
obj = bpy.data.objects['Male_Tongue_Repaired']
mesh = obj.data
mesh.calc_loop_triangles()
bm = bmesh.new(); bm.from_mesh(mesh); bm.verts.ensure_lookup_table(); bm.normal_update()
tree = KDTree(len(bm.verts))
for vertex in bm.verts:
    tree.insert(vertex.co, vertex.index)
tree.balance()
points = np.array([tuple(v.co) for v in bm.verts])
center_candidates = []
for center in [-.00415, -.00391, (points[:,0].min()+points[:,0].max())/2, 0.0]:
    errors = np.array([tree.find(Vector((2*center-p[0],p[1],p[2])))[2] for p in points])
    center_candidates.append({'center':float(center),'median_error':float(np.median(errors)),'p90_error':float(np.quantile(errors,.9)),'max_error':float(errors.max())})
center = min(center_candidates,key=lambda x:(x['median_error'],x['p90_error']))['center']
rows=[]
for sign,label in [(-1,'negative_x'),(1,'positive_x')]:
    vertices={v for v in bm.verts if sign*(v.co.x-center)>1e-5}
    edges=[e for e in bm.edges if all(v in vertices for v in e.verts)]
    faces=[f for f in bm.faces if all(v in vertices for v in f.verts)]
    angles=[math.degrees(e.calc_face_angle()) for e in edges if e.is_manifold]
    quads=[]
    for polygon in mesh.polygons:
        if not all(sign*(mesh.vertices[i].co.x-center)>1e-5 for i in polygon.vertices):continue
        tris=[t for t in mesh.loop_triangles if t.polygon_index==polygon.index]
        if len(tris)==2:quads.append(math.degrees(math.acos(max(-1,min(1,tris[0].normal.dot(tris[1].normal))))))
    rows.append({'side':label,'vertices':len(vertices),'faces':len(faces),'edge_angle_median':float(np.median(angles)),'edge_angle_p90':float(np.quantile(angles,.9)),'edge_angle_max':max(angles),'quad_internal_angle_max':max(quads),'winding':sum(e.is_manifold and not e.is_contiguous for e in edges),'junctions':sum(len(e.link_faces)>2 for e in edges),'boundary_edges':sum(e.is_boundary for e in edges),'surface_area':sum(f.calc_area() for f in faces)})
report={'candidate_centers':center_candidates,'selected_center_for_comparison':center,'halves':rows,'not_applied':True,'status':'SYMMETRY_ELIGIBILITY_REVIEW_REQUIRED'}
(ROOT/'reports/tongue-symmetry-audit.json').write_text(json.dumps(report,indent=2))
bm.free();print('TONGUE_SYMMETRY_AUDITED',flush=True)
