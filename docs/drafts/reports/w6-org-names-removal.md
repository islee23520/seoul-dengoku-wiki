# W6 옛 국가 조직명 제거 보고서 (w6-org-names-removal) — 인물 현재 소속·직위의 조직명 삭제

과제: PR #726 본문 24항이 밝힌 "존속 조직" 정책(옛 국가는 사라졌지만 그 이름의 회사·사령부·단체는 조직 이름으로 존속)을 소유자 결정으로 뒤집는다. **소유자 답(2026-11-12): "이름도 지우기"** — 옛 국가(S01..S16) 조직명을 인물 데이터의 현재 소속·고용 주체 표시에서 지우고 각 인물의 로스터 세력 표기로 바꾼다. 기준 팁 `origin/main`(병합 커밋 5aaa09d3b), 신규 브랜치 `feat/wiki-org-names-removal`. 실행 모델(작업 JSON `effective_model` 직독): **cpa/glm-5.3**(provider cpa, model_id glm-5.3, source category).

## 1. 사전 전수 조사 (변경 전, node:sqlite 18개 SQL 적재)

- 대상 어휘(양언어): 수문국/The Sluice·Floodgate Bureau·State, 규격맹/The Gauge·Standards League, 태욱그룹/Taeuk Group, 동방사/Eastern Command, 환적국/The Junction·Transshipment Bureau·State·Realm, 중앙정보국·중앙정보부/Central Intelligence Bureau·Agency, 여의도출자연합회/Yeouido Investment Federation·Investors' Association, 안국단·안국총림/Anguk Order·Anguk Grand Monastery·Anguk Monastic Grove, 성하그룹·성하전자/Seongha Group·Seongha Electronics, 신내운수/Sinnae Transport, 흰십자단/White Cross( Corps·Order·Society), 아관사·아찬산문/Achasan Gate·Agwansa·**Russian Legation Command**, 정동연맹·정동노동연맹/Jeongdong Federation·Jeongdong Labor Federation, 길목·길목사무소/Crossroads Office. (Russian Legation Command·Transshipment Realm·Central Intelligence Agency는 1차 스캔 뒤 영문 번역표기를 놓친 것을 KO↔EN 쌍 대조로 발견해 어휘에 추가했다.)
- **정정(이 보고서의 앞선 판 "각 조직은 로스터상 정확히 한 세력으로만 대응한다(불일치 0)"는 틀렸다).** 그 문장은 부분집합(대표 인물)만 보고 쓴 것이고 전수 대조가 아니었다. 아래는 origin/main(5aaa09d3b)의 18개 SQL을 node:sqlite로 적재해, **소속 잎(`$.fields.소속`·`$.fields.Affiliation`)과 `$.stateName` 잎**만 대상으로 옛 값이 위 어휘의 조직명을 담은 인물을 `wiki_person.faction_id`(변경 전후 동일)와 대조한 표다. 서술·생애 잎은 한 잎에 두 조직이 함께 나올 수 있어(예: person-0119·0121은 Arc 인물인데 서술에 규격맹 어휘가 있다) 조직×세력 표를 부풀리므로 제외했다. 셀 수는 (소속 / stateName), 양언어 합산 아닌 KO 기준이고 EN이 다르면 따로 적는다.

| 조직 | 로스터 세력(KO 소속/stateName) | 비고 |
|---|---|---|
| 수문국 | 자유도시 1/30 | 단일 |
| 규격맹 | 자유도시 2/28 | KO 단일. **EN만** person-1016(정부) 1건 추가(아래 §4-1) — EN 소속 3/28(자유도시) + 정부 1 |
| 태욱그룹 | Arc 0/40 | 단일 |
| 동방사 | Arc 18/47 | 단일 |
| 환적국 | 정부 33/31 | 단일(EN 소속 1) |
| 중앙정보국·부 | 정부 0/43 | 단일 |
| 여의도출자연합회 | 자유도시 23/36, **정부 2/0** | **두 세력**: 정부 인물은 person-0235·person-0236(소유자 과업 예외, KO·EN 소속 잎) |
| 안국단·안국총림 | 정부 2/35 | 단일 |
| 성하그룹·성하전자 | Arc 1/37 | 단일 |
| 신내운수 | 정부 0/32 | 단일 |
| 흰십자단 | 정부 62/0 | 단일 |
| 아관사 | 정부 19/36 | 단일(EN 소속 7) |
| 정동연맹·정동노동연맹 | Arc 0/0 (EN만: 소속 1/stateName 34) | 단일. KO 옛 값은 이미 중립 표기 |
| 길목 | 독립 1/0 | 단일 |

- **둘 이상의 세력에 대응하는 조직(소속·stateName 잎 한정)**: 여의도출자연합회(자유도시 59 / 정부 2: person-0235·0236), 규격맹(EN 한정, 자유도시 / 정부 1: person-1016). 이 밖의 조직은 단일 세력이다. 이전 판의 "불일치 0"은 철회한다.
- **소수 셀의 옛→새(KO / EN)와 로스터 표기와의 관계**: person-0235·0236은 '여의도출자연합회→정부' / 'Yeouido Investment Federation→The Government'로 로스터(정부/The Government)와 같은 표기다. person-1016은 소속 문장 속 'Standards League ledger'를 'Free City ledger'로만 바꿨고 로스터 표기(정부)와 다른, 외부 장부 서술의 **유지된 절**이다(§4-1). 지정된 다른 인물은 소수 셀이 아니다: person-0029(로스터 자유도시)는 소속 '규격맹→자유도시' / 'Standards League→Free City'로 로스터와 같고 직함 '규격맹 위원장'은 §4 보존 목록(소유자 대기)에 남는다. person-0116(Arc)은 소속 '동방사→Arc' / 'Eastern Command→Arc'로 로스터와 같고 직함 '동방사 사령관'은 보존. person-0249는 소속·stateName이 변경 전부터 '정부'/'The Government'로 이미 중립이라 이번에 바뀐 셀이 없다.
- PR #726 본문 24항 계수(소속 줄 243인 = 규격맹 30·태욱그룹 40·동방사 65·안국총림 37·성하그룹 38·신내운수 32·길목 1)는 이번 측정에서 소속 잎 + stateName 잎의 합과 정확히 일치했다(예: 동방사 소속 18 + stateName 47 = 65).
- family_tree(110)·retainer_graph(115)에서 조직명 셀 0건 — (C) 항목의 변경 없음.

## 2. 수단

- `docs/fix2-sentence-rules.json` exact-cell 규칙 **1,601건(인덱스 [4348..5948], counts.rules 4348→5949)**, `FIX2_FROM=4348` 1회 적용(`docs/drafts/reports/w6-org-names-edits-log.json`, perRule 1,601건). 규칙당 정확 1회 일치 아니면 exit 21 무기록. SQL 직접 수정 0건, 엔진 변경 0건.
- 대체 문구는 형제 셀·로스터에서 복사했다(신규 조어 없음): stateName → 로스터 state_name/state_name_ko 그대로; 소속 → 세력 단어('정부'/'자유도시'/'Arc', EN 'The Government'/'Free City'/'Arc'); 직위·직함 → 로스터가 이미 중립 표기면 그 값을 그대로(person-0117 '동방사 참모장'→'Arc 참모장' = 로스터 position, 성하전자 10인 '성하전자 X'→'Arc X' = 로스터 position), 로스터에도 조직명이 있으면 조직 접두를 세력 표기로(person-0070 '태욱그룹 회장 전령 · 서초구 영주'→'Arc 회장 전령 · 서초구 영주'); person-0399 영문 로스터 직위는 한국어 로스터 중립값('Arc 위원장')에 맞춰 'Arc Chairperson'으로.
- 본문 재진술(생애·관직·특성의 '- 소속: X' 줄, '직함은 X.'/‘Title: X.’ 세그먼트, 직무/Duty 잎)도 같은 토큰 치환으로 정리했다. person-1017(지연희)의 길 문장은 '길목사무소'→'사무소', EN 'the Crossroads Office, which'→'an office that'로 이름만 지웠다(Q5 대기와 무관하게 이름 제거가 과업 범위).

## 3. 변경 셀 요약 (1,601규칙 = 1,568셀, 634행 person_detail + 2행 wiki_person)

| 범주 | 규칙 수 |
|---|---|
| stateName 잎 → 로스터 state_name | 824 |
| 소속/Affiliation 잎(단독·문장형·Q26 선행토큰) | 286 |
| 본문 소속 재진술 줄 | 239 |
| position/title/직함/Title 잎 | 132 |
| 본문 직함 재진술 세그먼트·줄 | 98 |
| 직무/Duty 잎(EN 'internal function of the Jeongdong Labor Federation' → KO 'Arc 내부 기능'에 정합) | 19 |
| wiki_person position/position_ko | 3 |

wiki_person 변경 열은 position 2·position_ko 1뿐(faction·stage·state 계열 전열 불변). 세력별 인원 government 505 / free-city 190 / arc 319 / independent 8 불변. 26개 표 행수 불변. stateName↔로스터 state_name 불일치는 변경 전과 동일한 19건(person-0195 '정보기관', 대한민국정부 18인 — Q28 계열, 이번 미대상)뿐이다. 소속 KO/EN 쌍 불일치 0.


#### stateName 잎(090) — 824셀

