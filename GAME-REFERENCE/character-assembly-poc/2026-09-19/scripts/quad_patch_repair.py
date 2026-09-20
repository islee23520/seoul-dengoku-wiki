# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Corner-aware quad patch repair on an explicit working copy."""
from collections import deque

import bmesh
from mathutils import Vector

from mesh_tools import boundary_groups, orient_surface


def ordered_boundary(edges: list[bmesh.types.BMEdge]) -> list[bmesh.types.BMVert]:
    """Walk only a simple loop; reject ambiguous boundaries rather than guess."""
    vertices = {v for e in edges for v in e.verts}
    edge_set = set(edges)
    assert all(sum(e in edge_set for e in v.link_edges) == 2 for v in vertices)
    first = min(vertices, key=lambda v: tuple(v.co))
    ring = [first]
    previous = None
    current = first
    while True:
        following = next(e.other_vert(current) for e in current.link_edges if e in edge_set and e.other_vert(current) != previous)
        if following == first:
            break
        ring.append(following)
        previous, current = current, following
    assert len(ring) == len(vertices)
    return ring


def remove_faces(bm: bmesh.types.BMesh, faces: set[bmesh.types.BMFace]) -> None:
    """Delete a selected corrupt neighborhood and its now-unused wire elements."""
    bmesh.ops.delete(bm, geom=list(faces), context='FACES_ONLY')
    bmesh.ops.delete(bm, geom=[e for e in bm.edges if not e.link_faces], context='EDGES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')


