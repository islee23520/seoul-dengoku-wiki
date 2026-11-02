# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run only inside Blender; worker.py has already loaded the body as request['input'].
from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

from blender_common import WorkError, object_mode, select

# Fractions of standing height measured on the approved T-pose bases (ankle, neck base, head band).
_ANKLE, _NECK, _HEAD_LOW, _HEAD_HIGH = 0.035, 0.835, 0.90, 0.97
# Garment sleeves end at the wrists, not the fingertips.
_WRIST_SPAN = 0.88


def _body_landmarks() -> dict[str, float]:
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and not o.hide_render and len(o.data.vertices)]
    if not meshes:
        raise WorkError('BODY_EMPTY', 'Body scene has no visible mesh')
    body = max(meshes, key=lambda o: len(o.data.vertices))
    points = [body.matrix_world @ v.co for v in body.data.vertices]
    low = Vector(tuple(min(p[i] for p in points) for i in range(3)))
    high = Vector(tuple(max(p[i] for p in points) for i in range(3)))
    height = high.z - low.z
    head = [p for p in points if low.z + _HEAD_LOW * height <= p.z <= low.z + _HEAD_HIGH * height]
    head_width = (max(p.x for p in head) - min(p.x for p in head)) if head else 0.1 * height
    center_x = (low.x + high.x) / 2
    arm_z = max(points, key=lambda p: abs(p.x - center_x)).z
    return {'name': body.name, 'min_x': low.x, 'max_x': high.x, 'min_y': low.y, 'max_y': high.y,
            'min_z': low.z, 'max_z': high.z, 'height': height, 'head_width': head_width, 'arm_z': arm_z}


def fit_slot(request: dict) -> dict:
    object_mode()
    landmarks = _body_landmarks()
    before = set(bpy.data.objects)
    raw = Path(request['raw'])
    bpy.ops.import_scene.gltf(filepath=str(raw))
    added = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
    if len(added) != 1:
        raise WorkError('FIT_MESH_COUNT', f'Expected one mesh in {raw.name}, found {len(added)}')
    part = added[0]
    select([part], part)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    source_faces = len(part.data.polygons)
    target_faces = int(request['faces'])
    if source_faces > target_faces:
        modifier = part.modifiers.new('fit_decimate', 'DECIMATE')
        modifier.ratio = target_faces / source_faces
        bpy.ops.object.modifier_apply(modifier=modifier.name)

    points = [v.co.copy() for v in part.data.vertices]
    low = Vector(tuple(min(p[i] for p in points) for i in range(3)))
    high = Vector(tuple(max(p[i] for p in points) for i in range(3)))
    size = high - low
    if min(size) <= 1e-6:
        raise WorkError('FIT_GEOMETRY', 'Raw slot mesh has zero-size bounds')
    height = landmarks['height']
    center_x = (landmarks['min_x'] + landmarks['max_x']) / 2
    center_y = (landmarks['min_y'] + landmarks['max_y']) / 2
    depth = landmarks['max_y'] - landmarks['min_y']
    slot = request['slot']
    if slot == 'clothes':
        scale = Vector(((landmarks['max_x'] - landmarks['min_x']) * _WRIST_SPAN / size.x,
                        1.0, (_NECK - _ANKLE) * height / size.z))
        scale.y = max(depth * 1.06 / size.y, (scale.x + scale.z) / 2)
        base_z = landmarks['min_z'] + _ANKLE * height
    else:
        uniform = landmarks['head_width'] * 1.15 / size.x
        scale = Vector((uniform, uniform, uniform))
        base_z = landmarks['max_z'] + 0.02 * height - size.z * uniform
    for vertex in part.data.vertices:
        local = vertex.co - Vector(((low.x + high.x) / 2, (low.y + high.y) / 2, low.z))
        vertex.co = Vector((center_x + local.x * scale.x, center_y + local.y * scale.y, base_z + local.z * scale.z))
    part.data.update()
    sleeves = _align_sleeves(part, landmarks) if slot == 'clothes' else None
    part.name = f'slot_{slot}'
    output = Path(request['output'])
    for obj in [o for o in bpy.data.objects if o != part]:
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.ops.export_scene.gltf(filepath=str(output), export_format='GLB')
    if not output.is_file() or output.stat().st_size == 0:
        raise WorkError('FIT_EXPORT', f'Blender did not write {output}')
    return {'body': landmarks, 'sourceFaces': source_faces, 'fittedFaces': len(part.data.polygons),
            'scale': list(scale), 'baseZ': base_z, 'sleeves': sleeves}


# Sleeves of image-generated garments droop below the T-pose arm line; a rigged arm lowered about the
# shoulder would then swing them into the torso. Each sleeve band is rotated about its shoulder pivot
# in the frontal plane until its cuff lies on the body's arm line.
_SHOULDER_OF_HALF_SPAN = 0.23
_SLEEVE_FLOOR_OF_HEIGHT = 0.55
_CUFF_OF_REACH = 0.85


def _align_sleeves(part: bpy.types.Object, landmarks: dict[str, float]) -> dict:
    center = (landmarks['min_x'] + landmarks['max_x']) / 2
    half_span = (landmarks['max_x'] - landmarks['min_x']) / 2
    shoulder = half_span * _SHOULDER_OF_HALF_SPAN
    floor = landmarks['min_z'] + _SLEEVE_FLOOR_OF_HEIGHT * landmarks['height']
    blend = 0.03 * landmarks['height']
    arm_z = landmarks['arm_z']
    angles = {}
    for side, label in ((1.0, 'l'), (-1.0, 'r')):
        band = [v for v in part.data.vertices if side * (v.co.x - center) > shoulder - blend and v.co.z > floor]
        if not band:
            continue
        reach = max(side * (v.co.x - center) for v in band)
        cuff = [v.co for v in band if side * (v.co.x - center) > _CUFF_OF_REACH * reach]
        cuff_x = sum(side * (c.x - center) for c in cuff) / len(cuff)
        cuff_z = sum(c.z for c in cuff) / len(cuff)
        droop = math.atan2(arm_z - cuff_z, cuff_x - shoulder)
        pivot = Vector((center + side * shoulder, 0.0, arm_z))
        for vertex in band:
            weight = min(max((side * (vertex.co.x - center) - (shoulder - blend)) / (2 * blend), 0.0), 1.0)
            offset = Vector((vertex.co.x - pivot.x, 0.0, vertex.co.z - pivot.z))
            rotated = Matrix.Rotation(-side * droop * weight, 3, 'Y') @ offset
            vertex.co = Vector((pivot.x + rotated.x, vertex.co.y, pivot.z + rotated.z))
        angles[label] = math.degrees(droop)
    part.data.update()
    return {'droopDeg': angles, 'shoulderX': shoulder}
