# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "scipy"]
# ///
# Run: python3 scripts/analyze_sculpt_inverse.py (numpy/scipy required).
"""Reproducible endpoint inverse analysis; does not modify any Blender mesh."""
import json
from pathlib import Path

import numpy as np
import scipy.sparse as sparse
from scipy.sparse.linalg import spsolve

ROOT = Path(__file__).resolve().parents[1]
data = np.load(ROOT / 'reports/sculpt-inverse-data.npz')
X, Y = data['before_positions'], data['after_positions']
E, starts, sizes = data['edges'], data['face_starts'], data['face_sizes']
loops, edge_faces = data['loop_vertices'], data['edge_faces']
N0, N1 = data['before_vertex_normals'], data['after_vertex_normals']
D = Y - X
center = float(data['mesh_center_x'])
changed = np.linalg.norm(D, axis=1) > 1e-7
left = X[:, 0] < center - 0.0005
adjacency = sparse.coo_matrix((np.ones(2 * len(E)), (np.r_[E[:, 0], E[:, 1]], np.r_[E[:, 1], E[:, 0]])), shape=(len(X), len(X))).tocsr()
degree = np.asarray(adjacency.sum(axis=1)).ravel()
P = sparse.diags(1 / degree) @ adjacency
L = sparse.eye(len(X)) - P
seam_faces = data['seam_face_indices']
seam_vertices = np.unique(np.concatenate([loops[starts[f]:starts[f] + sizes[f]] for f in seam_faces]))
hops = np.full(len(X), 999)
hops[seam_vertices] = 0
frontier = np.zeros(len(X), bool)
frontier[seam_vertices] = True
for distance in range(1, 13):
    following = (np.asarray(adjacency @ frontier.astype(float)).ravel() > 0) & (hops == 999)
    hops[following] = distance
    frontier = following
roi = (hops <= 10) & (X[:, 2] > 1.485) & (X[:, 2] < 1.64) & (np.abs(X[:, 0] - center) < .10)
evaluation = roi & left
indices = np.flatnonzero(roi)
angle = np.arctan2(-(X[:, 0] - center), -(X[:, 1] - .01))
sectors = np.full(len(X), -1)
sectors[evaluation & (angle < np.pi / 3)] = 0
sectors[evaluation & (angle >= np.pi / 3) & (angle < 2 * np.pi / 3)] = 1
sectors[evaluation & (angle >= 2 * np.pi / 3)] = 2
local_eval, local_sector = evaluation[indices], sectors[indices]
target = D[indices]


def stats(values: np.ndarray) -> dict:
    """Bounded scalar distribution summary."""
    return {'count': int(values.size), 'median': float(np.median(values)), 'p90': float(np.quantile(values, .9)), 'max': float(values.max()), 'mean': float(values.mean())}


def cross_validate(predictions: np.ndarray, metadata: list[dict]) -> dict:
    """Choose parameters using two angular sectors; evaluate only the third."""
    folds, total_error, baseline_error = [], 0.0, 0.0
    for held in range(3):
        train, test = local_eval & (local_sector != held), local_sector == held
        losses = np.mean(np.sum((predictions[:, train] - target[train]) ** 2, axis=2), axis=1)
        best = int(losses.argmin())
        error = np.sum((predictions[best, test] - target[test]) ** 2)
        zero = np.sum(target[test] ** 2)
        total_error += error
        baseline_error += zero
        folds.append({'heldout_sector': held, 'chosen': metadata[best], 'rmse_mm': float(np.sqrt(error / test.sum()) * 1000), 'energy_explained': float(1 - error / zero), 'candidate_index': best})
    return {'energy_explained': float(1 - total_error / baseline_error), 'folds': folds}


