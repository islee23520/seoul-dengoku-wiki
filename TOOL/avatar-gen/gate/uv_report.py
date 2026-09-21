"""Parse native UV extraction JSON and emit a conjunctive typed verdict."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Final, TypeIs, TypedDict, final

import numpy as np

from .uv_audit import (
    MINIMUM_TRIANGLE_AREA_UV2,
    OVERLAP_AREA_UV2,
    AuditResult,
    audit_triangles,
)
from .json_values import is_object_array, is_object_mapping, load_json

SCHEMA_VERSION: Final = 1


class Check(TypedDict):
    check_id: str
    object_name: str
    status: str
    hard_failures: list[str]
    measurements: dict[str, int | float]
    classifications: list[dict[str, int | float | str | list[int]]]


class Report(TypedDict):
    schema_version: int
    source: dict[str, str] | None
    status: str
    criteria_version: str
    epsilon: dict[str, float | str]
    hard_failures: list[str]
    unproven: list[str]
    checks: list[Check]


@final
class Arguments(argparse.Namespace):
    def __init__(self) -> None:
        super().__init__()
        self.input: Path = Path()
        self.output: Path = Path()


def _is_uv_triangle(value: object) -> TypeIs[list[list[int | float]]]:
    return (
        is_object_array(value)
        and len(value) == 3
        and all(
            is_object_array(point)
            and len(point) == 2
            and all(isinstance(coordinate, int | float) for coordinate in point)
            for point in value
        )
    )


def _error_report(failure: str) -> Report:
    return {
        "schema_version": SCHEMA_VERSION,
        "source": None,
        "status": "ERROR",
        "criteria_version": "round2-uv-hard-gate-v1",
        "epsilon": {
            "unit": "normalized_uv_squared",
            "minimum_triangle_area": MINIMUM_TRIANGLE_AREA_UV2,
            "positive_overlap_area": OVERLAP_AREA_UV2,
        },
        "hard_failures": [failure],
        "unproven": ["UV_EXTRACTION_AUDIT"],
        "checks": [],
    }


def _audit_to_check(object_name: str, audit: AuditResult) -> Check:
    return {
        "check_id": "uv-hard-invariants",
        "object_name": object_name,
        "status": audit.status,
        "hard_failures": list(audit.hard_failures),
        "measurements": {
            "triangle_count": audit.triangle_count,
            "degenerate_triangle_count": len(audit.degenerate_triangle_ids),
            "positive_area_overlap_count": len(audit.overlaps),
            "exact_intersection_tests": audit.exact_intersection_tests,
        },
        "classifications": [
            {
                "classification": overlap.classification,
                "triangle_ids": list(overlap.triangle_ids),
                "polygon_ids": list(overlap.polygon_ids),
                "area_uv2": overlap.area_uv2,
                "relative_to_smaller": overlap.relative_to_smaller,
            }
            for overlap in audit.overlaps
        ],
    }


def audit_extraction(payload: dict[str, object]) -> Report:
    """Parse extraction JSON once and require every mesh hard gate to pass."""
    if payload.get("schema_version") != SCHEMA_VERSION:
        return _error_report("MALFORMED_EXTRACTION_JSON")
    source = payload.get("source")
    if not is_object_mapping(source):
        return _error_report("MALFORMED_EXTRACTION_JSON")
    source_path = source.get("path")
    source_hash = source.get("sha256")
    engine_version = source.get("blender_version")
    if not isinstance(source_path, str) or not source_path:
        return _error_report("MALFORMED_EXTRACTION_JSON")
    if not isinstance(source_hash, str) or len(source_hash) != 64:
        return _error_report("MALFORMED_EXTRACTION_JSON")
    if any(character not in "0123456789abcdef" for character in source_hash):
        return _error_report("MALFORMED_EXTRACTION_JSON")
    if not isinstance(engine_version, str) or not engine_version:
        return _error_report("MALFORMED_EXTRACTION_JSON")
    meshes = payload.get("meshes")
    if not is_object_array(meshes) or not meshes:
        return _error_report("MALFORMED_EXTRACTION_JSON")

    checks: list[Check] = []
    hard_failures: list[str] = []
    for raw_mesh in meshes:
        if not is_object_mapping(raw_mesh):
            return _error_report("MALFORMED_EXTRACTION_JSON")
        object_name = raw_mesh.get("object_name")
        status = raw_mesh.get("status")
        raw_triangles = raw_mesh.get("triangles")
        if not isinstance(object_name, str) or not isinstance(status, str):
            return _error_report("MALFORMED_EXTRACTION_JSON")
        if status != "OK":
            hard_failures.append(status)
            failed_check: Check = {
                "check_id": "uv-native-extraction",
                "object_name": object_name,
                "status": "FAIL",
                "hard_failures": [status],
                "measurements": {"triangle_count": 0},
                "classifications": [],
            }
            checks.append(failed_check)
            continue
        if not is_object_array(raw_triangles) or not raw_triangles:
            return _error_report("MALFORMED_EXTRACTION_JSON")
        triangle_count = raw_mesh.get("triangle_count")
        uv_layer = raw_mesh.get("uv_layer")
        if type(triangle_count) is not int or triangle_count != len(raw_triangles):
            return _error_report("MALFORMED_EXTRACTION_JSON")
        if not isinstance(uv_layer, str) or not uv_layer:
            return _error_report("MALFORMED_EXTRACTION_JSON")
        coordinates: list[list[list[float]]] = []
        polygon_ids: list[int] = []
        for raw_triangle in raw_triangles:
            if not is_object_mapping(raw_triangle):
                return _error_report("MALFORMED_EXTRACTION_JSON")
            uv = raw_triangle.get("uv")
            polygon_id = raw_triangle.get("polygon_id")
            if not _is_uv_triangle(uv) or not isinstance(polygon_id, int):
                return _error_report("MALFORMED_EXTRACTION_JSON")
            coordinates.append(uv)
            polygon_ids.append(polygon_id)
        try:
            triangle_array = np.asarray(coordinates, dtype=np.float64)
        except (TypeError, ValueError):
            return _error_report("MALFORMED_EXTRACTION_JSON")
        audit = audit_triangles(triangle_array, tuple(polygon_ids))
        checks.append(_audit_to_check(object_name, audit))
        hard_failures.extend(audit.hard_failures)

    return {
        "schema_version": SCHEMA_VERSION,
        "source": {
            "path": source_path,
            "sha256": source_hash,
            "blender_version": engine_version,
        },
        "status": "FAIL" if hard_failures else "PASS",
        "criteria_version": "round2-uv-hard-gate-v1",
        "epsilon": {
            "unit": "normalized_uv_squared",
            "minimum_triangle_area": MINIMUM_TRIANGLE_AREA_UV2,
            "positive_overlap_area": OVERLAP_AREA_UV2,
        },
        "hard_failures": hard_failures,
        "unproven": [
            "ANATOMICAL_SEAMS",
            "ISLAND_CONNECTIVITY",
            "PADDING",
            "PACKING_QUALITY",
            "TEXEL_DENSITY",
            "STRETCH",
            "CHECKER_RENDER",
            "SOURCE_COLOR_RENDER",
        ],
        "checks": checks,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    _ = parser.add_argument("--input", required=True, type=Path)
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
        report = _error_report("EXTRACTION_JSON_READ_ERROR")
    else:
        if payload is None:
            report = _error_report("MALFORMED_EXTRACTION_JSON")
        else:
            report = audit_extraction(payload)
    arguments.output.parent.mkdir(parents=True, exist_ok=True)
    _ = arguments.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": report["status"], "output": str(arguments.output)}))
    return 0 if report["status"] == "PASS" else 2


if __name__ == "__main__":
    if __package__ in {None, ""}:
        raise RuntimeError("Run as 'python -m gate.uv_report'")
    raise SystemExit(main())
