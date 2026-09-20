# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Fit local quadrics to healthy neighboring rows; diagnose patch-only dents."""
import json
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
targets = [('Male_Head_DollRepair', (.21335, -.20720, .33259)), ('Male_Body_DollRepair', (.08087, .00462, .53929))]
report = []
for name, target in targets:
    obj = bpy.data.objects[name]
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    bm.normal_update()
    tag = bm.faces.layers.int['VerifiedQuadRepair']
    remaining = {f for f in bm.faces if f[tag]}
    groups = []
    while remaining:
        start = remaining.pop()
        stack, faces = [start], {start}
        while stack:
            face = stack.pop()
            for edge in face.edges:
                for other in edge.link_faces:
                    if other in remaining:
                        remaining.remove(other)
                        faces.add(other)
                        stack.append(other)
        groups.append(faces)
    patch = min(groups, key=lambda fs: np.linalg.norm(np.mean([tuple(v.co) for f in fs for v in f.verts], axis=0) - np.array(target)))
    patch_vertices = {v for f in patch for v in f.verts}
    patch_indices = {v.index for v in patch_vertices}
    distances = {v: 0 for v in patch_vertices}
    frontier = patch_vertices
    for depth in range(1, 7):
        following = {edge.other_vert(v) for v in frontier for edge in v.link_edges} - set(distances)
        for v in following:
            distances[v] = depth
        frontier = following
    origin = np.mean([tuple(v.co) for v in patch_vertices], axis=0)
    perimeter = [v for v in patch_vertices if any(f not in patch for f in v.link_faces)]
    normal = np.mean([tuple(v.normal) for v in perimeter], axis=0)
    normal /= np.linalg.norm(normal)
    patch_radius = max(np.linalg.norm(np.array(v.co) - origin) for v in patch_vertices)
    sample = [v for v, d in distances.items() if 1 <= d <= 3 and not any(f[tag] for f in v.link_faces) and np.linalg.norm(np.array(v.co) - origin) < patch_radius * 1.8 and np.dot(np.array(v.normal), normal) > .6]
    assert len(sample) >= 12, (name, len(sample))
    points = np.array([tuple(v.co) for v in sample])
    axis = np.eye(3)[np.argmin(np.abs(normal))]
    tangent = np.cross(normal, axis)
    tangent /= np.linalg.norm(tangent)
    bitangent = np.cross(normal, tangent)
    basis = np.stack([tangent, bitangent, normal], axis=1)
    local = (points - origin) @ basis
    scale = np.sqrt(np.mean(np.sum(local[:, :2] ** 2, axis=1)))
    uv = local[:, :2] / scale
    design = np.c_[np.ones(len(uv)), uv[:, 0], uv[:, 1], uv[:, 0] ** 2, uv[:, 0] * uv[:, 1], uv[:, 1] ** 2]
    distance_weights = np.exp(-np.sum(local[:, :2] ** 2, axis=1) / (2 * patch_radius ** 2))
    weights = distance_weights.copy()
    for iteration in range(5):
        coef = np.linalg.lstsq(design * np.sqrt(weights[:, None]), local[:, 2] * np.sqrt(weights), rcond=None)[0]
        residual = local[:, 2] - design @ coef
        sigma = max(np.median(np.abs(residual)) * 1.4826, 1e-8)
        weights = distance_weights * np.minimum(1, 1.5 * sigma / np.maximum(np.abs(residual), 1e-12))
    changes = []
    for vertex, distance in distances.items():
        if distance > 2 or np.linalg.norm(np.array(vertex.co) - origin) > patch_radius * 1.5:
            continue
        p = (np.array(vertex.co) - origin) @ basis
        u, v = p[:2] / scale
        height = np.array([1, u, v, u*u, u*v, v*v]) @ coef
        displacement = height - p[2]
        weight = [1, .55, .15][distance]
        changes.append({'index': vertex.index, 'distance_rows': distance, 'position': list(vertex.co), 'signed_normal_delta': float(displacement), 'weight': weight})
    record = {'object': name, 'target': target, 'patch_faces': len(patch), 'patch_vertices': len(patch_vertices), 'fit_samples': len(sample), 'fit_rms': float(np.sqrt(np.mean(residual ** 2))), 'fit_median_absolute': float(np.median(abs(residual))), 'normal': normal.tolist(), 'basis': basis.tolist(), 'origin': origin.tolist(), 'scale': scale, 'coefficients': coef.tolist(), 'patch_delta_min': min(c['signed_normal_delta'] for c in changes if c['distance_rows'] == 0), 'patch_delta_max': max(c['signed_normal_delta'] for c in changes if c['distance_rows'] == 0), 'changes': changes}
    report.append(record)
    bm.free()
(ROOT / 'reports/patch-curvature-probe.json').write_text(json.dumps(report, indent=2))
print('PATCH_CURVATURE_PROBE_COMPLETE', flush=True)
