# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Internal GUI startup capture; run by character-tool launch --screenshot.
from __future__ import annotations

import sys
from pathlib import Path

import bpy

path = Path(sys.argv[sys.argv.index('--')+1])
if path.exists():
    raise FileExistsError(path)
path.parent.mkdir(parents=True,exist_ok=True)


def capture() -> None:
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            region = next(r for r in area.regions if r.type == 'WINDOW')
            with bpy.context.temp_override(area=area,region=region):
                bpy.ops.view3d.view_all(center=False)
    bpy.ops.wm.redraw_timer(type='DRAW_WIN_SWAP',iterations=1)
    bpy.ops.screen.screenshot(filepath=str(path))
    print('CHARACTER_TOOL_GUI_READY',flush=True)


bpy.app.timers.register(capture)
