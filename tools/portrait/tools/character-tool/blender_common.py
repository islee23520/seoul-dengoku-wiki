# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run only inside Blender via character-tool; bpy is provided by Blender.
from __future__ import annotations

import math
from pathlib import Path
from typing import TypeAlias, TypedDict

import bpy
from mathutils import Vector

Json: TypeAlias = None | bool | int | float | str | list['Json'] | dict[str, 'Json']


class BoundsReport(TypedDict):
    min: list[float]
    max: list[float]
    size: list[float]


class SceneReport(TypedDict):
    meshes: list
    bounds: BoundsReport
    armatures: list
    rigValid: bool
    issues: list[str]
    units: str


class WorkError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


def output_path(value: str, suffixes: tuple[str, ...]) -> Path:
    path = Path(value).resolve()
    if path.suffix.lower() not in suffixes:
        raise WorkError('OUTPUT_FORMAT', f'Output must end in {suffixes}')
    if path.exists():
        raise WorkError('OUTPUT_EXISTS', f'Refusing overwrite: {path}')
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def object_mode() -> None:
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')


def select(objects: list[bpy.types.Object], active: bpy.types.Object) -> None:
    object_mode()
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.hide_set(False)
        obj.select_set(True)
    bpy.context.view_layer.objects.active = active


def load_model(value: str) -> None:
    path = Path(value).resolve()
    if not path.is_file():
        raise WorkError('INPUT_MISSING', f'Model does not exist: {path}')
    suffix = path.suffix.lower()
    if suffix == '.blend':
        bpy.ops.wm.open_mainfile(filepath=str(path), load_ui=False, use_scripts=False)
        return
    object_mode()
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    loaders = {'.glb': bpy.ops.import_scene.gltf, '.gltf': bpy.ops.import_scene.gltf, '.fbx': bpy.ops.import_scene.fbx}
    if suffix not in loaders:
        raise WorkError('INPUT_FORMAT', 'Supported input: .blend, .glb, .gltf, .fbx')
    loaders[suffix](filepath=str(path))
    if suffix in {'.glb','.gltf'}:
        bpy.context.scene['character_tool_source_gltf'] = str(path)
    bpy.context.view_layer.update()


def meshes() -> list[bpy.types.Object]:
    custom_shapes = {bone.custom_shape for arm in bpy.context.scene.objects if arm.type == 'ARMATURE' for bone in arm.pose.bones if bone.custom_shape}
    found = [o for o in bpy.context.scene.objects if o.type == 'MESH' and len(o.data.vertices) and o not in custom_shapes
             and not any(collection.name.startswith('cs_grp') for collection in o.users_collection)]
    if not found:
        raise WorkError('MESH_MISSING', 'No nonempty mesh in scene')
    return found


def bounds(objects: list[bpy.types.Object]) -> tuple[Vector, Vector]:
    points = [obj.matrix_world @ v.co for obj in objects for v in obj.data.vertices]
    if not all(math.isfinite(c) for p in points for c in p):
        raise WorkError('GEOMETRY_INVALID', 'Non-finite vertex position')
    return Vector(tuple(min(p[i] for p in points) for i in range(3))), Vector(tuple(max(p[i] for p in points) for i in range(3)))


def inspect_scene(require_rig: bool = False) -> SceneReport:
    objects = meshes()
    low, high = bounds(objects)
    reports = []
    violations = []
    for obj in objects:
        arm = obj.find_armature()
        deform_names = {b.name for b in arm.data.bones if b.use_deform} if arm else set()
        group_ids = {g.index for g in obj.vertex_groups if g.name in deform_names}
        unweighted = sum(not any(g.group in group_ids and math.isfinite(g.weight) and g.weight > 0 for g in v.groups) for v in obj.data.vertices)
        if arm is None:
            violations.append(f'{obj.name}: missing armature')
        elif unweighted:
            violations.append(f'{obj.name}: {unweighted} unweighted vertices')
        reports.append({'name': obj.name, 'vertices': len(obj.data.vertices), 'polygons': len(obj.data.polygons),
                        'armature': arm.name if arm else None, 'unweightedVertices': unweighted,
                        'location': list(obj.location), 'scale': list(obj.scale)})
    if require_rig and violations:
        raise WorkError('RIG_INVALID', '; '.join(violations))
    return {'meshes': reports, 'bounds': {'min': list(low), 'max': list(high), 'size': list(high-low)},
            'armatures': [{'name': o.name, 'bones': len(o.data.bones), 'deformBones': sum(b.use_deform for b in o.data.bones)}
                          for o in bpy.context.scene.objects if o.type == 'ARMATURE'],
            'rigValid': not violations, 'issues': violations, 'units': bpy.context.scene.unit_settings.system}


def save_blend(path: Path) -> None:
    bpy.ops.wm.save_as_mainfile(filepath=str(path), check_existing=False)
