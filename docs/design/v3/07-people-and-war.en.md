# v3 Bible Chapter 7. People Placement Rules, Life Between the Factions, Unit Doctrine

Status: draft. Plan `.omo/plans/wiki-lore-rebuild-v3.md` task 8. This is the English mirror of `07-people-and-war.md`; section numbers, figures, names and negations are the same.

How to read:

- **[Approved]** marks text carried over unchanged from the `docs/CANON-BIBLE.md` skeleton or an owner decision.
- **(provisional T08-n)** marks something invented in this chapter. Every one is listed under the same number in `docs/drafts/reports/v3-ledger-parts/t08.md`. It is not approved canon until the owner answers.
- **(provisional T02-n)** is a provisional item of chapter 1 (`01-core.md`). This chapter uses those decisions without changing them.
- The "Basis" line at the top of each section names the skeleton rows or chapter 1 sections it rests on. "Bible section 1 row 12" means row # 12 of the CANON-BIBLE section 1 table.
- This is a chapter of rules. It is written so that tasks 17-19 (people input), 20 (units) and 26 (data application) can finish their work from this chapter alone, without judgment calls. That is why it has so many tables and ordered steps. Only the descriptive parts of section 11 (life between the factions) and section 12 (unit doctrine) are meant to be carried into public wiki prose.
- This chapter has no private setting. It does not deal with the sanctuary's location, who chooses the brains, whose the first brain was, or who reads the output (Q12).

## 1. What this chapter does

Basis: chapter 1 section 11 item 7 (people placement uses the title ladder as it is), item 10 (people placement in chapter 07 uses the population per faction), item 3 (chapter 07 sets the turn unit and the size of a ratchet notch), chapter 1 section 10 (lords outside Seoul get a place inside Seoul in chapter 07), the item held back in chapter 1 section 10 (chapter 07 decides the place of the return network, provisional T02-92). Bible section 1 rows 10 and 12, section 2.5, section 6, section 8, section 9.2 Q17 and Q18, section 9.3.

This chapter decides five things.

1. **The people placement framework** (sections 2-7). The rules that give each of the 1,022 people a faction, a layer of the ladder, a title, a position, a rank, an occupation, a stage, a location, a household and an age. It also sets how the per-faction quota tables of chapters 04-06 are consumed and the shape those tables take.
2. **The stat rule** (section 8). The six stats of all 1,022 people are recomputed from their v3 role. The occupation-class table and the rank-modifier table are given in the exact shape of `scripts/pages/ck3-stats.mjs`.
3. **The people input files and the key disposition table** (sections 9-10). The shape of `docs/drafts/people/<faction>.jsonl` that tasks 17-19 write, and a table that sorts every key in the current data into FIXED, REDESIGN or DROP.
4. **Life between the factions** (section 11). Trade, smuggling, marriage, diplomacy, crossing the river.
5. **Unit doctrine** (sections 12-13). The v3 doctrine the three faction rosters follow, and the turn rule of the winter ratchet.

Chapters 04-06 (Government, Free City and Arc society) are being written at the same time as this one. So this chapter only fixes the shape of the quota tables they will produce (section 4.8), and also gives defaults to use when a table is missing or has a different shape. A place that chapters 04-06 fill by name (for example, who heads a given district) takes precedence over this chapter's default.

## 2. Starting point: the current data of the 1,022 people

Basis: `docs/design/v3/README.md` (fixed facts), `fixed-facts.snapshot.json`, `data/sql/050-wiki-people.sql`, `090-person-details.sql`, `100-clans.sql`, `110-family-trees.sql`. The figures in this section are counts of the current files, not settings of the year 2126.

| Item | Value |
|---|---|
| People | 1,022. 553 men, 469 women |
| Base faction (`faction_id`) | Government 504, Arc 320, Free City 190, independent 8 |
| Detailed records | 511. They have age, birthday, generation and `characterId`, plus biography, relations, values, desire and portrait tokens (511 tokens) |
| Thin records | 511. Only the name, title and stats copied from the 050 columns. No age |
| Clans | 177 clans, 955 clan members, 62 non-Korean families, 126 generation lines (branches) with 515 people |
| Family trees | 148 trees, 2,829 nodes (483 living, 2,346 ancestors), 2,355 edges |
| Recorded kin among living people | Three households: Im Hajun, Im Chowon (adopted) and Bak Serin (a ward living with them); Jeong Seoon and Jeong Yura (same household); Sin Jong-mok and Sin Jun (father and son). The 8 Kinship relations of 090 (4 outgoing, 4 incoming) all lie inside these three households |
| Old titles | 56 old rank words, several hundred old occupation phrases. 105 people carry an old lordship marker (section 7.1) |

What v3 does not change is the README's list of fixed facts: a person's name, sex, recorded age and birthday, clan and family relations, portrait face and picture. Everything else is decided again by the rules of this chapter.

## 3. Faction assignment and the 8 independents

Basis: Bible section 1 row 7 (there are only three factions), section 2.4 (districts are bound to factions), section 6, section 9.2 Q5, section 9.3 Q20 and Q30. Plan task 8 faction rule.

### 3.1 Base value kept

`faction_id` keeps its current value: Government 504, Arc 320, Free City 190. Bible section 2.4 binds districts to factions, and moving a person to another faction would clash with the district they live in. The only people this chapter assigns are the 8 `independent` people.

### 3.2 The 8 independents

| id | Name | Age | Assignment | Location (real station) | Reason |
|---|---|---|---|---|---|
| person-0035 | Jang Useok | 55 | Free Cities (Guro) | Cheonwang | The work and the contract partners in her old record (workshop people of Guro and Cheonwang) are all in Guro. The old "polity outside Seoul" does not exist in v3, so she gets a place inside Seoul (section 7.1) (provisional T08-1) |
| person-0038 | Heo Daon | 50 | Free Cities (Guro) | Cheonwang | His work is wheel maintenance at the Cheonwang depot. Same as above (provisional T08-1) |
| person-0039 | Gu Chansol | 40 | Free Cities (Guro) | Guro | His workplace is the Guro tool market. Same as above (provisional T08-1) |
| person-1008 | Min Ung-gi | 32 | Free Cities (Guro) | Cheonwang | The former superior of the three above. His work is radio maintenance and salvage repair, and he leads a work group that keeps humanoids. In a world where machines are scarce, the hands that keep humanoids running are in the Free Cities (chapter 1 section 5.6). As Station Foreman of Cheonwang he keeps the three as his crew (provisional T08-2) |
| person-1017 | Ji Yeon-hui | 26 | Arc | Suseo | Go Ye-jin's bodyguard since 2120 (Bible section 6 [Approved], chapter 1). Follows the recommended default of Q5 (Suseo area, Arc) (provisional T08-3) |
| person-1003 | Jo Jaepyo | 37 | kept independent | Dongjak | Leader of a party that crosses the machines' rim in a blizzard and comes back (section 7.4). The Government strikes anyone who crosses the rim off its ledger (chapter 1 section 2.4), and neither the Free Cities nor the Arc count such a person as their own. Being on no ledger is the condition of the work. He stays at Dongjak, where the three polities meet, under contract (provisional T08-4) |
| person-1004 | I Yeon | 25 | kept independent | Dongjak | Jo Jaepyo's attending messenger. Same reason as Jo Jaepyo (provisional T08-4) |
| person-1021 | Cha Yu-seon | 50 | kept independent | Yeongdeungpo | A negotiator mandated jointly by merchants of several cities and stations. At the contract meeting of the third water supply contract she sits holding the merchants' share. Joining any one polity would break the mandate (provisional T08-5) |

The three who stay independent are not a faction. Bible section 1 row 7, "there are only three factions", stands. These three are people on no polity's ledger, and the screens write them as "Unaffiliated" (section 4.5).

### 3.3 Head count per faction after assignment

| Faction | Base value | Added | Total |
|---|---|---|---|
| Government | 504 | 0 | 504 |
| Free Cities | 190 | 4 (0035, 0038, 0039, 1008) | 194 |
| Arc | 320 | 1 (1017) | 321 |
| Unaffiliated | 8 | −5 | 3 (1003, 1004, 1021) |
| Total | 1,022 | | 1,022 |

The quota tables of chapters 04-06 count Government 504, Free Cities 194, Arc 321. Task 17 writes `government.jsonl` with the 504 plus the 3 unaffiliated (of the three faction files, the three unaffiliated go in the Government file; plan task 17: "plus the independents that 07 ... keeps independent"). Task 18 writes 194 and task 19 writes 321.

## 4. Seat assignment: layer, title, position, tier, stage, location

Basis: chapter 1 section 8 (title ladder, five layers), section 8.4 (the three ladders at a glance), section 2.3 (naming rules), chapter 1 section 4.3 (population per faction), Bible sections 2.1-2.4.

### 4.1 Ladder layer and tier

A person's `tier` is set by the layer of the chapter 1 ladder they sit on (provisional T08-6).

| Tier | Layer | Government | Free Cities | Arc | Number in the faction |
|---|---|---|---|---|---|
| T1 | Head and district | President for Life, Member of the National Assembly | City heads (Duke of Gwanak, Ferry Keeper, Market Master, Works Master, Edge Warden, Depot Master, Wind Keeper) | Hierophant, Head of the Near House | Government 15, Free Cities 7, Arc 5. Seoul 27 |
| T2 | Faction office and district house | Ministers of the ministries, heads of national agencies, heirs of Assembly Member houses | Heirs of city-head houses, owners of large benches, Company Captains | Members of a Near House, heirs of a Near House head's house, offices close to the Hierophant | Quota table (section 4.8) |
| T3 | Dong | Dong Chief | Section Chief | Shelter Head | Quota table |
| T4 | Station | Stationmaster | Station Foreman | Bench Keeper | Quota table |
| T5 | Everyone else | Clerks, soldiers, workers, doctors, teachers, registered residents | Hands, skilled hands, apprentices, contract soldiers | Believers, the baptised, fitters, warriors | The rest |

- T1 is exactly 27 seats: one head for each of the 25 districts, plus the President for Life and the Hierophant. The Free Cities have no head ([Approved], Bible section 2.2).
- The President for Life is acclaimed from among the Members of the National Assembly (Bible section 2.1 [Approved]). On acclamation that person's district seat is handed down to the heir of the house (section 6.3). If the house has no heir to take the seat, another house takes it through the district's Assembly election. Either way the fourteen Members and the President for Life are fifteen different people. This matches chapter 1 section 2.4's "fourteen seals" (provisional T08-7).
- Only seat holders of T1, T3 and T4 carry a ladder title. T2 and T5 use a job title (the name of their work) instead.

### 4.2 What a seat is

A seat is bound to land. The land frame is the fixed geography (the 25 districts of `121-map-titles.sql`, the 427 dongs and 312 stations of `120-map-core.sql`) (provisional T08-8).

| Seat | Land | Identifier | Rule |
|---|---|---|---|
| District seat | one district | `map_title` district id (`geography:duchy:<district code>`) | one person per district |
| Dong seat | one dong | `map_region.id` (`region:<dong code>`) | at most one person per dong. Dong Chiefs outside the people set are not counted |
| Station seat | one station | `map_station.id` | at most one person per station |
| District seat station | the district's main station | `map_station.id` | the station in the district with the highest `degree`; on a tie, the lower `sort`. Same as the default duchy seat station of the unit framework (`docs/design/roster-framework.md` section 4.1) |
| Dong of a station | | | the dong whose `map_region.path` polygon contains the station's coordinates (`map_station.x`, `y`). This turns chapter 1 section 8's "the dong with the main entrance" into a calculation on the map data |

District seat stations (computed by the rule above from `120-map-core.sql`):

| District | Seat station | District | Seat station | District | Seat station |
|---|---|---|---|---|---|
| Jongno-gu | Jongno 3-ga | Jung-gu | Seoul Station | Yongsan-gu | Samgakji |
| Seongdong-gu | Wangsimni | Gwangjin-gu | Geondae-ipgu | Dongdaemun-gu | Cheongnyangni |
| Jungnang-gu | Sangbong | Seongbuk-gu | Bomun | Gangbuk-gu | 4.19 Democratic Cemetery |
| Dobong-gu | Changdong | Nowon-gu | Nowon | Eunpyeong-gu | Yeonsinnae |
| Seodaemun-gu | Chungjeongno | Mapo-gu | Gongdeok | Gangseo-gu | Gimpo Airport |
| Yangcheon-gu | Mokdong | Yeongdeungpo-gu | Dangsan | Guro-gu | Sindorim |
| Geumcheon-gu | Gasan Digital Complex | Dongjak-gu | Noryangjin | Gwanak-gu | Sillim |
| Seocho-gu | Gosok Terminal | Gangnam-gu | Gangnam-gu Office | Songpa-gu | Garak Market |
| Gangdong-gu | Cheonho | | | | |

A district head's location is the district's seat station. The approved and default exceptions of section 4.6 (the President for Life at Gwanghwamun, the Hierophant at Suseo) come first.

### 4.3 Stage

Stage says how far forward a person stands in the story. In v3 it is set by layer and by name (provisional T08-9).

1. **Key**: all 27 people of T1, plus four named people: Ji Yeon-hui (1017), Sin Jong-mok (1009), Jo Jaepyo (1003), Im Hajun (0086). 31 people in all.
2. **S1**: every T2 person who is not Key, plus every named exception of Bible section 6 who is not Key (the 23 `NAMED_EXCEPTIONS` of `ck3-stats.mjs`), plus I Yeon (1004) and Cha Yu-seon (1021).
3. **S2**: the remaining T3.
4. **S3**: the remaining T4.
5. **S4**: the remaining T5.

`stage_ko` is "주요" for Key; the rest are S1-S4 as written.

### 4.4 How titles and positions are formed

Titles (`title`) and positions (`position`) are formed as follows. Where a name appears, the fixed geography's name is used letter for letter (provisional T08-10).

| Who | `title_ko` | `title` (English) |
|---|---|---|
| Member of the National Assembly | `<구> 국회의원` (e.g. 종로구 국회의원) | `Member of the National Assembly for <District>` |
| President for Life | `종신 대통령` | `President for Life` |
| Free City head | `<district name without '구'> <title>` (e.g. 관악 공작, 동작 나루지기) | `<District stem> <Title>` (e.g. Dongjak Ferry Keeper). Gwanak alone uses the approved English Duke of Gwanak |
| Head of the Near House | `<district name without '구'> 곁집장` (e.g. 송파 곁집장) | `Head of the <District stem> Near House` |
| Hierophant | `교주` | `Hierophant` |
| Dong seat | `<동> 동장` / `<동> 구간장` / `<동> 대피소장` | `Dong Chief of <Dong>` / `Section Chief of <Dong>` / `Shelter Head of <Dong>` |
| Station seat | `<역>역 역장` / `<역>역 역반장` / `<역>역 정비장`. If the station name already ends in "역", nothing is added (서울역 역장) | `Stationmaster of <Station>` / `Station Foreman of <Station>` / `Bench Keeper of <Station>` |
| Person without a seat | the "person name" of the occupation list (section 8.2) (e.g. 펌프 정비공, 배급 서기) | the English person name of the occupation list |

