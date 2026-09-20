# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Small independent topology and legacy-symmetry test seams."""

from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass
from math import sqrt
from typing import Final

Vec3 = tuple[float, float, float]
Face = tuple[int, ...]
Edge = tuple[int, int]

AREA_EPSILON: Final = 1.0e-12


@dataclass(frozen=True, slots=True)
class TopologyResult:
    boundary_edges: int
    unexpected_boundary_edges: int
    duplicate_faces: int
    degenerate_triangles: int
    winding_conflicts: int


def _triangle_area(a: Vec3, b: Vec3, c: Vec3) -> float:
    ab = (b[0] - a[0], b[1] - a[1], b[2] - a[2])
    ac = (c[0] - a[0], c[1] - a[1], c[2] - a[2])
    cross = (
        ab[1] * ac[2] - ab[2] * ac[1],
        ab[2] * ac[0] - ab[0] * ac[2],
        ab[0] * ac[1] - ab[1] * ac[0],
    )
    return 0.5 * sqrt(sum(value * value for value in cross))


def inspect_topology(
    vertices: tuple[Vec3, ...],
    faces: tuple[Face, ...],
    declared_opening_edges: frozenset[Edge] | None = None,
) -> TopologyResult:
    """Inspect explicit fixture topology while preserving declared openings."""
    edge_uses: defaultdict[Edge, list[tuple[int, int]]] = defaultdict(list)
    duplicate_counter: Counter[tuple[int, ...]] = Counter()
    degenerate = 0
    openings = declared_opening_edges or frozenset()
    for face in faces:
        duplicate_counter[tuple(sorted(face))] += 1
        if len(face) == 3 and _triangle_area(*(vertices[index] for index in face)) < AREA_EPSILON:
            degenerate += 1
        for start, end in zip(face, (*face[1:], face[0]), strict=True):
            edge = (min(start, end), max(start, end))
            edge_uses[edge].append((start, end))

    boundary = frozenset(edge for edge, uses in edge_uses.items() if len(uses) == 1)
    conflicts = sum(
        1
        for uses in edge_uses.values()
        if len(uses) == 2 and uses[0] == uses[1]
    )
    duplicates = sum(count - 1 for count in duplicate_counter.values() if count > 1)
    return TopologyResult(
        boundary_edges=len(boundary),
        unexpected_boundary_edges=len(boundary - openings),
        duplicate_faces=duplicates,
        degenerate_triangles=degenerate,
        winding_conflicts=conflicts,
    )


def legacy_exact_two_symmetry(vertices: tuple[Vec3, ...]) -> tuple[float, int, int]:
    """Reproduce the Round 1 YZ-bucket/exactly-two symmetry calculation."""
    buckets: defaultdict[tuple[float, float], list[float]] = defaultdict(list)
    for x, y, z in vertices:
        buckets[(round(y, 6), round(z, 6))].append(x)
    errors = [abs(xs[0] + xs[1]) for xs in buckets.values() if len(xs) == 2]
    ignored_vertices = sum(len(xs) for xs in buckets.values() if len(xs) != 2)
    return (max(errors, default=0.0), len(errors), ignored_vertices)
