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

1. **The people placement framework** (sections 2-7). The rules that give each of the 1,022 people a faction, a layer of the ladder, a title, a position, a rank, an occupation, a stage, a location, a household and an age. It also sets how the per-faction quota tables of chapters 04-06 are spread into role cells and used.
2. **The stat rule** (section 8). The six stats of all 1,022 people are recomputed from their v3 role. The occupation-class table and the rank-modifier table are given in the exact shape of `scripts/pages/ck3-stats.mjs`.
3. **The people input files and the key disposition table** (sections 9-10). The shape of `docs/drafts/people/<faction>.jsonl` that tasks 17-19 write, and a table that sorts every key in the current data into FIXED, REDESIGN or DROP.
4. **Life between the factions** (section 11). Trade, smuggling, marriage, diplomacy, crossing the river.
5. **Unit doctrine** (sections 12-13). The v3 doctrine the three faction rosters follow, and the turn rule of the winter ratchet.

The quota tables and named seats of chapters 04-06 (Government, Free City and Arc society) come before this chapter. This chapter does not rebuild those tables; it takes their stage and role cells as they are and only sets the rules for seating people in them (sections 4.7 and 4.8). The values of chapter 02 (ecology) and chapter 03 (technology and the scarcity economy) also come before this chapter.

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

