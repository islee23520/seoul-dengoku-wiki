# v3 bible chapter 5. The Free Cities

Status: draft. Plan `.omo/plans/wiki-lore-rebuild-v3.md`, task 6. English mirror of `05-free-city.md` (Korean primary); section numbers, figures and names are the same.

How to read:

- **[Approved]** marks the `docs/CANON-BIBLE.md` skeleton (section 1, 2.2, 2.4, 2.5, 3) or the [Approved] rows of 01-core that carry it.
- **(provisional T02-n)** marks something already made in 01-core that this chapter uses as it is. This chapter does not change those values.
- **(provisional T06-n)** marks something made in this chapter. Every item is listed under the same number in `docs/drafts/reports/v3-ledger-parts/t06.md`. None of it is approved setting until the owner answers.
- **(provisional T31-n)** marks what plan task 31 (2026-11-13) added to or changed in this chapter: the skeleton by which a city chooses its holder and each city's yardstick (2.1-2.2, and the rule of each city in section 3). Every item is listed in `docs/drafts/reports/v3-ledger-parts/t31.md`, which also records the T06 rows that changed. What the owner answered (the skeleton for all seven cities, a yardstick for each city, for life, decided by score, Yeongdeungpo onto the skeleton) is in Bible 9.4.
- Station and district names are exactly those of `data/sql/120-map-core.sql` (map_station). The station lists of this chapter are all 77 stations of that table that lie in the seven Free City districts.
- The places where this chapter extends 01-core are gathered in section 14.

## 1. Scope and basis

Basis: Bible 1, rows 3, 7, 8, 11, 12, 13; Bible 2.2, 2.4 rows 15-21, 2.5, 3. 01-core 2 (voice), 5.2 (water supply contract), 7.2 (the Free Cities), 7.4 (borders), 8.2 (titles).

This chapter covers the seven cities of the seven south-western districts: Gangseo, Yangcheon, Yeongdeungpo, Guro, Geumcheon, Dongjak and Gwanak. The skeleton fixes this much. The cities are independent of one another; each city is its own power and holds its own duchy. No single ruler stands above the seven cities. The seven cities have no collective name. Most of their people are engineers who trade materials and skills. I Ilseop is the Duke of Gwanak. The game opens in the winter of 2126, before the third water supply contract. [Approved]

On top of that, this chapter sets each city's government, what it lives by, its stations, the council where the cities meet, workshops and work teams, the measures of exchange, the water supply contracts, routes and borders, clothing, daily life and speech, the militia rules, and the placement quotas for the 190 Free City people.

When the text names the seven cities together it says "the Free Cities" or "the south-western cities". One city is called by its district name ("Guro", "the Gwanak side", "Dongjak people"). A form with "City" added, such as "Guro City", is used in official papers and contracts (provisional T02-5).

## 2. The seven cities at a glance

Basis: Bible 2.2, 2.4. 01-core 4.3 (station grades), 7.2, 8.2.

| City (district) | Holder's title | How the holder is chosen | Seat station | Stations | Sections | Population (2126) | Lives by |
|---|---|---|---|---|---|---|---|
| Gangseo | Power Station Director | Set by reputation at the meeting of representatives of five wind-farm shareholding houses. For life, but steps down if the watts are not kept | Gimpo Int'l Airport | 18 | 4 | about 17,000 | Wind-machine electricity, wide greenhouses |
| Yangcheon | Depot Chief | The depot house is the only shareholding house, so it is set by reputation within that house. For life | Sinjeongnegeori | 7 | 2 | about 4,200 | Rebuilding motors and wheels at the Sinjeong depot, rail carts |
| Yeongdeungpo | Head of the Merchants' Association | Set by reputation at the meeting of representatives of five market shareholding houses. For life | Yeongdeungpo | 18 | 4 | about 20,600 | The great market, water from the Yangpyeong-dong intake, the council seat |
| Guro | Plant Manager | The representative of the four shareholding houses with the highest number of guarantees. For life, but steps down on breaking a surety | Guro | 9 | 2 | about 9,600 | Parts and pumps from the old factory sites and the Line 1 depot |
| Geumcheon | Guard Commander | Set by reputation from among those of the two shareholding houses who crossed the blockade line and came back. For life | Gasan Digital Complex | 3 | 1 | about 3,200 | Power sources brought in from outside, well-drilling rigs |
| Dongjak | Ferry Keeper | Set by reputation at the meeting of representatives of five crossing shareholding houses. While holding his crossing | Noryangjin | 14 | 4 | about 14,000 | Passage shares at the crossings, fish from under the ice |
| Gwanak | Duke | The meeting of representatives resolved to make the seat hereditary, so it is handed down in I Ilseop's house | Sillim | 8 | 2 | about 6,200 | Firewood and wood fibre from Gwanaksan, drilling in mountain rock |
| Total | | | | 77 | 19 | about 74,800 | |

The titles are those of 01-core 8.2 (Duke of Gwanak [Approved], the rest provisional T02-71 to T02-76). The seat stations, the sections and the population are set by this chapter (provisional T06-1). How each holder is chosen is the skeleton and yardstick of 2.1-2.2 (provisional T31-1).

The population multiplies the station grades of 01-core 4.3 by middle values: 600 for a one-line station, 2,000 for a two-line interchange, and 4,000 for Gimpo Int'l Airport, where five lines meet, as a large interchange complex. The total of about 74,800 agrees with 01-core 4.3, "the Free Cities about 75,000" (provisional T06-2).

The seven cities choose their holders on the same skeleton (2.1). What differs is the yardstick. As chapter 1 says, "there was no way to tell whose skill was higher, so they could not choose a leader either." For the seven cities as a whole, that question had no answer. So each city looked for something it could count in its own work and made it the yardstick of reputation. Gangseo counts half-years that met their watts, Yangcheon motors brought back to life, Yeongdeungpo market place contracts never broken and kWh put into the hearth, Guro the number of guarantees, Geumcheon the times a person came back alive from the blockade line, Dongjak freight carried across without loss, Gwanak the depth of wells dug. These seven yardsticks are the seven cities' characters (provisional T31-3).

### 2.1 The skeleton by which a city chooses its holder

Basis: the owner's instruction and answers (2026-11-13, Bible 9.4: all seven cities, a yardstick for each city, for life, decided by score). The task 31 CK2/CK3 research record, sections 3-4 (path in Bible 9.4, row 2026-11-13). Bible 2.2 (no one above the cities) [Approved], 01-core 7.2, sections 4-6 and 10.6 of this chapter.

The skeleton is a matter inside one city. There is no seat the seven cities choose together, and the council (section 4) chooses no city's holder. Every word of the skeleton is workshop speech (provisional T31-1).

