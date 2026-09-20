# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
"""Apply verified UV layers to the saved-eye-corrected female candidate."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import bpy

HERE = Path(__file__).resolve().parent
WORK = HERE.parent
TARGET = WORK / "genshin-public-shader/female-underwear-eye-visible.blend"
UV_SOURCE = HERE / "female-underwear-uv-integrated.blend"
NAMES = {"Female_SmoothDoll_Body": "AtlasUV", "Female_Bandeau_Measured": "GarmentUV_4K", "Female_Briefs_Panel": "GarmentUV_4K"}


def sha(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def geometry(obj):
    return {"v": [tuple(v.co) for v in obj.data.vertices], "e": [tuple(e.vertices) for e in obj.data.edges], "l": [l.vertex_index for l in obj.data.loops], "p": [(p.loop_start,p.loop_total,tuple(p.vertices),p.material_index) for p in obj.data.polygons], "m": [tuple(row) for row in obj.matrix_world]}


def main():
    hashes = {"target": sha(TARGET), "uv_source": sha(UV_SOURCE)}
    bpy.ops.wm.open_mainfile(filepath=str(TARGET))
    target_objects = {name: bpy.data.objects[name] for name in NAMES}
    before = {name: geometry(obj) for name,obj in target_objects.items()}
    requested = tuple(NAMES.keys())
    with bpy.data.libraries.load(str(UV_SOURCE), link=False) as (_, loaded): loaded.objects = list(requested)
    imported = tuple(loaded.objects)
    if len(imported) != len(requested) or any(obj is None for obj in imported):
        raise AssertionError({"missing_imported_uv_source": list(requested)})
    # Blender renames appended objects when the target scene already owns the
    # same names. Keep identity from request order, never post-load names.
    sources = dict(zip(requested, imported, strict=True))
    copied = []
    for name, layer_name in NAMES.items():
        target = target_objects[name]
        source = sources[name]
        if geometry(source) != geometry(target): raise AssertionError({"geometry_mismatch":name})
        existing = target.data.uv_layers.get(layer_name)
        if existing is not None: target.data.uv_layers.remove(existing)
        layer = target.data.uv_layers.new(name=layer_name)
        for a,b in zip(source.data.uv_layers[layer_name].data,layer.data,strict=True): b.uv=a.uv
        target.data.uv_layers.active=layer; target.data.uv_layers.active_render=layer
        copied.append({"object":name,"layer":layer_name,"loops":len(layer.data)})
    for source in sources.values(): bpy.data.objects.remove(source,do_unlink=True)
    if any(geometry(target_objects[name]) != before[name] for name in NAMES): raise AssertionError("geometry changed")
    for side in ("L","R"):
        for role in ("Eye_Core","Eye_Cornea","IrisDisc","PupilDisc"):
            if bpy.data.objects[f"Female_{side}_{role}"].hide_render: raise AssertionError("eye hidden")
    output=HERE/"female-underwear-eye-uv-integrated.blend"
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(output))
    if sha(TARGET)!=hashes["target"] or sha(UV_SOURCE)!=hashes["uv_source"]: raise AssertionError("source changed")
    receipt={"sources":{"eye_fixed":str(TARGET),"uv_verified":str(UV_SOURCE)},"source_sha256":hashes,"candidate":str(output),"candidate_sha256":sha(output),"copied":copied,"geometry_exact":True,"eyes_saved_visible":True,"status":"UV_AND_EYE_REOPEN_GATES_REQUIRED"}
    (HERE/"eye-uv-promotion-receipt.json").write_text(json.dumps(receipt,indent=2),encoding="utf-8")
    print("FEMALE_EYE_UV_PROMOTED",json.dumps(receipt),flush=True)


if __name__=="__main__": main()
