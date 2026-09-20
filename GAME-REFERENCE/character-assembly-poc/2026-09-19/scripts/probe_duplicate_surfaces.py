# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Read-only test for near-identical duplicated surface faces sharing an edge."""
import json
from itertools import combinations
from pathlib import Path

import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]
obj = bpy.data.objects['Male_Logical_Weld_Repair']
bm = bmesh.new()
bm.from_mesh(obj.data)
before = {'vertices': len(bm.verts), 'faces': len(bm.faces), 'junctions': sum(len(e.link_faces) > 2 for e in bm.edges), 'boundary': sum(e.is_boundary for e in bm.edges)}
records = []
for iteration in range(1000):
    bm.normal_update()
    candidate = None
    for edge in bm.edges:
        if len(edge.link_faces) <= 2:
            continue
        for left, right in combinations(edge.link_faces, 2):
            if len(left.verts) != len(right.verts) or left.normal.dot(right.normal) < 0.985:
                continue
            a, b = list(left.verts), list(right.verts)
            arrangements = [b[k:] + b[:k] for k in range(len(b))]
            reverse = list(reversed(b))
            arrangements += [reverse[k:] + reverse[:k] for k in range(len(b))]
            matched = min(arrangements, key=lambda row: sum((v.co - w.co).length_squared for v, w in zip(a, row)))
            identical = sum(v == w for v, w in zip(a, matched))
            distance = max((v.co - w.co).length for v, w in zip(a, matched))
            threshold = min(0.001, min(left.calc_area(), right.calc_area()) ** 0.5 * 0.22)
            if identical >= 2 and distance <= threshold:
                candidate = (a, matched, distance)
                break
        if candidate:
            break
    if candidate is None:
        break
    a, matched, distance = candidate
    targetmap = {w: v for v, w in zip(a, matched) if w != v}
    prior = len(bm.faces)
    bmesh.ops.weld_verts(bm, targetmap=targetmap)
    records.append({'max_displacement_m': distance, 'merged_vertices': len(targetmap), 'removed_faces': prior - len(bm.faces)})
after = {'vertices': len(bm.verts), 'faces': len(bm.faces), 'quads': sum(len(f.verts) == 4 for f in bm.faces), 'junctions': sum(len(e.link_faces) > 2 for e in bm.edges), 'boundary': sum(e.is_boundary for e in bm.edges), 'wire': sum(e.is_wire for e in bm.edges), 'degenerate': sum(f.calc_area() < 1e-12 for f in bm.faces), 'winding_errors': sum(e.is_manifold and not e.is_contiguous for e in bm.edges)}
bm.free()
report = {'source_unchanged': True, 'before': before, 'after': after, 'pairs': len(records), 'records': records}
(ROOT / 'reports/duplicate-surface-probe.json').write_text(json.dumps(report, indent=2))
print('DUPLICATE_SURFACE_PROBE_COMPLETE', len(records), flush=True)
