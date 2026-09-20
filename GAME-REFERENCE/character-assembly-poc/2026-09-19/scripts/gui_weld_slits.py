# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Weld measured collapsed-edge cracks, preserving surrounding logical quads."""
import json
import sys
from pathlib import Path

import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups

source = bpy.data.objects['Male_Sculpt_Seam_Workcopy']
if bpy.context.mode != 'OBJECT':
    bpy.ops.object.mode_set(mode='OBJECT')
scene = bpy.data.scenes.new('Logical_Weld_Repair')
bpy.context.window.scene = scene
obj = source.copy()
obj.data = source.data.copy()
obj.name = 'Male_Logical_Weld_Repair'
scene.collection.objects.link(obj)
obj.hide_set(False)
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bm = bmesh.new()
bm.from_mesh(obj.data)
records = []
for iteration in range(100):
    candidates = []
    for group in boundary_groups(bm):
        vertices = list({v for e in group for v in e.verts})
        if len(group) != 4 or len(vertices) != 4:
            continue
        pairs = [(a, b) for i, a in enumerate(vertices) for b in vertices[i + 1:] if bm.edges.get((a, b)) is None]
        if not pairs:
            continue
        a, b = min(pairs, key=lambda pair: (pair[0].co - pair[1].co).length)
        gap = (a.co - b.co).length
        edge_length = sum(e.calc_length() for e in group) / 4
        if gap <= 0.00018 and gap < edge_length * 0.22 and len(a.link_edges) + len(b.link_edges) <= 8:
            candidates.append((gap, a, b, vertices))
    if not candidates:
        break
    gap, a, b, vertices = min(candidates, key=lambda row: row[0])
    near = {f for v in vertices for f in v.link_faces}
    quads = sum(len(f.verts) == 4 for f in near)
    old_faces = len(bm.faces)
    center = (a.co + b.co) / 2
    a.co = center
    bmesh.ops.weld_verts(bm, targetmap={b: a})
    assert len(bm.faces) == old_faces
    near_after = {f for v in vertices if v.is_valid for f in v.link_faces}
    assert sum(len(f.verts) == 4 for f in near_after) == quads
    records.append({'gap_m': gap, 'center': list(center), 'adjacent_quads_preserved': quads})
bm.to_mesh(obj.data)
bm.free()
obj.data.update()
report = {'welded_slits': len(records), 'new_faces_created': 0, 'records': records, 'source_object_preserved': source.name}
(ROOT / 'reports/logical-slit-weld.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/logical-slit-weld.blend'))
print('LOGICAL_SLIT_WELD_COMPLETE', len(records), flush=True)
