-- Relational schema for MDA design documents.
-- Git remains source of truth; this SQLite file is a managed replica.
PRAGMA foreign_keys = ON;
PRAGMA user_version = 3;

CREATE TABLE sections (
  id TEXT PRIMARY KEY,
  sort INTEGER NOT NULL UNIQUE
);

CREATE TABLE aesthetic_kinds (
  kind TEXT PRIMARY KEY
);

CREATE TABLE sources (
  path TEXT PRIMARY KEY
);

CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  one_page_title TEXT NOT NULL,
  audience TEXT NOT NULL,
  picture_note TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT '설계' REFERENCES sections(id),
  source_git TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE one_page_panels (
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL CHECK (seq >= 0),
  heading TEXT NOT NULL,
  body TEXT NOT NULL,
  source_path TEXT NOT NULL REFERENCES sources(path),
  PRIMARY KEY (document_id, seq)
);

CREATE TABLE mechanics (
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL CHECK (seq >= 0),
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  source_path TEXT NOT NULL REFERENCES sources(path),
  PRIMARY KEY (document_id, seq)
);

CREATE TABLE dynamics (
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL CHECK (seq >= 0),
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  source_path TEXT NOT NULL REFERENCES sources(path),
  PRIMARY KEY (document_id, seq)
);

CREATE TABLE aesthetics (
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL CHECK (seq >= 0),
  kind TEXT NOT NULL REFERENCES aesthetic_kinds(kind),
  body TEXT NOT NULL,
  source_path TEXT NOT NULL REFERENCES sources(path),
  PRIMARY KEY (document_id, seq)
);

CREATE INDEX mechanics_by_document ON mechanics (document_id);
CREATE INDEX dynamics_by_document ON dynamics (document_id);
CREATE INDEX aesthetics_by_document ON aesthetics (document_id);
CREATE INDEX panels_by_document ON one_page_panels (document_id);

CREATE TABLE canon_files (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL UNIQUE REFERENCES sources(path),
  title TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  bytes INTEGER NOT NULL CHECK (bytes >= 0)
);

CREATE TABLE canon_headings (
  file_id TEXT NOT NULL REFERENCES canon_files(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL CHECK (seq >= 0),
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 6),
  text TEXT NOT NULL,
  PRIMARY KEY (file_id, seq)
);

CREATE INDEX canon_headings_by_file ON canon_headings (file_id);
