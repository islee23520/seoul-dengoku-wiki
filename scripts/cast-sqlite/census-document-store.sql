-- Current operational census domain tables. No archives, JSON payloads, or EAV values.
CREATE TABLE census_document_import (document TEXT PRIMARY KEY, source_sha256 TEXT NOT NULL, document_sha256 TEXT NOT NULL, actor TEXT NOT NULL CHECK(length(trim(actor))>0), reason TEXT NOT NULL CHECK(length(trim(reason))>0)) STRICT;
CREATE TABLE census_binding (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "baseline_sha256" TEXT,
  "base_commit" TEXT,
  "identity_set_hashes_count" INTEGER CHECK("identity_set_hashes_count">=0 OR "identity_set_hashes_count" IS NULL),
  "task2_count" INTEGER CHECK("task2_count">=0 OR "task2_count" IS NULL)
) STRICT;
CREATE TABLE census_binding_identity_set_hashes (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "persons" TEXT,
  "titles" TEXT,
  "holdings" TEXT,
  "grants" TEXT,
  "bindings" TEXT,
  "states" TEXT,
  "polities" TEXT,
  "events" TEXT,
  "relations" TEXT,
  "courts" TEXT
) STRICT;
CREATE TABLE census_binding_task2 (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "merge_commit" TEXT,
  "reviewed_commit" TEXT,
  "geography_count" INTEGER CHECK("geography_count">=0 OR "geography_count" IS NULL),
  "spatial_count" INTEGER CHECK("spatial_count">=0 OR "spatial_count" IS NULL),
  "source_facts_count" INTEGER CHECK("source_facts_count">=0 OR "source_facts_count" IS NULL),
  "successor_count" INTEGER CHECK("successor_count">=0 OR "successor_count" IS NULL)
) STRICT;
CREATE TABLE census_binding_task2_geography (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT
) STRICT;
CREATE TABLE census_binding_task2_source_facts (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "membership_count" INTEGER CHECK("membership_count">=0 OR "membership_count" IS NULL),
  "census_count" INTEGER CHECK("census_count">=0 OR "census_count" IS NULL),
  "rights_count" INTEGER CHECK("rights_count">=0 OR "rights_count" IS NULL),
  "spatial_count" INTEGER CHECK("spatial_count">=0 OR "spatial_count" IS NULL)
) STRICT;
CREATE TABLE census_binding_task2_source_facts_census (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT
) STRICT;
CREATE TABLE census_binding_task2_source_facts_membership (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT
) STRICT;
CREATE TABLE census_binding_task2_source_facts_rights (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT
) STRICT;
CREATE TABLE census_binding_task2_source_facts_spatial (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT
) STRICT;
CREATE TABLE census_binding_task2_spatial (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "edition" TEXT,
  "base_date" TEXT,
  "authority" TEXT,
  "legal_survey_certification" INTEGER CHECK("legal_survey_certification" IN (0,1) OR "legal_survey_certification" IS NULL),
  "current2026_geometry" INTEGER CHECK("current2026_geometry" IN (0,1) OR "current2026_geometry" IS NULL),
  "geometry_count" INTEGER CHECK("geometry_count">=0 OR "geometry_count" IS NULL),
  "archive_sha256" TEXT
) STRICT;
CREATE TABLE census_binding_task2_spatial_geometry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT,
  "crs" TEXT,
  "features" INTEGER
) STRICT;
CREATE TABLE census_binding_task2_successor (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "schema" TEXT,
  "batch_id" TEXT,
  "previous_sha256" TEXT,
  "before_archive_path" TEXT,
  "proposal_count" INTEGER CHECK("proposal_count">=0 OR "proposal_count" IS NULL),
  "approval_count" INTEGER CHECK("approval_count">=0 OR "approval_count" IS NULL),
  "partition_sha256" TEXT,
  "cross_district_parent_policy" TEXT,
  "geography_count" INTEGER CHECK("geography_count">=0 OR "geography_count" IS NULL),
  "application_count" INTEGER CHECK("application_count">=0 OR "application_count" IS NULL),
  "independent_review_count" INTEGER CHECK("independent_review_count">=0 OR "independent_review_count" IS NULL)
) STRICT;
CREATE TABLE census_binding_task2_successor_application (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT
) STRICT;
CREATE TABLE census_binding_task2_successor_approval (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT
) STRICT;
CREATE TABLE census_binding_task2_successor_geography (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT
) STRICT;
CREATE TABLE census_binding_task2_successor_independent_review (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT,
  "scope" TEXT
) STRICT;
CREATE TABLE census_binding_task2_successor_proposal (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT
) STRICT;
CREATE TABLE census_ledger (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "schema" TEXT,
  "binding_count" INTEGER CHECK("binding_count">=0 OR "binding_count" IS NULL),
  "people_count" INTEGER CHECK("people_count">=0 OR "people_count" IS NULL),
  "original_rights_count" INTEGER CHECK("original_rights_count">=0 OR "original_rights_count" IS NULL),
  "card_occurrences_count" INTEGER CHECK("card_occurrences_count">=0 OR "card_occurrences_count" IS NULL),
  "candidate_identity_count" INTEGER CHECK("candidate_identity_count">=0 OR "candidate_identity_count" IS NULL),
  "dependency_dispositions_count" INTEGER CHECK("dependency_dispositions_count">=0 OR "dependency_dispositions_count" IS NULL),
  "profile_citation_dispositions_count" INTEGER CHECK("profile_citation_dispositions_count">=0 OR "profile_citation_dispositions_count" IS NULL),
  "local_provenance_dispositions_count" INTEGER CHECK("local_provenance_dispositions_count">=0 OR "local_provenance_dispositions_count" IS NULL),
  "connected_groups_count" INTEGER CHECK("connected_groups_count">=0 OR "connected_groups_count" IS NULL),
  "shared_source_groups_count" INTEGER CHECK("shared_source_groups_count">=0 OR "shared_source_groups_count" IS NULL),
  "source_file_ownership_count" INTEGER CHECK("source_file_ownership_count">=0 OR "source_file_ownership_count" IS NULL),
  "batches_count" INTEGER CHECK("batches_count">=0 OR "batches_count" IS NULL),
  "approvals_count" INTEGER CHECK("approvals_count">=0 OR "approvals_count" IS NULL)
) STRICT;
CREATE TABLE census_ledger_candidate_identity (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "source_path" TEXT,
  "source_sha256" TEXT,
  "existing_count" INTEGER CHECK("existing_count">=0 OR "existing_count" IS NULL),
  "candidates_count" INTEGER CHECK("candidates_count">=0 OR "candidates_count" IS NULL)
) STRICT;
CREATE TABLE census_ledger_candidate_identity_candidates_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "original_count" INTEGER CHECK("original_count">=0 OR "original_count" IS NULL),
  "issued_person_id" TEXT,
  "authority" TEXT
) STRICT;
CREATE TABLE census_ledger_candidate_identity_candidates_entry_original (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "ordinal" INTEGER,
  "name" TEXT,
  "stage" TEXT,
  "state" TEXT,
  "title" TEXT,
  "locked" INTEGER CHECK("locked" IN (0,1) OR "locked" IS NULL)
) STRICT;
CREATE TABLE census_ledger_candidate_identity_existing_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "original_count" INTEGER CHECK("original_count">=0 OR "original_count" IS NULL),
  "issued_person_id" TEXT
) STRICT;
CREATE TABLE census_ledger_candidate_identity_existing_entry_original (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "id" TEXT,
  "name" TEXT
) STRICT;
CREATE TABLE census_ledger_card_occurrences_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "source_path" TEXT,
  "json_pointer" TEXT,
  "anchor" TEXT,
  "locale" TEXT,
  "start_block" INTEGER,
  "end_block_exclusive" INTEGER,
  "person_ids_count" INTEGER CHECK("person_ids_count">=0 OR "person_ids_count" IS NULL),
  "original_sha256" TEXT,
  "original_key" TEXT,
  "current_hash" TEXT,
  "classification" TEXT,
  "review_status" TEXT
) STRICT;
CREATE TABLE census_ledger_card_occurrences_entry_person_ids (owner_address TEXT NOT NULL REFERENCES census_ledger_card_occurrences_entry(address), ordinal INTEGER NOT NULL CHECK(ordinal>=0), "person_ids" TEXT NOT NULL, PRIMARY KEY(owner_address,ordinal)) STRICT;
CREATE TABLE census_ledger_connected_groups_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "nodes_count" INTEGER CHECK("nodes_count">=0 OR "nodes_count" IS NULL),
  "person_ids_count" INTEGER CHECK("person_ids_count">=0 OR "person_ids_count" IS NULL)
) STRICT;
CREATE TABLE census_ledger_connected_groups_entry_nodes (owner_address TEXT NOT NULL REFERENCES census_ledger_connected_groups_entry(address), ordinal INTEGER NOT NULL CHECK(ordinal>=0), "nodes" TEXT NOT NULL, PRIMARY KEY(owner_address,ordinal)) STRICT;
CREATE TABLE census_ledger_connected_groups_entry_person_ids (owner_address TEXT NOT NULL REFERENCES census_ledger_connected_groups_entry(address), ordinal INTEGER NOT NULL CHECK(ordinal>=0), "person_ids" TEXT NOT NULL, PRIMARY KEY(owner_address,ordinal)) STRICT;
CREATE TABLE census_ledger_dependency_dispositions_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "key" TEXT,
  "original_count" INTEGER CHECK("original_count">=0 OR "original_count" IS NULL),
  "classification" TEXT,
  "vocabulary" TEXT,
  "status" TEXT,
  "reason" TEXT,
  "targets_count" INTEGER CHECK("targets_count">=0 OR "targets_count" IS NULL),
  "required" INTEGER CHECK("required" IN (0,1) OR "required" IS NULL),
  "review_status" TEXT,
  "claims_count" INTEGER CHECK("claims_count">=0 OR "claims_count" IS NULL)
) STRICT;
CREATE TABLE census_ledger_dependency_dispositions_entry_claims (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "person_id" TEXT,
  "dates_count" INTEGER CHECK("dates_count">=0 OR "dates_count" IS NULL),
  "parent_id" TEXT,
  "parent_anchors_count" INTEGER CHECK("parent_anchors_count">=0 OR "parent_anchors_count" IS NULL),
  "limitation" TEXT
) STRICT;
CREATE TABLE census_ledger_dependency_dispositions_entry_claims_parent_anchors (owner_address TEXT NOT NULL REFERENCES census_ledger_dependency_dispositions_entry_claims(address), ordinal INTEGER NOT NULL CHECK(ordinal>=0), "parent_anchors" TEXT NOT NULL, PRIMARY KEY(owner_address,ordinal)) STRICT;
CREATE TABLE census_ledger_dependency_dispositions_entry_claims_dates_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "person_id" TEXT,
  "birth_date" TEXT
) STRICT;
CREATE TABLE census_ledger_dependency_dispositions_entry_original (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "source_path" TEXT,
  "json_pointer" TEXT,
  "source_sha256" TEXT,
  "record_sha256" TEXT,
  "target" TEXT,
  "reason" TEXT,
  "review_status" TEXT
) STRICT;
CREATE TABLE census_ledger_dependency_dispositions_entry_targets_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "source_path" TEXT,
  "json_pointer" TEXT,
  "source_sha256" TEXT,
  "record_sha256" TEXT
) STRICT;
CREATE TABLE census_ledger_local_provenance_dispositions_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "key" TEXT,
  "original_count" INTEGER CHECK("original_count">=0 OR "original_count" IS NULL),
  "status" TEXT,
  "targets_count" INTEGER CHECK("targets_count">=0 OR "targets_count" IS NULL),
  "provenance_boundary_count" INTEGER CHECK("provenance_boundary_count">=0 OR "provenance_boundary_count" IS NULL),
  "required" INTEGER CHECK("required" IN (0,1) OR "required" IS NULL),
  "review_status" TEXT
) STRICT;
CREATE TABLE census_ledger_local_provenance_dispositions_entry_original (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "source_path" TEXT,
  "json_pointer" TEXT,
  "source_sha256" TEXT,
  "record_sha256" TEXT,
  "target" TEXT,
  "selector" TEXT,
  "vocabulary" TEXT,
  "reason" TEXT,
  "required" INTEGER CHECK("required" IN (0,1) OR "required" IS NULL),
  "review_status" TEXT
) STRICT;
CREATE TABLE census_ledger_local_provenance_dispositions_entry_provenance_boundary (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "kind" TEXT,
  "schema" TEXT,
  "current_fact_authority" INTEGER CHECK("current_fact_authority" IN (0,1) OR "current_fact_authority" IS NULL),
  "current_boundary" INTEGER CHECK("current_boundary" IN (0,1) OR "current_boundary" IS NULL),
  "targets_count" INTEGER CHECK("targets_count">=0 OR "targets_count" IS NULL),
  "boundary_sha256" TEXT,
  "repository" TEXT,
  "revision" TEXT,
  "canonical_path" TEXT,
  "current_runtime" INTEGER CHECK("current_runtime" IN (0,1) OR "current_runtime" IS NULL)
) STRICT;
CREATE TABLE census_ledger_local_provenance_dispositions_entry_provenance_boundary_targets_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "source_path" TEXT,
  "json_pointer" TEXT,
  "source_sha256" TEXT,
  "record_sha256" TEXT
) STRICT;
CREATE TABLE census_ledger_local_provenance_dispositions_entry_targets_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "source_path" TEXT,
  "json_pointer" TEXT,
  "source_sha256" TEXT,
  "record_sha256" TEXT
) STRICT;
CREATE TABLE census_ledger_original_rights_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "set" TEXT,
  "id" TEXT,
  "original_ref_count" INTEGER CHECK("original_ref_count">=0 OR "original_ref_count" IS NULL),
  "new_refs_count" INTEGER CHECK("new_refs_count">=0 OR "new_refs_count" IS NULL),
  "disposition" TEXT,
  "batch_id" TEXT,
  "approval_count" INTEGER CHECK("approval_count">=0 OR "approval_count" IS NULL)
) STRICT;
CREATE TABLE census_ledger_original_rights_entry_approval (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "kind" TEXT,
  "body_sha256" TEXT,
  "message_ref" TEXT,
  "authorization_sha256" TEXT
) STRICT;
CREATE TABLE census_ledger_original_rights_entry_new_refs_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "id" TEXT,
  "source_path" TEXT,
  "json_pointer" TEXT,
  "source_sha256" TEXT,
  "record_sha256" TEXT
) STRICT;
CREATE TABLE census_ledger_original_rights_entry_original_ref (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "id" TEXT,
  "source_path" TEXT,
  "json_pointer" TEXT,
  "source_sha256" TEXT,
  "record_sha256" TEXT
) STRICT;
CREATE TABLE census_ledger_people_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "person_id" TEXT,
  "batch_id" TEXT,
  "original_refs_count" INTEGER CHECK("original_refs_count">=0 OR "original_refs_count" IS NULL),
  "proposed_location_refs_count" INTEGER CHECK("proposed_location_refs_count">=0 OR "proposed_location_refs_count" IS NULL),
  "proposed_holding_refs_count" INTEGER CHECK("proposed_holding_refs_count">=0 OR "proposed_holding_refs_count" IS NULL),
  "title_changes_count" INTEGER CHECK("title_changes_count">=0 OR "title_changes_count" IS NULL),
  "narrative_changes_count" INTEGER CHECK("narrative_changes_count">=0 OR "narrative_changes_count" IS NULL),
  "preserved_facts_count" INTEGER CHECK("preserved_facts_count">=0 OR "preserved_facts_count" IS NULL),
  "changed_facts_count" INTEGER CHECK("changed_facts_count">=0 OR "changed_facts_count" IS NULL),
  "status" TEXT,
  "approval" TEXT,
  "inventory_count" INTEGER CHECK("inventory_count">=0 OR "inventory_count" IS NULL),
  "approvals_count" INTEGER CHECK("approvals_count">=0 OR "approvals_count" IS NULL)
) STRICT;
CREATE TABLE census_ledger_people_entry_approvals_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "kind" TEXT,
  "body_sha256" TEXT,
  "message_ref" TEXT
) STRICT;
CREATE TABLE census_ledger_people_entry_inventory (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "issued_count" INTEGER CHECK("issued_count">=0 OR "issued_count" IS NULL),
  "card_keys_count" INTEGER CHECK("card_keys_count">=0 OR "card_keys_count" IS NULL),
  "primary_card_count" INTEGER CHECK("primary_card_count">=0 OR "primary_card_count" IS NULL),
  "birthday_count" INTEGER CHECK("birthday_count">=0 OR "birthday_count" IS NULL),
  "original_values_count" INTEGER CHECK("original_values_count">=0 OR "original_values_count" IS NULL),
  "public_route" TEXT,
  "protection_status" TEXT
) STRICT;
CREATE TABLE census_ledger_people_entry_inventory_card_keys (owner_address TEXT NOT NULL REFERENCES census_ledger_people_entry_inventory(address), ordinal INTEGER NOT NULL CHECK(ordinal>=0), "card_keys" TEXT NOT NULL, PRIMARY KEY(owner_address,ordinal)) STRICT;
CREATE TABLE census_ledger_people_entry_inventory_birthday (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "id" TEXT,
  "name" TEXT,
  "birth_date" TEXT,
  "source_status" TEXT,
  "source_refs_count" INTEGER CHECK("source_refs_count">=0 OR "source_refs_count" IS NULL)
) STRICT;
CREATE TABLE census_ledger_people_entry_inventory_birthday_source_refs (owner_address TEXT NOT NULL REFERENCES census_ledger_people_entry_inventory_birthday(address), ordinal INTEGER NOT NULL CHECK(ordinal>=0), "source_refs" TEXT NOT NULL, PRIMARY KEY(owner_address,ordinal)) STRICT;
CREATE TABLE census_ledger_people_entry_inventory_issued (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "id" TEXT,
  "name" TEXT,
  "aliases_count" INTEGER CHECK("aliases_count">=0 OR "aliases_count" IS NULL)
) STRICT;
CREATE TABLE census_ledger_people_entry_inventory_issued_aliases (owner_address TEXT NOT NULL REFERENCES census_ledger_people_entry_inventory_issued(address), ordinal INTEGER NOT NULL CHECK(ordinal>=0), "aliases" TEXT NOT NULL, PRIMARY KEY(owner_address,ordinal)) STRICT;
CREATE TABLE census_ledger_people_entry_inventory_original_values (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "name" TEXT,
  "title" TEXT,
  "stage" TEXT,
  "state" TEXT,
  "state_name" TEXT,
  "generation" TEXT,
  "source" TEXT,
  "minors" INTEGER CHECK("minors" IN (0,1) OR "minors" IS NULL),
  "values_count" INTEGER CHECK("values_count">=0 OR "values_count" IS NULL),
  "desire_count" INTEGER CHECK("desire_count">=0 OR "desire_count" IS NULL),
  "locked" INTEGER CHECK("locked" IN (0,1) OR "locked" IS NULL)
) STRICT;
CREATE TABLE census_ledger_people_entry_inventory_original_values_desire (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "갈망" INTEGER,
  "독점" INTEGER,
  "위험" INTEGER,
  "과시" INTEGER,
  "지속" INTEGER,
  "지향" TEXT,
  "결합" TEXT
) STRICT;
CREATE TABLE census_ledger_people_entry_inventory_original_values_values (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "권위" INTEGER,
  "개방" INTEGER,
  "무력" INTEGER,
  "물질" INTEGER,
  "공동" INTEGER,
  "원칙" INTEGER,
  "공개" INTEGER,
  "자격" INTEGER,
  "분산" INTEGER,
  "변혁" INTEGER
) STRICT;
CREATE TABLE census_ledger_people_entry_inventory_primary_card (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "person_id" TEXT,
  "selected_count" INTEGER CHECK("selected_count">=0 OR "selected_count" IS NULL),
  "reason" TEXT,
  "candidates_count" INTEGER CHECK("candidates_count">=0 OR "candidates_count" IS NULL)
) STRICT;
CREATE TABLE census_ledger_people_entry_inventory_primary_card_candidates_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "source_path" TEXT,
  "anchor" TEXT,
  "heading" TEXT,
  "encounter_order" INTEGER,
  "length" INTEGER,
  "body_sha256" TEXT,
  "primary" INTEGER CHECK("primary" IN (0,1) OR "primary" IS NULL)
) STRICT;
CREATE TABLE census_ledger_people_entry_inventory_primary_card_selected (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "source_path" TEXT,
  "anchor" TEXT,
  "heading" TEXT,
  "encounter_order" INTEGER,
  "length" INTEGER,
  "body_sha256" TEXT,
  "primary" INTEGER CHECK("primary" IN (0,1) OR "primary" IS NULL)
) STRICT;
CREATE TABLE census_ledger_people_entry_original_refs_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "id" TEXT,
  "source_path" TEXT,
  "json_pointer" TEXT,
  "source_sha256" TEXT,
  "record_sha256" TEXT
) STRICT;
CREATE TABLE census_ledger_profile_citation_dispositions_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "key" TEXT,
  "original_count" INTEGER CHECK("original_count">=0 OR "original_count" IS NULL),
  "status" TEXT,
  "targets_count" INTEGER CHECK("targets_count">=0 OR "targets_count" IS NULL),
  "citation_boundary_count" INTEGER CHECK("citation_boundary_count">=0 OR "citation_boundary_count" IS NULL),
  "required" INTEGER CHECK("required" IN (0,1) OR "required" IS NULL),
  "review_status" TEXT
) STRICT;
CREATE TABLE census_ledger_profile_citation_dispositions_entry_citation_boundary (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "kind" TEXT,
  "candidate" TEXT,
  "additional_anchors_count" INTEGER CHECK("additional_anchors_count">=0 OR "additional_anchors_count" IS NULL),
  "corroboration_count" INTEGER CHECK("corroboration_count">=0 OR "corroboration_count" IS NULL),
  "targets_count" INTEGER CHECK("targets_count">=0 OR "targets_count" IS NULL)
) STRICT;
CREATE TABLE census_ledger_profile_citation_dispositions_entry_citation_boundary_additional_anchors (owner_address TEXT NOT NULL REFERENCES census_ledger_profile_citation_dispositions_entry_citation_boundary(address), ordinal INTEGER NOT NULL CHECK(ordinal>=0), "additional_anchors" TEXT NOT NULL, PRIMARY KEY(owner_address,ordinal)) STRICT;
CREATE TABLE census_ledger_profile_citation_dispositions_entry_citation_boundary_corroboration (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "source_path" TEXT,
  "json_pointer" TEXT,
  "source_sha256" TEXT,
  "record_sha256" TEXT
) STRICT;
CREATE TABLE census_ledger_profile_citation_dispositions_entry_citation_boundary_targets_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "source_path" TEXT,
  "json_pointer" TEXT,
  "source_sha256" TEXT,
  "record_sha256" TEXT
) STRICT;
CREATE TABLE census_ledger_profile_citation_dispositions_entry_original (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "source_path" TEXT,
  "json_pointer" TEXT,
  "source_sha256" TEXT,
  "record_sha256" TEXT,
  "target" TEXT,
  "selector" TEXT,
  "vocabulary" TEXT,
  "reason" TEXT,
  "required" INTEGER CHECK("required" IN (0,1) OR "required" IS NULL),
  "review_status" TEXT
) STRICT;
CREATE TABLE census_ledger_profile_citation_dispositions_entry_targets_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "source_path" TEXT,
  "json_pointer" TEXT,
  "source_sha256" TEXT,
  "record_sha256" TEXT
) STRICT;
CREATE TABLE census_ledger_shared_source_groups_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "nodes_count" INTEGER CHECK("nodes_count">=0 OR "nodes_count" IS NULL),
  "person_ids_count" INTEGER CHECK("person_ids_count">=0 OR "person_ids_count" IS NULL)
) STRICT;
CREATE TABLE census_ledger_shared_source_groups_entry_nodes (owner_address TEXT NOT NULL REFERENCES census_ledger_shared_source_groups_entry(address), ordinal INTEGER NOT NULL CHECK(ordinal>=0), "nodes" TEXT NOT NULL, PRIMARY KEY(owner_address,ordinal)) STRICT;
CREATE TABLE census_ledger_shared_source_groups_entry_person_ids (owner_address TEXT NOT NULL REFERENCES census_ledger_shared_source_groups_entry(address), ordinal INTEGER NOT NULL CHECK(ordinal>=0), "person_ids" TEXT NOT NULL, PRIMARY KEY(owner_address,ordinal)) STRICT;
CREATE TABLE census_ledger_source_file_ownership_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "source_path" TEXT,
  "writer" TEXT,
  "batch_id" TEXT,
  "application" TEXT,
  "dependency_node" TEXT
) STRICT;
CREATE TABLE census_review (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "schema" TEXT,
  "binding_count" INTEGER CHECK("binding_count">=0 OR "binding_count" IS NULL),
  "documents_count" INTEGER CHECK("documents_count">=0 OR "documents_count" IS NULL),
  "preservation_inventory_count" INTEGER CHECK("preservation_inventory_count">=0 OR "preservation_inventory_count" IS NULL),
  "occurrence_storage_count" INTEGER CHECK("occurrence_storage_count">=0 OR "occurrence_storage_count" IS NULL),
  "mapping_count" INTEGER CHECK("mapping_count">=0 OR "mapping_count" IS NULL),
  "dependency_inventory_count" INTEGER CHECK("dependency_inventory_count">=0 OR "dependency_inventory_count" IS NULL),
  "dependency_triage_count" INTEGER CHECK("dependency_triage_count">=0 OR "dependency_triage_count" IS NULL),
  "receipts_count" INTEGER CHECK("receipts_count">=0 OR "receipts_count" IS NULL),
  "approvals_count" INTEGER CHECK("approvals_count">=0 OR "approvals_count" IS NULL),
  "samples_count" INTEGER CHECK("samples_count">=0 OR "samples_count" IS NULL),
  "review_status" TEXT
) STRICT;
CREATE TABLE census_review_dependency_inventory (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT,
  "payload_sha256" TEXT,
  "encoding" TEXT
) STRICT;
CREATE TABLE census_review_dependency_triage (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT
) STRICT;
CREATE TABLE census_review_documents_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "source_path" TEXT,
  "source_id" TEXT,
  "slug" TEXT,
  "source_status" TEXT,
  "source_kind" TEXT,
  "original_sha256" TEXT,
  "current_sha256" TEXT,
  "classification" TEXT,
  "disposition" TEXT,
  "revised_by_batch" TEXT,
  "reviewed_at" TEXT,
  "receipt_count" INTEGER CHECK("receipt_count">=0 OR "receipt_count" IS NULL),
  "extraction" TEXT,
  "semantic_review" TEXT,
  "locales_count" INTEGER CHECK("locales_count">=0 OR "locales_count" IS NULL),
  "original_index_count" INTEGER CHECK("original_index_count">=0 OR "original_index_count" IS NULL),
  "current_index_count" INTEGER CHECK("current_index_count">=0 OR "current_index_count" IS NULL)
) STRICT;
CREATE TABLE census_review_documents_entry_locales (owner_address TEXT NOT NULL REFERENCES census_review_documents_entry(address), ordinal INTEGER NOT NULL CHECK(ordinal>=0), "locales" TEXT NOT NULL, PRIMARY KEY(owner_address,ordinal)) STRICT;
CREATE TABLE census_review_documents_entry_current_index_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "source_path" TEXT,
  "category" TEXT,
  "count" INTEGER,
  "sha256" TEXT
) STRICT;
CREATE TABLE census_review_documents_entry_original_index_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "source_path" TEXT,
  "category" TEXT,
  "count" INTEGER,
  "sha256" TEXT
) STRICT;
CREATE TABLE census_review_documents_entry_receipt (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT,
  "approval_ref" TEXT,
  "evidence_path" TEXT,
  "evidence_sha256" TEXT,
  "scope" TEXT,
  "semantic_review" TEXT
) STRICT;
CREATE TABLE census_review_mapping (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "unchanged_rule" TEXT,
  "exceptions_count" INTEGER CHECK("exceptions_count">=0 OR "exceptions_count" IS NULL)
) STRICT;
CREATE TABLE census_review_mapping_exceptions_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "category" TEXT,
  "original_keys_count" INTEGER CHECK("original_keys_count">=0 OR "original_keys_count" IS NULL),
  "current_keys_count" INTEGER CHECK("current_keys_count">=0 OR "current_keys_count" IS NULL),
  "disposition" TEXT,
  "evidence" TEXT,
  "review_status" TEXT
) STRICT;
CREATE TABLE census_review_mapping_exceptions_entry_original_keys (owner_address TEXT NOT NULL REFERENCES census_review_mapping_exceptions_entry(address), ordinal INTEGER NOT NULL CHECK(ordinal>=0), "original_keys" TEXT NOT NULL, PRIMARY KEY(owner_address,ordinal)) STRICT;
CREATE TABLE census_review_mapping_exceptions_entry_current_keys (owner_address TEXT NOT NULL REFERENCES census_review_mapping_exceptions_entry(address), ordinal INTEGER NOT NULL CHECK(ordinal>=0), "current_keys" TEXT NOT NULL, PRIMARY KEY(owner_address,ordinal)) STRICT;
CREATE TABLE census_review_occurrence_storage (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "original_count" INTEGER CHECK("original_count">=0 OR "original_count" IS NULL),
  "markdown_spans_count" INTEGER CHECK("markdown_spans_count">=0 OR "markdown_spans_count" IS NULL),
  "identity_occurrences_count" INTEGER CHECK("identity_occurrences_count">=0 OR "identity_occurrences_count" IS NULL),
  "key_formula" TEXT,
  "index_formula" TEXT,
  "current_storage" TEXT
) STRICT;
CREATE TABLE census_review_occurrence_storage_identity_occurrences (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "count" INTEGER,
  "sha256" TEXT
) STRICT;
CREATE TABLE census_review_occurrence_storage_markdown_spans (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT
) STRICT;
CREATE TABLE census_review_occurrence_storage_original (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "schema" TEXT,
  "columns_count" INTEGER CHECK("columns_count">=0 OR "columns_count" IS NULL),
  "encoding" TEXT,
  "chunks_count" INTEGER CHECK("chunks_count">=0 OR "chunks_count" IS NULL),
  "payload_sha256" TEXT,
  "gzip_sha256" TEXT,
  "payload_bytes" INTEGER,
  "coverage_key_formula" TEXT,
  "card_bodies_count" INTEGER CHECK("card_bodies_count">=0 OR "card_bodies_count" IS NULL),
  "card_supplement_count" INTEGER CHECK("card_supplement_count">=0 OR "card_supplement_count" IS NULL),
  "issued_identity_map_count" INTEGER CHECK("issued_identity_map_count">=0 OR "issued_identity_map_count" IS NULL)
) STRICT;
CREATE TABLE census_review_occurrence_storage_original_columns (owner_address TEXT NOT NULL REFERENCES census_review_occurrence_storage_original(address), ordinal INTEGER NOT NULL CHECK(ordinal>=0), "columns" TEXT NOT NULL, PRIMARY KEY(owner_address,ordinal)) STRICT;
CREATE TABLE census_review_occurrence_storage_original_card_bodies (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT
) STRICT;
CREATE TABLE census_review_occurrence_storage_original_card_supplement (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT
) STRICT;
CREATE TABLE census_review_occurrence_storage_original_chunks_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT,
  "index" INTEGER
) STRICT;
CREATE TABLE census_review_occurrence_storage_original_issued_identity_map (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT
) STRICT;
CREATE TABLE census_review_preservation_inventory_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "path" TEXT,
  "sha256" TEXT,
  "bytes" INTEGER,
  "kind" TEXT,
  "classification" TEXT,
  "binding" TEXT,
  "admission" TEXT,
  "review_status" TEXT
) STRICT;
CREATE TABLE census_review_receipts_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "schema" TEXT,
  "evidence_path" TEXT,
  "evidence_sha256" TEXT,
  "reviewed_at" TEXT,
  "documents_count" INTEGER CHECK("documents_count">=0 OR "documents_count" IS NULL)
) STRICT;
CREATE TABLE census_review_receipts_entry_documents_entry (
  address TEXT PRIMARY KEY,
  key_variant INTEGER NOT NULL CHECK(key_variant>=0),
  "source_path" TEXT,
  "current_sha256" TEXT,
  "card_occurrences" INTEGER,
  "approval_ref" TEXT
) STRICT;
