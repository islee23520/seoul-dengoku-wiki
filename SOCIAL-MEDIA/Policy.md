# Social media policy

Operator-only. Not website-published.

## Surfaces
| Surface | Language | Account | Role |
|---|---|---|---|
| X | English | `@iz_23520` | Public serial, standalone posts |
| Threads | Korean | same owner login | Same serial, Korean voice |
| `seoul-dengoku.linalab.io` | — | — | **Out of scope.** This folder never ships there. |

## Threading
- Owner directive 2026-09-20: **new standalone posts**, not replies. Do not continue as X replies unless the owner says so.
- Historical root: https://x.com/iz_23520/status/2100895108329849342
- Historical source-color reply: https://x.com/iz_23520/status/2101544396802195491

## Cadence for this serial
1. Quality evidence (male patch-color atlas from danny-mac).
2. One full opening-territory map.
3. Sixteen states, one post each, S01→S16 canon ids from `LORE/name-pools/values-cast.json` / territory map (급수계약정 is S01).
4. Eighteen locked `주요` casts, one post each, same ledger order.

Do not bundle two states or two people in one post. Do not split the map.

## Quality bar for images
Show:
- `danny-mac: …/evidence/male-patch-color-atlas/{front,head,neck,back}.png` — cheek patches and neck bands visibly gone, original face detail kept.
- Opening territory map rendered from `WEB/wiki/public/opening-territories.json`.

Do not show until a later pass accepts them:
- Female head stills (`female-base` head scale is wrong; neck/face read as a failed proportion).
- `final-integration` and `toon-materials` pair shots (same female-head defect in frame).
- Oral close-ups, UV checkers, gum/crown repair grids (process, not serial).

Honest caption: draft, not finished. UV, mouth interior, female matching remain open.

## Hashtags
Only `#서울전국` and `#seoul-rail-states` (hyphen). Not `#seoul:rail-states` — X splits on the colon. Do not close with `Ulw ulw` / `#omo`.

## Review before post
Owner reviews `copy/` first. Do not auto-post. Do not further-edit already-live X posts unless asked. Wiki names may still be in flux; recopy from the wiki Sixteen-States table before a publish pass.

## Flags
Each Sixteen-State post attaches `assets/flags/Sxx.png` (map color + function emblem, no real-company logos). Cast posts do not need a flag unless the owner asks.

## Voice
See `Voice.md`. Match the root post: first person, short clauses, a little ramble, no marketing. English on X is the same person speaking English, not a press release.

## Canon sources (read, do not rewrite here)
- States: `LORE/factions/Sixteen-States.md`
- People: `LORE/characters/Core-Characters.md`
- Locked 주요 list: `LORE/name-pools/values-cast.json` (`stage: 주요`, `locked: true`)
- Map geometry: `WEB/wiki/public/opening-territories.json` (S01=급수계약정 — this id space, not the wiki `stateCatalog.ts` slug table)

## Banned on the public feed
Kenshi, Underrail, Gunner, clone, 복제. Real current executives as fictional criminals. “Shipped” combat or Genshin/Guilty Gear toon quality.

## Website exclusion
`hub-pages.json` has no `SOCIAL-MEDIA` page. VitePress mounts only Concept/Design/ToDo/Intent plus GDD/LORE. Keep it that way. `SERVICES.md` must not grow a `/social-media/` row.
