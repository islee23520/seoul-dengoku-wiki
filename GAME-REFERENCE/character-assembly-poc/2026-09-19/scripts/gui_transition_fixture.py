# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Verify density transition winding and logical quads away from character meshes."""
import json
import math
import sys
from pathlib import Path
import bmesh
import bpy
from mathutils import Quaternion, Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from quad_transition import connect_reduction, aligned_parameters
from mesh_tools import boundary_groups, orient_surface

scene = bpy.data.scenes.new('Quad_Transition_Test_Only')
bpy.context.window.scene = scene
bm = bmesh.new()
counts = [64, 60, 56, 52, 48, 44, 42]
rings = []
for level, count in enumerate(counts):
    z = 0.072 - level * 0.012
    radius = 0.06 + level * 0.0005
    uniform = [bm.verts.new((radius * math.sin(2 * math.pi * i / count), -radius * math.cos(2 * math.pi * i / count), z)) for i in range(count)]
    if rings:
        previous = rings[-1]
        params = aligned_parameters(len(previous), count)
        transition = [bm.verts.new((radius * math.sin(2 * math.pi * p), -radius * math.cos(2 * math.pi * p), z + 0.006)) for p in params]
        connect_reduction(bm, previous, transition)
        connect_reduction(bm, transition, uniform)
    rings.append(uniform)
for v in bm.verts:
    radius = 0.06 + (0.072 - v.co.z) / 0.012 * 0.0005
    radial = Vector((v.co.x, v.co.y, 0)).normalized() * radius
    v.co.x, v.co.y = radial.x, radial.y
orient_surface(bm)
groups = boundary_groups(bm)
report = {'stage_counts': counts, 'vertices': len(bm.verts), 'faces': len(bm.faces), 'all_quads': all(len(f.verts) == 4 for f in bm.faces), 'boundary_counts': sorted(len(g) for g in groups), 'junctions': sum(len(e.link_faces) > 2 for e in bm.edges), 'winding_errors': sum(e.is_manifold and not e.is_contiguous for e in bm.edges), 'zero_area': sum(f.calc_area() < 1e-12 for f in bm.faces), 'vertex_valence_max': max(len(v.link_edges) for v in bm.verts)}
assert report['all_quads'] and report['boundary_counts'] == [42, 64]
assert report['junctions'] == report['winding_errors'] == report['zero_area'] == 0
mesh = bpy.data.meshes.new('Density_Transition_Proof')
bm.to_mesh(mesh)
bm.free()
obj = bpy.data.objects.new('Fixture_64_to_42_No_Character_Changes', mesh)
scene.collection.objects.link(obj)
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        s = area.spaces.active
        s.shading.type = 'SOLID'
        s.overlay.show_wireframes = True
        s.overlay.show_face_orientation = True
        s.region_3d.view_rotation = Vector((0.6, -1, 0.45)).to_track_quat('Z', 'Y')
        s.region_3d.view_location = Vector((0, 0, 0.06))
        s.region_3d.view_distance = 0.30
        s.region_3d.view_perspective = 'ORTHO'
(ROOT / 'reports/quad-transition-fixture.json').write_text(json.dumps(report, indent=2))
print('TRANSITION_FIXTURE_PASS', flush=True)
