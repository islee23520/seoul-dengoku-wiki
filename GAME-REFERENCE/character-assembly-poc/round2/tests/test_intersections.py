"""Defect-first regressions for the independent triangle intersection gate."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ROUND2 = Path(__file__).resolve().parents[1]
BLENDER = Path("/Applications/Blender.app/Contents/MacOS/Blender")
sys.path.insert(0, str(ROUND2))

from gate.intersections import audit_indexed_mesh, audit_triangle_soup


def test_empty_and_invalid_inputs_reject_with_typed_failures() -> None:
    empty = audit_indexed_mesh(np.empty((0, 3)), np.empty((0, 3), dtype=np.int64))
    assert empty.status == "FAIL"
    assert empty.hard_failures == ("EMPTY_TRIANGLES",)
    assert audit_indexed_mesh(np.zeros((3, 2)), np.asarray([[0, 1, 2]])).hard_failures == ("MALFORMED_POSITION_SHAPE",)
    nonfinite = audit_indexed_mesh(np.asarray([[0, 0, 0], [1, np.nan, 0], [0, 1, 0]]), np.asarray([[0, 1, 2]]))
    assert nonfinite.hard_failures == ("NONFINITE_POSITION",)
    invalid = audit_indexed_mesh(np.zeros((3, 3)), np.asarray([[0, 1, 3]]))
    assert invalid.hard_failures == ("INVALID_TRIANGLE_INDEX",)


def test_fractional_triangle_indices_reject_instead_of_truncating() -> None:
    positions = np.asarray([[0, 0, 0], [1, 0, 0], [0, 1, 0]], dtype=float)
    result = audit_indexed_mesh(positions, np.asarray([[0.0, 1.0, 2.5]]))
    assert result.status == "FAIL"
    assert result.hard_failures == ("MALFORMED_TRIANGLE_INDEX",)


def test_distant_geometry_cannot_turn_shared_point_into_penetration() -> None:
    # Given: real socket triangles whose only contact is one shared vertex.
    pair = np.asarray([
        [[0.01693311147391796, -0.0939006358385086, 1.52113676071167],
         [0.01693311147391796, -0.09416032582521439, 1.5210068225860596],
         [0.017192799597978592, -0.0939006358385086, 1.5210068225860596]],
        [[0.017062954604625702, -0.09377079457044601, 1.52113676071167],
         [0.017192799597978592, -0.0939006358385086, 1.5210068225860596],
         [0.017322644591331482, -0.09377079457044601, 1.5210068225860596]],
    ])
    topology = [[("eye", 0), ("eye", 1), ("eye", 2)], [("eye", 3), ("eye", 2), ("eye", 4)]]
    assert audit_triangle_soup(pair, topology).status == "PASS"
    distant = np.asarray([
        [[0.0, 0.0, 0.0], [0.1, 0.0, 0.0], [0.0, 0.1, 0.0]],
        [[0.0, 0.0, 1.65], [0.1, 0.0, 1.65], [0.0, 0.1, 1.65]],
    ])
    # When: only unrelated geometry and scene-wide extent change.
    combined = audit_triangle_soup(
        np.concatenate([pair, distant]),
        topology + [[("far", 0), ("far", 1), ("far", 2)], [("far", 3), ("far", 4), ("far", 5)]],
    )
    # Then: no artificial penetration segment may appear.
    assert combined.status == "PASS"
    assert combined.intersections == ()


def test_coplanar_clip_uses_area_units_for_edge_side_tolerance() -> None:
    # Given: tiny coplanar triangles with overlapping AABBs but a real gap.
    # Every point of the second triangle satisfies x+y > 0.0007.
    triangles = np.asarray([
        [[0.0, 0.0, 0.0], [0.0007, 0.0, 0.0], [0.0, 0.0007, 0.0]],
        [[0.000351, 0.000351, 0.0], [0.000701, 0.000351, 0.0], [0.000351, 0.000701, 0.0]],
        [[1.0, 1.0, 0.0], [1.1, 1.0, 0.0], [1.0, 1.1, 0.0]],
        [[1.0, 1.0, 1.65], [1.1, 1.0, 1.65], [1.0, 1.1, 1.65]],
    ])
    # When: linear scene tolerance is compared against the clip's cross product.
    result = audit_triangle_soup(triangles)
    # Then: clipping must not manufacture positive overlap across that gap.
    assert result.status == "PASS"
    assert result.intersections == ()


def test_gate_is_invariant_under_finite_unit_rescaling() -> None:
    positions = np.asarray([[0, 0, 0], [1, 0, 0], [0, 1, 0], [.25, .25, -1], [.25, .25, 1], [.75, .25, 0]], dtype=float)
    triangles = np.asarray([[0, 1, 2], [3, 4, 5]], dtype=np.int64)
    results = [audit_indexed_mesh(positions * scale, triangles) for scale in (1e-6, 1.0, 1e3)]
    assert {result.status for result in results} == {"FAIL"}
    assert all(result.intersections[0].classification == "PROPER_INTERSECTION" for result in results)


def test_legitimate_adjacency_and_nonintersecting_normals_pass() -> None:
    positions = np.asarray([[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [-1, 0, 0]], dtype=float)
    shared_edge = audit_indexed_mesh(positions, np.asarray([[0, 1, 2], [1, 3, 2]]))
    folded_neighbor = audit_indexed_mesh(positions, np.asarray([[0, 1, 2], [0, 1, 4]]))
    shared_point = audit_indexed_mesh(positions, np.asarray([[0, 1, 2], [0, 4, 5]]))
    assert shared_edge.status == folded_neighbor.status == shared_point.status == "PASS"
    assert shared_edge.topology_contacts == folded_neighbor.topology_contacts == 1


def test_shared_vertex_crossing_and_coplanar_positive_area_fail() -> None:
    crossing = np.asarray([[[0, 0, 0], [1, 0, 0], [0, 1, 0]], [[0, 0, 0], [.5, .2, -1], [.5, .2, 1]]], dtype=float)
    keys = ((('A', 0), ('A', 1), ('A', 2)), (('A', 0), ('A', 3), ('A', 4)))
    result = audit_triangle_soup(crossing, keys)
    assert result.status == "FAIL"
    assert result.intersections[0].classification == "PROPER_INTERSECTION"
    coplanar = np.asarray([[[0, 0, 0], [1, 0, 0], [0, 1, 0]], [[.1, .1, 0], [.8, .1, 0], [.1, .8, 0]]], dtype=float)
    result = audit_triangle_soup(coplanar)
    assert result.status == "FAIL"
    assert result.intersections[0].classification == "COPLANAR_POSITIVE_AREA"


def test_equal_local_indices_in_different_objects_are_not_shared() -> None:
    points = np.asarray([[[0, 0, 0], [1, 0, 0], [0, 1, 0]], [[0, 0, 0], [.5, .2, -1], [.5, .2, 1]]], dtype=float)
    keys = ((('Body', 0), ('Body', 1), ('Body', 2)), (('Tongue', 0), ('Tongue', 1), ('Tongue', 2)))
    result = audit_triangle_soup(points, keys)
    assert result.status == "FAIL"
    assert result.intersections[0].shared_vertices == 0


def test_nested_crossing_and_default_point_contact_diagnostic() -> None:
    nested = np.asarray([[[0, 0, 0], [2, 0, 0], [0, 2, 0]], [[.5, .5, -1], [.5, .5, 1], [.5, 1, 0]]], dtype=float)
    assert audit_triangle_soup(nested).status == "FAIL"
    point = np.asarray([[[0, 0, 0], [1, 0, 0], [0, 1, 0]], [[1, 0, 0], [2, 0, 1], [2, 1, 1]]], dtype=float)
    result = audit_triangle_soup(point)
    assert result.status == "PASS"
    assert result.contacts[0].classification == "POINT_CONTACT"
    assert result.contacts[0].intentional is False


def test_degenerate_triangle_rejects() -> None:
    result = audit_indexed_mesh(np.asarray([[0, 0, 0], [1, 0, 0], [2, 0, 0]], dtype=float), np.asarray([[0, 1, 2]]))
    assert result.status == "FAIL"
    assert result.degenerate_triangle_ids == (0,)


def test_native_positive_and_negative_blend_fixtures(tmp_path: Path) -> None:
    fixture_dir = ROUND2 / "fixtures" / "intersections"
    output_dir = tmp_path / "native"
    completed = subprocess.run([
        str(BLENDER), "--background", "--factory-startup", "--python-exit-code", "1",
        "--python", str(ROUND2 / "scripts" / "extract_intersections.py"), "--",
        "--create-fixtures", str(fixture_dir), "--fixture-output", str(output_dir),
    ], check=False, capture_output=True, text=True, timeout=120)
    assert completed.returncode == 0, completed.stdout + completed.stderr
    clean = json.loads((output_dir / "clean.json").read_text())
    crossing = json.loads((output_dir / "crossing.json").read_text())
    assert clean["status"] == "PASS"
    assert crossing["status"] == "FAIL"
    assert crossing["measurements"]["intersection_count"] >= 1
    assert clean["extraction"]["evaluated_loop_triangles"] > 0
    assert crossing["source"]["sha256"] != clean["source"]["sha256"]
