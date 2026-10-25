-- Private typed snapshot of two editorial authoring envelopes.
-- Reuses the cast-sqlite text_document / locale / content / slot / run / table vocabulary.
-- Empty /data is a typed absence flag, not a JSON tree and not a fixed-property EAV.
-- Historical proposal storage does not approve, publish, or activate rules.

CREATE TABLE editorial_envelope_import (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  initialized_at TEXT NOT NULL
) STRICT;

CREATE TABLE source_file (
  source_id INTEGER PRIMARY KEY,
  logical_path TEXT NOT NULL UNIQUE,
  media_type TEXT NOT NULL,
  sha256 TEXT NOT NULL CHECK (length(sha256) = 64),
  byte_length INTEGER NOT NULL CHECK (byte_length >= 0),
  document_sha256 TEXT NOT NULL CHECK (length(document_sha256) = 64)
) STRICT;

CREATE TABLE editorial_envelope_archive (
  source_id INTEGER PRIMARY KEY REFERENCES source_file(source_id),
  sha256 TEXT NOT NULL,
  raw_bytes BLOB NOT NULL
) STRICT;
CREATE TRIGGER editorial_envelope_archive_no_update
BEFORE UPDATE ON editorial_envelope_archive
BEGIN SELECT RAISE(ABORT, 'immutable editorial envelope evidence'); END;
CREATE TRIGGER editorial_envelope_archive_no_delete
BEFORE DELETE ON editorial_envelope_archive
BEGIN SELECT RAISE(ABORT, 'immutable editorial envelope evidence'); END;

CREATE TABLE text_document (
  source_id INTEGER PRIMARY KEY REFERENCES source_file(source_id),
  json_pointer TEXT NOT NULL CHECK (json_pointer = ''),
  corpus_kind TEXT NOT NULL CHECK (corpus_kind = 'historical'),
  version INTEGER NOT NULL CHECK (version = 1),
  domain TEXT NOT NULL,
  document_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status = 'draft'),
  tense_ko TEXT NOT NULL CHECK (tense_ko IN ('past', 'present')),
  tense_en TEXT NOT NULL CHECK (tense_en IN ('past', 'present')),
  source_kind TEXT NOT NULL CHECK (source_kind IN ('original-fiction', 'observed', 'computed', 'inference', 'source-fact')),
  source_hash TEXT,
  original_anchor TEXT NOT NULL,
  original_hash TEXT,
  data_pointer TEXT NOT NULL CHECK (data_pointer = '/data'),
  data_empty INTEGER NOT NULL CHECK (data_empty = 1),
  categories_present INTEGER NOT NULL CHECK (categories_present IN (0, 1)),
  source_hash_present INTEGER NOT NULL CHECK (source_hash_present IN (0, 1)),
  content_count INTEGER NOT NULL CHECK (content_count >= 1),
  category_count INTEGER NOT NULL CHECK (category_count >= 0),
  ref_count INTEGER NOT NULL CHECK (ref_count >= 0),
  history_count INTEGER NOT NULL CHECK (history_count >= 0),
  UNIQUE (corpus_kind, domain, slug)
) STRICT;

CREATE TABLE text_document_locale (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('ko', 'en')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  tense TEXT NOT NULL CHECK (tense IN ('past', 'present')),
  key_ordinal INTEGER NOT NULL CHECK (key_ordinal >= 0),
  PRIMARY KEY (source_id, locale)
) STRICT;

CREATE TABLE text_document_category (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  category TEXT NOT NULL,
  PRIMARY KEY (source_id, ordinal),
  UNIQUE (source_id, category)
) STRICT;

CREATE TABLE text_document_source_ref (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  reference TEXT NOT NULL,
  PRIMARY KEY (source_id, ordinal)
) STRICT;

CREATE TABLE text_document_history (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  entry TEXT NOT NULL,
  PRIMARY KEY (source_id, ordinal)
) STRICT;

CREATE TABLE text_document_node (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  kind TEXT NOT NULL CHECK (kind IN ('heading', 'paragraph', 'table')),
  anchor TEXT NOT NULL,
  depth INTEGER,
  key_order TEXT NOT NULL,
  column_count INTEGER NOT NULL CHECK (column_count >= 0),
  row_count INTEGER NOT NULL CHECK (row_count >= 0),
  public_anchor_count INTEGER NOT NULL CHECK (public_anchor_count = 0),
  PRIMARY KEY (source_id, json_pointer),
  UNIQUE (source_id, ordinal),
  UNIQUE (source_id, anchor),
  CHECK ((kind = 'heading' AND depth BETWEEN 1 AND 6 AND column_count = 0 AND row_count = 0)
    OR (kind = 'paragraph' AND depth IS NULL AND column_count = 0 AND row_count = 0)
    OR (kind = 'table' AND depth IS NULL AND column_count >= 1 AND row_count >= 1))
) STRICT;

