# /// script
# requires-python = ">=3.13"
# dependencies = ["numpy"]
# ///
# Run: Blender -b source.blend --python build_charts.py
"""Cut anatomical disk charts on temporary meshes and assign original loops only."""
from __future__ import annotations

import heapq
import json
import sys
from collections import defaultdict
from pathlib import Path

import bpy
import numpy as np

HERE = Path(__file__).resolve().parent
sys.dont_write_bytecode = True
sys.path.insert(0, str(HERE))
from uv_common import NAMES, SOURCE, SOURCE_SHA, fingerprint


class SeamPathUnavailable(RuntimeError):
    """The inspected surface has no admissible interior opening-to-opening path."""


def boundary_cycles(faces: list[list[int]]) -> list[list[int]]:
    uses = defaultdict(list)
    for fi, face in enumerate(faces):
        for a, b in zip(face, face[1:] + face[:1]):
            uses[tuple(sorted((a, b)))].append(fi)
    adj = defaultdict(list)
    for (a, b), fs in uses.items():
        if len(fs) == 1:
            adj[a].append(b)
            adj[b].append(a)
    assert all(len(ns) == 2 for ns in adj.values())
    unseen = set(adj)
    cycles = []
    while unseen:
        start = min(unseen)
        cycle = [start]
        prev, current = start, min(adj[start])
        while current != start:
            cycle.append(current)
            prev, current = current, next(n for n in adj[current] if n != prev)
        unseen.difference_update(cycle)
        cycles.append(cycle)
    return cycles


def seam_path(points: np.ndarray, faces: list[list[int]], start: int, goals: set[int], boundary: set[int]) -> list[int]:
    adj = defaultdict(set)
    for face in faces:
        for a, b in zip(face, face[1:] + face[:1]):
            adj[a].add(b)
            adj[b].add(a)
    distance = {start: 0.0}
    previous = {}
    queue = [(0.0, start)]
    while queue:
        cost, a = heapq.heappop(queue)
        if cost != distance[a]:
            continue
        if a in goals:
            path = [a]
            while path[-1] != start:
                path.append(previous[path[-1]])
            return list(reversed(path))
        for b in sorted(adj[a]):
            if b in boundary and b not in goals:
                continue
            step = float(np.linalg.norm(points[a] - points[b]))
            new = cost + step
            if new < distance.get(b, float("inf")):
                distance[b] = new
                previous[b] = a
                heapq.heappush(queue, (new, b))
    raise SeamPathUnavailable


def unwrap_chart(obj: bpy.types.Object, face_ids: list[int], cuts: set[tuple[int, int]], label: str):
    mesh = obj.data
    selected = [mesh.polygons[i] for i in face_ids]
    loops = [l for p in selected for l in p.loop_indices]
    parent = {l:l for l in loops}

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    uses = defaultdict(list)
    for p in selected:
        ls = list(p.loop_indices)
        for a, b in zip(ls, ls[1:] + ls[:1]):
            va, vb = mesh.loops[a].vertex_index, mesh.loops[b].vertex_index
            uses[tuple(sorted((va, vb)))].append({va:a, vb:b})
    for edge, sides in uses.items():
        if len(sides) == 2 and edge not in cuts:
            for v in edge:
                parent[find(sides[1][v])] = find(sides[0][v])
    roots = sorted({find(l) for l in loops})
    index = {r:i for i,r in enumerate(roots)}
    points = [mesh.vertices[mesh.loops[r].vertex_index].co[:] for r in roots]
    faces = [[index[find(l)] for l in p.loop_indices] for p in selected]
    cycles = boundary_cycles(faces)
    edges = {tuple(sorted((a,b))) for f in faces for a,b in zip(f,f[1:]+f[:1])}
    assert len(points) - len(edges) + len(faces) == 1 and len(cycles) == 1, label
    tmp_mesh = bpy.data.meshes.new("UVTemporaryDisk")
    tmp_mesh.from_pydata(points, [], faces)
    tmp_mesh.update()
    tmp = bpy.data.objects.new("UVTemporaryDisk", tmp_mesh)
    bpy.context.scene.collection.objects.link(tmp)
    bpy.ops.object.select_all(action="DESELECT")
    tmp.select_set(True)
    bpy.context.view_layer.objects.active = tmp
    tmp_mesh.uv_layers.new(name="UVMap")
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.unwrap(method="ANGLE_BASED", margin=0.001)
    bpy.ops.object.mode_set(mode="OBJECT")
    coords = np.array([u.uv[:] for u in tmp_mesh.uv_layers.active.data])
    # Every original polygon corner has one value, including both native triangles.
    original_loops = [l for p in selected for l in p.loop_indices]
    assert len(coords) == len(original_loops)
    result = {"name": label, "object": obj.name, "faces": face_ids, "loops": original_loops,
              "uv": coords.tolist(), "euler": 1, "boundary_count": 1,
              "ordered_boundary_temporary_vertices": cycles[0], "temporary_faces": faces,
              "temporary_vertices": points, "cuts": [list(e) for e in sorted(cuts)]}
    bpy.data.objects.remove(tmp, do_unlink=True)
    bpy.data.meshes.remove(tmp_mesh)
    return result


