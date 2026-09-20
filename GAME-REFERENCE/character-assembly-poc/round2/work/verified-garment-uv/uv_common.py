# /// script
# requires-python = ">=3.13"
# dependencies = ["numpy"]
# ///
# Imported by Blender background scripts in this directory.
"""Exact semantic snapshots and native-loop extraction for this UV-only bundle."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
NAMES = ("Female_Bandeau_Measured", "Female_Briefs_Panel")
SOURCE = ROOT / "work/garment-shell-topology/female-underwear-topology-v4.blend"
SOURCE_SHA = "0ac891a2625bb1330c1b5942945854c041d503e678da7406e304034264160a02"


def digest(value) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def fingerprint(obj: bpy.types.Object) -> str:
    """Include geometry, native diagonals, materials, non-UV attributes and matrix."""
    mesh = obj.data
    mesh.calc_loop_triangles()
    attributes = {}
    uv_names = {u.name for u in mesh.uv_layers}
    for attr in mesh.attributes:
        if attr.name in uv_names or attr.name.startswith((".select", ".uv_select")) or attr.name == "uv_seam":
            continue
        values = []
        for item in attr.data:
            fields = {}
            for prop in item.bl_rna.properties:
                if prop.identifier == "rna_type":
                    continue
                value = getattr(item, prop.identifier)
                fields[prop.identifier] = list(value) if prop.is_array else value
            values.append(fields)
        attributes[attr.name] = [attr.domain, attr.data_type, values]
    materials = []
    for material in mesh.materials:
        nodes = []
        links = []
        if material.use_nodes:
            for node in material.node_tree.nodes:
                inputs = []
                for socket in node.inputs:
                    if hasattr(socket, "default_value"):
                        value = socket.default_value
                        inputs.append([socket.name, list(value) if hasattr(value, "__len__") else value])
                nodes.append([node.name, node.bl_idname, inputs])
            links = [[l.from_node.name, l.from_socket.identifier, l.to_node.name, l.to_socket.identifier] for l in material.node_tree.links]
        materials.append([material.name, list(material.diffuse_color), nodes, links])
    value = {"vertices": [list(v.co) for v in mesh.vertices], "edges": [list(e.vertices) for e in mesh.edges],
             "polygons": [[list(p.vertices), p.material_index, p.use_smooth] for p in mesh.polygons],
             "loops": [[l.vertex_index, l.edge_index] for l in mesh.loops],
             "native_triangles": [[list(t.vertices), list(t.loops), t.polygon_index] for t in mesh.loop_triangles],
             "matrix_world": [list(row) for row in obj.matrix_world], "attributes": attributes,
             "materials": materials, "parent": obj.parent.name if obj.parent else None,
             "modifiers": [(m.name, m.type) for m in obj.modifiers], "properties": dict(obj.items())}
    return digest(value)


def extract(obj: bpy.types.Object):
    """Use evaluated Blender triangle loop indices, never an alternative triangulator."""
    graph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(graph)
    mesh = evaluated.to_mesh(preserve_all_data_layers=True, depsgraph=graph)
    try:
        mesh.calc_loop_triangles()
        uv = mesh.uv_layers.active
        triangles = [{"triangle_id": i, "polygon_id": t.polygon_index, "loop_ids": list(t.loops),
                      "uv": [list(uv.data[l].uv) for l in t.loops]} for i, t in enumerate(mesh.loop_triangles)]
        return {"object_name": obj.name, "status": "OK", "uv_layer": uv.name,
                "triangle_count": len(triangles), "triangles": triangles}
    finally:
        evaluated.to_mesh_clear()
