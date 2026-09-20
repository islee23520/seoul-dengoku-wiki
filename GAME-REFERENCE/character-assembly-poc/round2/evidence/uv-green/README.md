# UV hard-gate evidence

The corrected default seam is `tests/uv_red/test_round1_uv_false_approval_red.py` importing `gate.uv_audit`; it no longer executes selected AST fragments from immutable round-one scripts. `tests/uv_red/run_red.py --historical-replay` reads the already captured root evidence at `/Users/danny/workspace/seoul-kenshi-character-round2/evidence/uv-red` and verifies all archived source hashes remain unchanged. This preserves the faithful five-failure RED transcript without overwriting it.

Native extraction is `scripts/extract_uv.py`. It opens a saved `.blend` in a fresh Blender process, gets each evaluated mesh, calls `Mesh.calc_loop_triangles()`, and records each loop triangle's polygon ID, loop IDs, and active-layer loop UV values. The default integration test creates a saved concave Blender fixture and exercises this extractor; it does not compare two constant triangle lists or compute expected tessellation through production code.

`gate.uv_audit` uses float64 normalized atlas coordinates. Its fixed epsilon units are UV area (`normalized_uv_squared`):

- degenerate triangle: area <= `1e-14 UV²`
- positive overlap: exact clipped intersection area > `1e-13 UV²`

The broad-phase 256x256 spatial bins only prune candidates. Every surviving pair uses exact convex triangle clipping. Shared-edge and point contact have zero area and are allowed. Same-polygon and topologically adjacent triangles receive no exemption when their intersection has positive area.

The UV verdict covers only hard extraction invariants: shape, nonempty mesh/triangles, UV presence, finite values, degeneracy, [0,1] tile bounds, and positive-area overlap. Anatomical seams, island connectivity, padding, packing quality, texel density, stretch, checker render, and source-color render stay explicitly `unproven`; native overlap zero is not production acceptance.
