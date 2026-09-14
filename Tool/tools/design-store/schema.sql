-- Relational schema for MDA design documents.
-- Git remains source of truth; this SQLite file is a managed replica.
PRAGMA foreign_keys = ON;
PRAGMA user_version = 2;

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
