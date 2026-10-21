CREATE TABLE evidence_policy (
  singleton INTEGER PRIMARY KEY CHECK(singleton = 1),
  privacy TEXT NOT NULL CHECK(privacy = 'restricted-internal-only')
) STRICT;
INSERT INTO evidence_policy VALUES (1, 'restricted-internal-only');

CREATE TABLE evidence (
  identity TEXT PRIMARY KEY NOT NULL CHECK(length(identity) > 0),
  kind TEXT NOT NULL CHECK(kind IN ('ownerapproval', 'review', 'packet', 'baseline', 'registry', 'archive')),
  logical_path TEXT NOT NULL,
  revision TEXT NOT NULL CHECK(length(revision) > 0),
  git_revision TEXT,
  git_blob TEXT,
  raw_bytes BLOB NOT NULL,
  sha256 TEXT NOT NULL CHECK(length(sha256) = 64 AND sha256 NOT GLOB '*[^0-9a-f]*'),
  byte_length INTEGER NOT NULL CHECK(byte_length >= 0 AND byte_length = length(raw_bytes)),
  record_sha256 TEXT NOT NULL CHECK(length(record_sha256) = 64),
  UNIQUE(identity, sha256)
) STRICT;

CREATE TABLE evidence_reference (
  source_identity TEXT NOT NULL,
  type TEXT NOT NULL CHECK(length(type) > 0),
  pointer TEXT NOT NULL,
  target_identity TEXT NOT NULL,
  expected_sha256 TEXT NOT NULL CHECK(length(expected_sha256) = 64 AND expected_sha256 NOT GLOB '*[^0-9a-f]*'),
  PRIMARY KEY(source_identity, type, pointer, target_identity),
  FOREIGN KEY(source_identity) REFERENCES evidence(identity) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(target_identity, expected_sha256) REFERENCES evidence(identity, sha256) DEFERRABLE INITIALLY DEFERRED
) STRICT;

-- References are written before their source in one transaction. Once the source
-- exists its complete reference set, metadata and bytes are sealed together.
CREATE TRIGGER reference_sealed BEFORE INSERT ON evidence_reference
WHEN EXISTS (SELECT 1 FROM evidence WHERE identity = NEW.source_identity)
BEGIN SELECT RAISE(ABORT, 'immutable evidence references'); END;
CREATE TRIGGER evidence_no_update BEFORE UPDATE ON evidence
BEGIN SELECT RAISE(ABORT, 'immutable evidence'); END;
CREATE TRIGGER evidence_no_delete BEFORE DELETE ON evidence
BEGIN SELECT RAISE(ABORT, 'immutable evidence'); END;
CREATE TRIGGER reference_no_update BEFORE UPDATE ON evidence_reference
BEGIN SELECT RAISE(ABORT, 'immutable evidence references'); END;
CREATE TRIGGER reference_no_delete BEFORE DELETE ON evidence_reference
BEGIN SELECT RAISE(ABORT, 'immutable evidence references'); END;
CREATE TRIGGER policy_no_insert BEFORE INSERT ON evidence_policy
BEGIN SELECT RAISE(ABORT, 'immutable evidence policy'); END;
CREATE TRIGGER policy_no_update BEFORE UPDATE ON evidence_policy
BEGIN SELECT RAISE(ABORT, 'immutable evidence policy'); END;
CREATE TRIGGER policy_no_delete BEFORE DELETE ON evidence_policy
BEGIN SELECT RAISE(ABORT, 'immutable evidence policy'); END;
