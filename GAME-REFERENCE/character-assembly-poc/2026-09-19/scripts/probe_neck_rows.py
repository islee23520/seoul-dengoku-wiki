# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Measure existing quad neck rows on copies without editing the GUI meshes."""
import json
import sys
from pathlib import Path
import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components

report = []
for gender in ['Male', 'Female']:
    for part in ['Head', 'Body']:
        obj = bpy.data.objects[f'{gender}_Study_{part}']
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bm.transform(obj.matrix_world)
        main = set(components(bm)[0])
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v not in main], context='VERTS')
        rows = []
        for depth in range(7):
            groups = boundary_groups(bm)
            if part == 'Head':
                ring = min((g for g in groups if len(g) > 20), key=lambda g: sum(v.co.z for e in g for v in e.verts) / (2 * len(g)))
            else:
                ring = max((g for g in groups if len(g) > 15), key=lambda g: sum(v.co.z for e in g for v in e.verts) / (2 * len(g)))
            verts = {v for e in ring for v in e.verts}
            rows.append({'depth': depth, 'count': len(verts), 'zmin': min(v.co.z for v in verts), 'zmax': max(v.co.z for v in verts), 'zmean': sum(v.co.z for v in verts) / len(verts), 'xwidth': max(v.co.x for v in verts) - min(v.co.x for v in verts), 'simple': all(sum(e in ring for e in v.link_edges) == 2 for v in verts)})
            faces = {f for e in ring for f in e.link_faces}
            bmesh.ops.delete(bm, geom=list(faces), context='FACES_ONLY')
            bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
        report.append({'gender': gender, 'part': part, 'rows': rows})
        bm.free()
(ROOT / 'reports/neck-row-probe.json').write_text(json.dumps(report, indent=2))
print('NECK_ROWS_MEASURED', flush=True)
