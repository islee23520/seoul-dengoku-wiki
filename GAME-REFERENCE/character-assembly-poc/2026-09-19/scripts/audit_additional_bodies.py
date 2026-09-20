# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Inspect and render every newly copied body candidate in an isolated process."""
import hashlib
import json
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components

manifest = json.loads((ROOT / 'reports/additional-bodies-copy.json').read_text())
inputs = [Path(row['copy']) for row in manifest['files'] if row['name'].endswith('.glb')]
inputs += [Path(row['path']) for archive in manifest['archives'] for row in archive['members'] if row['path'].lower().endswith('.fbx')]
scene = bpy.context.scene
for obj in list(scene.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
rows, render_targets = [], []
for index, path in enumerate(inputs):
    existing = set(bpy.data.objects)
    if path.suffix.lower() == '.glb':
        bpy.ops.import_scene.gltf(filepath=str(path))
    else:
        bpy.ops.import_scene.fbx(filepath=str(path), use_image_search=True)
    bpy.context.view_layer.update()
    objects = list(set(bpy.data.objects) - existing)
    collection = bpy.data.collections.new(f'Additional_Source_{index:02d}')
    scene.collection.children.link(collection)
    record = {'index': index, 'source': str(path), 'format': path.suffix, 'objects': []}
    for obj in objects:
        for owner in list(obj.users_collection):
            owner.objects.unlink(obj)
        collection.objects.link(obj)
        obj.name = f'ADD_{index:02d}_{obj.name}'
        if obj.type != 'MESH':
            continue
        transform = obj.matrix_world.copy()
        obj.data.transform(transform)
        obj.matrix_world = Matrix.Identity(4)
        mesh = bmesh.new()
        mesh.from_mesh(obj.data)
        groups = boundary_groups(mesh)
        parts = components(mesh)
        bounds = {'min': [min(v.co[a] for v in mesh.verts) for a in range(3)], 'max': [max(v.co[a] for v in mesh.verts) for a in range(3)]}
        materials = []
        for material in obj.data.materials:
            material.use_fake_user = True
            materials.append({'name': material.name, 'images': [n.image.name for n in material.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image] if material.use_nodes else []})
        record['objects'].append({'name': obj.name, 'vertices': len(mesh.verts), 'faces': len(mesh.faces), 'quads': sum(len(f.verts) == 4 for f in mesh.faces), 'boundary_edges': sum(e.is_boundary for e in mesh.edges), 'junction_edges': sum(len(e.link_faces) > 2 for e in mesh.edges), 'winding_errors': sum(e.is_manifold and not e.is_contiguous for e in mesh.edges), 'degenerate_faces': sum(f.calc_area() < 1e-12 for f in mesh.faces), 'wire_edges': sum(e.is_wire for e in mesh.edges), 'components': [{'vertices': len(p), 'min': [min(v.co[a] for v in p) for a in range(3)], 'max': [max(v.co[a] for v in p) for a in range(3)]} for p in parts[:6]], 'component_count': len(parts), 'bounds': bounds, 'uv': [u.name for u in obj.data.uv_layers], 'materials': materials, 'boundary_groups': [{'edges': len(g), 'zmin': min(v.co.z for e in g for v in e.verts), 'zmax': max(v.co.z for e in g for v in e.verts)} for g in groups[:12]]})
        mesh.free()
    collection.hide_render = True
    collection.hide_viewport = True
    rows.append(record)
    if path.suffix.lower() == '.fbx':
        render_targets.append((index, collection))
(ROOT / 'reports/additional-body-audit.json').write_text(json.dumps(rows, indent=2))
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/additional-bodies-inspected.blend'))
scene.render.engine = 'CYCLES'
scene.cycles.samples = 8
scene.cycles.use_denoising = True
scene.render.resolution_x = 650
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'Standard'
scene.world.color = (.3, .3, .3)
cam = bpy.data.objects.new('AuditCamera', bpy.data.cameras.new('AuditCamera'))
scene.collection.objects.link(cam)
scene.camera = cam
cam.data.type = 'ORTHO'
for i, pos in enumerate([(-3, -4, 5), (3, -2, 2), (0, 4, 3)]):
    light = bpy.data.objects.new(f'AuditLight{i}', bpy.data.lights.new(f'AuditLight{i}', 'AREA'))
    scene.collection.objects.link(light)
    light.location = pos
    light.data.energy = [300, 120, 180][i]
    light.data.size = 3
    light.rotation_euler = (Vector((0, 0, .5)) - light.location).to_track_quat('-Z', 'Y').to_euler()
out = ROOT / 'evidence/additional-bodies'
out.mkdir(parents=True, exist_ok=True)
for index, collection in render_targets:
    collection.hide_render = False
    collection.hide_viewport = False
    points = [v.co for o in collection.objects if o.type == 'MESH' for v in o.data.vertices]
    center = Vector(tuple((min(p[a] for p in points) + max(p[a] for p in points)) / 2 for a in range(3)))
    extent = max(max(p[a] for p in points) - min(p[a] for p in points) for a in range(3))
    cam.data.ortho_scale = extent * 1.38
    for label, offset in [('front', (0, -4, 0)), ('side', (4, 0, 0)), ('back', (0, 4, 0))]:
        cam.location = center + Vector(offset)
        cam.rotation_euler = (center - cam.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(out / f'body-{index:02d}-{label}.png')
        bpy.ops.render.render(write_still=True)
    collection.hide_render = True
    collection.hide_viewport = True
print('ADDITIONAL_BODY_AUDIT_COMPLETE', len(rows), flush=True)
