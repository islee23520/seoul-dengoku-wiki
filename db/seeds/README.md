# db/seeds — 공개 위키 컨텐츠의 repo 가시 정본 스냅샷

PostgreSQL `wiki` 스키마가 운영 저작 정본이다. 이 디렉터리는 그중 **위키 사이트가 실제
렌더링하는 공개 컨텐츠**(소유자 결정 2026-11-03: 시드는 위키 컨텐츠에 대해서만)를 결정적
(deterministic) JSONL로 버전 관리하는 투영이며, 독립적인 편집 원본이 아니다.

## 범위 (이중 검사, 단일 출처 둘)

seed 대상은 두 조건을 모두 통과하는 `wiki` 테이블이다:

1. 공개 허용목록 — [`server/wiki-table-allowlist.mjs`](../server/wiki-table-allowlist.mjs)의
   `isPublicTable`(owner 결정, PR #666 — `/wiki/api/tables` 익명 공개 읽기 경계와 동일선).
2. 컨텐츠 범위 — [`scripts/seed-scope.mjs`](../scripts/seed-scope.mjs)의 `isSeedTable`
   (소유자 결정 2026-11-03 — 운영/시스템/메타/카탈로그 성격 제외).

`wiki_private` 스키마는 어떤 경로로도 조회하지 않는다.

### 포함 (컨텐츠, 근거는 seed-scope.mjs 주석의 코드 증거)

- `text_*` — 현재 문서 본문(문서 API 서빙 경로).
- `region_content_*` — 지역 문서.
- `person`, `person_*`, `profile`, `relation`, `relation_type` — 인물·관계(인물 상세·카탈로그 투영 원천).
- `glossary_head`, `glossary_revision`, `glossary_term`, `glossary_locale`, `glossary_alias`,
  `glossary_context` — 용어(사이트가 개정 단위로 서빙).
- `geography_county`/`edition`/`map_title`/`metadata`/`title` — 지리 계층.
- `public_map_block`, `public_map_block_locale`, `public_map_summary` — 공개 지도 블록.
- `document_head`, `document_key_order` — 문서 목록·렌더 키 순서.
- `clan_crest_motif`, `current_region_disposition`, `current_right_retirement`,
  `retirement_prose`, `state`, `state_label` — 세계 상태·서술.

### 제외 (소유자 지시 4분류)

| 분류 | 테이블 |
|---|---|
| 카탈로그 | `catalog_*` 6종 |
| 운영/게시 | `document_publication_admission`, `public_projection_document`, `public_office_replacement` |
| 메타/시스템/보존 | `document_revision`, `document_revision_link_target`, `document_revision_seal`, `glossary_revision_seal`, `glossary_archive`, `article_route`, `desire_axis`, `value_axis` |
| 개정 본문(미렌더) | `document_revision_text_*` 160종 — 공개 문서 API는 `text_*`만 서빙하고 개정 읽기는 저작 도구만 사용 |

## 형식

- `db/seeds/<도메인>/<테이블>.jsonl` — 한 줄 = 한 행, PostgreSQL `row_to_json` 원문.
  PK 오름차순, 40,000행 초과 시 `<테이블>.part-NNN.jsonl` 샤드.
- `db/seeds/manifest.json` — 테이블별 컬럼·PK·행수·파일·sha256. 타임스탬프 없음:
  같은 DB 상태에서는 같은 바이트가 나온다.
- 컬럼 타입은 `text`·`bigint`·`double precision`·`bytea`로 제한한다(그 외 타입이 범위
  테이블에 생기면 export가 `E_SEED_COLUMN_TYPE`으로 중단한다).
- 승격은 `.promote-pending.json` 저널로 보호된다: 저널이 남아 있으면 `seed:apply`는
  `E_SEED_PROMOTE_PENDING`으로 트리를 신뢰하지 않고, 다음 `seed:export`가 복구·완료한다.

## 루프 (운영 → repo → 리뷰)

1. 운영 편집은 기존 typed CLI(`scripts/cast-sqlite/document-cli.mjs`)로 PG에서만.
2. `npm run seed:export` — PG에서 `db/seeds`로 재반출(전량 읽기 전용 SELECT).
3. PR을 올린다. **데이터 델타는 이 디렉터리의 git diff가 곧 가시적 마이그레이션
   이력이다.** 추가·변경된 값은 리뷰에서 파일 단위로 검사된다.
4. merge 후 다음 export가 새 정상 상태(base)가 된다.

스키마(테이블 구조) 변경은 별도 계약이다: `db/migrations` + `scripts/db-migrate.mjs`
(drizzle custom SQL, PR로만 적용, 운영 wiki-migrate 적용기가 실행). seed 도구는
`db/migrations`에 어떤 파일도 추가하지 않으므로 운영 적용기 계약은 불변이다.

## repo 편집 → 운영 반영 (v1: `seed:sync`)

v1 동기화 범위는 `scripts/seed-sync-scope.mjs`의 상수·상태 12표뿐이다(소유자
승인 D1(a), 2026-11-03). 나머지 시드 표(개정 관리형·인물 원장·지도 투영 등)는
계속 운영 PG에서 typed CLI로만 편집하고 이 디렉터리는 그 투영이다.

편집자 절차(각 단계 전부 `WIKI_SEEDS_PG` 연결 필요):

1. `db/seeds/<도메인>/<표>.jsonl`의 값을 편집한다. 행 삭제는 불가하다(D2(a)).
2. `npm run seed:sync` — dry-run typed diff를 확인한다(update/insert/delete와
   거부 사유 `E_SYNC_DELETE_PRESENT`·`E_SYNC_OUT_OF_SCOPE`).
3. `npm run seed:sync -- --manifest-write` — 도구가 JSONL을 PG 정규형으로 다시
   쓰고 manifest 항목(행수·sha256)을 재계산한다. **manifest를 손으로 고치지
   않는다**(D5).
4. `npm run seed:sync` — 최종 diff를 PR에 그대로 첨부한다(체크리스트 필수 항목).
5. `npm run seed:sync -- --write-marker <PR번호>` — `.sync-request.json` 마커를
   커밋한다. merge가 곧 적용 승인이고, 이후 호스트 `wiki-sync` 적용기가
   INSERT/baseline UPDATE(전 컬럼 WHERE) 단일 트랜잭션으로 적용한 뒤 결정적
   재반출이 이 트리와 바이트 동일한지 검증한다(D6, 다르면 `E_SYNC_DRIFT`로
   전체 rollback). 출처는 `wiki.seed_sync_log`에 남는다(D7, 공개 API 비노출).
6. 리뷰 중·적용 전에 운영이 움직였으면 baseline 대조가 실패한다
   (`E_SYNC_BASE_MOVED`·`E_SYNC_MARKER_MISMATCH`) — `seed:export`로 새 base를
   반영해 diff를 다시 리뷰한다. 부분 적용은 존재하지 않는다.

마커가 없는 seed 변경 PR은 반영되지 않는다(export PR과 같은 취급). 적용기
운영(pg_dump·비밀번호 회전·주간 drift)은 `deploy/README.md`의 wiki-sync 절.

적용 결과 확인: `SELECT applied_at, merge_sha, pr, outcome, rows FROM
wiki.seed_sync_log ORDER BY id DESC LIMIT 5;`(wiki_owner 자격).

## 연결 (접속 문자열은 repo·로그에 남기지 않는다)

- `WIKI_SEEDS_PG` — PostgreSQL URL
- `WIKI_SEEDS_PG_FILE` — URL 파일(0600 전용, `scripts/db-migrate.mjs`와 동일 가드)
- `WIKI_SEEDS_PSQL` — 읽기 전용 psql 트랜스포트 명령행. 포트를 공개하지 않는
  운영 호스트에서 사용한다. 예)
  `WIKI_SEEDS_PSQL='docker exec wiki-postgres psql -U wiki_owner -d seoul' npm run seed:export`

