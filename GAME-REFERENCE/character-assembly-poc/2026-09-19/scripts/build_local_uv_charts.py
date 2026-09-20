# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy"]
# ///
"""Replace eight small overlapping neighborhoods, retaining the large UV charts."""
import json
from collections import defaultdict
from pathlib import Path

import numpy as np
from uv_overlap_audit import audit

ROOT = Path(__file__).resolve().parents[1]
data = np.load(ROOT / 'reports/tessellation-uv-connectivity.npz')
uv = data['uv'].astype(float)
vertex_ids = data['loop_vertices']
triangle_loops = data['triangle_loops']
polygon_ids = data['triangle_polygons']
keys = np.rec.fromarrays([vertex_ids, uv[:, 0], uv[:, 1]], names='vertex,u,v')
_, first, inverse = np.unique(keys, return_index=True, return_inverse=True)
nodes_uv = uv[first]
nodes_xyz = data['positions'][vertex_ids[first]].astype(float)
triangles = inverse[triangle_loops]
edge_triangles = defaultdict(list)
for index, triangle in enumerate(triangles):
    for corner in range(3):
        edge_triangles[tuple(sorted((int(triangle[corner]), int(triangle[(corner + 1) % 3]))))].append(index)
neighbors = defaultdict(set)
for connected in edge_triangles.values():
    if len(connected) == 2:
        a, b = map(int, polygon_ids[connected])
        if a != b:
            neighbors[a].add(b)
            neighbors[b].add(a)
failures = json.loads((ROOT / 'reports/male-tessellation-uv-overlap.json').read_text())
bad = {int(polygon_ids[i]) for pair in failures['positive_area_overlap_pairs'] for i in pair['triangles']}
grown = bad | {neighbor for polygon in bad for neighbor in neighbors[polygon]}
remaining = set(grown)
groups = []
while remaining:
    start = min(remaining)
    remaining.remove(start)
    stack, group = [start], {start}
    while stack:
        face = stack.pop()
        for other in neighbors[face]:
            if other in remaining:
                remaining.remove(other)
                group.add(other)
                stack.append(other)
    groups.append(group)
assert len(groups) == 8 and len(grown) == 68
# One uniform atlas transform reserves a strip; no intact chart is re-unwrapped.
result = uv * .92 + np.array([.04, .07])
xyz_triangles = data['positions'][vertex_ids[triangle_loops]]
xyz_area = np.linalg.norm(np.cross(xyz_triangles[:, 1]-xyz_triangles[:, 0], xyz_triangles[:, 2]-xyz_triangles[:, 0]), axis=1)/2
uv_triangles = uv[triangle_loops]
a, b = uv_triangles[:, 1]-uv_triangles[:, 0], uv_triangles[:, 2]-uv_triangles[:, 0]
uv_area = abs(a[:, 0]*b[:, 1]-a[:, 1]*b[:, 0])/2
density = float(np.sqrt(uv_area.sum()/xyz_area.sum())) * .92
cursor = .02
padding = .002
receipts = []
for group in groups:
    ids = np.flatnonzero(np.isin(polygon_ids, list(group)))
    nodes = np.unique(triangles[ids])
    points = nodes_xyz[nodes]
    _, singular, basis = np.linalg.svd(points-points.mean(axis=0), full_matrices=False)
    projected = (points-points.mean(axis=0)) @ basis[:2].T
    lookup = np.full(len(nodes_uv), -1, np.int32)
    lookup[nodes] = np.arange(len(nodes))
    local_triangles = lookup[triangles[ids]]
    p = projected[local_triangles]
    a, b = p[:, 1]-p[:, 0], p[:, 2]-p[:, 0]
    signed = (a[:, 0]*b[:, 1]-a[:, 1]*b[:, 0])/2
    if signed.sum() < 0:
        projected[:, 0] *= -1
    assert audit(projected[local_triangles])['ok']
    scale = density * np.sqrt(xyz_area[ids].sum()/abs(signed).sum())
    projected -= projected.min(axis=0)
    projected *= scale
    size = projected.max(axis=0)
    if size[1] > size[0]:
        # Rotate, not reflect, to keep positive orientation.
        projected = np.c_[projected[:, 1], size[0]-projected[:, 0]]
        size = projected.max(axis=0)
    assert size[1] + 2*padding < .05
    assert cursor + size[0] + 2*padding < .98
    projected += np.array([cursor+padding, .015+padding])
    loops = np.unique(triangle_loops[ids])
    result[loops] = projected[lookup[inverse[loops]]]
    receipts.append({'polygon_ids': sorted(group), 'faces': len(group), 'width_uv': float(size[0]), 'height_uv': float(size[1]), 'density': density, 'planarity_ratio': float(singular[-1]/singular[0])})
    cursor += size[0]+2*padding
triangles_out = result[triangle_loops].astype(np.float32).astype(np.float64)
verification = audit(triangles_out)
assert verification['ok'], verification
np.savez_compressed(ROOT/'reports/local-chart-uv-transfer.npz', uv=result.astype(np.float32), triangle_loops=triangle_loops)
np.savez_compressed(ROOT/'reports/male-local-chart-uv-triangles.npz', triangles=triangles_out, polygon_ids=polygon_ids)
(ROOT/'reports/male-local-chart-uv-overlap.json').write_text(json.dumps(verification, indent=2))
report = {'changed_local_polygons': len(grown), 'total_polygons': len(data['face_starts']), 'small_continuous_charts_added': len(groups), 'intact_chart_transform': {'uniform_scale': .92, 'translation': [.04, .07]}, 'local_chart_padding_uv': padding, 'minimum_padding_at_4k_pixels': padding*4096, 'geometry_changed': False, 'source_uv_changed': False, 'charts': receipts, 'status': 'NUMERICAL_PASS_CHECKER_REQUIRED'}
(ROOT/'reports/local-chart-uv-transfer.json').write_text(json.dumps(report, indent=2))
print('LOCAL_CHART_UV_PASS', len(groups), 'charts', len(grown), 'polygons', flush=True)
