# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run only inside Blender; the caller loads the model with blender_common.load_model first.
from __future__ import annotations

import math
from pathlib import Path
from typing import TypedDict

import bpy
from mathutils import Vector

from blender_common import WorkError

_MIN_DIMENSION = 64
_MAX_DIMENSION = 2048
_MARGIN = 1.12


class PortraitRequest(TypedDict, total=False):
    output: str
    width: int | float
    height: int | float
    yaw: int | float
    framing: str


def _dimension(request: PortraitRequest, name: str) -> int:
    value = request.get(name)
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or int(value) != value:
        raise WorkError('DIMENSIONS_INVALID', f'{name} must be an integer from {_MIN_DIMENSION} to {_MAX_DIMENSION}')
    result = int(value)
    if result < _MIN_DIMENSION or result > _MAX_DIMENSION:
        raise WorkError('DIMENSIONS_INVALID', f'{name} must be an integer from {_MIN_DIMENSION} to {_MAX_DIMENSION}')
    return result


def _request_values(request: PortraitRequest) -> tuple[Path, int, int, float, str]:
    output_value = request.get('output')
    if not isinstance(output_value, str) or not output_value:
        raise WorkError('OUTPUT_INVALID', 'output must be an absolute path to a new .png file')
    output = Path(output_value)
    if not output.is_absolute():
        raise WorkError('OUTPUT_ABSOLUTE', 'output must be an absolute path')
    if output.suffix.lower() != '.png':
        raise WorkError('OUTPUT_FORMAT', 'output must end in .png')
    if output.exists():
        raise WorkError('OUTPUT_EXISTS', f'Refusing overwrite: {output}')

    width = _dimension(request, 'width')
    height = _dimension(request, 'height')
    yaw_value = request.get('yaw', 0)
    if isinstance(yaw_value, bool) or not isinstance(yaw_value, (int, float)) or not math.isfinite(yaw_value):
        raise WorkError('YAW_INVALID', 'yaw must be a finite number from -180 to 180 degrees')
    yaw = float(yaw_value)
    if yaw < -180 or yaw > 180:
        raise WorkError('YAW_INVALID', 'yaw must be a finite number from -180 to 180 degrees')
    framing = request.get('framing', 'upper')
    if framing not in {'full', 'upper', 'bust'}:
        raise WorkError('FRAMING_INVALID', "framing must be 'full', 'upper' or 'bust'")
    return output, width, height, yaw, framing


def _visible_meshes() -> list[bpy.types.Object]:
    view_layer = bpy.context.view_layer
    objects = [
        obj for obj in bpy.context.scene.objects
        if obj is not None and obj.type == 'MESH' and not obj.hide_render and obj.visible_get(view_layer=view_layer)
        and len(obj.data.vertices) > 0 and len(obj.data.polygons) > 0
    ]
    if not objects:
        raise WorkError('MESH_MISSING', 'No nonempty visible mesh in scene')
    return objects


def _evaluated_bounds(objects: list[bpy.types.Object]) -> tuple[Vector, Vector]:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    points: list[Vector] = []
    for obj in objects:
        evaluated = obj.evaluated_get(depsgraph)
        points.extend(evaluated.matrix_world @ Vector(corner) for corner in evaluated.bound_box)
    if not points or not all(math.isfinite(component) for point in points for component in point):
        raise WorkError('GEOMETRY_INVALID', 'Mesh bounds contain non-finite coordinates')
    low = Vector(tuple(min(point[axis] for point in points) for axis in range(3)))
    high = Vector(tuple(max(point[axis] for point in points) for axis in range(3)))
    if max(high - low) <= 1e-8:
        raise WorkError('GEOMETRY_INVALID', 'Visible mesh has zero-size bounds')
    return low, high


# Bust = head and shoulders like the v2 portrait target: the top band of the posed figure, framed on
# the evaluated vertices inside that band so lowered hands and hips do not widen the shot.
_BUST_OF_HEIGHT = 0.30


def _bust_bounds(objects: list[bpy.types.Object], low: Vector, high: Vector) -> tuple[Vector, Vector]:
    floor = high.z - _BUST_OF_HEIGHT * (high.z - low.z)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    points: list[Vector] = []
    for obj in objects:
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        try:
            points.extend(p for p in (evaluated.matrix_world @ v.co for v in mesh.vertices) if p.z >= floor)
        finally:
            evaluated.to_mesh_clear()
    if not points:
        raise WorkError('GEOMETRY_INVALID', 'No geometry inside the bust band')
    return (Vector(tuple(min(p[axis] for p in points) for axis in range(3))),
            Vector(tuple(max(p[axis] for p in points) for axis in range(3))))


def _corners(low: Vector, high: Vector) -> list[Vector]:
    return [Vector((x, y, z)) for x in (low.x, high.x) for y in (low.y, high.y) for z in (low.z, high.z)]


def _new_area_light(collection: bpy.types.Collection, name: str, location: Vector, target: Vector,
                    energy: float, size: float) -> bpy.types.Object:
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.shape = 'DISK'
    data.size = size
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (target - location).to_track_quat('-Z', 'Y').to_euler()
    return obj


