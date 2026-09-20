# /// script
# requires-python = ">=3.13"
# dependencies = ["numpy"]
# ///
# Run: Blender -b candidate.blend --python measure_quality.py
"""Measure native triangle distortion, density and exact inter-chart boundary gaps."""
from __future__ import annotations

import json
import math
from collections import defaultdict
from pathlib import Path

import bpy
import numpy as np

HERE = Path(__file__).resolve().parent
final = Path(bpy.data.filepath).name == "female-garment-uv.blend"
assignment = json.loads((HERE / ("original-loop-assignment.json" if final else "assignment-attempt-01.json")).read_text())
charts = assignment["charts"]
metrics = []
boundaries = []
for chart in charts:
    mesh = bpy.data.objects[chart["object"]].data
    mesh.calc_loop_triangles()
    uv = mesh.uv_layers.active
    areas, uv_areas, stretches, densities = [], [], [], []
    signed = []
    face_ids = set(chart["faces"])
    for t in mesh.loop_triangles:
        if t.polygon_index not in face_ids:
            continue
        xyz = np.array([mesh.vertices[i].co[:] for i in t.vertices])
        uvs = np.array([uv.data[i].uv[:] for i in t.loops])
        a, b = xyz[1]-xyz[0], xyz[2]-xyz[0]
        length = np.linalg.norm(a)
        x = float(np.dot(a,b)/length)
        y = float(np.linalg.norm(np.cross(a,b))/length)
        local = np.array([[length,x],[0,y]])
        jacobian = np.column_stack((uvs[1]-uvs[0],uvs[2]-uvs[0])) @ np.linalg.inv(local)
        singular = np.linalg.svd(jacobian,compute_uv=False)
        world_area = float(length*y/2)
        determinant = float(np.linalg.det(jacobian))
        areas.append(world_area)
        uv_areas.append(abs(determinant)*world_area)
        stretches.append(float(singular[0]/singular[1]))
        densities.append(math.sqrt(abs(determinant))*4096)
        signed.append(determinant)
    weights = np.array(areas)
    order = np.argsort(stretches)
    cumulative = np.cumsum(weights[order])/sum(weights)
    quantiles = {str(q):float(np.array(stretches)[order][min(np.searchsorted(cumulative,q),len(order)-1)]) for q in (0.5,0.9,0.95,0.99,1.0)}
    edges = defaultdict(list)
    for pi in chart["faces"]:
        ls = list(mesh.polygons[pi].loop_indices)
        for a,b in zip(ls,ls[1:]+ls[:1]):
            endpoints = [tuple(uv.data[l].uv) for l in (a,b)]
            edges[tuple(sorted(endpoints))].append(pi)
    boundary = [list(e) for e,fs in edges.items() if len(fs)==1]
    adjacency = defaultdict(set)
    for a,b in boundary:
        adjacency[a].add(b)
        adjacency[b].add(a)
    assert all(len(v)==2 for v in adjacency.values()), chart["name"]
    start = min(adjacency)
    ordered = [start]
    previous,current = start,min(adjacency[start])
    while current != start:
        ordered.append(current)
        previous,current = current,next(v for v in adjacency[current] if v!=previous)
    assert len(ordered) == len(adjacency), chart["name"]
    vertices = {v for e in edges for v in e}
    assert len(vertices)-len(edges)+len(face_ids)==1, chart["name"]
    boundaries.append(np.array(boundary))
    coords = np.array(chart["uv"])
    metrics.append({"chart":chart["name"],"world_area_m2":sum(areas),"uv_area":sum(uv_areas),
                    "aggregate_density_px_per_m":math.sqrt(sum(uv_areas)/sum(areas))*4096,
                    "triangle_density_min_max_px_per_m":[min(densities),max(densities)],
                    "area_weighted_anisotropy_quantiles":quantiles,
                    "positive_orientation":sum(v>0 for v in signed),"negative_orientation":sum(v<0 for v in signed),
                    "bounds":[coords.min(axis=0).tolist(),coords.max(axis=0).tolist()],"boundary_segments":len(boundary),
                    "saved_native_disk_euler":1,"saved_native_boundary_count":1,"ordered_boundary_uv":ordered})


def point_segment_distance(points: np.ndarray, segments: np.ndarray) -> float:
    a,b = segments[:,0,:],segments[:,1,:]
    direction = b-a
    delta = points[:,None,:]-a[None,:,:]
    t = np.clip(np.sum(delta*direction[None,:,:],axis=2)/np.sum(direction*direction,axis=1)[None,:],0,1)
    distance = np.linalg.norm(delta-t[:,:,None]*direction[None,:,:],axis=2)
    return float(distance.min())


gaps = []
for i,a in enumerate(boundaries):
    for j in range(i+1,len(boundaries)):
        b = boundaries[j]
        distance = min(point_segment_distance(a.reshape(-1,2),b),point_segment_distance(b.reshape(-1,2),a))
        gaps.append({"charts":[charts[i]["name"],charts[j]["name"]],"gap_px_4k":distance*4096})
all_uv = np.concatenate([np.array(c["uv"]) for c in charts])
report = {"atlas_size":4096,"chart_count":len(charts),"charts":metrics,"inter_chart_gaps":gaps,
          "minimum_inter_chart_padding_px":min(g["gap_px_4k"] for g in gaps),
          "minimum_tile_border_px":float(min(all_uv.min(),1-all_uv.max())*4096),
          "atlas_surface_occupancy":sum(m["uv_area"] for m in metrics),
          "chart_density_max_min_ratio":max(m["aggregate_density_px_per_m"] for m in metrics)/min(m["aggregate_density_px_per_m"] for m in metrics),
          "owner_approved_density_target":False}
(HERE / ("quality.json" if final else "quality-attempt-01.json")).write_text(json.dumps(report,indent=2))
print("QUALITY_COMPLETE",json.dumps({k:v for k,v in report.items() if k not in {"charts","inter_chart_gaps"}}),flush=True)
print("DISTORTION",[(m["chart"],m["area_weighted_anisotropy_quantiles"]) for m in metrics],flush=True)
