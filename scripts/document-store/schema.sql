CREATE TABLE document (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) > 0),
  corpus TEXT NOT NULL CHECK(length(corpus) > 0),
  privacy TEXT NOT NULL CHECK(privacy IN ('public', 'private', 'editorial')),
  current_revision INTEGER NOT NULL CHECK(current_revision > 0),
  retired INTEGER NOT NULL DEFAULT 0 CHECK(retired IN (0, 1)),
  FOREIGN KEY(id, current_revision) REFERENCES document_revision(document_id, revision)
    DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE TABLE document_revision (
  document_id TEXT NOT NULL REFERENCES document(id),
  revision INTEGER NOT NULL CHECK(revision > 0),
  operation TEXT NOT NULL CHECK(operation IN ('create', 'update', 'retire')),
  corpus TEXT NOT NULL,
  privacy TEXT NOT NULL CHECK(privacy IN ('public', 'private', 'editorial')),
  approval_state TEXT NOT NULL CHECK(length(approval_state) > 0),
  raw_bytes BLOB NOT NULL,
  sha256 TEXT NOT NULL CHECK(length(sha256) = 64),
  media_type TEXT NOT NULL CHECK(length(media_type) > 0),
  logical_path TEXT,
  git_revision TEXT,
  git_blob TEXT,
  PRIMARY KEY(document_id, revision)
) STRICT;

CREATE TRIGGER revision_no_update BEFORE UPDATE ON document_revision
BEGIN SELECT RAISE(ABORT, 'immutable revision'); END;
CREATE TRIGGER revision_no_delete BEFORE DELETE ON document_revision
BEGIN SELECT RAISE(ABORT, 'immutable revision'); END;

CREATE TABLE document_node (
  document_id TEXT NOT NULL REFERENCES document(id),
  node_id INTEGER NOT NULL CHECK(node_id >= 0),
  parent_id INTEGER,
  position INTEGER NOT NULL CHECK(position >= 0),
  member_key TEXT,
  kind TEXT NOT NULL CHECK(kind IN ('object', 'array', 'null', 'string', 'number', 'boolean')),
  text_value TEXT,
  number_value REAL,
  boolean_value INTEGER CHECK(boolean_value IN (0, 1)),
  negative_zero INTEGER NOT NULL DEFAULT 0 CHECK(negative_zero IN (0, 1)),
  PRIMARY KEY(document_id, node_id),
  FOREIGN KEY(document_id, parent_id) REFERENCES document_node(document_id, node_id)
    DEFERRABLE INITIALLY DEFERRED,
  UNIQUE(document_id, parent_id, position),
  UNIQUE(document_id, parent_id, member_key),
  CHECK((parent_id IS NULL AND node_id = 0 AND position = 0 AND member_key IS NULL)
     OR (parent_id IS NOT NULL AND node_id > 0)),
  CHECK((kind = 'string' AND text_value IS NOT NULL AND number_value IS NULL AND boolean_value IS NULL AND negative_zero = 0)
     OR (kind = 'number' AND text_value IS NULL AND number_value IS NOT NULL AND boolean_value IS NULL AND (negative_zero = 0 OR number_value = 0))
     OR (kind = 'boolean' AND text_value IS NULL AND number_value IS NULL AND boolean_value IS NOT NULL AND negative_zero = 0)
     OR (kind IN ('object', 'array', 'null') AND text_value IS NULL AND number_value IS NULL AND boolean_value IS NULL AND negative_zero = 0))
) STRICT;

CREATE TRIGGER node_parent_shape BEFORE INSERT ON document_node WHEN NEW.parent_id IS NOT NULL
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM document_node p WHERE p.document_id = NEW.document_id AND p.node_id = NEW.parent_id
      AND ((p.kind = 'object' AND NEW.member_key IS NOT NULL) OR (p.kind = 'array' AND NEW.member_key IS NULL))
  ) THEN RAISE(ABORT, 'invalid tree parent') END;
END;
