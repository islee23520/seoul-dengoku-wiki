# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Candidate continuous atlas using anatomical seam regions and native SLIM unwrap."""
import hashlib
import json
from collections import Counter
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
obj = bpy.data.objects['Male_Base_Symmetric']
mesh = obj.data
position_values = np.empty(len(mesh.vertices) * 3, np.float32)
mesh.vertices.foreach_get('co', position_values)
position_hash = hashlib.sha256(position_values.tobytes()).hexdigest()
source_uv = mesh.uv_layers[0]
source_uv.name = 'SourceUV'
source_values = np.empty(len(mesh.loops) * 2, np.float32)
source_uv.data.foreach_get('uv', source_values)
source_hash = hashlib.sha256(source_values.tobytes()).hexdigest()
if 'AtlasUV' in mesh.uv_layers:
    mesh.uv_layers.remove(mesh.uv_layers['AtlasUV'])
mesh.uv_layers.new(name='AtlasUV')
bm = bmesh.new()
bm.from_mesh(mesh)
labels = bm.faces.layers.int.new('AnatomicalUVRegion')
bm.faces.ensure_lookup_table()
bm.normal_update()
names = {}


def region(name):
    """Stable small region labels; these are measured coordinates for this mesh."""
    if name not in names:
        names[name] = len(names) + 1
    return names[name]


for face in bm.faces:
    p = face.calc_center_median()
    side = 'L' if p.x < 0 else 'R'
    if p.z > 1.6:
        if abs(p.x) > .079 and p.y > -.013 and p.z < 1.745:
            name = f'ear-{side}'
        elif p.y > .025:
            name = 'head-back'
        else:
            name = 'head-front'
    elif p.z > 1.49 and abs(p.x) < .13:
        name = 'neck'
    elif abs(p.x) > .72 and p.z > 1.1:
        name = f'hand-{side}-' + ('palm' if p.y < .066 else 'back')
    elif abs(p.x) > .29 and p.z > 1.1:
        name = f'arm-{side}-' + ('front' if p.y < .058 else 'back')
    elif p.z < .135:
        name = f'foot-{side}-' + ('sole' if p.z < .035 else 'top')
    elif p.z < .89:
        name = f'leg-{side}-' + ('front' if p.y < .03 else 'back')
    else:
        name = 'torso-' + ('front' if p.y < .015 else 'back')
    face[labels] = region(name)

# Fold tiny threshold slivers into their best-connected neighboring region;
# never cut each polygon into its own island as a way to pass overlap checks.
for pass_index in range(4):
    remaining = set(bm.faces)
    small = []
    while remaining:
        first = remaining.pop()
        stack, group = [first], {first}
        while stack:
            f = stack.pop()
            for e in f.edges:
                for other in e.link_faces:
                    if other in remaining and other[labels] == first[labels]:
                        remaining.remove(other)
                        group.add(other)
                        stack.append(other)
        if len(group) < 18:
            votes = Counter(other[labels] for f in group for e in f.edges for other in e.link_faces if other not in group)
            if votes:
                small.append((group, votes.most_common(1)[0][0]))
    if not small:
        break
    for group, label in small:
        for face in group:
            face[labels] = label
for edge in bm.edges:
    edge.seam = edge.is_boundary or len({f[labels] for f in edge.link_faces}) > 1
    # Open the cylindrical neck at its back center, without changing geometry.
    if all(f[labels] == names['neck'] for f in edge.link_faces) and len(edge.link_faces) == 2:
        centers = [f.calc_center_median() for f in edge.link_faces]
        if centers[0].x * centers[1].x < 0 and sum(v.co.y for v in edge.verts) > .02:
            edge.seam = True
region_counts = Counter(f[labels] for f in bm.faces)
seam_count = sum(e.seam for e in bm.edges)
bm.to_mesh(mesh)
bm.free()
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
mesh.uv_layers.active = mesh.uv_layers['AtlasUV']
bpy.context.tool_settings.use_uv_select_sync = True
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.unwrap(method='MINIMUM_STRETCH', no_flip=True, iterations=30, fill_holes=True, correct_aspect=True, margin_method='FRACTION', margin=.002)
bpy.ops.uv.average_islands_scale(scale_uv=False, shear=False)
bpy.ops.uv.pack_islands(rotate=True, scale=True, merge_overlap=False, margin_method='FRACTION', margin=.002, shape_method='CONCAVE')
bpy.ops.object.mode_set(mode='OBJECT')
uv = mesh.uv_layers['AtlasUV']
mesh.calc_loop_triangles()
triangle_uv = np.array([[tuple(uv.data[index].uv) for index in tri.loops] for tri in mesh.loop_triangles])
triangle_xyz = np.array([[tuple(mesh.vertices[index].co) for index in tri.vertices] for tri in mesh.loop_triangles])
first, second = triangle_uv[:, 1] - triangle_uv[:, 0], triangle_uv[:, 2] - triangle_uv[:, 0]
uv_area = abs(first[:, 0] * second[:, 1] - first[:, 1] * second[:, 0]) / 2
xyz_area = np.linalg.norm(np.cross(triangle_xyz[:, 1] - triangle_xyz[:, 0], triangle_xyz[:, 2] - triangle_xyz[:, 0]), axis=1) / 2
mesh.vertices.foreach_get('co', position_values)
mesh.uv_layers['SourceUV'].data.foreach_get('uv', source_values)
assert hashlib.sha256(position_values.tobytes()).hexdigest() == position_hash
assert hashlib.sha256(source_values.tobytes()).hexdigest() == source_hash
assert np.isfinite(triangle_uv).all()
for mat in mesh.materials:
    if mat and mat.use_nodes:
        node = mat.node_tree.nodes.new('ShaderNodeUVMap')
        node.uv_map = 'SourceUV'
        for texture in [n for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE']:
            mat.node_tree.links.new(node.outputs['UV'], texture.inputs['Vector'])
uv.active_render = True
np.savez_compressed(ROOT / 'reports/male-anatomical-uv-triangles.npz', triangles=triangle_uv, xyz=triangle_xyz, polygon_ids=np.array([t.polygon_index for t in mesh.loop_triangles]))
valid = (uv_area > 1e-14) & (xyz_area > 1e-12)
density = np.sqrt(uv_area[valid] / xyz_area[valid])
report = {'seam_edges': seam_count, 'regions': {name: region_counts[index] for name, index in names.items()}, 'geometry_preserved': True, 'source_uv_preserved': True, 'degenerate_uv_triangles': np.flatnonzero(uv_area <= 1e-14).tolist(), 'minimum_uv_area': float(uv_area.min()), 'texel_density_quantiles': np.quantile(density, [.05, .5, .95]).tolist(), 'status': 'ANATOMICAL_ATLAS_REQUIRES_OVERLAP_AND_CHECKER_QA'}
(ROOT / 'reports/male-anatomical-uv.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/male-base-anatomical-atlas-review.blend'))
print('ANATOMICAL_ATLAS_CREATED', len(report['degenerate_uv_triangles']), 'collapsed', flush=True)
