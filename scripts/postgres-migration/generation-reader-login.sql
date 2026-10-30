-- PostgreSQL 17; run with psql -X -v ON_ERROR_STOP=1 against database seoul.
-- WIKI_GENERATION_READER_PASSWORD is read from the environment, never an argument.
-- Use a private admin session with no proxy/audit SQL capture; see deploy/README.md.
\set ECHO none
\set QUIET on
\set ON_ERROR_STOP on

BEGIN;
SET LOCAL log_statement = 'none';
SET LOCAL log_min_duration_statement = -1;
SET LOCAL log_min_error_statement = 'panic';
SET LOCAL log_duration = off;
SET LOCAL log_parameter_max_length = 0;
SET LOCAL log_parameter_max_length_on_error = 0;
SET LOCAL password_encryption = 'scram-sha-256';

-- Exact private tables read by the editorial, approved soul and evidence readers.
-- The soul typed tables can contain draft rows: SELECT is table-wide, while the
-- application selects and validates the imported approved revision explicitly.
CREATE TEMP TABLE generation_private_allowlist (name text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO generation_private_allowlist VALUES
 ('editorial_batch_source'), ('editorial_batch'), ('editorial_profile'),
 ('editorial_abilities'), ('editorial_ability_value'), ('editorial_skill'),
 ('editorial_skill_name'), ('editorial_trait'), ('editorial_trait_name'),
 ('editorial_trait_description'), ('editorial_trait_behavior'), ('editorial_trait_stress'),
 ('editorial_trait_relationship'), ('editorial_effect'), ('editorial_narrative'),
 ('editorial_profile_evidence'), ('editorial_soul'), ('editorial_health'),
 ('editorial_body_part'), ('editorial_disease'), ('editorial_batch_source_path'),
 ('editorial_batch_source_ref'), ('editorial_batch_source_card'), ('editorial_batch_limitation'),
 ('editorial_profile_limitation'), ('soul_revision'), ('soul_edit_revision'), ('soul_identity'),
 ('soul_document'), ('soul_coverage'), ('soul_assignment'), ('soul_soul'),
 ('soul_evidence'), ('soul_comparison'), ('soul_historical_source'),
 ('soul_candidate_period'), ('soul_comparison_limitation'), ('soul_counter_item'),
 ('ev_evidence'), ('ev_evidence_policy'), ('ev_evidence_reference');

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
  IF EXISTS (SELECT FROM generation_private_allowlist a
             LEFT JOIN pg_namespace n ON n.nspname = 'wiki_private'
             LEFT JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = a.name AND c.relkind IN ('r','p')
             WHERE c.oid IS NULL) THEN
    RAISE EXCEPTION 'required generation private table is missing';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'wiki_generation_reader') THEN
    CREATE ROLE wiki_generation_reader NOLOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
  END IF;
  SELECT * INTO r FROM pg_roles WHERE rolname = 'wiki_generation_reader';
  IF r.rolcanlogin OR r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolbypassrls OR NOT r.rolinherit OR
     EXISTS (SELECT FROM pg_auth_members m WHERE m.member = r.oid) OR
     EXISTS (SELECT FROM pg_auth_members m JOIN pg_roles member ON member.oid = m.member WHERE m.roleid = r.oid AND member.rolname <> 'wiki_generation_login') OR
     EXISTS (SELECT FROM pg_shdepend d WHERE d.refclassid = 'pg_authid'::regclass AND d.refobjid = r.oid AND d.deptype = 'o') OR
     EXISTS (SELECT FROM pg_db_role_setting s WHERE s.setrole = r.oid) THEN
    RAISE EXCEPTION 'wiki_generation_reader has unsafe attributes, membership, ownership or settings';
  END IF;
  SELECT * INTO r FROM pg_roles WHERE rolname = 'wiki_generation_login';
  IF FOUND THEN
    IF r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolbypassrls OR NOT r.rolinherit OR
       EXISTS (SELECT FROM pg_auth_members m JOIN pg_roles parent ON parent.oid = m.roleid
               WHERE m.member = r.oid AND (parent.rolname <> 'wiki_generation_reader' OR m.admin_option OR NOT m.inherit_option OR NOT m.set_option)) OR
       EXISTS (SELECT FROM pg_auth_members m WHERE m.roleid = r.oid) OR
       EXISTS (SELECT FROM pg_shdepend d WHERE d.refclassid = 'pg_authid'::regclass AND d.refobjid = r.oid AND d.deptype IN ('o','a','i')) OR
       EXISTS (SELECT FROM pg_db_role_setting s WHERE s.setrole = r.oid) THEN
      RAISE EXCEPTION 'existing wiki_generation_login has unsafe attributes, membership, ownership, grants or settings';
    END IF;
  ELSE
    CREATE ROLE wiki_generation_login LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
  END IF;
