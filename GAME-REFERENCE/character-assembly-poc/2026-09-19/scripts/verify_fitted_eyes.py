# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Verify saved linked eye placements without modifying head or socket geometry."""
import json
from pathlib import Path

import bpy
import numpy as np
from mathutils import Matrix

ROOT = Path(__file__).resolve().parents[1]
scene = bpy.data.scenes['Shared_Eyes_Fitted_Review']
with bpy.data.libraries.load(str(ROOT / 'work/audit/imported-sources.blend'), link=False) as (source, target):
    target.objects = [name for name in source.objects if name.startswith(('SRC_06_', 'SRC_11_'))]
originals = target.objects
rows = []
for gender, prefix, factor in [('Male', 'SRC_06_', .2827375423), ('Female', 'SRC_11_', .2877734499)]:
    source = next(o for o in originals if o.name.startswith(prefix))
    head = scene.objects[gender + '_Head_EyeFit_Review']
    matrix = Matrix.Scale(factor, 4) @ source.matrix_basis
    assert len(head.data.vertices) == len(source.data.vertices)
    assert [tuple(p.vertices) for p in head.data.polygons] == [tuple(p.vertices) for p in source.data.polygons]
    error = max((v.co - matrix @ s.co).length for v, s in zip(head.data.vertices, source.data.vertices))
    assert error < 1e-7, (gender, error)
    cores = [scene.objects[f'{gender}_Eye_{i}_Core'] for i in [1, 2]]
    lenses = [scene.objects[f'{gender}_Eye_{i}_Cornea'] for i in [1, 2]]
    assert cores[0].data == cores[1].data
    assert lenses[0].data == lenses[1].data
    assert len(cores[0].data.materials) == 3 and len(lenses[0].data.materials) == 1
    assert all(tuple(o.rotation_euler) == (0, 0, 0) for o in cores + lenses)
    rows.append({'gender': gender, 'head_max_vertex_delta_m': error, 'head_topology_unchanged': True, 'eye_socket_geometry_unchanged': True, 'left_right_meshes_linked': True, 'eye_material_slots': [m.name for m in cores[0].data.materials], 'cornea_material': lenses[0].data.materials[0].name, 'visual_evidence': [f'evidence/shared-eyes-fitted/{gender}-{view}.png' for view in ['front', 'quarter', 'side']]})
assert scene.objects['Male_Eye_1_Core'].data == scene.objects['Female_Eye_1_Core'].data
assert scene.objects['Male_Eye_1_Cornea'].data == scene.objects['Female_Eye_1_Cornea'].data
for obj in originals:
    mesh = obj.data
    bpy.data.objects.remove(obj, do_unlink=True)
    if mesh.users == 0:
        bpy.data.meshes.remove(mesh)
report = {'ok': True, 'shared_across_genders': True, 'heads': rows, 'scope': 'Static fit on original heads; final assembled-body transfer remains pending', 'source_head_defects_not_repaired_by_this_task': True}
(ROOT / 'reports/shared-eye-fit-verification.json').write_text(json.dumps(report, indent=2))
print('SHARED_EYE_FIT_VERIFIED', flush=True)
