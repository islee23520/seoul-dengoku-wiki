-- Bounded full-source state-formation contract. Named typed columns only.
-- No source archive, generic EAV rows, or JSON value/document blobs.
CREATE TABLE state_formation_document_document (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1),
  source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64),
  document_sha256 TEXT NOT NULL CHECK (length(document_sha256) = 64),
  schema TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  independent_acquisition_creates_state INTEGER NOT NULL CHECK (independent_acquisition_creates_state IN (0, 1)),
  grant_requires_prior_membership INTEGER NOT NULL CHECK (grant_requires_prior_membership IN (0, 1)),
  territorial_control_is_personal_holding INTEGER NOT NULL CHECK (territorial_control_is_personal_holding IN (0, 1)),
  state_registry TEXT NOT NULL,
  membership_registry TEXT NOT NULL,
  personal_holding_registry TEXT NOT NULL,
  rule_source TEXT NOT NULL,
  clause TEXT NOT NULL,
  storage_relationship TEXT NOT NULL,
  historical_count INTEGER NOT NULL,
  historical_range TEXT NOT NULL,
  historical_approval_ref TEXT NOT NULL,
  centers_confer_exclusive_geographic_ownership INTEGER NOT NULL CHECK (centers_confer_exclusive_geographic_ownership IN (0, 1)),
  geographic_partition_count INTEGER NOT NULL,
  geographic_ownership_determined_by_this_contract INTEGER NOT NULL CHECK (geographic_ownership_determined_by_this_contract IN (0, 1)),
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  receipt_sha256 TEXT NOT NULL CHECK (length(receipt_sha256) = 64)
) STRICT;

CREATE TABLE state_formation_document_key (
  object_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  key TEXT NOT NULL,
  PRIMARY KEY (object_path, ordinal)
) STRICT;

CREATE TABLE state_formation_document_prerequisite (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  id TEXT NOT NULL,
  status TEXT NOT NULL,
  source_present INTEGER NOT NULL CHECK (source_present IN (0, 1)),
  source_repository TEXT,
  source_path TEXT,
  source_pointer TEXT,
  source_sha256 TEXT,
  approval_ref TEXT,
  reason TEXT,
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
) STRICT;

CREATE TABLE state_formation_document_faction (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  name TEXT NOT NULL,
  center_region TEXT NOT NULL
) STRICT;

CREATE TABLE state_formation_document_identity (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  sovereign_person_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  rank TEXT NOT NULL,
  confers_whole_geographic_kingdom_ownership INTEGER NOT NULL CHECK (confers_whole_geographic_kingdom_ownership IN (0, 1)),
  approval_ref TEXT NOT NULL
) STRICT;
