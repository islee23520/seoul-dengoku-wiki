# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "scipy"]
# ///
"""Select the smallest tested local fairing that resolves folded render quads."""
import json
from pathlib import Path

import numpy as np
import scipy.sparse as sp
from scipy.sparse.linalg import spsolve

ROOT = Path(__file__).resolve().parents[1]
data = np.load(ROOT / 'reports/tongue-geometry.npz')
positions = data['positions'].astype(float)
triangles = data['triangles']
polygon_ids = data['triangle_polygons']
edges = data['edges']
starts, sizes, loops = data['face_starts'], data['face_sizes'], data['loop_vertices']
root_vertices = json.loads((ROOT / 'reports/male-tongue-fold-audit.json').read_text())['root_vertices']
quad_triangles = {int(p): np.flatnonzero(polygon_ids == p) for p in np.unique(polygon_ids) if np.count_nonzero(polygon_ids == p) == 2}


def inspect(coordinates):
    """Evaluate the exact unchanged render triangles, not polygon normals alone."""
    points = coordinates[triangles]
    crosses = np.cross(points[:, 1] - points[:, 0], points[:, 2] - points[:, 0])
    lengths = np.linalg.norm(crosses, axis=1)
    assert np.all(lengths > 1e-12)
    normals = crosses / lengths[:, None]
    angles = {p: float(np.degrees(np.arccos(np.clip(normals[i[0]] @ normals[i[1]], -1, 1)))) for p, i in quad_triangles.items()}
    return {'quad_angles': angles, 'max_quad_fold_degrees': max(angles.values()), 'over60_quads': sum(a > 60 for a in angles.values()), 'render_triangle_area': float(lengths.sum() / 2), 'minimum_render_triangle_area': float(lengths.min() / 2)}


before = inspect(positions)
target_faces = sorted(p for p, angle in before['quad_angles'].items() if angle > 60)
assert target_faces == [68, 211, 241], 'Source changed; re-audit before solving'
seed = np.unique(np.concatenate([loops[starts[p]:starts[p] + sizes[p]] for p in target_faces]))
adjacency = sp.coo_matrix((np.ones(2 * len(edges)), (np.r_[edges[:, 0], edges[:, 1]], np.r_[edges[:, 1], edges[:, 0]])), shape=(len(positions), len(positions))).tocsr()
degree = np.asarray(adjacency.sum(axis=1)).ravel()
laplacian = sp.eye(len(positions)) - sp.diags(1 / degree) @ adjacency
weights = np.zeros(len(positions))
neighbors = np.unique(np.concatenate([adjacency[v].indices for v in seed]))
weights[neighbors] = .2
weights[seed] = 1
weights[root_vertices] = 0
central_groove = np.abs(positions[:, 0] + .004) < .012
weights[central_groove] = 0
free, fixed = np.flatnonzero(weights > 0), np.flatnonzero(weights == 0)
records = []
selected = None
for strength in [.1, .25, .5, 1., 2., 4.]:
    candidate = positions.copy()
    weighted = strength * sp.diags(weights[free])
    matrix = sp.eye(len(free)) + weighted @ laplacian[free][:, free]
    rhs = positions[free] - weighted @ laplacian[free][:, fixed] @ positions[fixed]
    candidate[free] = spsolve(matrix.tocsc(), rhs)
    metrics = inspect(candidate)
    delta = np.linalg.norm(candidate - positions, axis=1)
    area_ratio = metrics['render_triangle_area'] / before['render_triangle_area']
    bounds_change = float(np.max(np.abs(np.r_[candidate.min(0) - positions.min(0), candidate.max(0) - positions.max(0)])))
    eligible = metrics['over60_quads'] == 0 and .98 <= area_ratio <= 1.02 and bounds_change <= .0005 and delta.max() <= .006
    records.append({'strength': strength, 'metrics': metrics, 'surface_area_ratio': area_ratio, 'max_coordinate_displacement_source_units': float(delta.max()), 'bounds_max_change_source_units': bounds_change, 'fixed_vertex_displacement': float(delta[fixed].max()), 'numeric_candidate_eligible': bool(eligible)})
    if eligible and selected is None:
        selected = (candidate, records[-1])
assert selected is not None, 'No fairing candidate satisfied the recorded limits'
candidate, selection = selected
assert np.array_equal(candidate[fixed], positions[fixed])
np.savez_compressed(ROOT / 'reports/tongue-fairing-candidate.npz', positions=candidate, before=positions, editable_vertices=free, root_vertices=np.array(root_vertices), central_groove_vertices=np.flatnonzero(central_groove), triangles=triangles)
report = {'method': 'Local implicit umbrella solve; seed vertices from folded render quads with one-row tapered weights', 'targets': target_faces, 'unit_note': 'Source normalized head coordinates, not final character meters. Final placement scales the tongue.', 'before': before, 'candidates': records, 'selected_strength': selection['strength'], 'editable_vertices': len(free), 'root_vertices_fixed': len(root_vertices), 'central_groove_fixed': True, 'topology_changed': False, 'status': 'NUMERIC_CANDIDATE_NATIVE_AND_VISUAL_CHECK_PENDING', 'threshold_status': 'Local research acceptance limits for this source; not universal asset policy'}
(ROOT / 'reports/tongue-local-fairing-selection.json').write_text(json.dumps(report, indent=2))
print('TONGUE_LOCAL_FAIRING_SELECTED', selection['strength'], flush=True)