Psub = P[indices][:, indices].tocsr()
outside = P[indices] @ X - Psub @ X[indices]
envelope = np.clip((X[indices, 2] - 1.485) / .025, 0, 1) * np.clip((1.64 - X[indices, 2]) / .025, 0, 1) * np.clip(-(X[indices, 0] - center) / .004, 0, 1)
normal_d = np.einsum('ij,ij->i', D, N0)
tangent_d = D - normal_d[:, None] * N0
seam_face_mask = np.zeros(len(starts), bool)
seam_face_mask[seam_faces] = True
valid_edges = np.all(edge_faces >= 0, axis=1)
border = valid_edges & (seam_face_mask[np.maximum(edge_faces[:, 0], 0)] != seam_face_mask[np.maximum(edge_faces[:, 1], 0)])
left_edges = X[E].mean(axis=1)[:, 0] < center - .0005
edge_roi = valid_edges & np.all(roi[E], axis=1) & left_edges
before_angles, after_angles = np.degrees(data['before_edge_angles']), np.degrees(data['after_edge_angles'])
changed_left = changed & left
metrics = {'vertices': len(X), 'faces': len(starts), 'changed_vertices': int(changed.sum()), 'changed_left_vertices': int(changed_left.sum()), 'roi_vertices': int(roi.sum()), 'left_evaluation_vertices': int(evaluation.sum()), 'move_mm': stats(np.linalg.norm(D[changed_left], axis=1) * 1000), 'normal_move_mm': stats(normal_d[changed_left] * 1000), 'tangent_move_mm': stats(np.linalg.norm(tangent_d[changed_left], axis=1) * 1000), 'normal_energy_fraction': float(np.sum(normal_d[changed_left] ** 2) / np.sum(D[changed_left] ** 2)), 'seam_border_before_degrees': stats(before_angles[border & left_edges]), 'seam_border_after_degrees': stats(after_angles[border & left_edges]), 'edges_over90_before': int((before_angles[edge_roi] > 90).sum()), 'edges_over90_after': int((after_angles[edge_roi] > 90).sum()), 'winding_before': int(data['before_winding_errors'][edge_roi].sum()), 'winding_after': int(data['after_winding_errors'][edge_roi].sum()), 'laplacian_energy_reduction': float(1 - np.sum((L @ Y)[evaluation] ** 2) / np.sum((L @ X)[evaluation] ** 2)), 'squared_dihedral_energy_reduction': float(1 - np.sum(after_angles[edge_roi] ** 2) / np.sum(before_angles[edge_roi] ** 2)), 'face_above_neck_max_move_m': float(np.max(np.linalg.norm(D[X[:, 2] > 1.62], axis=1))), 'lower_body_max_move_m': float(np.max(np.linalg.norm(D[X[:, 2] < 1.50], axis=1)))}
# Endpoint-conditioned inverse coefficients are explanatory and must never be
# confused with prediction: Y and its geometric normals appear on the right side.
umbrella_y = P @ Y - Y
normal_u = np.einsum('ij,ij->i', umbrella_y, N1)[:, None] * N1
tangent_u = umbrella_y - normal_u
scalar = np.maximum(0, np.einsum('ij,ij->i', umbrella_y, D) / np.maximum(np.sum(umbrella_y ** 2, axis=1), 1e-30))
normal_alpha = np.maximum(0, np.einsum('ij,ij->i', normal_u, D) / np.maximum(np.sum(normal_u ** 2, axis=1), 1e-30))
tangent_alpha = np.maximum(0, np.einsum('ij,ij->i', tangent_u, D) / np.maximum(np.sum(tangent_u ** 2, axis=1), 1e-30))
scalar_fit = scalar[:, None] * umbrella_y
split_fit = normal_alpha[:, None] * normal_u + tangent_alpha[:, None] * tangent_u
inverse = {'target_conditioned_not_prediction': True, 'scalar_energy_explained': float(1 - np.sum((D[evaluation] - scalar_fit[evaluation]) ** 2) / np.sum(D[evaluation] ** 2)), 'normal_tangent_energy_explained': float(1 - np.sum((D[evaluation] - split_fit[evaluation]) ** 2) / np.sum(D[evaluation] ** 2)), 'normal_tangent_residual_mm': stats(np.linalg.norm((D - split_fit)[changed_left], axis=1) * 1000)}
explicit_meta, explicit_predictions = [], []
implicit_meta, implicit_predictions = [], []
for width in [1.5, 2.5, 4., 6., 10.]:
    weight = envelope * np.exp(-.5 * (hops[indices] / width) ** 2)
    positions = X[indices].copy()
    for step in range(1, 61):
        positions += .5 * weight[:, None] * (Psub @ positions + outside - positions)
        if step in [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 45, 60]:
            explicit_meta.append({'operator': 'explicit_uniform', 'sigma_hops': width, 'steps': step, 'lambda': .5})
            explicit_predictions.append(positions - X[indices])
    for duration in [.5, 1., 2., 4., 8., 12., 20., 32., 50., 80., 120.]:
        alpha = duration * weight
        matrix = sparse.eye(len(indices)) + sparse.diags(alpha) @ (sparse.eye(len(indices)) - Psub)
        positions = spsolve(matrix.tocsc(), X[indices] + alpha[:, None] * outside)
        implicit_meta.append({'operator': 'implicit_uniform', 'sigma_hops': width, 'duration': duration})
        implicit_predictions.append(positions - X[indices])
