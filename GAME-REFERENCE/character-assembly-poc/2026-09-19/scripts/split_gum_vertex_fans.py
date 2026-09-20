# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Separate disconnected face fans at coincident vertices without moving surface corners."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from mesh_tools import boundary_groups,components

report=[]
for obj in list(bpy.context.scene.objects):
    if obj.type!='MESH':continue
    role='upper' if 'Upper' in obj.name else 'lower'
    mesh=obj.data
    bm=bmesh.new();bm.from_mesh(mesh);bm.verts.ensure_lookup_table();bm.faces.ensure_lookup_table()
    bm.verts.index_update();bm.faces.index_update()
    vertices=[tuple(v.co) for v in bm.verts]
    faces=[[v.index for v in f.verts] for f in bm.faces]
    corner_before=[[tuple(v.co) for v in f.verts] for f in bm.faces]
    material_ids=[f.material_index for f in bm.faces]
    original_uv={layer.name:np.array([d.uv[:] for d in layer.data],dtype=np.float32) for layer in mesh.uv_layers}
    original_root={tuple(p) for p in json.loads((ROOT/f'reports/male-{role}-gum-graph.json').read_text())['root_points']}
    split_records=[]
    for vertex in bm.verts:
        remaining=set(vertex.link_faces);fans=[]
        while remaining:
            first=min(remaining,key=lambda f:f.index);remaining.remove(first);stack=[first];fan={first}
            while stack:
                face=stack.pop()
                for edge in face.edges:
                    if vertex not in edge.verts:continue
                    for neighbor in edge.link_faces:
                        if neighbor in remaining:remaining.remove(neighbor);fan.add(neighbor);stack.append(neighbor)
            fans.append(fan)
        if len(fans)<=1:continue
        assert tuple(vertex.co) not in original_root,'Would split preserved root vertex'
        fans.sort(key=lambda fan:(-len(fan),min(f.index for f in fan)))
        for fan in fans[1:]:
            replacement=len(vertices);vertices.append(tuple(vertex.co))
            for face in fan:
                faces[face.index]=[replacement if index==vertex.index else index for index in faces[face.index]]
            split_records.append({'original_vertex':vertex.index,'new_vertex':replacement,'faces':sorted(f.index for f in fan),'coordinate':list(vertex.co)})
    bm.free()
    replacement=bpy.data.meshes.new(mesh.name+'_FanSeparated')
    replacement.from_pydata(vertices,[],faces);replacement.update()
    assert len(replacement.polygons)==len(corner_before)
    for polygon,old_coords in zip(replacement.polygons,corner_before):
        assert [tuple(replacement.vertices[i].co) for i in polygon.vertices]==old_coords
        polygon.material_index=material_ids[polygon.index];polygon.use_smooth=True
    for mat in mesh.materials:replacement.materials.append(mat)
    for name,values in original_uv.items():
        layer=replacement.uv_layers.new(name=name);layer.data.foreach_set('uv',values.ravel())
    probe=bmesh.new();probe.from_mesh(replacement);probe.verts.ensure_lookup_table();probe.normal_update()
    loops=[]
    for group in boundary_groups(probe):
        points={v for edge in group for v in edge.verts}
        simple=all(sum(edge in group for edge in v.link_edges)==2 for v in points)
        assert simple
        loops.append({'edges':len(group),'root':{tuple(v.co) for v in points}==original_root,'center':[sum(v.co[a] for v in points)/len(points) for a in range(3)]})
    assert any(loop['root'] for loop in loops)
    assert not any(len(e.link_faces)>2 or e.is_wire or (e.is_manifold and not e.is_contiguous) for e in probe.edges)
    parts=[]
    for part in components(probe):
        fs={f for v in part for f in v.link_faces}
        parts.append({'vertices':len(part),'faces':len(fs),'area':sum(f.calc_area() for f in fs),'center':[sum(v.co[a] for v in part)/len(part) for a in range(3)]})
    report.append({'role':role,'before_vertices':len(mesh.vertices),'after_vertices':len(replacement.vertices),'faces':len(replacement.polygons),'corner_coordinates_unchanged':True,'uv_coordinates_unchanged':True,'root_unchanged':True,'splits':split_records,'parts':parts,'boundary_loops':loops,'status':'FAN_SPLIT_CANDIDATE_REQUIRES_SURFACE_AND_COMPONENT_REVIEW'})
    probe.free();obj.data=replacement
    replacement.calc_loop_triangles()
    np.savez_compressed(ROOT/f'reports/male-{role}-gum-fansplit-triangles.npz',positions=np.array([v.co[:] for v in replacement.vertices]),triangles=np.array([t.vertices[:] for t in replacement.loop_triangles]),polygon_ids=np.array([t.polygon_index for t in replacement.loop_triangles]))
(ROOT/'reports/gum-fan-split-verification.json').write_text(json.dumps(report,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work/male-gum-fan-split-review.blend'))
print('GUM_FANS_SPLIT_AND_VERIFIED',flush=True)
