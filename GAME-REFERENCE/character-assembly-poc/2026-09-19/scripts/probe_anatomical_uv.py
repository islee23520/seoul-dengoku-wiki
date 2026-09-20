# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Export bounded mesh measurements for anatomical seam layout, without edits."""
import json
from pathlib import Path

import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
mesh = bpy.data.objects['Male_Base_Symmetric'].data
positions = np.empty(len(mesh.vertices)*3, np.float32)
mesh.vertices.foreach_get('co', positions)
positions = positions.reshape(-1,3)
loops = np.empty(len(mesh.loops), np.int32)
mesh.loops.foreach_get('vertex_index', loops)
starts = np.empty(len(mesh.polygons), np.int32)
counts = np.empty(len(mesh.polygons), np.int32)
mesh.polygons.foreach_get('loop_start', starts)
mesh.polygons.foreach_get('loop_total', counts)
centers = np.add.reduceat(positions[loops], starts, axis=0)/counts[:,None]
normals = np.empty(len(mesh.polygons)*3, np.float32)
mesh.polygons.foreach_get('normal', normals)
normals = normals.reshape(-1,3)
edges = np.empty(len(mesh.edges)*2, np.int32)
mesh.edges.foreach_get('vertices', edges)
np.savez_compressed(ROOT/'reports/anatomical-uv-source.npz', positions=positions, loops=loops, starts=starts, counts=counts, centers=centers, normals=normals, edges=edges.reshape(-1,2))
report = {'vertices':len(positions), 'faces':len(counts), 'local_bounds':[positions.min(axis=0).tolist(),positions.max(axis=0).tolist()], 'unwrap_properties':[{'name':p.identifier,'type':p.type,'options':[i.identifier for i in p.enum_items] if p.type=='ENUM' else None,'default':getattr(p,'default',None)} for p in bpy.ops.uv.unwrap.get_rna_type().properties if p.identifier!='rna_type']}
(ROOT/'reports/anatomical-uv-probe.json').write_text(json.dumps(report,indent=2))
print('ANATOMICAL_UV_SOURCE_READY',flush=True)
