# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Place linked eye assets from measured open socket loops without changing head geometry."""
import json
from pathlib import Path

import bpy
import numpy as np
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
assert bpy.app.background
scene = bpy.data.scenes.new('Shared_Eyes_Fitted_Review')
if bpy.context.window:
    bpy.context.window.scene = scene
with bpy.data.libraries.load(str(ROOT / 'work/audit/imported-sources.blend'), link=False) as (source, target):
    target.objects = [name for name in source.objects if name.startswith(('SRC_06_', 'SRC_11_'))]
heads = target.objects
with bpy.data.libraries.load(str(ROOT / 'deliverables/shared-eye-master.blend'), link=False) as (source, target):
    target.objects = [name for name in source.objects if name in {'Eye_Core_Sclera_Iris_Pupil', 'Eye_Cornea_Lens'}]
masters = target.objects
loops = json.loads((ROOT / 'reports/eye-socket-loops.json').read_text())
clay = bpy.data.materials.new('SocketReview_Skin')
clay.use_nodes = True
shader = clay.node_tree.nodes['Principled BSDF']
shader.inputs['Base Color'].default_value = (.49, .32, .22, 1)
shader.inputs['Roughness'].default_value = .72
rows = []
for head in heads:
    gender = 'Male' if head.name.startswith('SRC_06_') else 'Female'
    factor = .2827375423 if gender == 'Male' else .2877734499
    transform = Matrix.Scale(factor, 4) @ head.matrix_basis.copy()
    original_vertices = len(head.data.vertices)
    head.data = head.data.copy()
    head.data.transform(transform)
    head.matrix_world = Matrix.Identity(4)
    head.name = gender + '_Head_EyeFit_Review'
    scene.collection.objects.link(head)
    head.data.materials.clear()
    head.data.materials.append(clay)
    head['source_geometry_changed'] = False
    source_loops = next(row['eyes'] for row in loops if ('SRC_06_' if gender == 'Male' else 'SRC_11_') in row['source'])
    for side_index, loop in enumerate(source_loops):
        points = np.array(loop['points'])
        fit = np.linalg.lstsq(np.c_[2 * points, np.ones(len(points))], np.sum(points * points, axis=1), rcond=None)[0]
        center = fit[:3]
        radius = float(np.sqrt(fit[3] + np.sum(center ** 2)))
        distances = np.linalg.norm(points - center, axis=1)
        # Include the whole lid rim rather than leaving a gap at its outer corners.
        cover_radius = max(radius, float(np.quantile(distances, .96)))
        pivot = bpy.data.objects.new(f'{gender}_Eye_{side_index + 1}_Pivot', None)
        scene.collection.objects.link(pivot)
        pivot.location = Vector(center * factor)
        pivot.scale = (cover_radius * factor / .012,) * 3
        pivot.empty_display_size = .015
        for master in masters:
            obj = master.copy()
            obj.data = master.data
            obj.name = f'{gender}_Eye_{side_index + 1}_' + ('Core' if 'Core' in master.name else 'Cornea')
            obj.parent = pivot
            obj.matrix_parent_inverse = Matrix.Identity(4)
            obj.location = (0, 0, 0)
            obj.rotation_euler = (0, 0, 0)
            obj.scale = (1, 1, 1)
            scene.collection.objects.link(obj)
        rows.append({'gender': gender, 'side': side_index + 1, 'source_loop_vertices': loop['count'], 'center_m': list(pivot.location), 'eyeball_diameter_m': cover_radius * factor * 2, 'radius_fit_rms_m': float(np.sqrt(np.mean((distances - radius) ** 2))) * factor, 'mesh_linked_to_common_master': True, 'head_vertices_unchanged': len(head.data.vertices) == original_vertices, 'status': 'GEOMETRIC_FIT_REQUIRES_VISUAL_REVIEW'})
for master in masters:
    bpy.data.objects.remove(master, do_unlink=True)
scene.unit_settings.system = 'METRIC'
scene.view_layers[0].update()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/shared-eyes-fitted-review.blend'))
(ROOT / 'reports/shared-eyes-fit.json').write_text(json.dumps(rows, indent=2))
print('SHARED_EYES_FITTED_REVIEW_SAVED', flush=True)
