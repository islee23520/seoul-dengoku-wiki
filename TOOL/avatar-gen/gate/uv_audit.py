"""Exact positive-area overlap audit for extracted UV triangles.

All coordinates and area thresholds are in normalized UV units. The fixed
thresholds are calibrated for float64 arithmetic on a [0, 1] atlas: triangles
at or below 1e-14 UV² are degenerate, and intersections above 1e-13 UV² are
positive-area overlap. Boundary-only edge or point contact is allowed.
"""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Final

import numpy as np
from numpy.typing import NDArray

FloatArray = NDArray[np.float64]
MINIMUM_TRIANGLE_AREA_UV2: Final = 1e-14
OVERLAP_AREA_UV2: Final = 1e-13
ATLAS_MIN: Final = 0.0
ATLAS_MAX: Final = 1.0
BIN_RESOLUTION: Final = 256


@dataclass(frozen=True, slots=True)
class Overlap:
    triangle_ids: tuple[int, int]
    polygon_ids: tuple[int, int]
    area_uv2: float
    relative_to_smaller: float
    classification: str = "POSITIVE_AREA_OVERLAP"


@dataclass(frozen=True, slots=True)
class AuditResult:
    status: str
    triangle_count: int
    degenerate_triangle_ids: tuple[int, ...]
    overlaps: tuple[Overlap, ...]
    exact_intersection_tests: int
    hard_failures: tuple[str, ...]


def cross2d(first: FloatArray, second: FloatArray) -> float:
    """Return the scalar 2D cross product without deprecated np.cross usage."""
    return float(
        np.float64(first.item(0)) * np.float64(second.item(1))
        - np.float64(first.item(1)) * np.float64(second.item(0))
    )


def _intersection_area(first: FloatArray, second: FloatArray) -> float:
    polygon = [first[index, :].copy() for index in range(len(first))]
    clip = second if cross2d(second[1, :] - second[0, :], second[2, :] - second[0, :]) > 0 else second[::-1]
    for index in range(len(clip)):
        start, end = clip[index, :], clip[(index + 1) % len(clip), :]
        if not polygon:
            return 0.0
        output: list[FloatArray] = []
        previous = polygon[-1]
        edge = end - start
        previous_distance = cross2d(edge, previous - start)
        for current in polygon:
            distance = cross2d(edge, current - start)
            if (distance >= 0.0) != (previous_distance >= 0.0):
                ratio = previous_distance / (previous_distance - distance)
                output.append(previous + ratio * (current - previous))
            if distance >= 0.0:
                output.append(current)
            previous = current
            previous_distance = distance
        polygon = output
    if len(polygon) < 3:
        return 0.0
    points = np.asarray(polygon, dtype=np.float64)
    points -= points[0, :]
    doubled_area = np.sum(
        points[:, 0] * np.roll(points[:, 1], -1)
        - points[:, 1] * np.roll(points[:, 0], -1)
    )
    return float(abs(doubled_area) / 2.0)


def audit_triangles(
    triangles: FloatArray,
    polygon_ids: Sequence[int] | None = None,
) -> AuditResult:
    """Audit finite, nondegenerate, in-tile UV triangles and exact overlaps."""
    if triangles.ndim != 3 or triangles.shape[1:] != (3, 2):
        return AuditResult("FAIL", 0, (), (), 0, ("MALFORMED_TRIANGLE_SHAPE",))
    triangle_count = len(triangles)
    if triangle_count == 0:
        return AuditResult("FAIL", 0, (), (), 0, ("EMPTY_TRIANGLES",))
    if polygon_ids is None:
        polygon_ids = tuple(range(triangle_count))
    if len(polygon_ids) != triangle_count:
        return AuditResult("FAIL", triangle_count, (), (), 0, ("POLYGON_ID_COUNT_MISMATCH",))
    if not np.isfinite(triangles).all():
        return AuditResult("FAIL", triangle_count, (), (), 0, ("NONFINITE_UV",))
    if np.any(triangles < ATLAS_MIN) or np.any(triangles > ATLAS_MAX):
        return AuditResult("FAIL", triangle_count, (), (), 0, ("UV_OUT_OF_TILE",))

    first_edges = triangles[:, 1] - triangles[:, 0]
    second_edges = triangles[:, 2] - triangles[:, 0]
    areas = np.abs(
        first_edges[:, 0] * second_edges[:, 1]
        - first_edges[:, 1] * second_edges[:, 0]
    ) / 2.0
    degenerate = tuple(
        int(index) for index in np.flatnonzero(areas <= MINIMUM_TRIANGLE_AREA_UV2)
    )
    hard_failures: list[str] = []
    if degenerate:
        hard_failures.append("DEGENERATE_UV_TRIANGLE")

    lower = triangles.min(axis=1)
    upper = triangles.max(axis=1)
    cells: defaultdict[tuple[int, int], list[int]] = defaultdict(list)
    overlaps: list[Overlap] = []
    checked = 0
    for index in range(triangle_count):
        if areas[index] <= MINIMUM_TRIANGLE_AREA_UV2:
            continue
        lower_cell = np.floor(lower[index, :] * BIN_RESOLUTION).astype(np.int64)
        upper_cell = np.floor(upper[index, :] * BIN_RESOLUTION).astype(np.int64)
        bins = tuple(
            (x_coordinate, y_coordinate)
            for x_coordinate in range(lower_cell.item(0), upper_cell.item(0) + 1)
            for y_coordinate in range(lower_cell.item(1), upper_cell.item(1) + 1)
        )
        candidates = {candidate for cell in bins for candidate in cells[cell]}
        for other_index in candidates:
            bounding_overlap = np.minimum(upper[index, :], upper[other_index, :]) - np.maximum(
                lower[index, :], lower[other_index, :]
            )
            if not np.all(bounding_overlap > 0.0):
                continue
            checked += 1
            area = _intersection_area(triangles[index, :], triangles[other_index, :])
            if area <= OVERLAP_AREA_UV2:
                continue
            smaller_area = min(areas.item(index), areas.item(other_index))
            overlaps.append(
                Overlap(
                    triangle_ids=(other_index, index),
                    polygon_ids=(int(polygon_ids[other_index]), int(polygon_ids[index])),
                    area_uv2=area,
                    relative_to_smaller=area / smaller_area,
                )
            )
        for cell in bins:
            cells[cell].append(index)
    if overlaps:
        hard_failures.append("POSITIVE_AREA_UV_OVERLAP")
    return AuditResult(
        status="FAIL" if hard_failures else "PASS",
        triangle_count=triangle_count,
        degenerate_triangle_ids=degenerate,
        overlaps=tuple(overlaps),
        exact_intersection_tests=checked,
        hard_failures=tuple(hard_failures),
    )
