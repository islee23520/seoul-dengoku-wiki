# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Render female base from front/side/back/quarter views."""
from pathlib import Path
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
scene=bpy.context.scene
obj=bpy.data.objects['Female_Base_Assembly']
scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
scene.render.resolution_x=900;scene.render.resolution_y=1400;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.world=bpy.data.worlds.new('FemaleQAWorld');scene.world.color=(.35,.35,.35)
mat=bpy.data.materials.new('FemaleQAClay');mat.use_nodes=True
mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.46,.34,.25,1)
mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.8
scene.view_layers[0].material_override=mat
camera=bpy.data.objects.new('FemaleQACam',bpy.data.cameras.new('FemaleQACam'));scene.collection.objects.link(camera);scene.camera=camera
camera.data.type='ORTHO';camera.data.clip_start=.001;camera.data.clip_end=5
for i,offset in enumerate([(-2,-3,4),(2,-1,2),(0,3,3)]):
    light=bpy.data.objects.new(f'FemaleQALight{i}',bpy.data.lights.new(f'FemaleQALight{i}','AREA'));scene.collection.objects.link(light)
    light.location=Vector(offset);light.data.energy=[300,120,200][i];light.data.size=3
    light.rotation_euler=(Vector((0,0,.8))-light.location).to_track_quat('-Z','Y').to_euler()
output=ROOT/'evidence/female-base';output.mkdir(parents=True,exist_ok=True)
for view,direction in [('front',(0,-3,0)),('back',(0,3,0)),('left',(-3,0,0)),('right',(3,0,0)),('quarter',(2,-3,.5))]:
    camera.location=Vector(direction);camera.rotation_euler=(-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.ortho_scale=2.2
    scene.render.filepath=str(output/f'{view}.png');bpy.ops.render.render(write_still=True)
print('FEMALE_BASE_RENDERED',flush=True)
