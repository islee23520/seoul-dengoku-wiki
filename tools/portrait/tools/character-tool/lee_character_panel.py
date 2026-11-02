"""Manual-registration, scene-data-only avatar controls. No geometry generation."""
bl_info = {'name': 'Lee Character Controls', 'author': 'Avatar tools', 'version': (1, 7, 0), 'blender': (5, 2, 0), 'location': 'View3D > Sidebar > Lee Avatar', 'category': 'Interface'}
import json
import math
import bpy
from bpy.app.handlers import persistent

CONTRACT = 'lee_controls_contract'
REQUIRED = ('Mouth_Open', 'Head_Size', 'Body_Build')
_STATUS = {}
POSE_SLOTS = {
    'Brow_Raise': ('lee_brow_raise', 0.0, 1.0),
    'Jaw_Open': ('lee_jaw_open', 0.0, 1.0),
    'Jaw_Open_Angle': ('lee_jaw_angle', -0.7, 0.7),
    'Gaze_Yaw': ('lee_gaze_yaw', -0.5, 0.5),
    'Gaze_Pitch': ('lee_gaze_pitch', -0.4, 0.4),
}


def _animated(id_block, path):
    ad = id_block.animation_data
    if not ad:
        return False
    # Do not reset keyed/NLA values behind the animator's back.
    return bool(ad.action or ad.nla_tracks or any(f.data_path == path for f in ad.drivers))

