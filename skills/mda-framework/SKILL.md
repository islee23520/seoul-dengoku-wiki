---
name: mda-framework
description: Fill seoul-kenshi game-design templates with Hunicke/LeBlanc/Zubek MDA. Use when writing or reviewing mechanics, dynamics, or aesthetics fields. Do not invent lore.
---

# MDA framework

Source: Robin Hunicke, Marc LeBlanc, Robert Zubek, *MDA: A Formal Approach to Game Design and Game Research* (`https://users.cs.northwestern.edu/~hunicke/MDA.pdf`). Companion talk skill: `one-page-designs` (YouTube `E9_wLks1kAg`).

## Layers

- **Mechanics** — data and algorithms at the level of the game system (rules, verbs, numbers).
- **Dynamics** — run-time behavior of those mechanics on player input and on each other over time.
- **Aesthetics** — desirable emotional responses in the player.

Designer walks Mechanics → Dynamics → Aesthetics. Player walks the other way. Do not describe a layer with words that belong to another.

## Aesthetics vocabulary

Do not write “fun” or “gameplay”. Use only:

Sensation, Fantasy, Narrative, Challenge, Fellowship, Discovery, Expression, Submission.

Unknown kinds are invalid. Store them in `aesthetics[].kind` exactly.

## Fill rule

Write into `tools/design-store` documents:

- `mechanics[].body` + `sourcePath`
- `dynamics[].body` + `sourcePath`
- `aesthetics[].kind` + `body` + `sourcePath`

Every `body` must be a substring of an existing canon file (`Concept.md`, `Design.md`, `Intent.md`, or `docs/game-logic/*.md`). If the canon has no sentence, leave the field empty and fail the document. Do not paraphrase new lore.

Then `node tools/design-store/mda-store.mjs put --db <db> --json <instance.json>`.
