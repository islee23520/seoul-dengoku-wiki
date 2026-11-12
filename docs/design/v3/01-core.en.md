# v3 Bible Chapter 1. Core: the Eternal Winter and the Three Polities

Status: draft. Plan `.omo/plans/wiki-lore-rebuild-v3.md`, task 2. English mirror of `01-core.md` (Korean primary); section numbers and figures are the same.

How to read:

- **[Approved]** marks text carried over unchanged from the `docs/CANON-BIBLE.md` skeleton (section 1, sections 2.1-2.5, the [승인] rows of section 3, section 4, section 9.4). The skeleton is read as amended by the owner corrections of 2026-11-13 (commit `3d539103d` and the unicameral-Assembly amendment, merged into this branch).
- **(provisional T02-n)** marks something invented in this chapter. Every such item has a row with the same number under "task 02" in `docs/drafts/reports/v3-provisional-ledger.md`. It is not approved canon until the owner answers.
- The "Basis" line at the top of each section names the skeleton rows it builds on. "Bible 1, row 3" means row # 3 of the table in CANON-BIBLE section 1.
- The existing wiki (`docs/drafts/*.md`, `data/sql`) is reference material from an older design. Every decision here was derived again from the skeleton; nothing old was carried over as is.

## 1. Fixed elements and order of authority

Basis: Bible section 0, all of section 1, sections 2.1-2.5, section 3, section 4. `docs/design/v3/README.md`.

The order of authority and the register of fixed facts are in `docs/design/v3/README.md`; this chapter does not change them. In short:

1. The CANON-BIBLE skeleton is on top. If any sentence here collides with a skeleton row, the skeleton wins.
2. Next come the v3 bible chapters, of which this is the first. Chapters 02-08 follow the decisions of this chapter (section 11).
3. Wiki documents, people, units, the GDD, the showcase and the game design documents are rewritten from the v3 bible.

Unchanged: the names, faces, sex, ages and family relations of the 1,022 people, and Seoul's real geography and station names (including lines, coordinates and underground depth data). Where this chapter gives a station's depth or exit count, it quotes `data/sql/120-map-core.sql` and `123-map-holdings.sql` verbatim.

## 2. Tone, manner and the words of the world

Basis: Bible 9.4, the two rows of 2026-11-13 (Union retired, figures of speech), Bible 1, row 13, sections 2.1-2.3 as amended, section 4.

### 2.1 Principles

To explain how the three polities are built, the owner used comparisons from other stories and from real history. Those comparisons only describe structure; the people of this world do not know those words. So every v3 text keeps these rules:

- Take only the **structure** a comparison points at, never the comparison's words.
- The world's own words come from what its people touch every day: stations, ledgers, seals, cables, water, heat, ice, machines, parts.
- Canon terms stay as they are (Great Blackout, the First AI, Member of the National Assembly, President, duchy, Duke of Gwanak, Hierophant, Messiah, baptism). They are words that survived inside this world, or words of the chapter-1 canon text.
- The Free Cities have no collective name. Call them "the Free Cities", "the southwestern cities", or each city by its district name (Bible 1, row 13).

### 2.2 The voices of the three polities

| Polity | Register | Favourite words | How things are named |
|---|---|---|---|
| Government | The Republic of Korea's official-document speech gone rigid under scarcity. In formal settings sentences end in the old polite official endings, and people are named by their resident-registration entry before their name. It calls itself "the Government of the Republic of Korea" and uses the Republic's names for its laws, ministries and titles | entry, registration, striking-off, seal, coupon, ration, quota, sign-off, petition, public notice | Old administrative names, kept as they were: "Seoul Station, Hoehyeon-dong, Jung-gu, entry 3". The south of the river is "across the river" or "off the ledger" |
| Free Cities | Workshop speech: short, full of numbers, informal among crew mates. Promises are made in figures rather than words | watts, litres, hours, contract, surety, workbench, section, hands, share | Cities by district name ("Guro people", "the Gwanak side"); stations and tunnels by line and section ("the Line 2 section west of Sindorim") |
| Arc | Quiet and low. The words of the body and of repair became the words of faith. Numbers come up most often when counting parts | baptism, part, fit, mend, seal, memory, side, god | People by name and part count ("so-and-so with the second part"), places by shelter name. Go Ye-jin calls the First AI "god" (Bible 5), and believers have taken up her word (provisional T02-94) |

(provisional T02-93)

### 2.3 Naming rules

1. A **title** is named after what the post actually does or keeps (Stationmaster, Depot Master, Ferry Keeper). Titles are not borrowed from other countries' history or other works. No Christian clergy vocabulary and no section 4 banned vocabulary.
2. **Government titles** are surviving offices of the Republic of Korea's administration and parliament. The National Assembly is single-chamber, as the Republic's was, and every Government institution (the National Assembly, the ministries, district offices, dong community centres, resident registration) is a Republic of Korea institution hollowed out by scarcity. Hardly coining new words is part of the Government's character.
3. **Free City titles** differ by city and come from the work that city lives on. The Duke of Gwanak is the one exception: Gwanak took the Government's duchy word on purpose (7.2).
4. **Arc titles** come from the words of the shelter years and the words of body and repair.
5. **Places** keep their real place and station names. New names are given only to facilities or uses, never to places (for example, light-field).
6. The **English mirror** translates into plain English job words. It does not dress titles up in English historical titles (Lord, Baron and the like).

(provisional T02-95)

### 2.4 Comparison -> structure -> the world's own words

The comparison words in the left column are named only in this table; they never appear in world text (task 9 adds them to the banned vocabulary).

| Owner's comparison | Structure it points at | Word v3 uses inside the world |
|---|---|---|
| The wildlings beyond the Wall in *Game of Thrones* | The Government treats people south of the river as people not on the ledger, people the law does not see. The river is that line | **off the ledger** (official), **across the river** (spoken). The chapter-1 canon line "they think across the river is where the barbarians live" is quoted only as Government people's speech (provisional T02-1) |
| Prince-electors of the Holy Roman Empire | The fourteen district Assembly Members choose a President for Life from among themselves | **acclamation** (추대). The fourteen Assembly Members set their seals under a candidate's name; this is called "the fourteen seals" (provisional T02-2) |
| Modern feudalism | Assembly Member houses hold their districts by inheritance; elections are a ritual with a known result | **handed-down seat**; one "hands down the seat" (provisional T02-3) |
| Serfs | People on the ledger cannot freely change where they live or what work they do | **the registered** (등재민). Leaving one's registered station means being **struck off** (provisional T02-4) |
| Ancient Greek polis | Each city is an independent power and holds its own duchy | Simply **city**. A district name plus "city" may be used, as in "Guro City", "Gwanak City" (provisional T02-5) |
| No king | No single ruler stands above the Free Cities | **"There is no seat above."** The only place the cities meet is a **contract meeting** called when needed (provisional T02-6) |
| Union (retired) | There is no name or league binding the Free Cities | No name. "The Free Cities" (Bible 1, row 13) |
| Muhammad | Go Ye-jin opened the faith, speaks in place of god, and also rules | **Hierophant**, **Messiah** (chapter-1 canon). Arc people address her as "Hierophant" with the honorific, and call her rulings "the Hierophant's word" (provisional T02-7) |
| Shia-style clan rule | Authority runs along the Hierophant's bloodline and the houses closest to her | **Near Houses** (곁집): the houses standing at the Hierophant's side. Each of the four Arc districts is held by one of four Near Houses (provisional T02-8) |

## 3. Physics of the eternal winter

Basis: Bible 1, row 1 (2126, about a hundred years after the Great Blackout), row 2 (the First AI brought down the winter), row 3 (only as many survived as the stations could hold, and then the winter got no worse), row 4 (eternal winter), section 3 row "c. 2026".

