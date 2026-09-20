# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Author a reusable eye with recessed iris/pupil and a separate corneal lens."""
import json
import math
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
assert bpy.data.collections.get('Eye_Master_Reusable') is None
scene = bpy.data.scenes.new('Shared_Eye_Asset')
scene.unit_settings.system = 'METRIC'
collection = bpy.data.collections.new('Eye_Master_Reusable')
scene.collection.children.link(collection)


def material(name, color, roughness):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = color
    shader.inputs['Roughness'].default_value = roughness
    mat.diffuse_color = color
    return mat, shader


sclera, shader = material('Eye_Sclera_Ivory', (.72, .70, .65, 1), .35)
shader.inputs['Subsurface Weight'].default_value = .035
iris, shader = material('Eye_Iris_Brown_Adjustable', (.20, .075, .018, 1), .42)
nodes, links = iris.node_tree.nodes, iris.node_tree.links
uv = nodes.new('ShaderNodeTexCoord')
separate = nodes.new('ShaderNodeSeparateXYZ')
links.new(uv.outputs['UV'], separate.inputs[0])
frequency = nodes.new('ShaderNodeMath')
frequency.operation = 'MULTIPLY'
frequency.inputs[1].default_value = 64 * 2 * math.pi
links.new(separate.outputs['X'], frequency.inputs[0])
sine = nodes.new('ShaderNodeMath')
sine.operation = 'SINE'
links.new(frequency.outputs[0], sine.inputs[0])
maprange = nodes.new('ShaderNodeMapRange')
maprange.inputs['From Min'].default_value = -1
maprange.inputs['From Max'].default_value = 1
links.new(sine.outputs[0], maprange.inputs['Value'])
palette = nodes.new('ShaderNodeValToRGB')
palette.color_ramp.elements[0].color = (.025, .009, .004, 1)
palette.color_ramp.elements[1].color = (.22, .09, .024, 1)
links.new(maprange.outputs['Result'], palette.inputs[0])
limbal = nodes.new('ShaderNodeValToRGB')
limbal.color_ramp.elements[0].position = .72
limbal.color_ramp.elements[0].color = (1, 1, 1, 1)
limbal.color_ramp.elements[1].position = 1
limbal.color_ramp.elements[1].color = (.11, .11, .11, 1)
links.new(separate.outputs['Y'], limbal.inputs[0])
mix = nodes.new('ShaderNodeMixRGB')
mix.blend_type = 'MULTIPLY'
mix.inputs[0].default_value = 1
links.new(palette.outputs[0], mix.inputs[1])
links.new(limbal.outputs[0], mix.inputs[2])
links.new(mix.outputs[0], shader.inputs['Base Color'])
pupil, _ = material('Eye_Pupil_Black', (.0003, .0003, .0003, 1), .6)
cornea, shader = material('Eye_Cornea_Clear_IOR_1_376', (1, 1, 1, 1), .035)
shader.inputs['Transmission Weight'].default_value = 1
shader.inputs['IOR'].default_value = 1.376


def lathe(name, rings, face_materials, materials, closed_ends=True):
    """Revolve ordered (radius,y) samples; poles use triangles, bands use quads."""
    segments = 64
    verts = []
    faces = []
    face_info = []
    for radius, y in rings:
        verts.extend((radius * math.cos(2 * math.pi * i / segments), y, radius * math.sin(2 * math.pi * i / segments)) for i in range(segments))
    for j in range(len(rings) - 1):
        for i in range(segments):
            faces.append((j * segments + i, j * segments + (i + 1) % segments, (j + 1) * segments + (i + 1) % segments, (j + 1) * segments + i))
            face_info.append((j, i, face_materials[j]))
    if closed_ends:
        for ring_index in [0, len(rings) - 1]:
            pole = len(verts)
            verts.append((0, rings[ring_index][1], 0))
            for i in range(segments):
                faces.append((pole, ring_index * segments + i, ring_index * segments + (i + 1) % segments))
                face_info.append((ring_index, i, face_materials[0 if ring_index == 0 else -1]))
    mesh = bpy.data.meshes.new(name + '_Mesh')
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    for mat in materials:
        mesh.materials.append(mat)
    uv_layer = mesh.uv_layers.new(name='EyeUV')
    for poly, (j, i, mat) in zip(mesh.polygons, face_info):
        poly.material_index = mat
        poly.use_smooth = True
        for corner, loop_index in enumerate(poly.loop_indices):
            vertex_index = mesh.loops[loop_index].vertex_index
            if vertex_index >= len(rings) * segments:
                coord = ((i + .5) / segments, 0 if j == 0 else 1)
            else:
                ring, angle = divmod(vertex_index, segments)
                u = angle / segments
                if i == segments - 1 and angle == 0:
                    u = 1
                if mat == 1:
                    v = (rings[ring][0] - .0025) / (.0062 - .0025)
                else:
                    v = ring / (len(rings) - 1)
                coord = (u, v)
            uv_layer.data[loop_index].uv = coord
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    if bm.calc_volume(signed=True) < 0:
        bmesh.ops.reverse_faces(bm, faces=list(bm.faces))
    assert all(e.is_manifold and e.is_contiguous for e in bm.edges)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    return obj


