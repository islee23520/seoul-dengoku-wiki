-- seed_sync_log + wiki_sync_writer: repo 편집 → 운영 적용 경로의 출처 로그와 적용
-- 전용 역할(설계 docs/repo-edit-apply-path.md, 소유자 승인 D1–D10, 2026-11-03).
-- - D7: wiki.seed_sync_log는 공개 스키마의 비공개 표다. 공개 허용목록
--   (server/wiki-table-allowlist.mjs)에 등록하지 않고 wiki_reader SELECT도 막는다.
-- - D2(a): wiki_sync_writer는 v1 동기화 범위 표(scripts/seed-sync-scope.mjs)에
--   SELECT(baseline 대조·적용 후 재반출 검증)와 INSERT/UPDATE만 받는다.
--   DELETE·TRUNCATE 권한은 부여되지 않으므로 이 역할로는 삭제가 불가능하다.
-- - 비밀번호는 이 저장소에 두지 않는다. 적용기(deploy/wiki-sync-loop.sh)가
--   WIKI_SYNC_WRITER_PASSWORD로 ALTER ROLE 한다.
CREATE TABLE IF NOT EXISTS wiki.seed_sync_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  applied_at timestamp with time zone NOT NULL DEFAULT now(),
  merge_sha text NOT NULL,
  pr integer NOT NULL,
  tables jsonb NOT NULL,
  rows jsonb NOT NULL,
  diff_sha256 text NOT NULL,
  base_manifest_sha256 text NOT NULL,
  pre_apply_dump_sha256 text,
  outcome text NOT NULL,
  notes text
);
--> statement-breakpoint
REVOKE ALL ON TABLE wiki.seed_sync_log FROM PUBLIC;
--> statement-breakpoint
-- 공개 읽기 경계 밖(D7). scripts/db-migrate.mjs가 매 실행 후의 전체 wiki_reader
-- GRANT 다음에도 이 REVOKE를 재확정한다.
REVOKE SELECT ON TABLE wiki.seed_sync_log FROM wiki_reader;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wiki_sync_writer') THEN
    CREATE ROLE wiki_sync_writer LOGIN;
  END IF;
END
$$;
--> statement-breakpoint
GRANT CONNECT ON DATABASE seoul TO wiki_sync_writer;
--> statement-breakpoint
GRANT USAGE ON SCHEMA wiki TO wiki_sync_writer;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE
  wiki.clan_crest_motif,
  wiki.current_region_disposition,
  wiki.current_right_retirement,
  wiki.geography_county,
  wiki.geography_edition,
  wiki.geography_map_title,
  wiki.geography_metadata,
  wiki.geography_title,
  wiki.relation_type,
  wiki.retirement_prose,
  wiki.state,
  wiki.state_label
TO wiki_sync_writer;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE wiki.seed_sync_log TO wiki_sync_writer;
