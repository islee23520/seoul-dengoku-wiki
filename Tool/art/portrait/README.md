# Portrait tool

Canonical package path: `Tool/art`. Do not add a second root `tools/` folder.

- Original (immutable): `original/target.png` — SHA-256 `c3a7e4815de6acaef28faf429395417a001bfe8088df633537c6e1a2aa9109a9`. Same bytes as `Design/portrait-demo/assets/v2/target.png`. Never auto-replace.
- Final default combo: `final/h0-e0-o0.png` (dirty vs target = 0).
- Eight-combo matrix: `final/matrix/h{0,1}-e{0,1}-o{0,1}.png` (8 unique hashes).

```bash
node Tool/art/portrait/verify-portrait-recipe.mjs --recipe .omo/evidence/portrait-authoring-v2/recipe.json --mode contract
node Tool/art/portrait/verify-portrait-recipe.mjs --recipe .omo/evidence/portrait-authoring-v2/recipe.json --mode base
node Tool/art/portrait/verify-portrait-recipe.mjs --recipe .omo/evidence/portrait-authoring-v2/recipe.json --mode matrix
node --test Tool/art/portrait/test-portrait-layer-composite.mjs Tool/art/portrait/test-portrait-layer-slots.mjs Tool/art/portrait/test-ingest-see-through.mjs
```
