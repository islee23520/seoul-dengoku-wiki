from __future__ import annotations

import json
from pathlib import Path

import pytest

from avatar_gen.mesh_contract import load_contract, route_request
from avatar_gen.mesh_plan import build_repair_plan
from avatar_gen.mesh_work import execute_mesh_work


def test_owner_contract_preserves_non_compensable_hard_failures() -> None:
    contract = load_contract()
    score = contract["score_policy"]
    assert isinstance(score, dict)
    assert score["hard_failures_are_non_compensable"] is True
    symmetry = contract["symmetry"]
    assert isinstance(symmetry, dict)
    assert symmetry["audit_both_sides"] is True
    assert symmetry["fixed_donor_side"] is None


def test_korean_mesh_request_routes_owner_required_stages() -> None:
    job = route_request("남자 캐릭터 목 경계 노말과 웰딩을 수리하고 좌우를 감사한 다음 구강 눈알 UV FBX 재임포트까지 검증해")
    stages = [stage["id"] for stage in job["stages"]]
    assert stages == [
        "inventory",
        "topology-audit",
        "bilateral-audit",
        "join-transition",
        "oral-eye",
        "uv-texture",
        "delivery",
        "verification",
    ]
    assert job["symmetry_requested"] is True
    assert job["protected_openings"] == ["eye-left", "eye-right", "mouth", "neck"]


def test_repair_plan_never_offsets_hard_failure_with_score() -> None:
    audit = {
        "schema_version": 1,
        "source": {"sha256": "a" * 64},
        "objects": [{
            "object_name": "Body",
            "hard_failures": ["UNEXPECTED_BOUNDARY", "WINDING_CONFLICT"],
            "inconsistent_normals": True,
            "centerline_duplicate_pair_count": 0,
            "symmetry": {"requested": True, "eligible": True, "recommended_donor": None, "match_coverage": 0.7, "maximum_error_m": 0.02, "left_hard_issue_count": 3, "right_hard_issue_count": 4},
        }],
        "unproven": ["SELF_INTERSECTION"],
    }
    plan = build_repair_plan(audit)
    assert plan["status"] == "BLOCKED"
    assert plan["hard_failures"] == ["UNEXPECTED_BOUNDARY", "WINDING_CONFLICT"]
    assert {action["action"] for action in plan["actions"]} == {"recalculate-normals"}
    assert "SYMMETRY_DONOR_UNPROVEN:Body" in plan["blocked"]
    assert plan["unproven"] == ["SELF_INTERSECTION"]


def test_output_may_not_overwrite_source(tmp_path: Path) -> None:
    source = tmp_path / "source.blend"
    source.write_bytes(b"fixture")
    with pytest.raises(ValueError, match="must not overwrite"):
        execute_mesh_work(source, "mesh repair", tmp_path / "work", output=source, apply_repairs=True)


def test_donor_plan_is_blocked_until_topology_preserving_reflection_exists() -> None:
    audit = {
        "schema_version": 1,
        "source": {"sha256": "b" * 64},
        "objects": [{
            "object_name": "Head",
            "hard_failures": [],
            "centerline_duplicate_pair_count": 0,
            "symmetry": {"requested": True, "eligible": True, "recommended_donor": "right", "plane_x_m": 0, "weld_threshold_m": 1e-5, "match_coverage": 0.99, "maximum_error_m": 1e-5, "left_hard_issue_count": 1, "right_hard_issue_count": 0},
        }],
        "unproven": [],
    }
    plan = build_repair_plan(audit)
    assert plan["status"] == "BLOCKED"
    assert plan["actions"] == []
    assert plan["blocked"] == ["DESTRUCTIVE_SYMMETRY_NOT_IMPLEMENTED:Head:right"]


def test_work_artifact_symlink_to_source_is_rejected(tmp_path: Path) -> None:
    source = tmp_path / "source.blend"
    source.write_bytes(b"fixture")
    work = tmp_path / "work"
    work.mkdir()
    (work / "mesh-job.json").symlink_to(source)
    with pytest.raises(ValueError, match="must not be a symlink"):
        execute_mesh_work(source, "mesh audit", work)
