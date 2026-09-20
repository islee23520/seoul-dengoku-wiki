"""Read-only native polygon/corner extraction; writes only this work folder."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import TypedDict

import numpy as np

bpy = __import__('bpy')
HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / "female-defective-charts/female-defective-charts-candidate.blend"
NAME = "Female_Base_Composed_Candidate"


def digest(array: np.ndarray) -> str:
    return hashlib.sha256(np.ascontiguousarray(array).tobytes()).hexdigest()


class MeshState(TypedDict):
    counts: list[int]
    hashes: dict[str, str]
    modifiers: list[tuple[str, str, bool, bool]]


def state(obj) -> MeshState:
    mesh = obj.data
    mesh.calc_loop_triangles()
    arrays = {
        "positions": np.asarray([v.co[:] for v in mesh.vertices], np.float32),
        "world_positions": np.asarray([(obj.matrix_world @ v.co)[:] for v in mesh.vertices], np.float64),
        "edges": np.asarray([e.vertices[:] for e in mesh.edges], np.int32),
        "loop_vertices": np.asarray([l.vertex_index for l in mesh.loops], np.int32),
        "polygon_layout": np.asarray([(p.loop_start, p.loop_total) for p in mesh.polygons], np.int32),
        "world_matrix": np.asarray(obj.matrix_world, np.float64),
        "native_triangles": np.asarray([t.loops[:] for t in mesh.loop_triangles], np.int32),
        "vertex_normals": np.asarray([v.normal[:] for v in mesh.vertices], np.float32),
        "corner_normals": np.asarray([n.vector[:] for n in mesh.corner_normals], np.float32),
        "sharp_edges": np.asarray([e.use_edge_sharp for e in mesh.edges], bool),
        "smooth_faces": np.asarray([p.use_smooth for p in mesh.polygons], bool),
        "seam_flags": np.asarray([e.use_seam for e in mesh.edges], bool),
        "LockedSourceUV": np.asarray([x.uv[:] for x in mesh.uv_layers['LockedSourceUV'].data], np.float32),
    }
    return {"counts": [len(mesh.vertices), len(mesh.edges), len(mesh.polygons), len(mesh.loops), len(mesh.loop_triangles)],
            "hashes": {k: digest(a) for k, a in arrays.items()},
            "modifiers": [(m.name, m.type, m.show_viewport, m.show_render) for m in obj.modifiers]}


def main() -> None:
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE), load_ui=False)
    obj = bpy.data.objects[NAME]
    mesh = obj.data
    mesh.calc_loop_triangles()
    arrays = {
        "positions": np.asarray([(obj.matrix_world @ v.co)[:] for v in mesh.vertices], np.float64),
        "loop_vertices": np.asarray([l.vertex_index for l in mesh.loops], np.int32),
        "loop_edges": np.asarray([l.edge_index for l in mesh.loops], np.int32),
        "polygon_starts": np.asarray([p.loop_start for p in mesh.polygons], np.int32),
        "polygon_sizes": np.asarray([p.loop_total for p in mesh.polygons], np.int32),
        "triangles": np.asarray([t.loops[:] for t in mesh.loop_triangles], np.int32),
        "triangle_polygons": np.asarray([t.polygon_index for t in mesh.loop_triangles], np.int32),
        "uv": np.asarray([x.uv[:] for x in mesh.uv_layers['AtlasUV'].data], np.float64),
        "locked_uv": np.asarray([x.uv[:] for x in mesh.uv_layers['LockedSourceUV'].data], np.float64),
    }
    np.savez_compressed(HERE / "native-graph.npz", allow_pickle=False, **arrays)
    source_state = state(obj)
    report = {"source": str(SOURCE), "sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(), "state": source_state,
              "materials": [{"name": m.name, "images": [{"node": n.name, "image": n.image.name, "path": n.image.filepath} for n in m.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image]} for m in mesh.materials if m and m.use_nodes],
              "attributes": [(a.name, a.domain, a.data_type) for a in mesh.attributes]}
    (HERE / "source-state.json").write_text(json.dumps(report, indent=2))
    print(json.dumps({"event": "EXTRACTED", "counts": source_state["counts"]}), flush=True)


if __name__ == "__main__":
    main()