- The position (`position_ko`) is `<title_ko> · <location station name>`. The location station name uses the "역" rule of section 4.4 (e.g. "배급 서기 · 서울역", "펌프 정비공 · 신도림역"). The English is `<title> · <Station> Station`. If the location is the seat's own land (district heads, dong and station seat holders), the position adds the faction name after the title instead (e.g. "관악 공작 · 자유도시들", "종로구 국회의원 · 정부").
- For the named exceptions (section 7.2) the position uses the recommended wording of the owner questions (Q19-Q30) as it is. Where that wording differs from the formula above, the question's wording wins.
- English renders these as plain occupational English, as chapter 1 section 2.3 item 6 requires.

### 4.5 Organization (`state_id`, `state_name`)

`state_id` is the faction id (`government`, `free-city`, `arc`). `state_name` and `state_name_ko` copy the name of that faction's row in `040-wiki-states.sql` as revised by task 16. The three unaffiliated people have `state_id` `independent`, `state_name_ko` "무소속" and `state_name` "Unaffiliated". Old state ids and old district-level ids are not used (provisional T08-11).

### 4.6 Location

Everyone has two real stations: the station where they work (`workStationId`) and the station where they sleep (`homeStationId`). Both are `map_station.id`, and they are usually the same. `map_station.id` is usually the Korean station name, but a few are in English (Sindorim is `Sindorim`, Guro is `Guro`, Yeongdeungpo is `Yeongdeungpo`). Use the id, not the name. The location is decided in this order (provisional T08-12).

1. **Approved and default exceptions.** A location written in the section 7.2 table comes first. Sin Jong-mok's residence in Nonhyeon 2-dong, Gangnam (Bible section 6 [Approved]) is one of these.
2. **Seat.** A seat holder lives on the seat's land. A district head at the seat station, a dong seat holder at the station of that dong with the highest `degree`, a station seat holder at that station.
3. **Anchor in the old record.** If the old record (050 `title_ko` and `position_ko`, the work and residence locations in 090 `fields`, the stations in `confirmedHoldings`) names a real station in a district of the person's faction, that station is used. If no station is named but a dong is, the station of that dong with the highest `degree` is used. Longer names are matched first (e.g. "신정네거리" before "신정"). An anchor in a district outside the faction is discarded.
4. **Quota.** With no anchor, the person receives a district with quota left in the assignment order of section 4.7, and the stations of that district in turn by `sort`.
5. **Living outside the faction.** Only the work listed in section 11.6 ("people who live on another faction's land") may have a location outside the faction, and only up to 3% of the faction's people (Government 15, Free Cities 5, Arc 9). Sin Jong-mok counts toward this number (provisional T08-13).

### 4.7 Assignment order

Tasks 17-19 assign each faction in the following order. The same input gives the same result whoever does it (provisional T08-14).

1. **Priority order P.** Line up the faction's people by these keys. (a) Old heads (people whose old rank is one of the old head words of section 7.2) 0, former lords (section 7.1) 1, the rest 2. (b) Old stage Key < S1 < S2 < S3 < S4. (c) Old tier T1 < … < T5. (d) Higher recorded age first; people without an age last. (e) id order.
2. **Seats already decided.** Seat first the tables of sections 7.2 and 7.3 and any seat that chapters 04-06 fill by name. If chapters 04-06 and this chapter put different people in the same seat, chapters 04-06 win. The displaced person goes to step 4.
3. **Empty district seats.** If a district seat is empty, seat the first person in P among old heads and former lords whose anchor is in that district; if there is none, the first such person whose anchor is not inside the faction.
4. **T2, T3, T4.** Fill the per-district cells of the quota table in the order T2 → T3 → T4. In each cell, first seat the people anchored in that district in P order, then the people with no anchor in P order. Skip anyone younger than the minimum age for that layer (section 5.1).
5. **T5.** Everyone left becomes T5. They go to their anchor district if they have one, otherwise to the district with the most T5 quota left (on a tie, the order of the Bible section 2.4 table).
6. **Occupation class.** The occupation class of seat holders (T1, T3, T4) is `governance`. Everyone else fills the occupation-class cells of the quota table (section 4.8 table Q-2) in P order. A person's preference is (a) if a parent recorded in the family trees is in the people set, that parent's class; (b) the class of the highest-placed person already assigned in the same clan within the same faction (house trade, section 6.2); (c) the class of the old occupation phrase under the old `OCCUPATION_CLASSES` (the seven old classes exist in v3 with the same ids); (d) classes in order of most cells left. A full class is skipped.
7. **Occupation phrase.** Within the class, use the first phrase of the section 8.2 list that is allowed for the faction. If chapters 04-06 name a livelihood for that district and it is a list phrase of the same class, use that phrase.
8. **Rank.** Set by the default rank table of section 8.5.
9. **Age.** People without an age get one by section 5.2. If a recorded age is below the rank's minimum age, apply section 5.3.

### 4.8 The shape of the chapter 04-06 quota tables

Basis: plan tasks 5-7 ("a role-quota table per district that task 17 uses"; it sums to the faction's people count and names only real districts and stations).

The quota tables of chapters 04-06 contain these two tables (provisional T08-15).

**Table Q-1. Layer quota per district.** One row for each district of the faction; columns as follows.

| District | Stations | T1 | T2 | T3 | T4 | T5 | Total |
|---|---|---|---|---|---|---|---|

- Stations is the number of stations in that district in `map_station`.
- T1 is 1 for each district. The President for Life (Government) and the Hierophant (Arc) add 1 to the T1 cell of the district where that person lives.
- The column total must equal the faction's people count (Government 504, Free Cities 194, Arc 321).

**Table Q-2. Occupation-class quota.** Rows are the 12 occupation classes of section 8.3; columns are T2, T3, T4, T5, total. All seat holders of T3 and T4 count under `governance`.

If a table is missing or has another shape, tasks 17-19 use these defaults.

- **Per-district totals.** Use chapters 04-06's per-district totals if they exist; otherwise divide the faction's people count minus T1 in proportion to each district's station count (largest-remainder method) and add T1.
- **Layers.** Multiply the faction's people count by T2 3%, T3 12% and T4 8%, round, and divide by the largest-remainder method in proportion to the per-district totals. T5 is the rest.
- **Occupation classes.** Multiply the people who are not seat holders by these shares and divide by the largest-remainder method (provisional T08-16).

| Occupation class | Government | Free Cities | Arc |
|---|---|---|---|
| governance (T2 offices such as ministers) | 2% | 2% | 2% |
| soldier | 12% | 6% | 14% |
| guard | 9% | 5% | 6% |
| medical | 5% | 4% | 6% |
| fitting | 0% | 2% | 12% |
| provision | 20% | 18% | 20% |
| labour | 12% | 10% | 10% |
| trade | 10% | 12% | 5% |
| courier | 6% | 8% | 5% |
| maintenance | 5% | 22% | 10% |
| scout | 5% | 6% | 5% |
| record | 14% | 5% | 5% |
| Total | 100% | 100% | 100% |

These shares come from chapter 1 section 5.3 (food rests on fibre sugar and light fields), section 5.6 (control of each link) and section 7 (the power structure of the three polities). The Government has many clerks and levy soldiers, the Free Cities have the most maintenance, and the Arc has many implant fitters and baptised warriors.

## 5. Age

Basis: Bible section 1 row 12, README fixed facts (recorded ages), `scripts/pages/v3-fixed-facts.mjs` (`birthDate`, `birthday`, `age` and `ageAsOf` may be added only for people who had none, and English and Korean must be equal).

### 5.1 Minimum age and age band per rank

The minimum age is the youngest age at which a person can hold the rank. The age band is the range used to give an age to a person without a recorded age (minimum ages provisional T08-17, age bands provisional T08-18).

| Rank | Faction | Minimum age | Age band |
|---|---|---|---|
| 종신 대통령, 교주 | Government, Arc | 25 | only recorded people hold these |
| 국회의원, the seven city heads (공작, 나루지기, 장주, 공장장, 경계장, 기지장, 바람지기), 곁집장 | all three | 18 (hereditary) | 40-70 |
| 장관, 원장 | Government | 30 | 45-70 |
| 후계 | all three | 16 | 18-35 |
| 동장, 구간장, 대피소장 | all three | 25 | 35-65 |
| 역장, 정비장 | Government, Arc | 25 | 32-62 |
| 역반장 | Free Cities | 22 | 30-60 |
| 서기관 | Government | 30 | 42-62 |
| 사무관 | Government | 25 | 32-58 |
| 주사 | Government | 20 | 28-56 |
| 서기 | Government | 18 | 19-40 |
| 전문의 | Government | 30 | 33-65 |
| 수련의 | Government | 24 | 25-33 |
| 교사 | Government | 22 | 24-62 |
| 대령 | Government | 35 | 42-58 |
| 대위 | Government | 24 | 27-40 |
| 하사 | Government | 19 | 21-38 |
| 병장 | Government | 18 | 18-24 |
| 등재민 | Government | 0 | 18-60 |
| 작업대주 | Free Cities | 25 | 35-68 |
| 숙련공 | Free Cities | 20 | 25-62 |
| 일손 | Free Cities | 16 | 17-55 |
| 견습공 | Free Cities | 12 | 13-19 |
| 계약대장 | Free Cities | 25 | 30-50 |
| 계약병 | Free Cities | 17 | 18-40 |
| 곁집원 | Arc | 0 | 18-60 |
| 정비공 | Arc | 18 | 20-58 |
| 세례자 | Arc | 16 | 17-60 |
| 신도 | Arc | 0 | 16-70 |
| 전사장 | Arc | 25 | 28-48 |
| 미등록 | Unaffiliated | 0 | 20-55 |

- The first baptism is received at 16 or older, so the minimum age of the baptised is 16 (if chapter 06 decides otherwise, chapter 06 is followed).
- Government military service begins at 18, like Republic of Korea military service. The Private band is short because levy soldiers go back to being registered residents after a few years.
- The hereditary seats (Assembly Member, city heads, Head of the Near House) have a minimum age of 18 because they pass by blood. That is why O Gyeongjae (22) can be a Head of the Near House.

### 5.2 The 511 people without a recorded age

People without a recorded age (the 511 whose 090 `sourceStatus` is `ck3-table-derived`) get an age by the following rule. Every such age is provisional (provisional T08-19).

1. **Band.** Start with the age band `[lo, hi]` of the rank the person received in section 4.7.
2. **Kin window.** If the person is in a generation line (a branch in `clan.branches_ko`) and the same branch has people with recorded ages, the kin window runs from the lowest of those ages − 8 to the highest + 8, because the same generation syllable means the same generation. If band and window overlap, use the overlap. If they do not, use the single end value of the band nearest to the window.
3. **Pick.** In the interval `[lo, hi]`, `age = lo + (n mod (hi − lo + 1))`, where `n` is the number in the id (15 for person-0015).
4. **Dates.** `ageAsOf = "2126-12-31"`, birth year = 2126 − age, month = `(n mod 12) + 1`, day = `((n × 7) mod 28) + 1`. `birthDate = "YYYY-MM-DD"`, `birthday = "MM-DD"` (two digits each). Because the birthday always falls on or before 31 December, the age is correct.
5. **Both languages.** The four values (`birthDate`, `birthday`, `age`, `ageAsOf`) are written identically in `json` and `json_ko`. `age` is a number; the others are strings. `generation`, `characterId` and `clan` are not added (they are fixed facts, so adding them would fail the freeze check).
6. **Ledger.** Tasks 17-19 add one ledger row per faction file ("the ages of the N people without an age in this file are the values of the chapter 07 section 5.2 rule"). They do not add a row per person.

### 5.3 When a recorded age does not fit the role

A recorded age is a fixed fact and is not changed. If a recorded age is below the rank's minimum age, the role gives way. The person moves to a younger rank in the same layer (e.g. 주사 → 서기), or, if there is none, one layer down. Sin Jun (12) is a registered resident of the Government.

## 6. Households and inheritance

Basis: Bible section 1 row 12 (scarcity made children inherit their parents' work, and vertical strata hardened), section 2.1 (inheritance), section 2.3 (the Hierophant's line and the houses close to it), chapter 1 section 2.4 (handed-down seats, Near Houses), sections 7.1-7.3.

### 6.1 The three recorded households

Within the people set, recorded kin between living people exist in only three households. Each is bound into one household (`household.id`) and sleeps at the same station (provisional T08-20).

| Household | People | Relation (fixed) | Faction | Station where they sleep |
|---|---|---|---|---|
| Im Hajun's household | Im Hajun (0086, head, missing), Im Chowon (0087, adopted child), Bak Serin (0090, ward living with them) | adoptive and household edges of the family tree, Kinship | Arc | Gangnam-gu Office |
| The Jeong household | Jeong Seoon (1005, head), Jeong Yura (0399) | household edge of the family tree, Kinship "distant relative" | Arc | Gosok Terminal |
| The Sin household | Sin Jong-mok (1009, head), Sin Jun (1010, son) | biological edge of the family tree, Kinship | Government (lives in Gangnam) | Seonjeongneung |

Jeong Yura stays in the Jeong household even as Head of the Songpa Near House (section 7.3). Her work station is the Songpa seat station; her home station is the Jeong household's.

### 6.2 Houses and the house trade

The people of one clan within one faction are called a **house**. The house is the unit of inheritance in v3 (provisional T08-21).

- A house's **house trade** is the occupation class of the house member on the highest layer (on a tie, the one earlier in P). This is item (b) of section 4.7 step 6. So members of one house do the same work as far as the quota allows.
- A person whose parent is recorded in a family tree follows the parent's class first (item (a) of section 4.7 step 6). In the people set this applies only to Im Chowon (who took over Im Hajun's pump maintenance) and Sin Jun.
- Members of a house live in the same district if the quota allows. In section 4.7 step 5, a person without an anchor first receives the district of a member of the same house who has already been assigned.

### 6.3 Seats handed down

| Faction | What is handed down | Who receives it |
|---|---|---|
| Government | The Assembly Member's seat (handed-down seat). Dong Chief and Stationmaster posts in practice also stay in one house | The house's heir (rank "후계"). The Assembly election survives but is a ritual |
| Free Cities | It differs from city to city. In Gwanak, I Ilseop's house holds it as duke. Benches are handed down within houses | Benches and head seats go to the house's heir. Section Chiefs and Station Foremen are chosen by skill |
| Arc | The seat of the Head of the Near House. The Hierophant can name and remove Near Houses (chapter 1 section 7.3) | The heir within the Near House. A Near House member with more parts sometimes goes ahead of blood |

(provisional T08-22)

### 6.4 Generation lines and kin across the river

