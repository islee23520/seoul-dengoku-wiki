# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Repair source heads and unclothed bodies with explicitly preserved anatomical openings."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components
from quad_patch_repair import repair_patches

scene = bpy.data.scenes.new('Doll_Source_Repair_Review')
if bpy.context.window:
    bpy.context.window.scene = scene
originals = []
for filename, prefixes in [('work/audit/imported-sources.blend', ('SRC_06_', 'SRC_11_')), ('work/additional-bodies-inspected.blend', ('ADD_10_', 'ADD_15_'))]:
    with bpy.data.libraries.load(str(ROOT / filename), link=False) as (source, target):
        target.objects = [name for name in source.objects if name.startswith(prefixes)]
    originals.extend(target.objects)
rows = []
for original in originals:
    is_head = original.name.startswith('SRC_')
    gender = 'Male' if original.name.startswith(('SRC_06_', 'ADD_15_')) else 'Female'
    part = 'Head' if is_head else 'Body'
    obj = original.copy()
    obj.data = original.data.copy()
    obj.name = f'{gender}_{part}_DollRepair'
    obj.data.transform(original.matrix_basis)
    obj.matrix_world = Matrix.Identity(4)
    scene.collection.objects.link(obj)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    main = set(components(bm)[0])
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v not in main], context='VERTS')
    groups = boundary_groups(bm)
    preserved = []
    roles = []
    for group in groups:
        points = {v for e in group for v in e.verts}
        low, high = min(v.co.z for v in points), max(v.co.z for v in points)
        width = max(v.co.x for v in points) - min(v.co.x for v in points)
        role = None
        if is_head and len(group) > 30 and low > .43 and high < .67 and width > .1:
            role = 'eye'
        elif is_head and len(group) > 30 and high < .14 and width > .2:
            role = 'neck'
        elif not is_head and len(group) > 20 and low > .8 and width > .04:
            role = 'neck'
        if role:
            preserved.append({tuple(v.co) for v in points})
            roles.append({'role': role, 'vertices': len(points)})
    assert len(preserved) == (3 if is_head else 1), (obj.name, roles)
    before = {'vertices': len(bm.verts), 'faces': len(bm.faces), 'boundary_edges': sum(e.is_boundary for e in bm.edges), 'junctions': sum(len(e.link_faces) > 2 for e in bm.edges)}
    print('REPAIR_SOURCE_BEGIN', obj.name, before, flush=True)
    records = repair_patches(bm, preserved)
    after = {'vertices': len(bm.verts), 'faces': len(bm.faces), 'quads': sum(len(f.verts) == 4 for f in bm.faces), 'junctions': sum(len(e.link_faces) > 2 for e in bm.edges), 'winding_errors': sum(e.is_manifold and not e.is_contiguous for e in bm.edges), 'zero_area': sum(f.calc_area() < 1e-12 for f in bm.faces), 'remaining_boundaries': [len(g) for g in boundary_groups(bm)]}
    bm.to_mesh(obj.data)
    bm.free()
    for poly in obj.data.polygons:
        poly.use_smooth = True
    obj.data.normals_split_custom_set([(0, 0, 0)] * len(obj.data.loops))
    obj['source_object'] = original.name
    obj['repair_status'] = 'STRUCTURAL_PASS_VISUAL_REVIEW_REQUIRED'
    rows.append({'name': obj.name, 'source': original.name, 'before': before, 'after': after, 'protected_openings': roles, 'patches': records})
for original in originals:
    mesh = original.data
    bpy.data.objects.remove(original, do_unlink=True)
    if mesh.users == 0:
        bpy.data.meshes.remove(mesh)
(ROOT / 'reports/doll-source-repair.json').write_text(json.dumps(rows, indent=2))
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/doll-sources-repaired-review.blend'))
print('DOLL_SOURCES_REPAIRED_REVIEW', flush=True)
