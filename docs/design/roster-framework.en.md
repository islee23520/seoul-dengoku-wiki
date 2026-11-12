# Roster design framework

Status: **DESIGN CONTRACT draft**. Written 2026-11-12. Plan: `.omo/plans/wiki-world-overhaul-v2.md`, task 6 (GAP-2). This is the English parallel of [roster-framework.md](roster-framework.md). The Korean file is primary; if the two differ, the Korean file wins.

This document holds the rules that the roster tasks 13, 14 and 15 and the battle design task 19 follow together. It contains no unit rows (SQL). Rows live only in `data/sql/130-units-government.sql`, `131-units-free-city.sql` and `132-units-arc.sql` (bible section 2.5).

## 0. How to read this and the order of evidence

- **[approved]** marks a fact approved by `docs/CANON-BIBLE.md`. This document repeats such facts and does not change them.
- **[frame]** marks a design rule set by this document. Tasks 13-15 and 19 must follow it. It is not world canon, the owner may change it at any time, and it must not be copied into the public wiki as a world fact.
- **[pending]** marks an item that waits for an owner answer and uses a provisional default. The full list is in section 13. Pending items are never written as approved.
- Sources: bible sections 1, 2.1-2.5 and 3. Owner decision D3, verbatim: "전투 방식은 토탈워랑 동일하게 지휘관이 모든 분대의 지휘권한을 갖음" (the battle works the same as Total War: the commander holds command over every squad). Owner instruction (2026-11-12), verbatim: "전투 기준 값은 알려진 워해머 토탈워 정보를 기준으로 로스터 잡아서 작업 합니다" (battle numbers are set from known Total War: WARHAMMER information). TW:WH numbers come from Fandom MediaWiki API pages and research B section 4. Unit names from other games are still not used. Research docs `docs/research/w2v-tech-scarcity.md` and `docs/research/w2v-life-economy-rosters.md` (reference only). The `wiki_unit` table in `data/sql/000-schema.sql` (task 4 branch). GDD `hero-squads-and-time-based-movement.json`, `personal-resolution-battle.json`, `rules-battle-clauses.json`, `character-art-direction.json`. Station data in `data/sql/120-map-core.sql`.
- The stat axes follow Total War-style battle: melee attack, melee defence, weapon strength, armour, missile damage, range, ammunition, speed and leadership. The numbers are a design scale for comparing and balancing units. The actual battle formula belongs to the GDD personal-resolution battle, which says its coefficients and numbers are not yet set. This document does not set a formula either; section 10.6 only states how the two connect.

## 1. Schema and stat scales

### 1.1 Column contract

Column names and NOT NULL rules of `wiki_unit` are not changed. Text columns are used as follows.

| Column | NULL | Usage |
|---|---|---|
| `id` | no | `<faction_id>-<english name in kebab case>`, e.g. `government-ledger-levy-spears`. Unique across all three factions |
| `faction_id` | no | One of `government`, `free-city`, `arc` |
| `name`, `name_ko` | no | Section 11 naming rules |
| `category` | no | One of the seven strings in section 2 |
| `role` | no | One of the role strings in section 2.2 |
| `recruit_building`, `recruit_building_ko` | no | The exact building name from the section 4 tables for that tier |
| `scarce_input` | yes | Section 6 vocabulary. One value, or two joined by a comma with no space, main input first. The order and values follow the section 6.2 rule, e.g. `ammo,fuel` |
| `attributes` | no | JSON array of section 7 tag ids. The empty array `[]` is allowed. At most 4 |
| `counters` | no | JSON array of 1-4 unit `id`s this unit is good against. Section 8.3 |
| `equipment`, `equipment_ko` | no | Section 11. One to three sentences |
| `appearance`, `appearance_ko` | no | Section 11. One to three sentences |
| `gdd_ref` | yes | A GDD rule anchor (e.g. `rules/hero-squads-and-time-based-movement#source.b16`), or NULL |

### 1.2 Numeric column scales

This table is the range for every numeric column. Values outside the range are not used. Only columns marked "yes" under NULL may be NULL. Owner instruction (2026-11-12, verbatim): "전투 기준 값은 알려진 워해머 토탈워 정보를 기준으로 로스터 잡아서 작업 합니다" (battle numbers are set from known Total War: WARHAMMER information). So every battle number range sits inside known Total War: WARHAMMER (TW:WH) values. The last column is the source. Links are Fandom MediaWiki API pages; the page names are source addresses only and are never used as unit names. Pages whose names are on the forbidden list are not linked; the verifier's table is cited instead.