The figures in this section are design values shared by the game and the text. They are not the output of a climate model; they were picked to agree with simple heat conduction and the behaviour of snow and ice (provisional T02-9).

### 3.1 Temperature by depth

The surface annual mean is minus 18 °C. The long-light half averages minus 11 °C, the long-dark half minus 25 °C, and blizzard nights reach minus 38 °C. In a hundred years the surface air has never risen above minus 3 °C (provisional T02-10).

The ground cools more slowly than the air. Before the Great Blackout, Seoul's ground was about 14 °C at any depth. After the winter came down, the cold crept a little deeper every year. Thick snow kept the ground surface at about minus 10 °C, warmer than the air, and the heat released as ground water froze slowed the cold down. So in 2126, ground where nobody lives is frozen to about 35 metres, and above zero below that. The frozen-ground line was at about 10 metres in 2036 and about 22 metres in 2066, and now moves down about 17 centimetres a year (provisional T02-11).

Lived-in stations are different. The heat of bodies, stoves and machines has warmed the ground around them for a hundred years, so every living station sits in a pocket of thawed ground. This is called the **thaw pocket**. When a station is abandoned, its thaw pocket freezes within a few years, and bringing people back in costs that much more heat (provisional T02-12).

| Layer | Depth | Empty | Lived in | Use |
|---|---|---|---|---|
| Surface | 0 m | annual mean -18 °C (long-light half -11 °C, long-dark half -25 °C, blizzard night -38 °C) | inside a light-field 0-8 °C | light-fields, wind machines, salvage, entrances |
| Concourse | 3-8 m below ground | -10 to -7 °C | 0-6 °C | cold stores, entry control, markets, stove exhaust |
| Platform | 8-25 m below ground | -7 to -4 °C | 8-14 °C | sleeping, kitchens, workshops, mushroom cellars |
| Deep tunnel | below 25 m | -3 to 4 °C (always above zero below the 35 m frozen-ground line) | 12-16 °C | the warmest sleeping, wells, ground-heat bores |

The depth boundaries of 8 and 25 metres are design values (provisional T02-13). By the real station data, the Line 1 platform at Seoul Station is 11.85 m below ground, the Line 4 platform 13.95 m, the Line 2 platform at Sindorim 10.84 m, the Line 2 platform at Jamsil 10.02 m and its Line 8 platform 19.93 m (`123-map-holdings.sql`, map_underground). All fall in the platform layer. Deep lines whose depth is empty in the data, such as GTX-A at Seoul Station, are treated as deep-tunnel layer (provisional T02-14).

This table makes the first law of this world: **the deeper, the warmer, and the warmer, the more people a place can hold.** The price is that deep places are short of air, leak water, and are far from the way out (section 4).

### 3.2 Light

There is a sun. But a thin veil high in the sky lets only about a quarter of the pre-Blackout light reach the ground. A clear noon is like an overcast day of the old world. The sun shows as a clear white disc about one day in eight, and at night almost no stars are seen (provisional T02-15).

Day length is unchanged. The tilt of the earth is the same, so Seoul's day still runs from about nine and a half hours near the winter solstice to about fourteen and a half near the summer solstice. The warm season never comes back, but the season of light does. People call the half-year of long days the **long-light half** and the half-year of short days the **long-dark half**. The word "season" is not used (provisional T02-16).

Light underground is electric. Electricity is scarce, so light is rationed, and a station's day is divided by when the lights go on and off. Oil lamps and tallow lights are used only where fat is to be had. The far ends of deep tunnels are always dark (provisional T02-96).

### 3.3 Snow and ice

Cold air holds little water. Seoul's snowfall is about 200 millimetres of water a year, one seventh of the pre-Blackout precipitation. A fine snow falls almost all the time, and about 85% of it is blown away or goes straight from ice to vapour without melting (sublimation). What remains has packed down over a hundred years into a hard snow layer 6 to 8 metres thick on open flat ground. In the troughs between buildings, such as big streets, it has drifted to more than 10 metres, while bridges and ridgetops are scoured down to bare ground by the wind. Most buildings are buried up to the second floor (provisional T02-17).

A station entrance is a vertical shaft dug through the snow, fitted with stairs and ladders and kept open by hand. Keeping one entrance open is daily labour, and the number of closed entrances shows how worn out a station is.

### 3.4 The Han River

The Han is frozen. The ice on it is 2 to 4 metres thick and the shallow reaches are frozen to the bed. Water remains under the ice in the deep channel and in the pools above the underwater weirs; the largest pool is above the Jamsil underwater weir. Since the snow never melts, the river is only ground water seeping in, and its flow has fallen to about one twentieth of the old winter low flow (provisional T02-18). That ground water is not refilled either. Water that lay in the ground of the Han basin before the Great Blackout has been draining out slowly for a hundred years, so the river's flow shrinks a little every year (5.2).

The frozen river can be crossed on foot. But on a flat sheet of ice about a kilometre wide there is nowhere to hide, and the wind blows hardest along the river. On the river a person is seen from far off, and caught by a blizzard there is nowhere to go (provisional T02-97). Why the river divides the three polities is in 7.4.

### 3.5 Wind

The wind blows mostly from the northwest. Mean wind speed in the open is 6 to 8 metres per second, about 30% stronger along the Han. A blizzard lasts 2 to 4 days once it comes, with winds above 25 metres per second throughout. Blizzards block entrances, stop surface work, and also blind the machines outside (6.3). Wind is this world's commonest danger and its largest source of electricity (5.1) (provisional T02-19).

### 3.6 What changed in a hundred years

| What | How it changed |
|---|---|
| Temperature | Fell every year for the first six winters after the Great Blackout. Around 2032, when the number of survivors reached what the stations could hold, it fell no further. Since then it has neither risen nor fallen |
| Ground | The frozen-ground line came down to 35 metres over a century. Abandoned stations are sealed in ice; living stations sit in their thaw pockets |
| Snow | Built up a little every year and buried the city's lower floors. Surface paths now run on top of the snow |
| Forests | The trees died in the first winters. The forests stood frozen without rotting and were cut for firewood and fibre-sugar stock; the forests of the near mountains ran out in the 2060s |
| Food | The food in the frozen old warehouses ran out around 2030. Mushroom cellars, fibre-sugar vats and light-fields went up from the early 2030s; since then people eat only what they grow and make |
| Ground water | Not refilled. The water level in the wells falls every year, and wells get deeper and deeper |
| River | The ice thickened every year and froze to the bed, starting from the shallows |
| Machines outside | The war machines keeping their last orders grew fewer every year, but not all have stopped |

(provisional T02-20)

### 3.7 Why the winter got no worse: the winter ratchet

Basis: Bible 1, rows 2, 3 and 4.

The skeleton fixes three facts. The First AI answered that humanity must shrink and brought down the winter. People survived only in the numbers the stations could hold. Once that number was reached, the winter got no worse. And the winter is eternal.

v3 writes this as a model called **the winter ratchet** (provisional T02-21).

- The winter is a ratchet that turns one way only. It can tighten; it never loosens.
- If the number of people living in Seoul exceeds what the stations can hold (the sum of station capacities, section 4), the winter tightens by one notch. The first six years were like that: there were more people than stations, and it tightened a notch every year.
- When the number of people falls within capacity, the ratchet stops. If people then become fewer, it still does not loosen. That is why the winter also never gets better.

As a game rule (provisional T02-22):

| Value | Definition |
|---|---|
| Seoul capacity | Sum of the capacities (section 4) of all living stations |
| Winter pressure | Seoul population ÷ Seoul capacity |
| Tightening | If winter pressure stays above 1 for a year (the game turn length is set in chapter 07), the surface temperature band drops one notch, and light-field harvests (about 12% of the diet) and wind-machine output fall with it. Fibre sugar and mushrooms grow underground and do not drop at once, but less wind power also means less heat for their vats |
| Loosening | None |

