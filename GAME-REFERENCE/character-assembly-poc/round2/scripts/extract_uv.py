# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
"""Extract evaluated Blender loop triangles and their exact loop UV values.

Run:
Blender --background --factory-startup --python-exit-code 1 <input.blend> \
  --python scripts/extract_uv.py -- --output extracted.json
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Final

bpy = __import__("bpy")

SCHEMA_VERSION: Final = 1


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    arguments = sys.argv[sys.argv.index("--") + 1 :]
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parsed = parser.parse_args(arguments)
    source_path = Path(bpy.data.filepath).resolve()
    dependency_graph = bpy.context.evaluated_depsgraph_get()
    meshes: list[dict[str, object]] = []
    total_triangles = 0
    for scene_object in sorted(bpy.context.scene.objects, key=lambda item: item.name):
        if scene_object.type != "MESH":
            continue
        evaluated_object = scene_object.evaluated_get(dependency_graph)
        evaluated_mesh = evaluated_object.to_mesh(preserve_all_data_layers=True, depsgraph=dependency_graph)
        try:
            if len(evaluated_mesh.vertices) == 0 or len(evaluated_mesh.polygons) == 0:
                meshes.append(
                    {
                        "object_name": scene_object.name,
                        "status": "EMPTY_MESH",
                        "uv_layer": None,
                        "triangle_count": 0,
                        "triangles": [],
                    }
                )
                continue
            uv_layer = evaluated_mesh.uv_layers.active
            if uv_layer is None:
                meshes.append(
                    {
                        "object_name": scene_object.name,
                        "status": "NO_UV",
                        "uv_layer": None,
                        "triangle_count": 0,
                        "triangles": [],
                    }
                )
                continue
            evaluated_mesh.calc_loop_triangles()
            triangles: list[dict[str, object]] = []
            for triangle_id, triangle in enumerate(evaluated_mesh.loop_triangles):
                loop_ids = [int(loop_id) for loop_id in triangle.loops]
                triangles.append(
                    {
                        "triangle_id": triangle_id,
                        "polygon_id": int(triangle.polygon_index),
                        "loop_ids": loop_ids,
                        "uv": [
                            [
                                float(uv_layer.data[loop_id].uv.x),
                                float(uv_layer.data[loop_id].uv.y),
                            ]
                            for loop_id in loop_ids
                        ],
                    }
                )
            meshes.append(
                {
                    "object_name": scene_object.name,
                    "status": "OK" if triangles else "EMPTY_MESH",
                    "uv_layer": uv_layer.name,
                    "triangle_count": len(triangles),
                    "triangles": triangles,
                }
            )
            total_triangles += len(triangles)
        finally:
            evaluated_object.to_mesh_clear()
    payload = {
        "schema_version": SCHEMA_VERSION,
        "source": {
            "path": str(source_path),
            "sha256": _sha256(source_path),
            "blender_version": bpy.app.version_string,
        },
        "meshes": meshes,
    }
    parsed.output.parent.mkdir(parents=True, exist_ok=True)
    parsed.output.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "status": "UV_EXTRACTION_COMPLETE",
                "mesh_count": len(meshes),
                "triangle_count": total_triangles,
                "output": str(parsed.output),
            }
        ),
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
