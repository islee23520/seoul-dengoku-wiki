# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Apply the selected localized tongue correction on an isolated saved copy."""
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components

obj = bpy.data.objects['Male_Tongue_Repaired']
mesh = obj.data
proposal = np.load(ROOT / 'reports/tongue-fairing-candidate.npz')
current = np.empty(len(mesh.vertices) * 3, np.float32)
mesh.vertices.foreach_get('co', current)
assert np.array_equal(current.reshape(-1, 3).astype(float), proposal['before'])
polygons_before = [tuple(p.vertices) for p in mesh.polygons]
source_uv = [np.array([tuple(d.uv) for d in uv.data]) for uv in mesh.uv_layers]
mesh.vertices.foreach_set('co', proposal['positions'].astype(np.float32).ravel())
mesh.update()
assert polygons_before == [tuple(p.vertices) for p in mesh.polygons]
for uv, before in zip(mesh.uv_layers, source_uv):
    assert np.array_equal(before, np.array([tuple(d.uv) for d in uv.data]))
mesh.calc_loop_triangles()
folds = []
for face in mesh.polygons:
    tris = [t for t in mesh.loop_triangles if t.polygon_index == face.index]
    if len(tris) == 2:
        angle = math.degrees(math.acos(max(-1, min(1, tris[0].normal.dot(tris[1].normal)))))
        if angle > 60:
            folds.append({'polygon': face.index, 'angle': angle})
assert not folds, folds
bm = bmesh.new()
bm.from_mesh(mesh)
bm.normal_update()
assert len(components(bm)) == 1
assert sorted(len(g) for g in boundary_groups(bm)) == [20]
assert not any(e.is_wire or len(e.link_faces) > 2 or (e.is_manifold and not e.is_contiguous) for e in bm.edges)
bm.free()
after = np.array([tuple(v.co) for v in mesh.vertices])
fixed = np.ones(len(after), bool)
fixed[proposal['editable_vertices']] = False
assert np.array_equal(after[fixed], proposal['before'][fixed])
assert np.array_equal(after[proposal['root_vertices']], proposal['before'][proposal['root_vertices']])
mesh.normals_split_custom_set([(0, 0, 0)] * len(mesh.loops))
report = {'vertices': len(mesh.vertices), 'faces': len(mesh.polygons), 'topology_preserved': True, 'uv_coordinates_preserved': True, 'root_preserved': True, 'outside_edit_region_max_displacement': 0, 'render_quads_over60': len(folds), 'remaining_boundary': 'Original 20-vertex tongue-root attachment', 'native_float32_max_difference': float(np.linalg.norm(after - proposal['positions'], axis=1).max()), 'visual_review_pending': True}
(ROOT / 'reports/tongue-local-fairing-native.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/male-tongue-local-fairing-review.blend'))
print('TONGUE_LOCAL_FAIRING_NATIVE_PASS', flush=True)
