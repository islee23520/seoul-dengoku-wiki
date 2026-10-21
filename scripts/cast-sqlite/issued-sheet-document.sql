-- Explicit envelope supplement; never applied by a runtime reader.
CREATE TABLE issued_sheet_document_import (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64),
  document_sha256 TEXT NOT NULL CHECK(length(document_sha256)=64),
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0)
) STRICT;
CREATE TABLE issued_sheet_document_envelope (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  schema_name TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT NOT NULL,
  person_count INTEGER NOT NULL,
  classification TEXT NOT NULL,
  issued_sheet_lineage TEXT NOT NULL,
  review_status TEXT NOT NULL,
  historical_allocation_layer TEXT NOT NULL,
  publication_receipt TEXT NOT NULL,
  active_seoul_projection TEXT NOT NULL,
  values_cast_sha256 TEXT NOT NULL,
  person_registry_sha256 TEXT NOT NULL
) STRICT;
CREATE TABLE issued_sheet_document_rules (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  edition TEXT NOT NULL,
  contract TEXT NOT NULL,
  st_cost INTEGER NOT NULL,
  dx_cost INTEGER NOT NULL,
  iq_cost INTEGER NOT NULL,
  ht_cost INTEGER NOT NULL,
  ability_base INTEGER NOT NULL,
  per_action_sentence INTEGER NOT NULL,
  ability_cap INTEGER NOT NULL,
  per_and_will_count_as TEXT NOT NULL,
  skill_cost_table TEXT NOT NULL,
  difficulty_e INTEGER NOT NULL,
  difficulty_a INTEGER NOT NULL,
  difficulty_h INTEGER NOT NULL,
  difficulty_vh INTEGER NOT NULL,
  tier_a INTEGER NOT NULL,
  tier_b INTEGER NOT NULL,
  tier_c INTEGER NOT NULL,
  tier_d INTEGER NOT NULL,
  unspent_floor INTEGER NOT NULL,
  unspent_rule TEXT NOT NULL,
  owner_k1004 TEXT NOT NULL,
  owner_rule TEXT NOT NULL,
  same_event_rule TEXT NOT NULL,
  same_event_status TEXT NOT NULL,
  leader_review_status TEXT NOT NULL,
  languages TEXT NOT NULL,
  trait_reputation TEXT NOT NULL,
  trait_combat_reflexes TEXT NOT NULL,
  trait_disadvantages TEXT NOT NULL,
  tl TEXT NOT NULL
) STRICT;
CREATE TABLE issued_sheet_document_band (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  name TEXT NOT NULL, min INTEGER NOT NULL, max INTEGER NOT NULL
) STRICT;
CREATE TABLE issued_sheet_document_leader_review (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  person_id TEXT NOT NULL UNIQUE REFERENCES gurps_profile(person_id),
  question TEXT NOT NULL, choice TEXT NOT NULL
) STRICT;
-- Keys and order only; no scalar domain values or serialized objects.
CREATE TABLE issued_sheet_document_key (
  object_path TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0), key TEXT NOT NULL,
  PRIMARY KEY(object_path,ordinal), UNIQUE(object_path,key)
) STRICT;
