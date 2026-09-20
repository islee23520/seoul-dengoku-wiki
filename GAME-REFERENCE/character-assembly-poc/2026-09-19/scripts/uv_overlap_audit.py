# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy"]
# ///
"""Test positive-area UV intersections, ignoring shared edges and point contacts."""
import argparse
import json
from collections import defaultdict
from pathlib import Path

import numpy as np


def intersection_area(first: np.ndarray, second: np.ndarray) -> float:
    """Sutherland-Hodgman clipping of two convex triangles, in float64."""
    polygon = [p.copy() for p in first]
    signed = np.cross(second[1] - second[0], second[2] - second[0]).item()
    clip = second if signed > 0 else second[::-1]
    for a, b in zip(clip, np.roll(clip, -1, axis=0)):
        if not polygon:
            return 0.0
        output = []
        previous = polygon[-1]
        edge = b - a
        prev_distance = edge[0] * (previous[1] - a[1]) - edge[1] * (previous[0] - a[0])
        for current in polygon:
            distance = edge[0] * (current[1] - a[1]) - edge[1] * (current[0] - a[0])
            if (distance >= 0) != (prev_distance >= 0):
                t = prev_distance / (prev_distance - distance)
                output.append(previous + t * (current - previous))
            if distance >= 0:
                output.append(current)
            previous, prev_distance = current, distance
        polygon = output
    if len(polygon) < 3:
        return 0.0
    points = np.array(polygon)
    # Translate first to avoid cancellation for tiny atlas triangles.
    points -= points[0]
    return float(abs(np.sum(points[:, 0] * np.roll(points[:, 1], -1) - points[:, 1] * np.roll(points[:, 0], -1))) / 2)


def audit(triangles: np.ndarray, minimum_area=1e-14, overlap_area=1e-13) -> dict:
    """Spatial bins only prune candidates; final intersections use polygon area."""
    assert triangles.ndim == 3 and triangles.shape[1:] == (3, 2)
    if not np.isfinite(triangles).all():
        return {'ok': False, 'reason': 'NONFINITE_UV'}
    a, b = triangles[:, 1] - triangles[:, 0], triangles[:, 2] - triangles[:, 0]
    areas = abs(a[:, 0] * b[:, 1] - a[:, 1] * b[:, 0]) / 2
    degenerate = np.flatnonzero(areas <= minimum_area).tolist()
    low, high = triangles.min(axis=1), triangles.max(axis=1)
    cells = defaultdict(list)
    resolution = 256
    intersections = []
    checked = 0
    for index, triangle in enumerate(triangles):
        if areas[index] <= minimum_area:
            continue
        lower = np.floor(low[index] * resolution).astype(int)
        upper = np.floor(high[index] * resolution).astype(int)
        bins = [(x, y) for x in range(lower[0], upper[0] + 1) for y in range(lower[1], upper[1] + 1)]
        candidates = set(j for cell in bins for j in cells[cell])
        if candidates:
            ids = np.fromiter(candidates, dtype=np.int64)
            ids = ids[np.all(np.minimum(high[ids], high[index]) - np.maximum(low[ids], low[index]) > 0, axis=1)]
            if len(ids):
                other = triangles[ids]
                surviving = np.ones(len(ids), bool)
                # Strict separating-axis test rejects edge-touching neighbors.
                for axis_index in range(6):
                    if axis_index < 3:
                        vector = triangle[(axis_index + 1) % 3] - triangle[axis_index]
                        normal = np.array([-vector[1], vector[0]])
                        projection1 = triangle @ normal
                        projection2 = other @ normal
                        overlap = np.minimum(projection1.max(), projection2.max(axis=1)) - np.maximum(projection1.min(), projection2.min(axis=1))
                    else:
                        k = axis_index - 3
                        vector = other[:, (k + 1) % 3] - other[:, k]
                        normal = np.c_[-vector[:, 1], vector[:, 0]]
                        projection1 = np.einsum('jd,nd->nj', triangle, normal)
                        projection2 = np.einsum('njd,nd->nj', other, normal)
                        overlap = np.minimum(projection1.max(axis=1), projection2.max(axis=1)) - np.maximum(projection1.min(axis=1), projection2.min(axis=1))
                    surviving &= overlap > 1e-15
                for other_index in ids[surviving]:
                    checked += 1
                    area = intersection_area(triangle, triangles[other_index])
                    if area > overlap_area:
                        intersections.append({'triangles': [int(other_index), index], 'area': area, 'relative_to_smaller': area / min(areas[index], areas[other_index])})
        for cell in bins:
            cells[cell].append(index)
    return {'ok': not degenerate and not intersections, 'triangles': len(triangles), 'degenerate_triangle_ids': degenerate, 'positive_area_overlap_pairs': intersections, 'exact_intersection_tests': checked, 'minimum_triangle_area': float(areas.min()), 'thresholds': {'minimum_triangle_area': minimum_area, 'intersection_area': overlap_area}, 'total_triangle_area': float(areas.sum())}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('input')
    parser.add_argument('output')
    args = parser.parse_args()
    loaded = np.load(args.input)
    result = audit(loaded['triangles'])
    Path(args.output).write_text(json.dumps(result, indent=2))
    print(json.dumps({'status': 'UV_AUDIT_PASS' if result['ok'] else 'UV_AUDIT_FAIL', 'degenerate': len(result.get('degenerate_triangle_ids', [])), 'overlap_pairs': len(result.get('positive_area_overlap_pairs', []))}), flush=True)
    raise SystemExit(0 if result['ok'] else 2)
