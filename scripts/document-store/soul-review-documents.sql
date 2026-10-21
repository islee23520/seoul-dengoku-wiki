-- Private, read-only Soul-Duplicate-Review snapshot.
-- Named domain tables only. Keys-only metadata. No JSON value authority.
CREATE TABLE soul_review_documents_import (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  actor TEXT NOT NULL,
  reason TEXT NOT NULL,
  initialized_at TEXT NOT NULL
) STRICT;
CREATE TABLE soul_review_documents_source (
  logical_path TEXT PRIMARY KEY NOT NULL,
  ordinal INTEGER NOT NULL UNIQUE CHECK (ordinal >= 0),
  byte_length INTEGER NOT NULL CHECK (byte_length >= 0),
  source_sha256 TEXT NOT NULL,
  document_sha256 TEXT NOT NULL
) STRICT;
CREATE TABLE soul_review_documents_archive (
  logical_path TEXT PRIMARY KEY NOT NULL,
  sha256 TEXT NOT NULL,
  raw_bytes BLOB NOT NULL
) STRICT;
CREATE TRIGGER soul_review_documents_archive_no_update
BEFORE UPDATE ON soul_review_documents_archive
BEGIN SELECT RAISE(ABORT, 'immutable soul-review evidence'); END;
CREATE TRIGGER soul_review_documents_archive_no_delete
BEFORE DELETE ON soul_review_documents_archive
BEGIN SELECT RAISE(ABORT, 'immutable soul-review evidence'); END;

