"""Independent world-space triangle intersection hard gate.

Tolerance is derived from the finite geometry extent rather than an assumed
meter scale.  The linear epsilon is ``extent * 1e-9`` (with a machine-spacing
floor); area decisions use ``extent**2 * 1e-16``.  A median AABB BVH supplies
candidate pairs, so full character meshes do not use an O(n²) face loop or a
spatial-grid expansion proportional to a triangle's bounding-box volume.
"""

from __future__ import annotations

from collections.abc import Hashable, Sequence
from dataclasses import dataclass
from typing import TypeAlias

import numpy as np
from numpy.typing import NDArray

FloatArray: TypeAlias = NDArray[np.float64]
VertexKey: TypeAlias = Hashable


@dataclass(frozen=True, slots=True)
class Contact:
    triangle_ids: tuple[int, int]
    classification: str
    shared_vertices: int
    intentional: bool
    measure: float


@dataclass(frozen=True, slots=True)
class AuditResult:
    status: str
    triangle_count: int
    tolerance_world_units: float
    area_tolerance_world_units2: float
    degenerate_triangle_ids: tuple[int, ...]
    intersections: tuple[Contact, ...]
    contacts: tuple[Contact, ...]
    topology_contacts: int
    broadphase_candidate_pairs: int
    exact_intersection_tests: int
    hard_failures: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class _Node:
    low: FloatArray
    high: FloatArray
    ids: NDArray[np.int64] | None
    left: _Node | None = None
    right: _Node | None = None


def _failure(code: str, triangle_count: int = 0) -> AuditResult:
    return AuditResult("FAIL", triangle_count, 0.0, 0.0, (), (), (), 0, 0, 0, (code,))


def _build_bvh(low: FloatArray, high: FloatArray, ids: NDArray[np.int64], leaf_size: int = 16) -> _Node:
    node_low = np.min(low[ids], axis=0)
    node_high = np.max(high[ids], axis=0)
    if len(ids) <= leaf_size:
        return _Node(node_low, node_high, ids)
    centers = (low[ids] + high[ids]) * 0.5
    axis = int(np.argmax(np.ptp(centers, axis=0)))
    order = ids[np.argsort(centers[:, axis], kind="stable")]
    middle = len(order) // 2
    return _Node(node_low, node_high, None, _build_bvh(low, high, order[:middle], leaf_size), _build_bvh(low, high, order[middle:], leaf_size))


def _boxes_overlap(first: _Node, second: _Node, epsilon: float) -> bool:
    return bool(np.all(np.minimum(first.high, second.high) - np.maximum(first.low, second.low) >= -epsilon))


def _candidate_pairs(root: _Node, epsilon: float) -> set[tuple[int, int]]:
    pairs: set[tuple[int, int]] = set()

    def visit(first: _Node, second: _Node, same: bool) -> None:
        if not _boxes_overlap(first, second, epsilon):
            return
        if first.ids is not None and second.ids is not None:
            if same:
                for offset in range(len(first.ids) - 1):
                    first_id = first.ids.item(offset)
                    for second_offset in range(offset + 1, len(first.ids)):
                        pairs.add((first_id, first.ids.item(second_offset)))
            else:
                for first_offset in range(len(first.ids)):
                    first_id = first.ids.item(first_offset)
                    for second_offset in range(len(second.ids)):
                        a, b = sorted((first_id, second.ids.item(second_offset)))
                        if a != b:
                            pairs.add((a, b))
            return
        if same:
            assert first.left is not None and first.right is not None
            visit(first.left, first.left, True)
            visit(first.left, first.right, False)
            visit(first.right, first.right, True)
            return
        first_span = float(np.max(first.high - first.low))
        second_span = float(np.max(second.high - second.low))
        if second.ids is not None or (first.ids is None and first_span >= second_span):
            assert first.left is not None and first.right is not None
            visit(first.left, second, False)
            visit(first.right, second, False)
        else:
            assert second.left is not None and second.right is not None
            visit(first, second.left, False)
            visit(first, second.right, False)

    visit(root, root, True)
    return pairs


