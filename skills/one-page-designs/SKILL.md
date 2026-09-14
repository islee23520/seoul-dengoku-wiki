---
name: one-page-designs
description: Fill seoul-kenshi one-page design panels using Stone Librande’s GDC talk. Use when creating a one-page sheet. Do not invent lore.
---

# One-page designs

Source: Stone Librande, *One Page Design Philosophy* / GDC One-Page Designs, YouTube `https://www.youtube.com/watch?v=E9_wLks1kAg` (also GDC Vault “One-Page Designs”). MDA layers come from Hunicke, LeBlanc, Zubek, *MDA: A Formal Approach to Game Design and Game Research* (`https://users.cs.northwestern.edu/~hunicke/MDA.pdf`). Companion skill: `mda-framework`.

Librande (then EA Maxis creative director) compared hundreds of design documents. The sheet that actually gets used is one page. Executives, programmers, artists, and marketing do not read past the first page. A picture on that page beats a prose packet.

## Rules

- One page. If it needs a second page, it is two documents, not a longer one.
- Pictures and labeled panels over paragraphs.
- Audience is explicit (`onePage.audience`: designers, engineers, art, production).
- Each panel has a heading, a short body, and `sourcePath`.

## Fill rule

Write `onePage.title`, `audience`, `pictureNote`, and `panels[]`. Every panel `body` must already appear in canon (`Concept.md`, `Design.md`, `Intent.md`, or `docs/game-logic/*.md`). Do not invent stations, factions, or verbs. Pair with MDA layers from `mda-framework`. Persist with `tools/design-store/mda-store.mjs`.
