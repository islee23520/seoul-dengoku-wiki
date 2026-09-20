# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Audit both halves of the female assembled base."""
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups

obj = bpy.data.objects['Female_Base_Assembly']
mesh = obj.data
bm = bmesh.new(); bm.from_mesh(mesh); bm.normal_update()
bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table()

center = (min(v.co.x for v in bm.verts) + max(v.co.x for v in bm.verts)) / 2
eye_edges = set()
for group in boundary_groups(bm):
    if len(group) == 63:
        eye_edges.update(group)

sides = {}
for sign, label in [(-1, 'negative_x'), (1, 'positive_x')]:
    vertex_set = {v for v in bm.verts if sign * (v.co.x - center) > 0.0005}
    edges = [e for e in bm.edges if all(v in vertex_set for v in e.verts)]
    faces = [f for f in bm.faces if all(v in vertex_set for v in f.verts)]
    face_keys = [tuple(sorted(v.index for v in f.verts)) for f in faces]
    neck = [e for e in edges if e.is_manifold and 0.6 < v.co.z < 0.9 for v in e.verts]
    angles = sorted(math.degrees(e.calc_face_angle()) for e in neck if e.is_manifold)
    failures = {
        'unexpected_boundary': sum(e.is_boundary and e not in eye_edges for e in edges),
        'junctions': sum(len(e.link_faces) > 2 for e in edges),
        'winding': sum(e.is_manifold and not e.is_contiguous for e in edges),
        'wire': sum(e.is_wire for e in edges),
        'degenerate': sum(f.calc_area() < 1e-12 for f in faces),
        'duplicates': len(face_keys) - len(set(face_keys)),
    }
    sides[label] = {
        'vertices': len(vertex_set), 'faces': len(faces),
        'hard_failures': failures, 'structural_pass': not any(failures.values()),
        'neck_edges_sampled': len(angles),
        'neck_angle': {'median': float(np.median(angles)) if angles else None,
                       'p90': float(np.quantile(angles, 0.9)) if angles else None,
                       'max': max(angles) if angles else None,
                       'over90': sum(a > 90 for a in angles)},
    }

report = {
    'object': obj.name, 'center_x': center, 'sides': sides,
    'route': 'SYMMETRY_CANDIDATE' if all(s['structural_pass'] for s in sides.values()) else 'REPAIR_FIRST',
    'geometry_changed': False,
    'final_goal_pass': False,
}
bm.free()
(ROOT / 'reports/female-bilateral-audit.json').write_text(json.dumps(report, indent=2))
print('FEMALE_BILATERAL_AUDIT_COMPLETE', flush=True)
