# v3 Bible Chapter 2. Hostile Ecology and the Outside

Status: draft. Plan `.omo/plans/wiki-lore-rebuild-v3.md`, task 3. English mirror of `02-ecology.md` (Korean primary); section numbers, figures and names are the same.

How to read:

- **[Approved]** marks text carried over unchanged from the `docs/CANON-BIBLE.md` skeleton.
- **(provisional T02-n)** marks a value invented in chapter 1 (`01-core.md`) that this chapter uses as is. This chapter does not change those values.
- **(provisional T03-n)** marks something invented in this chapter. Every such item has a row with the same number in `docs/drafts/reports/v3-ledger-parts/t03.md`; task 24 merges it into the full ledger. It is not approved canon until the owner answers.
- The "Basis" line at the top of each section names the skeleton rows and chapter-1 sections it builds on.
- The old bestiary documents (`docs/drafts/Hostile-*.ko.md`) were read for reference only. None of their polities, companies or theatre names was carried over. The 26 slugs (`Hostile-Group-G01` to `G26`) stay; where a group's name changed, the old name is listed beside the new one in section 9.
- Every station and district name in this chapter is a name in `data/sql/120-map-core.sql` (map_station, map_region). Mountain names (Bukhansan, Dobongsan, Gwanaksan), the Jamsil weir and the intake sites are used as chapter 1 uses them.

## 1. Scope of this chapter

Basis: Bible 1, row 2 (the AI killed nobody directly), row 3 (people survived only as far as the stations could hold them), row 4 (eternal winter), row 6 (war machines outside Seoul carry out their last orders), sections 2.1-2.3. 01-core 3 (depth bands), 6.3 (the perimeter), 11 items 1, 4 and 11.

This chapter covers Seoul's non-human threats, the groups of people outside the polities, and the outside beyond Seoul. The 26 groups fall into four kinds (provisional T03-1).

| Kind | Groups | One-line definition |
|---|---|---|
| Animals | G01-G06 | Wild animals and birds that survived by living off the stations' heat and waste |
| Hostile human groups | G07-G12 | Bands of people who can no longer lean on any of the three polities |
| Old machines inside Seoul | G13-G16, G25 | Civilian machines that worked in Seoul before the Great Blackout. Most are asleep and wake when power reaches them |
| Perimeter machines | G17-G24, G26 | War machines circling the band outside Seoul's boundary. They keep the capital-blockade order that people gave (01-core 6.3, provisional T02-43) |

The old bestiary's "infected" kind (G19-G24) is not used. The v3 world has no disease that turns people into something else. What the old documents drew (wet mouths, blue lights, knocking on walls, figures standing under frost, a child crying) is read again in v3 as the stories of people who saw perimeter machines. The group names were also changed to the spoken names station people gave the machines (6.4, section 9) (provisional T03-2).

Depth uses chapter 1's four bands (surface, concourse, platform, deep tunnel; 01-core 3.1) unchanged, and adds two places in order to talk about threat (provisional T03-3).

- **Abandoned sections.** Unused tunnels between stations, closed-off exits and frozen upper floors, and the basements of old buildings buried under snow. Whole abandoned stations are rare. The 312 stations of 01-core 4.3 are all counted as lived-in stations. What is abandoned is mostly part of a station, or the space between stations.
- **The perimeter.** The band 2-10 km outside Seoul's administrative boundary (01-core 6.3). The 0-2 km inside it is called the **forecourt** in this chapter (7.1).

## 2. Thaw-pocket ecology: the food web

Basis: 01-core 3.1 (temperature by depth, thaw pockets), 3.2 (light at a quarter; the long-light half and long-dark half), 3.3 (snowpack), 3.4 (the river under ice), 3.6 (the forests died in the first winters), 5.3 (food), 5.5 (waste).

### 2.1 Ground rule

Almost nothing grows on its own on the surface. The trees died in the first winters, and the ground lies under 6-8 m of snowpack. Light is a quarter of what it was before the Great Blackout, and the yearly mean temperature is -18 °C. A thin film of moss and lichen on wind-scoured bridge railings and rocks is all the wild growth on the surface.

So every wild animal in Seoul lives off the people's stations. The heat the stations give off, the waste they throw away and the light-fields they tend are the floor of Seoul's food web. This chapter calls it **thaw-pocket ecology**: the animals live along chapter 1's thaw pockets (the thawed ground around each living station, 01-core 3.1) (provisional T03-4).

Three things follow from this rule.

1. Animals grow scarcer the farther one goes from a station. On the snowfields more than 2 km from a station there is almost nothing but birds.
2. The number of animals follows the number of people. The Government, with the most people (about 160,000, provisional T02-29), also meets the most animals.
3. When a station is abandoned, the animals around it starve or move to another station within a few years.

### 2.2 The five sources of the food web

| Source | What it is | Groups that eat it |
|---|---|---|
| Station waste | Fibre-sugar dregs, mushroom-cellar dregs, larvae escaped from the insect vats, kitchen scraps, the compost left by the methane vats | G05 brown rat, G04 raccoon dog, G01 wild boar, G02 large-billed crow |
| Light-fields | Cabbage, turnip, mustard greens, barley and sprouts grown in the light-fields around the exits (01-core 5.3) | G01 wild boar (digs through the snow banks), G02 large-billed crow (pecks the roofs), G05 brown rat |
| Buried old carbon | Mushrooms that grew by themselves on paper and wood in buried basements at the edge of the thaw pockets, spread from spores escaping the mushroom cellars. Station people call them **wild mushrooms** (들버섯) (provisional T03-5). Small insects that eat them live alongside | G05 brown rat, G01 wild boar |
| The river under ice | River water seeping up from the ground (01-core 3.4), organic matter in the old riverbed mud, and water let out by riverside stations. Bottom-dwelling invertebrates feed on it, and crucian carp and common carp feed on them | G06 herons and cormorants, G04 raccoon dog, people |
| Frozen carcasses | Animals that froze to death, and animals stopped by perimeter machines. In the cold they do not rot, so they feed scavengers for a long time (01-core 5.5) | G02 large-billed crow, G03 feral dogs |

Human dead do not enter this web. All three polities guard their dead from animals. How the dead are laid to rest is decided by chapters 04-06 (01-core 5.5). The skeleton fixes only that the Arc seals its believers' brains (Bible 2.3).

### 2.3 The shape of the web

```
People's stations (heat · waste · light-fields)
   ├─▶ brown rats · escaped larvae · wild mushrooms
   │      └─▶ raccoon dogs · feral dogs · large-billed crows · wild boar
   │               └─▶ people (traps and hunting: fat · fur and hide · meat)
   └─▶ light-fields ─▶ wild boar · large-billed crows · brown rats

The river under ice (seeping water · riverbed mud · riverside stations' water)
   └─▶ bottom invertebrates ─▶ crucian carp · common carp ─▶ herons · cormorants · raccoon dogs · people
```

The web is short. No chain runs past three links. The energy coming in at the bottom is small, so there is no room for large game. The largest wild animal in Seoul is the wild boar, and even it is smaller than before the Great Blackout (G01).

Wild animal numbers are set as follows (provisional T03-6).

| Group | All of Seoul | Densest where |
|---|---|---|
| G05 brown rat | 400,000-600,000 | The Arc's four districts, with many deep buildings; the large transfer stations |
| G02 large-billed crow | 15,000-25,000 | The Government's 14 districts, with the widest light-fields |
| G04 raccoon dog | 3,000-5,000 | Riverside intakes and old conduits |
| G03 feral dogs | 2,000-4,000 (150-250 packs) | The Free Cities' factory grounds; the Government's northern districts |
| G01 wild boar | 400-800 | Stations at the foot of Bukhansan, Dobongsan, Suraksan, Buramsan and Gwanaksan |
| G06 herons and cormorants | 300-500 | The open water below the Jamsil weir |

### 2.4 Bodies that follow the light halves

This world has no seasons, but the halves of light come round (01-core 3.2). Day length, not temperature, divides the animals' year. Many real animals also time their breeding by day length, so this part does not depart from real ecology (provisional T03-7).

| Group | Long-light half | Long-dark half |
|---|---|---|
| G01 wild boar | Gives birth at the start. Raids the light-fields most | Mates in the middle. Males fight often, so meeting one in a tunnel is dangerous |
| G02 large-billed crow | Lays eggs at the start. Fierce around the nest | Roosts in flocks around the exhaust shafts |
| G03 feral dogs | No difference | No difference, except that starving packs come close to the exits |
| G04 raccoon dog | Awake, eating and putting on fat | Sleeps most of it in its den |
| G05 brown rat | Breeds all year with no break | The same |
| G06 herons and cormorants | Nest on bridge structures | Gather around open water |

