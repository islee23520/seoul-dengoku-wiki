# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
"""Inventory exact UV source and integration object names."""
import json
from pathlib import Path
import bpy

HERE = Path(__file__).resolve().parent
SOURCES = {
    "integrated": HERE.parent / "female-underwear-integrated/female-underwear-integrated-candidate.blend",
    "body_uv": HERE.parent / "female-local-uv-final/female-local-uv-final.blend",
    "garment_uv": HERE.parent / "verified-garment-uv/female-garment-uv.blend",
}


def main():
    report = {}
    for key, path in SOURCES.items():
        bpy.ops.wm.open_mainfile(filepath=str(path))
        report[key] = [{"name": obj.name, "type": obj.type, "vertices": len(obj.data.vertices) if obj.type == "MESH" else None, "polygons": len(obj.data.polygons) if obj.type == "MESH" else None, "uv": [layer.name for layer in obj.data.uv_layers] if obj.type == "MESH" else []} for obj in bpy.data.objects]
    (HERE / "source-inventory.json").write_text(json.dumps({"sources": {key: str(value) for key, value in SOURCES.items()}, "objects": report}, indent=2), encoding="utf-8")
    print("FEMALE_UV_SOURCES_PROBED", json.dumps(report), flush=True)


if __name__ == "__main__": main()
