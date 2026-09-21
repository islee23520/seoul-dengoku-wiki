"""Blender-side source inventory, boundary classification and bilateral audit."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector
from mathutils.kdtree import KDTree


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--job", type=Path, required=True)
    parser.add_argument("--symmetry-plane-x", type=float, default=0.0)
    parser.add_argument("--center-epsilon", type=float, default=0.00001)
    parser.add_argument("--match-tolerance", type=float, default=0.001)
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])


def boundary_cycles(mesh: bpy.types.Mesh) -> list[list[int]]:
    bm = bmesh.new()
    try:
        bm.from_mesh(mesh)
        bm.verts.ensure_lookup_table()
        boundary = {edge for edge in bm.edges if edge.is_boundary}
        cycles: list[list[int]] = []
        while boundary:
            first = boundary.pop()
            cycle = [first.verts[0].index, first.verts[1].index]
            current = first.verts[1]
            while True:
                candidates = [edge for edge in current.link_edges if edge in boundary]
                if not candidates:
                    break
                edge = candidates[0]
                boundary.remove(edge)
                current = edge.other_vert(current)
                if current.index == cycle[0]:
                    break
                cycle.append(current.index)
            cycles.append(cycle)
        return cycles
    finally:
        bm.free()


def declared_boundary_roles(obj: bpy.types.Object) -> list[str]:
    raw = obj.get("avatar_boundary_roles")
    if not isinstance(raw, str):
        return []
    return [value.strip() for value in raw.split(",") if value.strip()]


def centerline_duplicate_pairs(vertices: list[Vector], plane_x: float, center_epsilon: float, threshold: float) -> int:
    center = [(index, point) for index, point in enumerate(vertices) if abs(point.x - plane_x) <= center_epsilon]
    count = 0
    for position, (_, point) in enumerate(center):
        count += sum((other - point).length <= threshold for _, other in center[position + 1 :])
    return count


def triangle_area(a: Vector, b: Vector, c: Vector) -> float:
    return (b - a).cross(c - a).length * 0.5


def bilateral(vertices: list[Vector], plane_x: float, center_epsilon: float, tolerance: float, requested: bool) -> dict[str, object]:
    left = [(index, point) for index, point in enumerate(vertices) if point.x < plane_x - center_epsilon]
    right = [(index, point) for index, point in enumerate(vertices) if point.x > plane_x + center_epsilon]
    eligible = bool(left and right and min(len(left), len(right)) / max(len(left), len(right)) >= 0.5)
    tree = KDTree(len(right))
    for index, point in right:
        tree.insert(point, index)
    tree.balance()
    unmatched = 0
    maximum_error = 0.0
    for _, point in left:
        target = Vector((2 * plane_x - point.x, point.y, point.z))
        _, _, distance = tree.find(target) if right else (None, None, math.inf)
        if distance > tolerance:
            unmatched += 1
        maximum_error = max(maximum_error, float(distance))
    checked = len(left)
    coverage = 1.0 if checked == 0 else (checked - unmatched) / checked
    return {
        "requested": requested,
        "eligible": eligible,
        "plane_x_m": plane_x,
        "match_coverage": coverage,
        "maximum_error_m": maximum_error,
        "match_tolerance_m": tolerance,
        "left_vertex_count": len(left),
        "right_vertex_count": len(right),
        "left_hard_issue_count": None,
        "right_hard_issue_count": None,
        "recommended_donor": None,
        "donor_status": "UNPROVEN_SIDE_LOCAL_METRICS_REQUIRED" if requested and eligible else "NOT_APPLICABLE",
        "weld_threshold_m": center_epsilon,
    }


def main() -> int:
    parsed = args()
    job = json.loads(parsed.job.read_text(encoding="utf-8"))
    requested_symmetry = bool(job.get("symmetry_requested"))
    source = Path(bpy.data.filepath).resolve()
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    objects: list[dict[str, object]] = []
    scene_min = Vector((math.inf, math.inf, math.inf))
    scene_max = Vector((-math.inf, -math.inf, -math.inf))
    for obj in sorted(bpy.context.scene.objects, key=lambda value: value.name):
        if obj.type != "MESH":
            continue
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh(preserve_all_data_layers=True, depsgraph=depsgraph)
        try:
            mesh.calc_loop_triangles()
            world = evaluated.matrix_world
            vertices = [world @ vertex.co for vertex in mesh.vertices]
            if vertices:
                minimum = Vector(tuple(min(point[axis] for point in vertices) for axis in range(3)))
                maximum = Vector(tuple(max(point[axis] for point in vertices) for axis in range(3)))
                for axis in range(3):
                    scene_min[axis] = min(scene_min[axis], minimum[axis])
                    scene_max[axis] = max(scene_max[axis], maximum[axis])
            else:
                minimum = maximum = Vector()
            cycles = boundary_cycles(mesh)
            classified = []
            unexpected = []
            roles = declared_boundary_roles(obj)
            for cycle_index, cycle in enumerate(cycles):
                semantic = roles[cycle_index] if cycle_index < len(roles) else None
                entry = {"semantic_id": semantic, "vertex_count": len(cycle), "vertex_ids": cycle}
                (classified if semantic else unexpected).append(entry)
            degenerates = sum(1 for tri in mesh.loop_triangles if triangle_area(*(vertices[index] for index in tri.vertices)) <= 1e-12)
            edge_faces: dict[tuple[int, int], int] = {}
            winding: dict[tuple[int, int], list[tuple[int, int]]] = {}
            duplicate_faces: set[tuple[int, ...]] = set()
            seen_faces: set[tuple[int, ...]] = set()
            for polygon in mesh.polygons:
                key = tuple(sorted(int(index) for index in polygon.vertices))
                if key in seen_faces:
                    duplicate_faces.add(key)
                seen_faces.add(key)
                ids = [int(index) for index in polygon.vertices]
                for a, b in zip(ids, ids[1:] + ids[:1], strict=True):
                    edge_key = (min(a, b), max(a, b))
                    edge_faces[edge_key] = edge_faces.get(edge_key, 0) + 1
                    winding.setdefault(edge_key, []).append((a, b))
            non_manifold = sum(count > 2 for count in edge_faces.values())
            wire_edges = sum((min(int(edge.vertices[0]), int(edge.vertices[1])), max(int(edge.vertices[0]), int(edge.vertices[1]))) not in edge_faces for edge in mesh.edges)
            winding_conflicts = sum(len(directions) == 2 and directions[0] == directions[1] for directions in winding.values())
            hard_failures = []
            if not vertices or not mesh.loop_triangles:
                hard_failures.append("EMPTY_MESH")
            if any(not math.isfinite(value) for point in vertices for value in point):
                hard_failures.append("NON_FINITE_GEOMETRY")
            if unexpected:
                hard_failures.append("UNEXPECTED_BOUNDARY")
            if degenerates:
                hard_failures.append("DEGENERATE_TRIANGLE")
            if duplicate_faces:
                hard_failures.append("DUPLICATE_FACE")
            if non_manifold:
                hard_failures.append("NON_MANIFOLD_EDGE")
            if wire_edges:
                hard_failures.append("WIRE_EDGE")
            if winding_conflicts:
                hard_failures.append("WINDING_CONFLICT")
            duplicate_center = centerline_duplicate_pairs(vertices, parsed.symmetry_plane_x, parsed.center_epsilon, parsed.center_epsilon)
            if duplicate_center:
                hard_failures.append("CENTERLINE_DUPLICATE")
            objects.append({
                "object_name": obj.name,
                "vertex_count": len(vertices),
                "triangle_count": len(mesh.loop_triangles),
                "material_count": len(mesh.materials),
                "uv_layers": [layer.name for layer in mesh.uv_layers],
                "bounds_world": {"min": list(minimum), "max": list(maximum)},
                "declared_openings": classified,
                "unexpected_boundaries": unexpected,
                "degenerate_triangle_count": degenerates,
                "duplicate_face_count": len(duplicate_faces),
                "non_manifold_edge_count": non_manifold,
                "winding_conflict_count": winding_conflicts,
                "wire_edge_count": wire_edges,
                "centerline_duplicate_pair_count": duplicate_center,
                "centerline_weld_threshold_m": parsed.center_epsilon,
                "inconsistent_normals": winding_conflicts > 0,
                "hard_failures": hard_failures,
                "symmetry": bilateral(vertices, parsed.symmetry_plane_x, parsed.center_epsilon, parsed.match_tolerance, requested_symmetry),
            })
        finally:
            evaluated.to_mesh_clear()
    scene_empty = not objects
    scene_hard_failures = sorted({failure for item in objects for failure in item["hard_failures"]})
    if scene_empty:
        scene_hard_failures.append("EMPTY_MESH")
        scene_min = scene_max = Vector((0.0, 0.0, 0.0))
    payload = {
        "schema_version": 1,
        "contract_id": job.get("contract_id"),
        "source": {"path": str(source), "sha256": sha256(source), "blender_version": bpy.app.version_string},
        "coordinate_system": {"unit": "meter", "up": "+Z", "forward": "-Y", "space": "world"},
        "scene_bounds_world": {"min": list(scene_min), "max": list(scene_max)},
        "objects": objects,
        "hard_failures": scene_hard_failures,
        "unproven": ["SELF_INTERSECTION", "UV_OVERLAP", "TEXTURE_CONTINUITY", "VISUAL_REVIEW", "FBX_REIMPORT", "HOLDOUT_REPRODUCTION", "REQUIRED_ROLES", "PROTECTED_OPENING_PRESERVATION", "EXTERNAL_TEXTURES"],
    }
    parsed.output.parent.mkdir(parents=True, exist_ok=True)
    parsed.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"AVATAR_MESH_AUDIT_OK objects={len(objects)} output={parsed.output}")
    return 0


raise SystemExit(main())
