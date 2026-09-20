# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Validate inverse-model candidate geometry in native Blender, without scene edits."""
import json
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
data = np.load(ROOT / 'reports/sculpt-inverse-data.npz')
candidates = np.load(ROOT / 'reports/sculpt-inverse-candidates.npz')
before_positions = data['before_positions']
candidate_indices = candidates['indices']
candidate_sectors = candidates['sectors']
candidate_roi = candidates['roi']
candidate_displacements = [candidates[f'heldout_{sector}_displacement'] for sector in range(3)]
name = 'Male_Protected_Body_Neck_Trial'
scene_before = (bpy.context.scene.name, bpy.context.mode)
with bpy.data.libraries.load(str(ROOT / 'work/protected-body-neck-trial.blend'), link=False) as (source, target):
    target.objects = [name]
obj = target.objects[0]
mesh = obj.data
seam_indices = set(data['seam_face_indices'].tolist())
rows = []
try:
    for sector in range(3):
        coordinates = before_positions.copy()
        coordinates[candidate_indices] += candidate_displacements[sector]
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bm.verts.ensure_lookup_table()
        bm.faces.ensure_lookup_table()
        for vertex, position in zip(bm.verts, coordinates):
            vertex.co = position
        bm.normal_update()
        edges = [e for e in bm.edges if e.is_manifold and all(candidate_sectors[v.index] == sector for v in e.verts) and sum(f.index in seam_indices for f in e.link_faces) == 1]
        angles = np.degrees([e.calc_face_angle() for e in edges])
        evaluated = np.array([tuple(v.co) for v in bm.verts])
        rows.append({'heldout_sector': sector, 'native_seam_edges': len(edges), 'median_angle_deg': float(np.median(angles)), 'p90_angle_deg': float(np.quantile(angles, .9)), 'max_angle_deg': float(angles.max()), 'seam_winding_errors': sum(not e.is_contiguous for e in edges), 'float32_evaluation_max_difference_m': float(np.linalg.norm(evaluated - coordinates, axis=1).max()), 'outside_roi_move_m': float(np.linalg.norm((evaluated - before_positions)[~candidate_roi], axis=1).max())})
        bm.free()
finally:
    bpy.data.objects.remove(obj, do_unlink=True)
    if mesh.users == 0:
        bpy.data.meshes.remove(mesh)
assert scene_before == (bpy.context.scene.name, bpy.context.mode)
assert all(row['outside_roi_move_m'] == 0 for row in rows)
report = {'native_blender': bpy.app.version_string, 'scene_unchanged': True, 'candidate_applied_to_user_mesh': False, 'folds': rows}
(ROOT / 'reports/sculpt-inverse-native-validation.json').write_text(json.dumps(report, indent=2))
print('INVERSE_NATIVE_VALIDATION_COMPLETE', flush=True)
