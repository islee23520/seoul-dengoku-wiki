# v3 Bible Chapter 9. CK3 Systems Reference: the Campaign Layer and the Battle Layer

Status: draft. Plan `.omo/plans/wiki-lore-rebuild-v3.md` task 29. This is the English mirror of `09-ck3-systems.md`; section numbers, figures, names and negations are the same.

Owner instruction (2026-11-13, verbatim): "PS E:\git\game-systems-research\ck3> 의 조사 결과를 기본으로 잡아서 ck3 가 무엇인지 알아야 ck3 와 total war 를 결합한 게임 디자인을 하는거지 kuna 통해서 rea 한 결과물을 분석해".

How to read:

- This is a **design reference chapter**. It is not carried into public wiki prose. CK3 system names appear only as references, in English, in parentheses (for example, casus belli). CK3 words are not in-world words; world prose uses only the v3 words of the section 4 tables.
- **[Approved]** marks text carried over unchanged from the `docs/CANON-BIBLE.md` skeleton or an owner decision.
- **(provisional T29-n)** marks something set in this chapter. Every one is listed under the same number in `docs/drafts/reports/v3-ledger-parts/t29.md`. It is not approved until the owner answers.
- **(provisional T02-n)**, **(provisional T05-n)**, **(provisional T06-n)**, **(provisional T07-n)** and **(provisional T08-n)** are provisional items of chapters 01, 04, 05, 06 and 07. This chapter uses those decisions without changing them. Where a change looks needed, it is written only in section 7, "Changes handed to other chapters".
- The research record is `docs/research/v3-ck3-corpus-analysis.md` ("the analysis"). Every CK3 statement in this chapter rests on the analysis and the sources it points to. Values re-opened and checked in this task are marked separately (section 1.3).

## 0. Evidence grades and path abbreviations

### 0.1 Evidence grades

| Grade | Meaning | Relation to the analysis grades |
|---|---|---|
| **A** | A static declaration the research corpus recorded against the installed file's bytes and line range with SHA-256. Certain only as far as "the script says this" | Analysis grade A |
| **B** | A static declaration confirmed by reading installed data files (`DEF`, `00_maa_types.txt` and so on) directly. Same layer as A, but not in the corpus byte-verification ledger | Analysis grade B. Values re-read in this task are written "B, re-checked" |
| **C** | Corpus prose, explanations in installed schema documents (`*.info`) or comments, the analysis's interpretation, and CK3's published general rules (general knowledge). Not an observation of engine behaviour | Analysis grades C, D, W |
| **unconfirmed** | Confirmed by no evidence. Engine (native) formulas, real probabilities and execution order were never observed anywhere in the corpus | Analysis "미확정" |

The most important boundary: **the whole corpus contains not one observation of the game running, of a save, or of a native function's behaviour.** Every figure is an input value declared in a data file. How the engine combines those values (final income, final success chance, battle damage formula) is all unconfirmed (analysis sections 0 and 5.3).

### 0.2 Path abbreviations

