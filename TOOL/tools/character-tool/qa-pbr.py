# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Called through character-tool exec; emits a GLB containing explicit packed ORM.
from __future__ import annotations

import base64
import json
import struct
import tempfile
from pathlib import Path

import bpy

from blender_common import output_path
from blender_pbr import save_pixels

request = globals()['request']
path = output_path(request['output'],('.glb',))
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj,do_unlink=True)
bpy.ops.mesh.primitive_cube_add(size=2)
obj = bpy.context.object
obj.name = 'PbrFixture'
material = bpy.data.materials.new('PackedMaterial')
material.use_nodes = True
obj.data.materials.append(material)
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB')
raw = path.read_bytes()
length = struct.unpack_from('<I',raw,12)[0]
document = json.loads(raw[20:20+length])
cursor = 20+length
binary_length = struct.unpack_from('<I',raw,cursor)[0]
binary = raw[cursor+8:cursor+8+binary_length]
with tempfile.TemporaryDirectory(prefix='pbr-fixture-') as temporary:
    image = Path(temporary)/'orm.png'
    save_pixels(image,2,2,[.2,.4,.8,1]*4)
    orm = image.read_bytes()
    color_image = Path(temporary)/'base.png'
    save_pixels(color_image,2,2,[.7,.3,.1,1]*4)
    color = color_image.read_bytes()
    normal_image = Path(temporary)/'normal.png'
    save_pixels(normal_image,2,2,[.5,.5,1,1]*4)
    normal = normal_image.read_bytes()
document['images'] = [{'uri':'data:image/png;base64,'+base64.b64encode(value).decode()} for value in [orm,color,normal]]
document['textures'] = [{'source':index} for index in range(3)]
document['materials'][0] = {'name':'PackedMaterial','pbrMetallicRoughness':{
    'baseColorTexture':{'index':1},'metallicRoughnessTexture':{'index':0},'metallicFactor':.5,'roughnessFactor':.75},
    'occlusionTexture':{'index':0,'strength':.8},'normalTexture':{'index':2},'emissiveTexture':{'index':1},'emissiveFactor':[.1,.2,.3]}
encoded = json.dumps(document,separators=(',',':')).encode()
encoded += b' '*((-len(encoded))%4)
binary += b'\x00'*((-len(binary))%4)
total = 12+8+len(encoded)+8+len(binary)
path.write_bytes(struct.pack('<4sII',b'glTF',2,total)+struct.pack('<II',len(encoded),0x4E4F534A)+encoded+
                 struct.pack('<II',len(binary),0x004E4942)+binary)
result = {'output':str(path),'orm':[.2,.4,.8],'metallicFactor':.5,'roughnessFactor':.75,
          'expectedMetallic':.4,'expectedSmoothness':.7,'expectedOcclusion':.2}
