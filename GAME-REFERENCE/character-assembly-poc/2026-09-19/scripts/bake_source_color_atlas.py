# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Bake original base-color bindings to the new atlas, with no lighting baked in."""
import hashlib
import json
from pathlib import Path

import bpy
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
obj=bpy.data.objects['Male_Base_Symmetric']
scene=bpy.context.scene
assert bpy.app.background
mesh=obj.data
coords=np.empty(len(mesh.vertices)*3,np.float32)
mesh.vertices.foreach_get('co',coords)
coord_hash=hashlib.sha256(coords.tobytes()).hexdigest()
mesh.uv_layers.active=mesh.uv_layers['AtlasUV']
mesh.uv_layers['AtlasUV'].active_render=True
for layer in scene.view_layers:layer.material_override=None
resolution=4096
image=bpy.data.images.new('Male_Atlas_SourceColor',width=resolution,height=resolution,alpha=True,float_buffer=False)
image.colorspace_settings.name='sRGB'
image.generated_color=(0,0,0,0)
original_slots=list(mesh.materials)
records=[]
for index,original in enumerate(original_slots):
    mat=original.copy()
    mat.name='BakeSource_'+original.name
    nodes,links=mat.node_tree.nodes,mat.node_tree.links
    principled=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
    color_input=principled.inputs['Base Color']
    emission=nodes.new('ShaderNodeEmission')
    if color_input.is_linked:
        links.new(color_input.links[0].from_socket,emission.inputs['Color'])
    else:
        emission.inputs['Color'].default_value=color_input.default_value
    output=next(n for n in nodes if n.type=='OUTPUT_MATERIAL')
    links.new(emission.outputs[0],output.inputs['Surface'])
    texture=nodes.new('ShaderNodeTexImage')
    texture.image=image
    for n in nodes:n.select=False
    texture.select=True
    nodes.active=texture
    mesh.materials[index]=mat
    records.append({'slot':index,'source_material':original.name,'source_images':[n.image.name for n in original.node_tree.nodes if n.type=='TEX_IMAGE' and n.image]})
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active=obj
scene.render.engine='CYCLES'
scene.cycles.samples=1
scene.render.bake.use_selected_to_active=False
scene.render.bake.use_clear=True
scene.render.bake.margin=4
scene.render.bake.margin_type='EXTEND'
status=bpy.ops.object.bake(type='EMIT',uv_layer='AtlasUV')
assert status=={'FINISHED'}
outdir=ROOT/'work/textures/source-atlas'
outdir.mkdir(parents=True,exist_ok=True)
image.filepath_raw=str(outdir/'Male_SourceColor_4096.png')
image.file_format='PNG'
image.save()
image.pack()
for index,mat in enumerate(original_slots):mesh.materials[index]=mat
preview=bpy.data.materials.new('Male_Atlas_SourceColor_Review')
preview.use_nodes=True
nodes,links=preview.node_tree.nodes,preview.node_tree.links
coordinate=nodes.new('ShaderNodeUVMap');coordinate.uv_map='AtlasUV'
texture=nodes.new('ShaderNodeTexImage');texture.image=image
links.new(coordinate.outputs['UV'],texture.inputs['Vector'])
links.new(texture.outputs['Color'],nodes['Principled BSDF'].inputs['Base Color'])
nodes['Principled BSDF'].inputs['Roughness'].default_value=.78
preview.use_fake_user=True
obj['atlas_review_material']=preview.name
mesh.vertices.foreach_get('co',coords)
assert hashlib.sha256(coords.tobytes()).hexdigest()==coord_hash
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work/male-base-source-color-atlas-review.blend'))
report={'resolution':resolution,'image':str(outdir/'Male_SourceColor_4096.png'),'bake_type':'EMIT','new_lighting_baked':False,'source_lighting_already_present_not_removed':True,'source_bindings':records,'geometry_preserved':True,'margin_pixels':4,'status':'COLOR_TRANSFER_ONLY_PATCH_CORRECTION_PENDING'}
(ROOT/'reports/source-color-atlas-bake.json').write_text(json.dumps(report,indent=2))
print('SOURCE_COLOR_ATLAS_BAKED',flush=True)
