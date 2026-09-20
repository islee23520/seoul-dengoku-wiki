# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Compare original and repaired tongue under identical neutral lighting."""
from pathlib import Path
import sys

import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
scene=bpy.context.scene
repaired=bpy.data.objects['Male_Tongue_Repaired']
with bpy.data.libraries.load(str(ROOT/'work/oral-separated-verified.blend'),link=False) as (src,dst):
    dst.objects=[n for n in src.objects if n.startswith('Male_Tongue')]
original=dst.objects[0];scene.collection.objects.link(original)
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=900;scene.render.resolution_y=700;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.world=bpy.data.worlds.new('TongueQAWorld');scene.world.color=(.25,.25,.25)
mat=bpy.data.materials.new('TongueQAClay');mat.use_nodes=True
mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.38,.20,.17,1)
mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.8
scene.view_layers[0].material_override=mat
camera=bpy.data.objects.new('TongueCamera',bpy.data.cameras.new('TongueCamera'));scene.collection.objects.link(camera);scene.camera=camera
camera.data.type='ORTHO';camera.data.ortho_scale=.31;camera.data.clip_start=.001
center=Vector((0,-.185,.273))
for i,offset in enumerate([(-.5,-.5,.6),(.5,.3,.4)]):
    light=bpy.data.objects.new(f'TongueLight{i}',bpy.data.lights.new(f'TongueLight{i}','AREA'));scene.collection.objects.link(light)
    light.location=center+Vector(offset);light.data.energy=10;light.data.size=.5
    light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler()
stage=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'male-tongue-repair'
output=ROOT/'evidence'/stage;output.mkdir(parents=True,exist_ok=True)
for label,obj in [('before',original),('after',repaired)]:
    original.hide_render=obj!=original;repaired.hide_render=obj!=repaired
    for view,direction in [('side',(-1,-.1,.1)),('opposite-side',(1,-.1,.1)),('top',(-.2,-.2,1)),('bottom',(-.2,-.2,-1))]:
        camera.location=center+Vector(direction)
        camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath=str(output/f'{label}-{view}.png');bpy.ops.render.render(write_still=True)
print('TONGUE_REPAIR_RENDER_COMPLETE',flush=True)