def inspect(scene):
    """Read-only validation; return targets, editable records, and honest failures."""
    mesh = getattr(scene, 'lee_control_mesh', None)
    selected_rig = getattr(scene, 'lee_control_rig', None)
    ctl = getattr(scene, 'lee_control_contract', None)
    errors, records = [], []
    if not mesh or mesh.type != 'MESH':
        errors.append('Select a mesh explicitly')
    if not ctl:
        errors.append('Select a contract controller explicitly')
    if not selected_rig or selected_rig.type != 'ARMATURE':
        errors.append('Select an armature explicitly')
    if any(obj and scene.objects.get(obj.name) != obj for obj in (mesh, selected_rig, ctl)):
        errors.append('All selected objects must belong to this scene')
    if selected_rig and (selected_rig.library or selected_rig.data.library):
        errors.append('Selected armature is linked/read-only')
    if mesh and mesh.type == 'MESH' and selected_rig:
        active = [m.object for m in mesh.modifiers if m.type == 'ARMATURE' and m.show_viewport]
        if active != [selected_rig]:
            errors.append('Selected mesh must have exactly one enabled armature modifier targeting selected rig')
        if mesh.parent and mesh.parent.type == 'ARMATURE' and mesh.parent != selected_rig:
            errors.append('Mesh armature parent conflicts with selected rig')
    if errors:
        return mesh, ctl, records, errors
    if mesh.library or mesh.data.library or ctl.library:
        return mesh, ctl, [], ['Linked data is read-only; use an editable local asset']
    try:
        contract = json.loads(ctl.get(CONTRACT, ''))
        if contract.get('version') != 1 or contract.get('mesh') != mesh.name:
            raise ValueError('version/mesh mismatch')
        if contract.get('rig', selected_rig.name) != selected_rig.name:
            raise ValueError('selected rig / contract mismatch')
        items = contract['controls']
        if not isinstance(items, list) or len(items) > 32:
            raise ValueError('controls must be a list of at most 32 entries')
    except (ValueError, TypeError, KeyError, AttributeError) as e:
        return mesh, ctl, [], ['Missing/invalid control contract: ' + str(e)]
    keys = mesh.data.shape_keys
    seen = set()
    rigs = [m.object for m in mesh.modifiers if m.type == 'ARMATURE' and m.object]
    if mesh.parent and mesh.parent.type == 'ARMATURE':
        rigs.append(mesh.parent)
    for item in items:
        rec = {'name': 'Invalid entry', 'reason': '', 'target': None, 'path': '', 'neutral': 0.0}
        records.append(rec)
        try:
            name = item['name']
            if not isinstance(name, str) or name in seen:
                raise ValueError('Duplicate/invalid name')
            seen.add(name)
            rec['name'] = name
            if item.get('mode', '').startswith('POSE_') and item.get('rig') != selected_rig.name:
                raise ValueError('Control contract references a different armature than selected rig')
            if item.get('ready') is not True:
                raise ValueError(item.get('reason', 'Not implemented / not reviewed'))
            lo, hi, neutral = (float(item[k]) for k in ('min', 'max', 'neutral'))
            if not all(math.isfinite(v) for v in (lo, hi, neutral)) or not lo <= neutral <= hi or lo >= hi:
                raise ValueError('Invalid finite bounds/neutral')
            if item.get('mode') == 'POSE_BONE_BROW_PAIR':
                if name != 'Brow_Raise' or (lo,hi,neutral) != (0,1,0):
                    raise ValueError('Brow_Raise requires paired0..1 neutral0 contract')
                if item.get('bones') != ['c_eyebrow_full.l','c_eyebrow_full.r'] or item.get('axis') != 1:
                    raise ValueError('Only verified paired eyebrow-full local Y supported')
                distance = float(item['max_raise_m'])
                if not math.isfinite(distance) or abs(distance-.0025)>1e-9 or not item.get('pose_review'):
                    raise ValueError('Reviewed 2.5mm brow path required')
                rig = scene.objects.get(item['rig'])
                if not rig or rig.type != 'ARMATURE' or rig.library or rig.data.library:
                    raise ValueError('Missing/edit-protected brow armature')
                if not any(mod.type=='ARMATURE' and mod.object==rig and mod.show_viewport for mod in mesh.modifiers):
                    raise ValueError('Actual enabled brow skin armature modifier missing')
                if any(abs(v-1)>1e-5 for v in rig.matrix_world.to_scale()):
                    raise ValueError('Brow path requires unit world rig scale')
                bones = [rig.pose.bones.get(n) for n in item['bones']]
                for bone in bones:
                    if not bone or not bone.parent or bone.parent.name!='head.x':
                        raise ValueError('Brow full controls require verified head parent')
                    if any(bone.lock_location) or bone.rotation_mode!='XYZ' or any(abs(x)>1e-6 for x in bone.rotation_euler):
                        raise ValueError('Brow requires unlocked translation and neutral XYZ rotation')
                    if any(abs(bone.location[i])>1e-6 for i in (0,2)) or any(abs(x-1)>1e-5 for x in bone.scale):
                        raise ValueError('Brow off-axis translation / scale conflicts with reviewed path')
                    if any(not c.mute and c.influence>0 for c in bone.constraints):
                        raise ValueError('Active brow control constraints conflict with direct path')
                    if any(_animated(rig,bone.path_from_id(ch)) for ch in ('location','rotation_euler','rotation_quaternion','scale')):
                        raise ValueError('Brow is animated/driven; live control blocked')
                    side=bone.name[-1]
                    for suffix in ('01_end','01','02','03'):
                        child=rig.pose.bones.get('c_eyebrow_'+suffix+'.'+side)
                        if not child or child.parent!=bone or not child.bone.use_deform or not mesh.vertex_groups.get(child.name):
                            raise ValueError('Reviewed brow skin/deform hierarchy missing')
                        if child.location.length>1e-6 or any(abs(v)>1e-6 for v in child.rotation_euler) or any(abs(v-1)>1e-5 for v in child.scale):
                            raise ValueError('Individual brow controls are not neutral')
                        if any(_animated(rig,child.path_from_id(ch)) for ch in ('location','rotation_euler','rotation_quaternion','scale')):
                            raise ValueError('Individual brow controls animated/driven')
                vals=[b.location[1]/distance for b in bones]
                warning='Brows asymmetric / outside reviewed range: Reset Brows before paired use' if abs(vals[0]-vals[1])>1e-5 or min(vals)<-1e-5 or max(vals)>1.00001 else ''
                rec.update(target=scene,path='lee_brow_raise',neutral=0.0,pose_bone=bones[0],brow_bones=bones,
                           brow_distance=distance,bounds=(0,1),rig=rig,axis=1,sign=1,warning=warning)
                continue
            if item.get('mode') == 'POSE_BONE_GAZE_TARGET':
                spec = {'Gaze_Yaw': (2, -1, math.radians(10)), 'Gaze_Pitch': (1, 1, math.radians(7))}
                if name not in spec:
                    raise ValueError('Only Gaze_Yaw / Gaze_Pitch target channels supported')
                axis, sign, limit = spec[name]
                if neutral != 0 or lo != -limit or hi != limit or item.get('axis') != axis or item.get('sign') != sign:
                    raise ValueError('Gaze contract must use verified local axes and ±10° yaw / ±7° pitch')
                rig = scene.objects.get(item['rig'])
                if not rig or rig.type != 'ARMATURE' or rig.library or rig.data.library:
                    raise ValueError('Missing/edit-protected actual gaze armature')
                bone = rig.pose.bones.get(item['bone'])
                if not bone or bone.name != 'c_eye_target.x' or bone.parent:
                    raise ValueError('Verified unparented c_eye_target.x is required')
                if any(bone.lock_location) or any(abs(v) > 1e-6 for v in bone.rotation_euler) or bone.rotation_mode != 'XYZ':
                    raise ValueError('Gaze target requires unlocked translation and neutral XYZ rotation')
                if abs(bone.location[0]) > 1e-6:
                    raise ValueError('Gaze depth changed; restore verified target depth first')
                if any(abs(x-1) > 1e-5 for x in rig.matrix_world.to_scale()) or any(abs(x-1) > 1e-5 for x in bone.scale):
                    raise ValueError('Gaze calibration requires unit rig and pose scale')
                if any(_animated(rig, bone.path_from_id(ch)) for ch in ('location','rotation_euler','rotation_quaternion','scale')):
                    raise ValueError('Gaze target is animated/driven; live control blocked')
                active = [c for c in bone.constraints if not c.mute and c.influence > 0]
                if len(active) != 1:
                    raise ValueError('Expected one verified head-follow Child Of constraint')
                c = active[0]
                if c.type != 'CHILD_OF' or c.target != rig or c.subtarget != 'head.x' or abs(c.influence-1) > 1e-6:
                    raise ValueError('Gaze head-follow constraint does not match calibration')
                if not all(getattr(c, 'use_'+ch+'_'+a) for ch in ('location','rotation','scale') for a in ('x','y','z')):
                    raise ValueError('Gaze head-follow constraint axes changed')
                expected = item['child_of_inverse']
                if len(expected) != 4 or any(len(row) != 4 for row in expected) or any(not math.isfinite(float(expected[i][j])) or abs(c.inverse_matrix[i][j]-float(expected[i][j])) > 1e-5 for i in range(4) for j in range(4)):
                    raise ValueError('Gaze head-follow inverse matrix changed')
                if _animated(rig, c.path_from_id('influence')):
                    raise ValueError('Gaze head-follow influence is animated/driven')
                distance = float(item['target_distance'])
                if not math.isfinite(distance) or abs(distance-.192) > 1e-6 or not item.get('pose_review'):
                    raise ValueError('Verified .192m target calibration / review missing')
                angle = math.atan(sign * bone.location[axis] / distance)
                rec.update(target=scene, path=POSE_SLOTS[name][0], neutral=0.0, pose_bone=bone,
                           axis=axis, sign=sign, bounds=(lo,hi), rig=rig, gaze_distance=distance,
                           warning='Gaze outside reviewed range: Reset Gaze before use' if not lo-1e-6 <= angle <= hi+1e-6 else '')
                continue
            if item.get('mode') == 'POSE_BONE_JAW_OPEN':
                if name != 'Jaw_Open' or lo != 0 or hi != 1 or neutral != 0:
                    raise ValueError('Jaw_Open requires reviewed 0..1, neutral 0 contract')
                rig = scene.objects.get(item['rig'])
                if not rig or rig.type != 'ARMATURE' or rig.library or rig.data.library:
                    raise ValueError('Missing/edit-protected actual armature')
                bone = rig.pose.bones.get(item['bone'])
                if not bone or bone.name != 'c_jawbone.x' or item.get('axis') != 0:
                    raise ValueError('Only verified c_jawbone.x local-X jaw channel supported')
                if bone.rotation_mode not in ('XYZ','XZY','YXZ','YZX','ZXY','ZYX'):
                    raise ValueError('Jaw requires existing Euler rotation mode')
                if any(bone.lock_rotation) or any(bone.lock_location):
                    raise ValueError('Jaw rotation/translation channels must all be unlocked')
                if any(not c.mute and c.influence > 0 for c in bone.constraints):
                    raise ValueError('Active jaw constraints conflict with direct coupled path')
                if any(abs(x-1) > 1e-5 for x in rig.matrix_world.to_scale()) or any(abs(x-1) > 1e-5 for x in bone.scale):
                    raise ValueError('Jaw path requires unit world rig scale and pose scale')
                if any(_animated(rig, bone.path_from_id(channel)) for channel in ('rotation_euler','location','scale')):
                    raise ValueError('Jaw has animation/drivers; coupled live control blocked')
                if any(abs(bone.rotation_euler[i]) > 1e-5 for i in (1,2)):
                    raise ValueError('Other jaw rotation axes are nonneutral')
                track = rig.pose.bones.get('jawbone_track.x')
                deform = rig.pose.bones.get('jawbone.x')
                if not track or not deform:
                    raise ValueError('Verified jaw deform/track chain missing')
                if any(c.type == 'DAMPED_TRACK' and not c.mute and c.influence > 1e-6 for c in track.constraints):
                    raise ValueError('Jaw Damped Track overrides reviewed direct rotation')
                if not any(c.type == 'COPY_ROTATION' and c.target == rig and c.subtarget == bone.name and not c.mute and abs(c.influence-1)<1e-6 for c in track.constraints):
                    raise ValueError('Jaw track rotation link missing')
                if not any(c.type == 'COPY_LOCATION' and c.target == rig and c.subtarget == bone.name and c.owner_space == 'LOCAL' and c.target_space == 'LOCAL' and not c.mute and abs(c.influence-1)<1e-6 for c in deform.constraints):
                    raise ValueError('Jaw coupled translation link missing')
                if (bone.bone.head_local-deform.bone.head_local).length > 1e-5:
                    raise ValueError('Jaw control/deform pivots do not match reviewed direct path')
                angle = float(item['max_angle'])
                vector = tuple(float(x) for x in item['local_translation_vector'])
                if not math.isfinite(angle) or not 0 < angle <= math.radians(45):
                    raise ValueError('Jaw maximum must be reviewed, positive and within the 45-degree software guard')
                translation_limit = float(item.get('translation_limit_m', .003))
                if not math.isfinite(translation_limit) or not 0 < translation_limit <= .007:
                    raise ValueError('Jaw translation limit must be finite, positive and at most 7mm')
                if translation_limit > .003 and (not isinstance(item.get('translation_review'), str) or not item['translation_review'].strip()):
                    raise ValueError('Jaw translation above 3mm requires explicit path-review reference')
                if len(vector) != 3 or not all(math.isfinite(x) for x in vector) or math.sqrt(sum(x*x for x in vector)) > translation_limit:
                    raise ValueError('Jaw local translation exceeds explicitly reviewed finite limit (default 3mm)')
                if contract.get('profile') == 'current_highres_diagnostic':
                    from mathutils import Vector
                    expected = (rig.matrix_world @ bone.bone.matrix_local).to_3x3().inverted() @ Vector((.006,0,-.002)) * (5.24/18)**2
                    if len(mesh.data.vertices) != 66943 or abs(angle-math.radians(5.24))>1e-8 or max(abs(vector[i]-expected[i]) for i in range(3))>1e-7:
                        raise ValueError('Current highres contract requires exact reviewed 5.24deg matched-gap path')
                    if item.get('range_status') != 'diagnostic':
                        raise ValueError('Current highres mouth range is diagnostic, not final')
                if not item.get('pose_review'):
                    raise ValueError('Coupled jaw-path review reference is missing')
                if item.get('range_status', 'diagnostic') not in ('diagnostic', 'accepted'):
                    raise ValueError('Invalid jaw range review status')
                u = bone.rotation_euler[0] / angle
                mismatch = math.sqrt(sum((bone.location[i]-vector[i]*u*u)**2 for i in range(3)))
                rec.update(target=scene, path='lee_jaw_open', neutral=0.0, pose_bone=bone,
                           axis=0, sign=1, bounds=(0.0,1.0), rig=rig, jaw_angle=angle,
                           jaw_vector=vector, range_status=item.get('range_status', 'diagnostic'), warning='Jaw off reviewed path: Reset Neutral before use' if mismatch > 1e-6 or not -1e-5 <= u <= 1.00001 else '')
                continue
            if item.get('mode') == 'POSE_BONE_CHANNEL':
                if name not in POSE_SLOTS or name in ('Jaw_Open','Gaze_Yaw','Gaze_Pitch','Brow_Raise'):
                    raise ValueError('Pose control name is not whitelisted')
                if any(isinstance(other, dict) and other.get('ready') is True and other.get('mode') == 'POSE_BONE_JAW_OPEN' and other.get('rig') == item.get('rig') and other.get('bone') == item.get('bone') for other in items):
                    raise ValueError('Angle-only control conflicts with registered coupled Jaw_Open')
                slot, hardlo, hardhi = POSE_SLOTS[name]
                if lo < hardlo or hi > hardhi:
                    raise ValueError('Pose contract exceeds safe UI limits')
                rig = scene.objects.get(item['rig'])
                if not rig or rig.type != 'ARMATURE' or rig.library or rig.data.library:
                    raise ValueError('Missing/edit-protected actual armature')
                bone = rig.pose.bones.get(item['bone'])
                axis = item['axis']
                if not bone or type(axis) is not int or axis not in (0, 1, 2):
                    raise ValueError('Missing actual pose bone / invalid axis')
                if item.get('channel') != 'rotation_euler' or bone.rotation_mode not in ('XYZ','XZY','YXZ','YZX','ZXY','ZYX'):
                    raise ValueError('Only existing Euler pose rotation channels supported')
                if bone.lock_rotation[axis]:
                    raise ValueError('Pose rotation axis is locked')
                path = bone.path_from_id('rotation_euler')
                if _animated(rig, path):
                    raise ValueError('Rig has animation/drivers; live slider blocked')
                sign = item.get('sign', 1)
                if sign not in (-1, 1):
                    raise ValueError('Pose sign must be -1 or +1')
                if not item.get('pose_review'):
                    raise ValueError('Pose-axis motion review reference is missing')
                rec.update(target=scene, path=slot, neutral=neutral, pose_bone=bone,
                           axis=axis, sign=sign, bounds=(lo, hi), rig=rig)
                continue
            if not keys or not keys.use_relative:
                raise ValueError('Relative shape-key data is missing')
            key = keys.key_blocks.get(item['key'])
            if not key or key == keys.reference_key or key.mute:
                raise ValueError('Missing, basis, or muted shape key')
            if len(key.data) != len(mesh.data.vertices):
                raise ValueError('Shape-key topology mismatch')
            if not any((p.co - q.co).length_squared > 1e-16 for p, q in zip(key.data, key.relative_key.data)):
                raise ValueError('Key has no actual deformation')
            if not math.isclose(key.slider_min, lo, abs_tol=1e-6) or not math.isclose(key.slider_max, hi, abs_tol=1e-6):
                raise ValueError('Key slider bounds do not match reviewed contract')
            if item.get('changes_rest_shape', True) and rigs:
                review = item.get('rig_review', {})
                if (review.get('rig') not in {r.name for r in rigs} or not review.get('revision') or
                    review.get('revision') != ctl.get('lee_rig_review_revision')):
                    raise ValueError('Rest-shape change blocked: rig synchronization review missing')
            mode = item.get('mode', 'SHAPE_KEY')
            keypath = key.path_from_id('value')
            if mode == 'SHAPE_KEY':
                if _animated(keys, keypath):
                    raise ValueError('Animated/driven key: use its reviewed controller, not direct edits')
                rec.update(target=key, path='value')
            elif mode == 'CUSTOM_PROPERTY':
                prop = item['property']
                if not isinstance(prop, str) or not isinstance(ctl.get(prop), (int, float)) or isinstance(ctl.get(prop), bool):
                    raise ValueError('Missing numeric controller property')
                path = '[' + json.dumps(prop) + ']'
                if _animated(ctl, path):
                    raise ValueError('Controller is animated/driven; panel edit blocked')
                ui = ctl.id_properties_ui(prop).as_dict()
                if ui.get('min') != lo or ui.get('max') != hi:
                    raise ValueError('Controller bounds do not match contract')
                fc = next((f for f in keys.animation_data.drivers if f.data_path == keypath), None) if keys.animation_data else None
                if not fc or fc.mute or fc.driver.type != 'SUM' or len(fc.driver.variables) != 1:
                    raise ValueError('Expected a live single-variable SUM shape-key driver')
                var = fc.driver.variables[0]
                if var.type != 'SINGLE_PROP' or var.targets[0].id != ctl or var.targets[0].data_path != path:
                    raise ValueError('Driver does not reference this controller property')
                rec.update(target=ctl, path=path)
            else:
                raise ValueError('Unsupported control mode')
            rec['neutral'] = neutral
        except (ValueError, TypeError, KeyError, AttributeError, RuntimeError) as e:
            rec['reason'] = str(e)
            rec['target'] = None
    for name in REQUIRED:
        if name not in seen:
            records.append({'name': name, 'reason': 'Not registered in this asset contract', 'target': None})
    return mesh, ctl, records, errors

