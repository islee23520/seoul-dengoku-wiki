# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
"""Extract evaluated world triangles and run the independent intersection gate."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import sys
from pathlib import Path
from typing import Any, Final

import numpy as np

bpy = __import__("bpy")

SCHEMA_VERSION: Final = 1
CRITERIA_VERSION: Final = "round2-world-triangle-intersection-v1"
ROUND2 = Path(__file__).resolve().parents[1]


def _load_gate() -> Any:
    path = ROUND2 / "gate" / "intersections.py"
    spec = importlib.util.spec_from_file_location("round2_intersections", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load intersection gate: {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


GATE = _load_gate()


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _contact(contact: Any) -> dict[str, object]:
    return {
        "triangle_ids": list(contact.triangle_ids),
        "classification": contact.classification,
        "shared_vertices": contact.shared_vertices,
        "intentional": contact.intentional,
        "measure_world_units": contact.measure,
    }


def _extract() -> tuple[np.ndarray, tuple[tuple[tuple[str, int], ...], ...], dict[str, object]]:
    dependency_graph = bpy.context.evaluated_depsgraph_get()
    bpy.context.view_layer.update()
    triangle_points: list[list[list[float]]] = []
    triangle_keys: list[tuple[tuple[str, int], ...]] = []
    objects: list[dict[str, object]] = []
    empty_meshes: list[str] = []
    for scene_object in sorted(bpy.context.scene.objects, key=lambda item: item.name):
        if scene_object.type != "MESH":
            continue
        evaluated_object = scene_object.evaluated_get(dependency_graph)
        evaluated_mesh = evaluated_object.to_mesh(preserve_all_data_layers=True, depsgraph=dependency_graph)
        try:
            evaluated_mesh.calc_loop_triangles()
            world = evaluated_object.matrix_world
            world_vertices = [[float(value) for value in world @ vertex.co] for vertex in evaluated_mesh.vertices]
            count_before = len(triangle_points)
            for loop_triangle in evaluated_mesh.loop_triangles:
                vertex_ids = tuple(int(vertex_id) for vertex_id in loop_triangle.vertices)
                triangle_points.append([world_vertices[vertex_id] for vertex_id in vertex_ids])
                triangle_keys.append(tuple((scene_object.name_full, vertex_id) for vertex_id in vertex_ids))
            triangle_count = len(triangle_points) - count_before
            if not world_vertices or not triangle_count:
                empty_meshes.append(scene_object.name_full)
            objects.append(
                {
                    "object_name": scene_object.name_full,
                    "vertex_count": len(world_vertices),
                    "evaluated_loop_triangles": triangle_count,
                    "matrix_world": [[float(value) for value in row] for row in world],
                }
            )
        finally:
            evaluated_object.to_mesh_clear()
    points = np.asarray(triangle_points, dtype=np.float64)
    if not triangle_points:
        points = np.empty((0, 3, 3), dtype=np.float64)
    extraction: dict[str, object] = {
        "object_count": len(objects),
        "objects": objects,
        "empty_mesh_objects": empty_meshes,
        "evaluated_loop_triangles": len(triangle_points),
        "coordinate_space": "WORLD",
        "vertex_identity": "object_name_full+evaluated_vertex_index",
    }
    return points, tuple(triangle_keys), extraction


def _report(source_path: Path) -> dict[str, object]:
    points, keys, extraction = _extract()
    result = GATE.audit_triangle_soup(points, keys)
    hard_failures = list(result.hard_failures)
    if extraction["empty_mesh_objects"]:
        hard_failures.insert(0, "EMPTY_MESH")
    hard_failures = list(dict.fromkeys(hard_failures))
    status = "FAIL" if hard_failures else "PASS"
    return {
        "schema_version": SCHEMA_VERSION,
        "criteria_version": CRITERIA_VERSION,
        "status": status,
        "source": {
            "path": str(source_path.resolve()),
            "sha256": _sha256(source_path),
            "blender_version": bpy.app.version_string,
        },
        "extraction": extraction,
        "measurements": {
            "triangle_count": result.triangle_count,
            "intersection_count": len(result.intersections),
            "diagnostic_contact_count": len(result.contacts),
            "topology_contact_count": result.topology_contacts,
            "degenerate_triangle_count": len(result.degenerate_triangle_ids),
            "broadphase_candidate_pairs": result.broadphase_candidate_pairs,
            "exact_intersection_tests": result.exact_intersection_tests,
            "tolerance_world_units": result.tolerance_world_units,
            "area_tolerance_world_units2": result.area_tolerance_world_units2,
        },
        "hard_failures": hard_failures,
        "intersections": [_contact(contact) for contact in result.intersections],
        "contacts": [_contact(contact) for contact in result.contacts],
        "degenerate_triangle_ids": list(result.degenerate_triangle_ids),
        "unproven": [],
    }


def _reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def _make_fixture(path: Path, crossing: bool) -> None:
    _reset_scene()
    first_vertices = [(0.0, 0.0, 0.0), (1.0, 0.0, 0.0), (0.0, 1.0, 0.0)]
    second_vertices = (
        [(0.25, 0.25, -1.0), (0.25, 0.25, 1.0), (0.75, 0.25, 0.0)]
        if crossing
        else [(0.0, 0.0, 1.0), (1.0, 0.0, 1.0), (0.0, 1.0, 1.0)]
    )
    for name, vertices in (("Body", first_vertices), ("Tongue", second_vertices)):
        mesh = bpy.data.meshes.new(f"{name}Mesh")
        mesh.from_pydata(vertices, [], [(0, 1, 2)])
        mesh.update()
        scene_object = bpy.data.objects.new(name, mesh)
        bpy.context.scene.collection.objects.link(scene_object)
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(path))


def _write_report(path: Path, report: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


def _run_saved_fixture(source: Path, output: Path) -> int:
    bpy.ops.wm.open_mainfile(filepath=str(source))
    report = _report(source)
    _write_report(output, report)
    return 0 if report["status"] == "PASS" else 2


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    parser.add_argument("--create-fixtures", type=Path)
    parser.add_argument("--fixture-output", type=Path)
    parsed = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
    if parsed.create_fixtures is not None:
        if parsed.fixture_output is None:
            parser.error("--fixture-output is required with --create-fixtures")
        clean_source = parsed.create_fixtures / "clean.blend"
        crossing_source = parsed.create_fixtures / "crossing.blend"
        _make_fixture(clean_source, crossing=False)
        _make_fixture(crossing_source, crossing=True)
        clean_code = _run_saved_fixture(clean_source, parsed.fixture_output / "clean.json")
        crossing_code = _run_saved_fixture(crossing_source, parsed.fixture_output / "crossing.json")
        summary = {
            "status": "FIXTURE_RUN_COMPLETE" if (clean_code, crossing_code) == (0, 2) else "FIXTURE_RUN_ERROR",
            "clean_exit": clean_code,
            "crossing_exit": crossing_code,
        }
        print(json.dumps(summary), flush=True)
        return 0 if summary["status"] == "FIXTURE_RUN_COMPLETE" else 1
    if parsed.output is None:
        parser.error("--output is required for an opened blend file")
    source_path = Path(bpy.data.filepath)
    if not source_path.is_file():
        parser.error("Open a saved .blend before auditing")
    report = _report(source_path)
    _write_report(parsed.output, report)
    print(json.dumps({"status": report["status"], "output": str(parsed.output)}), flush=True)
    return 0 if report["status"] == "PASS" else 2


if __name__ == "__main__":
    raise SystemExit(main())