def _cross2(first: FloatArray, second: FloatArray) -> float:
    return float(
        np.float64(first.item(0)) * np.float64(second.item(1))
        - np.float64(first.item(1)) * np.float64(second.item(0))
    )


def _spacing(value: float) -> float:
    """Keep the float64 ufunc result typed through scalar extraction."""
    spacing: FloatArray = np.spacing(np.asarray(value, dtype=np.float64))
    return spacing.item()


def _coplanar_area(first: FloatArray, second: FloatArray, normal: FloatArray, epsilon: float) -> float:
    axis = int(np.argmax(np.abs(normal)))
    first_2d = np.delete(first, axis, axis=1)
    second_2d = np.delete(second, axis, axis=1)
    polygon = [first_2d[index, :].copy() for index in range(len(first_2d))]
    clip = second_2d if _cross2(second_2d[1, :] - second_2d[0, :], second_2d[2, :] - second_2d[0, :]) > 0 else second_2d[::-1]
    for index in range(len(clip)):
        start, end = clip[index, :], clip[(index + 1) % len(clip), :]
        if not polygon:
            return 0.0
        output: list[FloatArray] = []
        previous = polygon[-1]
        edge = end - start
        edge_length = float(np.linalg.norm(edge))
        edge_area_epsilon = epsilon * edge_length
        previous_distance = _cross2(edge, previous - start)
        for current in polygon:
            distance = _cross2(edge, current - start)
            previous_inside = previous_distance >= -edge_area_epsilon
            current_inside = distance >= -edge_area_epsilon
            if current_inside != previous_inside:
                denominator = previous_distance - distance
                if denominator != 0.0:
                    output.append(previous + (previous_distance / denominator) * (current - previous))
            if current_inside:
                output.append(current)
            previous = current
            previous_distance = distance
        polygon = output
    if len(polygon) < 3:
        return 0.0
    points = np.asarray(polygon, dtype=np.float64)
    doubled = np.sum(points[:, 0] * np.roll(points[:, 1], -1) - points[:, 1] * np.roll(points[:, 0], -1))
    projected_area = abs(float(doubled)) * 0.5
    return projected_area * float(np.linalg.norm(normal)) / abs(normal.item(axis))


def _plane_cut(points: FloatArray, distances: FloatArray, epsilon: float) -> list[FloatArray]:
    _ = epsilon  # Retain the call contract; membership uses only local roundoff.
    result: list[FloatArray] = []
    # Plane membership is a local roundoff question, not the scene's contact
    # tolerance. A broad epsilon turns nearby non-coplanar corners into a fake
    # intersection segment when unrelated distant geometry enlarges the scene.
    absolute_points: FloatArray = np.abs(points)
    coordinate_scale = float(np.max(absolute_points))
    plane_epsilon = max(_spacing(coordinate_scale) * 64.0, np.finfo(np.float64).tiny)
    for index in range(3):
        following = (index + 1) % 3
        distance = np.float64(distances.item(index))
        following_distance = np.float64(distances.item(following))
        if abs(float(distance)) <= plane_epsilon:
            result.append(points[index, :])
        if ((distance > plane_epsilon and following_distance < -plane_epsilon)
                or (distance < -plane_epsilon and following_distance > plane_epsilon)):
            ratio = float(distance / (distance - following_distance))
            result.append(points[index, :] + ratio * (points[following, :] - points[index, :]))
    return result