class LEE_OT_validate_controls(bpy.types.Operator):
    bl_idname = 'lee.validate_controls'
    bl_label = 'Validate Controls'
    def execute(self, context):
        _, _, rows, errors = inspect(context.scene)
        messages = errors + [r['name'] + ': ' + r['reason'] for r in rows if r['reason']]
        _STATUS[context.scene.name] = messages
        self.report({'WARNING'} if messages else {'INFO'}, '; '.join(messages) if messages else 'All registered controls are valid')
        return {'FINISHED'}

class LEE_OT_reset_neutral(bpy.types.Operator):
    bl_idname = 'lee.reset_neutral'
    bl_label = 'Reset Available Controls to Neutral'
    bl_description = 'Reset only validated, unanimated controls; does not reset unregistered rig pose or missing controls'
    bl_options = {'REGISTER', 'UNDO'}
    def execute(self, context):
        if context.mode not in ('OBJECT', 'POSE'):
            self.report({'ERROR'}, 'Switch to Object or Pose Mode first')
            return {'CANCELLED'}
        _, _, rows, errors = inspect(context.scene)
        valid = [r for r in rows if r['target'] is not None and (context.mode == 'OBJECT' or 'pose_bone' in r)]
        if errors or not valid:
            self.report({'ERROR'}, '; '.join(errors) or 'No validated editable controls')
            return {'CANCELLED'}
        for r in valid:
            if 'pose_bone' in r:
                setattr(context.scene, r['path'], r['neutral'])
            elif r['path'] == 'value':
                r['target'].value = r['neutral']
            else:
                r['target'][json.loads(r['path'][1:-1])] = r['neutral']
                r['target'].update_tag()
        context.view_layer.update()
        skipped = len(rows) - len(valid)
        self.report({'WARNING'} if skipped else {'INFO'}, f'Reset {len(valid)} controls; {skipped} unavailable. Only registered channels reset; other rig pose unchanged.')
        return {'FINISHED'}

