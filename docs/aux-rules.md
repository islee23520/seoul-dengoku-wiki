# 보조 데이터 세 세력 정합 규칙 (W5-25)

작성 2026-11-11 · 적용 스크립트 `scripts/pages/aux-edit.mjs` · 적용 로그 `docs/drafts/reports/w5-25-apply-log.json` · 보고서 `docs/drafts/reports/w5-25.md`

십육국이 사라지는 정본 개편(W5 계획 25행)에 따라 보조 데이터(`data/sql`, 030 문서·080 GDD·090 인물 상세 제외)의 국가 표·국가 열을 세 세력(정부·자유도시·아크)과 25공작령 기준으로 바꾼 결정을 적는다. 모든 변경은 위 스크립트가 결정적으로 수행했고 손편집은 없다.

## 1. 확정 매핑 (재유도 금지)

출처: `docs/w4-rules.json`의 `stateIdMapping`(브랜치 `origin/feat/w4-drafts`, 커밋 `ea16f908f75c32729124c4809ceec1dfbb0284f3`, 독립 검증자 확인본). 규칙: 각 옛 국가의 수도 역(`040-wiki-states.sql` capital)을 `120-map-core.sql` `map_station`에서 찾아 그 구(district_ko)를 바이블 §2.4의 14/7/4 배정에 따라 세력으로 정한다. 본 과제는 이 표를 그대로 쓰고 다시 유도하지 않는다.

| 옛 id | 옛 국명 | 수도 역 | 수도 구 | 세열 (bible §2.4 행) |
|---|---|---|---|---|
| S01 | 수문국 (s01) | 양평 Yangpyeong | 양천구 | free-city (16) |
| S02 | 규격맹 (s02) | 구로 Guro | 구로구 | free-city (18) |
| S03 | 태욱그룹 (s03) | 양재 Yangjae | 서초구 | arc (22) |
| S04 | Arc (삼성) (s04) | 삼성 Samseong | 강남구 | arc (23) |
| S05 | 동방사 (s05) | 암사 Amsa | 강동구 | arc (25) |
| S06 | 대한민국정부 (s06) | 광화문 Gwanghwamun | 종로구 | government (9) |
| S07 | 환적국 (s07) | 용산 Yongsan | 용산구 | government (2) |
| S08 | 중앙정보부 (s08) | 녹사평 Noksapyeong | 용산구 | government (2) |
| S09 | 여의도출자연합회 (s09) | 여의도 Yeouido | 영등포구 | free-city (17) |
| S10 | 안국총림 (s10) | 안국 Anguk | 종로구 | government (9) |
| S11 | 성하그룹 (s11) | 강남 Gangnam | 서초구 | arc (22) |
| S12 | 신내운수 (s12) | 신내 Sinnae | 중랑구 | government (7) |
| S13 | 흰십자단 (s13) | 제기동 Jegi-dong | 동대문구 | government (6) |
| S14 | 아관사 (s14) | 구의 Guui | 광진구 | government (5) |
| S15 | Arc (명동) (s15) | 명동 Myeongdong | 중구 | government (3) |
| S16 | Arc (정동) (s16) | 수서 Suseo | 강남구 | arc (23) |

매핑에 없는 표기는 유지한다: `S00`(무소속, 4인)과 `polity:daejeon`(대전, 4인)은 십육국 id가 아니며 각각 무소속·서울 밖 표식으로 캐논과 양립한다. 스크립트는 이 표와 유지 목록에 없는 id를 만나면 즉시 실패한다(E_UNMAPPED_ID).

세력 표기명은 `035-factions.sql`의 `faction` 표가 단일 원천이다: `The Government/정부`, `Free City/자유도시`, `Arc/Arc`. 공작령 id는 `121-map-titles.sql`의 `map_title` duchy 행(`geography:duchy:11620` 형식, 예: 관악구)을 그대로 쓴다.

## 2. 표별 결정

### 040-wiki-states.sql — `wiki_state` 16행 → 3행

