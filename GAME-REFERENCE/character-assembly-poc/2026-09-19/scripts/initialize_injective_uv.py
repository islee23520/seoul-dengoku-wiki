# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "scipy"]
# ///
"""Reinitialize only overlapping UV charts with positive-weight disk embeddings."""
import json
from collections import defaultdict
from pathlib import Path

import numpy as np
import scipy.sparse as sp
from scipy.sparse.csgraph import connected_components
from scipy.sparse.linalg import spsolve

ROOT = Path(__file__).resolve().parents[1]
data = np.load(ROOT/'reports/tessellation-uv-connectivity.npz')
loop_uv = data['uv'].astype(np.float64)
keys = np.rec.fromarrays([data['loop_vertices'],loop_uv[:,0],loop_uv[:,1]],names='vertex,u,v')
_, first, inverse = np.unique(keys,return_index=True,return_inverse=True)
original = loop_uv[first]
points = data['positions'][data['loop_vertices'][first]].astype(np.float64)
triangles = inverse[data['triangle_loops']]
edges = np.sort(np.vstack([triangles[:,[0,1]],triangles[:,[1,2]],triangles[:,[2,0]]]),axis=1)
unique_edges, edge_counts = np.unique(edges,axis=0,return_counts=True)
adjacency = sp.coo_matrix((np.ones(2*len(unique_edges)),(np.r_[unique_edges[:,0],unique_edges[:,1]],np.r_[unique_edges[:,1],unique_edges[:,0]])),shape=(len(original),len(original))).tocsr()
count, labels = connected_components(adjacency)
audit = json.loads((ROOT/'reports/male-tessellation-uv-overlap.json').read_text())
bad_triangles = {i for pair in audit['positive_area_overlap_pairs'] for i in pair['triangles']}
bad_charts = set(labels[triangles[list(bad_triangles),0]].tolist())
output = original.copy()
records = []
for chart in sorted(bad_charts):
    ids = np.flatnonzero(labels==chart)
    local = np.full(len(original),-1,dtype=np.int32)
    local[ids] = np.arange(len(ids))
    boundary_edges = unique_edges[(edge_counts==1)&(labels[unique_edges[:,0]]==chart)]
    neighbors = defaultdict(list)
    for a,b in boundary_edges:
        neighbors[int(a)].append(int(b))
        neighbors[int(b)].append(int(a))
    assert all(len(v)==2 for v in neighbors.values())
    visited, loops = set(), []
    for start in sorted(neighbors):
        if start in visited:
            continue
        previous, current, loop = None, start, []
        while current not in visited:
            visited.add(current)
            loop.append(current)
            following = next(v for v in neighbors[current] if v!=previous)
            previous,current = current,following
        loops.append(np.array(loop,dtype=np.int32))
    # Largest perimeter is the outer contour for these six measured charts.
    loops.sort(key=lambda loop:float(np.linalg.norm(np.roll(points[loop],-1,axis=0)-points[loop],axis=1).sum()),reverse=True)
    outer = loops[0]
    lengths = np.linalg.norm(np.roll(points[outer],-1,axis=0)-points[outer],axis=1)
    increments = .9*lengths/lengths.sum()+.1/len(lengths)
    angles = 2*np.pi*np.r_[0,np.cumsum(increments[:-1])]
    old = original[outer]-original[outer].mean(0)
    orientation = np.sign(np.sum(old[:,0]*np.roll(old[:,1],-1)-old[:,1]*np.roll(old[:,0],-1)))
    boundary = np.c_[np.cos(angles*orientation),np.sin(angles*orientation)]
    sub = adjacency[ids][:,ids].tocoo()
    row,col = list(sub.row),list(sub.col)
    for index,loop in enumerate(loops[1:]):
        virtual = len(ids)+index
        for vertex in local[loop]:
            row.extend([virtual,int(vertex)])
            col.extend([int(vertex),virtual])
    total = len(ids)+len(loops)-1
    graph = sp.coo_matrix((np.ones(len(row)),(row,col)),shape=(total,total)).tocsr()
    laplacian = sp.diags(np.asarray(graph.sum(axis=1)).ravel())-graph
    fixed = local[outer]
    free = np.setdiff1d(np.arange(total),fixed)
    mapped = np.zeros((total,2))
    mapped[fixed] = boundary
    mapped[free] = spsolve(laplacian[free][:,free].tocsc(),-laplacian[free][:,fixed]@boundary)
    face_mask = labels[triangles[:,0]]==chart
    local_tri = local[triangles[face_mask]]
    p = mapped[local_tri]
    a,b = p[:,1]-p[:,0],p[:,2]-p[:,0]
    signed = (a[:,0]*b[:,1]-a[:,1]*b[:,0])/2
    assert np.all(signed>0),chart
    old_tri = original[triangles[face_mask]]
    a,b = old_tri[:,1]-old_tri[:,0],old_tri[:,2]-old_tri[:,0]
    old_area = abs(a[:,0]*b[:,1]-a[:,1]*b[:,0]).sum()/2
    scale = np.sqrt(old_area/signed.sum())
    output[ids] = mapped[:len(ids)]*scale+original[ids].mean(axis=0)
    records.append({'chart':chart,'triangles':int(face_mask.sum()),'boundary_loops':len(loops),'virtual_cap_vertices':len(loops)-1,'positive_triangles':int((signed>0).sum()),'uv_area_preserved':True})
mapped_loops = output[inverse]
selected_faces = np.array([labels[inverse[start]] in bad_charts for start in data['face_starts']])
np.savez_compressed(ROOT/'reports/injective-uv-initialization.npz',uv=mapped_loops,selected_faces=selected_faces,triangle_loops=data['triangle_loops'])
(ROOT/'reports/injective-uv-initialization.json').write_text(json.dumps({'charts':records,'total_chart_count':int(count),'geometry_changed':False,'status':'INJECTIVE_START_REQUIRES_STRETCH_AND_PACK_QA'},indent=2))
print('INJECTIVE_UV_START_READY',len(records),flush=True)
