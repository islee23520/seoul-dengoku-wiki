-- Explicit supplemental import; not part of the canonical schema initializer.
CREATE TABLE issued_sheet_import (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64),
  people_sha256 TEXT NOT NULL CHECK(length(people_sha256)=64),
  profile_count INTEGER NOT NULL CHECK(profile_count=1022),
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0)
) STRICT;
CREATE TABLE issued_sheet_evidence_annotation (
  evidence_id TEXT PRIMARY KEY REFERENCES evidence(evidence_id),
  interpretation TEXT,
  provenance_note TEXT,
  CHECK(interpretation IS NOT NULL OR provenance_note IS NOT NULL)
) STRICT;
-- Metadata contains keys and presence only, never domain values or JSON text.
CREATE TABLE issued_sheet_object_key (
  person_id TEXT NOT NULL REFERENCES gurps_profile(person_id),
  object_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  key TEXT NOT NULL,
  is_null INTEGER NOT NULL CHECK(is_null IN (0,1)),
  PRIMARY KEY(person_id,object_path,ordinal),
  UNIQUE(person_id,object_path,key)
) STRICT;
