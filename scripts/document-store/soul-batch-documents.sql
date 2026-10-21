-- Private, read-only soul-batch document snapshot.
-- Named domain tables only. Keys-only metadata. No JSON value authority.
CREATE TABLE soul_batch_documents_import (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  actor TEXT NOT NULL,
  reason TEXT NOT NULL,
  initialized_at TEXT NOT NULL
) STRICT;
CREATE TABLE soul_batch_documents_source (
  logical_path TEXT PRIMARY KEY NOT NULL,
  ordinal INTEGER NOT NULL UNIQUE CHECK (ordinal >= 0),
  byte_length INTEGER NOT NULL CHECK (byte_length >= 0),
  source_sha256 TEXT NOT NULL,
  document_sha256 TEXT NOT NULL,
  assignment_count INTEGER NOT NULL CHECK (assignment_count >= 0)
) STRICT;
CREATE TABLE soul_batch_documents_archive (
  logical_path TEXT PRIMARY KEY NOT NULL,
  sha256 TEXT NOT NULL,
  raw_bytes BLOB NOT NULL
) STRICT;
CREATE TRIGGER soul_batch_documents_archive_no_update
BEFORE UPDATE ON soul_batch_documents_archive
BEGIN SELECT RAISE(ABORT, 'immutable soul-batch evidence'); END;
CREATE TRIGGER soul_batch_documents_archive_no_delete
BEFORE DELETE ON soul_batch_documents_archive
BEGIN SELECT RAISE(ABORT, 'immutable soul-batch evidence'); END;

CREATE TABLE soul_batch_documents_document (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  exclusions_kind TEXT CHECK (exclusions_kind IN ('array', 'object')),
  "schema" TEXT,
  "visibility" TEXT,
  "status" TEXT,
  "batch" TEXT,
  "lane" TEXT,
  "assignmentCount" INTEGER,
  "lockedAssignmentCount" INTEGER,
  "count" INTEGER,
  "interpretationPolicy" TEXT,
  "policy" TEXT,
  "exclusionPolicy" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_batch_documents_document_parent ON soul_batch_documents_document(parent_key, ordinal);

CREATE TABLE soul_batch_documents_assignment (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  counter_kind TEXT NOT NULL CHECK (counter_kind IN ('text', 'array')),
  "personId" TEXT,
  "name" TEXT,
  "status" TEXT,
  "approvalRef" TEXT,
  "narrativeRationale" TEXT,
  "counterEvidence" TEXT,
  "evidenceStrength" TEXT,
  "duplicateRationale" TEXT,
  "currentFactAuthority" INTEGER CHECK ("currentFactAuthority" IN (0, 1)),
  "canonicalAssignmentRef" TEXT,
  "supersededByApprovalRef" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_batch_documents_assignment_parent ON soul_batch_documents_assignment(parent_key, ordinal);

CREATE TABLE soul_batch_documents_soul (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "id" TEXT,
  "name" TEXT,
  "period" TEXT,
  "sourceKind" TEXT,
  "interpretation" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_batch_documents_soul_parent ON soul_batch_documents_soul(parent_key, ordinal);

CREATE TABLE soul_batch_documents_evidence (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "path" TEXT,
  "anchor" TEXT,
  "quote" TEXT,
  "sourcePointer" TEXT,
  "sourceSelector" TEXT,
  "currentFactAuthority" INTEGER CHECK ("currentFactAuthority" IN (0, 1)),
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_batch_documents_evidence_parent ON soul_batch_documents_evidence(parent_key, ordinal);

CREATE TABLE soul_batch_documents_comparison (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "candidatePath" TEXT,
  "candidateId" TEXT,
  "sourceKind" TEXT,
  "careerSummary" TEXT,
  "interpretation" TEXT,
  "path" TEXT,
  "anchor" TEXT,
  "interpretiveScope" TEXT,
  "candidateLedger" TEXT,
  "interpretationOnly" INTEGER CHECK ("interpretationOnly" IN (0, 1)),
  "primarySourcesVerified" INTEGER CHECK ("primarySourcesVerified" IN (0, 1)),
  "narrativeFit" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_batch_documents_comparison_parent ON soul_batch_documents_comparison(parent_key, ordinal);

CREATE TABLE soul_batch_documents_historical_source (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "url" TEXT,
  "sourceType" TEXT,
  "accessMethod" TEXT,
  "accessedOn" TEXT,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('url', 'record')),
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_batch_documents_historical_source_parent ON soul_batch_documents_historical_source(parent_key, ordinal);

CREATE TABLE soul_batch_documents_scope (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "sourceCardCount" INTEGER,
  "expectedPeople" INTEGER,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_batch_documents_scope_parent ON soul_batch_documents_scope(parent_key, ordinal);

CREATE TABLE soul_batch_documents_exclusions_object (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "policy" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_batch_documents_exclusions_object_parent ON soul_batch_documents_exclusions_object(parent_key, ordinal);

CREATE TABLE soul_batch_documents_duplicate_summary (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "id" TEXT,
  "name" TEXT,
  "count" INTEGER,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_batch_documents_duplicate_summary_parent ON soul_batch_documents_duplicate_summary(parent_key, ordinal);

CREATE TABLE soul_batch_documents_excluded_person (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "personId" TEXT,
  "name" TEXT,
  "reason" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_batch_documents_excluded_person_parent ON soul_batch_documents_excluded_person(parent_key, ordinal);

CREATE TABLE soul_batch_documents_named_person (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "personId" TEXT,
  "name" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_batch_documents_named_person_parent ON soul_batch_documents_named_person(parent_key, ordinal);

CREATE TABLE soul_batch_documents_text_item (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "value" TEXT NOT NULL,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_batch_documents_text_item_parent ON soul_batch_documents_text_item(parent_key, ordinal);
