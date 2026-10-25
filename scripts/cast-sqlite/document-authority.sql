-- Typed envelope authoring. Coordinates identify nodes, not their display positions.
CREATE TABLE document_authority (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  version INTEGER NOT NULL CHECK(version=2),
  sequence INTEGER NOT NULL CHECK(sequence>=0)
) STRICT;
INSERT INTO document_authority VALUES(1,2,0);

CREATE TABLE document_revision (
  revision_id TEXT PRIMARY KEY CHECK(length(revision_id)=64),
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  parent_revision TEXT REFERENCES document_revision(revision_id),
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0),
  recorded_at TEXT NOT NULL,
  semantic_sha256 TEXT NOT NULL CHECK(length(semantic_sha256)=64),
  algorithm TEXT NOT NULL CHECK(algorithm='typed-envelope-v1'),
  sequence INTEGER NOT NULL CHECK(sequence>=0),
  UNIQUE(source_id,revision_id),
  FOREIGN KEY(source_id,parent_revision) REFERENCES document_revision(source_id,revision_id)
) STRICT;
CREATE TABLE document_head (
  source_id INTEGER PRIMARY KEY REFERENCES text_document(source_id),
  revision_id TEXT NOT NULL UNIQUE,
  public_admission TEXT NOT NULL CHECK(public_admission='unrecorded'),
  FOREIGN KEY(source_id,revision_id) REFERENCES document_revision(source_id,revision_id)
) STRICT;
CREATE TABLE document_revision_seal (
  revision_id TEXT PRIMARY KEY REFERENCES document_revision(revision_id)
) STRICT;
-- Cross-document link proofs retain their target anchor even after that target is deleted.
CREATE TABLE document_revision_link_target (
  revision_id TEXT NOT NULL REFERENCES document_revision(revision_id),
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  locale TEXT NOT NULL CHECK(locale IN ('ko','en')),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  node_id TEXT NOT NULL,
  anchor TEXT NOT NULL,
  PRIMARY KEY(revision_id,source_id,locale,ordinal)
) STRICT;
CREATE TRIGGER document_revision_link_target_no_update BEFORE UPDATE ON document_revision_link_target
BEGIN SELECT RAISE(ABORT,'immutable link target history'); END;
CREATE TRIGGER document_revision_link_target_no_delete BEFORE DELETE ON document_revision_link_target
BEGIN SELECT RAISE(ABORT,'immutable link target history'); END;
CREATE TRIGGER document_revision_link_target_no_insert BEFORE INSERT ON document_revision_link_target
WHEN EXISTS(SELECT 1 FROM document_revision_seal WHERE revision_id=NEW.revision_id)
BEGIN SELECT RAISE(ABORT,'immutable committed link target history'); END;
CREATE TRIGGER document_revision_seal_no_update BEFORE UPDATE ON document_revision_seal
BEGIN SELECT RAISE(ABORT,'immutable revision seal'); END;
CREATE TRIGGER document_revision_seal_no_delete BEFORE DELETE ON document_revision_seal
BEGIN SELECT RAISE(ABORT,'immutable revision seal'); END;
-- Deleted identities remain reserved; a pointer need not name a live node.
CREATE TABLE document_node_identity (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  node_id TEXT NOT NULL,
  node_pointer TEXT NOT NULL,
  PRIMARY KEY(source_id,node_id),
  UNIQUE(source_id,node_pointer),
  FOREIGN KEY(source_id,node_pointer) REFERENCES source_record(source_id,json_pointer)
) STRICT;
CREATE TRIGGER document_revision_no_update BEFORE UPDATE ON document_revision
BEGIN SELECT RAISE(ABORT,'immutable document revision'); END;
CREATE TRIGGER document_revision_no_delete BEFORE DELETE ON document_revision
BEGIN SELECT RAISE(ABORT,'immutable document revision'); END;
CREATE TRIGGER document_node_identity_no_update BEFORE UPDATE ON document_node_identity
BEGIN SELECT RAISE(ABORT,'immutable node identity'); END;
CREATE TRIGGER document_node_identity_no_delete BEFORE DELETE ON document_node_identity
BEGIN SELECT RAISE(ABORT,'immutable node identity'); END;
CREATE TRIGGER document_archive_no_update BEFORE UPDATE ON source_file
BEGIN SELECT RAISE(ABORT,'immutable source archive'); END;
CREATE TRIGGER document_archive_no_delete BEFORE DELETE ON source_file
BEGIN SELECT RAISE(ABORT,'immutable source archive'); END;
CREATE TRIGGER document_coordinates_no_update BEFORE UPDATE ON source_record
BEGIN SELECT RAISE(ABORT,'immutable import coordinates'); END;
CREATE TRIGGER document_coordinates_no_delete BEFORE DELETE ON source_record
BEGIN SELECT RAISE(ABORT,'immutable import coordinates'); END;