| id | 열 | 경로 | old → new |
|---|---|---|---|
| person-0015 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0015 | json | $.stateName | The Sluice → Free City |
| person-0016 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0016 | json | $.stateName | The Sluice → Free City |
| person-0020 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0020 | json | $.stateName | The Sluice → Free City |
| person-0022 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0022 | json | $.stateName | The Sluice → Free City |
| person-0023 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0023 | json | $.stateName | The Sluice → Free City |
| person-0067 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0067 | json | $.stateName | Taeuk Group → Arc |
| person-0071 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0071 | json | $.stateName | Taeuk Group → Arc |
| person-0075 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0075 | json | $.stateName | Taeuk Group → Arc |
| person-0076 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0076 | json | $.stateName | Taeuk Group → Arc |
| person-0077 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0077 | json | $.stateName | Taeuk Group → Arc |
| person-0081 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0081 | json | $.stateName | Taeuk Group → Arc |
| person-0082 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0082 | json | $.stateName | Taeuk Group → Arc |
| person-0085 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0085 | json | $.stateName | Taeuk Group → Arc |
| person-0125 | json_ko | $.stateName | 동방사 → Arc |
| person-0125 | json | $.stateName | Eastern Command → Arc |
| person-0126 | json_ko | $.stateName | 동방사 → Arc |
| person-0126 | json | $.stateName | Eastern Command → Arc |
| person-0127 | json_ko | $.stateName | 동방사 → Arc |
| person-0127 | json | $.stateName | Eastern Command → Arc |
| person-0128 | json_ko | $.stateName | 동방사 → Arc |
| person-0128 | json | $.stateName | Eastern Command → Arc |
| person-0131 | json_ko | $.stateName | 동방사 → Arc |
| person-0131 | json | $.stateName | Eastern Command → Arc |
| person-0137 | json_ko | $.stateName | 동방사 → Arc |
| person-0137 | json | $.stateName | Eastern Command → Arc |
| person-0138 | json_ko | $.stateName | 동방사 → Arc |
| person-0138 | json | $.stateName | Eastern Command → Arc |
| person-0139 | json_ko | $.stateName | 동방사 → Arc |
| person-0139 | json | $.stateName | Eastern Command → Arc |
| person-0140 | json_ko | $.stateName | 동방사 → Arc |
| person-0140 | json | $.stateName | Eastern Command → Arc |
| person-0142 | json_ko | $.stateName | 동방사 → Arc |
| person-0142 | json | $.stateName | Eastern Command → Arc |
| person-0143 | json_ko | $.stateName | 동방사 → Arc |
| person-0143 | json | $.stateName | Eastern Command → Arc |
| person-0179 | json_ko | $.stateName | 환적국 → 정부 |
| person-0179 | json | $.stateName | The Junction → The Government |
| person-0182 | json_ko | $.stateName | 환적국 → 정부 |
| person-0182 | json | $.stateName | The Junction → The Government |
| person-0185 | json_ko | $.stateName | 환적국 → 정부 |
| person-0185 | json | $.stateName | The Junction → The Government |
| person-0202 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0202 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0203 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0203 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0204 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0204 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0205 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0205 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0206 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0206 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0207 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0207 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0210 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0210 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0216 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0216 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0229 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0229 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0231 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0231 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0266 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0266 | json | $.stateName | Anguk Order → The Government |
| person-0267 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0267 | json | $.stateName | Anguk Order → The Government |
| person-0285 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0285 | json | $.stateName | Seongha Group → Arc |
| person-0321 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0321 | json | $.stateName | Sinnae Transport → The Government |
| person-0426 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0426 | json | $.stateName | Taeuk Group → Arc |
| person-0428 | json_ko | $.stateName | 동방사 → Arc |
| person-0428 | json | $.stateName | Eastern Command → Arc |
| person-0430 | json_ko | $.stateName | 환적국 → 정부 |
| person-0430 | json | $.stateName | The Junction → The Government |
| person-0431 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0431 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0432 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0432 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0433 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0433 | json | $.stateName | Anguk Order → The Government |
| person-0434 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0434 | json | $.stateName | Seongha Group → Arc |
| person-0435 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0435 | json | $.stateName | Sinnae Transport → The Government |
| person-0437 | json_ko | $.stateName | 아관사 → 정부 |
| person-0437 | json | $.stateName | Achasan Gate → The Government |
| person-0439 | json | $.stateName | Jeongdong Federation → Arc |
| person-0440 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0440 | json | $.stateName | The Sluice → Free City |
| person-0442 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0442 | json | $.stateName | Taeuk Group → Arc |
| person-0444 | json_ko | $.stateName | 동방사 → Arc |
| person-0444 | json | $.stateName | Eastern Command → Arc |
| person-0447 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0447 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0448 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0448 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0449 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0449 | json | $.stateName | Anguk Order → The Government |
| person-0450 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0450 | json | $.stateName | Seongha Group → Arc |
| person-0451 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0451 | json | $.stateName | Sinnae Transport → The Government |
| person-0453 | json_ko | $.stateName | 아관사 → 정부 |
| person-0453 | json | $.stateName | Achasan Gate → The Government |
| person-0455 | json | $.stateName | Jeongdong Federation → Arc |
| person-0456 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0456 | json | $.stateName | The Sluice → Free City |
| person-0458 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0458 | json | $.stateName | Taeuk Group → Arc |
| person-0460 | json_ko | $.stateName | 동방사 → Arc |
| person-0460 | json | $.stateName | Eastern Command → Arc |
| person-0462 | json_ko | $.stateName | 환적국 → 정부 |
| person-0462 | json | $.stateName | The Junction → The Government |
| person-0463 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0463 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0464 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0464 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0465 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0465 | json | $.stateName | Anguk Order → The Government |
| person-0466 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0466 | json | $.stateName | Seongha Group → Arc |
| person-0467 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0467 | json | $.stateName | Sinnae Transport → The Government |
| person-0469 | json_ko | $.stateName | 아관사 → 정부 |
| person-0469 | json | $.stateName | Achasan Gate → The Government |
| person-0471 | json | $.stateName | Jeongdong Federation → Arc |
| person-0474 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0474 | json | $.stateName | Taeuk Group → Arc |
| person-0476 | json_ko | $.stateName | 동방사 → Arc |
| person-0476 | json | $.stateName | Eastern Command → Arc |
| person-0478 | json_ko | $.stateName | 환적국 → 정부 |
| person-0478 | json | $.stateName | The Junction → The Government |
| person-0479 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0479 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0480 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0480 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0481 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0481 | json | $.stateName | Anguk Order → The Government |
| person-0482 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0482 | json | $.stateName | Seongha Group → Arc |
| person-0483 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0483 | json | $.stateName | Sinnae Transport → The Government |
| person-0485 | json_ko | $.stateName | 아관사 → 정부 |
| person-0485 | json | $.stateName | Achasan Gate → The Government |
| person-0487 | json | $.stateName | Jeongdong Federation → Arc |
| person-0488 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0488 | json | $.stateName | The Sluice → Free City |
| person-0489 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0489 | json | $.stateName | The Gauge → Free City |
| person-0490 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0490 | json | $.stateName | Taeuk Group → Arc |
| person-0492 | json_ko | $.stateName | 동방사 → Arc |
| person-0492 | json | $.stateName | Eastern Command → Arc |
| person-0494 | json_ko | $.stateName | 환적국 → 정부 |
| person-0494 | json | $.stateName | The Junction → The Government |
| person-0495 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0495 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0496 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0496 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0497 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0497 | json | $.stateName | Anguk Order → The Government |
| person-0498 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0498 | json | $.stateName | Seongha Group → Arc |
| person-0501 | json_ko | $.stateName | 아관사 → 정부 |
| person-0501 | json | $.stateName | Achasan Gate → The Government |
| person-0503 | json | $.stateName | Jeongdong Federation → Arc |
| person-0504 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0504 | json | $.stateName | The Sluice → Free City |
| person-0506 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0506 | json | $.stateName | Taeuk Group → Arc |
| person-0508 | json_ko | $.stateName | 동방사 → Arc |
| person-0508 | json | $.stateName | Eastern Command → Arc |
| person-0510 | json_ko | $.stateName | 환적국 → 정부 |
| person-0510 | json | $.stateName | The Junction → The Government |
| person-0511 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0511 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0512 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0512 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0513 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0513 | json | $.stateName | Anguk Order → The Government |
| person-0514 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0514 | json | $.stateName | Seongha Group → Arc |
| person-0515 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0515 | json | $.stateName | Sinnae Transport → The Government |
| person-0517 | json_ko | $.stateName | 아관사 → 정부 |
| person-0517 | json | $.stateName | Achasan Gate → The Government |
| person-0519 | json | $.stateName | Jeongdong Federation → Arc |
| person-0521 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0521 | json | $.stateName | The Gauge → Free City |
| person-0522 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0522 | json | $.stateName | Taeuk Group → Arc |
| person-0524 | json_ko | $.stateName | 동방사 → Arc |
| person-0524 | json | $.stateName | Eastern Command → Arc |
| person-0526 | json_ko | $.stateName | 환적국 → 정부 |
| person-0526 | json | $.stateName | The Junction → The Government |
| person-0527 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0527 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0528 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0528 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0529 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0529 | json | $.stateName | Anguk Order → The Government |
| person-0530 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0530 | json | $.stateName | Seongha Group → Arc |
| person-0531 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0531 | json | $.stateName | Sinnae Transport → The Government |
| person-0533 | json_ko | $.stateName | 아관사 → 정부 |
| person-0533 | json | $.stateName | Achasan Gate → The Government |
| person-0535 | json | $.stateName | Jeongdong Federation → Arc |
| person-0536 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0536 | json | $.stateName | The Sluice → Free City |
| person-0537 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0537 | json | $.stateName | The Gauge → Free City |
| person-0538 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0538 | json | $.stateName | Taeuk Group → Arc |
| person-0540 | json_ko | $.stateName | 동방사 → Arc |
| person-0540 | json | $.stateName | Eastern Command → Arc |
| person-0542 | json_ko | $.stateName | 환적국 → 정부 |
| person-0542 | json | $.stateName | The Junction → The Government |
| person-0543 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0543 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0545 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0545 | json | $.stateName | Anguk Order → The Government |
| person-0546 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0546 | json | $.stateName | Seongha Group → Arc |
| person-0549 | json_ko | $.stateName | 아관사 → 정부 |
| person-0549 | json | $.stateName | Achasan Gate → The Government |
| person-0551 | json | $.stateName | Jeongdong Federation → Arc |
| person-0552 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0552 | json | $.stateName | The Sluice → Free City |
| person-0553 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0553 | json | $.stateName | The Gauge → Free City |
| person-0554 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0554 | json | $.stateName | Taeuk Group → Arc |
| person-0556 | json_ko | $.stateName | 동방사 → Arc |
| person-0556 | json | $.stateName | Eastern Command → Arc |
| person-0558 | json_ko | $.stateName | 환적국 → 정부 |
| person-0558 | json | $.stateName | The Junction → The Government |
| person-0559 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0559 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0560 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0560 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0561 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0561 | json | $.stateName | Anguk Order → The Government |
| person-0562 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0562 | json | $.stateName | Seongha Group → Arc |
| person-0563 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0563 | json | $.stateName | Sinnae Transport → The Government |
| person-0565 | json_ko | $.stateName | 아관사 → 정부 |
| person-0565 | json | $.stateName | Achasan Gate → The Government |
| person-0567 | json | $.stateName | Jeongdong Federation → Arc |
| person-0569 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0569 | json | $.stateName | The Gauge → Free City |
| person-0572 | json_ko | $.stateName | 동방사 → Arc |
| person-0572 | json | $.stateName | Eastern Command → Arc |
| person-0574 | json_ko | $.stateName | 환적국 → 정부 |
| person-0574 | json | $.stateName | The Junction → The Government |
| person-0575 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0575 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0576 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0576 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0578 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0578 | json | $.stateName | Seongha Group → Arc |
| person-0579 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0579 | json | $.stateName | Sinnae Transport → The Government |
| person-0581 | json_ko | $.stateName | 아관사 → 정부 |
| person-0581 | json | $.stateName | Achasan Gate → The Government |
| person-0583 | json | $.stateName | Jeongdong Federation → Arc |
| person-0584 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0584 | json | $.stateName | The Sluice → Free City |
| person-0585 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0585 | json | $.stateName | The Gauge → Free City |
| person-0586 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0586 | json | $.stateName | Taeuk Group → Arc |
| person-0588 | json_ko | $.stateName | 동방사 → Arc |
| person-0588 | json | $.stateName | Eastern Command → Arc |
| person-0590 | json_ko | $.stateName | 환적국 → 정부 |
| person-0590 | json | $.stateName | The Junction → The Government |
| person-0591 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0591 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0592 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0592 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0593 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0593 | json | $.stateName | Anguk Order → The Government |
| person-0594 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0594 | json | $.stateName | Seongha Group → Arc |
| person-0595 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0595 | json | $.stateName | Sinnae Transport → The Government |
| person-0597 | json_ko | $.stateName | 아관사 → 정부 |
| person-0597 | json | $.stateName | Achasan Gate → The Government |
| person-0601 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0601 | json | $.stateName | The Gauge → Free City |
| person-0602 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0602 | json | $.stateName | Taeuk Group → Arc |
| person-0604 | json_ko | $.stateName | 동방사 → Arc |
| person-0604 | json | $.stateName | Eastern Command → Arc |
| person-0607 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0607 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0608 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0608 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0609 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0609 | json | $.stateName | Anguk Order → The Government |
| person-0610 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0610 | json | $.stateName | Seongha Group → Arc |
| person-0611 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0611 | json | $.stateName | Sinnae Transport → The Government |
| person-0613 | json_ko | $.stateName | 아관사 → 정부 |
| person-0613 | json | $.stateName | Achasan Gate → The Government |
| person-0615 | json | $.stateName | Jeongdong Federation → Arc |
| person-0617 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0617 | json | $.stateName | The Gauge → Free City |
| person-0618 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0618 | json | $.stateName | Taeuk Group → Arc |
| person-0620 | json_ko | $.stateName | 동방사 → Arc |
| person-0620 | json | $.stateName | Eastern Command → Arc |
| person-0622 | json_ko | $.stateName | 환적국 → 정부 |
| person-0622 | json | $.stateName | The Junction → The Government |
| person-0623 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0623 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0624 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0624 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0626 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0626 | json | $.stateName | Seongha Group → Arc |
| person-0627 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0627 | json | $.stateName | Sinnae Transport → The Government |
| person-0629 | json_ko | $.stateName | 아관사 → 정부 |
| person-0629 | json | $.stateName | Achasan Gate → The Government |
| person-0631 | json | $.stateName | Jeongdong Federation → Arc |
| person-0632 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0632 | json | $.stateName | The Sluice → Free City |
| person-0633 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0633 | json | $.stateName | The Gauge → Free City |
| person-0634 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0634 | json | $.stateName | Taeuk Group → Arc |
| person-0636 | json_ko | $.stateName | 동방사 → Arc |
| person-0636 | json | $.stateName | Eastern Command → Arc |
| person-0638 | json_ko | $.stateName | 환적국 → 정부 |
| person-0638 | json | $.stateName | The Junction → The Government |
| person-0639 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0639 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0640 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0640 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0641 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0641 | json | $.stateName | Anguk Order → The Government |
| person-0642 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0642 | json | $.stateName | Seongha Group → Arc |
| person-0643 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0643 | json | $.stateName | Sinnae Transport → The Government |
| person-0645 | json_ko | $.stateName | 아관사 → 정부 |
| person-0645 | json | $.stateName | Achasan Gate → The Government |
| person-0647 | json | $.stateName | Jeongdong Federation → Arc |
| person-0648 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0648 | json | $.stateName | The Sluice → Free City |
| person-0650 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0650 | json | $.stateName | Taeuk Group → Arc |
| person-0652 | json_ko | $.stateName | 동방사 → Arc |
| person-0652 | json | $.stateName | Eastern Command → Arc |
| person-0654 | json_ko | $.stateName | 환적국 → 정부 |
| person-0654 | json | $.stateName | The Junction → The Government |
| person-0655 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0655 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0656 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0656 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0657 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0657 | json | $.stateName | Anguk Order → The Government |
| person-0658 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0658 | json | $.stateName | Seongha Group → Arc |
| person-0659 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0659 | json | $.stateName | Sinnae Transport → The Government |
| person-0661 | json_ko | $.stateName | 아관사 → 정부 |
| person-0661 | json | $.stateName | Achasan Gate → The Government |
| person-0663 | json | $.stateName | Jeongdong Federation → Arc |
| person-0664 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0664 | json | $.stateName | The Sluice → Free City |
| person-0665 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0665 | json | $.stateName | The Gauge → Free City |
| person-0666 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0666 | json | $.stateName | Taeuk Group → Arc |
| person-0668 | json_ko | $.stateName | 동방사 → Arc |
| person-0668 | json | $.stateName | Eastern Command → Arc |
| person-0670 | json_ko | $.stateName | 환적국 → 정부 |
| person-0670 | json | $.stateName | The Junction → The Government |
| person-0671 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0671 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0672 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0672 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0673 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0673 | json | $.stateName | Anguk Order → The Government |
| person-0674 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0674 | json | $.stateName | Seongha Group → Arc |
| person-0675 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0675 | json | $.stateName | Sinnae Transport → The Government |
| person-0677 | json_ko | $.stateName | 아관사 → 정부 |
| person-0677 | json | $.stateName | Achasan Gate → The Government |
| person-0679 | json | $.stateName | Jeongdong Federation → Arc |
| person-0680 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0680 | json | $.stateName | The Sluice → Free City |
| person-0681 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0681 | json | $.stateName | The Gauge → Free City |
| person-0682 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0682 | json | $.stateName | Taeuk Group → Arc |
| person-0684 | json_ko | $.stateName | 동방사 → Arc |
| person-0684 | json | $.stateName | Eastern Command → Arc |
| person-0686 | json_ko | $.stateName | 환적국 → 정부 |
| person-0686 | json | $.stateName | The Junction → The Government |
| person-0687 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0687 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0688 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0688 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0689 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0689 | json | $.stateName | Anguk Order → The Government |
| person-0690 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0690 | json | $.stateName | Seongha Group → Arc |
| person-0693 | json_ko | $.stateName | 아관사 → 정부 |
| person-0693 | json | $.stateName | Achasan Gate → The Government |
| person-0695 | json | $.stateName | Jeongdong Federation → Arc |
| person-0696 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0696 | json | $.stateName | The Sluice → Free City |
| person-0697 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0697 | json | $.stateName | The Gauge → Free City |
| person-0698 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0698 | json | $.stateName | Taeuk Group → Arc |
| person-0700 | json_ko | $.stateName | 동방사 → Arc |
| person-0700 | json | $.stateName | Eastern Command → Arc |
| person-0702 | json_ko | $.stateName | 환적국 → 정부 |
| person-0702 | json | $.stateName | The Junction → The Government |
| person-0703 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0703 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0704 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0704 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0705 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0705 | json | $.stateName | Anguk Order → The Government |
| person-0706 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0706 | json | $.stateName | Seongha Group → Arc |
| person-0707 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0707 | json | $.stateName | Sinnae Transport → The Government |
| person-0709 | json_ko | $.stateName | 아관사 → 정부 |
| person-0709 | json | $.stateName | Achasan Gate → The Government |
| person-0711 | json | $.stateName | Jeongdong Federation → Arc |
| person-0713 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0713 | json | $.stateName | The Gauge → Free City |
| person-0714 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0714 | json | $.stateName | Taeuk Group → Arc |
| person-0716 | json_ko | $.stateName | 동방사 → Arc |
| person-0716 | json | $.stateName | Eastern Command → Arc |
| person-0718 | json_ko | $.stateName | 환적국 → 정부 |
| person-0718 | json | $.stateName | The Junction → The Government |
| person-0720 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0720 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0721 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0721 | json | $.stateName | Anguk Order → The Government |
| person-0722 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0722 | json | $.stateName | Seongha Group → Arc |
| person-0723 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0723 | json | $.stateName | Sinnae Transport → The Government |
| person-0725 | json_ko | $.stateName | 아관사 → 정부 |
| person-0725 | json | $.stateName | Achasan Gate → The Government |
| person-0727 | json | $.stateName | Jeongdong Federation → Arc |
| person-0729 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0729 | json | $.stateName | The Gauge → Free City |
| person-0730 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0730 | json | $.stateName | Taeuk Group → Arc |
| person-0732 | json_ko | $.stateName | 동방사 → Arc |
| person-0732 | json | $.stateName | Eastern Command → Arc |
| person-0734 | json_ko | $.stateName | 환적국 → 정부 |
| person-0734 | json | $.stateName | The Junction → The Government |
| person-0735 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0735 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0736 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0736 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0737 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0737 | json | $.stateName | Anguk Order → The Government |
| person-0738 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0738 | json | $.stateName | Seongha Group → Arc |
| person-0741 | json_ko | $.stateName | 아관사 → 정부 |
| person-0741 | json | $.stateName | Achasan Gate → The Government |
| person-0743 | json | $.stateName | Jeongdong Federation → Arc |
| person-0744 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0744 | json | $.stateName | The Sluice → Free City |
| person-0745 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0745 | json | $.stateName | The Gauge → Free City |
| person-0746 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0746 | json | $.stateName | Taeuk Group → Arc |
| person-0748 | json_ko | $.stateName | 동방사 → Arc |
| person-0748 | json | $.stateName | Eastern Command → Arc |
| person-0750 | json_ko | $.stateName | 환적국 → 정부 |
| person-0750 | json | $.stateName | The Junction → The Government |
| person-0751 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0751 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0752 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0752 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0753 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0753 | json | $.stateName | Anguk Order → The Government |
| person-0754 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0754 | json | $.stateName | Seongha Group → Arc |
| person-0755 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0755 | json | $.stateName | Sinnae Transport → The Government |
| person-0757 | json_ko | $.stateName | 아관사 → 정부 |
| person-0757 | json | $.stateName | Achasan Gate → The Government |
| person-0759 | json | $.stateName | Jeongdong Federation → Arc |
| person-0761 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0761 | json | $.stateName | The Gauge → Free City |
| person-0764 | json_ko | $.stateName | 동방사 → Arc |
| person-0764 | json | $.stateName | Eastern Command → Arc |
| person-0766 | json_ko | $.stateName | 환적국 → 정부 |
| person-0766 | json | $.stateName | The Junction → The Government |
| person-0767 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0767 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0768 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0768 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0770 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0770 | json | $.stateName | Seongha Group → Arc |
| person-0771 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0771 | json | $.stateName | Sinnae Transport → The Government |
| person-0773 | json_ko | $.stateName | 아관사 → 정부 |
| person-0773 | json | $.stateName | Achasan Gate → The Government |
| person-0775 | json | $.stateName | Jeongdong Federation → Arc |
| person-0776 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0776 | json | $.stateName | The Sluice → Free City |
| person-0777 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0777 | json | $.stateName | The Gauge → Free City |
| person-0778 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0778 | json | $.stateName | Taeuk Group → Arc |
| person-0780 | json_ko | $.stateName | 동방사 → Arc |
| person-0780 | json | $.stateName | Eastern Command → Arc |
| person-0782 | json_ko | $.stateName | 환적국 → 정부 |
| person-0782 | json | $.stateName | The Junction → The Government |
| person-0783 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0783 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0784 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0784 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0785 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0785 | json | $.stateName | Anguk Order → The Government |
| person-0786 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0786 | json | $.stateName | Seongha Group → Arc |
| person-0787 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0787 | json | $.stateName | Sinnae Transport → The Government |
| person-0789 | json_ko | $.stateName | 아관사 → 정부 |
| person-0789 | json | $.stateName | Achasan Gate → The Government |
| person-0792 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0792 | json | $.stateName | The Sluice → Free City |
| person-0793 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0793 | json | $.stateName | The Gauge → Free City |
| person-0794 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0794 | json | $.stateName | Taeuk Group → Arc |
| person-0796 | json_ko | $.stateName | 동방사 → Arc |
| person-0796 | json | $.stateName | Eastern Command → Arc |
| person-0798 | json_ko | $.stateName | 환적국 → 정부 |
| person-0798 | json | $.stateName | The Junction → The Government |
| person-0799 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0799 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0800 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0800 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0801 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0801 | json | $.stateName | Anguk Order → The Government |
| person-0802 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0802 | json | $.stateName | Seongha Group → Arc |
| person-0803 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0803 | json | $.stateName | Sinnae Transport → The Government |
| person-0805 | json_ko | $.stateName | 아관사 → 정부 |
| person-0805 | json | $.stateName | Achasan Gate → The Government |
| person-0807 | json | $.stateName | Jeongdong Federation → Arc |
| person-0808 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0808 | json | $.stateName | The Sluice → Free City |
| person-0809 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0809 | json | $.stateName | The Gauge → Free City |
| person-0812 | json_ko | $.stateName | 동방사 → Arc |
| person-0812 | json | $.stateName | Eastern Command → Arc |
| person-0814 | json_ko | $.stateName | 환적국 → 정부 |
| person-0814 | json | $.stateName | The Junction → The Government |
| person-0815 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0815 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0816 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0816 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0817 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0817 | json | $.stateName | Anguk Order → The Government |
| person-0818 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0818 | json | $.stateName | Seongha Group → Arc |
| person-0819 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0819 | json | $.stateName | Sinnae Transport → The Government |
| person-0821 | json_ko | $.stateName | 아관사 → 정부 |
| person-0821 | json | $.stateName | Achasan Gate → The Government |
| person-0823 | json | $.stateName | Jeongdong Federation → Arc |
| person-0824 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0824 | json | $.stateName | The Sluice → Free City |
| person-0825 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0825 | json | $.stateName | The Gauge → Free City |
| person-0826 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0826 | json | $.stateName | Taeuk Group → Arc |
| person-0828 | json_ko | $.stateName | 동방사 → Arc |
| person-0828 | json | $.stateName | Eastern Command → Arc |
| person-0830 | json_ko | $.stateName | 환적국 → 정부 |
| person-0830 | json | $.stateName | The Junction → The Government |
| person-0831 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0831 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0832 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0832 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0833 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0833 | json | $.stateName | Anguk Order → The Government |
| person-0834 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0834 | json | $.stateName | Seongha Group → Arc |
| person-0835 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0835 | json | $.stateName | Sinnae Transport → The Government |
| person-0837 | json_ko | $.stateName | 아관사 → 정부 |
| person-0837 | json | $.stateName | Achasan Gate → The Government |
| person-0839 | json | $.stateName | Jeongdong Federation → Arc |
| person-0840 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0840 | json | $.stateName | The Sluice → Free City |
| person-0842 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0842 | json | $.stateName | Taeuk Group → Arc |
| person-0844 | json_ko | $.stateName | 동방사 → Arc |
| person-0844 | json | $.stateName | Eastern Command → Arc |
| person-0847 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0847 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0849 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0849 | json | $.stateName | Anguk Order → The Government |
| person-0850 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0850 | json | $.stateName | Seongha Group → Arc |
| person-0851 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0851 | json | $.stateName | Sinnae Transport → The Government |
| person-0853 | json_ko | $.stateName | 아관사 → 정부 |
| person-0853 | json | $.stateName | Achasan Gate → The Government |
| person-0855 | json | $.stateName | Jeongdong Federation → Arc |
| person-0856 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0856 | json | $.stateName | The Sluice → Free City |
| person-0857 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0857 | json | $.stateName | The Gauge → Free City |
| person-0858 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0858 | json | $.stateName | Taeuk Group → Arc |
| person-0860 | json_ko | $.stateName | 동방사 → Arc |
| person-0860 | json | $.stateName | Eastern Command → Arc |
| person-0862 | json_ko | $.stateName | 환적국 → 정부 |
| person-0862 | json | $.stateName | The Junction → The Government |
| person-0863 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0863 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0864 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0864 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0865 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0865 | json | $.stateName | Anguk Order → The Government |
| person-0866 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0866 | json | $.stateName | Seongha Group → Arc |
| person-0867 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0867 | json | $.stateName | Sinnae Transport → The Government |
| person-0869 | json_ko | $.stateName | 아관사 → 정부 |
| person-0869 | json | $.stateName | Achasan Gate → The Government |
| person-0871 | json | $.stateName | Jeongdong Federation → Arc |
| person-0872 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0872 | json | $.stateName | The Sluice → Free City |
| person-0873 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0873 | json | $.stateName | The Gauge → Free City |
| person-0874 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0874 | json | $.stateName | Taeuk Group → Arc |
| person-0876 | json_ko | $.stateName | 동방사 → Arc |
| person-0876 | json | $.stateName | Eastern Command → Arc |
| person-0878 | json_ko | $.stateName | 환적국 → 정부 |
| person-0878 | json | $.stateName | The Junction → The Government |
| person-0879 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0879 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0880 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0880 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0881 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0881 | json | $.stateName | Anguk Order → The Government |
| person-0882 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0882 | json | $.stateName | Seongha Group → Arc |
| person-0885 | json_ko | $.stateName | 아관사 → 정부 |
| person-0885 | json | $.stateName | Achasan Gate → The Government |
| person-0887 | json | $.stateName | Jeongdong Federation → Arc |
| person-0888 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0888 | json | $.stateName | The Sluice → Free City |
| person-0890 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0890 | json | $.stateName | Taeuk Group → Arc |
| person-0892 | json_ko | $.stateName | 동방사 → Arc |
| person-0892 | json | $.stateName | Eastern Command → Arc |
| person-0894 | json_ko | $.stateName | 환적국 → 정부 |
| person-0894 | json | $.stateName | The Junction → The Government |
| person-0895 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0895 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0896 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0896 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0897 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0897 | json | $.stateName | Anguk Order → The Government |
| person-0898 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0898 | json | $.stateName | Seongha Group → Arc |
| person-0899 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0899 | json | $.stateName | Sinnae Transport → The Government |
| person-0901 | json_ko | $.stateName | 아관사 → 정부 |
| person-0901 | json | $.stateName | Achasan Gate → The Government |
| person-0903 | json | $.stateName | Jeongdong Federation → Arc |
| person-0904 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0904 | json | $.stateName | The Sluice → Free City |
| person-0905 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0905 | json | $.stateName | The Gauge → Free City |
| person-0908 | json_ko | $.stateName | 동방사 → Arc |
| person-0908 | json | $.stateName | Eastern Command → Arc |
| person-0910 | json_ko | $.stateName | 환적국 → 정부 |
| person-0910 | json | $.stateName | The Junction → The Government |
| person-0911 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0911 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0912 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0912 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0913 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0913 | json | $.stateName | Anguk Order → The Government |
| person-0914 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0914 | json | $.stateName | Seongha Group → Arc |
| person-0915 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0915 | json | $.stateName | Sinnae Transport → The Government |
| person-0917 | json_ko | $.stateName | 아관사 → 정부 |
| person-0917 | json | $.stateName | Achasan Gate → The Government |
| person-0919 | json | $.stateName | Jeongdong Federation → Arc |
| person-0921 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0921 | json | $.stateName | The Gauge → Free City |
| person-0922 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0922 | json | $.stateName | Taeuk Group → Arc |
| person-0924 | json_ko | $.stateName | 동방사 → Arc |
| person-0924 | json | $.stateName | Eastern Command → Arc |
| person-0927 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0927 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0928 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0928 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0929 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0929 | json | $.stateName | Anguk Order → The Government |
| person-0930 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0930 | json | $.stateName | Seongha Group → Arc |
| person-0931 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0931 | json | $.stateName | Sinnae Transport → The Government |
| person-0933 | json_ko | $.stateName | 아관사 → 정부 |
| person-0933 | json | $.stateName | Achasan Gate → The Government |
| person-0935 | json | $.stateName | Jeongdong Federation → Arc |
| person-0936 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0936 | json | $.stateName | The Sluice → Free City |
| person-0937 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0937 | json | $.stateName | The Gauge → Free City |
| person-0938 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0938 | json | $.stateName | Taeuk Group → Arc |
| person-0940 | json_ko | $.stateName | 동방사 → Arc |
| person-0940 | json | $.stateName | Eastern Command → Arc |
| person-0943 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0943 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0944 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0944 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0945 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0945 | json | $.stateName | Anguk Order → The Government |
| person-0946 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0946 | json | $.stateName | Seongha Group → Arc |
| person-0947 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0947 | json | $.stateName | Sinnae Transport → The Government |
| person-0949 | json_ko | $.stateName | 아관사 → 정부 |
| person-0949 | json | $.stateName | Achasan Gate → The Government |
| person-0951 | json | $.stateName | Jeongdong Federation → Arc |
| person-0953 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0953 | json | $.stateName | The Gauge → Free City |
| person-0954 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0954 | json | $.stateName | Taeuk Group → Arc |
| person-0956 | json_ko | $.stateName | 동방사 → Arc |
| person-0956 | json | $.stateName | Eastern Command → Arc |
| person-0959 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0959 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0960 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0960 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0961 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0961 | json | $.stateName | Anguk Order → The Government |
| person-0962 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0962 | json | $.stateName | Seongha Group → Arc |
| person-0963 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0963 | json | $.stateName | Sinnae Transport → The Government |
| person-0965 | json_ko | $.stateName | 아관사 → 정부 |
| person-0965 | json | $.stateName | Achasan Gate → The Government |
| person-0967 | json | $.stateName | Jeongdong Federation → Arc |
| person-0968 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0968 | json | $.stateName | The Sluice → Free City |
| person-0969 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0969 | json | $.stateName | The Gauge → Free City |
| person-0970 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0970 | json | $.stateName | Taeuk Group → Arc |
| person-0972 | json_ko | $.stateName | 동방사 → Arc |
| person-0972 | json | $.stateName | Eastern Command → Arc |
| person-0975 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0975 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0976 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0976 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0977 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0977 | json | $.stateName | Anguk Order → The Government |
| person-0978 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0978 | json | $.stateName | Seongha Group → Arc |
| person-0979 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0979 | json | $.stateName | Sinnae Transport → The Government |
| person-0981 | json_ko | $.stateName | 아관사 → 정부 |
| person-0981 | json | $.stateName | Achasan Gate → The Government |
| person-0983 | json | $.stateName | Jeongdong Federation → Arc |
| person-0984 | json_ko | $.stateName | 수문국 → 자유도시 |
| person-0984 | json | $.stateName | The Sluice → Free City |
| person-0985 | json_ko | $.stateName | 규격맹 → 자유도시 |
| person-0985 | json | $.stateName | The Gauge → Free City |
| person-0986 | json_ko | $.stateName | 태욱그룹 → Arc |
| person-0986 | json | $.stateName | Taeuk Group → Arc |
| person-0988 | json_ko | $.stateName | 동방사 → Arc |
| person-0988 | json | $.stateName | Eastern Command → Arc |
| person-0991 | json_ko | $.stateName | 중앙정보부 → 정부 |
| person-0991 | json | $.stateName | Central Intelligence Bureau → The Government |
| person-0992 | json_ko | $.stateName | 여의도출자연합회 → 자유도시 |
| person-0992 | json | $.stateName | Yeouido Investors' Association → Free City |
| person-0993 | json_ko | $.stateName | 안국총림 → 정부 |
| person-0993 | json | $.stateName | Anguk Order → The Government |
| person-0994 | json_ko | $.stateName | 성하그룹 → Arc |
| person-0994 | json | $.stateName | Seongha Group → Arc |
| person-0995 | json_ko | $.stateName | 신내운수 → 정부 |
| person-0995 | json | $.stateName | Sinnae Transport → The Government |
| person-0997 | json_ko | $.stateName | 아관사 → 정부 |
| person-0997 | json | $.stateName | Achasan Gate → The Government |
| person-1000 | json | $.stateName | Jeongdong Federation → Arc |

