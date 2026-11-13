# v3 Bible Chapter 2. The bestiary: animals, old machines, outside machines, and outside Seoul

Status: draft. Plan `.omo/plans/wiki-lore-rebuild-v3.md` task 34 (design part). This is the English mirror of `02-ecology.md`; section numbers, figures and names are the same. This chapter replaces, as a whole, the old chapter 2 written by task 3 (26 hostile ecology groups).

How to read:

- **Authority order.** Bible sections 1-3 (as amended in ea06d2e12) > chapter 11 (science-based setup, the new base of this chapter) > chapters 01-10. Chapter 11 section 5 is the skeleton of this chapter, and the words follow `12a-terms.md` (task 38 part 1, settled draft).
- **Owner decisions (2026-11-13, bible 9.4).** The bestiary is "delete everything and redesign (Recommended)", and its make-up is "the 12-entry recommendation (Recommended)": three animals, four old machines inside Seoul, four outside machines, one hazard zone. Human groups move to the faction and society documents. The winter figures are "Option B: values fitted to the science (Recommended)" (Seoul annual mean about -9°C, August about -4°C, sunlight about 80%). Go Ye-jin's point-of-view year is 2126.
- **(provisional T34-n)** marks what this chapter newly decides. Each item is in `docs/drafts/reports/v3-ledger-parts/t34.md` under the same number. Until the owner answers, none of it is approved setting. (provisional T02-n) and (provisional T33-n) mark values made by chapters 1 and 11 that this chapter uses as they are.
- **Citations.** `[Machines 2.10]` is a section of `docs/research/v3-machines-2030s.md`, `[Winter 7]` a section of `docs/research/v3-winter-science.md`. Both are research records, not canon. Real company and product names are not carried into this chapter; machines are written as classes.
- **Words.** Words coined in chapters 01-10 appear only in quotation marks when pointing at another chapter (the rule at the head of chapter 11). They are replaced by the new words of `12a-terms.md` section 2. For example: "the rim" → the blockade zone, "the forecourt" → the buffer zone, "thaw pocket" → unfrozen ground (design documents: talik), "light-field" → greenhouse, "exhaust shaft" → exhaust vent, "power core" → power source (radioisotope battery, battery pack), "sleeping machine" → dormant machine, "long-light half / long-dark half" → long-daylight half / short-daylight half.
- **Station and district names** are all in map_station and map_region of `data/sql/120-map-core.sql`. Mountain names (Bukhansan, Dobongsan, Gwanaksan, Cheonggyesan, Daemosan) and the Jamsil submerged weir are used as chapter 1 uses them.
- **The private setting** is only in 9.4. It is not carried into the public wiki, public in-game text or the showcase.

## 0. At a glance

Basis: chapter 11 section 5.3 (the recommended list of 12 entries), bible 9.4 row 2026-11-13 "bestiary make-up", `12a-terms.md` section 5 (names of the 12 entries).

| # | Entry | Korean | Branch | Main use | Threat grade | Faction that meets it most |
|---|---|---|---|---|---|---|
| 1 | brown rat | 시궁쥐 | animal | hazard, resource | 2 (threat to daily life 4) | the Arc |
| 2 | large-billed crow | 큰부리까마귀 | animal | information, hazard | 1 | the Government |
| 3 | feral dog | 들개 | animal | encounter, ally | 3 | the Free Cities |
| 4 | service robot | 서비스 로봇 | old machine inside Seoul | non-combat encounter, resource | 1 | the Government |
| 5 | quadruped inspection robot | 사족 보행 점검 로봇 | old machine inside Seoul | encounter, resource, ally | 2 | the Free Cities |
| 6 | factory humanoid robot | 공장 휴머노이드 로봇 | old machine inside Seoul | hazard, resource | 3 (large warehouse 4) | the Free Cities |
| 7 | track inspection robot | 선로 점검 로봇 | old machine inside Seoul | ally, information | 1 | the Free Cities |
| 8 | returning unmanned ground vehicle | 귀환 무인 차량 | outside machine | encounter, resource | 4 (group 5) | the Government |
| 9 | unmanned sentry post | 무인 경계 초소 | outside machine | hazard, puzzle | 4 | the Arc |
| 10 | blockade surveillance network | 봉쇄 감시망 | outside machine | hazard, information | 2 (a calling machine) | the Government |
| 11 | drone swarm | 군집 드론 | outside machine | encounter | 3 (with vehicles 4) | the Free Cities |
| 12 | unexploded warheads and optical fibre | 불발 탄두와 광섬유 | hazard zone | hazard, resource | 4 | the Free Cities |

(provisional T34-1: the order, threat grades and faction assignment of the 12 entries)

This chapter in one line: **Seoul's ecology is three animals that live by leaning on people's stations, eight machines that people built before the Great Blackout, and one hazard zone those machines left.** There are no new species, no mutated creatures and no disease that turns people into something else. Eighty years is too short for a new species to arise (chapter 11 5.1, [AI 8]).

## 1. Scope of this chapter

Basis: bible section 1 row 2 (the First AI killed no one directly), row 3 (people survived only as many as the stations could hold), row 4 (eternal winter), row 5 (machines exist but are scarce), row 6 (outside Seoul, war machines roam carrying out their last orders), row 15. Chapter 11 2.3, 4.1, 5. 01-core 3.1 (depth bands), 6.3.

### 1.1 What an entry needs to stay

Only what has all three conditions of chapter 11 5.1 goes into the bestiary (provisional T33-28).

1. **Real-world basis.** A living thing or machine that exists today, or its direct continuation.
2. **Game use.** At least one of encounter (combat or non-combat), resource (what is salvaged), hazard (a zone or trap), ally (something tamed or revived and used). A combat encounter must be able to enter the hand-off bundle of chapter 09 section 3 (category and threat grade) (section 8).
3. **Narrative hook.** One story that ties it to the world before the Great Blackout or to the factions of 2126.

### 1.2 What is not in the bestiary

| What is not in it | Where it is covered |
|---|---|
| Human groups (old G07-G12) | People are not ecology. They move to the documents on the three factions' law and punishment and on life between the factions (section 10) |
| Wild boar, raccoon dog, herons and cormorants | They do not survive about -22°C in January, deep snow and a river frozen all year (2.3). The wild boar is used only as old-story material, such as "the last wild boar grandmother saw" |
| Care dolls, city environmental sensors, isotope heat sources, old battery packs, the shut-down reactor, autonomous construction and mining machines | They are objects and places, not ecology. Chapter 03 (technology and resources) and the place documents cover them (chapter 11 5.3) |
| Armed rail vehicles, repair machines that fix themselves | The real-world basis is weak. A machine that keeps going for eighty years by mending other machines without people has no reason to be kept even as an opera layer. Outside machines lasted eighty years because of isotope heat sources, solar power and frozen preservation (7.1) |
| Mutated creatures, the old "Infected" group | Retired concepts (01-core section 10). There is no disease that turns people into something else |

(provisional T34-2)

### 1.3 Place names

Depth uses the four layers of 01-core 3.1 as they are (surface, concourse, platform, deep tunnel). Three places are added to talk about threats (provisional T34-3).

- **Abandoned sections.** Unused tunnels between stations, entrances that were closed and the frozen upper floors above them, the basements of old buildings buried under snow. Whole stations are rarely abandoned. What is abandoned is mostly part of a station and the stretch between stations (01-core 4.3, chapter 04 16.1).
- **Buffer zone.** 0-2 km outside the Seoul administrative boundary. A band the outside machines do not guard or patrol. A returning unmanned ground vehicle enters it only when its last base coordinates lie inside this band, and then only as far as those coordinates; no other machine enters it. It is the "forecourt" of 01-core 6.3 and the old chapter 2 (`12a-terms.md` no. 36).
- **Blockade zone.** 2-10 km outside the Seoul administrative boundary. The band the outside machines guard. Its inner edge is the blockade line. It is the "rim" of 01-core 6.3 (`12a-terms.md` no. 37).

## 2. The winter figures and the base of the ecology

Basis: bible 9.4 row 2026-11-13 "winter figures" (Option B adopted). Chapter 11 2.5 table (Option B). [Winter 4, 5, 7].

### 2.1 Figures this chapter uses (Option B)

Task 38 changes the figures of 01-core section 3 (Option A) to Option B. This chapter is already written with Option B (provisional T33-14, adopted by the owner).

| Item | Value |
|---|---|
| Seoul annual mean temperature | about -9°C |
| Warmest month (August) | about -4°C. Days whose daytime temperature rises above zero number fewer than ten a year, and lying snow does not melt |
| Coldest month (January) | about -22°C. About -35°C on a blizzard night |
| Mean of the long-daylight half and the short-daylight half | about -6°C, about -13°C |
| Surface sunlight on a clear day | about 80% of pre-Blackout. Direct light about 60%. The sky is grey-white and the sun a dim white disc |
| Precipitation | about a quarter of pre-Blackout (about 350 mm a year). Almost all snow |
| The Han River | Frozen all year. Water remains in the deep channels under the ice |
| Uninhabited ground (after eighty years) | 10 m about -6°C, 20 m about -3°C, 40 m about +2°C, 55 m about +5°C. The frozen-ground boundary is about 33 m |

### 2.2 The base principle: talik ecology

In an ice-cap climate (even the warmest month averages below zero) trees cannot grow. The forests that died in the first winters were cut for firewood and fibre, and the forests of the near mountains ran out around 2060-2065 (chapter 11 3.1). What grows by itself on the surface is only moss and lichen on bridge railings and rocks the wind has swept clear of snow, and the bands of moss and mould round the stations' air vents and exhaust vents. The warm, wet exhaust feeds those bands [Winter 7]. Under Option B sunlight is about 80% of pre-Blackout, so light is not short. What is short is heat and water.

So all of Seoul's animals live by leaning on people's stations. The heat a station gives off, the waste it throws out and the greenhouses it keeps are the bottom of the food web. Design documents call this **talik ecology**: unfrozen ground remains round a lived-in station (the "thaw pocket" of 01-core 3.1), and animals live along that unfrozen ground. World text gives it no name and writes it out as "the unfrozen ground round the station" (provisional T34-4).

Three things follow from this principle.

1. Animals grow rarer the farther from a station. On snowfields more than 2 km from a station there is almost nothing but crows.
2. The number of animals follows the number of people. The Government, which has the most people (about 160,000, provisional T02-29), also meets the most animals.
3. When a station is abandoned, the animals round it starve within a few years or move to another station.

### 2.3 Who remained: the survival judgement under Option B

A task chapter 11 2.5 handed to chapter 02. For each animal it asks whether it can live with about -22°C in January, deep snow and a river frozen all year (provisional T34-5).

