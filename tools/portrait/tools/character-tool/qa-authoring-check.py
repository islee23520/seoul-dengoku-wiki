# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# character-tool exec --input edited.blend --script qa-authoring-check.py
from __future__ import annotations

import bpy

obj = bpy.data.objects['FixtureCharacter']
keys = obj.data.shape_keys.key_blocks
delta = keys['BendTip'].data[20].co-keys['Basis'].data[20].co
assert abs(delta.x-.1) < 1e-5, delta
weights = {obj.vertex_groups[g.group].name:g.weight for g in obj.data.vertices[20].groups}
assert abs(weights['Root']-.25) < 1e-5 and abs(weights['Tip']-.75) < 1e-5, weights
tail = bpy.data.objects['FixtureRig'].data.bones['Tip'].tail_local
assert abs(tail.x-.05) < 1e-5, tail
result = {'shapeDelta':list(delta),'weights':weights,'tipTail':list(tail),'pass':True}
