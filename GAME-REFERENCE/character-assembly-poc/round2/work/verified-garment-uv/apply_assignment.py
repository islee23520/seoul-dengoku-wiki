# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# Run: Blender -b input.blend --python apply_assignment.py
"""Apply the reusable map in memory only; caller owns any separate output save."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
sys.dont_write_bytecode = True
sys.path.insert(0,str(HERE))
from uv_common import fingerprint

assignment = json.loads((HERE / "original-loop-assignment.json").read_text())
for name, mapping in assignment["objects"].items():
    obj = bpy.data.objects[name]
    assert fingerprint(obj) == mapping["semantic_sha256"], name
    mesh = obj.data
    assert len(mesh.loops) == len(mapping["loops"])
    for layer in list(mesh.uv_layers):
        mesh.uv_layers.remove(layer)
    layer = mesh.uv_layers.new(name=assignment["uv_layer"],do_init=False)
    layer.active_render = True
    for item in mapping["loops"]:
        assert mesh.loops[item["loop"]].vertex_index == item["vertex"]
        layer.data[item["loop"]].uv = item["uv"]
    for index in mapping["seam_edges"]:
        mesh.edges[index].use_seam = True
    assert fingerprint(obj) == mapping["semantic_sha256"]
    assert all(tuple(layer.data[item["loop"]].uv)==tuple(item["uv"]) for item in mapping["loops"])
print("ASSIGNMENT_REPLAY_PASS_IN_MEMORY_ONLY",flush=True)
