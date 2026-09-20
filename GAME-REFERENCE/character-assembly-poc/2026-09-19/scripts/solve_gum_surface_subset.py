# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "scipy"]
# ///
"""Select a consistently orientable surface while preserving the gum attachment."""
import json
from pathlib import Path

import numpy as np
import scipy.sparse as sp
from scipy.optimize import Bounds, LinearConstraint, milp

ROOT=Path(__file__).resolve().parents[1]
records=[]
for role in ['upper','lower']:
    graph=json.loads((ROOT/f'reports/male-{role}-gum-graph.json').read_text())
    data=np.load(ROOT/f'reports/male-{role}-gum-graph.npz')
    faces=graph['faces'];edges=graph['edges'];positions=data['positions'];nf=len(faces)
    manifold=[edge for edge in edges if len(edge['faces'])==2]
    nr=len(manifold);rows=[];cols=[];values=[];lower=[];upper=[];row=0
    # Each retained face selects exactly one orientation (positive or reversed).
    # A deleted face selects neither. This avoids retaining a nonorientable fan.
    for i in range(nf):
        rows.extend([row,row]);cols.extend([i,nf+i]);values.extend([1,1]);lower.append(0);upper.append(1);row+=1
    for i,edge in enumerate(manifold):
        a,b=edge['faces']
        for sign in [1,-1]:
            rows.extend([row]*5);cols.extend([a,nf+a,b,nf+b,2*nf+i]);values.extend([sign,sign,-sign,-sign,-1]);lower.append(-np.inf);upper.append(0);row+=1
    for edge in edges:
        adjacent=edge['faces']
        a,b=edge['vertices']
        directions=[]
        for face_id in adjacent:
            ring=faces[face_id]['vertices']
            forward=any(x==a and ring[(j+1)%len(ring)]==b for j,x in enumerate(ring))
            reverse=any(x==b and ring[(j+1)%len(ring)]==a for j,x in enumerate(ring))
            assert forward != reverse
            directions.append(1 if forward else -1)
        # count + abs(oriented edge incidence) <= 2 enforces at most two faces
        # and opposite traversal whenever two faces are retained.
        for sign in [1,-1]:
            for face_id,direction in zip(adjacent,directions):
                rows.extend([row,row]);cols.extend([face_id,nf+face_id]);values.extend([1+sign*direction,1-sign*direction])
            lower.append(-np.inf);upper.append(2);row+=1
        if len(edge['faces'])>2:
            for face_id in adjacent:
                rows.extend([row,row]);cols.extend([face_id,nf+face_id]);values.extend([1,1])
            lower.append(2);upper.append(2);row+=1
    root_faces={f for edge in edges if edge['root'] for f in edge['faces']}
    for face_id in root_faces:
        rows.extend([row,row]);cols.extend([face_id,nf+face_id]);values.extend([1,1]);lower.append(1);upper.append(1);row+=1
    matrix=sp.coo_matrix((values,(rows,cols)),shape=(row,2*nf+nr)).tocsc()
    lo=np.zeros(2*nf+nr);hi=np.ones(2*nf+nr)
    area=np.array([face['area'] for face in faces]);sizes=np.array([len(face['vertices']) for face in faces])
    length=np.array([np.linalg.norm(positions[e['vertices'][0]]-positions[e['vertices'][1]]) for e in manifold]);length/=length.mean()
    # These weights order hypotheses; they are not final acceptance thresholds.
    face_cost=area/np.median(area)+3*(sizes==4)
    objective=np.r_[-face_cost,-face_cost+1e-7,.3*length]
    result=milp(objective,integrality=np.ones(2*nf+nr),bounds=Bounds(lo,hi),constraints=LinearConstraint(matrix,lower,upper),options={'time_limit':120})
    assert result.status==0,result.message
    keep=(result.x[:nf]+result.x[nf:2*nf])>.5
    flip=result.x[nf:2*nf]>.5
    assert all(keep[f] for f in root_faces)
    assert all(sum(keep[f] for f in edge['faces'])<=2 for edge in edges)
    orientation_conflicts=[]
    for edge in edges:
        active=[f for f in edge['faces'] if keep[f]]
        if len(active)!=2:continue
        a,b=edge['vertices'];traversals=[]
        for f in active:
            ring=faces[f]['vertices'];direction=1 if any(x==a and ring[(j+1)%len(ring)]==b for j,x in enumerate(ring)) else -1
            traversals.append(direction*(-1 if flip[f] else 1))
        if sum(traversals)!=0:orientation_conflicts.append(edge['vertices'])
    assert not orientation_conflicts
    records.append({'role':role,'source_graph':f'male-{role}-gum-graph.json','remove_face_ids':np.flatnonzero(~keep).tolist(),'reverse_face_ids':np.flatnonzero(keep&flip).tolist(),'orientation_conflicts':orientation_conflicts,'original_faces':nf,'removed_faces':int((~keep).sum()),'removed_quads':int(((sizes==4)&~keep).sum()),'retained_surface_area_ratio':float(area[keep].sum()/area.sum()),'new_boundary_edges':sum(int(sum(keep[f] for f in edge['faces'])==1) for edge in manifold),'root_adjacent_faces_preserved':True,'vertex_positions_changed':False,'status':'ORIENTABLE_SUBSET_CANDIDATE_REQUIRES_BOUNDARY_AND_SHAPE_QA'})
(ROOT/'reports/gum-oriented-subset-selection.json').write_text(json.dumps(records,indent=2))
print('GUM_ORIENTED_SUBSETS_SELECTED',flush=True)
