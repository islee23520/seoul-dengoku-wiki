# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Native matched-density bridge with no displacement of the body surface."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components, select_only
from quad_neck import ordered_ring

scene = bpy.data.scenes.new('Protected_Body_Neck_Trial')
bpy.context.window.scene = scene
copies = []
for part, trim_rows in [('Head', 3), ('Body', 1)]:
    source = bpy.data.objects['Male_Study_' + part]
    obj = source.copy()
    obj.data = source.data.copy()
    obj.name = 'Protected_Male_' + part
    obj.data.transform(source.matrix_basis.copy())
    obj.matrix_world = Matrix.Identity(4)
    scene.collection.objects.link(obj)
    obj.hide_set(False)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    main = set(components(bm)[0])
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v not in main], context='VERTS')
    for depth in range(trim_rows):
        groups = [g for g in boundary_groups(bm) if len(g) > 20]
        height = lambda g: sum(v.co.z for e in g for v in e.verts) / (2 * len(g))
        ring = min(groups, key=height) if part == 'Head' else max(groups, key=height)
        bmesh.ops.delete(bm, geom=list({f for e in ring for f in e.link_faces}), context='FACES_ONLY')
        bmesh.ops.delete(bm, geom=[e for e in bm.edges if not e.link_faces], context='EDGES')
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bm.to_mesh(obj.data)
    bm.free()
    if part == 'Body':
        select_only(obj)
        modifier = obj.modifiers.new('Shape_Preserving_Density', 'SUBSURF')
        modifier.subdivision_type = 'SIMPLE'
        modifier.levels = 1
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    marker = bm.verts.layers.int.new('ProtectedEndpoint')
    groups = [g for g in boundary_groups(bm) if len(g) > 40]
    height = lambda g: sum(v.co.z for e in g for v in e.verts) / (2 * len(g))
    ring = ordered_ring(min(groups, key=height) if part == 'Head' else max(groups, key=height))
    assert len(ring) == 64
    for v in ring:
        v[marker] = 1 if part == 'Head' else 2
    bm.to_mesh(obj.data)
    bm.free()
    copies.append(obj)
head, body = copies
body_coordinates = [v.co.copy() for v in body.data.vertices]
select_only(body)
head.select_set(True)
bpy.ops.object.join()
body.name = 'Male_Protected_Body_Neck_Trial'
bm = bmesh.new()
bm.from_mesh(body.data)
marker = bm.verts.layers.int['ProtectedEndpoint']
upper, lower = [ordered_ring([e for e in bm.edges if e.is_boundary and all(v[marker] == value for v in e.verts)]) for value in [1, 2]]
offset = min(range(64), key=lambda k: sum((upper[i].co - lower[(i + k) % 64].co).length_squared for i in range(64)))
lower = lower[offset:] + lower[:offset]
# The existing head rim overlaps the intact body rim at the front. Correct only
# this discarded-neck border, never move the body/shoulder to make a gap.
adjustments = []
for a, b in zip(upper, lower):
    lift = max(0.0, b.co.z + 0.006 - a.co.z)
    adjustments.append(lift)
    a.co.z += lift
for face in bm.faces:
    face.select = False
for edge in bm.edges:
    edge.select = False
for vertex in bm.verts:
    vertex.select = False
for edge in bm.edges:
    if edge.is_boundary and all(v[marker] in (1, 2) for v in edge.verts):
        edge.select_set(True)
bm.to_mesh(body.data)
bm.free()
select_only(body)
bpy.context.tool_settings.mesh_select_mode = (False, True, False)
bpy.ops.object.mode_set(mode='EDIT')
status = bpy.ops.mesh.bridge_edge_loops(number_cuts=3, interpolation='SURFACE', smoothness=0.35)
assert status == {'FINISHED'}
bpy.ops.object.mode_set(mode='OBJECT')
max_body_delta = max((v.co - original).length for v, original in zip(body.data.vertices, body_coordinates))
assert max_body_delta == 0.0, max_body_delta
for polygon in body.data.polygons:
    polygon.use_smooth = True
body.data.normals_split_custom_set([(0, 0, 0)] * len(body.data.loops))
report = {'status': 'VISUAL_REVIEW_REQUIRED', 'body_max_vertex_displacement_m': max_body_delta, 'head_neck_border_max_lift_m': max(adjustments), 'source_neck_rows_removed': {'head': 3, 'body': 1}, 'matched_loop_count': 64, 'method': 'native Blend Surface; intact body coordinates'}
(ROOT / 'reports/protected-body-trial.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/protected-body-neck-trial.blend'))
print('PROTECTED_BODY_TRIAL_CREATED', flush=True)