The 126 branches of `clan.branches` are lines of the same generation that share a generation syllable. 92 of them have members spread over two or more factions. Section 11.4 explains why inside the world. Branch names and status texts are to be redesigned: the name is `<syllable> 항렬 가계` (English `<syllable> generation line`) and the status is `추정` (English `Inferred`). Branch ids and members are fixed (provisional T08-23).

## 7. Re-placing the old seats

Basis: Bible section 6 (named-person exceptions), section 9.2 Q18, section 9.3 Q19-Q30, chapter 1 section 10 (retired concepts: lords outside Seoul, old national offices, old religious offices, company groups), chapter 1 section 6.3 (outside Seoul is the machines' rim, and no one rules it).

### 7.1 Former lords

Bible section 6 records "91 outside lords". In the current data an old lord carries one of two markers: the 92 people whose 050 rank is 영주 or 해상 영주, and the 86 people whose 090 titles, holdings or political identities carry an administrative code outside Seoul (a code not starting with 11). Together they are 105 people (Government 50, Free City 28, Arc 24, independent 3). The Bible's 91 lie inside this set. v3 picks the targets by these markers, not by a count (provisional T08-24).

These 105 people are re-placed as follows (provisional T08-25).

1. Their faction stays (section 3). The word lord, the names of land outside Seoul and codes outside Seoul are all removed. No one rules outside Seoul (chapter 1 section 6.3).
2. Former lords are the second group of P in section 4.7, so they are seated first in district and dong seats. This carries the recommended default of Bible Q18 (remove the "lord of ○○" wording and re-place them under titles inside Seoul) onto the v3 ladder.
3. If the old record has only land outside Seoul and no anchor inside Seoul, the location comes from section 4.6 step 4 (quota).
4. The biography does not say that the person ruled outside Seoul. That person has lived in the stations of Seoul from the start.

### 7.2 Old heads of state and the named exceptions

The old head words are these old ranks: 군주, 위원장, 의장, 사령관, 회장, 사장, 장관, 원장, 단장, 방장, 대통령, 공작, 구역장, 수석 신도, 국장, 본부장, 상임이사, 이사, 전무, 감사, 당직장, 부장, 지부장. People with one of these words are the first group of P in section 4.7.

The people of Bible section 6 and the old heads of state are placed in the seats below. While the question in the "Q" column waits for the owner's answer, the seat is that question's recommended default. If the owner answers otherwise, the answer wins.

| id | Name (age) | Faction | v3 seat | Title (`title_ko`) | Rank | Occupation | Location | Q | Provisional |
|---|---|---|---|---|---|---|---|---|---|
| person-1018 | Go Ye-jin (38) | Arc | Hierophant (T1) | 교주 | 교주 | 신앙 통솔 | Suseo | office [Approved], home city Q6 | location T08-26 |
| person-0998 | I Ilseop (34) | Free City | Gwanak head (T1) | 관악 공작 | 공작 | 도시 운영 | Sillim | duke [Approved], position wording Q19 | location T08-27 |
| person-0145 | Yun Seo-rin (27) | Government | President for Life (T1) | 종신 대통령 | 대통령 | 국정 총괄 | Gwanghwamun | Q28 | T08-28 |
| person-1017 | Ji Yeon-hui (26) | Arc | the Hierophant's bodyguard (T5) | 교주의 경호원 | 신도 | 경호 | Suseo | bodyguard [Approved], affiliation Q5 | T08-3 |
| person-1009 | Sin Jong-mok (39) | Government | return network field contractor (T5) | 귀환망 현장 계약자 | 등재민 | 무전 중계 | works Suseo, sleeps Seonjeongneung | title, Gangnam residence, Nonhyeon 2-dong, Baekya [Approved], affiliation Q30 | T08-29 |
| person-1010 | Sin Jun (12) | Government | Sin Jong-mok's son (T5) | empty (Q8) | 등재민 | 교육 | Seonjeongneung | Q8 | T08-30 |
| person-1003 | Jo Jaepyo (37) | Unaffiliated | leader of the return party (T5) | 귀환 일행 지휘자 | 미등록 | 귀환 탐사 | Dongjak | Q20 | T08-4 |
| person-0457 | Cha Yewon (28) | Free City | a records worker of Gwanak (T5) | 복구복무 기록관 | 숙련공 | 계약서 기록 | Sillim | Q21 | T08-31 |
| person-0086 | Im Hajun (54) | Arc | a member of the Gangnam Near House, missing (T2) | 펌프기술 총관 | 곁집원 | 펌프 정비 | Gangnam-gu Office | Q22 | T08-32 |
| person-0088 | O Gyeongjae (22) | Arc | Head of the Gangnam Near House (T1) | 강남 곁집장 | 곁집장 | 곁집 통솔 | Gangnam-gu Office | Q23 | T08-33 |
| person-0374 | Nam Yun-gyeong (35) | Arc | an office close to the Hierophant (T2) | 수석 신도 | 세례자 | 신앙 통솔 | Jamsil | Q24 | T08-34 |
| person-0399 | Jeong Yura (36) | Arc | Head of the Songpa Near House (T1) | 송파 곁집장 | 곁집장 | 곁집 통솔 | works Garak Market, sleeps Gosok Terminal | Q25 | T08-35 |
| person-0246 | Baek On (24) | Government | register copyist (T5) | 명부 필사관 | 서기 | 명부 필사 | Gwanghwamun | Q26 | T08-36 |
| person-0323 | Ryu Eunbi (56) | Government | head of the medical corps (T2) | 의료단 단장 | 전문의 | 진료 | Cheongnyangni | Q27 | T08-37 |
| person-0195 | Oh Hae-rin (48) | Government | Director of the National Intelligence Service (T2) | 원장 | 원장 | 정보 수집 | Gwanghwamun | Q7 | T08-38 |
| person-1005 | Jeong Seoon (36) | Arc | Head of the Seocho Near House (T1) | 서초 곁집장 | 곁집장 | 곁집 통솔 | Gosok Terminal | Q29 | T08-39 |
| person-0116 | Bae Ujin (43) | Arc | Head of the Gangdong Near House (T1) | 강동 곁집장 | 곁집장 | 곁집 통솔 | Cheonho | Q29 | T08-40 |
| person-0272 | Yi Hong-won (59) | Arc | elder of the Gangnam Near House (T2) | 강남 곁집 원로 | 곁집원 | 곁집 통솔 | Gangnam-gu Office | Q29 | T08-41 |
| person-0001 | Han Jae-mok (57) | Free City | Yeongdeungpo head (T1) | 영등포 장주 | 장주 | 도시 운영 | Dangsan | Q29 | T08-42 |
| person-0029 | Gang Minseo (60) | Free City | Guro head (T1) | 구로 공장장 | 공장장 | 도시 운영 | Sindorim | Q29 | T08-43 |
| person-0220 | Choe Ji-u (27) | Free City | the Yeongdeungpo Market Master's deputy for the Yeouido market (T2) | 여의도 장터 대리 | 작업대주 | 장터 거래 | Yeouido | Q29 | T08-44 |
| person-0349 | Go Seojun (27) | Government | Member of the National Assembly for Gwangjin-gu (T1) | 광진구 국회의원 | 국회의원 | 구 행정 | Geondae-ipgu | Q29 | T08-45 |
| person-1008 | Min Ung-gi (32) | Free City | Station Foreman of Cheonwang (T4) | 천왕역 역반장 | 역반장 | 역반 운영 | Cheonwang | Q29 | T08-2 |
| person-0297 | Jang Sehwa (28) | Government | Member of the National Assembly for Jungnang-gu (T1) | 중랑구 국회의원 | 국회의원 | 구 행정 | Sangbong | former company head (chapter 1 section 10) | T08-46 |
| person-1007 | Kim Yeongyu (30) | Government | Member of the National Assembly for Jongno-gu (T1) | 종로구 국회의원 | 국회의원 | 구 행정 | Jongno 3-ga | former minister | T08-47 |
| person-0170 | Bak Tae-gyeom (55) | Government | Member of the National Assembly for Yongsan-gu (T1) | 용산구 국회의원 | 국회의원 | 구 행정 | Samgakji | former Government stationmaster | T08-48 |
| person-1021 | Cha Yu-seon (50) | Unaffiliated | joint mandated negotiator (T5) | 공동 위임 교섭자 | 미등록 | 계약 교섭 | Yeongdeungpo | | T08-5 |
| person-1004 | I Yeon (25) | Unaffiliated | Jo Jaepyo's attending messenger (T5) | 수행 전령 | 미등록 | 전령 | Dongjak | | T08-4 |
| person-0035, 0038, 0039 | Jang Useok (55), Heo Daon (50), Gu Chansol (40) | Free City | workers of the Cheonwang station crew (T5) | standards recorder, wheel fitter, tool market trader | 숙련공 | 계약서 기록, 차량 정비, 부품 거래 | Cheonwang, Cheonwang, Guro | | T08-1 |

- Go Ye-jin's location, Suseo, is the place of the first scene of chapter 1, and it fits the proposal of Q11 (an offering hall under the old Suseo depot). The offering hall is not written in public prose until Q11 is approved. Until Q6 is answered, her biography says only "grew up in a Free City".
- Sin Jun keeps an empty title and position, as Q8 says. The occupation "교육" (schooling) is there because the stat calculation (section 8) needs a class.
- Im Hajun is missing. His biography rewrites in v3 words the old record's fact that he "disappeared in the winter of 2125". O Gyeongjae took over the work of the Gangnam Near House (as the family-tree node records).
- Choe Ji-u and Yi Hong-won follow Q29's recommended default ("candidate holder of the duchy of their base district"), but since that district's seat is already filled, they go to T2 of the same district. When the owner answers Q29 they are placed again.

### 7.3 Default district seat table

District seats not decided in section 7.2 are filled by the rule of section 4.7 step 3. The result is below. If chapters 04-06 name someone else, chapters 04-06 win (provisional T08-49).

| Faction | District | Person (age) | Title | How decided |
|---|---|---|---|---|
| Government | Jongno-gu | Kim Yeongyu (30) | 종로구 국회의원 | section 7.2 |
| Government | Jung-gu | Seol Dahin (43) | 중구 국회의원 | rule (old head, anchor Seoul Station) |
| Government | Yongsan-gu | Bak Tae-gyeom (55) | 용산구 국회의원 | section 7.2 |
| Government | Seongdong-gu | Alexander Miller (67) | 성동구 국회의원 | rule (old head, no anchor) |
| Government | Gwangjin-gu | Go Seojun (27) | 광진구 국회의원 | section 7.2 |
| Government | Dongdaemun-gu | Na Bomgyeol (33) | 동대문구 국회의원 | rule (old head, no anchor) |
| Government | Jungnang-gu | Jang Sehwa (28) | 중랑구 국회의원 | section 7.2 |
| Government | Seongbuk-gu | Yun Ji-yul (62) | 성북구 국회의원 | rule (former lord) |
| Government | Seodaemun-gu | O Seo-yul (59) | 서대문구 국회의원 | rule (former lord) |
| Government | Eunpyeong-gu | Gang Ye-jun (56) | 은평구 국회의원 | rule (former lord) |
| Government | Gangbuk-gu | Seo Ra-on (46) | 강북구 국회의원 | rule (former lord) |
| Government | Dobong-gu | Jo Ha-rin (31) | 도봉구 국회의원 | rule (former lord) |
| Government | Nowon-gu | Bak Seong-su (31) | 노원구 국회의원 | rule (former lord, anchor Nowon-gu) |
| Government | Mapo-gu | Bongyong (43) | 마포구 국회의원 | rule (former lord, anchor Mapo-gu) |
| Free City | Gwanak-gu | I Ilseop (34) | 관악 공작 | [Approved] |
| Free City | Yeongdeungpo-gu | Han Jae-mok (57) | 영등포 장주 | section 7.2 |
| Free City | Guro-gu | Gang Minseo (60) | 구로 공장장 | section 7.2 |
| Free City | Yangcheon-gu | I Seo-dam (58) | 양천 기지장 | former Yangcheon representative, anchor Yangcheon-gu |
| Free City | Geumcheon-gu | I Gangmuk (42) | 금천 경계장 | former Geumcheon guard captain, anchor Geumcheon-gu |
| Free City | Dongjak-gu | Ryu Donghyeon (43) | 동작 나루지기 | former lord of Dongjak, anchor Dongjak-gu |
| Free City | Gangseo-gu | Pyo Yedam (43) | 강서 바람지기 | rule (old head, anchor outside the faction) |
| Arc | Gangnam-gu | O Gyeongjae (22) | 강남 곁집장 | section 7.2 |
| Arc | Seocho-gu | Jeong Seoon (36) | 서초 곁집장 | section 7.2 |
| Arc | Songpa-gu | Jeong Yura (36) | 송파 곁집장 | section 7.2 |
| Arc | Gangdong-gu | Bae Ujin (43) | 강동 곁집장 | section 7.2 |

With the President for Life Yun Seo-rin (Gwanghwamun) and the Hierophant Go Ye-jin (Suseo), T1 is 27 people. Yun Seo-rin was the Member for Jongno-gu and was then acclaimed. Since there is no heir of Yun Seo-rin's house in the people set, the Jongno-gu seat is taken to have gone by election to Kim Yeongyu, a rare case where the handing-down broke (section 4.1). The biographies of both reflect this (provisional T08-50).

### 7.4 The return network

Chapter 1 section 10 did not retire the return network but handed it to this chapter (provisional T02-92). Bible section 6 approved Sin Jong-mok's title "return network field contractor", his residence in Gangnam, Nonhyeon 2-dong, and his call sign Baekya (linking Seonjeongneung and Suseo).

In v3 the **return network** is the line that receives people who cross the machines' rim and come back (provisional T08-51).

- The rim can be crossed only in the 2-4 days when a blizzard blinds the machines (chapter 1 section 6.3). Those who come back bring the power cores or parts of broken machines, and they live only if they reach a station inside the rim before the blizzard lifts.
- The return network is a chain of radio and shelter that waits for them. A few stations at the edge of Seoul have people keeping the radio and a warmed place, and in a blizzard they tell each other which way someone is coming back.
- The Government pays for it by contract. The ledger wants the power cores and wants to record who came back. But the network's work happens south of the river too, so the field work is done on land off the ledger as well. That is why Sin Jong-mok, a Government man, lives in Gangnam. Baekya is his radio call sign, and he carries the relay between Seonjeongneung and Suseo.
- The parties that cross the rim (Jo Jaepyo, I Yeon) are the people the return network waits for. They cross under contract and on return receive a share of what they bring. The moment they cross they are struck off the Government ledger, so they are unaffiliated (section 3.2).

## 8. Stats

Basis: Bible section 1 row 10, section 8, section 9.2 Q17 (calculated by occupation, position and tier rules), `scripts/pages/ck3-stats.mjs` (`OCCUPATION_CLASSES` line 37, `CLASS_BASE` line 47, `RANK_MODIFIER` line 57, `deriveTableStats` line 201), `docs/ck3-stat-rule.md`.

### 8.1 Rule

1. The six stats of all 1,022 people are recomputed from their v3 occupation and rank. The stats of the old detailed records were tied to the old roles and are not used (plan task 8).
2. The calculation is `deriveTableStats(personId, occupation_ko, rank_ko)` as it is. Read the section 8.3 table from the top against the occupation phrase, take the class of the first matching word, add the section 8.5 rank modifier to the section 8.4 class base, and clamp to 1-20. `effective` equals `base`.
3. Trait effects (`traits[].effects`) are all empty arrays, so `effective = base` always holds.
4. 090 `sourceStatus` becomes `ck3-table-derived` for all 1,022 people. Then `node scripts/pages/ck3-stats.mjs --dry-run` recomputes the stored values of all 1,022 people from the table and compares them (`E_DERIVED_DRIFT`).
5. No occupation phrase outside the section 8.2 list is used, and no rank outside the section 8.5 list. Outside the lists the tool fails with `E_UNKNOWN_OCCUPATION` or `E_UNKNOWN_RANK`.

(provisional T08-52)

### 8.2 v3 occupation list

Occupation phrases (`occupation_ko`) are chosen from this list only, one phrase per person. Stacked phrases like the old data's "main ○○ / secondary ○○" are not used. "Person name" is the title of a person without a seat (section 4.4). In the faction column G is the Government, F the Free Cities, A the Arc and I unaffiliated (provisional T08-53).

| Class | `occupation_ko` | `occupation` | Person name (ko / en) | Factions |
|---|---|---|---|---|
| governance | 국정 총괄 | Affairs of state | 종신 대통령 / President for Life | G |
| governance | 구 행정 | District administration | 국회의원 / Member of the National Assembly | G |
| governance | 부처 행정 | Ministry administration | 장관 / Minister | G |
| governance | 동 행정 | Dong administration | 동장 / Dong Chief | G |
| governance | 역 행정 | Station administration | 역장 / Stationmaster | G |
| governance | 도시 운영 | City governance | 도시의 우두머리 칭호 / the city's head title | F |
| governance | 구간 운영 | Section running | 구간장 / Section Chief | F |
| governance | 역반 운영 | Station crew running | 역반장 / Station Foreman | F |
| governance | 신앙 통솔 | Leading the faith | 교주, 수석 신도 / Hierophant, First Believer | A |
| governance | 곁집 통솔 | Leading a Near House | 곁집장, 곁집 원로 / Head of the Near House, Near House elder | A |
| governance | 대피소 통솔 | Leading a shelter | 대피소장 / Shelter Head | A |
| governance | 정비대 통솔 | Leading a bench | 정비장 / Bench Keeper | A |
| soldier | 징집 보병 | Levy infantry | 징집병 / Levy soldier | G |
| soldier | 계약 보병 | Contract infantry | 계약병 / Contract soldier | F |
| soldier | 세례 전투 | Baptised fighting | 세례 전사 / Baptised warrior | A |
| soldier | 소총 사격 | Rifle shooting | 소총수 / Rifleman | GFA |
| soldier | 포병 | Artillery | 포수 / Gunner | G |
| soldier | 드론 조종 | Drone piloting | 드론 조종수 / Drone pilot | GF |
| soldier | 지휘 참모 | Staff officer | 참모 / Staff officer | GFA |
| guard | 출입구 경비 | Entrance guard | 출입구 경비원 / Entrance guard | GFA |
| guard | 검문소 경비 | Checkpoint guard | 검문소 경비원 / Checkpoint guard | G |
| guard | 순찰 | Patrol | 순찰대원 / Patroller | GFA |
| guard | 경호 | Bodyguard | 경호원 / Bodyguard | GFA |
| medical | 진료 | Medical care | 의사 / Doctor | GFA |
| medical | 응급 처치 | Emergency care | 구호원 / Medic | GFA |
| medical | 약품 관리 | Medicine keeping | 약품 관리인 / Medicine keeper | GFA |
| fitting | 이식 정비 | Implant maintenance | 이식 정비공 / Implant fitter | AF |
| fitting | 세례 집도 | Baptism fitting | 세례 집도자 / Baptism fitter | A |
| fitting | 충전 관리 | Charging upkeep | 충전 관리인 / Charge keeper | A |
| provision | 섬유당 통 관리 | Fibre-sugar vats | 섬유당 통지기 / Vat keeper | GFA |
| provision | 빛밭 경작 | Light-field farming | 빛밭 농부 / Light-field farmer | GFA |
| provision | 버섯 재배 | Mushroom growing | 버섯 재배인 / Mushroom grower | GFA |
| provision | 벌레 치기 | Insect rearing | 벌레치기 / Insect keeper | GFA |
| provision | 얼음 어로 | Ice fishing | 얼음 어부 / Ice fisher | GFA |
| provision | 싹 기르기 | Sprouting | 싹 기르는 이 / Sprout grower | GFA |
| provision | 부엌 취사 | Kitchen cooking | 취사원 / Cook | GFA |
| labour | 눈 굴 지기 | Snow-shaft keeping | 눈 굴 지기 / Shaft keeper | GFA |
| labour | 제설 | Snow clearing | 제설꾼 / Snow clearer | GFA |
| labour | 땔감 벌목 | Firewood felling | 나무꾼 / Woodcutter | GF |
| labour | 화덕 지기 | Hearth keeping | 화덕 지기 / Hearth keeper | GFA |
| labour | 메탄 통 지기 | Methane vat keeping | 메탄 통지기 / Methane keeper | GFA |
| labour | 짐꾼 | Porter | 짐꾼 / Porter | GFA |
| labour | 옷 짓기 | Clothes making | 옷 짓는 이 / Clothier | GFA |
| trade | 배급 집행 | Ration issuing | 배급 서기 / Ration clerk | G |
| trade | 장터 거래 | Market trading | 장터 상인 / Market trader | GFA |
| trade | 부품 거래 | Parts trading | 부품 상인 / Parts dealer | FA |
| trade | 계약 교섭 | Contract negotiation | 교섭인 / Negotiator | GFAI |
| trade | 물자 계량 | Goods weighing | 계량인 / Weigher | GFA |
| trade | 급수 배분 | Water allotment | 급수 배분인 / Water allotter | GFA |
| courier | 전령 | Messenger | 전령 / Messenger | GFAI |
| courier | 짐 호송 | Cargo escort | 호송원 / Escort | GFA |
| courier | 열차 배차 | Train dispatch | 배차원 / Dispatcher | GFA |
| courier | 수레 운전 | Cart driving | 수레꾼 / Carter | GFA |
| courier | 나루 건넘 안내 | River crossing guide | 나루 안내인 / Crossing guide | GF |
| courier | 무전 중계 | Radio relay | 무전수 / Radio operator | GFA |
| maintenance | 펌프 정비 | Pump maintenance | 펌프 정비공 / Pump fitter | GFA |
| maintenance | 바람틀 정비 | Windmill maintenance | 바람틀 정비공 / Windmill fitter | GF |
| maintenance | 열 펌프 정비 | Heat-pump maintenance | 열 펌프 정비공 / Heat-pump fitter | GFA |
| maintenance | 수차 정비 | Water-wheel maintenance | 수차 정비공 / Wheel fitter | FA |
| maintenance | 우물 정비 | Well maintenance | 우물 정비공 / Well fitter | GFA |
| maintenance | 전선 정비 | Line maintenance | 전선 정비공 / Lineman | GFA |
| maintenance | 부품 가공 | Parts machining | 부품 가공공 / Machinist | FA |
| maintenance | 차량 정비 | Vehicle maintenance | 차량 정비공 / Vehicle fitter | GFA |
| maintenance | 통신 정비 | Radio maintenance | 통신 정비공 / Radio fitter | GFA |
| maintenance | 공구 제작 | Tool making | 공구 장인 / Toolmaker | F |
| scout | 고물 채집 | Salvage gathering | 고물 채집꾼 / Salvager | GFA |
| scout | 섬유 채집 | Fibre gathering | 섬유 채집꾼 / Fibre gatherer | GFA |
| scout | 테두리 정찰 | Edge watch | 테두리 정찰병 / Edge watcher | GFA |
| scout | 탐사 | Survey | 탐사원 / Surveyor | GFA |
| scout | 정보 수집 | Intelligence gathering | 정보원 / Intelligence agent | GFA |
| scout | 귀환 탐사 | Return crossing | 귀환 일행 / Return crosser | I |
| record | 장부 기재 | Ledger entry | 장부 서기 / Ledger clerk | G |
| record | 명부 필사 | Register copying | 명부 필사관 / Register copyist | G |
| record | 공문 필사 | Document copying | 공문 필사관 / Document copyist | G |
| record | 계약서 기록 | Contract records | 계약 기록공 / Contract recorder | F |
| record | 세례 명단 기록 | Baptism roll keeping | 명단지기 / Roll keeper | A |
| record | 교육 | Schooling and teaching | 교사, 배우는 아이 / Teacher, pupil | GFA |

The Government has no `fitting` for the same reason as its gap in section 12.3 (ledger people of the Government do not take baptism). The Free Cities' `이식 정비` (implant maintenance) is a skill left over from before the split (chapter 1 section 7.3).

### 8.3 `OCCUPATION_CLASSES` (v3)

Task 26 replaces the table at line 37 of `scripts/pages/ck3-stats.mjs` with this one. The order is part of the rule. While writing this chapter it was checked that every one of the 77 phrases of section 8.2 first-matches its intended class (provisional T08-54).

```js
export const OCCUPATION_CLASSES = [
  ['governance', ['국정', '행정', '운영', '통솔']],
  ['soldier', ['보병', '사격', '포병', '드론 조종', '전투', '참모']],
  ['guard', ['경비', '순찰', '경호']],
  ['medical', ['진료', '응급', '약품']],
  ['fitting', ['이식', '세례 집도', '충전']],
  ['provision', ['섬유당', '빛밭', '버섯', '벌레', '어로', '싹', '부엌']],
  ['labour', ['눈 굴', '제설', '땔감', '화덕', '메탄', '짐꾼', '옷 짓기']],
  ['trade', ['배급', '거래', '교섭', '계량', '물자', '배분']],
  ['courier', ['전령', '호송', '배차', '운전', '건넘', '무전']],
  ['maintenance', ['정비', '펌프', '수차', '부품', '제작', '가공']],
  ['scout', ['채집', '정찰', '탐사', '정보']],
  ['record', ['장부', '필사', '기록', '교육']],
];
```

### 8.4 `CLASS_BASE` (v3)

The values of the seven old classes (guard, medical, trade, courier, maintenance, scout, record) stay as they are, and five new classes are added (provisional T08-55).

```js
export const CLASS_BASE = {
  governance: { diplomacy: 9, martial: 5, stewardship: 9, intrigue: 7, learning: 6, prowess: 4 },
  soldier: { diplomacy: 4, martial: 9, stewardship: 4, intrigue: 5, learning: 4, prowess: 10 },
  guard: { diplomacy: 5, martial: 8, stewardship: 6, intrigue: 6, learning: 5, prowess: 8 },
  medical: { diplomacy: 6, martial: 3, stewardship: 6, intrigue: 7, learning: 10, prowess: 3 },
  fitting: { diplomacy: 6, martial: 3, stewardship: 7, intrigue: 6, learning: 10, prowess: 4 },
  provision: { diplomacy: 5, martial: 3, stewardship: 9, intrigue: 5, learning: 6, prowess: 5 },
  labour: { diplomacy: 5, martial: 5, stewardship: 6, intrigue: 4, learning: 4, prowess: 8 },
  trade: { diplomacy: 8, martial: 4, stewardship: 9, intrigue: 6, learning: 5, prowess: 3 },
  courier: { diplomacy: 8, martial: 5, stewardship: 6, intrigue: 6, learning: 5, prowess: 5 },
  maintenance: { diplomacy: 5, martial: 5, stewardship: 10, intrigue: 7, learning: 7, prowess: 4 },
  scout: { diplomacy: 5, martial: 7, stewardship: 5, intrigue: 9, learning: 6, prowess: 6 },
  record: { diplomacy: 6, martial: 3, stewardship: 10, intrigue: 7, learning: 8, prowess: 3 },
};
```

For every combination of class and rank the values fall within 3-12. That fits the old guidance (`site/people.mjs`) that a base of 10 is a skilled person.

### 8.5 Rank list and `RANK_MODIFIER` (v3)

Ranks (`rank_ko`) are chosen from this list only. The 56 old rank words (군주, 영주, 조합원, 교도, 행자, 교우 and so on) are not used in v3 (provisional T08-56).

| `rank_ko` | `rank` | Faction | Layer | Modifier |
|---|---|---|---|---|
| 대통령 | President | G | T1 | Diplomacy +2, Intrigue +1 |
| 국회의원 | Assembly Member | G | T1 | Diplomacy +1, Stewardship +1 |
| 장관 | Minister | G | T2 | Stewardship +2 |
| 원장 | Director | G | T2 | Intrigue +2 |
| 동장 | Dong Chief | G | T3 | Stewardship +1 |
| 역장 | Stationmaster | G | T4 | Stewardship +1 |
| 서기관 | Senior Secretary | G | T2-T5 | Stewardship +1, Learning +1 |
| 사무관 | Deputy Director | G | T2-T5 | Stewardship +1 |
| 주사 | Officer | G | T5 | Stewardship +1 |
| 서기 | Clerk | G | T5 | Learning +1 |
| 등재민 | Registered resident | G | T5 | none |
| 전문의 | Specialist | G | T2-T5 | Learning +2 |
| 수련의 | Resident doctor | G | T5 | Learning +1 |
| 교사 | Teacher | G | T5 | Learning +1 |
| 대령 | Colonel | G | T2 | Martial +2 |
| 대위 | Captain | G | T5 | Martial +1, Prowess +1 |
| 하사 | Sergeant | G | T5 | Martial +1 |
| 병장 | Private | G | T5 | Martial +1 |
| 공작 | Duke | F (Gwanak) | T1 | Diplomacy +1, Stewardship +1 |
| 나루지기 | Ferry Keeper | F (Dongjak) | T1 | Diplomacy +1, Martial +1 |
| 장주 | Market Master | F (Yeongdeungpo) | T1 | Diplomacy +2 |
| 공장장 | Works Master | F (Guro) | T1 | Stewardship +1, Learning +1 |
| 경계장 | Edge Warden | F (Geumcheon) | T1 | Martial +1, Intrigue +1 |
| 기지장 | Depot Master | F (Yangcheon) | T1 | Stewardship +2 |
| 바람지기 | Wind Keeper | F (Gangseo) | T1 | Stewardship +1, Learning +1 |
| 구간장 | Section Chief | F | T3 | Stewardship +1 |
| 역반장 | Station Foreman | F | T4 | Stewardship +1 |
| 작업대주 | Bench Owner | F | T2-T5 | Stewardship +1, Learning +1 |
| 숙련공 | Skilled Hand | F | T5 | Learning +1 |
| 일손 | Hand | F | T5 | none |
| 견습공 | Apprentice | F | T5 | none |
| 계약대장 | Company Captain | F | T2 | Martial +1, Diplomacy +1 |
| 계약병 | Contract Soldier | F | T5 | Martial +1 |
| 교주 | Hierophant | A | T1 | Diplomacy +1, Learning +2 |
| 곁집장 | Head of the Near House | A | T1 | Diplomacy +1, Intrigue +1 |
| 대피소장 | Shelter Head | A | T3 | Stewardship +1 |
| 정비장 | Bench Keeper | A | T4 | Stewardship +1, Learning +1 |
| 곁집원 | Near House member | A | T2, T5 | Intrigue +1 |
| 정비공 | Fitter | A | T5 | Learning +1 |
| 세례자 | Baptised | A | T2, T5 | Prowess +1 |
| 신도 | Believer | A | T5 | none |
| 전사장 | Warrior Captain | A | T2, T5 | Martial +1, Prowess +1 |
| 후계 | Heir | GFA | T2 | Diplomacy +1 |
| 미등록 | Unregistered | I | T5 | none |

```js
export const RANK_MODIFIER = {
  '대통령': { diplomacy: 2, intrigue: 1 }, '국회의원': { diplomacy: 1, stewardship: 1 }, '장관': { stewardship: 2 },
  '원장': { intrigue: 2 }, '동장': { stewardship: 1 }, '역장': { stewardship: 1 }, '서기관': { stewardship: 1, learning: 1 },
  '사무관': { stewardship: 1 }, '주사': { stewardship: 1 }, '서기': { learning: 1 }, '등재민': {},
  '전문의': { learning: 2 }, '수련의': { learning: 1 }, '교사': { learning: 1 }, '대령': { martial: 2 },
  '대위': { martial: 1, prowess: 1 }, '하사': { martial: 1 }, '병장': { martial: 1 },
  '공작': { diplomacy: 1, stewardship: 1 }, '나루지기': { diplomacy: 1, martial: 1 }, '장주': { diplomacy: 2 },
  '공장장': { stewardship: 1, learning: 1 }, '경계장': { martial: 1, intrigue: 1 }, '기지장': { stewardship: 2 },
  '바람지기': { stewardship: 1, learning: 1 }, '구간장': { stewardship: 1 }, '역반장': { stewardship: 1 },
  '작업대주': { stewardship: 1, learning: 1 }, '숙련공': { learning: 1 }, '일손': {}, '견습공': {},
  '계약대장': { martial: 1, diplomacy: 1 }, '계약병': { martial: 1 },
  '교주': { diplomacy: 1, learning: 2 }, '곁집장': { diplomacy: 1, intrigue: 1 }, '대피소장': { stewardship: 1 },
  '정비장': { stewardship: 1, learning: 1 }, '곁집원': { intrigue: 1 }, '정비공': { learning: 1 }, '세례자': { prowess: 1 },
  '신도': {}, '전사장': { martial: 1, prowess: 1 },
  '후계': { diplomacy: 1 }, '미등록': {},
};
```

**Default rank table.** In section 4.7 step 8 the rank is set as follows (provisional T08-57).

| Faction | Seat holders | T2 | T5 |
|---|---|---|---|
| Government | T1 국회의원 (the President: 대통령), T3 동장, T4 역장 | `governance` 장관, head of a national agency 원장, house heir 후계, `soldier` 대령, `medical` 전문의, the rest 서기관 | `soldier`: aged 18-24 병장, 25-34 하사, 35 and over 대위. `medical`: under 33 수련의, older 전문의. `record`: under 30 서기, 30-44 주사, 45 and over 사무관. Occupation 교육 and aged 22 or over: 교사. The rest 등재민 |
| Free Cities | T1 the city's title, T3 구간장, T4 역반장 | house heir 후계, `soldier` 계약대장, the rest 작업대주 | `soldier` 계약병. Others: under 20 견습공, 20-29 일손, 30 and over 숙련공. `maintenance` and `fitting` aged 45 or over: 작업대주 |
| Arc | T1 곁집장 (the Hierophant: 교주), T3 대피소장, T4 정비장 | Near House people 곁집원, house heir 후계, `soldier` 전사장 | `fitting` 정비공. `soldier`: under 35 세례자, 35 and over 전사장. Others: 세례자 if the part count is 1 or more, 신도 if 0 |
| Unaffiliated | | | 미등록 |

**Part count in the Arc.** If chapter 06 sets a ladder of part counts, that is followed. Until then the defaults are these. The Hierophant's is not made public (no value). Head of the Near House 3, Warrior Captain 4, Shelter Head and Bench Keeper 2, baptised `soldier` `2 + (n mod 3)`, fitters `1 + (n mod 2)`, other baptised `1 + (n mod 2)`, believers and Near House members 0, where `n` is the number in the id. People outside the Arc have 0, except that a Free City person doing `이식 정비` (implant maintenance) may have 1 (provisional T08-58).

### 8.6 How to add new words

If chapters 04-06 or task 9 use a new occupation or rank, it is added as follows.

- **Occupation.** If the new phrase first-matches its intended class in the section 8.3 table, just add a row to the section 8.2 list. If it does not, add a word to that class in the table, checking that the first match of the existing 77 phrases does not change.
- **Rank.** Give one modifier (+1) or two (+1 and +1, or +2 on one stat) by the nature of the rank's work: governing is Stewardship or Diplomacy, fighting is Martial or Prowess, knowledge is Learning, watching and intelligence is Intrigue. Also add its minimum age and age band to the section 5.1 table.

## 9. People input files

Basis: plan tasks 17-19 (input files) and 26 (application), `data/sql/000-schema.sql`, `scripts/pages/v3-fixed-facts.mjs`.

### 9.1 Files

- Paths: `docs/drafts/people/government.jsonl` (the 504 of the Government and the 3 unaffiliated), `docs/drafts/people/free-city.jsonl` (194), `docs/drafts/people/arc.jsonl` (321).
- One JSON object per line, UTF-8, LF line endings, in id order. Each id appears exactly once across the three files.
- An object has only the keys of section 9.2. Fixed facts (name, sex, recorded age, clan, family) are not written. Task 26's editor rejects a line that contains a fixed key.

### 9.2 Schema

In "Required", Y means everyone, K means Key and S1 only, C means only people who meet the condition. "Rule" is the section that sets the value.

| Key | Shape | Required | Rule and meaning |
|---|---|---|---|
| `id` | string `person-NNNN` | Y | the 050 id. Only a join key |
| `faction_id` | `government` \| `free-city` \| `arc` \| `independent` | Y | section 3 |
| `seat` | object or `null` | Y | section 4.2. `{"layer":"head"}`, `{"layer":"district","titleId":"geography:duchy:11110"}`, `{"layer":"dong","regionId":"region:1111051500"}`, `{"layer":"station","stationId":"서울역"}`, `{"layer":"office"}` (T2), or `null` with no seat |
| `tier` | `T1`-`T5` | Y | section 4.1. Task 26 checks it against `seat` |
| `stage` | `Key` \| `S1`-`S4` | Y | section 4.3 |
| `title_ko`, `title_en` | string | Y | section 4.4. Empty only for Sin Jun (Q8) |
| `position_ko`, `position_en` | string | Y | section 4.4. Empty only for Sin Jun (Q8) |
| `rank_ko`, `rank_en` | string | Y | section 8.5 list. English is the list's `rank` column |
| `occupation_ko`, `occupation_en` | string | Y | section 8.2 list |
| `location` | `{"workStationId": "...", "homeStationId": "..."}` | Y | section 4.6. Both are `map_station.id` |
| `household` | `{"id": "...", "role": "head" \| "member" \| "single"}` | Y | the three households of section 6.1 use `hh:<head's id>` with head/member; everyone else `hh:<own id>` with single |
| `liege` | `person-NNNN` or `null` | Y | the value set by the liege rule of section 9.4. Task 26 recomputes and compares it |
| `partCount` | integer ≥ 0 or `null` | Y | the Arc part count of section 8.5. 0 outside the Arc, `null` for the Hierophant |
| `age` | integer | C | only the 511 without a recorded age. The section 5.2 value. Task 26 recomputes and compares it |
| `biography_ko`, `biography_en` | string, 2-6 sentences | Y | section 9.3 |
| `kinBasis` | array `[{"dir": "outgoing" \| "incoming", "from": "...", "to": "...", "basis_ko": "...", "basis_en": "..."}]` | C | only the 6 people with a Kinship relation in 090 (0086, 0090, 0399, 1005, 1009, 1010). One per Kinship entry of 090, in the same order. `from`, `to` and `dir` are as in 090; only `basis` is newly written |
| `ties` | array `[{"to": "person-NNNN", "type": "...", "basis_ko": "...", "basis_en": "..."}]` | K | two or more for Key, one or more for S1; may be empty for the rest. `type` is one of Contract, Oath, Master and Disciple, Rivalry, Debt, Grudge, Protective Residence (Korean 계약, 맹세, 스승과 제자, 경쟁, 빚, 원한, 보호체류). Must agree with the between-faction relations of section 11 |
| `traits` | array, at most 2 `[{"id", "name_ko", "name_en", "description_ko", "description_en", "behavior_ko", "behavior_en", "stress_ko", "stress_en", "relationship_ko", "relationship_en"}]` | K | one or more for Key. No effects (section 8.1) |
| `skills` | array, at most 3 `[{"id", "name_ko", "name_en", "rating"}]` | K | one or more for Key. `rating` is 1-100 |
| `portrait` | object | C | only people with a portrait token and no picture (`image.sha256`) (486 people). `{"upper_ko", "lower_en", "footwear_en", "headwear_en", "neckline_en", "accessories_en", "palette": [three colours]}`. Follows the clothing rules of chapters 04-06 |
| `retinue` | object | C | Min Ung-gi (1008) only. Section 9.4 |
| `ledger` | array of strings | Y | ledger numbers of items newly invented about this person; empty array if none |

### 9.3 How to write a biography

- 2-6 sentences, written for that person alone. No template sentences with only the name swapped (plan task 17).
- It must agree with the fixed facts: age (recorded, or the section 5.2 value), sex, clan, family.
- It carries at least one piece of the day that fits the location station, the work and the layer. For Key and S1 it also reflects one relation from `ties`.
- It follows the voices of chapter 1 section 2. A Government person's biography starts from the ledger entry; a Free City person's speaks in numbers and work; an Arc person's speaks in parts and mending.
- It does not use the retired concepts (chapter 1 section 10), old states, old polities, company groups, domains outside Seoul or old religious offices. It does not use the banned vocabulary of Bible section 4 or the comparison words of the left column of chapter 1 section 2.4.
- Korean and English say the same facts in the same order.

### 9.4 What task 26 calculates

The following values are not written in the input files, or, if written, task 26 recomputes and compares them.

| Value | Calculation |
|---|---|
| 050 `tier`, `stage_ko`, `state_id`, `state_name`, `state_name_ko` | sections 4.1, 4.3, 4.5 |
| 090 mirror keys (`title`, `position`, `rank`, `occupation`, `stage`, `state`, `stateName`, `commonTier`) | the 050 values as they are. English `json` takes the English columns, `json_ko` the Korean columns |
| Stats | section 8 |
| The four age values | section 5.2 |
| `minors` | age < 18 |
| Liege (`liege`) | A station seat holder's liege is the seat holder of the dong the station belongs to, or the district head if there is none. A dong seat holder's liege is the district head. A district head's liege is the President for Life in the Government, the Hierophant in the Arc, and none in the Free Cities. A T2 person's liege is the house's seat holder for a house heir; otherwise the President for Life in the Government, the Hierophant in the Arc, and the district head in the Free Cities. T5 defaults to `null`; if the work is serving one person, such as a bodyguard, an attending messenger or a Near House attendant, the liege is that person (a T1-T3 person of the same faction, or Jo Jaepyo). Ji Yeon-hui's liege is Go Ye-jin; I Yeon's is Jo Jaepyo (provisional T08-59) |
| `directLiege`, `court` | built from the liege relation. `court.id` is `court:<characterId or person id>` |
| Command entries of `relations` | for each liege relation, one outgoing entry (on the subordinate) and one incoming entry (on the liege). The basis sentence is "<liege title> <liege name>의 직속" / "Directly under <liege title> <liege name>" (provisional T08-60) |
| Holdings (`confirmedHoldings`, `subordinateHoldings`, 123 `map_holding`) | one per seat. id `holding:v3:<duchy\|dong\|station>:<code>`, names "<구> 공작령" (en "<District> duchy"), "<동>" (en "<Dong>"), "<역>역" (en "<Station> Station"). `holderPersonId` is the `characterId` if there is one, otherwise the person id. `subordinateHoldings` are the holdings of direct subordinates (provisional T08-61) |
| 115 `retainer_graph` | rebuilt as one row from the whole liege relation. Node id is the `characterId` if there is one, otherwise the person id |
| `values` | section 9.5 |
| The `household` object | `personFaith`: `baptised` for Arc people with part count ≥ 1, `believer` for Arc people with 0, `fitted` for people outside the Arc with part count ≥ 1, otherwise `none`. `houseFaith`: the household head's `personFaith`. `humanoidAdmission`: `admitted` if `retinueGroups` has humanoids, otherwise `none` (provisional T08-62) |
| `fields`, `sections` | the v3 shape of section 10.2 |

**Min Ung-gi's retinue.** There is one `retinueGroups` entry: 6 humanoids, whose work is radio relay, carrying loads and maintenance, with technical limits of local radio network, cells and parts. The 24 of the old record do not fit v3, where machines are scarce (Bible section 1 row 5), so the number is reduced (provisional T08-63).

### 9.5 Values calculation

The ten axes of `values` (Authority, Openness, Force, Material, Communal, Principle, Public, Eligibility, Dispersed, Transformative) are calculated as follows. Values are rounded to the nearest 5 and clamped to −100..100. English `json` uses the English axis names, `json_ko` the Korean axis names (권위, 개방, 무력, 물질, 공동, 원칙, 공개, 자격, 분산, 변혁), and the numbers are the same (provisional T08-64).

v3 faction baselines:

| Faction | Authority | Openness | Force | Material | Communal | Principle | Public | Eligibility | Dispersed | Transformative |
|---|---|---|---|---|---|---|---|---|---|---|
| Government | 40 | −30 | 10 | 0 | 20 | 40 | −20 | 30 | −40 | −30 |
| Free Cities | −30 | 20 | −20 | 40 | 0 | 10 | 30 | 40 | 50 | 10 |
| Arc | 30 | −10 | 0 | −30 | 40 | 10 | −40 | 0 | −20 | 40 |
| Unaffiliated | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Old faction means (the 511 detailed records, counted from the current files, rounded):

| Old faction | Authority | Openness | Force | Material | Communal | Principle | Public | Eligibility | Dispersed | Transformative |
|---|---|---|---|---|---|---|---|---|---|---|
| Government | −3 | 24 | −25 | 3 | 15 | 18 | 5 | 15 | 10 | −8 |
| Free City | 3 | 7 | −9 | 25 | 23 | 18 | 31 | 22 | −3 | 1 |
| Arc | 3 | 7 | −11 | 18 | 18 | 19 | 3 | 33 | 12 | −3 |
| Independent | −18 | 23 | −15 | 18 | 29 | 11 | 9 | 33 | 30 | 23 |

- **People who had a detailed record.** New value = old value − old faction mean + v3 faction baseline. The person's leaning (how far they stood from the mean) is kept, and the faction's tilt changes to v3.
- **People who had no age.** New value = v3 faction baseline + occupation-class offset. The offsets are governance Authority +10, soldier Force +15, guard Force +10 and Principle +5, medical Communal +10, fitting Transformative +10, provision Communal +10, labour Communal +5 and Force +5, trade Material +10 and Openness +5, courier Openness +10, maintenance Eligibility +10, scout Openness +5 and Public −5, record Principle +10 and Public +5.
- `desire` is a person's temperament and is not calculated from the role. People who had a detailed record carry their values on unchanged; no desire is made for people who had no age.

## 10. Key disposition table

Basis: README fixed facts, `scripts/pages/v3-fixed-facts.mjs` (list of fixed keys), plan task 8(b) and 26(b). The keys of 090 and of the portrait tokens were taken by walking all 1,022 records and all 511 tokens while writing this chapter (a one-off shell script, not committed). The number in brackets is the number of records that have the key.

- **FIXED**: not changed. Task 26's editor refuses to write it.
- **REDESIGN**: rewritten by the rules of this chapter. "Carried on" means that the rule does not change the value; it does not mean that the value is a fixed fact.
- **DROP**: removed from the v3 record.

The table copies the key names of the old data letter for letter. A few of them (four old title and rank keys, and the partnership axis of desire) contain words that will be added to the banned vocabulary of Bible section 4. These words are only data keys, not words of the world's text, and task 9 exempts the code spans of this table from the banned-vocabulary scan (provisional T08-65).

### 10.1 050 `wiki_person` columns

| Column | Disposition | Rule |
|---|---|---|
| `id` | FIXED | |
| `sort` | FIXED | display order |
| `faction_id` | REDESIGN | base value kept. Only the 8 independents follow section 3.2 |
| `name`, `name_ko` | FIXED | |
| `title`, `title_ko` | REDESIGN | section 4.4 |
| `position`, `position_ko` | REDESIGN | section 4.4 |
| `rank`, `rank_ko` | REDESIGN | section 8.5 |
| `tier` | REDESIGN | section 4.1 |
| `occupation`, `occupation_ko` | REDESIGN | section 8.2 |
| `gender`, `gender_ko` | FIXED | |
| `stage`, `stage_ko` | REDESIGN | section 4.3 |
| `state_id`, `state_name`, `state_name_ko` | REDESIGN | section 4.5 |

### 10.2 090 `person_detail` `json` and `json_ko`

The `clan_id` column is FIXED. The paths below apply equally to `json` and `json_ko`. Where the key names differ between English and Korean (`fields`, `sections`, `values`, `desire`), both names are given.

**Top-level values and mirror keys**

| Path | Disposition | Rule |
|---|---|---|
| `id` (1,022) | FIXED | |
| `name` (1,022), `gender` (1,022) | FIXED | |
| `birthDate`, `birthday`, `age`, `ageAsOf` (511 each) | FIXED | the 511 recorded. Added for the other 511 by section 5.2 |
| `generation` (511) | FIXED | not added |
| `characterId` (511) | FIXED | not added |
| `clan`, `clan.id`, `clan.name`, `clan.crest` (511, 475) | FIXED | not added |
| `detailRoute` (1,022) | FIXED | `/people/<id>` |
| `title`, `position`, `rank`, `occupation`, `stage`, `state`, `stateName`, `commonTier` (1,022 each) | REDESIGN | 050 mirror (section 9.4) |
| `sourceStatus` (1,022) | REDESIGN | `ck3-table-derived` for all 1,022 (section 8.1) |
| `sourceKind` (511) | REDESIGN | `proposal` for all 1,022. All v3 person content is provisional |
| `sourceRoute` (511) | DROP | old document path |
| `locked` (39) | DROP | old editing-lock flag. The site does not read it. The v3 lock is the freeze snapshot |
| `minors` (511) | REDESIGN | age < 18. For all 1,022 |
| `openingDisposition`, `.status`, `.openingYear` (3) | DROP | old "no domain" marker |
| `biography` (511) | REDESIGN | input `biography_ko`/`_en`. For all 1,022 |
| `rightsPermissions` (6) and below it `applicability`, `externalReuseRequiresSeparateSubjectPermission`, `identityBasisRef`, `likenessUse`, `likenessUse.evidenceRef`, `likenessUse.recordedOn`, `likenessUse.status`, `likenessUse.uses[]`, `nameUse`, `nameUse.evidenceRef`, `nameUse.recordedOn`, `nameUse.status`, `nameUse.uses[]` | FIXED | record of permission to use a real person's name and likeness |

**`fields` (511)**: the old object is dropped whole and rewritten in the v3 shape (REDESIGN). The keys of the v3 shape are Korean `소속`, `직함`, `품계`, `생업`, `일하는 역`, `잠자는 역`, `가구`, `부위 수` (Arc only), and English `Affiliation`, `Title`, `Rank`, `Livelihood`, `Work Station`, `Home Station`, `Household`, `Part Count`. Values are copied from 050 and the input. Of the old keys only `Contributor`/`기여자` (3) is FIXED and carried on into the v3 shape (credit to a real contributor). The old keys removed are these (v3 shape provisional T08-66).

- English: `Affiliation` (496), `Appearance` (3), `Armed Access` (11), `Assigned Duties` (37), `Belongings` (1), `Birthplace` (6), `Character ID` (15), `Civil Servant Position and Grade` (6), `Civil and Community Duties` (9), `Community Role` (27), `Community of origin` (15), `Conscription history` (11), `Constitutional Body` (1), `Current Office` (1), `Date of Birth` (11), `Desires` (479), `Desires and Tastes` (2), `Duty` (51), `Existing Residence` (1), `Fear` (15), `Feudal Rank` (5), `Feudal Title` (1), `Gender` (6), `Governing and negotiation style` (6), `Key Relationship` (1), `Key relationships` (6), `Language` (15), `Livelihood` (503), `Livelihood Role` (6), `Name` (16), `Office` (5), `Offices` (1), `Personal Ambition` (14), `Personality` (15), `Player Intervention` (9), `Position and Grade` (37), `Rank` (422), `Relationships` (8), `Residence` (7), `Residence Location` (1), `Residence and Work Location` (4), `Role` (1), `Status` (6), `Style of Governance` (9), `Title` (417), `Triggering Incident` (13), `Values` (481), `Work Location` (86).
- Korean: `가치관` (481), `개인 야망` (14), `거주 위치` (1), `거주·업무 위치` (4), `거주지` (7), `공동체 역할` (27), `공무원 직위·직급` (6), `공포` (15), `관계` (8), `관직` (1), `기존 거주 위치` (1), `담당 업무` (37), `무장 접근` (11), `민간·공동체 직무` (9), `봉건 작위` (1), `봉건 품계` (5), `생년월일` (11), `생업` (503), `생업 역할` (6), `성격` (15), `성명` (16), `성별` (6), `소속` (496), `소지품` (1), `언어` (15), `업무` (24), `업무 위치` (86), `역할` (1), `외형` (3), `욕망` (479), `욕망과 취향` (2), `주요 관계` (6), `지위` (6), `직무` (27), `직위` (5), `직위·직급` (37), `직함` (417), `징집 이력` (11), `촉발 사건` (13), `출생지` (6), `출신 공동체` (15), `캐릭터 ID` (15), `통치 방식` (9), `통치·교섭 방식` (6), `품계` (422), `플레이어 개입` (9), `핵심 관계` (1), `헌법기관` (1), `현재 관직` (1).
- Some of the same names (`소속`, `직함`, `품계`, `생업`, `Affiliation`, `Title`, `Rank`, `Livelihood`) appear again in the v3 shape, but their values are newly written. `생년월일`/`Date of Birth`, `성명`/`Name` and `성별`/`Gender` were copies of fixed facts, so removing them leaves the fixed facts as they are.

**`sections` (511)**: the old object is dropped whole and rewritten in the v3 shape (REDESIGN). The v3 shape is Korean `생애` (the same text as the biography) and `관직` (one sentence: "직함 ○○. 직위 ○○. 품계 ○○. 일하는 역 ○○."), English `Life` and `Offices` (provisional T08-67). The old keys removed are these.

- English: `Ambition` (449), `Anecdote` (479), `Belief` (1), `Body` (2), `Civil Servant Position and Grade` (36), `Contract and Authority` (1), `Courier and Escort` (1), `Duty` (27), `Escort Formation` (2), `Escort and Withdrawal` (1), `Fear` (457), `Functional/Livelihood Role` (5), `Goals` (27), `Houses` (17), `Intervention` (474), `Life` (479), `Livelihood` (1), `Offices` (419), `Relationships` (490), `Training` (2), `Traits` (2).
- Korean: `가문` (17), `개입` (474), `계약과 권한` (1), `공무원 직위·직급` (36), `공포` (457), `관계` (490), `관직` (419), `기능·생업 역할` (5), `목표` (27), `생애` (479), `생업` (1), `신념` (1), `신체` (2), `야망` (449), `업무` (1), `일화` (479), `전령과 호위` (1), `직무` (26), `특성` (2), `호위 대열` (2), `호위와 철수` (1), `훈련` (2).

**Values, desire, household**

| Path | Disposition | Rule |
|---|---|---|
| `values` (511), English `Authority`, `Openness`, `Force`, `Material`, `Communal`, `Principle`, `Public`, `Eligibility`, `Dispersed`, `Transformative`, Korean `권위`, `개방`, `무력`, `물질`, `공동`, `원칙`, `공개`, `자격`, `분산`, `변혁` (511 each) | REDESIGN | section 9.5. For all 1,022 |
| `desire` (511), English `Longing`, `Monopoly`, `Risk`, `Display`, `Sustained`, `Orientation`, `Union`, Korean `갈망`, `독점`, `위험`, `과시`, `지속`, `지향`, `결합` (511 each) | REDESIGN | carried on (section 9.5). Not made for people who had no age |
| `household`, `household.personFaith`, `household.houseFaith`, `household.humanoidAdmission` (511 each) | REDESIGN | section 9.4. For all 1,022 |

**Relations**

| Path | Disposition | Rule |
|---|---|---|
| `relations`, `relations.incoming`, `relations.outgoing` (511 each) | REDESIGN | present for all 1,022 |
| `from`, `type`, `to` of the Kinship entries (8), and their order in the array | FIXED | checked by the freeze check |
| `basis` of the Kinship entries | REDESIGN | input `kinBasis` |
| `from`, `type`, `to`, `basis` of the non-Kinship entries (Contract 924, Command 300, Oath 118, Master and Disciple 90, Rivalry 42, Debt 26, Grudge 22, Protective Residence 2) | DROP | relations tied to the old roles. Command is instead rebuilt from the liege relation (section 9.4), and other relations are newly written through the input `ties` |
| `proseContacts[]` (511) and `basis`, `recipientId`, `recipientName`, `sourceRef`, `sourceRef.anchor`, `sourceRef.path` (28 each) | DROP | contact points from old source documents |
| `court`, `court.id`, `court.members[]`, `court.members[].name`, `court.members[].personId` (14, 27) | REDESIGN | calculated from the liege relation (section 9.4) |
| `directLiege`, `.personId`, `.name`, `.courtId`, `.effectiveYear`, `.ownerTerm`, `.relationKind` (37 or fewer) | REDESIGN | calculated from the liege relation. `effectiveYear` 2126, `ownerTerm` "직속 주군"/"Direct liege", `relationKind` `direct-liege` |
| `retinueGroups[]` (1) and `id`, `name`, `courtId`, `liegePersonId`, `count`, `duties[]`, `personhoodReview`, `technicalLimits[]`, `holdingIds[]`, `formalTitle` | REDESIGN | Min Ung-gi only. Section 9.4 |

**Abilities and body (`characterProfile`)**

| Path | Disposition | Rule |
|---|---|---|
| `characterProfile` (1,022) | REDESIGN | container |
| `characterProfile.abilities` and the `base`, `effective` of `diplomacy`, `martial`, `stewardship`, `intrigue`, `learning`, `prowess` (1,022 each) | REDESIGN | section 8 |
| `characterProfile.narrative` (511) | DROP | the biography replaces it |
| `characterProfile.skills[]` (511) and `id`, `name`, `rating` (684) | REDESIGN | input `skills`. Empty array if none |
| `characterProfile.traits[]` (511) and `id`, `name`, `description`, `behavior`, `stress`, `relationship` (990), `effects[]` (990), `effects[].ability`, `effects[].delta` (6) | REDESIGN | input `traits`. `effects` is always an empty array (section 8.1) |
| `characterProfile.health` (511), `health.status` (511) | REDESIGN | for all 1,022. `status` is `fitted` if the part count is ≥ 1, otherwise `unassessed` |
| `id` of `health.bodyParts[]` (511) (3,066) | REDESIGN | the six regions `left-arm`, `right-arm`, `left-leg`, `right-leg`, `head`, `torso` in this order |
| `health.bodyParts[].function`, `.severity` (3,066) | REDESIGN | as many as the part count, in the order `right-arm`, `left-arm`, `right-leg`, `left-leg`, `torso`, `head`, get `function` `machine`; the rest `null`. Even if the part count is above 6, at most six are shown. `severity` is `null` (provisional T08-68) |
| `health.diseases[]` (511, empty arrays) | REDESIGN | empty array |

**Titles and holdings**

| Path | Disposition | Rule |
|---|---|---|
| `openingTitles[]` (33) and `id`, `name`, `rank`, `holderPersonId`, `stateId`, `basis`, `geographicTitleId`, `jurisdictionRefs[]`, `parentTitleId`, `parentTitle`, `parentTitle.id`, `parentTitle.name`, `parentTitle.holderPersonId` | DROP | the title system of the old polities. v3 seats appear only through `confirmedHoldings` |
| `politicalIdentities[]` (90) and `id`, `kind`, `rank`, `holderPersonId`, `stateId`, `politicalParentTitleId`, `directOwnership`, `personalLieges[]`, `personalLieges[].holdingId`, `personalLieges[].directLiegePersonId` | DROP | old political identities |
| `id`, `name`, `name.ko`, `holderPersonId`, `directLiegePersonId`, `stateId`, `stationRef`, `stationRef.stationId`, `stationRef.stationName`, `adminRefs[]`, `adminRefs[].id`, `adminRefs[].name`, `territorialScale`, `titleId`, `geometrySource`, `formalTitleRank` of `confirmedHoldings[]` (511) | REDESIGN | calculated from the seat (section 9.4). `name` is `{"en": ...}` in `json` and `{"ko": ...}` in `json_ko`. `territorialScale` is `duchy`, `dong` or `station`. `geometrySource` and `formalTitleRank` are `null` |
| `componentRefs[]`, `designation`, `facilityRef` and below it `layerId`, `layerName`, `siteAnchor`, `siteSourcePath`, `sourcePath`, `stationId`, `stationIdentity`, `stationIdentity.district`, `stationIdentity.lat`, `stationIdentity.lon`, `stationName`, `landmarkRef` and below it `landmarkId`, `sourcePath`, `liegeRelationshipKind`, `parentGeography`, `wholeSeoulControl` of `confirmedHoldings[]` | DROP | keys that existed only in the old system |
| `id`, `name`, `name.ko`, `holderName`, `holderPersonId`, `holderRoute`, `directLiegePersonId`, `stateId`, `adminRefs[]`, `adminRefs[].id`, `adminRefs[].name`, `territorialScale`, `titleId`, `geometrySource`, `formalTitleRank` of `subordinateHoldings[]` (31) | REDESIGN | holdings of direct subordinates (section 9.4) |
| `componentRefs[]`, `designation`, `liegeRelationshipKind`, `parentGeography`, `wholeSeoulControl` of `subordinateHoldings[]` | DROP | |

**Keys added to thin records.** The records of the 511 who had no age now hold only `id`, `name`, `title`, `position`, `rank`, `commonTier`, `occupation`, `gender`, `stage`, `state`, `stateName`, `detailRoute`, `sourceStatus` and `characterProfile.abilities`. Task 26 adds the four age values, `sourceKind`, `minors`, `biography`, `sections`, `fields`, `values`, `household`, `relations`, `characterProfile.health`, `characterProfile.skills`, `characterProfile.traits` and, if there is a seat, holdings. It does not add `generation`, `characterId`, `clan` or `desire`.

### 10.3 Portrait tokens `public/portrait-tokens/*.json` (511)

In a token with a picture (the 25 with `image.sha256`), the appearance texts describe a fixed picture, so the appearance and clothing texts are not changed either. This is written as "bound to the picture" (provisional T08-69).

| Path | Disposition | Rule |
|---|---|---|
| `schemaVersion`, `personId`, `characterId`, `name`, `approval`, `variantId` | FIXED | |
| `identity` and below it `characterId`, `name`, `gender`, `age`, `ageAsOf`, `ageCategory`, `ethnicity`, `ethnicity.value`, `ethnicity.status`, `ethnicity.source`, `ethnicity.derived`, `origin`, `origin.value`, `origin.status`, `origin.source`, `origin.derived` | FIXED | fixed facts and values derived from them |
| `facts.gender`, `facts.genderUserLocked` | FIXED | |
| `facts.role` | REDESIGN | v3 `position_ko` |
| `stateId` | REDESIGN | v3 `state_id`. `null` for the unaffiliated |
| `artProposal.face`, `artProposal.hair`, `artProposal.eyes`, `artProposal.skin` | FIXED | identity of face and body |
| `artProposal.description` (16) | REDESIGN | only the role sentence before the first semicolon (;) is replaced with the v3 role sentence (English); the face sentence after it stays |
| `artProposal.outfit`, `artProposal.upper`, `artProposal.lower`, `artProposal.footwear`, `artProposal.accessories`, `artProposal.headwear` (1), `artProposal.palette[]` | REDESIGN | carried on for the 25 bound to the picture. The rest from the input `portrait` (section 9.2) |
| `artProposal.carriedWeapons` | REDESIGN | carried on ("none depicted; no ownership inferred") |
| `artProposal.approvalNote` (17), `artProposal.approvedAppearance`, `artProposal.approvedOutfit`, `artProposal.approvedEquipmentIds[]` (16) | FIXED | approval slots. Only the owner fills them |
| `slots.face` and the `value`, `status`, `source`, `derived` of `description`, `faceShape`, `eyeShape`, `eyeColor`, `eyebrowShape`, `noseShape`, `mouthShape`, `lipColor`, `beardShape` below it | FIXED | checked by the freeze check |
| `slots.hair` and the `value`, `status`, `source`, `derived` of `description`, `color`, `length`, `shape` below it | FIXED | values that, with the face, let you recognise the person |
| `slots.body` and the `value`, `status`, `source`, `derived` of `build`, `height`, `height.unit`, `weight`, `weight.unit`, `skin`, `bustSize` below it | FIXED | identity of the body |
| `slots.outfit` and the `value`, `status`, `source`, `derived` of `upper`, `lower`, `footwear`, `headwear`, `neckline`, `marks` below it | REDESIGN | carried on for the 25 bound to the picture. The rest take the values of the input `portrait`, with `status` `derived-proposal`, `source` `v3-07:clothing` and `derived` `true`. `marks` carries on "none visible" |
| `slots.accessories` and the `value`, `status`, `source`, `derived` of `description`, `color`, `material`, `mounting`, `shape` below it | REDESIGN | same as above. The input `accessories_en` becomes `description.value`, and task 26 carries the other four over from that sentence |
| `style` and below it `styleId`, `referenceSha256`, `portraitShotId`, `crop`, `referenceRole`, `referencePolicy`, `generationReferenceDerivation`, `generationReferenceSha256` | FIXED | record of how the picture was made |
| `generationContract` and below it `portraitShotId`, `direction`, `camera`, `pose`, `background`, `model`, `styleReferenceRole` | FIXED | |
| `image`, `image.path`, `image.sha256`, `image.width`, `image.height` | FIXED | |
| `imageReview`, `imageReview.record`, `imageReview.imageSha256`, `imageReview.scope`, `imageReview.verdict` | FIXED | |
| `references` and below it `excludePhoto[]`, `identityRole`, `identitySelectionNote`, `identitySha256`, `imageText`, `originalIdentityRole`, `originalIdentitySha256`, `reviewScope`, `reviewStatus`, `styleSha256` | FIXED | |
| `textToImage` and below it `schemaVersion`, `model`, `defaultStyle`, and the `size`, `prompt`, `negativePrompt` of `views.portrait`, `views.front`, `views.back`, `views.side`, `views.profile` | REDESIGN | not written by hand. After the other keys are changed, it is rebuilt with `textToImageBlock(token)` of `server/portrait-text-to-image.mjs` |

The 511 who had no age have no token. v3 does not make new tokens for them either.

### 10.4 Other tables

| Table | Disposition |
|---|---|
| 100 `clan` id, surname, bongwan, hanja, `crest_motif`, `show_branches`, branch ids and members | FIXED |
| 100 `name`, `status` of `clan.branches[]` and `branches_ko[]` | REDESIGN, section 6.4 |
| 100 `clan_member` | FIXED |
| 100 `nonkorean_family` id, surname, members | FIXED |
| 100 `nonkorean_family.basis`, `basis_ko` | REDESIGN. Write the facts "descendants of a ○○ line that settled in Seoul before the Great Blackout and now living in the stations of ○○; they do not use the bongwan or generation syllables of Korean clans", fitted to each family. Migrant corridors (a retired concept of chapter 1 section 10) are not used. Written by the task (17-19) of the faction that holds most of the family's members (provisional T08-70) |
| 110 node `id`, `personId`, `kind`, `name`, `nameEn`, `birthDate`, `deathDate` | FIXED |
| 110 all edges (`id`, `from`, `to`, `type`, `parentRole`, `status`, `sourceRefs`) | FIXED. Not touched |
| 110 `timeline` of living-person nodes | REDESIGN. `[{"year": 2126, "summary": <first sentence of the biography>}]` |
| 110 `timeline` of ancestor nodes | DROP. Empty array. The texts carry old organizations and old polities, so they are not carried over |
| 110 node `affiliation` | REDESIGN. Living-person nodes get `{"kind": "state", "stateId": <state_id>, "name": <state_name>}` |
| 110 node `status`, `lineage`, `generationException` | REDESIGN. Carried on |
| 110 node `sourceRefs` | REDESIGN. Living-person nodes get `[{"path": "docs/drafts/people/<faction>.jsonl", "anchor": <person id>}]`; ancestor nodes carry on |
| 110 node `detailRoute` | FIXED |
| 115 `retainer_graph` | REDESIGN, section 9.4 |
| 123 `map_holding` | REDESIGN, section 9.4. 123 `map_underground` is FIXED |

(110 rules provisional T08-71)

**Small site fixes handed on.** Task 26 fixes two things at the same time. (1) `charToPerson` in `site/build.mjs` also accepts a person id as it is, so that the holdings and retainer nodes of seat holders without a `characterId` show by name. (2) The faith value labels (`FAITH`) in `site/people.mjs` are changed to the v3 values (`baptised` 세례받음, `believer` 신도, `fitted` 이식, `none` 없음). The old Christian value labels are removed.

## 11. Life between the factions

Basis: chapter 1 section 3.4 (the Han; there is nowhere to hide on the frozen river), section 5.2 (water supply contract), section 5.6 (control of each link), section 7.4 (why they need and fear each other, the thirteen boundary links), section 9 (the Government's failed ice crossing of 2079, the checkpoints at the under-river tunnels), Bible section 1 row 11, sections 2.1-2.3.

### 11.1 Crossings

The line links where the faction changes are thirteen (chapter 1 section 7.4). This chapter decides how they are crossed (provisional T08-72).

| How | Where | Who keeps it | When | What crosses |
|---|---|---|---|---|
| Under-river tunnel | Mapo–Yeouinaru (Government↔Free City), Gwangnaru–Cheonho, Seoulsup–Apgujeong Rodeo (Government↔Arc) | The Government's ledger checkpoints at the north entrances (since 2079). The south entrances are kept by Yeongdeungpo (Yeouinaru) and the Arc | Any time. Warm and sheltered | Contract workers, envoys, traders with passes, contract goods. The three tunnels carry most legal trade |
| Bridge | Yongsan–Noryangjin, Hapjeong–Dangsan, Ichon–Dongjak, Digital Media City–Magoknaru (Government↔Free City), Gangbyeon–Jamsillaru, Oksu–Apgujeong, Jayang–Cheongdam (Government↔Arc) | The north end of a bridge is kept by the Government's Dong Chief, the south end by that district's city or Near House. The Noryangjin and Dongjak ends are the work of the Dongjak Ferry Keeper | Daytime in the long-light half, only without a blizzard. Closed when the wind passes 15 metres per second | Heavy loads on sledges (firewood, salvage, bundles of fibre). People trying to avoid the tunnel checkpoints |
| Ice | anywhere on the Han | No one keeps it. That is why it is dangerous | Night in the long-dark half. The darkness covers the kilometre with nowhere to hide | Smuggling, flight that accepts being struck off, urgent messages of the return network |
| Land border | Sadang–Bangbae, Chongsindae-ipgu (Isu)–Naebang, Dongjak–Gubanpo (Free City↔Arc) | The Dongjak Ferry Keeper on the Free City side, the Seocho Near House on the Arc side | Any time | Parts and technicians, charged cells, comings and goings of divided houses. The quarrels of the two polities that split apart are also fought here |

- **A Government person needs a pass to cross the river.** The Dong Chief issues one for each crossing, and for contract work the seal of the district's Assembly Member is added. A registered resident who crosses without a pass is struck off. A person struck off gets back onto the ledger only through a registration review.
- **A person off the ledger needs an invitation pass to enter Government land.** It is issued only at the north checkpoints of the three tunnels. The technicians of the water supply contract are the most common holders of invitation passes.
- **The Free Cities do not stop people leaving.** Instead each city takes a crossing share (a toll) at its own bridge ends and tunnel entrances. The share is counted in watts and litres, or in hours of work.
- **The Arc looks at bodies, not papers.** The Bench Keeper of a border station checks the parts of those who cross. The part count of each baptised person is written in the bench roll, so a person carrying a part not on the roll is taken for a person carrying contraband.

### 11.2 Trade

Trade comes from the control table of chapter 1 section 5.6, because each holds what the other lacks (provisional T08-73).

| From → to | What mainly moves |
|---|---|
| Government → Free Cities | Hands (gangs of contract workers), firewood from Bukhansan and Dobongsan, copper and wire from the old downtown, fibre such as cardboard and wood. Ledgers and old official papers are not sent (the taboo of chapter 1 section 5.3) |
| Free Cities → Government | Maintenance and parts for pumps, water wheels, heat pumps and windmills, well digging, the hands that build fibre-sugar vats and light fields |
| Free Cities → Arc | Parts, worked metal, technicians |
| Arc → Free Cities | Cells charged with power from the Jamsil weir, maintenance of machine bodies |
| Arc → Government | Maintenance of machine bodies mended at the benches (only Government elites take it, in secret), river fish |
| Government → Arc | Not blocking the north end of the weir on the Gwangjin side. The biggest thing the Government gives the Arc is not an object but letting the wheel turn |

- Legal trade goes through the three tunnels and the land border to the markets. The big markets are Yeongdeungpo and Yeouido (opened by the Yeongdeungpo Market Master) and Dongjak (where the three polities meet).
- The Government keeps the principle that it does not trade with those off the ledger. So all Government trade takes the form of a "contract": the ledger does not buy and sell; the ledger makes agreements.
- What prices are counted in is decided by chapter 03 (the scarcity economy) and chapters 04-06. This chapter only decides what moves and by which way.

### 11.3 Smuggling

Where something is forbidden, there is smuggling (provisional T08-74).

| What | From where to where | Why it is forbidden | If caught |
|---|---|---|---|
| People (registered residents fleeing the ledger) | Government → south of the river, over the ice | Registered residents cannot change where they live or what they do (Bible section 2.1 [Approved]) | Struck off. If caught, re-registered to the worst work |
| Baptism | Arc benches → Government soldiers and elites | The Government fears its ledger soldiers will be drawn to baptism (chapter 1 section 7.4) | A Government soldier with parts is expelled from the army, and the ledger entry is changed |
| Charged cells | Arc (Jamsil) → Government | The Government does not write in the ledger that it leans on the Arc's power | Confiscated |
| Old official papers | Government → Free Cities (as fibre) | Not eating ledgers and old official papers is the Government's taboo | Judged by the district's Assembly Member, and treated most heavily |
| Salt and seed | everywhere | Scarcer every year. The Government binds them as rations, the cities as contract goods | Confiscated |
| Fake parts | Free City workshops → everywhere | Each city sells under a guarantee bearing the name of its bench | That bench is driven out of that city's markets |
| Power cores brought from outside | rim → Seoul | A power core that did not go through the return network leaves no ledger record of who came back | Confiscated on Government land, a share taken elsewhere |

### 11.4 Marriage

- **Government.** A marriage exists only when the Dong Chief enters it in the ledger. A marriage to a person off the ledger is entered only when that person passes a registration review. Water supply contracts include a clause that registers the families of a few technicians each year (provisional). Children are registered at the station where the household is registered (provisional T08-75).
- **Free Cities.** A marriage is a household contract made by two houses. Monogamy, contract cohabitation and contracts of several people living together all take the same contract form. A marriage with a person of another city leaves a contract in the markets of both cities.
- **Arc.** A house that comes close to the Hierophant through marriage becomes a Near House (chapter 1 section 7.3), so a Near House marriage is politics. Baptism is not a condition of marriage. An unbaptised spouse lives as a believer.
- **Kin across the river.** 92 of the 126 generation lines are spread over two or more factions (section 6.4). There are two causes. One is 2036-2045, when the north of the river bound its ledger into one: even within one house, the people at stations the clerks reached became registered residents, and the people across the river went off the ledger. The other is 2122, when the Arc split off: Free City houses living in the shelters of Gangnam simply became the Arc. So cousins of the same generation live on both sides of the river and on both sides of the Dongjak–Seocho border. This kinship is the most common thread of smuggling and of diplomacy (provisional T08-76).

### 11.5 Diplomacy

- **The Government and the Free Cities.** The water supply contract is the centre of diplomacy (Bible section 1 row 11, chapter 1 section 5.2). The Government sends a few Assembly Members as envoys to the contract meeting. The OMO Party wants to widen the contract and the Claw Party to narrow it (chapter 1 section 7.1). Because the Government does not see those off the ledger as its people, it writes the other side in the contract as "a contract party off the ledger".
- **Among the Free Cities.** There is no one above them, so when something must be decided together they hold a contract meeting. The head of the hosting city is the Host (chapter 1 section 7.2). What a contract meeting agrees binds only the cities that set their seals to it.
- **Arc.** Near House people carry the Hierophant's word. The Arc sits at the third water supply contract for the first time (chapter 1 section 5.2). The Arc's envoy is the Seocho Near House, because it faces the Dongjak–Seocho border.
- **Guarantors.** What makes a contract hold is a guarantor. For the term of a contract the Free Cities send a few skilled hands to the other side's stations to keep the pumps, and the Government sends gangs of registered workers. A guarantor lives on the other side's land but is a person of their own faction (section 11.6) (provisional T08-77).

### 11.6 People who live on another faction's land

Section 4.6 step 5 allows only this work (provisional T08-78).

| Work | Where | Occupation class |
|---|---|---|
| Technicians and guarantors of the water supply contract | Free City people at Government stations | maintenance, trade |
| Traders with passes | Government people at Free City markets | trade |
| Radio and shelters of the return network | Government people anywhere | courier, scout |
| Envoys | all three factions | governance (T2), trade |
| Implant maintenance | Arc people at Free City workshops | fitting |

## 12. Unit doctrine

Basis: Bible section 2.5 [Approved] (D3: the commander commands every squad; each faction has its own roster, and the deliberately empty slots are its identity; figures only in SQL), section 1 rows 5, 14 and 15, `docs/design/roster-framework.md` (TW:WH-calibrated scales), chapter 1 section 4.3 (population per faction), section 5.6, section 7.4, chapter 03 (about 11,000 baptised in the Arc).

### 12.1 What is kept

The unit rosters (`data/sql/130`-`132`) keep the following in v3.

- **D3.** One army, one commander, and the commander commands every squad. No squad has authority to move on its own. Individual resolution battles (duels, fights of heroes) remain.
- **TW:WH-calibrated scales.** The ranges of the numeric columns (`roster-framework.md` section 1.2), the squad size, hit point and speed bands per category (sections 1.3 and 1.4), the leadership bands per tier (section 3.2), the rarity ratio (section 3.3: tiers 4-5 at most 30%, rosters of 18-26), the cost bands and upkeep ratio (section 5.1), the six scarce-input words and their rules (section 6), the category counter table (section 8) and the category counts per faction (section 9.1) are not changed.
- **Names.** No real brands or other games' unit names (Bible section 4).

What changes in v3 is the units' names, equipment, appearance, building names, and the reasons for the gaps and scarcities.

### 12.2 Size of the forces

Armies are small. From the population of chapter 1 section 4.3, the share of people under arms is set as follows (provisional T08-79).

| Faction | Population | Under arms | Share | Make-up |
|---|---|---|---|---|
| Government | about 160,000 | about 4,000 | 2.5% | Mostly ledger levies. The levy takes the form of military service beginning at 18 |
| Free Cities | about 75,000 | about 1,100 standing, about 600 contract forces | 2.3% | Each city has its own contract soldiers. Companies are hired across cities |
| Arc | about 65,000 | about 1,300 | 2% | Those of the about 11,000 baptised (chapter 03) who fight. Each Near House keeps warriors |

Since a squad is 20-80 people (section 1.3), the Government can field a few dozen squads at once, and the Free Cities and the Arc about twenty each. The `unit_cap` of each unit is set so as not to exceed this size.

### 12.3 Government

**Doctrine (provisional T08-80).** The ledger makes the army. Registered residents are levied through military service, the ledger forms the squads, and the guards of the Assembly Member houses are the elite. The Government is where the arsenals and vehicle depots of the Republic of Korea Armed Forces survived, so it is the only faction with artillery and armoured vehicles. But ammunition and fuel are not newly made.

| Item | Content |
|---|---|
| Strengths | Many cheap levy infantry. Mortars and field guns. Armoured vehicles. A small state flight section. The Assembly Members' guards |
| Deliberately empty slots | **No implant units.** A ledger soldier who takes baptism is expelled from the army (section 11.3). **No mercenaries.** Only people on the ledger fight; using people off the ledger for money would bring the ledger down. **Support and field repair are thin.** The hands that mend machines are the Free City technicians of the water supply contract, and when war comes they leave, as the contract's clause says. **Tier 1-2 levies have low morale.** They are people pulled out of inherited work |
| Scarcities | Ammunition, fuel. The stocks of the army depots shrink. Reloading cases relies on Free City workshops |
| Recruitment | Levy chain (ledger office → drill yard → Assembly Member's guard hall), arms chain (gun works in Jongno, Jung and Yongsan), flight chain, medical chain. The chain shapes are as in `roster-framework.md` section 4.2; only the names change to v3 (section 12.8) |
| Commanders | President for Life, Assembly Members, colonels, captains. Dong Chiefs lead levy squads only |
| Where it fights | Holding the north entrances of the three under-river tunnels. The north ends of the bridges. The wide tunnel network north of the river |

### 12.4 Free Cities

**Doctrine (provisional T08-81).** There is no one above the cities, so the armies are separate city by city too. When one city fights it hires another city's companies. People are few but the hands are the best. Drones, electronic jamming, field repair and movement on rails are the body of a Free City army.

| Item | Content |
|---|---|
| Strengths | Drones and electronic jamming. Field repair and engineers. Rail movement. Skilled marksmen |
| Deliberately empty slots | **No ledger-style mass conscription (at most one tier 1 infantry unit).** No power exists to levy people across cities. **No tier 5.** No single city can keep alive a machine that can never be rebuilt, and there is no elite held by the cities together. **Heavy armour stops at tier 4.** It runs on cells, not fuel. **Few commander escorts (1-2).** There is no seat above |
| Scarcities | Cells, machine parts. Windmills charge the cells, but blizzards and cold weaken them |
| Recruitment | Company exchange, guild hall chains. Shapes as in section 4.3 |
| Commanders | City heads, Company Captains, Section Chiefs |
| Where it fights | The three stations of the Dongjak–Seocho land border (Sadang, Chongsindae-ipgu (Isu), Dongjak). The south ends of the bridges. Quarrels between cities |

### 12.5 Arc

**Doctrine (provisional T08-82).** The Arc's resources go to bodies. Every Near House has baptised warriors, the Heads of the Near Houses have heavy guards, and the warriors close to the Hierophant carry the most parts. Because baptised bodies draw on the station's power (chapter 1 section 4.2), the power cannot be shared out to drones and guns.

| Item | Content |
|---|---|
| Strengths | Baptised melee infantry across tiers 1-5. High morale. Many commander escorts. Old machines left from the shelter years that can never be rebuilt |
| Deliberately empty slots | **No drones.** Cells and charging go to bodies first. **No artillery.** The Arc has neither a shell factory nor army depots. **Few missile units, and they stop at tier 3.** **Only four districts of territory, so the roster is small (18-22 units)** |
| Scarcities | Implant parts, medicine. If parts are cut off, the baptised elite weakens all at once. Charging the bodies is counted as part of implant upkeep (no new scarcity word is made) |
| Recruitment | Near House seat hall, bench, Hierophant's guard hall chains. Shapes as in section 4.4 |
| Commanders | Hierophant, Heads of the Near Houses, Warrior Captains, Shelter Heads |
| Where it fights | The south entrances of the Gwangnaru–Cheonho and Seoulsup–Apgujeong Rodeo tunnels. The Jamsil weir. The Dongjak–Seocho border |

### 12.6 Battlefields and seasons

- **Tunnels and platforms.** The warmest places and where most fighting happens. Narrow and dark. The `tunnel-fighter` tag comes alive.
- **Concourses and entrances.** A fight to take a station begins in the entrance shafts.
- **Bridges and the surface.** Wind and cold wear people down before the fighting does. `thin-clad` and `frost-hardened` decide things here.
- **The ice.** Armies do not cross it (the failure of 2079, chapter 1 section 9). Only small raids cross.
- **Seasons.** In the long-light half, surface operations are easy. In the long-dark half, light runs short and the eyes of drones and marksmen both grow short. During the 2-4 days of a blizzard, surface fighting stops, and above 25 metres per second of wind drones cannot fly. The outside machines are blinded at the same time (provisional T08-83).

### 12.7 Commanders come from the people ledger

Commanders and attached heroes come from among the 1,022 (`roster-framework.md` section 10.2).

- **Who can be a commander.** A person with a rank listed in the "Commanders" row of sections 12.3-12.5.
- **Who can be an attached hero.** A Key or S1 person with Martial or Prowess of 9 or more.
- The formula by which a commander's Martial sets the presence-radius bonus (the pending default of `roster-framework.md` section 10.6) is calculated with the v3 stats of section 8.

(provisional T08-84)

### 12.8 Words to change in the unit framework and rosters

When task 20 revises `roster-framework.md` and the 130-132 rows to v3, it changes these words (new names provisional T08-85).

| Now | Why | v3 |
|---|---|---|
| The name of the third-stage building of the Government levy chain and of the rows it produces, the name and equipment text of the Government head's escort unit, the seal name in the appearance text | They carry the Government title from before the 2026-11-13 correction and the retired electoral-district concept (선구, chapter 1 section 10) | 국회의원 근위청 (Assembly Member's Guard Hall), 국회의원 근위 수행대 (Assembly Member's Sworn Retinue), seal of the Assembly Member's house |
| The Arc's "가문" (house) building and unit names (가문 본청, 가문 수장 호위대, 가문 징집 ○○병, 가문 방패병) | The world's own word in chapter 1 is Near House (곁집) | 곁집 본청, 곁집장 호위대, 곁집 징집 ○○병, 곁집 방패병 |
| The owner's comparison words left in the section 9.2 identity table and basis sentences (the words of the third, fifth and sixth rows of the left column of the chapter 1 section 2.4 table) | Comparison words are not used in the world's text (chapter 1 section 2.4) | the army of the ledger / the armies of cities that stand apart / there is no seat above |
| The old title in the section 4.2 basis sentence | Same reason | Member of the National Assembly |

The four lines each of `FACTION_GAPS` in `site/build.mjs` keep the same meaning in v3, so they need not change. The reason sentences are taken from sections 12.3-12.5 of this chapter.

## 13. The winter ratchet: turns and notch size

Basis: chapter 1 section 3.7 (the winter ratchet, game rule table), section 11 item 3 (chapter 07 decides the turn unit and the notch size), section 3.1 (surface temperature), section 3.2 (long-light half and long-dark half).

| Value | Definition |
|---|---|
| Turn | One month. A year is twelve turns. The April-September turns are the long-light half; the October-March turns are the long-dark half |
| Winter pressure | Each turn, Seoul population ÷ Seoul capacity (chapter 1 section 3.7) |
| Notch check | At the end of the December turn, if the mean winter pressure over that year's twelve turns is above 1, the ratchet tightens one notch |
| One notch | The whole surface temperature band (the annual mean, long-light half, long-dark half and blizzard night of chapter 1 section 3.1) drops by 2 degrees. Light-field harvest becomes 85% of its value at that time. Windmill capacity factor becomes 95% of its value at that time |
| Release | None. Even if the population falls, a notch does not come back |
| Opening | Winter 2126. Notches tightened: 0. It has not tightened since it stopped around 2032 |

(provisional T08-86)

## 14. Owner questions and this chapter's defaults

This chapter does not write unanswered questions as approved. For the following questions it used the recommended defaults as provisional. If the owner answers otherwise, the rows concerned are placed again.

| Question | This chapter's provisional default | Where used |
|---|---|---|
| Q5 Ji Yeon-hui's base and affiliation | Suseo, Arc | sections 3.2, 7.2 |
| Q6 the city where Go Ye-jin grew up | not decided. The biography says only "grew up in a Free City" | section 7.2 |
| Q7 Oh Hae-rin's title | "원장" kept. Director of the National Intelligence Service | section 7.2 |
| Q8 Sin Jun | no new role. Title and position empty | section 7.2 |
| Q18 lords outside Seoul | not deleted; re-placed into seats inside Seoul | section 7.1 |
| Q19-Q27 | the recommended wording of each question | section 7.2 |
| Q28 Yun Seo-rin | sitting President for Life | sections 7.2, 7.3 |
| Q29 the 8 old heads of state | head of their base district; if the seat is taken, T2 of that district | section 7.2 |
| Q30 Sin Jong-mok's affiliation | Government kept | section 7.2 |

## 15. Handed on to later tasks

1. **Task 9.** Align this chapter's occupation list (section 8.2) and rank list (section 8.5) with the words of chapters 04-06. New words are added as in section 8.6. Exempt the data-key code spans of the section 10 tables from the banned-vocabulary scan (T08-65).
2. **Task 16.** The names of the three faction rows of `040-wiki-states.sql` become the `state_name` of section 4.5. Rename the `independent` row of 035 to "무소속 / Unaffiliated".
3. **Tasks 17-19.** Write the input files with the head counts of section 3.3 and the shape of section 9. Follow the order of section 4.7, the ages of section 5.2 and the tables of sections 7.2 and 7.3.
4. **Task 20.** The doctrine of section 12 and the word changes of section 12.8.
5. **Task 26.** Put the tables of sections 8.3-8.5 into `ck3-stats.mjs`, and the calculations of section 9.4 and the disposition tables of section 10 into the editor. The two site fixes at the end of section 10.4.
6. **Task 21 (GDD).** Carry the ratchet turn rule of section 13 and the force sizes of section 12.2 into the game rule documents. Figures are referred to by unit id.
