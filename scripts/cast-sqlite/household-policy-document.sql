-- Bounded full-source household policy. No source archive or generic value rows.
CREATE TABLE household_policy_document (
  document_id INTEGER PRIMARY KEY CHECK(document_id=1),
  source_sha256 TEXT NOT NULL,
  schema TEXT NOT NULL,
  approval_ref TEXT NOT NULL,
  counts TEXT NOT NULL,
  tier_quotas TEXT CHECK(tier_quotas IS NULL),
  faith_evidence TEXT NOT NULL,
  unknown_orientation TEXT NOT NULL,
  other_known_orientation_gender TEXT NOT NULL,
  existing_gender TEXT NOT NULL,
  facility_custody TEXT NOT NULL,
  seed_key TEXT NOT NULL,
  sexual_relationship TEXT NOT NULL,
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0),
  receipt_sha256 TEXT NOT NULL
) STRICT;
CREATE TABLE household_policy_source_ref (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  path TEXT NOT NULL,
  anchor TEXT NOT NULL
) STRICT;
CREATE TABLE household_policy_faith_state (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  faith_state TEXT NOT NULL
) STRICT;
CREATE TABLE household_policy_priority (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  priority TEXT NOT NULL
) STRICT;
CREATE TABLE household_policy_known_orientation (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  orientation TEXT NOT NULL
) STRICT;
CREATE TABLE household_policy_position_context (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  entity_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,
  current_scope TEXT NOT NULL,
  rights_basis_path TEXT NOT NULL,
  rights_basis_json_pointer TEXT NOT NULL,
  rights_basis_approval_ref TEXT NOT NULL,
  rights_limit TEXT NOT NULL
) STRICT;
CREATE TABLE household_policy_position (
  ordinal INTEGER PRIMARY KEY CHECK(ordinal>=0),
  entity_key TEXT NOT NULL UNIQUE,
  position TEXT NOT NULL
) STRICT;
