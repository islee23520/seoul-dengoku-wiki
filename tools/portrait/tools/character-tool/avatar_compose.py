# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run only inside Blender; worker.py has already loaded the body as request['input'].
from __future__ import annotations

import json
import math
from pathlib import Path

import bpy
from mathutils import Euler, Vector
from mathutils.kdtree import KDTree
from mathutils.bvhtree import BVHTree

from blender_common import WorkError, object_mode


def _import_part(slot: str, file: Path) -> list[str]:
    before = set(bpy.data.objects)
    suffix = file.suffix.lower()
    if suffix in {'.glb', '.gltf'}:
        bpy.ops.import_scene.gltf(filepath=str(file))
    elif suffix == '.fbx':
        bpy.ops.import_scene.fbx(filepath=str(file))
    elif suffix == '.blend':
        with bpy.data.libraries.load(str(file), link=False) as (source, target):
            target.objects = list(source.objects)
        for obj in target.objects:
            if obj is not None:
                bpy.context.scene.collection.objects.link(obj)
    else:
        raise WorkError('PART_FORMAT', f'{slot}: supported part formats are .glb, .gltf, .fbx, .blend')
    added = [obj for obj in bpy.data.objects if obj not in before]
    if not any(obj.type == 'MESH' and len(obj.data.polygons) for obj in added):
        raise WorkError('PART_EMPTY', f'{slot}: {file.name} contains no mesh')
    collection = bpy.data.collections.new(f'slot:{slot}')
    bpy.context.scene.collection.children.link(collection)
    for obj in added:
        for owner in list(obj.users_collection):
            owner.objects.unlink(obj)
        collection.objects.link(obj)
        obj['portrait_slot'] = slot
    return sorted(obj.name for obj in added)


# Tripo sleeves droop below the T-pose arms, so nearest-surface transfer would hand them torso weights.
# Past the shoulder joint a sleeve vertex takes the weights of the arm vertex at the same distance along the arm.
# Only the band from arm height down to the sleeve cuffs qualifies, so spread feet and trouser legs keep leg weights.
_SLEEVE_BAND_OF_HEIGHT = 0.12
def _sleeves_follow_arms(arm: bpy.types.Object, body: bpy.types.Object, part: bpy.types.Object) -> None:
    shoulders = [arm.matrix_world @ arm.pose.bones[name].head for name in ('c_arm_fk.l', 'c_arm_fk.r') if name in arm.pose.bones]
    if len(shoulders) != 2:
        return
    center = (shoulders[0].x + shoulders[1].x) / 2
    reach = abs(shoulders[0].x - center)
    floor = min(s.z for s in shoulders) - _SLEEVE_BAND_OF_HEIGHT * body.dimensions.z
    body_names = {g.index: g.name for g in body.vertex_groups}
    for side in (1.0, -1.0):
        arm_vertices = [v for v in body.data.vertices if side * ((body.matrix_world @ v.co).x - center) > reach
                        and (body.matrix_world @ v.co).z > floor]
        if not arm_vertices:
            continue
        tree = KDTree(len(arm_vertices))
        for index, vertex in enumerate(arm_vertices):
            tree.insert(Vector(((body.matrix_world @ vertex.co).x, 0.0, 0.0)), index)
        tree.balance()
        for vertex in part.data.vertices:
            world = part.matrix_world @ vertex.co
            world_x = world.x
            if side * (world_x - center) <= reach or world.z <= floor:
                continue
            _co, index, _distance = tree.find(Vector((world_x, 0.0, 0.0)))
            for group in list(vertex.groups):
                part.vertex_groups[group.group].remove([vertex.index])
            for group in arm_vertices[index].groups:
                part.vertex_groups[body_names[group.group]].add([vertex.index], group.weight, 'REPLACE')


def _bind_parts(arm: bpy.types.Object, body: bpy.types.Object, parts: list[bpy.types.Object]) -> int:
    """Slot meshes inherit the rigged body's weights by nearest-surface transfer in rest pose."""
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    for part in parts:
        for name in body.vertex_groups.keys():
            if name not in part.vertex_groups:
                part.vertex_groups.new(name=name)
        transfer = part.modifiers.new('portrait_weights', 'DATA_TRANSFER')
        transfer.object = body
        transfer.use_vert_data = True
        transfer.data_types_verts = {'VGROUP_WEIGHTS'}
        transfer.vert_mapping = 'POLYINTERP_NEAREST'
        transfer.layers_vgroup_select_src = 'ALL'
        transfer.layers_vgroup_select_dst = 'NAME'
        with bpy.context.temp_override(object=part, active_object=part):
            bpy.ops.object.modifier_apply(modifier=transfer.name)
        _sleeves_follow_arms(arm, body, part)
        deform = part.modifiers.new('portrait_armature', 'ARMATURE')
        deform.object = arm
    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()
    return len(parts)