#### 소속/Affiliation 잎 — 조직명 단독(090) — 265셀

| id | 열 | 경로 | old → new |
|---|---|---|---|
| person-0001 | json_ko | $.fields.소속 | 수문국 → 자유도시 |
| person-0001 | json | $.fields.Affiliation | Floodgate State → Free City |
| person-0029 | json_ko | $.fields.소속 | 규격맹 → 자유도시 |
| person-0029 | json | $.fields.Affiliation | Standards League → Free City |
| person-0116 | json_ko | $.fields.소속 | 동방사 → Arc |
| person-0116 | json | $.fields.Affiliation | Eastern Command → Arc |
| person-0117 | json_ko | $.fields.소속 | 동방사 → Arc |
| person-0117 | json | $.fields.Affiliation | Eastern Command → Arc |
| person-0118 | json_ko | $.fields.소속 | 동방사 → Arc |
| person-0118 | json | $.fields.Affiliation | Eastern Command → Arc |
| person-0119 | json_ko | $.fields.소속 | 동방사 → Arc |
| person-0119 | json | $.fields.Affiliation | Eastern Command → Arc |
| person-0120 | json_ko | $.fields.소속 | 동방사 → Arc |
| person-0120 | json | $.fields.Affiliation | Eastern Command → Arc |
| person-0121 | json_ko | $.fields.소속 | 동방사 → Arc |
| person-0121 | json | $.fields.Affiliation | Eastern Command → Arc |
| person-0122 | json_ko | $.fields.소속 | 동방사 → Arc |
| person-0122 | json | $.fields.Affiliation | Eastern Command → Arc |
| person-0123 | json_ko | $.fields.소속 | 동방사 → Arc |
| person-0123 | json | $.fields.Affiliation | Eastern Command → Arc |
| person-0124 | json_ko | $.fields.소속 | 동방사 → Arc |
| person-0124 | json | $.fields.Affiliation | Eastern Command → Arc |
| person-0129 | json_ko | $.fields.소속 | 동방사 → Arc |
| person-0129 | json | $.fields.Affiliation | Eastern Command → Arc |
| person-0130 | json_ko | $.fields.소속 | 동방사 → Arc |
| person-0130 | json | $.fields.Affiliation | Eastern Command → Arc |
| person-0132 | json_ko | $.fields.소속 | 동방사 → Arc |
| person-0132 | json | $.fields.Affiliation | Eastern Command → Arc |
| person-0133 | json_ko | $.fields.소속 | 동방사 → Arc |
| person-0133 | json | $.fields.Affiliation | Eastern Command → Arc |
| person-0134 | json_ko | $.fields.소속 | 동방사 → Arc |
| person-0134 | json | $.fields.Affiliation | Eastern Command → Arc |
| person-0135 | json_ko | $.fields.소속 | 동방사 → Arc |
| person-0135 | json | $.fields.Affiliation | Eastern Command → Arc |
| person-0136 | json_ko | $.fields.소속 | 동방사 → Arc |
| person-0136 | json | $.fields.Affiliation | Eastern Command → Arc |
| person-0141 | json_ko | $.fields.소속 | 동방사 → Arc |
| person-0141 | json | $.fields.Affiliation | Eastern Command → Arc |
| person-0144 | json_ko | $.fields.소속 | 동방사 → Arc |
| person-0144 | json | $.fields.Affiliation | Eastern Command → Arc |
| person-0170 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0171 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0172 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0173 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0174 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0175 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0176 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0177 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0178 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0180 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0181 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0183 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0184 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0186 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0187 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0188 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0189 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0190 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0191 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0192 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0193 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0194 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0221 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0221 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0222 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0222 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0223 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0223 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0224 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0224 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0225 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0225 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0226 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0226 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0227 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0227 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0228 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0228 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0230 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0230 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0232 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0232 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0233 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0233 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0234 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0234 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0235 | json_ko | $.fields.소속 | 여의도출자연합회 → 정부 |
| person-0235 | json | $.fields.Affiliation | Yeouido Investment Federation → The Government |
| person-0236 | json_ko | $.fields.소속 | 여의도출자연합회 → 정부 |
| person-0236 | json | $.fields.Affiliation | Yeouido Investment Federation → The Government |
| person-0237 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0237 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0238 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0238 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0239 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0239 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0240 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0240 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0241 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0241 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0242 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0242 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0243 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0243 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0244 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0244 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0245 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0245 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0246 | json_ko | $.fields.소속 | 안국총림 → 정부 |
| person-0246 | json | $.fields.Affiliation | Anguk Grand Monastery → The Government |
| person-0272 | json_ko | $.fields.소속 | 성하그룹 → Arc |
| person-0272 | json | $.fields.Affiliation | Seongha Group → Arc |
| person-0323 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0323 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0324 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0324 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0325 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0325 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0326 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0326 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0327 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0327 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0328 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0328 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0329 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0329 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0330 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0330 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0331 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0331 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0332 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0332 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0333 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0333 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0334 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0334 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0335 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0335 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0336 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0336 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0337 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0337 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0338 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0338 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0339 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0339 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0340 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0340 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0341 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0341 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0342 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0342 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0343 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0343 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0344 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0344 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0345 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0345 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0346 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0346 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0347 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0347 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0348 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0348 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0349 | json_ko | $.fields.소속 | 아관사 → 정부 |
| person-0349 | json | $.fields.Affiliation | Russian Legation Command → The Government |
| person-0350 | json_ko | $.fields.소속 | 아관사 → 정부 |
| person-0350 | json | $.fields.Affiliation | Russian Legation Command → The Government |
| person-0351 | json_ko | $.fields.소속 | 아관사 → 정부 |
| person-0351 | json | $.fields.Affiliation | Russian Legation Command → The Government |
| person-0354 | json_ko | $.fields.소속 | 아관사 → 정부 |
| person-0354 | json | $.fields.Affiliation | Russian Legation Command → The Government |
| person-0358 | json_ko | $.fields.소속 | 아관사 → 정부 |
| person-0358 | json | $.fields.Affiliation | Russian Legation Command → The Government |
| person-0360 | json_ko | $.fields.소속 | 아관사 → 정부 |
| person-0360 | json | $.fields.Affiliation | Russian Legation Command → The Government |
| person-0363 | json_ko | $.fields.소속 | 아관사 → 정부 |
| person-0363 | json | $.fields.Affiliation | Russian Legation Command → The Government |
| person-0399 | json | $.fields.Affiliation | Jeongdong Labor Federation → Arc |
| person-0436 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0436 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0446 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0452 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0452 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0457 | json_ko | $.fields.소속 | 규격맹 → 자유도시 |
| person-0457 | json | $.fields.Affiliation | Standards League → Free City |
| person-0468 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0468 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0484 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0484 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0500 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0500 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0516 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0516 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0532 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0532 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0544 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0544 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0548 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0548 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0564 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0564 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0580 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0580 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0596 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0596 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0606 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0612 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0612 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0628 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0628 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0644 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0644 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0660 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0660 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0676 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0676 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0692 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0692 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0708 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0708 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0724 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0724 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0740 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0740 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0756 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0756 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0772 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0772 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0788 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0788 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0804 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0804 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0820 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0820 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0836 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0836 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0846 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0848 | json_ko | $.fields.소속 | 여의도출자연합회 → 자유도시 |
| person-0848 | json | $.fields.Affiliation | Yeouido Investment Federation → Free City |
| person-0852 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0852 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0868 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0868 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0884 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0884 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0900 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0900 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0916 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0916 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0926 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0932 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0932 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0942 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0948 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0948 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0958 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0964 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0964 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0974 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0980 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0980 | json | $.fields.Affiliation | White Cross Order → The Government |
| person-0990 | json_ko | $.fields.소속 | 환적국 → 정부 |
| person-0996 | json_ko | $.fields.소속 | 흰십자단 → 정부 |
| person-0996 | json | $.fields.Affiliation | White Cross Order → The Government |

