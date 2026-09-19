# LORE/bestiary — generated ecology and variant encyclopedia

## OVERVIEW
`Hostile-Ecology-Index.md` and `groups/Hostile-Group-G01~G27.md` are generated views of `../World-Narrative-Atlas.md`. Each group page owns its common ecology, variant relationship, Total War-style battlefield classification, scenarios and every authored `GxxEyy` entry.

## RULES
- Never edit generated bestiary pages by hand. Edit `../World-Narrative-Atlas.md`, then run `node TOOL/tools/wiki/materialize-world-atlas.mjs --atlas LORE/World-Narrative-Atlas.md --out LORE`.
- Permanent IDs are `G01–G27` and `GxxEyy`. Mxxx is source provenance only; no `Monster-Batch-*.md` or batch manifest page exists.
- Common species or passive facility ecology and exceptional variants remain separate. A boss role does not automatically make an organism the biological ruler of every common group.
- Animals, machines, facilities and events do not inherit the human 20-soldier squad cap. No direct hero-action skills are introduced here.
- M007's ten reserved IDs remain unwritten.

## VERIFY
```bash
node --test TOOL/tools/wiki/test-world-atlas.mjs
node TOOL/tools/wiki/materialize-world-atlas.mjs --atlas LORE/World-Narrative-Atlas.md --out LORE --check
```
