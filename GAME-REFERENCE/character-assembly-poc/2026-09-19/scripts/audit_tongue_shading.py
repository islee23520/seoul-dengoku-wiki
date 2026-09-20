# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Read custom-normal and sharp-edge state without confusing it with geometry repair."""
import json
import math
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
obj = bpy.data.objects['Male_Tongue_Repaired']
mesh = obj.data
mesh.calc_loop_triangles()
bm = bmesh.new()
bm.from_mesh(mesh)
bm.normal_update()
sharp = []
for edge, bm_edge in zip(mesh.edges, bm.edges):
    if edge.use_edge_sharp:
        sharp.append({'edge': edge.index, 'position': list(sum((v.co for v in bm_edge.verts), bm_edge.verts[0].co * 0) / 2), 'geometric_angle': math.degrees(bm_edge.calc_face_angle()) if bm_edge.is_manifold else None})
seam_faces = [p.index for p in mesh.polygons if not p.use_smooth]
custom = mesh.attributes.get('custom_normal')
custom_nonzero = sum(any(x != 0 for x in d.value) for d in custom.data) if custom else 0
report = {'object': obj.name, 'has_custom_normals': mesh.has_custom_normals, 'custom_nonzero_values': custom_nonzero, 'flat_faces': seam_faces, 'sharp_edges': sharp, 'vertex_count': len(mesh.vertices), 'polygon_count': len(mesh.polygons), 'source_changed': False}
(ROOT / 'reports/tongue-shading-audit.json').write_text(json.dumps(report, indent=2))
bm.free()
print('TONGUE_SHADING_AUDITED', len(sharp), 'sharp_edges', len(seam_faces), 'flat_faces', flush=True)
