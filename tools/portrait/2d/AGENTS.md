# 2D WORKFLOW KNOWLEDGE BASE

Score 10 (8-15 band, distinct domain): 62 files / ~11.4k LOC, own `vitest.config.mjs` + JSON schemas; the 2D half of portrait/ — no 3D model, rig or Blender ever required (independence declared in parent).

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Portrait/full-body prompt emission | `emit-character-prompt.mjs` (scripts `portrait:2d` / `full-body:2d`; `emit`, `formatPrompt`, `listCharacters`, `publicPrompt`) |
| Workstation design prompts | `design-prompt.mjs` (`emitWorkstationPrompt`; schema `character-art-2d.v1`) |
| Authored look tokens | `characters/*.json` (schemaVersion 1 + `sourceStatus`; currently iyen, shin-jongmok) |
| Schemas | `character.schema.json`, `design-prompt.schema.json`, `face-selection.schema.json`, `face-variants.schema.json` |
| Character sets / batch resume | `generate-character-set.mjs`, `batch-resume.mjs` + `batch-resume-cli.mjs` |
| Image transports | `image-generate.mjs`, `codex-image.mjs`, `cliproxy-edit.mjs`, `image-connection.mjs` |
| Face selection / neutral slots | `face-selection.mjs`, `../neutral-slots.mjs` (portrait root) |
| Local surfaces | `server.mjs` (script `serve:2d`), `mcp.mjs` (script `mcp:2d`, MCP server) |
| Contracts | `CONTRACTS.md` |

## CONVENTIONS

- Tests: `npm --prefix TOOL/avatar-gen/portrait run test:2d` — own vitest config, colocated `*.test.mjs`.
- `h3-comfyui/` (`install/`, `postprocess/`, `workflows/`) is an empty scaffold; no active code references it.
- Prompt compiler bounds live in tools-portal (repo split); do not duplicate them here.

## ANTI-PATTERNS

- Do not require 3D/Blender on this path or call 3D render code from these modules.
- Do not add `characters/*.json` fields outside `character.schema.json`; author people through the schema, not ad-hoc keys.

## COMMANDS

```bash
npm --prefix TOOL/avatar-gen/portrait run portrait:2d     # 2D portrait prompts
npm --prefix TOOL/avatar-gen/portrait run full-body:2d    # 2D full-body prompts
npm --prefix TOOL/avatar-gen/portrait run test:2d         # own vitest config
npm --prefix TOOL/avatar-gen/portrait run serve:2d        # local HTTP surface
npm --prefix TOOL/avatar-gen/portrait run mcp:2d          # MCP server
```