스키마가 허용하는 최소 구조로 세 세력 행 3개(`slug`=`id`=세력 id: `government`, `free-city`, `arc`)를 새로 쓰고 16개 옛 국가 행은 지운다. 표기문은 바이블 [승인] 문장만으로 구성했다(§2.1–2.3 정치 구조, §2.4 공작령 수 14/7/4, §3 연표의 “2122년 무렵 강남 대피소들이 아크라는 이름으로 묶였다”, §5 용어집 교주=Hierophant). 수도는 아래 지도 앵커와 같은 역을 쓰고, `base`는 `faction.center_region`을 쓴다. `independent` 세력은 `wiki_state` 행을 갖지 않게 된다(세력 표의 4행 자체는 그대로).

### 120-map-core.sql — `map_state` 16행 → 3행

세 세력의 지도 앵커. 앵커 규칙: 옛 `wiki_state.faction_id`와 확정 매핑이 모두 그 세력인 옛 국국 중 sort가 가장 작은 것(연속성 앵커) — government←S06(광화문), free-city←S01(양평), arc←S04(삼성). 좌표·수도역·`capital_region_id`·색 리터럴은 앵커 행 원문을 그대로 복사하고(색이 `faction.color`와 일치함을 실행중 검증), `exclusive_districts`만 바이블 §2.4의 14/7/4로 바꾼다.

### 050-wiki-people.sql — `wiki_person` 1,022행 전수

- `state_id`/`state_name`/`state_name_ko`(모두 NOT NULL): 확정 매핑으로 세력值을 넣는다(세력 999행). 다만 그 행 스스로가 서울 구를 밝히는 경우(직함·직위에 25개 구 이름 토큰이 정확히 하나 나오는 경우, 대전 등 서울 밖 표식 행은 제외)는 공작령值을 넣는다(공작령 15행: 관악구 2, 서초구 3, 서대문구 2, 강남구·마포구·노원구·광진구·동작구·중구·성동구·용산구·관악구 각 1). 이일섭(person-0998)은 바이블 §6 [승인] “관악 공작”에 따라 관악구로 넣는다. 유지 8행(S00 4, `polity:daejeon` 4).
- `faction_id` 열은 이 과제의 범위 밖이다(과제 지시가 세 state 열만 열거). 확정 매핑과 옛 `wiki_state.faction_id`가 어긋난 S03·S05·S08·S11·S15 소속 314행은 state 열과 faction 열이 일시적으로 어긋난다 — 별도 후속 정합이 필요하다(보고서 위험 항목).
- 텍스트 예외(바이블 §6 [승인]과 §4 금지 어휘만, 새 사실 창작 없음): 이일섭 position → “관악 공작 · 제1분공방 이씨 가문 후계”, 고예진 title → “아크의 교주/Hierophant of the Arc”, 지연희 title → “고예진의 경호원”, 조재표 낭인 문구 → 090 인물 상세의 기존 표기 “귀환 일행 지휘자/Leader of the Returning Party”. 성직 어휘(당회장·장로·권사·집사, 영문 Moderator·Myeongbu Church)는 제거한다: 대체 문구가 소유자 판단(Q22·Q23)에 남아 있으므로 빈 값(직위·직책) 또는 기존 값 “없음/None”(계급)으로만 둔다. 해당: person-0086, 0088, 0089, 0094, 0095, 0096, 0104, 0105, 0108.
- 통치자 직급 110행(과제가 인용한 충돌 목록의 114행과 같은 기준, 패턴 집합 차이): 전부 행을 유지하고 정치 소속 열만 바꿨다. 재직함은 위 확정분(이일섭)만, 나머지는 소유자 질문(Q18–Q29) 대기로 원문 유지. 행별 조치는 적용 로그 `rulerRows`에 있다.

### 060-wiki-updates.sql — 정확히 +1행

계획 25행이 허용하는 유일한 행 수 변화. sort 5, 날짜 2026-11-11, “보조 데이터를 세 세력 정본에 맞춘다” 알림, 상태 “검토 중”. 기존 5행(과거 이력)은 손대지 않는다.

