-- bootstrap-roles.sql — PostgreSQL 17 역할·데이터베이스·스키마 부트스트랩 (개발/운영 공용)
--
-- 사용법:
--   개발(Mac): psql -f scripts/postgres-migration/bootstrap-roles.sql
--              (로컬 trust/peer 인증 — 소켓 /tmp, 포트 5432)
--   운영(컨테이너, Todo 2): docker exec -i wiki-postgres psql -U postgres < scripts/postgres-migration/bootstrap-roles.sql
--
-- 역할 정책 (헤더 문서):
--   - 모든 역할은 NOLOGIN. 런타임 로그인은 별도 wiki_runtime_reader 역할로
--     runtime-reader-login.sql에서 프로비저닝한다. wiki_reader는 NOLOGIN을 유지한다.
--   - 개발(Mac)은 trust/peer 소켓 인증을 사용하므로 비밀번호가 필요 없다.
--   - wiki_reader        : 공개 위키 읽기. wiki 스키마 USAGE + SELECT만.
--   - wiki_owner         : wiki 스키마 소유자(DDL 포함 전 권한).
--   - orbat_reader       : orbat 맵 판독. orbat 스키마 USAGE + SELECT만.
--   - wiki_private_owner : wiki_private 스키마 소유자 — 저작/사설 스토어 전용.
--     공개 런타임 역할(wiki_reader/orbat_reader)은 wiki_private 접근이 없다.
--
-- CREATE ROLE / CREATE DATABASE / CREATE SCHEMA에는 IF NOT EXISTS가 없으므로
--(CREATE SCHEMA는 있음) 예외를 무시하는 DO 블록으로 멱등성을 확보한다.
-- CREATE DATABASE는 트랜잭션 안에서 실행할 수 없으므로 이 파일은
-- psql 메타커맨드(\connect)로 구성되어 있으며 -1(단일 트랜잭션)로 실행하지 말 것.

-- ===== 1. 역할 생성 (클러스터 수준) =====
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wiki_reader') THEN
    CREATE ROLE wiki_reader NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wiki_owner') THEN
    CREATE ROLE wiki_owner NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'orbat_reader') THEN
    CREATE ROLE orbat_reader NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wiki_private_owner') THEN
    CREATE ROLE wiki_private_owner NOLOGIN;
  END IF;
END
$$;

-- ===== 2. 데이터베이스 seoul (트랜잭션 밖이어야 함) =====
SELECT 'CREATE DATABASE seoul OWNER wiki_owner'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'seoul')\gexec

\connect seoul

-- ===== 3. 스키마 =====
CREATE SCHEMA IF NOT EXISTS wiki AUTHORIZATION wiki_owner;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'wiki_private') THEN
    CREATE SCHEMA wiki_private AUTHORIZATION wiki_private_owner;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'orbat') THEN
    -- orbat의 상세 소유 구조는 Todo 9(orbat 레인)가 결정; 여기서는 wiki_owner가 보유한다.
    CREATE SCHEMA orbat AUTHORIZATION wiki_owner;
  END IF;
END
$$;

-- ===== 4. 권한 =====
-- 기본: PUBLIC이 seoul DB에 접근하는 것을 차단 (운영 보수성, 개발과 동일 적용)
REVOKE ALL ON DATABASE seoul FROM PUBLIC;
GRANT CONNECT ON DATABASE seoul TO wiki_reader, wiki_owner, orbat_reader, wiki_private_owner;

-- 스키마 USAGE 부여 (멱등 — 반복 실행 무해)
GRANT USAGE ON SCHEMA wiki TO wiki_reader;
GRANT USAGE ON SCHEMA orbat TO orbat_reader;
-- wiki_private는 wiki_reader/orbat_reader에 USAGE를 부여하지 않는다 (의도적).

-- wiki_reader: 공개 위키 읽기 전용
GRANT SELECT ON ALL TABLES IN SCHEMA wiki TO wiki_reader;
ALTER DEFAULT PRIVILEGES FOR ROLE wiki_owner IN SCHEMA wiki
  GRANT SELECT ON TABLES TO wiki_reader;

-- orbat_reader: 맵 판독 전용
GRANT SELECT ON ALL TABLES IN SCHEMA orbat TO orbat_reader;
ALTER DEFAULT PRIVILEGES FOR ROLE wiki_owner IN SCHEMA orbat
  GRANT SELECT ON TABLES TO orbat_reader;

-- wiki_private_owner: 자기 스키마 전권 + DML (USAGE 포함)
GRANT USAGE, CREATE ON SCHEMA wiki_private TO wiki_private_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA wiki_private TO wiki_private_owner;
ALTER DEFAULT PRIVILEGES FOR ROLE wiki_private_owner IN SCHEMA wiki_private
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO wiki_private_owner;

-- wiki_owner: wiki 스키마 소유자(AUTHORIZATION으로 이미 전권) + orbat 관리
GRANT CREATE ON SCHEMA orbat TO wiki_owner;
GRANT wiki_private_owner TO wiki_owner;
GRANT wiki_reader TO wiki_owner;
GRANT orbat_reader TO wiki_owner;