| Animal | Judgement | Reason |
|---|---|---|
| Brown rat | Remains | City rats live attached to buildings, sewers and underground infrastructure. When it turns cold they move indoors [Winter 7]. They went underground with people |
| Large-billed crow | Remains | City crows roost in heat islands in winter and cache food [Winter 7]. Before the Great Blackout this species already lived as far as the northern edge of East Asia, where the January mean is below -15°C. The heat of the vents and people's waste make up the difference (extrapolation) |
| Feral dog | Remains | The descendants of abandoned pet dogs. Greenland sled dogs spend no extra energy keeping warm down to -25°C [Winter 7]. January's about -22°C is within that, and blizzard nights of about -35°C they endure with a den out of the wind and food (extrapolation). They lean on the heat and waste beside people |
| Wild boar | Gone | January temperature explains its density best, and deep snow blocks its range [Winter 7]. The last herds are set as having died out around 2052 |
| Raccoon dog, water deer | Gone | The raccoon dog survives by going dormant but there is no time of year when food gathers. Winter is the water deer's worst time, through food shortage and cold [Winter 7] |
| Herons, cormorants, migratory birds | Do not come | They need open water. The river is frozen all year and no birds fly in from outside (9.3) |

## 3. The food web

Basis: 01-core 5.3 (shares of meals), 5.5 (waste), 3.4 (the river under the ice). Section 2.

### 3.1 Five sources

| Source | What it is | What eats it |
|---|---|---|
| Station waste | Saccharification-tank residue, mushroom-cave residue, larvae escaped from the insect tubs, kitchen waste, digestate from the anaerobic digesters | brown rat, large-billed crow, feral dog |
| Greenhouses | Cabbage, turnips, mustard greens, barley and sprouts grown in the greenhouses on the surface round the entrances (01-core 5.3) | large-billed crow (pecks the roofs), brown rat (digs under) |
| Buried old carbon | Mushrooms that have sprung up by themselves on paper and wood in the buried basements at the edge of the unfrozen ground round a station; spores escaped from the mushroom caves spread there. Station people call them **field mushrooms** (a headword). Small insects that eat them live alongside | brown rat |
| The river under the ice | River water seeping out of the ground (01-core 3.4), organic matter in the mud of the old riverbed, water let out by riverside stations. Bottom-dwelling insects eat it, and crucian carp and carp eat them | people (ice-hole fishing) |
| Frozen carcasses | Animals that froze to death, animals the outside machines stopped. In the cold they do not rot and stay food for a long time (01-core 5.5) | large-billed crow, feral dog |

Human corpses do not enter this web. All three factions guard their dead from animals. How the dead are laid to rest is set by chapters 04-06. The skeleton fixes only that the Arc seals a believer's brain (bible 2.3).

(provisional T34-6)

### 3.2 The shape of the web

```
people's stations (heat · waste · greenhouses)
   ├─▶ brown rats · escaped larvae · field mushrooms
   │      └─▶ large-billed crows · feral dogs
   │               └─▶ people (traps and hunting: feathers · hides · a little meat)
   └─▶ greenhouses ─▶ large-billed crows · brown rats

frozen carcasses ─▶ large-billed crows · feral dogs

the river under the ice (seeped water · riverbed mud · water from riverside stations)
   └─▶ bottom insects ─▶ crucian carp · carp ─▶ people
```

The web is short. No chain has more than three links. The energy entering at the bottom is small, so there is no room for a large hunting animal. The largest wild animal in Seoul is the feral dog.

The numbers of wild animals are set as follows (provisional T34-7).

| Animal | All of Seoul | Densest |
|---|---|---|
| Brown rat | 400,000-600,000 | the Arc's four districts, which have many deep buildings; the big interchange stations |
| Large-billed crow | 15,000-25,000 | the Government's 14 districts, which have the widest greenhouses and many shallow stations |
| Feral dog | 2,000-4,000 (150-250 packs) | the Free Cities' factory grounds, the Government's northern districts |

### 3.3 Bodies that follow the length of the day

This world has no seasons, but the length of the day still comes round. Seoul's day goes between nine and a half hours at the winter solstice and fourteen and a half at the summer solstice (01-core 3.2). Real animals often time their breeding by day length, so this part does not depart from real ecology. The words are "long-daylight half / short-daylight half", per `12a-terms.md` no. 30 (provisional T34-8).

| Animal | Long-daylight half | Short-daylight half |
|---|---|---|
| Brown rat | Breeds all year in the warm layers | The same. Hungry rats crowd to the saccharification tanks and stores |
| Large-billed crow | Lays eggs at its start. Fierce round the nest | Hundreds gather to roost round the exhaust vents |
| Feral dog | No preference | No preference. But hungry packs come close to the entrances |

Greenhouses grow better in the long-daylight half, so the harvest gathers in its latter half. That is also when crows and rats go after the greenhouses most.

Blizzards are more frequent in the short-daylight half: two or three a month in the short-daylight half, about one a month in the long-daylight half (the length and force of blizzards in 01-core 3.5 are unchanged). The outside machines, the other way round, move more in the long-daylight half (7.1). So crossings of the blockade zone are more frequent in the short-daylight half (9.2) (provisional T34-9).

### 3.4 The wild animals' share of people's meals

01-core 5.3 set "fish and hunting" at about 6% of calories. This chapter splits that 6% as follows (provisional T34-10).

| What | Share of calories |
|---|---|
| Fish raised in tanks in warm stations (fed on insects and saccharification-tank residue) | about 5.68% |
| Crucian carp and carp caught through holes in the river ice | about 0.3%. The river is dark and its flow reduced, so all of Seoul cannot catch more than a few hundred tonnes a year |
| Hunting wild animals (brown rat, large-billed crow) | about 0.02%. All of Seoul catches about 250,000 brown rats a year. That is a little over half the standing number (3.2), and the number holds because they breed all year round in the warm layers. The large-billed crow barely counts in the sum, and the feral dog is not counted as food |

The share of people's food from wild animals is small. Their value lies elsewhere.

- **Fat.** The fat in 01-core 3.2, "oil lamps and tallow candles are used only where fat is produced", now comes not from wild animals but from the guts of tank fish and the larvae of the insect tubs. Close to a third of a larva's body is fat. Oil lamps belong to the stations that have tanks and insect tubs.
- **Furs.** The fur of dead feral dogs is the warmest animal hide in Seoul. Rat skins are small and are used only for glove linings and overshoes. Who wears them is set by the clothing sections of chapters 04-06.
- **Feathers.** Large-billed crow feathers become padding for clothes and bedding.
- **Bone and sinew.** Needles, thread, tool handles.

### 3.5 What is set differently from reality

Every place where an animal's habits are set differently from the real animal is written here. A habit not in this table follows the real habit (provisional T34-11).

| Animal | Reality | v3 | Reason |
|---|---|---|---|
| Large-billed crow | Builds nests in trees | Builds round station exhaust vents, on the tops of buried buildings, on wind-turbine masts | The trees died. The warm air of the exhaust vents keeps the eggs |
| Feral dog | Roams round places where people live | Digs dens in the basements of buried buildings on the unfrozen ground round a station. Longer-haired and smaller than before the Great Blackout | The surface is under snow, so only packs that used dens remained. Body size and coat are set as the result chosen by eighty years, roughly thirty to forty generations, of hunger and cold. No new species has arisen |
| Brown rat | Breeds several times a year | Breeds all year in the warm layers | In reality too breeding has no set time where food and warmth are always present. The only difference is that this condition holds inside every station in Seoul |

## 4. Threat grades and threats by place

Basis: 01-core 3.1 (depth bands), 3.3 (entrances are vertical shafts through the snow), 4.1, 6.3. The end of chapter 09 section 3, "enemies outside the factions" (provisional T29-24: only grades 4-5 become a battle, grades 1-3 are campaign events).

### 4.1 Threat grades

| Grade | Name | Meaning | In the game |
|---|---|---|---|
| 1 | Loss | Eats into food, power and goods. Does not kill people | campaign event |
| 2 | Injury | Injures a person alone or spreads disease | campaign event |
| 3 | Danger | Can kill a work team (3-6 people). Needs an armed response | campaign event (the choice to send an armed work team) |
| 4 | Grave danger | An armed squad must face it. Can bring down the livelihood of a station | one battle (section 8) |
| 5 | Avoid | Hard to beat even with an army. Not meeting it is the response | one battle. Win for a large share, lose and the army is lost |

The grade is the threat of one meeting. For things like the brown rat, which is grade 2 alone but does greater harm to a station's food and wiring, a **threat to daily life** is written separately (`12a-terms.md` no. 193, the old "household threat"). The grade 4-5 line at the end of chapter 09 section 3 stays as it is (provisional T34-12).

One exception. A calling machine (7.4, the blockade surveillance network) is put at grade 2 not for its own threat but to mean that, once it notices something, it raises the next encounter to grade 4-5.

### 4.2 Threats by depth

| Layer | Depth | What is met most | Greatest threat |
|---|---|---|---|
| Surface, round the station | a few hundred metres from the entrances | large-billed crow (greenhouse roofs, exhaust vents), feral dog (entrances), brown rat (under the greenhouses) | 3 |
| Surface, far from the station | fibre salvage routes, wind farms, bridges | feral dog packs. Dormant machines in the basements of factories and warehouses under the snow (4, 6) | 3, large warehouse 4 |
| Concourse | 3-8 m underground | feral dog (gets in through closed entrances), service robots in the underground arcades (4) | 3 |
| Platform | 8-25 m underground | brown rat (saccharification tanks, mushroom caves, wiring), track inspection robot (7) | 2, threat to daily life 4 |
| Deep tunnel | below 25 m | brown rat. The deep layers of a lived-in station are the safest. Track inspection robots in the deep regional rail tunnels (7) | 2 |
| Abandoned sections | any depth | brown rat, feral dog dens, dormant machines (4-7) | 3, large warehouse 4 |
| Line ends leading out of Seoul | tunnels beyond the boundary stations | unexploded warheads and optical fibre (12) | 4 |
| Buffer zone | 0-2 km outside the boundary | watchtowers of the blockade surveillance network look down (10). A returning unmanned ground vehicle enters it only when its last base coordinates lie inside this band, and then only as far as those coordinates (8) | 4 |
| Blockade zone | 2-10 km outside the boundary | returning unmanned ground vehicle (8), unmanned sentry post (9), blockade surveillance network (10), drone swarm (11) | 5 |

(provisional T34-13)

In one line: **inside a lived-in station, the deeper the safer; outside a station, the farther the more dangerous.** Threats inside a lived-in station mostly eat into its livelihood; threats that take lives are in the abandoned sections and outside Seoul.

### 4.3 Threats by the kind of station