| Abbreviation | Real path |
|---|---|
| `C/` | `E:/git/game-systems-research/ck3/` (read-only; that repository's `AGENTS.md` applies) |
| `FA/` | `C/full-aspect/` |
| `RUN/` | `FA/full-aspect-52c4678588c1/` |
| `DOM/nn` | A domain document inside `RUN/domains/`. The file name is a capital S followed by the two-digit number nn, extension `.md` (for example, `DOM/08` is the war domain document) |
| `PR/nn-name` | A practical sample inside `FA/practical-20261029/`. The file name is a capital S, the two-digit number nn, a hyphen, the name, and `.html` (for example, `PR/08-지휘관-전투`) |
| `VC/` | `C/value-census-work-20261029T105140Z/` |
| `GAME/` | `F:/SteamLibrary/steamapps/common/Crusader Kings III/game/` (installed CK3 1.20.1.2, read-only) |
| `DEF` | `GAME/common/defines/00_defines.txt` |
| `MAA` | `GAME/common/men_at_arms_types/00_maa_types.txt` |

Domain numbers are written this way because the banned-term check (`state-id-polity`) reads a capital S with two digits as an old polity number.

## 1. Scope and basis of this chapter

Basis: Bible 1, row 10 (all 1,022 people use six CK3-style stats), 2.5 [Approved] (D3), 8, 9.4 (D3 verbatim). 01-core 4, 7, 8, 11. Chapters 04 to 07. `docs/design/roster-framework.md` 6, 8, 10. The whole analysis.

### 1.1 What this chapter sets

1. **What CK3 is** (section 2). The core loop and each subsystem's rules and figures, with source path and grade.
2. **The combined design contract** (section 3). What the CK3-style campaign layer and the Total War-style battle layer hand each other. D3 [Approved]: "전투 방식은 토탈워랑 동일하게 지휘관이 모든 분대의 지휘권한을 갖음" (the battle system is the same as Total War: the commander has command authority over every squad).
3. **CK3 -> v3 mapping** (sections 4 and 5). For each faction, what is taken, adapted or dropped from CK3, in the names chapters 01 to 07 already gave.
4. **Gaps and research still needed** (section 6).
5. **Changes handed to other chapters** (section 7). This chapter does not edit chapters 01 to 07 or `roster-framework.md`.

### 1.2 What this chapter does not do

- It does not fix a battle formula. CK3's battle formula was not recovered from the corpus (unconfirmed, section 2.10), and the v3 battle formula belongs, as the roster framework says (end of `roster-framework.md` section 1), to the GDD personal-resolution battle and a later battle design task.
- It does not write unit figures. Unit figures live in one place only, `data/sql/130` to `132` (Bible 2.5 [Approved]).
- It coins few new world words. The one new world word is **hyeongse (the standing of the war)** (section 3.6, provisional T29-13). The other design names (the handoff packet, the return packet and so on) are words inside a design document, not world words.

### 1.3 Sources re-checked in this task

Of the analysis's values, those this chapter uses as the base of the contract were checked again in the installed files during this task.

| What was checked | Source | Result |
|---|---|---|
| Battle phases, damage scale, casualty conversion, counter attenuation, 14-day retreat, knight prowess factors, commander roll 0 to 10, combat width | `DEF` lines 582-615 | Same as the analysis |
| Battle war-score scale 50 and maximum 50 per battle, knight events every 5 days | `DEF` lines 584-590 | Same as the analysis |
| Movement, reinforcement (levies 3% a month, men-at-arms 10% a month), gold 0.003 per soldier, 100-man regiments, men-at-arms cap by tier, supply | `DEF` lines 632-660 | Same as the analysis |
| War score defaults | `DEF` lines 726-748 | Same as the analysis. In addition: battle contribution multiplier 0.2, siege contribution multiplier 10, monthly occupation contribution 2 |
| Siege action weights 30/15/15/20/20, defender morale 100 + 75 per fort level, 20-day siege phase, 1% monthly siege attrition | `DEF` lines 970-1000 | Same as the analysis. In addition, a **breach assault** is declared, with casualty ratios 2.5/1 and progress 0.2 per 100-man chunk |
| Men-at-arms type figures (light_footmen, pikemen_unit, armored_horsemen, house_guard) | `MAA` | Same as the analysis. Each type carries terrain modifiers to damage and toughness (for example, armored_horsemen +30 damage on plains, −75 in mountains) |
| Terrain and supply advantage modifiers | `GAME/common/combat_effects/00_combat_effects.txt` lines 1-146 | Same as the analysis (river +10, large river +20, strait +30, supply running low −10, starving −25, just disembarked −30, gathering −5, debt −5 to −100) |
| Commander injury event weight | `GAME/common/combat_phase_events/00_commander_phase_events.txt` lines 1-86, `_combat_phase_events.info` lines 1-14 | **A weight, not a probability.** During a battle, one event is picked by weight among the valid events every `COMBAT_EVENT_DAYS` = 5 days. The wound event has base weight 25, nothing happening (`commander_none`) base weight 1000, and the maim and death events compete too. With no other modifiers that is about 25 ÷ 1025 ≈ 2.4% every 5 days (C, computed from the `.info` description). **Prowess lowers the weight**: × (40 − prowess) ÷ 40, minimum 0.1. The stronger side is lowered (when `side_strength` exceeds the enemy's, × enemy strength ÷ own strength × 1.4, maximum 1; independent of the outcome). brave ×2, craven ×0.5. The analysis did not record the prowess and strength factors |
| Battle-death record effect | `GAME/common/scripted_effects/00_death_management_effects.txt` line 124, `save_died_in_battle_variables_effect` | Present |
| Lifestyles | `GAME/common/lifestyles/00_lifestyles.txt` lines 1-60 | **Six**: diplomacy, martial, stewardship, intrigue, learning, wanderer. 1000 experience per level, base gain 25 for five of them and 20 for wanderer (line 64). The analysis's "five" appears to leave wanderer out |
| Council positions | `GAME/common/council_positions/00_council_positions.txt`, `01_ministry_positions.txt` | chancellor (diplomacy), steward, marshal, spymaster, the faith position (the court chaplain seat), spouse, vizier. The administrative government's minister seats minister_personnel (diplomacy), minister_justice (learning), minister_works (stewardship), minister_grand_marshal (martial) |
| Government type files | `GAME/common/governments/00_government_types.txt` and 2 more files | feudal, republic, clan, tribal, wanua, mercenary, holy_order, monastic_holy_order, administrative, landless_adventurer, nomad, herder, celestial, mandala, steppe_admin, meritocratic, japan_feudal, theocracy, ecclesiastical. The analysis's path `00_government_types.txt` is under `governments/` |
| Conquest casus belli score scale 150, war-goal ratio 0.8 | `DOM/08` line 28 | Same as the analysis |
| Independence faction demand threshold 80 (+20) | `FA/독립-파벌-요구.html` | Same as the analysis |

## 2. What CK3 is

Basis: analysis sections 1 and 2; the re-checks of section 1.3.

### 2.1 One sentence and the core loop

CK3 (Crusader Kings III) is a strategy game in which **you play a person, not a country**. Land, armies and money all belong to characters, and relations between characters (marriage, opinion, leverage, grudges) drive the politics. When the character dies, the player passes to the heir and carries on the same house. **Death is not failure but the passing of a turn** (C, analysis 2.1).

| Step | Loop | Rules and figures | Grade and source |
|---|---|---|---|
| 1 | Time passes | A daily clock. Day length by speed `{ 2 1 0.5 0.2 0.0 }` seconds, end date 1453.1.1 | A, `DOM/01` section 4, `DEF` lines 1-14 |
| 2 | Periodic hooks call events | The same day each year per character (`yearly_playable_pulse`, date derived from the character ID), quarterly, three-year and five-year pulses, a random yearly pulse, an everyone pulse (health, stress, prison). Events are weighted random with "no event" weights mixed in. Only AI characters get extra no-event chance by tier: kingdom tier and above 30, duchy 70, county 95 | A and C, `DOM/01` sections 1 and 6, `GAME/common/on_action/yearly_on_actions.txt` lines 981-1020, 3031-3073, 3190-3206 |
| 3 | The character chooses | Event options, character interactions, decisions, lifestyle focus, law changes | C, analysis 2.1 |
| 4 | State changes | Opinion, traits, hooks, titles, gold, prestige, piety, wars | C, analysis 2.1 |
| 5 | The character dies | `on_death` is called by the engine just before death. Title succession and artifact succession hooks are separate. The player passes to the primary heir | Hooks A (`GAME/common/on_action/death.txt` lines 1-11, `title_on_actions.txt` lines 3324-3348, `inventory_on_actions.txt` lines 31-42). The switch itself and the order of death, title and artifact transfer are unconfirmed (`RUN/ck3-인물-생애-연결조사.md`, "the boundary between funeral and inheritance after death"). The switch is C (general knowledge) |
| 6 | The house accumulates | House renown buys legacies, and legacies stay with the whole house | B, section 2.3 |

The long-term goals are to raise a good heir (education), make good marriages (genetics, alliances), and change succession law so the land does not split (C, analysis 2.1).

### 2.2 Characters

| System | Rules and figures | Grade and source |
|---|---|---|
| Six skills | Diplomacy, Martial, Stewardship, Intrigue, Learning, Prowess. Maximum 100 each. Random characters 0 to 10 each. Level boundaries 4/8/12/16 | B, `DEF` lines 80-109, 210 onward |
| Traits | Definitions in `GAME/common/traits/00_traits.txt` (18,176 lines). Random characters get 3 personality traits. Inheritance is `genetic = yes` or a manual inheritance value (for example `pure_blooded` 15 with one parent, 75 with both). Same trait opinion +5, opposite trait −5 | Definitions A (`FA/인물-생애.html`, `00_traits.txt` lines 7960-7997), constants B (`DEF`). Real inheritance chance unconfirmed |
| Age | Toddler 3, child 6, adolescent 12, adult 16, old age 50. Education focus assigned at 6, education result at 16 | Ages B (`DEF` lines 180-186), events A (`childhood_on_actions.txt` lines 156-161, 184-207) |
| Education | Five focuses; growth chance child 3, adolescent 15, parent skill inheritance multiplier 1.3, yearly progress 1.0 | Files A (`RUN/ck3-인물-생애-연결조사.md`), constants B (`DEF` lines 1021-1031). The roll is unconfirmed |
| Health and death | Base health 5.0. From 25, a yearly chance of losing health 0.075 (+0.022 a year), −0.125 each time. Below 3.0 health, a monthly death check. From 45, chance of prowess loss 0.1 (+0.015 a year, maximum 0.75). Disease pulse every 5 years, recovery event 51 to 365 days later | Constants B (`DEF` lines 112-150, 325-345), disease A (`GAME/common/script_values/10_health_values.txt` lines 22-26). The final death formula is unconfirmed |
| Fertility | Base fertility 0.5. Women 16 to 45. Child cap per couple by title tier `{ 1 1 2 3 5 5 8 }`, +2 for rulers. Pregnancy 280 days | B, `DEF` lines 149, 353-384. Birth hooks A (`child_birth_on_actions.txt` lines 1-18, 843-945) |
| Stress | Maximum 3 levels, 100 per level. Entering a level fires a coping event, and 3 days later a mental break event | A, `DEF` lines 117-118, `stress_on_actions.txt` lines 33-137. That stress rises from choices against personality is C (general knowledge). The per-option increase table is a **gap** |
| Dread and tyranny | Dread maximum 100, returning to its base value by 0.5 a month. Tyranny maximum 1000, −0.25 a month. Execution gives dread 30/15/10/5 by the victim's rank | Constants B (`DEF` lines 120-124), execution A (`FA/ck3-install-reverse-analysis-ko.html`) |
| Lifestyles and perks | Six lifestyles (section 1.3), 1000 experience per level, base gain 25 for five lifestyles and 20 for wanderer. The stewardship wealth focus has a monthly income multiplier of 0.1. **One perk opens a new interaction or scheme** (for example, the demand-payment interaction, the fabricate-hook scheme) | B, re-checked (`00_lifestyles.txt`), focus and perk A (`00_lifestyle_focuses.txt` lines 550-596, `00_perk_interactions.txt` lines 696-738) |
| Funerals | The death hook stores the deceased in a variable as the heir's funeral target for 5 years. The body is a variable | A, `religious_decision_events.txt` lines 2122-2151 |

### 2.3 Houses, succession, regency

| System | Rules and figures | Grade and source |
|---|---|---|
| Two-layer family (dynasty, house) | Cadet houses under a dynasty. House head and dynast are separate | A, `DOM/12` |
| Renown | Levels `{ 300 1000 2000 4000 7000 11000 16000 22000 29000 37000 }`. 0.02 a month per living member (cap 2), by held title tier `{ 0 0.125 0.25 0.5 1 2 4 }` a month | B, `DEF` lines 1099-1125 |
| Legacy | Next perk cost = 250 + perks already taken × 500. Blood legacy level 4 adds one good genetic trait at birth with a base 5% (+5%) chance | Cost B (`DEF` lines 1123-1124), blood A (`FA/혈통-전승-출생.html`, `child_birth_on_actions.txt` lines 1157-1319) |
| Partition | confederate partition, partition, high partition. All go by children, by age, and divide titles. High partition gives the eldest at least half. **Partition is CK3's basic pressure** | A, `DOM/06` section 4, `FA/승계-법.html`. The real division algorithm is unconfirmed |
| Law change cost | Prestige base 500, clan government adds 4 times, a partition-forcing contract ×1.25 | A, `00_law_values.txt` lines 411-464 |
| Elective succession (feudal_elective) | Base vote 1, empire tier +3, kingdom tier +2, duchy tier +1, a vassal stronger than the liege +1 (+1 more with greater military), co-ruler +1 | A, `00_feudal_elective.txt` lines 9-164, `VC/representative-reconcile.md`. Internal candidate scores unconfirmed |
| Regency | Temporary regent power steps 0/33/66/100 (dismiss at once / imprison / meddle in law / entrenchment and free contract changes). Entrenched regent 0/20/40/60/80/95 (80 and above cannot be dismissed, 95 and above may try to depose the ruler) | A, `DOM/06` section 3, `00_regencies.txt` lines 8-205 |

### 2.4 Relations

| System | Rules and figures | Grade and source |
|---|---|---|
| Opinion | −100 to +100. Parents and children +50, siblings and spouse +25. At cultural acceptance 0, same realm −30, other realm −15. Modifiers carry monthly decay and stacking data | Constants B (`DEF` line 450 onward), decay A (`FA/ck3-install-reverse-analysis-ko.html`) |
| Marriage | Marriage age 16, betrothal expiry 17. AI acceptance starts at 0 and adds per reason (weak hook +100, strong hook +200). An alliance forms when the sum of kin distances is 4 or less. The 5-year flag after a refusal is a penalty, not a ban | Constants B (`DEF` lines 187, 435-447), acceptance A (`FA/관계-혼인.html`). **The native point where a marriage actually takes effect is unconfirmed** (the acceptance letter's `marry` is display only, A, `marriage_interaction_events.txt` lines 1016-1033) |
| Divorce | Cost 100. Direct divorce, house-head approval and faith-authority approval are separate paths | A, `00_basic_values.txt` line 2079, `00_marriage_interactions.txt` lines 3763-5450, `PR/03-종교-이혼` |
| Friends, rivals, lovers | Scripted relations. Adding one adds its counterpart and removes the opposite relation on both sides. There is no universal automatic promotion rule | A and C, `_scripted_relations.info` lines 3-26, `FA/관계-혼인.html` |
| Hooks | A weak hook is spent when used; a strong hook goes on cooldown when used. Expiry is separate from strength. Used for forcing a marriage, recruiting plotters, changing contracts, blackmail | A and C, `GAME/common/hook_types/_hooks.info` lines 1-11, `RUN/ck3-관계-혼인-상호작용.md` |
| Secrets | Found by intelligence tasks. Revealing to one character and public exposure differ. Refusing blackmail does not expose automatically; an expose-or-drop choice follows | A, `blackmail_events.txt` lines 11-53 |

### 2.5 Titles, realm, contracts, laws, factions, council

| System | Rules and figures | Grade and source |
|---|---|---|
| Title tiers | Seven slots: landless, barony, county, duchy, kingdom, empire, hegemony. Creation gold cost duchy 250, kingdom 500, empire 1000, hegemony 2000, prestige 300 to 600; usurpation the same | B, `DEF` lines 936-968 |
| De jure | Actual rule and lawful belonging differ, and lawful belonging drifts slowly (+1 a month, decay 0.5, limit 1200). De jure claims ground casus belli | B, `DEF` lines 950-956 |
| Governments | The nineteen types of section 1.3. Each government has its own main holding type, contract group and flags | A, `DOM/05` "Government variants". File list B, re-checked |
| Vassal contract | Five tax/levy steps: exempt 0/0 (opinion +10), low 0.025/0.1 (+5), normal 0.1/0.25, high 0.15/0.35 (−15), extortionate 0.25/0.5 (−25). A liege-side interaction, impossible in war, adds tyranny, and needs a hook if unfavourable to the vassal | A, `FA/통치-계약.html`, `subject_contracts/contracts/feudal.txt` lines 1-189, `00_modifiy_vassal_contract.txt` lines 1-305. Final payment unconfirmed |
| Clan tax collectors | Base 12 slots, aptitude steps 20/45/75/110 | A, `DOM/07` section 3 |
| Domain limit | Each holding over the limit −20% levies and tax. 365-day grace for new holdings. At control 0, levies 50%, tax 0%. At development 100, +50% | B, `DEF` lines 1153-1170 |
| Legitimacy | 1 to 6 levels by tier (some 8, 9). Each level adjusts faction and scheme joining | A, `DOM/06` sections 3-4 |
| Factions | Independence demand threshold power 80 (+20). The demand reaches the target as an event 5 days later. Accepting gives independence and a mutual truce of 1,825 days; refusing starts a war. Discontent threshold 100, 12-month pause after a result | A, B, re-checked: `FA/독립-파벌-요구.html`, `DOM/06` section 5, `DEF` line 1171 onward |
| Council and council tasks | Positions: chancellor, steward, marshal, spymaster, the faith position, spouse, and for administrative government the vizier and four minister seats (section 1.3). 4,133 task definitions (10 files). One sample traced: the spymaster's secret search | A, `DOM/05`, `00_spymaster_tasks.txt` lines 350-603. Position list B, re-checked |
| Court positions | Example: court physician, at most 1 seat, uses learning, opinion −15 on replacement, salary 0.1 × era multiplier 1.25/1.5/1.75 | A, `PR/05-궁정-의사` |
| Crown authority | Known only to exist as a feudal government flag. Per-level effects are a **gap** | A (name), `FA/통치-계약.html` |

### 2.6 Economy

| System | Rules and figures | Grade and source |
|---|---|---|
| Three currencies | Gold, prestige, piety. Depending on government, influence, merit, herd. Prestige levels `{ 1000 2000 5000 10000 25000 }`, eight piety levels, 50% progress kept when a level drops | B, `DEF` lines 154-175. Decision cost slots A (`DOM/13` section 2) |
| Holdings | Seven types (castle, tribal, city, church_holding, nomad, herder, temple_citadel). Building lists 47/16/39/36/0/0/40 | A, `DOM/07` section 1 |
| Buildings | Cost cheap 100, normal 150, expensive 200. Build time 365 to 2190 days. Monthly income 0.25/0.35/0.7. Example: orchard I, gold 150, 1095 days, levies 75, monthly income 0.35. The AI picks within the top 20% of `ai_value` | A, `DOM/07` sections 2 and 5, `FA/경제-건설.html`. AI choice C (`_buildings.info`). Cancellation refunds unconfirmed |
| Development and control | Economic buildings give development growth; only fort-type buildings give control growth +0.1 | A, `DOM/07` section 2 |
| Army upkeep | Men-at-arms purchase 150, upkeep 1.0 (peace) / 5.0 (raised), provisions cost infantry 3/7/12/15. Gold 0.003 per soldier | A (`DOM/08` line 36), B, re-checked (`DEF` line 638) |
| AI budget | Long term 0.20, short term 0.80, war chest 25 to 400, 18 months of upkeep held | A, `DOM/13` section 3, `GAME/common/defines/ai/00_ai.txt` lines 100-212 |

### 2.7 Schemes

| System | Rules and figures | Grade and source |
|---|---|---|
| Structure | Started by an interaction → 5 agent slots → progress and one opportunity per phase → a discovery check each month (30 days) → success roll → interception → outcome event. One scheme per type at a time, exposure chance = secrecy × 0.1, maximum success 95 | A (`FA/음모-정보.html`, `murder_scheme.txt` lines 1-403), constants B (`DEF` line 750 onward) |
| Sample figures | Murder: age 14 and over, 10-year cooldown, maximum secrecy 95. Abduction: maximum secrecy 85. Befriend: open, 30-year wait. Sway: 365 days, success 20 to 95%, opinion +25 on success. Fabricate hook: 2-year cooldown, a strong hook or a hook expiring after 3650 days | A, `FA/ck3-install-reverse-analysis-ko.html`, `FA/구실-음모.html`, `00_hook_types.txt` |
| Coverage | Only part of the 79 types traced (68 occurrences, 9 variants) | A, `FA/음모-범위.html`, `FA/음모-변형-1.html` to `-9.html`. The rest is **unfinished** |

### 2.8 Faith and culture

| System | Rules and figures | Grade and source |
|---|---|---|
| Faith | religion > faith > rite. Doctrines, tenets, holy sites. Social rules such as banning, approving or allowing divorce are doctrines. Conversion cost multiplier 0.5 for the same religion, 0.65 for another. Example rite-change decision: piety 50, 15-year wait | A and C, `DOM/11`, `20_doctrines.txt` lines 66-124, `FA/문화-종교.html`, `10_religious_decisions.txt` lines 2149-2254 |
| Culture | Traditions, ethos, heritage, language, innovations. Example tradition: base prestige cost 2000, replacement factor 1.5. A divergent culture needs 15 or more counties of the parent culture and a 10-year wait | A, `FA/문화-종교.html`, `DOM/11` |
| Remaining | Innovation progress formula, fervour calculation, the full path of founding a new faith | Unconfirmed, `DOM/11` "remaining boundaries" |

### 2.9 Events, decisions, situations

| System | Rules and figures | Grade and source |
|---|---|---|
| Events | 18,368 on_action definitions (174 files). `events` always fire when conditions hold, `random_events` are a weighted pick, `delay` must be valid both when fired and when the delay completes | A and C, `DOM/01` section 9, `_on_actions.info` lines 34-117 |
| Decisions | Shown (`is_shown`) → possible (`is_valid`) + cost → executed. `cooldown` is applied before the effect. The AI picks with per-tier check intervals, a cheap prefilter and a 0 to 100 score | A and C, `_decisions.info` lines 212-284 |
| Situations and story cycles | Regional phase transitions (score, duration, weighted random). Example: the plague story runs on a 21 to 37 day cycle. There are cases where it passes to the heir when its owner dies | A, `VC/representative-reconcile.md`, `DOM/12` |

### 2.10 War

| System | Rules and figures | Grade and source |
|---|---|---|
| Casus belli | Conquest example: same faith, piety 25 + min(5 × realm size, 75); other faith, prestige 50 + min(5 × realm size, 100). Victory transfers the target title and leaves the loser a claim. White peace costs the attacker prestige; defeat pays reparations | A, `FA/전쟁-정복.html`, `FA/전쟁-전투-정정.html` item 4, `00_conquest.txt` lines 1-356 |
| War score | Ticking score attacker 0.055 a day, defender 0.055 a day (from day 365). Occupation score = occupied ratio × 90. Battle score cap attacker 50, defender 100. Enemy capital occupied +10. Captured heirs by succession order 50/25/10. Per battle scale 50, maximum 50. **The casus belli overrides these values** (conquest: occupation and battle scale 150, war-goal ratio 0.8) | B, re-checked (`DEF` lines 584-590, 726-748), CB A (`DOM/08` line 28). The summing formula is unconfirmed |
| Levies | Attack 10, toughness 10, siege, pursuit and screen 0. Gathering at 40 distance units a day. Reinforcement 3% a month | B, re-checked, `DEF` lines 583-596, 636 |
| Men-at-arms | Purchase 150, regiment base 100 men, reinforcement 10% a month. Cap by tier `{ 0 1 2 3 4 5 6 }`, start 5. Nine base types plus siege weapons (table below) | B, re-checked, `DEF` lines 637-650, `MAA` |
| Counters | With 2.0 times the countering strength per enemy regiment chunk, the enemy's damage is cut by up to 90%; below that it is linear. Terrain and winter bonuses attach to each type | B, re-checked (`DEF` lines 604-605), terrain A (`DOM/08` section 3, `DOM/14` sections 4-5) |
| knights | 50 damage and 10 toughness per point of prowess. The AI counts a knight as prowess 10, that is combat power 1,100. Knight events every 5 days. A knight can be wounded, maimed and killed. Mercenary knights 2/3/4, armed religious order knights 2 + 0.5 per holding | B, re-checked (`DEF` lines 585, 614-622), events A (`FA/전쟁-전투-정정.html` item 1, `00_knight_phase_events.txt` lines 706-949), counts B (`DEF` lines 1275, 1327-1328) |
| Commander | Roll 0 to 10. The wound event is a weighted event picked every 5 days: base weight 25 × (40 − prowess) ÷ 40 (minimum 0.1), lowered for the stronger side, brave ×2, craven ×0.5. Competing with the nothing-happens weight 1000, it comes to about 2.4% every 5 days (C). The death event requires earlier wounds or low martial and prowess, and records the death reason `death_battle` and the killer. That martial enters advantage is a general rule, but the formula is unconfirmed | B, re-checked (`DEF` lines 585, 602-603, `00_commander_phase_events.txt` lines 1-86, `_combat_phase_events.info`), death A (same file lines 89-149, 341-416, `PR/08-지휘관-전투`). Advantage formula unconfirmed |
| Battle resolution (auto-resolve) | Maneuver 3 days → main phase (a roll every 3 days) → pursuit 3 days. Damage scale 0.03, advantage effect on damage 5, 30% of main-phase casualties actually die, 100% during pursuit. Combat width = defender size × 1 (minimum 100). **The player may retreat only after 14 days.** 30 days of penalty after disembarking | B, re-checked, `DEF` lines 582-613 |
| Advantage modifiers (combat effects) | Defender behind river +10, large river +20, strait +30, supply running low −10, starving −25, just disembarked −30, gathering −5, debt levels −5 to −100. Terrain: hills movement 0.8, width 0.8, defence +5, supply −10%; mountains movement and width 0.5, defence +12, supply −50% | B, re-checked (`00_combat_effects.txt`), terrain A (`DOM/14` section 4). **The formula turning advantage into damage, casualties and victory is inside the engine (unconfirmed)** |
| Sieges | One action every 20 days: breach 30, starvation 15, disease 15, desertion 20, stalemate 20 (weights). Defender morale 100 + 75 per fort level, −1 a day (minimum 0.5), 1% monthly attrition during the siege. Each fort level 4/6/11/16/31 needs one more siege grade; each missing grade multiplies speed by 0.7. A breach assault is declared separately | B, re-checked, `DEF` lines 970-1019. Prisoner list A (`siege_events.txt` lines 14-153) |
| Supply and movement | Movement 3, retreat 4.5, friendly area +20%. Full supply 100. Loss of 0.001 per soldier over the supply limit, own realm +15%, sub-realm +30%, minimum limit 1000. No loss for 30 days after gathering. A weighted table for where a routed army retreats | B, re-checked, `DEF` lines 632-697 |
| Raiding | Raid intent modifiers (speed, movement, attrition, loot). Nomad raids give gold ×0.5 and herd ×2 | A, `DOM/08` section 5, correction item 7. The loot formula is unconfirmed |
| Truce | 1,825 days after an accepted faction demand or a won independence war | A, `FA/독립-파벌-요구.html` |

CK3 men-at-arms base types (B, re-checked, `MAA`. The English names are CK3 script ids):

| CK3 id | Type | Damage | Toughness | Pursuit | Screen | Counters |
|---|---|---|---|---|---|---|
| `light_footmen` | skirmishers | 10 | 16 | 10 | 16 | heavy_infantry 1 |
| `bowmen` | archers | 25 | 10 | 0 | 0 | skirmishers 1 |
| `light_horsemen` | light_cavalry | 22 | 15 | 30 | 30 | archers 1, gunpowder 1 |
| `pikemen_unit` | pikemen | 22 | 24 | 0 | 0 | the four cavalry types 1 |
| `armored_footmen` | heavy_infantry | 32 | 22 | 0 | 0 | pikemen 1, peasant_militia 2 |
| `armored_horsemen` | heavy_cavalry | 100 | 35 | 20 | 0 | archers 1, gunpowder 1 |
| `crossbowmen` | archers | 42 | 18 | 0 | 0 | heavy_infantry 1, heavy_cavalry 1, archer_cavalry 0.5 |
| `pikemen_militia` | peasant_militia | 12 | 16 | 10 | 0 | light_cavalry 1, heavy_cavalry 0.5, camel_cavalry 1. Special recruitment only, purchase gold 0 |
| powder shooters (gunpowder type) | gunpowder | 52 | 12 | 0 | 5 | heavy_infantry 1 |
| `house_guard` | heavy_infantry | 40 | 32 | 0 | 24 | pikemen 2, peasant_militia 4, archers 2. At most 1 regiment |
| the four siege weapons | siege_weapon | 0 | 12 | – | – | siege grade 1 to 4, no part in the main battle |

### 2.11 AI and screen flow

- **AI.** The 7 war stances are hard-coded in the engine; the offensive stance's target priority is war-goal area 500 > enemy army 250 > enemy capital 150. Stance re-evaluation every 30 days. Base war chance 0 to 1 by vitality, desired allied strength ratio 1.25. The task scheduler's short tick `{ 7 30 14 7 7 7 7 }`. The AI goal database has no content in this install (A, `00_ai_war_stances.txt` lines 1-219, `00_ai.txt` lines 692-942, 1192-1216, `PR/13-AI-결정`, `DOM/13` section 1).
- **Screens.** A resource bar at the top, vertical tabs on the right (military, council, realm, intrigue), the ruler's portrait at the bottom left. Character window → context menu → confirmation (effect preview; shown, possible and cost kept separate). Marriage window, decisions window, intrigue window, court window (positions, prison), realm window (succession tab), county window (construction), war declaration window (casus belli → target → cost → send), notifications (feed/toast/popup) (declarations A, `FA/ui-research-20261029/interaction-flows.md`, `C/web-game/gui-src/ck3-gui-analysis.md`. State changes after a click are unconfirmed).

### 2.12 What CK3 battle does not do

This is the starting point of the combined design (C, analysis 3.1).

1. **There is no tactical control.** When two armies meet, the engine computes maneuver → main phase → pursuit to the end. All the player can do is retreat after 14 days.
2. **There is no formation, flank, fire or morale collapse.** CK3 regiments have no morale value. The name "morale" exists only for a siege's defenders (`BASE_DEFENDER_MORALE`, B, re-checked).
3. **There are no commander orders.** The commander enters only as the roll and as numbers in advantage. A knight is a bundle of damage and toughness proportional to prowess.
4. **Battle is not the whole war.** The attacker gets at most 50 by default from battles, and occupation and time give score separately. In CK3 a war is usually won through sieges and occupation.
5. **The battle formula was not recovered.** The candidate native battle function returned no analysis (`FA/ck3-install-reverse-analysis-ko.html`, `FA/native-20261028/`). The web reconstruction's battle kernel is, by its own ledger, a demo model without CK3 evidence (`C/ck3-web-reconstruction/evidence-map.md` EV-COMBAT-SPEC).

## 3. The combined design contract: a CK3-style campaign layer + a Total War-style battle layer

Basis: Bible 2.5 [Approved] (D3: one commander per army, the commander commands every squad, personal-resolution combat remains, unit figures live in SQL only), Bible 1, rows 14 and 15. `roster-framework.md` 6.3 (auto and manual battles use the same inputs), 10. Chapter 07 sections 12 and 13 (turn = one month). The CK3 rules of section 2.

### 3.1 Principles

1. **D3** [Approved]. One army has one commander, and that commander commands every squad in the army. No squad has the authority to move on its own. Duels and heroes' fights are resolved by personal-resolution combat.
2. **One place changes.** Only CK3's battle resolution engine (section 2.10 "battle resolution", "advantage modifiers", commander and knight events) is replaced by the battle layer. Everything else stays on the campaign layer (provisional T29-2).
3. **Same input, same output.** Manual and automatic battles take the same handoff packet (section 3.4) and produce the same return packet (section 3.5). This widens "auto and manual battles are the same" of `roster-framework.md` 6.3 to the whole packet (provisional T29-4).
4. **Battle is part of the war.** The hyeongse a battle gives (section 3.6) is capped. This keeps the CK3 structure in which wars are won through sieges and occupation (section 2.12 item 4) (provisional T29-13).

### 3.2 Time scale

A v3 campaign turn is one month (chapter 07 section 13, provisional T08-86). CK3 has a daily clock, so CK3 day values are carried into turns (provisional T29-1).

| CK3 value (days) | Source | v3 turn rule |
|---|---|---|
| Maneuver 3 days, main-phase roll 3 days, pursuit 3 days, retreat 14 days | `DEF` lines 591, 584, 599, 606 (B) | Inside the battle layer. **One battle ends within its turn.** An army fights at most one battle per turn as attacker (battles in which it is attacked are not counted) (provisional T29-3) |
| Monthly scheme check 30 days | `DEF` line 750 onward (B) | Once a turn |
| Siege phase 20 days | `DEF` line 987 (B) | One siege action per turn (section 3.8) |
| Reinforcement 3% a month (levies), 10% a month (men-at-arms) | `DEF` lines 636-637 (B) | The same ratios per turn (section 3.5.2) |
| Truce 1,825 days | A, `FA/독립-파벌-요구.html` | 60 turns (section 3.7) |
| Defender ticking score from day 365 | `DEF` line 730 (B) | From turn 12 (section 3.6) |
| Event pulses (yearly, quarterly, three-year, five-year) | `DOM/01` (A) | 12, 3, 36 and 60 turns. A season event is added on the first turn of the long-light season (April to September turns) and of the long-dark season (October to March turns) (chapter 07 section 13) |

### 3.3 What the battle layer replaces

| CK3 part | CK3 source | In the v3 battle layer |
|---|---|---|
| Maneuver phase | `MANEUVER_PHASE_DAYS` 3 (B) | **Deployment.** Deployment and formation are set before the battle (`roster-framework.md` 10.3) |
| Main phase with a roll every 3 days, damage scale, advantage summing | `DEF` lines 584, 597-600 (B), advantage formula unconfirmed | Real squad-against-squad engagement. The orders are four: move, attack target, fire, ambush (same section) |
| Counter attenuation (maximum 0.9, ratio 2.0) | `DEF` lines 604-605 (B) | Unit stats and tags and the category counter table (`roster-framework.md` 8) show directly in the engagement. The attenuation formula is not used |
| Pursuit phase, pursuit casualty conversion 1 | `DEF` lines 599, 609 (B) | Fast squads chase fleeing squads. Everyone who falls while fleeing counts as dead (section 3.5.1) |
| Commander roll 0 to 10 | `DEF` lines 602-603 (B) | Real command by the player or the AI. The commander's martial enters not as a roll but as the presence-radius morale bonus (`roster-framework.md` 10.6 [Pending] default +4 + floor(martial / 4), maximum +12) |
| Knight events (every 5 days), commander wound and death events | `DEF` line 585 (B), `00_commander_phase_events.txt`, `00_knight_phase_events.txt` (A) | Not chance events: what actually happened on the field is the result. When heroes meet, they duel (`roster-framework.md` 10.6) |
| 14-day manual retreat lock | `DEF` line 606 (B) | **Dropped.** Retreat is a whole-battle order and can be given at any time (`roster-framework.md` 10.3). Withdrawing squads are pursued instead |
| No morale | Section 2.12 item 2 | Morale is added. The steady / wavering / fleeing / shattered states of `roster-framework.md` 10.4 (section 3.9) |

(provisional T29-2)

### 3.4 What the campaign hands to battle: the handoff packet

When a battle opens, the campaign layer builds the packet below for each army. Automatic battles use the same packet (provisional T29-5).

| What is handed over | CK3 source | v3 value and source | Where the battle uses it |
|---|---|---|---|
| **Commander** | The commander character, martial and prowess, traits (B, A) | Person ID, the six stats (v3 values of chapter 07 section 8), wound state. Who may command: chapter 07 section 12.7 (provisional T08-84) | Presence-radius morale bonus (martial), duel input (prowess). In automatic battles also the injury risk formula below (provisional T29-6) |
| **Attached heroes** (the knights' place) | knights, 50 damage and 10 toughness per prowess (B) | Key and S1 people with martial or prowess 9 or more (chapter 07 section 12.7). Each hero has one `commander` category escort squad (`roster-framework.md` 10.2). Arc heroes also hand over their part count (chapter 06 section 3.5) | The combat-skill input of the duel roll is prowess (`roster-framework.md` 10.6 [Pending]). Attached heroes per army: default four (provisional T29-7, owner question) |
| **Squad list** | Levy and men-at-arms regiments, 100 men a regiment (B) | Unit id (`data/sql/130` to `132`), each squad's current strength and full strength, grade. Squad cap 20 slots (`roster-framework.md` 10.3 [Pending]) | The squads to deploy. Unit figures are read only from SQL |
| **Unit types and counters** | Men-at-arms types and counters (B) | The seven categories, the category counter table and the `counters` column (`roster-framework.md` 2.1, 8) | The engagement as is. The same shape as CK3's nine types plus counter factors |
| **Levy-type and standing-type** | Levies (attack and toughness 10, reinforcement 3% a month) and men-at-arms (reinforcement 10% a month) (B) | Per faction, the mapping of sections 4.2 to 4.4 (Government conscript infantry and reserves and career soldiers; Free Cities watch share and contract forces; Arc house levies and baptised fighters) | Levy-type squads may carry an expendable tag such as `ledger-levy` (`roster-framework.md` 10.4) |
| **The ground** | Terrain, river and strait advantage, combat width (A, B) | Where the armies met: station name and depth band (surface, concourse, platform, deep tunnel, 01-core 3.1), crossing type (bridge, under-river tunnel, land border, the thirteen of 01-core 7.4), the station's exit and line data (`120-map-core.sql`, `123-map-holdings.sql`), the season (long-light season, long-dark season, blizzard, chapter 07 section 12.6) | Builds the battle map (section 3.4.1) |
| **Supply state** | Supply 60/10/0, advantage −10/−25 (B) | The supply state set by the heat, air and water limits of the stations on the route (01-core 4.1): ample, short, starving | Starting morale (section 3.9) |
| **Scarce inputs** | None (CK3 has only gold upkeep) | Faction stocks (`ammo`, `cells`, `implants`, `fuel`, `parts`, `medicine`, `roster-framework.md` 6) | Starting ammunition, whether drones can deploy, weakening of implant squads (`roster-framework.md` 6.3 table) |
| **Advantage modifiers** | Just disembarked −30, gathering −5, debt (A, B) | An army that has just crossed a bridge or under-river tunnel this turn; an army not yet fully gathered | Deployment limits (section 3.4.1) |
| **Defences** | Fort level, defender morale 100 + 75 per level (B) | The station's exit shafts, checkpoints (chapter 04 section 14.4), holdout value (section 3.8) | Blocked exits and defensive structure on an assault battlefield |

(provisional T29-5)

#### 3.4.1 How the ground is built

CK3's river and strait advantage (+10/+20/+30) and combat width (defender size × 1, minimum 100) express the structure "the side attacking across a narrow place is at a disadvantage" (B, re-checked). v3 carries this structure not as a number of advantage but as the shape of the battlefield (provisional T29-8).

| Where the armies met | Battlefield | CK3 equivalent |
|---|---|---|
| Under-river tunnel (Mapo–Yeouinaru, Gwangnaru–Cheonho, Seoul Forest–Apgujeongrodeo) | A long, warm, hidden bottleneck. The number of squads engaging at once is bound by the tunnel's width. The `tunnel-fighter` tag comes alive | Strait +30, reduced combat width |
| Bridge (the seven of 01-core 7.4) | A narrow way exposed to wind and snow. Cold wears people down before the fighting does (`thin-clad`, `frost-hardened`, chapter 07 section 12.6) | River +10, large river +20 |
| Land border (Sadang–Bangbae, Chongshin Univ. (Isu)–Naebang, Dongjak–Gubanpo) | Tunnels and surface between stations. With no river, both sides can deploy wide | No advantage modifier |
| Inside a station (concourse, platform, deep tunnel) | Starts at an exit shaft and goes down through the depth bands. The deeper, the warmer and the shorter of air (01-core 4.1) | Hills and mountains defence advantage and reduced width |
| River ice | Not crossed by armies (2079, 01-core 9). Only small raids become battles | Worse than just disembarked −30 |

- An army that has just crossed a bridge or under-river tunnel this turn deploys only at the mouth of the crossing. This is the place of CK3's just disembarked −30.
- An army not yet fully gathered deploys only the squads that arrived this turn. This is the place of CK3's gathering −5.
- The figures for battlefield width and the number of squads engaging at once are set by the battle design task. This chapter sets only the rules.

#### 3.4.2 Commander and hero injury risk in automatic battles

In a manual battle, what happened on the field is the result. An automatic battle needs a chance. CK3's wound event is an event of weight 25 competing every 5 days with nothing happening (weight 1000) (B, re-checked, `00_commander_phase_events.txt` lines 1-86; the probability reading is C, `_combat_phase_events.info`), so it cannot be carried over as a probability. The v3 automatic battle value is therefore a **newly set provisional value**; only the shape of the modifiers is taken from CK3 (provisional T29-6).

- In each automatic battle, the wound chance of a commander or an attached hero is a base 10%. This 10% is not a CK3 value but a v3 provisional value. It is a rough size for one battle in which CK3's weight of about 2.4% per 5 days competes several times, and the battle design task will revise it.
- It is multiplied by the CK3-shaped prowess factor (40 − prowess) ÷ 40 (minimum 0.1). v3 stats run 1 to 20 (chapter 07 section 8.1), so this factor is 0.5 to 0.975.
- The commander and heroes of the side with greater strength when the battle opens get × (enemy strength ÷ own strength × 1.4, maximum 1). This keeps the CK3 condition (`side_strength` greater than the enemy's, independent of the outcome). The wording "the winning side" in 3af79df9a differed from the source and has been corrected.
- Chapter 07 section 8.1 leaves all trait effects empty, so the factors in the place of brave ×2 and craven ×0.5 are not used. Using them first needs change 4 of section 7.
- The split between wound levels and death is set by `roster-framework.md` 10.5 item 6 and RBATTLE-08 and RBATTLE-09.

### 3.5 What battle hands back to the campaign: the return packet

(provisional T29-10, T29-11, T29-12, T29-25)

| What is handed back | CK3 source | v3 rule |
|---|---|---|
| **Result** | Victory, the weighted retreat-destination table of a routed army (B, `DEF` NRetreat) | The winner; how the loser ended (withdrew: retreat order / routed: army collapse or every squad fleeing / destroyed); where each surviving squad is after the battle (still on the field, the station it withdrew to). Movement and retreat in section 3.13 and hyeongse in section 3.6 read this field |
| **Casualties** | Soft and hard casualties, main-phase conversion 0.3, pursuit conversion 1 (B) | For each squad, the fallen are split into dead and wounded (section 3.5.1) |
| **Replenishment** | Levies 3% a month, men-at-arms 10% a month (B) | Section 3.5.2 |
| **Fate of commander and heroes** | Wound level, maiming, death reason and killer (`save_died_in_battle_variables_effect`, A, B) | Recorded on the person ID: unhurt, wounded (level), lost a body part, dead (reason "the field", killer's ID), captured. The same as `roster-framework.md` 10.5 item 6 |
| **Captured characters** | Siege prisoner list, captured-heir score 50/25/10 (A, B) | Section 3.5.3 |
| **Hyeongse** | Battle score scale 50, maximum 50 per battle, attacker cap 50, defender 100 (B) | Section 3.6 |
| **Scarce inputs spent** | None | Primary input 1 per squad, rounds fired (`roster-framework.md` 6.3) |
| **Machines lost** | None | Destroyed drones and war machines are refilled only with `parts` in stock (`roster-framework.md` 6.3). Pieces of a destroyed outside machine go to the winner (chapter 03 section 8) |
| **Who holds the station** | Occupation (B) | The winner of an assault holds that station (section 3.8) |

#### 3.5.1 The dead and the wounded

- Of those who **fall in the main engagement**, 30% are dead and 70% wounded. CK3's main-phase conversion 0.3 is taken as the default.
- Everyone who **falls while fleeing** is dead. This is CK3's pursuit conversion 1.
- **If the losing side leaves the field**, those of its wounded it could not carry away are captured by the winner. Unnamed soldiers are not tracked separately on the campaign; they are subtracted from the loser's wounded. Only named characters go to section 3.5.3.
- The wounded return to their squad's replenishment share. **If the faction's `medicine` stock is 0, the wounded do not return** (the same as the `roster-framework.md` 6.3 table).

#### 3.5.2 Replenishment

- **Levy-type squads** (Government conscript infantry and reserves, Free Cities watch share, Arc house levies) refill 3% of full strength per turn. This is CK3's levies at 3% a month.
- **Standing-type squads** (Government career soldier squads, Free Cities contract forces, Arc baptised fighters) refill 10% of full strength per turn. This is CK3's men-at-arms at 10% a month.
- The returning wounded come back separately from this ratio, all at once on the next turn.
- If the `medicine` stock is 0, human squads replenish at half rate (`roster-framework.md` 6.3). If the `implants` stock is 0, `baptised` and `wired-body` squads stop replenishing (same table).
- Replacements come from the faction's population. For the Government, people registered in the ledger; for the Free Cities, the hands and labourers of the workbenches; for the Arc, the households of the Near Houses and the baptismal roll. No replenishment beyond the faction population (about 160,000, 75,000 and 65,000, 01-core 4.3) or the force size (chapter 07 section 12.2).

#### 3.5.3 Captured characters

- A named character of the losing side (commander, attached hero) who at the end of the battle had left it wounded, or whose escort squad was shattered or destroyed, is captured. In a manual battle, it is whoever did not actually get off the field.
- Captives are released or exchanged in the peace terms (section 3.7). The ransom is paid in the captor's reckoning: meals for the Government, kilos for the Free Cities, day charges for the Arc (chapter 03 section 11, provisional T04-49 to T04-52).
- Capturing an heir gives hyeongse. This is the place of CK3's captured heirs 50/25/10. The v3 "heir" differs by faction: the heir of a Member of the National Assembly's house (chapter 04 section 3.1), the eldest of a city holder's house or a workbench house (chapter 05 section 5.2), the next person named by a Head of the Near House (chapter 06 section 3.3).
- How each faction treats captives is set by the law and punishment sections of chapters 04 to 06. This chapter does not set it.

### 3.6 Hyeongse: the place of war score

CK3's war score is called **hyeongse** in v3: the plain word all three polities use for which way a fight has tipped. Government documents may write "jeonhwang" (the war situation), but the count is the same (provisional T29-13).

| Source of hyeongse | CK3 default (B, re-checked) | v3 default |
|---|---|---|
| Time | Attacker 0.055 a day, defender 0.055 a day (from day 365) | Attacker +1.5 per turn, defender +1.5 per turn from turn 12. 0.055 × 30 days ≈ 1.65, trimmed and rounded |
| Occupation | Occupied ratio × 90 | Share of war-goal stations held × 90 |
| Battles | Maximum 50 per battle, attacker cap 50, defender cap 100 | The same. A battle's hyeongse is set by the share of men each side lost; the formula is set by the battle design task |
| Capital | Enemy capital occupied +10 | +10 for holding the enemy's seat station. Government: Gwanghwamun; Arc: Jamsil; Free Cities: that city's seat station (chapter 05 section 2) |
| Captured heirs | 50/25/10 | 50/25/10 in the heir order of section 3.5.3 |

- When hyeongse reaches 100, the winner sets the peace terms. Before that, a war ends only on terms both sides agree.
- Defender time hyeongse starting late is what makes the Government's "army that holds" (chapter 04 section 14.4) and the Arc's "fight short" (chapter 06 section 11.4) fit in play. A long war favours the side holding.
- Because battle hyeongse is capped, however well a player fights in the field, the war cannot be ended without holding stations (section 3.1 item 4).

### 3.7 Casus belli, peace terms, truce

(provisional T29-14, T29-19)

- **Casus belli** differ by faction (sections 4.2 to 4.4). The CK3 structure in which a casus belli overrides hyeongse factors (conquest 150, 0.8, A) is used as is. The factors are set by the task that writes the casus belli table.
- **Peace terms become contract clauses.** The Government makes them as annexes (chapter 04 section 15), the Free Cities as contract sheets with pledges (chapter 05 section 4.2), the Arc as the Hierophant's word (chapter 06 section 2.2). The kinds of term are: change of holder of a station or crossing, handing over maintenance of a facility, release of captives, and a price paid in a reckoning.
- **A truce** is the term written in the peace terms. Default 60 turns (5 years), carried over from CK3's 1,825 days. Breaking a truce costs the Government a line in the ledger's disposition column, the Free Cities fewer counterparts at the next contract meeting (chapter 05 section 4.3), and the Arc a breach of the Hierophant's word.

### 3.8 Sieges and assaults

CK3 sieges stay on the campaign layer; only the assault goes to the battle layer (provisional T29-15, T29-16).

- **Holdout value.** A station's holdout value takes the place of CK3 defender morale (100 + 75 per fort level). Instead of fort levels, v3 sets it from the station's four limits (01-core 4.1): base 100, plus an amount for each exit shaft and checkpoint, reduced every turn while water, heat or air is cut. The figures are set by siege design.
- **Cutting actions.** CK3's siege actions (breach 30, starvation 15, disease 15, desertion 20, stalemate 20) become actions that cut a station's lifelines. One per turn: **cutting the air** (blocking vents and exits), **cutting the water** (wells, mains), **cutting the heat** (heat pump power), **drawing people out** (flight off the ledger, broken contracts), **stalemate**. The weights default to the CK3 values and shift with the attacking faction's skills. The Free Cities are strong at cutting the air ("cut the heat and air", chapter 05 section 11.4).
- **The deep station's weakness.** A deep station is warm but short of air (01-core 4.1). So the deeper the station, the stronger the effect of cutting the air.
- **Assault.** To get in before the holdout value reaches 0, the attacker assaults. An assault is one battle on the battle layer. The battlefield is the station's inside, going down from the exit shafts through the concourse to the platforms (section 3.4.1). CK3 also declares a breach assault and its casualty ratios (`DEF` lines 990-1000, B, re-checked).

### 3.9 Morale

CK3 regiments have no morale (section 2.12 item 2). Morale on the battle layer follows `roster-framework.md` 10.4 as written: steady, wavering (morale ≤ 25% of base leadership), fleeing (morale ≤ 0), shattered (on the fourth collapse). When a commander dies, section 10.5 of the same document applies.

Only one morale value passes from the campaign to the battle: **starting morale** (provisional T29-9).

| Campaign state | Starting morale | CK3 equivalent |
|---|---|---|
| Supply ample | Base leadership as is | Supply state normal |
| Supply short | −10 | Supply running low advantage −10 (B, re-checked) |
| Starving | −25 | Starving advantage −25 (B, re-checked) |
| `implants` stock 0 | Implant squads leadership −10 | None. The `roster-framework.md` 6.3 table |

- Morale is not kept after a battle. The next battle starts again from starting morale. The weight of past defeats remains not as morale but as the men lost and the fate of commanders.
- The low morale of grade 1 to 2 conscripts (Government, chapter 07 section 12.3) and the high morale of the Arc (chapter 07 section 12.5) are already in the units' leadership values. This chapter adds nothing on top.

### 3.10 Automatic battles

(provisional T29-4)

- Battles between AIs and battles the player skips are finished by automatic resolution.
- The skeleton is CK3's three phases: deployment (maneuver), main engagement (a few rolls), pursuit. Input is the section 3.4 handoff packet, output is the section 3.5 return packet. So manual and automatic battles share one result axis.
- CK3's counter attenuation (up to 90% at ratio 2.0) and advantage modifiers may serve as default factors for automatic battles. But **because CK3's damage, advantage and victory formula is unconfirmed, the v3 automatic battle formula is written new.** It is not described as a recovered CK3 formula.
- If automatic results are always worse or always better than manual ones, play tilts one way. Comparing the two with the same handoff packet and balancing them is the battle design task's job.

### 3.11 Armies fighting together

In CK3, allied armies fight together in one place. D3 is one commander per army. So when one battlefield has several armies (provisional T29-18):

- The player commands only their own army. Other armies of the same side are allies commanded by their own commanders (AI).
- Squads of Free Cities that have signed a **command sheet** (chapter 05 section 11.3) form one army. Squads of a city that has not signed are a separate army, and an AI ally on the same field.
- The same holds for the Arc's five Near House armies (chapter 06 section 11.1) and the Government's district units and Capital Defense Command direct units (chapter 04 section 14.1). One commander per army.

### 3.12 When the player character dies in the field

In CK3, an heir dying in battle was an event chance (section 2.10). In the combined game it is a result of command. **The default does not prevent it**: if the player character dies in the field as commander, play passes at once to the next person. Who that is follows "the player's passing of the turn" for each faction in sections 4.2 to 4.4. Whether to give the player character a protection rule (for example, being wounded out but never killed) is an owner question (provisional T29-17).

### 3.13 What stays on the campaign layer

Casus belli and their costs, hyeongse and peace terms, truces, sieges and cutting actions, occupation, raiding, supply and attrition, movement (along the line links `map_edge`) and retreat destinations, raising and disbanding levies, recruiting, upkeep and replenishment of standing-type squads, armies fighting together, AI war stances. And everything outside war: characters, houses, inheritance, marriage, schemes, contracts, economy, faith (C, analysis 3.5).

- **Supply and attrition.** The place of CK3's supply limit (minimum 1000, loss of 0.001 per soldier over it) is the heat, air and water limits of the stations on the route (01-core 4.1). Surface marches wear by cold, deep tunnel marches by air. Arc armies do not stay long more than a day from their seat station (chapter 06 section 11.4) (provisional T29-15).
- **Raiding.** The place of raiding is stripping another's stations of scrap, fibre and parts. Going over the outer perimeter to dig out power cores (01-core 9, chapter 03 section 2.1) is not war but an expedition.
- **Enemies outside the factions.** The hostile groups G01 to G26 of chapter 02 have no CK3 equivalent. On the battle layer they are fought as non-faction opponents. Only threat grades 4 to 5 (chapter 02 section 3.1) become a battle; grades 1 to 3 are resolved as campaign events (provisional T29-24).

## 4. CK3 -> v3 mapping, by faction

Basis: 01-core 7-8, chapters 04 to 07, Bible 1 rows 7-14, 2.1 to 2.5, 8. The verdicts are **take** (use the structure almost as is), **adapt** (use the structure but change it to fit the world), **drop** (do not use). The CK3 names in the left column only point at systems; they are not world words.

### 4.1 Common to all three factions

| CK3 system | Verdict | v3 | Source |
|---|---|---|---|
| Play one person and pass the turn on death | Take | The player is one person of one household. The passing rule differs by faction, sections 4.2 to 4.4 | Bible 1, row 12 [Approved] (work is inherited) |
| Six skills | Take (already used) | Diplomacy, Martial, Stewardship, Intrigue, Learning, Prowess. All 1,022 people, values 1 to 20, computed from occupation and rank | Bible 1, row 10 [Approved], 8 [Approved], chapter 07 section 8 (provisional T08-52) |
| Skill level boundaries 4/8/12/16 | Adapt | Four boundaries make five bands. On v3 values 1 to 20 the same boundaries give five screen words: 1-3 very poor, 4-7 poor, 8-11 average, 12-15 good, 16 and above excellent | `DEF` line 210 onward (B). Chapter 07 section 12.7's "9 or more" starts inside the "average" band (provisional T29-23) |
| Traits | Adapt | Personality traits are used. Their effects are empty for now, as chapter 07 section 8.1 says. The place of genetic traits is split between the winter body (cold endurance, lungs) and the Arc's part count | Chapter 07 section 8.1 item 3, chapter 06 section 3.5 (provisional T29-23) |
| Age thresholds | Take | CK3's adolescent 12 and adult 16 are already in v3: Free City apprentices at twelve (chapter 05 section 5.2), Government inherited-trade registration at sixteen (chapter 04 section 14.3), the Arc's first baptism after sixteen (chapter 06 section 5.2, provisional T07-18). Government conscription at nineteen (chapter 04 section 14.3) | `DEF` lines 180-186 (B) |
| Education | Adapt | The structure of assignment at 6 and result at 16. The guardian is someone of the same station. Government: school; Free Cities: workbench apprenticeship; Arc: the maintenance bench | `childhood_on_actions.txt` (A) (provisional T29-23) |
| Health and death | Adapt | The same structure with winter modifiers: shallow stations, starvation and lack of air wear health. A machine body loses health when it cannot reach maintenance and charging | Bible 1, row 14 [Approved], 01-core 4.1 (provisional T29-23) |
| Fertility and child caps | Adapt | Instead of caps by title tier, station capacity and the winter ratchet are the cap | 01-core 11 item 3, chapter 07 section 13 (provisional T08-86) (provisional T29-23) |
| Stress and mental breaks | Take | The same structure. Causes add the long-dark season, strike-off, maintenance failure and refusal of baptism | `stress_on_actions.txt` (A) (provisional T29-23) |
| Lifestyles and perks | Adapt | The six branches are rebuilt as the work of the three polities (for example, ledger work, workbench work, maintenance bench work). The shape "**a perk opens a new action**" is kept | Section 1.3, `00_perk_interactions.txt` (A) (provisional T29-23) |
| Marriage | Take | Marriage between households carries the weight of a contract. Marriage across the river: chapter 07 section 11.4 | Chapter 07 section 11.4 |
| Friends, rivals, hooks, secrets, blackmail | Take | Structure as is. The content of hooks differs by faction, sections 4.2 to 4.4 | `_hooks.info` (A, C) |
| Schemes | Take | Structure as is. A discovery check each turn (section 3.2) | `murder_scheme.txt` (A) |
| Regency | Take | A stand-in beside a young heir or a sick holder. As the scale rises, the stand-in eyes the seat | `00_regencies.txt` (A) |
| Five to six title layers | Adapt | Five layers: station, dong, district (duchy), whole faction, head | 01-core 8 (provisional T02-60 to T02-80) |
| De jure and drift | Drop | The geographic titles (dong cells, 25 districts) are a fixed land frame. There is no drift. 25 duchies = 14 + 7 + 4 [Approved] | 01-core 8, Bible 1, row 8 |
| Seasons | Drop | There are no seasons. Inside the eternal winter [Approved] there are the long-light and long-dark seasons and blizzards. CK3 men-at-arms `winter_bonus` is every unit's base condition | Bible 1, row 4, chapter 07 sections 12.6 and 13 |
| Three currencies (gold, prestige, piety) | Adapt | Gold's place is each polity's own reckoning (meals, kilos, day charges). Prestige's place is a household's name. Piety only in the Arc | Chapter 03 section 11 (provisional T04-49 to T04-54) |
| Holdings and buildings | Adapt | Holding = station. Building = station facility (heat pump, well, fan, fibre sugar vat, light field, wind machine, water wheel, maintenance bench). Building costs include parts and engineers' hands | 01-core 4-5, chapter 03 section 3 |
| Development and control | Adapt | Development = how far the station's four limits have been eased; control = how firmly the station is held | 01-core 4.1, 11 item 2 |
| Events, decisions, situations | Take | Structure as is. The first big situation is the third water supply contract of 2126 | 01-core 11 item 5 |
| Epidemics | Take | Stale air and short medicine speed the spread | `roster-framework.md` 6.1 `medicine` |
| Start dates | Adapt | One: winter 2126 [Approved] | Bible 1, row 11 |
| AI and screen flow | Take | Structure as is | Section 2.11 |
| Battle resolution | Drop | Replaced by the battle layer of section 3 | D3 [Approved] |
| Levies and men-at-arms | Adapt | Per faction, sections 4.2 to 4.4. Replenishment ratios of standing-type and levy-type: section 3.5.2 | `DEF` lines 636-637 (B) |
| Counters | Adapt | The seven categories, the category counter table and the `counters` column | `roster-framework.md` 2.1, 8 |
| knights | Adapt | Attached heroes (named characters) and their `commander` category escort squads | `roster-framework.md` 10.2, 10.6 |
| Men-at-arms upkeep | Adapt | The six scarce inputs are added to upkeep in the reckoning | `roster-framework.md` 6, Bible 1, row 15 [Approved] |
| Armed religious orders, theocratic holding leases | Drop | No equivalent | Bible 1, row 9, 4 |

### 4.2 Government

Basis: Bible 2.1 [Approved], 01-core 7.1 and 8.1, chapter 04 sections 3, 4, 7, 9, 14, 15.

| CK3 system | Verdict | In the Government | Source |
|---|---|---|---|
| The player's passing of the turn | Adapt | When a Member of the National Assembly dies or steps down, the household head names an heir, and the heir becomes the candidate at the next election. The player passes to the named heir | Chapter 04 section 3.1 (provisional T05-4), 01-core 2.4 "handing down the seat" (provisional T02-3) |
| Partition | Drop | One seat per district, never divided. The seat goes to one person | 01-core 8.1 (provisional T02-67) |
| Regency | Take | **Acting Member.** Until the election, the heir uses the district office's seal. Between acclamations, the oldest Member of the National Assembly is acting President | Chapter 04 section 3.1 (provisional T05-4), 3.2 (provisional T05-6) |
| Elective succession (weighted votes) | Adapt | **Acclamation.** The fourteen Members of the National Assembly stamp their seals under the candidate's name, and it takes effect only when all fourteen have stamped. No weighting by tier (one seat per district). Promises of seals gathered in advance (hooks) and opinion move the seals | Chapter 04 section 3.2 (provisional T05-5), 01-core 2.4 (provisional T02-2) (provisional T29-20) |
| Five-step vassal contract | Adapt | Steps of ration share and levy quota between a Member of the National Assembly and the dong chiefs and stationmasters. The shape of CK3's step table (exempt to extortionate, opinion +10 to −25) is used as is. The President holds no district, so there are no contract steps between President and Members | Chapter 04 sections 3.2 and 9, 01-core 5.3 (provisional T02-37) (provisional T29-20) |
| Crown authority | Adapt | **The weight of the signature.** The President's power is as much as the fourteen Members accept the President's sign-offs. Step effects are not set because of the CK3 gap (section 6) | Chapter 04 section 3.2 |
| Council and council tasks | Adapt | The seats of ministers and agency heads (Interior and Safety, Climate, Energy and Environment, the Forest Service, Land, Infrastructure and Transport, Agriculture, Food and Rural Affairs, Health and Welfare, Justice, National Defense and so on). Tasks are the ministries' business (registration, water allotment, firewood shares, station quotas, fibre levies, strike-off review, conscription). The fourteen houses dividing the minister seats is a bargaining chip of acclamation | Chapter 04 section 4 (provisional T05-15) |
| Legitimacy | Adapt | The ledger's legitimacy: "we have carried on the Republic of Korea" | 01-core 7.1 (provisional T02-48) |
| Factions and demands | Take | The OMO Party and the Claw Party. Seats 6 to 8 in 2126. They split over the annex for the weir's north end at the third water supply contract | Chapter 04 section 3.3 (provisional T05-11), 15 (provisional T05-70) |
| Hooks and secrets | Adapt | **Ledger flaws**: forged entries, forged tokens, a struck-off relative, an unlicensed machine body, crossing the river without a seal | Chapter 04 section 7.3 "the gravest crimes" (provisional T05-30) (provisional T29-20) |
| Dread and tyranny | Adapt | No executions. The ladder of punishment (warning → ration demotion → labour sentence → forced transfer → strike-off) produces dread | Chapter 04 section 7.3 (provisional T05-28) (provisional T29-20) |
| Gold | Adapt | Meals and workdays | Chapter 03 section 11.1 (provisional T04-50) |
| Piety | Drop | The Government has no organised faith. The national ceremony is a ceremony, not a faith currency | Chapter 04 section 13, Bible 1, row 9 |
| Levies | Take | Conscript infantry and reserves (about 20,000). Conscription at nineteen, 18 months' service | Chapter 04 section 14.3 (provisional T05-60, T05-64) |
| Men-at-arms | Adapt | Career soldiers (about 4,000) and serving conscripts (about 2,500), the Capital Defense Command's direct units. No machine-body units and no hired units | Chapter 04 sections 14.3 to 14.5, chapter 07 section 12.3 |
| knights | Adapt | Officers of captain and above, Members of the National Assembly, and the Capital Defense commander who meet the conditions of chapter 07 section 12.7 | Chapter 07 sections 12.3 and 12.7 |
| Command | Adapt | **Signed command.** One seal on the operation order. When the commander falls, the squads hold where they are until the next seal arrives. On the battle layer this is read as a Government doctrine that applies "hold in place" before the temporary squad leader of `roster-framework.md` 10.5 | Chapter 04 section 14.2 (provisional T05-59). Section 7 item 6 |
| Casus belli | Adapt | Retaking an under-river tunnel mouth, recovering registered people who fled the ledger, striking the side that broke a water supply contract annex. The cost of a casus belli is the President's sign-off and the seal of the Member of the National Assembly whose district holds the passage. Government doctrine does not cross the river as an army, so attacks go only through the three tunnels | Chapter 04 sections 14.4 and 15, 01-core 7.4 (provisional T29-19) |

### 4.3 The Free Cities

Basis: Bible 1, row 13 [Approved], 2.2 [Approved], 01-core 7.2 and 8.2, chapter 05 sections 2, 4, 5, 6, 11.

| CK3 system | Verdict | In the Free Cities | Source |
|---|---|---|---|
| Government variants | Adapt | Each city chooses its holder differently. This takes the place of CK3's government and succession variants: **choosing** (Gangseo Wind Keeper, Geumcheon Edge Warden, Dongjak Ferry Keeper), **inheritance** (Yangcheon Depot Master, Duke of Gwanak), **turns** (Yeongdeungpo Market Master, three years each), **guarantees kept** (Guro Works Master) | Chapter 05 section 2 (provisional T06-1) |
| The player's passing of the turn | Adapt | A workbench house's bench master seat is inherited, but **an eldest who has not shown a hand cannot inherit.** The passing has a hand threshold: the next person must show they can do the bench's work alone. Without one, the house brings in someone who has shown a hand by marriage or contract | Chapter 05 section 5.2 (provisional T06-27) (provisional T29-21) |
| Realm hierarchy and head | Drop | No one stands above the cities. There is no collective name | Bible 1, row 13 [Approved], 2.2 [Approved] |
| Vassal contract | Adapt | **Contract sheets** between cities. A sheet binds only the cities that stamped it. No vote | Chapter 05 section 4.2 (provisional T06-21) |
| The place of truces and hostages | Adapt | **The pledge.** Until a sheet is paid off, something is left with the counterpart city; if the sheet is broken, the counterpart keeps it | Chapter 05 section 4.2 item 6 (provisional T06-22) (provisional T29-21) |
| Prestige | Adapt | **Surety.** Fewer cities will make sheets at the next contract meeting with a city that withdrew its seal. Guarantees kept are its name | Chapter 05 sections 4.3 (provisional T06-23) and 6.3 (provisional T29-21) |
| Gold | Adapt | Kilos and hand-hours | Chapter 03 section 11.2 (provisional T04-51) |
| Piety | Drop | No organised faith | Chapter 05 section 10.5, Bible 1, row 9 |
| Council | Adapt | No council. Inside a city, the bench masters; between cities, the contract meeting called each time and its Host | Chapter 05 sections 4 and 5, 01-core 8.2 (provisional T02-70) |
| Marriage | Take | Marriage between workbench houses is also a trade of skills | Chapter 05 section 5.2 |
| Hooks | Adapt | A broken contract, a broken surety, a pledge not returned | Chapter 05 sections 4 and 6 (provisional T29-21) |
| Levies | Adapt | **Watch share.** Every workbench gives some of its hands each year for a set number of days of watch. About 1,100 hands can be called at once. A skilled levy type | Chapter 05 section 11.1 (provisional T06-59), chapter 07 section 12.2 (provisional T08-79) |
| Men-at-arms | Drop | No standing army | Chapter 05 section 11.1 |
| Mercenaries | Take | **Contract forces.** Hands bought by contract. About 600 more can be bought. The place of CK3's `mercenary_government` | Chapter 05 section 11.1, chapter 07 section 12.2, section 1.3 |
| knights | Adapt | The holder of the city that raised the army, or the person to whom they handed command by contract | Chapter 05 section 11.2 (provisional T06-60) |
| Allies fighting together | Adapt | Only by signing a **command sheet** do the squads of several cities become one army. That signing takes time is the weakness | Chapter 05 section 11.3 (provisional T06-61), section 3.11 |
| Sieges | Adapt | Strong at cutting actions: they stop the fans of a station the enemy holds and block its exits | Chapter 05 section 11.4, section 3.8 |
| Casus belli | Adapt | Collecting on a broken contract sheet, recovering engineers taken by the Arc, collecting on a water supply contract annex the Government broke. The cost of a casus belli is a contract meeting and a command sheet | 01-core 7.4, chapter 05 section 4.5 (provisional T29-19) |

### 4.4 The Arc

Basis: Bible 2.3 [Approved], 1 rows 9 and 14, 01-core 7.3 and 8.3, chapter 06 sections 2, 3, 5, 8, 11, chapter 07 section 8.6.

| CK3 system | Verdict | In the Arc | Source |
|---|---|---|---|
| The player's passing of the turn | Adapt | The Head of the Near House seat passes by blood within the Near House. The person the Head named comes first; failing that, the Near House's household chooses. **The next Head of the Near House must have two parts or more** | Chapter 06 section 3.3 (provisional T07-8), 3.5 (provisional T07-10) |
| Succession of the head | Adapt | A name the Hierophant spoke in life comes first; failing that, the Seat of the Four Near Houses chooses from the four Heads and their blood. If a bloodline arises, the bloodline comes first. A default and an owner question | Chapter 06 section 3.4 (provisional T07-9) |
| Title revocation | Take | The Hierophant names and removes Near Houses. A removed household gives up its district | 01-core 7.3, chapter 06 section 3.2 |
| House renown | Adapt | The two axes of **blood and iron**. The name of blood and side service (house axis) and the part count (person axis) stand apart. In the maintenance order a fitter with many parts can come before a Near House cousin | 01-core 7.3 (provisional T02-57), chapter 06 section 3.5 (provisional T29-22) |
| Part count | Adapt | CK3 has no equivalent. The nearest is a trait with levels. A count per person starting from 0, and the threshold for titles (Head of the Near House 2, Shelter Head 1, Bench Keeper 3). The Hierophant is not counted | Chapter 06 section 3.5 (provisional T07-10), chapter 07 section 8.6 (provisional T08-58) (provisional T29-22) |
| Faith (doctrines, conversion) | Adapt | The Arc is the one organised faith. Conversion's place is baptism, costing implant parts, maintenance turns and power. Doctrine's place is the Hierophant's word (not written down; repeated until it becomes law) | Bible 1, row 9 [Approved], chapter 06 sections 2.2 and 5 |
| Holy sites | Drop | No equivalent in the public setting | Chapter 06 section 15 is private, and this chapter does not deal with it |
| Piety | Adapt | **The giving.** People of households that give generously move up the maintenance order sooner | Chapter 06 section 8.4 (provisional T07-38) (provisional T29-22) |
| Gold | Adapt | Day charges and maintenance turns | Chapter 03 section 11.3 (provisional T04-52), chapter 06 section 8.2 (provisional T07-36) |
| Council | Adapt | **The Seat of the Four Near Houses.** It hears disputes, divides power and parts shares, and settles agreements with other polities. No votes. Decisions end with the Hierophant's word | Chapter 06 section 3.6 (provisional T07-11) |
| Cultural divergence | Take (as setting) | The Arc's split from the Free Cities is the real case. Free City workshop speech remains at the maintenance benches | 01-core 7.3 (provisional T02-101) |
| Marriage | Take | Marriage with the Hierophant's bloodline is one of the ways to become a Near House. None in 2126 | Chapter 06 section 3.2 (provisional T07-7) |
| Hooks | Adapt | A skipped fitting day, a short giving, a part fitted outside | Chapter 06 sections 5.2, 5.7, 8.4 (provisional T29-22) |
| Levies | Take | **House levies.** Each Near House sets a head count for each household. Many are unbaptised | Chapter 06 sections 11.1 and 11.5 (provisional T07-53) |
| Men-at-arms | Adapt | **Baptised fighters** (two parts or more, aged twenty or more, about 1,300) and the five Near House armies. Old machines revived from the old Suseo and Godeok depots | Chapter 06 section 11.1 (provisional T07-49), chapter 07 section 12.2 (provisional T08-79) |
| knights | Adapt | Heads of the Near Houses, Guard Captains, the Hierophant. The hero's part count goes into the handoff packet | Chapter 06 section 11.1, chapter 07 section 12.5 |
| Supply and attrition | Adapt | **Back before the parts run dry.** Arc armies do not stay long more than a day from their seat station. An army that loses its field fitters stops fighting and withdraws | Chapter 06 section 11.4 (provisional T07-52), section 7 item 7 |
| Casus belli | Adapt | Holding the south mouths of the under-river tunnels and the weir's south end, disputes over land border stations, recovering the parts of the dead. The cost of a casus belli is the Hierophant's word | Chapter 06 section 11.3, chapter 03 section 4.7 (provisional T29-19) |

## 5. Cross-faction mapping at a glance

| CK3 | Government | Free Cities | Arc |
|---|---|---|---|
| Passing of the turn | The named heir (handing down the seat) | The child who has shown a hand | By blood, but two parts or more |
| Succession of the head | Acclamation by fourteen seals | None | The name the Hierophant spoke; failing that, the Seat of the Four Near Houses |
| Contract | Steps of ration share and levy quota | Contract sheets and pledges | Maintenance order and charging shares |
| Prestige | The household's name | Surety | Blood and iron |
| Gold | Meals, workdays | Kilos, hand-hours | Day charges, maintenance turns |
| Piety | None | None | The giving |
| Council | Ministers | Bench masters, contract meetings | The Seat of the Four Near Houses |
| Factions | OMO Party and Claw Party | The cities | Blood and iron |
| Hooks | Ledger flaws | Broken contracts | Skipped fitting days, short giving |
| Levy type | Conscript infantry, reserves | Watch share | House levies |
| Standing type | Career soldiers | Contract forces | Baptised fighters |
| Command | Signed command | Command sheet | The Near House's army |
| What runs short | `ammo`, `fuel` | `cells`, `parts` | `implants`, `medicine` |

Source: sections 4.2 to 4.4, `roster-framework.md` 9.3, chapter 07 section 12.

## 6. Gaps and research still needed

Basis: analysis section 5, section 1.3.

### 6.1 The engine layer

| Gap | Design it blocks | Research needed |
|---|---|---|
| Battle damage, advantage, casualty and victory formula | Matching automatic battles to CK3's result distribution | The native battle function (candidate analysis returned nothing), or sampling battle results in the real game |
| Real behaviour of the soft/hard casualty conversion | Validating section 3.5.1's 30%/100% | Same. Only the declared values 0.3 and 1 exist |
| The formula by which commander martial enters advantage; the distribution of the commander roll | The weight of commander stats (`roster-framework.md` 10.6 [Pending]) | Same |
| War score summing | Validating section 3.6's hyeongse | The real summing of `NWar` and casus belli factors |
| Siege progress formula | The weight of section 3.8's cutting actions | The real size of each siege action's effect |
| Succession division, order of the player switch | The details of section 4's passing of the turn | Native succession handling |
| Inheritance chance, education roll, final health and death formula | The character systems of section 4.1 | Native character handling |
| Final scheme success and secrecy summing | Scheme figures | Native scheme handling |
| Marriage condition function | Rule details of marriage across the river (chapter 07 section 11.4) | Only the string location (VA 0x14487d158) is known |

### 6.2 Where no domain document exists

- **Domains 02 (characters), 03 (relations) and 04 (schemes) have no domain document.** There are only fragments in `RUN/fragments/` and HTML samples. So there is **no full trait table, no table of options that raise stress, and no full lifestyle perk tree.** This is why the trait, stress and lifestyle mappings of section 4.1 stay at the level of structure.
- **Crown authority and realm laws**: names only. The steps of the Government's "weight of the signature" (section 4.2) cannot be set.
- **Full council tasks**: one of 4,133 definitions was seen. No per-seat skill effects either.
- **How prestige and piety are gained**: no table of what raises and lowers them. This blocks setting figures for surety (Free Cities) and the giving (Arc).
- **Knight count rules** (cap per ruler) and knight event chances: the attached-hero cap (section 3.4, provisional T29-7) has no basis.
- **Levy size formula** (combining holdings, buildings, control, development), the full list of men-at-arms terrain and winter bonuses.
- **Activities (beyond hunting and pilgrimage), landless adventurers, founding faiths, innovation progress, the full legacy tracks, the map movement cost formula, the save structure** (`DOM/09`, `DOM/10`, `DOM/11`, `DOM/12`, `DOM/14`, `DOM/16`).

### 6.3 Gaps of method

- **Zero observations of the game running.** Not one value such as the final success chance in a real tooltip was seen. A procedure for native run observation has been set, but there are no observations (`C/godot-ck3/docs/native-oracle/README.md`).
- **Grade B values are not in the corpus byte-verification ledger.** The B values this chapter uses as contract defaults (sections 3.2 to 3.9) must be registered the same way (SHA-256 of the source slice) before they become fixed values.
- **The full in-block number census (1,711,825 values) is neither approved nor published** (`VC/run-status.json`). The published set is the 47,712 top-level values.
- **No comparison with official documents.** "The player passes to the heir", "commander martial enters advantage" and "stress rises from choices against personality" are marked separately in this chapter as C (general knowledge).

### 6.4 Design still open on the v3 side

- Figures for battlefield width and squads engaging at once (section 3.4.1), holdout value and cutting actions (section 3.8), and the automatic battle formula (section 3.10): the battle design task.
- Hyeongse factors per casus belli (section 3.7): the task that writes the casus belli table.
- How each faction treats captives (section 3.5.3): the law and punishment sections of chapters 04 to 06.

## 7. Changes handed to other chapters

This chapter did not edit the files below. It lists where CK3 evidence suggests a change. The relevant task or the owner decides.

| # | Target | Now | Change handed on | Source |
|---|---|---|---|---|
| 1 | `roster-framework.md` 10.3 | Retreat is a whole-battle order | Add "it can be given at any time (no CK3-style 14-day lock). Withdrawing squads are pursued" | Section 3.3, `DEF` line 606 (B) |
| 2 | `roster-framework.md` 10.5 item 6, 13 | Death, wounds and detention are recorded on the person ID | Add the section 3.5 return packet (30%/100% casualty split, return condition for the wounded, captured characters, hyeongse) as the battle result contract | Section 3.5, `DEF` lines 598, 609 (B) |
| 3 | `roster-framework.md` 6.3 | Stocks and consumption of scarce inputs | Add default replenishment of 3% per turn for levy-type and 10% per turn for standing-type as [Pending] | Section 3.5.2, `DEF` lines 636-637 (B) |
| 4 | Chapter 07 section 8.1 item 3 | All trait effects are empty arrays | Keep them, but if automatic battles are to use personality traits (in the place of brave and craven) for commander injury risk as CK3 does, raise as an owner question a separate battle-only effect. Stats (`effective = base`) do not change | Section 3.4.2, `00_commander_phase_events.txt` lines 54-86 (B) |
| 5 | `roster-framework.md` 10.2, 13 | No cap on attached heroes | Add a default of four attached heroes per army (one slot each within the 20 squad slots) as [Pending] | Section 3.4 (provisional T29-7); the CK3 knight cap rule is a gap (section 6.2) |
| 6 | `roster-framework.md` 10.5 item 3, chapter 04 section 14.2 | When a commander dies, a temporary squad leader steps up / Government squads hold in place until the next seal arrives | Decide how the two rules work together in battle. Default proposal: a Government army's temporary squad leader cannot give move orders and only "holds in place" | Section 4.2 "Command" |
| 7 | `roster-framework.md` 9.3, chapter 06 section 11.4 | The Arc's scarcity bottleneck is `implants`, `medicine` / an army that loses its fitters withdraws | Add the campaign rule "an Arc army that has lost all field fitters of its support squads withdraws toward its seat station at the end of that turn" | Section 4.4 |
| 8 | Chapter 05 section 11.3, `roster-framework.md` 10.1 | Squads of a city that has not stamped the command sheet are a separate army | Add the battle rule that on the same field they are an AI ally | Section 3.11 (provisional T29-18) |
| 9 | `roster-framework.md` 4.3 rationale, 8.3, 11.1 marker list, 13 row P1 | Government titles from before the 2026-11-13 correction remain (4.3 also keeps an old word for the Free Cities and the figure-of-speech word of the sixth row, left column, of the 01-core 2.4 table) | Add these four places to the chapter 07 section 12.8 table of words to fix (Member of the National Assembly, separate cities, no one above). Chapter 07 section 12.8 lists only 4.2, 9.2 and the Government's third-step building | 01-core 2.4, Bible 9.4 2026-11-13 Member of the National Assembly row |
| 10 | Task 9 (word table and banned terms), chapter 07 section 8.8 | There is no "hyeongse" | Add the world word "hyeongse" (how far a war has tipped) to chapter 08 and the word table. Government documents: "jeonhwang" | Section 3.6 (provisional T29-13) |
| 11 | `roster-framework.md` 13 owner pending list | No rule for the player character's death in the field | Add the question of section 3.12 (default: not prevented) | Section 3.12 (provisional T29-17) |
| 12 | Analysis document `docs/research/v3-ck3-corpus-analysis.md` section 2.2 | "Five lifestyles" | The install has six (including wanderer). Being a research record it is not edited; section 1.3 of this chapter corrects it | Section 1.3 (B, re-checked) |

## 8. Private setting

This chapter has no private setting. It does not deal with the sanctuary's location, who chooses the brains, whose the first brain was, or who reads the output (Q12). Setting the Arc's holy sites to "drop" (section 4.4) means there is no equivalent in the public setting; it does not point at the contents of chapter 06 section 15.

## Appendix. Sources this chapter relied on directly

- Research record: `docs/research/v3-ck3-corpus-analysis.md` (the analysis), sections 0 to 5.
- Corpus: `DOM/01`, `DOM/05` to `DOM/14`, `RUN/ck3-인물-생애-연결조사.md`, `RUN/ck3-관계-혼인-상호작용.md`, `FA/ck3-install-reverse-analysis-ko.html`, `FA/인물-생애.html`, `FA/혈통-전승-출생.html`, `FA/승계-법.html`, `FA/통치-계약.html`, `FA/경제-건설.html`, `FA/음모-정보.html`, `FA/구실-음모.html`, `FA/관계-혼인.html`, `FA/문화-종교.html`, `FA/독립-파벌-요구.html`, `FA/전쟁-정복.html`, `FA/전쟁-전투-정정.html`, `PR/03-종교-이혼`, `PR/05-궁정-의사`, `PR/08-지휘관-전투`, `PR/13-AI-결정`, `FA/ui-research-20261029/interaction-flows.md`, `VC/representative-reconcile.md`, `VC/run-status.json`, `C/web-game/gui-src/ck3-gui-analysis.md`, `C/ck3-web-reconstruction/evidence-map.md`.
- Install (re-read in this task): `DEF` lines 582-660, 726-748, 970-1000, `MAA`, `GAME/common/combat_effects/00_combat_effects.txt`, `GAME/common/combat_phase_events/00_commander_phase_events.txt`, `_combat_phase_events.info`, `GAME/common/council_positions/01_ministry_positions.txt`, `GAME/common/scripted_effects/00_death_management_effects.txt`, `GAME/common/lifestyles/00_lifestyles.txt`, `GAME/common/council_positions/00_council_positions.txt`, `GAME/common/governments/`.
- v3: `docs/CANON-BIBLE.md` 1, 2.5, 8, 9.4, `docs/design/v3/01-core.md` to `07-people-and-war.md`, `docs/design/roster-framework.md`.
