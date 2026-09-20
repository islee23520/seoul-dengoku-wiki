# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy"]
# ///
"""Triangle self-intersection checks for small isolated repair candidates.

Valid shared vertices/edges are allowed. Positive-area coplanar overlaps and
proper line intersections away from shared topology fail. Nonadjacent point
contacts are reported separately rather than mislabeled as penetration.
"""
import argparse
import json
from pathlib import Path

import numpy as np
from uv_overlap_audit import intersection_area


def plane_cut(points, distances, tolerance):
    result = []
    for i in range(3):
        j = (i + 1) % 3
        if abs(distances[i]) <= tolerance:
            result.append(points[i])
        if distances[i] * distances[j] < 0 and abs(distances[i]) > tolerance and abs(distances[j]) > tolerance:
            t = distances[i] / (distances[i] - distances[j])
            result.append(points[i] + t * (points[j] - points[i]))
    return result


def audit_intersections(positions, triangles):
    positions = np.asarray(positions, dtype=np.float64)
    triangles = np.asarray(triangles, dtype=np.int64)
    assert positions.ndim == 2 and positions.shape[1] == 3
    assert triangles.ndim == 2 and triangles.shape[1] == 3
    assert np.isfinite(positions).all()
    assert triangles.min() >= 0 and triangles.max() < len(positions)
    size = float(np.ptp(positions, axis=0).max())
    tolerance = max(size * 1e-8, 1e-10)
    points = positions[triangles]
    crosses = np.cross(points[:, 1] - points[:, 0], points[:, 2] - points[:, 0])
    lengths = np.linalg.norm(crosses, axis=1)
    degenerate = np.flatnonzero(lengths <= tolerance * tolerance)
    normals = crosses / np.maximum(lengths[:, None], 1e-30)
    low, high = points.min(axis=1), points.max(axis=1)
    hits, contacts = [], []
    for i in range(len(triangles)):
        if lengths[i] <= tolerance * tolerance:
            continue
        ids = np.arange(i + 1, len(triangles))
        ids = ids[np.all(np.minimum(high[ids], high[i]) - np.maximum(low[ids], low[i]) >= -tolerance, axis=1)]
        for j in ids:
            if lengths[j] <= tolerance * tolerance:
                continue
            shared = np.intersect1d(triangles[i], triangles[j])
            a, b = points[i], points[j]
            da = (a - b[0]) @ normals[j]
            db = (b - a[0]) @ normals[i]
            if np.all(da > tolerance) or np.all(da < -tolerance) or np.all(db > tolerance) or np.all(db < -tolerance):
                continue
            line = np.cross(normals[i], normals[j])
            line_length = float(np.linalg.norm(line))
            if line_length < 1e-10:
                if np.max(np.abs(db)) > tolerance:
                    continue
                axis = int(np.argmax(np.abs(normals[i])))
                projected_a = np.delete(a - a[0], axis, axis=1)
                projected_b = np.delete(b - a[0], axis, axis=1)
                area = intersection_area(projected_a, projected_b)
                if area > tolerance * tolerance:
                    hits.append({'triangles': [i, int(j)], 'type': 'COPLANAR_AREA', 'projected_area': area})
                continue
            line /= line_length
            cut_a = plane_cut(a, da, tolerance)
            cut_b = plane_cut(b, db, tolerance)
            if not cut_a or not cut_b:
                continue
            origin = a[0]
            interval_a = (np.array(cut_a) - origin) @ line
            interval_b = (np.array(cut_b) - origin) @ line
            lower = max(interval_a.min(), interval_b.min())
            upper = min(interval_a.max(), interval_b.max())
            if upper < lower - tolerance:
                continue
            overlap = float(upper - lower)
            if len(shared) == 2:
                shared_interval = (positions[shared] - origin) @ line
                if lower >= shared_interval.min() - tolerance and upper <= shared_interval.max() + tolerance:
                    continue
            if overlap <= tolerance:
                if not len(shared):
                    contacts.append({'triangles': [i, int(j)], 'type': 'NONADJACENT_POINT_CONTACT'})
            else:
                hits.append({'triangles': [i, int(j)], 'type': 'PROPER_INTERSECTION', 'segment_length': overlap, 'shared_vertices': len(shared)})
    return {'ok': not hits and not len(degenerate), 'triangles': len(triangles), 'tolerance_source_units': tolerance, 'degenerate_triangles': degenerate.tolist(), 'intersections': hits, 'point_contacts': contacts}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('input')
    parser.add_argument('output')
    args = parser.parse_args()
    data = np.load(args.input)
    result = audit_intersections(data['positions'], data['triangles'])
    Path(args.output).write_text(json.dumps(result, indent=2))
    print(json.dumps({'status': 'TRIANGLE_INTERSECTION_PASS' if result['ok'] else 'TRIANGLE_INTERSECTION_FAIL', 'intersections': len(result['intersections']), 'point_contacts': len(result['point_contacts'])}), flush=True)
    raise SystemExit(0 if result['ok'] else 2)
