from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

import pytest


BLENDER = Path(os.environ.get("BLENDER_PATH", "/Applications/Blender.app/Contents/MacOS/Blender"))
TOOL_ROOT = Path(__file__).resolve().parents[1]


@pytest.mark.skipif(not BLENDER.is_file(), reason="real Blender QA runs on the pinned macOS verification host")
def test_winding_fixture_is_audited_planned_repaired_and_reverified(tmp_path: Path) -> None:
    source = tmp_path / "winding.blend"
    output = tmp_path / "repaired.blend"
    build = TOOL_ROOT / "scripts/build_mesh_work_fixtures.py"
    subprocess.run([
        str(BLENDER), "--background", "--factory-startup", "--python-exit-code", "1", "--python", str(build), "--",
        "--kind", "winding", "--output", str(source),
    ], check=True, capture_output=True, text=True)
    completed = subprocess.run([
        "python3", str(TOOL_ROOT / "bin/avatar-gen.py"), "mesh-work",
        "--request", "노말 winding만 안전하게 수리해",
        "--source", str(source), "--output", str(output), "--work-dir", str(tmp_path / "work"), "--apply",
    ], check=False, capture_output=True, text=True)
    assert completed.returncode == 0, completed.stdout + completed.stderr
    receipt = json.loads((tmp_path / "work/mesh-work-receipt.json").read_text())
    assert receipt["status"] == "PASS"
    assert receipt["applied_actions"] == ["recalculate-normals"]
    assert source.read_bytes() != output.read_bytes()
    assert receipt["source"]["sha256"]


@pytest.mark.skipif(not BLENDER.is_file(), reason="real Blender QA runs on the pinned macOS verification host")
def test_apply_refuses_source_overwrite_before_blender(tmp_path: Path) -> None:
    source = tmp_path / "source.blend"
    source.write_bytes(b"placeholder")
    completed = subprocess.run([
        "python3", str(TOOL_ROOT / "bin/avatar-gen.py"), "mesh-work",
        "--request", "repair", "--source", str(source), "--output", str(source),
        "--work-dir", str(tmp_path / "work"), "--apply",
    ], check=False, capture_output=True, text=True)
    assert completed.returncode != 0
    assert "must not overwrite source" in completed.stderr