explicit_predictions, implicit_predictions = np.stack(explicit_predictions), np.stack(implicit_predictions)
explicit_cv = cross_validate(explicit_predictions, explicit_meta)
implicit_cv = cross_validate(implicit_predictions, implicit_meta)
edge_lengths = np.linalg.norm(X[E[:, 0]] - X[E[:, 1]], axis=1)
length_sum = np.zeros(len(X))
np.add.at(length_sum, E[:, 0], edge_lengths)
np.add.at(length_sum, E[:, 1], edge_lengths)
roughness = np.linalg.norm(P @ X - X, axis=1) / np.maximum(length_sum / degree, 1e-9)
feature = roughness[indices] / max(float(np.median(roughness[evaluation])), 1e-9)
adaptive_meta, adaptive_predictions = [], []
for width in [2.5, 4., 6., 10.]:
    distance_weight = envelope * np.exp(-.5 * (hops[indices] / width) ** 2)
    for power in [.5, 1., 2.]:
        rough_weight = np.clip(feature, .05, 6.) ** power
        rough_weight = .5 * rough_weight + .5 * (Psub @ rough_weight)
        for duration in [2., 4., 8., 12., 20., 32.]:
            alpha = duration * distance_weight * rough_weight
            matrix = sparse.eye(len(indices)) + sparse.diags(alpha) @ (sparse.eye(len(indices)) - Psub)
            positions = spsolve(matrix.tocsc(), X[indices] + alpha[:, None] * outside)
            adaptive_meta.append({'operator': 'adaptive_implicit', 'sigma_hops': width, 'roughness_power': power, 'duration': duration})
            adaptive_predictions.append(positions - X[indices])
adaptive_predictions = np.stack(adaptive_predictions)
adaptive_cv = cross_validate(adaptive_predictions, adaptive_meta)
geometry = []
next_loop = np.arange(len(loops)) + 1
next_loop[starts + sizes - 1] = starts
for fold in implicit_cv['folds']:
    prediction = X.copy()
    prediction[indices] += implicit_predictions[fold['candidate_index']]
    normal = np.add.reduceat(np.cross(prediction[loops], prediction[loops[next_loop]]), starts, axis=0)
    normal /= np.maximum(np.linalg.norm(normal, axis=1)[:, None], 1e-30)
    angles = np.full(len(E), np.nan)
    angles[valid_edges] = np.degrees(np.arccos(np.clip(np.einsum('ij,ij->i', normal[edge_faces[valid_edges, 0]], normal[edge_faces[valid_edges, 1]]), -1, 1)))
    held = fold['heldout_sector']
    selection = border & (sectors[E[:, 0]] == held) & (sectors[E[:, 1]] == held)
    geometry.append({'sector': held, 'edges': int(selection.sum()), 'before_degrees': stats(before_angles[selection]), 'human_degrees': stats(after_angles[selection]), 'model_degrees': stats(angles[selection]), 'outside_roi_max_move_m': float(np.max(np.linalg.norm((prediction - X)[~roi], axis=1)))})
