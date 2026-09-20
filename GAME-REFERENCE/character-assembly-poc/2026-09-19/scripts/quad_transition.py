# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Explicit 3-to-1 quad reductions between ordered loops of different densities."""
import math
import bmesh
from mathutils import Vector


def connect_reduction(bm: bmesh.types.BMesh, upper: list[bmesh.types.BMVert], lower: list[bmesh.types.BMVert]) -> list[bmesh.types.BMFace]:
    """Use four quads and two internal vertices per 3-to-1 reduction sector."""
    difference = len(upper) - len(lower)
    assert difference >= 0 and difference % 2 == 0
    reductions = difference // 2
    assert reductions <= len(lower) // 2
    # Spread reductions around the loop with at least one ordinary quad between.
    sectors = {round((k + 0.5) * len(lower) / reductions) % len(lower) for k in range(reductions)} if reductions else set()
    faces = []
    i = 0
    for j in range(len(lower)):
        b0, b1 = lower[j], lower[(j + 1) % len(lower)]
        if j in sectors:
            a0, a1, a2, a3 = [upper[(i + k) % len(upper)] for k in range(4)]
            p = bm.verts.new(a1.co.lerp(b0.co.lerp(b1.co, 1 / 3), 0.55))
            q = bm.verts.new(a2.co.lerp(b0.co.lerp(b1.co, 2 / 3), 0.55))
            faces.extend([bm.faces.new((a0, a1, p, b0)), bm.faces.new((a1, a2, q, p)), bm.faces.new((a2, a3, b1, q)), bm.faces.new((b0, p, q, b1))])
            i += 3
        else:
            faces.append(bm.faces.new((upper[i % len(upper)], upper[(i + 1) % len(upper)], b1, b0)))
            i += 1
    assert i == len(upper)
    return faces


def aligned_parameters(high_count: int, low_count: int) -> list[float]:
    """Locate lower vertices beneath their connected upper vertices, avoiding twist."""
    reductions = (high_count - low_count) // 2
    sectors = {round((k + 0.5) * low_count / reductions) % low_count for k in range(reductions)} if reductions else set()
    parameters = []
    high_index = 0
    for low_index in range(low_count):
        parameters.append(high_index / high_count)
        high_index += 3 if low_index in sectors else 1
    assert high_index == high_count
    return parameters


def sample_loop(points: list[Vector], count: int) -> list[Vector]:
    """Arc-length sample a closed loop without modifying its endpoint topology."""
    lengths = [(points[(i + 1) % len(points)] - p).length for i, p in enumerate(points)]
    total = sum(lengths)
    samples = []
    for i in range(count):
        distance = total * i / count
        j = 0
        while j < len(lengths) - 1 and distance > lengths[j]:
            distance -= lengths[j]
            j += 1
        samples.append(points[j].lerp(points[(j + 1) % len(points)], distance / lengths[j]))
    return samples
