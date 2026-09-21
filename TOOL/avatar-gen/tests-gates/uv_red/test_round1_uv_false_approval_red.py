# /// script
# requires-python = ">=3.13"
# dependencies = ["numpy>=2.4", "pytest"]
# ///
"""The captured round-one regressions applied to the corrected round-two seam."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Final

import numpy as np
import pytest

ROUND2: Final = Path(__file__).resolve().parents[2]
BLENDER: Final = Path("/Applications/Blender.app/Contents/MacOS/Blender")
NATIVE_PROBE: Final = Path(__file__).with_name("native_concave_probe.py")
sys.path.insert(0, str(ROUND2))

from gate.uv_audit import audit_triangles


def test_clean_edge_contact_and_disjoint_triangles_remain_approved() -> None:
    # Given
    triangles = np.asarray(
        [
            [[0.0, 0.0], [0.25, 0.0], [0.0, 0.25]],
            [[0.25, 0.0], [0.25, 0.25], [0.0, 0.25]],
            [[0.5, 0.5], [0.75, 0.5], [0.5, 0.75]],
        ]
    )

    # When
    result = audit_triangles(triangles)

    # Then
    assert result.status == "PASS"
    assert result.hard_failures == ()
    assert result.overlaps == ()


def test_malformed_triangle_shape_is_rejected() -> None:
    # Given
    malformed = np.zeros((2, 2, 2), dtype=np.float64)

    # When
    result = audit_triangles(malformed)

    # Then
    assert result.hard_failures == ("MALFORMED_TRIANGLE_SHAPE",)


def test_dict_shaped_positive_overlap_is_preserved_in_typed_result() -> None:
    # Given
    triangles = np.asarray(
        [
            [[0.0, 0.0], [1.0, 0.0], [0.0, 1.0]],
            [[0.0, 1.0], [1.0, 0.0], [0.0, 0.0]],
        ]
    )

    # When
    result = audit_triangles(triangles)

    # Then
    assert result.status == "FAIL"
    assert len(result.overlaps) == 1


def test_nonfinite_failure_is_conjunctive() -> None:
    # Given / When
    result = audit_triangles(
        np.asarray([[[0.0, 0.0], [np.nan, 0.0], [0.0, 1.0]]])
    )

    # Then
    assert result.hard_failures == ("NONFINITE_UV",)


def test_degenerate_failure_is_conjunctive() -> None:
    # Given / When
    result = audit_triangles(
        np.asarray([[[0.0, 0.0], [0.5, 0.0], [1.0, 0.0]]])
    )

    # Then
    assert "DEGENERATE_UV_TRIANGLE" in result.hard_failures


def test_adjacent_positive_area_overlap_cannot_be_exempted() -> None:
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
    assert len(result.overlaps) == 1


@pytest.mark.skipif(not BLENDER.is_file(), reason="Blender native extraction runs on the pinned macOS verification host")
def test_native_concave_polygon_uses_blender_loop_triangles(tmp_path: Path) -> None:
    # Given
    output_path = tmp_path / "native-concave.json"

    # When
    completed = subprocess.run(
        [
            str(BLENDER),
            "--background",
            "--factory-startup",
            "--python-exit-code",
            "1",
            "--python",
            str(NATIVE_PROBE),
            "--",
            str(output_path),
        ],
        check=True,
        capture_output=True,
        text=True,
        timeout=60,
    )
    result = json.loads(output_path.read_text(encoding="utf-8"))

    # Then
    assert completed.returncode == 0
    assert result["native_vertex_triangles"] == [
        [1, 2, 3],
        [3, 4, 0],
        [0, 1, 3],
    ]
    assert result["native_vertex_triangles"] != result["historical_fan_vertex_triangles"]
