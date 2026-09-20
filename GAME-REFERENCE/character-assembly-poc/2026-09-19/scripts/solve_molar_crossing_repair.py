# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "scipy"]
# ///
"""Choose a bounded correction for measured crown intersections, not global smoothing."""
import hashlib
import json
from pathlib import Path

import numpy as np
import scipy.sparse as sp
from scipy.sparse.linalg import spsolve
from triangle_intersection_audit import audit_intersections

ROOT = Path(__file__).resolve().parents[1]
data = np.load(ROOT / 'reports/molar-repair-connectivity.npz')
positions = data['positions'].astype(np.float64)
edges = data['edges']
triangles = data['triangles']
before_audit = audit_intersections(positions, triangles)
assert not before_audit['ok'] and len(before_audit['intersections']) == 4
seed_triangles = sorted({i for hit in before_audit['intersections'] for i in hit['triangles']})
seeds = np.unique(triangles[seed_triangles])
graph = sp.coo_matrix((np.ones(2 * len(edges)), (np.r_[edges[:, 0], edges[:, 1]], np.r_[edges[:, 1], edges[:, 0]])), shape=(len(positions), len(positions))).tocsr()
degree = np.asarray(graph.sum(axis=1)).ravel()
laplacian = sp.eye(len(positions)) - sp.diags(1 / degree) @ graph
weights = np.zeros(len(positions))
neighbors = np.unique(np.concatenate([graph[v].indices for v in seeds]))
weights[neighbors] = .15
weights[seeds] = 1
# The measured crossings are on the crown below .299 source units. Keep the
# gum/root interface and root cap (above .301) and all distant crown vertices fixed.
weights[positions[:, 2] > .301] = 0
editable = np.flatnonzero(weights > 0)
fixed = np.flatnonzero(weights == 0)


def shape_metrics(points):
    tri = points[triangles]
    cross = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    areas = np.linalg.norm(cross, axis=1) / 2
    volume = np.einsum('ij,ij->i', tri[:, 0], np.cross(tri[:, 1], tri[:, 2])).sum() / 6
    return float(areas.sum()), float(volume), float(areas.min())


base_area, base_volume, _ = shape_metrics(positions)
records = []
chosen = None
for strength in [.001, .0025, .005, .01, .025, .05, .1, .25]:
    weighted = strength * sp.diags(weights[editable])
    matrix = sp.eye(len(editable)) + weighted @ laplacian[editable][:, editable]
    rhs = positions[editable] - weighted @ laplacian[editable][:, fixed] @ positions[fixed]
    candidate = positions.copy()
    candidate[editable] = spsolve(matrix.tocsc(), rhs)
    # Audit the actual precision Blender will store, not a higher precision fiction.
    candidate = candidate.astype(np.float32).astype(np.float64)
    geometry = audit_intersections(candidate, triangles)
    area, volume, minimum = shape_metrics(candidate)
    delta = np.linalg.norm(candidate - positions, axis=1)
    accepted = geometry['ok'] and not geometry['point_contacts'] and delta.max() <= .0003 and .995 <= area / base_area <= 1.005 and .995 <= volume / base_volume <= 1.005
    record = {'strength': strength, 'intersections': len(geometry['intersections']), 'point_contacts': len(geometry['point_contacts']), 'max_displacement_source_units': float(delta.max()), 'area_ratio': area / base_area, 'volume_ratio': volume / base_volume, 'minimum_triangle_area': minimum, 'outside_region_max_displacement': float(delta[fixed].max()), 'candidate_eligible': bool(accepted)}
    records.append(record)
    if accepted and chosen is None:
        chosen = (candidate, record, geometry)
assert chosen is not None, 'No bounded nonintersecting molar candidate'
candidate, selected, geometry = chosen
assert np.array_equal(candidate[fixed], positions[fixed])
np.savez_compressed(ROOT / 'reports/molar-crossing-repair-candidate.npz', before=positions, after=candidate, editable=editable, fixed=fixed, triangles=triangles, edges=edges)
report = {'source': 'molar-repair-connectivity.npz', 'source_coordinate_sha256': hashlib.sha256(positions.tobytes()).hexdigest(), 'before_intersection_count': len(before_audit['intersections']), 'crossing_seed_vertices': seeds.tolist(), 'editable_vertices': editable.tolist(), 'fixed_root_z_above': .301, 'candidates': records, 'selection': selected, 'after_intersection_audit': geometry, 'acceptance_scope': 'Sample-specific local shape bounds; not a general tooth standard', 'geometry_applied': False, 'native_and_render_verification_pending': True}
(ROOT / 'reports/molar-crossing-repair-selection.json').write_text(json.dumps(report, indent=2))
print('MOLAR_CROSSING_CANDIDATE_SELECTED', selected['strength'], flush=True)
