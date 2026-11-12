# v3 Bible Chapter 8. Document Map

Status: written by task 9. Plan `.omo/plans/wiki-lore-rebuild-v3.md` tasks 9-15. Korean primary `08-document-map.md`.

Basis: bible 7.1 (slugs do not change, 63 documents), 9.4 D2 (four new documents, 2026-11-12), 01-core section 10 (slugs that covered old concepts get a new v3 topic in this chapter), `docs/canon-slugs.json`.

## 1. What this chapter decides

- Each of the 63 wiki documents (`docs/canon-slugs.json`) gets a v3 topic, new English and Korean titles, the bible sections to draw on, and its draft files.
- No slug changes. Slugs that covered old concepts (the sixteen polities, chaebol houses, operating houses, diaspora corridors, the synthetic persona ledger, lords outside Seoul) receive a v3 topic under the same slug. A reader arriving at an old address reads the v3 document in the same place.
- The 63 are divided among tasks 10-15 exactly as the plan assigns them.
- This chapter does not change a document's category (`category_id`). Category names (`020-wiki-categories.sql`, for example the old "Infected person" category) are fixed by task 16.
- The titles are [proposal]. If the owner changes them, the task concerned follows (provisional T09-6).

## 2. Why no new slug is added

Every topic of the v3 bible was matched against the slugs. Each can be carried by one of the existing 63. In particular the five slugs whose old concept is gone (`Sixteen-States`, Chaebol-Houses-and-Century-Factions, Operating-Houses, Diaspora-Corridors, Synthetic-Actors) take the large topics that v3 newly has (the overview of the three polities, houses and inheritance, station offices and workbenches, crossings and smuggling, humanoids). The water contracts go to World-Relation-Ledger; the physics of the eternal winter go to World-Unbinding and Station-Interior-Construction.

The CK3-based systems of chapter 09 (the contract between the campaign layer and the battlefield layer, hyeongse, replenishment, captured persons) are design-side. The only thing a wiki reader needs from them to read the world is the word "형세", hyeongse (the standing of the war), and it goes into the Glossary. So no wiki slug is added. The count in `docs/canon-slugs.json` and bible 7.1 stays 63 (provisional T09-7).

## 3. Document map

Columns: **Task** is the plan's document task number. **Basis** is the bible sections to read when writing the document (`01` is `01-core.md`, `02`-`07` and `09` the chapters, `bible` is `docs/CANON-BIBLE.md`, `roster` is `docs/design/roster-framework.md`). Every draft file is `docs/drafts/<slug>.ko.md` and `docs/drafts/<slug>.en.md`. **Current title** is the value of `data/sql/030-wiki-documents.sql` on 2026-11-13.

### 3.1 Task 10: overview and chronology (8)

