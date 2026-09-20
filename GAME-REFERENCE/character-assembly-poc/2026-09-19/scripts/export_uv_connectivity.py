# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Extract per-loop atlas topology for local, seam-preserving UV untangling."""
from pathlib import Path
import sys

import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
stage = sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'anatomical'
mesh = bpy.data.objects['Male_Base_Symmetric'].data
mesh.calc_loop_triangles()
positions = np.empty(len(mesh.vertices)*3, np.float32)
mesh.vertices.foreach_get('co', positions)
loops = np.empty(len(mesh.loops), np.int32)
mesh.loops.foreach_get('vertex_index', loops)
uv = np.empty(len(mesh.loops)*2, np.float32)
mesh.uv_layers['AtlasUV'].data.foreach_get('uv', uv)
starts = np.empty(len(mesh.polygons), np.int32)
sizes = np.empty(len(mesh.polygons), np.int32)
mesh.polygons.foreach_get('loop_start', starts)
mesh.polygons.foreach_get('loop_total', sizes)
np.savez_compressed(ROOT/f'reports/{stage}-uv-connectivity.npz',
                   positions=positions.reshape(-1,3), loop_vertices=loops,
                   uv=uv.reshape(-1,2), face_starts=starts, face_sizes=sizes,
                   triangle_loops=np.array([t.loops[:] for t in mesh.loop_triangles], np.int32),
                   triangle_polygons=np.array([t.polygon_index for t in mesh.loop_triangles], np.int32))
print('UV_CONNECTIVITY_EXPORTED', flush=True)
