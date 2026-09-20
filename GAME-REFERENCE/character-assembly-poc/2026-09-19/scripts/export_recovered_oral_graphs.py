# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Export original quad-edge graphs and all boundary coordinates for local repairs."""
import json
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
rows = []
for obj in bpy.context.scene.objects:
    if obj.type != 'MESH':
        continue
    mesh = obj.data
    mesh.calc_loop_triangles()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.verts.ensure_lookup_table()
    boundary_ids = [v.index for v in bm.verts if v.is_boundary]
    bm.free()
    edges = np.empty(len(mesh.edges) * 2, np.int32)
    mesh.edges.foreach_get('vertices', edges)
    filename = f'{obj.name}-repair-graph.npz'
    np.savez_compressed(ROOT / 'reports' / filename,
                        positions=np.array([v.co[:] for v in mesh.vertices]),
                        edges=edges.reshape(-1, 2),
                        triangles=np.array([t.vertices[:] for t in mesh.loop_triangles]),
                        polygon_ids=np.array([t.polygon_index for t in mesh.loop_triangles]),
                        boundary_ids=np.array(boundary_ids, np.int32))
    rows.append({'object': obj.name, 'graph': filename, 'role': obj['role'],
                 'boundary_vertices': len(boundary_ids), 'coordinates_modified': False})
(ROOT / 'reports/recovered-oral-graph-index.json').write_text(json.dumps(rows, indent=2))
print('RECOVERED_ORAL_GRAPHS_EXPORTED', len(rows), flush=True)
