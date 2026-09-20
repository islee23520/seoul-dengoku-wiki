# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Build a reversible neck-only retopology trial from the accepted-size study."""
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
from quad_transition import aligned_parameters, connect_reduction, sample_loop

scene = bpy.data.scenes.new('Neck_Transition_Trial_Not_Final')
bpy.context.window.scene = scene
reports = []
for gender, head_rows, body_rows, counts in [('Male', 3, 4, [64, 56, 48, 42]), ('Female', 2, 3, [56, 48, 42, 36])]:
    objects = []
    original_rings = []
    for part, rows, marker in [('Head', head_rows, 1), ('Body', body_rows, 2)]:
        source = bpy.data.objects[f'{gender}_Study_{part}']
        assert source.parent is None
        obj = source.copy()
        obj.data = source.data.copy()
        obj.name = f'{gender}_Transition_{part}'
        obj.data.transform(source.matrix_basis.copy())
        obj.matrix_world = Matrix.Identity(4)
        scene.collection.objects.link(obj)
        obj.hide_set(False)
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        tag = bm.verts.layers.int.get('NeckEndpoint') or bm.verts.layers.int.new('NeckEndpoint')
        main = set(components(bm)[0])
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v not in main], context='VERTS')
        for depth in range(rows + 1):
            groups = boundary_groups(bm)
            eligible = [g for g in groups if len(g) > (20 if part == 'Head' else 15)]
            height = lambda g: sum(v.co.z for e in g for v in e.verts) / (2 * len(g))
            ring_edges = min(eligible, key=height) if part == 'Head' else max(eligible, key=height)
            if depth < rows:
                faces = {f for e in ring_edges for f in e.link_faces}
                bmesh.ops.delete(bm, geom=list(faces), context='FACES_ONLY')
                bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
        ring = ordered_ring(ring_edges)
        for v in ring:
            v[tag] = marker
        original_rings.append([v.co.copy() for v in ring])
        bm.to_mesh(obj.data)
        bm.free()
        objects.append(obj)
    head, body = objects
    select_only(body)
    head.select_set(True)
    bpy.ops.object.join()
    body.name = gender + '_Neck_Transition_Trial'
    bm = bmesh.new()
    bm.from_mesh(body.data)
    patch_tag = bm.faces.layers.int.new('DensityTransition')
    tag = bm.verts.layers.int['NeckEndpoint']
    upper = ordered_ring([e for e in bm.edges if e.is_boundary and all(v[tag] == 1 for v in e.verts)])
    lower = ordered_ring([e for e in bm.edges if e.is_boundary and all(v[tag] == 2 for v in e.verts)])
    assert [len(upper), len(lower)] == [counts[0], counts[-1]]
    high_points = [v.co.copy() for v in upper]
    low_points = [v.co.copy() for v in lower]
    def surface(parameters: list[float], t: float) -> list[Vector]:
        """Interpolate between preserved cut contours at corresponding arc positions."""
        samples = 4096
        hi = sample_loop(high_points, samples)
        lo = sample_loop(low_points, samples)
        return [hi[round(p * samples) % samples].lerp(lo[round(p * samples) % samples], t) for p in parameters]
    neck_faces = []
    previous = [bm.verts.new(p) for p in surface([i / counts[0] for i in range(counts[0])], 0.10)]
    neck_faces.extend(connect_reduction(bm, upper, previous))
    for index, count in enumerate(counts[1:]):
        t = 0.36 + index * 0.27
        params = aligned_parameters(len(previous), count)
        transition = [bm.verts.new(p) for p in surface(params, t - 0.13)]
        neck_faces.extend(connect_reduction(bm, previous, transition))
        current = [bm.verts.new(p) for p in surface([i / count for i in range(count)], t)]
        neck_faces.extend(connect_reduction(bm, transition, current))
        previous = current
    neck_faces.extend(connect_reduction(bm, previous, lower))
    for f in neck_faces:
        f[patch_tag] = 1
        f.material_index = 0
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    assert all(len(f.verts) == 4 for f in neck_faces)
    assert not any(e.is_boundary or len(e.link_faces) > 2 for f in neck_faces for e in f.edges)
    assert not any(f.calc_area() < 1e-12 for f in neck_faces)
    reports.append({'gender': gender, 'row_counts': counts, 'removed_source_rows': {'head': head_rows, 'body': body_rows}, 'patch_faces': len(neck_faces), 'patch_all_quads': True, 'source_faces_retained': len(bm.faces) - len(neck_faces), 'status': 'NECK_TRIAL_ONLY_SOURCE_DEFECTS_NOT_YET_REPAIRED'})
    bm.to_mesh(body.data)
    bm.free()
    body.data.normals_split_custom_set([(0, 0, 0)] * len(body.data.loops))
    for polygon in body.data.polygons:
        polygon.use_smooth = True
    body.color = (0.70, 0.54, 0.41, 1)
    body['trial_not_final'] = True
(ROOT / 'reports/neck-transition-trial.json').write_text(json.dumps(reports, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/neck-transition-trial.blend'))
print('NECK_TRANSITION_TRIAL_CREATED', flush=True)
