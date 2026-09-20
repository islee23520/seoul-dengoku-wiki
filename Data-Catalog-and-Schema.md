# 게임 데이터 원장과 스키마 계약

이 문서는 `/gdd`에서 열람하는 게임 데이터셋·설정값·CSV·논리 데이터베이스 계약의 정본이다. 새 데이터베이스를 만드는 문서가 아니다. 기존 JSON·CSV·정본 문서의 소유 경로를 밝히고, 런타임이나 도구가 데이터를 읽고 내보낼 때 지켜야 할 형식과 관계를 고정한다.

## 소유 원칙

- GDD는 규칙, 자료형, 관계, 제약, 단위, 기본값과 결정 상태를 소유한다.
- LORE는 인물·국가·지역·역·문화의 세계 안 사실을 소유한다.
- GAME 데이터는 승인된 정본을 런타임이 읽는 투영이다. GDD가 같은 값을 다시 적어 두지 않는다.
- WEB 산출물과 `design-store/`는 게시·검색용 파생물이다. 정본으로 편집하지 않는다.
- CSV는 JSON·정본 문서에서 만든 교환 산출물이다. 같은 행을 CSV와 JSON에서 따로 고치지 않는다.

## 현재 데이터셋

| 데이터셋 | 형식 | 정본·소유 경로 | 스키마 | 현재 레코드 | 결정 상태 | 검증 |
|---|---|---|---|---:|---|---|
| 인물 가치관·욕망 | JSON | `LORE/name-pools/values-cast.json` | `janseon.values.cast.v2` | 1,004명 | 사용 중 | `verify-cast`, 이름·상태 원장 대조 |
| 인물 성별 | JSON | `LORE/name-pools/gender-cast.json` | `seoul-dengoku.cast-gender.v2` | 1,004명 | 사용자 잠금 포함 | 여성·남성 전수, 사용자 잠금 우선 |
| 조직 가치관·정책 | JSON | `LORE/name-pools/values-orgs.json` | `janseon.values.orgs.v1` | 37개 조직 | 사용 중 | 조직 ID·국가 참조 검사 |
| 서울 이동 그래프 | JSON | `GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json` | `seoul-world-graph-v1` | 334역·435간선 | 런타임 투영 | 역 ID·간선 양끝·지문 검사 |
| 역 점령 변경 원장 | JSON | `LORE/places/station-control-overrides.json` | `seoul-station-control.v1` | 변경 0건 | 개막 기준선 | 명시된 변경만 지표 영토 기준선을 덮음 |
| 역 내부 원장 | JSON | `LORE/regions/station-interiors.json` | `station-interior.v1` | 334역 | 저작 원장 | 역 카탈로그 334곳 전수 대조 |
| 행정동 저작 원장 | JSON 묶음 | `LORE/regions/content/*.json` | 지역 콘텐츠 계약 | 427동 | 저작 원장 | 25구·427동 전수, 출처·정본 링크 검사 |
| UI 흐름·와이어프레임 | JSON | `GDD/system-design/total-war-ui/*.json` | 문서별 판본 | 흐름·화면·연결 | 설계 자료 | 생성기와 HTML 렌더 검사 |

## 필드 계약

### 인물

| 표시명 | 기계 필드 | 자료형 | 단위·범위 | 필수 | 소유·출처 |
|---|---|---|---|---|---|
| 인물 식별자 | `character_id` | 문자열 | 영구 ID | 예 | 인물 카드 원장. 이름을 조인 키로 쓰지 않는다 |
| 이름 | `name` | 문자열 | 한국어 표시명 | 예 | LORE/characters |
| 국가 식별자 | `state` | 문자열 | `S00` 또는 `S01`–`S16` | 예 | 국가 원장 |
| 가치관 | `values` | 객체 | 축별 −100..100 | 예 | `values-cast.json` |
| 욕망 | `desire` | 객체 | 축별 −100..100 또는 잠긴 분류값 | 예 | `values-cast.json` |
| 성별 | `gender` | 문자열 | 여성·남성 | 예 | `gender-cast.json` |
| 잠금 여부 | `locked` | 불리언 | 참·거짓 | 예 | 사용자 지정값 보호 |

