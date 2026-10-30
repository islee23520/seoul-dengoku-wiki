-- PostgreSQL 17; psql -X -v ON_ERROR_STOP=1 against seoul, private admin session.
-- WIKI_AUTHOR_PASSWORD is environment-only. Never use SQL-capturing proxies/audit.
-- Active CLI SET ROLE wiki_author; runtime/generation roles gain no membership.
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

DO $$
DECLARE r record; role_name text;
BEGIN
  IF current_database() <> 'seoul' OR NOT (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) THEN
    RAISE EXCEPTION 'run as a superuser connected to seoul';
  END IF;
  IF EXISTS (SELECT FROM pg_extension WHERE extname='pgaudit') OR
     current_setting('shared_preload_libraries') ~* 'pgaudit|auto_explain' OR
     current_setting('session_preload_libraries') ~* 'pgaudit|auto_explain' OR
     current_setting('local_preload_libraries') ~* 'pgaudit|auto_explain' THEN
    RAISE EXCEPTION 'SQL logging extensions are incompatible with password provisioning';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_namespace WHERE nspname='wiki_private') THEN
    RAISE EXCEPTION 'wiki_private security boundary must exist';
  END IF;
  FOREACH role_name IN ARRAY ARRAY['wiki_author','wiki_author_login'] LOOP
    SELECT * INTO r FROM pg_roles WHERE rolname=role_name;
    IF NOT FOUND THEN
      EXECUTE format('CREATE ROLE %I NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS',role_name);
    ELSIF r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolbypassrls OR r.rolinherit OR
          (role_name='wiki_author' AND r.rolcanlogin) THEN
      RAISE EXCEPTION 'unsafe author role attributes: %',role_name;
    END IF;
    IF EXISTS (SELECT FROM pg_shdepend d JOIN pg_roles p ON p.oid=d.refobjid
               WHERE d.refclassid='pg_authid'::regclass AND p.rolname=role_name AND d.deptype='o') OR
       EXISTS (SELECT FROM pg_db_role_setting s JOIN pg_roles p ON p.oid=s.setrole WHERE p.rolname=role_name) THEN
      RAISE EXCEPTION 'author roles must not own objects or have persisted role settings';
    END IF;
  END LOOP;
  IF EXISTS (SELECT FROM pg_auth_members m JOIN pg_roles child ON child.oid=m.member JOIN pg_roles parent ON parent.oid=m.roleid
             WHERE (child.rolname IN ('wiki_author','wiki_author_login') OR parent.rolname IN ('wiki_author','wiki_author_login'))
               AND NOT (child.rolname='wiki_author_login' AND parent.rolname='wiki_author' AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)) THEN
    RAISE EXCEPTION 'unexpected author membership; runtime and generation roles must remain isolated';
  END IF;
END $$;

GRANT CONNECT ON DATABASE seoul TO wiki_author_login;
GRANT USAGE ON SCHEMA wiki TO wiki_author;
-- Current reader + dependency completeness inspection cover public wiki tables.
-- No default privileges: future tables require explicit provisioning review.
GRANT SELECT ON ALL TABLES IN SCHEMA wiki TO wiki_author;
GRANT wiki_author TO wiki_author_login WITH ADMIN FALSE, INHERIT FALSE, SET TRUE;

DO $$
DECLARE t record; name text; role_name text;
  body_tables constant text[] := ARRAY['text_document_node','text_document_list_item','text_document_table_row',
    'text_document_table_cell','text_document_slot','text_document_run','text_document_anchor','text_document_link'];
  domain_tables constant text[] := ARRAY['text_ailments_example','text_culture_example','text_economy_example',
    'text_goods_example','text_offices_example','text_overview_example','text_people_and_machines_example',
    'text_places_example','text_regions_example','text_structures_example','text_technology_example'];
