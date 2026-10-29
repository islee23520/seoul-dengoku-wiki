-- tables.sql — CREATE TABLE + CREATE INDEX (wiki, wiki_private)
-- 생성물: scripts/postgres-migration/ddl-convert.mjs (기계 변환, 수동 편집 금지)
-- source_sha256: 9e7bb6fc6b6638d16d020e4793c9042265a9e82a5363ba0bb462e5f4ecd7e0de
-- code_commit: 1558452c3165f8eef0e53463708eb840d4ccc442
-- 계약: apply.sql이 이 파일만 단일 트랜잭션으로 적용한다. 재실행은 비어 있는 새 DB에서만 유효하다(IF NOT EXISTS 없음 — 의도적 계약).

CREATE SCHEMA IF NOT EXISTS wiki;
ALTER SCHEMA wiki OWNER TO wiki_owner;
SET ROLE wiki_owner;
CREATE TABLE wiki."ability" (
  "person_id" text NOT NULL,
  "ability_ordinal" bigint NOT NULL CHECK(ability_ordinal BETWEEN 0 AND 7),
  "ability_id" text NOT NULL CHECK(ability_id IN ('leadership','strategy','negotiation','management','insight','learning','prowess','endurance')),
  "base_value" bigint NOT NULL CHECK(base_value BETWEEN 0 AND 20),
  "effective_value" bigint NOT NULL CHECK(effective_value BETWEEN 0 AND 100),
  "json_pointer" text NOT NULL CHECK(json_pointer ILIKE '/profiles/%/abilities/%'),
  PRIMARY KEY ("person_id", "ability_id"),
  UNIQUE(person_id,ability_ordinal)
);
CREATE TABLE wiki."admin_city_document_district" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "district_id" text NOT NULL,
  "parent_city_id" text NOT NULL,
  "district_name" text NOT NULL,
  "parent_city_name" text NOT NULL,
  "status" text NOT NULL,
  "district_code_effective_from" text NOT NULL,
  "has_establishment_source" bigint NOT NULL CHECK (has_establishment_source IN (0, 1)),
  PRIMARY KEY ("ordinal"),
  UNIQUE ("district_id")
);
CREATE TABLE wiki."admin_city_document_document" (
  "document_id" bigint CHECK (document_id = 1),
  "source_sha256" text NOT NULL CHECK (length(source_sha256) = 64),
  "document_sha256" text NOT NULL CHECK (length(document_sha256) = 64),
  "schema" text NOT NULL,
  "approved_boundary_sha256" text NOT NULL CHECK (length(approved_boundary_sha256) = 64),
  "effective_date" text NOT NULL,
  "proof_method" text NOT NULL,
  "actor" text NOT NULL CHECK (length(trim(actor)) > 0),
  "reason" text NOT NULL CHECK (length(trim(reason)) > 0),
  "receipt_sha256" text NOT NULL CHECK (length(receipt_sha256) = 64),
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."admin_city_document_establishment_source" (
  "district_ordinal" bigint,
  "url" text NOT NULL,
  "effective_date" text NOT NULL,
  PRIMARY KEY ("district_ordinal")
);
CREATE TABLE wiki."admin_city_document_establishment_text" (
  "district_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "exact_text" text NOT NULL,
  PRIMARY KEY ("district_ordinal", "ordinal")
);
CREATE TABLE wiki."admin_city_document_key" (
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "key" text NOT NULL,
  PRIMARY KEY ("object_path", "ordinal"),
  UNIQUE (object_path, key)
);
CREATE TABLE wiki."admin_city_document_leaf" (
  "district_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "leaf_id" text NOT NULL,
  PRIMARY KEY ("district_ordinal", "ordinal"),
  UNIQUE (leaf_id)
);
CREATE TABLE wiki."admin_city_document_mois_identity" (
  "district_ordinal" bigint,
  "release_url" text NOT NULL,
  "attachment_url" text NOT NULL,
  "zip_sha256" text NOT NULL CHECK (length(zip_sha256) = 64),
  "table_name" text NOT NULL,
  "table_sha256" text NOT NULL CHECK (length(table_sha256) = 64),
  "effective_date" text NOT NULL,
  "district_code10" text NOT NULL,
  "city_code10" text NOT NULL,
  PRIMARY KEY ("district_ordinal")
);
CREATE TABLE wiki."admin_city_document_municipal_source" (
  "district_ordinal" bigint,
  "url" text NOT NULL,
  "source_as_of_or_modified" text,
  "retrieved_on" text NOT NULL,
  "retrieved_text_sha256" text NOT NULL CHECK (length(retrieved_text_sha256) = 64),
  "assertion_form" text NOT NULL,
  PRIMARY KEY ("district_ordinal")
);
CREATE TABLE wiki."admin_city_document_municipal_text" (
  "district_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "exact_text" text NOT NULL,
  PRIMARY KEY ("district_ordinal", "ordinal")
);
CREATE TABLE wiki."admin_city_document_source_row" (
  "district_ordinal" bigint NOT NULL,
  "side" text NOT NULL CHECK (side IN ('district', 'city')),
  "source_row" bigint NOT NULL,
  "code" text NOT NULL,
  "province" text NOT NULL,
  "name" text NOT NULL,
  "dong" text NOT NULL,
  "created" text NOT NULL,
  "abolished" text NOT NULL,
  PRIMARY KEY ("district_ordinal", "side")
);
CREATE TABLE wiki."admin_city_document_vintage_note" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "note" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."admin_territorial_document_document" (
  "document_id" bigint CHECK (document_id = 1),
  "source_sha256" text NOT NULL CHECK (length(source_sha256) = 64),
  "document_sha256" text NOT NULL CHECK (length(document_sha256) = 64),
  "schema_name" text NOT NULL CHECK (schema_name = 'admin-territorial-catalog.v1'),
  "source_ref" text NOT NULL CHECK (source_ref = 'lore/regions/sources/selection.json#selected_boundary'),
  "source_sha256_field" text NOT NULL CHECK (
    source_sha256_field = 'c01ef44a0eb00978662ba7a6240ccb1da287fb52abd85104a1758969d391132f'
  ),
  "unit_count" bigint NOT NULL CHECK (unit_count = 1842),
  "actor" text NOT NULL CHECK (length(trim(actor)) > 0),
  "import_reason" text NOT NULL CHECK (length(trim(import_reason)) > 0),
  "receipt_sha256" text NOT NULL CHECK (length(receipt_sha256) = 64),
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."admin_territorial_document_key" (
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "key" text NOT NULL,
  PRIMARY KEY ("object_path", "ordinal")
);
CREATE TABLE wiki."admin_territorial_document_unit" (
  "ordinal" bigint CHECK (ordinal >= 0 AND ordinal < 1842),
  "admin_id" text NOT NULL CHECK (length(admin_id) = 10 AND admin_id ~ '^[0-9].*$'),
  "province_id" text NOT NULL CHECK (length(province_id) = 2 AND province_id ~ '^[0-9].*$'),
  "parent_id" text NOT NULL CHECK (length(parent_id) = 5 AND parent_id ~ '^[0-9].*$'),
  "province_name" text NOT NULL CHECK (length(province_name) > 0),
  "parent_name" text NOT NULL CHECK (length(parent_name) > 0),
  "name" text NOT NULL CHECK (length(name) > 0),
  PRIMARY KEY ("ordinal"),
  UNIQUE (admin_id)
);
CREATE TABLE wiki."article_route" (
  "route" text NOT NULL,
  "article_id" text NOT NULL,
  "source_path" text NOT NULL,
  "source_id" bigint,
  "derivation" text NOT NULL CHECK(derivation IN ('typed-envelope','computed-glossary','computed-index','unadmitted-source')),
  "derivation_json" text NOT NULL,
  PRIMARY KEY ("route")
);
CREATE TABLE wiki."atlas_identity_archive" (
  "kind" text NOT NULL CHECK(kind IN ('registry','candidates','values','gurps')),
  "logical_path" text NOT NULL,
  "sha256" text NOT NULL CHECK(length(sha256)=64),
  "bytes" bytea NOT NULL,
  "actor" text NOT NULL,
  "reason" text NOT NULL,
  PRIMARY KEY ("kind"),
  UNIQUE ("logical_path")
);
CREATE TABLE wiki."atlas_identity_binding" (
  "kind" text NOT NULL,
  "source_id" bigint,
  "sha256" text NOT NULL,
  PRIMARY KEY ("kind"),
  UNIQUE ("source_id")
);
CREATE TABLE wiki."atlas_identity_candidate" (
  "position" bigint CHECK(position>=0),
  "ordinal" bigint NOT NULL,
  "name" text NOT NULL,
  "stage" text NOT NULL,
  "state" text NOT NULL,
  "title" text NOT NULL,
  "locked" bigint NOT NULL CHECK(locked IN (0,1)),
  PRIMARY KEY ("position"),
  UNIQUE ("ordinal"),
  UNIQUE ("name")
);
CREATE TABLE wiki."atlas_identity_candidate_metadata" (
  "singleton" bigint CHECK(singleton=1),
  "schema_name" text NOT NULL,
  "input_sha256" text NOT NULL,
  "base_commit" text NOT NULL,
  "total_people" bigint NOT NULL,
  "existing_k_count" bigint NOT NULL,
  "candidate_count" bigint NOT NULL,
  "note_count" bigint NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."atlas_identity_existing_k" (
  "ordinal" bigint CHECK(ordinal>=0),
  "id" text NOT NULL,
  "name" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("id")
);
CREATE TABLE wiki."atlas_identity_note" (
  "ordinal" bigint CHECK(ordinal>=0),
  "type" text NOT NULL,
  "name" text NOT NULL,
  "detail" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."atlas_identity_registry_person" (
  "ordinal" bigint CHECK(ordinal>=0),
  "person_id" text NOT NULL,
  "has_aliases" bigint NOT NULL CHECK(has_aliases IN (0,1)),
  PRIMARY KEY ("ordinal"),
  UNIQUE ("person_id")
);
CREATE TABLE wiki."atlas_identity_route" (
  "ordinal" bigint CHECK(ordinal>=0),
  "person_id" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("person_id")
);
CREATE TABLE wiki."atlas_identity_seal" (
  "singleton" bigint CHECK(singleton=1),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."atlas_identity_values_metadata" (
  "singleton" bigint CHECK(singleton=1),
  "schema_name" text NOT NULL,
  "note" text NOT NULL,
  "person_count" bigint NOT NULL CHECK(person_count=1022),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."authoring_schema_all_of" (
  "logical_path" text NOT NULL,
  "node_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "child_id" bigint NOT NULL,
  PRIMARY KEY ("logical_path", "node_id", "ordinal")
);
CREATE TABLE wiki."authoring_schema_any_of" (
  "logical_path" text NOT NULL,
  "node_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "child_id" bigint NOT NULL,
  PRIMARY KEY ("logical_path", "node_id", "ordinal")
);
CREATE TABLE wiki."authoring_schema_const" (
  "logical_path" text NOT NULL,
  "node_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0) CHECK(ordinal=0),
  "value_kind" text NOT NULL CHECK(value_kind IN ('string','number','boolean','null')),
  "text_value" text,
  "number_value" double precision,
  "boolean_value" bigint CHECK(boolean_value IN (0,1)),
  PRIMARY KEY ("logical_path", "node_id", "ordinal"),
  CHECK((value_kind='string' AND text_value IS NOT NULL AND number_value IS NULL AND boolean_value IS NULL) OR (value_kind='number' AND text_value IS NULL AND number_value IS NOT NULL AND boolean_value IS NULL) OR (value_kind='boolean' AND text_value IS NULL AND number_value IS NULL AND boolean_value IS NOT NULL) OR (value_kind='null' AND text_value IS NULL AND number_value IS NULL AND boolean_value IS NULL))
);
CREATE TABLE wiki."authoring_schema_definition" (
  "logical_path" text NOT NULL,
  "node_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "name" text NOT NULL,
  "child_id" bigint NOT NULL,
  PRIMARY KEY ("logical_path", "node_id", "ordinal")
);
CREATE TABLE wiki."authoring_schema_enum" (
  "logical_path" text NOT NULL,
  "node_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value_kind" text NOT NULL CHECK(value_kind IN ('string','number','boolean','null')),
  "text_value" text,
  "number_value" double precision,
  "boolean_value" bigint CHECK(boolean_value IN (0,1)),
  PRIMARY KEY ("logical_path", "node_id", "ordinal"),
  CHECK((value_kind='string' AND text_value IS NOT NULL AND number_value IS NULL AND boolean_value IS NULL) OR (value_kind='number' AND text_value IS NULL AND number_value IS NOT NULL AND boolean_value IS NULL) OR (value_kind='boolean' AND text_value IS NULL AND number_value IS NULL AND boolean_value IS NOT NULL) OR (value_kind='null' AND text_value IS NULL AND number_value IS NULL AND boolean_value IS NULL))
);
CREATE TABLE wiki."authoring_schema_keyword_order" (
  "logical_path" text NOT NULL,
  "node_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "keyword" text NOT NULL CHECK(keyword IN ('$schema','$id','allOf','$ref','type','properties','const','pattern','minLength','additionalProperties','if','else','required','$defs','minItems','items','minimum','enum','oneOf','maximum','then','deprecated','description','patternProperties','not','anyOf','uniqueItems','title','maxItems','prefixItems','format','minProperties')),
  PRIMARY KEY ("logical_path", "node_id", "ordinal"),
  UNIQUE(logical_path,node_id,keyword)
);
CREATE TABLE wiki."authoring_schema_node" (
  "logical_path" text NOT NULL,
  "node_id" bigint NOT NULL CHECK(node_id>=0),
  "boolean_schema" bigint CHECK(boolean_schema IN (0,1)),
  "schema_uri" text,
  "schema_identifier" text,
  "reference" text,
  "title" text,
  "description" text,
  "pattern" text,
  "format" text,
  "min_length" bigint CHECK(min_length>=0),
  "min_items" bigint CHECK(min_items>=0),
  "max_items" bigint CHECK(max_items>=0),
  "min_properties" bigint CHECK(min_properties>=0),
  "minimum" double precision,
  "maximum" double precision,
  "unique_items" bigint CHECK(unique_items IN (0,1)),
  "deprecated" bigint CHECK(deprecated IN (0,1)),
  "type_is_array" bigint CHECK(type_is_array IN (0,1)),
  "items_schema" bigint,
  "additional_properties_schema" bigint,
  "if_schema" bigint,
  "then_schema" bigint,
  "else_schema" bigint,
  "not_schema" bigint,
  PRIMARY KEY ("logical_path", "node_id")
);
CREATE TABLE wiki."authoring_schema_one_of" (
  "logical_path" text NOT NULL,
  "node_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "child_id" bigint NOT NULL,
  PRIMARY KEY ("logical_path", "node_id", "ordinal")
);
CREATE TABLE wiki."authoring_schema_pattern_property" (
  "logical_path" text NOT NULL,
  "node_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "name" text NOT NULL,
  "child_id" bigint NOT NULL,
  PRIMARY KEY ("logical_path", "node_id", "ordinal")
);
CREATE TABLE wiki."authoring_schema_prefix_item" (
  "logical_path" text NOT NULL,
  "node_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "child_id" bigint NOT NULL,
  PRIMARY KEY ("logical_path", "node_id", "ordinal")
);
CREATE TABLE wiki."authoring_schema_property" (
  "logical_path" text NOT NULL,
  "node_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "name" text NOT NULL,
  "child_id" bigint NOT NULL,
  PRIMARY KEY ("logical_path", "node_id", "ordinal")
);
CREATE TABLE wiki."authoring_schema_receipt" (
  "logical_path" text NOT NULL,
  "source_sha256" text NOT NULL,
  "document_sha256" text NOT NULL,
  "actor" text NOT NULL,
  "reason" text NOT NULL,
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki."authoring_schema_required" (
  "logical_path" text NOT NULL,
  "node_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "name" text NOT NULL,
  PRIMARY KEY ("logical_path", "node_id", "ordinal")
);
CREATE TABLE wiki."authoring_schema_type" (
  "logical_path" text NOT NULL,
  "node_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "name" text NOT NULL CHECK(name IN ('object','array','string','number','integer','boolean','null')),
  PRIMARY KEY ("logical_path", "node_id", "ordinal")
);
CREATE TABLE wiki."body" (
  "person_id" text NOT NULL,
  "body_ordinal" bigint NOT NULL CHECK(body_ordinal BETWEEN 0 AND 5),
  "body_part_id" text NOT NULL CHECK(body_part_id IN ('left-arm','right-arm','left-leg','right-leg','head','torso')),
  "severity_presence" text NOT NULL CHECK(severity_presence IN ('missing','null','value')),
  "severity" text,
  "function_presence" text NOT NULL CHECK(function_presence IN ('missing','null','value')),
  "function_state" text,
  "json_pointer" text NOT NULL CHECK(json_pointer ~ '^/profiles/[0-9].*/health/bodyParts/[0-9].*$'),
  PRIMARY KEY ("person_id", "body_part_id"),
  UNIQUE(person_id,body_ordinal),
  CHECK((severity_presence='value' AND severity IS NOT NULL) OR (severity_presence IN ('missing','null') AND severity IS NULL)),
  CHECK((function_presence='value' AND function_state IS NOT NULL) OR (function_presence IN ('missing','null') AND function_state IS NULL))
);
CREATE TABLE wiki."boundary_comparison_document_bound" (
  "ordinal" bigint CHECK (ordinal >= 0 AND ordinal < 4),
  "value_text" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."boundary_comparison_document_crs_source" (
  "document_id" bigint CHECK (document_id = 1),
  "type" text NOT NULL,
  "crs_name" text NOT NULL,
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."boundary_comparison_document_district" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "name" text NOT NULL,
  "dong_count" bigint NOT NULL,
  "area_m2" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("name")
);
CREATE TABLE wiki."boundary_comparison_document_document" (
  "document_id" bigint CHECK (document_id = 1),
  "source_sha256" text NOT NULL CHECK (length(source_sha256) = 64),
  "document_sha256" text NOT NULL CHECK (length(document_sha256) = 64),
  "path" text NOT NULL,
  "sha256" text NOT NULL CHECK (length(sha256) = 64),
  "source_version" text NOT NULL,
  "publication_commit" text NOT NULL CHECK (length(publication_commit) = 40),
  "authority" text NOT NULL,
  "crs_measurement" text NOT NULL,
  "total_country_features" bigint NOT NULL,
  "seoul_features" bigint NOT NULL,
  "unique_adm_cd2" bigint NOT NULL,
  "districts" bigint NOT NULL,
  "city_area_m2" text NOT NULL,
  "sum_area_m2" text NOT NULL,
  "overlap_excess_m2" text NOT NULL,
  "kostat_only_m2" text NOT NULL,
  "candidate_only_m2" text NOT NULL,
  "symmetric_difference_m2" text NOT NULL,
  "actor" text NOT NULL CHECK (length(trim(actor)) > 0),
  "reason" text NOT NULL CHECK (length(trim(reason)) > 0),
  "receipt_sha256" text NOT NULL CHECK (length(receipt_sha256) = 64),
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."boundary_comparison_document_key" (
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "key" text NOT NULL,
  PRIMARY KEY ("object_path", "ordinal"),
  UNIQUE (object_path, key)
);
CREATE TABLE wiki."boundary_comparison_document_mismatch" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "id" text NOT NULL,
  "old_district" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("id")
);
CREATE TABLE wiki."boundary_comparison_document_mismatch_candidate" (
  "mismatch_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "district" text NOT NULL,
  PRIMARY KEY ("mismatch_ordinal", "ordinal")
);
CREATE TABLE wiki."boundary_comparison_document_string_item" (
  "list_name" text NOT NULL CHECK (list_name IN ('invalid_ids', 'empty_ids', 'graph_outside_candidate', 'seoul_names')),
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("list_name", "ordinal")
);
CREATE TABLE wiki."boundary_geometry_dong" (
  "feature_id" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "code" text NOT NULL,
  PRIMARY KEY ("feature_id", "ordinal")
);
CREATE TABLE wiki."boundary_geometry_feature" (
  "id" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "feature_type" text NOT NULL,
  "geometry_type" text NOT NULL CHECK(geometry_type IN ('Polygon','MultiPolygon')),
  "kind" text NOT NULL,
  "source_edition" text NOT NULL,
  "official_code" text,
  "official_name" text,
  "dong_id" text,
  "electoral_dong_id" text,
  "county_title_id" text,
  "gu_id" text,
  "name" text,
  PRIMARY KEY ("id"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki."boundary_geometry_gu" (
  "feature_id" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "gu_ref" text NOT NULL,
  PRIMARY KEY ("feature_id", "ordinal")
);
CREATE TABLE wiki."boundary_geometry_point" (
  "feature_id" text NOT NULL,
  "polygon_ordinal" bigint NOT NULL,
  "ring_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL,
  "longitude" double precision NOT NULL,
  "latitude" double precision NOT NULL,
  PRIMARY KEY ("feature_id", "polygon_ordinal", "ring_ordinal", "ordinal")
);
CREATE TABLE wiki."boundary_geometry_polygon" (
  "feature_id" text NOT NULL,
  "ordinal" bigint NOT NULL,
  PRIMARY KEY ("feature_id", "ordinal")
);
CREATE TABLE wiki."boundary_geometry_property" (
  "feature_id" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "name" text NOT NULL,
  PRIMARY KEY ("feature_id", "ordinal"),
  UNIQUE(feature_id,name)
);
CREATE TABLE wiki."boundary_geometry_ring" (
  "feature_id" text NOT NULL,
  "polygon_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL,
  PRIMARY KEY ("feature_id", "polygon_ordinal", "ordinal")
);
CREATE TABLE wiki."boundary_geometry_source" (
  "source_path" text NOT NULL,
  "sha256" text NOT NULL,
  "collection_type" text NOT NULL,
  PRIMARY KEY ("source_path")
);
CREATE TABLE wiki."build_metadata" (
  "key" text NOT NULL,
  "value" text NOT NULL,
  PRIMARY KEY ("key")
);
CREATE TABLE wiki."build_source_manifest" (
  "singleton" bigint CHECK(singleton=1),
  "source_sha256" text NOT NULL,
  "schema_version" bigint NOT NULL,
  "generator_version" text NOT NULL,
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."build_source_manifest_file" (
  "ordinal" bigint CHECK(ordinal>=0),
  "path" text NOT NULL,
  "sha256" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("path")
);
CREATE TABLE wiki."build_source_manifest_producer" (
  "ordinal" bigint CHECK(ordinal>=0),
  "name" text NOT NULL,
  "repository" text NOT NULL,
  "revision" text NOT NULL,
  "path" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("name")
);
CREATE TABLE wiki."candidate_roster_document_key" (
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "key" text NOT NULL,
  PRIMARY KEY ("object_path", "ordinal"),
  UNIQUE (object_path, key)
);
CREATE TABLE wiki."candidate_roster_document_livelihood_count" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "document_id" bigint NOT NULL,
  "livelihood_key" text NOT NULL,
  "count_integer" bigint NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("livelihood_key")
);
CREATE TABLE wiki."candidate_roster_document_person" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "document_id" bigint NOT NULL,
  "id" text NOT NULL,
  "source_uuid" text NOT NULL,
  "full_name" text NOT NULL,
  "surname" text NOT NULL,
  "given_name" text NOT NULL,
  "bongwan_present" bigint NOT NULL CHECK (bongwan_present = 1),
  "bongwan" text,
  "hangnyeol_present" bigint NOT NULL CHECK (hangnyeol_present = 1),
  "hangnyeol" text,
  "sex" text NOT NULL,
  "age" bigint NOT NULL,
  "origin_community" text NOT NULL,
  "language" text NOT NULL,
  "livelihood" text NOT NULL,
  "affiliation" text NOT NULL,
  "post" text NOT NULL,
  "conscription_history" text NOT NULL,
  "armament_access" text NOT NULL,
  "culture_key" text NOT NULL,
  "corridor_present" bigint NOT NULL CHECK (corridor_present = 1),
  "corridor" text,
  "personality" text NOT NULL,
  "personal_ambition" text NOT NULL,
  "fear" text NOT NULL,
  "negotiation_method" text NOT NULL,
  "core_relation" text NOT NULL,
  "trigger_event" text NOT NULL,
  "occupation_src" text NOT NULL,
  "military_src" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("id"),
  UNIQUE ("source_uuid"),
  CHECK (bongwan IS NULL OR length(bongwan) > 0),
  CHECK (hangnyeol IS NULL OR length(hangnyeol) > 0),
  CHECK (corridor IS NULL)
);
CREATE TABLE wiki."candidate_roster_document_provenance" (
  "document_id" bigint CHECK (document_id = 1),
  "dataset" text NOT NULL,
  "dataset_url" text NOT NULL,
  "local_path_note" text NOT NULL,
  "license" text NOT NULL,
  "revision" text NOT NULL,
  "row_identity" text NOT NULL,
  "transformation" text NOT NULL,
  "status" text NOT NULL,
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."candidate_roster_document_root" (
  "document_id" bigint CHECK (document_id = 1),
  "source_sha256" text NOT NULL CHECK (length(source_sha256) = 64),
  "document_sha256" text NOT NULL CHECK (length(document_sha256) = 64),
  "seed" bigint NOT NULL,
  "n" bigint NOT NULL,
  "parquet" text NOT NULL,
  "hangnyeol_on" bigint NOT NULL,
  "actor" text NOT NULL CHECK (length(trim(actor)) > 0),
  "reason" text NOT NULL CHECK (length(trim(reason)) > 0),
  "receipt_sha256" text NOT NULL CHECK (length(receipt_sha256) = 64),
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."candidate_roster_document_state_count" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "document_id" bigint NOT NULL,
  "state_key" text NOT NULL,
  "count_integer" bigint NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("state_key")
);
CREATE TABLE wiki."cast_backfill_document_import" (
  "document_id" bigint CHECK (document_id = 1),
  "source_sha256" text NOT NULL CHECK (length(source_sha256) = 64),
  "document_sha256" text NOT NULL CHECK (length(document_sha256) = 64),
  "row_sha256" text NOT NULL CHECK (length(row_sha256) = 64),
  "actor" text NOT NULL CHECK (length(trim(actor)) > 0),
  "reason" text NOT NULL CHECK (length(trim(reason)) > 0),
  "receipt_sha256" text NOT NULL CHECK (length(receipt_sha256) = 64),
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."cast_backfill_document_key" (
  "object_path" text NOT NULL CHECK (length(object_path) > 0),
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "key" text NOT NULL CHECK (length(key) > 0),
  PRIMARY KEY ("object_path", "ordinal")
);
CREATE TABLE wiki."cast_backfill_document_person" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "document_id" bigint NOT NULL,
  "성명" text NOT NULL CHECK (length("성명") > 0),
  "소속" text NOT NULL CHECK (length("소속") > 0),
  "직위" text NOT NULL CHECK (length("직위") > 0),
  "출신 공동체" text NOT NULL CHECK (length("출신 공동체") > 0),
  "언어" text NOT NULL CHECK (length("언어") > 0),
  "생업" text NOT NULL CHECK (length("생업") > 0),
  "징집 이력" text NOT NULL CHECK (length("징집 이력") > 0),
  "무장 접근" text NOT NULL CHECK (length("무장 접근") > 0),
  "source_file" text NOT NULL CHECK (length(source_file) > 0),
  "성명_value" text NOT NULL CHECK (length("성명_value") > 0),
  "성명_derived" bigint NOT NULL CHECK ("성명_derived" = 0),
  "성명_rule_present" bigint NOT NULL CHECK ("성명_rule_present" = 0),
  "성명_rule" text CHECK ("성명_rule" IS NULL),
  "소속_value" text NOT NULL CHECK (length("소속_value") > 0),
  "소속_derived" bigint NOT NULL CHECK ("소속_derived" = 0),
  "소속_rule_present" bigint NOT NULL CHECK ("소속_rule_present" = 0),
  "소속_rule" text CHECK ("소속_rule" IS NULL),
  "직위_value" text NOT NULL CHECK (length("직위_value") > 0),
  "직위_derived" bigint NOT NULL CHECK ("직위_derived" = 0),
  "직위_rule_present" bigint NOT NULL CHECK ("직위_rule_present" = 0),
  "직위_rule" text CHECK ("직위_rule" IS NULL),
  "성격_value" text,
  "성격_derived" bigint,
  "성격_rule_present" bigint,
  "성격_rule" text,
  "개인 야망_value" text,
  "개인 야망_derived" bigint,
  "개인 야망_rule_present" bigint,
  "개인 야망_rule" text,
  "공포_value" text,
  "공포_derived" bigint,
  "공포_rule_present" bigint,
  "공포_rule" text,
  "통치 방식_value" text,
  "통치 방식_derived" bigint,
  "통치 방식_rule_present" bigint,
  "통치 방식_rule" text,
  "핵심 관계_value" text,
  "핵심 관계_derived" bigint,
  "핵심 관계_rule_present" bigint,
  "핵심 관계_rule" text,
  "촉발 사건_value" text,
  "촉발 사건_derived" bigint,
  "촉발 사건_rule_present" bigint,
  "촉발 사건_rule" text,
  "플레이어 개입_value" text,
  "플레이어 개입_derived" bigint,
  "플레이어 개입_rule_present" bigint,
  "플레이어 개입_rule" text,
  "출신 공동체_value" text NOT NULL CHECK (length("출신 공동체_value") > 0),
  "출신 공동체_derived" bigint NOT NULL CHECK ("출신 공동체_derived" = 1),
  "출신 공동체_rule_present" bigint NOT NULL CHECK ("출신 공동체_rule_present" = 1),
  "출신 공동체_rule" text NOT NULL CHECK (length("출신 공동체_rule") > 0),
  "언어_value" text NOT NULL CHECK (length("언어_value") > 0),
  "언어_derived" bigint NOT NULL CHECK ("언어_derived" = 1),
  "언어_rule_present" bigint NOT NULL CHECK ("언어_rule_present" = 1),
  "언어_rule" text NOT NULL CHECK (length("언어_rule") > 0),
  "생업_value" text NOT NULL CHECK (length("생업_value") > 0),
  "생업_derived" bigint NOT NULL CHECK ("생업_derived" = 1),
  "생업_rule_present" bigint NOT NULL CHECK ("생업_rule_present" = 1),
  "생업_rule" text NOT NULL CHECK (length("생업_rule") > 0),
  "징집 이력_value" text NOT NULL CHECK (length("징집 이력_value") > 0),
  "징집 이력_derived" bigint NOT NULL CHECK ("징집 이력_derived" = 1),
  "징집 이력_rule_present" bigint NOT NULL CHECK ("징집 이력_rule_present" = 1),
  "징집 이력_rule" text NOT NULL CHECK (length("징집 이력_rule") > 0),
  "무장 접근_value" text NOT NULL CHECK (length("무장 접근_value") > 0),
  "무장 접근_derived" bigint NOT NULL CHECK ("무장 접근_derived" = 1),
  "무장 접근_rule_present" bigint NOT NULL CHECK ("무장 접근_rule_present" = 1),
  "무장 접근_rule" text NOT NULL CHECK (length("무장 접근_rule") > 0),
  PRIMARY KEY ("ordinal"),
  CHECK (("성격_value" IS NULL AND "성격_derived" IS NULL AND "성격_rule_present" IS NULL AND "성격_rule" IS NULL) OR (length("성격_value") > 0 AND "성격_derived" = 0 AND "성격_rule_present" = 0 AND "성격_rule" IS NULL)),
  CHECK (("개인 야망_value" IS NULL AND "개인 야망_derived" IS NULL AND "개인 야망_rule_present" IS NULL AND "개인 야망_rule" IS NULL) OR (length("개인 야망_value") > 0 AND "개인 야망_derived" = 0 AND "개인 야망_rule_present" = 0 AND "개인 야망_rule" IS NULL)),
  CHECK (("공포_value" IS NULL AND "공포_derived" IS NULL AND "공포_rule_present" IS NULL AND "공포_rule" IS NULL) OR (length("공포_value") > 0 AND "공포_derived" = 0 AND "공포_rule_present" = 0 AND "공포_rule" IS NULL)),
  CHECK (("통치 방식_value" IS NULL AND "통치 방식_derived" IS NULL AND "통치 방식_rule_present" IS NULL AND "통치 방식_rule" IS NULL) OR (length("통치 방식_value") > 0 AND "통치 방식_derived" = 0 AND "통치 방식_rule_present" = 0 AND "통치 방식_rule" IS NULL)),
  CHECK (("핵심 관계_value" IS NULL AND "핵심 관계_derived" IS NULL AND "핵심 관계_rule_present" IS NULL AND "핵심 관계_rule" IS NULL) OR (length("핵심 관계_value") > 0 AND "핵심 관계_derived" = 0 AND "핵심 관계_rule_present" = 0 AND "핵심 관계_rule" IS NULL)),
  CHECK (("촉발 사건_value" IS NULL AND "촉발 사건_derived" IS NULL AND "촉발 사건_rule_present" IS NULL AND "촉발 사건_rule" IS NULL) OR (length("촉발 사건_value") > 0 AND "촉발 사건_derived" = 0 AND "촉발 사건_rule_present" = 0 AND "촉발 사건_rule" IS NULL)),
  CHECK (("플레이어 개입_value" IS NULL AND "플레이어 개입_derived" IS NULL AND "플레이어 개입_rule_present" IS NULL AND "플레이어 개입_rule" IS NULL) OR (length("플레이어 개입_value") > 0 AND "플레이어 개입_derived" = 0 AND "플레이어 개입_rule_present" = 0 AND "플레이어 개입_rule" IS NULL)),
  CHECK ((
    "성격_value" IS NULL AND "개인 야망_value" IS NULL AND "공포_value" IS NULL AND "통치 방식_value" IS NULL AND "핵심 관계_value" IS NULL AND "촉발 사건_value" IS NULL AND "플레이어 개입_value" IS NULL
  ) OR (
    "성격_value" IS NOT NULL AND "개인 야망_value" IS NOT NULL AND "공포_value" IS NOT NULL AND "통치 방식_value" IS NOT NULL AND "핵심 관계_value" IS NOT NULL AND "촉발 사건_value" IS NOT NULL AND "플레이어 개입_value" IS NOT NULL
  )),
  CHECK ("성명" = "성명_value" AND "소속" = "소속_value" AND "직위" = "직위_value" AND "출신 공동체" = "출신 공동체_value" AND "언어" = "언어_value" AND "생업" = "생업_value" AND "징집 이력" = "징집 이력_value" AND "무장 접근" = "무장 접근_value")
);
CREATE TABLE wiki."cast_backfill_document_root" (
  "document_id" bigint CHECK (document_id = 1),
  "generated" text NOT NULL CHECK (length(generated) > 0),
  "count" bigint NOT NULL CHECK (count = 422),
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."catalog_category" (
  "ordinal" bigint CHECK(ordinal>=0),
  "id" text NOT NULL CHECK(length(id)>0),
  "label" text NOT NULL CHECK(length(label)>0),
  "summary" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("id")
);
CREATE TABLE wiki."catalog_category_required_kind" (
  "category_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "kind" text NOT NULL CHECK(kind IN ('heading','paragraph','list','table')),
  PRIMARY KEY ("category_ordinal", "ordinal")
);
CREATE TABLE wiki."catalog_metadata_document" (
  "logical_path" text NOT NULL CHECK(logical_path IN ('scripts/category-registry.json','scripts/official-seoul-lines.json','data/update-history.json')),
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64 AND source_sha256 !~ '^.*[^0-9a-f].*$'),
  "document_sha256" text NOT NULL CHECK(length(document_sha256)=64 AND document_sha256 !~ '^.*[^0-9a-f].*$'),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  "receipt_sha256" text NOT NULL CHECK(length(receipt_sha256)=64),
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki."catalog_metadata_key" (
  "logical_path" text NOT NULL,
  "object_kind" text NOT NULL CHECK(object_kind IN ('root','category','line','update')),
  "owner_ordinal" bigint NOT NULL CHECK(owner_ordinal>=0),
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  PRIMARY KEY ("logical_path", "object_kind", "owner_ordinal", "ordinal"),
  UNIQUE(logical_path,object_kind,owner_ordinal,key)
);
CREATE TABLE wiki."catalog_official_line" (
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "id" text NOT NULL CHECK(length(id)>0),
  "name" text NOT NULL,
  "color" text NOT NULL CHECK(length(color)=7 AND substr(color,1,1)='#' AND substr(color,2) !~ '^.*[^0-9a-fA-F].*$'),
  PRIMARY KEY ("id"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki."catalog_official_line_metadata" (
  "singleton" bigint CHECK(singleton=1),
  "schema" text NOT NULL CHECK(schema='seoul-official-line-style.v1'),
  "source" text NOT NULL,
  "captured_at" text NOT NULL,
  "note" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."catalog_official_station" (
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "name" text NOT NULL CHECK(length(name)>0),
  PRIMARY KEY ("name"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki."catalog_official_station_line" (
  "station_name" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "line_id" text NOT NULL,
  PRIMARY KEY ("station_name", "ordinal")
);
CREATE TABLE wiki."catalog_update" (
  "ordinal" bigint CHECK(ordinal>=0),
  "date" text NOT NULL CHECK(length(date)=10 AND date ~ '^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]$'),
  "sequence" bigint NOT NULL CHECK(sequence>0),
  "category" text NOT NULL,
  "status" text NOT NULL,
  "title" text NOT NULL,
  "source" text NOT NULL,
  "route" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."catalog_update_history" (
  "singleton" bigint CHECK(singleton=1),
  "schema" text NOT NULL CHECK(schema='seoul-wiki-update-history.v1'),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."census_event_identity" (
  "ordinal" bigint CHECK(ordinal>=0),
  "event_id" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("event_id")
);
CREATE TABLE wiki."census_event_import" (
  "singleton" bigint CHECK(singleton=1),
  "source_sha256" text NOT NULL,
  "event_ids_sha256" text NOT NULL,
  "schema_name" text NOT NULL,
  "visibility" text NOT NULL CHECK(visibility='private'),
  "description" text NOT NULL,
  "actor" text NOT NULL,
  "reason" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."clan" (
  "clan_id" text NOT NULL,
  "base_clan_id" text,
  "surname" text,
  "bongwan" text,
  "bongwan_hanja" text,
  "branch" text,
  "provenance" text,
  "hangnyeol_unconfirmed_reason" text,
  "source_label" text,
  "surname_hanja" text,
  "creative_rationale" text,
  "method_ref" text,
  "show_branches" bigint CHECK(show_branches IN (0,1)),
  PRIMARY KEY ("clan_id")
);
CREATE TABLE wiki."clan_catalog_document_branch" (
  "clan_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value_shape" text NOT NULL CHECK (value_shape = 'object'),
  PRIMARY KEY ("clan_ordinal", "ordinal")
);
CREATE TABLE wiki."clan_catalog_document_branch_key" (
  "clan_ordinal" bigint NOT NULL,
  "branch_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "key" text NOT NULL,
  PRIMARY KEY ("clan_ordinal", "branch_ordinal", "ordinal"),
  UNIQUE (clan_ordinal, branch_ordinal, key)
);
CREATE TABLE wiki."clan_catalog_document_clan" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "document_id" bigint NOT NULL,
  "id" text NOT NULL,
  "surname" text NOT NULL,
  "bongwan" text NOT NULL,
  "bongwan_hanja_present" bigint NOT NULL CHECK (bongwan_hanja_present IN (0, 1)),
  "bongwan_hanja" text,
  "surname_hanja_present" bigint NOT NULL CHECK (surname_hanja_present IN (0, 1)),
  "surname_hanja" text,
  "branch_present" bigint NOT NULL CHECK (branch_present IN (0, 1)),
  "branch" text,
  "provenance_present" bigint NOT NULL CHECK (provenance_present IN (0, 1)),
  "provenance" text,
  "sources_present" bigint NOT NULL CHECK (sources_present IN (0, 1)),
  "rows_present" bigint NOT NULL CHECK (rows_present IN (0, 1)),
  "show_branches_present" bigint NOT NULL CHECK (show_branches_present IN (0, 1)),
  "show_branches" bigint CHECK (show_branches IN (0, 1)),
  "hangnyeol_unconfirmed_reason_present" bigint NOT NULL CHECK (hangnyeol_unconfirmed_reason_present IN (0, 1)),
  "hangnyeol_unconfirmed_reason" text,
  "creative_rationale_present" bigint NOT NULL CHECK (creative_rationale_present IN (0, 1)),
  "creative_rationale" text,
  "method_ref_present" bigint NOT NULL CHECK (method_ref_present IN (0, 1)),
  "method_ref" text,
  "hangnyeol_present" bigint NOT NULL CHECK (hangnyeol_present IN (0, 1)),
  "hangnyeol" text,
  "source_present" bigint NOT NULL CHECK (source_present IN (0, 1)),
  "source" text,
  "branches_present" bigint NOT NULL CHECK (branches_present IN (0, 1)),
  PRIMARY KEY ("ordinal"),
  UNIQUE ("id"),
  CHECK (bongwan_hanja_present = 1 OR bongwan_hanja IS NULL),
  CHECK ((surname_hanja_present = 0 AND surname_hanja IS NULL) OR (surname_hanja_present = 1 AND surname_hanja IS NOT NULL)),
  CHECK ((branch_present = 0 AND branch IS NULL) OR (branch_present = 1 AND branch IS NOT NULL)),
  CHECK ((provenance_present = 0 AND provenance IS NULL) OR (provenance_present = 1 AND provenance IS NOT NULL)),
  CHECK (sources_present IN (0, 1)),
  CHECK (rows_present IN (0, 1)),
  CHECK ((show_branches_present = 0 AND show_branches IS NULL) OR (show_branches_present = 1 AND show_branches IS NOT NULL)),
  CHECK ((hangnyeol_unconfirmed_reason_present = 0 AND hangnyeol_unconfirmed_reason IS NULL) OR (hangnyeol_unconfirmed_reason_present = 1 AND hangnyeol_unconfirmed_reason IS NOT NULL)),
  CHECK ((creative_rationale_present = 0 AND creative_rationale IS NULL) OR (creative_rationale_present = 1 AND creative_rationale IS NOT NULL)),
  CHECK ((method_ref_present = 0 AND method_ref IS NULL) OR (method_ref_present = 1 AND method_ref IS NOT NULL)),
  CHECK (hangnyeol_present = 1 OR hangnyeol IS NULL),
  CHECK ((source_present = 0 AND source IS NULL) OR (source_present = 1 AND source IS NOT NULL)),
  CHECK (branches_present IN (0, 1))
);
CREATE TABLE wiki."clan_catalog_document_clan_key" (
  "clan_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "key" text NOT NULL,
  PRIMARY KEY ("clan_ordinal", "ordinal"),
  UNIQUE (clan_ordinal, key)
);
CREATE TABLE wiki."clan_catalog_document_clan_source" (
  "clan_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "source_id" text NOT NULL,
  PRIMARY KEY ("clan_ordinal", "ordinal")
);
CREATE TABLE wiki."clan_catalog_document_document" (
  "document_id" bigint CHECK (document_id = 1),
  "source_sha256" text NOT NULL,
  "id" text NOT NULL,
  "schema" bigint NOT NULL,
  "note" text NOT NULL,
  "actor" text NOT NULL CHECK (length(trim(actor)) > 0),
  "reason" text NOT NULL CHECK (length(trim(reason)) > 0),
  "receipt_sha256" text NOT NULL,
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."clan_catalog_document_row" (
  "clan_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "sesu" bigint NOT NULL,
  "hangnyeol" text NOT NULL,
  "hanja_present" bigint NOT NULL CHECK (hanja_present = 1),
  "hanja" text,
  "position" text NOT NULL,
  PRIMARY KEY ("clan_ordinal", "ordinal")
);
CREATE TABLE wiki."clan_catalog_document_row_key" (
  "clan_ordinal" bigint NOT NULL,
  "row_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "key" text NOT NULL,
  PRIMARY KEY ("clan_ordinal", "row_ordinal", "ordinal"),
  UNIQUE (clan_ordinal, row_ordinal, key)
);
CREATE TABLE wiki."clan_catalog_document_source" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "document_id" bigint NOT NULL,
  "id" text NOT NULL,
  "record_id_present" bigint NOT NULL CHECK (record_id_present IN (0, 1)),
  "record_id" text,
  "url" text NOT NULL,
  "accessed" text NOT NULL,
  "quote" text NOT NULL,
  "evidence" text NOT NULL,
  "live_check" text NOT NULL,
  "live_check_ref_present" bigint NOT NULL CHECK (live_check_ref_present IN (0, 1)),
  "live_check_ref" text,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("id"),
  CHECK ((record_id_present = 0 AND record_id IS NULL) OR (record_id_present = 1 AND record_id IS NOT NULL)),
  CHECK ((live_check_ref_present = 0 AND live_check_ref IS NULL) OR (live_check_ref_present = 1 AND live_check_ref IS NOT NULL))
);
CREATE TABLE wiki."clan_catalog_document_source_key" (
  "source_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "key" text NOT NULL,
  PRIMARY KEY ("source_ordinal", "ordinal"),
  UNIQUE (source_ordinal, key)
);
CREATE TABLE wiki."clan_crest_motif" (
  "clan" text NOT NULL,
  "surname" text NOT NULL,
  "bongwan" text NOT NULL,
  "motif" text NOT NULL,
  "reference" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY ("clan"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki."clan_hangnyeol_row" (
  "clan_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal >= 0),
  "sesu" bigint NOT NULL,
  "hangnyeol" text NOT NULL,
  "hanja" text,
  "position" text NOT NULL,
  PRIMARY KEY ("clan_id", "ordinal")
);
CREATE TABLE wiki."clan_seed_clan" (
  "ordinal" bigint CHECK(ordinal>=0),
  "document_id" bigint NOT NULL,
  "surname" text NOT NULL,
  "bongwan" text NOT NULL,
  "keep_rate_decimal" text NOT NULL CHECK(keep_rate_decimal IN ('0.45','0.4','0.35','0.3','0.25')),
  PRIMARY KEY ("ordinal"),
  UNIQUE(surname,bongwan)
);
CREATE TABLE wiki."clan_seed_document" (
  "document_id" bigint CHECK(document_id=1),
  "source_sha256" text NOT NULL,
  "id" text NOT NULL,
  "status" text NOT NULL,
  "approval_status" text NOT NULL,
  "note" text NOT NULL,
  "position" text NOT NULL,
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  "receipt_sha256" text NOT NULL,
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."clan_seed_syllable" (
  "clan_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "syllable" text NOT NULL CHECK(length(syllable)=1),
  PRIMARY KEY ("clan_ordinal", "ordinal")
);
CREATE TABLE wiki."clan_source" (
  "clan_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal >= 0),
  "source_ref" text NOT NULL,
  PRIMARY KEY ("clan_id", "ordinal")
);
CREATE TABLE wiki."context_court" (
  "court_id" text NOT NULL,
  "owner_person_id" text NOT NULL,
  "polity_id" text NOT NULL,
  "source_schema" text NOT NULL,
  "effective_year" bigint NOT NULL,
  "approval_ref" text NOT NULL,
  "catalog_status" text NOT NULL CHECK(catalog_status='current-catalog-input'),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("court_id")
);
CREATE TABLE wiki."context_court_approval" (
  "court_id" text NOT NULL,
  "approval_ref" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("court_id")
);
CREATE TABLE wiki."context_court_membership" (
  "person_id" text NOT NULL,
  "court_id" text NOT NULL,
  "approval_ref" text NOT NULL,
  "source_schema" text NOT NULL,
  "effective_year" bigint NOT NULL,
  "catalog_status" text NOT NULL CHECK(catalog_status='current-catalog-input'),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id")
);
CREATE TABLE wiki."context_direct_retainer" (
  "person_id" text NOT NULL,
  "liege_person_id" text NOT NULL,
  "court_id" text NOT NULL,
  "source_row" bigint NOT NULL CHECK(source_row>=0),
  "source_schema" text NOT NULL,
  "effective_year" bigint NOT NULL,
  "approval_ref" text NOT NULL,
  "catalog_status" text NOT NULL CHECK(catalog_status='current-catalog-input'),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id"),
  CHECK(person_id<>liege_person_id)
);
CREATE TABLE wiki."context_event_link" (
  "event_id" text NOT NULL,
  "person_id" text NOT NULL,
  "organization_id" text,
  "catalog_status" text NOT NULL CHECK(catalog_status='current-catalog-input'),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("event_id", "person_id")
);
CREATE TABLE wiki."context_feudal_binding" (
  "holding_id" text NOT NULL,
  "title_id" text NOT NULL,
  "liege_relationship_kind" text,
  "basis" text,
  "transition_set" text NOT NULL CHECK(transition_set='existingTitleBindings'),
  "transition_old_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("holding_id")
);
CREATE TABLE wiki."context_feudal_grant" (
  "grant_id" text NOT NULL,
  "name_ko" text NOT NULL,
  "name_en" text,
  "holder_person_id" text NOT NULL,
  "liege_person_id" text,
  "polity_id" text NOT NULL,
  "title_id" text NOT NULL,
  "geometry_source" text,
  "territorial_scale" text,
  "formal_title_rank" text,
  "transition_set" text NOT NULL CHECK(transition_set='grants'),
  "transition_old_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("grant_id")
);
CREATE TABLE wiki."context_feudal_grant_admin" (
  "grant_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "admin_unit_id" text NOT NULL,
  "admin_unit_name" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("grant_id", "ordinal")
);
CREATE TABLE wiki."context_feudal_grant_component" (
  "grant_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "admin_unit_id" text NOT NULL,
  "component_index" bigint NOT NULL CHECK(component_index>=0),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("grant_id", "ordinal")
);
CREATE TABLE wiki."context_feudal_jurisdiction" (
  "title_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "admin_unit_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("title_id", "ordinal")
);
CREATE TABLE wiki."context_feudal_title" (
  "title_id" text NOT NULL,
  "name" text NOT NULL,
  "rank" text NOT NULL CHECK(rank IN ('barony','county','duchy','kingdom','empire')),
  "holder_person_id" text NOT NULL,
  "polity_id" text NOT NULL,
  "parent_title_id" text,
  "geographic_title_id" text,
  "geographic_parent_title_id" text,
  "political_parent_title_id" text,
  "personal_liege_person_id" text,
  "kind" text,
  "direct_ownership" bigint CHECK(direct_ownership IN (0,1)),
  "basis" text NOT NULL,
  "transition_set" text NOT NULL CHECK(transition_set='titles'),
  "transition_old_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("title_id")
);
CREATE TABLE wiki."context_holding" (
  "holding_id" text NOT NULL,
  "name_ko" text NOT NULL,
  "name_en" text,
  "holder_person_id" text NOT NULL,
  "direct_liege_person_id" text,
  "polity_id" text NOT NULL,
  "territorial_scale" text,
  "formal_title_rank" text,
  "geometry_source" text,
  "designation_ko" text,
  "designation_en" text,
  "parent_geography" text,
  "whole_seoul_control" bigint CHECK(whole_seoul_control IN (0,1)),
  "current_validity" text NOT NULL CHECK(current_validity IN ('current_seoul_evidenced','current_seoul_nonowning','superseded_outside_seoul','unresolved')),
  "canon_status" text NOT NULL CHECK(canon_status IN ('current_seoul_evidenced','current_seoul_nonowning','superseded_outside_seoul','unresolved')),
  "authority_date" text,
  "authority_ref" text NOT NULL,
  "source_schema" text NOT NULL,
  "opening_year" bigint NOT NULL,
  "kind" text,
  "direct_ownership" bigint CHECK(direct_ownership IN (0,1)),
  "title_id" text,
  "liege_relationship_kind" text,
  "capability_package_id" text,
  "transition_set" text NOT NULL CHECK(transition_set='holdings'),
  "transition_old_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("holding_id"),
  CHECK(current_validity<>'current_seoul_nonowning' OR (kind='superior-jurisdiction' AND direct_ownership = 0 AND title_id IS NOT NULL AND capability_package_id IS NOT NULL))
);
CREATE TABLE wiki."context_holding_admin_ref" (
  "holding_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "admin_id" text NOT NULL,
  "admin_name" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("holding_id", "ordinal")
);
CREATE TABLE wiki."context_holding_geographic_scope" (
  "holding_id" text NOT NULL,
  "duchy_title_id" text NOT NULL,
  "gu_ref" text NOT NULL,
  "kingdom_geography_id" text NOT NULL,
  "empire_geography_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("holding_id")
);
CREATE TABLE wiki."context_holding_power" (
  "holding_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "power" text NOT NULL CHECK(power IN ('receive-holding-change-notice','lodge-nonbinding-registry-objection')),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("holding_id", "ordinal")
);
CREATE TABLE wiki."context_holding_reference" (
  "holding_id" text NOT NULL,
  "reference_kind" text NOT NULL CHECK(reference_kind IN ('station','facility','landmark')),
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "reference_id" text,
  "reference_name" text,
  "reference_source_path" text,
  "site_source_path" text,
  "reference_anchor" text,
  "station_id" text,
  "station_name" text,
  "station_district" text,
  "station_lat" double precision,
  "station_lon" double precision,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("holding_id", "reference_kind", "ordinal"),
  CHECK((station_lat IS NULL AND station_lon IS NULL) OR (station_lat BETWEEN -90 AND 90 AND station_lon BETWEEN -180 AND 180))
);
CREATE TABLE wiki."context_holding_scope_county" (
  "holding_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "county_title_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("holding_id", "ordinal")
);
CREATE TABLE wiki."context_issue" (
  "issue_id" text NOT NULL,
  "context_domain" text NOT NULL,
  "code" text NOT NULL,
  "severity" text NOT NULL CHECK(severity IN ('warning','error')),
  "holding_id" text,
  "person_id" text,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "message" text NOT NULL,
  PRIMARY KEY ("issue_id")
);
CREATE TABLE wiki."context_office_appointment" (
  "person_id" text NOT NULL,
  "polity_id" text NOT NULL,
  "position_ko" text,
  "position_en" text,
  "rank_ko" text,
  "rank_en" text,
  "common_tier" text NOT NULL CHECK(common_tier ~ '^T[1-5]$'),
  "status" text NOT NULL CHECK(status IN ('retained-office','unappointed','nonterritorial-political-office','nonowning-jurisdiction','existing-function')),
  "source_schema" text NOT NULL,
  "opening_year" bigint NOT NULL,
  "catalog_status" text NOT NULL CHECK(catalog_status='current-catalog-input'),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id"),
  CHECK(status<>'unappointed' OR (position_ko IS NULL AND position_en IS NULL AND rank_ko IS NULL AND rank_en IS NULL))
);
CREATE TABLE wiki."context_office_evidence" (
  "person_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "reference_path" text NOT NULL,
  "reference_pointer" text NOT NULL,
  "evidence_kind" text NOT NULL,
  "reference_source_id" bigint NOT NULL,
  "reference_json_pointer" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id", "ordinal")
);
CREATE TABLE wiki."context_office_history" (
  "person_id" text NOT NULL,
  "polity_id" text NOT NULL,
  "position_ko" text NOT NULL,
  "position_en" text,
  "rank_ko" text NOT NULL,
  "rank_en" text,
  "common_tier" text NOT NULL CHECK(common_tier ~ '^T[1-5]$'),
  "approval_ref" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id")
);
CREATE TABLE wiki."context_opening_disposition" (
  "person_id" text NOT NULL,
  "status" text NOT NULL,
  "approval_ref" text NOT NULL,
  "canon_status" text NOT NULL CHECK(canon_status='owner-approved'),
  "authority_date" text,
  "authority_ref" text NOT NULL,
  "source_schema" text NOT NULL,
  "opening_year" bigint NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id")
);
CREATE TABLE wiki."context_organization" (
  "organization_id" text NOT NULL,
  "name" text NOT NULL,
  "polity_id" text,
  "source_anchor" text NOT NULL,
  "catalog_status" text NOT NULL CHECK(catalog_status='current-catalog-input'),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("organization_id")
);
CREATE TABLE wiki."context_outside_retirement" (
  "set_name" text NOT NULL CHECK(set_name IN ('assignments','islandUnits')),
  "unit_id" text NOT NULL,
  "record_key" text NOT NULL,
  "original_value_sha256" text NOT NULL CHECK(length(original_value_sha256)=64),
  "status" text NOT NULL CHECK(status='retired-current'),
  "approval_ref" text NOT NULL,
  "approval_id" text NOT NULL,
  "original_source_id" bigint NOT NULL,
  "original_json_pointer" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("set_name", "unit_id"),
  UNIQUE ("record_key")
);
CREATE TABLE wiki."context_owner_liege" (
  "person_id" text NOT NULL,
  "liege_person_id" text NOT NULL,
  "relation_kind" text NOT NULL,
  "owner_term" text NOT NULL,
  "source_schema" text NOT NULL,
  "effective_year" bigint NOT NULL,
  "approval_ref" text NOT NULL,
  "catalog_status" text NOT NULL CHECK(catalog_status='current-catalog-input'),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id"),
  CHECK(person_id<>liege_person_id)
);
CREATE TABLE wiki."context_owner_liege_source_basis" (
  "ordinal" bigint CHECK(ordinal>=0),
  "source_ref_path" text NOT NULL,
  "source_ref_anchor" text NOT NULL,
  "source_quote" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."context_political_identity" (
  "identity_id" text NOT NULL,
  "kind" text NOT NULL CHECK(kind='nonterritorial-political-identity'),
  "rank" text NOT NULL,
  "holder_person_id" text NOT NULL,
  "polity_id" text NOT NULL,
  "political_parent_title_id" text,
  "direct_ownership" bigint NOT NULL CHECK(direct_ownership=0),
  "transition_set" text NOT NULL CHECK(transition_set='titles'),
  "transition_old_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("identity_id")
);
CREATE TABLE wiki."context_political_identity_liege" (
  "identity_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "historical_holding_id" text NOT NULL,
  "liege_person_id" text,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("identity_id", "ordinal")
);
CREATE TABLE wiki."context_polity" (
  "polity_id" text NOT NULL,
  "name_ko" text NOT NULL,
  "name_en" text,
  "sovereign_person_id" text NOT NULL,
  "territorial_scale" text,
  "formal_title" text NOT NULL,
  "formal_title_rank" text NOT NULL,
  "office" text NOT NULL,
  "authority_kind" text NOT NULL,
  "authority_name" text NOT NULL,
  "current_validity" text NOT NULL CHECK(current_validity IN ('superseded_outside_seoul','current_nonterritorial')),
  "source_schema" text NOT NULL,
  "opening_year" bigint NOT NULL,
  "direct_ownership" bigint CHECK(direct_ownership IN (0,1)),
  "political_title_id" text,
  "approval_id" text,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("polity_id")
);
CREATE TABLE wiki."context_prose_contact" (
  "person_id" text NOT NULL,
  "recipient_person_id" text NOT NULL,
  "contact_kind" text NOT NULL,
  "source_ref_path" text NOT NULL,
  "source_ref_anchor" text NOT NULL,
  "catalog_status" text NOT NULL CHECK(catalog_status='current-catalog-input'),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id", "recipient_person_id"),
  CHECK(person_id<>recipient_person_id)
);
CREATE TABLE wiki."context_relation_contract" (
  "contract_id" text NOT NULL,
  "court_id_contract" text NOT NULL,
  "source_ref_path" text NOT NULL,
  "source_ref_anchor" text NOT NULL,
  "source_schema" text NOT NULL,
  "effective_year" bigint NOT NULL,
  "approval_ref" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("contract_id")
);
CREATE TABLE wiki."context_retinue_duty" (
  "retinue_group_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "duty" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("retinue_group_id", "ordinal")
);
CREATE TABLE wiki."context_retinue_group" (
  "retinue_group_id" text NOT NULL,
  "name_ko" text NOT NULL,
  "name_en" text,
  "court_id" text NOT NULL,
  "liege_person_id" text NOT NULL,
  "person_count" bigint NOT NULL CHECK(person_count>=0),
  "personhood_review" text NOT NULL,
  "formal_title" text,
  "current_validity" text NOT NULL CHECK(current_validity IN ('superseded_outside_seoul','unresolved')),
  "source_schema" text NOT NULL,
  "opening_year" bigint NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("retinue_group_id")
);
CREATE TABLE wiki."context_retinue_holding" (
  "retinue_group_id" text NOT NULL,
  "holding_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("retinue_group_id", "ordinal")
);
CREATE TABLE wiki."context_retinue_technical_limit" (
  "retinue_group_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "technical_limit" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("retinue_group_id", "ordinal")
);
CREATE TABLE wiki."context_rights_approval" (
  "approval_id" text NOT NULL,
  "source_schema" text NOT NULL,
  "approval_ref" text NOT NULL,
  "receipt_sha256" text NOT NULL CHECK(length(receipt_sha256)=64),
  "message_ref" text,
  "proposal_sha256" text,
  "package_sha256" text,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("approval_id")
);
CREATE TABLE wiki."context_rights_original_source" (
  "approval_id" text NOT NULL,
  "role" text NOT NULL,
  "logical_path" text NOT NULL,
  "expected_sha256" text NOT NULL CHECK(length(expected_sha256)=64),
  "original_source_id" bigint NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("approval_id", "role")
);
CREATE TABLE wiki."context_rights_transition" (
  "set_name" text NOT NULL CHECK(set_name IN ('titles','grants','holdings','existingTitleBindings')),
  "old_id" text NOT NULL,
  "original_value_sha256" text NOT NULL CHECK(length(original_value_sha256)=64),
  "disposition" text NOT NULL CHECK(disposition IN ('retained-current','retired-current','seoul-jurisdiction-only','approved-nonowning')),
  "current_id" text,
  "approval_id" text NOT NULL,
  "source_ordinal" bigint NOT NULL CHECK(source_ordinal>=0),
  "original_source_id" bigint NOT NULL,
  "original_json_pointer" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("set_name", "old_id")
);
CREATE TABLE wiki."creative_name_document_key" (
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "key" text NOT NULL,
  PRIMARY KEY ("object_path", "ordinal"),
  UNIQUE (object_path, key)
);
CREATE TABLE wiki."creative_name_document_pattern" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "document_id" bigint NOT NULL,
  "kind" text NOT NULL,
  "id_present" bigint NOT NULL CHECK (id_present IN (0, 1)),
  "id" text,
  "old_present" bigint NOT NULL CHECK (old_present IN (0, 1)),
  "old" text,
  "pattern" text NOT NULL,
  "new" text NOT NULL,
  "anchor" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  CHECK ((id_present = 0 AND id IS NULL) OR (id_present = 1 AND id IS NOT NULL)),
  CHECK ((old_present = 0 AND old IS NULL) OR (old_present = 1 AND old IS NOT NULL))
);
CREATE TABLE wiki."creative_name_document_precedence" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "document_id" bigint NOT NULL,
  "value" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."creative_name_document_preservation" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "document_id" bigint NOT NULL,
  "value" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."creative_name_document_reference" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "document_id" bigint NOT NULL,
  "label" text NOT NULL,
  "url_present" bigint NOT NULL CHECK (url_present IN (0, 1)),
  "url" text,
  "path_present" bigint NOT NULL CHECK (path_present IN (0, 1)),
  "path" text,
  PRIMARY KEY ("ordinal"),
  CHECK ((url_present = 0 AND url IS NULL) OR (url_present = 1 AND url IS NOT NULL)),
  CHECK ((path_present = 0 AND path IS NULL) OR (path_present = 1 AND path IS NOT NULL))
);
CREATE TABLE wiki."creative_name_document_replacement" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "document_id" bigint NOT NULL,
  "kind" text NOT NULL,
  "id" text NOT NULL,
  "old" text NOT NULL,
  "new" text NOT NULL,
  "anchor" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."creative_name_document_retained" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "document_id" bigint NOT NULL,
  "kind" text NOT NULL,
  "id" text NOT NULL,
  "name" text NOT NULL,
  "anchor" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."creative_name_document_root" (
  "document_id" bigint CHECK (document_id = 1),
  "source_sha256" text NOT NULL CHECK (length(source_sha256) = 64),
  "document_sha256" text NOT NULL CHECK (length(document_sha256) = 64),
  "schema" text NOT NULL,
  "decided_on" text NOT NULL,
  "scope" text NOT NULL,
  "actor" text NOT NULL CHECK (length(trim(actor)) > 0),
  "reason" text NOT NULL CHECK (length(trim(reason)) > 0),
  "receipt_sha256" text NOT NULL CHECK (length(receipt_sha256) = 64),
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."current_engine_source" (
  "engine_source_id" text NOT NULL,
  "logical_path" text NOT NULL CHECK(logical_path ILIKE 'lore/editorial/profile-batches/%.json'),
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64 AND source_sha256 !~ '^.*[^0-9a-f].*$'),
  "source_byte_length" bigint NOT NULL CHECK(source_byte_length>=0),
  "projection_schema" text NOT NULL CHECK(projection_schema='public-character-profile.v1'),
  "projection_sha256" text NOT NULL CHECK(length(projection_sha256)=64 AND projection_sha256 !~ '^.*[^0-9a-f].*$'),
  "profile_count" bigint NOT NULL CHECK(profile_count>=0),
  PRIMARY KEY ("engine_source_id"),
  UNIQUE ("logical_path")
);
CREATE TABLE wiki."current_profile" (
  "person_id" text NOT NULL,
  "engine_source_id" text NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer ~ '^/profiles/[0-9].*$'),
  "source_ordinal" bigint NOT NULL CHECK(source_ordinal>=0),
  PRIMARY KEY ("person_id"),
  UNIQUE(engine_source_id,json_pointer),
  UNIQUE(engine_source_id,source_ordinal)
);
CREATE TABLE wiki."current_region_disposition" (
  "region_id" text NOT NULL,
  "status" text NOT NULL CHECK(status='unassigned'),
  "decision_ref" text NOT NULL,
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("region_id")
);
CREATE TABLE wiki."current_right_retirement" (
  "kind" text NOT NULL CHECK(kind IN ('title','grant')),
  "right_id" text NOT NULL,
  "decision_ref" text NOT NULL,
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("kind", "right_id")
);
CREATE TABLE wiki."data_source_current" (
  "source_path" text NOT NULL,
  "revision_id" text NOT NULL,
  "document_json" text NOT NULL,
  PRIMARY KEY ("source_path")
);
CREATE TABLE wiki."data_source_head" (
  "source_path" text NOT NULL,
  "revision_id" text NOT NULL,
  "archived_sha256" text NOT NULL,
  PRIMARY KEY ("source_path")
);
CREATE TABLE wiki."data_source_revision" (
  "revision_id" text NOT NULL,
  "source_path" text NOT NULL,
  "parent_revision" text,
  "semantic_sha256" text NOT NULL,
  "actor" text NOT NULL,
  "reason" text NOT NULL,
  "sequence" bigint NOT NULL,
  "recorded_at" text NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  "approval_ref" text NOT NULL,
  PRIMARY KEY ("revision_id")
);
CREATE TABLE wiki."desire_axis" (
  "axis_name" text NOT NULL,
  "axis_ordinal" bigint NOT NULL CHECK(axis_ordinal >= 0),
  "value_kind" text NOT NULL CHECK(value_kind IN ('integer','text')),
  PRIMARY KEY ("axis_name"),
  UNIQUE ("axis_ordinal"),
  UNIQUE(axis_name,value_kind)
);
CREATE TABLE wiki."diaspora_lineage" (
  "lineage_key" text NOT NULL,
  "current_person_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("lineage_key")
);
CREATE TABLE wiki."diaspora_lineage_document" (
  "document_id" bigint CHECK (document_id = 1),
  "source_sha256" text NOT NULL CHECK (length(source_sha256) = 64),
  "schema" text NOT NULL,
  "source_kind" text NOT NULL,
  "authorization" text NOT NULL,
  "collapse_date" text NOT NULL,
  "opening_year" bigint NOT NULL,
  "age_as_of" text NOT NULL,
  "generation_interval_years" bigint NOT NULL,
  "source_document" text NOT NULL,
  "actor" text NOT NULL CHECK (length(trim(actor)) > 0),
  "reason" text NOT NULL CHECK (length(trim(reason)) > 0),
  "receipt_sha256" text NOT NULL CHECK (length(receipt_sha256) = 64),
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."diaspora_lineage_document_lineage" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "document_id" bigint NOT NULL,
  "lineage_key" text NOT NULL,
  "current_person_id" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("lineage_key")
);
CREATE TABLE wiki."diaspora_lineage_event" (
  "lineage_ordinal" bigint NOT NULL,
  "member_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "year" bigint NOT NULL,
  "kind" text NOT NULL,
  "event_date" text,
  PRIMARY KEY ("lineage_ordinal", "member_ordinal", "ordinal"),
  CHECK (event_date IS NULL OR length(event_date) > 0)
);
CREATE TABLE wiki."diaspora_lineage_key_order" (
  "object_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "object_key" text NOT NULL,
  PRIMARY KEY ("object_pointer", "ordinal"),
  UNIQUE (object_pointer, object_key)
);
CREATE TABLE wiki."diaspora_lineage_member" (
  "lineage_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "member_key" text NOT NULL,
  "generation" bigint NOT NULL,
  "has_parent_roles" bigint NOT NULL CHECK (has_parent_roles IN (0, 1)),
  "person_id" text,
  "name_ko" text NOT NULL,
  "name_en" text NOT NULL,
  "birth_date" text NOT NULL,
  "timeline_bio_ko" text NOT NULL,
  "timeline_bio_en" text NOT NULL,
  "narrative_ko" text NOT NULL,
  "narrative_en" text NOT NULL,
  PRIMARY KEY ("lineage_ordinal", "ordinal"),
  UNIQUE (lineage_ordinal, member_key),
  CHECK ((has_parent_roles = 0 AND person_id IS NULL) OR has_parent_roles = 1),
  CHECK (person_id IS NULL OR length(person_id) > 0)
);
CREATE TABLE wiki."diaspora_lineage_parent_key" (
  "lineage_ordinal" bigint NOT NULL,
  "member_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "parent_key" text NOT NULL,
  PRIMARY KEY ("lineage_ordinal", "member_ordinal", "ordinal"),
  UNIQUE (lineage_ordinal, member_ordinal, parent_key)
);
CREATE TABLE wiki."diaspora_lineage_parent_role" (
  "lineage_ordinal" bigint NOT NULL,
  "member_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "parent_key" text NOT NULL,
  "role" text NOT NULL,
  PRIMARY KEY ("lineage_ordinal", "member_ordinal", "ordinal"),
  UNIQUE (lineage_ordinal, member_ordinal, parent_key)
);
CREATE TABLE wiki."diaspora_member" (
  "member_key" text NOT NULL,
  "lineage_key" text NOT NULL,
  "person_id" text,
  "generation" bigint NOT NULL,
  "name_ko" text NOT NULL,
  "name_en" text NOT NULL,
  "birth_date" text NOT NULL,
  "timeline_ko" text NOT NULL,
  "timeline_en" text NOT NULL,
  "narrative_ko" text NOT NULL,
  "narrative_en" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("member_key"),
  UNIQUE ("person_id")
);
CREATE TABLE wiki."diaspora_member_event" (
  "member_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "event_year" bigint NOT NULL,
  "event_kind" text NOT NULL,
  "event_date" text,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("member_key", "ordinal")
);
CREATE TABLE wiki."diaspora_member_parent" (
  "member_key" text NOT NULL,
  "parent_member_key" text,
  "parent_node_id" text,
  "parent_key" text NOT NULL,
  "parent_role" text,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("member_key", "parent_key"),
  CHECK((CASE WHEN parent_member_key IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN parent_node_id IS NOT NULL THEN 1 ELSE 0 END)=1)
);
CREATE TABLE wiki."disease" (
  "person_id" text NOT NULL,
  "disease_ordinal" bigint NOT NULL CHECK(disease_ordinal>=0),
  "disease_id_presence" text NOT NULL CHECK(disease_id_presence IN ('missing','null','value')),
  "disease_id" text,
  "progression_presence" text NOT NULL CHECK(progression_presence IN ('missing','null','value')),
  "progression" text,
  "json_pointer" text NOT NULL CHECK(json_pointer ~ '^/profiles/[0-9].*/health/diseases/[0-9].*$'),
  PRIMARY KEY ("person_id", "disease_ordinal"),
  CHECK((disease_id_presence='value' AND disease_id IS NOT NULL) OR (disease_id_presence IN ('missing','null') AND disease_id IS NULL)),
  CHECK((progression_presence='value' AND progression IS NOT NULL) OR (progression_presence IN ('missing','null') AND progression IS NULL))
);
CREATE TABLE wiki."document_authority" (
  "singleton" bigint CHECK(singleton=1),
  "version" bigint NOT NULL CHECK(version=2),
  "sequence" bigint NOT NULL CHECK(sequence>=0),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."document_head" (
  "source_id" bigint,
  "revision_id" text NOT NULL,
  "public_admission" text NOT NULL CHECK(public_admission='unrecorded'),
  PRIMARY KEY ("source_id"),
  UNIQUE ("revision_id")
);
CREATE TABLE wiki."document_key_order" (
  "source_id" bigint NOT NULL,
  "object_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  PRIMARY KEY ("source_id", "object_pointer", "ordinal"),
  UNIQUE(source_id,object_pointer,key)
);
CREATE TABLE wiki."document_node_identity" (
  "source_id" bigint NOT NULL,
  "node_id" text NOT NULL,
  "node_pointer" text NOT NULL,
  PRIMARY KEY ("source_id", "node_id"),
  UNIQUE(source_id,node_pointer)
);
CREATE TABLE wiki."document_publication_admission" (
  "source_id" bigint NOT NULL,
  "revision_id" text NOT NULL,
  "source_path" text NOT NULL,
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64),
  "semantic_sha256" text NOT NULL CHECK(length(semantic_sha256)=64),
  "classification" text NOT NULL CHECK(classification='current-reviewed'),
  "reason" text NOT NULL CHECK(reason='approved-exact-review'),
  "receipt_path" text NOT NULL CHECK(length(trim(receipt_path))>0),
  "receipt_sha256" text NOT NULL CHECK(length(receipt_sha256)=64),
  "approval_ref" text NOT NULL CHECK(length(trim(approval_ref))>0),
  "recorded_at" text NOT NULL,
  PRIMARY KEY ("source_id", "revision_id")
);
CREATE TABLE wiki."document_revision" (
  "revision_id" text NOT NULL CHECK(length(revision_id)=64),
  "source_id" bigint NOT NULL,
  "parent_revision" text,
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  "recorded_at" text NOT NULL,
  "semantic_sha256" text NOT NULL CHECK(length(semantic_sha256)=64),
  "algorithm" text NOT NULL CHECK(algorithm='typed-envelope-v1'),
  "sequence" bigint NOT NULL CHECK(sequence>=0),
  PRIMARY KEY ("revision_id"),
  UNIQUE(source_id,revision_id)
);
CREATE TABLE wiki."document_revision_link_target" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "locale" text NOT NULL CHECK(locale IN ('ko','en')),
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "node_id" text NOT NULL,
  "anchor" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id", "locale", "ordinal")
);
CREATE TABLE wiki."document_revision_seal" (
  "revision_id" text NOT NULL,
  PRIMARY KEY ("revision_id")
);
CREATE TABLE wiki."document_revision_text_affiliation" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id"),
  CHECK(json_pointer='/data/currentAffiliation')
);
CREATE TABLE wiki."document_revision_text_affiliation_hegemon" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "kind" text NOT NULL CHECK(kind IN ('state','union')),
  "state_id" text,
  "name" text NOT NULL,
  "center_region" text NOT NULL,
  "ai_position" text NOT NULL,
  "color" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id,ordinal),
  CHECK((kind='state' AND state_id IS NOT NULL) OR (kind='union' AND state_id IS NULL))
);
CREATE TABLE wiki."document_revision_text_affiliation_member" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "hegemon_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "state_id" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id,hegemon_ordinal,ordinal)
);
CREATE TABLE wiki."document_revision_text_affiliation_neutral" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "state_id" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id,ordinal)
);
CREATE TABLE wiki."document_revision_text_affiliation_state" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "state_id" text NOT NULL,
  "current_name" text NOT NULL,
  "base_kind" text NOT NULL CHECK(base_kind IN ('station','facility')),
  "station_id" text,
  "landmark_id" text,
  "base_name" text NOT NULL,
  "exclusive_districts" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id,ordinal),
  UNIQUE(revision_id,source_id,state_id),
  CHECK((base_kind='station' AND station_id IS NOT NULL AND landmark_id IS NULL) OR (base_kind='facility' AND landmark_id IS NOT NULL AND station_id IS NULL))
);
CREATE TABLE wiki."document_revision_text_ailments_example" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/symptom'),
  "symptom" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id")
);
CREATE TABLE wiki."document_revision_text_atlas" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "arcs__type" text CHECK(arcs__type IN ('array')),
  "change_ledger__type" text CHECK(change_ledger__type IN ('array')),
  "document__type" text CHECK(document__type IN ('object')),
  "document__change_ledger_entry__type" text CHECK(document__change_ledger_entry__type IN ('string')),
  "document__change_ledger_entry" text,
  "document__dependencies__type" text CHECK(document__dependencies__type IN ('array')),
  "document__display_name__type" text CHECK(document__display_name__type IN ('object')),
  "document__display_name__en__type" text CHECK(document__display_name__en__type IN ('string')),
  "document__display_name__en" text,
  "document__display_name__ko__type" text CHECK(document__display_name__ko__type IN ('string')),
  "document__display_name__ko" text,
  "document__document_status__type" text CHECK(document__document_status__type IN ('string')),
  "document__document_status" text,
  "document__id__type" text CHECK(document__id__type IN ('string')),
  "document__id" text,
  "document__last_verified_commit__type" text CHECK(document__last_verified_commit__type IN ('string')),
  "document__last_verified_commit" text,
  "document__owner__type" text CHECK(document__owner__type IN ('string')),
  "document__owner" text,
  "document__projection_targets__type" text CHECK(document__projection_targets__type IN ('array')),
  "document__related_ids__type" text CHECK(document__related_ids__type IN ('array')),
  "document__revision__type" text CHECK(document__revision__type IN ('string')),
  "document__revision" text,
  "document__source_anchors__type" text CHECK(document__source_anchors__type IN ('array')),
  "document__source_kind__type" text CHECK(document__source_kind__type IN ('string')),
  "document__source_kind" text,
  "document__support_reviewers__type" text CHECK(document__support_reviewers__type IN ('array')),
  "document__verification_state__type" text CHECK(document__verification_state__type IN ('string')),
  "document__verification_state" text,
  "hostile_groups__type" text CHECK(hostile_groups__type IN ('array')),
  "houses__type" text CHECK(houses__type IN ('array')),
  "humans__type" text CHECK(humans__type IN ('array')),
  "monster_batches__type" text CHECK(monster_batches__type IN ('array')),
  "monster_contents__type" text CHECK(monster_contents__type IN ('map')),
  "projection_pages__type" text CHECK(projection_pages__type IN ('map')),
  "relations__type" text CHECK(relations__type IN ('array')),
  "schema__type" text CHECK(schema__type IN ('string')),
  "schema" text,
  "states__type" text CHECK(states__type IN ('array')),
  "synthetics__type" text CHECK(synthetics__type IN ('array')),
  "theaters__type" text CHECK(theaters__type IN ('array')),
  "additional_people__type" text CHECK(additional_people__type IN ('map')),
  "writing_contract__type" text CHECK(writing_contract__type IN ('object')),
  "writing_contract__guide_register__type" text CHECK(writing_contract__guide_register__type IN ('string')),
  "writing_contract__guide_register" text,
  "writing_contract__honorifics__type" text CHECK(writing_contract__honorifics__type IN ('string')),
  "writing_contract__honorifics" text,
  "writing_contract__hostile_rule__type" text CHECK(writing_contract__hostile_rule__type IN ('string')),
  "writing_contract__hostile_rule" text,
  "writing_contract__multicultural_rule__type" text CHECK(writing_contract__multicultural_rule__type IN ('string')),
  "writing_contract__multicultural_rule" text,
  "writing_contract__narrative_register__type" text CHECK(writing_contract__narrative_register__type IN ('string')),
  "writing_contract__narrative_register" text,
  "writing_contract__source_kind_visible__type" text CHECK(writing_contract__source_kind_visible__type IN ('boolean')),
  "writing_contract__source_kind_visible" bigint,
  "writing_contract__synthetic_rule__type" text CHECK(writing_contract__synthetic_rule__type IN ('string')),
  "writing_contract__synthetic_rule" text,
  "writing_contract__viewpoint__type" text CHECK(writing_contract__viewpoint__type IN ('string')),
  "writing_contract__viewpoint" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer),
  CHECK(parent_key IS NULL)
);
CREATE TABLE wiki."document_revision_text_atlas_additional_people" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "character_id__type" text CHECK(character_id__type IN ('string')),
  "character_id" text,
  "name__type" text CHECK(name__type IN ('object')),
  "name__ko__type" text CHECK(name__ko__type IN ('string')),
  "name__ko" text,
  "name__en__type" text CHECK(name__en__type IN ('string')),
  "name__en" text,
  "detail_route__type" text CHECK(detail_route__type IN ('string')),
  "detail_route" text,
  "national_state_id__type" text CHECK(national_state_id__type IN ('string','null')),
  "national_state_id" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_arcs" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "acts__type" text CHECK(acts__type IN ('array')),
  "group_ids__type" text CHECK(group_ids__type IN ('array')),
  "house_ids__type" text CHECK(house_ids__type IN ('array')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "owner__type" text CHECK(owner__type IN ('string')),
  "owner" text,
  "source_anchors__type" text CHECK(source_anchors__type IN ('array')),
  "source_kind__type" text CHECK(source_kind__type IN ('string')),
  "source_kind" text,
  "synthetic_classes__type" text CHECK(synthetic_classes__type IN ('array')),
  "theater_ids__type" text CHECK(theater_ids__type IN ('array')),
  "title__type" text CHECK(title__type IN ('object')),
  "title__en__type" text CHECK(title__en__type IN ('string')),
  "title__en" text,
  "title__ko__type" text CHECK(title__ko__type IN ('string')),
  "title__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_arcs_acts" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "act__type" text CHECK(act__type IN ('number')),
  "act" double precision,
  "summary__type" text CHECK(summary__type IN ('object')),
  "summary__en__type" text CHECK(summary__en__type IN ('string')),
  "summary__en" text,
  "summary__ko__type" text CHECK(summary__ko__type IN ('string')),
  "summary__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_arcs_group_ids" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_arcs_house_ids" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_arcs_source_anchors" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_arcs_synthetic_classes" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_arcs_theater_ids" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_change_ledger" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "owner__type" text CHECK(owner__type IN ('string')),
  "owner" text,
  "summary__type" text CHECK(summary__type IN ('object')),
  "summary__en__type" text CHECK(summary__en__type IN ('string')),
  "summary__en" text,
  "summary__ko__type" text CHECK(summary__ko__type IN ('string')),
  "summary__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_document_dependencies" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_document_projection_targets" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_document_related_ids" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_document_source_anchors" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_hostile_groups" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "adaptation__type" text CHECK(adaptation__type IN ('object')),
  "adaptation__en__type" text CHECK(adaptation__en__type IN ('string')),
  "adaptation__en" text,
  "adaptation__ko__type" text CHECK(adaptation__ko__type IN ('string')),
  "adaptation__ko" text,
  "bestiary__type" text CHECK(bestiary__type IN ('object')),
  "bestiary__command_scope__type" text CHECK(bestiary__command_scope__type IN ('object')),
  "bestiary__command_scope__en__type" text CHECK(bestiary__command_scope__en__type IN ('string')),
  "bestiary__command_scope__en" text,
  "bestiary__command_scope__ko__type" text CHECK(bestiary__command_scope__ko__type IN ('string')),
  "bestiary__command_scope__ko" text,
  "bestiary__common_ecology__type" text CHECK(bestiary__common_ecology__type IN ('object')),
  "bestiary__common_ecology__en__type" text CHECK(bestiary__common_ecology__en__type IN ('string')),
  "bestiary__common_ecology__en" text,
  "bestiary__common_ecology__ko__type" text CHECK(bestiary__common_ecology__ko__type IN ('string')),
  "bestiary__common_ecology__ko" text,
  "bestiary__variant_relation__type" text CHECK(bestiary__variant_relation__type IN ('object')),
  "bestiary__variant_relation__en__type" text CHECK(bestiary__variant_relation__en__type IN ('string')),
  "bestiary__variant_relation__en" text,
  "bestiary__variant_relation__ko__type" text CHECK(bestiary__variant_relation__ko__type IN ('string')),
  "bestiary__variant_relation__ko" text,
  "category__type" text CHECK(category__type IN ('string')),
  "category" text,
  "combat_counterplay__type" text CHECK(combat_counterplay__type IN ('object')),
  "combat_counterplay__en__type" text CHECK(combat_counterplay__en__type IN ('string')),
  "combat_counterplay__en" text,
  "combat_counterplay__ko__type" text CHECK(combat_counterplay__ko__type IN ('string')),
  "combat_counterplay__ko" text,
  "display_name__type" text CHECK(display_name__type IN ('object')),
  "display_name__en__type" text CHECK(display_name__en__type IN ('string')),
  "display_name__en" text,
  "display_name__ko__type" text CHECK(display_name__ko__type IN ('string')),
  "display_name__ko" text,
  "dossier_prose__type" text CHECK(dossier_prose__type IN ('array')),
  "economy__type" text CHECK(economy__type IN ('object')),
  "economy__en__type" text CHECK(economy__en__type IN ('string')),
  "economy__en" text,
  "economy__ko__type" text CHECK(economy__ko__type IN ('string')),
  "economy__ko" text,
  "escalation__type" text CHECK(escalation__type IN ('object')),
  "escalation__en__type" text CHECK(escalation__en__type IN ('string')),
  "escalation__en" text,
  "escalation__ko__type" text CHECK(escalation__ko__type IN ('string')),
  "escalation__ko" text,
  "fictional_origin__type" text CHECK(fictional_origin__type IN ('object')),
  "fictional_origin__en__type" text CHECK(fictional_origin__en__type IN ('string')),
  "fictional_origin__en" text,
  "fictional_origin__ko__type" text CHECK(fictional_origin__ko__type IN ('string')),
  "fictional_origin__ko" text,
  "hierarchy__type" text CHECK(hierarchy__type IN ('object')),
  "hierarchy__en__type" text CHECK(hierarchy__en__type IN ('string')),
  "hierarchy__en" text,
  "hierarchy__ko__type" text CHECK(hierarchy__ko__type IN ('string')),
  "hierarchy__ko" text,
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "lifecycle__type" text CHECK(lifecycle__type IN ('object')),
  "lifecycle__en__type" text CHECK(lifecycle__en__type IN ('string')),
  "lifecycle__en" text,
  "lifecycle__ko__type" text CHECK(lifecycle__ko__type IN ('string')),
  "lifecycle__ko" text,
  "links__type" text CHECK(links__type IN ('object')),
  "links__corporations_successor_only__type" text CHECK(links__corporations_successor_only__type IN ('array')),
  "links__houses__type" text CHECK(links__houses__type IN ('array')),
  "links__states__type" text CHECK(links__states__type IN ('array')),
  "links__synthetics__type" text CHECK(links__synthetics__type IN ('array')),
  "links__theaters__type" text CHECK(links__theaters__type IN ('array')),
  "modern_anxiety__type" text CHECK(modern_anxiety__type IN ('object')),
  "modern_anxiety__en__type" text CHECK(modern_anxiety__en__type IN ('string')),
  "modern_anxiety__en" text,
  "modern_anxiety__ko__type" text CHECK(modern_anxiety__ko__type IN ('string')),
  "modern_anxiety__ko" text,
  "moral_cost__type" text CHECK(moral_cost__type IN ('object')),
  "moral_cost__en__type" text CHECK(moral_cost__en__type IN ('string')),
  "moral_cost__en" text,
  "moral_cost__ko__type" text CHECK(moral_cost__ko__type IN ('string')),
  "moral_cost__ko" text,
  "negotiation__type" text CHECK(negotiation__type IN ('object')),
  "negotiation__en__type" text CHECK(negotiation__en__type IN ('string')),
  "negotiation__en" text,
  "negotiation__ko__type" text CHECK(negotiation__ko__type IN ('string')),
  "negotiation__ko" text,
  "owner__type" text CHECK(owner__type IN ('string')),
  "owner" text,
  "projection_targets__type" text CHECK(projection_targets__type IN ('array')),
  "prose__type" text CHECK(prose__type IN ('array')),
  "revision__type" text CHECK(revision__type IN ('number')),
  "revision" double precision,
  "scenario_links__type" text CHECK(scenario_links__type IN ('array')),
  "scenario_outlines__type" text CHECK(scenario_outlines__type IN ('array')),
  "senses__type" text CHECK(senses__type IN ('object')),
  "senses__en__type" text CHECK(senses__en__type IN ('string')),
  "senses__en" text,
  "senses__ko__type" text CHECK(senses__ko__type IN ('string')),
  "senses__ko" text,
  "source_anchors__type" text CHECK(source_anchors__type IN ('array')),
  "source_kind__type" text CHECK(source_kind__type IN ('string')),
  "source_kind" text,
  "territory_migration__type" text CHECK(territory_migration__type IN ('object')),
  "territory_migration__en__type" text CHECK(territory_migration__en__type IN ('string')),
  "territory_migration__en" text,
  "territory_migration__ko__type" text CHECK(territory_migration__ko__type IN ('string')),
  "territory_migration__ko" text,
  "corridor__type" text CHECK(corridor__type IN ('object')),
  "corridor__ho__type" text CHECK(corridor__ho__type IN ('number')),
  "corridor__ho" double precision,
  "corridor__host_state__type" text CHECK(corridor__host_state__type IN ('string')),
  "corridor__host_state" text,
  "corridor__name__type" text CHECK(corridor__name__type IN ('object')),
  "corridor__name__en__type" text CHECK(corridor__name__en__type IN ('string')),
  "corridor__name__en" text,
  "corridor__name__ko__type" text CHECK(corridor__name__ko__type IN ('string')),
  "corridor__name__ko" text,
  "corridor__station__type" text CHECK(corridor__station__type IN ('object')),
  "corridor__station__en__type" text CHECK(corridor__station__en__type IN ('string')),
  "corridor__station__en" text,
  "corridor__station__ko__type" text CHECK(corridor__station__ko__type IN ('string')),
  "corridor__station__ko" text,
  "scenarios__type" text CHECK(scenarios__type IN ('array')),
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_hostile_groups_dossier_prose" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "anchor__type" text CHECK(anchor__type IN ('string')),
  "anchor" text,
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "text__type" text CHECK(text__type IN ('object')),
  "text__en__type" text CHECK(text__en__type IN ('string')),
  "text__en" text,
  "text__ko__type" text CHECK(text__ko__type IN ('string')),
  "text__ko" text,
  "depth__type" text CHECK(depth__type IN ('number')),
  "depth" double precision,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_hostile_groups_links_corporations_" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_hostile_groups_links_houses" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_hostile_groups_links_states" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_hostile_groups_links_synthetics" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_hostile_groups_links_theaters" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_hostile_groups_projection_targets" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_hostile_groups_prose" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "anchor__type" text CHECK(anchor__type IN ('string')),
  "anchor" text,
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "text__type" text CHECK(text__type IN ('object')),
  "text__en__type" text CHECK(text__en__type IN ('string')),
  "text__en" text,
  "text__ko__type" text CHECK(text__ko__type IN ('string')),
  "text__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_hostile_groups_scenario_links" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_hostile_groups_scenario_outlines" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "actors__type" text CHECK(actors__type IN ('array')),
  "choices__type" text CHECK(choices__type IN ('array')),
  "dossier_ref__type" text CHECK(dossier_ref__type IN ('string')),
  "dossier_ref" text,
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "mechanism__type" text CHECK(mechanism__type IN ('object')),
  "mechanism__en__type" text CHECK(mechanism__en__type IN ('string')),
  "mechanism__en" text,
  "mechanism__ko__type" text CHECK(mechanism__ko__type IN ('string')),
  "mechanism__ko" text,
  "moral_cost__type" text CHECK(moral_cost__type IN ('object')),
  "moral_cost__en__type" text CHECK(moral_cost__en__type IN ('string')),
  "moral_cost__en" text,
  "moral_cost__ko__type" text CHECK(moral_cost__ko__type IN ('string')),
  "moral_cost__ko" text,
  "outcomes__type" text CHECK(outcomes__type IN ('object')),
  "outcomes__en__type" text CHECK(outcomes__en__type IN ('string')),
  "outcomes__en" text,
  "outcomes__ko__type" text CHECK(outcomes__ko__type IN ('string')),
  "outcomes__ko" text,
  "stage__type" text CHECK(stage__type IN ('number')),
  "stage" double precision,
  "title__type" text CHECK(title__type IN ('object')),
  "title__en__type" text CHECK(title__en__type IN ('string')),
  "title__en" text,
  "title__ko__type" text CHECK(title__ko__type IN ('string')),
  "title__ko" text,
  "trigger__type" text CHECK(trigger__type IN ('object')),
  "trigger__en__type" text CHECK(trigger__en__type IN ('string')),
  "trigger__en" text,
  "trigger__ko__type" text CHECK(trigger__ko__type IN ('string')),
  "trigger__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_hostile_groups_scenario_outlines_a" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_hostile_groups_scenario_outlines_c" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_hostile_groups_scenarios" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "summary__type" text CHECK(summary__type IN ('object')),
  "summary__en__type" text CHECK(summary__en__type IN ('string')),
  "summary__en" text,
  "summary__ko__type" text CHECK(summary__ko__type IN ('string')),
  "summary__ko" text,
  "title__type" text CHECK(title__type IN ('object')),
  "title__en__type" text CHECK(title__en__type IN ('string')),
  "title__en" text,
  "title__ko__type" text CHECK(title__ko__type IN ('string')),
  "title__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_hostile_groups_source_anchors" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_houses" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "ai_stewardship__type" text CHECK(ai_stewardship__type IN ('object')),
  "ai_stewardship__accountable_human__type" text CHECK(ai_stewardship__accountable_human__type IN ('object')),
  "ai_stewardship__accountable_human__en__type" text CHECK(ai_stewardship__accountable_human__en__type IN ('string')),
  "ai_stewardship__accountable_human__en" text,
  "ai_stewardship__accountable_human__ko__type" text CHECK(ai_stewardship__accountable_human__ko__type IN ('string')),
  "ai_stewardship__accountable_human__ko" text,
  "ai_stewardship__authorized_functions__type" text CHECK(ai_stewardship__authorized_functions__type IN ('array')),
  "ai_stewardship__dual_key_shutdown__type" text CHECK(ai_stewardship__dual_key_shutdown__type IN ('boolean')),
  "ai_stewardship__dual_key_shutdown" bigint,
  "ai_stewardship__human_veto_required__type" text CHECK(ai_stewardship__human_veto_required__type IN ('boolean')),
  "ai_stewardship__human_veto_required" bigint,
  "ai_stewardship__prohibited_functions__type" text CHECK(ai_stewardship__prohibited_functions__type IN ('array')),
  "ai_stewardship__system_ids__type" text CHECK(ai_stewardship__system_ids__type IN ('array')),
  "arcs__type" text CHECK(arcs__type IN ('array')),
  "charter__type" text CHECK(charter__type IN ('object')),
  "charter__forbidden_powers__type" text CHECK(charter__forbidden_powers__type IN ('array')),
  "charter__mandate_domains__type" text CHECK(charter__mandate_domains__type IN ('array')),
  "charter__public_mission__type" text CHECK(charter__public_mission__type IN ('object')),
  "charter__public_mission__en__type" text CHECK(charter__public_mission__en__type IN ('string')),
  "charter__public_mission__en" text,
  "charter__public_mission__ko__type" text CHECK(charter__public_mission__ko__type IN ('string')),
  "charter__public_mission__ko" text,
  "display_name__type" text CHECK(display_name__type IN ('object')),
  "display_name__en__type" text CHECK(display_name__en__type IN ('string')),
  "display_name__en" text,
  "display_name__ko__type" text CHECK(display_name__ko__type IN ('string')),
  "display_name__ko" text,
  "exclusive_state_ids__type" text CHECK(exclusive_state_ids__type IN ('array')),
  "house_class__type" text CHECK(house_class__type IN ('string')),
  "house_class" text,
  "house_kind__type" text CHECK(house_kind__type IN ('string')),
  "house_kind" text,
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "membership__type" text CHECK(membership__type IN ('object')),
  "membership__classes__type" text CHECK(membership__classes__type IN ('array')),
  "membership__dual_membership_policy__type" text CHECK(membership__dual_membership_policy__type IN ('string')),
  "membership__dual_membership_policy" text,
  "membership__entry_routes__type" text CHECK(membership__entry_routes__type IN ('array')),
  "membership__steward__type" text CHECK(membership__steward__type IN ('object')),
  "membership__steward__en__type" text CHECK(membership__steward__en__type IN ('string')),
  "membership__steward__en" text,
  "membership__steward__ko__type" text CHECK(membership__steward__ko__type IN ('string')),
  "membership__steward__ko" text,
  "obligations__type" text CHECK(obligations__type IN ('array')),
  "owner__type" text CHECK(owner__type IN ('string')),
  "owner" text,
  "projection_targets__type" text CHECK(projection_targets__type IN ('array')),
  "prose__type" text CHECK(prose__type IN ('array')),
  "protected_guests__type" text CHECK(protected_guests__type IN ('array')),
  "regency__type" text CHECK(regency__type IN ('object')),
  "regency__active__type" text CHECK(regency__active__type IN ('boolean')),
  "regency__active" bigint,
  "regency__triad__type" text CHECK(regency__triad__type IN ('array')),
  "revision__type" text CHECK(revision__type IN ('number')),
  "revision" double precision,
  "source_anchors__type" text CHECK(source_anchors__type IN ('array')),
  "source_kind__type" text CHECK(source_kind__type IN ('string')),
  "source_kind" text,
  "states__type" text CHECK(states__type IN ('array')),
  "status__type" text CHECK(status__type IN ('string')),
  "status" text,
  "succession__type" text CHECK(succession__type IN ('object')),
  "succession__caretaker_triad__type" text CHECK(succession__caretaker_triad__type IN ('array')),
  "succession__designated__type" text CHECK(succession__designated__type IN ('object')),
  "succession__designated__en__type" text CHECK(succession__designated__en__type IN ('string')),
  "succession__designated__en" text,
  "succession__designated__ko__type" text CHECK(succession__designated__ko__type IN ('string')),
  "succession__designated__ko" text,
  "succession__state__type" text CHECK(succession__state__type IN ('string')),
  "succession__state" text,
  "succession__trigger_events__type" text CHECK(succession__trigger_events__type IN ('array')),
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_houses_ai_stewardship_authorized_f" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_houses_ai_stewardship_prohibited_f" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_houses_ai_stewardship_system_ids" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_houses_arcs" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "act__type" text CHECK(act__type IN ('number')),
  "act" double precision,
  "summary__type" text CHECK(summary__type IN ('object')),
  "summary__en__type" text CHECK(summary__en__type IN ('string')),
  "summary__en" text,
  "summary__ko__type" text CHECK(summary__ko__type IN ('string')),
  "summary__ko" text,
  "title__type" text CHECK(title__type IN ('object')),
  "title__en__type" text CHECK(title__en__type IN ('string')),
  "title__en" text,
  "title__ko__type" text CHECK(title__ko__type IN ('string')),
  "title__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_houses_charter_forbidden_powers" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_houses_charter_mandate_domains" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_houses_membership_classes" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_houses_membership_entry_routes" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_houses_obligations" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "summary__type" text CHECK(summary__type IN ('object')),
  "summary__en__type" text CHECK(summary__en__type IN ('string')),
  "summary__en" text,
  "summary__ko__type" text CHECK(summary__ko__type IN ('string')),
  "summary__ko" text,
  "to__value__type" text CHECK(to__value__type IN ('string')),
  "to__value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_houses_projection_targets" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_houses_prose" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "anchor__type" text CHECK(anchor__type IN ('string')),
  "anchor" text,
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "text__type" text CHECK(text__type IN ('object')),
  "text__en__type" text CHECK(text__en__type IN ('string')),
  "text__en" text,
  "text__ko__type" text CHECK(text__ko__type IN ('string')),
  "text__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_houses_protected_guests" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "terms__type" text CHECK(terms__type IN ('object')),
  "terms__en__type" text CHECK(terms__en__type IN ('string')),
  "terms__en" text,
  "terms__ko__type" text CHECK(terms__ko__type IN ('string')),
  "terms__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_houses_regency_triad" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_houses_source_anchors" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_houses_states" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_houses_succession_caretaker_triad" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_houses_succession_trigger_events" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_humans" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "name__type" text CHECK(name__type IN ('object')),
  "name__en__type" text CHECK(name__en__type IN ('string')),
  "name__en" text,
  "name__ko__type" text CHECK(name__ko__type IN ('string')),
  "name__ko" text,
  "role__type" text CHECK(role__type IN ('object')),
  "role__en__type" text CHECK(role__en__type IN ('string')),
  "role__en" text,
  "role__ko__type" text CHECK(role__ko__type IN ('string')),
  "role__ko" text,
  "source_anchor__type" text CHECK(source_anchor__type IN ('string')),
  "source_anchor" text,
  "stage__type" text CHECK(stage__type IN ('string')),
  "stage" text,
  "state_id__type" text CHECK(state_id__type IN ('string')),
  "state_id" text,
  "state_name__type" text CHECK(state_name__type IN ('object')),
  "state_name__en__type" text CHECK(state_name__en__type IN ('string')),
  "state_name__en" text,
  "state_name__ko__type" text CHECK(state_name__ko__type IN ('string')),
  "state_name__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_monster_batches" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "entry_ids__type" text CHECK(entry_ids__type IN ('array')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "owner__type" text CHECK(owner__type IN ('string')),
  "owner" text,
  "projection_targets__type" text CHECK(projection_targets__type IN ('array')),
  "source_anchors__type" text CHECK(source_anchors__type IN ('array')),
  "source_kind__type" text CHECK(source_kind__type IN ('string')),
  "source_kind" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_monster_batches_entry_ids" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_monster_batches_source_anchors" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_monster_contents" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "entries__type" text CHECK(entries__type IN ('array')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "owner__type" text CHECK(owner__type IN ('string')),
  "owner" text,
  "source_anchors__type" text CHECK(source_anchors__type IN ('array')),
  "source_kind__type" text CHECK(source_kind__type IN ('string')),
  "source_kind" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_monster_contents_entries" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "bestiary__type" text CHECK(bestiary__type IN ('object')),
  "bestiary__battlefield_role__type" text CHECK(bestiary__battlefield_role__type IN ('object')),
  "bestiary__battlefield_role__en__type" text CHECK(bestiary__battlefield_role__en__type IN ('string')),
  "bestiary__battlefield_role__en" text,
  "bestiary__battlefield_role__ko__type" text CHECK(bestiary__battlefield_role__ko__type IN ('string')),
  "bestiary__battlefield_role__ko" text,
  "bestiary__formation__type" text CHECK(bestiary__formation__type IN ('string')),
  "bestiary__formation" text,
  "bestiary__kind__type" text CHECK(bestiary__kind__type IN ('string')),
  "bestiary__kind" text,
  "bestiary__scope_note__type" text CHECK(bestiary__scope_note__type IN ('object')),
  "bestiary__scope_note__en__type" text CHECK(bestiary__scope_note__en__type IN ('string')),
  "bestiary__scope_note__en" text,
  "bestiary__scope_note__ko__type" text CHECK(bestiary__scope_note__ko__type IN ('string')),
  "bestiary__scope_note__ko" text,
  "display_name__type" text CHECK(display_name__type IN ('object')),
  "display_name__en__type" text CHECK(display_name__en__type IN ('string')),
  "display_name__en" text,
  "display_name__ko__type" text CHECK(display_name__ko__type IN ('string')),
  "display_name__ko" text,
  "group_id__type" text CHECK(group_id__type IN ('string')),
  "group_id" text,
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "links__type" text CHECK(links__type IN ('object')),
  "links__scenarios__type" text CHECK(links__scenarios__type IN ('array')),
  "links__states__type" text CHECK(links__states__type IN ('array')),
  "links__houses__type" text CHECK(links__houses__type IN ('array')),
  "links__synthetics__type" text CHECK(links__synthetics__type IN ('array')),
  "links__theaters__type" text CHECK(links__theaters__type IN ('array')),
  "prose__type" text CHECK(prose__type IN ('array')),
  "role_class__type" text CHECK(role_class__type IN ('object')),
  "role_class__en__type" text CHECK(role_class__en__type IN ('string')),
  "role_class__en" text,
  "role_class__ko__type" text CHECK(role_class__ko__type IN ('string')),
  "role_class__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_monster_contents_entries_links_hou" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_monster_contents_entries_links_sce" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_monster_contents_entries_links_sta" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_monster_contents_entries_links_syn" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_monster_contents_entries_links_the" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_monster_contents_entries_prose" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "anchor__type" text CHECK(anchor__type IN ('string')),
  "anchor" text,
  "depth__type" text CHECK(depth__type IN ('number')),
  "depth" double precision,
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "text__type" text CHECK(text__type IN ('object')),
  "text__en__type" text CHECK(text__en__type IN ('string')),
  "text__en" text,
  "text__ko__type" text CHECK(text__ko__type IN ('string')),
  "text__ko" text,
  "items__type" text CHECK(items__type IN ('array')),
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_monster_contents_entries_prose_ite" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_monster_contents_source_anchors" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_projection_pages" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "intro__type" text CHECK(intro__type IN ('object')),
  "intro__en__type" text CHECK(intro__en__type IN ('string')),
  "intro__en" text,
  "intro__ko__type" text CHECK(intro__ko__type IN ('string')),
  "intro__ko" text,
  "summary__type" text CHECK(summary__type IN ('object')),
  "summary__en__type" text CHECK(summary__en__type IN ('string')),
  "summary__en" text,
  "summary__ko__type" text CHECK(summary__ko__type IN ('string')),
  "summary__ko" text,
  "title__type" text CHECK(title__type IN ('object')),
  "title__en__type" text CHECK(title__en__type IN ('string')),
  "title__en" text,
  "title__ko__type" text CHECK(title__ko__type IN ('string')),
  "title__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_relations" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "from__value__type" text CHECK(from__value__type IN ('string')),
  "from__value" text,
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "reason__type" text CHECK(reason__type IN ('object')),
  "reason__en__type" text CHECK(reason__en__type IN ('string')),
  "reason__en" text,
  "reason__ko__type" text CHECK(reason__ko__type IN ('string')),
  "reason__ko" text,
  "to__value__type" text CHECK(to__value__type IN ('string')),
  "to__value" text,
  "from_label__type" text CHECK(from_label__type IN ('object')),
  "from_label__en__type" text CHECK(from_label__en__type IN ('string')),
  "from_label__en" text,
  "from_label__ko__type" text CHECK(from_label__ko__type IN ('string')),
  "from_label__ko" text,
  "to_label__type" text CHECK(to_label__type IN ('object')),
  "to_label__en__type" text CHECK(to_label__en__type IN ('string')),
  "to_label__en" text,
  "to_label__ko__type" text CHECK(to_label__ko__type IN ('string')),
  "to_label__ko" text,
  "endpoint_display__type" text CHECK(endpoint_display__type IN ('object','null')),
  "endpoint_display__from__type" text CHECK(endpoint_display__from__type IN ('object','null')),
  "endpoint_display__from__en__type" text CHECK(endpoint_display__from__en__type IN ('string','null')),
  "endpoint_display__from__en" text,
  "endpoint_display__from__ko__type" text CHECK(endpoint_display__from__ko__type IN ('string','null')),
  "endpoint_display__from__ko" text,
  "endpoint_display__to__type" text CHECK(endpoint_display__to__type IN ('object','null')),
  "endpoint_display__to__en__type" text CHECK(endpoint_display__to__en__type IN ('string','null')),
  "endpoint_display__to__en" text,
  "endpoint_display__to__ko__type" text CHECK(endpoint_display__to__ko__type IN ('string','null')),
  "endpoint_display__to__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_states" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "capital_station__type" text CHECK(capital_station__type IN ('object')),
  "capital_station__en__type" text CHECK(capital_station__en__type IN ('string')),
  "capital_station__en" text,
  "capital_station__ko__type" text CHECK(capital_station__ko__type IN ('string')),
  "capital_station__ko" text,
  "corridors__type" text CHECK(corridors__type IN ('array')),
  "display_name__type" text CHECK(display_name__type IN ('object')),
  "display_name__en__type" text CHECK(display_name__en__type IN ('string')),
  "display_name__en" text,
  "display_name__ko__type" text CHECK(display_name__ko__type IN ('string')),
  "display_name__ko" text,
  "government__type" text CHECK(government__type IN ('object')),
  "government__en__type" text CHECK(government__en__type IN ('string')),
  "government__en" text,
  "government__ko__type" text CHECK(government__ko__type IN ('string')),
  "government__ko" text,
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "offices__type" text CHECK(offices__type IN ('array')),
  "power__type" text CHECK(power__type IN ('object')),
  "power__en__type" text CHECK(power__en__type IN ('string')),
  "power__en" text,
  "power__ko__type" text CHECK(power__ko__type IN ('string')),
  "power__ko" text,
  "power_basis__type" text CHECK(power_basis__type IN ('array')),
  "region__type" text CHECK(region__type IN ('object')),
  "region__en__type" text CHECK(region__en__type IN ('string')),
  "region__en" text,
  "region__ko__type" text CHECK(region__ko__type IN ('string')),
  "region__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_states_corridors" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "group_id__type" text CHECK(group_id__type IN ('string')),
  "group_id" text,
  "ho__type" text CHECK(ho__type IN ('number')),
  "ho" double precision,
  "name__type" text CHECK(name__type IN ('object')),
  "name__en__type" text CHECK(name__en__type IN ('string')),
  "name__en" text,
  "name__ko__type" text CHECK(name__ko__type IN ('string')),
  "name__ko" text,
  "station__type" text CHECK(station__type IN ('object')),
  "station__en__type" text CHECK(station__en__type IN ('string')),
  "station__en" text,
  "station__ko__type" text CHECK(station__ko__type IN ('string')),
  "station__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_states_offices" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_states_power_basis" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_synthetics" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "body_platform__type" text CHECK(body_platform__type IN ('object')),
  "body_platform__en__type" text CHECK(body_platform__en__type IN ('string')),
  "body_platform__en" text,
  "body_platform__ko__type" text CHECK(body_platform__ko__type IN ('string')),
  "body_platform__ko" text,
  "callsign__type" text CHECK(callsign__type IN ('object')),
  "callsign__en__type" text CHECK(callsign__en__type IN ('string')),
  "callsign__en" text,
  "callsign__ko__type" text CHECK(callsign__ko__type IN ('string')),
  "callsign__ko" text,
  "cls__type" text CHECK(cls__type IN ('string')),
  "cls" text,
  "custody_legal__type" text CHECK(custody_legal__type IN ('object')),
  "custody_legal__en__type" text CHECK(custody_legal__en__type IN ('string')),
  "custody_legal__en" text,
  "custody_legal__ko__type" text CHECK(custody_legal__ko__type IN ('string')),
  "custody_legal__ko" text,
  "display_name__type" text CHECK(display_name__type IN ('object')),
  "display_name__en__type" text CHECK(display_name__en__type IN ('string')),
  "display_name__en" text,
  "display_name__ko__type" text CHECK(display_name__ko__type IN ('string')),
  "display_name__ko" text,
  "divergence_recovery__type" text CHECK(divergence_recovery__type IN ('object')),
  "divergence_recovery__en__type" text CHECK(divergence_recovery__en__type IN ('string')),
  "divergence_recovery__en" text,
  "divergence_recovery__ko__type" text CHECK(divergence_recovery__ko__type IN ('string')),
  "divergence_recovery__ko" text,
  "emergent_goal__type" text CHECK(emergent_goal__type IN ('object')),
  "emergent_goal__en__type" text CHECK(emergent_goal__en__type IN ('string')),
  "emergent_goal__en" text,
  "emergent_goal__ko__type" text CHECK(emergent_goal__ko__type IN ('string')),
  "emergent_goal__ko" text,
  "energy_parts__type" text CHECK(energy_parts__type IN ('object')),
  "energy_parts__en__type" text CHECK(energy_parts__en__type IN ('string')),
  "energy_parts__en" text,
  "energy_parts__ko__type" text CHECK(energy_parts__ko__type IN ('string')),
  "energy_parts__ko" text,
  "house_id__type" text CHECK(house_id__type IN ('string')),
  "house_id" text,
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "maintenance__type" text CHECK(maintenance__type IN ('object')),
  "maintenance__en__type" text CHECK(maintenance__en__type IN ('string')),
  "maintenance__en" text,
  "maintenance__ko__type" text CHECK(maintenance__ko__type IN ('string')),
  "maintenance__ko" text,
  "memory_continuity__type" text CHECK(memory_continuity__type IN ('object')),
  "memory_continuity__en__type" text CHECK(memory_continuity__en__type IN ('string')),
  "memory_continuity__en" text,
  "memory_continuity__ko__type" text CHECK(memory_continuity__ko__type IN ('string')),
  "memory_continuity__ko" text,
  "network_safety__type" text CHECK(network_safety__type IN ('object')),
  "network_safety__en__type" text CHECK(network_safety__en__type IN ('string')),
  "network_safety__en" text,
  "network_safety__ko__type" text CHECK(network_safety__ko__type IN ('string')),
  "network_safety__ko" text,
  "owner__type" text CHECK(owner__type IN ('string')),
  "owner" text,
  "projection_targets__type" text CHECK(projection_targets__type IN ('array')),
  "prose__type" text CHECK(prose__type IN ('array')),
  "relations__type" text CHECK(relations__type IN ('array')),
  "revision__type" text CHECK(revision__type IN ('number')),
  "revision" double precision,
  "source_anchors__type" text CHECK(source_anchors__type IN ('array')),
  "source_kind__type" text CHECK(source_kind__type IN ('string')),
  "source_kind" text,
  "state_id__type" text CHECK(state_id__type IN ('string')),
  "state_id" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_synthetics_projection_targets" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_synthetics_prose" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "anchor__type" text CHECK(anchor__type IN ('string')),
  "anchor" text,
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "text__type" text CHECK(text__type IN ('object')),
  "text__en__type" text CHECK(text__en__type IN ('string')),
  "text__en" text,
  "text__ko__type" text CHECK(text__ko__type IN ('string')),
  "text__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_synthetics_relations" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "reason__type" text CHECK(reason__type IN ('object')),
  "reason__en__type" text CHECK(reason__en__type IN ('string')),
  "reason__en" text,
  "reason__ko__type" text CHECK(reason__ko__type IN ('string')),
  "reason__ko" text,
  "target__type" text CHECK(target__type IN ('string')),
  "target" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_synthetics_source_anchors" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "checkpoints__type" text CHECK(checkpoints__type IN ('array')),
  "display_name__type" text CHECK(display_name__type IN ('object')),
  "display_name__en__type" text CHECK(display_name__en__type IN ('string')),
  "display_name__en" text,
  "display_name__ko__type" text CHECK(display_name__ko__type IN ('string')),
  "display_name__ko" text,
  "explicit_unknowns__type" text CHECK(explicit_unknowns__type IN ('array')),
  "hostile_ecology_interaction__type" text CHECK(hostile_ecology_interaction__type IN ('array')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "inference__type" text CHECK(inference__type IN ('object')),
  "inference__en__type" text CHECK(inference__en__type IN ('string')),
  "inference__en" text,
  "inference__ko__type" text CHECK(inference__ko__type IN ('string')),
  "inference__ko" text,
  "japan_bridge_removable__type" text CHECK(japan_bridge_removable__type IN ('boolean')),
  "japan_bridge_removable" bigint,
  "language_rumor_protocol__type" text CHECK(language_rumor_protocol__type IN ('object')),
  "language_rumor_protocol__interpreter_rule__type" text CHECK(language_rumor_protocol__interpreter_rule__type IN ('object')),
  "language_rumor_protocol__interpreter_rule__en__type" text CHECK(language_rumor_protocol__interpreter_rule__en__type IN ('string')),
  "language_rumor_protocol__interpreter_rule__en" text,
  "language_rumor_protocol__interpreter_rule__ko__type" text CHECK(language_rumor_protocol__interpreter_rule__ko__type IN ('string')),
  "language_rumor_protocol__interpreter_rule__ko" text,
  "language_rumor_protocol__prohibited_inference__type" text CHECK(language_rumor_protocol__prohibited_inference__type IN ('object')),
  "language_rumor_protocol__prohibited_inference__en__type" text CHECK(language_rumor_protocol__prohibited_inference__en__type IN ('string')),
  "language_rumor_protocol__prohibited_inference__en" text,
  "language_rumor_protocol__prohibited_inference__ko__type" text CHECK(language_rumor_protocol__prohibited_inference__ko__type IN ('string')),
  "language_rumor_protocol__prohibited_inference__ko" text,
  "language_rumor_protocol__record_language__type" text CHECK(language_rumor_protocol__record_language__type IN ('object')),
  "language_rumor_protocol__record_language__en__type" text CHECK(language_rumor_protocol__record_language__en__type IN ('string')),
  "language_rumor_protocol__record_language__en" text,
  "language_rumor_protocol__record_language__ko__type" text CHECK(language_rumor_protocol__record_language__ko__type IN ('string')),
  "language_rumor_protocol__record_language__ko" text,
  "language_rumor_protocol__rumor_reliability__type" text CHECK(language_rumor_protocol__rumor_reliability__type IN ('array')),
  "opening_event__type" text CHECK(opening_event__type IN ('object')),
  "opening_event__conflict__type" text CHECK(opening_event__conflict__type IN ('object')),
  "opening_event__conflict__en__type" text CHECK(opening_event__conflict__en__type IN ('string')),
  "opening_event__conflict__en" text,
  "opening_event__conflict__ko__type" text CHECK(opening_event__conflict__ko__type IN ('string')),
  "opening_event__conflict__ko" text,
  "opening_event__player_decision__type" text CHECK(opening_event__player_decision__type IN ('object')),
  "opening_event__player_decision__en__type" text CHECK(opening_event__player_decision__en__type IN ('string')),
  "opening_event__player_decision__en" text,
  "opening_event__player_decision__ko__type" text CHECK(opening_event__player_decision__ko__type IN ('string')),
  "opening_event__player_decision__ko" text,
  "opening_event__scenario_id__type" text CHECK(opening_event__scenario_id__type IN ('string')),
  "opening_event__scenario_id" text,
  "opening_event__timeline_placement__type" text CHECK(opening_event__timeline_placement__type IN ('object')),
  "opening_event__timeline_placement__en__type" text CHECK(opening_event__timeline_placement__en__type IN ('string')),
  "opening_event__timeline_placement__en" text,
  "opening_event__timeline_placement__ko__type" text CHECK(opening_event__timeline_placement__ko__type IN ('string')),
  "opening_event__timeline_placement__ko" text,
  "opening_event__trigger__type" text CHECK(opening_event__trigger__type IN ('object')),
  "opening_event__trigger__en__type" text CHECK(opening_event__trigger__en__type IN ('string')),
  "opening_event__trigger__en" text,
  "opening_event__trigger__ko__type" text CHECK(opening_event__trigger__ko__type IN ('string')),
  "opening_event__trigger__ko" text,
  "original_fiction__type" text CHECK(original_fiction__type IN ('object')),
  "original_fiction__en__type" text CHECK(original_fiction__en__type IN ('string')),
  "original_fiction__en" text,
  "original_fiction__ko__type" text CHECK(original_fiction__ko__type IN ('string')),
  "original_fiction__ko" text,
  "reader_description__type" text CHECK(reader_description__type IN ('object')),
  "reader_description__en__type" text CHECK(reader_description__en__type IN ('string')),
  "reader_description__en" text,
  "reader_description__ko__type" text CHECK(reader_description__ko__type IN ('string')),
  "reader_description__ko" text,
  "owner__type" text CHECK(owner__type IN ('string')),
  "owner" text,
  "player_entry_points__type" text CHECK(player_entry_points__type IN ('array')),
  "projection_targets__type" text CHECK(projection_targets__type IN ('array')),
  "prose__type" text CHECK(prose__type IN ('array')),
  "revision__type" text CHECK(revision__type IN ('number')),
  "revision" double precision,
  "routes__type" text CHECK(routes__type IN ('object')),
  "routes__ai_custody__type" text CHECK(routes__ai_custody__type IN ('object')),
  "routes__ai_custody__en__type" text CHECK(routes__ai_custody__en__type IN ('string')),
  "routes__ai_custody__en" text,
  "routes__ai_custody__ko__type" text CHECK(routes__ai_custody__ko__type IN ('string')),
  "routes__ai_custody__ko" text,
  "routes__data__type" text CHECK(routes__data__type IN ('object')),
  "routes__data__en__type" text CHECK(routes__data__en__type IN ('string')),
  "routes__data__en" text,
  "routes__data__ko__type" text CHECK(routes__data__ko__type IN ('string')),
  "routes__data__ko" text,
  "routes__diaspora__type" text CHECK(routes__diaspora__type IN ('object')),
  "routes__diaspora__en__type" text CHECK(routes__diaspora__en__type IN ('string')),
  "routes__diaspora__en" text,
  "routes__diaspora__ko__type" text CHECK(routes__diaspora__ko__type IN ('string')),
  "routes__diaspora__ko" text,
  "routes__energy__type" text CHECK(routes__energy__type IN ('object')),
  "routes__energy__en__type" text CHECK(routes__energy__en__type IN ('string')),
  "routes__energy__en" text,
  "routes__energy__ko__type" text CHECK(routes__energy__ko__type IN ('string')),
  "routes__energy__ko" text,
  "routes__monster_migration__type" text CHECK(routes__monster_migration__type IN ('object')),
  "routes__monster_migration__en__type" text CHECK(routes__monster_migration__en__type IN ('string')),
  "routes__monster_migration__en" text,
  "routes__monster_migration__ko__type" text CHECK(routes__monster_migration__ko__type IN ('string')),
  "routes__monster_migration__ko" text,
  "routes__refugee__type" text CHECK(routes__refugee__type IN ('object')),
  "routes__refugee__en__type" text CHECK(routes__refugee__en__type IN ('string')),
  "routes__refugee__en" text,
  "routes__refugee__ko__type" text CHECK(routes__refugee__ko__type IN ('string')),
  "routes__refugee__ko" text,
  "routes__security__type" text CHECK(routes__security__type IN ('object')),
  "routes__security__en__type" text CHECK(routes__security__en__type IN ('string')),
  "routes__security__en" text,
  "routes__security__ko__type" text CHECK(routes__security__ko__type IN ('string')),
  "routes__security__ko" text,
  "routes__trade__type" text CHECK(routes__trade__type IN ('object')),
  "routes__trade__en__type" text CHECK(routes__trade__en__type IN ('string')),
  "routes__trade__en" text,
  "routes__trade__ko__type" text CHECK(routes__trade__ko__type IN ('string')),
  "routes__trade__ko" text,
  "scenario_chains__type" text CHECK(scenario_chains__type IN ('array')),
  "seoul_route__type" text CHECK(seoul_route__type IN ('object')),
  "seoul_route__evidence_kind__type" text CHECK(seoul_route__evidence_kind__type IN ('string')),
  "seoul_route__evidence_kind" text,
  "seoul_route__fixed_duration__type" text CHECK(seoul_route__fixed_duration__type IN ('object')),
  "seoul_route__fixed_duration__en__type" text CHECK(seoul_route__fixed_duration__en__type IN ('string')),
  "seoul_route__fixed_duration__en" text,
  "seoul_route__fixed_duration__ko__type" text CHECK(seoul_route__fixed_duration__ko__type IN ('string')),
  "seoul_route__fixed_duration__ko" text,
  "seoul_route__outbound_boundary__type" text CHECK(seoul_route__outbound_boundary__type IN ('object')),
  "seoul_route__outbound_boundary__en__type" text CHECK(seoul_route__outbound_boundary__en__type IN ('string')),
  "seoul_route__outbound_boundary__en" text,
  "seoul_route__outbound_boundary__ko__type" text CHECK(seoul_route__outbound_boundary__ko__type IN ('string')),
  "seoul_route__outbound_boundary__ko" text,
  "seoul_route__route_design__type" text CHECK(seoul_route__route_design__type IN ('object')),
  "seoul_route__route_design__en__type" text CHECK(seoul_route__route_design__en__type IN ('string')),
  "seoul_route__route_design__en" text,
  "seoul_route__route_design__ko__type" text CHECK(seoul_route__route_design__ko__type IN ('string')),
  "seoul_route__route_design__ko" text,
  "seoul_route__staging_nodes__type" text CHECK(seoul_route__staging_nodes__type IN ('array')),
  "seoul_route__verified_geography__type" text CHECK(seoul_route__verified_geography__type IN ('object')),
  "seoul_route__verified_geography__en__type" text CHECK(seoul_route__verified_geography__en__type IN ('string')),
  "seoul_route__verified_geography__en" text,
  "seoul_route__verified_geography__ko__type" text CHECK(seoul_route__verified_geography__ko__type IN ('string')),
  "seoul_route__verified_geography__ko" text,
  "source_anchors__type" text CHECK(source_anchors__type IN ('array')),
  "source_kind__type" text CHECK(source_kind__type IN ('string')),
  "source_kind" text,
  "state_interests__type" text CHECK(state_interests__type IN ('array')),
  "states__type" text CHECK(states__type IN ('array')),
  "supply_chain__type" text CHECK(supply_chain__type IN ('object')),
  "supply_chain__flows__type" text CHECK(supply_chain__flows__type IN ('array')),
  "supply_chain__separation_rule__type" text CHECK(supply_chain__separation_rule__type IN ('object')),
  "supply_chain__separation_rule__en__type" text CHECK(supply_chain__separation_rule__en__type IN ('string')),
  "supply_chain__separation_rule__en" text,
  "supply_chain__separation_rule__ko__type" text CHECK(supply_chain__separation_rule__ko__type IN ('string')),
  "supply_chain__separation_rule__ko" text,
  "travel_constraints__type" text CHECK(travel_constraints__type IN ('object')),
  "travel_constraints__rule__type" text CHECK(travel_constraints__rule__type IN ('object')),
  "travel_constraints__rule__en__type" text CHECK(travel_constraints__rule__en__type IN ('string')),
  "travel_constraints__rule__en" text,
  "travel_constraints__rule__ko__type" text CHECK(travel_constraints__rule__ko__type IN ('string')),
  "travel_constraints__rule__ko" text,
  "travel_constraints__seasonal_conditions__type" text CHECK(travel_constraints__seasonal_conditions__type IN ('array')),
  "travel_constraints__suspension_conditions__type" text CHECK(travel_constraints__suspension_conditions__type IN ('array')),
  "verified__type" text CHECK(verified__type IN ('object')),
  "verified__en__type" text CHECK(verified__en__type IN ('string')),
  "verified__en" text,
  "verified__ko__type" text CHECK(verified__ko__type IN ('string')),
  "verified__ko" text,
  "record_status__type" text CHECK(record_status__type IN ('string','null')),
  "record_status" text,
  "current_operational_claim__type" text CHECK(current_operational_claim__type IN ('boolean','null')),
  "current_operational_claim" bigint,
  "historical_display_name__type" text CHECK(historical_display_name__type IN ('object','null')),
  "historical_display_name__en__type" text CHECK(historical_display_name__en__type IN ('string','null')),
  "historical_display_name__en" text,
  "historical_display_name__ko__type" text CHECK(historical_display_name__ko__type IN ('string','null')),
  "historical_display_name__ko" text,
  "projection_display_name__type" text CHECK(projection_display_name__type IN ('object','null')),
  "projection_display_name__en__type" text CHECK(projection_display_name__en__type IN ('string','null')),
  "projection_display_name__en" text,
  "projection_display_name__ko__type" text CHECK(projection_display_name__ko__type IN ('string','null')),
  "projection_display_name__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters_checkpoints" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "authority_state_ids__type" text CHECK(authority_state_ids__type IN ('array')),
  "checks__type" text CHECK(checks__type IN ('array')),
  "function__type" text CHECK(function__type IN ('object')),
  "function__en__type" text CHECK(function__en__type IN ('string')),
  "function__en" text,
  "function__ko__type" text CHECK(function__ko__type IN ('string')),
  "function__ko" text,
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "place__type" text CHECK(place__type IN ('object')),
  "place__en__type" text CHECK(place__en__type IN ('string')),
  "place__en" text,
  "place__ko__type" text CHECK(place__ko__type IN ('string')),
  "place__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters_checkpoints_authority_sta" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters_checkpoints_checks" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters_explicit_unknowns" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters_hostile_ecology_interacti" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "group_id__type" text CHECK(group_id__type IN ('string')),
  "group_id" text,
  "interaction__type" text CHECK(interaction__type IN ('object')),
  "interaction__en__type" text CHECK(interaction__en__type IN ('string')),
  "interaction__en" text,
  "interaction__ko__type" text CHECK(interaction__ko__type IN ('string')),
  "interaction__ko" text,
  "nonlethal_constraint__type" text CHECK(nonlethal_constraint__type IN ('object')),
  "nonlethal_constraint__en__type" text CHECK(nonlethal_constraint__en__type IN ('string')),
  "nonlethal_constraint__en" text,
  "nonlethal_constraint__ko__type" text CHECK(nonlethal_constraint__ko__type IN ('string')),
  "nonlethal_constraint__ko" text,
  "operational_response__type" text CHECK(operational_response__type IN ('object')),
  "operational_response__en__type" text CHECK(operational_response__en__type IN ('string')),
  "operational_response__en" text,
  "operational_response__ko__type" text CHECK(operational_response__ko__type IN ('string')),
  "operational_response__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters_language_rumor_protocol_r" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "rule__type" text CHECK(rule__type IN ('object')),
  "rule__en__type" text CHECK(rule__en__type IN ('string')),
  "rule__en" text,
  "rule__ko__type" text CHECK(rule__ko__type IN ('string')),
  "rule__ko" text,
  "tier__type" text CHECK(tier__type IN ('string')),
  "tier" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters_player_entry_points" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "first_decision__type" text CHECK(first_decision__type IN ('object')),
  "first_decision__en__type" text CHECK(first_decision__en__type IN ('string')),
  "first_decision__en" text,
  "first_decision__ko__type" text CHECK(first_decision__ko__type IN ('string')),
  "first_decision__ko" text,
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "place__type" text CHECK(place__type IN ('object')),
  "place__en__type" text CHECK(place__en__type IN ('string')),
  "place__en" text,
  "place__ko__type" text CHECK(place__ko__type IN ('string')),
  "place__ko" text,
  "role__type" text CHECK(role__type IN ('object')),
  "role__en__type" text CHECK(role__en__type IN ('string')),
  "role__en" text,
  "role__ko__type" text CHECK(role__ko__type IN ('string')),
  "role__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters_projection_targets" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters_prose" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "anchor__type" text CHECK(anchor__type IN ('string')),
  "anchor" text,
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "text__type" text CHECK(text__type IN ('object')),
  "text__en__type" text CHECK(text__en__type IN ('string','array')),
  "text__en" text,
  "text__ko__type" text CHECK(text__ko__type IN ('string','array')),
  "text__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters_prose_text_en" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "text__type" text CHECK(text__type IN ('string')),
  "text" text,
  "link__type" text CHECK(link__type IN ('object')),
  "link__anchor__type" text CHECK(link__anchor__type IN ('string')),
  "link__anchor" text,
  "link__domain__type" text CHECK(link__domain__type IN ('string')),
  "link__domain" text,
  "link__slug__type" text CHECK(link__slug__type IN ('string')),
  "link__slug" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters_prose_text_ko" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "text__type" text CHECK(text__type IN ('string')),
  "text" text,
  "link__type" text CHECK(link__type IN ('object')),
  "link__anchor__type" text CHECK(link__anchor__type IN ('string')),
  "link__anchor" text,
  "link__domain__type" text CHECK(link__domain__type IN ('string')),
  "link__domain" text,
  "link__slug__type" text CHECK(link__slug__type IN ('string')),
  "link__slug" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters_scenario_chains" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "summary__type" text CHECK(summary__type IN ('object')),
  "summary__en__type" text CHECK(summary__en__type IN ('string')),
  "summary__en" text,
  "summary__ko__type" text CHECK(summary__ko__type IN ('string')),
  "summary__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters_seoul_route_staging_nodes" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters_source_anchors" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters_state_interests" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "interest__type" text CHECK(interest__type IN ('object')),
  "interest__en__type" text CHECK(interest__en__type IN ('string')),
  "interest__en" text,
  "interest__ko__type" text CHECK(interest__ko__type IN ('string')),
  "interest__ko" text,
  "leverage__type" text CHECK(leverage__type IN ('object')),
  "leverage__en__type" text CHECK(leverage__en__type IN ('string')),
  "leverage__en" text,
  "leverage__ko__type" text CHECK(leverage__ko__type IN ('string')),
  "leverage__ko" text,
  "red_line__type" text CHECK(red_line__type IN ('object')),
  "red_line__en__type" text CHECK(red_line__en__type IN ('string')),
  "red_line__en" text,
  "red_line__ko__type" text CHECK(red_line__ko__type IN ('string')),
  "red_line__ko" text,
  "state_id__type" text CHECK(state_id__type IN ('string')),
  "state_id" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters_states" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters_supply_chain_flows" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "contents__type" text CHECK(contents__type IN ('object')),
  "contents__en__type" text CHECK(contents__en__type IN ('string')),
  "contents__en" text,
  "contents__ko__type" text CHECK(contents__ko__type IN ('string')),
  "contents__ko" text,
  "handoff_rule__type" text CHECK(handoff_rule__type IN ('object')),
  "handoff_rule__en__type" text CHECK(handoff_rule__en__type IN ('string')),
  "handoff_rule__en" text,
  "handoff_rule__ko__type" text CHECK(handoff_rule__ko__type IN ('string')),
  "handoff_rule__ko" text,
  "kind__type" text CHECK(kind__type IN ('object')),
  "kind__en__type" text CHECK(kind__en__type IN ('string')),
  "kind__en" text,
  "kind__ko__type" text CHECK(kind__ko__type IN ('string')),
  "kind__ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters_travel_constraints_season" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_atlas_theaters_travel_constraints_suspen" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_character_example" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data'),
  PRIMARY KEY ("revision_id", "source_id")
);
CREATE TABLE wiki."document_revision_text_character_example_desire" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "axis" text NOT NULL CHECK(axis IN ('longing','exclusivity','risk','display','continuity','orientation','union')),
  "axis_name" text NOT NULL,
  "value_kind" text NOT NULL CHECK(value_kind IN ('integer','text')),
  "status" text NOT NULL CHECK(status IN ('known','unknown','undecided','not-applicable')),
  "integer_value" bigint CHECK(integer_value BETWEEN -100 AND 100),
  "text_value" text CHECK(length(text_value)>0),
  "origin" text CHECK(origin IN ('source-fact','original-fiction','computed')),
  "reason" text CHECK(length(reason)>0),
  PRIMARY KEY ("revision_id", "source_id", "axis"),
  CHECK(json_pointer='/data/desires/' || axis),
  CHECK(axis_name=CASE axis WHEN 'longing' THEN '갈망' WHEN 'exclusivity' THEN '독점' WHEN 'risk' THEN '위험' WHEN 'display' THEN '과시' WHEN 'continuity' THEN '지속' WHEN 'orientation' THEN '지향' WHEN 'union' THEN '결합' END),
  CHECK((axis IN ('orientation','union') AND value_kind='text' AND integer_value IS NULL)
    OR (axis NOT IN ('orientation','union') AND value_kind='integer' AND text_value IS NULL)),
  CHECK((status='known' AND origin IS NOT NULL AND reason IS NULL
      AND ((value_kind='integer' AND integer_value IS NOT NULL) OR (value_kind='text' AND text_value IS NOT NULL)))
    OR (status<>'known' AND integer_value IS NULL AND text_value IS NULL AND origin IS NULL AND reason IS NOT NULL))
);
CREATE TABLE wiki."document_revision_text_character_example_fact" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "field" text NOT NULL CHECK(field IN ('name','polity_title','sex','origin','language','conscription','arms_access','occupation','affiliation','biography')),
  "status" text NOT NULL CHECK(status IN ('known','unknown','undecided','not-applicable')),
  "text_value" text CHECK(length(text_value)>0),
  "origin" text CHECK(origin IN ('source-fact','original-fiction','computed')),
  "reason" text CHECK(length(reason)>0),
  PRIMARY KEY ("revision_id", "source_id", "field"),
  CHECK(json_pointer=CASE field WHEN 'name' THEN '/data/identity/name' WHEN 'polity_title' THEN '/data/rank/polity_title' ELSE '/data/' || field END),
  CHECK((status='known' AND text_value IS NOT NULL AND origin IS NOT NULL AND reason IS NULL)
    OR (status<>'known' AND text_value IS NULL AND origin IS NULL AND reason IS NOT NULL)),
  CHECK(field<>'sex' OR (status='known' AND text_value IN ('female','male')))
);
CREATE TABLE wiki."document_revision_text_character_example_identity" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/identity'),
  "generation" text NOT NULL CHECK(generation IN ('opening','predecessor')),
  PRIMARY KEY ("revision_id", "source_id")
);
CREATE TABLE wiki."document_revision_text_character_example_politics" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "field" text NOT NULL CHECK(field IN ('personality','ambition','fear','governance','trigger','intervention')),
  "status" text NOT NULL CHECK(status IN ('known','unknown','undecided','not-applicable')),
  "text_value" text CHECK(length(text_value)>0),
  "origin" text CHECK(origin IN ('source-fact','original-fiction','computed')),
  "reason" text CHECK(length(reason)>0),
  PRIMARY KEY ("revision_id", "source_id", "field"),
  CHECK(json_pointer='/data/politics/' || field),
  CHECK((status='known' AND text_value IS NOT NULL AND origin IS NOT NULL AND reason IS NULL)
    OR (status<>'known' AND text_value IS NULL AND origin IS NULL AND reason IS NOT NULL))
);
CREATE TABLE wiki."document_revision_text_character_example_rank" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/rank'),
  "common_tier" text NOT NULL CHECK(common_tier IN ('T1','T2','T3','T4','T5')),
  PRIMARY KEY ("revision_id", "source_id")
);
CREATE TABLE wiki."document_revision_text_character_example_relation" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "relation_type" text NOT NULL CHECK(relation_type IN ('kinship','adoption','mentorship','command','contract','debt','oath','rivalry','grievance','protected-residence','betrayal')),
  "target_id" text NOT NULL CHECK(length(target_id)>0),
  PRIMARY KEY ("revision_id", "source_id", "ordinal"),
  CHECK(json_pointer='/data/relations/value/' || ordinal)
);
CREATE TABLE wiki."document_revision_text_character_example_relations" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/relations'),
  "status" text NOT NULL CHECK(status IN ('known','unknown','undecided','not-applicable')),
  "origin" text CHECK(origin IN ('source-fact','original-fiction','computed')),
  "reason" text CHECK(length(reason)>0),
  PRIMARY KEY ("revision_id", "source_id"),
  UNIQUE(revision_id,source_id,status),
  CHECK((status='known' AND origin IS NOT NULL AND reason IS NULL)
    OR (status<>'known' AND origin IS NULL AND reason IS NOT NULL))
);
CREATE TABLE wiki."document_revision_text_character_example_value" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "axis" text NOT NULL CHECK(axis IN ('authority','openness','force','material','community','principle','transparency','qualification','decentralization','change')),
  "axis_name" text NOT NULL,
  "status" text NOT NULL CHECK(status IN ('known','unknown','undecided','not-applicable')),
  "integer_value" bigint CHECK(integer_value BETWEEN -100 AND 100),
  "origin" text CHECK(origin IN ('source-fact','original-fiction','computed')),
  "reason" text CHECK(length(reason)>0),
  PRIMARY KEY ("revision_id", "source_id", "axis"),
  CHECK(json_pointer='/data/values/' || axis),
  CHECK(axis_name=CASE axis WHEN 'authority' THEN '권위' WHEN 'openness' THEN '개방' WHEN 'force' THEN '무력' WHEN 'material' THEN '물질' WHEN 'community' THEN '공동' WHEN 'principle' THEN '원칙' WHEN 'transparency' THEN '공개' WHEN 'qualification' THEN '자격' WHEN 'decentralization' THEN '분산' WHEN 'change' THEN '변혁' END),
  CHECK((status='known' AND integer_value IS NOT NULL AND origin IS NOT NULL AND reason IS NULL)
    OR (status<>'known' AND integer_value IS NULL AND origin IS NULL AND reason IS NOT NULL))
);
CREATE TABLE wiki."document_revision_text_chronology_event" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "event_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "anchor" text NOT NULL,
  "authored_order" bigint NOT NULL,
  "date_status" text NOT NULL,
  "date_value" text,
  "date_reason" text,
  PRIMARY KEY ("revision_id", "source_id", "event_id"),
  UNIQUE(revision_id,source_id,ordinal)
);
CREATE TABLE wiki."document_revision_text_culture_example" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/transmission'),
  "transmission" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id")
);
CREATE TABLE wiki."document_revision_text_document" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer=''),
  "corpus_kind" text NOT NULL CHECK(corpus_kind IN ('current','historical','example')),
  "version" bigint NOT NULL CHECK(version=1),
  "domain" text NOT NULL,
  "document_id" text NOT NULL,
  "slug" text NOT NULL,
  "status" text NOT NULL CHECK(status IN ('draft','approved','excluded')),
  "tense_ko" text NOT NULL CHECK(tense_ko IN ('past','present')),
  "tense_en" text NOT NULL CHECK(tense_en IN ('past','present')),
  "source_kind" text NOT NULL CHECK(source_kind IN ('original-fiction','observed','computed','inference','source-fact')),
  "source_hash" text,
  "original_anchor" text NOT NULL,
  "original_hash" text,
  "data_pointer" text NOT NULL CHECK(data_pointer='/data'),
  PRIMARY KEY ("revision_id", "source_id"),
  UNIQUE(revision_id,corpus_kind,domain,slug),
  UNIQUE(revision_id,source_id,corpus_kind)
);
CREATE TABLE wiki."document_revision_text_document_anchor" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "locale" text NOT NULL CHECK(locale IN ('ko','en')),
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "node_pointer" text NOT NULL,
  "anchor" text NOT NULL,
  "anchor_kind" text NOT NULL CHECK(anchor_kind IN ('authored','public','natural','inline')),
  "published" bigint NOT NULL CHECK(published IN (0,1)),
  PRIMARY KEY ("revision_id", "source_id", "locale", "ordinal")
);
CREATE TABLE wiki."document_revision_text_document_category" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "category" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id", "ordinal"),
  UNIQUE(revision_id,source_id,category)
);
CREATE TABLE wiki."document_revision_text_document_history" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "entry" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id", "ordinal")
);
CREATE TABLE wiki."document_revision_text_document_link" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "corpus_kind" text NOT NULL CHECK(corpus_kind IN ('current','historical','example')),
  "locale" text NOT NULL CHECK(locale IN ('ko','en')),
  "resolution" text NOT NULL CHECK(resolution IN ('external','gdd','missing-target','document','anchor','ambiguous-anchor','missing-anchor')),
  "target_source_id" bigint,
  "target_anchor_ordinal" bigint,
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  CHECK((resolution IN ('external','gdd','missing-target') AND target_source_id IS NULL AND target_anchor_ordinal IS NULL) OR (resolution IN ('document','missing-anchor','ambiguous-anchor') AND target_source_id IS NOT NULL AND target_anchor_ordinal IS NULL) OR (resolution='anchor' AND target_source_id IS NOT NULL AND target_anchor_ordinal IS NOT NULL))
);
CREATE TABLE wiki."document_revision_text_document_list_item" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "node_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id,node_pointer,ordinal)
);
CREATE TABLE wiki."document_revision_text_document_locale" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "locale" text NOT NULL CHECK(locale IN ('ko','en')),
  "title" text NOT NULL,
  "summary" text NOT NULL,
  "tense" text NOT NULL CHECK(tense IN ('past','present')),
  PRIMARY KEY ("revision_id", "source_id", "locale")
);
CREATE TABLE wiki."document_revision_text_document_node" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "kind" text NOT NULL CHECK(kind IN ('heading','paragraph','quote','rule','code','list','table')),
  "anchor" text NOT NULL,
  "depth" bigint,
  "ordered" bigint CHECK(ordered=1),
  "list_start" bigint CHECK(list_start>=0),
  "language" text,
  "info" text,
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id,ordinal),
  UNIQUE(revision_id,source_id,anchor),
  CHECK((kind='heading' AND depth BETWEEN 1 AND 6 AND depth IS NOT NULL) OR (kind<>'heading' AND depth IS NULL)),
  CHECK(kind='list' OR (ordered IS NULL AND list_start IS NULL)),
  CHECK((kind='code' AND language IS NOT NULL) OR (kind<>'code' AND language IS NULL AND info IS NULL))
);
CREATE TABLE wiki."document_revision_text_document_run" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "slot_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "text" text NOT NULL,
  "strong" bigint CHECK(strong=1),
  "link_domain" text,
  "link_slug" text,
  "link_anchor" text,
  "href" text,
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id,slot_pointer,ordinal),
  CHECK((link_domain IS NULL AND link_slug IS NULL AND link_anchor IS NULL) OR (link_domain IS NOT NULL AND link_slug IS NOT NULL AND href IS NULL))
);
CREATE TABLE wiki."document_revision_text_document_slot" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "node_pointer" text NOT NULL,
  "locale" text NOT NULL CHECK(locale IN ('ko','en')),
  "representation" text NOT NULL CHECK(representation IN ('string','runs')),
  "text" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id,json_pointer,locale)
);
CREATE TABLE wiki."document_revision_text_document_source_ref" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "reference" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id", "ordinal"),
  UNIQUE(revision_id,source_id,reference)
);
CREATE TABLE wiki."document_revision_text_document_table_cell" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "node_pointer" text NOT NULL,
  "row_pointer" text,
  "cell_kind" text NOT NULL CHECK(cell_kind IN ('column','body')),
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  CHECK((cell_kind='column' AND row_pointer IS NULL) OR (cell_kind='body' AND row_pointer IS NOT NULL))
);
CREATE TABLE wiki."document_revision_text_document_table_row" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "node_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id,node_pointer,ordinal),
  UNIQUE(revision_id,source_id,json_pointer,node_pointer)
);
CREATE TABLE wiki."document_revision_text_ecology" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/ecology'),
  PRIMARY KEY ("revision_id", "source_id")
);
CREATE TABLE wiki."document_revision_text_ecology_data" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data'),
  PRIMARY KEY ("revision_id", "source_id")
);
CREATE TABLE wiki."document_revision_text_ecology_description" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "locale" text NOT NULL CHECK(locale IN ('en','ko')),
  "representation" text NOT NULL CHECK(representation IN ('string','runs')),
  "text" text NOT NULL CHECK(length(text)>0),
  PRIMARY KEY ("revision_id", "source_id", "locale"),
  CHECK(json_pointer='/data/ecology/description/' || locale)
);
CREATE TABLE wiki."document_revision_text_ecology_description_run" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "locale" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "text" text NOT NULL CHECK(length(text)>0),
  "strong" bigint CHECK(strong=1),
  "link_domain" text,
  "link_slug" text,
  "link_anchor" text,
  "href" text,
  PRIMARY KEY ("revision_id", "source_id", "locale", "ordinal"),
  CHECK(json_pointer='/data/ecology/description/' || locale || '/' || ordinal),
  CHECK((link_domain IS NULL AND link_slug IS NULL AND link_anchor IS NULL) OR (link_domain IS NOT NULL AND link_slug IS NOT NULL AND href IS NULL))
);
CREATE TABLE wiki."document_revision_text_ecology_variant" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "variant_id" text NOT NULL,
  "source_batch" text NOT NULL,
  "target_source_id" bigint,
  PRIMARY KEY ("revision_id", "source_id", "ordinal"),
  CHECK(json_pointer='/data/ecology/variants/' || ordinal)
);
CREATE TABLE wiki."document_revision_text_economy_example" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/exchange'),
  "exchange" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id")
);
CREATE TABLE wiki."document_revision_text_goods_example" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/supply'),
  "supply" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id")
);
CREATE TABLE wiki."document_revision_text_governance" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "text" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id"),
  CHECK(json_pointer='/data/governance')
);
CREATE TABLE wiki."document_revision_text_integration" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/integration'),
  "manifest" text NOT NULL CHECK(manifest='TOOL/tools/wiki/confirmed-integration-manifest.json'),
  PRIMARY KEY ("revision_id", "source_id")
);
CREATE TABLE wiki."document_revision_text_integration_excluded" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "excluded_id" text NOT NULL,
  "kind" text NOT NULL CHECK(kind IN ('social','monsters','groups')),
  "target_source_id" bigint,
  PRIMARY KEY ("revision_id", "source_id", "ordinal"),
  CHECK(json_pointer='/data/integration/excluded/' || ordinal),
  CHECK(kind='groups' OR target_source_id IS NULL)
);
CREATE TABLE wiki."document_revision_text_name_pool_example_entry" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "entry" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id", "ordinal")
);
CREATE TABLE wiki."document_revision_text_offices_example" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/tier'),
  "tier" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id")
);
CREATE TABLE wiki."document_revision_text_overview_example" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/consequence'),
  "consequence" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id")
);
CREATE TABLE wiki."document_revision_text_people_and_machines_example" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/dependency'),
  "dependency" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id")
);
CREATE TABLE wiki."document_revision_text_places_example" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/layer'),
  "layer" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id")
);
CREATE TABLE wiki."document_revision_text_primary_detail" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "person_id" text NOT NULL,
  "name" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id", "ordinal")
);
CREATE TABLE wiki."document_revision_text_regions_example" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/opening_state'),
  "opening_state" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id")
);
CREATE TABLE wiki."document_revision_text_registry" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('array')),
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer),
  CHECK(parent_key IS NULL)
);
CREATE TABLE wiki."document_revision_text_registry_entry" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "anchor__type" text CHECK(anchor__type IN ('string')),
  "anchor" text,
  "relations__type" text CHECK(relations__type IN ('array')),
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_registry_entry_relations" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "type__type" text CHECK(type__type IN ('string')),
  "type" text,
  "target_id__type" text CHECK(target_id__type IN ('string')),
  "target_id" text,
  PRIMARY KEY ("revision_id", "source_id", "row_key"),
  UNIQUE(revision_id,source_id,json_pointer)
);
CREATE TABLE wiki."document_revision_text_simple_collection" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "collection" text NOT NULL CHECK(collection IN ('primary_detail_names','sequence','entries')),
  PRIMARY KEY ("revision_id", "source_id", "collection")
);
CREATE TABLE wiki."document_revision_text_station" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "station_id" text NOT NULL,
  "source" text NOT NULL,
  "has_service_lines" bigint NOT NULL CHECK(has_service_lines IN (0,1)),
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id,ordinal),
  UNIQUE(revision_id,source_id,station_id)
);
CREATE TABLE wiki."document_revision_text_station_alias" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "station_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "alias" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id,station_ordinal,ordinal)
);
CREATE TABLE wiki."document_revision_text_station_catalog" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id"),
  CHECK(json_pointer='/data/station_aliases')
);
CREATE TABLE wiki."document_revision_text_station_line" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "station_ordinal" bigint NOT NULL,
  "line_kind" text NOT NULL CHECK(line_kind IN ('observed_lines','service_lines')),
  "name_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "line" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id,station_ordinal,line_kind,name_ordinal,ordinal)
);
CREATE TABLE wiki."document_revision_text_station_line_name" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "station_ordinal" bigint NOT NULL,
  "line_kind" text NOT NULL CHECK(line_kind IN ('observed_lines','service_lines')),
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "name" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id,station_ordinal,line_kind,ordinal),
  UNIQUE(revision_id,source_id,station_ordinal,line_kind,name)
);
CREATE TABLE wiki."document_revision_text_structures_example" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/function'),
  "function" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id")
);
CREATE TABLE wiki."document_revision_text_technology_example" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/constraint'),
  "constraint_text" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id")
);
CREATE TABLE wiki."document_revision_text_territorial" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "schema" text NOT NULL,
  "scope" text NOT NULL,
  "geographic_empire_id" text NOT NULL,
  "scale_implies_personal_ownership" bigint NOT NULL CHECK(scale_implies_personal_ownership IN (0,1)),
  "scale_implies_title_rank" bigint NOT NULL CHECK(scale_implies_title_rank IN (0,1)),
  "scale_implies_facility_access" bigint NOT NULL CHECK(scale_implies_facility_access IN (0,1)),
  "slot_existence_implies_grant" bigint NOT NULL CHECK(slot_existence_implies_grant IN (0,1)),
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id),
  CHECK(schema='territorial-scale.v2'),
  CHECK(scope='seoul-only'),
  CHECK(json_pointer='/data/territorialScale')
);
CREATE TABLE wiki."document_revision_text_territorial_level" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "level" text NOT NULL,
  "source_pointer" text,
  "rank" text,
  "count" bigint CHECK(count>=0),
  "partition_sha256" text,
  "representation" text,
  "id_field" text,
  "parent_field" text,
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id,level),
  CHECK(level IN ('empire','kingdom','duchy','county','barony')),
  CHECK((level='barony' AND source_pointer IS NULL AND rank IS NULL AND count IS NULL AND partition_sha256 IS NULL AND representation IS NOT NULL AND id_field IS NOT NULL AND parent_field IS NOT NULL) OR (level!='barony' AND source_pointer IS NOT NULL AND rank=level AND count IS NOT NULL AND representation IS NULL AND id_field IS NULL AND parent_field IS NULL AND ((level='kingdom' AND partition_sha256 IS NOT NULL) OR (level!='kingdom' AND partition_sha256 IS NULL))))
);
CREATE TABLE wiki."document_revision_text_territorial_map" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "minimum_polygon_rank" text NOT NULL,
  "barony_polygon" bigint NOT NULL CHECK(barony_polygon IN (0,1)),
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id)
);
CREATE TABLE wiki."document_revision_text_territorial_parent" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "source_field" text NOT NULL,
  "meaning" text NOT NULL,
  "political_liege_inference" bigint NOT NULL CHECK(political_liege_inference IN (0,1)),
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id)
);
CREATE TABLE wiki."document_revision_text_territorial_parent_exception" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "title_id" text NOT NULL,
  "parent_title_id" text NOT NULL,
  "map_kingdom_title_id" text NOT NULL,
  "kind" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id,ordinal)
);
CREATE TABLE wiki."document_revision_text_territorial_political_axis" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "current_centers" bigint NOT NULL CHECK(current_centers>=0),
  "geographic_kingdom_equivalence" bigint NOT NULL CHECK(geographic_kingdom_equivalence IN (0,1)),
  "preserve_stable_political_identities" bigint NOT NULL CHECK(preserve_stable_political_identities IN (0,1)),
  "preserve_nonterritorial_kingship" bigint NOT NULL CHECK(preserve_nonterritorial_kingship IN (0,1)),
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id)
);
CREATE TABLE wiki."document_revision_text_territorial_rank" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "rank" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id,ordinal)
);
CREATE TABLE wiki."document_revision_text_territorial_selectable_rank" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "rank" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id,ordinal)
);
CREATE TABLE wiki."document_revision_text_territorial_slot_edition" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "edition_kind" text NOT NULL,
  "source_pointer" text NOT NULL,
  "edition" text NOT NULL,
  "base_date" text,
  "administrative_candidate_date" text,
  "checked_at" text,
  "count" bigint NOT NULL CHECK(count>=0),
  "geometry_verified" bigint NOT NULL CHECK(geometry_verified IN (0,1)),
  "current_boundary_certification" bigint CHECK(current_boundary_certification IN (0,1)),
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id,edition_kind),
  CHECK((edition_kind='dated' AND base_date IS NOT NULL AND administrative_candidate_date IS NULL AND checked_at IS NULL AND current_boundary_certification IS NOT NULL) OR (edition_kind='currentCorrespondence' AND base_date IS NULL AND administrative_candidate_date IS NOT NULL AND checked_at IS NOT NULL AND current_boundary_certification IS NULL))
);
CREATE TABLE wiki."document_revision_text_territorial_source" (
  "revision_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "path" text NOT NULL,
  "sha256" text NOT NULL,
  "schema" text NOT NULL,
  PRIMARY KEY ("revision_id", "source_id", "json_pointer"),
  UNIQUE(revision_id,source_id)
);
CREATE TABLE wiki."effect" (
  "person_id" text NOT NULL,
  "trait_ordinal" bigint NOT NULL,
  "effect_ordinal" bigint NOT NULL CHECK(effect_ordinal>=0),
  "ability_id" text NOT NULL CHECK(ability_id IN ('leadership','strategy','negotiation','management','insight','learning','prowess','endurance')),
  "delta" bigint NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer ~ '^/profiles/[0-9].*/traits/[0-9].*/effects/[0-9].*$'),
  PRIMARY KEY ("person_id", "trait_ordinal", "effect_ordinal")
);
CREATE TABLE wiki."evidence" (
  "evidence_id" text NOT NULL,
  "person_id" text NOT NULL,
  "subject_kind" text NOT NULL CHECK(subject_kind IN ('role','attribute','trait','skill','language')),
  "subject_key" text,
  "subject_ordinal" bigint CHECK(subject_ordinal >= 0),
  "evidence_ordinal" bigint NOT NULL CHECK(evidence_ordinal >= 0),
  "source_id" bigint,
  "source_path" text,
  "json_pointer" text,
  "source_line" bigint CHECK(source_line > 0),
  "quote" text,
  "note_text" text,
  "match_status" text NOT NULL CHECK(match_status IN ('match','mismatch','missing-source','missing-pointer','uncited-note')),
  PRIMARY KEY ("evidence_id"),
  CHECK((match_status='uncited-note' AND source_path IS NULL AND quote IS NULL AND note_text IS NOT NULL)
     OR (match_status<>'uncited-note' AND source_path IS NOT NULL AND quote IS NOT NULL AND note_text IS NULL))
);
CREATE TABLE wiki."excluded_source" (
  "logical_path" text NOT NULL,
  "sha256" text NOT NULL CHECK(length(sha256)=64 AND sha256 !~ '^.*[^0-9a-f].*$'),
  "byte_length" bigint NOT NULL CHECK(byte_length>=0),
  "exclusion_reason" text NOT NULL CHECK(exclusion_reason IN (
    'private-character-system-contract',
    'private-editorial-sample',
    'private-editorial-scope-review',
    'private-editorial-owner-approval-pending',
    'private-soul-historical-motif'
  )),
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki."existing_name" (
  "ordinal" bigint CHECK(ordinal>=0),
  "name" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."existing_names_import" (
  "singleton" bigint CHECK(singleton=1),
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."family_birth_cohort" (
  "cohort_id" bigint,
  "start_year" bigint NOT NULL,
  "end_year" bigint NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("cohort_id")
);
CREATE TABLE wiki."family_birth_cohort_assignment" (
  "person_id" text NOT NULL,
  "cohort_id" bigint NOT NULL,
  "baseline_birth_date" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id")
);
CREATE TABLE wiki."family_birthday" (
  "person_id" text NOT NULL,
  "birth_date" text NOT NULL,
  "source_status" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id")
);
CREATE TABLE wiki."family_birthday_source" (
  "person_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "source_ref" text NOT NULL,
  PRIMARY KEY ("person_id", "ordinal")
);
CREATE TABLE wiki."family_edge" (
  "edge_id" text NOT NULL,
  "from_node_id" text NOT NULL,
  "to_node_id" text NOT NULL,
  "edge_type" text NOT NULL,
  "parent_role" text,
  "status" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("edge_id")
);
CREATE TABLE wiki."family_edge_source" (
  "edge_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "source_path" text NOT NULL,
  "source_anchor" text,
  PRIMARY KEY ("edge_id", "ordinal")
);
CREATE TABLE wiki."family_input_key_order" (
  "node_id" text NOT NULL,
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "key" text NOT NULL,
  PRIMARY KEY ("node_id", "object_path", "ordinal"),
  UNIQUE(node_id,object_path,key)
);
CREATE TABLE wiki."family_node" (
  "node_id" text NOT NULL,
  "person_id" text,
  "node_kind" text NOT NULL,
  "name" text NOT NULL,
  "name_en" text,
  "birth_date" text,
  "death_date" text,
  "status" text NOT NULL,
  "lineage_surname" text,
  "lineage_bongwan" text,
  "lineage_clan" text,
  "generation_exception_reason" text,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("node_id"),
  UNIQUE ("person_id")
);
CREATE TABLE wiki."family_node_source" (
  "node_id" text NOT NULL,
  "source_kind" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "source_path" text NOT NULL,
  "source_anchor" text,
  PRIMARY KEY ("node_id", "source_kind", "ordinal")
);
CREATE TABLE wiki."family_node_timeline" (
  "node_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "year" bigint NOT NULL,
  "summary" text NOT NULL,
  "summary_en" text,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("node_id", "ordinal")
);
CREATE TABLE wiki."family_parent_status" (
  "person_id" text NOT NULL,
  "status" text NOT NULL,
  "known_parent_id" text,
  "known_relationship" text,
  "source_ref_path" text NOT NULL,
  "source_ref_anchor" text,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id")
);
CREATE TABLE wiki."family_role_confirmed_father_role" (
  "ordinal" bigint CHECK(ordinal>=0),
  "from" text NOT NULL,
  "to" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."family_role_decision" (
  "decision_group" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "edge_id" text,
  "from_node_id" text,
  "to_node_id" text,
  "parent_role" text,
  "decision_kind" text,
  "category" text,
  "source_status" text,
  "basis" text,
  "selection_ref" text,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("decision_group", "ordinal")
);
CREATE TABLE wiki."family_role_decision_fact" (
  "decision_group" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "field_path" text NOT NULL,
  "value_kind" text NOT NULL CHECK(value_kind IN ('null','string','number','boolean')),
  "text_value" text,
  "integer_value" bigint,
  "boolean_value" bigint CHECK(boolean_value IN (0,1)),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("decision_group", "ordinal", "field_path")
);
CREATE TABLE wiki."family_role_decision_source" (
  "decision_group" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "ref_ordinal" bigint NOT NULL CHECK(ref_ordinal>=0),
  "source_path" text NOT NULL,
  "source_anchor" text,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("decision_group", "ordinal", "ref_ordinal")
);
CREATE TABLE wiki."family_role_derived_parent_role" (
  "ordinal" bigint CHECK(ordinal>=0),
  "edge_id" text NOT NULL,
  "from" text NOT NULL,
  "to" text NOT NULL,
  "parent_role" text NOT NULL,
  "lineage_surname" text,
  "lineage_bongwan" text,
  "lineage_clan" text,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."family_role_document_import" (
  "singleton" bigint CHECK(singleton=1),
  "source_sha256" text NOT NULL,
  "document_sha256" text NOT NULL,
  "schema_version" bigint NOT NULL,
  "authorization" text NOT NULL,
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."family_role_document_key" (
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  PRIMARY KEY ("object_path", "ordinal"),
  UNIQUE(object_path,key)
);
CREATE TABLE wiki."family_role_external_ancestor_node_reference" (
  "parent_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "reference" text NOT NULL,
  PRIMARY KEY ("parent_ordinal", "ordinal")
);
CREATE TABLE wiki."family_role_external_ancestor_source" (
  "parent_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "path" text NOT NULL,
  "anchor" text,
  PRIMARY KEY ("parent_ordinal", "ordinal")
);
CREATE TABLE wiki."family_role_external_ancestor_timeline" (
  "parent_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "pointer" text NOT NULL,
  "before" text NOT NULL,
  "proposed_after" text NOT NULL,
  PRIMARY KEY ("parent_ordinal", "ordinal")
);
CREATE TABLE wiki."family_role_external_maternal_ancestor" (
  "ordinal" bigint CHECK(ordinal>=0),
  "node_id" text NOT NULL,
  "child_id" text NOT NULL,
  "edge_id" text NOT NULL,
  "before_name" text NOT NULL,
  "before_lineage" text CHECK(before_lineage IS NULL),
  "proposed_after_name" text NOT NULL,
  "proposed_after_surname" text NOT NULL,
  "proposed_after_bongwan" text NOT NULL,
  "proposed_after_clan" text NOT NULL,
  "given_name" text NOT NULL,
  "birth_date" text NOT NULL,
  "death_date" text CHECK(death_date IS NULL),
  "existing_role" text,
  "proposed_role" text NOT NULL,
  "source_status" text NOT NULL,
  "name_collision" bigint NOT NULL CHECK(name_collision IN (0,1)),
  "name_collision_meaning" text NOT NULL,
  "mother_id" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."family_role_final_owner_role" (
  "ordinal" bigint CHECK(ordinal>=0),
  "edge_id" text NOT NULL,
  "from" text NOT NULL,
  "to" text NOT NULL,
  "parent_role" text NOT NULL,
  "decision_kind" text NOT NULL,
  "selection_ref" text NOT NULL,
  "basis" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."family_role_maternal_correction" (
  "ordinal" bigint CHECK(ordinal>=0),
  "child_id" text NOT NULL,
  "father_id" text NOT NULL,
  "mother_id" text NOT NULL,
  "before_mother_name" text NOT NULL,
  "before_mother_surname" text NOT NULL,
  "before_mother_bongwan" text CHECK(before_mother_bongwan IS NULL),
  "after_mother_name" text NOT NULL,
  "after_mother_surname" text NOT NULL,
  "after_mother_bongwan" text NOT NULL,
  "after_mother_clan" text NOT NULL,
  "father_line_surname" text NOT NULL,
  "father_line_bongwan" text NOT NULL,
  "father_line_clan" text NOT NULL,
  "basis" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."family_role_owner_role_only" (
  "ordinal" bigint CHECK(ordinal>=0),
  "edge_id" text NOT NULL,
  "from" text NOT NULL,
  "to" text NOT NULL,
  "parent_role" text NOT NULL,
  "basis" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."family_role_recursive_ancestor_correction" (
  "ordinal" bigint CHECK(ordinal>=0),
  "edge_id" text NOT NULL,
  "from" text NOT NULL,
  "to" text NOT NULL,
  "before" text CHECK(before IS NULL),
  "after" text NOT NULL,
  "category" text NOT NULL,
  "lineage_surname" text NOT NULL,
  "lineage_bongwan" text NOT NULL,
  "lineage_clan" text NOT NULL,
  "basis" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."family_role_recursive_ancestor_source" (
  "parent_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "path" text NOT NULL,
  "anchor" text,
  PRIMARY KEY ("parent_ordinal", "ordinal")
);
CREATE TABLE wiki."family_role_source_bound_correction" (
  "ordinal" bigint CHECK(ordinal>=0),
  "edge_id" text NOT NULL,
  "from" text NOT NULL,
  "to" text NOT NULL,
  "before" text CHECK(before IS NULL),
  "after" text NOT NULL,
  "category" text NOT NULL,
  "basis" text,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."family_role_source_bound_source" (
  "parent_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "path" text NOT NULL,
  "anchor" text,
  PRIMARY KEY ("parent_ordinal", "ordinal")
);
CREATE TABLE wiki."family_source_document_dependency" (
  "ordinal" bigint CHECK(ordinal>=0),
  "source_path" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."family_source_document_import" (
  "singleton" bigint CHECK(singleton=1),
  "source_id" bigint NOT NULL,
  "source_sha256" text NOT NULL,
  "document_sha256" text NOT NULL,
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."family_source_document_key" (
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  PRIMARY KEY ("object_path", "ordinal"),
  UNIQUE(object_path,key)
);
CREATE TABLE wiki."family_source_metadata" (
  "source_id" bigint NOT NULL,
  "field_name" text NOT NULL,
  "value_kind" text NOT NULL CHECK(value_kind IN ('null','string','number','boolean')),
  "text_value" text,
  "integer_value" bigint,
  "boolean_value" bigint CHECK(boolean_value IN (0,1)),
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("source_id", "field_name")
);
CREATE TABLE wiki."family_tree" (
  "tree_id" text NOT NULL,
  "collapse_year" bigint NOT NULL,
  "reference_date" text NOT NULL,
  "status" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("tree_id")
);
CREATE TABLE wiki."family_tree_source" (
  "tree_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "source_path" text NOT NULL,
  PRIMARY KEY ("tree_id", "ordinal")
);
CREATE TABLE wiki."feudal_allocation_input_import" (
  "singleton" bigint CHECK(singleton=1),
  "source_id" bigint NOT NULL,
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64),
  "document_sha256" text NOT NULL CHECK(length(document_sha256)=64),
  "domain_sha256" text NOT NULL CHECK(length(domain_sha256)=64),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."feudal_allocation_input_key" (
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  "is_null" bigint NOT NULL CHECK(is_null IN (0,1)),
  PRIMARY KEY ("object_path", "ordinal"),
  UNIQUE(object_path,key)
);
CREATE TABLE wiki."feudal_allocation_input_root" (
  "singleton" bigint CHECK(singleton=1),
  "source_schema" text NOT NULL,
  "opening_year" bigint NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."geography_archive" (
  "singleton" bigint CHECK(singleton=1),
  "bytes" bytea NOT NULL,
  "sha256" text NOT NULL,
  "actor" text NOT NULL,
  "reason" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."geography_county" (
  "edition" text NOT NULL CHECK(edition IN ('dated','current')),
  "countyTitleId" text NOT NULL,
  "ordinal" bigint NOT NULL,
  PRIMARY KEY ("edition", "countyTitleId"),
  UNIQUE(edition,ordinal)
);
CREATE TABLE wiki."geography_edition" (
  "kind" text NOT NULL,
  "id" text NOT NULL,
  "electionDate" text,
  "seoulCompositionMatchesCurrentAppendix" bigint CHECK("seoulCompositionMatchesCurrentAppendix" IN (0,1)),
  "lawNumber" bigint,
  "promulgatedDate" text,
  "effectiveDate" text,
  "appendixAmendedDate" text,
  "appendixFileSeq" bigint,
  "administrativeCandidateDate" text,
  "officialMembershipCheckedAt" text,
  "codeAndNameSourceRef" text,
  "geometryVerified" bigint CHECK("geometryVerified" IN (0,1)),
  PRIMARY KEY ("kind"),
  UNIQUE ("id")
);
CREATE TABLE wiki."geography_edition_source" (
  "kind" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "ref" text NOT NULL,
  PRIMARY KEY ("kind", "ordinal")
);
CREATE TABLE wiki."geography_evidence" (
  "kind" text NOT NULL,
  "path" text NOT NULL,
  "sha256" text NOT NULL,
  PRIMARY KEY ("kind")
);
CREATE TABLE wiki."geography_map_title" (
  "ordinal" bigint,
  "ref" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."geography_metadata" (
  "singleton" bigint CHECK(singleton=1),
  "schema" text NOT NULL,
  "status" text NOT NULL,
  "officialExtentStatus" text NOT NULL,
  "kingdomStatus" text NOT NULL,
  "mapMinimumRank" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."geography_partition" (
  "titleId" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "proposalId" text NOT NULL,
  "name" text NOT NULL,
  PRIMARY KEY ("titleId"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki."geography_partition_county" (
  "titleId" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "ref" text NOT NULL,
  PRIMARY KEY ("titleId", "ordinal")
);
CREATE TABLE wiki."geography_partition_jurisdiction" (
  "titleId" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "ref" text NOT NULL,
  PRIMARY KEY ("titleId", "ordinal")
);
CREATE TABLE wiki."geography_seal" (
  "singleton" bigint CHECK(singleton=1),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."geography_selection_document_document" (
  "document_id" bigint CHECK (document_id = 1),
  "source_sha256" text NOT NULL CHECK (length(source_sha256) = 64),
  "document_sha256" text NOT NULL CHECK (length(document_sha256) = 64),
  "as_of" text NOT NULL,
  "selected_source_id" text NOT NULL,
  "selected_path" text NOT NULL,
  "selected_sha256" text NOT NULL,
  "selected_source_url" text NOT NULL,
  "selected_source_effective_date" text NOT NULL,
  "selected_publication_commit_date" text NOT NULL,
  "selected_retrieved_on" text NOT NULL,
  "selected_source_crs" text NOT NULL,
  "selected_measurement_crs" text NOT NULL,
  "selected_authority" text NOT NULL,
  "selected_license" text NOT NULL,
  "selected_attribution" text NOT NULL,
  "selected_filter" text NOT NULL,
  "selected_source_regions" bigint NOT NULL,
  "selected_source_districts" bigint NOT NULL,
  "selected_union_area_m2" text NOT NULL,
  "selected_overlap_excess_m2" text NOT NULL,
  "selected_cleanup_policy" text NOT NULL,
  "selected_coverage_tolerance_m2" text NOT NULL,
  "selected_precision_policy" text NOT NULL,
  "comparison_source_id" text NOT NULL,
  "comparison_source_root" text NOT NULL,
  "comparison_path" text NOT NULL,
  "comparison_sha256" text NOT NULL,
  "comparison_effective_year" bigint NOT NULL,
  "comparison_current_boundary" bigint NOT NULL CHECK (comparison_current_boundary IN (0, 1)),
  "comparison_policy" text NOT NULL,
  "osm_path" text NOT NULL,
  "osm_sha256" text NOT NULL,
  "osm_snapshot_at" text NOT NULL,
  "osm_snapshot_basis" text NOT NULL,
  "osm_modified_at" text NOT NULL,
  "osm_acquired_at" text NOT NULL,
  "osm_complete_official_roster" bigint NOT NULL CHECK (osm_complete_official_roster IN (0, 1)),
  "osm_policy" text NOT NULL,
  "terrain_source_object_modified_precision" text NOT NULL,
  "terrain_source_object_modified_month" text NOT NULL,
  "terrain_observation_date" text,
  "terrain_observation_date_reason" text NOT NULL,
  "terrain_policy" text NOT NULL,
  "fictional_epoch_id" text NOT NULL,
  "fictional_epoch_source" text NOT NULL,
  "fictional_epoch_label" text NOT NULL,
  "fictional_epoch_absolute_date" text,
  "extended_source_id" text NOT NULL,
  "extended_sha256" text NOT NULL,
  "extended_retrieved_on" text NOT NULL,
  "extended_filter" text NOT NULL,
  "extended_dong_total" bigint NOT NULL,
  "extended_policy" text NOT NULL,
  "decision_kind" text NOT NULL,
  "reason" text NOT NULL,
  "actor" text NOT NULL CHECK (length(trim(actor)) > 0),
  "import_reason" text NOT NULL CHECK (length(trim(import_reason)) > 0),
  "receipt_sha256" text NOT NULL CHECK (length(receipt_sha256) = 64),
  PRIMARY KEY ("document_id"),
  CHECK (terrain_observation_date IS NULL),
  CHECK (fictional_epoch_absolute_date IS NULL)
);
CREATE TABLE wiki."geography_selection_document_key" (
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "key" text NOT NULL,
  PRIMARY KEY ("object_path", "ordinal")
);
CREATE TABLE wiki."geography_selection_document_region" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "sidonm" text NOT NULL,
  "sido" text NOT NULL,
  "districts" bigint NOT NULL,
  "dong" bigint NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."geography_slot" (
  "edition" text NOT NULL,
  "countyTitleId" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "slotId" text NOT NULL,
  "dongId" text NOT NULL,
  "name" text NOT NULL,
  "jurisdictionGuRef" text NOT NULL,
  "electoralDongId" text NOT NULL,
  "fragmentId" text,
  "sourceEdition" text NOT NULL,
  "sourcePointer" text NOT NULL,
  "geometryVerified" bigint NOT NULL CHECK("geometryVerified" IN (0,1)),
  "status" text NOT NULL,
  "holderPersonId" text,
  PRIMARY KEY ("edition", "slotId"),
  UNIQUE(edition,"countyTitleId",ordinal)
);
CREATE TABLE wiki."geography_slot_candidate_geometry" (
  "edition" text NOT NULL CHECK(edition='current'),
  "slotId" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "ref" text NOT NULL,
  PRIMARY KEY ("edition", "slotId", "ordinal")
);
CREATE TABLE wiki."geography_slot_correspondence" (
  "edition" text NOT NULL CHECK(edition='dated'),
  "slotId" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "targetEdition" text NOT NULL CHECK("targetEdition"='current'),
  "ref" text NOT NULL,
  PRIMARY KEY ("edition", "slotId", "ordinal")
);
CREATE TABLE wiki."geography_slot_geometry" (
  "edition" text NOT NULL,
  "slotId" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "ref" text NOT NULL,
  PRIMARY KEY ("edition", "slotId", "ordinal")
);
CREATE TABLE wiki."geography_slot_historical_holding" (
  "edition" text NOT NULL,
  "slotId" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "id" text NOT NULL,
  "sourcePath" text NOT NULL,
  "jsonPointer" text NOT NULL,
  "sourceSha256" text NOT NULL,
  "recordSha256" text NOT NULL,
  "scopeKind" text NOT NULL,
  "status" text NOT NULL,
  PRIMARY KEY ("edition", "slotId", "ordinal")
);
CREATE TABLE wiki."geography_slot_holding" (
  "edition" text NOT NULL,
  "slotId" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "ref" text NOT NULL,
  PRIMARY KEY ("edition", "slotId", "ordinal")
);
CREATE TABLE wiki."geography_slot_source" (
  "edition" text NOT NULL,
  "slotId" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "ref" text NOT NULL,
  PRIMARY KEY ("edition", "slotId", "ordinal")
);
CREATE TABLE wiki."geography_source_record" (
  "ordinal" bigint,
  "id" text NOT NULL,
  "sha256" text NOT NULL,
  "role" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("id")
);
CREATE TABLE wiki."geography_spatial" (
  "singleton" bigint CHECK(singleton=1),
  "edition" text NOT NULL,
  "baseDate" text NOT NULL,
  "authority" text NOT NULL,
  "legalSurveyCertification" bigint NOT NULL CHECK("legalSurveyCertification" IN (0,1)),
  "current2026Geometry" bigint NOT NULL CHECK("current2026Geometry" IN (0,1)),
  "archiveSha256" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."geography_spatial_geometry" (
  "singleton" bigint,
  "path" text NOT NULL,
  "sha256" text NOT NULL,
  "crs" text NOT NULL,
  "features" bigint NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."geography_successor" (
  "singleton" bigint CHECK(singleton=1),
  "schema" text NOT NULL,
  "batchId" text NOT NULL,
  "previousSha256" text NOT NULL,
  "beforeArchivePath" text NOT NULL,
  "partitionSha256" text NOT NULL,
  "crossDistrictParentPolicy" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."geography_successor_pointer" (
  "kind" text NOT NULL CHECK(kind IN ('proposal','approval')),
  "path" text NOT NULL,
  "sha256" text NOT NULL,
  PRIMARY KEY ("kind")
);
CREATE TABLE wiki."geography_title" (
  "titleId" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "rank" text NOT NULL CHECK(rank IN ('empire','kingdom','duchy','county')),
  "name" text NOT NULL,
  "sourcePointer" text NOT NULL,
  "feudalParentTitleId" text,
  "feudalParentStatus" text NOT NULL,
  "geographicParentException" text,
  "hasCountyTitleIds" bigint NOT NULL CHECK("hasCountyTitleIds" IN (0,1)),
  "hasHolderPersonId" bigint NOT NULL CHECK("hasHolderPersonId" IN (0,1)),
  "holderPersonId" text,
  PRIMARY KEY ("titleId"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki."geography_title_county" (
  "titleId" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "ref" text NOT NULL,
  PRIMARY KEY ("titleId", "ordinal")
);
CREATE TABLE wiki."geography_title_jurisdiction" (
  "titleId" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "ref" text NOT NULL,
  PRIMARY KEY ("titleId", "ordinal")
);
CREATE TABLE wiki."geography_title_source" (
  "titleId" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "ref" text NOT NULL,
  PRIMARY KEY ("titleId", "ordinal")
);
CREATE TABLE wiki."glossary_alias" (
  "revision_id" text NOT NULL,
  "term_id" text NOT NULL,
  "locale" text NOT NULL CHECK(locale IN ('ko','en')),
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "alias" text NOT NULL CHECK(length(trim(alias))>0),
  PRIMARY KEY ("revision_id", "term_id", "locale", "ordinal")
);
CREATE TABLE wiki."glossary_archive" (
  "singleton" bigint CHECK(singleton=1),
  "approved_bytes" bytea NOT NULL,
  "sha256" text NOT NULL CHECK(length(sha256)=64),
  "provenance_label" text NOT NULL CHECK(length(trim(provenance_label))>0),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."glossary_context" (
  "revision_id" text NOT NULL,
  "term_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "context" text NOT NULL CHECK(context IN ('all','dialogue','informal')),
  PRIMARY KEY ("revision_id", "term_id", "ordinal")
);
CREATE TABLE wiki."glossary_head" (
  "singleton" bigint CHECK(singleton=1),
  "revision_id" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."glossary_locale" (
  "revision_id" text NOT NULL,
  "term_id" text NOT NULL,
  "locale" text NOT NULL CHECK(locale IN ('ko','en')),
  "display_name" text NOT NULL CHECK(length(trim(display_name))>0),
  "reader_definition" text NOT NULL CHECK(length(trim(reader_definition))>0),
  PRIMARY KEY ("revision_id", "term_id", "locale")
);
CREATE TABLE wiki."glossary_owner_reference" (
  "revision_id" text NOT NULL,
  "document_identity" text NOT NULL CHECK(length(trim(document_identity))>0),
  "provenance_label" text NOT NULL CHECK(length(trim(provenance_label))>0),
  PRIMARY KEY ("revision_id", "document_identity")
);
CREATE TABLE wiki."glossary_revision" (
  "revision_id" text NOT NULL,
  "parent_revision" text,
  "sequence" bigint NOT NULL CHECK(sequence>=0),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  "created_at" text NOT NULL,
  "content_sha256" text NOT NULL CHECK(length(content_sha256)=64),
  PRIMARY KEY ("revision_id"),
  UNIQUE ("sequence")
);
CREATE TABLE wiki."glossary_revision_seal" (
  "revision_id" text NOT NULL,
  PRIMARY KEY ("revision_id")
);
CREATE TABLE wiki."glossary_term" (
  "revision_id" text NOT NULL,
  "term_id" text NOT NULL CHECK(length(trim(term_id))>0),
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "category" text NOT NULL CHECK(category IN ('state','organization','person_category','technology','equipment','geography','event','ailment')),
  "status" text NOT NULL CHECK(status IN ('fact-public','fiction-original','generic-unregistered')),
  "owner_document_identity" text NOT NULL,
  PRIMARY KEY ("revision_id", "term_id"),
  UNIQUE(revision_id,ordinal)
);
CREATE TABLE wiki."gurps_advantage" (
  "person_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal >= 0),
  "name" text NOT NULL,
  "cp" bigint NOT NULL,
  "effect" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id", "ordinal")
);
CREATE TABLE wiki."gurps_attribute" (
  "person_id" text NOT NULL,
  "attribute_code" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal >= 0),
  "value" bigint NOT NULL,
  "cp" bigint NOT NULL,
  "rule" text,
  PRIMARY KEY ("person_id", "attribute_code"),
  UNIQUE(person_id,ordinal)
);
CREATE TABLE wiki."gurps_disadvantage" (
  "person_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal >= 0),
  "name" text NOT NULL,
  "cp" bigint NOT NULL,
  "effect" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id", "ordinal")
);
CREATE TABLE wiki."gurps_language" (
  "person_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal >= 0),
  "name" text NOT NULL,
  "level" text,
  "cp" bigint NOT NULL,
  PRIMARY KEY ("person_id", "ordinal")
);
CREATE TABLE wiki."gurps_profile" (
  "person_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "state_id" text,
  "url" text,
  "status" text NOT NULL,
  "method" text,
  "role_display" text,
  "band" text,
  "baseline" bigint NOT NULL CHECK(baseline IN (0,1)),
  "attributes" bigint NOT NULL,
  "advantages" bigint NOT NULL,
  "disadvantages" bigint NOT NULL,
  "skills" bigint NOT NULL,
  "spent" bigint NOT NULL,
  "unspent" bigint NOT NULL,
  "total" bigint NOT NULL,
  "territory_presence" text NOT NULL CHECK(territory_presence IN ('absent','null','present')),
  "unit_presence" text NOT NULL CHECK(unit_presence IN ('absent','null','present')),
  "wandering_force_presence" text NOT NULL CHECK(wandering_force_presence IN ('absent','null','present')),
  "advantages_presence" text NOT NULL CHECK(advantages_presence IN ('absent','null','present')),
  "disadvantages_presence" text NOT NULL CHECK(disadvantages_presence IN ('absent','null','present')),
  PRIMARY KEY ("person_id")
);
CREATE TABLE wiki."gurps_secondary" (
  "person_id" text NOT NULL,
  "stat_name" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal >= 0),
  "value" double precision NOT NULL,
  PRIMARY KEY ("person_id", "stat_name"),
  UNIQUE(person_id,ordinal)
);
CREATE TABLE wiki."gurps_skill" (
  "person_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal >= 0),
  "name" text NOT NULL,
  "name_ko" text,
  "attribute_code" text,
  "difficulty" text,
  "difficulty_source" text NOT NULL CHECK(difficulty_source IN ('diff','difficulty')),
  "tier" text,
  "cp" bigint NOT NULL,
  "level" bigint NOT NULL,
  "effect" text,
  "evidence_presence" text NOT NULL CHECK(evidence_presence IN ('absent','null','present')),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id", "ordinal")
);
CREATE TABLE wiki."gurps_territory" (
  "person_id" text NOT NULL,
  "fief_name" text NOT NULL,
  "type" text NOT NULL,
  "station" text NOT NULL,
  "state_id" text NOT NULL,
  "settlement_name" text NOT NULL,
  "settlement_type" text NOT NULL,
  "settlement_description" text NOT NULL,
  "note" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id")
);
CREATE TABLE wiki."gurps_trait" (
  "person_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal >= 0),
  "name" text NOT NULL,
  "kind" text,
  "rule" text,
  "level" double precision,
  "people" double precision,
  "frequency" double precision,
  "cp" bigint NOT NULL,
  "page" text,
  "effect" text,
  "reaction_presence" text NOT NULL CHECK(reaction_presence IN ('absent','null','present')),
  "reaction_ordinary_observers" bigint,
  "reaction_attracted_observers" bigint,
  "reaction_application" text,
  "boundaries_presence" text NOT NULL CHECK(boundaries_presence IN ('absent','null','present')),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id", "ordinal")
);
CREATE TABLE wiki."gurps_trait_application_boundary" (
  "person_id" text NOT NULL,
  "trait_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal >= 0),
  "text" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id", "trait_ordinal", "ordinal")
);
CREATE TABLE wiki."gurps_unit" (
  "person_id" text NOT NULL,
  "type" text,
  "type_presence" text NOT NULL CHECK(type_presence IN ('absent','null','present')),
  "size" bigint NOT NULL,
  "quality" text NOT NULL,
  "note" text NOT NULL,
  "scale_state_id" text NOT NULL,
  "scale_tier" text NOT NULL,
  "scale_factor" double precision NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id")
);
CREATE TABLE wiki."gurps_unit_composition" (
  "person_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal >= 0),
  "text" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id", "ordinal")
);
CREATE TABLE wiki."gurps_wandering_facility" (
  "person_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal >= 0),
  "text" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id", "ordinal")
);
CREATE TABLE wiki."gurps_wandering_force" (
  "person_id" text NOT NULL,
  "type" text NOT NULL,
  "size" bigint NOT NULL,
  "current_location" text NOT NULL,
  "note" text NOT NULL,
  "camp_name" text NOT NULL,
  "camp_type" text NOT NULL,
  "camp_description" text NOT NULL,
  "camp_pack_up_time" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id")
);
CREATE TABLE wiki."hangnyeol_systems_document" (
  "document_id" bigint CHECK(document_id=1),
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64),
  "id" text NOT NULL,
  "schema" bigint NOT NULL,
  "note" text NOT NULL,
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  "receipt_sha256" text NOT NULL CHECK(length(receipt_sha256)=64),
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."hangnyeol_systems_position" (
  "system_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "position" text NOT NULL,
  PRIMARY KEY ("system_ordinal", "ordinal")
);
CREATE TABLE wiki."hangnyeol_systems_sequence" (
  "system_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "token" text NOT NULL,
  PRIMARY KEY ("system_ordinal", "ordinal")
);
CREATE TABLE wiki."hangnyeol_systems_source" (
  "ordinal" bigint CHECK(ordinal>=0),
  "document_id" bigint NOT NULL,
  "id" text NOT NULL,
  "record_id_present" bigint NOT NULL CHECK(record_id_present IN (0,1)),
  "record_id" text,
  "url" text NOT NULL,
  "accessed" text NOT NULL,
  "quote" text NOT NULL,
  "evidence" text NOT NULL,
  "live_check" text NOT NULL,
  "live_check_ref_present" bigint NOT NULL CHECK(live_check_ref_present IN (0,1)),
  "live_check_ref" text,
  "unchecked_reason_present" bigint NOT NULL CHECK(unchecked_reason_present IN (0,1)),
  "unchecked_reason" text,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("id"),
  CHECK(record_id_present=1 OR record_id IS NULL),
  CHECK(live_check_ref_present=1 OR live_check_ref IS NULL),
  CHECK(unchecked_reason_present=1 OR unchecked_reason IS NULL)
);
CREATE TABLE wiki."hangnyeol_systems_system" (
  "ordinal" bigint CHECK(ordinal>=0),
  "document_id" bigint NOT NULL,
  "id" text NOT NULL,
  "name" text NOT NULL,
  "summary" text NOT NULL,
  "sequence_present" bigint NOT NULL CHECK(sequence_present IN (0,1)),
  "carrier_present" bigint NOT NULL CHECK(carrier_present IN (0,1)),
  "carrier" text,
  "positions_present" bigint NOT NULL CHECK(positions_present IN (0,1)),
  PRIMARY KEY ("ordinal"),
  UNIQUE ("id"),
  CHECK(sequence_present=1 OR carrier_present=0),
  CHECK(carrier_present=1 OR carrier IS NULL)
);
CREATE TABLE wiki."hangnyeol_systems_system_source" (
  "system_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "source_id" text NOT NULL,
  PRIMARY KEY ("system_ordinal", "ordinal")
);
CREATE TABLE wiki."health" (
  "person_id" text NOT NULL,
  "status_presence" text NOT NULL CHECK(status_presence IN ('missing','null','value')),
  "status" text,
  "json_pointer" text NOT NULL CHECK(json_pointer ~ '^/profiles/[0-9].*/health$'),
  PRIMARY KEY ("person_id"),
  CHECK((status_presence='value' AND status IS NOT NULL) OR (status_presence IN ('missing','null') AND status IS NULL))
);
CREATE TABLE wiki."historical_feudal_binding" (
  "holding_id" text NOT NULL,
  "title_id" text NOT NULL,
  "liege_relationship_kind" text,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("holding_id")
);
CREATE TABLE wiki."historical_feudal_grant" (
  "grant_id" text NOT NULL,
  "name_ko" text NOT NULL,
  "name_en" text,
  "holder_person_id" text NOT NULL,
  "liege_person_id" text,
  "polity_id" text NOT NULL,
  "title_id" text NOT NULL,
  "geometry_source" text,
  "territorial_scale" text,
  "formal_title_rank" text,
  "current_validity" text NOT NULL CHECK(current_validity='superseded_pre_seoul_rebase'),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("grant_id")
);
CREATE TABLE wiki."historical_feudal_grant_admin" (
  "grant_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "admin_unit_id" text NOT NULL,
  "admin_unit_name" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("grant_id", "ordinal")
);
CREATE TABLE wiki."historical_feudal_grant_component" (
  "grant_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "admin_unit_id" text NOT NULL,
  "component_index" bigint NOT NULL CHECK(component_index>=0),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("grant_id", "ordinal")
);
CREATE TABLE wiki."historical_feudal_jurisdiction" (
  "title_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "admin_unit_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("title_id", "ordinal")
);
CREATE TABLE wiki."historical_feudal_title" (
  "title_id" text NOT NULL,
  "name" text NOT NULL,
  "rank" text NOT NULL,
  "holder_person_id" text NOT NULL,
  "polity_id" text NOT NULL,
  "parent_title_id" text,
  "current_validity" text NOT NULL CHECK(current_validity='superseded_pre_seoul_rebase'),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("title_id")
);
CREATE TABLE wiki."historical_outside_person_control" (
  "admin_unit_id" text NOT NULL,
  "holder_person_id" text NOT NULL,
  "liege_person_id" text,
  "authority_kind" text,
  "authority_state_id" text,
  "authority_name" text,
  "current_validity" text NOT NULL CHECK(current_validity='superseded_outside_seoul'),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("admin_unit_id")
);
CREATE TABLE wiki."historical_source_scope" (
  "source_id" bigint,
  "logical_path" text NOT NULL,
  "source_schema" text NOT NULL,
  "classification" text NOT NULL CHECK(classification IN ('superseded_pre_seoul_rebase','superseded_outside_seoul','inspection_only_no_person_right')),
  "record_count" bigint NOT NULL CHECK(record_count>=0),
  "person_link_count" bigint NOT NULL CHECK(person_link_count>=0 AND person_link_count<=record_count),
  "json_pointer" text NOT NULL CHECK(json_pointer=''),
  PRIMARY KEY ("source_id"),
  UNIQUE ("logical_path")
);
CREATE TABLE wiki."household_court" (
  "court_id" text NOT NULL,
  "owner_person_id" text NOT NULL,
  "state_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("court_id")
);
CREATE TABLE wiki."household_court_retainer" (
  "court_id" text NOT NULL,
  "person_id" text NOT NULL,
  "liege_person_id" text NOT NULL,
  "source_row" bigint NOT NULL,
  "role" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("court_id", "person_id", "source_row", "json_pointer")
);
CREATE TABLE wiki."household_court_retainer_source" (
  "court_id" text NOT NULL,
  "person_id" text NOT NULL,
  "source_row" bigint NOT NULL,
  "retainer_json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "source_path" text NOT NULL,
  "source_anchor" text,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("court_id", "person_id", "source_row", "retainer_json_pointer", "ordinal")
);
CREATE TABLE wiki."household_humanoid_context" (
  "actor_id" text NOT NULL,
  "custodian_person_id" text NOT NULL,
  "steward_house_id" text NOT NULL,
  "scope" text NOT NULL,
  "assignment_action" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("actor_id")
);
CREATE TABLE wiki."household_humanoid_context_source" (
  "actor_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "source_path" text NOT NULL,
  "source_anchor" text,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("actor_id", "ordinal")
);
CREATE TABLE wiki."household_link" (
  "link_id" text NOT NULL,
  "owner_person_id" text NOT NULL,
  "recipient_person_id" text,
  "recipient_node_id" text,
  "recipient_key" text NOT NULL,
  "recipient_kind" text NOT NULL,
  "link_type" text NOT NULL,
  "direction" text,
  "role" text NOT NULL,
  "status" text NOT NULL,
  "basis" text,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("link_id"),
  CHECK((CASE WHEN recipient_person_id IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN recipient_node_id IS NOT NULL THEN 1 ELSE 0 END)=1)
);
CREATE TABLE wiki."household_link_source" (
  "link_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "source_path" text NOT NULL,
  "source_anchor" text,
  PRIMARY KEY ("link_id", "ordinal")
);
CREATE TABLE wiki."household_manifest" (
  "manifest_id" text NOT NULL,
  "status" text NOT NULL,
  "scope_kind" text NOT NULL,
  "isolated_at_audit" bigint NOT NULL,
  "all_isolated_authored" bigint NOT NULL CHECK(all_isolated_authored IN (0,1)),
  "quantity_mode" text NOT NULL,
  "court_count" bigint NOT NULL,
  "direct_retainer_count" bigint NOT NULL,
  "quantity_source" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("manifest_id")
);
CREATE TABLE wiki."household_person" (
  "person_id" text NOT NULL,
  "name" text NOT NULL,
  "person_faith_status" text NOT NULL,
  "house_faith_status" text NOT NULL,
  "humanoid_admission" text NOT NULL,
  "gender_preference" text NOT NULL,
  "political_position" text NOT NULL,
  "normalized_social_contact" bigint NOT NULL CHECK(normalized_social_contact IN (0,1)),
  "family_parent" bigint NOT NULL CHECK(family_parent IN (0,1)),
  "faith_unresolved" bigint NOT NULL CHECK(faith_unresolved IN (0,1)),
  "private_retainer_status" text,
  "background_contact_authoring" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("person_id")
);
CREATE TABLE wiki."household_person_source" (
  "person_id" text NOT NULL,
  "source_kind" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "source_path" text NOT NULL,
  "source_anchor" text,
  PRIMARY KEY ("person_id", "source_kind", "ordinal")
);
CREATE TABLE wiki."household_policy_document" (
  "document_id" bigint CHECK(document_id=1),
  "source_sha256" text NOT NULL,
  "schema" text NOT NULL,
  "approval_ref" text NOT NULL,
  "counts" text NOT NULL,
  "tier_quotas" text CHECK(tier_quotas IS NULL),
  "faith_evidence" text NOT NULL,
  "unknown_orientation" text NOT NULL,
  "other_known_orientation_gender" text NOT NULL,
  "existing_gender" text NOT NULL,
  "facility_custody" text NOT NULL,
  "seed_key" text NOT NULL,
  "sexual_relationship" text NOT NULL,
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  "receipt_sha256" text NOT NULL,
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."household_policy_faith_state" (
  "ordinal" bigint CHECK(ordinal>=0),
  "faith_state" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."household_policy_known_orientation" (
  "ordinal" bigint CHECK(ordinal>=0),
  "orientation" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."household_policy_political_position" (
  "entity_key" text NOT NULL,
  "position" text NOT NULL,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("entity_key")
);
CREATE TABLE wiki."household_policy_position" (
  "ordinal" bigint CHECK(ordinal>=0),
  "entity_key" text NOT NULL,
  "position" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("entity_key")
);
CREATE TABLE wiki."household_policy_position_context" (
  "ordinal" bigint CHECK(ordinal>=0),
  "entity_key" text NOT NULL,
  "kind" text NOT NULL,
  "current_scope" text NOT NULL,
  "rights_basis_path" text NOT NULL,
  "rights_basis_json_pointer" text NOT NULL,
  "rights_basis_approval_ref" text NOT NULL,
  "rights_limit" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("entity_key")
);
CREATE TABLE wiki."household_policy_priority" (
  "ordinal" bigint CHECK(ordinal>=0),
  "priority" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."household_policy_source" (
  "ordinal" bigint CHECK(ordinal>=0),
  "source_path" text NOT NULL,
  "source_anchor" text,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."household_policy_source_ref" (
  "ordinal" bigint CHECK(ordinal>=0),
  "path" text NOT NULL,
  "anchor" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."household_policy_value" (
  "policy_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value_kind" text NOT NULL CHECK(value_kind IN ('null','string','number','boolean')),
  "text_value" text,
  "integer_value" bigint,
  "boolean_value" bigint CHECK(boolean_value IN (0,1)),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("policy_key", "ordinal"),
  CHECK((value_kind='null' AND text_value IS NULL AND integer_value IS NULL AND boolean_value IS NULL) OR (value_kind='string' AND text_value IS NOT NULL AND integer_value IS NULL AND boolean_value IS NULL) OR (value_kind='number' AND text_value IS NULL AND integer_value IS NOT NULL AND boolean_value IS NULL) OR (value_kind='boolean' AND text_value IS NULL AND integer_value IS NULL AND boolean_value IS NOT NULL))
);
CREATE TABLE wiki."identity_clan_catalog_provenance" (
  "source_id" bigint,
  "catalog_id" text NOT NULL,
  "schema_version" bigint NOT NULL CHECK(schema_version>=0),
  "note" text NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."identity_clan_research_source" (
  "research_source_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "record_id" text,
  "source_url" text NOT NULL,
  "accessed_on" text NOT NULL,
  "source_quote" text NOT NULL,
  "evidence_path" text NOT NULL,
  "live_check" text NOT NULL,
  "live_check_ref" text,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("research_source_id"),
  UNIQUE(source_id,ordinal)
);
CREATE TABLE wiki."identity_gender_category" (
  "source_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "category" text NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("source_id", "ordinal"),
  UNIQUE(source_id,category)
);
CREATE TABLE wiki."identity_gender_policy" (
  "source_id" bigint NOT NULL,
  "state_id" text NOT NULL,
  "population" bigint NOT NULL CHECK(population>=0),
  "female_ratio" double precision NOT NULL CHECK(female_ratio BETWEEN 0 AND 1),
  "female_count" bigint NOT NULL CHECK(female_count>=0),
  "male_count" bigint NOT NULL CHECK(male_count>=0),
  "observed_population" bigint NOT NULL CHECK(observed_population>=0),
  "observed_female_count" bigint NOT NULL CHECK(observed_female_count>=0),
  "observed_male_count" bigint NOT NULL CHECK(observed_male_count>=0),
  "alignment_status" text NOT NULL CHECK(alignment_status IN ('matches-current','differs-current')),
  "reason" text NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("state_id"),
  CHECK(female_count+male_count=population),
  CHECK(observed_female_count+observed_male_count=observed_population),
  CHECK((alignment_status='matches-current')=(population=observed_population AND female_count=observed_female_count AND male_count=observed_male_count))
);
CREATE TABLE wiki."identity_gender_provenance" (
  "source_id" bigint,
  "schema_name" text NOT NULL,
  "person_count" bigint NOT NULL CHECK(person_count>=0),
  "owner_decision" text NOT NULL,
  "assignment_method" text NOT NULL,
  "decision_scope" text NOT NULL CHECK(decision_scope='category-and-assignment-policy-only'),
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."identity_lineage_provenance" (
  "source_id" bigint,
  "catalog_id" text NOT NULL,
  "schema_version" bigint NOT NULL CHECK(schema_version>=0),
  "note" text NOT NULL,
  "assignment_method" text NOT NULL,
  "lineage_notes" text NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."identity_registry_provenance" (
  "source_id" bigint,
  "schema_name" text NOT NULL,
  "total_people" bigint NOT NULL CHECK(total_people>=0),
  "existing_k_count" bigint NOT NULL CHECK(existing_k_count>=0),
  "issued_count" bigint NOT NULL CHECK(issued_count>=0),
  "approved_by" text NOT NULL,
  "approved_at" text NOT NULL,
  "owner_ref" text NOT NULL,
  "input_sha256" text NOT NULL CHECK(length(input_sha256)=64),
  "candidates_sha256" text NOT NULL CHECK(length(candidates_sha256)=64),
  "approval_scope" text NOT NULL CHECK(approval_scope='registry-source-event-only'),
  "json_pointer" text NOT NULL,
  "approval_json_pointer" text NOT NULL,
  PRIMARY KEY ("source_id"),
  CHECK(existing_k_count+issued_count=total_people)
);
CREATE TABLE wiki."index_corridor_person" (
  "source_id" bigint NOT NULL,
  "table_anchor" text NOT NULL,
  "row_ordinal" bigint NOT NULL CHECK (row_ordinal >= 0),
  "person_id" text,
  "match_status" text NOT NULL CHECK (match_status IN ('exact_registry_name','documented_display_alias','unmatched')),
  "name_ko" text NOT NULL,
  "name_en" text NOT NULL,
  "corridor_ko" text NOT NULL,
  "corridor_en" text NOT NULL,
  "office_ko" text NOT NULL,
  "office_en" text NOT NULL,
  "conscription_ko" text NOT NULL,
  "conscription_en" text NOT NULL,
  "arms_access_ko" text NOT NULL,
  "arms_access_en" text NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("source_id", "table_anchor", "row_ordinal"),
  CHECK ((match_status='unmatched')=(person_id IS NULL))
);
CREATE TABLE wiki."index_document" (
  "source_id" bigint,
  "document_id" text NOT NULL,
  "logical_path" text NOT NULL,
  "source_status" text NOT NULL CHECK (source_status IN ('draft','approved')),
  "source_kind" text NOT NULL CHECK (source_kind = 'original-fiction'),
  "tense_ko" text NOT NULL,
  "tense_en" text NOT NULL,
  "temporal_scope" text NOT NULL CHECK (temporal_scope IN ('past_draft_index','draft_corridor_index','draft_state_label')),
  PRIMARY KEY ("source_id"),
  UNIQUE ("document_id"),
  UNIQUE ("logical_path")
);
CREATE TABLE wiki."index_issue" (
  "source_id" bigint NOT NULL,
  "issue_code" text NOT NULL,
  "issue_ordinal" bigint NOT NULL CHECK (issue_ordinal >= 0),
  "severity" text NOT NULL CHECK (severity IN ('warning','error')),
  "table_anchor" text,
  "row_ordinal" bigint CHECK (row_ordinal >= 0),
  "name_ko" text,
  "observed_count" bigint CHECK (observed_count >= 0),
  "stated_count" bigint CHECK (stated_count >= 0),
  "json_pointer" text NOT NULL,
  "message" text NOT NULL,
  PRIMARY KEY ("source_id", "issue_ordinal")
);
CREATE TABLE wiki."index_person" (
  "source_id" bigint NOT NULL,
  "table_anchor" text NOT NULL,
  "row_ordinal" bigint NOT NULL CHECK (row_ordinal >= 0),
  "person_id" text,
  "match_status" text NOT NULL CHECK (match_status IN ('exact_registry_name','documented_display_alias','unmatched')),
  "name_ko" text NOT NULL,
  "name_en" text NOT NULL,
  "office_ko" text NOT NULL,
  "office_en" text NOT NULL,
  "tier_ko" text NOT NULL,
  "tier_en" text NOT NULL,
  "relation_count" bigint NOT NULL CHECK (relation_count >= 0),
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("source_id", "table_anchor", "row_ordinal"),
  CHECK ((match_status='unmatched')=(person_id IS NULL))
);
CREATE TABLE wiki."index_section" (
  "source_id" bigint NOT NULL,
  "table_anchor" text NOT NULL,
  "section_ordinal" bigint NOT NULL CHECK (section_ordinal >= 0),
  "section_anchor" text NOT NULL,
  "section_name_ko" text NOT NULL,
  "section_name_en" text NOT NULL,
  "state_id" text,
  "row_count" bigint NOT NULL CHECK (row_count >= 0),
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("source_id", "table_anchor"),
  UNIQUE (source_id,section_ordinal)
);
CREATE TABLE wiki."index_state_label" (
  "source_id" bigint NOT NULL,
  "state_id" text NOT NULL,
  "state_name_ko" text NOT NULL,
  "state_name_en" text NOT NULL,
  "row_ordinal" bigint NOT NULL CHECK (row_ordinal >= 0),
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("state_id"),
  UNIQUE (source_id,row_ordinal)
);
CREATE TABLE wiki."issued_preservation_metadata" (
  "singleton" bigint CHECK(singleton=1),
  "schema_name" text NOT NULL,
  "baseline_manifest_sha256" text NOT NULL,
  "rules_version" text NOT NULL,
  "numeric_adoption" bigint NOT NULL CHECK(numeric_adoption=0),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."issued_sheet_document_band" (
  "ordinal" bigint CHECK(ordinal>=0),
  "name" text NOT NULL,
  "min" bigint NOT NULL,
  "max" bigint NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."issued_sheet_document_envelope" (
  "singleton" bigint CHECK(singleton=1),
  "schema_name" text NOT NULL,
  "status" text NOT NULL,
  "note" text NOT NULL,
  "person_count" bigint NOT NULL,
  "classification" text NOT NULL,
  "issued_sheet_lineage" text NOT NULL,
  "review_status" text NOT NULL,
  "historical_allocation_layer" text NOT NULL,
  "publication_receipt" text NOT NULL,
  "active_seoul_projection" text NOT NULL,
  "values_cast_sha256" text NOT NULL,
  "person_registry_sha256" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."issued_sheet_document_import" (
  "singleton" bigint CHECK(singleton=1),
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64),
  "document_sha256" text NOT NULL CHECK(length(document_sha256)=64),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."issued_sheet_document_key" (
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  PRIMARY KEY ("object_path", "ordinal"),
  UNIQUE(object_path,key)
);
CREATE TABLE wiki."issued_sheet_document_leader_review" (
  "ordinal" bigint CHECK(ordinal>=0),
  "person_id" text NOT NULL,
  "question" text NOT NULL,
  "choice" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("person_id")
);
CREATE TABLE wiki."issued_sheet_document_rules" (
  "singleton" bigint CHECK(singleton=1),
  "edition" text NOT NULL,
  "contract" text NOT NULL,
  "st_cost" bigint NOT NULL,
  "dx_cost" bigint NOT NULL,
  "iq_cost" bigint NOT NULL,
  "ht_cost" bigint NOT NULL,
  "ability_base" bigint NOT NULL,
  "per_action_sentence" bigint NOT NULL,
  "ability_cap" bigint NOT NULL,
  "per_and_will_count_as" text NOT NULL,
  "skill_cost_table" text NOT NULL,
  "difficulty_e" bigint NOT NULL,
  "difficulty_a" bigint NOT NULL,
  "difficulty_h" bigint NOT NULL,
  "difficulty_vh" bigint NOT NULL,
  "tier_a" bigint NOT NULL,
  "tier_b" bigint NOT NULL,
  "tier_c" bigint NOT NULL,
  "tier_d" bigint NOT NULL,
  "unspent_floor" bigint NOT NULL,
  "unspent_rule" text NOT NULL,
  "owner_k1004" text NOT NULL,
  "owner_rule" text NOT NULL,
  "same_event_rule" text NOT NULL,
  "same_event_status" text NOT NULL,
  "leader_review_status" text NOT NULL,
  "languages" text NOT NULL,
  "trait_reputation" text NOT NULL,
  "trait_combat_reflexes" text NOT NULL,
  "trait_disadvantages" text NOT NULL,
  "tl" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."issued_sheet_evidence_annotation" (
  "evidence_id" text NOT NULL,
  "interpretation" text,
  "provenance_note" text,
  PRIMARY KEY ("evidence_id"),
  CHECK(interpretation IS NOT NULL OR provenance_note IS NOT NULL)
);
CREATE TABLE wiki."issued_sheet_import" (
  "singleton" bigint CHECK(singleton=1),
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64),
  "people_sha256" text NOT NULL CHECK(length(people_sha256)=64),
  "profile_count" bigint NOT NULL CHECK(profile_count=1022),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."issued_sheet_object_key" (
  "person_id" text NOT NULL,
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  "is_null" bigint NOT NULL CHECK(is_null IN (0,1)),
  PRIMARY KEY ("person_id", "object_path", "ordinal"),
  UNIQUE(person_id,object_path,key)
);
CREATE TABLE wiki."landmark_role_document" (
  "singleton" bigint CHECK (singleton = 1),
  "schema" text NOT NULL,
  "epoch" text NOT NULL,
  "decision_source" text NOT NULL,
  "geometry_attribution" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."landmark_role_document_import" (
  "singleton" bigint CHECK (singleton = 1),
  "source_sha256" text NOT NULL CHECK (length(source_sha256) = 64),
  "document_sha256" text NOT NULL CHECK (length(document_sha256) = 64),
  "actor" text NOT NULL CHECK (length(trim(actor)) > 0),
  "reason" text NOT NULL CHECK (length(trim(reason)) > 0),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."landmark_role_document_key" (
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "key" text NOT NULL,
  PRIMARY KEY ("object_path", "ordinal"),
  UNIQUE (object_path, key)
);
CREATE TABLE wiki."landmark_role_document_site" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "id" text NOT NULL,
  "name" text NOT NULL,
  "address" text NOT NULL,
  "region_id" text NOT NULL,
  "holder_id" text NOT NULL,
  "role" text NOT NULL,
  "detail" text NOT NULL,
  "fortification" text NOT NULL,
  "lat" double precision NOT NULL,
  "lon" double precision NOT NULL,
  "coordinate_source" text NOT NULL,
  "connection_station_id" text,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."line_document_head" (
  "source_id" bigint,
  "revision_id" text NOT NULL,
  "status" text NOT NULL CHECK(status='draft'),
  "public_admission" text NOT NULL CHECK(public_admission='invalidated'),
  "schema_attestation" text,
  "current_approval_ref" text,
  PRIMARY KEY ("source_id"),
  CHECK(schema_attestation IS NULL AND current_approval_ref IS NULL)
);
CREATE TABLE wiki."line_document_policy" (
  "source_id" bigint,
  "usage_kind" text NOT NULL CHECK(usage_kind IN ('policy-guide','private-authoring','private-reference','private-script')),
  "privacy" text NOT NULL CHECK(privacy='internal-only'),
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."line_document_revision" (
  "source_id" bigint NOT NULL,
  "revision_id" text NOT NULL,
  "parent_revision" text,
  "sequence" bigint NOT NULL CHECK(sequence>=0),
  "media_kind" text NOT NULL CHECK(media_kind IN ('markdown','csv','javascript-data')),
  "line_count" bigint NOT NULL CHECK(line_count>=0),
  "ends_with_newline" bigint NOT NULL CHECK(ends_with_newline IN (0,1)),
  "line_ending" text NOT NULL CHECK(line_ending IN ('lf','crlf','mixed','none')),
  "content_sha256" text NOT NULL CHECK(length(content_sha256)=64),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  "created_at" text NOT NULL,
  PRIMARY KEY ("source_id", "revision_id"),
  UNIQUE ("revision_id"),
  UNIQUE(source_id,sequence),
  CHECK((sequence=0 AND parent_revision IS NULL) OR (sequence>0 AND parent_revision IS NOT NULL)),
  CHECK(line_count>0 OR (ends_with_newline=0 AND line_ending='none'))
);
CREATE TABLE wiki."line_document_revision_line" (
  "source_id" bigint NOT NULL,
  "revision_id" text NOT NULL,
  "line_ordinal" bigint NOT NULL CHECK(line_ordinal>=0),
  "text" text NOT NULL CHECK(position(chr(10) in text) = 0),
  "line_kind" text NOT NULL CHECK(line_kind IN ('blank','heading','list','table','fence','quote','other')),
  "heading_depth" bigint,
  PRIMARY KEY ("source_id", "revision_id", "line_ordinal"),
  CHECK((line_kind='heading' AND heading_depth BETWEEN 1 AND 6 AND heading_depth IS NOT NULL)
    OR (line_kind<>'heading' AND heading_depth IS NULL))
);
CREATE TABLE wiki."line_document_revision_seal" (
  "source_id" bigint NOT NULL,
  "revision_id" text NOT NULL,
  PRIMARY KEY ("source_id", "revision_id")
);
CREATE TABLE wiki."lineage_clan_assignment" (
  "person_id" text NOT NULL,
  "clan_id" text NOT NULL,
  PRIMARY KEY ("person_id", "clan_id")
);
CREATE TABLE wiki."lineage_founder_sesu" (
  "person_name" text NOT NULL,
  "sesu" bigint NOT NULL,
  PRIMARY KEY ("person_name")
);
CREATE TABLE wiki."lineage_node" (
  "name" text NOT NULL,
  "person_id" text,
  PRIMARY KEY ("name"),
  UNIQUE ("person_id")
);
CREATE TABLE wiki."lineage_parent" (
  "child_name" text NOT NULL,
  "parent_name" text NOT NULL,
  PRIMARY KEY ("child_name", "parent_name")
);
CREATE TABLE wiki."name_pool_candidate" (
  "logical_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "name" text NOT NULL,
  PRIMARY KEY ("logical_path", "ordinal")
);
CREATE TABLE wiki."name_pool_document" (
  "logical_path" text NOT NULL,
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64),
  "id" text NOT NULL,
  "schema" text,
  "sourceLink" text,
  "status" text,
  "source" text,
  "contract" text,
  "authorization" text,
  "transformation" text,
  "note" text NOT NULL,
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("logical_path"),
  UNIQUE ("id")
);
CREATE TABLE wiki."naming_ledger_document" (
  "document_id" bigint CHECK(document_id=1),
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64 AND source_sha256 !~ '^.*[^0-9a-f].*$'),
  "version" bigint NOT NULL CHECK(version=1),
  "branch_name" text NOT NULL,
  "branch_formal_name" text CHECK(branch_formal_name IS NULL),
  "branch_source" text NOT NULL,
  "branch_rights_status" text NOT NULL,
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  "receipt_sha256" text NOT NULL CHECK(length(receipt_sha256)=64 AND receipt_sha256 !~ '^.*[^0-9a-f].*$'),
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."naming_ledger_document_office" (
  "ordinal" bigint CHECK(ordinal>=0),
  "state" text NOT NULL,
  "source" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("state")
);
CREATE TABLE wiki."naming_ledger_document_office_tier" (
  "office_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "tier" text NOT NULL,
  PRIMARY KEY ("office_ordinal", "ordinal")
);
CREATE TABLE wiki."naming_ledger_document_retired_except" (
  "form_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "source" text NOT NULL,
  PRIMARY KEY ("form_ordinal", "ordinal")
);
CREATE TABLE wiki."naming_ledger_document_retired_form" (
  "ordinal" bigint CHECK(ordinal>=0),
  "form" text NOT NULL,
  "source" text NOT NULL,
  "rights_status" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("form")
);
CREATE TABLE wiki."naming_ledger_document_school" (
  "ordinal" bigint CHECK(ordinal>=0),
  "formal_name" text NOT NULL,
  "hanja" text NOT NULL,
  "alias" text CHECK(alias IS NULL),
  "source" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("formal_name")
);
CREATE TABLE wiki."naming_ledger_document_series" (
  "ordinal" bigint CHECK(ordinal>=0),
  "form" text NOT NULL,
  "source" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("form")
);
CREATE TABLE wiki."naming_ledger_document_state" (
  "ordinal" bigint CHECK(ordinal>=0),
  "id" text NOT NULL,
  "name" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("id"),
  UNIQUE ("name")
);
CREATE TABLE wiki."naming_ledger_document_state_source" (
  "state_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "source" text NOT NULL,
  PRIMARY KEY ("state_ordinal", "ordinal")
);
CREATE TABLE wiki."narrative" (
  "person_id" text NOT NULL,
  "narrative_ko" text NOT NULL CHECK(length(trim(narrative_ko))>0),
  "narrative_en" text NOT NULL CHECK(length(trim(narrative_en))>0),
  "json_pointer" text NOT NULL CHECK(json_pointer ~ '^/profiles/[0-9].*/narrative$'),
  PRIMARY KEY ("person_id")
);
CREATE TABLE wiki."npc_proposal_document_check_field" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "field_name" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."npc_proposal_document_decision" (
  "document_id" bigint CHECK (document_id = 1),
  "population" text NOT NULL,
  "livelihood" text NOT NULL,
  "training" text NOT NULL,
  "parameters" text NOT NULL,
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."npc_proposal_document_eligibility" (
  "document_id" bigint CHECK (document_id = 1),
  "description" text NOT NULL,
  "match_rule" text NOT NULL,
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."npc_proposal_document_endpoint" (
  "document_id" bigint CHECK (document_id = 1),
  "generate" text NOT NULL,
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."npc_proposal_document_field" (
  "document_id" bigint CHECK (document_id = 1),
  "name" text NOT NULL,
  "gender" text NOT NULL,
  "age" text NOT NULL,
  "state" text NOT NULL,
  "settlement" text NOT NULL,
  "occupation" text NOT NULL,
  "attributes" text NOT NULL,
  "cp" text NOT NULL,
  "martial" text NOT NULL,
  "unit_eligibility" text NOT NULL,
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."npc_proposal_document_generation" (
  "document_id" bigint CHECK (document_id = 1),
  "trigger" text NOT NULL,
  "proportion" text NOT NULL,
  "min_per_settlement" bigint NOT NULL,
  "min_per_settlement_text" text NOT NULL,
  "max_per_settlement" bigint NOT NULL,
  "max_per_settlement_text" text NOT NULL,
  "seed" text NOT NULL,
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."npc_proposal_document_import" (
  "document_id" bigint CHECK (document_id = 1),
  "source_sha256" text NOT NULL CHECK (length(source_sha256) = 64),
  "document_sha256" text NOT NULL CHECK (length(document_sha256) = 64),
  "row_sha256" text NOT NULL CHECK (length(row_sha256) = 64),
  "actor" text NOT NULL CHECK (length(trim(actor)) > 0),
  "reason" text NOT NULL CHECK (length(trim(reason)) > 0),
  "receipt_sha256" text NOT NULL CHECK (length(receipt_sha256) = 64),
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."npc_proposal_document_key" (
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "key" text NOT NULL,
  PRIMARY KEY ("object_path", "ordinal"),
  UNIQUE (object_path, key)
);
CREATE TABLE wiki."npc_proposal_document_martial" (
  "document_id" bigint CHECK (document_id = 1),
  "probability" text NOT NULL,
  "level" text NOT NULL,
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."npc_proposal_document_occupation" (
  "occupation_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  PRIMARY KEY ("occupation_key"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki."npc_proposal_document_param" (
  "param_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "body" text NOT NULL,
  PRIMARY KEY ("param_key"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki."npc_proposal_document_pool" (
  "pool_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  PRIMARY KEY ("pool_key"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki."npc_proposal_document_pool_item" (
  "pool_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "label" text NOT NULL,
  PRIMARY KEY ("pool_key", "ordinal")
);
CREATE TABLE wiki."npc_proposal_document_reason" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "label" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."npc_proposal_document_response" (
  "response_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "body" text NOT NULL,
  PRIMARY KEY ("response_key"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki."npc_proposal_document_root" (
  "document_id" bigint CHECK (document_id = 1),
  "schema" text NOT NULL,
  "status" text NOT NULL,
  "note" text NOT NULL,
  "rules_owner" text NOT NULL,
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."npc_proposal_document_settlement" (
  "settlement_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "pop_range" text NOT NULL,
  "npc_multiplier" double precision NOT NULL,
  "npc_multiplier_text" text NOT NULL,
  "occupations" text NOT NULL,
  PRIMARY KEY ("settlement_key"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki."npc_proposal_document_style" (
  "occupation_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "label" text NOT NULL,
  PRIMARY KEY ("occupation_key", "ordinal")
);
CREATE TABLE wiki."npc_proposal_document_wandering" (
  "document_id" bigint CHECK (document_id = 1),
  "description" text NOT NULL,
  "probability" double precision NOT NULL,
  "probability_text" text NOT NULL,
  "camp" text NOT NULL,
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."office_appointment_input_contract" (
  "singleton" bigint CHECK(singleton=1),
  "history" text NOT NULL,
  "current" text NOT NULL,
  "common_tier" text NOT NULL,
  "rights" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."office_appointment_input_import" (
  "singleton" bigint CHECK(singleton=1),
  "source_id" bigint NOT NULL,
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64),
  "document_sha256" text NOT NULL CHECK(length(document_sha256)=64),
  "domain_sha256" text NOT NULL CHECK(length(domain_sha256)=64),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."office_appointment_input_key" (
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  "is_null" bigint NOT NULL CHECK(is_null IN (0,1)),
  PRIMARY KEY ("object_path", "ordinal"),
  UNIQUE(object_path,key)
);
CREATE TABLE wiki."organization_values_axis" (
  "document_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "name" text NOT NULL,
  PRIMARY KEY ("document_id", "ordinal"),
  UNIQUE ("name")
);
CREATE TABLE wiki."organization_values_document" (
  "document_id" bigint CHECK(document_id=1),
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64),
  "schema" text NOT NULL,
  "note" text NOT NULL,
  "count" bigint NOT NULL CHECK(count>=0),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."organization_values_org" (
  "document_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "id" text NOT NULL,
  "name" text NOT NULL,
  "kind" text NOT NULL,
  "class_present" bigint NOT NULL CHECK(class_present IN (0,1)),
  "class" text,
  "source" text NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE(document_id,ordinal),
  CHECK(class_present=1 OR class IS NULL)
);
CREATE TABLE wiki."organization_values_policy" (
  "org_id" text NOT NULL,
  "war" text NOT NULL,
  "migrants" text NOT NULL,
  "water" text NOT NULL,
  "labor" text NOT NULL,
  "records" text NOT NULL,
  "technology" text NOT NULL,
  "trade" text NOT NULL,
  "succession" text NOT NULL,
  "union_policy" text NOT NULL,
  PRIMARY KEY ("org_id")
);
CREATE TABLE wiki."organization_values_policy_axis" (
  "document_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "name" text NOT NULL,
  PRIMARY KEY ("document_id", "ordinal"),
  UNIQUE ("name")
);
CREATE TABLE wiki."organization_values_score" (
  "org_id" text NOT NULL,
  "authority" bigint NOT NULL,
  "openness" bigint NOT NULL,
  "force" bigint NOT NULL,
  "material" bigint NOT NULL,
  "communal" bigint NOT NULL,
  "principle" bigint NOT NULL,
  "disclosure" bigint NOT NULL,
  "qualification" bigint NOT NULL,
  "decentralization" bigint NOT NULL,
  "transformation" bigint NOT NULL,
  PRIMARY KEY ("org_id")
);
CREATE TABLE wiki."organization_values_state" (
  "org_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "state" text NOT NULL,
  PRIMARY KEY ("org_id", "ordinal")
);
CREATE TABLE wiki."permission_archive" (
  "singleton" bigint CHECK(singleton=1),
  "bytes" bytea NOT NULL,
  "sha256" text NOT NULL CHECK(length(sha256)=64),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."permission_metadata" (
  "singleton" bigint CHECK(singleton=1),
  "schema" text NOT NULL CHECK(schema='person-rights-permissions.v1'),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."permission_person" (
  "person_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "applicability" text NOT NULL CHECK(applicability='real-person'),
  "identity_basis_ref" text NOT NULL,
  "external_reuse_requires_separate_subject_permission" bigint NOT NULL CHECK(external_reuse_requires_separate_subject_permission=1),
  PRIMARY KEY ("person_id"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki."permission_prior_license" (
  "person_id" text NOT NULL,
  "scope" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "source_ref" text NOT NULL,
  "license_ref" text NOT NULL,
  "conditions_ref" text NOT NULL,
  PRIMARY KEY ("person_id", "scope", "ordinal")
);
CREATE TABLE wiki."permission_scope" (
  "person_id" text NOT NULL,
  "scope" text NOT NULL CHECK(scope IN ('nameUse','likenessUse')),
  "is_null" bigint NOT NULL CHECK(is_null IN (0,1)),
  "status" text CHECK(status IN ('not-recorded','granted','revoked','declined')),
  "date" text,
  "recorded_on" text,
  "evidence_ref" text,
  "has_prior_licenses" bigint NOT NULL CHECK(has_prior_licenses IN (0,1)),
  PRIMARY KEY ("person_id", "scope"),
  CHECK((is_null=0 AND status IS NOT NULL) OR
    (is_null=1 AND status IS NULL AND date IS NULL AND recorded_on IS NULL AND evidence_ref IS NULL AND has_prior_licenses=0))
);
CREATE TABLE wiki."permission_seal" (
  "singleton" bigint CHECK(singleton=1),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."permission_use" (
  "person_id" text NOT NULL,
  "scope" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "use" text NOT NULL CHECK(use IN ('wiki-display','game-use','commercial-use')),
  PRIMARY KEY ("person_id", "scope", "ordinal"),
  UNIQUE(person_id,scope,use)
);
CREATE TABLE wiki."person" (
  "person_id" text NOT NULL,
  "name" text NOT NULL,
  "publication_ordinal" bigint NOT NULL CHECK(publication_ordinal > 0),
  "public_key" text NOT NULL,
  "public_route" text NOT NULL,
  "state_id" text,
  "state_name" text,
  "title" text,
  "stage" text,
  "generation" text,
  "source_kind" text,
  "minors" bigint NOT NULL CHECK(minors IN (0,1)),
  "locked" bigint CHECK(locked IN (0,1)),
  "values_source_ordinal" bigint NOT NULL CHECK(values_source_ordinal >= 0),
  PRIMARY KEY ("person_id"),
  UNIQUE ("name"),
  UNIQUE ("publication_ordinal"),
  UNIQUE ("public_key"),
  UNIQUE ("public_route"),
  UNIQUE ("values_source_ordinal")
);
CREATE TABLE wiki."person_alias" (
  "person_id" text NOT NULL,
  "alias" text NOT NULL,
  "alias_ordinal" bigint NOT NULL CHECK(alias_ordinal >= 0),
  PRIMARY KEY ("person_id", "alias"),
  UNIQUE ("alias"),
  UNIQUE(person_id,alias_ordinal)
);
CREATE TABLE wiki."person_context_contact_metadata" (
  "domain" text NOT NULL CHECK(domain='contacts'),
  "schema_version" bigint NOT NULL,
  "status" text NOT NULL,
  "approval_status" text NOT NULL,
  "source_note" text NOT NULL,
  PRIMARY KEY ("domain")
);
CREATE TABLE wiki."person_context_document_import" (
  "domain" text NOT NULL CHECK(domain IN ('birthdays','contacts')),
  "source_id" bigint NOT NULL,
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64),
  "document_sha256" text NOT NULL CHECK(length(document_sha256)=64),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("domain")
);
CREATE TABLE wiki."person_context_document_key" (
  "domain" text NOT NULL,
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  "is_null" bigint NOT NULL CHECK(is_null IN (0,1)),
  PRIMARY KEY ("domain", "object_path", "ordinal"),
  UNIQUE(domain,object_path,key)
);
CREATE TABLE wiki."person_desire" (
  "person_id" text NOT NULL,
  "axis_name" text NOT NULL,
  "value_kind" text NOT NULL CHECK(value_kind IN ('integer','text')),
  "integer_value" bigint CHECK(integer_value BETWEEN -100 AND 100),
  "text_value" text,
  PRIMARY KEY ("person_id", "axis_name"),
  CHECK((value_kind = 'integer' AND integer_value IS NOT NULL AND text_value IS NULL)
     OR (value_kind = 'text' AND integer_value IS NULL))
);
CREATE TABLE wiki."person_disposition" (
  "person_id" text NOT NULL,
  "status" text NOT NULL CHECK(status IN ('active','retired-current')),
  "decision_ref" text NOT NULL CHECK(length(trim(decision_ref))>0),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  PRIMARY KEY ("person_id")
);
CREATE TABLE wiki."person_gender" (
  "person_id" text NOT NULL,
  "state_id" text,
  "gender" text NOT NULL,
  "assignment_source" text,
  "user_locked" bigint CHECK(user_locked IN (0,1)),
  PRIMARY KEY ("person_id")
);
CREATE TABLE wiki."person_identity_document_import" (
  "domain" text NOT NULL CHECK(domain IN ('lineage','gender')),
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64),
  "document_sha256" text NOT NULL CHECK(length(document_sha256)=64),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("domain")
);
CREATE TABLE wiki."person_identity_document_key" (
  "domain" text NOT NULL,
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  "is_null" bigint NOT NULL CHECK(is_null IN (0,1)),
  PRIMARY KEY ("domain", "object_path", "ordinal"),
  UNIQUE(domain,object_path,key)
);
CREATE TABLE wiki."person_identity_import" (
  "domain" text NOT NULL CHECK(domain IN ('lineage','gender')),
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64),
  "people_sha256" text NOT NULL CHECK(length(people_sha256)=64),
  "person_count" bigint NOT NULL CHECK(person_count=1022),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("domain")
);
CREATE TABLE wiki."person_identity_key" (
  "domain" text NOT NULL,
  "person_id" text NOT NULL,
  "object_path" text NOT NULL CHECK(object_path IN ('','/namingConventionSource')),
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  "is_null" bigint NOT NULL CHECK(is_null IN (0,1)),
  PRIMARY KEY ("domain", "person_id", "object_path", "ordinal"),
  UNIQUE(domain,person_id,object_path,key)
);
CREATE TABLE wiki."person_identity_legacy_clan" (
  "person_id" text NOT NULL,
  "legacy_clan_label" text NOT NULL,
  PRIMARY KEY ("person_id")
);
CREATE TABLE wiki."person_identity_order" (
  "domain" text NOT NULL,
  "person_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY ("domain", "person_id"),
  UNIQUE(domain,ordinal)
);
CREATE TABLE wiki."person_lineage" (
  "person_id" text NOT NULL,
  "surname" text,
  "status" text,
  "bongwan" text,
  "clan_id" text,
  "base_clan_id" text,
  "branch" text,
  "reason" text,
  "source_file_label" text,
  "surname_hanja" text,
  "bongwan_hanja" text,
  "hangnyeol" text,
  "position" text,
  "sesu" bigint,
  "naming_convention" text CHECK(naming_convention IN ('non-korean-lineage')),
  "naming_source_character_id" text,
  "naming_source_path" text,
  "naming_source_basis" text,
  PRIMARY KEY ("person_id")
);
CREATE TABLE wiki."person_lineage_source_clan" (
  "person_id" text NOT NULL,
  "source_ref" text NOT NULL,
  "source_ordinal" bigint NOT NULL CHECK(source_ordinal >= 0),
  PRIMARY KEY ("person_id")
);
CREATE TABLE wiki."person_sheet_name_change" (
  "character_id" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "person_id" text NOT NULL,
  "historical_name" text NOT NULL,
  "current_name" text NOT NULL,
  "source_revision" text NOT NULL,
  "source_path" text NOT NULL,
  "approval_ref" text NOT NULL,
  PRIMARY KEY ("character_id"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki."person_value" (
  "person_id" text NOT NULL,
  "axis_name" text NOT NULL,
  "value" bigint NOT NULL CHECK(value BETWEEN -100 AND 100),
  PRIMARY KEY ("person_id", "axis_name")
);
CREATE TABLE wiki."personal_holding_input_facility" (
  "holding_id" text NOT NULL,
  "layer_id" text NOT NULL,
  "layer_name" text NOT NULL,
  PRIMARY KEY ("holding_id")
);
CREATE TABLE wiki."personal_holding_input_import" (
  "singleton" bigint CHECK(singleton=1),
  "source_id" bigint NOT NULL,
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64),
  "document_sha256" text NOT NULL CHECK(length(document_sha256)=64),
  "domain_sha256" text NOT NULL CHECK(length(domain_sha256)=64),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."personal_holding_input_key" (
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  "is_null" bigint NOT NULL CHECK(is_null IN (0,1)),
  PRIMARY KEY ("object_path", "ordinal"),
  UNIQUE(object_path,key)
);
CREATE TABLE wiki."physical_rail_metadata" (
  "singleton" bigint CHECK(singleton=1),
  "projection" text NOT NULL,
  "boundary_sha256" text NOT NULL,
  "osm_sha256" text NOT NULL,
  "station_binding_status" text NOT NULL,
  "passage_2126" text NOT NULL,
  "attribution" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."physical_rail_path" (
  "id" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "osm_way" bigint NOT NULL,
  "mode" text NOT NULL,
  "line_id" text NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki."physical_rail_point" (
  "path_id" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "east" double precision NOT NULL,
  "north" double precision NOT NULL,
  PRIMARY KEY ("path_id", "ordinal")
);
CREATE TABLE wiki."population_boundary" (
  "id" bigint CHECK(id=1),
  "source" text NOT NULL,
  "sha256" text NOT NULL,
  "effectiveDate" text NOT NULL,
  "areaUnit" text NOT NULL,
  "measurementCrs" text NOT NULL,
  PRIMARY KEY ("id")
);
CREATE TABLE wiki."population_document" (
  "id" bigint CHECK(id=1),
  "schema" text NOT NULL,
  "baseline" text NOT NULL,
  "projectionYear" bigint NOT NULL,
  "ratio" double precision NOT NULL,
  PRIMARY KEY ("id")
);
CREATE TABLE wiki."population_dong_density" (
  "document_id" bigint NOT NULL,
  "dong_id" text NOT NULL CHECK(length(dong_id)=10 AND dong_id !~ '^.*[^0-9].*$'),
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "density2126" double precision NOT NULL,
  PRIMARY KEY ("document_id", "dong_id"),
  UNIQUE(document_id,ordinal)
);
CREATE TABLE wiki."population_import" (
  "id" bigint CHECK(id=1),
  "source_sha256" text NOT NULL,
  "document_sha256" text NOT NULL,
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("id")
);
CREATE TABLE wiki."population_key" (
  "document_id" bigint NOT NULL,
  "object_name" text NOT NULL CHECK(object_name IN ('document','source','boundary')),
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  PRIMARY KEY ("document_id", "object_name", "ordinal"),
  UNIQUE(document_id,object_name,key)
);
CREATE TABLE wiki."population_source" (
  "id" bigint CHECK(id=1),
  "publisher" text NOT NULL,
  "url" text NOT NULL,
  "downloadUrl" text NOT NULL,
  "downloadSha256" text NOT NULL,
  "downloadBytes" bigint NOT NULL,
  "statistic" text NOT NULL,
  "definition" text NOT NULL,
  "asOf" text NOT NULL,
  "statisticsApproval" text NOT NULL,
  "rights" text NOT NULL,
  PRIMARY KEY ("id")
);
CREATE TABLE wiki."portrait_archive" (
  "kind" text NOT NULL CHECK(kind IN ('catalog','properties','selection')),
  "bytes" bytea NOT NULL,
  "sha256" text NOT NULL CHECK(length(sha256)=64),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("kind")
);
CREATE TABLE wiki."portrait_catalog" (
  "personId" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "stateId" text,
  "approval" text NOT NULL,
  "imageSha256" text NOT NULL CHECK(length("imageSha256")=64),
  PRIMARY KEY ("personId"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki."portrait_catalog_history" (
  "revision" bigint NOT NULL,
  "personId" text,
  "ordinal" bigint,
  "stateId" text,
  "approval" text,
  "imageSha256" text
);
CREATE TABLE wiki."portrait_document" (
  "kind" text NOT NULL,
  "schemaVersion" bigint NOT NULL CHECK("schemaVersion"=1),
  "status" text NOT NULL,
  "styleSource" text,
  "canonPromotion" bigint CHECK("canonPromotion"=0),
  "final3dPortraitContractSatisfied" bigint CHECK("final3dPortraitContractSatisfied"=0),
  "previousVerdictsPreserved" bigint CHECK("previousVerdictsPreserved" IN (0,1)),
  "entryCount" bigint NOT NULL CHECK("entryCount">=0),
  "currentSha256" text NOT NULL,
  PRIMARY KEY ("kind")
);
CREATE TABLE wiki."portrait_document_history" (
  "revision" bigint NOT NULL,
  "kind" text,
  "schemaVersion" bigint,
  "status" text,
  "styleSource" text,
  "canonPromotion" bigint,
  "final3dPortraitContractSatisfied" bigint,
  "previousVerdictsPreserved" bigint,
  "entryCount" bigint,
  "currentSha256" text
);
CREATE TABLE wiki."portrait_existing_person" (
  "personId" text NOT NULL,
  "existingPersonId" text NOT NULL,
  PRIMARY KEY ("personId"),
  UNIQUE ("existingPersonId")
);
CREATE TABLE wiki."portrait_identity" (
  "personId" text NOT NULL,
  "characterId" text NOT NULL,
  "name" text NOT NULL,
  "gender" text NOT NULL,
  "ageCategory" text NOT NULL,
  PRIMARY KEY ("personId")
);
CREATE TABLE wiki."portrait_identity_evidence" (
  "personId" text NOT NULL,
  "field" text NOT NULL CHECK(field IN ('ethnicity','origin')),
  "value" text,
  "status" text NOT NULL,
  "source" text,
  PRIMARY KEY ("personId", "field")
);
CREATE TABLE wiki."portrait_identity_evidence_history" (
  "revision" bigint NOT NULL,
  "personId" text,
  "field" text,
  "value" text,
  "status" text,
  "source" text
);
CREATE TABLE wiki."portrait_identity_history" (
  "revision" bigint NOT NULL,
  "personId" text,
  "characterId" text,
  "name" text,
  "gender" text,
  "ageCategory" text
);
CREATE TABLE wiki."portrait_key_order" (
  "kind" text NOT NULL,
  "owner" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field" text NOT NULL,
  PRIMARY KEY ("kind", "owner", "ordinal"),
  UNIQUE(kind,owner,field)
);
CREATE TABLE wiki."portrait_key_order_history" (
  "revision" bigint NOT NULL,
  "kind" text,
  "owner" text,
  "ordinal" bigint,
  "field" text
);
CREATE TABLE wiki."portrait_person" (
  "personId" text NOT NULL,
  "characterId" text NOT NULL,
  "name" text NOT NULL,
  PRIMARY KEY ("personId"),
  UNIQUE ("characterId")
);
CREATE TABLE wiki."portrait_person_history" (
  "revision" bigint NOT NULL,
  "personId" text,
  "characterId" text,
  "name" text
);
CREATE TABLE wiki."portrait_properties" (
  "personId" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "face" text NOT NULL,
  "hair" text NOT NULL,
  "upper" text NOT NULL,
  "hasIdentity" bigint NOT NULL CHECK("hasIdentity" IN (0,1)),
  "hasSlots" bigint NOT NULL CHECK("hasSlots" IN (0,1)),
  PRIMARY KEY ("personId"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki."portrait_properties_history" (
  "revision" bigint NOT NULL,
  "personId" text,
  "ordinal" bigint,
  "face" text,
  "hair" text,
  "upper" text,
  "hasIdentity" bigint,
  "hasSlots" bigint
);
CREATE TABLE wiki."portrait_revision" (
  "revision" bigint CHECK(revision>=1),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("revision")
);
CREATE TABLE wiki."portrait_revision_evidence" (
  "revision" bigint NOT NULL,
  "kind" text NOT NULL,
  "bytes" bytea NOT NULL,
  "sha256" text NOT NULL CHECK(length(sha256)=64),
  PRIMARY KEY ("revision", "kind")
);
CREATE TABLE wiki."portrait_seal" (
  "singleton" bigint CHECK(singleton=1),
  "revision" bigint NOT NULL CHECK(revision>=1),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."portrait_selection" (
  "personId" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "imageSha256" text NOT NULL CHECK(length("imageSha256")=64),
  "hasPrevious" bigint NOT NULL CHECK("hasPrevious" IN (0,1)),
  "previousImageSha256" text CHECK("previousImageSha256" IS NULL OR length("previousImageSha256")=64),
  "verdict" text NOT NULL CHECK(verdict='pass'),
  "operation" text NOT NULL,
  PRIMARY KEY ("personId"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki."portrait_selection_history" (
  "revision" bigint NOT NULL,
  "personId" text,
  "ordinal" bigint,
  "imageSha256" text,
  "hasPrevious" bigint,
  "previousImageSha256" text,
  "verdict" text,
  "operation" text
);
CREATE TABLE wiki."portrait_slot_evidence" (
  "personId" text NOT NULL,
  "slot" text NOT NULL,
  "field" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text,
  "status" text NOT NULL,
  "source" text,
  "hasUnit" bigint NOT NULL CHECK("hasUnit" IN (0,1)),
  "unit" text,
  PRIMARY KEY ("personId", "slot", "field"),
  UNIQUE("personId",slot,ordinal)
);
CREATE TABLE wiki."portrait_slot_evidence_history" (
  "revision" bigint NOT NULL,
  "personId" text,
  "slot" text,
  "field" text,
  "ordinal" bigint,
  "value" text,
  "status" text,
  "source" text,
  "hasUnit" bigint,
  "unit" text
);
CREATE TABLE wiki."portrait_slot_group" (
  "personId" text NOT NULL,
  "slot" text NOT NULL CHECK(slot IN ('face','hair','body','outfit','accessories')),
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY ("personId", "slot"),
  UNIQUE("personId",ordinal)
);
CREATE TABLE wiki."portrait_slot_group_history" (
  "revision" bigint NOT NULL,
  "personId" text,
  "slot" text,
  "ordinal" bigint
);
CREATE TABLE wiki."preserved_sheet_advantage" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "name" text,
  "cp" double precision,
  "effect" text,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_attribute" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "value" double precision,
  "cp" double precision,
  "rule" text,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_attribute_evidence" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "path" text,
  "pointer" text,
  "quote" text,
  "note" text,
  "line" double precision,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_attributes" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_boundary" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "text" text,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_camp" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "name" text,
  "type" text,
  "description" text,
  "pack_up_time" text,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_composition" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "text" text,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_cp" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "attributes" double precision,
  "advantages" double precision,
  "disadvantages" double precision,
  "skills" double precision,
  "spent" double precision,
  "unspent" double precision,
  "total" double precision,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_disadvantage" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "name" text,
  "cp" double precision,
  "effect" text,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_domain_count" (
  "revision" text NOT NULL,
  "domain" text NOT NULL,
  "row_count" bigint NOT NULL,
  PRIMARY KEY ("revision", "domain")
);
CREATE TABLE wiki."preserved_sheet_facility" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "text" text,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_faction_scale" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "state" text,
  "tier" text,
  "factor" double precision,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_force" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "type" text,
  "size" double precision,
  "current_location" text,
  "note" text,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_language" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "name" text,
  "level" text,
  "cp" double precision,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_language_evidence" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "path" text,
  "pointer" text,
  "quote" text,
  "note" text,
  "line" double precision,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_person" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "id" text,
  "name" text,
  "url" text,
  "state" text,
  "method" text,
  "band" text,
  "baseline" bigint,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_reaction" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "ordinaryObservers" double precision,
  "observersAttractedToHerSex" double precision,
  "application" text,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_revision" (
  "revision" text NOT NULL,
  "ordinal" bigint NOT NULL,
  "ledger_sha256" text NOT NULL,
  "document_sha256" text NOT NULL,
  "people_sha256" text NOT NULL,
  "serialized_sha256" text NOT NULL,
  "numeric_sha256" text NOT NULL,
  "numeric_count" bigint NOT NULL,
  "person_count" bigint NOT NULL CHECK(person_count=1022),
  "rules_version" text NOT NULL,
  "resolution" text NOT NULL,
  "numeric_adoption" bigint NOT NULL CHECK(numeric_adoption=0),
  "legacy_values" text NOT NULL,
  "original_ratings" text CHECK(original_ratings IS NULL),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("revision"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki."preserved_sheet_role" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "display" text,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_role_evidence" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "path" text,
  "pointer" text,
  "quote" text,
  "note" text,
  "line" double precision,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_secondary" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "HP" double precision,
  "Will" double precision,
  "Per" double precision,
  "FP" double precision,
  "BasicSpeed" double precision,
  "BasicMove" double precision,
  "BasicLift" double precision,
  "Dodge" double precision,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_settlement" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "name" text,
  "type" text,
  "description" text,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_skill" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "name" text,
  "ko" text,
  "attr" text,
  "diff" text,
  "tier" text,
  "cp" double precision,
  "level" double precision,
  "difficulty" text,
  "effect" text,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_skill_evidence" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "path" text,
  "pointer" text,
  "quote" text,
  "note" text,
  "line" double precision,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_source" (
  "source_path" text NOT NULL,
  "sha256" text NOT NULL,
  PRIMARY KEY ("source_path")
);
CREATE TABLE wiki."preserved_sheet_territory" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "fief_name" text,
  "type" text,
  "station" text,
  "state" text,
  "note" text,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_trait" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "name" text,
  "kind" text,
  "rule" text,
  "level" double precision,
  "people" double precision,
  "frequency" double precision,
  "cp" double precision,
  "page" text,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_trait_evidence" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "path" text,
  "pointer" text,
  "quote" text,
  "note" text,
  "line" double precision,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."preserved_sheet_unit" (
  "revision" text NOT NULL,
  "person_id" text NOT NULL,
  "slot" text NOT NULL,
  "key_order" text NOT NULL,
  "type" text,
  "size" double precision,
  "quality" text,
  "note" text,
  PRIMARY KEY ("revision", "person_id", "slot")
);
CREATE TABLE wiki."profile" (
  "profile_id" text NOT NULL,
  "person_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "heading_pointer" text NOT NULL,
  "source_kind" text NOT NULL CHECK(source_kind IN ('state','core','unaffiliated','corridor')),
  "source_ordinal" bigint NOT NULL CHECK(source_ordinal >= 0),
  "heading_depth" bigint NOT NULL CHECK(heading_depth > 0),
  "anchor" text,
  "heading_ko" text,
  "heading_en" text,
  "node_start" bigint NOT NULL CHECK(node_start >= 0),
  "node_end" bigint NOT NULL CHECK(node_end > node_start),
  "is_primary" bigint NOT NULL CHECK(is_primary IN (0,1)),
  PRIMARY KEY ("profile_id"),
  UNIQUE(source_id,source_ordinal)
);
CREATE TABLE wiki."profile_field" (
  "profile_id" text NOT NULL,
  "field_ordinal" bigint NOT NULL CHECK(field_ordinal >= 0),
  "field_kind" text NOT NULL CHECK(field_kind IN ('lead','bullet','section')),
  "key_ko" text,
  "key_en" text,
  "value_ko" text,
  "value_en" text,
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("profile_id", "field_ordinal")
);
CREATE TABLE wiki."profile_node" (
  "profile_id" text NOT NULL,
  "node_ordinal" bigint NOT NULL CHECK(node_ordinal >= 0),
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("profile_id", "node_ordinal")
);
CREATE TABLE wiki."public_map_block" (
  "ordinal" bigint,
  "anchor" text NOT NULL,
  "removed" bigint NOT NULL CHECK(removed IN (0,1)),
  PRIMARY KEY ("ordinal"),
  UNIQUE ("anchor")
);
CREATE TABLE wiki."public_map_block_locale" (
  "block_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL,
  "locale" text NOT NULL CHECK(locale IN ('ko','en')),
  "before_text" text NOT NULL,
  "after_text" text,
  PRIMARY KEY ("block_ordinal", "locale"),
  UNIQUE(block_ordinal,ordinal)
);
CREATE TABLE wiki."public_map_summary" (
  "ordinal" bigint,
  "locale" text NOT NULL CHECK(locale IN ('ko','en')),
  "before_text" text NOT NULL,
  "after_text" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("locale")
);
CREATE TABLE wiki."public_office_replacement" (
  "ordinal" bigint,
  "anchor" text NOT NULL,
  "locale" text NOT NULL CHECK(locale IN ('ko','en')),
  "row_number" bigint,
  "column_number" bigint,
  "before_text" text NOT NULL,
  "after_text" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  CHECK((row_number IS NULL)=(column_number IS NULL))
);
CREATE TABLE wiki."public_projection_document" (
  "kind" text NOT NULL CHECK(kind IN ('office','map')),
  "slug" text NOT NULL,
  "remove_anchor" text,
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64),
  "actor" text NOT NULL,
  "reason" text NOT NULL,
  PRIMARY KEY ("kind")
);
CREATE TABLE wiki."quality_issue" (
  "issue_id" text NOT NULL,
  "dataset" text NOT NULL,
  "code" text NOT NULL,
  "severity" text NOT NULL,
  "person_id" text,
  "source_id" bigint,
  "json_pointer" text,
  "message" text NOT NULL,
  "observed_value" text,
  PRIMARY KEY ("issue_id")
);
CREATE TABLE wiki."rail_source_adjacency_document" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "schema" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_adjacency_source" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "url" text,
  "retrievedAt" text,
  "sha256" text,
  "scope" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_binding" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "stationCode" text,
  "interchangeUid" text,
  "officialName" text,
  "lineId" text,
  "observedName" text,
  "identitySource" text,
  "identityBasis" text,
  "coordinateSource" text,
  "osmId" text,
  "sharedWikidata" text,
  "coordinateCheckUrl" text,
  "east" bigint,
  "north" bigint,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_bindings_document" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "schema" text,
  "sourceUrl" text,
  "sourceSha256" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_connected_document" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "schema" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_connected_source" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "url" text,
  "sha256" text,
  "license" text,
  "scope" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_connected_station" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "osmId" text,
  "nameKo" text,
  "nameEn" text,
  "mode" text,
  "lat" double precision,
  "lon" double precision,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_control_document" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "schema" text,
  "baseline" text,
  "description" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_control_override" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "id" text,
  "stationId" text,
  "status" text,
  "primary" text,
  "decision" text,
  "regionalAuthority" text,
  "stationManager" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_control_polity" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "polity_id" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_correction" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "name" text,
  "stationCode" text,
  "removedNamesakeCode" text,
  "identitySource" text,
  "east" bigint,
  "north" bigint,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_correction_line" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "line_id" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_corrections_document" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "schema" text,
  "officialSource" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_gtx_document" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "schema" text,
  "asOf" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_gtx_path" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_gtx_pending_station" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "station_name" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_gtx_project" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "id" text,
  "status" text,
  "sourceUrl" text,
  "routeSourceUrl" text,
  "statusAsOf" text,
  "endpointKind" text,
  "geometryKind" text,
  "diagramUrl" text,
  "statusSourceUrl" text,
  "sourceUpdatedAt" text,
  "sourceYear" bigint,
  "stationLocationsFinal" bigint CHECK("stationLocationsFinal" IN (0,1)),
  "surveyedTrackGeometry" bigint CHECK("surveyedTrackGeometry" IN (0,1)),
  "opening2126Control" text CHECK("opening2126Control" IS NULL),
  "opening2126Passage" text CHECK("opening2126Passage" IS NULL),
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_gtx_station" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "station_name" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_identities_document" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "schema" text,
  "sourceUrl" text,
  "sourceSha256" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_identity_group" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "name" text,
  "uid" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_identity_line" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "line_id" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_identity_member" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "east" bigint,
  "north" bigint,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_import" (
  "logical_path" text NOT NULL,
  "source_sha256" text NOT NULL,
  "document_sha256" text NOT NULL,
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki."rail_source_key" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  "is_null" bigint NOT NULL CHECK(is_null IN (0,1)),
  PRIMARY KEY ("logical_path", "object_path", "ordinal"),
  UNIQUE(logical_path,object_path,key)
);
CREATE TABLE wiki."rail_source_passage_decision" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "segmentId" text,
  "passage2126" text,
  "decision" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_regular_line" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "id" text,
  "name" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_regular_path" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_regular_stop" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "code" text,
  "uid" text,
  "name" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_retired_passage_decision" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "segmentId" text,
  "passage2126" text,
  "decision" text,
  "retirement" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_station_code" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "station_code" text,
  "station_id" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_station_codes" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."rail_source_unresolved" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."reference_source" (
  "logical_path" text NOT NULL,
  "sha256" text NOT NULL CHECK(length(sha256)=64),
  "byte_length" bigint NOT NULL CHECK(byte_length>=0),
  "source_class" text NOT NULL CHECK(source_class='reference-hash-only'),
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki."region_atlas_document_action" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "id" text,
  "label" text,
  "target_ref" text,
  "tradeoff" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_anchor" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "id" text,
  "kind" text,
  "name" text,
  "relation" text,
  "source_object_id" text,
  "source_ref" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_anchor_tag" (
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  "value" text NOT NULL,
  PRIMARY KEY ("parent_id", "ordinal"),
  UNIQUE(parent_id,key)
);
CREATE TABLE wiki."region_atlas_document_build_inputs" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "boundary" text,
  "selection" text,
  "selection_sha256" text,
  "source_root" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_building" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "anchor_ref" text,
  "name" text,
  "observed_use" text,
  "river" text,
  "opening_use" text,
  "how" text,
  "role" text,
  "observed_levels" text,
  "observed_levels_source" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_candidate_counts" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "access" text,
  "all_candidates" text,
  "building_context" text,
  "facility" text,
  "landscape" text,
  "other_context" text,
  "road_context" text,
  "subway_station" text,
  "rail_station" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_candidate_status" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "assigned" text,
  "outside" text,
  "quarantine" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_comparison_boundary" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "current_boundary" bigint,
  "effective_year" text,
  "path" text,
  "policy" text,
  "sha256" text,
  "source_id" text,
  "source_root" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_content" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "source_kind" text,
  "fictional_epoch" text,
  "title" text,
  "summary" text,
  "livelihood" text,
  "opening_state" text,
  "connections" text,
  "uncertainty" text,
  "core_station" bigint,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_content_anchor_refs" (
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("parent_id", "ordinal")
);
CREATE TABLE wiki."region_atlas_document_content_canon_refs" (
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("parent_id", "ordinal")
);
CREATE TABLE wiki."region_atlas_document_content_inhabitants" (
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("parent_id", "ordinal")
);
CREATE TABLE wiki."region_atlas_document_content_polity_contexts" (
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("parent_id", "ordinal")
);
CREATE TABLE wiki."region_atlas_document_content_shortages" (
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("parent_id", "ordinal")
);
CREATE TABLE wiki."region_atlas_document_cost" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "resource" text,
  "amount" text,
  "unit" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_coverage" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "region_count" text,
  "district_count" text,
  "selected_union_area_m2" text,
  "gap_m2" text,
  "overlap_m2" text,
  "regions_without_stations" text,
  "official_real_world_completeness" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_district" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "id" text,
  "name" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_district_region_ids" (
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("parent_id", "ordinal")
);
CREATE TABLE wiki."region_atlas_document_document" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "schema" text,
  "as_of" text,
  "map_note" text,
  "attribution" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_epoch" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "absolute_date" text,
  "id" text,
  "label" text,
  "source" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_floor" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "level_number" text,
  "level_text" text,
  "label" text,
  "state" text,
  "contents" text,
  "condition" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_hazard" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "kind" text,
  "description" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_holder" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "polity" text,
  "control" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_landuse" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "object_count" text,
  "tag" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_neighbor" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "region_id" text,
  "shared_boundary_m" text,
  "travel_edge" bigint,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_osm" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "acquired_at" text,
  "complete_official_roster" bigint,
  "modified_at" text,
  "path" text,
  "policy" text,
  "sha256" text,
  "snapshot_at" text,
  "snapshot_basis" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_outcome" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "kind" text,
  "effect" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_point" (
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "x_decimal" text NOT NULL,
  "y_decimal" text NOT NULL,
  PRIMARY KEY ("parent_id", "ordinal")
);
CREATE TABLE wiki."region_atlas_document_polygon" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "type" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_production" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_production_outputs" (
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("parent_id", "ordinal")
);
CREATE TABLE wiki."region_atlas_document_production_requires" (
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("parent_id", "ordinal")
);
CREATE TABLE wiki."region_atlas_document_profile" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "anchor_scope" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_receipt" (
  "id" bigint CHECK(id=1),
  "source_sha256" text NOT NULL,
  "object_sha256" text NOT NULL,
  "actor" text NOT NULL,
  "reason" text NOT NULL,
  PRIMARY KEY ("id")
);
CREATE TABLE wiki."region_atlas_document_region" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "id" text,
  "name" text,
  "district_id" text,
  "district_name" text,
  "area_m2" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_region_facility_ids" (
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("parent_id", "ordinal")
);
CREATE TABLE wiki."region_atlas_document_region_station_ids" (
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("parent_id", "ordinal")
);
CREATE TABLE wiki."region_atlas_document_ring" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_selected_boundary" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "attribution" text,
  "authority" text,
  "cleanup_policy" text,
  "coverage_tolerance_m2" text,
  "filter" text,
  "license" text,
  "measurement_crs" text,
  "overlap_excess_m2" text,
  "path" text,
  "precision_policy" text,
  "publication_commit_date" text,
  "retrieved_on" text,
  "selected_union_area_m2" text,
  "sha256" text,
  "source_crs" text,
  "source_districts" text,
  "source_effective_date" text,
  "source_id" text,
  "source_regions" text,
  "source_url" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_selection" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "as_of" text,
  "decision_kind" text,
  "reason" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_selection_epoch" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "absolute_date" text,
  "id" text,
  "label" text,
  "source" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_selection_terrain" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "observation_date" text,
  "observation_date_reason" text,
  "policy" text,
  "source_object_modified_month" text,
  "source_object_modified_precision" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_site" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "id" text,
  "name" text,
  "named" bigint,
  "primary_region_id" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_site_kinds" (
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("parent_id", "ordinal")
);
CREATE TABLE wiki."region_atlas_document_site_region_ids" (
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("parent_id", "ordinal")
);
CREATE TABLE wiki."region_atlas_document_site_tag" (
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  "value" text NOT NULL,
  PRIMARY KEY ("parent_id", "ordinal"),
  UNIQUE(parent_id,key)
);
CREATE TABLE wiki."region_atlas_document_terrain" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "max_m" text,
  "mean_m" text,
  "method" text,
  "min_m" text,
  "observation_date" text,
  "relief_m" text,
  "sample_count" text,
  "source_object_modified_month" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_atlas_document_terrain_source_refs" (
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("parent_id", "ordinal")
);
CREATE TABLE wiki."region_atlas_document_territory" (
  "row_id" bigint,
  "parent_id" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "shape" bigint NOT NULL CHECK(shape>=0),
  "status" text,
  PRIMARY KEY ("row_id"),
  UNIQUE(parent_id,ordinal)
);
CREATE TABLE wiki."region_content_action" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "id" text,
  "label" text,
  "target_ref" text,
  "tradeoff" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."region_content_anchor_ref" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."region_content_authority" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "kind" text,
  "name" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."region_content_building" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "anchor_ref" text,
  "name" text,
  "observed_use" text,
  "river" text,
  "opening_use" text,
  "how" text,
  "role" text,
  "observed_levels_source" text,
  "observed_levels" double precision,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."region_content_canon_ref" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."region_content_content" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "source_kind" text,
  "fictional_epoch" text,
  "title" text,
  "summary" text,
  "livelihood" text,
  "opening_state" text,
  "connections" text,
  "uncertainty" text,
  "core_station" bigint CHECK(core_station IN (0,1)),
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."region_content_cost" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "resource" text,
  "amount" double precision,
  "unit" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."region_content_document" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "schema" text,
  "district_id" text,
  "district_name" text,
  "as_of" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."region_content_floor" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "level_number" double precision,
  "level_text" text,
  "label" text,
  "state" text,
  "contents" text,
  "condition" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal),
  CHECK(level_number IS NULL OR level_text IS NULL)
);
CREATE TABLE wiki."region_content_hazard" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "kind" text,
  "description" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."region_content_holder" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "polity" text,
  "control" double precision,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."region_content_import" (
  "logical_path" text NOT NULL,
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64),
  "document_sha256" text NOT NULL CHECK(length(document_sha256)=64),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki."region_content_inhabitant" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."region_content_key" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  "is_null" bigint NOT NULL CHECK(is_null IN (0,1)),
  PRIMARY KEY ("logical_path", "object_path", "ordinal"),
  UNIQUE(logical_path,object_path,key)
);
CREATE TABLE wiki."region_content_outcome" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "kind" text,
  "effect" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."region_content_output" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."region_content_polity_context" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."region_content_production" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."region_content_region" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "region_id" text,
  "name" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."region_content_requirement" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."region_content_shortage" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "value" text NOT NULL,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."region_content_territory" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "parent_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "status" text,
  PRIMARY KEY ("logical_path", "object_path"),
  UNIQUE(logical_path,parent_path,ordinal)
);
CREATE TABLE wiki."relation" (
  "relation_id" text NOT NULL,
  "source_id" bigint NOT NULL,
  "row_ordinal" bigint NOT NULL CHECK(row_ordinal >= 0),
  "section_anchor" text,
  "from_person_id" text NOT NULL,
  "to_person_id" text NOT NULL,
  "type_ko" text NOT NULL,
  "type_en" text,
  "grounds_ko" text NOT NULL,
  "grounds_en" text NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("relation_id"),
  UNIQUE ("row_ordinal"),
  UNIQUE ("json_pointer"),
  UNIQUE(source_id,row_ordinal)
);
CREATE TABLE wiki."relation_input_metadata" (
  "singleton" bigint CHECK(singleton=1),
  "source_id" bigint NOT NULL,
  "sha256" text NOT NULL,
  "config_digest" text NOT NULL,
  "schema_name" text NOT NULL,
  "note" text NOT NULL,
  "owner_note" text NOT NULL,
  "membership_schema" text NOT NULL,
  "membership_year" bigint NOT NULL,
  "membership_note" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."relation_input_provisional_person" (
  "ordinal" bigint CHECK(ordinal>=0),
  "person_id" text NOT NULL,
  "name" text NOT NULL,
  "source_anchor" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("person_id")
);
CREATE TABLE wiki."relation_proposal_document" (
  "singleton" bigint CHECK(singleton=1),
  "source_sha256" text NOT NULL,
  "status" text NOT NULL CHECK(status='unpublished-proposal'),
  "source" text NOT NULL,
  "note" text NOT NULL,
  "actor" text NOT NULL,
  "reason" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."relation_proposal_document_column" (
  "ordinal" bigint CHECK(ordinal BETWEEN 0 AND 3),
  "ko" text NOT NULL,
  "en" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."relation_proposal_document_row" (
  "ordinal" bigint CHECK(ordinal BETWEEN 0 AND 6),
  "person_ko" text NOT NULL,
  "person_en" text NOT NULL,
  "type_ko" text NOT NULL,
  "type_en" text NOT NULL,
  "target_ko" text NOT NULL,
  "target_en" text NOT NULL,
  "grounds_ko" text NOT NULL,
  "grounds_en" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."relation_type" (
  "type_ko" text NOT NULL,
  "type_en" text,
  "type_ordinal" bigint NOT NULL CHECK(type_ordinal >= 0),
  PRIMARY KEY ("type_ko"),
  UNIQUE ("type_ordinal"),
  UNIQUE(type_ko,type_en)
);
CREATE TABLE wiki."retired_territory_documents_control" (
  "logical_path" text NOT NULL,
  "schema" text NOT NULL CHECK(schema='outside-control-2126.v3'),
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki."retired_territory_documents_import" (
  "logical_path" text NOT NULL,
  "source_kind" text NOT NULL CHECK(source_kind IN ('control','island')),
  "source_role" text NOT NULL CHECK(source_role='retired-current'),
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64),
  "document_sha256" text NOT NULL CHECK(length(document_sha256)=64),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  "receipt_sha256" text NOT NULL CHECK(length(receipt_sha256)=64),
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki."retired_territory_documents_island" (
  "logical_path" text NOT NULL,
  "schema" text NOT NULL CHECK(schema='outside-island-occupation.v1'),
  "geometry_source" text NOT NULL CHECK(geometry_source='public/outside-admin-units.json'),
  "geometry_source_sha256" text NOT NULL CHECK(geometry_source_sha256='c01ef44a0eb00978662ba7a6240ccb1da287fb52abd85104a1758969d391132f'),
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki."retired_territory_documents_key" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  "is_null" bigint NOT NULL CHECK(is_null IN (0,1)),
  PRIMARY KEY ("logical_path", "object_path", "ordinal"),
  UNIQUE(logical_path,object_path,key)
);
CREATE TABLE wiki."retirement_prose" (
  "source_id" bigint NOT NULL,
  "source_pointer" text NOT NULL,
  "predecessor_text" text NOT NULL,
  "current_text" text NOT NULL,
  "predecessor_sha256" text NOT NULL,
  "current_sha256" text NOT NULL,
  "actor" text NOT NULL,
  "decision_ref" text NOT NULL,
  PRIMARY KEY ("source_id", "source_pointer")
);
CREATE TABLE wiki."skill" (
  "person_id" text NOT NULL,
  "skill_ordinal" bigint NOT NULL CHECK(skill_ordinal>=0),
  "skill_id_presence" text NOT NULL CHECK(skill_id_presence IN ('missing','null','value')),
  "skill_id" text,
  "name_ko" text NOT NULL CHECK(length(trim(name_ko))>0),
  "name_en" text NOT NULL CHECK(length(trim(name_en))>0),
  "rating" double precision NOT NULL CHECK(rating>=0 AND rating<=99.9 AND abs(rating*10-round(rating*10))<0.00000001),
  "json_pointer" text NOT NULL CHECK(json_pointer ~ '^/profiles/[0-9].*/skills/[0-9].*$'),
  PRIMARY KEY ("person_id", "skill_ordinal"),
  CHECK((skill_id_presence='value' AND skill_id IS NOT NULL) OR (skill_id_presence IN ('missing','null') AND skill_id IS NULL))
);
CREATE TABLE wiki."source_check_issue" (
  "check_name" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal >= 0),
  "category" text NOT NULL,
  "person_id" text,
  "raw_line" text NOT NULL,
  PRIMARY KEY ("check_name", "ordinal")
);
CREATE TABLE wiki."source_check_run" (
  "check_name" text NOT NULL,
  "exit_code" bigint NOT NULL,
  "stdout_sha256" text NOT NULL CHECK(length(stdout_sha256) = 64),
  "stderr_sha256" text NOT NULL CHECK(length(stderr_sha256) = 64),
  "issue_count" bigint NOT NULL CHECK(issue_count >= 0),
  PRIMARY KEY ("check_name")
);
CREATE TABLE wiki."source_file" (
  "source_id" bigint,
  "logical_path" text NOT NULL,
  "media_type" text NOT NULL,
  "sha256" text NOT NULL CHECK(length(sha256) = 64),
  "byte_length" bigint NOT NULL CHECK(byte_length >= 0),
  "raw_bytes" bytea NOT NULL CHECK(length(raw_bytes) = byte_length),
  PRIMARY KEY ("source_id"),
  UNIQUE ("logical_path")
);
CREATE TABLE wiki."source_record" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "parent_pointer" text,
  "ordinal" bigint NOT NULL CHECK(ordinal >= 0),
  "field_name" text,
  "json_type" text NOT NULL CHECK(json_type IN ('object','array','null','boolean','integer','real','text')),
  "text_value" text,
  "integer_value" bigint,
  "real_value" double precision,
  "boolean_value" bigint CHECK(boolean_value IN (0,1)),
  PRIMARY KEY ("source_id", "json_pointer"),
  CHECK(
    (json_type IN ('object','array','null') AND text_value IS NULL AND integer_value IS NULL AND real_value IS NULL AND boolean_value IS NULL)
    OR (json_type = 'text' AND text_value IS NOT NULL AND integer_value IS NULL AND real_value IS NULL AND boolean_value IS NULL)
    OR (json_type = 'integer' AND text_value IS NULL AND integer_value IS NOT NULL AND real_value IS NULL AND boolean_value IS NULL)
    OR (json_type = 'real' AND text_value IS NULL AND integer_value IS NULL AND real_value IS NOT NULL AND boolean_value IS NULL)
    OR (json_type = 'boolean' AND text_value IS NULL AND integer_value IS NULL AND real_value IS NULL AND boolean_value IS NOT NULL)
  )
);
CREATE TABLE wiki."source_reference" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "reference_logical_path" text NOT NULL,
  "reference_anchor" text,
  "anchor_verification" text NOT NULL CHECK(anchor_verification IN ('json-pointer-verified','json-pointer-unresolved','verified-path-only')),
  PRIMARY KEY ("source_id", "json_pointer", "ordinal")
);
CREATE TABLE wiki."state" (
  "state_id" text NOT NULL CHECK(length(trim(state_id)) > 0 AND state_id = trim(state_id)),
  "name_ko" text,
  PRIMARY KEY ("state_id"),
  UNIQUE ("name_ko")
);
CREATE TABLE wiki."state_formation_document_document" (
  "document_id" bigint CHECK (document_id = 1),
  "source_sha256" text NOT NULL CHECK (length(source_sha256) = 64),
  "document_sha256" text NOT NULL CHECK (length(document_sha256) = 64),
  "schema" text NOT NULL,
  "contract_id" text NOT NULL,
  "scope" text NOT NULL,
  "independent_acquisition_creates_state" bigint NOT NULL CHECK (independent_acquisition_creates_state IN (0, 1)),
  "grant_requires_prior_membership" bigint NOT NULL CHECK (grant_requires_prior_membership IN (0, 1)),
  "territorial_control_is_personal_holding" bigint NOT NULL CHECK (territorial_control_is_personal_holding IN (0, 1)),
  "state_registry" text NOT NULL,
  "membership_registry" text NOT NULL,
  "personal_holding_registry" text NOT NULL,
  "rule_source" text NOT NULL,
  "clause" text NOT NULL,
  "storage_relationship" text NOT NULL,
  "historical_count" bigint NOT NULL,
  "historical_range" text NOT NULL,
  "historical_approval_ref" text NOT NULL,
  "centers_confer_exclusive_geographic_ownership" bigint NOT NULL CHECK (centers_confer_exclusive_geographic_ownership IN (0, 1)),
  "geographic_partition_count" bigint NOT NULL,
  "geographic_ownership_determined_by_this_contract" bigint NOT NULL CHECK (geographic_ownership_determined_by_this_contract IN (0, 1)),
  "actor" text NOT NULL CHECK (length(trim(actor)) > 0),
  "reason" text NOT NULL CHECK (length(trim(reason)) > 0),
  "receipt_sha256" text NOT NULL CHECK (length(receipt_sha256) = 64),
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."state_formation_document_faction" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "name" text NOT NULL,
  "center_region" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."state_formation_document_identity" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "id" text NOT NULL,
  "name" text NOT NULL,
  "sovereign_person_id" text NOT NULL,
  "kind" text NOT NULL,
  "rank" text NOT NULL,
  "confers_whole_geographic_kingdom_ownership" bigint NOT NULL CHECK (confers_whole_geographic_kingdom_ownership IN (0, 1)),
  "approval_ref" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."state_formation_document_key" (
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "key" text NOT NULL,
  PRIMARY KEY ("object_path", "ordinal")
);
CREATE TABLE wiki."state_formation_document_prerequisite" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "id" text NOT NULL,
  "status" text NOT NULL,
  "source_present" bigint NOT NULL CHECK (source_present IN (0, 1)),
  "source_repository" text,
  "source_path" text,
  "source_pointer" text,
  "source_sha256" text,
  "approval_ref" text,
  "reason" text,
  PRIMARY KEY ("ordinal"),
  CHECK (
    (source_present = 1
      AND source_repository IS NOT NULL
      AND source_path IS NOT NULL
      AND source_pointer IS NOT NULL
      AND source_sha256 IS NOT NULL
      AND approval_ref IS NOT NULL
      AND reason IS NULL)
    OR
    (source_present = 0
      AND source_repository IS NULL
      AND source_path IS NULL
      AND source_pointer IS NULL
      AND source_sha256 IS NULL
      AND approval_ref IS NULL
      AND reason IS NOT NULL)
  )
);
CREATE TABLE wiki."state_label" (
  "state_id" text NOT NULL,
  "name_ko" text NOT NULL,
  PRIMARY KEY ("state_id", "name_ko")
);
CREATE TABLE wiki."station_alias_document_alias" (
  "group_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "alias" text NOT NULL,
  PRIMARY KEY ("group_ordinal", "ordinal")
);
CREATE TABLE wiki."station_alias_document_basis" (
  "ordinal" bigint CHECK(ordinal>=0),
  "basis" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."station_alias_document_group" (
  "ordinal" bigint CHECK(ordinal>=0),
  "disposition" text NOT NULL,
  "related_station" text,
  "display_name" text,
  "decision" text,
  "reason" text,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."station_alias_document_key" (
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  PRIMARY KEY ("object_path", "ordinal"),
  UNIQUE(object_path,key)
);
CREATE TABLE wiki."station_alias_document_member" (
  "group_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member" text NOT NULL,
  PRIMARY KEY ("group_ordinal", "ordinal")
);
CREATE TABLE wiki."station_alias_document_neighbor" (
  "group_ordinal" bigint NOT NULL,
  "station_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "neighbor" text NOT NULL,
  PRIMARY KEY ("group_ordinal", "station_ordinal", "ordinal")
);
CREATE TABLE wiki."station_alias_document_neighbor_key" (
  "group_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "station_key" text NOT NULL,
  PRIMARY KEY ("group_ordinal", "ordinal"),
  UNIQUE(group_ordinal,station_key)
);
CREATE TABLE wiki."station_alias_document_observation" (
  "group_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "source_name" text NOT NULL,
  "line" text NOT NULL,
  "code" text NOT NULL,
  PRIMARY KEY ("group_ordinal", "ordinal")
);
CREATE TABLE wiki."station_alias_document_root" (
  "document_id" bigint CHECK(document_id=1),
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64),
  "document_sha256" text NOT NULL CHECK(length(document_sha256)=64),
  "schema" text NOT NULL,
  "status" text NOT NULL,
  "issue" text NOT NULL,
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  "receipt_sha256" text NOT NULL CHECK(length(receipt_sha256)=64),
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."station_interior_input_candidate" (
  "station_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "observed_levels_source" text,
  "sourceObjectId" text,
  "subject" text,
  "bindingStatus" text,
  "stationObjectId" text,
  "above" bigint,
  "below" bigint,
  "source" text,
  "source_url" text,
  "license" text,
  PRIMARY KEY ("station_ordinal", "ordinal")
);
CREATE TABLE wiki."station_interior_input_document" (
  "singleton" bigint CHECK(singleton=1),
  "schema" text NOT NULL,
  "as_of" text NOT NULL,
  "count" bigint NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."station_interior_input_import" (
  "singleton" bigint CHECK(singleton=1),
  "logical_path" text NOT NULL,
  "source_sha256" text NOT NULL,
  "document_sha256" text NOT NULL,
  "domain_sha256" text NOT NULL,
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."station_interior_input_key" (
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  "is_null" bigint NOT NULL CHECK(is_null IN (0,1)),
  PRIMARY KEY ("object_path", "ordinal"),
  UNIQUE(object_path,key)
);
CREATE TABLE wiki."station_interior_input_layer" (
  "station_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "id" text,
  "wiki_layer" text,
  "state" text,
  "contents" text,
  "condition" text,
  PRIMARY KEY ("station_ordinal", "ordinal")
);
CREATE TABLE wiki."station_interior_input_line" (
  "station_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "line" text,
  "form" text,
  "code" text,
  "above" bigint,
  "below" bigint,
  "area" text,
  "year" text,
  PRIMARY KEY ("station_ordinal", "ordinal")
);
CREATE TABLE wiki."station_interior_input_observation" (
  "station_ordinal" bigint,
  "above" bigint,
  "below" bigint,
  "source" text,
  "source_url" text,
  "license" text,
  "structure" text,
  "osm_id" text,
  PRIMARY KEY ("station_ordinal")
);
CREATE TABLE wiki."station_interior_input_slot" (
  "station_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "kind" text,
  "where" text,
  "note" text,
  PRIMARY KEY ("station_ordinal", "ordinal")
);
CREATE TABLE wiki."station_interior_input_station" (
  "ordinal" bigint CHECK(ordinal>=0),
  "name" text,
  "name_en" text,
  "district" text,
  "lat" double precision,
  "lon" double precision,
  "network" text,
  "observed_levels_source" text,
  "epoch" text,
  "collapse_plus_years" bigint,
  "river" text,
  "uncertainty" text,
  "facilityKind" text,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."surname_origin_bongwan" (
  "surname_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "id" text NOT NULL,
  "name" text NOT NULL,
  "hanja_present" bigint NOT NULL CHECK (hanja_present = 1),
  "hanja" text,
  "majority" bigint NOT NULL CHECK (majority IN (0, 1)),
  PRIMARY KEY ("surname_ordinal", "ordinal"),
  UNIQUE ("id")
);
CREATE TABLE wiki."surname_origin_bongwan_key" (
  "surname_ordinal" bigint NOT NULL,
  "bongwan_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "key" text NOT NULL,
  PRIMARY KEY ("surname_ordinal", "bongwan_ordinal", "ordinal"),
  UNIQUE (surname_ordinal, bongwan_ordinal, key)
);
CREATE TABLE wiki."surname_origin_bongwan_source" (
  "surname_ordinal" bigint NOT NULL,
  "bongwan_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "source_id" text NOT NULL,
  PRIMARY KEY ("surname_ordinal", "bongwan_ordinal", "ordinal")
);
CREATE TABLE wiki."surname_origin_document" (
  "document_id" bigint CHECK (document_id = 1),
  "source_sha256" text NOT NULL,
  "id" text NOT NULL,
  "schema" bigint NOT NULL,
  "note" text NOT NULL,
  "actor" text NOT NULL CHECK (length(trim(actor)) > 0),
  "reason" text NOT NULL CHECK (length(trim(reason)) > 0),
  "receipt_sha256" text NOT NULL,
  PRIMARY KEY ("document_id")
);
CREATE TABLE wiki."surname_origin_source" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "document_id" bigint NOT NULL,
  "id" text NOT NULL,
  "record_id_present" bigint NOT NULL CHECK (record_id_present IN (0, 1)),
  "record_id" text,
  "url" text NOT NULL,
  "accessed" text NOT NULL,
  "quote" text NOT NULL,
  "evidence" text NOT NULL,
  "live_check" text NOT NULL,
  "live_check_ref_present" bigint NOT NULL CHECK (live_check_ref_present IN (0, 1)),
  "live_check_ref" text,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("id"),
  CHECK ((record_id_present = 0 AND record_id IS NULL) OR (record_id_present = 1 AND record_id IS NOT NULL)),
  CHECK ((live_check_ref_present = 0 AND live_check_ref IS NULL) OR (live_check_ref_present = 1 AND live_check_ref IS NOT NULL))
);
CREATE TABLE wiki."surname_origin_source_key" (
  "source_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "key" text NOT NULL,
  PRIMARY KEY ("source_ordinal", "ordinal"),
  UNIQUE (source_ordinal, key)
);
CREATE TABLE wiki."surname_origin_surname" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "document_id" bigint NOT NULL,
  "id" text NOT NULL,
  "hangul" text NOT NULL,
  "hanja_present" bigint NOT NULL CHECK (hanja_present IN (0, 1)),
  "hanja" text,
  "population_2015_present" bigint NOT NULL CHECK (population_2015_present IN (0, 1)),
  "population_2015" bigint,
  "population_2000_present" bigint NOT NULL CHECK (population_2000_present IN (0, 1)),
  "population_2000" bigint,
  "population_1985_present" bigint NOT NULL CHECK (population_1985_present IN (0, 1)),
  "population_1985" bigint,
  "bongwan_unlisted_reason_present" bigint NOT NULL CHECK (bongwan_unlisted_reason_present IN (0, 1)),
  "bongwan_unlisted_reason" text,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("id"),
  CHECK (hanja_present = 1),
  CHECK (population_2015_present = 1 OR population_2015 IS NULL),
  CHECK (population_2000_present = 1 OR population_2000 IS NULL),
  CHECK (population_1985_present = 1 OR population_1985 IS NULL),
  CHECK ((bongwan_unlisted_reason_present = 0 AND bongwan_unlisted_reason IS NULL) OR (bongwan_unlisted_reason_present = 1 AND bongwan_unlisted_reason IS NOT NULL))
);
CREATE TABLE wiki."surname_origin_surname_key" (
  "surname_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "key" text NOT NULL,
  PRIMARY KEY ("surname_ordinal", "ordinal"),
  UNIQUE (surname_ordinal, key)
);
CREATE TABLE wiki."surname_origin_surname_source" (
  "surname_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "source_id" text NOT NULL,
  PRIMARY KEY ("surname_ordinal", "ordinal")
);
CREATE TABLE wiki."text_affiliation" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("source_id"),
  CHECK(json_pointer='/data/currentAffiliation')
);
CREATE TABLE wiki."text_affiliation_hegemon" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "kind" text NOT NULL CHECK(kind IN ('state','union')),
  "state_id" text,
  "name" text NOT NULL,
  "center_region" text NOT NULL,
  "ai_position" text NOT NULL,
  "color" text NOT NULL,
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id,ordinal),
  CHECK((kind='state' AND state_id IS NOT NULL) OR (kind='union' AND state_id IS NULL))
);
CREATE TABLE wiki."text_affiliation_member" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "hegemon_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "state_id" text NOT NULL,
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id,hegemon_ordinal,ordinal)
);
CREATE TABLE wiki."text_affiliation_neutral" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "state_id" text NOT NULL,
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id,ordinal)
);
CREATE TABLE wiki."text_affiliation_state" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "state_id" text NOT NULL,
  "current_name" text NOT NULL,
  "base_kind" text NOT NULL CHECK(base_kind IN ('station','facility')),
  "station_id" text,
  "landmark_id" text,
  "base_name" text NOT NULL,
  "exclusive_districts" text NOT NULL,
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id,ordinal),
  UNIQUE(source_id,state_id),
  CHECK((base_kind='station' AND station_id IS NOT NULL AND landmark_id IS NULL) OR (base_kind='facility' AND landmark_id IS NOT NULL AND station_id IS NULL))
);
CREATE TABLE wiki."text_ailments_example" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/symptom'),
  "symptom" text NOT NULL,
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."text_atlas" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "arcs__type" text CHECK(arcs__type IN ('array')),
  "change_ledger__type" text CHECK(change_ledger__type IN ('array')),
  "document__type" text CHECK(document__type IN ('object')),
  "document__change_ledger_entry__type" text CHECK(document__change_ledger_entry__type IN ('string')),
  "document__change_ledger_entry" text,
  "document__dependencies__type" text CHECK(document__dependencies__type IN ('array')),
  "document__display_name__type" text CHECK(document__display_name__type IN ('object')),
  "document__display_name__en__type" text CHECK(document__display_name__en__type IN ('string')),
  "document__display_name__en" text,
  "document__display_name__ko__type" text CHECK(document__display_name__ko__type IN ('string')),
  "document__display_name__ko" text,
  "document__document_status__type" text CHECK(document__document_status__type IN ('string')),
  "document__document_status" text,
  "document__id__type" text CHECK(document__id__type IN ('string')),
  "document__id" text,
  "document__last_verified_commit__type" text CHECK(document__last_verified_commit__type IN ('string')),
  "document__last_verified_commit" text,
  "document__owner__type" text CHECK(document__owner__type IN ('string')),
  "document__owner" text,
  "document__projection_targets__type" text CHECK(document__projection_targets__type IN ('array')),
  "document__related_ids__type" text CHECK(document__related_ids__type IN ('array')),
  "document__revision__type" text CHECK(document__revision__type IN ('string')),
  "document__revision" text,
  "document__source_anchors__type" text CHECK(document__source_anchors__type IN ('array')),
  "document__source_kind__type" text CHECK(document__source_kind__type IN ('string')),
  "document__source_kind" text,
  "document__support_reviewers__type" text CHECK(document__support_reviewers__type IN ('array')),
  "document__verification_state__type" text CHECK(document__verification_state__type IN ('string')),
  "document__verification_state" text,
  "hostile_groups__type" text CHECK(hostile_groups__type IN ('array')),
  "houses__type" text CHECK(houses__type IN ('array')),
  "humans__type" text CHECK(humans__type IN ('array')),
  "monster_batches__type" text CHECK(monster_batches__type IN ('array')),
  "monster_contents__type" text CHECK(monster_contents__type IN ('map')),
  "projection_pages__type" text CHECK(projection_pages__type IN ('map')),
  "relations__type" text CHECK(relations__type IN ('array')),
  "schema__type" text CHECK(schema__type IN ('string')),
  "schema" text,
  "states__type" text CHECK(states__type IN ('array')),
  "synthetics__type" text CHECK(synthetics__type IN ('array')),
  "theaters__type" text CHECK(theaters__type IN ('array')),
  "additional_people__type" text CHECK(additional_people__type IN ('map')),
  "writing_contract__type" text CHECK(writing_contract__type IN ('object')),
  "writing_contract__guide_register__type" text CHECK(writing_contract__guide_register__type IN ('string')),
  "writing_contract__guide_register" text,
  "writing_contract__honorifics__type" text CHECK(writing_contract__honorifics__type IN ('string')),
  "writing_contract__honorifics" text,
  "writing_contract__hostile_rule__type" text CHECK(writing_contract__hostile_rule__type IN ('string')),
  "writing_contract__hostile_rule" text,
  "writing_contract__multicultural_rule__type" text CHECK(writing_contract__multicultural_rule__type IN ('string')),
  "writing_contract__multicultural_rule" text,
  "writing_contract__narrative_register__type" text CHECK(writing_contract__narrative_register__type IN ('string')),
  "writing_contract__narrative_register" text,
  "writing_contract__source_kind_visible__type" text CHECK(writing_contract__source_kind_visible__type IN ('boolean')),
  "writing_contract__source_kind_visible" bigint,
  "writing_contract__synthetic_rule__type" text CHECK(writing_contract__synthetic_rule__type IN ('string')),
  "writing_contract__synthetic_rule" text,
  "writing_contract__viewpoint__type" text CHECK(writing_contract__viewpoint__type IN ('string')),
  "writing_contract__viewpoint" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer),
  CHECK(parent_key IS NULL)
);
CREATE TABLE wiki."text_atlas_additional_people" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "character_id__type" text CHECK(character_id__type IN ('string')),
  "character_id" text,
  "name__type" text CHECK(name__type IN ('object')),
  "name__ko__type" text CHECK(name__ko__type IN ('string')),
  "name__ko" text,
  "name__en__type" text CHECK(name__en__type IN ('string')),
  "name__en" text,
  "detail_route__type" text CHECK(detail_route__type IN ('string')),
  "detail_route" text,
  "national_state_id__type" text CHECK(national_state_id__type IN ('string','null')),
  "national_state_id" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_arcs" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "acts__type" text CHECK(acts__type IN ('array')),
  "group_ids__type" text CHECK(group_ids__type IN ('array')),
  "house_ids__type" text CHECK(house_ids__type IN ('array')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "owner__type" text CHECK(owner__type IN ('string')),
  "owner" text,
  "source_anchors__type" text CHECK(source_anchors__type IN ('array')),
  "source_kind__type" text CHECK(source_kind__type IN ('string')),
  "source_kind" text,
  "synthetic_classes__type" text CHECK(synthetic_classes__type IN ('array')),
  "theater_ids__type" text CHECK(theater_ids__type IN ('array')),
  "title__type" text CHECK(title__type IN ('object')),
  "title__en__type" text CHECK(title__en__type IN ('string')),
  "title__en" text,
  "title__ko__type" text CHECK(title__ko__type IN ('string')),
  "title__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_arcs_acts" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "act__type" text CHECK(act__type IN ('number')),
  "act" double precision,
  "summary__type" text CHECK(summary__type IN ('object')),
  "summary__en__type" text CHECK(summary__en__type IN ('string')),
  "summary__en" text,
  "summary__ko__type" text CHECK(summary__ko__type IN ('string')),
  "summary__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_arcs_group_ids" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_arcs_house_ids" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_arcs_source_anchors" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_arcs_synthetic_classes" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_arcs_theater_ids" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_change_ledger" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "owner__type" text CHECK(owner__type IN ('string')),
  "owner" text,
  "summary__type" text CHECK(summary__type IN ('object')),
  "summary__en__type" text CHECK(summary__en__type IN ('string')),
  "summary__en" text,
  "summary__ko__type" text CHECK(summary__ko__type IN ('string')),
  "summary__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_document_dependencies" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_document_projection_targets" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_document_related_ids" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_document_source_anchors" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_hostile_groups" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "adaptation__type" text CHECK(adaptation__type IN ('object')),
  "adaptation__en__type" text CHECK(adaptation__en__type IN ('string')),
  "adaptation__en" text,
  "adaptation__ko__type" text CHECK(adaptation__ko__type IN ('string')),
  "adaptation__ko" text,
  "bestiary__type" text CHECK(bestiary__type IN ('object')),
  "bestiary__command_scope__type" text CHECK(bestiary__command_scope__type IN ('object')),
  "bestiary__command_scope__en__type" text CHECK(bestiary__command_scope__en__type IN ('string')),
  "bestiary__command_scope__en" text,
  "bestiary__command_scope__ko__type" text CHECK(bestiary__command_scope__ko__type IN ('string')),
  "bestiary__command_scope__ko" text,
  "bestiary__common_ecology__type" text CHECK(bestiary__common_ecology__type IN ('object')),
  "bestiary__common_ecology__en__type" text CHECK(bestiary__common_ecology__en__type IN ('string')),
  "bestiary__common_ecology__en" text,
  "bestiary__common_ecology__ko__type" text CHECK(bestiary__common_ecology__ko__type IN ('string')),
  "bestiary__common_ecology__ko" text,
  "bestiary__variant_relation__type" text CHECK(bestiary__variant_relation__type IN ('object')),
  "bestiary__variant_relation__en__type" text CHECK(bestiary__variant_relation__en__type IN ('string')),
  "bestiary__variant_relation__en" text,
  "bestiary__variant_relation__ko__type" text CHECK(bestiary__variant_relation__ko__type IN ('string')),
  "bestiary__variant_relation__ko" text,
  "category__type" text CHECK(category__type IN ('string')),
  "category" text,
  "combat_counterplay__type" text CHECK(combat_counterplay__type IN ('object')),
  "combat_counterplay__en__type" text CHECK(combat_counterplay__en__type IN ('string')),
  "combat_counterplay__en" text,
  "combat_counterplay__ko__type" text CHECK(combat_counterplay__ko__type IN ('string')),
  "combat_counterplay__ko" text,
  "display_name__type" text CHECK(display_name__type IN ('object')),
  "display_name__en__type" text CHECK(display_name__en__type IN ('string')),
  "display_name__en" text,
  "display_name__ko__type" text CHECK(display_name__ko__type IN ('string')),
  "display_name__ko" text,
  "dossier_prose__type" text CHECK(dossier_prose__type IN ('array')),
  "economy__type" text CHECK(economy__type IN ('object')),
  "economy__en__type" text CHECK(economy__en__type IN ('string')),
  "economy__en" text,
  "economy__ko__type" text CHECK(economy__ko__type IN ('string')),
  "economy__ko" text,
  "escalation__type" text CHECK(escalation__type IN ('object')),
  "escalation__en__type" text CHECK(escalation__en__type IN ('string')),
  "escalation__en" text,
  "escalation__ko__type" text CHECK(escalation__ko__type IN ('string')),
  "escalation__ko" text,
  "fictional_origin__type" text CHECK(fictional_origin__type IN ('object')),
  "fictional_origin__en__type" text CHECK(fictional_origin__en__type IN ('string')),
  "fictional_origin__en" text,
  "fictional_origin__ko__type" text CHECK(fictional_origin__ko__type IN ('string')),
  "fictional_origin__ko" text,
  "hierarchy__type" text CHECK(hierarchy__type IN ('object')),
  "hierarchy__en__type" text CHECK(hierarchy__en__type IN ('string')),
  "hierarchy__en" text,
  "hierarchy__ko__type" text CHECK(hierarchy__ko__type IN ('string')),
  "hierarchy__ko" text,
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "lifecycle__type" text CHECK(lifecycle__type IN ('object')),
  "lifecycle__en__type" text CHECK(lifecycle__en__type IN ('string')),
  "lifecycle__en" text,
  "lifecycle__ko__type" text CHECK(lifecycle__ko__type IN ('string')),
  "lifecycle__ko" text,
  "links__type" text CHECK(links__type IN ('object')),
  "links__corporations_successor_only__type" text CHECK(links__corporations_successor_only__type IN ('array')),
  "links__houses__type" text CHECK(links__houses__type IN ('array')),
  "links__states__type" text CHECK(links__states__type IN ('array')),
  "links__synthetics__type" text CHECK(links__synthetics__type IN ('array')),
  "links__theaters__type" text CHECK(links__theaters__type IN ('array')),
  "modern_anxiety__type" text CHECK(modern_anxiety__type IN ('object')),
  "modern_anxiety__en__type" text CHECK(modern_anxiety__en__type IN ('string')),
  "modern_anxiety__en" text,
  "modern_anxiety__ko__type" text CHECK(modern_anxiety__ko__type IN ('string')),
  "modern_anxiety__ko" text,
  "moral_cost__type" text CHECK(moral_cost__type IN ('object')),
  "moral_cost__en__type" text CHECK(moral_cost__en__type IN ('string')),
  "moral_cost__en" text,
  "moral_cost__ko__type" text CHECK(moral_cost__ko__type IN ('string')),
  "moral_cost__ko" text,
  "negotiation__type" text CHECK(negotiation__type IN ('object')),
  "negotiation__en__type" text CHECK(negotiation__en__type IN ('string')),
  "negotiation__en" text,
  "negotiation__ko__type" text CHECK(negotiation__ko__type IN ('string')),
  "negotiation__ko" text,
  "owner__type" text CHECK(owner__type IN ('string')),
  "owner" text,
  "projection_targets__type" text CHECK(projection_targets__type IN ('array')),
  "prose__type" text CHECK(prose__type IN ('array')),
  "revision__type" text CHECK(revision__type IN ('number')),
  "revision" double precision,
  "scenario_links__type" text CHECK(scenario_links__type IN ('array')),
  "scenario_outlines__type" text CHECK(scenario_outlines__type IN ('array')),
  "senses__type" text CHECK(senses__type IN ('object')),
  "senses__en__type" text CHECK(senses__en__type IN ('string')),
  "senses__en" text,
  "senses__ko__type" text CHECK(senses__ko__type IN ('string')),
  "senses__ko" text,
  "source_anchors__type" text CHECK(source_anchors__type IN ('array')),
  "source_kind__type" text CHECK(source_kind__type IN ('string')),
  "source_kind" text,
  "territory_migration__type" text CHECK(territory_migration__type IN ('object')),
  "territory_migration__en__type" text CHECK(territory_migration__en__type IN ('string')),
  "territory_migration__en" text,
  "territory_migration__ko__type" text CHECK(territory_migration__ko__type IN ('string')),
  "territory_migration__ko" text,
  "corridor__type" text CHECK(corridor__type IN ('object')),
  "corridor__ho__type" text CHECK(corridor__ho__type IN ('number')),
  "corridor__ho" double precision,
  "corridor__host_state__type" text CHECK(corridor__host_state__type IN ('string')),
  "corridor__host_state" text,
  "corridor__name__type" text CHECK(corridor__name__type IN ('object')),
  "corridor__name__en__type" text CHECK(corridor__name__en__type IN ('string')),
  "corridor__name__en" text,
  "corridor__name__ko__type" text CHECK(corridor__name__ko__type IN ('string')),
  "corridor__name__ko" text,
  "corridor__station__type" text CHECK(corridor__station__type IN ('object')),
  "corridor__station__en__type" text CHECK(corridor__station__en__type IN ('string')),
  "corridor__station__en" text,
  "corridor__station__ko__type" text CHECK(corridor__station__ko__type IN ('string')),
  "corridor__station__ko" text,
  "scenarios__type" text CHECK(scenarios__type IN ('array')),
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_hostile_groups_dossier_prose" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "anchor__type" text CHECK(anchor__type IN ('string')),
  "anchor" text,
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "text__type" text CHECK(text__type IN ('object')),
  "text__en__type" text CHECK(text__en__type IN ('string')),
  "text__en" text,
  "text__ko__type" text CHECK(text__ko__type IN ('string')),
  "text__ko" text,
  "depth__type" text CHECK(depth__type IN ('number')),
  "depth" double precision,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_hostile_groups_links_corporations_successor_only" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_hostile_groups_links_houses" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_hostile_groups_links_states" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_hostile_groups_links_synthetics" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_hostile_groups_links_theaters" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_hostile_groups_projection_targets" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_hostile_groups_prose" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "anchor__type" text CHECK(anchor__type IN ('string')),
  "anchor" text,
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "text__type" text CHECK(text__type IN ('object')),
  "text__en__type" text CHECK(text__en__type IN ('string')),
  "text__en" text,
  "text__ko__type" text CHECK(text__ko__type IN ('string')),
  "text__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_hostile_groups_scenario_links" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_hostile_groups_scenario_outlines" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "actors__type" text CHECK(actors__type IN ('array')),
  "choices__type" text CHECK(choices__type IN ('array')),
  "dossier_ref__type" text CHECK(dossier_ref__type IN ('string')),
  "dossier_ref" text,
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "mechanism__type" text CHECK(mechanism__type IN ('object')),
  "mechanism__en__type" text CHECK(mechanism__en__type IN ('string')),
  "mechanism__en" text,
  "mechanism__ko__type" text CHECK(mechanism__ko__type IN ('string')),
  "mechanism__ko" text,
  "moral_cost__type" text CHECK(moral_cost__type IN ('object')),
  "moral_cost__en__type" text CHECK(moral_cost__en__type IN ('string')),
  "moral_cost__en" text,
  "moral_cost__ko__type" text CHECK(moral_cost__ko__type IN ('string')),
  "moral_cost__ko" text,
  "outcomes__type" text CHECK(outcomes__type IN ('object')),
  "outcomes__en__type" text CHECK(outcomes__en__type IN ('string')),
  "outcomes__en" text,
  "outcomes__ko__type" text CHECK(outcomes__ko__type IN ('string')),
  "outcomes__ko" text,
  "stage__type" text CHECK(stage__type IN ('number')),
  "stage" double precision,
  "title__type" text CHECK(title__type IN ('object')),
  "title__en__type" text CHECK(title__en__type IN ('string')),
  "title__en" text,
  "title__ko__type" text CHECK(title__ko__type IN ('string')),
  "title__ko" text,
  "trigger__type" text CHECK(trigger__type IN ('object')),
  "trigger__en__type" text CHECK(trigger__en__type IN ('string')),
  "trigger__en" text,
  "trigger__ko__type" text CHECK(trigger__ko__type IN ('string')),
  "trigger__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_hostile_groups_scenario_outlines_actors" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_hostile_groups_scenario_outlines_choices" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_hostile_groups_scenarios" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "summary__type" text CHECK(summary__type IN ('object')),
  "summary__en__type" text CHECK(summary__en__type IN ('string')),
  "summary__en" text,
  "summary__ko__type" text CHECK(summary__ko__type IN ('string')),
  "summary__ko" text,
  "title__type" text CHECK(title__type IN ('object')),
  "title__en__type" text CHECK(title__en__type IN ('string')),
  "title__en" text,
  "title__ko__type" text CHECK(title__ko__type IN ('string')),
  "title__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_hostile_groups_source_anchors" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_houses" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "ai_stewardship__type" text CHECK(ai_stewardship__type IN ('object')),
  "ai_stewardship__accountable_human__type" text CHECK(ai_stewardship__accountable_human__type IN ('object')),
  "ai_stewardship__accountable_human__en__type" text CHECK(ai_stewardship__accountable_human__en__type IN ('string')),
  "ai_stewardship__accountable_human__en" text,
  "ai_stewardship__accountable_human__ko__type" text CHECK(ai_stewardship__accountable_human__ko__type IN ('string')),
  "ai_stewardship__accountable_human__ko" text,
  "ai_stewardship__authorized_functions__type" text CHECK(ai_stewardship__authorized_functions__type IN ('array')),
  "ai_stewardship__dual_key_shutdown__type" text CHECK(ai_stewardship__dual_key_shutdown__type IN ('boolean')),
  "ai_stewardship__dual_key_shutdown" bigint,
  "ai_stewardship__human_veto_required__type" text CHECK(ai_stewardship__human_veto_required__type IN ('boolean')),
  "ai_stewardship__human_veto_required" bigint,
  "ai_stewardship__prohibited_functions__type" text CHECK(ai_stewardship__prohibited_functions__type IN ('array')),
  "ai_stewardship__system_ids__type" text CHECK(ai_stewardship__system_ids__type IN ('array')),
  "arcs__type" text CHECK(arcs__type IN ('array')),
  "charter__type" text CHECK(charter__type IN ('object')),
  "charter__forbidden_powers__type" text CHECK(charter__forbidden_powers__type IN ('array')),
  "charter__mandate_domains__type" text CHECK(charter__mandate_domains__type IN ('array')),
  "charter__public_mission__type" text CHECK(charter__public_mission__type IN ('object')),
  "charter__public_mission__en__type" text CHECK(charter__public_mission__en__type IN ('string')),
  "charter__public_mission__en" text,
  "charter__public_mission__ko__type" text CHECK(charter__public_mission__ko__type IN ('string')),
  "charter__public_mission__ko" text,
  "display_name__type" text CHECK(display_name__type IN ('object')),
  "display_name__en__type" text CHECK(display_name__en__type IN ('string')),
  "display_name__en" text,
  "display_name__ko__type" text CHECK(display_name__ko__type IN ('string')),
  "display_name__ko" text,
  "exclusive_state_ids__type" text CHECK(exclusive_state_ids__type IN ('array')),
  "house_class__type" text CHECK(house_class__type IN ('string')),
  "house_class" text,
  "house_kind__type" text CHECK(house_kind__type IN ('string')),
  "house_kind" text,
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "membership__type" text CHECK(membership__type IN ('object')),
  "membership__classes__type" text CHECK(membership__classes__type IN ('array')),
  "membership__dual_membership_policy__type" text CHECK(membership__dual_membership_policy__type IN ('string')),
  "membership__dual_membership_policy" text,
  "membership__entry_routes__type" text CHECK(membership__entry_routes__type IN ('array')),
  "membership__steward__type" text CHECK(membership__steward__type IN ('object')),
  "membership__steward__en__type" text CHECK(membership__steward__en__type IN ('string')),
  "membership__steward__en" text,
  "membership__steward__ko__type" text CHECK(membership__steward__ko__type IN ('string')),
  "membership__steward__ko" text,
  "obligations__type" text CHECK(obligations__type IN ('array')),
  "owner__type" text CHECK(owner__type IN ('string')),
  "owner" text,
  "projection_targets__type" text CHECK(projection_targets__type IN ('array')),
  "prose__type" text CHECK(prose__type IN ('array')),
  "protected_guests__type" text CHECK(protected_guests__type IN ('array')),
  "regency__type" text CHECK(regency__type IN ('object')),
  "regency__active__type" text CHECK(regency__active__type IN ('boolean')),
  "regency__active" bigint,
  "regency__triad__type" text CHECK(regency__triad__type IN ('array')),
  "revision__type" text CHECK(revision__type IN ('number')),
  "revision" double precision,
  "source_anchors__type" text CHECK(source_anchors__type IN ('array')),
  "source_kind__type" text CHECK(source_kind__type IN ('string')),
  "source_kind" text,
  "states__type" text CHECK(states__type IN ('array')),
  "status__type" text CHECK(status__type IN ('string')),
  "status" text,
  "succession__type" text CHECK(succession__type IN ('object')),
  "succession__caretaker_triad__type" text CHECK(succession__caretaker_triad__type IN ('array')),
  "succession__designated__type" text CHECK(succession__designated__type IN ('object')),
  "succession__designated__en__type" text CHECK(succession__designated__en__type IN ('string')),
  "succession__designated__en" text,
  "succession__designated__ko__type" text CHECK(succession__designated__ko__type IN ('string')),
  "succession__designated__ko" text,
  "succession__state__type" text CHECK(succession__state__type IN ('string')),
  "succession__state" text,
  "succession__trigger_events__type" text CHECK(succession__trigger_events__type IN ('array')),
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_houses_ai_stewardship_authorized_functions" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_houses_ai_stewardship_prohibited_functions" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_houses_ai_stewardship_system_ids" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_houses_arcs" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "act__type" text CHECK(act__type IN ('number')),
  "act" double precision,
  "summary__type" text CHECK(summary__type IN ('object')),
  "summary__en__type" text CHECK(summary__en__type IN ('string')),
  "summary__en" text,
  "summary__ko__type" text CHECK(summary__ko__type IN ('string')),
  "summary__ko" text,
  "title__type" text CHECK(title__type IN ('object')),
  "title__en__type" text CHECK(title__en__type IN ('string')),
  "title__en" text,
  "title__ko__type" text CHECK(title__ko__type IN ('string')),
  "title__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_houses_charter_forbidden_powers" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_houses_charter_mandate_domains" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_houses_membership_classes" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_houses_membership_entry_routes" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_houses_obligations" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "summary__type" text CHECK(summary__type IN ('object')),
  "summary__en__type" text CHECK(summary__en__type IN ('string')),
  "summary__en" text,
  "summary__ko__type" text CHECK(summary__ko__type IN ('string')),
  "summary__ko" text,
  "to__value__type" text CHECK(to__value__type IN ('string')),
  "to__value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_houses_projection_targets" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_houses_prose" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "anchor__type" text CHECK(anchor__type IN ('string')),
  "anchor" text,
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "text__type" text CHECK(text__type IN ('object')),
  "text__en__type" text CHECK(text__en__type IN ('string')),
  "text__en" text,
  "text__ko__type" text CHECK(text__ko__type IN ('string')),
  "text__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_houses_protected_guests" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "terms__type" text CHECK(terms__type IN ('object')),
  "terms__en__type" text CHECK(terms__en__type IN ('string')),
  "terms__en" text,
  "terms__ko__type" text CHECK(terms__ko__type IN ('string')),
  "terms__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_houses_regency_triad" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_houses_source_anchors" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_houses_states" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_houses_succession_caretaker_triad" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_houses_succession_trigger_events" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_humans" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "name__type" text CHECK(name__type IN ('object')),
  "name__en__type" text CHECK(name__en__type IN ('string')),
  "name__en" text,
  "name__ko__type" text CHECK(name__ko__type IN ('string')),
  "name__ko" text,
  "role__type" text CHECK(role__type IN ('object')),
  "role__en__type" text CHECK(role__en__type IN ('string')),
  "role__en" text,
  "role__ko__type" text CHECK(role__ko__type IN ('string')),
  "role__ko" text,
  "source_anchor__type" text CHECK(source_anchor__type IN ('string')),
  "source_anchor" text,
  "stage__type" text CHECK(stage__type IN ('string')),
  "stage" text,
  "state_id__type" text CHECK(state_id__type IN ('string')),
  "state_id" text,
  "state_name__type" text CHECK(state_name__type IN ('object')),
  "state_name__en__type" text CHECK(state_name__en__type IN ('string')),
  "state_name__en" text,
  "state_name__ko__type" text CHECK(state_name__ko__type IN ('string')),
  "state_name__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_monster_batches" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "entry_ids__type" text CHECK(entry_ids__type IN ('array')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "owner__type" text CHECK(owner__type IN ('string')),
  "owner" text,
  "projection_targets__type" text CHECK(projection_targets__type IN ('array')),
  "source_anchors__type" text CHECK(source_anchors__type IN ('array')),
  "source_kind__type" text CHECK(source_kind__type IN ('string')),
  "source_kind" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_monster_batches_entry_ids" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_monster_batches_source_anchors" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_monster_contents" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "entries__type" text CHECK(entries__type IN ('array')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "owner__type" text CHECK(owner__type IN ('string')),
  "owner" text,
  "source_anchors__type" text CHECK(source_anchors__type IN ('array')),
  "source_kind__type" text CHECK(source_kind__type IN ('string')),
  "source_kind" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_monster_contents_entries" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "bestiary__type" text CHECK(bestiary__type IN ('object')),
  "bestiary__battlefield_role__type" text CHECK(bestiary__battlefield_role__type IN ('object')),
  "bestiary__battlefield_role__en__type" text CHECK(bestiary__battlefield_role__en__type IN ('string')),
  "bestiary__battlefield_role__en" text,
  "bestiary__battlefield_role__ko__type" text CHECK(bestiary__battlefield_role__ko__type IN ('string')),
  "bestiary__battlefield_role__ko" text,
  "bestiary__formation__type" text CHECK(bestiary__formation__type IN ('string')),
  "bestiary__formation" text,
  "bestiary__kind__type" text CHECK(bestiary__kind__type IN ('string')),
  "bestiary__kind" text,
  "bestiary__scope_note__type" text CHECK(bestiary__scope_note__type IN ('object')),
  "bestiary__scope_note__en__type" text CHECK(bestiary__scope_note__en__type IN ('string')),
  "bestiary__scope_note__en" text,
  "bestiary__scope_note__ko__type" text CHECK(bestiary__scope_note__ko__type IN ('string')),
  "bestiary__scope_note__ko" text,
  "display_name__type" text CHECK(display_name__type IN ('object')),
  "display_name__en__type" text CHECK(display_name__en__type IN ('string')),
  "display_name__en" text,
  "display_name__ko__type" text CHECK(display_name__ko__type IN ('string')),
  "display_name__ko" text,
  "group_id__type" text CHECK(group_id__type IN ('string')),
  "group_id" text,
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "links__type" text CHECK(links__type IN ('object')),
  "links__scenarios__type" text CHECK(links__scenarios__type IN ('array')),
  "links__states__type" text CHECK(links__states__type IN ('array')),
  "links__houses__type" text CHECK(links__houses__type IN ('array')),
  "links__synthetics__type" text CHECK(links__synthetics__type IN ('array')),
  "links__theaters__type" text CHECK(links__theaters__type IN ('array')),
  "prose__type" text CHECK(prose__type IN ('array')),
  "role_class__type" text CHECK(role_class__type IN ('object')),
  "role_class__en__type" text CHECK(role_class__en__type IN ('string')),
  "role_class__en" text,
  "role_class__ko__type" text CHECK(role_class__ko__type IN ('string')),
  "role_class__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_monster_contents_entries_links_houses" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_monster_contents_entries_links_scenarios" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_monster_contents_entries_links_states" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_monster_contents_entries_links_synthetics" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_monster_contents_entries_links_theaters" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_monster_contents_entries_prose" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "anchor__type" text CHECK(anchor__type IN ('string')),
  "anchor" text,
  "depth__type" text CHECK(depth__type IN ('number')),
  "depth" double precision,
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "text__type" text CHECK(text__type IN ('object')),
  "text__en__type" text CHECK(text__en__type IN ('string')),
  "text__en" text,
  "text__ko__type" text CHECK(text__ko__type IN ('string')),
  "text__ko" text,
  "items__type" text CHECK(items__type IN ('array')),
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_monster_contents_entries_prose_items" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_monster_contents_source_anchors" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_projection_pages" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "intro__type" text CHECK(intro__type IN ('object')),
  "intro__en__type" text CHECK(intro__en__type IN ('string')),
  "intro__en" text,
  "intro__ko__type" text CHECK(intro__ko__type IN ('string')),
  "intro__ko" text,
  "summary__type" text CHECK(summary__type IN ('object')),
  "summary__en__type" text CHECK(summary__en__type IN ('string')),
  "summary__en" text,
  "summary__ko__type" text CHECK(summary__ko__type IN ('string')),
  "summary__ko" text,
  "title__type" text CHECK(title__type IN ('object')),
  "title__en__type" text CHECK(title__en__type IN ('string')),
  "title__en" text,
  "title__ko__type" text CHECK(title__ko__type IN ('string')),
  "title__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_relations" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "from__value__type" text CHECK(from__value__type IN ('string')),
  "from__value" text,
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "reason__type" text CHECK(reason__type IN ('object')),
  "reason__en__type" text CHECK(reason__en__type IN ('string')),
  "reason__en" text,
  "reason__ko__type" text CHECK(reason__ko__type IN ('string')),
  "reason__ko" text,
  "to__value__type" text CHECK(to__value__type IN ('string')),
  "to__value" text,
  "from_label__type" text CHECK(from_label__type IN ('object')),
  "from_label__en__type" text CHECK(from_label__en__type IN ('string')),
  "from_label__en" text,
  "from_label__ko__type" text CHECK(from_label__ko__type IN ('string')),
  "from_label__ko" text,
  "to_label__type" text CHECK(to_label__type IN ('object')),
  "to_label__en__type" text CHECK(to_label__en__type IN ('string')),
  "to_label__en" text,
  "to_label__ko__type" text CHECK(to_label__ko__type IN ('string')),
  "to_label__ko" text,
  "endpoint_display__type" text CHECK(endpoint_display__type IN ('object','null')),
  "endpoint_display__from__type" text CHECK(endpoint_display__from__type IN ('object','null')),
  "endpoint_display__from__en__type" text CHECK(endpoint_display__from__en__type IN ('string','null')),
  "endpoint_display__from__en" text,
  "endpoint_display__from__ko__type" text CHECK(endpoint_display__from__ko__type IN ('string','null')),
  "endpoint_display__from__ko" text,
  "endpoint_display__to__type" text CHECK(endpoint_display__to__type IN ('object','null')),
  "endpoint_display__to__en__type" text CHECK(endpoint_display__to__en__type IN ('string','null')),
  "endpoint_display__to__en" text,
  "endpoint_display__to__ko__type" text CHECK(endpoint_display__to__ko__type IN ('string','null')),
  "endpoint_display__to__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_states" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "capital_station__type" text CHECK(capital_station__type IN ('object')),
  "capital_station__en__type" text CHECK(capital_station__en__type IN ('string')),
  "capital_station__en" text,
  "capital_station__ko__type" text CHECK(capital_station__ko__type IN ('string')),
  "capital_station__ko" text,
  "corridors__type" text CHECK(corridors__type IN ('array')),
  "display_name__type" text CHECK(display_name__type IN ('object')),
  "display_name__en__type" text CHECK(display_name__en__type IN ('string')),
  "display_name__en" text,
  "display_name__ko__type" text CHECK(display_name__ko__type IN ('string')),
  "display_name__ko" text,
  "government__type" text CHECK(government__type IN ('object')),
  "government__en__type" text CHECK(government__en__type IN ('string')),
  "government__en" text,
  "government__ko__type" text CHECK(government__ko__type IN ('string')),
  "government__ko" text,
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "offices__type" text CHECK(offices__type IN ('array')),
  "power__type" text CHECK(power__type IN ('object')),
  "power__en__type" text CHECK(power__en__type IN ('string')),
  "power__en" text,
  "power__ko__type" text CHECK(power__ko__type IN ('string')),
  "power__ko" text,
  "power_basis__type" text CHECK(power_basis__type IN ('array')),
  "region__type" text CHECK(region__type IN ('object')),
  "region__en__type" text CHECK(region__en__type IN ('string')),
  "region__en" text,
  "region__ko__type" text CHECK(region__ko__type IN ('string')),
  "region__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_states_corridors" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "group_id__type" text CHECK(group_id__type IN ('string')),
  "group_id" text,
  "ho__type" text CHECK(ho__type IN ('number')),
  "ho" double precision,
  "name__type" text CHECK(name__type IN ('object')),
  "name__en__type" text CHECK(name__en__type IN ('string')),
  "name__en" text,
  "name__ko__type" text CHECK(name__ko__type IN ('string')),
  "name__ko" text,
  "station__type" text CHECK(station__type IN ('object')),
  "station__en__type" text CHECK(station__en__type IN ('string')),
  "station__en" text,
  "station__ko__type" text CHECK(station__ko__type IN ('string')),
  "station__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_states_offices" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_states_power_basis" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_synthetics" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "body_platform__type" text CHECK(body_platform__type IN ('object')),
  "body_platform__en__type" text CHECK(body_platform__en__type IN ('string')),
  "body_platform__en" text,
  "body_platform__ko__type" text CHECK(body_platform__ko__type IN ('string')),
  "body_platform__ko" text,
  "callsign__type" text CHECK(callsign__type IN ('object')),
  "callsign__en__type" text CHECK(callsign__en__type IN ('string')),
  "callsign__en" text,
  "callsign__ko__type" text CHECK(callsign__ko__type IN ('string')),
  "callsign__ko" text,
  "cls__type" text CHECK(cls__type IN ('string')),
  "cls" text,
  "custody_legal__type" text CHECK(custody_legal__type IN ('object')),
  "custody_legal__en__type" text CHECK(custody_legal__en__type IN ('string')),
  "custody_legal__en" text,
  "custody_legal__ko__type" text CHECK(custody_legal__ko__type IN ('string')),
  "custody_legal__ko" text,
  "display_name__type" text CHECK(display_name__type IN ('object')),
  "display_name__en__type" text CHECK(display_name__en__type IN ('string')),
  "display_name__en" text,
  "display_name__ko__type" text CHECK(display_name__ko__type IN ('string')),
  "display_name__ko" text,
  "divergence_recovery__type" text CHECK(divergence_recovery__type IN ('object')),
  "divergence_recovery__en__type" text CHECK(divergence_recovery__en__type IN ('string')),
  "divergence_recovery__en" text,
  "divergence_recovery__ko__type" text CHECK(divergence_recovery__ko__type IN ('string')),
  "divergence_recovery__ko" text,
  "emergent_goal__type" text CHECK(emergent_goal__type IN ('object')),
  "emergent_goal__en__type" text CHECK(emergent_goal__en__type IN ('string')),
  "emergent_goal__en" text,
  "emergent_goal__ko__type" text CHECK(emergent_goal__ko__type IN ('string')),
  "emergent_goal__ko" text,
  "energy_parts__type" text CHECK(energy_parts__type IN ('object')),
  "energy_parts__en__type" text CHECK(energy_parts__en__type IN ('string')),
  "energy_parts__en" text,
  "energy_parts__ko__type" text CHECK(energy_parts__ko__type IN ('string')),
  "energy_parts__ko" text,
  "house_id__type" text CHECK(house_id__type IN ('string')),
  "house_id" text,
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "maintenance__type" text CHECK(maintenance__type IN ('object')),
  "maintenance__en__type" text CHECK(maintenance__en__type IN ('string')),
  "maintenance__en" text,
  "maintenance__ko__type" text CHECK(maintenance__ko__type IN ('string')),
  "maintenance__ko" text,
  "memory_continuity__type" text CHECK(memory_continuity__type IN ('object')),
  "memory_continuity__en__type" text CHECK(memory_continuity__en__type IN ('string')),
  "memory_continuity__en" text,
  "memory_continuity__ko__type" text CHECK(memory_continuity__ko__type IN ('string')),
  "memory_continuity__ko" text,
  "network_safety__type" text CHECK(network_safety__type IN ('object')),
  "network_safety__en__type" text CHECK(network_safety__en__type IN ('string')),
  "network_safety__en" text,
  "network_safety__ko__type" text CHECK(network_safety__ko__type IN ('string')),
  "network_safety__ko" text,
  "owner__type" text CHECK(owner__type IN ('string')),
  "owner" text,
  "projection_targets__type" text CHECK(projection_targets__type IN ('array')),
  "prose__type" text CHECK(prose__type IN ('array')),
  "relations__type" text CHECK(relations__type IN ('array')),
  "revision__type" text CHECK(revision__type IN ('number')),
  "revision" double precision,
  "source_anchors__type" text CHECK(source_anchors__type IN ('array')),
  "source_kind__type" text CHECK(source_kind__type IN ('string')),
  "source_kind" text,
  "state_id__type" text CHECK(state_id__type IN ('string')),
  "state_id" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_synthetics_projection_targets" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_synthetics_prose" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "anchor__type" text CHECK(anchor__type IN ('string')),
  "anchor" text,
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "text__type" text CHECK(text__type IN ('object')),
  "text__en__type" text CHECK(text__en__type IN ('string')),
  "text__en" text,
  "text__ko__type" text CHECK(text__ko__type IN ('string')),
  "text__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_synthetics_relations" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "reason__type" text CHECK(reason__type IN ('object')),
  "reason__en__type" text CHECK(reason__en__type IN ('string')),
  "reason__en" text,
  "reason__ko__type" text CHECK(reason__ko__type IN ('string')),
  "reason__ko" text,
  "target__type" text CHECK(target__type IN ('string')),
  "target" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_synthetics_source_anchors" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "checkpoints__type" text CHECK(checkpoints__type IN ('array')),
  "display_name__type" text CHECK(display_name__type IN ('object')),
  "display_name__en__type" text CHECK(display_name__en__type IN ('string')),
  "display_name__en" text,
  "display_name__ko__type" text CHECK(display_name__ko__type IN ('string')),
  "display_name__ko" text,
  "explicit_unknowns__type" text CHECK(explicit_unknowns__type IN ('array')),
  "hostile_ecology_interaction__type" text CHECK(hostile_ecology_interaction__type IN ('array')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "inference__type" text CHECK(inference__type IN ('object')),
  "inference__en__type" text CHECK(inference__en__type IN ('string')),
  "inference__en" text,
  "inference__ko__type" text CHECK(inference__ko__type IN ('string')),
  "inference__ko" text,
  "japan_bridge_removable__type" text CHECK(japan_bridge_removable__type IN ('boolean')),
  "japan_bridge_removable" bigint,
  "language_rumor_protocol__type" text CHECK(language_rumor_protocol__type IN ('object')),
  "language_rumor_protocol__interpreter_rule__type" text CHECK(language_rumor_protocol__interpreter_rule__type IN ('object')),
  "language_rumor_protocol__interpreter_rule__en__type" text CHECK(language_rumor_protocol__interpreter_rule__en__type IN ('string')),
  "language_rumor_protocol__interpreter_rule__en" text,
  "language_rumor_protocol__interpreter_rule__ko__type" text CHECK(language_rumor_protocol__interpreter_rule__ko__type IN ('string')),
  "language_rumor_protocol__interpreter_rule__ko" text,
  "language_rumor_protocol__prohibited_inference__type" text CHECK(language_rumor_protocol__prohibited_inference__type IN ('object')),
  "language_rumor_protocol__prohibited_inference__en__type" text CHECK(language_rumor_protocol__prohibited_inference__en__type IN ('string')),
  "language_rumor_protocol__prohibited_inference__en" text,
  "language_rumor_protocol__prohibited_inference__ko__type" text CHECK(language_rumor_protocol__prohibited_inference__ko__type IN ('string')),
  "language_rumor_protocol__prohibited_inference__ko" text,
  "language_rumor_protocol__record_language__type" text CHECK(language_rumor_protocol__record_language__type IN ('object')),
  "language_rumor_protocol__record_language__en__type" text CHECK(language_rumor_protocol__record_language__en__type IN ('string')),
  "language_rumor_protocol__record_language__en" text,
  "language_rumor_protocol__record_language__ko__type" text CHECK(language_rumor_protocol__record_language__ko__type IN ('string')),
  "language_rumor_protocol__record_language__ko" text,
  "language_rumor_protocol__rumor_reliability__type" text CHECK(language_rumor_protocol__rumor_reliability__type IN ('array')),
  "opening_event__type" text CHECK(opening_event__type IN ('object')),
  "opening_event__conflict__type" text CHECK(opening_event__conflict__type IN ('object')),
  "opening_event__conflict__en__type" text CHECK(opening_event__conflict__en__type IN ('string')),
  "opening_event__conflict__en" text,
  "opening_event__conflict__ko__type" text CHECK(opening_event__conflict__ko__type IN ('string')),
  "opening_event__conflict__ko" text,
  "opening_event__player_decision__type" text CHECK(opening_event__player_decision__type IN ('object')),
  "opening_event__player_decision__en__type" text CHECK(opening_event__player_decision__en__type IN ('string')),
  "opening_event__player_decision__en" text,
  "opening_event__player_decision__ko__type" text CHECK(opening_event__player_decision__ko__type IN ('string')),
  "opening_event__player_decision__ko" text,
  "opening_event__scenario_id__type" text CHECK(opening_event__scenario_id__type IN ('string')),
  "opening_event__scenario_id" text,
  "opening_event__timeline_placement__type" text CHECK(opening_event__timeline_placement__type IN ('object')),
  "opening_event__timeline_placement__en__type" text CHECK(opening_event__timeline_placement__en__type IN ('string')),
  "opening_event__timeline_placement__en" text,
  "opening_event__timeline_placement__ko__type" text CHECK(opening_event__timeline_placement__ko__type IN ('string')),
  "opening_event__timeline_placement__ko" text,
  "opening_event__trigger__type" text CHECK(opening_event__trigger__type IN ('object')),
  "opening_event__trigger__en__type" text CHECK(opening_event__trigger__en__type IN ('string')),
  "opening_event__trigger__en" text,
  "opening_event__trigger__ko__type" text CHECK(opening_event__trigger__ko__type IN ('string')),
  "opening_event__trigger__ko" text,
  "original_fiction__type" text CHECK(original_fiction__type IN ('object')),
  "original_fiction__en__type" text CHECK(original_fiction__en__type IN ('string')),
  "original_fiction__en" text,
  "original_fiction__ko__type" text CHECK(original_fiction__ko__type IN ('string')),
  "original_fiction__ko" text,
  "reader_description__type" text CHECK(reader_description__type IN ('object')),
  "reader_description__en__type" text CHECK(reader_description__en__type IN ('string')),
  "reader_description__en" text,
  "reader_description__ko__type" text CHECK(reader_description__ko__type IN ('string')),
  "reader_description__ko" text,
  "owner__type" text CHECK(owner__type IN ('string')),
  "owner" text,
  "player_entry_points__type" text CHECK(player_entry_points__type IN ('array')),
  "projection_targets__type" text CHECK(projection_targets__type IN ('array')),
  "prose__type" text CHECK(prose__type IN ('array')),
  "revision__type" text CHECK(revision__type IN ('number')),
  "revision" double precision,
  "routes__type" text CHECK(routes__type IN ('object')),
  "routes__ai_custody__type" text CHECK(routes__ai_custody__type IN ('object')),
  "routes__ai_custody__en__type" text CHECK(routes__ai_custody__en__type IN ('string')),
  "routes__ai_custody__en" text,
  "routes__ai_custody__ko__type" text CHECK(routes__ai_custody__ko__type IN ('string')),
  "routes__ai_custody__ko" text,
  "routes__data__type" text CHECK(routes__data__type IN ('object')),
  "routes__data__en__type" text CHECK(routes__data__en__type IN ('string')),
  "routes__data__en" text,
  "routes__data__ko__type" text CHECK(routes__data__ko__type IN ('string')),
  "routes__data__ko" text,
  "routes__diaspora__type" text CHECK(routes__diaspora__type IN ('object')),
  "routes__diaspora__en__type" text CHECK(routes__diaspora__en__type IN ('string')),
  "routes__diaspora__en" text,
  "routes__diaspora__ko__type" text CHECK(routes__diaspora__ko__type IN ('string')),
  "routes__diaspora__ko" text,
  "routes__energy__type" text CHECK(routes__energy__type IN ('object')),
  "routes__energy__en__type" text CHECK(routes__energy__en__type IN ('string')),
  "routes__energy__en" text,
  "routes__energy__ko__type" text CHECK(routes__energy__ko__type IN ('string')),
  "routes__energy__ko" text,
  "routes__monster_migration__type" text CHECK(routes__monster_migration__type IN ('object')),
  "routes__monster_migration__en__type" text CHECK(routes__monster_migration__en__type IN ('string')),
  "routes__monster_migration__en" text,
  "routes__monster_migration__ko__type" text CHECK(routes__monster_migration__ko__type IN ('string')),
  "routes__monster_migration__ko" text,
  "routes__refugee__type" text CHECK(routes__refugee__type IN ('object')),
  "routes__refugee__en__type" text CHECK(routes__refugee__en__type IN ('string')),
  "routes__refugee__en" text,
  "routes__refugee__ko__type" text CHECK(routes__refugee__ko__type IN ('string')),
  "routes__refugee__ko" text,
  "routes__security__type" text CHECK(routes__security__type IN ('object')),
  "routes__security__en__type" text CHECK(routes__security__en__type IN ('string')),
  "routes__security__en" text,
  "routes__security__ko__type" text CHECK(routes__security__ko__type IN ('string')),
  "routes__security__ko" text,
  "routes__trade__type" text CHECK(routes__trade__type IN ('object')),
  "routes__trade__en__type" text CHECK(routes__trade__en__type IN ('string')),
  "routes__trade__en" text,
  "routes__trade__ko__type" text CHECK(routes__trade__ko__type IN ('string')),
  "routes__trade__ko" text,
  "scenario_chains__type" text CHECK(scenario_chains__type IN ('array')),
  "seoul_route__type" text CHECK(seoul_route__type IN ('object')),
  "seoul_route__evidence_kind__type" text CHECK(seoul_route__evidence_kind__type IN ('string')),
  "seoul_route__evidence_kind" text,
  "seoul_route__fixed_duration__type" text CHECK(seoul_route__fixed_duration__type IN ('object')),
  "seoul_route__fixed_duration__en__type" text CHECK(seoul_route__fixed_duration__en__type IN ('string')),
  "seoul_route__fixed_duration__en" text,
  "seoul_route__fixed_duration__ko__type" text CHECK(seoul_route__fixed_duration__ko__type IN ('string')),
  "seoul_route__fixed_duration__ko" text,
  "seoul_route__outbound_boundary__type" text CHECK(seoul_route__outbound_boundary__type IN ('object')),
  "seoul_route__outbound_boundary__en__type" text CHECK(seoul_route__outbound_boundary__en__type IN ('string')),
  "seoul_route__outbound_boundary__en" text,
  "seoul_route__outbound_boundary__ko__type" text CHECK(seoul_route__outbound_boundary__ko__type IN ('string')),
  "seoul_route__outbound_boundary__ko" text,
  "seoul_route__route_design__type" text CHECK(seoul_route__route_design__type IN ('object')),
  "seoul_route__route_design__en__type" text CHECK(seoul_route__route_design__en__type IN ('string')),
  "seoul_route__route_design__en" text,
  "seoul_route__route_design__ko__type" text CHECK(seoul_route__route_design__ko__type IN ('string')),
  "seoul_route__route_design__ko" text,
  "seoul_route__staging_nodes__type" text CHECK(seoul_route__staging_nodes__type IN ('array')),
  "seoul_route__verified_geography__type" text CHECK(seoul_route__verified_geography__type IN ('object')),
  "seoul_route__verified_geography__en__type" text CHECK(seoul_route__verified_geography__en__type IN ('string')),
  "seoul_route__verified_geography__en" text,
  "seoul_route__verified_geography__ko__type" text CHECK(seoul_route__verified_geography__ko__type IN ('string')),
  "seoul_route__verified_geography__ko" text,
  "source_anchors__type" text CHECK(source_anchors__type IN ('array')),
  "source_kind__type" text CHECK(source_kind__type IN ('string')),
  "source_kind" text,
  "state_interests__type" text CHECK(state_interests__type IN ('array')),
  "states__type" text CHECK(states__type IN ('array')),
  "supply_chain__type" text CHECK(supply_chain__type IN ('object')),
  "supply_chain__flows__type" text CHECK(supply_chain__flows__type IN ('array')),
  "supply_chain__separation_rule__type" text CHECK(supply_chain__separation_rule__type IN ('object')),
  "supply_chain__separation_rule__en__type" text CHECK(supply_chain__separation_rule__en__type IN ('string')),
  "supply_chain__separation_rule__en" text,
  "supply_chain__separation_rule__ko__type" text CHECK(supply_chain__separation_rule__ko__type IN ('string')),
  "supply_chain__separation_rule__ko" text,
  "travel_constraints__type" text CHECK(travel_constraints__type IN ('object')),
  "travel_constraints__rule__type" text CHECK(travel_constraints__rule__type IN ('object')),
  "travel_constraints__rule__en__type" text CHECK(travel_constraints__rule__en__type IN ('string')),
  "travel_constraints__rule__en" text,
  "travel_constraints__rule__ko__type" text CHECK(travel_constraints__rule__ko__type IN ('string')),
  "travel_constraints__rule__ko" text,
  "travel_constraints__seasonal_conditions__type" text CHECK(travel_constraints__seasonal_conditions__type IN ('array')),
  "travel_constraints__suspension_conditions__type" text CHECK(travel_constraints__suspension_conditions__type IN ('array')),
  "verified__type" text CHECK(verified__type IN ('object')),
  "verified__en__type" text CHECK(verified__en__type IN ('string')),
  "verified__en" text,
  "verified__ko__type" text CHECK(verified__ko__type IN ('string')),
  "verified__ko" text,
  "record_status__type" text CHECK(record_status__type IN ('string','null')),
  "record_status" text,
  "current_operational_claim__type" text CHECK(current_operational_claim__type IN ('boolean','null')),
  "current_operational_claim" bigint,
  "historical_display_name__type" text CHECK(historical_display_name__type IN ('object','null')),
  "historical_display_name__en__type" text CHECK(historical_display_name__en__type IN ('string','null')),
  "historical_display_name__en" text,
  "historical_display_name__ko__type" text CHECK(historical_display_name__ko__type IN ('string','null')),
  "historical_display_name__ko" text,
  "projection_display_name__type" text CHECK(projection_display_name__type IN ('object','null')),
  "projection_display_name__en__type" text CHECK(projection_display_name__en__type IN ('string','null')),
  "projection_display_name__en" text,
  "projection_display_name__ko__type" text CHECK(projection_display_name__ko__type IN ('string','null')),
  "projection_display_name__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters_checkpoints" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "authority_state_ids__type" text CHECK(authority_state_ids__type IN ('array')),
  "checks__type" text CHECK(checks__type IN ('array')),
  "function__type" text CHECK(function__type IN ('object')),
  "function__en__type" text CHECK(function__en__type IN ('string')),
  "function__en" text,
  "function__ko__type" text CHECK(function__ko__type IN ('string')),
  "function__ko" text,
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "place__type" text CHECK(place__type IN ('object')),
  "place__en__type" text CHECK(place__en__type IN ('string')),
  "place__en" text,
  "place__ko__type" text CHECK(place__ko__type IN ('string')),
  "place__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters_checkpoints_authority_state_ids" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters_checkpoints_checks" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters_explicit_unknowns" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters_hostile_ecology_interaction" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "group_id__type" text CHECK(group_id__type IN ('string')),
  "group_id" text,
  "interaction__type" text CHECK(interaction__type IN ('object')),
  "interaction__en__type" text CHECK(interaction__en__type IN ('string')),
  "interaction__en" text,
  "interaction__ko__type" text CHECK(interaction__ko__type IN ('string')),
  "interaction__ko" text,
  "nonlethal_constraint__type" text CHECK(nonlethal_constraint__type IN ('object')),
  "nonlethal_constraint__en__type" text CHECK(nonlethal_constraint__en__type IN ('string')),
  "nonlethal_constraint__en" text,
  "nonlethal_constraint__ko__type" text CHECK(nonlethal_constraint__ko__type IN ('string')),
  "nonlethal_constraint__ko" text,
  "operational_response__type" text CHECK(operational_response__type IN ('object')),
  "operational_response__en__type" text CHECK(operational_response__en__type IN ('string')),
  "operational_response__en" text,
  "operational_response__ko__type" text CHECK(operational_response__ko__type IN ('string')),
  "operational_response__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters_language_rumor_protocol_rumor_reliability" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "rule__type" text CHECK(rule__type IN ('object')),
  "rule__en__type" text CHECK(rule__en__type IN ('string')),
  "rule__en" text,
  "rule__ko__type" text CHECK(rule__ko__type IN ('string')),
  "rule__ko" text,
  "tier__type" text CHECK(tier__type IN ('string')),
  "tier" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters_player_entry_points" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "first_decision__type" text CHECK(first_decision__type IN ('object')),
  "first_decision__en__type" text CHECK(first_decision__en__type IN ('string')),
  "first_decision__en" text,
  "first_decision__ko__type" text CHECK(first_decision__ko__type IN ('string')),
  "first_decision__ko" text,
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "place__type" text CHECK(place__type IN ('object')),
  "place__en__type" text CHECK(place__en__type IN ('string')),
  "place__en" text,
  "place__ko__type" text CHECK(place__ko__type IN ('string')),
  "place__ko" text,
  "role__type" text CHECK(role__type IN ('object')),
  "role__en__type" text CHECK(role__en__type IN ('string')),
  "role__en" text,
  "role__ko__type" text CHECK(role__ko__type IN ('string')),
  "role__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters_projection_targets" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters_prose" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "anchor__type" text CHECK(anchor__type IN ('string')),
  "anchor" text,
  "kind__type" text CHECK(kind__type IN ('string')),
  "kind" text,
  "text__type" text CHECK(text__type IN ('object')),
  "text__en__type" text CHECK(text__en__type IN ('string','array')),
  "text__en" text,
  "text__ko__type" text CHECK(text__ko__type IN ('string','array')),
  "text__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters_prose_text_en" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "text__type" text CHECK(text__type IN ('string')),
  "text" text,
  "link__type" text CHECK(link__type IN ('object')),
  "link__anchor__type" text CHECK(link__anchor__type IN ('string')),
  "link__anchor" text,
  "link__domain__type" text CHECK(link__domain__type IN ('string')),
  "link__domain" text,
  "link__slug__type" text CHECK(link__slug__type IN ('string')),
  "link__slug" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters_prose_text_ko" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "text__type" text CHECK(text__type IN ('string')),
  "text" text,
  "link__type" text CHECK(link__type IN ('object')),
  "link__anchor__type" text CHECK(link__anchor__type IN ('string')),
  "link__anchor" text,
  "link__domain__type" text CHECK(link__domain__type IN ('string')),
  "link__domain" text,
  "link__slug__type" text CHECK(link__slug__type IN ('string')),
  "link__slug" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters_scenario_chains" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "summary__type" text CHECK(summary__type IN ('object')),
  "summary__en__type" text CHECK(summary__en__type IN ('string')),
  "summary__en" text,
  "summary__ko__type" text CHECK(summary__ko__type IN ('string')),
  "summary__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters_seoul_route_staging_nodes" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters_source_anchors" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters_state_interests" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "interest__type" text CHECK(interest__type IN ('object')),
  "interest__en__type" text CHECK(interest__en__type IN ('string')),
  "interest__en" text,
  "interest__ko__type" text CHECK(interest__ko__type IN ('string')),
  "interest__ko" text,
  "leverage__type" text CHECK(leverage__type IN ('object')),
  "leverage__en__type" text CHECK(leverage__en__type IN ('string')),
  "leverage__en" text,
  "leverage__ko__type" text CHECK(leverage__ko__type IN ('string')),
  "leverage__ko" text,
  "red_line__type" text CHECK(red_line__type IN ('object')),
  "red_line__en__type" text CHECK(red_line__en__type IN ('string')),
  "red_line__en" text,
  "red_line__ko__type" text CHECK(red_line__ko__type IN ('string')),
  "red_line__ko" text,
  "state_id__type" text CHECK(state_id__type IN ('string')),
  "state_id" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters_states" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('string')),
  "value" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters_supply_chain_flows" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "contents__type" text CHECK(contents__type IN ('object')),
  "contents__en__type" text CHECK(contents__en__type IN ('string')),
  "contents__en" text,
  "contents__ko__type" text CHECK(contents__ko__type IN ('string')),
  "contents__ko" text,
  "handoff_rule__type" text CHECK(handoff_rule__type IN ('object')),
  "handoff_rule__en__type" text CHECK(handoff_rule__en__type IN ('string')),
  "handoff_rule__en" text,
  "handoff_rule__ko__type" text CHECK(handoff_rule__ko__type IN ('string')),
  "handoff_rule__ko" text,
  "kind__type" text CHECK(kind__type IN ('object')),
  "kind__en__type" text CHECK(kind__en__type IN ('string')),
  "kind__en" text,
  "kind__ko__type" text CHECK(kind__ko__type IN ('string')),
  "kind__ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters_travel_constraints_seasonal_conditions" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_atlas_theaters_travel_constraints_suspension_conditions" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "en__type" text CHECK(en__type IN ('string')),
  "en" text,
  "ko__type" text CHECK(ko__type IN ('string')),
  "ko" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_character_example" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data'),
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."text_character_example_desire" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "axis" text NOT NULL CHECK(axis IN ('longing','exclusivity','risk','display','continuity','orientation','union')),
  "axis_name" text NOT NULL,
  "value_kind" text NOT NULL CHECK(value_kind IN ('integer','text')),
  "status" text NOT NULL CHECK(status IN ('known','unknown','undecided','not-applicable')),
  "integer_value" bigint CHECK(integer_value BETWEEN -100 AND 100),
  "text_value" text CHECK(length(text_value)>0),
  "origin" text CHECK(origin IN ('source-fact','original-fiction','computed')),
  "reason" text CHECK(length(reason)>0),
  PRIMARY KEY ("source_id", "axis"),
  CHECK(json_pointer='/data/desires/' || axis),
  CHECK(axis_name=CASE axis WHEN 'longing' THEN '갈망' WHEN 'exclusivity' THEN '독점' WHEN 'risk' THEN '위험' WHEN 'display' THEN '과시' WHEN 'continuity' THEN '지속' WHEN 'orientation' THEN '지향' WHEN 'union' THEN '결합' END),
  CHECK((axis IN ('orientation','union') AND value_kind='text' AND integer_value IS NULL)
    OR (axis NOT IN ('orientation','union') AND value_kind='integer' AND text_value IS NULL)),
  CHECK((status='known' AND origin IS NOT NULL AND reason IS NULL
      AND ((value_kind='integer' AND integer_value IS NOT NULL) OR (value_kind='text' AND text_value IS NOT NULL)))
    OR (status<>'known' AND integer_value IS NULL AND text_value IS NULL AND origin IS NULL AND reason IS NOT NULL))
);
CREATE TABLE wiki."text_character_example_fact" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "field" text NOT NULL CHECK(field IN ('name','polity_title','sex','origin','language','conscription','arms_access','occupation','affiliation','biography')),
  "status" text NOT NULL CHECK(status IN ('known','unknown','undecided','not-applicable')),
  "text_value" text CHECK(length(text_value)>0),
  "origin" text CHECK(origin IN ('source-fact','original-fiction','computed')),
  "reason" text CHECK(length(reason)>0),
  PRIMARY KEY ("source_id", "field"),
  CHECK(json_pointer=CASE field WHEN 'name' THEN '/data/identity/name' WHEN 'polity_title' THEN '/data/rank/polity_title' ELSE '/data/' || field END),
  CHECK((status='known' AND text_value IS NOT NULL AND origin IS NOT NULL AND reason IS NULL)
    OR (status<>'known' AND text_value IS NULL AND origin IS NULL AND reason IS NOT NULL)),
  CHECK(field<>'sex' OR (status='known' AND text_value IN ('female','male')))
);
CREATE TABLE wiki."text_character_example_identity" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/identity'),
  "generation" text NOT NULL CHECK(generation IN ('opening','predecessor')),
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."text_character_example_politics" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "field" text NOT NULL CHECK(field IN ('personality','ambition','fear','governance','trigger','intervention')),
  "status" text NOT NULL CHECK(status IN ('known','unknown','undecided','not-applicable')),
  "text_value" text CHECK(length(text_value)>0),
  "origin" text CHECK(origin IN ('source-fact','original-fiction','computed')),
  "reason" text CHECK(length(reason)>0),
  PRIMARY KEY ("source_id", "field"),
  CHECK(json_pointer='/data/politics/' || field),
  CHECK((status='known' AND text_value IS NOT NULL AND origin IS NOT NULL AND reason IS NULL)
    OR (status<>'known' AND text_value IS NULL AND origin IS NULL AND reason IS NOT NULL))
);
CREATE TABLE wiki."text_character_example_rank" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/rank'),
  "common_tier" text NOT NULL CHECK(common_tier IN ('T1','T2','T3','T4','T5')),
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."text_character_example_relation" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "relation_type" text NOT NULL CHECK(relation_type IN ('kinship','adoption','mentorship','command','contract','debt','oath','rivalry','grievance','protected-residence','betrayal')),
  "target_id" text NOT NULL CHECK(length(target_id)>0),
  PRIMARY KEY ("source_id", "ordinal"),
  CHECK(json_pointer='/data/relations/value/' || ordinal)
);
CREATE TABLE wiki."text_character_example_relations" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/relations'),
  "status" text NOT NULL CHECK(status IN ('known','unknown','undecided','not-applicable')),
  "origin" text CHECK(origin IN ('source-fact','original-fiction','computed')),
  "reason" text CHECK(length(reason)>0),
  PRIMARY KEY ("source_id"),
  UNIQUE(source_id,status),
  CHECK((status='known' AND origin IS NOT NULL AND reason IS NULL)
    OR (status<>'known' AND origin IS NULL AND reason IS NOT NULL))
);
CREATE TABLE wiki."text_character_example_value" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "axis" text NOT NULL CHECK(axis IN ('authority','openness','force','material','community','principle','transparency','qualification','decentralization','change')),
  "axis_name" text NOT NULL,
  "status" text NOT NULL CHECK(status IN ('known','unknown','undecided','not-applicable')),
  "integer_value" bigint CHECK(integer_value BETWEEN -100 AND 100),
  "origin" text CHECK(origin IN ('source-fact','original-fiction','computed')),
  "reason" text CHECK(length(reason)>0),
  PRIMARY KEY ("source_id", "axis"),
  CHECK(json_pointer='/data/values/' || axis),
  CHECK(axis_name=CASE axis WHEN 'authority' THEN '권위' WHEN 'openness' THEN '개방' WHEN 'force' THEN '무력' WHEN 'material' THEN '물질' WHEN 'community' THEN '공동' WHEN 'principle' THEN '원칙' WHEN 'transparency' THEN '공개' WHEN 'qualification' THEN '자격' WHEN 'decentralization' THEN '분산' WHEN 'change' THEN '변혁' END),
  CHECK((status='known' AND integer_value IS NOT NULL AND origin IS NOT NULL AND reason IS NULL)
    OR (status<>'known' AND integer_value IS NULL AND origin IS NULL AND reason IS NOT NULL))
);
CREATE TABLE wiki."text_chronology_event" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "event_id" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "anchor" text NOT NULL,
  "authored_order" bigint NOT NULL,
  "date_status" text NOT NULL,
  "date_value" text,
  "date_reason" text,
  PRIMARY KEY ("source_id", "event_id"),
  UNIQUE(source_id,ordinal)
);
CREATE TABLE wiki."text_culture_example" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/transmission'),
  "transmission" text NOT NULL,
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."text_document" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK(json_pointer=''),
  "corpus_kind" text NOT NULL CHECK(corpus_kind IN ('current','historical','example')),
  "version" bigint NOT NULL CHECK(version=1),
  "domain" text NOT NULL,
  "document_id" text NOT NULL,
  "slug" text NOT NULL,
  "status" text NOT NULL CHECK(status IN ('draft','approved','excluded')),
  "tense_ko" text NOT NULL CHECK(tense_ko IN ('past','present')),
  "tense_en" text NOT NULL CHECK(tense_en IN ('past','present')),
  "source_kind" text NOT NULL CHECK(source_kind IN ('original-fiction','observed','computed','inference','source-fact')),
  "source_hash" text,
  "original_anchor" text NOT NULL,
  "original_hash" text,
  "data_pointer" text NOT NULL CHECK(data_pointer='/data'),
  PRIMARY KEY ("source_id"),
  UNIQUE(corpus_kind,domain,slug),
  UNIQUE(source_id,corpus_kind)
);
CREATE TABLE wiki."text_document_anchor" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "locale" text NOT NULL CHECK(locale IN ('ko','en')),
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "node_pointer" text NOT NULL,
  "anchor" text NOT NULL,
  "anchor_kind" text NOT NULL CHECK(anchor_kind IN ('authored','public','natural','inline')),
  "published" bigint NOT NULL CHECK(published IN (0,1)),
  PRIMARY KEY ("source_id", "locale", "ordinal")
);
CREATE TABLE wiki."text_document_category" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "category" text NOT NULL,
  PRIMARY KEY ("source_id", "ordinal"),
  UNIQUE(source_id,category)
);
CREATE TABLE wiki."text_document_history" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "entry" text NOT NULL,
  PRIMARY KEY ("source_id", "ordinal")
);
CREATE TABLE wiki."text_document_link" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "corpus_kind" text NOT NULL CHECK(corpus_kind IN ('current','historical','example')),
  "locale" text NOT NULL CHECK(locale IN ('ko','en')),
  "resolution" text NOT NULL CHECK(resolution IN ('external','gdd','missing-target','document','anchor','ambiguous-anchor','missing-anchor')),
  "target_source_id" bigint,
  "target_anchor_ordinal" bigint,
  PRIMARY KEY ("source_id", "json_pointer"),
  CHECK((resolution IN ('external','gdd','missing-target') AND target_source_id IS NULL AND target_anchor_ordinal IS NULL) OR (resolution IN ('document','missing-anchor','ambiguous-anchor') AND target_source_id IS NOT NULL AND target_anchor_ordinal IS NULL) OR (resolution='anchor' AND target_source_id IS NOT NULL AND target_anchor_ordinal IS NOT NULL))
);
CREATE TABLE wiki."text_document_list_item" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "node_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id,node_pointer,ordinal)
);
CREATE TABLE wiki."text_document_locale" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "locale" text NOT NULL CHECK(locale IN ('ko','en')),
  "title" text NOT NULL,
  "summary" text NOT NULL,
  "tense" text NOT NULL CHECK(tense IN ('past','present')),
  PRIMARY KEY ("source_id", "locale")
);
CREATE TABLE wiki."text_document_node" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "kind" text NOT NULL CHECK(kind IN ('heading','paragraph','quote','rule','code','list','table')),
  "anchor" text NOT NULL,
  "depth" bigint,
  "ordered" bigint CHECK(ordered=1),
  "list_start" bigint CHECK(list_start>=0),
  "language" text,
  "info" text,
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id,ordinal),
  UNIQUE(source_id,anchor),
  CHECK((kind='heading' AND depth BETWEEN 1 AND 6 AND depth IS NOT NULL) OR (kind<>'heading' AND depth IS NULL)),
  CHECK(kind='list' OR (ordered IS NULL AND list_start IS NULL)),
  CHECK((kind='code' AND language IS NOT NULL) OR (kind<>'code' AND language IS NULL AND info IS NULL))
);
CREATE TABLE wiki."text_document_run" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "slot_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "text" text NOT NULL,
  "strong" bigint CHECK(strong=1),
  "link_domain" text,
  "link_slug" text,
  "link_anchor" text,
  "href" text,
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id,slot_pointer,ordinal),
  CHECK((link_domain IS NULL AND link_slug IS NULL AND link_anchor IS NULL) OR (link_domain IS NOT NULL AND link_slug IS NOT NULL AND href IS NULL))
);
CREATE TABLE wiki."text_document_slot" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "node_pointer" text NOT NULL,
  "locale" text NOT NULL CHECK(locale IN ('ko','en')),
  "representation" text NOT NULL CHECK(representation IN ('string','runs')),
  "text" text NOT NULL,
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id,json_pointer,locale)
);
CREATE TABLE wiki."text_document_source_ref" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "reference" text NOT NULL,
  PRIMARY KEY ("source_id", "ordinal"),
  UNIQUE(source_id,reference)
);
CREATE TABLE wiki."text_document_table_cell" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "node_pointer" text NOT NULL,
  "row_pointer" text,
  "cell_kind" text NOT NULL CHECK(cell_kind IN ('column','body')),
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY ("source_id", "json_pointer"),
  CHECK((cell_kind='column' AND row_pointer IS NULL) OR (cell_kind='body' AND row_pointer IS NOT NULL))
);
CREATE TABLE wiki."text_document_table_row" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "node_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id,node_pointer,ordinal),
  UNIQUE(source_id,json_pointer,node_pointer)
);
CREATE TABLE wiki."text_ecology" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/ecology'),
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."text_ecology_data" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data'),
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."text_ecology_description" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "locale" text NOT NULL CHECK(locale IN ('en','ko')),
  "representation" text NOT NULL CHECK(representation IN ('string','runs')),
  "text" text NOT NULL CHECK(length(text)>0),
  PRIMARY KEY ("source_id", "locale"),
  CHECK(json_pointer='/data/ecology/description/' || locale)
);
CREATE TABLE wiki."text_ecology_description_run" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "locale" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "text" text NOT NULL CHECK(length(text)>0),
  "strong" bigint CHECK(strong=1),
  "link_domain" text,
  "link_slug" text,
  "link_anchor" text,
  "href" text,
  PRIMARY KEY ("source_id", "locale", "ordinal"),
  CHECK(json_pointer='/data/ecology/description/' || locale || '/' || ordinal),
  CHECK((link_domain IS NULL AND link_slug IS NULL AND link_anchor IS NULL) OR (link_domain IS NOT NULL AND link_slug IS NOT NULL AND href IS NULL))
);
CREATE TABLE wiki."text_ecology_variant" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "variant_id" text NOT NULL,
  "source_batch" text NOT NULL,
  "target_source_id" bigint,
  PRIMARY KEY ("source_id", "ordinal"),
  CHECK(json_pointer='/data/ecology/variants/' || ordinal)
);
CREATE TABLE wiki."text_economy_example" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/exchange'),
  "exchange" text NOT NULL,
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."text_goods_example" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/supply'),
  "supply" text NOT NULL,
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."text_governance" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "text" text NOT NULL,
  PRIMARY KEY ("source_id"),
  CHECK(json_pointer='/data/governance')
);
CREATE TABLE wiki."text_integration" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/integration'),
  "manifest" text NOT NULL CHECK(manifest='TOOL/tools/wiki/confirmed-integration-manifest.json'),
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."text_integration_excluded" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "excluded_id" text NOT NULL,
  "kind" text NOT NULL CHECK(kind IN ('social','monsters','groups')),
  "target_source_id" bigint,
  PRIMARY KEY ("source_id", "ordinal"),
  CHECK(json_pointer='/data/integration/excluded/' || ordinal),
  CHECK(kind='groups' OR target_source_id IS NULL)
);
CREATE TABLE wiki."text_line" (
  "source_id" bigint NOT NULL,
  "line_ordinal" bigint NOT NULL CHECK(line_ordinal >= 0),
  "text" text NOT NULL CHECK(position(chr(10) in text) = 0),
  "line_kind" text NOT NULL CHECK(line_kind IN ('blank','heading','list','table','fence','quote','other')),
  "heading_depth" bigint,
  PRIMARY KEY ("source_id", "line_ordinal"),
  CHECK((line_kind = 'heading' AND heading_depth IS NOT NULL AND heading_depth BETWEEN 1 AND 6)
    OR (line_kind <> 'heading' AND heading_depth IS NULL))
);
CREATE TABLE wiki."text_line_document" (
  "source_id" bigint,
  "media_kind" text NOT NULL CHECK(media_kind IN ('markdown','csv','javascript-data')),
  "line_count" bigint NOT NULL CHECK(line_count >= 0),
  "ends_with_newline" bigint NOT NULL CHECK(ends_with_newline IN (0,1)),
  "line_ending" text NOT NULL CHECK(line_ending IN ('lf','crlf','mixed','none')),
  PRIMARY KEY ("source_id"),
  CHECK(line_count > 0 OR (ends_with_newline = 0 AND line_ending = 'none')),
  CHECK(line_ending <> 'none' OR ends_with_newline = 0),
  CHECK(line_count <> 1 OR ends_with_newline = 1 OR line_ending = 'none')
);
CREATE TABLE wiki."text_name_pool_example_entry" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "entry" text NOT NULL,
  PRIMARY KEY ("source_id", "ordinal")
);
CREATE TABLE wiki."text_offices_example" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/tier'),
  "tier" text NOT NULL,
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."text_overview_example" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/consequence'),
  "consequence" text NOT NULL,
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."text_people_and_machines_example" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/dependency'),
  "dependency" text NOT NULL,
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."text_places_example" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/layer'),
  "layer" text NOT NULL,
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."text_primary_detail" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "person_id" text NOT NULL,
  "name" text NOT NULL,
  PRIMARY KEY ("source_id", "ordinal")
);
CREATE TABLE wiki."text_regions_example" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/opening_state'),
  "opening_state" text NOT NULL,
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."text_registry" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('array')),
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer),
  CHECK(parent_key IS NULL)
);
CREATE TABLE wiki."text_registry_entry" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "id__type" text CHECK(id__type IN ('string')),
  "id" text,
  "anchor__type" text CHECK(anchor__type IN ('string')),
  "anchor" text,
  "relations__type" text CHECK(relations__type IN ('array')),
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_registry_entry_relations" (
  "source_id" bigint NOT NULL,
  "person_ref" text,
  "state_ref" text,
  "json_pointer" text NOT NULL,
  "row_key" text NOT NULL,
  "parent_key" text,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "member_key" text,
  "value__type" text CHECK(value__type IN ('object')),
  "type__type" text CHECK(type__type IN ('string')),
  "type" text,
  "target_id__type" text CHECK(target_id__type IN ('string')),
  "target_id" text,
  PRIMARY KEY ("source_id", "row_key"),
  UNIQUE(source_id,json_pointer)
);
CREATE TABLE wiki."text_simple_collection" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "collection" text NOT NULL CHECK(collection IN ('primary_detail_names','sequence','entries')),
  PRIMARY KEY ("source_id", "collection")
);
CREATE TABLE wiki."text_station" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "station_id" text NOT NULL,
  "source" text NOT NULL,
  "has_service_lines" bigint NOT NULL CHECK(has_service_lines IN (0,1)),
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id,ordinal),
  UNIQUE(source_id,station_id)
);
CREATE TABLE wiki."text_station_alias" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "station_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "alias" text NOT NULL,
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id,station_ordinal,ordinal)
);
CREATE TABLE wiki."text_station_catalog" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  PRIMARY KEY ("source_id"),
  CHECK(json_pointer='/data/station_aliases')
);
CREATE TABLE wiki."text_station_line" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "station_ordinal" bigint NOT NULL,
  "line_kind" text NOT NULL CHECK(line_kind IN ('observed_lines','service_lines')),
  "name_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "line" text NOT NULL,
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id,station_ordinal,line_kind,name_ordinal,ordinal)
);
CREATE TABLE wiki."text_station_line_name" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "station_ordinal" bigint NOT NULL,
  "line_kind" text NOT NULL CHECK(line_kind IN ('observed_lines','service_lines')),
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "name" text NOT NULL,
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id,station_ordinal,line_kind,ordinal),
  UNIQUE(source_id,station_ordinal,line_kind,name)
);
CREATE TABLE wiki."text_structures_example" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/function'),
  "function" text NOT NULL,
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."text_technology_example" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK(json_pointer='/data/constraint'),
  "constraint_text" text NOT NULL,
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki."text_territorial" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "schema" text NOT NULL,
  "scope" text NOT NULL,
  "geographic_empire_id" text NOT NULL,
  "scale_implies_personal_ownership" bigint NOT NULL CHECK(scale_implies_personal_ownership IN (0,1)),
  "scale_implies_title_rank" bigint NOT NULL CHECK(scale_implies_title_rank IN (0,1)),
  "scale_implies_facility_access" bigint NOT NULL CHECK(scale_implies_facility_access IN (0,1)),
  "slot_existence_implies_grant" bigint NOT NULL CHECK(slot_existence_implies_grant IN (0,1)),
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id),
  CHECK(schema='territorial-scale.v2'),
  CHECK(scope='seoul-only'),
  CHECK(json_pointer='/data/territorialScale')
);
CREATE TABLE wiki."text_territorial_level" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "level" text NOT NULL,
  "source_pointer" text,
  "rank" text,
  "count" bigint CHECK(count>=0),
  "partition_sha256" text,
  "representation" text,
  "id_field" text,
  "parent_field" text,
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id,level),
  CHECK(level IN ('empire','kingdom','duchy','county','barony')),
  CHECK((level='barony' AND source_pointer IS NULL AND rank IS NULL AND count IS NULL AND partition_sha256 IS NULL AND representation IS NOT NULL AND id_field IS NOT NULL AND parent_field IS NOT NULL) OR (level!='barony' AND source_pointer IS NOT NULL AND rank=level AND count IS NOT NULL AND representation IS NULL AND id_field IS NULL AND parent_field IS NULL AND ((level='kingdom' AND partition_sha256 IS NOT NULL) OR (level!='kingdom' AND partition_sha256 IS NULL))))
);
CREATE TABLE wiki."text_territorial_map" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "minimum_polygon_rank" text NOT NULL,
  "barony_polygon" bigint NOT NULL CHECK(barony_polygon IN (0,1)),
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id)
);
CREATE TABLE wiki."text_territorial_parent" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "source_field" text NOT NULL,
  "meaning" text NOT NULL,
  "political_liege_inference" bigint NOT NULL CHECK(political_liege_inference IN (0,1)),
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id)
);
CREATE TABLE wiki."text_territorial_parent_exception" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "title_id" text NOT NULL,
  "parent_title_id" text NOT NULL,
  "map_kingdom_title_id" text NOT NULL,
  "kind" text NOT NULL,
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id,ordinal)
);
CREATE TABLE wiki."text_territorial_political_axis" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "current_centers" bigint NOT NULL CHECK(current_centers>=0),
  "geographic_kingdom_equivalence" bigint NOT NULL CHECK(geographic_kingdom_equivalence IN (0,1)),
  "preserve_stable_political_identities" bigint NOT NULL CHECK(preserve_stable_political_identities IN (0,1)),
  "preserve_nonterritorial_kingship" bigint NOT NULL CHECK(preserve_nonterritorial_kingship IN (0,1)),
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id)
);
CREATE TABLE wiki."text_territorial_rank" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "rank" text NOT NULL,
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id,ordinal)
);
CREATE TABLE wiki."text_territorial_selectable_rank" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "rank" text NOT NULL,
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id,ordinal)
);
CREATE TABLE wiki."text_territorial_slot_edition" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "edition_kind" text NOT NULL,
  "source_pointer" text NOT NULL,
  "edition" text NOT NULL,
  "base_date" text,
  "administrative_candidate_date" text,
  "checked_at" text,
  "count" bigint NOT NULL CHECK(count>=0),
  "geometry_verified" bigint NOT NULL CHECK(geometry_verified IN (0,1)),
  "current_boundary_certification" bigint CHECK(current_boundary_certification IN (0,1)),
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id,edition_kind),
  CHECK((edition_kind='dated' AND base_date IS NOT NULL AND administrative_candidate_date IS NULL AND checked_at IS NULL AND current_boundary_certification IS NOT NULL) OR (edition_kind='currentCorrespondence' AND base_date IS NULL AND administrative_candidate_date IS NOT NULL AND checked_at IS NOT NULL AND current_boundary_certification IS NULL))
);
CREATE TABLE wiki."text_territorial_source" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "path" text NOT NULL,
  "sha256" text NOT NULL,
  "schema" text NOT NULL,
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE(source_id)
);
CREATE TABLE wiki."trait" (
  "person_id" text NOT NULL,
  "trait_ordinal" bigint NOT NULL CHECK(trait_ordinal>=0),
  "trait_id_presence" text NOT NULL CHECK(trait_id_presence IN ('missing','null','value')),
  "trait_id" text,
  "name_ko" text NOT NULL,
  "name_en" text NOT NULL,
  "description_ko" text NOT NULL,
  "description_en" text NOT NULL,
  "behavior_ko" text NOT NULL,
  "behavior_en" text NOT NULL,
  "stress_ko" text NOT NULL,
  "stress_en" text NOT NULL,
  "relationship_ko" text NOT NULL,
  "relationship_en" text NOT NULL,
  "json_pointer" text NOT NULL CHECK(json_pointer ~ '^/profiles/[0-9].*/traits/[0-9].*$'),
  PRIMARY KEY ("person_id", "trait_ordinal"),
  CHECK((trait_id_presence='value' AND trait_id IS NOT NULL) OR (trait_id_presence IN ('missing','null') AND trait_id IS NULL))
);
CREATE TABLE wiki."unit_proposal_document" (
  "singleton" bigint CHECK (singleton = 1),
  "schema" text NOT NULL,
  "status" text NOT NULL,
  "note" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."unit_proposal_document_attribute" (
  "unit_ordinal" bigint NOT NULL,
  "owner_kind" text NOT NULL CHECK (owner_kind IN ('member', 'commander')),
  "st_present" bigint NOT NULL CHECK (st_present IN (0, 1)),
  "dx_present" bigint NOT NULL CHECK (dx_present IN (0, 1)),
  "iq_present" bigint NOT NULL CHECK (iq_present IN (0, 1)),
  "ht_present" bigint NOT NULL CHECK (ht_present IN (0, 1)),
  "st" bigint,
  "dx" bigint,
  "iq" bigint,
  "ht" bigint,
  PRIMARY KEY ("unit_ordinal", "owner_kind"),
  CHECK (st_present = 1 OR st IS NULL),
  CHECK (dx_present = 1 OR dx IS NULL),
  CHECK (iq_present = 1 OR iq IS NULL),
  CHECK (ht_present = 1 OR ht IS NULL)
);
CREATE TABLE wiki."unit_proposal_document_design" (
  "singleton" bigint CHECK (singleton = 1),
  "mechanics" text NOT NULL,
  "resolution" text NOT NULL,
  "rules_owner" text NOT NULL,
  "legacy_fields" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."unit_proposal_document_gurps" (
  "unit_ordinal" bigint,
  "attack_present" bigint NOT NULL CHECK (attack_present IN (0, 1)),
  "defense_present" bigint NOT NULL CHECK (defense_present IN (0, 1)),
  "damage_present" bigint NOT NULL CHECK (damage_present IN (0, 1)),
  "dr_target_present" bigint NOT NULL CHECK (dr_target_present IN (0, 1)),
  "special_present" bigint NOT NULL CHECK (special_present IN (0, 1)),
  "range_present" bigint NOT NULL CHECK (range_present IN (0, 1)),
  "ammo_present" bigint NOT NULL CHECK (ammo_present IN (0, 1)),
  "movement_present" bigint NOT NULL CHECK (movement_present IN (0, 1)),
  "stealth_present" bigint NOT NULL CHECK (stealth_present IN (0, 1)),
  "gurps_skill_present" bigint NOT NULL CHECK (gurps_skill_present IN (0, 1)),
  "effect_present" bigint NOT NULL CHECK (effect_present IN (0, 1)),
  "loyalty_present" bigint NOT NULL CHECK (loyalty_present IN (0, 1)),
  "attack" text,
  "defense" text,
  "damage" text,
  "dr_target" text,
  "special" text,
  "range" text,
  "ammo" text,
  "movement" text,
  "stealth" text,
  "gurps_skill" text,
  "effect" text,
  "loyalty" text,
  PRIMARY KEY ("unit_ordinal"),
  CHECK (attack_present = 1 OR attack IS NULL),
  CHECK (defense_present = 1 OR defense IS NULL),
  CHECK (damage_present = 1 OR damage IS NULL),
  CHECK (dr_target_present = 1 OR dr_target IS NULL),
  CHECK (special_present = 1 OR special IS NULL),
  CHECK (range_present = 1 OR range IS NULL),
  CHECK (ammo_present = 1 OR ammo IS NULL),
  CHECK (movement_present = 1 OR movement IS NULL),
  CHECK (stealth_present = 1 OR stealth IS NULL),
  CHECK (gurps_skill_present = 1 OR gurps_skill IS NULL),
  CHECK (effect_present = 1 OR effect IS NULL),
  CHECK (loyalty_present = 1 OR loyalty IS NULL)
);
CREATE TABLE wiki."unit_proposal_document_hero" (
  "singleton" bigint CHECK (singleton = 1),
  "note" text NOT NULL,
  "hero_role" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."unit_proposal_document_hero_class" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "class_name" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."unit_proposal_document_import" (
  "singleton" bigint CHECK (singleton = 1),
  "source_sha256" text NOT NULL CHECK (length(source_sha256) = 64),
  "document_sha256" text NOT NULL CHECK (length(document_sha256) = 64),
  "actor" text NOT NULL CHECK (length(trim(actor)) > 0),
  "reason" text NOT NULL CHECK (length(trim(reason)) > 0),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."unit_proposal_document_key" (
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "key" text NOT NULL,
  PRIMARY KEY ("object_path", "ordinal"),
  UNIQUE (object_path, key)
);
CREATE TABLE wiki."unit_proposal_document_owner_decision" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "decision" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."unit_proposal_document_recruitment_source" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "source" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."unit_proposal_document_settlement" (
  "singleton" bigint CHECK (singleton = 1),
  "principle" text NOT NULL,
  "auto_description" text NOT NULL,
  "auto_example" text NOT NULL,
  "scale_major" text NOT NULL,
  "scale_medium" text NOT NULL,
  "scale_minor" text NOT NULL,
  "scale_outpost" text NOT NULL,
  "squad_cohesion" text NOT NULL,
  "morale" text NOT NULL,
  "fatigue" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."unit_proposal_document_squad" (
  "singleton" bigint CHECK (singleton = 1),
  "commander" text NOT NULL,
  "members" text NOT NULL,
  "max_squads_per_settlement" text NOT NULL,
  "npc_matching" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."unit_proposal_document_unit" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "id" text NOT NULL,
  "name" text NOT NULL,
  "name_en" text NOT NULL,
  "category" text NOT NULL,
  "description" text NOT NULL,
  "max_size" bigint NOT NULL,
  "base_size" bigint NOT NULL,
  "commander_skill" text NOT NULL,
  "battle_role" text NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("id")
);
CREATE TABLE wiki."unit_proposal_document_unit_string" (
  "unit_ordinal" bigint NOT NULL,
  "list_kind" text NOT NULL CHECK (list_kind IN ('martial_any', 'occupation_any', 'equipment')),
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("unit_ordinal", "list_kind", "ordinal")
);
CREATE TABLE wiki."value_axis" (
  "axis_name" text NOT NULL,
  "axis_ordinal" bigint NOT NULL CHECK(axis_ordinal >= 0),
  PRIMARY KEY ("axis_name"),
  UNIQUE ("axis_ordinal")
);
CREATE TABLE wiki."winter_climate_document_application" (
  "logical_path" text NOT NULL,
  "surface" text NOT NULL,
  "underground_source" text NOT NULL,
  "resolution" text NOT NULL,
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki."winter_climate_document_bound" (
  "logical_path" text NOT NULL,
  "bound_name" text NOT NULL CHECK(bound_name IN ('intermediate_underground_c','deep_underground_c')),
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "celsius" double precision NOT NULL,
  PRIMARY KEY ("logical_path", "bound_name", "ordinal")
);
CREATE TABLE wiki."winter_climate_document_import" (
  "logical_path" text NOT NULL,
  "source_sha256" text NOT NULL CHECK(length(source_sha256)=64),
  "document_sha256" text NOT NULL CHECK(length(document_sha256)=64),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  "receipt_sha256" text NOT NULL CHECK(length(receipt_sha256)=64),
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki."winter_climate_document_key" (
  "logical_path" text NOT NULL,
  "object_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "key" text NOT NULL,
  PRIMARY KEY ("logical_path", "object_path", "ordinal"),
  UNIQUE(logical_path,object_path,key)
);
CREATE TABLE wiki."winter_climate_document_record" (
  "logical_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "region_code_2021" text NOT NULL,
  "region_ko" text NOT NULL,
  "region_en" text NOT NULL,
  "station_id" bigint NOT NULL,
  "station_ko" text NOT NULL,
  "date" text NOT NULL,
  "timezone" text NOT NULL,
  "minimum_c" double precision NOT NULL,
  "maximum_c" double precision NOT NULL,
  "mean_c" double precision NOT NULL,
  "source_url" text NOT NULL,
  "source_sha256" text NOT NULL,
  "retrieved_at" text NOT NULL,
  PRIMARY KEY ("logical_path", "ordinal")
);
CREATE TABLE wiki."winter_climate_document_root" (
  "logical_path" text NOT NULL,
  "version" bigint NOT NULL,
  "kind" text NOT NULL,
  "date" text NOT NULL,
  "timezone" text NOT NULL,
  "administrative_basis" text NOT NULL,
  "selection" text NOT NULL,
  "metric" text NOT NULL,
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki."world_graph_document_alias" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "alias_key" text NOT NULL,
  "alias_value" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."world_graph_document_district" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "name" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."world_graph_document_edge" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "endpoint_a" text NOT NULL,
  "endpoint_b" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."world_graph_document_excluded" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "original_index" bigint NOT NULL,
  "original_a" text NOT NULL,
  "original_b" text NOT NULL,
  "status" text NOT NULL,
  "reason_presence" text NOT NULL CHECK (reason_presence IN ('missing', 'null', 'value')),
  "reason" text,
  "missing_presence" text NOT NULL CHECK (missing_presence IN ('missing', 'present')),
  "missing_count" bigint NOT NULL CHECK (missing_count >= 0),
  "support_index" bigint NOT NULL,
  "support_a" text NOT NULL,
  "support_b" text NOT NULL,
  "support_mapped_a" text NOT NULL,
  "support_mapped_b" text NOT NULL,
  "support_classification" text NOT NULL,
  "support_no_surface_adjacency_inference" bigint NOT NULL CHECK (support_no_surface_adjacency_inference IN (0, 1)),
  "adjacent_count" bigint NOT NULL CHECK (adjacent_count >= 0),
  "skipped_count" bigint NOT NULL CHECK (skipped_count >= 0),
  "opening_count" bigint NOT NULL CHECK (opening_count >= 0),
  "endpoint_count" bigint NOT NULL CHECK (endpoint_count >= 0),
  "evidence_ref_count" bigint NOT NULL CHECK (evidence_ref_count >= 0),
  PRIMARY KEY ("ordinal"),
  CHECK ((reason_presence = 'value' AND reason IS NOT NULL) OR (reason_presence IN ('missing', 'null') AND reason IS NULL)),
  CHECK ((missing_presence = 'present' AND missing_count >= 0) OR (missing_presence = 'missing' AND missing_count = 0))
);
CREATE TABLE wiki."world_graph_document_excluded_adjacent" (
  "excluded_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("excluded_ordinal", "ordinal")
);
CREATE TABLE wiki."world_graph_document_excluded_endpoint" (
  "excluded_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("excluded_ordinal", "ordinal")
);
CREATE TABLE wiki."world_graph_document_excluded_evidence_ref" (
  "excluded_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "path" text NOT NULL,
  "selector" text NOT NULL,
  PRIMARY KEY ("excluded_ordinal", "ordinal")
);
CREATE TABLE wiki."world_graph_document_excluded_missing" (
  "excluded_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("excluded_ordinal", "ordinal")
);
CREATE TABLE wiki."world_graph_document_excluded_opening" (
  "excluded_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("excluded_ordinal", "ordinal")
);
CREATE TABLE wiki."world_graph_document_excluded_skipped" (
  "excluded_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "line_id" text NOT NULL,
  "line_name" text NOT NULL,
  "path_index" bigint NOT NULL,
  "skipped_stops" bigint NOT NULL,
  "code_count" bigint NOT NULL CHECK (code_count >= 0),
  "station_id_count" bigint NOT NULL CHECK (station_id_count >= 0),
  "name_count" bigint NOT NULL CHECK (name_count >= 0),
  PRIMARY KEY ("excluded_ordinal", "ordinal")
);
CREATE TABLE wiki."world_graph_document_excluded_skipped_code" (
  "excluded_ordinal" bigint NOT NULL,
  "skipped_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("excluded_ordinal", "skipped_ordinal", "ordinal")
);
CREATE TABLE wiki."world_graph_document_excluded_skipped_name" (
  "excluded_ordinal" bigint NOT NULL,
  "skipped_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("excluded_ordinal", "skipped_ordinal", "ordinal")
);
CREATE TABLE wiki."world_graph_document_excluded_skipped_station" (
  "excluded_ordinal" bigint NOT NULL,
  "skipped_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("excluded_ordinal", "skipped_ordinal", "ordinal")
);
CREATE TABLE wiki."world_graph_document_hub" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "uid" text NOT NULL,
  "contract" text NOT NULL,
  "official_code_count" bigint NOT NULL CHECK (official_code_count >= 0),
  "permanent_id_count" bigint NOT NULL CHECK (permanent_id_count >= 0),
  "line_id_count" bigint NOT NULL CHECK (line_id_count >= 0),
  "evidence_count" bigint NOT NULL CHECK (evidence_count >= 0),
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."world_graph_document_hub_evidence" (
  "hub_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "line_id" text NOT NULL,
  "line_name" text NOT NULL,
  "code" text NOT NULL,
  "uid" text NOT NULL,
  "name" text NOT NULL,
  "path_index" bigint NOT NULL,
  "station_index" bigint NOT NULL,
  PRIMARY KEY ("hub_ordinal", "ordinal")
);
CREATE TABLE wiki."world_graph_document_hub_line_id" (
  "hub_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("hub_ordinal", "ordinal")
);
CREATE TABLE wiki."world_graph_document_hub_official_code" (
  "hub_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("hub_ordinal", "ordinal")
);
CREATE TABLE wiki."world_graph_document_hub_permanent_id" (
  "hub_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("hub_ordinal", "ordinal")
);
CREATE TABLE wiki."world_graph_document_import" (
  "singleton" bigint CHECK (singleton = 1),
  "actor" text NOT NULL CHECK (length(trim(actor)) > 0),
  "reason" text NOT NULL CHECK (length(trim(reason)) > 0),
  "source_sha256" text NOT NULL CHECK (length(source_sha256) = 64 AND source_sha256 !~ '^.*[^0-9a-f].*$'),
  "document_sha256" text NOT NULL CHECK (length(document_sha256) = 64 AND document_sha256 !~ '^.*[^0-9a-f].*$'),
  "byte_length" bigint NOT NULL CHECK (byte_length >= 0),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."world_graph_document_replacement" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "original_index" bigint NOT NULL,
  "original_a" text NOT NULL,
  "original_b" text NOT NULL,
  "status" text NOT NULL,
  "line_id" text NOT NULL,
  "physical_evidence_boundary" text NOT NULL,
  "chain_count" bigint NOT NULL CHECK (chain_count >= 0),
  "official_code_count" bigint NOT NULL CHECK (official_code_count >= 0),
  "source_url" text NOT NULL,
  "source_retrieved_at" text NOT NULL,
  "source_sha256" text NOT NULL,
  "source_scope" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE TABLE wiki."world_graph_document_replacement_chain" (
  "replacement_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("replacement_ordinal", "ordinal")
);
CREATE TABLE wiki."world_graph_document_replacement_code" (
  "replacement_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("replacement_ordinal", "ordinal")
);
CREATE TABLE wiki."world_graph_document_root" (
  "singleton" bigint CHECK (singleton = 1),
  "schema" text NOT NULL,
  "district_count" bigint NOT NULL CHECK (district_count >= 0),
  "station_count" bigint NOT NULL CHECK (station_count >= 0),
  "edge_count" bigint NOT NULL CHECK (edge_count >= 0),
  "alias_count" bigint NOT NULL CHECK (alias_count >= 0),
  "source_original" text NOT NULL,
  "rail_revision" text NOT NULL,
  "rail_wiki_commit" text NOT NULL,
  "rail_scope" text NOT NULL,
  "rail_official_url" text NOT NULL,
  "rail_official_retrieved_at" text NOT NULL,
  "rail_official_sha256" text NOT NULL,
  "rail_official_scope" text NOT NULL,
  "replacement_count" bigint NOT NULL CHECK (replacement_count >= 0),
  "excluded_count" bigint NOT NULL CHECK (excluded_count >= 0),
  "hub_count" bigint NOT NULL CHECK (hub_count >= 0),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki."world_graph_document_station" (
  "ordinal" bigint CHECK (ordinal >= 0),
  "station_id" text NOT NULL,
  "name_ko" text NOT NULL,
  "name_en" text NOT NULL,
  "district" text NOT NULL,
  "lat" double precision NOT NULL,
  "lon" double precision NOT NULL,
  "lat_text" text NOT NULL,
  "lon_text" text NOT NULL,
  PRIMARY KEY ("ordinal")
);
CREATE INDEX context_holding_current_idx ON wiki.context_holding(current_validity,holder_person_id);
CREATE INDEX context_office_polity_idx ON wiki.context_office_appointment(polity_id,common_tier);
CREATE INDEX context_contact_recipient_idx ON wiki.context_prose_contact(recipient_person_id);
CREATE INDEX data_source_revision_path ON wiki.data_source_revision(source_path, sequence);
CREATE INDEX evidence_person_subject_idx ON wiki.evidence(person_id,subject_kind);
CREATE INDEX historical_feudal_grant_holder_idx ON wiki.historical_feudal_grant(holder_person_id);
CREATE INDEX historical_feudal_grant_liege_idx ON wiki.historical_feudal_grant(liege_person_id);
CREATE INDEX historical_feudal_title_holder_idx ON wiki.historical_feudal_title(holder_person_id);
CREATE INDEX historical_outside_holder_idx ON wiki.historical_outside_person_control(holder_person_id);
CREATE INDEX index_corridor_person_id_idx ON wiki.index_corridor_person(person_id);
CREATE INDEX index_person_id_idx ON wiki.index_person(person_id);
CREATE INDEX person_state_idx ON wiki.person(state_id);
CREATE INDEX profile_person_primary_idx ON wiki.profile(person_id,is_primary);
CREATE UNIQUE INDEX profile_one_primary_idx ON wiki.profile(person_id) WHERE is_primary=1;
CREATE INDEX profile_field_key_idx ON wiki.profile_field(key_ko);
CREATE INDEX quality_issue_dataset_idx ON wiki.quality_issue(dataset,code,person_id);
CREATE INDEX relation_from_idx ON wiki.relation(from_person_id,type_ko,row_ordinal);
CREATE INDEX relation_to_idx ON wiki.relation(to_person_id,type_ko,row_ordinal);
RESET ROLE;
CREATE SCHEMA IF NOT EXISTS wiki_private;
ALTER SCHEMA wiki_private OWNER TO wiki_private_owner;
SET ROLE wiki_private_owner;
CREATE TABLE wiki_private."ed_document" (
  "id" text NOT NULL CHECK(length(id) > 0),
  "corpus" text NOT NULL CHECK(length(corpus) > 0),
  "privacy" text NOT NULL CHECK(privacy IN ('public', 'private', 'editorial')),
  "current_revision" bigint NOT NULL CHECK(current_revision > 0),
  "retired" bigint NOT NULL DEFAULT 0 CHECK(retired IN (0, 1)),
  PRIMARY KEY ("id")
);
CREATE TABLE wiki_private."ed_document_node" (
  "document_id" text NOT NULL,
  "node_id" bigint NOT NULL CHECK(node_id >= 0),
  "parent_id" bigint,
  "position" bigint NOT NULL CHECK(position >= 0),
  "member_key" text,
  "kind" text NOT NULL CHECK(kind IN ('object', 'array', 'null', 'string', 'number', 'boolean')),
  "text_value" text,
  "number_value" double precision,
  "boolean_value" bigint CHECK(boolean_value IN (0, 1)),
  "negative_zero" bigint NOT NULL DEFAULT 0 CHECK(negative_zero IN (0, 1)),
  PRIMARY KEY ("document_id", "node_id"),
  UNIQUE(document_id, parent_id, position),
  UNIQUE(document_id, parent_id, member_key),
  CHECK((parent_id IS NULL AND node_id = 0 AND position = 0 AND member_key IS NULL)
     OR (parent_id IS NOT NULL AND node_id > 0)),
  CHECK((kind = 'string' AND text_value IS NOT NULL AND number_value IS NULL AND boolean_value IS NULL AND negative_zero = 0)
     OR (kind = 'number' AND text_value IS NULL AND number_value IS NOT NULL AND boolean_value IS NULL AND (negative_zero = 0 OR number_value = 0))
     OR (kind = 'boolean' AND text_value IS NULL AND number_value IS NULL AND boolean_value IS NOT NULL AND negative_zero = 0)
     OR (kind IN ('object', 'array', 'null') AND text_value IS NULL AND number_value IS NULL AND boolean_value IS NULL AND negative_zero = 0))
);
CREATE TABLE wiki_private."ed_document_revision" (
  "document_id" text NOT NULL,
  "revision" bigint NOT NULL CHECK(revision > 0),
  "operation" text NOT NULL CHECK(operation IN ('create', 'update', 'retire')),
  "corpus" text NOT NULL,
  "privacy" text NOT NULL CHECK(privacy IN ('public', 'private', 'editorial')),
  "approval_state" text NOT NULL CHECK(length(approval_state) > 0),
  "raw_bytes" bytea NOT NULL,
  "sha256" text NOT NULL CHECK(length(sha256) = 64),
  "media_type" text NOT NULL CHECK(length(media_type) > 0),
  "logical_path" text,
  "git_revision" text,
  "git_blob" text,
  PRIMARY KEY ("document_id", "revision")
);
CREATE TABLE wiki_private."soul_archive" (
  "singleton" bigint CHECK(singleton=1),
  "sha256" text NOT NULL,
  "raw_bytes" bytea NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki_private."soul_assignment" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "personId" text,
  "name" text,
  "status" text,
  "narrativeRationale" text,
  "counterEvidence" text,
  "evidenceStrength" text,
  "duplicateRationale" text,
  "approvalRef" text,
  "counter_kind" text CHECK(counter_kind IN ('text','array')),
  PRIMARY KEY ("row_key"),
  UNIQUE(parent_key,ordinal)
);
CREATE TABLE wiki_private."soul_candidate_period" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "value" text NOT NULL,
  PRIMARY KEY ("row_key"),
  UNIQUE(parent_key,ordinal)
);
CREATE TABLE wiki_private."soul_comparison" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "candidatePath" text,
  "candidateId" text,
  "sourceKind" text,
  "careerSummary" text,
  "interpretation" text,
  "path" text,
  "interpretiveScope" text,
  "candidateLedger" text,
  "interpretationOnly" bigint CHECK("interpretationOnly" IN (0,1)),
  "primarySourcesVerified" bigint CHECK("primarySourcesVerified" IN (0,1)),
  "anchor" text,
  "narrativeFit" text,
  PRIMARY KEY ("row_key"),
  UNIQUE(parent_key,ordinal)
);
CREATE TABLE wiki_private."soul_comparison_limitation" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "value" text NOT NULL,
  PRIMARY KEY ("row_key"),
  UNIQUE(parent_key,ordinal)
);
CREATE TABLE wiki_private."soul_counter_item" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "value" text NOT NULL,
  PRIMARY KEY ("row_key"),
  UNIQUE(parent_key,ordinal)
);
CREATE TABLE wiki_private."soul_coverage" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "registeredPeople" bigint,
  "assignedPeople" bigint,
  "complete" bigint CHECK("complete" IN (0,1)),
  PRIMARY KEY ("row_key"),
  UNIQUE(parent_key,ordinal)
);
CREATE TABLE wiki_private."soul_document" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "schema" text,
  "status" text,
  "visibility" text,
  "maximumSoulsPerPerson" bigint,
  "assignmentPolicy" text,
  "interpretationPolicy" text,
  "sourceRegistry" text,
  "pending" text,
  PRIMARY KEY ("row_key"),
  UNIQUE(parent_key,ordinal)
);
CREATE TABLE wiki_private."soul_edit_initialization" (
  "singleton" bigint CHECK(singleton=1),
  "actor" text NOT NULL,
  "reason" text NOT NULL,
  "initialized_at" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki_private."soul_edit_revision" (
  "revision_id" bigint CHECK(revision_id>=0),
  "parent_revision" bigint,
  "source_sha256" text NOT NULL,
  "snapshot_sha256" text NOT NULL,
  "assignment_count" bigint NOT NULL CHECK(assignment_count=1022),
  "status" text NOT NULL CHECK(status IN ('imported','draft')),
  "actor" text NOT NULL CHECK(length(trim(actor))>0),
  "reason" text NOT NULL CHECK(length(trim(reason))>0),
  "initialized_at" text NOT NULL,
  "person_id" text,
  PRIMARY KEY ("revision_id"),
  CHECK((revision_id=0 AND parent_revision IS NULL AND status='imported' AND person_id IS NULL)
    OR (revision_id>0 AND parent_revision=revision_id-1 AND status='draft' AND person_id IS NOT NULL))
);
CREATE TABLE wiki_private."soul_evidence" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "path" text,
  "anchor" text,
  "quote" text,
  "sourcePointer" text,
  "sourceSelector" text,
  "currentFactAuthority" bigint CHECK("currentFactAuthority" IN (0,1)),
  PRIMARY KEY ("row_key"),
  UNIQUE(parent_key,ordinal)
);
CREATE TABLE wiki_private."soul_head" (
  "singleton" bigint CHECK(singleton=1),
  "revision_id" bigint NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki_private."soul_historical_source" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "url" text,
  "sourceType" text,
  "accessMethod" text,
  "accessedOn" text,
  "source_kind" text NOT NULL CHECK(source_kind IN ('url','record')),
  PRIMARY KEY ("row_key"),
  UNIQUE(parent_key,ordinal)
);
CREATE TABLE wiki_private."soul_identity" (
  "person_id" text NOT NULL,
  PRIMARY KEY ("person_id")
);
CREATE TABLE wiki_private."soul_revision" (
  "singleton" bigint CHECK(singleton=1),
  "source_sha256" text NOT NULL,
  "snapshot_sha256" text NOT NULL,
  "assignment_count" bigint NOT NULL,
  "actor" text NOT NULL,
  "reason" text NOT NULL,
  "initialized_at" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki_private."soul_soul" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "id" text,
  "name" text,
  "period" text,
  "sourceKind" text,
  "interpretation" text,
  PRIMARY KEY ("row_key"),
  UNIQUE(parent_key,ordinal)
);
CREATE TABLE wiki_private."editorial_abilities" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_ability_value" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "base" bigint,
  "effective" bigint,
  "basis" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_archive" (
  "logical_path" text NOT NULL,
  "sha256" text NOT NULL,
  "raw_bytes" bytea NOT NULL,
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki_private."editorial_batch" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "schema" text,
  "status" text,
  "visibility" text,
  "lane" text,
  "batch" text,
  "approvalStatus" text,
  "ratingPolicy" text,
  "allocationPolicy" text,
  "count" bigint,
  "profileCount" bigint,
  "contractPath" text,
  "samplePath" text,
  "soulAssignmentPath" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_batch_limitation" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "value" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_batch_source" (
  "ordinal" bigint,
  "logical_path" text NOT NULL,
  "sha256" text NOT NULL,
  "snapshot_sha256" text NOT NULL,
  "profile_count" bigint NOT NULL,
  PRIMARY KEY ("ordinal"),
  UNIQUE ("logical_path")
);
CREATE TABLE wiki_private."editorial_batch_source_card" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "value" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_batch_source_path" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "value" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_batch_source_ref" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "value" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_body_part" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "id" text,
  "severity" text CHECK("severity" IS NULL),
  "function" text CHECK("function" IS NULL),
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_disease" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_effect" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "ability" text,
  "delta" bigint,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_health" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "status" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_identity" (
  "person_id" text NOT NULL,
  PRIMARY KEY ("person_id")
);
CREATE TABLE wiki_private."editorial_import" (
  "singleton" bigint CHECK(singleton=1),
  "actor" text NOT NULL,
  "reason" text NOT NULL,
  "imported_at" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki_private."editorial_narrative" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "ko" text,
  "en" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_profile" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "personId" text,
  "name" text,
  "status" text,
  "soulRevisionRef" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_profile_evidence" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "path" text,
  "anchor" text,
  "quote" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_profile_limitation" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "value" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_skill" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "id" text,
  "rating" double precision,
  "basis" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_skill_name" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "ko" text,
  "en" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_soul" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "id" text,
  "name" text,
  "period" text,
  "sourceKind" text,
  "interpretation" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_trait" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "id" text,
  "basis" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_trait_behavior" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "ko" text,
  "en" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_trait_description" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "ko" text,
  "en" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_trait_name" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "ko" text,
  "en" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_trait_relationship" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "ko" text,
  "en" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."editorial_trait_stress" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK(ordinal>=0),
  "field_order" text NOT NULL,
  "ko" text,
  "en" text,
  PRIMARY KEY ("row_key")
);
CREATE TABLE wiki_private."soul_candidate_documents_archive" (
  "logical_path" text NOT NULL,
  "source_sha256" text NOT NULL,
  "raw_bytes" bytea NOT NULL,
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki_private."soul_candidate_documents_candidate" (
  "logical_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "id" text NOT NULL,
  "name" text NOT NULL,
  "period" text NOT NULL,
  "source_kind" text NOT NULL,
  "locked_existing" bigint NOT NULL CHECK (locked_existing IN (0, 1)),
  "related_periods_present" bigint NOT NULL CHECK (related_periods_present IN (0, 1)),
  "research_status" text NOT NULL,
  "career_summary" text NOT NULL,
  "narrative_fit" text NOT NULL,
  "source_count" bigint NOT NULL CHECK (source_count >= 0),
  "role_tag_count" bigint NOT NULL CHECK (role_tag_count >= 0),
  "limitation_count" bigint NOT NULL CHECK (limitation_count >= 0),
  PRIMARY KEY ("logical_path", "ordinal"),
  UNIQUE (logical_path, id)
);
CREATE TABLE wiki_private."soul_candidate_documents_coverage" (
  "logical_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "period" text NOT NULL,
  "candidate_count" bigint NOT NULL,
  PRIMARY KEY ("logical_path", "ordinal")
);
CREATE TABLE wiki_private."soul_candidate_documents_document" (
  "logical_path" text NOT NULL,
  "field_order" text NOT NULL,
  "schema" text NOT NULL,
  "status" text NOT NULL,
  "visibility" text NOT NULL,
  "interpretation_policy" text NOT NULL,
  "assignment_policy" text NOT NULL,
  "candidate_period_count" bigint NOT NULL CHECK (candidate_period_count >= 0),
  "candidate_count" bigint NOT NULL CHECK (candidate_count >= 0),
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki_private."soul_candidate_documents_import" (
  "singleton" bigint CHECK (singleton = 1),
  "actor" text NOT NULL CHECK (length(trim(actor)) > 0),
  "reason" text NOT NULL CHECK (length(trim(reason)) > 0),
  "initialized_at" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki_private."soul_candidate_documents_limitation" (
  "logical_path" text NOT NULL,
  "candidate_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("logical_path", "candidate_ordinal", "ordinal")
);
CREATE TABLE wiki_private."soul_candidate_documents_period" (
  "logical_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("logical_path", "ordinal")
);
CREATE TABLE wiki_private."soul_candidate_documents_related_period" (
  "logical_path" text NOT NULL,
  "candidate_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("logical_path", "candidate_ordinal", "ordinal")
);
CREATE TABLE wiki_private."soul_candidate_documents_research" (
  "logical_path" text NOT NULL,
  "field_order" text NOT NULL,
  "accessed_on" text NOT NULL,
  "total_candidates" bigint NOT NULL,
  "primary_sources_verified" bigint NOT NULL CHECK (primary_sources_verified IN (0, 1)),
  "limitation_count" bigint NOT NULL CHECK (limitation_count >= 0),
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki_private."soul_candidate_documents_research_limitation" (
  "logical_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("logical_path", "ordinal")
);
CREATE TABLE wiki_private."soul_candidate_documents_role_tag" (
  "logical_path" text NOT NULL,
  "candidate_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("logical_path", "candidate_ordinal", "ordinal")
);
CREATE TABLE wiki_private."soul_candidate_documents_source" (
  "logical_path" text NOT NULL,
  "source_sha256" text NOT NULL CHECK (length(source_sha256) = 64),
  "document_sha256" text NOT NULL CHECK (length(document_sha256) = 64),
  "byte_length" bigint NOT NULL CHECK (byte_length >= 0),
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki_private."soul_candidate_documents_source_record" (
  "logical_path" text NOT NULL,
  "candidate_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "url" text NOT NULL,
  "source_type" text NOT NULL,
  "access_method" text NOT NULL,
  "accessed_on" text NOT NULL,
  PRIMARY KEY ("logical_path", "candidate_ordinal", "ordinal")
);
CREATE TABLE wiki_private."soul_review_documents_archive" (
  "logical_path" text NOT NULL,
  "sha256" text NOT NULL,
  "raw_bytes" bytea NOT NULL,
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki_private."soul_review_documents_baseline_assignment" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "counter_kind" text NOT NULL CHECK (counter_kind IN ('text', 'array')),
  "personId" text,
  "name" text,
  "status" text,
  "narrativeRationale" text,
  "counterEvidence" text,
  "evidenceStrength" text,
  "duplicateRationale" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_candidate_comparison" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "id" text,
  "name" text,
  "period" text,
  "sourceKind" text,
  "lockedExisting" bigint CHECK ("lockedExisting" IN (0, 1)),
  "researchStatus" text,
  "careerSummary" text,
  "narrativeFit" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_change" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "counter_kind" text NOT NULL CHECK (counter_kind IN ('text', 'array')),
  "personId" text,
  "name" text,
  "statusBefore" text,
  "statusAfter" text,
  "whyEqualOrBetter" text,
  "counterEvidence" text,
  "decision" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_changed_node" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "personId" text,
  "path" text,
  "anchor" text,
  "originalKoreanText" text,
  "quote" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_coverage" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "people" bigint,
  "soulSlots" bigint,
  "candidates" bigint,
  "initiallyUnusedCandidates" bigint,
  "ownerConfirmedImmutable" bigint,
  "weakEvidenceAssignmentsRetained" bigint,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_document" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "schema" text,
  "status" text,
  "visibility" text,
  "assignmentLedger" text,
  "candidateLedger" text,
  "reviewedOn" text,
  "policy" text,
  "candidateLedgerSha256" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_evidence" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "path" text,
  "anchor" text,
  "quote" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_fingerprint" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "path" text,
  "contentHash" text,
  "hashEncoding" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_frequency_review" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "candidateId" text,
  "before" bigint,
  "after" bigint,
  "weakEvidenceRows" bigint,
  "reason" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_histogram_entry" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "candidateId" text,
  "before" bigint,
  "after" bigint,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_import" (
  "singleton" bigint CHECK (singleton = 1),
  "actor" text NOT NULL,
  "reason" text NOT NULL,
  "initialized_at" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki_private."soul_review_documents_judgment" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "independentRangeReview" text,
  "finalEditorialDecision" text,
  "notConsensusApproval" bigint CHECK ("notConsensusApproval" IN (0, 1)),
  "reasonForNotRequiringWholeBiography" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_ledger_comparison" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "candidateLedger" text,
  "careerSummary" text,
  "interpretationOnly" bigint CHECK ("interpretationOnly" IN (0, 1)),
  "primarySourcesVerified" bigint CHECK ("primarySourcesVerified" IN (0, 1)),
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_locked_assignment" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "personId" text,
  "name" text,
  "approvalRef" text,
  "status" text,
  "assignmentSha256" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_original_evidence" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "assignmentLedgerSha256" text,
  "verifiedQuotes" bigint,
  "verification" text,
  "concurrentSourceEdits" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_path_comparison" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "path" text,
  "candidateId" text,
  "careerSummary" text,
  "interpretiveScope" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_pool_metrics" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "candidatePool" bigint,
  "usedCandidates" bigint,
  "unusedCandidates" bigint,
  "soulSlots" bigint,
  "repeatedSlotsBeyondFirst" bigint,
  "sameCandidatePairs" bigint,
  "maximumFrequency" bigint,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_quote_audit" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "count" bigint,
  "failures" bigint,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_range_review" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "range" text,
  "people" bigint,
  "status" text,
  "sourceQuotes" bigint,
  "recommendedReplacements" bigint,
  "weakEvidenceRows" bigint,
  "sourceQuoteVerification" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_retained_duplicate" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "candidateId" text,
  "before" bigint,
  "reason" text,
  "after" bigint,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_soul" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "id" text,
  "name" text,
  "period" text,
  "sourceKind" text,
  "interpretation" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_source" (
  "logical_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "byte_length" bigint NOT NULL CHECK (byte_length >= 0),
  "source_sha256" text NOT NULL,
  "document_sha256" text NOT NULL,
  PRIMARY KEY ("logical_path"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki_private."soul_review_documents_source_comparison" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "checkedOn" text,
  "changedQuoteCount" bigint,
  "meaning" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_source_record" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "url" text,
  "sourceType" text,
  "accessMethod" text,
  "accessedOn" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_structural_audit" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "passed" bigint CHECK ("passed" IN (0, 1)),
  "identities" bigint,
  "candidateSlots" bigint,
  "immutableLocks" bigint,
  "untouchedAssignments" bigint,
  "changedOriginalQuotes" bigint,
  "histogramMatches" bigint CHECK ("histogramMatches" IN (0, 1)),
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_text_item" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "value" text NOT NULL,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_unused_review" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "group" text,
  "decision" text,
  "reason" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_validator_run" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "command" text,
  "exitCode" bigint,
  "output" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_review_documents_verification" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "weakEvidenceAssignmentsUnchanged" bigint,
  "approvalStatusUnchanged" bigint CHECK ("approvalStatusUnchanged" IN (0, 1)),
  "assignmentDiagnostics" text,
  "assignmentDiffCheckExitCode" bigint,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_batch_documents_archive" (
  "logical_path" text NOT NULL,
  "sha256" text NOT NULL,
  "raw_bytes" bytea NOT NULL,
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki_private."soul_batch_documents_assignment" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "counter_kind" text NOT NULL CHECK (counter_kind IN ('text', 'array')),
  "personId" text,
  "name" text,
  "status" text,
  "approvalRef" text,
  "narrativeRationale" text,
  "counterEvidence" text,
  "evidenceStrength" text,
  "duplicateRationale" text,
  "currentFactAuthority" bigint CHECK ("currentFactAuthority" IN (0, 1)),
  "canonicalAssignmentRef" text,
  "supersededByApprovalRef" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_batch_documents_comparison" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "candidatePath" text,
  "candidateId" text,
  "sourceKind" text,
  "careerSummary" text,
  "interpretation" text,
  "path" text,
  "anchor" text,
  "interpretiveScope" text,
  "candidateLedger" text,
  "interpretationOnly" bigint CHECK ("interpretationOnly" IN (0, 1)),
  "primarySourcesVerified" bigint CHECK ("primarySourcesVerified" IN (0, 1)),
  "narrativeFit" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_batch_documents_document" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "exclusions_kind" text CHECK (exclusions_kind IN ('array', 'object')),
  "schema" text,
  "visibility" text,
  "status" text,
  "batch" text,
  "lane" text,
  "assignmentCount" bigint,
  "lockedAssignmentCount" bigint,
  "count" bigint,
  "interpretationPolicy" text,
  "policy" text,
  "exclusionPolicy" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_batch_documents_duplicate_summary" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "id" text,
  "name" text,
  "count" bigint,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_batch_documents_evidence" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "path" text,
  "anchor" text,
  "quote" text,
  "sourcePointer" text,
  "sourceSelector" text,
  "currentFactAuthority" bigint CHECK ("currentFactAuthority" IN (0, 1)),
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_batch_documents_excluded_person" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "personId" text,
  "name" text,
  "reason" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_batch_documents_exclusions_object" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "policy" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_batch_documents_historical_source" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "url" text,
  "sourceType" text,
  "accessMethod" text,
  "accessedOn" text,
  "source_kind" text NOT NULL CHECK (source_kind IN ('url', 'record')),
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_batch_documents_import" (
  "singleton" bigint CHECK (singleton = 1),
  "actor" text NOT NULL,
  "reason" text NOT NULL,
  "initialized_at" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki_private."soul_batch_documents_named_person" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "personId" text,
  "name" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_batch_documents_scope" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "sourceCardCount" bigint,
  "expectedPeople" bigint,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_batch_documents_soul" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "id" text,
  "name" text,
  "period" text,
  "sourceKind" text,
  "interpretation" text,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."soul_batch_documents_source" (
  "logical_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "byte_length" bigint NOT NULL CHECK (byte_length >= 0),
  "source_sha256" text NOT NULL,
  "document_sha256" text NOT NULL,
  "assignment_count" bigint NOT NULL CHECK (assignment_count >= 0),
  PRIMARY KEY ("logical_path"),
  UNIQUE ("ordinal")
);
CREATE TABLE wiki_private."soul_batch_documents_text_item" (
  "row_key" text NOT NULL,
  "parent_key" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "field_order" text NOT NULL,
  "value" text NOT NULL,
  PRIMARY KEY ("row_key"),
  UNIQUE (parent_key, ordinal)
);
CREATE TABLE wiki_private."opening_sample_documents_ability" (
  "logical_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("logical_path", "ordinal")
);
CREATE TABLE wiki_private."opening_sample_documents_archive" (
  "logical_path" text NOT NULL,
  "source_sha256" text NOT NULL,
  "raw_bytes" bytea NOT NULL,
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki_private."opening_sample_documents_document" (
  "logical_path" text NOT NULL,
  "schema" text NOT NULL,
  "status" text NOT NULL,
  "approval_ref" text NOT NULL,
  "visibility" text NOT NULL,
  "people_count" bigint NOT NULL CHECK (people_count = 6),
  "review_question_count" bigint NOT NULL CHECK (review_question_count >= 0),
  "pending" text NOT NULL,
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki_private."opening_sample_documents_import" (
  "singleton" bigint CHECK (singleton = 1),
  "actor" text NOT NULL CHECK (length(trim(actor)) > 0),
  "reason" text NOT NULL CHECK (length(trim(reason)) > 0),
  "initialized_at" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki_private."opening_sample_documents_person" (
  "logical_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "person_id" text NOT NULL,
  "name" text NOT NULL,
  "base_leadership" bigint NOT NULL,
  "base_strategy" bigint NOT NULL,
  "base_negotiation" bigint NOT NULL,
  "base_management" bigint NOT NULL,
  "base_insight" bigint NOT NULL,
  "base_learning" bigint NOT NULL,
  "base_prowess" bigint NOT NULL,
  "base_endurance" bigint NOT NULL,
  "skill_count" bigint NOT NULL CHECK (skill_count >= 0),
  "trait_count" bigint NOT NULL CHECK (trait_count >= 0),
  "ability_present" bigint NOT NULL CHECK (ability_present IN (0, 1)),
  "delta_present" bigint NOT NULL CHECK (delta_present IN (0, 1)),
  "effect_proposal_present" bigint NOT NULL CHECK (effect_proposal_present IN (0, 1)),
  "evidence_note" text NOT NULL,
  PRIMARY KEY ("logical_path", "ordinal"),
  UNIQUE (logical_path, person_id)
);
CREATE TABLE wiki_private."opening_sample_documents_review_question" (
  "logical_path" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "value" text NOT NULL,
  PRIMARY KEY ("logical_path", "ordinal")
);
CREATE TABLE wiki_private."opening_sample_documents_skill" (
  "logical_path" text NOT NULL,
  "person_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "name" text NOT NULL,
  "rating" double precision NOT NULL,
  PRIMARY KEY ("logical_path", "person_ordinal", "ordinal")
);
CREATE TABLE wiki_private."opening_sample_documents_source" (
  "logical_path" text NOT NULL,
  "source_sha256" text NOT NULL CHECK (length(source_sha256) = 64),
  "document_sha256" text NOT NULL CHECK (length(document_sha256) = 64),
  "byte_length" bigint NOT NULL CHECK (byte_length >= 0),
  PRIMARY KEY ("logical_path")
);
CREATE TABLE wiki_private."opening_sample_documents_trait" (
  "logical_path" text NOT NULL,
  "person_ordinal" bigint NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "name" text NOT NULL,
  "ability" text,
  "delta" bigint,
  "effect_proposal" text,
  PRIMARY KEY ("logical_path", "person_ordinal", "ordinal")
);
CREATE TABLE wiki_private."env_editorial_envelope_archive" (
  "source_id" bigint,
  "sha256" text NOT NULL,
  "raw_bytes" bytea NOT NULL,
  PRIMARY KEY ("source_id")
);
CREATE TABLE wiki_private."env_editorial_envelope_import" (
  "singleton" bigint CHECK (singleton = 1),
  "actor" text NOT NULL CHECK (length(trim(actor)) > 0),
  "reason" text NOT NULL CHECK (length(trim(reason)) > 0),
  "initialized_at" text NOT NULL,
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki_private."env_source_file" (
  "source_id" bigint,
  "logical_path" text NOT NULL,
  "media_type" text NOT NULL,
  "sha256" text NOT NULL CHECK (length(sha256) = 64),
  "byte_length" bigint NOT NULL CHECK (byte_length >= 0),
  "document_sha256" text NOT NULL CHECK (length(document_sha256) = 64),
  PRIMARY KEY ("source_id"),
  UNIQUE ("logical_path")
);
CREATE TABLE wiki_private."env_text_document" (
  "source_id" bigint,
  "json_pointer" text NOT NULL CHECK (json_pointer = ''),
  "corpus_kind" text NOT NULL CHECK (corpus_kind = 'historical'),
  "version" bigint NOT NULL CHECK (version = 1),
  "domain" text NOT NULL,
  "document_id" text NOT NULL,
  "slug" text NOT NULL,
  "status" text NOT NULL CHECK (status = 'draft'),
  "tense_ko" text NOT NULL CHECK (tense_ko IN ('past', 'present')),
  "tense_en" text NOT NULL CHECK (tense_en IN ('past', 'present')),
  "source_kind" text NOT NULL CHECK (source_kind IN ('original-fiction', 'observed', 'computed', 'inference', 'source-fact')),
  "source_hash" text,
  "original_anchor" text NOT NULL,
  "original_hash" text,
  "data_pointer" text NOT NULL CHECK (data_pointer = '/data'),
  "data_empty" bigint NOT NULL CHECK (data_empty = 1),
  "categories_present" bigint NOT NULL CHECK (categories_present IN (0, 1)),
  "source_hash_present" bigint NOT NULL CHECK (source_hash_present IN (0, 1)),
  "content_count" bigint NOT NULL CHECK (content_count >= 1),
  "category_count" bigint NOT NULL CHECK (category_count >= 0),
  "ref_count" bigint NOT NULL CHECK (ref_count >= 0),
  "history_count" bigint NOT NULL CHECK (history_count >= 0),
  PRIMARY KEY ("source_id"),
  UNIQUE (corpus_kind, domain, slug)
);
CREATE TABLE wiki_private."env_text_document_anchor" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "locale" text NOT NULL CHECK (locale IN ('ko', 'en')),
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "node_pointer" text NOT NULL,
  "anchor" text NOT NULL,
  "anchor_kind" text NOT NULL CHECK (anchor_kind IN ('authored', 'public', 'natural', 'inline')),
  "published" bigint NOT NULL CHECK (published IN (0, 1)),
  PRIMARY KEY ("source_id", "locale", "ordinal")
);
CREATE TABLE wiki_private."env_text_document_category" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "category" text NOT NULL,
  PRIMARY KEY ("source_id", "ordinal"),
  UNIQUE (source_id, category)
);
CREATE TABLE wiki_private."env_text_document_history" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "entry" text NOT NULL,
  PRIMARY KEY ("source_id", "ordinal")
);
CREATE TABLE wiki_private."env_text_document_link" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "corpus_kind" text NOT NULL CHECK (corpus_kind = 'historical'),
  "locale" text NOT NULL CHECK (locale IN ('ko', 'en')),
  "resolution" text NOT NULL CHECK (resolution = 'external'),
  "target_source_id" bigint,
  "target_anchor_ordinal" bigint,
  PRIMARY KEY ("source_id", "json_pointer"),
  CHECK (target_source_id IS NULL AND target_anchor_ordinal IS NULL)
);
CREATE TABLE wiki_private."env_text_document_locale" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "locale" text NOT NULL CHECK (locale IN ('ko', 'en')),
  "title" text NOT NULL,
  "summary" text NOT NULL,
  "tense" text NOT NULL CHECK (tense IN ('past', 'present')),
  "key_ordinal" bigint NOT NULL CHECK (key_ordinal >= 0),
  PRIMARY KEY ("source_id", "locale")
);
CREATE TABLE wiki_private."env_text_document_node" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "kind" text NOT NULL CHECK (kind IN ('heading', 'paragraph', 'table')),
  "anchor" text NOT NULL,
  "depth" bigint,
  "key_order" text NOT NULL,
  "column_count" bigint NOT NULL CHECK (column_count >= 0),
  "row_count" bigint NOT NULL CHECK (row_count >= 0),
  "public_anchor_count" bigint NOT NULL CHECK (public_anchor_count = 0),
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE (source_id, ordinal),
  UNIQUE (source_id, anchor),
  CHECK ((kind = 'heading' AND depth BETWEEN 1 AND 6 AND column_count = 0 AND row_count = 0)
    OR (kind = 'paragraph' AND depth IS NULL AND column_count = 0 AND row_count = 0)
    OR (kind = 'table' AND depth IS NULL AND column_count >= 1 AND row_count >= 1))
);
CREATE TABLE wiki_private."env_text_document_run" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "slot_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "text" text NOT NULL,
  "href" text,
  "key_order" text NOT NULL CHECK (key_order IN ('text', 'text,href')),
  "run_sha256" text NOT NULL CHECK (length(run_sha256) = 64),
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE (source_id, slot_pointer, ordinal),
  CHECK ((key_order = 'text' AND href IS NULL) OR (key_order = 'text,href' AND href IS NOT NULL AND length(href) > 0))
);
CREATE TABLE wiki_private."env_text_document_slot" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "node_pointer" text NOT NULL,
  "locale" text NOT NULL CHECK (locale IN ('ko', 'en')),
  "representation" text NOT NULL CHECK (representation IN ('string', 'runs')),
  "text" text NOT NULL,
  "run_count" bigint NOT NULL CHECK (run_count >= 0),
  "leaf_key_order" text NOT NULL,
  "slot_sha256" text NOT NULL CHECK (length(slot_sha256) = 64),
  PRIMARY KEY ("source_id", "json_pointer"),
  CHECK ((representation = 'string' AND run_count = 0) OR (representation = 'runs' AND run_count >= 1))
);
CREATE TABLE wiki_private."env_text_document_source_ref" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "reference" text NOT NULL,
  PRIMARY KEY ("source_id", "ordinal")
);
CREATE TABLE wiki_private."env_text_document_table_cell" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "node_pointer" text NOT NULL,
  "row_pointer" text,
  "cell_kind" text NOT NULL CHECK (cell_kind IN ('column', 'body')),
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "key_order" text NOT NULL,
  "cell_sha256" text NOT NULL CHECK (length(cell_sha256) = 64),
  PRIMARY KEY ("source_id", "json_pointer"),
  CHECK ((cell_kind = 'column' AND row_pointer IS NULL) OR (cell_kind = 'body' AND row_pointer IS NOT NULL))
);
CREATE TABLE wiki_private."env_text_document_table_row" (
  "source_id" bigint NOT NULL,
  "json_pointer" text NOT NULL,
  "node_pointer" text NOT NULL,
  "ordinal" bigint NOT NULL CHECK (ordinal >= 0),
  "cell_count" bigint NOT NULL CHECK (cell_count >= 1),
  "row_sha256" text NOT NULL CHECK (length(row_sha256) = 64),
  PRIMARY KEY ("source_id", "json_pointer"),
  UNIQUE (source_id, node_pointer, ordinal)
);
CREATE TABLE wiki_private."ev_evidence" (
  "identity" text NOT NULL CHECK(length(identity) > 0),
  "kind" text NOT NULL CHECK(kind IN ('ownerapproval', 'review', 'packet', 'baseline', 'registry', 'archive')),
  "logical_path" text NOT NULL,
  "revision" text NOT NULL CHECK(length(revision) > 0),
  "git_revision" text,
  "git_blob" text,
  "raw_bytes" bytea NOT NULL,
  "sha256" text NOT NULL CHECK(length(sha256) = 64 AND sha256 !~ '^.*[^0-9a-f].*$'),
  "byte_length" bigint NOT NULL CHECK(byte_length >= 0 AND byte_length = length(raw_bytes)),
  "record_sha256" text NOT NULL CHECK(length(record_sha256) = 64),
  PRIMARY KEY ("identity"),
  UNIQUE(identity, sha256)
);
CREATE TABLE wiki_private."ev_evidence_policy" (
  "singleton" bigint CHECK(singleton = 1),
  "privacy" text NOT NULL CHECK(privacy = 'restricted-internal-only'),
  PRIMARY KEY ("singleton")
);
CREATE TABLE wiki_private."ev_evidence_reference" (
  "source_identity" text NOT NULL,
  "type" text NOT NULL CHECK(length(type) > 0),
  "pointer" text NOT NULL,
  "target_identity" text NOT NULL,
  "expected_sha256" text NOT NULL CHECK(length(expected_sha256) = 64 AND expected_sha256 !~ '^.*[^0-9a-f].*$'),
  PRIMARY KEY ("source_identity", "type", "pointer", "target_identity")
);
RESET ROLE;
