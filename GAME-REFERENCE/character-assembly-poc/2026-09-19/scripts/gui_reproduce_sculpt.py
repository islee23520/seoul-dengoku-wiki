# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Reproduce localized sculpt smoothing from the pre-owner baseline, not copied deltas."""
import json
from pathlib import Path

import bpy
from mathutils import Matrix, Quaternion, Vector

ROOT = Path(__file__).resolve().parents[1]
name = 'Male_Protected_Body_Neck_Trial'
with bpy.data.libraries.load(str(ROOT / 'work/protected-body-neck-trial.blend'), link=False) as (source, target):
    target.objects = [name]
obj = target.objects[0]
obj.name = 'Agent_Sculpt_Reproduction_From_Baseline'
scene = bpy.data.scenes.new('Agent_Sculpt_Reproduction')
bpy.context.window.scene = scene
scene.collection.objects.link(obj)
center = (min(v.co.x for v in obj.data.vertices) + max(v.co.x for v in obj.data.vertices)) / 2
obj.data.transform(Matrix.Translation((-center, 0, 0)))
obj.matrix_world = Matrix.Translation((center, 0, 0))
mask = obj.data.attributes.new('.sculpt_mask', 'FLOAT', 'POINT')
weights = []
for vertex in obj.data.vertices:
    p = vertex.co
    # Soft 3D brush-like envelope covers the neighboring neck rows. No coordinates
    # from the owner's sculpt are copied. Below 1.50 and above 1.63 remain fixed.
    lower = min(1.0, max(0.0, (p.z - 1.50) / 0.025))
    upper = min(1.0, max(0.0, (1.63 - p.z) / 0.025))
    radial = min(1.0, max(0.0, (0.085 - abs(p.x)) / 0.018))
    side = min(1.0, max(0.0, -p.x / 0.004))
    weights.append(lower * upper * radial * side)
mask.data.foreach_set('value', [1 - value for value in weights])
obj.hide_set(False)
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
obj.data.use_mirror_x = False
bpy.ops.object.mode_set(mode='SCULPT')
before = [v.co.copy() for v in obj.data.vertices]
area = next(a for a in bpy.context.screen.areas if a.type == 'VIEW_3D')
region = next(r for r in area.regions if r.type == 'WINDOW')
with bpy.context.temp_override(area=area, region=region):
    status = bpy.ops.sculpt.mesh_filter(type='SMOOTH', strength=0.5, iteration_count=6, deform_axis={'X', 'Y', 'Z'})
deltas = [(v.co - p).length for v, p in zip(obj.data.vertices, before)]
report = {'source': 'pre-owner baseline', 'owner_coordinates_copied': False, 'operator': sorted(status), 'filter': 'SMOOTH', 'strength': 0.5, 'iterations': 6, 'changed_vertices': sum(d > 1e-9 for d in deltas), 'max_delta_m': max(deltas), 'protected_max_delta_m': max(d for d, w in zip(deltas, weights) if w == 0), 'status': 'COMPARISON_REQUIRED'}
assert report['protected_max_delta_m'] == 0
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        s = area.spaces.active
        s.shading.type = 'SOLID'
        s.shading.color_type = 'OBJECT'
        s.overlay.sculpt_mode_mask_opacity = 0
        s.overlay.show_wireframes = False
        s.overlay.show_face_orientation = False
        s.show_region_ui = False
        s.region_3d.view_rotation = Quaternion((1, 0, 0), 1.5707963267948966)
        s.region_3d.view_location = Vector((-1.05, 0, 1.55))
        s.region_3d.view_distance = 0.70
        s.region_3d.view_perspective = 'ORTHO'
(ROOT / 'reports/agent-sculpt-reproduction.json').write_text(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/agent-sculpt-reproduction-pass1.blend'))
print('AGENT_SCULPT_REPRODUCTION_CREATED', flush=True)