## 신규 환경 재현 (스크래치·리허설)

`seed:apply`는 `INSERT ... ON CONFLICT DO NOTHING`만 한다. 이미 있는 행은
건드리지 않으므로 재실행은 no-op로 수렴하고, 갱신·삭제 경로는 없다. 운영 데이터
흐름의 정방향은 언제나 PG → repo다.

```bash
# 1) 역할·스키마(빈 DB): schema-pg 계약 참조
docker exec -i <pg> psql -U postgres -f scripts/postgres-migration/bootstrap-roles.sql
psql -f scripts/postgres-migration/schema-pg/apply.sql   # tables.sql 단일 트랜잭션
# 2) 공개 컨텐츠 seed 적재
WIKI_SEEDS_PG=<대상 URL> npm run seed:apply
WIKI_SEEDS_PG=<대상 URL> npm run seed:apply -- --verify  # 행수 일치 확인
# 3) 공개 읽기 정책(drizzle baseline GRANT)
WIKI_MIGRATE_PG=<대상 URL> npm run db:migrate
```

컨텐츠 seed 환경에는 비컨텐츠 테이블이 없으므로 `constraints.sql`(FK)·`guards.sql`은
적용하지 않는다. 포함 테이블 일부의 FK가 시드 범위 밖 테이블을 참조하기 때문이다.
전체 제약·가드는 schema-pg + 전체 적재 경계(`scripts/postgres-migration/load.mjs`)에 속한다.
