# W3 group C report

## Model record
cpa/claude-opus-5-5 (effective model from C:/Users/oliver/.omo/agent/projects/seoul-dengoku-wiki-f06038d8686d/senpi-task/tasks/st_01a1c7b3.json, field "model"; PI_MODEL ignored as stale). 0 completion calls. The replacement sentences were written by the agent (cpa/claude-opus-5-5) and applied by a script. The text is not from a Gemini model.

Replacement script: docs/drafts/reports/w3-c-replace.mjs. Run from the repo root: `node docs/drafts/reports/w3-c-replace.mjs`. It loads data/sql/000-schema.sql and 030-wiki-documents.sql into an in-memory node:sqlite database, applies exact one-match string replacements (each throws if the match count isn't 1), and writes the ten docs/drafts/<slug>.{ko,en}.md files. Re-running it on this tip reproduced all 10 bodies byte-identically (10/10).

Station-Interior-Construction: regex `/십육|sixteen|국가|states?\b|나라|국호|2030|번국|vassal|교회|church/i` over both bodies matched 0 times, so it gets no draft.

## Self-check (re-run on 2026-11-10; scratch copy ../w3c-scratch = data/sql + drafts applied)

Pipeline: `node scripts/pages/rewrite-doc.mjs --sql-dir ../w3c-scratch --drafts docs/drafts --only Building-Reuse-Geography,Seoul-Station-Catalog,World-and-Subway-Layers,World-Map-Construction,Structures` exit 0. `node scripts/pages/rewrite-doc.mjs --roundtrip --sql-dir ../w3c-scratch` exit 0. Independent SQLite diff (bun:sqlite, all columns, 59 rows): 9 cells changed: Building-Reuse-Geography.body_md, Building-Reuse-Geography.body_ko_md, Seoul-Station-Catalog.body_md, Structures.body_md, Structures.body_ko_md, World-Map-Construction.body_md, World-Map-Construction.body_ko_md, World-and-Subway-Layers.body_md, World-and-Subway-Layers.body_ko_md.

1. Provenance. Every changed sentence traces to bible 2.1 to 2.4 (three factions, 14/7/4 split, Senator for Government duchies, I Ilseop as Duke of Gwanak, 25-row table parsed from 2.4 by the regex in the script, 25 rows) or keeps existing body text minus the old-state clauses. One sentence is inferred, not quoted: "each depot belongs to the duchy of its gu" (from "one district is one duchy"). Old-state proper names in added lines, regex `수문국|규격맹|동방사|신내운수|환적국|태욱|Sluice|Gauge|Eastern Command|Sinnae Transport|Jeongdong Federation|...Republic of Korea`: 0.
2. No invented proper nouns. Added lines diffed against the old body line set: new names introduced 0. The only names in the new duchy text are the 25 gu from bible 2.4, the Senator title, and I Ilseop / Duke of Gwanak.
3. No private plot. Regex `성소|뇌|봉인|적출|스승|sanctuary|brain|seal|mentor` over all added lines: 1 hit. It's "the sealing of looping chassis" in Structures en, an existing sentence about machines where only "state's" became "faction's". Private-plot leaks: 0.
4. Editorial words. Regex `정본|정하지|미정|확정|결정되지|소유자|잠정|제안|canon|undecided|provisional|proposal|bible|데이터` over added lines: 1 hit (World-Map-Construction.ko: 데이터). That's "서울 지역 설정 데이터" in the related-documents line of World-Map-Construction. The phrase was already in the original line (true); only the Sixteen-States link label on that line changed.
5. Timeline. "2030" count in the five new bodies (ko+en): Building-Reuse-Geography:0, Seoul-Station-Catalog:0, World-and-Subway-Layers:0, World-Map-Construction:0, Structures:0. Years in all five new bodies, with counts: 2021=38, 2026=18, 2053=10, 2106=4, 2124=2, 2126=4. Classification: 2021 = weather reference date in World-and-Subway-Layers (pre-blackout real data); 2026 = Great Blackout year / pre-collapse baseline; 2053, 2106, 2124 = existing body dates outside the conflict list, not changed by this task; 2126 = present. Years in changed lines (2026, 2126, 2053) were all already in those lines before the change.
6. Map and people. Place names in the changed documents were looked up in data/sql/120-map-core.sql. The table below gives map_station id and district_ko plus the map_region ids:

| name | map_station → district_ko | map_region id=name/district_ko |
|---|---|---|
| 영등포 | map_station:Yeongdeungpo → 영등포구 | region:1156051500=영등포본동/영등포구, region:1156053500=영등포동/영등포구 |
| 신정 | map_station:신정 → 양천구 | region:1147062000=신정1동/양천구, region:1147063000=신정2동/양천구 |
| 방화 | map_station:방화 → 강서구 | region:1150063000=방화1동/강서구, region:1150064000=방화2동/강서구 |
| 창동 | map_station:창동 → 도봉구 | - |
| 노량진 | map_station:노량진 → 동작구 | region:1159051000=노량진1동/동작구, region:1159052000=노량진2동/동작구 |
| 제기동 | map_station:제기동 → 동대문구 | region:1123054500=제기동/동대문구 |
| 양평 | map_station:양평 → 양천구 | region:1156061000=양평1동/영등포구, region:1156062000=양평2동/영등포구 |
| 신도림 | map_station:Sindorim → 구로구 | region:1153051000=신도림동/구로구 |
| 구로 | map_station:Guro → 구로구 | region:1153052000=구로1동/구로구, region:1153053000=구로2동/구로구 |
| 천왕 | map_station:천왕 → 구로구 | - |
| 군자 | map_station:군자 → 광진구 | region:1121573000=군자동/광진구 |
| 고덕 | map_station:고덕 → 강동구 | region:1174055000=고덕1동/강동구, region:1174056000=고덕2동/강동구 |
| 신내 | map_station:신내 → 중랑구 | region:1126068000=신내1동/중랑구, region:1126069000=신내2동/중랑구 |
| 수서 | map_station:수서 → 강남구 | region:1168075000=수서동/강남구 |
| 여의도 | map_station:여의도 → 영등포구 | - |
| 뚝섬 | map_station:뚝섬 → 성동구 | - |
| 구의 | map_station:구의 → 광진구 | region:1121585000=구의1동/광진구, region:1121586000=구의2동/광진구 |
| 암사 | map_station:암사 → 강동구 | region:1174057000=암사1동/강동구, region:1174058000=암사2동/강동구 |
| 관악 | - | - |

Mentions in the five new ko bodies: 영등포:24, 신정:7, 방화:7, 창동:8, 노량진:7, 제기동:5, 양평:3, 신도림:9, 구로:16, 천왕:4, 군자:4, 고덕:5, 신내:5, 수서:6, 여의도:8, 뚝섬:3, 구의:10, 암사:8, 관악:11. 관악 appears as a gu (관악구), not a station. All 25 gu from bible 2.4 appear in map_region.district_ko (distinct district_ko = 25, 0 missing). Yangpyeong station is listed under 양천구 while the 양평동 regions are in 영등포구. That mismatch was already in the map data, and the sentence is unchanged. People: 이일섭/I Ilseop: in 050=true, added-text uses 2x; pronouns in added lines 0.
7. ko/en parity. Anchor sets (`<a id="..."></a>`): Building-Reuse-Geography: ko=[] en=[] equal=true removed_vs_old=0; Seoul-Station-Catalog: ko=[서울-역-카탈로그] en=[서울-역-카탈로그] equal=true removed_vs_old=0; World-and-Subway-Layers: ko=[서울과-지하철-레이어] en=[서울과-지하철-레이어] equal=true removed_vs_old=0; World-Map-Construction: ko=[월드맵의-구조] en=[월드맵의-구조] equal=true removed_vs_old=0; Structures: ko=[] en=[] equal=true removed_vs_old=0. Incoming fragment links, `git grep -E "(<5 slugs>)/?#(서울-역-카탈로그|서울과-지하철-레이어|월드맵의-구조)" -- data src scripts`: 0 matches (exit 1). Headings ko=en: Building-Reuse-Geography: 6=6, Seoul-Station-Catalog: 26=26, World-and-Subway-Layers: 2=2, World-Map-Construction: 5=5, Structures: 6=6. Broken lines in added text: 0. Hangul in added en lines (anchor ids excluded): 0. Latin word runs in added ko lines: 0. Seoul-Station-Catalog: ko body byte-identical=true, en body equals anchor line + original=true.
8. Titles. `git grep -c -E "^title(_ko)?:" -- <10 draft files>`: 0 matches.
9. Model record. Front matter of all 10 files: "model: cpa/claude-opus-5-5; 0 completion calls; replacements written by the agent and applied by a script (docs/drafts/reports/w3-c-replace.mjs); not from a Gemini model (edited lines: ...)".
10. Measured claims. Forbidden-term scan `node scripts/pages/scan-terms.mjs --terms docs/canon-terms.json --scope Building-Reuse-Geography,Seoul-Station-Catalog,World-and-Subway-Layers,World-Map-Construction,Station-Interior-Construction,Structures --sql-dir <dir>`: before (data/sql) exit 1, forbidden 18; after (../w3c-scratch) exit 0, forbidden 0. Every number in this file comes from that re-run.
