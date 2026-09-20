# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Extract native Blender tessellation for a geometrically known concave polygon."""

from __future__ import annotations

import json
import sys
from pathlib import Path

bpy = __import__("bpy")

output_path = Path(sys.argv[sys.argv.index("--") + 1])
vertices = [
    (0.0, 0.0, 0.0),
    (2.0, 0.0, 0.0),
    (2.0, 2.0, 0.0),
    (1.0, 1.0, 0.0),
    (0.0, 2.0, 0.0),
]
mesh = bpy.data.meshes.new("ConcaveKnownAnswer")
mesh.from_pydata(vertices, [], [[0, 1, 2, 3, 4]])
mesh.update()
mesh.calc_loop_triangles()

native = [
    [int(triangle.vertices[index]) for index in range(3)]
    for triangle in mesh.loop_triangles
]
historical_fan = [[0, index + 1, index + 2] for index in range(len(vertices) - 2)]
payload = {
    "fixture_id": "concave-arrow-five-vertex",
    "vertices_xy": [[x, y] for x, y, _z in vertices],
    "polygon_vertex_order": [0, 1, 2, 3, 4],
    "native_vertex_triangles": native,
    "historical_fan_vertex_triangles": historical_fan,
    "blender_version": bpy.app.version_string,
}
output_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
