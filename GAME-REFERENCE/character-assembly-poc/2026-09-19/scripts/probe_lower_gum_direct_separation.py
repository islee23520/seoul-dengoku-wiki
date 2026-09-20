# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy"]
# ///
"""Descent-only direct intersection separation with root/shape guards.

This does not apply candidate coordinates to Blender. Failure to reach zero is
reported, not hidden or converted into approval.
"""
import json
from pathlib import Path

import numpy as np
from triangle_intersection_audit import audit_intersections

ROOT=Path(__file__).resolve().parents[1]
data=np.load(ROOT/'reports/Male_Lower_GumArch-repair-graph.npz')
original=data['positions'].astype(float);triangles=data['triangles'];boundary=data['boundary_ids']
root_points=json.loads((ROOT/'reports/male-lower-gum-graph.json').read_text())['root_points']
lookup={tuple(p):i for i,p in enumerate(original)}
root_ids=np.array([lookup[tuple(p)] for p in root_points],np.int32)
original_audit=audit_intersections(original,triangles)
original_contacts={tuple(c['triangles']) for c in original_audit['point_contacts']}

def area(positions):
    p=positions[triangles]
    return float(np.linalg.norm(np.cross(p[:,1]-p[:,0],p[:,2]-p[:,0]),axis=1).sum()/2)

base_area=area(original)
current=original.copy();current_audit=original_audit
history=[];attempted=0;rejected_by_geometry=0;rejected_by_shape=0
while current_audit['intersections']:
    count=len(current_audit['intersections']);best=None;seen=set()
    for hit in current_audit['intersections']:
        if hit['type']!='PROPER_INTERSECTION':continue
        pair=hit['triangles']
        for fixed_triangle,moved_triangle in [pair,pair[::-1]]:
            face=current[triangles[fixed_triangle]]
            normal=np.cross(face[1]-face[0],face[2]-face[0]);normal/=np.linalg.norm(normal)
            ids=triangles[moved_triangle]
            for sign in [-1,1]:
                candidate=current.copy()
                distances=(current[ids]-face[0])@normal
                steps=np.maximum(0,1e-7-sign*distances)
                candidate[ids]+=steps[:,None]*sign*normal
                candidate=candidate.astype(np.float32).astype(float)
                if not np.array_equal(candidate[root_ids],original[root_ids]):continue
                key=candidate[ids].tobytes()
                if key in seen:continue
                seen.add(key);attempted+=1
                delta=np.linalg.norm(candidate-original,axis=1);ratio=area(candidate)/base_area
                if delta.max()>.0015 or not .995<=ratio<=1.005:
                    rejected_by_shape+=1;continue
                evaluated=audit_intersections(candidate,triangles)
                contacts={tuple(c['triangles']) for c in evaluated['point_contacts']}
                if evaluated['degenerate_triangles'] or contacts-original_contacts or len(evaluated['intersections'])>=count:
                    rejected_by_geometry+=1;continue
                score=(len(evaluated['intersections']),float((delta**2).sum()))
                if best is None or score<best[0]:
                    best=(score,candidate,evaluated,{'fixed_triangle':fixed_triangle,'moved_triangle':moved_triangle,'sign':sign,'remaining_intersections':len(evaluated['intersections']),'contacts':len(contacts),'max_displacement':float(delta.max()),'socket_boundary_max_displacement':float(delta[boundary].max()),'surface_area_ratio':ratio,'changed_vertices':np.flatnonzero(delta>0).tolist()})
    if best is None:break
    _,current,current_audit,step=best;history.append(step)
    print('LOWER_GUM_DESCENT_STEP',len(history),len(current_audit['intersections']),'intersections',flush=True)
success=not current_audit['intersections'] and not current_audit['degenerate_triangles']
if success:
    np.savez_compressed(ROOT/'reports/lower-gum-direct-candidate.npz',before=original,positions=current,triangles=triangles,root_ids=root_ids)
report={'before_intersections':len(original_audit['intersections']),'remaining_intersections':current_audit['intersections'],'remaining_contacts':current_audit['point_contacts'],'steps':history,'attempted_candidates':attempted,'rejected_shape':rejected_by_shape,'rejected_geometry':rejected_by_geometry,'success':success,'source_applied':False,'root_preserved':True,'maximum_allowed_displacement':.0015,'area_ratio_limits':[.995,1.005],'status':'NUMERIC_CANDIDATE_REQUIRES_NATIVE_AND_VISUAL_REVIEW' if success else 'NO_FULL_REPAIR_WITHIN_GUARDS'}
(ROOT/'reports/lower-gum-direct-separation-probe.json').write_text(json.dumps(report,indent=2))
print('LOWER_GUM_DIRECT_PROBE_COMPLETE',success,len(current_audit['intersections']),'remaining',flush=True)