#### 소속/Affiliation 잎 — 문장형(090) — 20셀

| id | 열 | 경로 | old → new |
|---|---|---|---|
| person-0352 | json_ko | $.fields.소속 | 아관사 양군 공동실무 → 정부 양군 공동실무 |
| person-0356 | json_ko | $.fields.소속 | 아관사 양군 공동실무 → 정부 양군 공동실무 |
| person-0359 | json_ko | $.fields.소속 | 아관사 양군 공동실무 → 정부 양군 공동실무 |
| person-0361 | json_ko | $.fields.소속 | 아관사 양군 공동실무 → 정부 양군 공동실무 |
| person-0364 | json_ko | $.fields.소속 | 아관사 양군 공동실무 → 정부 양군 공동실무 |
| person-0367 | json_ko | $.fields.소속 | 아관사 양군 공동실무 → 정부 양군 공동실무 |
| person-0368 | json_ko | $.fields.소속 | 아관사 양군 공동실무 → 정부 양군 공동실무 |
| person-0369 | json_ko | $.fields.소속 | 아관사 양군 공동실무 → 정부 양군 공동실무 |
| person-0370 | json_ko | $.fields.소속 | 아관사 양군 공동실무 → 정부 양군 공동실무 |
| person-0371 | json_ko | $.fields.소속 | 아관사 양군 공동실무 → 정부 양군 공동실무 |
| person-0372 | json_ko | $.fields.소속 | 아관사 양군 공동실무 → 정부 양군 공동실무 |
| person-0373 | json_ko | $.fields.소속 | 아관사 양군 공동실무 → 정부 양군 공동실무 |
| person-1011 | json | $.fields.Affiliation | Free City. Interpreter Market ledger. Registered at the Standards League market counter on → Free City. Interpreter Market ledger. Registered at the Free City market counter only as a |
| person-1013 | json_ko | $.fields.소속 | 환적국. 이태원 통행 골목. 환적국 배차 창구의 통역 용역 → 정부. 이태원 통행 골목. 정부 배차 창구의 통역 용역 |
| person-1014 | json_ko | $.fields.소속 | 환적국. 울타리 용역 장부. 환적국에 창고 기억으로 등록 → 정부. 울타리 용역 장부. 정부에 창고 기억으로 등록 |
| person-1016 | json | $.fields.Affiliation | Seoul Metropolitan Government local civil service organization. Clerk of the Guro–Geumcheo → Seoul Metropolitan Government local civil service organization. Clerk of the Guro–Geumcheo |
| person-1017 | json_ko | $.fields.소속 | 2120년부터 고예진의 경호원이다. 실제로는 여러 세력의 소식과 비밀을 모아 거래하는 길목사무소에 속해 있다. → 2120년부터 고예진의 경호원이다. 실제로는 여러 세력의 소식과 비밀을 모아 거래하는 사무소에 속해 있다. |
| person-1017 | json | $.fields.Affiliation | She has been Go Ye-jin's bodyguard since 2120. In reality she belongs to the Crossroads Of → She has been Go Ye-jin's bodyguard since 2120. In reality she belongs to an office that co |
| person-1022 | json_ko | $.fields.소속 | 환적국. 독립 상단 → 정부. 독립 상단 |
| person-1022 | json | $.fields.Affiliation | Transshipment Realm. Independent Trading House → The Government. Independent Trading House |

#### 소속 잎 — Q26 선행 토큰만(090) — 1셀

| id | 열 | 경로 | old → new |
|---|---|---|---|
| person-1015 | json | $.fields.Affiliation | Anguk Monastic Grove. Koryo-saram boardinghouse register. Dual registration with both the  → The Government. Koryo-saram boardinghouse register. Dual registration with both the Arc an |

#### 본문 소속 재진술 줄(090) — 239셀

| id | 열 | 경로 | old → new |
|---|---|---|---|
| person-0001 | json_ko | $.sections.관계 | ⏎- 소속: 수문국 → ⏎- 소속: 자유도시 |
| person-0001 | json_ko | $.biography | ⏎- 소속: 수문국 → ⏎- 소속: 자유도시 |
| person-0001 | json | $.sections.Relationships | ⏎- Affiliation: Floodgate Bureau → ⏎- Affiliation: Free City |
| person-0001 | json | $.biography | ⏎- Affiliation: Floodgate Bureau → ⏎- Affiliation: Free City |
| person-0029 | json_ko | $.sections.관계 | ⏎- 소속: 규격맹 → ⏎- 소속: 자유도시 |
| person-0029 | json_ko | $.biography | ⏎- 소속: 규격맹 → ⏎- 소속: 자유도시 |
| person-0029 | json | $.sections.Relationships | ⏎- Affiliation: Standards League → ⏎- Affiliation: Free City |
| person-0029 | json | $.biography | ⏎- Affiliation: Standards League → ⏎- Affiliation: Free City |
| person-0040 | json | $.biography | ⏎- Affiliation: Standards League → ⏎- Affiliation: Free City |
| person-0072 | json | $.biography | ⏎- Affiliation: Taeuk Group → ⏎- Affiliation: Arc |
| person-0116 | json_ko | $.sections.관계 | ⏎- 소속: 동방사 → ⏎- 소속: Arc |
| person-0116 | json_ko | $.biography | ⏎- 소속: 동방사 → ⏎- 소속: Arc |
| person-0116 | json | $.sections.Relationships | ⏎- Affiliation: Eastern Command → ⏎- Affiliation: Arc |
| person-0116 | json | $.biography | ⏎- Affiliation: Eastern Command → ⏎- Affiliation: Arc |
| person-0117 | json_ko | $.biography | ⏎- 소속: 동방사 → ⏎- 소속: Arc |
| person-0117 | json | $.biography | ⏎- Affiliation: Eastern Command → ⏎- Affiliation: Arc |
| person-0118 | json_ko | $.biography | ⏎- 소속: 동방사 → ⏎- 소속: Arc |
| person-0118 | json | $.biography | ⏎- Affiliation: Eastern Command → ⏎- Affiliation: Arc |
| person-0119 | json_ko | $.biography | ⏎- 소속: 동방사 → ⏎- 소속: Arc |
| person-0119 | json | $.biography | ⏎- Affiliation: Eastern Command → ⏎- Affiliation: Arc |
| person-0120 | json_ko | $.biography | ⏎- 소속: 동방사 → ⏎- 소속: Arc |
| person-0120 | json | $.biography | ⏎- Affiliation: Eastern Command → ⏎- Affiliation: Arc |
| person-0121 | json_ko | $.biography | ⏎- 소속: 동방사 → ⏎- 소속: Arc |
| person-0121 | json | $.biography | ⏎- Affiliation: Eastern Command → ⏎- Affiliation: Arc |
| person-0122 | json_ko | $.biography | ⏎- 소속: 동방사 → ⏎- 소속: Arc |
| person-0122 | json | $.biography | ⏎- Affiliation: Eastern Command → ⏎- Affiliation: Arc |
| person-0123 | json_ko | $.biography | ⏎- 소속: 동방사 → ⏎- 소속: Arc |
| person-0123 | json | $.biography | ⏎- Affiliation: Eastern Command → ⏎- Affiliation: Arc |
| person-0124 | json_ko | $.biography | ⏎- 소속: 동방사 → ⏎- 소속: Arc |
| person-0124 | json | $.biography | ⏎- Affiliation: Eastern Command → ⏎- Affiliation: Arc |
| person-0129 | json_ko | $.biography | ⏎- 소속: 동방사 → ⏎- 소속: Arc |
| person-0129 | json | $.biography | ⏎- Affiliation: Eastern Command → ⏎- Affiliation: Arc |
| person-0130 | json_ko | $.biography | ⏎- 소속: 동방사 → ⏎- 소속: Arc |
| person-0132 | json_ko | $.biography | ⏎- 소속: 동방사 → ⏎- 소속: Arc |
| person-0133 | json_ko | $.biography | ⏎- 소속: 동방사 → ⏎- 소속: Arc |
| person-0134 | json_ko | $.biography | ⏎- 소속: 동방사 → ⏎- 소속: Arc |
| person-0135 | json_ko | $.biography | ⏎- 소속: 동방사 → ⏎- 소속: Arc |
| person-0136 | json_ko | $.biography | ⏎- 소속: 동방사 → ⏎- 소속: Arc |
| person-0141 | json_ko | $.biography | ⏎- 소속: 동방사 → ⏎- 소속: Arc |
| person-0144 | json_ko | $.biography | ⏎- 소속: 동방사 → ⏎- 소속: Arc |
| person-0144 | json | $.biography | ⏎- Affiliation: Eastern Command → ⏎- Affiliation: Arc |
| person-0170 | json_ko | $.sections.관계 | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0170 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0170 | json | $.sections.Relationships | ⏎- Affiliation: Transshipment Bureau → ⏎- Affiliation: The Government |
| person-0170 | json | $.biography | ⏎- Affiliation: Transshipment Bureau → ⏎- Affiliation: The Government |
| person-0171 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0171 | json | $.biography | ⏎- Affiliation: Transshipment Bureau → ⏎- Affiliation: The Government |
| person-0172 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0172 | json | $.biography | ⏎- Affiliation: Transshipment Bureau → ⏎- Affiliation: The Government |
| person-0173 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0173 | json | $.biography | ⏎- Affiliation: Transshipment Bureau → ⏎- Affiliation: The Government |
| person-0174 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0174 | json | $.biography | ⏎- Affiliation: Transshipment Bureau → ⏎- Affiliation: The Government |
| person-0175 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0175 | json | $.biography | ⏎- Affiliation: Transshipment Bureau → ⏎- Affiliation: The Government |
| person-0176 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0176 | json | $.biography | ⏎- Affiliation: Transshipment Bureau → ⏎- Affiliation: The Government |
| person-0177 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0177 | json | $.biography | ⏎- Affiliation: Transshipment Bureau → ⏎- Affiliation: The Government |
| person-0178 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0178 | json | $.biography | ⏎- Affiliation: Transshipment Bureau → ⏎- Affiliation: The Government |
| person-0180 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0181 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0183 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0184 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0184 | json | $.biography | ⏎- Affiliation: Transshipment Bureau → ⏎- Affiliation: The Government |
| person-0186 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0187 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0188 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0188 | json | $.biography | ⏎- Affiliation: Transshipment Bureau → ⏎- Affiliation: The Government |
| person-0189 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0189 | json | $.biography | ⏎- Affiliation: Transshipment Bureau → ⏎- Affiliation: The Government |
| person-0190 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0190 | json | $.biography | ⏎- Affiliation: Transshipment Bureau → ⏎- Affiliation: The Government |
| person-0191 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0192 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0193 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0194 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0194 | json | $.biography | ⏎- Affiliation: Transshipment Realm → ⏎- Affiliation: The Government |
| person-0246 | json_ko | $.sections.관계 | - 소속: 안국총림 → - 소속: 정부 |
| person-0246 | json_ko | $.biography | - 소속: 안국총림 → - 소속: 정부 |
| person-0250 | json | $.biography | - Affiliation: Anguk Monastic Grove → - Affiliation: The Government |
| person-0251 | json | $.biography | - Affiliation: Anguk Monastic Grove → - Affiliation: The Government |
| person-0261 | json | $.biography | - Affiliation: Anguk Monastic Grove → - Affiliation: The Government |
| person-0262 | json | $.biography | - Affiliation: Anguk Monastic Grove → - Affiliation: The Government |
| person-0272 | json_ko | $.sections.관계 | - 소속: 성하그룹 → - 소속: Arc |
| person-0272 | json_ko | $.biography | - 소속: 성하그룹 → - 소속: Arc |
| person-0272 | json | $.sections.Relationships | - Affiliation: Seongha Group → - Affiliation: Arc |
| person-0272 | json | $.biography | - Affiliation: Seongha Group → - Affiliation: Arc |
| person-0323 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0323 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0324 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0324 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0325 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0325 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0326 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0326 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0327 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0327 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0328 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0328 | json | $.biography | - Affiliation: White Cross Corps → - Affiliation: The Government |
| person-0329 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0329 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0330 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0330 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0331 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0331 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0332 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0332 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0333 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0333 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0334 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0334 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0335 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0335 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0336 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0336 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0337 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0337 | json | $.biography | - Affiliation: White Cross Corps → - Affiliation: The Government |
| person-0338 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0338 | json | $.biography | - Affiliation: White Cross Corps → - Affiliation: The Government |
| person-0339 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0339 | json | $.biography | - Affiliation: White Cross Corps → - Affiliation: The Government |
| person-0340 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0340 | json | $.biography | - Affiliation: White Cross Corps → - Affiliation: The Government |
| person-0341 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0341 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0342 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0342 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0343 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0343 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0344 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0344 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0345 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0345 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0346 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0346 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0347 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0347 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0348 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0348 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0349 | json_ko | $.sections.생애 | - 소속: 아관사 → - 소속: 정부 |
| person-0349 | json_ko | $.biography | - 소속: 아관사 → - 소속: 정부 |
| person-0349 | json | $.sections.Life | - Affiliation: Agwansa → - Affiliation: The Government |
| person-0349 | json | $.biography | - Affiliation: Agwansa → - Affiliation: The Government |
| person-0436 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0436 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0446 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0446 | json | $.biography | ⏎- Affiliation: Transshipment Bureau → ⏎- Affiliation: The Government |
| person-0452 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0452 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0457 | json_ko | $.biography | ⏎- 소속: 규격맹 → ⏎- 소속: 자유도시 |
| person-0457 | json | $.biography | ⏎- Affiliation: Standards League → ⏎- Affiliation: Free City |
| person-0468 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0468 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0484 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0484 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0500 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0500 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0516 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0516 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0532 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0532 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0548 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0548 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0564 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0564 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0580 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0580 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0596 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0596 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0606 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0606 | json | $.biography | ⏎- Affiliation: Transshipment Bureau → ⏎- Affiliation: The Government |
| person-0612 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0612 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0628 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0628 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0644 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0644 | json | $.biography | - Affiliation: White Cross Corps → - Affiliation: The Government |
| person-0660 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0660 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0676 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0676 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0692 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0692 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0708 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0708 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0724 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0724 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0740 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0740 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0756 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0756 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0772 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0772 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0788 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0788 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0804 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0804 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0820 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0820 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0836 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0836 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0846 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0852 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0852 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0868 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0868 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0884 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0884 | json | $.biography | - Affiliation: White Cross Society → - Affiliation: The Government |
| person-0900 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0900 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0916 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0916 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0926 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0932 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0932 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0942 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0948 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0948 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0958 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0964 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0964 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0974 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0974 | json | $.biography | ⏎- Affiliation: Transshipment Bureau → ⏎- Affiliation: The Government |
| person-0980 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0980 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-0990 | json_ko | $.biography | ⏎- 소속: 환적국 → ⏎- 소속: 정부 |
| person-0990 | json | $.biography | ⏎- Affiliation: Transshipment Bureau → ⏎- Affiliation: The Government |
| person-0996 | json_ko | $.biography | - 소속: 흰십자단 → - 소속: 정부 |
| person-0996 | json | $.biography | - Affiliation: White Cross Order → - Affiliation: The Government |
| person-1011 | json | $.biography | - Affiliation: Free City. Interpreter Market ledger. Registered at the Standards League ma → - Affiliation: Free City. Interpreter Market ledger. Registered at the Free City market co |
| person-1013 | json_ko | $.biography | - 소속: 환적국. 이태원 통행 골목. 환적국 배차 창구의 통역 용역 → - 소속: 정부. 이태원 통행 골목. 정부 배차 창구의 통역 용역 |
| person-1014 | json_ko | $.biography | - 소속: 환적국. 울타리 용역 장부. 환적국에 창고 기억으로 등록 → - 소속: 정부. 울타리 용역 장부. 정부에 창고 기억으로 등록 |
| person-1016 | json | $.biography | - Affiliation: Seoul Metropolitan Government local civil service organization. Mobilizatio → - Affiliation: Seoul Metropolitan Government local civil service organization. Mobilizatio |
| person-1017 | json_ko | $.biography | - 소속: 2120년부터 고예진의 경호원이다. 실제로는 여러 세력의 소식과 비밀을 모아 거래하는 길목사무소에 속해 있다. → - 소속: 2120년부터 고예진의 경호원이다. 실제로는 여러 세력의 소식과 비밀을 모아 거래하는 사무소에 속해 있다. |
| person-1017 | json | $.biography | - Affiliation: She has been Go Ye-jin's bodyguard since 2120. In reality she belongs to th → - Affiliation: She has been Go Ye-jin's bodyguard since 2120. In reality she belongs to an |
| person-1022 | json_ko | $.biography | - 소속: 환적국. 독립 상단 → - 소속: 정부. 독립 상단 |
| person-1022 | json | $.biography | - Affiliation: Transshipment Bureau. Independent merchant house → - Affiliation: The Government. Independent merchant house |

