# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Read-only comparable half audits; report rankings without assuming either donor."""
import hashlib
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils.kdtree import KDTree

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups

# Current study's measured neck/head region. These are scene coordinates, not
# universal human thresholds. No surface is changed by this audit.
CASES = [
    ('user-sculpt', 'work/user-left-sculpt-preserved.blend', 'Male_Protected_Body_Neck_Trial'),
    ('structure-repaired', 'work/all-quad-patches-review.blend', 'Male_Quad_Repair_Review'),
]
reports = []
for label, relative, name in CASES:
    path = ROOT / relative
    with bpy.data.libraries.load(str(path), link=False) as (source, target):
        assert name in source.objects
        target.objects = [name]
    obj = target.objects[0]
    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.verts.ensure_lookup_table()
    bm.verts.index_update()
    bm.normal_update()
    center = (min(v.co.x for v in bm.verts) + max(v.co.x for v in bm.verts)) / 2
    sides = {}
    expected_eye_counts = []
    eye_edges = set()
    for group in boundary_groups(bm):
        vertices = {v for edge in group for v in edge.verts}
        if len(group) == 47 and min(v.co.z for v in vertices) > 1.65 and max(v.co.z for v in vertices) < 1.76:
            eye_edges.update(group)
            expected_eye_counts.append(len(group))
    assert sorted(expected_eye_counts) == [47, 47], (label, 'eye definition no longer matches')
    kd = KDTree(len(bm.verts))
    for vertex in bm.verts:
        kd.insert(vertex.co, vertex.index)
    kd.balance()
    symmetry_errors = []
    for vertex in bm.verts:
        mirrored = vertex.co.copy()
        mirrored.x = 2 * center - mirrored.x
        symmetry_errors.append(kd.find(mirrored)[2])
    for sign, side in [(-1, 'negative_x'), (1, 'positive_x')]:
        vertex_set = {v for v in bm.verts if sign * (v.co.x - center) > .0005}
        edges = [e for e in bm.edges if all(v in vertex_set for v in e.verts)]
        faces = [f for f in bm.faces if all(v in vertex_set for v in f.verts)]
        neck = [e for e in edges if e.is_manifold and all(1.50 < v.co.z < 1.63 and abs(v.co.x - center) < .09 for v in e.verts)]
        head = [e for e in edges if all(v.co.z > 1.63 for v in e.verts)]
        angles = sorted(math.degrees(e.calc_face_angle()) for e in neck)
        malformed = {
            'unexpected_boundary_edges': sum(e.is_boundary and e not in eye_edges for e in edges),
            'junction_edges': sum(len(e.link_faces) > 2 for e in edges),
            'winding_errors': sum(e.is_manifold and not e.is_contiguous for e in edges),
            'wire_edges': sum(e.is_wire for e in edges),
            'loose_vertices': sum(not v.link_faces for v in vertex_set),
            'degenerate_faces': sum(f.calc_area() < 1e-12 for f in faces),
        }
        face_ids = [tuple(sorted(v.index for v in f.verts)) for f in faces]
        malformed['duplicate_faces'] = len(face_ids) - len(set(face_ids))
        head_defects = {'unexpected_boundaries': sum(e.is_boundary and e not in eye_edges for e in head), 'junctions': sum(len(e.link_faces) > 2 for e in head), 'winding': sum(e.is_manifold and not e.is_contiguous for e in head)}
        patch_layer = bm.faces.layers.int.get('VerifiedQuadRepair')
        patch_faces = [f for f in faces if patch_layer and f[patch_layer]]
        valences = [len(v.link_edges) for v in vertex_set if 1.50 < v.co.z < 1.63 and abs(v.co.x-center) < .09]
        sides[side] = {
            'vertices': len(vertex_set), 'faces': len(faces), 'hard_failures': malformed,
            'structural_pass': not any(malformed.values()), 'head_failures': head_defects,
            'neck_edges': len(angles), 'neck_angle_degrees': {'median': float(np.median(angles)), 'p90': float(np.quantile(angles, .9)), 'max': max(angles), 'over90_count': sum(a > 90 for a in angles)},
            'neck_vertex_valence': {'max': max(valences), 'over6_count': sum(v > 6 for v in valences)},
            'repair_faces': len(patch_faces), 'repair_nonquads': sum(len(f.verts) != 4 for f in patch_faces),
        }
    # Ranking is not acceptance; avoid a weighted sum that can hide hard failures.
    eligible = [side for side, metrics in sides.items() if metrics['structural_pass']]
    if not eligible:
        route = 'REPAIR_BEFORE_ANY_HALF_REPLACEMENT'
        preferred = None
    else:
        def neck_vector(side):
            m = sides[side]['neck_angle_degrees']
            return (m['over90_count'], m['p90'], m['median'])
        preferred = min(eligible, key=neck_vector)
        route = 'SYMMETRY_CANDIDATE_REQUIRES_SHAPE_REVIEW'
    reports.append({'candidate': label, 'file': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'object': name, 'center_x': center, 'world_origin': list(obj.matrix_world.translation), 'symmetry_allowed_by_owner_for_this_undecorated_base': True, 'intentional_asymmetry_review': 'No asymmetric adornments; owner explicitly permits base symmetry. Preserve originals.', 'nearest_reflected_vertex_error': {'median': float(np.median(symmetry_errors)), 'p95': float(np.quantile(symmetry_errors, .95)), 'max': max(symmetry_errors), 'not_a_connectivity_equivalence_test': True}, 'sides': sides, 'route': route, 'provisional_neck_preference': preferred, 'visual_flow_approval': False, 'final_goal_pass': False, 'geometry_changed': False})
    bm.free()
    bpy.data.objects.remove(obj, do_unlink=True)
    if mesh.users == 0:
        bpy.data.meshes.remove(mesh)
(ROOT / 'reports/bilateral-candidate-audit.json').write_text(json.dumps(reports, indent=2))
print('BILATERAL_CANDIDATE_AUDIT_COMPLETE', flush=True)
