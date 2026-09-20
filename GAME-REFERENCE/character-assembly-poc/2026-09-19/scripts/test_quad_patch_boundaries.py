# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Regression fixture: preserve explicit neck loop, repair only unintended holes."""
import sys
from pathlib import Path

import bmesh

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from mesh_tools import boundary_groups
from quad_patch_repair import repair_patches

bm = bmesh.new()
bmesh.ops.create_cube(bm, size=1)
bm.faces.ensure_lookup_table()
remove = {f for f in bm.faces if f.calc_center_median().z > .4 or f.calc_center_median().z < -.4}
bmesh.ops.delete(bm, geom=list(remove), context='FACES_ONLY')
groups = boundary_groups(bm)
top = next(g for g in groups if all(v.co.z > .4 for e in g for v in e.verts))
original_top = {tuple(v.co) for e in top for v in e.verts}
protected_groups = [{tuple(v.co) for e in top for v in e.verts}]
repairs = repair_patches(bm, protected_groups)
remaining = boundary_groups(bm)
assert len(remaining) == 1 and {tuple(v.co) for e in remaining[0] for v in e.verts} == original_top
assert len(repairs) == 1
assert all(len(f.verts) == 4 for f in bm.faces)
assert all(len(e.link_faces) <= 2 for e in bm.edges)
bm.free()
print('EXPLICIT_BOUNDARY_REGRESSION_PASS', flush=True)
