# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# character-tool exec --script tools/portrait-fixture.py --output /new/fixture.glb
from __future__ import annotations

import sys
from pathlib import Path
import bpy

sys.path.insert(0,str(Path(__file__).resolve().parent/'character-tool'))
from blender_common import output_path
from qa_portrait_fixture import create_fixture

request = globals()['request']
path = output_path(request['output'],('.glb',))
create_fixture()
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB')
result = {'output':str(path),'fixture':True}
