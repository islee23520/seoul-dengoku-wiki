# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# Run: Blender --background --factory-startup candidate.blend --python-exit-code 1 --python scripts/probe_female_candidate.py
"""Measure the two selected unjoined meshes without changing the saved model."""

from __future__ import annotations

import hashlib
import json
import sys
from collections import defaultdict
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from gate.geometry_audit import audit_symmetry, audit_topology


def main() -> None:
    source = Path(bpy.data.filepath)
    with source.open("rb") as stream:
        before = hashlib.file_digest(stream, "sha256").hexdigest()
    names = (
        "Female_Body_candidate-a-neck-fit_PROVISIONAL_UNJOINED",
        "Female_Head_Skin_candidate-a-neck-fit_PROVISIONAL_UNJOINED",
    )
    results = []
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    for name in names:
        obj = bpy.data.objects[name]
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh(preserve_all_data_layers=True, depsgraph=depsgraph)
        try:
            mesh.calc_loop_triangles()
            vertices = [tuple(float(value) for value in evaluated.matrix_world @ vertex.co) for vertex in mesh.vertices]
            edges = [tuple(edge.vertices) for edge in mesh.edges]
            triangles = [tuple(triangle.vertices) for triangle in mesh.loop_triangles]
            audit = audit_topology(vertices, edges, triangles, frozenset(), 1e-12, 1e-8)
            adjacency = defaultdict(set)
            for first, second in audit.boundary_edges:
                adjacency[first].add(second)
                adjacency[second].add(first)
            remaining = set(adjacency)
            groups = []
            while remaining:
                pending = [min(remaining)]
                ids = set()
                while pending:
                    current = pending.pop()
                    if current in ids:
                        continue
                    ids.add(current)
                    remaining.discard(current)
                    pending.extend(adjacency[current] - ids)
                points = [vertices[index] for index in sorted(ids)]
                groups.append({
                    "vertices": sorted(ids),
                    "edges": [list(edge) for edge in audit.boundary_edges if edge[0] in ids],
                    "size": len(ids),
                    "closed_degree_two": all(len(adjacency[index]) == 2 for index in ids),
                    "min": [min(point[axis] for point in points) for axis in range(3)],
                    "max": [max(point[axis] for point in points) for axis in range(3)],
                    "center": [sum(point[axis] for point in points) / len(points) for axis in range(3)],
                })
            symmetry = audit_symmetry(vertices, 0.0, 1e-6, 1e-5)
            results.append({
                "object": name,
                "vertices": len(vertices),
                "polygons": len(mesh.polygons),
                "quads": sum(len(face.vertices) == 4 for face in mesh.polygons),
                "triangles": len(triangles),
                "hard_failures_no_boundary_exemptions": list(audit.failures),
                "degenerate_triangles": audit.degenerate_triangles,
                "winding_conflicts": audit.winding_conflicts,
                "non_manifold_edges": audit.non_manifold_edges,
                "duplicate_vertex_pairs": list(audit.duplicate_vertex_pairs),
                "duplicate_faces": audit.duplicate_faces,
                "wire_edges": list(audit.wire_edges),
                "boundaries": sorted(groups, key=lambda group: group["center"][2]),
                "symmetry": {
                    "checked": symmetry.checked_vertex_count,
                    "unmatched": len(symmetry.unmatched_vertex_ids),
                    "maximum_matched_error_m": symmetry.maximum_reflection_error_m,
                },
            })
        finally:
            evaluated.to_mesh_clear()
    with source.open("rb") as stream:
        after = hashlib.file_digest(stream, "sha256").hexdigest()
    output = ROOT / "work/female-blockout/independent-baseline.json"
    output.write_text(json.dumps({
        "source": str(source), "before_sha256": before, "after_sha256": after,
        "unchanged": before == after, "status": "UNJOINED_BASELINE_NOT_APPROVED",
        "meshes": results,
    }, indent=2), encoding="utf-8")
    print("FEMALE_INDEPENDENT_BASELINE", json.dumps([
        {"object": result["object"], "boundaries": [group["size"] for group in result["boundaries"]],
         "degenerate_triangles": result["degenerate_triangles"], "winding": result["winding_conflicts"]}
        for result in results
    ]), flush=True)
    if before != after:
        raise RuntimeError("Source changed during read-only measurement")


if __name__ == "__main__":
    main()