END $$;

GRANT CONNECT ON DATABASE seoul TO wiki_generation_reader;
GRANT USAGE ON SCHEMA wiki_private TO wiki_generation_reader;
SELECT format('GRANT SELECT ON TABLE wiki_private.%I TO wiki_generation_reader', name)
FROM generation_private_allowlist ORDER BY name \gexec
GRANT wiki_generation_reader TO wiki_generation_login WITH ADMIN FALSE, INHERIT TRUE, SET TRUE;

DO $$
DECLARE role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['wiki_generation_reader', 'wiki_generation_login'] LOOP
    IF has_database_privilege(role_name, current_database(), 'CREATE,TEMPORARY') OR
       EXISTS (SELECT FROM pg_namespace n WHERE n.nspname NOT LIKE 'pg_temp_%' AND n.nspname NOT LIKE 'pg_toast_temp_%'
               AND has_schema_privilege(role_name, n.oid, 'CREATE')) OR
       EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
               WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') AND n.nspname NOT LIKE 'pg_toast%'
                 AND n.nspname NOT LIKE 'pg_temp_%' AND c.relkind IN ('r','p','v','m','f')
                 AND n.nspname <> 'wiki_private' AND
                 (has_table_privilege(role_name, c.oid, 'SELECT') OR has_any_column_privilege(role_name, c.oid, 'SELECT'))) OR
       EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
               WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') AND n.nspname NOT LIKE 'pg_toast%'
                 AND n.nspname NOT LIKE 'pg_temp_%' AND c.relkind IN ('r','p','v','m','f') AND
                 (has_table_privilege(role_name, c.oid, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR
                  has_any_column_privilege(role_name, c.oid, 'INSERT,UPDATE,REFERENCES') OR
                  (n.nspname = 'wiki_private' AND NOT EXISTS (SELECT FROM generation_private_allowlist a WHERE a.name = c.relname) AND
                   (has_table_privilege(role_name, c.oid, 'SELECT') OR has_any_column_privilege(role_name, c.oid, 'SELECT'))))) OR
       EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace JOIN generation_private_allowlist a ON a.name = c.relname
               WHERE n.nspname = 'wiki_private' AND (NOT has_table_privilege(role_name, c.oid, 'SELECT') OR has_table_privilege(role_name, c.oid, 'SELECT WITH GRANT OPTION'))) THEN
      RAISE EXCEPTION '% has unsafe or incomplete generation privileges', role_name;
    END IF;
  END LOOP;
  FOREACH role_name IN ARRAY ARRAY['wiki_reader', 'wiki_runtime_reader'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = role_name) AND
       (has_schema_privilege(role_name, 'wiki_private', 'USAGE,CREATE') OR
        EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'wiki_private' AND c.relkind IN ('r','p','v','m','f') AND
                  (has_table_privilege(role_name, c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR
                   has_any_column_privilege(role_name, c.oid, 'SELECT,INSERT,UPDATE,REFERENCES')))) THEN
      RAISE EXCEPTION '% has private access', role_name;
    END IF;
  END LOOP;
END $$;

\getenv generation_password WIKI_GENERATION_READER_PASSWORD
\if :{?generation_password}
SELECT length(:'generation_password') > 0 AS password_present \gset
\else
\set password_present false
\endif
\if :password_present
ALTER ROLE wiki_generation_login LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD :'generation_password';
\unset generation_password
\else
DO $$ BEGIN RAISE EXCEPTION 'WIKI_GENERATION_READER_PASSWORD is required and must not be empty'; END $$;
\endif
COMMIT;
