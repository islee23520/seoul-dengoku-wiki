# LORE/culture — values scales, faith, martial paths, food, oral canon

Earned its file: score ~8 (defines the 10 value + 5 desire axes that `../name-pools/values-cast.json` / `values-orgs.json` store; the approved nine-category martial ledger; own no-real-denominations rule); distinct domain — the soft-canon layer over the polity map.

## OVERVIEW
The value/policy scale system behind cast and org numbers, the faith schism, the approved martial ledger, food/distribution culture, and the oral creation story.

## WHERE TO LOOK
| Task | Location |
|------|----------|
| 10 person value axes + 5 desire axes + org policy slots | `Values-and-Policy-Scales.json` — the numeric ledger lives in `../name-pools/values-cast.json` / `values-orgs.json` |
| Faith schism | `Faith-Culture-Schism.json` — 2026 religious makeup sourced (Pew 2010); five campaign axes that change rules |
| Approved martial ledger | `Martial-Paths.json` — nine categories, thirty-eight basic→ascended pairs, seventy-five distinct formal names; the only em dash is the empty ascended cell of 총검술; 개방 무공 is a separate branch, not a tenth category or a missing school. Naming ledger: `../editorial/Naming-Ledger.json`. No field-alias column. |
| Food / distribution | `Food-Culture.json` — station-window rations first; numbers continue into GDD `rules/Rules-EconomyLogistics` |
| Oral creation story | `Oral-Stories.json` — 대정전 canon; the five oral titles are locked by `../chronology/Scenario-Timeline.json` |

## CONVENTIONS
- Scales span −100..100 (− is U+2212, matching cast cards); 0 means not yet tipped on that axis. New persons/orgs never go up with axis cells empty.
- Leader change ⇒ charter numbers re-reviewed; fixed national personalities are banned (game rule in GDD `rules/Rules-FactionsWarfare`).
- Faith grows from events (blackout nights, opened sluices, deaths at the platform edge), never from a 총재 decree; occupying a gu does not change temperament.
- The three locked theocratic state names remain real institution successors. S08 is the technocratic office of the Central Technology Preservation Institute, not a fourth theocracy. Do not add living clergy, denomination logos, local 노회 names or extra religious states; wreckage rites and splinter names remain fiction.
- Design borrowings (Stellaris ethics pairs, EU4 policy slots) import mechanics only — never proper nouns, iconography, or event text.
- Food canon keeps the water-first-then-rice habit; the ration chain 영등포 정수 당직 → 신정 기지 밥솔 → 암사 호위 hands off to GDD `rules/Rules-EconomyLogistics`.

## ANTI-PATTERNS
- Recordkeeping and seal approval stay administrative work, not martial arts. Do not add a school to restore an eight-school or four-facility count. A new personal art needs its own approved basic→ascended pair inside the nine categories, with a 2026 origin, transmission, equipment, and failure condition. It is not created by lifting a cap in this file.
- `개방 무공` is its own approved branch, taught inside 안국총림 on a line separate from 소림. It is not a religion, not one of the nine categories, and not the missing ninth or tenth school of an older eight-school count. `환승계` is an independent mobile mutual-aid/information network and is not a school either.
- `Martial-Paths.json` is the authoring source for the current formal names, categories, and basic→ascended pairs; its Markdown is rendered at build time and never committed. Treat that JSON, plus `../editorial/Naming-Ledger.json` and approved owner direction, as the source authority. An editorial audit or later naming suggestion is not approval by itself. An approved change may revise a displayed formal name only when the owner records the decision and the authoring JSON, naming ledger, glossary, stable IDs/anchors, and generated projections stay in sync, without adding a field alias or changing unrequested abilities, lineage, equipment, or rank. Do not restore an eight-school count, a six-category heading, or a parallel alias. Three broad practice purposes (combat, breath/body control, footwork) are a different axis from the nine categories; do not collapse either count into the other. Personal training is not formation, labor, facility work, or recordkeeping. Follow [Korean terminology and naming](/design/Korean-Terminology-and-Naming) for Sino-Korean names and loanwords.
- Before editing this domain, read the repository-wide [worldbuilding guide](../../WORLD_BUILDING_GUIDE.md). Its explicit current boundary keeps 총림의 개방 전수와 타구봉법 separate from 소림 전수, treats 환승계 as an independent network, and records 신종목 as a 총검술 user without inferring teacher, military history, equipment, or grade.
- Don't fill the 422 cast ages from these tables — the no-age canon lives in `../characters/`.
- `Oral-Stories.json` collects existing testimony and seats only — no new plotlines there; founder-ledger names are never the same body as opening-day persons.
- No sexual narratives involving minors (restated here from the cast contract).
- No resurrecting 2026 brand names at the ration windows (상호 부활 금지); habits survive, trade names don't.
