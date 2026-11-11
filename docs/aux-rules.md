# 보조 데이터 세 세력 정합 규칙 (W5-25)

작성 2026-11-11(검증자 결함 수정판) · 적용 스크립트 `scripts/pages/aux-edit.mjs` · 적용 로그 `docs/drafts/reports/w5-25-apply-log.json` · 보고서 `docs/drafts/reports/w5-25.md` · 090 핸드오프 `docs/drafts/reports/w5-25-handoff-090.md`

십육국이 사라지는 정본 개편(W5 계획 25행)에 따라 보조 데이터(`data/sql`, 030 문서·080 GDD·090 인물 상세 제외)의 국가 표·국가 열을 세 세력(정부·자유도시·아크)과 25공작령 기준으로 바꾼 결정을 적는다. 모든 변경은 위 스크립트가 결정적으로 수행했고 손편집은 없다(재실행 결과는 커밋된 SQL과 바이트 단위로 동일함을 검증).

## 1. 확정 매핑 (재유도 금지)

출처: `docs/w4-rules.json`의 `stateIdMapping`(브랜치 `origin/feat/w4-drafts`, 커밋 `ea16f908f75c32729124c4809ceec1dfbb0284f3`, 독립 검증자 확인본). 규칙: 각 옛 국가의 수도 역(`040-wiki-states.sql` capital)을 `120-map-core.sql` `map_station`에서 찾아 그 구(district_ko)를 바이블 §2.4의 14/7/4 배정에 따라 세력으로 정한다. 본 과제는 이 표를 그대로 쓰고 다시 유도하지 않는다.

| 옛 id | 옛 국명 | 수도 역 | 수도 구 | 세력 (bible §2.4 행) |
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

**조직 표기 매핑**(검증자 결함 3): 판독되는 산문의 옛 조직명은 위 세력 표기명으로 치환한다. 한국어: 수문국·규격맹·여의도출자연합회→자유도시, 태욱그룹·성하그룹·성하전자·동방사→아크, 대한민국정부·중앙정보부·안국총림·환적국·신내운수·흰십자단·아관사→정부. 영어: Floodgate State/Bureau·Standards League·Yeouido Investment Federation/Alliance·The Sluice·The Gauge→Free City, Taeuk Group·Seongha Group/Electronics·Jeongdong Labor Federation/Federation·Registry/Roster/Myeongbu Church·Eastern Command→Arc, Government of the Republic of Korea·Central Intelligence Agency/Bureau·Anguk Grand Monastery/Order·Transshipment State/Bureau·Sinnae Transport·White Cross (Order)·Russian Legation Command·Achasan Gate·Agwansa→The Government. 인물 이름과 충돌하는 裸어(태욱·Taeuk)는 매핑 표에서 제외하고 행 규칙으로만 처리한다(person-0057).

## 2. 표별 결정

### 050 — faction_id 정합·비통치자 조직명 (검증자 결함 1·3 수정)

- `faction_id`는 인물 검색 데이터(site/theme/machines/peopleFilter)와 세력별 인원 집계(site/build.mjs)가 읽는 현재 입력값이다. 규칙: **faction_id := 확정 매핑의 세력(그 인물의 옛 state S0x 기준)** — S00·`polity:daejeon` 인물은 `independent` 유지. 314행 변경(S03 66, S05 65, S08 61, S11 61, S15 61). 세력별 인원 before→after: 정부 505→501, 자유도시 258→192, 아크 190→321, 독립 69→8. 공작령 소속 15인도 같은 규칙(예: person-0286 노원구 공작령·세력 아크 — "색≠소유"와 동일 논리).
- 통치자 재직함 어휘(유지 목록 아래)가 아닌 직함·직위·직업의 옛 조직명은 세력 표기명으로 치환한다(61명 147열; 예: "아관사 능선 초병"→"정부 능선 초병", "성하전자 차륜 정비"→"아크 차륜 정비"). 유지 목록(소유자 질문 Q18–Q29 대기, 적용 로그 `orgProse050.keptQPending`): person-0001·0029·0070·0086·0088·0116·0145·0167·0195·0220·0246·0272·0323·0349·0399·1005(16명). person-0195는 바이블 §6 "그대로"+Q5/Q7 대기로 추가 유지.

