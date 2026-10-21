-- Private typed snapshot of Opening-Profile-Sample.json. Named typed columns, ordered relations, presence flags only.
-- No EAV, no JSON blobs, no public wiring, no fact changes. Distinct from soul-candidate and store.
CREATE TABLE opening_sample_documents_import (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  initialized_at TEXT NOT NULL
) STRICT;

CREATE TABLE opening_sample_documents_source (
  logical_path TEXT PRIMARY KEY NOT NULL,
  source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64),
  document_sha256 TEXT NOT NULL CHECK (length(document_sha256) = 64),
  byte_length INTEGER NOT NULL CHECK (byte_length >= 0)
) STRICT;

CREATE TABLE opening_sample_documents_archive (
  logical_path TEXT PRIMARY KEY NOT NULL REFERENCES opening_sample_documents_source(logical_path),
  source_sha256 TEXT NOT NULL,
  raw_bytes BLOB NOT NULL
) STRICT;
CREATE TRIGGER opening_sample_documents_archive_no_update
BEFORE UPDATE ON opening_sample_documents_archive
BEGIN SELECT RAISE(ABORT, 'immutable opening sample evidence'); END;
CREATE TRIGGER opening_sample_documents_archive_no_delete
BEFORE DELETE ON opening_sample_documents_archive
BEGIN SELECT RAISE(ABORT, 'immutable opening sample evidence'); END;

CREATE TABLE opening_sample_documents_document (
  logical_path TEXT PRIMARY KEY NOT NULL REFERENCES opening_sample_documents_source(logical_path),
  schema TEXT NOT NULL,
  status TEXT NOT NULL,
  approval_ref TEXT NOT NULL,
  visibility TEXT NOT NULL,
  people_count INTEGER NOT NULL CHECK (people_count = 6),
  review_question_count INTEGER NOT NULL CHECK (review_question_count >= 0),
  pending TEXT NOT NULL
) STRICT;

CREATE TABLE opening_sample_documents_ability (
  logical_path TEXT NOT NULL REFERENCES opening_sample_documents_document(logical_path),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (logical_path, ordinal)
) STRICT;

CREATE TABLE opening_sample_documents_review_question (
  logical_path TEXT NOT NULL REFERENCES opening_sample_documents_document(logical_path),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (logical_path, ordinal)
) STRICT;

CREATE TABLE opening_sample_documents_person (
  logical_path TEXT NOT NULL REFERENCES opening_sample_documents_document(logical_path),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  person_id TEXT NOT NULL,
  name TEXT NOT NULL,
  base_leadership INTEGER NOT NULL,
  base_strategy INTEGER NOT NULL,
  base_negotiation INTEGER NOT NULL,
  base_management INTEGER NOT NULL,
  base_insight INTEGER NOT NULL,
  base_learning INTEGER NOT NULL,
  base_prowess INTEGER NOT NULL,
  base_endurance INTEGER NOT NULL,
  skill_count INTEGER NOT NULL CHECK (skill_count >= 0),
  trait_count INTEGER NOT NULL CHECK (trait_count >= 0),
  ability_present INTEGER NOT NULL CHECK (ability_present IN (0, 1)),
  delta_present INTEGER NOT NULL CHECK (delta_present IN (0, 1)),
  effect_proposal_present INTEGER NOT NULL CHECK (effect_proposal_present IN (0, 1)),
  evidence_note TEXT NOT NULL,
  PRIMARY KEY (logical_path, ordinal),
  UNIQUE (logical_path, person_id)
) STRICT;

CREATE TABLE opening_sample_documents_skill (
  logical_path TEXT NOT NULL,
  person_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  name TEXT NOT NULL,
  rating REAL NOT NULL,
  PRIMARY KEY (logical_path, person_ordinal, ordinal),
  FOREIGN KEY (logical_path, person_ordinal) REFERENCES opening_sample_documents_person(logical_path, ordinal)
) STRICT;

CREATE TABLE opening_sample_documents_trait (
  logical_path TEXT NOT NULL,
  person_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  name TEXT NOT NULL,
  ability TEXT,
  delta INTEGER,
  effect_proposal TEXT,
  PRIMARY KEY (logical_path, person_ordinal, ordinal),
  FOREIGN KEY (logical_path, person_ordinal) REFERENCES opening_sample_documents_person(logical_path, ordinal)
) STRICT;