현재 `values-cast.json`은 이름을 포함하지만 모든 행에 영구 `character_id`가 있지는 않다. 데이터베이스 적재나 CSV 관계 내보내기 전에 인물 카드 원장의 영구 ID를 결합해야 한다. 이름만으로 관계를 확정하는 방식은 `migration-required` 상태다.

### 이동 그래프

| 표시명 | 기계 필드 | 자료형 | 제약 |
|---|---|---|---|
| 역 식별자 | `stations[].id` | 문자열 | 전체 그래프에서 고유 |
| 한국어 역명 | `stations[].nameKo` | 문자열 | 실제 역명 표기 |
| 행정구 | `stations[].district` | 문자열 | 서울 25구 중 하나 |
| 위도·경도 | `lat`, `lon` | 실수 | WGS84, 지도 표시에만 사용 |
| 간선 양끝 | `edges[].a`, `edges[].b` | 역 ID | 두 역이 모두 존재, 자기 간선 금지 |

지표 행정동 인접은 이동 간선이 아니다. 역 그래프의 간선과 427동 지표 경계를 자동으로 합치지 않는다.

## 논리 데이터베이스 관계

이 표는 구현 전 관계 계약이다. 실제 서버 저장소나 마이그레이션을 이번 문서 작업에서 만들지 않는다.

| 테이블 | 기본키 | 주요 외래키 | 무결성 규칙 |
|---|---|---|---|
| `person` | `character_id` | `state_id` | 이름 변경 뒤에도 ID 유지, 사용자 잠금 성별 보존 |
| `state` | `state_id` | `capital_station_id` | `S01`–`S16`, 개막 국가 16개 |
| `organization` | `organization_id` | 다대다 `organization_state` | 조직 37개 원장의 ID 유지 |
| `station` | `station_id` | `district_id` | 334역 전수, 한국어 역명은 표시값 |
| `route_edge` | `(station_a, station_b)` | 두 역 ID | 양끝 존재, 중복 무방향 간선 금지 |
| `region` | `region_id` | `district_id` | 427동 전수, 행정동 표면과 이동 그래프 분리 |
| `station_control_delta` | `delta_id` | `station_id`, `state_id` | 기준선 변경만 기록, 원인·판본·시점 필수 |
| `dataset_receipt` | `receipt_id` | 데이터셋 ID | 원본 해시·생성기 판본·생성 시각·검증 결과 보존 |

## CSV 내보내기

- 문자 인코딩은 UTF-8, 첫 줄은 기계 필드명이다.
- 셀 구분과 따옴표는 RFC 4180 규칙을 따른다.
- 배열·객체를 한 셀의 임의 문자열로 접지 않는다. 관계 CSV로 분리하거나 JSON 원본을 유지한다.
- 내보낸 CSV에는 `schema_version`, `source_path`, `source_sha256`, `generated_at`을 영수증으로 함께 둔다.
- CSV는 생성물이다. 수정은 정본 JSON·Markdown에서 하고 다시 내보낸다.

## 버전과 검증

1. 스키마 이름과 판본은 파일의 `schema` 또는 별도 영수증에 기록한다.
2. 필드 삭제·의미 변경·ID 형식 변경은 새 판본이다. 같은 판본에서 뜻을 바꾸지 않는다.
3. 기본값이 없으면 `미정`으로 남긴다. 흔한 게임 수치를 추정 기본값으로 채우지 않는다.
4. 생성기는 입력 경로·입력 해시·자신의 판본을 영수증에 남긴다.
5. 검증기는 레코드 수만 보지 않고 ID 고유성, 참조 존재, 범위, 사용자 잠금, 정본 해시를 확인한다.
6. `/gdd`는 이 계약과 현재 통계를 보여 주지만 원본 JSON 전체를 새로운 정본으로 복사하지 않는다.

## 지역 데이터 게시 경계

427동의 세계 설명·영토·지배 상태·지도 탐색은 공식 위키 `/wiki/world/World-and-Subway-Layers`가 소유한다. `/gdd`는 지역 ID, 파일 구조, 생성기, 검증 규칙과 관계만 설명한다. 지도를 한 번 더 만들거나 지역 선택 UI를 중복 제공하지 않는다.