### 050 — state 열 전수(1차 적용)

- `state_id`/`state_name`/`state_name_ko`(모두 NOT NULL): 확정 매핑으로 세력값(999행). 그 행 스스로가 서울 구를 밝히는 경우(직함·직위에 25개 구 이름 토큰이 정확히 하나)는 공작령값(15행: 관악구 2, 서초구 3, 서대문구 2, 강남구·마포구·노원구·광진구·동작구·중구·성동구·용산구 각 1). 이일섭(person-0998)은 바이블 §6 [승인] "관악 공작"에 따라 관악구. 유지 8행(S00 4, `polity:daejeon` 4).
- 텍스트 예외(바이블 §6 [승인]과 §4 금지 어휘만, 새 사실 창작 없음): 이일섭 position → "관악 공작 · 제1분공방 이씨 가문 후계", 고예진 title → "아크의 교주/Hierophant of the Arc", 지연희 title → "고예진의 경호원", 조재표 낭인 문구 → 090 기존 표기 "귀환 일행 지휘자/Leader of the Returning Party", person-0057 title → "Arc 생명안전 연구책임자"(裸어 태욱 행 규칙). 성직 어휘(당회장·장로·권사·집사, 영문 Moderator·Myeongbu Church)는 제거: 대체 문구가 소유자 판단(Q22·Q23)에 남아 있으므로 빈 값(직함·직위) 또는 기존값 "없음/None"(계급). 해당: person-0086, 0088, 0089, 0094, 0095, 0096, 0104, 0105, 0108.
- 통치자 직급 110행: 전부 행 유지·정치 소속 열만. 재직함은 확정분(이일섭)만, 나머지는 Q18–Q29 대기로 원문 유지. 행별 조치는 적용 로그 `rulerRows`.

### 040-wiki-states.sql — `wiki_state` 16행 → 3행

스키마가 허용하는 최소 구조로 세 세력 행 3개(`slug`=`id`=세력 id)를 새로 쓰고 16개 옛 국가 행은 지운다. 표기문은 바이블 [승인] 문장만(§2.1–2.3 정치 구조, §2.4 공작령 수 14/7/4, §3 연표의 "2122년 무렵 강남 대피소들이 아크라는 이름으로 묶였다", §5 용어 교주=Hierophant). 수도는 지도 앵커와 같은 역, `base`는 `faction.center_region`.

### 120-map-core.sql — `map_state`와 지도 표

- `map_state` 16행 → 세 세력 앵커 3행. 앵커 규칙: 옛 `wiki_state.faction_id`와 확정 매핑이 모두 그 세력인 옛 국가 중 sort 최소(government←S06 광화문, free-city←S01 양평, arc←S04 삼성). 좌표·수도역·색 리터럴은 앵커 행 원문 복사(색 = `faction.color` 실행중 검증), `exclusive_districts`만 14/7/4.
- `map_region.polities`(424/427): `["S0x"]` → `["<세력>"]`. 지명·경로·물리 서술 불변.
- `map_station`(`surface_polity_ids` 310 + `control`/`control_ko` 312)와 `map_edge.control/_ko`(381): `polityIds`·`primary`·`polityNames`·`hierarchy.state`·`currentHegemons[]`·`memberSurfaces[]`를 같은 매핑으로(표기명 충돌 "Arc" 때문에 이름이 아니라 같은 객체의 id 기준). 같은 세령으로 합쳐지는 목록은 중복 없이 합친다(w4 규칙).
- `map_landmark`: `holder_id` 19행 세력 id로, detail의 S0x 토큰 3건과 옛 조직명 6건은 세력 이름으로(검증자 결함 3). 지명·좌표·역할 불변.
- 지역 요약 5열의 옛 조직명도 세력 표기명으로(결함 3). 실재 교회 건물 지명(창신교회·문화교회·수유동성당)과 수문(Sluice) 표지판은 유지·분류(§4 대체 항목이 소유자 결정으로 미뤔; 수문은 급수 시설 일반어).
- `map_meta`, `map_title`(121), `map_rail`(122): 국가 참조 0건 — 변경 없음. `map_title` 위계 표기는 Q10 대기 유지.

