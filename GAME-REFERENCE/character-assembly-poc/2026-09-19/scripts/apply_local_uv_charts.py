# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Apply audited local-chart UVs to the unchanged quad master and validate readback."""
import hashlib
import json
from pathlib import Path

import bpy
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
mesh=bpy.data.objects['Male_Base_Symmetric'].data
data=np.load(ROOT/'reports/local-chart-uv-transfer.npz')
mesh.calc_loop_triangles()
assert np.array_equal(np.array([t.loops[:] for t in mesh.loop_triangles]),data['triangle_loops'])
positions=np.empty(len(mesh.vertices)*3,np.float32)
mesh.vertices.foreach_get('co',positions)
original_position=hashlib.sha256(positions.tobytes()).hexdigest()
source=np.empty(len(mesh.loops)*2,np.float32)
mesh.uv_layers['SourceUV'].data.foreach_get('uv',source)
original_source=hashlib.sha256(source.tobytes()).hexdigest()
mesh.uv_layers['AtlasUV'].data.foreach_set('uv',data['uv'].ravel())
mesh.vertices.foreach_get('co',positions)
mesh.uv_layers['SourceUV'].data.foreach_get('uv',source)
assert original_position==hashlib.sha256(positions.tobytes()).hexdigest()
assert original_source==hashlib.sha256(source.tobytes()).hexdigest()
readback=np.empty(len(mesh.loops)*2,np.float32)
mesh.uv_layers['AtlasUV'].data.foreach_get('uv',readback)
assert np.array_equal(readback.reshape(-1,2),data['uv'])
mesh.uv_layers['AtlasUV'].active_render=True
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work/male-base-local-chart-atlas-review.blend'))
report={'geometry_hash':original_position,'source_uv_hash':original_source,'atlas_hash':hashlib.sha256(readback.tobytes()).hexdigest(),'quad_geometry_unchanged':True,'uv_readback_exact':True,'numeric_overlap_report':'male-local-chart-uv-overlap.json','checker_pending':True}
(ROOT/'reports/local-chart-uv-application.json').write_text(json.dumps(report,indent=2))
print('LOCAL_CHART_UV_APPLIED',flush=True)