class LEE_OT_reset_gaze(bpy.types.Operator):
    bl_idname = 'lee.reset_gaze'
    bl_label = 'Reset Gaze Only'
    bl_description = 'Reset the two verified gaze target translations; leave jaw and all other controls unchanged'
    bl_options = {'REGISTER', 'UNDO'}
    def execute(self, context):
        if context.mode not in ('OBJECT','POSE'):
            return {'CANCELLED'}
        rows = [r for r in inspect(context.scene)[2] if r.get('gaze_distance') and r.get('target') is not None]
        if {r['name'] for r in rows} != {'Gaze_Yaw','Gaze_Pitch'}:
            self.report({'ERROR'}, 'Both verified gaze channels are required; nothing reset')
            return {'CANCELLED'}
        for r in rows:
            setattr(context.scene, r['path'], 0.0)
        context.view_layer.update()
        return {'FINISHED'}

class LEE_OT_reset_brows(bpy.types.Operator):
    bl_idname = 'lee.reset_brows'
    bl_label = 'Reset Brows Only'
    bl_description = 'Return the verified paired brow raise to neutral; leave jaw and gaze unchanged'
    bl_options = {'REGISTER','UNDO'}
    def execute(self, context):
        if context.mode not in ('OBJECT','POSE'):
            return {'CANCELLED'}
        r = _pose_record(context.scene,'Brow_Raise')
        if not r or not r.get('brow_bones'):
            self.report({'ERROR'}, 'Validated brow pair unavailable; nothing reset')
            return {'CANCELLED'}
        context.scene.lee_brow_raise=0.0
        context.view_layer.update()
        return {'FINISHED'}

