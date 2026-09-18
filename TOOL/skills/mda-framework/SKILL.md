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

Write into `Tool/tools/design-store` documents:

- `mechanics[].body` + `sourcePath`
- `dynamics[].body` + `sourcePath`
- `aesthetics[].kind` + `body` + `sourcePath`

Every `body` must be a substring of an existing canon file (`Concept.md`, `Design.md`, `Intent.md`, or `Wikis/game-logic/*.md`). Fill a slot with what that layer **is**:

- Mechanics: verbs, numbers, camera as owned (Intent 결정 5: 2.5D / 용사주식회사), map graph.
- Dynamics: runtime loops (Songs of Silence realtime formation + cards).
- Aesthetics: felt response from Design.md (wet concrete, dead signage).

Never fill a slot with “not X”, “없습니다”, “아닌”, missing lists, or isometric-as-required. If canon has no positive sentence, omit the slot.

MDA layers are vocabulary, not sprint tickets. Each filled slot must name a GitHub requirements issue when the slot is still open work (`Wikis/game-logic/Design-Requirements.md`). Do not treat a mechanics paragraph as a Unity module.

Then `node Tool/tools/design-store/mda-store.mjs put --db <db> --json <instance.json>`.