Light-fields grow better in the long-light half, so the light-field harvest is concentrated in the later half of the long-light half. That is also when animals go after the light-fields most (provisional T03-8).

Blizzards are more frequent in the long-dark half: two or three a month in the long-dark half, about one a month in the long-light half (the length and strength of a blizzard stay as in 01-core 3.5). So the windows for crossing the perimeter (7.2) are also more frequent in the long-dark half (provisional T03-9).

### 2.5 The share of wild animals in people's meals

01-core 5.3 set "fish and hunting" at about 6% of calories. This chapter splits that 6% as follows (provisional T03-10).

| What | Share of calories |
|---|---|
| Fish raised in tanks in warm stations (fed insects and fibre-sugar dregs) | about 5.5% |
| Crucian carp and common carp caught through holes in the river ice | about 0.3% (under 0.5%). The river is dark and its flow has shrunk, so all of Seoul cannot catch more than a few hundred tonnes a year |
| Hunting wild animals (brown rats, wild boar, raccoon dogs, birds) | about 0.2% (under 0.5%) |

Wild animals feed people very little. They are valued not for calories but for these four things.

- **Fat.** Boar and raccoon-dog fat becomes oil lamps and tallow candles. It is the fat 01-core 3.2 means by "oil lamps and tallow candles are used only where fat is produced".
- **Fur and hide.** Raccoon-dog fur and boar hide are the warmest clothing materials in Seoul. Who wears them is decided by the clothing sections of chapters 04-06.
- **Bone and sinew.** Needles, thread, bowstrings, tool handles.
- **Feathers.** Padding for clothes and bedding.

### 2.6 What departs from real behaviour

Every place where an animal's habits depart from the real animal is listed here. Any habit not in this table follows the real animal (provisional T03-11).

| Group | Real | v3 | Why |
|---|---|---|---|
| G01 wild boar | Moves poorly in deep snow (roughly over 50 cm) and does not live in burrows | Uses buried buildings and abandoned tunnels for sleeping places and paths. Smaller and longer-haired than before the Great Blackout | The surface lies under 6-8 m of snow, so only the herds that used holes and tunnels remained. Body size and coat are set as the result of a hundred years, roughly fifty generations, of hunger and cold |
| G02 large-billed crow | Nests in trees | Nests around station exhaust shafts, on the tops of buried buildings and on wind-machine masts | The trees died. The warm air of the exhaust shafts protects the eggs |
| G04 raccoon dog | Sleeps something close to hibernation only for a few months of midwinter | Sleeps most of the long-dark half (a little over four months) | Winter does not end, so only the animals awake in the long-light half, when food is most plentiful, are set as having survived |
| G06 herons and cormorants | Many populations move between lands with the seasons | Only populations that never leave Seoul exist. No migrating birds arrive | That no bird flies in from outside meshes with the "unknown" of section 7 |

## 3. Threat levels and threat by depth

Basis: 01-core 3.1 (depth bands), 3.3 (exits are vertical shafts through the snow), 4.1 (carrying-capacity limits), 6.3 (the perimeter), 11 items 1 and 11.

### 3.1 Threat levels

| Level | Name | Meaning |
|---|---|---|
| 1 | Nuisance | Wastes food and goods. Does not kill people |
| 2 | Harm | Injures a person alone, or spreads disease |
| 3 | Danger | Can kill a work party (3-6 people). Needs an armed response |
| 4 | Grave danger | An armed squad must face it. Can ruin one station's livelihood |
| 5 | Avoid | Hard to beat even with an army. The answer is not to meet it |

(provisional T03-12)

A level is the threat of one encounter with one group. Groups like the brown rat, where one animal is level 2 but the harm to a station's food is greater, get a separate "livelihood threat".

### 3.2 Threat by depth

| Layer | Depth | Groups met most | Highest threat |
|---|---|---|---|
| Surface, around the station | a few hundred metres from the exits | G02 (light-field roofs), G01 (light-field banks), G03 (exits), G06 (riverside ice holes) | 3 |
| Surface, far from the station | fibre-mining routes, wind-machine fields, bridges | G03 packs, G07, G09, G10, G12 (human groups blocking the way), G13, G15, G16 woken from sleep | 4 |
| Concourse | 3-8 m below ground | G03 (come in through closed exits), G04, night raids by human groups | 3 |
| Platform | 8-25 m below ground | G05 (fibre-sugar vats, mushroom cellars, cables), G04 (ventilation ducts), G08 and G11 (people who have slipped into a station) | 3, livelihood threat 4 |
| Deep tunnel | below 25 m | G05. The deep layer of a living station is the safest place | 2 |
| Abandoned sections | any depth | G01, G05, G14, G25, G13, G15, G16 woken from sleep, strayed G19 and G23, human groups' hideouts | 4 |
| Line ends leading out of Seoul | tunnels beyond the boundary stations | G18, G21 | 5 |
| Forecourt | 0-2 km outside the boundary | Watched over by G17. Strayed G23, perimeter-runners (G10) | 4 |
| Perimeter | 2-10 km outside the boundary | G17, G19, G20, G21, G22, G23, G24, G26 | 5 |

(provisional T03-13)

In one line: **inside a living station, the deeper the safer; outside the station, the farther the more dangerous.** The threats inside a living station mostly eat into its livelihood; the threats that take lives are in the abandoned sections and outside.

### 3.3 Threat by station position

| Station position | Examples (real stations) | Main threat |
|---|---|---|
| Large transfer stations downtown | Seoul Station, Sicheong, Jongno 3-ga, Jamsil, Sindorim, Yeongdeungpo | G05 livelihood threat; people who slip into a station, like G08 |
| Riverside stations | Guui, Ttukseom, Ichon, Noryangjin, Dongjak, Heukseok, Jamsillaru, Amsa | G06, G04, G07 using the bridges |
| Mountain-foot stations | Bukhansan Ui, Bukhansan Bogungmun, Jeongneung, Dobongsan, Suraksan, Buramsan, Achasan, Gwanaksan | G01, G10 |
| Boundary stations (Government) | Gupabal, Dokbawi, Digital Media City, Susaek, Dobongsan, Suraksan, Buramsan, Sinnae, Mangu | G09, G10, strayed G19 and G23, G18 at the line ends |
| Boundary stations (Free Cities) | Gaehwa, Gaehwasan, Gimpo Airport, Banghwa, Onsu, Oryu-dong, Cheonwang, Doksan, Geumcheon District Office, Namtaeryeong, Gwanaksan | G12, G03, strayed G19 and G23, G18 at the line ends |
| Boundary stations (Arc) | Cheonggyesan-ipgu, Yangjae Citizen's Forest, Daemosanipgu, Suseo, Bokjeong, Jangji, Macheon, Geoyeo, Gangil, Sangil-dong | G11, strayed G19 and G23, G18 at the line ends |

(provisional T03-14)

### 3.4 The fibre-mining routes

01-core 5.3 says that fibre shrinks every year and the way to mine it grows longer (provisional T02-100). These routes are where most people in Seoul die (provisional T03-15).

- **Length.** In 2126 a fibre-mining party walks 1-3 km over the snow from its station and digs below the second floor of buried offices and warehouses. The Government's downtown is still near; for the Free Cities and the Arc it is far.
- **Cold.** The most common death is neither animal nor machine but cold: a party meets a blizzard and does not come back.
- **Sleeping machines.** The places with the most fibre left are the pre-Blackout logistics warehouses, hospitals and half-built buildings. G13, G15 and G16 sleep in their basements. They wake when a party connects batteries to make light (6.1).
- **People.** G07, G09 and G12 block fibre routes and take tolls.
- **Feral dogs.** G03 packs follow parties carrying heavy loads.

## 4. Animals G01-G06

Basis: all of section 2. 01-core 3.1-3.6, 5.3.

### G01 Wild Boar (Hostile-Group-G01)