class LEE_PT_character_controls(bpy.types.Panel):
    bl_label = 'Lee Character Controls'
    bl_idname = 'LEE_PT_character_controls'
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'Lee Avatar'
    def draw(self, context):
        layout = self.layout
        layout.prop(context.scene, 'lee_control_mesh', text='Mesh')
        layout.prop(context.scene, 'lee_control_rig', text='Armature')
        layout.prop(context.scene, 'lee_control_contract', text='Contract')
        _, _, rows, errors = inspect(context.scene)
        for error in errors:
            layout.label(text=error, icon='ERROR')
        for r in rows:
            box = layout.column(align=True)
            if r['target'] is None:
                row = box.row(); row.enabled = False
                row.label(text=r['name'] + ' — unavailable')
                box.label(text=r['reason'], icon='INFO')
            else:
                box.enabled = context.mode == 'OBJECT' or (context.mode == 'POSE' and 'pose_bone' in r)
                label = r['name']
                if 'jaw_angle' in r:
                    label = ('Jaw Test' if r['range_status'] == 'diagnostic' else 'Jaw Open') + f" 0–{math.degrees(r['jaw_angle']):g}°"
                box.prop(r['target'], r['path'], text=label, slider=True)
                if 'jaw_angle' in r:
                    box.label(text=f"Actual angle: {math.degrees(r['pose_bone'].rotation_euler[0]):.2f}°")
                    if r['range_status'] == 'diagnostic':
                        box.label(text='DIAGNOSTIC — not final mouth range', icon='INFO')
                        if abs(math.degrees(r['jaw_angle'])-5.24)<1e-4:
                            box.label(text='Matched source opening ~9.63mm', icon='INFO')
                if 'brow_distance' in r:
                    box.label(text='Paired brow raise 0–2.5mm; return0 to relax', icon='INFO')
                if 'gaze_distance' in r:
                    box.label(text='Target ray angle — not per-eye rotation', icon='INFO')
                if r.get('warning'):
                    box.label(text=r['warning'], icon='ERROR')
        gaze_row = layout.row()
        gaze_row.enabled = sum(r.get('gaze_distance') is not None and r.get('target') is not None for r in rows) == 2
        gaze_row.operator('lee.reset_gaze', icon='LOOP_BACK')
        brow_row = layout.row()
        brow_row.enabled = any(r.get('brow_bones') and r.get('target') is not None for r in rows)
        brow_row.operator('lee.reset_brows', icon='LOOP_BACK')
        layout.label(text='Blink — not implemented', icon='INFO')
        layout.operator('lee.validate_controls', icon='CHECKMARK')
        row = layout.row()
        row.enabled = context.mode in ('OBJECT', 'POSE') and any(r['target'] is not None for r in rows)
        row.operator('lee.reset_neutral', icon='LOOP_BACK')
        layout.label(text='Reset affects registered channels only.', icon='INFO')

