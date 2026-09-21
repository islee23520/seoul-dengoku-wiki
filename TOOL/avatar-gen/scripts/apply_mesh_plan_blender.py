"""Apply only explicitly authorized safe/avatar mesh repair-plan actions."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import bpy
import bmesh


def args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--plan", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--allow-destructive", action="store_true")
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])


def recalculate_normals(obj: bpy.types.Object, inside: bool) -> None:
    bm = bmesh.new()
    try:
        bm.from_mesh(obj.data)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        if inside:
            bmesh.ops.reverse_faces(bm, faces=bm.faces)
        bm.to_mesh(obj.data)
    finally:
        bm.free()


def weld_centerline(obj: bpy.types.Object, threshold: float) -> None:
    bm = bmesh.new()
    try:
        bm.from_mesh(obj.data)
        center = [vertex for vertex in bm.verts if abs((obj.matrix_world @ vertex.co).x) <= threshold]
        for vertex in center:
            vertex.co.x = 0.0
        if center:
            bmesh.ops.remove_doubles(bm, verts=center, dist=threshold)
        bm.to_mesh(obj.data)
    finally:
        bm.free()


def mirror_from_donor(obj: bpy.types.Object, donor: str, plane_x: float, weld_threshold: float) -> None:
    if obj.matrix_world != obj.matrix_world.__class__():
        raise RuntimeError(f"mirror requires identity object transform: {obj.name}")
    bm = bmesh.new()
    try:
        bm.from_mesh(obj.data)
        keep_left = donor == "left"
        remove = [vertex for vertex in bm.verts if (vertex.co.x > plane_x + weld_threshold if keep_left else vertex.co.x < plane_x - weld_threshold)]
        bmesh.ops.delete(bm, geom=remove, context="VERTS")
        source = [vertex for vertex in bm.verts if (vertex.co.x < plane_x - weld_threshold if keep_left else vertex.co.x > plane_x + weld_threshold)]
        result = bmesh.ops.duplicate(bm, geom=[*source, *(edge for edge in bm.edges if all(vertex in source for vertex in edge.verts)), *(face for face in bm.faces if all(vertex in source for vertex in face.verts))])
        for element in result["geom"]:
            if isinstance(element, bmesh.types.BMVert):
                element.co.x = 2 * plane_x - element.co.x
        center = [vertex for vertex in bm.verts if abs(vertex.co.x - plane_x) <= weld_threshold]
        for vertex in center:
            vertex.co.x = plane_x
        bmesh.ops.remove_doubles(bm, verts=center, dist=weld_threshold)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(obj.data)
    finally:
        bm.free()


def main() -> int:
    parsed = args()
    plan = json.loads(parsed.plan.read_text(encoding="utf-8"))
    source = Path(bpy.data.filepath).resolve()
    if source == parsed.output.resolve():
        raise RuntimeError("output must not overwrite source blend")
    applied = []
    for action in plan.get("actions", []):
        obj = bpy.data.objects.get(action["object_name"])
        if obj is None or obj.type != "MESH":
            raise RuntimeError(f"repair object missing: {action['object_name']}")
        authorization = action.get("authorization")
        if authorization == "explicit-destructive" and not parsed.allow_destructive:
            raise RuntimeError(f"destructive repair requires --allow-destructive: {action['action']}")
        parameters = action.get("parameters", {})
        if action["action"] == "recalculate-normals":
            recalculate_normals(obj, bool(parameters.get("inside", False)))
        elif action["action"] == "weld-centerline":
            weld_centerline(obj, float(parameters["threshold_m"]))
        elif action["action"] == "mirror-from-donor":
            mirror_from_donor(obj, str(parameters["donor"]), float(parameters["plane_x_m"]), float(parameters["weld_threshold_m"]))
        else:
            raise RuntimeError(f"unsupported repair action: {action['action']}")
        applied.append(action["action"])
    parsed.output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(parsed.output.resolve()))
    print(json.dumps({"status": "AVATAR_MESH_REPAIR_APPLIED", "source": str(source), "output": str(parsed.output.resolve()), "actions": applied}), flush=True)
    return 0


raise SystemExit(main())
