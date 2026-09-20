# /// script
# requires-python = ">=3.13"
# dependencies = ["numpy"]
# ///
"""Fresh native UV audit for integrated body and two garments."""
from __future__ import annotations

import importlib.util
import json
import sys
from dataclasses import asdict
from pathlib import Path

import bpy
import numpy as np

HERE = Path(__file__).resolve().parent
ROUND2 = HERE.parents[1]


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


uv_audit = load_module("integrated_uv_audit", ROUND2 / "gate/uv_audit.py")


def extract(obj, layer_name):
    mesh = obj.data
    layer = mesh.uv_layers[layer_name]
    mesh.calc_loop_triangles()
    rows = []
    for index, triangle in enumerate(mesh.loop_triangles):
        loops = list(triangle.loops)
        rows.append({"triangle_id": index, "polygon_id": triangle.polygon_index, "uv": [tuple(layer.data[loop].uv) for loop in loops]})
    return rows


def main():
    objects = {
        "body": (bpy.data.objects["Female_SmoothDoll_Body"], "AtlasUV"),
        "bandeau": (bpy.data.objects["Female_Bandeau_Measured"], "GarmentUV_4K"),
        "briefs": (bpy.data.objects["Female_Briefs_Panel"], "GarmentUV_4K"),
    }
    report = {"candidate": bpy.data.filepath, "objects": {}}
    extracted = {}
    for key, (obj, layer) in objects.items():
        rows = extract(obj, layer)
        extracted[key] = rows
        result = uv_audit.audit_triangles(np.asarray([row["uv"] for row in rows], dtype=np.float64), polygon_ids=np.asarray([row["polygon_id"] for row in rows], dtype=np.int64))
        report["objects"][key] = {"object": obj.name, "layer": layer, "triangles": len(rows), "verdict": asdict(result)}
    garment_rows = extracted["bandeau"] + extracted["briefs"]
    garment_result = uv_audit.audit_triangles(np.asarray([row["uv"] for row in garment_rows], dtype=np.float64), polygon_ids=np.arange(len(garment_rows), dtype=np.int64))
    report["combined_garment_atlas"] = asdict(garment_result)
    report["status"] = "PASS" if all(item["verdict"]["status"] == "PASS" for item in report["objects"].values()) and report["combined_garment_atlas"]["status"] == "PASS" else "FAIL"
    (HERE / "native-uv-verdict.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print("FEMALE_UV_NATIVE_VERDICT", report["status"], json.dumps({key: value["verdict"]["status"] for key, value in report["objects"].items()}), "combined", report["combined_garment_atlas"]["status"], flush=True)
    if report["status"] != "PASS":
        raise SystemExit(2)


if __name__ == "__main__": main()
