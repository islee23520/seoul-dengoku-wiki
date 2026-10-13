# LORE/culture — values scales, faith, martial paths, food, oral canon

Earned its file: score ~8 (defines the 10 value + 5 desire axes that `../name-pools/values-cast.json` / `values-orgs.json` store; the approved nine-category martial ledger; own no-real-denominations rule); distinct domain — the soft-canon layer over the polity map.

## OVERVIEW
`Martial-Paths.json` and its public KO/EN article were deleted by the owner on 2026-10-13. Older martial-ledger references below are historical directory context, not current authoring authority. Do not recreate the article. Current character abilities and actual training follow WORLD_BUILDING_GUIDE.md and the editorial Character-System-Contract.
The value/policy scale system behind cast and org numbers, the faith schism, the approved martial ledger, food/distribution culture, and the oral creation story.

## WHERE TO LOOK
| Task | Location |
|------|----------|
| 10 person value axes + 5 desire axes + org policy slots | `Values-and-Policy-Scales.json` — the numeric ledger lives in `../name-pools/values-cast.json` / `values-orgs.json` |
| Faith schism | `Faith-Culture-Schism.json` — 2026 religious makeup sourced (Pew 2010); five campaign axes that change rules |
| Food / distribution | `Food-Culture.json` — station-window rations first; numbers continue into GDD `rules/Rules-EconomyLogistics` |
| Oral creation story | `Oral-Stories.json` — 대정전 canon; the five oral titles are locked by `../chronology/Scenario-Timeline.json` |

## CONVENTIONS
- Scales span −100..100 (− is U+2212, matching cast cards); 0 means not yet tipped on that axis. New persons/orgs never go up with axis cells empty.
- Leader change ⇒ charter numbers re-reviewed; fixed national personalities are banned (game rule in GDD `rules/Rules-FactionsWarfare`).
- Faith grows from events (blackout nights, opened sluices, deaths at the platform edge), never from a 총재 decree; occupying a gu does not change temperament.
- The three locked theocratic state names remain real institution successors. S08 is the neutral Central Intelligence Bureau at Namsan, not a fourth theocracy. Do not add living clergy, denomination logos, local 노회 names or extra religious states; wreckage rites and splinter names remain fiction.
- Design borrowings (Stellaris ethics pairs, EU4 policy slots) import mechanics only — never proper nouns, iconography, or event text.
- Food canon keeps the water-first-then-rice habit; the ration chain 영등포 정수 당직 → 신정 기지 밥솔 → 암사 호위 hands off to GDD `rules/Rules-EconomyLogistics`.

## ANTI-PATTERNS
- Recordkeeping and seal approval stay administrative work, not martial arts. Do not add a school to restore an eight-school or four-facility count. A new personal art needs its own approved basic→ascended pair inside the nine categories, with a 2026 origin, transmission, equipment, failure condition, and Patina review. Patina review is a workflow prerequisite, not owner or semantic acceptance by itself. The art is not created by lifting a cap in this file.
- `개방 무공` is its own approved branch, taught inside 안국총림 on a line separate from 소림. It is not a religion, not one of the nine categories, and not the missing ninth or tenth school of an older eight-school count. `환승계` is an independent mobile mutual-aid/information network and is not a school either.
- Before editing this domain, read the repository-wide [worldbuilding guide](../../WORLD_BUILDING_GUIDE.md). Its explicit current boundary keeps 총림의 개방 전수와 타구봉법 separate from 소림 전수, treats 환승계 as an independent network, and records 신종목 as a 총검술 user without inferring teacher, military history, equipment, or grade.
- Don't fill the 422 cast ages from these tables — the no-age canon lives in `../characters/`.
- `Oral-Stories.json` collects existing testimony and seats only — no new plotlines there; founder-ledger names are never the same body as opening-day persons.
- No sexual narratives involving minors (restated here from the cast contract).
- No resurrecting 2026 brand names at the ration windows (상호 부활 금지); habits survive, trade names don't.