### 110 — 가계도 소속 동기·타임라인 (검증자 결함 2·3 수정)

- 인물과 연결된(detailRoute) 노드의 `affiliation`은 그 인물의 **현재** wiki_person 기록으로 동기한다: 세력→{kind:'state', stateId:세력, 이름:세력 표기명}, 공작령→{kind:'state', stateId:공작령 id, 이름:구 이름}, S00→{kind:'unaffiliated', 이름:무소속}, 대전→{kind:'neutral', stateId:'polity:daejeon', 이름:대전}. 연결 노드 964건(kind 전환 포함: union→state 194, neutral→state 34, state→neutral 8, state→unaffiliated 2, state→state 726)을 현재값으로 맞췄다. 연결 없는 역사 노드는 변환값 유지(전수 분류).
- 타임라인 요약의 옛 조직명은 전 노드에서 세령 표기명으로 치환(en 40·ko 39건; "소속: 수문국"→"소속: 자유도시" 포함). §4 금지 성직 어휘는 15문장 규칙(스크립트 `CLERGY_RULES`, 원문 정확 문자열→교체문, 출처 명시)으로 처리한다: 당회장·장로(회)·목사·주교→적용본 030 Century-Annals가 이미 쓰는 "인준 투표·총회( 의장)·원로" 표기로, en archbishop·pope·bishops'·deacons·priests→ko 원문과 한영 정합(수석 신도 Lead Believer, 교주 Hierophant, 신도단 the believers). 교사(품계)·당회·총회·신도단·성전총회·장경종은 §4 패턴 밖이라 유지한다.

### 123-map-holdings.sql — `map_holding` 50행

`state_id`(50행)와 `data`의 `stateId`를 세력 id로. 이름의 국가 표기 토큰은 기존 다수 형식(구 이름만)에 맞추 벤다(10행). `id`의 `-S0x` 접미와 `data.titleId`는 안정 식별자로 유지(`retainer_graph.holdingIds` 비어 있음을 실행중 검증). `map_underground`는 국가 참조 0건 — 변경 없음.

### 115-retainer-graph.sql — `retainer_graph`

노드 `"state"`와 궁정 `"stateId"`의 S0x를 세력 id로, `polity:daejeon`은 유지.

### 035-factions.sql — 세력 표

아크 `ai_position` "Enemies of Humanity/인류의 적"(구 캐논 적대 프레임, 계획 25행 패치 대상)을 "Faith and baptism/신앙·세례"로(바이블 §2.3 세례·신앙 사실). 다른 세력·열 불변.

### 010/020/100 — 검사만

`site_meta`, `wiki_category`, `clan`/`clan_member`/`nonkorean_family`: 모든 열에서 S01..S16 id 0건 — 변경 없음.

### 060 — 정확히 +1행

계획 25행이 허용하는 유일한 행 수 변화. sort 5, 2026-11-11, "보조 데이터를 세 세력 정본에 맞춘다" 알림, 상태 "검토 중". 기존 5행(과거 이력) 불변.

### 090 — 핸드오프 목록 (범위 밖, 넘김)

`docs/drafts/reports/w5-25-handoff-090.md`(스크립트가 090을 읽기 전용으로 스캔해 생성): 인물 509명·위반 그룹 2,890건의 person id·JSON 경로·현재 텍스트 발췌·기준(050 확정값 또는 바이블 §2–§5)·제안 교체문. CK3 스탯 브랜치 병합 뒤 통합 웨이브가 이 표대로 090을 패치한다.

## 3. 호환성 결정 (코드가 읽는 경로)

과제 지시대로 `git grep -n stateName`, `state_id`(scripts/ src/ server/ tools/ site/)를 먼저 조사했다. 어떤 코드도 s01..s16 id를 하드코딩하지 않아 `wiki_state`/`map_state` 행 교체가 가능했다:

