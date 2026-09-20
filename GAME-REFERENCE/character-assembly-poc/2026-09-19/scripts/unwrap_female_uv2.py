# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Seam-marked unwrap for female: center back + inner limbs + neck seams."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from uv_overlap_audit import audit

assert bpy.app.background
obj = bpy.data.objects['Female_Base_Assembly']
mesh = obj.data

# Clear UV layers
for l in list(mesh.uv_layers):
    mesh.uv_layers.remove(l)
mesh.uv_layers.new(name='Atlas')

bm = bmesh.new(); bm.from_mesh(mesh)
bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()

# Mark seams:
# 1. Center back: edges at x≈0, y<0 (posterior midline)
# 2. Inner limbs: edges at x≈0 for arms/legs (medial)
# 3. Neck: horizontal ring at neck junction
for e in bm.edges:
    v1, v2 = e.verts
    mid = (v1.co + v2.co) / 2
    # Center back/posterior (y<0) and center front where needed
    if abs(mid.x) < 0.002:
        # Full centerline: separates left/right
        e.seam = True
    # Neck ring
    if abs(mid.z - 0.82) < 0.03 and abs(mid.y) > 0.02:
        e.seam = True
    # Inner arm creases
    if abs(mid.x) < 0.03 and 1.0 < mid.z < 1.4 and mid.y > 0.05:
        e.seam = True

seam_count = sum(1 for e in bm.edges if e.seam)
print(f'Marked {seam_count} seam edges', flush=True)
bm.to_mesh(mesh); bm.free()

# Unwrap
bpy.context.view_layer.objects.active = obj
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.unwrap(method='ANGLE_BASED', margin=0.003)
bpy.ops.object.mode_set(mode='OBJECT')

# Verify
bm = bmesh.new(); bm.from_mesh(mesh)
uv_layer = bm.loops.layers.uv.active

# Build adjacency set for exclusion
adj = set()
for e in bm.edges:
    fs = tuple(sorted(f.index for f in e.link_faces))
    if len(fs) == 2:
        adj.add(fs)

tris = []
face_map = []
for f in bm.faces:
    for i in range(len(f.loops) - 2):
        tri = np.array([list(l[uv_layer].uv) for l in [f.loops[0], f.loops[i+1], f.loops[i+2]]])
        tris.append(tri)
        face_map.append(f.index)
bm.free()

result = audit(np.array(tris))
overlap_pairs = result.get('positive_area_overlap_pairs', [])
# Filter: exclude pairs that are adjacent faces
non_adj_overlaps = []
for pair in overlap_pairs:
    if isinstance(pair, (list, tuple)) and len(pair) == 2:
        f1, f2 = face_map[pair[0]], face_map[pair[1]]
        if (min(f1,f2), max(f1,f2)) not in adj:
            non_adj_overlaps.append(pair)

print(f'Unwrap result: {len(overlap_pairs)} raw, {len(non_adj_overlaps)} non-adjacent overlaps', flush=True)
report = {
    'mesh': 'Female_Base_Assembly',
    'method': 'seam_marked + uv.unwrap(ANGLE_BASED, margin=0.003)',
    'seam_edges': seam_count,
    'raw_overlap_pairs': len(overlap_pairs),
    'non_adjacent_overlap_pairs': len(non_adj_overlaps),
    'ok': len(non_adj_overlaps) == 0,
}
(ROOT / 'reports/female-uv-unwrap-v2.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/female-base-uv-v2.blend'))
print('FEMALE_UV_V2', json.dumps(report), flush=True)
