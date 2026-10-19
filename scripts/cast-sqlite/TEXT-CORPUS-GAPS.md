# 텍스트 코퍼스 이관의 남은 범위

이 목록은 2026-10-19 `auditTextCorpus().domain_sidecar_gap_paths`와 각 문서의 `/data` 키를 대조한 결과다. 52개 문서의 원문 바이트와 JSON pointer는 `source_file`·`source_record`에 보존되지만, 아래 도메인 필드의 전용 관계형 테이블·외래 키·도메인 검증을 제공하지 않는다. 범용 JSON pointer 보존을 도메인 정규화 완료로 세지 않는다.

현재 텍스트 mapper는 공통 envelope와 content의 렌더 구조만 정규화한다. 아래 필드에는 atlas, ecology, integration, governance 등 서로 다른 도메인 계약과 authoring example이 섞여 있어 기존 공통 텍스트 스키마의 기계적 확장만으로 의미·참조 무결성을 보장할 수 없다. 각 도메인별 매핑 계약과 테스트가 필요하므로 이번 통합에서 새 의미를 추정하지 않았다.

| 문서 | 아직 전용 정규화하지 않은 `/data` 키 |
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

