# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run inside Blender through character-tool rig / rig-template.
from __future__ import annotations

import json
import math
from pathlib import Path

import addon_utils
import bpy

from blender_common import WorkError, inspect_scene, meshes, object_mode, output_path, save_blend, select


def enable_arp() -> None:
    errors = []
    addon_utils.enable('auto_rig_pro', default_set=True, handle_error=lambda error: errors.append(str(error)))
    if errors or not addon_utils.check('auto_rig_pro')[1]:
        raise WorkError('ARP_UNAVAILABLE', 'Run character-tool setup with the supplied Auto-Rig Pro archive first')


def template(request):
    path = output_path(request['output'], ('.blend',))
    preset = request['preset']
    if preset not in {'human','dog','horse','horse_ik_spine','bird','free'}:
        raise WorkError('PRESET_UNKNOWN', 'Choose human, dog, horse, horse_ik_spine, bird or free')
    enable_arp()
    # ARP append operator requires a VIEW_3D overlay, even in background mode.
    area = next((a for a in bpy.context.screen.areas if a.type == 'VIEW_3D'), None)
    if area is None:
        raise WorkError('ARP_CONTEXT', 'No VIEW_3D context available for the installed ARP append operator')
    if not request.get('input'):
        for obj in list(bpy.data.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
    with bpy.context.temp_override(area=area):
        bpy.ops.arp.append_arp(rig_preset=preset)
    object_mode()
    arms = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']
    if not arms:
        raise WorkError('ARP_TEMPLATE', 'ARP did not create an armature')
    save_blend(path)
    return {'output':str(path), 'preset':preset, 'fitted':False,
            'armatures':[{'name':o.name, 'bones':[b.name for b in o.data.bones]} for o in arms]}


def create_skeleton(value: str):
    spec = json.loads(Path(value).read_text())
    if not isinstance(spec, dict) or not isinstance(spec.get('bones'), list) or not spec['bones']:
        raise WorkError('SKELETON_INVALID', 'Skeleton requires a nonempty bones array')
    names = set()
    for bone in spec['bones']:
        if not isinstance(bone, dict) or not isinstance(bone.get('name'), str) or not bone['name'] or bone['name'] in names:
            raise WorkError('SKELETON_INVALID', 'Bone names must be nonempty and unique')
        for field in ['head','tail']:
            point = bone.get(field)
            if not isinstance(point, list) or len(point) != 3 or not all(isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(v) for v in point):
                raise WorkError('SKELETON_INVALID', f'{bone["name"]}: {field} must be three finite numbers')
        if sum((a-b)**2 for a,b in zip(bone['head'],bone['tail'])) < 1e-12:
            raise WorkError('SKELETON_INVALID', 'Zero-length bone')
        if bone.get('parent') and bone['parent'] not in names:
            raise WorkError('SKELETON_INVALID', 'Parents must precede children; cycles and missing parents are invalid')
        names.add(bone['name'])
    data = bpy.data.armatures.new(spec.get('name','CharacterRig'))
    arm = bpy.data.objects.new(spec.get('name','CharacterRig'), data)
    bpy.context.collection.objects.link(arm)
    select([arm],arm)
    bpy.ops.object.mode_set(mode='EDIT')
    for item in spec['bones']:
        bone = data.edit_bones.new(item['name'])
        bone.head, bone.tail = item['head'], item['tail']
        if item.get('parent'):
            bone.parent = data.edit_bones[item['parent']]
    bpy.ops.object.mode_set(mode='OBJECT')
    arm.show_in_front = True
    return arm


def rig(request):
    path = output_path(request['output'], ('.blend',))
    objects = meshes()
    if bool(request.get('skeleton')) == bool(request.get('armature')):
        raise WorkError('RIG_INPUT', 'Choose exactly one --skeleton JSON or --armature name')
    if any(o.find_armature() for o in objects):
        raise WorkError('ALREADY_RIGGED', 'Meshes already have an armature; edit existing weights explicitly with exec')
    arm = create_skeleton(request['skeleton']) if request.get('skeleton') else bpy.data.objects.get(request['armature'])
    if arm is None or arm.type != 'ARMATURE':
        raise WorkError('ARMATURE_MISSING', 'Named object is not an armature')
    engine = request.get('engine','automatic')
    if engine not in {'automatic','arp','voxel','surface'}:
        raise WorkError('RIG_ENGINE', 'Supported engines: automatic, arp, voxel, surface')
    solver = None
    if engine == 'arp':
        enable_arp()
        select([arm],arm)
        bpy.ops.arp.match_to_rig()
        select(objects+[arm],arm)
        bpy.ops.arp.bind_to_rig()
    elif engine in {'voxel','surface'}:
        from blender_heat import bind_heat
        solver = bind_heat(objects,arm,request)
    else:
        select(objects+[arm],arm)
        bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    bpy.context.view_layer.update()
    report = inspect_scene(True)
    save_blend(path)
    return {'output':str(path), 'engine':engine, 'solver':solver, 'report':report}
