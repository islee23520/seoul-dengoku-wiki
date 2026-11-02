# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Creates only a QA duplicate-vertex input in a new file.
from __future__ import annotations

import bmesh
import bpy
from blender_common import output_path

request = globals()['request']
path = output_path(request['output'],('.blend',))
obj = bpy.data.objects['FixtureCharacter']
mesh = bmesh.new()
mesh.from_mesh(obj.data)
mesh.verts.ensure_lookup_table()
mesh.verts.new(mesh.verts[0].co)
mesh.to_mesh(obj.data)
mesh.free()
bpy.ops.wm.save_as_mainfile(filepath=str(path))
result = {'vertices':len(obj.data.vertices),'output':str(path)}