Basis: Bible section 1 row 7 (there are only three factions), section 2.4 (districts are bound to factions), section 6, section 9.2 Q5, section 9.3 Q20, Q29 and Q30. Plan task 8 faction rule. Chapter 04 section 16.5, chapter 05 section 12.1, chapter 06 section 12.1 (independents are added on top of each chapter's table).

### 3.1 Base value kept

`faction_id` keeps its current value: Government 504, Arc 320, Free City 190. Bible section 2.4 binds districts to factions, and moving a person to another faction would clash with the district they live in. The only people this chapter assigns are the 8 `independent` people.

### 3.2 The 8 independents

Stages are the current 050 values (section 4.3).

| id | Name | Age | Stage | Assignment | Row and role | Location (real station) | Reason |
|---|---|---|---|---|---|---|---|
| person-0035 | Jang Useok | 55 | S1 | Free Cities | added to the Guro row of the chapter 05 table. Tally clerk | Cheonwang | The work and the contract partners in her old record (workshop people of Guro and Cheonwang) are all in Guro. The old "polity outside Seoul" does not exist in v3, so she gets a place inside Seoul (section 7.1) (provisional T08-1) |
| person-0038 | Heo Daon | 50 | S2 | Free Cities | added to the Guro row. Crew chief (wheels) | Cheonwang | His work is wheel maintenance at the Cheonwang depot (the Cheonwang workshop of chapter 05 section 3.4). Same as above (provisional T08-1) |
| person-0039 | Gu Chansol | 40 | S2 | Free Cities | added to the Guro row. Crew chief (tool carrying) | Guro | His workplace is the Guro tool market. Same as above (provisional T08-1) |
| person-1008 | Min Ung-gi | 32 | S1 | Free Cities | added to the Guro row. Bench owner of the Cheonwang radio bench (T2) | Cheonwang | The former superior of the three above. His work is radio maintenance and salvage repair, and he holds a bench that keeps humanoids. In a world where machines are scarce, the hands that keep humanoids running are in the Free Cities (chapter 1 section 5.6). Follows Q29's default (candidate head of his base district), but since the Guro head's seat is filled he goes to T2 of the same district (section 7.2) (provisional T08-2) |
| person-1017 | Ji Yeon-hui | 26 | S1 | Arc | added to the "Hierophant's house" row of the chapter 06 table. Hierophant's guard | Jamsil | Go Ye-jin's bodyguard since 2120 (Bible section 6 [Approved], chapter 1). The Hierophant's house is at Jamsil (chapter 06 section 2.3). Follows the affiliation of Q5's default (Arc), and the location follows chapter 06: Jamsil instead of the Suseo area (provisional T08-3) |
| person-1003 | Jo Jaepyo | 37 | S1 | kept independent | in no table | Dongjak | Section 7.4. A crossing party that crosses the rim from any polity's edge wherever the blizzard opens and works for whichever side pays. The Government ledger strikes off anyone who crosses the rim without a permit, and the only permitted crossing is the army's rim posting (section 7.4), so he cannot be a Government man. A Free City's crossers are Geumcheon's edge crew, bound to Geumcheon's edge and Geumcheon's contracts (chapter 05 section 3.5). The Arc counts people by the baptism roll and bench turns, so an Arc man is bound to the benches' order (chapter 06 section 5.4). Belonging to none of the three is what keeps all three polities' contracts open. He stays at Dongjak, where the three polities meet, under contract (provisional T08-4) |
| person-1004 | I Yeon | 25 | S1 | kept independent | in no table | Dongjak | Jo Jaepyo's attending messenger. Same reason as Jo Jaepyo (provisional T08-4) |
| person-1021 | Cha Yu-seon | 50 | S1 | kept independent | in no table | Yeongdeungpo | A negotiator mandated jointly by merchants of several cities and stations. At the contract meeting of the third water supply contract (Yeongdeungpo, chapter 05 section 4) she sits holding the merchants' share. Joining any one polity would break the mandate (provisional T08-5) |

The three who stay independent are not a faction. Bible section 1 row 7, "there are only three factions", stands. These three are people on no polity's ledger, and the screens write them as "Unaffiliated" (section 4.5).

### 3.3 Head count and stages per faction after assignment

The stage totals of the chapter 04-06 quota tables are the current 050 stage distribution. The people this chapter adds are these.

| Faction | Chapter table (Key/S1/S2/S3/S4) | Added people and row | Total (Key/S1/S2/S3/S4) |
|---|---|---|---|
| Government | 504 (9/44/105/54/292), chapter 04 section 16.2 | none | 504 (9/44/105/54/292) |
| Free Cities | 190 (3/21/33/21/112), chapter 05 section 12.2 | Guro row S1 +2 (0035, 1008), S2 +2 (0038, 0039) | 194 (3/23/35/21/112) |
| Arc | 320 (9/36/60/35/180), chapter 06 section 12.2 | Hierophant's house row S1 +1 (1017) | 321 (9/37/60/35/180) |
| Unaffiliated | | 1003, 1004, 1021 (all S1) | 3 (0/3/0/0/0) |
| Total | | | 1,022 |

Task 17 writes `government.jsonl` with the 504 plus the 3 unaffiliated (of the three faction files, the three unaffiliated go in the Government file; plan task 17: "plus the independents that 07 ... keeps independent"). Task 18 writes 194 and task 19 writes 321.

## 4. Seat assignment: stage, role, tier, title, position, location

Basis: chapter 1 section 8 (title ladder, five layers), section 2.3 (naming rules), chapter 04 sections 3, 6 and 16, chapter 05 sections 2-5 and 12, chapter 06 sections 2-4 and 12, Bible sections 2.1-2.4.

### 4.1 Stage

Stage is the current 050 `stage` value, because the quota tables of chapters 04-06 are built to keep the current stage totals. Only four people change (provisional T08-9).

| id | Name | Now | v3 | Reason |
|---|---|---|---|---|
| person-1018 | Go Ye-jin | S1 | Key | chapter 06 section 4.5 (provisional T07-16). The Hierophant is Key |
| person-0086 | Im Hajun | Key | S1 | chapter 06 section 4.5 (provisional T07-16). A missing member of the Gangdong Near House |
| person-0998 | I Ilseop | S1 | Key | chapter 05 section 12.2. The Free Cities' three Key seats are the Yeongdeungpo Market Master, the Dongjak Ferry Keeper and the Duke of Gwanak, and the Duke of Gwanak is I Ilseop ([Approved]) |
| person-0029 | Gang Minseo | Key | S1 | chapter 05 section 12.2. The Guro Works Master is an S1 seat. Swapped with I Ilseop above to keep the Free Cities' stage totals |

`stage_ko` is "주요" for Key; the rest are S1-S4 as written.

### 4.2 Tier from role

A person's `tier` is set by the role they receive. Role names are those of chapter 04 sections 16.2-16.3, chapter 05 section 12.3 and chapter 06 sections 12.3-12.4 (provisional T08-6).

| Tier | Meaning | Government (chapter 04) | Free Cities (chapter 05) | Arc (chapter 06) |
|---|---|---|---|---|
| T1 | Head and district | President for Life, Member of the National Assembly | the seven city heads | Hierophant, Head of the Near House |
| T2 | Faction office and district house | Minister, Commissioner, Governor of the Bank of Korea, Director of the National Intelligence Service, Capital Defense Commander, Presidential Chief of Staff, Secretary-General of the Assembly, the two parties' Secretaries-General, Copyist of the Resident Register Master Copy, head of the medical corps, Vice Minister, ministry Director-General, Head of the District Office, heir of an Assembly Member house | the head's heir, Yangcheon Shift Chiefs, Crossing Chiefs, bench owners of stage S1 | rivals, Near House elders, Guard Captains, Word Keepers, negotiators of stage S1 |
| T3 | Dong | Dong Chief | Section Chief | Shelter Head |
| T4 | Station | Stationmaster (including the Seoul Station stationmaster) | Station Foreman | Bench Keeper |
| T5 | All other roles | the other roles of the table (clerks, police, soldiers, skilled and labour work, market traders, health workers, dependants, spouses, kin and children of Assembly Member houses, etc.) | the rest (the head's spouse and elders, bench owners not at S1, crew chiefs, hands, apprentices, trade and contract, watch, labourers and household) | the rest |

- T1 is exactly 27 seats. Government 15 (14 Members + the President for Life), Free Cities 7, Arc 5 (4 Heads of the Near Houses + the Hierophant).
- The seat of a Member who becomes President is handed down to that house's heir (chapter 04 section 3.2, provisional T05-7). So the fourteen Members and the President for Life are fifteen different people, and the President's house holds both the presidency and a seat. The fourteen Members are fourteen different houses (chapter 04 section 3.2, "fourteen houses"): two people of the same clan (bongwan and surname) are never Members for two districts (provisional T08-7).
- Only seat holders of T1, T3 and T4 carry a ladder title. T2 and T5 use a job title instead.

### 4.3 Seats and seat stations

A seat is bound to land. The land frame is the fixed geography (the 25 districts of `121-map-titles.sql`, the 427 dongs and 312 stations of `120-map-core.sql`) (provisional T08-8).

| Seat | Land | Identifier | Rule |
|---|---|---|---|
| District seat | one district | `map_title` district id (`geography:duchy:<district code>`) | one person per district |
| Government dong seat, Arc shelter seat | one dong | `map_region.id` | at most one person per dong. The Arc calls the dong a shelter (chapter 1 section 8.3) |
| Free City section seat | one of the sections of chapter 05 section 3 (19) | `section:<district>:<section name>` (e.g. `section:구로구:신도림`) | one person per section. A section is not a dong but the group of stations chapter 05 bound together |
| Station seat | one station | `map_station.id` | at most one person per station |
| Dong of a station | | | the dong whose `map_region.path` polygon contains the station's coordinates (`map_station.x`, `y`). This turns chapter 1 section 8's "the dong with the main entrance" into a calculation on the map data |

**District seat stations.** For the Free Cities, the seat stations of the chapter 05 section 2 table; for the Arc, the seat stations of chapter 06 section 4; for the Hierophant's house, Jamsil (chapter 06 section 2.3). Chapter 04 does not set them for the Government, so they are the station in the district with the highest `degree` (on a tie, the lower `sort`), the same as the default duchy seat station of the unit framework (`roster-framework.md` section 4.1).

| District | Seat station | District | Seat station | District | Seat station |
|---|---|---|---|---|---|
| Jongno-gu | Jongno 3-ga | Jung-gu | Seoul Station | Yongsan-gu | Samgakji |
| Seongdong-gu | Wangsimni | Gwangjin-gu | Konkuk Univ. | Dongdaemun-gu | Cheongnyangni |
| Jungnang-gu | Sangbong | Seongbuk-gu | Bomun | Gangbuk-gu | April 19th National Cemetery |
| Dobong-gu | Chang-dong | Nowon-gu | Nowon | Eunpyeong-gu | Yeonsinnae |
| Seodaemun-gu | Chungjeongno | Mapo-gu | Gongdeok | Gangseo-gu | Gimpo Int'l Airport (chapter 05) |
| Yangcheon-gu | Sinjeongnegeori (chapter 05) | Yeongdeungpo-gu | Yeongdeungpo (chapter 05) | Guro-gu | Guro (chapter 05) |
| Geumcheon-gu | Gasan Digital Complex (chapter 05) | Dongjak-gu | Noryangjin (chapter 05) | Gwanak-gu | Sillim (chapter 05) |
| Seocho-gu | Express Bus Terminal (chapter 06) | Gangnam-gu | Suseo (chapter 06) | Songpa-gu | Jamsil (chapter 06) |
| Gangdong-gu | Cheonho (chapter 06) | | | | |

District heads work at the seat station. The President for Life, however, works at Gwanghwamun, where the Government Complex Seoul stands, and the Hierophant at Jamsil, where the Hierophant's house is.

### 4.4 How titles and positions are formed

Titles (`title`) and positions (`position`) are formed as follows. Where a name appears, the fixed geography's name is used letter for letter (provisional T08-10).

| Who | `title_ko` | `title` (English) |
|---|---|---|
| Member of the National Assembly | `<구> 국회의원` (e.g. 종로구 국회의원) | `Member of the National Assembly for <District>` |
| President for Life | `종신 대통령` | `President for Life` |
| Free City head | `<district name without '구'> <title>` (e.g. 관악 공작, 동작 나루지기) | `<District stem> <Title>` (e.g. Dongjak Ferry Keeper). Gwanak alone uses the approved English Duke of Gwanak |
| Head of the Near House | `<district name without '구'> 곁집장` (e.g. 송파 곁집장) | `Head of the <District stem> Near House` |
| Hierophant | `교주` | `Hierophant` |
| Government Dong Chief, Arc Shelter Head | `<동> 동장` / `<동> 대피소장` | `Dong Chief of <Dong>` / `Shelter Head of <Dong>` |
| Free City Section Chief | `<section name> 구간장` (e.g. 신도림 구간장) | `Section Chief of <Section>` |
| Station seat | `<역>역 역장` / `<역>역 역반장` / `<역>역 정비장`. If the station name already ends in "역", nothing is added (서울역 역장) | `Stationmaster of <Station>` / `Station Foreman of <Station>` / `Bench Keeper of <Station>` |
| Head of the District Office | `<구> 구청장` | `Head of the <District> Office` |
| Other roles | the role name of the chapter 04-06 tables (e.g. 수도방위사령관, 주민등록 원부 필사관, 셈판 서기, 건널목장, 호위장, 말지기, 교주 호위). If the role name only names the work, the "person name" of the section 8.2 list | the English of the section 8.7 word table and the section 8.2 list |

- The position (`position_ko`) is `<title_ko> · <work station name>`. The station name uses the "역" rule above (e.g. "배급 서기 · 서울역", "손 · 신도림역"). The English is `<title> · <Station> Station`. If the work station is the seat's own land (district heads, dong, section and station seat holders), the position adds the faction name after the title instead (e.g. "관악 공작 · 자유도시들", "종로구 국회의원 · 정부").
- For the named exceptions (section 7.2), if an owner question (Q19-Q30) has a recommended wording, the position uses it. Where that wording differs from the formula above, the question's wording wins.
- English renders these as plain occupational English, as chapter 1 section 2.3 item 6 requires.

### 4.5 Organization (`state_id`, `state_name`)

`state_id` is the faction id (`government`, `free-city`, `arc`). `state_name` and `state_name_ko` copy the name of that faction's row in `040-wiki-states.sql` as revised by task 16. The three unaffiliated people have `state_id` `independent`, `state_name_ko` "무소속" and `state_name` "Unaffiliated". Old state ids and old district-level ids are not used (provisional T08-11).

### 4.6 Location

Everyone has two real stations: the station where they work (`workStationId`) and the station where they sleep (`homeStationId`). Both are `map_station.id`, and they are usually the same. `map_station.id` is usually the Korean station name, but a few are in English (Sindorim is `Sindorim`, Guro is `Guro`, Yeongdeungpo is `Yeongdeungpo`). Use the id, not the name. The location is decided in this order (provisional T08-12).

1. **Locations set by name.** A location in the section 7.2 table comes first. Sin Jong-mok's residence in Nonhyeon 2-dong, Gangnam (Bible section 6 [Approved]) is one of these. Chapter 04 section 16.2 puts Sin Jong-mok and Sin Jun in the "Gangnam-gu (registered residents living off the ledger)" row.
2. **Seat.** A seat holder works on the seat's land. A district head at the seat station (section 4.3), a dong or shelter seat holder at the station of that dong with the highest `degree`, a Section Chief at the first station chapter 05 section 3 lists for that section, a station seat holder at that station.
3. **The quota-table row.** Everyone else lives in the district of the quota-table row they received in section 4.7 (Jamsil for the Hierophant's house). Inside that district, if the old record's anchor (a real station name in the old record; if no station name but a dong name, the station of that dong with the highest `degree`; longer names matched first) is in that district, that station; otherwise the district's stations in turn by `sort`.
4. **Living outside the faction.** Only the work of section 11.6 and the Gangnam-gu row of chapter 04 may have a station outside the faction, and only up to 3% of the faction's people (Government 15, Free Cities 5, Arc 9). Sin Jong-mok and Sin Jun count toward this number (provisional T08-13).

### 4.7 Assignment order

Tasks 17-19 assign each faction in the following order. The same input gives the same result whoever does it (provisional T08-14).

> Task 30 decision (2026-11-13): when the first assignment, written in batches, was reconciled across the whole faction, this order was not rerun from the start. The reconciliation chose the placement that keeps every quota table, seat and named seat while **moving the fewest people** (on a tie, the person later in P moves). The result and every person moved are in `docs/drafts/reports/v3-allocation-<faction>.md` (provisional T30-gov-1).

1. **Priority order P.** The order used within one stage. (a) Old heads (people whose old rank is one of the old head words of section 7.2) 0, former lords (section 7.1) 1, the rest 2. (b) Old tier T1 < … < T5. (c) Higher recorded age first; people without an age last. (d) id order.
2. **Seats set by name.** Seat first the people of the section 7.2 table and the section 7.3 table (which carries the seats chapters 04-06 fill by name).
3. **Choosing the row.** Everyone else is divided, stage by stage, into the rows of the quota table (districts, the Hierophant's house, the Gangnam-gu off-ledger row). For each row, fill as many as remain in that row's cell for the stage: in P order, first the people whose old-record anchor is in that district, then the people with no anchor inside the faction. Rows are filled in the row order of each chapter's table.
4. **Choosing the role.** Inside one row, make the role cells (section 4.8). Each cell has a stage. Fill the cells of a stage, in the column order of each chapter's table, with the people of that stage in P order. If the recorded age of the person to be seated is below the minimum age of that cell's rank (section 5.1), that person skips the cell: the cell goes to the next person in P, and the skipped person is tried again from the next cell of the same stage. People without a recorded age do not skip (their age is set afterwards to fit the role).
5. **Occupation class and phrase.** The role sets the occupation class (section 8.7 word table). If the role allows several classes (e.g. chapter 04's "skilled and labour work", chapter 05's "hands and apprentices"), choose by this preference: (a) if a parent recorded in the family trees is in the people set, that parent's class; (b) the class of the highest-classed person already assigned in the same clan within the same faction (house trade, section 6.2); (c) the class of the old occupation phrase under the old `OCCUPATION_CLASSES` (the seven old classes exist in v3 with the same ids); (d) of the classes the role allows, the one listed first in the section 8.7 table. The phrase is the first phrase of that class in the section 8.2 list allowed for the faction. If chapters 04-06 name a livelihood for that district and it is a list phrase of the same class, use that phrase.
6. **Age.** People without an age get one by section 5.2, using only the stage and the occupation class, not the rank.
7. **Rank.** Only then set by the default rank table of section 8.6. The age is already set, so there is no cycle.

### 4.8 How to read the chapter 04-06 quota tables

Basis: chapter 04 sections 16.2, 16.3 and 16.5, chapter 05 sections 12.2 and 12.3, chapter 06 sections 12.2, 12.3 and 12.4. Plan tasks 5-7.

This chapter does not build new quota tables. It spreads the three chapters' tables into role cells as follows (provisional T08-15).

- **Government (chapter 04).** For each row of the section 16.2 table, make as many role cells as the numbers in "titles and occupations". The cell's stage comes from the section 16.3 table. Where section 16.3 gives one role several stages (e.g. district office clerk S3 or S4; Assembly Member house heir S1, spouse S2, child S4), fill from the stage written first in section 16.3 so that the row's stage cell counts are met. A grouped cell (e.g. "Ministry of National Defense and Capital Defense Command 9") first takes one each of the roles section 16.3 names (minister, commander, staff), and the rest are the group's workers (soldiers).
- **Free Cities (chapter 05).** Make roles to the cell counts of the section 12.3 table. The cell's stage uses the four rules at the end of section 12.3 from the top. Rule 1 (Key, S1): the head, the heir, the owners of the large benches (from the first of the row's bench-owner and crew-chief cells), the tally clerk beside the Yeongdeungpo Host, the four Dongjak Crossing Chiefs. Rule 2 (S2): Section Chiefs, Station Foremen of the large stations (by station `degree`), crew chiefs. Rule 3 (S3): Station Foremen of the small stations, noted hands, market-house people. Rule 4 (S4): the rest. If a row's stage cell count (section 12.2) is exceeded, push down to the next stage; if short, pull up from the next role of the rules above.
- **Arc (chapter 06).** Make roles to the cell counts of the section 12.3 table. The cell's stage uses the "stage" column of section 12.4, and a range (S2-S4 and the like) is filled from the higher stage so that the row's stage cell counts of section 12.2 are met.
- **Added people.** The five people of section 3.3 are seated after the tables are spread, each in one cell added to their row.
- **If the tables change later.** If chapters 04-06 revise a quota table, tasks 17-19 spread the revised table by the same rules. The name tables of section 7.3 are used as they are if the person fits the revised table's Key seat; otherwise the person is seated again by section 4.7 steps 2-4.

## 5. Age

Basis: Bible section 1 row 12, README fixed facts (recorded ages), `scripts/pages/v3-fixed-facts.mjs` (`birthDate`, `birthday`, `age` and `ageAsOf` may be added only for people who had none, and English and Korean must be equal), chapter 04 section 14.3 (conscription at nineteen), section 16.5, chapter 05 section 12.4, chapter 06 sections 3.5 and 12.4.

### 5.1 Minimum age per rank

The minimum age is the youngest age at which a person can hold the rank. The skip of section 4.7 step 4 and section 5.3 use it. Where chapters 04-06 give a minimum age, it is carried over as it is (provisional T08-17).

| Faction | Ranks and minimum ages |
|---|---|
| Government | 대통령 25, 국회의원 18 (hereditary, chapter 04 section 16.5), 장관 30, 차관 30, 청장 30, 총재 30, 원장 30, 구청장 30, 동장 25, 역장 25, 서기관 30, 사무관 25, 주사 20, 서기 16 (succession entry, chapter 04 section 8.2), 경찰관 19, 전문의 30, 수련의 24, 교사 22, 이병·일병·상병·병장 19 (conscription, chapter 04 section 14.3), 하사 18, 중사 22, 상사 28, 소위 20, 중위 22, 대위 24, 소령 30, 중령 33, 대령 35, 후계 16, 등재민 0 |
| Free Cities | the seven heads 25 (chapter 05 section 12.4), 구간장 25, 역반장 20, 대주 20, 작업조장 20, 건널목장 25, 교대장 20, 밭장 20, 손 16, 일손 16, 견습 12, 후계 16 |
| Arc | 교주 25, 곁집장 0 (no minimum age; 2 parts or more instead of age, hereditary, chapter 06 sections 3.3, 3.5 and 12.4), 곁집 어른 40, 대피소장 28, 정비장 25, 호위장 30, 말지기 22 (task 30 decision 2026-11-13, provisional T30-arc-11), 정비공 18, 세례자 16, 곁집원 0, 미세례자 0, 후계 16 |
| Unaffiliated | 미등록 0 |

There are also minimum ages attached to occupations: chapter 06 section 12.4's negotiator 30, baptised fighter 20, house levy 17, water-power-heat and food 16, outside work 18. If a cell has both a rank and an occupation minimum, the larger is used.

### 5.2 The 511 people without a recorded age

People without a recorded age (the 511 whose 090 `sourceStatus` is `ck3-table-derived`) get an age by the following rule. The rank is not used, so age and rank never wait on each other. Every such age is provisional (age bands provisional T08-18, rule provisional T08-19).

1. **Band.** Set the band `[lo, hi]` from the layer and occupation class of the role received in section 4.7 steps 4-5.

| Role | Band |
|---|---|
| T1 seat | 40-70 |
| T2 | 35-68 |
| T3 | 35-65 |
| T4 | 30-62 |
| T5 `governance` | 35-65 |
| T5 `soldier` | Government 19-40, Free Cities 18-45, Arc 20-45 |
| T5 `guard` | 19-55 |
| T5 `medical` | 25-62 |
| T5 `fitting` | 20-58 |
| T5 `provision`, `labour` | 16-62 |
| T5 `trade` | 20-62 |
| T5 `courier` | 16-50 |
| T5 `maintenance` | 18-62 |
| T5 `scout` | 18-50 |
| T5 `record` | 19-60 |
| dependants, house children, apprentices (role names of chapters 04 and 05) | 6-15 |

   If the cell's minimum age (including the occupation minimums of section 5.1) is greater than `lo`, `lo` is raised to it.
2. **Kin window.** If the person is in a generation line (a branch in `clan.branches_ko`) and the same branch has people with recorded ages, the kin window runs from the lowest of those ages − 8 to the highest + 8, because the same generation syllable means the same generation. If band and window overlap, use the overlap. If they do not, use the single end value of the band nearest to the window.
3. **Pick.** In the interval `[lo, hi]`, `age = lo + (n mod (hi − lo + 1))`, where `n` is the number in the id (15 for person-0015).
4. **Dates.** `ageAsOf = "2126-12-31"`, birth year = 2126 − age, month = `(n mod 12) + 1`, day = `((n × 7) mod 28) + 1`. `birthDate = "YYYY-MM-DD"`, `birthday = "MM-DD"` (two digits each). Because the birthday always falls on or before 31 December, the age is correct.
5. **Both languages.** The four values (`birthDate`, `birthday`, `age`, `ageAsOf`) are written identically in `json` and `json_ko`. `age` is a number; the others are strings. `generation`, `characterId` and `clan` are not added (they are fixed facts, so adding them would fail the freeze check).
6. **Ledger.** Tasks 17-19 add one ledger row per faction file ("the ages of the N people without an age in this file are the values of the chapter 07 section 5.2 rule"). They do not add a row per person.

### 5.3 When a recorded age does not fit the role

A recorded age is a fixed fact and is not changed. The skip of section 4.7 step 4 prevents most cases. In a seat set by name (section 7.2), if a recorded age is below the rank's minimum age, the rank gives way: the person takes a younger rank usable for the same role (e.g. 대령 → 대위), or, if there is none, keeps the table's seat and the case is written in the ledger. Sin Jun (12) is a registered resident of the Government.

## 6. Households and inheritance

Basis: Bible section 1 row 12 (scarcity made children inherit their parents' work, and vertical strata hardened), section 2.1 (inheritance), section 2.3 (the Hierophant's line and the houses close to it), chapter 1 section 2.4 (handed-down seats, Near Houses), sections 7.1-7.3, chapter 04 sections 3.1, 3.2 and 8, chapter 05 sections 2 and 5, chapter 06 section 3.

### 6.1 The three recorded households

Within the people set, recorded kin between living people exist in only three households. Each is bound into one household (`household.id`). `household.id` groups a recorded household; whether its members sleep at the same station follows the table's home station (provisional T08-20).

| Household | People | Relation (fixed) | Faction | Station where they sleep |
|---|---|---|---|---|
| Im Hajun's household | Im Hajun (0086, head, missing), Im Chowon (0087, adopted child, rival in the Gangdong Near House), Bak Serin (0090, ward living with them) | adoptive and household edges of the family tree, Kinship | Arc (Gangdong) | all three at Cheonho. Im Hajun is missing, so only his place remains |
| The Jeong household | Jeong Seoon (1005, head, rival in the Songpa Near House), Jeong Yura (0399, Head of the Seocho Near House) | household edge of the family tree, Kinship "distant relative" | Arc | Jeong Seoon at Jamsil, Jeong Yura at Express Bus Terminal. Chapter 06 section 4.5 places them in seats of different districts, so they remain one recorded household but sleep apart |
| The Sin household | Sin Jong-mok (1009, head), Sin Jun (1010, son) | biological edge of the family tree, Kinship | Government (chapter 04 Gangnam-gu row) | Seonjeongneung |

### 6.2 Houses and the house trade

The people of one clan within one faction are called a **house**. The house is the unit of inheritance in v3 (provisional T08-21).

- A house's **house trade** is the occupation class of the house member already assigned on the highest layer (on a tie, the one earlier in P). This is item (b) of section 4.7 step 5. So members of one house do the same work as far as the role allows.
- A person whose parent is recorded in a family tree follows the parent's class first (item (a) of section 4.7 step 5). In the people set this applies only to Im Chowon (who took over Im Hajun's pump work, chapter 06 section 4.5) and Sin Jun.
- The fourteen Government Members are fourteen houses. One house holds only one seat (section 4.2).
- **Assembly-house slots** (task 30 decision, 2026-11-13): the heir and child slots are blood, so they hold people of the Member's own clan, and a child is younger than the Member. Only the spouse/kin slots admit people of another clan who married in. The liege of all four slots is the National Assembly Member of that row's seat. For the life president's former seat (Jongno) the liege is the person who received that seat, not the president (provisional T30-gov-13). For a Member with no clan (a non-Korean family), that non-Korean family (100 `nonkorean_family`) counts as the house. In the Free Cities, an heir child or an elder of the head's house whose clan has no head takes the head of that row's city as liege (provisional T30-gov-24). If the Member is the only member of the house, or the faction has no member of the house at that slot's stage (heir S1, child S4), the heir and child slots may hold a person taken in from another house (an adoptee or ward), with the taking-in stated in the biography; a person in the child slot is younger than the Member, while the heir slot may take in an adult to carry the seat and has no age condition (provisional T30-gov-25).

### 6.3 Seats handed down

| Faction | What is handed down | Who receives it |
|---|---|---|
| Government | The Assembly Member's seat. The head of the household names the heir (chapter 04 section 3.1). The Stationmaster post passes within the stationmaster's house (chapter 04 section 6). Dong Chiefs are appointed by the Member | The house's heir (rank "후계"). The Assembly election is a ritual. The President's seat goes to the heir of the President's house (chapter 04 section 3.2) |
| Free Cities | It differs from city to city (chapter 05 section 2). In Yangcheon and Gwanak a house hands it down; in Gangseo the wind-field bench owners choose; in Guro the guarantee board decides; in Geumcheon the edge crew chooses among those who crossed the rim and came back; in Dongjak the Crossing Chiefs choose; in Yeongdeungpo the turn of the market houses decides. Benches are handed down in the bench owner's house (chapter 05 section 5.2) | A bench owner's seat goes to a child who has shown the skill. Station Foremen are chosen by the station's bench owners, Section Chiefs by the head (chapter 05 section 5.4) |
| Arc | The seat of the Head of the Near House. It follows blood, and the next head must have two parts or more (chapter 06 section 3.3). The Hierophant names and removes Near Houses | The heir within the Near House. The quarrel of blood and iron (chapter 06 section 3.5) |

(provisional T08-22)

### 6.4 Generation lines and kin across the river

The 126 branches of `clan.branches` are lines of the same generation that share a generation syllable. 92 of them have members spread over two or more factions. Section 11.4 explains why inside the world. Branch names and status texts are to be redesigned: the name is `<syllable> 항렬 가계` (English `<syllable> generation line`) and the status is `추정` (English `Inferred`). Branch ids and members are fixed (provisional T08-23).

## 7. Re-placing the old seats

Basis: Bible section 6 (named-person exceptions), section 9.2 Q18, section 9.3 Q19-Q30, chapter 1 section 10 (retired concepts: lords outside Seoul, old national offices, old religious offices, company groups), chapter 1 section 6.3, chapter 04 sections 16.3 and 16.4, chapter 05 sections 2, 3 and 12, chapter 06 section 4.5.

### 7.1 Former lords

Bible section 6 records "91 outside lords". In the current data an old lord carries one of two markers: the 92 people whose 050 rank is 영주 or 해상 영주, and the 86 people whose 090 titles, holdings or political identities carry an administrative code outside Seoul (a code not starting with 11). Together they are 105 people (Government 50, Free City 28, Arc 24, independent 3). The Bible's 91 lie inside this set. v3 picks the targets by these markers, not by a count (provisional T08-24).

These 105 people are re-placed as follows (provisional T08-25).

1. Their faction and stage stay (sections 3 and 4.1). The word lord, the names of land outside Seoul and codes outside Seoul are all removed. No one rules outside Seoul (chapter 1 section 6.3).
2. Former lords are the second group of P in section 4.7. Within their stage they are seated first in seat roles (district, dong, section, station). This carries the recommended default of Bible Q18 (remove the "lord of ○○" wording and re-place them under titles inside Seoul) onto the v3 ladder.
3. If the old record has only land outside Seoul and no anchor inside Seoul, the location comes from section 4.6 step 3.
4. The biography does not say that the person ruled outside Seoul. That person has lived in the stations of Seoul from the start.

### 7.2 Seats set by name

The old head words are these old ranks: 군주, 위원장, 의장, 사령관, 회장, 사장, 장관, 원장, 단장, 방장, 대통령, 공작, 구역장, 수석 신도, 국장, 본부장, 상임이사, 이사, 전무, 감사, 당직장, 부장, 지부장. People with one of these words are the first group of P in section 4.7.

The tables below hold the seats chapters 04-06 fill by name, the people of Bible section 6, and the independents this chapter places. A Q in the "Basis" column is a question waiting for the owner's answer, and until then the seat is that question's recommended default. If the owner answers otherwise, the answer wins. Titles are formed by section 4.4.

**Government (chapter 04 sections 3.2, 3.4, 16.3 and 16.4)**

| id | Name (age) | Stage | Row | Role | Tier | Rank | Occupation | Work station | Basis | Provisional |
|---|---|---|---|---|---|---|---|---|---|---|
| person-0145 | Yun Seo-rin (27) | Key | Jongno-gu | President for Life | T1 | 대통령 | 국정 총괄 | Gwanghwamun | Q28, chapter 04 section 16.4 | T08-28 |
| person-0195 | Oh Hae-rin (48) | Key | Jung-gu | Director of the National Intelligence Service (title "원장") | T2 | 원장 | 정보 수집 | Myeong-dong | Q7, chapter 04 section 4 (foot of Namsan) | T08-38 |
| person-0246 | Baek On (24) | Key | Jongno-gu | Copyist of the Resident Register Master Copy, Ministry of the Interior and Safety | T2 | 서기 | 명부 필사 | Gwanghwamun | Q26, chapter 04 section 16.4 | T08-36 |
| person-0323 | Ryu Eunbi (56) | Key | Jongno-gu | head of the medical corps, Ministry of Health and Welfare | T2 | 전문의 | 진료 | Gwanghwamun | Q27, chapter 04 section 16.4 | T08-37 |
| person-0170 | Bak Tae-gyeom (55) | Key | Yongsan-gu | Member for Yongsan-gu | T1 | 국회의원 | 구 행정 | Samgakji | chapter 04 section 3.4 (the four river districts are Key) | T08-48 |
| person-1006 | Tak Seoyun (35) | Key | Yongsan-gu | Capital Defense Commander | T2 | 대령 | 군 지휘 | Samgakji | chapter 04 section 16.3 | T08-87 |
| person-1007 | Kim Yeongyu (30) | Key | Mapo-gu | Member for Mapo-gu | T1 | 국회의원 | 구 행정 | Gongdeok | chapter 04 section 3.4 | T08-47 |
| person-0297 | Jang Sehwa (28) | Key | Seongdong-gu | Member for Seongdong-gu | T1 | 국회의원 | 구 행정 | Wangsimni | chapter 04 section 3.4 | T08-46 |
| person-0349 | Go Seojun (27) | Key | Gwangjin-gu | Member for Gwangjin-gu | T1 | 국회의원 | 구 행정 | Konkuk Univ. | Q29 (anchor Guui, Gwangjin-gu), chapter 04 section 16.4 | T08-45 |
| person-0250 | Yun Choa (42) | S1 | Jongno-gu | Member for Jongno-gu (heir of the President's house) | T1 | 국회의원 | 구 행정 | Jongno 3-ga | chapter 04 section 3.2 (provisional T05-7) | T08-50 |
| person-0148 | Yun Ji-yul (62) | S1 | Jongno-gu | Presidential Chief of Staff (elder of the President's house) | T2 | 서기관 | 비서 업무 | Gwanghwamun | the presidential office cell of chapter 04 section 16.2 | T08-50 |
| person-0197 | Yun Seo-ha (38) | S1 | Jongno-gu | heir of an Assembly Member house (the President's house) | T2 | 후계 | 장터 거래 | Jongno 3-ga | Assembly Member house, chapter 04 section 16.3 | T08-50 |
| person-1009 | Sin Jong-mok (39) | S1 | Gangnam-gu (off the ledger) | return network field contractor | T5 | 등재민 | 무전 중계 | works Suseo, sleeps Seonjeongneung | title, Gangnam residence, Nonhyeon 2-dong, Baekya [Approved], Q30, chapter 04 section 16.2 | T08-29 |
| person-1010 | Sin Jun (12) | S1 | Gangnam-gu (off the ledger) | Sin Jong-mok's son | T5 | 등재민 | 교육 | Seonjeongneung | Q8, chapter 04 section 16.2 | T08-30 |

- Sin Jun keeps an empty title and position, as Q8 says. The occupation "교육" (schooling) is there because the stat calculation (section 8) needs a class.
- Tak Seoyun's rank is colonel. With the army shrunk, a colonel holds the Capital Defense Command (this is the default, not the rank giving way of section 5.3).
- Oh Hae-rin's work station Myeong-dong is the Government station closest to the foot of Namsan, where the National Intelligence Service stands (chapter 04 section 4).

**Free Cities (chapter 05 sections 2, 3 and 12)**

| id | Name (age) | Stage | Row | Role | Tier | Rank | Occupation | Work station | Basis | Provisional |
|---|---|---|---|---|---|---|---|---|---|---|
| person-0998 | I Ilseop (34) | Key | Gwanak | Duke of Gwanak | T1 | 공작 | 도시 운영 | Sillim | duke [Approved], position wording Q19, chapter 05 section 3.7 | T08-27 |
| person-0001 | Han Jae-mok (57) | Key | Yeongdeungpo | Yeongdeungpo Market Master (the market-house person seated by turn, Host of the third water supply contract) | T1 | 장주 | 도시 운영 | Yeongdeungpo | Q29, chapter 05 sections 3.3 and 12.2 | T08-42 |
| person-0220 | Choe Ji-u (27) | Key | Dongjak | Dongjak Ferry Keeper (chosen by the Crossing Chiefs) | T1 | 나루지기 | 도시 운영 | Noryangjin | Q29, chapter 05 sections 3.6 and 12.2 | T08-44 |
| person-0029 | Gang Minseo (60) | S1 | Guro | Guro Works Master (the bench owner with the most marks on the guarantee board) | T1 | 공장장 | 도시 운영 | Guro | Q29, chapter 05 section 3.4 | T08-43 |
| person-0002 | I Seo-dam (58) | S1 | Yangcheon | Yangcheon Depot Master (the depot house) | T1 | 기지장 | 도시 운영 | Sinjeongnegeori | chapter 05 section 3.2, old-record anchor Yangcheon | T08-49 |
| person-0032 | I Gangmuk (42) | S1 | Geumcheon | Geumcheon Edge Warden (chosen by the edge crew among those who crossed the rim and came back) | T1 | 경계장 | 도시 운영 | Gasan Digital Complex | chapter 05 section 3.5, old-record anchor Geumcheon | T08-49 |
| person-0034 | Choe Dain (35) | S1 | Gangseo | Gangseo Wind Keeper (chosen by the wind-field bench owners) | T1 | 바람지기 | 도시 운영 | Gimpo Int'l Airport | chapter 05 section 3.1, the rule of section 4.7 step 3 | T08-49 |
| person-1008 | Min Ung-gi (32) | S1 | Guro (added) | bench owner of the Cheonwang radio bench | T2 | 대주 | 통신 정비 | Cheonwang | Q29, section 3.2 | T08-2 |
| person-0035 | Jang Useok (55) | S1 | Guro (added) | tally clerk | T5 | 손 | 셈판 기록 | Cheonwang | section 3.2 | T08-1 |
| person-0038 | Heo Daon (50) | S2 | Guro (added) | crew chief (wheels) | T5 | 작업조장 | 차량 정비 | Cheonwang | section 3.2 | T08-1 |
| person-0039 | Gu Chansol (40) | S2 | Guro (added) | crew chief (tool carrying) | T5 | 작업조장 | 부품 거래 | Guro | section 3.2 | T08-1 |
| person-0457 | Cha Yewon (28) | S4 | Gwanak | hand (records) | T5 | 손 | 계약서 기록 | Sillim | Q21 wording "복구복무 기록관" | T08-31 |

- Han Jae-mok and Choe Ji-u are both Key now, and they take chapter 05's two Key seats (Yeongdeungpo Market Master, Dongjak Ferry Keeper). Han Jae-mok goes to Yeongdeungpo, which holds the Yangpyeong-dong intake, because of the floodgate and water work of his old record; Choe Ji-u goes to Dongjak, the city of crossings, because of the investment ledgers and toll work of his.
- I Gangmuk's biography carries that he crossed the rim and came back (the selection rule of chapter 05 section 3.5).
- Choe Dain is chosen by the rule of section 4.7 step 3. The biography says he was chosen as a bench owner of the Gangseo wind fields.

**Arc (chapter 06 sections 2.3 and 4.5)**

| id | Name (age) | Stage | Row | Role | Tier | Rank | Occupation | Work station | Basis | Provisional |
|---|---|---|---|---|---|---|---|---|---|---|
| person-1018 | Go Ye-jin (38) | Key | Hierophant's house | Hierophant | T1 | 교주 | 신앙 통솔 | Jamsil | office [Approved], home city Q6, chapter 06 section 2.3 | T08-26 |
| person-0399 | Jeong Yura (36) | Key | Seocho-gu | Head of the Seocho Near House | T1 | 곁집장 | 곁집 통솔 | Express Bus Terminal | Q25, chapter 06 section 4.5 | T08-35 |
| person-0088 | O Gyeongjae (22) | Key | Gangnam-gu | Head of the Gangnam Near House | T1 | 곁집장 | 곁집 통솔 | Suseo | Q23, chapter 06 section 4.5 | T08-33 |
| person-0374 | Nam Yun-gyeong (35) | Key | Songpa-gu | Head of the Songpa Near House. The position also carries the Q24 wording "아크 수석 신도" | T1 | 곁집장 | 곁집 통솔 | Jamsil | Q24, chapter 06 sections 4.5 and 14 | T08-34 |
| person-0116 | Bae Ujin (43) | Key | Gangdong-gu | Head of the Gangdong Near House | T1 | 곁집장 | 곁집 통솔 | Cheonho | Q29, chapter 06 section 4.5 | T08-40 |
| person-0057 | Jeong Hojun (25) | Key | Seocho-gu | rival in the Seocho Near House | T2 | 곁집원 | 세례 집도 | Express Bus Terminal | chapter 06 section 4.5 | T08-88 |
| person-0272 | Yi Hong-won (59) | Key | Gangnam-gu | rival in the Gangnam Near House | T2 | 곁집 어른 | 곁집 통솔 | Suseo | Q29, chapter 06 section 4.5 | T08-41 |
| person-1005 | Jeong Seoon (36) | Key | Songpa-gu | rival in the Songpa Near House | T2 | 곁집원 | 계약 교섭 | Jamsil | Q29, chapter 06 section 4.5 | T08-39 |
| person-0087 | Im Chowon (26) | Key | Gangdong-gu | rival in the Gangdong Near House | T2 | 곁집원 | 펌프 정비 | Cheonho | chapter 06 section 4.5 | T08-88 |
| person-0086 | Im Hajun (54) | S1 | Gangdong-gu | member of the Gangdong Near House, missing | T2 | 곁집 어른 | 펌프 정비 | Cheonho | Q22 wording "펌프기술 총관, 현재 실종", chapter 06 section 4.5 | T08-32 |
| person-1017 | Ji Yeon-hui (26) | S1 | Hierophant's house (added) | Hierophant's guard | T5 | 미세례자 | 경호 | Jamsil | bodyguard [Approved], Q5, section 3.2 | T08-3 |

- As chapter 06 section 14 says, Q24's recommended value (keep "수석 신도" as it is) clashes with Nam Yun-gyeong's seat as Head of the Near House. If the owner answers Q24 with the recommended value, the Head of the Songpa Near House becomes Jeong Seoon and Nam Yun-gyeong becomes the rival of the Songpa Near House. Until then, by chapter 06 section 4.5's default, Nam Yun-gyeong is the Head, and "아크 수석 신도" is added to the position.
- Im Hajun is missing. His biography rewrites in v3 words the old record's "disappeared in the winter of 2125". He is a member of the Gangdong Near House, not Gangnam (chapter 06 section 4.5).
- Until Q6 is answered, Go Ye-jin's biography says only "grew up in a Free City". For how her work station relates to the places of chapter 06's private setting, see section 14.

**Unaffiliated (section 3.2)**

| id | Name (age) | Stage | Role | Tier | Rank | Occupation | Work station | Basis | Provisional |
|---|---|---|---|---|---|---|---|---|---|
| person-1003 | Jo Jaepyo (37) | S1 | leader of the return party | T5 | 미등록 | 귀환 탐사 | Dongjak | Q20 | T08-4 |
| person-1004 | I Yeon (25) | S1 | attending messenger | T5 | 미등록 | 전령 | Dongjak | | T08-4 |
| person-1021 | Cha Yu-seon (50) | S1 | joint mandated negotiator | T5 | 미등록 | 계약 교섭 | Yeongdeungpo | | T08-5 |

### 7.3 Default district seat table

Chapter 04 does not name the people for the nine S1 Government Member seats (chapter 04 section 3.4: Jung-gu, Seodaemun-gu, Dongdaemun-gu, Jungnang-gu, Seongbuk-gu, Eunpyeong-gu, Gangbuk-gu, Dobong-gu, Nowon-gu). This chapter seats them by section 4.7 steps 3-4. Candidates are the Government S1 people not in the section 7.2 tables, in P order, with people anchored in the district first. A person of a house (clan) that already holds a seat is skipped (section 4.2, "fourteen houses"). So the Yun (Papyeong) hold only the Jongno-gu seat and the Bak (Miryang) only the Yongsan-gu seat (provisional T08-49).

| Faction | District | Person (age) | Clan | Stage | How decided |
|---|---|---|---|---|---|
| Government | Jongno-gu | Yun Choa (42) | Papyeong Yun | S1 | section 7.2 (heir of the President's house) |
| Government | Jung-gu | Nam Siyun (46) | Uiryeong Nam | S1 | rule (anchor Jung-gu) |
| Government | Yongsan-gu | Bak Tae-gyeom (55) | Miryang Bak | Key | section 7.2 |
| Government | Seongdong-gu | Jang Sehwa (28) | Mokcheon Jang | Key | section 7.2 |
| Government | Gwangjin-gu | Go Seojun (27) | Hanyang Go | Key | section 7.2 |
| Government | Dongdaemun-gu | O Seo-yul (59) | Haeju O | S1 | rule (former lord, no anchor) |
| Government | Jungnang-gu | Gang Ye-jun (56) | Jinju Gang | S1 | rule (former lord) |
| Government | Seongbuk-gu | Seo Ra-on (46) | Dalseong Seo | S1 | rule (former lord) |
| Government | Seodaemun-gu | Alexander Miller (67) | no clan | S1 | rule (old head) |
| Government | Eunpyeong-gu | Jo Ha-rin (31) | Baecheon Jo | S1 | rule (former lord) |
| Government | Gangbuk-gu | Ra Seyeong (43) | Geumseong Ra | S1 | rule |
| Government | Dobong-gu | Jeon Sol (33) | Cheonan Jeon | S1 | rule |
| Government | Nowon-gu | Eun Chaeyun (32) | Haengju Eun | S1 | rule |
| Government | Mapo-gu | Kim Yeongyu (30) | Gyeongju Gim | Key | section 7.2 |
| Free City | Gwanak-gu | I Ilseop (34) | | Key | [Approved] |
| Free City | Yeongdeungpo-gu | Han Jae-mok (57) | | Key | section 7.2 |
| Free City | Dongjak-gu | Choe Ji-u (27) | | Key | section 7.2 |
| Free City | Guro-gu | Gang Minseo (60) | | S1 | section 7.2 |
| Free City | Yangcheon-gu | I Seo-dam (58) | | S1 | section 7.2 |
| Free City | Geumcheon-gu | I Gangmuk (42) | | S1 | section 7.2 |
| Free City | Gangseo-gu | Choe Dain (35) | | S1 | section 7.2 (rule) |
| Arc | Seocho-gu | Jeong Yura (36) | | Key | chapter 06 |
| Arc | Gangnam-gu | O Gyeongjae (22) | | Key | chapter 06 |
| Arc | Songpa-gu | Nam Yun-gyeong (35) | | Key | chapter 06 (mind Q24) |
| Arc | Gangdong-gu | Bae Ujin (43) | | Key | chapter 06 |

With the President for Life Yun Seo-rin and the Hierophant Go Ye-jin, T1 is 27 people. Yun Seo-rin was the Member for Jongno-gu and was then acclaimed, and the seat was handed down to Yun Choa, heir of the President's house (chapter 04 section 3.2, provisional T05-7). Yun Ji-yul of the same house is the Presidential Chief of Staff, and Yun Seo-ha is the house's next heir. Eight more Government Papyeong Yun people exist besides these three; they are placed in the rows of Jongno-gu and other districts by section 4.7 (provisional T08-50).

### 7.4 The return network

Chapter 1 section 10 did not retire the return network but handed it to this chapter (provisional T02-92). Bible section 6 approved Sin Jong-mok's title "return network field contractor", his residence in Gangnam, Nonhyeon 2-dong, and his call sign Baekya (linking Seonjeongneung and Suseo).

In v3 the **return network** is the line that receives people who cross the machines' rim and come back (provisional T08-51).

- The rim can be crossed only in the 2-4 days when a blizzard blinds the machines (chapter 1 section 6.3). Since 2086-2095, bringing back power cores has been a trade (chapter 1 section 9). Those who come back bring the power cores or parts of broken machines, and they live only if they reach a station inside the rim before the blizzard lifts.
- Crossers come from several places. Geumcheon makes crossing the city's work, so much so that it chooses its Edge Warden among those who crossed and came back (chapter 05 section 3.5). The Arc's Suseo exchange takes power cores brought from outside (chapter 06 section 8.6). Government people who cross without a permit are struck off the ledger. The only crossing inside the ledger is a rim posting entered by the Ministry of National Defense, paid at 30 meals a trip (chapter 03 section 11.1, provisional T09-4).
- The return network is a chain of radio and shelter, paid for by the Government under contract, that waits for those coming back. The ledger wants the power cores and wants to record who came back. The rim lies all round Seoul, so the field work is done south of the river too. That is why Sin Jong-mok, a Government man, lives in Gangnam. Baekya is his radio call sign, and he carries the relay between Seonjeongneung and Suseo.
- Jo Jaepyo's party crosses from any edge and sells what it brings to any side, so it joins no polity (section 3.2). The return network is the line that meets it when it comes back toward the Government side.

## 8. Stats

Basis: Bible section 1 row 10, section 8, section 9.2 Q17 (calculated by occupation, position and tier rules), `scripts/pages/ck3-stats.mjs` (`OCCUPATION_CLASSES` line 37, `CLASS_BASE` line 47, `RANK_MODIFIER` line 57, `deriveTableStats` line 201), `docs/ck3-stat-rule.md`.

### 8.1 Rule

1. The six stats of all 1,022 people are recomputed from their v3 occupation and rank. The stats of the old detailed records were tied to the old roles and are not used (plan task 8).
2. The calculation is `deriveTableStats(personId, occupation_ko, rank_ko)` as it is. Read the section 8.3 table from the top against the occupation phrase, take the class of the first matching word, add the section 8.5 rank modifier to the section 8.4 class base, and clamp to 1-20. `effective` equals `base`.
3. Trait effects (`traits[].effects`) are all empty arrays, so `effective = base` always holds. Whether automatic battle should use personality traits (the place of brave and craven) for the commander's injury risk is an owner question. If it does, a separate battle-only effect is added rather than a stat effect, and this item stays as it is (chapter 09 section 3.4.2, section 7 item 4, bible section 9.5).
4. 090 `sourceStatus` becomes `ck3-table-derived` for all 1,022 people. Then `node scripts/pages/ck3-stats.mjs --dry-run` recomputes the stored values of all 1,022 people from the table and compares them (`E_DERIVED_DRIFT`).
5. No occupation phrase outside the section 8.2 list is used, and no rank outside the section 8.5 list. Outside the lists the tool fails with `E_UNKNOWN_OCCUPATION` or `E_UNKNOWN_RANK`.

(provisional T08-52)

### 8.2 v3 occupation list

Occupation phrases (`occupation_ko`) are chosen from this list only, one phrase per person. Stacked phrases like the old data's "main ○○ / secondary ○○" are not used. "Person name" is the title used when a role name only names the work (section 4.4). In the faction column G is the Government, F the Free Cities, A the Arc and I unaffiliated. Which list phrase each role name of chapters 04-06 reaches is in section 8.7 (provisional T08-53).

| Class | `occupation_ko` | `occupation` | Person name (ko / en) | Factions |
|---|---|---|---|---|
| governance | 국정 총괄 | Affairs of state | 종신 대통령 / President for Life | G |
| governance | 구 행정 | District administration | 국회의원, 구청장 / Member of the National Assembly, Head of the District Office | G |
| governance | 부처 행정 | Ministry administration | 장관, 차관, 청장, 국장 / Minister, Vice Minister, Commissioner, Director-General | G |
| governance | 동 행정 | Dong administration | 동장 / Dong Chief | G |
| governance | 역 행정 | Station administration | 역장 / Stationmaster | G |
| governance | 도시 운영 | City governance | 도시의 우두머리 칭호, 교대장 / the city's head title, Shift Chief | F |
| governance | 구간 운영 | Section running | 구간장, 밭장 / Section Chief, Field Chief | F |
| governance | 역반 운영 | Station crew running | 역반장 / Station Foreman | F |
| governance | 신앙 통솔 | Leading the faith | 교주, 수석 신도 / Hierophant, First Believer | A |
| governance | 곁집 통솔 | Leading a Near House | 곁집장, 곁집 어른 / Head of the Near House, Near House elder | A |
| governance | 대피소 통솔 | Leading a shelter | 대피소장 / Shelter Head | A |
| governance | 정비대 통솔 | Leading a bench | 정비장 / Bench Keeper | A |
| soldier | 군 지휘 | Military command | 수도방위사령관, 구 부대 지휘관, 호위장 / Capital Defense Commander, district unit commander, Guard Captain | GA |
| soldier | 징집 보병 | Levy infantry | 징집병 / Conscript | G |
| soldier | 가문 징집 | House levy | 가문 징집병 / House levy | A |
| soldier | 계약 보병 | Contract infantry | 계약 부대원 / Contract fighter | F |
| soldier | 세례 전투 | Baptised fighting | 세례 전투원 / Baptised fighter | A |
| soldier | 소총 사격 | Rifle shooting | 소총수 / Rifleman | GFA |
| soldier | 포병 | Artillery | 포수 / Gunner | G |
| soldier | 드론 조종 | Drone piloting | 드론 조종수 / Drone pilot | GF |
| soldier | 지휘 참모 | Staff officer | 참모 / Staff officer | GA |
| guard | 출입구 경비 | Entrance guard | 출입구 경비원 / Entrance guard | GFA |
| guard | 검문소 경비 | Checkpoint guard | 검문소 경비원 / Checkpoint guard | G |
| guard | 순찰 | Patrol | 순찰대원 / Patroller | GFA |
| guard | 경호 | Bodyguard | 경호원, 교주 호위 / Bodyguard, Hierophant's guard | GFA |
| guard | 치안 | Policing | 경찰관 / Police officer | G |
| guard | 지킴 몫 | Watch duty | 지킴 손, 산지기, 경계조원 / Watch hand, Mountain Keeper, Edge crew | F |
| medical | 진료 | Medical care | 의사, 보건소장 / Doctor, Health post chief | GFA |
| medical | 응급 처치 | Emergency care | 구호원 / Medic | GFA |
| medical | 약품 관리 | Medicine keeping | 약품 관리인 / Medicine keeper | GFA |
| medical | 세례자 돌봄 | Recovery care | 돌봄이 / Recovery carer | A |
| fitting | 이식 정비 | Implant maintenance | 정비공, 야전 정비공 / Bench fitter, Field fitter | AF |
| fitting | 세례 집도 | Baptism fitting | 세례 집도자 / Baptism fitter | A |
| fitting | 충전 관리 | Charging upkeep | 충전 관리인 / Charge keeper | A |
| provision | 섬유당 통 관리 | Fibre-sugar vats | 섬유당 통지기 / Vat keeper | GFA |
| provision | 빛밭 경작 | Light-field farming | 빛밭 일꾼, 빛밭지기 / Light-field worker | GFA |
| provision | 버섯 재배 | Mushroom growing | 버섯 굴지기 / Mushroom-cellar keeper | GFA |
| provision | 벌레 치기 | Insect rearing | 벌레치기 / Insect keeper | GFA |
| provision | 얼음 어로 | Ice fishing | 얼음 낚시꾼 / Ice fisher | GFA |
| provision | 싹 기르기 | Sprouting | 싹 기르는 이 / Sprout grower | GFA |
| provision | 부엌 취사 | Kitchen cooking | 부엌 일꾼 / Cook | GFA |
| labour | 눈 굴 지기 | Snow-shaft keeping | 출입구 일꾼, 출입구지기 / Entrance worker, Entrance keeper | GFA |
| labour | 제설 | Snow clearing | 제설꾼 / Snow clearer | GFA |
| labour | 땔감 벌목 | Firewood felling | 벌목꾼, 나무조원 / Woodcutter | GF |
| labour | 화덕 지기 | Hearth keeping | 화덕 지기 / Hearth keeper | GFA |
| labour | 메탄 통 지기 | Methane vat keeping | 메탄 통지기 / Methane keeper | GFA |
| labour | 짐꾼 | Porter | 짐꾼 / Porter | GFA |
| labour | 옷 짓기 | Clothes making | 옷 짓는 이, 집안 살림 / Clothier, Household keeper | GFA |
| trade | 배급 집행 | Ration issuing | 배급 서기 / Ration clerk | G |
| trade | 장터 거래 | Market trading | 장터 상인, 장터 집안 사람 / Market trader | GFA |
| trade | 부품 거래 | Parts trading | 부품 상인 / Parts dealer | FA |
| trade | 계약 교섭 | Contract negotiation | 교섭인 / Negotiator | GFAI |
| trade | 물자 계량 | Goods weighing | 계량인 / Weigher | GFA |
| trade | 급수 배분 | Water allotment | 급수 배분인 / Water allotter | GFA |
| trade | 환전 | Money changing | 환전꾼 / Money changer | F |
| trade | 증표 발행 | Coupon issuing | 증표 인쇄공, 한국은행 총재 / Coupon printer, Governor of the Bank of Korea | G |
| courier | 전령 | Messenger | 전령 / Messenger | GFAI |
| courier | 짐 호송 | Cargo escort | 호송원 / Escort | GFA |
| courier | 열차 배차 | Train dispatch | 배차원 / Dispatcher | GFA |
| courier | 수레 운전 | Cart driving | 수레꾼 / Carter | GFA |
| courier | 나루 건넘 안내 | River crossing guide | 나루 안내인 / Crossing guide | GF |
| courier | 무전 중계 | Radio relay | 무전수 / Radio operator | GFA |
| courier | 교주의 말 전달 | Carrying the Word | 말지기 / Word Keeper | A |
| maintenance | 펌프 정비 | Pump maintenance | 펌프 정비공, 펌프조원 / Pump fitter | GFA |
| maintenance | 바람틀 정비 | Windmill maintenance | 바람틀 정비공 / Windmill fitter | GF |
| maintenance | 열 펌프 정비 | Heat-pump maintenance | 열 펌프 정비공, 열 펌프지기 / Heat-pump fitter | GFA |
| maintenance | 수차 정비 | Water-wheel maintenance | 수차지기 / Water-wheel keeper | FA |
| maintenance | 우물 정비 | Well maintenance | 우물 정비공, 굴착공 / Well fitter, Driller | GFA |
| maintenance | 취수구 정비 | Intake maintenance | 취수구지기 / Intake keeper | GFA |
| maintenance | 전선 정비 | Line maintenance | 전선 정비공, 전기공 / Lineman | GFA |
| maintenance | 부품 가공 | Parts machining | 부품 가공공 / Machinist | FA |
| maintenance | 차량 정비 | Vehicle maintenance | 차량 정비공 / Vehicle fitter | GFA |
| maintenance | 통신 정비 | Radio maintenance | 통신 정비공 / Radio fitter | GFA |
| maintenance | 공구 제작 | Tool making | 공구 장인, 수선공 / Toolmaker, Mender | GF |
| scout | 고물 채집 | Salvage gathering | 고물 채집꾼, 고물꾼 / Salvager | GFA |
| scout | 섬유 채집 | Fibre gathering | 섬유 채집꾼, 섬유 캐는 사람 / Fibre gatherer | GFA |
| scout | 테두리 정찰 | Edge watch | 테두리 정찰병, 테두리 망꾼 / Edge watcher, Rim watcher | GFA |
| scout | 탐사 | Survey | 탐사원 / Surveyor | GFA |
| scout | 정보 수집 | Intelligence gathering | 정보원, 국가정보원장 / Intelligence agent, NIS Director | GFA |
| scout | 동력 덩이 채집 | Power-core running | 동력 덩이 캐는 사람 / Power-core runner | FA |
| scout | 귀환 탐사 | Return crossing | 귀환 일행 / Return crosser | I |
| record | 장부 기재 | Ledger entry | 장부 서기, 동주민센터 서기, 구청 서기 / Ledger clerk | G |
| record | 명부 필사 | Register copying | 주민등록 원부 필사관, 명부 필사관 / Register copyist | G |
| record | 공문 필사 | Document copying | 공문 필사관, 부처 서기, 국회 서기 / Document copyist | G |
| record | 비서 업무 | Secretarial work | 대통령 비서실장, 비서관, 국회·당 사무총장 / Chief of Staff, Secretary, Secretary-General | G |
| record | 계약서 기록 | Contract records | 계약서 서기 / Contract clerk | F |
| record | 셈판 기록 | Tally-board keeping | 셈판 서기, 셈꾼 / Tally clerk, Tally keeper | FA |
| record | 세례록 기록 | Baptism roll keeping | 세례록 기록꾼 / Roll keeper | A |
| record | 교육 | Schooling and teaching | 교사, 학교 선생, 배우는 아이 / Teacher, pupil | GFA |

The Government has no `fitting` for the same reason as chapter 04 section 14.4 item 5 (no unit made of machine-bodied soldiers) and section 13.3 (the only place to maintain them is the Arc). The Free Cities' `이식 정비` (implant maintenance) is a skill left over from before the split (chapter 1 section 7.3).

### 8.3 `OCCUPATION_CLASSES` (v3)

Task 26 replaces the table at line 37 of `scripts/pages/ck3-stats.mjs` with this one. The order is part of the rule. While writing this chapter it was checked that every one of the 89 phrases of section 8.2 first-matches its intended class (provisional T08-54).

```js
export const OCCUPATION_CLASSES = [
  ['governance', ['국정', '행정', '운영', '통솔']],
  ['soldier', ['보병', '사격', '포병', '드론 조종', '전투', '참모', '지휘', '징집']],
  ['guard', ['경비', '순찰', '경호', '치안', '지킴']],
  ['medical', ['진료', '응급', '약품', '돌봄']],
  ['fitting', ['이식', '세례 집도', '충전']],
  ['provision', ['섬유당', '빛밭', '버섯', '벌레', '어로', '싹', '부엌']],
  ['labour', ['눈 굴', '제설', '땔감', '화덕', '메탄', '짐꾼', '옷 짓기']],
  ['trade', ['배급', '거래', '교섭', '계량', '물자', '배분', '환전', '증표']],
  ['courier', ['전령', '호송', '배차', '운전', '건넘', '무전', '전달']],
  ['maintenance', ['정비', '펌프', '수차', '부품', '제작', '가공']],
  ['scout', ['채집', '정찰', '탐사', '정보']],
  ['record', ['장부', '필사', '기록', '교육', '비서', '셈판']],
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

Ranks (`rank_ko`) are chosen from this list only. The 56 old rank words (군주, 영주, 조합원, 교도, 행자, 교우 and so on) are not used in v3. Army ranks are the Republic of Korea Armed Forces rank names as they are (chapter 04 section 14.1) (provisional T08-56).

| `rank_ko` | `rank` | Faction | Modifier |
|---|---|---|---|
| 대통령 | President | G | Diplomacy +2, Intrigue +1 |
| 국회의원 | Assembly Member | G | Diplomacy +1, Stewardship +1 |
| 장관 | Minister | G | Stewardship +2 |
| 차관 | Vice Minister | G | Stewardship +1, Diplomacy +1 |
| 청장 | Commissioner | G | Stewardship +2 |
| 총재 | Governor | G | Stewardship +1, Intrigue +1 |
| 원장 | Director | G | Intrigue +2 |
| 구청장 | Head of the District Office | G | Stewardship +1, Diplomacy +1 |
| 동장 | Dong Chief | G | Stewardship +1 |
| 역장 | Stationmaster | G | Stewardship +1 |
| 서기관 | Senior Secretary | G | Stewardship +1, Learning +1 |
| 사무관 | Deputy Director | G | Stewardship +1 |
| 주사 | Officer | G | Stewardship +1 |
| 서기 | Clerk | G | Learning +1 |
| 경찰관 | Police Officer | G | Martial +1 |
| 전문의 | Specialist | G | Learning +2 |
| 수련의 | Resident doctor | G | Learning +1 |
| 교사 | Teacher | G | Learning +1 |
| 등재민 | Registered resident | G | none |
| 이병 | Private | G | none |
| 일병 | Private First Class | G | none |
| 상병 | Corporal | G | Prowess +1 |
| 병장 | Sergeant | G | Martial +1 |
| 하사 | Staff Sergeant | G | Martial +1 |
| 중사 | Sergeant First Class | G | Martial +1, Prowess +1 |
| 상사 | Master Sergeant | G | Martial +1, Stewardship +1 |
| 소위 | Second Lieutenant | G | Martial +1 |
| 중위 | First Lieutenant | G | Martial +1 |
| 대위 | Captain | G | Martial +1, Prowess +1 |
| 소령 | Major | G | Martial +2 |
| 중령 | Lieutenant Colonel | G | Martial +2 |
| 대령 | Colonel | G | Martial +2 |
| 공작 | Duke | F (Gwanak) | Diplomacy +1, Stewardship +1 |
| 나루지기 | Ferry Keeper | F (Dongjak) | Diplomacy +1, Martial +1 |
| 장주 | Market Master | F (Yeongdeungpo) | Diplomacy +2 |
| 공장장 | Works Master | F (Guro) | Stewardship +1, Learning +1 |
| 경계장 | Edge Warden | F (Geumcheon) | Martial +1, Intrigue +1 |
| 기지장 | Depot Master | F (Yangcheon) | Stewardship +2 |
| 바람지기 | Wind Keeper | F (Gangseo) | Stewardship +1, Learning +1 |
| 구간장 | Section Chief | F | Stewardship +1 |
| 역반장 | Station Foreman | F | Stewardship +1 |
| 건널목장 | Crossing Chief | F (Dongjak) | Diplomacy +1, Martial +1 |
| 교대장 | Shift Chief | F (Yangcheon) | Stewardship +1 |
| 밭장 | Field Chief | F (Gangseo) | Stewardship +1, Learning +1 |
| 대주 | Bench Owner | F | Stewardship +1, Learning +1 |
| 작업조장 | Crew Chief | F | Stewardship +1 |
| 손 | Hand | F | Learning +1 |
| 일손 | Labourer | F | none |
| 견습 | Apprentice | F | none |
| 교주 | Hierophant | A | Diplomacy +1, Learning +2 |
| 곁집장 | Head of the Near House | A | Diplomacy +1, Intrigue +1 |
| 곁집 어른 | Near House elder | A | Diplomacy +1, Intrigue +1 |
| 대피소장 | Shelter Head | A | Stewardship +1 |
| 정비장 | Bench Keeper | A | Stewardship +1, Learning +1 |
| 호위장 | Guard Captain | A | Martial +1, Prowess +1 |
| 말지기 | Word Keeper | A | Diplomacy +1, Learning +1 |
| 곁집원 | Near House member | A | Intrigue +1 |
| 정비공 | Fitter | A | Learning +1 |
| 세례자 | Baptised | A | Prowess +1 |
| 미세례자 | Unbaptised | A | none |
| 후계 | Heir | GFA | Diplomacy +1 |
| 미등록 | Unregistered | I | none |

```js
export const RANK_MODIFIER = {
  '대통령': { diplomacy: 2, intrigue: 1 }, '국회의원': { diplomacy: 1, stewardship: 1 }, '장관': { stewardship: 2 },
  '차관': { stewardship: 1, diplomacy: 1 }, '청장': { stewardship: 2 }, '총재': { stewardship: 1, intrigue: 1 },
  '원장': { intrigue: 2 }, '구청장': { stewardship: 1, diplomacy: 1 }, '동장': { stewardship: 1 }, '역장': { stewardship: 1 },
  '서기관': { stewardship: 1, learning: 1 }, '사무관': { stewardship: 1 }, '주사': { stewardship: 1 }, '서기': { learning: 1 },
  '경찰관': { martial: 1 }, '전문의': { learning: 2 }, '수련의': { learning: 1 }, '교사': { learning: 1 }, '등재민': {},
  '이병': {}, '일병': {}, '상병': { prowess: 1 }, '병장': { martial: 1 }, '하사': { martial: 1 }, '중사': { martial: 1, prowess: 1 },
  '상사': { martial: 1, stewardship: 1 }, '소위': { martial: 1 }, '중위': { martial: 1 }, '대위': { martial: 1, prowess: 1 },
  '소령': { martial: 2 }, '중령': { martial: 2 }, '대령': { martial: 2 },
  '공작': { diplomacy: 1, stewardship: 1 }, '나루지기': { diplomacy: 1, martial: 1 }, '장주': { diplomacy: 2 },
  '공장장': { stewardship: 1, learning: 1 }, '경계장': { martial: 1, intrigue: 1 }, '기지장': { stewardship: 2 },
  '바람지기': { stewardship: 1, learning: 1 }, '구간장': { stewardship: 1 }, '역반장': { stewardship: 1 },
  '건널목장': { diplomacy: 1, martial: 1 }, '교대장': { stewardship: 1 }, '밭장': { stewardship: 1, learning: 1 },
  '대주': { stewardship: 1, learning: 1 }, '작업조장': { stewardship: 1 }, '손': { learning: 1 }, '일손': {}, '견습': {},
  '교주': { diplomacy: 1, learning: 2 }, '곁집장': { diplomacy: 1, intrigue: 1 }, '곁집 어른': { diplomacy: 1, intrigue: 1 },
  '대피소장': { stewardship: 1 }, '정비장': { stewardship: 1, learning: 1 }, '호위장': { martial: 1, prowess: 1 },
  '말지기': { diplomacy: 1, learning: 1 }, '곁집원': { intrigue: 1 }, '정비공': { learning: 1 }, '세례자': { prowess: 1 }, '미세례자': {},
  '후계': { diplomacy: 1 }, '미등록': {},
};
```

### 8.6 Default rank table and part counts in the Arc

**Default rank table.** In section 4.7 step 7 the rank is set by role and age. The age is already set (section 5.2) (provisional T08-57).

| Faction | Role → rank |
|---|---|
| Government | Member → 국회의원 (the President: 대통령). Dong Chief → 동장. Stationmaster → 역장. Minister → 장관. Vice Minister → 차관. Commissioner of the Korea Forest Service → 청장. Governor of the Bank of Korea → 총재. NIS Director → 원장. Head of the District Office → 구청장. Capital Defense Commander → 대령. Heir of an Assembly Member house → 후계. Ministry Director-General, Presidential Chief of Staff, secretaries, Secretaries-General of the Assembly and the parties → 서기관. Head of the medical corps, doctors among the health workers → 수련의 under 33, 전문의 above. District unit commander → 대위 (소령 at 34 or over). Capital Defense Command staff → 소령. Squad leader → 하사 under 26, 중사 above. Army soldiers → 일병 at 19, 병장 at 20 (18 months of conscript service, chapter 04 section 14.3), 하사 at 21-25, 중사 at 26-34, 상사 at 35 or over. Police officer → 경찰관. Clerks (community centre, district office, ministry, Assembly, master copy) → 서기 under 30, 주사 at 30-44, 사무관 at 45 or over. School teacher → 교사. Everyone else (skilled and labour work, market traders, dependants, spouses, kin and children of Assembly Member houses, bodyguards, coupon printers) → 등재민 |
| Free Cities | Head → the city's title. Section Chief → 구간장. Station Foreman → 역반장. Heir → 후계. Yangcheon Shift Chief → 교대장. Crossing Chief → 건널목장. Station Foreman who is also a Gangseo Field Chief → 역반장. Bench owner → 대주. Crew chief, squad leader of the watch duty → 작업조장. Hands, trade and contract, watch, Mountain Keepers, edge crew, the head's spouse and elders → 손. Apprentice → 견습. Labourers and household → 일손 |
| Arc | Hierophant → 교주. Head of the Near House → 곁집장. Shelter Head → 대피소장. Bench Keeper → 정비장. Near House elder → 곁집 어른. Rival → 곁집원 (a rival of the Head's siblings' or parents' generation → 곁집 어른, chapter 06 section 12.4; Yi Hong-won of section 7.2). Guard Captain → 호위장. Word Keeper → 말지기. S1 negotiator → 곁집원. Bench fitters, field fitters → 정비공. Baptised fighters → 세례자. House levies → 미세례자. Other roles → 세례자 if the part count is 1 or more, 미세례자 if 0 |
| Unaffiliated | 미등록 |

**Part count in the Arc.** The minimum part counts of chapter 06 section 3.5 (Head of the Near House 2, Shelter Head 1, Bench Keeper 3) are kept. To come close to the ratios of chapter 06 section 5.3 (one in six baptised; about 50% of the baptised with one part) these defaults are used, where `n` is the number in the id. The Hierophant's are not counted (no value, chapter 06 section 2.4). Head of the Near House `2 + (n mod 2)`, Bench Keeper `3 + (n mod 2)`, Shelter Head `1 + (n mod 2)`, Guard Captain 3, baptised fighters `2 + (n mod 3)`, Near House elders and rivals 2, fitters `1 + (n mod 2)`, Word Keepers, negotiators and the Hierophant's guards 1 (except Ji Yeon-hui, who came from the independents: 0, unbaptised, section 7.2), house levies 0, other roles 1 if `n mod 6 = 0`, otherwise 0. People outside the Arc have 0, except that a Free City person doing `이식 정비` (implant maintenance) and a Government licensed machine-body entry (chapter 04 section 13.3) may have 1 (provisional T08-58).

### 8.7 The words of chapters 04-06 and this chapter's slots

This table records which slot (title, rank, occupation) each role word used by chapters 04-06 reaches. If a role word not in this table appears, it is added by section 8.8 (provisional T08-16).

| Chapter | Word | Title (`title_ko`) | Rank | Occupation phrase |
|---|---|---|---|---|
| 04 | 종신 대통령 | 종신 대통령 | 대통령 | 국정 총괄 |
| 04 | 국회의원 | `<구> 국회의원` | 국회의원 | 구 행정 |
| 04 | 구청장 | `<구> 구청장` | 구청장 | 구 행정 |
| 04 | 장관, 차관, 청장, 부처 국장 | as is (ministry name first) | 장관, 차관, 청장, 서기관 | 부처 행정 |
| 04 | 한국은행 총재, 증표 인쇄공 | as is | 총재, 등재민 | 증표 발행 |
| 04 | 국가정보원장 | 원장 | 원장 | 정보 수집 |
| 04 | 수도방위사령관 (수방사령관) | 수도방위사령관 | 대령 | 군 지휘 |
| 04 | 구 부대 지휘관, 참모, 분대장, 국군 병사 | as is | section 8.6 | 군 지휘, 지휘 참모, 징집 보병 |
| 04 | 경찰관 | 경찰관 | 경찰관 | 치안 |
| 04 | 대통령 비서실장, 비서관, 국회 사무총장, 양당 사무총장 | as is | 서기관 | 비서 업무 |
| 04 | 국회 서기, 부처 서기, 동주민센터 서기, 구청 서기 | as is | section 8.6 | 공문 필사, 장부 기재 |
| 04 | 주민등록 원부 필사관 | 행정안전부 주민등록 원부 필사관 | 서기 | 명부 필사 |
| 04 | 의료단 단장, 보건소장, 보건 일꾼 | as is | section 8.6 | 진료 |
| 04 | 동장, 역장 (서울역 역장) | section 4.4 | 동장, 역장 | 동 행정, 역 행정 |
| 04 | 의원 집안 (heir, spouse, kin, child) | 의원 집안 후계 / occupation person name | 후계 / 등재민 | house trade (section 6.2) |
| 04 | 기능·노역 (펌프조, 열 펌프 정비, 섬유당 통지기, 전기공, 수선공, 출입구 일꾼, 고물·섬유 채집꾼, 빛밭 일꾼, 짐꾼, 벌목꾼) | occupation person name | 등재민 | 펌프 정비, 열 펌프 정비, 섬유당 통 관리, 전선 정비, 공구 제작, 눈 굴 지기, 고물 채집, 섬유 채집, 빛밭 경작, 짐꾼, 땔감 벌목 |
| 04 | 장터 상인, 학교 선생, 경호원, 부양 식구 | occupation person name | 등재민, 교사 | 장터 거래, 교육, 경호, 교육 (child) / 옷 짓기 (adult) |
| 05 | the seven heads | section 4.4 | that title | 도시 운영 |
| 05 | 이을 자식, the head's house elders and spouse | as is | 후계 / 손 | house trade |
| 05 | 구간장, 역반장, 밭장, 교대장 | section 4.4, as is | as is | 구간 운영, 역반 운영, 구간 운영, 도시 운영 |
| 05 | 대주, 작업조장 | `<bench name> 대주` (e.g. 천왕 통신대 대주), 작업조장 | 대주, 작업조장 | the bench's work (the livelihood of chapter 05 section 3) |
| 05 | 손, 견습 | occupation person name | 손, 견습 | the city's work |
| 05 | 장터 집안 사람, 셈판 서기, 계약서 서기, 짐꾼 무리의 우두머리, 환전꾼 | as is | 손 | 장터 거래, 셈판 기록, 계약서 기록, 짐꾼, 환전 |
| 05 | 건널목장 | `<crossing> 건널목장` | 건널목장 | 나루 건넘 안내 |
| 05 | 지킴 몫의 분대장, 지킴 손, 산지기, 경계조 | as is | 작업조장 / 손 | 지킴 몫, 테두리 정찰 (edge crew) |
| 05 | 일손, people from the Government ledger, people who crossed and came back, household | occupation person name | 일손 | 짐꾼, 동력 덩이 채집 (those who came back), 옷 짓기 (household) |
| 06 | 교주, 곁집장, 대피소장, 정비장 | section 4.4 | as is | 신앙 통솔, 곁집 통솔, 대피소 통솔, 정비대 통솔 |
| 06 | 맞수, 곁집 어른 | the seat of `<구> 곁집 맞수`, title is the occupation person name / `<구> 곁집 어른` | 곁집원 / 곁집 어른 | house trade / 곁집 통솔 |
| 06 | 호위장, 세례 전투원, 가문 징집병, 교주 호위 | as is | 호위장, 세례자, 미세례자, section 8.6 | 군 지휘, 세례 전투, 가문 징집, 경호 |
| 06 | 정비공, 야전 정비공, 돌봄이 | as is | 정비공 / section 8.6 | 이식 정비, 세례자 돌봄 |
| 06 | 수차지기, 취수구지기, 열 펌프지기, 출입구지기 | as is | section 8.6 | 수차 정비, 취수구 정비, 열 펌프 정비, 눈 굴 지기 |
| 06 | 섬유당 통지기, 빛밭지기, 버섯 굴지기, 얼음 낚시꾼, 부엌 일꾼 | as is | section 8.6 | 섬유당 통 관리, 빛밭 경작, 버섯 재배, 얼음 어로, 부엌 취사 |
| 06 | 셈꾼, 교섭인, 세례록 기록꾼, 말지기 | as is | section 8.6, 말지기 | 셈판 기록, 계약 교섭, 세례록 기록, 교주의 말 전달 |
| 06 | 고물꾼, 섬유 캐는 사람, 테두리 망꾼, 동력 덩이 캐는 사람, 전령 | as is | section 8.6 | 고물 채집, 섬유 채집, 테두리 정찰, 동력 덩이 채집, 전령 |

If a role allows several occupations (chapter 04's "skilled and labour work", chapter 05's "the city's work"), choose by the preference of section 4.7 step 5.

### 8.8 How to add new words

If chapters 04-06 or task 9 use a new occupation or rank, it is added as follows.

- **Occupation.** If the new phrase first-matches its intended class in the section 8.3 table, just add a row to the section 8.2 list. If it does not, add a word to that class in the table, checking that the first match of the existing 89 phrases does not change.
- **Rank.** Give one modifier (+1) or two (+1 and +1, or +2 on one stat) by the nature of the rank's work: governing is Stewardship or Diplomacy, fighting is Martial or Prowess, knowledge is Learning, watching and intelligence is Intrigue. Also add its minimum age to the section 5.1 table.
- **Role word.** Add a row to the section 8.7 table setting its title, rank and occupation slots.

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
| `row` | string | Y | the quota-table row received in section 4.7 step 3. A district name (e.g. `종로구`), `교주의 집`, `강남구(장부 밖)`, or `none` for the unaffiliated |
| `role` | string | Y | the name of the role cell received in section 4.7 step 4. The role word of the chapter 04-06 tables as it is (section 8.7) |
| `seat` | object or `null` | Y | section 4.3. `{"layer":"head"}`, `{"layer":"district","titleId":"geography:duchy:11110"}`, `{"layer":"dong","regionId":"region:1111051500"}` (Government dong, Arc shelter), `{"layer":"section","sectionId":"section:구로구:신도림"}` (Free City section), `{"layer":"station","stationId":"서울역"}`, or `null` with no seat |
| `tier` | `T1`-`T5` | Y | section 4.2. Task 26 checks it against `role` |
| `stage` | `Key` \| `S1`-`S4` | Y | section 4.1. The current 050 value (only the four changes differ) |
| `title_ko`, `title_en` | string | Y | section 4.4. Empty only for Sin Jun (Q8) |
| `position_ko`, `position_en` | string | Y | section 4.4. Empty only for Sin Jun (Q8) |
| `rank_ko`, `rank_en` | string | Y | section 8.5 list, section 8.6 default rank table. English is the list's `rank` column |
| `occupation_ko`, `occupation_en` | string | Y | section 8.2 list |
| `location` | `{"workStationId": "...", "homeStationId": "..."}` | Y | section 4.6. Both are `map_station.id` |
| `household` | `{"id": "...", "role": "head" \| "member" \| "single"}` | Y | the three households of section 6.1 use `hh:<head's id>` with head/member; everyone else `hh:<own id>` with single |
| `liege` | `person-NNNN` or `null` | Y | the liege rule of section 9.4. Task 26 recomputes and compares it |
| `partCount` | integer ≥ 0 or `null` | Y | section 8.6. 0 outside the Arc (two exceptions), `null` for the Hierophant |
| `age` | integer | C | only the 511 without a recorded age. The section 5.2 value. Task 26 recomputes and compares it |
| `biography_ko`, `biography_en` | string, 2-6 sentences | Y | section 9.3 |
| `kinBasis` | array `[{"dir": "outgoing" \| "incoming", "from": "...", "to": "...", "basis_ko": "...", "basis_en": "..."}]` | C | only the 6 people with a Kinship relation in 090 (0086, 0090, 0399, 1005, 1009, 1010). One per Kinship entry of 090, in the same order. `from`, `to` and `dir` are as in 090; only `basis` is newly written |
| `ties` | array `[{"to": "person-NNNN", "type": "...", "basis_ko": "...", "basis_en": "..."}]` | K | two or more for Key, one or more for S1; may be empty for the rest. `type` is one of Contract, Oath, Master and Disciple, Rivalry, Debt, Grudge, Protective Residence (Korean 계약, 맹세, 스승과 제자, 경쟁, 빚, 원한, 보호체류). Must agree with the between-faction relations of section 11 |
| `traits` | array, at most 2 `[{"id", "name_ko", "name_en", "description_ko", "description_en", "behavior_ko", "behavior_en", "stress_ko", "stress_en", "relationship_ko", "relationship_en"}]` | K | one or more for Key. No effects (section 8.1) |
| `skills` | array, at most 3 `[{"id", "name_ko", "name_en", "rating"}]` | K | one or more for Key. `rating` is 1-100 |
| `portrait` | object | C | only people with a portrait token and no picture (`image.sha256`) (486 people). The table below |
| `retinue` | object | C | Min Ung-gi (1008) only. Section 9.4 |
| `nonKoreanFamilyBasis` | `{"familyId": "...", "basis_ko": "...", "basis_en": "..."}` | C | on exactly one line per non-Korean family (100 `nonkorean_family`): in the faction file that holds most of the family's members, the line of the member with the smallest id in that file (on a tie, the files in the order Government, Free Cities, Arc). The sentence shape of section 10.4 |
| `ledger` | array of strings | Y | ledger numbers of items newly invented about this person; empty array if none |

**Keys of the `portrait` object.** They follow the token's current languages. A token writes the upper garment (`artProposal.upper`, `artProposal.outfit`, `slots.outfit.upper.value`) in Korean and the other clothing slots in English (e.g. person-0001's upper garment "문양 없는 탁한 청회색 작업 외투"). So `upper_ko` and `outfit_ko` are not typos but Korean slots (provisional T08-89).

| Key | Where it goes |
|---|---|
| `upper_ko` | `artProposal.upper`, `slots.outfit.upper.value` |
| `outfit_ko` | `artProposal.outfit`. If it equals the upper garment, as in the current tokens, use the same value as `upper_ko` |
| `lower_en` | `artProposal.lower`, `slots.outfit.lower.value` |
| `footwear_en` | `artProposal.footwear`, `slots.outfit.footwear.value` |
| `headwear_en` | `slots.outfit.headwear.value`, and `artProposal.headwear` in the one token that has it |
| `neckline_en` | `slots.outfit.neckline.value` |
| `accessories_en` | `artProposal.accessories`, `slots.accessories.description.value` |
| `accessoriesColor_en` | `slots.accessories.color.value` |
| `accessoriesMaterial_en` | `slots.accessories.material.value` |
| `accessoriesMounting_en` | `slots.accessories.mounting.value` |
| `accessoriesShape_en` | `slots.accessories.shape.value` |
| `palette` | `artProposal.palette` (three colour names) |
| `descriptionRole_en` | only tokens that have `artProposal.description` (16). The place of the role sentence before the first semicolon (;) |

The clothing content follows the clothing rules of chapter 04 section 11, chapter 05 section 9 and chapter 06 section 9.

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
| 050 `tier`, `stage_ko`, `state_id`, `state_name`, `state_name_ko` | sections 4.2, 4.1, 4.5 |
| 090 mirror keys (`title`, `position`, `rank`, `occupation`, `stage`, `state`, `stateName`, `commonTier`) | the 050 values as they are. English `json` takes the English columns, `json_ko` the Korean columns |
| Stats | section 8 |
| The four age values | section 5.2 |
| `minors` | age < 18 |
| Liege (`liege`) | A station seat holder's liege is the seat holder of the dong the station belongs to, or the district head if there is none. A dong seat holder's liege is the district head. A district head's liege is the President for Life in the Government, the Hierophant in the Arc, and none in the Free Cities. A T2 person's liege is the house's seat holder for a house heir; otherwise the President for Life in the Government, the Hierophant in the Arc, and the district head in the Free Cities. Only these four T5 groups have a liege; all other T5 people have `null`. (a) People of the presidential office cell of chapter 04 (bodyguards, secretaries) → the President for Life. (b) People of the Hierophant's house row of chapter 06 (Ji Yeon-hui included) → the Hierophant. (c) T5 people of the Assembly Member house, head's house and Near House cells (spouses, kin, children, elders) → that house's seat holder (Member, city head, Head of the Near House). (d) I Yeon → Jo Jaepyo (provisional T08-59) |
| `directLiege`, `court` | built from the liege relation. `court.id` is `court:<characterId or person id>` |
| Command entries of `relations` | for each liege relation, one outgoing entry (on the subordinate) and one incoming entry (on the liege). The basis sentence is "<liege title> <liege name>의 직속" / "Directly under <liege title> <liege name>" (provisional T08-60) |
| Holdings (`confirmedHoldings`, `subordinateHoldings`, 123 `map_holding`) | one per seat. id `holding:v3:<duchy\|dong\|station>:<code>`, names "<구> 공작령" (en "<District> duchy"), "<동>" (en "<Dong>"), "<역>역" (en "<Station> Station"). `holderPersonId` is the `characterId` if there is one, otherwise the person id. `subordinateHoldings` are the holdings of direct subordinates (provisional T08-61) |
| 115 `retainer_graph` | rebuilt as one row from the whole liege relation. Node id is the `characterId` if there is one, otherwise the person id |
| `values` | section 9.5 |
| The `household` object | `personFaith`: `baptised` for Arc people with part count ≥ 1, `unbaptised` for Arc people with 0, `fitted` for people outside the Arc with part count ≥ 1, otherwise `none`. `houseFaith`: the household head's `personFaith`. `humanoidAdmission`: `admitted` if `retinueGroups` has humanoids, otherwise `none` (provisional T08-62) |
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
| `tier` | REDESIGN | section 4.2 |
| `occupation`, `occupation_ko` | REDESIGN | section 8.2 |
| `gender`, `gender_ko` | FIXED | |
| `stage`, `stage_ko` | REDESIGN | section 4.1 |
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
| 100 `nonkorean_family.basis`, `basis_ko` | REDESIGN. Write the facts "descendants of a ○○ line that settled in Seoul before the Great Blackout and now living in the stations of ○○; they do not use the bongwan or generation syllables of Korean clans", fitted to each family. Migrant corridors (a retired concept of chapter 1 section 10) are not used. Written through the `nonKoreanFamilyBasis` slot of the input file (section 9.2), by the task (17-19) of the faction that holds most of the family's members (provisional T08-70) |
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

**Small site fixes handed on.** Task 26 fixes two things at the same time. (1) `charToPerson` in `site/build.mjs` also accepts a person id as it is, so that the holdings and retainer nodes of seat holders without a `characterId` show by name. (2) The faith value labels (`FAITH`) in `site/people.mjs` are changed to the v3 values (`baptised` 세례받음, `unbaptised` 미세례자, `fitted` 이식, `none` 없음). The old Christian value labels are removed.

## 11. Life between the factions

Basis: chapter 1 section 3.4 (the Han; there is nowhere to hide on the frozen river), section 5.2 (water supply contract), section 5.6 (control of each link), section 7.4 (why they need and fear each other, the thirteen boundary links), section 9 (the Government's failed ice crossing of 2079, the checkpoints at the under-river tunnels), Bible section 1 row 11, sections 2.1-2.3.

### 11.1 Crossings

The line links where the faction changes are thirteen (chapter 1 section 7.4). This chapter decides how they are crossed (provisional T08-72).

| How | Where | Who keeps it | When | What crosses |
|---|---|---|---|---|
| Under-river tunnel | Mapo–Yeouinaru (Government↔Free City), Gwangnaru–Cheonho, Seoul Forest–Apgujeong Rodeo (Government↔Arc) | The Government's ledger checkpoints at the north entrances (since 2079). The south entrances are kept by Yeongdeungpo (Yeouinaru) and the Arc | Any time. Warm and sheltered | Contract workers, envoys, traders with passes, contract goods. The three tunnels carry most legal trade |
| Bridge | Yongsan–Noryangjin, Hapjeong–Dangsan, Ichon–Dongjak, Digital Media City–Magongnaru (Government↔Free City), Gangbyeon–Jamsillaru, Oksu–Apgujeong, Jayang–Cheongdam (Government↔Arc) | The north end of a bridge is kept by the Government's army (units directly under the Capital Defense Command, chapter 04 section 14.1), the south end by that district's city or Near House. The Noryangjin and Dongjak ends are the work of the Dongjak Ferry Keeper | Daytime in the long-light half, only without a blizzard. Closed when the wind passes 15 metres per second | Heavy loads on sledges (firewood, salvage, bundles of fibre). People trying to avoid the tunnel checkpoints |
| Ice | anywhere on the Han | No one keeps it. That is why it is dangerous | Night in the long-dark half. The darkness covers the kilometre with nowhere to hide | Smuggling, flight that accepts being struck off, urgent messages of the return network |
| Land border | Sadang–Bangbae, Chongshin Univ. (Isu)–Naebang, Dongjak–Gubanpo (Free City↔Arc) | The Dongjak Ferry Keeper on the Free City side, the Seocho Near House on the Arc side | Any time | Parts and technicians, charged cells, comings and goings of divided houses. The quarrels of the two polities that split apart are also fought here |

- **A Government person needs a pass to cross the river.** The Dong Chief issues one for each crossing, and for contract work the seal of the district's Assembly Member is added. A registered resident who crosses without a pass is struck off. Someone struck off as of unknown residence can get back onto the ledger through a registration review, but once the striking-off review confirms a penalty strike-off, they can never return (chapter 04 sections 5 and 7.2).
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
| Arc → Government | Maintenance of machine bodies mended at the benches (taken under a Ministry of Health and Welfare machine-body registration, chapter 04 section 13.3; taking it without a permit is the forbidden trade below), river fish |
| Government → Arc | Not blocking the north end of the weir on the Gwangjin side. The biggest thing the Government gives the Arc is not an object but letting the wheel turn |

- Legal trade goes through the three tunnels and the land border to the markets. The big markets are Yeongdeungpo and Yeouido (opened by the Yeongdeungpo Market Master) and Dongjak (where the three polities meet).
- The Government keeps the principle that it does not trade with those off the ledger. So all Government trade takes the form of a "contract": the ledger does not buy and sell; the ledger makes agreements.
- What prices are counted in is decided by chapter 03 (the scarcity economy) and chapters 04-06. This chapter only decides what moves and by which way.

### 11.3 Smuggling

Where something is forbidden, there is smuggling (provisional T08-74).

| What | From where to where | Why it is forbidden | If caught |
|---|---|---|---|
| People (registered residents fleeing the ledger) | Government → south of the river, over the ice | Registered residents cannot change where they live or what they do (Bible section 2.1 [Approved]) | Struck off. If caught north of the river, sent to the striking-off review; short of a penalty strike-off, given a labour penalty or a forced transfer (chapter 04 section 7.3) |
| Unlicensed machines and baptism | Arc benches → Government soldiers and elites | The Government registers only licensed machine bodies, as medicine (chapter 04 section 13.3). An unlicensed machine and baptism count as joining an organization off the ledger | Striking-off review (chapter 04 sections 13.3 and 7.3). A licensed machine-body entry is not smuggling |
| Charged cells | Arc (Jamsil) → Government | The Government does not write in the ledger that it leans on the Arc's power | Confiscated |
| Old official papers | Government → Free Cities (as fibre) | Not eating ledgers and old official papers is the Government's taboo | The Ministry of Justice's striking-off review (the district's Assembly Member submits an opinion, chapter 04 section 7.2). One of the heaviest crimes |
| Salt and seed | everywhere | Scarcer every year. The Government binds them as rations, the cities as contract goods | Confiscated |
| Fake parts | Free City workshops → everywhere | Each city sells under a guarantee bearing the name of its bench | That bench is driven out of that city's markets |
| Power cores brought from outside | rim → Seoul | A power core that did not go through the return network leaves no ledger record of who came back | Confiscated on Government land, a share taken elsewhere |

### 11.4 Marriage

- **Government.** A marriage exists only when the Dong Chief enters it in the ledger. A marriage to a person off the ledger is entered only when that person passes a registration review. Water supply contracts include a clause that registers the families of a few technicians each year (provisional). Children are registered at the station where the household is registered (provisional T08-75).
- **Free Cities.** A marriage is a household contract made by two houses. Monogamy, contract cohabitation and contracts of several people living together all take the same contract form. A marriage with a person of another city leaves a contract in the markets of both cities.
- **Arc.** A house that comes close to the Hierophant through marriage becomes a Near House (chapter 1 section 7.3), so a Near House marriage is politics. Baptism is not a condition of marriage. An unbaptised spouse lives as one of the unbaptised.
- **Kin across the river.** 92 of the 126 generation lines are spread over two or more factions (section 6.4). There are two causes. One is 2036-2045, when the north of the river bound its ledger into one: even within one house, the people at stations the clerks reached became registered residents, and the people across the river went off the ledger. The other is 2122, when the Arc split off: Free City houses living in the shelters of Gangnam simply became the Arc. So cousins of the same generation live on both sides of the river and on both sides of the Dongjak–Seocho border. This kinship is the most common thread of smuggling and of diplomacy (provisional T08-76).

### 11.5 Diplomacy

- **The Government and the Free Cities.** The water supply contract is the centre of diplomacy (Bible section 1 row 11, chapter 1 section 5.2). The National Assembly does not ratify the contract. A ministry signs a maintenance service annex for each facility, the Assembly Member of the district where the facility stands seals it too, and the President signs it off (chapter 04 section 15). Ministry people and those Assembly Members go to the contract meeting. The OMO Party wants to widen the contract and the Claw Party to narrow it (chapter 1 section 7.1). Because the Government does not see those off the ledger as its people, it writes the cities across the river in the annex as "work crews engaged for the service" (chapter 04 section 15).
- **Among the Free Cities.** There is no one above them, so when something must be decided together they hold a contract meeting. The head of the hosting city is the Host (chapter 1 section 7.2). What a contract meeting agrees binds only the cities that set their seals to it.
- **Arc.** Near House people carry the Hierophant's word. The Arc sits at the third water supply contract for the first time (chapter 1 section 5.2). For the water supply contract the negotiating is done by the negotiators of the Hierophant's household, and the seal is set by a Head of the Near House who has received the Hierophant's word (chapter 06 section 7.4). The Seocho Near House, which faces the Dongjak–Seocho border, is the standing envoy for the business of the border.
- **Guarantors.** What makes a contract hold is a guarantor. For the term of a contract the Free Cities send a few hands to the other side's stations to keep the pumps, and the Government sends gangs of registered workers. A guarantor lives on the other side's land but is a person of their own faction (section 11.6) (provisional T08-77).

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

Basis: Bible section 2.5 [Approved] (D3: the commander commands every squad; each faction has its own roster, and the deliberately empty slots are its identity; figures only in SQL), section 1 rows 5, 14 and 15, `docs/design/roster-framework.md` (TW:WH-calibrated scales), chapter 1 sections 4.3, 5.6 and 7.4, chapter 03 (about 11,000 baptised in the Arc, about 100 kW of body-machine charging across Seoul), chapter 04 section 14, chapter 05 section 11, chapter 06 section 11. The three chapters' doctrines come before this section. This section carries those doctrines into the words of the unit rosters.

### 12.1 What is kept

The unit rosters (`data/sql/130`-`132`) keep the following in v3.

- **D3.** One army, one commander, and the commander commands every squad. No squad has authority to move on its own. Individual resolution battles (duels, fights of heroes) remain. The Government reads this as command by signature (chapter 04 section 14.2), the Free Cities as the single command sheet (chapter 05 section 11.3), the Arc as the Near House's army (chapter 06 section 11.1).
- **TW:WH-calibrated scales.** The ranges of the numeric columns (`roster-framework.md` section 1.2), the squad size, hit point and speed bands per category (sections 1.3 and 1.4), the leadership bands per tier (section 3.2), the rarity ratio (section 3.3: tiers 4-5 at most 30%, rosters of 18-26), the cost bands and upkeep ratio (section 5.1), the six scarce-input words and their rules (section 6), the category counter table (section 8) and the category counts per faction (section 9.1) are not changed.
- **Names.** No real brands or other games' unit names (Bible section 4).

What changes in v3 is the units' names, equipment, appearance, building names, and the reasons for the gaps and scarcities.

### 12.2 Size of the forces

| Faction | Population | Forces | Make-up | Basis |
|---|---|---|---|---|
| Government | about 160,000 | about 4,000 professional soldiers and about 2,500 conscripts in service. About 20,000 reservists can be called | Conscription at nineteen, 18 months of service. Professional soldiers come from army households | chapter 04 section 14.3 |
| Free Cities | about 75,000 | No standing army. The watch duty owed by the benches, and hands bought by contract (contract forces) | When fighting comes, the head calls up the watch duty | chapter 05 section 11.1 |
| Arc | about 65,000 | Five armies standing in peacetime (the four Near Houses and the Hierophant's house guard). Of the about 11,000 baptised, the baptised fighters are those with two parts or more and aged twenty or over | Each Near House gathers house levies and baptised fighters | chapter 06 sections 11.1 and 11.5, chapter 03 |

The hands the Free Cities can call up at once through watch duty are set at about 1,100, and the hands they can buy in addition by contract at about 600. The Arc's baptised fighters are set at about 1,300 (provisional T08-79). Since a squad is 20-80 people (`roster-framework.md` section 1.3), the `unit_cap` of each unit is set so as not to exceed these sizes.

### 12.3 Government

**Doctrine.** The five lines of chapter 04 section 14.4 are the Government's doctrine: an army that holds, that does not cross the river as an army, that fights with numbers, that records every round, and that has no machine-bodied soldiers. The Government is where the arsenals and vehicle depots of the Republic of Korea Armed Forces survived, so it is the faction with the most artillery and armoured vehicles. But ammunition and the power that moves vehicles (large batteries and power cores, chapter 03 section 7.1) are not newly made (provisional T08-80).

| Item | Content |
|---|---|
| Strengths | Many levy infantry and reservists. Checkpoint garrisons. Edge reconnaissance on the mountain side. Riflemen, mortars and a few drones directly under the Capital Defense Command (flown only on the commander's signature) |
| Deliberately empty slots | **No machine-body units.** Government people can register a licensed machine body with the Ministry of Health and Welfare (chapter 04 section 13.3), but since the only place to maintain it is the Arc, no unit is formed of such soldiers (chapter 04 section 14.4 item 5). **No hired units.** People off the ledger are not taken into the army. **Engineers and maintenance are thin.** The hands that mend bridges and tunnels are borrowed from the Free Cities through the water supply contract (chapter 04 section 14.5). **Tier 1-2 levies have low morale.** They are people called out of inherited work at nineteen |
| Scarcities | Ammunition, fuel (`fuel`: there is no oil in v3, so it means charge for the large batteries and the power cores that move armoured and rail vehicles, chapter 03 section 7.1). Cases are returned, and reloading relies on Free City benches |
| Recruitment | The Ministry of National Defense and the district units (chapter 04 section 14.1). The chain shapes are as in `roster-framework.md` section 4.2; only the names change to v3 (section 12.8) |
| Commanders | President for Life, Capital Defense Commander, district unit commanders (recommended by the Assembly Member and appointed by the Ministry of National Defense, chapter 04 section 14.1), officers of captain and above. Assembly Members can go along as attached heroes |
| Where it fights | The north checkpoints of the three under-river tunnels, the north ends of the seven bridges, the rim watchtowers of the northern mountains |

### 12.4 Free Cities

**Doctrine.** Chapter 05 section 11 is the Free Cities' doctrine. There is no standing army, fighting is done by contract, and cities that fight together sign a single command sheet. They do not fight on the frozen river, they hold the crossings and tunnels, they cut heat and air, they count every round, and they use drones and jamming (provisional T08-81).

| Item | Content |
|---|---|
| Strengths | Drones and electronic jamming. Field repair and engineers. Rail carts. Marksmen who save rounds |
| Deliberately empty slots | **No infantry that pushes with numbers (at most one tier 1 infantry unit).** They cannot bind hands with a ledger and field many people at once (chapter 05 section 11.5). **No tier 5.** No single city can keep alive a machine that can never be rebuilt, and there is no elite held by the cities together. **Heavy armour stops at tier 4.** There are no rounds to feed big guns, and armoured carts run on cells. **Few commander escorts (1-2).** There is no seat above |
| Scarcities | Cells, machine parts. Windmills charge the cells, but blizzards and cold weaken them |
| Recruitment | Watch duty and contract forces. Chain shapes as in `roster-framework.md` section 4.3, with building names changed to chapter 05's words (bench, watch duty, contract) |
| Commanders | The head of the city that raised the army, or the person to whom the head gave command by contract (chapter 05 section 11.2). Under a single command sheet one person holds the squads of several cities |
| Where it fights | Bridge ends, the Mapo–Yeouinaru under-river tunnel, the three land crossings with the Arc (chapter 05 section 11.4) |

### 12.5 Arc

**Doctrine.** Chapter 06 section 11 is the Arc's doctrine. Each Near House keeps an army, and its commander is the Head of the Near House or a Guard Captain the Head chooses. Squads come from house levies, baptised fighters, support squads led by field fitters, and revived old machines. They come back before the parts run dry (provisional T08-82).

| Item | Content |
|---|---|
| Strengths | Baptised melee infantry across tiers 1-5. High morale. Many commander escorts. Old machines revived at the old Godeok depot (the parts salvaged from the store of the old Suseo depot, chapter 03 section 7.3) that can never be rebuilt |
| Deliberately empty slots | **No drones.** Cells and parts go first to the charging and fitting of baptism (chapter 06 section 11.2). **No artillery.** In close tunnel fighting baptised fighters are stronger than guns. **Few missile units, and they stop at tier 3.** **Only four districts of territory, so the roster is small (18-22 units)** |
| Scarcities | Implant parts, medicine. If parts are cut off, the baptised elite weakens all at once. Charging the bodies is counted as part of implant upkeep (no new scarcity word is made) |
| Recruitment | The Near Houses and the Hierophant's house. Chain shapes as in `roster-framework.md` section 4.4 |
| Commanders | Hierophant, Heads of the Near Houses, Guard Captains |
| Where it fights | The eight boundaries of chapter 06 section 11.3: the three land borders (Seocho), the Gwangnaru–Cheonho tunnel (Gangdong), the Seoul Forest–Apgujeong Rodeo tunnel (Gangnam), the south end of the Jamsil weir |

### 12.6 Battlefields and seasons

- **Tunnels and platforms.** The warmest places and where most fighting happens. Narrow and dark. The `tunnel-fighter` tag comes alive.
- **Concourses and entrances.** A fight to take a station begins in the entrance shafts. The Free Cities make a station unbearable with its fans and entrances (chapter 05 section 11.4).
- **Bridges and the surface.** Wind and cold wear people down before the fighting does. `thin-clad` and `frost-hardened` decide things here.
- **The ice.** None of the three factions crosses it as an army (the failure of 2079, chapter 1 section 9). Only small raids cross.
- **Seasons.** In the long-light half, surface operations are easy. In the long-dark half, light runs short and the eyes of drones and marksmen both grow short. During the 2-4 days of a blizzard, surface fighting stops, and drones fly only on days when the wind is under 10 metres per second (chapter 03 section 6.1). The outside machines are blinded at the same time (provisional T08-83).

### 12.7 Commanders come from the people ledger

Commanders and attached heroes come from among the 1,022 (`roster-framework.md` section 10.2).

- **Who can be a commander.** A person holding a seat or rank listed in the "Commanders" row of sections 12.3-12.5.
- **Who can be an attached hero.** A Key or S1 person with Martial or Prowess of 9 or more. An army has at most four attached heroes by default (chapter 09 section 3.4, `roster-framework.md` section 10.2, provisional T29-7).
- The formula by which a commander's Martial sets the presence-radius bonus (the pending default of `roster-framework.md` section 10.6) is calculated with the v3 stats of section 8.

(provisional T08-84)

### 12.8 Words to change in the unit framework and rosters

When task 20 revises `roster-framework.md` and the 130-132 rows to v3, it changes these words (new names provisional T08-85).

| Now | Why | v3 |
|---|---|---|
| The name of the third-stage building of the Government levy chain and of the rows it produces, the name and equipment text of the Government head's escort unit, the seal name in the appearance text | They carry the Government title from before the 2026-11-13 correction and the retired electoral-district concept (선구, chapter 1 section 10) | 국회의원 근위청 (Assembly Member's Guard Hall), 국회의원 근위 수행대 (Assembly Member's Sworn Retinue), seal of the Assembly Member's house |
| The Arc's "가문 수장 호위대" and "가문 본청" | The title of an Arc district head is Head of the Near House (chapter 1 section 8.3) | 곁집장 호위대, 곁집 본청. The name of the house levies (가문 징집병) stays as it is, as chapter 06 section 11.1 says |
| The owner's comparison words left in the section 9.2 identity table and basis sentences (the words of the third, fifth and sixth rows of the left column of the chapter 1 section 2.4 table) | Comparison words are not used in the world's text (chapter 1 section 2.4) | the army of the ledger / the armies of cities that stand apart / there is no seat above |
| The old title in the section 4.2 basis sentence | Same reason | Member of the National Assembly |

Task 9 has already changed the framework side of this table (`roster-framework.md` section 4.2 basis and building name, 4.3 basis, the 4.4 House Seat Hall, 8.3, 9.2, the 11.1 markers and 13 P1) (chapter 09 section 7, item 9). Task 20 brings the names and texts of the 130-132 rows into line with the same words.

The four lines each of `FACTION_GAPS` in `site/build.mjs` keep the same meaning in v3, so they need not change. The reason sentences are taken from sections 12.3-12.5 of this chapter.

## 13. The winter ratchet: turns and notch size

Basis: chapter 1 section 3.7 (the winter ratchet, game rule table: "if winter pressure stays above 1 for a year"), section 11 item 3 (chapter 07 decides the turn unit and the notch size), section 3.1 (surface temperature), section 3.2 (long-light half and long-dark half).

| Value | Definition |
|---|---|
| Turn | One month. A year is twelve turns. The April-September turns are the long-light half; the October-March turns are the long-dark half |
| Winter pressure | Each turn, Seoul population ÷ Seoul capacity (chapter 1 section 3.7) |
| Notch check | Count consecutive turns with winter pressure above 1. A turn at 1 or below resets the count to 0. When the count reaches 12 (one year), the ratchet tightens one notch and counting starts again from 0. This carries chapter 1 section 3.7's "stays above 1 for a year" into turns |
| One notch | The whole surface temperature band (the annual mean, long-light half, long-dark half and blizzard night of chapter 1 section 3.1) drops by 2 degrees. Light-field harvest becomes 85% of its value at that time. Windmill capacity factor becomes 95% of its value at that time |
| Release | None. Even if the population falls, a notch does not come back |
| Opening | Winter 2126. Notches tightened: 0, and the count is 0. It has not tightened since it stopped around 2032 |

(provisional T08-86)

## 14. Private setting

> **Private.** This subsection is for design. It is not carried into the public wiki, public in-game text or the showcase.

- Go Ye-jin's work station is Jamsil, where the Hierophant's house is (chapter 06 section 2.3). How she reaches the offering room under the old Suseo depot (Q11's proposal) and the sanctuary follows chapter 06 section 15 (sections 15.1 and 15.2). This chapter does not set that place, and does not write it in public prose or in biographies.
- Matters of Q12 (the sanctuary's location, who chooses the brains, whose the first brain was, who reads the output) are not dealt with in this chapter.

## 15. Owner questions and this chapter's defaults

This chapter does not write unanswered questions as approved. For the following questions it used the recommended defaults as provisional. If the owner answers otherwise, the rows concerned are placed again.

| Question | This chapter's provisional default | Where used |
|---|---|---|
| Q5 Ji Yeon-hui's base and affiliation | Affiliation Arc, as the Q5 recommendation. Location the Hierophant's house (Jamsil) of chapter 06 section 2.3 instead of the Q5 recommendation (the Suseo area) | sections 3.2, 7.2 |
| Q6 the city where Go Ye-jin grew up | not decided. The biography says only "grew up in a Free City" | section 7.2 |
| Q7 Oh Hae-rin's title | "원장" kept. NIS Director (chapter 04 section 16.4) | section 7.2 |
| Q8 Sin Jun | no new role. Title and position empty | section 7.2 |
| Q18 lords outside Seoul | not deleted; re-placed into seats inside Seoul | section 7.1 |
| Q19-Q27 | the recommended wording of each question, seats from chapters 04-06 | section 7.2 |
| Q24 Nam Yun-gyeong | Head of the Songpa Near House as chapter 06's default, with "아크 수석 신도" added to the position. If the answer comes with the recommended value, the Head of the Songpa Near House is Jeong Seoon | section 7.2 |
| Q28 Yun Seo-rin | sitting President for Life. The Jongno-gu seat goes to Yun Choa, heir of the President's house | sections 7.2, 7.3 |
| Q29 the 8 old heads of state | the seats set by chapters 04-06. If the head seat of the base district is taken, T2 of that district | section 7.2 |
| Q30 Sin Jong-mok's affiliation | Government kept (chapter 04 Gangnam-gu row) | section 7.2 |

## 16. Handed on to later tasks

1. **Task 9.** Align this chapter's occupation list (section 8.2), rank list (section 8.5) and word table (section 8.7) with the final words of chapters 04-06. New words are added as in section 8.8. Exempt the data-key code spans of the section 10 tables from the banned-vocabulary scan (T08-65). Gather the four stage changes of section 4.1 (which chapters 05 and 06 rely on) into the ledger together.
2. **Task 16.** The names of the three faction rows of `040-wiki-states.sql` become the `state_name` of section 4.5. Rename the `independent` row of 035 to "무소속 / Unaffiliated".
3. **Tasks 17-19.** Write the input files with the head counts of section 3.3 and the shape of section 9. Spread the chapter 04-06 quota tables in the order of sections 4.7 and 4.8, and follow the ages of section 5.2 and the tables of sections 7.2 and 7.3.
4. **Task 20.** The doctrine of section 12 and the word changes of section 12.8.
5. **Task 26.** Put the tables of sections 8.3-8.6 into `ck3-stats.mjs` and the editor, and the calculations of section 9.4 and the disposition tables of section 10 into the editor. The two site fixes at the end of section 10.4. Write the four stage changes of section 4.1 into 050.
6. **Task 21 (GDD).** Carry the ratchet turn rule of section 13 and the force sizes of section 12.2 into the game rule documents. Figures are referred to by unit id.
