# lore/regions — 지역 내용·경계·작위 원천

## OVERVIEW
선택 경계의 동별 저작 데이터와 역 내부 상태, 선거구 작위·공간 출처를 관리한다.

## WHERE TO LOOK
아래 `.json` 이름은 PostgreSQL 정본의 논리 ID 또는 과거 provenance이며 물리 입력 파일이 아니다. 공개·비공개 정본 구분과 편집 절차는 루트 `lore/AUTHORING-JSON.md`와 `WORLD_BUILDING_GUIDE.md`를 따른다.
| 작업 | 위치 |
|---|---|
| 단위·판본·라이선스 | `README.md`, `sources/selection.json` |
| 동별 내용 | `content/<구 코드>.json` |
| 역별 내부 상태 | `station-interiors.json` |
| 선거구 작위·슬롯 | `seoul-electoral-titles.json` |
| 경계 비교·층수 근거 | `sources/boundary-comparison.json`, `sources/observed-levels-join.md` |
| 지도 기사 | `../places/World-and-Subway-Layers.json` |
| 보유권·정치 연결 | `../relations/personal-holdings.json` |
| 서울 범위·재배치 승인 | `../editorial/Seoul-Scope-Contract.json`, `../editorial/Seoul-Relocation-Ledger.json` |

## CONVENTIONS
- 도메인별 과거 자료와 현재 head·승인 상태를 대조하며, 삭제된 JSON 원천을 다시 만들지 않는다.
- 기존 동 데이터는 2026-07-01 선택 경계의 427동·25구 판본이다. 최신 공식 경계 인증으로 부르지 않는다.
- 원래 선택 합집합은 606,223,725.0069752㎡다. 이 판본 재생성 시 범위 보존을 확인한다.
- 위치·태그는 관측, 경계·면적·소속은 계산, 붕괴 뒤 주민·사건은 창작으로 구분한다.
- `anchor_refs`는 OSM 객체를, `canon_refs`는 설정 원천을 연결한다.
- `content.buildings`의 core-station·support 역할은 건물 재사용 계약과 맞춘다.
- 경계·선거구 판본을 바꿀 때 기존 427동 수나 옛 구역표를 새 슬롯 분모로 고정하지 않는다.
- 원본 지리 번들은 루트 `data/geography/`에 있다. 파일별 provenance는 그 manifest를 따른다.

## ANTI-PATTERNS
- 미관측 층수는 비워 둔다. 가장 가까운 다른 건물의 관측값을 붙이지 않는다.
- 경계 인접성만으로 이동 간선을 만들거나 같은 이름의 시설을 합치지 않는다.
- OSM 태그만으로 개막 가동을 확정하지 않는다. 다른 구의 시설을 이름만 보고 가져오지 않는다.
- 다음 봄 유언장·가을 행렬·겨울 무기열차를 개막 사건으로 앞당기지 않는다.
- `outside-*.json` 파일명이나 과거 extended_coverage 기록을 서울 밖 현재 세계의 승인으로 쓰지 않는다.
- `.omo/evidence/`의 존재나 문장 길이·점수만으로 지역 서사 완료를 판정하지 않는다.

## COMMANDS
기존 데이터 검증 도구와 실제 지역·지도 화면으로 확인한다.
옛 `TOOL/tools/regions/` Python 도구는 이 작업트리에 없다. JSON 검증을 공간 원자료 독립 재생성과 같다고 보고하지 않는다.
