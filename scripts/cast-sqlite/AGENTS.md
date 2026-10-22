# 인물 SQLite 작업 지침

## OVERVIEW
인물 원천의 정규화 저장본과 typed document reader를 다룬다. 점수 9이며 319개 파일의 독립 SQLite 도메인이다.

## WHERE TO LOOK
| 작업 | 위치 | 계약 |
| --- | --- | --- |
| 사용법·제한 | `README.md`, `TEXT-CORPUS-GAPS.md` | current·historical·unresolved와 지원 범위 |
| CLI 생성 | `build.mjs` | 입력 snapshot, 출력 위치, mapper orchestration |
| 연결·schema | `db.mjs`, `schema.sql`, `current-*.sql` | 버전, application_id, 외래 키 |
| 입력 봉인 | `sources.mjs`, `source-archive.mjs` | HEAD 바이트, tracking, 경로·해시 |
| 도메인 매핑 | `current-*.mjs`, `*-document.mjs` | typed 열과 원천 포인터 |
| 텍스트 원천 | `text-corpus-manifest.mjs`, `text-corpus.mjs`, `text-data.mjs` | 열거된 corpus, 복원 일치성 |
| 편입·누락 검사 | `coverage-contract.mjs`, `source-closure.mjs` | coverage와 승인 분리 |
| 조회·검증 | `query.mjs`, `verify.mjs` | DB 단독 검사와 원천 포함 검사 |

## CONVENTIONS
- Node.js 24.15.0 이상과 내장 `node:sqlite`의 `DatabaseSync`를 사용한다.
- `db.mjs`의 `SCHEMA_VERSION`은 5, `APPLICATION_ID`는 `0x57435351`이다.
- 도메인 mapper의 열 목록, SQL schema, 저장·복원·검증 코드를 함께 대조한다.
- `DATA_SOURCE_PATHS`, `SCRIPT_SOURCE_PATHS`, text manifest로 입력을 명시한다. 디렉터리 탐색으로 입력 집합을 늘리지 않는다.
- 원천 checkout의 관련 입력은 Git HEAD 바이트와 일치해야 한다. 관련 없는 수정은 dirty 검사 대상이 아니다.
- 원천 내부 출력은 `data/canonical/wiki-cast.sqlite`만 허용한다. 임시 DB는 checkout 밖의 새 경로를 사용한다.
- 정본 경로는 재빌드 교체가 가능하다. 다른 출력과 receipt는 기존 경로를 덮어쓰지 않는다.
- `withTransaction()` callback은 동기식이다. 중첩 transaction과 Promise 반환을 허용하지 않는다.
- schema 2·3·4 DB를 제자리 migration하지 않는다. 승인된 원천에서 새 schema 5 DB를 만든다.
- `local-corpus`와 renderer anchor의 `published`는 공개 승인 판정이 아니다.

## COMMANDS
저장소 루트에서 실행하며 옵션 예시는 README를 따른다.
```bash
npm run cast:build -- --output data/canonical/wiki-cast.sqlite
npm run cast:query -- --db data/canonical/wiki-cast.sqlite person --id K1022
npm run cast:verify -- --db data/canonical/wiki-cast.sqlite
npm run test:cast-sqlite
npm run test:cast-sqlite:readme
```
원천 포함 full verify는 `--source-root`를 추가한다. DB 단독 verify는 원천 최신성을 증명하지 않는다.

## ANTI-PATTERNS
- DB 생성·복사·검증 성공을 owner approval, 공개, 배포, 게임 구현 승인으로 표시하지 않는다.
- `source_present`, `issued`, 원천 품질과 publication readiness를 하나의 상태로 합치지 않는다.
- 공식 검사가 `not_checked`이면 issue 0건을 통과로 해석하지 않는다. `--require-clean` 실패를 우회하지 않는다.
- 원천 품질 이슈의 과거 관측 개수를 고정 기대값으로 삼거나 근거 없는 메모를 인용 근거로 승격하지 않는다.
- K ID 숫자로 공개 순번·route를 계산하지 않는다. registry와 실제 원천 필드를 대조한다.
- private editorial·soul 원문을 raw/normalized 공개 text table로 추가하지 않는다.