#### position/title/직함/Title 잎(090) — 132셀

| id | 열 | 경로 | old → new |
|---|---|---|---|
| person-0070 | json_ko | $.position | 태욱그룹 회장 전령 · 서초구 영주 → Arc 회장 전령 · 서초구 영주 |
| person-0070 | json_ko | $.title | 태욱그룹 회장 전령 · 서초구 영주 → Arc 회장 전령 · 서초구 영주 |
| person-0070 | json_ko | $.fields.직함 | 태욱그룹 회장 전령 → Arc 회장 전령 |
| person-0070 | json | $.position | Taeuk Group Chairman's Envoy · Lord of Seocho-gu → Arc Chairman's Envoy · Lord of Seocho-gu |
| person-0070 | json | $.title | Taeuk Group Chairman's Envoy · Lord of Seocho-gu → Arc Chairman's Envoy · Lord of Seocho-gu |
| person-0070 | json | $.fields.Title | Taeuk Group Chairman's Courier → Arc Chairman's Courier |
| person-0117 | json_ko | $.position | 동방사 참모장 → Arc 참모장 |
| person-0117 | json_ko | $.fields.직함 | 동방사 참모장 → Arc 참모장 |
| person-0117 | json | $.position | Eastern Command Chief of Staff → Arc Chief of Staff |
| person-0117 | json | $.fields.Title | Eastern Command Chief of Staff → Arc Chief of Staff |
| person-0129 | json_ko | $.position | 동방사 전령 → Arc 전령 |
| person-0129 | json_ko | $.fields.직함 | 동방사 전령 → Arc 전령 |
| person-0129 | json | $.position | Eastern Command Messenger → Arc Messenger |
| person-0129 | json | $.fields.Title | Eastern Command Messenger → Arc Messenger |
| person-0273 | json_ko | $.position | 성하전자 차량 정비 도제 → Arc 차량 정비 도제 |
| person-0273 | json_ko | $.fields.직함 | 성하전자 차량 정비 도제 → Arc 차량 정비 도제 |
| person-0273 | json | $.position | Seongha Electronics Vehicle Maintenance Apprentice → Arc Vehicle Maintenance Apprentice |
| person-0273 | json | $.fields.Title | Seongha Electronics Vehicle Maintenance Apprentice → Arc Vehicle Maintenance Apprentice |
| person-0274 | json_ko | $.position | 성하전자 작업 반장 → Arc 작업 반장 |
| person-0274 | json_ko | $.fields.직함 | 성하전자 작업 반장 → Arc 작업 반장 |
| person-0274 | json | $.position | Seongha Electronics Work Foreman → Arc Work Foreman |
| person-0274 | json | $.fields.Title | Seongha Electronics Work Foreman → Arc Work Foreman |
| person-0277 | json_ko | $.position | 성하전자 철재 회수 작업반장 → Arc 철재 회수 작업반장 |
| person-0277 | json_ko | $.fields.직함 | 성하전자 철재 회수 작업반장 → Arc 철재 회수 작업반장 |
| person-0277 | json | $.position | Seongha Electronics Scrap Iron Recovery Crew Foreman → Arc Scrap Iron Recovery Crew Foreman |
| person-0277 | json | $.fields.Title | Seongha Electronics Scrap Iron Recovery Crew Foreman → Arc Scrap Iron Recovery Crew Foreman |
| person-0278 | json_ko | $.position | 성하전자 차륜 정비사, 송하율의 실무 담당자 → Arc 차륜 정비사, 송하율의 실무 담당자 |
| person-0278 | json_ko | $.fields.직함 | 성하전자 차륜 정비사, 송하율의 실무 담당자 → Arc 차륜 정비사, 송하율의 실무 담당자 |
| person-0278 | json | $.position | Seongha Electronics Wheel Mechanic, Song Ha-yul's Practical Aide → Arc Wheel Mechanic, Song Ha-yul's Practical Aide |
| person-0278 | json | $.fields.Title | Seongha Electronics Wheel Mechanic, Song Ha-yul's Practical Aide → Arc Wheel Mechanic, Song Ha-yul's Practical Aide |
| person-0279 | json_ko | $.position | 성하전자 차륜·철재 물류상 → Arc 차륜·철재 물류상 |
| person-0279 | json_ko | $.fields.직함 | 성하전자 차륜·철재 물류상 → Arc 차륜·철재 물류상 |
| person-0279 | json | $.position | Seongha Electronics Wheel and Scrap Iron Logistics Merchant → Arc Wheel and Scrap Iron Logistics Merchant |
| person-0279 | json | $.fields.Title | Seongha Electronics Wheel and Scrap Iron Logistics Merchant → Arc Wheel and Scrap Iron Logistics Merchant |
| person-0284 | json_ko | $.position | 성하전자 작업 사고 기록관, 조우찬의 실무 담당자 → Arc 작업 사고 기록관, 조우찬의 실무 담당자 |
| person-0284 | json_ko | $.fields.직함 | 성하전자 작업 사고 기록관, 조우찬의 실무 담당자 → Arc 작업 사고 기록관, 조우찬의 실무 담당자 |
| person-0284 | json | $.position | Seongha Electronics Work Accident Recorder, Operations Aide to Jo Uchan → Arc Work Accident Recorder, Operations Aide to Jo Uchan |
| person-0284 | json | $.fields.Title | Seongha Electronics Work Accident Recorder, Operations Aide to Jo Uchan → Arc Work Accident Recorder, Operations Aide to Jo Uchan |
| person-0288 | json_ko | $.position | 성하전자 철재 회수장 거점장, 황노을의 실무 담당자 → Arc 철재 회수장 거점장, 황노을의 실무 담당자 |
| person-0288 | json_ko | $.fields.직함 | 성하전자 철재 회수장 거점장, 황노을의 실무 담당자 → Arc 철재 회수장 거점장, 황노을의 실무 담당자 |
| person-0288 | json | $.position | Seongha Electronics Steel Salvage Yard Outpost Chief, Operations Aide to Hwang Noeul → Arc Steel Salvage Yard Outpost Chief, Operations Aide to Hwang Noeul |
| person-0288 | json | $.fields.Title | Seongha Electronics Steel Salvage Yard Outpost Chief, Operations Aide to Hwang Noeul → Arc Steel Salvage Yard Outpost Chief, Operations Aide to Hwang Noeul |
| person-0290 | json_ko | $.position | 성하전자 차륜 정비 불량 폭로자 → Arc 차륜 정비 불량 폭로자 |
| person-0290 | json_ko | $.fields.직함 | 성하전자 차륜 정비 불량 폭로자 → Arc 차륜 정비 불량 폭로자 |
| person-0290 | json | $.position | Seongha Electronics Wheel Maintenance Defect Whistleblower → Arc Wheel Maintenance Defect Whistleblower |
| person-0290 | json | $.fields.Title | Seongha Electronics Wheel Maintenance Defect Whistleblower → Arc Wheel Maintenance Defect Whistleblower |
| person-0291 | json_ko | $.position | 성하전자 시험 차륜 결함 증인 → Arc 시험 차륜 결함 증인 |
| person-0291 | json_ko | $.fields.직함 | 성하전자 시험 차륜 결함 증인 → Arc 시험 차륜 결함 증인 |
| person-0291 | json | $.position | Seongha Electronics Test Wheel Defect Witness → Arc Test Wheel Defect Witness |
| person-0291 | json | $.fields.Title | Seongha Electronics Test Wheel Defect Witness → Arc Test Wheel Defect Witness |
| person-0296 | json_ko | $.position | 성하전자 차륜 교환 증인 → Arc 차륜 교환 증인 |
| person-0296 | json_ko | $.fields.직함 | 성하전자 차륜 교환 증인 → Arc 차륜 교환 증인 |
| person-0296 | json | $.position | Seongha Electronics Wheel Exchange Witness → Arc Wheel Exchange Witness |
| person-0296 | json | $.fields.Title | Seongha Electronics Wheel Exchange Witness → Arc Wheel Exchange Witness |
| person-0351 | json | $.position | Agwansa Bridge Supervisor → The Government Bridge Supervisor |
| person-0351 | json | $.fields.Title | Agwansa Bridge Supervisor → The Government Bridge Supervisor |
| person-0363 | json | $.position | Practical Aide to Mun Ha-yul, Ridge Guardpost Base Duty Officer of Agwansa → Practical Aide to Mun Ha-yul, Ridge Guardpost Base Duty Officer of The Government |
| person-0363 | json | $.fields.Title | Practical Aide to Mun Ha-yul, Ridge Guardpost Base Duty Officer of Agwansa → Practical Aide to Mun Ha-yul, Ridge Guardpost Base Duty Officer of The Government |
| person-0437 | json_ko | $.position | 아관사 능선 순찰대 → 정부 능선 순찰대 |
| person-0437 | json | $.position | Agwansa Ridge Patrol → The Government Ridge Patrol |
| person-0466 | json_ko | $.position | 성하전자 차륜 정비사 → Arc 차륜 정비사 |
| person-0466 | json | $.position | Seongha Electronics Wheel Technician → Arc Wheel Technician |
| person-0469 | json_ko | $.position | 아관사 초소 전령 → 정부 초소 전령 |
| person-0469 | json | $.position | Agwansa Outpost Courier → The Government Outpost Courier |
| person-0485 | json_ko | $.position | 아관사 능선 순찰대 → 정부 능선 순찰대 |
| person-0485 | json | $.position | Agwansa Ridge Patrol → The Government Ridge Patrol |
| person-0514 | json_ko | $.position | 성하전자 차륜 정비사 → Arc 차륜 정비사 |
| person-0514 | json | $.position | Seongha Electronics Wheel Technician → Arc Wheel Technician |
| person-0517 | json_ko | $.position | 아관사 초소 전령 → 정부 초소 전령 |
| person-0517 | json | $.position | Agwansa Outpost Courier → The Government Outpost Courier |
| person-0533 | json_ko | $.position | 아관사 능선 순찰대 → 정부 능선 순찰대 |
| person-0533 | json | $.position | Agwansa Ridge Patrol → The Government Ridge Patrol |
| person-0562 | json_ko | $.position | 성하전자 차륜 정비사 → Arc 차륜 정비사 |
| person-0562 | json | $.position | Seongha Electronics Wheel Technician → Arc Wheel Technician |
| person-0565 | json_ko | $.position | 아관사 초소 전령 → 정부 초소 전령 |
| person-0565 | json | $.position | Agwansa Outpost Courier → The Government Outpost Courier |
| person-0581 | json_ko | $.position | 아관사 능선 순찰대 → 정부 능선 순찰대 |
| person-0581 | json | $.position | Agwansa Ridge Patrol → The Government Ridge Patrol |
| person-0610 | json_ko | $.position | 성하전자 차륜 정비사 → Arc 차륜 정비사 |
| person-0610 | json | $.position | Seongha Electronics Wheel Technician → Arc Wheel Technician |
| person-0613 | json_ko | $.position | 아관사 초소 전령 → 정부 초소 전령 |
| person-0613 | json | $.position | Agwansa Outpost Courier → The Government Outpost Courier |
| person-0629 | json_ko | $.position | 아관사 능선 순찰대 → 정부 능선 순찰대 |
| person-0629 | json | $.position | Agwansa Ridge Patrol → The Government Ridge Patrol |
| person-0658 | json_ko | $.position | 성하전자 차륜 정비사 → Arc 차륜 정비사 |
| person-0658 | json | $.position | Seongha Electronics Wheel Technician → Arc Wheel Technician |
| person-0661 | json_ko | $.position | 아관사 초소 전령 → 정부 초소 전령 |
| person-0661 | json | $.position | Agwansa Outpost Courier → The Government Outpost Courier |
| person-0677 | json_ko | $.position | 아관사 능선 순찰대 → 정부 능선 순찰대 |
| person-0677 | json | $.position | Agwansa Ridge Patrol → The Government Ridge Patrol |
| person-0706 | json_ko | $.position | 성하전자 차륜 정비사 → Arc 차륜 정비사 |
| person-0706 | json | $.position | Seongha Electronics Wheel Technician → Arc Wheel Technician |
| person-0709 | json_ko | $.position | 아관사 초소 전령 → 정부 초소 전령 |
| person-0709 | json | $.position | Agwansa Outpost Courier → The Government Outpost Courier |
| person-0725 | json_ko | $.position | 아관사 능선 순찰대 → 정부 능선 순찰대 |
| person-0725 | json | $.position | Agwansa Ridge Patrol → The Government Ridge Patrol |
| person-0754 | json_ko | $.position | 성하전자 차륜 정비사 → Arc 차륜 정비사 |
| person-0754 | json | $.position | Seongha Electronics Wheel Technician → Arc Wheel Technician |
| person-0757 | json_ko | $.position | 아관사 초소 전령 → 정부 초소 전령 |
| person-0757 | json | $.position | Agwansa Outpost Courier → The Government Outpost Courier |
| person-0773 | json_ko | $.position | 아관사 능선 순찰대 → 정부 능선 순찰대 |
| person-0773 | json | $.position | Agwansa Ridge Patrol → The Government Ridge Patrol |
| person-0802 | json_ko | $.position | 성하전자 차륜 정비사 → Arc 차륜 정비사 |
| person-0802 | json | $.position | Seongha Electronics Wheel Technician → Arc Wheel Technician |
| person-0805 | json_ko | $.position | 아관사 초소 전령 → 정부 초소 전령 |
| person-0805 | json | $.position | Agwansa Outpost Courier → The Government Outpost Courier |
| person-0821 | json_ko | $.position | 아관사 능선 순찰대 → 정부 능선 순찰대 |
| person-0821 | json | $.position | Agwansa Ridge Patrol → The Government Ridge Patrol |
| person-0850 | json_ko | $.position | 성하전자 차륜 정비사 → Arc 차륜 정비사 |
| person-0850 | json | $.position | Seongha Electronics Wheel Technician → Arc Wheel Technician |
| person-0853 | json_ko | $.position | 아관사 초소 전령 → 정부 초소 전령 |
| person-0853 | json | $.position | Agwansa Outpost Courier → The Government Outpost Courier |
| person-0869 | json_ko | $.position | 아관사 능선 순찰대 → 정부 능선 순찰대 |
| person-0869 | json | $.position | Agwansa Ridge Patrol → The Government Ridge Patrol |
| person-0898 | json_ko | $.position | 성하전자 차륜 정비사 → Arc 차륜 정비사 |
| person-0898 | json | $.position | Seongha Electronics Wheel Technician → Arc Wheel Technician |
| person-0901 | json_ko | $.position | 아관사 초소 전령 → 정부 초소 전령 |
| person-0901 | json | $.position | Agwansa Outpost Courier → The Government Outpost Courier |
| person-0917 | json_ko | $.position | 아관사 능선 순찰대 → 정부 능선 순찰대 |
| person-0917 | json | $.position | Agwansa Ridge Patrol → The Government Ridge Patrol |
| person-0946 | json_ko | $.position | 성하전자 차륜 정비사 → Arc 차륜 정비사 |
| person-0946 | json | $.position | Seongha Electronics Wheel Technician → Arc Wheel Technician |
| person-0949 | json_ko | $.position | 아관사 초소 전령 → 정부 초소 전령 |
| person-0949 | json | $.position | Agwansa Outpost Courier → The Government Outpost Courier |
| person-0965 | json_ko | $.position | 아관사 능선 순찰대 → 정부 능선 순찰대 |
| person-0965 | json | $.position | Agwansa Ridge Patrol → The Government Ridge Patrol |
| person-0994 | json_ko | $.position | 성하전자 차륜 정비사 → Arc 차륜 정비사 |
| person-0994 | json | $.position | Seongha Electronics Wheel Technician → Arc Wheel Technician |
| person-0997 | json_ko | $.position | 아관사 초소 전령 → 정부 초소 전령 |
| person-0997 | json | $.position | Agwansa Outpost Courier → The Government Outpost Courier |
| person-1006 | json | $.position | Commander of the Guui Garrison of Agwansa → Commander of the Guui Garrison of The Government |
| person-1006 | json | $.title | Commander of the Guui Garrison of Agwansa → Commander of the Guui Garrison of The Government |

