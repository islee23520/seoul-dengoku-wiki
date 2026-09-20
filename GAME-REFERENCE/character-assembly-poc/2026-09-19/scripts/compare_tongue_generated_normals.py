# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Remove custom corner normals on an isolated copy; prove coordinates/UVs unchanged."""
import hashlib
import json
from pathlib import Path

import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
obj = bpy.data.objects['Male_Tongue_Repaired']
mesh = obj.data
coords = np.empty(len(mesh.vertices)*3, np.float32)
mesh.vertices.foreach_get('co', coords)
coord_hash = hashlib.sha256(coords.tobytes()).hexdigest()
uvs = [np.array([tuple(d.uv) for d in layer.data]) for layer in mesh.uv_layers]
faces = [tuple(face.vertices) for face in mesh.polygons]
attribute = mesh.attributes.get('custom_normal')
assert attribute is not None
before_nonzero = sum(any(value != 0 for value in item.value) for item in attribute.data)
mesh.attributes.remove(attribute)
mesh.update()
assert not mesh.has_custom_normals
mesh.vertices.foreach_get('co', coords)
assert hashlib.sha256(coords.tobytes()).hexdigest() == coord_hash
assert faces == [tuple(face.vertices) for face in mesh.polygons]
for before, layer in zip(uvs, mesh.uv_layers):
    assert np.array_equal(before, np.array([tuple(d.uv) for d in layer.data]))
report = {'custom_nonzero_before': before_nonzero, 'custom_normals_after': mesh.has_custom_normals, 'geometry_unchanged': True, 'uv_unchanged': True, 'topology_unchanged': True, 'status': 'NORMAL_ONLY_COMPARISON_NOT_CAUSE_CLAIM'}
(ROOT/'reports/tongue-generated-normals-comparison.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work/male-tongue-generated-normals-review.blend'))
print('TONGUE_GENERATED_NORMALS_COPY_READY', flush=True)