def _classify_pair(
    first_id: int,
    second_id: int,
    points: FloatArray,
    normals: FloatArray,
    epsilon: float,
    area_epsilon: float,
    shared_vertices: int,
    shared_positions: FloatArray,
) -> Contact | None:
    first, second = points[first_id, :], points[second_id, :]
    first_distances: FloatArray = (first - second[0, :]) @ normals[second_id, :]
    second_distances: FloatArray = (second - first[0, :]) @ normals[first_id, :]
    if (
        np.all(first_distances > epsilon)
        or np.all(first_distances < -epsilon)
        or np.all(second_distances > epsilon)
        or np.all(second_distances < -epsilon)
    ):
        return None
    line = np.cross(normals[first_id, :], normals[second_id, :])
    line_length = float(np.linalg.norm(line))
    if line_length <= 1e-8:
        absolute_first: FloatArray = np.abs(first_distances)
        absolute_second: FloatArray = np.abs(second_distances)
        if max(float(np.max(absolute_first)), float(np.max(absolute_second))) > epsilon:
            return None
        area = _coplanar_area(first, second, normals[first_id, :], epsilon)
        if area > area_epsilon:
            return Contact((first_id, second_id), "COPLANAR_POSITIVE_AREA", shared_vertices, False, area)
        if shared_vertices:
            return Contact((first_id, second_id), "TOPOLOGY_CONTACT", shared_vertices, True, area)
        return Contact((first_id, second_id), "POINT_OR_EDGE_CONTACT", 0, False, area)
    line /= line_length
    first_cut = _plane_cut(first, first_distances, epsilon)
    second_cut = _plane_cut(second, second_distances, epsilon)
    if not first_cut or not second_cut:
        return None
    origin = first[0, :]
    first_interval: FloatArray = (np.asarray(first_cut, dtype=np.float64) - origin) @ line
    second_interval: FloatArray = (np.asarray(second_cut, dtype=np.float64) - origin) @ line
    lower = max(float(np.min(first_interval)), float(np.min(second_interval)))
    upper = min(float(np.max(first_interval)), float(np.max(second_interval)))
    if upper < lower - epsilon:
        return None
    overlap = max(0.0, upper - lower)
    if shared_vertices == 2 and len(shared_positions) == 2:
        shared_interval: FloatArray = (shared_positions - origin) @ line
        if lower >= float(np.min(shared_interval)) - epsilon and upper <= float(np.max(shared_interval)) + epsilon:
            return Contact((first_id, second_id), "TOPOLOGY_CONTACT", 2, True, overlap)
    if overlap > epsilon:
        return Contact((first_id, second_id), "PROPER_INTERSECTION", shared_vertices, False, overlap)
    if shared_vertices:
        return Contact((first_id, second_id), "TOPOLOGY_CONTACT", shared_vertices, True, overlap)
    return Contact((first_id, second_id), "POINT_CONTACT", 0, False, overlap)


