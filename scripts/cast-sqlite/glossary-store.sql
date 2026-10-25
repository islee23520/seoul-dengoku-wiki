-- Current authority consists solely of typed, sealed revision rows. The archive is bootstrap evidence.
CREATE TABLE glossary_archive (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  approved_bytes BLOB NOT NULL,
  sha256 TEXT NOT NULL CHECK(length(sha256)=64),
  provenance_label TEXT NOT NULL CHECK(length(trim(provenance_label))>0)
) STRICT;
CREATE TABLE glossary_revision (
  revision_id TEXT PRIMARY KEY,
  parent_revision TEXT REFERENCES glossary_revision(revision_id),
  sequence INTEGER NOT NULL UNIQUE CHECK(sequence>=0),
  actor TEXT NOT NULL CHECK(length(trim(actor))>0),
  reason TEXT NOT NULL CHECK(length(trim(reason))>0),
  created_at TEXT NOT NULL,
  content_sha256 TEXT NOT NULL CHECK(length(content_sha256)=64)
) STRICT;
CREATE TABLE glossary_owner_reference (
  revision_id TEXT NOT NULL REFERENCES glossary_revision(revision_id),
  document_identity TEXT NOT NULL CHECK(length(trim(document_identity))>0),
  provenance_label TEXT NOT NULL CHECK(length(trim(provenance_label))>0),
  PRIMARY KEY(revision_id,document_identity)
) STRICT;
CREATE TABLE glossary_term (
  revision_id TEXT NOT NULL REFERENCES glossary_revision(revision_id),
  term_id TEXT NOT NULL CHECK(length(trim(term_id))>0),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  category TEXT NOT NULL CHECK(category IN ('state','organization','person_category','technology','equipment','geography','event','ailment')),
  status TEXT NOT NULL CHECK(status IN ('fact-public','fiction-original','generic-unregistered')),
  owner_document_identity TEXT NOT NULL,
  PRIMARY KEY(revision_id,term_id),
  UNIQUE(revision_id,ordinal),
  FOREIGN KEY(revision_id,owner_document_identity) REFERENCES glossary_owner_reference(revision_id,document_identity)
) STRICT;
CREATE TABLE glossary_locale (
  revision_id TEXT NOT NULL,
  term_id TEXT NOT NULL,
  locale TEXT NOT NULL CHECK(locale IN ('ko','en')),
  display_name TEXT NOT NULL CHECK(length(trim(display_name))>0),
  reader_definition TEXT NOT NULL CHECK(length(trim(reader_definition))>0),
  PRIMARY KEY(revision_id,term_id,locale),
  FOREIGN KEY(revision_id,term_id) REFERENCES glossary_term(revision_id,term_id)
) STRICT;
CREATE TABLE glossary_alias (
  revision_id TEXT NOT NULL,
  term_id TEXT NOT NULL,
  locale TEXT NOT NULL CHECK(locale IN ('ko','en')),
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  alias TEXT NOT NULL CHECK(length(trim(alias))>0),
  PRIMARY KEY(revision_id,term_id,locale,ordinal),
  FOREIGN KEY(revision_id,term_id,locale) REFERENCES glossary_locale(revision_id,term_id,locale)
) STRICT;
CREATE TABLE glossary_context (
  revision_id TEXT NOT NULL,
  term_id TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK(ordinal>=0),
  context TEXT NOT NULL CHECK(context IN ('all','dialogue','informal')),
  PRIMARY KEY(revision_id,term_id,ordinal),
  FOREIGN KEY(revision_id,term_id) REFERENCES glossary_term(revision_id,term_id)
) STRICT;
CREATE TABLE glossary_revision_seal (revision_id TEXT PRIMARY KEY REFERENCES glossary_revision(revision_id)) STRICT;
CREATE TABLE glossary_head (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  revision_id TEXT NOT NULL REFERENCES glossary_revision_seal(revision_id)
) STRICT;
CREATE TRIGGER glossary_archive_no_update BEFORE UPDATE ON glossary_archive BEGIN SELECT RAISE(ABORT,'immutable glossary archive'); END;
CREATE TRIGGER glossary_archive_no_delete BEFORE DELETE ON glossary_archive BEGIN SELECT RAISE(ABORT,'immutable glossary archive'); END;
