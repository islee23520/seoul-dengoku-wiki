---
name: seoul-cast
description: Register and select stable local cast IDs, then bind each identity and sourced appearance slot to the unified portrait tool.
---

# Seoul cast drafts

Run `node tools/cast-cli/bin/seoul-cast.js` from the project root. The local store is `~/.seoul-cast/characters.json`; records use stable IDs, names, and authored gender. No global installation is required.

## Draft operations

- `list` prints local drafts; `list --json` returns JSON.
- `get <ID>` selects exactly one stable ID; missing and duplicate matches fail.
- `register <draft.json>` registers a local draft and rejects duplicate IDs.
- `generate [given-name]` and `roll <count>` remain local draft utilities.

Registration does not write WIKI or make a canon change. Do not use names alone to identify people.

## Hand off to portrait generation

Read the current image CLI with `node tools/portrait/bin/seoul-character.mjs help`. Its implemented operations are `list`, `register`, `export`, `portrait`, `full-body`, `3d-generate`, and `3d-render` (plus the legacy `3d` alias). MCP clients discover their actual tool names with `tools/list`.

For image work, use only `node tools/portrait/bin/seoul-character.mjs`. Select the same permanent ID, then author a look JSON bound to its ID, exact name, and authored gender. Keep face mode explicit: UNIQUE for a protected individual face, or TEMPLATE with an eligible verified face catalog entry. Connect each face, hair, skin, eyes, body, outfit, and accessories value to its sourced JSON slot; preserve unknowns as null and retain status, source, and units.

Follow `../seoul-character-images/SKILL.md` for identity binding, sourced appearance slots, independently selected style/identity references, and the current executable routes. Historical skill prose mentioned package and review-overlay commands that are absent from the preserved implementation; do not report those commands as available.

Generation and modification receipts remain candidates, not owner verdicts or canon approval. Never infer appearance from attributes, occupation, skills, name, or a donor outfit; donor clothing cannot replace recipient identity or other slots. Credentials do not belong in draft JSON, tokens, receipts, or public services.
