# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run inside Blender via character-tool setup/doctor.
from __future__ import annotations

import hashlib
import json
import platform
import tempfile
import importlib
from pathlib import Path
from zipfile import ZipFile

import addon_utils
import bpy

from blender_common import Json, WorkError

ROOT = Path(__file__).resolve().parent


def inventory() -> Json:
    manifests = json.loads((ROOT / 'addons.json').read_text())
    modules = {m.__name__: m for m in addon_utils.modules(refresh=True)}
    addons = []
    for item in manifests:
        module = modules.get(item['module'])
        entry = {'module': item['module'], 'available': module is not None,
                 'loaded': addon_utils.check(item['module'])[1] if module else False,
                 'version': list(module.bl_info.get('version', ())) if module else None}
        if module and item['module'] == 'voxel_skinning':
            machine = platform.machine().lower()
            sub = 'arm64' if machine in ('arm64', 'aarch64') else 'x64' if machine in ('x86_64', 'amd64') else 'x86'
            directory = Path(module.__file__).parent / 'bin' / platform.system()
            if platform.system() != 'Darwin':
                directory /= sub
            binary = directory / ('vhd.exe' if platform.system() == 'Windows' else 'vhd')
            from blender_heat import solver_path
            try:
                solver_path('voxel')
                supported = True
            except WorkError:
                supported = False
            entry['solver'] = {'path': str(binary), 'exists': binary.is_file(),
                               'supported': supported,
                               'execution': 'rosetta2' if platform.system() == 'Darwin' and machine == 'arm64' else 'native'}
        addons.append(entry)
    return {'blender': bpy.app.binary_path, 'version': bpy.app.version_string,
            'platform': platform.system(), 'architecture': platform.machine(),
            'addons': addons, 'auth': 'not-required', 'mode': 'local'}


def setup(request) -> Json:
    manifest = json.loads((ROOT / 'addons.json').read_text())
    selected = request.get('addons', 'auto_rig_pro,rig_tools,weight_paint_tools,proxy_picker').split(',')
    known = {item['module']: item for item in manifest}
    if any(name not in known for name in selected):
        raise WorkError('ADDON_UNKNOWN', 'Unknown add-on; inspect addons.json for supported modules')
    directory = Path(request.get('addon-dir', ROOT.parent.parent / 'blender-addons'))
    available = {m.__name__: m for m in addon_utils.modules(refresh=True)}
    # Verify all requested inputs before installing any of them.
    for name in selected:
        item = known[name]
        archive = directory / item['file']
        if not archive.is_file():
            raise WorkError('ADDON_ARCHIVE_MISSING', str(archive))
        if hashlib.sha256(archive.read_bytes()).hexdigest() != item['sha256']:
            raise WorkError('ADDON_HASH', f'Archive hash mismatch: {archive}')
        with ZipFile(archive) as zipped:
            if any(Path(n).is_absolute() or '..' in Path(n).parts for n in zipped.namelist()):
                raise WorkError('ADDON_ARCHIVE', f'Unsafe archive entry: {archive}')
        existing = available.get(name)
        if existing and list(existing.bl_info.get('version', ())) != item['version']:
            raise WorkError('ADDON_VERSION', f'{name} has a different installed version; refusing replacement')
    actions = []
    for name in selected:
        if name not in available:
            archive = directory / known[name]['file']
            # The owner-supplied ARP ZIP uses a GitHub '-master' folder, not its import module name.
            # Repackage only the verified archive in a temporary directory; never modify the source ZIP.
            with tempfile.TemporaryDirectory(prefix='character-addon-') as temporary:
                normalized = Path(temporary) / (name+'.zip')
                with ZipFile(archive) as original, ZipFile(normalized,'w') as packaged:
                    roots = {entry.filename.split('/')[0] for entry in original.infolist() if entry.filename}
                    if len(roots) != 1:
                        raise WorkError('ADDON_LAYOUT', f'Expected one module directory in {archive}')
                    source_root = next(iter(roots))
                    for entry in original.infolist():
                        entry.filename = name + entry.filename[len(source_root):]
                        original_name = source_root + entry.filename[len(name):]
                        packaged.writestr(entry, original.read(original_name))
                bpy.ops.preferences.addon_install(filepath=str(normalized), overwrite=False)
            importlib.invalidate_caches()
            addon_utils.modules(refresh=True)
        errors = []
        addon_utils.enable(name, default_set=True, persistent=True, handle_error=lambda error: errors.append(str(error)))
        if errors or name not in bpy.context.preferences.addons:
            raise WorkError('ADDON_ENABLE', f'Could not enable {name}')
        actions.append({'module': name, 'action': 'enabled' if name in available else 'installed'})
    if 'voxel_skinning' in selected:
        from blender_heat import solver_path
        for engine in ['voxel','surface']:
            binary = solver_path(engine)
            if platform.system() != 'Windows':
                binary.chmod(binary.stat().st_mode | 0o111)
    bpy.ops.wm.save_userpref()
    return {'actions': actions, 'capabilities': inventory()}
