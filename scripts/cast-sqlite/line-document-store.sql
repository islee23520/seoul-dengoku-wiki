-- source_file/source_record are immutable migration evidence, never current text.
CREATE TABLE line_document_policy (
  source_id INTEGER PRIMARY KEY REFERENCES text_line_document(source_id),
  usage_kind TEXT NOT NULL CHECK(usage_kind IN ('policy-guide','private-authoring','private-reference','private-script')),
  privacy TEXT NOT NULL CHECK(privacy='internal-only')
) STRICT;
CREATE TABLE line_document_revision (
  source_id INTEGER NOT NULL REFERENCES line_document_policy(source_id),
  revision_id TEXT NOT NULL UNIQUE,
  parent_revision TEXT,
  sequence INTEGER NOT NULL CHECK(sequence>=0),
  media_kind TEXT NOT NULL CHECK(media_kind IN ('markdown','csv','javascript-data')),
  line_count INTEGER NOT NULL CHECK(line_count>=0),
  ends_with_newline INTEGER NOT NULL CHECK(ends_with_newline IN (0,1)),
  line_ending TEXT NOT NULL CHECK(line_ending IN ('lf','crlf','mixed','none')),
  content_sha256 TEXT NOT NULL CHECK(length(content_sha256)=64),
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0),
  created_at TEXT NOT NULL,
  PRIMARY KEY(source_id,revision_id),
  UNIQUE(source_id,sequence),
  FOREIGN KEY(source_id,parent_revision) REFERENCES line_document_revision(source_id,revision_id),
  CHECK((sequence=0 AND parent_revision IS NULL) OR (sequence>0 AND parent_revision IS NOT NULL)),
  CHECK(line_count>0 OR (ends_with_newline=0 AND line_ending='none'))
) STRICT;
-- A line is identified by (source_id, revision_id, line_ordinal). Reordering
-- changes ordinal in a new revision; no cross-revision line identity is claimed.
CREATE TABLE line_document_revision_line (
  source_id INTEGER NOT NULL,
  revision_id TEXT NOT NULL,
  line_ordinal INTEGER NOT NULL CHECK(line_ordinal>=0),
  text TEXT NOT NULL CHECK(instr(text,char(10))=0),
  line_kind TEXT NOT NULL CHECK(line_kind IN ('blank','heading','list','table','fence','quote','other')),
  heading_depth INTEGER,
  PRIMARY KEY(source_id,revision_id,line_ordinal),
  FOREIGN KEY(source_id,revision_id) REFERENCES line_document_revision(source_id,revision_id),
  CHECK((line_kind='heading' AND heading_depth BETWEEN 1 AND 6 AND heading_depth IS NOT NULL)
    OR (line_kind<>'heading' AND heading_depth IS NULL))
) STRICT;
CREATE TABLE line_document_revision_seal (
  source_id INTEGER NOT NULL,
  revision_id TEXT NOT NULL,
  PRIMARY KEY(source_id,revision_id),
  FOREIGN KEY(source_id,revision_id) REFERENCES line_document_revision(source_id,revision_id)
) STRICT;
CREATE TABLE line_document_head (
  source_id INTEGER PRIMARY KEY REFERENCES line_document_policy(source_id),
  revision_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status='draft'),
  public_admission TEXT NOT NULL CHECK(public_admission='invalidated'),
  schema_attestation TEXT,
  current_approval_ref TEXT,
  FOREIGN KEY(source_id,revision_id) REFERENCES line_document_revision_seal(source_id,revision_id),
  CHECK(schema_attestation IS NULL AND current_approval_ref IS NULL)
) STRICT;
CREATE TRIGGER line_document_seal_complete BEFORE INSERT ON line_document_revision_seal
WHEN NOT EXISTS (
  SELECT 1 FROM line_document_revision r WHERE r.source_id=NEW.source_id AND r.revision_id=NEW.revision_id
    AND r.line_count=(SELECT count(*) FROM line_document_revision_line l WHERE l.revision_id=r.revision_id)
    AND (r.line_count=0 OR (SELECT max(line_ordinal) FROM line_document_revision_line l WHERE l.revision_id=r.revision_id)=r.line_count-1)
)
BEGIN SELECT RAISE(ABORT,'incomplete line revision'); END;
