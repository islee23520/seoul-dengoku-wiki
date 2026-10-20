# 텍스트 코퍼스 도메인 정규화와 남은 범위

스키마 5는 기존 텍스트 도메인 정규화에 현행 서울 권리·office-v2 매핑을 통합한다. `source_file`의 원본 바이트 SHA-256과 `source_record`의 JSON pointer를 외래 키로 연결하며, 원문 JSON을 변경하지 않는다. `text-data.mjs`의 재구성은 원문·범용 pointer 값을 읽지 않고 도메인 행만 사용한다. build 및 offline/full verify는 manifest에 열거된 문서별 원래 `/data`와 깊은 JSON 동등성을 검사하고, 새 키나 손실을 감사 실패로 처리한다. 아래 표는 기존 도메인 대응이며 정확한 현행 입력 집합과 수는 `text-corpus-manifest.mjs` 및 실행 receipt가 기준이다. 이 문서는 현재 checkout 전체 검증 성공 영수가 아니다.

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

## 기존 텍스트 도메인 문서 대응

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

텍스트 코퍼스의 `current`는 현재 source snapshot이라는 분류이며 서울 배치 승인 완료가 아니다. 구현된 `current-rights.mjs`는 고정 승인 패키지 해시·영수 digest/ref·보관 원행 해시와 정확한 후속 배열을 인증한다. `current-context.mjs`는 승인 원천 스냅숏의 보유 20건을 `current_seoul_evidenced`, 별도 비소유 권리 5건을 `current_seoul_nonowning`으로 매핑한다. 지명·정치 ID·행정 경계만으로 소유자를 만들지 않으며 비소유 권리의 `direct_ownership=0`, scope/counties와 순서 있는 powers는 별도 테이블에 남긴다.

현행 작위 42건·수여 31건·binding 7건·비영토 정치 정체성 158건은 `context_feudal_*`와 `context_political_identity*`에 매핑하고 `current.context`에서 조회한다. 지리 parent·정치 parent·개인 주군은 구분한다. `polity:daejeon`의 비영토 정치 정체성을 현행 서울 밖 영지로 오인하지 않는다. 미확정 가신단은 `unresolved.context.retinue_groups`로 반환하며 위치 승인이나 새 인물·토지를 만들지 않는다. 옛 작위·수여·개인 연결 외부 통제는 `scripts/historical-inputs/`의 보관 원천에서 `historical_*`로 읽고 현행 권리로 승격하지 않는다. 이 수들은 승인 패키지 스냅숏의 설명이며 가변 코퍼스 건수의 고정 기대값이 아니다.

office-v2의 현재 결과 95건은 nullable position/rank, status와 evidence로 정규화한다. 현재 null을 history·카드 직함·common tier로 채우지 않으며 `historical.context.offices`로 이력을 분리한다. 검토된 projection 해시는 새 직책 승인 근거가 아니다. 대표 프로필은 첫 명시 `primary_detail_names` 일치 → 첫 state 카드 → 가장 긴 렌더링 한국어 본문 순이고 동률은 입력 순서를 유지한다. 안정 K ID·공개 route·변형 프로필·방향 있는 개인 관계를 보존한다.

query·coverage·source-closure의 현행 계약도 구현되어 있다. coverage는 권리의 민감 필드를 실제 열에 연결하고 인증/원천 보존 전용 값의 제외를 명시한다. office evidence의 발생 pointer와 대상 `path/jsonPointer`를 분리하며, 참조 대상은 preserved birthday·Core까지 명시한 `REFERENCE_TARGET_PATHS` 고정 목록으로 제한한다. 실제 참조·미해결·field shape·문서 수는 실행 receipt에서 읽으며 과거 관측 합계를 재사용하지 않는다.

루트 검증에서 지리 검사 4건 전체와 임시 커밋 원천 checkout의 full-verify 검사 8건 전체가 통과했다. 전체 28개 suite 실행은 총 267건 중 통과 259건·실패 4건·skip 4건이며, 실패는 원천 커밋 전 dirty Git source / HEAD manifest 불일치다. 남은 작업은 깨끗한 원천으로 스키마 5 정본 DB를 빌드하고 전체 suite를 검증한 뒤 전달하는 것이다. 스키마 2·3·4를 제자리 migration하지 않으며 임시 커밋 원천의 통과를 정본 DB 재빌드·전달 완료로 해석하지 않는다. 현재 위치·서사·관계·사건의 승인 범위, 권리 인증·source provenance와 `publication_admission: not-evaluated`·readiness는 별개이며 이 문서 변경은 원천 본문·소유권·승인을 바꾸지 않는다.

## 기존 원천 품질 문제

기본 build/full verify의 실제 종료 코드·품질 상태·importer issue와 미해결 reference anchor 수는 해당 실행 receipt로 판단한다. 과거 스냅숏의 성공이나 결함 합계를 현행 결과로 재사용하지 않는다. 공식 historical GURPS 검사는 현재 schema 미지원으로 `not_checked`이고 품질은 `unverified`다. 부분 매퍼·query·coverage 검사 성공을 full verify, `--require-clean` 성공 또는 전체 원천 승인 완료로 해석하지 않는다.