def audit_triangle_soup(
    triangles: object,
    vertex_keys: Sequence[Sequence[VertexKey]] | None = None,
) -> AuditResult:
    """Audit an independent triangle soup with optional topology vertex keys."""
    try:
        points = np.asarray(triangles, dtype=np.float64)
    except (TypeError, ValueError):
        return _failure("MALFORMED_TRIANGLE_SHAPE")
    if points.ndim != 3 or points.shape[1:] != (3, 3):
        return _failure("MALFORMED_TRIANGLE_SHAPE")
    triangle_count = len(points)
    if triangle_count == 0:
        return _failure("EMPTY_TRIANGLES")
    if not np.isfinite(points).all():
        return _failure("NONFINITE_POSITION", triangle_count)
    if vertex_keys is None:
        keys: tuple[tuple[VertexKey, VertexKey, VertexKey], ...] = tuple(
            (("triangle", triangle_id, 0), ("triangle", triangle_id, 1), ("triangle", triangle_id, 2))
            for triangle_id in range(triangle_count)
        )
    else:
        if len(vertex_keys) != triangle_count or any(len(item) != 3 for item in vertex_keys):
            return _failure("VERTEX_KEY_COUNT_MISMATCH", triangle_count)
        keys = tuple((item[0], item[1], item[2]) for item in vertex_keys)
        try:
            for triangle_keys in keys:
                _ = set(triangle_keys)
        except TypeError:
            return _failure("MALFORMED_VERTEX_KEY", triangle_count)

    flattened = points.reshape((-1, 3))
    extent = float(np.max(np.ptp(flattened, axis=0)))
    if extent == 0.0:
        return AuditResult("FAIL", triangle_count, 0.0, 0.0, tuple(range(triangle_count)), (), (), 0, 0, 0, ("DEGENERATE_TRIANGLE",))
    epsilon = max(extent * 1e-9, _spacing(extent) * 64.0)
    area_epsilon = max(extent * extent * 1e-16, _spacing(extent * extent) * 64.0)
    crosses = np.cross(points[:, 1] - points[:, 0], points[:, 2] - points[:, 0])
    doubled_areas = np.linalg.norm(crosses, axis=1)
    degenerate = tuple(int(index) for index in np.flatnonzero(doubled_areas <= area_epsilon * 2.0))
    valid = np.flatnonzero(doubled_areas > area_epsilon * 2.0).astype(np.int64)
    normals = crosses / np.maximum(doubled_areas[:, None], np.finfo(np.float64).tiny)
    intersections: list[Contact] = []
    contacts: list[Contact] = []
    topology_contacts = 0
    candidates: set[tuple[int, int]] = set()
    if len(valid) > 1:
        low, high = np.min(points, axis=1), np.max(points, axis=1)
        candidates = _candidate_pairs(_build_bvh(low, high, valid), epsilon)
        for first_id, second_id in sorted(candidates):
            if not np.all(np.minimum(high[first_id, :], high[second_id, :]) - np.maximum(low[first_id, :], low[second_id, :]) >= -epsilon):
                continue
            shared_keys = set(keys[first_id]).intersection(keys[second_id])
            shared_positions = np.asarray(
                [points[first_id, keys[first_id].index(key), :] for key in shared_keys], dtype=np.float64
            )
            classified = _classify_pair(first_id, second_id, points, normals, epsilon, area_epsilon, len(shared_keys), shared_positions)
            if classified is None:
                continue
            if classified.classification in {"PROPER_INTERSECTION", "COPLANAR_POSITIVE_AREA"}:
                intersections.append(classified)
            elif classified.classification == "TOPOLOGY_CONTACT":
                topology_contacts += 1
            else:
                contacts.append(classified)
    failures: list[str] = []
    if degenerate:
        failures.append("DEGENERATE_TRIANGLE")
    if intersections:
        failures.append("TRIANGLE_INTERSECTION")
    return AuditResult(
        "FAIL" if failures else "PASS",
        triangle_count,
        epsilon,
        area_epsilon,
        degenerate,
        tuple(intersections),
        tuple(contacts),
        topology_contacts,
        len(candidates),
        len(candidates),
        tuple(failures),
    )


def audit_indexed_mesh(positions: object, triangles: object, object_name: str = "Mesh") -> AuditResult:
    """Validate indexed data without coercing malformed indices, then audit it."""
    try:
        vertices = np.asarray(positions, dtype=np.float64)
    except (TypeError, ValueError):
        return _failure("MALFORMED_POSITION_SHAPE")
    if vertices.ndim != 2 or vertices.shape[1:] != (3,):
        return _failure("MALFORMED_POSITION_SHAPE")
    if not np.isfinite(vertices).all():
        return _failure("NONFINITE_POSITION")
    raw_indices = np.asarray(triangles)
    if raw_indices.ndim != 2 or raw_indices.shape[1:] != (3,):
        return _failure("MALFORMED_TRIANGLE_INDEX")
    if raw_indices.dtype.kind not in {"i", "u"}:
        return _failure("MALFORMED_TRIANGLE_INDEX", len(raw_indices))
    indices = raw_indices.astype(np.int64, copy=False)
    if len(indices) == 0:
        return _failure("EMPTY_TRIANGLES")
    if np.any(indices < 0) or np.any(indices >= len(vertices)):
        return _failure("INVALID_TRIANGLE_INDEX", len(indices))
    keys = tuple(
        tuple((object_name, indices.item(triangle_id, corner)) for corner in range(3))
        for triangle_id in range(len(indices))
    )
    return audit_triangle_soup(vertices[indices], keys)
