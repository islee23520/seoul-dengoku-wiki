# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# How to run: Blender --background --python worker.py -- request.json response.json
# This script uses Blender's bundled Python, not a system Python environment.
from __future__ import annotations

import json
import runpy
import sys
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from blender_common import WorkError, inspect_scene, load_model
from blender_setup import inventory, setup


def main() -> None:
    request_path, response_path = sys.argv[sys.argv.index('--') + 1:]
    request = {}
    try:
        request = json.loads(Path(request_path).read_text())
        command = request['command']
        if request.get('input') and not request.get('inputLoaded'):
            load_model(request['input'])
        match command:
            case 'doctor':
                data = inventory()
            case 'setup':
                data = setup(request)
            case 'inspect':
                data = inspect_scene(request.get('require-rig', False))
            case 'exec':
                script = Path(request['script'])
                if not script.is_file():
                    raise WorkError('SCRIPT_MISSING', str(script))
                data = runpy.run_path(str(script), init_globals={'request': request}).get('result')
            case 'align' | 'rig-template' | 'rig' | 'export' | 'render':
                from blender_ops import operate
                data = operate(request)
            case 'weld' | 'shape-key' | 'rig-edit' | 'skin-edit':
                from blender_edit import edit
                data = edit(request)
            case _:
                raise WorkError('COMMAND_UNKNOWN', command)
        response = {'ok': True, 'data': data}
    except Exception as error:
        # CLI boundary: preserve traceback in process log and a machine-readable failure receipt.
        traceback.print_exc()
        response = {'ok': False, 'error': {'code': error.code if isinstance(error, WorkError) else 'BLENDER_ERROR', 'message': str(error)}}
    Path(response_path).write_text(json.dumps(response, allow_nan=False), encoding='utf-8')
    if request.get('command') == 'setup' or request.get('gui'):
        import bpy
        def finish():
            try:
                if request.get('screenshot') and response['ok']:
                    bpy.ops.wm.redraw_timer(type='DRAW_WIN_SWAP', iterations=1)
                    bpy.ops.screen.screenshot(filepath=request['screenshot'])
            finally:
                bpy.ops.wm.quit_blender()
        for area in bpy.context.screen.areas if bpy.context.screen else []:
            if area.type == 'VIEW_3D':
                region = next(r for r in area.regions if r.type == 'WINDOW')
                with bpy.context.temp_override(area=area, region=region):
                    bpy.ops.view3d.view_all(center=False)
        bpy.app.timers.register(finish)


if __name__ == '__main__':
    main()
