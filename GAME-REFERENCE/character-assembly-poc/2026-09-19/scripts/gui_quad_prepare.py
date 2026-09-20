# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Prepare editable FBX quad sources inside a dedicated live-GUI scene."""
import json
import sys
from pathlib import Path
import bmesh
import bpy
from mathutils import Matrix, Quaternion, Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import components, split_component

scene = bpy.data.scenes.new('Quad_Retopology_Work')
bpy.context.window.scene = scene
scene.unit_settings.system = 'METRIC'
rows = []
for source_index, label in [(6, 'Male_Head'), (8, 'Female_Body'), (9, 'Male_Body'), (11, 'Female_Head')]:
    source = next(o for o in bpy.data.objects if o.name.startswith(f'SRC_{source_index:02d}_') and o.type == 'MESH')
    temp = source.copy()
    temp.data = source.data.copy()
    scene.collection.objects.link(temp)
    temp.data.transform(temp.matrix_world)
    temp.matrix_world = Matrix.Identity(4)
    bm = bmesh.new()
    bm.from_mesh(temp.data)
    bm.verts.ensure_lookup_table()
    parts = components(bm)
    for index, part in enumerate(parts):
        name = label + ('_Skin' if index == 0 else f'_Part_{index:02d}')
        obj = split_component(temp, {v.index for v in part}, name)
        if len(obj.data.polygons) == 0:
            raise RuntimeError(f'Empty extracted source: {name}')
        obj['source_file_index'] = source_index
        obj['source_component_index'] = index
        obj.color = (0.66, 0.48, 0.34, 1) if label.startswith('Male') else (0.76, 0.58, 0.43, 1)
        rows.append({'name': obj.name, 'vertices': len(obj.data.vertices), 'faces': len(obj.data.polygons), 'quads': sum(len(p.vertices) == 4 for p in obj.data.polygons)})
    bm.free()
    bpy.data.objects.remove(temp, do_unlink=True)
for obj in scene.objects:
    obj.hide_set(True)
    obj.select_set(False)
male = bpy.data.objects['Male_Head_Skin']
male.hide_set(False)
male.select_set(True)
bpy.context.view_layer.objects.active = male
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        space = area.spaces.active
        space.shading.type = 'SOLID'
        space.shading.color_type = 'OBJECT'
        space.overlay.show_floor = False
        space.overlay.show_axis_x = False
        space.overlay.show_axis_y = False
        space.overlay.show_face_orientation = True
        space.region_3d.view_rotation = Quaternion((1, 0, 0), 1.5707963267948966)
        space.region_3d.view_location = Vector((0, 0, 0.5))
        space.region_3d.view_distance = 1.7
        space.region_3d.view_perspective = 'ORTHO'
(ROOT / 'reports/quad-source-baseline.json').write_text(json.dumps(rows, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/quad-source-working.blend'))
print('QUAD_SOURCES_READY', flush=True)
