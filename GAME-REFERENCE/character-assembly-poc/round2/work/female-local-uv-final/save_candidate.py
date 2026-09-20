"""Apply unique per-loop UV values; verify all preservation hashes on reload."""
from __future__ import annotations

import hashlib
import importlib
import json
import sys
from pathlib import Path

import numpy as np

bpy = __import__('bpy')
HERE = Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
extraction = importlib.import_module('extract_graph')
NAME, SOURCE, state = extraction.NAME, extraction.SOURCE, extraction.state


def main() -> None:
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE),load_ui=False)
    obj = bpy.data.objects[NAME]
    before = state(obj)
    uv = np.load(HERE/'repaired-loops.npz')['uv']
    original = np.asarray([l.uv[:] for l in obj.data.uv_layers['AtlasUV'].data],np.float64)
    changed = np.flatnonzero(np.any(uv!=original,axis=1))
    for loop in changed:
        obj.data.uv_layers['AtlasUV'].data[int(loop)].uv = uv[loop]
    obj.data.uv_layers.active = obj.data.uv_layers['AtlasUV']
    assert state(obj)==before
    output = HERE/'female-local-uv-final.blend'
    bpy.ops.wm.save_as_mainfile(filepath=str(output),compress=True)
    bpy.ops.wm.open_mainfile(filepath=str(output),load_ui=False)
    obj = bpy.data.objects[NAME]
    after = state(obj)
    assert before==after
    result = np.asarray([l.uv[:] for l in obj.data.uv_layers['AtlasUV'].data],np.float64)
    assert np.array_equal(result,uv)
    mesh = obj.data
    graph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(graph)
    native = evaluated.to_mesh(preserve_all_data_layers=True,depsgraph=graph)
    try:
        native.calc_loop_triangles()
        layer = native.uv_layers['AtlasUV']
        triangles = [{'triangle_id':i,'polygon_id':int(t.polygon_index),'loop_ids':list(t.loops),
                      'uv':[list(layer.data[l].uv) for l in t.loops]} for i,t in enumerate(native.loop_triangles)]
    finally:
        evaluated.to_mesh_clear()
    payload = {'schema_version':1,'source':{'path':str(output),'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'blender_version':bpy.app.version_string},
               'meshes':[{'object_name':NAME,'status':'OK','uv_layer':'AtlasUV','triangle_count':len(triangles),'triangles':triangles}]}
    (HERE/'final-native-extraction.json').write_text(json.dumps(payload))
    face_of_loop = np.empty(len(mesh.loops),np.int32)
    for p in mesh.polygons:
        face_of_loop[list(p.loop_indices)] = p.index
    np.savez_compressed(HERE/'target-loop-export.npz',uv=result,loop_ids=np.arange(len(result),dtype=np.int32),
                        polygon_ids=face_of_loop,vertex_ids=np.asarray([l.vertex_index for l in mesh.loops],np.int32),
                        original_uv=original,delta=result-original,changed_loop_ids=changed)
    records = [{'loop_id':int(l),'polygon_id':int(face_of_loop[l]),'vertex_id':int(mesh.loops[int(l)].vertex_index),
                'before':original[l].tolist(),'after':result[l].tolist(),'delta':(result[l]-original[l]).tolist()} for l in changed]
    (HERE/'per-loop-delta.json').write_text(json.dumps(records,indent=2))
    report = {'candidate':payload['source'],'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
              'preserved':before==after,'before':before,'after':after,'changed_loop_count':len(changed),
              'unchanged_loop_count':len(result)-len(changed),'changed_polygon_count':len(set(face_of_loop[changed].tolist())),
              'color_status':'UNPROVEN; retained old atlas material is stale on changed loops; no fresh bake claimed'}
    (HERE/'preservation-report.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({'event':'SAVED_RELOADED','preserved':True,'loops':len(changed),'faces':report['changed_polygon_count']}),flush=True)


if __name__ == '__main__':
    main()
