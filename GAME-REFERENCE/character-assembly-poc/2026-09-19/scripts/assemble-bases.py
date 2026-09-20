# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run: Blender --background work/patched-parts.blend --python scripts/assemble-bases.py
"""Fit head/body necks and create continuous skin topology at adult scale."""
import json
import math
import sys
from pathlib import Path
import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = Path('/Users/danny/Documents/Character-Assembly-POC/2026-09-19')
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components, select_only


def cut_neck(obj: bpy.types.Object, plane: float, keep_above: bool) -> Vector:
    """Cut off the existing irregular neck rim and return its center."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    geometry = list(bm.verts) + list(bm.edges) + list(bm.faces)
    if not keep_above:
        neck_faces = [f for f in bm.faces if all(abs(v.co.x) < 0.09 for v in f.verts)]
        neck_edges = {e for f in neck_faces for e in f.edges}
        neck_vertices = {v for f in neck_faces for v in f.verts}
        geometry = list(neck_vertices) + list(neck_edges) + neck_faces
    bmesh.ops.bisect_plane(bm, geom=geometry, dist=1e-7, plane_co=(0, 0, plane), plane_no=(0, 0, 1), clear_inner=keep_above, clear_outer=not keep_above)
    ring = [v for v in bm.verts if v.is_boundary and abs(v.co.z - plane) < 1e-5 and (keep_above or abs(v.co.x) < 0.09)]
    assert len(ring) > 10, (obj.name, len(ring))
    center = sum((v.co for v in ring), Vector()) / len(ring)
    center.x = 0
    bm.to_mesh(obj.data)
    bm.free()
    return center


report = []
for gender, head_scale, head_cut, body_cut, target in [('Male', 0.17, 0.12, 0.81, 1.75), ('Female', 0.185, 0.085, 0.945, 1.65)]:
    head = bpy.data.objects[f'{gender}_Head_Skin']
    body = bpy.data.objects[f'{gender}_Body_Skin']
    head_center = cut_neck(head, head_cut, True)
    body_center = cut_neck(body, body_cut, False)
    gap = 0.012
    translation = body_center - head_center * head_scale + Vector((0, 0, gap))
    for obj in [o for o in bpy.context.scene.objects if o.name.startswith(f'{gender}_Head')]:
        obj.data.transform(Matrix.Translation(translation) @ Matrix.Scale(head_scale, 4))
    # Retain source texture UVs; the new ring gets an explicit cylindrical UV strip.
    select_only(body)
    head.select_set(True)
    bpy.ops.object.join()
    body.name = f'{gender}_Base'
    body.data.name = f'{gender}_BaseMesh'
    bm = bmesh.new()
    bm.from_mesh(body.data)
    neck_edges = [e for e in bm.edges if e.is_boundary and all(body_cut - 1e-5 <= v.co.z <= body_cut + gap + 1e-5 and abs(v.co.x) < 0.09 for v in e.verts)]
    assert len(neck_edges) > 20
    assert len([g for g in boundary_groups(bm) if set(g).issubset(set(neck_edges))]) == 2
    bridge = bmesh.ops.bridge_loops(bm, edges=neck_edges, use_pairs=True)
    assert bridge['faces'], gender
    assert max(e.calc_length() for f in bridge['faces'] for e in f.edges) < 0.08
    uv = bm.loops.layers.uv.active
    for face in bridge['faces']:
        face.material_index = 0
        for loop in face.loops:
            point = loop.vert.co
            loop[uv].uv = ((math.atan2(point.y - body_center.y, point.x) + math.pi) / (2 * math.pi), (point.z - body_cut) / gap)
    transition_vertices = [v for v in bm.verts if body_cut - 0.012 < v.co.z < body_cut + gap + 0.012 and abs(v.co.x) < 0.09]
    for iteration in range(4):
        bmesh.ops.smooth_vert(bm, verts=transition_vertices, factor=0.3, use_axis_x=True, use_axis_y=True, use_axis_z=False)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    skin_components = len(components(bm))
    assert skin_components == 1, (gender, skin_components)
    max_z = max(v.co.z for v in bm.verts)
    scale = target / max_z
    bm.to_mesh(body.data)
    bm.free()
    for obj in [o for o in bpy.context.scene.objects if o.name.startswith(gender + '_')]:
        obj.data.transform(Matrix.Scale(scale, 4))
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
        obj.data.normals_split_custom_set([(0.0, 0.0, 0.0)] * len(obj.data.loops))
        obj['assembly_forward'] = '-Y'
        obj['assembly_up'] = '+Z'
        obj['source_scale_to_meters'] = scale
    probe = bmesh.new()
    probe.from_mesh(body.data)
    report.append({'gender': gender, 'height_m': max(v.co.z for v in probe.verts), 'scale': scale, 'head_scale': head_scale, 'head_cut_source_z': head_cut, 'body_cut_source_z': body_cut, 'neck_bridge_faces': len(bridge['faces']), 'skin_components': skin_components, 'boundary_edges': sum(e.is_boundary for e in probe.edges), 'junctions': sum(len(e.link_faces) > 2 for e in probe.edges), 'boundary_groups': [len(g) for g in boundary_groups(probe)], 'rotation': list(body.rotation_euler), 'object_scale': list(body.scale)})
    probe.free()
    body['target_height_m'] = target
    body['neck_welded'] = True
bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.unit_settings.scale_length = 1.0
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/assembled-bases.blend'))
(ROOT / 'reports/assembly.json').write_text(json.dumps(report, indent=2))
print('ASSEMBLY_PASS', flush=True)
