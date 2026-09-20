# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Check degenerate faces from symmetrize seam and audit UV state."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components

assert bpy.app.background
obj = bpy.data.objects['Female_Base_Assembly']
mesh = obj.data
bm = bmesh.new(); bm.from_mesh(mesh); bm.normal_update()
bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table()

# 1. Degenerate face check
degens = [f for f in bm.faces if f.calc_area() < 1e-12]
print(f'Degenerate faces: {len(degens)}', flush=True)
for f in degens:
    c = f.calc_center_median()
    print(f'  face {f.index}: verts={len(f.verts)}, center=({c.x:.4f},{c.y:.4f},{c.z:.4f}), area={f.calc_area():.2e}', flush=True)
    for v in f.verts:
        print(f'    v{v.index}: ({v.co.x:.4f},{v.co.y:.4f},{v.co.z:.4f})', flush=True)

# 2. UV audit
print(f'\nUV layers: {[l.name for l in mesh.uv_layers]}', flush=True)
if mesh.uv_layers:
    layer = mesh.uv_layers.active
    uv = np.array([l.uv.copy() for l in layer.data])
    print(f'Active layer "{layer.name}": {len(uv)} loops', flush=True)
    print(f'  U range: [{uv[:,0].min():.3f}, {uv[:,0].max():.3f}]', flush=True)
    print(f'  V range: [{uv[:,1].min():.3f}, {uv[:,1].max():.3f}]', flush=True)
    inside = ((uv[:,0] >= 0) & (uv[:,0] <= 1) & (uv[:,1] >= 0) & (uv[:,1] <= 1)).sum()
    print(f'  Inside [0,1]: {inside}/{len(uv)} ({100*inside/len(uv):.1f}%)', flush=True)
    zero_uvs = sum(1 for u in uv if abs(u[0]) < 1e-6 and abs(u[1]) < 1e-6)
    print(f'  Zero UVs: {zero_uvs}/{len(uv)}', flush=True)
    
    # Sample UV distribution by body region
    if len(uv) > 0:
        uv_layer_bm = bm.loops.layers.uv.active
        regions = {'head': [], 'torso': [], 'limbs': []}
        for f in bm.faces:
            z_avg = sum(v.co.z for v in f.verts) / len(f.verts)
            if z_avg > 1.4:
                regions['head'].append(f)
            elif 0.7 < z_avg <= 1.4:
                regions['torso'].append(f)
            else:
                regions['limbs'].append(f)
        for rname, faces in regions.items():
            if faces:
                uvs_r = [l[uv_layer_bm].uv.copy() for f in faces for l in f.loops]
                uvs_r = np.array(uvs_r)
                print(f'  {rname}: {len(faces)} faces, U=[{uvs_r[:,0].min():.2f},{uvs_r[:,0].max():.2f}] V=[{uvs_r[:,1].min():.2f},{uvs_r[:,1].max():.2f}]', flush=True)
else:
    print('No UV layers - need full unwrap', flush=True)

bm.free()
print('FEMALE_UV_SEAM_AUDIT_DONE', flush=True)