@persistent
def validate_loaded_scene(_):
    # Read-only handler: no key creation, value clamps, saving, or rig mutation.
    _STATUS.clear()
    for scene in bpy.data.scenes:
        _, _, rows, errors = inspect(scene)
        _STATUS[scene.name] = errors + [r['name'] + ': ' + r['reason'] for r in rows if r['reason']]

def _pose_record(scene, name):
    return next((r for r in inspect(scene)[2] if r['name'] == name and 'pose_bone' in r), None)

def _getter(name):
    def get(scene):
        r = _pose_record(scene, name)
        if r and 'brow_distance' in r:
            return sum(b.location[1] for b in r['brow_bones'])/(2*r['brow_distance'])
        if r and 'gaze_distance' in r:
            return math.atan(r['sign'] * r['pose_bone'].location[r['axis']] / r['gaze_distance'])
        if r and 'jaw_angle' in r:
            return r['pose_bone'].rotation_euler[0] / r['jaw_angle']
        return r['sign'] * r['pose_bone'].rotation_euler[r['axis']] if r else 0.0
    return get

def _setter(name):
    def set_value(scene, value):
        r = _pose_record(scene, name)
        if r is None or not math.isfinite(value):
            return
        value = min(r['bounds'][1], max(r['bounds'][0], value))
        if 'brow_distance' in r:
            for bone in r['brow_bones']:
                bone.location[1] = r['brow_distance']*value
        elif 'gaze_distance' in r:
            r['pose_bone'].location[r['axis']] = r['sign'] * r['gaze_distance'] * math.tan(value)
        elif 'jaw_angle' in r:
            r['pose_bone'].rotation_euler[0] = r['jaw_angle'] * value
            r['pose_bone'].location = tuple(x * value * value for x in r['jaw_vector'])
        else:
            r['pose_bone'].rotation_euler[r['axis']] = r['sign'] * value
        r['rig'].update_tag()
    return set_value

