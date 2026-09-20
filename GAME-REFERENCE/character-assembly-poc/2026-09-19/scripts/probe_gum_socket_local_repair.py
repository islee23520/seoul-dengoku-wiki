# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "scipy"]
# ///
"""Allow bounded correction of damaged socket rims, keeping the true root fixed."""
import json
from pathlib import Path

import numpy as np
import scipy.sparse as sp
from scipy.sparse.linalg import spsolve
from triangle_intersection_audit import audit_intersections

ROOT=Path(__file__).resolve().parents[1]
index=json.loads((ROOT/'reports/recovered-oral-graph-index.json').read_text())
reports=[]
for role in ['Upper','Lower']:
    name=f'Male_{role}_GumArch'
    item=next(row for row in index if row['object']==name)
    data=np.load(ROOT/'reports'/item['graph'])
    X=data['positions'].astype(float);T=data['triangles'];E=data['edges'];boundary=data['boundary_ids']
    original_root=np.array(json.loads((ROOT/f'reports/male-{role.lower()}-gum-graph.json').read_text())['root_points'])
    lookup={tuple(p):i for i,p in enumerate(X)}
    root_ids=np.array([lookup[tuple(p)] for p in original_root],np.int32)
    baseline=audit_intersections(X,T)
    seed_triangles=sorted({i for hit in baseline['intersections'] for i in hit['triangles']})
    seeds=np.unique(T[seed_triangles])
    graph=sp.coo_matrix((np.ones(2*len(E)),(np.r_[E[:,0],E[:,1]],np.r_[E[:,1],E[:,0]])),shape=(len(X),len(X))).tocsr()
    degree=np.asarray(graph.sum(1)).ravel();lap=sp.eye(len(X))-sp.diags(1/degree)@graph
    neighbors=np.unique(np.concatenate([graph[v].indices for v in seeds]))
    weight=np.zeros(len(X));weight[neighbors]=.15;weight[seeds]=1;weight[root_ids]=0
    free=np.flatnonzero(weight>0);fixed=np.flatnonzero(weight==0)
    def area(P):
        p=P[T];return float(np.linalg.norm(np.cross(p[:,1]-p[:,0],p[:,2]-p[:,0]),axis=1).sum()/2)
    base_area=area(X)
    record={'object':name,'before_intersections':len(baseline['intersections']),'root_vertex_count':len(root_ids),'changed_constraint':'Keep anatomical84/82root fixed; defective socket vertices may move within .0015 normalized head units','limits':{'maximum_move_source_units':.0015,'area_ratio':[.995,1.005]},'candidates':[],'selected':None}
    basecontacts={tuple(p['triangles']) for p in baseline['point_contacts']}
    for strength in [.001,.005,.01,.025,.05,.1,.2,.35,.5,1.,2.]:
        weighted=strength*sp.diags(weight[free])
        Z=X.copy();Z[free]=spsolve((sp.eye(len(free))+weighted@lap[free][:,free]).tocsc(),X[free]-weighted@lap[free][:,fixed]@X[fixed])
        Z=Z.astype(np.float32).astype(float)
        assert np.array_equal(Z[root_ids],X[root_ids]) and np.array_equal(Z[fixed],X[fixed])
        result=audit_intersections(Z,T);delta=np.linalg.norm(Z-X,axis=1);ratio=area(Z)/base_area
        contacts={tuple(p['triangles']) for p in result['point_contacts']}
        eligible=result['ok'] and not(contacts-basecontacts) and delta.max()<=.0015 and .995<=ratio<=1.005
        record['candidates'].append({'strength':strength,'intersections':len(result['intersections']),'pairs':result['intersections'],'contacts':len(contacts),'new_contacts':len(contacts-basecontacts),'max_move':float(delta.max()),'socket_boundary_max_move':float(delta[boundary].max()),'area_ratio':ratio,'eligible':bool(eligible)})
        if eligible:
            filename=f'{name}-socket-local-candidate.npz'
            np.savez_compressed(ROOT/'reports'/filename,before=X,positions=Z,root_ids=root_ids,editable=free,triangles=T)
            record['selected']={'strength':strength,'file':filename,'status':'NUMERIC_CANDIDATE_REQUIRES_NATIVE_SOCKET_AND_RENDER_QA'}
            break
    reports.append(record)
    print('GUM_SOCKET_LOCAL_RESULT',name,'eligible' if record['selected'] else 'no_eligible_candidate',flush=True)
(ROOT/'reports/gum-socket-local-probe.json').write_text(json.dumps(reports,indent=2))
print('GUM_SOCKET_LOCAL_PROBE_COMPLETE',flush=True)