BEGIN
  GRANT UPDATE(status) ON wiki.text_document TO wiki_author;
  GRANT UPDATE(title,summary,tense) ON wiki.text_document_locale TO wiki_author;
  GRANT UPDATE(national_state_id,national_state_id__type,state_ref) ON wiki.text_atlas_additional_people TO wiki_author;
  FOREACH name IN ARRAY body_tables LOOP
    EXECUTE format('GRANT INSERT,UPDATE,DELETE ON wiki.%I TO wiki_author',name);
  END LOOP;
  GRANT UPDATE(symptom) ON wiki.text_ailments_example TO wiki_author;
  GRANT UPDATE(transmission) ON wiki.text_culture_example TO wiki_author;
  GRANT UPDATE(exchange) ON wiki.text_economy_example TO wiki_author;
  GRANT UPDATE(supply) ON wiki.text_goods_example TO wiki_author;
  GRANT UPDATE(tier) ON wiki.text_offices_example TO wiki_author;
  GRANT UPDATE(consequence) ON wiki.text_overview_example TO wiki_author;
  GRANT UPDATE(dependency) ON wiki.text_people_and_machines_example TO wiki_author;
  GRANT UPDATE(layer) ON wiki.text_places_example TO wiki_author;
  GRANT UPDATE(opening_state) ON wiki.text_regions_example TO wiki_author;
  GRANT UPDATE(function) ON wiki.text_structures_example TO wiki_author;
  GRANT UPDATE(constraint_text) ON wiki.text_technology_example TO wiki_author;
  GRANT INSERT(source_id,json_pointer,parent_pointer,ordinal,field_name,json_type) ON wiki.source_record TO wiki_author;
  GRANT INSERT ON wiki.document_node_identity, wiki.document_revision,
    wiki.document_revision_link_target, wiki.document_revision_seal, wiki.relation TO wiki_author;
  GRANT UPDATE(revision_id,public_admission) ON wiki.document_head TO wiki_author;
  GRANT UPDATE(sequence) ON wiki.document_authority TO wiki_author;
  GRANT INSERT,DELETE ON wiki.profile_node,wiki.profile_field TO wiki_author;
  -- History permits append before sealing only; existing immutable/seal triggers
  -- independently reject mutation or append to a committed revision.
  FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE n.nspname='wiki' AND c.relkind='r' AND starts_with(c.relname,'document_revision_text_') LOOP
    EXECUTE format('GRANT INSERT ON wiki.%I TO wiki_author',t.relname);
  END LOOP;
  FOREACH role_name IN ARRAY ARRAY['wiki_author','wiki_author_login'] LOOP
    IF has_schema_privilege(role_name,'wiki_private','USAGE') OR has_schema_privilege(role_name,'wiki_private','CREATE') OR
       has_schema_privilege(role_name,'wiki','CREATE') OR has_database_privilege(role_name,current_database(),'CREATE') OR
       has_database_privilege(role_name,current_database(),'TEMPORARY') OR
       EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
               WHERE n.nspname='wiki_private' AND c.relkind IN ('r','p','v','m','f') AND
                 (has_table_privilege(role_name,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR
                  has_any_column_privilege(role_name,c.oid,'SELECT,INSERT,UPDATE,REFERENCES'))) THEN
      RAISE EXCEPTION 'author role has unsafe schema/database/private privileges: %',role_name;
    END IF;
    FOR t IN SELECT c.oid,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE n.nspname='wiki' AND c.relkind IN ('r','p','v','m','f') LOOP
      IF has_table_privilege(role_name,t.oid,'TRUNCATE,REFERENCES,TRIGGER') OR has_any_column_privilege(role_name,t.oid,'REFERENCES') THEN
        RAISE EXCEPTION 'unexpected author DDL-like table privilege: %',t.relname;
      END IF;
      IF role_name='wiki_author_login' AND
         (has_table_privilege(role_name,t.oid,'SELECT,INSERT,UPDATE,DELETE') OR has_any_column_privilege(role_name,t.oid,'SELECT,INSERT,UPDATE')) THEN
        RAISE EXCEPTION 'login must explicitly SET ROLE, not inherit direct table access';
      END IF;
      IF role_name='wiki_author' THEN
        IF has_any_column_privilege(role_name,t.oid,'INSERT') AND NOT (t.relname=ANY(body_tables) OR
          t.relname=ANY(ARRAY['source_record','document_node_identity','document_revision','document_revision_link_target',
            'document_revision_seal','relation','profile_node','profile_field']) OR starts_with(t.relname,'document_revision_text_')) THEN
          RAISE EXCEPTION 'unexpected author INSERT: %',t.relname;
        END IF;
        IF has_any_column_privilege(role_name,t.oid,'UPDATE') AND NOT (t.relname=ANY(body_tables) OR t.relname=ANY(domain_tables) OR
          t.relname=ANY(ARRAY['text_document','text_document_locale','text_atlas_additional_people','document_head','document_authority'])) THEN
          RAISE EXCEPTION 'unexpected author UPDATE: %',t.relname;
        END IF;
        IF has_table_privilege(role_name,t.oid,'DELETE') AND NOT (t.relname=ANY(body_tables) OR t.relname=ANY(ARRAY['profile_node','profile_field'])) THEN
          RAISE EXCEPTION 'unexpected author DELETE: %',t.relname;
        END IF;
        IF t.relname='source_record' AND EXISTS (
          SELECT FROM pg_attribute a WHERE a.attrelid=t.oid AND a.attnum>0 AND NOT a.attisdropped
            AND has_column_privilege(role_name,t.oid,a.attnum,'INSERT')
            AND a.attname NOT IN ('source_id','json_pointer','parent_pointer','ordinal','field_name','json_type')) THEN
          RAISE EXCEPTION 'source_record INSERT must be coordinate-only';
        END IF;
        IF NOT (t.relname=ANY(body_tables)) AND EXISTS (
          SELECT FROM pg_attribute a WHERE a.attrelid=t.oid AND a.attnum>0 AND NOT a.attisdropped
            AND has_column_privilege(role_name,t.oid,a.attnum,'UPDATE') AND NOT (
              (t.relname='text_document' AND a.attname='status') OR
              (t.relname='text_document_locale' AND a.attname IN ('title','summary','tense')) OR
              (t.relname='text_atlas_additional_people' AND a.attname IN ('national_state_id','national_state_id__type','state_ref')) OR
              (t.relname='document_head' AND a.attname IN ('revision_id','public_admission')) OR
              (t.relname='document_authority' AND a.attname='sequence') OR
              (t.relname='text_ailments_example' AND a.attname='symptom') OR
              (t.relname='text_culture_example' AND a.attname='transmission') OR
              (t.relname='text_economy_example' AND a.attname='exchange') OR
              (t.relname='text_goods_example' AND a.attname='supply') OR
              (t.relname='text_offices_example' AND a.attname='tier') OR
              (t.relname='text_overview_example' AND a.attname='consequence') OR
              (t.relname='text_people_and_machines_example' AND a.attname='dependency') OR
              (t.relname='text_places_example' AND a.attname='layer') OR
              (t.relname='text_regions_example' AND a.attname='opening_state') OR
              (t.relname='text_structures_example' AND a.attname='function') OR
              (t.relname='text_technology_example' AND a.attname='constraint_text'))) THEN
          RAISE EXCEPTION 'unexpected author UPDATE column: %',t.relname;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END $$;

\getenv author_password WIKI_AUTHOR_PASSWORD
\if :{?author_password}
SELECT length(:'author_password') > 0 AS password_present \gset
\else
\set password_present false
\endif
\if :password_present
ALTER ROLE wiki_author_login LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD :'author_password';
\unset author_password
\else
DO $$ BEGIN RAISE EXCEPTION 'WIKI_AUTHOR_PASSWORD is required and must not be empty'; END $$;
\endif
COMMIT;
