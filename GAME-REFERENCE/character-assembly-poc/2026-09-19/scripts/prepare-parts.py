# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run: Blender --background work/audit/welded-sources.blend --python scripts/prepare-parts.py
"""Extract editable skin and every original oral connected component."""
import json
import sys
from pathlib import Path
import bmesh
import bpy

ROOT = Path('/Users/danny/Documents/Character-Assembly-POC/2026-09-19')
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups, components, split_component

reports = []
for index, name in [(0, 'Male_Head'), (1, 'Female_Body'), (3, 'Male_Body'), (5, 'Female_Head')]:
    source = bpy.data.objects[f'WELDED_{index:02d}']
    bm = bmesh.new()
    bm.from_mesh(source.data)
    bm.verts.ensure_lookup_table()
    parts = components(bm)
    for part_index, vertices in enumerate(parts):
        suffix = 'Skin' if part_index == 0 else f'Oral_{part_index:02d}'
        if name == 'Male_Body' and part_index == 1:
            suffix = 'Briefs'
        obj = split_component(source, {v.index for v in vertices}, name + '_' + suffix)
        probe = bmesh.new()
        probe.from_mesh(obj.data)
        groups = []
        for group in boundary_groups(probe):
            points = {v for e in group for v in e.verts}
            groups.append({'edges': len(group), 'min': [min(v.co[a] for v in points) for a in range(3)], 'max': [max(v.co[a] for v in points) for a in range(3)], 'closed_loop': all(sum(e in group for e in v.link_edges) == 2 for v in points)})
        reports.append({'name': obj.name, 'vertices': len(probe.verts), 'faces': len(probe.faces), 'boundary': sum(e.is_boundary for e in probe.edges), 'nonmanifold': sum(not e.is_manifold for e in probe.edges), 'junction_edges': sum(len(e.link_faces) > 2 for e in probe.edges), 'boundary_groups': groups, 'min': [min(v.co[a] for v in probe.verts) for a in range(3)], 'max': [max(v.co[a] for v in probe.verts) for a in range(3)]})
        probe.free()
    bm.free()
for obj in list(bpy.data.objects):
    if obj.name.startswith(('SRC_', 'WELDED_')):
        bpy.data.objects.remove(obj, do_unlink=True)
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'work/prepared-parts.blend'))
(ROOT / 'reports/prepared-parts.json').write_text(json.dumps(reports, indent=2))
print('PREPARED_PARTS_PASS', len(reports), flush=True)
