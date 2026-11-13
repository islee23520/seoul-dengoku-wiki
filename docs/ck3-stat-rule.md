# CK3 여섯 능력치 규칙 (docs/ck3-stat-rule.md)

갱신: 2026-11-11 · W5 25.5행. 이 문서는 `data/sql/090-person-details.sql`의 인물 능력치를 CK3식 여섯 스탯으로 맞추는 **결정적 규칙**의 정본이다. 적용 도구는 `scripts/pages/ck3-stats.mjs`.

## v3 규칙 (2026-11-13, 이 절이 아래 2~4절보다 앞선다)

v3 바이블 7장(`docs/design/v3/07-people-and-war.md`) 8절이 이 규칙을 바꿨다. 아래 2~4절은 v3 이전(W5 25.5행)의 기록으로 남긴다.

- **범위.** 1,022명 모두의 여섯 능력치를 v3 직업(`occupation_ko`)과 품계(`rank_ko`)에서 다시 계산한다. 옛 상세 기록의 값(2절의 1:1 이름 변경)은 옛 역할에 묶인 값이라 쓰지 않는다(07장 8.1절). 090의 `sourceStatus`는 1,022명 모두 `ck3-table-derived`가 되고, `node scripts/pages/ck3-stats.mjs --dry-run`이 1,022명 전원을 표로 다시 계산해 대조한다(`E_DERIVED_DRIFT`).
- **계산.** `deriveTableStats(personId, occupation_ko, rank_ko)` 그대로다. 직업 문구에서 07장 8.3절 표(`OCCUPATION_CLASSES`, 열두 등급, 순서가 규칙의 일부)를 위에서부터 보고 처음 맞는 낱말의 등급을 쓰고, 8.4절 등급 기본값(`CLASS_BASE`, 옛 일곱 등급의 값은 그대로, governance·soldier·fitting·provision·labour를 더함)에 8.5절 품계 보정(`RANK_MODIFIER`, v3 품계 60종)을 더해 1~20으로 자른다. 특성 효과는 모두 빈 배열이라 `effective = base`다.
- **목록 밖.** 직업 문구는 07장 8.2절 목록(89개), 품계는 8.5절 목록 밖의 것을 쓰지 않는다. 목록 밖이면 `E_UNKNOWN_OCCUPATION`, `E_UNKNOWN_RANK`로 실패한다. 옛 품계 56종(군주, 영주, 조합원, 교도 따위)과 옛 직업 키워드 표는 v3에서 쓰지 않는다.
- **적용기.** 표의 정본은 `scripts/pages/ck3-stats.mjs`이고, 1,022명에게 쓰는 것은 `node scripts/pages/v3-apply-people.mjs --recompute-stats`다(ck3-stats는 이미 파생된 행을 다시 쓰지 않으므로 적용기가 `deriveTableStats`를 직접 부른다). 적용기는 시작할 때 8.2절 89개 문구가 모두 의도한 등급으로 첫 일치하는지, 8.5절 품계 목록과 `RANK_MODIFIER`가 같은지 스스로 확인한다.

## 0. 근거와 지위

- 소유자 승인(바이블 1절 규칙 10 · 8절): 인물 1,022명 전원이 CK3식 능력치 여섯 개 — 외교(Diplomacy), 군사(Martial), 관리(Stewardship), 음모(Intrigue), 학식(Learning), 무용(Prowess) — 를 쓴다. 적용 범위 1,022명 전원도 승인됐다.
- 상세 기록 없는 511명의 산출 방식은 바이블 9.2 Q17의 열린 질문이다(소유자 미답변). 이 문서의 표는 오케스트레이터 판단의 **잠정 기본값**이며, 소유자가 다른 규칙을 정하면 `scripts/pages/ck3-stats.mjs` 표를 고쳐 다시 적용한다. 사람별 새 설정(로어)을 지어내지 않고, 기존 데이터(050·090 열값)만으로 환산·산출한다.
- 원칙: 최소 수정(바이블 0절 "캐릭터는 불가피할 때만 고치고 삭제하지 않는다"). 이미 발행된 숫자는 그대로 보존하고 이름만 바꾼다. 합성·평균으로 새 숫자를 만들지 않는다.

## 1. 기존 여덟 역량(구조 인용)

