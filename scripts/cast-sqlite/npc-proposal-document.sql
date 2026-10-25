-- Bounded preservation of lore/name-pools/settlement-npc-generator.json.
-- Named typed columns and ordered child rows only. Key tables store object key order, never values.
-- Loading this legacy proposal does not generate people, activate rules, or grant approval.
CREATE TABLE npc_proposal_document_import (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1),
  source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64),
  document_sha256 TEXT NOT NULL CHECK (length(document_sha256) = 64),
  row_sha256 TEXT NOT NULL CHECK (length(row_sha256) = 64),
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  receipt_sha256 TEXT NOT NULL CHECK (length(receipt_sha256) = 64)
) STRICT;

CREATE TABLE npc_proposal_document_root (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1) REFERENCES npc_proposal_document_import(document_id),
  schema TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT NOT NULL,
  rules_owner TEXT NOT NULL
) STRICT;

CREATE TABLE npc_proposal_document_decision (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1) REFERENCES npc_proposal_document_root(document_id),
  population TEXT NOT NULL,
  livelihood TEXT NOT NULL,
  training TEXT NOT NULL,
  parameters TEXT NOT NULL
) STRICT;

CREATE TABLE npc_proposal_document_generation (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1) REFERENCES npc_proposal_document_root(document_id),
  trigger TEXT NOT NULL,
  proportion TEXT NOT NULL,
  min_per_settlement INTEGER NOT NULL,
  min_per_settlement_text TEXT NOT NULL,
  max_per_settlement INTEGER NOT NULL,
  max_per_settlement_text TEXT NOT NULL,
  seed TEXT NOT NULL
) STRICT;

CREATE TABLE npc_proposal_document_field (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1) REFERENCES npc_proposal_document_root(document_id),
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  age TEXT NOT NULL,
  state TEXT NOT NULL,
  settlement TEXT NOT NULL,
  occupation TEXT NOT NULL,
  attributes TEXT NOT NULL,
  cp TEXT NOT NULL,
  martial TEXT NOT NULL,
  unit_eligibility TEXT NOT NULL
) STRICT;

CREATE TABLE npc_proposal_document_pool (
  pool_key TEXT PRIMARY KEY,
  ordinal INTEGER NOT NULL UNIQUE CHECK (ordinal >= 0)
) STRICT;

CREATE TABLE npc_proposal_document_pool_item (
  pool_key TEXT NOT NULL REFERENCES npc_proposal_document_pool(pool_key),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  label TEXT NOT NULL,
  PRIMARY KEY (pool_key, ordinal)
) STRICT;

CREATE TABLE npc_proposal_document_martial (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1) REFERENCES npc_proposal_document_root(document_id),
  probability TEXT NOT NULL,
  level TEXT NOT NULL
) STRICT;

CREATE TABLE npc_proposal_document_occupation (
  occupation_key TEXT PRIMARY KEY,
  ordinal INTEGER NOT NULL UNIQUE CHECK (ordinal >= 0)
) STRICT;

CREATE TABLE npc_proposal_document_style (
  occupation_key TEXT NOT NULL REFERENCES npc_proposal_document_occupation(occupation_key),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  label TEXT NOT NULL,
  PRIMARY KEY (occupation_key, ordinal)
) STRICT;

CREATE TABLE npc_proposal_document_eligibility (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1) REFERENCES npc_proposal_document_root(document_id),
  description TEXT NOT NULL,
  match_rule TEXT NOT NULL
) STRICT;

CREATE TABLE npc_proposal_document_check_field (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  field_name TEXT NOT NULL
) STRICT;

CREATE TABLE npc_proposal_document_wandering (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1) REFERENCES npc_proposal_document_root(document_id),
  description TEXT NOT NULL,
  probability REAL NOT NULL,
  probability_text TEXT NOT NULL,
  camp TEXT NOT NULL
) STRICT;

CREATE TABLE npc_proposal_document_reason (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  label TEXT NOT NULL
) STRICT;

CREATE TABLE npc_proposal_document_settlement (
  settlement_key TEXT PRIMARY KEY,
  ordinal INTEGER NOT NULL UNIQUE CHECK (ordinal >= 0),
  pop_range TEXT NOT NULL,
  npc_multiplier REAL NOT NULL,
  npc_multiplier_text TEXT NOT NULL,
  occupations TEXT NOT NULL
) STRICT;

CREATE TABLE npc_proposal_document_endpoint (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1) REFERENCES npc_proposal_document_root(document_id),
  generate TEXT NOT NULL
) STRICT;

CREATE TABLE npc_proposal_document_param (
  param_key TEXT PRIMARY KEY,
  ordinal INTEGER NOT NULL UNIQUE CHECK (ordinal >= 0),
  body TEXT NOT NULL
) STRICT;

CREATE TABLE npc_proposal_document_response (
  response_key TEXT PRIMARY KEY,
  ordinal INTEGER NOT NULL UNIQUE CHECK (ordinal >= 0),
  body TEXT NOT NULL
) STRICT;

-- Keys only: object_path + ordinal + key. Domain values never live here.
CREATE TABLE npc_proposal_document_key (
  object_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  key TEXT NOT NULL,
  PRIMARY KEY (object_path, ordinal),
  UNIQUE (object_path, key)
) STRICT;
