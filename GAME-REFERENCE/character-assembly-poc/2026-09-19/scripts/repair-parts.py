# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run: Blender --background work/prepared-parts.blend --python scripts/repair-parts.py
"""Repair local mesh defects while protecting neck and eye openings."""
import json
import sys
from pathlib import Path
import bmesh
import bpy

ROOT = Path('/Users/danny/Documents/Character-Assembly-POC/2026-09-19')
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, clean_mesh

report = []
for obj in sorted((o for o in bpy.context.scene.objects if o.type == 'MESH'), key=lambda o: o.name):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    initial = {'v': len(bm.verts), 'f': len(bm.faces), 'boundary': sum(e.is_boundary for e in bm.edges), 'junction': sum(len(e.link_faces) > 2 for e in bm.edges)}
    # Generated exports contain tiny extra triangles across otherwise valid edges.
    # Remove the smallest extra adjacent face, not either main surface triangle.
    removed = 0
    for iteration in range(20):
        bad_edges = [e for e in bm.edges if len(e.link_faces) > 2]
        if not bad_edges:
            break
        bad_faces = set()
        for edge in bad_edges:
            ordered = sorted(edge.link_faces, key=lambda f: f.calc_area())
            bad_faces.update(ordered[:len(ordered) - 2])
        removed += len(bad_faces)
        bmesh.ops.delete(bm, geom=list(bad_faces), context='FACES_ONLY')
        clean_mesh(bm)
    filled = 0
    protected = []
    for group in boundary_groups(bm):
        points = {v for e in group for v in e.verts}
        zmin = min(v.co.z for v in points)
        zmax = max(v.co.z for v in points)
        is_head = obj.name.endswith('Head_Skin')
        is_body = obj.name.endswith('Body_Skin')
        is_neck = (is_head and zmax < 0.11 and len(group) > 20) or (is_body and zmin > 0.8 and len(group) > 15)
        is_eye = is_head and zmin > 0.45 and zmax < 0.65 and len(group) > 30
        if is_neck or is_eye:
            protected.append({'edges': len(group), 'role': 'neck' if is_neck else 'eye'})
            continue
        if len(group) >= 3:
            result = bmesh.ops.holes_fill(bm, edges=group, sides=0)
            filled += len(result['faces'])
    clean_mesh(bm)
    remaining = []
    for group in boundary_groups(bm):
        points = {v for e in group for v in e.verts}
        remaining.append({'edges': len(group), 'min': [min(v.co[a] for v in points) for a in range(3)], 'max': [max(v.co[a] for v in points) for a in range(3)]})
    report.append({'name': obj.name, 'before': initial, 'removed_extra_faces': removed, 'filled_faces': filled, 'protected': protected, 'vertices': len(bm.verts), 'faces': len(bm.faces), 'boundary': sum(e.is_boundary for e in bm.edges), 'junction': sum(len(e.link_faces) > 2 for e in bm.edges), 'remaining': remaining})
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.normals_split_custom_set([(0.0, 0.0, 0.0)] * len(obj.data.loops))
    for poly in obj.data.polygons:
        poly.use_smooth = True
(ROOT / 'reports/repair-parts.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/repaired-parts.blend'))
print('REPAIR_PARTS_COMPLETE', flush=True)
