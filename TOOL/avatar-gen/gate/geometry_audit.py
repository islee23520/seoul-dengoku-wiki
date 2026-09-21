"""Pure geometry invariants for evaluated Blender mesh extraction."""

from __future__ import annotations

from collections import Counter, defaultdict
from collections.abc import Sequence
from dataclasses import dataclass
from itertools import product
from math import dist, floor, isfinite, sqrt

Vec3 = tuple[float, float, float]
Edge = tuple[int, int]
Triangle = tuple[int, int, int]
Cell = tuple[int, int, int]


def _cell(point: Vec3, size: float) -> Cell:
    return (floor(point[0] / size), floor(point[1] / size), floor(point[2] / size))


def _neighbors(cell: Cell) -> tuple[Cell, ...]:
    return tuple((cell[0] + x, cell[1] + y, cell[2] + z) for x, y, z in product((-1, 0, 1), repeat=3))


@dataclass(frozen=True, slots=True)
class TopologyAudit:
    failures: tuple[str, ...]
    boundary_edges: tuple[Edge, ...]
    wire_edges: tuple[Edge, ...]
    duplicate_vertex_pairs: tuple[tuple[int, int], ...]
    duplicate_faces: int
    degenerate_triangles: int
    winding_conflicts: int
    non_manifold_edges: int


@dataclass(frozen=True, slots=True)
class SymmetryAudit:
    failures: tuple[str, ...]
    checked_vertex_count: int
    unmatched_vertex_ids: tuple[int, ...]
    maximum_reflection_error_m: float


def _area(vertices: Sequence[Vec3], triangle: Triangle) -> float:
    first, second, third = (vertices[index] for index in triangle)
    ab = tuple(second[index] - first[index] for index in range(3))
    ac = tuple(third[index] - first[index] for index in range(3))
    cross = (ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0])
    return 0.5 * sqrt(sum(value * value for value in cross))


def audit_topology(
    vertices: Sequence[Vec3],
    edges: Sequence[Edge],
    triangles: Sequence[Triangle],
    declared_openings: frozenset[Edge],
    area_epsilon_m2: float,
    duplicate_vertex_epsilon_m: float,
) -> TopologyAudit:
    """Audit finite, nonempty, manifold, consistently wound triangle geometry."""
    failures: list[str] = []
    if not vertices or not triangles:
        failures.append("EMPTY_MESH")
    if any(not isfinite(value) for vertex in vertices for value in vertex):
        failures.append("NONFINITE_VERTEX")
    if failures:
        return TopologyAudit(tuple(failures), (), (), (), 0, 0, 0, 0)
    cells: defaultdict[Cell, list[int]] = defaultdict(list)
    duplicate_pairs: list[tuple[int, int]] = []
    for second, vertex in enumerate(vertices):
        cell = _cell(vertex, duplicate_vertex_epsilon_m)
        for neighbor in _neighbors(cell):
            for first in cells.get(neighbor, ()):
                if dist(vertices[first], vertex) <= duplicate_vertex_epsilon_m:
                    duplicate_pairs.append((first, second))
        cells[cell].append(second)
    duplicates = tuple(sorted(duplicate_pairs))
    if duplicates:
        failures.append("DUPLICATE_VERTEX")

    directed_uses: defaultdict[Edge, list[Edge]] = defaultdict(list)
    face_counter: Counter[tuple[int, int, int]] = Counter()
    degenerate = 0
    for triangle in triangles:
        if any(index < 0 or index >= len(vertices) for index in triangle):
            failures.append("INVALID_VERTEX_INDEX")
            continue
        sorted_triangle = sorted(triangle)
        face_counter[(sorted_triangle[0], sorted_triangle[1], sorted_triangle[2])] += 1
        if len(set(triangle)) < 3 or _area(vertices, triangle) <= area_epsilon_m2:
            degenerate += 1
        for start, end in zip(triangle, (*triangle[1:], triangle[0]), strict=True):
            directed_uses[(min(start, end), max(start, end))].append((start, end))
    duplicate_faces = sum(count - 1 for count in face_counter.values() if count > 1)
    boundary = tuple(sorted(edge for edge, uses in directed_uses.items() if len(uses) == 1))
    non_manifold = sum(1 for uses in directed_uses.values() if len(uses) > 2)
    conflicts = sum(1 for uses in directed_uses.values() if len(uses) == 2 and uses[0] == uses[1])
    triangle_edges = frozenset(directed_uses)
    wire = tuple(sorted(edge for edge in edges if (min(edge), max(edge)) not in triangle_edges))
    if wire:
        failures.append("WIRE_EDGE")
    if duplicate_faces:
        failures.append("DUPLICATE_FACE")
    if degenerate:
        failures.append("DEGENERATE_TRIANGLE")
    if conflicts:
        failures.append("WINDING_CONFLICT")
    if non_manifold:
        failures.append("NON_MANIFOLD_EDGE")
    actual_boundary = frozenset(boundary)
    if actual_boundary - declared_openings:
        failures.append("UNDECLARED_BOUNDARY")
    if actual_boundary != declared_openings:
        failures.append("DECLARED_OPENING_MISMATCH")
    return TopologyAudit(tuple(dict.fromkeys(failures)), boundary, wire, duplicates, duplicate_faces, degenerate, conflicts, non_manifold)


def audit_symmetry(
    vertices: Sequence[Vec3],
    plane_x_m: float,
    center_epsilon_m: float,
    match_tolerance_m: float,
) -> SymmetryAudit:
    """Match every off-center vertex to the nearest unused reflected vertex."""
    if any(not isfinite(value) for vertex in vertices for value in vertex):
        return SymmetryAudit(("NONFINITE_VERTEX",), 0, (), 0.0)
    off_center = [index for index, vertex in enumerate(vertices) if abs(vertex[0] - plane_x_m) > center_epsilon_m]
    cells: defaultdict[Cell, list[int]] = defaultdict(list)
    for vertex_id in off_center:
        cells[_cell(vertices[vertex_id], match_tolerance_m)].append(vertex_id)
    available = set(off_center)
    unmatched: list[int] = []
    maximum = 0.0
    for vertex_id in off_center:
        if vertex_id not in available:
            continue
        vertex = vertices[vertex_id]
        reflected = (2.0 * plane_x_m - vertex[0], vertex[1], vertex[2])
        nearby = (
            other_id
            for cell in _neighbors(_cell(reflected, match_tolerance_m))
            for other_id in cells.get(cell, ())
            if other_id in available and other_id != vertex_id
        )
        candidates = [(dist(reflected, vertices[other_id]), other_id) for other_id in nearby]
        if not candidates:
            unmatched.append(vertex_id)
            available.remove(vertex_id)
            continue
        error, match_id = min(candidates)
        if error > match_tolerance_m:
            unmatched.append(vertex_id)
            available.remove(vertex_id)
            continue
        maximum = max(maximum, error)
        available.remove(vertex_id)
        available.remove(match_id)
    unmatched.extend(sorted(available))
    failures = ("SYMMETRY_UNMATCHED_VERTEX",) if unmatched else ()
    return SymmetryAudit(failures, len(off_center), tuple(sorted(set(unmatched))), maximum)