090의 `person_detail.json → characterProfile.abilities`는 511행 전부 동일한 여덟 키를 가지며, 각 값은 `{"base":정수,"effective":정수}` 형태다(전수 확인: 키 서명 1종, 511/511). 한국어 라벨은 `site/people.mjs`의 `ABILITY` 표가 쓰던 이름을 인용한다.

| 키 | 한국어 라벨(기존) | base 관측 범위(511행) |
|---|---|---|
| `leadership` | 통솔 | 1–18 |
| `strategy` | 전략 | 2–18 |
| `negotiation` | 교섭 | 2–19 |
| `management` | 운영 | 2–19 |
| `insight` | 통찰 | 5–20 |
| `learning` | 학습 | 5–20 |
| `prowess` | 기량 | 1–20 |
| `endurance` | 체력 | 4–19 |

`effective`는 `clamp(base + Σ 특성 effects delta, 0, 100)`이며 현재 데이터에서 이 불변식 위반은 0건이다(전수 검증). 특성 효과(`characterProfile.traits[].effects[].ability`)는 총 6건만 존재하고 전부 아래 표의 1:1 대응 스탯(negotiation 1, strategy 1, management 1, insight 2, prowess 1)만 참조한다. base 상한 20, 최종 상한 100은 `scripts/character-profile.mjs` 계약과 `site/people.mjs`의 안내문(기본 10 = 숙련자)을 따라 그대로 유지한다.

## 2. 여덞 → 여섯 매핑 표 (상세 기록이 있는 511명)

CK3 여섯 스탯에 각각 대응하는 옛 키는 정확히 하나씩이고, 그 대응은 1:1 이름 변경으로 반영한다.

| CK3 스탯 (키) | 한국어(소유자 표현) | 옛 키 | 환산 |
|---|---|---|---|
| `diplomacy` | 외교 | `negotiation`(교섭) | base·effective 값 그대로 이동 |
| `martial` | 군사 | `strategy`(전략) | 〃 |
| `stewardship` | 관리 | `management`(운영) | 〃 |
| `intrigue` | 음모 | `insight`(통찰) | 〃 |
| `learning` | 학식 | `learning`(학습) | 〃 |
| `prowess` | 무용 | `prowess`(기량) | 〃 |
| —(대응 없음) | — | `leadership`(통솔) | **제외** |
| —(대응 없음) | — | `endurance`(체력) | **제외** |

- **제외 처리의 이유(선택과 근거).** 통솔·체력은 CK3 여섯 슬롯에 자연 대응이 없다. 평균·합산으로 접으면 세상에 존재한 적 없는 합성 숫자가 발행되므로(최소 수정 원칙 위반), 여섯 스탯에 1:1로 대응하는 값만 옮기고 나머지 둘은 제외한다. 제외된 값은 사라지지 않는다: 변환 로그 `docs/drafts/reports/w5-255-log.json`의 `trigger.old`에 인물별 원값이 보존되고, git 이력(`origin/feat/w2-applied`의 090)에서도 복원 가능하다. 소유자가 접기(예: 무용 = (기량+체력)/2)를 원하면 이 표만 고치면 된다.
- **base/effective 유지.** CK3 쪽도 값 상태는 두 개(base, effective)를 유지한다. 공개 페이지(`site/people.mjs`)가 기본/최종 두 값을 계속 표시하고, 특성 효과 합산 불변식이 유효하려면 두 값이 필요하다.
- **특성 효과 재매핑.** `traits[].effects[].ability`도 같은 표로 바꾼다(negotiation→diplomacy 등 5종). 6건 전부 1:1 대응 키라 delta 값은 변하지 않고, 환산 후 `effective = clamp(base + Σ delta)` 위반은 0건으로 유지된다.
- 여덞 키가 정확히 있던 행만 변환 대상이다. 키 집합이 여덞·여섯 어느 쪽도 아니면 스크립트는 즉시 실패한다(`E_ABILITY_KEYS`).

## 3. 직업·품계 파생 표 (상세 기록이 없는 511명)

상세 기록이 없는 511명은 `050-wiki-people.sql`의 실제 열값만으로 다음 두 단계를 거쳐 여섯 값을 정한다. 전원 tier T5, 12개 품계(rank_ko), 118개 직업 문구(occupation_ko)로 구성됨을 전수 확인했다. position·title·faction 열은 쓰지 않는다(직업 문구 분류가 511명 전원을 커버하므로; 미분류 문구를 만나면 스크립트가 실패한다).

