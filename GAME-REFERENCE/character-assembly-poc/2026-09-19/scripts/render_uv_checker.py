# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Inspect the final atlas on actual geometry and report source material bindings."""
import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
obj = bpy.data.objects['Male_Base_Symmetric']
scene = bpy.context.scene
bpy.context.view_layer.update()
bindings = []
for index, material in enumerate(obj.data.materials):
    images = []
    for node in material.node_tree.nodes:
        if node.type == 'TEX_IMAGE' and node.image:
            images.append({'node': node.name, 'image': node.image.name, 'size': list(node.image.size), 'colorspace': node.image.colorspace_settings.name, 'links': [link.to_socket.name for output in node.outputs for link in output.links]})
    bindings.append({'slot': index, 'material': material.name, 'polygons': sum(p.material_index == index for p in obj.data.polygons), 'images': images})
(ROOT / 'reports/symmetric-source-materials.json').write_text(json.dumps(bindings, indent=2))
mat = bpy.data.materials.new('Atlas_Checker_64')
mat.use_nodes = True
nodes, links = mat.node_tree.nodes, mat.node_tree.links
uv = nodes.new('ShaderNodeUVMap')
uv.uv_map = 'AtlasUV'
checker = nodes.new('ShaderNodeTexChecker')
checker.inputs['Color1'].default_value = (.04, .08, .13, 1)
checker.inputs['Color2'].default_value = (.7, .75, .8, 1)
checker.inputs['Scale'].default_value = 64
links.new(uv.outputs['UV'], checker.inputs['Vector'])
links.new(checker.outputs['Color'], nodes['Principled BSDF'].inputs['Base Color'])
nodes['Principled BSDF'].inputs['Roughness'].default_value = .8
scene.view_layers[0].material_override = mat
scene.render.engine = 'CYCLES'
scene.cycles.samples = 16
scene.cycles.use_denoising = True
scene.render.resolution_x = 1000
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'AgX'
scene.world = bpy.data.worlds.new('AtlasReviewWorld')
scene.world.color = (.35, .35, .35)
cam = bpy.data.objects.new('AtlasCamera', bpy.data.cameras.new('AtlasCamera'))
scene.collection.objects.link(cam)
scene.camera = cam
cam.data.type = 'ORTHO'
cam.data.clip_start = .001
lights = []
for i, offset in enumerate([(-1, -2, 3), (2, -1, 2)]):
    light = bpy.data.objects.new(f'AtlasLight{i}', bpy.data.lights.new(f'AtlasLight{i}', 'AREA'))
    scene.collection.objects.link(light)
    light.location = obj.matrix_world.translation + Vector(offset)
    light.data.energy = [110, 60][i]
    light.data.size = 2
    light.rotation_euler = (obj.matrix_world @ Vector((0, 0, 1)) - light.location).to_track_quat('-Z', 'Y').to_euler()
stage = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'male-atlas-checker'
output = ROOT / 'evidence' / stage
output.mkdir(parents=True, exist_ok=True)
for label, center_z, scale, direction in [('front', .91, 2.25, (0, -3, 0)), ('back', .91, 2.25, (0, 3, 0)), ('face-quarter', 1.67, .43, (.7, -1.2, .1)), ('neck', 1.55, .34, (-.7, -1.2, .05)), ('feet', .09, .65, (.2, -1.2, .4))]:
    target = obj.matrix_world @ Vector((0, 0, center_z))
    cam.location = target + Vector(direction)
    cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.data.ortho_scale = scale
    scene.render.filepath = str(output / f'{label}.png')
    bpy.ops.render.render(write_still=True)
print('ATLAS_CHECKER_RENDER_COMPLETE', flush=True)
