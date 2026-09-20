# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Locate actual UV collapses and half-tile leaks without modifying the mesh."""
import json
from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[1]
mesh = bpy.data.objects['Male_Base_Symmetric'].data
mesh.calc_loop_triangles()
uv = mesh.uv_layers['AtlasUV']
failures = []
for triangle in mesh.loop_triangles:
    a, b, c = [uv.data[i].uv for i in triangle.loops]
    area = abs((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x))/2
    if area <= 1e-14:
        polygon = mesh.polygons[triangle.polygon_index]
        failures.append({'triangle': triangle.index, 'polygon': polygon.index, 'area_3d': triangle.area, 'uv': [list(a), list(b), list(c)], 'corners': [{'vertex': i, 'position': list(mesh.vertices[i].co)} for i in polygon.vertices]})
halves = []
for side in [-1, 1]:
    faces = [p for p in mesh.polygons if side*sum(mesh.vertices[i].co.x for i in p.vertices)>0]
    values = [uv.data[l].uv.x for p in faces for l in p.loop_indices]
    halves.append({'side': side, 'faces': len(faces), 'u_range': [min(values), max(values)]})
report = {'collapsed': failures, 'halves': halves, 'source_changed': False}
(ROOT/'reports/uv-failure-details.json').write_text(json.dumps(report,indent=2))
print('UV_FAILURE_DETAILS_READY', flush=True)
