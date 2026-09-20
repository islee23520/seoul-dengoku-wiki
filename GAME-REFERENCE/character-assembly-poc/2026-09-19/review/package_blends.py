# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy"]
# ///
"""Package blends: pack external images, verify reopen, corrected UV audit, scene audit, render."""
import hashlib, json, sys
from pathlib import Path
import numpy as np

DST = Path("/Users/danny/workspace/seoul-kenshi-character-assembly-review/GAME-REFERENCE/character-assembly-poc/2026-09-19")
REVIEW = DST / 'review'
REVIEW.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(DST / 'scripts'))
from uv_overlap_audit import audit as uv_audit

import bpy
assert bpy.app.background

BLENDS = ['deliverables/final-integration.blend', 'deliverables/shared-eye-master.blend'] + [
    f'work/{n}.blend' for n in [
    'female-base-color-baked','female-base-symmetric','female-base-uv-v2','male-base-uv-retry',
    'male-base-patch-color-review','male-base-local-chart-atlas-review',
    'recovered-oral-final-contact-review','male-tongue-curvature-refined-review',
    'male-upper-molar-pair-crossing-repaired','inner-mouth-partition-review-v2',
    'oral-separated-verified','shared-eyes-fitted-review','female-head-oral-groups']]

def sha256(p):
    h = hashlib.sha256()
    with open(p,'rb') as f:
        for chunk in iter(lambda: f.read(1<<20), b''):
            h.update(chunk)
    return h.hexdigest()

def mesh_inventory():
    inv = {}
    for o in bpy.data.objects:
        if o.type == 'MESH':
            m = o.data
            inv[o.name] = {'verts': len(m.vertices), 'faces': len(m.polygons),
                           'quads': sum(1 for p in m.polygons if len(p.vertices)==4)}
    return inv

receipts = {}
for rel in BLENDS:
    src = DST / rel
    if not src.exists():
        receipts[rel] = {'status': 'MISSING'}; continue
    rec = {'src_sha256': sha256(src)}
    bpy.ops.wm.read_homefile(use_empty=True)
    bpy.ops.wm.open_mainfile(filepath=str(src))
    pre_inv = mesh_inventory()
    packed, failed, missing = [], [], []
    for img in bpy.data.images:
        if img.packed_file: continue
        if img.source == 'FILE' and img.filepath:
            try:
                img.pack()
                packed.append(img.name)
            except Exception as e:
                failed.append({'image': img.name, 'path': img.filepath, 'error': str(e)})
        elif img.source == 'FILE':
            missing.append({'image': img.name, 'reason': 'no filepath'})
    bpy.ops.wm.save_as_mainfile(filepath=str(src))
    rec.update({'packed_images': packed, 'pack_failures': failed, 'no_filepath_images': missing,
                'pre_inventory': pre_inv, 'dst_sha256': sha256(src)})
    bpy.ops.wm.read_homefile(use_empty=True)
    bpy.ops.wm.open_mainfile(filepath=str(src))
    post_inv = mesh_inventory()
    rec['reopen_inventory_equal'] = (pre_inv == post_inv)
    rec['post_inventory'] = post_inv
    rec['status'] = 'OK' if rec['reopen_inventory_equal'] else 'INVENTORY_MISMATCH'
    receipts[rel] = rec
    print('PACKED', rel, len(packed), 'imgs, fail', len(failed), flush=True)

# --- Scene audit of final-integration ---
bpy.ops.wm.read_homefile(use_empty=True)
bpy.ops.wm.open_mainfile(filepath=str(DST/'deliverables/final-integration.blend'))
scene = bpy.context.scene
objs_info = {}
for o in scene.objects:
    if o.type == 'MESH':
        m = o.data
        verts = np.array([list(o.matrix_world @ v.co) for v in m.vertices]) if len(m.vertices) else np.zeros((0,3))
        bounds = {'min': verts.min(axis=0).tolist(), 'max': verts.max(axis=0).tolist()} if len(verts) else None
        deg = sum(1 for p in m.polygons if p.area < 1e-12)
        objs_info[o.name] = {
            'verts': len(m.vertices), 'faces': len(m.polygons),
            'quads': sum(1 for p in m.polygons if len(p.vertices)==4),
            'degenerate_faces': deg,
            'world_bounds': bounds,
            'location': list(o.location), 'world_z_center': float(verts[:,2].mean()) if len(verts) else None,
        }
