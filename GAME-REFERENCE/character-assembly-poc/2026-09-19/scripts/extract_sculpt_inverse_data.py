# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Extract corresponding pre/post sculpt data without changing the visible scene."""
import hashlib
import json
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
NAME = 'Male_Protected_Body_Neck_Trial'
files = {
    'before': 'protected-body-neck-trial.blend',
    'early': 'user-sculpt-state-preserved.blend',
    'after': 'user-left-sculpt-preserved.blend',
}
arrays = {}
receipts = {}
for label, filename in files.items():
    path = ROOT / 'work' / filename
    with bpy.data.libraries.load(str(path), link=False) as (source, target):
        assert NAME in source.objects
        target.objects = [NAME]
    obj = target.objects[0]
    mesh = obj.data
    coordinates = np.empty((len(mesh.vertices), 3), dtype=np.float64)
    raw = np.empty(len(mesh.vertices) * 3, dtype=np.float32)
    mesh.vertices.foreach_get('co', raw)
    coordinates[:] = raw.reshape((-1, 3))
    edge_vertices = np.empty(len(mesh.edges) * 2, dtype=np.int32)
    mesh.edges.foreach_get('vertices', edge_vertices)
    loop_vertices = np.empty(len(mesh.loops), dtype=np.int32)
    mesh.loops.foreach_get('vertex_index', loop_vertices)
    face_starts = np.empty(len(mesh.polygons), dtype=np.int32)
    face_sizes = np.empty(len(mesh.polygons), dtype=np.int32)
    mesh.polygons.foreach_get('loop_start', face_starts)
    mesh.polygons.foreach_get('loop_total', face_sizes)
    topology = hashlib.sha256(edge_vertices.tobytes() + loop_vertices.tobytes() + face_starts.tobytes() + face_sizes.tobytes()).hexdigest()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    bm.faces.ensure_lookup_table()
    bm.normal_update()
    arrays[label + '_positions'] = coordinates
    arrays[label + '_vertex_normals'] = np.array([tuple(v.normal) for v in bm.verts])
    arrays[label + '_face_normals'] = np.array([tuple(f.normal) for f in bm.faces])
    arrays[label + '_face_areas'] = np.array([f.calc_area() for f in bm.faces])
    arrays[label + '_edge_angles'] = np.array([e.calc_face_angle() if e.is_manifold else np.nan for e in bm.edges])
    arrays[label + '_winding_errors'] = np.array([e.is_manifold and not e.is_contiguous for e in bm.edges])
    if label == 'before':
        arrays['edges'] = edge_vertices.reshape((-1, 2))
        arrays['face_starts'] = face_starts
        arrays['face_sizes'] = face_sizes
        arrays['loop_vertices'] = loop_vertices
        arrays['edge_faces'] = np.array([[f.index for f in e.link_faces] if e.is_manifold else [-1, -1] for e in bm.edges], dtype=np.int32)
        arrays['seam_face_indices'] = np.array([p.index for p in mesh.polygons if p.select], dtype=np.int32)
        arrays['boundary_edges'] = np.array([e.is_boundary for e in bm.edges])
        mesh.calc_loop_triangles()
        arrays['triangles'] = np.array([tuple(t.vertices) for t in mesh.loop_triangles], dtype=np.int32)
        baseline_topology = topology
    else:
        assert topology == baseline_topology, f'Topology mismatch: {label}'
    receipts[label] = {
        'file': str(path), 'file_sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'topology_sha256': topology, 'coordinate_sha256': hashlib.sha256(raw.tobytes()).hexdigest(),
        'vertices': len(mesh.vertices), 'edges': len(mesh.edges), 'faces': len(mesh.polygons),
        'custom_normals': mesh.has_custom_normals,
    }
    bm.free()
    bpy.data.objects.remove(obj, do_unlink=True)
    if mesh.users == 0:
        bpy.data.meshes.remove(mesh)
arrays['mesh_center_x'] = np.array((arrays['before_positions'][:, 0].min() + arrays['before_positions'][:, 0].max()) / 2)
np.savez_compressed(ROOT / 'reports/sculpt-inverse-data.npz', **arrays)
(ROOT / 'reports/sculpt-inverse-source-receipt.json').write_text(json.dumps(receipts, indent=2))
print('SCULPT_INVERSE_DATA_EXTRACTED', len(arrays['before_positions']), flush=True)
