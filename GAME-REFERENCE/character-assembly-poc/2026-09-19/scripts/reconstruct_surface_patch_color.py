# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "scipy"]
# ///
"""Solve local color Dirichlet problems; retain source texture outside defect masks."""
import json
from pathlib import Path

import numpy as np
import scipy.sparse as sp
from scipy.sparse.csgraph import connected_components
from scipy.sparse.linalg import spsolve

ROOT=Path(__file__).resolve().parents[1]
data=np.load(ROOT/'reports/surface-color-repair-input.npz')
positions=data['positions'];edges=data['edges'];loops=data['loop_vertices']
starts=data['face_starts'];sizes=data['face_sizes'];materials=data['material_indices'];source=data['colors'].astype(float)
face_of_loop=np.repeat(np.arange(len(starts)),sizes)
centers=np.add.reduceat(positions[loops],starts,axis=0)/sizes[:,None]
tag=data['VerifiedQuadRepair']!=0
wrong_head_material=(materials==0)&(centers[:,2]>1.62)
patch_faces=tag|wrong_head_material
# Explicitly reconstruct the narrow original material join plus adjacent source
# rows. Geodesic coloring stays on this connected surface, never across air gaps.
seam_vertices=data['seam_weights']>0
seam_faces=np.any(seam_vertices[loops].reshape(-1,1),axis=1)
seam_faces=np.add.reduceat(seam_faces.astype(int),starts)>0
seam_faces &= (centers[:,2]>1.53)&(centers[:,2]<1.615)&(abs(centers[:,0])<.085)
defect_faces=patch_faces|seam_faces
length=np.linalg.norm(positions[edges[:,0]]-positions[edges[:,1]],axis=1)
weights=1/np.maximum(length,1e-8)
graph=sp.coo_matrix((np.r_[weights,weights],(np.r_[edges[:,0],edges[:,1]],np.r_[edges[:,1],edges[:,0]])),shape=(len(positions),len(positions))).tocsr()
degree=np.asarray(graph.sum(axis=1)).ravel()
lap=sp.diags(degree)-graph
affected=np.unique(loops[defect_faces[face_of_loop]])
num,labels=connected_components(graph[affected][:,affected],directed=False)
repaired=np.zeros((len(positions),3),float)
coverage=np.zeros(len(positions),bool)
receipts=[]
for label in range(num):
    vertices=affected[labels==label]
    local_set=np.zeros(len(positions),bool);local_set[vertices]=True
    healthy_loops=(~defect_faces[face_of_loop])&local_set[loops]
    boundary=np.unique(loops[healthy_loops])
    interior=np.setdiff1d(vertices,boundary)
    assert len(boundary)>=3
    colors=np.zeros((len(positions),3),float)
    for vertex in boundary:
        samples=source[healthy_loops&(loops==vertex),:3]
        colors[vertex]=np.median(samples,axis=0)
    if len(interior):
        colors[interior]=spsolve(lap[interior][:,interior].tocsc(),-lap[interior][:,boundary]@colors[boundary])
    assert np.isfinite(colors[vertices]).all()
    lower=colors[boundary].min(0)-1e-6;upper=colors[boundary].max(0)+1e-6
    assert np.all(colors[vertices]>=lower)&np.all(colors[vertices]<=upper)
    repaired[vertices]=colors[vertices]
    coverage[vertices]=True
    receipts.append({'vertices':len(vertices),'boundary_vertices':len(boundary),'interior_vertices':len(interior),'center':positions[vertices].mean(0).tolist(),'color_min':colors[vertices].min(0).tolist(),'color_max':colors[vertices].max(0).tolist()})
mask=np.zeros(len(loops),np.float32)
mask[defect_faces[face_of_loop]]=1
corrected=source.copy()
corrected[mask>0,:3]=repaired[loops[mask>0]]
# Blend over one healthy adjacent row only when a UV seam has a genuine boundary
# color mismatch; do not replace the rest of the face/body texture with flat colors.
vertex_mask=np.zeros(len(positions),float);vertex_mask[affected]=1
adjacent=np.asarray((graph>0)@vertex_mask).ravel()>0
feather=(~defect_faces[face_of_loop])&adjacent[loops]&coverage[loops]
mask[feather]=.25
corrected[feather,:3]=repaired[loops[feather]]
assert np.array_equal(corrected[mask==0],source[mask==0])
np.savez_compressed(ROOT/'reports/surface-patch-color-reconstruction.npz',colors=corrected.astype(np.float32),mask=mask,defect_faces=defect_faces,wrong_head_material_faces=wrong_head_material)
report={'repair_tag_faces':int(tag.sum()),'wrong_material_head_faces':int(wrong_head_material.sum()),'unlabeled_wrong_head_faces':int((wrong_head_material&~tag).sum()),'seam_transition_faces':int(seam_faces.sum()),'corrected_faces':int(defect_faces.sum()),'corrected_regions':len(receipts),'masked_loops':int((mask>0).sum()),'unchanged_loops':int((mask==0).sum()),'outside_mask_source_colors_unchanged':True,'geometry_changed':False,'regions':receipts,'status':'COLOR_FIELD_CANDIDATE_REQUIRES_TEXTURED_RENDER'}
(ROOT/'reports/surface-patch-color-reconstruction.json').write_text(json.dumps(report,indent=2))
print('SURFACE_PATCH_COLOR_RECONSTRUCTED',len(receipts),'regions',flush=True)
