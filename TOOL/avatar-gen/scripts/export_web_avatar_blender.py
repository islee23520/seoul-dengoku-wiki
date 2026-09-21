"""Blender-side GLB export preserving toggleable mesh object names."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--inventory", type=Path, required=True)
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1:])


def main() -> None:
    args = arguments()
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError("avatar has no meshes")
    points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    inventory = {
        "meshes": [{"name": obj.name, "vertexCount": len(obj.data.vertices)} for obj in meshes],
        "bounds": {
            "min": [min(point[axis] for point in points) for axis in range(3)],
            "max": [max(point[axis] for point in points) for axis in range(3)],
        },
    }
    for obj in meshes:
        obj.hide_render = False
        obj.hide_set(False)
    bpy.ops.export_scene.gltf(
        filepath=str(args.output),
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        export_skins=False,
        export_morph=False,
        export_extras=True,
    )
    args.inventory.write_text(json.dumps(inventory, indent=2) + "\n", encoding="utf-8")
    print(f"AVATAR_WEB_EXPORT_OK meshes={len(meshes)}")


main()
