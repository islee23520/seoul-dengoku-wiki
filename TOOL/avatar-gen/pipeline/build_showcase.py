"""Build a six-model side-by-side showcase from verified deliverables."""
from __future__ import annotations
import hashlib,json
from pathlib import Path
import bpy
from mathutils import Vector

HERE=Path(__file__).resolve().parent
ROUND2=HERE.parents[1]
DELIVERY=ROUND2/'deliverables'
ROLES=['male-underwear','male-smooth','male-anatomical','female-underwear','female-smooth','female-anatomical']
def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def append_all(path):
    with bpy.data.libraries.load(str(path),link=False) as (available,loaded):loaded.objects=list(available.objects)
    result=[]
    for obj in loaded.objects:
        if obj is not None:bpy.context.scene.collection.objects.link(obj);result.append(obj)
    return result
def main():
    bpy.ops.wm.read_factory_settings(use_empty=True);records=[]
    for index,role in enumerate(ROLES):
        path=DELIVERY/f'{role}.blend';objects=append_all(path)
        for obj in list(objects):
            is_cube=obj.type=='MESH' and len(obj.data.vertices)==8 and len(obj.data.polygons)==6 and max(obj.dimensions)>=1.9
            if obj.type in {'CAMERA','LIGHT'} or is_cube:
                bpy.data.objects.remove(obj,do_unlink=True);objects.remove(obj)
        bpy.context.view_layer.update()
        meshes=[obj for obj in objects if obj.type=='MESH']
        source_origin=Vector((-1.05,0,0)) if role.startswith('male-') else Vector((0,0,0))
        target=Vector(((index-2.5)*2.5,0,0));shift=target-source_origin
        for obj in meshes:
            world=obj.matrix_world.copy();obj.data=obj.data.copy()
            for vertex in obj.data.vertices:
                vertex.co=world@vertex.co+shift
            obj.data.update();obj.parent=None;obj.matrix_world.identity()
        for obj in list(objects):
            if obj.type!='MESH':bpy.data.objects.remove(obj,do_unlink=True)
        marker=bpy.data.objects.new(f'Showcase_{role}',None);bpy.context.scene.collection.objects.link(marker);marker.location=target;marker['role']=role;marker['source_sha256']=sha(path);records.append({'role':role,'source':str(path),'source_sha256':sha(path),'objects':len(meshes),'meshes':len(meshes),'source_origin':list(source_origin),'target':list(target),'shift':list(shift),'flattened_mesh_transforms':True})
    scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE';world=bpy.data.worlds.new('ShowcaseWorld');world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(0.018,0.022,0.035,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.3;scene.world=world
    sun_data=bpy.data.lights.new('ShowcaseSunData','SUN');sun_data.energy=3;sun=bpy.data.objects.new('ShowcaseSun',sun_data);scene.collection.objects.link(sun);sun.rotation_euler=(.45,-.2,.35)
    camera=bpy.data.objects.new('ShowcaseCamera',bpy.data.cameras.new('ShowcaseCamera'));scene.collection.objects.link(camera);camera.location=(0,-23,4.2);camera.rotation_euler=(Vector((0,0,1))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=52;scene.camera=camera;scene.render.resolution_x=1800;scene.render.resolution_y=800;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(HERE/'showcase-front.png');bpy.ops.render.render(write_still=True)
    camera.location=(5,-22,4.5);camera.rotation_euler=(Vector((0,0,1))-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(HERE/'showcase-quarter.png');bpy.ops.render.render(write_still=True)
    output=HERE/'six-model-showcase.blend';bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(output));receipt={'candidate':str(output),'candidate_sha256':sha(output),'models':records,'renders':[str(HERE/'showcase-front.png'),str(HERE/'showcase-quarter.png')],'status':'FRESH_REOPEN_REQUIRED'};(HERE/'showcase-receipt.json').write_text(json.dumps(receipt,indent=2));print('SHOWCASE_BUILT',json.dumps(receipt),flush=True)
if __name__=='__main__':main()
