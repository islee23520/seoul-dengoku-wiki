# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Compare exact world-space geometry and UV bytes between additional variants."""
import hashlib
import json
from pathlib import Path

import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
rows = []
for index in range(8, 16):
    obj = next(o for o in bpy.data.objects if o.name.startswith(f'ADD_{index:02d}_') and o.type == 'MESH')
    mesh = obj.data
    coordinates = np.empty(len(mesh.vertices) * 3, np.float32)
    mesh.vertices.foreach_get('co', coordinates)
    vertices = np.empty(len(mesh.loops), np.int32)
    mesh.loops.foreach_get('vertex_index', vertices)
    sizes = np.empty(len(mesh.polygons), np.int32)
    mesh.polygons.foreach_get('loop_total', sizes)
    uv = np.empty(len(mesh.loops) * 2, np.float32)
    mesh.uv_layers[0].data.foreach_get('uv', uv)
    rows.append({'index': index, 'object': obj.name, 'coordinate_sha256': hashlib.sha256(coordinates.tobytes()).hexdigest(), 'topology_sha256': hashlib.sha256(vertices.tobytes() + sizes.tobytes()).hexdigest(), 'uv_sha256': hashlib.sha256(uv.tobytes()).hexdigest()})
groups = {}
for row in rows:
    key = row['coordinate_sha256'] + ':' + row['topology_sha256']
    groups.setdefault(key, []).append(row['index'])
report = {'models': rows, 'identical_geometry_groups': list(groups.values()), 'source_modified': False}
(ROOT / 'reports/additional-body-fingerprints.json').write_text(json.dumps(report, indent=2))
print('ADDITIONAL_FINGERPRINTS_COMPLETE', list(groups.values()), flush=True)