def repair_patches(bm: bmesh.types.BMesh, preserved_loops: list[set[tuple[float, float, float]]]) -> list[dict]:
    """Rebuild defects as orientable quad grids, retaining all healthy vertices."""
    expected_loops = {frozenset(points) for points in preserved_loops}
    assert len(expected_loops) == len(preserved_loops), 'Repeated protected loop'
    actual_loops = {frozenset(tuple(v.co) for e in group for v in e.verts) for group in boundary_groups(bm)}
    assert expected_loops.issubset(actual_loops), 'Protected loop missing or incomplete'
    repair_tag = bm.faces.layers.int.get('VerifiedQuadRepair') or bm.faces.layers.int.new('VerifiedQuadRepair')
    # BMesh custom-data changes can invalidate old element references.
    groups = boundary_groups(bm)
    protected = {v for group in groups if frozenset(tuple(v.co) for e in group for v in e.verts) in expected_loops for e in group for v in e.verts}
    bad = {v for e in bm.edges if len(e.link_faces) > 2 or e.is_wire for v in e.verts}
    for group in groups:
        vertices = {v for e in group for v in e.verts}
        if vertices.issubset(protected):
            continue
        # A missing healthy quad can be restored without removing its neighbors.
        # Narrow cracks or ambiguous boundaries still require a local rebuild.
        if len(group) == len(vertices) == 4 and all(sum(e in group for e in v.link_edges) == 2 for v in vertices):
            ring = ordered_boundary(group)
            lengths = [e.calc_length() for e in group]
            normal = sum((ring[i].co.cross(ring[(i + 1) % 4].co) for i in range(4)), Vector())
            area = normal.length / 2
            if min(lengths) > 0 and max(lengths) / min(lengths) < 3 and area / sum(lengths) ** 2 > .03 and not vertices.intersection(bad):
                continue
        bad.update(vertices)
    faces = {f for v in bad for f in v.link_faces}
    faces.update(f for f in bm.faces if f.calc_area() < 1e-12)
    assert not any(v in protected for f in faces for v in f.verts), 'Repair touches protected boundary'
    remove_faces(bm, faces)
    # Even boundary parity is necessary for a quad disk. Extend odd patches along
    # the shortest existing face strip to an odd-sided source face, never split a
    # single border edge and leave an n-gon in its neighbor.
    for iteration in range(200):
        current_groups = [g for g in boundary_groups(bm) if not all(v in protected for e in g for v in e.verts)]
        coincident = set()
        for group in current_groups:
            vertices = list({v for e in group for v in e.verts})
            edge_set = set(group)
            branches = {v for v in vertices if sum(e in edge_set for e in v.link_edges) != 2}
            if branches:
                coincident.update(branches)
                continue
            first, second = max(((a, b) for i, a in enumerate(vertices) for b in vertices[i + 1:]), key=lambda pair: (pair[0].co - pair[1].co).length_squared)
            axis = second.co - first.co
            line_distance = max(axis.cross(v.co - first.co).length / axis.length for v in vertices)
            if line_distance < 1e-7:
                coincident.update(vertices)
            for index, vertex in enumerate(vertices):
                for other in vertices[index + 1:]:
                    if (vertex.co - other.co).length < 2e-7:
                        coincident.update((vertex, other))
        if coincident:
            expansion = {f for v in coincident for f in v.link_faces}
            assert not any(v in protected for f in expansion for v in f.verts)
            remove_faces(bm, expansion)
            continue
        odd = [g for g in current_groups if len(g) % 2]
        if not odd:
            break
        group = odd[0]
        starts = {f for e in group for f in e.link_faces}
        queue = deque((f, [f]) for f in starts)
        seen = set(starts)
        path = None
        while queue:
            face, route = queue.popleft()
            if len(face.verts) % 2:
                path = route
                break
            for edge in face.edges:
                for other in edge.link_faces:
                    if other not in seen and not any(v in protected for v in other.verts):
                        seen.add(other)
                        queue.append((other, route + [other]))
        assert path and len(path) <= 6, 'No local parity repair path'
        remove_faces(bm, set(path))
    records = []
    for edges in boundary_groups(bm):
        if all(v in protected for e in edges for v in e.verts):
            continue
        ring = ordered_boundary(edges)
        count, half = len(ring), len(ring) // 2
        assert count % 2 == 0 and count >= 4
        boundary_set = set(edges)
        outside_degree = [sum(e not in boundary_set for e in v.link_edges) for v in ring]
        choices = []
        for span in range(1, half):
            for start in range(count):
                corners = {(start + p) % count for p in (0, span, half, half + span)}
                degrees = [outside_degree[i] + (2 if i in corners else 3) for i in range(count)]
                topology_cost = sum((d - 4) ** 2 + max(0, d - 5) * 10 for d in degrees)
                sides = [(ring[(start + b) % count].co - ring[(start + a) % count].co).length for a, b in [(0, span), (span, half), (half, half + span), (half + span, count)]]
                spacing = [(sides[0] + sides[2]) / (2 * span), (sides[1] + sides[3]) / (2 * (half - span))]
                aspect_cost = abs(spacing[0] - spacing[1]) / max(spacing)
                choices.append((topology_cost + aspect_cost, span, start))
        _, span, start = min(choices)
        ring = ring[start:] + ring[:start]
        selected_edges = [bm.edges.get((ring[i], ring[(i + 1) % count])) for i in list(range(span)) + list(range(half, half + span))]
        boundary_positions = {v: v.co.copy() for v in ring}
        added = bmesh.ops.grid_fill(bm, edges=selected_edges, use_smooth=True, use_interp_simple=True)['faces']
        assert len(added) == span * (half - span)
        face_set = set(added)
        interior = [v for v in {v for f in added for v in f.verts} if all(f in face_set for f in v.link_faces)]
        # Harmonic relaxation follows the fixed healthy boundary; do not project
        # onto the corrupted source faces, which reintroduces dents and folds.
        for repeat in range(60):
            update = {v: sum((e.other_vert(v).co for e in v.link_edges), Vector()) / len(v.link_edges) for v in interior}
            for vertex, position in update.items():
                vertex.co = vertex.co.lerp(position, 0.5)
        assert all(len(f.verts) == 4 and f.calc_area() > 1e-12 for f in added), {'patch': len(records), 'count': count, 'span': span, 'center': list(sum((v.co for v in ring), Vector()) / count), 'areas': [f.calc_area() for f in added], 'boundary': [list(v.co) for v in ring]}
        assert all((v.co - p).length == 0 for v, p in boundary_positions.items())
        for face in added:
            face[repair_tag] = 1
        records.append({'boundary_edges': count, 'span': span, 'offset': start, 'quad_faces': len(added), 'new_vertices': len(interior), 'boundary_displacement_m': 0, 'center': list(sum((v.co for v in ring), Vector()) / count)})
    orient_surface(bm)
    remaining_loops = {frozenset(tuple(v.co) for e in group for v in e.verts) for group in boundary_groups(bm)}
    assert remaining_loops == expected_loops, 'Protected boundary changed or unexpected hole remains'
    assert not any(len(e.link_faces) > 2 or e.is_wire for e in bm.edges)
    assert not any(e.is_manifold and not e.is_contiguous for e in bm.edges)
    return records
