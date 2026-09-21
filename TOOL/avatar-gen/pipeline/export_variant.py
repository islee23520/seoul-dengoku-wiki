"""Package one final variant as .blend and FBX, then fresh-reimport the FBX."""
from __future__ import annotations
import hashlib,json,os
from pathlib import Path
import bpy
from mathutils import Vector

ROLE=os.environ['DELIVERY_ROLE'];SOURCE=Path(os.environ['DELIVERY_SOURCE']);OUT=Path(os.environ['DELIVERY_OUT']);OUT.mkdir(parents=True,exist_ok=True)
def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def mesh_summary():
    meshes=[obj for obj in bpy.context.scene.objects if obj.type=='MESH'];points=[obj.matrix_world@Vector(corner) for obj in meshes for corner in obj.bound_box]
    return {'meshes':len(meshes),'vertices':sum(len(obj.data.vertices) for obj in meshes),'faces':sum(len(obj.data.polygons) for obj in meshes),'bounds':{'min':[min(point[a] for point in points) for a in range(3)],'max':[max(point[a] for point in points) for a in range(3)]}}
def make_fbx_compatible_materials():
    records=[]
    for obj in bpy.context.scene.objects:
        if obj.type!='MESH':continue
        for index,material in enumerate(list(obj.data.materials)):
            if material is None or not material.use_nodes:continue
            image_node=next((node for node in material.node_tree.nodes if node.bl_idname=='ShaderNodeTexImage' and node.image is not None),None)
            if image_node is None:continue
            uv_name='FreeBoundaryUV' if obj.data.uv_layers.get('FreeBoundaryUV') else ('AtlasUV' if obj.data.uv_layers.get('AtlasUV') else None)
            export_material=bpy.data.materials.new(f'FBX_{obj.name}_{index}');export_material.use_nodes=True;nodes=export_material.node_tree.nodes;links=export_material.node_tree.links;nodes.clear();uv=nodes.new('ShaderNodeUVMap');uv.uv_map=uv_name or '';texture=nodes.new('ShaderNodeTexImage');texture.image=image_node.image;bsdf=nodes.new('ShaderNodeBsdfPrincipled');bsdf.inputs['Roughness'].default_value=.72;output=nodes.new('ShaderNodeOutputMaterial');links.new(uv.outputs['UV'],texture.inputs['Vector']);links.new(texture.outputs['Color'],bsdf.inputs['Base Color']);links.new(bsdf.outputs['BSDF'],output.inputs['Surface']);obj.data.materials[index]=export_material;records.append({'object':obj.name,'slot':index,'image':image_node.image.filepath,'uv':uv_name})
    return records
def main():
    source_hash=sha(SOURCE);bpy.ops.wm.open_mainfile(filepath=str(SOURCE));before=mesh_summary()
    for obj in bpy.context.scene.objects:
        if obj.type=='MESH' and '_Eye_' in obj.name and obj.data.users>1:obj.data=obj.data.copy()
    blend=OUT/f'{ROLE}.blend';bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(blend));fbx_materials=make_fbx_compatible_materials();fbx=OUT/f'{ROLE}.fbx';bpy.ops.export_scene.fbx(filepath=str(fbx),use_selection=False,object_types={'MESH','EMPTY'},apply_unit_scale=True,bake_space_transform=False,path_mode='COPY',embed_textures=False,add_leaf_bones=False)
    if sha(SOURCE)!=source_hash:raise AssertionError('source changed')
    bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.fbx(filepath=str(fbx));after=mesh_summary();images=[]
    for image in bpy.data.images:
        if image.source!='FILE':continue
        absolute=bpy.path.abspath(image.filepath);images.append({'name':image.name,'filepath':image.filepath,'absolute':absolute,'exists':Path(absolute).exists()})
    bound_error=max(abs(after['bounds'][side][axis]-before['bounds'][side][axis]) for side in ('min','max') for axis in range(3));receipt={'role':ROLE,'source':str(SOURCE),'source_sha256':source_hash,'blend':str(blend),'blend_sha256':sha(blend),'fbx':str(fbx),'fbx_sha256':sha(fbx),'fbx_material_adapters':fbx_materials,'before':before,'reimport':after,'bounds_max_error_m':bound_error,'reimport_images':images,'cwd_independent':str(Path.cwd())!='' ,'status':'PASS_EXPORT_REIMPORT' if after['meshes']>0 and bound_error<1e-4 and all(item['exists'] for item in images) else 'FAIL_EXPORT_REIMPORT'};(OUT/f'{ROLE}-export-receipt.json').write_text(json.dumps(receipt,indent=2));print('VARIANT_EXPORTED',json.dumps(receipt),flush=True)
    if receipt['status']!='PASS_EXPORT_REIMPORT':raise AssertionError(receipt)
if __name__=='__main__':main()