| slug | Category | Current title | v3 topic | New title (ko / en) | Basis |
|---|---|---|---|---|---|
| Glossary | overview | Glossary | The in-world words of the three polities. Approved terms and v3 [proposal] terms are listed apart. The polities' units of account (meals and won, kilos and hand-hours, day-charges and maintenance turns), "형세", hyeongse (the standing of the war) | 용어 사전 / Glossary | bible 5, 01 2.2-2.4 and 8.4, 03 10.1 and 11, 04 9, 05 6 and 10.7, 06 6.4 and 10.5, 09 3.6 |
| World-Unbinding | overview | The Great Blackout | The Great Blackout and the eternal winter: how the First AI brought down the winter, temperature by depth, light, snow, the river, wind, what changed over a hundred years, the ratchet of winter | 대정전과 영원한 겨울 / The Great Blackout and the Eternal Winter | bible 1, 3, 01 3, 6.1-6.2 and 9 (the 2026 rows) |
| World-Expansion-Index | overview | World Expansion Index | An index tying the 25 districts to their polity, seat station, ruling title and related documents | 세계 색인: 세 정체와 25공작령 / World Index: the Three Polities and the 25 Duchies | bible 2.4, 01 7 and 8, 04 3.4, 05 2, 06 1 and 4, 07 4.3 |
| World-Narrative-Atlas | overview | World Narrative Atlas | The root document of the world story: the eternal winter, people living in stations, three polities divided by the Han, why they need and fear one another, the question of winter 2126 | 세계 서사 총람 / World Narrative Atlas | bible 1-2, 01 1 and 7 (including 7.4), 01 9 |
| Regional-Physical-AI-Arcs | overview | Regional and Physical AI Arcs | The First AI and the machines outside: what the First AI is and is not, the rim machines that keep the capital blockade order people gave, the story lines of the three polities around the machines. The old "physical AI era" is not used | 최초의 AI와 바깥 기계 / The First AI and the Machines Outside | 01 6.1-6.3 (not the private 6.4), 01 10, 02 6.1-6.2 and 7 (not the private 7.4), 03 8 |
| Century-Annals | chronology | Century Annals | The decade chronology 2026-2126: the Great Blackout, the descent into the stations, the freezing of the Han, the three water contracts, the ice of 2079, the Arc's parting, winter 2126 | 백 년 연표 2026~2126 / Century Annals 2026-2126 | bible 3, 01 9, 04 3.2, 05 7.2, 06 2.1 and 7.2 |
| Scenario-Timeline | chronology | Scenario Timeline | The opening: winter 2126, the positions of the three polities before the third water contract and the course of the first year. It does not say that a game turn is a month; it speaks in halves of the year (the long-light half, the long-dark half) | 개막: 2126년 겨울 / The Opening: Winter 2126 | bible 1 row 11, 3, 01 5.2 and 9, 04 15, 05 7.3, 06 7.4, 07 13 |
| Sindorim-Junction-Cargo-Gate | chronology | Sindorim Junction Cargo Gate | The line junction at Sindorim in Guro: moving loads on rails, Guro's tool market, the centre of the roads between the Free Cities | 신도림 연결부 화물문 / Sindorim Junction Cargo Gate | 03 7.2-7.3, 05 3.4 and 8.1, 07 11.2, 02 3.3 |

### 3.2 Task 11: factions (8)

| slug | Category | Current title | v3 topic | New title (ko / en) | Basis |
|---|---|---|---|---|---|
| `Sixteen-States` | factions | The Three Factions of Seoul | (retired: the sixteen polities) An overview of Seoul's three polities: what the Government, the Free Cities and the Arc hold and what they lack. A guide to the three society documents | 서울의 세 정체 / The Three Polities of Seoul | bible 2.1-2.4, 01 5.6, 7 and 8.4, 01 10 first row |
| Chaebol-Houses-and-Century-Factions | factions | Families and the Three Factions | (retired: chaebol houses) Houses and inheritance: Assembly Member houses and the inherited seat, the Free Cities' workbench households, the Arc's Near Houses. Why work and seats pool in households | 집안과 대물림 / Houses and Inheritance | bible 1 row 12, 01 10, 04 3.4 and 8.2, 05 5.2, 06 3, 07 6 |
| Operating-Houses | factions | Operating Organizations | (retired: operating houses) The hands that run a station: the Government stationmaster's office and dong centre, the Free City station crew, workbench and work crew, the Arc maintenance bench and shelter. Repair work and the hands that are handed down | 역을 돌리는 손 / The Hands That Run a Station | 01 10, 03 10, 04 6, 05 5, 06 8.5-8.6 |
| Diaspora-Corridors | factions | Diaspora Corridors | (retired: diaspora corridors) Crossings and smuggling: bridges, under-river tunnels, the ice, the land border, passes and invitation passes, forbidden trade. It also records that the descendants of the pre-Blackout immigrant communities are ordinary households of each polity | 건너는 곳과 몰래 바꾸기 / Crossings and Smuggling | 01 7.4 and 10, 05 8, 06 7.3, 07 11.1-11.3 |
| World-Relation-Ledger | factions | World Expansion Relation Ledger | The water contracts and the relations of the three polities: the first and second contracts, the scales of the third, the contract meeting, envoys and sureties, marriages and divided households | 급수계약과 세 정체 / The Water Contracts and the Three Polities | bible 1 row 11, 01 5.2 and 7.4, 03 11.6, 04 15, 05 4 and 7, 06 7, 07 11.4-11.6 |
| Government-Society | factions | Government Society | The ledger state: the National Assembly and the life presidency, the two parties, the ministries, resident registration and striking off, law and punishment, the five strata, tokens and rations, markets, clothing, the day, the national rite, the Armed Forces | 정부 사회 / Government Society | 04 1-16 (not the private 17), 01 7.1 and 8.1, bible 2.1 |
| Free-City-Society | factions | Free City Society | The seven cities: a different head in each city and the Duke of Gwanak, the contract meeting, workbenches and work crews, contracts, sureties and the rate board, the water contracts, roads and borders, clothing and daily life, the militia | 자유도시들의 사회 / Free City Society | 05 1-12, 01 7.2 and 8.2, bible 2.2 |
| Arc-Society | factions | Arc Society | The Hierophant and the Near Houses, the public face of baptism (a faith counted in parts), the four districts, the parting from the Free Cities, the maintenance economy, clothing and daily life, war doctrine | 아크 사회 / Arc Society | 06 1-14 (not the private 15), 01 7.3 and 8.3, bible 2.3 |

