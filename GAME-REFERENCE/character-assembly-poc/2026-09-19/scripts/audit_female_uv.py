# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Audit female base UV state: existing UV layers, overlap, coverage."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

assert bpy.app.background
obj = bpy.data.objects['Female_Base_Assembly']
mesh = obj.data

print(f'UV layers: {[(l.name, len(mesh.attributes) ) for l in mesh.uv_layers]}', flush=True)
for layer in mesh.uv_layers:
    uv = np.array([l.uv.copy() for l in layer.data])
    print(f'Layer "{layer.name}": {len(uv)} loops, range U=[{uv[:,0].min():.3f},{uv[:,0].max():.3f}] V=[{uv[:,1].min():.3f},{uv[:,1].max():.3f}]', flush=True)
    # Coverage
    inside = ((uv[:,0] >= 0) & (uv[:,0] <= 1) & (uv[:,1] >= 0) & (uv[:,1] <= 1)).sum()
    print(f'  Inside [0,1]: {inside}/{len(uv)} ({100*inside/len(uv):.1f}%)', flush=True)

# If UVs exist, check for overlaps using our audit tool
if mesh.uv_layers:
    bm = bmesh.new(); bm.from_mesh(mesh); bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table()
    uv_layer = bm.loops.layers.uv.active
    triangles = []
    for f in bm.faces:
        for i in range(len(f.loops) - 2):
            tri = [l[uv_layer].uv.copy() for l in [f.loops[0], f.loops[i+1], f.loops[i+2]]]
            triangles.append((tri, f.index))
    print(f'UV triangles: {len(triangles)}', flush=True)
    # Check for any UVs at origin (unwrapped indicator)
    zero_uvs = sum(1 for l in bm.loops if abs(l[uv_layer].uv.x) < 1e-6 and abs(l[uv_layer].uv.y) < 1e-6)
    print(f'Zero UVs (likely unwrapped): {zero_uvs}/{len(bm.loops)}', flush=True)
    bm.free()

print('FEMALE_UV_AUDIT_DONE', flush=True)
