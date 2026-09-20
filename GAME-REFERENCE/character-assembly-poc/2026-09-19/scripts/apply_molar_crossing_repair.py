# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Apply audited local crown offsets on a saved copy; export native retessellation."""
import hashlib
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Vector
from mathutils.kdtree import KDTree

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import components

proposal = np.load(ROOT / 'reports/molar-crossing-repair-candidate.npz')
plane = json.loads((ROOT / 'reports/upper-molar-pair-repair.json').read_text())['symmetry_plane_x']
lookup = KDTree(len(proposal['before']))
for i, point in enumerate(proposal['before']):
    lookup.insert(Vector(point), i)
lookup.balance()
report = []
for side in ['positive', 'negative']:
    obj = bpy.data.objects[f'Male_UpperMolar_{side}_Repaired']
    mesh = obj.data
    original = np.array([tuple(v.co) for v in mesh.vertices])
    topology = [tuple(p.vertices) for p in mesh.polygons]
    source_uv = [np.array([tuple(d.uv) for d in layer.data]) for layer in mesh.uv_layers]
    changed = []
    matched_indices = []
    for vertex in mesh.vertices:
        point = vertex.co.copy()
        if side == 'negative':
            point.x = 2 * plane - point.x
        _, index, error = lookup.find(point)
        assert error < 1e-7, (side, vertex.index, error)
        matched_indices.append(index)
        if index in set(proposal['editable'].tolist()):
            delta = proposal['after'][index] - proposal['before'][index]
            if side == 'negative':
                delta = delta.copy()
                delta[0] *= -1
            vertex.co += Vector(delta)
            changed.append(vertex.index)
    assert len(set(matched_indices)) == len(original), 'Ambiguous tooth vertex correspondence'
    mesh.update()
    assert topology == [tuple(p.vertices) for p in mesh.polygons]
    for previous, layer in zip(source_uv, mesh.uv_layers):
        assert np.array_equal(previous, np.array([tuple(d.uv) for d in layer.data]))
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.normal_update()
    assert len(components(bm)) == 1
    assert all(e.is_manifold and e.is_contiguous for e in bm.edges)
    assert bm.calc_volume(signed=True) > 0
    assert all(f.calc_area() > 1e-12 for f in bm.faces)
    volume = bm.calc_volume(signed=True)
    bm.free()
    after = np.array([tuple(v.co) for v in mesh.vertices])
    unchanged = np.ones(len(after), bool)
    unchanged[changed] = False
    assert np.array_equal(original[unchanged], after[unchanged])
    mesh.calc_loop_triangles()
    triangles = np.array([tuple(t.vertices) for t in mesh.loop_triangles], np.int32)
    filename = f'{obj.name}-crossing-repaired-triangles.npz'
    np.savez_compressed(ROOT / 'reports' / filename, positions=after, triangles=triangles, polygon_ids=np.array([t.polygon_index for t in mesh.loop_triangles]))
    report.append({'object': obj.name, 'vertices': len(after), 'faces': len(topology), 'changed_vertices': len(changed), 'max_displacement_source_units': float(np.linalg.norm(after - original, axis=1).max()), 'outside_region_displacement': 0, 'uv_unchanged': True, 'topology_unchanged': True, 'closed_consistent_shell': True, 'signed_volume': volume, 'triangle_data': filename, 'source_coordinate_sha256': hashlib.sha256(original.tobytes()).hexdigest()})
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/male-upper-molar-pair-crossing-repaired.blend'))
(ROOT / 'reports/molar-crossing-native-application.json').write_text(json.dumps(report, indent=2))
print('MOLAR_CROSSING_NATIVE_APPLIED', flush=True)