| Kind of station | Examples (real stations) | Main threats |
|---|---|---|
| Big interchange stations of the old centre | Seoul Station, City Hall, Jongno 3-ga, Jamsil, Sindorim, Yeongdeungpo | the brown rat's threat to daily life, service robots in the underground arcades |
| Arc stations with many deep buildings | Gangnam, Samseong, Seolleung, Express Bus Terminal, Munjeong | brown rat (densest), factory humanoid robots in unfinished buildings and logistics warehouses |
| Factory-ground stations | Gasan Digital Complex, Guro Digital Complex, Doksan, Magongnaru | feral dog, factory humanoid robot |
| Round power plants and rail depots | Hapjeong, Sangsu (underground power plant), Gunja, Sinjeong, Cheonwang, Banghwa (rail depots) | quadruped inspection robot |
| Mountain-foot stations of the Government's north | Dobongsan, Suraksan, Buramsan, Bukhansan Ui, Chang-dong | feral dog, crows going for the greenhouses |
| Boundary stations (Government) | Gupabal, Yeonsinnae, Dokbawi, Susaek, Digital Media City, Dobongsan, Suraksan, Buramsan, Sinnae, Yangwon, Mangu | returning unmanned ground vehicles in the buffer zone, unexploded warheads and optical fibre at the rail tunnel ends north of Gupabal (Line 3), north of Yeonsinnae (GTX-A) and north of Buramsan (Line 4), unexploded warheads (fibre is rare) at the surface line ends north of Dobongsan (Line 1, Line 7), west of Susaek (Gyeongui-Jungang Line), east of Sinnae (Gyeongchun Line) and east of Yangwon (Jungang Line) |
| Boundary stations (Free Cities) | Gimpo Int'l Airport, Gaehwa, Gaehwasan, Banghwa, Onsu, Oryu-dong, Cheonwang, Geumcheon-gu Office, Namtaeryeong, Gwanaksan | returning unmanned ground vehicles in the buffer zone, unexploded warheads and optical fibre at the rail tunnel ends south of Namtaeryeong (Line 4), west of Onsu (Line 7) and west of Gimpo Int'l Airport (Gimpo Goldline, Seohae Line), unexploded warheads (fibre is rare) at the surface line ends south of Geumcheon-gu Office (Line 1), west of Onsu (Gyeongin Line) and west of Gimpo Int'l Airport (Airport Railroad); unmanned sentry posts on the outer slopes of Gwanaksan and Namtaeryeong |
| Boundary stations (Arc) | Cheonggyesan, Daemosan, Suseo, Bokjeong, Jangji, Macheon, Geoyeo, Gangil, Sangil-dong, Amsa History Park | returning unmanned ground vehicles in the buffer zone, unexploded warheads and optical fibre at the rail tunnel ends south of Cheonggyesan (Sinbundang Line), south of Suseo (GTX-A), south of Bokjeong (Line 8, Suin-Bundang Line), east of Gangil (Line 5) and north of Amsa History Park (Line 8, under the Han River); unmanned sentry posts on the outer passes of Cheonggyesan and Daemosan |

(provisional T34-14)

### 4.4 The fibre salvage routes

01-core 5.3 said that fibre shrinks every year and the way to dig it grows longer (provisional T02-100). These routes are where most people die inside Seoul (provisional T34-15).

- **Length.** A fibre salvage work team of 2126 walks 1-3 km over the snow from its station and digs into the lower floors of buried offices and warehouses. The Government's old centre is still close; for the Free Cities and the Arc it is far.
- **Cold.** The commonest death is neither animal nor machine but cold. Teams meet a blizzard and do not come back.
- **Dormant machines.** The places with most fibre left are pre-Blackout logistics warehouses, hospitals and unfinished buildings. Factory humanoid robots (6) and service robots (4) sleep in their basements. When a work team connects batteries to light the place, they wake (6.1).
- **Feral dogs.** Feral dog packs follow heavily laden work teams.
- **People.** There are people who block the fibre routes and take tolls. They are not in the bestiary but in the documents on the three factions' law and on life between the factions (section 10).

## 5. The three animals

Basis: sections 2-3. [Winter 7]. Chapter 11 5.2 nos. 1-3.

Every entry uses the same frame of nine fields: **real-world basis, what it is in 2126, where it lives, behaviour, threat, what it yields, factions that meet it, game use, narrative hook** (provisional T34-16).

### 5.1 Brown rat (Brown-Rat)

