# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Real-surface check for baked source color, retaining all repair artifacts visibly."""
from pathlib import Path
import sys
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
obj=bpy.data.objects['Male_Base_Symmetric']
scene=bpy.context.scene
bpy.context.view_layer.update()
scene.view_layers[0].material_override=bpy.data.materials[obj['atlas_review_material']]
scene.render.engine='CYCLES'
scene.cycles.samples=16
scene.cycles.use_denoising=True
scene.render.resolution_x=1000
scene.render.resolution_y=1000
scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
scene.world=bpy.data.worlds.new('AtlasColorReviewWorld')
scene.world.color=(.3,.3,.3)
camera=bpy.data.objects.new('AtlasColorCamera',bpy.data.cameras.new('AtlasColorCamera'))
scene.collection.objects.link(camera);scene.camera=camera
camera.data.type='ORTHO';camera.data.clip_start=.001
for i,offset in enumerate([(-1,-2,3),(2,-1,2)]):
    light=bpy.data.objects.new(f'AtlasColorLight{i}',bpy.data.lights.new(f'AtlasColorLight{i}','AREA'))
    scene.collection.objects.link(light);light.location=obj.matrix_world.translation+Vector(offset)
    light.data.energy=[110,60][i];light.data.size=2
    light.rotation_euler=(obj.matrix_world@Vector((0,0,1))-light.location).to_track_quat('-Z','Y').to_euler()
stage=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'male-source-color-atlas'
output=ROOT/'evidence'/stage
output.mkdir(parents=True,exist_ok=True)
for label,z,scale,direction in [('front',.91,2.25,(0,-3,0)),('head',1.66,.43,(-.7,-1.2,.1)),('neck',1.55,.34,(.7,-1.2,.05)),('back',.91,2.25,(0,3,0))]:
    center=obj.matrix_world@Vector((0,0,z));camera.location=center+Vector(direction)
    camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=scale
    scene.render.filepath=str(output/f'{label}.png')
    bpy.ops.render.render(write_still=True)
print('ATLAS_COLOR_REVIEW_RENDERED',flush=True)