#### 본문 직함 재진술 세그먼트·줄(090) — 98셀

| id | 열 | 경로 | old → new |
|---|---|---|---|
| person-0070 | json_ko | $.sections.관직 | 직함은 태욱그룹 회장 전령. → 직함은 Arc 회장 전령. |
| person-0070 | json_ko | $.biography | 직함은 태욱그룹 회장 전령. → 직함은 Arc 회장 전령. |
| person-0070 | json_ko | $.biography | - 직함: 태욱그룹 회장 전령 → - 직함: Arc 회장 전령 |
| person-0070 | json | $.sections.Offices | Title: Taeuk Group Chairman's Courier. → Title: Arc Chairman's Courier. |
| person-0070 | json | $.biography | Title: Taeuk Group Chairman's Courier⏎**Life. → Title: Arc Chairman's Courier⏎**Life. |
| person-0070 | json | $.biography | Title: Taeuk Group Chairman's Courier. → Title: Arc Chairman's Courier. |
| person-0117 | json_ko | $.characterProfile.traits[1].description | 직함은 동방사 참모장. → 직함은 Arc 참모장. |
| person-0117 | json_ko | $.characterProfile.traits[1].behavior | 직함은 동방사 참모장. → 직함은 Arc 참모장. |
| person-0117 | json_ko | $.sections.관직 | 직함은 동방사 참모장. → 직함은 Arc 참모장. |
| person-0117 | json_ko | $.biography | 직함은 동방사 참모장. → 직함은 Arc 참모장. |
| person-0117 | json_ko | $.biography | - 직함: 동방사 참모장 → - 직함: Arc 참모장 |
| person-0117 | json | $.sections.Offices | Title: Eastern Command Chief of Staff. → Title: Arc Chief of Staff. |
| person-0117 | json | $.biography | Title: Eastern Command Chief of Staff⏎Life. → Title: Arc Chief of Staff⏎Life. |
| person-0117 | json | $.biography | Title: Eastern Command Chief of Staff. → Title: Arc Chief of Staff. |
| person-0129 | json_ko | $.characterProfile.traits[1].description | 직함은 동방사 전령. → 직함은 Arc 전령. |
| person-0129 | json_ko | $.characterProfile.traits[1].behavior | 직함은 동방사 전령. → 직함은 Arc 전령. |
| person-0129 | json_ko | $.sections.관직 | 직함은 동방사 전령. → 직함은 Arc 전령. |
| person-0129 | json_ko | $.biography | 직함은 동방사 전령. → 직함은 Arc 전령. |
| person-0129 | json_ko | $.biography | - 직함: 동방사 전령 → - 직함: Arc 전령 |
| person-0129 | json | $.sections.Offices | Title: Eastern Command Herald. → Title: Arc Herald. |
| person-0129 | json | $.biography | Title: Eastern Command Herald⏎Life. → Title: Arc Herald⏎Life. |
| person-0129 | json | $.biography | Title: Eastern Command Herald. → Title: Arc Herald. |
| person-0170 | json | $.sections.Offices | Title: Station Master of the Transshipment Bureau. → Title: Station Master of the Government. |
| person-0170 | json | $.sections.Relationships | Title: Station Master of the Transshipment Bureau⏎- Trade: Managing and publishing convoy  → Title: Station Master of the Government⏎- Trade: Managing and publishing convoy dispatch s |
| person-0170 | json | $.biography | Title: Station Master of the Transshipment Bureau. → Title: Station Master of the Government. |
| person-0170 | json | $.biography | Title: Station Master of the Transshipment Bureau⏎- Trade: Managing and publishing convoy  → Title: Station Master of the Government⏎- Trade: Managing and publishing convoy dispatch s |
| person-0273 | json_ko | $.characterProfile.traits[1].behavior | 직함은 성하전자 차량 정비 도제. → 직함은 Arc 차량 정비 도제. |
| person-0273 | json_ko | $.sections.관직 | 직함은 성하전자 차량 정비 도제. → 직함은 Arc 차량 정비 도제. |
| person-0273 | json_ko | $.biography | 직함은 성하전자 차량 정비 도제. → 직함은 Arc 차량 정비 도제. |
| person-0273 | json_ko | $.biography | - 직함: 성하전자 차량 정비 도제 → - 직함: Arc 차량 정비 도제 |
| person-0273 | json | $.sections.Offices | Title: Seongha Electronics Vehicle Maintenance Apprentice. → Title: Arc Vehicle Maintenance Apprentice. |
| person-0273 | json | $.biography | Title: Seongha Electronics Vehicle Maintenance Apprentice⏎**Life. → Title: Arc Vehicle Maintenance Apprentice⏎**Life. |
| person-0273 | json | $.biography | Title: Seongha Electronics Vehicle Maintenance Apprentice. → Title: Arc Vehicle Maintenance Apprentice. |
| person-0274 | json_ko | $.characterProfile.traits[1].behavior | 직함은 성하전자 작업 반장. → 직함은 Arc 작업 반장. |
| person-0274 | json_ko | $.sections.관직 | 직함은 성하전자 작업 반장. → 직함은 Arc 작업 반장. |
| person-0274 | json_ko | $.biography | 직함은 성하전자 작업 반장. → 직함은 Arc 작업 반장. |
| person-0274 | json_ko | $.biography | - 직함: 성하전자 작업 반장 → - 직함: Arc 작업 반장 |
| person-0274 | json | $.sections.Offices | Title: Seongha Electronics Work Foreman. → Title: Arc Work Foreman. |
| person-0274 | json | $.biography | Title: Seongha Electronics Work Foreman⏎**Life. → Title: Arc Work Foreman⏎**Life. |
| person-0274 | json | $.biography | Title: Seongha Electronics Work Foreman. → Title: Arc Work Foreman. |
| person-0277 | json_ko | $.characterProfile.traits[1].behavior | 직함은 성하전자 철재 회수 작업반장. → 직함은 Arc 철재 회수 작업반장. |
| person-0277 | json_ko | $.sections.관직 | 직함은 성하전자 철재 회수 작업반장. → 직함은 Arc 철재 회수 작업반장. |
| person-0277 | json_ko | $.biography | 직함은 성하전자 철재 회수 작업반장. → 직함은 Arc 철재 회수 작업반장. |
| person-0277 | json_ko | $.biography | - 직함: 성하전자 철재 회수 작업반장 → - 직함: Arc 철재 회수 작업반장 |
| person-0277 | json | $.sections.Offices | Title: Seongha Electronics Steel Recovery Crew Chief. → Title: Arc Steel Recovery Crew Chief. |
| person-0277 | json | $.biography | Title: Seongha Electronics Steel Recovery Crew Chief⏎**Life. → Title: Arc Steel Recovery Crew Chief⏎**Life. |
| person-0277 | json | $.biography | Title: Seongha Electronics Steel Recovery Crew Chief. → Title: Arc Steel Recovery Crew Chief. |
| person-0278 | json_ko | $.characterProfile.traits[1].behavior | 직함은 성하전자 차륜 정비사, 송하율의 실무 담당자. → 직함은 Arc 차륜 정비사, 송하율의 실무 담당자. |
| person-0278 | json_ko | $.sections.관직 | 직함은 성하전자 차륜 정비사, 송하율의 실무 담당자. → 직함은 Arc 차륜 정비사, 송하율의 실무 담당자. |
| person-0278 | json_ko | $.biography | 직함은 성하전자 차륜 정비사, 송하율의 실무 담당자. → 직함은 Arc 차륜 정비사, 송하율의 실무 담당자. |
| person-0278 | json_ko | $.biography | - 직함: 성하전자 차륜 정비사, 송하율의 실무 담당자 → - 직함: Arc 차륜 정비사, 송하율의 실무 담당자 |
| person-0278 | json | $.sections.Offices | Title: Seongha Electronics Wheel Mechanic, Song Hayul's Practical Aide. → Title: Arc Wheel Mechanic, Song Hayul's Practical Aide. |
| person-0278 | json | $.biography | Title: Seongha Electronics Wheel Mechanic, Song Hayul's Practical Aide⏎**Life. → Title: Arc Wheel Mechanic, Song Hayul's Practical Aide⏎**Life. |
| person-0278 | json | $.biography | Title: Seongha Electronics Wheel Mechanic, Song Hayul's Practical Aide. → Title: Arc Wheel Mechanic, Song Hayul's Practical Aide. |
| person-0279 | json_ko | $.characterProfile.traits[1].behavior | 직함은 성하전자 차륜·철재 물류상. → 직함은 Arc 차륜·철재 물류상. |
| person-0279 | json_ko | $.sections.관직 | 직함은 성하전자 차륜·철재 물류상. → 직함은 Arc 차륜·철재 물류상. |
| person-0279 | json_ko | $.biography | 직함은 성하전자 차륜·철재 물류상. → 직함은 Arc 차륜·철재 물류상. |
| person-0279 | json_ko | $.biography | - 직함: 성하전자 차륜·철재 물류상 → - 직함: Arc 차륜·철재 물류상 |
| person-0279 | json | $.sections.Offices | Title: Seongha Electronics Wheel and Steel Logistics Merchant. → Title: Arc Wheel and Steel Logistics Merchant. |
| person-0279 | json | $.biography | Title: Seongha Electronics Wheel and Steel Logistics Merchant⏎**Life. → Title: Arc Wheel and Steel Logistics Merchant⏎**Life. |
| person-0279 | json | $.biography | Title: Seongha Electronics Wheel and Steel Logistics Merchant. → Title: Arc Wheel and Steel Logistics Merchant. |
| person-0284 | json_ko | $.characterProfile.traits[1].behavior | 직함은 성하전자 작업 사고 기록관, 조우찬의 실무 담당자. → 직함은 Arc 작업 사고 기록관, 조우찬의 실무 담당자. |
| person-0284 | json_ko | $.sections.관직 | 직함은 성하전자 작업 사고 기록관, 조우찬의 실무 담당자. → 직함은 Arc 작업 사고 기록관, 조우찬의 실무 담당자. |
| person-0284 | json_ko | $.biography | 직함은 성하전자 작업 사고 기록관, 조우찬의 실무 담당자. → 직함은 Arc 작업 사고 기록관, 조우찬의 실무 담당자. |
| person-0284 | json_ko | $.biography | - 직함: 성하전자 작업 사고 기록관, 조우찬의 실무 담당자 → - 직함: Arc 작업 사고 기록관, 조우찬의 실무 담당자 |
| person-0284 | json | $.sections.Offices | Title: Seongha Electronics Work Accident Recorder, Jo Uchan's working-level deputy. → Title: Arc Work Accident Recorder, Jo Uchan's working-level deputy. |
| person-0284 | json | $.biography | Title: Seongha Electronics Work Accident Recorder, Jo Uchan's working-level deputy⏎**Life. → Title: Arc Work Accident Recorder, Jo Uchan's working-level deputy⏎**Life. |
| person-0284 | json | $.biography | Title: Seongha Electronics Work Accident Recorder, Jo Uchan's working-level deputy. → Title: Arc Work Accident Recorder, Jo Uchan's working-level deputy. |
| person-0288 | json_ko | $.characterProfile.traits[1].behavior | 직함은 성하전자 철재 회수장 거점장, 황노을의 실무 담당자. → 직함은 Arc 철재 회수장 거점장, 황노을의 실무 담당자. |
| person-0288 | json_ko | $.sections.관직 | 직함은 성하전자 철재 회수장 거점장, 황노을의 실무 담당자. → 직함은 Arc 철재 회수장 거점장, 황노을의 실무 담당자. |
| person-0288 | json_ko | $.biography | 직함은 성하전자 철재 회수장 거점장, 황노을의 실무 담당자. → 직함은 Arc 철재 회수장 거점장, 황노을의 실무 담당자. |
| person-0288 | json_ko | $.biography | - 직함: 성하전자 철재 회수장 거점장, 황노을의 실무 담당자 → - 직함: Arc 철재 회수장 거점장, 황노을의 실무 담당자 |
| person-0288 | json | $.sections.Offices | Title: Hub Chief of the Seongha Electronics Steel Recovery Yard, Hwang Noeul's Working-Lev → Title: Hub Chief of the Arc Steel Recovery Yard, Hwang Noeul's Working-Level Aide. |
| person-0288 | json | $.biography | Title: Hub Chief of the Seongha Electronics Steel Recovery Yard, Hwang Noeul's Working-Lev → Title: Hub Chief of the Arc Steel Recovery Yard, Hwang Noeul's Working-Level Aide⏎**Life. |
| person-0288 | json | $.biography | Title: Hub Chief of the Seongha Electronics Steel Recovery Yard, Hwang Noeul's Working-Lev → Title: Hub Chief of the Arc Steel Recovery Yard, Hwang Noeul's Working-Level Aide. |
| person-0290 | json_ko | $.characterProfile.traits[1].behavior | 직함은 성하전자 차륜 정비 불량 폭로자. → 직함은 Arc 차륜 정비 불량 폭로자. |
| person-0290 | json_ko | $.sections.관직 | 직함은 성하전자 차륜 정비 불량 폭로자. → 직함은 Arc 차륜 정비 불량 폭로자. |
| person-0290 | json_ko | $.biography | 직함은 성하전자 차륜 정비 불량 폭로자. → 직함은 Arc 차륜 정비 불량 폭로자. |
| person-0290 | json_ko | $.biography | - 직함: 성하전자 차륜 정비 불량 폭로자 → - 직함: Arc 차륜 정비 불량 폭로자 |
| person-0290 | json | $.sections.Offices | Title: Seongha Electronics Wheel Maintenance Defect Whistleblower. → Title: Arc Wheel Maintenance Defect Whistleblower. |
| person-0290 | json | $.biography | Title: Seongha Electronics Wheel Maintenance Defect Whistleblower⏎**Life. → Title: Arc Wheel Maintenance Defect Whistleblower⏎**Life. |
| person-0290 | json | $.biography | Title: Seongha Electronics Wheel Maintenance Defect Whistleblower. → Title: Arc Wheel Maintenance Defect Whistleblower. |
| person-0291 | json_ko | $.characterProfile.traits[1].behavior | 직함은 성하전자 시험 차륜 결함 증인. → 직함은 Arc 시험 차륜 결함 증인. |
| person-0291 | json_ko | $.sections.관직 | 직함은 성하전자 시험 차륜 결함 증인. → 직함은 Arc 시험 차륜 결함 증인. |
| person-0291 | json_ko | $.biography | 직함은 성하전자 시험 차륜 결함 증인. → 직함은 Arc 시험 차륜 결함 증인. |
| person-0291 | json_ko | $.biography | - 직함: 성하전자 시험 차륜 결함 증인 → - 직함: Arc 시험 차륜 결함 증인 |
| person-0291 | json | $.sections.Offices | Title: Seongha Electronics Test Wheel Defect Witness. → Title: Arc Test Wheel Defect Witness. |
| person-0291 | json | $.biography | Title: Seongha Electronics Test Wheel Defect Witness⏎**Life. → Title: Arc Test Wheel Defect Witness⏎**Life. |
| person-0291 | json | $.biography | Title: Seongha Electronics Test Wheel Defect Witness. → Title: Arc Test Wheel Defect Witness. |
| person-0295 | json_ko | $.characterProfile.traits[1].behavior | 직함은 성하전자 바깥 작업장 사절 기술자. → 직함은 Arc 바깥 작업장 사절 기술자. |
| person-0296 | json_ko | $.characterProfile.traits[1].behavior | 직함은 성하전자 차륜 교환 증인. → 직함은 Arc 차륜 교환 증인. |
| person-0296 | json_ko | $.sections.관직 | 직함은 성하전자 차륜 교환 증인. → 직함은 Arc 차륜 교환 증인. |
| person-0296 | json_ko | $.biography | 직함은 성하전자 차륜 교환 증인. → 직함은 Arc 차륜 교환 증인. |
| person-0296 | json_ko | $.biography | - 직함: 성하전자 차륜 교환 증인 → - 직함: Arc 차륜 교환 증인 |
| person-0296 | json | $.sections.Offices | Title: Seongha Electronics Wheel Exchange Witness. → Title: Arc Wheel Exchange Witness. |
| person-0296 | json | $.biography | Title: Seongha Electronics Wheel Exchange Witness⏎**Life. → Title: Arc Wheel Exchange Witness⏎**Life. |
| person-0296 | json | $.biography | Title: Seongha Electronics Wheel Exchange Witness. → Title: Arc Wheel Exchange Witness. |
| person-0416 | json | $.biography | Role: Union Member⏎- Duty: Joint Bargaining Signature Clerk of the Jeongdong Labor Federat → Role: Union Member⏎- Duty: Joint Bargaining Signature Clerk of the Arc⏎**Life. |

