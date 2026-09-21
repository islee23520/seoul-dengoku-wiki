"""Regression tests for the independent geometry and placement hard gate."""

from __future__ import annotations

import copy
import json
import subprocess
import sys
from pathlib import Path
from typing import Final

import pytest

ROUND2: Final = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROUND2))

from gate.geometry_report import audit_extraction
from gate.geometry_audit import audit_symmetry
from gate import geometry_audit


def _positive() -> dict[str, object]:
    payload = json.loads((ROUND2 / "fixtures/geometry-positive.json").read_text())
    assert isinstance(payload, dict)
    return payload


def _mesh(payload: dict[str, object], name: str) -> dict[str, object]:
    meshes = payload["meshes"]
    assert isinstance(meshes, list)
    return next(mesh for mesh in meshes if isinstance(mesh, dict) and mesh["object_name"] == name)


def _mapping(container: dict[str, object], key: str) -> dict[str, object]:
    value = container[key]
    assert isinstance(value, dict)
    return value


def _vertices(mesh: dict[str, object]) -> list[list[int | float]]:
    value = mesh["vertices"]
    assert isinstance(value, list)
    result: list[list[int | float]] = []
    for vertex in value:
        assert isinstance(vertex, list)
        assert all(isinstance(coordinate, int | float) for coordinate in vertex)
        result.append(vertex)
    return result


def _indices(mesh: dict[str, object], key: str) -> list[list[int]]:
    value = mesh[key]
    assert isinstance(value, list)
    result: list[list[int]] = []
    for item in value:
        assert isinstance(item, list)
        assert all(type(index) is int for index in item)
        result.append(item)
    return result


def test_independent_positive_control_passes_without_character_claim() -> None:
    report = audit_extraction(_positive())
    assert report["status"] == "PASS"
    assert report["hard_failures"] == []
    assert "SELF_INTERSECTION" in report["unproven"]
    assert "PRODUCTION_CHARACTER_QUALITY" in report["unproven"]


@pytest.mark.parametrize(("mutation", "failure"), [("empty", "EMPTY_MESH"), ("nonfinite", "NONFINITE_VERTEX"), ("wire", "WIRE_EDGE"), ("duplicate_vertex", "DUPLICATE_VERTEX"), ("duplicate_face", "DUPLICATE_FACE"), ("degenerate", "DEGENERATE_TRIANGLE"), ("flip", "WINDING_CONFLICT"), ("hole", "UNDECLARED_BOUNDARY"), ("opening_not_present", "DECLARED_OPENING_MISMATCH"), ("nonmanifold", "NON_MANIFOLD_EDGE"), ("protected", "PROTECTED_VERTEX_MOVED")])
def test_each_topology_and_protection_defect_is_rejected(mutation: str, failure: str) -> None:
    payload = _positive()
    body = _mesh(payload, "Body")
    criteria = _mapping(payload, "criteria")
    vertices, edges, triangles = _vertices(body), _indices(body, "edges"), _indices(body, "triangles")
    match mutation:
        case "empty": body["vertices"], body["edges"], body["triangles"] = [], [], []
        case "nonfinite": vertices[0][0] = float("nan")
        case "wire": edges.append([0, 0])
        case "duplicate_vertex": vertices.append(copy.deepcopy(vertices[0]))
        case "duplicate_face": triangles.append(copy.deepcopy(triangles[0]))
        case "degenerate": triangles[0] = [0, 0, 1]
        case "flip": triangles[0] = [0, 1, 2]
        case "hole": triangles.pop()
        case "opening_not_present": _mapping(criteria, "declared_openings")["Body"] = [[0, 1]]
        case "nonmanifold": triangles.append([0, 1, 2])
        case "protected": vertices[0][2] = 0.1
        case unreachable: raise AssertionError(unreachable)
    if mutation != "empty":
        body["vertices"], body["edges"], body["triangles"] = vertices, edges, triangles
    report = audit_extraction(payload)
    assert report["status"] == "FAIL"
    assert failure in report["hard_failures"]


def test_declared_opening_is_exact_not_a_blanket_boundary_exemption() -> None:
    payload = _positive()
    body = _mesh(payload, "Body")
    triangles = _indices(body, "triangles")
    triangles.pop()
    body["triangles"] = triangles
    criteria = _mapping(payload, "criteria")
    _mapping(criteria, "declared_openings")["Body"] = [[0, 2], [0, 3]]
    report = audit_extraction(payload)
    assert "DECLARED_OPENING_MISMATCH" in report["hard_failures"]