def _apply_pose(path: Path, part_objects: list[bpy.types.Object]) -> dict:
    spec = json.loads(path.read_text())
    if not isinstance(spec, dict) or spec.get('deformer') != 'armature-v1':
        raise WorkError('POSE_INVALID', 'Only the armature-v1 pose is supported')
    armatures = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']
    if len(armatures) != 1:
        raise WorkError('POSE_ARMATURE', f'Pose needs exactly one rigged armature in the body scene, found {len(armatures)}')
    arm = armatures[0]
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and not o.hide_render and len(o.data.vertices)
              and o not in part_objects and o.find_armature() == arm]
    if not meshes:
        raise WorkError('POSE_ARMATURE', 'No body mesh is bound to the armature')
    body = max(meshes, key=lambda o: len(o.data.vertices))
    bound = _bind_parts(arm, body, [o for o in part_objects if o.type == 'MESH'])
    for bone_name, values in (spec.get('properties') or {}).items():
        bone = arm.pose.bones.get(bone_name)
        if bone is None:
            raise WorkError('POSE_BONE', f'Armature has no bone {bone_name}')
        for key, value in values.items():
            bone[key] = float(value)
    for bone_name, angles in spec['bones'].items():
        bone = arm.pose.bones.get(bone_name)
        if bone is None:
            raise WorkError('POSE_BONE', f'Armature has no bone {bone_name}')
        bone.rotation_mode = 'XYZ'
        bone.rotation_euler = Euler([math.radians(v) for v in angles], 'XYZ')
    arm.data.update_tag()
    bpy.context.view_layer.update()
    return {'deformer': 'armature-v1', 'armature': arm.name, 'body': body.name, 'posedBones': len(spec['bones']),
            'boundParts': bound}


def _relink_textures(directory: str | None) -> list[dict[str, str]]:
    relinked, missing = [], []
    for image in bpy.data.images:
        if image.source != 'FILE' or image.packed_file is not None or not image.filepath:
            continue
        current = Path(bpy.path.abspath(image.filepath))
        if current.is_file():
            continue
        candidate = Path(directory) / current.name if directory else None
        if candidate is not None and candidate.is_file():
            image.filepath = str(candidate)
            image.reload()
            relinked.append({'image': image.name, 'from': str(current), 'to': str(candidate)})
        else:
            missing.append(str(current))
    if missing:
        raise WorkError('TEXTURE_MISSING', 'Missing texture files (pass --textures <dir>): ' + ', '.join(sorted(missing)))
    return relinked


# Body faces hidden under a garment get portrait_hidden=1; every body material mixes to transparent by it.
# Only body faces that poke out through the garment are hidden. Faces inside the garment stay visible:
# the garment already occludes them, and through collar and cuff openings they must show skin, not the
# empty inside of the garment.
# Missing attributes read as 0 in Cycles, so meshes without the attribute stay fully visible.
_HIDDEN_ATTRIBUTE = 'portrait_hidden'
_MASK_REACH_OF_HEIGHT = 0.03    # body faces within this distance of the garment surface are covered


# After posing, body shoulders can bulge outside a garment's shoulder line where no garment surface is near.
# A bone counts as clothed when the garment carries at least this share of its body vertex share; body faces
# dominated by a clothed bone are hidden. Head, neck, hands and feet are never hidden by region.
_CLOTHED_SHARE = 0.3
_ALWAYS_VISIBLE = ('head', 'neck', 'jaw', 'eye', 'hand', 'thumb', 'index', 'middle', 'ring', 'pinky', 'foot', 'toes')


def _dominant_groups(obj: bpy.types.Object) -> list[str | None]:
    names = {g.index: g.name for g in obj.vertex_groups}
    return [names.get(max(v.groups, key=lambda g: g.weight).group) if v.groups else None for v in obj.data.vertices]


def _covered_bone_faces(body: bpy.types.Object, garments: list[bpy.types.Object]) -> list[float]:
    if not body.vertex_groups or not any(g.vertex_groups for g in garments):
        return [0.0] * len(body.data.polygons)
    body_dominant = _dominant_groups(body)
    garment_dominant = [name for g in garments for name in _dominant_groups(g)]
    share = lambda items, name: sum(1 for item in items if item == name) / max(len(items), 1)
    clothed = {name for name in {n for n in garment_dominant if n is not None}
               if not any(token in name for token in _ALWAYS_VISIBLE)
               and share(garment_dominant, name) >= _CLOTHED_SHARE * share(body_dominant, name)}
    return [1.0 if sum(body_dominant[i] in clothed for i in p.vertices) * 2 > len(p.vertices) else 0.0
            for p in body.data.polygons]