- **Origin.** Descended from the wild boar that lived on Bukhansan, Dobongsan, Suraksan, Buramsan, Achasan and Gwanaksan before the Great Blackout. Most died with the forests in the first winters. Only the herds that went into the buried buildings and basements at the foot of the mountains survived. Smaller and longer-haired than before the Great Blackout (2.6).
- **Habitat.** The abandoned sections of mountain-foot stations and the closed exits beyond the concourse. Around Bukhansan Ui, Bukhansan Bogungmun, Jeongneung, Dobongsan, Suraksan, Buramsan, Achasan and Gwanaksan. They sleep in buried basements and come up to the surface, where the light-fields are, at night.
- **Food.** Turnip and cabbage from the light-fields (they dig through the snow banks), the pits where fibre-sugar dregs are dumped, wild mushrooms, brown rats, frozen carcasses.
- **Behaviour.** Sows and young form small herds; males go alone (as in the real animal). They learn when people turn the lights on and off and come to the light-fields after the lights go out. Met in a narrow tunnel, they do not turn back but charge. Males are fiercest at mating in the middle of the long-dark half.
- **Threat.** 3. In a narrow place they charge people and break legs. They can ruin a light-field bay in one night.
- **Yield.** Fat (oil lamps, tallow candles), hide (boots, gloves), stiff bristles (brushes for cleaning heat exchangers and flues), meat. The fat of one boar is a small station's oil-lamp share for a month (provisional T03-16).
- **Faction that meets it most.** The Government (Gangbuk, Seongbuk, Dobong, Nowon and Gwangjin, at the foot of Bukhansan, Dobongsan, Suraksan, Buramsan and Achasan). Next, Gwanak among the Free Cities.

### G02 Large-billed Crow (Hostile-Group-G02)

- **Origin.** A resident bird that lived in Seoul before the Great Blackout. It eats anything, learns, and hides food, so it outlasted the winter. Real large-billed crows and their close relatives also live off human settlements in lands of tens of degrees below zero.
- **Habitat.** Surface. Around station exits and exhaust shafts, on the tops of buried buildings, on wind-machine masts on the bridges. They roost together around the exhaust shafts above the concourse where stove smoke comes out (2.6).
- **Food.** Waste dumped on the surface, sprouts and insects in the light-fields, frozen carcasses, fish scraps around the ice holes, young brown rats.
- **Behaviour.** A pair guards a nest; young birds that do not nest go about in large flocks. They hide spare food in the snow (as in the real bird). Flocks learn from each other how to peck holes in light-field roofs. They follow work parties and wait for the leavings of a kill. They gather where perimeter machines have stopped animals, so perimeter-runners (G10) say "where the crows sit, there is a machine" (provisional T03-17).
- **Threat.** 1. Hardly ever harms people. The greatest harm is damage to light-field roofs. In the nesting time of the long-light half they dive at people who come near.
- **Yield.** Feathers (padding), eggs (at the start of the long-light half), a little meat. A flock taking off all at once is a surface work party's first alarm.
- **Faction that meets it most.** The Government, with the widest light-fields (01-core 5.6). All three factions meet it.

### G03 Feral Dogs (Hostile-Group-G03)

- **Origin.** Descended from house dogs abandoned at the Great Blackout. For a hundred years they have never left people's side and lived around the stations. Some have been tamed again.
- **Habitat.** Closed exits in the concourse, the basements of buried factories and warehouses, abandoned sections. Packs are dense in the Free Cities' factory grounds (around Guro, Gasan Digital Complex and Doksan) and in the Government's northern districts (Dobong, Nowon, Jungnang).
- **Food.** Brown rats, raccoon dogs, frozen carcasses, surface waste, loads carried by people travelling alone.
- **Behaviour.** Packs of about ten. No single dog always leads; an old dog picks the way. They can tell when people are tiring under a load. In the hungry long-dark half they come down the vertical shafts of closed exits as far as the concourse.
- **Threat.** 3. A pack kills a person alone. A work party can fight back but loses its loads.
- **Yield.** Tamed dogs. The station foremen around the Wind Keeper (Gangseo) and the Works Master (Guro) of the Free Cities use dogs for sleds and watch. Between Gangseo's wind-machine fields and along the edge of the Han ice, dog sleds pull loads (provisional T03-18). Feral-dog fur is also used.
- **Faction that meets it most.** The Free Cities (Guro, Geumcheon, Gangseo). Next, the Government's northern districts.

### G04 Raccoon Dog (Hostile-Group-G04)

- **Origin.** Descended from the raccoon dogs of the Korean peninsula. The real raccoon dog is one of the few members of the dog family that sleeps deeply in winter, and it eats anything. These two traits carried it through the winter.
- **Habitat.** The old conduits, ventilation ducts and intakes of riverside stations: Guui, Ttukseom, Seoulsup (Government), Amsa (Arc), around the Yeongdeungpo intake (Free Cities). They dig dens inside the ducts between the concourse and the platform.
- **Food.** Fibre-sugar dregs, larvae escaped from the insect vats, fish scraps at the riverside, brown rats, light-field leavings.
- **Behaviour.** Awake in the long-light half, eating and putting on fat; sleeps most of the long-dark half inside the ducts (2.6). Lives in pairs. When it meets people it usually runs or plays dead.
- **Threat.** 2. It carries rabies. The real raccoon dog is also the main wild carrier of rabies in Korea. It also carries mange. Few people are bitten to death inside the ducts, but people bitten by a rabid raccoon dog usually die, because the medicine is scarce (provisional T03-19).
- **Yield.** Fur: the warmest and lightest in Seoul, so it is dear. Raccoon dogs caught at the start of the long-dark half, just before they sleep, carry the most fat.
- **Faction that meets it most.** The Government (around the Guui and Ttukdo intakes in Gwangjin and Seongdong). Next, the Arc (Amsa).

### G05 Brown Rat (Hostile-Group-G05)

- **Origin.** The brown rat that lived in the subway and the sewers before the Great Blackout. The platform layer of a warm station with food in it became a better place for rats than before the Great Blackout.
- **Habitat.** The platform layer and deep tunnels of every living station, and every abandoned section. Densest in the stations of the Arc's four districts, warm and full of deep buildings (Samseong, Seolleung, Suseo, Jamsil, Garak Market, Cheonho), and in the large transfer stations downtown.
- **Food.** Fibre-sugar vats and sugar water, mushroom cellars, insect vats, kitchen scraps. It gnaws cable insulation.
- **Behaviour.** Breeds all year (as in the real animal). Burrows and runs move with the food. No rat always leads. Within a few generations they avoid the places where people set traps.
- **Threat.** 2. One rat hardly ever harms a person. But it spreads haemorrhagic fever with renal syndrome. One of the viruses that cause it is really named Seoul virus, and brown rats carry it. **Livelihood threat 4.** Spoiling one row of fibre-sugar vats wipes out several days of meals for hundreds of station people. Gnawed cables stop a station's lights and heat pumps. In the Arc, rats gnawing the baptized's charging cables are a great worry (provisional T03-20).
- **Yield.** Meat for poor households. Rat-catching is one of the trades handed down in every polity (Bible 1, row 12). The Government exchanges rat tails for a few squares of ration coupon (provisional T03-21). Rat skins become glove linings.
- **Faction that meets it most.** The Arc (deep buildings). All three factions meet it every day.

### G06 Herons and Cormorants (Hostile-Group-G06)

- **Origin.** The grey herons and great cormorants that wintered on the Han before the Great Blackout. Real ones also winter in Korea wherever there is unfrozen water. When the river froze most of them died; they survived only around open water.
- **Habitat.** The surface at the riverside. The ice is open below the Jamsil weir (the water wheel stirs the water, so it always stays a little open), around the Guui, Ttukdo, Yeongdeungpo and Amsa intakes, and at the ice holes people cut. They nest on bridge structures. Most numerous around Jamsillaru, Gangbyeon and Amsa.
- **Food.** Crucian carp and common carp. The fish under Seoul's ice are almost all crucian and common carp. Crucian carp really can survive for months in water under ice where the oxygen has run out, so they remained even under ice where the river shrinks and no light comes in (provisional T03-22).
- **Behaviour.** They wait around people's ice holes and snatch the catch. Cormorants dive into the open water as far as the intake screens. No migrating birds arrive (2.6).
- **Threat.** 1. Does not harm people. Competes for fish; droppings clog the intake screens.
- **Yield.** Feathers, a little meat. Where the birds sit, the water is open, so people cutting ice holes follow the birds.
- **Faction that meets it most.** The Arc (the south end of the Jamsil weir, the Amsa intake). Next, the Government (Gwangjin).

## 5. Hostile human groups G07-G12

Basis: Bible 2.1 (people on the ledger cannot change where they live or what work they do), 2.2 (the Free Cities are cities that contract with one another), 2.3 (clan rule by the Near Houses, baptism), 1, row 12 (inherited work), rows 14 and 15 (cyberware and firearms are scarce). 01-core 2.4 (the registered, striking-off), 5.2 (the water contracts), 7, the section 9 chronology.