scene_audit = {
    'scene': 'final-integration.blend', 'objects': objs_info,
    'render_engine': scene.render.engine,
    'camera': scene.camera.name if scene.camera else None,
}
(REVIEW/'scene-audit.json').write_text(json.dumps(scene_audit, indent=2))

# --- Corrected UV audits ---
def corrected_uv_audit(obj_name, blend_rel):
    bpy.ops.wm.read_homefile(use_empty=True)
    bpy.ops.wm.open_mainfile(filepath=str(DST/blend_rel))
    obj = bpy.data.objects.get(obj_name)
    if obj is None:
        return {'status': 'OBJECT_NOT_FOUND'}
    import bmesh
    bm = bmesh.new(); bm.from_mesh(obj.data)
    uv_layer = bm.loops.layers.uv.active
    if uv_layer is None:
        bm.free(); return {'status': 'NO_UV_LAYER'}
    adj = set()
    for e in bm.edges:
        fs = tuple(sorted(f.index for f in e.link_faces))
        if len(fs) == 2: adj.add(fs)
    tris, face_map = [], []
    for f in bm.faces:
        for i in range(len(f.loops)-2):
            tri = np.array([list(l[uv_layer].uv) for l in [f.loops[0], f.loops[i+1], f.loops[i+2]]])
            tris.append(tri); face_map.append(f.index)
    bm.free()
    result = uv_audit(np.array(tris))
    raw = result.get('positive_area_overlap_pairs', [])
    non_adj = []
    for pair in raw:
        t = pair.get('triangles') if isinstance(pair, dict) else pair
        if t and len(t) == 2:
            f1, f2 = face_map[t[0]], face_map[t[1]]
            if (min(f1,f2), max(f1,f2)) not in adj:
                non_adj.append({'faces': [f1, f2], 'area': pair.get('area') if isinstance(pair, dict) else None})
    return {'mesh': obj_name, 'total_triangles': len(tris),
            'raw_overlap_pairs': len(raw),
            'non_adjacent_overlap_pairs': len(non_adj),
            'non_adjacent_sample': non_adj[:20],
            'degenerate_triangles': len(result.get('degenerate_triangle_ids', [])),
            'previous_claim_ok': (len(non_adj) == 0)}

female_uv = corrected_uv_audit('Female_Base_Assembly', 'work/female-base-uv-v2.blend')
male_uv = corrected_uv_audit('Male_Base_Symmetric', 'work/male-base-uv-retry.blend')
(REVIEW/'corrected-uv-audits.json').write_text(json.dumps({'female': female_uv, 'male': male_uv}, indent=2))
print('UV_AUDIT female_nonadj', female_uv.get('non_adjacent_overlap_pairs'), 'male_nonadj', male_uv.get('non_adjacent_overlap_pairs'), flush=True)

# --- Render final scene from its saved camera ---
bpy.ops.wm.read_homefile(use_empty=True)
bpy.ops.wm.open_mainfile(filepath=str(DST/'deliverables/final-integration.blend'))
sc = bpy.context.scene
sc.render.filepath = str(REVIEW/'final-front-reopened.png')
bpy.ops.render.render(write_still=True)

(REVIEW/'portable-blends.json').write_text(json.dumps(receipts, indent=2))
ok = sum(1 for r in receipts.values() if r.get('status')=='OK')
print('PACKAGE_DONE', json.dumps({'ok': ok, 'total': len(BLENDS),
     'female_uv_nonadj': female_uv.get('non_adjacent_overlap_pairs'),
     'male_uv_nonadj': male_uv.get('non_adjacent_overlap_pairs')}), flush=True)
