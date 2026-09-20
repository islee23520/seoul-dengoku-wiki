# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Create isolated gum repair candidates, preserving all original socket coordinates."""
import json
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from mesh_tools import components,boundary_groups,orient_surface

selected=json.loads((ROOT/'reports/gum-oriented-subset-selection.json').read_text())
scene=bpy.data.scenes.new('Gum_Surface_Subset_Review');bpy.context.window.scene=scene
with bpy.data.libraries.load(str(ROOT/'work/oral-separated-verified.blend'),link=False) as (source,target):
    target.objects=[name for name in source.objects if name.startswith('Male_') and 'Gum' in name]
records=[]
for obj in target.objects:
    role='upper' if 'Upper' in obj.name else 'lower'
    graph=json.loads((ROOT/f'reports/male-{role}-gum-graph.json').read_text())
    chosen=next(row for row in selected if row['role']==role)
    bm=bmesh.new();bm.from_mesh(obj.data);bm.verts.ensure_lookup_table()
    main=set(components(bm)[0]);bmesh.ops.delete(bm,geom=[v for v in bm.verts if v not in main],context='VERTS')
    bm.faces.ensure_lookup_table();bm.faces.index_update();bm.verts.ensure_lookup_table();bm.verts.index_update()
    assert [[v.index for v in f.verts] for f in bm.faces]==[f['vertices'] for f in graph['faces']]
    before_positions={v:tuple(v.co) for v in bm.verts}
    root_before={tuple(p) for p in graph['root_points']}
    reverse=[bm.faces[i] for i in chosen['reverse_face_ids']]
    discard=[bm.faces[i] for i in chosen['remove_face_ids']]
    bmesh.ops.reverse_faces(bm,faces=reverse)
    bmesh.ops.delete(bm,geom=discard,context='FACES_ONLY')
    bmesh.ops.delete(bm,geom=[e for e in bm.edges if not e.link_faces],context='EDGES')
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
    for v,p in before_positions.items():
        if v.is_valid:assert tuple(v.co)==p
    assert not any(len(e.link_faces)>2 for e in bm.edges)
    assert not any(e.is_manifold and not e.is_contiguous for e in bm.edges), 'Native incidence differs from oriented selection'
    orient_surface(bm)
    loops=[]
    for group in boundary_groups(bm):
        vertices={v for e in group for v in e.verts}
        loops.append({'edges':len(group),'simple':all(sum(e in group for e in v.link_edges)==2 for v in vertices),'root':{tuple(v.co) for v in vertices}==root_before,'center':[sum(v.co[a] for v in vertices)/len(vertices) for a in range(3)]})
    assert any(loop['root'] for loop in loops)
    records.append({'role':role,'vertices':len(bm.verts),'faces':len(bm.faces),'components':[len(part) for part in components(bm)],'junction_edges':sum(len(e.link_faces)>2 for e in bm.edges),'winding_errors':sum(e.is_manifold and not e.is_contiguous for e in bm.edges),'boundary_loops':loops,'root_preserved':True,'positions_unchanged':True,'status':'SUBSET_NOT_FULL_REPAIR'})
    bm.to_mesh(obj.data);bm.free()
    obj.name=f'Male_{role.title()}Gum_SubsetReview';scene.collection.objects.link(obj)
    if obj.data.attributes.get('custom_normal'):obj.data.attributes.remove(obj.data.attributes['custom_normal'])
    for p in obj.data.polygons:p.use_smooth=True
    obj.data.calc_loop_triangles()
    np.savez_compressed(ROOT/f'reports/male-{role}-gum-oriented-triangles.npz',positions=np.array([v.co[:] for v in obj.data.vertices]),triangles=np.array([t.vertices[:] for t in obj.data.loop_triangles]),polygon_ids=np.array([t.polygon_index for t in obj.data.loop_triangles]))
(ROOT/'reports/gum-oriented-subset-audit.json').write_text(json.dumps(records,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work/male-gum-oriented-subset-review.blend'))
print('GUM_ORIENTED_REVIEW_SAVED',flush=True)