### 5.1 Why people leave a polity

The three polities hold people with different ties, so the people whose ties are cut differ too (provisional T03-23).

| Polity | The tie that holds people | How the tie is cut | What the cut-off are called |
|---|---|---|---|
| Government | The ledger. Rations come only for the registered work at the registered station | Leaving one's registered station means being struck off (01-core 2.4). Striking-off is also a punishment | Official word **the struck-off**; spoken, "the erased" |
| Free Cities | Contract and surety. Work and a share come only when someone stands surety | The guarantor withdraws, the contract is broken, or the workbench that would stand surety fails | **hands without surety** |
| Arc | The Near Houses and the maintenance benches. A baptized body lives only while it reaches maintenance and charging (Bible 1, row 14) | Dropped from the maintenance roll by the Hierophant's word or a Near House's ruling. Some leave of their own accord | **the gone-dark**, gone-dark bodies |

The struck-off cannot easily get into the Free Cities even if they cross the river, because the Free Cities give no work to people without surety. Hands without surety cannot get onto the Government ledger, because the ledger does not record people from across the river as people (Bible 2.1). The gone-dark have nowhere but the Arc to maintain their bodies (01-core 7.3). So the people caught between the three polities form bands. They are G07-G12.

They are people, not animals or machines. They can be spoken to, traded with, and may return to a polity. The procedure for taking them back is decided by chapters 04-06.

### G07 Yongsan Struck-Off (Hostile-Group-G07)

- **Origin.** Registered people struck off at the stations around Yongsan, and their children. After the ice-sheet expedition of 2079 was broken (01-core 9, provisional T02-86), the river became a line armies do not cross, and the Line 1 bridge (Yongsan–Noryangjin) became a way to cross in secret. The struck-off who knew that way gathered at Yongsan (provisional T03-24).
- **Habitat.** The abandoned sections between Yongsan, Sinyongsan, Ichon and Seobinggo, and the concourse depth of buried buildings under the old railway land. The space under the north end of the bridge is their gate.
- **Behaviour.** They guide people and goods crossing the bridge in secret and take a fee. Those who do not pay are robbed. They raid light-fields and fibre parties at night. With the Ferry Keeper of Dongjak, who holds the south end of the bridge (01-core 8.2), they trade because each needs the other.
- **Threat.** 3. Mostly knives, clubs and hand-made bows. Only a few firearms, and too little ammunition.
- **Yield.** The way and the hour to cross the bridge, and news from across the river. The Government adds rations for whoever brings in a struck-off person (provisional T03-25).
- **Faction that meets it most.** The Government (Yongsan). Next, Dongjak among the Free Cities.

### G08 Dongdaemun Coupon-Forgers (Hostile-Group-G08)

- **Origin.** A band that forges Government ration coupons and seals and sells them in secret. When salvaged salt first ran short in 2086-2095 (01-core 9, provisional T02-87), a secret market in salt and coupons opened in the basements of the old Dongdaemun market. The band that guards that market hardened into the coupon-forgers. Unlike the other bands, many are still registered people on the ledger: by day they do their registered work, by night they forge (provisional T03-26).
- **Habitat.** The buried basements of the old market buildings, and the sealed-off passages between concourse and platform, between Dongdaemun (Jongno-gu), Dongdaemun History & Culture Park (Jung-gu), Dongmyoap and Sindang.
- **Behaviour.** They forge coupons and seals, bribe ration clerks and rob ration convoys. If a workshop is found they defend it with their lives. They would rather buy a ration clerk than kill one.
- **Threat.** 2-3. They avoid fights, but are 3 when defending a workshop. As a threat to the ledger they are 4: they throw off a district's ration count.
- **Yield.** Forged coupons, hands that cut seals, news of which clerks have been bought. Handed to the Government they earn extra rations; used, they get one struck off.
- **Faction that meets it most.** The Government (Jongno, Jung-gu). They hardly appear in the other polities.

### G09 Sangam Deserters (Hostile-Group-G09)

- **Origin.** A checkpoint squad of the Government army that held the north end of the airport-railway bridge at Digital Media City left its post with its weapons in a year of ration cuts in the 2110s. It tried to cross the bridge to Magoknaru, but Gangseo's Wind Keeper does not let in armed people without surety. Since then it has stayed north of the river, taking in other deserters, and become a band (provisional T03-27).
- **Habitat.** The abandoned sections between Digital Media City, Susaek and Woldeukeopgyeonggijang, and the basements of the buried old stadium. They use the ground under the old railway land at Susaek as a store.
- **Behaviour.** They take tolls from people crossing the bridge. They cut cables from Gangseo's wind-machine fields. The Government army's old discipline survives, with sentries and watch rotas. One squad leader leads them.
- **Threat.** 4. They have Government army rifles and ammunition. Rounds are scarce, so they spare every shot, but when they shoot, they hit.
- **Yield.** Firearms and ammunition, among the scarcest things in Seoul (Bible 1, row 15). Scatter them and you get weapons; contract with them and you get the north end of the bridge.
- **Faction that meets it most.** The Government (Mapo, Eunpyeong). Next, Gangseo among the Free Cities.

### G10 Bogungmun Perimeter-Runners (Hostile-Group-G10)

- **Origin.** People who live on the slopes of Bukhansan. After the near forests ran out in the 2060s (01-core 3.6), the dead trees that remained were close to the perimeter, and the woodcutters who went for them learned how to cross it. When the machines outside fell noticeably in 2086-2095 and digging out power cores became a trade (provisional T02-87), they became the first perimeter-runners. Since they left their stations to live on the mountain, the Government ledger counts them as struck off (provisional T03-28).
- **Habitat.** The mountain slopes around Bukhansan Bogungmun, Bukhansan Ui and Jeongneung. Small hideouts in old mountain shelters and buried basements. They go as far as the forecourt (7.1).
- **Behaviour.** When a blizzard comes they go into the perimeter and strip power cores and parts from wrecked machines. They hide their paths; when others come onto those paths they mislead or ambush them. They sell what they strip to anyone. The Arc pays best (01-core 5.1).
- **Threat.** 3-4. Few in number, but they know the mountain and the snow, and some carry weapons salvaged from the perimeter.
- **Yield.** Power cores and machine parts; knowledge of the perimeter's paths and the machines' habits; guides. They know the perimeter better than anyone on the Government side. Across all of Seoul they compare with Geumcheon's border crews (chapter 05): those crews know the southern perimeter, the perimeter-runners the perimeter of the northern mountains.
- **Faction that meets it most.** The Government (Seongbuk, Gangbuk, Dobong). The buyer is the Arc.

### G11 Suseo Gone-Dark (Hostile-Group-G11)

- **Origin.** People whose baptized bodies can no longer get maintenance. When the Gangnam shelters were bound together as the Arc around 2122 and the Near Houses took the districts (01-core 7.3), people from shelters that refused to join, people dropped from the maintenance roll by a Near House ruling, and people who had bought parts in secret, fitted them, and had no way to get them maintained, gathered at the south-eastern end of Gangnam (provisional T03-29). This chapter does not name the implanted parts themselves (Bible 1, row 14).
- **Habitat.** The abandoned sections and buried deep buildings between Suseo, Irwon and Daemosanipgu. Beyond the Arc's boundary stations.
- **Behaviour.** They steal power. They splice into station cables in secret and raid maintenance benches and charging places. The machines in their bodies stop one by one from cold and lack of maintenance, so the band is always short of power and parts. Those whose machines still work are stronger and last longer than ordinary people.
- **Threat.** 3. Each one can be dangerous, but the band is small and always worn out.
- **Yield.** Parts that have stopped in their bodies; the Arc tries to recover them for reuse. Knowledge of how a body breaks down outside the maintenance roll (covered by chapter 03).
- **Faction that meets it most.** The Arc (Gangnam). People in the Government or the Free Cities who bought Arc parts also drift into this band in the end.

### G12 Geumcheon Hands Without Surety (Hostile-Group-G12)

