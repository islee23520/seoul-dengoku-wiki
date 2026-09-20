# Female local UV final candidate

## Deliverable and verdict

`female-local-uv-final.blend` is the single delivered UV candidate.

**Saved native UV hard gate: PASS. Source preservation: PASS. Color: UNPROVEN.**
This is not a full art-quality or source-color PASS.

Candidate SHA-256:
`5f22e7587e6acde250b5d1d634fd132658c4f7e2e7cb29ed378f7dc68be8626c`.

The independent unchanged repository `gate.uv_report` audited the saved,
reopened Blender 5.2.2 evaluated native loop triangles:

| Measurement | Input | Final |
| --- | ---: | ---: |
| Native triangles | 89,840 | 89,840 |
| Polygons | 47,511 | 47,511 |
| Degenerate UV triangles, area <= 1e-14 | 0 | 0 |
| Positive overlap pairs, area > 1e-13 | 798 | 0 |
| Exact intersection tests | 244,252 | 240,830 |

No same-polygon, adjacency, shared-edge, or shared-point exemption was added.
All target coordinates remain in the normalized atlas. The final gate and
native extraction are `final-native-verdict.json` and
`final-native-extraction.json`.

## Actual graph, cause, and bounded repair

The graph is face-atomic: native Blender loops are original polygon corners;
opposite edge uses are joined only when both endpoint vertex IDs and both
endpoint UV values agree. Native diagonals reference those unique corners,
never independently assigned triangle corners. There is no choose-last UV.

The independently reproduced baseline has 798 overlap pairs involving 170
distinct polygons, including 17 within one original polygon. These occupy
19 of 3,727 original UV charts. **Cross-chart packing overlap is zero.**
The 59 initial edge-connected affected components include local reversed
triangles and same-sign patches that overlap other parts of the same chart.
Thus the cause is intrachart folding/returning placement, not colliding packed
chart rectangles. `neighborhood-analysis.json` lists every face, sign count,
chart ID, disk topology, and world-space bounds. Exact overlap geometry is in
`baseline-native-audit.json`; duplicated full UV assignment is not asserted
as a separately established root cause.

One original-polygon-edge neighbor ring joins nearby failures and supplies
interior vertices. This produces 52 disjoint disk neighborhoods, 335 owned
polygons total, each with Euler characteristic 1, one boundary and no boundary
branch. No hole/branch split was required on the measured neighborhoods.
No global unwrap, 10,220-face retry, or per-face-island repair was used.

Each native triangulated disk uses strictly positive uniform weights (1.0)
and a sparse Dirichlet solve. Original boundary positions are tried first;
3 neighborhoods pass positive orientation, local native audit, and exact
intersection checks against every outside native triangle. The other 49
require a new boundary seam. They use a strictly convex equal-angle circular
boundary and the same positive-weight solve. The prescribed triangulation is
retained inside each original polygon. These are 2-75-polygon disks, not
standalone triangle islands.

New parameterizations match the neighborhood's original total unsigned UV
area. A rigid translation then places only that neighborhood in actual empty
atlas space, using conservative occupied triangle bounding cells at 2048
resolution with two-cell padding. No healthy chart is moved, rescaled or
repacked. The empty-space check is followed by exact local and exhaustive
outside-triangle intersection tests. After the complete UV edit batch, the
full native audit is run; saving/reopening is followed by a second independent
full native audit. `repair-attempts.json` retains all rejected pinned solutions
and accepted convex solutions with audits and transforms.

## Preservation and chart cost

- 1,240 of 184,862 loops changed; **183,622 loops are bit-identical**.
- 327 polygons actually changed inside 335 owned polygons.
- All loops outside owned neighborhoods are exactly unchanged.
- 19 original charts changed; **3,708 original charts are untouched**.
- Final chart count is 3,796, a net increase of 69.
- 236 original mesh edges become UV discontinuities, recorded in
  `authored-uv-seams.json`. Mesh seam flags themselves remain unchanged.
- Repair disks contain no single-polygon islands. Splitting their surrounding
  old charts leaves six additional single-polygon remnants: existing total
  1,507 becomes 1,513. This fragmentation cost is disclosed, not omitted.

`preservation-report.json` compares before and reloaded-after hashes for local
positions, world positions, edges, loop vertex IDs, polygon layout, world
matrix, native triangulation, vertex normals, corner normals, sharp edges,
smooth faces, seam flags, modifiers and `LockedSourceUV`. Every value agrees.
Counts remain 44,983 vertices, 92,494 edges, 47,511 polygons, 184,862 loops and
89,840 triangles. The supplied self-intersection-zero geometry is preserved;
this run did not substitute a new geometry self-intersection measurement.