def render_portrait(request: PortraitRequest) -> dict[str, int | str]:
    """Render the currently loaded Blender character scene to a transparent portrait PNG."""
    output, width, height, yaw, framing = _request_values(request)
    objects = _visible_meshes()
    low, high = _evaluated_bounds(objects)

    frame_low, frame_high = low.copy(), high.copy()
    if framing == 'upper':
        frame_low.z = (low.z + high.z) * 0.5
    elif framing == 'bust':
        frame_low, frame_high = _bust_bounds(objects, low, high)
    frame_center = (frame_low + frame_high) * 0.5
    frame_corners = _corners(frame_low, frame_high)
    model_size = max(high - low)
    camera_distance = max(model_size * 3.0, 1.0)

    scene = bpy.context.scene
    original_camera = scene.camera
    original_world = scene.world
    original_filepath = scene.render.filepath
    original_engine = scene.render.engine
    original_resolution = (scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage)
    original_file_format = scene.render.image_settings.file_format
    original_color_mode = scene.render.image_settings.color_mode
    original_film_transparent = scene.render.film_transparent
    original_cycles = (scene.cycles.device, scene.cycles.samples, scene.cycles.use_denoising)
    existing_lights = [(obj, obj.hide_render) for obj in scene.objects if obj.type == 'LIGHT']

    helper_collection = bpy.data.collections.new('Portrait Render Helpers')
    scene.collection.children.link(helper_collection)
    camera_data = bpy.data.cameras.new('Portrait Render Camera')
    camera = bpy.data.objects.new('Portrait Render Camera', camera_data)
    helper_collection.objects.link(camera)
    world = bpy.data.worlds.new('Portrait Render World')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.025, 0.025, 0.025, 1.0)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.12

    try:
        for light, _hidden in existing_lights:
            light.hide_render = True

        angle = math.radians(yaw)
        camera_direction = Vector((math.sin(angle), -math.cos(angle), 0.0))
        camera.location = frame_center + camera_direction * camera_distance
        camera.rotation_euler = (frame_center - camera.location).to_track_quat('-Z', 'Y').to_euler()
        camera_data.type = 'ORTHO'
        camera_data.lens = 50
        camera_data.clip_start = max(camera_distance * 0.001, 0.001)
        camera_data.clip_end = camera_distance * 4.0 + model_size
        bpy.context.view_layer.update()

        right = camera.matrix_world.to_quaternion() @ Vector((1.0, 0.0, 0.0))
        up = camera.matrix_world.to_quaternion() @ Vector((0.0, 1.0, 0.0))
        projected_width = max(abs((corner - frame_center).dot(right)) for corner in frame_corners) * 2.0
        projected_height = max(abs((corner - frame_center).dot(up)) for corner in frame_corners) * 2.0
        aspect = width / height
        camera_data.ortho_scale = max(projected_height, projected_width / aspect, model_size * 0.01) * _MARGIN

        right_horizontal = Vector((math.cos(angle), math.sin(angle), 0.0))
        light_scale = max(model_size, 0.1)
        energy_scale = light_scale * light_scale
        _new_area_light(helper_collection, 'Portrait Key',
                        frame_center + camera_direction * light_scale * 1.8 - right_horizontal * light_scale * 1.2 + Vector((0, 0, light_scale * 1.5)),
                        frame_center, 420.0 * energy_scale, light_scale * 1.25)
        _new_area_light(helper_collection, 'Portrait Fill',
                        frame_center + camera_direction * light_scale * 1.1 + right_horizontal * light_scale * 1.7 + Vector((0, 0, light_scale * 0.45)),
                        frame_center, 170.0 * energy_scale, light_scale * 1.5)
        _new_area_light(helper_collection, 'Portrait Rim',
                        frame_center - camera_direction * light_scale * 1.4 + right_horizontal * light_scale * 0.5 + Vector((0, 0, light_scale * 1.7)),
                        frame_center, 300.0 * energy_scale, light_scale)

        output.parent.mkdir(parents=True, exist_ok=True)
        scene.camera = camera
        scene.world = world
        scene.render.engine = 'CYCLES'
        scene.cycles.device = 'CPU'
        scene.cycles.samples = 16
        scene.cycles.use_denoising = True
        scene.render.resolution_x = width
        scene.render.resolution_y = height
        scene.render.resolution_percentage = 100
        scene.render.image_settings.file_format = 'PNG'
        scene.render.image_settings.color_mode = 'RGBA'
        scene.render.film_transparent = True
        scene.render.filepath = str(output)
        bpy.ops.render.render(write_still=True)
        if not output.is_file() or output.stat().st_size == 0:
            raise WorkError('RENDER_FAILED', f'Blender did not write portrait: {output}')
        return {'output': str(output), 'width': width, 'height': height, 'meshCount': len(objects)}
    finally:
        scene.camera = original_camera
        scene.world = original_world
        scene.render.filepath = original_filepath
        scene.render.engine = original_engine
        scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = original_resolution
        scene.render.image_settings.file_format = original_file_format
        scene.render.image_settings.color_mode = original_color_mode
        scene.render.film_transparent = original_film_transparent
        scene.cycles.device, scene.cycles.samples, scene.cycles.use_denoising = original_cycles
        for light, hidden in existing_lights:
            light.hide_render = hidden
        for obj in list(helper_collection.objects):
            data = obj.data
            bpy.data.objects.remove(obj, do_unlink=True)
            if isinstance(data, bpy.types.Camera):
                bpy.data.cameras.remove(data)
            elif isinstance(data, bpy.types.Light):
                bpy.data.lights.remove(data)
        bpy.data.collections.remove(helper_collection)
        bpy.data.worlds.remove(world)
