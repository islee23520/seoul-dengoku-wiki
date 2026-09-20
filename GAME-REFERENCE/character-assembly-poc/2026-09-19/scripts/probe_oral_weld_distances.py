# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Probe welding only inside existing oral components; no scene geometry changes."""
import json
import sys
from pathlib import Path

import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import components

with bpy.data.libraries.load(str(ROOT / 'work/oral-separated-verified.blend'), link=False) as (source, target):
    target.objects = [name for name in source.objects if name.startswith('Male_')]
reports = []
for obj in target.objects:
    baseline = bmesh.new()
    baseline.from_mesh(obj.data)
    baseline.verts.ensure_lookup_table()
    part_indices = [{v.index for v in part} for part in components(baseline)]
    baseline.free()
    probes = []
    for distance in [0, .00001, .0001, .00025, .0005, .001, .002]:
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        layer = bm.verts.layers.int.new('OriginalComponent')
        bm.verts.ensure_lookup_table()
        for index, ids in enumerate(part_indices):
            for vertex_id in ids:
                bm.verts[vertex_id][layer] = index
        if distance:
            for index in range(len(part_indices)):
                vertices = [v for v in bm.verts if v[layer] == index]
                bmesh.ops.remove_doubles(bm, verts=vertices, dist=distance)
        bm.normal_update()
        probes.append({'distance_source_units': distance, 'vertices': len(bm.verts), 'faces': len(bm.faces), 'quads': sum(len(f.verts) == 4 for f in bm.faces), 'components': len(components(bm)), 'boundary_edges': sum(e.is_boundary for e in bm.edges), 'junction_edges': sum(len(e.link_faces) > 2 for e in bm.edges), 'winding_errors': sum(e.is_manifold and not e.is_contiguous for e in bm.edges), 'degenerate_faces': sum(f.calc_area() < 1e-12 for f in bm.faces), 'wire_edges': sum(e.is_wire for e in bm.edges)})
        bm.free()
    reports.append({'object': obj.name, 'original_components': len(part_indices), 'probes': probes})
(ROOT / 'reports/oral-weld-distance-probe.json').write_text(json.dumps(reports, indent=2))
print('ORAL_WELD_DISTANCE_PROBE_COMPLETE', flush=True)