### 3.3 Task 12: places, people, culture (12)

| slug | Category | Current title | v3 topic | New title (ko / en) | Basis |
|---|---|---|---|---|---|
| Building-Reuse-Geography | places | River, Gu, and Dong Building Reuse | Seoul under the snow: the basements of buried buildings, the entrance surroundings where light-fields stand, the roads for digging fibre, a city eaten as salvage and fibre | 눈 밑의 서울 / Seoul under the Snow | 01 3.3 and 5.3-5.5, 02 2.1 and 3.4, 03 3.1 |
| External-Theaters | places | Outside | Beyond Seoul and the rim: the shape of the band, crossing in a blizzard, the people who bring back power cores, the return net, what is known of what lies beyond. Nobody rules outside Seoul | 서울 밖과 테두리 / Beyond Seoul: the Rim | 01 6.3 and 10, 02 7.1-7.3 (not the private 7.4), 07 7.1 and 7.4 |
| Seoul-Station-Catalog | places | Rail Station Catalog Connected to Seoul | Seoul's 312 stations: real names and lines, counts per polity, station size grades and populations, the stations where markets and exchange posts stand | 서울 역 목록 / Seoul Station Catalog | 01 4.3, 04 10 and 16.1, 05 2, 3 and 5.4, 06 4 and 8.6, map data (`120-map-core.sql`) |
| Station-Interior-Construction | places | Entering the Station Interior | Inside a station: the depth bands of surface, concourse, platform and deep tunnel and their temperatures, the four limits of a station (heat, water, air, light), where people sleep and cook. There is no draft yet; task 12 writes it new | 역 안으로 / Inside a Station | 01 3.1 and 4.1-4.2, 02 3.2, 04 12, 05 10.1, 06 10.2 |
| World-Map-Construction | places | The Structure of the World Map | How the world map is built: the 25 duchies, the lands of the three polities, seat stations, the thirteen border links | 세계 지도의 짜임 / How the World Map Is Built | bible 2.4, 01 7.4, 07 4.3 and 11.1, map data |
| World-and-Subway-Layers | places | World Map | The surface and underground: surface roads over the snow, the frozen Han and its bridges, lines and deep lines, the rail is the road | 지상과 땅 밑 / The Surface and Underground | 01 3.1, 3.3-3.4 and 7.4, 03 7.2 |
| Characters-Factions-and-Professions | characters | Characters, Factions, and Trades | How the 1,022 people are placed: faction, stage, title, occupation, location, age and household, the trades of the three polities | 인물·세력·생업 / People, Factions and Trades | 07 3-6 and 8, 01 8, 04 16, 05 12, 06 12 |
| Hangnyeol-and-Bon-gwan | characters | Bon-gwan and Hangnyeol | Bon-gwan and hangnyeol: the clan records (fixed facts) stay as they are, and kin divided across the river and household inheritance are placed in the v3 world | 본관과 항렬 / Bon-gwan and Hangnyeol | 07 6.4, 01 2.3, `docs/design/v3/README.md` fixed facts |
| Faith-Culture-Schism | culture | The Faith-and-Culture Schism | Faith and rites: the Government's national rite, the Free Cities' beliefs, the Arc's baptism and faith (public parts only), the parting of the Arc from the Free Cities. The only organised faith is the Arc | 믿음과 의례 / Faith and Rites | bible 1 row 9, 04 13, 05 10.5, 06 5-6 and 7.2 (not the private 15) |
| Food-Culture | culture | Food Culture | Meals and food: fibre sugar and yeast, light-fields, insects, mushrooms, fish and hunting, salt and seed. The rations and tables of the three polities | 끼니와 먹거리 / Meals and Food | 01 5.3, 02 2.5, 04 9.2, 05 10.2, 06 10.3 |
| Oral-Stories | culture | The Stories | The stories: the names and tales station people gave the outside machines and the animals, old stories told in the voices of the three polities | 이야기 / The Stories | 01 2.2, 02 6.4 and each group's name, 04 13.2, 05 10.7, 06 6.4 |
| Values-and-Policy-Scales | culture | Values and Policy Scales | Values and policy scales: the value axes of people and the leanings of the three polities | 가치관과 정책 척도 / Values and Policy Scales | 07 9.5, 01 2.2 and 7 |

