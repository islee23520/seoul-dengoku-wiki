"""Face-atomic neighborhood analysis and positive-weight disk repair."""
from __future__ import annotations

import importlib.util
import json
import sys
from collections import Counter, defaultdict
from dataclasses import asdict
from pathlib import Path
from typing import TypedDict

import numpy as np
from scipy.sparse import lil_matrix
from scipy.sparse.linalg import spsolve

HERE = Path(__file__).resolve().parent
ROUND = HERE.parents[1]


def load_gate():
    spec = importlib.util.spec_from_file_location("fixed_uv_gate", ROUND / "gate/uv_audit.py")
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class Union:
    def __init__(self, n: int) -> None:
        self.parent = list(range(n))

    def find(self, i: int) -> int:
        while self.parent[i] != i:
            self.parent[i] = self.parent[self.parent[i]]
            i = self.parent[i]
        return i

    def join(self, a: int, b: int) -> None:
        self.parent[self.find(b)] = self.find(a)


def components(faces, adjacency) -> list[list[int]]:
    unseen = set(faces)
    result = []
    while unseen:
        seed = min(unseen)
        unseen.remove(seed)
        part, stack = [seed], [seed]
        while stack:
            for other in adjacency[stack.pop()]:
                if other in unseen:
                    unseen.remove(other)
                    part.append(other)
                    stack.append(other)
        result.append(sorted(part))
    return result


def graph(data):
    polygons = [list(range(int(s), int(s+n))) for s,n in zip(data['polygon_starts'], data['polygon_sizes'])]
    edge_uses = defaultdict(list)
    for face, loops in enumerate(polygons):
        for k, a in enumerate(loops):
            b = loops[(k+1) % len(loops)]
            edge_uses[int(data['loop_edges'][a])].append((face,a,b))
    geo = [set() for _ in polygons]
    adj = [set() for _ in polygons]
    continuous = []
    for edge, uses in edge_uses.items():
        if len(uses) != 2:
            continue
        (f,a,b),(g,c,d) = uses
        geo[f].add(g)
        geo[g].add(f)
        pairs = [(a,c),(b,d)] if data['loop_vertices'][a] == data['loop_vertices'][c] else [(a,d),(b,c)]
        if all(np.array_equal(data['uv'][x],data['uv'][y]) for x,y in pairs):
            adj[f].add(g)
            adj[g].add(f)
            continuous.append((edge,f,g,pairs))
    return polygons, edge_uses, geo, adj, continuous


class Disk(TypedDict):
    faces: list[int]
    loops: list[int]
    roots: list[int]
    loopmap: dict[int, int]
    triangles_idx: np.ndarray
    triangles: np.ndarray
    boundary: list[tuple[int, int]]
    chi: int
    boundary_components: int
    branches: dict[int, int]
    disk: bool


def disk(faces, polygons, continuous, data) -> Disk:
    owned = set(faces)
    loops = sorted(l for f in faces for l in polygons[f])
    identities = Union(len(data['uv']))
    for _,f,g,pairs in continuous:
        if f in owned and g in owned:
            for a,b in pairs:
                identities.join(a,b)
    roots = sorted({identities.find(l) for l in loops})
    rid = {r:i for i,r in enumerate(roots)}
    loopmap = {l:rid[identities.find(l)] for l in loops}
    edges = Counter()
    directed = []
    for f in faces:
        ls = polygons[f]
        for k,a in enumerate(ls):
            x,y = loopmap[a],loopmap[ls[(k+1)%len(ls)]]
            edges[tuple(sorted((x,y)))] += 1
            directed.append((x,y))
    boundary = [(x,y) for x,y in directed if edges[tuple(sorted((x,y)))] == 1]
    bg = defaultdict(set)
    for a,b in boundary:
        bg[a].add(b)
        bg[b].add(a)
    chi = len(roots)-len(edges)+len(faces)
    branches = {v:len(ns) for v,ns in bg.items() if len(ns)!=2}
    ncycles = len(components(bg, bg)) if bg else 0
    triangles_idx = np.flatnonzero(np.isin(data['triangle_polygons'],faces))
    triangles = np.asarray([[loopmap[int(l)] for l in data['triangles'][t]] for t in triangles_idx],np.int32)
    return {'faces':faces, 'loops':loops, 'roots':roots, 'loopmap':loopmap, 'triangles_idx':triangles_idx,
            'triangles':triangles, 'boundary':boundary, 'chi':chi,'boundary_components':ncycles,'branches':branches,
            'disk':chi==1 and ncycles==1 and not branches and max(edges.values())<=2}


