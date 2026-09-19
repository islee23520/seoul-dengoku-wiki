# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Uses the supplied Mesh Online solver binaries and file protocol; no algorithm fallback.
from __future__ import annotations

import math
import platform
import subprocess
import tempfile
from pathlib import Path

import addon_utils
import bpy

from blender_common import WorkError, select


def solver_path(engine: str) -> Path:
    module = next((m for m in addon_utils.modules() if m.__name__ == 'voxel_skinning'),None)
    if module is None:
        raise WorkError('HEAT_ADDON_MISSING', 'Install voxel_skinning with character-tool setup --addons voxel_skinning')
    system, machine = platform.system(), platform.machine().lower()
    directory = Path(module.__file__).parent / 'bin' / system
    if system != 'Darwin':
        architecture = {'amd64':'x64','x86_64':'x64','arm64':'arm64','aarch64':'arm64','x86':'x86','i386':'x86'}.get(machine)
        if architecture is None:
            raise WorkError('HEAT_PLATFORM', f'Unsupported architecture: {machine}')
        directory /= architecture
    name = 'vhd' if engine == 'voxel' else 'shd'
    binary = directory / (name+'.exe' if system == 'Windows' else name)
    if not binary.is_file():
        raise WorkError('HEAT_PLATFORM', f'Solver binary unavailable: {binary}')
    if system == 'Darwin' and machine == 'arm64':
        probe = subprocess.run(['/usr/bin/arch','-x86_64','/usr/bin/true'],capture_output=True,timeout=10,check=False)
        if probe.returncode:
            raise WorkError('HEAT_ROSETTA', 'Supplied solver requires Rosetta 2 on Apple Silicon; install it explicitly first')
    return binary


def bind_heat(objects, arm, request):
    engine = request['engine']
    binary = solver_path(engine)
    if platform.system() != 'Windows':
        binary.chmod(binary.stat().st_mode | 0o111)
    resolution, loops, influences = int(request.get('resolution',128)), int(request.get('loops',5)), int(request.get('influences',4))
    if not 32 <= resolution <= 1024 or not 1 <= loops <= 9 or not 1 <= influences <= 128:
        raise WorkError('HEAT_SETTINGS', 'resolution:32..1024, loops:1..9, influences:1..128')
    vertices = [(obj,vertex.index) for obj in objects for vertex in obj.data.vertices]
    bones = [bone for bone in arm.data.bones if bone.use_deform]
    if not bones:
        raise WorkError('HEAT_BONES', 'At least one deform bone is required')
    with tempfile.TemporaryDirectory(prefix='character-heat-') as temporary:
        directory = Path(temporary)
        lines = []
        offset = 0
        for obj in objects:
            lines.extend('v,'+','.join(str(c) for c in obj.matrix_world @ v.co) for v in obj.data.vertices)
            lines.extend('f,'+','.join(str(offset+i) for i in poly.vertices) for poly in obj.data.polygons)
            offset += len(obj.data.vertices)
        (directory/'mesh.txt').write_text('\n'.join(lines)+'\n')
        (directory/'bone.txt').write_text('\n'.join('b,'+bone.name.replace(',','\\;')+','+
            ','.join(str(c) for point in [arm.matrix_world@bone.head_local,arm.matrix_world@bone.tail_local] for c in point)
            for bone in bones)+'\n')
        arguments = [str(binary),'mesh.txt','bone.txt','weights.txt',str(resolution),str(loops),'64',str(influences),'0.2']
        if engine == 'surface':
            arguments.append('3')
        arguments.extend(['n','y'])
        process = subprocess.run(arguments,cwd=directory,capture_output=True,text=True,timeout=240,check=False)
        print(process.stdout)
        if process.returncode != 0 or not (directory/'weights.txt').is_file():
            raise WorkError('HEAT_FAILED', f'Solver exited {process.returncode}: {process.stderr[-1000:]}')
        names = []
        weights = [[] for _ in vertices]
        for line in (directory/'weights.txt').read_text().splitlines():
            fields = line.split(',')
            if fields[0] == 'b':
                name = fields[1].replace('\\;',',')
                if name not in arm.data.bones:
                    raise WorkError('HEAT_OUTPUT', f'Unknown output bone {name}')
                names.append(name)
            if fields[0] == 'w':
                index, bone_index, weight = int(fields[1]), int(fields[2]), float(fields[3])
                if not 0 <= index < len(vertices) or not 0 <= bone_index < len(names) or not math.isfinite(weight) or weight < 0:
                    raise WorkError('HEAT_OUTPUT', 'Invalid weight record')
                weights[index].append((names[bone_index],weight))
        if any(sum(w for _,w in row) <= 0 for row in weights):
            raise WorkError('HEAT_UNWEIGHTED', 'Solver left unweighted vertices; output not saved')
        for (obj,index),row in zip(vertices,weights):
            total = sum(w for _,w in row)
            for name,weight in row:
                group = obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
                group.add([index],weight/total,'REPLACE')
    select(objects+[arm],arm)
    bpy.ops.object.parent_set(type='ARMATURE')
    return {'solver':str(binary),'execution':'rosetta2' if platform.system() == 'Darwin' and platform.machine() == 'arm64' else 'native',
            'resolution':resolution,'loops':loops,'influences':influences}
