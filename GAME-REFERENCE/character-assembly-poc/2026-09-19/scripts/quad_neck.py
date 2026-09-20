# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Create ordered equal-count neck rings and an explicitly authored quad collar."""
import math
import bmesh
import bpy
from mathutils import Matrix, Vector


def ordered_ring(edges: list[bmesh.types.BMEdge]) -> list[bmesh.types.BMVert]:
    """Walk a simple boundary, preserving its actual edge adjacency."""
    vertices = {v for e in edges for v in e.verts}
    assert all(sum(e in edges for e in v.link_edges) == 2 for v in vertices)
    start = min(vertices, key=lambda v: (v.co.y, abs(v.co.x)))
    ring = [start]
    previous = None
    current = start
    while True:
        candidates = [e.other_vert(current) for e in current.link_edges if e in edges and e.other_vert(current) != previous]
        following = candidates[0]
        if following == start:
            break
        ring.append(following)
        previous, current = current, following
    assert len(ring) == len(vertices)
    area = sum(ring[i].co.x * ring[(i + 1) % len(ring)].co.y - ring[(i + 1) % len(ring)].co.x * ring[i].co.y for i in range(len(ring)))
    if area < 0:
        ring = [ring[0]] + list(reversed(ring[1:]))
    return ring


def resample_boundary(bm: bmesh.types.BMesh, ring: list[bmesh.types.BMVert], count: int) -> list[bmesh.types.BMVert]:
    """Split only boundary edges then redistribute on the original ring perimeter."""
    original = [v.co.copy() for v in ring]
    lengths = [(original[(i + 1) % len(original)] - original[i]).length for i in range(len(original))]
    total = sum(lengths)
    while len(ring) < count:
        edge = max((bm.edges.get((ring[i], ring[(i + 1) % len(ring)])) for i in range(len(ring))), key=lambda e: e.calc_length())
        bmesh.utils.edge_split(edge, edge.verts[0], 0.5)
        # All newly created ring vertices remain in this connected boundary.
        frontier = {ring[0]}
        found = set()
        while frontier:
            vertex = frontier.pop()
            for e in vertex.link_edges:
                if e.is_boundary and e not in found:
                    found.add(e)
                    frontier.add(e.other_vert(vertex))
        ring = ordered_ring(list(found))
    for i, vertex in enumerate(ring):
        distance = total * i / count
        j = 0
        while j < len(lengths) - 1 and distance > lengths[j]:
            distance -= lengths[j]
            j += 1
        vertex.co = original[j].lerp(original[(j + 1) % len(original)], distance / lengths[j])
    return ring


def neck_ring(obj: bpy.types.Object) -> tuple[bmesh.types.BMesh, list[bmesh.types.BMVert]]:
    """Pick neck by central bounds, not by arbitrary edge count."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    boundaries = [e for e in bm.edges if e.is_boundary]
    if 'Head' in obj.name:
        boundaries = [e for e in boundaries if all(v.co.z < 0.14 for v in e.verts)]
    else:
        boundaries = [e for e in boundaries if all(v.co.z > 0.80 and abs(v.co.x) < 0.08 for v in e.verts)]
    return bm, ordered_ring(boundaries)
