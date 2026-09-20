# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Export unchanged molar topology for bounded self-intersection repair candidates."""
from pathlib import Path
import bpy
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
mesh=bpy.data.objects['Male_UpperMolar_positive_Repaired'].data
mesh.calc_loop_triangles()
edges=np.empty(len(mesh.edges)*2,np.int32);mesh.edges.foreach_get('vertices',edges)
loops=np.empty(len(mesh.loops),np.int32);mesh.loops.foreach_get('vertex_index',loops)
starts=np.empty(len(mesh.polygons),np.int32);mesh.polygons.foreach_get('loop_start',starts)
sizes=np.empty(len(mesh.polygons),np.int32);mesh.polygons.foreach_get('loop_total',sizes)
np.savez_compressed(ROOT/'reports/molar-repair-connectivity.npz',positions=np.array([v.co[:] for v in mesh.vertices]),edges=edges.reshape(-1,2),loops=loops,starts=starts,sizes=sizes,triangles=np.array([t.vertices[:] for t in mesh.loop_triangles]),polygon_ids=np.array([t.polygon_index for t in mesh.loop_triangles]))
print('MOLAR_REPAIR_CONNECTIVITY_READY',flush=True)
