# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Repair source neighborhoods in the GUI without capping eye or neck loops."""
import json
import sys
from pathlib import Path
import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components


def preserve_opening(obj: bpy.types.Object, edges: list[bmesh.types.BMEdge]) -> bool:
    """Recognize only measured source neck/eye boundaries, never all holes."""
    points = {v for e in edges for v in e.verts}
    zmin, zmax = min(v.co.z for v in points), max(v.co.z for v in points)
    width = max(v.co.x for v in points) - min(v.co.x for v in points)
    head = obj.name.endswith('Head_Skin')
    neck = (head and zmax < 0.13 and width > 0.2) or (obj.name.endswith('Body_Skin') and zmin > 0.8 and width > 0.05)
    eye = head and zmin > 0.43 and zmax < 0.67 and width > 0.1
    return neck or eye


def orient_surface(bm: bmesh.types.BMesh) -> None:
    """Propagate winding across every manifold edge; reject nonorientable shells."""
    visited = set()
    for first in bm.faces:
        if first in visited:
            continue
        stack = [first]
        visited.add(first)
        while stack:
            face = stack.pop()
            for edge in face.edges:
                if not edge.is_manifold:
                    continue
                other = next(f for f in edge.link_faces if f != face)
                if other not in visited:
                    if not edge.is_contiguous:
                        other.normal_flip()
                    visited.add(other)
                    stack.append(other)
    bm.normal_update()
    assert not any(e.is_manifold and not e.is_contiguous for e in bm.edges), 'Nonorientable patch'
    if bm.calc_volume(signed=True) < 0:
        bmesh.ops.reverse_faces(bm, faces=list(bm.faces))
    bm.normal_update()


rows = []
for obj in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    protected_before = [len(g) for g in boundary_groups(bm) if preserve_opening(obj, g)]
    repair_faces = bm.faces.layers.int.get('LocalRepair') or bm.faces.layers.int.new('LocalRepair')
    for iteration in range(7):
        defects = [g for g in boundary_groups(bm) if not preserve_opening(obj, g)]
        bad_edges = [e for e in bm.edges if len(e.link_faces) > 2 or (e.is_manifold and not e.is_contiguous)]
        degenerate = [f for f in bm.faces if f.calc_area() < 1e-12]
        if not defects and not bad_edges and not degenerate:
            break
        # Prefer a winding propagation first when the surface is already manifold.
        if not defects and not any(len(e.link_faces) > 2 for e in bm.edges):
            orient_surface(bm)
            break
        bad_vertices = {v for g in defects for e in g for v in e.verts}
        bad_vertices.update(v for e in bad_edges if len(e.link_faces) > 2 for v in e.verts)
        delete = {f for v in bad_vertices for f in v.link_faces}
        delete.update(degenerate)
        bmesh.ops.delete(bm, geom=list(delete), context='FACES_ONLY')
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
        for group in boundary_groups(bm):
            if preserve_opening(obj, group):
                continue
            if len(group) >= 3:
                patch = bmesh.ops.holes_fill(bm, edges=group, sides=0)['faces']
                for face in patch:
                    face[repair_faces] = 1
        # Rebuild malformed n-gons into triangles before checking area and winding.
        ngons = [f for f in bm.faces if len(f.verts) > 4]
        if ngons:
            bmesh.ops.triangulate(bm, faces=ngons)
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    remaining = [g for g in boundary_groups(bm) if not preserve_opening(obj, g)]
    assert not remaining, (obj.name, [len(g) for g in remaining])
    assert not any(len(e.link_faces) > 2 for e in bm.edges), obj.name
    orient_surface(bm)
    protected_after = [len(g) for g in boundary_groups(bm) if preserve_opening(obj, g)]
    assert sorted(protected_before) == sorted(protected_after), (obj.name, 'intentional loop changed')
    rows.append({'object': obj.name, 'vertices': len(bm.verts), 'faces': len(bm.faces), 'empty': not len(bm.faces), 'unexpected_boundaries': len(remaining), 'winding_errors': sum(e.is_manifold and not e.is_contiguous for e in bm.edges), 'signed_volume': bm.calc_volume(signed=True), 'quads': sum(len(f.verts) == 4 for f in bm.faces), 'protected_boundaries': protected_after})
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.normals_split_custom_set([(0, 0, 0)] * len(obj.data.loops))
    for face in obj.data.polygons:
        face.use_smooth = True
(ROOT / 'reports/gui-quad-repair.json').write_text(json.dumps(rows, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/quad-repaired-working.blend'))
print('GUI_REPAIR_PASS', len(rows), flush=True)