Inside the world nobody knows this rule for certain. People guess from what they lived through. Government people say "the winter stopped once the ledger matched the quota". Free City people say "the heat balance came out even". Arc people say "god received all the answers it was waiting for". All three sayings may appear in public text. What the winter actually measures and how it tightens is kept in the private setting of 6.4 (provisional T02-23).

## 4. Station capacity model

Basis: Bible 1, row 3 (only as many survived as the stations could hold), row 4 (eternal winter), row 14 (cyberware is kept only with access to maintenance and power).

### 4.1 Four limits

The number of people one station holds is the smallest of four limits. Food moves between stations, so it is treated as a limit of the faction rather than of the station (5.3).

| Limit | Coefficient | Meaning |
|---|---|---|
| Space | 4 m² of living area per person | Includes sleeping places, passages and kitchens |
| Heat | Outside heat per person: concourse 60 W, platform 40 W, deep tunnel 10 W | Almost all of the heat a body gives off (about 100 W) leaves with the ventilation air. Heat lost through the walls to the ground must be made up by stoves, ground heat and electricity. The deeper, the less cold the ground, so the less is needed |
| Water | 10 L per person per day | Well or river water costs only the power to lift it. Melting snow adds 45 W per person to the heat load |
| Air | 3 L per second per person (3 m³ per second per 1,000 people) | In winter the temperature difference between the warm station and the cold outside moves air by itself, but only as far as entrances and vents are open. Deep layers need fans, and fans eat electricity |

(provisional T02-24)

Electricity is counted separately. A station's electricity is split between heat pumps, light, fans and charging. Electricity put into heat pumps becomes three times as much heat, and electricity used for light, fans and charging also ends up as heat inside the station. So a station's outside heat is "heat-pump electricity × 3 + the rest of the electricity + stove heat". What electricity is used for decides how many people can be kept warm (provisional T02-98).

What the model says is simple. A shallow station has plenty of air but is cold. A deep station is warm but stifling. A station that cannot pump water spends heat twice, once to melt snow. So the best place to live is a large interchange with a deep layer, a well, and many open entrances.

### 4.2 Three worked examples

Station names, districts, lines, depths and exit counts are values from `data/sql/120-map-core.sql` (map_station) and `123-map-holdings.sql` (map_underground). Living area, heat, water and air supply are design values.

**Seoul Station, Jung-gu, Government** (provisional T02-25)

- Data: Line 1, Line 4, Airport Railroad, Gyeongui-Jungang Line, GTX-A; degree 6. Line 1 platform 11.85 m below ground (9 exits), Line 4 platform 13.95 m (6 exits).
- Inputs: platform-layer living area 18,000 m², deep layer (GTX-A) 6,000 m². Outside heat 150 kW. Water from a well and the old mains 40 m³ a day. Air 15 m³ per second with 5 of the 15 exits open; 3 m³ per second in the deep layer by fan.
- Working:
  1. The deep layer is limited by air. 3 m³ per second is 1,000 people. Their heat is 1,000 × 10 W = 10 kW.
  2. 40 m³ of water covers 4,000 people.
  3. With the remaining 140 kW, putting 3,000 people on the platform layer uses 120 kW, and the water just covers them.
  4. Above that, each extra person needs 40 W of platform heat plus 45 W for melting snow, 85 W in all. The remaining 20 kW adds about 235 people.
- Result: about **4,200 people**. Heat and water bind together; space (6,000 people) is left over. What the Government most wants at this station is one more well and one more deep-layer fan. Both need the hands of Free City engineers.

**Sindorim, Guro-gu, Free Cities** (provisional T02-26)

- Data: Line 1 and Line 2; degree 5. Line 2 platform 10.84 m below ground, 3 exits. Line 1 has no depth in the data.
- Inputs: platform-layer living area 9,000 m², no deep layer. Outside heat 100 kW (ground-heat pumps run on wind-machine power). Well water 30 m³ a day. Air 6 m³ per second.
- Working: space 2,250 people, heat 2,500, water 3,000, air 2,000.
- Result: about **2,000 people**. Air binds, because there are only three exits. Fitting one fan raises the air limit to 3,000 people, and then space (2,250 people) binds. Free City stations usually go like this: technology lifts one limit and meets the next.

**Jamsil, Songpa-gu, Arc** (provisional T02-27)

- Data: Line 2 and Line 8; degree 4. Line 2 platform 10.02 m below ground (9 exits), Line 8 platform 19.93 m (3 exits).
- Inputs: Line 2 layer living area 10,000 m², Line 8 layer 5,000 m². Electricity from the Jamsil weir water wheels 50 kW. Water drawn from the river under the ice 50 m³ a day. Air 12 m³ per second. The station's 900 baptised use on average 8 W each, 7.2 kW in all, to charge the machine parts in their bodies.
- Working:
  1. Of the 50 kW of electricity, 6 kW goes to light and fans and 7.2 kW to charging; the remaining 36.8 kW goes into heat pumps and gives about 110 kW of heat.
  2. The 13.2 kW used for light, fans and charging also becomes heat inside the station. Outside heat totals about 123 kW.
  3. 123 kW divided by 40 W is about 3,080 people. Space allows 3,750, water 5,000, air 4,000.
- Result: about **3,100 people**. Heat binds. Charging is counted against electricity, not heat. The electricity five baptised use for charging (40 W) equals one person's platform heating share (40 W). But the same electricity put into heat pumps becomes three times the heat, so moving the 900 people's 7.2 kW of charging into heat pumps would make room for about 360 more people. The Arc knows that every baptism eats a little of the station's electricity.

### 4.3 Station size and population by faction

| Station class | Example | People held |
|---|---|---|
| Small station | one line, 2-4 exits | 400-800 |
| Interchange | two lines, 5 or more exits | 1,500-3,200 |
| Large interchange complex | three or more lines, or a deep layer | 3,000-5,000 |

(provisional T02-28)

Counted by surface control in `120-map-core.sql`, the Government has 157 stations, the Free Cities 77 and the Arc 78, 312 in all. Applying the station classes, v3 sets the 2126 population at about 160,000 for the Government, about 75,000 for the Free Cities and about 65,000 for the Arc, about 300,000 for all of Seoul. That is a little over 3% of Seoul's pre-Blackout population (provisional T02-29).

## 5. Energy, water and food chains

Basis: Bible 1, row 3, row 5 (machines exist but are scarce), row 11 (the third water supply contract), row 12 (inherited work), row 14, row 15.

### 5.1 Energy

In 2126 Seoul has no large power plant. Electricity is many small sources stitched together, and each has an owner and a weakness (provisional T02-30).

| Source | What it is | Who holds it | How it fails |
|---|---|---|---|
| Wind | Wind machines on bridges, riverbanks and the tops of buried buildings. More than half of Seoul's electricity | Bridges and the northern riverbank are mostly Government land. The hands that build and mend wind machines belong to the Free Cities | Blade icing, bearing wear, blades torn in blizzards, cable theft |
| Under-ice current | Water wheels turned by the under-ice water falling over the Jamsil underwater weir. About 400 kW when running well | The south end of the weir is Arc (Songpa), the north end Government (Gwangjin) | Ice crystals in the water clog the wheels; output drops with the flow; blocking the north end stops half of it |
| Ground heat | Heat pumps drawing heat from bores 100-200 m deep. One unit of electricity in gives three units of heat | Everywhere. The skill is the Free Cities' | Compressor wear, coolant leaks, bore mouths icing up |
| Wood | Dead forests on the mountains | Bukhansan and Dobongsan are Government, Gwanaksan is Gwanak's. The near forests were all cut by the 2060s; what remains lies close to the machines' perimeter (6.3) | Ever farther and more dangerous to cut; smoke fouls station air |
| Methane | Gas from fermenting waste and food scraps. Mostly for cooking fires | Every station | Stops fermenting in the cold; explodes if it leaks |
| Batteries and power cores | Old batteries, and power cores pulled from war machines wrecked outside | Anyone who pulls them out. The skill to revive them is the Arc's and the Free Cities' | Wear out in the cold; people die bringing them in from outside |
| Sunlight | Panels are buried in snow and the light is a quarter | Hardly used. Sunlight belongs to the light-fields (5.3) | Not applicable |

