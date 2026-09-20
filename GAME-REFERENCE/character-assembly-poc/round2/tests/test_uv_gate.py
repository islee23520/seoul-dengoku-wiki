"""Regression tests for native UV extraction and strict audit verdicts."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Final

import numpy as np
import pytest

ROUND2: Final = Path(__file__).resolve().parents[1]
GATE: Final = ROUND2 / "gate"
sys.path.insert(0, str(ROUND2))

from gate.uv_audit import audit_triangles
from gate.uv_report import audit_extraction


def _triangle_payload(triangles: list[list[list[float]]]) -> dict[str, object]:
    return {
        "schema_version": 1,
        "source": {
            "path": "/fixture.blend",
            "sha256": "0" * 64,
            "blender_version": "fixture",
        },
        "meshes": [
            {
                "object_name": "Fixture",
                "status": "OK",
                "uv_layer": "UVMap",
                "triangle_count": len(triangles),
                "triangles": [
                    {
                        "triangle_id": index,
                        "polygon_id": index,
                        "loop_ids": [index * 3, index * 3 + 1, index * 3 + 2],
                        "uv": triangle,
                    }
                    for index, triangle in enumerate(triangles)
                ],
            }
        ],
    }


def test_boundary_contact_and_disjoint_triangles_pass() -> None:
    # Given
    triangles = np.asarray(
        [
            [[0.0, 0.0], [0.5, 0.0], [0.0, 0.5]],
            [[0.5, 0.0], [0.5, 0.5], [0.0, 0.5]],
            [[0.6, 0.6], [0.9, 0.6], [0.6, 0.9]],
        ],
        dtype=np.float64,
    )

    # When
    result = audit_triangles(triangles)

    # Then
    assert result.status == "PASS"
    assert result.overlaps == ()


@pytest.mark.parametrize(
    ("triangles", "failure"),
    [
        (np.zeros((2, 2, 2), dtype=np.float64), "MALFORMED_TRIANGLE_SHAPE"),
        (np.empty((0, 3, 2), dtype=np.float64), "EMPTY_TRIANGLES"),
        (
            np.asarray([[[0.0, 0.0], [np.nan, 0.0], [0.0, 1.0]]]),
            "NONFINITE_UV",
        ),
        (
            np.asarray([[[0.0, 0.0], [0.5, 0.0], [1.0, 0.0]]]),
            "DEGENERATE_UV_TRIANGLE",
        ),
        (
            np.asarray([[[0.0, 0.0], [1.01, 0.0], [0.0, 1.0]]]),
            "UV_OUT_OF_TILE",
        ),
    ],
)
def test_hard_triangle_failures_are_conjunctive(
    triangles: np.ndarray,
    failure: str,
) -> None:
    # Given / When
    result = audit_triangles(triangles)

    # Then
    assert result.status == "FAIL"
    assert failure in result.hard_failures


def test_same_polygon_fold_is_positive_overlap() -> None:
    # Given
    triangles = np.asarray(
        [
            [[0.0, 0.0], [1.0, 0.0], [0.0, 1.0]],
            [[0.0, 1.0], [1.0, 0.0], [0.0, 0.0]],
        ]
    )

    # When
    result = audit_triangles(triangles, polygon_ids=(7, 7))

    # Then
    assert result.status == "FAIL"
    assert len(result.overlaps) == 1
    assert result.overlaps[0].classification == "POSITIVE_AREA_OVERLAP"


def test_finite_out_of_tile_data_is_rejected_before_overflow() -> None:
    # Given: finite but invalid atlas coordinates, not NaN/Inf input.
    triangles = np.asarray([[[0.0, 0.0], [1.0e308, 0.0], [0.0, 1.0e308]]])
    # When: the gate evaluates them under strict numerical error handling.
    with np.errstate(over="raise", invalid="raise"):
        result = audit_triangles(triangles)
    # Then: a bad asset produces a diagnosed rejection, not overflow or huge bins.
    assert result.status == "FAIL"
    assert "UV_OUT_OF_TILE" in result.hard_failures


def test_adjacent_positive_overlap_is_not_exempted() -> None:
    # Given
    triangles = np.asarray(
        [
            [[0.0, 0.0], [1.0, 0.0], [0.0, 1.0]],
            [[0.0, 1.0], [1.0, 0.0], [0.0, 0.0]],
        ]
    )

    # When
    result = audit_triangles(triangles, polygon_ids=(10, 11))

    # Then
    assert result.status == "FAIL"
    assert len(result.overlaps) == 1


@pytest.mark.parametrize("mesh_status", ["NO_UV", "EMPTY_MESH"])
def test_extraction_failures_cannot_become_pass(mesh_status: str) -> None:
    # Given
    payload = _triangle_payload(
        [[[0.0, 0.0], [0.5, 0.0], [0.0, 0.5]]]
    )
    meshes = payload["meshes"]
    assert isinstance(meshes, list)
    mesh = meshes[0]
    assert isinstance(mesh, dict)
    mesh["status"] = mesh_status
    mesh["triangle_count"] = 0
    mesh["triangles"] = []

    # When
    report = audit_extraction(payload)

    # Then
    assert report["status"] == "FAIL"
    assert mesh_status in report["hard_failures"]


def test_malformed_extraction_schema_is_error() -> None:
    # Given
    payload = _triangle_payload(
        [[[0.0, 0.0], [0.5, 0.0], [0.0, 0.5]]]
    )
    del payload["meshes"]

    # When
    report = audit_extraction(payload)

    # Then
    assert report["status"] == "ERROR"
    assert report["hard_failures"] == ["MALFORMED_EXTRACTION_JSON"]


@pytest.mark.parametrize("corruption", ["missing_source", "count_mismatch", "missing_uv_name"])
def test_incomplete_extraction_cannot_approve(corruption: str) -> None:
    # Given: one valid triangle but an incomplete or contradictory extraction receipt.
    payload = _triangle_payload([[[0.0, 0.0], [0.5, 0.0], [0.0, 0.5]]])
    meshes = payload["meshes"]
    assert isinstance(meshes, list)
    mesh = meshes[0]
    assert isinstance(mesh, dict)
    match corruption:
        case "missing_source":
            del payload["source"]
        case "count_mismatch":
            mesh["triangle_count"] = 2
        case "missing_uv_name":
            mesh["uv_layer"] = None
        case _:
            raise AssertionError(corruption)

    # When: the actual report boundary evaluates this receipt.
    report = audit_extraction(payload)

    # Then: missing provenance, dropped triangles and missing UV cannot be approved.
    assert report["status"] == "ERROR"
    assert report["hard_failures"] == ["MALFORMED_EXTRACTION_JSON"]


def test_verdict_binds_to_the_extracted_source_hash() -> None:
    # Given: the same clean triangles in two independently identified inputs.
    payload = _triangle_payload([[[0.0, 0.0], [0.5, 0.0], [0.0, 0.5]]])
    payload["source"] = {
        "path": "/measured/input.blend",
        "sha256": "a1" * 32,
        "blender_version": "5.2.2 LTS",
    }
    # When: a verdict is emitted independently of the input extraction file.
    report = audit_extraction(payload)
    # Then: reviewers can bind the verdict back to the exact measured input.
    assert report.get("source") == payload["source"]


def test_cli_audits_json_without_silent_fallback(tmp_path: Path) -> None:
    # Given
    payload = _triangle_payload(
        [
            [[0.0, 0.0], [1.0, 0.0], [0.0, 1.0]],
            [[0.0, 1.0], [1.0, 0.0], [0.0, 0.0]],
        ]
    )
    input_path = tmp_path / "extracted.json"
    output_path = tmp_path / "verdict.json"
    input_path.write_text(json.dumps(payload), encoding="utf-8")

    # When
    completed = subprocess.run(
        [
            str(ROUND2 / ".venv/bin/python"),
            "-m",
            "gate.uv_report",
            "--input",
            str(input_path),
            "--output",
            str(output_path),
        ],
        check=False,
        capture_output=True,
        text=True,
        timeout=30,
    )

    # Then
    assert completed.returncode == 2
    verdict = json.loads(output_path.read_text(encoding="utf-8"))
    assert verdict["status"] == "FAIL"
    assert verdict["checks"][0]["measurements"]["positive_area_overlap_count"] == 1


def test_native_extractor_reads_blender_loop_ids_and_uv(tmp_path: Path) -> None:
    # Given: a real Blender fixture containing a concave polygon with loop UVs.
    fixture_script = tmp_path / "create_fixture.py"
    fixture_blend = tmp_path / "fixture.blend"
    extracted_path = tmp_path / "extracted.json"
    fixture_script.write_text(
        """import bpy
