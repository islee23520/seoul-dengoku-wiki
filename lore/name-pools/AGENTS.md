# lore/name-pools — 이름·신원·가계·가치 데이터

## OVERVIEW
인물의 영구 ID, 명명 출처, 생일·가계와 가치관 수치를 보관하는 구조화 데이터 도메인이다.

## WHERE TO LOOK
아래 `.json` 이름은 SQLite 논리 ID 또는 과거 provenance이며 물리 입력 파일이 아니다. 공개·비공개 정본 구분과 편집 절차는 루트 `lore/AUTHORING-JSON.md`와 `WORLD_BUILDING_GUIDE.md`를 따른다.
| 작업 | 위치 |
|---|---|
| 영구 ID 발급·승계 | `person-id-registry.json`, `issue-person-ids.mjs`, `person-id-values-successor.mjs` |
| 후보 신원 | `person-id-candidates.json`, `verify-person-id-candidates.mjs` |
| registry 검증 | `verify-person-id-registry.mjs` |
| 본관·항렬 계약 | `hangnyeol-schema.md`, `surnames-bongwan.json`, `clan-hangnyeol-tables.json`, `cast-hangnyeol.json` |
| 단순 이름 풀·중복 | `surnames.json`, `given-male.json`, `given-female.json`, `existing-names.json` |
| 생일·세대·가계 | `cast-birthdays.json`, `cast-birth-cohorts.json`, `cast-family-*.json` |
| 수치 정본 | `values-cast.json`, `values-orgs.json` |
| 검토 전 산출물 | `roster-100.json`, `cast-backfill-draft.*` |

## CONVENTIONS
- 도메인별 과거 자료와 현재 head·승인 상태를 대조하며, 삭제된 JSON 원천을 다시 만들지 않는다.
- 항렬 원천의 `id`·`schema`·`note`·`sources`를 유지한다. 실제 검증 코드와 설명이 충돌하면 판정 구현을 확인한다.
- 출처는 URL·접근일·원문 인용·evidence·live_check를 연결한다. 번역·요약은 원문 인용이 아니다.
- 인구 수치를 담은 행에는 그 숫자를 포함하는 출처 인용이 필요하다.
- `live_verified%`와 `sourced%`는 다르다. `record_id`·`live_check_ref`와 보고서의 정확한 판정을 연결한다.
- registry 순서·안정 ID와 표시 이름을 구분한다. 과거 1001명·1010명 안내로 현재 분모를 덮어쓰지 않는다.
- 가계의 친생·입양·역할 결정과 본문의 관계를 함께 대조한다.
- 옛 `gurps-cast.json` 값은 새 인물 시스템의 자동 변환 원천이 아니다.

## ANTI-PATTERNS
- 재확인으로 반박된 주장을 `artifact_corrected`로 바꿔 통과시키지 않는다.
- `roster-100.json`의 합성 persona를 실존 인물 사실로 취급하지 않는다.
- 해당 CC BY 4.0 자료 재배포 때 NVIDIA·dataset URL·판본·원본 UUID·변환 내용을 남긴다. `source_uuid` 하나로 출처를 대신하지 않는다.
- backfill 초안을 검토 없이 `characters/Cast-State-*`나 색인에 붙이지 않는다.
- 옛 `TOOL/`·`RESEARCH/` 생성기와 검증기를 현재 checkout에 존재한다고 가정하지 않는다.
- 후보 발급·원문 등록·검토 승인·공개 게시를 한 단계로 처리하지 않는다.

## COMMANDS
루트 `npm run test:person-id`는 두 `verify-person-id-*.mjs`를 실행한다.
파생 조회 데이터 변경은 `npm run test:cast-sqlite`, `npm run cast:verify -- --db data/canonical/wiki-cast.sqlite`와 연결한다.
