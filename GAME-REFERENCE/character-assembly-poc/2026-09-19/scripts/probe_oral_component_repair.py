# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Evaluate per-component quad repair in memory; reject destructive outcomes."""
import json
import sys
from pathlib import Path

import bmesh
import bpy

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from mesh_tools import components,boundary_groups
from quad_patch_repair import repair_patches

with bpy.data.libraries.load(str(ROOT/'work/oral-separated-verified.blend'),link=False) as (source,target):
    target.objects=[name for name in source.objects if name.startswith('Male_')]
rows=[]
for obj in target.objects:
    source=bmesh.new();source.from_mesh(obj.data);source.verts.ensure_lookup_table()
    groups=components(source)
    for index,part in enumerate(groups):
        bm=bmesh.new()
        mapping={v:bm.verts.new(v.co) for v in part}
        faces={f for v in part for f in v.link_faces}
        for face in faces:bm.faces.new([mapping[v] for v in face.verts])
        bm.normal_update()
        loops=boundary_groups(bm)
        originals=[v.co.copy() for v in bm.verts]
        base={'object':obj.name,'component':index,'vertices':len(bm.verts),'faces':len(bm.faces),'area':sum(f.calc_area() for f in bm.faces),'boundary':sum(e.is_boundary for e in bm.edges),'junction':sum(len(e.link_faces)>2 for e in bm.edges)}
        # Root/base and all large simple sockets are legitimate separate-part
        # interfaces; preserve them during crack cleanup, close only after QA.
        preserved=[{tuple(v.co) for e in g for v in e.verts} for g in loops if len(g)>=8 and all(sum(e in g for e in v.link_edges)==2 for e in g for v in e.verts)]
        try:
            repaired=repair_patches(bm,preserved)
            after={'vertices':len(bm.verts),'faces':len(bm.faces),'area':sum(f.calc_area() for f in bm.faces),'boundary':sum(e.is_boundary for e in bm.edges),'junction':sum(len(e.link_faces)>2 for e in bm.edges),'winding':sum(e.is_manifold and not e.is_contiguous for e in bm.edges),'patches':len(repaired),'preserved_loops':[len(s) for s in preserved]}
            base['after']=after
            base['retained_area_ratio']=after['area']/base['area']
            base['status']='STRUCTURAL_CANDIDATE_NOT_SHAPE_APPROVED'
        except Exception as error:
            base['status']='FAILED'
            base['error']=f'{type(error).__name__}: {error}'
        rows.append(base);bm.free()
    source.free()
(ROOT/'reports/oral-component-repair-probe.json').write_text(json.dumps(rows,indent=2))
print('ORAL_COMPONENT_REPAIR_PROBE_COMPLETE',sum(r['status']=='FAILED' for r in rows),'failed',flush=True)