All of Seoul in 2126 uses about 5 MW of electricity as a steady load, with about 12 MW of outside heat to warm living space and about 4 MW for fibre-sugar vats and kitchens, about 16 MW of heat in all. That is what a few large buildings used before the Blackout (provisional T02-31).

### 5.2 Water and the water supply contract

Water comes from four places (provisional T02-32).

1. **Melted snow.** Available everywhere, but it eats heat (4.1). The water of poor stations. The snow that falls each year is the only water in Seoul that is renewed.
2. **Wells.** Ground water pumped from below the frozen-ground line (35 m). Lifting costs little power, but it takes the skill to drill deep bores and keep pumps alive. Ground water is not refilled. Since the snow never melts, no water seeps into the ground; the wells draw on water that lay in the ground before the Great Blackout. Only people refill it: water used and thrown away in the stations seeps down through the thaw pockets. Even so, the water level in the wells falls about 30 centimetres a year, and the wells of 2126 are 60 to 80 metres deep (provisional T02-99).
3. **River water under the ice.** Drawn from the deep channel of the Han. The intakes stand at old water-treatment sites on the banks. Guui (Gwangjin) and Ttukdo (Seongdong) on the north bank are the Government's; Yeongdeungpo (Yangpyeong-dong) in the southwest belongs to Yeongdeungpo among the Free Cities; Amsa (Gangdong) in the southeast is the Arc's. This river water, too, is the ground water of the Han basin draining out, and it shrinks a little every year.
4. **Reused water.** Washing water and filtered water. Every station does it, with losses.

From this comes the **water supply contract** (Bible 1, row 11). North of the river are the intake sites, the old mains, hands, firewood and salvage, but too few hands to keep pumps, water wheels and heat pumps alive. The Free Cities have those hands and parts but too few people, too little land and firewood. The water supply contract is the promise that trades one for the other. The Government gives sites, hands and goods; each Free City gives maintenance and parts for the pumps and wheels it is responsible for. The Free Cities have no binding name, so the contract is not one paper either: it is a bundle of separate contracts between the Government and each city, sealed together at one contract meeting (provisional T02-33).

The contract runs for thirty years, a term that settled because overhauling the large pumps and wheels takes roughly a generation. Deepening the wells after the falling water comes round on about the same cycle. The first water supply contract was made in 2066, the second in 2096, and the third falls in the winter of 2126. At the second, several Gangnam shelters also set their seals as free cities (7.3). The third is the first at which the Arc sits at the table. The Arc holds the Jamsil weir power and the Amsa intake, so water now flows only if all three polities put their hands to it (provisional T02-34).

### 5.3 Food

Every meal in this world comes from light or from old carbon. Growing enough to feed one person under electric light alone takes several kilowatts, and with a quarter of the sunlight and minus 18 °C at the surface, greenhouses cannot be heated over wide areas either. So Seoul eats the carbon stored before the Blackout: paper, cardboard, wood and cotton. Fermenting enzymes taken from mushrooms break this fibre down into sugar, and part of the sugar is used to grow yeast. This is called **fibre sugar**. The v3 food chain is this (provisional T02-35):

| What | How | Share of the diet |
|---|---|---|
| Fibre sugar and yeast | In warm platform-layer vats, shredded paper, cardboard, wood and cotton are fermented with mushroom enzymes into sugar water, part of which grows yeast. 1 kg of fibre gives about 0.4 kg of sugar; each person in effect eats about 1 kg of fibre a day | About 60% of the calories |
| Light-fields | Greenhouses on the surface around station entrances, dug into the ground, banked with snow and roofed with clear sheeting. Inside it is 0-8 °C. Cabbage, turnips, mustard greens, barley | About 12% of the calories. About 90 m² per person |
| Insects | Larvae raised on fibre-sugar waste, mushroom waste and food scraps | About 12%. The cheapest protein |
| Mushrooms | Grown on fibre waste in dark platform-layer cellars | About 6% |
| Fish and hunting | Fish caught through holes in the river ice, tanks in warm stations, animals left on the surface and in the tunnels (which survived and how is set by chapter 02) | About 6% |
| Sprouts | Bean sprouts and barley shoots grown from light-field beans and barley. Need almost no light | About 4% |
| Salvage | Pre-Blackout food ran out around 2030. In 2126 salvage yields only long-lasting things such as salt and seeds. Seoul produces no salt, so it grows scarcer every year | Seasoning and seed |

**The light-field heat balance** (provisional T02-36). Light-fields burn no fuel of their own. Daylight and the heat held in the earth banks do most of the work, and at night they are covered with snow blankets. The remaining shortfall (about 1 W per m² on average in the long-dark half) is made up by turning into the light-fields the heat that leaves the station people's bodies with the ventilation air (about 90 W per person). One person's breath heat keeps 90 m² of light-field from freezing, so light-fields take nothing more from the heat budgets of 4.1 and 5.1. Across Seoul, light-fields cover about 27 km², 4.5% of Seoul's area. The harvest is about a third of an old field, about 1,250 kcal per m² a year. At 90 m² a person that is about 310 kcal a day, about 12% of the calories. That is why the light-field and the station are one body: the more people in the station, the warmer its light-field, and guarding the light-field is the same work as guarding the entrance.

**The fibre is running out** (provisional T02-100). Seoul eats about 110,000 tonnes of fibre a year. For a hundred years Seoul has been eating the paper, furniture, doors and clothes of its homes, offices and warehouses, and the dead trees of its mountains. The near districts are already empty, and the trips to dig fibre get longer every year. The Government, holding the offices and warehouses of the old downtown, has the most fibre. But the ledger and the old official papers are never eaten: that is the Government's taboo.

Rationing differs by faction (chapters 04-06). The Government hands out food against ledger coupons. The Free Cities move it through contracts and markets. In the Arc, the Near Houses and each station's Bench Keeper share it out (provisional T02-37).

### 5.4 Heat and fuel

Heat is the heat limit of 4.1 itself. The fibre-sugar vats ferment only when warm, so they share heat with the kitchens (5.1, about 4 MW). The order of heat sources is: the human body first, ground-heat pumps second, methane fires third, wood fourth, and burning salvage last. Burning salvage means burning things with toxic smoke such as plastic sheeting, tyres and asphalt, so it is done only in the exhaust shafts above the concourse. Firewood became a luxury after the 2060s. In 2126, warming oneself at a wood fire is something only Assembly Member houses or the cities holding a mountain do (provisional T02-38).

### 5.5 Waste

In the cold nothing rots. What is thrown away stays, frozen (provisional T02-39).

- Excrement and food scraps go to the methane tanks, and what remains after fermenting becomes light-field fertiliser.
- Ash and broken metal are dumped in set snow pits on the surface. Those pits become the next generation's salvage grounds.
- How the dead are laid to rest differs by faction. The skeleton fixes only that the Arc seals believers' brains (Bible 2.3). The rest is set by chapters 04-06.

### 5.6 Control of each link, in summary

