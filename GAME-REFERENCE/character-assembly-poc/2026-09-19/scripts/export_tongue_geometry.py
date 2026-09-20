# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Extract geometry for triangle-level inspection, preserving the Blender source."""
from pathlib import Path

import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
mesh = bpy.data.objects['Male_Tongue_Repaired'].data
mesh.calc_loop_triangles()
positions = np.empty(len(mesh.vertices)*3, np.float32)
mesh.vertices.foreach_get('co', positions)
edges = np.empty(len(mesh.edges)*2, np.int32)
mesh.edges.foreach_get('vertices', edges)
loops = np.empty(len(mesh.loops), np.int32)
mesh.loops.foreach_get('vertex_index', loops)
starts = np.empty(len(mesh.polygons), np.int32)
sizes = np.empty(len(mesh.polygons), np.int32)
mesh.polygons.foreach_get('loop_start', starts)
mesh.polygons.foreach_get('loop_total', sizes)
normals = np.empty(len(mesh.polygons)*3, np.float32)
mesh.polygons.foreach_get('normal', normals)
np.savez_compressed(ROOT/'reports/tongue-geometry.npz', positions=positions.reshape(-1,3), edges=edges.reshape(-1,2), loop_vertices=loops, face_starts=starts, face_sizes=sizes, face_normals=normals.reshape(-1,3), triangles=np.array([t.vertices[:] for t in mesh.loop_triangles], np.int32), triangle_polygons=np.array([t.polygon_index for t in mesh.loop_triangles], np.int32))
print('TONGUE_TRIANGLE_DATA_READY', flush=True)
