# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Inspect gum face fans around junctions without filling tooth sockets."""
import json
import sys
from pathlib import Path

import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import components

with bpy.data.libraries.load(str(ROOT / 'work/oral-separated-verified.blend'), link=False) as (source, target):
    target.objects = [name for name in source.objects if name.startswith('Male_') and 'Gum' in name]
rows = []
for obj in target.objects:
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    main = set(components(bm)[0])
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v not in main], context='VERTS')
    bm.verts.index_update()
    bm.faces.index_update()
    bm.normal_update()
    fans = []
    for edge in bm.edges:
        if len(edge.link_faces) <= 2:
            continue
        faces = []
        for face in edge.link_faces:
            faces.append({'id': face.index, 'vertices': [v.index for v in face.verts], 'positions': [list(v.co) for v in face.verts], 'area': face.calc_area(), 'normal': list(face.normal), 'edge_face_counts': [len(e.link_faces) for e in face.edges]})
        fans.append({'edge': [v.index for v in edge.verts], 'center': list((edge.verts[0].co + edge.verts[1].co)/2), 'faces': faces})
    rows.append({'name': obj.name, 'junctions': fans})
    bm.free()
(ROOT / 'reports/gum-junction-fans.json').write_text(json.dumps(rows, indent=2))
print('GUM_JUNCTION_FANS_READY', flush=True)
