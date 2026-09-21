"""Parse geometry extraction JSON and emit a strict independent verdict."""

from __future__ import annotations

import argparse
import json
from math import dist, isfinite
from pathlib import Path
from typing import TypeAlias, TypeIs, TypedDict, final

from .geometry_audit import audit_symmetry, audit_topology
from .json_values import is_object_array, is_object_mapping, load_json

Vec3: TypeAlias = tuple[float, float, float]


class Check(TypedDict):
    check_id: str
    object_name: str
    status: str
    hard_failures: list[str]
    measurements: dict[str, int | float | str]


class Report(TypedDict):
    schema_version: int
    status: str
    criteria_version: str
    source: dict[str, str]
    hard_failures: list[str]
    unproven: list[str]
    checks: list[Check]


@final
class Arguments(argparse.Namespace):
    def __init__(self) -> None:
        super().__init__()
        self.input: Path = Path()
        self.manifest_path: Path | None = None
        self.output: Path = Path()


def _error(failure: str) -> Report:
    return {"schema_version": 1, "status": "ERROR", "criteria_version": "round2-geometry-hard-gate-v1", "source": {}, "hard_failures": [failure], "unproven": ["GEOMETRY_EXTRACTION_AUDIT"], "checks": []}


def _vec3_list(raw: object) -> list[Vec3] | None:
    if not is_object_array(raw):
        return None
    result: list[Vec3] = []
    for item in raw:
        if not _is_number_array(item) or len(item) != 3:
            return None
        result.append((float(item[0]), float(item[1]), float(item[2])))
    return result


def _edge_list(raw: object) -> list[tuple[int, int]] | None:
    if not is_object_array(raw):
        return None
    result: list[tuple[int, int]] = []
    for item in raw:
        if not _is_int_array(item) or len(item) != 2:
            return None
        result.append((item[0], item[1]))
    return result


def _triangle_list(raw: object) -> list[tuple[int, int, int]] | None:
    if not is_object_array(raw):
        return None
    result: list[tuple[int, int, int]] = []
    for item in raw:
        if not _is_int_array(item) or len(item) != 3:
            return None
        result.append((item[0], item[1], item[2]))
    return result


def _is_number_array(value: object) -> TypeIs[list[int | float]]:
    return is_object_array(value) and all(isinstance(item, int | float) for item in value)


def _is_int_array(value: object) -> TypeIs[list[int]]:
    return is_object_array(value) and all(type(item) is int for item in value)


