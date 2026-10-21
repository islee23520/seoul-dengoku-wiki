-- Source bytes are immutable evidence only; runtime authority is the named tables.
CREATE TABLE permission_archive (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1), bytes BLOB NOT NULL,
  sha256 TEXT NOT NULL CHECK(length(sha256)=64),
  actor TEXT NOT NULL CHECK(length(trim(actor))>0), reason TEXT NOT NULL CHECK(length(trim(reason))>0)
) STRICT;
CREATE TABLE permission_metadata (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  schema TEXT NOT NULL CHECK(schema='person-rights-permissions.v1')
) STRICT;
CREATE TABLE permission_person (
  person_id TEXT PRIMARY KEY REFERENCES person(person_id), ordinal INTEGER NOT NULL UNIQUE CHECK(ordinal>=0),
  applicability TEXT NOT NULL CHECK(applicability='real-person'), identity_basis_ref TEXT NOT NULL,
  external_reuse_requires_separate_subject_permission INTEGER NOT NULL CHECK(external_reuse_requires_separate_subject_permission=1)
) STRICT;
CREATE TABLE permission_scope (
  person_id TEXT NOT NULL REFERENCES permission_person(person_id),
  scope TEXT NOT NULL CHECK(scope IN ('nameUse','likenessUse')),
  is_null INTEGER NOT NULL CHECK(is_null IN (0,1)),
  status TEXT CHECK(status IN ('not-recorded','granted','revoked','declined')),
  date TEXT, recorded_on TEXT, evidence_ref TEXT,
  has_prior_licenses INTEGER NOT NULL CHECK(has_prior_licenses IN (0,1)),
  PRIMARY KEY(person_id,scope),
  CHECK((is_null=0 AND status IS NOT NULL) OR
    (is_null=1 AND status IS NULL AND date IS NULL AND recorded_on IS NULL AND evidence_ref IS NULL AND has_prior_licenses=0))
) STRICT;
CREATE TABLE permission_use (
  person_id TEXT NOT NULL, scope TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  use TEXT NOT NULL CHECK(use IN ('wiki-display','game-use','commercial-use')),
  PRIMARY KEY(person_id,scope,ordinal), UNIQUE(person_id,scope,use),
  FOREIGN KEY(person_id,scope) REFERENCES permission_scope(person_id,scope)
) STRICT;
CREATE TABLE permission_prior_license (
  person_id TEXT NOT NULL, scope TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  source_ref TEXT NOT NULL, license_ref TEXT NOT NULL, conditions_ref TEXT NOT NULL,
  PRIMARY KEY(person_id,scope,ordinal),
  FOREIGN KEY(person_id,scope) REFERENCES permission_scope(person_id,scope)
) STRICT;
CREATE TABLE permission_seal (singleton INTEGER PRIMARY KEY CHECK(singleton=1)) STRICT;
