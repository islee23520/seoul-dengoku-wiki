"""Render one toon variant under four light directions and two camera angles."""
import json
import math
import os
from pathlib import Path
import bpy
from mathutils import Vector

ROLE=os.environ['RENDER_ROLE'];OUT=Path(os.environ['RENDER_OUT']);OUT.mkdir(parents=True,exist_ok=True)
scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=640;scene.render.resolution_y=800;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.view_settings.look='AgX - Medium High Contrast'
meshes=[obj for obj in scene.objects if obj.type=='MESH' and not obj.hide_render];points=[obj.matrix_world@Vector(corner) for obj in meshes for corner in obj.bound_box];low=Vector(tuple(min(point[axis] for point in points) for axis in range(3)));high=Vector(tuple(max(point[axis] for point in points) for axis in range(3)));center=(low+high)*.5;extent=max(high-low)
camera=bpy.data.objects.get('SixModelCamera') or bpy.data.objects.new('SixModelCamera',bpy.data.cameras.new('SixModelCamera'));scene.collection.objects.link(camera) if not camera.users_collection else None;scene.camera=camera;camera.data.lens=58
sun=bpy.data.objects.get('Toon_MainSun')
if sun is None:
    data=bpy.data.lights.new('Toon_MainSun_Data','SUN');data.energy=3;sun=bpy.data.objects.new('Toon_MainSun',data);scene.collection.objects.link(sun)
sun.data.energy=3.0
world=scene.world or bpy.data.worlds.new('SixModelWorld');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(0.025,0.03,0.045,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35
LIGHTS={'front':(math.radians(25),0,0),'left':(math.radians(35),0,math.radians(-65)),'right':(math.radians(35),0,math.radians(65)),'back':(math.radians(150),0,0)}
def point_camera(location,target):camera.location=location;camera.rotation_euler=(target-location).to_track_quat('-Z','Y').to_euler()
receipts=[]
for light,rotation in LIGHTS.items():
    sun.rotation_euler=rotation;point_camera(center+Vector((0,-extent*1.45,extent*.04)),center);scene.render.filepath=str(OUT/f'{ROLE}-front-{light}.png');bpy.ops.render.render(write_still=True);receipts.append(scene.render.filepath)
sun.rotation_euler=LIGHTS['front'];point_camera(center+Vector((extent*.9,-extent*1.2,extent*.08)),center);scene.render.filepath=str(OUT/f'{ROLE}-quarter-front.png');bpy.ops.render.render(write_still=True);receipts.append(scene.render.filepath)
report={'role':ROLE,'file':bpy.data.filepath,'bounds':{'min':list(low),'max':list(high)},'renders':receipts,'engine':scene.render.engine,'sun':sun.name};(OUT/f'{ROLE}-receipt.json').write_text(json.dumps(report,indent=2));print('VARIANT_RENDERED',json.dumps(report),flush=True)
