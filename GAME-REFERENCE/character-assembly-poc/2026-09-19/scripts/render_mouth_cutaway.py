# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Read-only anatomical cutaway renders on disposable head copies."""
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
scene = bpy.context.scene
for collection in bpy.data.collections:
    collection.hide_render = True
scene.render.engine = 'CYCLES'
scene.cycles.samples = 16
scene.cycles.use_denoising = True
scene.render.resolution_x = 1000
scene.render.resolution_y = 850
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'Standard'
scene.world.color = (.3, .3, .3)
camera_data = bpy.data.cameras.new('CutawayCamera')
camera = bpy.data.objects.new('CutawayCamera', camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.type = 'ORTHO'
camera_data.ortho_scale = .46
for index, location in enumerate([(1, -1, 1), (1, 1, .5)]):
    data = bpy.data.lights.new(f'CutawayLight{index}', 'AREA')
    data.energy = 60
    data.size = 1.2
    obj = bpy.data.objects.new(data.name, data)
    scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector((0, -.15, .3)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
material = bpy.data.materials.new('CutawayClay')
material.use_nodes = True
material.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.45, .32, .24, 1)
material.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .85
output = ROOT / 'evidence/mouth-cutaway'
output.mkdir(parents=True, exist_ok=True)
for gender, prefix in [('Male', 'SRC_06_'), ('Female', 'SRC_11_')]:
    source = next(o for o in bpy.data.objects if o.name.startswith(prefix) and o.type == 'MESH')
    obj = source.copy()
    obj.data = source.data.copy()
    transform = source.matrix_basis.copy()
    obj.matrix_world = Matrix.Identity(4)
    obj.data.transform(transform)
    scene.collection.objects.link(obj)
    obj.hide_render = False
    obj.data.materials.clear()
    obj.data.materials.append(material)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.bisect_plane(bm, geom=list(bm.verts) + list(bm.edges) + list(bm.faces), dist=1e-7, plane_co=(0, 0, 0), plane_no=(1, 0, 0), clear_outer=True)
    bm.to_mesh(obj.data)
    bm.free()
    center = Vector((0, -.15, .3))
    for label, direction in [('side', (1, 0, 0)), ('front-quarter', (1, -.65, .05))]:
        camera.location = center + Vector(direction)
        camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(output / f'{gender}-{label}.png')
        bpy.ops.render.render(write_still=True)
    mesh = obj.data
    bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.meshes.remove(mesh)
print('MOUTH_CUTAWAY_RENDER_COMPLETE', flush=True)
