-- Bounded diaspora lineage document only; these rows grant no publication approval.
CREATE TABLE diaspora_lineage_document (
  document_id INTEGER PRIMARY KEY CHECK (document_id = 1),
  source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64),
  schema TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  authorization TEXT NOT NULL,
  collapse_date TEXT NOT NULL,
  opening_year INTEGER NOT NULL,
  age_as_of TEXT NOT NULL,
  generation_interval_years INTEGER NOT NULL,
  source_document TEXT NOT NULL,
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  receipt_sha256 TEXT NOT NULL CHECK (length(receipt_sha256) = 64)
) STRICT;
CREATE TABLE diaspora_lineage_document_lineage (
  ordinal INTEGER PRIMARY KEY CHECK (ordinal >= 0),
  document_id INTEGER NOT NULL REFERENCES diaspora_lineage_document(document_id),
  lineage_key TEXT NOT NULL UNIQUE,
  current_person_id TEXT NOT NULL
) STRICT;
CREATE TABLE diaspora_lineage_member (
  lineage_ordinal INTEGER NOT NULL REFERENCES diaspora_lineage_document_lineage(ordinal),
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  member_key TEXT NOT NULL,
  generation INTEGER NOT NULL,
  has_parent_roles INTEGER NOT NULL CHECK (has_parent_roles IN (0, 1)),
  person_id TEXT,
  name_ko TEXT NOT NULL,
  name_en TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  timeline_bio_ko TEXT NOT NULL,
  timeline_bio_en TEXT NOT NULL,
  narrative_ko TEXT NOT NULL,
  narrative_en TEXT NOT NULL,
  PRIMARY KEY (lineage_ordinal, ordinal),
  UNIQUE (lineage_ordinal, member_key),
  CHECK ((has_parent_roles = 0 AND person_id IS NULL) OR has_parent_roles = 1),
  CHECK (person_id IS NULL OR length(person_id) > 0)
) STRICT;
CREATE TABLE diaspora_lineage_parent_key (
  lineage_ordinal INTEGER NOT NULL,
  member_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  parent_key TEXT NOT NULL,
  PRIMARY KEY (lineage_ordinal, member_ordinal, ordinal),
  UNIQUE (lineage_ordinal, member_ordinal, parent_key),
  FOREIGN KEY (lineage_ordinal, member_ordinal)
    REFERENCES diaspora_lineage_member(lineage_ordinal, ordinal)
) STRICT;
CREATE TABLE diaspora_lineage_parent_role (
  lineage_ordinal INTEGER NOT NULL,
  member_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  parent_key TEXT NOT NULL,
  role TEXT NOT NULL,
  PRIMARY KEY (lineage_ordinal, member_ordinal, ordinal),
  UNIQUE (lineage_ordinal, member_ordinal, parent_key),
  FOREIGN KEY (lineage_ordinal, member_ordinal)
    REFERENCES diaspora_lineage_member(lineage_ordinal, ordinal)
) STRICT;
CREATE TABLE diaspora_lineage_event (
  lineage_ordinal INTEGER NOT NULL,
  member_ordinal INTEGER NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  year INTEGER NOT NULL,
  kind TEXT NOT NULL,
  event_date TEXT,
  PRIMARY KEY (lineage_ordinal, member_ordinal, ordinal),
  FOREIGN KEY (lineage_ordinal, member_ordinal)
    REFERENCES diaspora_lineage_member(lineage_ordinal, ordinal),
  CHECK (event_date IS NULL OR length(event_date) > 0)
) STRICT;
CREATE TABLE diaspora_lineage_key_order (
  object_pointer TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  object_key TEXT NOT NULL,
  PRIMARY KEY (object_pointer, ordinal),
  UNIQUE (object_pointer, object_key)
) STRICT;
