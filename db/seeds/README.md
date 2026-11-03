# db/seeds — 공개 위키 데이터의 repo 가시 정본 스냅샷

PostgreSQL `wiki` 스키마가 운영 저작 정본이다. 이 디렉터리는 그중 **웹이 렌더하는
공개 컨텐츠**를 결정적(deterministic) JSONL로 버전 관리하는 투영이며, 독립적인
편집 원본이 아니다.

## 경계 (단일 출처)

seed 대상은 [`server/wiki-table-allowlist.mjs`](../server/wiki-table-allowlist.mjs)의
`isPublicTable`이 결정한다(owner 결정, PR #666 — `/wiki/api/tables`의 익명 공개 읽기
경계와 동일선). `scripts/seed-core.mjs`가 이 모듈을 import하므로 seed 범위와 공개 API
범위는 절대 갈라지지 않는다. `wiki_private` 스키마는 어떤 경로로도 조회하지 않는다.

## 형식

- `db/seeds/<도메인>/<테이블>.jsonl` — 한 줄 = 한 행, PostgreSQL `row_to_json` 원문.
  PK 오름차순, 40,000행 초과 시 `<테이블>.part-NNN.jsonl` 샤드.
- `db/seeds/manifest.json` — 테이블별 컬럼·PK·행수·파일·sha256. 타임스탬프 없음:
  같은 DB 상태에서는 같은 바이트가 나온다.
- 컬럼 타입은 `text`·`bigint`·`double precision`·`bytea`로 제한한다(그 외 타입이
  허용목록 테이블에 생기면 export가 `E_SEED_COLUMN_TYPE`으로 중단한다).

## 루프 (운영 → repo → 리뷰)

1. 운영 편집은 기존 typed CLI(`scripts/cast-sqlite/document-cli.mjs`)로 PG에서만.
2. `npm run seed:export` — PG에서 `db/seeds`로 재반출(전량 읽기 전용 SELECT).
3. PR을 올린다. **데이터 델타는 이 디렉터리의 git diff가 곧 가시적 마이그레이션
   이력이다.** 추가·변경된 값은 리뷰에서 파일 단위로 검사된다.
4. merge 후 다음 export가 새 정상 상태(base)가 된다.

스키마(테이블 구조) 변경은 별도 계약이다: `db/migrations` + `scripts/db-migrate.mjs`
(drizzle custom SQL, PR로만 적용, 운영 wiki-migrate 적용기가 실행). seed 도구는
`db/migrations`에 어떤 파일도 추가하지 않으므로 운영 적용기 계약은 불변이다.

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
# 2) 공개 seed 적재
WIKI_SEEDS_PG=<대상 URL> npm run seed:apply
WIKI_SEEDS_PG=<대상 URL> npm run seed:apply -- --verify  # 행수 일치 확인
# 3) 공개 읽기 정책(drizzle baseline GRANT)
WIKI_MIGRATE_PG=<대상 URL> npm run db:migrate
```

공개 seed 환경에는 비공개 테이블이 없으므로 `constraints.sql`(FK)·`guards.sql`은
적용하지 않는다. 허용 테이블 일부(profile, relation 등)의 FK가 seed 범위 밖
테이블(`source_file`, `source_record`, …)을 참조하기 때문이다. 전체 제약·가드는
schema-pg + 전체 적재 경계(`scripts/postgres-migration/load.mjs`)에 속한다.
