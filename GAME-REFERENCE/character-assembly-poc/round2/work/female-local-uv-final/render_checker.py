"""World-framed before/after evidence, without saving QA scene changes."""
from __future__ import annotations

import hashlib
import json
import math
import sys
from pathlib import Path

import numpy as np

bpy = __import__('bpy')
Vector = __import__('mathutils').Vector
HERE = Path(__file__).resolve().parent
NAME = 'Female_Base_Composed_Candidate'


def main() -> None:
    stage = sys.argv[sys.argv.index('--')+1]
    source = HERE.parent/'female-defective-charts/female-defective-charts-candidate.blend' if stage == 'before' else HERE/'female-local-uv-final.blend'
    bpy.ops.wm.open_mainfile(filepath=str(source), load_ui=False)
    obj = bpy.data.objects[NAME]
    for item in bpy.context.scene.objects:
        item.hide_render = item != obj
    obj.hide_set(False)
    material = bpy.data.materials.new('QA_CHECKER_ONLY_NOT_SOURCE_COLOR')
    material.use_nodes = True
    nodes, links = material.node_tree.nodes, material.node_tree.links
    nodes.clear()
    out = nodes.new('ShaderNodeOutputMaterial')
    emit = nodes.new('ShaderNodeEmission')
    checker = nodes.new('ShaderNodeTexChecker')
    checker.inputs['Scale'].default_value = 64
    checker.inputs['Color1'].default_value = (.055,.055,.055,1)
    checker.inputs['Color2'].default_value = (.75,.75,.75,1)
    uv = nodes.new('ShaderNodeUVMap')
    uv.uv_map = 'AtlasUV'
    links.new(uv.outputs['UV'],checker.inputs['Vector'])
    links.new(checker.outputs['Color'],emit.inputs['Color'])
    links.new(emit.outputs[0],out.inputs['Surface'])
    obj.data.materials.clear()
    obj.data.materials.append(material)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.film_transparent = False
    scene.world.color = (.025,.025,.025)
    camera_data = bpy.data.cameras.new('QA_WORLD_FRAME')
    camera_data.type = 'ORTHO'
    camera = bpy.data.objects.new('QA_WORLD_FRAME',camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    points = np.asarray([(obj.matrix_world @ v.co)[:] for v in obj.data.vertices])
    lo,hi = points.min(0),points.max(0)
    height = hi[2]-lo[2]
    regions = [('front',points,0),('back',points,180),('side',points,90),('quarter',points,35),
               ('head-neck',points[(points[:,2]>hi[2]-.27*height) & (np.abs(points[:,0]-(lo[0]+hi[0])/2)<.12*height)],0),
               ('left-hand',points[points[:,0]<lo[0]+.13*(hi[0]-lo[0])],0),
               ('right-hand',points[points[:,0]>hi[0]-.13*(hi[0]-lo[0])],0),
               ('feet',points[points[:,2]<lo[2]+.15*height],35)]
    folder = HERE/'renders'/(stage+'-worldframed-v2')
    folder.mkdir(parents=True,exist_ok=True)
    records = []
    for name,pts,angle in regions:
        minimum,maximum = pts.min(0),pts.max(0)
        center = (minimum+maximum)/2
        rad = math.radians(angle)
        direction = np.asarray([math.sin(rad),-math.cos(rad),0.])
        right = np.asarray([math.cos(rad),math.sin(rad),0.])
        projected = pts @ right
        scale = max(float(projected.max()-projected.min()),float(maximum[2]-minimum[2]))*1.14
        camera.location = Vector(center+direction*height*3)
        camera.rotation_euler = (Vector(center)-camera.location).to_track_quat('-Z','Y').to_euler()
        camera_data.ortho_scale = scale
        camera_data.clip_start = .0001
        camera_data.clip_end = height*20
        path = folder/f'{name}.png'
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        records.append({'view':name,'source_world_bounds':[minimum.tolist(),maximum.tolist()],
                        'camera_world':list(camera.location),'center_world':center.tolist(),'ortho_scale':scale,
                        'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
        print(json.dumps({'event':'RENDERED','stage':stage,'view':name}),flush=True)
    (HERE/f'{stage}-render-receipt.json').write_text(json.dumps({'source':str(source),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'views':records},indent=2))


if __name__ == '__main__':
    main()