### 3.4 Task 13: technology, people and machines, other (8)

| slug | Category | Current title | v3 topic | New title (ko / en) | Basis |
|---|---|---|---|---|---|
| Lost-Technology-Lineage | technology | Lost Technology | What still runs: the four grades of technology (made, mended, revived, cannot be made), Seoul's 5 MW of power, parts, knowledge and hands, what each generation loses | 아직 도는 것 / What Still Runs | 03 1-3 and 10, 01 5.1 |
| Cyberware-and-Scarcity | technology | Cyberware and Scarcity | Machine bodies and scarcity: the places of the body, fitting, maintenance, power, rejection, death and return, prices. No part is named (bible 1 row 14) | 기계 몸과 결핍 / Machine Bodies and Scarcity | 03 4 and 11.5, 04 13.3, 06 5 and 8 |
| Era-Arms-and-Tech-Level | goods | The Arms and Technology of This Era | Guns, rounds and drones: where the firearms came from, the three kinds of ammunition, reloading and primers, air guns, shooting in tunnels, drones and radio war, what the three polities' armies have and lack | 총, 탄, 드론 / Guns, Rounds and Drones | 03 5-6, 07 12, roster 9 |
| People-and-Machines | people-and-machines | People and Machines | People and machines: vehicles on rails and depots, machines inside Seoul, revived machines, the work of a world where machines are scarce | 사람과 기계 / People and Machines | 03 7-8, 02 6.3 and 6.5, 01 5.6 |
| Synthetic-Actors | people-and-machines | Synthetic Social Personas | (retired: the synthetic persona ledger) Humanoids: where the human-shaped machines built before the Blackout are now, how many, and who keeps them alive. They are not written as thinking persons | 휴머노이드 / Humanoids | bible 1 row 5, 01 10 (T02-91), 03 8, 07 3.2 (Min Ung-gi) |
| Ailments | ailments | Ailments and Symptoms | Ailments of the cold: frostbite and hypothermia, deep stations short of air, rejection and infection of machine bodies, sickness from fibre sugar, treatment and death in a world short of medicine | 추위의 병 / Ailments of the Cold | 01 3.1 and 4.1, 03 4.5, 04 13.4, 05 10.4, 06 6.3 |
| Offices-and-Ranks | offices | Offices and Ranks | Titles and offices: the title ladders of the three polities (the approved Member of the National Assembly, Duke of Gwanak and Hierophant, and [proposal] titles), the Government's ministries and ranks, the Free City workbench posts, the Arc's part counts and titles | 칭호와 자리 / Titles and Offices | 01 8, 04 3-6 and 14.1, 05 3 and 5.2, 06 3.5 and 12.4, 07 4.4 and 8.5, bible 9.1 |
| Structures | structures | The Structures Compendium | Structures: entrance shafts, light-fields, wind-machine fields, the water wheels of the Jamsil weir, wells and pipes, the under-river tunnel checkpoints, rim watch posts | 구조물 / Structures | 01 3.3, 4 and 5, 03 2 and 7.3, 04 14.4, 05 7.1, 06 8.1 |

