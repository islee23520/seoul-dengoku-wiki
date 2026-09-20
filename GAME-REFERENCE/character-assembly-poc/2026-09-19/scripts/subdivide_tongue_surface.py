# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Test one Catmull-Clark level on the repaired tongue with its attachment pinned."""
import hashlib
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components

assert bpy.app.background
obj = bpy.data.objects['Male_Tongue_Repaired']
mesh = obj.data
before = bmesh.new()
before.from_mesh(mesh)
before.verts.ensure_lookup_table()
before.normal_update()
before_tree = BVHTree.FromBMesh(before)
root_loops = boundary_groups(before)
assert len(root_loops) == 1 and len(root_loops[0]) == 24
root_ids = {v.index for edge in root_loops[0] for v in edge.verts}
root_points = [mesh.vertices[index].co.copy() for index in sorted(root_ids)]
root_segments = [(edge.verts[0].co.copy(), edge.verts[1].co.copy()) for edge in root_loops[0]]
all_before = np.array([tuple(v.co) for v in before.verts])
source_hash = hashlib.sha256(all_before.tobytes()).hexdigest()
area_before = sum(face.calc_area() for face in before.faces)
before_counts = {'vertices': len(before.verts), 'faces': len(before.faces), 'root_edges': len(root_loops[0])}
# Root is an attachment interface, not a cosmetic region. Pin its original
# vertices and edges using Blender's actual subdivision crease attributes.
edge_creases = mesh.attributes.get('crease_edge') or mesh.attributes.new('crease_edge', 'FLOAT', 'EDGE')
vertex_creases = mesh.attributes.get('crease_vert') or mesh.attributes.new('crease_vert', 'FLOAT', 'POINT')
for edge in mesh.edges:
    edge_creases.data[edge.index].value = 1 if all(index in root_ids for index in edge.vertices) else 0
for vertex in mesh.vertices:
    vertex_creases.data[vertex.index].value = 1 if vertex.index in root_ids else 0
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
modifier = obj.modifiers.new('Tongue_Curvature_Refinement', 'SUBSURF')
modifier.subdivision_type = 'CATMULL_CLARK'
modifier.levels = 1
modifier.render_levels = 1
modifier.uv_smooth = 'PRESERVE_BOUNDARIES'
assert bpy.ops.object.modifier_apply(modifier=modifier.name) == {'FINISHED'}
mesh = obj.data
if mesh.attributes.get('custom_normal'):
    mesh.attributes.remove(mesh.attributes['custom_normal'])
for polygon in mesh.polygons:
    polygon.use_smooth = True
mesh.update()
after = bmesh.new()
after.from_mesh(mesh)
after.verts.index_update()
after.normal_update()
after_tree = BVHTree.FromBMesh(after)
loops = boundary_groups(after)
assert len(loops) == 1 and len(loops[0]) == 48
assert len(components(after)) == 1
assert all(len(face.verts) == 4 for face in after.faces)
assert not any(edge.is_wire or len(edge.link_faces) > 2 or (edge.is_manifold and not edge.is_contiguous) for edge in after.edges)
assert not any(face.calc_area() <= 1e-12 for face in after.faces)
root_after = {v for edge in loops[0] for v in edge.verts}
root_original_vertex_error = max(min((v.co - point).length for v in root_after) for point in root_points)
def distance_to_segment(point, a, b):
    edge = b - a
    t = max(0, min(1, (point - a).dot(edge) / edge.length_squared))
    return (point - (a + edge * t)).length
root_polyline_error = max(min(distance_to_segment(v.co, a, b) for a, b in root_segments) for v in root_after)
assert root_original_vertex_error < 1e-7 and root_polyline_error < 1e-7
old_to_new = np.array([after_tree.find_nearest(v.co)[3] for v in before.verts])
new_to_old = np.array([before_tree.find_nearest(v.co)[3] for v in after.verts])
area_after = sum(face.calc_area() for face in after.faces)
after_positions = np.array([tuple(v.co) for v in after.verts])
report = {
    'source': 'work/male-tongue-symmetric-candidate.blend',
    'source_coordinate_hash': source_hash,
    'operation': 'Native Catmull-Clark level1; root vertices/edges fully creased',
    'before': before_counts,
    'after': {'vertices': len(after.verts), 'faces': len(after.faces), 'all_quads': True, 'root_edges': len(loops[0]), 'connected_components': 1, 'junctions': 0, 'winding_errors': 0, 'degenerate_faces': 0},
    'root_original_vertex_error': root_original_vertex_error,
    'root_polyline_error': root_polyline_error,
    'bidirectional_vertex_to_surface_distance': {'before_to_after_max': float(old_to_new.max()), 'after_to_before_max': float(new_to_old.max()), 'before_to_after_p95': float(np.quantile(old_to_new, .95)), 'after_to_before_p95': float(np.quantile(new_to_old, .95))},
    'surface_area_ratio': area_after / area_before,
    'bounds_max_change': float(np.max(abs(np.r_[after_positions.min(0) - all_before.min(0), after_positions.max(0) - all_before.max(0)]))),
    'unit_note': 'Original normalized head coordinates; not final meters',
    'normal_shadow_render_required': True,
    'status': 'CURVATURE_CANDIDATE_NOT_FINAL'
}
before.free()
after.free()
(ROOT / 'reports/tongue-subdivision-candidate.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/male-tongue-curvature-refined-review.blend'))
print('TONGUE_CURVATURE_CANDIDATE_SAVED', flush=True)
