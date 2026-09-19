# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run inside Blender through character-tool render --output <new-directory>.
from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector

from blender_common import WorkError, bounds, meshes


def render(request):
    directory = Path(request['output'])
    if directory.exists():
        raise WorkError('OUTPUT_EXISTS', str(directory))
    objects = meshes()
    low, high = bounds(objects)
    center = (low+high)/2
    radius = max(high-low)*1.1
    displacement = 0.0
    if request.get('pose-bone'):
        arm = objects[0].find_armature()
        bone = arm.pose.bones.get(request['pose-bone']) if arm else None
        if not bone:
            raise WorkError('POSE_BONE', 'Pose bone not found on first mesh armature')
        graph = bpy.context.evaluated_depsgraph_get()
        before = [[v.co.copy() for v in o.evaluated_get(graph).data.vertices] for o in objects]
        bone.rotation_mode = 'XYZ'
        bone.rotation_euler.x = math.radians(float(request.get('angle','35')))
        bpy.context.view_layer.update()
        for obj, coords in zip(objects,before):
            evaluated = obj.evaluated_get(graph)
            displacement = max(displacement, max((v.co-old).length for v,old in zip(evaluated.data.vertices,coords)))
        if displacement <= 1e-5:
            raise WorkError('POSE_NO_DEFORMATION', 'Bone rotation did not deform any vertex')
    directory.mkdir(parents=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 16
    scene.cycles.device = 'CPU'
    scene.render.resolution_x = 640
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.world.color = (.15,.15,.15)
    for obj in scene.objects:
        if obj.type in {'LIGHT','CAMERA'}:
            obj.hide_render = True
    camera_data = bpy.data.cameras.new('CharacterToolCamera')
    camera = bpy.data.objects.new('CharacterToolCamera',camera_data)
    scene.collection.objects.link(camera)
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = radius*1.4
    scene.camera = camera
    for index, offset in enumerate([(2,-3,4),(-3,-1,2),(0,3,4)]):
        light_data = bpy.data.lights.new(f'CharacterToolLight{index}','AREA')
        light_data.energy = 350
        light_data.shape = 'DISK'
        light_data.size = radius*2
        light = bpy.data.objects.new(light_data.name,light_data)
        scene.collection.objects.link(light)
        light.location = center+Vector(offset)*radius
        light.rotation_euler = (center-light.location).to_track_quat('-Z','Y').to_euler()
    images = []
    for name, direction in [('front',(0,-1,0)),('side',(1,0,0)),('back',(0,1,0))]:
        camera.location = center+Vector(direction)*radius*4
        camera.rotation_euler = (center-camera.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath = str(directory / f'{name}.png')
        bpy.ops.render.render(write_still=True)
        images.append(scene.render.filepath)
    return {'images':images, 'maxVertexDisplacement':displacement, 'poseBone':request.get('pose-bone')}
