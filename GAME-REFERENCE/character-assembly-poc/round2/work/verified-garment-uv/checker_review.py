# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# Run: Blender -b input.blend --python checker_review.py -- before|after
"""Render disposable checker copies; never save altered materials or scene."""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
label = sys.argv[sys.argv.index("--") + 1]
input_path = Path(bpy.data.filepath)
input_sha = hashlib.sha256(input_path.read_bytes()).hexdigest()
directory = HERE / label
directory.mkdir(exist_ok=True)
scene = bpy.data.scenes.new("DisposableUVReview")
bpy.context.window.scene = scene
for name in ("Female_Bandeau_Measured", "Female_Briefs_Panel"):
    original = bpy.data.objects[name]
    clone = original.copy()
    clone.data = original.data.copy()
    scene.collection.objects.link(clone)
    clone.hide_render = False
    clone.hide_set(False)
checker = bpy.data.materials.new("Disposable_UV_Checker_64")
checker.use_nodes = True
nodes = checker.node_tree.nodes
nodes.clear()
output = nodes.new("ShaderNodeOutputMaterial")
emission = nodes.new("ShaderNodeEmission")
texture = nodes.new("ShaderNodeTexChecker")
uv = nodes.new("ShaderNodeTexCoord")
texture.inputs["Scale"].default_value = 64
texture.inputs["Color1"].default_value = (0.06, 0.15, 0.2, 1)
texture.inputs["Color2"].default_value = (0.8, 0.85, 0.64, 1)
checker.node_tree.links.new(uv.outputs["UV"], texture.inputs["Vector"])
checker.node_tree.links.new(texture.outputs["Color"], emission.inputs["Color"])
checker.node_tree.links.new(emission.outputs[0], output.inputs["Surface"])
scene.view_layers[0].material_override = checker
scene.render.engine = "CYCLES"
scene.cycles.samples = 16
scene.render.threads_mode = "FIXED"
scene.render.threads = 8
scene.render.resolution_x = 1200
scene.render.resolution_y = 1100
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = "Standard"
scene.world = bpy.data.worlds.new("ReviewBackground")
scene.world.color = (0.055, 0.055, 0.055)
camera_data = bpy.data.cameras.new("ReviewCamera")
camera = bpy.data.objects.new("ReviewCamera", camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.type = "ORTHO"
views = {
    "front": ((0, -4, 0), (0, 0, 1.02), 0.61),
    "back": ((0, 4, 0), (0, 0, 1.02), 0.61),
    "side": ((4, 0, 0), (0, 0, 1.02), 0.61),
    "bandeau-front": ((0, -4, 0), (0, 0, 1.16), 0.34),
    "briefs-front": ((0, -4, 0), (0, 0, 0.875), 0.45),
    "briefs-back": ((0, 4, 0), (0, 0.01, 0.875), 0.45),
    "crotch": ((0, 2, -3), (0, 0, 0.84), 0.46),
}
for name, (direction, target, scale) in views.items():
    for obj in scene.objects:
        if obj.type == "MESH":
            obj.hide_render = name == "crotch" and "Bandeau" in obj.name
    camera.location = Vector(target) + Vector(direction)
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera_data.ortho_scale = scale
    scene.render.filepath = str(directory / f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("CHECKER_VIEW", label, name, flush=True)
assert hashlib.sha256(input_path.read_bytes()).hexdigest() == input_sha
(directory / "receipt.json").write_text(json.dumps({"source":str(input_path),"source_sha256":input_sha,
    "disposable_material_override":True,"source_not_saved":True,"checker_scale":64,
    "resolution":[1200,1100],"views":views,"emission_no_baked_shadows":True,
    "image_sha256":{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in directory.glob("*.png")}},indent=2))
print("CHECKER_COMPLETE", label, flush=True)
