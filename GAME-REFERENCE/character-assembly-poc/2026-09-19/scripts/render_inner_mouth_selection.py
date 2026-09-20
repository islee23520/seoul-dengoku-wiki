# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Render colored cavity candidate on temporary cross sections."""
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
scene = bpy.data.scenes['Inner_Mouth_Selection_Review']
scene.render.engine = 'CYCLES'
scene.cycles.samples = 12
scene.cycles.use_denoising = True
scene.render.resolution_x = 900
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'Standard'
scene.world = bpy.data.worlds.new('CavityReviewWorld')
scene.world.color = (.2, .2, .2)
camdata = bpy.data.cameras.new('CavityCamera')
camera = bpy.data.objects.new('CavityCamera', camdata)
scene.collection.objects.link(camera)
scene.camera = camera
camdata.type = 'ORTHO'
camdata.ortho_scale = .48
for i, pos in enumerate([(1, -1, 1), (1, .6, .5)]):
    data = bpy.data.lights.new(f'CavityLight{i}', 'AREA')
    data.energy = 30
    data.size = 1
    obj = bpy.data.objects.new(data.name, data)
    scene.collection.objects.link(obj)
    obj.location = pos
    obj.rotation_euler = (Vector((0, -.15, .3)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
heads = [o for o in scene.objects if o.type == 'MESH']
output = ROOT / 'evidence/inner-mouth-selection'
output.mkdir(parents=True, exist_ok=True)
for head in heads:
    for other in heads:
        other.hide_render = other != head
    head.data = head.data.copy()
    bm = bmesh.new()
    bm.from_mesh(head.data)
    bmesh.ops.bisect_plane(bm, geom=list(bm.verts) + list(bm.edges) + list(bm.faces), dist=1e-7, plane_co=(0, 0, 0), plane_no=(1, 0, 0), clear_outer=True)
    bm.to_mesh(head.data)
    bm.free()
    center = Vector((0, -.15, .30))
    for label, direction in [('side', (1, 0, 0)), ('quarter', (1, -.7, .05))]:
        camera.location = center + Vector(direction)
        camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(output / f'{head.name}-{label}.png')
        bpy.ops.render.render(write_still=True, scene=scene.name)
print('INNER_MOUTH_SELECTION_RENDERED', flush=True)
