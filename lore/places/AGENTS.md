# lore/places — 지도·역·건물 원천

## OVERVIEW
서울 지도 기사, 역 식별·연결·별칭과 건물 재사용 계약을 관리한다.

## WHERE TO LOOK
| 작업 | 위치 |
|---|---|
| 현행 지도 기사·수직 환경 | `World-and-Subway-Layers.json` |
| 지도 조립 설계 기록 | `World-Map-Construction.json` |
| 역 목록·이력 | `Seoul-Station-Catalog.json` |
| 역 진입 설계 | `Station-Interior-Construction.json` |
| 건물 재사용·역할 | `Building-Reuse-Geography.json`, `landmark-roles.json` |
| 역 신원·보정 | `rail-station-identities.json`, `rail-station-corrections.json` |
| 철도 연결 | `connected-rail-stations.json`, `regular-line-adjacency.json`, `gtx-project-connections.json` |
| 역 바인딩·지배 예외 | `regional-station-bindings.json`, `station-control-overrides.json` |
| 별칭 후보 | `Station-Alias-Candidates.json`, `test-station-alias-candidates.mjs` |
| 겨울 기후 근거 | `sources/` |

## CONVENTIONS
- 선정 점수 5: 구조화 원천 비율 2 + 자체 schema 1 + 실행 모듈 심볼 밀도 2. 기존 지도 원천 경계를 update mode에서 유지한다.
- 334역은 기존 이동 그래프 목록, 427동은 선택 판본의 면적 분모다. 최신 작위 슬롯 수로 서로 대체하지 않는다.
- 역·층·터널 연결과 행정·작위 폴리곤을 별도 모델로 다룬다.
- 역별 개막 내부 상태는 `../regions/station-interiors.json`과 연결한다.
- 역 건물의 배급·통행세·숙영·피난 역할과 학교·주민센터·병원의 지원 역할을 원천과 대조한다.
- 관측 층수·기후 출처와 창작 환경 설정을 구분한다.
- 역 이름·별칭·안정 ID의 변경은 교정·신원 원장과 함께 확인한다.
- 원본 지리 자료의 출처·해시는 루트 `data/geography/`를 확인한다.

## ANTI-PATTERNS
- 관측하지 않은 층수나 시설을 창작으로 채우지 않는다.
- 원본 OSM PBF를 게임 Assets로 복사하지 않는다. ODbL·통계청 출처표시를 보존한다.
- 위키 설계 문장을 Unity 실행·역 진입 구현의 증거로 쓰지 않는다. 게임 코드는 이 subtree 밖이다.
- 과거 GAME 클래스명·435간선 설명을 현재 실행 상태로 단정하지 않는다.
- 동명이역을 이름만으로 합치거나 교차 도메인 링크를 경로 이동 뒤 방치하지 않는다.

## COMMANDS
루트 `npm run test:region-routes`, `npm run test:territory-map`, `npm run test:lore-json`으로 관련 원천을 검증한다.
