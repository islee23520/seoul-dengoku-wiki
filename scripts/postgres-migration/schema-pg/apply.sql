-- apply.sql — 진입점: tables.sql(테이블+인덱스)만 단일 트랜잭션 적용
-- 생성물: scripts/postgres-migration/ddl-convert.mjs (기계 변환, 수동 편집 금지)
-- source_sha256: 9e7bb6fc6b6638d16d020e4793c9042265a9e82a5363ba0bb462e5f4ecd7e0de
-- code_commit: 1558452c3165f8eef0e53463708eb840d4ccc442
-- 계약: `psql -1 -f apply.sql`로 실행. constraints.sql/guards.sql은 데이터 적재 후 별도 적용. 재실행은 새 DB 전용(멱등 아님).

\set ON_ERROR_STOP on
\ir tables.sql
