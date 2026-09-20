# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Cut only small connected overlap neighborhoods from existing anatomical charts."""
import json
import runpy
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
obj = bpy.data.objects['Male_Base_Symmetric']
mesh = obj.data
data = np.load(ROOT/'reports/male-tessellation-uv-triangles.npz')
audit = json.loads((ROOT/'reports/male-tessellation-uv-overlap.json').read_text())
polygons = data['polygon_ids']
bad = {int(polygons[i]) for pair in audit['positive_area_overlap_pairs'] for i in pair['triangles']}
bm = bmesh.new()
bm.from_mesh(mesh)
tag = bm.faces.layers.int.new('UVBoundaryRefinement')
bm.faces.ensure_lookup_table()
region = bm.faces.layers.int['AnatomicalUVRegion']
seed = {bm.faces[i] for i in bad}
grown = set(seed)
for depth in range(2):
    grown.update(other for f in list(grown) for e in f.edges if not e.seam for other in e.link_faces if other[region] == f[region])
remaining = set(grown)
groups = []
while remaining:
    start = remaining.pop()
    stack, group = [start], {start}
    while stack:
        face = stack.pop()
        for edge in face.edges:
            if edge.seam:
                continue
            for neighbor in edge.link_faces:
                if neighbor in remaining:
                    remaining.remove(neighbor)
                    stack.append(neighbor)
                    group.add(neighbor)
    groups.append(group)
records = []
for index, group in enumerate(groups, 1):
    perimeter = {e for f in group for e in f.edges if any(other not in group for other in e.link_faces)}
    for edge in perimeter:
        edge.seam = True
    for face in group:
        face[tag] = index
    vertices = {v for f in group for v in f.verts}
    records.append({'faces':len(group),'seam_edges':len(perimeter),'center':[sum(v.co[a] for v in vertices)/len(vertices) for a in range(3)]})
bm.to_mesh(mesh)
bm.free()
(ROOT/'reports/anatomical-seam-refinement.json').write_text(json.dumps({'seed_polygons':len(bad),'local_regions':records,'geometry_changed':False},indent=2))
sys.argv=[__file__,'--','seam-refined']
runpy.run_path(str(ROOT/'scripts/unwrap_actual_tessellation.py'),run_name='__main__')
