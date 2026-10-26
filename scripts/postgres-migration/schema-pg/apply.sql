-- apply.sql — 진입점: tables.sql(테이블+인덱스)만 단일 트랜잭션 적용
-- 생성물: scripts/postgres-migration/ddl-convert.mjs (기계 변환, 수동 편집 금지)
-- source_sha256: a3c3edc3d73c4a2248963259e08fe4da2108fc82703079af0ed28dcc4b53a365
-- code_commit: 2326bf1df171f42dd9853d46ee0466a50bcd17e3
-- 계약: `psql -1 -f apply.sql`로 실행. constraints.sql/guards.sql은 데이터 적재 후 별도 적용. 재실행은 새 DB 전용(멱등 아님).

\set ON_ERROR_STOP on
\ir tables.sql