- `site/build.mjs` 37·155·174–177·188행: `wiki_state` 행으로 국가 색인·국가 페이지·세력 회원 목록을 만들고, 인물 페이지의 `states.find(s => s.id === p.state_id)`로 stateRow를 찾는다. 새 id(세력 id)로 조인이 성립한다. `factionCount`는 회원 국가가 있는 세력만 세므로 3.
- `site/build.mjs` 169행(세력별 인원 집계)·`site/theme/machines/peopleFilter.ts`(검색 데이터)는 `faction_id`를 현재 입력으로 읽는다 — 결함 1 수정으로 state 열과 일치하게 됐다.
- `site/map.mjs` 71행 등: `ctx.states`(wiki_state)와 `map_state`를 `id`로 조인해 수도·레이블 좌표. 3행 앵커로 성립. 지역 색은 하드코딩된 `DISTRICT_FACTION`(소유자 2026-11-10) 기준이라 polities와 무관.
- `site/people.mjs` 88행: stateRow가 있으면 `wiki/states/<slug>/`로 링크. 세력 slug 페이지가 같은 빌드에서 생긴다. 문서(030)·쇼케이스의 `wiki/states/s0x` 링크는 0건 확인.
- `site/relations.mjs` 19행: 궁정 `stateId`를 `wiki_state.id`로 찾아 링크. 매핑된 세력 id로 성립; `polity:daejeon` 궁정은 종전처럼 원문 표기.
- `src/familyAffiliation.ts` 15행·`scripts/generate-catalog.mjs` 1225행: `person.state === 'S00'`→무소속, `'polity:daejeon'`→중립 분기. 두 표식을 유지했으므로 분기가 살아 있다. 110 소속 동기(결함 2)가 이 해석기의 출력형식(kind·stateId·name)과 같은 값을 갖도록 맞췄다.
- `scripts/generate-catalog.mjs` 589·833·887행: 역·구간·랜드마크의 polity id가 모두 `wiki_state` id 집합에 속해야 한다(E_STATION_CONTROL_PRIMARY 등). 매핑 뒤 지도 데이터의 id는 {government, free-city, arc}이고 새 `wiki_state`가 정확히 이 id를 가지므로 계약 유지(PG 없이는 실행 불가 — 데이터 조건으로만 확인, 보고서 참조).
- `scripts/pages/export-sql.mjs` 129–136행: 재수출 시 `state_name`을 `wiki_state.name`에서 유도. 새 state_id↔`wiki_state.name` 대응이 일치하므로 재수출이 본 편집과 어긋나지 않는다.
- 공작령 state_id를 가진 15인은 stateRow를 찾지 못해 기존 대로 `state_name`(구 이름)을 링크 없이 표시 — 빈 값 아님(NOT NULL 유지).
- `site/build.mjs` 168행(세력 페이지 생성): 국가 표가 3행이 되면서 69명 independent 인물 페이지의 `wiki/factions/independent/` 링크 138건이 죽었다. 과제 지시의 "호환성 유지 수정"으로 조건을 "회원 국가가 있거나 소속 인물이 있는 세력"으로 1줄 고쳤다(본문은 종전 independentNote). 색인 목록(3세력)은 그대로.

## 4. 남은 옛 표기의 분류

적용 로그 `remainingOldNames`(141건, 중복 제거 후)이 전수를 분류한다:

1. **역사 기록**(48건): 지도 `control`의 `deltaId`(예: `S08-TRANSFER-2126-Gwanaksan`) — 과거 관제 변경 이벤트의 식별자. 원문 유지.
2. **안정 식별자**(62건): `map_holding.id`의 `-S0x` 접미와 `data.titleId`. 원문 유지.
3. **Q18–Q29 대기**(16건): 통치자 재직함 산문(§2 유지 목록). 소유자 판단 대기.
4. **실재 교회 건물 지명**(5건): 창신교회·문화교회·수유동성당 등 물리 시설. 바이블 §4 대체 항목이 "일반 역 시설명(사당 여부는 소유자 결정)"으로 미룬다.
5. **보유 이름에서 토큰 제거**(10건): §2의 시행 기록.

바이트 단위 S0x 토큰 수는 별개다: 변경된 SQL 파일 안의 `\bS(0[1-9]|1[0-6])\b`는 206회(120 52 = deltaId, 123 154 = 보유 id·titleId)이며, 위 141은 적용 로그의 분류 항목 수이다.

범위 밖 파일(030 문서, 080 GDD, 090 인물 상세 JSON — 후자는 핸드오프 목록으로 넘김)은 각 담당 과제가 정합한다.
