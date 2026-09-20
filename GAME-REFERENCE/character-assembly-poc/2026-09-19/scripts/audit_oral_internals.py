# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Per-component audit of separated oral geometry; no repair or source writes."""
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import components, boundary_groups

loaded = []
for filename, fragment in [('oral-separated-verified.blend', 'WithTeeth'), ('inner-mouth-partition-review-v2.blend', 'InnerMouth_PartitionReview')]:
    with bpy.data.libraries.load(str(ROOT / 'work' / filename), link=False) as (source, target):
        target.objects = [n for n in source.objects if fragment in n or (filename.startswith('oral-separated') and 'Tongue' in n)]
    loaded.extend(target.objects)
report = []
for obj in loaded:
    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.verts.ensure_lookup_table()
    bm.verts.index_update()
    records = []
    for index, vertices in enumerate(components(bm)):
        vertex_set = set(vertices)
        faces = {f for v in vertices for f in v.link_faces}
        edges = {e for v in vertices for e in v.link_edges}
        sub = bmesh.new()
        mapping = {v: sub.verts.new(v.co) for v in vertices}
        for face in faces:
            sub.faces.new([mapping[v] for v in face.verts])
        sub.normal_update()
        duplicate_faces = len(faces) - len({tuple(sorted(v.index for v in f.verts)) for f in faces})
        loops = []
        for group in boundary_groups(sub):
            points = {v for e in group for v in e.verts}
            loops.append({'edges': len(group), 'simple': all(sum(e in group for e in v.link_edges) == 2 for v in points), 'min': [min(v.co[a] for v in points) for a in range(3)], 'max': [max(v.co[a] for v in points) for a in range(3)]})
        records.append({'component': index, 'vertex_ids': [v.index for v in vertices], 'vertices': len(vertices), 'faces': len(faces), 'quads': sum(len(f.verts) == 4 for f in faces), 'triangles': sum(len(f.verts) == 3 for f in faces), 'boundary_edges': sum(e.is_boundary for e in edges), 'junction_edges': sum(len(e.link_faces) > 2 for e in edges), 'winding_errors': sum(e.is_manifold and not e.is_contiguous for e in edges), 'wire_edges': sum(e.is_wire for e in edges), 'loose_vertices': sum(not v.link_faces for v in vertices), 'degenerate_faces': sum(f.calc_area() <= 1e-12 for f in faces), 'duplicate_faces': duplicate_faces, 'surface_area': sum(f.calc_area() for f in faces), 'signed_volume': sub.calc_volume(signed=True), 'closed': all(e.is_manifold for e in edges), 'bounds': {'min': [min(v.co[a] for v in vertices) for a in range(3)], 'max': [max(v.co[a] for v in vertices) for a in range(3)]}, 'boundary_groups': loops})
        sub.free()
    uv_layers = []
    mesh.calc_loop_triangles()
    for layer in mesh.uv_layers:
        zero = 0
        for triangle in mesh.loop_triangles:
            a, b, c = [layer.data[i].uv for i in triangle.loops]
            zero += abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) < 2e-13
        uv_layers.append({'name': layer.name, 'finite': all(math.isfinite(c) for loop in layer.data for c in loop.uv), 'zero_area_triangles': zero})
    report.append({'object': obj.name, 'vertices': len(mesh.vertices), 'faces': len(mesh.polygons), 'components': records, 'uv': uv_layers, 'empty': not len(mesh.vertices) or not len(mesh.polygons), 'status': 'RAW_SEPARATED_NOT_REPAIRED'})
    bm.free()
(ROOT / 'reports/oral-internal-audit-before.json').write_text(json.dumps(report, indent=2))
print('ORAL_INTERNAL_AUDIT_COMPLETE', len(report), flush=True)