def audit_extraction(payload: dict[str, object]) -> Report:
    """Audit topology, symmetry, protected points, role placement and ratios."""
    if payload.get("schema_version") != 1 or payload.get("criteria_version") != "round2-geometry-hard-gate-v1":
        return _error("MALFORMED_EXTRACTION_JSON")
    source, criteria, raw_meshes = payload.get("source"), payload.get("criteria"), payload.get("meshes")
    if not is_object_mapping(source) or not is_object_mapping(criteria) or not is_object_array(raw_meshes) or not raw_meshes:
        return _error("MALFORMED_EXTRACTION_JSON")
    source_path, source_hash, blender_version = source.get("path"), source.get("sha256"), source.get("blender_version")
    if not isinstance(source_path, str) or not isinstance(source_hash, str) or len(source_hash) != 64 or not isinstance(blender_version, str):
        return _error("MALFORMED_EXTRACTION_JSON")
    area_epsilon, duplicate_epsilon = criteria.get("area_epsilon_m2"), criteria.get("duplicate_vertex_epsilon_m")
    symmetry_config, openings_config = criteria.get("symmetry"), criteria.get("declared_openings")
    protected_config, roles_config, ratios_config = criteria.get("protected_vertices"), criteria.get("required_roles"), criteria.get("ratio_targets")
    if not isinstance(area_epsilon, int | float) or not isinstance(duplicate_epsilon, int | float) or not is_object_mapping(symmetry_config) or not is_object_mapping(openings_config) or not is_object_mapping(protected_config) or not is_object_mapping(roles_config) or not is_object_mapping(ratios_config):
        return _error("MALFORMED_EXTRACTION_JSON")
    if not isfinite(area_epsilon) or not isfinite(duplicate_epsilon) or area_epsilon <= 0 or duplicate_epsilon <= 0:
        return _error("INVALID_NUMERIC_CRITERIA")

    meshes: dict[str, dict[str, object]] = {}
    parsed_vertices: dict[str, list[Vec3]] = {}
    checks: list[Check] = []
    hard_failures: list[str] = []
    for raw_mesh in raw_meshes:
        if not is_object_mapping(raw_mesh):
            return _error("MALFORMED_EXTRACTION_JSON")
        name = raw_mesh.get("object_name")
        if not isinstance(name, str):
            return _error("MALFORMED_EXTRACTION_JSON")
        meshes[name] = raw_mesh
        vertices = _vec3_list(raw_mesh.get("vertices"))
        raw_edges, raw_triangles = _edge_list(raw_mesh.get("edges")), _triangle_list(raw_mesh.get("triangles"))
        if vertices is None or raw_edges is None or raw_triangles is None:
            return _error("MALFORMED_EXTRACTION_JSON")
        parsed_vertices[name] = vertices
        status = raw_mesh.get("status")
        if status != "OK":
            hard_failures.append(str(status))
            continue
        raw_openings = openings_config.get(name, [])
        parsed_openings = _edge_list(raw_openings)
        if parsed_openings is None:
            return _error("MALFORMED_EXTRACTION_JSON")
        topology = audit_topology(vertices, raw_edges, raw_triangles, frozenset((min(edge), max(edge)) for edge in parsed_openings), float(area_epsilon), float(duplicate_epsilon))
        failures = list(topology.failures)
        hard_failures.extend(failures)
        topology_check: Check = {"check_id": "geometry-topology", "object_name": name, "status": "FAIL" if failures else "PASS", "hard_failures": failures, "measurements": {"vertex_count": len(vertices), "triangle_count": len(raw_triangles), "boundary_edge_count": len(topology.boundary_edges), "wire_edge_count": len(topology.wire_edges), "duplicate_vertex_pair_count": len(topology.duplicate_vertex_pairs), "duplicate_face_count": topology.duplicate_faces, "degenerate_triangle_count": topology.degenerate_triangles, "winding_conflict_count": topology.winding_conflicts, "non_manifold_edge_count": topology.non_manifold_edges}}
        checks.append(topology_check)

    for name, raw_config in symmetry_config.items():
        if not is_object_mapping(raw_config) or name not in parsed_vertices:
            return _error("MALFORMED_EXTRACTION_JSON")
        plane, center, tolerance = raw_config.get("plane_x_m"), raw_config.get("center_epsilon_m"), raw_config.get("match_tolerance_m")
        if not isinstance(plane, int | float) or not isinstance(center, int | float) or not isinstance(tolerance, int | float):
            return _error("MALFORMED_EXTRACTION_JSON")
        if not all(isfinite(value) for value in (plane, center, tolerance)) or center < 0 or tolerance <= 0:
            return _error("INVALID_NUMERIC_CRITERIA")
        symmetry = audit_symmetry(parsed_vertices[name], float(plane), float(center), float(tolerance))
        failures = list(symmetry.failures)
        hard_failures.extend(failures)
        checks.append({"check_id": "geometry-symmetry", "object_name": name, "status": "FAIL" if failures else "PASS", "hard_failures": failures, "measurements": {"checked_vertex_count": symmetry.checked_vertex_count, "unmatched_vertex_count": len(symmetry.unmatched_vertex_ids), "maximum_reflection_error_m": symmetry.maximum_reflection_error_m}})

    for name, raw_points in protected_config.items():
        if name not in parsed_vertices or not is_object_array(raw_points):
            return _error("MALFORMED_EXTRACTION_JSON")
        moved = 0
        for raw_point in raw_points:
            if not is_object_mapping(raw_point) or type(raw_point.get("vertex_id")) is not int or not isinstance(raw_point.get("tolerance_m"), int | float):
                return _error("MALFORMED_EXTRACTION_JSON")
            expected = _vec3_list([raw_point.get("expected_world")])
            vertex_id = raw_point["vertex_id"]
            tolerance_m = raw_point["tolerance_m"]
            if expected is None or not isinstance(vertex_id, int) or not isinstance(tolerance_m, int | float) or vertex_id < 0:
                return _error("MALFORMED_EXTRACTION_JSON")
            if not isfinite(tolerance_m) or tolerance_m < 0 or any(not isfinite(value) for value in expected[0]):
                return _error("INVALID_NUMERIC_CRITERIA")
            if vertex_id >= len(parsed_vertices[name]):
                moved += 1
                continue
            moved += dist(expected[0], parsed_vertices[name][vertex_id]) > float(tolerance_m)
        failures = ["PROTECTED_VERTEX_MOVED"] if moved else []
        hard_failures.extend(failures)
        checks.append({"check_id": "geometry-protection", "object_name": name, "status": "FAIL" if failures else "PASS", "hard_failures": failures, "measurements": {"protected_vertex_count": len(raw_points), "moved_vertex_count": moved}})

    role_meshes = {mesh.get("role"): mesh for mesh in meshes.values() if isinstance(mesh.get("role"), str)}
    claimed_roles = [mesh.get("role") for mesh in meshes.values() if isinstance(mesh.get("role"), str)]
    if len(claimed_roles) != len(set(claimed_roles)):
        hard_failures.append("DUPLICATE_ROLE_ASSIGNMENT")
    for role, raw_role in roles_config.items():
        if not is_object_mapping(raw_role):
            return _error("MALFORMED_EXTRACTION_JSON")
        role_mesh = role_meshes.get(role)
        failures: list[str] = []
        if role_mesh is None:
            failures.append("REQUIRED_ROLE_MISSING")
            object_name = str(raw_role.get("object_name", role))
            vertex_count = 0
        else:
            object_name = str(role_mesh["object_name"])
            if object_name != raw_role.get("object_name"):
                failures.append("REQUIRED_ROLE_OBJECT_MISMATCH")
            vertices = parsed_vertices[object_name]
            vertex_count = len(vertices)
            if role_mesh.get("visible_viewport") is not True or role_mesh.get("visible_render") is not True:
                failures.append("REQUIRED_ROLE_NOT_VISIBLE")
            envelope = raw_role.get("landmark_envelope")
            if not is_object_mapping(envelope):
                return _error("MALFORMED_EXTRACTION_JSON")
            minimum, maximum = _vec3_list([envelope.get("min")]), _vec3_list([envelope.get("max")])
            if minimum is None or maximum is None:
                return _error("MALFORMED_EXTRACTION_JSON")
            if any(not isfinite(value) for point in (minimum[0], maximum[0]) for value in point) or any(minimum[0][axis] > maximum[0][axis] for axis in range(3)):
                return _error("INVALID_NUMERIC_CRITERIA")
            if any(any(vertex[axis] < minimum[0][axis] or vertex[axis] > maximum[0][axis] for axis in range(3)) for vertex in vertices):
                failures.append("ROLE_OUTSIDE_LANDMARK_ENVELOPE")
        hard_failures.extend(failures)
        checks.append({"check_id": "geometry-role-placement", "object_name": object_name, "status": "FAIL" if failures else "PASS", "hard_failures": failures, "measurements": {"role": role, "vertex_count": vertex_count}})

    unproven = ["SELF_INTERSECTION", "PRODUCTION_CHARACTER_QUALITY"]
    if not ratios_config:
        unproven.append("MEASURED_RATIO_TARGETS")
    for ratio_name, raw_ratio in ratios_config.items():
        if not is_object_mapping(raw_ratio) or not isinstance(raw_ratio.get("provenance"), str) or not raw_ratio["provenance"]:
            unproven.append("MEASURED_RATIO_TARGETS")
            continue
        role_mesh = role_meshes.get(raw_ratio.get("numerator_role"))
        denominator_name, axis = raw_ratio.get("denominator_object"), raw_ratio.get("axis")
        minimum, maximum = raw_ratio.get("minimum"), raw_ratio.get("maximum")
        if role_mesh is None or not isinstance(denominator_name, str) or denominator_name not in parsed_vertices or axis not in {"x", "y", "z"} or not isinstance(minimum, int | float) or not isinstance(maximum, int | float):
            unproven.append("MEASURED_RATIO_TARGETS")
            continue
        if not isfinite(minimum) or not isfinite(maximum) or minimum < 0 or maximum < minimum:
            return _error("INVALID_NUMERIC_CRITERIA")
        if not isinstance(axis, str):
            unproven.append("MEASURED_RATIO_TARGETS")
            continue
        axis_id = {"x": 0, "y": 1, "z": 2}[axis]
        numerator = parsed_vertices[str(role_mesh["object_name"])]
        denominator = parsed_vertices[denominator_name]
        if not numerator or not denominator:
            hard_failures.append("RATIO_INPUT_EMPTY")
            continue
        numerator_extent = max(vertex[axis_id] for vertex in numerator) - min(vertex[axis_id] for vertex in numerator)
        denominator_extent = max(vertex[axis_id] for vertex in denominator) - min(vertex[axis_id] for vertex in denominator)
        ratio = numerator_extent / denominator_extent if denominator_extent > 0 else float("inf")
        failures = ["RATIO_OUT_OF_BOUNDS"] if ratio < float(minimum) or ratio > float(maximum) else []
        hard_failures.extend(failures)
        checks.append({"check_id": "geometry-measured-ratio", "object_name": denominator_name, "status": "FAIL" if failures else "PASS", "hard_failures": failures, "measurements": {"ratio_name": ratio_name, "measured_ratio": ratio, "minimum": float(minimum), "maximum": float(maximum)}})

    hard_failures = list(dict.fromkeys(hard_failures))
    unproven = list(dict.fromkeys(unproven))
    status = "FAIL" if hard_failures else ("UNPROVEN" if "MEASURED_RATIO_TARGETS" in unproven else "PASS")
    return {"schema_version": 1, "status": status, "criteria_version": "round2-geometry-hard-gate-v1", "source": {"path": source_path, "sha256": source_hash, "blender_version": blender_version}, "hard_failures": hard_failures, "unproven": unproven, "checks": checks}