### 3.5 Task 14: the hostile ecology index and G01-G13 (14)

| slug | Category | Current title | v3 topic | New title (ko / en) | Basis |
|---|---|---|---|---|---|
| Hostile-Ecology-Index | bestiary | Seoul Ecology and Variant Bestiary | The opening of the hostile ecology: the thaw-pocket food web, threat grades and threat by depth, the four kinds of groups, encounters per faction | 적대 생태 도감 / Hostile Ecology Compendium | 02 1-3, 8 and 9 |
| Hostile-Group-G01 | bestiary | G01 · Wild Boar | Animals | G01 · 멧돼지 / G01 · Wild Boar | 02 2, 4 G01 |
| Hostile-Group-G02 | bestiary | G02 · Large-billed Crow | Animals | G02 · 큰부리까마귀 / G02 · Large-billed Crow | 02 2, 4 G02 |
| Hostile-Group-G03 | bestiary | G03 · Feral Dog | Animals | G03 · 들개 / G03 · Feral Dogs | 02 2, 4 G03 |
| Hostile-Group-G04 | bestiary | G04 · Raccoon Dog | Animals | G04 · 너구리 / G04 · Raccoon Dog | 02 2, 4 G04 |
| Hostile-Group-G05 | bestiary | G05 · Brown Rat | Animals | G05 · 집쥐 / G05 · Brown Rat | 02 2, 4 G05 |
| Hostile-Group-G06 | bestiary | G06 · Grey Heron and Cormorant | Animals | G06 · 왜가리·가마우지 / G06 · Herons and Cormorants | 02 2, 4 G06 |
| Hostile-Group-G07 | bestiary | G07 · Yongsan Raiders | Hostile human groups | G07 · 용산 말소자 / G07 · Yongsan Struck-Off | 02 5.1, G07, 04 5 and 7.3 |
| Hostile-Group-G08 | bestiary | G08 · Dongdaemun Raiders | Hostile human groups | G08 · 동대문 증표꾼 / G08 · Dongdaemun Coupon-Forgers | 02 5.1, G08, 04 9.1 |
| Hostile-Group-G09 | bestiary | G09 · Sangam Deserters | Hostile human groups | G09 · 상암 탈영병 / G09 · Sangam Deserters | 02 5.1, G09, 04 14.3 |
| Hostile-Group-G10 | bestiary | G10 · Bogukmun group | Hostile human groups | G10 · 보국문 테두리꾼 / G10 · Bogungmun Perimeter-Runners | 02 5.1, G10, 07 7.4 |
| Hostile-Group-G11 | bestiary | G11 · Gangnam Stray Humanoids | Hostile human groups | G11 · 수서 꺼진 사람들 / G11 · Suseo Gone-Dark | 02 5.1, G11, 06 5.5 |
| Hostile-Group-G12 | bestiary | G12 · Sinnae Deserters | Hostile human groups | G12 · 금천 보증 잃은 손 / G12 · Geumcheon Hands Without Surety | 02 5.1, G12, 05 3.5 and 6.3 |
| Hostile-Group-G13 | bestiary | G13 · Pincer Arm | Old machines inside Seoul | G13 · 집게팔 / G13 · Claw Arms | 02 6.1-6.5, G13 |

