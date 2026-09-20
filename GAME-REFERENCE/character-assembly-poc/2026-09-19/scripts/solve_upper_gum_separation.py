# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy"]
# ///
"""Direct half-space separation of the single upper-gum penetration, not smoothing."""
import json
from pathlib import Path

import numpy as np
from triangle_intersection_audit import audit_intersections

ROOT = Path(__file__).resolve().parents[1]
data = np.load(ROOT / 'reports/Male_Upper_GumArch-repair-graph.npz')
positions, triangles = data['positions'].astype(float), data['triangles']
root_points = np.array(json.loads((ROOT / 'reports/male-upper-gum-graph.json').read_text())['root_points'])
lookup = {tuple(p): i for i, p in enumerate(positions)}
root_ids = np.array([lookup[tuple(p)] for p in root_points])
before = audit_intersections(positions, triangles)
assert len(before['intersections']) == 1
pair = before['intersections'][0]['triangles']
before_contacts = {tuple(p['triangles']) for p in before['point_contacts']}


def area(points):
    t = points[triangles]
    return float(np.linalg.norm(np.cross(t[:, 1]-t[:, 0], t[:, 2]-t[:, 0]), axis=1).sum()/2)


original_area = area(positions)
candidates = []
accepted = []
for fixed_triangle, moved_triangle in [pair, pair[::-1]]:
    surface = positions[triangles[fixed_triangle]]
    normal = np.cross(surface[1]-surface[0], surface[2]-surface[0])
    normal /= np.linalg.norm(normal)
    ids = triangles[moved_triangle]
    for sign in [-1, 1]:
        result = positions.copy()
        distances = (positions[ids]-surface[0]) @ normal
        steps = np.maximum(0, 1e-7-sign*distances)
        result[ids] += steps[:, None]*sign*normal
        result = result.astype(np.float32).astype(float)
        delta = np.linalg.norm(result-positions, axis=1)
        changed = np.flatnonzero(delta>0)
        measured = audit_intersections(result, triangles)
        contacts = {tuple(p['triangles']) for p in measured['point_contacts']}
        area_ratio = area(result)/original_area
        root_error = float(delta[root_ids].max())
        eligible = (measured['ok'] and not (contacts-before_contacts) and delta.max()<=.0015
                    and .995<=area_ratio<=1.005 and root_error==0)
        row = {'fixed_triangle':fixed_triangle, 'moved_triangle':moved_triangle, 'side':sign,
               'changed_vertex_ids':changed.tolist(), 'max_move_source_units':float(delta.max()),
               'squared_displacement':float((delta**2).sum()), 'area_ratio':area_ratio,
               'root_max_move':root_error, 'intersections':len(measured['intersections']),
               'point_contacts':len(contacts), 'new_contacts':len(contacts-before_contacts),
               'eligible':bool(eligible)}
        candidates.append(row)
        if eligible:
            accepted.append((result,row))
assert accepted, 'No admissible direct separation'
result,selection = min(accepted,key=lambda item:item[1]['squared_displacement'])
np.savez_compressed(ROOT/'reports/upper-gum-direct-separation.npz',before=positions,positions=result,
                    triangles=triangles,root_ids=root_ids,changed_ids=np.array(selection['changed_vertex_ids']))
report={'before_intersections':1,'before_point_contacts':len(before_contacts),'method':'Orthogonal separation into a triangle-plane half-space; compare both directions and moved sides',
        'candidates':candidates,'selection':selection,'original_source_unchanged':True,
        'status':'NUMERIC_CANDIDATE_REQUIRES_NATIVE_SOCKET_AND_RENDER_QA'}
(ROOT/'reports/upper-gum-direct-separation.json').write_text(json.dumps(report,indent=2))
print('UPPER_GUM_SEPARATION_SELECTED',len(selection['changed_vertex_ids']),'vertices',flush=True)