def _mask_covered_body(body: bpy.types.Object, garments: list[bpy.types.Object]) -> dict:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    vertices, polygons = [], []
    for garment in garments:
        if garment.type != 'MESH':
            continue
        offset = len(vertices)
        vertices += [garment.matrix_world @ v.co for v in garment.data.vertices]
        polygons += [[offset + i for i in p.vertices] for p in garment.data.polygons]
    if not polygons:
        return {'hiddenFaces': 0}
    tree = BVHTree.FromPolygons(vertices, polygons)
    points = [body.matrix_world @ v.co for v in body.data.vertices]
    reach = _MASK_REACH_OF_HEIGHT * (max(p.z for p in points) - min(p.z for p in points))
    normal_matrix = body.matrix_world.to_3x3().inverted().transposed()
    hidden, inside = [], []
    for polygon in body.data.polygons:
        center = body.matrix_world @ polygon.center
        outward = (normal_matrix @ polygon.normal).normalized()
        covered, *_ = tree.ray_cast(center + outward * 1e-4, outward, 2 * reach)
        location, normal, _index, _distance = tree.find_nearest(center, reach)
        behind = location is not None and (center - location).dot(normal) < 0
        inside.append(covered is not None or behind)
        hidden.append(1.0 if location is not None and not (covered is not None or behind) else 0.0)
    region = _covered_bone_faces(body, garments)
    hidden = [0.0 if within else max(h, r) for h, r, within in zip(hidden, region, inside)]
    if body.vertex_groups:
        # Proximity to a collar or cuff must not open a hole: head, neck, hand and foot skin always renders.
        dominant = _dominant_groups(body)
        exposed = [sum(1 for i in p.vertices if dominant[i] and any(t in dominant[i] for t in _ALWAYS_VISIBLE)) * 2
                   > len(p.vertices) for p in body.data.polygons]
        hidden = [0.0 if keep else h for h, keep in zip(hidden, exposed)]
    attribute = body.data.attributes.get(_HIDDEN_ATTRIBUTE) or body.data.attributes.new(_HIDDEN_ATTRIBUTE, 'FLOAT', 'FACE')
    attribute.data.foreach_set('value', hidden)
    for material in {m for m in body.data.materials if m is not None and m.use_nodes}:
        nodes, links = material.node_tree.nodes, material.node_tree.links
        output = next((n for n in nodes if n.type == 'OUTPUT_MATERIAL' and n.is_active_output), None)
        if output is None or not output.inputs['Surface'].links or nodes.get('portrait_hidden_mix'):
            continue
        shader = output.inputs['Surface'].links[0].from_socket
        mask = nodes.new('ShaderNodeAttribute')
        mask.attribute_type, mask.attribute_name = 'GEOMETRY', _HIDDEN_ATTRIBUTE
        transparent = nodes.new('ShaderNodeBsdfTransparent')
        mix = nodes.new('ShaderNodeMixShader')
        mix.name = 'portrait_hidden_mix'
        links.new(mask.outputs['Fac'], mix.inputs['Fac'])
        links.new(shader, mix.inputs[1])
        links.new(transparent.outputs['BSDF'], mix.inputs[2])
        links.new(mix.outputs['Shader'], output.inputs['Surface'])
    body.data.update()
    del depsgraph
    return {'hiddenFaces': int(sum(hidden)), 'bodyFaces': len(hidden), 'reach': reach}


def compose_avatar(request: dict) -> dict:
    object_mode()
    relinked = _relink_textures(request.get('textures'))
    parts = request.get('parts') or []
    slots = {}
    for part in parts:
        file = Path(part['file'])
        if not file.is_file():
            raise WorkError('PART_MISSING', f"{part['slot']}: {file}")
        slots[part['slot']] = _import_part(part['slot'], file)
    part_objects = [bpy.data.objects[name] for names in slots.values() for name in names]
    pose = _apply_pose(Path(request['pose']), part_objects) if request.get('pose') else None
    garments = [bpy.data.objects[name] for name in slots.get('clothes', [])]
    for name in slots.get('hair', []):
        bpy.data.objects[name].visible_shadow = False
    body_meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and not o.hide_render and len(o.data.vertices)
                   and o not in part_objects]
    mask = _mask_covered_body(max(body_meshes, key=lambda o: len(o.data.vertices)), garments) if garments else None
    relinked += _relink_textures(request.get('textures'))
    return {'slots': slots, 'pose': pose, 'bodyMask': mask, 'relinkedTextures': relinked}
