# Portrait quality floor and review checkpoints

## Authority

Owner requirement, 2026-09-15: every generated portrait must meet or exceed the
quality of `.omo/evidence/portrait-slot-layers-20260914/raw/guide-bust.png`.
The reference is 1145 x 1374. Its SHA256 is
`c3a7e4815de6acaef28faf429395417a001bfe8088df633537c6e1a2aa9109a9`.
The repository copy is [original/target.png](original/target.png), with the same
hash. Keep both immutable. This floor applies to all characters, sexes, applicable
slots, authored hidden surfaces, and actual mixed-slot exports.

This is a quality benchmark, not a requirement to copy the same identity, haircut,
expression or costume. Male anatomy and genuinely different variants are allowed;
simplifying the rendering below the benchmark is not. Numerical registration,
variant counts and a clean alpha channel cannot establish artistic quality.
Stage 1 remains governed by [MATCH-TARGET.md](MATCH-TARGET.md); this document adds
the minimum art-quality gate for Stage 2 and Stage 3 without changing its result.

## Observable minimums

| Check | What the reference establishes | Reject when |
| --- | --- | --- |
| Q01 Line hierarchy | Strong coherent silhouette and lid strokes; finer interior seams, brows and tapered hair tips; deliberate weight variation | Uniform vector-like outlines, polygon brows, doubled lids, interrupted contours, detached ink or blunt clipped strands |
| Q02 Hair construction | Distinct overlapping locks, directional roots, asymmetric silhouette, open strand gaps and restrained angular highlight groups | Smooth helmet mass, repetitive strand wallpaper, airbrushed gloss replacing lock structure, visible front/rear texture seams, lost wisps |
| Q03 Facial volume | Coherent three-quarter eye sizes and perspective; nose/ear planes; readable jaw and neck occlusion shadows; restrained soft transitions between selected planes | Flat mannequin lighting, weak structural shadows, unrelated feature perspectives, pasted skin islands, a doubled jaw shadow or a shifted face when slots change |
| Q04 Eyes and expression | Dark upper-lid emphasis, readable pupils and restrained iris highlights, complete brow strokes, deliberate gaze and subtle expression | Sticker-like iris disks, excessive bright jewel detail replacing gaze, schematic sclera, crossed or drifting pupils, skin-colored lash debris, iris spill over lids |
| Q05 Material distinction | Matte skin, grouped hair sheen, woven/weathered cloth, seams and heavier strap material remain distinct | Plastic skin, uniformly smooth cloth, generic glossy materials, procedural noise used instead of fabric construction, missing stitching or structurally cut seams |
| Q06 Light and palette | Muted charcoal and blue-gray with restrained ochre accents; warm skin; a consistent light direction and strong local occlusion under hair, chin and overlapping cloth | Washed-out low-contrast repaint, oversaturated accents, conflicting light directions, absent contact shadows, shadows from absent accessories |
| Q07 Detail hierarchy | Eyes and face remain the focus; secondary strands, seams and material wear support them without equal visual noise everywhere | Uniform detail density, empty simplified clothes beneath a highly rendered face, indiscriminate texture sharpening, oversmoothing or noise that hides defects |
| Q08 Edge finish | Clean intentional outer silhouettes and fine strand edges at native size, with no unrelated background attached | Jagged scalp/shoulder cuts, bright/dark matte fringe, notches, detached speckles, opaque background pixels, interior translucency or geometric partition edges |
| Q09 Anatomy and fit | Head, neck, shoulders and garment construction describe one coherent wearer | Anatomically awkward midpoint shoulders, seams cut by a shared mask, detached collar, exposed skin outside clothes, runtime stretching to conceal incompatible parts |
| Q10 Composite continuity | Every visible transition must look like one deliberately painted illustration | Quality drops when hair, eyes or clothes are exchanged; a combination requires matching variant indices, hidden filtering, or a full-face fallback plate |

Do not require every garment to be equally worn or every face to be equally stern.
A clean garment still needs comparable construction, folds and material specificity.
An alternate palette must retain comparable value hierarchy and intentional lighting.
More texture, resolution, sharpness or render time is not proof of higher quality.

## Review procedure and evidence

1. Freeze the reference, candidate, contributing layer and recipe/library hashes.
   Record character ID when reviewing an assigned portrait, sex, variant IDs, z
   order and exact source files. Distinguish authored hidden pixels from extraction.
2. Show the reference and candidate at the same native pixel scale, without
   sharpening, smoothing or resizing one to flatter it. Inspect full portraits at
   50% and at the actual demo display size; inspect corresponding face, hair,
   collar/shoulder and material crops at 100%. Oversized sheets auto-scaled by a
   viewer do not count as native inspection: open separate bounded crops.
3. Inspect isolated transparent parts on black, neutral gray and white. Toggle
   occluders to expose Stage-2 hidden surfaces. Transparent export metadata alone
   does not establish correct alpha or complete hidden material.
4. For each applicable Q01-Q10 row, record PASS, FAIL or NOT VERIFIED, the exact
   crop path, concrete observations relative to the reference, reviewer and time.
   N/A is allowed only for a genuinely absent property of an isolated part, with
   a reason; it cannot exempt that property in a full composite.
5. Record the separate numeric gates: dimensions, anchors, alpha, coverage, slot
   counts, distinct content, common shoulders, preservation and source-over order.
   Keep these separate from artistic verdicts. No global score or averaging can
   compensate for a failed quality row.

The lead must actually open and inspect the recorded images. A worker recommendation,
contact-sheet existence, test result, provider name or written prompt is not a visual
PASS. Missing evidence means NOT VERIFIED; a visible below-reference result means FAIL.
Final acceptance requires every applicable row PASS and no outstanding numeric gate.

## Mandatory checkpoints

- **GQ1 - Pilot style lock, before ten-wide production:** compare the complete
  pilot and each initial slot against the reference. Geometry scaffolds are not
  approved variants. A below-floor pilot must be reworked before multiplying it.
- **GQ2 - Per-variant asset acceptance:** inspect every applicable variant's
  isolated support and rendered result; review authored hidden surfaces under
  contrasting occluders. Ten recolors or corrective copies do not satisfy ten
  genuine variants. No unreviewed asset enters the accepted library.
- **GQ3 - Cross-combination acceptance:** inspect every variant in an actual
  composite, all four initial two-front/two-rear crosses, contrasting low/high
  collars, and recorded pairwise/adversarial combinations. Do not claim exhaustive
  Cartesian coverage. A failure rejects the affected asset/compatibility contract.
- **GQ4 - Character delivery:** exercise the real Design tool at desktop/mobile,
  select and reproduce character-linked recipes, inspect exported PNGs against
  the reference, and verify ID/library bindings. UI tests alone cannot pass this.

The common shoulder contour is binding across garments: choose the natural shared
midpoint and author each asset to it. Both exact geometric agreement and natural
anatomy/seam construction must pass. Runtime scaling or an abrupt common-mask cut
does not satisfy this contract. Neutral body support must fit the same contract.

## Current baseline disposition

At introduction of this checkpoint, existing pilots are NOT grandfathered into
PASS. Lead comparison against the reference identified weaker hair-lock hierarchy,
weaker facial shadow structure and reduced cloth texture/seam specificity in the
current female pilot. Existing alpha and shoulder defects remain open. GQ1 is
therefore FAIL for that pilot, pending rework and a new evidence-bound review.
No production-ready 420-variant library or all-character delivery is implied.
