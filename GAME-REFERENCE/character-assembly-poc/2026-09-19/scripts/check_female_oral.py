# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Check female head source for oral cavity / mouth interior geometry."""
import bpy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
assert bpy.app.background

bpy.ops.wm.read_homefile(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'sources/originals/stylized doll head 3d model.glb'))
objs = [o for o in bpy.data.objects if o.type == 'MESH']
print(f'Meshes: {[o.name for o in objs]}', flush=True)
for obj in objs:
    mesh = obj.data
    print(f'{obj.name}: {len(mesh.vertices)}v/{len(mesh.polygons)}f', flush=True)
    # Check for interior geometry (faces pointing inward near mouth area)
    import numpy as np
    verts = np.array([v.co for v in mesh.vertices])
    z_min, z_max = verts[:,2].min(), verts[:,2].max()
    print(f'  Z range: [{z_min:.3f}, {z_max:.3f}]', flush=True)
    print(f'  X range: [{verts[:,0].min():.3f}, {verts[:,0].max():.3f}]', flush=True)
    print(f'  Y range: [{verts[:,1].min():.3f}, {verts[:,1].max():.3f}]', flush=True)
    # Mouth area: check for vertices in the mouth region (front lower face)
    # Assuming Y is forward, mouth is at front (positive Y), low Z
    if verts[:,1].max() > 0:  # Y forward
        mouth_region = verts[(verts[:,2] < z_min + (z_max-z_min)*0.4) & (verts[:,1] > verts[:,1].max()*0.5)]
        print(f'  Mouth region candidates: {len(mouth_region)} verts', flush=True)
    # Check normals: interior faces have normals pointing toward head center
    head_center = verts.mean(axis=0)
    inward_count = 0
    for p in mesh.polygons[:10000]:
        center = np.array([mesh.vertices[i].co for i in p.vertices]).mean(axis=0)
        normal = np.array(p.normal)
        to_center = head_center - center
        if np.dot(normal, to_center) > 0:
            inward_count += 1
    print(f'  Inward-facing (sampled): {inward_count}/10000', flush=True)

print('ORAL_CHECK_DONE', flush=True)