from pathlib import Path
vertices=[(0,0,0),(2,0,0),(2,2,0),(1,1,0),(0,2,0)]
mesh=bpy.data.meshes.new('NativeFixture')
mesh.from_pydata(vertices,[],[[0,1,2,3,4]])
uv=mesh.uv_layers.new(name='UVMap')
values=[(0,0),(1,0),(1,1),(0.5,0.5),(0,1)]
for loop,value in zip(mesh.loops,values,strict=True): uv.data[loop.index].uv=value
obj=bpy.data.objects.new('NativeFixture',mesh)
bpy.context.scene.collection.objects.link(obj)
bpy.ops.wm.save_as_mainfile(filepath=str(Path(r'"""
        + str(fixture_blend)
        + """')))
""",
        encoding="utf-8",
    )
    subprocess.run(
        [
            "/Applications/Blender.app/Contents/MacOS/Blender",
            "--background",
            "--factory-startup",
            "--python-exit-code",
            "1",
            "--python",
            str(fixture_script),
        ],
        check=True,
        capture_output=True,
        text=True,
        timeout=60,
    )

    # When: the production extractor reads the saved fixture in a fresh process.
    subprocess.run(
        [
            "/Applications/Blender.app/Contents/MacOS/Blender",
            "--background",
            "--factory-startup",
            "--python-exit-code",
            "1",
            str(fixture_blend),
            "--python",
            str(ROUND2 / "scripts/extract_uv.py"),
            "--",
            "--output",
            str(extracted_path),
        ],
        check=True,
        capture_output=True,
        text=True,
        timeout=60,
    )
    extracted = json.loads(extracted_path.read_text(encoding="utf-8"))

    # Then: Blender's native three loop-triangles are the extraction source.
    fixture_mesh = next(
        mesh for mesh in extracted["meshes"] if mesh["object_name"] == "NativeFixture"
    )
    assert fixture_mesh["triangle_count"] == 3
    assert [
        triangle["loop_ids"] for triangle in fixture_mesh["triangles"]
    ] == [[1, 2, 3], [3, 4, 0], [0, 1, 3]]
