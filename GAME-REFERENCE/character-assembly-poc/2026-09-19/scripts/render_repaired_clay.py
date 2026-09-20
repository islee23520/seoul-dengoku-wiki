# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Separate repaired geometry QA from source-texture UV damage."""
import runpy
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]
material = bpy.data.materials.new('RepairReview_Clay_Only')
material.use_nodes = True
shader = material.node_tree.nodes['Principled BSDF']
shader.inputs['Base Color'].default_value = (.42, .32, .25, 1)
shader.inputs['Roughness'].default_value = .8
for layer in bpy.context.scene.view_layers:
    layer.material_override = material
sys.argv = [__file__, '--', 'doll-sources-clay', 'Male_Head', 'Female_Head', 'Male_Body', 'Female_Body']
runpy.run_path(str(ROOT / 'scripts/render_stage.py'), run_name='__main__')
