# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Create independent closed skin sections centered around the installed ARP's reference limbs.
from __future__ import annotations

import bpy
from mathutils import Vector
from blender_common import output_path, object_mode

request = globals()['request']
path = output_path(request['output'],('.blend',))
arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
object_mode()
names = ['root_ref.x','spine_01_ref.x','spine_02_ref.x','neck_ref.x','head_ref.x',
         'arm_ref.l','forearm_ref.l','hand_ref.l','arm_ref.r','forearm_ref.r','hand_ref.r',
         'thigh_ref.l','leg_ref.l','foot_ref.l','thigh_ref.r','leg_ref.r','foot_ref.r']
created = []
for name in names:
    bone = arm.data.bones.get(name)
    if bone is None:
        continue
    head, tail = arm.matrix_world@bone.head_local, arm.matrix_world@bone.tail_local
    length = (tail-head).length
    if length < .001:
        continue
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,location=(head+tail)/2)
    obj = bpy.context.object
    obj.name = 'Skin_'+name
    obj.scale = (length*.22,length*.22,length*.6)
    obj.rotation_euler = (tail-head).to_track_quat('Z','Y').to_euler()
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    created.append(obj.name)
assert len(created) >= 10, [b.name for b in arm.data.bones if '_ref' in b.name]
bpy.ops.wm.save_as_mainfile(filepath=str(path))
result = {'output':str(path),'armature':arm.name,'meshes':created}
