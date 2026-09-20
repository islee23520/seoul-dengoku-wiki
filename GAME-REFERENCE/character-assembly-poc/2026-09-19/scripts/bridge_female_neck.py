# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Bridge female neck: fill small holes first, then 56->32 quad transition."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components, orient_surface
from quad_neck import ordered_ring
from quad_transition import connect_reduction, sample_loop, aligned_parameters

assert bpy.app.background
obj = bpy.data.objects['Female_Base_Assembly']
mesh = obj.data
bm = bmesh.new(); bm.from_mesh(mesh); bm.normal_update()
bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table()
bm.verts.index_update(); bm.faces.index_update()

# Step 1: Fill any small non-eye non-neck boundary holes (<=20 edges)
for iteration in range(20):
    groups = boundary_groups(bm)
    small = [g for g in groups if len(g) <= 20]
    if not small:
        break
    for g in small:
        vs = {v for e in g for v in e.verts}
        if all(sum(e in g for e in v.link_edges) == 2 for v in vs):
            # Simple loop, grid fill
            ring = ordered_ring(g)
            n = len(ring)
            if n == 4:
                try:
                    bm.faces.new(ring)
                except ValueError:
                    pass
            else:
                try:
                    result = bmesh.ops.holes_fill(bm, edges=list(g), sides=n)
                except Exception:
                    pass
    bm.normal_update()

# Step 2: Remove degenerate faces
degens = [f for f in bm.faces if f.calc_area() < 1e-12]
if degens:
    bmesh.ops.delete(bm, geom=degens, context='FACES_ONLY')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bm.normal_update()

# Step 3: Find neck boundary loops
groups = boundary_groups(bm)
head_loop = None; body_loop = None; eye_loops = []
for g in groups:
    vs = {v for e in g for v in e.verts}
    cz = sum(v.co.z for v in vs) / len(vs)
    if len(g) == 63:
        eye_loops.append(g)
    elif len(g) == 56:
        head_loop = g
    elif len(g) == 32:
        body_loop = g

assert head_loop is not None, [len(g) for g in groups]
assert body_loop is not None, [len(g) for g in groups]

head_ring = ordered_ring(head_loop)
body_ring = ordered_ring(body_loop)
head_c = [v.co.copy() for v in head_ring]
body_c = [v.co.copy() for v in body_ring]

# Sample loops for interpolation
head_samples = sample_loop(head_c, 512)
body_samples = sample_loop(body_c, 512)

def surface(params, t):
    return [head_samples[int(p*512)%512].lerp(body_samples[int(p*512)%512], t) for p in params]

# Step 4: Create transition with intermediate rings [56, 48, 40, 32]
counts = [56, 48, 40, 32]
faces = []
tag = bm.faces.layers.int.new('NeckTransition')

prev = head_ring
for idx in range(1, len(counts)):
    count = counts[idx]
    t = idx / (len(counts) - 1)
    if idx < len(counts) - 1:
        params = aligned_parameters(len(prev), count)
        positions = surface(params, t - 1/(len(counts)-1))
        curr = [bm.verts.new(p) for p in positions]
    else:
        curr = body_ring

    if len(prev) == len(curr):
        n = len(prev)
        for i in range(n):
            try:
                f = bm.faces.new((prev[i], prev[(i+1)%n], curr[(i+1)%n], curr[i]))
                f[tag] = 1
                faces.append(f)
            except ValueError:
                pass
    else:
        new_faces = connect_reduction(bm, prev, curr)
        for f in new_faces:
            f[tag] = 1
        faces.extend(new_faces)
    prev = curr

print(f'Created {len(faces)} neck transition faces', flush=True)

# Step 5: Verify
bm.normal_update()
orient_surface(bm)
parts = components(bm)
remaining = boundary_groups(bm)
winding = sum(1 for e in bm.edges if e.is_manifold and not e.is_contiguous)
junction = sum(1 for e in bm.edges if len(e.link_faces) > 2)

report = {
    'gender': 'Female',
    'vertices': len(bm.verts),
    'faces': len(bm.faces),
    'quads': sum(1 for f in bm.faces if len(f.verts) == 4),
    'connected_components': len(parts),
    'boundary_groups': [len(g) for g in remaining],
    'junction_edges': junction,
    'winding_errors': winding,
    'neck_transition_faces': len(faces),
    'eye_loops': [len(g) for g in eye_loops],
    'status': 'NECK_BRIDGED_BILATERAL_REVIEW_REQUIRED'
}
bm.to_mesh(mesh); bm.free()
mesh.normals_split_custom_set([(0, 0, 0)] * len(mesh.loops))
for p in mesh.polygons: p.use_smooth = True
(ROOT / 'reports/female-neck-bridge.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/female-base-neck-bridged.blend'))
print('FEMALE_NECK_BRIDGED', json.dumps(report), flush=True)
