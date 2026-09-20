"""Independent saved-native gate, chart preservation, and qualified stretch."""
from __future__ import annotations

import importlib
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]))
sys.path.insert(0,str(HERE))
gate = importlib.import_module('gate.uv_report')
repair = importlib.import_module('local_repair')


def stretch(positions, uv, loops):
    p = positions
    e1,e2 = p[:,1]-p[:,0],p[:,2]-p[:,0]
    length = np.linalg.norm(e1,axis=1)
    x = e1/length[:,None]
    n = np.cross(e1,e2)
    area_world = np.linalg.norm(n,axis=1)/2
    n /= (area_world*2)[:,None]
    y = np.cross(n,x)
    src = np.zeros((len(p),2,2))
    src[:,0,0] = length
    src[:,0,1] = np.einsum('ij,ij->i',e2,x)
    src[:,1,1] = np.einsum('ij,ij->i',e2,y)
    t = uv[loops]
    dst = np.stack((t[:,1]-t[:,0],t[:,2]-t[:,0]),axis=2)
    singular = np.linalg.svd(dst @ np.linalg.inv(src),compute_uv=False)
    ratios = singular[:,0]/singular[:,1]
    area_uv = np.abs(np.linalg.det(dst))/2
    return ratios,area_world,area_uv


def main() -> None:
    payload = json.loads((HERE/'final-native-extraction.json').read_text())
    verdict = gate.audit_extraction(payload)
    (HERE/'final-native-verdict.json').write_text(json.dumps(verdict,indent=2))
    with np.load(HERE/'native-graph.npz') as archive:
        data = {k:archive[k] for k in archive.files}
    final = np.load(HERE/'target-loop-export.npz')['uv']
    native = payload['meshes'][0]['triangles']
    assert np.array_equal(np.asarray([t['loop_ids'] for t in native]),data['triangles'])
    assert np.array_equal(np.asarray([t['uv'] for t in native]),final[data['triangles']])
    before_graph = repair.graph(data)
    after_graph = repair.graph(dict(data,uv=final))
    before_charts = repair.components(range(len(before_graph[0])),before_graph[3])
    after_charts = repair.components(range(len(after_graph[0])),after_graph[3])
    records = json.loads((HERE/'repair-attempts.json').read_text())
    owned = {f for row in records for f in row['faces']}
    owned_loops = {l for f in owned for l in before_graph[0][f]}
    delta = np.any(data['uv']!=final,axis=1)
    assert all(int(l) in owned_loops for l in np.flatnonzero(delta))
    touched_charts = [i for i,chart in enumerate(before_charts) if any(np.any(delta[before_graph[0][f]]) for f in chart)]
    seams = []
    for edge,uses in before_graph[1].items():
        if len(uses)==2:
            f,g = uses[0][0],uses[1][0]
            if g in before_graph[3][f] and g not in after_graph[3][f]:
                seams.append({'edge_id':edge,'polygon_ids':[f,g],'vertices':[int(data['loop_vertices'][uses[0][1]]),int(data['loop_vertices'][uses[0][2]])]})
    (HERE/'authored-uv-seams.json').write_text(json.dumps(seams,indent=2))
    positions = data['positions'][data['loop_vertices'][data['triangles']]]
    stats = {}
    for name,uv in [('before',data['uv']),('after',final)]:
        ratios,wa,ua = stretch(positions,uv,data['triangles'])
        order = np.argsort(ratios)
        cdf = np.cumsum(wa[order])/wa.sum()
        stats[name] = {'triangle_count':len(ratios),'world_area_m2':float(wa.sum()),'uv_area':float(ua.sum()),
                       'unweighted_percentiles':{str(q):float(np.percentile(ratios,q)) for q in [50,90,99,99.9,100]},
                       'world_area_weighted_percentiles':{str(q):float(ratios[order[min(np.searchsorted(cdf,q/100),len(order)-1)]]) for q in [50,90,99,99.9]},
                       'outliers':{str(threshold):{'count':int((ratios>threshold).sum()),'world_area_m2':float(wa[ratios>threshold].sum()),'uv_area':float(ua[ratios>threshold].sum())} for threshold in [4,10,100,1000]},
                       'top_30_slivers':[{'triangle_id':int(t),'polygon_id':int(data['triangle_polygons'][t]),'stretch':float(ratios[t]),'world_area_m2':float(wa[t]),'uv_area':float(ua[t]),'changed':bool(np.any(delta[data['triangles'][t]]))} for t in order[-30:][::-1]]}
    report = {'native_status':verdict['status'],'before_chart_count':len(before_charts),'after_chart_count':len(after_charts),
              'changed_original_chart_count':len(touched_charts),'untouched_original_chart_count':len(before_charts)-len(touched_charts),
              'changed_original_chart_ids':touched_charts,'owned_faces':len(owned),'changed_loops':int(delta.sum()),
              'outside_owned_loops_identical':True,'new_seam_edges':len(seams),
              'single_polygon_charts_before':sum(len(c)==1 for c in before_charts),
              'single_polygon_charts_after':sum(len(c)==1 for c in after_charts),
              'repair_disk_face_counts':[len(row['faces']) for row in records], 'stretch':stats}
    (HERE/'quality-report.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({'event':'FINAL_NATIVE_AUDIT','status':verdict['status'],'measurements':verdict['checks'][0]['measurements'],
                      'charts':[len(before_charts),len(after_charts)],'changed_charts':len(touched_charts),'new_seam_edges':len(seams)}),flush=True)
    assert verdict['status']=='PASS'


if __name__ == '__main__':
    main()
