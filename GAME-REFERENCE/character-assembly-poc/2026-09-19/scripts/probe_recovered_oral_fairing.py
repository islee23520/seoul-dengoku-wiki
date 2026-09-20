# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "scipy"]
# ///
"""Compare crossing-local candidates with every original part boundary fixed.

This is a measured candidate search, not approval or a rewrite of source parts.
Failed candidates remain in the report; eligible coordinates get separate files.
"""
import json
from pathlib import Path

import numpy as np
import scipy.sparse as sp
from scipy.sparse.linalg import spsolve
from triangle_intersection_audit import audit_intersections

ROOT = Path(__file__).resolve().parents[1]
index = json.loads((ROOT / 'reports/recovered-oral-graph-index.json').read_text())
rows = []
for item in index:
    data = np.load(ROOT / 'reports' / item['graph'])
    before = data['positions'].astype(np.float64)
    triangles, edges = data['triangles'], data['edges']
    boundary = data['boundary_ids']
    baseline = audit_intersections(before, triangles)
    assert baseline['intersections'], 'Expected recorded RED crossing case'
    crossing_triangles = sorted({t for hit in baseline['intersections'] for t in hit['triangles']})
    seeds = np.unique(triangles[crossing_triangles])
    graph = sp.coo_matrix((np.ones(2 * len(edges)),
                           (np.r_[edges[:, 0], edges[:, 1]], np.r_[edges[:, 1], edges[:, 0]])),
                          shape=(len(before), len(before))).tocsr()
    degree = np.asarray(graph.sum(axis=1)).ravel()
    assert (degree > 0).all()
    laplacian = sp.eye(len(before)) - sp.diags(1 / degree) @ graph
    weights = np.zeros(len(before))
    neighbors = np.unique(np.concatenate([graph[v].indices for v in seeds]))
    weights[neighbors] = .15
    weights[seeds] = 1
    weights[boundary] = 0
    free, fixed = np.flatnonzero(weights > 0), np.flatnonzero(weights == 0)

    def surface_area(positions):
        points = positions[triangles]
        return np.linalg.norm(np.cross(points[:, 1] - points[:, 0], points[:, 2] - points[:, 0]), axis=1).sum() / 2

    original_area = surface_area(before)
    diameter = np.linalg.norm(np.ptp(before, axis=0))
    # Record shape bounds before testing. These serve this comparison only.
    limits = {'max_displacement_fraction_bbox_diagonal': .025,
              'surface_area_ratio': [.98, 1.02], 'new_crossings_allowed': 0,
              'boundary_displacement_allowed': 0}
    record = {'object': item['object'], 'role': item['role'],
              'before_intersections': len(baseline['intersections']),
              'before_point_contacts': len(baseline['point_contacts']),
              'seed_vertices': seeds.tolist(), 'free_vertices': free.tolist(),
              'fixed_boundary_vertices': boundary.tolist(), 'comparison_limits': limits,
              'candidates': [], 'selected': None, 'geometry_applied': False}
    baseline_contacts = {tuple(pair['triangles']) for pair in baseline['point_contacts']}
    for strength in [.001, .005, .025, .05, .1, .25, .5, 1., 2., 4.]:
        candidate = before.copy()
        if len(free):
            W = strength * sp.diags(weights[free])
            candidate[free] = spsolve((sp.eye(len(free)) + W @ laplacian[free][:, free]).tocsc(),
                                      before[free] - W @ laplacian[free][:, fixed] @ before[fixed])
        candidate = candidate.astype(np.float32).astype(np.float64)
        assert np.array_equal(candidate[fixed], before[fixed])
        measured = audit_intersections(candidate, triangles)
        area_ratio = float(surface_area(candidate) / original_area)
        displacement = np.linalg.norm(candidate - before, axis=1)
        contacts = {tuple(pair['triangles']) for pair in measured['point_contacts']}
        eligible = (measured['ok'] and not (contacts - baseline_contacts)
                    and .98 <= area_ratio <= 1.02 and displacement.max() <= diameter * .025)
        metrics = {'strength': strength, 'intersections': len(measured['intersections']),
                   'intersection_pairs': measured['intersections'],
                   'point_contacts': len(contacts), 'new_point_contacts': len(contacts - baseline_contacts),
                   'degenerate_triangles': measured['degenerate_triangles'],
                   'surface_area_ratio': area_ratio,
                   'max_displacement_source_units': float(displacement.max()),
                   'relative_max_displacement': float(displacement.max() / diameter),
                   'boundary_max_displacement': float(displacement[boundary].max()),
                   'candidate_eligible': bool(eligible)}
        record['candidates'].append(metrics)
        if eligible:
            filename = item['object'] + '-fairing-candidate.npz'
            np.savez_compressed(ROOT / 'reports' / filename, positions=candidate, before=before,
                                triangles=triangles, boundary_ids=boundary, free_vertices=free,
                                polygon_ids=data['polygon_ids'])
            record['selected'] = {'strength': strength, 'file': filename,
                                  'status': 'NUMERIC_CANDIDATE_NATIVE_AND_VISUAL_REVIEW_REQUIRED'}
            break
    rows.append(record)
    print('RECOVERED_PART_FAIRING', item['object'],
          'eligible' if record['selected'] else 'no_eligible_candidate', flush=True)
(ROOT / 'reports/recovered-oral-fairing-probe.json').write_text(json.dumps(rows, indent=2))
print('RECOVERED_ORAL_FAIRING_PROBE_COMPLETE', sum(row['selected'] is not None for row in rows), 'eligible_parts', flush=True)