# Core runs from rear pole around the globe to the iris opening, then inward.
radius = .012
angle_start = math.pi - .025
angle_end = math.asin(.0062 / radius)
core_rings = [(radius * math.sin(angle_start + (angle_end - angle_start) * j / 24), -radius * math.cos(angle_start + (angle_end - angle_start) * j / 24)) for j in range(25)]
core_materials = [0] * 24
for j in range(1, 9):
    t = j / 8
    core_rings.append((.0062 * (1 - t) + .0025 * t, -.010273 - .00018 * math.sin(math.pi * t)))
    core_materials.append(1)
core_rings.extend([(.0025, -.00965), (.0002, -.00965)])
core_materials.extend([2, 2])
core = lathe('Eye_Core_Sclera_Iris_Pupil', core_rings, core_materials, [sclera, iris, pupil])
core['front_axis'] = '-Y'
core['diameter_m'] = .024
core['iris_diameter_m'] = .0124
core['pupil_diameter_m'] = .005
core['anatomy'] = 'Sclera globe, recessed radial iris, dark pupil recess; stylized reusable base'
outer = []
for j in range(13):
    r = .00015 + (.00628 - .00015) * j / 12
    y = -.01023 - .00245 * (1 - (r / .00628) ** 2)
    outer.append((r, y))
inner = [(r, y + .00016 * (1 - (r / .00628) ** 2) + .000035) for r, y in reversed(outer)]
lens = lathe('Eye_Cornea_Lens', outer + inner, [0] * (len(outer + inner) - 1), [cornea])
lens['front_axis'] = '-Y'
lens['purpose'] = 'Separate closed transparent cornea; no eyeball duplication'
anchor = bpy.data.objects.new('Eye_Master_Pivot', None)
collection.objects.link(anchor)
anchor.empty_display_type = 'PLAIN_AXES'
anchor.empty_display_size = .015
core.parent = anchor
lens.parent = anchor
anchor['usage'] = 'Duplicate linked core/lens per eye, rotate around globe center; fit only in working character copy'
for label, material_index in [('Sclera', 0), ('Iris', 1), ('Pupil', 2)]:
    group = core.vertex_groups.new(name=label)
    indices = sorted({vertex for polygon in core.data.polygons if polygon.material_index == material_index for vertex in polygon.vertices})
    group.add(indices, 1, 'REPLACE')
report = {'front_axis': '-Y', 'units': 'meters', 'diameter_m': .024, 'objects': [], 'user_scene_changed': False, 'fitted_to_characters': False, 'procedural_iris_requires_bake_for_engine_export': True}
for obj in [core, lens]:
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    report['objects'].append({'name': obj.name, 'vertices': len(bm.verts), 'faces': len(bm.faces), 'quads': sum(len(f.verts) == 4 for f in bm.faces), 'boundary_edges': sum(e.is_boundary for e in bm.edges), 'nonmanifold_edges': sum(not e.is_manifold for e in bm.edges), 'winding_errors': sum(e.is_manifold and not e.is_contiguous for e in bm.edges), 'signed_volume': bm.calc_volume(signed=True), 'materials': [m.name for m in obj.data.materials], 'uv': [u.name for u in obj.data.uv_layers]})
    bm.free()
(ROOT / 'reports/shared-eye-master.json').write_text(json.dumps(report, indent=2))
output = ROOT / 'work/shared-eye-master.blend'
assert not output.exists()
# Object-only library write avoids the known 5.2 new-scene library-write crash.
bpy.data.libraries.write(str(output), {anchor, core, lens}, fake_user=True)
print('SHARED_EYE_MASTER_CREATED', flush=True)