| Field | Content |
|---|---|
| Real-world basis | City brown rats live attached to buildings, sewers and underground infrastructure. Farmland brown rats also move into buildings when it turns cold [Winter 7]. The brown rat is one of the rats that carry haemorrhagic fever with renal syndrome, and one of the viruses that cause it bears the name "Seoul" (first found in Seoul's brown rats in the 1980s). Grade: science |
| What it is in 2126 | The only animal that went underground with people. 400,000-600,000. It lives in the warm layers of lived-in stations |
| Where it lives | Round the saccharification tanks, mushroom caves, insect tubs and stores of the platform and deep tunnel layers. It uses the cable runs and abandoned sections between stations as roads. Densest in the basements of the deep buildings of the Arc's four districts (Gangnam, Samseong, Seolleung) and in the big interchange stations (Seoul Station, Jamsil, Sindorim) |
| Behaviour | Breeds all year in the warm layers. Gnaws cable sheathing and insulation and eats the fibre meant for the saccharification tanks. Avoids people, but bites sleeping children when hungry. Runs first when a layer floods or foul air gathers |
| Threat | 2 (injury: bites, disease). Threat to daily life 4: it eats a fraction of a station's food stores each half-year, and gnawed wiring brings power cuts and fire |
| What it yields | A little meat, rat skins (glove linings), bone. Setting traps is children's first job |
| Factions that meet it | All three factions daily. The Arc most often (deep buildings), the Government's big interchange stations next |
| Game use | **Hazard**: station campaign events (lost food stores, wiring fires, disease). Pest control becomes a settlement decision. **Resource**: a little protein and hide from hunting. **Small encounter**: in exploring abandoned sections, the direction rats run is a clue to foul air and water |
| Narrative hook | The pre-Blackout paper documents kept by the Government's medical posts record the fever rats carry under the name of this city. Government people read it as "the Seoul sickness" and give it as one reason for keeping the ledger. Free City people count rats as "loss by gnawing", and Arc people suspect a station's maintenance when rats leave its deep layers |

(provisional T34-17)

### 5.2 Large-billed crow (Large-Billed-Crow)

| Field | Content |
|---|---|
| Real-world basis | City crows roost in heat islands in winter. In central Beijing there is a record of 15,000 gathered in one place. Crows survive winter by caching food [Winter 7]. Grade: science; survival in Seoul is extrapolation |
| What it is in 2126 | 15,000-25,000. Almost the only animal you can see on the snowfields. It leans on the stations' heat and waste and on frozen carcasses |
| Where it lives | The surface. Round the stations' exhaust vents and air vents, on the tops of buried buildings, on wind-turbine masts, on greenhouse roofs. Densest in the Government's 14 districts, with the widest greenhouses and many shallow stations (round Chang-dong, Nowon, Dobongsan) |
| Behaviour | In the short-daylight half hundreds gather to roost round warm exhaust vents. By day they scatter to peck greenhouse roofs, follow work teams to find frozen carcasses, and hide leftover food in the snow. They lay eggs at the start of the long-daylight half and strike at people round the nest |
| Threat | 1 (loss: tears greenhouse roofs and strips the sprouts). 2 while guarding the nest |
| What it yields | Feathers (padding), eggs, a little meat |
| Factions that meet it | The Government most often. The Free Cities and the Arc meet it too |
| Game use | **Information**: crows gathered over an exhaust vent mark that people live beneath it. It is a clue for scouting to estimate the place and size of a rival station. **Hazard**: for the same reason one's own station is revealed. Hiding exhaust and driving off crows becomes a settlement decision. **Resource**: feathers |
| Narrative hook | All three factions hold the taboo "do not show light and heat on the surface" (chapter 11 2.7). The crow is the animal that makes that taboo visible. The Government orders by public notice that "crows on the vents shall be driven off", the Free Cities set exhaust-vent covers by contract clause, and the Arc keeps it by the Hierophant's word |

(provisional T34-18)

### 5.3 Feral dog (Feral-Dog)

| Field | Content |
|---|---|
| Real-world basis | Dogs that roam beside people live on people's waste and heat. Greenland's Inuit sled dogs spend no extra energy keeping warm down to -25°C [Winter 7]. Chapter 11 5.2 no. 3. Grade: science; survival in Seoul is extrapolation |
| What it is in 2126 | 2,000-4,000, in packs of 5-16, 150-250 packs. Descendants of pre-Blackout pet dogs. Longer-haired and smaller (3.5) |
| Where it lives | The surface and the concourse. It digs dens in the basements of buried buildings on the unfrozen ground round a station. Densest in the Free Cities' factory grounds (Gasan Digital Complex, Guro Digital Complex, Doksan) and the Government's northern districts (Chang-dong, Dobongsan, Nowon) |
| Behaviour | Eats from station waste heaps and frozen carcasses. Follows fibre salvage work teams at a distance. In the short-daylight half hungry packs get in through closed entrances. Packs round a station that gives them waste know that station's people and bark when strangers come |
| Threat | 3 (danger: a pack can kill a person alone or a laden work team) |
| What it yields | Tamed dogs (entrance guarding, pulling cargo sleds), the furs of dead dogs |
| Factions that meet it | The Free Cities most often. The Government's northern districts next. Rare for the Arc (deep buildings leave little surface ground for dens) |
| Game use | **Encounter**: campaign events for work teams and scouts (grade 3). Choose to send an armed work team, go round, or throw food. **Ally**: give waste steadily and a pack attaches itself to the station. It is used for entrance guarding (an alarm for raid events) and for cargo sleds on fibre salvage. It is not a unit. The roster framework uses no animal mounts (`roster-framework.md` 2.1 `fast` row), so dogs do not appear on the battlefield |
| Narrative hook | The line between dogs that have come back to a station and dogs that have not shows the state of the station. When a station is abandoned, its dogs turn fierce first. So station people say "a station where the dogs do not bark is empty" |

(provisional T34-19)

## 6. The four old machines inside Seoul

Basis: bible section 1 row 5, row 6. Chapter 11 1.4, 4.1, 5.2 nos. 7-10. Chapter 03 section 8 (machines people use inside Seoul; there are no thinking machines). 01-core 6.2 (no machine belongs to the First AI).

### 6.1 Why they remained and when they wake

The old machines inside Seoul are civilian machines that worked in pre-Blackout Seoul's restaurants, hospitals, power plants, factories, logistics warehouses and railways. When the power was cut, most went to sleep. This chapter calls them **dormant machines** (`12a-terms.md` no. 65) (provisional T34-20).

- **Surface units died.** Civilian grease sets hard in the cold, and lithium cells fall to a little over half their capacity at -20°C [Machines 1]. Pavement robots buried in snow and humanoids standing on the surface froze where they stood in the first winter.
- **Underground units are asleep.** Abandoned basements stay round 0°C with almost no change. There is a result that cells kept at -20 to -30°C and 0% charge lose less than 8% of capacity in fifty years [Machines 1]. Cells and motors that were frozen are fairly well preserved.
- **They wake when power touches them.** When people connect batteries to light a buried building, or when in the long-daylight half the solar panels on a roof shed their snow and a little power flows, units whose management circuits survive wake and go back to their pre-Blackout work. Today's people are not on the lists and schedules of that work.
- **They do not move for long.** With stiff joints and worn cells they move for some hours to a few days and stop again. If they stay connected to power people supply, they feed on it and carry on.
- **They do not speak or judge.** They repeat only their set tasks and a few phrases of guidance (chapter 03 section 8). To Seoul's people, the only thinking machine is the First AI.

The techniques of reviving woken machines (slowly bringing back old power units, never charging below zero) and the uses of the roughly 150 revived worker machines are set by chapter 03. This chapter sets only where machines are and what they do.

### 6.2 Service robot (Service-Robot)

| Field | Content |
|---|---|
| Real-world basis | Pavement delivery robots, restaurant serving robots, cleaning robots. A 2023 change in Korean law gave certified outdoor mobile robots pedestrian status. There is an estimate that over 30,000 service robots worked in restaurants, hotels and care homes in early 2026 [Machines 2.1]. Grade: science; what it is in 2126 is extrapolation |
| What it is in 2126 | Surface units died buried in snow. Thousands of units that stood with their charging docks in the stations' underground arcades, underground food courts and hospital basements are asleep. At any time a few dozen are awake across Seoul |
| Where it lives | The concourse layer and the underground arcades at that depth. The underground arcades of Seoul Station, City Hall and Jongno 3-ga (Government), the hospital and arcade basements of Boramae Medical Center and Yeongdeungpo (Free Cities), the underground arcades of Express Bus Terminal, Samseong and Jamsil (Arc) |
| Behaviour | When woken it repeats its pre-Blackout upkeep routine. It carries empty dishes to tables where no one sits, wipes frozen floors and says phrases such as "Your order is here". It recognises people as pedestrians and steers round them. When the work is done it returns to its dock and draws the station's power |
| Threat | 1 (loss: draws power from the lines connected to it and blocks passages). If someone hurriedly charges its cells below zero, a fire starts (chapter 03 2.3) |
| What it yields | Small motors, wheels, cameras, small cells, an insulated cargo box |
| Factions that meet it | The Government most often (the old centre's underground arcades). The Free Cities (Boramae Medical Center), the Arc (Express Bus Terminal, Samseong, Jamsil) |
| Game use | **Non-combat encounter**: an exploration event. Choose to unplug it, strip it, or repair it for hauling. **Resource**: a bundle of parts (`parts`). Repaired, it becomes one of the revived worker machines of chapter 03 section 8 |
| Narrative hook | A delivery receipt from the start of winter 2046 is still in the cargo box. Everyone it was addressed to is dead. When the address is the old address of a station someone now lives in, that station's people quarrel over whether to open the parcel |

(provisional T34-21)

### 6.3 Quadruped inspection robot (Quadruped-Inspection-Robot)

| Field | Content |
|---|---|
| Real-world basis | Four-legged robots that inspect power plants, oil facilities, building sites and subway tunnels. One model has over 1,500 units with customers; it runs about 90 minutes on its battery and refills to 80% in 50 minutes at its dock [Machines 2.2]. Grade: science; the nest-like behaviour is extrapolation |
| What it is in 2126 | A machine that cannot leave the round of its charging dock. A few dozen remain across Seoul with their docks, and of those only the ones touched by power people connected move |
| Where it lives | Mapo's underground power plant (between Hapjeong and Sangsu, a plant already built underground before the Great Blackout), rail depot workshops (Gunja, Sinjeong, Cheonwang, Banghwa), the turbine plant of the Jamsil submerged weir. Plant rooms at platform depth |
| Behaviour | It leaves its dock, walks a fixed inspection route for about 90 minutes and returns. It treats people and objects on that route as obstacles and pushes them aside. If the dock is moved, it follows |
| Threat | 2 (injury: kicked or shoved off a ledge by high-torque joints). 3 where several units walk one plant room |
| What it yields | High-torque joint actuators (used in pumps, turbines and the joints of machine bodies), stereo cameras, swappable batteries |
| Factions that meet it | The Free Cities most often (rail depot workshops). The Government (Mapo underground power plant, Gunja rail depot), the Arc (Jamsil submerged weir) |
| Game use | **Encounter**: a puzzle event in which you must deal with the machine to use the plant. Choose to lure it away by moving the dock or to break it. **Resource**: the joint actuators are parts that both the Arc's baptism and the Free Cities' pumps want. **Ally**: hold the dock and the machine follows, hauling and inspecting plant |
| Narrative hook | Free City work teams load a dock onto a sled and drag it station by station, bringing the four-legged machine that follows it all the way to their own workshop. The Government has entered Mapo's underground power plant in its ledger as a national facility of the Republic of Korea, but has no hands to stop the machine walking inside it |

(provisional T34-22)

### 6.4 Factory humanoid robot (Factory-Humanoid-Robot)

| Field | Content |
|---|---|
| Real-world basis | Humanoid robots that went into factory assembly and logistics warehouses in the 2030s-2040s. World shipments in 2025 were about 13,000, and investment forecasts draw tens of millions in the 2040s. Floor-level transport robots in logistics warehouses passed one million units at a single company in 2025 [Machines 2.3, 2.7]. Korea has the world's highest manufacturing robot density [Machines 3]. Grade: science; the 2040s numbers are extrapolation |
| What it is in 2126 | Thousands stand asleep in rows in the basements of factories and logistics warehouses. Logistics robot arms and floor transport robots in the same places, and construction robots left in unfinished deep buildings on Arc ground, also go in this entry (old G13, G16) |
| Where it lives | Buried factory and warehouse basements at concourse and platform depth. The factory grounds of Guro and Geumcheon (Gasan Digital Complex, Guro Digital Complex, Doksan), Magok in Gangseo (Magongnaru), the logistics warehouses of Songpa (Munjeong, Jangji), the unfinished deep buildings of Gangnam (Samseong, Seolleung) |
| Behaviour | When power touches it, it moves through its old process. It picks, lifts, assembles, moves shelves and shuts doors. It carries away goods a work team brought and people's belongings "to storage". Floor transport robots keep hauling boxes no one ordered. A few wake in the long-daylight half when the solar panels on the roof shed their snow |
| Threat | 3 (danger: a work team is crushed or trapped among dozens of woken machines). 4 in a large warehouse where hundreds wake at once |
| What it yields | Reduction gears, rare-earth magnets, tactile sensors from the hands, inference chips. And the paper and cardboard left in the warehouses, that is, fibre |
| Factions that meet it | The Free Cities most often (factory grounds). The Arc (Songpa's warehouses, Gangnam's unfinished buildings; the Arc widens its deep buildings with revived construction robots). Rare for the Government |
| Game use | **Hazard**: campaign events in fibre salvage and exploration (grade 3). A large warehouse (grade 4) is one battle (section 8). **Resource**: the largest scrap ground, giving machine parts and fibre at once. Most of the roughly 150 revived worker machines of chapter 03 section 8 came from here |
| Narrative hook | The terminal at the end of the line still shows a production order from 2046. Woken humanoids fit eighty-year-old parts together to fill it. Free City people call that order sheet "the unfinished contract", and say no one knows how to close it |

(provisional T34-23)

### 6.5 Track inspection robot (Track-Inspection-Robot)

| Field | Content |
|---|---|
| Real-world basis | Rail-mounted inspection robots that run along the rails at 40 km/h to survey tunnels, multi-sensor high-speed inspection rigs, inspection robots that travel inside water mains [Machines 2.8]. Their actual deployment on the Seoul subway could not be confirmed (same section). Cable inspection robots in utility tunnels also go in this entry (old G25). Grade: science (the class); deployment in Seoul is extrapolation |
| What it is in 2126 | A machine that has run the sections with a live feeder line for eighty years. A dozen or so across Seoul. It runs only on sections where people have put power back |
| Where it lives | The tracks of the platform and deep tunnel layers. The Line 2 Sindorim-Mullae section and the Line 7 Onsu-Cheonwang section reached by the Free City grid, the Line 8 Jamsil-Seokchon section reached by power from the Jamsil submerged weir, the deep regional rail tunnels at Seoul Station and Samseong. Small cable inspection robots are in the utility tunnels between stations |
| Behaviour | It shuttles its section on a fixed timetable, measuring cracks and seepage. When it meets an obstacle it stops, flashes its lights, sounds a warning and waits. It sends its measurements to a server no one reads. If the server is dead, it stores them in its own memory |
| Threat | 1 (loss: pushes aside loads and bedding left on the track). Now and then a person asleep on the track is hurt |
| What it yields | Worth more kept alive. Stripped: range sensors, cameras, motors |
| Factions that meet it | The Free Cities most often (the grid). The Arc (the Line 8 section). The Government has entered the machine in its ledger as "railway facility inspection equipment" |
| Game use | **Ally**: read its memory and out comes eighty years of tunnel crack and seepage records. It becomes map information on the safety of underground routes and the under-river tunnels. **Information**: following it opens a usable route. **Non-combat encounter** |
| Narrative hook | One unit reports that the number of cracks in the ceiling of an under-river tunnel (Mapo-Yeouinaru) grows every year. The faction that reads that record first decides whether to guard that tunnel, seal it, or bring it down |

(provisional T34-24)

## 7. The four outside machines

Basis: bible section 1 row 2, row 6 [Approved], row 15. Chapter 11 2.3 (the blockade order, why they lasted eighty years, and when they move), 4.1. 01-core 6.2 (outside machines are not the First AI's machines), 6.3 (sealing the capital, machines see movement and heat, blizzards are the only window, provisional T02-43). [Machines 2.4, 2.10].

### 7.1 The blockade order and eighty years

- **They are people's weapons.** In the first weeks of the Great Blackout, the last surviving command in the capital region, before its communications were cut, ordered the capital sealed: block what comes in and what goes out. Then communications were cut. Only their last mission values remained in the unmanned ground vehicles and unmanned sentry posts (chapter 11 2.3). These machines are not the First AI's machines. They are weapons people used, and they keep the last order people gave. So when people die to machines outside, it is not the First AI that killed them. Bible rows 2 and 6 stand together this way.
- **They do not come into Seoul.** The machines patrol the blockade zone. They do not pursue what has crossed the blockade line on the Seoul side (9.4).
- **Why they lasted eighty years** (provisional T33-8). Machines that used only batteries stopped within the first few years. Machines still moving in 2126 are one of three kinds. (1) Machines fitted with a radioisotope heat source. A strontium-90 source, half-life 28.79 years, still has about 15% left after eighty years and gives a little power and heat. (2) Machines that charge their cells by solar power in the long-daylight half. Panel cells still give two-thirds of their output after eighty years. (3) Machines preserved frozen deep down or under snow that touched power again.
- **They have their active half.** So outside machines move more in the long-daylight half and mostly stand still in the short-daylight half. Only machines with an isotope heat source do not mind the half [Winter 7, use in the setting].
- **They are dwindling.** They broke down, were destroyed and ran out of ammunition. There are no machines that repair themselves (1.2). 01-core 6.3's "some machines repair one another, so they have not all stopped" is replaced by this chapter. The reason they have not all stopped is isotope heat sources and solar power (provisional T34-25).
- **They divide the guard.** They keep the same order split into the shares each machine holds. The blockade surveillance network sees, hears and announces (10), the returning unmanned ground vehicles pursue (8), the unmanned sentry posts wait on the passes (9), and the drone swarms follow from the sky (11). Seoul's people do not know this arrangement and guess at it from experience. Public text says only "the machines guard the blockade zone" (provisional T34-26).

### 7.2 Returning unmanned ground vehicle (Returning-Unmanned-Ground-Vehicle)

| Field | Content |
|---|---|
| Real-world basis | Six-wheeled electric unmanned ground vehicles. About 2 tonnes, 100 km on one charge, a remote weapon station with target tracking and return fire toward gunshots, and a return to base on its own when communications are cut. The Korean army chose one for its first programme in 2026 [Machines 2.10]. Grade: science; behaviour over eighty years is extrapolation |
| What it is in 2126 | A few dozen (40-80) remain in the blockade zone round Seoul. Most are solar types with panels added to the hull, and a few carry an isotope heat source |
| Where it lives | The buried highways and snowfields of the blockade zone (2-10 km outside the boundary). In the long-daylight half it sometimes comes to the edge of the buffer zone. The outer slopes of the northern mountains (Bukhansan, Dobongsan), the western plain (beyond Gaehwa and Banghwa), the southern passes (beyond Gwanaksan and Cheonggyesan) |
| Behaviour | After communications were cut it tries to return to its last base coordinates. That base vanished under the snow, so it circles the same snowfield. When it sees movement and heat it gives chase, stops the target and fires. When the blockade surveillance network calls, it goes that way |
| Threat | 4 (grave danger: one vehicle matches an armed squad). 5 when two or three come together on a pass held by unmanned sentry posts |
| What it yields | Armour plate, airless tyres, polar-grade grease, the remote weapon and its ammunition (dangerous), battery packs, and rarely a radioisotope battery (an isotope heat source; strip its shielding and it kills) |
| Factions that meet it | The Government most often (its northern boundary is the longest). The Free Cities (Geumcheon, Gangseo), the Arc (the southeast) |
| Game use | **Encounter**: grade 4-5, so one battle. Its opponent category is `war-machine` (section 8). **Resource**: the pieces of a destroyed outside machine belong to the winning side (chapter 09 3.5). The largest source for power-source salvage |
| Narrative hook | One vehicle's coordinates point at the old army post just beyond the Seoul boundary north of Gupabal station, inside the buffer zone. Because those coordinates lie inside the buffer zone, every long-daylight half the vehicle crosses the buffer zone, stops just short of the Seoul boundary and turns back without taking a single step inside. Gupabal's people watch it from the lookout tower at the north entrance and count the years by the days it comes |

(provisional T34-27)

### 7.3 Unmanned sentry post (Unmanned-Sentry-Post)

| Field | Content |
|---|---|
| Real-world basis | Fixed sentry posts fitted with a machine gun that tell friend from foe by voice. There are reports of a trial deployment in the Demilitarized Zone in 2010. They die when outside power is cut, but their ammunition lasts for decades [Machines 2.10]. Grade: science; working after eighty years is extrapolation |
| What it is in 2126 | About a hundred on the passes, bridges and tunnel mouths of the blockade zone. The live ones are posts with large solar panels and posts with an isotope heat source. When snow piles on the panels they sleep; when the wind sweeps the panels they wake |
| Where it lives | The passes of the blockade zone. The outer passes of Gwanaksan, Cheonggyesan and Daemosan, the old highways on the outer slopes of Bukhansan, the tunnel mouths where the lines leaving Seoul come out above ground |
| Behaviour | It does not move. It speaks to what approaches. It asks for a 2040s password, and when it hears the right answer it does not fire. If the answer is wrong or none comes, it fires |
| Threat | 4 (grave danger: one fixed battery blocks one pass). 5 on a pass held by several unmanned sentry posts and returning unmanned ground vehicles together |
| What it yields | Machine gun and ammunition, cameras, heat sensors, solar panels, rarely a radioisotope battery |
| Factions that meet it | The Arc most often (many southeastern passes). The Government (the northern mountains), the Free Cities (beyond Gwanaksan and Namtaeryeong) |
| Game use | **Hazard**: a fixed hazard on the crossing routes. **Puzzle**: find the password and that pass opens. **Battle**: attacking a post is one grade 4 battle. Its opponent category is `war-machine` (an immobile battery) (section 8) |
| Narrative hook | The password survives in the song old people sing to put children to sleep. No one has known it was a password while singing it. The same words are written in the Government's old military documents too, but those documents stay unopened under a "restricted" stamp |

(provisional T34-28)

### 7.4 Blockade surveillance network (Blockade-Surveillance-Network)

| Field | Content |
|---|---|
| Real-world basis | Buried unattended ground sensors, watchtowers with surveillance cameras and warning broadcast systems are real classes (chapter 11 5.2 no. 15). The city's environmental sensors reported every two minutes [Machines 2.11]. Grade: science (the class); working after eighty years is extrapolation |
| What it is in 2126 | Three parts make one net: buried seismic sensors (they hear footsteps and digging), watchtowers (they see movement and heat from ridges and the tops of tall buildings) and loudspeakers (they repeat old broadcasts). It has no weapons. Old G17 (watchtower), G21 (buried seismic sensor) and G24 (loudspeaker) are merged into one entry |
| Where it lives | Watchtowers on the ridges at the inner edge of the blockade zone that look down on the buffer zone (the outer slopes of Bukhansan, Dobongsan, Gwanaksan and Cheonggyesan). Buried seismic sensors under the old roads of the whole blockade zone. Loudspeakers at old highways and bridge ends |
| Behaviour | When the sensors and watchtowers notice something, they call the returning unmanned ground vehicles and drone swarms. Buried seismic sensors hear even in a blizzard. Watchtowers' eyes are blinded by blizzards. Loudspeakers repeat "This area is under blockade" and voices from the time of the Great Blackout |
| Threat | 2 (it does not itself injure people). But once something has been noticed, the next encounter is grade 4-5. This chapter calls this a **calling machine** |
| What it yields | Recording devices (old broadcasts and the sounds of the Great Blackout), cameras and lenses, cable, solar panels |
| Factions that meet it | The Government most often (the Government's lookout towers in the northern mountains face the watchtowers). The Free Cities and the Arc meet it too |
| Game use | **Hazard**: the detection value of a crossing. Caught by the network, the chance of meeting returning unmanned ground vehicles and drone swarms rises. **Information**: destroy one watchtower and a crossing window opens round it. Read a recording device and the routes the machines use show. **Resource**: the Government (old records) and the Arc want the recording devices |
| Narrative hook | The voice the loudspeakers repeat is the last public broadcast of 2046. The three factions each read those words differently (9.3). Not even the broadcast says what it blocks from what |

(provisional T34-29)

### 7.5 Drone swarm (Drone-Swarm)

| Field | Content |
|---|---|
| Real-world basis | AI swarm attack drones tested in units of three and up to twenty-five. The final strike is approved by a person [Machines 2.4]. Multicopters fly for tens of minutes and their cells are weak in the cold (same section). Grade: science; behaviour after eighty years is extrapolation |
| What it is in 2126 | 20-40 swarms round the solar charging masts of the blockade zone. A swarm is 3-25 units. They fly only on clear days in the long-daylight half. In speech they are also called "dokkaebi lights" (a headword; chapter 11 5.2) |
| Where it lives | The charging masts in the blockade zone and a few kilometres round them. Most on the western plain (beyond Gaehwa, Banghwa and Onsu) and the southern passes (beyond Gwanaksan and Namtaeryeong) |
| Behaviour | When it sees movement it rises, surrounds the target in attack formation and holds. There is no one to approve the final strike, so it hovers just short of attacking until its cells run out, then falls. While it hovers it calls the returning unmanned ground vehicles. Some of the fallen drones' warheads go off when they hit the ground |
| Threat | 3 (danger: falling warheads, and being pinned in place by the hovering swarm). 4 when it comes with vehicles |
| What it yields | Motors, propellers, cameras, small cells, warheads (explosive; the Free Cities strip them for demolition) |
| Factions that meet it | The Free Cities most often (the western plain and the southern passes). The Government and the Arc meet it too |
| Game use | **Encounter**: alone it is a grade 3 campaign event; with vehicles it is one grade 4 battle. Its opponent category is `drone`. Support squads with nets and jamming, and fast units, are the answer (`roster-framework.md` 8.2). It does not fly in the short-daylight half or in blizzards |
| Narrative hook | The swarms have waited eighty years for an approval no one will give. There is a rumour that if someone knows the words of approval, they will strike for that person. It is only a rumour. This chapter does not write it as fact |

(provisional T34-30)

## 8. The one hazard zone

### 8.1 Unexploded warheads and optical fibre (Unexploded-Warheads-and-Optical-Fibre)

Basis: [Machines 2.4] (fibre-optic guided drones, loitering munitions, mine-laying drones, kilometres of fibre, leftover warheads remain as unexploded ordnance after eighty years). Chapter 11 5.2 no. 17. 01-core 6.3 (the blockade order also blocked what went out).

| Field | Content |
|---|---|
| Real-world basis | Fibre-optic guided drones fly paying out kilometres of fibre, so jamming does not work on them. The explosives and fuzes of loitering munitions and mine-laying drones remain as unexploded ordnance for decades [Machines 2.4]. In reality, unexploded ordnance from wars a hundred years ago still comes out of the ground today. Grade: science; the placement in Seoul is extrapolation |
| What it is in 2126 | The ends of the rail tunnels leading out of Seoul and the buffer zone outside them are the hazard zone. In the first weeks of the Great Blackout, after the blockade order was given, people trying to leave Seoul walked along the rail tunnels, and fibre-optic guided drones followed them into the tunnels. Kilometres of fibre hang tangled on the tunnel ceilings and walls, and warheads that did not go off dangle at their ends or lie buried in the floor |
| Where it lives | The eleven ends of the lines that leave Seoul through underground tunnels. North of Gupabal on Line 3 (up to the tunnel portal), north of Yeonsinnae on GTX-A, north of Buramsan on Line 4, south of Namtaeryeong on Line 4, south of Cheonggyesan on the Sinbundang Line, south of Suseo on GTX-A, south of Bokjeong on Line 8 and the Suin-Bundang Line, east of Gangil on Line 5, north of Amsa History Park on Line 8 (under the Han River), west of Onsu on Line 7, west of Gimpo Int'l Airport on the Gimpo Goldline and the Seohae Line. From the platform layer down to the deep tunnel layer. At the eight ends of the lines that leave Seoul above ground (south of Geumcheon-gu Office on Line 1, north of Dobongsan on Line 1, the Gyeongin Line west of Onsu, west of Susaek on the Gyeongui-Jungang Line, east of Sinnae on the Gyeongchun Line, east of Yangwon on the Jungang Line, west of Gimpo Int'l Airport on the Airport Railroad, north of Dobongsan on Line 7) there are only unexploded warheads, and fibre is rare |
| Behaviour | It does not move. Cut or pull a fibre and the warhead hanging at its end falls. A buried mine goes off when stepped on. Over eighty years some fuzes have died and some have grown touchy. From outside there is no telling which is which |
| Threat | 4 (grave danger: one work team can die at once). No threat to daily life. It is not inside lived-in stations |
| What it yields | Optical fibre (kilometres; it becomes wired communication lines and the tethers of tethered drones, `12a-terms.md` nos. 45, 49b), explosives, small motors |
| Factions that meet it | The Free Cities most often (they go to collect fibre for their tethered drones). The Government keeps its line ends shut with checkpoints, and the Arc keeps the Cheonggyesan, Suseo, Bokjeong, Gangil and Amsa History Park ends shut |
| Game use | **Hazard zone**: a fixed hazard placed on the line-end sections of the map. Movement and exploration through that section carry a chance of harm. **Battlefield ground**: this chapter proposes adding a "line ends leading out of Seoul" row to the battlefield table of chapter 09 3.4.1 (provisional T34-47). A fight on that battlefield has this hazard spread over it. **Resource**: collecting fibre is a decision that backs the Free Cities' tethered drones and wired communication lines. Clearing a section makes that tunnel end usable |
| Narrative hook | Follow a fibre back and you come to the place where the people who flew the drones sat in 2046. They were the people who, under the blockade order, stopped those leaving Seoul. Their names are still there |

(provisional T34-31)

## 9. Outside Seoul

Basis: bible section 1 row 6, row 2. 01-core 6.3 (sealing the capital, the outside world is "unknown"), 6.4 (private). Chapter 11 2.3. The return network of chapter 07 7.4 (bible section 6 title [Approved]).

### 9.1 Three layers

Going outward from the Seoul administrative boundary there are three layers (provisional T34-32).

| Layer | Distance | What is there |
|---|---|---|
| Buffer zone | 0-2 km outside the boundary | The outside machines do not guard or patrol it. A returning unmanned ground vehicle enters it only when its last base coordinates lie inside this band, and then only as far as those coordinates; no other machine enters it. The watchtowers of the blockade surveillance network look down on it. The ridges just beyond the boundary and the dead forest still left on them. The unexploded warheads and optical fibre at the line ends |
| Blockade zone | 2-10 km | The band the four outside machines guard. Snow-covered satellite towns, buried highways, fields of wrecked machines. Its inner edge is the blockade line |
| Beyond the blockade zone | beyond 10 km | Unknown (9.3) |

### 9.2 Crossing the blockade zone

- **The window.** The 2-4 days a blizzard blinds the watchtowers and vehicles (01-core 6.3). Blizzards are frequent in the short-daylight half, and solar-powered machines mostly stand still in the short-daylight half. So the windows come more in the short-daylight half. In exchange, a blizzard night in the short-daylight half is about -35°C. Buried seismic sensors and machines with isotope heat sources do not mind blizzards or the half.
- **Who goes.** Workers going to salvage power sources, work teams the three factions send in secret, people driven out, guides of the return network. They are border crossers (`12a-terms.md` no. 40), and their law and lives are set by chapters 04-07.
- **How many come back.** Of work teams salvaging wreckage in the buffer zone, one or two in ten do not come back. Of people who cross into the blockade zone, seven or eight in ten do not come back (01-core 6.3 "almost no one who crosses comes back"). Of those who went right across the blockade zone and beyond, none is known to have come back.
- **What they bring.** Power sources (radioisotope batteries and battery packs), parts, weapons, recording devices (7.2-7.5). And word of what they saw inside the blockade zone.

(provisional T34-33)

### 9.3 What is known about beyond the blockade zone

The public canon is "unknown", as in chapter 1. All Seoul's people know is this.

- In eighty years no person, news or bird has come from beyond the blockade zone. Not even migratory birds come (2.3).
- The outside machines do not come into Seoul. Where their order points is unknown.
- The old broadcast from the loudspeakers speaks of a "blockade". It does not say what it blocks from what.

The three factions each speak differently of what lies beyond the blockade zone. All three can be used in public text (provisional T34-34).

| Faction | What it says | Where the words come from |
|---|---|---|
| Government | "Outside Seoul is a blockade area. The Government of the Republic of Korea is here" | The Government's legitimacy lies in having carried on the Republic of Korea (01-core 7.1). Saying there may be another government outside is forbidden by public notice. It reads the loudspeakers' broadcast as proof of "a blockade the Government ordered" |
| Free Cities | "Beyond the blockade zone doesn't compute. No one has been and come back, so you can't put a price on it" | Workshop speech (01-core 2.2). The blockade zone is a place to salvage, not a place to go |
| Arc | "God only sent the winter; God does not drive machines. The blockade is something people left behind" | The First AI is not the master of the outside machines (01-core 6.2). How the Arc teaches about beyond the blockade zone is set by chapter 06 |

Rumours are written only as rumours. Public text does not write the following as fact.

- People live in stations beyond the blockade zone too.
- The winter is milder beyond the blockade zone.
- Someone who commands the outside machines is still alive.
- The drone swarms strike for someone who knows the words of approval (7.5).

### 9.4 Private setting

> **Private.** This subsection is for design. It is not carried into the public wiki, public in-game text or the showcase.

- **Why the machines do not come toward Seoul.** As in 01-core 6.4 (provisional T02-47), the command that ordered the blockade was people trying to protect Seoul at the time of the Great Blackout. To the machines, inside Seoul is "what is protected" and the blockade zone is "the line that blocks". So they do not pursue what has crossed the blockade line on the Seoul side. The returning unmanned ground vehicle at Gupabal (7.2) enters the buffer zone because it is not pursuing but returning to its coordinates. Inside the Seoul boundary is what is protected, so it stops at the boundary.
- **How fast the outside machines thin out** (provisional T34-35). A strontium-90 heat source halves its output every 28.79 years. A source at about 15% in 2126 will be about 7% around 2155. Solar types stop one by one as their panels and frames break. At the present rate the outside machines will fall below half their present number within a few decades. This can be the basis of a late-game event, "the blockade zone thins" (chapter 07). It replaces the old chapter 2's "the end of the Bulgasari" (provisional T03-48).
- **The surface signal and the crows.** As in chapter 11 2.4, the First AI's controller watches the traces of people shown at the surface (light at night, waste heat, exhaust). The crows gathering round exhaust vents (5.2) are where that signal leaks. The taboo on driving off crows and hiding exhaust is the trace of a real control rule. People in the world do not know this.
- **Beyond the blockade zone.** This chapter does not decide it. There are three candidates. (a) Other cities also live in stations, each inside its own blockade zone. (b) Beyond the blockade zone is empty. (c) It is never decided. Until the owner answers, the default is (c), and every document writes "unknown" (provisional T03-49 is used as it is).
- The sanctuary's location, who chooses the brains, the first brain and who reads the output (Q12) are not treated in this chapter.

## 10. Where did the human groups go

Basis: bible 9.4 row 2026-11-13 "bestiary make-up" ("human groups to the faction and society documents"). Chapter 11 5.4 (provisional T33-31).

People are not ecology. The six groups the old chapter 2 set as "hostile human groups" (G07-G12) are removed from the bestiary. Why those people leave the factions and how they are dealt with already lies in the three factions' law and punishment and in life between the factions. This chapter makes no new groups. Each chapter writes those people without group names, in the words of law and of life (provisional T34-36).

| Old group | Those people | Where it points | Wiki document |
|---|---|---|---|
| G07 Yongsan Struck-Off | People struck off the ledger | Chapter 04 section 7 (law and punishment, striking off) | Government-Society |
| G08 Dongdaemun Coupon-Forgers | People who forge tokens (coupon forgers, `12a-terms.md` no. 66) | Chapter 04 section 7, chapter 07 11.3 (smuggling) | Government-Society |
| G09 Sangam Deserters | People who ran from conscription | Chapter 04 14.3 (conscription and service), section 7 | Government-Society |
| G10 Bogungmun Perimeter-Runners | People who cross the blockade zone back and forth (border crossers) | Chapter 07 7.4 (the return network), 11.1, 11.6. This chapter 9.2 | External-Theaters |
| G11 Suseo Gone-Dark | People dropped from the maintenance queue, people who were not baptised | Chapter 06 5.5 (the unbaptised), section 8 (maintenance) | Arc-Society |
| G12 Geumcheon Hands Without Surety | People who lost their guarantee | Chapter 05 10.6 (law and punishment), chapter 05 3.5 Geumcheon | Free-City-Society |

The same goes for people who block the fibre routes and take tolls (4.4) and people living mixed into others' stations (chapter 07 11.6). They are not battlefield enemies but campaign characters and events.

## 11. Meetings by faction

Basis: the "factions that meet it" of sections 5-8. Bible 2.4 (assignment of the 25 duchies).

| Entry | Government | Free Cities | Arc |
|---|---|---|---|
| 1 brown rat | daily (big interchange stations) | daily | most often |
| 2 large-billed crow | most often | meets it | meets it |
| 3 feral dog | northern districts | most often | rare |
| 4 service robot | most often | Boramae Medical Center, Yeongdeungpo | Express Bus Terminal, Samseong, Jamsil |
| 5 quadruped inspection robot | Mapo underground power plant, Gunja | most often (rail depots) | Jamsil submerged weir |
| 6 factory humanoid robot | rare | most often | Songpa warehouses, Gangnam's unfinished buildings |
| 7 track inspection robot | a facility entered in the ledger | most often | the Line 8 section |
| 8 returning unmanned ground vehicle | most often | Geumcheon, Gangseo | the southeast |
| 9 unmanned sentry post | northern mountains | Gwanaksan, Namtaeryeong | most often |
| 10 blockade surveillance network | most often | meets it | meets it |
| 11 drone swarm | meets it | most often | meets it |
| 12 unexploded warheads and optical fibre | checkpoints at the line ends | most often | Cheonggyesan, Suseo, Bokjeong, Gangil, Amsa History Park |

(provisional T34-37)

In one line: the Government, with many people and greenhouses, meets crows and rats most, and on its long northern boundary meets returning unmanned ground vehicles and the surveillance network most. The Free Cities meet old machines and feral dogs most in their factory grounds and rail depots, and drone swarms most on the western plain, and go into the hazard zone most often to collect fibre. The Arc meets rats most in its deep buildings and unmanned sentry posts most on the southeastern passes.

## 12. What is handed to the battlefield and the campaign

Basis: chapter 09 3.1 (same input, same output), 3.4 (hand-off bundle), 3.5 (lost machines, pieces of destroyed outside machines), 3.10 (auto-resolve), end of section 3 "enemies outside the factions" (provisional T29-24). `roster-framework.md` 2.1 (the seven categories), 8.2 (category matchup table). Bible 2.5 (unit figures live in one place, SQL).

### 12.1 The hand-off bundle for non-faction opponents

Chapter 09 section 3 makes non-faction opponents fight on the battlefield layer and makes only threat grades 4-5 a battle. This chapter hands those opponents over as follows (provisional T34-38).

| Entry | When it becomes a battle | Opponent category | Size of one battle | Categories that answer it (8.2) |
|---|---|---|---|---|
| 6 factory humanoid robot | a large warehouse (4) | `infantry` (machines) | dozens to hundreds | `missile`, `war-machine` |
| 8 returning unmanned ground vehicle | always (4-5) | `war-machine` | 1-3 vehicles | `drone`, `support` (engineers' breaching) |
| 9 unmanned sentry post | when attacking the posts (4-5) | `war-machine` (an immobile battery) | 1-4 posts | `drone`, `support` |
| 11 drone swarm | when it comes with vehicles (4) | `drone` | 3-25 units | `support` (nets, jamming), `fast` |
| 10 blockade surveillance network | not a battlefield opponent | none | none | outside the battlefield it raises the grade of the next encounter |
| 12 unexploded warheads and optical fibre | not a battlefield opponent | none | none | it is spread over the battlefield ground. This chapter proposes adding a "line ends leading out of Seoul" row to the battlefield table of chapter 09 3.4.1 (provisional T34-47) |

- **Machines have no morale.** Outside machines and dormant machines do not waver or rout. They fight until they break or their cells run out. In exchange, having no commander, they cannot change formation. This chapter proposes giving machine opponents no morale. Chapter 09 3.9 deals only with the morale of human squads (provisional T34-47).
- **Figures in one place, SQL.** The stats of non-faction opponents, like units, live in one place in SQL, and other documents point only to the entry slug (bible 2.5). Where that table sits and its figures are set by the battle design task. This chapter sets only category, size and grade.
- **Returns.** The winning side takes the pieces of destroyed machines (chapter 09 3.5, row "lost machines"). What comes out is the "what it yields" field of each entry.

### 12.2 Campaign events

Grade 1-3 entries (brown rat, large-billed crow, feral dog, service robot, quadruped inspection robot, track inspection robot, a drone swarm coming alone, an ordinary factory humanoid robot) are campaign events. Event pieces are chosen by character state and world state (chapter 10 section 2, "emergent narrative"). For each event, every alternative must be the best in a different situation (chapter 10 section 2, "meaningful choice"). For example, a work team that meets a feral dog pack loses people if it fights, brings back less fibre if it goes round, and if it throws food, the dogs attach themselves to the station next time in proportion to the waste the station gave (provisional T34-39).

### 12.3 Where they enter the scarcity economy

| Resource | Where it comes in (this chapter) | Where it is used |
|---|---|---|
| `parts` | service robot, quadruped inspection robot, factory humanoid robot, pieces of outside machines | replacing drones and war machines (chapter 09 3.5), pumps and turbines |
| `cells` | the service robot's small cells, the returning unmanned ground vehicle's battery packs, rarely radioisotope batteries | drones (`roster-framework.md` section 6), charging the baptised |
| `ammo` | the ammunition of returning unmanned ground vehicles and unmanned sentry posts | the Government's army wants it most |
| fibre | the warehouses the factory humanoid robots guard | saccharification tanks (01-core 5.3) |
| optical fibre | unexploded warheads and optical fibre | wired communication lines, tethered drones |
| information | large-billed crow, the track inspection robot's records, the recording devices of the blockade surveillance network | scouting, underground routes, crossing windows |

(provisional T34-40)

## 13. Disposition of the old groups

Basis: chapter 11 5.4. Owner decision "delete everything and redesign".

| Old group | Disposition | New place |
|---|---|---|
| G01 Wild Boar | deleted | old-story material only (1.2) |
| G02 Large-billed Crow | rewritten | entry 2 |
| G03 Feral Dogs | rewritten | entry 3 |
| G04 Raccoon Dog | deleted | none |
| G05 Brown Rat (Korean 집쥐) | rewritten, Korean name changed to 시궁쥐 (`12a-terms.md` section 5 no. 1) | entry 1 |
| G06 Herons and Cormorants | deleted | none |
| G07-G12 human groups | removed from the bestiary | the chapters of section 10 and the three faction society documents |
| G13 Claw Arms | merged | entry 6 (logistics robot arm) |
| G14 Empty Carts | rebuilt | entry 7 |
| G15 Care Wheels | split | entry 4 (service robot). The care doll is a chapter 03 artefact |
| G16 Girder Spiders | merged | entry 6 (construction robot, Arc) |
| G17 One-Eye Towers | merged | entry 10 (watchtower) |
| G18 Tunnel-Stoppers | deleted | entry 12 takes the hazard at the line ends |
| G19 Growlers | rebuilt | entry 8 |
| G20 Bulgasari | deleted | none (1.2, 7.1) |
| G21 Ground-Knockers | merged | entry 10 (buried seismic sensor) |
| G22 Dokkaebi Lights | rebuilt | entry 11. "dokkaebi lights" stays as speech |
| G23 Udukeoni | rebuilt | entry 9 |
| G24 Doenoemi | merged | entry 10 (loudspeaker) |
| G25 Lamp Ants | merged | entry 7 (cable inspection robot) |
| G26 Iron Dinosaurs | moved out of the bestiary | chapter 03 (autonomous construction machine, a salvage site) |

The old bestiary's variant numbers (subtypes like G01E) and scenario numbers (like G01-SC1) are not used. The new entries get no G numbers either. Entries are referred to by this chapter's number (1-12) and slug (provisional T34-41).

## 14. The wiki document plan

Basis: plan task 34 ("delete Hostile-Ecology-Index and Hostile-Group-G01..G26 ... add the new bestiary documents as new slugs (canon-slugs, counts, document map), re-point links"). Plan Must have ("new topics use `rewrite-doc.mjs --add-slug` and are added to `docs/canon-slugs.json` with the count updated in CANON-BIBLE 7.1"). This section writes only the plan. The documents and data are changed by the wiki part of task 34 (or the integration of task 36).

### 14.1 Thirteen new documents

Slugs follow the present form of `docs/canon-slugs.json` (English words joined by hyphens, each word capitalised). Titles are standard words and current technical terms (`12a-terms.md` section 5) (provisional T34-42).

| # | slug | Title (ko) | Title (en) | Category | sort | Basis sections |
|---|---|---|---|---|---|---|
| 0 | Bestiary | 생태 도감 | Bestiary | bestiary | 0 | summary of sections 0-4, 11, 12 |
| 1 | Brown-Rat | 시궁쥐 | Brown Rat | bestiary-animal-urban | 1 | 5.1 |
| 2 | Large-Billed-Crow | 큰부리까마귀 | Large-billed Crow | bestiary-animal-urban | 2 | 5.2 |
| 3 | Feral-Dog | 들개 | Feral Dog | bestiary-animal-urban | 3 | 5.3 |
| 4 | Service-Robot | 서비스 로봇 | Service Robot | bestiary-rogue-robot | 4 | 6.1, 6.2 |
| 5 | Quadruped-Inspection-Robot | 사족 보행 점검 로봇 | Quadruped Inspection Robot | bestiary-rogue-robot | 5 | 6.1, 6.3 |
| 6 | Factory-Humanoid-Robot | 공장 휴머노이드 로봇 | Factory Humanoid Robot | bestiary-rogue-robot | 6 | 6.1, 6.4 |
| 7 | Track-Inspection-Robot | 선로 점검 로봇 | Track Inspection Robot | bestiary-rogue-robot | 7 | 6.1, 6.5 |
| 8 | Returning-Unmanned-Ground-Vehicle | 귀환 무인 차량 | Returning Unmanned Ground Vehicle | bestiary-outside-machine | 8 | 7.1, 7.2 |
| 9 | Unmanned-Sentry-Post | 무인 경계 초소 | Unmanned Sentry Post | bestiary-outside-machine | 9 | 7.1, 7.3 |
| 10 | Blockade-Surveillance-Network | 봉쇄 감시망 | Blockade Surveillance Network | bestiary-outside-machine | 10 | 7.1, 7.4 |
| 11 | Drone-Swarm | 군집 드론 | Drone Swarm | bestiary-outside-machine | 11 | 7.1, 7.5 |
| 12 | Unexploded-Warheads-and-Optical-Fibre | 불발 탄두와 광섬유 | Unexploded Warheads and Optical Fibre | bestiary-hazard | 12 | 8 |

- Every entry document carries the nine-field frame of sections 5-8 into public text. It does not carry the design grade labels, real company and product names, the game-side column of the threat grades (4.1, fourth column), section 12, or the private setting of 9.4.
- The front document `Bestiary` carries the ecological base of section 2 (the Option B figures in the words people in the world experience), the food web of section 3, the threat grades and threats by place of section 4 and the meetings summary of section 11, and links to the 12 entry documents. It says in one paragraph why there are no human groups and links to the three faction society documents.
- Outside Seoul (9.1-9.3) gets no new document; the present `External-Theaters` document takes it.

### 14.2 Twenty-seven documents to delete

| What | Where |
|---|---|
| 27 slugs | `Hostile-Ecology-Index`, `Hostile-Group-G01`-`Hostile-Group-G26` |
| 54 drafts | `docs/drafts/Hostile-Ecology-Index.{ko,en}.md`, `docs/drafts/Hostile-Group-G01.{ko,en}.md`-`G26.{ko,en}.md` |
| 27 rows of 030 | `data/sql/030-wiki-documents.sql` line 2681 (`Hostile-Ecology-Index`), lines 3278 (`Hostile-Group-G01`) to 6511 (`Hostile-Group-G26`) |
| slug list | `docs/canon-slugs.json` lines 15-41 |

The document count becomes 61 − 27 + 13 = **47**. The old addresses are not passed on to the new documents (owner decision "delete everything and redesign"). Whether the old addresses redirect to the new front document `Bestiary` is decided by the site task. The default is no redirect (provisional T34-43).

### 14.3 Changing the categories (020)

`data/sql/020-wiki-categories.sql` lines 7-11 (provisional T34-44).

| id | Now (ko / en) | Change |
|---|---|---|
| `bestiary` | 적대 생태 도감 / Hostile Ecology Compendium. Summary "Animals, hostile human bands, old machines inside Seoul and the machines of the rim" | 생태 도감 / Bestiary. Summary "Animals, old machines inside Seoul, outside machines, hazard zone" |
| `bestiary-animal-urban` | 짐승 / Animals | unchanged |
| `bestiary-human` | 적대 사람 무리 / Hostile Human Bands | deleted |
| `bestiary-rogue-robot` | 서울 안 옛 기계 / Old Machines Inside Seoul | unchanged |
| `bestiary-infected` | 테두리 기계 / Rim Machines | deleted |
| (new) `bestiary-outside-machine` | none | 바깥 기계 / Outside Machines |
| (new) `bestiary-hazard` | none | 위험 지대 / Hazard Zone |

The present 27 bestiary documents all sit in the single category `bestiary`. Whether to use subcategories is decided after checking whether the site shows subcategories. If it does not, all 13 go into `bestiary` and only sort sets their order.

### 14.4 Where the counts change

| File:line | Now | Change |
|---|---|---|
| `docs/canon-slugs.json` 15-41 | the 27 bestiary slugs | delete them and add the 13 new slugs |
| `docs/CANON-BIBLE.md` 263, 264, 265 | document count 61 | 47. Record that by the owner decision of 2026-11-13 (9.4 "bestiary" row) 27 were deleted and 13 added |
| `docs/CANON-BIBLE.md` 273, 275 | "the 61-document table", "61 documents" | 47 |
| `docs/CANON-BIBLE.md` 283, 284 | the task 14 and 15 groups (27 bestiary documents) | one group of 13 new bestiary documents |
| `docs/CANON-BIBLE.md` 293-319 | the 27 bestiary rows of the W4 disposition table | a historical record, so not deleted; add "replaced by the bestiary deletion of 2026-11-13" at the table head |
| `docs/CANON-BIBLE.md` 507, 508 | V9 61 documents, V10 "add no new slug (63 as is)" | close V10 with this decision |
| `docs/design/v3/08-document-map.md` 79-118 (+`.en.md` same lines) | the 3.5 task 14 table (14 bestiary documents), the 3.6 task 15 table (13), "there are no new slugs", "total 61" | replace with one table of 13 bestiary documents and a total of 47 |

### 14.5 Other places that use G numbers or old bestiary names

Nothing outside this chapter is changed. Only the places to change and the task to take them are listed. Line numbers are as of the parent of the commit that wrote this chapter (a54452ac7). The English mirror is mostly the same line (provisional T34-45).

**Bible chapters (task 36 integration or task 38)**

| File:line | What it uses | Change |
|---|---|---|
| `docs/design/v3/README.md`:38 | chapter 02 title "적대 생태와 서울 밖" (hostile ecology and outside Seoul) | to "생태 도감과 서울 밖" (bestiary and outside Seoul) (task 38 or 36) |
| `docs/design/v3/04-government.md`:601 (+.en:601) | handover item 5 "chapter 02 decides ... the threats on the northern mountain edge" | replace "edge" (테두리) with "blockade zone" (봉쇄 지대) and point to "chapter 02 sections 4.3 and 7" (task 38 or 36) |
| `docs/design/v3/05-free-city.md`:563 (+.en:563) | handover item 1 "match ... with chapter 02's perimeter design (outside Gwanaksan, west of Gimpo Int'l Airport, south of Geumcheon)" | replace "perimeter design" with "chapter 02 section 4.3 (boundary stations) and sections 7-8" (task 38 or 36) |
| `docs/design/v3/01-core.md`:334 (+.en:334) | 6.3 row "machines inside Seoul": "chapter 02 (G13-G16·G25 inside Seoul and the drifted G19·G23; G17-G24·G26 are rim machines …)" | to "chapter 02 section 6 (the four old machines inside Seoul) and section 7 (the four outside machines); outside machines do not come into Seoul". The table's "some machines repair one another" cell becomes isotope heat sources and solar power, per this chapter 7.1 |
| `docs/design/v3/01-core.md`:536 (+.en) | section 10, the old "Infected" retired-concept row, points to "rim machines (chapter 02 sections 1, 6.6)" | to "outside machines (chapter 02 section 7)". Add "the old hostile ecology bestiary's 26 groups and G numbers" to the same section as a retired concept |
| `docs/design/v3/01-core.md`:545 (+.en) | section 11 item 4 "chapter 02's G13-G26 are rebuilt on this premise" | "the eight machines and one hazard zone of chapter 02 sections 6-8" |
| `docs/design/v3/03-technology.md`:382 (+.en) | section 8 "G13-G16·G25 inside Seoul, the drifted G19·G23; rim machines are G17-G24·G26" | "chapter 02 section 6 (old machines inside Seoul) and section 7 (outside machines)". "Drifted machines" do not exist in this chapter (outside machines do not come into Seoul) |
| `docs/design/v3/03-technology.md`:555 (.en is 554) | handed-on item 8 "chapter 02's machine groups (G13-G26)" | "chapter 02's eight machines" |
| `docs/design/v3/05-free-city.md`:128 (+.en:128) | "Chapter 02 places hostile group G12, 'Geumcheon Hands Without Surety' …" | drop the group name, to "people who have lost their guarantee are dealt with by the law and punishment of section 10.6 of this chapter". Geumcheon's buried factory basements overlap the factory humanoid robot's place in chapter 02 6.4 |
| `docs/design/v3/09-ck3-systems.md`:439 (+.en) | "chapter 02's hostile groups G01-G26", "threat grade (chapter 02 3.1)" | "chapter 02's 12 entries", "threat grade (chapter 02 4.1)". The grade 4-5 line stays |
| `docs/design/v3/08-document-map.md`:33, 79-118 (+.en) | the rows and old names of the 27 bestiary documents | 14.4 |
| `docs/design/v3/11-science-setup.md`:133, 353, 355, 381-437 (+.en) | the G numbers of the section 5 candidate table and disposition advice, "G20" in 4.4 | a design record, so left as is. Only note "task 34 done" in the chapter 02 rows of the 4.4 table |
| `docs/design/v3/12a-terms.md` 2.3 nos. 51-66 | replacement words for the old machine names | left as is (this chapter used those replacement words) |
| `docs/CANON-BIBLE.md`:157 | false-positive note "G02·G04 ecology documents" | left as is (record) |
| `docs/canon-terms.json`:809, 825 | ban notes "replacement: chapter 02's G01-G26", "rim machines (G17-G24·G26)" | "replacement: chapter 02's 12 entries", "outside machines (chapter 02 section 7)" |

**Wiki drafts and 030 (wiki part of task 34; dates are task 35)**

The rows of `data/sql/030-wiki-documents.sql` for the same slugs use the same places (030 start line in brackets).

| Draft (ko and en same lines) | Lines | What it uses |
|---|---|---|
| `docs/drafts/Ailments.*.md` (030:4) | 4, 41, 42, 50, 75 | bestiary links, animals and human groups |
| `docs/drafts/Building-Reuse-Geography.*.md` (030:143) | 27, 28, 49, 86 | bestiary links, old machine names |
| `docs/drafts/Century-Annals.*.md` (030:304) | 139, 141, 159, 187, 243 (en also 163) | old machine and human group names |
| `docs/drafts/External-Theaters.*.md` (030:1484) | 23, 24, 31, 35-43, 45, 49, 63, 76, 78-81, 85, 106, 120 | the nine branches of rim machines, rim-runners. Rewrite from sections 9 and 7 |
| `docs/drafts/Food-Culture.*.md` | 35, 53, 59, 60 (en 35, 53, 59) | wild boar and raccoon dog fat and hides. To 3.4 |
| `docs/drafts/Free-City-Society.*.md` (030:12886) | 99 | G12 link |
| `docs/drafts/Glossary.*.md` | 113 (en also 137) | bestiary terms |
| `docs/drafts/Oral-Stories.*.md` (030:7252) | 11, 15-28, 32, 36-40, 48, 49, 115 | fourteen spoken names of old machines and their stories. Rewrite as the new entries' narrative hooks |
| `docs/drafts/People-and-Machines.*.md` (030:7481) | 69, 70, 71, 95 | old machine links |
| `docs/drafts/Regional-Physical-AI-Arcs.*.md` (030:7660) | 58, 62-70, 72, 83, 86, 94, 108, 144 | the table of blockade shares (One-Eye Towers, Growlers, Bulgasari and others). To 7.1 |
| `docs/drafts/Scenario-Timeline.*.md` (030:7941) | 112 (en also 24) | old groups |
| `docs/drafts/Sindorim-Junction-Cargo-Gate.*.md` (030:9399) | 56, 106, 108, 109, 111, 123 | old machine links |
| `docs/drafts/Structures.*.md` | 25 | old machine names |
| `docs/drafts/Synthetic-Actors.*.md` (030:10339) | 63 | old machine link |
| `docs/drafts/Values-and-Policy-Scales.*.md` | 21 | old groups |
| `docs/drafts/World-and-Subway-Layers.*.md` (030:12010) | 96 | bestiary link |
| `docs/drafts/World-Expansion-Index.*.md` (030:10673) | 159-163, 178 | bestiary index rows |
| `docs/drafts/World-Narrative-Atlas.*.md` (030:11249) | 120 | bestiary link |

**People, units, categories (wiki part of task 34 or task 38)**

| File:line | What it uses | Change |
|---|---|---|
| `docs/drafts/people/government.jsonl`:140 | biography "the movements of the rim machines seen through the post telescope" | "the movements of the outside machines". The story of when the machines come close fits 7.1 (they move more in the long-daylight half). Re-run the people applier |
| `data/sql/130-units-government.sql`:20, 23, `131-units-free-city.sql`:20, `132-units-arc.sql`:21 | "the rim" in unit descriptions | No G numbers or old bestiary names. Task 38 changes "the rim" to "the blockade zone" per `12a-terms.md` no. 37 |
| `data/sql/020-wiki-categories.sql`:7-11 | bestiary categories | 14.3 |

**GDD (task 21)**

| File:line | What it uses |
|---|---|
| `data/sql/080-gdd-documents.sql`:6627, 6682 | the old "hostile groups G01-G27" |
| `data/sql/080-gdd-documents.sql`:46498, 46517 | "hostile ecology groups `G01-G24`" |
| `gdd/canon/locales/ko-KR/root/development-roadmap.json`:179 | "hostile groups G01-G27" |
| `gdd/canon/locales/ko-KR/system-design/gdd-lore-node-states.json`:108 | "hostile ecology groups `G01-G24`" |
| `gdd/snapshots/world-game/lore/regions/content/11440.json`:3603 | `lore/bestiary/Hostile-Ecology-Index.json` |

**Places not changed**

- `docs/drafts/reports/` (the old ledger parts t03, t14, t15 and the w2v-w6 reports), `.omo/evidence/`, `gdd/RESEARCH/`, `gdd/GAME-REFERENCE/`: records of past work. The old provisional items T03-n, T14-n, T15-n are closed as "replaced by task 34" when task 24 merges the ledger.
- `scripts/world-atlas-render.mjs`, `scripts/cast-sqlite/*`, `scripts/catalog-publication.mjs`, `scripts/category-*.mjs`, `scripts/lore-json-validate.mjs`, `scripts/materialize-world-atlas.mjs`: code of the old canon generation path. The present site build (`site/build.mjs`) does not call bestiary slugs by name. Whether to delete or change them is not decided by this task.
- `scripts/pages/w4-edit.mjs`:20, `scripts/pages/w5-28-browser-walk.mjs`:36, 37, 48, 212: one-off tools of past tasks. Deleting the bestiary slugs means they cannot be re-run, but there is no reason to re-run them.
- `scripts/pages/i18n-ko-en.json` (stale translation-cache keys with the old `Hostile-Group-G01`-`G12` links), `docs/fix5-origin-rules.json`, `docs/fix7-g3-rules.json`, `docs/fix8-hei-rules.json`, `docs/fix9-rules.json`, `docs/w4-rules.json` (one-off edit-rule inputs that name the old slugs): tool inputs of past work.

## 15. What is handed on to 01-core and other chapters

| Where | What is handed on | Task to take it |
|---|---|---|
| 01-core section 3 | The Option B figures (2.1). This chapter is already written in Option B | 38 |
| 01-core 3.2 | The fat in "oil lamps and tallow candles only where fat is produced" is tank fish and larvae (3.4) | 38 |
| 01-core 5.3 row "fish and hunting" | "Which animals survived and how is in chapter 02" stays correct. The wild animals are only the brown rat and the large-billed crow | none |
| 01-core 6.3 | "The rim" and "the forecourt" to the blockade zone and buffer zone, the "machines that repair one another" cell per 7.1, the "machines inside Seoul" cell per 14.5 | 38, 36 |
| 01-core section 10 | Add "the old hostile ecology bestiary's 26 groups and G numbers" and "hostile human groups" to the retired concepts | 36 |
| Chapter 03 section 8 | The roughly 150 revived worker machines come from 6.2 and 6.4. Autonomous construction machines (old G26), care dolls, isotope heat sources, old battery packs and the shut-down reactor are covered by chapter 03 as objects (1.2) | 38 |
| Clothing sections of chapters 04-06 | Animal hides are feral dog fur and rat skins, padding is crow feathers (3.4). Wild boar and raccoon dog are not used | 38 |
| Daily-life sections of chapters 04-06 | The taboo on surface light and driving off crows (5.2) | 38 |
| Chapter 09 3.4.1, 3.9 | The line-end battlefield row and machines having no morale | battle design task |
| Chapter 07 | The late-game event "the blockade zone thins" (9.4) and the hand-off of non-faction opponents (12.1) | battle design task |
| Chapter 07 7.4, the return network | Crossing windows are more frequent in the short-daylight half (9.2) | 38 |
| Wiki documents | The plan of section 14 | 34 wiki part, 36 |

(provisional T34-46)
