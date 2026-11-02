# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run with character-tool weld/shape-key/rig-edit/skin-edit; see README for JSON specs.
from __future__ import annotations

import json
import math
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

from blender_common import WorkError, inspect_scene, meshes, output_path, save_blend, select


def finite_vector(value):
    if not isinstance(value,list) or len(value) != 3 or not all(isinstance(v,(int,float)) and math.isfinite(v) for v in value):
        raise WorkError('EDIT_SPEC', 'Expected a finite XYZ vector')
    return Vector(value)


def target(name, kind):
    obj = bpy.data.objects.get(name)
    if obj is None or obj.type != kind:
        raise WorkError('EDIT_TARGET', f'Expected {kind} object: {name}')
    return obj


def weld(request):
    distance = float(request.get('distance','0.0001'))
    if not math.isfinite(distance) or distance <= 0:
        raise WorkError('WELD_DISTANCE', 'Weld distance must be finite and positive')
    objects = [target(request['mesh'],'MESH')] if request.get('mesh') else meshes()
    if any(o.data.shape_keys or o.find_armature() for o in objects):
        raise WorkError('WELD_ORDER', 'Weld before shape keys and skin binding to preserve vertex correspondence')
    counts = []
    for obj in objects:
        if any(abs(s-1)>1e-6 for s in obj.scale):
            raise WorkError('WELD_SCALE', 'Align/apply scale before using a meter-valued weld threshold')
        obj.data = obj.data.copy()
        before = len(obj.data.vertices)
        mesh = bmesh.new()
        try:
            mesh.from_mesh(obj.data)
            bmesh.ops.remove_doubles(mesh, verts=list(mesh.verts), dist=distance)
            mesh.to_mesh(obj.data)
        finally:
            mesh.free()
        counts.append({'mesh':obj.name,'before':before,'after':len(obj.data.vertices)})
    return {'vertices':counts,'distance':distance}


def shape_key(request, spec):
    obj = target(request['mesh'],'MESH')
    name = spec.get('name')
    if not isinstance(name,str) or not name or name == 'Basis':
        raise WorkError('SHAPE_KEY_NAME', 'Provide a nonempty shape key name other than Basis')
    if obj.data.shape_keys and name in obj.data.shape_keys.key_blocks:
        raise WorkError('SHAPE_KEY_EXISTS', name)
    deltas = spec.get('deltas')
    if not isinstance(deltas,list) or not deltas:
        raise WorkError('EDIT_SPEC', 'Provide nonempty deltas [{vertex, offset:[x,y,z]}]')
    parsed = []
    for item in deltas:
        vertex = item.get('vertex')
        if not isinstance(vertex,int) or vertex < 0 or vertex >= len(obj.data.vertices):
            raise WorkError('VERTEX_INDEX', str(vertex))
        parsed.append((vertex,finite_vector(item.get('offset'))))
    obj.data = obj.data.copy()
    if not obj.data.shape_keys:
        obj.shape_key_add(name='Basis')
    key = obj.shape_key_add(name=name,from_mix=False)
    for vertex, delta in parsed:
        key.data[vertex].co += delta
    key.value = 0
    return {'mesh':obj.name,'shapeKey':key.name,'changedVertices':len(parsed),
            'maxDelta':max(delta.length for _,delta in parsed)}


def rig_edit(request, spec):
    arm = target(request['armature'],'ARMATURE')
    edits = spec.get('bones')
    if not isinstance(edits,list) or not edits:
        raise WorkError('EDIT_SPEC', 'Provide bones [{name,head,tail}] in armature-local coordinates')
    parsed = []
    for item in edits:
        if item.get('name') not in arm.data.bones:
            raise WorkError('BONE_MISSING', str(item.get('name')))
        head, tail = finite_vector(item.get('head')), finite_vector(item.get('tail'))
        if (tail-head).length < 1e-6:
            raise WorkError('BONE_LENGTH', 'Bone cannot have zero length')
        parsed.append((item['name'],head,tail))
    arm.data = arm.data.copy()
    select([arm],arm)
    bpy.ops.object.mode_set(mode='EDIT')
    for name,head,tail in parsed:
        bone = arm.data.edit_bones[name]
        bone.head, bone.tail = head, tail
    bpy.ops.object.mode_set(mode='OBJECT')
    return {'armature':arm.name,'editedBones':[name for name,_,_ in parsed],
            'note':'Rest positions changed; existing weights preserved. Review deformation before export.'}


def skin_edit(request, spec):
    obj = target(request['mesh'],'MESH')
    arm = obj.find_armature()
    if arm is None:
        raise WorkError('ARMATURE_MISSING', 'Bind the mesh before editing weights')
    edits = spec.get('vertices')
    if not isinstance(edits,list) or not edits:
        raise WorkError('EDIT_SPEC', 'Provide vertices [{index,weights:{bone:weight}}]')
    deform = {b.name for b in arm.data.bones if b.use_deform}
    parsed = []
    for item in edits:
        index, weights = item.get('index'), item.get('weights')
        if not isinstance(index,int) or not 0 <= index < len(obj.data.vertices):
            raise WorkError('VERTEX_INDEX', str(index))
        if not isinstance(weights,dict) or not weights or any(name not in deform for name in weights):
            raise WorkError('WEIGHT_BONES', 'Weight keys must name deform bones')
        if any(not isinstance(w,(int,float)) or not math.isfinite(w) or w < 0 for w in weights.values()) or sum(weights.values()) <= 0:
            raise WorkError('WEIGHT_VALUE', 'Weights must be finite, nonnegative, and have a positive sum')
        total = sum(weights.values())
        parsed.append((index,{name:w/total for name,w in weights.items()}))
    for index,weights in parsed:
        for group in obj.vertex_groups:
            if group.name in deform:
                group.remove([index])
        for name,weight in weights.items():
            group = obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
            group.add([index],weight,'REPLACE')
    return {'mesh':obj.name,'editedVertices':len(parsed),'normalized':True}


def edit(request):
    path = output_path(request['output'],('.blend',))
    command = request['command']
    if command == 'weld':
        data = weld(request)
    else:
        spec = json.loads(Path(request['spec']).read_text())
        if not isinstance(spec,dict):
            raise WorkError('EDIT_SPEC', 'Edit spec must be a JSON object')
        operations = {'shape-key':shape_key,'rig-edit':rig_edit,'skin-edit':skin_edit}
        data = operations[command](request,spec)
    bpy.context.view_layer.update()
    save_blend(path)
    return {'output':str(path), **data, 'report':inspect_scene()}
