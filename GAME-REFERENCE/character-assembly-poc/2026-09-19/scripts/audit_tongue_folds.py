# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Identify tongue geometric folds separately from topological winding defects."""
import json
import math
from pathlib import Path

import bmesh
import bpy

ROOT=Path(__file__).resolve().parents[1]
obj=bpy.data.objects['Male_Tongue_Repaired']
bm=bmesh.new();bm.from_mesh(obj.data);bm.verts.ensure_lookup_table();bm.faces.ensure_lookup_table()
bm.normal_update()
folds=[]
for edge in bm.edges:
    if not edge.is_manifold:continue
    angle=math.degrees(edge.calc_face_angle())
    if angle>50:
        folds.append({'angle':angle,'verts':[v.index for v in edge.verts],'center':list((edge.verts[0].co+edge.verts[1].co)/2),'faces':[f.index for f in edge.link_faces],'near_root':any(v.is_boundary for v in edge.verts),'normal_dot':edge.link_faces[0].normal.dot(edge.link_faces[1].normal)})
report={'source':obj.name,'folds':sorted(folds,key=lambda x:x['angle'],reverse=True),'counts':{'over50':len(folds),'over90':sum(f['angle']>90 for f in folds)},'topology_unchanged':True,'root_vertices':[v.index for v in bm.verts if v.is_boundary]}
bm.free()
(ROOT/'reports/male-tongue-fold-audit.json').write_text(json.dumps(report,indent=2))
print('TONGUE_FOLD_AUDIT_COMPLETE',report['counts'],flush=True)
