"""Apply an evidence-bounded Eevee toon ramp to all six finalized variants."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
SOURCE = Path(os.environ["SHADER_SOURCE"])
OUTPUT = HERE / os.environ["SHADER_OUTPUT"]
ROLE = os.environ["SHADER_ROLE"]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def mesh_hash(obj) -> str:
    payload = {
        "vertices": [list(vertex.co) for vertex in obj.data.vertices],
        "polygons": [list(polygon.vertices) for polygon in obj.data.polygons],
        "uv": {layer.name: [list(item.uv) for item in layer.data] for layer in obj.data.uv_layers},
        "matrix": [list(row) for row in obj.matrix_world],
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()


def color_source(nodes, links, obj, original):
    image = None
    uv_name = "FreeBoundaryUV" if obj.data.uv_layers.get("FreeBoundaryUV") else ("AtlasUV" if obj.data.uv_layers.get("AtlasUV") else None)
    if original is not None and original.use_nodes:
        for node in original.node_tree.nodes:
            if node.bl_idname == "ShaderNodeTexImage" and node.image is not None:
                image = node.image
                break
    if image is not None and uv_name:
        uv = nodes.new("ShaderNodeUVMap")
        uv.uv_map = uv_name
        texture = nodes.new("ShaderNodeTexImage")
        texture.image = image
        texture.interpolation = "Linear"
        links.new(uv.outputs["UV"], texture.inputs["Vector"])
        return texture.outputs["Color"], f"{uv_name}:{image.name}"
    if "SourceBoundColor" in obj.data.color_attributes:
        vertex = nodes.new("ShaderNodeVertexColor")
        vertex.layer_name = "SourceBoundColor"
        return vertex.outputs["Color"], "SourceBoundColor"
    rgb = nodes.new("ShaderNodeRGB")
    color = original.diffuse_color if original is not None else (0.55, 0.45, 0.42, 1)
    rgb.outputs[0].default_value = color
    return rgb.outputs[0], "constant-role-color"


def toon_material(obj, original, suffix):
    material = bpy.data.materials.new(f"Toon_{ROLE}_{suffix}")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    emission = nodes.new("ShaderNodeEmission")
    base, source_claim = color_source(nodes, links, obj, original)
    diffuse = nodes.new("ShaderNodeBsdfDiffuse")
    diffuse.inputs["Color"].default_value = (1, 1, 1, 1)
    diffuse.inputs["Roughness"].default_value = 0.65
    to_rgb = nodes.new("ShaderNodeShaderToRGB")
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.name = "EvidenceBounded_ConstantRamp"
    ramp.color_ramp.interpolation = "CONSTANT"
    ramp.color_ramp.elements[0].position = 0.38
    ramp.color_ramp.elements[0].color = (0.42, 0.42, 0.48, 1)
    ramp.color_ramp.elements[1].position = 0.64
    ramp.color_ramp.elements[1].color = (1.0, 0.96, 0.92, 1)
    multiply = nodes.new("ShaderNodeMixRGB")
    multiply.blend_type = "MULTIPLY"
    multiply.inputs[0].default_value = 1.0
    links.new(diffuse.outputs[0], to_rgb.inputs[0])
    links.new(to_rgb.outputs[0], ramp.inputs[0])
    links.new(base, multiply.inputs[1])
    links.new(ramp.outputs[0], multiply.inputs[2])
    links.new(multiply.outputs[0], emission.inputs["Color"])
    links.new(emission.outputs[0], output.inputs["Surface"])
    material["source_color_binding"] = source_claim
    material["shader_claim"] = "public-evidence-informed project-authored constant-ramp toon shader; not official game source"
    return material


def main() -> None:
    source_hash = sha(SOURCE)
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    before = {obj.name: mesh_hash(obj) for obj in scene.objects if obj.type == "MESH"}
    material_records = []
    for obj in scene.objects:
        if obj.type != "MESH" or "_Eye_" in obj.name:
            continue
        originals = list(obj.data.materials)
        if not originals:
            originals = [None]
        for index, original in enumerate(originals):
            material = toon_material(obj, original, f"{obj.name}_{index}")
            if index < len(obj.data.materials):
                obj.data.materials[index] = material
            else:
                obj.data.materials.append(material)
            material_records.append({
                "object": obj.name,
                "slot": index,
                "material": material.name,
                "source_color_binding": material["source_color_binding"],
            })
    sun_data = bpy.data.lights.new("Toon_MainSun_Data", "SUN")
    sun_data.energy = 3.0
    sun = bpy.data.objects.new("Toon_MainSun", sun_data)
    scene.collection.objects.link(sun)
    sun.rotation_euler = (0.45, -0.2, 0.35)
    scene["toon_shader_contract"] = "project-authored constant-ramp Eevee shader informed by public GDC evidence"
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT))
    changed = [name for name, digest in before.items() if mesh_hash(bpy.data.objects[name]) != digest]
    if changed:
        raise AssertionError({"geometry_or_uv_changed": changed})
    if sha(SOURCE) != source_hash:
        raise AssertionError("source changed")
    receipt = {
        "role": ROLE,
        "source": str(SOURCE),
        "source_sha256": source_hash,
        "candidate": str(OUTPUT),
        "candidate_sha256": sha(OUTPUT),
        "geometry_uv_preserved": True,
        "materials": material_records,
        "sun": sun.name,
        "claim": scene["toon_shader_contract"],
        "status": "FRESH_REOPEN_REQUIRED",
    }
    (HERE / f"{ROLE}-shader-receipt.json").write_text(json.dumps(receipt, indent=2))
    print("SIX_MODEL_SHADER_BUILT", json.dumps({"role": ROLE, "candidate": str(OUTPUT), "materials": len(material_records)}), flush=True)


if __name__ == "__main__":
    main()
