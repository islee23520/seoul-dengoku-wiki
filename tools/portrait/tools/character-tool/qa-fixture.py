# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run with character-tool exec --script qa-fixture.py --output <new-fixture.blend>.
from __future__ import annotations

import json
from pathlib import Path

import bpy

from blender_common import output_path

request = globals()['request']
output = output_path(request['output'], ('.blend',))
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
# An asymmetric articulated test character, deliberately offset and oversized.
# Closed connected cylinder-like mesh is a reliable heat-weight fixture.
vertices = []
faces = []
for z, radius in [(0, .22), (.4, .28), (.8, .35), (1.2, .3), (1.6, .2), (2, .16)]:
    for x, y in [(-1,-1),(1,-1),(1,1),(-1,1)]:
        vertices.append((x * radius + 3, y * radius - 2, z * 2 + 1))
for ring in range(5):
    for corner in range(4):
        a = ring * 4 + corner
        b = ring * 4 + (corner + 1) % 4
        faces.append((a,b,b+4,a+4))
faces.extend([(3,2,1,0),(20,21,22,23)])
mesh = bpy.data.meshes.new('FixtureMesh')
mesh.from_pydata(vertices, [], faces)
mesh.update()
obj = bpy.data.objects.new('FixtureCharacter', mesh)
bpy.context.collection.objects.link(obj)
material = bpy.data.materials.new('FixtureBlue')
material.diffuse_color = (.08,.35,.7,1)
obj.data.materials.append(material)
bpy.ops.wm.save_as_mainfile(filepath=str(output))
skeleton = output.with_suffix('.skeleton.json')
skeleton.write_text(json.dumps({'name':'FixtureRig','bones':[
    {'name':'Root','head':[0,0,0],'tail':[0,0,1]},
    {'name':'Tip','head':[0,0,1],'tail':[0,0,2],'parent':'Root'}]}))
result = {'fixture':str(output), 'skeleton':str(skeleton)}
