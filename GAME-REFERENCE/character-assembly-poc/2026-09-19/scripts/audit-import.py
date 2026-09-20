# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run: Blender --background --factory-startup --python scripts/audit-import.py
"""Import the immutable source copies and measure raw mesh topology."""
import json
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

ROOT = Path('/Users/danny/Documents/Character-Assembly-POC/2026-09-19')
scene = bpy.context.scene
for original in list(scene.objects):
    bpy.data.objects.remove(original, do_unlink=True)
files = sorted((ROOT / 'sources/originals').glob('*.glb'))
files += sorted((ROOT / 'sources/extracted').rglob('*.fbx'))
report = []
for index, source in enumerate(files):
    previous = set(bpy.data.objects)
    if source.suffix == '.glb':
        bpy.ops.import_scene.gltf(filepath=str(source))
    else:
        bpy.ops.import_scene.fbx(filepath=str(source), use_image_search=True)
    imported = set(bpy.data.objects) - previous
    collection = bpy.data.collections.new(f'SOURCE_{index:02d}_{source.stem}')
    scene.collection.children.link(collection)
    objects = []
    for obj in imported:
        for parent_collection in list(obj.users_collection):
            parent_collection.objects.unlink(obj)
        collection.objects.link(obj)
        obj.name = f'SRC_{index:02d}_{obj.name}'
        if obj.type != 'MESH':
            continue
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bm.verts.ensure_lookup_table()
        seen = set()
        components = []
        for vertex in bm.verts:
            if vertex in seen:
                continue
            queue = [vertex]
            seen.add(vertex)
            part = []
            while queue:
                current = queue.pop()
                part.append(current)
                for edge in current.link_edges:
                    other = edge.other_vert(current)
                    if other not in seen:
                        seen.add(other)
                        queue.append(other)
            coordinates = [obj.matrix_world @ v.co for v in part]
            components.append({'vertices': len(part), 'min': [min(v[a] for v in coordinates) for a in range(3)], 'max': [max(v[a] for v in coordinates) for a in range(3)]})
        coordinates = [obj.matrix_world @ vertex.co for vertex in obj.data.vertices]
        materials = []
        for material in obj.data.materials:
            images = []
            if material and material.use_nodes:
                for node in material.node_tree.nodes:
                    if node.type == 'TEX_IMAGE' and node.image:
                        images.append({'name': node.image.name, 'path': node.image.filepath, 'size': list(node.image.size), 'packed': bool(node.image.packed_file)})
            materials.append({'name': material.name if material else None, 'images': images})
        objects.append({'name': obj.name, 'vertices': len(bm.verts), 'faces': len(bm.faces), 'boundary_edges': sum(e.is_boundary for e in bm.edges), 'nonmanifold_edges': sum(not e.is_manifold for e in bm.edges), 'components': sorted(components, key=lambda c: c['vertices'], reverse=True), 'min': [min(v[a] for v in coordinates) for a in range(3)], 'max': [max(v[a] for v in coordinates) for a in range(3)], 'rotation': list(obj.rotation_euler), 'scale': list(obj.scale), 'uv': [u.name for u in obj.data.uv_layers], 'materials': materials})
        bm.free()
    report.append({'index': index, 'path': str(source), 'collection': collection.name, 'objects': objects})
    collection.hide_render = True
    collection.hide_viewport = True
(ROOT / 'work/audit').mkdir(parents=True, exist_ok=True)
(ROOT / 'reports/geometry-audit.json').write_text(json.dumps(report, indent=2))
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/audit/imported-sources.blend'))
print('AUDIT_IMPORT_PASS', len(report), flush=True)
