# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Bake source material color to corner attributes and export patch-only repair data."""
import hashlib
import json
from pathlib import Path

import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
obj = bpy.data.objects['Male_Base_Symmetric']
mesh = obj.data
scene = bpy.context.scene
positions = np.empty(len(mesh.vertices) * 3, np.float32)
mesh.vertices.foreach_get('co', positions)
position_hash = hashlib.sha256(positions.tobytes()).hexdigest()
loop_vertices = np.empty(len(mesh.loops), np.int32)
mesh.loops.foreach_get('vertex_index', loop_vertices)
starts = np.empty(len(mesh.polygons), np.int32)
sizes = np.empty(len(mesh.polygons), np.int32)
materials = np.empty(len(mesh.polygons), np.int32)
mesh.polygons.foreach_get('loop_start', starts)
mesh.polygons.foreach_get('loop_total', sizes)
mesh.polygons.foreach_get('material_index', materials)
source_slots = list(mesh.materials)
for index, source in enumerate(source_slots):
    material = source.copy()
    nodes, links = material.node_tree.nodes, material.node_tree.links
    shader = next(node for node in nodes if node.type == 'BSDF_PRINCIPLED')
    emission = nodes.new('ShaderNodeEmission')
    color = shader.inputs['Base Color']
    if color.is_linked:
        links.new(color.links[0].from_socket, emission.inputs['Color'])
    else:
        emission.inputs['Color'].default_value = color.default_value
    output = next(node for node in nodes if node.type == 'OUTPUT_MATERIAL')
    links.new(emission.outputs[0], output.inputs['Surface'])
    mesh.materials[index] = material
attribute = mesh.color_attributes.new(name='OriginalSurfaceColor', type='FLOAT_COLOR', domain='CORNER')
mesh.color_attributes.active_color = attribute
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
scene.render.engine = 'CYCLES'
scene.cycles.samples = 1
scene.render.bake.target = 'VERTEX_COLORS'
scene.render.bake.use_selected_to_active = False
for layer in scene.view_layers:
    layer.material_override = None
assert bpy.ops.object.bake(type='EMIT') == {'FINISHED'}
attribute = mesh.color_attributes['OriginalSurfaceColor']
colors = np.empty(len(mesh.loops) * 4, np.float32)
attribute.data.foreach_get('color', colors)
assert np.isfinite(colors).all()
for index, source in enumerate(source_slots):
    mesh.materials[index] = source
tag_data = {}
for name in ['VerifiedQuadRepair', 'CenterQuadRepair', 'ProtectedEndpoint']:
    attribute = mesh.attributes.get(name)
    if attribute:
        values = np.empty(len(attribute.data), np.int32)
        attribute.data.foreach_get('value', values)
        tag_data[name] = values
edges = np.empty(len(mesh.edges) * 2, np.int32)
mesh.edges.foreach_get('vertices', edges)
groups = np.zeros(len(mesh.vertices), np.float32)
seam = obj.vertex_groups.get('SeamRelax_Only')
if seam:
    for vertex in mesh.vertices:
        groups[vertex.index] = next((g.weight for g in vertex.groups if g.group == seam.index), 0)
np.savez_compressed(ROOT / 'reports/surface-color-repair-input.npz', positions=positions.reshape(-1, 3), edges=edges.reshape(-1, 2), loop_vertices=loop_vertices, face_starts=starts, face_sizes=sizes, material_indices=materials, colors=colors.reshape(-1, 4), seam_weights=groups, **tag_data)
report = {'colors': len(colors) // 4, 'color_range_linear': [float(colors.reshape(-1, 4)[:, :3].min()), float(colors.reshape(-1, 4)[:, :3].max())], 'repair_faces': int(np.count_nonzero(tag_data.get('VerifiedQuadRepair', []))), 'center_faces': int(np.count_nonzero(tag_data.get('CenterQuadRepair', []))), 'seam_vertices': int(np.count_nonzero(groups)), 'geometry_hash': position_hash, 'status': 'SOURCE_COLOR_SAMPLED_ONLY'}
(ROOT / 'reports/surface-color-repair-input.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/male-surface-color-sampled.blend'))
print('SURFACE_COLOR_DATA_READY', flush=True)
