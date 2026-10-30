# 인물 SQLite 작업 지침

## OVERVIEW
공개 SQLite 저작 정본과 typed document reader·편집·외부 export를 다룬다. 삭제된 JSON에서 정본을 재구축하지 않는다.

## WHERE TO LOOK
| 작업 | 위치 | 계약 |
| --- | --- | --- |
| 사용법·제한 | `README.md`, `TEXT-CORPUS-GAPS.md` | current·historical·unresolved와 지원 범위 |
| 문서 편집·외부 export | `document-cli.mjs`, `build.mjs` | 정본 head·revision, checkout 밖 새 출력 |
| 연결·schema | `db.mjs`, `schema.sql`, `current-*.sql` | 버전, application_id, 외래 키 |
| 과거 입력 봉인 | `sources.mjs`, `source-archive.mjs` | 과거 provenance이며 현재 저작 권위가 아님 |
| 도메인 매핑 | `current-*.mjs`, `*-document.mjs` | typed 열과 원천 포인터 |
| 텍스트 원천 | `text-corpus-manifest.mjs`, `text-corpus.mjs`, `text-data.mjs` | 열거된 corpus, 복원 일치성 |
| 편입·누락 검사 | `coverage-contract.mjs`, `source-closure.mjs` | coverage와 승인 분리 |
| 조회·검증 | `query.mjs`, `verify.mjs`, `current-authority.mjs` | 현재 SQLite storage·head·privacy |

## CONVENTIONS
- PG 전환 코드의 저작·공개 판독은 `db-pg.mjs`의 비동기 transaction을 사용한다. 실제 운영 승격은 배포 receipt로 확인한다. `node:sqlite`와 `db.mjs`는 이관·회귀·명시적 archive 판독 전용이다.
- 이관 참조 SQLite의 `SCHEMA_VERSION`은 5, `APPLICATION_ID`는 `0x57435351`이다. PG는 migration metadata와 `wiki.meta`를 대조한다.
- 도메인 mapper의 열 목록, SQL schema, 저장·복원·검증 코드를 함께 대조한다.
- 현재 정본 계약은 `README.md`와 루트 `lore/AUTHORING-JSON.md`를 따른다. 과거 source manifest를 현재 파일 입력 목록으로 쓰지 않는다.
- 전환 후 조회·편집·생성의 기준은 PostgreSQL 현재 head와 release snapshot이다. 배포 전 코드 전환을 운영 완료로 간주하지 않는다. 삭제된 JSON이나 Git blob 대조로 현재성 검사를 대체하지 않는다.
- `data/canonical/wiki-cast.sqlite`는 이관 참조본이며 운영 출력 대상이 아니다. 이관 export는 checkout 밖 새 경로만 허용한다.
- 정본은 지원되는 typed CLI로 편집한다. export 파일로 정본을 덮어쓰거나 임의 SQL로 편집 계약을 우회하지 않는다.
- PG transaction callback은 비동기이며 동일 leased 연결을 사용한다. SQLite 이관용 `withTransaction()` callback만 동기식이고 중첩·Promise 반환을 금지한다.
- 과거 schema DB를 현행 정본으로 승격하거나 새 DB로 재구축하지 않는다. 버전·이력 계약은 현재 reader와 README를 확인한다.
- `local-corpus`와 renderer anchor의 `published`는 공개 승인 판정이 아니다.

## COMMANDS
저장소 루트에서 실행하며 옵션 예시는 README를 따른다.
```bash
npm run cast:build -- --output /tmp/wiki-cast-new.sqlite
npm run cast:query -- --db data/canonical/wiki-cast.sqlite person --id K1022
npm run cast:verify -- --db data/canonical/wiki-cast.sqlite
```
`cast:verify`는 현재 SQLite storage·head·privacy를 읽기 전용 검사한다. 과거 JSON freshness·offline/full 구분은 현행 검증 계약이 아니다.

## ANTI-PATTERNS
- DB 생성·복사·검증 성공을 owner approval, 공개, 배포, 게임 구현 승인으로 표시하지 않는다.
- `source_present`, `issued`, 원천 품질과 publication readiness를 하나의 상태로 합치지 않는다.
- 공식 검사가 `not_checked`이면 issue 0건을 통과로 해석하지 않는다. `--require-clean` 실패를 우회하지 않는다.
- 원천 품질 이슈의 과거 관측 개수를 고정 기대값으로 삼거나 근거 없는 메모를 인용 근거로 승격하지 않는다.
- K ID 숫자로 공개 순번·route를 계산하지 않는다. registry와 실제 원천 필드를 대조한다.
- private editorial·soul 원문을 raw/normalized 공개 text table로 추가하지 않는다.
