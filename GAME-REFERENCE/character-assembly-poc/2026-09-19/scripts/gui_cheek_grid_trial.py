# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Rebuild one damaged cheek patch with native quad Grid Fill and source projection."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, select_only

source = bpy.data.objects['Male_Logical_Weld_Repair']
scene = bpy.data.scenes.new('Cheek_Grid_Repair_Trial')
bpy.context.window.scene = scene
obj = source.copy()
obj.data = source.data.copy()
obj.name = 'Male_Cheek_Grid_Repair'
scene.collection.objects.link(obj)
obj.hide_set(False)
bm = bmesh.new()
bm.from_mesh(obj.data)
reference = BVHTree.FromBMesh(bm)
target = Vector((-0.062663, -0.067749, 1.636329))
def nearest_group() -> list[bmesh.types.BMEdge]:
    return min(boundary_groups(bm), key=lambda group: ((sum((v.co for e in group for v in e.verts), Vector()) / (2 * len(group))) - target).length_squared)
group = nearest_group()
faces = {f for e in group for v in e.verts for f in v.link_faces}
deleted = len(faces)
bmesh.ops.delete(bm, geom=list(faces), context='FACES_ONLY')
bmesh.ops.delete(bm, geom=[e for e in bm.edges if not e.link_faces], context='EDGES')
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
group = nearest_group()
if len(group) % 2:
    adjacent = {f for e in group for f in e.link_faces if len(f.verts) == 3}
    assert len(adjacent) == 1
    deleted += 1
    bmesh.ops.delete(bm, geom=list(adjacent), context='FACES_ONLY')
    bmesh.ops.delete(bm, geom=[e for e in bm.edges if not e.link_faces], context='EDGES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
group = nearest_group()
assert len(group) == 14
for face in bm.faces:
    face.select = False
for edge in bm.edges:
    edge.select = False
for vertex in bm.verts:
    vertex.select = False
for edge in group:
    edge.select_set(True)
bm.to_mesh(obj.data)
bm.free()
before_vertices = len(obj.data.vertices)
select_only(obj)
bpy.context.tool_settings.mesh_select_mode = (False, True, False)
bpy.ops.object.mode_set(mode='EDIT')
status = bpy.ops.mesh.fill_grid(span=3, offset=0, use_interp_simple=False)
assert status == {'FINISHED'}
bpy.ops.object.mode_set(mode='OBJECT')
# Restore local curvature to the preserved source surface, only on new grid vertices.
projected = 0
for vertex in list(obj.data.vertices)[before_vertices:]:
    location, normal, index, distance = reference.find_nearest(vertex.co)
    assert location is not None and distance < 0.01
    vertex.co = location
    projected += 1
obj.data.update()
bm = bmesh.new()
bm.from_mesh(obj.data)
selected = [f for f in bm.faces if f.select]
assert selected and all(len(f.verts) == 4 for f in selected)
bad = sum(e.is_manifold and not e.is_contiguous for f in selected for e in f.edges)
if bad:
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
report = {'deleted_corrupt_faces': deleted, 'quad_patch_faces': len(selected), 'all_patch_quads': True, 'projected_new_vertices': projected, 'patch_open_edges': sum(e.is_boundary for f in selected for e in f.edges), 'patch_winding_errors': sum(e.is_manifold and not e.is_contiguous for f in selected for e in f.edges), 'method': 'native Grid Fill span3 offset0; preserved-source projection', 'status': 'VISUAL_REVIEW_REQUIRED'}
bm.to_mesh(obj.data)
bm.free()
for face in obj.data.polygons:
    face.use_smooth = True
obj.data.normals_split_custom_set([(0, 0, 0)] * len(obj.data.loops))
(ROOT / 'reports/cheek-grid-trial.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/cheek-grid-trial.blend'))
print('CHEEK_GRID_TRIAL_CREATED', flush=True)
