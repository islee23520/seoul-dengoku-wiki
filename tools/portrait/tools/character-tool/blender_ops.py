# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run inside Blender through character-tool; explicit inputs, new outputs only.
from __future__ import annotations

import math
import json
from pathlib import Path

import bpy
from bpy_extras.io_utils import axis_conversion
from mathutils import Matrix, Vector

from blender_common import WorkError, bounds, inspect_scene, meshes, output_path, save_blend, select


def align(request):
    path = output_path(request['output'], ('.blend',))
    objects = meshes()
    if any(o.type == 'ARMATURE' for o in bpy.context.scene.objects) or any(o.data.shape_keys for o in objects):
        raise WorkError('ALIGN_RIGGED', 'Align before rigging; armatures and shape keys require explicit authored transforms')
    up, forward = request.get('up', 'Z'), request.get('forward', '-Y')
    valid = {'X','-X','Y','-Y','Z','-Z'}
    if up not in valid or forward not in valid or up.strip('-') == forward.strip('-'):
        raise WorkError('AXES_INVALID', 'Up and forward must be distinct signed X/Y/Z axes')
    transform = axis_conversion(from_forward=forward, from_up=up, to_forward='-Y', to_up='Z').to_4x4()
    for obj in objects:
        if obj.modifiers:
            raise WorkError('ALIGN_MODIFIERS', 'Apply or remove modifiers explicitly before alignment')
    # Bake original world transforms, including parent hierarchy, into independent meshes.
    matrices = {obj.name: transform @ obj.matrix_world.copy() for obj in objects}
    for obj in objects:
        obj.data = obj.data.copy()
        obj.data.transform(matrices[obj.name])
        obj.parent = None
        obj.matrix_world = Matrix.Identity(4)
    low, high = bounds(objects)
    height = float(request.get('height', high.z-low.z))
    if not math.isfinite(height) or height <= 0 or high.z-low.z <= 1e-8:
        raise WorkError('HEIGHT_INVALID', 'Height must be finite and positive, and model must have nonzero height')
    scale = height / (high.z-low.z)
    center = Vector(((low.x+high.x)/2, (low.y+high.y)/2, low.z))
    for obj in objects:
        for vertex in obj.data.vertices:
            vertex.co = (vertex.co-center)*scale
        obj.data.update()
    bpy.context.scene.unit_settings.system = 'METRIC'
    bpy.context.scene.unit_settings.scale_length = 1
    bpy.context.view_layer.update()
    save_blend(path)
    return {'output':str(path), 'report':inspect_scene()}


def export_model(request):
    path = output_path(request['output'], ('.fbx','.glb'))
    manifest_path = path.with_suffix('.character.json')
    if manifest_path.exists():
        raise WorkError('OUTPUT_EXISTS',str(manifest_path))
    if request.get('height'):
        raise WorkError('EXPORT_HEIGHT', 'Set height with align before authoring/rigging; export preserves the authored scale')
    report = inspect_scene(request.get('require-rig',False))
    objects = meshes()
    arms = list({o.find_armature() for o in objects if o.find_armature()})
    select(objects+arms, arms[0] if arms else objects[0])
    materials = None
    if path.suffix.lower() == '.fbx':
        source = bpy.context.scene.get('character_tool_source_gltf')
        if source:
            from blender_pbr import prepare
            materials = prepare(source,path)
        bpy.ops.export_scene.fbx(filepath=str(path), use_selection=True, object_types={'MESH','ARMATURE'},
                                 add_leaf_bones=False, use_armature_deform_only=True, bake_anim=False,
                                 axis_forward='-Z', axis_up='Y', apply_unit_scale=True,
                                 apply_scale_options='FBX_SCALE_UNITS', path_mode='STRIP', embed_textures=False,
                                 use_mesh_modifiers=False)
    else:
        bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=True,
                                  export_skins=True, export_animations=False)
    manifest = {'version':1,'model':path.name,'heightMeters':report['bounds']['size'][2],
                'rigged':report['rigValid'],'pbr':materials}
    manifest_path.write_text(json.dumps(manifest,indent=2))
    return {'output':str(path), 'manifest':str(manifest_path), 'bytes':path.stat().st_size, 'report':report}


def operate(request):
    command = request['command']
    if command == 'align':
        return align(request)
    if command == 'export':
        return export_model(request)
    if command == 'render':
        from blender_render import render
        return render(request)
    from blender_rig import rig, template
    return template(request) if command == 'rig-template' else rig(request)
