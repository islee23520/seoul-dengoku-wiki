# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# Run: Blender -b female-garment-uv-attempt-01.blend --python finalize_bundle.py
"""Finalize UV0, accurate physical-layer names and a garment-only candidate."""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
sys.dont_write_bytecode = True
sys.path.insert(0, str(HERE))
from uv_common import NAMES, SOURCE, SOURCE_SHA, fingerprint

assignment = json.loads((HERE / "assignment-attempt-01.json").read_text())
for name in NAMES:
    obj = bpy.data.objects[name]
    assert fingerprint(obj) == assignment["objects"][name]["semantic_sha256"]
    mesh = obj.data
    # The defective baseline is retained in the source and numbered evidence.
    for layer in list(mesh.uv_layers):
        if layer.name != "GarmentUV_4K":
            mesh.uv_layers.remove(layer)
    mesh.uv_layers.active_index = 0
    mesh.uv_layers[0].active_render = True
    assert fingerprint(obj) == assignment["objects"][name]["semantic_sha256"]
    assert len(mesh.uv_layers) == 1
    assert all(tuple(mesh.uv_layers[0].data[l["loop"]].uv)==tuple(l["uv"]) for l in assignment["objects"][name]["loops"])
for chart in assignment["charts"]:
    old = chart["name"]
    chart["construction_name"] = old
    if old == "Bandeau_Measured_inner":
        chart["name"] = "Bandeau_Measured_outer"
    if old == "Bandeau_Measured_outer":
        chart["name"] = "Bandeau_Measured_inner"
assignment["physical_layer_note"] = "Bandeau first 542 vertices are OUTER (Solidify offset=1); second 542 INNER. Briefs first 372 INNER, second 372 OUTER. Temporary construction identifiers followed index halves; final chart names correct the physical meaning. Exact UV coordinates are unchanged."
assignment["uv_index"] = 0
assignment["atlas_checker_png"] = "shared-checker-4096.png"
assignment["native_triangle_counts"] = {n:len(bpy.data.objects[n].data.loop_triangles) for n in NAMES}
assert set(o.name for o in bpy.data.objects) == set(NAMES)
candidate = HERE / "female-garment-uv.blend"
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(candidate), compress=True)
assignment["candidate_sha256"] = hashlib.sha256(candidate.read_bytes()).hexdigest()
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == SOURCE_SHA
(HERE / "original-loop-assignment.json").write_text(json.dumps(assignment, indent=2))
print("FINAL_BUNDLE_SAVED",assignment["candidate_sha256"],flush=True)
