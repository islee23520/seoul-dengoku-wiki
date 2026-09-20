# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Normalize only the neck's density-transition band on a new trial copy."""
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import select_only
from quad_neck import ordered_ring
from quad_transition import aligned_parameters, connect_reduction, sample_loop


def regular_contour(points: list[Vector]) -> list[Vector]:
    """Remove local contour zigzags, preserving width/depth and average height."""
    low = Vector(tuple(min(p[a] for p in points) for a in range(3)))
    high = Vector(tuple(max(p[a] for p in points) for a in range(3)))
    center = (low + high) / 2
    rx, ry = (high.x - low.x) / 2, (high.y - low.y) / 2
    front_z = sum(p.z for p in points if p.y < center.y - ry * 0.65) / sum(p.y < center.y - ry * 0.65 for p in points)
    back_z = sum(p.z for p in points if p.y > center.y + ry * 0.65) / sum(p.y > center.y + ry * 0.65 for p in points)
    return [Vector((center.x + rx * math.sin(2 * math.pi * i / len(points)), center.y - ry * math.cos(2 * math.pi * i / len(points)), front_z + (back_z - front_z) * (1 - math.cos(2 * math.pi * i / len(points))) / 2)) for i in range(len(points))]


scene = bpy.data.scenes.new('Local_Density_Trial_Not_Final')
bpy.context.window.scene = scene
report = []
for gender, counts in [('Male', [64, 56, 48, 42]), ('Female', [56, 48, 42, 36])]:
    source = bpy.data.objects[gender + '_Neck_Transition_Trial']
    obj = source.copy()
    obj.data = source.data.copy()
    obj.name = gender + '_Local_Density_Trial'
    scene.collection.objects.link(obj)
    obj.hide_set(False)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    endpoint = bm.verts.layers.int['NeckEndpoint']
    patch = bm.faces.layers.int['DensityTransition']
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f[patch]], context='FACES_ONLY')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    rings = [ordered_ring([e for e in bm.edges if e.is_boundary and all(v[endpoint] == marker for v in e.verts)]) for marker in [1, 2]]
    assert [len(r) for r in rings] == [counts[0], counts[-1]]
    moved = []
    for ring in rings:
        ideal = regular_contour([v.co.copy() for v in ring])
        for vertex, point in zip(ring, ideal):
            moved.append((vertex.co - point).length)
            vertex.co = point
    high, low = [[v.co.copy() for v in ring] for ring in rings]
    high_samples, low_samples = sample_loop(high, 4096), sample_loop(low, 4096)
    def surface(parameters: list[float], t: float) -> list[Vector]:
        return [high_samples[round(p * 4096) % 4096].lerp(low_samples[round(p * 4096) % 4096], t) for p in parameters]
    faces = []
    previous = rings[0]
    for index, count in enumerate(counts[1:]):
        transition_t = (index + 0.55) / 3
        settle_t = (index + 0.95) / 3
        params = aligned_parameters(len(previous), count)
        transition = [bm.verts.new(p) for p in surface(params, transition_t)]
        faces.extend(connect_reduction(bm, previous, transition))
        regular = [bm.verts.new(p) for p in surface([i / count for i in range(count)], settle_t)]
        faces.extend(connect_reduction(bm, transition, regular))
        previous = regular
    faces.extend(connect_reduction(bm, previous, rings[1]))
    for face in faces:
        face[patch] = 1
    # Relax the neighboring source rows, not the high-detail face or entire body.
    boundary = set(rings[0] + rings[1])
    region = set(boundary)
    for step in range(3):
        region.update(e.other_vert(v) for v in list(region) for e in v.link_edges)
    free = [v for v in region if v not in boundary]
    for iteration in range(5):
        bmesh.ops.smooth_vert(bm, verts=free, factor=0.18, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    assert all(len(f.verts) == 4 for f in faces)
    assert not any(e.is_boundary or len(e.link_faces) > 2 for f in faces for e in f.edges)
    report.append({'gender': gender, 'count_sequence': counts, 'patch_quads': len(faces), 'max_boundary_displacement_m': max(moved), 'status': 'VISUAL_REVIEW_REQUIRED'})
    bm.to_mesh(obj.data)
    bm.free()
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.data.normals_split_custom_set([(0, 0, 0)] * len(obj.data.loops))
(ROOT / 'reports/local-density-trial.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/local-density-trial.blend'))
print('LOCAL_DENSITY_TRIAL_CREATED', flush=True)