### 120-map-core.sql — 지도 표

- `map_region.polities`(424/427 비어 있지 않음): `["S0x"]` → `["<세력>"]`. 빈 3행 유지. 지명·경로·요약의 물리 서술은 그대로.
- `map_station.surface_polity_ids`(310/312)와 `control`/`control_ko` JSON(312/312): `polityIds`, `primary`, `polityNames`, `hierarchy.state`, `currentHegemons[].stateId/name`, `memberSurfaces[].primary/polityIds/surfacePolityIds`를 같은 매핑으로. 표기명 충돌(“Arc”가 S04·S15·S16의 한국어 표기) 때문에 이름이 아니라 같은 객체 안의 id로 매핑한다. 같은 세력으로 합쳐지는 목록은 중복 없이 합친다(w4 규칙). “Registry Church/Roster Church” 표기는 이 치환으로 사라진다.
- `map_edge.control`/`control_ko`(381행): 같은 규칙. 분쟁 구간의 `polityIds`/패권자 목록도 세력으로 합친다.
- `map_landmark.holder_id`(19행): 세력 id로. `detail` 산문의 S0x 토큰 3건은 세력 이름(the Government/정부 등)으로. 지명·좌표·역할은 그대로.
- `map_meta`, `map_title`(121), `map_rail`(122): 검사 결과 국가 참조 0건 — 변경 없음. `map_title`의 empire/kingdom/duchy/county 위계 표기는 소유자 질문 Q10 대기로 유지.

### 123-map-holdings.sql — `map_holding` 50행

`state_id`(50행 전부)와 `data`/`data_ko` JSON의 `stateId`를 세력 id로. 이름의 국가 표기 토큰(예: “서대문구 대한민국정부 공작령 직영지” → “서대문구 공작령 직영지”)은 기존 다수 형식(구 이름만)에 맞춰 뺀다(10행). `id` 문자열의 `-S0x` 접미(예: `holding:opening-duchy-gu-11620-S02`)와 `data`의 `titleId`는 안정 식별자로 유지한다 — `retainer_graph.holdingIds`가 비어 있음을 실행중 검증했고 어떤 표도 이 id를 참조하지 않는다. `map_underground`(312행)는 국가 참조 0건 — 변경 없음.

### 110-family-trees.sql — `family_tree` 148행

노드·소속 객체의 `"stateId":"S02"·"S06"`(736회)을 세력 id로, `affiliation.name`(`Standards League`/`규격맹` 등)을 세력 표기명으로(같은 객체의 id 기준).

### 115-retainer-graph.sql — `retainer_graph`

노드 `"state"`와 궁정 `"stateId"`의 S0x를 세력 id로, `polity:daejeon`은 유지.

### 035-factions.sql — 세력 표

아크 `ai_position` “Enemies of Humanity/인류의 적”(구 캐논의 적대 프레임, 계획 25행이 명시한 패치 대상)을 “Faith and baptism/신앙·세례”로(바이블 §2.3의 세례·신앙 사실). 다른 세력·열은 그대로.

### 010/020/100 — 검사만

`site_meta`, `wiki_category`, `clan`/`clan_member`/`nonkorean_family`: 모든 열에서 S01..S16 id 0건 — 변경 없음.

## 3. 호환성 결정 (코드가 읽는 경로)

과제 지시대로 `git grep -n stateName`, `state_id`(scripts/ src/ server/ tools/ site/)를 먼저 조사했다. 어떤 코드도 s01..s16 id를 하드코딩하지 않아 `wiki_state`/`map_state` 행 교체가 가능했다:

