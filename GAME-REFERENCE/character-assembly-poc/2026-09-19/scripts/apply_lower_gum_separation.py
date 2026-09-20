# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Apply bounded lower-gum offsets, preserving true root and all other oral parts."""
import hashlib
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components

proposal = np.load(ROOT / 'reports/lower-gum-direct-candidate.npz')
selection = json.loads((ROOT / 'reports/lower-gum-direct-separation-probe.json').read_text())
assert selection['success'] and not selection['remaining_intersections']
obj = bpy.data.objects['Male_Lower_GumArch']
mesh = obj.data
before = np.array([v.co[:] for v in mesh.vertices], dtype=np.float64)
assert np.array_equal(before, proposal['before'])
before_faces = [tuple(p.vertices) for p in mesh.polygons]
before_uv = [np.array([d.uv[:] for d in uv.data]) for uv in mesh.uv_layers]
other_hashes = {o.name: hashlib.sha256(np.array([v.co[:] for v in o.data.vertices], np.float32).tobytes()).hexdigest() for o in bpy.context.scene.objects if o.type == 'MESH' and o != obj}
changed = np.flatnonzero(np.linalg.norm(proposal['positions'] - before, axis=1) > 0)
assert len(changed) == 14
mesh.vertices.foreach_set('co', proposal['positions'].astype(np.float32).ravel())
mesh.update()
after = np.array([v.co[:] for v in mesh.vertices], dtype=np.float64)
assert np.array_equal(after, proposal['positions'])
fixed = np.ones(len(before), bool)
fixed[changed] = False
assert np.array_equal(after[fixed], before[fixed])
assert np.array_equal(after[proposal['root_ids']], before[proposal['root_ids']])
assert before_faces == [tuple(p.vertices) for p in mesh.polygons]
for previous, uv in zip(before_uv, mesh.uv_layers):
    assert np.array_equal(previous, np.array([d.uv[:] for d in uv.data]))
bm = bmesh.new()
bm.from_mesh(mesh)
bm.normal_update()
assert len(components(bm)) == 1
assert not any(e.is_wire or len(e.link_faces) > 2 or (e.is_manifold and not e.is_contiguous) for e in bm.edges)
assert all(f.calc_area() > 1e-12 for f in bm.faces)
loops = boundary_groups(bm)
assert all(all(sum(e in group for e in v.link_edges) == 2 for e in group for v in e.verts) for group in loops)
report = {'object': obj.name, 'changed_vertices': changed.tolist(), 'max_delta_source_units': float(np.linalg.norm(after-before, axis=1).max()), 'root_vertices_preserved': len(proposal['root_ids']), 'outside_region_unchanged': True, 'uv_unchanged': True, 'topology_unchanged': True, 'boundary_loop_sizes': [len(g) for g in loops], 'other_parts_unchanged': True, 'self_intersection_check_pending': True, 'status': 'NATIVE_APPLIED_VISUAL_AND_CONTACT_QA_PENDING'}
bm.free()
for name, digest in other_hashes.items():
    other = bpy.data.objects[name]
    assert hashlib.sha256(np.array([v.co[:] for v in other.data.vertices], np.float32).tobytes()).hexdigest() == digest
mesh.calc_loop_triangles()
np.savez_compressed(ROOT / 'reports/lower-gum-separated-native-triangles.npz', positions=after, triangles=np.array([t.vertices[:] for t in mesh.loop_triangles]), polygon_ids=np.array([t.polygon_index for t in mesh.loop_triangles]))
(ROOT / 'reports/lower-gum-separation-native.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/recovered-oral-gums-separated-review.blend'))
print('LOWER_GUM_SEPARATION_APPLIED', flush=True)
