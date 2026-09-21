# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Extract and render the bounded Round 2 geometry RED baseline in Blender."""

from __future__ import annotations

import hashlib
import json
import math
import os
from collections import defaultdict
from pathlib import Path

import bpy
from mathutils import Vector

AVATAR_TOOL = Path(__file__).resolve().parents[2]
REPOSITORY_ROOT = AVATAR_TOOL.parents[1]
ARCHIVE = Path(os.environ["AVATAR_GEN_ROUND1_ARCHIVE"])
EXTERNAL = Path(os.environ["AVATAR_GEN_EXTERNAL_ARCHIVE"])
OUTPUT = Path(os.environ.get("AVATAR_GEN_GEOMETRY_EVIDENCE", AVATAR_TOOL / "evidence/geometry-red"))
BASELINE = AVATAR_TOOL / "fixtures/geometry-baseline.json"

SOURCES = {
    "unjoined": EXTERNAL / "work/proportion-study-unjoined.blend",
    "female_failed": ARCHIVE / "work/female-base-symmetric.blend",
    "integration": ARCHIVE / "deliverables/final-integration.blend",
    "male_guided": EXTERNAL / "work/male-base-symmetric-review.blend",
    "source_lock": Path(os.environ["AVATAR_GEN_SOURCE_LOCK"]),
    "legacy_symmetry": ARCHIVE / "scripts/symmetrize_female.py",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def bounds(points: list[Vector]) -> dict[str, list[float]]:
    return {
        "min": [min(point[axis] for point in points) for axis in range(3)],
        "max": [max(point[axis] for point in points) for axis in range(3)],
    }


def mesh_measurement(obj: bpy.types.Object) -> dict:
    bpy.context.view_layer.update()
    evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = evaluated.to_mesh()
    mesh.calc_loop_triangles()
    points = [evaluated.matrix_world @ vertex.co for vertex in mesh.vertices]
    finite = all(math.isfinite(value) for point in points for value in point)
    material_bounds = []
    for material_index in range(len(mesh.materials)):
        vertex_ids = {
            vertex_id
            for polygon in mesh.polygons
            if polygon.material_index == material_index
            for vertex_id in polygon.vertices
        }
        if not vertex_ids:
            continue
        role_points = [points[index] for index in vertex_ids]
        material_bounds.append(
            {
                "material_index": material_index,
                "material": mesh.materials[material_index].name if mesh.materials[material_index] else None,
                "vertices": len(vertex_ids),
                "bounds_world": bounds(role_points),
            }
        )
    result = {
        "object": obj.name,
        "origin_world": list(obj.matrix_world.translation),
        "matrix_world": [list(row) for row in obj.matrix_world],
        "bounds_world": bounds(points),
        "vertices": len(mesh.vertices),
        "faces": len(mesh.polygons),
        "native_loop_triangles": len(mesh.loop_triangles),
        "finite_vertices": finite,
        "material_role_bounds": material_bounds,
    }
    evaluated.to_mesh_clear()
    return result


def head_role(measurement: dict) -> dict:
    roles = measurement["material_role_bounds"]
    return max(roles, key=lambda role: role["bounds_world"]["max"][2])


def add_camera(location: tuple[float, float, float], target: tuple[float, float, float], scale: float) -> None:
    camera_data = bpy.data.cameras.new("GeometryRedCamera")
    camera = bpy.data.objects.new("GeometryRedCamera", camera_data)
    bpy.context.scene.collection.objects.link(camera)
    camera.location = location
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = scale
    bpy.context.scene.camera = camera


def render(path: Path, location: tuple[float, float, float], target: tuple[float, float, float], scale: float) -> None:
    scene = bpy.context.scene
    add_camera(location, target, scale)
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "OBJECT"
    scene.display.shading.show_shadows = True
    scene.display.shading.show_cavity = True
    scene.display.shading.cavity_type = "WORLD"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 1200
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    if scene.world is None:
        scene.world = bpy.data.worlds.new("GeometryRedWorld")
    scene.world.color = (0.04, 0.04, 0.04)
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    camera = bpy.context.scene.camera
    bpy.data.objects.remove(camera, do_unlink=True)


def visible_meshes(names: set[str] | None = None) -> None:
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        visible = names is None or obj.name in names
        obj.hide_render = not visible
        obj.hide_set(not visible)


def legacy_symmetry(obj: bpy.types.Object) -> dict[str, float | int]:
    buckets: defaultdict[tuple[float, float], list[float]] = defaultdict(list)
    for vertex in obj.data.vertices:
        world = obj.matrix_world @ vertex.co
        buckets[(round(world.y, 6), round(world.z, 6))].append(world.x - obj.matrix_world.translation.x)
    errors = [abs(xs[0] + xs[1]) for xs in buckets.values() if len(xs) == 2]
    ignored = sum(
        len(xs)
        for xs in buckets.values()
        if len(xs) != 2 and any(abs(x) > 1.0e-6 for x in xs)
    )
    return {
        "method": "Round 1 rounded-YZ buckets; only buckets with exactly two vertices",
        "pairs_checked": len(errors),
        "max_x_asymmetry_m": max(errors, default=0.0),
        "ignored_off_center_vertices": ignored,
    }


def open_scene(path: Path) -> None:
    bpy.ops.wm.open_mainfile(filepath=str(path), load_ui=False, use_scripts=False)
    bpy.context.view_layer.update()


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    BASELINE.parent.mkdir(parents=True, exist_ok=True)
    before = {name: sha256(path) for name, path in SOURCES.items()}

    open_scene(SOURCES["unjoined"])
    female_head = bpy.data.objects["Female_Study_Head"]
    female_body = bpy.data.objects["Female_Study_Body"]
    female_head.color = (0.92, 0.55, 0.46, 1.0)
    female_body.color = (0.42, 0.62, 0.92, 1.0)
    visible_meshes({female_head.name, female_body.name})
    unjoined_head = mesh_measurement(female_head)
    unjoined_body = mesh_measurement(female_body)
    unjoined_head_scale = list(female_head.scale)
    unjoined_body_scale = list(female_body.scale)
    render(OUTPUT / "01-unjoined-female-front.png", (1.05, -4.0, 0.9), (1.05, 0.0, 0.9), 2.05)
    render(OUTPUT / "02-unjoined-female-side.png", (4.0, 0.0, 0.9), (1.05, 0.0, 0.9), 2.05)

    open_scene(SOURCES["female_failed"])
    female = bpy.data.objects["Female_Base_Assembly"]
    female.color = (0.86, 0.56, 0.48, 1.0)
    visible_meshes({female.name})
    female_measure = mesh_measurement(female)
    female_role = head_role(female_measure)
    female_height = female_measure["bounds_world"]["max"][2] - female_measure["bounds_world"]["min"][2]
    female_head_height = female_role["bounds_world"]["max"][2] - female_role["bounds_world"]["min"][2]
    female_legacy_symmetry = legacy_symmetry(female)
    render(OUTPUT / "03-failed-female-front.png", (0.0, -4.0, 0.83), (0.0, 0.0, 0.83), 2.0)
    render(OUTPUT / "04-failed-female-side.png", (4.0, 0.0, 0.83), (0.0, 0.0, 0.83), 2.0)
    neck_z = female_role["bounds_world"]["min"][2]
    render(OUTPUT / "05-failed-female-neck-closeup.png", (0.0, -2.0, neck_z), (0.0, 0.0, neck_z), 0.45)

    open_scene(SOURCES["male_guided"])
    male = bpy.data.objects["Male_Base_Symmetric"]
    male_measure = mesh_measurement(male)
    male_role = head_role(male_measure)
    male_height = male_measure["bounds_world"]["max"][2] - male_measure["bounds_world"]["min"][2]
    male_head_height = male_role["bounds_world"]["max"][2] - male_role["bounds_world"]["min"][2]

    open_scene(SOURCES["integration"])
    integration_objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    oral_tokens = ("Gum", "Crown", "Tongue")
    male_oral = [obj for obj in integration_objects if obj.name.startswith("Male_") and any(token in obj.name for token in oral_tokens)]
    female_oral = [obj for obj in integration_objects if obj.name.startswith("Female_") and any(token in obj.name for token in oral_tokens)]
    male_base = bpy.data.objects["Male_Base_Symmetric"]
    eye_cores = [obj for obj in integration_objects if obj.name.startswith("Eye_Core") and obj.location.x < 0]
    eye_z = sum(obj.matrix_world.translation.z for obj in eye_cores) / len(eye_cores)
    male_integration_measure = mesh_measurement(male_base)
    head_min = male_role["bounds_world"]["min"][2]
    head_max = male_role["bounds_world"]["max"][2]
    oral_measurements = [mesh_measurement(obj) for obj in male_oral]
    all_in_band = all(
        item["bounds_world"]["min"][2] >= head_min and item["bounds_world"]["max"][2] <= head_max
        for item in oral_measurements
    )
    for obj in integration_objects:
        obj.color = (0.52, 0.58, 0.66, 1.0)
    for obj in male_oral:
        obj.color = (1.0, 0.12, 0.04, 1.0)
    visible_meshes({male_base.name, *(obj.name for obj in male_oral), *(obj.name for obj in eye_cores)})
    render(OUTPUT / "06-final-integration-mouth-cutaway.png", (-0.6, -4.0, 0.95), (-0.6, 0.0, 0.95), 2.05)

    after = {name: sha256(path) for name, path in SOURCES.items()}
    baseline = {
        "schema_version": 1,
        "status": "EXPECTED_RED_BASELINE_NOT_PRODUCTION_ACCEPTANCE",
        "engine": {"blender": bpy.app.version_string},
        "units": "meters",
        "extraction": "evaluated dependency graph mesh with native mesh.calc_loop_triangles()",
        "source_hashes": {name: {"path": str(SOURCES[name]), "before": before[name], "after": after[name], "unchanged": before[name] == after[name]} for name in SOURCES},
        "scenes": {
            "unjoined_female_source": {
                "head": unjoined_head,
                "body": unjoined_body,
                "uniform_scale_cancellation": {
                    "head_object_scale": unjoined_head_scale,
                    "body_object_scale": unjoined_body_scale,
                    "provenance": "proportion-study-unjoined.blend objects authored by gui_proportion_blockout.py; separate native bounds retained",
                },
            },
            "failed_female_symmetric": {
                **female_measure,
                "height_m": female_height,
                "head_role": female_role,
                "head_to_total_height_ratio": female_head_height / female_height,
                "legacy_symmetry": female_legacy_symmetry,
                "proportion_provenance": "assemble_female_base.py transforms both head and body by the same head_scale before final whole-model scaling, so their relative proportion is unchanged",
            },
            "owner_guided_male": {
                **male_measure,
                "height_m": male_height,
                "head_role": male_role,
                "head_to_total_height_ratio": male_head_height / male_height,
                "status": "independent positive control; owner-guided successful shape",
            },
            "failed_final_integration": {
                "male_base": male_integration_measure,
                "recognizable_landmarks": {
                    "male_eye_core_origins_z_m": [obj.matrix_world.translation.z for obj in eye_cores],
                    "male_eye_mean_z_m": eye_z,
                    "male_head_material_bounds_z_m": [head_min, head_max],
                    "provenance": "eye object origins from final-integration.blend; head material-index bounds from the same Male_Base_Symmetric geometry in owner-guided male source before integration replaced materials",
                },
                "male_oral_placement": {
                    "objects": oral_measurements,
                    "all_objects_in_head_landmark_band": all_in_band,
                    "oral_centroid_z_range_m": [
                        min((item["bounds_world"]["min"][2] + item["bounds_world"]["max"][2]) / 2 for item in oral_measurements),
                        max((item["bounds_world"]["min"][2] + item["bounds_world"]["max"][2]) / 2 for item in oral_measurements),
                    ],
                    "eye_to_oral_vertical_separation_m": eye_z - max(item["bounds_world"]["max"][2] for item in oral_measurements),
                },
                "female_oral_objects": {
                    "required_roles": ["upper_gums_teeth", "lower_gums_teeth", "inner_mouth", "tongue"],
                    "present_roles": [obj.name for obj in female_oral],
                    "object_count": len(female_oral),
                },
            },
        },
        "artifacts": sorted(path.name for path in OUTPUT.glob("*.png")),
    }
    with BASELINE.open("w", encoding="utf-8") as stream:
        json.dump(baseline, stream, indent=2)
        stream.write("\n")
    print("GEOMETRY_RED_BASELINE_COMPLETE", json.dumps({"baseline": str(BASELINE), "renders": len(baseline["artifacts"])}), flush=True)


if __name__ == "__main__":
    main()
