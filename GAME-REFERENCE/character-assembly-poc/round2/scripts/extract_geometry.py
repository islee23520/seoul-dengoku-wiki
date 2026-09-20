# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# How to run:
# Blender --background --factory-startup --python-exit-code 1 input.blend --python scripts/extract_geometry.py -- --output extracted.json
"""Extract evaluated world-space geometry with Blender native loop triangles."""

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
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parsed = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
    source_path = Path(bpy.data.filepath).resolve()
    dependency_graph = bpy.context.evaluated_depsgraph_get()
    bpy.context.view_layer.update()
    meshes: list[dict[str, object]] = []
    for scene_object in sorted(bpy.context.scene.objects, key=lambda item: item.name):
        if scene_object.type != "MESH":
            continue
        evaluated_object = scene_object.evaluated_get(dependency_graph)
        evaluated_mesh = evaluated_object.to_mesh(preserve_all_data_layers=True, depsgraph=dependency_graph)
        try:
            evaluated_mesh.calc_loop_triangles()
            world = evaluated_object.matrix_world
            vertices = [[float(value) for value in world @ vertex.co] for vertex in evaluated_mesh.vertices]
            triangles = [[int(vertex_id) for vertex_id in triangle.vertices] for triangle in evaluated_mesh.loop_triangles]
            meshes.append(
                {
                    "object_name": scene_object.name,
                    "status": "OK" if vertices and triangles else "EMPTY_MESH",
                    "visible_viewport": bool(scene_object.visible_get(view_layer=bpy.context.view_layer)),
                    "visible_render": not bool(scene_object.hide_render),
                    "role": scene_object.get("geometry_role"),
                    "vertex_count": len(vertices),
                    "edge_count": len(evaluated_mesh.edges),
                    "triangle_count": len(triangles),
                    "vertices": vertices,
                    "edges": [[int(vertex_id) for vertex_id in edge.vertices] for edge in evaluated_mesh.edges],
                    "triangles": triangles,
                }
            )
        finally:
            evaluated_object.to_mesh_clear()
    payload = {
        "schema_version": SCHEMA_VERSION,
        "source": {"path": str(source_path), "sha256": _sha256(source_path), "blender_version": bpy.app.version_string},
        "meshes": meshes,
    }
    parsed.output.parent.mkdir(parents=True, exist_ok=True)
    parsed.output.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "GEOMETRY_EXTRACTION_COMPLETE", "mesh_count": len(meshes), "output": str(parsed.output)}), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
