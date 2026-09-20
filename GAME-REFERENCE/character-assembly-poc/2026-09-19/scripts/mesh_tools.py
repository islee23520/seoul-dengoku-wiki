# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Runtime: imported by Blender Python scripts in this project.
"""Small topology utilities for preserved-loop-UV mesh editing."""
import bmesh
import bpy


def components(bm: bmesh.types.BMesh) -> list[list[bmesh.types.BMVert]]:
    """Return vertex components in descending size."""
    seen = set()
    parts = []
    for start in bm.verts:
        if start in seen:
            continue
        stack = [start]
        seen.add(start)
        vertices = []
        while stack:
            vertex = stack.pop()
            vertices.append(vertex)
            for edge in vertex.link_edges:
                other = edge.other_vert(vertex)
                if other not in seen:
                    seen.add(other)
                    stack.append(other)
        parts.append(vertices)
    return sorted(parts, key=len, reverse=True)


def boundary_groups(bm: bmesh.types.BMesh) -> list[list[bmesh.types.BMEdge]]:
    """Group adjacent open edges without joining different openings."""
    remaining = {e for e in bm.edges if e.is_boundary}
    groups = []
    while remaining:
        first = remaining.pop()
        stack = [first]
        edges = []
        while stack:
            edge = stack.pop()
            edges.append(edge)
            for vertex in edge.verts:
                for other in vertex.link_edges:
                    if other in remaining:
                        remaining.remove(other)
                        stack.append(other)
        groups.append(edges)
    return sorted(groups, key=len, reverse=True)


def clean_mesh(bm: bmesh.types.BMesh) -> None:
    """Weld coincident geometry and remove degenerate/duplicate faces."""
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=0.00001)
    bm.verts.index_update()
    seen = set()
    remove = []
    for face in bm.faces:
        key = tuple(sorted(v.index for v in face.verts))
        if face.calc_area() < 1e-12 or key in seen:
            remove.append(face)
        else:
            seen.add(key)
    if remove:
        bmesh.ops.delete(bm, geom=remove, context='FACES_ONLY')
    bmesh.ops.dissolve_degenerate(bm, dist=0.000001, edges=list(bm.edges))
    loose = [v for v in bm.verts if not v.link_faces]
    if loose:
        bmesh.ops.delete(bm, geom=loose, context='VERTS')
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))


def select_only(obj: bpy.types.Object) -> None:
    """Make operator selection and active object explicit."""
    bpy.ops.object.select_all(action='DESELECT')
    obj.hide_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def orient_surface(bm: bmesh.types.BMesh) -> None:
    """Enforce consistent winding across manifold edges and outward shell volume."""
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
    assert not any(e.is_manifold and not e.is_contiguous for e in bm.edges)
    if bm.calc_volume(signed=True) < 0:
        bmesh.ops.reverse_faces(bm, faces=list(bm.faces))
    bm.normal_update()


def split_component(source: bpy.types.Object, indices: set[int], name: str) -> bpy.types.Object:
    """Clone selected topology while preserving all source UV loops."""
    obj = source.copy()
    obj.data = source.data.copy()
    obj.name = name
    bpy.context.scene.collection.objects.link(obj)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.index not in indices], context='VERTS')
    clean_mesh(bm)
    bm.to_mesh(obj.data)
    bm.free()
    obj.hide_render = False
    obj.hide_set(False)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj
