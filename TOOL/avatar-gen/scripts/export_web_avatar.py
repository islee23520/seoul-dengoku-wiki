#!/usr/bin/env python3
"""Export the canonical full-body avatar to GLB and write a shared renderer contract."""

from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
from pathlib import Path

TOOL_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = TOOL_ROOT.parents[1]
SOURCE = REPOSITORY_ROOT / "ART-ASSETS/avatar-gen/deliverables/female-underwear.blend"
UNITY_FBX = REPOSITORY_ROOT / "ART-ASSETS/avatar-gen/deliverables/female-underwear.fbx"
OUTPUT = REPOSITORY_ROOT / "ART-ASSETS/avatar-gen/runtime/female-underwear"
BLENDER = Path(os.environ.get("BLENDER_PATH", "/Applications/Blender.app/Contents/MacOS/Blender"))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def stable_id(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def category(name: str) -> str:
    lowered = name.lower()
    if "eye" in lowered or "cornea" in lowered or "iris" in lowered or "pupil" in lowered:
        return "eyes"
    if "tooth" in lowered or "gum" in lowered or "tongue" in lowered or "mouth" in lowered or "oral" in lowered:
        return "oral"
    if "bandeau" in lowered or "brief" in lowered or "underwear" in lowered or "garment" in lowered:
        return "clothing"
    if "base" in lowered or "body" in lowered:
        return "body"
    return "parts"


def main() -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    glb = OUTPUT / "female-underwear.glb"
    inventory = OUTPUT / "blender-inventory.json"
    script = TOOL_ROOT / "scripts/export_web_avatar_blender.py"
    subprocess.run([
        str(BLENDER), "--background", "--factory-startup", str(SOURCE),
        "--python-exit-code", "1", "--python", str(script), "--",
        "--output", str(glb), "--inventory", str(inventory),
    ], check=True)
    raw = json.loads(inventory.read_text(encoding="utf-8"))
    elements = [
        {
            "id": stable_id(item["name"]),
            "objectName": item["name"],
            "category": category(item["name"]),
            "defaultVisible": True,
            "vertexCount": item["vertexCount"],
        }
        for item in raw["meshes"]
    ]
    contract = {
        "schemaVersion": 1,
        "avatarId": "female-underwear",
        "displayName": "Female Underwear Base",
        "productSurface": "full-body-avatar-viewer",
        "portraitGeneration": False,
        "source": {"path": SOURCE.relative_to(REPOSITORY_ROOT).as_posix(), "sha256": sha256(SOURCE)},
        "coordinateSystems": {
            "blender": {"axes": {"handedness": "right", "up": "+Z", "forward": "-Y", "unitMeters": 1}},
            "gltf": {"axes": {"handedness": "right", "up": "+Y", "forward": "+Z", "unitMeters": 1}},
            "unity": {"axes": {"handedness": "left", "up": "+Y", "forward": "+Z", "unitMeters": 1}},
            "blenderToGltf": [[1,0,0],[0,0,1],[0,-1,0]],
            "blenderToUnity": [[1,0,0],[0,0,1],[0,1,0]],
            "gltfToUnity": [[1,0,0],[0,1,0],[0,0,-1]],
        },
        "boundsBlenderMeters": raw["bounds"],
        "elements": elements,
        "web": {"format": "glb", "path": glb.relative_to(REPOSITORY_ROOT).as_posix(), "sha256": sha256(glb)},
        "unity": {"format": "fbx", "path": UNITY_FBX.relative_to(REPOSITORY_ROOT).as_posix(), "sha256": sha256(UNITY_FBX)},
    }
    (OUTPUT / "avatar-contract.json").write_text(json.dumps(contract, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "PASS", "elements": len(elements), "glb": str(glb)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
