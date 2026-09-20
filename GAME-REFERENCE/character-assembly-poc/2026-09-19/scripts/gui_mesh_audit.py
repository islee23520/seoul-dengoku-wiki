# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Full topology inspection; intentional openings must be named, not ignored."""
import json
import math
import sys
from pathlib import Path
import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components

rows = []
for obj in bpy.context.scene.objects:
    if obj.type != 'MESH':
        continue
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    groups = []
    for edges in boundary_groups(bm):
        verts = {v for e in edges for v in e.verts}
        groups.append({'edges': len(edges), 'simple': all(sum(e in edges for e in v.link_edges) == 2 for v in verts), 'min': [min(v.co[a] for v in verts) for a in range(3)], 'max': [max(v.co[a] for v in verts) for a in range(3)]})
    rows.append({'name': obj.name, 'vertices': len(bm.verts), 'faces': len(bm.faces), 'empty': not bm.verts or not bm.faces, 'finite': all(math.isfinite(c) for v in bm.verts for c in v.co), 'loose_vertices': sum(not v.link_faces for v in bm.verts), 'wire_edges': sum(e.is_wire for e in bm.edges), 'degenerate_faces': sum(f.calc_area() < 1e-12 for f in bm.faces), 'boundary_groups': groups, 'junctions': sum(len(e.link_faces) > 2 for e in bm.edges), 'winding_errors': sum(e.is_manifold and not e.is_contiguous for e in bm.edges), 'components': len(components(bm)), 'signed_volume': bm.calc_volume(signed=True), 'quads': sum(len(f.verts) == 4 for f in bm.faces), 'ngons': sum(len(f.verts) > 4 for f in bm.faces)})
    bm.free()
(ROOT / 'reports/gui-topology-audit.json').write_text(json.dumps(rows, indent=2))
print('AUDIT_COMPLETE', len(rows), flush=True)
