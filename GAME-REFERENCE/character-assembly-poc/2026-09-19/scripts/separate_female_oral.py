# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Separate female oral cavity parts: upper mouth, lower mouth, tongue (if present)."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components

assert bpy.app.background

# Load the female head source directly (has the oral cavity)
bpy.ops.wm.read_homefile(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'sources/originals/stylized doll head 3d model.glb'))
head = [o for o in bpy.data.objects if o.type == 'MESH'][0]
mesh = head.data
print(f'Head: {len(mesh.vertices)}v/{len(mesh.polygons)}f', flush=True)

bm = bmesh.new(); bm.from_mesh(mesh); bm.normal_update()
bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table()

# Find all vertices, get head center and orientation
all_verts = np.array([v.co for v in bm.verts])
center = Vector(all_verts.mean(axis=0).tolist())
# Face is at +Y direction (forward)
# Mouth is in the lower front: y > 0 (front), z < center_z (lower)
face_z = all_verts[all_verts[:,1] > center.y + 0.1][:, 2]
mouth_level = np.percentile(face_z, 15)  # lower part of face
print(f'Head center: {center}, mouth_level z={mouth_level:.3f}', flush=True)

# Identify oral cavity faces: 
# 1. In the mouth region (front, low)
# 2. Facing inward (toward head center) OR below the mouth opening plane
# 3. Connected to the mouth opening
mouth_faces = []
for f in bm.faces:
    fc = f.calc_center_median()
    # Mouth region: front of face, below nose, inside mouth opening
    if fc.y > center.y + 0.05 and fc.z < center.z - 0.1:
        # Check if inward-facing or part of cavity
        normal = f.normal
        to_center = center - fc
        if normal.dot(to_center) > 0.1 or fc.z < mouth_level:
            mouth_faces.append(f)

print(f'Mouth region faces: {len(mouth_faces)}', flush=True)

# Find connected groups of mouth faces
mouth_set = set(f.index for f in mouth_faces)
visited = set()
groups = []
for f in mouth_faces:
    if f.index in visited:
        continue
    # BFS
    stack = [f]
    group = []
    while stack:
        cur = stack.pop()
        if cur.index in visited:
            continue
        visited.add(cur.index)
        group.append(cur)
        for e in cur.edges:
            for linked in e.link_faces:
                if linked.index in mouth_set and linked.index not in visited:
                    stack.append(linked)
    groups.append(group)

print(f'Connected mouth groups: {len(groups)}, sizes: {sorted([len(g) for g in groups], reverse=True)[:10]}', flush=True)

# Analyze each group
report = {'groups': []}
for i, g in enumerate(groups):
    if len(g) < 5:
        continue
    z_avg = np.mean([f.calc_center_median().z for f in g])
    y_avg = np.mean([f.calc_center_median().y for f in g])
    x_range = (min(f.calc_center_median().x for f in g), max(f.calc_center_median().x for f in g))
    # Depth: how far back does it extend
    y_min = min(f.calc_center_median().y for f in g)
    report['groups'].append({
        'index': i, 'faces': len(g), 'z_avg': float(z_avg),
        'y_avg': float(y_avg), 'y_depth': float(y_min),
        'x_range': [float(x_range[0]), float(x_range[1])],
    })
    print(f'  Group {i}: {len(g)} faces, z={z_avg:.3f}, y={y_avg:.3f}, depth_y={y_min:.3f}', flush=True)

# The tongue would be a group that:
# - Is in the middle (not attached to lips directly)
# - Has a distinct shape (rounded, muscular)
# Upper mouth: groups with higher z_avg
# Lower mouth: groups with lower z_avg

# For now, save the head with oral faces tagged
int_layer = bm.faces.layers.int.new('OralGroup')
for i, g in enumerate(groups):
    for f in g:
        f[int_layer] = i + 1

bm.to_mesh(mesh); bm.free()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/female-head-oral-groups.blend'))
(ROOT / 'reports/female-oral-groups.json').write_text(json.dumps(report, indent=2))
print('FEMALE_ORAL_GROUPS_FOUND', flush=True)
