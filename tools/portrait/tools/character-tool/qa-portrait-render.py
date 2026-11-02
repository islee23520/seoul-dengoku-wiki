# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Renderer-only QA: Blender --background --factory-startup --python qa-portrait-render.py -- <new-output-directory>
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from blender_common import WorkError
from portrait_render import render_portrait


def material(name: str, color: tuple[float, float, float, float], metallic: float = 0.0) -> bpy.types.Material:
    value = bpy.data.materials.new(name)
    value.diffuse_color = color
    value.use_nodes = True
    principled = value.node_tree.nodes.get('Principled BSDF')
    principled.inputs['Base Color'].default_value = color
    principled.inputs['Roughness'].default_value = 0.42
    principled.inputs['Metallic'].default_value = metallic
    return value


def finish_object(name: str, value: bpy.types.Material) -> bpy.types.Object:
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(value)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def add_fixture() -> list[bpy.types.Object]:
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    skin = material('QA Skin', (0.72, 0.28, 0.14, 1.0))
    hair = material('QA Hair', (0.025, 0.018, 0.012, 1.0))
    coat = material('QA Teal Coat', (0.015, 0.24, 0.30, 1.0), 0.1)
    trim = material('QA Gold Trim', (0.75, 0.30, 0.025, 1.0), 0.7)
    white = material('QA Eye White', (0.9, 0.9, 0.82, 1.0))
    dark = material('QA Eye Dark', (0.005, 0.012, 0.018, 1.0))
    objects: list[bpy.types.Object] = []

    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, location=(0, 0, 2.55), scale=(0.48, 0.42, 0.57))
    objects.append(finish_object('Head', skin))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=(0, 0.07, 2.91), scale=(0.51, 0.43, 0.32))
    objects.append(finish_object('Hair', hair))

    bpy.ops.mesh.primitive_cube_add(location=(0, 0.05, 1.35), scale=(0.68, 0.31, 0.82))
    body = finish_object('Body', coat)
    bevel = body.modifiers.new('Tailored bevel', 'BEVEL')
    bevel.width = 0.14
    bevel.segments = 3
    objects.append(body)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.19, depth=0.30, location=(0, 0, 2.02))
    objects.append(finish_object('Neck', skin))

    for x in (-0.22, 0.22):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, location=(x, -0.382, 2.62), scale=(0.11, 0.035, 0.075))
        objects.append(finish_object(f'Eye white {x}', white))
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, location=(x, -0.416, 2.62), scale=(0.035, 0.018, 0.045))
        objects.append(finish_object(f'Eye pupil {x}', dark))
    bpy.ops.mesh.primitive_cone_add(vertices=20, radius1=0.075, radius2=0.025, depth=0.22, location=(0, -0.48, 2.47), rotation=(math.pi / 2, 0, 0))
    objects.append(finish_object('Nose', skin))

    bpy.ops.mesh.primitive_torus_add(major_radius=0.44, minor_radius=0.035, major_segments=32, minor_segments=8,
                                    location=(0, -0.335, 1.73), rotation=(math.pi / 2, 0, 0))
    objects.append(finish_object('Coat gold trim', trim))
    bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=0.14, radius2=0.03, depth=0.34,
                                    location=(0.58, -0.06, 3.05), rotation=(0.15, 0.55, -0.2))
    objects.append(finish_object('Asymmetric hair ornament', trim))
    bpy.context.view_layer.update()
    return objects


def assert_png(path: Path, width: int, height: int) -> dict[str, int | float]:
    if not path.is_file() or path.stat().st_size <= 1024:
        raise AssertionError(f'Missing or implausibly small PNG: {path}')
    image = bpy.data.images.load(str(path), check_existing=False)
    try:
        if tuple(image.size) != (width, height):
            raise AssertionError((path, tuple(image.size), width, height))
        pixels = list(image.pixels)
        opaque = sum(pixels[index] > 0.05 for index in range(3, len(pixels), 4))
        colorful = sum(
            pixels[index + 3] > 0.05 and max(pixels[index:index + 3]) - min(pixels[index:index + 3]) > 0.04
            for index in range(0, len(pixels), 4)
        )
        if opaque < width * height * 0.08 or colorful < width * height * 0.03:
            raise AssertionError(f'Portrait is not visibly rendered: opaque={opaque}, colorful={colorful}')
        return {'bytes': path.stat().st_size, 'opaquePixels': opaque, 'colorPixels': colorful}
    finally:
        bpy.data.images.remove(image)