Input file SHA-256 remains
`1f7be8508a0fb7b4bd72d151af463a4b48a89f049a6821043d37949264ed918b`.
Immutable `LockedSourceUV` float32 hash remains
`a634148ec2e30eb0ed907a0b4a2778eee0c83f3c4d565235159b0691017bd987`.

## Stretch and visual review

World-area-weighted P99 stretch changes from 1.262462 to 1.262806. However,
unweighted P99 changes from 1.562693 to 1.958525, and high-stretch counts grow.
Injectivity is achieved with a localized distortion cost:

| Final stretch threshold | Triangle count | World area (m2) | UV area |
| --- | ---: | ---: | ---: |
| > 4 | 514 | 2.6200716407682626e-4 | 2.763942367301625e-5 |
| > 10 | 268 | 8.32437970399579e-5 | 1.0555001826506594e-5 |
| > 100 | 24 | 4.5355422101612e-6 | 1.238014930571296e-7 |
| > 1000 | 1 | 3.972422391029795e-11 | 3.1810905909424e-8 |

The maximum is **39,072.6328**, native triangle **5247**, polygon **4658**:
world area **3.972422391029795e-11 m2**, UV area
**3.1810905909424e-8**. Its source geometry is an extremely thin, valid sliver
and was not changed. It is not removed from counts or classified away.
The next-largest stretch is 572.5170, triangle 82883, polygon 44032, with world
area 7.251791873455859e-8 m2 and UV area 2.91500157345581e-12.
`quality-report.json` contains before/after percentiles, all threshold counts,
separate world/UV area totals and the top 30 slivers in each state.

Actual 1024-square before/after checker renders cover front, back, side,
quarter, head-neck, both hands and feet. All eight matching camera frames use
world-space bounds and identical camera transforms; receipts contain image
hashes. See `renders/{before,after}-worldframed-v2/` and
`checker-before-after.png`.

Direct visual inspection finds broad torso/limb readability and framing
preserved. Facial details, fingers and toes remain fragmented in the inherited
atlas. The repaired areas are small at these views; the images do not justify
claiming wholesale visual improvement. The corrected head-neck framing
excludes the outstretched arms from the bounds. The first, overly wide head
capture is retained in `renders/before/` as a failed framing attempt.

## Color and reuse

**No fresh source-color bake is claimed.** The old candidate used interpolated
corner color and collapsed material bindings; some unmatched LockedSourceUV
corners are zero. Its flat old atlas cannot establish exact source-color truth.
The old material remains in the blend and is stale on changed UVs. The parent
must reconstruct exact original bindings before a final bake; see
`COLOR-STATUS.md`. No source UV truth was altered to disguise this problem.

`target-loop-export.npz` provides full per-loop target UVs, original UVs,
deltas, changed loop IDs, polygon IDs and mesh vertex IDs. `per-loop-delta.json`
contains human-readable changed-corner records. For later three-variant reuse,
verify polygon layout and loop-to-vertex correspondence first, then assign
the single target value for each original loop. Do not use nearest UV or
triangle-order overwrite transfer.

## Reproduction

Run from the authorized worktree. Commands only write this output folder.
Use the existing numeric environment for the repair; the final typed gate
requires Python >= 3.13 (`TypeIs`); the verified system Python is 3.14.3.

```bash
cd /Users/danny/workspace/seoul-kenshi-character-round2
R=GAME-REFERENCE/character-assembly-poc/round2
W="$R/work/female-local-uv-final"
P="$R/work/male-injective-relax/.venv/bin/python"
B=/Applications/Blender.app/Contents/MacOS/Blender
export PYTHONDONTWRITEBYTECODE=1
"$B" --background --factory-startup --python "$W/extract_graph.py"
"$P" "$W/local_repair.py"
"$P" "$W/local_repair.py" --repair
"$B" --background --factory-startup --python "$W/save_candidate.py"
python3 "$W/audit_final.py"
"$B" --background --factory-startup --python "$W/render_checker.py" -- before
"$B" --background --factory-startup --python "$W/render_checker.py" -- after
python3 "$W/package_evidence.py"
```

Native graph NPZ must be loaded into resident arrays once: the first analysis
attempt repeatedly decompressed archive members and timed out before analysis
completion. No UV edit resulted. A later final-audit invocation using Python
3.12 failed importing TypeIs; the unchanged gate succeeded with Python 3.14.
Those execution failures and all rejected pinned parameterizations are retained
in this report and the attempt records. There was no failed global unwrap.

All five Python scripts preceding packaging passed available LSP error
diagnostics. No source, gate, configuration or tested-core file was edited,
no nested agent was spawned, and no commit was made.