1. **Shareholding houses.** The workshop houses that share the city's seal. A city has one to five (2.2). When a city first stood, the houses that stamped its first contract became its shareholding houses. The holder stands only from among the people of the shareholding houses. A workshop that is not a shareholding house still contracts in its own name and issues vouchers, but cannot put forward a holder (provisional T31-2).
2. **The meeting of representatives.** The gathering of the representatives of the shareholding houses. It exists only inside a city and is not the council between cities. The meeting of representatives sets the city's law and its large sheets, and when the holder dies or steps down it sets the next holder. It meets at the seat station (provisional T31-4).
3. **No votes. Reputation decides.** The meeting of representatives reckons each candidate's reputation aloud, and the highest stands as holder. The representatives stamp their seals only to say the reckoning was right; they choose no one. "Figures, not words" (10.7) holds when a holder is chosen too. A meeting of representatives opens with the words "Let's reckon the reputation" (provisional T31-5).
4. **Reputation.** Three things are added. Each kept surety counts 2, each year of age counts 1 (no more after fifty), and each 10 kWh of heating contribution counts 1. What counts as a kept surety, and whether heating contribution count, is each city's yardstick (2.2). For example, a representative of fifty-five with 40 kept sureties who put in 600 heating contribution has a reputation of 80 + 50 + 60 = 190. A rival fifteen years younger, aged forty, has an age share 10 less (the five years past fifty are not counted) and must put in 100 more heating contribution to catch up (provisional T31-6).
5. **Heating contribution.** The electricity a candidate gives to the heat, meals and light of the meeting of representatives. It is the same reckoning as the custom "A council lasts as long as the stove" (4.2). While the holder lives, a candidate stakes kWh in the meeting's store as charged battery packs (6.3), and may take them back if the count turns against him. Once the meeting opens, every staked kWh goes into the hearth and is not returned, win or lose. Free City people say, "Heating contribution burn." Heating a three-day meeting at 20 kW takes about 1,400 kWh (6.1, watts), and three days of meals for twenty representatives come to about 90 kWh by person-days (6.2). Kilos staked beyond that go to the heat and the open vats (10.2) of the city's stations (provisional T31-7).
6. **Candidates.** Each shareholding house puts forward one person. Usually it is the house's representative; from the late holder's house it is the one who took up that house's workshop. No one under sixteen can stand. No one whose seal is broken (10.6) can stand. A person who has taken a post in another city or a Government or Arc title drops out. So handing a rival representative a good post in another city is an old move (provisional T31-8).
7. **For life.** The holder serves until death. Each city may add one more condition for stepping down (2.2). A holder may also step down of his own will (provisional T31-9).
8. **What goes with the seat.** The holder receives the seat station, the city's seal, the right to appoint Section Chiefs (5.4) and the right to call a council (4.2). His own workshop and external offices stay in his house. When he steps down or dies, only what goes with the seat passes to the next holder (provisional T31-10).
9. **Losing houses.** A losing house loses neither its workshop nor its seal. Neither the holder nor the meeting of representatives can seize or take back another's workshop. A losing representative piles up sureties while waiting for the next meeting. If a shareholding house has no hand left, its workshop closes and its external offices are shared among the remaining shareholding houses. The meeting of representatives brings in the non-seal workshop with the most kept sureties as a new shareholding house to fill the number (provisional T31-11).
10. **External offices.** A workshop and foothold a workshop keeps in a station of another city. Only one house's external office stands in one station. A house may keep one external office for every five hands, four at most. So marriage and children are the size of a house's trade (5.2, 10.3). An external office pays the heat share (8.1) to that station's Station Foreman and contracts under its own city's seal (provisional T31-12).
11. **Lines of dispute.** The shareholding houses of one city quarrel over external offices. Two houses after the same station often bid up the heat share they offer its Station Foreman. The holder and his own city's shareholding houses cannot open such a quarrel with each other. Between cities, external offices are the commonest place of friction. The city that owns a station may close another's external office and send its hands away, and the city that kept the post reckons this a broken sheet and presses it. These quarrels and their settlements all end in contract sheets and pledges (4.2); when they do not end, they become a cause for fighting (section 11) (provisional T31-13).
12. **Building up, not out.** A city does not make stations outside its district its own ground. What it keeps outside is external offices only. A city grows by enlarging its seat station and its workshops (provisional T31-14).
13. **Station grievance.** Even a holder for life, if the grievances of station people pile up, meets Station Foremen (5.4) who hold the entrances and light hours and dig in. This does not turn straight into a fight; it grows step by step. A holder who wants a large sheet from the meeting of representatives must soothe the Station Foremen (provisional T31-15).
14. **The hereditary resolution.** The meeting of representatives may change the law so that the holder's seat passes within one shareholding house. This is called the hereditary resolution. A city that makes that resolution changes its holder's title, and the meeting of representatives remains to set law and large sheets. Even within the bound house, the next holder is set by reputation. Of the seven cities today, only Gwanak has resolved to make the seat hereditary (3.7). People of other cities call Gwanak "the house that made its seat hereditary" (provisional T31-16).
15. **The tie-break.** If two candidates' reputation is within 5, the two stand by turns, an hour each, before the meeting's hearth. Whoever stands before the hearth when the first wind hour of the day (10.1) comes becomes holder. Free City people say, "A close count is settled by the wind." Chapter 09 carries this over as a small hidden bonus (provisional T31-17).

### 2.2 Each city's yardstick

Basis: 2.1, section 3, the owner's answer "a yardstick for each city" (Bible 9.4).

| City | Shareholding houses | What counts as a kept surety | Heating contribution | Added condition for stepping down |
|---|---|---|---|---|
| Gangseo | five (wind-farm houses) | one short-daylight half that met the watts written in the contract | counted | if the wind farms in his charge miss the watts for two short-daylight halves in a row |
| Yangcheon | one (the depot house) | one motor brought back to life that served out its surety term | not counted; the hearth belongs to one house | none |
| Yeongdeungpo | five (merchant houses) | one year without breaking a market place contract | counted double (2 per 10 kWh) | none |
| Guro | four | one number of guarantees | not counted; "A surety is repaid in hands" | if his workshop breaks a surety once |
| Geumcheon | two | one crossing of the blockade line and return (one sleeve stripe, 9.4). Someone who has never come back cannot stand | counted | if he crosses and does not return, the seat falls empty |
| Dongjak | five (crossing houses) | one sheet of freight escorted across without loss | counted | if he loses or closes his crossing |
| Gwanak | three, hereditary resolution | 10 metres of well dug | not counted; the hearth belongs to the ducal house | none; only people of the ducal house stand |

(provisional T31-18)

Gangseo, Yeongdeungpo, Guro and Dongjak, with four or five shareholding houses, have large meetings and long reckonings. In Geumcheon few cross and come back, so there are always two candidates, and only one if one house has no one who crossed. In Yangcheon and Gwanak the next holder always comes from one house, but for different reasons: Yangcheon because it has only one shareholding house, Gwanak because its meeting of representatives resolved to make the seat hereditary. So inheritance in Yangcheon breeds no grievance, and inheritance in Gwanak does.

## 3. City by city

Basis: Bible 2.2, 2.4, 1 row 12 (inherited work). 01-core 5.1 (energy), 5.2 (water), 5.6 (who holds each link), 7.2, 7.4, 8.2.

Each city's stations follow `120-map-core.sql`. A section is the Free Cities' name for the dong layer set by 01-core 8.2. One section groups a few stations, the tunnels between them, and the dongs of those stations (01-core 8, dong-layer rule). How the sections are divided is all set by this chapter (provisional T06-4).

- Yangcheon has only one shareholding house, so it does not follow "one candidate per shareholding house" of 2.1 item 6: each representative of that one house stands as a candidate (3.2) (provisional T31-33).

### 3.1 Gangseo: the Power Station Director

- **Stations (18).** Gimpo Int'l Airport section: 김포공항 Gimpo Int'l Airport, 방화 Banghwa, 개화산 Gaehwasan, 개화 Gaehwa, 송정 Songjeong, 공항시장 Airport Market, 신방화 Sinbanghwa. Magok section: 마곡 Magok, 마곡나루 Magongnaru, 발산 Balsan, 양천향교 Yangcheon Hyanggyo. Hwagok section: 우장산 Ujangsan, 화곡 Hwagok, 까치산 Kkachisan. Gayang section: 가양 Gayang, 증미 Jeungmi, 등촌 Deungchon, 염창 Yeomchang.
- **Lives by.** The wind farms on the western riverside plain (01-core 8.2). The open riverside is windy (01-core 3.5), and the plains of Magok and Gayang have few buried buildings, so wind turbines can stand there in rows. Gangseo makes the most electricity of the Free Cities. It sells the surplus to Yangcheon and Yeongdeungpo through cables laid along Line 5 and Line 9. The same plain is good for spreading greenhouses, so Gangseo's greenhouses are the widest of the seven cities. The old hangars of Gimpo Int'l Airport are a salvage ground for light metal sheet and long beams. The Line 5 depot at Banghwa is a living depot that handles Gangseo's rail work and keeps a maintenance locomotive; the Line 9 depot at Gaehwa is frozen (chapter 03 7.3, provisional T04-40) (provisional T06-5).
- **Rule.** Gangseo's shareholding houses are the five houses that hold wind farms. When the Power Station Director dies or steps down, the representatives of the five houses meet at the meeting of representatives at Gimpo Int'l Airport and reckon reputation. Gangseo counts a kept surety as "a short-daylight half that met the watts written in the contract": when a wind farm delivers the watts it promised each half-year, its house's representative gains reputation. Once standing, the Power Station Director serves for life. But if the wind farms in the Power Station Director's charge fail to deliver the watts written in the contracts for two short-daylight halves in a row, the Power Station Director steps down and the meeting opens again. Gangseo people say, "The wind changes the people." Under the Power Station Director are four section chiefs and one wind farm foreman per wind farm (provisional T06-6, T31-19).
- **Borders.** Magongnaru is linked by the Airport Railroad bridge to the Government's Digital Media City (01-core 7.4). Gimpo Int'l Airport, Gaehwa and Banghwa are the western end of Seoul and face the blockade line of the machines outside.

### 3.2 Yangcheon: the Depot Chief

- **Stations (7).** Sinjeong section: 신정 Sinjeong, 신정네거리 Sinjeongnegeori, 양천구청 Yangcheon-gu Office. Mok-dong section: 목동 Mok-dong, 오목교 Omokgyo, 양평 Yangpyeong, 신목동 Sinmokdong.
- **Lives by.** The workshops and stores of the Line 2 Sinjeong depot (01-core 8.2). The wide roofed space of the depot is a warm workshop in itself, and the remaining trains are a store of motors, wheels, axles and steel plate. Yangcheon rewinds old motors and turns wheels back to life. It also builds rail carts, pushed along the tunnel rails by hand or by a small motor. Nearly all freight between the Free Cities moves on Yangcheon's rail carts (provisional T06-7).
- **Rule.** The smallest of the seven cities. Yangcheon's only shareholding house is the house that first brought the depot back to life. So since the 2050s the Depot Chief has always come from that house. It did not resolve to make the seat hereditary; the house sharing the seal was one from the start. When the Depot Chief dies, the hands of the depot house form the meeting of representatives, with the four shift leaders sitting beside them. Reputation is counted in "motors brought back to life that served out their surety term". The hearth belongs to one house, so heating contribution are not counted. Depot work runs in four shifts, each with a shift leader. The Depot Chief and the four shift leaders are the whole of Yangcheon's government. The depot house binds the shift leader posts to itself by marriage, which is also how it keeps any shift leader's house from standing as a second shareholding house (provisional T06-8, T31-20).
- **A note.** The map data places Yangpyeong station in Yangcheon-gu, and this chapter follows it. The Yangpyeong-dong intake of 01-core 5.2 belongs to Yeongdeungpo and is reached from Seonyudo and Dangsan on the Yeongdeungpo side (3.3).

