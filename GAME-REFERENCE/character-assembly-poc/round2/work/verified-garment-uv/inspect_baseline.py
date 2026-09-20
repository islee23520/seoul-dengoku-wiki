# /// script
# requires-python = ">=3.13"
# dependencies = ["numpy"]
# ///
# Run: Blender -b --factory-startup source.blend --python inspect_baseline.py
"""Inspect certified native shells without changing the source datablocks."""
from __future__ import annotations

import hashlib
import json
import sys
from collections import Counter
from dataclasses import asdict
from pathlib import Path

import bpy
import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.dont_write_bytecode = True
sys.path.insert(0, str(ROOT))
from gate.uv_audit import audit_triangles

NAMES = ("Female_Bandeau_Measured", "Female_Briefs_Panel")
source = Path(bpy.data.filepath)
assert hashlib.sha256(source.read_bytes()).hexdigest() == "0ac891a2625bb1330c1b5942945854c041d503e678da7406e304034264160a02"
objects = {}
for name in NAMES:
    obj = bpy.data.objects[name]
    mesh = obj.data
    mesh.calc_loop_triangles()
    half = len(mesh.vertices) // 2
    layers = {"inner": [], "outer": [], "rim": []}
    for p in mesh.polygons:
        layer = "inner" if max(p.vertices) < half else "outer" if min(p.vertices) >= half else "rim"
        layers[layer].append(p.index)
    uv = mesh.uv_layers.active
    uv_report = asdict(audit_triangles(np.array([[uv.data[i].uv[:] for i in t.loops] for t in mesh.loop_triangles]), [t.polygon_index for t in mesh.loop_triangles])) if uv else {"status": "NO_UV"}
    data = {"properties": dict(obj.items()), "attributes": [(a.name, a.domain, a.data_type) for a in mesh.attributes],
            "uv_layers": [u.name for u in mesh.uv_layers], "modifiers": [m.name for m in obj.modifiers],
            "materials": [m.name if m else None for m in mesh.materials], "material_indices": dict(Counter(p.material_index for p in mesh.polygons)),
            "vertices": [v.co[:] for v in mesh.vertices], "polygons": [p.vertices[:] for p in mesh.polygons],
            "triangle_vertices": [t.vertices[:] for t in mesh.loop_triangles], "triangle_loops": [t.loops[:] for t in mesh.loop_triangles],
            "polygon_loops": [list(p.loop_indices) for p in mesh.polygons], "matrix_world": [row[:] for row in obj.matrix_world],
            "layers": layers, "half": half, "baseline_uv": uv_report}
    objects[name] = data
    print("BASELINE", name, "half", half, "layers", {k:len(v) for k,v in layers.items()}, "props", dict(obj.items()), "attributes", data["attributes"], "uv", {k:v for k,v in uv_report.items() if k not in {"overlaps", "degenerate_triangle_ids"}}, flush=True)
(HERE / "baseline-inspection.json").write_text(json.dumps({"source": str(source), "objects": objects}, indent=2))
print("BASELINE_COMPLETE", flush=True)
