# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Extract gum-only topology for constrained duplicate-surface selection."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from mesh_tools import components,boundary_groups

with bpy.data.libraries.load(str(ROOT/'work/oral-separated-verified.blend'),link=False) as (source,target):
    target.objects=[n for n in source.objects if n.startswith('Male_') and 'Gum' in n]
for obj in target.objects:
    role='upper' if 'Upper' in obj.name else 'lower'
    mesh=obj.data.copy();bm=bmesh.new();bm.from_mesh(mesh);bm.verts.ensure_lookup_table()
    retained=set(components(bm)[0]);bmesh.ops.delete(bm,geom=[v for v in bm.verts if v not in retained],context='VERTS')
    bm.verts.ensure_lookup_table();bm.verts.index_update();bm.faces.ensure_lookup_table();bm.faces.index_update();bm.edges.ensure_lookup_table();bm.edges.index_update();bm.normal_update()
    root=max(boundary_groups(bm),key=len)
    assert len(root)==(84 if role=='upper' else 82)
    rows={'role':role,'faces':[{'vertices':[v.index for v in f.verts],'area':f.calc_area(),'normal':list(f.normal)} for f in bm.faces],'edges':[{'vertices':[v.index for v in e.verts],'faces':[f.index for f in e.link_faces],'boundary':e.is_boundary,'root':e in root} for e in bm.edges],'root_points':[list(v.co) for v in {v for e in root for v in e.verts}]}
    bm.to_mesh(mesh);bm.free();mesh.calc_loop_triangles()
    np.savez_compressed(ROOT/f'reports/male-{role}-gum-graph.npz',positions=np.array([tuple(v.co) for v in mesh.vertices]),triangles=np.array([tuple(t.vertices) for t in mesh.loop_triangles]),polygon_ids=np.array([t.polygon_index for t in mesh.loop_triangles]))
    (ROOT/f'reports/male-{role}-gum-graph.json').write_text(json.dumps(rows,indent=2))
    bpy.data.meshes.remove(mesh)
print('GUM_REPAIR_GRAPHS_EXPORTED',flush=True)
