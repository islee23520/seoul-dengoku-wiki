# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Use native Blend Surface bridge on matched-density source borders."""
import json
import sys
from pathlib import Path
import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import select_only

source = bpy.data.objects['Male_Matched_Density_Trial']
scene = bpy.data.scenes.new('Native_Surface_Bridge_Comparison')
bpy.context.window.scene = scene
obj = source.copy()
obj.data = source.data.copy()
obj.name = 'Male_Native_Surface_Bridge_Trial'
scene.collection.objects.link(obj)
obj.hide_set(False)
bm = bmesh.new()
bm.from_mesh(obj.data)
tag = bm.faces.layers.int['MatchedNeckPatch']
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f[tag]], context='FACES_ONLY')
bmesh.ops.delete(bm, geom=[e for e in bm.edges if not e.link_faces], context='EDGES')
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
endpoint = bm.verts.layers.int['MatchedEndpoint']
for f in bm.faces:
    f.select = False
for e in bm.edges:
    e.select = False
for v in bm.verts:
    v.select = False
edges = [e for e in bm.edges if e.is_boundary and all(v[endpoint] in (1, 2) for v in e.verts)]
assert len(edges) == 128
for e in edges:
    e.select_set(True)
bm.to_mesh(obj.data)
bm.free()
select_only(obj)
bpy.context.tool_settings.mesh_select_mode = (False, True, False)
bpy.ops.object.mode_set(mode='EDIT')
status = bpy.ops.mesh.bridge_edge_loops(type='SINGLE', number_cuts=5, interpolation='SURFACE', smoothness=0.45, twist_offset=0)
assert status == {'FINISHED'}
bpy.ops.object.mode_set(mode='OBJECT')
bm = bmesh.new()
bm.from_mesh(obj.data)
report = {'native_operator': 'mesh.bridge_edge_loops', 'interpolation': 'SURFACE', 'smoothness': 0.45, 'faces': len(bm.faces), 'selected_faces': sum(f.select for f in bm.faces), 'status': 'VISUAL_REVIEW_REQUIRED'}
bm.free()
obj.data.normals_split_custom_set([(0, 0, 0)] * len(obj.data.loops))
for f in obj.data.polygons:
    f.use_smooth = True
(ROOT / 'reports/native-bridge-trial.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/native-surface-bridge-trial.blend'))
print('NATIVE_BRIDGE_TRIAL_CREATED', flush=True)
