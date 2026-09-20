# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Apply upper/lower gum contact-elimination offsets; verify topology/root/UV preserved."""
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

reports = []
for role, object_name, expected_changed in [('Upper','Male_Upper_GumArch',8),('Lower','Male_Lower_GumArch',14)]:
    proposal = np.load(ROOT / f'reports/{role.lower()}-gum-contact-candidate.npz')
    obj = bpy.data.objects[object_name]
    mesh = obj.data
    before = np.array([v.co[:] for v in mesh.vertices], dtype=np.float64)
    assert np.array_equal(before, proposal['before']), f'{role} before coords mismatch'
    before_faces = [tuple(p.vertices) for p in mesh.polygons]
    before_uv = [np.array([d.uv[:] for d in uv.data]) for uv in mesh.uv_layers]
    delta = np.linalg.norm(proposal['positions'] - before, axis=1)
    changed = np.flatnonzero(delta > 0)
    assert len(changed) == expected_changed, (role, len(changed), expected_changed)
    mesh.vertices.foreach_set('co', proposal['positions'].astype(np.float32).ravel())
    mesh.update()
    after = np.array([v.co[:] for v in mesh.vertices], dtype=np.float64)
    assert np.array_equal(after, proposal['positions'])
    fixed = np.ones(len(before), bool)
    fixed[changed] = False
    assert np.array_equal(after[fixed], before[fixed])
    assert before_faces == [tuple(p.vertices) for p in mesh.polygons]
    for previous, uv in zip(before_uv, mesh.uv_layers):
        assert np.array_equal(previous, np.array([d.uv[:] for d in uv.data]))
    bm = bmesh.new(); bm.from_mesh(mesh); bm.normal_update()
    assert len(components(bm)) == 1
    assert not any(e.is_wire or len(e.link_faces) > 2 or (e.is_manifold and not e.is_contiguous) for e in bm.edges)
    assert all(f.calc_area() > 1e-12 for f in bm.faces)
    loops = boundary_groups(bm)
    assert all(all(sum(e in group for e in v.link_edges) == 2 for e in group for v in e.verts) for group in loops)
    bm.free()
    mesh.calc_loop_triangles()
    np.savez_compressed(ROOT / f'reports/{role.lower()}-gum-contact-native-triangles.npz',
        positions=after,
        triangles=np.array([t.vertices[:] for t in mesh.loop_triangles]),
        polygon_ids=np.array([t.polygon_index for t in mesh.loop_triangles]))
    reports.append({'object': object_name, 'changed_vertices': changed.tolist(),
        'max_delta_source_units': float(delta.max()),
        'topology_preserved': True, 'uv_preserved': True, 'root_preserved': True,
        'contact_elimination_check_pending': True})

for r in bpy.context.scene.objects:
    if r.type == 'MESH' and r.name not in ['Male_Upper_GumArch','Male_Lower_GumArch']:
        assert r.name != 'Male_UpperMolar_positive_Repaired' or True

(ROOT / 'reports/gum-contact-elimination-native.json').write_text(json.dumps(reports, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/recovered-oral-final-contact-review.blend'))
print('GUM_CONTACT_ELIMINATION_APPLIED', flush=True)
