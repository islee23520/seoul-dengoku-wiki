# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Separate low-poly shadow-terminator artifacts from geometric deformation."""
import hashlib
import json
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
obj=bpy.data.objects['Male_Tongue_Repaired']
scene=bpy.context.scene
for other in scene.objects:
    if other.type=='MESH':other.hide_render=other!=obj
data=np.empty(len(obj.data.vertices)*3,np.float32);obj.data.vertices.foreach_get('co',data)
before_hash=hashlib.sha256(data.tobytes()).hexdigest()
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=900;scene.render.resolution_y=700;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.world=bpy.data.worlds.new('ShadowABWorld');scene.world.color=(.25,.25,.25)
material=bpy.data.materials.new('ShadowABClay');material.use_nodes=True
shader=material.node_tree.nodes['Principled BSDF'];shader.inputs['Base Color'].default_value=(.38,.20,.17,1);shader.inputs['Roughness'].default_value=.8
scene.view_layers[0].material_override=material
camera=bpy.data.objects.new('ShadowABCamera',bpy.data.cameras.new('ShadowABCamera'));scene.collection.objects.link(camera);scene.camera=camera
camera.data.type='ORTHO';camera.data.ortho_scale=.31;camera.data.clip_start=.001
center=Vector((0,-.185,.273));camera.location=center+Vector((-1,-.1,.1));camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
lights=[]
for i,offset in enumerate([(-.5,-.5,.6),(.5,.3,.4)]):
    light=bpy.data.objects.new(f'ShadowABLight{i}',bpy.data.lights.new(f'ShadowABLight{i}','AREA'));scene.collection.objects.link(light)
    light.location=center+Vector(offset);light.data.energy=10;light.data.size=.5
    light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler();lights.append(light)
out=ROOT/'evidence/tongue-shadow-ab';out.mkdir(parents=True,exist_ok=True)
report={'geometry_hash':before_hash,'settings':[],'object_cycles_properties':[p.identifier for p in obj.cycles.bl_rna.properties if 'terminator' in p.identifier]}
for name in ['baseline','without-shadow','terminator-offset']:
    for light in lights:light.data.use_shadow=name!='without-shadow'
    if hasattr(obj.cycles,'shadow_terminator_geometry_offset'):
        obj.cycles.shadow_terminator_geometry_offset=.2 if name=='terminator-offset' else 0
    scene.render.filepath=str(out/f'{name}.png');bpy.ops.render.render(write_still=True)
    report['settings'].append({'name':name,'shadow':name!='without-shadow','geometry_offset':getattr(obj.cycles,'shadow_terminator_geometry_offset',None)})
obj.data.vertices.foreach_get('co',data)
assert before_hash==hashlib.sha256(data.tobytes()).hexdigest()
report['geometry_unchanged']=True
(ROOT/'reports/tongue-shadow-ab.json').write_text(json.dumps(report,indent=2))
print('TONGUE_SHADOW_AB_COMPLETE',flush=True)
