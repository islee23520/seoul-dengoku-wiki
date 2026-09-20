# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Separate female oral cavity: backward-facing faces inside mouth region."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

assert bpy.app.background
bpy.ops.wm.read_homefile(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'sources/originals/stylized doll head 3d model.glb'))
head = [o for o in bpy.data.objects if o.type == 'MESH'][0]
mesh = head.data

bm = bmesh.new(); bm.from_mesh(mesh); bm.normal_update()
bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table()

# Head orientation: +Z up, +Y forward
all_verts = np.array([v.co for v in bm.verts])
cy = float(all_verts[:,1].mean())

# Oral cavity = faces whose normals point significantly backward (-Y) or up into palate (+Z with negative Y position)
# AND are inside the mouth opening region (low z, front-to-mid y)
# This identifies the inner surface of the mouth cavity
oral_indices = []
for f in bm.faces:
    fc = f.calc_center_median()
    n = f.normal
    # Must be in the mouth region: below nose (z < 0.35 in source coords), not too far back
    if fc.z > 0.38 or fc.z < 0.02:
        continue
    # Must be forward enough to be mouth area (y > -0.12, i.e., not throat)
    if fc.y < -0.12:
        continue
    # Normal pointing backward (into head) = inner surface of oral cavity
    # Or pointing up in the back of mouth = palate
    if n.y < -0.3:  # backward-facing
        oral_indices.append(f.index)
    elif n.z > 0.5 and fc.y < 0.05 and fc.z < 0.25:  # palate (upward-facing, low front)
        oral_indices.append(f.index)

print(f'Oral cavity candidates: {len(oral_indices)} faces', flush=True)

# Group by connectivity
oral_set = set(oral_indices)
visited = set()
groups = []
for fi in oral_indices:
    if fi in visited:
        continue
    stack = [bm.faces[fi]]
    group = []
    while stack:
        cur = stack.pop()
        if cur.index in visited:
            continue
        visited.add(cur.index)
        group.append(cur.index)
        for e in cur.edges:
            for linked in e.link_faces:
                if linked.index in oral_set and linked.index not in visited:
                    stack.append(linked)
    groups.append(group)

groups.sort(key=len, reverse=True)
print(f'Groups: {len(groups)}, top sizes: {[len(g) for g in groups[:10]]}', flush=True)

# Report on each group
report_groups = []
for i, g in enumerate(groups[:15]):
    faces = [bm.faces[fi] for fi in g]
    zs = [f.calc_center_median().z for f in faces]
    ys = [f.calc_center_median().y for f in faces]
    report_groups.append({
        'index': i, 'faces': len(g),
        'z_mean': float(np.mean(zs)), 'z_range': [float(min(zs)), float(max(zs))],
        'y_mean': float(np.mean(ys)), 'y_range': [float(min(ys)), float(max(ys))],
    })
    print(f'  Group {i}: {len(g)}f, z=[{min(zs):.3f},{max(zs):.3f}], y=[{min(ys):.3f},{max(ys):.3f}]', flush=True)

# Tag faces by group in the mesh (using per-loop int attribute)
# Create a face-int attribute on the mesh directly
int_attr = mesh.attributes.new('OralGroup', 'INT', 'FACE')
group_data = [0] * len(mesh.polygons)
for i, g in enumerate(groups):
    for fi in g:
        group_data[fi] = i + 1
for fi, val in enumerate(group_data):
    int_attr.data[fi].value = val

bm.to_mesh(mesh); bm.free()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/female-head-oral-groups.blend'))
(ROOT / 'reports/female-oral-groups.json').write_text(json.dumps({'groups': report_groups}, indent=2))
print('FEMALE_ORAL_GROUPS_TAGGED', flush=True)
