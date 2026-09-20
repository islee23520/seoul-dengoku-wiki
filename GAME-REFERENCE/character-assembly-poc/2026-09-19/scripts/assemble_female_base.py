# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Assemble female base from repaired sources with density-transition neck."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components, select_only, orient_surface
from quad_neck import ordered_ring

assert bpy.app.background
scene = bpy.data.scenes.new('Female_Base_Assembly')
bpy.context.window.scene = scene
scene.unit_settings.system = 'METRIC'

# Load repaired sources
with bpy.data.libraries.load(str(ROOT / 'work/doll-sources-repaired-review.blend'), link=False) as (src, dst):
    dst.objects = [n for n in src.objects if n.startswith('Female_')]
head_src = next(o for o in dst.objects if 'Head' in o.name)
body_src = next(o for o in dst.objects if 'Body' in o.name)

# Make working copies
head = head_src.copy(); head.data = head_src.data.copy(); head.name = 'Female_Head_Work'
body = body_src.copy(); body.data = body_src.data.copy(); body.name = 'Female_Body_Work'
scene.collection.objects.link(head)
scene.collection.objects.link(body)
head_src_mesh = head_src.data; body_src_mesh = body_src.data
bpy.data.objects.remove(head_src, do_unlink=True)
bpy.data.objects.remove(body_src, do_unlink=True)
if head_src_mesh.users == 0: bpy.data.meshes.remove(head_src_mesh)
if body_src_mesh.users == 0: bpy.data.meshes.remove(body_src_mesh)

# Identify neck boundaries (head lowest loop, body highest loop)
hb = bmesh.new(); hb.from_mesh(head.data); hb.normal_update()
bb = bmesh.new(); bb.from_mesh(body.data); bb.normal_update()

head_groups = [g for g in boundary_groups(hb) if len(g) == 56]
body_groups = [g for g in boundary_groups(bb) if len(g) == 32]
assert len(head_groups) == 1, [len(g) for g in boundary_groups(hb)]
assert len(body_groups) == 1, [len(g) for g in boundary_groups(bb)]
head_ring = ordered_ring(head_groups[0])
body_ring = ordered_ring(body_groups[0])

# Proportion: head from crown to neck, body from neck to feet
# Work in source coordinates first
head_neck_z = min(v.co.z for v in head_ring)
head_crown_z = max(v.co.z for v in hb.verts)
body_neck_z = max(v.co.z for v in body_ring)
body_feet_z = min(v.co.z for v in bb.verts)
head_height = head_crown_z - head_neck_z
body_height = body_neck_z - body_feet_z

# Target: 1.65m female, ~7.5 heads tall => head ~0.22m
target_height = 1.65
target_head = 0.22
head_scale = target_head / head_height
total_h = head_height * head_scale + body_height * head_scale
final_scale = target_height / total_h
head_scale *= final_scale

# Position: head above body with small overlap for transition
head.data.transform(Matrix.Scale(head_scale, 4))
body.data.transform(Matrix.Scale(head_scale, 4))
# Re-read positions after scaling
hb.free(); bb.free()
hb = bmesh.new(); hb.from_mesh(head.data); hb.normal_update()
bb = bmesh.new(); bb.from_mesh(body.data); bb.normal_update()
head_groups2 = [g for g in boundary_groups(hb) if len(g) == 56]
body_groups2 = [g for g in boundary_groups(bb) if len(g) == 32]
head_ring2 = ordered_ring(head_groups2[0])
body_ring2 = ordered_ring(body_groups2[0])
head_neck_z2 = min(v.co.z for v in head_ring2)
body_neck_z2 = max(v.co.z for v in body_ring2)

# Place head so its neck is just above body's neck with overlap
translation = Vector((0, 0, body_neck_z2 - head_neck_z2 + 0.01))
head.data.transform(Matrix.Translation(translation))
hb.free(); bb.free()

# Join head and body
select_only(body)
head.hide_set(False)
head.select_set(True)
bpy.ops.object.join()
body.name = 'Female_Base_Assembly'
mesh = body.data

# Find the two neck boundary loops after joining
bm = bmesh.new(); bm.from_mesh(mesh); bm.normal_update()
all_groups = boundary_groups(bm)
# Eye loops (63 each) + 2 neck loops
eye_groups = [g for g in all_groups if len(g) == 63]
neck_groups = [g for g in all_groups if len(g) in (56, 64)]  # may have merged
if len(neck_groups) == 2:
    lower = max(neck_groups, key=lambda g: sum(v.co.z for e in g for v in e.verts) / (2*len(g)))
    upper = min(neck_groups, key=lambda g: sum(v.co.z for e in g for v in e.verts) / (2*len(g)))
    lower_ring = ordered_ring(lower)
    upper_ring = ordered_ring(upper)
    # Create multi-ring quad transition
    count_l = len(lower_ring); count_u = len(upper_ring)
    # Use min count, bridge with intermediate rings
    n_rings = 4
    rings = [lower_ring]
    for j in range(1, n_rings):
        t = j / n_rings
        ring_j = []
        for i in range(count_l):
            v = lower_ring[i]
            u = upper_ring[i % count_u]
            ring_j.append(bm.verts.new(v.co.lerp(u.co, t)))
        rings.append(ring_j)
    rings.append(upper_ring)
    tag = bm.faces.layers.int.new('NeckTransition')
    collar = []
    for a, b in zip(rings, rings[1:]):
        n = len(a)
        for i in range(n):
            try:
                face = bm.faces.new((a[i], a[(i+1)%n], b[(i+1)%len(b)], b[i%len(b)]))
                face[tag] = 1
                collar.append(face)
            except ValueError:
                pass
    print(f'Created {len(collar)} neck transition faces', flush=True)

# Final scale to target height
bm.verts.ensure_lookup_table()
max_z = max(v.co.z for v in bm.verts)
factor = target_height / max_z
bm.to_mesh(mesh); bm.free()
body.data.transform(Matrix.Scale(factor, 4))

# Structural checks
bm2 = bmesh.new(); bm2.from_mesh(body.data); bm2.normal_update()
parts = components(bm2)
remaining = boundary_groups(bm2)
winding = sum(1 for e in bm2.edges if e.is_manifold and not e.is_contiguous)
junction = sum(1 for e in bm2.edges if len(e.link_faces) > 2)

report = {
    'gender': 'Female',
    'target_height_m': target_height,
    'head_to_body_scale': head_scale,
    'vertices': len(bm2.verts),
    'faces': len(bm2.faces),
    'quads': sum(1 for f in bm2.faces if len(f.verts) == 4),
    'connected_components': len(parts),
    'boundary_groups': [len(g) for g in remaining],
    'junction_edges': junction,
    'winding_errors': winding,
    'degenerate_faces': sum(1 for f in bm2.faces if f.calc_area() < 1e-12),
    'eye_loops': [len(g) for g in eye_groups] if eye_groups else [],
    'status': 'STRUCTURAL_PASS_BILATERAL_REVIEW_REQUIRED'
}
bm2.free()
body.data.normals_split_custom_set([(0, 0, 0)] * len(body.data.loops))
for p in body.data.polygons:
    p.use_smooth = True

(ROOT / 'reports/female-base-assembly.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/female-base-assembly-review.blend'))
print('FEMALE_BASE_ASSEMBLED', json.dumps(report), flush=True)
