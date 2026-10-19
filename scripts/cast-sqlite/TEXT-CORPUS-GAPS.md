# 텍스트 코퍼스 도메인 정규화와 남은 범위

2026-10-19 스키마 4는 아래 52개 문서의 `/data`를 전용 STRICT 관계형 테이블로 이관한다. `source_file`의 원본 바이트 SHA-256과 `source_record`의 JSON pointer를 외래 키로 연결하며, 원문 JSON을 변경하지 않는다. `text-data.mjs`의 재구성은 원문·범용 pointer 값을 읽지 않고 도메인 행만 사용한다. build 및 offline/full verify는 문서별 원래 `/data`와 깊은 JSON 동등성을 검사한다. `domain_sidecar_gap_paths`는 빈 배열이며, 새 키나 손실은 감사 실패다.

| 도메인 | 관계형 테이블 |
| --- | --- |
| atlas·root registry | `text_atlas`·`text_atlas_*` 92개와 `text_registry`·`text_registry_entry`·`text_registry_entry_relations` |
| 생태·통합 출처 | `text_ecology_data`, `text_ecology`, `text_ecology_description`, `text_ecology_description_run`, `text_ecology_variant`, `text_integration`, `text_integration_excluded` |
| 정치 소속·통치 | `text_affiliation`, `text_affiliation_hegemon`, `text_affiliation_member`, `text_affiliation_state`, `text_affiliation_neutral`, `text_governance` |
| 영토 규모 원천 계약 | `text_territorial`·`text_territorial_*` 7개 |
| 역 별칭·관측 노선 | `text_station_catalog`, `text_station`, `text_station_alias`, `text_station_line_name`, `text_station_line` |
| 대표 인물·연대기·이름 풀 | `text_simple_collection`, `text_primary_detail`, `text_chronology_event`, `text_name_pool_example_entry` |
| 인물 authoring 예제 | `text_character_example`·`text_character_example_*` 9개 |
| 단순 authoring 예제 | `text_ailments_example`, `text_culture_example`, `text_economy_example`, `text_goods_example`, `text_offices_example`, `text_overview_example`, `text_people_and_machines_example`, `text_places_example`, `text_regions_example`, `text_structures_example`, `text_technology_example` |

원천 문서 ID와 파일 source ID, 원래 엔티티 ID 및 배열 ordinal이 키를 구성한다. 배열 순서·중복·빈 배열, 동적 map 키, 생략과 null, 두 언어의 텍스트와 runs를 구분한다. 정치 state와 대표 인물은 기존 `state`·`person`에 연결한다. atlas의 정확히 일치하는 기존 인물·state 참조도 연결한다. 예제는 `corpus_kind=example`로 유지하고 실제 인물·국가를 만들지 않는다.

## 의미를 추정하지 않은 값

- atlas의 관계 종류, 장면·권리·작위·소속 문장, 경로·source anchor·검증 상태 문자열은 원천의 타입과 문구를 보존한다. 과거 atlas의 외부 지역·권리 서술을 현재 서울 사실로 승격하지 않는다.
- 생태 variant ID와 `source_batch`, integration의 외부 `TOOL` manifest 및 제외 항목 ID는 별도 로컬 엔티티가 없는 출처 식별자다. 정확한 로컬 문서 ID가 있을 때만 target FK를 채우고 나머지는 원래 문자열과 null 참조를 남긴다.
- `territorialScale`의 구 행정 계층과 `governance`는 현재 승인된 영지 계층의 판정기가 아니라 원천 계약 기록이다. 역·시설 ID·노선명은 자체 문맥의 문자열이며 기존 `context_place`의 다른 ID 체계와 이름으로 억지 결합하지 않는다.
- `symptom`, `transmission`, `exchange`, `supply`, `tier`, `consequence`, `dependency`, `layer`, `opening_state`, `function`, `constraint`의 `__EXAMPLE__` 값은 TEXT로 보존하는 집필 예제이며 실행 효과가 아니다. 인물 예제의 unknown·undecided·not-applicable은 구별한다.
- 연대기의 `order`와 배열 순서, 날짜의 status·value·reason을 따로 보존한다. `EVENT:Y2026` ID와 날짜 2030처럼 이름과 값이 다른 경우도 고치거나 유추하지 않는다.

