# Numeric gate typing increment

The required command, run from the round2 directory, exits 0:

```sh
basedpyright --project pyrightconfig.json gate/uv_audit.py gate/intersections.py
```

`before/types.txt` records 0 errors and 121 warnings; `after/types.txt` records
0 errors, 0 warnings and 0 information diagnostics (basedpyright 1.40.1).
No configuration changes, suppressions, casts or new engine dependencies were used.
The session's workspace LSP separately emitted NumPy reduction `reportAny`
warnings; it does not match the explicit round2 project CLI result. The clean
claim here is the requested project command, not that separate LSP environment.

## Behavior and real surfaces

- The existing 11 intersection and 18 top-level UV tests passed before editing
  and after editing, including real Blender fixture creation/opening. Evidence:
  `before/suites.txt` and `after/suites.txt` (29 passed each).
- Seven additional existing UV regressions were discovered in `tests/uv_red/`
  after the edit. They passed against both the exact original UV source and the
  changed source, including native concave tessellation. This baseline was
  reconstructed afterward, not executed before editing: `before/uv_audit.py`
  matches the pre-edit SHA256 recorded in `before/source-hashes.json` exactly.
  Evidence: both `additional-uv-regressions.txt` files. Total: 36 passing cases
  per source version, with this explicit chronological qualification.
- The existing native intersection test writes fixtures; the evidence pytest
  plugin redirected only its output root under this directory. No production
  script, test source, assertion or repository fixture was edited.
- `verdict-parity.json` compares every parsed JSON field for four real CLI
  cases: native male UV, native female UV, saved native clean intersection and
  saved native crossing intersection. All fields match, including numerical
  measurements, classification lists, source receipts and failure reasons.
- Male UV: 133,792 triangles, 590,249 exact checks, zero overlaps, PASS.
  Whole CLI time was 21.605 s before and 21.352 s after.
- Female UV: 91,428 triangles, 40,853 degenerate triangles, 1,630 overlaps,
  370,310 exact checks, FAIL. Whole CLI time was 26.342 s before and 26.370 s
  after. Timings are single runs, not a statistical performance benchmark.
- The historical female body-only case retains all 221 triangle pairs,
  classifications and shared-vertex counts over 90,192 triangles, with the
  same source hash and hard failures. `female-body-parity.json` records this;
  the unchanged historical source is `work/female-local-surface/metrics/source-analysis.json`.
  The historical 221 count is not asserted as universal ground truth.
- An additional real whole-scene CLI run processed 205,434 triangles and
  14,590,161 broadphase candidate pairs. Its 7,609 intersections are in
  `after/full-female.json`; that scene includes 31 mesh objects, so it is not
  the body-only 221 case and has no pre-edit whole-scene parity claim.

## Scope and preservation

Only `gate/uv_audit.py`, `gate/intersections.py` and this evidence directory
were written. Existing local-roundoff plane membership, coplanar edge-length
epsilon units and UV out-of-tile early rejection remain intact. NumPy math,
spatial bins and the BVH remain; ndarray indexing now uses typed slices and
dtype-preserving scalar extraction. Scalar cross products deliberately retain
NumPy float64 arithmetic. Public return structures are unchanged.

`cleanup.json` confirms removal of this run's temporary fixture models,
temporary test outputs and sandbox symlink. No model changes or commits were
made. JSON outputs and command logs are retained as evidence.