### 3.1 1단계 — 직업 등급(class): 키워드 첫 일치 표

occupation_ko에 아래 키워드가 포함되는지 **표의 순서대로** 검사하고, 처음 일치한 등급을 쓴다. 하나도 일치하지 않으면 `E_UNKNOWN_OCCUPATION`으로 즉시 실패한다(빠뜨리지 않는다). 순서가 규칙의 일부다.

| 순서 | 등급 id | 키워드(포함 일치, 순서 민감) | 성격 | 511명 중 배정 |
|---|---|---|---|---|
| 1 | `guard` | 경비, 순찰, 초계, 수비, 제지, 단속, 감시, 출입 검문, 경비 암호 | 호위·경비 | 92 |
| 2 | `medical` | 진료, 의료, 시약, 수술, 환자, 약품, 투약, 진단, 응급 | 의료 | 6 |
| 3 | `trade` | 경매, 거래, 중개, 환전, 통행세, 결제, 계량, 저울, 재고, 배분, 배급, 구휼, 물자, 곡물 | 물자·교역 | 59 |
| 4 | `courier` | 전령, 전갈, 전달, 배차, 승무, 운전, 호송, 이송, 회송, 편집, 출발, 서명 | 운송·전달 | 111 |
| 5 | `maintenance` | 정비, 점검, 검수, 측정, 실측, 시험, 설비, 관로, 누수, 제동, 부품, 송신탑, 전지, 발전, 펌프, 차륜, 차량, 채수, 탁도, 수심, 진동, 균열, 좌표, 제설, 봉쇄, 개통, 방류 | 설비·정비 | 49 |
| 6 | `scout` | 탐사, 조사, 측량, 정찰, 외곽, 능선, 매복, 교습 | 탐사·정찰 | 14 |
| 7 | `record` | 기록, 열쇠, 인수인계, 인계, 등기, 필사, 장부, 대장, 명부, 사본, 봉함, 보관, 게시, 대조, 인준, 일지, 보고, 대기열, 당직, 교대, 창구, 대질, 증인, 증언, 속보, 방송, 공개 | 기록·실무 | 180 |

### 3.2 2단계 — 품계(rank_ko) 보정표

rank_ko 12값 전부에 보정을 정의한다. 없는 값이 나오면 `E_UNKNOWN_RANK`로 즉시 실패한다.

| rank_ko | 보정 | 근거(데이터·바이블) |
|---|---|---|
| 주사 | stewardship +1 | 수석 실무 직급 |
| 병장 | martial +1 | 군사 직급 |
| 조합원 | learning +1 | 자유도시 기술 공동체(바이블 2.2 "주민 대부분은 물자와 기술을 주고받는 엔지니어") |
| 교도 | prowess +1 | 교도·구금 실무 |
| 대리 | diplomacy +1 | 대리 접객·중개 실무 |
| 사원 | (없음) | 일반 사무 |
| 서기 | learning +1 | 필사·문서 실무 |
| 교우 | (없음) | 일반 성원 |
| 행자 | (없음) | 수행 단계 |
| 호송원 | prowess +1 | 호송 실무 |
| 교사 | learning +1 | 교습 실무 |
| 수비대원 | martial +1 | 방위 실무 |

### 3.3 등급 기본값 표

각 등급의 여섯 base 값. 최종값 = clamp(등급 기본값 + 품계 보정, 1, 20)이고, 특성이 없으므로 effective = base다. 산출 범위(3–11)는 1. 관측 범위(스탯별 base 최소 1–5, 최대 14–20)와 T5 상세 보유 237명의 중앙값(외교 6, 군사 7, 관리 10, 음모 11, 학식 9, 무용 3)의 안쪽에 있다.

| 등급 | diplomacy | martial | stewardship | intrigue | learning | prowess |
|---|---|---|---|---|---|---|
| guard | 5 | 8 | 6 | 6 | 5 | 8 |
| medical | 6 | 3 | 6 | 7 | 10 | 3 |
| trade | 8 | 4 | 9 | 6 | 5 | 3 |
| courier | 8 | 5 | 6 | 6 | 5 | 5 |
| maintenance | 5 | 5 | 10 | 7 | 7 | 4 |
| scout | 5 | 7 | 5 | 9 | 6 | 6 |
| record | 6 | 3 | 10 | 7 | 8 | 3 |

