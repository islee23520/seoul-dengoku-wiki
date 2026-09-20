# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Locate duplicate faces and folded seam neighborhoods without editing candidates."""
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import components

name = 'Male_Quad_Repair_Review'
with bpy.data.libraries.load(str(ROOT / 'work/all-quad-patches-review.blend'), link=False) as (source, target):
    target.objects = [name]
obj = target.objects[0]
bm = bmesh.new()
bm.from_mesh(obj.data)
bm.verts.ensure_lookup_table()
bm.verts.index_update()
bm.faces.ensure_lookup_table()
bm.faces.index_update()
bm.normal_update()
parts = components(bm)
component_map = {v: index for index, part in enumerate(parts) for v in part}
seen = {}
duplicates = []
for face in bm.faces:
    key = tuple(sorted(v.index for v in face.verts))
    if key in seen:
        prior = seen[key]
        component = component_map[face.verts[0]]
        duplicates.append({'face_ids': [prior.index, face.index], 'component': component, 'component_vertex_count': len(parts[component]), 'vertices': [{'index': v.index, 'position': list(v.co), 'valence': len(v.link_edges)} for v in face.verts], 'areas': [prior.calc_area(), face.calc_area()], 'normal_dot': prior.normal.dot(face.normal), 'linked_edge_face_counts': [len(e.link_faces) for e in face.edges]})
    else:
        seen[key] = face
folds = []
for edge in bm.edges:
    if not edge.is_manifold or not all(1.50 < v.co.z < 1.63 and abs(v.co.x) < .09 for v in edge.verts):
        continue
    angle = math.degrees(edge.calc_face_angle())
    if angle > 60:
        folds.append({'angle': angle, 'center': list((edge.verts[0].co + edge.verts[1].co) / 2), 'vertices': [v.index for v in edge.verts], 'face_ids': [f.index for f in edge.link_faces], 'faces': [[list(v.co) for v in f.verts] for f in edge.link_faces], 'quads': all(len(f.verts) == 4 for f in edge.link_faces)})
report = {'source': str(ROOT / 'work/all-quad-patches-review.blend'), 'geometry_modified': False, 'component_sizes': [len(part) for part in parts], 'duplicates': duplicates, 'neck_folds_over60': sorted(folds, key=lambda row: row['angle'], reverse=True)}
bm.free()
(ROOT / 'reports/bilateral-blockers.json').write_text(json.dumps(report, indent=2))
print('BILATERAL_BLOCKERS_LOCATED', len(duplicates), len(folds), flush=True)