# Explicit, material-instance-only hair appearance controls. No geometry or rigs.
HAIR_GROUP = 'LEE_HairSurface_Controller54'
HAIR_ROLES = ('scalp', 'brows', 'beard')
HAIR_INPUTS = {
    'density': ('Density', 'Density', 0.0, 1.0),
    'stroke_length': ('StrokeLength', 'Stroke length look', 0.0, 1.0),
    'shadow_amount': ('ShadowAmount', 'Shadow amount', 0.0, 1.0),
    'roughness': ('Roughness', 'Roughness (physical 0.75–1)', 0.0, 1.0),
    'strand_width': ('StrandWidth', 'Relative strand width', 0.0, 1.0),
}

def inspect_hair_material(scene, role):
    """Resolve only the explicit material pointer; never search by material name."""
    if role not in HAIR_ROLES:
        return None, None, ['Unknown material role']
    mat = getattr(scene, 'lee_' + role + '_material', None)
    if mat is None:
        return None, None, ['Select an explicit ' + role + ' material']
    if any(other != role and getattr(scene, 'lee_' + other + '_material', None) == mat for other in HAIR_ROLES):
        return mat, None, ['Scalp, brows and beard require distinct material instances']
    if mat.library or not mat.is_editable:
        return mat, None, ['Material is linked/read-only']
    if not any(slot.material == mat for obj in scene.objects for slot in obj.material_slots):
        return mat, None, ['Material is not assigned to an object in this scene']
    if not mat.use_nodes or not mat.node_tree:
        return mat, None, ['Material nodes are unavailable']
    matches = [n for n in mat.node_tree.nodes if n.type == 'GROUP' and n.node_tree and n.node_tree.name == HAIR_GROUP]
    if len(matches) != 1:
        return mat, None, ['Expected exactly one ' + HAIR_GROUP + ' group node']
    node = matches[0]
    if node.mute:
        return mat, None, ['Controller group node is muted']
    visited = set()
    pending = [node]
    reaches_surface = False
    while pending:
        current = pending.pop()
        if current in visited:
            continue
        visited.add(current)
        for output in current.outputs:
            for link in output.links:
                target = link.to_node
                if target.type == 'OUTPUT_MATERIAL' and target.is_active_output and link.to_socket.name == 'Surface':
                    reaches_surface = True
                elif not target.mute:
                    pending.append(target)
    if not reaches_surface:
        return mat, None, ['Controller group has no live path to material Surface output']
    if not node.inputs.get('StrandWidth'):
        return mat, None, ['Controller contract is missing StrandWidth']
    return mat, node, []

def _hair_socket(scene, role, parameter):
    mat, node, errors = inspect_hair_material(scene, role)
    if errors:
        return mat, None, errors[0]
    spec = HAIR_INPUTS.get(parameter)
    if not spec:
        return mat, None, 'Unknown shader parameter'
    socket = node.inputs.get(spec[0])
    if not socket or socket.type != 'VALUE' or not hasattr(socket, 'default_value'):
        return mat, None, 'Missing scalar input: ' + spec[0]
    if socket.is_linked:
        return mat, None, spec[0] + ' is linked; input default is not editable control'
    if _animated(mat.node_tree, socket.path_from_id('default_value')):
        return mat, None, spec[0] + ' is animated/driven; slider disabled'
    if not math.isfinite(float(socket.default_value)):
        return mat, None, spec[0] + ' has a non-finite value'
    if not spec[2]-1e-6 <= float(socket.default_value) <= spec[3]+1e-6:
        return mat, None, spec[0] + ' is outside normalized 0..1; authored value left unchanged'
    return mat, socket, ''