## 4. 파생 레코드 형식 (090에 새로 생기는 511행)

상세 없는 511명은 090에 새 행으로 들어간다. JSON은 기존 행의 키 순서를 따르되 **050 열값과 이 규칙의 표로만** 만들 수 있는 최소 구성만 담는다(생년·서사·특성 등 미지 정보를 지어내지 않는다).

- 키: `id, name, title, position, rank, commonTier, occupation, gender, stage, state, stateName, detailRoute, sourceStatus, characterProfile`. `characterProfile`은 `{"abilities": {여섯 스탯: {base, effective}}}` 하나만 가진다(narrative·skills·traits·health 없음 — 렌더러는 모두 선택적이다).
- 언어: `json`은 050의 영문 열(name, title, …), `json_ko`는 한국어 열(name_ko, title_ko, …). `detailRoute` = `/people/<id>`(기존 511행 전부 이 패턴, 위반 0건).
- `sourceStatus` = `"ck3-table-derived"` — 파생임을 나타내는 증명 표식이다(기존 행은 전부 `"owner-authored"`). 재실행 시 이 표식으로 파생 행을 식별해 멱등성을 지킨다.
- `characterId`는 넣지 않는다(511행 중 301행이 기계적 K### 패턴이 아니어서 규칙 유도가 불가능). `clan` JSON 키도 넣지 않는다(영문 가문명이 기계 유도 불가 359/475). 대신 `clan_id` 열은 `clan_member` 표에서 실제 소속을 찾아 넣는다(480명 소속, 31명 NULL — 기존 36 NULL과 같은 의미).
- 삽입 순서는 person_id 오름차순(기존 행과 섞인다). 직렬화는 기존 파일 형식 그대로: 머리말 2줄 + 빈 줄 + 행당 INSERT 1문, 작은따옴표 2배 이스케이프, JSON.stringify 무간격.

## 5. 지명 인물 예외 (바이블 6절)

아래 23명은 바이블 6절의 행 예외다. **전원 상세 기록을 이미 가지고 있으므로 전원 2절 매핑(detail-derived)으로 값을 받는다.** 파생 표를 쓰는 지명 인물은 없다. 값은 각 행의 detail JSON에서 온 것으로, 7절 수검 대조에서 다시 확인한다.

person-0998 이일섭, person-1018 고예진, person-1017 지연희, person-1009 신종목, person-1010 신준, person-1003 조재표, person-0457 차예원, person-0086 임하준, person-0088 오경재, person-0374 남윤경, person-0399 정유라, person-0246 백온, person-0323 류은비, person-0145 윤서린, person-0195 오해린, person-0001 한재목, person-0029 강민서, person-0116 배우진, person-0220 최지우, person-0272 이홍원, person-0349 고서준, person-1005 정서온, person-1008 민웅기.

인물의 직함·직위 문구(바이블 6절의 새 값)는 이 규칙의 범위가 아니다. 이 문서는 능력치만 다룬다.

## 6. 재현성과 실패 조건

- **결정성.** 같은 입력(050·090·100)에서는 표만으로 누구의 여섯 값이든 재현된다. 난수·시간·외부 자료 없음.
- **멱등성.** 여섯 키가 이미 CK3 형태인 행은 다시 쓰지 않는다. 재실행 시 090 파일과 로그 JSON은 바이트 동일해야 한다(검증 항목).
- **크게 실패.** 알 수 없는 직업 문구, 알 수 없는 품계, 여덞/여섯 어느 쪽도 아닌 능력치 키 집합, base·effective 범위 위반(정수, base 1–20, effective 0–100), 환산 후 특성 합산 불변식 위반, 행 집합 불일치(1,022/511/511이 아니면)는 각각 고유 코드로 즉시 실패한다. 조용히 건너뛰지 않는다.
- **변환 기록.** 실행마다 `docs/drafts/reports/w5-255-log.json`에 인물별(id, source, 여섯 값, 유발 필드 — 상세 유래는 옛 여덟 값, 표 유래는 직업 문구·등급·품계·보정) 기록을 남긴다. 로그는 시간표 등 비결정 요소를 넣지 않아 재실행 시 바이트 동일이다.
