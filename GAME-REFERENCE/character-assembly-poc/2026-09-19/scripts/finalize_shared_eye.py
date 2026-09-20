# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Remove pupil glare and provide finite, nondegenerate shading and export UVs."""
import json
import math
from pathlib import Path

import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]
material = bpy.data.materials['Eye_Pupil_Black']
shader = material.node_tree.nodes['Principled BSDF']
shader.inputs['Specular IOR Level'].default_value = 0
shader.inputs['Roughness'].default_value = 1
shader.inputs['Base Color'].default_value = (.00001, .00001, .00001, 1)
iris = bpy.data.materials['Eye_Iris_Brown_Adjustable']
for node in list(iris.node_tree.nodes):
    if node.type == 'TEX_COORD':
        uv_node = iris.node_tree.nodes.new('ShaderNodeUVMap')
        uv_node.uv_map = 'EyeUV'
        for link in list(node.outputs['UV'].links):
            iris.node_tree.links.new(uv_node.outputs['UV'], link.to_socket)
rows = []
for name in ['Eye_Core_Sclera_Iris_Pupil', 'Eye_Cornea_Lens']:
    obj = bpy.data.objects[name]
    mesh = obj.data
    source_uv = mesh.uv_layers['EyeUV']
    # Each pole has its own small UV fan; ring and pole no longer share a line.
    for polygon in mesh.polygons:
        if len(polygon.vertices) != 3:
            continue
        center_vertex = min(polygon.vertices, key=lambda index: mesh.vertices[index].co.x ** 2 + mesh.vertices[index].co.z ** 2)
        ring = [index for index in polygon.vertices if index != center_vertex]
        radius = max(math.hypot(mesh.vertices[index].co.x, mesh.vertices[index].co.z) for index in ring)
        for loop_index in polygon.loop_indices:
            vertex = mesh.vertices[mesh.loops[loop_index].vertex_index]
            if vertex.index == center_vertex:
                source_uv.data[loop_index].uv = (.5, .5)
            else:
                source_uv.data[loop_index].uv = (.5 + .4 * vertex.co.x / radius, .5 + .4 * vertex.co.z / radius)
    atlas = mesh.uv_layers.new(name='EyeAtlas')
    bands = 34 if name.startswith('Eye_Core') else 25
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            index = mesh.loops[loop_index].vertex_index
            p = mesh.vertices[index].co
            if len(polygon.vertices) == 4:
                ring, angle = divmod(index, 64)
                first_angle = mesh.loops[polygon.loop_start].vertex_index % 64
                u = angle / 64
                if first_angle == 63 and angle == 0:
                    u = 1
                atlas.data[loop_index].uv = (.02 + .96 * u, .24 + .74 * ring / bands)
            else:
                cy = polygon.center.y
                rear = cy > 0 if name.startswith('Eye_Core') else polygon.index < bands * 64 + 64
                center_u = .25 if rear else .75
                radius = max(math.hypot(mesh.vertices[v].co.x, mesh.vertices[v].co.z) for v in polygon.vertices)
                atlas.data[loop_index].uv = (center_u + .08 * p.x / radius, .11 + .08 * p.z / radius)
    mesh.uv_layers.active = source_uv
    source_uv.active_render = True
    mesh.calc_loop_triangles()
    uv_report = {}
    for layer in mesh.uv_layers:
        areas = []
        for triangle in mesh.loop_triangles:
            a, b, c = [layer.data[i].uv for i in triangle.loops]
            areas.append(abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) / 2)
        assert min(areas) > 1e-12, (name, layer.name)
        assert all(math.isfinite(value) for loop in layer.data for value in loop.uv)
        uv_report[layer.name] = {'zero_area_triangles': sum(a <= 1e-12 for a in areas), 'min_triangle_area': min(areas)}
    bm = bmesh.new()
    bm.from_mesh(mesh)
    assert all(e.is_manifold and e.is_contiguous for e in bm.edges)
    rows.append({'name': name, 'vertices': len(bm.verts), 'faces': len(bm.faces), 'boundaries': 0, 'winding_errors': 0, 'signed_volume': bm.calc_volume(signed=True), 'uv': uv_report, 'materials': [m.name for m in mesh.materials]})
    bm.free()
output = ROOT / 'deliverables/shared-eye-master.blend'
output.parent.mkdir(parents=True, exist_ok=True)
assert not output.exists()
objects = {bpy.data.objects[name] for name in ['Eye_Master_Pivot', 'Eye_Core_Sclera_Iris_Pupil', 'Eye_Cornea_Lens']}
bpy.data.libraries.write(str(output), objects, fake_user=True)
(ROOT / 'reports/shared-eye-validation.json').write_text(json.dumps({'objects': rows, 'axis': '-Y forward +Z up', 'diameter_m': .024, 'render_review_pending': True, 'fitted_to_heads': False}, indent=2))
print('SHARED_EYE_VALIDATED', flush=True)
