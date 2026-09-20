# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Render recovered components alone and in arch context to classify their anatomy."""
from pathlib import Path
import sys

import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
scene=bpy.context.scene
parts=[o for o in scene.objects if o.type=='MESH']
scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
scene.render.resolution_x=900;scene.render.resolution_y=700;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.world=bpy.data.worlds.new('RecoveredPartsWorld');scene.world.color=(.3,.3,.3)
colors={'gum_arch':(.52,.22,.20,1),'recovered_crown_candidate':(.54,.49,.36,1)}
for obj in parts:
    mat=bpy.data.materials.new(obj.name+'_RoleColor');mat.use_nodes=True
    mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=colors[obj['role']]
    mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.8
    obj.data.materials.clear();obj.data.materials.append(mat)
camera=bpy.data.objects.new('RecoveredPartCamera',bpy.data.cameras.new('RecoveredPartCamera'));scene.collection.objects.link(camera);scene.camera=camera
camera.data.type='ORTHO';camera.data.clip_start=.00001
lights=[]
for i in range(2):
    light=bpy.data.objects.new(f'RecoveredPartLight{i}',bpy.data.lights.new(f'RecoveredPartLight{i}','AREA'));scene.collection.objects.link(light);lights.append(light)
stage=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'recovered-oral-parts'
out=ROOT/'evidence'/stage;out.mkdir(parents=True,exist_ok=True)
views=[(o.name,[o]) for o in parts]+[(jaw+'-assembly',[o for o in parts if o['jaw']==jaw]) for jaw in ['Upper','Lower']]
for label,objects in views:
    for obj in parts:obj.hide_render=obj not in objects
    points=[v.co for obj in objects for v in obj.data.vertices]
    center=Vector(tuple((min(p[a] for p in points)+max(p[a] for p in points))/2 for a in range(3)))
    size=max(max(p[a] for p in points)-min(p[a] for p in points) for a in range(3));camera.data.ortho_scale=size*1.4
    for light,direction in zip(lights,[Vector((-.8,-1,1)),Vector((1,.4,.5))]):
        light.location=center+direction*size*3;light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler();light.data.energy=size*size*80;light.data.size=size*2
    for view,direction in [('top',(0,-.1,1)),('bottom',(0,-.1,-1)),('side',(1,-.7,.2))]:
        camera.location=center+Vector(direction)*size*3;camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath=str(out/f'{label}-{view}.png');bpy.ops.render.render(write_still=True)
print('RECOVERED_ORAL_PARTS_RENDERED',flush=True)
