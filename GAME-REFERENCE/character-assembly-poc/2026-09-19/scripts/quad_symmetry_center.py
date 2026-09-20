# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Replace mirrored center pentagon pairs with four quads, preserving all old coordinates."""
import json
import sys
from collections import Counter
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector
from mathutils.kdtree import KDTree

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components

obj = bpy.data.objects['Male_Base_Symmetric']
bm = bmesh.new()
bm.from_mesh(obj.data)
center_tag = bm.faces.layers.int.new('CenterQuadRepair')
uv = bm.loops.layers.uv.active
bm.verts.ensure_lookup_table()
original = {vertex: vertex.co.copy() for vertex in bm.verts}
baseline = {'vertices': len(bm.verts), 'faces': len(bm.faces), 'ngons': sum(len(f.verts) > 4 for f in bm.faces)}
assert baseline['ngons'] == 48
pairs = []
for edge in bm.edges:
    if all(abs(v.co.x) < 1e-7 for v in edge.verts) and len(edge.link_faces) == 2 and all(len(f.verts) == 5 for f in edge.link_faces):
        pairs.append(edge)
assert len(pairs) == 24
records = []
for shared in pairs:
    faces = list(shared.link_faces)
    assert all(f.is_valid and len(f.verts) == 5 for f in faces)
    boundary = {edge for face in faces for edge in face.edges if edge != shared}
    start = min(shared.verts, key=lambda v: (v.co.z, v.co.y))
    ring = [start]
    previous = None
    current = start
    while True:
        candidates = [edge.other_vert(current) for edge in current.link_edges if edge in boundary and edge.other_vert(current) != previous]
        next_vertex = min(candidates, key=lambda v: v.co.x) if previous is None else candidates[0]
        if next_vertex == start:
            break
        ring.append(next_vertex)
        previous, current = current, next_vertex
    assert len(ring) == 8
    assert abs(ring[4].co.x) < 1e-7
    assert all(v.co.x < -1e-8 for v in ring[1:4]) and all(v.co.x > 1e-8 for v in ring[5:])
    left = min(faces, key=lambda f: f.calc_center_median().x)
    right = next(f for f in faces if f != left)
    side_uv = [{loop.vert: loop[uv].uv.copy() for loop in face.loops} for face in [left, right]]
    materials = [left.material_index, right.material_index]
    center_uv = [(mapping[ring[0]] + mapping[ring[4]]) / 2 for mapping in side_uv]
    area_before = sum(face.calc_area() for face in faces)
    bmesh.ops.delete(bm, geom=faces, context='FACES_ONLY')
    bm.edges.remove(shared)
    midpoint = bm.verts.new((ring[0].co + ring[4].co) / 2)
    midpoint.co.x = 0
    created = []
    for i in range(0, 8, 2):
        side = 0 if i < 4 else 1
        face = bm.faces.new((midpoint, ring[i], ring[(i + 1) % 8], ring[(i + 2) % 8]))
        face[center_tag] = 1
        face.material_index = materials[side]
        face.smooth = True
        for loop in face.loops:
            loop[uv].uv = center_uv[side] if loop.vert == midpoint else side_uv[side][loop.vert]
        created.append(face)
    assert all(face.calc_area() > 1e-12 for face in created)
    records.append({'center': list(midpoint.co), 'faces_before': 2, 'faces_after': 4, 'area_before': area_before, 'area_after': sum(f.calc_area() for f in created)})
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
assert max((vertex.co - before).length for vertex, before in original.items()) == 0
assert not any(len(face.verts) > 4 for face in bm.faces)
assert not any(edge.is_wire or len(edge.link_faces) > 2 or (edge.is_manifold and not edge.is_contiguous) for edge in bm.edges)
assert sorted(len(g) for g in boundary_groups(bm)) == [47, 47]
assert len(components(bm)) == 1
bm.verts.ensure_lookup_table()
bm.verts.index_update()
tree = KDTree(len(bm.verts))
for vertex in bm.verts:
    tree.insert(vertex.co, vertex.index)
tree.balance()
symmetry_error = max(tree.find(Vector((-v.co.x, v.co.y, v.co.z)))[2] for v in bm.verts)
assert symmetry_error < 1e-7
report = {'before': baseline, 'after': {'vertices': len(bm.verts), 'faces': len(bm.faces), 'face_sizes': dict(Counter(len(f.verts) for f in bm.faces)), 'winding_errors': 0, 'unexpected_boundaries': 0, 'connected_components': 1}, 'replaced_center_pairs': len(records), 'old_vertex_max_displacement_m': 0, 'symmetry_error_m': symmetry_error, 'repairs': records, 'status': 'CENTER_QUAD_STRUCTURE_PASS_VISUAL_REVIEW_REQUIRED'}
bm.to_mesh(obj.data)
bm.free()
obj.data.normals_split_custom_set([(0, 0, 0)] * len(obj.data.loops))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/male-base-symmetric-center-quads.blend'))
(ROOT / 'reports/male-center-quad-verification.json').write_text(json.dumps(report, indent=2))
print('CENTER_QUAD_REPAIR_PASS', flush=True)