### 3.3 Yeongdeungpo: the Head of the Merchants' Association

- **Stations (18).** Yeouido section: 여의도 Yeouido, 여의나루 Yeouinaru, 국회의사당 National Assembly, 샛강 Saetgang. Dangsan section: 당산 Dangsan, 선유도 Seonyudo, 영등포구청 Yeongdeungpo-gu Office, 문래 Mullae, 도림천 Dorimcheon. Yeongdeungpo section: 영등포 Yeongdeungpo, 영등포시장 Yeongdeungpo Market, 신길 Singil, 대방 Daebang. Boramae section: 보라매 Boramae, 보라매공원 Boramae Park, 서울지방병무청 Seoul Regional Office of Military Manpower, 신풍 Sinpung, 구로디지털단지 Guro Digital Complex.
- **Lives by.** Three things. First, the largest market of the seven cities: the platforms and concourses between Yeongdeungpo and Yeongdeungpo Market are the market, and the old warehouses of Yeouido are its stores. Second, water. As 01-core 5.2 sets, the south-western under-ice river intake is at Yangpyeong-dong and Yeongdeungpo holds it. Yeongdeungpo uses the water in its own stations and sells the surplus to neighbouring cities. Third, the council seat. The large councils with the Government are almost always hosted by Yeongdeungpo (section 4) (provisional T06-9).
- **Rule.** Yeongdeungpo's shareholding houses are the five merchant houses that held places when the market first stood. When the Head of the Merchants' Association dies or steps down, the representatives of the five houses meet and reckon reputation. Yeongdeungpo counts a kept surety as "a year without breaking a market place contract", and counts heating contribution double what other cities do. It is a market city; kWh do the talking. So Yeongdeungpo's meeting of representatives is the hottest of the seven cities, and the five houses stake and withdraw kWh in the store the whole time a Head of the Merchants' Association lives. The order of the five houses fixed when the market first stood still survives, but it is not the order of who becomes Head of the Merchants' Association; it is the order of whose house hearth hosts the meeting of representatives. The Head of the Merchants' Association serves for life. The Head of the Merchants' Association of 2126 is the one who stood by reputation at the meeting of representatives, and is the host of the third water supply contract (7.3). The Head of the Merchants' Association keeps the market's place fees and the price board (6.4) and governs Yeongdeungpo with the four section chiefs (provisional T31-21; replaces T06-10).
- **The empty Assembly hall at Yeouido.** As 01-core 7.1 says, when the river froze the National Assembly moved to the Gwanghwamun government complex and the Yeouido Assembly building emptied. National Assembly station and the Assembly building above it are now Yeongdeungpo ground. Yeongdeungpo holds its councils with the Government at the Assembly hall. This is custom only, not a fixed rule. The surface rooms average -9 °C and are not used; the seat is the heated buried lower floors and the Line 9 National Assembly station level. Government people come as guests into the building their forebears left, and stamp their seals there (provisional T06-11).
- **Borders.** Dangsan is linked by the Line 2 bridge to the Government's Hapjeong, and Yeouinaru by the Line 5 under-river tunnel to the Government's Mapo (01-core 7.4). Mapo-Yeouinaru is the only under-river tunnel between the Government and the Free Cities, and a Government ledger checkpoint stands at its north entrance (provisional T02-86).

### 3.4 Guro: the Plant Manager

- **Stations (9).** Sindorim section: 신도림 Sindorim, 구로 Guro, 대림 Daerim, 남구로 Namguro. Onsu section: 구일 Guil, 개봉 Gaebong, 오류동 Oryu-dong, 온수 Onsu, 천왕 Cheonwang.
- **Lives by.** The old factory sites of Guro and the Line 1 depot workshop (01-core 8.2). Guro machines parts. Pump vanes and shafts, compressor parts for heat pumps, bearings for wind turbines and blades for water wheels come from Guro's workshops. The Sindorim worked example of 01-core 4.2 is this city. Sindorim has only three exits and is an air-limited station; the next fan Guro means to fit is Sindorim's (01-core 4.2) (provisional T06-12).
- **Rule.** Every workshop in Guro carves into a board the contracts it has made and whether it has paid each one in full. The count carved there is the number of guarantees. Guro's shareholding houses are four of its parts workshops and pump workshops. When the Plant Manager dies, or his workshop breaks a surety once, the representatives of the four houses meet at the meeting of representatives at Guro station and read the board. Guro does not count heating contribution. As the saying "A surety is repaid in hands" goes, reputation is only the number of guarantees and age. So Guro's meeting of representatives is the shortest of the seven cities. Skill cannot be ranked, but promises kept can be counted: that is Guro's answer (provisional T06-13, T31-22).
- **Borders.** Onsu, Cheonwang, Oryu-dong and Gaebong are the south-western end of Seoul and face the blockade line. Cheonwang has the Line 7 depot, Guro's second workshop (provisional T06-14).

### 3.5 Geumcheon: the Guard Commander

- **Stations (3).** Gasan section: 가산디지털단지 Gasan Digital Complex, 독산 Doksan, 금천구청 Geumcheon-gu Office.
- **Lives by.** The fewest stations of the seven cities. It sits on Seoul's boundary and watches the blockade line of the machines outside from closest (01-core 8.2). Geumcheon lives by that nearness. In the 2-4 days when a blizzard blinds the machines, its people cross the blockade line and pull power sources and parts from wrecked war machines (01-core 6.3). And from the large machines salvaged at the old Gasan factory sites it builds well-drilling rigs. Without Geumcheon's drilling rigs, even Gwanak's drilling work teams cannot bore the rock (7.3) (provisional T06-15).
- **Rule.** Geumcheon's shareholding houses are the two houses that send out the guard units. Only someone of the two houses who has crossed the blockade line and come back can be Guard Commander. If a house's representative has not crossed, the house puts forward another hand who crossed and came back. Senior hands of the guard units sit in the meeting of representatives and count the stripes sewn on each candidate's sleeve (9.4). One stripe is one kept surety. Few cross and come back, so there are always two candidates, and only one if one house has no one who crossed. The Guard Commander serves for life. If the Guard Commander crosses again and does not return, the post falls empty. The Guard Commander need not cross, but an Guard Commander who never crosses loses the guard units' ear (provisional T06-16, T31-23).
- **Borders.** Geumcheon-gu Office and Doksan are Seoul's southern end stations and face the blockade line that lies 2-10 km beyond (01-core 6.3). Among the cities, Line 1 links it to Guro, and Line 7 to Guro's Namguro (provisional T06-71).
- **People without a guarantor.** Chapter 02 places hostile group G12, "Geumcheon People Without a Guarantor", in the buried factory basements between Geumcheon's three stations (Doksan, Geumcheon-gu Office, Gasan Digital Complex) and on the abandoned stretch of Line 1 (chapter 02 G12, provisional T03-30). Geumcheon lives with people of broken seals (10.6) as its neighbours. Freight and work teams moving on Line 1 buy the escort of Geumcheon's guard units. How to stand surety again for a broken seal is not set by this chapter (14.2) (provisional T06-72).

### 3.6 Dongjak: the Ferry Keeper

