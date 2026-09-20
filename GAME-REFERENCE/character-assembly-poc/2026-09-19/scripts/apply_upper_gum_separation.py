# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Apply the measured upper-gum separation to a copy and export native triangles."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from mesh_tools import boundary_groups,components

obj=bpy.data.objects['Male_Upper_GumArch'];mesh=obj.data
data=np.load(ROOT/'reports/upper-gum-direct-separation.npz')
before=np.array([v.co[:] for v in mesh.vertices]);assert np.array_equal(before,data['before'])
faces=[tuple(p.vertices) for p in mesh.polygons]
uvs=[np.array([d.uv[:] for d in layer.data]) for layer in mesh.uv_layers]
mesh.vertices.foreach_set('co',data['positions'].astype(np.float32).ravel());mesh.update()
after=np.array([v.co[:] for v in mesh.vertices]);fixed=np.ones(len(after),bool);fixed[data['changed_ids']]=False
assert np.array_equal(after[fixed],before[fixed]);assert np.array_equal(after[data['root_ids']],before[data['root_ids']])
assert faces==[tuple(p.vertices) for p in mesh.polygons]
for source,layer in zip(uvs,mesh.uv_layers):assert np.array_equal(source,np.array([d.uv[:] for d in layer.data]))
bm=bmesh.new();bm.from_mesh(mesh);bm.normal_update()
assert len(components(bm))==1
assert not any(e.is_wire or len(e.link_faces)>2 or (e.is_manifold and not e.is_contiguous) for e in bm.edges)
assert all(all(sum(e in group for e in v.link_edges)==2 for e in group for v in e.verts) for group in boundary_groups(bm))
report={'object':obj.name,'changed_vertices':data['changed_ids'].tolist(),'root_unchanged':True,
        'outside_changed_ids_unchanged':True,'uv_unchanged':True,'topology_unchanged':True,
        'boundary_loops':[len(g) for g in boundary_groups(bm)],'other_parts_unchanged':True,
        'status':'NATIVE_APPLIED_INTERSECTION_AND_VISUAL_QA_PENDING'}
bm.free();mesh.calc_loop_triangles()
np.savez_compressed(ROOT/'reports/upper-gum-separated-native-triangles.npz',positions=after,
                    triangles=np.array([t.vertices[:] for t in mesh.loop_triangles]),
                    polygon_ids=np.array([t.polygon_index for t in mesh.loop_triangles]))
(ROOT/'reports/upper-gum-separation-native.json').write_text(json.dumps(report,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work/recovered-oral-upper-gum-separated-review.blend'))
print('UPPER_GUM_SEPARATION_APPLIED',flush=True)
