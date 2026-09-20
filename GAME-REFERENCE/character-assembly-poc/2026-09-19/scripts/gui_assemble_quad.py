# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Assemble quad FBX sources through equal-count, multi-ring neck transitions."""
import json
import sys
from pathlib import Path
import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components, select_only, orient_surface
from quad_neck import neck_ring, ordered_ring, resample_boundary

reports = []
for gender, head_scale, target in [('Male', 0.17, 1.75), ('Female', 0.185, 1.65)]:
    head = bpy.data.objects[gender + '_Head_Skin']
    body = bpy.data.objects[gender + '_Body_Skin']
    hb, hr = neck_ring(head)
    bb, br = neck_ring(body)
    count = max(len(hr), len(br))
    hr = resample_boundary(hb, hr, count)
    br = resample_boundary(bb, br, count)
    hc = sum((v.co for v in hr), Vector()) / count
    bc = sum((v.co for v in br), Vector()) / count
    top = max(v.co.z for v in br) - 0.025
    # Move only the neck's upper zone to leave room for a smooth collar.
    for v in bb.verts:
        if v.co.z > top - 0.04 and abs(v.co.x) < 0.09:
            weight = min(1, (v.co.z - (top - 0.04)) / 0.04)
            v.co.z -= weight * 0.025
    bc = sum((v.co for v in br), Vector()) / count
    collar_height = 0.025
    translation = Vector((0, bc.y, bc.z + collar_height)) - hc * head_scale
    hb.to_mesh(head.data)
    bb.to_mesh(body.data)
    hb.free()
    bb.free()
    for obj in [o for o in bpy.context.scene.objects if o.name.startswith(gender + '_Head')]:
        obj.data.transform(Matrix.Translation(translation) @ Matrix.Scale(head_scale, 4))
    select_only(body)
    head.hide_set(False)
    head.select_set(True)
    bpy.ops.object.join()
    body.name = gender + '_Base_Quad'
    bm = bmesh.new()
    bm.from_mesh(body.data)
    groups = [g for g in boundary_groups(bm) if all(v.co.z < bc.z + collar_height + 0.02 for e in g for v in e.verts)]
    assert len(groups) == 2, (gender, len(groups))
    groups.sort(key=lambda g: sum(v.co.z for e in g for v in e.verts) / (2 * len(g)))
    lower, upper = [ordered_ring(g) for g in groups]
    assert len(lower) == len(upper) == count
    # Match cyclic phase by minimizing total geometric distance, never by index guess.
    offset = min(range(count), key=lambda k: sum((lower[i].co - upper[(i + k) % count].co).length_squared for i in range(count)))
    upper = upper[offset:] + upper[:offset]
    rings = [lower]
    for j in range(1, 5):
        t = j / 5
        rings.append([bm.verts.new(a.co.lerp(b.co, t)) for a, b in zip(lower, upper)])
    rings.append(upper)
    neck_tag = bm.faces.layers.int.new('NeckQuad')
    collar = []
    for a, b in zip(rings, rings[1:]):
        for i in range(count):
            face = bm.faces.new((a[i], a[(i + 1) % count], b[(i + 1) % count], b[i]))
            face[neck_tag] = 1
            face.material_index = 0
            collar.append(face)
    assert all(len(f.verts) == 4 for f in collar)
    orient_surface(bm)
    assert len(components(bm)) == 1
    assert not any(e.is_boundary for f in collar for e in f.edges)
    max_z = max(v.co.z for v in bm.verts)
    factor = target / max_z
    bm.to_mesh(body.data)
    bm.free()
    for obj in [o for o in bpy.context.scene.objects if o.name.startswith(gender + '_')]:
        obj.data.transform(Matrix.Scale(factor, 4))
        obj['height_target'] = target
        obj['forward_axis'] = '-Y'
        obj.data.normals_split_custom_set([(0, 0, 0)] * len(obj.data.loops))
    reports.append({'gender': gender, 'matched_ring_count': count, 'collar_quads': len(collar), 'intermediate_rings': 4, 'source_head_scale': head_scale, 'source_to_meters': factor, 'height_m': target})
(ROOT / 'reports/quad-neck-assembly.json').write_text(json.dumps(reports, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/quad-assembled-working.blend'))
print('QUAD_NECK_ASSEMBLY_PASS', flush=True)
