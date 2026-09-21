from __future__ import annotations

import json
from pathlib import Path
from typing import TypedDict

import ast

from .topology_gate import inspect_topology, legacy_exact_two_symmetry

HERE = Path(__file__).resolve().parent
ROUND2 = HERE.parents[1]
BASELINE = ROUND2 / "fixtures/geometry-baseline.json"


class FixtureExpected(TypedDict, total=False):
    boundary_edges: int
    unexpected_boundary_edges: int
    duplicate_faces: int
    degenerate_triangles: int
    winding_conflicts: int


def _load_json(path: Path):
    with path.open(encoding="utf-8") as stream:
        return json.load(stream)


def test_topology_fixtures_detect_each_named_defect_and_preserve_opening() -> None:
    fixtures = _load_json(HERE / "topology-fixtures.json")["fixtures"]
    for name, fixture in fixtures.items():
        result = inspect_topology(
            tuple(tuple(value) for value in fixture["vertices"]),
            tuple(tuple(value) for value in fixture["faces"]),
            frozenset((min(value), max(value)) for value in fixture["declared_opening_edges"]),
        )
        for field, expected in fixture["expected"].items():
            assert getattr(result, field) == expected, f"{name}: {field}"


def test_legacy_exact_two_symmetry_fixture_exposes_ignored_vertices() -> None:
    fixture = _load_json(HERE / "symmetry-unmatched-fixture.json")
    measured = legacy_exact_two_symmetry(tuple(tuple(value) for value in fixture["vertices"]))
    expected = fixture["expected_legacy"]
    assert measured == (
        expected["max_x_asymmetry_m"],
        expected["pairs_checked"],
        expected["ignored_vertices"],
    )


def test_historical_baseline_preserves_raw_failed_measurements() -> None:
    baseline = _load_json(BASELINE)
    female = baseline["scenes"]["failed_female_symmetric"]
    male = baseline["scenes"]["owner_guided_male"]
    assert female["head_to_total_height_ratio"] == 0.5063884631375987
    assert male["head_to_total_height_ratio"] == 0.14284640886588737
    assert male["height_m"] == 1.8149976727914612


def test_historical_male_oral_kit_records_failed_placement() -> None:
    baseline = _load_json(BASELINE)
    placement = baseline["scenes"]["failed_final_integration"]["male_oral_placement"]
    assert placement["all_objects_in_head_landmark_band"] is False
    assert placement["oral_centroid_z_range_m"] == [0.2482910230755806, 0.3237304836511612]


def test_historical_female_records_zero_required_oral_roles() -> None:
    baseline = _load_json(BASELINE)
    female_oral = baseline["scenes"]["failed_final_integration"]["female_oral_objects"]
    assert female_oral["present_roles"] == []
    assert len(female_oral["required_roles"]) == 4


def test_historical_symmetry_false_positive_is_preserved() -> None:
    baseline = _load_json(BASELINE)
    symmetry = baseline["scenes"]["failed_female_symmetric"]["legacy_symmetry"]
    assert symmetry["max_x_asymmetry_m"] == 0.0
    assert symmetry["ignored_off_center_vertices"] == 14866


def test_historical_replay_helper_retains_exact_two_limitation() -> None:
    source = ast.parse((HERE / "topology_gate.py").read_text(encoding="utf-8"))
    helper = next(node for node in source.body if isinstance(node, ast.FunctionDef) and node.name == "legacy_exact_two_symmetry")
    assert any(isinstance(operator, ast.Eq) for condition in ast.walk(helper) if isinstance(condition, ast.Compare) for operator in condition.ops)