def _hair_getter(role, parameter):
    def get(scene):
        _, socket, _ = _hair_socket(scene, role, parameter)
        return float(socket.default_value) if socket else 0.0
    return get

def _hair_setter(role, parameter):
    def set_value(scene, value):
        if not math.isfinite(value):
            return
        mat, socket, error = _hair_socket(scene, role, parameter)
        if error:
            return
        _, _, lo, hi = HAIR_INPUTS[parameter]
        socket.default_value = min(hi, max(lo, float(value)))
        mat.node_tree.update_tag()
        mat.update_tag()
    return set_value

class LEE_PT_surface_appearance(bpy.types.Panel):
    bl_label = 'Hair Surface Appearance'
    bl_idname = 'LEE_PT_surface_appearance'
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'Lee Avatar'
    bl_order = 1
    def draw(self, context):
        layout = self.layout
        layout.label(text='Surface appearance only', icon='INFO')
        layout.label(text='Long silhouette carrier pending')
        for role in HAIR_ROLES:
            box = layout.box()
            box.prop(context.scene, 'lee_' + role + '_material', text=role.title())
            _, _, errors = inspect_hair_material(context.scene, role)
            for error in errors:
                box.label(text=error, icon='INFO')
            for parameter, (_, label, lo, hi) in HAIR_INPUTS.items():
                _, socket, error = _hair_socket(context.scene, role, parameter)
                row = box.row()
                row.enabled = not bool(error)
                row.prop(context.scene, 'lee_' + role + '_' + parameter, text=label, slider=True)
                if error and not errors:
                    box.label(text=error, icon='INFO')
            if role == 'beard':
                box.label(text='Shadow / short-stubble look; not hair length geometry')


_CLASSES = (LEE_OT_validate_controls, LEE_OT_reset_neutral, LEE_OT_reset_gaze, LEE_OT_reset_brows, LEE_PT_character_controls, LEE_PT_surface_appearance)
def register():
    for role in HAIR_ROLES:
        setattr(bpy.types.Scene, 'lee_' + role + '_material', bpy.props.PointerProperty(name=role.title() + ' material', type=bpy.types.Material))
        for parameter, (_, label, lo, hi) in HAIR_INPUTS.items():
            setattr(bpy.types.Scene, 'lee_' + role + '_' + parameter, bpy.props.FloatProperty(name=label, min=lo, max=hi, get=_hair_getter(role, parameter), set=_hair_setter(role, parameter), options=set()))
    bpy.types.Scene.lee_control_mesh = bpy.props.PointerProperty(name='Target mesh', type=bpy.types.Object, poll=lambda self,obj: obj.type=='MESH')
    bpy.types.Scene.lee_control_rig = bpy.props.PointerProperty(name='Target armature', type=bpy.types.Object, poll=lambda self,obj: obj.type=='ARMATURE')
    bpy.types.Scene.lee_control_contract = bpy.props.PointerProperty(name='Contract controller', type=bpy.types.Object)
    for name, (slot, lo, hi) in POSE_SLOTS.items():
        setattr(bpy.types.Scene, slot, bpy.props.FloatProperty(name=name, subtype='FACTOR' if name in ('Jaw_Open','Brow_Raise') else 'ANGLE',
                min=lo, max=hi, get=_getter(name), set=_setter(name), options=set()))
    for cls in _CLASSES:
        bpy.utils.register_class(cls)
    if validate_loaded_scene not in bpy.app.handlers.load_post:
        bpy.app.handlers.load_post.append(validate_loaded_scene)

def unregister():
    for role in HAIR_ROLES:
        for suffix in ['material'] + list(HAIR_INPUTS):
            name = 'lee_' + role + '_' + suffix
            if hasattr(bpy.types.Scene, name):
                delattr(bpy.types.Scene, name)
    for prop in ('lee_control_mesh','lee_control_rig','lee_control_contract'):
        if hasattr(bpy.types.Scene, prop):
            delattr(bpy.types.Scene, prop)
    for slot, _, _ in POSE_SLOTS.values():
        if hasattr(bpy.types.Scene, slot):
            delattr(bpy.types.Scene, slot)
    if validate_loaded_scene in bpy.app.handlers.load_post:
        bpy.app.handlers.load_post.remove(validate_loaded_scene)
    for cls in reversed(_CLASSES):
        bpy.utils.unregister_class(cls)
    _STATUS.clear()

if __name__ == '__main__':
    register()
