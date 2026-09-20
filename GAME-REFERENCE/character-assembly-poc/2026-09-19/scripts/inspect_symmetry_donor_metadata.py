# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Locate semantic seam labels and detached components on the donor candidate."""
import json
import sys
from pathlib import Path

import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import components

with bpy.data.libraries.load(str(ROOT / 'work/all-quad-patches-review.blend'), link=False) as (source, target):
    target.objects = ['Male_Quad_Repair_Review']
obj = target.objects[0]
bm = bmesh.new()
bm.from_mesh(obj.data)
bm.verts.ensure_lookup_table()
bm.normal_update()
rows = []
for index, vertices in enumerate(components(bm)):
    faces = {f for v in vertices for f in v.link_faces}
    edges = {e for v in vertices for e in v.link_edges}
    rows.append({'index': index, 'vertices': len(vertices), 'faces': len(faces), 'area': sum(f.calc_area() for f in faces), 'bbox_min': [min(v.co[a] for v in vertices) for a in range(3)], 'bbox_max': [max(v.co[a] for v in vertices) for a in range(3)], 'boundaries': sum(e.is_boundary for e in edges)})
groups = []
for group in obj.vertex_groups:
    ids = [v.index for v in obj.data.vertices if any(g.group == group.index and g.weight > 0 for g in v.groups)]
    groups.append({'name': group.name, 'vertices': len(ids), 'min': [min(obj.data.vertices[i].co[a] for i in ids) for a in range(3)] if ids else [], 'max': [max(obj.data.vertices[i].co[a] for i in ids) for a in range(3)] if ids else []})
report = {'object': obj.name, 'attributes': [{'name': a.name, 'domain': a.domain, 'type': a.data_type} for a in obj.data.attributes], 'vertex_groups': groups, 'components': rows, 'selected_faces': sum(p.select for p in obj.data.polygons)}
(ROOT / 'reports/symmetry-donor-metadata.json').write_text(json.dumps(report, indent=2))
bm.free()
print('SYMMETRY_DONOR_METADATA_READY', flush=True)
