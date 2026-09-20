# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy"]
# ///
"""Audit all recovered gums/crowns; aggregate every failure without short-circuiting."""
import json
from pathlib import Path

import numpy as np
from triangle_intersection_audit import audit_intersections

ROOT = Path(__file__).resolve().parents[1]
parts = json.loads((ROOT/'reports/recovered-oral-parts.json').read_text())
rows = []
for part in parts:
    path = ROOT/'reports'/f"{part['object']}-triangles.npz"
    data = np.load(path)
    result = audit_intersections(data['positions'], data['triangles'])
    for hit in result['intersections']:
        hit['polygons'] = [int(data['polygon_ids'][i]) for i in hit['triangles']]
        hit['center'] = data['positions'][data['triangles'][hit['triangles']]].mean(axis=(0,1)).tolist()
    row = {'object': part['object'], 'role': part['role'], 'vertices':len(data['positions']), **result}
    rows.append(row)
    print('ORAL_PART_INTERSECTION',part['object'],len(result['intersections']),'crossings',len(result['point_contacts']),'contacts',flush=True)
(ROOT/'reports/recovered-oral-intersection-audit.json').write_text(json.dumps(rows,indent=2))
print('RECOVERED_ORAL_INTERSECTIONS_AUDITED',sum(not row['ok'] for row in rows),'failed_parts',flush=True)
