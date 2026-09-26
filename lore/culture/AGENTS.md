# LORE/culture — values scales, faith, martial paths, food, oral canon

Earned its file: score ~8 (defines the 10 value + 5 desire axes that `../name-pools/values-cast.json` / `values-orgs.json` store; nine martial schools; own no-real-denominations rule); distinct domain — the soft-canon layer over the polity map.

## OVERVIEW
The value/policy scale system behind cast and org numbers, the faith schism, the nine martial schools, food/distribution culture, and the oral creation story.

## WHERE TO LOOK
| Task | Location |
|------|----------|
| 10 person value axes + 5 desire axes + org policy slots | `Values-and-Policy-Scales.md` — the numeric ledger lives in `../name-pools/values-cast.json` / `values-orgs.json` |
| Faith schism | `Faith-Culture-Schism.md` — 2026 religious makeup sourced (Pew 2010); five campaign axes that change rules |
| Nine martial schools | `Martial-Paths.md` — formal Sino-Korean names + field aliases; six technique categories; unit-command expression only |
| Food / distribution | `Food-Culture.md` — station-window rations first; numbers continue into GDD `rules/Rules-EconomyLogistics` |
| Oral creation story | `Oral-Stories.md` — 대정전 canon; the five oral titles are locked by `../chronology/Scenario-Timeline.md` |

## CONVENTIONS
- Scales span −100..100 (− is U+2212, matching cast cards); 0 means not yet tipped on that axis. New persons/orgs never go up with axis cells empty.
- Leader change ⇒ charter numbers re-reviewed; fixed national personalities are banned (game rule in GDD `rules/Rules-FactionsWarfare`).
- Faith grows from events (blackout nights, opened sluices, deaths at the platform edge), never from a 총재 decree; occupying a gu does not change temperament.
- The three locked theocratic state names remain real institution successors. S08 is the technocratic office of the Central Technology Preservation Institute, not a fourth theocracy. Do not add living clergy, denomination logos, local 노회 names or extra religious states; wreckage rites and splinter names remain fiction.
- Design borrowings (Stellaris ethics pairs, EU4 policy slots) import mechanics only — never proper nouns, iconography, or event text.
- Food canon keeps the water-first-then-rice habit; the ration chain 영등포 정수 당직 → 신정 기지 밥솔 → 암사 호위 hands off to GDD `rules/Rules-EconomyLogistics`.

## ANTI-PATTERNS
- The original five schools remain canon, but the owner lifted the numerical cap. New schools require a distinct 2026 origin, a fictional 2126 successor name, transmission practice, equipment dependency, failure condition and Patina review.
- `개방 무공` is a martial branch and `환승계` is an independent mobile mutual-aid/information network. Neither is owned by a religion or counted as one of the nine schools.
- `Martial-Paths.json` is the authoring source for the current martial-school names and fields; `Martial-Paths.md` is its synchronized Markdown counterpart. Treat that pair, plus the naming ledger and approved owner direction, as the source authority. An editorial audit or later naming suggestion is not approval by itself. An approved editorial change may revise a displayed formal name or field alias when the owner records the decision and the authoring JSON, Markdown, naming ledger, glossary, stable IDs/anchors, and generated projections are synchronized without changing unrequested abilities, lineage, equipment, or rank. Follow [Korean terminology and naming](/design/Korean-Terminology-and-Naming) for Sino-Korean names and loanwords.
- Before editing this domain, read the repository-wide [worldbuilding guide](../../WORLD_BUILDING_GUIDE.md). Its explicit current boundary keeps 총림의 개방 전수와 타구봉법 separate from 소림 전수, treats 환승계 as an independent network, and records 신종목 as a 총검술 user without inferring teacher, military history, equipment, or grade.
- Don't fill the 422 cast ages from these tables — the no-age canon lives in `../characters/`.
- `Oral-Stories.md` collects existing testimony and seats only — no new plotlines there; founder-ledger names are never the same body as opening-day persons.
- No sexual narratives involving minors (restated here from the cast contract).
- No resurrecting 2026 brand names at the ration windows (상호 부활 금지); habits survive, trade names don't.
