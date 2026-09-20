# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Reparameterize only colliding polygons; isolate them outside accepted UV charts."""
import hashlib
import json
import math
from pathlib import Path

import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
obj = bpy.data.objects['Male_Base_Symmetric']
mesh = obj.data
mesh.calc_loop_triangles()
dataset = np.load(ROOT / 'reports/male-isolated-uv-triangles.npz')
audit = json.loads((ROOT / 'reports/male-isolated-uv-overlap.json').read_text())
bad_triangles = set(audit['degenerate_triangle_ids'])
bad_triangles.update(i for pair in audit['positive_area_overlap_pairs'] for i in pair['triangles'])
bad_faces = {int(dataset['polygon_ids'][i]) for i in bad_triangles}
positions = np.empty(len(mesh.vertices)*3, np.float32)
mesh.vertices.foreach_get('co', positions)
position_hash = hashlib.sha256(positions.tobytes()).hexdigest()
old_uv = np.empty(len(mesh.loops)*2, np.float32)
mesh.uv_layers['AtlasUV'].data.foreach_get('uv', old_uv)
source_uv = np.empty(len(mesh.loops)*2, np.float32)
mesh.uv_layers['SourceUV'].data.foreach_get('uv', source_uv)
source_hash = hashlib.sha256(source_uv.tobytes()).hexdigest()
triangles_by_face = {}
for triangle in mesh.loop_triangles:
    if triangle.polygon_index in bad_faces:
        triangles_by_face.setdefault(triangle.polygon_index, []).append(triangle)
charts = []
for face_index in sorted(bad_faces):
    face = mesh.polygons[face_index]
    triangles = triangles_by_face[face_index]
    assert len(face.vertices) in (3, 4)
    if len(triangles) == 2:
        shared = sorted(set(triangles[0].vertices) & set(triangles[1].vertices))
        assert len(shared) == 2
    else:
        shared = list(triangles[0].vertices[:2])
    a, b = shared
    edge = (mesh.vertices[b].co-mesh.vertices[a].co).length
    assert edge > 1e-9
    planar = {a: np.array([0., 0.]), b: np.array([edge, 0.])}
    clamped = 0
    for index, triangle in enumerate(triangles):
        opposite = next(v for v in triangle.vertices if v not in shared)
        ac = (mesh.vertices[opposite].co-mesh.vertices[a].co).length
        bc = (mesh.vertices[opposite].co-mesh.vertices[b].co).length
        x = (ac*ac + edge*edge - bc*bc) / (2*edge)
        height = math.sqrt(max(0, ac*ac-x*x))
        # Limit only atlas collapse, never move a mesh vertex. Record distortion.
        floor = max(ac, bc, edge) * 0.001
        if height < floor:
            height = floor
            clamped += 1
        planar[opposite] = np.array([x, height if index == 0 else -height])
    points = np.array([planar[v] for v in face.vertices])
    points -= points.min(axis=0)
    size = points.max(axis=0)
    if size[0] > size[1]:
        points = points[:, ::-1]
        size = size[::-1]
    charts.append({'face': face_index, 'side': -1 if face.center.x < 0 else 1, 'points': points, 'size': size, 'clamped_triangles': clamped})


def pack(charts_for_side, scale):
    padding = 1 / 8192
    width, height = .46, .205
    x, y, shelf_height = 0., 0., 0.
    result = []
    for chart in sorted(charts_for_side, key=lambda c: float(c['size'][1]), reverse=True):
        w, h = chart['size']*scale + 2*padding
        if w > width or h > height:
            return None
        if x+w > width:
            x, y, shelf_height = 0., y+shelf_height, 0.
        if y+h > height:
            return None
        result.append((chart, np.array([x+padding, y+padding])))
        x += w
        shelf_height = max(shelf_height, h)
    return result


uv = mesh.uv_layers['AtlasUV']
receipts = []
for side in [-1, 1]:
    group = [c for c in charts if c['side'] == side]
    lo, hi = 0., 1000.
    for iteration in range(50):
        midpoint = (lo+hi)/2
        if pack(group, midpoint) is None:
            hi = midpoint
        else:
            lo = midpoint
    scale = lo * .995
    packed = pack(group, scale)
    assert packed is not None
    for chart, offset in packed:
        offset += np.array([.025 if side < 0 else .525, .03])
        for loop, point in zip(mesh.polygons[chart['face']].loop_indices, chart['points']):
            uv.data[loop].uv = point*scale+offset
    receipts.append({'side': side, 'isolated_charts': len(group), 'uniform_chart_scale': scale, 'padding_uv': 1/8192, 'reserved_uv_region': [[.025 if side<0 else .525, .03], [.485 if side<0 else .985, .235]]})
unchanged_loops = [i for face in mesh.polygons if face.index not in bad_faces for i in face.loop_indices]
new_uv = np.empty(len(mesh.loops)*2, np.float32)
uv.data.foreach_get('uv', new_uv)
assert np.array_equal(old_uv.reshape(-1,2)[unchanged_loops], new_uv.reshape(-1,2)[unchanged_loops])
mesh.vertices.foreach_get('co', positions)
mesh.uv_layers['SourceUV'].data.foreach_get('uv', source_uv)
assert hashlib.sha256(positions.tobytes()).hexdigest() == position_hash
assert hashlib.sha256(source_uv.tobytes()).hexdigest() == source_hash
mesh.calc_loop_triangles()
tri_uv = np.array([[tuple(uv.data[i].uv) for i in tri.loops] for tri in mesh.loop_triangles], np.float64)
a, b = tri_uv[:,1]-tri_uv[:,0], tri_uv[:,2]-tri_uv[:,0]
areas = abs(a[:,0]*b[:,1]-a[:,1]*b[:,0])/2
assert areas.min() > 1e-14, float(areas.min())
np.savez_compressed(ROOT/'reports/male-repaired-uv-triangles.npz', triangles=tri_uv, polygon_ids=np.array([t.polygon_index for t in mesh.loop_triangles]), sides=np.array([-1 if mesh.polygons[t.polygon_index].center.x<0 else 1 for t in mesh.loop_triangles]))
report = {'reparameterized_polygons': len(charts), 'total_polygons': len(mesh.polygons), 'unaffected_uv_loops_unchanged': True, 'source_uv_preserved': True, 'geometry_preserved': True, 'uv_only_altitude_clamped_triangles': sum(c['clamped_triangles'] for c in charts), 'minimum_uv_triangle_area': float(areas.min()), 'half_packing': receipts, 'positive_area_overlap_check_pending': True}
(ROOT/'reports/male-uv-collision-repair.json').write_text(json.dumps(report,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work/male-base-atlas-collision-repair.blend'))
print('UV_COLLISION_REPAIR_CREATED', len(charts), flush=True)