## 이관한 52개 문서

| 문서 | 전용 정규화한 `/data` 키 |
| --- | --- |
| `lore/World-Narrative-Atlas.json` | `atlas` |
| `lore/ailments/authoring.example.json` | `symptom` |
| `lore/authoring.example.json` | `registry`, `atlas` |
| `lore/bestiary/authoring.example.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G01.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G02.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G03.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G04.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G05.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G06.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G07.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G08.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G09.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G10.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G11.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G12.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G13.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G14.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G15.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G16.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G17.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G18.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G19.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G20.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G21.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G22.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G23.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G24.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G25.json` | `ecology`, `integration` |
| `lore/bestiary/groups/Hostile-Group-G26.json` | `ecology`, `integration` |
| `lore/characters/Cast-State-05.json` | `primary_detail_names` |
| `lore/characters/Cast-State-08.json` | `primary_detail_names` |
| `lore/characters/Cast-State-12.json` | `primary_detail_names` |
| `lore/characters/Core-Characters.json` | `primary_detail_names` |
| `lore/characters/authoring.example.json` | `identity`, `sex`, `rank`, `origin`, `language`, `conscription`, `arms_access`, `occupation`, `affiliation`, `values`, `desires`, `relations`, `politics`, `biography` |
| `lore/chronology/Century-Annals.json` | `sequence` |
| `lore/chronology/authoring.example.json` | `sequence` |
| `lore/culture/authoring.example.json` | `transmission` |
| `lore/economy/authoring.example.json` | `exchange` |
| `lore/factions/Sixteen-States.json` | `currentAffiliation`, `governance` |
| `lore/factions/authoring.example.json` | `governance` |
| `lore/goods/authoring.example.json` | `supply` |
| `lore/name-pools/authoring.example.json` | `entries` |
| `lore/offices/Offices-and-Ranks.json` | `territorialScale` |
| `lore/offices/authoring.example.json` | `tier` |
| `lore/overview/authoring.example.json` | `consequence` |
| `lore/people-and-machines/authoring.example.json` | `dependency` |
| `lore/places/Seoul-Station-Catalog.json` | `station_aliases` |
| `lore/places/authoring.example.json` | `layer` |
| `lore/regions/authoring.example.json` | `opening_state` |
| `lore/structures/authoring.example.json` | `function` |
| `lore/technology/authoring.example.json` | `constraint` |

## 현재 서울 배치와 권리

이 코퍼스의 `current`는 현재 source snapshot이라는 분류이며 서울 배치 승인 완료가 아니다. 기존 `current-context.mjs`는 외부 영지 5건을 `superseded_outside_seoul`, 수여 근거가 부족한 영지 20건을 `unresolved`로 저장하며 현재 유효 영지는 0건이다. 지명이나 행정 경계만으로 현재 권리나 보유자를 만들지 않는다.

현재 서울 통합에는 승인된 위치·권리·관계·사건의 깨끗한 원천 변경, 인물 위치와 barony/county/duchy/kingdom/empire 계층 및 권리 매핑, field-coverage 계약과 mapper 갱신, 현재 위치·권리 검증, 새 DB 빌드가 필요하다. 원천의 본문·소유권·승인 상태를 이번 저장 작업에서 변경하지 않았다.

## 기존 원천 품질 문제

기본 build/full verify는 `PASS_WITH_SOURCE_ISSUES`로 성공한다. 이 스냅숏은 importer issue 444건과 미해결 reference anchor 11건을 드러낸다. 공식 historical GURPS 검사는 현재 schema 미지원으로 `not_checked`이고 품질은 `unverified`다. `--require-clean` 성공이나 전체 원천 승인 완료를 주장하지 않는다.

