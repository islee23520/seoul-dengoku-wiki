# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Keep recovered gum and point-attached crown surfaces as separate review parts."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from mesh_tools import components,boundary_groups

source_scene=bpy.context.scene
scene=bpy.data.scenes.new('Recovered_Oral_Parts_Review');bpy.context.window.scene=scene
records=[]
for original in list(source_scene.objects):
    if original.type!='MESH':continue
    role='Upper' if 'Upper' in original.name else 'Lower'
    bm=bmesh.new();bm.from_mesh(original.data);bm.verts.ensure_lookup_table()
    parts=[{v.index for v in part} for part in components(bm)];bm.free()
    all_faces=0
    for index,ids in enumerate(parts):
        mesh=original.data.copy();part=bmesh.new();part.from_mesh(mesh);part.verts.ensure_lookup_table()
        bmesh.ops.delete(part,geom=[v for v in part.verts if v.index not in ids],context='VERTS')
        part.normal_update()
        loops=[{'edges':len(group),'center':[sum(v.co[a] for e in group for v in e.verts)/(2*len(group)) for a in range(3)]} for group in boundary_groups(part)]
        record={'jaw':role,'part':index,'vertices':len(part.verts),'faces':len(part.faces),'quads':sum(len(f.verts)==4 for f in part.faces),'junctions':sum(len(e.link_faces)>2 for e in part.edges),'winding':sum(e.is_manifold and not e.is_contiguous for e in part.edges),'boundary_groups':loops,'role':'gum_arch' if index==0 else 'recovered_crown_candidate','original_faces_retained':True}
        part.to_mesh(mesh);part.free()
        obj=bpy.data.objects.new(f'Male_{role}_'+('GumArch' if index==0 else f'RecoveredCrown{index}'),mesh);scene.collection.objects.link(obj)
        obj['role']=record['role'];obj['jaw']=role;obj['original_faces_retained']=True
        record['object']=obj.name;records.append(record);all_faces+=len(mesh.polygons)
        mesh.calc_loop_triangles()
        np.savez_compressed(ROOT/f'reports/{obj.name}-triangles.npz',positions=np.array([v.co[:] for v in mesh.vertices]),triangles=np.array([t.vertices[:] for t in mesh.loop_triangles]),polygon_ids=np.array([t.polygon_index for t in mesh.loop_triangles]))
    assert all_faces==len(original.data.polygons)
(ROOT/'reports/recovered-oral-parts.json').write_text(json.dumps(records,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work/recovered-oral-parts-review.blend'))
print('RECOVERED_ORAL_PARTS_ISOLATED',len(records),flush=True)
