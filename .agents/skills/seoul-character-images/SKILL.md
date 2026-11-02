---
name: seoul-character-images
description: Use one cast-linked command to export or generate independent 2D portraits, 2D full bodies, and local Blender renders of existing 3D characters.
---

# Seoul character images

Run from the project root. The single entry is `node tools/portrait/bin/seoul-character.mjs`. Read `../seoul-cast/SKILL.md` for local draft registration. Both commands share `~/.seoul-cast/characters.json` and select an exact stable ID, never a name match.

## Registered wiki portrait references

The Git-pinned reference metadata is `tools/portrait/references/wiki-people/`. Its `manifest.json` binds permanent person/character IDs, published tokens, review metadata, image SHA-256, dimensions, and source URLs from `https://seoul-dengoku.linalab.io/wiki/people`. Source PNGs, tokens, and reviews resolve from `https://github.com/islee23520/seoul-dengoku-wiki.git` at the manifest revision into an external cache; no local source copies are tracked. Select by ID, never by name alone.

Use `node tools/portrait/bin/wiki-portrait-reference.mjs <personId>` to validate source bytes and project the retained token's identity and sourced slots into the actual generator schema. Images are immutable authoring references; the current generator rejects identity/continuity images as direct generation inputs. The accompanying `styles/<personId>.json` designates the PNG as technique-only. Never copy the reference person's identity or outfit into another character. `art-proposal` and historical image-review states remain unchanged.

The current executable CLI exposes `portrait` and `full-body`, not `preview_portrait` or `generate_portrait`. The main repository's newer skill text mentioned those operations, but the preserved implementation does not implement them. Query actual help and use only implemented commands; do not claim the absent package/review-overlay workflow works.

## Register, select, and author a look

`list` exports local drafts as JSON. `register --record draft.json` explicitly registers a supplied record with id, name and authored gender; duplicate IDs fail. `export --cast-id cast-example` exports a neutral look with unknown visual properties. Add `--look look.json` to bind authored slots to the selected ID/name/gender. Identity mismatches fail. Registration remains local draft storage; no command writes WIKI or promotes canon.

Author face, hair, body, outfit and accessories independently. Preserve value/status/source; unknowns remain null. Weight and height require numeric values with units; bustSize may be a sourced visual description. Ethnicity and origin are sourced identity fields, not image-derived conclusions. Never derive appearance from attributes, skills, occupation or CP totals. `--slot-overrides overrides.json` edits specified slot fields: a donor outfit cannot replace recipient face, hair or body.

## Choose an independent output technology

`portrait --cast-id cast-example --look look.json --style male-style.json --reference male-style.png` exports a 2D portrait prompt. `full-body` uses the same arguments and look with full-body framing. Add `--output new.png` only for requested image execution, and `--identity-reference original.png` for an original identity image. Style is drawing technique only; authored slots and upright viewer-right eye-level portrait framing win over conflicting reference appearance or direction. The style config requires actual referenceSha256.

`3d-generate --cast-id cast-example --look look.json --image authored-fullbody.png --output-dir new-model` exports an actionable image-to-mesh contract for the installed `/opt/homebrew/bin/tripo` backend. It binds the same cast identity and the input image SHA-256. Only `--execute` invokes `tripo generate image-to-model`; this can consume provider credits. Optional `--model` and `--no-wait` are forwarded. Submitted tasks are not completed models. Successful CLI responses retain the backend JSON and write `new-model/cast.json`; backend errors retain stderr and exit code.

`3d-render --cast-id cast-example --input character.glb` exports the existing Blender render route. The legacy `3d` command remains a render alias. Add `--output new.png` to render an existing blend/glb/gltf/fbx model locally. Rendering is not mesh generation. Neither 3D route loads the 2D generator or transfers neutral face/body slots into model geometry.

Rigging remains the existing independent command `node tools/portrait/tools/character-tool/cli.mjs rig --input model.blend --output rigged.blend --skeleton bones.json --engine automatic`. The same tool supports explicit align, weld, rig-template, shape-key, rig-edit, skin-edit and export operations. Supply real models and explicit specifications; do not infer anatomy or mutate assets from portrait slots.

Both routes retain the same cast ID/name/gender binding. Executed outputs write `new.png.cast.json` with the image hash and candidate review status. Receipts do not imply an owner verdict or canon approval. Keep 2D and 3D outputs in separate ignored `.omo/evidence/<task>/2d` and `3d` directories. Keep photographs and credentials private.

Underlying 2D GUI/MCP use `tools/portrait/2d`; they are not public WIKI generation services. No global installation is required.