#### 직무/Duty 잎(090) — 19셀

| id | 열 | 경로 | old → new |
|---|---|---|---|
| person-0400 | json | $.sections.Duty | The community role is union member, and the duty is contract clerk. This duty is an intern → The community role is union member, and the duty is contract clerk. This duty is an intern |
| person-0401 | json | $.sections.Duty | The community role is union member, and the duty is audit assistant. This duty is an inter → The community role is union member, and the duty is audit assistant. This duty is an inter |
| person-0403 | json | $.sections.Duty | The community role is union member, and the duty is clerk of the Union Skill Review Commit → The community role is union member, and the duty is clerk of the Union Skill Review Commit |
| person-0404 | json | $.sections.Duty | The community role is union member, and the duty is clerk of the Union Member Election Com → The community role is union member, and the duty is clerk of the Union Member Election Com |
| person-0407 | json | $.sections.Duty | The community role is union member, and the duty is Convention Council Clinic Station Medi → The community role is union member, and the duty is Convention Council Clinic Station Medi |
| person-0408 | json | $.sections.Duty | The community role is union member, and the duty is Southern Outskirts Patrol. This duty i → The community role is union member, and the duty is Southern Outskirts Patrol. This duty i |
| person-0409 | json | $.sections.Duty | The community role is union member, and the duty is Union General Assembly Courier and An  → The community role is union member, and the duty is Union General Assembly Courier and An  |
| person-0410 | json | $.sections.Duty | The community role is guild member, and the duty is Sicheong Station outer scout. This dut → The community role is guild member, and the duty is Sicheong Station outer scout. This dut |
| person-0411 | json | $.sections.Duty | The community role is guild member, and the duty is working-level aide to Gwak Eunjae, Los → The community role is guild member, and the duty is working-level aide to Gwak Eunjae, Los |
| person-0412 | json | $.sections.Duty | The community role is Branch Chief, and the duty is Sicheong Station Waiting Hall Post Chi → The community role is Branch Chief, and the duty is Sicheong Station Waiting Hall Post Chi |
| person-0413 | json | $.sections.Duty | The community role is Branch Chief, and the duty is Underground Facility Defense Squad Pos → The community role is Branch Chief, and the duty is Underground Facility Defense Squad Pos |
| person-0414 | json | $.sections.Duty | The community role is member and the duty is Sicheong Station Guild Vehicle Depot Duty Chi → The community role is member and the duty is Sicheong Station Guild Vehicle Depot Duty Chi |
| person-0415 | json | $.sections.Duty | The community role is branch chief, and the duty is Chief Operator of Archive-Assembly Eme → The community role is branch chief, and the duty is Chief Operator of Archive-Assembly Eme |
| person-0416 | json | $.sections.Duty | The community role is union member, and the duty is Joint Bargaining Signature Clerk of th → The community role is union member, and the duty is Joint Bargaining Signature Clerk of th |
| person-0419 | json | $.sections.Duty | The community role is union member, and the duty is water-supply contract signature witnes → The community role is union member, and the duty is water-supply contract signature witnes |
| person-0420 | json | $.sections.Duty | His community role is union member, and his duty is multi-state ratification audit assista → His community role is union member, and his duty is multi-state ratification audit assista |
| person-0421 | json | $.sections.Duty | Their community role is union member, and their duty is Requisitioned Refugee Crowd Repres → Their community role is union member, and their duty is Requisitioned Refugee Crowd Repres |
| person-0422 | json | $.sections.Duty | The community role is union member, and the duty is Black Dispatch Train Inquiry Witness.  → The community role is union member, and the duty is Black Dispatch Train Inquiry Witness.  |
| person-0423 | json | $.sections.Duty | The community role is union member, and the duty is Contract Audit Clerk. This duty is an  → The community role is union member, and the duty is Contract Audit Clerk. This duty is an  |

#### wiki_person 직위(050) — 3셀

| id | 열 | 경로 | old → new |
|---|---|---|---|
| person-0070 | position | $ | Taeuk Group Chairman's Envoy · Lord of Seocho-gu → Arc Chairman's Envoy · Lord of Seocho-gu |
| person-0070 | position_ko | $ | 태욱그룹 회장 전령 · 서초구 영주 → Arc 회장 전령 · 서초구 영주 |
| person-0399 | position | $ | Jeongdong Labor Federation Chairperson → Arc Chairperson |


## 4. 보존(소유자 대기) — 변경하지 않은 셀

