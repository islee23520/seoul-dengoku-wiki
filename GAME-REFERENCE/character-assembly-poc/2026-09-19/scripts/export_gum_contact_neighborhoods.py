# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Export native boundary neighbors and vertex normals around separated gum sheets."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups

records = []
for role in ['Upper', 'Lower']:
    obj = bpy.data.objects[f'Male_{role}_GumArch']
    bm = bmesh.new(); bm.from_mesh(obj.data); bm.verts.ensure_lookup_table(); bm.normal_update()
    root_points = {tuple(p) for p in json.loads((ROOT/f'reports/male-{role.lower()}-gum-graph.json').read_text())['root_points']}
    boundary = []
    for vertex in bm.verts:
        if vertex.is_boundary:
            boundary.append({'index': vertex.index, 'position': list(vertex.co), 'normal': list(vertex.normal),
                             'boundary_neighbors': [edge.other_vert(vertex).index for edge in vertex.link_edges if edge.is_boundary],
                             'all_neighbors': [edge.other_vert(vertex).index for edge in vertex.link_edges],
                             'is_root': tuple(vertex.co) in root_points})
    roots = [v.index for v in bm.verts if tuple(v.co) in root_points]
    mesh = obj.data; mesh.calc_loop_triangles()
    np.savez_compressed(ROOT/f'reports/{role.lower()}-gum-contact-source.npz', positions=np.array([v.co[:] for v in mesh.vertices]),
                        triangles=np.array([t.vertices[:] for t in mesh.loop_triangles]),
                        polygon_ids=np.array([t.polygon_index for t in mesh.loop_triangles]), root_ids=np.array(roots))
    records.append({'role': role, 'object': obj.name, 'boundary_vertices': boundary,
                    'loop_vertex_sets': [[v.index for v in {v for e in group for v in e.verts}] for group in boundary_groups(bm)]})
    bm.free()
(ROOT/'reports/gum-contact-neighborhoods.json').write_text(json.dumps(records, indent=2))
print('GUM_CONTACT_NEIGHBORHOODS_EXPORTED', flush=True)