before = {name:fingerprint(bpy.data.objects[name]) for name in (*NAMES, "Female_Base_Composed_Candidate")}
(HERE / "source-semantic-fingerprints.json").write_text(json.dumps(before, indent=2))
charts = []
inspection = {}
for name in NAMES:
    obj = bpy.data.objects[name]
    mesh = obj.data
    half = len(mesh.vertices)//2
    points = np.array([v.co[:] for v in mesh.vertices])
    inner = [p.index for p in mesh.polygons if max(p.vertices) < half]
    outer = [p.index for p in mesh.polygons if min(p.vertices) >= half]
    faces = [list(mesh.polygons[i].vertices) for i in inner]
    lookup = {tuple(sorted(v-half for v in mesh.polygons[i].vertices)):i for i in outer}
    correspondence = [[i, lookup[tuple(sorted(mesh.polygons[i].vertices))]] for i in inner]
    cycles = boundary_cycles(faces)
    boundary = set(v for c in cycles for v in c)
    cuts = set()
    paths = []
    if len(cycles) == 2:
        # One posterior seam from the lower to upper torso aperture.
        low, high = sorted(cycles, key=lambda c:points[c,2].mean())
        start = max(low, key=lambda v:points[v,1] - 3*abs(points[v,0]))
        paths.append(seam_path(points, faces, start, set(high), boundary))
    else:
        assert len(cycles) == 3
        waist = max(cycles, key=lambda c:points[c,2].mean())
        legs = [c for c in cycles if c is not waist]
        for leg in legs:
            sign = 1 if points[leg,0].mean() > 0 else -1
            start = max(waist, key=lambda v:sign*points[v,0])
            goals = {v for v in leg if sign*points[v,0] > 0.02}
            paths.append(seam_path(points, faces, start, goals, boundary))
    for path in paths:
        cuts.update(tuple(sorted(e)) for e in zip(path,path[1:]))
    for layer, face_ids, offset in [("inner", inner, 0), ("outer", outer, half)]:
        layer_cuts = {(a+offset,b+offset) for a,b in cuts}
        charts.append(unwrap_chart(obj, face_ids, layer_cuts, name.removeprefix("Female_")+"_"+layer))
    rims = [p for p in mesh.polygons if min(p.vertices)<half<=max(p.vertices)]
    for ci, cycle in enumerate(cycles):
        # Arc-length strip: continuous along aperture; one thickness edge cut.
        cycle = cycle + cycle[:1]
        lengths = [0.0]
        for a,b in zip(cycle,cycle[1:]):
            lengths.append(lengths[-1] + float((np.linalg.norm(points[a]-points[b])+np.linalg.norm(points[a+half]-points[b+half]))/2))
        rim_faces, rim_loops, coords = [], [], []
        for j,(a,b) in enumerate(zip(cycle,cycle[1:])):
            p = next(p for p in rims if set(p.vertices)=={a,b,a+half,b+half})
            rim_faces.append(p.index)
            for l in p.loop_indices:
                v = mesh.loops[l].vertex_index
                base = v%half
                x = lengths[j] if base==a else lengths[j+1]
                y = 0.0 if v<half else float(np.linalg.norm(points[base+half]-points[base]))
                rim_loops.append(l)
                coords.append([x,y])
        charts.append({"name":name.removeprefix("Female_")+f"_rim_{ci+1}", "object":name,
                       "faces":rim_faces,"loops":rim_loops,"uv":coords,"euler":1,"boundary_count":1,
                       "ordered_aperture_vertices":cycle, "length_m":lengths[-1]})
    inspection[name] = {"inner_outer_face_correspondence":correspondence,"seam_paths":paths,
                        "seam_world_coordinates":[points[p].tolist() for p in paths],
                        "ordered_openings":cycles, "source_properties":dict(obj.items())}
assert before == {name:fingerprint(bpy.data.objects[name]) for name in before}
(HERE / "unpacked-charts-attempt-01.json").write_text(json.dumps(charts, indent=2))
(HERE / "chart-construction.json").write_text(json.dumps(inspection, indent=2))
print("CHARTS_COMPLETE", [(c["name"],len(c["faces"])) for c in charts], flush=True)
