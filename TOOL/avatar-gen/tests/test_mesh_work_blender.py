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
    assert receipt["status"] == "REPAIRED_UNPROVEN"
    assert receipt["applied_actions"] == ["recalculate-normals"]
    assert source.read_bytes() != output.read_bytes()
    assert receipt["source"]["sha256"]
    assert "VISUAL_REVIEW" in receipt["unproven"]


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


@pytest.mark.skipif(not BLENDER.is_file(), reason="real Blender QA runs on the pinned macOS verification host")
def test_empty_scene_is_a_hard_failure(tmp_path: Path) -> None:
    source = tmp_path / "empty.blend"
    script = tmp_path / "empty.py"
    script.write_text("import bpy; bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(); bpy.ops.wm.save_as_mainfile(filepath=r'%s')\n" % source)
    subprocess.run([str(BLENDER), "--background", "--factory-startup", "--python-exit-code", "1", "--python", str(script)], check=True, capture_output=True, text=True)
    completed = subprocess.run([
        "python3", str(TOOL_ROOT / "bin/avatar-gen.py"), "mesh-work",
        "--request", "audit", "--source", str(source), "--work-dir", str(tmp_path / "work"),
    ], check=True, capture_output=True, text=True)
    receipt = json.loads((tmp_path / "work/mesh-work-receipt.json").read_text())
    assert receipt["hard_failures"] == ["EMPTY_MESH"]


@pytest.mark.skipif(not BLENDER.is_file(), reason="real Blender QA runs on the pinned macOS verification host")
def test_object_name_does_not_whitelist_open_boundary(tmp_path: Path) -> None:
    source = tmp_path / "gum.blend"
    script = tmp_path / "gum.py"
    script.write_text("""import bpy
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()
m=bpy.data.meshes.new('GumMesh'); m.from_pydata([(0,0,0),(1,0,0),(0,0,1)],[],[(0,1,2)])
o=bpy.data.objects.new('Gum',m); bpy.context.scene.collection.objects.link(o)
bpy.ops.wm.save_as_mainfile(filepath=r'%s')
""" % source)
    subprocess.run([str(BLENDER), "--background", "--factory-startup", "--python-exit-code", "1", "--python", str(script)], check=True, capture_output=True, text=True)
    subprocess.run(["python3", str(TOOL_ROOT / "bin/avatar-gen.py"), "mesh-work", "--request", "audit", "--source", str(source), "--work-dir", str(tmp_path / "work")], check=True, capture_output=True, text=True)
    receipt = json.loads((tmp_path / "work/mesh-work-receipt.json").read_text())
    assert "UNEXPECTED_BOUNDARY" in receipt["hard_failures"]


@pytest.mark.skipif(not BLENDER.is_file(), reason="real Blender QA runs on the pinned macOS verification host")
def test_translated_object_centerline_weld_is_blocked(tmp_path: Path) -> None:
    source = tmp_path / "translated.blend"
    script = tmp_path / "translated.py"
    script.write_text("""import bpy
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()
m=bpy.data.meshes.new('M'); m.from_pydata([(-1,0,0),(0,0,0),(0,0,0),(1,0,0)],[],[])
o=bpy.data.objects.new('Body',m); o.location.x=1; bpy.context.scene.collection.objects.link(o)
bpy.ops.wm.save_as_mainfile(filepath=r'%s')
""" % source)
    subprocess.run([str(BLENDER), "--background", "--factory-startup", "--python-exit-code", "1", "--python", str(script)], check=True, capture_output=True, text=True)
    plan = tmp_path / "plan.json"
    plan.write_text(json.dumps({"actions":[{"action":"weld-centerline","object_name":"Body","parameters":{"threshold_m":0.001},"authorization":"safe-local"}]}))
    output = tmp_path / "out.blend"
    completed = subprocess.run([str(BLENDER), "--background", "--factory-startup", str(source), "--python-exit-code", "1", "--python", str(TOOL_ROOT / "scripts/apply_mesh_plan_blender.py"), "--", "--plan", str(plan), "--output", str(output)], check=False, capture_output=True, text=True)
    assert completed.returncode != 0
    assert "requires identity object transform" in completed.stdout + completed.stderr
