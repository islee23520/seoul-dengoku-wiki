# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run through `character-tool exec --gui --input body.blend --output rigged.blend --script arp_smart_fit.py`.
# Auto-Rig Pro Smart: markers are placed from measured cross-sections of the T-pose body instead of
# mouse clicks, then ARP's own detection, Match to Rig and Bind operators do the fitting and skinning.
from __future__ import annotations

import json
from pathlib import Path

import addon_utils
import bpy
import numpy as np
from mathutils import Vector

from blender_common import WorkError, object_mode, output_path, save_blend

request = globals()['request']
output = output_path(request['output'], ('.blend',))


def view3d():
    for window in bpy.context.window_manager.windows:
        for area in window.screen.areas:
            if area.type == 'VIEW_3D':
                region = next(r for r in area.regions if r.type == 'WINDOW')
                return window, area, region
    raise WorkError('ARP_CONTEXT', 'ARP Smart needs a VIEW_3D area; run exec with --gui')


def run(operator, *args, **kwargs):
    window, area, region = view3d()
    with bpy.context.temp_override(window=window, area=area, region=region):
        return operator(*args, **kwargs)


def central_half_width(xs: np.ndarray, gap: float) -> float:
    if xs.size == 0:
        return 0.0
    ordered = np.sort(xs)
    breaks = np.where(np.diff(ordered) > gap)[0]
    starts = np.concatenate(([0], breaks + 1))
    ends = np.concatenate((breaks, [ordered.size - 1]))
    for start, end in zip(starts, ends):
        if ordered[start] <= 0.0 <= ordered[end]:
            return float(max(-ordered[start], ordered[end]))
    return 0.0


def landmarks(points: np.ndarray) -> dict:
    x, y, z = points[:, 0], points[:, 1], points[:, 2]
    z0, z1 = float(z.min()), float(z.max())
    height = z1 - z0
    step, gap = 0.005 * height, 0.012 * height
    levels = np.arange(z0 + step, z1, step)
    widths = np.array([central_half_width(x[np.abs(z - level) < step / 2], gap) for level in levels])
    side = x > 0
    tip = points[side][np.argmax(x[side])]
    arm_z = float(tip[2])
    # Armpit: first level below the arm line whose central run no longer contains the arms.
    below = [(l, w) for l, w in zip(levels, widths) if l < arm_z]
    armpit_z, chest = next(((l, w) for l, w in reversed(below) if w < 0.5 * float(tip[0])), below[-1])
    above = [(l, w) for l, w in zip(levels, widths) if arm_z + 0.02 * height < l < z1 - 0.06 * height and w > 0]
    neck_min_z, neck_w = min(above, key=lambda item: item[1])
    # Chin: the front-most profile jumps forward where the jaw starts above the neck minimum.
    mid = np.abs(x) < 0.03 * height
    front = [(l, float(y[mid & (np.abs(z - l) < step / 2)].min()))
             for l in levels if neck_min_z <= l < z1 - 0.05 * height and np.any(mid & (np.abs(z - l) < step / 2))]
    neck_front = front[0][1]
    chin_z = next((l for l, f in front if f < neck_front - 0.02 * height), neck_min_z + 0.03 * height)
    center = np.abs(x) < 0.01 * height
    crotch_z = min((float(z[center & (z > z0 + 0.3 * height) & (z < arm_z)].min()),), default=z0 + 0.47 * height)
    ankle_z = z0 + 0.045 * height
    leg = lambda level: float(x[side & (np.abs(z - level) < step) & (x < 0.2 * height)].mean())
    knee_z = (ankle_z + crotch_z) / 2 + 0.02 * height
    wrist_x = float(tip[0]) - 0.105 * height
    shoulder_x = float(chest)
    arm_band = side & (np.abs(z - arm_z) < 0.06 * height)
    arm_z_at = lambda at_x: float(z[arm_band & (np.abs(x - at_x) < step * 2)].mean())
    return {
        'head_tip': [0.0, 0.0, z1], 'chin': [0.0, 0.0, chin_z],
        'neck': [0.0, 0.0, neck_min_z - 0.25 * (neck_min_z - arm_z)],
        'shoulder': [shoulder_x, 0.0, arm_z_at(shoulder_x)],
        'elbow': [(shoulder_x + wrist_x) / 2, 0.0, arm_z_at((shoulder_x + wrist_x) / 2)],
        'hand': [wrist_x, 0.0, arm_z_at(wrist_x)], 'hand_tip': [float(tip[0]), 0.0, arm_z],
        'root': [0.0, 0.0, crotch_z + 0.06 * height],
        'knee': [leg(knee_z), 0.0, knee_z], 'foot': [leg(ankle_z), 0.0, ankle_z],
        'measured': {'height': height, 'armZ': arm_z, 'armpitZ': float(armpit_z), 'neckMinZ': float(neck_min_z),
                     'neckHalfWidth': float(neck_w), 'crotchZ': crotch_z},
    }


