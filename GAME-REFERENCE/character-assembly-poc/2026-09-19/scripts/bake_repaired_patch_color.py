# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Blend repaired surface colors only in marked defects and bake the corrected atlas."""
import json
from pathlib import Path
import bpy
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
obj=bpy.data.objects['Male_Base_Symmetric'];mesh=obj.data;scene=bpy.context.scene
data=np.load(ROOT/'reports/surface-patch-color-reconstruction.npz')
assert len(data['colors'])==len(mesh.loops)
repair=mesh.color_attributes.new(name='ReconstructedPatchColor',type='FLOAT_COLOR',domain='CORNER')
repair.data.foreach_set('color',data['colors'].ravel())
mask=mesh.attributes.new('PatchColorBlend',type='FLOAT',domain='CORNER')
mask.data.foreach_set('value',data['mask'])
original_slots=list(mesh.materials)
image=bpy.data.images.new('Male_Atlas_PatchCorrected',width=4096,height=4096,alpha=True)
image.colorspace_settings.name='sRGB';image.generated_color=(0,0,0,0)
for i,original in enumerate(original_slots):
    material=original.copy();material.name='PatchCorrected_'+original.name
    nodes,links=material.node_tree.nodes,material.node_tree.links
    shader=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
    color_source=shader.inputs['Base Color']
    repair_node=nodes.new('ShaderNodeVertexColor');repair_node.layer_name='ReconstructedPatchColor'
    mask_node=nodes.new('ShaderNodeAttribute');mask_node.attribute_name='PatchColorBlend'
    mix=nodes.new('ShaderNodeMixRGB');mix.blend_type='MIX'
    if color_source.is_linked:links.new(color_source.links[0].from_socket,mix.inputs[1])
    else:mix.inputs[1].default_value=color_source.default_value
    links.new(mask_node.outputs['Fac'],mix.inputs[0]);links.new(repair_node.outputs['Color'],mix.inputs[2])
    emission=nodes.new('ShaderNodeEmission');links.new(mix.outputs[0],emission.inputs['Color'])
    output=next(n for n in nodes if n.type=='OUTPUT_MATERIAL');links.new(emission.outputs[0],output.inputs['Surface'])
    target=nodes.new('ShaderNodeTexImage');target.image=image
    for n in nodes:n.select=False
    target.select=True;nodes.active=target
    mesh.materials[i]=material
mesh.uv_layers.active=mesh.uv_layers['AtlasUV'];mesh.uv_layers['AtlasUV'].active_render=True
bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
scene.render.engine='CYCLES';scene.cycles.samples=1;scene.render.bake.target='IMAGE_TEXTURES'
scene.render.bake.use_selected_to_active=False;scene.render.bake.use_clear=True;scene.render.bake.margin=4;scene.render.bake.margin_type='EXTEND'
for layer in scene.view_layers:layer.material_override=None
assert bpy.ops.object.bake(type='EMIT',uv_layer='AtlasUV')=={'FINISHED'}
folder=ROOT/'work/textures/patch-corrected';folder.mkdir(parents=True,exist_ok=True)
image.filepath_raw=str(folder/'Male_PatchCorrected_4096.png');image.file_format='PNG';image.save();image.pack()
for i,original in enumerate(original_slots):mesh.materials[i]=original
preview=bpy.data.materials.new('Male_PatchCorrected_Atlas_Review');preview.use_nodes=True
nodes,links=preview.node_tree.nodes,preview.node_tree.links
uv=nodes.new('ShaderNodeUVMap');uv.uv_map='AtlasUV'
tex=nodes.new('ShaderNodeTexImage');tex.image=image
links.new(uv.outputs['UV'],tex.inputs['Vector']);links.new(tex.outputs['Color'],nodes['Principled BSDF'].inputs['Base Color'])
nodes['Principled BSDF'].inputs['Roughness'].default_value=.78;preview.use_fake_user=True
obj['atlas_review_material']=preview.name
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work/male-base-patch-color-review.blend'))
(ROOT/'reports/patch-color-bake.json').write_text(json.dumps({'image':str(folder/'Male_PatchCorrected_4096.png'),'source_textures_preserved':True,'method':'surface Dirichlet color + defect mask, emission-only atlas bake','geometry_changed':False,'visual_verification_pending':True},indent=2))
print('PATCH_COLOR_ATLAS_BAKED',flush=True)
