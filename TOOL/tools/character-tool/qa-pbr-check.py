# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# character-tool exec --script qa-pbr-check.py --spec <character.character.json>
from __future__ import annotations

import json
from pathlib import Path

import bpy

request = globals()['request']
manifest_path = Path(request['spec'])
manifest = json.loads(manifest_path.read_text())
pbr = manifest['pbr']
maps = pbr['materials'][0]['maps']
root = manifest_path.parent/pbr['textureDirectory']
values = {}
for key,filename in maps.items():
    image = bpy.data.images.load(str(root/filename),check_existing=False)
    image.colorspace_settings.name = 'Non-Color'
    values[key] = list(image.pixels[:4])
    bpy.data.images.remove(image)
assert abs(values['metallicSmoothness'][0]-.4) < .01, values
assert abs(values['metallicSmoothness'][3]-.7) < .01, values
assert abs(values['occlusion'][1]-.2) < .01, values
assert abs(values['baseColor'][0]-.7) < .01, values
result = {'pixels':values,'pass':True}
