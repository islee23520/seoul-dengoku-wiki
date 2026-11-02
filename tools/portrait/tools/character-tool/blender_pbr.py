# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# GLB/glTF -> external PNG maps + Unity URP material manifest, called by export.
from __future__ import annotations

import base64
import json
import re
import struct
from pathlib import Path

import bpy

from blender_common import WorkError


def load_gltf(path: Path):
    raw = path.read_bytes()
    binary = b''
    if path.suffix.lower() == '.glb':
        if len(raw) < 20 or raw[:4] != b'glTF' or struct.unpack_from('<I',raw,4)[0] != 2:
            raise WorkError('GLTF_FORMAT', 'Expected GLB version 2')
        if struct.unpack_from('<I',raw,8)[0] != len(raw):
            raise WorkError('GLTF_FORMAT', 'GLB byte length mismatch')
        cursor, document = 12, None
        while cursor < len(raw):
            length, kind = struct.unpack_from('<II',raw,cursor)
            chunk = raw[cursor+8:cursor+8+length]
            if len(chunk) != length:
                raise WorkError('GLTF_FORMAT','Truncated GLB chunk')
            if kind == 0x4E4F534A:
                document = json.loads(chunk)
            if kind == 0x004E4942:
                binary = chunk
            cursor += 8+length
        if document is None:
            raise WorkError('GLTF_FORMAT','GLB JSON chunk missing')
    else:
        document = json.loads(raw)
    return document, binary


def uri_bytes(uri: str, parent: Path) -> bytes:
    if uri.startswith('data:'):
        header, content = uri.split(',',1)
        if ';base64' not in header:
            raise WorkError('GLTF_URI','Only base64 data URIs are supported')
        return base64.b64decode(content,validate=True)
    path = (parent / uri).resolve()
    if '://' in uri or not path.is_relative_to(parent.resolve()):
        raise WorkError('GLTF_URI','External images/buffers must be local descendants of the source directory')
    return path.read_bytes()


def image_bytes(document, binary, index, parent):
    image = document['images'][index]
    if 'uri' in image:
        return uri_bytes(image['uri'],parent)
    view = document['bufferViews'][image['bufferView']]
    buffer = document['buffers'][view.get('buffer',0)]
    raw = uri_bytes(buffer['uri'],parent) if 'uri' in buffer else binary
    start, length = view.get('byteOffset',0), view['byteLength']
    payload = raw[start:start+length]
    if len(payload) != length:
        raise WorkError('GLTF_IMAGE','Image bufferView outside buffer')
    return payload


def save_pixels(path, width, height, pixels, non_color=True):
    image = bpy.data.images.new(path.stem,width=width,height=height,alpha=True)
    image.colorspace_settings.name = 'Non-Color' if non_color else 'sRGB'
    image.pixels.foreach_set(pixels)
    image.filepath_raw = str(path)
    image.file_format = 'PNG'
    image.save()
    bpy.data.images.remove(image)


def prepare(source: str, fbx_path: Path):
    directory = fbx_path.parent / (fbx_path.stem+'.textures')
    if directory.exists():
        raise WorkError('OUTPUT_EXISTS', str(directory))
    path = Path(source)
    document, binary = load_gltf(path)
    unsupported = set(document.get('extensionsRequired',[]))-{'KHR_mesh_quantization'}
    if unsupported:
        raise WorkError('GLTF_EXTENSION', f'Unsupported required extensions: {sorted(unsupported)}')
    # Fail explicitly for shading models/UV transforms that this URP conversion cannot reproduce.
    for material in document.get('materials',[]):
        if material.get('extensions'):
            raise WorkError('MATERIAL_EXTENSION', f'Unsupported material extensions on {material.get("name", "unnamed")}')
    directory.mkdir()
    images = []
    for index, image in enumerate(document.get('images',[])):
        payload = image_bytes(document,binary,index,path.parent)
        suffix = '.png' if payload.startswith(b'\x89PNG') else '.jpg' if payload.startswith(b'\xff\xd8') else None
        if suffix is None:
            raise WorkError('IMAGE_FORMAT','Only PNG/JPEG glTF textures are supported; transcode other formats explicitly')
        original = directory/f'image-{index}{suffix}'
        original.write_bytes(payload)
        loaded = bpy.data.images.load(str(original),check_existing=False)
        loaded.colorspace_settings.name = 'Non-Color'
        pixels = list(loaded.pixels)
        images.append((original,int(loaded.size[0]),int(loaded.size[1]),pixels))
        bpy.data.images.remove(loaded)

    def texture(info):
        if info is None:
            return None
        if info.get('texCoord',0) != 0 or info.get('extensions'):
            raise WorkError('TEXTURE_UV','Only UV0 without texture transform is supported; bake alternate UVs first')
        item = document['textures'][info['index']]
        sampler = document.get('samplers',[])[item['sampler']] if 'sampler' in item else {}
        return images[item['source']], sampler

    materials = []
    for index, material in enumerate(document.get('materials',[])):
        name = material.get('name',f'Material_{index}')
        slug = f'{index}-'+re.sub(r'[^A-Za-z0-9_-]','_',name)
        pbr = material.get('pbrMetallicRoughness',{})
        maps = {}
        samplers = {}
        for key, info in [('baseColor',pbr.get('baseColorTexture')),('normal',material.get('normalTexture')),
                          ('emission',material.get('emissiveTexture'))]:
            found = texture(info)
            if found:
                (original,width,height,pixels), sampler = found
                destination = directory/f'{slug}-{key}.png'
                # Keep raw channels; Unity's texture importer handles sRGB vs data semantics.
                save_pixels(destination,width,height,pixels)
                maps[key] = destination.name
                samplers[key] = sampler
        metallic, roughness = pbr.get('metallicFactor',1), pbr.get('roughnessFactor',1)
        found = texture(pbr.get('metallicRoughnessTexture'))
        if found:
            (_,width,height,pixels), sampler = found
            packed = []
            for offset in range(0,len(pixels),4):
                packed.extend([pixels[offset+2]*metallic,0,0,1-pixels[offset+1]*roughness])
            destination = directory/f'{slug}-metallic-smoothness.png'
            save_pixels(destination,width,height,packed)
            maps['metallicSmoothness'] = destination.name
            samplers['metallicSmoothness'] = sampler
        found = texture(material.get('occlusionTexture'))
        if found:
            (_,width,height,pixels), sampler = found
            ao = []
            for offset in range(0,len(pixels),4):
                ao.extend([1,pixels[offset],1,1])
            destination = directory/f'{slug}-occlusion.png'
            save_pixels(destination,width,height,ao)
            maps['occlusion'] = destination.name
            samplers['occlusion'] = sampler
        materials.append({'name':name,'maps':maps,'samplers':samplers,
            'baseColor':pbr.get('baseColorFactor',[1,1,1,1]),'metallic':metallic,'smoothness':1-roughness,
            'normalScale':material.get('normalTexture',{}).get('scale',1),
            'occlusionStrength':material.get('occlusionTexture',{}).get('strength',1),
            'emission':material.get('emissiveFactor',[0,0,0]),'alphaMode':material.get('alphaMode','OPAQUE'),
            'alphaCutoff':material.get('alphaCutoff',.5),'doubleSided':material.get('doubleSided',False)})
    return {'source':str(path),'textureDirectory':directory.name,'materials':materials,
            'sourceImages':[item[0].name for item in images], 'shader':'Universal Render Pipeline/Lit'}