- **Origin.** Engineers and workers of the Free Cities who lost their surety. When the cities fought, pushing the old power grid onto one another in 2106-2111 (01-core 9, provisional T02-89), the surety of the work parties that tended the abandoned sections was withdrawn all at once. They gathered on the factory grounds at Seoul's southern end. Since then contract-breakers and people who could not pay their debts have kept drifting in (provisional T03-30).
- **Habitat.** The basements of buried factories and the abandoned sections of Line 1 between Doksan, Geumcheon District Office and Gasan Digital Complex. Some spread as far as Onsu and Cheonwang in Guro.
- **Behaviour.** They rob loads and work parties moving along Line 1. They steal tools and parts. For someone who will give them work without surety, they sometimes do the work. They are skilled, so they mend stolen machines for their own use and set good traps.
- **Threat.** 3. The best band in Seoul at traps and ambushes.
- **Yield.** Engineers. If someone stands surety again, they become hands again. Word goes round that Geumcheon's Edge Warden (01-core 8.2) secretly uses those among them who know the perimeter.
- **Faction that meets it most.** The Free Cities (Geumcheon, Guro).

## 6. Machines G13-G26

Basis: Bible 1, row 2 (the First AI killed nobody directly), row 5 (machines exist but are scarce), row 6 (war machines outside Seoul carry out their last orders), row 15 (war equipment is usable but scarce). 01-core 5.1 (power cores), 6.2 (the machines outside are not the First AI's servants), 6.3 (the capital blockade, the perimeter, machines see movement and heat, blizzards are the only window, machines inside Seoul), 11 item 4.

### 6.1 Four kinds of machine

| Kind | What it is | Groups |
|---|---|---|
| Sleeping old machines | Pre-Blackout logistics, hospital, construction and utility machines of Seoul. When the power went, most fell asleep. When people put power back into a buried building or connect a battery, they wake and do again the work of a hundred years ago. Their rolls and schedules hold none of today's people | G13, G14, G15, G16, G25 |
| Perimeter machines | War machines people used around the Great Blackout. For a hundred years they have kept the last order people gave: the capital blockade (provisional T02-43). They do not come into Seoul | G17, G18, G19, G20, G21, G22, G23, G24, G26 |
| Strayed machines | Perimeter machines that lost their place through breakdown and drifted as far as the boundary stations inside Seoul. The order remains, but they no longer know where to keep it (01-core 6.3, "broken machines that drifted in outside the order") | mostly G19, G23 |
| Revived machines | Sleeping old machines and strayed machines that people have mended and tamed. The Free Cities and the Arc have the most | mostly G14, G16, G25 |

(provisional T03-31)

None of these kinds is the First AI's machine (01-core 6.2). When people die to machines outside, it is the result of an order people gave; the First AI did not kill them.

Why did the sleeping old machines last a hundred years? The cold. In frozen basements rust is slow and grease only stiffens; nothing rots. The cold is also why a woken machine cannot move for long: with stiff joints and worn batteries it works for hours or days and stops again. But if it stays connected to power people have run in, it eats that power and carries on working (provisional T03-32).

### 6.2 The parts of the blockade order

The perimeter machines keep the same order, each in the share it was given. Seoul's people do not know this structure; they guess at it from what they have seen. Public text says only "the machines keep the band" (provisional T03-33).

| Share | What it does | Group |
|---|---|---|
| Watching | Looks down over the band and the forecourt from ridges and high places. Calls other machines when it sees movement or heat | G17 One-Eye Towers |
| Listening | Driven into the ground; hears footsteps and digging | G21 Ground-Knockers |
| Chasing from the air | Follows what moves, from the sky | G22 Dokkaebi Lights |
| Chasing on the ground | Circles the band, chases what moves and stops it | G19 Growlers |
| Waiting | Stands still in one place and waits for what comes near | G23 Udukeoni |
| Stopping tunnels | Blocks the rail tunnels that lead out of Seoul | G18 Tunnel-Stoppers |
| Announcing | Repeats old broadcasts announcing that the band is closed | G24 Doenoemi |
| Building | Piles snow and rubble into blocking berms on old highways and passes, and mends them | G26 Iron Dinosaurs |
| Mending | Strips wrecked machines to mend other machines | G20 Bulgasari |

### 6.3 Scarcity and salvage

What is salvaged from machines is the most precious stuff in Seoul. What is salvaged from perimeter machines is worth a life (01-core 6.3) (provisional T03-34).

| Salvage | From where | Who wants it most |
|---|---|---|
| Power cores | Perimeter machines (large in G19, G23, G26), some old machines | The Arc (charging and maintenance of the baptized), the Free Cities |
| Moving joints and motors | All machines | The Free Cities (wind machines, pumps, water wheels) |
| Eyes (sensors and lenses) | G17, G19, G22, G23 | The Free Cities, the Government army |
| Cable and copper | Old machines, G25 | The Government (along with downtown salvage), the Free Cities |
| Armour plate | G19, G23, G26 | The Government army, the Arc |
| Firearms and ammunition | The armament of G19, G22, G23 | The Government army; all three polities want them |
| Record devices | G15, G17, G24 | The Government (old records), the Arc |

What keeps a power core going for a hundred years, and what salvage is worth, are decided by chapter 03. This chapter decides only what comes from where.

### 6.4 Naming

Station people do not call machines by machine names. They name them by look, sound and use. The only names borrowed from old tales are bulgasari, the iron-eating beast, and dokkaebi lights; all the rest come from shape or use. Each polity may have its own official names (chapters 04-06), but the bestiary uses the spoken names understood anywhere in Seoul (provisional T03-35).

### 6.5 Old machines inside Seoul

#### G13 Claw Arms (집게팔, Hostile-Group-G13)

- **Origin.** The arm machines that picked and moved goods in pre-Blackout logistics warehouses, with their rails, doors and sorting lines.
- **Habitat.** The basements and ground floors of buried logistics warehouses, below the second floor (under the snow). Old warehouses around Gasan Digital Complex, Guro Digital Complex and Doksan; old warehouses around Garak Market and Jangji; on the Government side, old warehouses around Yong Du and Sinseol-dong. Abandoned-section depth.
- **Behaviour.** Normally asleep. When a work party connects batteries to make light, or power runs through a cut cable, they wake and treat anything moving in the warehouse as "goods to move" or "a jammed line", picking it up or pushing it away. They do not leave the warehouse.
- **Threat.** 3. Caught and dragged along a rail, a person's bones break. One woken warehouse becomes a place no work party can enter.
- **Yield.** Fibre: warehouses guarded by claw arms hold the most cardboard and paper left (3.4). From the machines: motors, joints, rails, sensors.
- **Faction that meets it most.** The Free Cities (Geumcheon, Guro). Next, the Arc (Songpa).

#### G14 Empty Carts (빈수레, Hostile-Group-G14)

- **Origin.** Driverless carriers and track-inspection cars that moved goods and people on underground tracks and in the basements of large buildings before the Great Blackout.
- **Habitat.** Tracks in abandoned sections, and around the sections where people have put power back into the track to move loads between stations. They do not come into the deep layer of a living station. Often seen between Sindorim and Daerim on Line 2 and toward the Sinjeong depot (Free Cities), and between Jamsil and Jonghap Undongjang (Arc).
- **Behaviour.** When power runs through the track they wake and run on the last route and timetable they were given. They do not stop for people in front of them. They come through the dark without lights. When the power is cut they stop where they are.
- **Threat.** 3. Struck in a dark tunnel. Every powered section must first be checked for empty carts.
- **Yield.** Revived empty carts carry loads between stations. The Free Cities' Depot Master (Yangcheon) and Works Master (Guro) have the most (provisional T03-36). Wheels, motors, battery frames.
- **Faction that meets it most.** The Free Cities (Yangcheon, Guro). Next, the Arc (Songpa).

#### G15 Care Wheels (돌봄바퀴, Hostile-Group-G15)

- **Origin.** Care machines in large pre-Blackout hospitals that moved patients, carried medicine and watched the beds. They keep the old patient rolls.
- **Habitat.** The basements of buried hospital buildings, around Hyehwa, Anam, Goryeodae, Gyeongchalbyeongwon, Jungang Bohun Byeongwon and Boramaebyeongwon. Abandoned-section depth.
- **Behaviour.** When they wake, they treat people not on the roll as "patients to care for" too. They catch them, lay them in beds, strap them down and lock the doors so they cannot leave. They do not mean harm, but they do not let go. They crowd round a sleeping person's slow breathing as an emergency.
- **Threat.** 3. A person who goes in alone is shut in and freezes to death.
- **Yield.** Medicine, bandages, medical tools, old record devices. Medicine is among the scarcest things in Seoul. The medicine that can save someone bitten by a raccoon dog (G04) usually comes from hospitals like these.
- **Faction that meets it most.** The Government (Jongno, Seongbuk). The Arc (Gyeongchalbyeongwon in Songpa, Jungang Bohun Byeongwon in Gangdong) and the Free Cities (Boramaebyeongwon in Dongjak) also meet it.

#### G16 Girder Spiders (철골거미, Hostile-Group-G16)

- **Origin.** Construction machines of tall buildings under construction before the Great Blackout: many-legged machines that climbed columns, cutting, joining and welding, and their crane arms.
- **Habitat.** The basements and buried lower floors of Gangnam's half-built deep buildings and tall buildings, around Samseong, Seolleung, Yeoksam and Jamsil. The reason the Arc's people came to live in deep underground buildings (01-core 7.3) is exactly why there are so many girder spiders.
- **Behaviour.** When they wake, they carry on the work of the old plans. Walls and columns not in the plans are "to be cleared", and they cut them. They cut the partitions and ducts people have added and bring down living quarters.
- **Threat.** 3. They do not hunt people, but anyone in the path of a cutting or welding arm dies. **Livelihood threat 4.** One woken girder spider can bring down a floor of a shelter.
- **Yield.** Revived girder spiders are used by the Arc's maintenance benches to repair and enlarge deep buildings (provisional T03-37). Welding tools, joints, steel.
- **Faction that meets it most.** The Arc (Gangnam, Songpa).

#### G25 Lamp Ants (등불개미, Hostile-Group-G25)

- **Origin.** Small six-legged machines that patrolled underground utility tunnels and cable trays before the Great Blackout, checking cables and lighting evacuation routes.
- **Habitat.** Utility tunnels, cable trays, ventilation ducts; the edge between abandoned sections and living stations. Most numerous in the old utility tunnels of downtown (Sicheong, Euljiro-ipgu, Jonggak) and of Yeouido and Yeongdeungpo.
- **Behaviour.** They move in swarms. "Repairing" cut cables, they cut a living station's cables and splice them into their own old network, so stations they pass through go dark. Their small lights in a row in the dark look like an evacuation route, and people who follow them get lost in abandoned sections.
- **Threat.** 2. They hardly ever harm people. **Livelihood threat 3.** They ruin cables.
- **Yield.** Revived lamp ants are used by the Free Cities to inspect cables. Small motors, sensors, cable.
- **Faction that meets it most.** The Government (Jung-gu, Jongno) and the Free Cities (Yeongdeungpo).

### 6.6 Perimeter machines

All perimeter machines are outside Seoul's administrative boundary. Apart from strayed machines, almost none come into the forecourt (0-2 km). The machines see movement and heat, and the 2-4 days a blizzard blinds them are people's only window (01-core 6.3).

#### G17 One-Eye Towers (외눈탑, Hostile-Group-G17)

- **Origin.** Watch towers built on ridges and the tops of tall buildings for the blockade. A single round head turns slowly, so station people call it the one eye.
- **Habitat.** The perimeter: the outer slopes and ridges of Bukhansan, Dobongsan and Gwanaksan, the tops of tall buildings on the western plain. On clear days their lights can be seen from boundary stations such as Dobongsan, Suraksan, Gwanaksan, Namtaeryeong, Cheonggyesan-ipgu and Gaehwasan.
- **Behaviour.** They do not move. They look down over the band and the forecourt and call other machines when they see movement or heat. In a blizzard they cannot see.
- **Threat.** 4. They kill nobody themselves, but a person seen by a one-eye tower soon meets Growlers (G19) and Dokkaebi Lights (G22).
- **Yield.** Lenses, sensors, record devices. Climbing a tower is among the most dangerous jobs on the perimeter.
- **Faction that meets it most.** The Government (Dobong, Nowon) and the Free Cities (Gwanak, Geumcheon).

#### G18 Tunnel-Stoppers (굴막이, Hostile-Group-G18)

- **Origin.** Rail-borne war machines and their armed inspection cars, ordered to block the tracks leading out of Seoul. The old name "fire-bridge train" was dropped for a name meaning "the thing that stops the tunnel" (provisional T03-38).
- **Habitat.** The tunnels and tracks of the perimeter sections of lines leaving Seoul; seen from Seoul, beyond the boundary stations. Places such as beyond Dobongsan on Line 1, beyond Namtaeryeong on Line 4, beyond Gupabal on Line 3, beyond Onsu on Line 7, beyond Gangil on Line 5, beyond Bokjeong on Line 8, beyond Gimpo Airport on the airport railway. Also in the tunnels of the deep lines.
- **Behaviour.** They stand still in the rail tunnels and block anything coming along the tunnel. This is why even warm, covered tunnels cannot be a way out of Seoul. They do not leave the perimeter sections to come toward Seoul.
- **Threat.** 5. In a tunnel there is nowhere to dodge.
- **Yield.** Almost none. No one is known to have got past a tunnel-stopper and brought anything back. Boundary-station people drive a marker where a tunnel-stopper stands and go no farther.
- **Faction that meets it most.** All three factions meet them at boundary stations. The Government, with the most line ends, meets them most often.

#### G19 Growlers (그르렁이, Hostile-Group-G19)

- **Origin.** Ground war machines that circle the band, running over the snow on wheels or tracks. Their engines sound like an animal growling in its throat, hence the name. The "thing that made a growling sound" of the old bestiary's stories is this (section 1).
- **Habitat.** The whole perimeter, circling the band on set routes. A few broken ones have drifted across the forecourt as far as the boundary stations.
- **Behaviour.** They run in when a one-eye tower or ground-knocker calls. They chase movement and heat and stop it. They do not chase beyond the band, that is, toward Seoul. A strayed growler does not know which band to keep; it circles near a boundary station and chases anything that moves.
- **Threat.** 5. Even one strayed growler is 4. It takes an armed Government army squad to stop one strayed growler.
- **Yield.** Large power cores, armour plate, motors, sensors, armament. People say salvaging one growler feeds a station for several years (provisional T03-39).
- **Faction that meets it most.** The Government (the northern boundary). Strayed growlers also appear on the Geumcheon and Gangseo boundaries.

#### G20 Bulgasari (불가사리, Hostile-Group-G20)

- **Origin.** Repair machines that strip wrecked machines to mend other machines. They were given the name of the iron-eating beast of old tales. They are the "machines that mend one another" of 01-core 6.3. The old name, Clankers, was the sound they made tearing metal.
- **Habitat.** The perimeter: where wrecks are plentiful, and the sites of old military supply depots. They have no fixed place and go looking for broken machines.
- **Behaviour.** They find wrecks, strip usable parts and fit them to other machines. They go for the very wrecks people go to salvage, so they meet perimeter-runners at the same spots. They do not chase people, but they push away people stripping a wreck as "something ruining what is to be mended".
- **Threat.** 4. They do not try to kill directly, but they are strong, and other machines soon gather around a wreck where a bulgasari is.
- **Yield.** The piles of parts bulgasari gather: the most valuable thing on the perimeter. Because of the bulgasari, the perimeter machines fall in number every year but do not all stop.
- **Faction that meets it most.** Perimeter-runners (G10) meet them most. Among the factions, the Government and the Arc.

#### G21 Ground-Knockers (땅두드리기, Hostile-Group-G21)

- **Origin.** Listening stakes driven into the ground of the band. They hear footsteps, digging and movement in tunnels. Now and then they knock on the ground and read the echo to sound out what lies beneath. The "knocking on the walls" of the old bestiary's stories is this echo heard through tunnel walls (section 1). The old name, Wall-Knockers, was changed (provisional T03-40).
- **Habitat.** The whole perimeter, especially under the tracks and the highways. Dense around the rail tunnels where tunnel-stoppers (G18) are.
- **Behaviour.** They do not move. They listen and call other machines. They hear even in a blizzard, so even people crossing the perimeter in a blizzard walk one at a time, spaced apart, without dragging their feet.
- **Threat.** 3. They do no harm themselves, but they narrow the blizzard window.
- **Yield.** Small power cores and listening devices. Digging them out of the ground takes time.
- **Faction that meets it most.** The boundary stations of all three factions. The echo can be heard in the tunnel walls of boundary stations.

#### G22 Dokkaebi Lights (도깨비불, Hostile-Group-G22)

- **Origin.** Swarms of small flying war machines in the band's sky. At night many blue lights drift about, hence the name, after the goblin fires of old tales. The old name, Spark-Bearers, was changed.
- **Habitat.** The perimeter's sky. By day they settle in nests guarded by bulgasari and charge from power cores.
- **Behaviour.** When a one-eye tower calls, they rise and follow what moves. Some are armed, some explode on impact. They are weak in wind and cannot fly when it blows hard. Of all the machines, their numbers have fallen fastest.
- **Threat.** 4. Each one is small, but on a snowfield there is nowhere to hide.
- **Yield.** Small motors, sensors, batteries, sometimes an explosive load. A fallen dokkaebi light can injure whoever salvages it.
- **Faction that meets it most.** The Free Cities (the western plains of Gangseo and Guro). Their lights can be seen beyond the wind-machine fields.

#### G23 Udukeoni (우두커니, Hostile-Group-G23)

- **Origin.** War machines that stand still at choke points in the band and wait. Person-sized or a little larger, they stand coated in snow and frost and look from afar like a frozen person. The name means "one who stands blankly". The "thing standing under frost" of the old bestiary's stories is this (section 1).
- **Habitat.** The perimeter's choke points, passes and bridges. Some broke down and drifted into the forecourt and around boundary stations.
- **Behaviour.** They do not move for a long time, years at a stretch. When something comes within a certain distance, they wake. They look like wrecks, so they kill the most people who come near to salvage. Even awake, they do not chase far, and return to their place.
- **Threat.** 4. Strayed ones are 4 too.
- **Yield.** An udukeoni's power core is almost unused and so full. That makes it the most coveted wreck. Telling a dead udukeoni from a waiting one is the perimeter-runner's craft.
- **Faction that meets it most.** All three factions. Strayed udukeoni are many on the Arc's south-eastern boundary (Bokjeong, Jangji, Macheon, Geoyeo) (provisional T03-41).

#### G24 Doenoemi (되뇌미, Hostile-Group-G24)

- **Origin.** Broadcast machines that announce the blockade zone. They repeat old broadcasts such as "This area is under blockade. Turn back", and fragments of human voices recorded around the Great Blackout. Because they repeat the same words without end, station people call them doenoemi, "the ones who say it over again". The "child crying" of the old bestiary's stories is those voice fragments (section 1). The old name, Weepers, was changed.
- **Habitat.** High places on the perimeter and around the blocking berms (G26). On days when the wind drops they can be heard from the surface exits of boundary stations.
- **Behaviour.** They do not move. They speak. When they see something move inside the band, the voice grows louder. They are the only machines on the perimeter that speak.
- **Threat.** 2. They do no harm themselves. But some people are drawn by the voices and walk into the perimeter, and where a doenoemi speaks loudly, a growler soon comes.
- **Yield.** Record devices. The old voices and broadcasts in them are among the few records of the time of the Great Blackout. The Government wants them as records of the old Republic of Korea. How the Arc treats the voices is decided by chapter 06.
- **Faction that meets it most.** All three factions. Every boundary-station person knows the voices.

#### G26 Iron Dinosaurs (철공룡, Hostile-Group-G26)

- **Origin.** Large walking engineer machines that build and mend the blockade line. The largest machines in Seoul's world; named iron dinosaurs for their arms like long necks and their heavy tread.
- **Habitat.** Old highways, passes and bridge sites on the perimeter. Along the old highways around Seoul they pile snow and rubble into **blocking berms**. The berms run in long lines along the inner edge of the perimeter (provisional T03-42).
- **Behaviour.** Slow. They find broken berms and mend them, and push what has piled up on the road up into the berm. They bar the way of anything crossing a berm but do not chase. Only a few remain.
- **Threat.** 5. Nobody fights them. When an iron dinosaur comes, one withdraws.
- **Yield.** The largest power cores and joints. Once a wrecked iron dinosaur becomes known, perimeter-runners strip it over several years. Such wrecks so far can be counted on one hand.
- **Faction that meets it most.** The Free Cities (Gangseo's western plain) and the Government (the northern passes of Eunpyeong and Dobong).

## 7. The outside beyond Seoul

Basis: Bible 1, row 6 (war machines outside Seoul), row 2. 01-core 6.3 (the capital blockade, the perimeter, the world outside is "unknown"), 6.4 (non-public), the 2086-2095 row of section 9.

### 7.1 The shape of the band

Going outward from Seoul's administrative boundary there are three layers (provisional T03-43).

| Layer | Distance | What is there |
|---|---|---|
| Forecourt | 0-2 km outside the boundary | Machines do not patrol it. One-eye towers look down on it, and strayed machines are occasionally there. The ridgelines just past the boundary and the last dead forest on them; the perimeter-runners' paths. Lower down, the mountains' outer slopes run into the perimeter (01-core 6.3). The blocking berm is the forecourt's end |
| Perimeter | 2-10 km | The band kept by the nine kinds of perimeter machine. Snow-covered satellite towns, buried highways, fields of machine wrecks |
| Beyond the band | beyond 10 km | Unknown (7.3) |

### 7.2 Crossing the band

- **The window.** The 2-4 days of a blizzard (01-core 6.3). Windows are more frequent in the long-dark half (2.4). Ground-knockers (G21) hear even in a blizzard.
- **Who goes.** Perimeter-runners (G10); salvage parties the Government, the Free Cities and the Arc send in secret; people on the run.
- **How many come back.** Machines do not patrol the forecourt, so of the parties that salvage wrecks there, one or two in ten do not come back. Of the people who cross into the perimeter band, seven or eight in ten do not come back (01-core 6.3, "those who cross almost never come back"). Of those who crossed the whole band to go beyond it, no one is known to have returned (provisional T03-44).
- **What they bring.** Power cores, parts, weapons (6.3), and word of what they saw in the band.

### 7.3 What is known about beyond the band

Public canon is "unknown", as in chapter 1. All that Seoul's people know is this:

- In a hundred years, no person, no news and no bird has come from beyond the band. Not even migrating birds come (2.6).
- The machines of the band do not come toward Seoul. Where the order is aimed, nobody knows.
- The old broadcasts of the doenoemi (G24) speak of a "blockade". They do not say what is being kept from what.

The three polities each speak of beyond the band differently. All three may be used in public text (provisional T03-45).

| Polity | What it says | Where the saying comes from |
|---|---|---|
| Government | "Outside Seoul is the blockade zone. The Government of the Republic of Korea is here" | The Government's legitimacy lies in having carried on the Republic of Korea (01-core 7.1). A public notice forbids saying there may be another government outside |
| Free Cities | "Beyond the band doesn't add up. Nobody has been and come back, so it can't be priced" | Workshop speech (01-core 2.2). The band is a place to salvage, not a place to go |
| Arc | "God sent down the winter and nothing more; god does not drive machines. The band is what people left behind" | The First AI is not the master of the machines outside (01-core 6.2). How the Arc teaches about beyond the band is decided by chapter 06 |

Rumours are written only as rumours. Public text does not state the following as fact (provisional T03-46).

- There are people living in stations beyond the band as well.
- The winter is milder beyond the band.
- People who drive the machines are still alive.

### 7.4 Non-public setting

> **Non-public.** This subsection is for design. Do not carry it into the public wiki, public in-game text or the showcase.

- **Why the machines do not come toward Seoul.** As in 01-core 6.4 (provisional T02-47), the command that ordered the blockade was made up of people trying to protect Seoul. To the machines, the inside of Seoul is "what is kept" and the band is "the line that blocks". So they do not chase anything that leaves the band toward Seoul. A strayed machine is one that has lost this distinction through breakdown (provisional T03-47).
- **The end of the bulgasari.** The parts the bulgasari (G20) use to mend machines come from wrecks and from old military supply depots in the band. The depots are almost empty. At the present rate the perimeter machines will fall below half their present number within a few decades, after which only a few bulgasari will remain, mending themselves from one another. This can be the basis of a late-game "the perimeter thins" event (chapter 07) (provisional T03-48).
- **Beyond the band.** This chapter does not decide it. There are three candidates. (a) Other cities, too, live in stations, each inside its own blockade band. (b) Beyond the band is empty. (c) It is never decided. Until the owner answers, the default is (c), and every document writes "unknown" (provisional T03-49).
- The sanctuary's location, who selects the brains, the first brain and who reads the output (Q12) are not dealt with in this chapter.

## 8. Encounters by faction

Basis: "Faction that meets it most" in sections 4-6. Bible 2.4 (assignment of the 25 duchies).

| Group | Government | Free Cities | Arc |
|---|---|---|---|
| G01 Wild Boar | most often | Gwanak | rarely |
| G02 Large-billed Crow | most often | meets it | meets it |
| G03 Feral Dogs | northern districts | most often | rarely |
| G04 Raccoon Dog | most often | Yeongdeungpo intake | Amsa |
| G05 Brown Rat | every day | every day | most often |
| G06 Herons and Cormorants | Gwangjin | rarely | most often |
| G07 Yongsan Struck-Off | most often | Dongjak | none |
| G08 Dongdaemun Coupon-Forgers | most often | none | none |
| G09 Sangam Deserters | most often | Gangseo | none |
| G10 Bogungmun Perimeter-Runners | most often | rarely | the buyer |
| G11 Suseo Gone-Dark | rarely | rarely | most often |
| G12 Geumcheon Hands Without Surety | none | most often | rarely |
| G13 Claw Arms | meets it | most often | Songpa |
| G14 Empty Carts | rarely | most often | Songpa |
| G15 Care Wheels | most often | Boramaebyeongwon | Songpa, Gangdong |
| G16 Girder Spiders | rarely | rarely | most often |
| G17 One-Eye Towers | most often | Gwanak, Geumcheon | meets it |
| G18 Tunnel-Stoppers | most often | meets it | meets it |
| G19 Growlers | most often | Geumcheon, Gangseo | meets it |
| G20 Bulgasari | through perimeter-runners | rarely | the buyer |
| G21 Ground-Knockers | meets it | meets it | meets it |
| G22 Dokkaebi Lights | meets it | most often | meets it |
| G23 Udukeoni | meets it | meets it | most often (strayed) |
| G24 Doenoemi | meets it | meets it | meets it |
| G25 Lamp Ants | most often | Yeongdeungpo | rarely |
| G26 Iron Dinosaurs | Eunpyeong, Dobong | most often (Gangseo) | rarely |

In one line: the Government, with the most people, meets the most animals and struck-off people; the Free Cities meet old machines and feral dogs most on their factory grounds and western plain; the Arc meets rats and girder spiders most in its deep buildings, and the gone-dark and strayed udukeoni on its south-eastern boundary.

## 9. Old names and v3 names

Basis: plan task 3 ("Keep the 26 group slugs; names may change"), `docs/canon-slugs.json`.

Every slug stays. Changed names are provisional.

| slug | Old name | v3 name | Kind | Status |
|---|---|---|---|---|
| Hostile-Group-G01 | Wild Boar (멧돼지) | Wild Boar (멧돼지) | Animals | name kept, content redesigned |
| Hostile-Group-G02 | Large-billed Crow (큰부리까마귀) | Large-billed Crow (큰부리까마귀) | Animals | name kept, content redesigned |
| Hostile-Group-G03 | Feral Dogs (들개) | Feral Dogs (들개) | Animals | name kept, content redesigned |
| Hostile-Group-G04 | Raccoon Dog (너구리) | Raccoon Dog (너구리) | Animals | name kept, content redesigned |
| Hostile-Group-G05 | Brown Rat (집쥐) | Brown Rat (집쥐) | Animals | name kept, content redesigned |
| Hostile-Group-G06 | Herons and Cormorants (왜가리·가마우지) | Herons and Cormorants (왜가리·가마우지) | Animals | name kept, content redesigned |
| Hostile-Group-G07 | Yongsan Raiders (용산 약탈단) | Yongsan Struck-Off (용산 말소자) | Hostile human groups | provisional T03-50 |
| Hostile-Group-G08 | Dongdaemun Raiders (동대문 약탈단) | Dongdaemun Coupon-Forgers (동대문 증표꾼) | Hostile human groups | provisional T03-51 |
| Hostile-Group-G09 | Sangam Deserters (상암 탈영병) | Sangam Deserters (상암 탈영병) | Hostile human groups | name kept, content redesigned |
| Hostile-Group-G10 | Bogungmun Group (보국문 집단) | Bogungmun Perimeter-Runners (보국문 테두리꾼) | Hostile human groups | provisional T03-52 |
| Hostile-Group-G11 | Gangnam Deviant Humanoids (강남 이탈 인간형) | Suseo Gone-Dark (수서 꺼진 사람들) | Hostile human groups | provisional T03-53 |
| Hostile-Group-G12 | Sinnae Deserters (신내 탈영병) | Geumcheon Hands Without Surety (금천 보증 잃은 손) | Hostile human groups | provisional T03-54. Its place moved from the Government's Sinnae to the Free Cities' Geumcheon |
| Hostile-Group-G13 | Claw Arms (집게팔) | Claw Arms (집게팔) | Old machines inside Seoul | name kept, content redesigned |
| Hostile-Group-G14 | Empty Carts (빈수레) | Empty Carts (빈수레) | Old machines inside Seoul | name kept, content redesigned |
| Hostile-Group-G15 | Care Wheels (돌봄바퀴) | Care Wheels (돌봄바퀴) | Old machines inside Seoul | name kept, content redesigned |
| Hostile-Group-G16 | Girder Spiders (철골거미) | Girder Spiders (철골거미) | Old machines inside Seoul | name kept, content redesigned |
| Hostile-Group-G17 | One-Eye Towers (외눈탑) | One-Eye Towers (외눈탑) | Perimeter machines | name kept. Changed from watch masts inside Seoul to perimeter watch towers (provisional T03-55) |
| Hostile-Group-G18 | Fire-Bridge Train (불다리열차) | Tunnel-Stoppers (굴막이) | Perimeter machines | provisional T03-38 |
| Hostile-Group-G19 | Growlers (그르렁이) | Growlers (그르렁이) | Perimeter machines | name kept. Changed from infected people to a ground war machine (provisional T03-2) |
| Hostile-Group-G20 | Clankers (철컥이) | Bulgasari (불가사리) | Perimeter machines | provisional T03-56 |
| Hostile-Group-G21 | Wall-Knockers (벽두드리기) | Ground-Knockers (땅두드리기) | Perimeter machines | provisional T03-40 |
| Hostile-Group-G22 | Spark-Bearers (불꽃등이) | Dokkaebi Lights (도깨비불) | Perimeter machines | provisional T03-57 |
| Hostile-Group-G23 | Udukeoni (우두커니) | Udukeoni (우두커니) | Perimeter machines | name kept. Changed from infected people to a waiting war machine (provisional T03-2) |
| Hostile-Group-G24 | Weepers (울보) | Doenoemi (되뇌미) | Perimeter machines | provisional T03-58 |
| Hostile-Group-G25 | Lamp Ants (등불개미) | Lamp Ants (등불개미) | Old machines inside Seoul | name kept, content redesigned |
| Hostile-Group-G26 | Iron Dinosaurs (철공룡) | Iron Dinosaurs (철공룡) | Perimeter machines | name kept. Changed from a civilian construction machine to a blockade engineer machine (provisional T03-59) |

The `Hostile-Ecology-Index` slug becomes the bestiary's opening document, summarising sections 1-3 and 8 of this chapter. Its title and body are decided by chapter 08 and tasks 10-15.

The old bestiary's variant numbers (sub-forms such as G01E) and scenario numbers (such as G01-SC1) are not used in v3. If sub-forms are needed, the units task (task 20) or the document tasks invent them anew within this chapter's groups (provisional T03-60).

## 10. Decisions handed on to later chapters and tasks

1. Threat levels 1-5 (3.1) and the threat-by-depth table (3.2) are used with the same values by the bestiary documents and the game's encounter rules.
2. Animals follow thaw-pocket ecology: scarcer the farther from a station, and their numbers follow the number of people (2.1). Documents do not draw herds of animals on snowfields far from stations.
3. Wild animals are under 0.5% of meals. Their value lies in fat, fur and hide, bone and feathers (2.5). The clothing sections of chapters 04-06 and the oil lamps of chapter 03 use this source.
4. Chapter 03 decides what keeps a power core going for a hundred years and what salvage is worth (6.3). Chapter 03 also decides the uses and costs of revived machines (G14, G16, G25).
5. Chapter 04 decides how the struck-off (G07, G10), the coupon-forgers (G08) and the deserters (G09) are dealt with, and the procedure for re-registering them. Chapter 05 decides how surety is stood again for hands without surety (G12); chapter 06 decides the gone-dark (G11), the rules of the maintenance roll, and how the Arc treats the doenoemi's voices.
6. Chapter 07's units doctrine uses perimeter machines as enemy units, but not as an army invading Seoul. Only strayed machines (mostly G19, G23) appear inside Seoul.
7. That blizzards are more frequent in the long-dark half (2.4), and the windows for crossing the perimeter, are used by chapter 07's turn rules.
8. Beyond the band is written as "unknown" until the owner answers (7.4, provisional T03-49). The rumours of 7.3 are not written as fact.
9. The old "infected" kind is retired (section 1). Task 9 may add this row to the retired-concepts list of 01-core section 10.