def expect_error(code: str, request: dict) -> None:
    try:
        render_portrait(request)
    except WorkError as error:
        if error.code != code:
            raise AssertionError((code, error.code, str(error))) from error
    else:
        raise AssertionError(f'Expected {code}: {request}')


def main() -> None:
    output_dir = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
    if output_dir.exists():
        raise FileExistsError(f'QA output must be new: {output_dir}')
    output_dir.mkdir(parents=True)
    fixture = add_fixture()
    caller_world = bpy.data.worlds.new('QA Caller World')
    caller_camera_data = bpy.data.cameras.new('QA Caller Camera')
    caller_camera = bpy.data.objects.new('QA Caller Camera', caller_camera_data)
    bpy.context.scene.collection.objects.link(caller_camera)
    bpy.context.scene.world = caller_world
    bpy.context.scene.camera = caller_camera
    bpy.context.scene.render.filepath = 'caller-render-path'
    caller_state = (bpy.context.scene.world, bpy.context.scene.camera, bpy.context.scene.render.filepath)
    renders = []
    cases = [
        ('upper-left.png', 256, 320, -55, 'upper'),
        ('upper-front.png', 256, 320, 0, 'upper'),
        ('upper-right.png', 256, 320, 55, 'upper'),
        ('full-back.png', 256, 320, 180, 'full'),
    ]
    helper_count = lambda: sum(obj.name.startswith('Portrait ') for obj in bpy.data.objects)
    original_object_count = len(bpy.data.objects)
    for filename, width, height, yaw, framing in cases:
        request = {'output': str(output_dir / filename), 'width': width, 'height': height,
                   'yaw': yaw, 'framing': framing}
        response = render_portrait(request)
        if helper_count() or len(bpy.data.objects) != original_object_count:
            raise AssertionError('Renderer leaked camera/light helper objects')
        if (bpy.context.scene.world, bpy.context.scene.camera, bpy.context.scene.render.filepath) != caller_state:
            raise AssertionError('Renderer did not restore caller scene state')
        if response != {'output': str(output_dir / filename), 'width': width, 'height': height,
                        'meshCount': len(fixture)}:
            raise AssertionError(response)
        renders.append({**response, **assert_png(output_dir / filename, width, height), 'yaw': yaw, 'framing': framing})

    expect_error('OUTPUT_EXISTS', {'output': str(output_dir / 'upper-front.png'), 'width': 128, 'height': 128})
    expect_error('DIMENSIONS_INVALID', {'output': str(output_dir / 'bad-size.png'), 'width': 63, 'height': 256})
    expect_error('YAW_INVALID', {'output': str(output_dir / 'bad-yaw.png'), 'width': 256, 'height': 256, 'yaw': 181})
    expect_error('FRAMING_INVALID', {'output': str(output_dir / 'bad-framing.png'), 'width': 256, 'height': 256, 'framing': 'face'})
    expect_error('OUTPUT_ABSOLUTE', {'output': 'relative.png', 'width': 256, 'height': 256})
    for obj in fixture:
        obj.hide_render = True
    expect_error('MESH_MISSING', {'output': str(output_dir / 'hidden.png'), 'width': 256, 'height': 256})
    if (output_dir / 'hidden.png').exists():
        raise AssertionError('Invalid request created an output')

    report = {'pass': True, 'renders': renders, 'failureCases': 6}
    (output_dir / 'qa-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print('PORTRAIT_RENDER_QA ' + json.dumps(report), flush=True)


if __name__ == '__main__':
    main()
