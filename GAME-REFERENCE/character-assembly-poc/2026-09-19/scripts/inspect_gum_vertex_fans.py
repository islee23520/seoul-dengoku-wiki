# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Diagnose bow-tie vertices without welding legitimate socket interfaces."""
import json
from pathlib import Path

import bmesh
import bpy

ROOT=Path(__file__).resolve().parents[1]
rows=[]
for obj in bpy.context.scene.objects:
    if obj.type!='MESH':continue
    bm=bmesh.new();bm.from_mesh(obj.data);bm.verts.ensure_lookup_table();bm.faces.ensure_lookup_table();bm.normal_update()
    records=[]
    for vertex in bm.verts:
        remaining=set(vertex.link_faces);fans=[]
        while remaining:
            start=remaining.pop();stack=[start];fan={start}
            while stack:
                face=stack.pop()
                for edge in face.edges:
                    if vertex not in edge.verts:continue
                    for other in edge.link_faces:
                        if other in remaining:remaining.remove(other);fan.add(other);stack.append(other)
            fans.append(fan)
        if len(fans)>1:
            records.append({'vertex':vertex.index,'position':list(vertex.co),'boundary_degree':sum(e.is_boundary for e in vertex.link_edges),'fans':[{'faces':[f.index for f in fan],'area':sum(f.calc_area() for f in fan)} for fan in fans]})
    rows.append({'object':obj.name,'multi_fan_vertices':records,'source_geometry_changed':False})
    bm.free()
(ROOT/'reports/gum-vertex-fan-audit.json').write_text(json.dumps(rows,indent=2))
print('GUM_VERTEX_FANS_READY',flush=True)
