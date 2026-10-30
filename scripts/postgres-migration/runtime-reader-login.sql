-- PostgreSQL 17; run with psql -X -v ON_ERROR_STOP=1 against database seoul.
-- WIKI_RUNTIME_READER_PASSWORD is read from the environment, never an argument.
-- Use a private admin session with no proxy/audit SQL capture; see deploy/README.md.
\set ECHO none
\set QUIET on
\set ON_ERROR_STOP on

BEGIN;
-- Superuser-only settings must succeed before the secret is imported.  Never run
-- this through a proxy, extension or external collector that records SQL text.
SET LOCAL log_statement = 'none';
SET LOCAL log_min_duration_statement = -1;
SET LOCAL log_min_error_statement = 'panic';
SET LOCAL log_duration = off;
SET LOCAL log_parameter_max_length = 0;
SET LOCAL log_parameter_max_length_on_error = 0;
SET LOCAL password_encryption = 'scram-sha-256';

DO $$
DECLARE r record;
BEGIN
  IF current_database() <> 'seoul' OR NOT (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION 'run as a superuser connected to seoul';
  END IF;
  IF EXISTS (SELECT FROM pg_extension WHERE extname = 'pgaudit') OR
     current_setting('shared_preload_libraries') ~* 'pgaudit|auto_explain' OR
     current_setting('session_preload_libraries') ~* 'pgaudit|auto_explain' OR
     current_setting('local_preload_libraries') ~* 'pgaudit|auto_explain' THEN
    RAISE EXCEPTION 'SQL logging extensions are incompatible with password provisioning';
  END IF;
  SELECT * INTO r FROM pg_roles WHERE rolname = 'wiki_reader';
  IF NOT FOUND OR r.rolcanlogin OR r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolbypassrls THEN
    RAISE EXCEPTION 'wiki_reader must exist as an unprivileged NOLOGIN role';
  END IF;
  IF EXISTS (SELECT FROM pg_auth_members m JOIN pg_roles member_role ON member_role.oid = m.member WHERE member_role.rolname = 'wiki_reader') THEN
    RAISE EXCEPTION 'wiki_reader must not be a member of another role';
  END IF;
  IF has_schema_privilege('wiki_reader', 'wiki_private', 'USAGE') OR
     has_schema_privilege('wiki_reader', 'wiki_private', 'CREATE') OR
     has_schema_privilege('wiki_reader', 'wiki', 'CREATE') OR
     has_database_privilege('wiki_reader', current_database(), 'CREATE') OR
     has_database_privilege('wiki_reader', current_database(), 'TEMPORARY') OR
     EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname IN ('wiki', 'wiki_private') AND c.relkind IN ('r','p','v','m','f')
               AND (has_table_privilege('wiki_reader', c.oid, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
                    OR (n.nspname = 'wiki_private' AND has_table_privilege('wiki_reader', c.oid, 'SELECT')))) THEN
    RAISE EXCEPTION 'wiki_reader has write or private privileges';
  END IF;
  SELECT * INTO r FROM pg_roles WHERE rolname = 'wiki_runtime_reader';
  IF FOUND THEN
    IF r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolbypassrls OR NOT r.rolinherit THEN
      RAISE EXCEPTION 'existing wiki_runtime_reader has unsafe role attributes';
    END IF;
    IF EXISTS (SELECT FROM pg_auth_members m JOIN pg_roles parent ON parent.oid = m.roleid
               WHERE m.member = r.oid AND (parent.rolname <> 'wiki_reader' OR m.admin_option OR NOT m.inherit_option OR NOT m.set_option)) OR
       EXISTS (SELECT FROM pg_auth_members m WHERE m.roleid = r.oid) OR
       EXISTS (SELECT FROM pg_shdepend d WHERE d.refclassid = 'pg_authid'::regclass AND d.refobjid = r.oid AND d.deptype IN ('o','a','i')) OR
       EXISTS (SELECT FROM pg_db_role_setting s WHERE s.setrole = r.oid) THEN
      RAISE EXCEPTION 'existing wiki_runtime_reader has unexpected membership, ownership, grants or settings';
    END IF;
  ELSE
    CREATE ROLE wiki_runtime_reader LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
  END IF;
END $$;

GRANT wiki_reader TO wiki_runtime_reader WITH ADMIN FALSE, INHERIT TRUE, SET TRUE;
\getenv runtime_password WIKI_RUNTIME_READER_PASSWORD
\if :{?runtime_password}
SELECT length(:'runtime_password') > 0 AS password_present \gset
\else
\set password_present false
\endif
\if :password_present
ALTER ROLE wiki_runtime_reader LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD :'runtime_password';
\unset runtime_password
\else
DO $$ BEGIN RAISE EXCEPTION 'WIKI_RUNTIME_READER_PASSWORD is required and must not be empty'; END $$;
\endif
COMMIT;