CREATE TABLE soul_review_documents_document (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "schema" TEXT,
  "status" TEXT,
  "visibility" TEXT,
  "assignmentLedger" TEXT,
  "candidateLedger" TEXT,
  "reviewedOn" TEXT,
  "policy" TEXT,
  "candidateLedgerSha256" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_document_parent ON soul_review_documents_document(parent_key, ordinal);

CREATE TABLE soul_review_documents_coverage (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "people" INTEGER,
  "soulSlots" INTEGER,
  "candidates" INTEGER,
  "initiallyUnusedCandidates" INTEGER,
  "ownerConfirmedImmutable" INTEGER,
  "weakEvidenceAssignmentsRetained" INTEGER,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_coverage_parent ON soul_review_documents_coverage(parent_key, ordinal);

CREATE TABLE soul_review_documents_range_review (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "range" TEXT,
  "people" INTEGER,
  "status" TEXT,
  "sourceQuotes" INTEGER,
  "recommendedReplacements" INTEGER,
  "weakEvidenceRows" INTEGER,
  "sourceQuoteVerification" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_range_review_parent ON soul_review_documents_range_review(parent_key, ordinal);

CREATE TABLE soul_review_documents_pool_metrics (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "candidatePool" INTEGER,
  "usedCandidates" INTEGER,
  "unusedCandidates" INTEGER,
  "soulSlots" INTEGER,
  "repeatedSlotsBeyondFirst" INTEGER,
  "sameCandidatePairs" INTEGER,
  "maximumFrequency" INTEGER,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_pool_metrics_parent ON soul_review_documents_pool_metrics(parent_key, ordinal);

CREATE TABLE soul_review_documents_histogram_entry (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "candidateId" TEXT,
  "before" INTEGER,
  "after" INTEGER,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_histogram_entry_parent ON soul_review_documents_histogram_entry(parent_key, ordinal);

CREATE TABLE soul_review_documents_change (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  counter_kind TEXT NOT NULL CHECK (counter_kind IN ('text', 'array')),
  "personId" TEXT,
  "name" TEXT,
  "statusBefore" TEXT,
  "statusAfter" TEXT,
  "whyEqualOrBetter" TEXT,
  "counterEvidence" TEXT,
  "decision" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_change_parent ON soul_review_documents_change(parent_key, ordinal);

CREATE TABLE soul_review_documents_soul (
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
CREATE INDEX soul_review_documents_soul_parent ON soul_review_documents_soul(parent_key, ordinal);

CREATE TABLE soul_review_documents_evidence (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "path" TEXT,
  "anchor" TEXT,
  "quote" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_evidence_parent ON soul_review_documents_evidence(parent_key, ordinal);

CREATE TABLE soul_review_documents_candidate_comparison (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "id" TEXT,
  "name" TEXT,
  "period" TEXT,
  "sourceKind" TEXT,
  "lockedExisting" INTEGER CHECK ("lockedExisting" IN (0, 1)),
  "researchStatus" TEXT,
  "careerSummary" TEXT,
  "narrativeFit" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_candidate_comparison_parent ON soul_review_documents_candidate_comparison(parent_key, ordinal);

CREATE TABLE soul_review_documents_source_record (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "url" TEXT,
  "sourceType" TEXT,
  "accessMethod" TEXT,
  "accessedOn" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_source_record_parent ON soul_review_documents_source_record(parent_key, ordinal);

CREATE TABLE soul_review_documents_unused_review (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "group" TEXT,
  "decision" TEXT,
  "reason" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_unused_review_parent ON soul_review_documents_unused_review(parent_key, ordinal);

CREATE TABLE soul_review_documents_retained_duplicate (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "candidateId" TEXT,
  "before" INTEGER,
  "reason" TEXT,
  "after" INTEGER,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_retained_duplicate_parent ON soul_review_documents_retained_duplicate(parent_key, ordinal);

CREATE TABLE soul_review_documents_fingerprint (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "path" TEXT,
  "contentHash" TEXT,
  "hashEncoding" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_fingerprint_parent ON soul_review_documents_fingerprint(parent_key, ordinal);

CREATE TABLE soul_review_documents_frequency_review (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "candidateId" TEXT,
  "before" INTEGER,
  "after" INTEGER,
  "weakEvidenceRows" INTEGER,
  "reason" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_frequency_review_parent ON soul_review_documents_frequency_review(parent_key, ordinal);

CREATE TABLE soul_review_documents_judgment (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "independentRangeReview" TEXT,
  "finalEditorialDecision" TEXT,
  "notConsensusApproval" INTEGER CHECK ("notConsensusApproval" IN (0, 1)),
  "reasonForNotRequiringWholeBiography" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_judgment_parent ON soul_review_documents_judgment(parent_key, ordinal);

CREATE TABLE soul_review_documents_original_evidence (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "assignmentLedgerSha256" TEXT,
  "verifiedQuotes" INTEGER,
  "verification" TEXT,
  "concurrentSourceEdits" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_original_evidence_parent ON soul_review_documents_original_evidence(parent_key, ordinal);

CREATE TABLE soul_review_documents_changed_node (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "personId" TEXT,
  "path" TEXT,
  "anchor" TEXT,
  "originalKoreanText" TEXT,
  "quote" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_changed_node_parent ON soul_review_documents_changed_node(parent_key, ordinal);

CREATE TABLE soul_review_documents_baseline_assignment (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  counter_kind TEXT NOT NULL CHECK (counter_kind IN ('text', 'array')),
  "personId" TEXT,
  "name" TEXT,
  "status" TEXT,
  "narrativeRationale" TEXT,
  "counterEvidence" TEXT,
  "evidenceStrength" TEXT,
  "duplicateRationale" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_baseline_assignment_parent ON soul_review_documents_baseline_assignment(parent_key, ordinal);

CREATE TABLE soul_review_documents_ledger_comparison (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "candidateLedger" TEXT,
  "careerSummary" TEXT,
  "interpretationOnly" INTEGER CHECK ("interpretationOnly" IN (0, 1)),
  "primarySourcesVerified" INTEGER CHECK ("primarySourcesVerified" IN (0, 1)),
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_ledger_comparison_parent ON soul_review_documents_ledger_comparison(parent_key, ordinal);

CREATE TABLE soul_review_documents_path_comparison (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "path" TEXT,
  "candidateId" TEXT,
  "careerSummary" TEXT,
  "interpretiveScope" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_path_comparison_parent ON soul_review_documents_path_comparison(parent_key, ordinal);

CREATE TABLE soul_review_documents_locked_assignment (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "personId" TEXT,
  "name" TEXT,
  "approvalRef" TEXT,
  "status" TEXT,
  "assignmentSha256" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_locked_assignment_parent ON soul_review_documents_locked_assignment(parent_key, ordinal);

CREATE TABLE soul_review_documents_source_comparison (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "checkedOn" TEXT,
  "changedQuoteCount" INTEGER,
  "meaning" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_source_comparison_parent ON soul_review_documents_source_comparison(parent_key, ordinal);

CREATE TABLE soul_review_documents_verification (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "weakEvidenceAssignmentsUnchanged" INTEGER,
  "approvalStatusUnchanged" INTEGER CHECK ("approvalStatusUnchanged" IN (0, 1)),
  "assignmentDiagnostics" TEXT,
  "assignmentDiffCheckExitCode" INTEGER,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_verification_parent ON soul_review_documents_verification(parent_key, ordinal);

CREATE TABLE soul_review_documents_structural_audit (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "passed" INTEGER CHECK ("passed" IN (0, 1)),
  "identities" INTEGER,
  "candidateSlots" INTEGER,
  "immutableLocks" INTEGER,
  "untouchedAssignments" INTEGER,
  "changedOriginalQuotes" INTEGER,
  "histogramMatches" INTEGER CHECK ("histogramMatches" IN (0, 1)),
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_structural_audit_parent ON soul_review_documents_structural_audit(parent_key, ordinal);

CREATE TABLE soul_review_documents_quote_audit (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "count" INTEGER,
  "failures" INTEGER,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_quote_audit_parent ON soul_review_documents_quote_audit(parent_key, ordinal);

CREATE TABLE soul_review_documents_validator_run (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "command" TEXT,
  "exitCode" INTEGER,
  "output" TEXT,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_validator_run_parent ON soul_review_documents_validator_run(parent_key, ordinal);

CREATE TABLE soul_review_documents_text_item (
  row_key TEXT PRIMARY KEY NOT NULL,
  parent_key TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  field_order TEXT NOT NULL,
  "value" TEXT NOT NULL,
  UNIQUE (parent_key, ordinal)
) STRICT;
CREATE INDEX soul_review_documents_text_item_parent ON soul_review_documents_text_item(parent_key, ordinal);
