# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Compare source row matching plus native Simple subdivision on a male copy."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components, select_only
from quad_neck import ordered_ring

scene = bpy.data.scenes.new('Matched_Density_Comparison_Not_Final')
bpy.context.window.scene = scene
copies = []
for part, rows in [('Head', 3), ('Body', 1)]:
    source = bpy.data.objects['Male_Study_' + part]
    obj = source.copy()
    obj.data = source.data.copy()
    obj.name = 'Matched_Male_' + part
    obj.data.transform(source.matrix_basis.copy())
    obj.matrix_world = Matrix.Identity(4)
    scene.collection.objects.link(obj)
    obj.hide_set(False)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    main = set(components(bm)[0])
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v not in main], context='VERTS')
    for depth in range(rows):
        groups = [g for g in boundary_groups(bm) if len(g) > 20]
        average_z = lambda g: sum(v.co.z for e in g for v in e.verts) / (2 * len(g))
        ring = min(groups, key=average_z) if part == 'Head' else max(groups, key=average_z)
        bmesh.ops.delete(bm, geom=list({f for e in ring for f in e.link_faces}), context='FACES_ONLY')
        bmesh.ops.delete(bm, geom=[e for e in bm.edges if not e.link_faces], context='EDGES')
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    if part == 'Body':
        # Shorten the overlapping body-neck stump, blending into existing neck rows.
        top = max(v.co.z for v in bm.verts)
        for v in bm.verts:
            if abs(v.co.x + 1.05) < 0.085 and v.co.z > top - 0.09:
                weight = min(1.0, max(0.0, (v.co.z - (top - 0.09)) / 0.055))
                v.co.z -= 0.035 * weight
    bm.to_mesh(obj.data)
    bm.free()
    if part == 'Body':
        select_only(obj)
        modifier = obj.modifiers.new('Source_Density_Match', 'SUBSURF')
        modifier.subdivision_type = 'SIMPLE'
        modifier.levels = 1
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    endpoint = bm.verts.layers.int.new('MatchedEndpoint')
    groups = [g for g in boundary_groups(bm) if len(g) > 40]
    average_z = lambda g: sum(v.co.z for e in g for v in e.verts) / (2 * len(g))
    edges = min(groups, key=average_z) if part == 'Head' else max(groups, key=average_z)
    ring = ordered_ring(edges)
    assert len(ring) == 64, (part, len(ring))
    for vertex in ring:
        vertex[endpoint] = 1 if part == 'Head' else 2
    bm.to_mesh(obj.data)
    bm.free()
    copies.append(obj)
head, body = copies
select_only(body)
head.select_set(True)
bpy.ops.object.join()
body.name = 'Male_Matched_Density_Trial'
bm = bmesh.new()
bm.from_mesh(body.data)
patch = bm.faces.layers.int.new('MatchedNeckPatch')
endpoint = bm.verts.layers.int['MatchedEndpoint']
upper, lower = [ordered_ring([e for e in bm.edges if e.is_boundary and all(v[endpoint] == marker for v in e.verts)]) for marker in [1, 2]]
offset = min(range(64), key=lambda k: sum((upper[i].co - lower[(i + k) % 64].co).length_squared for i in range(64)))
lower = lower[offset:] + lower[:offset]
minimum_gap = min(a.co.z - b.co.z for a, b in zip(upper, lower))
assert minimum_gap > 0.01, minimum_gap
rows = [upper]
for row in range(1, 6):
    t = row / 6
    rows.append([bm.verts.new(a.co.lerp(b.co, t)) for a, b in zip(upper, lower)])
rows.append(lower)
faces = []
for a, b in zip(rows, rows[1:]):
    for i in range(64):
        face = bm.faces.new((a[i], a[(i + 1) % 64], b[(i + 1) % 64], b[i]))
        face[patch] = 1
        faces.append(face)
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
report = {'head_ring_count': len(upper), 'body_ring_count': len(lower), 'native_body_subdivision': 'SIMPLE x1', 'neck_quads': len(faces), 'minimum_z_clearance_m': minimum_gap, 'patch_winding_errors': sum(e.is_manifold and not e.is_contiguous for e in {e for f in faces for e in f.edges}), 'patch_open_edges': sum(e.is_boundary for e in {e for f in faces for e in f.edges}), 'head_size_unchanged': True, 'status': 'VISUAL_COMPARISON_NOT_APPROVED'}
bm.to_mesh(body.data)
bm.free()
for polygon in body.data.polygons:
    polygon.use_smooth = True
body.data.normals_split_custom_set([(0, 0, 0)] * len(body.data.loops))
(ROOT / 'reports/matched-density-trial.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/matched-density-trial.blend'))
print('MATCHED_DENSITY_TRIAL_CREATED', flush=True)