- **Stations (14).** Noryangjin section: 노량진 Noryangjin, 노들 Nodeul, 흑석 Heukseok, 동작 Dongjak. Sadang section: 사당 Sadang, 총신대입구(이수) Chongshin Univ. (Isu), 남성 Namseong. Sangdo section: 상도 Sangdo, 장승배기 Jangseungbaegi, 숭실대입구 Soongsil Univ., 신대방삼거리 Sindaebangsamgeori. Sindaebang section: 신대방 Sindaebang, 보라매병원 Boramae Medical Center, 당곡 Danggok.
- **Lives by.** The crossings. Of the thirteen border links of 01-core 7.4, eight have their Free City end on this side, and five of those eight are in Dongjak: Noryangjin (Line 1, the Government's Yongsan), Dongjak (Line 4, the Government's Ichon), Dongjak (Line 9, the Arc's Gubanpo), Sadang (Line 2, the Arc's Bangbae) and Chongshin Univ. (Isu) (Line 7, the Arc's Naebang). Nearly all people and freight of the Government and the Arc that travel to the Free Cities pass through Dongjak. Dongjak takes a passage share from the freight that passes. It also drills holes in the river ice off Noryangjin and Heukseok to catch fish. The ice-hole market at Noryangjin is where more fish change hands than anywhere else in Seoul (provisional T06-17).
- **Rule.** Dongjak counts its crossings as five: Noryangjin, Dongjak river side, Dongjak land side, Sadang and Isu. Each crossing is held by a house, and that house's representative is the crossing head. These five houses are Dongjak's shareholding houses, and a crossing is its house's workshop. When the Ferry Keeper dies or steps down, the five crossing heads meet at the meeting of representatives at Noryangjin and reckon reputation. Dongjak counts a kept surety as "a sheet of freight escorted across without loss". The Ferry Keeper is the Ferry Keeper only as long as he holds his own crossing. If he loses or closes it, he gives up the seat and the meeting opens again (provisional T06-18, T31-24).
- **Two faces.** Dongjak's Ferry Keeper faces the Government on the river side and the Arc on the land side (01-core 7.4). Dongjak station is the crossroads where the three polities meet. The land border with the Arc has no river, so disputes are most frequent there. That is why Dongjak keeps the most watch hands of the seven cities (section 12) (provisional T06-73).

### 3.7 Gwanak: the Duke

- **Stations (8).** Sillim section: 신림 Sillim, 서원 Seowon, 서울대벤처타운 Seoul Nat'l Univ. Venture Town, 관악산 Gwanaksan. Bongcheon section: 봉천 Bongcheon, 서울대입구 Seoul Nat'l Univ., 낙성대 Nakseongdae, 남태령 Namtaeryeong.
- **Lives by.** Gwanaksan. As 01-core 5.1 and 5.6 say, the firewood of Gwanaksan belongs to Gwanak. The forest of the near slopes was all cut in the 2060s, and what forest remains is on the outer slopes toward the blockade line. Gwanak's logging crews climb to those slopes and bring back dead trees. The wood sells two ways: as firewood it is a luxury (01-core 5.4), and as fibre it is cellulosic-sugar stock. Gwanak also knows the mountain's rock. Gwanak's drilling work teams bore through granite to dig deep wells (provisional T06-19).
- **Rule.** Gwanak is held by I Ilseop's house as Duke (01-core 7.2). Gwanak too has three shareholding houses: I Ilseop's house, the house that sends out the logging crews, and the house that holds the drill-rig workshop. Around 2060-2065, Gwanak's leading house took the Government's word for duchy from across the river and called itself Duke (provisional T02-54, T02-84). At the same time Gwanak's meeting of representatives changed the law so that the holder's seat passes within that house. It resolved to make the seat hereditary (2.1, item 14). Since then the ducal seat is handed down within that house. When a Duke dies, the meeting of representatives reckons the reputation of the people of the ducal house, and Gwanak counts it in "the depth of wells dug". The meeting of representatives remains and sets Gwanak's law and large sheets. Gwanak's sheet of the water supply contract also goes through the meeting of representatives before the Duke stamps it, and the meeting can send that sheet back (provisional T31-26). The other two shareholding houses do not forget the hereditary resolution. To win a large sheet from the meeting of representatives, the Duke must give the two houses more of the wood share and the drilling share. Under the Duke are two section chiefs, the logging foremen, and the mountain watch crew that watches the mountain. I Ilseop (born 2092, 34 in 2126) is the present Duke. [Approved] When he took up the seat is not set by this chapter (chapter 07) (provisional T31-25).
- **The word Duke.** Gwanak took the title Duke to say that it sat at the same height as the Government. The custom that a city that resolves to make the seat hereditary changes its holder's title (2.1, item 14) began then. So when Gwanak contracts with the Government, it insists on stamping "duchy to duchy" (7.2). People of the other cities half mock and half envy this insistence.
- **Borders.** Gwanak touches Seocho by land but has no line link (01-core 7.4). Namtaeryeong and Gwanaksan are the southern end of Seoul and face the blockade line.

## 4. The council

Basis: Bible 1, row 13 (no collective name; separate cities that trade and contract with one another), Bible 2.2 (no ruler above the whole). 01-core 2.4 (provisional T02-6), 5.2 (provisional T02-33), 7.2, 8.2 (host, provisional T02-70).

### 4.1 What it is

A council is a gathering the cities call each time they have something to decide together. It has no fixed place, no standing body, and no people of its own. When a council ends nothing remains of it but stamped contract sheets. So the council is not a name binding the seven cities; it is the **custom** by which the cities meet (01-core 7.2).

### 4.2 How it is held

1. **The call.** The holder of any city may call a council. The calling city provides the seat, and its holder becomes the host (01-core 8.2).
2. **The seat.** The host supplies the heat, light, meals and beds of the meeting. If the meeting runs long, the host's heat runs out, so councils seldom last more than three days. Free City people say, "A council lasts as long as the stove" (provisional T06-20).
3. **Who comes.** From each city comes the holder or someone the holder has trusted with the seal. A city that does not come is bound by none of the sheets made there.
4. **Sheets.** What a council makes is not one decision but many contract sheets. Each sheet states in figures who gives what, how much, and by when. A sheet binds only the cities that stamped it (01-core 7.2).
5. **No vote.** However many cities agree, they cannot bind a city that has not stamped. The host has no vote either. The host reads the sheets aloud, checks the figures and sets the order of stamping (provisional T06-21).
6. **The pledge.** A city that stamps a sheet leaves something with the counterpart city of that sheet until the sheet is paid in full. The host is not a party to the sheet, so the host holds no pledges. A pledge is a reel of copper wire, a key pump part, a few charged battery packs. When the sheet is paid the counterpart returns it; if the sheet is broken the counterpart keeps it. This is called "the pledge" (provisional T06-22).
7. **Copies.** Each city that stamped keeps one copy of the contract. There is no place that gathers all the copies. That is what it means that nobody stands above the seven cities.

### 4.3 Withdrawing the seal

Before stamping, any city may leave the meeting at any time. This is called "withdrawing the seal". There is no rule that punishes a city that withdraws its seal. But at the next meeting fewer cities want to make sheets with it (provisional T06-23).

### 4.4 When the Government and the Arc sit down

Councils with the Government or the Arc follow the same custom. But each sheet is always two-sided, between the Government (or the Arc) and one city. The Government looks for a counterpart that binds the seven cities as one, and there is none. So a large council becomes many sheets, each between the Government and one city, stamped together at one sitting (01-core 5.2). Government papers record this sitting as "the joint contract with the seven places across the river" (provisional T06-24).

### 4.5 Business among the cities

Councils are not called only to deal with the Government and the Arc. The cities also call them among themselves. Frequent business (provisional T06-25):

- Who maintains which cable and tunnel section (for example, the cable that carries Gangseo's power to Yeongdeungpo).
- Whom to give command when fighting together (11.3, the command sheet).
- Which city takes in people who have fled the Government ledger.
- How to fill the places of technicians who have gone to the Arc.

## 5. Workshops and work teams

Basis: Bible 1, row 12 (scarcity made children inherit work; a rigid vertical order), Bible 2.2 (most people are engineers). 01-core 2.2 (workshop speech), 7.2 (workshop houses), 10 (v3 replacements for the chaebol houses and operating houses: the Free Cities' workshop houses, station teams and workshops).

### 5.1 The workshop

The basis of Free City work is the **workshop**. A workshop is a workshop handed down in one house, and that house's skill. One workshop does one kind of work: there are workshops that wind motors, mend pumps, make wind-turbine blades, drill wells, build saccharification tanks, and roof greenhouses. The workshops that do the same work are named together by the work with "workshop" after it: "the motor workshop", "the pump workshop", "the drill-rig workshop" (provisional T06-26).

Workshops of the same work know one another across city lines. But there is no body that stands across the cities. Guro's motor workshop and Yangcheon's motor workshop speak the same words and do the same sums, but neither can choose or punish the other's representative.

### 5.2 Places within a workshop

| Place | Who | How one rises |
|---|---|---|
| Representative | The person who holds the workshop, and holds that workshop's seal | By inheritance. Usually the eldest child, or if the eldest has no hand, another child who has shown one |
| Skilled worker | Someone who can do the workshop's work with their own hands: the representative's children, relatives, or people bound by contract | Does the workshop's work alone in front of the representative. When the representative accepts them as a hand, they wear the workshop's badge |
| Apprentice | Someone learning a hand. Usually the house's children | Joins the workshop at about twelve |

(provisional T06-27)

The representative's place is inherited. The skeleton rule that scarcity made children inherit work (Bible 1, row 12) holds in the Free Cities too. But in the Free Cities an eldest child who cannot show a hand cannot take the workshop. If the heir has no hand, the representative brings in someone from another house who has shown one, by marriage or by contract. So marriage between workshop houses is also an exchange of skills.

### 5.3 The work team

A work team is a band put together from hands of several workshops for one contract. To strip and rebuild a pump whole, hands from the pump workshop, the motor workshop and the wiring workshop must go together. The work team leader is the representative of the workshop that made the sheet, or a hand the representative trusts with it. When the sheet is paid in full the work team disperses. This is the "Free City work team" that 01-core speaks of (5.2, 7.3, 9) (provisional T06-28).

### 5.4 Stations and sections

| Layer | Title | What it does |
|---|---|---|
| Station | Station Foreman | Keeps the station's entrances, heat, light hours and air. Chosen by the representatives who live in the station |
| Section | Section Chief | Keeps the section's tunnels, cables, greenhouse sites and salvage grounds. Appointed by the holder |

The titles are those of 01-core 8.2 (provisional T02-68, T02-69). That the representatives of a station choose its Station Foreman, and that the holder appoints Section Chiefs, is set by this chapter (provisional T06-29).

### 5.5 Layers of people

The Free Cities are not equal either. There are three layers (provisional T06-30).

| Layer | Who | What they have |
|---|---|---|
| Workshop houses | Representatives and their families | The right to contract in their own name and issue vouchers; the workshop's seal |
| Skilled workers | Technicians attached to a workshop | Wages and shares; the right to contract under their representative's surety |
| Labourers | People who have not shown a skill: people fled from the Government ledger, people whose seal was broken for breaking a surety (10.6), people come back from the Arc | Wages. They cannot contract in their own name |

Among the workshop houses, those that share the city's seal are the shareholding houses (2.1). A shareholding house has everything a workshop house has, plus a seat at the meeting of representatives and the right to put forward a holder. It is not a separate layer: a shareholding house's hands are hands, and if a shareholding house dies out another workshop house fills its place (provisional T31-27).

A day hand can become a hand by doing a workshop's work alone in front of any representative. But few representatives take a day hand to teach. A representative teaches his own children first. What the Government fears, "people on the ledger running away across the river" (01-core 7.4), is, seen from the Free Cities, more labourers.

## 6. Contracts, sureties and measures

Basis: 01-core 2.2 (promises are made in figures rather than words; favoured words: watts, litres, hours, contract, surety, hands, share), 4.1 (10 L of water per person), 5.3 (distribution by contract and market). Chapter 03 11.2 (kWh and labour hours), 11.4 (the design yardstick person-day), 11.5 (prices of 2126).

This section extends 01-core 5.3, "the Free Cities move it through contracts and markets", into a form of reckoning (section 14). Units and values follow chapter 03 section 11. On top of them this chapter adds the market institutions: the price board, vouchers, pack exchange and the pledge (4.2).

### 6.1 Nobody mints money

With nobody above the seven cities, there is also nobody to mint money. Free City people reckon value in electricity (chapter 03 11.2).

| Measure | What it is |
|---|---|
| Kilo | 1 kilowatt-hour (kWh) of electricity. The basis of the price board |
| Labour hour | One hour of one surety-backed hand. On the market usually 0.5 kWh; a board hand's or an implant technician's labour hour is 2-4 kWh |
| Litres, m³ | Water. Used in contracts |
| Watts | Heat. Used in contracts such as "20 kW of outside heat to this station for one half-year" |

"Skilled worker" is not a unit of reckoning; it is the name of a place within a workshop (5.2). Fibre is bought and sold by weight, but it is not a basis of reckoning (provisional T06-31).

### 6.2 The price board

Yeongdeungpo market posts prices on a board every day. This is the **price board**. Its values are the winter 2126 prices of chapter 03 11.5. Put into chapter 03's design yardstick, the person-day (what one person needs to live one day on the platform level, about 1.5 kWh), a few of them read (provisional T06-32):

> 1 ordinary labour hour = 0.5 kWh · a day's meals and water = about 1.5 kWh · 1 m³ of well water = about 2 person-days = about 3 kWh

Eight hours of one ordinary hand come to 4 kWh, a little under three person-days. A day of a board hand or an implant technician is four to eight times that. Those are the prices of a world where skill is scarce. As chapter 03 11.2 says, prices differ a little from city to city: in Gangseo, which holds the wind farms, the kWh is cheap; in Yeongdeungpo, which hosts the market, goods are cheap. When a long blizzard stops the wind turbines, the kWh rises everywhere.

### 6.3 Vouchers and charged battery packs

Two things change hands (provisional T06-33).

- **Vouchers.** Metal tags stamped by a workshop. They bear the workshop's seal and "so many kWh" or "so many labour hours": the workshop's promise to deliver that much electricity or work. What chapter 03 11.2 calls "a contract slip on which a workshop writes and stamps its promise of electricity", this chapter calls a voucher. Vouchers pass from person to person and are used like money. A tag is worth the name of the workshop that issued it. Tags of a workshop with a high number of guarantees in Guro are taken at the board rate; tags of an unknown workshop are discounted. When a workshop breaks a surety, its tags are worth only their metal.
- **Charged battery packs.** Fully charged battery packs (chapter 03 11.2). Packs are exchanged full for empty: you hand over a full one and get an empty one back. A revived pack holding 1 kWh is itself worth about 30 person-days (chapter 03 11.5), so what passes as payment is only the electricity inside. Whoever cannot return an empty pack pays for the pack separately. Deals where the voucher is not trusted, and deals with people outside the cities, are settled in charged battery packs.

Government ration coupons are not money in the Free Cities. Only the exchange stalls of Yeongdeungpo market take them, and at a discount (provisional T06-34).

### 6.4 The contract sheet

Every contract sheet is written in figures. Not "will mend the pump" but "2 intake pumps at Guui, 20 m³ per hour at a 30 m water level, surety for two short-daylight halves". A promise without figures is not a promise in the Free Cities. Every sheet carries a surety. The surety is "who loses what if it is broken". A sheet with a large surety also carries a large pledge left with the counterpart (4.2) (provisional T06-35).

## 7. The water supply contracts

Basis: Bible 1, row 11 (the winter of 2126, before the third water supply contract), Bible 3. 01-core 5.2 (thirty-year cycle; first 2066, second 2096, third 2126; the Arc sits for the first time at the third, provisional T02-33, T02-34), 5.6, 9 (provisional T02-85, T02-88), 11 item 5 (chapter 05 writes the council custom).

### 7.1 What is exchanged

As 01-core 5.2 says, the water supply contract trades the north's sites, hands and materials for the Free Cities' maintenance and parts. Seen from the Free City side, each city gives something different. The Government makes a separate sheet with each city, and the sheets are stamped together at one council.

| City | What it gives in the water supply contract | What it receives |
|---|---|---|
| Guro | Parts for the big pumps of the Government's Guui and Ttukdo intakes, and the whole rebuild done every thirty years | Copper wire, scrap metal, hands |
| Yangcheon | Rebuilding the motors that drive pumps and water wheels; rail carts to haul freight | Fibre, hands |
| Gangseo | Maintenance of the wind turbines on Government bridges and the north riverbank that drive the intake pumps | Fibre, firewood |
| Gwanak | Drilling work teams that dig the wells deeper | Fibre, salt |
| Geumcheon | Drilling rigs and their parts; power sources | Fibre, hands |
| Dongjak | Passage and escort for work teams and freight crossing the Noryangjin and Dongjak bridges | Passage shares taken in labour and fibre |
| Yeongdeungpo | The council seat, squaring the figures of the sheets, part of the water of the Yangpyeong-dong intake | Place fees, hands |

(provisional T06-36)

The Government's position, that is, what the Government means to give and how much, and the quarrel of its two parties, is written by chapter 04. The Arc's position is written by chapter 06.

### 7.2 The first and the second

- **The first water supply contract, 2066.** Held in the Assembly hall at Yeouido. Six cities stamped. Gwanak withdrew its seal, saying it could not put a Duke's seal beneath an Assembly Member's. For thirty years afterwards Gwanak made no sheet of its own with the Government and joined the contract only by lending hands to other cities' work teams (provisional T06-37).
- **The second water supply contract, 2096.** Also held in the Assembly hall at Yeouido. All seven cities stamped, because the Government agreed to write the name "Duchy of Gwanak" on Gwanak's sheet. Several Gangnam shelters also stamped as Free Cities (01-core 5.2, provisional T02-88). That was the last seal the Gangnam shelters put down as Free Cities (provisional T06-38).

### 7.3 The third water supply contract, 2126

The game opens before this council. The contract is not yet made. This chapter does not set the outcome; it lists only what is at stake on the Free City side (provisional T06-39).

1. **The host.** The Head of the Merchants' Association of Yeongdeungpo is the host (3.3). The Head of the Merchants' Association is the one who stood by reputation at the meeting of representatives. The seat is the Assembly hall at Yeouido. Government people come through the Mapo-Yeouinaru under-river tunnel. Arc people come from Gubanpo through Dongjak by Line 9. So the Arc's way to the meeting passes Dongjak's crossings.
2. **The Arc sits down for the first time.** The Arc holds the power of the Jamsil weir and the Amsa intake (01-core 5.2). The cities are divided over whether to stamp the Arc's sheets at the same sitting as the Government's, or separately. Dongjak speaks for its land border, Yeongdeungpo for the host's standing, Guro out of fear that the Arc will draw off technicians; each says something different.
3. **The wells deepen again.** The water level of the wells falls about 30 centimetres a year (01-core 5.2), about 9 metres more over the next thirty years. Wells of 60-80 metres must be re-dug to 70-90 metres. Gwanak, with its drilling work teams, and Geumcheon, with its drilling rigs, are the most expensive hands of this contract.
4. **The Yangpyeong-dong intake gives less.** The Han's flow shrinks a little every year (01-core 3.4). Yeongdeungpo must push the intake further toward the deep channel, and for that it needs Government hands.
5. **Jamsil power.** The Free Cities need Jamsil's power (01-core 7.4). A cable to bring it along Line 2 to Bangbae and Sadang passes through Dongjak.
6. **Gwanak's seal.** Gwanak again demands to stamp "duchy to duchy". With the Arc at the table, Gwanak must decide whether to make the same demand of the Arc.

## 8. Routes and borders

Basis: 01-core 7.4 (the thirteen border links, provisional T02-59, T02-102), 6.3 (the blockade line), 3.4 (the frozen river), 9 row 2076-2085 (provisional T02-86). `120-map-core.sql` map_edge, map_line.

### 8.1 Routes among the cities

Freight among the Free Cities moves on rail carts on the tunnel rails (3.2). The main routes are the lines (provisional T06-40).

| Route | Line and stations | Cities linked | What mostly moves |
|---|---|---|---|
| Southern belt | Line 2 Dangsan-Yeongdeungpo-gu Office-Mullae-Sindorim-Daerim-Guro Digital Complex-Sindaebang-Sillim-Bongcheon-Seoul Nat'l Univ.-Nakseongdae-Sadang | Yeongdeungpo, Guro, Dongjak, Gwanak | Guro's parts, Gwanak's firewood and fibre, Dongjak's fish. At Sadang it continues to the Arc's Bangbae |
| Western branch | Line 2 Sindorim-Dorimcheon-Yangcheon-gu Office-Sinjeongnegeori-Kkachisan | Guro, Yeongdeungpo, Yangcheon, Gangseo | Yangcheon's rail carts and motors, the produce of Gangseo's greenhouses |
| Wind line | Line 5 Banghwa-Gaehwasan-Gimpo Int'l Airport-Songjeong-Magok-Balsan-Ujangsan-Hwagok-Kkachisan-Sinjeong-Mok-dong-Omokgyo-Yangpyeong-Yeongdeungpo-gu Office-Yeongdeungpo Market-Singil-Yeouido-Yeouinaru | Gangseo, Yangcheon, Yeongdeungpo | Gangseo's electricity (the cable follows this tunnel), freight for the market. At Yeouinaru it continues to the Government's Mapo |
| Riverside line | Line 9 Gaehwa-Gimpo Int'l Airport-Airport Market-Sinbanghwa-Magongnaru-Yangcheon Hyanggyo-Gayang-Jeungmi-Deungchon-Yeomchang-Sinmokdong-Seonyudo-Dangsan-National Assembly-Yeouido-Saetgang-Noryangjin-Nodeul-Heukseok-Dongjak | Gangseo, Yangcheon, Yeongdeungpo, Dongjak | The way to the council, upkeep of the riverside wind turbines. At Dongjak it continues to the Arc's Gubanpo |
| Line 1 trunk | Noryangjin-Daebang-Singil-Yeongdeungpo-Sindorim-Guro-Gasan Digital Complex-Doksan-Geumcheon-gu Office; Guro-Guil-Gaebong-Oryu-dong-Onsu | Dongjak, Yeongdeungpo, Guro, Geumcheon | Geumcheon's power sources and drilling rigs, Guro's parts. At Noryangjin it continues to the Government's Yongsan |
| Line 7 trunk | Gasan Digital Complex-Namguro-Daerim-Sinpung-Boramae-Sindaebangsamgeori-Jangseungbaegi-Sangdo-Soongsil Univ.-Namseong-Chongshin Univ. (Isu). Onsu-Cheonwang is a separate short stub: the tunnel between Cheonwang and Gasan Digital Complex runs under ground outside Seoul and is not used | Guro, Geumcheon, Yeongdeungpo, Dongjak | Parts between the depots. At Isu it continues to the Arc's Naebang |
| Sillim Line | Saetgang-Daebang-Seoul Regional Office of Military Manpower-Boramae-Boramae Park-Boramae Medical Center-Danggok-Sillim-Seowon-Seoul Nat'l Univ. Venture Town-Gwanaksan | Yeongdeungpo, Dongjak, Gwanak | Wood from Gwanaksan |
| End of Line 4 | Dongjak-(the Government's Ichon), Sadang-Namtaeryeong | Dongjak, Gwanak | The bridge to the Government; Gwanak's southern end |

There are no checkpoints between the cities. But since every station's Station Foreman keeps its entrances and heat, someone who stays in another city's station pays that station's heat share. A work team carrying vouchers or a contract sheet pays no heat share in the stations of the cities that made that sheet (provisional T06-41).

### 8.2 Crossings with the Government

These are the five Government-Free City links of 01-core 7.4.

| Crossing | Line | Form | Free City side |
|---|---|---|---|
| Yongsan-Noryangjin | Line 1 | Bridge | Dongjak |
| Hapjeong-Dangsan | Line 2 | Bridge | Yeongdeungpo |
| Ichon-Dongjak | Line 4 | Bridge | Dongjak |
| Digital Media City-Magongnaru | Airport Railroad | Bridge | Gangseo |
| Mapo-Yeouinaru | Line 5 | Under-river tunnel | Yeongdeungpo |

The bridges are exposed to wind and snow. Since the Government was broken on the ice in 2079 trying to take the Yeongdeungpo intake, the river has been a line no army crosses (provisional T02-86). The watch of the city stands at the Free City end of each bridge. The Government's ledger checkpoint is at the north entrance of the under-river tunnel. The Free Cities keep no checkpoint at the south entrance. When a Government person comes through the tunnel and steps off at Yeouinaru, from there on they are off the ledger. People fleeing the Government ledger avoid the bridges and cross the ice on short-daylight-half nights, because the bridges close in a blizzard and the army stands at their north ends (chapter 07 section 11.1) (provisional T06-42).

### 8.3 The land border with the Arc

There is no river between the Free Cities and the Arc. The border is a single line between Dongjak-gu and Seocho-gu, and the lines meet it at three places: Sadang-Bangbae (Line 2), Chongshin Univ. (Isu)-Naebang (Line 7) and Dongjak-Gubanpo (Line 9) (01-core 7.4). All three are on Dongjak ground. Dongjak keeps a standing watch at these three crossings. Gwanak touches Seocho by land but no line meets there. Even so, Gwanak's mountain watch crew watches the surface east of Nakseongdae and Namtaeryeong, where it touches Seocho, for Arc people crossing over (provisional T06-43).

Because it is a land border, people cross easily. Free City technicians going over to the Arc, Free City people who go to the Arc to have their baptised bodies maintained, and people coming back from the Arc all pass these three crossings (01-core 7.4).

### 8.4 The blockade line

Gangseo (Gimpo Int'l Airport, Gaehwa, Gaehwasan, Banghwa), Guro (Onsu, Cheonwang, Oryu-dong, Gaebong), Geumcheon (Doksan, Geumcheon-gu Office) and Gwanak (Namtaeryeong, Gwanaksan) have stations at Seoul's edge and face the blockade line of the machines outside (01-core 6.3). Each city on the blockade line keeps a lookout on high ground at the surface. Crossing the blockade line, that is, going out during a blizzard to bring in power sources, is best known to Geumcheon's guard units. People of other cities who want to cross buy a guide from Geumcheon's guard units. The guide's price is not on the price board. It is paid as a share of whatever comes back (provisional T06-44).

## 9. Clothing

Basis: 01-core 3.1 (temperatures by depth: surface annual mean -9 °C, platforms 8-14 °C), 3.2 (light), 5.3 (fibre is eaten), 2.2 (workshop speech). Bible 1, row 14 (no names for cyberware parts).

### 9.1 Wearing cloth that cannot be eaten

In this world paper, wood and cotton are food (01-core 5.3). In hungry times cotton clothes go into the saccharification tank. So Free City people prize cloth that cannot be eaten: the synthetic-fibre clothes of before the Blackout. Synthetic outer clothes are handed down, mended when they tear, and unpicked and re-knitted when they wear through. Someone in cotton clothes is told they are "walking around wearing food". Cotton is kept for children's underclothes and for the shrouds of the dead (provisional T06-45).

### 9.2 Different clothes for each layer

| Where | What is worn |
|---|---|
| Platforms (8-14 °C) | Layered work clothes: a short jacket with sleeves to roll up, a belt with tool loops, patches at knee and elbow |
| Concourses (0-6 °C) | A padded vest and a fur-lined cap over the platform clothes |
| Surface (-9 °C; -22 °C in January; -35 °C on blizzard nights) | A long windproof coat, a face cover, snow goggles against the glare of the snowfield, overshoes. The haze dims the sky, but the light is about 80% of the pre-Blackout level, so the glare off snow hurts the eyes |

(provisional T06-46)

### 9.3 Marks

- **Workshop badges.** A new hand sews the workshop's badge on the left breast of the coat: a small piece of metal or cloth showing the workshop's work. Apprentices wear only a cord in the workshop's colour, without a badge (provisional T06-47).
- **The voucher cord.** A representative wears a sample of the workshop's voucher on a cord at the neck. It is the mark of a representative.
- **City colours.** Each city has a colour for the band worn around the coat collar, a sign by which a stranger in a station can tell which city someone comes from. The colours come from the old line colours: Gangseo the purple of Line 5, Yangcheon the green of Line 2, Yeongdeungpo the gold of Line 9, Guro the navy of Line 1, Geumcheon the olive of Line 7, Dongjak the sky blue of Line 4, Gwanak the blue of the Sillim Line (provisional T06-48).

### 9.4 City by city

- **Gangseo.** Wind farm people wear a rope hook at the waist, the line that ties them on when they climb a wind turbine.
- **Dongjak.** The crossing watch wears white snow over-garments, so as to vanish into the snow on the bridges and the river ice.
- **Gwanak.** Gwanak people smell of wood smoke, since Gwanak is the only city that burns wood regularly. The Duke and the ducal house wear long coats modelled on the formal dress of the Government's Assembly Members, and the Duke wears the old Gwanak-gu office seal on a cord at the neck. It is the Duke's will to sit at the same height as the Government, shown in clothing.
- **Geumcheon.** A guard unit member sews a stripe on the coat sleeve each time they cross the blockade line and come back. People with several stripes are rare.
- **Yeongdeungpo.** The Head of the Merchants' Association is known by sleeves dusty with the chalk of the price board. Merchant house people carry a small slate for figures at the waist.

(provisional T06-49)

### 9.5 What is not worn

Free City holders have no fixed robes of office. A holder is known by the city's seal. The Duke of Gwanak's dress is the exception, and other cities' people call it aping the Government. People with machines on their bodies do not hide them, but do not show them off either, because they do not count parts as the Arc does (provisional T06-50).

## 10. Daily life and speech

Basis: 01-core 2.2 (Free City voice), 3.2 (light is rationed; the long-daylight half and the short-daylight half), 3.5 (wind is the largest source of electricity), 5.3 (food), 5.5 (how the dead are cared for is set by chapters 04-06), 3.1 (unfrozen ground; abandoned stations freeze). Bible 1, row 9 (the Arc replaces all earlier religions), row 12.

### 10.1 Wind hours

If the Government's day is divided by the hours when the lights go on and off (01-core 3.2), the Free Cities' day is divided by the wind. Wind-machine power is more than half of Seoul's electricity, so when the wind is strong there is power to spare, and when it drops there is not enough. So Free City workshops run when the wind is strong and rest when it falls. The time when the wind blows hard is called **wind hours**. When wind hours come, the workshops light up even at night and the hands get up to work. When the wind falls, the lights go off and people sleep. The first greeting of Free City people is "How's the wind?" (provisional T06-51).

### 10.2 Meals

Meals come everywhere in Seoul from the same chain (01-core 5.3). Morning and evening are cellulosic-sugar porridge, with insect cakes and mushrooms on the side. Dongjak people eat more fish, Gangseo people more greenhouse vegetables. The Free Cities do not ration. People buy meals with wages or vouchers. In exchange, every Station Foreman keeps one saccharification tank as "the open vat", from which a day hand who found no work that day can eat a bowl of porridge. Filling the open vat is a share borne by all the station's workshops together (provisional T06-52).

### 10.3 Children and households

Children join their house's workshop as apprentices at about twelve (5.2). Before that, the children of a station gather to learn figures, letters and safety. The first lessons are how to climb the entrance ladders, how to tell when the air is going bad, and not to touch the wires. A household usually holds one workshop together and lives together. On marriage, the side with the smaller workshop moves to the platform of the side with the larger. Marriages across city lines are common. A marriage that joins the skills of two workshops is counted the best marriage (provisional T06-53).

### 10.4 Death

Frozen ground cannot be dug (01-core 3.1), and wood is a luxury that cannot be burned (01-core 5.4). Free City people lay their dead in a **frozen station**: an old platform whose people left and whose unfrozen ground froze over (01-core 3.1). The 307 lived-in stations of the map (01-core 4.3, chapter 02 section 1) stay lived-in stations; a frozen station is an abandoned platform belonging to one of them, or an old branch platform not on the map (provisional T09-5). The dead wear a cotton shroud and lie on that station's platform. The ice keeps them as they are. On the day of the funeral, the dead person's workshop seal and tools pass to the child who inherits. Inheritance takes place at the funeral. Each city has its own frozen station. Which old station it uses is not set by this chapter (it is set together with the station states of chapter 02) (provisional T06-54).

### 10.5 Belief

The Arc has replaced all earlier religions (Bible 1, row 9). The Free Cities have no organised faith. People believe in what can be measured. Some Free City people go to the Arc to be baptised, and Free City people call them "those who crossed over". Free City people do not forget that the Arc split away from the Free Cities. Older Free City hands hear their own workshop speech at the Arc's maintenance units and feel the bitterness of it (01-core 7.3) (provisional T06-55).

### 10.6 Law and punishment

Law differs from city to city. But the heaviest punishment is the same in all seven: **breaking the seal**. The seal of a person or workshop that broke a surety is broken, so that they can never again contract in their own name. A person whose seal is broken becomes a day hand (5.5). A person whose seal is broken cannot stand as a candidate for holder either (2.1, item 6). No other city accepts that person's seal either. The punishment holds across city lines not by law but because nobody wants to make a sheet with a broken seal. Harm to the body is judged by the city's holder and is usually repaid in labour hours. Killing is punished by driving the killer out of the city. To be driven out in winter is close to death (provisional T06-56).

### 10.7 Speech

As 01-core 2.2 says, Free City speech is workshop speech: short, full of numbers, informal among crew mates. People are called by city, workshop and house: "the Kims' second at the Guro motor workshop". Common sayings (provisional T06-57):

| Saying | Meaning |
|---|---|
| "How's the wind?" | A greeting. Asks whether work will go today |
| "Figures, not words." | When making a promise. Without figures it is not a promise |
| "Only as far as the seal." | Do nothing that is not in the contract |
| "A surety is repaid in hands." | If you broke a promise, pay it back in work |
| "Outside my share." | Not my job |
| "Any kWh left?" | Is there power to spare? The opening of a request |

Each city's turns of speech differ a little. Gangseo people speak in figures of wind, Dongjak people in figures of crossing, Gwanak people in figures of fire. Dongjak people say "You won't know till you cross", and Gwanak people say "You won't know till you light it". Yeongdeungpo people put everything in price board prices (provisional T06-58).

Free City people call Government people "the north of the river" or "ledger people". Arc people they call "Gangnam" or "those who crossed over" (provisional T06-74).

## 11. Militia and the rules of war

Basis: Bible 2.5 (owner decision D3: one commander commands all the squads of an army; the deliberate gaps of a roster are its identity; numbers live only in SQL), Bible 1, rows 5 and 15 (firearms and drones can be used, but ammunition and parts are scarce), row 14. 01-core 7.4, 9 (provisional T02-86).

### 11.1 No standing army

The Free Cities have no standing army. War is made by contract. Every workshop owes its city a **watch share**: each year it sends some of its hands for a set number of days to the watch of stations and crossings. When war comes, the holder calls up the watch shares, and if they are not enough, buys hands by contract. A force raised by contract is called a contract company (provisional T06-59).

### 11.2 One commander

As Bible 2.5 says, an army has one commander, who commands all its squads. In the Free Cities, the commander of an army is the holder of the city that raised it, or someone the holder has given command by contract sheet. Squads have no authority to move on their own. A work team leader leads his crew in the workshop, but on the field he is a squad leader who follows the commander's orders (provisional T06-60).

### 11.3 The command sheet

When several cities fight together, it is easy for there to be several armies, which goes against the rule of Bible 2.5. So cities that fight together call a council and make a **command sheet**. The sheet puts the squads of every city under one person. The squads of a city that has not stamped the command sheet do not join that army; they form an army of their own. That a command sheet takes time to make is the Free Cities' greatest weakness (provisional T06-61). The squads of a city that formed its own army can still stand on the same battlefield. They are then outside the player's command: allies commanded by their own city's commander (AI) (chapter 09 section 3.11, provisional T29-18).

### 11.4 How they fight

- **Never fight on the frozen river.** Free City people take the Government's defeat on the river in 2079 (provisional T02-86) as a lesson. The river is on the side of whoever holds.
- **Hold the crossings and tunnels.** The fields of battle are the bridge ends, the under-river tunnel, and the three land crossings with the Arc (section 8).
- **Cut heat and air.** Free City people know how a station's heat and air move. They stop the fans and block the entrances of a station the enemy holds, and drive the enemy out. Rather than killing people, they make the station unbearable.
- **Count every round.** Ammunition is scarce (Bible 1, row 15). Free City workshops pick up spent cases and reload them. A squad that fails to pick up its spent cases gets less ammunition under the next contract.
- **Drones and jamming.** Drones and radio jamming gear are the Free Cities' strength, because the hands that mend them and fly them again are in the Free Cities. But parts are scarce, so losing one is a large loss.

(provisional T06-62)

### 11.5 The gaps in the roster

As Bible 2.5 says, the gaps of a roster are a faction's identity. The Free Cities' gaps are these (provisional T06-63).

- **No infantry that wins by numbers.** They cannot bind hands with a ledger and field many people at once as the Government does.
- **No heavy infantry with machine bodies.** Fighting bands of baptised bodies belong to the Arc.
- **Few big guns.** They machine the parts, but have no ammunition to feed big guns.

The Free City roster is filled with engineers, carts, drones, jamming, and marksmen who spare their rounds. Each unit and its figures live in `data/sql/131-units-free-city.sql` alone, and this chapter writes no figures. The v3 roster is rebuilt by the units doctrine of chapter 07 and the data tasks after it.

## 12. Placement quotas for people

Basis: Bible 1, row 10 (1,022 people, CK3-style stats), row 12, Bible 2.2, 2.4. 01-core 8.2, 11 items 7 and 10. Plan task 8 (chapter 07 assigns stage, title, occupation and location from this table).

### 12.1 Head count

In `data/sql/050-wiki-people.sql`, 190 people have `faction_id` `free-city`. Their stages are now Key 3, S1 21, S2 33, S3 21, S4 112. Following the rule of plan task 8, faction membership stays as it is, and this chapter divides the 190 among the seven cities and their places. The totals per stage keep the present distribution, so chapter 07 and task 17 can seat people again without changing the total weight of story prominence. If any of the 8 independent people come to the Free Cities, chapter 07 decides it, and they are added on top of these 190 (provisional T06-64).

### 12.2 Quotas by city

The head count per city follows population (section 2), raised a little for the small cities so that each still has its holder and house, section chiefs and station foremen (provisional T06-65).

| City | People | Key | S1 | S2 | S3 | S4 |
|---|---|---|---|---|---|---|
| Gangseo | 40 | 0 | 4 | 7 | 4 | 25 |
| Yangcheon | 13 | 0 | 2 | 2 | 2 | 7 |
| Yeongdeungpo | 48 | 1 | 4 | 8 | 5 | 30 |
| Guro | 26 | 0 | 3 | 5 | 3 | 15 |
| Geumcheon | 10 | 0 | 2 | 2 | 1 | 5 |
| Dongjak | 33 | 1 | 3 | 6 | 4 | 19 |
| Gwanak | 20 | 1 | 3 | 3 | 2 | 11 |
| Total | **190** | **3** | **21** | **33** | **21** | **112** |
| Chapter 07 assignment (four independents, Guro row) | +4 | 0 | +2 | +2 | 0 | 0 |
| Total after assignment | **194** | **3** | **23** | **35** | **21** | **112** |

Chapter 07 section 3.2 adds four of the eight independents (Jang Useok, Heo Daon, Gu Chansol, Min Ung-gi) to the Guro row. So Guro has 30 people and the Free Cities 194. The table of section 12.3 below is the 190 before that addition (basis: chapter 07 section 3.3).
The three Key places are the three holders who weigh most at the third water supply contract: the Head of the Merchants' Association of Yeongdeungpo, who is the host; the Ferry Keeper of Dongjak, who holds the Arc's way in and the land border; and I Ilseop, Duke of Gwanak. The other four holders (Power Station Director, Depot Chief, Plant Manager, Guard Commander) are S1 (provisional T06-66).

### 12.3 Quotas by place

| City | Holder and house | Section chiefs | Station foremen | Representatives and work team leaders | Skilled workers and apprentices | Trade and contracts | Watch | Labourers and household | Total |
|---|---|---|---|---|---|---|---|---|---|
| Gangseo | 3 | 4 | 6 | 7 | 9 | 3 | 3 | 5 | 40 |
| Yangcheon | 2 | 2 | 2 | 2 | 2 | 1 | 1 | 1 | 13 |
| Yeongdeungpo | 3 | 4 | 6 | 5 | 6 | 12 | 5 | 7 | 48 |
| Guro | 2 | 2 | 3 | 7 | 7 | 2 | 1 | 2 | 26 |
| Geumcheon | 2 | 1 | 1 | 1 | 2 | 1 | 2 | 0 | 10 |
| Dongjak | 3 | 4 | 5 | 2 | 3 | 4 | 9 | 3 | 33 |
| Gwanak | 3 | 2 | 3 | 3 | 3 | 1 | 3 | 2 | 20 |
| Total | 18 | 19 | 26 | 27 | 32 | 24 | 24 | 20 | **190** |

(provisional T06-67)

The rival shareholding houses' representatives (2.1) take no new column; they are chosen from the columns below. Gangseo four, Yeongdeungpo four, Guro three, Geumcheon one and Gwanak two come from the "representatives and work team leaders" column; Dongjak's four are the crossing heads of the "watch" column. Yangcheon has one shareholding house and no rival; the next Depot Chief's candidate is the heir in the "holder and house" column (provisional T31-28).

The titles and occupations of each column (provisional T06-68):

| Column | Titles and occupations | What differs by city |
|---|---|---|
| Holder and house | The holder (title of section 2), spouse, heir, elders of the holder's house | In Yangcheon one shift leader falls in this column |
| Section chiefs | Section Chief, one per section (the same count as the 19 sections of section 3) | None |
| Station foremen | Station Foreman, filled from the largest stations down | Gangseo has station foremen who are also wind farm foremen |
| Representatives and work team leaders | Representative, work team leader | Gangseo: wind workshops; Guro: parts-machining and pump workshops; Yangcheon: motor and wheel workshops; Gwanak: logging foremen and drill-rig workshops; Geumcheon: the drilling-rig workshop |
| Skilled workers and apprentices | Skilled worker (in the city's work), apprentice | Follows what the city lives by (section 3) |
| Trade and contracts | Merchant house people, price board clerks, contract clerks, heads of porter bands, money changers | Yeongdeungpo has the most (the market and the council seat) |
| Watch | Crossing heads, squad leaders of the watch share, mountain watch, guard units | In Dongjak the other four crossing heads fall in this column (the Ferry Keeper is in the holder column). Geumcheon: guard units; Gwanak: the mountain watch crew |
| Labourers and household | Labourers, people come from the Government ledger, people who crossed over and came back, household stewards | Geumcheon's column is empty: the city is so small that everyone is tied to the edge work or to a workshop |

The order in which stages are seated, as a guide; chapter 07 sets the final rule (provisional T06-69):

1. Key and S1 go first to the holders and heirs, and to those who make sheets at the third water supply contract (representatives of large workshops, the price board clerk at the host's side, Dongjak's other four crossing heads).
2. S2 goes to section chiefs, foremen of large stations and work team leaders.
3. S3 goes to foremen of small stations, well-known hands and merchant house people.
4. S4 goes to skilled workers, apprentices, watch, labourers and household.

### 12.4 A note on age

Chapter 07 sets the minimum age for each place. This chapter's reference values: apprentices from twelve, hands from sixteen, representatives, work team leaders and station foremen from twenty, section chiefs and holders from twenty-five. A person whose recorded age does not fit these values changes place under chapter 07's rules. Age is a fixed fact and is not changed (provisional T06-70).

## 13. Public and private

This chapter has no private setting. It does not deal with the location of the sanctuary, who selects brains, the first brain, or who reads the output (Q12). Nor does it set which city Go Ye-jin grew up in (Q6) (01-core 11 item 12).

## 14. Where this chapter extends 01-core, and what it hands on

### 14.1 Where it extends 01-core

This chapter changes no value of 01-core. But it adds the following on top of 01-core. All of it is provisional.

| What 01-core had | What this chapter adds |
|---|---|
| 8.2, the seven titles (Duke of Gwanak [Approved], the rest provisional) | How each title's holder is chosen (sections 2, 3), seat stations, 19 sections |
| 7.2, "each city governs in its own way" | The common skeleton (shareholding houses, meeting of representatives, reputation, heating contribution, for life, losing houses, external offices, the hereditary resolution) and each city's yardstick (2.1-2.2). Task 31 corrected 01-core 7.2 "workshop houses take turns" to fit this skeleton |
| 4.3, the Free Cities about 75,000 | Population by city (section 2) |
| 7.2 and 8.2, the council and the host | The procedure of the council, no vote, the pledge, withdrawing the seal (section 4) |
| 2.2, "promises in figures rather than words"; 5.3, "move it through contracts and markets" | Market institutions: the price board, vouchers, full-for-empty pack exchange, the pledge left with the counterpart city (sections 6, 4.2). Units (kWh, labour hour) and values follow chapter 03 section 11 |
| 5.2, the water supply contract (the Government's sites, hands and materials for the Free Cities' maintenance and parts) | What each city gives, the Gwanak story of the first and second, the six things at stake in the third (section 7) |
| 5.5, "how the dead are cared for is set by chapters 04-06" | The Free Cities lay their dead in frozen stations (10.4) |
| 9, row 2060-2065, Gwanak takes the title Duke | At the same time Gwanak's meeting of representatives resolved to make the seat hereditary (3.7, task 31). 2066, Gwanak withdraws its seal; 2096, it stamps with "Duchy of Gwanak" written (7.2) |

### 14.2 What it hands on to other chapters

1. **Chapter 02.** Match the old stations used as frozen stations with the station states. Match the threats on the blockade line-side slopes (outside Gwanaksan, west of Gimpo Int'l Airport, south of Geumcheon) with chapter 02's blockade line design.
2. **Chapter 03.** Units and values are those of chapter 03 section 11. Chapter 03's "contract slip" and "battery pack" are this chapter's voucher and charged battery pack (done: task 9 wrote these names into chapter 03 section 11.2). The technical limits of drilling rigs, rail carts, case reloading and drone rebuilding are set by chapter 03.
3. **Chapter 04.** The Government's position in the water supply contract, the wording of Government papers, the watch at the north bridge ends, and the running of the north checkpoint of the Mapo under-river tunnel.
4. **Chapter 06.** What the Arc offers at the third water supply contract, the place of Free City technicians who went over to the Arc, and the Arc-side watch at the three land crossings.
5. **Chapter 07.** Use the quotas of section 12 to set the stage, title, occupation and location of the 190 people. Which of the 8 independents come to the Free Cities; new places for the Free City people who headed old polities (Han Jae-mok, Gang Minseo, Choe Ji-u) and for Cha Yewon (person-0457), whose old position was "Gwanak-gu Lord"; how to stand surety again for G12 (handed on by chapter 02); the year I Ilseop took up the ducal seat; each city's rival shareholding house representatives (the paragraph under the table of 12.3); the years the present holders stood at the meeting of representatives (task 31 impact report `docs/drafts/reports/v3-free-city-politics-impact.md`). Units doctrine follows section 11.