### 3.6 Task 15: G14-G26 (13) and new slugs

| slug | Category | Current title | v3 topic | New title (ko / en) | Basis |
|---|---|---|---|---|---|
| Hostile-Group-G14 | bestiary | G14 · Empty Cart | Old machines inside Seoul | G14 · 빈수레 / G14 · Empty Carts | 02 6.1-6.5, G14 |
| Hostile-Group-G15 | bestiary | G15 · Care Wheel | Old machines inside Seoul | G15 · 돌봄바퀴 / G15 · Care Wheels | 02 6.1-6.5, G15 |
| Hostile-Group-G16 | bestiary | G16 · Girder Spider | Old machines inside Seoul | G16 · 철골거미 / G16 · Girder Spiders | 02 6.1-6.5, G16 |
| Hostile-Group-G17 | bestiary | G17 · One-Eye Tower | Rim machines | G17 · 외눈탑 / G17 · One-Eye Towers | 02 6.1-6.2 and 6.6, G17, 7 |
| Hostile-Group-G18 | bestiary | G18 · Fire-Leg Train | Rim machines | G18 · 굴막이 / G18 · Tunnel-Stoppers | 02 6.6, G18 |
| Hostile-Group-G19 | bestiary | G19 · Gurgler | Rim machines (some drift into Seoul) | G19 · 그르렁이 / G19 · Growlers | 02 6.1 and 6.6, G19 |
| Hostile-Group-G20 | bestiary | G20 · Iron-Clicker | Rim machines | G20 · 불가사리 / G20 · Bulgasari | 02 6.6, G20 |
| Hostile-Group-G21 | bestiary | G21 · Wall-knocker | Rim machines | G21 · 땅두드리기 / G21 · Ground-Knockers | 02 6.6, G21 |
| Hostile-Group-G22 | bestiary | G22 · Flame Lantern | Rim machines | G22 · 도깨비불 / G22 · Dokkaebi Lights | 02 6.6, G22 |
| Hostile-Group-G23 | bestiary | G23 · Udukeoni | Rim machines (some drift into Seoul) | G23 · 우두커니 / G23 · Udukeoni | 02 6.1 and 6.6, G23 |
| Hostile-Group-G24 | bestiary | G24 · Weeper | Rim machines | G24 · 되뇌미 / G24 · Doenoemi | 02 6.6, G24 |
| Hostile-Group-G25 | bestiary | G25 · Lantern Ant | Old machines inside Seoul | G25 · 등불개미 / G25 · Lamp Ants | 02 6.5, G25 |
| Hostile-Group-G26 | bestiary | G26 · Iron Dinosaur | Rim machines | G26 · 철공룡 / G26 · Iron Dinosaurs | 02 6.6, G26 |

There is no new slug (section 2). Task 15 writes only the thirteen documents G14-G26.

Counts: task 10 eight, task 11 eight, task 12 twelve, task 13 eight, task 14 fourteen, task 15 thirteen. Total 63.

## 4. Rules for every document task

1. Bodies are written in the voice and in-world words of 01-core section 2. The comparison words of the left column of the 01-core 2.4 table and "Union" are used in no body (`docs/canon-terms.json` catches them).
2. Private settings (01 6.4, 02 7.4, 04 17, 06 15, 07 14) are not carried into public documents.
3. Station and district names are the real names, and the English uses the map values corrected by `fixed-facts.corrections.json`.
4. Provisional items are not written as if approved. The owner-pending decisions of bible 9.5 are used as their defaults, in sentences that keep the mark that they are not decided.
5. Links and anchors between documents use the slugs of this map. Titles change; slugs stay the same.
6. English and Korean titles use the [proposal] of the tables above. A document task that finds a better title changes it and records it in its own ledger part.