def test_full_reflected_coverage_rejects_one_unmatched_vertex() -> None:
    payload = _positive()
    body = _mesh(payload, "Body")
    vertices = _vertices(body)
    vertices.append([0.4, 0.25, 0.5])
    body["vertices"] = vertices
    report = audit_extraction(payload)
    assert report["status"] == "FAIL"
    assert "SYMMETRY_UNMATCHED_VERTEX" in report["hard_failures"]
    symmetry = next(check for check in report["checks"] if check["check_id"] == "geometry-symmetry")
    assert symmetry["measurements"]["unmatched_vertex_count"] == 1


def test_symmetry_handles_multiple_vertices_with_equal_yz_coordinates() -> None:
    # Given: two distinct mirror pairs share YZ, plus two center vertices.
    vertices = [(-2.0, 0.0, 0.0), (-1.0, 0.0, 0.0), (1.0, 0.0, 0.0), (2.0, 0.0, 0.0), (0.0, 1.0, 0.0), (0.0, 0.0, 2.0)]
    # When: the symmetry-only calculation runs directly, without a report bypass.
    symmetry = audit_symmetry(vertices, 0.0, 1e-9, 1e-8)
    # Then: every off-center vertex is checked and paired.
    assert symmetry.checked_vertex_count == 4
    assert symmetry.unmatched_vertex_ids == ()
    assert symmetry.maximum_reflection_error_m == pytest.approx(0.0)


def test_fixture_status_cannot_bypass_topology_validation() -> None:
    # Given: a known broken closed mesh with a forged testing-only status.
    payload = _positive()
    body = _mesh(payload, "Body")
    body["status"] = "SYMMETRY_ONLY_FIXTURE"
    body["triangles"] = []
    # When: it reaches the same report boundary as real assets.
    report = audit_extraction(payload)
    # Then: no testing escape hatch may turn an empty surface into approval.
    assert report["status"] != "PASS"


def test_duplicate_tolerance_includes_neighboring_cells_on_both_sides() -> None:
    # Given: two close pairs straddle positive and negative tolerance-cell boundaries.
    vertices = [(0.99, 0.0, 0.0), (1.01, 0.0, 0.0), (-1.01, 0.0, 0.0), (-0.99, 0.0, 0.0), (0.0, 5.0, 0.0)]
    # When: the real duplicate check inspects the unchanged coordinates.
    result = geometry_audit.audit_topology(vertices, [], [(0, 2, 4)], frozenset(), 1e-12, 0.05)
    # Then: near neighbors are reported, far neighbors are not.
    assert result.duplicate_vertex_pairs == ((0, 1), (2, 3))


def test_reflected_matching_accepts_near_pair_and_preserves_unmatched() -> None:
    # Given: one approximate reflected pair and one vertex with no partner.
    vertices = [(-1.01, 0.0, 0.0), (0.99, 0.0, 0.0), (0.5, 4.0, 0.0)]
    # When: full-coverage symmetry is measured with a declared tolerance.
    result = audit_symmetry(vertices, 0.0, 1e-9, 0.05)
    # Then: the approximate pair is measured and the isolated vertex is not omitted.
    assert result.checked_vertex_count == 3
    assert result.maximum_reflection_error_m == pytest.approx(0.02)
    assert result.unmatched_vertex_ids == (2,)