object_mode()
errors: list[str] = []
addon_utils.enable('auto_rig_pro', default_set=True, handle_error=lambda error: errors.append(str(error)))
if errors or not addon_utils.check('auto_rig_pro')[1]:
    raise WorkError('ARP_UNAVAILABLE', 'Install Auto-Rig Pro with character-tool setup first')

meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and not o.hide_render and len(o.data.vertices)]
body = max(meshes, key=lambda o: len(o.data.vertices))
world = np.array([body.matrix_world @ v.co for v in body.data.vertices])
shift = -float((world[:, 0].min() + world[:, 0].max()) / 2)
for obj in bpy.context.scene.objects:
    if obj.parent is None:
        obj.location.x += shift
bpy.context.view_layer.update()
points = np.array([body.matrix_world @ v.co for v in body.data.vertices])
marks = landmarks(points)

bpy.ops.object.select_all(action='DESELECT')
body.select_set(True)
bpy.context.view_layer.objects.active = body
scene = bpy.context.scene
scene.arp_smart_type = 'BODY'
run(bpy.ops.id.get_selected_objects)
scene.arp_smart_fingers_engine = 'LEGACY'
scene.arp_fingers_enable = bool(request.get('fingers', False))
scene.arp_bind_engine = request.get('bindEngine', 'PSEUDO_VOXELS')
for part in ['neck', 'chin', 'shoulder', 'hand', 'root', 'foot', 'elbow', 'knee', 'head_tip', 'hand_tip']:
    run(bpy.ops.id.add_marker, body_part=part)
    marker = bpy.data.objects.get(f'{part}_loc')
    if marker is None:
        raise WorkError('ARP_MARKER', f'ARP did not create marker {part}')
    marker.location = Vector(marks[part])
bpy.context.view_layer.update()
run(bpy.ops.id.go_detect, 'INVOKE_DEFAULT')
rig = next((o for o in scene.objects if o.type == 'ARMATURE' and 'arp_rig_type' in o.keys()), None)
if rig is None:
    raise WorkError('ARP_DETECT', 'ARP Smart detection did not produce a rig')

object_mode()
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
run(bpy.ops.arp.match_to_rig)
object_mode()
bound = [o for o in scene.objects if o.type == 'MESH' and not o.hide_render and len(o.data.vertices) and o.visible_get()]
bpy.ops.object.select_all(action='DESELECT')
for obj in bound:
    obj.select_set(True)
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
run(bpy.ops.arp.bind_to_rig)
object_mode()

unweighted = {}
for obj in bound:
    arm = obj.find_armature()
    deform = {b.name for b in arm.data.bones if b.use_deform} if arm else set()
    groups = {g.index for g in obj.vertex_groups if g.name in deform}
    unweighted[obj.name] = sum(not any(g.group in groups and g.weight > 0 for g in v.groups) for v in obj.data.vertices)
save_blend(output)
result = {'output': str(output), 'body': body.name, 'shiftX': shift, 'markers': marks, 'rig': rig.name,
          'bones': len(rig.data.bones), 'deformBones': sum(b.use_deform for b in rig.data.bones),
          'bound': [o.name for o in bound], 'unweightedVertices': unweighted}
Path(str(output) + '.arp.json').write_text(json.dumps(result, indent=2))