- `site/build.mjs` 37·155·174–177·188행: `wiki_state` 행으로 국가 색인·국가 페이지·세력 회원 목록을 만들고, 인물 페이지의 `states.find(s => s.id === p.state_id)`로 stateRow를 찾는다. 새 id(세력 id)로 조인이 성립한다. `factionCount`는 회원 국가가 있는 세력만 세므로 3이 된다.
- `site/map.mjs` 71행 등: `ctx.states`(wiki_state)와 `map_state`를 `id`로 조인해 수도·레이블 좌표를 얻는다. 3행 앵커로 성립. 지역 색은 이미 하드코딩된 `DISTRICT_FACTION`(소유자 2026-11-10) 기준이라 polities와 무관하다.
- `site/people.mjs` 88행: stateRow가 있으면 `wiki/states/<slug>/`로 링크. 세력 slug(government/free-city/arc) 페이지가 같은 빌드에서 생기므로 죽은 링크가 없다. 문서(030)·쇼케이스에서 `wiki/states/s0x` 링크는 0건임을 확인했다.
- `site/relations.mjs` 19행: 궁정 `stateId`를 `wiki_state.id`로 찾아 링크. 매핑된 세력 id로 성립; `polity:daejeon` 궁정은 종전처럼 원문 표기.
- `src/familyAffiliation.ts` 15행·`scripts/generate-catalog.mjs` 1225행: `person.state === 'S00'`→무소속, `'polity:daejeon'`→중립 분기. 두 표식을 유지했으므로 분기가 살아 있다.
- `scripts/generate-catalog.mjs` 589·833·887행: 역·구간·랜드마크의 polity id가 모두 `wiki_state` id 집합에 속해야 한다(E_STATION_CONTROL_PRIMARY 등). 매핑 뒤 지도 데이터의 id는 {government, free-city, arc}이고 새 `wiki_state`가 정확히 이 id를 가지므로 계약이 유지된다(이 검증은 PG 없이는 실행할 수 없어 데이터 조건으로만 확인 — 보고서 참조).
- `scripts/pages/export-sql.mjs` 129–136행: 재수출 시 `state_name`을 `wiki_state.name`에서 유도한다. 새 state_id↔`wiki_state.name` 대응이 일치하므로 재수출이 본 편집과 어긋나지 않는다.
- 공작령 state_id(`geography:duchy:*`)를 가진 15인은 stateRow를 찾지 못해 기존 대로 `state_name`(구 이름)을 링크 없이 표시한다 — 빈 값 아님(NOT NULL 유지).
- `site/build.mjs` 168행(세력 페이지 생성): 종전에는 회원 국가가 있는 세력만 페이지를 만들었다(옛 s08이 independent 소속이었다). 국가 표가 3행이 되면서 69명의 independent 인물 페이지가 `wiki/factions/independent/`로 하는 링크 138건이 죽었다. 과제 지시의 “호환성 유지 수정”에 따라 조건을 “회원 국가가 있거나 소속 인물이 있는 세력”으로 1줄 고쳤다(페이지 본문은 종전의 independentNote 안내문을 그대로 쓴다). 색인 목록(3세력 나열)은 그대로다.

## 4. 남은 옛 표기의 분류

적용 로그 `remainingOldNames`(182건, 중복 제거 후)가 전수를 분류한다:

1. **역사 기록**(48건): 지도 `control`의 `deltaId`(예: `S08-TRANSFER-2126-Gwanaksan`) — 과거 관제 변경 이벤트의 식별자. 원문 유지.
2. **안정 식별자**(62건): `map_holding.id`의 `-S0x` 접미와 `data.titleId`. 원문 유지.
3. **인물 직함 산문**(52건): “아관사 관문사령관”, “수문국 선출 군주” 같은 직함·직위 표기. 소유자 재직함 판단(Q18–Q29) 대기.
4. **지역 요약·랜드마크 산문**(5건): 옛 조직명이 주어인 서술문. 같은 대기.
5. **실재 교회 건물 지명**(5건): 창신교회·문화교회 등 물리 시설. 바이블 §4 대체 항목이 “일반 역 시설명(사당 여부는 소유자 결정)”으로 미룬 항목이라 유지.
6. **보유 이름에서 토큰 제거**(10건): 위 §2의 시행 기록.

범위 밖 파일(030 문서, 080 GDD, 090 인물 상세 JSON의 `state`/`stateName` 키)은 각 담당 과제가 정합한다.
