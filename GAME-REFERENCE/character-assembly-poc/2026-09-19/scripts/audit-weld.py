# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run: Blender --background work/audit/imported-sources.blend --python scripts/audit-weld.py
"""Measure weld repair on disposable source duplicates, retaining UV loops."""
import json
from pathlib import Path
import bmesh
import bpy

ROOT = Path('/Users/danny/Documents/Character-Assembly-POC/2026-09-19')
rows = []
for index in range(6):
    source = next(o for o in bpy.data.objects if o.name.startswith(f'SRC_{index:02d}_') and o.type == 'MESH')
    obj = source.copy()
    obj.data = source.data.copy()
    obj.name = f'WELDED_{index:02d}'
    bpy.context.scene.collection.objects.link(obj)
    obj.data.transform(source.matrix_world)
    obj.matrix_world.identity()
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    before = len(bm.verts)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=0.00001)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.verts.ensure_lookup_table()
    seen = set()
    parts = []
    for vertex in bm.verts:
        if vertex in seen:
            continue
        queue = [vertex]
        seen.add(vertex)
        part = []
        while queue:
            v = queue.pop()
            part.append(v)
            for edge in v.link_edges:
                other = edge.other_vert(v)
                if other not in seen:
                    seen.add(other)
                    queue.append(other)
        parts.append({'vertices': len(part), 'min': [min(v.co[a] for v in part) for a in range(3)], 'max': [max(v.co[a] for v in part) for a in range(3)]})
    rows.append({'index': index, 'before_vertices': before, 'vertices': len(bm.verts), 'faces': len(bm.faces), 'boundary': sum(e.is_boundary for e in bm.edges), 'nonmanifold': sum(not e.is_manifold for e in bm.edges), 'wire': sum(e.is_wire for e in bm.edges), 'components': sorted(parts, key=lambda p: p['vertices'], reverse=True), 'boundary_points': [list(e.verts[0].co) for e in bm.edges if e.is_boundary][:120]})
    bm.to_mesh(obj.data)
    bm.free()
    obj.hide_render = True
    obj.hide_set(True)
(ROOT / 'reports/weld-audit.json').write_text(json.dumps(rows, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/audit/welded-sources.blend'))
print('WELD_AUDIT_PASS', flush=True)
