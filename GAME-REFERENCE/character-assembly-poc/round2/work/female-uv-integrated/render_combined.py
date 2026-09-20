# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
"""Render exact saved eye+UV candidate without modifying or saving it."""
from __future__ import annotations
import hashlib, json
from pathlib import Path
import bpy
from mathutils import Vector

HERE=Path(__file__).resolve().parent

def sha(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def main():
    source=Path(bpy.data.filepath); before=sha(source)
    scene=bpy.context.scene
    body=bpy.data.objects['Female_SmoothDoll_Body']
    visible={body.name,'Female_Bandeau_Measured','Female_Briefs_Panel'}|{f'Female_{s}_{r}' for s in ('L','R') for r in ('Eye_Core','Eye_Cornea','IrisDisc','PupilDisc')}
    for obj in scene.objects:
        if obj.type=='MESH': obj.hide_render=obj.name not in visible
    scene.render.engine='BLENDER_EEVEE'; scene.render.resolution_x=900; scene.render.resolution_y=1100; scene.render.resolution_percentage=100
    scene.view_settings.view_transform='AgX'; scene.view_settings.look='AgX - Medium High Contrast'
    if scene.world is None: scene.world=bpy.data.worlds.new('CombinedReviewWorld')
    scene.world.use_nodes=True; scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(0.09,0.09,0.1,1); scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.5
    for obj in list(scene.objects):
        if obj.type in {'LIGHT','CAMERA'}: bpy.data.objects.remove(obj,do_unlink=True)
    for name,pos,power in [('Key',(2,-3,3),280),('Fill',(-2,-2,2),150),('Rim',(0,3,3),180)]:
        data=bpy.data.lights.new(name,'AREA');data.energy=power;data.size=2
        light=bpy.data.objects.new(name,data);scene.collection.objects.link(light);light.location=pos;light.rotation_euler=(Vector((0,0,.9))-light.location).to_track_quat('-Z','Y').to_euler()
    camera=bpy.data.objects.new('CombinedCamera',bpy.data.cameras.new('CombinedCamera'));scene.collection.objects.link(camera);scene.camera=camera;camera.data.type='ORTHO'
    out=HERE/'combined-renders';out.mkdir(exist_ok=True)
    views={'front':((0,-4,0),(0,0,.83),1.95),'back':((0,4,0),(0,0,.83),1.95),'side':((4,0,0),(0,0,.83),1.95),'quarter':((3,-4,.2),(0,0,.83),1.95),'face':((.2,-1,0),(0,-.02,1.52),.32)}
    rendered=[]
    for name,(direction,target,scale) in views.items():
        camera.location=Vector(target)+Vector(direction);camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=scale
        scene.render.filepath=str(out/f'{name}.png');bpy.ops.render.render(write_still=True);rendered.append(scene.render.filepath)
    if sha(source)!=before: raise AssertionError('candidate changed')
    (HERE/'combined-render-receipt.json').write_text(json.dumps({'candidate':str(source),'candidate_sha256':before,'views':rendered,'candidate_unchanged':True},indent=2))
    print('FEMALE_COMBINED_RENDERED',len(rendered),flush=True)

if __name__=='__main__':main()