| Column | Range | NULL | Meaning | Interaction | TW:WH reference |
|---|---|---|---|---|---|
| `sort` | 1-999 | no | Display order inside the faction: category order (section 2), then tier | Unique within a faction | n/a (display order, not a TW battle number) |
| `tier` | 1-5 | no | Tier. Section 3 | Sets the cost band, leadership band and cap rules | Tiers 1-5 ([research B 4.3](../research/w2v-life-economy-rosters.md) rows A-G), [Crossbowmen](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Crossbowmen&prop=text&format=json) tier 2 |
| `cost` | 150-3200 | no | Recruitment cost. Unit name is [pending] (section 13) | Section 5.1 tier bands | 300 (tier 1) to 2,100 (tier 4) ([research B 4.3](../research/w2v-life-economy-rosters.md)), [Crossbowmen](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Crossbowmen&prop=text&format=json) 475 |
| `upkeep` | 30-960 | no | Upkeep paid each upkeep interval | Must be 20-30% of `cost` | 81-525, 24.8-27% of recruitment cost ([research B 4.3](../research/w2v-life-economy-rosters.md), [Spearmen](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Spearmen_(The_Empire)&prop=text&format=json) 81, [Steam_Tank](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Steam_Tank&prop=text&format=json) 525) |
| `unit_cap` | 1-8 | yes | Squads of this unit the faction may field at once. NULL means no cap | Section 5.3. Not NULL for tier 4-5, drones and `irreplaceable` | Upkeep-paying factions have no caps; some factions' per-unit caps are not published as numbers ([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Recruitment&prop=wikitext&format=json)). This column is a design deviation to express scarcity [frame] |
| `squad_size` | 1-80 | no | Base fighting strength of the squad (airframes for drones, hulls for war machines). Heroes are not counted | Section 1.3 category bands. Actual size varies with commander, faction and settlement level per the GDD | 1 (single-entity machine) to 180 (infantry at the largest unit-size setting). Section 1.3 |
| `hp` | 50-9500 | no | Health of one person (or one airframe or hull) | Section 1.4 category bands. Squad health = `hp` x `squad_size` | Infantry 50-135 per model ([Spearmen](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Spearmen_(The_Empire)&prop=text&format=json) 8,280/120 = 69, [Black_Orcs](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Black_Orcs&prop=text&format=json) 10,800/80 = 135), cavalry 89-233 per model ([Demigryph_Knights](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Demigryph_Knights&prop=text&format=json) 233), single-entity machines 3,957-9,102 ([Steam_Tank](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Steam_Tank&prop=text&format=json) 9,102, [Doomwheel](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Doomwheel&prop=text&format=json) 6,420) |
| `melee_attack` | 10-65 | no | Melee attack skill | Compared with the target's `melee_defence` to set melee hit chance | 10 ([Helstorm](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Helstorm_Rocket_Battery&prop=text&format=json)) to 65 ([Ungrim](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Ungrim_Ironfist&prop=text&format=json)). Infantry 12-46 ([Swordmasters](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Swordmasters_of_Hoeth&prop=text&format=json) 46) |
| `melee_defence` | 6-66 | no | Melee defence skill | Higher means hit less in melee. Not used against missiles | 6 ([Helstorm](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Helstorm_Rocket_Battery&prop=text&format=json), [Zombies](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Zombies&prop=text&format=json)) to 66 (verifier report [verify-task-6](../../.omo/evidence/w2v/verify-task-6.md) calibration table; that page's name is on the forbidden list and is not linked). [Thorgrim](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Thorgrim_Grudgebearer&prop=text&format=json) 62, [Chosen](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Chosen&prop=text&format=json) 60 |
| `weapon_strength` | 18-400 | no | Power of one melee blow | The target's `armour` blocks part of it. The `plate-biter` tag ignores some armour | 18 ([Zombies](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Zombies&prop=text&format=json)) to 400 ([Doomwheel](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Doomwheel&prop=text&format=json)). Infantry 18-60, single-entity machines 250-400 ([Steam_Tank](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Steam_Tank&prop=text&format=json) 250) |
| `armour` | 0-150 | no | Blocking power of protective gear or hull | Reduces both melee and missile damage. Maximum reduction 90% | 0 ([Zombies](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Zombies&prop=text&format=json)) to 160 ([Steam_Tank](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Steam_Tank&prop=text&format=json)). [Reiksguard](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Reiksguard&prop=text&format=json) 120 |
| `missile_damage` | 8-465 | yes | Power of one shot (one attack for drones): base plus armour-piercing damage | NULL together with `range` and `ammo`, or all three set | Total 8 ([Outriders](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Outriders&prop=text&format=json)) to 465 ([Steam_Tank](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Steam_Tank&prop=text&format=json) 95+370). [Handgunners](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Handgunners&prop=text&format=json) 22 (5+17), [Crossbowmen](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Crossbowmen&prop=text&format=json) 24 |
| `range` | 60-480 | yes | Range in metres; control range for drones | `role` `rifle` 145-160, `artillery` 380-480, drones at most 480. On tunnel maps the real line of sight may be shorter than the range | 60 ([Doomwheel](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Doomwheel&prop=text&format=json)) to 480 ([Helstorm](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Helstorm_Rocket_Battery&prop=text&format=json)). Typical 80-200, artillery above 200 ([Range](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Range&prop=wikitext&format=json)). [Handgunners](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Handgunners&prop=text&format=json) 145, [Crossbowmen](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Crossbowmen&prop=text&format=json) 160, [Steam_Tank](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Steam_Tank&prop=text&format=json) 380 |
| `ammo` | 1-40 | yes | Shots per battle; sorties for drones | Section 6 scarcity rules reduce the starting ammunition | 1 ([Ammunition](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Ammunition&prop=wikitext&format=json)) to 100 ([Irondrakes](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Irondrakes&prop=text&format=json)). Gunpowder infantry 22 ([Handgunners](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Handgunners&prop=text&format=json)), [Steam_Tank](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Steam_Tank&prop=text&format=json) 40 |
| `speed` | 20-90 | no | Battlefield movement speed | Section 1.4 category bands | 20-90. Average 30-60, cavalry above 60, artillery below 30 ([Speed](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Speed&prop=wikitext&format=json)). [Helstorm](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Helstorm_Rocket_Battery&prop=text&format=json) 20, [Pistoliers](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Pistoliers&prop=text&format=json) 90 |
| `leadership` | 35-100 | no | Base morale; the starting value of morale in battle | Section 3.2 tier bands. Section 10 rout rules | 35 ([Zombies](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Zombies&prop=text&format=json)) to 100 ([Steam_Tank](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Steam_Tank&prop=text&format=json)) |

Reference interaction (for balance checks, not the battle formula): treat melee hit chance as 35 + `melee_attack` − target `melee_defence`, clamped to 8-90%. Damage is `weapon_strength` (or `missile_damage` for shots) reduced by the target's `armour` percent. This formula and the 90% armour cap have no number on the Fandom pages checked, so they are balance aids without a confirmed TW:WH source. When task 19 moves this comparison into GDD personal-resolution inputs, it must not subtract the same cause twice (the GDD "no double deduction" rule).

### 1.3 Squad size bands by category

Scarcity and population collapse make squads smaller than TW:WH's large unit-size settings. Higher tiers use the lower part of a band. Every band sits inside the TW:WH small-to-ultra unit-size range.

| Category | `squad_size` band | Counts | TW:WH reference |
|---|---|---|---|
| `commander` | 6-16 | Escort soldiers. The hero is not counted | n/a. A TW lord is a single entity with no escort squad ([verify-task-6](../../.omo/evidence/w2v/verify-task-6.md)) |
| `infantry` | 20-80 | Soldiers | 20-180. [Spearmen](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Spearmen_(The_Empire)&prop=text&format=json) 30/60/90/120 ([research B 4.3](../research/w2v-life-economy-rosters.md) row A) |
| `missile` | 12-48 | Shooters | 23-90. [Handgunners](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Handgunners&prop=text&format=json) 23/45/68/90 (row B). Weapon teams 7-32 |
| `fast` | 8-24 | Riders or skiers | Cavalry 8-60. [Reiksguard](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Reiksguard&prop=text&format=json) 15/30/45/60 (row E) |
| `drone` | 3-12 | Airframes. Operators are not counted | n/a. TW has no remote-controlled machine squads |
| `war-machine` | 1-4 | Hulls or guns. Crew are not counted | Artillery 1-4, armoured vehicles 1 (rows F and G, [Steam_Tank](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Steam_Tank&prop=text&format=json) 1) |
| `support` | 6-24 | Soldiers | n/a. Nearest: weapon teams 7-32 |

### 1.4 Health and speed bands by category

| Category | `hp` band | `speed` band | TW:WH reference |
|---|---|---|---|
| `commander` | 50-140 | 26-42 | People, so the infantry reference: 50-135 per model, speed 26-42 |
| `infantry` | 50-140 | 26-42 | 50-135 per model ([Spearmen](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Spearmen_(The_Empire)&prop=text&format=json) 69, [Black_Orcs](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Black_Orcs&prop=text&format=json) 135). Speed 26 ([Irondrakes](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Irondrakes&prop=text&format=json)) to 42 ([Clanrats](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Clanrats&prop=text&format=json)) |
| `missile` | 50-140 | 26-42 | As infantry ([Handgunners](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Handgunners&prop=text&format=json) 6,210/90 = 69, speed 33) |
| `fast` | 85-235 | 60-90 | Cavalry 89-233 per model ([Demigryph_Knights](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Demigryph_Knights&prop=text&format=json) 233), speed above 60 ([Speed](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Speed&prop=wikitext&format=json)), [Reiksguard](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Reiksguard&prop=text&format=json) 78, [Pistoliers](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Pistoliers&prop=text&format=json) 90 |
| `drone` | 50-140 | 60-90 | n/a. No TW counterpart, so it stays inside the people health band and the cavalry speed band [frame] |
| `war-machine` | 3500-9500 | 20-45 | Single entity 3,957-9,102 ([Steam_Tank](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Steam_Tank&prop=text&format=json) 9,102, [Doomwheel](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Doomwheel&prop=text&format=json) 6,420). Speed 20 ([Helstorm](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Helstorm_Rocket_Battery&prop=text&format=json)) to 40 ([Steam_Tank](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Steam_Tank&prop=text&format=json)) |
| `support` | 50-140 | 26-42 | As infantry |

## 2. Categories and roles

### 2.1 The seven categories

Use these `category` strings exactly. The task 5 pages group their tables in this order.

| Order | `category` | Page heading (ko / en) | Definition |
|---|---|---|---|
| 1 | `commander` | 지휘관과 영웅 / Commanders and Heroes | The escort squad frame that carries one named hero. The hero's own ability comes from the people ledger (CK3 stats). Row numbers describe the escort soldiers |
| 2 | `infantry` | 보병 / Infantry | Squads on foot that hold a line and fight in melee |
| 3 | `missile` | 사격병 / Missile | Squads that shoot from a distance: firearms, crossbows, thrown weapons, mortar crews |
| 4 | `fast` | 기동병 / Fast and Mounted | Squads that move fast: skis, sleds, rail trolleys, motor sleds. Animal mounts such as horses are not in canon and are not used |
| 5 | `drone` | 드론 / Drones | Remote-controlled flying or ground machine squads |
| 6 | `war-machine` | 장갑과 전쟁 기계 / Armour and War Machines | Armoured cars, tracked armoured trolleys, guns, restored old machines |
| 7 | `support` | 지원 / Support | Repair, first aid, nets, jamming, engineers |

### 2.2 Role strings

Use one of these `role` values that fits the category. The task 5 role icons read this value.

| `role` | ko | Categories | Meaning |
|---|---|---|---|
| `command` | 지휘 | commander | The army commander's escort |
| `champion` | 투사 | commander | Escort of an attached hero who is strong in duels |
| `line` | 전열 | infantry | The basic holding line |
| `shock` | 충격 | infantry, fast | Squads that hit hard to break a formation |
| `anti-armour` | 대장갑 | infantry, missile | Squads that kill armour and machines |
| `skirmish` | 산개 | missile, fast | Squads that spread out, shoot and pull back |
| `rifle` | 소총 | missile | Regular firearm shooters |
| `marksman` | 저격 | missile | A few precise shooters |
| `artillery` | 포격 | missile, war-machine | Indirect fire |
| `recon` | 정찰 | fast, drone | Sight and information |
| `raider` | 습격 | fast | Flank, rear and supply raids |
| `strike` | 타격 | drone | Suicide or drop attacks |
| `armour` | 장갑 | war-machine | Armoured hulls |
| `breacher` | 돌파 | infantry, support | Squads that open doors, barriers and blockades |
| `engineer` | 공병 | support | Repair and fortification |
| `medic` | 구호 | support | First aid |
| `countermeasure` | 대응 | support | Squads that stop drones with nets and jamming |

## 3. Tier rules

### 3.1 What a tier means

| Tier | What makes a unit this tier | Typical |
|---|---|---|
| 1 | Briefly gathered people with basic arms. Runs without any scarce input | Ledger conscripts, house levies |
| 2 | Squads in standing training, or common squads that use one scarce input | Rifle sections, contract spearmen |
| 3 | Skilled crews, rare equipment, first-stage implants. May carry a cap | Baptised breakers, workshop strike drones |
| 4 | Faction elite. Always capped, and badly weakened when its scarce input runs out | Guards, armoured cars, jamming teams |
| 5 | One or two per faction. Hard to replace once lost | Restored old war machines, top baptised fighters |

### 3.2 Leadership bands by tier

| Tier | `leadership` band | TW:WH reference |
|---|---|---|
| 1 | 35-60 | Tier 1 spearmen 60 ([Spearmen](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Spearmen_(The_Empire)&prop=text&format=json), [research B 4.3](../research/w2v-life-economy-rosters.md) row A), lowest 35 ([Zombies](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Zombies&prop=text&format=json)) |
| 2 | 50-70 | Tier 2 50-70 (rows B and C, [Crossbowmen](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Crossbowmen&prop=text&format=json) 50) |
| 3 | 60-80 | Tier 3 infantry and cavalry 75 (rows D and E, [Reiksguard](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Reiksguard&prop=text&format=json) 75) |
| 4 | 75-90 | Elite infantry 80-90 ([Swordmasters](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Swordmasters_of_Hoeth&prop=text&format=json) 80, [Chosen](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Chosen&prop=text&format=json) 85) |
| 5 | 70-100 | Top elites and heroes 70-100 ([verify-task-6](../../.omo/evidence/w2v/verify-task-6.md) calibration table; this tier attribution is inferred) |

The `war-machine` category and the `artillery` role may use 100 at any tier, because TW:WH artillery and armoured vehicles have 100 (rows F and G, [Steam_Tank](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Steam_Tank&prop=text&format=json) 100). Drone and war-machine leadership is the morale of the operators and crew. All other units keep their tier band, and only tier 5 uses 100.

### 3.3 Scarcity share

- **Tier 4-5 units make up at most 30% of one faction roster.** This is the same rule as the task 5 build check. The maximum count by roster size is 18 → 5, 20 → 6, 22 → 6, 24 → 7, 26 → 7 (`floor(0.30 x N)`).
- Each faction has 1-3 tier 5 units (the Free City has 0, section 9).
- `commander` rows use tiers 3-5 only. These rows count toward the tier 4-5 share.
- Recommended spread: tier 1 20-30%, tier 2 25-35%, tier 3 20-30%, tiers 4-5 15-30%.
- Roster size is 18-26 per faction.

## 4. Recruitment building chains

### 4.1 Common rules

- Buildings are built at stations. Station type comes from `map_station.degree`: `degree` 0 is an **isolated stop**, 1 a **terminus**, 2 an **ordinary station**, 3 or more an **interchange**. An isolated stop has no rail link (`line_ids` is an empty array) and, like an ordinary station, takes only buildings marked "any station". Counts in `data/sql/120-map-core.sql` on 2026-11-12: Government 157 stations (40 interchanges, 5 termini, 4 isolated), Free City 77 (19, 6, 0), Arc 78 (20, 5, 1). The five isolated stops are the two Daehyeonsan Reservoir Park monorail platforms and Metro Hotel in Jung-gu, Sinchon (underground) in Seodaemun-gu, and Saengtaegongwon-ap in Gangdong-gu.
- **Duchy seat station**: one per duchy. [pending] Default: the station with the highest `degree` in the district; ties go to the lower `sort`.
- Building stages open tiers. Stage 1 opens tiers 1-2, stage 2 tier 3, stage 3 tier 4, stage 4 (where present) tier 5. This is the default. When a building table's "opens" column differs, wider or narrower, the table always wins.
- A unit row's `recruit_building` is the name of the building stage that first opens that unit.
- The building names are new names coined by this document [frame]. They are not canon facility names. If the owner renames one, all three rosters change together.

### 4.2 Government

Basis: only people on the ledger are citizens (2.1 [approved]), and each district's Senator holds its duchy (2.1 [approved]). So levies start at the ledger and the elite come from the Senator's seat station.

| Chain | Stage | Building (en / ko) | Where | Opens |
|---|---|---|---|---|
| Levy | 1 | Levy Ledger Office / 징발 장부소 | Any Government station | Tier 1 infantry, missile |
| Levy | 2 | Ledger Drill Yard / 장부 연병장 | Interchange | Tier 2-3 infantry, tier 2 fast |
| Levy | 3 | Senate Guard Hall / 상원 근위청 | A Senator's duchy seat station (up to 14) | Tier 3-4 commander, tier 4 infantry |
| Arms | 1 | Firing School / 사격 교습소 | Any Government station | Tier 2 missile |
| Arms | 2 | Arms Repair Works / 병기 정비창 | Interchange | Tier 3 missile, tier 3 fast, tier 3 war-machine |
| Arms | 3 | State Gun Works / 국가 포창 | An interchange in Jongno-gu, Jung-gu or Yongsan-gu. 2 per faction | Tier 4 missile (artillery), tier 4 war-machine |
| Arms | 4 | State Vehicle Depot / 국가 차량고 | A Government terminus. 1 per faction | Tier 5 war-machine |
| Flight | 1 | State Flight Section / 국가 비행반 | Interchange, with an Arms Repair Works in the same duchy | Tier 3 drone |
| Flight | 2 | State Flight Command / 국가 비행 지휘소 | A duchy with a State Gun Works. 1 per faction | Tier 4 drone |
| Medical | 1 | Ledger Aid Post / 장부 의무소 | Any Government station | Tier 1-2 support |
| Medical | 2 | Ledger Field Hospital / 장부 야전 병원 | Interchange | Tier 3 support |

Jongno, Jung-gu and Yongsan are chosen because the map data puts the Government's core sites there (Cheongwadae, Government Complex Seoul, Seoul City Hall, the old Seoul Station building, the War Memorial; `map_landmark`).

### 4.3 Free City

Basis: the Free Cities are city-states, each holding its own duchy, with no king (2.2 [approved]). Most residents are engineers who trade goods and skills (2.2 [approved]). So troops come from contracts and workshops rather than from a state, and elite buildings exist once per city (duchy).

| Chain | Stage | Building (en / ko) | Where | Opens |
|---|---|---|---|---|
| Contract | 1 | Contract Hall / 계약 회관 | Any Free City station | Tier 1-2 infantry, missile |
| Contract | 2 | Company Exchange / 계약대 거래소 | Interchange | Tier 3 infantry, missile, commander |
| Contract | 3 | City Charter House / 도시 계약청 | A city's duchy seat station (up to 7) | Tier 4 infantry, commander |
| Workshop | 1 | Workshop Floor / 공방 조립장 | Any Free City station | Tier 2 drone, tier 2 missile |
| Workshop | 2 | Assembly Works / 조립 공장 | Interchange | Tier 3 drone, tier 3 support |
| Workshop | 3 | Signal Works / 신호 공방 | A city's duchy seat station | Tier 4 drone, tier 4 support (countermeasure) |
| Track | 1 | Track Shed / 궤도 정비고 | Terminus or interchange | Tier 2-3 fast |
| Track | 2 | Armoured Trolley Yard / 장갑 수레 차고 | Terminus. 2 per faction | Tier 3-4 war-machine |
| Guild | 1 | Guild Hall / 기술 조합 회관 | Any Free City station | Tier 1-2 support |
| Guild | 2 | Master Guild Hall / 장인 조합 회관 | Interchange | Tier 3 support (engineer, breacher) |

No Free City building opens tier 5. This gap is deliberate (section 9).

### 4.4 Arc

Basis: the Arc is the four Gangnam districts (2.3 [approved]), ruled by houses (2.3 [approved]), and its faithful replace body parts with machines, which is baptism (2.3 [approved]). So troops come from house musters and baptism. Sanctuaries, sealing and brains have no approved public scope (Q10-Q12), so they are not used in building names or conditions.

| Chain | Stage | Building (en / ko) | Where | Opens |
|---|---|---|---|---|
| House | 1 | House Muster Hall / 가문 집결소 | Any Arc station | Tier 1-2 infantry, missile, fast |
| House | 2 | House Guard Yard / 가문 호위 마당 | Interchange | Tier 3 infantry, commander, missile |
| House | 3 | House Seat Hall / 가문 본청 | An Arc duchy seat station (up to 4) | Tier 4 commander, infantry |
| Baptism | 1 | Baptism Training Hall / 세례 수련장 | Interchange | Tier 3 infantry, fast |
| Baptism | 2 | Baptism Guard Hall / 세례 호위청 | An Arc duchy seat station | Tier 4 infantry, fast |
| Baptism | 3 | Hierophant's Guard Hall / 교주 호위청 | 1 per faction | Tier 5 commander, infantry |
| Relic | 1 | Relic Machine Shed / 유물 기계고 | Terminus. 2 per faction | Tier 4-5 war-machine |
| Repair | 1 | House Repair Shop / 가문 정비소 | Any Arc station | Tier 1-2 support |
| Repair | 2 | Body Repair Hall / 몸 정비청 | Interchange | Tier 3 support |

"Hierophant" is Go Ye-jin's approved office (2.3 [approved]). Its station is [pending]; the default is one per faction with no fixed location.

### 4.5 Recruitment rate and building costs

| Item | Value | TW:WH reference |
|---|---|---|
| Squads one commander recruits per upkeep interval | 3 | 3 units per lord per turn ([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Recruitment&prop=wikitext&format=json)) |
| Movement of a recruiting commander | Cannot move | A recruiting lord cannot move ([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Recruitment&prop=wikitext&format=json)) |
| Recruitment time, tiers 1-2 | 1 upkeep interval | Common units 1 turn ([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Recruitment&prop=wikitext&format=json)) |
| Recruitment time, tier 3 | 2 upkeep intervals | Heavy infantry and cavalry 2 turns ([research B 4.3](../research/w2v-life-economy-rosters.md) rows E and F) |
| Recruitment time, tier 4 | 3 upkeep intervals | Armoured vehicle 3 turns (row G) |
| Recruitment time, tier 5 | 4 upkeep intervals | Monsters, artillery and similar up to 4 turns ([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Recruitment&prop=wikitext&format=json)) |
| Building stage 1 | Cost 750, 1 upkeep interval | Stage 1 750 gold, 1 turn ([The_Empire_buildings](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=The_Empire_buildings&prop=wikitext&format=json), [research B 4.5](../research/w2v-life-economy-rosters.md)) |
| Building stage 2 | Cost 1500, 2 upkeep intervals | Stage 2 1,500, 2 turns |
| Building stage 3 | Cost 2500, 3 upkeep intervals | Stage 3 2,500, 3 turns |
| Building stage 4 | Cost 4000, 4 upkeep intervals | The TW sample stops at stage 3. Stage 4 continues the same step [frame] |

- If one commander orders more than 3, the extra squads move to the next upkeep interval.
- Building costs use the same unit as a unit's `cost` (P13).

## 5. Cost, upkeep and caps

### 5.1 Cost bands by tier

| Tier | `cost` band | `upkeep` band | TW:WH reference |
|---|---|---|---|
| 1 | 150-350 | 30-105 | Tier 1 300 / 81 ([Spearmen](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Spearmen_(The_Empire)&prop=text&format=json), [research B 4.3](../research/w2v-life-economy-rosters.md) row A) |
| 2 | 350-700 | 70-210 | Tier 2 475-600 / 119-150 ([Crossbowmen](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Crossbowmen&prop=text&format=json) 475/119, rows B and C) |
| 3 | 700-1200 | 140-360 | Tier 3 850-1,200 / 225-300 (rows D, E, F) |
| 4 | 1200-2200 | 240-660 | Tier 4 2,100 / 525 (row G, [Steam_Tank](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Steam_Tank&prop=text&format=json)) |
| 5 | 2200-3200 | 440-960 | No TW tier 5 sample in the research. Continues above tier 4 [frame] |

- `upkeep` is 20-30% of `cost`. The TW:WH samples run at 24.8-27% ([Spearmen](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Spearmen_(The_Empire)&prop=text&format=json) 81/300 = 27%, [Steam_Tank](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Steam_Tank&prop=text&format=json) 525/2,100 = 25%); the band allows ±5 percentage points around that. The upkeep band ends are 20% and 30% of the cost band ends. The tier 5 top is 960, 30% of 3,200.
- Within a tier, units that use a scarce input sit in the upper half of the cost band.
- Free City contract units (`hired-company` tag) sit low in the cost band but use a 28-30% upkeep ratio: cheap to hire, expensive to keep.
- Arc house levies use a 20-22% upkeep ratio: the house feeds and clothes them.
- These two ratio adjustments are design adjustments for faction identity, not TW:WH numbers [frame].

### 5.2 Upkeep interval

Upkeep and scarce inputs are paid each campaign "upkeep interval". Tasks 19 and 18 (system design) set its length. This document does not.

### 5.3 `unit_cap` rules

`unit_cap` is the number of squads of that unit the whole faction may have at once (not per army).

| Condition | `unit_cap` | TW:WH reference |
|---|---|---|
| Tier 1-2, no scarce input | NULL (no cap) | n/a. Upkeep-paying TW factions have no caps ([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Recruitment&prop=wikitext&format=json)) |
| Tier 1-2 with a scarce input | NULL or 4-8 | n/a. Upkeep-paying TW factions have no caps ([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Recruitment&prop=wikitext&format=json)) |
| Tier 3 | NULL or 3-8 | n/a. Upkeep-paying TW factions have no caps ([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Recruitment&prop=wikitext&format=json)) |
| Tier 4 | 2-4 (required) | n/a. Upkeep-paying TW factions have no caps ([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Recruitment&prop=wikitext&format=json)) |
| Tier 5 | 1-2 (required) | n/a. Upkeep-paying TW factions have no caps ([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Recruitment&prop=wikitext&format=json)) |
| `drone` category | 2-6 (required) | n/a. Upkeep-paying TW factions have no caps ([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Recruitment&prop=wikitext&format=json)) |
| `irreplaceable` tag | 1 (required) | n/a. Upkeep-paying TW factions have no caps ([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Recruitment&prop=wikitext&format=json)) |

## 6. Scarce inputs

### 6.1 Vocabulary

`scarce_input` uses only these six strings.

| Value | ko | Meaning | Basis |
|---|---|---|---|
| `ammo` | 탄약 | Firearm rounds. Brass is reused; primers and propellant are the bottleneck | Bible section 1 row 15 [approved]: ammunition and parts are scarce, every round and every machine counts. Research A section 3 |
| `cells` | 전지 | Batteries and accumulators. Charging stops below freezing | Research A section 2.4 |
| `implants` | 이식 부품 | Spare parts and maintenance for cyberware | Bible section 1 row 14 [approved] |
| `fuel` | 연료 | Fuel for engines and generators | Bible section 1 row 15, "war equipment" |
| `parts` | 기계 부품 | Spare parts for machines and drones | Bible section 1 row 15 [approved] |
| `medicine` | 의약품 | Antibiotics and first-aid drugs | Research A section 2.1 (infection care) |

### 6.2 Units that must carry a value

| Rule | Condition | Required value |
|---|---|---|
| Scarce-1 | `category` is `drone` | includes `cells` |
| Scarce-2 | `attributes` has `baptised` or `wired-body` | includes `implants` |
| Scarce-3 | the `ammo` column is not NULL, `category` is not `drone`, and `attributes` lacks `muscle-powered` (units with firearms or guns; a drone's `ammo` is its sorties) | includes `ammo` |
| Scarce-4 | `category` is `war-machine` | includes `fuel` or `cells` |
| Scarce-5 | `role` is `medic` | includes `medicine` |

Units matching no condition use NULL. Values are set in this order, which gives exactly one value for any unit.

1. Find every rule that matches, in order Scarce-1 to Scarce-5. The priority is Scarce-1 > Scarce-2 > Scarce-3 > Scarce-4 > Scarce-5.
2. Each matching rule gives one value. Scarce-4's value depends on the faction: `fuel` for the Government and the Arc, `cells` for the Free City. Every other rule has the single value in the table.
3. If a value appears twice, keep only the higher-priority one.
4. The highest-priority value is the main input and comes first. A second value, if any, follows the comma.
5. If there is only one value and `category` is `drone` or `war-machine`, add `parts` as the second value: machines do not run without spare parts.
6. With three or more values, keep the top two by priority. So a matching Scarce-1 to Scarce-3 value is never dropped unless more than two of them match. Do not make units that match both Scarce-1 and Scarce-2 (a drone that is also an implant squad).

Examples: a Government armoured car with a gun matches Scarce-3 (`ammo`) and Scarce-4 (`fuel`), giving `ammo,fuel`; without a gun it is `fuel,parts`. A Free City armoured trolley with a gun is `ammo,cells`, without a gun `cells,parts`. A Free City drone matches only Scarce-1 (`cells`), so by step 5 it is `cells,parts`. A unit matching no rule (e.g. a hand-pumped rail trolley) is always NULL. An Arc baptised shooter matches Scarce-2 (`implants`) and Scarce-3 (`ammo`), giving `implants,ammo`. The task 5 build check tests Scarce-1 and Scarce-2.

### 6.3 How scarcity is felt in play

- **Faction stockpile.** A faction holds a stockpile of each of the six inputs. Each squad with a scarce input spends 1 of its main input per upkeep interval.
- **Battle use.** When such a squad fights (auto and manual battle alike) it spends 1 more of its main input. Rounds fired are refilled from the stockpile after battle; refilling one squad costs 1 `ammo`.
- **Running out.** At zero stockpile:

| Input | Effect at zero | TW:WH reference |
|---|---|---|
| `ammo` | Starting ammunition in the next battle is 25% of `ammo` (rounded up) | n/a. TW ammunition refills every battle ([Ammunition](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Ammunition&prop=wikitext&format=json)). The scarcity rule is a design addition [frame] |
| `cells` | Drone squads cannot deploy. Other squads lose tag effects that need `cells` | n/a. No TW counterpart resource |
| `implants` | `baptised` and `wired-body` squads lose 20% melee attack and melee defence and 10 leadership, and stop replenishing | n/a. No TW counterpart resource |
| `fuel` | Engine units move at half speed. War machines that move only by engine cannot deploy | n/a. No TW counterpart resource |
| `parts` | Machines and drones do not heal between battles and lost airframes or hulls are not replaced | n/a. No TW counterpart resource |
| `medicine` | People squads replenish at half rate. Wounded do not return after battle | n/a. No TW counterpart resource |

- **Visible.** The recruitment and army screens show the input icon and the number of intervals left (screen design is task 18). The player chooses between one more elite unit and a longer stockpile.
- **A different bottleneck per faction.** The Government burns `ammo` and `fuel`, the Free City `cells` and `parts`, the Arc `implants`. This ties into the identity matrix in section 9.

## 7. Attribute tags

All names are coined by this document. No attribute name from another game is used. `attributes` holds only the ids.

| id | ko | en | Effect |
|---|---|---|---|
| `ledger-levy` | 장부 징발 | Ledger levy | When this squad flees or breaks, friendly squads without `ledger-levy` lose no morale |
| `house-bound` | 가문 결속 | House-bound | +5 morale while a same-faction `commander` squad in the same army is alive |
| `hired-company` | 계약 용병 | Hired company | −10 leadership each upkeep interval in which the faction treasury is negative. At 0 the contract ends and the squad leaves the army |
| `charge-breaker` | 돌격 막이 | Charge breaker | Cancels the charge effect of `fast` squads hitting it from the front, and gains +10 melee attack against them |
| `shield-line` | 방패줄 | Shield line | −30% missile damage taken from the front |
| `plate-biter` | 쇠뚫이 | Plate biter | Half of its melee damage ignores the target's armour |
| `machine-hunter` | 기계 사냥 | Machine hunter | +12 melee attack and +25% missile damage against `war-machine` and `drone` |
| `net-casting` | 그물치기 | Net casting | Enemy drones inside its range deal −50% damage when attacking. Two nets per battle |
| `static-veil` | 잡음 장막 | Static veil | Radio-controlled drones within 120 m cannot attack. Needs `cells` |
| `fibre-guided` | 줄조종 | Fibre-guided | Unaffected by `static-veil`. Its range is already in `range` |
| `radio-linked` | 전파 조종 | Radio-linked | Cannot attack inside a `static-veil`. Put on every wireless drone |
| `frost-hardened` | 혹한 단련 | Frost-hardened | No fatigue on surface maps (surface ruins, Han River crossings) |
| `thin-clad` | 얇은 차림 | Thin-clad | Double fatigue on surface maps. Pairs with the section 11 clothing rule |
| `tunnel-fighter` | 굴길 싸움 | Tunnel fighter | +8 melee defence on tunnel and small-station maps |
| `rail-borne` | 궤도 기동 | Rail-borne | +30% speed on track, −50% off track |
| `quiet-step` | 발소리 죽이기 | Quiet step | Stays in ambush while moving |
| `scout-deploy` | 선발 배치 | Scout deploy | May deploy ahead of the deployment zone |
| `roll-call` | 호명 | Roll call | +4 morale to friendly squads within 40 m. Does not stack with the commander effect; the larger applies. +4 is the TW:WH encourage value ([Encourage](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Encourage&prop=wikitext&format=json)). The 40 m radius has no TW number and stays [pending] |
| `field-repair` | 현장 수리 | Field repair | Heals nearby friendly machines and drones in battle. Does not restore lost airframes. Needs `parts` |
| `field-dressing` | 응급 처치 | Field dressing | Turns part of the post-battle deaths of nearby people squads into wounds. Never revives the dead (GDD relief rule) |
| `breach-charge` | 문 따기 | Breach charge | x3 damage to doors, barriers and blockade works |
| `baptised` | 세례받은 몸 | Baptised body | A squad that has received the Arc's baptism. Needs `implants`. Takes the section 6.3 shortage effects |
| `wired-body` | 기계 이식 | Wired body | A cyberware squad outside the Arc. Needs `implants`. Takes the section 6.3 shortage effects |
| `iron-dread` | 쇠울림 | Iron dread | −8 morale to enemy tier 1-2 squads in melee with it |
| `last-to-leave` | 끝까지 남는 자 | Last to leave | Never flees while its army's commander lives. After the commander dies it tests like any other squad |
| `skilled-crew` | 숙련 조원 | Skilled crew | Faster reloading and handling. +25% starting ammunition (rounded up) |
| `hand-loaded` | 재장전 탄 | Hand-loaded | Cheap rounds: battle use costs half the usual `ammo`, but −10% missile damage |
| `muscle-powered` | 근력 사격 | Muscle-powered | Non-firearm shooting (crossbow, sling, thrown). Not caught by Scarce-3 |
| `irreplaceable` | 다시 못 만드는 것 | Irreplaceable | When lost, that unit's `unit_cap` drops by 1 permanently |

Tag combination rules:

- `radio-linked` and `fibre-guided` are never used together. Every drone has exactly one of them.
- `frost-hardened` and `thin-clad` are never used together.
- `baptised` is Arc only; `wired-body` is for factions other than the Arc. `ledger-levy` is Government only, `house-bound` Arc only, `hired-company` Free City only.

## 8. Counter design

### 8.1 Rules

- Every category beats at least two categories and loses to at least two (table 8.2).
- Every faction must have at least one answer to every category the other factions field. A faction with an empty category answers with tags. Example: the Arc has no drones and answers drones with `net-casting` support squads.
- At the same tier, a unit beats another on one axis only. Do not pile high numbers on every axis. Only tiers 4-5 may have two axes.
- Expensive units lose to cheap answers. For every tier 4-5 war machine, another faction must have at least one tier 2-3 answer (`plate-biter`, `machine-hunter`, `breach-charge`, strike drones).

### 8.2 Category counter matrix

Rows attack, columns receive. `+` favourable, `−` unfavourable, `=` even, `T` depends on tags.

| Attacker \ target | commander | infantry | missile | fast | drone | war-machine | support |
|---|---|---|---|---|---|---|---|
| commander | = | + | − | = | T | − | + |
| infantry | − | = | + | + | − | − | + |
| missile | + | + | = | − | T | − | = |
| fast | = | − | + | = | + | − | + |
| drone | + | = | + | − | = | + | − |
| war-machine | + | + | + | = | − | = | − |
| support | − | − | = | − | + | + | = |

How to read it:

- Infantry stops the charge of fast units (`charge-breaker`) and catches missile and support squads. It is weak to armour and drones.
- Missile units shoot infantry and commander escorts well. Fast units catch them from behind and they cannot pierce armour. Against drones it depends on tags such as `net-casting` and `machine-hunter`.
- Fast units raid missile units, support units and drone operator posts. They lose to formed infantry and armour.
- Drones hit armour from above and find missile units and commanders. They lose to support nets and static veils and to fast raids.
- War machines press infantry, missile units and commanders. They lose to drones and to engineer (support) breaching.
- Support is the answer to drones and war machines. It loses to squads that fight directly.

### 8.3 How to fill `counters`

- `counters` lists 1-4 `id`s of units this unit is good against. List only units of a category marked `+` in table 8.2.
- Pointing at other factions' `id`s is the norm. But tasks 13-15 run in parallel. So each roster first fills `counters` with its own faction's `id`s and passes the build check. Free Cities fight each other, houses fight houses, and Senators fight Senators, so own-faction `id`s are meaningful. After all three rosters merge, the roster task that merges last adds at least one cross-faction `id` per unit. [pending] The orchestrator names that integrator.

## 9. Faction identity matrix

Target roster size is 18-26 units per faction. The "category counts" below are the ranges tasks 13-15 must keep. 0 is a deliberate gap.

### 9.1 Category counts

| Category | Government | Free City | Arc |
|---|---|---|---|
| `commander` | 2-3 | 1-2 | 3-4 |
| `infantry` | 6-8 | 3-5 | 7-9 |
| `missile` | 4-6 | 4-6 | 2-3 (tier 3 or lower) |
| `fast` | 1-2 | 2-4 | 2-3 |
| `drone` | 1-2 | 3-4 | 0 |
| `war-machine` | 3-4 | 2-3 (tier 4 or lower) | 1-2 (`irreplaceable` only) |
| `support` | 1-2 | 3-4 | 2-3 |

### 9.2 Strengths and deliberate gaps

| Faction | Identity | Strengths | Deliberate gaps | Canon basis |
|---|---|---|---|---|
| Government | Modern-feudal combined arms: the numbers of ledger conscripts and remnant modern arms | Many cheap conscript infantry. Guns and armoured cars. A small state flight section. Senate guards | **No implant units** (`wired-body` 0). **No mercenaries.** Thin support and field repair (support 1-2). Low morale for tier 1-2 conscripts | Only people on its ledger are citizens (2.1) → it does not hire people off the ledger for money. Scarcity made work hereditary and froze a vertical hierarchy (section 1 row 12) → a wide morale gap between conscripts and guards. Cyberware depends on access to maintenance and to the faction that holds it (section 1 row 14) → the Government is neither the engineer community (Free City) nor the baptised community (Arc), so it fields no implant units [frame] |
| Free City | Engineer-guild city-states: contract mercenaries and skilled crews | Drones and jamming. Field repair and engineers. Rail mobility. Skilled shooters | **No ledger-style mass levy** (at most 1 tier 1 infantry). **No tier 5.** Heavy armour stops at tier 4. Few commander escorts (1-2) | City-states, not one power, with no king (2.2) → no power to levy people across cities. They could not even choose a leader (2.2, chapter 1 quote) → few command units to bind one army. Most residents are engineers (2.2) → strong in drones, repair and engineering |
| Arc | Clan hierarchy and baptised implant warriors | Baptised melee infantry across tiers 1-5. High morale. Many commander escorts. Restored old machines | **No drones** (0). **No artillery** (`artillery` 0). Few missile units, capped at tier 3. Only four districts, so the roster is small (18-22) | Faith is counted by the number of implanted parts (2.3) → resources go into bodies. House rule (2.3) → many house escorts and high morale. Four Gangnam districts (2.3) → the smallest production base. No drones and no artillery is a design choice drawn from this basis [frame] |

### 9.3 Scarcity bottleneck per faction

| Faction | Main inputs | Pressure in play |
|---|---|---|
| Government | `ammo`, `fuel` | The more guns and armoured cars it runs, the faster rounds and fuel run dry |
| Free City | `cells`, `parts` | Drones and repair tie up cells and parts; cells weaken on the cold surface |
| Arc | `implants`, `medicine` | Baptised elites are strong, but when implant parts stop, the whole elite falls apart |

## 10. D3 command rules

### 10.1 Principle [approved]

- Owner decision D3: "전투 방식은 토탈워랑 동일하게 지휘관이 모든 분대의 지휘권한을 갖음".
- One army has one commander. The commander commands every squad in the army. Squads have no authority to act on their own (2.5).

### 10.2 Commanders and heroes

- The commander is a named hero from the people ledger, matching the GDD rule that an `ExpeditionSquad` needs one formal hero commander.
- The commander deploys with one `commander` category escort squad. Each attached hero also deploys with one `commander` escort squad. Heroes are not counted in `squad_size` (GDD `SoldierSquad`).
- Heroes are command targets but are not controlled directly (GDD: direct hero action control is out of scope).

### 10.3 Squad limit and orders

- **[frame][pending] An army holds at most 20 slots.** The commander escort takes one slot, and each attached hero (with escort) takes one. This follows D3's "the same as Total War" and the 2026-11-12 owner instruction ("전투 기준 값은 알려진 워해머 토탈워 정보를 기준으로 로스터 잡아서 작업 합니다"). A TW:WH army is 1-20 units led by one lord ([Armies](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Armies&prop=wikitext&format=json)). It conflicts with the GDD `hero-squads-and-time-based-movement` rule of no fixed squad cap, so it waits for owner confirmation (section 13).
- The orders are the four the GDD defines: move, attack target, fire, ambush. Deployment and formation are set before battle.
- A squad in melee takes no new orders until that melee ends (GDD).
- Retreat is an order to the whole battle, not to a squad (GDD).
- **No command range.** The commander orders every squad instantly wherever it is on the field. This matches GDD SP-1.0.0: a player who is the battle commander directly controls every battle-map squad attached to the command.
- **There is a presence radius.** [frame][pending] Friendly squads within 50 m of the commander's escort squad gain a morale bonus, default +8. This is a morale effect range, not an order range. TW:WH lords have a morale aura, but its radius and value are not published ([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Leadership&prop=wikitext&format=json), [verify-task-6](../../.omo/evidence/w2v/verify-task-6.md)), so 50 m and +8 have no TW number and stay [pending].

### 10.4 Morale and rout

| State | Condition [frame][pending] | Result | TW:WH reference |
|---|---|---|---|
| Steady | Current morale > 25% of base leadership | Follows orders | n/a |
| Wavering | Current morale ≤ 25% of base leadership | Takes orders but −10 melee attack | A wavering state exists ([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Leadership&prop=wikitext&format=json)). 25% and −10: No TW number; stays [pending] |
| Fleeing | Current morale ≤ 0 | Takes no orders and runs for the exit. Can rally once safe | Routed units can rally once safe ([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Leadership&prop=wikitext&format=json)) |
| Shattered | The fourth break in one battle: a squad that has fled three times shatters when it breaks again | Never rallies | A unit that has routed three times shatters the next time its leadership breaks ([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Leadership&prop=wikitext&format=json)) |

- Morale loss causes are the GDD's: wounds, friendly deaths, knockouts and flights, and events affecting the commander. Add flank and rear attacks, fatigue and fear tags (`iron-dread`). The list matches TW:WH ([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Leadership&prop=wikitext&format=json): encirclement and flank attacks, charges, lord death, fear, fatigue, damage).
- A fleeing squad costs friendly squads within 30 m −5 morale. Fleeing `ledger-levy` squads cost nothing. Flights hurting neighbours and the expendable exception exist in TW:WH ([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Leadership&prop=wikitext&format=json), [Units](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Units&prop=wikitext&format=json)). 30 m and −5: No TW number; stays [pending].
- **Army collapse.** When half or more of the squads (by count) are fleeing, shattered or destroyed, all remaining squads take −15 morale and cannot rally while that holds. When every squad flees, the battle ends in the GDD "morale rout". TW:WH also has a stage where an army that has lost many units wavers as a whole ([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Leadership&prop=wikitext&format=json)). Half and −15: No TW number; stays [pending].
- Every number except the shatter rule is [pending]. The GDD leaves the fear test and rout thresholds open. Task 19 settles them together with the GDD rule version.

### 10.5 When the commander dies

1. **Shock.** Every squad immediately takes −20 morale, regardless of distance. Squads within 50 m take another −10. The presence bonus ends. In TW:WH a lord's death lowers leadership and can rout the army ([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Leadership&prop=wikitext&format=json), [Armies](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Armies&prop=wikitext&format=json)). −20, −10 and 50 m: No TW number; stays [pending].
2. **Rout cascade.** Squads pushed to 0 morale or below by the shock flee, and those flights cost their neighbours morale per section 10.4.
3. **Temporary squad leader.** If the commander's escort survives, one of its soldiers becomes the temporary squad leader (`TemporaryLeader`); otherwise a soldier from the remaining squad with the highest base leadership does. Per the GDD, the temporary leader can give the same orders as a formal commander but with weaker command effects. [frame][pending] Default: no presence bonus, no class or campaign role of a formal hero, and no hero portrait or class marker (GDD UI contract).
4. **Attached hero.** An attached hero does not take over command. Command goes to the temporary squad leader of step 3 (GDD temporary squad leader rule). The attached hero keeps only its own roll-call effect of +4 (the same value as `roll-call`; it does not stack, the larger applies). TW:WH has no in-battle hero succession either; a new lord is recruited after the battle ([Armies](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Armies&prop=wikitext&format=json), [Encourage](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Encourage&prop=wikitext&format=json)).
5. If the commander is knocked out or badly wounded and leaves the battle, use the same steps with the shock reduced to −10.
6. The commander's life, wounds and capture stay on the person ID (RBATTLE-08, RBATTLE-09). Capture is decided in post-battle custody processing.

### 10.6 Heroes, duels and personal resolution

- **When a duel opens.** When two heroes from different armies (with their escorts) enter melee, the two heroes duel. Their escort soldiers fight through aggregate resolution.
- **Duel resolution.** The duel uses the GDD personal-resolution battle: the attacker's weapon, the defender's armour, the two people's combat skill difference, their physical state and mood (RBATTLE-24). [pending] Default: the person's Prowess is the combat skill input. The GDD formula is still open.
- **How the duel result feeds the mass battle.**

| Result | Loser | Winner | TW:WH reference |
|---|---|---|---|
| Death | A commander triggers all of section 10.5. An attached hero costs every squad of its army −8 morale | +10 morale to friendly squads within 50 m | Hero death lowering morale exists in TW ([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Leadership&prop=wikitext&format=json)). −8, +10 and 50 m: No TW number; stays [pending] |
| Knocked out or badly wounded | Leaves the battle. A commander triggers section 10.5 (shock −10) | +6 morale to friendly squads within 50 m | +6 and 50 m: No TW number; stays [pending] |
| Withdraws | The hero drops back behind its escort; the escort takes −10 morale | No change | −10: No TW number; stays [pending] |

- **No double counting.** Duel damage applies only to the two heroes. Escort losses come only from aggregate resolution. The same attack is not entered in both channels (GDD no-double-damage rule).
- **Command ability.** [pending] Default: the commander's Martial sets the size of the presence bonus: +4 + floor(Martial / 4), at most +12. TW:WH does not publish the lord aura value, so this formula has no TW number and stays [pending]. The GDD leaves the squad size formula ("the commander's own skill" input) open, so this document does not set it. How the 511 people without detailed records get stats is Q17.

## 11. Names and appearance

### 11.1 Naming rules

- `name` is plain functional English in Title Case. `name_ko` is plain Korean. Example: Ledger Levy Spears / 장부 징발 창병.
- Pattern: [origin marker] + [weapon or function] + [squad word]. Markers differ by faction: Government uses Ledger, Senate, State; Free City uses Contract, Workshop, Guild, Rail/Track; Arc uses House, Baptised, Hierophant's, Relic.
- Never use: real brands, companies or weapon model names; unit or attribute names from other games; any entry of the bible section 4 forbidden vocabulary table; words that evoke clergy or monastic orders for Arc units; titles not yet approved (the proposed titles of bible 9.1, section 13).
- Free City mercenaries are called "contract company" (계약대) or "contract soldiers" (계약병).

### 11.2 Equipment text (`equipment`)

- One to three sentences: main weapon, protection, then gear that depends on a scarce input.
- Show scarcity. Examples: "a sack for recovered brass", "hand-reloaded rounds", "a barrel fitted from stripped parts", "a cell pouch warmed against the body".
- Name firearm types only (bolt-action rifle, submachine gun, light machine gun, mortar), never models.
- Name implants by body part and function only (arm, leg, hand, eye, back). Do not coin individual part names (bible section 1 row 14).

### 11.3 Appearance text (`appearance`)

Follow the GDD art direction.

- The silhouette is 1940s Second World War clothing (`character-art-direction.json:142`): greatcoats, quilted cotton jackets, puttees, felt boots, ear-flap caps, gas-mask bags.
- Winter continues (`:144`, bible section 1 row 4, eternal winter). Every unit wears winter clothing.
- Thickness rises with surface exposure and falls with tier (`:149`).

| Group | Layer count |
|---|---|
| Tier 1-2, often on the surface | 4-5 layers: quilted jacket, over-trousers, felt boots, ear-flap cap |
| Tier 1-2, mostly underground | 3-4 layers |
| Tier 3 | 3 layers, a fitted coat |
| Tier 4-5 | 1-2 layers, a thin tailored coat or short jacket |
| Surface recon and mobile roles (`recon`, `raider`, `frost-hardened`) | +1-2 layers regardless of tier |

- When a tier 4-5 or `baptised` squad wears thin clothing, also give it the `thin-clad` tag. `frost-hardened` squads wear thick clothing.
- Faction colour appears only on sashes, armbands and piping: Government `#426f99`, Free City `#567b46`, Arc `#b54b4b` (`faction.color`).
- Worn cloth, mended spots, patches and gear of mixed origin show scarcity. Elite units are less worn.

## 12. Worked examples

**These are examples of the rules, not roster rows.** Tasks 13-15 do not copy them verbatim, though they may reuse the names and `id`s. Only tiers 1-3 were picked so that two examples per faction also keep the section 3.3 share.

### Example Government-1

| Column | Value |
|---|---|
| id | government-ledger-levy-spears |
| faction_id | government |
| sort | 30 |
| name | Ledger Levy Spears |
| name_ko | 장부 징발 창병 |
| category | infantry |
| role | line |
| tier | 1 |
| recruit_building | Levy Ledger Office |
| recruit_building_ko | 징발 장부소 |
| cost | 220 |
| upkeep | 55 |
| unit_cap | NULL |
| scarce_input | NULL |
| squad_size | 60 |
| hp | 69 |
| melee_attack | 20 |
| melee_defence | 34 |
| weapon_strength | 25 |
| armour | 15 |
| missile_damage | NULL |
| range | NULL |
| ammo | NULL |
| speed | 30 |
| leadership | 45 |
| attributes | ["ledger-levy","charge-breaker"] |
| counters | ["free-city-rail-trolley-raiders"] |
| equipment | Long spears cut from scaffold pipe, and a tin helmet; one spare pair of felt-boot liners per squad. |
| equipment_ko | 비계 파이프를 잘라 만든 긴 창과 양철 철모를 든다. 분대마다 펠트 장화 속감 한 벌을 여벌로 둔다. |
| appearance | Five layers: quilted cotton jacket over a coarse greatcoat, padded over-trousers, felt boots and an ear-flap cap, with a blue-grey ledger armband. |
| appearance_ko | 다섯 겹이다. 거친 외투 위에 누빔 솜옷, 솜 덧바지, 펠트 장화, 귀덮개 모자를 쓰고 청회색 장부 완장을 찬다. |
| gdd_ref | NULL |

### Example Government-2

| Column | Value |
|---|---|
| id | government-remnant-riflemen |
| faction_id | government |
| sort | 50 |
| name | Remnant Riflemen |
| name_ko | 잔존 소총반 |
| category | missile |
| role | rifle |
| tier | 2 |
| recruit_building | Firing School |
| recruit_building_ko | 사격 교습소 |
| cost | 560 |
| upkeep | 145 |
| unit_cap | NULL |
| scarce_input | ammo |
| squad_size | 30 |
| hp | 69 |
| melee_attack | 16 |
| melee_defence | 17 |
| weapon_strength | 24 |
| armour | 18 |
| missile_damage | 22 |
| range | 145 |
| ammo | 14 |
| speed | 33 |
| leadership | 50 |
| attributes | ["shield-line"] |
| counters | ["arc-house-levy-hooks"] |
| equipment | Bolt-action rifles of mixed origin and a sack for recovered brass; each rifleman draws a counted handful of rounds before battle. |
| equipment_ko | 출처가 제각각인 볼트식 소총과 회수한 탄피를 담는 자루를 든다. 사수마다 전투 전에 센 만큼의 탄을 받는다. |
| appearance | Four layers: a long greatcoat over a quilted jacket, puttees over felt boots, a field cap under a hood, and a blue-grey collar stripe. |
| appearance_ko | 네 겹이다. 누빔 솜옷 위에 긴 외투를 입고 펠트 장화에 각반을 감았으며 두건 아래 야전모를 쓰고 깃에 청회색 줄을 단다. |
| gdd_ref | NULL |

### Example Free City-1

| Column | Value |
|---|---|
| id | free-city-workshop-strike-drones |
| faction_id | free-city |
| sort | 60 |
| name | Workshop Strike Drones |
| name_ko | 공방 타격 비행조 |
| category | drone |
| role | strike |
| tier | 3 |
| recruit_building | Assembly Works |
| recruit_building_ko | 조립 공장 |
| cost | 1000 |
| upkeep | 250 |
| unit_cap | 4 |
| scarce_input | cells,parts |
| squad_size | 6 |
| hp | 60 |
| melee_attack | 10 |
| melee_defence | 6 |
| weapon_strength | 18 |
| armour | 0 |
| missile_damage | 120 |
| range | 400 |
| ammo | 2 |
| speed | 85 |
| leadership | 60 |
| attributes | ["radio-linked","skilled-crew"] |
| counters | ["government-remnant-riflemen"] |
| equipment | Six small rotor airframes rebuilt from salvaged motors, each carrying one drop charge; the crew keeps the cells warm in padded pouches against their bodies. |
| equipment_ko | 회수한 모터로 다시 짠 소형 회전익 기체 여섯 대가 각각 투하 폭약 하나를 단다. 조종조는 전지를 솜 주머니에 넣어 몸에 품고 데운다. |
| appearance | The crew wear three layers: a fitted quilted coat, knitted hood and goggles, with green piping and a tool roll on the hip. |
| appearance_ko | 조종조는 세 겹이다. 몸에 맞춘 누빔 외투와 뜨개 두건, 보안경을 쓰고 녹색 선두름과 허리 공구 말이를 단다. |
| gdd_ref | NULL |

### Example Free City-2

| Column | Value |
|---|---|
| id | free-city-rail-trolley-raiders |
| faction_id | free-city |
| sort | 45 |
| name | Rail Trolley Raiders |
| name_ko | 궤도 수레 습격대 |
| category | fast |
| role | raider |
| tier | 2 |
| recruit_building | Track Shed |
| recruit_building_ko | 궤도 정비고 |
| cost | 600 |
| upkeep | 150 |
| unit_cap | NULL |
| scarce_input | NULL |
| squad_size | 16 |
| hp | 110 |
| melee_attack | 30 |
| melee_defence | 20 |
| weapon_strength | 30 |
| armour | 20 |
| missile_damage | NULL |
| range | NULL |
| ammo | NULL |
| speed | 70 |
| leadership | 55 |
| attributes | ["rail-borne","quiet-step"] |
| counters | ["government-remnant-riflemen"] |
| equipment | Hand-pumped rail trolleys with hooked boarding poles and short axes; the pump needs no fuel. |
| equipment_ko | 손으로 펌프질하는 궤도 수레에 갈고리 장대와 짧은 도끼를 싣는다. 펌프는 연료가 들지 않는다. |
| appearance | Four layers for the tunnels: a short quilted jacket, padded trousers, felt boots with rubber overshoes and a knitted cap with a green band. |
| appearance_ko | 터널용 네 겹이다. 짧은 누빔 웃옷, 솜바지, 고무 덧신을 신은 펠트 장화, 녹색 띠를 두른 뜨개 모자를 쓴다. |
| gdd_ref | NULL |

### Example Arc-1

| Column | Value |
|---|---|
| id | arc-house-levy-hooks |
| faction_id | arc |
| sort | 30 |
| name | House Levy Hooks |
| name_ko | 가문 징집 갈고리병 |
| category | infantry |
| role | line |
| tier | 1 |
| recruit_building | House Muster Hall |
| recruit_building_ko | 가문 집결소 |
| cost | 200 |
| upkeep | 42 |
| unit_cap | NULL |
| scarce_input | NULL |
| squad_size | 50 |
| hp | 72 |
| melee_attack | 24 |
| melee_defence | 24 |
| weapon_strength | 26 |
| armour | 12 |
| missile_damage | NULL |
| range | NULL |
| ammo | NULL |
| speed | 34 |
| leadership | 45 |
| attributes | ["house-bound","charge-breaker"] |
| counters | ["free-city-rail-trolley-raiders"] |
| equipment | Long hooked poles for pulling riders off trolleys and sleds, and a short blade; no firearms. |
| equipment_ko | 수레와 썰매에서 사람을 끌어내리는 긴 갈고리 장대와 짧은 칼을 든다. 화기는 없다. |
| appearance | Four layers: a quilted coat with a red house sash, padded trousers, felt boots and a hood tied under the chin. |
| appearance_ko | 네 겹이다. 붉은 가문 띠를 두른 누빔 외투, 솜바지, 펠트 장화를 입고 턱 밑에서 묶는 두건을 쓴다. |
| gdd_ref | NULL |

### Example Arc-2

| Column | Value |
|---|---|
| id | arc-baptised-breakers |
| faction_id | arc |
| sort | 40 |
| name | Baptised Breakers |
| name_ko | 세례 돌파병 |
| category | infantry |
| role | shock |
| tier | 3 |
| recruit_building | Baptism Training Hall |
| recruit_building_ko | 세례 수련장 |
| cost | 1100 |
| upkeep | 275 |
| unit_cap | 4 |
| scarce_input | implants |
| squad_size | 20 |
| hp | 120 |
| melee_attack | 48 |
| melee_defence | 34 |
| weapon_strength | 55 |
| armour | 55 |
| missile_damage | NULL |
| range | NULL |
| ammo | NULL |
| speed | 34 |
| leadership | 70 |
| attributes | ["baptised","plate-biter","thin-clad","iron-dread"] |
| counters | ["government-remnant-riflemen"] |
| equipment | Heavy breaching hammers swung by machine-replaced arms; each warrior carries a small kit of spare joints for the replaced parts. |
| equipment_ko | 기계로 바꾼 팔로 무거운 돌파 망치를 휘두른다. 전사마다 바꾼 부위에 맞는 예비 관절 꾸러미를 지닌다. |
| appearance | Three thin layers: a knitted undershirt, a fitted coat left open at the replaced arm, and a red sash; the metal of the arm shows at the cuff. |
| appearance_ko | 얇은 세 겹이다. 뜨개 속옷 위에 바꾼 팔 쪽을 터 놓은 맞춤 외투와 붉은 띠를 두르고, 소매 끝으로 팔의 쇠가 보인다. |
| gdd_ref | NULL |

The examples' `counters` point at other factions' examples to show the counter rules. Real rosters follow the section 8.3 order.

Example check: all six rows keep the section 1.2 ranges and range-by-role rule, section 1.3 squad bands, section 1.4 health and speed bands, section 3.2 leadership bands, section 5.1 cost bands and upkeep ratio, section 5.3 caps and section 6.2 scarcity rules (values and order). Infantry health 69 is the TW:WH tier 1 spearman per-model health, and the riflemen 145/22/14/50 follow the TW:WH gunpowder infantry (Handgunners) range, total missile damage and tier 2 leadership. Each faction has 0 tier 4-5 examples.

## 13. Owner-pending list

These items have no owner answer and use provisional defaults. A default is not an approval. When an answer arrives, this document and the three rosters change together.

| # | Item | Bible question or source | Provisional default here |
|---|---|---|---|
| P1 | Titles used in building and unit names | Q1 (title ladder, 9.1) | Only approved titles (Senator, Duke of Gwanak, Hierophant) and plain words (house, contract, ledger). No proposed titles such as stationmaster or clan-head |
| P2 | Public scope of Arc unit text | Q10, Q11, Q12 | Only the approved fact that baptism replaces body parts with machines. No sanctuary, offering chamber, sealing, brains or the raising of machines outside Seoul in unit text or building conditions |
| P3 | Name of the Arc roll of the faithful | Q13 | No roll name in unit text |
| P4 | Depiction of implant surgery | Q14 | No surgery scenes; only the look of parts already replaced |
| P5 | Intelligence AI and the First AI | Q15 | Not tied to any unit |
| P6 | Hero stats in duels and command | Q17, section 8 | Prowess → duel skill input; Martial → presence bonus (+4 + floor(Martial/4), at most +12) |
| P7 | Jo Jaepyo's title and Free City mercenary naming | Q20 | Mercenaries are "contract company" / "contract soldiers". No forbidden vocabulary |
| P8 | Im Ha-jun (pump technology) and Arc technical units | Q22 | No unit is tied to a specific person |
| P9 | Ryu Eun-bi's "medical corps" and the Government medical chain | Q27 | The chain is named Ledger Aid Post / Ledger Field Hospital and is not tied to the medical corps |
| P10 | 20-slot army limit | D3 and the 2026-11-12 owner instruction, against the GDD `hero-squads-and-time-based-movement` rule of no fixed cap | 20 slots (commander escort included, one slot per attached hero). The number comes from the TW:WH army of 1-20 units ([Armies](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Armies&prop=wikitext&format=json)) per the owner instruction. Only the GDD conflict remains; task 19 also proposes the GDD amendment |
| P11 | Wavering threshold, presence radius and value, commander death shock, flight spread, army collapse threshold, duel result morale, roll-call radius, `iron-dread` value | The GDD leaves the numbers open. TW:WH does not publish these numbers either ([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Leadership&prop=wikitext&format=json), [Encourage](https://totalwarwarhammer.fandom.com/api.php?action=parse&page=Encourage&prop=wikitext&format=json), [verify-task-6](../../.omo/evidence/w2v/verify-task-6.md)) | The values in sections 10.3-10.6 and 7. No TW source exists, so they stay [pending]. Shattering (fourth break) and roll-call +4 follow TW values and are no longer on this list |
| P12 | An attached hero taking over command | The old default (the hero takes command) did not match TW:WH and was removed | No takeover. The GDD temporary squad leader commands and the attached hero keeps only its own +4 (section 10.5 step 4). This is now [frame] and reopens only if the owner wants another rule |
| P13 | Cost unit and upkeep interval names | Research B section 6 (currency proposals) | An unnamed "cost" number. Tasks 18 and 19 set the interval |
| P14 | Duchy seat station | Not in the bible | The highest-`degree` station in the district, ties to the lower `sort` |
| P15 | Location of the Hierophant's Guard Hall | May overlap Q12 | One per faction, location not fixed |
| P16 | Who integrates cross-faction `counters` | Tasks 13-15 run in parallel | The roster task that merges last, named by the orchestrator |
| P17 | Duchy holder titles that differ per Free City | Bible 2.4 (differs per city [proposal]) | Building names use only "City" (City Charter House) |

## 14. Checklist for tasks 13-15

- [ ] 18-26 units, within the section 9.1 category counts.
- [ ] Tier 4-5 at most 30%; 1-3 tier 5 units (0 for the Free City).
- [ ] Every number is inside the section 1.2 ranges, section 1.3 squad bands, section 1.4 health and speed bands, section 3.2 leadership bands, section 5.1 cost bands and the section 1.2 range-by-role rule. `upkeep` is 20-30% of `cost`.
- [ ] `missile_damage`, `range` and `ammo` are all NULL or all set. `missile` units have them set.
- [ ] Section 5.3 caps and section 6.2 scarcity rules (values and order) are kept.
- [ ] `attributes` uses only section 7 ids and the combination rules. `counters` has 1-4 existing `id`s.
- [ ] `recruit_building` matches the section 4 table name letter for letter.
- [ ] 0 forbidden-term hits in names and text (patterns from `node scripts/pages/scan-terms.mjs`).
