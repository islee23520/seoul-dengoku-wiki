-- Bounded original creative-name normalization document.
-- Named typed columns and ordered child rows only. Key tables store object key order, never values.
-- Loading this document does not infer names, current-world facts, or publication approval.
CREATE TABLE creative_name_document_root (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1),
  source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64),
  document_sha256 TEXT NOT NULL CHECK (length(document_sha256) = 64),
  "schema" TEXT NOT NULL,
  decided_on TEXT NOT NULL,
  scope TEXT NOT NULL,
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  receipt_sha256 TEXT NOT NULL CHECK (length(receipt_sha256) = 64)
) STRICT;

CREATE TABLE creative_name_document_precedence (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  document_id INTEGER NOT NULL REFERENCES creative_name_document_root(document_id),
  value TEXT NOT NULL
) STRICT;

CREATE TABLE creative_name_document_preservation (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  document_id INTEGER NOT NULL REFERENCES creative_name_document_root(document_id),
  value TEXT NOT NULL
) STRICT;

CREATE TABLE creative_name_document_reference (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  document_id INTEGER NOT NULL REFERENCES creative_name_document_root(document_id),
  label TEXT NOT NULL,
  url_present INTEGER NOT NULL CHECK (url_present IN (0, 1)),
  url TEXT,
  path_present INTEGER NOT NULL CHECK (path_present IN (0, 1)),
  path TEXT,
  CHECK ((url_present = 0 AND url IS NULL) OR (url_present = 1 AND url IS NOT NULL)),
  CHECK ((path_present = 0 AND path IS NULL) OR (path_present = 1 AND path IS NOT NULL))
) STRICT;

CREATE TABLE creative_name_document_replacement (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  document_id INTEGER NOT NULL REFERENCES creative_name_document_root(document_id),
  kind TEXT NOT NULL,
  id TEXT NOT NULL,
  old TEXT NOT NULL,
  new TEXT NOT NULL,
  anchor TEXT NOT NULL
) STRICT;

CREATE TABLE creative_name_document_pattern (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  document_id INTEGER NOT NULL REFERENCES creative_name_document_root(document_id),
  kind TEXT NOT NULL,
  id_present INTEGER NOT NULL CHECK (id_present IN (0, 1)),
  id TEXT,
  old_present INTEGER NOT NULL CHECK (old_present IN (0, 1)),
  old TEXT,
  pattern TEXT NOT NULL,
  new TEXT NOT NULL,
  anchor TEXT NOT NULL,
  CHECK ((id_present = 0 AND id IS NULL) OR (id_present = 1 AND id IS NOT NULL)),
  CHECK ((old_present = 0 AND old IS NULL) OR (old_present = 1 AND old IS NOT NULL))
) STRICT;

CREATE TABLE creative_name_document_retained (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  document_id INTEGER NOT NULL REFERENCES creative_name_document_root(document_id),
  kind TEXT NOT NULL,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  anchor TEXT NOT NULL
) STRICT;

-- Keys only: object_path + ordinal + key. Domain values never live here.
CREATE TABLE creative_name_document_key (
  object_path TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  key TEXT NOT NULL,
  PRIMARY KEY (object_path, ordinal),
  UNIQUE (object_path, key)
) STRICT;
