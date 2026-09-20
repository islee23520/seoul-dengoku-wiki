# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Classify cavity-visible source faces for review; never cut the source mesh."""
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import components

scene = bpy.data.scenes.new('Inner_Mouth_Selection_Review')
rows = []
with bpy.data.libraries.load(str(ROOT / 'work/audit/imported-sources.blend'), link=False) as (source, target):
    target.objects = [n for n in source.objects if n.startswith(('SRC_06_', 'SRC_11_'))]
for original in target.objects:
    gender = 'Male' if original.name.startswith('SRC_06_') else 'Female'
    mesh = original.data.copy()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.transform(original.matrix_basis)
    keep = set(components(bm)[0])
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v not in keep], context='VERTS')
    bm.faces.ensure_lookup_table()
    bm.faces.index_update()
    bm.normal_update()
    tree = BVHTree.FromBMesh(bm)
    origins = [Vector((x, y, z)) for x in [-.035, 0, .035] for y in [-.24, -.17] for z in ([.28, .32] if gender == 'Male' else [.29, .34])]
    hits = set()
    for origin in origins:
        for index in range(1024):
            z = 1 - 2 * (index + .5) / 1024
            angle = index * math.pi * (3 - math.sqrt(5))
            radius = math.sqrt(1 - z * z)
            direction = Vector((radius * math.cos(angle), radius * math.sin(angle), z))
            location, normal, face_index, distance = tree.ray_cast(origin, direction, .23)
            if face_index is None:
                continue
            # Restrict to the mouth envelope and surfaces whose front side faces
            # into the cavity; rays escaping the lips must not select outer skin.
            if abs(location.x) < .15 and .17 < location.z < .44 and -.36 < location.y < .04 and normal.dot(direction) < -.05:
                hits.add(face_index)
    for face in bm.faces:
        face.material_index = 1 if face.index in hits else 0
        face.select = face.index in hits
    records = [{'face': face.index, 'center': list(face.calc_center_median()), 'normal': list(face.normal)} for face in bm.faces if face.index in hits]
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(gender + '_InnerMouth_Candidate', mesh)
    scene.collection.objects.link(obj)
    mesh.materials.clear()
    for label, color in [('OuterClay', (.38, .3, .24, 1)), ('CavityCandidate', (.06, .55, .7, 1))]:
        material = bpy.data.materials.new(gender + '_' + label)
        material.use_nodes = True
        shader = material.node_tree.nodes['Principled BSDF']
        shader.inputs['Base Color'].default_value = color
        shader.inputs['Roughness'].default_value = .8
        mesh.materials.append(material)
    for polygon in mesh.polygons:
        polygon.material_index = 1 if polygon.select else 0
    rows.append({'gender': gender, 'candidate_faces': len(hits), 'total_faces': len(mesh.polygons), 'status': 'CAVITY_VISIBILITY_CANDIDATE_NOT_SEPARATED', 'faces': records})
    source_mesh = original.data
    bpy.data.objects.remove(original, do_unlink=True)
    if source_mesh.users == 0:
        bpy.data.meshes.remove(source_mesh)
output = ROOT / 'work/inner-mouth-selection-review.blend'
assert not output.exists()
bpy.data.libraries.write(str(output), {scene}, fake_user=True)
(ROOT / 'reports/inner-mouth-selection.json').write_text(json.dumps(rows, indent=2))
print('INNER_MOUTH_SELECTION_READY', [(r['gender'], r['candidate_faces']) for r in rows], flush=True)
