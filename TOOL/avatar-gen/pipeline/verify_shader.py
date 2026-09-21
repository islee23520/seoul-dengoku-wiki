"""Verify toon material contract in the current Blender file."""
import json
import bpy

materials=[]
for obj in bpy.context.scene.objects:
    if obj.type!='MESH' or '_Eye_' in obj.name:
        continue
    for material in obj.data.materials:
        if material is not None:
            materials.append(material)
bad=[];bindings=[]
required={'ShaderNodeShaderToRGB','ShaderNodeValToRGB','ShaderNodeEmission'}
for material in materials:
    types={node.bl_idname for node in material.node_tree.nodes} if material.use_nodes else set()
    if not required.issubset(types):bad.append(material.name)
    bindings.append(material.get('source_color_binding'))
result={'file':bpy.data.filepath,'materials':len(materials),'bad':bad,'bindings':bindings,'contract':bpy.context.scene.get('toon_shader_contract'),'engine':bpy.context.scene.render.engine}
print('SHADER_REOPEN',json.dumps(result),flush=True)
if bad or not result['contract'] or result['engine']!='BLENDER_EEVEE':raise AssertionError(result)
