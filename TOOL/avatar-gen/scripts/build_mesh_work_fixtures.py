"""Build deterministic Blender fixtures for mesh-work audit and safe repair QA."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import bpy


def args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--kind", choices=("winding", "clean"), required=True)
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])


def main() -> None:
    parsed = args()
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    mesh = bpy.data.meshes.new("FixtureMesh")
    vertices = [(1, 1, 1), (-1, -1, 1), (-1, 1, -1), (1, -1, -1)]
    clean_faces = [(0, 2, 1), (0, 1, 3), (0, 3, 2), (1, 2, 3)]
    faces = clean_faces if parsed.kind == "clean" else [(0, 1, 2), *clean_faces[1:]]
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("Fixture", mesh)
    bpy.context.scene.collection.objects.link(obj)
    parsed.output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(parsed.output.resolve()))
    print(f"MESH_WORK_FIXTURE_OK kind={parsed.kind}")


main()
