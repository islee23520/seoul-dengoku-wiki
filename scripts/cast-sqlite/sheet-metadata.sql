CREATE TABLE issued_preservation_metadata (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1), schema_name TEXT NOT NULL,
  baseline_manifest_sha256 TEXT NOT NULL, rules_version TEXT NOT NULL,
  numeric_adoption INTEGER NOT NULL CHECK(numeric_adoption=0)
) STRICT;
CREATE TABLE person_sheet_name_change (
  character_id TEXT PRIMARY KEY REFERENCES person(person_id), ordinal INTEGER NOT NULL UNIQUE,
  person_id TEXT NOT NULL, historical_name TEXT NOT NULL, current_name TEXT NOT NULL,
  source_revision TEXT NOT NULL, source_path TEXT NOT NULL, approval_ref TEXT NOT NULL
) STRICT;
