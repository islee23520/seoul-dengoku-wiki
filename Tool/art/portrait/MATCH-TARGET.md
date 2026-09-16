# Matching this target PNG

Target (immutable): `original/target.png`
SHA-256: `c3a7e4815de6acaef28faf429395417a001bfe8088df633537c6e1a2aa9109a9`
Canvas: 1145×1374, origin top-left. One bust. Not a gender/age atlas.

## Meaning

Matching the target means the **visible ink of this drawing** is owned and restored.

1. Every opaque pixel of the decoded target belongs to exactly one semantic region (background is its own id).
2. Region boundaries follow **this plate’s drawn edges**: hair silhouette, brow strokes, lid/iris, nose bridge, lip line, ear contour, wrap collar, ochre inner, backpack straps. Not convex hulls, not hex tiles, not rectangles.
3. Source-over of the owned visible pieces, z 0→21, equals the target’s decoded RGBA (internal dirty 0). The full plate must not live inside `face_base`.
4. Numeric 0-delta does not pass vision. 100% / 50% / UI-size look: missing brow, face-outline drift, blush add, double chin, collar hole, hair bleed, background fringe → fail.

## Not matching

- Hex / convex puzzle tiles (current `qa/ownership-overlay.png`).
- Punching geometric holes in skin for eyes/nose/mouth instead of cutting on ink.
- Hiding the whole bust in one slot then claiming 22 layers.
- “Extracted from original” for pixels that are occluded on this plate (that is stage 2, hidden faces).
- Treating CLI `--mode contract|partition|base` alone as stage-1 pass.
- Generalizing this female bust’s empty `neck/cheeks/chin` to other sexes or ages.
- RGB/HSV flood fills (`qa/stage1-ink-overlay-draft.png`): dark clothes and irises become “hair”; straps vanish; magenta leftover speckles. Color clustering is not ink.

## Stage order (do not mix)

1. Split = this document.
2. Parts = occluded faces exist under hair/clothes; do not relabel invented pixels as extracted.
3. Combo = other hair/eyes/outfit bind on the same coordinates; default restore is not combo done.

Stage-2 and Stage-3 art must also pass the reference-bound
[quality floor and checkpoints](QUALITY-GATE.md). Numeric restoration or clean
slot geometry cannot substitute for that visual quality gate.
