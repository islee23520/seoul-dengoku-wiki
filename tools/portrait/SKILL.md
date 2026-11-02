---
name: portrait-gen
description: Use the cast-linked portrait tool for JSON-bound 2D portrait creation and modification, or render existing 3D objects locally with Blender.
license: Proprietary
---

# Portrait generation

`bin/seoul-character.mjs` is the single production CLI entry point for portrait workflows. Its matching native MCP tools are exposed by `2d/mcp.mjs`. Do not route production work through legacy scripts, ad hoc prompts, direct provider calls, or a second generator.

## 2D portrait workflow

Follow this ordered path: (1) author and validate sourced identity and independent appearance slots under the task 4 JSON contract; (2) verify package assets, preview, and generate with the exact preview binding using task 5 native tools; (3) correct only through task 6 `modify_portrait`, binding source SHA-256, activated slots, operation, and package/input snapshot; (4) inspect using the mandatory package-bound review overlay. Preserve native outputs and receipts, including failures. Candidates are not owner verdicts. Missing or mismatched package assets stop before provider use.

Rules, samples, measured composition guide, canvas and transparency-edge definitions, and overlay contract are tool-owned package assets resolved and hashed through `portrait_package` and the package manifest.

## Independent 3D workflow

The 3D contract remains separate and unchanged: existing `.blend`, `.glb`, `.gltf`, or `.fbx` geometry is rendered locally by Blender without invoking the 2D image provider. Use `node bin/portrait-gen.ts doctor`, then `generate --input <model> --output <new.png> --width 512 --height 640 --framing upper`; validate with `check --receipt <new.png.json>`. `upper` means the geometry's upper half, not face detection. Existing 3D output validation and PASS behavior remain governed by `CONTRACTS.md`.

Character mesh authoring, rigging, and Unity PBR import remain independent; see `skills/character-tool/SKILL.md`. Do not stage unrelated worktree changes.
