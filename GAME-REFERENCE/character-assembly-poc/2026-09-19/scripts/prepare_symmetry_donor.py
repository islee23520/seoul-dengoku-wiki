# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Remove proven detached debris and audit the actual seam's semantic vertex group."""
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import components, boundary_groups

with bpy.data.libraries.load(str(ROOT / 'work/all-quad-patches-review.blend'), link=False) as (source, target):
    target.objects = ['Male_Quad_Repair_Review']
obj = target.objects[0]
obj.name = 'Male_Symmetry_Donor_Audit'
scene = bpy.data.scenes.new('Symmetry_Donor_Audit')
scene.collection.objects.link(obj)
if bpy.context.window:
    bpy.context.window.scene = scene
bm = bmesh.new()
bm.from_mesh(obj.data)
bm.verts.ensure_lookup_table()
parts = components(bm)
debris = parts[1:]
assert sorted(len(p) for p in debris) == [4, 4, 10, 10, 10, 10]
assert all(abs(v.co.x) > .8 for part in debris for v in part)
removed = [{'vertices': len(part), 'faces': len({f for v in part for f in v.link_faces}), 'min': [min(v.co[a] for v in part) for a in range(3)], 'max': [max(v.co[a] for v in part) for a in range(3)]} for part in debris]
bmesh.ops.delete(bm, geom=[v for part in debris for v in part], context='VERTS')
bm.verts.index_update()
bm.normal_update()
deform = bm.verts.layers.deform.active
assert deform is not None
seam_group = obj.vertex_groups['SeamRelax_Only'].index
seam = {v for v in bm.verts if v[deform].get(seam_group, 0) > 0}
assert 650 < len(seam) < 750
eyes = [g for g in boundary_groups(bm) if len(g) == 47 and min(v.co.z for e in g for v in e.verts) > 1.65]
assert len(eyes) == 2
eye_edges = {e for group in eyes for e in group}
sides = {}
for sign, label in [(-1, 'negative_x'), (1, 'positive_x')]:
    vertices = {v for v in bm.verts if sign * v.co.x > .0005}
    edges = [e for e in bm.edges if all(v in vertices for v in e.verts)]
    faces = [f for f in bm.faces if all(v in vertices for v in f.verts)]
    keys = [tuple(sorted(v.index for v in f.verts)) for f in faces]
    seam_edges = [e for e in edges if e.is_manifold and all(v in seam for v in e.verts)]
    seam_angles = np.array([math.degrees(e.calc_face_angle()) for e in seam_edges])
    failures = {'unexpected_boundary': sum(e.is_boundary and e not in eye_edges for e in edges), 'junctions': sum(len(e.link_faces) > 2 for e in edges), 'winding': sum(e.is_manifold and not e.is_contiguous for e in edges), 'wire': sum(e.is_wire for e in edges), 'degenerate': sum(f.calc_area() < 1e-12 for f in faces), 'duplicates': len(keys) - len(set(keys))}
    side_seam = {v for v in seam if v in vertices}
    sides[label] = {'hard_failures': failures, 'structural_pass': not any(failures.values()), 'seam_vertices': len(side_seam), 'seam_edges': len(seam_edges), 'seam_angle': {'median': float(np.median(seam_angles)), 'p90': float(np.quantile(seam_angles, .9)), 'max': float(seam_angles.max()), 'over90': int((seam_angles > 90).sum())}, 'seam_valence_max': max(len(v.link_edges) for v in side_seam)}
assert len(components(bm)) == 1
assert all(metrics['structural_pass'] for metrics in sides.values())
bm.to_mesh(obj.data)
bm.free()
report = {'source': 'work/all-quad-patches-review.blend', 'removed_detached_debris': removed, 'source_half_vertex_positions_unchanged': True, 'remaining_connected_components': 1, 'seam_definition': 'SeamRelax_Only vertex group created from actual bridge and three neighbor rows', 'sides': sides, 'visual_review_pending': True, 'symmetry_not_applied': True}
(ROOT / 'reports/symmetry-donor-clean-audit.json').write_text(json.dumps(report, indent=2))
for layer in scene.view_layers:
    layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/symmetry-donor-clean-review.blend'))
print('SYMMETRY_DONOR_CLEAN_AUDIT_COMPLETE', flush=True)
