# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Recover intact original oral components without touching the user's active scene."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import components

active_before = (bpy.context.scene.name, bpy.context.mode)
scene = bpy.data.scenes.get('Oral_Surface_Assigned_Review')
if scene is None:
    scene = bpy.data.scenes.new('Oral_Surface_Assigned_Review')
assert len(scene.objects) == 0, 'Refusing to overwrite an existing oral review'
archive = ROOT / 'work/audit/imported-sources.blend'
with bpy.data.libraries.load(str(archive), link=False) as (source_data, target_data):
    target_data.objects = [name for name in source_data.objects if name.startswith(('SRC_06_', 'SRC_11_'))]
loaded_sources = target_data.objects
assert len(loaded_sources) == 2
rows = []
for gender, prefix in [('Male', 'SRC_06_'), ('Female', 'SRC_11_')]:
    source = next(o for o in loaded_sources if o.name.startswith(prefix) and o.type == 'MESH')
    bm = bmesh.new()
    bm.from_mesh(source.data)
    bm.verts.ensure_lookup_table()
    parts = components(bm)
    assert len(parts) == (24 if gender == 'Male' else 29)
    sets = [{v.index for v in part} for part in parts]
    centroids = [sum((source.matrix_basis @ v.co for v in part), Vector()) / len(part) for part in parts]
    grouped = {'UpperGum_WithTeeth': set(sets[1]), 'LowerGum_WithTeeth': set(sets[2]), 'Tongue': set(sets[3])}
    gum_surfaces = []
    for part in parts[1:3]:
        vertices = set(part)
        faces = {f for v in vertices for f in v.link_faces}
        indices = {v: index for index, v in enumerate(part)}
        gum_surfaces.append(BVHTree.FromPolygons([v.co for v in part], [[indices[v] for v in face.verts] for face in faces]))
    mapping = []
    for index in range(4, len(parts)):
        distances = [sorted(tree.find_nearest(v.co)[3] for v in parts[index]) for tree in gum_surfaces]
        sample_count = max(3, len(parts[index]) // 4)
        upper, lower = [sum(values[:sample_count]) / sample_count for values in distances]
        role = 'UpperGum_WithTeeth' if upper < lower else 'LowerGum_WithTeeth'
        grouped[role].update(sets[index])
        mapping.append({'component': index, 'role': role, 'centroid_source': list(centroids[index]), 'upper_surface_distance': upper, 'lower_surface_distance': lower, 'distance_margin': abs(upper - lower)})
    collection = bpy.data.collections.new(gender + '_Original_Oral_Review')
    scene.collection.children.link(collection)
    for role, keep in grouped.items():
        mesh = source.data.copy()
        edit = bmesh.new()
        edit.from_mesh(mesh)
        edit.verts.ensure_lookup_table()
        bmesh.ops.delete(edit, geom=[v for v in edit.verts if v.index not in keep], context='VERTS')
        assert len(edit.verts) == len(keep)
        edit.to_mesh(mesh)
        edit.free()
        mesh.transform(source.matrix_basis)
        obj = bpy.data.objects.new(gender + '_' + role + '_Review', mesh)
        collection.objects.link(obj)
        obj['source_object'] = source.name
        obj['role'] = role
        obj['status'] = 'ORIGINAL_GEOMETRY_VISUAL_AND_TOPOLOGY_REVIEW_REQUIRED'
        obj['source_geometry_preserved'] = True
        inspect = bmesh.new()
        inspect.from_mesh(mesh)
        rows.append({'object': obj.name, 'role': role, 'vertices': len(mesh.vertices), 'faces': len(mesh.polygons), 'quads': sum(len(p.vertices) == 4 for p in mesh.polygons), 'uv_layers': [u.name for u in mesh.uv_layers], 'boundaries': sum(e.is_boundary for e in inspect.edges), 'junctions': sum(len(e.link_faces) > 2 for e in inspect.edges), 'component_indices': [1 if role.startswith('Upper') else 2 if role.startswith('Lower') else 3] + [m['component'] for m in mapping if m['role'] == role]})
        inspect.free()
    bm.free()
    (ROOT / f'reports/{gender.lower()}-oral-surface-mapping.json').write_text(json.dumps(mapping, indent=2))
for source in loaded_sources:
    mesh = source.data
    bpy.data.objects.remove(source, do_unlink=True)
    if mesh.users == 0:
        bpy.data.meshes.remove(mesh)
assert active_before == (bpy.context.scene.name, bpy.context.mode)
output = ROOT / 'work/oral-surface-assigned-review.blend'
assert not output.exists()
bpy.data.libraries.write(str(output), {scene}, fake_user=True)
(ROOT / 'reports/oral-surface-assigned-review.json').write_text(json.dumps({'objects': rows, 'active_scene_unchanged': True, 'inner_mouth_status': 'Still integrated with head exterior; not yet separated', 'dental_assignment': 'Nearest gum surface, lower quartile mean; requires visual review', 'repair_applied': False}, indent=2))
print('ORAL_ORIGINAL_REVIEW_SAVED', len(rows), flush=True)