def analyze() -> None:
    with np.load(HERE/'native-graph.npz') as archive:
        data = {name: archive[name] for name in archive.files}
    polygons, uses, geo, adj, continuous = graph(data)
    gate = load_gate()
    baseline = gate.audit_triangles(data['uv'][data['triangles']],data['triangle_polygons'])
    (HERE/'baseline-native-audit.json').write_text(json.dumps(asdict(baseline),indent=2))
    bad = sorted({f for pair in baseline.overlaps for f in pair.polygon_ids})
    charts = components(range(len(polygons)),adj)
    facechart = {f:i for i,c in enumerate(charts) for f in c}
    neighborhoods = components(bad,adj)
    cross = [asdict(p) for p in baseline.overlaps if facechart[p.polygon_ids[0]] != facechart[p.polygon_ids[1]]]
    rows = []
    for i,faces in enumerate(neighborhoods):
        d = disk(faces,polygons,continuous,data)
        points = data['positions'][data['loop_vertices'][d['loops']]]
        triuv = data['uv'][data['triangles'][d['triangles_idx']]]
        a,b = triuv[:,1]-triuv[:,0],triuv[:,2]-triuv[:,0]
        signs = a[:,0]*b[:,1]-a[:,1]*b[:,0]
        rows.append({'id':i,'faces':faces,'chart_id':facechart[faces[0]],'chart_faces':len(charts[facechart[faces[0]]]),
                     'disk':d['disk'],'chi':d['chi'],'boundary_components':d['boundary_components'],'branches':d['branches'],
                     'negative_triangles':int((signs<0).sum()),'positive_triangles':int((signs>0).sum()),
                     'world_bounds':[points.min(0).tolist(),points.max(0).tolist()]})
    report = {'overlap_pairs':len(baseline.overlaps),'degenerate':len(baseline.degenerate_triangle_ids),
              'affected_faces':bad,'same_polygon_pairs':sum(p.polygon_ids[0]==p.polygon_ids[1] for p in baseline.overlaps),
              'chart_count':len(charts),'affected_chart_count':len({facechart[f] for f in bad}),
              'cross_chart_overlaps':cross,'neighborhoods':rows}
    (HERE/'neighborhood-analysis.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({k:v for k,v in report.items() if k not in ['affected_faces','cross_chart_overlaps','neighborhoods']}),flush=True)
    print(json.dumps(rows),flush=True)


def signed_areas(uv, triangles):
    t = uv[triangles]
    a,b = t[:,1]-t[:,0],t[:,2]-t[:,0]
    return (a[:,0]*b[:,1]-a[:,1]*b[:,0])/2


def parameterize(d, data, pinned: bool):
    """Strictly positive uniform barycentric weights on native diagonals."""
    boundary_next = dict(d['boundary'])
    start = min(boundary_next)
    order, vertex = [], start
    while vertex not in order:
        order.append(vertex)
        vertex = boundary_next[vertex]
    assert vertex == start and len(order) == len(boundary_next)
    uv = data['uv'][d['roots']].copy()
    if not pinned:
        angle = np.arange(len(order))*2*np.pi/len(order)
        uv[order] = np.column_stack((np.cos(angle),np.sin(angle)))
    neighbors = [set() for _ in uv]
    for t in d['triangles']:
        for i in range(3):
            a,b = int(t[i]),int(t[(i+1)%3])
            neighbors[a].add(b)
            neighbors[b].add(a)
    interior = sorted(set(range(len(uv)))-set(order))
    interior_id = {v:i for i,v in enumerate(interior)}
    matrix = lil_matrix((len(interior),len(interior)),dtype=np.float64)
    rhs = np.zeros((len(interior),2))
    for row,v in enumerate(interior):
        matrix[row,row] = len(neighbors[v])
        for n in neighbors[v]:
            if n in interior_id:
                matrix[row,interior_id[n]] = -1
            else:
                rhs[row] += uv[n]
    if interior:
        uv[interior] = spsolve(matrix.tocsr(),rhs)
    return uv, {'boundary_vertices':len(order),'interior_vertices':len(interior),
                'weight':1.0,'boundary':'unchanged original' if pinned else 'strict convex circle, equal angular spacing',
                'order':order}


def exterior_hits(gate, proposal, local_indices, data, current) -> list[dict[str, int | float]]:
    """All outside native triangles, with no adjacency or same-face exemption."""
    outside = np.ones(len(data['triangles']),bool)
    outside[local_indices] = False
    ids = np.flatnonzero(outside)
    triangles = current[data['triangles'][ids]]
    lo,hi = triangles.min(1),triangles.max(1)
    hits = []
    for t in proposal:
        candidates = np.flatnonzero(np.all(np.minimum(hi,t.max(0))-np.maximum(lo,t.min(0))>0,axis=1))
        for i in candidates:
            area = gate._intersection_area(t,triangles[i])
            if area > 1e-13:
                hits.append({'outside_triangle':int(ids[i]),'area':area})
    return hits


def free_pack(uv, d, data, current):
    """Translate a fixed-size convex disk into conservative actual empty cells."""
    from scipy.ndimage import maximum_filter
    size = 2048
    owned = np.isin(data['triangle_polygons'],d['faces'])
    triangles = current[data['triangles'][~owned]]
    lo = np.maximum(0,np.floor(triangles.min(1)*size).astype(int)-2)
    hi = np.minimum(size-1,np.ceil(triangles.max(1)*size).astype(int)+2)
    occupied = np.zeros((size,size),bool)
    for a,b in zip(lo,hi):
        occupied[a[1]:b[1]+1,a[0]:b[0]+1] = True
    old = data['uv'][d['roots']]
    old_area = np.abs(signed_areas(old,d['triangles'])).sum()
    unit_area = np.abs(signed_areas(uv,d['triangles'])).sum()
    # Match measured neighborhood UV area; never shrink to evade hard thresholds.
    scale = np.sqrt(old_area/unit_area)
    shaped = (uv-uv.min(0))*scale
    extent = shaped.max(0)
    cells = np.ceil(extent*size).astype(int)+6
    blocked = maximum_filter(occupied,size=(int(cells[1]),int(cells[0])),mode='constant',cval=1)
    free = np.argwhere(np.logical_not(blocked))
    if not len(free):
        raise RuntimeError(f'NO_ACTUAL_FREE_ATLAS_RECTANGLE {extent.tolist()}')
    center = old.mean(0)*size
    order = np.argsort(np.square(free[:,::-1]-center).sum(1),kind='stable')
    p = free[order[0],::-1]/size-extent/2
    out = (shaped+p).astype(np.float32).astype(np.float64)
    assert out.min()>=0 and out.max()<=1
    return out, {'scale_for_original_uv_area':float(scale),'translation':p.tolist(),
                 'bbox_extent':extent.tolist(),'empty_grid_resolution':size,
                 'padding_cells':2,'packing':'rigid translation after area-matched parameterization, no other chart moved'}


def repair() -> None:
    with np.load(HERE/'native-graph.npz') as archive:
        data = {name: archive[name] for name in archive.files}
    analysis = json.loads((HERE/'neighborhood-analysis.json').read_text())
    polygons, uses, geo, adj, continuous = graph(data)
    bad = set(analysis['affected_faces'])
    # One original-polygon-edge ring joins nearby overlap neighborhoods and
    # gives pinned barycentric solves real interior vertices.
    owned = bad | {g for f in bad for g in adj[f]}
    groups = components(owned,adj)
    current = data['uv'].copy()
    gate = load_gate()
    records = []
    pending = []
    for group_id, faces in enumerate(groups):
        d = disk(faces,polygons,continuous,data)
        if not d['disk']:
            # Add only face-neighbors of this neighborhood until disk topology
            # is attained; records preserve every expansion.
            history = []
            while not d['disk']:
                history.append({'faces':faces,'chi':d['chi'],'branches':d['branches'],'boundaries':d['boundary_components']})
                expanded = sorted(set(faces)|{g for f in faces for g in adj[f]})
                if expanded == faces:
                    (HERE/f'non-disk-{group_id}.json').write_text(json.dumps(history,indent=2))
                    raise RuntimeError(f'NON_DISK_FULL_CHART {group_id}')
                faces = expanded
                d = disk(faces,polygons,continuous,data)
        candidate, solver = parameterize(d,data,True)
        candidate = candidate.astype(np.float32).astype(np.float64)
        area = signed_areas(candidate,d['triangles'])
        au = gate.audit_triangles(candidate[d['triangles']],data['triangle_polygons'][d['triangles_idx']])
        hits = exterior_hits(gate,candidate[d['triangles']],d['triangles_idx'],data,current) if au.status=='PASS' else []
        pinned_ok = bool(np.all(area>1e-14) and au.status=='PASS' and not hits)
        row = {'group':group_id,'faces':faces,'seed_bad_faces':sorted(set(faces)&bad),'topology':{'chi':d['chi'],'boundary_components':d['boundary_components'],'branches':d['branches']},
               'pinned_attempt':{'solver':solver,'audit':asdict(au),'exterior_hits':hits,'positive_orientation':bool(np.all(area>1e-14))},
               'method':'pinned_positive_uniform' if pinned_ok else 'convex_positive_uniform'}
        if pinned_ok:
            for l,v in d['loopmap'].items():
                current[l] = candidate[v]
            row['final_local_audit'] = asdict(au)
            records.append(row)
        else:
            pending.append((d,row))
        print(json.dumps({'event':'PINNED_ATTEMPT','group':group_id,'faces':len(faces),'accepted':pinned_ok}),flush=True)
    for d,row in pending:
        candidate,solver = parameterize(d,data,False)
        assert np.all(signed_areas(candidate,d['triangles'])>0)
        packed,packing = free_pack(candidate,d,data,current)
        au = gate.audit_triangles(packed[d['triangles']],data['triangle_polygons'][d['triangles_idx']])
        hits = exterior_hits(gate,packed[d['triangles']],d['triangles_idx'],data,current)
        row.update({'solver':solver,'packing':packing,'final_local_audit':asdict(au),'exterior_hits':hits})
        records.append(row)
        (HERE/'repair-attempts.json').write_text(json.dumps(records,indent=2))
        assert au.status=='PASS' and not hits and np.all(signed_areas(packed,d['triangles'])>1e-14), row
        for l,v in d['loopmap'].items():
            current[l] = packed[v]
        print(json.dumps({'event':'CONVEX_REPAIR','group':row['group'],'faces':len(d['faces'])}),flush=True)
    np.savez_compressed(HERE/'repaired-loops.npz',uv=current)
    (HERE/'repair-attempts.json').write_text(json.dumps(records,indent=2))
    full = gate.audit_triangles(current[data['triangles']],data['triangle_polygons'])
    (HERE/'repaired-native-audit.json').write_text(json.dumps(asdict(full),indent=2))
    print(json.dumps({'event':'FULL_NATIVE','status':full.status,'overlaps':len(full.overlaps),'degenerate':len(full.degenerate_triangle_ids),'groups':len(records),'changed_loops':int(np.any(current!=data['uv'],axis=1).sum())}),flush=True)


if __name__ == '__main__':
    if '--repair' in sys.argv:
        repair()
    else:
        analyze()
