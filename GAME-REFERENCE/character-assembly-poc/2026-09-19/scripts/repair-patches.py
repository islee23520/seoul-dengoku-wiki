# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run: Blender --background work/repaired-parts.blend --python scripts/repair-patches.py
"""Rebuild narrow corrupt face neighborhoods rather than cap zero-area slits."""
import json
import sys
from pathlib import Path
import bmesh
import bpy

ROOT = Path('/Users/danny/Documents/Character-Assembly-POC/2026-09-19')
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, clean_mesh


def intentional(obj: bpy.types.Object, edges: list[bmesh.types.BMEdge]) -> bool:
    """Keep the measured neck/eye loops, not unrelated small defects."""
    points = {v for e in edges for v in e.verts}
    zmin = min(v.co.z for v in points)
    zmax = max(v.co.z for v in points)
    width = max(v.co.x for v in points) - min(v.co.x for v in points)
    head = obj.name.endswith('Head_Skin')
    neck = (head and zmax < 0.13 and width > 0.2) or (obj.name.endswith('Body_Skin') and zmin > 0.8 and width > 0.05)
    eye = head and zmin > 0.43 and zmax < 0.67 and width > 0.1
    return neck or eye


report = []
for obj in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    passes = []
    for iteration in range(4):
        groups = [g for g in boundary_groups(bm) if not intentional(obj, g)]
        junctions = [e for e in bm.edges if len(e.link_faces) > 2]
        passes.append({'remaining_defects': len(groups), 'junctions': len(junctions)})
        if not groups and not junctions:
            break
        vertices = {v for g in groups for e in g for v in e.verts}
        vertices.update(v for e in junctions for v in e.verts)
        faces = {f for v in vertices for f in v.link_faces}
        bmesh.ops.delete(bm, geom=list(faces), context='FACES_ONLY')
        loose = [v for v in bm.verts if not v.link_faces]
        bmesh.ops.delete(bm, geom=loose, context='VERTS')
        for group in boundary_groups(bm):
            if not intentional(obj, group) and len(group) >= 3:
                patch = bmesh.ops.holes_fill(bm, edges=group, sides=0)['faces']
                if patch:
                    bmesh.ops.triangulate(bm, faces=patch)
        clean_mesh(bm)
    # Keep the source silhouette; soften only high-frequency triangulation noise.
    if obj.name.endswith('_Skin'):
        interior = [v for v in bm.verts if not v.is_boundary]
        for iteration in range(3):
            bmesh.ops.smooth_vert(bm, verts=interior, factor=0.18, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    groups = boundary_groups(bm)
    report.append({'name': obj.name, 'passes': passes, 'boundary': sum(e.is_boundary for e in bm.edges), 'junctions': sum(len(e.link_faces) > 2 for e in bm.edges), 'unexpected_groups': [len(g) for g in groups if not intentional(obj, g)], 'intentional_groups': [len(g) for g in groups if intentional(obj, g)]})
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.normals_split_custom_set([(0.0, 0.0, 0.0)] * len(obj.data.loops))
    for poly in obj.data.polygons:
        poly.use_smooth = True
(ROOT / 'reports/repair-patches.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/patched-parts.blend'))
print('PATCH_REPAIR_COMPLETE', flush=True)