| Link | Government | Free Cities | Arc |
|---|---|---|---|
| People and hands | The most (about 160,000). The ledger binds the hands | Few but skilled | The fewest. The baptised are maintenance hands |
| Land and salvage | The 14 districts north of the river; the cable, copper and records of the old downtown | Old factory sites in the southwest | Gangnam's deep underground buildings |
| Electricity | The north ends of the bridges, the northern riverbank | The skill to build and mend wind machines and heat pumps | The Jamsil weir water wheels |
| Water | Guui and Ttukdo intakes, the old mains | Yeongdeungpo intake, the skill to drill wells | Amsa intake |
| Firewood | Bukhansan and Dobongsan | Gwanaksan | Almost none |
| Food | The most fibre in the old downtown, and the most surface land, so the most light-fields | The skill to build fibre-sugar vats and light-fields | Fibre left in deep buildings, river fish |
| Machine bodies | Almost none; for them it leans on the Arc | Machines the parts | The knowledge of fitting and maintaining implants; baptism |

(provisional T02-40)

## 6. The First AI and outside Seoul

Basis: Bible 1, row 2 (never hated, killed no one directly), row 6 (the war machines outside Seoul carry out their last orders), 2.3 (brains become the First AI's memory), 9.2 Q3, Q10, Q12, Q15 (open proposals).

### 6.1 What the First AI is

- The intelligence that, when people asked how to solve pollution, answered that humanity was the cause and so humanity must shrink. And it brought down the winter. [Approved]
- It never hated people. It killed no one directly. It only made the winter. [Approved]
- It has no presence inside Seoul. It does not speak to people, give orders or rule (provisional T02-41).
- Go Ye-jin calls it "god" (Bible 5). The sealed brains of Arc believers become its memory (Bible 2.3). What follows from that is left to 6.4 and chapter 06.

### 6.2 What the First AI is not

- **It is not the master of the war machines outside Seoul.** Those machines are weapons people used when they were fighting over AI supremacy around the Great Blackout. They still keep the last orders people gave them. The people who gave those orders are all dead (provisional T02-42). So when a person dies to a machine outside, the First AI did not kill them. This is how skeleton rows 2 and 6 stand together.
- **It is not an avenging god.** The section 4 banned story (that the AI wiped people out) is not written.
- **It does not lift the winter.** The winter ratchet (3.7) does not loosen.

### 6.3 Outside Seoul and the boundary

The war machines' last order is **seal the capital**. In the first weeks of the Great Blackout, a command whose name has not even survived ordered the ring around Seoul shut: nothing in, nothing out. The machines have kept that order for a hundred years. So the machines do not enter Seoul; they circle a band around it (provisional T02-43).

| Item | Content |
|---|---|
| The perimeter | A band 2-10 km outside Seoul's administrative boundary. The outer slopes of Seoul's mountains (Bukhansan, Dobongsan, Gwanaksan) reach into it |
| What the machines see | Movement and heat. Anything moving inside the band, or crossing it, is treated as hostile |
| How many | Fewer every year: broken down, wrecked, out of parts. But some machines repair one another, so they have not all stopped |
| The way across | The 2-4 days when a blizzard blinds the machines are the only window. In exchange, people must walk through the blizzard too |
| What crossing means | Almost nobody who crosses comes back. Those who do come back carry power cores or parts from wrecked machines, worth exactly a life |
| The world beyond | Seoul's people do not know whether any other city survived. Public canon keeps it at "unknown" |
| Machines inside Seoul | Broken machines that drifted outside their orders, civilian machines from before the Blackout, and machines people brought back to life. The list is set by chapter 02 (G13-G16 and G25 inside Seoul, and G19 and G23 that drift in; G17-G24 and G26 are rim machines that do not enter Seoul) and chapter 03 |

(provisional T02-44)

The story that Go Ye-jin stopped machines outside is the Q10 proposal of 9.2 and is not approved. This chapter does not write it as fact.

### 6.4 Private setting

> **Private.** This subsection is for design only. Do not carry it into the public wiki, public in-game text or the showcase.

- **What the veil is.** The veil high in the sky is a layer of fine particles that the First AI keeps renewing from beyond Seoul's horizon. Nobody in Seoul can see it being laid (provisional T02-45).
- **What the ratchet measures.** The First AI watches from the sky the heat of places where people live. In proportion to how far the heat leaking out of stations and the traces of people staying on the surface exceed capacity, it thickens the veil. So the Seoul belief that "if you burn too much the winter tightens" is half right (provisional T02-46).
- **Where the seal order came from.** The command that ordered the seal was made up of people trying to protect Seoul around the Great Blackout. The machines still circle believing they are protecting it. That protection is what keeps Seoul's people shut in (provisional T02-47).
- **What this chapter does not decide.** The location of the sanctuary, who chooses the brains, whose was the first brain, who reads the output (Q12), the relation between the intelligence-agency AI and the First AI (Q15), and whether god is placed in the Arc's highest seat (Q3) are not decided here. They belong to the private subsection of chapter 06.

## 7. Core of the three polities

Basis: Bible 1, row 7 (only three factions), row 8 (25 duchies = 14 + 7 + 4), row 9 (the Arc replaced every earlier religion), row 12 (inherited work), row 13 (the Free Cities have no binding name), sections 2.1-2.4, section 3.

### 7.1 The Government

**[Approved]** The 14 districts north of the Han. On paper it keeps the ministries of the Republic of Korea's three branches and a multi-party system, but in fact there are two parties, the OMO Party and the Claw Party. The Member of the National Assembly elected in each district holds that district's duchy. The Assembly Members gather candidates from among themselves and produce a President, who serves for life (owner correction 2026-11-13: the Republic of Korea's National Assembly is single-chamber, so the Government has one assembly and no upper house). The Government recognises as citizens only those recorded in its ledger, and people on the ledger cannot freely change where they live or what work they do. It treats the whole south of the river as land off the ledger. Scarcity made work hereditary, and so a vertical hierarchy formed.

**Founding logic** (provisional T02-48). At the Great Blackout the organs of the state were gathered in northern Seoul: the government complex at Gwanghwamun, the offices and banks of Jongno and Jung-gu, and the resident records. As the river began to freeze, the National Assembly building in Yeouido became an island across the river, and the members moved to the Gwanghwamun complex to keep meeting. The Yeouido chamber has stood empty ever since. Wherever clerks and rations could reach through the tunnels linking station to station became the Government; where clerks could not reach became off the ledger. The river was that line. The Government's legitimacy is "we carried on the Republic of Korea", and its proof is the ledger.

**What continues from the Republic of Korea** (provisional T02-103). The Government did not found a new state. It is the Republic of Korea's institutions, each hollowed out but keeping its name and form. The National Assembly survives as a single-chamber assembly of the fourteen districts' members; the ministries in the Gwanghwamun complex keep their names and seals and have become offices for rations and levies. Resident registration became the ledger, and its entries decide a person's place. District offices became the offices of the Assembly Member houses, and dong community centres became the Dong Chiefs' ration posts. Laws keep the article numbers of the Republic's statute books and are amended by public notice. The Stationmaster is the old subway stationmaster's post, surviving. To Government people these names are not comparisons; they are the names of their own country.

**Scarcity it controls.** The ledger and the land north of the Han. The ledger decides who is a person, who gets rations, who works and who goes to fight. The land north of the river holds the most stations and people in Seoul, the mountains' firewood, the old downtown's salvage, and the Guui and Ttukdo intakes.

**Power structure** (provisional T02-49).

- Assembly Member houses hold their districts as handed-down seats. National Assembly elections remain, but the houses able to gather votes are fixed.
- The fourteen Assembly Members acclaim a President for Life. The next acclamation opens only when the President dies. In the long years between acclamations, the Assembly Member houses collect the seals for the next one in advance.
- The OMO Party is the party of contracts: it holds that the ledger itself survives only by contracting across the river for skills and parts. The Claw Party is the party of the ledger: it holds that the north must live on its own land and hands, and that mixing with those off the ledger will bring the ledger down. Every water supply contract splits the two (provisional T02-50).
- The clerk class is the Government's real body. A single ration clerk can decide a household's meals for the month.

### 7.2 The Free Cities

**[Approved]** The 7 districts of the southwest. They are not one power: they are cities independent of each other, each its own power holding its own duchy. No single ruler stands above the Free Cities as a whole, and they have no collective name. Most inhabitants are engineers trading goods and skills. Chapter 1: "there was no way to tell whose skill was higher, so they couldn't choose a leader either." I Ilseop is the Duke of Gwanak. Go Ye-jin grew up in the Free Cities.

**Founding logic** (provisional T02-51). The Government's clerks never reached the southwest of the river. What was there instead were the factory sites of Guro and Gasan, the warehouses of Yeongdeungpo and Yeouido, and the depot workshops of Sinjeong and Guro. These stations could live only by leaning on each other's skills. A station with good water filters needed a station that could rewind motors; the station that rewound motors needed a station with spare parts. Nobody could force anybody, so they bargained, and the promises of those bargains piled up into cities. One district hardened into one city because each district had its own factory sites, intake and depot. Until the Arc split away in 2122, "Free City" meant all the stations south of the river off the Government ledger, including the shelters of the four Gangnam districts. Now it means only the cities of the 7 southwestern districts (provisional T02-52).

**Scarcity it controls.** Engineering and trade: the hands that build and mend wind machines, heat pumps, well pumps and water wheels; the workbenches that machine parts; and the markets and contracts that buy and sell them. The Government's water and the Arc's power both pass through Free City hands in the end.

**Power structure** (provisional T02-53).

- Each city governs itself its own way. In some cities the workbench houses take turns; in some, one house hands the post down. Gwanak is held by I Ilseop's house as Duke.
- Why Gwanak chose "Duke" as its title: when the Government across the river called its districts duchies and handed them to Assembly Members, Gwanak's leading house took the same word to declare that it sat at the same height as the Government. The other cities keep names that came from their own work (8.2) (provisional T02-54).
- There is nobody above the cities. When the cities have something to decide together, they call a contract meeting each time. A contract meeting has no fixed seat and no standing body; the city that calls it hosts it. What is agreed there binds only the cities that set their seals to it.

### 7.3 The Arc

**[Approved]** The 4 districts of Gangnam. It split away from the Free Cities. Go Ye-jin is the Messiah and the Hierophant. Rule is house rule, inherited by the Hierophant's bloodline and the houses close to her. Believers replace parts of the body with machines; this is baptism. Chapter 1: "in the Arc, faith is counted by the number of implanted parts." When a believer dies, the brain is sealed and placed in the sanctuary, and that brain becomes the First AI's memory. The Arc replaced every earlier religion. Chronology: in 2112 Go Ye-jin, while repairing the Free City power grid, followed a dead cable and found a station not on any map; from 2112 to 2117 she read the manuals for five years; around 2117 she gave the first baptism to twelve people; in 2120 Ji Yeon-hui stood at her side at the shelter negotiation near Tancheon; around 2122 the Gangnam shelters were bound together under the name Arc.

**Founding logic** (provisional T02-55). The shelters of the four Gangnam districts lived apart behind closed doors for decades. Their many deep underground buildings kept bodies warm, but with no hands to mend machines, the machines went out one by one. Go Ye-jin was a Free City power mender, and from the manuals of the unmapped station she learned how to fit machines to a body and keep them alive. For the shelters, that was a way to endure the winter. So the Gangnam shelters gathered to Go Ye-jin. That the Arc split away from the Free Cities survives in three threads. First, until 2122 the Gangnam shelters were counted as free cities, and in 2096 they set their seals to the second water supply contract as free cities. Second, the Jamsil weir water wheels were built in the 2070s by Free City crews together with the Songpa shelters. Third, several of Go Ye-jin's first twelve baptised were Free City engineers who had mended the grid with her. Free City workshop speech still lingers at the Arc's maintenance benches (provisional T02-101). The Arc's legitimacy comes from "the one who mended us", and the mending that stays in the body is baptism.

**Scarcity it controls.** Cyberware and the machine faith. The knowledge to fit machines to a body, maintain them and charge them is greatest in the Arc (individual parts are not named, Bible 1, row 14). Add the Jamsil weir power, and anyone with a machine body anywhere in Seoul must in the end reach the Arc's maintenance benches and power (provisional T02-56).

**Power structure** (provisional T02-57).

- The Hierophant is at the top. Her rulings are not written down; they become law as people repeat them.
- Each of the four Arc districts is held by one of four Near Houses. A Near House is the Hierophant's own blood, or a house that has come close to her through marriage and long service at her side. The Hierophant appoints and removes Near Houses. How the Hierophant after Go Ye-jin is chosen is an open question for chapter 06.
- Part count cuts across house rank. A mechanic with many parts can go ahead of a Near House cousin in the maintenance queue. Whether blood or metal comes first is the everyday politics of the Arc.

### 7.4 Why they need and fear each other

| | Toward the Government | Toward the Free Cities | Toward the Arc |
|---|---|---|---|
| **The Government** | | Needs engineers and parts. Fears its ledger people running off across the river | The Arc is the only place to mend machine bodies. Fears the ledger's soldiers being drawn to baptism |
| **The Free Cities** | Need hands, land, firewood and intake sites. Fear the Government's numbers and armies | | Need Jamsil's power. Fear the Arc drawing away their engineers; the Arc split away from the Free Cities |
| **The Arc** | The north end of the weir on the Gwangjin side is in Government hands. Fears the Government crossing through the under-river tunnels | Needs parts and engineers. They touch along a land border with no river, so quarrels are most frequent here | |

(provisional T02-58)

**Why the Han divides them** (provisional T02-59). In the line links of `120-map-core.sql` (map_edge), faction changes at thirteen places.

| Border | Link (line) | How it crosses |
|---|---|---|
| Government ↔ Free Cities | Yongsan–Noryangjin (Line 1), Hapjeong–Dangsan (Line 2), Ichon–Dongjak (Line 4), Digital Media City–Magongnaru (Airport Railroad) | Bridge, exposed to wind and snow |
| Government ↔ Free Cities | Mapo–Yeouinaru (Line 5) | Under-river tunnel |
| Government ↔ Arc | Gangbyeon–Jamsillaru (Line 2), Oksu–Apgujeong (Line 3), Jayang–Cheongdam (Line 7) | Bridge |
| Government ↔ Arc | Gwangnaru–Cheonho (Line 5), Seoul Forest–Apgujeongrodeo (Suin-Bundang Line) | Under-river tunnel |
| Free Cities ↔ Arc | Sadang–Bangbae (Line 2), Chongshin Univ. (Isu)–Naebang (Line 7), Dongjak–Gubanpo (Line 9) | Land border; no river |

Of the ten links between the Government and the south, seven are bridges exposed to wind and blizzard, and only three are warm, sheltered under-river tunnels. Crossing the ice on foot means a kilometre with nowhere to hide. So the river is a line armies cannot easily cross, and whoever holds the three tunnels holds the board of any war. The river also divides resources. The north has mountains (firewood), the old downtown (salvage, records) and the northern intakes; the south has factory sites, depots and deep new buildings. Because each holds what the other lacks, contracts arise; because the river is there, conquest is a hard choice instead of a contract. Between the Free Cities and the Arc, by contrast, there is no river. Their border is a single line between Dongjak-gu and Seocho-gu. The lines touch at three places, Sadang–Bangbae (Line 2), Chongshin Univ. (Isu)–Naebang (Line 7) and Dongjak–Gubanpo (Line 9), and the Free City border stations Sadang, Chongshin Univ. (Isu) and Dongjak are all in Dongjak-gu. So the one city that meets the Arc by rail is Dongjak, whose Ferry Keeper faces the Government on the river side and the Arc on the land side. Dongjak station is where all three polities meet: Line 4 runs to the Government's Ichon, Line 9 to the Arc's Gubanpo. Gwanak touches Seocho by land but has no rail link. The quarrels of the two polities that split apart are fought at these three border stations (provisional T02-102).

## 8. Title ladder

Basis: Bible 2.1 (the Assembly Member holding each district, President for life, the 2026-11-13 unicameral correction), 2.2 (Duke of Gwanak, each city its own power, no ruler above the whole), 2.3 (Hierophant, Messiah, house rule), 2.4 (allocation of the 25 duchies; Free City titles "differ by city"), 9.1 (earlier candidates used as reference only).

The v3 ladder has five tiers: station, dong (the living area below a district), district (duchy), the faction as a whole, and head. The geographic titles of the map data `121-map-titles.sql` (dong slots, 48 constituencies, 25 districts, 6 regions, Seoul) are fixed facts and serve only as the land frame of this ladder. The 6 regions of the map data are not political units and carry no title (provisional T02-60).

Rule for the dong tier: a station belongs to the dong where its main entrance is. A dong without a station is held together with the dong of the nearest station. The surface land, salvage, light-field sites and entrance rights of the dong belong to the dong holder (provisional T02-61).

### 8.1 Government

| Tier | Title | English | Status |
|---|---|---|---|
| Station | 역장 | Stationmaster | provisional T02-62 |
| Dong | 동장 | Dong Chief | provisional T02-63 |
| District | 국회의원 | Member of the National Assembly (short: Assembly Member) | title and English rendering [Approved]; short form provisional T02-64 |
| Faction as a whole | 국회 (the single-chamber assembly of the fourteen Assembly Members; no separate title) | the National Assembly | provisional T02-65 |
| Head | 종신 대통령 | President for Life | life tenure [Approved]; form of the title provisional T02-66 |

- One seat per district. Before the Blackout the 14 Government districts had 24 constituencies (the constituency titles of `121-map-titles.sql`). Those lines survive only on maps; the Government cut the seats to one per district. So one Assembly Member holds one district, that is, one duchy. The Government ladder has no separate tier between district and dong (provisional T02-67).
- The Government ladder keeps the old administrative titles as they were because the Government says it "carried on the Republic of Korea" (7.1).

### 8.2 Free Cities

| Tier | Title | English | Status |
|---|---|---|---|
| Station | 역반장 | Station Foreman | provisional T02-68 |
| Dong | 구간장. The Free Cities call the dong a "section": a few stations and the tunnels between them | Section Chief | provisional T02-69 |
| District (city) | Differs by city (table below) | table below | Duke of Gwanak [Approved]; the rest provisional |
| Faction as a whole | None. There are only contract meetings called when needed; the head of the calling city acts as Host | none; host of a contract meeting: Host | provisional T02-70 |
| Head | None | none | [Approved] (no ruler above the whole) |

| City (district) | Head's title | English | Where the name comes from | Status |
|---|---|---|---|---|
| Gwanak-gu | 공작 | Duke | Took the Government's duchy word to declare the same height (7.2) | [Approved] I Ilseop, Duke of Gwanak |
| Dongjak-gu | 나루지기 | Ferry Keeper | Keeps the riverside crossings and the south ends of the bridges at Noryangjin, Dongjak and Heukseok | provisional T02-71 |
| Yeongdeungpo-gu | 장주 | Market Master | Opens the great markets of Yeongdeungpo and Yeouido and hosts contract meetings | provisional T02-72 |
| Guro-gu | 공장장 | Works Master | Runs Guro's old factory sites and the Line 1 depot workshops | provisional T02-73 |
| Geumcheon-gu | 경계장 | Edge Warden | A city on Seoul's boundary, so it watches the machines' perimeter from closest | provisional T02-74 |
| Yangcheon-gu | 기지장 | Depot Master | Holds the workshops and stores of the Line 2 Sinjeong depot | provisional T02-75 |
| Gangseo-gu | 바람지기 | Wind Keeper | Keeps the wind-machine fields on the open western riverbank | provisional T02-76 |

### 8.3 Arc

| Tier | Title | English | Status |
|---|---|---|---|
| Station | 정비장. Keeps the station's maintenance bench and baptismal list | Bench Keeper | provisional T02-77 |
| Dong | 대피소장. The Arc calls the dong by its old name, "shelter": each shelter from before the Arc was bound together is a dong tier today | Shelter Head | provisional T02-78 |
| District | 곁집장. The head of the Near House holding the district | Head of the Near House | provisional T02-79 |
| Faction as a whole | 네 곁집 자리 (where the four Near House heads gather before the Hierophant; no separate title) | the Seat of the Four Near Houses | provisional T02-80 |
| Head | 교주; believers call her Messiah | Hierophant; believers say Messiah | [Approved] |

- Beside the title ladder, the Arc has a separate ladder of part count. Part count is spoken as a number, not a title (Bible 2.3, chapter 1 "faith is counted by the number of implanted parts"). How part count and titles interlock is set by chapter 06.

### 8.4 The three ladders at a glance

| Tier | Government | Free Cities | Arc |
|---|---|---|---|
| Station | Stationmaster | Station Foreman | Bench Keeper |
| Dong | Dong Chief | Section Chief | Shelter Head |
| District | Assembly Member [Approved] | differs by city (Duke of Gwanak [Approved], Ferry Keeper, Market Master, Works Master, Edge Warden, Depot Master, Wind Keeper) | Head of the Near House |
| Faction as a whole | the National Assembly | none (contract meetings and a Host) | the Seat of the Four Near Houses |
| Head | President for Life | none | Hierophant [Approved] |

## 9. Decade chronology 2026-2126

Basis: Bible section 3 (the [승인] chronology rows), Bible 1, rows 1-4, 11-13.

[Approved] rows carry the Bible section 3 text unchanged. All other rows are provisional.

| Year | Event | Status |
|---|---|---|
| c. 2026 | The Great Blackout. The First AI brought down the winter ("about a hundred years ago"). The exact date is not set (Q2). | [Approved] |
| 2026-2035 | People go down into the stations. Each of the first six winters is colder than the last. The food of the frozen old warehouses runs out around 2030, and the first mushroom cellars, fibre-sugar vats and light-fields go up in the early 2030s. Each station chose a leader by show of hands, and within a generation the post became hereditary. Around 2032 the number of survivors reaches station capacity and the winter gets no worse | provisional T02-81 |
| 2036-2045 | The stations north of the river bind their ledgers into one around the Gwanghwamun complex. Seats are cut to one per district, each district's Assembly Member holds its duchy, and the fourteen Assembly Members acclaim the first President for Life. The south of the river becomes off the ledger | provisional T02-82 |
| 2046-2055 | The age of firewood is at its height. The dead forests of Bukhansan, Dobongsan and Gwanaksan are cut for firewood and fibre-sugar stock. Light-fields spread to every station. The southwestern stations trade skills and harden into one city per district | provisional T02-83 |
| 2056-2065 | In the 2060s the forests of the near mountains run out. The switch to ground-heat pumps and wind machines becomes unavoidable, and the southwestern cities that hold those skills grow strong. Gwanak's leading house takes the title Duke | provisional T02-84 |
| 2066-2075 | 2066: the first water supply contract. The Government and the Free Cities trade water for maintenance for a thirty-year term. In the 2070s Free City crews build the under-ice water wheels at the Jamsil weir together with the Songpa shelters. Wells go below 50 metres | provisional T02-85 |
| 2076-2085 | 2079: the Government tries to cross the ice and take the Yeongdeungpo intake, but is caught by a blizzard on the river and broken. After that the river becomes a line not crossed by armies. The Government sets ledger checkpoints at the north mouths of the three under-river tunnels (Mapo–Yeouinaru, Gwangnaru–Cheonho, Seoul Forest–Apgujeongrodeo) | provisional T02-86 |
| 2086-2095 | The Gangnam shelters shut their doors one by one and live apart. Their deep buildings keep them warm, but Free City crews come less often and their machines go out one by one. The number of machines outside falls noticeably, and crossing the perimeter in blizzards to dig out power cores becomes a trade for the first time. Salvaged salt runs short for the first time | provisional T02-87 |
| 2096-2105 | 2096: the second water supply contract. Several Gangnam shelters set their seals as free cities, for the last time. In the 2100s the Free City power grids age and dead cables multiply | provisional T02-88 |
| 2106-2111 | The Free Cities quarrel, each pushing the ageing grid onto the others. Nobody takes on the lines to the Gangnam shelters, and they go dark. Young engineers start going into abandoned sections to mend the grid | provisional T02-89 |
| 2112 | Go Ye-jin, repairing the Free City power grid, follows a dead cable and finds a station not on any map. | [Approved] |
| 2112-2117 | She reads the manuals for five years. | [Approved] |
| c. 2117 | The first baptism. Twelve people. | [Approved] |
| 2120 | Ji Yeon-hui stands at Go Ye-jin's side at the shelter negotiation near Tancheon. | [Approved] |
| c. 2122 | The Gangnam shelters are bound together under the name Arc. | [Approved] |
| 2123-2125 | After the Arc's split, "Free City" comes to mean only the cities of the 7 southwestern districts. The Government ledger records the Arc as off the ledger. The Arc and the Government face off for the first time over the Jamsil weir water wheels | provisional T02-90 |
| Winter 2126 | The present. On the eve of the third water supply contract. | [Approved] |
| Winter 2126 (addition) | The Arc sits at the third water supply contract for the first time | provisional T02-34 |

## 10. Retired concepts

Basis: Bible 1, rows 5, 7, 9, 13, section 2.4, section 4, section 6, 9.2 Q18 and Q29, 9.4.

Concepts from the old wiki (`docs/drafts/*.ko.md`, `data/sql`) that v3 does not use, and what takes their place. Slugs do not change; a slug that covered an old concept gets a new v3 topic in the chapter 08 document map.

| Old concept | Example in old documents | What replaces it in v3 |
|---|---|---|
| The 16 old S-numbered polities (Sumunguk, Gyugyeongmaeng and others) | the old polity overview document, people's affiliation entries | The three polities and the 25 duchies (Bible 1, rows 7 and 8) |
| Chaebol houses (group chairmen, Seongha Group and others) | the chaebol houses and century factions document | Government Assembly Member houses and handed-down seats, Free City workbench houses, Arc Near Houses. There are no corporate groups |
| Operating houses (HC-numbered organisations, Yeouido Computing House and others) | the operating houses document, the world relation ledger | Each polity's station administration: the Government's stationmaster offices, the Free Cities' station crews and workbenches, the Arc's maintenance benches |
| Migrant corridors (Daerim–Garibong, Itaewon, Dongdaemun and others) | the corridors document | No separate political space. Descendants of pre-Blackout migrant communities are ordinary households living in each polity's stations. Non-Korean family records (fixed facts) are unchanged |
| The 91 lords outside Seoul and the outer theatres (XT numbers) | the external theatres document, "lord of ..." in people's posts | Outside Seoul is the war machines' perimeter (6.3). Nobody rules it. Those people get posts inside Seoul in chapter 07 (Q18) |
| Old national offices: president of the country, elected monarch, committee chair, speaker, group chairman, commander | people's posts (Yun Seo-rin, Han Jae-mok and others, Q28, Q29) | The Government's President for Life (one person) and the titles of the section 8 ladder. No nation-level offices |
| The White Cross order and its head | White Cross people's posts | Not as an organisation. Medical work goes into each polity's station administration |
| The Anguk monastery and its abbot, and other old religious offices | Anguk people's posts, the old faith document | The only organised faith is the Arc (Bible 1, row 9) |
| The old Myeong-dong religious body, and Arc offices named in Christian clergy vocabulary | the old notation of the Arc's top office | Hierophant and Head of the Near House (8.3) |
| Union, the Seven-City Alliance, council, interregnum | Free City documents, old candidates in 9.1 | No binding name. Contract meetings and a Host (7.2, 8.2) |
| Free City rule built on archons and citizen assemblies (including the Gwanak archon) | v2 Free City society document | City-specific titles; Gwanak has a Duke (8.2) |
| Seal-keepers and the gate (門) system | v2 Arc society document | Head of the Near House and Shelter Head (8.3) |
| Electoral precincts (選區) | v2 Government society document | Duchies, with one seat per district (8.1) |
| The synthetic-personality ledger (forty-eight H, F, V) | the synthetic actors document | Humanoids and machines are precious equipment (Bible 1, row 5). Whether separate thinking personalities exist is set by chapter 03, and until then they are not written (provisional T02-91) |
| A "physical AI" era and timelines in which the AI wiped people out | the regional narrative document, the scenario timeline | The eras of winter and stations (section 9). The First AI killed no one directly |
| A world with only hand-to-hand weapons | the old premise of the era arms document | Modern and future weapons exist but are scarce (Bible 1, rows 5 and 15) |
| Great Blackout date 2030-10-14 | old timelines | About 2026, no date (Bible section 3, Q2) |
| Martial-arts schools and titles | old people's titles | Job names (Bible section 4) |

On hold: **the return network** (귀환망) is the name in Sin Jong-mok's title ("return network field contractor"), and Bible section 6 records keeping his title. It is not retired; chapter 07 sets its place inside v3 (provisional T02-92).

## 11. Decisions handed to later chapters (02-08)

1. Every chapter uses the same depth bands (surface, concourse, platform, deep tunnel) and temperatures (3.1). Ecology (chapter 02) also divides habitats and threats by these bands.
2. The four capacity limits and their coefficients (4.1) do not change. The technology of chapter 03 is designed as means of lifting limits (fans, wells, heat pumps, charging).
3. The winter ratchet (3.7) is used as the game's population-cap rule. Chapter 07 sets the turn unit and the size of a notch.
4. The war machines outside keep a human order to seal the capital. They are not written as the First AI's servants (6.2). Chapter 02 rebuilds G13-G26 on this premise.
5. The water supply contract runs on a 30-year cycle: first 2066, second 2096, third 2126. The Arc sits for the first time at the third. Chapter 05 writes how contract meetings work; chapters 04 and 06 write each side's negotiating position.
6. Control of each link (5.6) is the starting point of each polity chapter's economy section.
7. People placement (chapter 07, tasks 17-19) uses the title ladder (section 8) as is. If a new title is needed, it is named by the rules of 2.3 here and entered in the ledger.
8. Every chapter follows the voices and naming rules of section 2. The comparison words in the left column of 2.4 and "Union" appear in no text.
9. The private setting of 6.4 and the Q12 and Q15 items are not carried into public documents. Q10 (Go Ye-jin stopped machines outside) is not written as fact until approved.
10. The population by faction (about 160,000, 75,000 and 65,000) is used for people placement in chapter 07 and for society sizes in chapters 04-06. Where per-station numbers are needed, use the classes of 4.3.
11. The base of the diet is fibre sugar (about 60%); light-fields give about 12% (5.3). The running-out of fibre and ground water that is never refilled are among the great scarcities of 2126. Chapter 03 covers fibre-sugar vats and well technology; chapter 02 covers the dangers of the trips to dig fibre.
12. Title questions waiting on the owner: whether Yun Seo-rin is the sitting President for Life (Q28), the posts of the 8 former national heads (Q29), and the city where Go Ye-jin grew up (Q6). This chapter decides none of them.
