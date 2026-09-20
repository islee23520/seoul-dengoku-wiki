# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Audit real molar triangles and cap/source face separation before acceptance."""
import json
import math
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
rows=[]
for obj in bpy.context.scene.objects:
    if obj.type!='MESH':continue
    mesh=obj.data;mesh.calc_loop_triangles()
    bm=bmesh.new();bm.from_mesh(mesh);bm.verts.index_update();bm.normal_update()
    keys=[tuple(sorted(v.index for v in f.verts)) for f in bm.faces]
    quads=[]
    for face in mesh.polygons:
        tris=[t for t in mesh.loop_triangles if t.polygon_index==face.index]
        if len(tris)==2:
            angle=math.degrees(math.acos(max(-1,min(1,tris[0].normal.dot(tris[1].normal)))))
            if angle>60:quads.append({'polygon':face.index,'angle':angle,'center':list(face.center)})
    positions=np.array([tuple(v.co) for v in mesh.vertices],np.float64)
    triangles=np.array([t.vertices[:] for t in mesh.loop_triangles],np.int32)
    np.savez_compressed(ROOT/f'reports/{obj.name}-triangles.npz',positions=positions,triangles=triangles,polygon_ids=np.array([t.polygon_index for t in mesh.loop_triangles]))
    rows.append({'object':obj.name,'vertices':len(bm.verts),'faces':len(bm.faces),'boundary':sum(e.is_boundary for e in bm.edges),'junction':sum(len(e.link_faces)>2 for e in bm.edges),'winding':sum(e.is_manifold and not e.is_contiguous for e in bm.edges),'duplicate_faces':len(keys)-len(set(keys)),'degenerate_faces':sum(f.calc_area()<=1e-12 for f in bm.faces),'signed_volume':bm.calc_volume(signed=True),'nonplanar_quads_over60':quads,'status':'TRIANGLE_INTERSECTION_AND_CAP_REVIEW_PENDING'})
    bm.free()
(ROOT/'reports/repaired-molar-internal-audit.json').write_text(json.dumps(rows,indent=2))
print('REPAIRED_MOLAR_INTERNAL_AUDIT_READY',flush=True)