| id | 열 | 경로 | 값 |
|---|---|---|---|
| person-0001 | json_ko | $.position | 수문국 선출 군주 |
| person-0001 | json_ko | $.fields.직함 | 수문국 선출 군주 |
| person-0001 | json_ko | $.sections.관직 | 직함은 수문국 선출 군주. |
| person-0001 | json_ko | $.sections.관계 | - 직함: 수문국 선출 군주 |
| person-0001 | json_ko | $.biography | 직함은 수문국 선출 군주. |
| person-0001 | json_ko | $.biography | - 직함: 수문국 선출 군주 |
| person-0001 | json | $.position | Elected Sovereign of the Floodgate State |
| person-0001 | json | $.fields.Title | Elected Sovereign of the Floodgate State |
| person-0001 | json | $.sections.Offices | Title: Elected Monarch of the Floodgate Bureau. |
| person-0001 | json | $.sections.Relationships | Title: Elected Monarch of the Floodgate Bureau⏎- Work Location: Yangpyeong 1-don |
| person-0001 | json | $.sections.Relationships | - Title: Elected Monarch of the Floodgate Bureau |
| person-0001 | json | $.biography | Title: Elected Monarch of the Floodgate Bureau. |
| person-0001 | json | $.biography | Title: Elected Monarch of the Floodgate Bureau⏎- Work Location: Yangpyeong 1-don |
| person-0001 | json | $.biography | - Title: Elected Monarch of the Floodgate Bureau |
| person-0029 | json_ko | $.position | 규격맹 위원장 |
| person-0029 | json_ko | $.fields.직함 | 규격맹 위원장 |
| person-0029 | json_ko | $.sections.관직 | 직함은 규격맹 위원장. |
| person-0029 | json_ko | $.sections.관계 | - 직함: 규격맹 위원장 |
| person-0029 | json_ko | $.biography | 직함은 규격맹 위원장. |
| person-0029 | json_ko | $.biography | - 직함: 규격맹 위원장 |
| person-0029 | json | $.position | Chair of the Standards League |
| person-0029 | json | $.fields.Title | Chair of the Standards League |
| person-0029 | json | $.sections.Offices | Title: Chairman of the Standards League. |
| person-0029 | json | $.sections.Relationships | Title: Chairman of the Standards League⏎- Work location: Guro 5-dong. |
| person-0029 | json | $.sections.Relationships | - Title: Chairman of the Standards League |
| person-0029 | json | $.biography | Title: Chairman of the Standards League. |
| person-0029 | json | $.biography | Title: Chairman of the Standards League⏎- Work location: Guro 5-dong. |
| person-0029 | json | $.biography | - Title: Chairman of the Standards League |
| person-0116 | json_ko | $.position | 동방사 사령관 |
| person-0116 | json_ko | $.fields.직함 | 동방사 사령관 |
| person-0116 | json_ko | $.sections.관직 | 직함은 동방사 사령관. |
| person-0116 | json_ko | $.sections.관계 | - 직함: 동방사 사령관 |
| person-0116 | json_ko | $.biography | 직함은 동방사 사령관. |
| person-0116 | json_ko | $.biography | - 직함: 동방사 사령관 |
| person-0116 | json | $.position | Eastern Command Commander |
| person-0116 | json | $.fields.Title | Eastern Command Commander |
| person-0116 | json | $.sections.Offices | Title: Commander of the Eastern Command. |
| person-0116 | json | $.sections.Relationships | Title: Commander of the Eastern Command⏎- Bae Ujin handles the restoration-servi |
| person-0116 | json | $.sections.Relationships | - Title: Commander of the Eastern Command |
| person-0116 | json | $.biography | Title: Eastern Command Commander. |
| person-0116 | json | $.biography | Title: Eastern Command Commander⏎- Bae Ujin handles the restoration-service roll |
| person-0116 | json | $.biography | - Title: Eastern Command Commander |
| person-0220 | json_ko | $.position | 여의도출자연합회 의장 |
| person-0220 | json_ko | $.sections.관직 | 직함은 여의도출자연합회 의장. |
| person-0220 | json_ko | $.biography | 직함은 여의도출자연합회 의장. |
| person-0220 | json | $.position | Yeouido Investment Federation Chairperson |
| person-0220 | json | $.sections.Offices | Title: Chair of the Yeouido Investment Federation. |
| person-0220 | json | $.biography | Title: Chair of the Yeouido Investment Federation. |
| person-0246 | json_ko | $.position | 안국총림 방장 |
| person-0246 | json_ko | $.fields.직함 | 안국총림 방장 |
| person-0246 | json_ko | $.sections.관직 | 직함은 안국총림 방장. |
| person-0246 | json_ko | $.sections.관계 | - 직함: 안국총림 방장 |
| person-0246 | json_ko | $.biography | 직함은 안국총림 방장. |
| person-0246 | json_ko | $.biography | - 직함: 안국총림 방장 |
| person-0246 | json | $.position | Abbot of Anguk Grand Monastery |
| person-0246 | json | $.fields.Title | Abbot of Anguk Grand Monastery |
| person-0272 | json_ko | $.position | 성하그룹 회장, 이씨 가문 세습 |
| person-0272 | json_ko | $.fields.직함 | 성하그룹 회장, 이씨 가문 세습 |
| person-0272 | json_ko | $.sections.관직 | 직함은 성하그룹 회장, 이씨 가문 세습. |
| person-0272 | json_ko | $.sections.관계 | - 직함: 성하그룹 회장, 이씨 가문 세습 |
| person-0272 | json_ko | $.biography | 직함은 성하그룹 회장, 이씨 가문 세습. |
| person-0272 | json_ko | $.biography | - 직함: 성하그룹 회장, 이씨 가문 세습 |
| person-0272 | json | $.position | Chairman of Seongha Group, Hereditary Position of the Yi Family |
| person-0272 | json | $.fields.Title | Chairman of Seongha Group, Hereditary Position of the Yi Family |
| person-0272 | json | $.sections.Offices | Title: Chairman of Seongha Group, hereditary in the Yi clan. |
| person-0272 | json | $.sections.Relationships | Title: Chairman of Seongha Group, hereditary in the Yi clan⏎- Yi Hongwon handles |
| person-0272 | json | $.sections.Relationships | - Title: Chairman of Seongha Group, hereditary in the Yi clan |
| person-0272 | json | $.biography | Title: Chairman of Seongha Group, hereditary in the Yi clan. |
| person-0272 | json | $.biography | Title: Chairman of Seongha Group, hereditary in the Yi clan⏎- Yi Hongwon handles |
| person-0272 | json | $.biography | - Title: Chairman of Seongha Group, hereditary in the Yi clan |
| person-0297 | json_ko | $.position | 신내운수 사장 |
| person-0297 | json_ko | $.fields.직함 | 신내운수 사장 |
| person-0297 | json_ko | $.biography | 직함은 신내운수 사장. |
| person-0297 | json_ko | $.biography | - 직함: 신내운수 사장 |
| person-0297 | json | $.position | Sinnae Transport President |
| person-0297 | json | $.fields.Title | Sinnae Transport President |
| person-0323 | json_ko | $.position | 흰십자단 단장 |
| person-0323 | json_ko | $.fields.직함 | 흰십자단 단장 |
| person-0323 | json_ko | $.biography | - 직함: 흰십자단 단장 |
| person-0323 | json | $.position | White Cross Corps Leader |
| person-0323 | json | $.fields.Title | White Cross Corps Leader |
| person-0323 | json | $.biography | Title: Commander of the White Cross Order⏎- The Jegi-dong herb inspection, marke |
| person-0323 | json | $.biography | - Title: Commander of the White Cross Order |
| person-0349 | json_ko | $.position | 아관사 사령관 |
| person-0349 | json_ko | $.title | 아관사 관문사령관 |
| person-0349 | json_ko | $.fields.직함 | 아관사 사령관 |
| person-0349 | json_ko | $.sections.생애 | 직함은 아관사 사령관. |
| person-0349 | json_ko | $.sections.생애 | - 직함: 아관사 사령관 |
| person-0349 | json_ko | $.biography | 직함은 아관사 사령관. |
| person-0349 | json_ko | $.biography | - 직함: 아관사 사령관 |
| person-0349 | json | $.position | Agwansa Commander |
| person-0349 | json | $.title | Agwansa Gate Commander |
| person-0349 | json | $.fields.Title | Agwansa Commander |
| person-0349 | json | $.sections.Life | Title: Agwansa Commander. |
| person-0349 | json | $.sections.Life | Title: Agwansa Commander⏎- Work location: Area of Guui 1-dong administrative dis |
| person-0349 | json | $.sections.Life | - Title: Agwansa Commander |
| person-0349 | json | $.biography | Title: Agwansa Commander. |
| person-0349 | json | $.biography | Title: Agwansa Commander⏎- Work location: Area of Guui 1-dong administrative dis |
| person-0349 | json | $.biography | - Title: Agwansa Commander |
| person-1005 | json_ko | $.position | 태욱그룹 회장 |
| person-1005 | json_ko | $.sections.관직 | 직함은 태욱그룹 회장. |
| person-1005 | json_ko | $.biography | 직함은 태욱그룹 회장. |
| person-1005 | json | $.position | Chairman of the Taeuk Group |
| person-1005 | json | $.sections.Offices | Title: Chairwoman of Taeuk Group. |
| person-1005 | json | $.biography | Title: Chairwoman of Taeuk Group. |
| person-1015 | json_ko | $.fields.소속 | 정부. 고려인 하숙 명부. Arc와 안국총림 사이에 이중 등록 |
| person-1015 | json_ko | $.biography | - 소속: 정부. 고려인 하숙 명부. Arc와 안국총림 사이에 이중 등록 |
| person-0001 | position | $ | Elected Sovereign of the Floodgate State |
| person-0001 | position_ko | $ | 수문국 선출 군주 |
| person-0029 | position | $ | Chair of the Standards League |
| person-0029 | position_ko | $ | 규격맹 위원장 |
| person-0116 | position | $ | Eastern Command Commander |
| person-0116 | position_ko | $ | 동방사 사령관 |
| person-0195 | position | $ | Director of the Central Intelligence Agency |
| person-0195 | position_ko | $ | 중앙정보부 원장 |
| person-0220 | position | $ | Yeouido Investment Federation Chairperson |
| person-0220 | position_ko | $ | 여의도출자연합회 의장 |
| person-0246 | position | $ | Abbot of Anguk Grand Monastery |
| person-0246 | position_ko | $ | 안국총림 방장 |
| person-0272 | position | $ | Chairman of Seongha Group, Hereditary Position of the Yi Family |
| person-0272 | position_ko | $ | 성하그룹 회장, 이씨 가문 세습 |
| person-0297 | position | $ | Sinnae Transport President |
| person-0297 | position_ko | $ | 신내운수 사장 |
| person-0323 | position | $ | White Cross Corps Leader |
| person-0323 | position_ko | $ | 흰십자단 단장 |
| person-0349 | position | $ | Agwansa Commander |
| person-0349 | position_ko | $ | 아관사 사령관 |
| person-0349 | title | $ | Agwansa Gate Commander |
| person-0349 | title_ko | $ | 아관사 관문사령관 |
| person-1005 | position | $ | Chairman of the Taeuk Group |
| person-1005 | position_ko | $ | 태욱그룹 회장 |


추가 보존·대기:
- **person-1015**: 소속 잎 '정부. 고려인 하숙 명부. Arc와 안국총림 사이에 이중 등록'(KO)은 Q26 계열 서술로 그대로 두었고, 영문 소속 잎의 선행 토큰 'Anguk Monastic Grove.'만 'The Government.'로 KO에 맞췄다. 문장 안 이중등록 언급은 Q26 대기.
- **person-1017**: 소속 문장에서 이름('길목사무소'/'the Crossroads Office')만 제거했다. 길목 계열 처우는 Q5 대기.
- **person-0235·0236**: 소속 '여의도출자연합회'/'Yeouido Investment Federation' → 로스터 세력 표기 '정부'/'The Government'로 바꾸고 이 목록에 올린다(과업 지시).
- **person-0246(백온)**: 소속 '안국총림'→'정부'·'Anguk Grand Monastery'→'The Government'(Q26 예외 조항: 잎이 정확히 조직명 소속 줄), 직함 '안국총림 방장'은 Q26 대기로 보존.

## 4-1. person-1016 — 정부 서기의 자유도시 장부 기재(소유자 대기 메모, 수정 아님)

- person-1016은 로스터 세력 정부(stateName '정부'/'The Government')다. origin/main의 한국어 소속 문장은 이미 "서울특별시 지방공무원 조직. 구로·금천 축 동원잔존 서기. 자유도시 장부에는 「외부 무장」"이었다 — 구로·금천 축 동원잔존의 정부 서기가 자유도시 장부에는 '외부 무장'으로 올라 있다는 서술이다.
- 규칙 #5936·#5937은 영문 절 'Listed in the Standards League ledger as "External Armed"'만 같은 자유도시 표기('Listed in the Free City ledger …')로 맞췄다. 이제 KO/EN이 일치하며 로스터 세력은 정부 그대로다.
- **소유자 확인 필요**: 정부 서기가 자유도시 장부에 기재되는 것이 맞는가? 이는 수정 사항이 아니라 대기 메모이며, 이 PR은 이름만 바꾸고 서술 내용은 유지했다.

## 5. 소유자 대기 — 문서·서술 잔존(이번 범위 밖)

- **문서 본문(wiki_document 29건·gdd_document 4건, 매치 합계 1226)**: Century-Annals 301, Hostile-Ecology-Index 313, External-Theaters 80, G07 60, G08 52, G11 52, G12 50, G09 46, G21 36, G22 28, G19 31, Oral-Stories 14, Ailments 7, Era-Arms 2, Scenario-Timeline 1, G01 11, G02 10, G03 8, G04 10, G05 16, G06 8, G10 10, G13 2, G14 2, G16 3, G17 3, G18 2, G20 4, G24 4; gdd doc.mechanism-design-index-d09 30, doc.Singleplayer-Design-SP-1-0-0 22, doc.mechanism-design-index-d11 7, doc.mechanism-design-index-d01 1. 연대기·생태 도감의 역사 서술은 별도 판단이 필요하다(과업 지시: 문서는 별도 패스).
- **person_detail 서술 문장(비-대상 잎, 매치 709)**: 야망·공포·특성(stress/behavior)·생애·일화·관계 서술의 "규격맹의 뼈대를 만든다", "동방사의 비상 도장", "수문국 급수계약의 볼모" 같은 현재형 이야기 문장. 소속·직위 표시가 아니라 서사이므로 이번 최소 범위에서 바꾸지 않았다.
- **$.occupation 잎 12인(+person-0272)**: '성하전자 차륜 정비 기록·열쇠 인계' 등. 과업 대상 열(소속·직위·직함·stateName)에 없어 그대로 두었다. 이 가운데 0466·0514·0562·0610·0658·0706·0754·0802·0850·0902인은 로스터 occupation이 이미 'Arc 차륜 정비 기록·열쇠 인계'로 중립이어서 상세만 옛 이름인 상태다(정렬 대기). person-0272는 로스터·상세 모두 '성하전자 원로'.
- **공작령명(개막 영토 작위)**: '서대문구 여의도출자연합회 공작령', '서초구 태욱그룹 공작령' 등 openingTitles·holdings의 표기는 지도 표(map_title) 원본을 비춘 것이고 지도 표는 과업 변경 금지 대상이라 그대로 두었다.
- **Q28 계열 stateName 19건**: '대한민국정부'/'Government of the Republic of Korea' 18인 + person-0195 '정보기관'(변경 전 상태 그대로).
- **157개 소유자 대기 문장 목록(`docs/drafts/reports/w5-28-owner-pending-sentences.json`)**: 문서 문장은 그대로다. 다만 Q29 계열 가운데 인물 페이지에 렌더되던 소속 줄은 이번 결정으로 바뀌었으므로, Q29 목록 재정리 시 이 PR 결과를 기준으로 다시 뽑아야 한다.

## 6. 검증 (푸시 전)

- **데이터 diff(origin/main 대비, node:sqlite, `w5-28-compare-sql.mjs`)**: 26개 표 행수 전부 불변. 변경은 person_detail 634행(json 607·json_ko 570 셀)과 wiki_person 2행(position 2·position_ko 1)뿐. 대상 잎(소속·직위·직함·stateName)의 조직명 잔존: 보존 목록 외 0. 로스터 조직명 셀: 보존 24셀 외 0.
- **재현성·실패 증명**: origin/main 트리 + 최종 규칙 JSON으로 `FIX2_FROM=4348` 재실행 → 090·050·110·115 **SHA-256 바이트 동일**, 적용 로그 perRule 1,601건 동일. 변조 규칙(rules[4348].old에 허위 접미) → **exit 21** `E_NO_UNIQUE_MATCH` + data/sql 무기록·무로그.
- **빌드·검사**: `w5-28-run-build.mjs --out <repo 밖>` → **BUILD_EXIT=0**, check-site exit 0 — 단편 32955 링크, **known-broken 0, new-broken 0**(EN 1,428 + KO 1,428 + showcase 1). 중복 id 검사 → **2858페이지(= index.html 2,857 + 404.html 1), 중복 0**. `scan-terms --all` → 문서 59·페이지 118, **금지 0·필수 0**. `w5-28-scan-built` 재생성 → 2858페이지·매치 분류 합계 1,571(`docs/drafts/reports/w5-28-scan-built.json` byClass: sixteen 19, church 21, old-org 1447, y2030 78, slaughter 6; 앞선 판의 church 22는 오기) — JSON 내용이 달라져 커밋한다.
- **빌드 산출 페이지(양언어)**: person-0117·0129·0035·0029·0246·0272·0070·0399·0235·0352. 0117('Arc 참모장'/'Arc Chief of Staff', '직함은 Arc 참모장', 'Title: Arc Chief of Staff'), 0129('Arc 전령'/'Arc Messenger'·'Arc Herald'), 0035(stateName '자유도시'), 0070('Arc 회장 전령 · 서초구 영주'), 0399(소속 'Arc', EN 직위 'Arc Chairperson'), 0235(소속 '정부'/'The Government'), 0352(소속 '정부'/'The Government')는 카드 소속·직함·직무가 세력 표기다. 0029·0246·0272은 소속 줄이 각각 '자유도시'·'정부'·'Arc'로 바뀌었고 직함은 위 보존 목록(Q26·Q29 대기)대로 남는다. 관계·야망 서술의 조직 언급은 §5의 서술 잔존이다. 스크린샷 2매 생성·열람: person-0117(ko), person-0272(ko).
- 실행 모델: cpa/glm-5.3(작업 JSON 직독). 개인 경로·도구 호출 id 없음.

## 7. 재현

```bash
git -C <wt> worktree add <tmp>/wt-org-names -b feat/wiki-org-names-removal origin/main
# docs/fix2-sentence-rules.json(규칙 4348–5948) 적용 후:
FIX2_FROM=4348 FIX2_LOG=docs/drafts/reports/w6-org-names-edits-log.json node scripts/pages/fix2-sentence-edits.mjs
node scripts/pages/w5-28-run-build.mjs --out <dist> --receipts <dir>
node scripts/pages/w5-28-dup-id-check.mjs --html <dist>
node scripts/pages/scan-terms.mjs --terms docs/canon-terms.json --all
node scripts/pages/w5-28-scan-built.mjs --html <dist> --json docs/drafts/reports/w5-28-scan-built.json
```

최종 규칙 범위: fix2 **[4348..5948] 1,601건**(w6OrgNamesRules 1601 — stateName 824·소속계 525·직위·직함계 230·직무 19·로스터 3).