def main() -> int:
    parser = argparse.ArgumentParser()
    _ = parser.add_argument("--input", required=True, type=Path)
    _ = parser.add_argument("--manifest", dest="manifest_path", type=Path)
    _ = parser.add_argument("--output", required=True, type=Path)
    arguments = Arguments()
    _ = parser.parse_args(namespace=arguments)
    try:
        payload_value = load_json(arguments.input.read_text(encoding="utf-8"))
        if not is_object_mapping(payload_value):
            payload = None
        else:
            payload = payload_value
    except (OSError, json.JSONDecodeError):
        report = _error("EXTRACTION_JSON_READ_ERROR")
    else:
        if payload is None:
            report = _error("MALFORMED_EXTRACTION_JSON")
        elif arguments.manifest_path is None:
            report = audit_extraction(payload)
        else:
            try:
                manifest_value = load_json(arguments.manifest_path.read_text(encoding="utf-8"))
                if not is_object_mapping(manifest_value):
                    manifest = None
                else:
                    manifest = manifest_value
            except (OSError, json.JSONDecodeError):
                manifest = None
            if manifest is None or manifest.get("schema_version") != 1:
                report = _error("MALFORMED_GEOMETRY_MANIFEST")
            elif not is_object_mapping(manifest_criteria_value := manifest.get("criteria")):
                report = _error("MALFORMED_GEOMETRY_MANIFEST")
            elif not is_object_array(payload_meshes := payload.get("meshes")):
                report = _error("MALFORMED_GEOMETRY_MANIFEST")
            else:
                manifest_criteria = manifest_criteria_value
                payload["criteria"] = manifest_criteria
                payload["criteria_version"] = "round2-geometry-hard-gate-v1"
                roles_value = manifest_criteria.get("required_roles", {})
                roles = roles_value if is_object_mapping(roles_value) else None
                if roles is None or any(not is_object_mapping(value) for value in roles.values()):
                    report = _error("MALFORMED_GEOMETRY_MANIFEST")
                else:
                    role_entries = [entry for entry in roles.values() if is_object_mapping(entry)]
                    expected_names = [entry.get("object_name") for entry in role_entries]
                    if any(not isinstance(name, str) for name in expected_names) or len(expected_names) != len(set(expected_names)):
                        report = _error("AMBIGUOUS_ROLE_MANIFEST")
                    else:
                        malformed_mesh = False
                        for mesh in payload_meshes:
                            if not is_object_mapping(mesh):
                                malformed_mesh = True
                                break
                            declared = [role for role, entry in roles.items() if is_object_mapping(entry) and entry.get("object_name") == mesh.get("object_name")]
                            mesh["role"] = declared[0] if declared else None
                        report = _error("MALFORMED_EXTRACTION_JSON") if malformed_mesh else audit_extraction(payload)
    arguments.output.parent.mkdir(parents=True, exist_ok=True)
    _ = arguments.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": report["status"], "output": str(arguments.output)}))
    return 0 if report["status"] == "PASS" else 2


if __name__ == "__main__":
    if __package__ in {None, ""}:
        raise RuntimeError("Run as 'python -m gate.geometry_report'")
    raise SystemExit(main())
