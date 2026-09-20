# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Reflect the audited negative-X donor on an isolated copy and verify invariants."""
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

audit = json.loads((ROOT / 'reports/symmetry-donor-clean-audit.json').read_text())
assert all(side['structural_pass'] for side in audit['sides'].values())
negative, positive = [audit['sides'][key]['seam_angle'] for key in ['negative_x', 'positive_x']]
assert all(negative[key] < positive[key] for key in ['median', 'p90', 'max'])
assert bpy.app.background, 'Only isolated working copies may run this operation'
with bpy.data.libraries.load(str(ROOT / 'work/symmetry-donor-clean-review.blend'), link=False) as (source, target):
    target.objects = ['Male_Symmetry_Donor_Audit']
obj = target.objects[0]
scene = bpy.data.scenes.new('Male_Base_Symmetry_Review')
scene.collection.objects.link(obj)
bpy.context.window.scene = scene
obj.name = 'Male_Base_Symmetric'
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
epsilon = 1e-6
before_coordinates = [v.co.copy() for v in obj.data.vertices if v.co.x < -epsilon]
before_faces = Counter(tuple(sorted(tuple(obj.data.vertices[i].co) for i in poly.vertices)) for poly in obj.data.polygons if all(obj.data.vertices[i].co.x < -epsilon for i in poly.vertices))
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
status = bpy.ops.mesh.symmetrize(direction='NEGATIVE_X', threshold=epsilon)
assert status == {'FINISHED'}
bpy.ops.object.mode_set(mode='OBJECT')
obj.data.update()
tree = KDTree(len(obj.data.vertices))
for vertex in obj.data.vertices:
    tree.insert(vertex.co, vertex.index)
tree.balance()
donor_error = max(tree.find(point)[2] for point in before_coordinates)
assert donor_error < 1e-8, donor_error
after_faces = Counter(tuple(sorted(tuple(obj.data.vertices[i].co) for i in poly.vertices)) for poly in obj.data.polygons if all(obj.data.vertices[i].co.x < -epsilon for i in poly.vertices))
assert before_faces == after_faces, 'Donor-side connectivity changed'
symmetry_error = max(tree.find(Vector((-v.co.x, v.co.y, v.co.z)))[2] for v in obj.data.vertices)
assert symmetry_error < 1e-7, symmetry_error
bm = bmesh.new()
bm.from_mesh(obj.data)
bm.verts.index_update()
bm.normal_update()
groups = boundary_groups(bm)
assert sorted(len(group) for group in groups) == [47, 47]
assert all(min(v.co.z for e in group for v in e.verts) > 1.65 for group in groups)
face_keys = [tuple(sorted(v.index for v in face.verts)) for face in bm.faces]
assert len(face_keys) == len(set(face_keys)), 'Duplicate faces after symmetry'
assert len(components(bm)) == 1
assert not any(e.is_wire or len(e.link_faces) > 2 for e in bm.edges)
assert not any(e.is_manifold and not e.is_contiguous for e in bm.edges)
assert not any(face.calc_area() <= 1e-12 for face in bm.faces)
center_edges = [e for e in bm.edges if all(abs(v.co.x) < epsilon for v in e.verts)]
assert center_edges and all(e.is_manifold for e in center_edges), 'Unwelded center seam'
report = {'source': 'work/symmetry-donor-clean-review.blend', 'donor': 'negative_x', 'reason': 'Both structural gates pass; lower median/p90/max seam dihedral and better cheek/neck multiview shape', 'visual_evidence': 'evidence/bilateral-donor-world-corrected', 'eligible_case': 'Owner-authorized undecorated symmetric base', 'operation': 'native mesh.symmetrize NEGATIVE_X', 'weld_threshold_m': epsilon, 'donor_vertex_max_change_m': donor_error, 'donor_face_connectivity_preserved': True, 'reflected_coordinate_error_m': symmetry_error, 'vertices': len(bm.verts), 'faces': len(bm.faces), 'quads': sum(len(f.verts) == 4 for f in bm.faces), 'triangles': sum(len(f.verts) == 3 for f in bm.faces), 'ngons': sum(len(f.verts) > 4 for f in bm.faces), 'center_edges': len(center_edges), 'center_all_manifold': True, 'eye_boundary_sizes': [len(g) for g in groups], 'connected_components': 1, 'duplicate_faces': 0, 'unexpected_boundaries': 0, 'winding_errors': 0, 'degenerate_faces': 0, 'signed_volume': bm.calc_volume(signed=True), 'uv_status': 'Mirrored SourceUV preserved for transfer only; nonoverlapping atlas required next', 'status': 'STRUCTURE_PASS_POST_SYMMETRY_VISUAL_REVIEW_REQUIRED'}
bm.free()
obj['symmetry_donor'] = 'negative_x'
obj['source_side_locked'] = True
obj['uv_requires_reunwrap'] = True
obj.data.normals_split_custom_set([(0, 0, 0)] * len(obj.data.loops))
for layer in scene.view_layers:
    layer.update()
bpy.ops.file.pack_all()
output = ROOT / 'work/male-base-symmetric-review.blend'
assert not output.exists()
bpy.ops.wm.save_as_mainfile(filepath=str(output))
(ROOT / 'reports/male-symmetry-verification.json').write_text(json.dumps(report, indent=2))
print('SELECTED_SYMMETRY_STRUCTURAL_PASS', flush=True)
