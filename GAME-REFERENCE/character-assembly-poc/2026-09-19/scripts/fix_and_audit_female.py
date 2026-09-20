# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Fill remaining 4-edge hole and verify, then run bilateral audit."""
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components, orient_surface

assert bpy.app.background
obj = bpy.data.objects['Female_Base_Assembly']
mesh = obj.data
bm = bmesh.new(); bm.from_mesh(mesh); bm.normal_update()
bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table()

# Fill the 4-edge hole
groups = boundary_groups(bm)
small = [g for g in groups if len(g) <= 10]
print(f'Small boundary groups: {[len(g) for g in small]}', flush=True)
for g in small:
    vs = list({v for e in g for v in e.verts})
    if len(vs) == 4 and all(sum(e in g for e in v.link_edges) == 2 for v in vs):
        # Order the ring
        start = vs[0]
        ring = [start]
        prev = None; cur = start
        while True:
            nxt = next(e.other_vert(cur) for e in cur.link_edges if e in g and e.other_vert(cur) != prev)
            if nxt == start: break
            ring.append(nxt); prev, cur = cur, nxt
        try:
            bm.faces.new(ring)
            print(f'Filled 4-edge hole with quad', flush=True)
        except ValueError as e2:
            print(f'Fill failed: {e2}', flush=True)

orient_surface(bm)
bm.normal_update()

# Verify
parts = components(bm)
remaining = boundary_groups(bm)
winding = sum(1 for e in bm.edges if e.is_manifold and not e.is_contiguous)
junction = sum(1 for e in bm.edges if len(e.link_faces) > 2)

# Bilateral audit
center = (min(v.co.x for v in bm.verts) + max(v.co.x for v in bm.verts)) / 2
eye_edges = set()
for group in remaining:
    if len(group) == 63:
        eye_edges.update(group)

sides = {}
for sign, label in [(-1, 'negative_x'), (1, 'positive_x')]:
    vs = {v for v in bm.verts if sign * (v.co.x - center) > 0.0005}
    edges = [e for e in bm.edges if all(v in vs for v in e.verts)]
    faces_list = [f for f in bm.faces if all(v in vs for v in f.verts)]
    fk = [tuple(sorted(v.index for v in f.verts)) for f in faces_list]
    failures = {
        'unexpected_boundary': sum(e.is_boundary and e not in eye_edges for e in edges),
        'junctions': sum(len(e.link_faces) > 2 for e in edges),
        'winding': sum(e.is_manifold and not e.is_contiguous for e in edges),
        'wire': sum(e.is_wire for e in edges),
        'degenerate': sum(f.calc_area() < 1e-12 for f in faces_list),
        'duplicates': len(fk) - len(set(fk)),
    }
    neck_edges = [e for e in edges if e.is_manifold and all(0.6 < v.co.z < 0.9 for v in e.verts)]
    angles = sorted(math.degrees(e.calc_face_angle()) for e in neck_edges) if neck_edges else []
    sides[label] = {
        'vertices': len(vs), 'faces': len(faces_list),
        'hard_failures': failures, 'structural_pass': not any(failures.values()),
        'neck_sampled': len(angles),
        'neck_angle': {'median': float(np.median(angles)) if angles else None,
                       'p90': float(np.quantile(angles, 0.9)) if angles else None,
                       'max': max(angles) if angles else None,
                       'over90': sum(a > 90 for a in angles)},
    }

report = {
    'gender': 'Female',
    'vertices': len(bm.verts), 'faces': len(bm.faces),
    'quads': sum(1 for f in bm.faces if len(f.verts) == 4),
    'connected_components': len(parts),
    'boundary_groups': [len(g) for g in remaining],
    'junction_edges': junction, 'winding_errors': winding,
    'degenerate_faces': sum(1 for f in bm.faces if f.calc_area() < 1e-12),
    'center_x': center, 'sides': sides,
    'route': 'SYMMETRY_CANDIDATE' if all(s['structural_pass'] for s in sides.values()) else 'REPAIR_FIRST',
    'geometry_changed': False, 'final_goal_pass': False,
}
bm.to_mesh(mesh); bm.free()
mesh.normals_split_custom_set([(0, 0, 0)] * len(mesh.loops))
for p in mesh.polygons: p.use_smooth = True
(ROOT / 'reports/female-bilateral-audit.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/female-base-bilateral-review.blend'))
print('FEMALE_BILATERAL_AUDIT', json.dumps(report), flush=True)
