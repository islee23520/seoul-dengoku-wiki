# Verified female garment UV bundle

Final candidate: **[female-garment-uv.blend](female-garment-uv.blend)**. This file contains exactly `Female_Bandeau_Measured` and `Female_Briefs_Panel`, with their original material and exact geometry. Both use the single UV0 layer `GarmentUV_4K` in one shared 4096-square atlas. The parent character, corrected eyes, body UV, mouth, shaders and production character pipeline are not part of this output.

Candidate SHA-256: `da21ee3cfd1aae404497d3776231c32a5c4eb8019f837290a35338321408f112`.

## Native saved/reopened verdict

| Object | Native triangles | UV overlaps | Degenerate UV triangles | UV0 |
|---|---:|---:|---:|---|
| Female_Bandeau_Measured | 2,168 | 0 | 0 | PASS |
| Female_Briefs_Panel | 1,492 | 0 | 0 | PASS |

The combined shared-atlas audit also passes with no overlap, including cross-object pairs. All UV coordinates are finite and in `[0,1]`. The unchanged hard gate uses minimum triangle area `1e-14 UV²` and positive overlap area `1e-13 UV²`. See [native-verdict.json](native-verdict.json) and [native-extraction.json](native-extraction.json). No alternate triangle tessellation is used by the verdict.

The defective baseline is recorded in [baseline-inspection.json](baseline-inspection.json): bandeau `Attribute` UV has **990 positive overlap pairs and 240 degenerate triangles**; briefs have no UV layer. Baseline UV is retained in the immutable source and the numbered attempt evidence, not as a defective extra UV channel in the final candidate.

## Deliberate chart construction

There are **9 charts**, not per-face or Smart Project islands:

- Bandeau outer and inner: one posterior cut between lower and upper torso openings, one disk per surface. The posterior seam is visible in the back checker as intended.
- Briefs outer and inner: two lateral waist-to-leg seams. The front, crotch bridge and posterior replacement panel stay connected in an unfolded hourglass-shaped disk per surface. There is no crotch-center UV cut.
- Rims: two bandeau strips and three briefs strips. Each aperture has one thickness-edge cut and ordered arc-length coordinates, with actual variable shell thickness preserved in UV proportion.

Actual saved UV edge graphs verify **Euler characteristic 1 and one closed, degree-2 boundary cycle for every chart**, including the rims. Ordered boundaries are in [quality.json](quality.json). Original surface correspondence, source custom properties and selected seam vertex coordinates are in [chart-construction.json](chart-construction.json). Native-loop assignment is in [original-loop-assignment.json](original-loop-assignment.json).

Layer identification matters: the bandeau's applied Solidify creates **outer vertices 0–541, inner 542–1083**. The rebuilt briefs use **inner 0–371, outer 372–743**. Their constructor half orders are opposite. The final named charts correct the temporary construction identifiers; no UV coordinates were changed for that correction. The bandeau retains source `round2_parent_index`, `VerifiedQuadRepair`, `NeckCorrection`, custom-normal and other non-UV attributes. The briefs retain `surface_vertex_count`, `replaced_source_face_ids`, `construction_script` and source SHA properties; a nonexistent per-face panel attribute was not invented.

Surface cuts are applied only to temporary disk meshes for angle-based unfolding. UV values are transferred back by **original polygon loop index**, so the shared corner of both native triangles in a quad cannot receive two different coordinates. Original vertices, face ordering, native diagonals, material indices and world matrices are unchanged.

## Atlas measurements and review

| Measurement | Result |
|---|---:|
| Minimum measured inter-chart gap at 4K | 20.00 px |
| Minimum measured tile border at 4K | 20.00 px |
| Aggregate chart density | approximately 3,486.9 px/m |
| Highest/lowest aggregate chart-density ratio | 1.000035954 |
| Sum of native UV triangle areas / atlas area | 41.1310% |
| Outer bandeau area-weighted anisotropy, P95 / max | 1.0573 / 1.3733 |
| Outer briefs area-weighted anisotropy, P95 / max | 1.1288 / 1.3358 |

Density was normalized by actual surface area and packed at one common scale. This is a measured result, **not an owner-approved density target**. Rectangle-based packing deliberately leaves more empty area around curved charts in exchange for a simple, measurable nonoverlap and padding guarantee. Thin rims remain approximately 2–3 atlas pixels thick; they were not enlarged at the expense of equal density. Local triangle density varies with curvature, and the inner bandeau has one small native-triangle anisotropy maximum of 2.0251. Full area-weighted quantiles, per-chart density ranges and pairwise gap measurements remain in `quality.json`; this is not a claim of perfectly uniform stretch.

![Named shared atlas](named-atlas.png)
![Named chart details](named-chart-details.png)

`uv-layout-4096.png` is the actual native-triangle UV wire layout. `shared-checker-4096.png` is a deterministic 64-by-64 diagnostic checker, not a cloth color bake or AI image. In the detail sheet only, rim thickness is enlarged and explicitly labeled for readability; the actual atlas is unchanged.

