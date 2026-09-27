# LORE/bestiary — generated ecology and variant encyclopedia

## OVERVIEW
`Hostile-Ecology-Index.json` and `groups/Hostile-Group-G01~G27.json` are generated views of `../World-Narrative-Atlas.json`. Each group page owns its common ecology, variant relationship, Total War-style battlefield classification, scenarios and every authored `GxxEyy` entry.

## RULES
- Never edit generated bestiary pages by hand. Edit `../World-Narrative-Atlas.json`, then run `node scripts/materialize-world-atlas.mjs --atlas lore/World-Narrative-Atlas.json --out lore`.
- Permanent IDs are `G01–G27` and `GxxEyy`. Mxxx is source provenance only; no `Monster-Batch-*.md` or batch manifest page exists.
- Common species or passive facility ecology and exceptional variants remain separate. A boss role does not automatically make an organism the biological ruler of every common group.
- Animals, machines, facilities and events do not inherit the human 20-soldier squad cap. No direct hero-action skills are introduced here.
- M007's ten reserved IDs remain unwritten.

## VERIFY
```bash
node --test TOOL/tools/wiki/test-world-atlas.mjs
node scripts/materialize-world-atlas.mjs --atlas lore/World-Narrative-Atlas.json --out lore --check
```
