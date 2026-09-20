# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Compare native stored quad tessellation with Blender unwrap's internal tessellation."""
import json
from pathlib import Path

import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
obj = bpy.data.objects['Male_Base_Symmetric']
mesh = obj.data
mesh.calc_loop_triangles()
uv = mesh.uv_layers['AtlasUV']
layer = mesh.attributes['AnatomicalUVRegion']
rows = []
for tri in mesh.loop_triangles:
    p = np.array([tuple(uv.data[index].uv) for index in tri.loops])
    area = ((p[1,0]-p[0,0])*(p[2,1]-p[0,1])-(p[1,1]-p[0,1])*(p[2,0]-p[0,0]))/2
    if area < 0:
        polygon = mesh.polygons[tri.polygon_index]
        rows.append({'triangle': tri.index, 'polygon': polygon.index, 'region': layer.data[polygon.index].value, 'corners': len(polygon.vertices), 'signed_area': area, 'center': list(polygon.center), 'uv': [list(uv.data[index].uv) for index in polygon.loop_indices], 'xyz': [list(mesh.vertices[index].co) for index in polygon.vertices]})
np.savez_compressed(ROOT/'reports/anatomical-face-regions.npz', regions=np.array([layer.data[p.index].value for p in mesh.polygons]))
(ROOT/'reports/anatomical-uv-flips.json').write_text(json.dumps(rows,indent=2))
print('ANATOMICAL_UV_FLIP_PROBE',len(rows),flush=True)
