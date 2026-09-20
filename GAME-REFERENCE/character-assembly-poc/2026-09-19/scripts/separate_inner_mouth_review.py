# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Partition candidate head surfaces without deleting or moving any source face."""
import json
from pathlib import Path

import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]
if bpy.data.scenes.get('Inner_Mouth_Selection_Review') is None:
    with bpy.data.libraries.load(str(ROOT / 'work/inner-mouth-selection-review.blend'), link=False) as (source_data, target_data):
        target_data.scenes = ['Inner_Mouth_Selection_Review']
scene = bpy.data.scenes.new('Inner_Mouth_Partition_Review')
reports = []
for source in bpy.data.scenes['Inner_Mouth_Selection_Review'].objects:
    gender = source.name.split('_')[0]
    bm = bmesh.new()
    bm.from_mesh(source.data)
    bm.faces.ensure_lookup_table()
    bm.faces.index_update()
    selected = {f for f in bm.faces if f.select}
    visited = set()
    remainder = []
    for start in bm.faces:
        if start in selected or start in visited:
            continue
        stack, part = [start], []
        visited.add(start)
        while stack:
            face = stack.pop()
            part.append(face)
            for edge in face.edges:
                for other in edge.link_faces:
                    if other not in selected and other not in visited:
                        visited.add(other)
                        stack.append(other)
        remainder.append(part)
    exterior = max(remainder, key=len)
    added = []
    for part in remainder:
        if part is exterior:
            continue
        # Fill only unselected islands surrounded by selected cavity faces.
        adjacent = {other for face in part for edge in face.edges for other in edge.link_faces if other not in part}
        if adjacent and adjacent.issubset(selected):
            selected.update(part)
            added.append(len(part))
    inner_ids = {f.index for f in selected}
    total_faces = len(bm.faces)
    bm.free()
    roles = []
    for role, keep_inner in [('InnerMouth', True), ('HeadExterior', False)]:
        mesh = source.data.copy()
        edit = bmesh.new()
        edit.from_mesh(mesh)
        edit.faces.ensure_lookup_table()
        discard = [f for f in edit.faces if (f.index in inner_ids) != keep_inner]
        bmesh.ops.delete(edit, geom=discard, context='FACES_ONLY')
        bmesh.ops.delete(edit, geom=[e for e in edit.edges if not e.link_faces], context='EDGES')
        bmesh.ops.delete(edit, geom=[v for v in edit.verts if not v.link_faces], context='VERTS')
        edit.to_mesh(mesh)
        edit.free()
        obj = bpy.data.objects.new(f'{gender}_{role}_PartitionReview', mesh)
        scene.collection.objects.link(obj)
        obj['role'] = role
        obj['source'] = source.name
        obj['status'] = 'PARTITION_REVIEW_NOT_FINAL_LIP_SEAM'
        for face in mesh.polygons:
            face.material_index = 1 if keep_inner else 0
        roles.append({'object': obj.name, 'faces': len(mesh.polygons), 'vertices': len(mesh.vertices)})
    assert sum(row['faces'] for row in roles) == total_faces
    reports.append({'gender': gender, 'source_faces': total_faces, 'partition_faces': roles, 'enclosed_islands_added': added, 'source_faces_deleted': 0, 'source_vertices_moved': 0, 'inner_source_face_ids': sorted(inner_ids), 'status': 'PARTITION_VALID_LIP_BOUNDARY_REVIEW_REQUIRED'})
output = ROOT / 'work/inner-mouth-partition-review-v2.blend'
assert not output.exists()
assert bpy.app.background, 'Run this save in an isolated Blender process'
if bpy.context.window:
    bpy.context.window.scene = scene
for view_layer in scene.view_layers:
    view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(output))
(ROOT / 'reports/inner-mouth-partition.json').write_text(json.dumps(reports, indent=2))
print('INNER_MOUTH_PARTITION_CREATED', flush=True)