@pytest.mark.parametrize("operation", ["duplicates", "symmetry"])
def test_spatially_separated_vertices_do_not_require_all_pair_distances(
    operation: str, monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Given: exact mirror pairs, each YZ location far beyond the search tolerance.
    vertices = [point for index in range(1000) for point in ((-1.0, float(index), 0.0), (1.0, float(index), 0.0))]
    calls = 0
    real_distance = geometry_audit.dist

    def counted_distance(first, second):
        nonlocal calls
        calls += 1
        return real_distance(first, second)

    monkeypatch.setattr(geometry_audit, "dist", counted_distance)
    # When: the actual duplicate or full-coverage symmetry check runs.
    match operation:
        case "duplicates":
            measured = geometry_audit.audit_topology(vertices, [], [(0, 1, 2)], frozenset(), 1e-12, 1e-6)
            assert measured.duplicate_vertex_pairs == ()
        case "symmetry":
            symmetry = geometry_audit.audit_symmetry(vertices, 0.0, 1e-9, 1e-6)
            assert symmetry.unmatched_vertex_ids == ()
        case _:
            raise AssertionError(operation)
    # Then: work follows local candidates, not all two million distant pairs.
    assert calls < 20_000


@pytest.mark.parametrize("bad_epsilon", [float("nan"), float("inf"), -1.0])
def test_invalid_numeric_criteria_cannot_approve(bad_epsilon: float) -> None:
    # Given: a normal candidate with nonphysical validator thresholds.
    payload = _positive()
    _mapping(payload, "criteria")["duplicate_vertex_epsilon_m"] = bad_epsilon
    # When/Then: invalid criteria must be rejected, not weaken the check.
    assert audit_extraction(payload)["status"] == "ERROR"


@pytest.mark.parametrize("target", ["symmetry", "protection", "envelope", "ratio"])
def test_nonfinite_criteria_never_disable_rejection(target: str) -> None:
    payload = _positive()
    criteria = _mapping(payload, "criteria")
    match target:
        case "symmetry":
            symmetry = _mapping(criteria, "symmetry")
            _mapping(symmetry, "Body")["match_tolerance_m"] = float("nan")
        case "protection":
            protection = _mapping(criteria, "protected_vertices")["Body"]
            assert isinstance(protection, list)
            assert isinstance(protection[0], dict)
            protection[0]["tolerance_m"] = float("nan")
        case "envelope":
            role = _mapping(_mapping(criteria, "required_roles"), "tongue")
            _mapping(role, "landmark_envelope")["min"] = [float("nan"), -0.35, 1.2]
        case "ratio":
            ratio = _mapping(_mapping(criteria, "ratio_targets"), "oral_to_body_height")
            ratio["minimum"] = float("nan")
        case _:
            raise AssertionError(target)
    assert audit_extraction(payload)["status"] == "ERROR"


def test_required_role_cannot_be_satisfied_by_wrong_named_object() -> None:
    # Given: an unrelated object claims the expected role label.
    payload = _positive()
    tongue = _mesh(payload, "Tongue")
    tongue["object_name"] = "UnrelatedObject"
    # When/Then: role identity is bound to the manifest, not self-claimed labels.
    report = audit_extraction(payload)
    assert "REQUIRED_ROLE_OBJECT_MISMATCH" in report["hard_failures"]


def test_duplicate_role_claim_is_ambiguous_not_last_object_wins() -> None:
    # Given: two different objects claim a single required tongue role.
    payload = _positive()
    duplicate = copy.deepcopy(_mesh(payload, "Tongue"))
    duplicate["object_name"] = "SecondTongue"
    meshes = payload["meshes"]
    assert isinstance(meshes, list)
    meshes.append(duplicate)
    # When/Then: the gate must not silently overwrite a role assignment.
    report = audit_extraction(payload)
    assert "DUPLICATE_ROLE_ASSIGNMENT" in report["hard_failures"]


@pytest.mark.parametrize(("mutation", "failure"), [("missing_role", "REQUIRED_ROLE_MISSING"), ("hidden_role", "REQUIRED_ROLE_NOT_VISIBLE"), ("outside_envelope", "ROLE_OUTSIDE_LANDMARK_ENVELOPE")])
def test_role_manifest_and_landmark_envelopes_are_hard_requirements(mutation: str, failure: str) -> None:
    payload = _positive()
    tongue = _mesh(payload, "Tongue")
    match mutation:
        case "missing_role": tongue["role"] = None
        case "hidden_role": tongue["visible_render"] = False
        case "outside_envelope":
            for vertex in _vertices(tongue):
                vertex[2] -= 1.0
        case unreachable: raise AssertionError(unreachable)
    report = audit_extraction(payload)
    assert report["status"] == "FAIL"
    assert failure in report["hard_failures"]


def test_missing_measured_ratio_target_is_unproven_not_pass() -> None:
    payload = _positive()
    _mapping(payload, "criteria")["ratio_targets"] = {}
    report = audit_extraction(payload)
    assert report["status"] == "UNPROVEN"
    assert "MEASURED_RATIO_TARGETS" in report["unproven"]


def test_bad_round1_baseline_is_rejected_without_cross_sex_rule() -> None:
    baseline = json.loads((ROUND2 / "fixtures/geometry-baseline.json").read_text())
    payload = _positive()
    body = _mesh(payload, "Body")
    vertices = _vertices(body)
    vertices.append([0.4, 0.25, 0.5])
    body["vertices"] = vertices
    for vertex in _vertices(_mesh(payload, "Tongue")):
        vertex[2] = 0.2482910230755806
    _mesh(payload, "UpperOral")["role"] = None
    report = audit_extraction(payload)
    assert baseline["scenes"]["failed_female_symmetric"]["head_to_total_height_ratio"] == pytest.approx(0.5063884631)
    assert {"SYMMETRY_UNMATCHED_VERTEX", "ROLE_OUTSIDE_LANDMARK_ENVELOPE", "REQUIRED_ROLE_MISSING"} <= set(report["hard_failures"])


def test_cli_returns_nonzero_for_failed_candidate(tmp_path: Path) -> None:
    payload = _positive()
    _mesh(payload, "Tongue")["visible_viewport"] = False
    input_path, output_path = tmp_path / "candidate.json", tmp_path / "report.json"
    input_path.write_text(json.dumps(payload), encoding="utf-8")
    completed = subprocess.run([sys.executable, "-m", "gate.geometry_report", "--input", str(input_path), "--output", str(output_path)], cwd=ROUND2, check=False, capture_output=True, text=True, timeout=30)
    assert completed.returncode == 2
    assert json.loads(output_path.read_text())["status"] == "FAIL"


@pytest.mark.parametrize("has_ratio_target", [True, False])
def test_manifest_criteria_can_validate_real_unannotated_extraction(
    has_ratio_target: bool, tmp_path: Path,
) -> None:
    # Given: native-style measurements contain no repair-authored approval criteria.
    payload = _positive()
    criteria = payload.pop("criteria")
    payload.pop("criteria_version")
    assert isinstance(criteria, dict)
    if not has_ratio_target:
        criteria["ratio_targets"] = {}
    meshes = payload["meshes"]
    assert isinstance(meshes, list)
    for mesh in meshes:
        assert isinstance(mesh, dict)
        mesh["role"] = None
    manifest = {"schema_version": 1, "criteria": criteria}
    input_path = tmp_path / "native.json"
    manifest_path = tmp_path / "manifest.json"
    output_path = tmp_path / "report.json"
    input_path.write_text(json.dumps(payload), encoding="utf-8")
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    # When: the CLI binds independently declared roles/criteria to measured objects.
    completed = subprocess.run(
        [sys.executable, "-m", "gate.geometry_report", "--input", str(input_path),
         "--manifest", str(manifest_path), "--output", str(output_path)],
        cwd=ROUND2, capture_output=True, text=True, check=False, timeout=30,
    )
    # Then: actual coordinates determine the ratio; a missing target is UNPROVEN.
    assert output_path.exists(), completed.stderr
    report = json.loads(output_path.read_text())
    assert report["hard_failures"] == []
    if has_ratio_target:
        assert report["status"] == "PASS"
        measured = next(check for check in report["checks"] if check["check_id"] == "geometry-measured-ratio")
        assert measured["measurements"]["measured_ratio"] == pytest.approx(0.1)
    else:
        assert report["status"] == "UNPROVEN"
        assert "MEASURED_RATIO_TARGETS" in report["unproven"]


def test_native_blender_extraction_uses_evaluated_world_geometry(tmp_path: Path) -> None:
    fixture_script, fixture_blend, extracted = tmp_path / "create_geometry_fixture.py", tmp_path / "geometry-fixture.blend", tmp_path / "geometry-extracted.json"
    fixture_script.write_text("""import bpy
from pathlib import Path
mesh=bpy.data.meshes.new('BodyMesh')
mesh.from_pydata([(-1,0,0),(1,0,0),(0,1,0),(0,0,2)],[(0,1),(0,2),(0,3),(1,2),(1,3),(2,3)],[(0,2,1),(0,1,3),(1,2,3),(2,0,3)])
obj=bpy.data.objects.new('Body',mesh)
obj['geometry_role']='body'
bpy.context.scene.collection.objects.link(obj)
modifier=obj.modifiers.new('EvaluatedShift','DISPLACE')
modifier.strength=0.125
modifier.direction='Z'
bpy.ops.wm.save_as_mainfile(filepath=str(Path(r'""" + str(fixture_blend) + """')))
""", encoding="utf-8")
    subprocess.run(["/Applications/Blender.app/Contents/MacOS/Blender", "--background", "--factory-startup", "--python-exit-code", "1", "--python", str(fixture_script)], check=True, capture_output=True, text=True, timeout=60)
    subprocess.run(["/Applications/Blender.app/Contents/MacOS/Blender", "--background", "--factory-startup", "--python-exit-code", "1", str(fixture_blend), "--python", str(ROUND2 / "scripts/extract_geometry.py"), "--", "--output", str(extracted)], check=True, capture_output=True, text=True, timeout=60)
    payload = json.loads(extracted.read_text())
    body = next(mesh for mesh in payload["meshes"] if mesh["object_name"] == "Body")
    assert body["triangle_count"] == 4
    assert body["role"] == "body"
    assert min(vertex[2] for vertex in body["vertices"]) == pytest.approx(0.0625)
    assert payload["source"]["sha256"] != "0" * 64
