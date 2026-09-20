# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
"""Copy verified loop UVs onto an exact-geometry female integration candidate."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
WORK = HERE.parent
TARGET = WORK / "female-underwear-integrated/female-underwear-integrated-candidate.blend"
BODY_SOURCE = WORK / "female-local-uv-final/female-local-uv-final.blend"
GARMENT_SOURCE = WORK / "verified-garment-uv/female-garment-uv.blend"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def topology(obj):
    return {
        "positions": [tuple(vertex.co) for vertex in obj.data.vertices],
        "edges": [tuple(edge.vertices) for edge in obj.data.edges],
        "loops": [loop.vertex_index for loop in obj.data.loops],
        "polygons": [(poly.loop_start, poly.loop_total, tuple(poly.vertices), poly.material_index) for poly in obj.data.polygons],
        "matrix": [tuple(row) for row in obj.matrix_world],
    }


def append_object(path, name, temporary_name):
    with bpy.data.libraries.load(str(path), link=False) as (_, loaded):
        loaded.objects = [name]
    obj = loaded.objects[0]
    if obj is None:
        raise RuntimeError({"missing_source_object": name, "path": str(path)})
    bpy.context.scene.collection.objects.link(obj)
    obj.name = temporary_name
    return obj


def copy_layer(source, target, source_layer, target_layer):
    if topology(source) != topology(target):
        raise AssertionError({"geometry_mismatch": [source.name, target.name]})
    existing = target.data.uv_layers.get(target_layer)
    if existing is not None:
        target.data.uv_layers.remove(existing)
    layer = target.data.uv_layers.new(name=target_layer)
    for source_loop, target_loop in zip(source.data.uv_layers[source_layer].data, layer.data, strict=True):
        target_loop.uv = source_loop.uv
    target.data.uv_layers.active = layer
    target.data.uv_layers.active_render = layer
    return {"source": source.name, "target": target.name, "source_layer": source_layer, "target_layer": target_layer, "loops": len(layer.data)}


def main():
    source_hashes = {"target": sha(TARGET), "body_uv": sha(BODY_SOURCE), "garment_uv": sha(GARMENT_SOURCE)}
    bpy.ops.wm.open_mainfile(filepath=str(TARGET))
    target_body = bpy.data.objects["Female_SmoothDoll_Body"]
    target_garments = {name: bpy.data.objects[name] for name in ("Female_Bandeau_Measured", "Female_Briefs_Panel")}
    body_before = topology(target_body)
    garment_before = {name: topology(obj) for name, obj in target_garments.items()}
    body_source = append_object(BODY_SOURCE, "Female_Base_Composed_Candidate", "TEMP_BODY_UV_SOURCE")
    garment_sources = {name: append_object(GARMENT_SOURCE, name, "TEMP_" + name) for name in target_garments}
    copies = [copy_layer(body_source, target_body, "AtlasUV", "AtlasUV")]
    for name, target in target_garments.items():
        copies.append(copy_layer(garment_sources[name], target, "GarmentUV_4K", "GarmentUV_4K"))
    bpy.data.objects.remove(body_source, do_unlink=True)
    for source in garment_sources.values():
        bpy.data.objects.remove(source, do_unlink=True)
    if topology(target_body) != body_before or any(topology(target_garments[name]) != garment_before[name] for name in target_garments):
        raise AssertionError("geometry changed while copying UV")
    bpy.context.scene["uv_integration_status"] = "BODY_ATLAS_AND_GARMENT_ATLAS_SEPARATE_TEXTURE_SETS"
    output = HERE / "female-underwear-uv-integrated.blend"
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(output))
    if any(sha(path) != expected for path, expected in ((TARGET, source_hashes["target"]), (BODY_SOURCE, source_hashes["body_uv"]), (GARMENT_SOURCE, source_hashes["garment_uv"]))):
        raise AssertionError("source changed")
    receipt = {"sources": {"target": str(TARGET), "body_uv": str(BODY_SOURCE), "garment_uv": str(GARMENT_SOURCE)}, "source_sha256": source_hashes, "candidate": str(output), "candidate_sha256": sha(output), "copies": copies, "body_geometry_exact": topology(target_body) == body_before, "garment_geometry_exact": {name: topology(target_garments[name]) == garment_before[name] for name in target_garments}, "atlas_policy": "Body AtlasUV and garments GarmentUV_4K use separate texture sets; cross-set overlap is not combined-atlas overlap.", "status": "CANDIDATE_NATIVE_UV_REOPEN_REQUIRED"}
    (HERE / "integration-receipt.json").write_text(json.dumps(receipt, indent=2), encoding="utf-8")
    print("FEMALE_UV_INTEGRATED", json.dumps({"candidate": str(output), "sha256": receipt["candidate_sha256"], "copies": copies}), flush=True)


if __name__ == "__main__": main()