### Before / after views

Final source-bound images are in **[before-final](before-final/)** and **[after-final](after-final/)**, each with front, back, side, bandeau-front, briefs-front, briefs-back and crotch images plus SHA-bound `receipt.json`. These are identical cameras and disposable checker material overrides. No body geometry is shown or modified. Emission checker review adds no fake shadows and never saves the review material into the cloth source or final bundle.

| View | Before | After |
|---|---|---|
| Front | [before](before-final/front.png) | [after](after-final/front.png) |
| Back | [before](before-final/back.png) | [after](after-final/back.png) |
| Side | [before](before-final/side.png) | [after](after-final/side.png) |
| Crotch | [before](before-final/crotch.png) | [after](after-final/crotch.png) |

The checker is continuous within each surface chart, with intentional mismatch at the posterior bandeau seam and lateral brief seams. Front crotch squares foreshorten in a straight front camera; the separate underside view exposes the continuous crotch chart. Existing low-poly hem silhouettes and tiny rim pixels remain visible, not hidden by shading. Earlier `before/` and `after/` renders are retained but the `*-final/` views fix clipped brief/crotch framing and bind directly to the final bundle.

## Exact geometry and clearance provenance

Input: `../garment-shell-topology/female-underwear-topology-v4.blend`.

Input SHA-256 remains `0ac891a2625bb1330c1b5942945854c041d503e678da7406e304034264160a02`.

| Object | Identical before/after semantic SHA-256 |
|---|---|
| Bandeau | `de5821eb6b1b18be4a36ec9bcae4a6027f51e86e754334adf37d8f077e487c94` |
| Briefs | `fb83b528287499abc5f25aba27dc58d4f710e9d732bd22f86537c1e3debfc4bb` |

The fingerprint covers ordered vertex coordinates, edges, polygons, loop vertex/edge indices, native triangles and loop indices, world matrix, material assignment and nodes, custom properties, non-UV attributes and custom normals. Only UV and seam/selection fields are excluded. The body fingerprint is asserted unchanged during chart building and before garment-only export; the body is not carried into the output. Material `ReviewNavyCloth` is constant-color and has no UV texture dependency, so no material node hookup is necessary. For diagnostic PNG use on a disposable material: `UV Map: GarmentUV_4K -> Image Texture: shared-checker-4096.png -> Emission -> Material Output`.

The exact geometric equality preserves the source certificate in `../garment-shell-topology/final-v4-verification.json` and `continuous-clearance-v4.json`. The source certificate's continuous lower bounds remain **0.050006639 mm for bandeau** and **0.050000844 mm for briefs**, with its original 0.01 mm numerical guard. This is provenance-preserving reuse of the existing continuous certificate, **not a new full native geometry/clearance audit**. It applies to the same body coordinates and original world-space placement only.

## Reuse and reproduction

Use `original-loop-assignment.json` to assign each original loop, with its vertex index and semantic fingerprint checked first. `apply_assignment.py` performs this replay **in memory only** and was tested on the certified source with `ASSIGNMENT_REPLAY_PASS_IN_MEMORY_ONLY`. It does not save into any parent scene or source file. A caller with separately authorized saving owns that step.

Commands below run from this directory using Blender 5.2.2 LTS. Regeneration writes only this directory and replaces this track's named outputs; retain numbered evidence when comparing an independent attempt.

```bash
export PYTHONDONTWRITEBYTECODE=1
B=/Applications/Blender.app/Contents/MacOS/Blender
S=../garment-shell-topology/female-underwear-topology-v4.blend
"$B" -b --factory-startup "$S" --python-exit-code 1 --python inspect_baseline.py
"$B" -b --factory-startup "$S" --python-exit-code 1 --python build_charts.py
"$B" -b --factory-startup "$S" --python-exit-code 1 --python pack_assign.py
"$B" -b --factory-startup female-garment-uv-attempt-01.blend --python-exit-code 1 --python finalize_bundle.py
"$B" -b --factory-startup female-garment-uv.blend --python-exit-code 1 --python verify_candidate.py --python measure_quality.py
python3 draw_atlas.py
"$B" -b --factory-startup "$S" --python-exit-code 1 --python checker_review.py -- before-final
"$B" -b --factory-startup female-garment-uv.blend --python-exit-code 1 --python checker_review.py -- after-final
"$B" -b --factory-startup "$S" --python-exit-code 1 --python apply_assignment.py
```

Actual jobs ran in background monitors, not foreground Blender. No commits or subagents were used. No body/source/gate/config files were edited. [failure-record.md](failure-record.md) retains the baseline serialization error and native Scene-copy crash/recovery. The object-library intermediary and numbered candidate are construction evidence, not additional recommended deliverables.

Host LSP cannot resolve Blender-only `bpy`, `mathutils`, or Blender-injected sibling import paths. Those environment diagnostics are not suppressed. Blender execution validates the imports; generated JSON diagnostics and the script structural rule checker are recorded separately. Parent visual approval remains the parent's action; this is a completed local UV candidate, not approval of a whole character.
