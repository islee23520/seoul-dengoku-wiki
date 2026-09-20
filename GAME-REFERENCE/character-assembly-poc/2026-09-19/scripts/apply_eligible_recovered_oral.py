# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Apply only eligible per-part candidates and preserve all rejected components."""
import hashlib
import json
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
cases=json.loads((ROOT/'reports/recovered-oral-fairing-probe.json').read_text())
records=[]
for case in cases:
    obj=bpy.data.objects[case['object']];mesh=obj.data
    before=np.array([v.co[:] for v in mesh.vertices],np.float64)
    faces=[tuple(p.vertices) for p in mesh.polygons]
    uv_before=[np.array([v.uv[:] for v in layer.data],np.float32) for layer in mesh.uv_layers]
    if case['selected'] is None:
        records.append({'object':obj.name,'applied':False,'reason':'No eligible boundary-fixed candidate','source_coordinate_hash':hashlib.sha256(before.tobytes()).hexdigest()})
        continue
    proposal=np.load(ROOT/'reports'/case['selected']['file'])
    assert np.array_equal(before,proposal['before'])
    mesh.vertices.foreach_set('co',proposal['positions'].astype(np.float32).ravel());mesh.update()
    after=np.array([v.co[:] for v in mesh.vertices],np.float64)
    assert np.array_equal(after[proposal['boundary_ids']],before[proposal['boundary_ids']])
    fixed=np.ones(len(before),bool);fixed[proposal['free_vertices']]=False
    assert np.array_equal(after[fixed],before[fixed])
    assert faces==[tuple(p.vertices) for p in mesh.polygons]
    for uv,layer in zip(uv_before,mesh.uv_layers):assert np.array_equal(uv,np.array([v.uv[:] for v in layer.data],np.float32))
    bm=bmesh.new();bm.from_mesh(mesh);bm.normal_update()
    assert not any(e.is_wire or len(e.link_faces)>2 or (e.is_manifold and not e.is_contiguous) for e in bm.edges)
    assert not any(f.calc_area()<=1e-12 for f in bm.faces)
    bm.free()
    if mesh.attributes.get('custom_normal'):mesh.attributes.remove(mesh.attributes['custom_normal'])
    mesh.calc_loop_triangles()
    filename=f'{obj.name}-eligible-native-triangles.npz'
    np.savez_compressed(ROOT/'reports'/filename,positions=after,triangles=np.array([t.vertices[:] for t in mesh.loop_triangles]),polygon_ids=np.array([t.polygon_index for t in mesh.loop_triangles]))
    records.append({'object':obj.name,'applied':True,'vertices':len(before),'faces':len(faces),'source_coordinate_hash':hashlib.sha256(before.tobytes()).hexdigest(),'max_displacement_source_units':float(np.linalg.norm(after-before,axis=1).max()),'boundary_displacement':0,'outside_region_displacement':0,'uv_preserved':True,'topology_preserved':True,'native_triangles':filename,'visual_review_pending':True})
assert sum(r['applied'] for r in records)==2
(ROOT/'reports/eligible-recovered-oral-application.json').write_text(json.dumps(records,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work/recovered-oral-eligible-repairs-review.blend'))
print('ELIGIBLE_RECOVERED_ORAL_APPLIED',flush=True)
