-- Separate from document_head.public_admission: editor status never grants publication.
CREATE TABLE document_publication_admission (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  revision_id TEXT NOT NULL,
  source_path TEXT NOT NULL,
  source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64),
  semantic_sha256 TEXT NOT NULL CHECK(length(semantic_sha256)=64),
  classification TEXT NOT NULL CHECK(classification='current-reviewed'),
  reason TEXT NOT NULL CHECK(reason='approved-exact-review'),
  receipt_path TEXT NOT NULL CHECK(length(trim(receipt_path))>0),
  receipt_sha256 TEXT NOT NULL CHECK(length(receipt_sha256)=64),
  approval_ref TEXT NOT NULL CHECK(length(trim(approval_ref))>0),
  recorded_at TEXT NOT NULL,
  PRIMARY KEY(source_id,revision_id),
  FOREIGN KEY(source_id,revision_id) REFERENCES document_revision(source_id,revision_id)
) STRICT;
CREATE TRIGGER document_publication_admission_insert BEFORE INSERT ON document_publication_admission
WHEN NOT EXISTS (
  SELECT 1 FROM document_head h JOIN document_revision r USING(source_id,revision_id)
  JOIN document_revision_seal z USING(revision_id)
  JOIN source_file s USING(source_id) JOIN text_document d USING(source_id)
  WHERE h.source_id=NEW.source_id AND h.revision_id=NEW.revision_id
    AND r.semantic_sha256=NEW.semantic_sha256
    AND r.algorithm='typed-envelope-v1' AND s.logical_path=NEW.source_path
    AND s.sha256=NEW.source_sha256 AND d.corpus_kind='current'
    AND d.status IN ('approved','draft')
    AND NOT EXISTS(SELECT 1 FROM excluded_source e WHERE e.logical_path=s.logical_path)
)
BEGIN SELECT RAISE(ABORT,'publication snapshot mismatch'); END;
CREATE TRIGGER document_publication_admission_no_update BEFORE UPDATE ON document_publication_admission
BEGIN SELECT RAISE(ABORT,'immutable publication admission'); END;
CREATE TRIGGER document_publication_admission_no_delete BEFORE DELETE ON document_publication_admission
BEGIN SELECT RAISE(ABORT,'immutable publication admission'); END;
