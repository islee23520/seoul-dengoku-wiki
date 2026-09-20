# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Measure UV boundary conditions on generated repair patches without edits."""
import json
from pathlib import Path

import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]
report = []
for obj in bpy.context.scene.objects:
    if obj.type != 'MESH':
        continue
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    tag = bm.faces.layers.int.get('VerifiedQuadRepair')
    uv = bm.loops.layers.uv.active
    assert tag is not None and uv is not None
    remaining = {face for face in bm.faces if face[tag]}
    groups = []
    while remaining:
        first = remaining.pop()
        stack, faces = [first], {first}
        while stack:
            face = stack.pop()
            for edge in face.edges:
                for neighbor in edge.link_faces:
                    if neighbor in remaining:
                        remaining.remove(neighbor)
                        faces.add(neighbor)
                        stack.append(neighbor)
        vertices = {v for f in faces for v in f.verts}
        conditions = {}
        for vertex in vertices:
            samples = [loop[uv].uv.copy() for face in vertex.link_faces if face not in faces for loop in face.loops if loop.vert == vertex]
            if samples:
                conditions[vertex] = samples
        ambiguous = {v: values for v, values in conditions.items() if max((a - b).length for a in values for b in values) > 1e-5}
        groups.append({'faces': len(faces), 'vertices': len(vertices), 'boundary_vertices': len(conditions), 'uv_seam_boundary_vertices': len(ambiguous), 'uv_seam_spread_max': max(((a - b).length for values in conditions.values() for a in values for b in values), default=0), 'center': [sum(v.co[a] for v in vertices) / len(vertices) for a in range(3)]})
    report.append({'object': obj.name, 'uv_layer': uv.name, 'patches': groups})
    bm.free()
(ROOT / 'reports/patch-uv-boundary-probe.json').write_text(json.dumps(report, indent=2))
print('PATCH_UV_BOUNDARY_PROBE_COMPLETE', flush=True)
