# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Locate nonquad center transitions without modifying the symmetric donor."""
import json
from collections import Counter
from pathlib import Path
import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]
obj = bpy.data.objects['Male_Base_Symmetric']
bm = bmesh.new()
bm.from_mesh(obj.data)
bm.faces.ensure_lookup_table()
bm.verts.ensure_lookup_table()
bm.normal_update()
rows = []
for face in bm.faces:
    if len(face.verts) > 4:
        rows.append({'face': face.index, 'count': len(face.verts), 'center': list(face.calc_center_median()), 'vertices': [{'index': v.index, 'coordinate': list(v.co), 'valence': len(v.link_edges)} for v in face.verts], 'center_plane_vertices': sum(abs(v.co.x) < 1e-6 for v in face.verts)})
report = {'ngon_count': len(rows), 'face_sizes': dict(Counter(len(f.verts) for f in bm.faces)), 'ngons': rows, 'source_modified': False}
(ROOT / 'reports/symmetry-center-audit.json').write_text(json.dumps(report, indent=2))
bm.free()
print('SYMMETRY_CENTER_AUDITED', len(rows), flush=True)
