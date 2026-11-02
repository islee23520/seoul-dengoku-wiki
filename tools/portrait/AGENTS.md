# PORTRAIT-GEN KNOWLEDGE BASE

Score 15 (8-15 band, distinct domain): own package `portrait-gen` (Node >=23.6), 12 subpackages, >60 measured cross-module import refs. Inlined from the former portrait-gen external repository 2026-09-23.

## OVERVIEW

3D avatar portrait rendering from existing models plus independent 2D portrait/full-body generation; separate from the full-body viewer owned by the parent directory.

## STRUCTURE

```
portrait/
├── 2d/                    # Current 2D workflow (emit-character-prompt.mjs entry, schemas, image tools)
├── bin/                   # portrait-gen.ts CLI; seoul-character.mjs unified cast command
├── pipeline/              # Blender render pipeline (portrait.ts, avatar.ts, slots.ts, fit.ts, catalog.ts)
├── tools/character-tool/  # character-tool CLI + Blender Python ops (align/weld/rig/PBR/QA/render/export)
├── generator/             # portrait-generator preflight/one-request transport CLI (private, bun)
├── acceptance/            # portrait-acceptance evaluator + CLI (internal testing only)
├── native/                # seoul-avatar lib: transport, batch review, shared proportion profiles
├── assets/v2/             # Retained 23-slot plate inventory + library/curation catalogs (INVENTORY.md)
└── CONTRACTS.md WORKFLOW.md SKILL.md INVENTORY.md DESIGN.md README.md
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| 2D portrait/full-body entry | scripts `portrait:2d` / `full-body:2d` -> `2d/emit-character-prompt.mjs` |
| 2D contracts & schemas | `2d/CONTRACTS.md`, `2d/character.schema.json`, `2d/design-prompt.schema.json` |
| Unified cast command | `node TOOL/avatar-gen/portrait/bin/seoul-character.mjs --help` (cast registry, look export, 2D gen, 3D render) |
| 3D render of existing model | `node TOOL/avatar-gen/portrait/bin/portrait-gen.ts generate\|check\|export` (Blender required) |
| Current 3D acceptance contract | `CONTRACTS.md`: pre-baked 3D -> local Blender render -> valid PNG -> PASS |
| Receipt pipeline internals | `pipeline/portrait.ts` (`renderPortrait`, `checkPortrait`, `exportPortrait`) |
| Character/Blender operations | `tools/character-tool/cli.mjs` (script `character`) |
| Preflight/generate transport | `generator/src/preflight.ts` (CLI `portrait-generator`, operator pins required) |
| Acceptance evaluation | `acceptance/src/index.ts` (`evaluatePortraitAcceptance`; dist CLI `portrait-acceptance`) |
| Native transport/batch review | `native/lib/` (bin `seoul-avatar`) |

## CONVENTIONS

- Sources are immutable; every render/check/export writes a new output plus a SHA-256 receipt JSON (`portrait.png.json`); overwrites are refused.
- 2D and 3D stay independent: 2D candidates never require 3D model/rig/Blender; the 3D path never calls model-generation or 2D image APIs.
- 3D defaults: 512x640 transparent RGBA PNG, front -Y / up +Z, explicit yaw and `upper`/`full` framing; PNG decode/CRC/size are verified. `upper` means geometric top half, not face detection.
- Operator inputs (pins, profile SHA, position authority) are supplied independently, never taken from the candidate or its review.
- Completed images/sets are `candidate-unreviewed`; acceptance output is internal testing, never owner/release approval.

## ANTI-PATTERNS

- The retired 2D archive `legacy-2d/` was deleted on 2026-11-02; never recreate it. Retired commands (`pin`, `collect`, `gate`, `verify-comfy`, `turntable`, `base-parts`, 2D `convert`) are rejected with `RETIRED_2D_PIPELINE`.
- No command promotes 2D drafts into canon; do not add one.
- Do not treat provider success, numeric checks or composite match as approval; batch review holds on missing/failed verdicts.
- Do not resize provider PNGs; dimensions must match the authored canvas.
- Do not mix portrait generation into the viewer, or keep compositing copies outside this directory.
- `assets/v2` plates/catalogs are retained inventory (no current generation code references them); do not wire them back in without owner direction.

## COMMANDS

```bash
npm --prefix TOOL/avatar-gen/portrait test           # vitest (own project)
npm --prefix TOOL/avatar-gen/portrait run test:2d    # 2D suite
npm --prefix TOOL/avatar-gen/portrait run test:character
npm --prefix TOOL/avatar-gen/portrait run doctor     # environment checks
npm --prefix TOOL/avatar-gen/portrait run typecheck  # tsc --noEmit
node TOOL/avatar-gen/portrait/bin/portrait-gen.ts generate --input model.glb --output out/portrait.png
node TOOL/avatar-gen/portrait/bin/portrait-gen.ts check --receipt out/portrait.png.json
```