adaptive_geometry = []
for fold in adaptive_cv['folds']:
    displacement = adaptive_predictions[fold['candidate_index']]
    prediction = X.copy()
    prediction[indices] += displacement
    normal = np.add.reduceat(np.cross(prediction[loops], prediction[loops[next_loop]]), starts, axis=0)
    normal /= np.maximum(np.linalg.norm(normal, axis=1)[:, None], 1e-30)
    angles = np.full(len(E), np.nan)
    angles[valid_edges] = np.degrees(np.arccos(np.clip(np.einsum('ij,ij->i', normal[edge_faces[valid_edges, 0]], normal[edge_faces[valid_edges, 1]]), -1, 1)))
    held = fold['heldout_sector']
    selection = border & (sectors[E[:, 0]] == held) & (sectors[E[:, 1]] == held)
    unchanged_test = (local_sector == held) & ~changed[indices]
    adaptive_geometry.append({'sector': held, 'model_degrees': stats(angles[selection]), 'human_degrees': stats(after_angles[selection]), 'unchanged_human_region_max_drift_mm': float(np.max(np.linalg.norm(displacement[unchanged_test], axis=1)) * 1000), 'outside_roi_max_move_m': float(np.max(np.linalg.norm((prediction - X)[~roi], axis=1)))})
triangles = data['triangles']
a, b = X[triangles[:, 1]] - X[triangles[:, 0]], X[triangles[:, 2]] - X[triangles[:, 0]]
da, db = D[triangles[:, 1]] - D[triangles[:, 0]], D[triangles[:, 2]] - D[triangles[:, 0]]
cross0, cross1 = np.cross(a, b), np.cross(a + da, b + db)
linear, nonlinear = np.cross(da, b) + np.cross(a, db), np.cross(da, db)
valid = np.linalg.norm(cross0, axis=1) > 1e-12
affected = changed[triangles].any(axis=1) & valid
ratio = np.linalg.norm(nonlinear, axis=1) / np.maximum(np.linalg.norm(cross1 - cross0, axis=1), 1e-30)
normal_relation = {'identity_error_m2': float(np.max(np.abs((cross1 - cross0) - linear - nonlinear))), 'affected_valid_triangles': int(affected.sum()), 'nonlinear_term_fraction': stats(ratio[affected]), 'preexisting_degenerate_triangles': int((~valid).sum())}
report = {'data': 'sculpt-inverse-data.npz', 'metrics': metrics, 'endpoint_inverse': inverse, 'explicit_spatial_cv': explicit_cv, 'implicit_spatial_cv': implicit_cv, 'adaptive_spatial_cv': adaptive_cv, 'heldout_geometry': geometry, 'adaptive_heldout_geometry': adaptive_geometry, 'normal_relation': normal_relation, 'limits': ['One subject and one final sculpt, not cross-subject validation.', 'Endpoint inverse uses target positions/normals; not automatic reproduction.', 'Fold selection uses before-geometry angular sectors, not random adjacent vertices.', 'Model families were explored on this same example; spatial CV is exploratory, not an untouched final test.', 'No Blender scene or user mesh was changed by this analysis.']}
(ROOT / 'reports/sculpt-inverse-analysis.json').write_text(json.dumps(report, indent=2))
candidate_arrays = {'indices': indices, 'sectors': sectors, 'roi': roi}
for fold in adaptive_cv['folds']:
    candidate_arrays[f"heldout_{fold['heldout_sector']}_displacement"] = adaptive_predictions[fold['candidate_index']]
np.savez_compressed(ROOT / 'reports/sculpt-inverse-candidates.npz', **candidate_arrays)
print(json.dumps({'status': 'INVERSE_ANALYSIS_COMPLETE', 'changed_left': metrics['changed_left_vertices'], 'endpoint_explanation': inverse['normal_tangent_energy_explained'], 'uniform_heldout_prediction': implicit_cv['energy_explained'], 'adaptive_heldout_prediction': adaptive_cv['energy_explained']}))
