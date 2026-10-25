-- Private Soul-Candidates snapshot. Named typed columns and ordered collections only.
-- Not a public authority, authoring API, or JSON blob store.
CREATE TABLE soul_candidate_documents_import (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  initialized_at TEXT NOT NULL
) STRICT;

CREATE TABLE soul_candidate_documents_source (
  logical_path TEXT PRIMARY KEY NOT NULL,
  source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64),
  document_sha256 TEXT NOT NULL CHECK (length(document_sha256) = 64),
  byte_length INTEGER NOT NULL CHECK (byte_length >= 0)
) STRICT;

CREATE TABLE soul_candidate_documents_archive (
  logical_path TEXT PRIMARY KEY NOT NULL REFERENCES soul_candidate_documents_source(logical_path),
  source_sha256 TEXT NOT NULL,
  raw_bytes BLOB NOT NULL
) STRICT;
CREATE TRIGGER soul_candidate_documents_archive_no_update
BEFORE UPDATE ON soul_candidate_documents_archive
BEGIN SELECT RAISE(ABORT, 'immutable soul candidate evidence'); END;
CREATE TRIGGER soul_candidate_documents_archive_no_delete
BEFORE DELETE ON soul_candidate_documents_archive
BEGIN SELECT RAISE(ABORT, 'immutable soul candidate evidence'); END;

CREATE TABLE soul_candidate_documents_document (
  logical_path TEXT PRIMARY KEY NOT NULL REFERENCES soul_candidate_documents_source(logical_path),
  field_order TEXT NOT NULL,
  schema TEXT NOT NULL,
  status TEXT NOT NULL,
  visibility TEXT NOT NULL,
  interpretation_policy TEXT NOT NULL,
  assignment_policy TEXT NOT NULL,
  candidate_period_count INTEGER NOT NULL CHECK (candidate_period_count >= 0),
  candidate_count INTEGER NOT NULL CHECK (candidate_count >= 0)
) STRICT;

CREATE TABLE soul_candidate_documents_period (
  logical_path TEXT NOT NULL REFERENCES soul_candidate_documents_document(logical_path),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (logical_path, ordinal)
) STRICT;

CREATE TABLE soul_candidate_documents_research (
  logical_path TEXT PRIMARY KEY NOT NULL REFERENCES soul_candidate_documents_document(logical_path),
  field_order TEXT NOT NULL,
  accessed_on TEXT NOT NULL,
  total_candidates INTEGER NOT NULL,
  primary_sources_verified INTEGER NOT NULL CHECK (primary_sources_verified IN (0, 1)),
  limitation_count INTEGER NOT NULL CHECK (limitation_count >= 0)
) STRICT;

CREATE TABLE soul_candidate_documents_coverage (
  logical_path TEXT NOT NULL REFERENCES soul_candidate_documents_research(logical_path),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  period TEXT NOT NULL,
  candidate_count INTEGER NOT NULL,
  PRIMARY KEY (logical_path, ordinal)
) STRICT;

CREATE TABLE soul_candidate_documents_research_limitation (
  logical_path TEXT NOT NULL REFERENCES soul_candidate_documents_research(logical_path),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (logical_path, ordinal)
) STRICT;

CREATE TABLE soul_candidate_documents_candidate (
  logical_path TEXT NOT NULL REFERENCES soul_candidate_documents_document(logical_path),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  period TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  locked_existing INTEGER NOT NULL CHECK (locked_existing IN (0, 1)),
  related_periods_present INTEGER NOT NULL CHECK (related_periods_present IN (0, 1)),
  research_status TEXT NOT NULL,
  career_summary TEXT NOT NULL,
  narrative_fit TEXT NOT NULL,
  source_count INTEGER NOT NULL CHECK (source_count >= 0),
  role_tag_count INTEGER NOT NULL CHECK (role_tag_count >= 0),
  limitation_count INTEGER NOT NULL CHECK (limitation_count >= 0),
  PRIMARY KEY (logical_path, ordinal),
  UNIQUE (logical_path, id)
) STRICT;

CREATE TABLE soul_candidate_documents_related_period (
  logical_path TEXT NOT NULL,
  candidate_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (logical_path, candidate_ordinal, ordinal),
  FOREIGN KEY (logical_path, candidate_ordinal)
    REFERENCES soul_candidate_documents_candidate(logical_path, ordinal)
) STRICT;

CREATE TABLE soul_candidate_documents_source_record (
  logical_path TEXT NOT NULL,
  candidate_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  access_method TEXT NOT NULL,
  accessed_on TEXT NOT NULL,
  PRIMARY KEY (logical_path, candidate_ordinal, ordinal),
  FOREIGN KEY (logical_path, candidate_ordinal)
    REFERENCES soul_candidate_documents_candidate(logical_path, ordinal)
) STRICT;

CREATE TABLE soul_candidate_documents_role_tag (
  logical_path TEXT NOT NULL,
  candidate_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (logical_path, candidate_ordinal, ordinal),
  FOREIGN KEY (logical_path, candidate_ordinal)
    REFERENCES soul_candidate_documents_candidate(logical_path, ordinal)
) STRICT;

CREATE TABLE soul_candidate_documents_limitation (
  logical_path TEXT NOT NULL,
  candidate_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  value TEXT NOT NULL,
  PRIMARY KEY (logical_path, candidate_ordinal, ordinal),
  FOREIGN KEY (logical_path, candidate_ordinal)
    REFERENCES soul_candidate_documents_candidate(logical_path, ordinal)
) STRICT;