CREATE TABLE text_document_table_row (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  node_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  cell_count INTEGER NOT NULL CHECK (cell_count >= 1),
  row_sha256 TEXT NOT NULL CHECK (length(row_sha256) = 64),
  PRIMARY KEY (source_id, json_pointer),
  UNIQUE (source_id, node_pointer, ordinal),
  FOREIGN KEY (source_id, node_pointer) REFERENCES text_document_node(source_id, json_pointer)
) STRICT;

CREATE TABLE text_document_table_cell (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  node_pointer TEXT NOT NULL,
  row_pointer TEXT,
  cell_kind TEXT NOT NULL CHECK (cell_kind IN ('column', 'body')),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  key_order TEXT NOT NULL,
  cell_sha256 TEXT NOT NULL CHECK (length(cell_sha256) = 64),
  PRIMARY KEY (source_id, json_pointer),
  CHECK ((cell_kind = 'column' AND row_pointer IS NULL) OR (cell_kind = 'body' AND row_pointer IS NOT NULL)),
  FOREIGN KEY (source_id, node_pointer) REFERENCES text_document_node(source_id, json_pointer),
  FOREIGN KEY (source_id, row_pointer) REFERENCES text_document_table_row(source_id, json_pointer)
) STRICT;

CREATE TABLE text_document_slot (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  node_pointer TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('ko', 'en')),
  representation TEXT NOT NULL CHECK (representation IN ('string', 'runs')),
  text TEXT NOT NULL,
  run_count INTEGER NOT NULL CHECK (run_count >= 0),
  leaf_key_order TEXT NOT NULL,
  slot_sha256 TEXT NOT NULL CHECK (length(slot_sha256) = 64),
  PRIMARY KEY (source_id, json_pointer),
  FOREIGN KEY (source_id, node_pointer) REFERENCES text_document_node(source_id, json_pointer),
  CHECK ((representation = 'string' AND run_count = 0) OR (representation = 'runs' AND run_count >= 1))
) STRICT;

CREATE TABLE text_document_run (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  slot_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  text TEXT NOT NULL,
  href TEXT,
  key_order TEXT NOT NULL CHECK (key_order IN ('text', 'text,href')),
  run_sha256 TEXT NOT NULL CHECK (length(run_sha256) = 64),
  PRIMARY KEY (source_id, json_pointer),
  UNIQUE (source_id, slot_pointer, ordinal),
  CHECK ((key_order = 'text' AND href IS NULL) OR (key_order = 'text,href' AND href IS NOT NULL AND length(href) > 0)),
  FOREIGN KEY (source_id, slot_pointer) REFERENCES text_document_slot(source_id, json_pointer)
) STRICT;

CREATE TABLE text_document_anchor (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('ko', 'en')),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  node_pointer TEXT NOT NULL,
  anchor TEXT NOT NULL,
  anchor_kind TEXT NOT NULL CHECK (anchor_kind IN ('authored', 'public', 'natural', 'inline')),
  published INTEGER NOT NULL CHECK (published IN (0, 1)),
  PRIMARY KEY (source_id, locale, ordinal),
  FOREIGN KEY (source_id, node_pointer) REFERENCES text_document_node(source_id, json_pointer)
) STRICT;

CREATE TABLE text_document_link (
  source_id INTEGER NOT NULL REFERENCES text_document(source_id),
  json_pointer TEXT NOT NULL,
  corpus_kind TEXT NOT NULL CHECK (corpus_kind = 'historical'),
  locale TEXT NOT NULL CHECK (locale IN ('ko', 'en')),
  resolution TEXT NOT NULL CHECK (resolution = 'external'),
  target_source_id INTEGER,
  target_anchor_ordinal INTEGER,
  PRIMARY KEY (source_id, json_pointer),
  FOREIGN KEY (source_id, json_pointer) REFERENCES text_document_run(source_id, json_pointer),
  CHECK (target_source_id IS NULL AND target_anchor_ordinal IS NULL)
) STRICT;
